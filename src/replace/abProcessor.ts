/** 基于接口写的扩展处理器的文件 */
import {MarkdownRenderChild, MarkdownRenderer} from 'obsidian';

/** 自动寻找相匹配的ab处理器进行处理
 * ab处理器能根据header和content来转化文本或生成dom元素
 */
export function autoABProcessor(el:HTMLDivElement, header:string, content:string):HTMLElement{
  let prev_result:any = content
  let list_header = header.split("|")
  let prev_type: ProcessDataType = ProcessDataType.text
  prev_result = run_processor(el, list_header, prev_result, prev_type)
  
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

  // iterable function
  function run_processor(el:HTMLDivElement, list_header:string[], prev_result:any, prev_type:ProcessDataType):any{
    // 循环header组，直到遍历完文本处理器或遇到渲染处理器
    for (let item_header of list_header){
      for (let abReplaceProcessor of list_abProcessor){
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
          prev_result = run_processor(el, alias.split("|"), prev_result, prev_type)
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

/** 处理器一览表 - 下拉框推荐 */
export function getProcessorOptions(){
  return list_abProcessor
  .filter(item=>{
    return item.default
  })
  .map(item=>{
    return {id:item.default, name:item.name}
  })
}

/** 处理器一览表 - 全部信息 */
export function generateProcessorInfoTable(el: HTMLElement){
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
  for (let item of list_abProcessor){
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


/** ab处理器 - 严格版，的接口与列表
 */
let list_abProcessor: ABProcessorSpec[] = []
/** ab处理器子接口
 * @warn 暂时不允许扩展，处理器的参数和返回值目前还是使用的手动一个一个来检查的
 */
/** ab处理器接口 - 严格版 */
interface ABProcessorSpec{
  id: string
  name: string
  match: RegExp|string
  default: string|null
  detail: string
  process_alias: string,
  process_param: ProcessDataType|null,
  process_return: ProcessDataType|null,
  process: (el:HTMLDivElement, header:string, content:string)=> any
  is_disable: boolean   // 是否禁用，默认false
  register_from: string // 自带、其他插件、面板设置，如果是其他插件，则需要提供插件的名称（不知道能不能自动识别）
  // 非注册项：
  // ~~is_inner：这个不可设置，用来区分是内部还是外部给的~~
  // is_enable: 加载后能禁用这个项
}
export enum ProcessDataType {
  text= "string",
  el= "HTMLElement"
}

/** ab处理器 - 语法糖版，的接口与注册函数
 * 使用 ab处理器接口 - 语法糖版
 * 不允许直接写严格版的，有些参数不能让用户填
 */
export interface ABProcessorSpecSimp{
  id: string            // 唯一标识（当不填match时也会作为匹配项）
  name: string          // 处理器名字
  match?: RegExp|string // 处理器匹配正则（不填则为id，而不是name！name可以被翻译或是重复的）如果填写了且为正则类型，不会显示在下拉框中
  default?: string|null // 下拉选择的默认规则，不填的话：非正则默认为id，有正则则为空
  detail?: string       // 处理器描述
  // is_render?: boolean   // 是否渲染处理器，默认为true。false则为文本处理器
  process_alias?: string    // 组装，如果不为空串则会覆盖process方法，但扔需要给process一个空实现
  process_param?: ProcessDataType
  process_return?: ProcessDataType
  process: (el:HTMLDivElement, header:string, content:string)=> any
                        // 处理器
}
export function registerABProcessor(sim: ABProcessorSpecSimp){
  //type t_param = Parameters<typeof sim.process>
  //type t_return = ReturnType<typeof sim.process>
  const abProcessorSpec:ABProcessorSpec = {
    id: sim.id,
    name: sim.name,
    match: sim.match??sim.id,
    default: sim.default??(!sim.match||typeof(sim.match)=="string")?sim.id:null,
    detail: sim.detail??"",
    process_alias: sim.process_alias??"",
    process_param: sim.process_param??null,
    process_return: sim.process_return??null,
    process: sim.process,
    is_disable: false,
    register_from: "内置",
  }
  list_abProcessor.push(abProcessorSpec)
}

/** ab处理器 - 用户版，的接口与注册函数
 * 使用 ab处理器接口 - 用户版（都是字符串存储）
 * 特点：不能注册process（无法存储在txt中），只能注册别名
 */
export interface ABProcessorSpecUser{
  id:string
  name:string
  match:string
  process_alias:string
}
export function registerABProcessorUser(sim: ABProcessorSpecUser){
  const abProcessorSpec:ABProcessorSpec = {
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
  list_abProcessor.push(abProcessorSpec)
}
