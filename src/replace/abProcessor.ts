/** 基于接口写的扩展处理器的文件
 * 
 */

import {MarkdownRenderChild, MarkdownRenderer} from 'obsidian';
import {ABReg} from "src/config/abReg"
import ListProcess from "./listProcess"
import {getID} from "src/utils/utils"
import Component from "../svelte/Component.svelte"

import mermaid from "mermaid"
import mindmap from '@mermaid-js/mermaid-mindmap';
const initialize = mermaid.registerExternalDiagrams([mindmap]);
export const mermaid_init = async () => {
  await initialize;
};

/** 自动寻找相匹配的ab处理器进行处理
 * ab处理器能根据header和content来转化文本或生成dom元素
 */
export function autoABProcessor(el:HTMLDivElement, header:string, content:string):HTMLElement{
  // 用新变量代替 header 和 content
  const list_header = header.split("|")
  let result:HTMLElement|string = content
  // 循环header组，直到遍历完文本处理器或遇到渲染处理器
  for (let item_header of list_header){
    if (typeof(result)!="string") break
    const str_result:string = result
    for (let abReplaceProcessor of list_abProcessor){
      // 如果不匹配则跳过
      if (typeof(abReplaceProcessor.match)=='string'){if (abReplaceProcessor.match!=item_header) continue}
      else {if (!abReplaceProcessor.match.test(item_header)) continue}
      result = abReplaceProcessor.process(el, item_header, str_result)
    }
  }
  // 如果header组里没用渲染处理器，那么给一个md处理器
  if (typeof(result)=="string") {
    const child = new MarkdownRenderChild(el);
    MarkdownRenderer.renderMarkdown(result, el, "", child);
    result = el
  }
  return result
}

/** 获取id-name对，以创建下拉框
 * 注意如果有正则的话，不能给
 */
export function getProcessorOptions(){
  return list_abProcessor
  .filter(item=>{
    return item.default
  })
  .map(item=>{
    return {id:item.default, name:item.name}
  })
}

/** */
export function generateInfoTable(el: HTMLElement){
  const table_p = el.createEl("div",{
    cls: ["ab-setting","md-table-fig"],
    attr: {"style": "overflow-x:scroll; transform:scaleY(-1)"}
  })
  const table = table_p.createEl("table",{
    cls: ["ab-setting","setting-table"],
    attr: {"style": "overflow-x:scroll; transform:scaleY(-1); white-space: nowrap"}
  })
  {
    const thead = table.createEl("thead")
    const tr = thead.createEl("tr")
    tr.createEl("td", {text: "处理器名"})
    tr.createEl("td", {text: "下拉框默认项"})
    tr.createEl("td", {text: "用途描述"})
    tr.createEl("td", {text: "处理器类型"})
    tr.createEl("td", {text: "是否启用"})
    tr.createEl("td", {text: "正则"})
  }
  const tbody = table.createEl("tbody")
  for (let item of list_abProcessor){
    const tr = tbody.createEl("tr")
    tr.createEl("td", {text: item.name})
    tr.createEl("td", {text: String(item.default)})
    tr.createEl("td", {text: item.detail, attr:{"style":"max-width:240px;overflow-x:auto"}})
    tr.createEl("td", {text: item.is_render?"渲染":"文本"})
    tr.createEl("td", {text: item.is_disable?"禁用":"启用"})
    tr.createEl("td", {text: String(item.match)})
  }
}

/** 注册ab处理器。
 * 不允许直接写严格版的，有些参数不能让用户填
 */
function registerABProcessor(sim: ABProcessorSpecSimp){
  const abProcessorSpec:ABProcessorSpec = {
    id: sim.id,
    name: sim.name,
    match: sim.match??sim.id,
    default: sim.default??(!sim.match||typeof(sim.match)=="string")?sim.id:null,
    detail: sim.detail??"",
    is_render: sim.is_render??true,
    process: sim.process,
    is_disable: false
  }
  list_abProcessor.push(abProcessorSpec)
}
/** ab处理器列表 */
let list_abProcessor: ABProcessorSpec[] = []
/** ab处理器接口 - 语法糖版 */
interface ABProcessorSpecSimp{
  id: string            // 唯一标识（当不填match时也会作为匹配项）
  name: string          // 处理器名字
  match?: RegExp|string // 处理器匹配正则（不填则为id，而不是name！name可以被翻译或是重复的）如果填写了且为正则类型，不会显示在下拉框中
  default?: string|null // 下拉选择的默认规则，不填的话：非正则默认为id，有正则则为空
  detail?: string       // 处理器描述
  is_render?: boolean   // 是否渲染处理器，默认为true。false则为文本处理器
  process: (el:HTMLDivElement, header:string, content:string)=> HTMLElement|string
                        // 处理器
}
/** ab处理器接口 - 严格版 */
interface ABProcessorSpec{
  id: string
  name: string
  match: RegExp|string
  default: string|null
  detail: string
  is_render: boolean
  process: (el:HTMLDivElement, header:string, content:string)=> HTMLElement|string
  is_disable: boolean   // 是否禁用，默认false
  // 非注册项：
  // ~~is_inner：这个不可设置，用来区分是内部还是外部给的~~
  // from: 自带、其他插件、面板设置，如果是其他插件，则需要提供插件的名称（不知道能不能自动识别）
  // is_enable: 加载后能禁用这个项
}

registerABProcessor({
  id: "svelte",
  name: "svelte(实验)",
  process: (el, header, content)=>{
    new Component({
      target: el,
      props: {
        variable: 1
      }
    });
    return el
  }
})

registerABProcessor({
  id: "md",
  name: "md",
  process: (el, header, content)=>{
    const child = new MarkdownRenderChild(el);
    // ctx.addChild(child);
    MarkdownRenderer.renderMarkdown(content, el, "", child);
    return el
  }
})

registerABProcessor({
  id: "hide",
  name: "默认折叠",
  process: (el, header, content)=>{
    const child = new MarkdownRenderChild(el);
    content = text_quote("[!note]-\n"+content)
    MarkdownRenderer.renderMarkdown(content, el, "", child);
    return el
  }
})

// 可折叠（借callout）
registerABProcessor({
  id: "flod",
  name: "可折叠的",
  process: (el, header, content)=>{
    const child = new MarkdownRenderChild(el);
    content = text_quote("[!note]+\n"+content)
    MarkdownRenderer.renderMarkdown(content, el, "", child);
    return el
  }
})

registerABProcessor({
  id: "quote",
  name: "增加引用块",
  is_render: false,
  process: (el, header, content)=>{
    return text_quote(content)
  }
})

registerABProcessor({
  id: "code",
  name: "增加代码块",
  match: /^code(\((.*)\))?$/,
  default: "code()",
  detail: "不加`()`表示用原文本的第一行作为代码类型，括号类型为空表示代码类型为空",
  is_render: false,
  process: (el, header, content)=>{
    let matchs = header.match(/^code(\((.*)\))?$/)
    if (!matchs) return content
    if (matchs[1]) content = matchs[2]+"\n"+content
    return text_code(content)
  }
})

registerABProcessor({
  id: "Xquote",
  name: "去除引用块",
  is_render: false,
  process: (el, header, content)=>{
    return text_Xquote(content)
  }
})

registerABProcessor({
  id: "Xcode",
  name: "去除代码块",
  match: /^Xcode(\((true|false)\))?$/,
  default: "Xcode(true)",
  detail: "参数为是否移除代码类型，默认为false。记法：code|Xcode或code()|Xcode(true)内容不变",
  is_render: false,
  process: (el, header, content)=>{
    let matchs = header.match(/^Xcode(\((true|false)\))?$/)
    if (!matchs) return content
    let remove_flag:boolean
    if (matchs[1]=="") remove_flag=false
    else remove_flag= (matchs[2]=="true")
    return text_Xcode(content, remove_flag)
  }
})

registerABProcessor({
  id: "X",
  name: "去除代码或引用块",
  is_render: false,
  process: (el, header, content)=>{
    return text_X(content)
  }
})

registerABProcessor({
  id: "code2quote",
  name: "代码转引用块",
  is_render: false,
  process: (el, header, content)=>{
    content = text_Xcode(content)
    content = text_quote(content)
    return content
  }
})

registerABProcessor({
  id: "quote2code",
  name: "引用转代码块",
  match: /^quote2code(\((.*)\))?$/,
  default: "quote2code()",
  is_render: false,
  process: (el, header, content)=>{
    let matchs = header.match(/^quote2code(\((.*)\))?$/)
    if (!matchs) return content

    content = text_Xquote(content)
    if (matchs[1]) content = matchs[2]+"\n"+content
    content = text_code(content)
    return content
  }
})

registerABProcessor({
  id: "slice",
  name: "切片",
  match: /^slice\((\s*\d+\s*)(,\s*-?\d+\s*)?\)$/,
  detail: "和js的slice方法是一样的",
  is_render: false,
  process: (el, header, content)=>{
    // slice好像不怕溢出或交错，会自动变空数组。就很省心，不用判断太多的东西
    const list_match = header.match(/^slice\((\s*\d+\s*)(,\s*-?\d+\s*)?\)$/)
    if (!list_match) return content
    const arg1 = Number(list_match[1].trim())
    if (isNaN(arg1)) return content
    const arg2 = Number(list_match[2].replace(",","").trim())
    // 单参数
    if (isNaN(arg2)) {
      return content.split("\n").slice(arg1).join("\n")
    }
    // 双参数
    else {
      return content.split("\n").slice(arg1, arg2).join("\n")
    }
  }
})

registerABProcessor({
  id: "title2list",
  name: "标题到列表",
  is_render: false,
  detail: "也可以当作是更强大的列表解析器",
  process: (el, header, content)=>{
    content = ListProcess.title2list(content, el)
    return content
  }
})

registerABProcessor({
  id: "title2table",
  name: "标题到表格",
  process: (el, header, content)=>{
    content = ListProcess.title2list(content, el)
    ListProcess.list2table(content, el)
    return el
  }
})

registerABProcessor({
  id: "title2mindmap",
  name: "标题到脑图",
  process: (el, header, content)=>{
    content = ListProcess.title2list(content, el)
    ListProcess.list2mindmap(content, el)
    return el
  }
})

registerABProcessor({
  id: "listroot",
  name: "增加列表根",
  match: /^listroot\((.*)\)$/,
  default: "listroot(root)",
  is_render: false,
  process: (el, header, content)=>{
    const list_match = header.match(/^listroot\((.*)\)$/)
    if (!list_match) return content
    const arg1 = list_match[1].trim()
    content = content.split("\n").map(line=>{return "  "+line}).join("\n")
    content = "- "+arg1+"\n"+content
    return content
  }
})

registerABProcessor({
  id: "listXinline",
  name: "列表消除内联换行",
  is_render: false,
  process: (el, header, content)=>{
    return ListProcess.listXinline(content)
  }
})

registerABProcessor({
  id: "list2table",
  name: "列表转表格",
  match: /list2(md)?table(T)?/,
  default: "list2table",
  process: (el, header, content)=>{
    const matchs = header.match(/list2(md)?table(T)?/)
    if (!matchs) return el
    ListProcess.list2table(content, el, matchs[1]=="md", matchs[2]=="T")
    return el
  }
})

registerABProcessor({
  id: "list2lt",
  name: "列表转列表表格",
  match: /list2(md)?lt(T)?/,
  default: "list2lt",
  process: (el, header, content)=>{
    const matchs = header.match(/list2(md)?lt(T)?/)
    if (!matchs) return el
    ListProcess.list2lt(content, el, matchs[1]=="md", matchs[2]=="T")
    return el
  }
})

registerABProcessor({
  id: "list2ut",
  name: "列表转二维表格",
  match: /list2(md)?ut(T)?/,
  default: "list2ut",
  process: (el, header, content)=>{
    const matchs = header.match(/list2(md)?ut(T)?/)
    if (!matchs) return el
    ListProcess.list2ut(content, el, matchs[1]=="md", matchs[2]=="T")
    return el
  }
})

registerABProcessor({
  id: "list2timeline",
  name: "一级列表转时间线",
  match: /list2(md)?timeline(T)?/,
  default: "list2mdtimeline",
  process: (el, header, content)=>{
    const matchs = header.match(/list2(md)?timeline(T)?/)
    if (!matchs) return el
    ListProcess.list2timeline(content, el, matchs[1]=="md", matchs[2]=="T")
    return el
  }
})

registerABProcessor({
  id: "list2tab",
  name: "一级列表转标签栏",
  match: /list2(md)?tab(T)?$/,
  default: "list2mdtab",
  process: (el, header, content)=>{
    const matchs = header.match(/list2(md)?tab(T)?$/)
    if (!matchs) return el
    ListProcess.list2tab(content, el, matchs[1]=="md", matchs[2]=="T")
    return el
  }
})

registerABProcessor({
  id: "list2mermaid",
  name: "列表转mermaid流程图",
  process: (el, header, content)=>{
    ListProcess.list2mermaid(content, el)
    return el
  }
})

registerABProcessor({
  id: "list2mindmap",
  name: "列表转mermaid思维导图",
  process: (el, header, content)=>{
    ListProcess.list2mindmap(content, el)
    return el
  }
})

registerABProcessor({
  id: "callout",
  name: "callout语法糖",
  match: /^\!/,
  default: "!note",
  detail: "需要obsidian 0.14版本以上来支持callout语法",
  process: (el, header, content)=>{
    const child = new MarkdownRenderChild(el);
    const text = "```ad-"+header.slice(1)+"\n"+content+"\n```"
    MarkdownRenderer.renderMarkdown(text, el, "", child);
    return el
  }
})

registerABProcessor({
  id: "mermaid",
  name: "新mermaid",
  match: /^mermaid(\((.*)\))?$/,
  default: "mermaid(graph TB)",
  detail: "由于需要兼容脑图，这里会使用插件内置的最新版mermaid",
  process: (el, header, content)=>{
    let matchs = content.match(/^mermaid(\((.*)\))?$/)
    if (!matchs) return el
    if (matchs[1]) content = matchs[2]+"\n"+content

    ;(async (el:HTMLDivElement, header:string, content:string)=>{
      await mermaid_init()
      await mermaid.mermaidAPI.renderAsync("ab-mermaid-"+getID(), content, (svgCode: string)=>{
        el.innerHTML = svgCode
      });
    })(el, header, content)
    return el
  }
})

registerABProcessor({
  id: "text",
  name: "纯文本",
  detail: "其实一般会更推荐用code()代替，那个更精确",
  process: (el, header, content)=>{
    el.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
    // 文本元素。pre不好用，这里还是得用<br>换行最好
    // `<p>${content.split("\n").map(line=>{return "<span>"+line+"</span>"}).join("<br/>")}</p>`
    el.innerHTML = `<p>${content.replace(/ /g, "&nbsp;").split("\n").join("<br/>")}</p>`
    return el
  }
})

/** 5个文本处理脚本 */

function text_X(content:string): string{
  let flag = ""
  for (let line of content.split("\n")){
    if (ABReg.reg_code.test(line)) {flag="code";break}
    else if (ABReg.reg_quote.test(line)) {flag="quote";break}
  }
  if (flag=="code") return text_Xcode(content)
  else if (flag=="quote") return text_Xquote(content)
  return content
}

function text_quote(content:string): string{
  return content.split("\n").map((line)=>{return "> "+line}).join("\n")
}

function text_Xquote(content:string): string{
  return content.split("\n").map(line=>{
    return line.replace(/^>\s/, "")
  }).join("\n")
}

function text_code(content:string): string{
  return "```"+content+"\n```"
}

// @param remove_flag：是否去除code的类型，默认为true
function text_Xcode(content:string, remove_flag=true): string{
  let list_content = content.split("\n")
  let code_flag = ""
  let line_start = -1
  let line_end = -1
  for (let i=0; i<list_content.length; i++){
    if (code_flag==""){     // 寻找开始标志
      const match_tmp = list_content[i].match(ABReg.reg_code)
      if(match_tmp){
        code_flag = match_tmp[1]
        line_start = i
      }
    }
    else {                  // 寻找结束标志
      if(list_content[i].indexOf(code_flag)>=0){
        line_end = i
        break
      }
    }
  }
  if(line_start>=0 && line_end>0) { // 避免有头无尾的情况
    if(remove_flag) list_content[line_start] = list_content[line_start].replace(/^```(.*)$|^~~~(.*)$/, "")
    else list_content[line_start] = list_content[line_start].replace(/^```|^~~~/, "")
    list_content[line_end] = list_content[line_end].replace(/^```|^~~~/, "")
    content = list_content.join("\n")//.trim()
  }
  return content
}
