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

// 列表节点结构
export type listNodes = {
  content: string;
  children: listNodes[];
}

/// 一些列表相关的工具集
export class ListProcess{

  // ----------------------- str -> listData ------------------------

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
   * listStream结构 转 树型结构
   * 
   * @detail
   * 与list2data不同，这里仅识别 `: ` 作为分割符
   * 
   * @param text
   * @return
   * {
   *   content: string;        // 内容
   *   level: number;          // 级别 (缩进空格数)
   * }
   * to
   * {
   *   content: string
   *   children: []
   * }
   */
  static list2listnode(text: string): listNodes[]{
    let data: List_ListItem = ListProcess.list2data(text, false)
    data = ListProcess.data2strict(data)
    let nodes: listNodes[] = []
    let prev_nodes: listNodes[] = [] // 缓存每个level的最新节点

    let current_data: listNodes
    for (let index = 0; index<data.length; index++) {
      // 当前节点
      const item = data[index]
      current_data = {
        content: item.content,
        children: []
      }
      prev_nodes[item.level] = current_data

      // 放入节点树的对应位置中
      if (item.level>=1 && prev_nodes.hasOwnProperty(item.level-1)) {
        prev_nodes[item.level-1].children.push(current_data)
      } else if (item.level==0) {
        nodes.push(current_data)
      } else {
        console.error(`list数据不合规，没有正规化. level:${item.level}, prev_nodes:${prev_nodes}`)
        return nodes
      }
    }
    return nodes
  }

  static list2json(text: string): object{
    interface NestedObject {              // 可递归的节点类型
      [key: string]: NestedObject | string | number | any[];
    }
    let data: List_ListItem = ListProcess.list2data(text, false)
    data = ListProcess.data2strict(data)
    let nodes: NestedObject = {}         // 节点树
    let prev_nodes: NestedObject[] = []  // 缓存每个level的最新节点

    // 第一次变换，所有节点为 "key": {...} 形式
    for (let index = 0; index<data.length; index++) {
      // 当前节点
      const item = data[index]
      const current_key: string = item.content
      const current_value: NestedObject = {}
      prev_nodes[item.level] = current_value

      // 放入节点树的对应位置中
      if (item.level>=1 && prev_nodes.hasOwnProperty(item.level-1)) {
        let lastItem = prev_nodes[item.level-1]
        if (typeof lastItem != "object" || Array.isArray(lastItem)) {
          console.error(`list数据不合规，父节点的value值不是{}类型`)
          return nodes
        }
        lastItem[current_key] = current_value
      } else if (item.level==0) {
        nodes[current_key] = current_value
      } else {
        console.error(`list数据不合规，没有正规化. level:${item.level}, prev_nodes:${prev_nodes}`)
        return nodes
      }
    }

    // 第二、三次变换
    let nodes2: NestedObject = nodes
    traverse(nodes2)

    return nodes2

    /**
     * 递归遍历json，对obj进行两次变换
     * 
     * @detail
     * - 节点 "k:v": {空} 展开为 "k": "v"
     * - 部分转列表
     * 
     * @param
     * 后两个参数是为了方便将整个obj替换掉，不然在地址不变的前提下array替换obj会很麻烦
     */
    function traverse(obj: NestedObject|any[], objSource?:any, objSource2?:string) {
      if (Array.isArray(obj)) return
      
      // 变换：节点 "k:v": {空} 展开为 "k": "v"
      const keys = Object.keys(obj)
      let count_null = 0
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]; if (!obj.hasOwnProperty(key)) continue;
        const value = obj[key]
        if (typeof value === 'object' && !Array.isArray(value)) {  // (b1) 对象
          if (Object.keys(value).length === 0) {  // (b11) k-v展开
            let index = key.indexOf(": ");
            if (index > 0) {
              delete obj[key]; i--; // @warn 希望新插入的k-v在后面，否则顺序问题很严重
              obj[key.slice(0, index)] = key.slice(index+1)
            } else {
              obj[key] = ""
              count_null++
            }
          } else {                                // (b12) 递归调用
            traverse(value, obj, key);
          }
        } else {                                  // (b2) 非对象/数组对象
        }
      }

      // 变换：尾判断，满足需求的json转成列表
      if (objSource && objSource2) {
        let newObj: (string|number|{})[] = []
        if (count_null == keys.length) {
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i]; if (!obj.hasOwnProperty(key)) continue;
            newObj.push(key)
          }
          objSource[objSource2] = newObj
        }
      }
    }
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
  static title2data(text: string){
    let list_itemInfo:List_ListItem = []

    const list_text = text.split("\n")
    let mul_mode:"heading"|"para"|"list"|"" = ""                // 多行模式，标题/正文/列表/空
    for (let line of list_text) {
      const match_heading = line.match(ABReg.reg_heading_noprefix)
      const match_list = line.match(ABReg.reg_list_noprefix)
      if (match_heading && !match_heading[1]){                // 1. 标题层级（只识别根处）
        removeTailBlank()
        list_itemInfo.push({
          content: match_heading[4],
          level: (match_heading[3].length-1)-10
        })
        mul_mode = "heading"
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
  static data2list(
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

  /** 
   * 将多列列表转 `节点` 结构
   * 
   * .ab-nodes
   *   .ab-nodes-node
   *     .ab-nodes-content
   *     .ab-nodes-children
   *       (递归包含)
   *       .ab-nodes-node
   *       .ab-nodes-node
   */
  static data2nodes(listdata:List_ListItem, el:HTMLElement): HTMLElement {
    const el_root = document.createElement("div"); el.appendChild(el_root); el_root.classList.add("ab-nodes")
    const el_root2 = document.createElement("div"); el_root.appendChild(el_root2); el_root2.classList.add("ab-nodes-children") // 特点是无对应的content和bracket
    let cache_els:{node: HTMLElement, content: HTMLElement, children: HTMLElement}[] = []  // 缓存各个level的最新节点 (level为0的节点在序列0处)，根节点另外处理
    
    for (let item of listdata) {
      // 节点准备
      const el_node = document.createElement("div"); el_node.classList.add("ab-nodes-node"); el_node.setAttribute("has_children", "false"); // 为false则: chileren不应该显示、content线短一些
      const el_node_content = document.createElement("div"); el_node.appendChild(el_node_content); el_node_content.classList.add("ab-nodes-content");
      ABConvertManager.getInstance().m_renderMarkdownFn(item.content, el_node_content)
      const el_node_children = document.createElement("div"); el_node.appendChild(el_node_children); el_node_children.classList.add("ab-nodes-children");
      const el_node_barcket = document.createElement("div"); el_node_children.appendChild(el_node_barcket); el_node_barcket.classList.add("ab-nodes-bracket");
      const el_node_barcket2 = document.createElement("div"); el_node_children.appendChild(el_node_barcket2); el_node_barcket2.classList.add("ab-nodes-bracket2");
      cache_els[item.level] = {node: el_node, content: el_node_content, children: el_node_children}
      
      // 将节点放入合适的位置
      if (item.level == 0) { // 父节点是树的根节点
        el_root2.appendChild(el_node)
      } else if (item.level >= 1 && cache_els.hasOwnProperty(item.level-1)) {
        cache_els[item.level-1].children.appendChild(el_node)
        cache_els[item.level-1].node.setAttribute("has_children", "true") // 要隐藏最后面括弧
      }
      else {
        console.error("节点错误")
        return el
      }
    }
    return el
  }
}

export const abc_list2listdata = ABConvert.factory({
  id: "list2listdata",
  name: "列表到listdata",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.list_strem,
  detail: "列表到listdata",
  process: (el, header, content: string): List_ListItem=>{
    return ListProcess.list2data(content) as List_ListItem
  }
})

export const abc_title2listdata = ABConvert.factory({
  id: "title2listdata",
  name: "标题到listdata",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.list_strem,
  detail: "标题到listdata",
  process: (el, header, content: string): List_ListItem=>{
    return ListProcess.title2data(content) as List_ListItem
  }
})

const abc_listdata2list = ABConvert.factory({
  id: "listdata2list",
  name: "listdata到列表",
  process_param: ABConvert_IOEnum.list_strem,
  process_return: ABConvert_IOEnum.text,
  detail: "listdata到列表",
  process: (el, header, content: List_ListItem): string=>{
    return ListProcess.data2list(content) as string
  }
})

const abc_listdata2nodes = ABConvert.factory({
  id: "listdata2nodes",
  name: "listdata到节点",
  process_param: ABConvert_IOEnum.list_strem,
  process_return: ABConvert_IOEnum.el,
  detail: "listdata到节点",
  process: (el, header, content: List_ListItem): HTMLElement=>{
    return ListProcess.data2nodes(content, el) as HTMLElement
  }
})

const abc_listdata2strict = ABConvert.factory({
  id: "listdata2strict",
  name: "listdata严格化",
  process_param: ABConvert_IOEnum.list_strem,
  process_return: ABConvert_IOEnum.list_strem,
  process: (el, header, content: List_ListItem): List_ListItem=>{
    return ListProcess.data2strict(content)
  }
})

export const abc_list2listnode = ABConvert.factory({
  id: "list2listnode",
  name: "列表到listnode (beta)",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.json,
  detail: "列表到listnode",
  process: (el, header, content: string): string=>{
    const data: listNodes[] = ListProcess.list2listnode(content)
    return JSON.stringify(data, null, 2) // TMP
  }
})

export const abc_list2json = ABConvert.factory({
  id: "list2json",
  name: "列表到json (beta)",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.json,
  detail: "列表到json",
  process: (el, header, content: string): string=>{
    const data: object = ListProcess.list2json(content)
    return JSON.stringify(data, null, 2) // TMP
  }
})
