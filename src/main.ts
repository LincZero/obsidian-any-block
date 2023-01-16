import {
  Plugin,
  Notice,
} from "obsidian";
import { abCodeBlockProcessor } from "./ABCodeBlockProcessor";
import { abEditorExtension } from "./ABEditorExtension";
// import { underlineSelection } from "./ABEditorExtension2";
import { replace2AnyBlock } from "./ABEditorExtension3";
import { abPostProcessor } from "./ABPostProcessor";


export default class AnyBlockPlugin extends Plugin {
  renderFromMD = abCodeBlockProcessor.bind(this); // 不然的话这个方法是没this变量的
	async onload() {
    // 代码块
    this.registerMarkdownCodeBlockProcessor("ab-md", this.renderFromMD);
    
    // 非渲染模式 cm扩展
    this.registerEditorExtension(abEditorExtension(this));
    
    // 渲染模式 后处理器
    this.registerMarkdownPostProcessor(abPostProcessor);

    /*this.addCommand({
			id: 'sample-editor-command-underline',
			name: '下划线',
			editorCallback: (editor: Editor, view: MarkdownView) => {
        // @ts-expect-error, not typed
        const editorView = view.editor.cm as EditorView;
        // console.log(editor.getSelection);
        underlineSelection(editorView)
			}
    })*/
    
    

    this.app.workspace.onLayoutReady(()=>{
      // 当切换文档时应当刷新
      replace2AnyBlock(this)
    })
	}
}
