import type {MarkdownPostProcessorContext} from "obsidian"
import{
  MarkdownRenderChild,
  MarkdownRenderer,
} from "obsidian";
import { ABConvertManager } from "src/ABConverter";
import { abConvertEvent } from "src/ABConverter/ABConvertEvent";
import { ABReg } from "src/ABConverter/ABReg";

export class ABReplacer_CodeBlock{
  static processor(
    // plugin_this: AnyBlockPlugin,                       // 使用bind方法被绑进来的
    src: string,                                // 代码块内容
    blockEl: HTMLElement,                       // 代码块渲染的元素
    ctx: MarkdownPostProcessorContext,
  ) {
    const list_src = src.split("\n")

    // AnyBlock块
    if (list_src.length) {
      const match = list_src[0].match(ABReg.reg_header_noprefix)
      if (match && match[5]) {
        ABConvertManager.autoABConvert(blockEl as HTMLDivElement, match[5], list_src.slice(1).join("\n").trimStart())
        abConvertEvent(blockEl)
        return
      }
    }

    // 非法内容，普通渲染处理 (还是说代码渲染会更好?)
    let child = new MarkdownRenderChild(blockEl);
    ctx.addChild(child);
    MarkdownRenderer.renderMarkdown(src, blockEl, ctx.sourcePath, child);
  }
}
