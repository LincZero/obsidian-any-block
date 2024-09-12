/**
 * 转换器_文字版
 * 
 * md_str <-> md_str
 */

import {ABConvert_IOEnum, ABConvert, type ABConvert_SpecSimp} from "./ABConvert"
import {ABConvertManager} from "../ABConvertManager"
import {ABReg} from "../ABReg"

/**
 * 将registerABProcessor的调用分成两步是因为：
 * 1. 能方便在大纲里快速找到想要的处理器
 * 2. 让处理器能互相调用
 */

const abc_quote = ABConvert.factory({
  id: "quote",
  name: "增加引用块",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    return content.split("\n").map((line)=>{return "> "+line}).join("\n")
  }
})

const abc_code = ABConvert.factory({
  id: "code",
  name: "增加代码块",
  match: /^code(\((.*)\))?$/,
  default: "code()",
  detail: "不加`()`表示用原文本的第一行作为代码类型，括号类型为空表示代码类型为空",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    let matchs = header.match(/^code(\((.*)\))?$/)
    if (!matchs) return content
    if (matchs[1]) content = matchs[2]+"\n"+content
    return "```"+content+"\n```"
  }
})

const abc_Xquote = ABConvert.factory({
  id: "Xquote",
  name: "去除引用块",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    return content.split("\n").map(line=>{
      return line.replace(/^>\s/, "")
    }).join("\n")
  }
})

const abc_Xcode = ABConvert.factory({
  id: "Xcode",
  name: "去除代码块",
  match: /^Xcode(\((true|false|)\))?$/,
  default: "Xcode(true)",
  detail: "参数为是否移除代码类型, Xcode默认为false, Xcode默认为true。记法: code|Xcode 或 code()|Xcode()内容不变",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    let matchs = header.match(/^Xcode(\((true|false|)\))?$/)
    if (!matchs) return content
    let remove_flag:boolean
    if (matchs[1]=="") remove_flag=false
    else remove_flag= (matchs[2]!="false")
    let list_content = content.split("\n")
    // 开始去除
    let code_flag = ""
    let line_start = -1
    let line_end = -1
    for (let i=0; i<list_content.length; i++){
      if (code_flag==""){     // 寻找开始标志
        const match_tmp = list_content[i].match(ABReg.reg_code)
        if(match_tmp){
          code_flag = match_tmp[3]
          line_start = i
        }
      }
      else {                  // 寻找结束标志
        if(list_content[i].indexOf(code_flag)>=0){
          line_end = i
          break
        }
      }
    }
    if(line_start>=0 && line_end>0) { // 避免有头无尾的情况
      if(remove_flag) list_content[line_start] = list_content[line_start].replace(/^```(.*)$|^~~~(.*)$/, "")
      else list_content[line_start] = list_content[line_start].replace(/^```|^~~~/, "")
      list_content[line_end] = list_content[line_end].replace(/^```|^~~~/, "")
      content = list_content.join("\n")//.trim()
    }
    return content
  }
})

const abc_X = ABConvert.factory({
  id: "X",
  name: "去除代码或引用块",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    let flag = ""
    for (let line of content.split("\n")){
      if (ABReg.reg_code.test(line)) {flag="code";break}
      else if (ABReg.reg_quote.test(line)) {flag="quote";break}
    }
    if (flag=="code") return abc_Xcode.process(el, header, content) as string
    else if (flag=="quote") return abc_Xquote.process(el, header, content) as string
    return content
  }
})

// TODO 应使用新的别名系统
// const abc_code2quote = ABConvert.factory({
//   id: "code2quote",
//   name: "代码转引用块",
//   process_alias: "Xcode|quote",
//   process: ()=>{}
// })

// const abc_quote2code = ABConvert.factory({
//   id: "quote2code",
//   name: "引用转代码块",
//   match: /^quote2code(\((.*)\))?$/,
//   default: "quote2code()",
//   process_alias: "Xquote|code%1",
//   process: ()=>{
//     /*let matchs = header.match(/^quote2code(\((.*)\))?$/)
//     if (!matchs) return content
//     content = text_Xquote(content)
//     if (matchs[1]) content = matchs[2]+"\n"+content
//     content = text_code(content)
//     return content*/
//   }
// })

const abc_slice = ABConvert.factory({
  id: "slice",
  name: "切片",
  match: /^slice\((\s*\d+\s*?)(,\s*-?\d+\s*)?\)$/,
  detail: "和js的slice方法是一样的",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    // slice好像不怕溢出或交错，会自动变空数组。就很省心，不用判断太多的东西
    const list_match = header.match(/^slice\((\s*\d+\s*)(,\s*-?\d+\s*)?\)$/)
    if (!list_match) return content
    const arg1 = Number(list_match[1].trim())
    if (isNaN(arg1)) return content
    const arg2 = Number(list_match[2].replace(",","").trim())
    // 单参数
    if (isNaN(arg2)) {
      return content.split("\n").slice(arg1).join("\n")
    }
    // 双参数
    else {
      return content.split("\n").slice(arg1, arg2).join("\n")
    }
  }
})

const abc_add = ABConvert.factory({
  id: "add",
  name: "增添内容",
  match: /^add\((.*?)(,\s*-?\d+\s*)?\)$/,
  detail: "增添. 参数2为行序, 默认0, 行尾-1。会插行增添",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    const list_match = header.match(/^add\((.*?)(,\s*-?\d+\s*)?\)$/)
    if (!list_match) return content
    if (!list_match[1]) return content
    const arg1 = (list_match[1].trim())
    if (!arg1) return content
    let arg2:number
    if (!list_match[2]) arg2 = 0
    else{
      arg2 = Number(list_match[2].replace(",","").trim())
      if (isNaN(arg2)) {
        arg2 = 0
      }
    }
    const list_content = content.split("\n")
    if (arg2>=0 && arg2<list_content.length) list_content[arg2] = arg1+"\n"+list_content[arg2]
    else if(arg2<0 && (arg2*-1)<=list_content.length) {
      arg2 = list_content.length+arg2
      list_content[arg2] = arg1+"\n"+list_content[arg2]
    }
    return list_content.join("\n")
  }
})

const abc_listroot = ABConvert.factory({
  id: "listroot",
  name: "增加列表根",
  match: /^listroot\((.*)\)$/,
  default: "listroot(root)",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    const list_match = header.match(/^listroot\((.*)\)$/)
    if (!list_match) return content
    const arg1 = list_match[1].trim()
    content = content.split("\n").map(line=>{return "  "+line}).join("\n")
    content = "- "+arg1+"\n"+content
    return content
  }
})

const abc_callout = ABConvert.factory({
  id: "callout",
  name: "callout语法糖",
  match: /^\!/,
  default: "!note",
  detail: "需要obsidian 0.14版本以上来支持callout语法",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    // 之前的写法需要ad插件，这里应该换用成更通用的callout语法
    // return "```ad-"+header.slice(1)+"\n"+content+"\n```"
    
    header = header.slice(1)
    let callout_type = "[!note]"
    if (header.startsWith("note_")) {callout_type = "[!note]"; header.slice(5);}
    else if (header.startsWith("warn_")) {callout_type = "[!warning]"; header.slice(5);}
    else if (header.startsWith("warning_")) {callout_type = "[!warning]"; header.slice(8);}
    else if (header.startsWith("error_")) {callout_type = "[!error]"; header.slice(6);}

    return `> ${callout_type} ${header}\n` + content.split("\n").map(line=>{return "> "+line}).join("\n")
  }
})
