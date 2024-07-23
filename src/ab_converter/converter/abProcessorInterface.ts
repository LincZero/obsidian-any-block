import { ABConvertManager } from "../abConvertManager"

/**
 * ab处理器子接口
 * @warn 暂时不允许扩展，处理器的参数和返回值目前还是使用的手动一个一个来检查的
 * 待增加一个list和json专用格式
 */
export enum ProcessDataType {
  text = "string",
  el = "HTMLElement"
}

/**
 * ab处理器接口 - 严格版 存储版
 */
export class ABProcessorSpec {

  /** --------------------------------- 静态参数 -------------------------- */

  id: string
  name: string
  match: RegExp|string
  default: string|null
  detail: string
  process_alias: string
  process_param: ProcessDataType|null
  process_return: ProcessDataType|null
  process: (el:HTMLDivElement, header:string, content:string)=> any
  is_disable: boolean       // 是否禁用，默认false
  register_from: string     // 自带、其他插件、面板设置，如果是其他插件，则需要提供插件的名称（不知道能不能自动识别）

  /** --------------------------------- 动态参数 -------------------------- */

  // 非注册项：
  // ~~is_inner：这个不可设置，用来区分是内部还是外部给的~~
  // is_enable: 加载后能禁用这个项
  
  /** --------------------------------- 处理器容器管理 --------------------- */

  /// 用户注册处理器
  /// TODO 应该修改为创建实例，因为里面有动态参数
  public static registerABProcessor(process: ABProcessorSpec| ABProcessorSpecSimp| ABProcessorSpecUser){
    ABConvertManager.getInstance().list_abProcessor.push(ABProcessorSpec.registerABProcessor_adapt(process));
  }

  public static registerABProcessor_adapt(process: ABProcessorSpec| ABProcessorSpecSimp| ABProcessorSpecUser): ABProcessorSpec{
    if ('is_disable' in process) {    // 严格版 存储版
      return process
    }
    else if ('process' in process) {  // 用户版 注册版
      return this.registerABProcessor_adapt_simp(process)
    }
    else {                            // 别名版 无代码版
      return this.registerABProcessor_adapt_user(process)
    }
  }

  private static registerABProcessor_adapt_simp(sim: ABProcessorSpecSimp):ABProcessorSpec{
    //type t_param = Parameters<typeof sim.process>
    //type t_return = ReturnType<typeof sim.process>
    const abProcessorSpec: ABProcessorSpec = {
      id: sim.id,
      name: sim.name,
      match: sim.match??sim.id,
      default: sim.default??(!sim.match||typeof(sim.match)=="string")?sim.id:null,
      detail: sim.detail??"",
      process_alias: sim.process_alias??"",
      process_param: sim.process_param??null,
      process_return: sim.process_return??null,
      process: sim.process,
      is_disable: false,
      register_from: "内置",
    }
    return abProcessorSpec
  }

  private static registerABProcessor_adapt_user(sim: ABProcessorSpecUser):ABProcessorSpec{
    const abProcessorSpec: ABProcessorSpec = {
      id: sim.id,
      name: sim.name,
      match: /^\//.test(sim.match)?RegExp(sim.match):sim.match,
      default: null,
      detail: "",
      process_alias: sim.process_alias,
      process_param: null,
      process_return: null,
      process: ()=>{},
      is_disable: false,
      register_from: "用户",
    }
    return abProcessorSpec
  }
}

/**
 * ab处理器 - 语法糖版，的接口与注册函数
 * 
 * 使用 ab处理器接口 - 用户语法糖版
 * 不允许直接写严格版的，有些参数不能让用户填。例如：
 * 
 * is_disable：是否禁用
 * register_from：来源
 * 
 */
export interface ABProcessorSpecSimp{
  id: string                // 唯一标识（当不填match时也会作为匹配项）
  name: string              // 处理器名字
  match?: RegExp|string     // 处理器匹配正则（不填则为id，而不是name！name可以被翻译或是重复的）如果填写了且为正则类型，不会显示在下拉框中
  default?: string|null     // 下拉选择的默认规则，不填的话：非正则默认为id，有正则则为空
  detail?: string           // 处理器描述
  // is_render?: boolean    // 是否渲染处理器，默认为true。false则为文本处理器
  process_alias?: string    // 组装，如果不为空串则会覆盖process方法，但扔需要给process一个空实现
  process_param?: ProcessDataType
  process_return?: ProcessDataType
  process: (el:HTMLDivElement, header:string, content:string)=> any
                        // 处理器
}

/**
 * ab处理器 - 用户版，的接口与注册函数
 * 
 * @detail
 * 使用 ab处理器接口 - 用户版（都是字符串存储）
 * 特点：不能注册process（无法存储在txt中），只能注册别名
 */
export interface ABProcessorSpecUser{
  id:string
  name:string
  match:string
  process_alias:string
}
