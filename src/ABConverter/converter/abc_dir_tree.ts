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

export interface LTableItem {
  content: string,        // 内容
  level: number,          // 行缩进，仅当首列为0时有效
  tableRow: number,       // 对应首行序列
  tableColumn: number,    // 对应首列序列，主要看是否第一列，如果是则是主体
  tableRowSpan: 1,        // 跨行数，一般总是一
  type: string            // 文件类型。仅第一列有效
}
export type List_LTableItem = LTableItem[]

export class DirProcess{
  /** 列表转列表格 */
  static list2lt(text: string, div: HTMLDivElement, modeT=false) {
    let list_itemInfo = DirProcess.list2dtdata(text)
    list_itemInfo = ListProcess.data2strict(list_itemInfo).map((item, index)=>{ return {
      content: list_itemInfo[index].content,
      level: item.level, // modi
      tableRow: list_itemInfo[index].tableRow,
      tableColumn: list_itemInfo[index].tableColumn,
      tableRowSpan: list_itemInfo[index].tableRowSpan,
      type: list_itemInfo[index].type,
    }})
    return DirProcess.dtdata2dt(list_itemInfo, div, modeT)
  }

  /** 列表转树形目录 */
  static list2dt(text: string, div: HTMLDivElement, modeT=false) {
    let list_itemInfo = DirProcess.list2dtdata(text)
    list_itemInfo = ListProcess.data2strict(list_itemInfo).map((item, index)=>{ return {
      content: list_itemInfo[index].content,
      level: item.level, // modi
      tableRow: list_itemInfo[index].tableRow,
      tableColumn: list_itemInfo[index].tableColumn,
      tableRowSpan: list_itemInfo[index].tableRowSpan,
      type: list_itemInfo[index].type,
    }})
    return DirProcess.dtdata2dt(list_itemInfo, div, modeT, true)
  }

  /**
   * 列表文本转列表表格数据
   * 
   * 只能通过“|”符号实现跨列
   * 所以这种是没有合并单元格
   * 
   * 第一列的level总为0
   */
  static list2dtdata(text: string): List_LTableItem{
    // 表格行处理
    let list_itemInfo:List_LTableItem = []
    const list_text = text.split("\n")
    let row_index = -1;
    for (let line of list_text) { // 遍历文本行
      const m_line = line.match(ABReg.reg_list_noprefix)
      if (m_line) { // 新的表格行
        row_index++;
        const content = m_line[4]                   // 这一行的内容
        let level_inline: number = m_line[1].length // 缩进数
        list_itemInfo.push({
          content: content.trimStart(),
          level: level_inline,
          tableRow: row_index,
          tableColumn: 0,
          type: "",
          tableRowSpan: 1,
        })
      }
      else{ // 旧的表格行 (即内换行追加)
        let itemInfo = list_itemInfo.pop()
        if(itemInfo){
          list_itemInfo.push({
            content: itemInfo.content+"\n"+line.trim(), // modi
            level: itemInfo.level,
            tableRow: itemInfo.tableRow,
            tableColumn: itemInfo.tableColumn,
            type: itemInfo.type,
            tableRowSpan: itemInfo.tableRowSpan,
          })
        }
      }
    }

    // 表格列处理
    let list_itemInfo2:List_LTableItem = []
    for (let row_item of list_itemInfo) { // 遍历表格行
      let list_column_item: string[] = row_item.content.split(ABReg.inline_split)
      for (let column_index=0; column_index<list_column_item.length; column_index++) { // 遍历表格列
        // 第一列，需处理文件扩展名
        let type = "";
        if (column_index==0) {
          if (list_column_item[column_index].trimEnd().endsWith("/")) {
            type = "folder"
          } else {
            const parts = list_column_item[column_index].split('.');
            if (parts.length === 0 || parts[parts.length - 1] === '') type = '';
            else type = parts[parts.length - 1];
          }
        }
        // 填充
        list_itemInfo2.push({
          content: list_column_item[column_index], // modi
          level: row_item.level,
          tableRow: row_index, // modi
          tableColumn: column_index, // modi
          type: type, // modi
          tableRowSpan: row_item.tableRowSpan,
        })
      }
    }

    return list_itemInfo2
  }

  /** 列表格数据转列表格
   * 注意传入的列表数据应该符合：
   * 第一列等级为0、没有分叉
   */
  static dtdata2dt(
    list_tableInfo: List_LTableItem, 
    div: HTMLDivElement,
    modeT: boolean,
    is_folder=false
  ){
    // GeneratorListTable，原Svelte
    {
      // 表格数据 组装成表格
      const table = document.createElement("table"); div.appendChild(table); table.classList.add("ab-table", "ab-list-table")
      if (is_folder) table.classList.add("ab-table-folder")
      if (modeT) table.setAttribute("modeT", "true")

      // 创建表头和表体
      let thead, tbody
      {
        if(list_tableInfo[0].content.indexOf("< ")==0){ // 判断是否有表头
          thead = document.createElement("thead"); table.appendChild(thead);
          list_tableInfo[0].content=list_tableInfo[0].content.replace(/^\<\s/,"")
        }
        tbody = document.createElement("tbody"); table.appendChild(tbody);
      }

      // 创建表格内容
      let tr: HTMLElement // 当前所在的表格行
      let is_head: boolean = false // 当前位于表头吗，还是表体
      let prev_tr: HTMLElement|null = null   // 缓存上一行，用于判断是否可以折叠
      for (let cell_index=0; cell_index<list_tableInfo.length; cell_index++) {
        const cell_item = list_tableInfo[cell_index];

        // 创建表格行
        if (cell_item.tableColumn ==0) {
          // 表头行（即是否第一行&&是否有表头）
          if (cell_index==0 && thead){
            is_head = true
            tr = document.createElement("tr"); thead.appendChild(tr); // attr: {"tr_level": tr_line_level[index_line]}
          }
          // 非表头行
          else{
            is_head = false
            tr = document.createElement("tr"); tbody.appendChild(tr); 
            // 表头有些属性是没有的
            tr.classList.add("ab-foldable-tr");
            tr.setAttribute("tr_level", cell_item.level.toString()); tr.setAttribute("is_fold", "false"); tr.setAttribute("able_fold", "false");
            tr.setAttribute("type", cell_item.type);
          }
          // 处理表格行的可折叠属性。若该行缩进数更多，则上一项必然可被折叠。最后一个肯定不能折叠故不用尾判断
          if (prev_tr
            && !isNaN(Number(prev_tr.getAttribute("tr_level"))) 
            && Number(prev_tr.getAttribute("tr_level")) < cell_item.level
          ){
            prev_tr.setAttribute("able_fold", "true")
          }
          prev_tr = tr
        }

        // 创建表格单元格 (md版)
        let td = document.createElement(is_head?"th":"td"); tr!.appendChild(td); td.setAttribute("rowspan", cell_item.tableRowSpan.toString());        
        if (cell_item.tableColumn==0 && is_folder) { // 首列，处理文件夹
          let td_svg = document.createElement("div"); td.appendChild(td_svg); td_svg.classList.add("ab-list-table-svg")
          // https://www.w3schools.com/css/css_icons.asp, https://fontawesome.com/
          if (cell_item.type=="folder") {
            td_svg.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M64 480H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H288c-10.1 0-19.6-4.7-25.6-12.8L243.2 57.6C231.1 41.5 212.1 32 192 32H64C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64z"/></svg>`
            cell_item.content = cell_item.content.slice(0, -1);
          } else {
            td_svg.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M320 464c8.8 0 16-7.2 16-16l0-288-80 0c-17.7 0-32-14.3-32-32l0-80L64 48c-8.8 0-16 7.2-16 16l0 384c0 8.8 7.2 16 16 16l256 0zM0 64C0 28.7 28.7 0 64 0L229.5 0c17 0 33.3 6.7 45.3 18.7l90.5 90.5c12 12 18.7 28.3 18.7 45.3L384 448c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 64z"/></svg>`
          }
        }
        let td_cell = document.createElement("div"); td.appendChild(td_cell); td_cell.classList.add("ab-list-table-witharrow");
        td_cell.classList.add("markdown-rendered")
        ABConvertManager.getInstance().m_renderMarkdownFn(cell_item.content, td_cell);
      }

      // 折叠列表格 事件绑定
      const l_tr:NodeListOf<HTMLElement> = tbody.querySelectorAll("tr")
      for (let i=0; i<l_tr.length; i++){
        const tr = l_tr[i]
        // 1. 二选一，嵌入内联onclick，mdit使用
        //tr.setAttribute("onclick", `
        //  const tr = this
        //  const l_tr = tr.parentNode.querySelectorAll("tr")
        //  const i = ${i}
        //  const tr_level = Number(tr.getAttribute("tr_level"))
        //  if (isNaN(tr_level)) return
        //  const tr_isfold = tr.getAttribute("is_fold")
        //  if (!tr_isfold) return
        //  let flag_do_fold = false  // 防止折叠最小层
        //  for (let j=i+1; j<l_tr.length; j++){
        //    const tr2 = l_tr[j]
        //    const tr_level2 = Number(tr2.getAttribute("tr_level"))
        //    if (isNaN(tr_level2)) break
        //    if (tr_level2<=tr_level) break
        //    (tr_isfold == "true") ? tr2.style.display = "" : tr2.style.display = "none"
        //    flag_do_fold = true
        //  }
        //  if (flag_do_fold) tr.setAttribute("is_fold", tr_isfold=="true"?"false":"true")
        //`)
        // 2. 二选一，正常绑定方法，ob使用
        tr.onclick = ()=>{
          const tr_level = Number(tr.getAttribute("tr_level"))
          if (isNaN(tr_level)) return
          const tr_isfold = tr.getAttribute("is_fold")
          if (!tr_isfold) return
          let flag_do_fold = false  // 防止折叠最小层
          for (let j=i+1; j<l_tr.length; j++){
            const tr2 = l_tr[j]
            const tr_level2 = Number(tr2.getAttribute("tr_level"))
            if (isNaN(tr_level2)) break
            if (tr_level2<=tr_level) break
            (tr_isfold == "true") ? tr2.style.display = "" : tr2.style.display = "none"
            flag_do_fold = true
          }
          if (flag_do_fold) tr.setAttribute("is_fold", tr_isfold=="true"?"false":"true")
        }
      }

    }

    return div
  }
}

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

// =======================================================================

/**
 * ascii目录数据
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
