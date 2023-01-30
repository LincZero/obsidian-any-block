import {EditorView, Decoration, DecorationSet} from "@codemirror/view"
import {StateField, StateEffect, EditorState, Transaction} from "@codemirror/state"
import {MarkdownView, View, Editor, EditorPosition} from 'obsidian';

import AnyBlockPlugin from '../main'
import { list_ABManager, ABRangeManager, SpecKeyword } from "../utils/rangeManager"

// 获取 - 模式
enum Editor_mode{
  NONE,
  SOURCE,
  SOURCE_LIVE,
  PREVIEW
}

/** 启用状态字段装饰功能
 * 一次性使用
 */
export class Replace2AnyBlock{
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
        [list_ABManager.map(c=>{return c.decoration_theme()})] 
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
    // 获取 - 编辑器模式
    let editor_mode: Editor_mode = this.getEditorMode()

    // 获取 - 光标from-to
    const cursor_ch = this.getCursorCh()
    let cursor_from_ch = cursor_ch.from
    let cursor_to_ch = cursor_ch.to

    // 装饰调整（删增改）
    // 装饰调整 - 删
    /** @bug 这里的mdText是未修改前的mdText，光标的位置也是 会延迟一拍 */
    decorationSet = decorationSet.update({            // 减少，全部删掉
      filter: (from, to, value)=>{return false}
    })

    // 装饰调整 - 增
    // 如果不在实时模式，则不启用
    if(editor_mode!=Editor_mode.SOURCE_LIVE) {
      return decorationSet
    }
    const list_abManager:ABRangeManager[] = list_ABManager.map(c => {
      return new c(this.mdText)
    })
    for (let abManager of list_abManager){
      let listSpecKeyword: SpecKeyword[] = abManager.specKeywords
      for(let item of listSpecKeyword){
        let from = item.from
        let to = item.to
        // 如果光标位置在块内，则不启用块，仅使用高亮
        let underlineMark: Decoration
        if (cursor_from_ch>=from && cursor_from_ch<=to || cursor_to_ch>=from && cursor_to_ch<=to) {
          underlineMark = abManager.decoration_line()
        }
        else {
          underlineMark = abManager.decoration_block(this.mdText.slice(from, to), from, to, this.editor)
        }
        decorationSet = decorationSet.update({
          add: [underlineMark.range(from, to)]
        })
      }
    }

    // 装饰调整 - 改 (映射)
    decorationSet = decorationSet.map(tr.changes)
    return decorationSet
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
      console.log("无法获取dom来得知编辑器模式"); 
      return Editor_mode.NONE; 
    }
    editor_dom = editor_dom?.getElementsByClassName("workspace-leaf-content")[0]
    let str = editor_dom?.getAttribute("data-mode")
    if (str=="source") {
      editor_dom = editor_dom?.getElementsByClassName("markdown-source-view")[0]
      if(editor_dom?.classList.contains('is-live-preview')) return Editor_mode.SOURCE_LIVE
      else return Editor_mode.SOURCE
    }
    else if (str=="preview") return Editor_mode.PREVIEW  // 但其实不会判定，因为实时是不触发update方法的
    else {console.log("无法获取编辑器模式，可能会产生BUG"); return Editor_mode.NONE;}
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
