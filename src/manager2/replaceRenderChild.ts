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

  // 哪来的方法，也不是override
  onload() {
    const subEl = autoReplaceEl(this.containerEl, this.header, this.content)
    if (subEl) {
      // 区分Decoration.replace RangeReplace replaceWith，分别是替换装饰、替换文字、HTML元素替换
      this.containerEl.replaceWith(subEl); 
    }    
  }
}
