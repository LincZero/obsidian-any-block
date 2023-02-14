import {ProcessDataType, registerABProcessor, type ABProcessorSpecSimp} from "./abProcessor"

export const DECOProcessor = 0  // 用于模块化，防报错，其实没啥用

const process_fold:ABProcessorSpecSimp = {
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
    const mid_button = mid_el.createDiv({cls: ["ab-deco-fold-button"], text: "展开"})
    mid_button.onclick = ()=>{
      const is_hide = sub_el.getAttribute("is_hide")
      if (is_hide && is_hide=="false") {
        sub_el.setAttribute("is_hide", "true"); 
        sub_el.hide(); 
        mid_button.setText("展开")
      }
      else if(is_hide && is_hide=="true") {
        sub_el.setAttribute("is_hide", "false");
        sub_el.show(); 
        mid_button.setText("折叠")
      }
    }
    mid_el.appendChild(mid_button)
    mid_el.appendChild(sub_el)
    return el
  }
}
registerABProcessor(process_fold)

const process_scroll:ABProcessorSpecSimp = {
  id: "scroll",
  name: "滚动",
  match: /^scroll(\((\d+)\))?$/,
  default: "scroll(460)",
  process_param: ProcessDataType.el,
  process_return: ProcessDataType.el,
  process: (el, header, content)=>{
    // 找参数
    const matchs = header.match(/^scroll(\((\d+)\))?$/)
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
    mid_el.setAttribute("style", `overflow-y:auto; max-height: ${arg1}px`)
    mid_el.appendChild(sub_el)
    return el
  }
}
registerABProcessor(process_scroll)

const process_addClass:ABProcessorSpecSimp = {
  id: "addClass",
  name: "增加class",
  match: /^addClass(.*)$/,
  process_param: ProcessDataType.el,
  process_return: ProcessDataType.el,
  process: (el, header, content)=>{
    const matchs = header.match(/^addClass(.*)$/)
    if (!matchs || !matchs[1]) return el
    el.addClass(String(matchs[1]))
    return el
  }
}
registerABProcessor(process_addClass)
