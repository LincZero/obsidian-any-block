import {MarkdownRenderChild, MarkdownRenderer} from 'obsidian';
import {ABReplaceWidget} from "../manager/replaceWidgetType"
import ListProcess from "./listProcess"

// replaceWidgetType不需要这个返回值，而replaceRenderChild是需要的
export function autoReplaceEl(el:HTMLElement, header:string, content:string):HTMLElement|null{
  for (let abReplaceProcessor of list_replace){
    const result = abReplaceProcessor(el, header, content)
    if (result) return result
  }
  return null
}

let list_replace: ABReplaceProcessor[] = []

interface ABReplaceProcessor{
  (el:HTMLElement, header:string, content:string): HTMLElement|null
}

function registerReplace(processor: ABReplaceProcessor){
  list_replace.push(processor)
}

// md模式
registerReplace((el, header, content)=>{
  if (header != "md") return null
  let dom_note = el.createEl("div", {cls: ["drop-shadow", "ab-note"]});
  const child = new MarkdownRenderChild(dom_note);
  // ctx.addChild(child);
  MarkdownRenderer.renderMarkdown(content, dom_note, "", child); // var[2]: Obsidian/插件测试/AnyBlock2.md
  return dom_note
})

// 引用模式
registerReplace((el, header, content)=>{
  if (header != "quote") return null
  let dom_note = el.createEl("div");
  const child = new MarkdownRenderChild(dom_note);
  const text = content.split("\n").map((line)=>{return "> "+line}).join("\n")
  MarkdownRenderer.renderMarkdown(text, dom_note, "", child);
  return dom_note
})

// 代码模
registerReplace((el, header, content)=>{
  if (header != "code") return null
  let dom_note = el.createEl("div");
  const child = new MarkdownRenderChild(dom_note);
  const text = "```"+content+"\n```"
  MarkdownRenderer.renderMarkdown(text, dom_note, "", child);
  return dom_note
})

// 列表转表格、md表格
registerReplace((el, header, content)=>{
  if (header != "list2table") return null
  let dom_note = el.createEl("div");
  ListProcess.list2table(content, dom_note, false)
  return dom_note
})
registerReplace((el, header, content)=>{
  if (header != "list2mdtable") return null
  let dom_note = el.createEl("div");
  ListProcess.list2table(content, dom_note, true)
  return dom_note
})

// 列表转列表表格
registerReplace((el, header, content)=>{
  if (header != "list2lt") return null
  let dom_note = el.createEl("div");
  ListProcess.list2lt(content, dom_note)
  return dom_note
})

// 列表转mermaid流程图
registerReplace((el, header, content)=>{
  if (header != "list2mermaid") return null
  let dom_note = el.createEl("div");
  ListProcess.list2mermaid(content, dom_note)
  return dom_note
})

// callout语法糖
registerReplace((el, header, content)=>{
  if (header.indexOf("!")!=0) return null
  let dom_note = el.createEl("div");
  const child = new MarkdownRenderChild(dom_note);
  const text = "```ad-"+header.slice(1)+"\n"+content+"\n```"
  MarkdownRenderer.renderMarkdown(text, dom_note, "", child);
  return dom_note
})

/** @warning 不采用模式，必须最后入栈 */
registerReplace((el, header="text", content)=>{
  el.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
  let dom_note = el.createEl("div", {cls: ["drop-shadow", "ab-note"]});
  // 文本元素。pre不好用，这里还是得用<br>换行最好
  dom_note.innerHTML = `<p>${content.split("\n").join("<br/>")}</p>`
  return dom_note
})
