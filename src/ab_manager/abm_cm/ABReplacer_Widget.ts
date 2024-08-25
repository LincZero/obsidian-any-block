import type {Editor, EditorPosition} from 'obsidian';
import {EditorView, WidgetType} from "@codemirror/view"

import {ABConvertManager} from "../../ABConverter/ABConvertManager"
import type {MdSelectorRangeSpec} from "./ABSelector_Md"

export class ABReplacer_Widget extends WidgetType {
  rangeSpec: MdSelectorRangeSpec
  global_editor: Editor|null
  div: HTMLDivElement

  // 构造函数
  constructor(rangeSpec: MdSelectorRangeSpec, editor: Editor|null){
    super()
    this.rangeSpec = rangeSpec
    this.global_editor = editor
  }

  /**
   *  div.ab-replace.cm-embed-block.markdown-rendered.show-indentation-guide[type_header=`${}`]
   *      div.drop-shadow.ab-note
   *      div.ab-button.edit-block-button[aria-label="Edit this block"]
   */
  toDOM(view: EditorView): HTMLElement {
    // 根元素
    this.div = document.createElement("div");
    this.div.setAttribute("type_header", this.rangeSpec.header)
    this.div.addClasses(["ab-replace", "cm-embed-block"]) // , "show-indentation-guide"

    // 内容替换元素
    let dom_note = this.div.createEl("div", {cls: ["ab-note", "drop-shadow"]});
    ABConvertManager.autoABConvert(dom_note, this.rangeSpec.header, this.rangeSpec.content, this.rangeSpec.selector)

    // 编辑按钮
    if (this.global_editor){
      let dom_edit = this.div.createEl("div", {
        cls: ["ab-button", "edit-block-button"], // cm-embed-block和edit-block-button是自带的js样式，用来悬浮显示的，不是我写的
        attr: {"aria-label": "Edit this block - "+this.rangeSpec.header}
      });
      dom_edit.innerHTML = ABReplacer_Widget.str_icon_code2
    
      // 通过控制光标移动间接取消显示块
      // this.div.ondblclick = ()=>{this.moveCursorToHead()}
      dom_edit.onclick = ()=>{this.moveCursorToHead()}
    }

    // 刷新按钮
    if (this.global_editor){
      let dom_edit = this.div.createEl("div", {
        cls: ["ab-button", "edit-block-button"],
        attr: {"aria-label": "refresh this block", "style": "right: 40px"}
      });
      dom_edit.innerHTML = ABReplacer_Widget.str_icon_refresh
      dom_edit.onclick = ()=>{
        // list2nodes的圆弧调整 (应在onload后再处理)
        const refresh = (d:Element|Document = document) => {
          const list_children = d.querySelectorAll(".ab-nodes-node")
          for (let children of list_children) {
            // 元素准备
            const el_child = children.querySelector(".ab-nodes-children"); if (!el_child) continue
            const el_bracket = el_child.querySelector(".ab-nodes-bracket") as HTMLElement;
            const el_bracket2 = el_child.querySelector(".ab-nodes-bracket2") as HTMLElement;
            const childNodes = el_child.childNodes;
            if (childNodes.length < 3) {
              el_bracket.style.setProperty("display", "none")
              el_bracket2.style.setProperty("display", "none")
              continue
            }
            const el_child_first = childNodes[2] as HTMLElement;
            const el_child_last = childNodes[childNodes.length - 1] as HTMLElement;

            // 修改伪类
            if (childNodes.length == 3) {
              el_bracket2.style.setProperty("height", `calc(100% - ${(8+8)/2}px)`);
              el_bracket2.style.setProperty("top", `${8/2}px`);
            } else {
              const heightToReduce = (el_child_first.offsetHeight + el_child_last.offsetHeight) / 2;
              el_bracket2.style.setProperty("height", `calc(100% - ${heightToReduce}px)`);
              el_bracket2.style.setProperty("top", `${el_child_first.offsetHeight/2}px`);
            }
          }
        }
        refresh(this.div);

        // markmap渲染
        let script_el: HTMLScriptElement|null = document.querySelector('script[script-id="ab-markmap-script"]');
        if (script_el) script_el.remove();
        script_el = document.createElement('script'); document.head.appendChild(script_el);
        script_el.type = "module";
        script_el.setAttribute("script-id", "ab-markmap-script");
        script_el.textContent = `
        import { Markmap, } from 'https://jspm.dev/markmap-view';
        const mindmaps = document.querySelectorAll('.ab-markmap-svg'); // 注意一下这里的选择器
        for(const mindmap of mindmaps) {
          Markmap.create(mindmap,null,JSON.parse(mindmap.getAttribute('data-json')));
        }`;
      }
    }
    
    return this.div;
  }

  private moveCursorToHead(): void{
      /** @warning 注意这里千万不能用 toDOM 方法给的 view 参数
       * const editor: Editor = view.editor // @ts-ignore
       * 否则editor是undefined
       */
      if (this.global_editor){
        const editor: Editor = this.global_editor
        let pos = this.getCursorPos(editor, this.rangeSpec.from_ch)
        if (pos) {
          editor.setCursor(pos)
          // 往返修改，间接重新渲染State
          editor.replaceRange("OF", pos)
          editor.replaceRange("", pos, {line:pos.line, ch:pos.ch+2})
        }
      }
  }

  private getCursorPos(editor:Editor, total_ch:number): EditorPosition|null{
    let count_ch = 0
    let list_text: string[] = editor.getValue().split("\n")
    for (let i=0; i<list_text.length; i++){
      if (count_ch+list_text[i].length >= total_ch) return {line:i, ch:total_ch-count_ch}
      count_ch = count_ch + list_text[i].length + 1
    }
    return null
  }

  // 迭代
  createTable(div: Element){

  }

  static str_icon_code2 = `<svg xmlns="http://www.w3.org/2000/svg" stroke-linecap="round"
      stroke-linejoin="round" data-darkreader-inline-stroke="" stroke-width="2"
      viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" style="--darkreader-inline-stroke:currentColor;">
    <path d="m18 16 4-4-4-4"></path>
    <path d="m6 8-4 4 4 4"></path>
    <path d="m14.5 4-5 16"></path>
  </svg>`
  // https://www.svgrepo.com/svg/18461/refresh, 原viewBox: 0 0 489.698 489.698, 原size 800
  static str_icon_refresh = `<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
      xml:space="preserve"
      viewBox="-80 -80 650 650" height="24" width="24" fill="currentColor" stroke="currentColor" style="--darkreader-inline-stroke:currentColor;">
    <g>
      <g>
        <path d="M468.999,227.774c-11.4,0-20.8,8.3-20.8,19.8c-1,74.9-44.2,142.6-110.3,178.9c-99.6,54.7-216,5.6-260.6-61l62.9,13.1
          c10.4,2.1,21.8-4.2,23.9-15.6c2.1-10.4-4.2-21.8-15.6-23.9l-123.7-26c-7.2-1.7-26.1,3.5-23.9,22.9l15.6,124.8
          c1,10.4,9.4,17.7,19.8,17.7c15.5,0,21.8-11.4,20.8-22.9l-7.3-60.9c101.1,121.3,229.4,104.4,306.8,69.3
          c80.1-42.7,131.1-124.8,132.1-215.4C488.799,237.174,480.399,227.774,468.999,227.774z"/>
        <path d="M20.599,261.874c11.4,0,20.8-8.3,20.8-19.8c1-74.9,44.2-142.6,110.3-178.9c99.6-54.7,216-5.6,260.6,61l-62.9-13.1
          c-10.4-2.1-21.8,4.2-23.9,15.6c-2.1,10.4,4.2,21.8,15.6,23.9l123.8,26c7.2,1.7,26.1-3.5,23.9-22.9l-15.6-124.8
          c-1-10.4-9.4-17.7-19.8-17.7c-15.5,0-21.8,11.4-20.8,22.9l7.2,60.9c-101.1-121.2-229.4-104.4-306.8-69.2
          c-80.1,42.6-131.1,124.8-132.2,215.3C0.799,252.574,9.199,261.874,20.599,261.874z"/>
      </g>
    </g>
  </svg>`
}

interface TreeNode{
    text: string
    children: TreeNode[]
}

/*`
<div class="drop-shadow ab-note">
  <p>${this.text.split("\n").join("<br/>")}</p>
</div>
<div class="edit-block-button" aria-label="Edit this block">
  ${str_icon_code2}
</div>
`*/

/**const div = document.createDiv({
  cls: ["ab-replace"]
})/
/*const editButton = div.createEl("img", {
  cls: ["ab-switchButton"],
  //text: str_icon_code2,
  title: "Edit this block",
  // attr: {"src": "code-2"}////////////////
})*/
/*const adText = div.createDiv({
  text: "👉" + this.text
})*/
// div.innerText = "👉" + this.text;
