import {App, PluginSettingTab, Setting} from "obsidian"
import AnyBlockPlugin from "../main"

/** 设置值接口 */
export interface ABSettingInterface {
  is_range_list: boolean
  is_range_auto: boolean
  is_range_html: boolean
  is_range_brace: boolean
  is_able_source: boolean
  is_able_live: boolean
  is_able_render: boolean
}

/** 设置值默认项 */
export const AB_SETTINGS: ABSettingInterface = {
  is_range_list: true,
  is_range_auto: false,
  is_range_html: false,
  is_range_brace: true,
  is_able_source: false,
  is_able_live: true,
  is_able_render: true,
  
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

		containerEl.createEl('h1', {text: '范围管理器'});

		new Setting(containerEl)
      .setName('自动列表选择器')
      .setDesc('自动选择列表范围，并将类别识别为list')
			.addToggle(component=>
        component
          .setValue(this.plugin.settings.is_range_list)
          .onChange(value=>{this.plugin.settings.is_range_list = value})
      )

    new Setting(containerEl)
      .setName('智能选择器')
      .setDesc('用`%:`选择开头，自动指定结尾')
			.addToggle(component=>
        component
          .setValue(this.plugin.settings.is_range_auto)
          .onChange(value=>{this.plugin.settings.is_range_auto = value})
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
          .setValue(this.plugin.settings.is_range_html)
          .onChange(value=>{this.plugin.settings.is_range_html = value})
          .setDisabled(true)
      )

    new Setting(containerEl)
      .setName('括号标签选择器')
      .setDesc('用`%{`和`%}`选择范围（渲染模式无法工作）')
			.addToggle(component=>
        component
          .setValue(this.plugin.settings.is_range_brace)
          .onChange(value=>{this.plugin.settings.is_range_brace = value})
      )

    containerEl.createEl('h1', {text: '装饰管理器'});
    containerEl.createEl('span', {text: '左侧为线装饰、右侧为块装饰'});

    new Setting(containerEl)
      .setName('源码模式中启用')
      .setDesc('推荐：关/开、关')
			.addToggle(component=>
        component
          .setValue(this.plugin.settings.is_able_source)
          .onChange(value=>{this.plugin.settings.is_able_source = value})
      )
      .addToggle(component=>
        component
          .setValue(this.plugin.settings.is_able_source)
          .onChange(value=>{this.plugin.settings.is_able_source = value})
      )

    new Setting(containerEl)
      .setName('实时模式中启用')
      .setDesc('推荐：关/开、关/开')
			.addToggle(component=>
        component
          .setValue(this.plugin.settings.is_able_live)
          .onChange(value=>{this.plugin.settings.is_able_live = value})
      )
      .addToggle(component=>
        component
          .setValue(this.plugin.settings.is_able_live)
          .onChange(value=>{this.plugin.settings.is_able_live = value})
      )

    new Setting(containerEl)
      .setName('渲染模式中启用')
      .setDesc('推荐：关、开')
			.addToggle(component=>
        component
          .setValue(this.plugin.settings.is_able_render)
          .onChange(value=>{this.plugin.settings.is_able_render = value})
      )
      .addToggle(component=>
        component
          .setValue(this.plugin.settings.is_able_render)
          .onChange(value=>{this.plugin.settings.is_able_render = value})
      )
	}
}
