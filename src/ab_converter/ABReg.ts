export const ABReg = {
    reg_header:   /^((\s|>\s|-\s|\*\s|\+\s)*)(\[(?!\[)(.*)\])\s*$/,

    // 有前缀版本（给选择器用）
    reg_headtail: /^((\s|>\s|-\s|\*\s|\+\s)*)(:::)(.*)/,
    reg_list:     /^((\s|>\s|-\s|\*\s|\+\s)*)(-\s|\*\s|\+\s)(.*)/,  //: /^\s*(>\s)*-\s(.*)$/
    reg_code:     /^((\s|>\s|-\s|\*\s|\+\s)*)(```|~~~)(.*)/,      //: /^\s*(>\s|-\s)*(```|~~~)(.*)$/
    reg_quote:    /^((\s|>\s|-\s|\*\s|\+\s)*)(>\s)(.*)/,          // `- > ` 不匹配，要认为这种是列表
    reg_heading:  /^((\s|>\s|-\s|\*\s|\+\s)*)(\#+\s)(.*)/,
    reg_table:    /^((\s|>\s|-\s|\*\s|\+\s)*)(\|(.*)\|)/,

    // 无前缀版本（给处理器用，处理器不需要处理前缀，前缀在选择器阶段已经被去除了）
    reg_headtail_noprefix: /^((\s)*)(:::)(.*)/,
    reg_list_noprefix:     /^((\s)*)(-\s|\*\s|\+\s)(.*)/,
    reg_code_noprefix:     /^((\s)*)(```|~~~)(.*)/,      
    reg_quote_noprefix:    /^((\s)*)(>\s)(.*)/,          
    reg_heading_noprefix:  /^((\s)*)(\#+\s)(.*)/,         
    reg_table_noprefix:    /^((\s)*)(\|(.*)\|)/,

    reg_emptyline_noprefix:/^\s*$/,
    reg_indentline_noprefix:/^\s+?\S/,
}
