import { Plugin } from "obsidian";
import { ABCodeblockManager } from "./manager3/abCodeblockManager";
import { ABStateManager } from "./manager/abStateManager";
import { ABPosthtmlManager } from "./manager2/abPosthtmlManager";
import type { ABSettingInterface } from "./config/abSettingTab"
import { ABSettingTab, AB_SETTINGS } from "./config/abSettingTab"


export default class AnyBlockPlugin extends Plugin {
  settings: ABSettingInterface

	async onload() {
    await this.loadSettings();
    this.addSettingTab(new ABSettingTab(this.app, this));

    // 代码块
    this.registerMarkdownCodeBlockProcessor("ab", ABCodeblockManager.processor);
    
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
    const htmlProcessor = ABPosthtmlManager.processor.bind(this)
    this.registerMarkdownPostProcessor(htmlProcessor);
  }

  async loadSettings() {
		this.settings = Object.assign({}, AB_SETTINGS, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
