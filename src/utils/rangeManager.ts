import {EditorView, Decoration} from "@codemirror/view"
import {Extension} from "@codemirror/state"
import {Editor} from 'obsidian';

import { ABReplaceWidget } from "../replace/replaceWidget"
import { registerReplace } from 'src/replace/registerReplace';

// 匹配关键字接口
export interface SpecKeyword {
  from: number,
  to: number,
  keyword: string,
  match: string
}

/** AnyBlock范围管理器
 * 一段文字可以生成一个实例
 * 一次性使用
 */
export class ABRangeManager{
  _specKeywords:SpecKeyword[]
  mdText: string = ""

  constructor(mdText: string){
    this.mdText = mdText
    this._specKeywords = this.blockMatch_keyword()
  }

  public get specKeywords(){
    return this._specKeywords
  }

  protected blockMatch_keyword(): SpecKeyword[]{
    throw("Error: 没有重载 ABRangeManager::blockMatch_keyword")
  }

  decoration_line():Decoration{
    throw("Error: 没有重载 ABRangeManager::decoration_line")
  }

  decoration_block(text:string, from:number, to:number, editor:Editor):Decoration{
    throw("Error: 没有重载 ABRangeManager::decoration_block")
  }

  static decoration_theme():Extension{
    throw("Error: 没有重载 ABRangeManager::decoration_theme")
  }
}

class ABRangeManager_brace extends ABRangeManager {
  reg_k1: RegExp
  reg_k2: RegExp
  list_reg: RegExp[]
  reg_total: RegExp

  /** 块 - 匹配关键字 */
  protected blockMatch_keyword(): SpecKeyword[] {
    this.reg_k1 = /^%{/gmi
    this.reg_k2 = /^%}/gmi
    this.list_reg = [this.reg_k1, this.reg_k2]
    this.reg_total = new RegExp(this.list_reg.map((pattern) => pattern.source).join("|"), "gmi")

    let listSpecKeyword = this.lineMatch_keyword(this.mdText)
    return this.line2BlockMatch(listSpecKeyword)
  }

  /** 行 - 匹配关键字 */
  private lineMatch_keyword(mdText: string): SpecKeyword[] {
    const matchInfo: SpecKeyword[] = []
    const matchList: RegExpMatchArray|null= mdText.match(this.reg_total);        // 匹配项

    if (!matchList) return []
    let prevIndex = 0
    for (const matchItem of matchList){
      const from2 = mdText.indexOf(matchItem, prevIndex)
      const to2 = from2 + matchItem.length;
      prevIndex = to2;
      let reg_match // 匹配的正则项
      for (let reg in this.list_reg){
        if (matchItem.match(reg)) {reg_match = reg; break;}
      }
      matchInfo.push({
        from: from2,
        to: to2,
        keyword: matchItem,
        match: String(reg_match)
      })
    }
    return matchInfo
  }

  /** 转化 - 匹配关键字 */
  private line2BlockMatch(listSpecKeyword: SpecKeyword[]): SpecKeyword[]{
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

  decoration_line(){
    return Decoration.mark({class: "ab-line-brace"})
  }

  decoration_block(text:string, from:number, to:number, editor:Editor){
    return Decoration.replace({widget: new ABReplaceWidget(text, from, to, editor)})
  }

  static decoration_theme(){
    return EditorView.baseTheme({
      ".ab-line-brace": { textDecoration: "underline 3px red" }
    })
  }
}

class ABRangeManager_list extends ABRangeManager{
  protected blockMatch_keyword(): SpecKeyword[] {
    return [{
      from: 5,
      to: 10,
      keyword: "",
      match: ""
    }]
  }

  decoration_line(){
    return Decoration.mark({class: "ab-line-list"})
  }

  decoration_block(text:string, from:number, to:number, editor:Editor){
    return Decoration.replace({widget: new ABReplaceWidget(text, from, to, editor)})
  }

  static decoration_theme(){
    return EditorView.baseTheme({
      ".ab-line-list": { textDecoration: "underline 3px cyan" }
    })
  }
}

// 总结构思考
/*
ABRange[]
[
  {
    type: 范围类别1
    rangeSet: SpecKeyword[]
  },
  {
    type: 范围类别2
    rangeSet: SpecKeyword[]
  }
]*/

/** 管理器列表。
 * 暂不支持注册的方式扩展添加 */
export const list_ABManager=[
  ABRangeManager_brace,
  ABRangeManager_list
]
