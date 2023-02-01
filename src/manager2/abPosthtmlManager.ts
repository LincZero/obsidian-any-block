import {
  MarkdownPostProcessorContext
} from "obsidian"

// import {list_ABHtmlSelector, ElSelectorSpec} from "./abHtmlSelector"
import {ABReplaceWidget} from "../manager/replaceWidgetType"
import {RelpaceRender} from "./replaceRenderChild"

/** Html处理器
 * 全局html会分为多个块，会被每个块调用一次
 * 局部渲染时，也会被每个渲染项调用一次 (MarkdownRenderer.renderMarkdown方法，感觉tableextend插件也是这个原因)
 *   多换行会切分块、块类型不同也会切分（哪怕之间没有空行）
 *   状态会缓存，如果切换回编辑模式没更改再切回来，不会再次运行
 * 
 * 总逻辑
 * - 后处理器，附带还原成md的功能
 *   - ~~html选择器~~
 *   - 渲染器
 * 
 */
export class ABPosthtmlManager{
  static processor(
    el: HTMLElement, 
    ctx: MarkdownPostProcessorContext
  ) {
    for (const child of el.children) {
      // 这一部分是找到根div里的<ul>或<quote><ul>
      let ul: HTMLUListElement
      if (child instanceof HTMLUListElement) {
        ul = child
      }
      else if (
        child instanceof HTMLQuoteElement &&                    // 引用元素
        child.firstElementChild instanceof HTMLUListElement
      ) {
        ul = child.firstElementChild;
      }
      else continue

      // 获取el对应的源md
      const mdSrc = getSourceMarkdown(el, ctx)
      if (!mdSrc) return
      
      if (mdSrc.header && /^\s*?-\s(.*?)/.test(mdSrc.content)) {
        if (mdSrc.header.indexOf("2")==0) mdSrc.header="list"+mdSrc.header
        ctx.addChild(new RelpaceRender(ul, mdSrc.header, mdSrc.content));
      }
    }
  }
}

/** 将html还原回md格式
 * 被processTextSection调用
 */
const getSourceMarkdown = (
  sectionEl: HTMLElement,
  ctx: MarkdownPostProcessorContext,
): {header: string, content: string}|null => {
  let info = ctx.getSectionInfo(sectionEl);     // info: MarkdownSectionInformation | null
  if (info) {
    const { text, lineStart, lineEnd } = info;  // 分别是：全文文档、div的开始行、div的结束行
    const list_text = text.split("\n")
    const text_content = list_text.slice(lineStart, lineEnd + 1).join("\n");
    let text_header = lineStart==0?"":list_text[lineStart-1]
    const text_header_match = text_header.match(/^\s*\[(.*?)\]/)
    text_header = text_header_match?text_header_match[1]:""
    return {
      header: text_header,
      content: text_content
    }
  }
  // console.warn("获取MarkdownSectionInformation失败，可能会产生bug") // 其实会return void，应该不会有bug
  return null
};
