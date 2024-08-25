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
let current_selector: string = ""; // 内敛选择器 (如标题选择器和mdit `:::`) 才会用到，块选择器不需要使用
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
    if (this.settings.decoration_render==ConfDecoration.none) return // 若设置里不启用，直接退出
    const mdSrc: HTMLSelectorRangeSpec | null = getSourceMarkdown(el, ctx) // 获取el对应的源md
    
    // b1. RenderMarkdown引起的调用（需要嵌套寻找）
    //     console.log(" -- ABPosthtmlManager.processor, called by 'ReRender'");
    if (!mdSrc) {
      if (!el.classList.contains("markdown-rendered")) return
      findABBlock_recurve(el)
      return
    }

    // b2. html渲染模式的逐个切割块调用（需要跨切割块寻找）
    //     Obsidian后处理机制：一个文档会被切割成成div stream，这是一个div数组，每个数组元素会在这里走一遍。即分步渲染，有益于性能优化
    //     console.log(" -- ABPosthtmlManager.processor, called by 'ReadMode'");
    else{
      // c21. 片段处理 (一个html界面被分成多个片段触发)
      //      其中，每一个subEl项都是无属性的div项，内部才是有效信息。
      //      一般el.children里都是只有一个项 (table/pre等)，只会循环一次。特殊情况是p-br的情况
      for (const subEl of el.children) {
        findABBlock_cross(subEl as HTMLElement, ctx)
      }
      last_el = el
      last_mdSrc = mdSrc
      
      // c22. 末处理钩子 (页面完全被加载后触发)
      //      ~~可-1再比较来上个保险，用可能的重复触发性能损耗换取一点触发的稳定性~~
      if (mdSrc.to_line == mdSrc.to_line_all) {
        findABBlock_end();
      }
    }
  }
}

/**
 * 找ab块 - 递归版 (重渲染触发)
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
  }
  // replaceABBlock(targetEl, ctx)
  // console.log("hook 准备再渲染", targetEl)
  */

  // 遍历Elements
  for(let i=0; i<targetEl.children.length; i++){  // start form 0，因为可以递归，该层不一定需要header
    // 1. 寻找正体 (列表/代码块/引用块/表格)
    const contentEl = targetEl.children[i] as HTMLDivElement
    if (!(contentEl instanceof HTMLUListElement
      || contentEl instanceof HTMLQuoteElement
      || contentEl instanceof HTMLPreElement
      || contentEl instanceof HTMLTableElement
    )) continue

    // TODO 头部选择器不是一个块，要特殊处理
    // || contentEl instanceof HTMLHeadingElement

    // TODO 首尾选择器不是一个块，要特殊处理
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
 * 找ab块 - 末处理 (整个阅读模式html渲染完了后才被触发)
 */
function findABBlock_end() {
  // list2nodes的圆弧调整 (应在onload后再处理)
  const refresh = (d:Element|Document = document) => {
    const list_children = d.querySelectorAll(".ab-nodes-node")
    for (let children of list_children) {
      // 元素准备
      const el_child = children.querySelector(".ab-nodes-children"); if (!el_child) continue
      const el_bracket = el_child.querySelector(".ab-nodes-bracket") as HTMLElement; if (!el_bracket) continue
      const el_bracket2 = el_child.querySelector(".ab-nodes-bracket2") as HTMLElement; if (!el_bracket2) continue
      const childNodes = el_child.childNodes;
      if (childNodes.length < 3) {
        el_bracket.style.setProperty("display", "none")
        el_bracket2.style.setProperty("display", "none")
        continue
      }
      const el_child_first = childNodes[2] as HTMLElement;
      const el_child_last = childNodes[childNodes.length - 1] as HTMLElement;

      // 修改伪类
      if (childNodes.length == 3) {
        el_bracket2.style.setProperty("height", `calc(100% - ${(8+8)/2}px)`);
        el_bracket2.style.setProperty("top", `${8/2}px`);
      } else {
        const heightToReduce = (el_child_first.offsetHeight + el_child_last.offsetHeight) / 2;
        el_bracket2.style.setProperty("height", `calc(100% - ${heightToReduce}px)`);
        el_bracket2.style.setProperty("top", `${el_child_first.offsetHeight/2}px`);
      }
    }
  }
  refresh();
}

/**
 * 找ab块 - 跨切割块版 (阅读模式下按片触发)
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
    // 寻找AB块 (主体正确+头部正确)
    const range = getSourceMarkdown(targetEl, ctx)
    if (!range || !range.header) return false

    // 渲染AB    
    if (range.selector=="list"){ // 语法糖 TODO 将弃用
      if (range.header.indexOf("2")==0) range.header="list"+range.header
    }
    ctx.addChild(new ABReplacer_Render(targetEl, range.header, range.content, range.selector));
    last_el.hide()
  }
}

interface HTMLSelectorRangeSpec {
  from_line: number,  // div片段的头部
  to_line: number,    // div片段的尾部
  header: string,     // 头部信息
  selector: string,   // 选择器 (范围选择方式)
  content: string,    // 内容信息 (已去除尾部空格)
  prefix: string,     // 选择器的前缀
  to_line_all: number // 全文代尾部 (已去除尾部空格) 当 to_line_all == to_line，说明片段在文章的结尾了
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
      prefix: "",
      to_line_all: 1,
    }

    // 基本信息
    const {
      text,       // 全文文档
      lineStart,  // div部分的开始行
      lineEnd     // div部分的结束行（结束行是包含的，+1才是不包含）
    } = info; 
    const list_text = text.replace(/(\s*$)/g,"").split("\n")      // div部分的内容 (去除了尾部空行)
    const list_content = list_text.slice(lineStart, lineEnd + 1)  // div部分的内容。@attension 去除尾部空格否则无法判断 is_end，头部不能去除否则会错位
    range.from_line = lineStart
    range.to_line = lineEnd+1
    range.content = list_content.join("\n")
    range.to_line_all = list_text.length+1

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
      range.selector = "table"
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
