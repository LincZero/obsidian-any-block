<script lang="ts">
  import { onMount } from 'svelte';
  import { MarkdownRenderer, MarkdownRenderChild } from 'obsidian'
  import type {List_ListInfo} from "src/replace/listProcess"

  export let list_itemInfo:List_ListInfo;
  export let modeMD:boolean;
  export let modeT:boolean;

  let tab:HTMLDivElement;
  onMount(async()=>{
    tab.addClass("ab-tab-root")
    if (modeT) tab.setAttribute("modeT", "true")
    const ul = tab.createEl("ul")
    const content = tab.createDiv()
    let current_dom:HTMLElement|null = null
    for (let i=0; i<list_itemInfo.length; i++){
      const itemInfo = list_itemInfo[i]
      if (!current_dom){            // 找开始标志
        if (itemInfo.level==0){
          ul.createEl("li", {
            cls: ["ab-tab-tab"],
            text: itemInfo.content.slice(0,20),
            attr: {"is_activate":i==0?"true":"false"}
          })
          current_dom = content.createDiv({
            cls: ["ab-tab-content"],
            attr: {"style": i==0?"display:block":"display:none", "is_activate":i==0?"true":"false"}
          })
        }
      }
      else{                         // 找结束，不需要找标志，因为传过来的是二层一叉树
        if (modeMD) {
          const child = new MarkdownRenderChild(current_dom);
          MarkdownRenderer.renderMarkdown(itemInfo.content, current_dom, "", child);
        }
        else{
          current_dom.innerHTML = itemInfo.content.replace(/\n/g, "<br/>")
        }
        current_dom = null
      }
    }
    // 元素全部创建完再来绑按钮事件，不然有可能有问题
    const lis:NodeListOf<HTMLLIElement> = tab.querySelectorAll(".ab-tab-tab")
    const contents = tab.querySelectorAll(".ab-tab-content")
    if (lis.length!=contents.length) console.warn("ab-tab-tab和ab-tab-content的数量不一致")
    for (let i=0; i<lis.length; i++){
      lis[i].onclick = ()=>{
        for (let j=0; j<contents.length; j++){
          lis[j].setAttribute("is_activate", "false")
          contents[j].setAttribute("is_activate", "false")
          contents[j].setAttribute("style", "display:none")
        }
        lis[i].setAttribute("is_activate", "true")
        contents[i].setAttribute("is_activate", "true")
        contents[i].setAttribute("style", "display:block")
      }
    }
  })
</script>

<div bind:this={tab}>
</div>
