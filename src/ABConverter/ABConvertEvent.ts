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
 *   - 一是局部刷新，d就是局部的div
 *   - 二是全局刷新，当页面加载完成后会自动调一次，d就是document
 */
export function abConvertEvent(d: Element|Document) {
  // list2nodes，圆弧调整事件
  if (d.querySelector('.ab-nodes-node')) {
    const els_min = document.querySelectorAll(".ab-nodes.min .ab-nodes-node");
    const list_children = d.querySelectorAll(".ab-nodes-node")
    for (let children of list_children) {
      // 元素准备
      const el_child = children.querySelector(".ab-nodes-children") as HTMLElement; if (!el_child) continue
      const el_bracket = el_child.querySelector(".ab-nodes-bracket") as HTMLElement; if (!el_bracket) continue
      const el_bracket2 = el_child.querySelector(".ab-nodes-bracket2") as HTMLElement; if (!el_bracket2) continue
      const childNodes = el_child.childNodes;
      if (childNodes.length < 3) {
        el_bracket.style.setProperty("display", "none")
        el_bracket2.style.setProperty("display", "none")
        continue
      }
      const el_child_first = childNodes[2] as HTMLElement;
      const el_child_last = childNodes[childNodes.length - 1] as HTMLElement;

      // if (childNodes.length == 3) { 
      //   const heightToReduce = (el_child_first.offsetHeight + el_child_last.offsetHeight) / 2;
      //   el_bracket2.style.setProperty("height", `0`);
      //   el_bracket2.style.setProperty("top", `${el_child_first.offsetHeight/2-2}px`);
      // }

      // 修改伪类
      // 以前这里只判断childNodes.length，但后来发现哪怕后面只有一个，但这一个后面可能又接不止一个。所以要动态多算下高度
      const heightToReduce = (el_child_first.offsetHeight + el_child_last.offsetHeight) / 2;
      if (childNodes.length == 3 && el_bracket2.offsetHeight - heightToReduce < 20) {
        el_bracket2.style.setProperty("height", `20px`);
        el_bracket2.style.setProperty("top", `${el_child_first.offsetHeight/2-10}px`);
      } else {
        el_bracket2.style.setProperty("height", `calc(100% - ${heightToReduce}px)`);
        el_bracket2.style.setProperty("top", `${el_child_first.offsetHeight/2}px`);
      }

      // min版 (存在问题：内换行有问题，而且样式不统一。而且用canvas的思路应该是不对的，应该参考mehrmaid用svg，还能包裹div)
      /*if (Array.prototype.includes.call(els_min, children)) {
        if (childNodes.length == 3 && el_bracket2.offsetHeight - heightToReduce < 20) {
          el_bracket2.style.setProperty("height", `0px`);
          el_bracket2.style.setProperty("top", `${el_child_first.offsetHeight/2+11}px`);
          el_bracket2.style.setProperty("border-top", `none`);
          el_bracket2.style.setProperty("width", `38px`); // 可以溢出点
          el_bracket2.style.setProperty("left", `-20px`);
          el_bracket.style.setProperty("display", "none");
        }
        else {
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
        }
      }*/
    }
  }

  // list2card，瀑布流卡片顺序重调事件
  if (d.querySelector('.ab-items.ab-card:not(.js-waterfall)')) {
    const root_el_list = d.querySelectorAll(".ab-items.ab-card:not(.js-waterfall)")
    for (let root_el of root_el_list) {
      // 1. 准备原元素
      root_el.classList.add("js-waterfall") // 避免：触发两次时，第二次触发会以第一次触发的顺序为基准，再进行调整
      const list_children = root_el.querySelectorAll(".ab-items-item")
      const columnCountTmp = parseInt(window.getComputedStyle(root_el).getPropertyValue('column-count'))
      const columnCount: number = (columnCountTmp && columnCountTmp>0)?columnCountTmp:4 // 计算列数和列宽
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
        height_cache[minIndex] += parseInt(window.getComputedStyle(children).getPropertyValue("height"))
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
