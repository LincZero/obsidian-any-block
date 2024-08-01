/**
 * 转换器_文字版
 * 
 * string -> string|HTMLElement
 */

import {ABConvert_IOEnum, ABConvert, type ABConvert_SpecSimp} from "./ABConvert"
import {ABConvertManager} from "../ABConvertManager"
import {ABReg} from "../ABReg"
import {ListProcess} from "./abc_list"

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
  process: (el, header, content)=>{
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
  process: (el, header, content)=>{
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
  process: (el, header, content)=>{
    return content.split("\n").map(line=>{
      return line.replace(/^>\s/, "")
    }).join("\n")
  }
})

const abc_Xcode = ABConvert.factory({
  id: "Xcode",
  name: "去除代码块",
  match: /^Xcode(\((true|false)\))?$/,
  default: "Xcode(true)",
  detail: "参数为是否移除代码类型, 默认为false。记法: code|Xcode或code()|Xcode(true)内容不变",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content)=>{
    let matchs = header.match(/^Xcode(\((true|false)\))?$/)
    if (!matchs) return content
    let remove_flag:boolean
    if (matchs[1]=="") remove_flag=false
    else remove_flag= (matchs[2]=="true")
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
  process: (el, header, content)=>{
    let flag = ""
    for (let line of content.split("\n")){
      if (ABReg.reg_code.test(line)) {flag="code";break}
      else if (ABReg.reg_quote.test(line)) {flag="quote";break}
    }
    if (flag=="code") return abc_Xcode.process(el, header, content)
    else if (flag=="quote") return abc_Xquote.process(el, header, content)
    return content
  }
})

const abc_code2quote = ABConvert.factory({
  id: "code2quote",
  name: "代码转引用块",
  process_alias: "Xcode|quote",
  process: ()=>{}
})

const abc_quote2code = ABConvert.factory({
  id: "quote2code",
  name: "引用转代码块",
  match: /^quote2code(\((.*)\))?$/,
  default: "quote2code()",
  process_alias: "Xquote|code%1",
  process: ()=>{
    /*let matchs = header.match(/^quote2code(\((.*)\))?$/)
    if (!matchs) return content
    content = text_Xquote(content)
    if (matchs[1]) content = matchs[2]+"\n"+content
    content = text_code(content)
    return content*/
  }
})

const abc_slice = ABConvert.factory({
  id: "slice",
  name: "切片",
  match: /^slice\((\s*\d+\s*?)(,\s*-?\d+\s*)?\)$/,
  detail: "和js的slice方法是一样的",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content)=>{
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
  process: (el, header, content)=>{
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

const abc_title2list = ABConvert.factory({
  id: "title2list",
  name: "标题到列表",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  detail: "也可以当作是更强大的列表解析器",
  process: (el, header, content)=>{
    content = ListProcess.title2list(content, el)
    return content
  }
})

const abc_listroot = ABConvert.factory({
  id: "listroot",
  name: "增加列表根",
  match: /^listroot\((.*)\)$/,
  default: "listroot(root)",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content)=>{
    const list_match = header.match(/^listroot\((.*)\)$/)
    if (!list_match) return content
    const arg1 = list_match[1].trim()
    content = content.split("\n").map(line=>{return "  "+line}).join("\n")
    content = "- "+arg1+"\n"+content
    return content
  }
})

const abc_listXinline = ABConvert.factory({
  id: "listXinline",
  name: "列表消除内联换行",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content)=>{
    return ListProcess.listXinline(content)
  }
})

const abc_md = ABConvert.factory({
  id: "md",
  name: "md",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    const subEl = document.createElement("div"); el.appendChild(subEl); subEl.classList.add("markdown-rendered")
    ABConvertManager.getInstance().m_renderMarkdownFn(content, subEl)
    return el
  }
})

const abc_text = ABConvert.factory({
  id: "text",
  name: "纯文本",
  detail: "其实一般会更推荐用code()代替，那个更精确",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    // 文本元素。pre不好用，这里还是得用<br>换行最好
    // `<p>${content.split("\n").map(line=>{return "<span>"+line+"</span>"}).join("<br/>")}</p>`
    el.innerHTML = `<p>${content.replace(/ /g, "&nbsp;").split("\n").join("<br/>")}</p>`
    return el
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
  process: (el, header, content)=>{
    return "```ad-"+header.slice(1)+"\n"+content+"\n```"
  }
})

// 纯组合，后续用别名模块替代
const abc_title2table = ABConvert.factory({
  id: "title2table",
  name: "标题到表格",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    content = ListProcess.title2list(content, el)
    ListProcess.list2table(content, el)
    return el
  }
})

const abc_list2table = ABConvert.factory({
  id: "list2table",
  name: "列表转表格",
  match: /list2(md)?table(T)?/,
  default: "list2table",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    const matchs = header.match(/list2(md)?table(T)?/)
    if (!matchs) return el
    ListProcess.list2table(content, el, matchs[2]=="T")
    return el
  }
})

const abc_list2lt = ABConvert.factory({
  id: "list2lt",
  name: "列表转列表表格",
  match: /list2(md)?lt(T)?/,
  default: "list2lt",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    const matchs = header.match(/list2(md)?lt(T)?/)
    if (!matchs) return el
    ListProcess.list2lt(content, el, matchs[2]=="T")
    return el
  }
})

const abc_list2folder = ABConvert.factory({
  id: "list2folder",
  name: "列表转树状目录",
  match: /list2(md)?folder(T)?/,
  default: "list2folder",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    const matchs = header.match(/list2(md)?folder(T)?/)
    if (!matchs) return el
    ListProcess.list2folder(content, el, matchs[2]=="T")
    return el
  }
})

const abc_list2ut = ABConvert.factory({
  id: "list2ut",
  name: "列表转二维表格",
  match: /list2(md)?ut(T)?/,
  default: "list2ut",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    const matchs = header.match(/list2(md)?ut(T)?/)
    if (!matchs) return el
    ListProcess.list2ut(content, el, matchs[2]=="T")
    return el
  }
})

const abc_list2timeline = ABConvert.factory({
  id: "list2timeline",
  name: "一级列表转时间线",
  match: /list2(md)?timeline(T)?/,
  default: "list2mdtimeline",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    const matchs = header.match(/list2(md)?timeline(T)?/)
    if (!matchs) return el
    ListProcess.list2timeline(content, el, matchs[2]=="T")
    return el
  }
})

const abc_list2tab = ABConvert.factory({
  id: "list2tab",
  name: "一级列表转标签栏",
  match: /list2(md)?tab(T)?$/,
  default: "list2mdtab",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    const matchs = header.match(/list2(md)?tab(T)?$/)
    if (!matchs) return el
    ListProcess.list2tab(content, el, matchs[2]=="T")
    return el
  }
})
