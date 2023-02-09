import {EditorView, Decoration, DecorationSet} from "@codemirror/view"
import {StateField, StateEffect, EditorState, Transaction} from "@codemirror/state"
import {MarkdownView, View, Editor, EditorPosition} from 'obsidian';

import AnyBlockPlugin from '../main'
import { ConfDecoration } from "src/config/abSettingTab"
import { get_selectors, /*list_ABMdSelector,*/ ABMdSelector, MdSelectorSpec } from "./abMdSelector"
import { ABDecorationManager } from "./abDecorationManager"
import { ABReplaceWidget } from "./replaceWidgetType"

/** 总逻辑梳理
 * mermaid
 * - 状态管理器 : 用来设置状态的
 *   - 范围管理器 (全文文本构造) interface SpecKeyword : 一个文档有多个范围管理器
 *     - 装饰管理器 (传入范围管理器) / 替换管理器 : 一个子范围管理器有多个范围，每个范围可以使用的装饰不同
 * 
 * 流程：
 * - 选择范围
 */

// 获取 - 模式
enum Editor_mode{
  NONE,
  SOURCE,
  SOURCE_LIVE,
  PREVIEW
}

/** 状态管理器
 * 启用状态字段装饰功能
 * 一次性使用
 */
export class ABStateManager{
  plugin_this: AnyBlockPlugin
  replace_this=this
  view: View
  editor: Editor
  editorView: EditorView
  editorState: EditorState
  get cursor(): EditorPosition {return this.editor.getCursor();}
  get state(): any {return this.view.getState()}
  get mdText(): string {return this.editor.getValue()}

  constructor(plugin_this: AnyBlockPlugin){
    this.plugin_this=plugin_this
    // 因为打开文档会触发，所以后台打开的文档会return false
    if (this.init()) this.setStateEffects()
  }

  /** 设置常用变量 */
  private init() {
    const view: View|null = this.plugin_this.app.workspace.getActiveViewOfType(MarkdownView); // 未聚焦(active)会返回null
    if (!view) return false
    this.view = view
    // @ts-ignore 这里会说View没有editor属性
    this.editor = this.view.editor
    // @ts-ignore 这里会说Editor没有cm属性
    this.editorView = this.editor.cm
    this.editorState = this.editorView.state
    return true
  }

  /** 设置初始状态字段并派发 */
  private setStateEffects() {
    let stateEffects: StateEffect<unknown>[] = []
  
    /** 修改StateEffect1 - 加入StateField、css样式
     * 当EditorState没有(下划线)StateField时，则将该(下划线)状态字段 添加进 EditorEffect中
     *    （函数末尾再将EditorEffect派发到EditorView中）。
     * 就是说只会在第一次时执行，才会触发
     */
    if (!this.editorState.field(this.decorationField, false)) {
      stateEffects.push(StateEffect.appendConfig.of(
        [this.decorationField] 
      ))
      stateEffects.push(StateEffect.appendConfig.of(
        [ABDecorationManager.decoration_theme()] 
      ))
    }
  
    /** 派发 */
    this.editorView.dispatch({effects: stateEffects})
    return true
  }

  /** 一个类成员。StateField，该状态管理Decoration */
  private decorationField = StateField.define<DecorationSet>({
    create: (editorState)=>{ return Decoration.none },
    // create好像不用管，update无论如何都能触发的
    // 函数的根本作用，是为了修改decorationSet的范围，间接修改StateField的管理范围
    update: (decorationSet, tr)=>{
      return this.updateStateField(decorationSet, tr)
    },
    provide: f => EditorView.decorations.from(f)
  })

  // private
  private updateStateField (decorationSet:DecorationSet, tr:Transaction){    
    // 如果没有修改就不管了（点击编辑块的按钮除外）
    // if(tr.changes.empty) return decorationSet

    // 获取 - 编辑器模式、装饰选项、选择器选项
    let editor_mode: Editor_mode = this.getEditorMode()
    let decoration_mode:ConfDecoration
    if(editor_mode==Editor_mode.SOURCE) {
      decoration_mode = this.plugin_this.settings.decoration_source
    }
    else if(editor_mode==Editor_mode.SOURCE_LIVE) {
      decoration_mode = this.plugin_this.settings.decoration_live
    }
    else {
      decoration_mode = this.plugin_this.settings.decoration_render
    }

    //let refreshStrong = refreshStrong2.bind(this)
    //function refreshStrong2(){
      // 装饰调整（删增改）
      // 装饰调整 - 删
      /** @bug 这里的mdText是未修改前的mdText，光标的位置也是 会延迟一拍 */
      decorationSet = decorationSet.update({            // 减少，全部删掉
        filter: (from, to, value)=>{return false}
      })

      // 装饰调整 - 增
      if (decoration_mode==ConfDecoration.none) return decorationSet
      const list_abRangeManager:ABMdSelector[] = get_selectors(this.plugin_this.settings).map(c => {
        return new c(this.mdText, this.plugin_this.settings)
      })
      if(decoration_mode==ConfDecoration.inline){
        for (let abManager of list_abRangeManager){     // 遍历多个范围管理器
          let listRangeSpec: MdSelectorSpec[] = abManager.specKeywords
          for(let rangeSpec of listRangeSpec){          // 遍历每个范围管理器里的多个范围集
            const decoration: Decoration = Decoration.mark({class: "ab-line-brace"})
            decorationSet = decorationSet.update({
              add: [decoration.range(rangeSpec.from, rangeSpec.to)]
            })
          }
        }
      }
      else{
        const cursorSpec = this.getCursorCh()
        for (let abManager of list_abRangeManager){     // 遍历多个范围管理器
          let listRangeSpec: MdSelectorSpec[] = abManager.specKeywords
          for(let rangeSpec of listRangeSpec){          // 遍历每个范围管理器里的多个范围集
            let decoration: Decoration
            if (cursorSpec.from>=rangeSpec.from && cursorSpec.from<=rangeSpec.to 
                || cursorSpec.to>=rangeSpec.from && cursorSpec.to<=rangeSpec.to) {
              decoration = Decoration.mark({class: "ab-line-yellow"})
            }
            else{
              decoration = Decoration.replace({widget: new ABReplaceWidget(
                rangeSpec, this.editor
              )})
            }
            decorationSet = decorationSet.update({
              add: [decoration.range(rangeSpec.from, rangeSpec.to)]
            })
          }
        }
      }

      // 装饰调整 - 改 (映射)
      decorationSet = decorationSet.map(tr.changes)
      return decorationSet
    //}

    // 装饰调整 - 改 (映射)
    /*decorationSet = decorationSet.map(tr.changes)
    return decorationSet*/

    // 防抖，设置定时器
    /*return (()=>{
      console.log("准备做")
      let timer;
      clearTimeout(timer);
      timer = setTimeout(()=>{
        console.log("做了做了")
        refreshStrong();
      },200);
    })()*/


    






















  }

  /** 获取编辑器模式 */
  private getEditorMode(): Editor_mode {
    let editor_dom: Element | null
    /** @warning 不能用 editor_dom = document
     * 再editor_dom = editor_dom?.getElementsByClassName("workspace-tabs mod-top mod-active")[0];
     * 用document的话不知道为什么总是有属性is-live-preview的，总是认为是实时模式 
     */
    // 类型“WorkspaceLeaf”上不存在属性“containerEl”
    // @ts-ignore
    editor_dom = this.plugin_this.app.workspace.activeLeaf.containerEl
    if (!editor_dom) {
      console.warn("无法获取dom来得知编辑器模式"); 
      return Editor_mode.NONE; 
    }
    editor_dom = editor_dom?.getElementsByClassName("workspace-leaf-content")[0]
    let str = editor_dom?.getAttribute("data-mode")
    if (str=="source") {
      editor_dom = editor_dom?.getElementsByClassName("markdown-source-view")[0]
      if(editor_dom?.classList.contains('is-live-preview')) return Editor_mode.SOURCE_LIVE
      else return Editor_mode.SOURCE
    }
    else if (str=="preview"){
      return Editor_mode.PREVIEW  // 但其实不会判定，因为实时是不触发update方法的
    }
    else {
      /*console.warn("无法获取编辑器模式，可能会产生BUG");*/ 
      return Editor_mode.NONE;
    } // 点一下编辑器再点其他布局位置，就会发生
  }

  /** 获取光标位于全文第几个字符 */
  private getCursorCh() {
    let cursor_from_ch = 0
    let cursor_to_ch = 0
    let list_text: string[] = this.editor.getValue().split("\n")
    for (let i=0; i<=this.editor.getCursor("to").line; i++){
      if (this.editor.getCursor("from").line == i) {cursor_from_ch = cursor_to_ch+this.editor.getCursor("from").ch}
      if (this.editor.getCursor("to").line == i) {cursor_to_ch = cursor_to_ch+this.editor.getCursor("to").ch; break;}
      cursor_to_ch += list_text[i].length+1
    }
    return {
      from: cursor_from_ch, 
      to: cursor_to_ch
    }
  }
}
