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
    // plugin_this: AnyBlockPlugin,                       // 使用bind方法被绑进来的
    src: string,                                // 代码块内容
    blockEl: HTMLElement,                       // 代码块渲染的元素
    ctx: MarkdownPostProcessorContext,
  ) {
    const root_div = blockEl
    const list_src = src.split("\n")

    // AnyBlock块
    if (list_src.length) {
      const match = list_src[0].match(ABReg.reg_header_noprefix)
      if (match && match[5]) {
        // AnyBlock主体
        const dom_note = root_div.createDiv({
          cls: ["ab-note", "drop-shadow"]
        })
        let dom_replaceEl = dom_note.createDiv({
          cls: ["ab-replaceEl"]
        })
        ABConvertManager.autoABConvert(dom_replaceEl, match[5], list_src.slice(1).join("\n").trimStart())

        // 编辑按钮
        // codeblock自带编辑按钮，不需要额外追加

        // 刷新按钮
        let dom_edit = root_div.createEl("div", {
          cls: ["ab-button", "edit-block-button"],
          attr: {"aria-label": "Refresh the block", "style": "right: 40px"}
        });
        dom_edit.innerHTML = ABReplacer_Widget.str_icon_refresh
        dom_edit.onclick = ()=>{abConvertEvent(root_div);}

        // 初始默认刷新 (仅markmap可以用这个，其他用似乎会有问题)
        if (match[5].indexOf("markmap")>=0) {
          abConvertEvent(dom_replaceEl)
        }
        return
      }
    }

    // 非法内容，普通渲染处理 (还是说代码渲染会更好?)
    let child = new MarkdownRenderChild(root_div);
    ctx.addChild(child);
    MarkdownRenderer.renderMarkdown(src, root_div, ctx.sourcePath, child);
  }
}
