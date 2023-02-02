import {MarkdownRenderChild, MarkdownRenderer} from 'obsidian';
import {ABReg} from "src/config/abReg"
import ListProcess from "./listProcess"

// replaceWidgetType 和 replaceRenderChild 其实都不需要这个返回值的El元素
// 其实这里应该返回 true false 的
export function autoReplaceEl(el:HTMLDivElement, header:string, content:string):HTMLElement|null{
  // const list_header = header.split("|")
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
  console.log(content)
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

// 去除代码模式（仅去除第一组）
registerReplace(function Xcode(el, header, content){
  if (header != "Xcode") return null
  let list_content = content.split("\n")
  let code_flag = ""
  let line_start = -1
  let line_end = -1
  for (let i=0; i<list_content.length; i++){
    if (code_flag==""){
      const match_tmp = list_content[i].match(ABReg.reg_code)
      if(match_tmp){
        code_flag = match_tmp[1]
        line_start = i
      }
    }
    else {
      if(list_content[i].indexOf(code_flag)>=0){
        line_end = i
        break
      }
    }
  }
  if(line_start>=0 && line_end>0) { // 避免有头无尾的情况
    list_content[line_start] = list_content[line_start].replace(/^```|^~~~/, "")
    list_content[line_start] = list_content[line_end].replace(/^```|^~~~/, "")
    content = list_content.join("\n")
  }
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


registerReplace(function text(el, header, content){
  if (header != "text") return null
  el.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
  // 文本元素。pre不好用，这里还是得用<br>换行最好
  el.innerHTML = `<p>${content.split("\n").join("<br/>")}</p>`
  return el
})

/** @warning 没有模式则认为是md模式，必须最后入栈 */
// md模式
registerReplace(function other(el, header="md", content){
  const child = new MarkdownRenderChild(el);
  MarkdownRenderer.renderMarkdown(content, el, "", child); // var[2]: Obsidian/插件测试/AnyBlock2.md
  return el
})
