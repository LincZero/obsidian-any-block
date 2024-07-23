import { MarkdownRenderChild } from "obsidian";
import { ABConvertManager } from "../ab_converter/abConvertManager"

export class ReplaceRender extends MarkdownRenderChild {
  content: string;
  header: string;

  // override。这里就是新增了一个text参数而已，其他不变
  constructor(containerEl: HTMLElement, header: string, content: string) {
    super(containerEl);
    this.header = header;
    this.content = content;
  }

  /**
   *  div
   *      div.ab-replace.cm-embed-block.markdown-rendered.show-indentation-guide[type_header=`${}`]
   *          div.drop-shadow.ab-note
   *              .ab-replaceEl (下拉框选择时被替换)
   *          div.edit-block-button[aria-label="Edit this block"]
   * 
   *  this.containerEl
   *      div
   *          dom_note
   *              subEl (下拉框选择时被替换)
   *          dom_edit
   */
  onload() {
    const div:HTMLDivElement = this.containerEl.createDiv({
      cls: ["ab-replace", "cm-embed-block"]
    });
    div.setAttribute("type_header", this.header)

    // 主体部分
    const dom_note = div.createDiv({
      cls: ["ab-note", "drop-shadow"]
    })
    let dom_replaceEl = dom_note.createDiv({
      cls: ["ab-replaceEl"]
    })
    ABConvertManager.autoABConvert(dom_replaceEl, this.header, this.content)
    this.containerEl.replaceWith(div);
    
    // 下拉框格式部分
    const dom_edit = div.createEl("select", {
      cls: ["ab-button", "edit-block-button"], 
      attr: {"aria-label": "Edit this block - "+this.header}
    });
    const first_dom_option = dom_edit.createEl("option",{ // 这个需要在首选
      text:"复合格式:"+this.header,
      attr:{"value":this.header},
    })
    first_dom_option.selected=true
    let header_name_flag = ""   // 当前填写的处理器是否标准处理器，如过则隐藏第一个option改用标准的那个
    for (let item of ABConvertManager.getInstance().getConvertOptions()){
      const dom_option = dom_edit.createEl("option",{
        text:item.name,
        attr:{"value":item.id},
      })
      if (this.header==item.id) {
        header_name_flag = item.name
        // dom_option.selected=true
      }
    }
    if (header_name_flag!=""){ // 这里可选一种处理方式：销毁/隐藏/不处理 保留两个相同规则的选项
      // first_dom_option.setAttribute("style", "display:none") 
      // dom_edit.removeChild(first_dom_option)
      first_dom_option.setText(header_name_flag)
    }
    dom_edit.onchange = ()=>{
      const new_header = dom_edit.options[dom_edit.selectedIndex].value
      const new_dom_replaceEl = dom_note.createDiv({
        cls: ["ab-replaceEl"]
      })
      ABConvertManager.autoABConvert(new_dom_replaceEl, new_header, this.content)
      dom_replaceEl.replaceWith(new_dom_replaceEl);
      dom_replaceEl = new_dom_replaceEl
    }

    // 下拉框隐藏
    const button_show = ()=>{dom_edit.show()}
    const button_hide  = ()=>{dom_edit.hide()}
    dom_edit.hide()
    dom_note.onmouseover = button_show
    dom_note.onmouseout = button_hide
    dom_edit.onmouseover = button_show
    dom_edit.onmouseout = button_hide
  }

  static str_icon_code2 = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-darkreader-inline-stroke="" style="--darkreader-inline-stroke:currentColor;"><path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path></svg>`
}
