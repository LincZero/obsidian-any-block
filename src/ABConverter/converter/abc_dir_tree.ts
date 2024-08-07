/**
 * 转换器_目录树
 * 
 * md_str <-> md_str
 * md_str <-> html
 */

import {ABConvert_IOEnum, ABConvert, type ABConvert_SpecSimp} from "./ABConvert"
import {ABConvertManager} from "../ABConvertManager"
import {ListProcess, type List_ListItem, type ListItem} from "./abc_list"
import { current_component } from "svelte/internal";

/**
 * 通用目录数据
 * 
 * @detail
 * 用于指导制表符，前缀的所有可能性：
 * 1. 根，无
 * 2. 非最后的文件，("│  "/"   ") * n + "├─ "
 * 2. 最后一个文件，("│  "/"   ") * n + "└─ "
 * 
 * 一个最佳测试demo： (重点检查b21前面是否正确)
 * .
 * ├─ a/
 * ├─ b/
 * │  ├─ b1/
 * │  └─ b2/
 * │     └─ b21
 * └─ c/
 *    └─ c1
 * 
 * 参考项目：https://github.com/yzhong52/ascii_tree/，不过这个项目是用rust写的，最后也没怎么参考到
 */
export interface DirListItem extends ListItem {
  type: string;           // 类型 (folder/文件名后缀)
  is_last: boolean;       // 是否该文件夹下最后一个文件
  pre_as_text: string;    // ascii dir 会使用到这个前缀
}[]
export type List_DirListItem = DirListItem[]

/**
 * listdata 转 dirdata
 * 
 * TODO 未完成 with comment 功能
 */
function listdata2dirdata(list: List_ListItem): List_DirListItem {
  // is_have_vbar[x]表示在该项的后面直到出现>x的level前，会出现x level
  // 用于控制 "|  " or "   "，以及 "├─ " or "└─ "
  // 空视为true
  let is_have_vbar: boolean[] = [];
  
  let newlist: List_DirListItem = [];
  for (let i=0; i<list.length; i++) {
    let item = list[i];

    // 文件扩展名
    let type: string;
    if (item.content.endsWith("/")) {
      type = "folder"
    } else {
      const parts = item.content.split('.');
      if (parts.length === 0 || parts[parts.length - 1] === '') type = '';
      else type = parts[parts.length - 1];
    }

    // is_last。这里 O(n^2) 了，懒得优化
    let is_last = true
    for (let j=i+1; j<list.length; j++) {
      if (list[j].level < item.level) {
        is_last = true; break;
      } else if (list[j].level == item.level) {
        is_last = false; break;
      } else {
        continue
      }
    }
    is_have_vbar[item.level] = !is_last // 例如 root 目录，is_last = true，应标记 is_have_vbar[0] = false

    // 用 is_have_vbar 构造 pre_as_text
    let pre_as_text = ""
    if (item.level>1) {
      for (let i = 1; i < item.level; i++) { // 从1开始，root层没有vbar
        if (!is_have_vbar.hasOwnProperty(i)) pre_as_text += "[e]" // 一般不会出现这种情况，除非一层直接往下跳两层
        else if (is_have_vbar[i]) pre_as_text += "|  "
        else pre_as_text += "   "
      }
    }

    // 新list
    newlist.push({
      content: item.content,
      level: item.level,
      type: type,
      is_last: is_last,
      pre_as_text: pre_as_text
    })
  }
  return newlist
}

// Horizontal Tree, astree horizontal
const abc_list2astreeH = ABConvert.factory({
  id: "list2astreeH",
  name: "列表到sacii目录树",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content)=>{
    let listdata: List_ListItem = ListProcess.list2data(content)
    listdata = ListProcess.data2strict(listdata)
    const dirlistdata: List_DirListItem = listdata2dirdata(listdata)

    let newContent = ""
    for (let item of dirlistdata) {
      if (item.level == 0) {
        newContent += item.content + "\n"
      } else {
        newContent +=
          item.pre_as_text + 
          (item.is_last ? "└─ " : "├─ ") + 
          item.content + "\n"
      }
    }
    newContent = newContent.trimEnd()

    return newContent
  }
})
