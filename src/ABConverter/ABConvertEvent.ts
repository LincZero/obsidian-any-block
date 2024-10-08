/**
 * 一些AB块的后触发事件
 * 
 * @detail
 * 普通的AB块Dom结构生成后就不需要再动了，而有的AB块需要被完全渲染后再进行一些操作。
 * 
 * 这些操作统一注册在此处
 */

import { MarkdownEditView } from "obsidian";

/**
 * 一些AB块的后触发事件 - css加载完触发
 * 
 * @param d 这里有两种可能：
 *   - 一是局部刷新，d就是局部的div，此时d必须是 `.ab-replace`，且满足预设结构
 *   - 二是全局刷新，当页面加载完成后会自动调一次，d就是document
 */
export function abConvertEvent(d: Element|Document) {
  // 超宽div事件 (仅obsidian)，这个事件应该优先处理
  if (d.querySelector('.ab-super-width')) {
    // 局部 (仅obsidian)
    const els_note: NodeListOf<Element> = d.querySelectorAll(".ab-note");
    for (const el_note of els_note) {
      if (el_note.querySelector(".ab-super-width")) {
        const el_replace: ParentNode | null | undefined = el_note.parentNode;
        if (el_replace && (el_replace as HTMLElement).classList.contains("ab-replace")) {
          (el_replace as HTMLElement).classList.add("ab-super-width-p");
        }
      }
    }
    // 全局 (仅obsidian)，注意这里在docuemnt而非d上寻找
    const els_view: NodeListOf<Element> = document.querySelectorAll(".app-container .workspace-leaf"); // 支持多窗口
    for (const el_view of els_view) {
      (el_view as HTMLElement).style.setProperty('--ab-width-outer', ((el_view as HTMLElement).offsetWidth - 40).toString() + "px"); // 40/2是边距 (必须大于滚动条)
    }
  }

  // list2nodes，圆弧调整事件
  if (d.querySelector('.ab-nodes-node')) {
    const els_min = document.querySelectorAll(".ab-nodes.min .ab-nodes-node");
    const list_children = d.querySelectorAll(".ab-nodes-node")
    for (let children of list_children) {
      // 元素准备
      const el_content = children.querySelector(".ab-nodes-content") as HTMLElement; if (!el_content) continue
      const el_child = children.querySelector(".ab-nodes-children") as HTMLElement; if (!el_child) continue
      const el_bracket = el_child.querySelector(".ab-nodes-bracket") as HTMLElement; if (!el_bracket) continue
      const el_bracket2 = el_child.querySelector(".ab-nodes-bracket2") as HTMLElement; if (!el_bracket2) continue
      const els_child = el_child.childNodes;
      if (els_child.length < 3) {
        el_bracket.style.setProperty("display", "none")
        el_bracket2.style.setProperty("display", "none")
        continue
      }
      const el_child_first = els_child[2] as HTMLElement;
      const el_child_last = els_child[els_child.length - 1] as HTMLElement;
      const el_child_first_content = el_child_first.querySelector(".ab-nodes-content") as HTMLElement
      const el_child_last_content = el_child_last.querySelector(".ab-nodes-content") as HTMLElement

      // 参数准备
      // 有两种情况，如果height非零则高度等于 (height) (通常1-1结构会是这种情况)，若无则高度等于 (100%-heightToReduce)
      let height = 0;
      let heightToReduce = (el_child_first.offsetHeight + el_child_last.offsetHeight) / 2;

      // 修改伪类
      if (els_child.length == 3) { // 结构：1-1
        height = (el_child_first_content.offsetHeight-20) > 20 ? (el_child_first_content.offsetHeight-20) : 20
        el_bracket2.style.cssText = `
          height: ${height}px;
          top: calc(50% - ${height/2}px);
        `
      } else { // 结构：1-n
        el_bracket2.style.cssText = `
          height: calc(100% - ${heightToReduce}px);
          top: ${el_child_first.offsetHeight/2}px;
        `
      }

      // 修改伪类 - min样式版 (注意：不要因为用cssText覆盖而把样式给漏了)
      if (Array.prototype.includes.call(els_min, children)) {
        if (els_child.length == 3) { // 结构：1-1，有圆点
          el_bracket.style.cssText = `
            display: block;
            top: calc(50% + ${el_content.offsetHeight/2}px - 3px);
            clip-path: circle(40% at 50% 40%);
          `
        } else { // 结构：1-n，无圆点，是延长线
          el_bracket.setAttribute("display", "none")
          // el_bracket.style.cssText = `
          //   display: block;
          //   height: 1px;
          //   top: calc(50% + ${el_content.offsetHeight/2}px - 1px);
          //   width: 18px; /* 可以溢出点 */
          //   left: -20px;
          //   border-bottom: 1px solid var(--node-color);
          //   clip-path: none;
          // `
        }

        if (els_child.length == 3 && el_content.offsetHeight == el_child_first_content.offsetHeight) { // 结构：1-1且高度相同，则用横线代替括号
          el_bracket2.style.cssText = `
            height: 1px;
            top: calc(50% + ${el_content.offsetHeight/2}px - 1px);
            width: 18px; /* 可以溢出点 */
            border-radius: 0;
            border: none;
            border-bottom: 1px solid var(--node-color);
          `
        }
        else { // 否则在原有基础上微调即可
          // el_bracket2.style.setProperty("border-radius", "2px 0 0 2px")
          // if (height==0) {
          //   el_bracket2.style.setProperty("height", `calc(100% - ${heightToReduce}px + 12px)`); // 原基础+12 (应该要加 el_child_last_content 的半高)
          // } else {
          //   el_bracket2.style.setProperty("height", `${height+10}px`); // 原基础+10
          // }
          if (els_child.length == 3) {
            height = el_child_last_content.offsetHeight/2 - el_content.offsetHeight/2;
            el_bracket2.style.setProperty("height", `${height}px`);
            el_bracket2.style.setProperty("top", `calc(50% + ${el_content.offsetHeight/2}px)`);
            el_bracket2.style.setProperty("border-radius", `0 0 0 10px`);
            el_bracket2.style.setProperty("border-top", `0`);
          } else {
            heightToReduce = el_child_first.offsetHeight/2 + el_child_first_content.offsetHeight/2 + el_child_last.offsetHeight/2 - el_child_last_content.offsetHeight/2;
            el_bracket2.style.setProperty("height", `calc(100% - ${heightToReduce}px + 1px)`);
            el_bracket2.style.setProperty("top", `${el_child_first.offsetHeight/2 + el_child_first_content.offsetHeight/2 - 1}px`);
          }
          el_bracket2.style.setProperty("width", "20px");
        }

        // 下面的内容弃用。存在问题：用canvas的思路应该是不对的，应该参考mehrmaid用svg，还能包裹div
        /*else {
          el_bracket2.style.setProperty("height", `100%`);
          el_bracket2.style.setProperty("top", `0`);
          el_bracket2.style.setProperty("width", `38px`); // 可以溢出点
          el_bracket2.style.setProperty("left", `-20px`);
          el_bracket.style.setProperty("display", "none");

          const el_canvas: HTMLCanvasElement = document.createElement("canvas"); el_bracket2.appendChild(el_canvas);
            el_canvas.style.setProperty("width", "100%")
            el_canvas.style.setProperty("height", "100%")
          const rect_canvas = el_canvas.getBoundingClientRect()
          const rect_bracket = el_bracket2.getBoundingClientRect()
          const point_bracket = {
            x: rect_bracket.right - rect_canvas.left,
            y: rect_bracket.bottom - rect_canvas.top
          };
          for (let childNode of childNodes) { // TODO 应该跳过前两个，前两个是括号
            const rect_childNode = (childNode as HTMLElement).getBoundingClientRect()
            const point_childNode = {
              x: rect_childNode.right - rect_canvas.left,
              y: rect_childNode.bottom - rect_canvas.top
            }
            // 连线
            const ctx = el_canvas.getContext('2d');
            if (!ctx) continue;
            console.log(".ab-nodes.min 获取 canvas ctx 成功", rect_canvas, rect_bracket, rect_childNode) // canvas和bracket是重合的其实……
            // ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除画布
            ctx.beginPath(); // 开始绘制连线
            ctx.moveTo(point_bracket.x - point_bracket.x, point_bracket.y - point_bracket.x);
            ctx.lineTo(point_childNode.x - point_bracket.x, point_childNode.y - point_bracket.x);
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }*/
      }
    }
  }

  // list2card，瀑布流卡片顺序重调事件
  if (d.querySelector('.ab-items.ab-card:not(.js-waterfall)')) {
    const root_el_list = d.querySelectorAll(".ab-items.ab-card:not(.js-waterfall)")
    for (let root_el of root_el_list) {
      // 1. 准备原元素
      root_el.classList.add("js-waterfall") // 避免：触发两次时，第二次触发会以第一次触发的顺序为基准，再进行调整
      const list_children = root_el.querySelectorAll(".ab-items-item")
      // 计算列数和列宽
      const columnCountTmp = parseInt(window.getComputedStyle(root_el).getPropertyValue('column-count'))
      let columnCount: number;
      if (columnCountTmp && !isNaN(columnCountTmp) && columnCountTmp>0) {
        columnCount = columnCountTmp;
      } else if (root_el.classList.contains("ab-col-auto") && list_children.length<=4) {
        columnCount = list_children.length;
        root_el.classList.add("ab-col"+columnCount)
      }
      else {
        columnCount = 4;
        root_el.classList.add("ab-col"+columnCount)
      }
      // const columnWidth = root_el.clientWidth / columnCount;

      // 2. 准备高度缓存、元素缓存
      let height_cache:number[] = []; // 缓存每列的当前高度，每次将新元素添加到高度最底的列中
      let el_cache:HTMLElement[][] = [];
      for (let i = 0; i < columnCount; i++) {
        height_cache.push(0);
        el_cache.push([])
      }

      // 3. 得到顺序数组
      for (let children of list_children) {
        const minValue: number =  Math.min.apply(null, height_cache);
        const minIndex: number =  height_cache.indexOf(minValue)
        const heightTmp = parseInt(window.getComputedStyle(children).getPropertyValue("height"))
        height_cache[minIndex] += (heightTmp && !isNaN(heightTmp) && heightTmp>0) ? heightTmp : 10;
        el_cache[minIndex].push(children as HTMLElement)
      }

      // 3.2. 修复特殊情况下的异常：
      //    特殊情况指：当分N列时，若 (length%N != 0 || length%N != N-1)，存在问题
      //    或写成这样好理解些：当 (length%(N-1) != N || length%(N-1) != N-1)，最后一列会缺好几个时，存在问题
      const fillNumber = columnCount-list_children.length%columnCount
      if (fillNumber!=4) {
        for (let i=0; i<fillNumber; i++) {
          const children = document.createElement("div"); children.classList.add(".ab-items-item.placeholder"); children.setAttribute("style", "height: 20px")
          const minValue: number =  Math.min.apply(null, height_cache);
          const minIndex: number =  height_cache.indexOf(minValue)
          height_cache[minIndex] += 20
          el_cache[minIndex].push(children as HTMLElement)
        }
      }

      // 4. 按顺序重新填入元素
      root_el.innerHTML = ""
      for (let i=0; i<columnCount; i++) {
        for (let j of el_cache[i]) {
          root_el.appendChild(j)
        }
      }
    }
  }

  // xxx2markmap，高度重调事件
  if (d.querySelector('.ab-markmap-div')) {
    const divEl = d as Element;
    let markmapId = '';
    if (divEl.tagName === 'DIV') {
      markmapId = divEl.querySelector('.ab-markmap-div')?.id || '';
    }
    let mindmaps: NodeListOf<HTMLElement>;
    if (markmapId) {
      mindmaps = document.querySelectorAll('#' + markmapId);
    } else {
      mindmaps = document.querySelectorAll('.ab-markmap-div'); // 注意一下这里的选择器
    }

    for(const el_div of mindmaps) {
      const el_svg: SVGGraphicsElement|null = el_div.querySelector("svg")
      const el_g: SVGGraphicsElement|null|undefined = el_svg?.querySelector("g")
      if (el_svg && el_g) {
        // 获取缩放倍数
        // const transformValue = el_g.getAttribute('transform');
        // if (transformValue && transformValue.indexOf('scale') > -1) {
        //   const scaleMatch = transformValue.match(/scale\(([^)]+)\)/);
        //   if (scaleMatch) {
        //     const scale_old = parseFloat(scaleMatch[1]);
        //     ...
        //   }
        // }
        const scale_new = el_g.getBBox().height/el_div.offsetWidth;
        el_svg.setAttribute("style", `height:${el_g.getBBox().height*scale_new+40}px`); // 重调容器大小
        // el_g.setAttribute("transform", `translate(20.0,80.0) scale(${scale_new})`) // 重调位置和缩放
        markmap_event(d) // 好像调位置有问题，只能重渲染了……
      }
    }
  }
}

/**
 * 一些AB块的后触发事件 - dom加载完触发 - markmap
 */
export function markmap_event(d: Element|Document) {
  // xxx2markmap，渲染事件
  if (d.querySelector('.ab-markmap-svg')) {
    console.log("  - markmap_event")
    let script_el: HTMLScriptElement|null = document.querySelector('script[script-id="ab-markmap-script"]');
    if (script_el) script_el.remove();
    const divEl = d as Element;
    let markmapId = '';
    if (divEl.tagName === 'DIV') {
      markmapId = divEl.querySelector('.ab-markmap-svg')?.id || '';
    }
    script_el = document.createElement('script'); document.head.appendChild(script_el);
    script_el.type = "module";
    script_el.setAttribute("script-id", "ab-markmap-script");
    script_el.textContent = `
    import { Markmap, } from 'https://jspm.dev/markmap-view';
    const markmapId = "${markmapId || ''}";
    let mindmaps;
    if (markmapId) {
      mindmaps = document.querySelectorAll('#' + markmapId);
    } else {
      mindmaps = document.querySelectorAll('.ab-markmap-svg'); // 注意一下这里的选择器
    }
    for(const mindmap of mindmaps) {
      mindmap.innerHTML = "";
      Markmap.create(mindmap,null,JSON.parse(mindmap.getAttribute('data-json')));
    }`;
  }
}
