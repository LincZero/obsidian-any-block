/**
 * 处理器_列表版
 * 
 * - md_str <-> 列表数据
 * - 列表数据 <-> html
 * - 表格数据 -> 列表数据
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
export interface ListItem {
  content: string;        // 内容
  level: number;          // 级别 (缩进空格数/normalization后的递增等级数)
}[]
export type List_ListItem = ListItem[]

/// 一些列表相关的工具集
export class ListProcess{

  // ----------------------- str -> listData ------------------------
  
  /** title转列表 */
  static title2list(text: string, div: HTMLDivElement): string {
    if (!text.trimStart().startsWith("#")) return text // 不让重复调用
    let list_itemInfo = this.title2data(text)
    list_itemInfo = this.data2strict(list_itemInfo).map((item: ListItem, index)=>{ return {content: item.content, level: item.level*2}})
    return this.data2list(list_itemInfo)
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
   * @param modeG: 识别符号 ` | `（该选项暂时不可用，0为不识别，1为识别为下一级，2为识别为同一级，转ultable时会用到选项2）
   */
  static list2data(text: string, modeG=true){
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
        let list_inline: string[] = m_line[4].split(ABReg.inline_split) // 内联分行
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

  /**
   * 标题大纲转列表数据（@todo 正文的level+10，要减掉）
   * 
   * @detail
   * 这里要将标题、正文、列表 的等级合为一块，所以存在偏移值：
   * 
   * 1. 标题等级,  = `#`个数-10,    取值[-9,-4]
   * 2. 正文等级,  = 0,              取值[+1,+Infi]
   * 3. 列表等级,  = `(.*)-`个数+1,  取值[0]
   * 
   */
  private static title2data(text: string){
    let list_itemInfo:List_ListItem = []

    const list_text = text.split("\n")
    let mul_mode:"title"|"para"|"list"|"" = ""                // 多行模式，标题/正文/列表/空
    for (let line of list_text) {
      const match_heading = line.match(ABReg.reg_heading_noprefix)
      const match_list = line.match(ABReg.reg_list_noprefix)
      if (match_heading && !match_heading[1]){                // 1. 标题层级（只识别根处）
        removeTailBlank()
        list_itemInfo.push({
          content: match_heading[4],
          level: (match_heading[3].length-1)-10
        })
        mul_mode = "title"
      }
      else if (match_list){                                   // 2. 列表层级 ~~（只识别根处）~~
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

  /**
   * 列表数据严格化/normalized
   * 
   * 主要是调整level：由空格数调整为递增等级，并乘以2
   */
  static data2strict(
    list_itemInfo: List_ListItem
  ): List_ListItem {
    let list_prev_level:number[] = [-999]
    let list_itemInfo2:List_ListItem = []
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
        level: (new_level-1) // 记得要算等级要减去序列为0这个占位元素
      })
    }
    return list_itemInfo2
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
  static data_2L_2_mL1B(
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

  /**
   * 列表数据转列表（看起来脱屁股放屁，但有时调试会需要）
   * 
   * - title2list会用到
   * - 妙用：list2data + data2list = listXinline
   */
  private static data2list(
    list_itemInfo: List_ListItem
  ){
    let list_newcontent:string[] = [] // 传入参数以列表项为单位，这个以行为单位
    // 每一个level里的content处理
    for (let item of list_itemInfo){
      const str_indent = " ".repeat(item.level) // 缩进数
      let list_content = item.content.split("\n") // 一个列表项可能有多个行
      for (let i=0; i<list_content.length; i++) {
        if(i==0) list_newcontent.push(str_indent+"- "+list_content[i])
        else list_newcontent.push(str_indent+"  "+list_content[i])
      }
    }
    const newcontent = list_newcontent.join("\n")
    return newcontent
  }
}

const abc_title2list = ABConvert.factory({
  id: "title2list",
  name: "标题到列表",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  detail: "也可以当作是更强大的列表解析器",
  process: (el, header, content: string): string=>{
    content = ListProcess.title2list(content, el)
    return content
  }
})

const abc_listXinline = ABConvert.factory({
  id: "listXinline",
  name: "列表消除内联换行",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    return ListProcess.listXinline(content)
  }
})
