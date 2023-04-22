/** ab处理器子接口
 * @warn 暂时不允许扩展，处理器的参数和返回值目前还是使用的手动一个一个来检查的
 */
export enum ProcessDataType {
  text= "string",
  el= "HTMLElement"
}

/// ab处理器接口 - 严格版 存储版
export interface ABProcessorSpec{
  id: string
  name: string
  match: RegExp|string
  default: string|null
  detail: string
  process_alias: string,
  process_param: ProcessDataType|null,
  process_return: ProcessDataType|null,
  process: (el:HTMLDivElement, header:string, content:string)=> any
  is_disable: boolean   // 是否禁用，默认false
  register_from: string // 自带、其他插件、面板设置，如果是其他插件，则需要提供插件的名称（不知道能不能自动识别）
  // 非注册项：
  // ~~is_inner：这个不可设置，用来区分是内部还是外部给的~~
  // is_enable: 加载后能禁用这个项
}

/** ab处理器 - 语法糖版，的接口与注册函数
 * 使用 ab处理器接口 - 用户语法糖版
 * 不允许直接写严格版的，有些参数不能让用户填
 */
export interface ABProcessorSpecSimp{
  id: string            // 唯一标识（当不填match时也会作为匹配项）
  name: string          // 处理器名字
  match?: RegExp|string // 处理器匹配正则（不填则为id，而不是name！name可以被翻译或是重复的）如果填写了且为正则类型，不会显示在下拉框中
  default?: string|null // 下拉选择的默认规则，不填的话：非正则默认为id，有正则则为空
  detail?: string       // 处理器描述
  // is_render?: boolean   // 是否渲染处理器，默认为true。false则为文本处理器
  process_alias?: string    // 组装，如果不为空串则会覆盖process方法，但扔需要给process一个空实现
  process_param?: ProcessDataType
  process_return?: ProcessDataType
  process: (el:HTMLDivElement, header:string, content:string)=> any
                        // 处理器
}

/** ab处理器 - 用户版，的接口与注册函数
 * 使用 ab处理器接口 - 用户版（都是字符串存储）
 * 特点：不能注册process（无法存储在txt中），只能注册别名
 */
export interface ABProcessorSpecUser{
  id:string
  name:string
  match:string
  process_alias:string
}
