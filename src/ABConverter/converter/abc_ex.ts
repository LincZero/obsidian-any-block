/**
 * 处理器_特殊
 * 
 * 这是一个demo: 教你如何写一个自己的转换器
 */

import {ABConvert_IOEnum, ABConvert, type ABConvert_SpecSimp} from "./ABConvert"
import {ABConvertManager} from "../ABConvertManager"
import { ABAlias_json } from "../ABAlias";

const abc_faq = ABConvert.factory({
  id: "faq",
  name: "FAQ",
  match: "FAQ",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: string): HTMLElement=>{
    const e_faq:HTMLElement = document.createElement("div"); el.appendChild(e_faq); e_faq.classList.add("ab-faq");
    const list_content:string[] = content.split("\n");

    let mode_qa:string = ""
    let last_content:string = ""
    for (let line of list_content){
      const m_line = line.match(/^([a-zA-Z])(: |：)(.*)/)
      if (!m_line){ // 不匹配
        if (mode_qa) {
          last_content = last_content + "\n" + line
        }
        continue
      } else {      // 匹配
        if (mode_qa) {
          const e_faq_line = document.createElement("div"); e_faq.appendChild(e_faq_line); e_faq_line.classList.add("ab-faq-line", `ab-faq-${mode_qa}`);
          const e_faq_bubble = document.createElement("div"); e_faq_line.appendChild(e_faq_bubble); e_faq_bubble.classList.add("ab-faq-bubble", `ab-faq-${mode_qa}`);
          const e_faq_content = document.createElement("div"); e_faq_bubble.appendChild(e_faq_content); e_faq_content.classList.add("ab-faq-content");
          ABConvertManager.getInstance().m_renderMarkdownFn(last_content, e_faq_content)
        }
        mode_qa = m_line[1]
        last_content = m_line[3]
      }
    }
    // 循环尾
    if (mode_qa) {
          const e_faq_line = document.createElement("div"); e_faq.appendChild(e_faq_line); e_faq_line.classList.add("ab-faq-line", `ab-faq-${mode_qa}`);
          const e_faq_bubble = document.createElement("div"); e_faq_line.appendChild(e_faq_bubble); e_faq_bubble.classList.add("ab-faq-bubble", `ab-faq-${mode_qa}`);
          const e_faq_content = document.createElement("div"); e_faq_bubble.appendChild(e_faq_content); e_faq_content.classList.add("ab-faq-content");
          ABConvertManager.getInstance().m_renderMarkdownFn(last_content, e_faq_content)
    }
    return el
  }
})

const abc_info = ABConvert.factory({
  id: "info",
  name: "INFO",
  match: "info",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: string): HTMLElement=>{
    const table_p: HTMLDivElement = document.createElement("div"); el.appendChild(table_p); table_p.classList.add("ab-setting", "md-table-fig1");
    const table: HTMLDivElement = document.createElement("table"); table_p.appendChild(table); table.classList.add("ab-setting","md-table-fig2");
    {
      const thead = document.createElement("thead"); table.appendChild(thead);
      const tr = document.createElement("tr"); thead.appendChild(tr);
      let th;
      th = document.createElement("th"); tr.appendChild(th); th.textContent = "处理器名\nProcessor name";
      th = document.createElement("th"); tr.appendChild(th); th.textContent = "下拉框默认项\nThe default drop-down box";
      th = document.createElement("th"); tr.appendChild(th); th.textContent = "用途描述\nPurpose description";
      th = document.createElement("th"); tr.appendChild(th); th.textContent = "输入类型\nInput type";
      th = document.createElement("th"); tr.appendChild(th); th.textContent = "输出类型\nOutput type";
      th = document.createElement("th"); tr.appendChild(th); th.textContent = "正则\nRegExp";
      th = document.createElement("th"); tr.appendChild(th); th.textContent = "是否启用\nIs enable";
      th = document.createElement("th"); tr.appendChild(th); th.textContent = "定义来源\nSource";
      th = document.createElement("th"); tr.appendChild(th); th.textContent = "别名替换\nAlias substitution";
    }
    const tbody = document.createElement("tbody"); table.appendChild(tbody);
    for (let item of ABConvertManager.getInstance().list_abConvert){
      const tr = document.createElement("tr"); tbody.appendChild(tr)
      let td
      td = document.createElement("td"); tr.appendChild(td); td.textContent = item.name;
      td = document.createElement("td"); tr.appendChild(td); td.textContent = String(item.default);
      td = document.createElement("td"); tr.appendChild(td); td.textContent = item.detail; td.setAttribute("style", "max-width:240px;overflow-x:auto;white-space:nowrap;");
      // td = document.createElement("td"); tr.appendChild(td); td.textContent = item.is_render?"渲染":"文本";
      td = document.createElement("td"); tr.appendChild(td); td.textContent = String(item.process_param);
      td = document.createElement("td"); tr.appendChild(td); td.textContent = String(item.process_return);
      td = document.createElement("td"); tr.appendChild(td); td.textContent = String(item.match);
      td = document.createElement("td"); tr.appendChild(td); td.textContent = item.is_disable?"No":"Yes";
      td = document.createElement("td"); tr.appendChild(td); td.textContent = item.register_from;
      td = document.createElement("td"); tr.appendChild(td); td.textContent = item.process_alias;
    }
    return el
  }
})

const abc_info_alias = ABConvert.factory({
  id: "alias",
  name: "INFO_Alias",
  match: "info_alias",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.json,
  process: (el, header, content: string): string=>{
    return JSON.stringify(
      ABAlias_json.map((item)=>{return {
        regex: item.regex.toString(),
        replacement: item.replacement
      }}),
      null, 2
    )
  }
})
