/**
 * Obsidian 的插件设置页面
 * 
 * TODO：设备Debug日志开关
 */

import {App, PluginSettingTab, Setting, Modal} from "obsidian"
import type AnyBlockPlugin from "../main"
import {ABConvertManager} from "src/ABConverter/ABConvertManager"
import {ABConvert, type ABConvert_SpecUser} from "src/ABConverter/converter/ABConvert"
import { ABAlias_json } from "src/ABConverter/ABAlias"

// 加载所有选择器
import {} from "src/ab_manager/abm_cm/ABSelector_MdBase"
import {generateSelectorInfoTable} from "src/ab_manager/abm_cm/ABSelector_Md"

/** 设置值接口 */
export interface ABSettingInterface {
  // 选择器模块部分
  select_list: ConfSelect           // 是否启用list选择器
  select_quote: ConfSelect          // 是否启用quote选择器
  select_code: ConfSelect           // 是否启用code选择器
  select_heading: ConfSelect        // 是否启用heading选择器
  select_brace: ConfSelect          // 是否启用brace选择器
  decoration_source: ConfDecoration // 是否在源码模式中启用
  decoration_live: ConfDecoration   // 是否在实时模式中启用
  decoration_render: ConfDecoration // 是否在阅读模式中启用
  is_neg_level: boolean,            // 是否使用负标题标志 `<` (其实是还没做出来)

  // 别名模块部分
  alias_use_default: true,              // 使用默认的别名预设 (可以为了性能优化而关掉)
  alias_user: {                         // 别名系统 (V3.0.8提供)，用户定义的别名 (不包含自带的)
    regex: string,
    replacement: string
  }[],
  user_processor: ABConvert_SpecUser[],  // 别名系统 (旧)，用户自定义的别名处理器

  // 其他
  is_debug: boolean                 // 是否开启调试打印 (未启用，思考:是否每个模块单独有is_debug开关)
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

// 当前设置值 (有默认项)
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

  alias_use_default: true,
  alias_user: [ // 仅给一个默认示例
    {
      "regex": "|alias_demo|",
      "replacement": "|addClass(ab-custom-text-red)|addClass(ab-custom-bg-blue)|"
    },
    {
      "regex": "/\\|alias_reg_demo\\|/",
      "replacement": "|addClass(ab-custom-text-red)|addClass(ab-custom-bg-blue)|"
    },
  ],
  user_processor: [{ // 仅给一个默认示例
    "id": "alias2_demo",
    "name": "alias2_demo",
    "match": "alias2_demo",
    "process_alias": "|addClass(ab-custom-text-blue)|addClass(ab-custom-bg-red)|"
  }],

  is_debug: false
}

/** 设置值面板 */
export class ABSettingTab extends PluginSettingTab {
	plugin: AnyBlockPlugin
  processorPanel: HTMLElement
  selectorPanel: HTMLElement

	constructor(app: App, plugin: AnyBlockPlugin) {
		super(app, plugin);
		this.plugin = plugin;

    // 别名模块加载自定义别名
    //   新版
    for (let item of plugin.settings.alias_user){
      let newReg: string|RegExp;
      if (/^\/.*\/$/.test(item.regex)) {
        newReg = new RegExp(item.regex.slice(1,-1)) // 去除两侧的`/`并变回regExp
      } else {
        newReg = item.regex
      }
      ABAlias_json.push({
        regex: newReg,
        replacement: item.replacement
      })
    }
    //   旧版
    for (let item of plugin.settings.user_processor){
      ABConvert.factory(item)
    }
	}

	display(): void {
		const {containerEl} = this;
    containerEl.empty();
    let settings = this.plugin.settings
    containerEl.createEl('h1', {text: 'AnyBlock'});
		const div_url = containerEl.createEl('div');
    div_url.innerHTML = `See 
    <a href="https://linczero.github.io/MdNote_Public/ProductDoc/AnyBlock/README.show.html">website</a>
    /
    <a href="https://github.com/LincZero/obsidian-any-block">github</a>
    for more details (更多使用方法详见Github及网站)
    `;
    containerEl.createEl('hr', {attr: {"style": "border-color:#9999ff"}})

    // 选择器管理
    containerEl.createEl('h2', {text: 'Selector Manager (选择器的管理)'});
    containerEl.createEl('p', {text: 'This section is for query only and cannot be edited (这一部分仅供查询不可编辑)'})
    this.selectorPanel = generateSelectorInfoTable(containerEl)
    containerEl.createEl('hr', {attr: {"style": "border-color:#9999ff"}})

    // 装饰管理器
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

    // 别名系统的管理
    containerEl.createEl('h2', {text: 'AliasSystem Manager (别名系统的管理)'});
    containerEl.createEl('p', {text: 'It can also be viewed in the main page using the `[info_alias]` processor (这部分内容也可以使用 `[info_alias]` 处理器在主页面中查看)'});
    containerEl.createEl('p', {text: 'This section can also be modified by opening the `data.json` file in the plugin folder (这部分也可以打开插件文件夹中的 `data.json` 文件修改)'});
    new Setting(containerEl)
      .setName('Add a new registration instruction')
      .setDesc(`添加新的注册指令`)
      .addButton(component => {
        component
        .setIcon("plus-circle")
        .onClick(e => {
          new ABModal_alias(this.app, async (result)=>{
            // 1. 保存到对象
            let newReg: string|RegExp;
            if (/^\/.*\/$/.test(result.regex)) {
              newReg = new RegExp(result.regex.slice(1,-1)) // 去除两侧的`/`并变回regExp
            } else {
              newReg = result.regex
            }
            ABAlias_json.push({
              regex: newReg,
              replacement: result.replacement
            })
            // 2. 保存到文件
            await this.plugin.saveSettings();
          }).open()
        })
      })
    new Setting(containerEl)
      .setName('Add a new registration instruction (old, will not be used)')
      .setDesc(`添加新的注册指令 - 旧版，将弃用`)
      .addButton(component => {
        component
        .setIcon("plus-circle")
        .onClick(e => {
          new ABProcessorModal(this.app, async (result)=>{
            // 1. 保存到对象
            ABConvert.factory(result)
            settings.user_processor.push(result)
            // 2. 保存到文件
            await this.plugin.saveSettings();
            // 3. 刷新处理器的图表
            this.processorPanel.remove()
            const div = containerEl.createEl("div");
            ABConvertManager.autoABConvert(div, "info", "", "null_content")
            this.processorPanel = div
          }).open()
        })
      })
    containerEl.createEl('hr', {attr: {"style": "border-color:#9999ff"}})

    // 转换器的管理
    containerEl.createEl('h2', {text: 'Convertor Manager (转换器的管理)'});
    containerEl.createEl('p', {text: 'It can also be viewed in the main page using the `[info]` processor (这部分内容也可以使用 `[info]` 处理器在主页面中查看)'});
    containerEl.createEl('p', {text: 'This section is for query only and cannot be edited (这一部分仅供查询不可编辑)'})
    containerEl.createEl('p', {text: ''});
    const div = containerEl.createEl("div");
    ABConvertManager.autoABConvert(div, "info", "", "null_content") // this.processorPanel = ABConvertManager.getInstance().generateConvertInfoTable(containerEl)
    this.processorPanel = div
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
    contentEl.setText("Custom processor (自定义处理器)");
    contentEl.createEl("p", {text: ""})
    new Setting(contentEl)
      .setName("ProcessorId")
      .setDesc("处理器唯一id, 不与其他处理器冲突即可")
      .addText((text)=>{
        text.onChange((value) => {
          this.args.id = value
        })
      })

    new Setting(contentEl)
      .setName("ProcessorName")
      .setDesc("注册器名，可以乱填，给自己看的")
      .addText((text)=>{
        text.onChange((value) => {
        this.args.name = value
      })
    })

    new Setting(contentEl)
      .setName("Processor matching rule")
      .setDesc("注册器匹配名 (用/包括起来则表示正则)")
      .addText((text)=>{
        text.onChange((value) => {
        this.args.match = value
      })
    })

    new Setting(contentEl)
      .setName("Processor replacement")
      .setDesc("注册器替换为 (用/包括起来则判断为正则)")
      .addText((text)=>{
        text.onChange((value) => {
        this.args.process_alias = value
      })
    })

    new Setting(contentEl)
      .addButton(btn => {
        btn
        .setButtonText("Submit (提交)")
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

class ABModal_alias extends Modal {
  args: {regex: string,replacement: string}
  onSubmit: (args: {regex: string,replacement: string})=>void

  constructor(
    app: App, 
    onSubmit: (args: {regex: string,replacement: string})=>void
  ) {
    super(app);
    this.args = {
      regex: "",
      replacement: ""
    }
    this.onSubmit = onSubmit
  }

  onOpen() {	// onOpen() 方法在对话框打开时被调用，它负责创建对话框中的内容。想要获取更多信息，可以查阅 HTML elements。
    let { contentEl } = this;
    contentEl.setText("Custom alias (自定义别名)");
    contentEl.createEl("p", {text: ""})
    new Setting(contentEl)
      .setName("Alias matching rule")
      .setDesc("别名匹配规则 (若用/包括起来则表示正则)")
      .addText((text)=>{
        text.onChange((value) => {
        this.args.regex = value
      })
    })

    new Setting(contentEl)
      .setName("Alias replacement")
      .setDesc("别名替换为")
      .addText((text)=>{
        text.onChange((value) => {
        this.args.replacement = value
      })
    })

    new Setting(contentEl)
      .addButton(btn => {
        btn
        .setButtonText("Submit (提交)")
        .setCta() // 这个不知道什么意思
        .onClick(() => {
          if(this.args.regex && this.args.replacement){
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
