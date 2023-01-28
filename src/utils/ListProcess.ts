import { MarkdownRenderer, MarkdownRenderChild } from 'obsidian'

export default class ListProcess{

  /** 列表转表格 */
  static list2table(text: string, div: HTMLDivElement) {
    let list_itemInfo = this.list2data(text)
    return this.data2table(list_itemInfo, div)
  }

  /** 列表转列表格 */
  static list2lt(text: string, div: HTMLDivElement) {
    let list_itemInfo = this.list2data(text, true)
    return this.data2table(list_itemInfo, div)
  }

  /** 列表转mermaid流程图 */
  static list2mermaid(text: string, div: HTMLDivElement) {
    let list_itemInfo = this.list2data(text)
    return this.data2mermaid(list_itemInfo, div)
  }

  /** 列表文本转列表数据 
   *  @bug 不能跨缩进，后面再对异常缩进进行修复
   *  @param modeT: 保留缩进模式
   *  @param modeG: 识别符号 ` | `（该选项暂时不可用，强制为true）
   */
  private static list2data(text: string, modeT=false, modeG=true){
    // 列表文本转列表数据
    let list_itemInfo = []
    const list_text = text.split("\n")
    for (let line of list_text) {                                             // 每行
      if (/^\s*?-\s(.*?)/.test(line)) {
        let list_inline: string[] = line.replace(/^\s*?-\s/, "").split(" | ") // 内联分行
        let level_inline: number = line.replace(/-\s(.*?)$/, "").length
        if(modeT) {                                                           // 保留缩进
          for (let index=0; index<list_inline.length; index++){
            if(index==0) {                        // level为内联缩进
              for (let i=0; i<level_inline; i++) list_inline[index] = "__" + list_inline[index]
              list_itemInfo.push({
                content: list_inline[index],
                level: 0
              })
            }
            else{                                 // level为table的列数
              list_itemInfo.push({
                content: list_inline[index],
                level: level_inline+index
              })
            }
          }
        }
        else{
          for (let index=0; index<list_inline.length; index++){
            list_itemInfo.push({
              content: list_inline[index],
              level: level_inline+index
            })
          }
        }
      }
      else{
        break
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
    div: HTMLDivElement
  ){
    // 组装成表格数据 (列表是深度优先)
    let list_itemInfo2 = []
    let prev_line = 0 // 并存储最高行数
    let prev_level = -1
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

      // 获取所在行数。分换行和不换行
      if (item.level <= prev_level) {
        prev_line++
      }
      prev_level = item.level

      // 填写
      list_itemInfo2.push({
        content: item.content,  // 内容
        level: item.level,      // 级别
        tableRow: tableRow,     // 跨行数
        tableLine: prev_line    // 对应首行
      })
    }

    console.log("list_itemInfo2", list_itemInfo2)

    // 表格数据 组装成表格
    div = div.createEl("table").createEl("tbody")
    for (let index_line=0; index_line<prev_line+1; index_line++){
      let tr = div.createEl("tr")
      for (let item of list_itemInfo2){
        if (item.tableLine==index_line) {
          tr.createEl("td", {
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
    let list_line_content:string[] = ["```mermaid", "graph LR"]
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
    list_line_content.push("```")

    console.log(list_line_content)

    let text = list_line_content.join("\n")
    const child = new MarkdownRenderChild(div);
    return MarkdownRenderer.renderMarkdown(text, div, "", child);
  }
}
