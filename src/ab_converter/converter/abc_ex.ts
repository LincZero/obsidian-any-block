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
    const e_faq:HTMLElement = el.createDiv({cls: "ab-faq"})
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
          const e_faq_line = e_faq.createDiv({cls:`ab-faq-line ab-faq-${mode_qa}`})
          const e_faq_bubble = e_faq_line.createDiv({cls:`ab-faq-bubble ab-faq-${mode_qa}`})
          const e_faq_content = e_faq_bubble.createDiv({cls:"ab-faq-content"})
          e_faq_content.addClass("markdown-rendered")
          ABConvertManager.getInstance().m_renderMarkdownFn(last_content, e_faq_content)
        }
        mode_qa = m_line[1]
        last_content = m_line[3]
      }
    }
    // 循环尾
    if (mode_qa) {
      const e_faq_line = e_faq.createDiv({cls:`ab-faq-line ab-faq-${mode_qa}`})
          const e_faq_bubble = e_faq_line.createDiv({cls:`ab-faq-bubble ab-faq-${mode_qa}`})
          const e_faq_content = e_faq_bubble.createDiv({cls:"ab-faq-content"})
          e_faq_content.addClass("markdown-rendered")
          ABConvertManager.getInstance().m_renderMarkdownFn(last_content, e_faq_content)
    }
    return el
  }
})
