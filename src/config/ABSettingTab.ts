/**
 * Obsidian 的插件设置页面
 * 
 * TODO：设备Debug日志开关
 */

import {App, PluginSettingTab, Setting, Modal} from "obsidian"
import type AnyBlockPlugin from "../main"
import {ABConvertManager} from "src/ABConverter/ABConvertManager"
import {ABConvert, type ABConvert_SpecUser} from "src/ABConverter/converter/ABConvert"
import {} from "src/ABConverter/converter/abc_text"    // 加载所有处理器和选择器
import {} from "src/ABConverter/converter/abc_list"    // ^
import {} from "src/ABConverter/converter/abc_deco"    // ^
import {} from "src/ABConverter/converter/abc_ex"      // ^
import {} from "src/ABConverter/converter/abc_mermaid" // ^
import {} from "src/ab_manager/abm_cm/ABSelector_MdBase"                // ^
import {generateSelectorInfoTable} from "src/ab_manager/abm_cm/ABSelector_Md"  // ^

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
  is_neg_level: boolean,
  user_processor: ABConvert_SpecUser[]
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
  user_processor: []
}

/** 设置值面板 */
export class ABSettingTab extends PluginSettingTab {
	plugin: AnyBlockPlugin
  processorPanel: HTMLElement
  selectorPanel: HTMLElement

	constructor(app: App, plugin: AnyBlockPlugin) {
		super(app, plugin);
		this.plugin = plugin;
    for (let item of plugin.settings.user_processor){
      ABConvert.factory(item)
    }
	}

	display(): void {
		const {containerEl} = this;
    containerEl.empty();
    let settings = this.plugin.settings

		containerEl.createEl('h2', {text: '范围管理器'});

    this.selectorPanel = generateSelectorInfoTable(containerEl)

    /*containerEl.createEl('h2', {text: '装饰管理器'});

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
      })*/

    containerEl.createEl('h2', {text: '查看所有注册指令'});

    new Setting(containerEl)
      .setName('添加新的注册指令')
      .setDesc('@todo: 添加后要删除或修改请打开data.json文件夹')
      .addButton(component => {
        component
        .setIcon("plus-circle")
        .onClick(e => {
          new ABProcessorModal(this.app, async (result)=>{
            ABConvert.factory(result)
            settings.user_processor.push(result)
            await this.plugin.saveSettings();
            this.processorPanel.remove()
            this.processorPanel = ABConvertManager.getInstance().generateConvertInfoTable(containerEl)
          }).open()
        })
      })
    this.processorPanel = ABConvertManager.getInstance().generateConvertInfoTable(containerEl)
	}
}

class ABProcessorModal extends Modal {
  args: ABConvert_SpecUser
  onSubmit: (args: ABConvert_SpecUser)=>void

  constructor(
    app: App, 
    onSubmit: (args: ABConvert_SpecUser)=>void
  ) {
    super(app);
    this.args = {
      id: "",
      name: "",
      match: "",
      process_alias: ""
    }
    this.onSubmit = onSubmit
  }

  onOpen() {	// onOpen() 方法在对话框打开时被调用，它负责创建对话框中的内容。想要获取更多信息，可以查阅 HTML elements。
    let { contentEl } = this;
    contentEl.setText("自定义处理器");
    new Setting(contentEl)
      .setName("处理器唯一id")
      .setDesc("不与其他处理器冲突即可")
      .addText((text)=>{
        text.onChange((value) => {
          this.args.id = value
        })
      })

    new Setting(contentEl)
      .setName("注册器名字")
      .addText((text)=>{
        text.onChange((value) => {
        this.args.name = value
      })
    })

    new Setting(contentEl)
      .setName("注册器匹配名")
      .setDesc("用/包括起来则表示正则")
      .addText((text)=>{
        text.onChange((value) => {
        this.args.match = value
      })
    })

    new Setting(contentEl)
      .setName("注册器替换为")
      .setDesc("用/包括起来则判断为正则")
      .addText((text)=>{
        text.onChange((value) => {
        this.args.process_alias = value
      })
    })

    new Setting(contentEl)
      .addButton(btn => {
        btn
        .setButtonText("提交")
        .setCta() // 这个不知道什么意思
        .onClick(() => {
          if(this.args.id && this.args.name && this.args.match && this.args.process_alias){
            this.close();
            this.onSubmit(this.args);
          }
        })
      })
  }

  onClose() {	// onClose() 方法在对话框被关闭时调用，它负责清理对话框所占用的资源。
    let { contentEl } = this;
    contentEl.empty();
  }
}
