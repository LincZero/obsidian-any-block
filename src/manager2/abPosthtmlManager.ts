import type {
  MarkdownPostProcessorContext,
  MarkdownSectionInformation
} from "obsidian"

import {ABReg} from "src/config/abReg"
import {ConfDecoration, ConfSelect} from "src/config/abSettingTab"
import type AnyBlockPlugin from "../main"
import {RelpaceRender} from "./replaceRenderChild"

/** Html处理器
 * 被调用的可能：
 *   1. 全局html会分为多个块，会被每个块调用一次
 *      多换行会切分块、块类型不同也会切分（哪怕之间没有空行）
 *   2. 局部渲染时，也会被每个渲染项调用一次 (MarkdownRenderer.renderMarkdown方法，感觉tableextend插件也是这个原因)
 *   3. 用根节点createEl时也会被调用一次（.replaceEl）
  *  4. 状态会缓存，如果切换回编辑模式没更改再切回来，不会再次被调用
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
    // console.log("el ctx", el, ctx, mdSrc)
    if (!mdSrc) return

    // 设置开关
    const able_list:boolean = (this.settings.select_list == ConfSelect.yes) || ((this.settings.select_list == ConfSelect.ifhead) && mdSrc.header!="")
    const able_quote:boolean = (this.settings.select_list == ConfSelect.yes) || ((this.settings.select_quote == ConfSelect.ifhead) && mdSrc.header!="")
    const able_code:boolean = (this.settings.select_list == ConfSelect.yes) || ((this.settings.select_code == ConfSelect.ifhead) && mdSrc.header!="")
    const able_brace:boolean = this.settings.select_brace == ConfSelect.yes
    const able_heading:boolean = this.settings.select_heading == ConfSelect.ifhead

    // 局部选择器
    for (const child of el.children) {                          // 这个如果是块的话一般就一层，多层应该是p-br的情况
      // 这一部分是找到根div里的<ul>或<quote><ul>
      let sub_el: HTMLElement
      if (able_list && child instanceof HTMLUListElement) {     // 列表
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

    // 结束，开启全局选择器
    if (mdSrc.is_end){
      global_selector(el, ctx, able_heading)
      return
    }
    else if (el.classList.contains("mod-footer")){
      global_selector(el, ctx, able_heading)
      return
    }
  }
}

/** 将html还原回md格式
 * 被processTextSection调用
 */
const getSourceMarkdown = (
  sectionEl: HTMLElement,
  ctx: MarkdownPostProcessorContext,
): {
  header: string, 
  content: string, 
  info:MarkdownSectionInformation,
  is_end:boolean
}|null => {
  let info = ctx.getSectionInfo(sectionEl);     // info: MarkdownSectionInformation | null
  if (info) {
    const { text, lineStart, lineEnd } = info;  // 分别是：全文文档、div的开始行、div的结束行
    const list_text = text.replace(/(\s*$)/g,"").split("\n")   // @attension 去除尾部空格否则无法判断 is_end，头部不能去除否则会错位
    const text_content = list_text.slice(lineStart, lineEnd + 1).join("\n");
    let text_header = lineStart==0?"":list_text[lineStart-1]
    const text_header_match = text_header.match(ABReg.reg_header)
    text_header = text_header_match?text_header_match[2]:""
    return {
      header: text_header,
      content: text_content,
      info: info,
      is_end: list_text.length==lineEnd+1
    }
  }
  // console.warn("获取MarkdownSectionInformation失败，可能会产生bug") // 其实会return void，应该不会有bug
  return null
};


/** 全局选择器，在同一个文档里只渲染一次
 * 失败经验1：
 *      if (pEl.getAttribute("ab-title-flag")=="true")
 *      pEl.setAttribute("ab-title-flag", "true") // f这个好像会被清除掉
 * 失败经验2：
 *      后来发现是到了heading with header以后，此时的pEl.children后面的元素还没渲染出来，自然无法判断什么时候结束
 * 失败经验3：
 *      最后想到用mod-footer作为结束标志，再来启用全局选择器
 *      但好像不一定会有mod-footer和mod-header走这里，有时走有时不走，很烦。还有缓存机制也很烦
 *      话说我之前弄display:none怎么好像没bug，不过那个是高性能消耗运行多次，而非全局运行一次的……可能bug会少些
 * 失败经验4：
 *      用getSourceMarkdown的end来判断是否可行，好像还可以，比用mod-footer作为标志稳定
 *      但后来又发现这样的话末尾有空格时会有bug，要去除尾部空格（头部不要去除，会错位）
 *      然后还有一个坑：好像有的能选pertent有的不行，用document直接筛会更稳定
 * 后来基于经验4改了下终于成功了
 */
function global_selector(
  el: HTMLElement, 
  ctx: MarkdownPostProcessorContext,
  able_heading:boolean
){
  if (!able_heading) return
  // const pEl = el.parentElement    // 这里无法获取parentElement
  const pEl = document.querySelectorAll(".workspace-leaf.mod-active .markdown-preview-section")[0]
  if (!pEl) return
  let prev_header = ""
  let prev_el:HTMLElement|null = null
  let prev_from_line:number = 0
  let prev_heading_level:number = 0
  for (let i=0; i<pEl.children.length; i++){
    const cEl = pEl.children[i] as HTMLElement
    if (cEl.classList.contains("mod-header") 
      || cEl.classList.contains("markdown-preview-pusher")) continue
    if (cEl.classList.contains("mod-footer")) break
    if (prev_heading_level == 0) {      // 寻找开始标志
      if (!cEl.children[0] || !(cEl.children[0] instanceof HTMLHeadingElement)) continue
      const mdSrc = getSourceMarkdown(cEl, ctx)
      if (!mdSrc) continue
      if (mdSrc.header=="") continue
      const match = mdSrc.content.match(ABReg.reg_heading)
      if (!match) continue
      prev_heading_level = match[1].length
      prev_header = mdSrc.header
      prev_from_line = mdSrc.info.lineStart
      prev_el = cEl.children[0] // 就是标题那级
    }
    else {                            // 寻找结束标志
      if (!cEl.children[0]){  // .mod-footer会触发这一层
        cEl.setAttribute("style", "display: none")
        continue
      }
      if (!(cEl.children[0] instanceof HTMLHeadingElement)){
        cEl.setAttribute("style", "display: none")
        continue
      }
      const mdSrc = getSourceMarkdown(cEl, ctx)
      if (!mdSrc) {
        cEl.setAttribute("style", "display: none")
        continue
      }
      const match = mdSrc.content.match(ABReg.reg_heading)
      if (!match){
        cEl.setAttribute("style", "display: none")
        continue
      }
      if (match[1].length >= prev_heading_level){  // 【改】可选同级
        cEl.setAttribute("style", "display: none")
        continue
      }

      // 渲染
      const cEl_last = pEl.children[i-1] as HTMLElement   // 回溯到上一个
      const mdSrc_last = getSourceMarkdown(cEl_last, ctx)
      if (!mdSrc_last) {
        console.warn("标题选择器结束时发生意外情况")
        return
      }
      const header = prev_header??"md"
      const content = mdSrc_last.info.text.split("\n")
        .slice(prev_from_line, mdSrc_last.info.lineEnd+1).join("\n");
      if(prev_el) ctx.addChild(new RelpaceRender(prev_el, header, content));

      prev_header = ""
      prev_from_line = 0
      prev_heading_level = 0
      prev_el = null
      i-- /** 回溯一步，@bug 下一个标题的header行会被上一个隐藏 */
    }
  }
  if (prev_heading_level > 0){ /** 循环尾调用（@attention 注意：有个.mod-footer，所以不能用最后一个!）*/
    const i = pEl.children.length-1
    // 渲染
    const cEl_last = pEl.children[i-1] as HTMLElement /** @bug 可能有bug，这里直接猜使用倒数第二个 */
    const mdSrc_last = getSourceMarkdown(cEl_last, ctx)
    if (!mdSrc_last) {
      console.warn("标题选择器结束时发生意外情况")
      return
    }
    const header = prev_header??"md"
    const content = mdSrc_last.info.text.trim().split("\n")
      .slice(prev_from_line, mdSrc_last.info.lineEnd+1).join("\n");
    if(prev_el) ctx.addChild(new RelpaceRender(prev_el, header, content));
  }
}
