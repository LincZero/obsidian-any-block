import { MarkdownRenderer, MarkdownRenderChild } from 'obsidian'
import { isNull } from 'util'

export default class ListProcess{

  /** 列表转表格
   * @param modeMD: md（使用md嵌套功能）功耗可能较大
   */
  static list2table(text: string, div: HTMLDivElement, modeMD=false) {
    let list_itemInfo = this.list2data(text)
    return this.data2table(list_itemInfo, div, modeMD)
  }

  /** 列表转列表格 */
  static list2lt(text: string, div: HTMLDivElement, modeMD=false) {
    let list_itemInfo = this.list2data(text, true)
    return this.data2table(list_itemInfo, div, modeMD)
  }

  /** 列表转二维表格 */
  static list2ut(text: string, div: HTMLDivElement, modeMD=false) {
    let list_itemInfo = this.ulist2data(text)
    return this.data2table(list_itemInfo, div, modeMD)
  }

  /** 列表转mermaid流程图 */
  static list2mermaid(text: string, div: HTMLDivElement) {
    let list_itemInfo = this.list2data(text)
    return this.data2mermaid(list_itemInfo, div)
  }

  /** 列表文本转列表数据 
   *  @bug 不能跨缩进，后面再对异常缩进进行修复
   *  @bug 内换行` | `可能有bug
   *  @param modeT: 保留缩进模式
   *  @param modeG: 识别符号 ` | `（该选项暂时不可用，强制为true）
   */
  private static list2data(text: string, modeT=false, modeG=true){
    if (modeT) return this.ullist2data(text)

    /** 内联补偿列表。只保留comp>0的项 */
    let list_inline_comp:{
      level:number,
      inline_comp:number
    }[] = []
    /** 更新 list_level_inline 的状态，并返回该项的补偿值 
     * 流程：先向左溯源，再添加自己进去
     */
    function update_inline_comp(
      level:number, 
      inline_comp:number
    ): number{
      // 完全不用` | `命令就跳过了
      if (list_inline_comp.length==0 && inline_comp==0) return 0

      // 向左溯源（在左侧时）直到自己在补偿列表的右侧
      while(list_inline_comp.length && list_inline_comp[list_inline_comp.length-1].level>=level){
        list_inline_comp.pop()
      }
      if (list_inline_comp.length==0 && inline_comp==0) return 0 // 提前跳出

      // 计算总补偿值（不包括自己）
      let total_comp
      if (list_inline_comp.length==0) total_comp = 0
      else total_comp = list_inline_comp[list_inline_comp.length-1].inline_comp

      // 添加自己进去
      if (inline_comp>0) list_inline_comp.push({
        level: level, 
        inline_comp: inline_comp+total_comp
      })

      return total_comp
    }

    // 列表文本转列表数据
    let list_itemInfo:{
      content:string,
      level:number,
    }[] = []

    const list_text = text.split("\n")
    for (let line of list_text) {                                             // 每行
      if (/^\s*?-\s(.*?)/.test(line)) {
        let list_inline: string[] = line.replace(/^\s*?-\s/, "").split("| ") // 内联分行
        /** @bug  制表符长度是1而非4 */
        let level_inline: number = line.replace(/-\s(.*?)$/, "").length
        let inline_comp = update_inline_comp(level_inline, list_inline.length-1)
                                                                              // 不保留缩进（普通树表格）
        for (let index=0; index<list_inline.length; index++){
          list_itemInfo.push({
            content: list_inline[index],
            level: level_inline+index+inline_comp
          })
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

  // 这种类型的列表只有两层
  private static ulist2data(text: string){
    // 列表文本转列表数据
    let list_itemInfo:{
      content:string,
      level:number,
    }[] = []

    let level1 = -1
    let level2 = -1
    const list_text = text.split("\n")
    for (let line of list_text) {                                             // 每行
      if (/^\s*?-\s(.*?)/.test(line)) {
        let level_inline: number = line.replace(/-\s(.*?)$/, "").length
        let this_level: number                                    // 一共三种可能：1、2、3，3表示其他level
        if (level1<0) {level1=level_inline; this_level = 1}       // 未配置level1
        else if (level1>=level_inline) this_level = 1             // 是level1
        else if (level2<0) {level2=level_inline; this_level = 2}  // 未配置level2
        else if (level2>=level_inline) this_level = 2             // 是level2
        else {                                                    // 内换行
          let itemInfo = list_itemInfo.pop()
          if(itemInfo){
            list_itemInfo.push({
              content: itemInfo.content+"\n"+line.trim(),
              level: itemInfo.level
            })
          }
          continue
        }
        list_itemInfo.push({
          content: line.replace(/^\s*?-\s/, ""),
          level: this_level
        })
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

    // 二层树转一叉树
    let count_level_2 = 0
    for (let item of list_itemInfo){
      if (item.level==2){
        item.level += count_level_2
        count_level_2++
      }
      else {
        count_level_2 = 0
      }
    }
    
    return list_itemInfo
  }

  private static ullist2data(text: string){
    // 列表文本转列表数据
    let list_itemInfo:{content:string,level:number}[] = []
    
    const list_text = text.split("\n")
    for (let line of list_text) {                                             // 每行
      if (/^\s*?-\s(.*?)/.test(line)) {
        let list_inline: string[] = line.replace(/^\s*?-\s/, "").split("| ") // 内联分行
        let level_inline: number = line.replace(/-\s(.*?)$/, "").length
                                                                              // 保留缩进（列表格）
        for (let inline_i=0; inline_i<list_inline.length; inline_i++){
          if(inline_i==0) {                                                   // level为内联缩进
            for (let i=0; i<level_inline; i++) list_inline[inline_i] = "____" + list_inline[inline_i]
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

  /** 列表数据转表格 */
  private static data2table(
    list_itemInfo: {
      content: string;
      level: number;
    }[], 
    div: HTMLDivElement,
    modeMD: boolean,
  ){
    // 组装成表格数据 (列表是深度优先)
    let list_itemInfo2 = []
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
        else if (list_itemInfo[j].level > list_itemInfo[i].level){ // 换行但是不换item项的行
          row_level = list_itemInfo[j].level
          tableRow++
        }
        else break                                                // 换item项的行
      }

      // 获取所在行数。分换行（创建新行）和不换行，第一行总是创建新行
      if (item.level <= prev_level) {
        prev_line++
      }
      prev_level = item.level

      // 填写
      list_itemInfo2.push({
        content: item.content,  // 内容
        level: item.level,      // 级别
        tableRow: tableRow,     // 跨行数
        tableLine: prev_line    // 对应首行序列
      })
    }

    // 表格数据 组装成表格
    div = div.createEl("table")
    let thead
    if(list_itemInfo2[0].content.indexOf("< ")==0){ // 判断是否有表头
      thead = div.createEl("thead")
      list_itemInfo2[0].content=list_itemInfo2[0].content.replace(/^\<\s/,"")
    }
    const tbody = div.createEl("tbody")
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
      for (let item of list_itemInfo2){                           // 遍历表格列，创建td
        if (item.tableLine!=index_line) continue
        if (modeMD) {   // md版
          let td = tr.createEl(is_head?"th":"td", {
            attr:{"rowspan": item.tableRow}
          })
          const child = new MarkdownRenderChild(td);
          MarkdownRenderer.renderMarkdown(item.content, td, "", child);
        }
        else{           // 非md版
          tr.createEl(is_head?"th":"td", {
            text: item.content, 
            attr:{"rowspan": item.tableRow}
          })
        }
      }
    }
    return div
  }

  /** 列表数据转mermaid流程图 */
  private static data2mermaid(
    list_itemInfo: {
      content: string;
      level: number;
    }[], 
    div: HTMLDivElement
  ){
    const html_mode = false    // @todo 暂时没有设置来切换这个开关

    let list_line_content:string[] = html_mode?['<pre class="mermaid">', "graph LR"]:["```mermaid", "graph LR"]
    let prev_line_content = ""
    let prev_level = 999
    for (let i=0; i<list_itemInfo.length; i++){
      if (list_itemInfo[i].level>prev_level){ // 向右正常加箭头
        prev_line_content = prev_line_content+" --> "+list_itemInfo[i].content
      } else {                                // 换行，并……
        list_line_content.push(prev_line_content)
        prev_line_content = ""

        for (let j=i; j>=0; j--){             // 回退到上一个比自己大的
          if(list_itemInfo[j].level<list_itemInfo[i].level) {
            prev_line_content = list_itemInfo[j].content
            break
          }
        }
        if (prev_line_content) prev_line_content=prev_line_content+" --> "  // 如果有比自己大的
        prev_line_content=prev_line_content+list_itemInfo[i].content
      }
      prev_level = list_itemInfo[i].level
    }
    list_line_content.push(prev_line_content)
    list_line_content.push(html_mode?"</pre>":"```")

    let text = list_line_content.join("\n")
    const child = new MarkdownRenderChild(div);
    return MarkdownRenderer.renderMarkdown(text, div, "", child);
  }
}
