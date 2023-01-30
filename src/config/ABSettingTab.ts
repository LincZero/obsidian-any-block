import {App, PluginSettingTab, Setting} from "obsidian"
import AnyBlockPlugin from "../main"

/** 设置值接口 */
export interface ABSettingInterface {
  bool_range_list: boolean
  bool_range_auto: boolean
  bool_range_html: boolean
  bool_range_brace: boolean
  bool_deco_block: boolean
}

/** 设置值默认项 */
export const AB_SETTINGS: ABSettingInterface = {
  bool_range_list: true,
  bool_range_auto: false,
  bool_range_html: false,
  bool_range_brace: true,
  bool_deco_block: true
}

/** 设置值面板 */
export class ABSettingTab extends PluginSettingTab {
	plugin: AnyBlockPlugin;

	constructor(app: App, plugin: AnyBlockPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: '范围选择器'});

		new Setting(containerEl)
      .setName('自动列表选择器')
      .setDesc('自动选择列表范围，并将类别识别为list')
			.addToggle(component=>
        component
          .setValue(this.plugin.settings.bool_range_list)
          .onChange(value=>{this.plugin.settings.bool_range_list = value})
      )

    new Setting(containerEl)
      .setName('智能选择器')
      .setDesc('用`%:`选择开头，自动指定结尾')
			.addToggle(component=>
        component
          .setValue(this.plugin.settings.bool_range_auto)
          .onChange(value=>{this.plugin.settings.bool_range_auto = value})
      )

    new Setting(containerEl)
      .setName('html标签选择器')
      .setDesc(
        createFragment(e => {
          const div:HTMLDivElement = e.createDiv()
          div.createSpan({text: "用"});
          div.createEl("code", {text: "`<ab>`"});
          div.createSpan({text: "和"});
          div.createEl("code", {text: "`</ab>`"});
          div.createSpan({text: "选择范围"});
          div.createEl("strong", {text: "（功能还没做，暂时无效）"});
        })
      )
			.addToggle(component=>
        component
          .setValue(this.plugin.settings.bool_range_html)
          .onChange(value=>{this.plugin.settings.bool_range_html = value})
          .setDisabled(true)
      )

    new Setting(containerEl)
      .setName('括号标签选择器')
      .setDesc('用`%{`和`%}`选择范围（渲染模式无法工作）')
			.addToggle(component=>
        component
          .setValue(this.plugin.settings.bool_range_brace)
          .onChange(value=>{this.plugin.settings.bool_range_brace = value})
      )

    containerEl.createEl('h2', {text: '装饰器'});

    new Setting(containerEl)
      .setName('块装饰器')
      .setDesc('用块替换范围选择器的选择范围')
			.addToggle(component=>
        component
          .setValue(this.plugin.settings.bool_deco_block)
          .onChange(value=>{this.plugin.settings.bool_deco_block = value})
      )
	}
}
