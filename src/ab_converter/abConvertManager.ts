/** 基于接口写的扩展处理器的文件 */
import {MarkdownRenderChild, MarkdownRenderer} from 'obsidian';
import {
  ProcessDataType, 
  ABProcessorSpec,
  type ABProcessorSpecSimp,
  type ABProcessorSpecUser
} from './converter/abProcessorInterface'
 
/**
  * 处理器的管理器
  * 
  * @default
  * 单例模式 
  * 负责转换器的：注册、寻找、依次使用
  */
export class ABConvertManager {

  /** --------------------------------- 特殊函数 ---------------------------- */

  /// 构造函数，单例模式
  static getInstance(): ABConvertManager {
    if (!ABConvertManager.m_instance) {
      ABConvertManager.m_instance = new ABConvertManager();
    }
    return ABConvertManager.m_instance;
  }

  /// 单例
  private static m_instance: ABConvertManager

  /** --------------------------------- 处理器容器管理 --------------------- */

  /// ab处理器 - 严格版，的接口与列表
  public list_abConvert: ABProcessorSpec[] = []

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
    for (let item of this.list_abConvert){
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

  /** --------------------------------- 处理器的调用 ----------------------- */
  
  /**
   * 自动寻找相匹配的ab处理器进行处理
   * 
   * @detail ab转换器能根据header和content来将有段txt文本转换为html元素
   * 
   * @param el 最后的渲染结果
   * @param header 转换方式
   * @param content 要转换的初始文本
   */
  public static autoABConvert(el:HTMLDivElement, header:string, content:string):HTMLElement{
    let prev_result:any = content
    let list_header = header.split("|")
    let prev_type: ProcessDataType = ProcessDataType.text
    prev_result = this.autoABConvert_runConvert(el, list_header, prev_result, prev_type)
    
    // 尾处理。如果还是text内容，则给一个md渲染器
    if (prev_type == ProcessDataType.text) {
      const subEl = el.createDiv()
      subEl.addClass("markdown-rendered")
      const child = new MarkdownRenderChild(subEl);
      MarkdownRenderer.renderMarkdown(prev_result, subEl, "", child);
      prev_type = ProcessDataType.el
      prev_result = el
    }
    return prev_result
  }

  private static autoABConvert_runConvert(el:HTMLDivElement, list_header:string[], prev_result:any, prev_type:ProcessDataType):any{
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
            if (abReplaceProcessor.process_param==ProcessDataType.el && prev_type==ProcessDataType.text){
              const subEl = el.createDiv()
              subEl.addClass("markdown-rendered")
              const child = new MarkdownRenderChild(subEl);
              MarkdownRenderer.renderMarkdown(prev_result, subEl, "", child);
              prev_type = ProcessDataType.el
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
          if(prev_result instanceof HTMLElement){prev_type = ProcessDataType.el}
          else if(typeof(prev_result) == "string"){prev_type = ProcessDataType.text}
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
