import {ABReg} from "src/config/abReg"
import {
  registerMdSelector, 
  type MdSelectorSpec,
  type MdSelectorRangeSpecSimp
} from "./abMdSelector"

const mdSelector_brace:MdSelectorSpec = {
  match: ABReg.reg_front,
  selector: (list_text, from_line)=>{
    let mdRange:MdSelectorRangeSpecSimp = {
        from_line: from_line-1,
        to_line: from_line+1,
        header: "",
        selector: "barce",
        content: "",
        prefix: ""
    }
    // 验证首行
    if (from_line <= 0) return null
    const first_line_match = list_text[from_line].match(ABReg.reg_front)
    if (!first_line_match) return null
    mdRange.prefix = first_line_match[1]  // 可以是空
    // 验证header
    const header_line_match = list_text[from_line-1].match(ABReg.reg_header)
    if (!header_line_match) return null
    if (!header_line_match
      || !header_line_match[3] 
      || header_line_match[1]!=mdRange.prefix
    ) return null
    mdRange.header = header_line_match[3]
    // 开头找到了，现在开始找结束。不需要循环尾处理器
    let last_nonempty:number = from_line
    for (let i=from_line+1; i<list_text.length; i++){
      const line = list_text[i]
      if (line.indexOf(mdRange.prefix)!=0) break
      const line2 = line.replace(mdRange.prefix, "")    // 删掉无用前缀
      if (ABReg.reg_end.test(line2)) {         // 列表
        last_nonempty = i
        continue 
      }
      if (/^\s+?\S/.test(line2)) {              // 开头有缩进
        last_nonempty = i
        continue
      }
      if (/^\s*$/.test(line2)) {                // 空行
        last_nonempty = i
        continue
      }
      break
    }
    mdRange.to_line = last_nonempty+1
    mdRange.content = list_text
      .slice(mdRange.from_line+1, mdRange.to_line)
      .map((line)=>{return line.replace(mdRange.prefix, "")})
      .join("\n")
    return mdRange
  }
}
registerMdSelector(mdSelector_brace)

/*const mdSelector_brace:MdSelectorSpec = {
  match: ABReg.reg_front,
  selector: (mdText, from, confSelect)=>{
    const matchInfo: MdSelectorRangeSpec[] = []
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
registerMdSelector(mdSelector_brace)*/

const mdSelector_list:MdSelectorSpec = {
  match: ABReg.reg_list,
  selector: (list_text, from_line)=>{
    let mdRange:MdSelectorRangeSpecSimp = {
        from_line: from_line-1,
        to_line: from_line+1,
        header: "",
        selector: "list",
        content: "",
        prefix: ""
    }
    // 验证首行
    if (from_line <= 0) return null
    const first_line_match = list_text[from_line].match(ABReg.reg_list)
    if (!first_line_match) return null
    mdRange.prefix = first_line_match[1]  // 可以是空
    // 验证header
    const header_line_match = list_text[from_line-1].match(ABReg.reg_header)
    if (!header_line_match) return null
    if (!header_line_match
      || !header_line_match[3] 
      || header_line_match[1]!=mdRange.prefix
    ) return null
    mdRange.header = header_line_match[3]
    // 开头找到了，现在开始找结束。不需要循环尾处理器
    let last_nonempty:number = from_line
    for (let i=from_line+1; i<list_text.length; i++){
      const line = list_text[i]
      if (line.indexOf(mdRange.prefix)!=0) break
      const line2 = line.replace(mdRange.prefix, "")    // 删掉无用前缀
      if (ABReg.reg_list.test(line2)) {         // 列表
        last_nonempty = i
        continue 
      }
      if (/^\s+?\S/.test(line2)) {              // 开头有缩进
        last_nonempty = i
        continue
      }
      if (/^\s*$/.test(line2)) {                // 空行
        last_nonempty = i
        continue
      }
      break
    }
    mdRange.to_line = last_nonempty+1
    mdRange.content = list_text
      .slice(mdRange.from_line+1, mdRange.to_line)
      .map((line)=>{return line.replace(mdRange.prefix, "")})
      .join("\n")
    return mdRange
  }
}
registerMdSelector(mdSelector_list)

/*
class ABMdSelector_code extends ABMdSelector{
  protected blockMatch_keyword(): MdSelectorRangeSpec[]{
    const matchInfo: MdSelectorRangeSpec[] = []
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
            code_flag = match_tmp[3]
            prev_header = header[4]
            prev_from = i-1
            continue
          }
        }
        // 没有header 不选
        if (this.settings.select_code==ConfSelect.ifhead) continue
        // 没有header 也选
        prev_from = i
        code_flag = match_tmp[3]
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

class ABMdSelector_quote{
  protected blockMatch_keyword(): MdSelectorRangeSpec[]{
    const matchInfo: MdSelectorRangeSpec[] = []
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

class ABMdSelector_heading{
  protected blockMatch_keyword(): MdSelectorRangeSpec[]{
    const matchInfo: MdSelectorRangeSpec[] = []
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
            prev_heading_level = match_tmp[3].length
            prev_header = header[4]
            prev_from = i-1
            continue
          }
        }
        // 没有header 不选
        if (this.settings.select_code==ConfSelect.ifhead) continue
        // 没有header 也选
        prev_from = i
        prev_heading_level = match_tmp[3].length
        prev_header = ""
        continue
      }
      else {                                   // 选择结束标志
        const match_tmp = list_text[i].match(ABReg.reg_heading)
        if (!match_tmp) continue
        if (match_tmp[3].length >= prev_heading_level) continue // 【改】可选同级
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
}*/
