import type {Editor, EditorPosition} from 'obsidian';
import {EditorView, WidgetType} from "@codemirror/view"

import {autoABProcessor} from "../replace/abProcessor"
import type {MdSelectorSpec} from "./abMdSelector"

export class ABReplaceWidget extends WidgetType {
  rangeSpec: MdSelectorSpec
  global_editor: Editor|null
  div: HTMLDivElement

  constructor(rangeSpec: MdSelectorSpec, editor: Editor|null){
    super()
    this.rangeSpec = rangeSpec
    this.global_editor = editor
  }

  /**
   *  div.ab-replace.cm-embed-block.markdown-rendered.show-indentation-guide[type_header=`${}`]
   *      div.drop-shadow.ab-note
   *      div.ab-button.edit-block-button[aria-label="Edit this block"]
   */
  toDOM(view: EditorView): HTMLElement {
    // 根元素
    this.div = document.createElement("div");
    this.div.setAttribute("type_header", this.rangeSpec.header)
    this.div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])

    // 内容替换元素
    let dom_note = this.div.createEl("div", {cls: ["drop-shadow", "ab-note"]});
    autoABProcessor(dom_note, this.rangeSpec.header, this.rangeSpec.content)

    // 编辑按钮
    if (this.global_editor){
      let dom_edit = this.div.createEl("div", {
        cls: ["ab-button", "edit-block-button"], 
        attr: {"aria-label": "Edit this block - "+this.rangeSpec.header}
      });
      dom_edit.innerHTML = ABReplaceWidget.str_icon_code2
    
      // 通过控制光标移动间接取消显示块
      // this.div.ondblclick = ()=>{this.moveCursorToHead()}
      dom_edit.onclick = ()=>{this.moveCursorToHead()}
    }
    
    return this.div;
  }

  private moveCursorToHead(): void{
      /** @warning 注意这里千万不能用 toDOM 方法给的 view 参数
       * const editor: Editor = view.editor // @ts-ignore
       * 否则editor是undefined
       */
      if (this.global_editor){
        const editor: Editor = this.global_editor
        let pos = this.getCursorPos(editor, this.rangeSpec.from)
        if (pos) {
          editor.setCursor(pos)
          // 往返修改，间接重新渲染State
          editor.replaceRange("OF", pos)
          editor.replaceRange("", pos, {line:pos.line, ch:pos.ch+2})
        }
      }
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
