import {EditorView, Decoration, DecorationSet} from "@codemirror/view"
import {StateField, StateEffect, EditorState, Transaction} from "@codemirror/state"
import {MarkdownView, View, Editor, EditorPosition} from 'obsidian';

import AnyBlockPlugin from '../main'
import { ABRangeManager, SpecKeyword } from "../utils/rangeManager"

// 获取 - 模式
enum Editor_mode{
  NONE,
  SOURCE,
  SOURCE_LIVE,
  PREVIEW
}

/** 启用状态字段装饰功能 */
export class Replace2AnyBlock{
  plugin_this: AnyBlockPlugin

  constructor(plugin_this: AnyBlockPlugin){
    this.plugin_this=plugin_this
    this.replace() // 因为打开文档会触发，所以后台打开的文档会return false
  }

  replace() {
    // 常用变量
    const view: View|null = this.plugin_this.app.workspace.getActiveViewOfType(MarkdownView); // 未聚焦(active)会返回null
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
     * 当EditorState没有(下划线)StateField时，则将该(下划线)状态字段 添加进 EditorEffect中
     *    （函数末尾再将EditorEffect派发到EditorView中）。
     * 就是说只会在第一次时执行，才会触发
     */
    if (!editorState.field(this.underlineField, false)) {
      stateEffects.push(StateEffect.appendConfig.of(
        [this.underlineField, this.underlineTheme] 
      ))
    }
  
    /** 派发 */
    editorView.dispatch({effects: stateEffects})
    return true
  }

  /** get
   * StateField，该状态管理Decoration
   */
  static underlineField = StateField.define<DecorationSet>({
    create(editorState) {
      return Decoration.none
    },
    // create好像不用管，update无论如何都能触发的
    // 函数的根本作用，是为了修改decorationSet的范围，间接修改StateField的管理范围
    update(decorationSet, tr) {
      return stateField_update(decorationSet, tr)
    },
    provide: f => EditorView.decorations.from(f)
  })
  get underlineField(){
    return Replace2AnyBlock.underlineField
  }

  // get, Extension
  static underlineTheme = EditorView.baseTheme({
    ".ab-underline": { textDecoration: "underline 3px red" }
  })
  get underlineTheme(){
    return Replace2AnyBlock.underlineTheme
  }
}

// callback function
function stateField_update (decorationSet:DecorationSet, tr:Transaction){

  // 获取 - 基本变量
  const view: View|null = this.app.workspace.getActiveViewOfType(MarkdownView);
  if (!view) return decorationSet
    // @ts-ignore 这里会说View没有editor属性
  const editor: Editor = view.editor
    // @ts-ignore 这里会说Editor没有cm属性
  const editorView: EditorView = editor.cm
  const editorState: EditorState = editorView.state
  const mdText = editor.getValue()
  
  // 获取 - 编辑器模式
  let editor_mode: Editor_mode
  {
  let editor_dom: Element
    /** @warning 不能用 editor_dom = document
     * 再editor_dom = editor_dom?.getElementsByClassName("workspace-tabs mod-top mod-active")[0];
     * 用document的话不知道为什么总是有属性is-live-preview的，总是认为是实时模式 
     */
    editor_dom = this.app.workspace.activeLeaf.containerEl
    editor_dom = editor_dom?.getElementsByClassName("workspace-leaf-content")[0]
    let str = editor_dom?.getAttribute("data-mode")
    if (str=="source") {
      editor_dom = editor_dom?.getElementsByClassName("markdown-source-view")[0]
      if(editor_dom?.classList.contains('is-live-preview')) editor_mode=Editor_mode.SOURCE_LIVE
      else editor_mode=Editor_mode.SOURCE
    }
    else if (str=="preview") editor_mode=Editor_mode.PREVIEW  // 但其实不会判定，因为实时是不触发update方法的
    else {editor_mode=Editor_mode.NONE; console.log("无法获取编辑器模式，可能会产生BUG")}
  }

  // 获取 - 光标from-to
  let cursor_from_ch = 0
  let cursor_to_ch = 0
  {
    let list_text: string[] = editor.getValue().split("\n")
    for (let i=0; i<=editor.getCursor("to").line; i++){
      if (editor.getCursor("from").line == i) {cursor_from_ch = cursor_to_ch+editor.getCursor("from").ch}
      if (editor.getCursor("to").line == i) {cursor_to_ch = cursor_to_ch+editor.getCursor("to").ch; break;}
      cursor_to_ch += list_text[i].length+1
    }
  }

  // 范围选择器
  /** @bug 这里的mdText是未修改前的mdText，光标的位置也是 会延迟一拍 */
  decorationSet = decorationSet.update({            // 减少，全部删掉
    filter: (from, to, value)=>{return false}
  })
  // 如果不在实时模式，则不启用
  if(editor_mode!=Editor_mode.SOURCE_LIVE) return decorationSet
  let listSpecKeyword: SpecKeyword[] = ABRangeManager.blockMatch_keyword(mdText)
  if (!listSpecKeyword.length) return decorationSet // 增加
  for(let item of listSpecKeyword){
    let from = item.from
    let to = item.to
    // 如果光标位置在块内，则不启用块，仅使用高亮
    let underlineMark: Decoration
    if (cursor_from_ch>=from && cursor_from_ch<=to || cursor_to_ch>=from && cursor_to_ch<=to) {
      underlineMark = ABRangeManager.decoration_line()
    }
    else {
      underlineMark = ABRangeManager.decoration_block(mdText.slice(from, to), from, to, editor)
    }
    decorationSet = decorationSet.update({
      add: [underlineMark.range(from, to)]
    })
  }
  decorationSet = decorationSet.map(tr.changes)     // 映射
  return decorationSet
}
