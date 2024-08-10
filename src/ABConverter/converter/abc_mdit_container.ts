/**
 * AB转换器 - 仿 markdown-it-container 功能
 */

import {ABConvert_IOEnum, ABConvert, type ABConvert_SpecSimp} from "./ABConvert"
import {ABConvertManager} from "../ABConvertManager"
import {ListProcess, type List_C2ListItem} from "./abc_list"
import {ABReg} from "../ABReg"

/// 按mdit-tabs的标准转化为二列列表数据
function mditTabs2listdata(content:string): List_C2ListItem {
    let list_line = content.split("\n")
    let content_item: string = ""
    let list_c2listItem: List_C2ListItem = []
    for (let line_index=0; line_index<list_line.length; line_index++) {
        let line_content = list_line[line_index]
        const line_match = line_content.match(/^@tab(.*)$/)
        if (line_match) {
            if (content_item.trim() != "") { // 尾调用
                list_c2listItem.push({
                    content: content_item,
                    level: 1
                })
                content_item = ""
            }
            list_c2listItem.push({
                content: line_match[1].trim(),
                level: 0
            })
            continue
        }
        else {
            content_item += line_content + "\n"
        }
    }
    if (content_item.trim() != "") { // 尾调用
        list_c2listItem.push({
            content: content_item,
            level: 1
        })
        content_item = ""
    }

    return list_c2listItem
}

const abc_mditTabs = ABConvert.factory({
    id: "mditTabs",
    name: "mdit标签页",
    process_param: ABConvert_IOEnum.text,
    process_return: ABConvert_IOEnum.el,
    process: (el, header, content)=>{
        let listdata: List_C2ListItem = mditTabs2listdata(content)
        ListProcess.data2tab(listdata, el, false)
        return el
    }
})

const abc_mditDemo = ABConvert.factory({
    id: "mditDemo",
    name: "mdit展示对比",
    process_param: ABConvert_IOEnum.text,
    process_return: ABConvert_IOEnum.el,
    process: (el, header, content)=>{
        const newContent = `@tab show\n${content}\n@tab mdSource\n~~~~~md\n${content}\n~~~~~`
        abc_mditTabs.process(el, header, newContent)
        return el
    }
})

const abc_mditABDemo = ABConvert.factory({
    id: "mditABDemo",
    name: "AnyBlock转用展示对比",
    process_param: ABConvert_IOEnum.text,
    process_return: ABConvert_IOEnum.el,
    process: (el, header, content)=>{
        const newContent = `@tab show\n${content}\n@tab withoutPlugin\n(cancelPluginFlag)${content.trimStart()}\n@tab mdSource\n~~~~~md\n${content}\n~~~~~`
        abc_mditTabs.process(el, header, newContent)
        return el
    }
})
