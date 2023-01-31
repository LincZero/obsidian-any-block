import {MarkdownRenderChild, MarkdownRenderer} from 'obsidian';
import {ABReplaceWidget} from "./replaceWidget"
import ListProcess from "./listProcess"

export let list_replace: ABReplaceProcessor[] = []

interface ABReplaceProcessor{
  (widget: ABReplaceWidget): boolean
}

export function registerReplace(processor: ABReplaceProcessor){
  list_replace.push(processor)
}

// md模式
registerReplace((processor)=>{
  if (processor.rangeSpec.header != "md") return false

  processor.div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
  let dom_note = processor.div.createEl("div", {cls: ["drop-shadow", "ab-note"]});
  const child = new MarkdownRenderChild(dom_note);
  // ctx.addChild(child);
  MarkdownRenderer.renderMarkdown(processor.rangeSpec.content, dom_note, "", child); // var[2]: Obsidian/插件测试/AnyBlock2.md
  return true
})

// 引用模式
registerReplace((processor)=>{
  if (processor.rangeSpec.header != "quote") return false

  processor.div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
  let dom_note = processor.div.createEl("div");
  const child = new MarkdownRenderChild(dom_note);
  const text = processor.rangeSpec.content.split("\n").map((line)=>{return "> "+line}).join("\n")
  MarkdownRenderer.renderMarkdown(text, dom_note, "", child);
  return true
})

// 代码模
registerReplace((processor)=>{
  if (processor.rangeSpec.header != "code") return false

  processor.div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
  let dom_note = processor.div.createEl("div");
  const child = new MarkdownRenderChild(dom_note);
  const text = "```"+processor.rangeSpec.content+"\n```"
  MarkdownRenderer.renderMarkdown(text, dom_note, "", child);
  return true
})

// 列表转表格、md表格
registerReplace((processor)=>{
  if (processor.rangeSpec.header != "list2table") return false

  processor.div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
  let dom_note = processor.div.createEl("div");
  ListProcess.list2table(processor.rangeSpec.content, dom_note, false)
  return true
})
registerReplace((processor)=>{
  if (processor.rangeSpec.header != "list2mdtable") return false

  processor.div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
  let dom_note = processor.div.createEl("div");
  ListProcess.list2table(processor.rangeSpec.content, dom_note, true)
  return true
})

// 列表转列表表格
registerReplace((processor)=>{
  if (processor.rangeSpec.header != "list2lt") return false

  processor.div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
  let dom_note = processor.div.createEl("div");
  ListProcess.list2lt(processor.rangeSpec.content, dom_note)
  return true
})

// 列表转mermaid流程图
registerReplace((processor)=>{
  if (processor.rangeSpec.header != "list2mermaid") return false

  processor.div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
  let dom_note = processor.div.createEl("div");
  ListProcess.list2mermaid(processor.rangeSpec.content, dom_note)
  return true
})

// callout语法糖
registerReplace((processor)=>{
  if (processor.rangeSpec.header.indexOf("!")!=0) return false

  processor.div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
  let dom_note = processor.div.createEl("div");
  const child = new MarkdownRenderChild(dom_note);
  const text = "```ad-"+processor.rangeSpec.header.slice(1)+"\n"+processor.rangeSpec.content+"\n```"
  MarkdownRenderer.renderMarkdown(text, dom_note, "", child);
  return true
})

/** @warning 不采用模式，必须最后入栈 */
registerReplace((processor)=>{

  processor.div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
  let dom_note = processor.div.createEl("div", {cls: ["drop-shadow", "ab-note"]});
  // 文本元素。pre不好用，这里还是得用<br>换行最好
  dom_note.innerHTML = `<p>${processor.rangeSpec.content.split("\n").join("<br/>")}</p>`
  return true
})
