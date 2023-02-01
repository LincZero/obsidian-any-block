import { MarkdownRenderChild } from "obsidian";
import { autoReplaceEl } from "../replace/registerReplace"

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
   *  div.ab-replace.cm-embed-block.markdown-rendered.show-indentation-guide[type_header=`${}`]
   *      div.drop-shadow.ab-note
   *      div.edit-block-button[aria-label="Edit this block"]
   */
  onload() {
    const div:HTMLDivElement = this.containerEl.createDiv({
      cls: ["ab-replace"]
    });

    const dom_note = div.createDiv({
      cls: ["ab-note"]
    })
    const subEl = autoReplaceEl(dom_note, this.header, this.content)
    if (!subEl) return

    // 区分Decoration.replace RangeReplace replaceWith，分别是替换装饰、替换文字、HTML元素替换
    this.containerEl.replaceWith(div);
    
    const dom_edit = div.createDiv({
      cls: ["ab-button"]
    })
    dom_edit.innerHTML = RelpaceRender.str_icon_code2
  }

  static str_icon_code2 = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-darkreader-inline-stroke="" style="--darkreader-inline-stroke:currentColor;"><path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path></svg>`
}
