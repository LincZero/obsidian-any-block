# Any Block Converter

## 使用

```typescript
import { ABConvertManager } from "ABConvertManager"

// 先注册默认渲染行为
ABConvertManager.getInstance().redefine_renderMarkdown((markdown: string, el: HTMLElement): void => {...})

// 然后按下面这个原型正常使用即可
ABConvertManager.autoABConvert(el:HTMLDivElement, header:string, content:string): HTMLElement
```

## 设计/Obsidian插件补充

（先读src下的README）

### 架构

也叫 Any Block Render (text->html时)

因为模块化内置了很多 Converter (text->text等)，所以整体叫 Any Block Converter

### 该模块设计不应依赖于Ob插件

以前这个文件夹是依赖Ob插件接口的，现在要改成可复用的 AnyBlock 转化器。

为了高复用 (不仅仅在Ob插件上使用，还在md-it的等其他地方使用)

1. 要与选择器解耦
2. 相较于V2版本，为了不依赖于Ob底层，使用一个回调函数去替代 `MarkdownRenderer` 相关函数

### 程序缩写

- `AnyBlock`：`AB`
- `AnyBlockConvert`：`ABC`
- `AnyBlockSelector`：`ABS`
- `AnyBlockRender`：`ABR`
