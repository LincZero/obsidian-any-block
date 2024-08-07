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

export interface LTableItem extends ListItem {
  // content
  // level                // 舍弃，无用。在TableItem中，level=缩进等级=第几列。但在LTableItem中，level=第几列!=缩进等级，首列缩进用`&nbsp;`表示
  tableRow: number,       // 对应首行序列
  tableColumn: number,    // 对应首列序列，主要看是否第一列，如果是则是主体
  tableRowSpan: 1,        // 跨行数，一般总是一
  type: string            // 文件类型。仅第一列有效
}
export type List_LTableItem = LTableItem[]

export class DirProcess{
  /** 列表转列表格 */
  static list2lt(text: string, div: HTMLDivElement, modeT=false) {
    let list_itemInfo = DirProcess.list2uldata(text)
    return DirProcess.uldata2ultable(list_itemInfo, div, modeT)
  }

  /** 列表转树形目录 */
  static list2dt(text: string, div: HTMLDivElement, modeT=false) {
    let list_itemInfo = DirProcess.list2uldata(text)
    return DirProcess.uldata2ultable(list_itemInfo, div, modeT, true)
  }

  /**
   * 列表文本转列表表格数据
   * 
   * 只能通过“|”符号实现跨列
   * 所以这种是没有合并单元格
   * 
   * 第一列的level总为0
   */
  static list2uldata(text: string): List_LTableItem{
    let list_itemInfo:List_LTableItem = []
    
    const list_text = text.split("\n")
    // 遍历每行
    for (let line of list_text) {
      const m_line = line.match(ABReg.reg_list_noprefix)
      // 新列表项 (新的行)
      if (m_line) {
        const content = m_line[4]                                       // 这一行的内容
        let list_inline: string[] = content.split(ABReg.inline_split)   // 这一行的多个列
        let level_inline: number = m_line[1].length                     // 缩进数
        // 便利这一行的多个列 (`| `分列)
        for (let inline_i=0; inline_i<list_inline.length; inline_i++){
          // 第一列
          if(inline_i==0) {
            // 文件扩展名
            let type: string;
            if (list_inline[inline_i].endsWith("/")) {
              type = "folder"
            } else {
              const parts = list_inline[inline_i].split('.');
              if (parts.length === 0 || parts[parts.length - 1] === '') type = '';
              else type = parts[parts.length - 1];
            }
            // 将缩进信息变为编码信息保存 // @bug。需要分开处理tab和space两种情况。这里统一坍塌成 "1"
            for (let i=0; i<level_inline; i++) list_inline[inline_i] = "&nbsp;" + list_inline[inline_i]
            // 填充
            list_itemInfo.push({
              content: list_inline[inline_i],
              level: 0,
              tableRow: 0,
              tableColumn: 0,
              type: type,
              tableRowSpan: 1,
            })
          }
          // 第n列
          else{
            list_itemInfo.push({
              content: list_inline[inline_i],
              level: 0,
              tableRow: 0,
              tableColumn: level_inline+inline_i,
              type: "",
              tableRowSpan: 1,
            })
          }
        }
      }
      // 旧列表项追加，即内换行
      else{
        let itemInfo = list_itemInfo.pop()
        if(itemInfo){
          list_itemInfo.push({
            content: itemInfo.content+"\n"+line.trim(),
            level: 0,
            tableRow: 0,
            tableColumn: itemInfo.level,
            type: itemInfo.type,
            tableRowSpan: 1,
          })
        }
      }
    }
    return list_itemInfo
  }

  /** 列表格数据转列表格
   * 注意传入的列表数据应该符合：
   * 第一列等级为0、没有分叉
   */
  static uldata2ultable(
    list_itemInfo: List_LTableItem, 
    div: HTMLDivElement,
    modeT: boolean,
    is_folder=false
  ){
    // 组装成表格数据 (列表是深度优先)
    let tr_line_level: number[] = [] // 表格行等级（树形表格独有）
    let list_tableInfo:List_LTableItem = []
    let prev_line = -1   // 并存储后一行的序列!
    let prev_level = 999 // 上一行的等级
    for (let i=0; i<list_itemInfo.length; i++){
      let item = list_itemInfo[i]
      let item_type:string = ""

      // 获取所在行数。分换行（创建新行）和不换行，第一行总是创建新行
      // 这里的if表示该换行了
      if (item.tableColumn <= prev_level) {
        prev_line++
        if (item.tableColumn==0) {
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
      prev_level = item.tableColumn

      // 填写
      list_tableInfo.push({
        content: item.content,
        level: item.tableColumn,
        tableRow: prev_line,    //
        tableColumn: item.tableColumn,
        tableRowSpan: item.tableRowSpan,
        type: item.type,
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
          if (item.tableRow!=index_line) continue
          // md版
          let td = document.createElement(is_head?"th":"td"); tr.appendChild(td); td.setAttribute("rowspan", item.tableRowSpan.toString());
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
