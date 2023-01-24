import {EditorView, WidgetType} from "@codemirror/view"

export class ABReplaceWidget extends WidgetType {
  text: string

  constructor(text: string){
    super()
    this.text = text
  }

  toDOM(view: EditorView): HTMLElement {
    
    const div = document.createElement("div");
    div.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])

    // pre不好用，这里还是得用<br>换行最好
    div.innerHTML = `
    <div class="drop-shadow ab-note">
      <p>${this.text.split("\n").join("<br/>")}</p>
    </div>
    <div class="edit-block-button" aria-label="Edit this block">
      ${str_icon_code2}
    </div>
    `
    
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
    return div;
  }
}

const str_icon_code2 = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-darkreader-inline-stroke="" style="--darkreader-inline-stroke:currentColor;"><path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path></svg>`