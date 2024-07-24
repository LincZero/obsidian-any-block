# Any Block Convert

（先读src下的README）

## 缩写

`AnyBlock` 在程序中有时缩写为 `AB`

而 `AnyBlockConvert` 则缩写为 `ABC`

## 该模块设计不应依赖于Ob插件

以前这个文件夹是依赖Ob插件接口的，现在要改成可复用的 AnyBlock 转化器。

为了高复用 (不仅仅在Ob插件上使用，还在md-it的等其他地方使用)

1. 要与选择器解耦
2. 相较于V2版本，为了不依赖于Ob底层，使用一个回调函数去替代 `MarkdownRenderer` 相关函数
