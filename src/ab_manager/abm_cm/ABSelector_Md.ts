/**
 * MD选择器
 * 旧方案
 *  - 每个选择器对全文进行一次选择
 *  - 缺点：不同选择器的选择区域可能会重叠
 *    逻辑不清晰
 *    上一层需要获取选择器列表，再在上一层遍历
 * 新方案（v1.4.0）
 *  - 每一行匹配一次全部选择器
 *  - 优点：不同选择器的选择区域不会重叠，判断次数不变，只遍历全文一次
 *    逻辑更清晰
 *    内部处理选择器列表，封装性更好
 *  - 设计
 *    选择了与abProceesor相似的接口
 */

/**
 * 与自动处理器相似，但不需要那么多的东西
 * 
 * 自动选择器（仅md版，html逻辑不同，是区分局部和全局选择器的）：
 *  - 自动选择（使用列表）
 *  - 选择器注册接口与函数（一个版本）
 *  - 有返回类型接口
 * 
 * 自动处理器：
 *  - 自动处理（使用列表）
 *  - 处理器注册接口与函数（三个版本）
 *  - 无返回类型接口
 *  - 信息一览表
 */
export function autoMdSelector(
  mdText: string = "",      // 全文文本
  // setting: ABSettingInterface,
):MdSelectorRangeSpec[]{
  let list_mdSelectorRangeSpec:MdSelectorRangeSpec[] = []
  let list_text:string[] = mdText.split("\n")

  /** 行数 - total_ch 映射表
   * 该表的长度是 行数+1
   * map_line_ch[i] = 序列i行最前面的位置
   * map_line_ch[i+1]-1 = 序列i行最后面的位置
   */
  // 创建 line-ch 映射表
  let map_line_ch: number[] = [0]
  let count_ch = 0
  for (let line of list_text){
    count_ch = count_ch + line.length + 1
    map_line_ch.push(count_ch)
  }
  // 将全文遍历为多个AB块选择范围
  for (let i=0; i<list_text.length; i++){
    const line = list_text[i]
    for (let selecotr of list_mdSelector){
      if (selecotr.match.test(line)) {
        let sim:MdSelectorRangeSpecSimp|null = selecotr.selector(list_text, i)
        if (!sim) continue
        // 语法糖
        if (sim.selector=="list") if (sim.header.indexOf("2")==0) sim.header="list"+sim.header
        if (sim.selector=="title") {
          if (sim.header.indexOf("2")==0) sim.header="title"+sim.header
          else if(sim.header.indexOf("list")==0) sim.header="title2list|"+sim.header
        }
        // 行改ch
        list_mdSelectorRangeSpec.push({
          from_ch: map_line_ch[sim.from_line],
          to_ch: map_line_ch[sim.to_line]-1,
          header: sim.header, 
          selector: sim.selector,
          content: sim.content,
          prefix: sim.prefix,
        })
        i = sim.to_line-1
        break
      }
    }
  }
  return list_mdSelectorRangeSpec
}

/** 选择器一览表 - 全部信息 */
export function generateSelectorInfoTable(el: HTMLElement){
  const table_p = el.createEl("div",{
    cls: ["ab-setting","md-table-fig1"]
  })
  const table = table_p.createEl("table",{
    cls: ["ab-setting","md-table-fig2"]
  })
  {
    const thead = table.createEl("thead")
    const tr = thead.createEl("tr")
    tr.createEl("th", {text: "Selector Name"})
    tr.createEl("th", {text: "First-line Regular"})
    tr.createEl("th", {text: "Enable"})
  }
  const tbody = table.createEl("tbody")
  for (let item of list_mdSelector){
    const tr = tbody.createEl("tr")
    tr.createEl("td", {text: item.name})
    tr.createEl("td", {text: String(item.match)})
    tr.createEl("td", {text: item.is_disable?"No":"Yes"})
  }
  return table_p
}

/** 选择器范围 - 严格版 */
export interface MdSelectorRangeSpec {
  from_ch: number,  // 替换范围
  to_ch: number,    // .
  header: string,   // 头部信息
  selector: string, // 选择器（范围选择方式）
  content: string,  // 内容信息
  prefix: string,
}
/** 选择器范围 - 简单版 */
export interface MdSelectorRangeSpecSimp {
  from_line: number,// 替换范围
  to_line: number,  // .
  header: string,   // 头部信息
  selector: string, // 选择器（范围选择方式）
  levelFlag: string,// (用来判断code符号或heading层级的)
  content: string,  // 内容信息
  prefix: string,
}
/** md选择器 - 注册版 */
export interface MdSelectorSpecSimp{
  id: string
  name: string
  match: RegExp
  detail?: string
  selector: (
    list_text: string[],    // 全文
    from_line: number,        // 从第几行开始搜索
    // confSelect: ConfSelect    // 选择器配置
  )=>MdSelectorRangeSpecSimp|null // 返回一个MdSelectorRangeSpec。然后遍历器的行数要跳转到里面的`to`继续循环
}
/** md选择器 - 严格版 */
export interface MdSelectorSpec extends MdSelectorSpecSimp{
  is_disable: boolean
}
/** md选择器列表 */
export let list_mdSelector: MdSelectorSpec[] = []
export function registerMdSelector (simp:MdSelectorSpecSimp){
  list_mdSelector.push({
    id: simp.id,
    name: simp.name,
    match: simp.match,
    detail: simp.detail??"",
    selector: simp.selector,
    is_disable: false
  })
}

// 配置返回列表
/*export function get_selectors(setting: ABSettingInterface){
  let list_ABMdSelector:any[]=[]
  // if (setting.select_list!=ConfSelect.no) list_ABMdSelector.push(map_ABMdSelector.get("list"))
  // if (setting.select_quote!=ConfSelect.no) list_ABMdSelector.push(map_ABMdSelector.get("quote"))
  // if (setting.select_code!=ConfSelect.no) list_ABMdSelector.push(map_ABMdSelector.get("code"))
  if (setting.select_brace!=ConfSelect.no) list_ABMdSelector.push(ABMdSelector_brace)
  if (setting.select_list!=ConfSelect.no) list_ABMdSelector.push(ABMdSelector_list)
  if (setting.select_quote!=ConfSelect.no) list_ABMdSelector.push(ABMdSelector_quote)
  if (setting.select_code!=ConfSelect.no) list_ABMdSelector.push(ABMdSelector_code)
  if (setting.select_heading!=ConfSelect.no) list_ABMdSelector.push(ABMdSelector_heading)
  return list_ABMdSelector
}*/

/** AnyBlock范围管理器
 * 一段文字可以生成一个实例，主要负责返回RangeSpec类型
 * 一次性使用
 */
