/**
 * 处理器_装饰版
 * 
 * html -> html
 */

import {ABConvertManager} from "../ABConvertManager"
import {ProcessDataType, ABConvert, type ABConvert_SpecSimp} from "./ABConvert"

export const DECOProcessor = 0  // 用于模块化，防报错，其实没啥用

const abc_fold = ABConvert.factory({
  id: "fold",
  name: "折叠",
  process_param: ProcessDataType.el,
  process_return: ProcessDataType.el,
  process: (el, header, content)=>{
    if(el.children.length!=1) return el
    const sub_el = el.children[0] as HTMLElement
    sub_el.remove()
    sub_el.setAttribute("is_hide", "true")
    sub_el.addClass("ab-deco-fold-content")
    sub_el.hide()
    const mid_el = el.createDiv({cls:["ab-deco-fold"]})
    const sub_button = mid_el.createDiv({cls: ["ab-deco-fold-button"], text: "展开"})
    sub_button.onclick = ()=>{
      const is_hide = sub_el.getAttribute("is_hide")
      if (is_hide && is_hide=="false") {
        sub_el.setAttribute("is_hide", "true"); 
        sub_el.hide(); 
        sub_button.setText("展开")
      }
      else if(is_hide && is_hide=="true") {
        sub_el.setAttribute("is_hide", "false");
        sub_el.show(); 
        sub_button.setText("折叠")
      }
    }
    mid_el.appendChild(sub_button)
    mid_el.appendChild(sub_el)
    return el
  }
})

const abc_scroll = ABConvert.factory({
  id: "scroll",
  name: "滚动",
  match: /^scroll(\((\d+)\))?(T)?$/,
  default: "scroll(460)",
  process_param: ProcessDataType.el,
  process_return: ProcessDataType.el,
  process: (el, header, content)=>{
    // 找参数
    const matchs = header.match(/^scroll(\((\d+)\))?(T)?$/)
    if (!matchs) return el
    let arg1
    if (!matchs[1]) arg1=460  // 默认值
    else{
      if (!matchs[2]) return el
      arg1 = Number(matchs[2])
      if (isNaN(arg1)) return
    }
    // 修改元素
    if(el.children.length!=1) return el
    const sub_el = el.children[0]
    sub_el.remove()
    const mid_el = el.createDiv({cls:["ab-deco-scroll"]})
    if (!matchs[3]){
      mid_el.addClass("ab-deco-scroll-y")
      mid_el.setAttribute("style", `max-height: ${arg1}px`)
    } else {
      mid_el.addClass("ab-deco-scroll-x")
    }
    mid_el.appendChild(sub_el)
    return el
  }
})

const abc_overfold = ABConvert.factory({
  id: "overfold",
  name: "超出折叠",
  match: /^overfold(\((\d+)\))?$/,
  default: "overfold(380)",
  process_param: ProcessDataType.el,
  process_return: ProcessDataType.el,
  process: (el, header, content)=>{
    // 找参数
    const matchs = header.match(/^overfold(\((\d+)\))?$/)
    if (!matchs) return el
    let arg1:number
    if (!matchs[1]) arg1=460  // 默认值
    else{
      if (!matchs[2]) return el
      arg1 = Number(matchs[2])
      if (isNaN(arg1)) return
    }
    // 修改元素
    if(el.children.length!=1) return el
    const sub_el = el.children[0]
    sub_el.remove()
    const mid_el = el.createDiv({cls:["ab-deco-overfold"]})
    const sub_button = mid_el.createDiv({cls: ["ab-deco-overfold-button"], text: "展开"})
    sub_el.addClass("ab-deco-overfold-content")
    mid_el.appendChild(sub_el)
    mid_el.appendChild(sub_button)

    mid_el.setAttribute("style", `max-height: ${arg1}px`)
    mid_el.setAttribute("is-fold", "true")
    sub_button.onclick = ()=>{
      const is_fold = mid_el.getAttribute("is-fold")
      if (!is_fold) return
      if (is_fold=="true") {
        mid_el.setAttribute("style", "")
        mid_el.setAttribute("is-fold", "false")
        sub_button.setText("折叠")
      }
      else{
        mid_el.setAttribute("style", `max-height: ${arg1}px`)
        mid_el.setAttribute("is-fold", "true")
        sub_button.setText("展开")
      }
    }

    return el
  }
})


const abc_addClass = ABConvert.factory({
  id: "addClass",
  name: "增加class",
  detail: "给当前块增加一个类名",
  match: /^addClass\((.*)\)$/,
  process_param: ProcessDataType.el,
  process_return: ProcessDataType.el,
  process: (el, header, content)=>{
    const matchs = header.match(/^addClass\((.*)\)$/)
    if (!matchs || !matchs[1]) return el
    if(el.children.length!=1) return el
    const sub_el = el.children[0]
    sub_el.addClass(String(matchs[1]))
    return el
  }
})

const abc_addDiv = ABConvert.factory({
  id: "addDiv",
  name: "增加div和class",
  detail: "给当前块增加一个父类，需要给这个父类一个类名",
  match: /^addDiv\((.*)\)$/,
  process_param: ProcessDataType.el,
  process_return: ProcessDataType.el,
  process: (el, header, content)=>{
    const matchs = header.match(/^addDiv\((.*)\)$/)
    if (!matchs || !matchs[1]) return el
    const arg1 = matchs[1]
    // 修改元素
    if(el.children.length!=1) return el
    const sub_el = el.children[0]
    sub_el.remove()
    const mid_el = el.createDiv({cls:[arg1]})
    mid_el.appendChild(sub_el)
    return el
  }
})

const abc_heimu = ABConvert.factory({
  id: "heimu",
  name: "黑幕",
  detail: "和萌娘百科的黑幕效果相似",
  process_alias: "addClass(ab-deco-heimu)",
  process: (el, header, content)=>{}
})

const abc_title = ABConvert.factory({
  id: "title",
  name: "标题",
  match: /^#(.*)/,
  detail: "若直接处理代码或表格块，则会有特殊风格",
  process_param: ProcessDataType.el,
  process_return: ProcessDataType.el,
  process: (el, header, content)=>{
    const matchs = header.match(/^#(.*)/)
    if (!matchs || !matchs[1]) return el
    const arg1 = matchs[1]

    // 修改元素
    if(el.children.length!=1) return el
    const sub_el = el.children[0] as HTMLElement
    sub_el.remove()
    sub_el.addClass("ab-deco-title-content")
    const mid_el = el.createDiv({cls:["ab-deco-title"]})
    const sub_title = mid_el.createDiv({cls: ["ab-deco-title-title"]})
    sub_title.createEl("p", {text: arg1})
    mid_el.appendChild(sub_title)
    mid_el.appendChild(sub_el)

    // 判断元素类型修改，以修改title风格
    let title_type = "none"
    if (sub_el instanceof HTMLQuoteElement){title_type = "quote"}
    else if (sub_el instanceof HTMLTableElement){title_type = "table"}
    else if (sub_el instanceof HTMLPreElement){
      title_type = "pre"
      ;(()=>{
        // 这里尝试获取代码块的背景颜色（失败）
        console.log("style1", window.getComputedStyle(sub_el ,null),
        "style2", window.getComputedStyle(sub_el ,null).getPropertyValue('background-color'),
        "style3", window.getComputedStyle(sub_el ,null).getPropertyValue('background'),
        "style4", window.getComputedStyle(sub_el ,null).backgroundColor,
        "style5", window.getComputedStyle(sub_el ,null).background,
        )
        let color:string = window.getComputedStyle(sub_el ,null).getPropertyValue('background-color'); 
        if (color) sub_title.setAttribute("style", `background-color:${color}`)
        else {
        color = window.getComputedStyle(sub_el ,null).getPropertyValue('background'); 
        sub_title.setAttribute("style", `background:${color}`)
        }
      })//()
    }
    else if (sub_el instanceof HTMLUListElement){title_type = "ul"}
    sub_title.setAttribute("title-type", title_type)
    return el
  }
})
