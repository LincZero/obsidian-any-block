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
