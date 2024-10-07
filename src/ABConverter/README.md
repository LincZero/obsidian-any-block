# Any Block Converter

## 使用

### 使用流程

```typescript
// 转换器模块
import { ABConvertManager } from "ABConvertManager"
// 加载所有转换器 (都是可选的)
// (当然，如果A转换器依赖B转换器，那么你导入A必然导入B)
import {} from "./ABConverter/converter/abc_text"
import {} from "./ABConverter/converter/abc_list"
import {} from "./ABConverter/converter/abc_table"
import {} from "./ABConverter/converter/abc_deco"
import {} from "./ABConverter/converter/abc_ex"
import {} from "./ABConverter/converter/abc_mermaid" // 可选建议：7.1MB
import {} from "./ABConverter/converter/abc_markmap" // 可选建议：1.3MB

// 先注册默认渲染行为
ABConvertManager.getInstance().redefine_renderMarkdown((markdown: string, el: HTMLElement): void => {...})

// 然后按下面这个原型正常使用即可
ABConvertManager.autoABConvert(el:HTMLDivElement, header:string, content:string): HTMLElement
```

### Obsidian 回调函数设置

```typescript
ABConvertManager.getInstance().redefine_renderMarkdown((markdown: string, el: HTMLElement, ctx?: any): void => {
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

    const mdrc: MarkdownRenderChild = new MarkdownRenderChild(el);
    if (ctx) ctx.addChild(mdrc);
    else if (ABCSetting.global_ctx) ABCSetting.global_ctx.addChild(mdrc);
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
    MarkdownRenderer.render(app, markdown, el, app.workspace.activeLeaf?.view?.file?.path??"", mdrc)
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

### 格式转换所在位置

> ##### 思考

例如我有两个格式：格式1（有格式1解析渲染、将自己格式转别人格式，将别人格式转自己格式）、格式2（有格式2解析渲染、将别人的格式转自己式、将自己的格式转别人的格式）。问题在于：1转2和2转1的功能，应该怎么设置？

1. 都放在两个文件中
    - 优点：两模块互相独立
    - 缺点：造成冗余，而非复用 —— 只写一遍，两个程序都用一份
2. 只放格式2
    - 思想：该方式视为先有的格式1后有的格式2扩展。或视为格式1是更通用更广泛的格式，格式2属于扩展格式，自然由格式2负责12的互转
    - 采用：abc_mermaid、abc_markmap 与 list 的转换属于此类，后期增加的新格式也属于此类
3. 1转2由2实现，2转1则由1实现
    - 思想：该方式视为1和2是两个商业软件，他们乐意于让对方的用户转移到自己这边，但并不乐意让自己的用户转到对方那边
    - 采用：list、table 的互相转换属于此类

> ##### 总结

按格式的通用性分为：(越往上通用级别越高)

1. str
2. html
3. list、table
4. mermaid、mindmap、……以后的扩展

> ##### 策略

1. 低通用级格式要实现对高通用级格式的互转
2. 同通用级则实现其他同通用级格式对自己格式的转化

## todo

1. 别名模块，AnyBlockConverter 不应该最后强制输出html。最后补md的行为是ob的别名模块做的，不应该由abc来快
2. PlantUML，感觉很多东西都好用多了

## bug

### mdit环境下onclick需要内嵌才生效

```typescript
// TODO，onClick代码在mdit环境下按钮点击失效。测试代码如下
const btn = document.createElement("button"); table.appendChild(btn); btn.textContent = "测试按钮1";
btn.onclick = () => { console.log("btn.onclick") }
const btndiv = document.createElement("div"); table.appendChild(btndiv);
btndiv.innerHTML = `<button onclick="console.log('Button was clicked!')">测试按钮2</button>`
// 发现mdit环境下，按钮1无法正常按动，而按钮2可以
// 原因应该是：因为mdit环境下的document对象是jdsom创建的，假的。这个dom对象后面会被转化为html_str，onclick的信息就丢失了
```

### mermaid找不到DOMPurify

mermaid的一个未定义行为的报错 (不过修复了这个之后又说BBox找不到了)

```typescript
// 见：https://github.com/kkomelin/isomorphic-dompurify

// 用
import DOMPurify from "isomorphic-dompurify"
// 替换
import DOMPurify from "dompurify"
```
