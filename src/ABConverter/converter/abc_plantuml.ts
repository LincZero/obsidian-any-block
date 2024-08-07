/**
 * 转换器_目录树
 * 
 * md_str <-> md_str
 * md_str <-> html
 */

import {ABConvert_IOEnum, ABConvert, type ABConvert_SpecSimp} from "./ABConvert"
import {ABConvertManager} from "../ABConvertManager"
import {ListProcess, type List_ListItem} from "./abc_list"

const abc_list2jsontext = ABConvert.factory({
  id: "list2jsontext",
  name: "列表到json文本",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content)=>{
    content = "Developing..."
    return content
  }
})

const abc_list2pumlMindmap = ABConvert.factory({
  id: "list2pumlMindmap",
  name: "列表到puml思维导图",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    const listdata:List_ListItem = ListProcess.list2data(content)

    let newContent = "```plantuml\n@startmindmap\n"
    for (let item of listdata) {
      newContent += "*".repeat(item.level+1) + " " + item.content + "\n"
    }
    newContent += "@endmindmap\n```"

    ABConvertManager.getInstance().m_renderMarkdownFn(newContent, el)
    return el
  }
})
