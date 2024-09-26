/**
 * AnyBlock 别名模块
 * 
 * @detail
 * 
 * 从职责设计上，该模块分为：
 * - 前处理部分
 * - 后处理部分
 * - 连接自动适配器部分
 * 
 * 但从实现上，这里只有第一部分的 “前处理部分”
 * 
 * 后两个部分和conveter模块暂时耦合较高，没办法分离
 * 
 * 需要注意：别名替换的最后需要删除自己所对应的选择器前缀
 * 
 * TODO 思考：别名系统是否可以做成想Converter那样通用的东西，感觉可以深挖
 * 
 * 1. obsidian 有 Highlightr-Plugin 插件能全局识别，可以参考
 * 2. 每个栏目可选：匹配则向下传递/终止
 * 3. 局部而非全文，以节约性能损耗 (例如专用于ab块header的转化)，当然这个可以通过匹配到header再调用API解决
 * 4. 复杂的变换、替换 (hightlightr所不具备的功能) 这也是 ==该插件叫别名系统而非匹配系统的原因==
 * 5. 正则的子串填空 (类似于搜索拐杖和旧版AB的别名器那样)
 */

import {ABReg} from "./ABReg"

/**
 * 指令头转义补全，可配合自然语言转指令
 * 
 * @detail
 * 
 * De-dependency: 取消对该函数的调用即可
 * 
 * 将自然语言指令头，转化为指令头
 * 
 * 是否绑定到处理器？旧版本通过alias选项设置，但V3版本不要
 * 
 * - 优点
 *   - 而是作为一个单独的模块，与实际解耦
 *   - 符合原则：关于用于语法糖操作，都应存在一个单独的语法糖模块进行处理，而不应与业务代码耦合
 * - 缺点
 *   - 新的处理器声明自然语言触发的语法糖。但是可以通过同时增加 “新的处理器” + “新的自然语言替换” 来解决
 * 
 * TODO：
 * - 这些别名系统，需要能够显示出来，应该要用json括一下
 * - 性能优化，如果匹配了再replace，且提前退出
 * - 仅匹配开头会不会性能好点
 * 
 * @returns
 * new header
 */
export function autoABAlias (header:string, selectorName:string, content:string): string{
  // 1. 别名模块 - 严格化。目的是方便仅使用正则而不用splic("|")就能判断识别的是完整的词而不是词的一部分
  if (!header.trimEnd().endsWith("|")) header = header + "|"
  if (!header.trimStart().startsWith("|")) header = "|" + header

  // 2. 别名模块 - 标注选择类型
  if (selectorName == "mdit") { // `:::`不在正文里，这个判断不到：if (ABReg.reg_mdit_head_noprefix.test(content.trimStart()))
    header = "|::: 140lne" + header.trimStart()
  }
  else if (selectorName == "list" || ABReg.reg_list_noprefix.test(content.trimStart())) {
    header = "|list 140lne" + header
  }
  else if (selectorName == "heading" || ABReg.reg_heading_noprefix.test(content.trimStart())) {
    header = "|heading 140lne" + header
  }
  else if (selectorName == "code" || ABReg.reg_code_noprefix.test(content.trimStart())) {
    header = "|code 140lne" + header
  }
  else if (selectorName == "quote" || ABReg.reg_quote_noprefix.test(content.trimStart())) {
    header = "|quote 140lne" + header
  }
  else if (selectorName == "table" || ABReg.reg_table_noprefix.test(content.trimStart())) {
    header = "|table 140lne" + header
  }

  // 3. 别名模块 - 别名替换
  for (const item of ABAlias_json) {
    header = header.replace(item.regex, item.replacement)
  }
  for (const item of ABAlias_json_end) { // 保证ABAlias_json内容被扩展后，该部分的替换规则仍处于最后
    header = header.replace(item.regex, item.replacement)
  }

  return header
}

interface ABAlias_json_item {
  regex: RegExp|string,
  replacement: string
}

// mdit块
const ABAlias_json_mdit: ABAlias_json_item[] = [
  {regex: "|::: 140lne|info|", replacement: "|add([!info])|quote|"},
  {regex: "|::: 140lne|note|", replacement: "|add([!note])|quote|"},
  {regex: /\|::: 140lne\|(warn|warning)\|/, replacement: "|add([!warning])|quote|"},
  {regex: "|::: 140lne|error|", replacement: "|add([!error])|quote|"},
  {regex: /\|::: 140lne\|(2?tabs?|标签页?)\|/, replacement: "|mditTabs|"},
  {regex: "|::: 140lne|demo|", replacement: "|mditDemo|"},
  {regex: "|::: 140lne|abDemo|", replacement: "|mditABDemo|"},
  {regex: /\|::: 140lne\|(2?col|分栏)\|/, replacement: "|mditCol|"},
  {regex: /\|::: 140lne\|(2?card|卡片)\|/, replacement: "|mditCard|"},
]

// 标题块
const ABAlias_json_title: ABAlias_json_item[] = [
  {regex: "|title2list|", replacement: "|title2listdata|listdata2strict|listdata2list|"},

  // title - list&title
  {regex: /\|heading 140lne\|2?(timeline|时间线)\|/, replacement: "|title2timeline|"},
  {regex: /\|heading 140lne\|2?(tabs?|标签页?)\||\|title2tabs?\|/, replacement: "|title2c2listdata|c2listdata2tab|"},
  {regex: /\|heading 140lne\|2?(col|分栏)\||\|title2col\|/, replacement: "|title2c2listdata|c2listdata2items|addClass(ab-col)|"},
  {regex: /\|heading 140lne\|2?(card|卡片)\||\|title2card\|/, replacement: "|title2c2listdata|c2listdata2items|addClass(ab-card)|"},
  {regex: /\|heading 140lne\|2?(nodes?|节点)\||\|(title2node|title2abMindmap)\|/, replacement: "|title2listdata|listdata2strict|listdata2nodes|"},

  // list  - 多叉多层树
  {regex: /\|heading 140lne\|2?(flow|流程图)\|/, replacement: "|title2list" + "|list2mermaid|"},
  {regex: /\|heading 140lne\|2?(puml)?(mindmap|脑图|思维导图)\|/, replacement: "|title2list" + "|list2pumlMindmap|"},
  {regex: /\|heading 140lne\|2?(markmap|mdMindmap|md脑图|md思维导图)\|/, replacement: "|title2list" + "|list2markmap|"},
  {regex: /\|heading 140lne\|2?(wbs|(工作)?分解(图|结构))\|/, replacement: "|title2list" + "|list2pumlWBS|"},
  {regex: /\|heading 140lne\|2?(table|multiWayTable|multiCrossTable|表格?|多叉表格?|跨行表格?)\|/, replacement: "|title2list" + "|list2table|"},

  // list - lt树 (属于多层一叉树)
  {regex: /\|heading 140lne\|2?(lt|listTable|treeTable|listGrid|treeGrid|列表格|树形表格?)\|/, replacement: "|title2list" + "|list2lt|"},
  {regex: /\|heading 140lne\|2?(list|列表)\|/, replacement: "|title2list" + "|list2lt|addClass(ab-listtable-likelist)|"},
  {regex: /\|heading 140lne\|2?(dir|dirTree|目录树?|目录结构)\|/, replacement: "|title2list" + "|list2dt|"},

  // list - 二层树
  {regex: /\|heading 140lne\|(fakeList|仿列表)\|/, replacement: "|title2list" + "|list2table|addClass(ab-table-fc)|addClass(ab-table-likelist)|"},
]

// 列表块
const ABAlias_json_list: ABAlias_json_item[] = [
  {regex: "|listXinline|", replacement: "|list2listdata|listdata2list|"},

  // list - list&title
  {regex: /\|list 140lne\|2?(timeline|时间线)\|/, replacement: "|list2timeline|"},
  {regex: /\|list 140lne\|2?(tabs?|标签页?)\||\|list2tabs?\|/, replacement: "|list2c2listdata|c2listdata2tab|"},
  {regex: /\|list 140lne\|2?(col|分栏)\||\|list2col\|/, replacement: "|list2c2listdata|c2listdata2items|addClass(ab-col)|"},
  {regex: /\|list 140lne\|2?(card|卡片)\||\|list2card\|/, replacement: "|list2c2listdata|c2listdata2items|addClass(ab-card)|"},
  {regex: /\|list 140lne\|2?(nodes?|节点)\||\|(list2node|list2abMindmap)\|/, replacement: "|list2listdata|listdata2strict|listdata2nodes|"},

  // list  - 多叉多层树
  {regex: /\|list 140lne\|2?(flow|流程图)\|/, replacement: "|list2mermaid|"},
  {regex: /\|list 140lne\|2?(puml)?(mindmap|脑图|思维导图)\|/, replacement: "|list2pumlMindmap|"},
  {regex: /\|list 140lne\|2?(markmap|mdMindmap|md脑图|md思维导图)\|/, replacement: "|list2markmap|"},
  {regex: /\|list 140lne\|2?(wbs|(工作)?分解(图|结构))\|/, replacement: "|list2pumlWBS|"},
  {regex: /\|list 140lne\|2?(table|multiWayTable|multiCrossTable|表格?|多叉表格?|跨行表格?)\|/, replacement: "|list2table|"},

  // list - lt树 (属于多层一叉树)
  {regex: /\|list 140lne\|2?(lt|listTable|treeTable|listGrid|treeGrid|列表格|树形表格?)\|/, replacement: "|list2lt|"},
  {regex: /\|list 140lne\|2?(list|列表)\|/, replacement: "|list2lt|addClass(ab-listtable-likelist)|"},
  {regex: /\|list 140lne\|2?(dir|dirTree|目录树?|目录结构)\|/, replacement: "|list2dt|"},

  // list - 二层树
  {regex: /\|list 140lne\|(fakeList|仿列表)\|/, replacement: "|list2table|addClass(ab-table-fc)|addClass(ab-table-likelist)|"},
]

// 代码块
const ABAlias_json_code: ABAlias_json_item[] = [
  {regex: "|code 140lne|X|", replacement: "|Xcode|"},
]

// 引用块
const ABAlias_json_quote: ABAlias_json_item[] = [
  {regex: "|quote 140lne|X|", replacement: "|Xquote|"},
]

// 表格块
const ABAlias_json_table: ABAlias_json_item[] = [
]

// 通用，一般是装饰处理器
const ABAlias_json_general: ABAlias_json_item[] = [
  {regex: "|黑幕|", replacement: "|add_class(ab-deco-heimu)|"},
  {regex: "|折叠|", replacement: "|fold|"},
  {regex: "|滚动|", replacement: "|scroll|"},
  {regex: "|超出折叠|", replacement: "|overfold|"},
  // 便捷样式
  {regex: "|红字|", replacement: "|addClass(ab-custom-text-red)|"},
  {regex: "|橙字|", replacement: "|addClass(ab-custom-text-orange)|"},
  {regex: "|黄字|", replacement: "|addClass(ab-custom-text-yellow)|"},
  {regex: "|绿字|", replacement: "|addClass(ab-custom-text-green)|"},
  {regex: "|青字|", replacement: "|addClass(ab-custom-text-cyan)|"},
  {regex: "|蓝字|", replacement: "|addClass(ab-custom-text-blue)|"},
  {regex: "|紫字|", replacement: "|addClass(ab-custom-text-purple)|"},
  {regex: "|白字|", replacement: "|addClass(ab-custom-text-white)|"},
  {regex: "|黑字|", replacement: "|addClass(ab-custom-text-black)|"},
  {regex: "|红底|", replacement: "|addClass(ab-custom-bg-red)|"},
  {regex: "|橙底|", replacement: "|addClass(ab-custom-bg-orange)|"},
  {regex: "|黄底|", replacement: "|addClass(ab-custom-bg-yellow)|"},
  {regex: "|绿底|", replacement: "|addClass(ab-custom-bg-green)|"},
  {regex: "|青底|", replacement: "|addClass(ab-custom-bg-cyan)|"},
  {regex: "|蓝底|", replacement: "|addClass(ab-custom-bg-blue)|"},
  {regex: "|紫底|", replacement: "|addClass(ab-custom-bg-purple)|"},
  {regex: "|白底|", replacement: "|addClass(ab-custom-bg-white)|"},
  {regex: "|黑底|", replacement: "|addClass(ab-custom-bg-black)|"},
  {regex: "|靠上|", replacement: "|addClass(ab-custom-dire-top)|"},
  {regex: "|靠下|", replacement: "|addClass(ab-custom-dire-down)|"},
  {regex: "|靠左|", replacement: "|addClass(ab-custom-dire-left)|"},
  {regex: "|靠右|", replacement: "|addClass(ab-custom-dire-right)|"},
  {regex: "|居中|", replacement: "|addClass(ab-custom-dire-center)|"},
  {regex: "|水平居中|", replacement: "|addClass(ab-custom-dire-hcenter)|"},
  {regex: "|垂直居中|", replacement: "|addClass(ab-custom-dire-vcenter)|"},
  {regex: "|两端对齐|", replacement: "|addClass(ab-custom-dire-justify)|"},
  {regex: "|大字|", replacement: "|addClass(ab-custom-font-large)|"},
  {regex: "|超大字|", replacement: "|addClass(ab-custom-font-largex)|"},
  {regex: "|超超大字|", replacement: "|addClass(ab-custom-font-largexx)|"},
  {regex: "|小字|", replacement: "|addClass(ab-custom-font-small)|"},
  {regex: "|超小字|", replacement: "|addClass(ab-custom-font-smallx)|"},
  {regex: "|超超小字|", replacement: "|addClass(ab-custom-font-smallxx)|"},
  {regex: "|加粗|", replacement: "|addClass(ab-custom-font-bold)|"},
]

export const ABAlias_json_default: ABAlias_json_item[] = [
  ...ABAlias_json_mdit,
  ...ABAlias_json_title,
  ...ABAlias_json_list,
  ...ABAlias_json_code,
  ...ABAlias_json_quote,
  ...ABAlias_json_table,
  ...ABAlias_json_general, // 这个放最后
]

// 暂时只支持在开头处替换
export let ABAlias_json: ABAlias_json_item[] = [
  ...ABAlias_json_default // 设置决定是否停用
]

const ABAlias_json_end: ABAlias_json_item[] = [
  {regex: "|::: 140lne", replacement: ""},
  {regex: "|heading 140lne", replacement: ""},
  {regex: "|list 140lne", replacement: ""},
  {regex: "|code 140lne", replacement: ""},
  {regex: "|qutoe 140lne", replacement: ""},
  {regex: "|table 140lne", replacement: ""},
]
