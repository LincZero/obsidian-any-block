import {EditorView, WidgetType} from "@codemirror/view"

export class ABReplaceWidget extends WidgetType {
  text: string

  constructor(text: string){
    super()
    this.text = text
  }

  toDOM(view: EditorView): HTMLElement {
    const div = document.createElement("div");

    div.innerText = "👉" + this.text;

    return div;
  }
}