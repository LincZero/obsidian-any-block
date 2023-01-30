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

  decoration_block(text:string, item:SpecKeyword, editor:Editor):Decoration{
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

    let listSpecKeyword = this.lineMatch_keyword()
    return this.line2BlockMatch(listSpecKeyword)
  }

  /** 行 - 匹配关键字 */
  private lineMatch_keyword(): SpecKeyword[] {
    const matchInfo: SpecKeyword[] = []
    const matchList: RegExpMatchArray|null= this.mdText.match(this.reg_total);        // 匹配项

    if (!matchList) return []
    let prevIndex = 0
    for (const matchItem of matchList){
      const from2 = this.mdText.indexOf(matchItem, prevIndex)
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

  decoration_block(text:string, item:SpecKeyword, editor:Editor){
    const from = item.from
    const to = item.to
    return Decoration.replace({widget: new ABReplaceWidget(
      text.substring(2, text.length-2).trim(), from, to, editor
    )})
  }

  static decoration_theme(){
    return EditorView.baseTheme({
      ".ab-line-brace": { textDecoration: "underline 3px red" }
    })
  }
}

class ABRangeManager_list extends ABRangeManager{
  reg_list: RegExp

  protected blockMatch_keyword(): SpecKeyword[] {
    this.reg_list = /^\s*?-\s(.*)$/
    return  this.lineMatch_keyword()
  }

  private lineMatch_keyword(): SpecKeyword[] {
    /** 行数 - total_ch 映射表
     * 该表的长度是 行数+1
     * map_line_ch[i] = 序列i行最前面的位置
     * map_line_ch[i+1]-1 = 序列i行最后面的位置
     */
    let map_line_ch:number[] = [0]
    let matchInfo2:{line_from:number, line_to:number}[] = []
    const list_text = this.mdText.split("\n")
    let is_list_mode = false  // 是否在列表中
    let prev_list_from = 0    // 在列表中时，在哪开始
    for (let i=0; i<list_text.length; i++){
      map_line_ch.push(map_line_ch[map_line_ch.length-1]+list_text[i].length+1)
      
      if (this.reg_list.test(list_text[i])){  // 该行是列表
        if (is_list_mode) continue            // 已经进入列表中
        else{
          prev_list_from = i
          is_list_mode = true
          continue
        }
      }
      else if (/^\s+?\S/.test(list_text[i])){ // 开头有缩进
        continue
      }
      else {                                  // 该行不是列表
        if (is_list_mode) {                   // 已经进入列表中
          matchInfo2.push({
            line_from: prev_list_from,
            line_to: i
          })
          is_list_mode = false
        }
        continue
      }
    }
    if (is_list_mode){                        // 结束循环收尾
      matchInfo2.push({
        line_from: prev_list_from,
        line_to: list_text.length
      })
      is_list_mode = false
    }

    const matchInfo: SpecKeyword[] = []
    for (let item of matchInfo2){
      matchInfo.push({
        from: map_line_ch[item.line_from],
        to: map_line_ch[item.line_to]-1,
        keyword: item.line_from==0?"":list_text[item.line_from], // 列表上一行的内容
        match: "list"
      })
    }

    return matchInfo
  }

  decoration_line(){
    return Decoration.mark({class: "ab-line-list"})
  }

  decoration_block(text:string, item:SpecKeyword, editor:Editor){
    const from = item.from
    const to = item.to
    return Decoration.replace({widget: new ABReplaceWidget("list2mdtable\n"+text, from, to, editor)})
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
