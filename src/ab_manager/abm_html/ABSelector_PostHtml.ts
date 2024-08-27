import html2md from 'html-to-md'
import type {
  MarkdownPostProcessorContext,
  MarkdownSectionInformation
} from "obsidian"

import { ABReg } from "src/config/ABReg"
import { ConfDecoration } from "src/config/ABSettingTab"
import type AnyBlockPlugin from "../../main"
import { ABReplacer_Render } from "./ABReplacer_Render"
import { ABConvertManager } from "src/ABConverter/ABConvertManager"
import { abConvertEvent } from "src/ABConverter/ABConvertEvent";

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
  abConvertEvent(document)
}

let selected_els: HTMLElement[] = [];                   // 正在选择中的元素 (如果未在AB块内，还未开始选择，则为空)
let selected_mdSrc: HTMLSelectorRangeSpec|null = null;  // 已经选中的范围   (如果未在AB块内，还未开始选择，则为空)
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
 * 
 * 因为是逐个片段来判断，所以判断当前片段时，可能是AB块的未激活、开头、中间、结尾。应进行操作：
 * (注意：如果是一个ab块紧接着一个ab块，开头和结尾状态是能同时存在的。先完成结尾操作再完成开头操作)
 * - 未活：不作为/将selected缓存清空
 * - 开头：将selected置为新值
 * - 中间：追加到selected缓存中
 * - 结尾：将selected缓存渲染、清空
 * - 取消：将selected缓存清空
 */
function findABBlock_cross(targetEl: HTMLElement, ctx: MarkdownPostProcessorContext){
  // 寻找AB块
  const current_mdSrc = getSourceMarkdown(targetEl, ctx)
  if (!current_mdSrc) { return false }

  // c1. 在AB块内。则判断本次是否结束ab块
  if (selected_mdSrc && selected_mdSrc.header) {
    // b3. 文章末尾，强制结尾
    // TODO

    // b1. 没有startFlag
    if (!selected_mdSrc.seFlag) {
      // b11. 无需endFlag，清空并渲染
      if (current_mdSrc.type == "list" || current_mdSrc.type == "code" || current_mdSrc.type == "quote" || current_mdSrc.type == "table") {
        if (current_mdSrc.type=="list"){ // 语法糖 TODO 将弃用
          if (current_mdSrc.header.indexOf("2")==0) current_mdSrc.header="list"+current_mdSrc.header
        }
        selected_els.push(targetEl); selected_mdSrc.to_line = current_mdSrc.to_line; selected_mdSrc.content += "\n\n" + current_mdSrc.content; // 追加到selected缓存
        const replaceEl = selected_els.pop()!; if (replaceEl) {ctx.addChild(new ABReplacer_Render(replaceEl, selected_mdSrc.header, selected_mdSrc.content.split("\n").slice(2,).join("\n"), selected_mdSrc.type)); for (const el of selected_els) {el.hide()}; selected_mdSrc = null; selected_els = []; } // 将selected缓存输出渲染
      }
      // b12. 找到startFlag，后面找endFlag
      else if (current_mdSrc.type == "heading" || current_mdSrc.type == "mdit_head") {
        selected_els.push(targetEl); selected_mdSrc.to_line = current_mdSrc.to_line; selected_mdSrc.content += "\n\n" + current_mdSrc.content; // 追加到selected缓存
        selected_mdSrc.seFlag = current_mdSrc.seFlag
      }
      // b13. 找不到startFlag，放弃本次AnyBlock
      else {
        selected_mdSrc = null; selected_els = [];
      }
    }
    // b2. 有startFlag，寻找endFlag
    else {
      if ((current_mdSrc.type == "mdit_tail" || current_mdSrc.type == "mdit_head") && selected_mdSrc!.seFlag.length == current_mdSrc.seFlag.length) {
        selected_els.push(targetEl); selected_mdSrc.to_line = current_mdSrc.to_line; selected_mdSrc.content += "\n\n" + current_mdSrc.content; // 追加到selected缓存
        const replaceEl = selected_els.pop()!; if (replaceEl) {ctx.addChild(new ABReplacer_Render(replaceEl, selected_mdSrc.header, selected_mdSrc.content.split("\n").slice(2, -1).join("\n"), selected_mdSrc.type)); for (const el of selected_els) {el.hide()}; selected_mdSrc = null; selected_els = []; } // 将selected缓存输出渲染 (注意减了末尾的:::)
      }
      else if (current_mdSrc.type == "heading" && selected_mdSrc!.seFlag.length > current_mdSrc.seFlag.length) {
        const replaceEl = selected_els.pop()!; if (replaceEl) {ctx.addChild(new ABReplacer_Render(replaceEl, selected_mdSrc.header, selected_mdSrc.content.split("\n").slice(2,).join("\n"), selected_mdSrc.type)); for (const el of selected_els) {el.hide()}; selected_mdSrc = null; selected_els = []; } // 将selected缓存输出渲染
      }
      else {
        selected_els.push(targetEl); selected_mdSrc.to_line = current_mdSrc.to_line; selected_mdSrc.content += "\n\n" + current_mdSrc.content; // 追加到selected缓存
      }
    }
  }

  // c2. 不在AB块内。则判断本次是否开始AB块 (注意结束和开始可以同时进行)
  if (!selected_mdSrc || !selected_mdSrc.header) {
    // b1. 现在开始
    if (current_mdSrc.type == "header" || current_mdSrc.type == "mdit_head") {
      selected_mdSrc = current_mdSrc; selected_els = [targetEl];
    }
    // b2. 还没开始
    else {
      selected_mdSrc = null; selected_els = [];
    }
  }
}

interface HTMLSelectorRangeSpec {
  // 通用部分
  from_line: number,  // div片段的头部
  to_line: number,    // div片段的尾部 - 可变
  to_line_all: number // 全文片段的尾部 (已去除尾部空格) 当 to_line_all == to_line，说明片段在文章的结尾了
  content: string,    // 内容信息 - 可变 (已去除尾部空格)
  type: string,       // 类型。6个el基本类型的基础上，paragraph多派生出 "header"/"mdit_head"/"mdit_tail" 三个新类型

  // 选择器部分
  header: string,     // 头部信息
  seFlag: string,     // 开始/结束标志 - 可变
                      //     对于nowMdSrc来说，这是当前标志，对于selectedMdSrc来说，这是结束标志
                      //     内敛选择器 (如标题选择器和mdit `:::`) 才会用到，块选择器不需要使用
  prefix: string,     // 选择器的前缀 (为了去除前缀后再进行渲染)
}
/**
 * 将html还原回md格式。
 * 
 * 不负责对ab块的判断，只负责分析当前这一段html (旧版是负责对ab块判断的，新版职责分离了)
 * 
 * @detail
 * 被processTextSection调用
 * 
 * @returns
 * (旧) 三种结果
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
      to_line_all: 1,
      content: "",
      type: "",

      header: "",
      seFlag: "",
      prefix: "",
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
    range.to_line_all = list_text.length+1
    range.content = list_content.join("\n")

    // 找类型、找前缀
    if (sectionEl instanceof HTMLUListElement) {
      range.type = "list"
      const match = list_content[0].match(ABReg.reg_list)
      if (!match) return range
      range.prefix = match[1]
    }
    else if (sectionEl instanceof HTMLQuoteElement) {
      range.type = "quote"
      const match = list_content[0].match(ABReg.reg_quote)
      if (!match) return range
      range.prefix = match[1]
    }
    else if (sectionEl instanceof HTMLPreElement) {
      range.type = "code"
      const match = list_content[0].match(ABReg.reg_code)
      if (!match) return range
      range.prefix = match[1]
    }
    else if (sectionEl instanceof HTMLTableElement) {
      range.type = "table"
      const match = list_content[0].match(ABReg.reg_table)
      if (!match) return range
      range.prefix = match[1]
    }
    else if (sectionEl instanceof HTMLHeadingElement) {
      range.type = "heading"
      const match = list_content[0].match(ABReg.reg_heading)
      if (!match) return range
      range.seFlag = match[3]
    }
    else if (sectionEl instanceof HTMLParagraphElement) { // mdit/ab_header
      range.type = "paragraph"
      const match_header = list_content[0].match(ABReg.reg_header)
      const match_mdit_head = list_content[0].match(ABReg.reg_mdit_head)
      const match_mdit_tail = list_content[0].match(ABReg.reg_mdit_tail)
      if (match_header) {
        range.type = "header"
        range.prefix = match_header[1]
        range.header = match_header[5]
      } else if (match_mdit_head) {
        range.type = "mdit_head"
        range.prefix = match_mdit_head[1]
        range.seFlag = match_mdit_head[3]
        range.header = match_mdit_head[4]
      } else if (match_mdit_tail) {
        range.type = "mdit_tail"
        range.prefix = match_mdit_tail[1]
        range.seFlag = match_mdit_tail[3]
      }
    } else {
      range.type = "other"
    }

    // 旧版本方法。从文本中向上查找。如果找到了，last_el 属性缓存了 header 所对应的 el，便可以将其删掉。缺点是无法使用部分选择器 (标题和mdit)
    // 找头部header
    // let match_header
    // if (lineStart==0) { // 1. 没有上行
    //   return range
    // } else if (lineStart>2 && list_text[lineStart-1].trim()=="") { // 2. 找上上行
    //   if (list_text[lineStart-2].indexOf(range.prefix)!=0) return range
    //   match_header = list_text[lineStart-2].replace(range.prefix, "").match(ABReg.reg_header)
    // } else { // 3. 找上一行
    //   if (lineStart>1 && list_text[lineStart-1].indexOf(range.prefix)!=0 && list_text[lineStart-1].trim()=="") return range
    //   match_header = list_text[lineStart-1].replace(range.prefix, "").match(ABReg.reg_header)
    // }
    // if (!match_header) return range
    // range.header = match_header[5] // （外部通过有无header属性来判断是否是ab块）

    return range
  }
  return null
}
