<template>
  <view class="profile-page">
    <!-- 测试登录弹层 -->
    <view v-if="showLoginForm" class="login-modal">
      <view class="login-card">
        <view class="login-card-header">
          <text class="login-title">测试登录（不依赖微信授权）</text>
          <text class="login-close" @click="closeLogin">×</text>
        </view>
        <view class="login-field">
          <text class="field-label">用户ID</text>
          <input v-model="form.userId" class="field-input" type="number" placeholder="输入已有用户ID，例如 1" />
        </view>
        <view class="login-field">
          <text class="field-label">昵称</text>
          <input v-model="form.nickname" class="field-input" placeholder="可选，用于展示" />
        </view>
        <button class="login-btn" :loading="loggingIn" @click="onTestLogin">开始测试登录</button>
        <view class="login-tip">会从后端拉取该用户资料并本地生成 token</view>
      </view>
    </view>

    <!-- 顶部 - 用户信息与状态 -->
    <view class="user-header-card">
      <view v-if="!user" class="login-prompt" @click="openLogin">
        <view class="avatar-placeholder">?</view>
        <view class="login-texts">
          <text class="main-title">开启智能之旅</text>
          <text class="sub-title">登录后同步您的AI行程规划</text>
        </view>
        <view class="login-action-wrapper">
          <view class="login-action-btn">测试登录</view>
        </view>
      </view>

      <view v-else class="user-info-box" @click="navigateToUserHome">
        <view class="user-center-content">
          <image class="user-avatar" :src="user.avatar || defaultAvatar" mode="aspectFill" />
          <view class="user-details">
            <view class="name-row">
              <text class="user-name">{{ user.nickname }}</text>
              <view class="level-tag">智旅达人</view>
            </view>
            <text class="user-sign">{{ user.signature || '让AI为您量身打造下一次旅行' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 行程状态条 -->
    <view class="trip-status-bar">
      <view class="status-item" @click="navigateToMyNotes">
        <text class="count">{{ userStats.notes || 0 }}</text>
        <text class="label">我的游记</text>
      </view>
      <view class="v-line"></view>
      <view class="status-item" @click="navigateToMyInteraction">
        <text class="count">{{ (userStats.likes || 0) + (userStats.favorites || 0) + (userStats.comments || 0) }}</text>
        <text class="label">我的互动</text>
      </view>
      <view class="v-line"></view>
      <view class="status-item" @click="navigateToMyCheckins">
        <text class="count">{{ userStats.checkins || 0 }}</text>
        <text class="label">我的足迹</text>
      </view>
    </view>

    <!-- AI智能服务 -->
    <view class="section-title">AI 智能服务</view>
    <view class="ai-tool-grid">
      <view class="ai-tool-card" @click="navigateToPreference">
        <view class="tool-icon ai-pref">
          <text class="iconfont icon-pianhaoshezhi"></text>
        </view>
        <text class="tool-name">偏好设置</text>
        <text class="tool-desc">定制AI推荐算法</text>
      </view>
      <view class="ai-tool-card" @click="navigateToHistory">
        <view class="tool-icon ai-history">
          <text class="iconfont icon-lishi"></text>
        </view>
        <text class="tool-name">规划历史</text>
        <text class="tool-desc">查看往期方案</text>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-container">
      <view class="menu-list">
        <view class="menu-item" @click="navigateToMyInteraction">
          <view class="menu-left">
            <text class="icon-box iconfont icon-pinglun"></text>
            <text>我的互动</text>
          </view>
          <text class="arrow iconfont icon-arrow-right"></text>
        </view>
        <view class="menu-item" @click="navigateToMyNotes">
          <view class="menu-left">
            <text class="icon-box iconfont icon-youji"></text>
            <text>我的游记</text>
          </view>
          <text class="arrow iconfont icon-arrow-right"></text>
        </view>
        <view class="menu-item" @click="navigateToMyCheckins">
          <view class="menu-left">
            <text class="icon-box iconfont icon-daka"></text>
            <text>我的足迹</text>
          </view>
          <text class="arrow iconfont icon-arrow-right"></text>
        </view>
      </view>
    </view>

    <!-- 其他功能 -->
    <view class="menu-container" style="margin-top: 20rpx;">
      <view class="menu-list">
        <view class="menu-item" @click="navigateToFeedback">
          <view class="menu-left">
            <text class="icon-box iconfont icon-yijianfankui"></text>
            <text>意见反馈</text>
          </view>
          <text class="arrow iconfont icon-arrow-right"></text>
        </view>
        <view class="menu-item" @click="navigateToAbout">
          <view class="menu-left">
            <text class="icon-box iconfont icon-guanyuwomen"></text>
            <text>关于我们</text>
          </view>
          <text class="arrow iconfont icon-arrow-right"></text>
        </view>
      </view>
    </view>

    <!-- 底部退出登录 -->
    <view v-if="user" class="logout-footer">
      <button class="logout-btn" @click="logout">退出登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { userApi } from '@/api/user'
import { tagApi } from '@/api/content'
import { useUserStore } from '@/store/user'
import { safeNavigateTo, resetNavigationState } from '@/utils/router'

const store = useUserStore()
const user = computed(() => store.state.profile)
const defaultAvatar =
  'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200'

const userStats = ref({
  notes: 0,
  favorites: 0,
  checkins: 0,
  likes: 0,
  comments: 0,
})
const showLoginForm = ref(false)

const form = reactive({
  userId: '',
  nickname: '',
})
const loggingIn = ref(false)

// 加载用户统计数据
const loadUserStats = async () => {
  if (!user.value?.id) return
  try {
    const res = await userApi.getStats(user.value.id)
    if (res.statusCode === 200 && res.data.code === 200) {
      const stats = res.data.data || {}
      userStats.value = {
        notes: stats.noteCount || 0,
        favorites: stats.favoriteCount || 0,
        checkins: stats.checkinCount || 0,
        likes: stats.likeCount || 0,
        comments: stats.commentCount || 0,
      }
    }
  } catch (e) {
    // 静默处理错误，不影响用户体验
  }
}

// 监听用户登录状态，如果已登录则关闭登录表单并加载统计数据
watch(user, (newUser) => {
  if (newUser) {
    showLoginForm.value = false
    loadUserStats()
  }
}, { immediate: true })

onMounted(() => {
  resetNavigationState()
  if (user.value) {
    loadUserStats()
  }
})

// 点击防抖
let lastClickTime = 0
const CLICK_DEBOUNCE_TIME = 300

const navigateToMyNotes = () => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  
  if (!user.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  safeNavigateTo('/pages/profile/my-article').catch(() => {
    // 静默处理错误
  })
}

const navigateToMyCheckins = () => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  
  if (!user.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  safeNavigateTo('/pages/footprint/footprint').catch(() => {
    // 静默处理错误
  })
}

const navigateToMyInteraction = () => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  
  if (!user.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  safeNavigateTo('/pages/profile/my-interaction').catch(() => {
    // 静默处理错误
  })
}

const navigateToFeedback = () => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  
  safeNavigateTo('/pages/profile/feedback').catch(() => {
    // 静默处理错误
  })
}

const navigateToAbout = () => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  
  safeNavigateTo('/pages/profile/about').catch(() => {
    // 静默处理错误
  })
}

const navigateToPreference = () => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  
  if (!user.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  safeNavigateTo('/pages/profile/preference').catch(() => {
    // 静默处理错误
  })
}

const navigateToHistory = () => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  
  if (!user.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  safeNavigateTo('/pages/profile/history').catch(() => {
    // 静默处理错误
  })
}

const navigateToUserHome = () => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  
  if (!user.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  safeNavigateTo(`/pages/profile/user-home?userId=${user.value.id}`).catch(() => {
    // 静默处理错误
  })
}

const openLogin = () => {
  showLoginForm.value = true
}

const closeLogin = () => {
  showLoginForm.value = false
}

const onTestLogin = async () => {
  if (!form.userId) {
    uni.showToast({ title: '请输入用户ID', icon: 'none' })
    return
  }
  loggingIn.value = true
  try {
    const res = await userApi.loginByUserId(Number(form.userId))
    if (res.statusCode === 200 && res.data.code === 200) {
      const data = res.data.data || {}
      store.setUser(
        {
          id: data.id,
          nickname: form.nickname || data.nickname || `用户${data.id}`,
          avatar: data.avatar,
          city: data.city,
          interests: data.tags || [],
          signature: data.signature,
        },
        `test-token-${data.id}`
      )
      uni.showToast({ title: '登录成功', icon: 'success' })
      showLoginForm.value = false
      // 登录成功后加载统计数据
      await loadUserStats()
    } else {
      uni.showToast({ title: res.data.msg || '登录失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '请求失败，请检查后端接口', icon: 'none' })
  } finally {
    loggingIn.value = false
  }
}

const logout = () => {
  store.logout()
  uni.showToast({ title: '已退出', icon: 'none' })
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background-color: #f8fafb;
  padding-bottom: 50rpx;
}

/* 顶部卡片 */
.user-header-card {
  height: 380rpx;
  background: linear-gradient(160deg, #3ba272 0%, #2bb673 100%);
  padding: 100rpx 40rpx 0;
  border-radius: 0 0 60rpx 60rpx;
}

.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  text-align: center;
}

.avatar-placeholder {
  width: 110rpx;
  height: 110rpx;
  border-radius: 40rpx;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 50rpx;
}

.login-texts {
  flex: 1;
  width: 100%;
}

.main-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.sub-title {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.login-action-btn {
  background: #fff;
  color: #3ba272;
  font-size: 24rpx;
  padding: 12rpx 30rpx;
  border-radius: 30rpx;
  font-weight: bold;
}

.login-action-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.user-info-box {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding-top: 40rpx;
}

.user-center-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.user-avatar {
  width: 130rpx;
  height: 130rpx;
  border-radius: 40rpx;
  border: 6rpx solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 10rpx 20rpx rgba(0, 0, 0, 0.1);
  margin-bottom: 24rpx;
}

.user-details {
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.name-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15rpx;
  margin-bottom: 12rpx;
}

.user-name {
  font-size: 40rpx;
  font-weight: bold;
}

.level-tag {
  font-size: 20rpx;
  background: rgba(255, 255, 255, 0.2);
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.4);
}

.user-sign {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}

.user-sign {
  text-align: center;
}

/* 行程状态条 */
.trip-status-bar {
  margin: -60rpx 40rpx 40rpx;
  background: #fff;
  border-radius: 30rpx;
  display: flex;
  padding: 40rpx 0;
  box-shadow: 0 15rpx 30rpx rgba(0, 0, 0, 0.05);
}

.status-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.count {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.label {
  font-size: 24rpx;
  color: #999;
}

.v-line {
  width: 1rpx;
  height: 60rpx;
  background: #eee;
  align-self: center;
}

/* AI 工具 */
.section-title {
  padding: 0 40rpx;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
}

.ai-tool-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  padding: 0 40rpx;
  margin-bottom: 40rpx;
}

.ai-tool-card {
  background: #fff;
  padding: 30rpx;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.04);
}

.tool-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #e4f7ef, #d1f2e5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-icon .iconfont {
  font-size: 36rpx;
  color: #3ba272;
}

.ai-pref {
  background: linear-gradient(135deg, #d1f2e5, #b8e8d5);
}

.ai-history {
  background: linear-gradient(135deg, #e5ecff, #d1dcff);
}

.tool-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.tool-desc {
  font-size: 22rpx;
  color: #aaa;
}

/* 功能列表 */
.menu-container {
  padding: 0 40rpx;
}

.menu-list {
  background: #fff;
  border-radius: 30rpx;
  overflow: hidden;
  box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.05);
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 35rpx 30rpx;
  border-bottom: 1rpx solid #f9f9f9;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-left {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #444;
}

.icon-box {
  margin-right: 20rpx;
  width: 50rpx;
  text-align: center;
  font-size: 32rpx;
}

.arrow {
  color: #ccc;
  font-size: 26rpx;
}

/* 登录弹层 */
.login-card {
  width: 640rpx;
  padding: 24rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.login-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  z-index: 999;
}

.login-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.login-close {
  font-size: 32rpx;
  color: #8c8c8c;
  padding: 8rpx 12rpx;
}

.login-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
}

.login-field {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.field-label {
  font-size: 26rpx;
  color: #666;
}

.field-input {
  padding: 18rpx 16rpx;
  background-color: #f6f7fb;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
}

.login-btn {
  background: linear-gradient(135deg, #3ba272, #57c18c);
  color: #fff;
  border-radius: 12rpx;
  padding: 22rpx;
  font-size: 30rpx;
  font-weight: 600;
}

.login-tip {
  font-size: 24rpx;
  color: #999;
}

.logout-footer {
  margin: 24rpx 40rpx 0;
}

.logout-btn {
  width: 100%;
  border: 2rpx solid #f3b0b0;
  color: #e64949;
  background: #fff3f3;
}
</style>



