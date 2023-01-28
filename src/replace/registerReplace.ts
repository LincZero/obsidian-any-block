import {MarkdownRenderChild, MarkdownRenderer} from 'obsidian';
import {ABReplaceWidget} from "./replaceWidget"

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

// 列表转表格
registerReplace((processor)=>{
  if (processor.text.indexOf("list2table")!=0) return false

  console.log("list2table模式")
  processor.div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
  let dom_note = processor.div.createEl("div");
  const child = new MarkdownRenderChild(dom_note);
  list2table(processor.text.substring("list2table".length).trim(), dom_note)
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

/** @bug 不能跨缩进，后面再对异常缩进进行修复 */
function list2table(text: string, div: Element) {
  // 文本处理
  let list_itemInfo = []
  const list_text = text.split("\n")
  for (let line of list_text) {                                             // 每行
    if (/^\s*?-\s(.*?)/.test(line)) {
      let list_inline: string[] = line.replace(/^\s*?-\s/, "").split(" | ") // 内联分行
      let level_inline: number = line.replace(/-\s(.*?)$/, "").length/2
      for (let index=0; index<list_inline.length; index++){
        list_itemInfo.push({
          content: list_inline[index],
          level: level_inline+index
        })
      }
    }
    else{
      break
    }
  }

  // 组装成表格数据 (列表是深度优先)
  let list_itemInfo2 = []
  let prev_line = 0 // 并存储最高行数
  let prev_level = -1
  for (let i=0; i<list_itemInfo.length; i++){
    let item = list_itemInfo[i]
    
    // 获取跨行数
    let tableRow = 1
    let row_level = list_itemInfo[i].level
    for (let j=i+1; j<list_itemInfo.length; j++) {
      if (list_itemInfo[j].level > row_level){                  // 在右侧，不换行
        row_level = list_itemInfo[j].level
      }
      else if (list_itemInfo[j].level > list_itemInfo[i].level){ // 换行但是不换item项的行
        row_level = list_itemInfo[j].level
        tableRow++
      }
      else break                                                // 换item项的行
    }

    // 获取所在行数。分换行和不换行
    if (item.level <= prev_level) {
      prev_line++
    }
    prev_level = item.level

    // 填写
    list_itemInfo2.push({
      content: item.content,  // 内容
      level: item.level,      // 级别
      tableRow: tableRow,     // 跨行数
      tableLine: prev_line    // 对应首行
    })
  }

  console.log("list_itemInfo2", list_itemInfo2)

  // 组装成表格
  div = div.createEl("table").createEl("tbody")
  for (let index_line=0; index_line<prev_line+1; index_line++){
    let tr = div.createEl("tr")
    for (let item of list_itemInfo2){
      if (item.tableLine==index_line) {
        tr.createEl("td", {
          text: item.content, 
          attr:{"rowspan": item.tableRow}
        })
      }
    }
  }
  return div
}
