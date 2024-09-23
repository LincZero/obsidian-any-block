# 开发README

## 编译与发布

### 编译

```bash
npm i
npm run build
```

### 使用

然后复制这三个文件：

- main.js
- manifest.json
- styles.css

本地使用就复制到 .obsidian/插件名文件夹/

发布到 Github Release 也是发布这三个文件

### 发布到社区 - 手动

1. 打包产物更新到Release里
2. 记得检查更新 manifest.json 和 package.json 里的版本号 (最好是在项目搜索 `"version": "3.1."` 然后修改，面得漏改了)
    (发布才改，并需要保证github release有东西了。平时别乱改，ob社区仓库好像会自动发现你改了然后就更新过去)
3. 更新到GitHub，代码推送更新
4. 不再需要去Obsidian社区那个仓库里更新他的那个json里的版本号 (你manifest.json修改了他那边会自动更新)

### 发布到社区 - Github Action 自动

参考：[Using GitHub actions to release plugins](https://forum.obsidian.md/t/using-github-actions-to-release-plugins/7877)

## 程序设计

这部分更多的内容我会写到公开md笔记里，去官网看

### 转化器与选择器模块

整个Ob插件的核心分为两个部分：

- 主插件，`AnyBlock`，代码缩写 `AB`
    - 转换器，`AnyBlockConvert`，代码缩写 `ABC`
        - 用法：将txt转化为html
        - 特征：通用、可扩展
        - 类别：可以动态注册各种转换器 (2mermaid、2lt、2mindmap等)
    - 管理器，`AnyBlockManager`，代码缩写 `ABM`
        - 用法：由于替换器和选择器是一起的，这里就合起来了
        - 类别
            - 在Obsidian中，这个支持Ob的三种选择器：
                - 代码块选择器，代码缩写 `ABS_CodeBlock` (自带选择器)
                - CM选择器，代码缩写 `ABS_CM`
                - 后选择器，代码缩写 `ABS_Html`
            - 在VuePress中，这个也支持多种选择器：
                - Markdown-it 的 TokensStream
                - `:::` 选择器 (markdown-it-container)
            - 其他 TokensStream 或 AST 架构的软件
        - 再包含
            - 选择器 `AnyBlockSelector`，代码缩写 `ABS`
                - 用法：选择范围，并返回范围值
                - 特征：定义通用、实现不通用、可扩展
                - 类别：可以动态注册各种选择器 (list、table、quote、codeblock等，其中codeblock选择器一般是内置了的)
            - 替换器，`AnyBlockReplacer`，代码缩写 `ABR`
                - 用法：选择器选择完范围后，替换器将这部分范围的东西交给转换器，并将转换后的结果替换掉原内容
                - 特征：非通用、不可扩展
            
其中每个**区域**需要都实现一遍**替换器**和**选择器**。即实现数是他俩的乘积

（其中：CodeBlock 一般自带选择器，一般来说无需再次选择。除非存在嵌套 AnyBlock 的情况）
