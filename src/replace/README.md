# any convert

### 转化器模块

整个Ob插件的核心分为两个部分：

- 选择器 any-block-selector
    - 这个是专用的。支持Ob的三种选择器
- 转换器 any-block-convert
    - 这个是通用的，指定用法：将txt转化为html

### 该模块设计不应依赖于Ob插件

而这个文件夹是不依赖Ob插件接口的，可复用的 Any-Block 转化器。

为了高复用 (不仅仅在Ob插件上使用，还在md-it的等其他地方使用)，

### V3改进

相较于V2版本，为了不依赖于Ob底层，使用一个回调函数去替代 `MarkdownRenderer` 相关函数
