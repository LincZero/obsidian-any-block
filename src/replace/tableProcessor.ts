import { MarkdownRenderer, MarkdownRenderChild, } from 'obsidian'
import mermaid from "mermaid"
import {getID} from "src/utils/utils"
import { ABReg } from 'src/config/abReg'

import GeneratorBranchTable from "src/svelte/GeneratorBranchTable.svelte"
import GeneratorListTable from "src/svelte/GeneratorListTable.svelte"
import GeneratorTab from "src/svelte/GeneratorTab.svelte"

// 通用表格数据，一个元素等于是一个单元格项
// interface TableItem{
//   level: number;          // 级别
//   content: string;        // 内容
//   tableRow: number,       // 跨行数
//   tableLine: number       // 对应首行序列
//   // 跨列数
// }
// export type List_TableItem = TableItem[]