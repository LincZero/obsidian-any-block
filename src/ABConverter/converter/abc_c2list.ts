/**
 * 处理器_两列列表版
 * 
 * - md_str <-> 列表数据
 * - 列表数据 <-> html
 * - 表格数据 -> 列表数据
 */

import { ABReg } from '../ABReg'
import {ABConvert_IOEnum, ABConvert, type ABConvert_SpecSimp} from "./ABConvert"
import {ABConvertManager} from "../ABConvertManager"
import {ListProcess, type ListItem, type List_ListItem} from "./abc_list"


/**
 * 二列列表，特征是level只有0和1
 * 
 * @detail
 * 通常用于：
 * - 二层一叉树
 *     - dirTree的初处理
 *     - Tabs
 *     - TimeLine
 *     - 仿列表
 *     - ...
 * - 二层多叉树
 *     - fc-table (首列重要树)
 *     - ...
 * 
 * 特别是对于mdit-container的 `:::+@` 来说，这种方式是更为方便的
 */
export interface C2ListItem extends ListItem {
  level: 0|1;
}[]
export type List_C2ListItem = C2ListItem[]

/// 一些列表相关的工具集
export class C2ListProcess{

  // ----------------------- str -> listData ------------------------

  /** 一级列表转标签栏 */
  static list2tab(text: string, div: HTMLDivElement, modeT=false) {
    let data = ListProcess.list2data(text)
    let c2list: List_C2ListItem = this.data_mL_2_2L1B(data)
    return this.c2data2tab(c2list, div, modeT)
  }

  /**
   * 多层树转二层一叉树
   * 
   * @detail
   * 特点是level只有0和1两种
   * 
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
  ): List_C2ListItem{
    let list_itemInfo2: List_C2ListItem = []
    const level1:0 = 0
    const level2:1 = 1
    let flag_leve2 = false  // 表示触发过level2，当遇到level1会重置
    for (let itemInfo of list_itemInfo) {
      if (level1>=itemInfo.level){                                // 是level1
        list_itemInfo2.push({
          content: itemInfo.content.trim(),
          level: level1
        })
        flag_leve2 = false
        continue
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

  /**
   * 多层树转二层树
   * 
   * @detail
   * 特点是level只有0和1两种
   * 
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
  static data_mL_2_2L(
    list_itemInfo: List_ListItem
  ): List_C2ListItem{
    let list_itemInfo2: List_C2ListItem = []
    const level1:0 = 0
    const level2:1 = 1
    for (let itemInfo of list_itemInfo) {
      if (level1>=itemInfo.level){                                // 是level1
        list_itemInfo2.push({
          content: itemInfo.content.trim(),
          level: level1
        })
        continue
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

  /**
   * 两列列表数据转标签栏
   */
  static c2data2tab(
    list_itemInfo: List_C2ListItem, 
    div: HTMLDivElement,
    modeT: boolean
  ){
    // GeneratorTab，原svelte代码
    {
      const tab = document.createElement("div"); div.appendChild(tab); tab.classList.add("ab-tab-root");
      if (modeT) tab.setAttribute("modeT", "true")
      const nav = document.createElement("div"); tab.appendChild(nav); nav.classList.add("ab-tab-nav");
      const content = document.createElement("div"); tab.appendChild(content); content.classList.add("ab-tab-content")
      let current_dom:HTMLElement|null = null
      for (let i=0; i<list_itemInfo.length; i++){
        const itemInfo = list_itemInfo[i]
        if (!current_dom){            // 找开始标志
          if (itemInfo.level==0){
            const nav_item = document.createElement("button"); nav.appendChild(nav_item); nav_item.classList.add("ab-tab-nav-item");
              nav_item.textContent = itemInfo.content.slice(0,20); nav_item.setAttribute("is_activate", i==0?"true":"false");
            current_dom = document.createElement("div"); content.appendChild(current_dom); current_dom.classList.add("ab-tab-content-item");
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
      const lis:NodeListOf<HTMLButtonElement> = tab.querySelectorAll(".ab-tab-nav-item")
      const contents = tab.querySelectorAll(".ab-tab-content-item")
      if (lis.length!=contents.length) console.warn("ab-tab-nav-item和ab-tab-content-item的数量不一致")
      for (let i=0; i<lis.length; i++){
        // 1. 二选一，常规绑定
        // ob选用
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
        // 2. 二选一，
        // mdit选用
        // lis[i].setAttribute("onclick",`
        //   const i = ${i}
        //   const tab_current = this
        //   const tab_nav = this.parentNode
        //   const tab_root = tab_nav.parentNode
        //   const tab_content = tab_root.querySelector(".ab-tab-content")
        //   const tab_nav_items = tab_nav.querySelectorAll(".ab-tab-nav-item")
        //   const tab_content_items = tab_content.querySelectorAll(".ab-tab-content-item")
        //   for (let j=0; j<tab_content_items.length; j++){
        //     tab_nav_items[j].setAttribute("is_activate", "false")
        //     tab_content_items[j].setAttribute("is_activate", "false")
        //     tab_content_items[j].setAttribute("style", "display:none")
        //   }
        //   tab_current.setAttribute("is_activate", "true")
        //   tab_content_items[i].setAttribute("is_activate", "true")
        //   tab_content_items[i].setAttribute("style", "display:block")
        // `)
      }
    }

    return div
  }

  /**
   * 两列列表数据转分栏
   */
  static c2data2co(
    list_itemInfo: List_C2ListItem, 
    div: HTMLDivElement,
    modeT: boolean
  ){
    return div
  }
}

const abc_list2tab = ABConvert.factory({
  id: "list2tab",
  name: "一级列表转标签栏",
  match: /list2(md)?tab(T)?$/,
  default: "list2mdtab",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    const matchs = header.match(/list2(md)?tab(T)?$/)
    if (!matchs) return el
    C2ListProcess.list2tab(content, el, matchs[2]=="T")
    return el
  }
})
