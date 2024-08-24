/**
 * AB转换器的抽象基类
 * 
 * @detail
 * 被所有权：ABConvertManager
 */

import { ABConvertManager } from "../ABConvertManager"
import type { List_C2ListItem } from "./abc_c2list"
import type { List_ListItem } from "./abc_list"
import type { List_TableItem } from "./abc_table"

/**
 * ab处理器子接口 - 类型声明
 * 
 * @detail
 * TODO 待增加一个list和json专用格式
 */
export enum ABConvert_IOEnum {
  text = "string", // string
  el = "HTMLElement", // HTMLElement
  // el_text = "string", // string
  json = "json_string", // string
  list_strem = "array", // object
  c2list_strem = "array2", // object  
}
export type ABConvert_IOType =
  string|           // text/el_text
  HTMLElement|      // html元素
  void|             // TODO void是旧的别名系统，以后要删掉
  List_ListItem|    // 多叉树 数据流
  List_C2ListItem|  // 二层树 数据流
  List_TableItem|   // 表格用 数据流
  Object            // json对象

/**
 * AB转换器的抽象基类
 * 
 * @detail
 * 被所有权：ABConvertManager
 */
export class ABConvert {

  /** --------------------------------- 静态参数 -------------------------- */

  id: string                      // 唯一标识（当不填match时也会作为匹配项）
  name: string                    // 处理器名字
  match: RegExp|string            // 处理器匹配正则（不填则为id，而不是name！name可以被翻译或是重复的）如果填写了且为正则类型，不会显示在下拉
  default: string|null            // 下拉选择的默认规则，不填的话：非正则默认为id，有正则则为空
  detail: string                  // 处理器描述
  process_alias: string           // 组装，如果不为空串则会覆盖process方法，但扔需要给process一个空实现
  process_param: ABConvert_IOEnum|null
  process_return: ABConvert_IOEnum|null
  process: (el:HTMLDivElement, header:string, content:ABConvert_IOType)=> ABConvert_IOType // html->html的处理器不需要用到content参数
  is_disable: boolean = false     // 是否禁用，默认false
  register_from: string = "内置"  // 自带、其他插件、面板设置，如果是其他插件，则需要提供插件的名称（不知道能不能自动识别）
                                  // TODO，这个词条应该修改成 “作者名” 鼓励二次开发

  /** --------------------------------- 动态参数 -------------------------- */

  // 非注册项：
  // ~~is_inner：这个不可设置，用来区分是内部还是外部给的~~
  is_enable: boolean = false      // 加载后能禁用这个项

  /** --------------------------------- 特殊函数 -------------------------- */

  /// 构造 + 容器管理
  public static factory(process: ABConvert_SpecSimp| ABConvert_SpecUser): ABConvert {
    let ret: ABConvert = new ABConvert(process)
    ABConvertManager.getInstance().list_abConvert.push(ret)
    return ret 
  }

  /// 构造函数
  /// TODO 应该将注册修改为创建实例，因为里面有动态参数
  /// TODO id冲突提醒
  /// TODO 别名功能删除，由独立的别名模块负责，不集成在转换器里 
  /// (优点是转换器功能保持单一性和可复用性，二是允许无代码设置别名，缺点是二次开发者需要多注册一次或独立设置转换器)
  constructor(process: ABConvert_SpecSimp| ABConvert_SpecUser) {
    // 注册版
    if ('process' in process) {
      this.constructor_simp(process)
    }
    // 别名版
    else {
      this.constructor_user(process)
    }
  }

  constructor_simp(sim: ABConvert_SpecSimp) {
    this.id = sim.id
    this.name = sim.name
    this.match = sim.match??sim.id
    this.default = sim.default??(!sim.match||typeof(sim.match)=="string")?sim.id:null
    this.detail = sim.detail??""
    this.process_alias = sim.process_alias??""
    this.process_param = sim.process_param??null
    this.process_return = sim.process_return??null
    this.process = sim.process
    this.is_disable = false
    this.register_from = "内置"
  }

  constructor_user(sim: ABConvert_SpecUser) {
    this.id = sim.id
    this.name = sim.name
    this.match = /^\//.test(sim.match)?RegExp(sim.match):sim.match
    this.default = null
    this.detail = ""
    this.process_alias = sim.process_alias
    this.process_param = null
    this.process_return = null
    this.process = ()=>{}
    this.is_disable = false
    this.register_from = "用户"
  }

  /// 析构函数
  destructor() {
    // ABConvertManager.getInstance().list_abConvert.remove(this) // 旧，remove接口是ob定义的
    
    const index = ABConvertManager.getInstance().list_abConvert.indexOf(this)
    if (index > -1) {
      ABConvertManager.getInstance().list_abConvert.splice(index, 1)
    }
  }
  
  /** --------------------------------- 处理器容器管理 (旧) --------------- */

  /*
  /// 用户注册处理器
  public static registerABProcessor(process: ABProcessorSpec| ABProcessorSpecSimp| ABProcessorSpecUser){
    ABConvertManager.getInstance().list_abConvert.push(ABProcessorSpec.registerABProcessor_adapt(process));
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
  */
}

/**
 * ab转换器的注册参数类型
 */
export interface ABConvert_SpecSimp{
  id: string                // 唯一标识（当不填match时也会作为匹配项）
  name: string              // 处理器名字
  match?: RegExp|string     // 处理器匹配正则（不填则为id，而不是name！name可以被翻译或是重复的）如果填写了且为正则类型，不会显示在下拉框中
  default?: string|null     // 下拉选择的默认规则，不填的话：非正则默认为id，有正则则为空
  detail?: string           // 处理器描述
  process_alias?: string    // 组装，如果不为空串则会覆盖process方法，但扔需要给process一个空实现
  process_param?: ABConvert_IOEnum
  process_return?: ABConvert_IOEnum
  process: (el:HTMLDivElement, header:string, content:ABConvert_IOType)=> ABConvert_IOType
                            // 处理器。话说第三个参数以前是只能接收string的，现在应该改为：上一次修改后的结果
}

/**
 * ab转换器的注册参数类型 - 别名版
 * TODO：后续删除，别名系统用另一个模块来处理
 * 
 * @detail
 * 使用 ab处理器接口 - 用户版（都是字符串存储）
 * 特点：不能注册process（无法存储在txt中），只能注册别名
 */
export interface ABConvert_SpecUser{
  id:string
  name:string
  match:string
  process_alias:string
}
