/** 
 * @detail
 * 具体用法和介绍等见 README.md
 * 
 * 依赖顺序
 * 1. ABConvert.ts，转换器的抽象基类
 * 2. ABConvertManager.ts，转换器的容器
 * 3. ……，其他具体的转换器
 * 
 * 跨平台兼容依赖问题
 * - 在Obsidian环境，能够使用document
 * - 在vuepress和mdit环境，他是使用纯文本来解析渲染md而非面向对象，也不依赖document。所以为了兼顾这个，需要额外安装Node.js中能使用的[jsdom](https://github.com/jsdom/jsdom)
 * 
 * jsdom 老install失败。网上搜说：
 * a: jsdom 依赖于 contextify，而 contextify 最近才支持 windows。安装它需要 python 和 C++ 编译器。
 * b: jsdom 使用 contextify 在 DOM 上运行 JavaScript。而 contextify 需要本地 C++ 编译器。根据官方自述，在 Windows 平台上必须安装一堆东西
 * 不过我后来尝试按一个回答中那样指定了版本就可以了：npm install -D jsdom@4.2.0
 */

// AB转换器容器
import {
  ABConvert_IOEnum, 
  type ABConvert_IOType, 
  ABConvert
} from './converter/ABConvert'
import { autoABAlias } from "./ABAlias"
import { ABCSetting } from "./ABReg"
 
/**
  * AB转换器的管理器。注意：使用前必须先执行：`redefine_renderMarkdown`
  * 
  * @default
  * 单例模式 
  * 负责转换器的：注册、寻找、依次使用
  */
export class ABConvertManager {

  /** --------------------------------- 特殊函数 ---------------------------- */

  /// 单例模式
  static getInstance(): ABConvertManager {
    if (!ABConvertManager.m_instance) {
      ABConvertManager.m_instance = new ABConvertManager()
    }
    return ABConvertManager.m_instance;
  }

  /// 单例
  private static m_instance: ABConvertManager

  /// 构造函数
  private constructor() {
    /// 环境打印 (编译期打印)
    // @ts-ignore 用于检查obsidian是否存在，不存在的话正常是飘红的
    if (typeof obsidian == 'undefined' && typeof app == 'undefined') {
      // @ts-ignore
      console.log('[environment]: markdown-it, without obsidian')
    } else {
      console.log('[environment]: obsidian')
    }
  }

  /** --------------------------------- 处理器容器管理 --------------------- */

  /// ab处理器 - 严格版，的接口与列表 (动态)
  public list_abConvert: ABConvert[] = []

  /// 处理器一览表 - 下拉框推荐
  public getConvertOptions(){
    return this.list_abConvert
    .filter(item=>{
      return item.default
    })
    .map(item=>{
      return {id:item.default, name:item.name}
    })
  }

  /** --------------------------------- 通用解耦适配 (动态) ----------------- */

  /**
   * 渲染文本为html
   * @detail 这里需要能够被回调函数替换。从而用于接回软件自身的html渲染机制，来进行解耦
   * @param markdown 原md
   * @param el 要追加到的元素
   * @param ctx Obsidian在这里需要传入 MarkdownRenderChild 类型，但为了跨平台我这里修改成可选的any类型
   */
  public m_renderMarkdownFn:(markdown: string, el: HTMLElement, ctx?: any) => void = (markdown, el) => {
    el.classList.add("markdown-rendered") // 并注意，应当在使用该函数前将el添加该css类，或者重定义时增加该条语句
    console.error("AnyBlockError: 请先制定/重定义md渲染器")
  }

  /// 用回调函数替换重渲染器
  public redefine_renderMarkdown(callback: (markdown: string, el: HTMLElement, ctx?: any) => void) {
    this.m_renderMarkdownFn = callback
  }

  /** --------------------------------- 处理器的调用 ----------------------- */
  
  static startTime: number; // cache
  /**
   * 自动寻找相匹配的ab处理器进行处理
   * 
   * @detail
   *     ab转换器能根据header和content来将有段txt文本转换为html元素
   *     主要分三个过程：
   *     1. 预处理
   *     2. 递归处理
   *     3. 尾处理 (其实尾处理也可以归到预处理那)
   * @param el 最后的渲染结果
   * @param header 转换方式
   * @param content 要转换的初始文本 (无前缀版本，前缀在选择器环节已经删除了)
   * @param selectorName 选择器名，空表示未知
   * @return 等于el，无用，后面可以删了
   */
  public static autoABConvert(el:HTMLDivElement, header:string, content:string, selectorName:string = ""): void{
    let prev_result: ABConvert_IOType = content               // 上次转换后的结果，初始必为string
    let prev_type: string = "string"                          // 上次转换后的结果的类型 (类型检测而来)
    let prev_type2: ABConvert_IOEnum = ABConvert_IOEnum.text  // 上次转换后的结果的类型 (接口声明而来)
    let prev_processor;                                       // 上一次转换的处理器
    let prev = {                                              // 组合在一起是为了引用传参
      prev_result, prev_type, prev_type2, prev_processor
    }

    if (false && ABCSetting.is_debug) ABConvertManager.startTime = performance.now();
    {
      header = autoABAlias(header, selectorName, prev_result as string);
      let list_header = header.split("|")
      prev_result = this.autoABConvert_runConvert(el, list_header, prev)
      this.autoABConvert_last(el, header, selectorName, prev)
    }
    if (false && ABCSetting.is_debug) {
      const endTime = performance.now();
      console.log(`Takes ${(endTime - ABConvertManager.startTime).toFixed(2)} ms when selector "${selectorName}" header "${header}"`);
    }
  }

  /**
   * autoABConvert的递归子函数
   * @param el 
   * @param list_header 
   * @param prev_result 上次转换后的结果
   * @param prev_type   上次转换后的结果的类型 (类型检测而来, typeof类型)
   * @param prev_type2  上次转换后的结果的类型 (接口声明而来, IOEnum类型)
   * @returns           递归转换后的结果
   */
  private static autoABConvert_runConvert(el:HTMLDivElement, list_header:string[], prev:any):any{
    // 循环header组，直到遍历完文本处理器或遇到渲染处理器
    for (let item_header of list_header){ // TODO 因为可能被插入新的“中间自动转换器”，要么for替换成递归，要么都在头部预处理时弄完
      for (let abReplaceProcessor of ABConvertManager.getInstance().list_abConvert){
        // 通过header寻找处理器
        if (typeof(abReplaceProcessor.match)=='string'){if (abReplaceProcessor.match!=item_header) continue}
        else {if (!abReplaceProcessor.match.test(item_header)) continue}
        // TODO 删除旧的别名系统
        // 检查是否有别名。若是，递归
        if(abReplaceProcessor.process_alias){
          // 别名支持引用正则参数
          let alias = abReplaceProcessor.process_alias
          ;(()=>{
            if (abReplaceProcessor.process_alias.indexOf("%")<0) return
            if (typeof(abReplaceProcessor.match)=="string") return
            const matchs = item_header.match(abReplaceProcessor.match)
            if (!matchs) return
            const len = matchs.length
            if (len==1) return
            // replaceAlias
            for (let i=1; i<len; i++){
              if (!matchs[i]) continue
              alias = alias.replace(RegExp(`%${i}`), matchs[i]) /** @bug 按理应该用`(?<!\\)%${i}`，但ob不支持正则的向前查找 */
            }
          })()
          prev.prev_result = this.autoABConvert_runConvert(el, alias.split("|"), prev)
        }
        // 若不是，使用process方法
        else if(abReplaceProcessor.process){
          // (1) 检查输入类型
          if (abReplaceProcessor.process_param != prev.prev_type2){
            // TODO，两个自动处理器，后面要被别名系统替换掉
            if (abReplaceProcessor.process_param==ABConvert_IOEnum.el &&
              prev.prev_type2==ABConvert_IOEnum.text
            ){ // 需要输入html，实际输入md，则插入一个md->html
              const subEl: HTMLDivElement = document.createElement("div"); el.appendChild(subEl);
              ABConvertManager.getInstance().m_renderMarkdownFn(prev.prev_result, subEl);
              prev.prev_result = el
              prev.prev_type = typeof(prev.prev_result)
              prev.prev_type2 = ABConvert_IOEnum.el
              prev.prev_processor = "md"
            }
            else if (abReplaceProcessor.process_param==ABConvert_IOEnum.text &&
              (prev.prev_type2==ABConvert_IOEnum.list_strem || prev.prev_type2==ABConvert_IOEnum.c2list_strem)
            ) { // 需要输入text，实际输入object，则插入一个object->text
              prev.prev_result = JSON.stringify(prev.prev_result, null, 2)
              prev.prev_type = typeof(prev.prev_result)
              prev.prev_type2 = ABConvert_IOEnum.text
              prev.prev_processor = "stream to text"
            }
            else if (abReplaceProcessor.process_param==ABConvert_IOEnum.text &&
              prev.prev_type2==ABConvert_IOEnum.json
            ) {
              prev.prev_type2 = ABConvert_IOEnum.text
              prev.prev_processor = "json to text"
            }
            else{
              console.warn(`处理器输入类型错误, id:${abReplaceProcessor.id}, virtualParam:${abReplaceProcessor.process_param}, realParam:${prev.prev_type2}`);
              break
            }
          }

          // (2) 执行处理器
          prev.prev_result = abReplaceProcessor.process(el, item_header, prev.prev_result)
          prev.prev_type = typeof(prev.prev_result)
          prev.prev_type2 = abReplaceProcessor.process_return as ABConvert_IOEnum
          prev.prev_processor = abReplaceProcessor.process

          // (3) 检查输出类型
          // if(typeof(prev_result) == "string"){prev_type = ABConvert_IOEnum.text}
          // 下行换成了下下行。因为下行在mdit/jsdom环境可能报错：Right-hand side of 'instanceof' is not callable
          //else if (prev_result instanceof HTMLElement){prev_type = ABConvert_IOType.el}
          // else if (typeof(prev_result) == "object"){prev_type = ABConvert_IOEnum.el}
          // else {
          //   console.warn(`处理器输出类型错误, id:${abReplaceProcessor.id}, virtualReturn:${abReplaceProcessor.process_return}, realReturn${prev_type}`);
          //   break
          // }
        }
        else{
          console.warn("处理器必须实现process或process_alias方法")
        }
      }
    }
    return prev
  }

  /**
   * 子函数，后处理/尾处理，主要进行末尾追加指令
   */
  private static autoABConvert_last (el:HTMLDivElement, header:string, selectorName:string, prev:any):any{
    // text内容，则给一个md渲染器
    if (prev.prev_type == "string" && prev.prev_type2 == ABConvert_IOEnum.text) {
      const subEl = document.createElement("div"); el.appendChild(subEl);
      ABConvertManager.getInstance().m_renderMarkdownFn(prev.prev_result as string, subEl);
      prev.prev_result = el; prev.prev_type = "object"; prev.prev_type2 = ABConvert_IOEnum.el; prev.process = "md";
    }
    // json内容/数组内容，则用代码块表示
    else if (prev.prev_type == "string" && prev.prev_type2 == ABConvert_IOEnum.json) {
      const code_str:string = "```json\n" + prev.prev_result + "\n```\n"
      const subEl = document.createElement("div"); el.appendChild(subEl);
      ABConvertManager.getInstance().m_renderMarkdownFn(code_str, subEl);
      prev.prev_result = el; prev.prev_type = "object"; prev.prev_type2 = ABConvert_IOEnum.el; prev.process = "show_json";
    }
    // 数组流，用代码块表示
    else if (prev.prev_type == "object" &&
      (prev.prev_type2 == ABConvert_IOEnum.list_strem || prev.prev_type2 == ABConvert_IOEnum.c2list_strem || prev.prev_type2 == ABConvert_IOEnum.json)
    ) {
      const code_str:string = "```json\n" + JSON.stringify(prev.prev_result, null, 2) + "\n```\n"
      const subEl = document.createElement("div"); el.appendChild(subEl);
      ABConvertManager.getInstance().m_renderMarkdownFn(code_str, subEl);
      prev.prev_result = el; prev.prev_type = "object"; prev.prev_type2 = ABConvert_IOEnum.el; prev.process = "show_listStream";
    }
    else if (prev.prev_type == "object" && prev.prev_type2 == ABConvert_IOEnum.el) {
      return prev
    }
    else {
      console.warn("other type in tail, can not tail processor:", prev.prev_type, prev.prev_type2, prev.prev_result)
    }
    return prev
  }
}
