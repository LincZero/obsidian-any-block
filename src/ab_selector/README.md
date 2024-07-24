# Any Block Selector

## 缩写

`AnyBlock` 在程序中有时缩写为 `AB`

而 `AnyBlockSelector` 则缩写为 `ABS`

## 选择器模块

不知道这个模块干嘛用的或不知道在整个插件中的定位的话，去看src下的README

## 转化器与选择器模块

整个Ob插件的核心分为两个部分：

- 主插件 AnyBlock，代码缩写 `AB`
    - 选择器 AnyBlockSelector，代码缩写 `ABS`
        - 在Obsidian中，这个支持Ob的三种选择器：
            - 代码块选择器，代码缩写 `ABS_Code`
            - CM选择器，代码缩写 `ABS_CM`
            - 后选择器，代码缩写 `ABS_Html`
        - 在VuePress中，这个支持两种选择器：
            - 代码块选择器
            - `:::` 选择器
    - 转换器 AnyBlockConvert，代码中简写 `ABC`
        - 这个是通用的，指定用法：将txt转化为html
    - 替换器 AnyBlockReplacer，代码中简写 `ABR`
        - 选择器选择完范围后，替换器将这部分范围的东西交给转换器，并将转换后的结果替换掉原内容
