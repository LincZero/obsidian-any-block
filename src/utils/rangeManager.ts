import { EditorPosition } from 'obsidian'

/** 匹配关键字接口 
 * 范围内容 = mdText.text.substring(2, text.length-2).trim()
 */
export interface RangeSpec {
  from: number,     // 替换范围1
  to: number,       // 替换范围2
  keyword: string,  // 关键字参数
  match: string,    // 范围选择方式
}

/** AnyBlock范围管理器
 * 一段文字可以生成一个实例
 * 一次性使用
 */
export class ABRangeManager{
  mdText: string = ""     // 全文文本
  /** 行数 - total_ch 映射表
   * 该表的长度是 行数+1
   * map_line_ch[i] = 序列i行最前面的位置
   * map_line_ch[i+1]-1 = 序列i行最后面的位置
   */
  map_line_ch: number[]  // line-ch 映射表
  _specKeywords:RangeSpec[]
  public get specKeywords(){
    return this._specKeywords
  }

  constructor(mdText: string){
    this.mdText = mdText

    this.map_line_ch = [0]
    let count_ch = 0
    for (let line of mdText.split("\n")){
      count_ch = count_ch + line.length + 1
      this.map_line_ch.push(count_ch)
    }
    
    this._specKeywords = this.blockMatch_keyword()
  }

  protected blockMatch_keyword(): RangeSpec[]{
    throw("Error: 没有重载 ABRangeManager::blockMatch_keyword")
  }
}

class ABRangeManager_brace extends ABRangeManager {
  reg_k1: RegExp
  reg_k2: RegExp
  list_reg: RegExp[]
  reg_total: RegExp

  /** 块 - 匹配关键字 */
  protected blockMatch_keyword(): RangeSpec[] {
    this.reg_k1 = /^%{/gmi
    this.reg_k2 = /^%}/gmi
    this.list_reg = [this.reg_k1, this.reg_k2]
    this.reg_total = new RegExp(this.list_reg.map((pattern) => pattern.source).join("|"), "gmi")

    let listSpecKeyword = this.lineMatch_keyword()
    return this.line2BlockMatch(listSpecKeyword)
  }

  /** 行 - 匹配关键字 */
  private lineMatch_keyword(): RangeSpec[] {
    const matchInfo: RangeSpec[] = []
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
  private line2BlockMatch(listSpecKeyword: RangeSpec[]): RangeSpec[]{
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
          match: "brace"
        })
      }
    }
    return listSpecKeyword_new
  }
}

class ABRangeManager_list extends ABRangeManager{
  reg_list: RegExp

  protected blockMatch_keyword(): RangeSpec[] {
    this.reg_list = /^\s*?-\s(.*)$/
    return  this.lineMatch_keyword()
  }

  private lineMatch_keyword(): RangeSpec[] {
    let matchInfo2:{
      line_from:number, 
      line_to:number,
      list_header:string
    }[] = []
    const list_text = this.mdText.split("\n")
    let list_header = ""
    let is_list_mode = false  // 是否在列表中
    let prev_list_from = 0    // 在列表中时，在哪开始
    for (let i=0; i<list_text.length; i++){
      if (this.reg_list.test(list_text[i])){  // 该行是列表
        if (is_list_mode) continue            // 已经进入列表中
        else{
          if (i!=0 && list_text[i-1].indexOf("list")==0) { // 如果有列表头则加上这个范围
            prev_list_from = i-1
            list_header = list_text[i-1]
          }
          else { prev_list_from = i }
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
            line_to: i,
            list_header: list_header
          })
          is_list_mode = false
          list_header = ""
        }
        continue
      }
    }
    if (is_list_mode){                        // 结束循环收尾
      matchInfo2.push({
        line_from: prev_list_from,
        line_to: list_text.length,
        list_header: list_header
      })
      is_list_mode = false
      list_header = ""
    }

    const matchInfo: RangeSpec[] = []
    for (let item of matchInfo2){
      matchInfo.push({
        from: this.map_line_ch[item.line_from],
        to: this.map_line_ch[item.line_to]-1,
        keyword: item.list_header,
        match: "list"
      })
    }

    return matchInfo
  }
}

/** 管理器列表。
 * 暂不支持注册的方式扩展添加 */
export const list_ABRangeManager=[
  ABRangeManager_brace,
  ABRangeManager_list
]
