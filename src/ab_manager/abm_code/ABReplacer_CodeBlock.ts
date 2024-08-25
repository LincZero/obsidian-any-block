import type {MarkdownPostProcessorContext} from "obsidian"
import{
  MarkdownRenderChild,
  MarkdownRenderer,
} from "obsidian";

export class ABReplacer_CodeBlock{
  static processor(
    // plugin_this: AnyBlockPlugin,                       // 使用bind方法被绑进来的
    src: string,                                // 代码块内容
    blockEl: HTMLElement,                       // 代码块渲染的元素
    ctx: MarkdownPostProcessorContext,
  ) {
    let child = new MarkdownRenderChild(blockEl);
    ctx.addChild(child);
  
    MarkdownRenderer.renderMarkdown(src, blockEl, ctx.sourcePath, child);
  }
}
