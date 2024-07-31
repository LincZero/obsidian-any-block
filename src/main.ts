/**
 * 入口文件
 * 
 * 接管三个处理点：
 * - 代码块"ab" (代码块)
 * - cm (实时模式)
 * - 接管渲染后 (渲染/阅读模式)
 */

import { Plugin } from "obsidian"
import {MarkdownRenderChild, MarkdownRenderer} from 'obsidian'

import { ABReplacer_CodeBlock } from "./ab_manager/abm_code/ABReplacer_CodeBlock"
import { ABStateManager } from "./ab_manager/abm_cm/ABStateManager"
import { ABSelector_PostHtml } from "./ab_manager/abm_html/ABSelector_PostHtml"
import { ABConvertManager } from "./ABConverter/ABConvertManager"
import type { ABSettingInterface } from "./config/ABSettingTab"
import { ABSettingTab, AB_SETTINGS } from "./config/ABSettingTab"


export default class AnyBlockPlugin extends Plugin {
  settings: ABSettingInterface

	async onload() {
    await this.loadSettings();
    this.addSettingTab(new ABSettingTab(this.app, this));

    // 将ob的解耦行为传入回调函数 (目的是将转换器和Obsidian相解耦合)
    ABConvertManager.getInstance().redefine_renderMarkdown((markdown: string, el: HTMLElement): void => {
      /**
       * Renders markdown string to an HTML element.
       * @deprecated - use {@link MarkdownRenderer.render}
       * 
       * 原定义： 
       * @param markdown - The markdown source code
       * @param el - The element to append to
       * @param sourcePath - The normalized path of this markdown file, used to resolve relative internal links
       *     此标记文件的规范化路径，用于解析相对内部链接
       *     TODO 我可能知道为什么重渲染图片会出现bug了，原因应该在这里
       * @param component - A parent component to manage the lifecycle of the rendered child components, if any
       *     一个父组件，用于管理呈现的子组件(如果有的话)的生命周期
       * @public
       * 
       */
      //MarkdownRenderer.renderMarkdown(markdown, el, "", new MarkdownRenderChild(el))

      /**
       * Renders markdown string to an HTML element.
       * @param app - A reference to the app object
       * @param markdown - The markdown source code
       * @param el - The element to append to
       * @param sourcePath - The normalized path of this markdown file, used to resolve relative internal links
       * @param component - A parent component to manage the lifecycle of the rendered child components.
       * @public
       */
      // @ts-ignore 新接口，但旧接口似乎不支持
      MarkdownRenderer.render(app, markdown, el, "", new MarkdownRenderChild(el))

      // 尝试修复重渲染导致相对路径图片失效的问题：
      /*
      新接口：
      https://github.com/obsidianmd/obsidian-api/issues/120
      https://github.com/marcusolsson/obsidian-projects/issues/427
      https://github.com/marcusolsson/obsidian-projects/pull/742

      // 正常情况：app://ac1edd3e6646569178bcbd629f95939550c7/D:/Path/Obsidian/MdNote_Special/png/addTitle.png?1676362717343
      let file = this.app.workspace.getActiveFile()
      const path = file?file.path:"nnn"
      const absPath = file?file.vault.adapter.getName():"nnn"
      // @ts-ignore error: Attribute "basePath" does not exist on Type "DataAdapter"
      const basePath = file?file.vault.adapter.basePath:"nnn"
      // @ts-ignore error: Attribute "basePath" does not exist on Type "DataAdapter"
      const basePath2 = file?file.vault.adapter.basePath.replace(/\\/g, "/"):"nnn"
      const resourcePath1 = file?file.vault.adapter.getResourcePath(path):"nnn"
      // markdown is `![](./png/addTitle.png)` or `![[./png/addTitle.png]]`
      MarkdownRenderer.renderMarkdown(markdown, el, path, new MarkdownRenderChild(el))
      MarkdownRenderer.renderMarkdown(markdown, el, absPath, new MarkdownRenderChild(el))
      MarkdownRenderer.renderMarkdown(markdown, el, absPath+"/path", new MarkdownRenderChild(el))
      MarkdownRenderer.renderMarkdown(markdown, el, basePath, new MarkdownRenderChild(el))
      MarkdownRenderer.renderMarkdown(markdown, el, basePath2, new MarkdownRenderChild(el))
      MarkdownRenderer.renderMarkdown(markdown, el, basePath2+"/", new MarkdownRenderChild(el))
      MarkdownRenderer.renderMarkdown(markdown, el, basePath2+"/"+path, new MarkdownRenderChild(el))
      MarkdownRenderer.renderMarkdown(markdown, el, file?file.vault.adapter.getResourcePath(path):"nnn", new MarkdownRenderChild(el))
      MarkdownRenderer.renderMarkdown(markdown, el, file?file.vault.adapter.getResourcePath(absPath):"nnn", new MarkdownRenderChild(el))
      MarkdownRenderer.renderMarkdown(markdown, el, file?file.vault.adapter.getResourcePath(absPath+"/path"):"nnn", new MarkdownRenderChild(el))
      MarkdownRenderer.renderMarkdown(markdown, el, file?file.vault.adapter.getResourcePath(basePath):"nnn", new MarkdownRenderChild(el))
      MarkdownRenderer.renderMarkdown(markdown, el, file?file.vault.adapter.getResourcePath(basePath2):"nnn", new MarkdownRenderChild(el))
      MarkdownRenderer.renderMarkdown(markdown, el, file?file.vault.adapter.getResourcePath(basePath2+"/"):"nnn", new MarkdownRenderChild(el))
      MarkdownRenderer.renderMarkdown(markdown, el, file?file.vault.adapter.getResourcePath(basePath2+"/"+path):"nnn", new MarkdownRenderChild(el))

      MarkdownRenderer.renderMarkdown(markdown, el, file?file.vault.adapter.getResourcePath(path).replace(/\?.*$/, ''):"nnn", new MarkdownRenderChild(el))
      MarkdownRenderer.renderMarkdown(markdown, el, file?file.vault.adapter.getResourcePath(absPath).replace(/\?.*$/, ''):"nnn", new MarkdownRenderChild(el))
      MarkdownRenderer.renderMarkdown(markdown, el, file?file.vault.adapter.getResourcePath(absPath+"/path").replace(/\?.*$/, ''):"nnn", new MarkdownRenderChild(el))
      MarkdownRenderer.renderMarkdown(markdown, el, file?file.vault.adapter.getResourcePath(basePath).replace(/\?.*$/, ''):"nnn", new MarkdownRenderChild(el))
      MarkdownRenderer.renderMarkdown(markdown, el, file?file.vault.adapter.getResourcePath(basePath2).replace(/\?.*$/, ''):"nnn", new MarkdownRenderChild(el))
      MarkdownRenderer.renderMarkdown(markdown, el, file?file.vault.adapter.getResourcePath(basePath2+"/").replace(/\?.*$/, ''):"nnn", new MarkdownRenderChild(el))
      MarkdownRenderer.renderMarkdown(markdown, el, file?file.vault.adapter.getResourcePath(basePath2+"/"+path).replace(/\?.*$/, ''):"nnn", new MarkdownRenderChild(el))
      console.log(`renderMarkdown:
        ${path}
        ${absPath}
        ${absPath+"/path"}
        ${basePath}
        ${basePath2}
        ${basePath2+"/"}
        ${basePath2+"/"+path}
        ${file?file.vault.adapter.getResourcePath(path):"nnn"}
        ${file?file.vault.adapter.getResourcePath(absPath):"nnn"}
        ${file?file.vault.adapter.getResourcePath(absPath+"/path"):"nnn"}
        ${file?file.vault.adapter.getResourcePath(basePath):"nnn"}
        ${file?file.vault.adapter.getResourcePath(basePath2):"nnn"}
        ${file?file.vault.adapter.getResourcePath(basePath2+"/"):"nnn"}
        ${file?file.vault.adapter.getResourcePath(basePath2+"/"+path):"nnn"}
        ${file?file.vault.adapter.getResourcePath(path).replace(/\?.*$/, ''):"nnn"}
        ${file?file.vault.adapter.getResourcePath(absPath).replace(/\?.*$/, ''):"nnn"}
        ${file?file.vault.adapter.getResourcePath(absPath+"/path").replace(/\?.*$/, ''):"nnn"}
        ${file?file.vault.adapter.getResourcePath(basePath).replace(/\?.*$/, ''):"nnn"}
        ${file?file.vault.adapter.getResourcePath(basePath2).replace(/\?.*$/, ''):"nnn"}
        ${file?file.vault.adapter.getResourcePath(basePath2+"/").replace(/\?.*$/, ''):"nnn"}
        ${file?file.vault.adapter.getResourcePath(basePath2+"/"+path).replace(/\?.*$/, ''):"nnn"}
      `)*/
    })

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
