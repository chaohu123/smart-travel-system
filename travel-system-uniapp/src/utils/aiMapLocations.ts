/**
 * 从 AI 日程 intro（早/中/晚 JSON）中提取地点名称，供地图连线使用
 */

export type AiIntroPeriod = 'morning' | 'noon' | 'afternoon' | 'evening'

export type AiMapStop = {
  name: string
  period: string
  periodOrder: number
  sortOrder: number
}

const PERIOD_META: Array<{ key: AiIntroPeriod; label: string; order: number }> = [
  { key: 'morning', label: '上午', order: 1 },
  { key: 'noon', label: '中午', order: 2 },
  { key: 'afternoon', label: '下午', order: 3 },
  { key: 'evening', label: '晚上', order: 4 },
]

/** 提取【地点名】 */
export function extractBracketedPlaceNames(text: string): string[] {
  const names: string[] = []
  if (!text) return names
  const re = /【([^】\n]{2,40})】/g
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    const name = match[1].trim()
    if (name && /[\u4e00-\u9fa5]/.test(name)) {
      names.push(name)
    }
  }
  return names
}

/** 兜底：前往XXX / 抵达XXX */
export function extractLoosePlaceNames(text: string): string[] {
  const names: string[] = []
  if (!text) return names
  const patterns = [
    /(?:前往|抵达|到达|游览|参观|打卡|漫步于|行至)[「「【]?([\u4e00-\u9fa5A-Za-z0-9·（）()\-]{2,24})[」」】]?/g,
  ]
  for (const re of patterns) {
    let match: RegExpExecArray | null
    while ((match = re.exec(text)) !== null) {
      const name = match[1].trim()
      if (name && !['地铁', '公交', '出租', '轻轨', '酒店', '餐厅'].some((w) => name.includes(w))) {
        names.push(name)
      }
    }
  }
  return names
}

export function extractPlacesFromAiIntro(intro: Partial<Record<AiIntroPeriod, string>>): AiMapStop[] {
  const seen = new Set<string>()
  const stops: AiMapStop[] = []
  let sortOrder = 0

  for (const period of PERIOD_META) {
    const text = String(intro[period.key] || '').trim()
    if (!text) continue

    const bracketed = extractBracketedPlaceNames(text)
    const names = bracketed.length > 0 ? bracketed : extractLoosePlaceNames(text)

    for (const name of names) {
      const dedupeKey = name.replace(/\s/g, '')
      if (seen.has(dedupeKey)) continue
      seen.add(dedupeKey)
      sortOrder += 1
      stops.push({
        name,
        period: period.label,
        periodOrder: period.order,
        sortOrder,
      })
    }
  }

  return stops
}

export function dayHasAiIntro(intro: Partial<Record<AiIntroPeriod, string>>): boolean {
  return PERIOD_META.some((p) => String(intro[p.key] || '').trim().length > 0)
}
