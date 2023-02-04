import {ABReg} from "src/config/abReg"
import {ConfSelect, ABSettingInterface} from "src/config/abSettingTab"

/** 匹配关键字接口 */
export interface MdSelectorSpec {
  from: number,     // 替换范围
  to: number,       // .
  header: string,   // 头不是信息
  selector: string, // 范围选择方式
  content: string   // 内容信息
}

/** 管理器列表 */
// let map_ABMdSelector:Map<string, any>
// 原来ts也有py那样的注册器? 叫类装饰器，但使用这个功能要开一点选项：
// @warning: https://blog.csdn.net/m0_38082783/article/details/127048237
function register_list_mdSelector(name: string){
  return function (target: Function){
    // map_ABMdSelector.set(name, target)
  }
}
// 配置返回列表
export function get_selectors(setting: ABSettingInterface){
  let list_ABMdSelector:any[]=[]
  // if (setting.select_list!=ConfSelect.no) list_ABMdSelector.push(map_ABMdSelector.get("list"))
  // if (setting.select_quote!=ConfSelect.no) list_ABMdSelector.push(map_ABMdSelector.get("quote"))
  // if (setting.select_code!=ConfSelect.no) list_ABMdSelector.push(map_ABMdSelector.get("code"))
  if (setting.select_brace!=ConfSelect.no) list_ABMdSelector.push(ABMdSelector_brace)
  if (setting.select_list!=ConfSelect.no) list_ABMdSelector.push(ABMdSelector_list)
  if (setting.select_quote!=ConfSelect.no) list_ABMdSelector.push(ABMdSelector_quote)
  if (setting.select_code!=ConfSelect.no) list_ABMdSelector.push(ABMdSelector_code)
  if (setting.select_heading!=ConfSelect.no) list_ABMdSelector.push(ABMdSelector_heading)
  return list_ABMdSelector
}

/** AnyBlock范围管理器
 * 一段文字可以生成一个实例，主要负责返回RangeSpec类型
 * 一次性使用
 */
export class ABMdSelector{
  mdText: string = ""     // 全文文本
  /** 行数 - total_ch 映射表
   * 该表的长度是 行数+1
   * map_line_ch[i] = 序列i行最前面的位置
   * map_line_ch[i+1]-1 = 序列i行最后面的位置
   */
  settings: ABSettingInterface
  map_line_ch: number[]  // line-ch 映射表
  _specKeywords:MdSelectorSpec[]
  public get specKeywords(){
    return this._specKeywords
  }

  constructor(mdText: string, settings: ABSettingInterface){
    this.mdText = mdText
    this.settings = settings

    this.map_line_ch = [0]
    let count_ch = 0
    for (let line of mdText.split("\n")){
      count_ch = count_ch + line.length + 1
      this.map_line_ch.push(count_ch)
    }
    
    this._specKeywords = this.blockMatch_keyword()
  }

  protected blockMatch_keyword(): MdSelectorSpec[]{
    throw("Error: 没有重载 ABRangeManager::blockMatch_keyword")
  }
}

@register_list_mdSelector("brace")
class ABMdSelector_brace extends ABMdSelector {
  /** 块 - 匹配关键字 */
  protected blockMatch_keyword(): MdSelectorSpec[] {
    return this.lineMatch_keyword()
  }

   /** 行 - 匹配关键字（非内联） */
   private lineMatch_keyword(): MdSelectorSpec[] {
    const matchInfo: MdSelectorSpec[] = []
    const list_text = this.mdText.split("\n")
    let prev_front_line:number[] = []
    for (let i=0; i<list_text.length; i++){
      if(ABReg.reg_front.test(list_text[i])){       // 前缀
        prev_front_line.push(i)
      }
      else if(ABReg.reg_end.test(list_text[i])){    // 后缀
        if(prev_front_line && prev_front_line.length>0){
          const from_line = prev_front_line.pop()??0 // @warning 有可能pop出来undefine?
          const from = this.map_line_ch[from_line]
          const to = this.map_line_ch[i+1]-1
          matchInfo.push({
            from: from,
            to: to,
            header: list_text[from_line].slice(2,-1),
            selector: "brace",
            content: this.mdText.slice(this.map_line_ch[from_line+1], to-3)
          })
        }
      }
    }
    return matchInfo
  }
}

@register_list_mdSelector("list")
class ABMdSelector_list extends ABMdSelector{

  protected blockMatch_keyword(): MdSelectorSpec[] {
    return  this.lineMatch_keyword()
  }

  private lineMatch_keyword(): MdSelectorSpec[] {
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
      if (!is_list_mode){                     // 选择开始标志
        if (!ABReg.reg_list.test(list_text[i])) continue
        // 尝试找headers
        if (i!=0){
          const header = list_text[i-1].match(ABReg.reg_header)
          if (header){
            prev_list_from = i-1
            list_header = header[2]
            is_list_mode = true
            continue
          }
        }
        // 没有header 不选
        if (this.settings.select_list==ConfSelect.ifhead) continue
        // 没有header 也选
        prev_list_from = i
        list_header = ""
        is_list_mode = true
        continue
      }
      else {                                  // 选择结束标志
        if (ABReg.reg_list.test(list_text[i])) continue // 列表
        if (/^\s+?\S/.test(list_text[i])) continue      // 开头有缩进
        if (/^\s*$/.test(list_text[i])) continue        // 空行
        matchInfo2.push({
          line_from: prev_list_from,
          line_to: i,
          list_header: list_header
        })
        is_list_mode = false
        list_header = ""
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

    const matchInfo: MdSelectorSpec[] = []
    for (let item of matchInfo2){
      const from = this.map_line_ch[item.line_from]
      const to = this.map_line_ch[item.line_to]-1
      matchInfo.push({
        from: from,
        to: to,
        header: item.list_header.indexOf("2")==0?"list"+item.list_header:item.list_header, // list选择器语法糖
        selector: "list",
        content: item.list_header==""?
          this.mdText.slice(from, to):
          this.mdText.slice(this.map_line_ch[item.line_from+1], to)
      })
    }
    return matchInfo
  }
}

@register_list_mdSelector("code")
class ABMdSelector_code extends ABMdSelector{
  protected blockMatch_keyword(): MdSelectorSpec[]{
    const matchInfo: MdSelectorSpec[] = []
    const list_text = this.mdText.split("\n")
    let prev_from = 0
    let prev_header = ""
    let code_flag = ""
    for (let i=0; i<list_text.length; i++){
      if (!code_flag){                          // 选择开始标志
        // 找开始标志
        const match_tmp = list_text[i].match(ABReg.reg_code)
        if (!match_tmp) continue
        // 尝试找header
        if (i!=0) {
          const header = list_text[i-1].match(ABReg.reg_header)
          if (header){
            code_flag = match_tmp[1]
            prev_header = header[2]
            prev_from = i-1
            continue
          }
        }
        // 没有header 不选
        if (this.settings.select_code==ConfSelect.ifhead) continue
        // 没有header 也选
        prev_from = i
        code_flag = match_tmp[1]
        prev_header = ""
        continue
      }
      else {                                    // 选择结束标志
        if (list_text[i].indexOf(code_flag)==-1) continue
        const from = this.map_line_ch[prev_from]
        const to = this.map_line_ch[i+1]-1  // 包括这一行
        matchInfo.push({
          from: from,
          to: to,
          header: prev_header,
          selector: "code",
          content: prev_header==""?
            this.mdText.slice(from, to):
            this.mdText.slice(this.map_line_ch[prev_from+1], to)
        })
        prev_header = ""
        code_flag = ""
      }
    }
    // 这个不需要尾处理
    return matchInfo
  }
}

@register_list_mdSelector("quote")
class ABMdSelector_quote extends ABMdSelector{
  protected blockMatch_keyword(): MdSelectorSpec[]{
    const matchInfo: MdSelectorSpec[] = []
    const list_text = this.mdText.split("\n")
    let prev_from = 0
    let prev_header = ""
    let is_in_quote = false
    for (let i=0; i<list_text.length; i++){
      if (!is_in_quote){                          // 选择开始标志
        if (ABReg.reg_quote.test(list_text[i])){
          // 尝试找header
          if (i!=0) {
            const header = list_text[i-1].match(ABReg.reg_header)
            if (header){
              prev_header = header[2]
              prev_from = i-1
              is_in_quote = true
              continue
            }
          }
          // 没有header 不选
          if (this.settings.select_quote==ConfSelect.ifhead) continue
          // 没有header 也选
          prev_header = ""
          prev_from = i
          is_in_quote = true
          continue
        }
      }
      else {                                      // 选择结束标志
        if (ABReg.reg_quote.test(list_text[i])) continue
        const from = this.map_line_ch[prev_from]
        const to = this.map_line_ch[i]-1          // 不包括这一行
        matchInfo.push({
          from: from,
          to: to,
          header: prev_header,
          selector: "quote",
          content: prev_header==""?
            this.mdText.slice(from, to):
            this.mdText.slice(this.map_line_ch[prev_from+1], to)
        })
        prev_header = ""
        is_in_quote = false
      }
    }
    if (is_in_quote){                        // 结束循环收尾
      const i = list_text.length-1
      const from = this.map_line_ch[prev_from]
      const to = this.map_line_ch[i+1]-1   // 包括这一行
      matchInfo.push({
        from: from,
        to: to,
        header: prev_header,
        selector: "quote",
        content: prev_header==""?
          this.mdText.slice(from, to):
          this.mdText.slice(this.map_line_ch[prev_from+1], to)
      })
      prev_header = ""
      is_in_quote = false
    }
    return matchInfo
  }
}

@register_list_mdSelector("heading")
class ABMdSelector_heading extends ABMdSelector{
  protected blockMatch_keyword(): MdSelectorSpec[]{
    const matchInfo: MdSelectorSpec[] = []
    const list_text = this.mdText.split("\n")
    let prev_from = 0
    let prev_header = ""
    let prev_heading_level = 0
    for (let i=0; i<list_text.length; i++){
      if (prev_heading_level==0){             // 选择开始标志
        const match_tmp = list_text[i].match(ABReg.reg_heading)
        if (!match_tmp) continue
        // 尝试找header
        if (i!=0) {
          const header = list_text[i-1].match(ABReg.reg_header)
          if (header){
            prev_heading_level = match_tmp[1].length
            prev_header = header[2]
            prev_from = i-1
            continue
          }
        }
        // 没有header 不选
        if (this.settings.select_code==ConfSelect.ifhead) continue
        // 没有header 也选
        prev_from = i
        prev_heading_level = match_tmp[1].length
        prev_header = ""
        continue
      }
      else {                                   // 选择结束标志
        const match_tmp = list_text[i].match(ABReg.reg_heading)
        if (!match_tmp) continue
        if (match_tmp[1].length > prev_heading_level) continue
        const from = this.map_line_ch[prev_from]
        const to = this.map_line_ch[i]-1  // 不包括这一行
        matchInfo.push({
          from: from,
          to: to,
          header: prev_header,
          selector: "heading",
          content: prev_header==""?
            this.mdText.slice(from, to):
            this.mdText.slice(this.map_line_ch[prev_from+1], to)
        })
        
        // 需要向上回溯一行
        prev_header = ""
        prev_heading_level = 0
        i--
      }
    }
    if(prev_heading_level>0){
      const i = list_text.length-1
      const from = this.map_line_ch[prev_from]
      const to = this.map_line_ch[i+1]-1  // 包括这一行
      matchInfo.push({
        from: from,
        to: to,
        header: prev_header,
        selector: "heading",
        content: prev_header==""?
          this.mdText.slice(from, to):
          this.mdText.slice(this.map_line_ch[prev_from+1], to)
      })
    }
    return matchInfo
  }
}

// 旧brace方法（内联用），现在的方法不能搞内联，这些代码先注释着等以后备用
{
  /** 行 - 匹配关键字（内联） */
  /*private lineMatch_keyword_line(): RangeSpec[] {
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
        from: from2,//////////////////// @bug 还要去除brace模式的头部信息，然后填写text
        to: to2,
        header: matchItem,
        match: String(reg_match),
        text: ""
      })
    }
    return matchInfo
  }*/

  /** 转化 - 匹配关键字 */
  /*private line2BlockMatch(listSpecKeyword: RangeSpec[]): RangeSpec[]{
    let countBracket = 0  // 括号计数
    let prevBracket = []  // 括号栈
    let listSpecKeyword_new: RangeSpec[] = []
    for (const matchItem of listSpecKeyword) {
      if (matchItem.header=="%{") {
        countBracket++
        prevBracket.push(matchItem.from)
      }
      else if(matchItem.header=="%}" && countBracket>0) {
        countBracket--
        const from = prevBracket.pop() as number
        listSpecKeyword_new.push({
          from: from,
          to: matchItem.to,
          header: "",
          match: "brace",
          text: this.mdText.slice(from+2, matchItem.to-2)
        })
      }
    }
    return listSpecKeyword_new
  }*/
}
