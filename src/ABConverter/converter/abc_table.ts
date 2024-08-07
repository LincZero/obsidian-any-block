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
import { type ListItem, type List_ListItem, ListProcess } from "./abc_list"

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
    tableRow: number,       // 跨行数
    tableLine: number       // 对应首行序列
}
export type List_TableItem = TableItem[]  

/// 一些表格相关的工具集
export class TableProcess{
  /** 列表转表格 */
  static list2table(text: string, div: HTMLDivElement, modeT=false): HTMLDivElement {
    let list_itemInfo = ListProcess.list2data(text)
    return TableProcess.data2table(list_itemInfo, div, modeT)
  }

  /** 列表转列表格 */
  static list2lt(text: string, div: HTMLDivElement, modeT=false) {
    let list_itemInfo = ListProcess.list2uldata(text)
    return TableProcess.uldata2ultable(list_itemInfo, div, modeT)
  }

  /** 列表转树形目录 */
  static list2dt(text: string, div: HTMLDivElement, modeT=false) {
    let list_itemInfo = ListProcess.list2uldata(text)
    return TableProcess.uldata2ultable(list_itemInfo, div, modeT, true)
  }

  /** 列表转二维表格 */
  static list2ut(text: string, div: HTMLDivElement, modeT=false) {
    //【old】
    /*let list_itemInfo = ListProcess.old_ulist2data(text)
    return TableProcess.data2table(list_itemInfo, div)*/
    //【new】
    let data = ListProcess.list2data(text)
    data = ListProcess.data2strict(data)
    data = ListProcess.data_mL_2_2L(data)
    data = ListProcess.data_2L_2_mL1B(data)
    return TableProcess.data2table(data, div, modeT)
  }

  /** 一级列表转时间线 */
  static list2timeline(text: string, div: HTMLDivElement, modeT=false) {
    let data = ListProcess.list2data(text)
    data = ListProcess.data2strict(data)
    data = ListProcess.data_mL_2_2L(data)
    div = TableProcess.data2table(data, div, modeT)
    const table = div.querySelector("table")
    if (table) table.classList.add("ab-table-fc", "ab-table-timeline")
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
        tableRow: tableRow,     // 跨行数
        tableLine: prev_line    // 对应首行序列
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
          if (item.tableLine!=index_line) continue
          let td = document.createElement(is_head?"th":"td"); tr.appendChild(td); td.setAttribute("rowspan", item.tableRow.toString());
          td.classList.add("markdown-rendered")
          ABConvertManager.getInstance().m_renderMarkdownFn(item.content, td)
        }
      }
    }

    return div
  }

  /** 列表格数据转列表格
   * 注意传入的列表数据应该符合：
   * 第一列等级为0、没有分叉
   */
  static uldata2ultable(
    list_itemInfo: List_ListItem, 
    div: HTMLDivElement,
    modeT: boolean,
    is_folder=false
  ){
    // 组装成表格数据 (列表是深度优先)
    let tr_line_level: number[] = [] // 表格行等级（树形表格独有）
    let list_tableInfo:List_TableItem = []
    let prev_line = -1   // 并存储后一行的序列!
    let prev_level = 999 // 上一行的等级
    for (let i=0; i<list_itemInfo.length; i++){
      let item = list_itemInfo[i]
      let item_type:string = ""

      // 获取所在行数。分换行（创建新行）和不换行，第一行总是创建新行
      // 这里的if表示该换行了
      if (item.level <= prev_level) {
        prev_line++
        if (item.level==0) {
          /** @可优化 前面是列表级别转空格，现在是删除空格转回列表级别。这受限于Item格式 */
          const matchs = item.content.match(/^((&nbsp;)*)/)
          if (!matchs) return div
          if (!matchs[1]) tr_line_level.push(0)
          else tr_line_level.push(Math.round(matchs[1].length/6)) // 6就是`&nbsp;`，注意，前面的处理有问题，在这里无论是tab还是空格对只对应一个`&nbsp;`
          item.content = item.content.replace(/^((&nbsp;)*)/, "")
          
          // 由字符串前缀得出文件格式
          if(is_folder){
            let type: string;
            if (item.content.endsWith("/")) {
              type = "folder"
            } else {
              const parts = item.content.split('.');
              if (parts.length === 0 || parts[parts.length - 1] === '') type = '';
              else type = parts[parts.length - 1];
            }

            item_type = type
          }
        }
        else {
          tr_line_level.push(0)
          console.warn("数据错误：列表格中跨行数据")
        }
      }
      prev_level = item.level

      // 填写
      list_tableInfo.push({
        content: item.content,
        level: item.level,
        tableRow: 1,
        tableLine: prev_line,
        // tableColumn, // 不一定有
      })
    }

    // GeneratorListTable，原Svelte
    {
      // 表格数据 组装成表格
      const table = document.createElement("table"); div.appendChild(table); table.classList.add("ab-table", "ab-list-table")
      if (is_folder) table.classList.add("ab-list-folder")
      if (modeT) table.setAttribute("modeT", "true")
      let thead
      if(list_tableInfo[0].content.indexOf("< ")==0){ // 判断是否有表头
        thead = document.createElement("thead"); table.appendChild(thead);
        list_tableInfo[0].content=list_tableInfo[0].content.replace(/^\<\s/,"")
      }
      const tbody = document.createElement("tbody"); table.appendChild(tbody);
      let prev_tr: HTMLElement|null = null   // 用来判断是否可以折叠

      // 遍历表格行，创建tr
      for (let index_line=0; index_line<prev_line+1; index_line++){
        let is_head
        let tr: HTMLElement
        // 行 - 表头行（即是否第一行&&是否有表头）
        if (index_line==0 && thead){
          tr = document.createElement("tr"); thead.appendChild(tr); // attr: {"tr_level": tr_line_level[index_line]}
          is_head = true
        }
        // 行 - 非表头行
        else{
          is_head = false
          tr = document.createElement("tr"); tbody.appendChild(tr); tr.classList.add("ab-foldable-tr");
            tr.setAttribute("tr_level", tr_line_level[index_line].toString()); tr.setAttribute("is_fold", "false"); tr.setAttribute("able_fold", "false");
          // 判断上一个是否可折叠。不需要尾判断，最后一个肯定不能折叠
          if (prev_tr 
            && !isNaN(Number(prev_tr.getAttribute("tr_level"))) 
            && Number(prev_tr.getAttribute("tr_level")) < tr_line_level[index_line]
          ){
            prev_tr.setAttribute("able_fold", "true")
          }
          prev_tr = tr
        }

        // 遍历表格列，创建td
        for (let item of list_tableInfo){
          if (item.tableLine!=index_line) continue
          // md版
          let td = document.createElement(is_head?"th":"td"); tr.appendChild(td); td.setAttribute("rowspan", item.tableRow.toString());
          let td_cell = document.createElement("div"); td.appendChild(td_cell); td_cell.classList.add("ab-list-table-witharrow");
          td_cell.classList.add("markdown-rendered")
          ABConvertManager.getInstance().m_renderMarkdownFn(item.content, td_cell);
        }
      }

      // 折叠列表格 事件绑定
      const l_tr:NodeListOf<HTMLElement> = tbody.querySelectorAll("tr")
      for (let i=0; i<l_tr.length; i++){
        const tr = l_tr[i]
        /*const tr_level = Number(tr.getAttribute("tr_level"))
        if (isNaN(tr_level)) continue
        const tr_isfold = tr.getAttribute("is_fold")
        if (!tr_isfold) continue*/
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
            // tr2.setAttribute("style", "display:"+(tr_isfold=="true"?"block":"none"))
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
  
  
// 纯组合，后续用别名模块替代
const abc_title2table = ABConvert.factory({
  id: "title2table",
  name: "标题到表格",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    content = ListProcess.title2list(content, el)
    TableProcess.list2table(content, el)
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
    TableProcess.list2table(content, el, matchs[2]=="T")
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
    TableProcess.list2lt(content, el, matchs[2]=="T")
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
    TableProcess.list2dt(content, el, matchs[2]=="T")
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
    TableProcess.list2ut(content, el, matchs[2]=="T")
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
    TableProcess.list2timeline(content, el, matchs[2]=="T")
    return el
  }
})
