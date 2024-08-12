# README

## Lightspot (亮点)

This is a **【Syntax free, Extensible、Powerful and flexible、Multi-platform】** Markdown block extension rendering plugin

（这是一个 **【无语法、可扩展、灵活强大、多平台】** 的 Markdown 块扩展渲染插件）

- Syntax free (无语法)
    - No new syntax、Syntax-free intrusion (没有新语法、没有语法入侵)
	- 这也导致没有过度的插件依赖。我认为好的插件不应该导致 —— 当你用了一段时间插件后，离开该插件会导致原来的内容变形，不可读或维护
- Extensible (可扩展性)
    - Facilitate secondary development （插件方便二次开发）
- Powerful and flexible (灵活且强大)
    - 选择器：选择范围灵活，六种方式，简单易用
	- 处理器：丰富多样、功能强大、扩展性强
- Multi-platform (多平台)
    - Obsidian
	- Blogs such as vuepress/vitepress that support markdown-it parsing
	- V3版本重构并迁移到markdown-it插件，可以使Obsidian和你发布的VuePress/VitePress保持高度一致性（至于在VuePress上的效果如何，可以点击上面的第一个链接查看）

## Multi-Language (多语言)

- en
	- Language issues: Documentation is multilingual (en /en), don't worry
	- Alternate site links：When the website link to this article fails, try replacing `linczero.github.io` with `linczero-github-io.pages.dev` in the url
- zh
	- 语言问题：文档是多语言的（zh/en），不用担心
	- 备用网站链接：如果网站失效，则将网站链接部分的 `linczero.github.io` 替换成 `linczero-github-io.pages.dev` 就可以了
	  （**本文的默认网站链接指向 github.io，如果国内有不能访问的朋友，那么大概率需要做这一步**）

## More Links (相关链接)

- en
	- Related links：tutorial、use skill、contribution、secondary development
	- [Online Wiki - github.io](https://linczero.github.io/MdNote_Public/ProductDoc/AnyBlock/)
	- [Online Effects warrior - github.io](https://linczero.github.io/MdNote_Public/ProductDoc/AnyBlock/README.show.md)
- zh
	- 相关链接：教程、使用技能、贡献、二次开发
	- [在线文档 - github.io](https://linczero.github.io/MdNote_Public/ProductDoc/AnyBlock/)
	- [在线效果展示 - github.io](https://linczero.github.io/MdNote_Public/ProductDoc/AnyBlock/README.show.md)

## Effects warrior (效果展示)

`multiWay table`/`multiCross table`/`Cross table` (`多叉表格`/`跨行表格`)

![](./docs/zh/png/Pasted%20image%2020240808202548.png)

![](./docs/zh/png/Pasted%20image%2020240808203055.png)

`ListTable`/`TreeTable`/`TreeGrid` (`列表格`/`树型表格`)

![](./docs/zh/png/Pasted%20image%2020240808203143.png)

Optimized list (优化列表)

The essence is "listtable" based on the addition of a mock list style (本质是 "列表格" 的基础上增加仿列表样式)

![](./docs/zh/png/listtable_likelist.png)

Dir Tree (目录树)

The essence is "listtable" based on the addition of imitation directory style (本质是"列表格"的基础上增加仿目录样式)

![](./docs/zh/png/Pasted%20image%2020240808203216.png)

ASCII Dir Tree (ascii 目录树) 

![](./docs/zh/png/Pasted%20image%2020240808203232.png)

  WBS (Work Breakdown Structure, 工作分解结构)

![](./docs/zh/png/Pasted%20image%2020240808203252.png)

timeline (时间线)

![](./docs/zh/png/Pasted%20image%2020240808203455.png)

tabs & card (标签页和卡片)

![](./docs/zh/png/tag%20and%20card.png)

mermaid flow (mermaid流程图)

![](./docs/zh/png/Pasted%20image%2020240808203517.png)

plantuml mindmap (plantuml 思维导图)

![](./docs/zh/png/Pasted%20image%2020240808203534.png)

markmap mindmap (markmap 思维导图)

![](./docs/zh/png/Pasted%20image%2020240808203605.png)

mermaid mindmap (mermaid 思维导图)

![](./docs/zh/png/Pasted%20image%2020240808203621.png)

[more……](https://linczero.github.io/MdNote_Public/%E4%BA%A7%E5%93%81%E6%96%87%E6%A1%A3/AnyBlock/)

## Effects warrior - old (旧效果展示)

Here are some of the more common processors:
- list2table  (2datatable)
- list2listtable
- list2mermaid  (graph LR)
- list2mindmap  (mermaid v9.3.0 mindmap)
- list2tab
- list2timeline
- title2list + list2somthing

![](./docs/zh/png/list2table.png)

![](./docs/zh/png/list2tableT.png)

![](./docs/zh/png/list2lt.gif)
 
![](./docs/zh/png/list2tab.gif)
 
![](./docs/zh/png/list2mermaid.png)

![](./docs/zh/png/list2mindmap.png)

![](./docs/zh/png/titleSelector.png)

![](./docs/zh/png/addTitle.png)

![](./docs/zh/png/scroll.gif)
 
![](./docs/zh/png/overfold.png)

![](./docs/zh/png/flod.gif)

![](./docs/zh/png/heimu.gif)

![](./docs/zh/png/userProcessor.png)
