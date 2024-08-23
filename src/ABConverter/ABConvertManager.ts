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
import {ABReg} from "./ABReg"
 
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
    let prev_result: ABConvert_IOType = content             // 上次转换后的结果，初始必为string
    let prev_type: ABConvert_IOEnum = ABConvert_IOEnum.text // 上次转换后的结果的类型

    header = this.autoABConvert_first(el, header, selectorName, prev_result as string, prev_type);
    let list_header = header.split("|")
    prev_result = this.autoABConvert_runConvert(el, list_header, prev_result, prev_type)
    this.autoABConvert_last(el, header, selectorName, prev_result, prev_type)
  }

  /**
   * autoABConvert的递归子函数
   * @param el 
   * @param list_header 
   * @param prev_result 上次转换后的结果
   * @param prev_type   上次转换后的结果的类型
   * @returns           递归转换后的结果
   */
  private static autoABConvert_runConvert(el:HTMLDivElement, list_header:string[], prev_result:ABConvert_IOType, prev_type:ABConvert_IOEnum):ABConvert_IOType{
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
          // 允许自动插入一个md->html的转换器
          // TODO，后面要被别名系统替换掉，`html->html` 的输入源是md时，里面插入一个md转换器
          if (abReplaceProcessor.process_param != prev_type){
            if (abReplaceProcessor.process_param==ABConvert_IOEnum.el && typeof(prev_result) == "string" && prev_type==ABConvert_IOEnum.text){
              const subEl: HTMLDivElement = document.createElement("div"); el.appendChild(subEl); subEl.classList.add("markdown-rendered");
              ABConvertManager.getInstance().m_renderMarkdownFn(prev_result, subEl);
              prev_type = ABConvert_IOEnum.el
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
          if(typeof(prev_result) == "string"){prev_type = ABConvert_IOEnum.text}
          // 下行换成了下下行。因为下行在mdit/jsdom环境可能报错：Right-hand side of 'instanceof' is not callable
          //else if (prev_result instanceof HTMLElement){prev_type = ABConvert_IOType.el}
          else if (typeof(prev_result) == "object"){prev_type = ABConvert_IOEnum.el}
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
  
  /**
   * 子函数，预处理，主要进行自然语言转指令
   * 
   * @detail
   * 将自然语言指令头，转化为指令头
   * 
   * 是否绑定到处理器？旧版本通过alias选项设置，但V3版本不要
   * 
   * - 优点
   *   - 而是作为一个单独的模块，与实际解耦
   *   - 符合原则：关于用于语法糖操作，都应存在一个单独的语法糖模块进行处理，而不应与业务代码耦合
   * - 缺点
   *   - 新的处理器声明自然语言触发的语法糖。但是可以通过同时增加 “新的处理器” + “新的自然语言替换” 来解决
   * 
   * TODO：
   * - 这些别名系统，需要能够显示出来，应该要用json括一下
   * - 性能优化，如果匹配了再replace，且提前退出
   * - 仅匹配开头会不会性能好点
   * 
   * @returns
   * new header
   */
  private static autoABConvert_first (el:HTMLDivElement, header:string, selectorName:string, content:string, prev_type: ABConvert_IOEnum = ABConvert_IOEnum.text): string{
    // 分词。方便仅使用正则而不用splic("|")就能判断识别的是完整的词而不是一部分
    if (!header.trimEnd().endsWith("|")) header = header + "|"
    if (!header.trimStart().startsWith("|")) header = "|" + header

    // 首尾
    if (selectorName == "headtail") { // `:::`不在正文里，这个判断不到：if (ABReg.reg_mdit_head_noprefix.test(content.trimStart()))
      header = "|::: 140lne" + header.trimStart()
      // callout/alert
      header = header.replace(/^\|::: 140lne\|info\|/, "|add([!info])|quote|");
      header = header.replace(/^\|::: 140lne\|note\|/, "|add([!note])|quote|");
      header = header.replace(/^\|::: 140lne\|warn\|/, "|add([!warning])|quote|");
      header = header.replace(/^\|::: 140lne\|warning\|/, "|add([!warning])|quote|");
      header = header.replace(/^\|::: 140lne\|error\|/, "|add([!error])|quote|");
      // mdit-container migration
      header = header.replace(/^\|::: 140lne\|tab\|/, "|mditTabs|");
      header = header.replace(/^\|::: 140lne\|tabs\|/, "|mditTabs|");
      header = header.replace(/^\|::: 140lne\|标签\|/, "|mditTabs|");
      header = header.replace(/^\|::: 140lne\|标签页\|/, "|mditTabs|");
      header = header.replace(/^\|::: 140lne\|demo\|/, "|mditDemo|");
      header = header.replace(/^\|::: 140lne\|abDemo\|/, "|mditABDemo|");
      header = header.replace(/^\|::: 140lne\|col\|/, "|mditCol|");
      header = header.replace(/^\|::: 140lne\|分栏\|/, "|mditCol|");
      header = header.replace(/^\|::: 140lne\|card\|/, "|mditCard|");
      header = header.replace(/^\|::: 140lne\|卡片\|/, "|mditCard|");
      header = header.replace(/^\|::: 140lne/, "");
    }

    // 列表/标题块
    else if (selectorName == "list" || ABReg.reg_list_noprefix.test(content.trimStart())
      || selectorName == "title" || ABReg.reg_heading_noprefix.test(content.trimStart())
    ) {
      if (selectorName == "title" || ABReg.reg_heading_noprefix.test(content.trimStart())) {
        header = "|title 140lne" + header
        header = header.replace(/^\|title 140lne\|timeline\|/, "|title2timeline|");
        header = header.replace(/^\|title 140lne\|时间线\|/, "|title2timeline|");
        header = header.replace(/^\|title 140lne\|tab\|/, "|title2tab|");
        header = header.replace(/^\|title 140lne\|tabs\|/, "|title2tab|");
        header = header.replace(/^\|title 140lne\|标签\|/, "|title2tab|");
        header = header.replace(/^\|title 140lne\|标签页\|/, "|title2tab|");
        header = header.replace(/^\|title 140lne\|col\|/, "|title2col|");
        header = header.replace(/^\|title 140lne\|分栏\|/, "|title2col|");
        header = header.replace(/^\|title 140lne\|card\|/, "|title2card|");
        header = header.replace(/^\|title 140lne\|卡片\|/, "|title2card|");
        header = header.replace(/^\|title 140lne/, "");
      }
      const old_list_header = header

      header = "|list 140lne" + header // 用于标识，仅头部可以被转化，不允许二次转化

      // 多叉多层树
      header = header.replace(/^\|list 140lne\|flow\|/, "|list2mermaid|");
      header = header.replace(/^\|list 140lne\|流程图\|/, "|list2mermaid|");
      header = header.replace(/^\|list 140lne\|mindmap\|/, "|list2pumlMindmap|");
      header = header.replace(/^\|list 140lne\|思维导图\|/, "|list2pumlMindmap|");
      header = header.replace(/^\|list 140lne\|脑图\|/, "|list2pumlMindmap|");
      header = header.replace(/^\|list 140lne\|mdMindmap\|/, "|list2markmap|");
      header = header.replace(/^\|list 140lne\|md思维导图\|/, "|list2markmap|");
      header = header.replace(/^\|list 140lne\|md脑图\|/, "|list2markmap|");
      header = header.replace(/^\|list 140lne\|wbs\|/, "|list2pumlWBS|");
      header = header.replace(/^\|list 140lne\|工作分解图\|/, "|list2pumlWBS|");
      header = header.replace(/^\|list 140lne\|工作分解结构\|/, "|list2pumlWBS|");
      header = header.replace(/^\|list 140lne\|分解图\|/, "|list2pumlWBS|");
      header = header.replace(/^\|list 140lne\|分解结构\|/, "|list2pumlWBS|");
      header = header.replace(/^\|list 140lne\|table\|/, "|list2table|");
      header = header.replace(/^\|list 140lne\|multiWayTable\|/, "|list2table|");
      header = header.replace(/^\|list 140lne\|multiCrossTable\|/, "|list2table|");
      header = header.replace(/^\|list 140lne\|crossTable\|/, "|list2table|");
      header = header.replace(/^\|list 140lne\|表格\|/, "|list2table|");
      header = header.replace(/^\|list 140lne\|多叉表格\|/, "|list2table|");
      header = header.replace(/^\|list 140lne\|多叉表\|/, "|list2table|");
      header = header.replace(/^\|list 140lne\|跨行表格\|/, "|list2table|");
      header = header.replace(/^\|list 140lne\|跨行表\|/, "|list2table|");

      // 先二层再多层树
      header = header.replace(/^\|list 140lne\|listTable\|/, "|list2lt|");
      header = header.replace(/^\|list 140lne\|treeTable\|/, "|list2lt|");
      header = header.replace(/^\|list 140lne\|listGrid\|/, "|list2lt|");
      header = header.replace(/^\|list 140lne\|treeGrid\|/, "|list2lt|");
      header = header.replace(/^\|list 140lne\|列表格\|/, "|list2lt|");
      header = header.replace(/^\|list 140lne\|树形表\|/, "|list2lt|");
      header = header.replace(/^\|list 140lne\|树形表格\|/, "|list2lt|");
      header = header.replace(/^\|list 140lne\|list\|/, "|list2lt|addClass(ab-listtable-likelist)|");
      header = header.replace(/^\|list 140lne\|列表\|/, "|list2lt|addClass(ab-listtable-likelist)|");
      header = header.replace(/^\|list 140lne\|dirTree\|/, "|list2dt|");
      header = header.replace(/^\|list 140lne\|dir\|/, "|list2dt|");
      header = header.replace(/^\|list 140lne\|目录\|/, "|list2dt|");
      header = header.replace(/^\|list 140lne\|目录树\|/, "|list2dt|");
      header = header.replace(/^\|list 140lne\|目录结构\|/, "|list2dt|");
      
      // 二层树
      header = header.replace(/^\|list 140lne\|fakeList\|/, "|list2table|addClass(ab-table-fc)|addClass(ab-table-likelist)|");
      header = header.replace(/^\|list 140lne\|仿列表\|/, "|list2table|addClass(ab-table-fc)|addClass(ab-table-likelist)|");

      header = header.replace(/^\|list 140lne\|timeline\|/, "|list2timeline|");
      header = header.replace(/^\|list 140lne\|时间线\|/, "|list2timeline|");
      header = header.replace(/^\|list 140lne\|tab\|/, "|list2tab|");
      header = header.replace(/^\|list 140lne\|tabs\|/, "|list2tab|");
      header = header.replace(/^\|list 140lne\|标签\|/, "|list2tab|");
      header = header.replace(/^\|list 140lne\|标签页\|/, "|list2tab|");
      header = header.replace(/^\|list 140lne\|col\|/, "|list2col|");
      header = header.replace(/^\|list 140lne\|分栏\|/, "|list2col|");
      header = header.replace(/^\|list 140lne\|card\|/, "|list2card|");
      header = header.replace(/^\|list 140lne\|卡片\|/, "|list2card|");

      header = header.replace(/^\|list 140lne/, "");

      if (old_list_header!=header) { // 中间转化成功过
        if (selectorName == "title" || ABReg.reg_heading_noprefix.test(content.trimStart())) {
          header = "|title2list" + header
        }
      }
    }

    // 代码块
    else if (selectorName == "code" || ABReg.reg_code_noprefix.test(content.trimStart())) {
      header = "|code 140lne" + header
      header = header.replace(/\|code 140lne\|X\|/, "|Xcode|");
      header = header.replace(/\|code 140lne/, "");
    }

    // 引用块
    else if (selectorName == "quote" || ABReg.reg_quote_noprefix.test(content.trimStart())) {
      header = "|quote 140lne" + header
      header = header.replace(/quote 140lne|X\|/, "|Xquote|");
      header = header.replace(/qutoe 140lne/, "");
    }

    // 通用，一般是装饰处理器
    {
      header = "|general 140lne" + header
      header = header.replace(/\|黑幕\|/, "|add_class(ab-deco-heimu)|"); 
      header = header.replace(/\|折叠\|/, "|fold|");
      header = header.replace(/\|滚动\|/, "|scroll|");
      header = header.replace(/\|超出折叠\|/, "|overfold|");
      // 便捷样式
      header = header.replace(/\|红字\|/, "|addClass(ab-custom-text-red)|");
      header = header.replace(/\|橙字\|/, "|addClass(ab-custom-text-orange)|");
      header = header.replace(/\|黄字\|/, "|addClass(ab-custom-text-yellow)|");
      header = header.replace(/\|绿字\|/, "|addClass(ab-custom-text-green)|");
      header = header.replace(/\|青字\|/, "|addClass(ab-custom-text-cyan)|");
      header = header.replace(/\|蓝字\|/, "|addClass(ab-custom-text-blue)|");
      header = header.replace(/\|紫字\|/, "|addClass(ab-custom-text-purple)|");
      header = header.replace(/\|白字\|/, "|addClass(ab-custom-text-white)|");
      header = header.replace(/\|黑字\|/, "|addClass(ab-custom-text-black)|");
      header = header.replace(/\|红底\|/, "|addClass(ab-custom-bg-red)|");
      header = header.replace(/\|橙底\|/, "|addClass(ab-custom-bg-orange)|");
      header = header.replace(/\|黄底\|/, "|addClass(ab-custom-bg-yellow)|");
      header = header.replace(/\|绿底\|/, "|addClass(ab-custom-bg-green)|");
      header = header.replace(/\|青底\|/, "|addClass(ab-custom-bg-cyan)|");
      header = header.replace(/\|蓝底\|/, "|addClass(ab-custom-bg-blue)|");
      header = header.replace(/\|紫底\|/, "|addClass(ab-custom-bg-purple)|");
      header = header.replace(/\|白底\|/, "|addClass(ab-custom-bg-white)|");
      header = header.replace(/\|黑底\|/, "|addClass(ab-custom-bg-black)|");
      header = header.replace(/\|靠上\|/, "|addClass(ab-custom-dire-top)|");
      header = header.replace(/\|靠下\|/, "|addClass(ab-custom-dire-down)|");
      header = header.replace(/\|靠左\|/, "|addClass(ab-custom-dire-left)|");
      header = header.replace(/\|靠右\|/, "|addClass(ab-custom-dire-right)|");
      header = header.replace(/\|居中\|/, "|addClass(ab-custom-dire-center)|");
      header = header.replace(/\|水平居中\|/, "|addClass(ab-custom-dire-hcenter)|");
      header = header.replace(/\|垂直居中\|/, "|addClass(ab-custom-dire-vcenter)|");
      header = header.replace(/\|两端对齐\|/, "|addClass(ab-custom-dire-justify)|");
      header = header.replace(/\|大字\|/, "|addClass(ab-custom-font-large)|");
      header = header.replace(/\|超大字\|/, "|addClass(ab-custom-font-largex)|");
      header = header.replace(/\|超超大字\|/, "|addClass(ab-custom-font-largexx)|");
      header = header.replace(/\|小字\|/, "|addClass(ab-custom-font-small)|");
      header = header.replace(/\|超小字\|/, "|addClass(ab-custom-font-smallx)|");
      header = header.replace(/\|超超小字\|/, "|addClass(ab-custom-font-smallxx)|");
      header = header.replace(/\|加粗\|/, "|addClass(ab-custom-font-bold)|");
      header = header.replace(/\|general 140lne/, "");
    }
    return header
  }

  /**
   * 子函数，后处理/尾处理，主要进行末尾追加指令
   */
  private static autoABConvert_last (el:HTMLDivElement, header:string, selectorName:string, prev_result: ABConvert_IOType, prev_type: ABConvert_IOEnum){
    // text内容，则给一个md渲染器
    if (typeof(prev_result) == "string" && prev_type == ABConvert_IOEnum.text) {
      const subEl = document.createElement("div"); el.appendChild(subEl); subEl.classList.add("markdown-rendered");
      ABConvertManager.getInstance().m_renderMarkdownFn(prev_result, subEl);
      prev_type = ABConvert_IOEnum.el
      prev_result = el
    }
    // json内容/数组内容，则用代码块表示
    else if (typeof(prev_result) == "string" && prev_type == ABConvert_IOEnum.json) {
      const code_str:string = "```json\n" + prev_result + "\n```\n"
      const subEl = document.createElement("div"); el.appendChild(subEl); subEl.classList.add("markdown-rendered");
      ABConvertManager.getInstance().m_renderMarkdownFn(code_str, subEl);
      prev_type = ABConvert_IOEnum.el
      prev_result = el
    }
  }
}
