/**
 * 转换器_目录树
 * 
 * md_str <-> md_str
 * md_str <-> html
 */

import {ABConvert_IOEnum, ABConvert, type ABConvert_SpecSimp} from "./ABConvert"
import {ABConvertManager} from "../ABConvertManager"
import {ListProcess, type List_ListItem} from "./abc_list"

import plantumlEncoder from "plantuml-encoder"

const abc_list2jsontext = ABConvert.factory({
  id: "json2pumlJson",
  name: "json到可视化",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: string): HTMLElement=>{
    content = "@startjson\n" + content + "\n@endjson\n"
    render_pumlText(content, el)
    return el
  }
})

const abc_list2pumlWBS = ABConvert.factory({
  id: "list2pumlWBS",
  name: "列表到puml工作分解结构",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: string): HTMLElement=>{
    let listdata:List_ListItem = ListProcess.list2data(content)
    listdata = ListProcess.data2strict(listdata)
    let newContent = "@startwbs\n"
    for (let item of listdata) {
      if (item.content.startsWith("< "))
        newContent += "*".repeat(item.level+1) + "< " + item.content.slice(2,) + "\n"
      else
        newContent += "*".repeat(item.level+1) + " " + item.content + "\n"
    }
    newContent += "@endwbs"

    render_pumlText(newContent, el)
    return el
  }
})

const abc_list2pumlMindmap = ABConvert.factory({
  id: "list2pumlMindmap",
  name: "列表到puml思维导图",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: string): HTMLElement=>{
    let listdata:List_ListItem = ListProcess.list2data(content)
    listdata = ListProcess.data2strict(listdata)
    let newContent = "@startmindmap\n"
    for (let item of listdata) {
      newContent += "*".repeat(item.level+1) + " " + item.content + "\n"
    }
    newContent += "@endmindmap"

    render_pumlText(newContent, el)
    return el
  }
})

async function render_pumlText(text: string, div: HTMLElement) {
    // 1. 四选一。自己渲 (优缺点见abc_mermaid的相似方法)
    // 当前mdit和ob使用
    var encoded = plantumlEncoder.encode(text)
    let url = 'http://www.plantuml.com/plantuml/img/' + encoded
    div.innerHTML = `<img src="${url}">`

    // 2. 四选一。这里给环境渲染 (优缺点见abc_mermaid的相似方法)
    //ABConvertManager.getInstance().m_renderMarkdownFn("```plantuml\n"+text+"```", div)

    // 3. 四选一。这里不渲，交给上一层让上一层渲 (优缺点见abc_mermaid的相似方法)
    //div.classList.add("ab-raw")
    //div.innerHTML = `<div class="ab-raw-data" type-data="plantuml" content-data='${text}'></div>`

    // 4. 四选一。纯动态/手动渲染 (优缺点见abc_mermaid的相似方法)
    // ...

    return div
}
