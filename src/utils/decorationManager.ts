import {EditorView, Decoration, DecorationSet} from "@codemirror/view"
import {Extension} from "@codemirror/state"
import {RangeSpec} from "./rangeManager"


import {Editor} from 'obsidian';

import { ABReplaceWidget } from "../replace/replaceWidget"
import { registerReplace } from '../replace/registerReplace';
import { Replace2AnyBlock } from '../processor/ABEditorExtension3';


export class ABDecorationManager{
  rangeSpec: RangeSpec
  cursorSpec: {from:number, to:number}
  decoration: Decoration
  isBlock: boolean
  r_this: Replace2AnyBlock

  constructor(r_this: Replace2AnyBlock, rangeSpec: RangeSpec, cursorSpec:{from:number, to:number}){
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

    this.initDecorationSet()
  }

  initDecorationSet(){
    if (!this.isBlock) {
      if (this.rangeSpec.match=="brace"){
        this.decoration = Decoration.mark({class: "ab-line-brace"})
      }
      else if (this.rangeSpec.match=="list"){
        this.decoration = Decoration.mark({class: "ab-line-list"})
      }
      else{
        this.decoration = Decoration.mark({class: "ab-line-blue"})
      }
    }
    else{ // text:string, item:SpecKeyword, editor:Editor
      if (this.rangeSpec.match=="brace"){
        const text = this.r_this.mdText.slice(this.rangeSpec.from+2, this.rangeSpec.to-2)
        this.decoration = Decoration.replace({widget: new ABReplaceWidget(
          text, this.rangeSpec.from, this.rangeSpec.to, this.r_this.editor
        )})
      }
      else if (this.rangeSpec.match=="list"){
        const text = this.r_this.mdText.slice(this.rangeSpec.from, this.rangeSpec.to)
        this.decoration = Decoration.replace({widget: new ABReplaceWidget(
          "list2mdtable\n"+text, this.rangeSpec.from, this.rangeSpec.to, this.r_this.editor
        )})
      }
      else{
        this.decoration = Decoration.mark({class: "ab-line-yellow"})
      }
    }
  }

  static decoration_theme():Extension{
    return [
      EditorView.baseTheme({
        ".ab-line-brace": { textDecoration: "underline 3px red" }
      }),
      EditorView.baseTheme({
        ".ab-line-list": { textDecoration: "underline 3px cyan" }
      })
    ]
  }
  
}
