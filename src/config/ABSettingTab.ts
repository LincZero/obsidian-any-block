import {App, PluginSettingTab, Setting} from "obsidian"
import AnyBlockPlugin from "../main"

/** 设置值接口 */
export interface ABSettingInterface {
  select_list: ConfSelect
  select_quote: ConfSelect
  select_code: ConfSelect
  //is_range_html: boolean
  //is_range_brace: boolean
  decoration_source: ConfDecoration
  decoration_live: ConfDecoration
  decoration_render: ConfDecoration
}
export enum ConfSelect{
  no = "no",
  ifhead = "ifhead",
  yes = "yes"
}
export enum ConfDecoration{
  none = "none",
  inline = "inline",
  block = "block"
}

/** 设置值默认项 */
export const AB_SETTINGS: ABSettingInterface = {
  select_list: ConfSelect.yes,
  select_quote: ConfSelect.ifhead,
  select_code: ConfSelect.ifhead,
  decoration_source: ConfDecoration.none,
  decoration_live: ConfDecoration.block,
  decoration_render: ConfDecoration.block,
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
    let settings = this.plugin.settings

		containerEl.createEl('h1', {text: '范围管理器'});

		new Setting(containerEl)
      .setName('列表选择器')  // 不识别、无头部标签也识别、仅识别有头部标签
      .setDesc('')
			.addDropdown((component)=>{
        component
        .addOption(ConfSelect.no, "不识别")
        .addOption(ConfSelect.ifhead, "仅识别有头部声明")
        .addOption(ConfSelect.yes, "总是识别")
        .setValue(settings.select_list)
        .onChange(v=>{
          // @ts-ignore 这里ConfSelect必然包含v值的
          settings.select_list = ConfSelect[v]     
        })
      })

    new Setting(containerEl)
      .setName('引用块选择器')
      .setDesc('')
      .addDropdown((component)=>{
        component
        .addOption(ConfSelect.no, "不识别")
        .addOption(ConfSelect.ifhead, "仅识别有头部声明")
        .addOption(ConfSelect.yes, "总是识别")
        .setValue(settings.select_quote)
        .onChange(v=>{
          // @ts-ignore 这里ConfSelect必然包含v值的
          settings.select_quote = ConfSelect[v]     
        })
      })

    new Setting(containerEl)
      .setName('代码块选择器')
      .setDesc('')
			.addDropdown((component)=>{
        component
        .addOption(ConfSelect.no, "不识别")
        .addOption(ConfSelect.ifhead, "仅识别有头部声明")
        .addOption(ConfSelect.yes, "总是识别")
        .setValue(settings.select_code)
        .onChange(v=>{
          // @ts-ignore 这里ConfSelect必然包含v值的
          settings.select_code = ConfSelect[v]     
        })
      })

    /*new Setting(containerEl)
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
      )*/

    containerEl.createEl('h1', {text: '装饰管理器'});

    new Setting(containerEl)
      .setName('源码模式中启用')
      .setDesc('推荐：不启用')
			.addDropdown((component)=>{
        component
        .addOption(ConfDecoration.none, "不启用")
        .addOption(ConfDecoration.inline, "仅启用线装饰")
        .addOption(ConfDecoration.block, "启用块装饰")
        .setValue(settings.decoration_source)
        .onChange(v=>{
          // @ts-ignore 这里枚举必然包含v值的
          settings.decoration_source = ConfDecoration[v]     
        })
      })

    new Setting(containerEl)
      .setName('实时模式中启用')
      .setDesc('推荐：启用块装饰/线装饰')
			.addDropdown((component)=>{
        component
        .addOption(ConfDecoration.none, "不启用")
        .addOption(ConfDecoration.inline, "仅启用线装饰")
        .addOption(ConfDecoration.block, "启用块装饰")
        .setValue(settings.decoration_live)
        .onChange(v=>{
          // @ts-ignore 这里枚举必然包含v值的
          settings.decoration_live = ConfDecoration[v]     
        })
      })

    new Setting(containerEl)
      .setName('渲染模式中启用')
      .setDesc('推荐：启用块装饰')
			.addDropdown((component)=>{
        component
        .addOption(ConfDecoration.none, "不启用")
        .addOption(ConfDecoration.block, "启用块装饰")
        .setValue(settings.decoration_render)
        .onChange(v=>{
          // @ts-ignore 这里枚举必然包含v值的
          settings.decoration_render = ConfDecoration[v]     
        })
      })
	}
}
