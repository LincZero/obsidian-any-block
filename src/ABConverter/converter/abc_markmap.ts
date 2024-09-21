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
import type { C2ListItem } from "./abc_c2list";
import { abc_title2listdata } from "./abc_list";
const transformer = new Transformer();
//import { Markmap, loadCSS, loadJS } from 'markmap-view'

const abc_list2mindmap = ABConvert.factory({
id: "list2markmap",
name: "列表到脑图 (markmap)",
process_param: ABConvert_IOEnum.text,
process_return: ABConvert_IOEnum.el,
process: (el, header, content: string): HTMLElement=>{
		list2markmap(content, el)
		return el
	}
})

function list2markmap(markdown: string, div: HTMLDivElement) {
	// 1. markdown解析 (markmap-lib)
	const { root, features } = transformer.transform(markdown.trim()); // 1. transform Markdown
	const assets = transformer.getUsedAssets(features); // 2. get assets (option1)

	// 2. 渲染
	{
		// 1. 四选一。自己渲 (优缺点见abc_mermaid的相似方法)
		// npm mindmap-view 方法
		// // if (assets.styles) loadCSS(assets.styles);
		// // if (assets.scripts) loadJS(assets.scripts, { getMarkmap: () => {} });
		// const mindmaps = document.querySelectorAll('.ab-markmap-svg'); // 注意一下这里的选择器
		// for(const mindmap of mindmaps) {
		//  mindmap.innerHTML = "";
		// 	const datajson: string|null = mindmap.getAttribute('data-json')
		// 	if (datajson === null) { console.error("ab-markmap-svg without data-json") }
		// 	g_markmap = Markmap.create(mindmap as SVGElement, undefined, JSON.parse(datajson as string));
		// };

		// 2. 四选一。这里给环境渲染 (优缺点见abc_mermaid的相似方法)
		// ...

		// 3. 四选一。这里不渲，交给上一层让上一层渲 (优缺点见abc_mermaid的相似方法)
		// 当前mdit使用
		// div.classList.add("ab-raw")
		// div.innerHTML = `<div class="ab-raw-data" type-data="markmap" content-data='${markdown}'></div>`

		// 4. 四选一。纯动态/手动渲染 (优缺点见abc_mermaid的相似方法)。
		// 旧Ob使用，现在Ob的刷新按钮统一放在了外面
		// const svg_btn = document.createElement("button"); div.appendChild(svg_btn); svg_btn.textContent = "ChickMe ReRender Markmap";
		// svg_btn.setAttribute("style", "background-color: argb(255, 125, 125, 0.5)");
		// svg_btn.setAttribute("onclick", `
		// console.log("markmap chick");
		// let script_el = document.querySelector('script[script-id="ab-markmap-script"]');
		// if (script_el) script_el.remove();
		// script_el = document.createElement('script'); document.head.appendChild(script_el);
		// script_el.type = "module";
		// script_el.setAttribute("script-id", "ab-markmap-script");
		// script_el.textContent = \`
		// import { Markmap, } from 'https://jspm.dev/markmap-view';
		// const mindmaps = document.querySelectorAll('.ab-markmap-svg');
		// for(const mindmap of mindmaps) {
		//  mindmap.innerHTML = "";
		// 	Markmap.create(mindmap,null,JSON.parse(mindmap.getAttribute('data-json')));
		// }\``);
		// TODO 似乎是这里导致了`'`符号的异常

		const svg_div = document.createElement("div"); div.appendChild(svg_div);
		let height_adapt = 100 + markdown.split("\n").length*25; // 仅大致估算px: 100 + (0~40)行 * 25 = [200~1000]。如果要准确估计，得自己解析一遍，麻烦
		if (height_adapt>1000) height_adapt = 1000;
		const html_str = `<svg class="ab-markmap-svg" data-json='${JSON.stringify(root)}' style="height: ${height_adapt}px;"></svg>`
		svg_div.innerHTML = html_str
	}

	return div
}
