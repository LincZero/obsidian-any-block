// import {registerReplace} from "src/replace/abProcessor"

/*declare global {
  var list_replace: ABReplaceProcessor[];
  var list_option: Map<string,string>;

  // 虽然允许用正则匹配，但需要提供名字，说明用的是哪条规则
  function registerRepladce(processor: ABReplaceProcessor):void;

  interface ABReplaceProcessor{
    id: string
    name: string
    is_render: boolean
    (el:HTMLDivElement, header:string, content:string): HTMLElement|null
  }
  /// 这个TS的装饰器。如果不能用，要配置一下
  /// 要靠生成器修改 list_replace 和 list_option
  function register_abReplace(): register_abReplace2;
  interface register_abReplace2{
    function (target: ABReplaceProcessor3): void
  }
  interface ABReplaceProcessor3{
    id: string
    name: string
    is_render: boolean
    process (el:HTMLDivElement, header:string, content:string): HTMLElement|null
  }
  type ABReplaceProcessor2 = {
    (el:HTMLDivElement, header:string, content:string): HTMLElement|null
  }
}*/


// 增加代码选择器推荐

// 增加列表选择器推荐
