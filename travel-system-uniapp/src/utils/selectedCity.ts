import { cityApi, type ApiResponse } from '@/api/content'

export type SelectedCity = { id: number; name: string; ts?: number }

export function getSelectedCity(): SelectedCity | null {
  const raw = uni.getStorageSync('ticket_selected_city') as SelectedCity | null
  if (!raw?.id || !raw?.name) return null
  return raw
}

/** 用最新城市列表校正本地已选城市的名称（后台改名后生效） */
export async function syncSelectedCityName(): Promise<SelectedCity | null> {
  const selected = getSelectedCity()
  if (!selected) return null
  try {
    const res = await cityApi.list()
    const data = res.data as ApiResponse<any[]>
    if (res.statusCode !== 200 || data.code !== 200) return selected
    const row = (data.data || []).find((c: any) => Number(c.id) === Number(selected.id))
    if (!row) return selected
    const name = row.cityName || row.name
    if (!name || name === selected.name) return selected
    const updated: SelectedCity = { ...selected, name }
    uni.setStorageSync('ticket_selected_city', updated)
    return updated
  } catch {
    return selected
  }
}
