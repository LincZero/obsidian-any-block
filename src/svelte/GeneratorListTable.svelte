<script lang="ts">
  import { onMount } from 'svelte';
  import { MarkdownRenderer, MarkdownRenderChild } from 'obsidian'
  import type {List_TableInfo} from "src/ab_converter/converter/listProcess"

  export let list_tableInfo:List_TableInfo;
  export let modeT:boolean;
  export let prev_line: number;
  export let tr_line_level: number[];
  export let is_folder: boolean;

  let table:HTMLDivElement;
  onMount(async()=>{
    // 表格数据 组装成表格
    table.addClasses(["ab-table", "ab-list-table"])
    if (is_folder) table.addClass("ab-list-folder")
    if (modeT) table.setAttribute("modeT", "true")
    let thead
    if(list_tableInfo[0].content.indexOf("< ")==0){ // 判断是否有表头
      thead = table.createEl("thead")
      list_tableInfo[0].content=list_tableInfo[0].content.replace(/^\<\s/,"")
    }
    const tbody = table.createEl("tbody")
    let prev_tr = null   // 用来判断是否可以折叠
    for (let index_line=0; index_line<prev_line+1; index_line++){ // 遍历表格行，创建tr……
      let is_head
      let tr
      // 行 - 表头行（即是否第一行&&是否有表头）
      if (index_line==0 && thead){
        tr = thead.createEl("tr", {
          // attr: {"tr_level": tr_line_level[index_line]}
        })
        is_head = true
      }
      // 行 - 非表头行
      else{
        is_head = false
        tr = tbody.createEl("tr", {
          cls: ["ab-foldable-tr"],
          attr: {
            "tr_level": tr_line_level[index_line], 
            "is_fold": "false",
            "able_fold": "false"
          }
        })
        // 判断上一个是否可折叠。不需要尾判断，最后一个肯定不能折叠
        if (prev_tr 
          && !isNaN(Number(prev_tr.getAttribute("tr_level"))) 
          && Number(prev_tr.getAttribute("tr_level"))<tr_line_level[index_line]
        ){
          prev_tr.setAttribute("able_fold", "true")
        }
        prev_tr = tr
      }
      // 列 - 遍历表格列，创建td
      for (let item of list_tableInfo){
        if (item.tableLine!=index_line) continue
        // md版
        let td = tr.createEl(is_head?"th":"td", {
          attr:{"rowspan": item.tableRow}
        })
        let td_cell = td.createDiv({cls: "ab-list-table-witharrow"})
        const child = new MarkdownRenderChild(td_cell);
        td_cell.addClass("markdown-rendered")
        MarkdownRenderer.renderMarkdown(item.content, td_cell, "", child);
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
          tr_isfold=="true"?tr2.show():tr2.hide()
          flag_do_fold = true
        }
        if (flag_do_fold) tr.setAttribute("is_fold", tr_isfold=="true"?"false":"true")
      }
    }
  })
</script>

<table bind:this={table}>
</table>
