import { Plugin } from "obsidian";
import { abCodeBlockProcessor } from "./processor/ABCodeBlockProcessor";
// import { abEditorExtension } from "./processor/ABEditorExtension";
// import { underlineSelection } from "./processor/ABEditorExtension2";
import { replace2AnyBlock } from "./processor/ABEditorExtension3";
import { abPostProcessor } from "./processor/ABPostProcessor";


export default class AnyBlockPlugin extends Plugin {
  renderFromMD = abCodeBlockProcessor.bind(this); // 不然的话这个方法是没this变量的
	async onload() {
    // 代码块
    this.registerCodeBlock()

    // 非渲染模式 cm扩展 - ViewPlugin
    //this.registerEditorExtension(abEditorExtension(this));
    
    // 非渲染模式 cm扩展 - StateField
    // 刚开插件时和每次打开文件时都运行
    this.app.workspace.onLayoutReady(()=>{
      replace2AnyBlock(this)
    })
    this.registerEvent(
      this.app.workspace.on('file-open', (fileObj) => {
        console.log("ab-file-open:", fileObj);
        replace2AnyBlock(this)
      })
    );

    // 渲染模式 后处理器
    this.registerMarkdownPostProcessor(abPostProcessor);
  }
  
  /** 代码块 */
  private registerCodeBlock(){
    this.registerMarkdownCodeBlockProcessor("ab-md", this.renderFromMD);
  }
}
