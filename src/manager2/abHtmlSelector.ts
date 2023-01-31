import {
  MarkdownPostProcessor, 
  MarkdownPostProcessorContext
} from "obsidian"

/** 选择器接口 */
export interface ElSelectorSpec {
  selector: string,
  els: NodeListOf<HTMLElement>
}

/** 选择器列表 */
export let list_ABHtmlSelector:any[]=[]
function register_list_mdSelector(){
  return function (target: Function){
    list_ABHtmlSelector.push(target)
  }
}

/** Html范围选择器
 * 用完整的Html，筛选出合适范围的Html
 */
export class ABHtmlSelector{
  static listSelector(
    el: HTMLElement, 
    ctx: MarkdownPostProcessorContext
  ): ElSelectorSpec {
    throw("Have no override ABHtmlSelector::listSelector")
  }
}

@register_list_mdSelector()
class Selector_InlineCode extends ABHtmlSelector{
  static listSelector(
    el: HTMLElement, 
    ctx: MarkdownPostProcessorContext
  ): ElSelectorSpec {
    const codeblocks = el.querySelectorAll("code");
    return {
      selector: "code",
      els: codeblocks
    }
  }
}
