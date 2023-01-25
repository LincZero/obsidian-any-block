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
  const view: View|null = this.app.workspace.getActiveViewOfType(MarkdownView);
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

  /** 修改StateEffect2 - 加入范围
   * 匹配、并将匹配项传入状态字段
   *
  let listSpecKeyword: SpecKeyword[] = blockMatch_keyword(mdText)
  if (!listSpecKeyword.length) return false
  for(let item of listSpecKeyword){
    let from = item.from
    let to = item.to
    // StateEffect
    const addUnderline = StateEffect.define<{from: number, to: number}>({
      map: ({from, to}, change) => ({from: change.mapPos(from), to: change.mapPos(to)})
    }).of({from, to})
    stateEffects.push(addUnderline)
  }
  if (!stateEffects.length) return false
  console.log("effects3", stateEffects)
  */

  /** 派发
   * 所有常规的编辑器状态(editor state)更新都应经过此步骤。它接受一个事务或事务规范(transaction spec)，并更新视图以显示该事务产生的新状态。
   * 它的实现可以被[选项](https://codemirror.net/6/docs/ref/#view.EditorView.constructor^config.dispatch)覆盖。
   * 此函数绑定到视图实例，因此不必作为方法调用。
   * 
   * 根据这个说明，我是否可以理解为虽然这是editorView方法，但可以更新EditorState类
   */
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

    // 基本变量
    const view: View|null = global_plugin_this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return decorationSet
      // @ts-ignore 这里会说View没有editor属性
    const editor: Editor = view.editor
      // @ts-ignore 这里会说Editor没有cm属性
    const editorView: EditorView = editor.cm
    const editorState: EditorState = editorView.state
    const mdText = editor.getValue()

    // 修改范围
    /** @bug 这里的mdText是未修改前的mdText */ 
    decorationSet = decorationSet.update({            // 减少，全部删掉
      filter: (from, to, value)=>{return false}
    })
    // 如果在纯编辑模式 或 光标位置在块内，则不启用
    if(true){
      let listSpecKeyword: SpecKeyword[] = ABRangeManager.blockMatch_keyword(mdText)
      if (!listSpecKeyword.length) return decorationSet // 增加
      for(let item of listSpecKeyword){
        let from = item.from
        let to = item.to
        const underlineMark: Decoration = Decoration.replace({widget: new ABReplaceWidget(mdText.slice(from, to))})
        decorationSet = decorationSet.update({
          add: [underlineMark.range(from, to)]
        })
      }
      decorationSet = decorationSet.map(tr.changes)     // 映射
    }

    // console.log("update - effectsState", editorState)
    console.log("update - decorationSet", decorationSet)
    console.log("update - cursor", editor.getCursor().line, editor.getCursor().ch, editor.getCursor("from"), editor.getCursor("to"))
    console.log("update - selected", editor.getSelection()) // 选中的文字而非范围
    console.log("update - range", editor.getRange(editor.getCursor("from"), editor.getCursor("to")))
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
