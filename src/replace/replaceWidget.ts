import {Editor, EditorPosition, MarkdownRenderChild, MarkdownRenderer} from 'obsidian';
import {EditorView, WidgetType} from "@codemirror/view"

import {list_replace} from "./registerReplace"
import {RangeSpec} from "../utils/rangeManager"

export class ABReplaceWidget extends WidgetType {
  rangeSpec: RangeSpec
  header: string
  text: string
  from: number
  to: number
  global_editor: Editor
  div: HTMLDivElement

  constructor(rangeSpec: RangeSpec, editor: Editor){
    super()
    this.rangeSpec = rangeSpec
    this.header = rangeSpec.header
    this.text = rangeSpec.text
    this.from = rangeSpec.from
    this.to = rangeSpec.to
    this.global_editor = editor
  }

  toDOM(view: EditorView): HTMLElement {
    // 根元素
    this.div = document.createElement("div");

    let is_been_processor = false
    for (let abReplaceProcessor of list_replace){
      if (abReplaceProcessor(this)) {is_been_processor=true; break}
    }
    if(!is_been_processor){} /////////////////////////

    // 编辑按钮
    let dom_edit = this.div.createEl("div", {
      cls: ["edit-block-button"], 
      attr: {"aria-label": "Edit this block"}
    });
    dom_edit.innerHTML = ABReplaceWidget.str_icon_code2

    // 通过控制光标移动间接取消显示块
    this.div.ondblclick = ()=>{this.moveCursorToHead()}
    dom_edit.onclick = ()=>{this.moveCursorToHead()}
    return this.div;
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
