/**
 * 处理器_表格版
 * 
 * - md_str <-> 表格数据
 * - 表格数据 <-> html
 * - 列表数据 -> 表格数据
 */

import { ABReg } from '../ABReg'
import {ABConvert_IOEnum, ABConvert, type ABConvert_SpecSimp} from "./ABConvert"
import {ABConvertManager} from "../ABConvertManager"
import { type ListItem, type List_ListItem, ListProcess, abc_title2listdata, abc_list2listdata } from "./abc_list"
import { type C2ListItem, type List_C2ListItem, C2ListProcess } from "./abc_c2list"

/**
 * 通用表格数据，一个元素等于是一个单元格项 (th/td)
 * 
 * 例如：
 * - a1
 *   - a2
 *     - a3
 *   - b2
 *     - b3
 * to
 * |a1|a2|a3|
 * |^ |b2|b3|
 * with
 * {
 *   // 前两列是ListItem来的东西
 *   // 第2列是用来算第3列的，将第3列算出来后，即数据分析完后，第2列就没有用了
 *   {a1, 无用, 2, 1},
 *   {a2, 无用, 1, 1},
 *   {a3, 无用, 1, 1},
 *   {b2, 无用, 1, 2},
 *   {b3, 无用, 1, 2},
 * }
 */
export interface TableItem extends ListItem{
    tableRowSpan: number,       // 跨行数
    //tableColumnSpan: number,  // 跨列数
    tableRow: number,           // 对应首行序列
    //tableColum: number,       // 对应首列序列
}
export type List_TableItem = TableItem[]  

/// 一些表格相关的工具集
export class TableProcess{

  /** 列表转二维表格 */
  static list2ut(text: string, div: HTMLDivElement, modeT=false) {
    //【old】
    /*let list_itemInfo = ListProcess.old_ulist2data(text)
    return TableProcess.data2table(list_itemInfo, div)*/
    //【new】
    let data = ListProcess.list2data(text)
    data = ListProcess.data2strict(data)
    data = C2ListProcess.data_mL_2_2L(data)
    data = ListProcess.data_2L_2_mL1B(data)
    return TableProcess.data2table(data, div, modeT)
  }

  /** 列表转时间线 */
  static list2timeline(text: string, div: HTMLDivElement, modeT=false) {
    let data = C2ListProcess.list2c2data(text)
    div = TableProcess.data2table(data, div, modeT)
    const table = div.querySelector("table")
    if (table) table.classList.add("ab-table-timeline", "ab-table-fc")
    return div 
  }

  /** 标题转时间线 */
  static title2timeline(text: string, div: HTMLDivElement, modeT=false) {
    let data = C2ListProcess.title2c2data(text)
    div = TableProcess.data2table(data, div, modeT)
    const table = div.querySelector("table")
    if (table) table.classList.add("ab-table-timeline", "ab-table-fc")
    return div 
  }

  /** 列表数据转表格 */
  static data2table(
    list_itemInfo: List_ListItem, 
    div: HTMLDivElement,
    modeT: boolean        // 是否转置
  ){
    // 组装成表格数据 (列表是深度优先)
    let list_tableInfo:List_TableItem = []
    let prev_line = -1   // 并存储后一行的序列!
    let prev_level = 999 // 上一行的等级
    for (let i=0; i<list_itemInfo.length; i++){
      let item = list_itemInfo[i]
      
      // 获取跨行数
      let tableRow = 1
      let row_level = list_itemInfo[i].level
      for (let j=i+1; j<list_itemInfo.length; j++) {
        if (list_itemInfo[j].level > row_level){                  // 在右侧，不换行
          row_level = list_itemInfo[j].level
        }
        else if (list_itemInfo[j].level > list_itemInfo[i].level){// 换行但是不换item项的行
          row_level = list_itemInfo[j].level
          tableRow++
        }
        else break                                                // 换item项的行
      }

      // 获取所在行数。分换行（创建新行）和不换行，第一行总是创建新行
      // 这里的if表示该换行了
      if (item.level <= prev_level) {
        prev_line++
      }
      prev_level = item.level

      // 填写
      list_tableInfo.push({
        content: item.content,  // 内容
        level: item.level,      // 级别
        tableRowSpan: tableRow,     // 跨行数
        tableRow: prev_line    // 对应首行序列
      })
    }

    // GeneratorBranchTable，原来是svelte
    {
      // 表格数据 组装成表格
      const table = document.createElement("table"); div.appendChild(table); table.classList.add("ab-table", "ab-branch-table")
      if (modeT) table.setAttribute("modeT", "true")
      let thead
      if(list_tableInfo[0].content.indexOf("< ")==0){ // 判断是否有表头
        thead = document.createElement("thead"); table.appendChild(thead);
        list_tableInfo[0].content=list_tableInfo[0].content.replace(/^\<\s/,"")
      }
      const tbody = document.createElement("tbody"); table.appendChild(tbody);
      for (let index_line=0; index_line<prev_line+1; index_line++){ // 遍历表格行，创建tr……
        let is_head
        let tr
        if (index_line==0 && thead){ // 判断是否第一行&&是否有表头
          tr = document.createElement("tr"); thead.appendChild(tr);
          is_head = true
        }
        else{
          is_head = false
          tr = document.createElement("tr"); tbody.appendChild(tr);
        }
        for (let item of list_tableInfo){                           // 遍历表格列，创建td
          if (item.tableRow!=index_line) continue
          let td = document.createElement(is_head?"th":"td"); tr.appendChild(td);
            td.setAttribute("rowspan", item.tableRowSpan.toString()); td.setAttribute("col_index", item.level.toString())
          ABConvertManager.getInstance().m_renderMarkdownFn(item.content, td)
        }
      }
    }

    return div
  }
}

// 纯组合，后续用别名模块替代
const abc_title2table = ABConvert.factory({
  id: "title2table",
  name: "标题到表格",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: string): HTMLElement=>{
    const data: List_ListItem = abc_title2listdata.process(el, header, content) as List_ListItem
    return el = TableProcess.data2table(data, el, false) as HTMLDivElement
  }
})

// 纯组合，后续用别名模块替代
const abc_list2table = ABConvert.factory({
  id: "list2table",
  name: "列表转表格",
  match: /list2(md)?table(T)?/,
  default: "list2table",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: string): HTMLElement=>{
    const matchs = header.match(/list2(md)?table(T)?/)
    if (!matchs) return el
    const data: List_ListItem = abc_list2listdata.process(el, header, content) as List_ListItem
    return el = TableProcess.data2table(data, el, matchs[2]=="T") as HTMLDivElement
  }
})

const abc_list2c2table = ABConvert.factory({
  id: "list2c2t",
  name: "列表转二列表格",
  match: "list2c2t",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: string): HTMLElement=>{
    let data = C2ListProcess.list2c2data(content)
    TableProcess.data2table(data, el, false)
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
  process: (el, header, content: string): HTMLElement=>{
    const matchs = header.match(/list2(md)?ut(T)?/)
    if (!matchs) return el
    TableProcess.list2ut(content, el, matchs[2]=="T")
    return el
  }
})

const abc_list2timeline = ABConvert.factory({
  id: "list2timeline",
  name: "列表转时间线",
  match: /list2(md)?timeline(T)?/,
  default: "list2mdtimeline",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: string): HTMLElement=>{
    const matchs = header.match(/list2(md)?timeline(T)?/)
    if (!matchs) return el
    TableProcess.list2timeline(content, el, matchs[2]=="T")
    return el
  }
})

const abc_title2timeline = ABConvert.factory({
  id: "title2timeline",
  name: "标题转时间线",
  match: /title2(md)?timeline(T)?/,
  default: "title2mdtimeline",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: string): HTMLElement=>{
    const matchs = header.match(/title2(md)?timeline(T)?/)
    if (!matchs) return el
    TableProcess.title2timeline(content, el, matchs[2]=="T")
    return el
  }
})
