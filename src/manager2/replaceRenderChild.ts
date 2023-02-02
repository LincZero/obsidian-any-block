import { MarkdownRenderChild } from "obsidian";
import { autoReplaceEl } from "../replace/registerReplace"

const list_option = {
  "list2table": "表格",
  "list2mdtable": "表格(md)",
  "list2lt": "列表格",
  "list2mdlt": "列表格(md)",
  "list2ut": "ul表格",
  "list2mdut": "ul表格(md)",
  "list2mermaid": "流程图",
  "md": "原格式",
  "text": "纯文本",
  "Xcode": "消除代码块",
  "Xquote": "消除引用块",
  "code": "代码块",
  "quote": "引用块",
  "other": "其他格式",
}

export class RelpaceRender extends MarkdownRenderChild {
  content: string;
  header: string;

  // override。这里就是新增了一个text参数而已，其他不变
  constructor(containerEl: HTMLElement, header: string, content: string) {
    super(containerEl);
    this.header = header;
    this.content = content;
  }

  /**
   *  div
   *      div.ab-replace.cm-embed-block.markdown-rendered.show-indentation-guide[type_header=`${}`]
   *          div.drop-shadow.ab-note
   *              .ab-replaceEl (下拉框选择时被替换)
   *          div.edit-block-button[aria-label="Edit this block"]
   * 
   *  this.containerEl
   *      div
   *          dom_note
   *              subEl (下拉框选择时被替换)
   *          dom_edit
   */
  onload() {
    const div:HTMLDivElement = this.containerEl.createDiv({
      cls: ["ab-replace"]
    });

    const dom_note = div.createDiv({
      cls: ["ab-note"]
    })
    let dom_replaceEl = dom_note.createDiv({
      cls: ["ab-replaceEl"]
    })
    autoReplaceEl(dom_replaceEl, this.header, this.content)

    // 区分Decoration.replace RangeReplace replaceWith，分别是替换装饰、替换文字、HTML元素替换
    this.containerEl.replaceWith(div);
    
    const dom_edit = div.createEl("select", {
      cls: ["ab-button"], 
      attr: {"aria-label": "Edit this block - "+this.header}
    });
    for (let [key, value] of Object.entries(list_option)){
      const dom_option = dom_edit.createEl("option",{
        text:value,
        attr:{"value":key},
      })
      if (key==this.header) dom_option.selected=true
    }
    dom_edit.onchange = ()=>{
      console.log("切换", dom_note)
      const new_header = dom_edit.options[dom_edit.selectedIndex].value
      const new_dom_replaceEl = dom_note.createDiv({
        cls: ["ab-replaceEl"]
      })
      autoReplaceEl(new_dom_replaceEl, new_header, this.content)
      dom_replaceEl.replaceWith(new_dom_replaceEl);
      dom_replaceEl = new_dom_replaceEl
    }
  }

  static str_icon_code2 = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-darkreader-inline-stroke="" style="--darkreader-inline-stroke:currentColor;"><path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path></svg>`
}
