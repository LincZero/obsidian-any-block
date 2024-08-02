/**
 * AB转换器 - markmap相关
 * 
 * (可选) 参考：在Ob插件中增加1.3MB
 * 
 * 局部渲染问题
 *     markmap是那种一个markdown文件渲染一个mindmap的类型，和我要局部渲染的不同。
 *     调用api得到的html_str是包含 `<html>`、`<script>` 的，没法作用在局部div上。
 *     然后我就想找一个有局部渲染mindmap的去参考：
 *     https://github.com/aleen42/gitbook-mindmaps/blob/master/src/mindmaps.js
 *     https://github.com/deiv/markdown-it-markmap/blob/master/src/index.js
 *		 https://github.com/NeroBlackstone/markdown-it-mindmap/blob/main/index.js
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
		list2mindmap(content, el)
		return el
	}
})

function list2mindmap(markdown: string, div: HTMLDivElement) {
	// 1. markdown解析 (markmap-lib)
	const { root, features } = transformer.transform(markdown.trim()); // 1. transform Markdown
	const assets = transformer.getUsedAssets(features); // 2. get assets (option1)
	
	// 2. html元素创建
	const html_str = `<svg class="ab-markmap-svg" data-json='${JSON.stringify(root)}' style="width: 100%; height: 400px; border-style: double;"></svg>`
	div.innerHTML = html_str

	// 3. 渲染 - 用奇怪的方式实现但意外地成功了的版
	let script_el: HTMLScriptElement|null = document.querySelector('script[script-id="ab-markmap-script"]');
	if (script_el) script_el.remove();
	script_el = document.createElement('script'); document.head.appendChild(script_el);
	script_el.type = "module";
	script_el.setAttribute("script-id", "ab-markmap-script");
	script_el.textContent = `
	import { Markmap, } from 'https://jspm.dev/markmap-view';
	const mindmaps = document.querySelectorAll('.ab-markmap-svg'); // 注意一下这里的选择器
	for(const mindmap of mindmaps) {
		Markmap.create(mindmap,null,JSON.parse(mindmap.getAttribute('data-json')));
	}`;

	// 3. 渲染 - 正经方法，但失效
	// // if (assets.styles) loadCSS(assets.styles);
	// // if (assets.scripts) loadJS(assets.scripts, { getMarkmap: () => {} });
	// const mindmaps = document.querySelectorAll('.ab-markmap-svg'); // 注意一下这里的选择器
	// for(const mindmap of mindmaps) {
	// 	const datajson: string|null = mindmap.getAttribute('data-json')
	// 	if (datajson === null) { console.error("ab-markmap-svg without data-json") }
	// 	g_markmap = Markmap.create(mindmap as SVGElement, undefined, JSON.parse(datajson as string));
	// };

	// 3. 渲染 - 正经方法，但失效
	// const script_el = document.createElement('script'); document.head.appendChild(script_el);
	// script_el.type = "module";
	// script_el.textContent = `
	// window.refresh = function() {
	// 	import { Markmap, } from 'https://jspm.dev/markmap-view';
	// 	const mindmaps = document.querySelectorAll('.ab-markmap-svg'); // 注意一下这里的选择器
	// 	for(const mindmap of mindmaps) {
	// 		Markmap.create(mindmap,null,JSON.parse(mindmap.getAttribute('data-json')));
	// 	}
	// 	console.log("方法555")
	// }
	// window.refresh()`;
}
