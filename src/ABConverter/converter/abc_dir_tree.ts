/**
 * 转换器_目录树
 * 
 * md_str <-> md_str
 * md_str <-> html
 */

import { ABReg } from '../ABReg'
import {ABConvert_IOEnum, ABConvert, type ABConvert_SpecSimp} from "./ABConvert"
import {ABConvertManager} from "../ABConvertManager"
import {ListProcess, type List_ListItem, type ListItem} from "./abc_list"
import {TableProcess, type List_TableItem, type TableItem} from "./abc_table"
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

export class DirProcess{
  /** 列表转列表格 */
  static list2lt(text: string, div: HTMLDivElement, modeT=false) {
    let list_itemInfo = DirProcess.list2uldata(text)
    return TableProcess.uldata2ultable(list_itemInfo, div, modeT)
  }

  /** 列表转树形目录 */
  static list2dt(text: string, div: HTMLDivElement, modeT=false) {
    let list_itemInfo = DirProcess.list2uldata(text)
    return TableProcess.uldata2ultable(list_itemInfo, div, modeT, true)
  }

  /**
   * 列表文本转列表表格数据
   * 
   * 只能通过“|”符号实现跨列
   * 所以这种是没有合并单元格
   * 
   * 第一列的level总为0
   */
  static list2uldata(text: string){
    let list_itemInfo:List_ListItem = []
    
    const list_text = text.split("\n")
    for (let line of list_text) {                                             // 每行
      const m_line = line.match(ABReg.reg_list_noprefix)
      if (m_line) {
        let list_inline: string[] = m_line[4].split(ABReg.inline_split) // 内联分行
        let level_inline: number = m_line[1].length
                                                                              // 保留缩进（列表格）
        for (let inline_i=0; inline_i<list_inline.length; inline_i++){
          if(inline_i==0) {                                                   // level为内联缩进
            for (let i=0; i<level_inline; i++) list_inline[inline_i] = "&nbsp;" + list_inline[inline_i] // @bug。需要分开处理tab和space两种情况。这里统一坍塌成 "1"
            list_itemInfo.push({
              content: list_inline[inline_i],
              level: 0
            })
          }
          else{                                 // level为table的列数
            list_itemInfo.push({
              content: list_inline[inline_i],
              level: level_inline+inline_i
            })
          }
        }
      }
      else{                                                                   // 内换行
        let itemInfo = list_itemInfo.pop()
        if(itemInfo){
          list_itemInfo.push({
            content: itemInfo.content+"\n"+line.trim(),
            level: itemInfo.level
          })
        }
      }
    }
    return list_itemInfo
  }

  /**
   * listdata 转 dirdata
   * 
   * TODO 未完成 with comment 功能
   */
  static listdata2dirdata(list: List_ListItem): List_DirListItem {
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
}

const abc_list2astreeH = ABConvert.factory({
  id: "list2astreeH",
  name: "列表到sacii目录树",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content)=>{
    let listdata: List_ListItem = ListProcess.list2data(content)
    listdata = ListProcess.data2strict(listdata)
    const dirlistdata: List_DirListItem = DirProcess.listdata2dirdata(listdata)

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
    DirProcess.list2lt(content, el, matchs[2]=="T")
    return el
  }
})

const abc_list2dt = ABConvert.factory({
  id: "list2dt",
  name: "列表转树状目录",
  match: /list2(md)?dt(T)?/,
  default: "list2dt",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    const matchs = header.match(/list2(md)?dt(T)?/)
    if (!matchs) return el
    DirProcess.list2dt(content, el, matchs[2]=="T")
    return el
  }
})
