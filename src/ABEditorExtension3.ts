import {EditorView, Decoration, DecorationSet} from "@codemirror/view"
import {StateField, StateEffect, EditorState} from "@codemirror/state"
import {MarkdownView, View, Editor, EditorPosition} from 'obsidian';

import AnyBlockPlugin from './main'
import { blockMatch_keyword, SpecKeyword } from "./utils/rangeManager"
import { ABReplaceWidget } from "./utils/replaceWidget"

export function replace2AnyBlock(plugin_this: AnyBlockPlugin/*view: EditorView*/) {

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

  // 匹配
  let listSpecKeyword: SpecKeyword[] = blockMatch_keyword(mdText)
  if (!listSpecKeyword.length) return false

  // 将匹配项传入状态字段
  let effects: StateEffect<unknown>[] = []
  for(let item of listSpecKeyword){
    let from = item.from
    let to = item.to
    effects.push(addUnderline.of({from, to}))
  }
  if (!effects.length) return false
  console.log("effects1", effects)

  // 当状态有(下划线)字段时，才执行里面的内容。
  // 添加下划线字段，只会在第一次时执行，才会触发
  if (!editorState.field(underlineField, false)) {
    effects.push(StateEffect.appendConfig.of(
      [underlineField, underlineTheme] 
    ))
    console.log("effects2", effects)
  }

  // 派发
  editorView.dispatch({effects})
  return true
}



// StateEffect
// 将number number，转化为StateEffectType，返回出去后会再转化为StateEffect
const addUnderline = StateEffect.define<{from: number, to: number}>({
  map: ({from, to}, change) => ({from: change.mapPos(from), to: change.mapPos(to)})   // 哪来的change?
})

// StateField
// 下划线的状态字段、该状态管理Decoration
const underlineField = StateField.define<DecorationSet>({
  create(editorState) {
    return Decoration.none
  },
  // create好像不用管，update无论如何都能触发的
  // 光标移动也会触发update，但上下滚动文档不会
  // update: (value: Value, transaction: Transaction) => Value;
  update(underlines, tr) {
    underlines = underlines.map(tr.changes)
    for (let e of tr.effects) if (e.is(addUnderline)) {
      underlines = underlines.update({
        add: [underlineMark.range(e.value.from, e.value.to)]
      })
    }
    return underlines
  },
  provide: f => EditorView.decorations.from(f)
})

// @return Extension
// 下划线样式（css）
// 按道理样式应该是可以直接加在Decoration里的。当然区别是那个是内敛样式，这种方式是通过类选择器加在css里的
const underlineTheme = EditorView.baseTheme({
  ".cm-underline": { textDecoration: "underline 3px red" }
})

// Decoration
// 下划线样式（mark）
//const underlineMark = Decoration.mark({class: "cm-underline"})
const underlineMark: Decoration = Decoration.replace({widget: new ABReplaceWidget("")})
