import type {MarkdownPostProcessorContext} from "obsidian"
import{
  MarkdownRenderChild,
  MarkdownRenderer,
} from "obsidian";
import { ABConvertManager } from "src/ABConverter";
import { abConvertEvent } from "src/ABConverter/ABConvertEvent";
import { ABReg } from "src/ABConverter/ABReg";
import { ABReplacer_Widget } from "../abm_cm/ABReplacer_Widget";

export class ABReplacer_CodeBlock{
  static processor(
    // plugin_this: AnyBlockPlugin,             // 使用bind方法被绑进来的
    src: string,                                // 代码块内容
    blockEl: HTMLElement,                       // 代码块渲染的元素
    ctx: MarkdownPostProcessorContext,
  ) {
    const root_div = document.createElement("div");  blockEl.appendChild(root_div); root_div.classList.add("ab-replace");
    const list_src = src.split("\n")

    // 判断当前是实时还是阅读模式
    // ...

    // 判断是否AnyBlock块
    let header = ""
    if (list_src.length) {
      const match = list_src[0].match(ABReg.reg_header_noprefix)
      if (match && match[5]) {
        header = match[5];
      }
    }

    // AnyBlock主体部分
    const dom_note = root_div.createDiv({
      cls: ["ab-note", "drop-shadow"]
    })
    let dom_replaceEl = dom_note.createDiv({
      cls: ["ab-replaceEl"]
    })
    if (header != "") { // b1. 规范的AnyBlock
      ABConvertManager.autoABConvert(dom_replaceEl, header, list_src.slice(1).join("\n").trimStart())
    }
    else { // b2. 非法内容，普通渲染处理 (还是说代码渲染会更好?)
      // @ts-ignore 新接口，但旧接口似乎不支持
      MarkdownRenderer.render(app, src, root_div, "", new MarkdownRenderChild(root_div));
    }

    // 编辑按钮部分
    // codeblock自带编辑按钮，不需要额外追加

    // 刷新按钮部分
    let dom_edit = root_div.createEl("div", {
      cls: ["ab-button", "edit-block-button"],
      attr: {"aria-label": "Refresh the block", "style": "right: 40px"}
    });
    dom_edit.innerHTML = ABReplacer_Widget.str_icon_refresh
    dom_edit.onclick = ()=>{abConvertEvent(root_div);}

    // 控件部分的隐藏
    const button_show = ()=>{dom_edit.show()}
    const button_hide  = ()=>{dom_edit.hide()}
    dom_edit.hide()
    dom_note.onmouseover = button_show
    dom_note.onmouseout = button_hide
    dom_edit.onmouseover = button_show
    dom_edit.onmouseout = button_hide
  }
}
