<template>
  <view class="user-home-page">
    <!-- 用户信息区域 -->
    <view class="user-header">
      <view class="header-bg"></view>
      <view class="user-info-container">
        <!-- 头像和昵称（一行） -->
        <view class="user-top-row">
          <view class="avatar-wrapper" @click="previewAvatar">
            <image
              class="user-avatar"
              :src="userInfo.avatar || defaultAvatar"
              mode="aspectFill"
            />
            <view v-if="isOwnProfile" class="avatar-edit-icon" @click.stop="changeAvatar">
              <text class="iconfont icon-bianji"></text>
            </view>
          </view>
          <view class="user-name-section">
            <view class="name-level-row">
              <text class="user-name">{{ userInfo.nickname || '未设置昵称' }}</text>
              <text class="level-tag">LV{{ userInfo.level || 1 }}</text>
            </view>
            <!-- 经验条 -->
            <view class="exp-bar-container">
              <view class="exp-bar-bg">
                <view
                  class="exp-bar-fill"
                  :style="{ width: expProgress + '%' }"
                ></view>
              </view>
              <text class="exp-text">{{ currentExp }}/{{ nextLevelExp }}</text>
            </view>
          </view>
        </view>

        <!-- 粉丝数 关注数（一行） -->
        <view class="follow-row">
          <view class="follow-item" @click="viewFollowers">
            <text class="follow-number">{{ userStats.followers || 0 }}</text>
            <text class="follow-text">粉丝</text>
          </view>
          <view class="follow-item" @click="viewFollowing">
            <text class="follow-number">{{ userStats.following || 0 }}</text>
            <text class="follow-text">关注</text>
          </view>
        </view>

        <!-- 个性签名 -->
        <view class="signature-row">
          <text class="signature-label">个人签名：</text>
          <text class="signature-text">{{ userInfo.signature || '这个人很懒，还没有设置个性签名~' }}</text>
        </view>

        <!-- 操作按钮 -->
        <view class="action-buttons-row">
          <button
            v-if="isOwnProfile"
            class="action-btn primary-btn"
            @click="editProfile"
          >
            <text>编辑资料</text>
          </button>
          <template v-else>
            <button
              class="action-btn follow-btn"
              @click="followUser"
            >
              <text>{{ isFollowing ? '已关注' : '关注' }}</text>
            </button>
            <button
              class="action-btn chat-btn"
              @click="openChat"
            >
              <text>私信</text>
            </button>
          </template>
          <button
            v-if="isOwnProfile"
            class="action-btn checkin-btn"
            :class="{ 'checked-in': hasCheckedInToday }"
            @click="checkIn"
          >
            <text>{{ hasCheckedInToday ? '已签到' : '签到' }}</text>
          </button>
        </view>
      </view>
    </view>

    <!-- 数据面板（可点击） -->
    <view class="stats-section">
      <view class="stats-item" @click="viewNotes">
        <text class="stats-count">{{ userStats.notes || 0 }}</text>
        <text class="stats-label">游记数</text>
      </view>
      <view class="stats-divider"></view>
      <view class="stats-item">
        <text class="stats-count">{{ userStats.totalLikes || 0 }}</text>
        <text class="stats-label">获赞数</text>
      </view>
      <view class="stats-divider"></view>
      <view class="stats-item" @click="viewCheckins">
        <text class="stats-count">{{ userStats.checkins || 0 }}</text>
        <text class="stats-label">足迹数</text>
      </view>
    </view>

    <!-- 我的消息 -->
    <view v-if="isOwnProfile" class="message-section" @click="viewMessages">
      <view class="section-title-row">
        <text class="section-title-text">我的消息</text>
        <view class="message-badge" v-if="unreadMessageCount > 0">
          <text class="badge-text">{{ unreadMessageCount > 99 ? '99+' : unreadMessageCount }}</text>
        </view>
        <text class="iconfont icon-arrow-right section-arrow"></text>
      </view>
      <view class="message-preview" v-if="latestMessage">
        <text class="message-text">{{ latestMessage }}</text>
      </view>
    </view>

    <!-- 互动动态模块 -->
    <view v-if="isOwnProfile" class="interaction-section">
      <view class="section-header">
        <text class="section-title">互动动态</text>
        <text class="section-more" @click="viewAllInteractions">查看全部</text>
      </view>
      <view class="interaction-list">
        <view
          v-for="(item, index) in interactionList"
          :key="index"
          class="interaction-item"
          @click="handleInteractionClick(item)"
        >
          <view class="interaction-avatar">
            <image
              v-if="item.userAvatar"
              class="avatar-img"
              :src="item.userAvatar"
              mode="aspectFill"
            />
            <view v-else class="avatar-placeholder">{{ getInteractionIcon(item.type) }}</view>
          </view>
          <view class="interaction-content">
            <text class="interaction-text">{{ formatInteractionText(item) }}</text>
            <text class="interaction-time">{{ formatTime(item.createTime) }}</text>
          </view>
        </view>
        <view v-if="interactionList.length === 0" class="empty-interaction">
          <text class="empty-text">暂无互动动态</text>
        </view>
      </view>
    </view>


    <!-- 头像预览弹窗 -->
    <view v-if="showAvatarPreview" class="avatar-preview-modal" @click="closeAvatarPreview">
      <image
        class="preview-image"
        :src="userInfo.avatar || defaultAvatar"
        mode="aspectFit"
        @tap.stop
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { userApi } from '@/api/user'
import { useUserStore } from '@/store/user'
import { getCache, setCache } from '@/utils/storage'
import { safeNavigateTo, resetNavigationState } from '@/utils/router'

const store = useUserStore()
const currentUser = computed(() => store.state.profile)
const defaultAvatar = 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200'

// 获取页面参数
// 注意：getCurrentPages 是全局函数，在 onMounted 中调用更安全
const targetUserId = ref<number | null>(null)

// 用户信息
const userInfo = ref<any>({
  id: null,
  nickname: '',
  avatar: '',
  level: 1,
  experience: 0,
  medals: []
})
const userStats = ref({
  notes: 0,
  likes: 0,
  favorites: 0,
  comments: 0,
  checkins: 0,
  totalLikes: 0,
  followers: 0,
  following: 0
})

// 收到的消息
const unreadMessageCount = ref(0)
const latestMessage = ref('')

// 互动动态
const interactionList = ref<any[]>([])

// 是否是自己主页
const isOwnProfile = computed(() => {
  if (!targetUserId.value) return true
  return currentUser.value?.id === targetUserId.value
})

// 经验值相关
const currentExp = computed(() => userInfo.value.experience || 0)
const nextLevelExp = computed(() => {
  const level = userInfo.value.level || 1
  // 等级经验公式：每级需要 100 * level 的经验
  // 例如：LV1需要100经验，LV2需要200经验，LV3需要300经验
  return 100 * (level + 1)
})
const prevLevelExp = computed(() => {
  const level = userInfo.value.level || 1
  // 当前等级所需经验（上一级所需经验）
  // LV1从0开始，LV2需要100，LV3需要200
  if (level === 1) {
    return 0 // LV1从0开始
  }
  return 100 * (level - 1)
})
const expProgress = computed(() => {
  const current = currentExp.value
  const next = nextLevelExp.value
  const prev = prevLevelExp.value
  // 计算当前等级内的经验进度
  if (next === prev) return 100
  if (current <= prev) return 0 // 如果当前经验小于等于上一级所需经验，进度为0
  const progress = ((current - prev) / (next - prev)) * 100
  // 确保进度在0-100之间
  const result = Math.max(0, Math.min(100, progress))
  return result
})

// 加载状态
const loading = ref(false)
const refreshing = ref(false)

// 关注状态
const isFollowing = ref(false)
const showAvatarPreview = ref(false)

// 签到状态
const hasCheckedInToday = ref(false)

// 获取勋章图标
const getMedalIcon = (medal: any) => {
  const iconMap: Record<string, string> = {
    '新手': '🌱',
    '达人': '⭐',
    '专家': '🏆',
    '大师': '👑',
    '旅行家': '✈️',
    '探索者': '🗺️'
  }
  return iconMap[medal.name || medal] || '🏅'
}

// 加载用户信息
const loadUserInfo = async () => {
  const userId = targetUserId.value || currentUser.value?.id
  if (!userId) {
    uni.showToast({ title: '用户不存在', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
    return
  }

  loading.value = true
  try {
    // 获取用户基本信息（使用profile接口，它返回完整信息）
    const profileRes = await userApi.getProfile(userId)
    if (profileRes.statusCode === 200 && profileRes.data.code === 200) {
      const data = profileRes.data.data || {}
      // profile接口返回的数据结构：{ userInfo: {...}, stats: {...} }
      // 或者直接是 { id, nickname, avatar, level, experience, medals, ... }
      const userInfoData = data.userInfo || data
      userInfo.value = {
        id: userInfoData.id,
        nickname: userInfoData.nickname || '未设置昵称',
        avatar: userInfoData.avatar || '',
        level: userInfoData.level || 1,
        experience: userInfoData.experience || 0,
        medals: userInfoData.medals || [],
        signature: userInfoData.signature || ''
      }
    }

    // 获取用户统计
    const statsRes = await userApi.getStats(userId)
    if (statsRes.statusCode === 200 && statsRes.data.code === 200) {
      const stats = statsRes.data.data || {}
      userStats.value = {
        notes: stats.noteCount || 0,
        likes: stats.likeCount || 0,
        favorites: stats.favoriteCount || 0,
        comments: stats.commentCount || 0,
        checkins: stats.checkinCount || 0,
        totalLikes: stats.totalLikes || stats.likeCount || 0,
        followers: stats.followerCount || stats.followers || 0,
        following: stats.followingCount || stats.following || 0
      }
    }

    // 如果不是自己的主页，检查是否已关注
    if (!isOwnProfile.value && currentUser.value?.id) {
      try {
        // 通过检查关注列表来判断是否已关注
        const followingRes = await userApi.getFollowing(currentUser.value.id, 1, 100)
        if (followingRes.statusCode === 200 && followingRes.data.code === 200) {
          const followingList = followingRes.data.data?.list || []
          isFollowing.value = followingList.some((u: any) => u.id === userId)
        }
      } catch (error) {
        // 静默处理错误
      }
    }
  } catch (error) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    // 加载完用户信息后检查签到状态
    checkTodayCheckInStatus()
  }
}


// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  loadUserInfo()
  loadInteractions()
}

// 预览头像
const previewAvatar = () => {
  if (isOwnProfile.value) {
    showAvatarPreview.value = true
  }
}

// 关闭头像预览
const closeAvatarPreview = () => {
  showAvatarPreview.value = false
}

// 更换头像
const changeAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]
      // TODO: 上传头像到服务器
      uni.showToast({ title: '头像上传功能开发中', icon: 'none' })
    }
  })
}

// 点击防抖
let lastClickTime = 0
const CLICK_DEBOUNCE_TIME = 300

// 编辑资料
const editProfile = () => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  
  safeNavigateTo('/pages/profile/edit-profile').catch(() => {
    // 静默处理错误
  })
}

// 打开私信
const openChat = () => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  
  const targetId = targetUserId.value || userInfo.value?.id
  if (!targetId) {
    uni.showToast({ title: '用户不存在', icon: 'none' })
    return
  }
  
  safeNavigateTo(`/pages/profile/chat?userId=${targetId}&nickname=${encodeURIComponent(userInfo.value.nickname || '')}&avatar=${encodeURIComponent(userInfo.value.avatar || '')}`).catch(() => {
    // 静默处理错误
  })
}

// 检查今天是否已签到
const checkTodayCheckInStatus = () => {
  if (!isOwnProfile.value) return
  
  const today = new Date().toDateString()
  const lastCheckInDate = getCache<string>('lastCheckInDate')
  hasCheckedInToday.value = lastCheckInDate === today
}

// 签到
const checkIn = async () => {
  const userId = currentUser.value?.id
  if (!userId) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  // 检查今天是否已签到
  const today = new Date().toDateString()
  const lastCheckInDate = getCache<string>('lastCheckInDate')
  
  if (lastCheckInDate === today) {
    uni.showToast({ title: '今天已经签到过了', icon: 'none' })
    return
  }

  try {
    const res = await userApi.checkIn(userId)
    if (res.statusCode === 200 && res.data.code === 200) {
      // 保存签到日期
      setCache('lastCheckInDate', today, 24 * 60) // 24小时后过期
      hasCheckedInToday.value = true // 更新签到状态
      uni.showToast({ title: '签到成功！+10经验', icon: 'success' })
      // 刷新用户信息
      await loadUserInfo()
      // 确保状态更新
      checkTodayCheckInStatus()
    } else {
      uni.showToast({ title: res.data.msg || '签到失败', icon: 'none' })
    }
  } catch (error: any) {
    // 如果后端返回已签到错误，也更新本地缓存
    if (error?.data?.code === 400 && error?.data?.msg?.includes('已签到')) {
      setCache('lastCheckInDate', today, 24 * 60)
      hasCheckedInToday.value = true
      checkTodayCheckInStatus() // 确保状态更新
      uni.showToast({ title: '今天已经签到过了', icon: 'none' })
    } else {
      uni.showToast({ title: '签到失败，请稍后重试', icon: 'none' })
    }
  }
}

// 关注用户
const followUser = async () => {
  let currentUserId = currentUser.value?.id
  
  if (!currentUserId) {
    const cachedUser = getCache<any>('user')
    if (cachedUser?.id) {
      currentUserId = cachedUser.id
      store.setUser(cachedUser)
    }
  }
  
  const targetId = targetUserId.value || userInfo.value?.id
  
  if (!currentUserId) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  
  if (!targetId) {
    uni.showToast({ title: '用户不存在', icon: 'none' })
    return
  }

  try {
    const res = await userApi.toggleFollow(Number(currentUserId), Number(targetId))
    if (res.statusCode === 200 && res.data.code === 200) {
      isFollowing.value = !isFollowing.value
      if (isFollowing.value) {
        userStats.value.followers = (userStats.value.followers || 0) + 1
      } else {
        userStats.value.followers = Math.max(0, (userStats.value.followers || 0) - 1)
      }
      uni.showToast({
        title: isFollowing.value ? '关注成功' : '取消关注',
        icon: 'success'
      })
    } else {
      uni.showToast({ title: res.data.msg || '操作失败', icon: 'none' })
    }
  } catch (error: any) {
    uni.showToast({ title: '操作失败，请稍后重试', icon: 'none' })
  }
}

// 查看游记
const viewNotes = () => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  
  if (isOwnProfile.value) {
    safeNavigateTo('/pages/travel-note/list?my=true').catch(() => {
      // 静默处理错误
    })
  }
}

// 查看互动
const viewInteractions = () => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  
  if (isOwnProfile.value) {
    safeNavigateTo('/pages/profile/my-interaction').catch(() => {
      // 静默处理错误
    })
  }
}

// 查看足迹
const viewCheckins = () => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  
  if (isOwnProfile.value) {
    safeNavigateTo('/pages/footprint/footprint').catch(() => {
      // 静默处理错误
    })
  }
}

// 查看粉丝
const viewFollowers = () => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  
  const userId = targetUserId.value || currentUser.value?.id
  if (userId) {
    safeNavigateTo(`/pages/profile/followers?userId=${userId}`).catch(() => {
      // 静默处理错误
    })
  }
}

// 查看关注
const viewFollowing = () => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  
  const userId = targetUserId.value || currentUser.value?.id
  if (userId) {
    safeNavigateTo(`/pages/profile/following?userId=${userId}`).catch(() => {
      // 静默处理错误
    })
  }
}

// 查看消息
// 加载未读消息数量
const loadUnreadMessageCount = () => {
  // 从本地存储读取未读消息数量
  const count = getCache<number>('unread_message_count')
  unreadMessageCount.value = count || 0
}

const viewMessages = () => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  
  safeNavigateTo('/pages/profile/messages').catch(() => {
    // 静默处理错误
  })
}

// 查看全部互动
const viewAllInteractions = () => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  
  safeNavigateTo('/pages/profile/my-interaction').catch(() => {
    // 静默处理错误
  })
}

// 处理互动项点击
const handleInteractionClick = (item: any) => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  
  if (item.type === 'like' || item.type === 'comment') {
    if (item.contentId) {
      safeNavigateTo(`/pages/travel-note/detail?id=${item.contentId}`).catch(() => {
        // 静默处理错误
      })
    }
  } else if (item.type === 'follow') {
    if (item.userId) {
      safeNavigateTo(`/pages/profile/user-home?userId=${item.userId}`).catch(() => {
        // 静默处理错误
      })
    }
  } else if (item.type === 'newNote') {
    if (item.noteId) {
      safeNavigateTo(`/pages/travel-note/detail?id=${item.noteId}`).catch(() => {
        // 静默处理错误
      })
    } else if (item.userId) {
      safeNavigateTo(`/pages/profile/user-home?userId=${item.userId}`).catch(() => {
        // 静默处理错误
      })
    }
  }
}

// 格式化互动文本
const formatInteractionText = (item: any) => {
  const userName = item.userName || '某用户'
  if (item.type === 'like') {
    return `${userName} 赞了你的游记`
  } else if (item.type === 'comment') {
    return `${userName} 评论了你的游记`
  } else if (item.type === 'follow') {
    return `${userName} 关注了你`
  } else if (item.type === 'newNote') {
    return `${userName} 发布了新游记《${item.noteTitle || '新游记'}》`
  }
  return ''
}

// 获取互动图标
const getInteractionIcon = (type: string) => {
  if (type === 'like') return '👍'
  if (type === 'comment') return '💬'
  if (type === 'follow') return '➕'
  if (type === 'newNote') return '📝'
  return '🔔'
}

// 加载互动动态
const loadInteractions = async () => {
  if (!isOwnProfile.value) return
  
  try {
    // 模拟数据，实际应该从API获取
    // TODO: 调用API获取最近的点赞、评论、新关注、新游记
    const mockInteractions = [
      {
        type: 'newNote',
        userName: '旅行达人',
        userAvatar: '',
        userId: 3,
        noteId: 1,
        noteTitle: '成都美食之旅',
        createTime: new Date().toISOString()
      },
      {
        type: 'newNote',
        userName: '探索者',
        userAvatar: '',
        userId: 4,
        noteId: 2,
        noteTitle: '西安古城游记',
        createTime: new Date(Date.now() - 3600000).toISOString()
      },
      {
        type: 'like',
        userName: '旅行达人',
        userAvatar: '',
        contentId: 1,
        createTime: new Date(Date.now() - 7200000).toISOString()
      },
      {
        type: 'comment',
        userName: '探索者',
        userAvatar: '',
        contentId: 2,
        createTime: new Date(Date.now() - 10800000).toISOString()
      },
      {
        type: 'follow',
        userName: '新朋友',
        userAvatar: '',
        userId: 123,
        createTime: new Date(Date.now() - 14400000).toISOString()
      }
    ]
    interactionList.value = mockInteractions.slice(0, 5)
  } catch (error) {
    // 静默处理错误
  }
}

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return `${date.getMonth() + 1}-${date.getDate()}`
}

// 获取图片URL
const getImageUrl = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `https://your-api-domain.com${url}`
}


onMounted(() => {
  resetNavigationState()
  const pages = getCurrentPages()
  if (pages && pages.length > 0) {
    const currentPage = pages[pages.length - 1]
    const options = (currentPage as any).options || {}
    if (options.userId) {
      const userId = Number(options.userId)
      if (!isNaN(userId) && userId > 0) {
        targetUserId.value = userId
      }
    }
  }
  
  if (!currentUser.value?.id) {
    const cachedUser = getCache<any>('user')
    if (cachedUser?.id) {
      store.setUser(cachedUser)
    }
  }
  
  loadUserInfo()
  loadInteractions()
  checkTodayCheckInStatus()
  loadUnreadMessageCount()
})

// 页面显示时刷新数据（从其他页面返回时）
onShow(() => {
  if (!currentUser.value?.id) {
    const cachedUser = getCache<any>('user')
    if (cachedUser?.id) {
      store.setUser(cachedUser)
    }
  }
  
  loadUserInfo()
  checkTodayCheckInStatus()
})
</script>

<style scoped>
.user-home-page {
  min-height: 100vh;
  background-color: #f8fafb;
}

.user-header {
  position: relative;
  padding: 40rpx 0 30rpx;
  background: linear-gradient(135deg, #3ba272, #57c18c);
}

.header-bg {
  display: none;
}

.user-info-container {
  position: relative;
  padding: 0 40rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

/* 头像和昵称（一行） */
.user-top-row {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  background: #fff;
}

.avatar-edit-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40rpx;
  height: 40rpx;
  background: #3ba272;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3rpx solid #fff;
}

.avatar-edit-icon .iconfont {
  font-size: 20rpx;
  color: #fff;
}

.user-name-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.name-level-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.user-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.level-tag {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  font-size: 20rpx;
  font-weight: 600;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.4);
}

/* 经验条 */
.exp-bar-container {
  display: flex;
  align-items: center;
  gap: 12rpx;
  width: 100%;
}

.exp-bar-bg {
  flex: 1;
  height: 8rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4rpx;
  overflow: hidden;
  position: relative;
}

.exp-bar-fill {
  height: 100%;
  background: #fff;
  border-radius: 4rpx;
  transition: width 0.3s ease;
  min-width: 2rpx; /* 确保即使进度很小也能看到 */
}

.exp-text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  min-width: 100rpx;
  text-align: right;
}

/* 粉丝数 关注数（一行） */
.follow-row {
  display: flex;
  align-items: center;
  gap: 60rpx;
  padding-left: 144rpx;
}

.follow-item {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.follow-number {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
}

.follow-text {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
}

/* 个性签名 */
.signature-row {
  padding-left: 144rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.signature-label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  flex-shrink: 0;
}

.signature-text {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  flex: 1;
}

/* 操作按钮 */
.action-buttons-row {
  display: flex;
  gap: 20rpx;
  padding-left: 144rpx;
  margin-top: 8rpx;
}

.action-btn {
  padding: 16rpx 32rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  max-width: 200rpx;
}

.primary-btn {
  background: #fff;
  color: #3ba272;
  font-weight: 600;
}

.follow-btn {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 1rpx solid rgba(255, 255, 255, 0.4);
}

.chat-btn {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 1rpx solid rgba(255, 255, 255, 0.4);
}

.checkin-btn {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 1rpx solid rgba(255, 255, 255, 0.4);
}

.checkin-btn.checked-in {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.level-section {
  width: 100%;
  margin-bottom: 30rpx;
}

.level-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.level-badge {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #333;
  font-size: 24rpx;
  font-weight: bold;
  padding: 8rpx 20rpx;
  border-radius: 40rpx;
  box-shadow: 0 2rpx 8rpx rgba(255, 215, 0, 0.3);
}

.medals {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.medal-icon {
  font-size: 32rpx;
}

.medal-more {
  font-size: 24rpx;
  color: #999;
}

.exp-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.exp-bar {
  flex: 1;
  height: 16rpx;
  background: #f0f0f0;
  border-radius: 8rpx;
  overflow: hidden;
}

.exp-progress {
  height: 100%;
  background: linear-gradient(90deg, #3ba272, #57c18c);
  border-radius: 8rpx;
  transition: width 0.3s ease;
}

.exp-text {
  font-size: 22rpx;
  color: #666;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
  width: 100%;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 20rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: none;
}

.action-btn.primary {
  background: linear-gradient(135deg, #3ba272, #57c18c);
  color: #fff;
}

.action-btn.secondary {
  background: #f8fafb;
  color: #3ba272;
  border: 2rpx solid #3ba272;
}

.action-btn .iconfont {
  font-size: 28rpx;
}

.stats-section {
  display: flex;
  background: #fff;
  margin: 20rpx 40rpx;
  border-radius: 20rpx;
  padding: 40rpx 0;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.stats-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.stats-count {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.stats-label {
  font-size: 24rpx;
  color: #999;
}

.stats-divider {
  width: 1rpx;
  height: 60rpx;
  background: #eee;
  align-self: center;
}

.tabs-section {
  display: flex;
  background: #fff;
  margin: 0 40rpx 20rpx;
  border-radius: 20rpx;
  padding: 0 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 30rpx 0;
  position: relative;
}

.tab-item.active .tab-text {
  color: #3ba272;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background: #3ba272;
  border-radius: 2rpx;
}

.tab-text {
  font-size: 28rpx;
  color: #666;
}

.content-scroll {
  height: calc(100vh - 700rpx);
  padding: 0 40rpx;
}

.content-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.note-card {
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.note-cover-wrapper {
  width: 100%;
  height: 300rpx;
  overflow: hidden;
}

.note-cover {
  width: 100%;
  height: 100%;
}

.note-info {
  padding: 24rpx;
}

.note-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

.note-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.note-time {
  font-size: 24rpx;
  color: #999;
}

.note-stats {
  display: flex;
  gap: 20rpx;
}

.stat-item {
  font-size: 24rpx;
  color: #666;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 40rpx;
  gap: 24rpx;
}

.empty-icon {
  font-size: 120rpx;
  opacity: 0.3;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.load-more {
  text-align: center;
  padding: 40rpx;
  font-size: 24rpx;
  color: #999;
}

.avatar-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.preview-image {
  width: 80%;
  max-width: 600rpx;
  height: 80%;
  max-height: 600rpx;
}

/* 我的消息 */
.message-section {
  background: #fff;
  margin: 20rpx 40rpx;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.section-title-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.message-badge {
  background: #ff4757;
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  min-width: 36rpx;
  text-align: center;
}

.badge-text {
  font-size: 20rpx;
  color: #fff;
}

.section-arrow {
  font-size: 24rpx;
  color: #999;
}

.message-preview {
  padding-top: 16rpx;
  border-top: 1rpx solid #f5f5f5;
}

.message-text {
  font-size: 26rpx;
  color: #999;
  line-height: 1.6;
  display: block;
}

/* 互动动态模块 */
.interaction-section {
  background: #fff;
  margin: 20rpx 40rpx;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 40rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.section-more {
  font-size: 26rpx;
  color: #3ba272;
}

.interaction-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.interaction-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.interaction-item:last-child {
  border-bottom: none;
}

.interaction-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  width: 100%;
  height: 100%;
}

.avatar-placeholder {
  font-size: 40rpx;
}

.interaction-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.interaction-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
}

.interaction-time {
  font-size: 24rpx;
  color: #999;
}

.empty-interaction {
  text-align: center;
  padding: 60rpx 0;
}

.empty-interaction .empty-text {
  font-size: 26rpx;
  color: #999;
}
</style>

