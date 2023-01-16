
// 匹配关键字接口
export interface SpecKeyword {
  from: number,
  to: number,
  keyword: string,
  match: string
}

// 块 - 匹配关键字
export function blockMatch_keyword(mdText: string): SpecKeyword[] {
  let listSpecKeyword = lineMatch_keyword(mdText)
  return line2BlockMatch(listSpecKeyword)
}

// 行 - 匹配关键字
function lineMatch_keyword(mdText: string): SpecKeyword[] {
  const matchInfo: SpecKeyword[] = []
  const regExp = /%{|%}/gi
  const matchList: RegExpMatchArray|null= mdText.match(regExp);        // 匹配项

  if (!matchList) return []
  let prevIndex = 0
  for (const matchItem of matchList){
    const from2 = mdText.indexOf(matchItem, prevIndex)
    const to2 = from2 + matchItem.length;
    prevIndex = to2;
    matchInfo.push({
      from: from2,
      to: to2,
      keyword: matchItem,
      match: "%{|%}"
    })
  }
  return matchInfo
}

// 转化 - 匹配关键字
function line2BlockMatch(listSpecKeyword: SpecKeyword[]): SpecKeyword[]{
  let countBracket = 0  // 括号计数
  let prevBracket = []  // 括号栈
  let listSpecKeyword_new = []
  for (const matchItem of listSpecKeyword) {
    if (matchItem.keyword=="%{") {
      countBracket++
      prevBracket.push(matchItem.from)
    }
    else if(matchItem.keyword=="%}" && countBracket>0) {
      countBracket--
      listSpecKeyword_new.push({
        from: prevBracket.pop() as number,
        to: matchItem.to,
        keyword: "",
        match: "%{}"
      })
    }
  }
  return listSpecKeyword_new
}
