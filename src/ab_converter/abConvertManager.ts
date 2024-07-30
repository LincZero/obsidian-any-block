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

// 仅用于提供document对象支持 (如果在Ob中则请注释掉他，用ob自带document对象的)
// import jsdom from "jsdom"
// const { JSDOM } = jsdom;
// const { document } = (new JSDOM(`...`)).window;

// AB转换器容器
import {
  ABConvert_IOType, 
  ABConvert
} from './converter/ABConvert'
 
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
    /// 环境打印
    // @ts-ignore 用于检查obsidian是否存在，不存在的话正常是飘红的
    if (typeof obsidian !== 'undefined') {
      console.log('obsidian环境');
    } else {
      console.log('mdit环境，非obsidian环境');
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

  /// 处理器一览表 - 全部信息
  public generateConvertInfoTable(el: HTMLElement){
    const table_p: HTMLDivElement = document.createElement("div"); el.appendChild(table_p); table_p.classList.add("markdown-rendered", "ab-setting", "md-table-fig1");
    const table: HTMLDivElement = document.createElement("table"); table_p.appendChild(table); table_p.classList.add("ab-setting","md-table-fig2");
    {
      const thead = document.createElement("thread"); table.appendChild(thead);
      const tr = document.createElement("tr"); thead.appendChild(tr);
      let td;
      td = document.createElement("td"); tr.appendChild(td); td.textContent = "处理器名";
      td = document.createElement("td"); tr.appendChild(td); td.textContent = "下拉框默认项";
      td = document.createElement("td"); tr.appendChild(td); td.textContent = "用途描述";
      td = document.createElement("td"); tr.appendChild(td); td.textContent = "处理类型";
      td = document.createElement("td"); tr.appendChild(td); td.textContent = "输出类型";
      td = document.createElement("td"); tr.appendChild(td); td.textContent = "正则";
      td = document.createElement("td"); tr.appendChild(td); td.textContent = "别名替换";
      td = document.createElement("td"); tr.appendChild(td); td.textContent = "是否启用";
      td = document.createElement("td"); tr.appendChild(td); td.textContent = "定义来源";
    }
    const tbody = document.createElement("tbody"); tbody.appendChild(tbody);
    for (let item of this.list_abConvert){
      const tr = document.createElement("tr"); tbody.appendChild(tr)
      let td
      td = document.createElement("td"); tr.appendChild(td); td.textContent = item.name;
      td = document.createElement("td"); tr.appendChild(td); td.textContent = String(item.default);
      td = document.createElement("td"); tr.appendChild(td); td.textContent = item.detail; td.setAttribute("style", "max-width:240px;overflow-x:auto");
      // td = document.createElement("td"); tr.appendChild(td); td.textContent = item.is_render?"渲染":"文本";
      td = document.createElement("td"); tr.appendChild(td); td.textContent = String(item.process_param);
      td = document.createElement("td"); tr.appendChild(td); td.textContent = String(item.process_return);
      td = document.createElement("td"); tr.appendChild(td); td.textContent = String(item.match);
      td = document.createElement("td"); tr.appendChild(td); td.textContent = item.process_alias;
      td = document.createElement("td"); tr.appendChild(td); td.textContent = item.is_disable?"禁用":"启用";
      td = document.createElement("td"); tr.appendChild(td); td.textContent = item.register_from;
    }
    return table_p
  }

  /** --------------------------------- 通用解耦适配 (动态) ----------------- */

  /**
   * 渲染文本为html
   * @detail 这里需要能够被回调函数替换。从而用于接回软件自身的html渲染机制，来进行解耦
   * @param markdown 原md
   * @param el 要追加到的元素
   */
  public m_renderMarkdownFn:(markdown: string, el: HTMLElement) => void = (markdown, el) => {
    console.error("AnyBlockError: 请先制定/重定义md渲染器")
  }

  /// 用回调函数替换重渲染器
  public redefine_renderMarkdown(callback: (markdown: string, el: HTMLElement) => void) {
    this.m_renderMarkdownFn = callback
  }

  /** --------------------------------- 处理器的调用 ----------------------- */
  
  /**
   * 自动寻找相匹配的ab处理器进行处理
   * @detail ab转换器能根据header和content来将有段txt文本转换为html元素
   * @param el 最后的渲染结果
   * @param header 转换方式
   * @param content 要转换的初始文本
   * @return 等于el，无用，后面可以删了
   */
  public static autoABConvert(el:HTMLDivElement, header:string, content:string): void{
    let prev_result:any = content
    let list_header = header.split("|")
    let prev_type: ABConvert_IOType = ABConvert_IOType.text
    prev_result = this.autoABConvert_runConvert(el, list_header, prev_result, prev_type)

    // 尾处理。如果还是text内容，则给一个md渲染器
    if (prev_type == ABConvert_IOType.text) {
      const subEl = document.createElement("div"); el.appendChild(subEl); subEl.classList.add("markdown-rendered");
      ABConvertManager.getInstance().m_renderMarkdownFn(prev_result, subEl);
      prev_type = ABConvert_IOType.el
      prev_result = el
    }
  }

  private static autoABConvert_runConvert(el:HTMLDivElement, list_header:string[], prev_result:any, prev_type:ABConvert_IOType):any{
    // 循环header组，直到遍历完文本处理器或遇到渲染处理器
    for (let item_header of list_header){
      for (let abReplaceProcessor of ABConvertManager.getInstance().list_abConvert){
        // 通过header寻找处理器
        if (typeof(abReplaceProcessor.match)=='string'){if (abReplaceProcessor.match!=item_header) continue}
        else {if (!abReplaceProcessor.match.test(item_header)) continue}
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
          prev_result = this.autoABConvert_runConvert(el, alias.split("|"), prev_result, prev_type)
        }
        // 若不是，使用process方法
        else if(abReplaceProcessor.process){
          // 检查输入类型
          if(abReplaceProcessor.process_param != prev_type){
            if (abReplaceProcessor.process_param==ABConvert_IOType.el && prev_type==ABConvert_IOType.text){
              const subEl: HTMLDivElement = document.createElement("div"); el.appendChild(subEl); subEl.classList.add("markdown-rendered");
              ABConvertManager.getInstance().m_renderMarkdownFn(prev_result, subEl);
              prev_type = ABConvert_IOType.el
              prev_result = el
            }
            else{
              console.warn("处理器参数类型错误", abReplaceProcessor.id, abReplaceProcessor.process_param, prev_type);
              break
            }
          }
          // 执行处理器
          prev_result = abReplaceProcessor.process(el, item_header, prev_result)
          // 检查输出类型
          if(typeof(prev_result) == "string"){prev_type = ABConvert_IOType.text}
          else if (prev_result instanceof HTMLElement){prev_type = ABConvert_IOType.el}
          else {
            console.warn("处理器输出类型错误", abReplaceProcessor.id, abReplaceProcessor.process_param, prev_type);
            break
          }
        }
        else{
          console.warn("处理器必须实现process或process_alias方法")
        }
      }
    }
    return prev_result
  }
}
