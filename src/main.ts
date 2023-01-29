import { Plugin } from "obsidian";
import { abCodeBlockProcessor } from "./processor/ABCodeBlockProcessor";
// import { abEditorExtension } from "./processor/ABEditorExtension";
// import { underlineSelection } from "./processor/ABEditorExtension2";
import { Replace2AnyBlock } from "./processor/ABEditorExtension3";
import { abPostProcessor } from "./processor/ABPostProcessor";
import { ABSettingInterface, ABSettingTab, AB_SETTINGS } from "./config/ABSettingTab"


export default class AnyBlockPlugin extends Plugin {
  settings: ABSettingInterface
  renderFromMD = abCodeBlockProcessor.bind(this); // 不然的话这个方法是没this变量的

	async onload() {
    await this.loadSettings();
    this.addSettingTab(new ABSettingTab(this.app, this));

    // 代码块
    this.registerMarkdownCodeBlockProcessor("ab-md", this.renderFromMD);

    // 非渲染模式 cm扩展 - ViewPlugin
    //this.registerEditorExtension(abEditorExtension(this));
    
    // 非渲染模式 cm扩展 - StateField
    // 刚开插件时和每次打开文件时都运行
    this.app.workspace.onLayoutReady(()=>{
      new Replace2AnyBlock(this)
    })
    this.registerEvent(
      this.app.workspace.on('file-open', (fileObj) => {
        new Replace2AnyBlock(this)
      })
    );

    // 渲染模式 后处理器
    this.registerMarkdownPostProcessor(abPostProcessor);
  }

  async loadSettings() {
		this.settings = Object.assign({}, AB_SETTINGS, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
