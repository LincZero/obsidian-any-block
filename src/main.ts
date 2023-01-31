import { Plugin } from "obsidian";
import { ABCodeBlockProcessor } from "./manager/abCodeblockManager";
import { ABStateManager } from "./manager/abStateManager";
import { ABPosthtmlManager } from "./manager/abPosthtmlManager";
import { ABSettingInterface, ABSettingTab, AB_SETTINGS } from "./config/ABSettingTab"


export default class AnyBlockPlugin extends Plugin {
  settings: ABSettingInterface
  renderFromMD = ABCodeBlockProcessor.processor.bind(this); // 不然的话这个方法是没this变量的

	async onload() {
    await this.loadSettings();
    this.addSettingTab(new ABSettingTab(this.app, this));

    // 代码块
    this.registerMarkdownCodeBlockProcessor("ab", this.renderFromMD);
    
    // 非渲染模式 cm扩展 - StateField
    // 刚开插件时和每次打开文件时都运行
    this.app.workspace.onLayoutReady(()=>{
      new ABStateManager(this)
    })
    this.registerEvent(
      this.app.workspace.on('file-open', (fileObj) => {
        new ABStateManager(this)
      })
    );

    // 渲染模式 后处理器
    this.registerMarkdownPostProcessor(ABPosthtmlManager.processor);
  }

  async loadSettings() {
		this.settings = Object.assign({}, AB_SETTINGS, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
