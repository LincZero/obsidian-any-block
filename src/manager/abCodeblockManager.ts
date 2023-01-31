import {
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
  MarkdownRenderer,
} from "obsidian";

import AnyBlockPlugin from "../main";

export class ABCodeBlockProcessor{
  static processor(
    this: AnyBlockPlugin,                       // 使用bind方法被绑进来的
    src: string,                                // 代码块内容
    blockEl: HTMLElement,                       // 代码块渲染的元素
    ctx: MarkdownPostProcessorContext,
  ) {
    let child = new MarkdownRenderChild(blockEl);
    ctx.addChild(child);
  
    MarkdownRenderer.renderMarkdown(src, blockEl, ctx.sourcePath, child);
  }
}
