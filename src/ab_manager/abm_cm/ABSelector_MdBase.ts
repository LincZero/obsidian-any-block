import {ABReg} from "src/config/ABReg"
import {
  registerMdSelector, 
  type MdSelectorSpecSimp,
  type MdSelectorRangeSpecSimp
} from "./ABSelector_Md"

/**
 * 这个不是选择器，只是将多个选择器的共同逻辑抽取出来进行复用
 * 
 * @detail 功能是验证header和header下面的首行，其他的不进行验证
 * 
 * @param list_text 内容
 * @param from_line 现在位于第几行了，现在所处于的行实际上位于header下的某行。
 *   但这个逻辑是有问题的，不利于扩展。应该以header为基础进行选择才对，能更方便地添加反向选择器
 * @param selector  选择器名称
 * @param frist_reg 首行应该满足什么正则
 */
function easySelector(
  list_text:string[],
  from_line:number,
  selector:string, 
  frist_reg:RegExp
):MdSelectorRangeSpecSimp|null{
  let mdRange:MdSelectorRangeSpecSimp = {
    // 注意区分from_line（从匹配行起记）和mdRange.from_line（从头部选择器起记）
    from_line: from_line-1,
    to_line: from_line+1,
    header: "",
    selector: selector,
    levelFlag: "",
    content: "",
    prefix: ""
  }
  // 验证首行
  if (from_line <= 0) return null
  const first_line_match = list_text[from_line].match(frist_reg)
  if (!first_line_match) return null
  mdRange.prefix = first_line_match[1]  // 可以是空
  mdRange.levelFlag = first_line_match[3]

  // 验证header
  let header_line_match:RegExpMatchArray | null
  if (list_text[from_line-1].indexOf(mdRange.prefix)==0
    && ABReg.reg_emptyline_noprefix.test(list_text[from_line-1]/*.replace(mdRange.prefix, "")*/)
    && from_line>1
  ){
    mdRange.from_line = from_line-2
  }
  header_line_match = list_text[mdRange.from_line].match(ABReg.reg_header)
  if (!header_line_match) return null
  if (header_line_match[1]!=mdRange.prefix) return null
  mdRange.header = header_line_match[5]
  return mdRange
}

/**
 * 这个不是选择器，只是将多个选择器的共同逻辑抽取出来进行复用。
 * 
 * 基本同 easySelector
 * 
 * 区别：
 * - easySelector:
 * - easySelector_headtail: 特供给头尾选择器来使用
 */
function easySelector_headtail(
  list_text:string[],
  from_line:number,
  selector:string, 
  frist_reg:RegExp
):MdSelectorRangeSpecSimp|null{
  let mdRange:MdSelectorRangeSpecSimp = {
    from_line: from_line,
    to_line: from_line+1,
    header: "",
    selector: selector,
    levelFlag: "",
    content: "",
    prefix: ""
  }
  // 验证首行
  if (from_line <= 0) return null
  const first_line_match = list_text[from_line].match(frist_reg)
  if (!first_line_match) return null
  mdRange.prefix = first_line_match[1]  // 可以是空
  // 验证header
  mdRange.levelFlag = first_line_match[3]
  mdRange.header = first_line_match[4]
  return mdRange
}

/**
 * 首尾选择器
 */
const mdSelector_headtail:MdSelectorSpecSimp = {
  id: "mdit",
  name: "mdit:::头尾选择器",
  detail: "以`:::`开头和结尾，处理器名写在第一个`:::`的后面，不需要加`[]`。其实就和代码块差不多，这也是VuePress的一个md扩展语法",
  match: ABReg.reg_mdit_head,
  selector: (list_text, from_line)=>{
    let mdRangeTmp = easySelector_headtail(list_text, from_line, "mdit", ABReg.reg_mdit_head)
    if (!mdRangeTmp) return null
    const mdRange = mdRangeTmp
    // 开头找到了，现在开始找结束。不需要循环尾处理器
    let last_nonempty:number = from_line
    for (let i=from_line+1; i<list_text.length; i++){
      const line = list_text[i]
      // 前缀不符合
      if (line.indexOf(mdRange.prefix)!=0) break
      const line2 = line.replace(mdRange.prefix, "")    // 删掉无用前缀
      // 空行
      if (ABReg.reg_emptyline_noprefix.test(line2)) {continue}
      last_nonempty = i
      // 结束
      if (ABReg.reg_mdit_tail_noprefix.test(line2)) {last_nonempty = i; break}
    }
    mdRange.to_line = last_nonempty+1
    mdRange.content = list_text
      .slice(from_line+1, mdRange.to_line-1)
      .map((line)=>{return line.replace(mdRange.prefix, "")})
      .join("\n")
    return mdRange
  }
}
registerMdSelector(mdSelector_headtail)

/**
 * 列表选择器
 */
const mdSelector_list:MdSelectorSpecSimp = {
  id: "list",
  name: "列表选择器",
  match: ABReg.reg_list,
  detail: "在列表的上一/两行加上`[处理器名]`的header，注意header必须和列表首行位于同一层次",
  selector: (list_text, from_line)=>{
    let mdRangeTmp = easySelector(list_text, from_line, "list", ABReg.reg_list)
    if (!mdRangeTmp) return null
    const mdRange = mdRangeTmp
    // 开头找到了，现在开始找结束。不需要循环尾处理器
    let last_nonempty:number = from_line
    for (let i=from_line+1; i<list_text.length; i++){
      const line = list_text[i]
      // 前缀不符合
      if (line.indexOf(mdRange.prefix)!=0) break
      const line2 = line.replace(mdRange.prefix, "")    // 删掉无用前缀
      // 列表
      if (ABReg.reg_list_noprefix.test(line2)) {last_nonempty = i; continue}
      // 开头有缩进
      if (ABReg.reg_indentline_noprefix.test(line2)) {last_nonempty = i; continue}
      // 空行
      if (ABReg.reg_emptyline_noprefix.test(line2)) {continue}
      break
    }
    mdRange.to_line = last_nonempty+1
    mdRange.content = list_text
      .slice(from_line, mdRange.to_line)
      .map((line)=>{return line.replace(mdRange.prefix, "")})
      .join("\n")
    return mdRange
  }
}
registerMdSelector(mdSelector_list)

/**
 * 代码块选择器
 */
const mdSelector_code:MdSelectorSpecSimp = {
  id: "code",
  name: "代码选择器",
  match: ABReg.reg_code,
  detail: "在代码块的上一/两行加上`[处理器名]`的header，注意header必须和代码块首行位于同一层次",
  selector: (list_text, from_line)=>{
    let mdRangeTmp = easySelector(list_text, from_line, "code", ABReg.reg_code)
    if (!mdRangeTmp) return null
    const mdRange = mdRangeTmp
    // 开头找到了，现在开始找结束。不需要循环尾处理器
    let last_nonempty:number = from_line
    for (let i=from_line+1; i<list_text.length; i++){
      const line = list_text[i]
      // 前缀不符合
      if (line.indexOf(mdRange.prefix)!=0) break
      const line2 = line.replace(mdRange.prefix, "")    // 删掉无用前缀
      // 空行
      if (ABReg.reg_emptyline_noprefix.test(line2)) {continue}
      last_nonempty = i
      // 结束
      if (line2.indexOf(mdRange.levelFlag)==0) {last_nonempty = i; break}
    }
    mdRange.to_line = last_nonempty+1
    mdRange.content = list_text
      .slice(from_line, mdRange.to_line)
      .map((line)=>{return line.replace(mdRange.prefix, "")})
      .join("\n")
    return mdRange
  }
}
registerMdSelector(mdSelector_code)

/**
 * 引用块选择器
 */
const mdSelector_quote:MdSelectorSpecSimp = {
  id: "quote",
  name: "引用块选择器",
  match: ABReg.reg_quote,
  detail: "在引用块的上一/两行加上`[处理器名]`的header，注意header必须和引用块首行位于同一层次",
  selector: (list_text, from_line)=>{
    let mdRangeTmp = easySelector(list_text, from_line, "quote", ABReg.reg_quote)
    if (!mdRangeTmp) return null
    const mdRange = mdRangeTmp
    // 开头找到了，现在开始找结束。不需要循环尾处理器
    let last_nonempty:number = from_line
    for (let i=from_line+1; i<list_text.length; i++){
      const line = list_text[i]
      // 前缀不符合
      if (line.indexOf(mdRange.prefix)!=0) break
      const line2 = line.replace(mdRange.prefix, "")    // 删掉无用前缀
      // 引用
      if (ABReg.reg_quote_noprefix.test(line2)) {last_nonempty = i; continue}
      break
    }
    mdRange.to_line = last_nonempty+1
    mdRange.content = list_text
      .slice(from_line, mdRange.to_line)
      .map((line)=>{return line.replace(mdRange.prefix, "")})
      .join("\n")
    return mdRange
  }
}
registerMdSelector(mdSelector_quote)

/**
 * 表格块选择器
 */
const mdSelector_table:MdSelectorSpecSimp = {
  id: "table",
  name: "表格选择器",
  match: ABReg.reg_table,
  detail: "在表格的上一/两行加上`[处理器名]`的header，注意header必须和表格首行位于同一层次",
  selector: (list_text, from_line)=>{
    let mdRangeTmp = easySelector(list_text, from_line, "table", ABReg.reg_table)
    if (!mdRangeTmp) return null
    const mdRange = mdRangeTmp
    // 开头找到了，现在开始找结束。不需要循环尾处理器
    let last_nonempty:number = from_line
    for (let i=from_line+1; i<list_text.length; i++){
      const line = list_text[i]
      // 前缀不符合
      if (line.indexOf(mdRange.prefix)!=0) break
      const line2 = line.replace(mdRange.prefix, "")    // 删掉无用前缀
      // 表格
      if (ABReg.reg_table_noprefix.test(line2)) {last_nonempty = i; continue}
      break
    }
    mdRange.to_line = last_nonempty+1
    mdRange.content = list_text
      .slice(from_line, mdRange.to_line)
      .map((line)=>{return line.replace(mdRange.prefix, "")})
      .join("\n")
    return mdRange
  }
}
registerMdSelector(mdSelector_table)

/**
 * 标题选择器
 */
const mdSelector_heading:MdSelectorSpecSimp = {
  id: "heading",
  name: "标题选择器",
  match: ABReg.reg_heading,
  detail: "在标题的上一/两行加上`[处理器名]`的header，注意header必须和标题首行位于同一层次",
  selector: (list_text, from_line)=>{
    let mdRangeTmp = easySelector(list_text, from_line, "heading", ABReg.reg_heading)
    if (!mdRangeTmp) return null
    const mdRange = mdRangeTmp
    // 开头找到了，现在开始找结束。不需要循环尾处理器
    let last_nonempty:number = from_line
    for (let i=from_line+1; i<list_text.length; i++){
      const line = list_text[i]
      // 前缀不符合
      if (line.indexOf(mdRange.prefix)!=0) break
      const line2 = line.replace(mdRange.prefix, "")    // 删掉无用前缀
      // 空行
      if (ABReg.reg_emptyline_noprefix.test(line2)) {continue}
      // 更大的标题
      const match = line2.match(ABReg.reg_heading_noprefix)
      if (!match) {last_nonempty=i; continue}
      if (match[3].length < mdRange.levelFlag.length) {break}
      last_nonempty=i;
    }
    mdRange.to_line = last_nonempty+1
    mdRange.content = list_text
      .slice(from_line, mdRange.to_line)
      .map((line)=>{return line.replace(mdRange.prefix, "")})
      .join("\n")
    return mdRange
  }
}
registerMdSelector(mdSelector_heading)
