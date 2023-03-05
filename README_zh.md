中文 | [English](README.md)

# obsidian-any-block

A Obsidian Plugin. You can flexibility to create a 'Block' by some means.
 
## Usage

Function：Block conversion、list to table or other tree graph，See the `demo` sample folder for details

[中文教程和示例库](./demo_zh)

## If bug

~~try to close `strict line wrapping`~~

## Suport command

Look the setup panel or [中文教程和示例库](./demo_zh)

说其中一些比较常用的处理器：
- 列表转表格
- 列表转列表格
- 列表转流程图
- 列表转思维导图
- 列表转标签栏
- 列表转时间线
- 标题转列表从而转其他（can use title2list processor）

![](demo_zh/png/list2table.png)

![](demo_zh/png/list2mdtable.png)

![](demo_zh/png/list2tableT.png)

![](demo_zh/png/list2lt.gif)

![](demo_zh/png/list2tab.gif)

![](demo_zh/png/list2mermaid.png)

![](demo_zh/png/list2mindmap.png)

![](demo_zh/png/titleSelector.png)

![](demo_zh/png/addTitle.png)

![](demo_zh/png/scroll.gif)

![](demo_zh/png/overfold.png)

![](demo_zh/png/flod.gif)

![](demo_zh/png/heimu.gif)

![](demo_zh/png/userProcessor.png)

## support

开发不易，赞助入口（可备注：OB插件support）

![](demo_zh/png/support_zfb.png)![](demo_zh/png/support_wechat.png)


![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22obsidian-any-block%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

## Todo

**(Don't repet it in issue)**

- reinforce
	- 选择器
		- **嵌套选择器**
		  没有嵌套的程序是没有灵魂的 !!!
		  （但问题在于，例如说第一层是tree，可能会破坏结构，有歧义。因为现在的tree格式是number-str的，那需要number-dom才行）
		  （或者说：列表选择器不能嵌套列表选择器有歧义，需要嵌套引用选择器，在此基础上你解除引用选择器间接嵌套）
	- 处理器
		- QA处理器
		- 优化2ultable，在这个模式中让内联换行变成同级换行而非下级换行的意思
	- 层级
		- 负级列表开关
		- 根据层级关系，推荐合理的处理器（如检测到树相关的就推荐树类处理器）
	- 样式
		- 树表格的间隔着色样式获取可以优化
		  方案1：例如多行的格可以视情况使用渐变（单数不用，复数需要，但会不会有不统一的问题）？
		  方案2：仿mindmap的着色，后面的列就不要隔行着色了
	- 转化
		- 右键选择转化为：md原生(表格)/html格式/图片
- fixing bug
	- 复选框列表的兼容、有序列表的兼容
	- **引用块内的列表/列表内的引用块 无法识别**
	- **表格转置与表头符号冲突、转置模式目前是纯css实现的 如果大家的行高不相同，会出现不匹配的情况。**
	  后续会将css实现改进为转化table元素实现

Reference、import

- [html-to-md](https://github.com/stonehank/html-to-md)
- [mermaid](https://github.com/mermaid-js/mermaid)