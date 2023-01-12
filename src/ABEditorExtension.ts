import {
	Decoration,
  DecorationSet,
  ViewPlugin,
  PluginValue,
  ViewUpdate,
  EditorView
} from "@codemirror/view"
import {
  RangeSetBuilder,
  Extension
} from '@codemirror/state';
import AnyBlockPlugin from "./main";

export function editorExtension(plugin_this: AnyBlockPlugin) {
  return ViewPlugin.fromClass(
    AnyBlockPluginValue,
    {
      decorations: (v) => v.decorations,
    },
  )
}

export class AnyBlockPluginValue implements PluginValue {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(/*plugin_this*/view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(/*plugin_this*/update.view);
    }
  }
  
  // @private
  private buildDecorations(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();  // 范围生成器

    let matchInfo = this.findKeyword(view)
    matchInfo = this.match2Block(matchInfo)    

    matchInfo.forEach(item => {
      builder.add(
        item.from,
        item.to,
        Decoration.mark({
          class: 'cm-anyBlock',
          attributes: {
              'data-position-start': `${item.from}`,
              'data-position-end': `${item.to}`,
              'style': `background-color: #80a492`
          }
        })
      )
    })
    return builder.finish();
  }

  // @private
  private findKeyword(view: EditorView) {
    const matchInfo = []
    const visibleRanges = view.visibleRanges;
    // console.log("view", view)
    // console.log("visibleRanges", visibleRanges)
    for (const { from, to } of visibleRanges) {
      const visibleText = view.state.sliceDoc(from, to);  // 渲染可见的文字
      const regExp = /%{|%}/gi
      const matchList = visibleText.match(regExp);   // 匹配项
      if (!matchList) {break}
      let prevIndex = 0
      console.log("matchList", matchList)
      // 获取所有匹配项的位置
      for (const matchItem of matchList){
        const from2 = visibleText.indexOf(matchItem, prevIndex)
        const to2 = from2 + matchItem.length;
        prevIndex = to2;
        matchInfo.push({
          from: from2,
          to: to2,
          keyword: matchItem,
          match: "%{|%}"
        })
      }
    }
    return matchInfo
  }

  // @private
  private match2Block(
    matchInfo: {
      from: number;
      to: number;
      keyword: string;
      match: string;
    }[]
  ) {
    let countBracket = 0
    let prevBracket = []  // 括号栈
    let countAuto = 0
    let matchInfoNew = []
    for (const matchItem of matchInfo) {
      if (matchItem.keyword=="%{") {
        countBracket++
        prevBracket.push(matchItem.from)
      }
      else if(matchItem.keyword=="%}" && countBracket>0) {
        countBracket--
        matchInfoNew.push({
          from: prevBracket.pop() as number,
          to: matchItem.to,
          keyword: "",
          match: "%{}"
        })
      }
    }
    return matchInfoNew
  }
}
