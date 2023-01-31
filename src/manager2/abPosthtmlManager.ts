import {
  MarkdownPostProcessorContext
} from "obsidian"

import {ABHtmlSelector} from "./abHtmlSelector"
import {EmojiRender} from "./abRenderManager"

export class ABPosthtmlManager{
  static processor(
    el: HTMLElement, 
    ctx: MarkdownPostProcessorContext
  ) {
    const codeblocks = ABHtmlSelector.listSelector(el, ctx)

    for (let index = 0; index < codeblocks.length; index++) {
      const codeblock = codeblocks.item(index);
      const text = codeblock.innerText.trim();

      // 匹配则创建MarkdownRenderChild实例
      if (text[0] === ":" && text[text.length - 1] === ":") {
        ctx.addChild(new EmojiRender(codeblock, text)); // 将参数1HTML
      }
    }
  }
}
