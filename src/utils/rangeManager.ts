import {EditorView, Decoration, DecorationSet} from "@codemirror/view"
import {Editor} from 'obsidian';

import { ABReplaceWidget } from "../replace/replaceWidget"

// 匹配关键字接口
export interface SpecKeyword {
  from: number,
  to: number,
  keyword: string,
  match: string
}

// 正则
const reg_k1 = /%{/gi
const reg_k2 = /%}/gi
const reg_auto = /^%a/gi
const reg_line = /^%l/gi
const reg_paragraph = /^%p/gi
const list_reg = [reg_k1, reg_k2]
const reg_total = new RegExp(list_reg
  .map((pattern) => pattern.source).join("|"), "gi");	

const rangeReg = {
  reg_k1,
  reg_k2,
  reg_auto,
  reg_line,
  reg_paragraph
}

/** AnyBlock范围管理器 */
export class ABRangeManager{
  /*private specKeywords:SpecKeyword[]

  constructor(mdText: string){
    this.specKeywords = ABRangeManager.blockMatch_keyword(mdText)
  }*/

  // 块 - 匹配关键字
  static blockMatch_keyword(mdText: string): SpecKeyword[] {
    let listSpecKeyword = this.lineMatch_keyword(mdText)
    return this.line2BlockMatch(listSpecKeyword)
  }

  // 行 - 匹配关键字
  private static lineMatch_keyword(mdText: string): SpecKeyword[] {
    const matchInfo: SpecKeyword[] = []
    const matchList: RegExpMatchArray|null= mdText.match(reg_total);        // 匹配项

    if (!matchList) return []
    let prevIndex = 0
    for (const matchItem of matchList){
      const from2 = mdText.indexOf(matchItem, prevIndex)
      const to2 = from2 + matchItem.length;
      prevIndex = to2;
      let match2
      for (let reg of list_reg){
        if (matchItem.match(reg)) {match2 = reg; break;}
      }
      matchInfo.push({
        from: from2,
        to: to2,
        keyword: matchItem,
        match: String(match2)
      })
    }
    return matchInfo
  }

  // 转化 - 匹配关键字
  private static line2BlockMatch(listSpecKeyword: SpecKeyword[]): SpecKeyword[]{
    let countBracket = 0  // 括号计数
    let prevBracket = []  // 括号栈
    let listSpecKeyword_new = []
    for (const matchItem of listSpecKeyword) {
      if (matchItem.keyword=="%{") {
        countBracket++
        prevBracket.push(matchItem.from)
      }
      else if(matchItem.keyword=="%}" && countBracket>0) {
        countBracket--
        listSpecKeyword_new.push({
          from: prevBracket.pop() as number,
          to: matchItem.to,
          keyword: "",
          match: "%{}"
        })
      }
    }
    return listSpecKeyword_new
  }

  static decoration_line(){
    return Decoration.mark({class: "ab-underline"})
  }

  static decoration_block(text:string, from:number, to:number, editor:Editor){
    return Decoration.replace({widget: new ABReplaceWidget(text, from, to, editor)})
  }
}
