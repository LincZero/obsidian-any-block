import {
  Plugin,
	Notice
} from "obsidian";
import { abCodeBlockProcessor } from "./ABCodeBlockProcessor";
import { editorExtension } from "./ABEditorExtension";

export default class AnyBlockPlugin extends Plugin {
  renderFromMD = abCodeBlockProcessor.bind(this); // 不然的话这个方法是没this变量的
  
	async onload() {
    this.registerMarkdownCodeBlockProcessor("ab-md", this.renderFromMD);
		
    this.registerEditorExtension(editorExtension(this));
    
    // this.registerMarkdownPostProcessor(this.processTextSection);
	}
}
