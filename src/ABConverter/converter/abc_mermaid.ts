/**
 * AB转换器 - mermaid相关
 * 
 * (可选) 参考：在Ob插件中增加7.1MB
 * 
 * 使用注意项：在ob/mdit中的写法不同，本文件搜索render_mermaidText函数。里面有三种策略。ob推荐策略1，mdit推荐策略3
 */

import {ABConvert_IOEnum, ABConvert, type ABConvert_SpecSimp} from "./ABConvert"
import {ABConvertManager} from "../ABConvertManager"
import {ListProcess, type List_ListItem} from "./abc_list"
import {ABReg} from "../ABReg"

// mermaid相关 - 要在这里自己渲才需要
import mermaid from "mermaid"
import mindmap from '@mermaid-js/mermaid-mindmap';
const initialize = mermaid.registerExternalDiagrams([mindmap]);
export const mermaid_init = async () => {
  await initialize;
};

/**
 * 生成一个随机id
 * 
 * @detail 因为mermaid渲染块时需要一个id，不然多个mermaid块会发生冲突
 */
function getID(length=16){
  return Number(Math.random().toString().substr(3,length) + Date.now()).toString(36);
}

// 纯组合，后续用别名模块替代
const abc_title2mindmap = ABConvert.factory({
  id: "title2mindmap",
  name: "标题到脑图",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    content = ListProcess.title2list(content, el)
    list2mindmap(content, el)
    return el
  }
})

const abc_list2mermaid = ABConvert.factory({
  id: "list2mermaid",
  name: "列表转mermaid流程图",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    list2mermaid(content, el)
    return el
  }
})

const abc_list2mindmap = ABConvert.factory({
  id: "list2mindmap",
  name: "列表转mermaid思维导图",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    list2mindmap(content, el)
    return el
  }
})

const abc_mermaid = ABConvert.factory({
  id: "mermaid",
  name: "新mermaid",
  match: /^mermaid(\((.*)\))?$/,
  default: "mermaid(graph TB)",
  detail: "由于需要兼容脑图，这里会使用插件内置的最新版mermaid",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content)=>{
    let matchs = content.match(/^mermaid(\((.*)\))?$/)
    if (!matchs) return el
    if (matchs[1]) content = matchs[2]+"\n"+content
    return render_mermaidText(content, el)
  }
})

// ----------- list and mermaid ------------

/** 列表转mermaid流程图 */
function list2mermaid(text: string, div: HTMLDivElement) {
  let list_itemInfo = ListProcess.list2data(text)
  let mermaidText = data2mermaidText(list_itemInfo)
  return render_mermaidText(mermaidText, div)
}

/** 列表转mermaid思维导图 */
function list2mindmap(text: string, div: HTMLDivElement) {
  let list_itemInfo = ListProcess.list2data(text)
  return data2mindmap(list_itemInfo, div)
}

/** 列表数据转mermaid流程图
 * ~~@bug 旧版bug（未内置mermaid）会闪一下~~ 
 * 然后注意一下mermaid的(项)不能有空格，或非法字符。空格我处理掉了，字符我先不管。算了，还是不处理空格吧
 */
function data2mermaidText(
  list_itemInfo: List_ListItem
){
  const html_mode = false    // @todo 暂时没有设置来切换这个开关

  let list_line_content:string[] = ["graph LR"]
  // let list_line_content:string[] = html_mode?['<pre class="mermaid">', "graph LR"]:["```mermaid", "graph LR"]
  let prev_line_content = ""
  let prev_level = 999
  for (let i=0; i<list_itemInfo.length; i++){
    if (list_itemInfo[i].level>prev_level){ // 向右正常加箭头
      prev_line_content = prev_line_content+" --> "+list_itemInfo[i].content//.replace(/ /g, "_")
    } else {                                // 换行，并……
      list_line_content.push(prev_line_content)
      prev_line_content = ""

      for (let j=i; j>=0; j--){             // 回退到上一个比自己大的
        if(list_itemInfo[j].level<list_itemInfo[i].level) {
          prev_line_content = list_itemInfo[j].content//.replace(/ /g, "_")
          break
        }
      }
      if (prev_line_content) prev_line_content=prev_line_content+" --> "  // 如果有比自己大的
      prev_line_content=prev_line_content+list_itemInfo[i].content//.replace(/ /g, "_")
    }
    prev_level = list_itemInfo[i].level
  }
  list_line_content.push(prev_line_content)
  // list_line_content.push(html_mode?"</pre>":"```")

  let text = list_line_content.join("\n")
  return text
}

/** 列表数据转mermaid思维导图 */
async function data2mindmap(
  list_itemInfo: List_ListItem, 
  div: HTMLDivElement
){
  // const subEl = document.createElement("div"); div.appendChild(subEl);
  //   subEl.textContent = "Disable, please replace `markmap` command"; subEl.setAttribute("style", "border: solid 2px red; padding: 10px;");
  // return div

  let list_newcontent:string[] = []
  for (let item of list_itemInfo){
    // 等级转缩进，以及"\n" 转化 <br/>
    let str_indent = ""
    for(let i=0; i<item.level; i++) str_indent+= " "
    list_newcontent.push(str_indent+item.content.replace("\n","<br/>"))
  }
  const mermaidText = "mindmap\n"+list_newcontent.join("\n")
  return render_mermaidText(mermaidText, div)
}

// 通过mermaid块里的内容来渲染mermaid块
async function render_mermaidText(mermaidText: string, div: HTMLElement) {
  // 1. 四选一。自己渲
  // 当前ob使用
  // - 优点: 最快，无需通过二次转换
  // - 缺点: abc模块要内置mermaid
  // - 选用：目前的ob环境中用是最好。vuepress-mdit中则有另一个bug：https://github.com/mermaid-js/mermaid/issues/5204
  // - 补充：废弃函数：mermaid.mermaidAPI.renderAsync("ab-mermaid-"+getID(), mermaidText, (svgCode:string)=>{ div.innerHTML = svgCode })
  const { svg } = await mermaid.render("ab-mermaid-"+getID(), mermaidText)
  div.innerHTML = svg

  // 2. 四选一。在这里给环境渲
  // - 优点：abc模块无需重复内置mermaid，缺点是二次转换在ob里会造成卡顿，在mdit里似乎id会有问题
  // div.classList.add("markdown-rendered")
  // ABConvertManager.getInstance().m_renderMarkdownFn("```mermaid\n"+mermaidText+"\n```", div)

  // 3. 四选一。这里不渲，交给上一层让上一层渲
  // 当前mdit选用
  // - 优点：abc模块无需重复内置mermaid。对于mdit，能避免输出格式必须为html
  // - 缺点：这和ab的接口设计是冲突的，属于是取巧临时使用，后面要规范一下。另一方面，不知道为什么这种方案容易爆内存 (markmap那边也这样用也没事，就mermaid这边会)
  // - 选用：mdit可以用这种，dev环境的最佳策略
  // div.classList.add("ab-raw")
  // div.innerHTML = `<div class="ab-raw-data" type-data="mermaid" content-data='${mermaidText}'></div>`

  // 4. 四选一。纯动态/手动渲染
  // - 优点：abc模块无需重复内置mermaid
  // - 缺点：是不由ab转换的mermaid块自己不管，转换可能有延迟，还要手动触发
  // - 选用：都可以用这种，虽然效果不太好，但省内存。方案3不知道为什么，会爆内存
  // const div_btn = document.createElement("button"); div.appendChild(div_btn); div_btn.textContent = "ChickMe ReRender Mermaid";
  // div_btn.setAttribute("style", "background-color: argb(255, 125, 125, 0.5)");
  // div_btn.setAttribute("onclick", `
  // console.log("mermaid chick");
  // let script_el = document.querySelector('script[script-id="ab-mermaid-script"]');
  // if (script_el) script_el.remove();
  // script_el = document.createElement('script'); document.head.appendChild(script_el);
  // script_el.type = "module";
  // script_el.setAttribute("script-id", "ab-mermaid-script");
  // script_el.textContent = \`
  // import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
  // mermaid.initialize({ startOnLoad: false });
  // const el_mermaids = document.querySelectorAll('.ab-mermaid-raw');
  // function getID(length=16){
  //   return Number(Math.random().toString().substr(3,length) + Date.now()).toString(36);
  // }
  // for(const el_mermaid of el_mermaids) {
  //   const { svg } = await mermaid.render("ab-mermaid-"+getID(), el_mermaid.textContent);
  //   el_mermaid.innerHTML = svg
  // }
  // \``);
  // const pre_div = document.createElement("pre"); div.appendChild(pre_div); pre_div.classList.add("ab-mermaid-raw"); pre_div.textContent = mermaidText;
  
  return div
}
