import {
  MarkdownPostProcessorContext
} from "obsidian"

import {list_ABHtmlSelector, ElSelectorSpec} from "./abHtmlSelector"
import {EmojiRender} from "./abRenderManager"

export class ABPosthtmlManager{
  static processor(
    el: HTMLElement, 
    ctx: MarkdownPostProcessorContext
  ) {
    for (let abHtmlSelector of list_ABHtmlSelector){
      const spec:ElSelectorSpec = abHtmlSelector.listSelector(el, ctx)
      const codeblocks = spec.els
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
}
