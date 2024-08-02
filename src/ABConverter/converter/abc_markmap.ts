/**
 * AB转换器 - markmap相关
 * 
 * (可选) 参考：在Ob插件中增加1.3MB
 * 
 * 使用注意项：本文件搜索 `markmap渲染`，然后根据该注释在你的主代码中添加一部分代码
 * 
 * 模块化难点，这个插件极难模块化
 * 1. 内容不全体现在局部，局部渲染问题
 *     markmap是那种一个markdown文件渲染一个mindmap的类型，和我要局部渲染的不同。
 *     调用api得到的html_str是包含 `<html>`、`<script>` 的，没法作用在局部div上。
 *     然后我就想找一个有局部渲染mindmap的去参考：
 *     https://github.com/aleen42/gitbook-mindmaps/blob/master/src/mindmaps.js
 *     https://github.com/deiv/markdown-it-markmap/blob/master/src/index.js
 *		 https://github.com/NeroBlackstone/markdown-it-mindmap/blob/main/index.js
 * 2. 渲染时间若交由每个mindmap块处理一次则会出现重复渲染及慢的问题。这里提供了一个btn手动渲染，而要自动渲染：
 *    - 在Ob环境，需要在文章渲染完时出一个钩子调用 `Markmap.create`
 *    - 在VuePress-Mdit环境，没有真正的document元素，而打开文件的钩子在mdit里面又没有，可能需要要vuepress插件解决
 */

import {ABConvert_IOEnum, ABConvert, type ABConvert_SpecSimp} from "./ABConvert"
import {ABConvertManager} from "../ABConvertManager"
import {ListProcess, type List_ListItem} from "./abc_list"
import {ABReg} from "../ABReg"

/**
 * 生成一个随机id
 * 
 * @detail 因为mermaid渲染块时需要一个id，不然多个mermaid块会发生冲突
 */
function getID(length=16){
	return Number(Math.random().toString().substr(3,length) + Date.now()).toString(36);
}

// markmap about
import { Transformer, builtInPlugins } from 'markmap-lib'
const transformer = new Transformer();
//import { Markmap, loadCSS, loadJS } from 'markmap-view'

const abc_list2mindmap = ABConvert.factory({
id: "list2markmap",
name: "标题到脑图 (markmap)",
process_param: ABConvert_IOEnum.text,
process_return: ABConvert_IOEnum.el,
process: (el, header, content)=>{
		content = ListProcess.title2list(content, el)
		list2markmap(content, el)
		return el
	}
})

function list2markmap(markdown: string, div: HTMLDivElement) {
	// 1. markdown解析 (markmap-lib)
	const { root, features } = transformer.transform(markdown.trim()); // 1. transform Markdown
	const assets = transformer.getUsedAssets(features); // 2. get assets (option1)

	// (可选) 手动渲染按钮
	const svg_btn = document.createElement("button"); div.appendChild(svg_btn); svg_btn.textContent = "ChickMe ReRender Markmap";
  svg_btn.setAttribute("style", "background-color: argb(255, 125, 125, 0.5)");
  svg_btn.setAttribute("onclick", `console.log("svg chick"); let script_el = document.querySelector('script[script-id="ab-markmap-script"]');
	if (script_el) script_el.remove();
	script_el = document.createElement('script'); document.head.appendChild(script_el);
	script_el.type = "module";
	script_el.setAttribute("script-id", "ab-markmap-script");
	script_el.textContent = \`
	import { Markmap, } from 'https://jspm.dev/markmap-view';
	const mindmaps = document.querySelectorAll('.ab-markmap-svg');
	for(const mindmap of mindmaps) {
		Markmap.create(mindmap,null,JSON.parse(mindmap.getAttribute('data-json')));
	}\``);
	
	// 2. html元素创建 (注意一下类名要被捕抓的)
	const svg_div = document.createElement("div"); div.appendChild(svg_div);
	const html_str = `<svg class="ab-markmap-svg" data-json='${JSON.stringify(root)}' style="width: 100%; height: 400px; border-style: double;"></svg>`
	svg_div.innerHTML = html_str

	// 3. markmap渲染 (本来打算模块化解决，但不行。若在ob环境，则在打开完文件的钩子/CM结束时触发一次下面代码)
	{
		// 1. script插入方式，可成功
		// let script_el: HTMLScriptElement|null = document.querySelector('script[script-id="ab-markmap-script"]');
		// if (script_el) script_el.remove();
		// script_el = document.createElement('script'); document.head.appendChild(script_el);
		// script_el.type = "module";
		// script_el.setAttribute("script-id", "ab-markmap-script");
		// script_el.textContent = `
		// import { Markmap, } from 'https://jspm.dev/markmap-view';
		// const mindmaps = document.querySelectorAll('.ab-markmap-svg'); // 注意一下这里的选择器
		// for(const mindmap of mindmaps) {
		// 	Markmap.create(mindmap,null,JSON.parse(mindmap.getAttribute('data-json')));
		// }`;

		// 2. npm mindmap-view 方法，失败
		// // if (assets.styles) loadCSS(assets.styles);
		// // if (assets.scripts) loadJS(assets.scripts, { getMarkmap: () => {} });
		// const mindmaps = document.querySelectorAll('.ab-markmap-svg'); // 注意一下这里的选择器
		// for(const mindmap of mindmaps) {
		// 	const datajson: string|null = mindmap.getAttribute('data-json')
		// 	if (datajson === null) { console.error("ab-markmap-svg without data-json") }
		// 	g_markmap = Markmap.create(mindmap as SVGElement, undefined, JSON.parse(datajson as string));
		// };

		// 3. script提供全局方法，失败
		// const script_el = document.createElement('script'); document.head.appendChild(script_el);
		// script_el.type = "module";
		// script_el.textContent = `
		// window.refresh = function() {
		// 	import { Markmap, } from 'https://jspm.dev/markmap-view';
		// 	const mindmaps = document.querySelectorAll('.ab-markmap-svg'); // 注意一下这里的选择器
		// 	for(const mindmap of mindmaps) {
		// 		Markmap.create(mindmap,null,JSON.parse(mindmap.getAttribute('data-json')));
		// 	}
		// }
		// window.refresh()`;
	}
}
