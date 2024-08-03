/**
 * 处理器_列表版
 * 
 * 列表 -> html/列表
 */

import { ABReg } from '../ABReg'
import {ABConvert_IOEnum, ABConvert, type ABConvert_SpecSimp} from "./ABConvert"
import {ABConvertManager} from "../ABConvertManager"

/**
 * 通用列表数据，一个元素等于是一个列表项
 * 
 * 例如：
 * - a1
 *   - a2
 *   - a3
 * to
 * {
 *   {a1, 0},
 *   {a2, 2},
 *   {a3, 2},
 * }
 * to (nomalization)
 * {
 *   {a1, 0},
 *   {a2, 1},
 *   {a3, 1},
 * }
 */
interface ListItem {
  content: string;        // 内容
  level: number;          // 级别 (缩进空格数/normalization后的递增等级数)
}[]
export type List_ListItem = ListItem[]

export class ListProcess{

  /** title转列表 */
  static title2list(text: string, div: HTMLDivElement): string {
    let list_itemInfo = this.title2data(text)
    list_itemInfo = this.data2strict(list_itemInfo)
    return this.data2list(list_itemInfo)
  }

  /** 列表转表格 */
  static list2table(text: string, div: HTMLDivElement, modeT=false): HTMLDivElement {
    let list_itemInfo = this.list2data(text)
    return TableProcess.data2table(list_itemInfo, div, modeT)
  }

  /** 列表转列表 */
  /*static list2l(text: string, div: HTMLDivElement) {
    let list_itemInfo = this.list2data(text, true)
    return this.data2list(list_itemInfo)
  }*/

  /** 列表转列表格 */
  static list2lt(text: string, div: HTMLDivElement, modeT=false) {
    let list_itemInfo = this.list2data(text, true)
    return TableProcess.uldata2ultable(list_itemInfo, div, modeT)
  }

  /** 列表转树形目录 */
  static list2folder(text: string, div: HTMLDivElement, modeT=false) {
    let list_itemInfo = this.list2data(text, true)
    return TableProcess.uldata2ultable(list_itemInfo, div, modeT, true)
  }

  /** 列表转二维表格 */
  static list2ut(text: string, div: HTMLDivElement, modeT=false) {
    //【old】
    /*let list_itemInfo = this.old_ulist2data(text)
    return this.data2table(list_itemInfo, div)*/
    //【new】
    let data = this.list2data(text)
    console.log("data0",data)
    data = this.data_mL_2_2L(data)
    console.log("data1",data)
    data = this.data_2L_2_mL1B(data)
    return TableProcess.data2table(data, div, modeT)
  }

  /** 一级列表转时间线 */
  static list2timeline(text: string, div: HTMLDivElement, modeT=false) {
    let data = this.list2data(text)
    data = this.data_mL_2_2L(data)
    return TableProcess.data2table(data, div, modeT)
  }

  /** 一级列表转标签栏 */
  static list2tab(text: string, div: HTMLDivElement, modeT=false) {
    let data = this.list2data(text)
    data = this.data_mL_2_2L1B(data)
    return this.data2tab(data, div, modeT)
  }

  /** 去除列表的inline */
  static listXinline(text: string){
    const data = this.list2data(text)
    return this.data2list(data)
  }

  /** 
   * 列表文本转列表数据 
   * @bug 不能跨缩进，后面再对异常缩进进行修复
   * @bug 内换行` | `可能有bug
   * @param modeT: 保留缩进模式
   * @param modeG: 识别符号 ` | `（该选项暂时不可用，0为不识别，1为识别为下一级，2为识别为同一级，转ultable时会用到选项2）
   */
  static list2data(text: string, modeT=false, modeG=true){
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
    let list_itemInfo:List_ListItem = []

    const list_text = text.split("\n")
    for (let line of list_text) {                                             // 每行
      const m_line = line.match(ABReg.reg_list_noprefix)
      if (m_line) {
        let list_inline: string[] = m_line[4].split("| ") // 内联分行
        /** @bug  制表符长度是1而非4 */
        let level_inline: number = m_line[1].length
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

  // 标题大纲转列表数据（@todo 正文的level+10，要减掉）
  private static title2data(text: string){
    let list_itemInfo:List_ListItem = []

    const list_text = text.split("\n")
    let mul_mode:string = ""      // 多行模式，para或list或title或空
    for (let line of list_text) {
      const match_heading = line.match(ABReg.reg_heading_noprefix)
      const match_list = line.match(ABReg.reg_list_noprefix)
      if (match_heading && !match_heading[1]){                // 1. 标题层级（只识别根处）
        removeTailBlank()
        list_itemInfo.push({
          content: match_heading[4],
          level: match_heading[1].length-10
        })
        mul_mode = "title"
      }
      else if (match_list && !match_list[1]){                 // 2. 列表层级（只识别根处）
        removeTailBlank()
        list_itemInfo.push({
          content: match_list[4],
          level: match_list[1].length+1//+10
        })
        mul_mode = "list"
      }
      else if (/^\S/.test(line) && mul_mode=="list"){         // 3. 带缩进且在列表层级中
        list_itemInfo[list_itemInfo.length-1].content = list_itemInfo[list_itemInfo.length-1].content+"\n"+line
      }
      else {                                                  // 4. 正文层级
        if (mul_mode=="para") {
          list_itemInfo[list_itemInfo.length-1].content = list_itemInfo[list_itemInfo.length-1].content+"\n"+line
        }
        else if(/^\s*$/.test(line)){
          continue
        }
        else{
          list_itemInfo.push({
            content: line,
            level: 0//+10
          })
          mul_mode = "para"
        }
      }
    }
    removeTailBlank()
    return list_itemInfo

    function removeTailBlank(){
      if (mul_mode=="para"||mul_mode=="list"){
        list_itemInfo[list_itemInfo.length-1].content = list_itemInfo[list_itemInfo.length-1].content.replace(/\s*$/, "")
      }
    }
  }

  // 这种类型的列表只有两层
  private static old_ulist2data(text: string){
    // 列表文本转列表数据
    let list_itemInfo:List_ListItem = []

    let level1 = -1
    let level2 = -1
    const list_text = text.split("\n")
    for (let line of list_text) {                                             // 每行
      const m_line = line.match(ABReg.reg_list_noprefix)
      if (m_line) {
        let level_inline: number = m_line[1].length
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
          content: m_line[4],
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

  /** 列表文本转列表表格数据
   * 只能通过“|”符号实现跨列
   * 所以这种是没有合并单元格
   * 
   * 第一列的level总为0
   */
  private static ullist2data(text: string){
    let list_itemInfo:List_ListItem = []
    
    const list_text = text.split("\n")
    for (let line of list_text) {                                             // 每行
      const m_line = line.match(ABReg.reg_list_noprefix)
      if (m_line) {
        let list_inline: string[] = m_line[4].split("| ") // 内联分行
        let level_inline: number = m_line[1].length
                                                                              // 保留缩进（列表格）
        for (let inline_i=0; inline_i<list_inline.length; inline_i++){
          if(inline_i==0) {                                                   // level为内联缩进
            for (let i=0; i<level_inline; i++) list_inline[inline_i] = "&nbsp;&nbsp;" + list_inline[inline_i]
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

  /** 列表数据严格化 */
  private static data2strict(
    list_itemInfo: List_ListItem
  ){
    let list_prev_level:number[] = [-999]
    let list_itemInfo2:{content:string, level:number}[] = []
    for (let itemInfo of list_itemInfo){
      // 找到在list_prev_level的位置，用new_level保存
      let new_level = 0
      for (let i=0; i<list_prev_level.length; i++){
        if (list_prev_level[i]<itemInfo.level) continue // 右移
        else if(list_prev_level[i]==itemInfo.level){    // 停止并剔除旧的右侧数据
          list_prev_level=list_prev_level.slice(0,i+1)
          new_level = i
          break
        }
        else {                                          // 在两个之间，则将该等级视为右侧的那个，且剔除旧的右侧数据
          list_prev_level=list_prev_level.slice(0,i)
          list_prev_level.push(itemInfo.level)
          new_level = i
          break
        }
      }
      if (new_level == 0) { // 循环尾调用
        list_prev_level.push(itemInfo.level)
        new_level = list_prev_level.length-1
      }
      // 更新列表数据。这里需要深拷贝而非直接修改原数组，方便调试和避免错误
      list_itemInfo2.push({
        content: itemInfo.content,
        level: (new_level-1)*2 // 记得要算等级要减去序列为0这个占位元素
      })
    }
    return list_itemInfo2
  }

  /** 多层树转二层一叉树
   * example:
   * - 1
   *  - 2
   *   - 3
   *  - 2
   * to:
   * - 1
   *  - 2\n   - 3\n  - 2
   */
  private static data_mL_2_2L1B(
    list_itemInfo: List_ListItem
  ){
    let list_itemInfo2: List_ListItem = []
    let level1 = -1
    let level2 = -1
    let flag_leve2 = false  // 表示触发过level2，当遇到level1会重置
    for (let itemInfo of list_itemInfo) {
      if (level1<0) {                                             // 未配置level1
        level1=0//itemInfo.level;
      }
      if (level1>=itemInfo.level){                                // 是level1
        list_itemInfo2.push({
          content: itemInfo.content.trim(),
          level: level1
        })
        flag_leve2 = false
        continue
      }
      if (level2<0) {                                             // 未配置level2
        level2=1//itemInfo.level;
      }
      if (true){                                                  // 是level2/level2+/level2-
        if (!flag_leve2){                                           // 新建
          list_itemInfo2.push({
            content: itemInfo.content.trim(),
            level: level2
          })
          flag_leve2 = true
          continue
        }
        else {                                                      // 内换行
          let old_itemInfo = list_itemInfo2.pop()
          if(old_itemInfo){
            let new_content = itemInfo.content.trim()
            if (itemInfo.level>level2) new_content = "- "+new_content
            for (let i=0; i<(itemInfo.level-level2); i++) new_content = " "+new_content;
            new_content = old_itemInfo.content+"\n"+new_content
            list_itemInfo2.push({
              content: new_content,
              level: level2
            })
          }
        }
      }
    }
    return list_itemInfo2
  }

  /** 多层树转二层树
   * example:
   * - 1
   *  - 2
   *   - 3
   *  - 2
   * to:
   * - 1
   *  - 2\n   - 3
   *  - 2
   */
  private static data_mL_2_2L(
    list_itemInfo: List_ListItem
  ){
    let list_itemInfo2: List_ListItem = []
    let level1 = -1
    let level2 = -1
    for (let itemInfo of list_itemInfo) {
      if (level1<0) {                                             // 未配置level1
        level1=0//itemInfo.level;
      }
      if (level1>=itemInfo.level){                                // 是level1
        list_itemInfo2.push({
          content: itemInfo.content.trim(),
          level: level1
        })
        continue
      }
      if (level2<0) {                                             // 未配置level2
        level2=1//itemInfo.level;
      }
      if (level2>=itemInfo.level){                                // 是level2/level2-
        list_itemInfo2.push({
          content: itemInfo.content.trim(),
          level: level2
        })
        continue
      }
      else{                                                       // level2+，内换行                                                     // 
        let old_itemInfo = list_itemInfo2.pop()
        if(old_itemInfo){
          let new_content = itemInfo.content.trim()
          if (itemInfo.level>level2) new_content = "- "+new_content
          for (let i=0; i<(itemInfo.level-level2); i++) new_content = " "+new_content;
          new_content = old_itemInfo.content+"\n"+new_content
          list_itemInfo2.push({
            content: new_content,
            level: level2
          })
        }
      }
    }
    return list_itemInfo2

    /*
    let list_itemInfo2: {content: string;level: number;}[] = []
    let level1 = -1
    let level2 = -1
    for (let itemInfo of list_itemInfo) {
      let this_level: number                                      // 一共三种可能：0、1、(1+)表
      if (level1<0) {level1=itemInfo.level; this_level = level1}  // 未配置level1
      else if (level1>=itemInfo.level) this_level = level1        // 是level1
      else if (level2<0) {level2=itemInfo.level; this_level = level2}  // 未配置level2
      else if (level2>=itemInfo.level) this_level = level2             // 是level2
      else { // (level2<itemInfo.level)                           // 依然是level2，但进行内换行，并把列表符和缩进给加回去
        let old_itemInfo = list_itemInfo2.pop()
        if(old_itemInfo){
          let new_content = "- "+itemInfo.content.trim()
          for (let i=0; i<(itemInfo.level-level2); i++) new_content = " "+new_content;
          new_content = old_itemInfo.content+"\n"+new_content
          list_itemInfo2.push({
            content: new_content,
            level: level2
          })
        }
        continue
      }
      list_itemInfo2.push({
        content: itemInfo.content.trim(),
        level: level2
      })
    }
    console.log("前后数据", list_itemInfo, list_itemInfo2)
    return list_itemInfo2*/
  }

  /** 二层树转多层一叉树 
   * example:
   * - 1
   *  - 2
   *  - 3
   * to:
   * - 1
   *  - 2
   *   - 3
   */
  private static data_2L_2_mL1B(
    list_itemInfo: List_ListItem
  ){
    let list_itemInfo2:List_ListItem = []
    let count_level_2 = 0
    for (let item of list_itemInfo){
      if (item.level!=0){                     // 在二层，依次增加层数
        // item.level += count_level_2
        list_itemInfo2.push({
          content: item.content,
          level: item.level+count_level_2
        })
        count_level_2++
      }
      else {                                  // 在一层
        list_itemInfo2.push({
          content: item.content,
          level: item.level
        })
        count_level_2 = 0
      }
    }
    return list_itemInfo2
  }

  /** 列表数据转列表（看起来脱屁股放屁，但有时调试会需要）
   * 另外还有个妙用：list2data + data2list = listXinline
   */
  private static data2list(
    list_itemInfo: List_ListItem
  ){
    let list_newcontent:string[] = []
    // 每一个level里的content处理
    for (let item of list_itemInfo){
      // 等级转缩进，以及"\n" 转化（这里像mindmap语法那样用<br>，要进行换行转缩进）
      let str_indent = ""
      for(let i=0; i<item.level; i++) str_indent+= " "
      let list_content = item.content.split("\n")
      for (let i=0; i<list_content.length; i++) {
        if(i==0) list_newcontent.push(str_indent+"- "+list_content[i])
        else list_newcontent.push(str_indent+"  "+list_content[i])
      }
    }
    const newcontent = list_newcontent.join("\n")
    return newcontent
  }

  /** 列表数据转标签栏 */
  private static data2tab(
    list_itemInfo: List_ListItem, 
    div: HTMLDivElement,
    modeT: boolean
  ){
    // GeneratorTab，原svelte代码
    {
      const tab = document.createElement("div"); div.appendChild(tab); tab.classList.add("ab-tab-root")
      if (modeT) tab.setAttribute("modeT", "true")
      const ul = document.createElement("ul"); tab.appendChild(ul);
      const content = document.createElement("div"); tab.appendChild(content);
      let current_dom:HTMLElement|null = null
      for (let i=0; i<list_itemInfo.length; i++){
        const itemInfo = list_itemInfo[i]
        if (!current_dom){            // 找开始标志
          if (itemInfo.level==0){
            const li = document.createElement("li"); ul.appendChild(li); li.classList.add("ab-tab-tab");
              li.textContent = itemInfo.content.slice(0,20); li.setAttribute("is_activate", i==0?"true":"false");
            current_dom = document.createElement("div"); content.appendChild(current_dom); current_dom.classList.add("ab-tab-content");
              current_dom.setAttribute("style", i==0?"display:block":"display:none"); current_dom.setAttribute("is_activate", i==0?"true":"false");
          }
        }
        else{                         // 找结束，不需要找标志，因为传过来的是二层一叉树
          current_dom.classList.add("markdown-rendered")
          ABConvertManager.getInstance().m_renderMarkdownFn(itemInfo.content, current_dom)
          current_dom = null
        }
      }
      // 元素全部创建完再来绑按钮事件，不然有可能有问题
      const lis:NodeListOf<HTMLLIElement> = tab.querySelectorAll(".ab-tab-tab")
      const contents = tab.querySelectorAll(".ab-tab-content")
      if (lis.length!=contents.length) console.warn("ab-tab-tab和ab-tab-content的数量不一致")
      for (let i=0; i<lis.length; i++){
        lis[i].onclick = ()=>{
          for (let j=0; j<contents.length; j++){
            lis[j].setAttribute("is_activate", "false")
            contents[j].setAttribute("is_activate", "false")
            contents[j].setAttribute("style", "display:none")
          }
          lis[i].setAttribute("is_activate", "true")
          contents[i].setAttribute("is_activate", "true")
          contents[i].setAttribute("style", "display:block")
        }
      }
    }

    return div
  }

  /** 列表数据转时间线 */
  /*private static data2timeline(
    list_itemInfo: List_ListInfo, 
    div: HTMLDivElement
  ){
    
  }*/
}

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
interface TableItem extends ListItem{
  tableRow: number,       // 跨行数
  tableLine: number       // 对应首行序列
}
export type List_TableItem = TableItem[]

export class TableProcess{
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
          else tr_line_level.push(Math.round(matchs[1].length/6))
          item.content = item.content.replace(/^((&nbsp;)*)/, "")
          
          // 由字符串前缀得出文件格式
          if(is_folder){
            const matchs = item.content.match(/^(=|~) /)
            // 无类型/不显示图标的文件类型
            if (!matchs){}
            // 文件夹
            else if (matchs[1]=="= "){
              item_type = "folder"
              item.content = item.content.replace(/^\= /, "")
            }
            // 根据后缀名决定
            else if(matchs[1]="~ "){
              const m_line = item.content.match(/^\~(.*)\.(.*)/)
              if(!m_line) {}
              else {
                item_type = m_line[2]
              }
              item.content = item.content.replace(/^\~ /, "")
            }
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
        tableLine: prev_line
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
      for (let index_line=0; index_line<prev_line+1; index_line++){ // 遍历表格行，创建tr……
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
        // 列 - 遍历表格列，创建td
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
