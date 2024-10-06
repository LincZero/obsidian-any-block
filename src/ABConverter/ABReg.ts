/**
 * 正则匹配规则
 * 
 * @attention 注意：修改正则要注意小括号的位置是否对应，不然还要去修改索引
 */
export const ABReg = {
  /**
   * AB块头部
   *
   * 例子：`    > - > %%[d]:%%   `
   * 
   * - 前缀部分
   *     - $1: 前缀 | `    > - >  ` | ((\s|>\s|-\s|\*\s|\+\s)*)
   *     - $2: 无用 | `>`           | (\s|>\s|-\s|\*\s|\+\s)
   * - 指令部分
   *     - $3: 无用 | `%%`          | (%%)?
   *     - $4：无用 | `[header]`    | (\[((?!toc)[0-9a-zA-Z].*)\])
   *     - $5：指令 | `header`      | (?!toc)[0-9a-zA-Z].*)
   *     - $6: 无用 | `%%`          | (%%)?
   * 
   * 注意：
   * - (?!\[) (?!\toc) 这种向后否定语句不作为一个匹配项
   * - 允许 `%%` 和 `:` 的规则是V3新增的
   */
  // 有前缀版本（给选择器用）
  reg_header:   /^((\s|>\s|-\s|\*\s|\+\s)*)(%%)?(\[((?!toc|TOC|< )[\|#0-9a-zA-Z\u4e00-\u9fa5].*)\]):?(%%)?\s*$/, // 可以用空`|`来解除首字符限制。(`|`注意：可以用来弄严格模式，`#`注意：建议后面空一格避免变成“标签”，`!`注意：别易误触发 `> [!note]`
  reg_header_up:/^((\s|>\s|-\s|\*\s|\+\s)*)(%%)?(\[((?!toc|TOC)< [\|#0-9a-zA-Z\u4e00-\u9fa5].*)\]):?(%%)?\s*$/,  // 向上检查标志的 头部选择器
  reg_mdit_head:/^((\s|>\s|-\s|\*\s|\+\s)*)(:::)\s?(.*)/,         // TODO 应该改成 `::::*`
  reg_mdit_tail:/^((\s|>\s|-\s|\*\s|\+\s)*)(:::)/,

  reg_list:     /^((\s|>\s|-\s|\*\s|\+\s)*)(-\s|\*\s|\+\s)(.*)/,  //: /^\s*(>\s)*-\s(.*)$/
  reg_code:     /^((\s|>\s|-\s|\*\s|\+\s)*)(```|~~~)(.*)/,      //: /^\s*(>\s|-\s)*(```|~~~)(.*)$/ // TODO 应改成` "```*")
  reg_quote:    /^((\s|>\s|-\s|\*\s|\+\s)*)(>\s)(.*)/,          // `- > ` 不匹配，要认为这种是列表
  reg_heading:  /^((\s|>\s|-\s|\*\s|\+\s)*)(\#+\s)(.*)/,
  reg_table:    /^((\s|>\s|-\s|\*\s|\+\s)*)(\|(.*)\|)/,

  // 无前缀版本（给处理器用，处理器不需要处理前缀，前缀在选择器阶段已经被去除了）
  reg_header_noprefix:   /^((\s)*)(%%)?(\[((?!toc|TOC|< )[\|#0-9a-zA-Z\u4e00-\u9fa5].*)\]):?(%%)?\s*$/,
  reg_header_up_noprefix:/^((\s)*)(%%)?(\[((?!toc|TOC)< [\|#0-9a-zA-Z\u4e00-\u9fa5].*)\]):?(%%)?\s*$/,
  reg_mdit_head_noprefix:/^((\s)*)(:::)\s?(.*)/,
  reg_mdit_tail_noprefix:/^((\s)*)(:::)/,

  reg_list_noprefix:     /^((\s)*)(-\s|\*\s|\+\s)(.*)/,
  reg_code_noprefix:     /^((\s)*)(```|~~~)(.*)/,      
  reg_quote_noprefix:    /^((\s)*)(>\s)(.*)/,          
  reg_heading_noprefix:  /^((\s)*)(\#+\s)(.*)/,         
  reg_table_noprefix:    /^((\s)*)(\|(.*)\|)/,

  reg_emptyline_noprefix:/^\s*$/,
  reg_indentline_noprefix:/^\s+?\S/,

  inline_split: /\| |,  |， |\.  |。 |:  |： /, // 内联切分。`|`或全角符号+一空格，半角符号+两空格 (后者由于空格压缩，若经历了重渲染可能有问题)
}

/**
 * ABConvert的设置
 * 
 * @detail
 * 可以被obsidian的设置覆盖，如果没有GUI设置页面，可以人工修改
 */
export let ABCSetting: {is_debug: boolean, global_ctx: any} = {
  is_debug: false,
  global_ctx: null // MarkdownPostProcessorContext类型, obsidian专用
}
