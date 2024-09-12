/**
 * 处理器_装饰版
 * 
 * html <-> html
 * md_str <-> html
 */

import {ABConvert_IOEnum, ABConvert, type ABConvert_SpecSimp} from "./ABConvert"
import {ABConvertManager} from "../ABConvertManager"

export const DECOProcessor = 0  // 用于模块化，防报错，其实没啥用

const abc_md = ABConvert.factory({
  id: "md",
  name: "md",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: string): HTMLElement=>{
    const subEl = document.createElement("div"); el.appendChild(subEl);
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
  process: (el, header, content: string): HTMLElement=>{
    // 文本元素。pre不好用，这里还是得用<br>换行最好
    // `<p>${content.split("\n").map(line=>{return "<span>"+line+"</span>"}).join("<br/>")}</p>`
    el.innerHTML = `<p>${content.replace(/ /g, "&nbsp;").split("\n").join("<br/>")}</p>`
    return el
  }
})

const abc_fold = ABConvert.factory({
  id: "fold",
  name: "折叠",
  process_param: ABConvert_IOEnum.el,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: HTMLElement): HTMLElement=>{
    if(content.children.length!=1) return content
    const sub_el = content.children[0] as HTMLElement
    sub_el.remove()
    sub_el.setAttribute("is_hide", "true")
    sub_el.classList.add("ab-deco-fold-content")
    sub_el.style.display = "none"
    const mid_el = document.createElement("div"); content.appendChild(mid_el); mid_el.classList.add("ab-deco-fold");
    const sub_button = document.createElement("div"); mid_el.appendChild(sub_button); sub_button.classList.add("ab-deco-fold-button"); sub_button.textContent = "展开";
    sub_button.onclick = ()=>{
      const is_hide = sub_el.getAttribute("is_hide")
      if (is_hide && is_hide=="false") {
        sub_el.setAttribute("is_hide", "true"); 
        sub_el.style.display = "none"
        sub_button.textContent = "展开"
      }
      else if(is_hide && is_hide=="true") {
        sub_el.setAttribute("is_hide", "false");
        sub_el.style.display = ""
        sub_button.textContent = "折叠"
      }
    }
    mid_el.appendChild(sub_button)
    mid_el.appendChild(sub_el)
    return content
  }
})

const abc_scroll = ABConvert.factory({
  id: "scroll",
  name: "滚动",
  match: /^scroll(\((\d+)\))?(T)?$/,
  default: "scroll(460)",
  process_param: ABConvert_IOEnum.el,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: HTMLElement): HTMLElement=>{
    // 找参数
    const matchs = header.match(/^scroll(\((\d+)\))?(T)?$/)
    if (!matchs) return content
    let arg1
    if (!matchs[1]) arg1=460  // 默认值
    else{
      if (!matchs[2]) return content
      arg1 = Number(matchs[2])
      if (isNaN(arg1)) return content
    }
    // 修改元素
    if(content.children.length!=1) return content
    const sub_el = content.children[0]
    sub_el.remove()
    const mid_el = document.createElement("div"); content.appendChild(mid_el); mid_el.classList.add("ab-deco-scroll");
    if (!matchs[3]){
      mid_el.classList.add("ab-deco-scroll-y")
      mid_el.setAttribute("style", `max-height: ${arg1}px`)
    } else {
      mid_el.classList.add("ab-deco-scroll-x")
    }
    mid_el.appendChild(sub_el)
    return content
  }
})

const abc_overfold = ABConvert.factory({
  id: "overfold",
  name: "超出折叠",
  match: /^overfold(\((\d+)\))?$/,
  default: "overfold(380)",
  process_param: ABConvert_IOEnum.el,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: HTMLElement): HTMLElement=>{
    // 找参数
    const matchs = header.match(/^overfold(\((\d+)\))?$/)
    if (!matchs) return content
    let arg1:number
    if (!matchs[1]) arg1=460  // 默认值
    else{
      if (!matchs[2]) return content
      arg1 = Number(matchs[2])
      if (isNaN(arg1)) return content
    }
    // 修改元素
    if(content.children.length!=1) return content
    const sub_el = content.children[0]
    sub_el.remove()
    const mid_el = document.createElement("div"); content.appendChild(mid_el); mid_el.classList.add("ab-deco-overfold");
    const sub_button = document.createElement("div"); mid_el.appendChild(sub_button); sub_button.classList.add("ab-deco-overfold-button"); sub_button.textContent = "展开";
    sub_el.classList.add("ab-deco-overfold-content")
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
        sub_button.textContent = "折叠"
      }
      else{
        mid_el.setAttribute("style", `max-height: ${arg1}px`)
        mid_el.setAttribute("is-fold", "true")
        sub_button.textContent = "展开"
      }
    }

    return content
  }
})


const abc_addClass = ABConvert.factory({
  id: "addClass",
  name: "增加class",
  detail: "给当前块增加一个类名",
  match: /^addClass\((.*)\)$/,
  process_param: ABConvert_IOEnum.el,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: HTMLElement): HTMLElement=>{
    const matchs = header.match(/^addClass\((.*)\)$/)
    if (!matchs || !matchs[1]) return content
    if(content.children.length!=1) return content
    const sub_el = content.children[0]
    sub_el.classList.add(String(matchs[1]))
    return content
  }
})

const abc_addDiv = ABConvert.factory({
  id: "addDiv",
  name: "增加div和class",
  detail: "给当前块增加一个父类，需要给这个父类一个类名",
  match: /^addDiv\((.*)\)$/,
  process_param: ABConvert_IOEnum.el,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: HTMLElement): HTMLElement=>{
    const matchs = header.match(/^addDiv\((.*)\)$/)
    if (!matchs || !matchs[1]) return content
    const arg1 = matchs[1]
    // 修改元素
    if(content.children.length!=1) return content
    const sub_el = content.children[0]
    sub_el.remove()
    const mid_el = document.createElement("div"); content.appendChild(mid_el); mid_el.classList.add(arg1)
    mid_el.appendChild(sub_el)
    return content
  }
})

const abc_title = ABConvert.factory({
  id: "title",
  name: "标题",
  match: /^#(.*)/,
  detail: "若直接处理代码或表格块，则会有特殊风格",
  process_param: ABConvert_IOEnum.el,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: HTMLElement): HTMLElement=>{
    const matchs = header.match(/^#(.*)/)
    if (!matchs || !matchs[1]) return content
    const arg1 = matchs[1]

    // 修改元素
    if(content.children.length!=1) return content
    const el_root = document.createElement("div"); content.appendChild(el_root); el_root.classList.add("ab-deco-title");
    const el_title = document.createElement("div"); el_root.appendChild(el_title); el_title.classList.add("ab-deco-title-title");
    const el_title_p = document.createElement("p"); el_title.appendChild(el_title_p); el_title_p.textContent = arg1;
    const el_content = content.children[0] as HTMLElement; el_content.remove(); el_root.appendChild(el_content); el_content.classList.add("ab-deco-title-content");
    const el_content_sub = el_content.childNodes[0]; if (!el_content_sub) return content;

    // 判断元素类型修改，以修改title风格
    let title_type = "none"
    if (el_content_sub instanceof HTMLQuoteElement){title_type = "quote"
      // 这里借用callout的样式，并去除原来的引用块样式
      el_root.classList.add("callout")
      el_title.classList.add("callout-title");
      el_content.classList.add("callout-content");

      while (el_content_sub.firstChild) {
        el_content.insertBefore(el_content_sub.firstChild, el_content_sub);
      }
      el_content.removeChild(el_content_sub)
    }
    else if (el_content_sub instanceof HTMLTableElement){title_type = "table"}
    else if (el_content_sub instanceof HTMLUListElement){title_type = "ul"}
    else if (el_content_sub instanceof HTMLPreElement){title_type = "pre"}
    // ;(()=>{
    //   let color:string = window.getComputedStyle(el_content_sub ,null).getPropertyValue('background-color'); 
    //   if (color) el_title.setAttribute("style", `background-color:${color}`)
    //   else {
    //   color = window.getComputedStyle(el_content_sub ,null).getPropertyValue('background'); 
    //   el_title.setAttribute("style", `background:${color}`)
    //   }
    // })//()
    el_title.setAttribute("title-type", title_type)
    return content
  }
})
