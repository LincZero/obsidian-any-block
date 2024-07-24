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

1. 记得检查更新 manifest.json 和 package.json 里的版本号
2. 更新到GitHub，代码推送更新，打包产物也更新到Release里
3. 去Obsidian社区那个仓库里更新他的那个json里的版本号

### 发布到社区 - Github Action 自动

参考：[Using GitHub actions to release plugins](https://forum.obsidian.md/t/using-github-actions-to-release-plugins/7877)

## 程序设计

这部分更多的内容我会写到公开md笔记里，去官网看

### 转化器与选择器模块

整个Ob插件的核心分为两个部分：

- 主插件 AnyBlock，代码缩写 `AB`
    - 选择器 AnyBlockSelector，代码缩写 `ABS`。
        - 按作用块区分
            - 在Obsidian中，这个支持Ob的三种选择器：
                - 代码块选择器，代码缩写 `ABS_Code`
                - CM选择器，代码缩写 `ABS_CM`
                - 后选择器，代码缩写 `ABS_Html`
                - 从text中选择，代码缩写 `ABS_Md`
            - 在VuePress中，这个支持两种选择器：
                - 代码块选择器
                - `:::` 选择器
        - 按语法区分
            - 可以动态注册各种选择器 (list、table、quote、codeblock等，其中codeblock选择器一般是内置了的)
    - 转换器 AnyBlockConvert，代码中简写 `ABC`
        - 这个是通用的，指定用法：将txt转化为html
        - 按语法区分
            - 可以动态注册各种转换器 (2mermaid、2lt、2mindmap等)
