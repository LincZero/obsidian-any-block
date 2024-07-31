/**
 * 处理器_特殊版？
 */

import {ABConvert_IOType, ABConvert, type ABConvert_SpecSimp} from "./ABConvert"
import {ABConvertManager} from "../ABConvertManager"

const abc_faq = ABConvert.factory({
  id: "faq",
  name: "FAQ",
  match: "FAQ",
  process_param: ABConvert_IOType.text,
  process_return: ABConvert_IOType.el,
  process: (el, header, content)=>{
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
          e_faq_content.classList.add("markdown-rendered")
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
          e_faq_content.classList.add("markdown-rendered")
          ABConvertManager.getInstance().m_renderMarkdownFn(last_content, e_faq_content)
    }
    return el
  }
})
