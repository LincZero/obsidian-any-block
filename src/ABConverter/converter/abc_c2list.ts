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
import type {ListItem, List_ListItem} from "./abc_list"


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
  static data_mL_2_2L1B(
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
   * 列表转二列列表数据
   * 
   * @detail
   * 为什么要直接转，而不能list2data|data2c2data来复用
   * 因为会损失信息
   */
  static list2c2data(text: string){
    let list_itemInfo:List_C2ListItem = []
    const list_text = text.trimStart().split("\n")

    // 获取最大的标题级别
    const first_match = list_text[0].match(ABReg.reg_list_noprefix)
    if (!first_match || first_match[1]) {
      console.error("不是列表内容:", list_text[0])
      return list_itemInfo
    }
    const root_list_level:number = first_match[1].length // 第一个列表(也是缩进最小)的 `- ` 前空格数
    
    // 循环填充
    let current_content:string = ""
    for (let line of list_text) {
      const match_list = line.match(ABReg.reg_list_noprefix)
      if (match_list && !match_list[1] && match_list[1].length<=root_list_level){ // 遇到同等标题
        add_current_content()
        list_itemInfo.push({
          content: match_list[4],
          level: 0
        })
      } else {
        current_content += line+"\n"
      }
    }
    add_current_content()
    return list_itemInfo

    function add_current_content(){ // 刷新写入缓存的尾调用
      if (current_content.trim()=="") return
      list_itemInfo.push({
        content: current_content,
        level: 1
      })
      current_content = ""
    }
  }

  /**
   * 标题大纲转列表数据
   * 
   * @detail
   * 为什么要直接转，而不能title2list来复用
   * 因为title2list会损失标题信息
   */
  static title2c2data(text: string){
    let list_itemInfo:List_C2ListItem = []
    const list_text = text.trimStart().split("\n")

    // 获取最大的标题级别
    const first_match = list_text[0].match(ABReg.reg_heading_noprefix)
    if (!first_match || first_match[1]) {
      console.error("不是标题内容:", list_text[0])
      return list_itemInfo
    }
    const root_title_level:number = first_match[3].length-1 // 第一个标题(也是最大级别的标题的)的`#`的个数
    
    // 循环填充
    let current_content:string = ""
    for (let line of list_text) {
      const match_heading = line.match(ABReg.reg_heading_noprefix)
      if (match_heading && !match_heading[1] && (match_heading[3].length-1)<=root_title_level){ // 遇到同等标题
        add_current_content()
        list_itemInfo.push({
          content: match_heading[4],
          level: 0
        })
      } else {
        current_content += line+"\n"
      }
    }
    add_current_content()
    return list_itemInfo

    function add_current_content(){ // 刷新写入缓存的尾调用
      if (current_content.trim()=="") return
      list_itemInfo.push({
        content: current_content,
        level: 1
      })
      current_content = ""
    }
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

  /// 将二列列表转 `容器-元素` 结构
  static c2data2items(c2listdata:List_C2ListItem, el:HTMLElement): HTMLElement {
    const el_items = document.createElement("div"); el.appendChild(el_items); el_items.classList.add("ab-items")
    let el_item:HTMLElement|null = null;
    for (let item of c2listdata) {
      if (item.level == 0) {
        el_item = document.createElement("div"); el_items.appendChild(el_item); el_item.classList.add("ab-items-item")
        const el_title = document.createElement("div"); el_item.appendChild(el_title); el_title.classList.add("ab-items-title")
        ABConvertManager.getInstance().m_renderMarkdownFn(item.content, el_title)
      } else {
        if (!el_item) continue;
        const el_content = document.createElement("div"); el_item.appendChild(el_content); el_content.classList.add("ab-items-content")
        ABConvertManager.getInstance().m_renderMarkdownFn(item.content, el_content)
      }
    }
    return el
  }
}

const abc_list2tab = ABConvert.factory({
  id: "list2tab",
  name: "列表转标签栏",
  match: /list2(md)?tab(T)?$/,
  default: "list2mdtab",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    const matchs = header.match(/list2(md)?tab(T)?$/)
    if (!matchs) return el
    const c2listData = C2ListProcess.list2c2data(content)
    C2ListProcess.c2data2tab(c2listData, el, matchs[2]=="T")
    return el
  }
})

const abc_title2tab = ABConvert.factory({
  id: "title2tab",
  name: "标题转标签栏",
  match: "title2tab",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    let data = C2ListProcess.title2c2data(content)
    C2ListProcess.c2data2tab(data, el, false)
    return el
  }
})

const abc_list2col = ABConvert.factory({
  id: "list2col",
  name: "一级列表转分栏",
  match: "list2col",
  default: "list2mdtab",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    const c2listData = C2ListProcess.list2c2data(content)
    C2ListProcess.c2data2items(c2listData, el)
    el.querySelector("div")?.classList.add("ab-col")
    return el
  }
})

const abc_title2col = ABConvert.factory({
  id: "title2col",
  name: "标题转分栏",
  match: "title2col",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    let data = C2ListProcess.title2c2data(content)
    C2ListProcess.c2data2items(data, el)
    el.querySelector("div")?.classList.add("ab-col")
    return el
  }
})

const abc_list2card = ABConvert.factory({
  id: "list2card",
  name: "列表转卡片",
  match: "list2card",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    const c2listData = C2ListProcess.list2c2data(content)
    C2ListProcess.c2data2items(c2listData, el)
    el.querySelector("div")?.classList.add("ab-card")
    return el
  }
})

const abc_title2card = ABConvert.factory({
  id: "title2card",
  name: "标题转卡片",
  match: "title2card",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    console.log("title2card", content)
    let data = C2ListProcess.title2c2data(content)
    C2ListProcess.c2data2items(data, el)
    console.log(data, "pp", content)
    el.querySelector("div")?.classList.add("ab-card")
    return el
  }
})
