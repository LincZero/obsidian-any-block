import {EditorView, Decoration, DecorationSet} from "@codemirror/view"
import {Extension} from "@codemirror/state"

import { ABStateManager } from './abStateManager';
import { MdSelectorSpec } from "./abMdSelector"
import { ABReplaceWidget } from "./replaceWidgetType"

interface CursorSpec{
  from:number, 
  to:number
}
/** 装饰管理器
 * 返回一个Decoration
 * 其中传入r_this的作用主要是为了装饰块可能可以返过来设置光标位置
 */
export class ABDecorationManager{
  rangeSpec: MdSelectorSpec
  cursorSpec: CursorSpec
  decoration: Decoration
  isBlock: boolean
  r_this: ABStateManager

  constructor(r_this: ABStateManager, rangeSpec: MdSelectorSpec, cursorSpec:CursorSpec){
    this.rangeSpec = rangeSpec
    this.cursorSpec = cursorSpec
    this.r_this = r_this

    let from = rangeSpec.from
    let to = rangeSpec.to
    let cfrom = cursorSpec.from
    let cto = cursorSpec.to
    // 如果光标位置在块内，则不启用块，仅使用高亮
    if (cfrom>=from && cfrom<=to || cto>=from && cto<=to) {
      this.isBlock = false
    }
    else {
      this.isBlock = true
    }

    this.decoration = this.initDecorationSet()
  }

  initDecorationSet(): Decoration{
    if (!this.isBlock) {
      if (this.rangeSpec.selector=="brace"){
        return Decoration.mark({class: "ab-line-brace"})
      }
      else if (this.rangeSpec.selector=="list"){
        return Decoration.mark({class: "ab-line-list"})
      }
      else{
        return Decoration.mark({class: "ab-line-blue"})
      }
    }
    else{ // text:string, item:SpecKeyword, editor:Editor
      if (this.rangeSpec.selector=="brace"){
        return Decoration.replace({widget: new ABReplaceWidget(
          this.rangeSpec, this.r_this.editor
        )})
      }
      else if (this.rangeSpec.selector=="list"){
        if (this.rangeSpec.header){
          return Decoration.replace({widget: new ABReplaceWidget(
            this.rangeSpec, this.r_this.editor
          )})
        }
        else {
          return Decoration.mark({class: "ab-line-list"})
        }
      }
      else{
        return Decoration.mark({class: "ab-line-yellow"})
      }
    }
  }

  static decoration_theme():Extension{
    return [
      EditorView.baseTheme({
        ".ab-line-brace": { textDecoration: "underline 2px red" }
      }),
      EditorView.baseTheme({
        ".ab-line-list": { textDecoration: "underline 2px cyan" }
      }),
      EditorView.baseTheme({
        ".ab-line-yellow": { textDecoration: "underline 3px yellow" }
      }),
      EditorView.baseTheme({
        ".ab-line-blue": { textDecoration: "underline 3px blue" }
      })
    ]
  }
  
}
