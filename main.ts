import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import test from 'node:test';

// 记得重命名这些类和接口!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

/* 1. Plugin接口的实现
 *
 */
export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	// 插件加载后
	async onload() {
		await this.loadSettings();

		/* 1. 左侧工具栏相关的操作 */
		/* 在左侧色带中创建一个图标
		 *     参数1：估计是图标名
		 *     参数2：悬浮提示名
		 *     参数3：事件
		 */
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// 当用户单击图标时调用：发送一条信息
			new Notice('This is a notice!');
		});
		// 对色带执行额外的操作
		ribbonIconEl.addClass('my-plugin-ribbon-class');


		/* 2. 右下角的状态栏增添一段文字
		 * 移动应用程序中不工作
		 */
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');


		/* 3. 下面增加三个可以在任何地方触发的简单命令
		 * addCommand函数
		 *     参数1：id
		 *     参数2：命令名字
		 *     参数3：事件，一个回调函数
		 */

		// 3.1. 打开一个窗口
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});

		// 3.2. 这将添加一个编辑器命令，可以对当前编辑器实例执行某些操作。这里是在光标所在位置打印一串字符串
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});

		// 3.3. 这添加了一个复杂的命令,可以检查应用程序的当前状态是否允许执行命令
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// 条件检查
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// 如果检查为真，我们只是在“检查”命令是否可以运行
					// 如果检查为false，那么我们想实际执行操作
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// 只有当check函数返回true时，该命令才会显示在命令面板中
					return true;
				}
			}
		});

		// 一些实验：
		// editor.getValue() // 获取全部内容
		// editor.lineCount() // 一共有多少行
		// let i = editor.getCursor().line // 光标在第几行
		// editor.replaceSelection('SSS：'+s1+"DDD") // 光标后输出

		// " - [ ] 678".match(new RegExp(`^\\s*- \\[([* +-x])\\].*`))
		// editor.replaceSelection('   SSS:【'+ s1.match(r1)+"】【" +s1.match(r2)+"】【"+ s1+"】")

		// 4. 切换鼠标所在行的复选框状态
		this.addCommand({
			id: 'test',
			name: '切换鼠标所在行的复选框状态',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				

				let s1 :string = editor.getLine(editor.getCursor().line) // 获取序列行的内容
				
				let r1 = new RegExp(`^\\s*- \\[[( )]\\](.*)`)
				let r2 = new RegExp(`^\\s*- \\[[(*+-x)]\\](.*)`)
				if (s1.match(r1)) {
					s1 = s1.replace("[ ]","[*]")	// 这里写得比较简陋，会有bug，比如- [ ] [ ]
					let ss  = s1.match(r1)
				}
				else if (s1.match(r2)) {
					s1 = s1.replace("[*]","[ ]")
					s1 = s1.replace(r1, "d")
				}

				editor.setLine(editor.getCursor().line, s1)
				}
		});

		// 这将添加一个设置选项卡，以便用户可以配置插件的各个方面
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// 如果该插件连接了任何全局DOM事件(在不属于该插件的应用程序部分上)
		//当这个插件被禁用时，使用这个函数会自动删除事件监听器。
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// 当注册间隔时，当插件被禁用时，该函数将自动清除间隔
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	// 插件停用后
	onunload() {

	}

	// 插件设置加载后
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	// 插件设置保存后
	async saveSettings() {
		await this.saveData(this.settings);
	}
}

/* 2. Model接口的实现
 * 打开的提示窗口的实体
 */
class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

/* 3. PluginSettingTab接口的实现
 * 这个是设置菜单里的设置
 */
class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		// 一个h2标题
		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		// 创建一个新的设置项
		new Setting(containerEl)
			.setName('Setting #1')											// 设置项名字
			.setDesc('It\'s a secret')									// 设置项提示
			.addText(text => text												// 输入框
				.setPlaceholder('Enter your secret')			// 没有内容时的提示
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
