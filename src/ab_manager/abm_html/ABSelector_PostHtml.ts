import html2md from 'html-to-md'
import type {
  MarkdownPostProcessorContext,
  MarkdownSectionInformation
} from "obsidian"

import {ABReg} from "src/config/ABReg"
import {ConfDecoration, ConfSelect} from "src/config/ABSettingTab"
import type AnyBlockPlugin from "../../main"
import {ABReplacer_Render} from "./ABReplacer_Render"
import {ABConvertManager} from "src/ABConverter/ABConvertManager"
import { match } from 'assert'

let last_el: HTMLElement;
let last_mdSrc: HTMLSelectorRangeSpec | null;
/**
 * Html处理器
 * 
 * @detail
 * 被调用的可能：
 *   1. 全局html会分为多个块，会被每个块调用一次
 *      多换行会切分块、块类型不同也会切分（哪怕之间没有空行）
 *   2. 局部渲染时，也会被每个渲染项调用一次 (MarkdownRenderer.renderMarkdown方法，感觉tableextend插件也是这个原因)
 *      .markdown-rendered的内容也会调用一次（即本插件中的 .ab-note.drop-shadow 元素）
 *   3. 用根节点createEl时也会被调用一次（.replaceEl）
  *  4. 状态会缓存，如果切换回编辑模式没更改再切回来，不会再次被调用
 * 
 * 总逻辑
 * - 后处理器，附带还原成md的功能
 *   - ~~html选择器~~
 *   - 渲染器
 */
export class ABSelector_PostHtml{
  public static processor(
    this: AnyBlockPlugin,
    el: HTMLElement, 
    ctx: MarkdownPostProcessorContext
  ) {
    // 设置里不启用，直接关了
    if (this.settings.decoration_render==ConfDecoration.none) return

    // 获取el对应的源md
    const mdSrc: HTMLSelectorRangeSpec | null = getSourceMarkdown(el, ctx)
    
    // 1. RenderMarkdown引起的调用（需要嵌套寻找）
    if (!mdSrc) {
      // console.log(" -- ABPosthtmlManager.processor, called by 'ReRender'");
      if (!el.classList.contains("markdown-rendered")) return
      findABBlock_recurve(el)
    }
    // 2. html渲染模式的逐个切割块调用（需要跨切割块寻找）
    // 一个文档会被切割成成div stream，这是一个div数组，每个数组元素会在这里走一遍。即分步渲染，有益于性能优化
    // 其中，每一个div项，一般el.children都是只有一层的，特殊情况是p-br的情况
    else{
      // console.log(" -- ABPosthtmlManager.processor, called by 'ReadMode'
      for (const subEl of el.children) {
        findABBlock_cross(subEl as HTMLElement, ctx)
      }
      last_el = el
      last_mdSrc = mdSrc

      // 弃用
      // 
      // 以前是分两个场景：
      // - 情景一：每次有元素进来时，均执行 findABBlock_cross
      // - 情景二：当div_stream的所有元素进来后，执行 findABBlock_global
      // 
      // 然后场景二就运行这个：
      // if (mdSrc.to_line==mdSrc.content.split("\n").length // 失效，新版本似乎没有这个
      //   || el.classList.contains("mod-footer")            // 失效，新版本似乎没有这个
      //   || mdSrc.content.trim() == "[end]"                // 手动声明文档结尾，仅调试使用
      // ){
      //   console.log(" -- ABPosthtmlManager.processor, called by 'ReadMode'. And End");
      //   findABBlock_global(el, ctx)
      // } else {
      //   console.log(" -- ABPosthtmlManager.processor, called by 'ReadMode'. And During");
      // }
    }
  }
}

/**
 * 找ab块 - 递归版
 * 
 * @detail
 * 
 * called by 'ReRender'，每次被重渲染时从外部进入一次
 * 特点
 *  1. 递归调用
 */
function findABBlock_recurve(targetEl: HTMLElement){
  /** @fail 原来的想法无法成立……这里本来打算用来递归寻找嵌套的ab块的，
   * 但好像不行，ctx.getSectionInfo 他获取不了嵌套中el的start和end位置
   * 判断是否有header并替换元素 */
  /*if(replaceABBlock(targetEl, ctx)) return
  else if(!(targetEl instanceof HTMLPreElement)) {
    for (let targetEl2 of targetEl.children){
      findABBlock(targetEl2 as HTMLElement, ctx)
    }
  }*/

  // replaceABBlock(targetEl, ctx)
  // console.log("hook 准备再渲染", targetEl)

  // 遍历Elements
  for(let i=0; i<targetEl.children.length; i++){  // start form 0，因为可以递归，该层不一定需要header
    // 1. 寻找正体 (列表/代码块/引用块/表格)
    const contentEl = targetEl.children[i] as HTMLDivElement
    if (!(contentEl instanceof HTMLUListElement
      || contentEl instanceof HTMLQuoteElement
      || contentEl instanceof HTMLPreElement
      || contentEl instanceof HTMLTableElement
    )) continue
    // @todo （首尾选择器的header较特殊，另外处理）
    // if (subEl instanceof HTMLParagraphElement){
    //   const m_headtail = subEl.getText().match(ABReg.reg_headtail)
    //   if (!m_headtail) return
    //   
    // }
    
    // 2. 寻找头部 (查看正体的上面是不是AB选择头)
    const headerEl = i==0?null:targetEl.children[i-1] as HTMLElement|null
    if(i==0 || !(headerEl instanceof HTMLParagraphElement)) {
      if(contentEl instanceof HTMLUListElement
        || contentEl instanceof HTMLQuoteElement
      ) findABBlock_recurve(contentEl);
      continue
    }
    const header_match = headerEl.getText().match(ABReg.reg_header)
    if (!header_match) {
      if(contentEl instanceof HTMLUListElement
        || contentEl instanceof HTMLQuoteElement
      ) findABBlock_recurve(contentEl);
      continue
    }
    const header_str = header_match[5]

    // 3. 渲染，元素替换
    //const newEl = targetEl.createDiv({cls: "ab-re-rendered"})
    const newEl = document.createElement("div")
    newEl.addClass("ab-re-rendered")
    headerEl.parentNode?.insertBefore(newEl, headerEl.nextSibling)
    ABConvertManager.autoABConvert(newEl, header_str, html2md(contentEl.innerHTML), "postHtml")
    contentEl.hide()
    headerEl.hide()
  }
}

/**
 * 找ab块 - 跨切割块版
 * 
 * @detail
 * 
 * called by 'ReadMode1'，在同一个文档里处理多次
 * 
 * 特点：
 *  1. 跨越AB优化的切割块来寻找
 *  2. 只为在根部的AB块，使用 MarkdownRenderChild 进行渲染
 *  3. 只寻找在根部的AB块？？？（对，目前对这个功能失效）
 */
function findABBlock_cross(targetEl: HTMLElement, ctx: MarkdownPostProcessorContext){
  if (targetEl instanceof HTMLUListElement
    || targetEl instanceof HTMLQuoteElement
    || targetEl instanceof HTMLPreElement
    || targetEl instanceof HTMLTableElement
  ) {
    replaceABBlock(targetEl, ctx)
  }

  /**
   * 尝试转化el
   * 判断是否有header并替换元素
   */
  function replaceABBlock(targetEl: HTMLElement, ctx: MarkdownPostProcessorContext){
    // 检查头部
    const range = getSourceMarkdown(targetEl, ctx)
    if (!range || !range.header) return false

    // 语法糖 TODO 将弃用
    if (range.selector=="list"){
      if (range.header.indexOf("2")==0) range.header="list"+range.header
    }

    // 渲染
    ctx.addChild(new ABReplacer_Render(targetEl, range.header, range.content, range.selector));
    last_el.hide()
  }
}

/**
 * (已弃用) 找AB块 - 全局选择器版
 * 
 * @detail
 * 
 * called by 'ReadMode2'，在同一个文档里只在最后处理一次
 * 
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
 * 
 * 备注
 * page/pEl是整个文档
 * div/cEl是文档的根div，类型总为div
 * content/sub/(cEl.children)是有可能为p table这些元素的东西
 */
/*function findABBlock_global(
  el: HTMLElement, 
  ctx: MarkdownPostProcessorContext
){
  // const pEl = el.parentElement    // 这里无法获取parentElement
  const pageEl = document.querySelectorAll(".workspace-leaf.mod-active .markdown-preview-section")[0]
  if (!pageEl) return
  let prev_header = ""                // 头部信息
  let prev_el:HTMLElement|null = null // 选中第一个标题，作用是用来替换为repalce块
  let prev_from_line:number = 0       // 开始行
  let prev_heading_level:number = 0   // 上一个标题的等级
  for (let i=0; i<pageEl.children.length; i++){
    const divEl = pageEl.children[i] as HTMLElement
    if (divEl.classList.contains("mod-header") 
      || divEl.classList.contains("markdown-preview-pusher")) continue
    if (divEl.classList.contains("mod-footer")) break
    // 寻找已经处理过的局部选择器，并……
    (()=>{
      if (!divEl.children[0]) return
      const subEl:any = divEl.children[0]
      if (!(subEl instanceof HTMLElement) || !subEl.classList.contains("ab-replace")) return
      // 隐藏局部选择器的header块
      const divEl_last = pageEl.children[i-1] as HTMLElement
      if (divEl_last.children.length != 1) return
      const subEl_last = divEl_last.children[0]
      if (subEl_last
        && subEl_last instanceof HTMLParagraphElement
        && ABReg.reg_header.test(subEl_last.getText())
      ){
        divEl_last.setAttribute("style", "display: none")
      }
    })()
    if (prev_heading_level == 0) {      // 寻找开始标志
      if (!divEl.children[0] || !(divEl.children[0] instanceof HTMLHeadingElement)) continue
      const mdSrc = getSourceMarkdown(divEl, ctx)
      if (!mdSrc) continue
      if (mdSrc.header=="") continue
      const match = mdSrc.content.match(ABReg.reg_heading)
      if (!match) continue
      prev_heading_level = match[1].length
      prev_header = mdSrc.header
      prev_from_line = mdSrc.from_line
      prev_el = divEl.children[0] // 就是标题那级
      // 隐藏全局选择器的header块
      const divEl_last = pageEl.children[i-1] as HTMLElement
        if (divEl_last.children.length == 1){
        const contentEl_last = divEl_last.children[0]
        if (contentEl_last
          && contentEl_last instanceof HTMLParagraphElement
          && ABReg.reg_header.test(contentEl_last.getText())
        ){
          divEl_last.setAttribute("style", "display: none")
        }
      }
    }
    else {                            // 寻找结束标志
      if (!divEl.children[0]){  // .mod-footer会触发这一层
        divEl.setAttribute("style", "display: none")
        continue
      }
      if (!(divEl.children[0] instanceof HTMLHeadingElement)){
        divEl.setAttribute("style", "display: none")
        continue
      }
      const mdSrc = getSourceMarkdown(divEl, ctx)
      if (!mdSrc) {
        divEl.setAttribute("style", "display: none")
        continue
      }
      const match = mdSrc.content.match(ABReg.reg_heading)
      if (!match){
        divEl.setAttribute("style", "display: none")
        continue
      }
      if (match[1].length >= prev_heading_level){  // 【改】可选同级
        divEl.setAttribute("style", "display: none")
        continue
      }

      // 渲染
      const cEl_last = pageEl.children[i-1] as HTMLElement   // 回溯到上一个
      const mdSrc_last = getSourceMarkdown(cEl_last, ctx)
      if (!mdSrc_last) {
        console.warn("标题选择器结束时发生意外情况")
        return
      }
      
      const header = prev_header??"md"
      const content = mdSrc_last.content.split("\n")
        .slice(prev_from_line, mdSrc_last.to_line).join("\n");
      if(prev_el) ctx.addChild(new ABReplacer_Render(prev_el, header, content));

      prev_header = ""
      prev_from_line = 0
      prev_heading_level = 0
      prev_el = null
      i-- // 回溯一步，@bug 下一个标题的header行会被上一个隐藏
    }
  }
  if (prev_heading_level > 0){ // 循环尾调用（@attention 注意：有个.mod-footer，所以不能用最后一个!）
    const i = pageEl.children.length-1
    // 渲染
    const cEl_last = pageEl.children[i-1] as HTMLElement // @bug 可能有bug，这里直接猜使用倒数第二个
    const mdSrc_last = getSourceMarkdown(cEl_last, ctx)
    if (!mdSrc_last) {
      console.warn("标题选择器结束时发生意外情况")
      return
    }
    const header = prev_header??"md"
    const content = mdSrc_last.content.trim().split("\n")
      .slice(prev_from_line, mdSrc_last.to_line).join("\n");
    if(prev_el) ctx.addChild(new ABReplacer_Render(prev_el, header, content));
  }
}*/

interface HTMLSelectorRangeSpec {
  from_line: number,// 替换范围
  to_line: number,  // .
  header: string,   // 头部信息
  selector: string, // 选择器（范围选择方式）
  content: string,  // 内容信息（已去除尾部空格）
  prefix: string,
}
/**
 * 将html还原回md格式
 * 
 * @detail
 * 被processTextSection调用
 * 
 * @returns 三种结果
 *  1. 获取info失败：返回null
 *  2. 获取info成功，满足ab块条件：返回HTMLSelectorRangeSpec
 *  3. 获取info成功，不满足ab块：  返回HTMLSelectorRangeSpec，但header为""
 */
function getSourceMarkdown(
  sectionEl: HTMLElement,
  ctx: MarkdownPostProcessorContext,
): HTMLSelectorRangeSpec|null {
  let info = ctx.getSectionInfo(sectionEl);     // info: MarkdownSectionInformation | null
  if (info) {
    let range:HTMLSelectorRangeSpec = {
      from_line: 0,
      to_line: 1,
      header: "",
      selector: "none",
      content: "",
      prefix: ""
    }

    // 基本信息
    const { text, lineStart, lineEnd } = info;  // 分别是：全文文档、div的开始行、div的结束行（结束行是包含的，+1才是不包含）
    const list_text = text.replace(/(\s*$)/g,"").split("\n")
    const list_content = list_text.slice(lineStart, lineEnd + 1)   // @attension 去除尾部空格否则无法判断 is_end，头部不能去除否则会错位
    range.from_line = lineStart
    range.to_line = lineEnd+1
    range.content = list_content.join("\n");

    // 找类型、找前缀
    if (sectionEl instanceof HTMLUListElement) {
      range.selector = "list"
      const match = list_content[0].match(ABReg.reg_list)
      if (!match) return range
      else range.prefix = match[1]
    }
    else if (sectionEl instanceof HTMLQuoteElement) {
      range.selector = "quote"
      const match = list_content[0].match(ABReg.reg_quote)
      if (!match) return range
      else range.prefix = match[1]
    }
    else if (sectionEl instanceof HTMLPreElement) {
      range.selector = "code"
      const match = list_content[0].match(ABReg.reg_code)
      if (!match) return range
      else range.prefix = match[1]
    }
    else if (sectionEl instanceof HTMLHeadingElement) {
      range.selector = "heading"
      const match = list_content[0].match(ABReg.reg_heading)
      if (!match) return range
      else range.prefix = match[1]
    }
    else if (sectionEl instanceof HTMLTableElement) {
      range.selector = "heading"
      const match = list_content[0].match(ABReg.reg_table)
      if (!match) return range
      else range.prefix = match[1]
    }

    // 找头部header
    let match_header
    if (lineStart==0) { // 1. 没有上行
      return range
    } else if (lineStart>2 && list_text[lineStart-1].trim()=="") { // 2. 找上上行
      if (list_text[lineStart-2].indexOf(range.prefix)!=0) return range
      match_header = list_text[lineStart-2].replace(range.prefix, "").match(ABReg.reg_header)
    } else { // 3. 找上一行
      if (lineStart>1 && list_text[lineStart-1].indexOf(range.prefix)!=0 && list_text[lineStart-1].trim()=="") return range
      match_header = list_text[lineStart-1].replace(range.prefix, "").match(ABReg.reg_header)
    }
    // （必须是最后一步，通过有无header来判断是否是ab块）
    if (!match_header) return range
    range.header = match_header[5]
    return range
  }
  // console.warn("获取MarkdownSectionInformation失败，可能会产生bug") // 其实会return void，应该不会有bug
  return null
}
