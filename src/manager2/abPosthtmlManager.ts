import {
  MarkdownPostProcessorContext
} from "obsidian"

import {ABReg} from "src/config/abReg"
import {ConfDecoration, ConfSelect} from "src/config/abSettingTab"
import AnyBlockPlugin from "../main"
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
    this: AnyBlockPlugin,
    el: HTMLElement, 
    ctx: MarkdownPostProcessorContext
  ) {
    // 设置里不启用，直接关了
    if (this.settings.decoration_render==ConfDecoration.none) return

    // 获取el对应的源md
    const mdSrc = getSourceMarkdown(el, ctx)
    if (!mdSrc) return

    // 设置开关
    const able_list:boolean = ((this.settings.select_list == ConfSelect.ifhead) && mdSrc.header!="") || (this.settings.select_list == ConfSelect.yes)
    const able_quote:boolean = ((this.settings.select_quote == ConfSelect.ifhead) && mdSrc.header!="") || (this.settings.select_quote == ConfSelect.yes)
    const able_code:boolean = ((this.settings.select_code == ConfSelect.ifhead) && mdSrc.header!="") || (this.settings.select_code == ConfSelect.yes)

    // 选择器
    for (const child of el.children) {                          // 这个如果是块的话一般就一层，多层应该是p-br的情况
      // 这一部分是找到根div里的<ul>或<quote><ul>
      let sub_el: HTMLElement
      if (able_list && child instanceof HTMLUListElement) {                  // 列表
        sub_el = child
        if (/^\s*-\s(.*)/.test(mdSrc.content)) {
          if (mdSrc.header.indexOf("2")==0) mdSrc.header="list"+mdSrc.header
        }
        else {
          console.warn("html选择器: ul格式错误", mdSrc) // 按理说不会
          continue
        }
      }
      else if (able_quote && child instanceof HTMLQuoteElement){
        sub_el = child
      }
      else if (able_code && child instanceof HTMLPreElement){
        sub_el = child
      }
      /*else if (
        child instanceof HTMLQuoteElement &&
        child.firstElementChild instanceof HTMLUListElement
      ) {
        sub_el = child.firstElementChild;
      }*/
      else continue
      
      mdSrc.header=mdSrc.header??"md"   // 渲染模式的列表选择器若无header则给md
      ctx.addChild(new RelpaceRender(sub_el, mdSrc.header, mdSrc.content));
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
    const text_header_match = text_header.match(ABReg.reg_header)
    text_header = text_header_match?text_header_match[2]:""
    return {
      header: text_header,
      content: text_content
    }
  }
  // console.warn("获取MarkdownSectionInformation失败，可能会产生bug") // 其实会return void，应该不会有bug
  return null
};
