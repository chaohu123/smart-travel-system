import { reactive, readonly } from 'vue'
import { getCache, removeCache, setCache } from '@/utils/storage'

export interface UserProfile {
  id: number
  nickname: string
  avatar?: string
  city?: string
  interests?: string[]
  signature?: string
}

const state = reactive<{
  token: string | null
  profile: UserProfile | null
}>({
  token: getCache<string>('token'),
  profile: getCache<UserProfile>('user'),
})

export const useUserStore = () => {
  const setUser = (profile: UserProfile, token?: string) => {
    state.profile = profile
    if (token) {
      state.token = token
      setCache('token', token, 24 * 60)
    }
    setCache('user', profile, 24 * 60)
  }

  const logout = () => {
    state.profile = null
    state.token = null
    removeCache('user')
    removeCache('token')
  }

  return {
    state: readonly(state),
    setUser,
    logout,
  }
}























