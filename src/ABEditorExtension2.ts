// 下划线实验
import {EditorView, Decoration, DecorationSet} from "@codemirror/view"
import {StateField, StateEffect} from "@codemirror/state"
import {keymap} from "@codemirror/view"

// 1. 将命令绑定到ctrl+h上
export const underlineKeymap = keymap.of([{
  key: "Ctrl-r",
  preventDefault: true,
  run: underlineSelection
}])

// @private方法
// 2. 选择需要给下划线的部分
export function underlineSelection(view: EditorView) {
  /**
  先说view.state.selection.ranges
    类型SelectionRange[]，即{from, to, flags}[]
    内容是当前编辑器选择的内容，哪怕选择的范围很大，数组长度也只有一。
    length>1 的情况是多个选择范围（按住Alt多选）

  再说StateEffect<...>[]
    感觉里面好像啥都能塞的样子。
    这里创建的过程有点繁琐，类型变化经历了 SelectionRange[] -> StateEffect -> StateEffectType -> StateEffect<...>[]
   */
  let effects: StateEffect<unknown>[] = view.state.selection.ranges // 类型 SelectionRange[]
    .filter(r => !r.empty)                                          // 去除掉空选择，类型依然是 SelectionRange[]
    .map(({from, to}) => addUnderline.of({from, to}))               // 传给addUnderline函数，再用of函数，将类型最终修改为 StateEffect<...>[]
  console.log("effects1", effects)                                  // 指定新的下划线内容时会触发

  // 没有选择则不管
  if (!effects.length) return false

  // 当状态有(下划线)字段时，才执行里面的内容。
  // 添加下划线字段，只会在第一次时执行，才会触发
  if (!view.state.field(underlineField, false)) {
    // of()的接收参数是Extension
    // 这里的StateField、和baseTheme生成的Extension都符合该参数接口
    effects.push(StateEffect.appendConfig.of(
      [underlineField, underlineTheme] 
    ))
    console.log("effects2", effects)
  }

  view.dispatch({effects})  // 派发
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
  create() {
    return Decoration.none
  },
  // create好像不用管，update无论如何都能触发的
  // 光标移动也会触发update，但上下滚动文档不会
  // update: (value: Value, transaction: Transaction) => Value;
  update(underlines, tr) {
    // 这里主要注意两个方法：underlines.map() 和 underlines.update()，都是用来更新范围状态的。
    //    应该是一个用来映射原有的，一个用来增加新的。
    //    例如(0000)中间插入字符，先变成(00)11(00)再变成(00)(11)(00)或(001100)
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

// Decoration
// @pricate 下划线样式（mark）
const underlineMark = Decoration.mark({class: "cm-underline"})

// @return Extension
// 下划线样式（css）
// 按道理样式应该是可以直接加在Decoration里的。当然区别是那个是内敛样式，这种方式是通过类选择器加在css里的
const underlineTheme = EditorView.baseTheme({
  ".cm-underline": { textDecoration: "underline 3px red" }
})
