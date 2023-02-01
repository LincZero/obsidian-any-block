import { MarkdownRenderChild } from "obsidian";

/**
 * HTML渲染管理器
 * 替换前：div>p>code
 * 替换后：div>p>span
 */
export class EmojiRender extends MarkdownRenderChild {
  static ALL_EMOJIS: Record<string, string> = {
    ":+1:": "👍",
    ":sunglasses:": "😎",
    ":smile:": "😄",
  };
  text: string;

  // override。这里就是新增了一个text参数而已，其他不变
  constructor(containerEl: HTMLElement, text: string) {
    super(containerEl);
    this.text = text;
  }

  // 哪来的方法，也不是override
  onload() {
    const emojiEl = this.containerEl.createSpan({
      text: EmojiRender.ALL_EMOJIS[this.text] ?? this.text,   // 双问号运算符
    });
    // 区分Decoration.replace RangeReplace replaceWith，分别是替换装饰、替换文字、HTML元素替换
    this.containerEl.replaceWith(emojiEl); 
  }
}

export class RelpaceRender extends MarkdownRenderChild {
  text: string;

  // override。这里就是新增了一个text参数而已，其他不变
  constructor(containerEl: HTMLElement, text: string) {
    super(containerEl);
    this.text = text;
  }

  // 哪来的方法，也不是override
  onload() {
    const emojiEl = this.containerEl.createSpan({
      text: EmojiRender.ALL_EMOJIS[this.text] ?? this.text,   // 双问号运算符
    });
    // 区分Decoration.replace RangeReplace replaceWith，分别是替换装饰、替换文字、HTML元素替换
    this.containerEl.replaceWith(emojiEl); 
  }

  getDom(){
    // 根元素
    this.div = document.createElement("div");
    this.div.setAttribute("type_header", this.rangeSpec.header)

    let is_been_processor = false
    for (let abReplaceProcessor of list_replace){
      if (abReplaceProcessor(this)) {is_been_processor=true; break}
    }
    if(!is_been_processor){} /////////////////////////

    // 编辑按钮
    if (this.global_editor){
      let dom_edit = this.div.createEl("div", {
        cls: ["edit-block-button"], 
        attr: {"aria-label": "Edit this block"}
      });
      dom_edit.innerHTML = ABReplaceWidget.str_icon_code2
    
      // 通过控制光标移动间接取消显示块
      this.div.ondblclick = ()=>{this.moveCursorToHead()}
      dom_edit.onclick = ()=>{this.moveCursorToHead()}
    }
    
    return this.div;
  }
}
