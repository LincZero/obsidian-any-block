/** 基于接口写的扩展处理器的文件 */
import {MarkdownRenderChild, MarkdownRenderer} from 'obsidian';
import {
  ProcessDataType, 
  type ABProcessorSpec,
  type ABProcessorSpecSimp,
  type ABProcessorSpecUser
} from './abProcessorInterface'

export class ABProcessManager {
  // 单例模式
  static getInstance(): ABProcessManager {
    if (!ABProcessManager.m_instance) {
      ABProcessManager.m_instance = new ABProcessManager();
    }
    return ABProcessManager.m_instance;
  }
  
  /** 自动寻找相匹配的ab处理器进行处理
   * ab处理器能根据header和content来转化文本或生成dom元素
   */
  public autoABProcessor(el:HTMLDivElement, header:string, content:string):HTMLElement{
    let prev_result:any = content
    let list_header = header.split("|")
    let prev_type: ProcessDataType = ProcessDataType.text
    prev_result = this.autoABProcessor_runProcessor(el, list_header, prev_result, prev_type)
    
    // 尾处理。如果还是text内容，则给一个md渲染器
    if (prev_type==ProcessDataType.text) {
      const subEl = el.createDiv()
      subEl.addClass("markdown-rendered")
      const child = new MarkdownRenderChild(subEl);
      MarkdownRenderer.renderMarkdown(prev_result, subEl, "", child);
      prev_type = ProcessDataType.el
      prev_result = el
    }
    return prev_result
  }

  /// 处理器一览表 - 下拉框推荐
  getProcessorOptions(){
    return this.list_abProcessor
    .filter(item=>{
      return item.default
    })
    .map(item=>{
      return {id:item.default, name:item.name}
    })
  }

  /// 处理器一览表 - 全部信息
  generateProcessorInfoTable(el: HTMLElement){
    const table_p = el.createEl("div",{
      cls: ["ab-setting","md-table-fig1"]
    })
    const table = table_p.createEl("table",{
      cls: ["ab-setting","md-table-fig2"]
    })
    {
      const thead = table.createEl("thead")
      const tr = thead.createEl("tr")
      tr.createEl("td", {text: "处理器名"})
      tr.createEl("td", {text: "下拉框默认项"})
      tr.createEl("td", {text: "用途描述"})
      tr.createEl("td", {text: "处理类型"})
      tr.createEl("td", {text: "输出类型"})
      tr.createEl("td", {text: "正则"})
      tr.createEl("td", {text: "别名替换"})
      tr.createEl("td", {text: "是否启用"})
      tr.createEl("td", {text: "定义来源"})
    }
    const tbody = table.createEl("tbody")
    for (let item of this.list_abProcessor){
      const tr = tbody.createEl("tr")
      tr.createEl("td", {text: item.name})
      tr.createEl("td", {text: String(item.default)})
      tr.createEl("td", {text: item.detail, attr:{"style":"max-width:240px;overflow-x:auto"}})
      // tr.createEl("td", {text: item.is_render?"渲染":"文本"})
      tr.createEl("td", {text: String(item.process_param)})
      tr.createEl("td", {text: String(item.process_return)})
      tr.createEl("td", {text: String(item.match)})
      tr.createEl("td", {text: item.process_alias})
      tr.createEl("td", {text: item.is_disable?"禁用":"启用"})
      tr.createEl("td", {text: item.register_from})
    }
    return table_p
  }

  /// 用户注册处理器
  registerABProcessor<TInput extends keyof ProcessDataType, TOutput extends keyof ProcessDataType>(
    process: ABProcessorSpec<TInput, TOutput>| ABProcessorSpecSimp<TInput, TOutput>| ABProcessorSpecUser
  ){
    this.list_abProcessor.push(this.adaptToABProcessorSepc<TInput, TOutput>(process));
  }

  private static m_instance: ABProcessManager // 单例

  /// ab处理器 - 严格版，的接口与列表
  private list_abProcessor: ABProcessorSpec<keyof ProcessDataType, keyof ProcessDataType>[] = []

  /// 适配器
  private adaptToABProcessorSepc<TInput extends keyof ProcessDataType, TOutput extends keyof ProcessDataType>(
    process: ABProcessorSpec<TInput, TOutput>
    | ABProcessorSpecSimp<TInput, TOutput>
    | ABProcessorSpecUser
  ): ABProcessorSpec<TInput, TOutput>{
    if ('is_disable' in process) { // 严格版 存储版
      return process
    }
    else if ('process' in process) { // 用户版 注册版
      return this.adaptToABProcessorSepc_simp<TInput, TOutput>(process)
    }
    else { // 别名版 无代码版
      return this.adaptToABProcessorSepc_user<TInput, TOutput>(process)
    }
  }

  private adaptToABProcessorSepc_simp<TInput extends keyof ProcessDataType, TOutput extends keyof ProcessDataType>(
    sim: ABProcessorSpecSimp<TInput, TOutput>
  ):ABProcessorSpec<TInput, TOutput>{
    //type t_param = Parameters<typeof sim.process>
    //type t_return = ReturnType<typeof sim.process>
    const abProcessorSpec:ABProcessorSpec<TInput, TOutput>= {
      id: sim.id,
      name: sim.name,
      match: sim.match??sim.id,
      default: sim.default??(!sim.match||typeof(sim.match)=="string")?sim.id:null,
      detail: sim.detail??"",
      process_alias: sim.process_alias??"",
      process_param: TInput,
      process_return: TOutput,
      process: sim.process,
      is_disable: false,
      register_from: "内置",
    }
    return abProcessorSpec
  }

  private adaptToABProcessorSepc_user<TInput extends keyof ProcessDataType, TOutput extends keyof ProcessDataType>(
    sim: ABProcessorSpecUser
  ):ABProcessorSpec<TInput, TOutput>{
    const abProcessorSpec:ABProcessorSpec<TInput, TOutput> = {
      id: sim.id,
      name: sim.name,
      match: /^\//.test(sim.match)?RegExp(sim.match):sim.match,
      default: null,
      detail: "",
      process_alias: sim.process_alias,
      process_param: null,
      process_return: null,
      process: ()=>{},
      is_disable: false,
      register_from: "用户",
    }
    return abProcessorSpec
  }

  // iterable function
  private autoABProcessor_runProcessor(el:HTMLDivElement, list_header:string[], prev_result:any, prev_type:ProcessDataType):any{
    // 循环header组，直到遍历完文本处理器或遇到渲染处理器
    for (let item_header of list_header){
      for (let abReplaceProcessor of this.list_abProcessor){
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
          prev_result = this.autoABProcessor_runProcessor(el, alias.split("|"), prev_result, prev_type)
        }
        // 若不是，使用process方法
        else if(abReplaceProcessor.process){
          // 检查输入类型
          if(abReplaceProcessor.process_param != prev_type){
            if (abReplaceProcessor.process_param==ProcessDataType.el && prev_type==ProcessDataType.text){
              const subEl = el.createDiv()
              subEl.addClass("markdown-rendered")
              const child = new MarkdownRenderChild(subEl);
              MarkdownRenderer.renderMarkdown(prev_result, subEl, "", child);
              prev_type = ProcessDataType.el
              prev_result = el
            }
            else{
              console.warn("处理器参数类型错误", abReplaceProcessor.process_param, prev_type);
              break
            }
          }
          // 执行处理器
          prev_result = abReplaceProcessor.process(el, item_header, prev_result)
          // 检查输出类型
          if(prev_result instanceof HTMLElement){prev_type = ProcessDataType.el}
          else if(typeof(prev_result) == "string"){prev_type = ProcessDataType.text}
          else {
            console.warn("处理器输出类型错误", abReplaceProcessor.process_param, prev_type);
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
