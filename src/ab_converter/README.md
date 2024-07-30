# Any Block Converter

## 使用

### 使用流程

```typescript
import { ABConvertManager } from "ABConvertManager"

// 先注册默认渲染行为
ABConvertManager.getInstance().redefine_renderMarkdown((markdown: string, el: HTMLElement): void => {...})

// 然后按下面这个原型正常使用即可
ABConvertManager.autoABConvert(el:HTMLDivElement, header:string, content:string): HTMLElement
```

### Obsidian 回调函数设置

```typescript
ABConvertManager.getInstance().redefine_renderMarkdown((markdown: string, el: HTMLElement): void => {
    /**
     * 原定义：
     * Renders markdown string to an HTML element.
     * @param markdown - The markdown source code
     * @param el - The element to append to
     * @param sourcePath - The normalized path of this markdown file, used to resolve relative internal links
     *     此标记文件的规范化路径，用于解析相对内部链接
     *     TODO 我可能知道为什么重渲染图片会出现bug了，原因应该在这里
     * @param component - A parent component to manage the lifecycle of the rendered child components, if any
     *     一个父组件，用于管理呈现的子组件(如果有的话)的生命周期
     * @public
     */
    MarkdownRenderer.renderMarkdown(markdown, el, "", new MarkdownRenderChild(el))
})
```

### MarkdownIt 回调函数设置

```typescript
ABConvertManager.getInstance().redefine_renderMarkdown((markdown: string, el: HTMLElement): void => {
    const result: string = md.render(markdown)
    const el_child = document.createElement("div"); el.appendChild(el_child); el_child.innerHTML = result;
})
```

## 开发/设计/架构补充

（先读src下的README）

### 架构

也叫 Any Block Render (text->html时)

因为模块化内置了很多 Converter (text->text等)，所以整体叫 Any Block Converter

### 该模块设计不应依赖于Ob插件

**这个模块以前是依赖Ob插件接口的**，后来才改成可复用的 AnyBlock 转化器。

为了高复用 (不仅仅在Ob插件上使用，还在md-it的等其他地方使用)

1. 要与选择器解耦
2. 相较于V2版本，为了不依赖于Ob底层，使用一个回调函数去替代 `MarkdownRenderer` 相关函数

### 程序缩写

- `AnyBlock`：`AB`
- `AnyBlockConvert`：`ABC`
- `AnyBlockSelector`：`ABS`
- `AnyBlockRender`：`ABR`
