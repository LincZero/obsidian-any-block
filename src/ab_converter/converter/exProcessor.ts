/**
 * 处理器_特殊版？
 */

import { MarkdownRenderer, MarkdownRenderChild } from 'obsidian'
import {ABConvertManager} from "../abConvertManager"
import {ProcessDataType, ABProcessorSpec, type ABProcessorSpecSimp} from "./abProcessorInterface"

const process_faq = ABProcessorSpec.factory({
  id: "faq",
  name: "FAQ",
  match: "FAQ",
  process_param: ProcessDataType.text,
  process_return: ProcessDataType.el,
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
          const child = new MarkdownRenderChild(e_faq_content);
          e_faq_content.addClass("markdown-rendered")
          MarkdownRenderer.renderMarkdown(last_content, e_faq_content, "", child);
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
          const child = new MarkdownRenderChild(e_faq_content);
          e_faq_content.addClass("markdown-rendered")
          MarkdownRenderer.renderMarkdown(last_content, e_faq_content, "", child);
    }
    return el
  }
})
