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
//import { fillTemplate } from 'markmap-render';
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
	//const s1 = document.createElement('script'); document.head.appendChild(s1);
	//s1.src = "https://cdn.jsdelivr.net/npm/d3";
	const s2 = document.createElement('script'); document.head.appendChild(s2);
	s2.type = "module";
	s2.textContent = `
	import { Markmap, } from 'https://jspm.dev/markmap-view';
	const mindmaps = document.querySelectorAll('.ab-markmap-svg'); // 注意一下这里的选择器
	for(const mindmap of mindmaps) {
		Markmap.create(mindmap,null,JSON.parse(mindmap.getAttribute('data-json')));
	}`;

	const id = "ab-markmap-" + getID();

	// markmap-lib
	// 1. transform Markdown
	const { root, features } = transformer.transform(markdown.trim());
	// 2. get assets (option1)
	const assets = transformer.getUsedAssets(features);
	
	const html_str = `<svg class="ab-markmap-svg ${id}" data-json='${JSON.stringify(root)}' style="width: 100%; height: 400px; border-style: double;"></svg>`
	div.innerHTML = html_str

	// markmap-render，生成出来的是 `<html><body><style>` 这种类型
	//const html_str = fillTemplate(root, assets);
	// markmap-view
	// 1. load assets
	//if (assets.styles) loadCSS(assets.styles);
	//if (assets.scripts) loadJS(assets.scripts, { getMarkmap: () => {} });
	// 2. create markmap
	//const markmap = Markmap.create("ab-markmap-"+getID(), undefined, root)
}
