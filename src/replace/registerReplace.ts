import {MarkdownRenderChild, MarkdownRenderer} from 'obsidian';
import {ABReplaceWidget} from "./replaceWidget"
import ListProcess from "../utils/ListProcess"

export let list_replace: ABReplaceProcessor[] = []

interface ABReplaceProcessor{
  (widget: ABReplaceWidget): boolean
}

export function registerReplace(processor: ABReplaceProcessor){
  list_replace.push(processor)
}

// md模式
registerReplace((processor)=>{
  if (processor.text.indexOf("md")!=0) return false

  processor.div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
  let dom_note = processor.div.createEl("div", {cls: ["drop-shadow", "ab-note"]});
  const child = new MarkdownRenderChild(dom_note);
  const text = processor.text.substring("md".length).trim()
  // ctx.addChild(child);
  MarkdownRenderer.renderMarkdown(processor.text, dom_note, "", child); // var[2]: Obsidian/插件测试/AnyBlock2.md
  return true
})

// 引用模式
registerReplace((processor)=>{
  if (processor.text.indexOf("quote")!=0) return false

  processor.div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
  let dom_note = processor.div.createEl("div");
  const child = new MarkdownRenderChild(dom_note);
  const text = processor.text.substring("quote".length).trim().split("\n").map((line)=>{return "> "+line}).join("\n")
  MarkdownRenderer.renderMarkdown(text, dom_note, "", child);
  return true
})

// 代码模式
registerReplace((processor)=>{
  if (processor.text.indexOf("code")!=0) return false

  processor.div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
  let dom_note = processor.div.createEl("div");
  const child = new MarkdownRenderChild(dom_note);
  const text = "```"+processor.text.substring("code".length).trim()+"\n```"
  MarkdownRenderer.renderMarkdown(text, dom_note, "", child);
  return true
})

// 列表转表格、md表格
registerReplace((processor)=>{
  if (processor.text.indexOf("list2table")!=0) return false

  processor.div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
  let dom_note = processor.div.createEl("div");
  ListProcess.list2table(processor.text.substring("list2table".length).trim(), dom_note, false)
  return true
})
registerReplace((processor)=>{
  if (processor.text.indexOf("list2mdtable")!=0) return false

  processor.div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
  let dom_note = processor.div.createEl("div");
  ListProcess.list2table(processor.text.substring("list2mdtable".length).trim(), dom_note, true)
  return true
})

// 列表转列表表格
registerReplace((processor)=>{
  if (processor.text.indexOf("list2lt")!=0) return false

  processor.div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
  let dom_note = processor.div.createEl("div");
  ListProcess.list2lt(processor.text.substring("list2lt".length).trim(), dom_note)
  return true
})

// 列表转mermaid流程图
registerReplace((processor)=>{
  if (processor.text.indexOf("list2mermaid")!=0) return false

  processor.div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
  let dom_note = processor.div.createEl("div");
  ListProcess.list2mermaid(processor.text.substring("list2mermaid".length).trim(), dom_note)
  return true
})

/** @warning 不采用模式，必须最后入栈 */
registerReplace((processor)=>{

  processor.div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
  let dom_note = processor.div.createEl("div", {cls: ["drop-shadow", "ab-note"]});
  // 文本元素。pre不好用，这里还是得用<br>换行最好
  dom_note.innerHTML = `<p>${processor.text.split("\n").join("<br/>")}</p>`
  return true
})
