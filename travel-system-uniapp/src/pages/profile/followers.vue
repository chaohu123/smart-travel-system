<template>
  <view class="followers-page">
    <!-- 导航栏 -->
    <view class="navbar">
      <view class="nav-back" @click="goBack">
        <text class="iconfont icon-arrow-left"></text>
      </view>
      <text class="nav-title">粉丝列表</text>
      <view class="nav-placeholder"></view>
    </view>

    <!-- 粉丝列表 -->
    <scroll-view
      scroll-y
      class="list-scroll"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <!-- 骨架屏 -->
      <view v-if="loading && followersList.length === 0" class="skeleton-list">
        <view v-for="i in 5" :key="i" class="skeleton-item">
          <view class="skeleton-avatar"></view>
          <view class="skeleton-content">
            <view class="skeleton-line"></view>
            <view class="skeleton-line short"></view>
          </view>
        </view>
      </view>

      <!-- 粉丝列表 -->
      <view v-else-if="followersList.length > 0" class="followers-list">
        <view
          v-for="follower in followersList"
          :key="follower.id"
          class="follower-item"
          @click="viewUserProfile(follower.id)"
        >
          <image
            class="user-avatar"
            :src="follower.avatar || defaultAvatar"
            mode="aspectFill"
          />
          <view class="user-info">
            <text class="user-name">{{ follower.nickname || '未设置昵称' }}</text>
          </view>
          <button
            v-if="isOwnProfile && follower.id !== currentUserId"
            class="follow-btn"
            :class="{ 'followed': follower.isFollowing }"
            @click.stop="toggleFollow(follower)"
          >
            <text>{{ follower.isFollowing ? '已关注' : '关注' }}</text>
          </button>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="empty-state">
        <text class="empty-icon">👥</text>
        <text class="empty-text">暂无粉丝</text>
        <text class="empty-tip">分享你的游记，吸引更多粉丝吧~</text>
      </view>

      <!-- 加载更多 -->
      <view v-if="hasMore && !loading && followersList.length > 0" class="load-more">
        <text class="load-more-text">加载中...</text>
      </view>
      <view v-if="!hasMore && followersList.length > 0" class="load-more">
        <text class="load-more-text">没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { userApi } from '@/api/user'
import { useUserStore } from '@/store/user'

const store = useUserStore()
const currentUser = computed(() => store.state.profile)
const currentUserId = computed(() => currentUser.value?.id)

const defaultAvatar = 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200'

// 获取页面参数
const targetUserId = ref<number | null>(null)
const isOwnProfile = computed(() => {
  if (!targetUserId.value) return true
  return currentUserId.value === targetUserId.value
})

// 粉丝列表
const followersList = ref<any[]>([])
const loading = ref(false)
const refreshing = ref(false)
const pageNum = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)

// 加载粉丝列表
const loadFollowers = async (reset = false) => {
  const userId = targetUserId.value || currentUserId.value
  if (!userId) {
    uni.showToast({ title: '用户不存在', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
    return
  }

  if (reset) {
    pageNum.value = 1
    hasMore.value = true
    followersList.value = []
  }

  if (loading.value || (!reset && !hasMore.value)) return

  loading.value = true

  try {
    const res = await userApi.getFollowers(userId, pageNum.value, pageSize.value)
    if (res.statusCode === 200 && res.data.code === 200) {
      const data = res.data.data || {}
      const list = data.list || []
      
      if (reset) {
        followersList.value = list
      } else {
        followersList.value.push(...list)
      }

      hasMore.value = list.length >= pageSize.value
      if (hasMore.value) {
        pageNum.value++
      }
    } else {
      uni.showToast({ title: res.data.msg || '加载失败', icon: 'none' })
    }
  } catch (error) {
    console.error('加载粉丝列表失败', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  loadFollowers(true)
}

// 加载更多
const loadMore = () => {
  if (!loading.value && hasMore.value) {
    loadFollowers(false)
  }
}

// 查看用户主页
const viewUserProfile = (userId: number) => {
  uni.navigateTo({ url: `/pages/profile/user-home?userId=${userId}` })
}

// 关注/取消关注
const toggleFollow = async (follower: any) => {
  if (!currentUserId.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  try {
    const res = await userApi.toggleFollow(currentUserId.value, follower.id)
    if (res.statusCode === 200 && res.data.code === 200) {
      follower.isFollowing = !follower.isFollowing
      uni.showToast({
        title: follower.isFollowing ? '关注成功' : '取消关注',
        icon: 'success'
      })
    } else {
      uni.showToast({ title: res.data.msg || '操作失败', icon: 'none' })
    }
  } catch (error) {
    console.error('关注操作失败', error)
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

// 返回
const goBack = () => {
  uni.navigateBack()
}

onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages()
  if (pages && pages.length > 0) {
    const currentPage = pages[pages.length - 1]
    const options = (currentPage as any).options || {}
    if (options.userId) {
      targetUserId.value = Number(options.userId)
    }
  }
  
  loadFollowers(true)
})
</script>

<style scoped>
.followers-page {
  min-height: 100vh;
  background-color: #f8fafb;
  display: flex;
  flex-direction: column;
}

/* 导航栏 */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  padding-top: calc(20rpx + env(safe-area-inset-top));
  background: #fff;
  border-bottom: 1rpx solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-back {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-back .iconfont {
  font-size: 36rpx;
  color: #333;
}

.nav-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.nav-placeholder {
  width: 60rpx;
}

/* 列表 */
.list-scroll {
  flex: 1;
  height: calc(100vh - 120rpx);
}

.followers-list {
  padding: 20rpx;
}

.follower-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.user-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
}

.user-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.user-signature {
  font-size: 24rpx;
  color: #999;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  overflow: hidden;
}

.follow-btn {
  padding: 12rpx 32rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
  border: none;
  background: #3ba272;
  color: #fff;
  flex-shrink: 0;
}

.follow-btn.followed {
  background: #f5f5f5;
  color: #666;
}

/* 空状态 */
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
  font-size: 32rpx;
  color: #666;
}

.empty-tip {
  font-size: 26rpx;
  color: #999;
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 40rpx;
}

.load-more-text {
  font-size: 24rpx;
  color: #999;
}

/* 骨架屏 */
.skeleton-list {
  padding: 20rpx;
}

.skeleton-item {
  display: flex;
  gap: 20rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
}

.skeleton-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: #f0f0f0;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.skeleton-line {
  height: 24rpx;
  background: #f0f0f0;
  border-radius: 4rpx;
}

.skeleton-line.short {
  width: 60%;
}
</style>

