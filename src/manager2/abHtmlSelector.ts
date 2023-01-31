import {
  MarkdownPostProcessor, 
  MarkdownPostProcessorContext
} from "obsidian"

/** Html范围选择器
 * 用完整的Html，筛选出合适范围的Html
 */
export class ABHtmlSelector{
  static listSelector(
    el: HTMLElement, 
    ctx: MarkdownPostProcessorContext
  ){
    const codeblocks = el.querySelectorAll("code");
    return codeblocks
  }
}