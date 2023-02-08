import {App, PluginSettingTab, Setting} from "obsidian"
import AnyBlockPlugin from "../main"
import {generateInfoTable} from "src/replace/abProcessor"

/** 设置值接口 */
export interface ABSettingInterface {
  select_list: ConfSelect
  select_quote: ConfSelect
  select_code: ConfSelect
  select_heading: ConfSelect
  select_brace: ConfSelect
  //is_range_html: boolean
  //is_range_brace: boolean
  decoration_source: ConfDecoration
  decoration_live: ConfDecoration
  decoration_render: ConfDecoration
  is_neg_level: boolean
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
  select_list: ConfSelect.ifhead,
  select_quote: ConfSelect.ifhead,
  select_code: ConfSelect.ifhead,
  select_heading: ConfSelect.ifhead,
  select_brace: ConfSelect.yes,
  decoration_source: ConfDecoration.none,
  decoration_live: ConfDecoration.block,
  decoration_render: ConfDecoration.block,
  is_neg_level: false,
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
      .setName('列表选择器')
      .setDesc('')
			.addDropdown((component)=>{
        component
        .addOption(ConfSelect.no, "不识别")
        .addOption(ConfSelect.ifhead, "仅识别有头部声明")
        .addOption(ConfSelect.yes, "总是识别")
        .setValue(settings.select_list)
        .onChange(async v=>{
          // @ts-ignore 这里ConfSelect必然包含v值的
          settings.select_list = ConfSelect[v]     
          await this.plugin.saveSettings(); 
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
        .onChange(async v=>{
          // @ts-ignore 这里ConfSelect必然包含v值的
          settings.select_quote = ConfSelect[v]    
          await this.plugin.saveSettings();  
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
        .onChange(async v=>{
          // @ts-ignore 这里ConfSelect必然包含v值的
          settings.select_code = ConfSelect[v]     
          await this.plugin.saveSettings(); 
        })
      })

    new Setting(containerEl)
      .setName('标题层级选择器')
      .setDesc(createFragment(el => {
        el.createEl("strong", {
          text: "全局选择器"
        });
      }))
			.addDropdown((component)=>{
        component
        .addOption(ConfSelect.no, "不识别")
        .addOption(ConfSelect.ifhead, "仅识别有头部声明")
        .setValue(settings.select_heading)
      })
      
    new Setting(containerEl)
      .setName('首尾范围选择器')
      .setDesc(createFragment(el => {
        el.createEl("strong", {
          text: "全局选择器"
        });
      }))
			.addDropdown((component)=>{
        component
        .addOption(ConfSelect.no, "不识别")
        .addOption(ConfSelect.yes, "总是识别")
        .setValue(settings.select_brace)
        .onChange(async v=>{
          // @ts-ignore 这里ConfSelect必然包含v值的
          settings.select_brace = ConfSelect[v]   
          await this.plugin.saveSettings();   
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
        .onChange(async v=>{
          // @ts-ignore 这里枚举必然包含v值的
          settings.decoration_source = ConfDecoration[v]  
          await this.plugin.saveSettings();    
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
        .onChange(async v=>{
          // @ts-ignore 这里枚举必然包含v值的
          settings.decoration_live = ConfDecoration[v]
          await this.plugin.saveSettings(); 
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
        .onChange(async v=>{
          // @ts-ignore 这里枚举必然包含v值的
          settings.decoration_render = ConfDecoration[v]    
          await this.plugin.saveSettings(); 
        })
      })

    containerEl.createEl('h1', {text: '实验性功能'});
    new Setting(containerEl)
      .setName('启用负级列表')
      .setDesc(createFragment(div => {
        div.createSpan({text: "用"});
        div.createEl("code", {text: "< "});
        div.createSpan({text: "来表示负级列表。重复则叠加层级"});
      }))
			.addToggle(component=>
        component
          .setValue(this.plugin.settings.is_neg_level)
          .onChange(value=>{this.plugin.settings.is_neg_level = value})
      )
      .setDisabled(true)

    containerEl.createEl('h1', {text: '查看所有注册指令'});
    generateInfoTable(containerEl)
	}
}