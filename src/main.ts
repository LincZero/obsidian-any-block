/**
 * 入口文件
 * 
 * 接管三个处理点：
 * - 代码块"ab" (代码块)
 * - cm (实时模式)
 * - 接管渲染后 (渲染/阅读模式)
 */

import { Plugin } from "obsidian";
import { ABReplacer_CodeBlock } from "./ab_selector/abs_code/ABReplacer_CodeBlock";
import { ABStateManager } from "./ab_selector/abs_cm/ABStateManager";
import { ABSelector_PostHtml } from "./ab_selector/abs_html/ABSelector_PostHtml";
import type { ABSettingInterface } from "./config/abSettingTab"
import { ABSettingTab, AB_SETTINGS } from "./config/abSettingTab"


export default class AnyBlockPlugin extends Plugin {
  settings: ABSettingInterface

	async onload() {
    await this.loadSettings();
    this.addSettingTab(new ABSettingTab(this.app, this));

    // 钩子组1 - 代码块
    this.registerMarkdownCodeBlockProcessor("ab", ABReplacer_CodeBlock.processor);
    
    // 钩子组2 - 非渲染模式 cm扩展 - StateField
    {
      let abm: ABStateManager|null
      // 刚启动插件时触发
      this.app.workspace.onLayoutReady(()=>{
        abm?.destructor();
        abm = new ABStateManager(this)
      })
      // 新打开文件，和两个不同的已经打开文件标签页之前切换会触发
      this.registerEvent(
        this.app.workspace.on('file-open', (fileObj) => {
          abm?.destructor();
          abm = new ABStateManager(this)
        })
      )
      // 新打开文件，以及切换聚焦布局触发。修复 Obsidian V1.5.8 导致的bug，之前版本不需要这个
      this.registerEvent(
        this.app.workspace.on('layout-change', () => {
          abm?.destructor();
          abm = new ABStateManager(this)
        })
      )
    }

    // 钩子组3 - 渲染模式 后处理器
    const htmlProcessor = ABSelector_PostHtml.processor.bind(this)
    this.registerMarkdownPostProcessor(htmlProcessor);
  }

  async loadSettings() {
		this.settings = Object.assign({}, AB_SETTINGS, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}

  onunload() {
  }
}
