import {MarkdownRenderChild, MarkdownRenderer} from 'obsidian';
import {ABReplaceWidget} from "../manager/replaceWidgetType"
import ListProcess from "./listProcess"

// replaceWidgetType不需要这个返回值，而replaceRenderChild是需要的
export function autoReplaceEl(el:HTMLDivElement, header:string, content:string):HTMLElement|null{
  for (let abReplaceProcessor of list_replace){
    const result = abReplaceProcessor(el, header, content)
    if (result) return result
  }
  return null
}

let list_replace: ABReplaceProcessor[] = []

interface ABReplaceProcessor{
  (el:HTMLDivElement, header:string, content:string): HTMLElement|null
}

function registerReplace(processor: ABReplaceProcessor){
  list_replace.push(processor)
}

/**
 * 下面的函数名其实没用的，之所以不用匿名函数的原因在于大纲会显示名字，找函数比较方便
 */

// md模式
registerReplace(function md(el, header, content){
  if (header != "md") return null
  const child = new MarkdownRenderChild(el);
  // ctx.addChild(child);
  MarkdownRenderer.renderMarkdown(content, el, "", child); // var[2]: Obsidian/插件测试/AnyBlock2.md
  return el
})

// 引用模式
registerReplace(function quote(el, header, content){
  if (header != "quote") return null
  const child = new MarkdownRenderChild(el);
  content = content.split("\n").map((line)=>{return "> "+line}).join("\n")
  MarkdownRenderer.renderMarkdown(content, el, "", child);
  return el
})

// 去除引用模式
registerReplace(function Xquote(el, header, content){
  if (header != "Xquote") return null
  content = content.split("\n").map(line=>{
    return line.replace(/^>\s/, "")
  }).join("\n")
  const child = new MarkdownRenderChild(el);
  MarkdownRenderer.renderMarkdown(content, el, "", child);
  return el
})

// 代码模式
registerReplace(function code(el, header, content){
  if (header != "code") return null
  const child = new MarkdownRenderChild(el);
  content = "```"+content+"\n```"
  MarkdownRenderer.renderMarkdown(content, el, "", child);
  return el
})

// 去除代码模式
registerReplace(function Xcode(el, header, content){
  if (header != "Xcode") return null
  content = content.split("\n").map(line=>{
    return line.replace(/^```|^~~~/, "")
  }).join("\n")
  const child = new MarkdownRenderChild(el);
  MarkdownRenderer.renderMarkdown(content, el, "", child);
  return el
})

// 列表转表格、md表格
registerReplace(function list2table(el, header, content){
  if (header != "list2table" && header != "list2mdtable") return null
  ListProcess.list2table(content, el, (header=="list2mdtable"))
  return el
})

// 列表转列表表格
registerReplace(function list2lt(el, header, content){
  if (header != "list2lt" && header != "list2mdlt") return null
  ListProcess.list2lt(content, el, (header=="list2mdlt"))
  return el
})

// 列表转二维表格
registerReplace(function list2ut(el, header, content){
  if (header != "list2ut" && header != "list2mdut") return null
  ListProcess.list2ut(content, el, (header=="list2mdut"))
  return el
})

// 列表转mermaid流程图
registerReplace(function list2mermaid(el, header, content){
  if (header != "list2mermaid") return null
  ListProcess.list2mermaid(content, el)
  return el
})

// callout语法糖
registerReplace(function callout_fast(el, header, content){
  if (header.indexOf("!")!=0) return null
  const child = new MarkdownRenderChild(el);
  const text = "```ad-"+header.slice(1)+"\n"+content+"\n```"
  MarkdownRenderer.renderMarkdown(text, el, "", child);
  return el
})

/** @warning 不采用模式，必须最后入栈 */
registerReplace(function text(el, header="text", content){
  el.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
  // 文本元素。pre不好用，这里还是得用<br>换行最好
  el.innerHTML = `<p>${content.split("\n").join("<br/>")}</p>`
  return el
})
