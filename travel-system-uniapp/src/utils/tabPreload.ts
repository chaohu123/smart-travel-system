import { activityApi } from '@/api/activity'
import { cityApi, scenicSpotApi, tagApi, travelNoteApi } from '@/api/content'

let hasPreloaded = false

const runSoon = (task: () => void, delay = 800) => {
  setTimeout(task, delay)
}

export const preloadTabData = () => {
  if (hasPreloaded) return
  hasPreloaded = true

  runSoon(() => {
    Promise.allSettled([
      cityApi.list(),
      tagApi.list(),
      travelNoteApi.list({ pageNum: 1, pageSize: 10, sortBy: 'hot' }),
      scenicSpotApi.list({ pageNum: 1, pageSize: 1000 }),
      activityApi.getList({ status: 'online', pageNum: 1, pageSize: 10 }),
    ]).catch(() => {
      hasPreloaded = false
    })
  })
}
