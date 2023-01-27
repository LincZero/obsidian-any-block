import {Editor, EditorPosition, MarkdownRenderChild, MarkdownRenderer} from 'obsidian';
import {EditorView, WidgetType} from "@codemirror/view"

export class ABReplaceWidget extends WidgetType {
  text: string
  from: number
  to: number
  global_editor: Editor

  constructor(text: string, from: number, to: number, ediot: Editor){
    super()
    this.text = text.substring(2, text.length-2).trim()
    this.from = from
    this.to = to
    this.global_editor = ediot
  }

  toDOM(view: EditorView): HTMLElement {
    // 根元素
    const div = document.createElement("div");

    // 引用模式
    if (this.text.indexOf("md")==0) {
      div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
      let dom_note = div.createEl("div", {cls: ["drop-shadow", "ab-note"]});
      const child = new MarkdownRenderChild(dom_note);
      const text = this.text.substring("md".length).trim()
      // ctx.addChild(child);
      MarkdownRenderer.renderMarkdown(this.text, dom_note, "", child); // var[2]: Obsidian/插件测试/AnyBlock2.md
    }
    else if (this.text.indexOf("quote")==0) {
      div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
      let dom_note = div.createEl("div");
      const child = new MarkdownRenderChild(dom_note);
      const text = this.text.substring("quote".length).trim().split("\n").map((line)=>{return "> "+line}).join("\n")
      MarkdownRenderer.renderMarkdown(text, dom_note, "", child);
    }
    else if (this.text.indexOf("code")==0) {
      div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
      let dom_note = div.createEl("div");
      const child = new MarkdownRenderChild(dom_note);
      const text = "```"+this.text.substring("code".length).trim()+"\n```"
      MarkdownRenderer.renderMarkdown(text, dom_note, "", child);
    }
    else if (this.text.indexOf("list2table")==0) {
      console.log("list2table模式")
      div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
      let dom_note = div.createEl("div");
      const child = new MarkdownRenderChild(dom_note);
      this.list2table(this.text.substring("list2table".length).trim(), dom_note)
    }
    else{
      div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
      let dom_note = div.createEl("div", {cls: ["drop-shadow", "ab-note"]});
      // 文本元素。pre不好用，这里还是得用<br>换行最好
      dom_note.innerHTML = `<p>${this.text.split("\n").join("<br/>")}</p>`
    }

    // 编辑按钮
    let dom_edit = div.createEl("div", {
      cls: ["edit-block-button"], 
      attr: {"aria-label": "Edit this block"}
    });
    dom_edit.innerHTML = ABReplaceWidget.str_icon_code2

    // 通过控制光标移动间接取消显示块
    div.ondblclick = ()=>{this.moveCursorToHead()}
    dom_edit.onclick = ()=>{this.moveCursorToHead()}
    return div;
  }

  private moveCursorToHead(): void{
      /** @warning 注意这里千万不能用 toDOM 方法给的 view 参数
       * const editor: Editor = view.editor // @ts-ignore
       * 否则editor是undefined
       */
      const editor: Editor = this.global_editor
      let pos = this.getCursorPos(editor, this.from)
      console.log("pos", pos, editor, editor.getCursor())
      if (pos) editor.setCursor(pos)
  }

  private getCursorPos(editor:Editor, total_ch:number): EditorPosition|null{
    let count_ch = 0
    let list_text: string[] = editor.getValue().split("\n")
    for (let i=0; i<list_text.length; i++){
      if (count_ch+list_text[i].length >= total_ch) return {line:i, ch:total_ch-count_ch}
      count_ch = count_ch + list_text[i].length + 1
    }
    return null
  }

  /** @bug 假设都是4缩进，后面再对异常缩进进行修复 */
  private list2table(text: string, div: Element) {
    // 文本处理
    let list_itemInfo = []
    const list_text = text.split("\n")
    for (let line of list_text) {
      if (/^\s*?-\s(.*?)/.test(line)) {
        list_itemInfo.push({
          content: line.replace(/^\s*?-\s/, ""),
          level: line.replace(/-\s(.*?)$/, "").length/2
        })
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

  // 迭代
  createTable(div: Element){

  }

  static str_icon_code2 = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-darkreader-inline-stroke="" style="--darkreader-inline-stroke:currentColor;"><path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path></svg>`
}

interface TreeNode{
    text: string
    children: TreeNode[]
}

/*`
<div class="drop-shadow ab-note">
  <p>${this.text.split("\n").join("<br/>")}</p>
</div>
<div class="edit-block-button" aria-label="Edit this block">
  ${str_icon_code2}
</div>
`*/

/**const div = document.createDiv({
  cls: ["ab-replace"]
})/
/*const editButton = div.createEl("img", {
  cls: ["ab-switchButton"],
  //text: str_icon_code2,
  title: "Edit this block",
  // attr: {"src": "code-2"}////////////////
})*/
/*const adText = div.createDiv({
  text: "👉" + this.text
})*/
// div.innerText = "👉" + this.text;
