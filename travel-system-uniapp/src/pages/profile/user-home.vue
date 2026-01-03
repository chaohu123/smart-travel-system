<template>
  <view class="user-home-page">
    <!-- 顶部用户信息卡片 -->
    <view class="user-header">
      <view class="header-bg"></view>
      <view class="user-info-card">
        <!-- 用户头像（可点击放大或更换） -->
        <view class="avatar-section">
          <image
            class="user-avatar"
            :src="userInfo.avatar || defaultAvatar"
            mode="aspectFill"
            @click="previewAvatar"
          />
          <view v-if="isOwnProfile" class="avatar-edit-btn" @click="changeAvatar">
            <text class="iconfont icon-bianji"></text>
          </view>
        </view>

        <!-- 用户昵称 -->
        <text class="user-name">{{ userInfo.nickname || '未设置昵称' }}</text>

        <!-- 用户等级和经验条 -->
        <view class="level-section">
          <view class="level-info">
            <text class="level-badge">LV{{ userInfo.level || 1 }}</text>
            <view v-if="userInfo.medals && userInfo.medals.length > 0" class="medals">
              <text
                v-for="(medal, index) in userInfo.medals.slice(0, 3)"
                :key="index"
                class="medal-icon"
              >
                {{ getMedalIcon(medal) }}
              </text>
              <text v-if="userInfo.medals.length > 3" class="medal-more">
                +{{ userInfo.medals.length - 3 }}
              </text>
            </view>
          </view>
          <view class="exp-bar-wrapper">
            <view class="exp-bar">
              <view
                class="exp-progress"
                :style="{ width: expProgress + '%' }"
              ></view>
            </view>
            <text class="exp-text">
              {{ currentExp }}/{{ nextLevelExp }} 经验
            </text>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="action-buttons">
          <button
            v-if="isOwnProfile"
            class="action-btn primary"
            @click="editProfile"
          >
            <text class="iconfont icon-bianji"></text>
            <text>编辑资料</text>
          </button>
          <button
            v-else-if="!isOwnProfile"
            class="action-btn"
            @click="followUser"
          >
            <text class="iconfont" :class="isFollowing ? 'icon-guanzhu' : 'icon-guanzhu1'"></text>
            <text>{{ isFollowing ? '已关注' : '关注' }}</text>
          </button>
          <button
            v-if="isOwnProfile"
            class="action-btn secondary"
            @click="checkIn"
          >
            <text class="iconfont icon-daka"></text>
            <text>签到</text>
          </button>
        </view>
      </view>
    </view>

    <!-- 统计数据 -->
    <view class="stats-section">
      <view class="stats-item" @click="viewNotes">
        <text class="stats-count">{{ userStats.notes || 0 }}</text>
        <text class="stats-label">游记</text>
      </view>
      <view class="stats-divider"></view>
      <view class="stats-item" @click="viewInteractions">
        <text class="stats-count">{{ (userStats.likes || 0) + (userStats.favorites || 0) + (userStats.comments || 0) }}</text>
        <text class="stats-label">互动</text>
      </view>
      <view class="stats-divider"></view>
      <view class="stats-item" @click="viewCheckins">
        <text class="stats-count">{{ userStats.checkins || 0 }}</text>
        <text class="stats-label">足迹</text>
      </view>
    </view>

    <!-- 内容标签页 -->
    <view class="tabs-section">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: currentTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        <text class="tab-text">{{ tab.label }}</text>
      </view>
    </view>

    <!-- 内容区域 -->
    <scroll-view
      scroll-y
      class="content-scroll"
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 游记列表 -->
      <view v-if="currentTab === 'notes'" class="content-list">
        <view
          v-for="note in contentList"
          :key="note.id"
          class="note-card"
          @click="viewNoteDetail(note.id)"
        >
          <view class="note-cover-wrapper">
            <image
              v-if="note.coverImage"
              class="note-cover"
              :src="getImageUrl(note.coverImage)"
              mode="aspectFill"
            />
          </view>
          <view class="note-info">
            <text class="note-title">{{ note.title }}</text>
            <view class="note-meta">
              <text class="note-time">{{ formatTime(note.createTime) }}</text>
              <view class="note-stats">
                <text class="stat-item">👍 {{ note.likeCount || 0 }}</text>
                <text class="stat-item">💬 {{ note.commentCount || 0 }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && contentList.length === 0" class="empty-state">
        <text class="empty-icon">{{ getEmptyIcon() }}</text>
        <text class="empty-text">{{ getEmptyText() }}</text>
      </view>

      <!-- 加载更多 -->
      <view v-if="hasMore && !loading" class="load-more">
        <text>加载中...</text>
      </view>
      <view v-if="!hasMore && contentList.length > 0" class="load-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>

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
import { userApi } from '@/api/user'
import { travelNoteApi } from '@/api/content'
import { useUserStore } from '@/store/user'

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
  checkins: 0
})

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
  return 100 * (level + 1)
})
const expProgress = computed(() => {
  const current = currentExp.value
  const next = nextLevelExp.value
  const prev = 100 * (userInfo.value.level || 1)
  if (next === prev) return 100
  return Math.floor(((current - prev) / (next - prev)) * 100)
})

// 标签页
const tabs = [
  { key: 'notes', label: '游记' }
]
const currentTab = ref('notes')
const contentList = ref<any[]>([])
const loading = ref(false)
const refreshing = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)

// 关注状态
const isFollowing = ref(false)
const showAvatarPreview = ref(false)

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
        medals: userInfoData.medals || []
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
        checkins: stats.checkinCount || 0
      }
    }
  } catch (error) {
    console.error('加载用户信息失败', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 加载内容列表
const loadContent = async (reset = false) => {
  const userId = targetUserId.value || currentUser.value?.id
  if (!userId) return

  if (reset) {
    pageNum.value = 1
    hasMore.value = true
    contentList.value = []
  }

  if (loading.value || (!reset && !hasMore.value)) return

  loading.value = true

  try {
    if (currentTab.value === 'notes') {
      const res = await travelNoteApi.listMyNotes(userId, pageNum.value, pageSize.value)
      if (res.statusCode === 200 && res.data.code === 200) {
        const data = res.data.data || {}
        const list = data.list || []
        
        if (reset) {
          contentList.value = list
        } else {
          contentList.value.push(...list)
        }

        hasMore.value = list.length >= pageSize.value
        if (hasMore.value) {
          pageNum.value++
        }
      }
    }
  } catch (error) {
    console.error('加载内容失败', error)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 切换标签
const switchTab = (key: string) => {
  currentTab.value = key
  loadContent(true)
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  loadUserInfo()
  loadContent(true)
}

// 加载更多
const loadMore = () => {
  if (!loading.value && hasMore.value) {
    loadContent(false)
  }
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

// 编辑资料
const editProfile = () => {
  uni.navigateTo({ url: '/pages/profile/edit-profile' })
}

// 签到
const checkIn = async () => {
  try {
    // TODO: 调用签到API
    uni.showToast({ title: '签到成功！+5经验', icon: 'success' })
    // 刷新用户信息
    await loadUserInfo()
  } catch (error) {
    uni.showToast({ title: '签到失败', icon: 'none' })
  }
}

// 关注用户
const followUser = async () => {
  // TODO: 实现关注功能
  isFollowing.value = !isFollowing.value
  uni.showToast({
    title: isFollowing.value ? '关注成功' : '取消关注',
    icon: 'success'
  })
}

// 查看游记
const viewNotes = () => {
  if (isOwnProfile.value) {
    uni.navigateTo({ url: '/pages/travel-note/list?my=true' })
  }
}

// 查看互动
const viewInteractions = () => {
  if (isOwnProfile.value) {
    uni.navigateTo({ url: '/pages/profile/my-interaction' })
  }
}

// 查看足迹
const viewCheckins = () => {
  if (isOwnProfile.value) {
    uni.navigateTo({ url: '/pages/footprint/footprint' })
  }
}

// 查看游记详情
const viewNoteDetail = (id: number) => {
  uni.navigateTo({ url: `/pages/travel-note/detail?id=${id}` })
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

// 获取空状态图标
const getEmptyIcon = () => {
  if (currentTab.value === 'notes') return '📝'
  return '📭'
}

// 获取空状态文本
const getEmptyText = () => {
  if (currentTab.value === 'notes') {
    return isOwnProfile.value ? '还没有发布过游记' : '该用户还没有发布游记'
  }
  return '暂无内容'
}

onMounted(() => {
  // 在 onMounted 中获取页面参数
  const pages = getCurrentPages()
  if (pages && pages.length > 0) {
    const currentPage = pages[pages.length - 1]
    const options = (currentPage as any).options || {}
    if (options.userId) {
      targetUserId.value = Number(options.userId)
    }
  }
  
  loadUserInfo()
  loadContent(true)
})
</script>

<style scoped>
.user-home-page {
  min-height: 100vh;
  background-color: #f8fafb;
}

.user-header {
  position: relative;
  padding-bottom: 40rpx;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 400rpx;
  background: linear-gradient(135deg, #3ba272, #57c18c);
}

.user-info-card {
  position: relative;
  margin: 0 40rpx;
  margin-top: 100rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-section {
  position: relative;
  margin-bottom: 24rpx;
}

.user-avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  border: 6rpx solid #fff;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.15);
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 56rpx;
  height: 56rpx;
  background: #3ba272;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid #fff;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
}

.avatar-edit-btn .iconfont {
  font-size: 28rpx;
  color: #fff;
}

.user-name {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
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
</style>

