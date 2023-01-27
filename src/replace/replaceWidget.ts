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
      console.log("md模式")
      div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
      let dom_note = div.createEl("div", {cls: ["drop-shadow", "ab-note"]});
      const child = new MarkdownRenderChild(dom_note);
      const text = this.text.substring("md".length).trim()
      // ctx.addChild(child);
      MarkdownRenderer.renderMarkdown(this.text, dom_note, "", child); // var[2]: Obsidian/插件测试/AnyBlock2.md
    }
    else if (this.text.indexOf("quote")==0) {
      console.log("quote模式")
      div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
      let dom_note = div.createEl("div");
      const child = new MarkdownRenderChild(dom_note);
      const text = this.text.substring("quote".length).trim().split("\n").map((line)=>{return "> "+line}).join("\n")
      // ctx.addChild(child);
      MarkdownRenderer.renderMarkdown(text, dom_note, "", child);
    }
    else{
      console.log("普通文本模式")
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

  static str_icon_code2 = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-darkreader-inline-stroke="" style="--darkreader-inline-stroke:currentColor;"><path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path></svg>`
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
