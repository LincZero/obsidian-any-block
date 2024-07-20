# 开发README

## 程序设计

这部分我写到公开md笔记里，去官网看

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
