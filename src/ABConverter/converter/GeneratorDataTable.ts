/// 这个估计本来是想做可排序可筛选的数据表格
import {ABConvertManager} from "../ABConvertManager"
/*
import type {List_TableInfo} from "src/ab_converter/converter/listProcess"

export let list_tableInfo:List_TableInfo;
export let modeT:boolean;
export let prev_line: number;

let table:HTMLDivElement;
// 表格数据 组装成表格
table.addClasses(["ab-table", "ab-data-table"])
if (modeT) table.setAttribute("modeT", "true")
let thead
if(list_tableInfo[0].content.indexOf("< ")==0){ // 判断是否有表头
  thead = table.createEl("thead")
  list_tableInfo[0].content=list_tableInfo[0].content.replace(/^\<\s/,"")
}
const tbody = table.createEl("tbody")
for (let index_line=0; index_line<prev_line+1; index_line++){ // 遍历表格行，创建tr……
  let is_head
  let tr
  if (index_line==0 && thead){ // 判断是否第一行&&是否有表头
    tr = thead.createEl("tr")
    is_head = true
  }
  else{
    is_head = false
    tr = tbody.createEl("tr")
  }
  for (let item of list_tableInfo){                           // 遍历表格列，创建td
    if (item.tableLine!=index_line) continue
    // md版
    let td = tr.createEl(is_head?"th":"td", {
      attr:{"rowspan": item.tableRow}
    })
    ABConvertManager.getInstance().m_renderMarkdownFn(item.content, td)
  }
}
*/
