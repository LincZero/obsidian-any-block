import {EditorView, Decoration, DecorationSet} from "@codemirror/view"
import {StateField, StateEffect, EditorState} from "@codemirror/state"
import {MarkdownView, View, Editor, EditorPosition} from 'obsidian';

import AnyBlockPlugin from './main'
import { ABRangeManager, SpecKeyword } from "./utils/rangeManager"
import { ABReplaceWidget } from "./replace/replaceWidget"

let global_plugin_this: any;


/** 启用状态字段装饰功能 */
export function replace2AnyBlock(plugin_this: AnyBlockPlugin/*view: EditorView*/) {
  global_plugin_this = plugin_this
  // 常用变量
  const view: View|null = this.app.workspace.getActiveViewOfType(MarkdownView); // 不在编辑模式会返回null
  if (!view) return false
    // @ts-ignore 这里会说View没有editor属性
  const editor: Editor = view.editor
    // @ts-ignore 这里会说Editor没有cm属性
  const editorView: EditorView = editor.cm
  const editorState: EditorState = editorView.state
    // const state: any = view.getState() // 这个不是
  const cursor: EditorPosition = editor.getCursor();

  const mdText = editor.getValue()
  let stateEffects: StateEffect<unknown>[] = []

  /** 修改StateEffect1 - 加入StateField、css样式
   * 当EditorState没有(下划线)StateField时，则将该(下划线)状态字段 添加进 EditorEffect中（函数末尾再将EditorEffect派发到EditorView中）。
   * 就是说只会在第一次时执行，才会触发
   */
  if (!editorState.field(underlineField, false)) {
    stateEffects.push(StateEffect.appendConfig.of(
      [underlineField, underlineTheme] 
    ))
  }

  /** 派发 */
  editorView.dispatch({effects: stateEffects})
  return true
}

// StateField，该状态管理Decoration
const underlineField = StateField.define<DecorationSet>({
  create(editorState) {
    return Decoration.none
  },
  // create好像不用管，update无论如何都能触发的
  // 函数的根本作用，是为了修改decorationSet的范围，间接修改StateField的管理范围
  update(decorationSet, tr) {

    // 获取 - 基本变量
    const view: View|null = global_plugin_this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return decorationSet
      // @ts-ignore 这里会说View没有editor属性
    const editor: Editor = view.editor
      // @ts-ignore 这里会说Editor没有cm属性
    const editorView: EditorView = editor.cm
    const editorState: EditorState = editorView.state
    const mdText = editor.getValue()

    // 获取 - 模式
    enum Editor_mode{
      NONE,
      SOURCE,
      SOURCE_LIVE,
      PREVIEW
    }
    let editor_dom: Element
    let editor_mode: Editor_mode
    editor_dom = document?.getElementsByClassName("workspace-tabs mod-top mod-active")[0];
    editor_dom = editor_dom?.getElementsByClassName("workspace-leaf-content")[0]
    let str = editor_dom?.getAttribute("data-mode")
    if (str=="source") {
      editor_dom = editor_dom?.getElementsByClassName("markdown-source-view")[0]
      // console.log("dommm", editor_dom) // @bug 有bug，这里总是有属性is-live-preview的，总是认为是实时模式
      if(editor_dom?.classList.contains('is-live-preview')) editor_mode=Editor_mode.SOURCE_LIVE
      else editor_mode=Editor_mode.SOURCE
    }
    else if (str=="preview") editor_mode=Editor_mode.PREVIEW
    else editor_mode=Editor_mode.NONE

    // 获取 - 光标from-to
    let cursor_from_ch = 0
    let cursor_to_ch = 0
    let list_text: string[] = editor.getValue().split("\n")
    for (let i=0; i<=editor.getCursor("to").line; i++){
      if (editor.getCursor("from").line == i) {cursor_from_ch = cursor_to_ch+editor.getCursor("from").ch}
      if (editor.getCursor("to").line == i) {cursor_to_ch = cursor_to_ch+editor.getCursor("to").ch; break;}
      cursor_to_ch += list_text[i].length+1
    }

    // 修改范围
    /** @bug 这里的mdText是未修改前的mdText，光标的位置也是 会延迟一拍 */ 
    decorationSet = decorationSet.update({            // 减少，全部删掉
      filter: (from, to, value)=>{return false}
    })
    // 如果在纯编辑模式，则不启用
    if(editor_mode==Editor_mode.SOURCE_LIVE){
      let listSpecKeyword: SpecKeyword[] = ABRangeManager.blockMatch_keyword(mdText)
      if (!listSpecKeyword.length) return decorationSet // 增加
      for(let item of listSpecKeyword){
        let from = item.from
        let to = item.to
        // 如果光标位置在块内，则不启用
        // console.log("cursor", cursor_from_ch, cursor_to_ch, from, to, cursor_from_ch>=from && cursor_from_ch<=to || cursor_to_ch>=from && cursor_to_ch<=to)
        if (cursor_from_ch>=from && cursor_from_ch<=to || cursor_to_ch>=from && cursor_to_ch<=to) continue
        // const underlineMark: Decoration = Decoration.mark({class: "ab-underline"})
        const underlineMark: Decoration = Decoration.replace({widget: new ABReplaceWidget(mdText.slice(from, to), from, to)})
        decorationSet = decorationSet.update({
          add: [underlineMark.range(from, to)]
        })
      }
      decorationSet = decorationSet.map(tr.changes)     // 映射
    }

    // console.log("update - effectsState", editorState)
    // console.log("update - decorationSet", decorationSet)
    // console.log("update - range", editor.getRange(editor.getCursor("from"), editor.getCursor("to")))
    return decorationSet
  },
  provide: f => EditorView.decorations.from(f)
})

// Extension
const underlineTheme = EditorView.baseTheme({
  ".ab-underline": { textDecoration: "underline 3px red" }
})

// const underlineMark: Decoration = Decoration.replace({widget: new ABReplaceWidget("")}) // Decoration，下划线样式（mark）
// const underlineMark: Decoration = Decoration.mark({class: "ab-underline"})
