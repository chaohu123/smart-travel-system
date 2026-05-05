<template>
  <view class="activity-detail-page">
    <!-- 顶部图片轮播 -->
    <view class="header-image" v-if="detail?.imageUrl">
      <swiper
        class="header-swiper"
        :indicator-dots="true"
        :autoplay="true"
        :interval="3000"
        :duration="500"
        indicator-color="rgba(255,255,255,0.5)"
        indicator-active-color="#2FA66A"
        circular
      >
        <swiper-item v-for="(img, index) in imageList" :key="index">
          <image
            class="header-img"
            :src="img"
            mode="aspectFill"
          />
        </swiper-item>
      </swiper>
      <view class="header-overlay"></view>
    </view>

    <scroll-view scroll-y class="scroll">
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>

      <view v-else-if="detail" class="content">
        <!-- 活动名称和基本信息 -->
        <view class="header-section">
          <view class="title-row">
            <text class="name">{{ detail.name }}</text>
            <view class="status-badge" :class="statusClass">
              <text class="status-text">{{ statusText }}</text>
            </view>
          </view>
          
          <view class="highlight-row" v-if="detail.highlight">
            <text class="highlight-text">{{ detail.highlight }}</text>
          </view>

          <!-- 时间范围 -->
          <view class="time-row" v-if="timeRange">
            <text class="iconfont icon-richeng time-icon"></text>
            <text class="time-text">{{ timeRange }}</text>
          </view>
        </view>

        <!-- 活动介绍卡片 -->
        <view class="intro-card" v-if="detail.description">
          <view class="card-title">
            <text class="iconfont icon-jingdianjieshao title-icon"></text>
            <text class="title-text">活动介绍</text>
          </view>
          <view class="card-content">
            <text class="intro-text">{{ detail.description }}</text>
          </view>
        </view>

        <!-- 活动规则卡片 -->
        <view class="rules-card" v-if="detail.rules">
          <view class="card-title">
            <text class="iconfont icon-yijianfankui title-icon"></text>
            <text class="title-text">活动规则</text>
          </view>
          <view class="card-content">
            <text class="rules-text">{{ detail.rules }}</text>
          </view>
        </view>

        <!-- 关联路线 -->
        <view class="related-section" v-if="relatedRoutes.length > 0">
          <view class="section-header">
            <text class="section-title">
              <text class="iconfont icon-xianlu section-title-icon"></text>
              推荐路线
            </text>
            <text class="section-more" @click="viewAllRoutes">查看全部 ></text>
          </view>
          <scroll-view scroll-x class="horizontal-scroll">
            <view class="related-list">
              <view
                v-for="route in relatedRoutes"
                :key="route.id"
                class="related-item route-item"
                @click="viewRoute(route)"
              >
                <image
                  class="related-cover"
                  :src="route.coverImage || 'https://ts2.tc.mm.bing.net/th/id/OIP-C.D0FxyIfldS08x95YBJdFQAHaFj?rs=1&pid=ImgDetMain&o=7&rm=3'"
                  mode="aspectFill"
                />
                <view class="related-overlay"></view>
                <view class="related-info">
                  <text class="related-name">{{ route.routeName }}</text>
                  <view class="related-meta">
                    <text class="meta-text">{{ route.days }}天</text>
                    <text class="meta-divider">·</text>
                    <text class="meta-text">{{ formatCount(route.favoriteCount) }}人收藏</text>
                  </view>
                </view>
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- 关联景点 -->
        <view class="related-section" v-if="relatedScenics.length > 0">
          <view class="section-header">
            <text class="section-title">
              <text class="iconfont icon-jingdian section-title-icon"></text>
              推荐景点
            </text>
            <text class="section-more" @click="viewAllScenics">查看全部 ></text>
          </view>
          <scroll-view scroll-x class="horizontal-scroll">
            <view class="related-list">
              <view
                v-for="scenic in relatedScenics"
                :key="scenic.id"
                class="related-item scenic-item"
                @click="viewScenic(scenic)"
              >
                <image
                  class="related-cover"
                  :src="getImageUrl(scenic.imageUrl) || defaultScenicImage"
                  mode="aspectFill"
                />
                <view class="related-overlay"></view>
                <view class="related-info">
                  <text class="related-name">{{ scenic.name }}</text>
                  <view class="related-meta">
                    <text class="meta-text">评分 {{ scenic.score ? Number(scenic.score).toFixed(1) : '--' }}</text>
                    <text class="meta-divider">·</text>
                    <text class="meta-text">{{ scenic.city || '' }}</text>
                  </view>
                </view>
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- 关联美食 -->
        <view class="related-section" v-if="relatedFoods.length > 0">
          <view class="section-header">
            <text class="section-title">
              <text class="iconfont icon-meishi section-title-icon"></text>
              推荐美食
            </text>
            <text class="section-more" @click="viewAllFoods">查看全部 ></text>
          </view>
          <scroll-view scroll-x class="horizontal-scroll">
            <view class="related-list">
              <view
                v-for="food in relatedFoods"
                :key="food.id"
                class="related-item food-item"
                @click="viewFood(food)"
              >
                <image
                  class="related-cover"
                  :src="getImageUrl(food.imageUrl) || defaultFoodImage"
                  mode="aspectFill"
                />
                <view class="related-overlay"></view>
                <view class="related-info">
                  <text class="related-name">{{ food.name }}</text>
                  <view class="related-meta">
                    <text class="meta-text">{{ food.foodType || '' }}</text>
                    <text class="meta-divider">·</text>
                    <text class="meta-text" v-if="food.avgPrice">¥{{ Number(food.avgPrice).toFixed(0) }}</text>
                  </view>
                </view>
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- 关联游记 -->
        <view class="related-section" v-if="relatedNotes.length > 0">
          <view class="section-header">
            <text class="section-title">
              <text class="iconfont icon-youji section-title-icon"></text>
              相关游记
            </text>
            <text class="section-more" @click="viewAllNotes">查看全部 ></text>
          </view>
          <view class="notes-list">
            <view
              v-for="note in relatedNotes"
              :key="note.id"
              class="note-item"
              @click="viewNote(note)"
            >
              <image
                class="note-cover"
                :src="note.coverImage || '/static/default-note.jpg'"
                mode="aspectFill"
              />
              <view class="note-info">
                <text class="note-title">{{ note.title }}</text>
                <view class="note-meta">
                  <text class="note-author">{{ note.authorName || '匿名用户' }}</text>
                  <text class="note-divider">·</text>
                  <text class="note-stats">{{ formatCount(note.viewCount) }}浏览</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="empty-state">
        <text class="iconfont icon-youji empty-icon"></text>
        <text class="empty-text">活动不存在或已下线</text>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <button class="share-btn" @click="handleShare">
        <text class="iconfont icon-fenxiang share-icon"></text>
      </button>
      <button class="participate-btn" @click="handleParticipate" :disabled="!canParticipate">
        <text class="participate-text">{{ participateText }}</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { activityApi, type ActivityDetail } from '@/api/activity'
import { getImageUrl } from '@/utils/image'
import { defaultFoodImage, defaultScenicImage } from '@/utils/config'

const activityId = ref<number | null>(null)
const loading = ref(false)
const detail = ref<ActivityDetail | null>(null)

const imageList = computed(() => {
  if (!detail.value?.imageUrl) return []
  // 如果有多张图片，可以扩展为数组
  return [getImageUrl(detail.value.imageUrl)]
})

const timeRange = computed(() => {
  if (!detail.value) return ''
  const start = detail.value.startTime
  const end = detail.value.endTime
  if (!start && !end) return '长期有效'
  if (start && end) {
    return `${formatDate(start)} ~ ${formatDate(end)}`
  }
  if (start) {
    return `${formatDate(start)} 开始`
  }
  if (end) {
    return `${formatDate(end)} 结束`
  }
  return ''
})

const statusText = computed(() => {
  if (!detail.value?.status) return '未知'
  const status = detail.value.status
  if (status === 'online' || status === 'active') return '进行中'
  if (status === 'upcoming') return '即将开始'
  if (status === 'ended' || status === 'offline') return '已结束'
  return '未知'
})

const statusClass = computed(() => {
  if (!detail.value?.status) return 'status-unknown'
  const status = detail.value.status
  if (status === 'online' || status === 'active') return 'status-active'
  if (status === 'upcoming') return 'status-upcoming'
  if (status === 'ended' || status === 'offline') return 'status-ended'
  return 'status-unknown'
})

const canParticipate = computed(() => {
  if (!detail.value?.status) return false
  return detail.value.status === 'online' || detail.value.status === 'active'
})

const participateText = computed(() => {
  if (!canParticipate.value) return '活动已结束'
  return '立即参与'
})

const relatedRoutes = computed(() => {
  return detail.value?.relatedRoutes || []
})

const relatedScenics = computed(() => {
  return detail.value?.relatedScenics || []
})

const relatedFoods = computed(() => {
  return detail.value?.relatedFoods || []
})

const relatedNotes = computed(() => {
  return detail.value?.relatedNotes || []
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatCount = (count?: number) => {
  if (!count) return '0'
  if (count < 1000) return String(count)
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`
  return `${(count / 10000).toFixed(1)}w`
}

const loadDetail = async () => {
  if (!activityId.value) return

  loading.value = true
  try {
    // 调用真实的活动详情API
    const res = await activityApi.getDetail(activityId.value)
    if (res.statusCode === 200 && res.data.code === 200) {
      detail.value = res.data.data
    } else {
      // 如果API未就绪，使用模拟数据
      await new Promise(resolve => setTimeout(resolve, 500))
      detail.value = {
        id: activityId.value,
        name: '国庆长假 · 城市周边游',
        highlight: '精选3条周边线路，带你探索城市周边的美丽风景',
        description: '国庆长假即将到来，你是否已经计划好了出行路线？我们精心挑选了3条城市周边游线路，涵盖自然风光、历史文化、美食体验等多种主题，让你在假期中充分放松身心，享受旅行的乐趣。',
        rules: '1. 活动时间为2025年10月1日至10月7日\n2. 参与活动需要完成指定打卡点打卡\n3. 完成所有打卡任务可获得精美礼品\n4. 活动最终解释权归平台所有',
        imageUrl: 'https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=800',
        startTime: '2025-10-01T00:00:00',
        endTime: '2025-10-07T23:59:59',
        status: 'online',
        relatedRoutes: [
          {
            id: 1,
            routeName: '周边自然风光2日游',
            coverImage: 'https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=400',
            days: 2,
            favoriteCount: 1234
          },
          {
            id: 2,
            routeName: '历史文化探索3日游',
            coverImage: 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=400',
            days: 3,
            favoriteCount: 856
          }
        ],
        relatedScenics: [
          {
            id: 1,
            name: '自然公园',
            imageUrl: 'https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=400',
            score: 4.8,
            city: '北京'
          },
          {
            id: 2,
            name: '历史博物馆',
            imageUrl: 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=400',
            score: 4.6,
            city: '北京'
          }
        ],
        relatedFoods: [
          {
            id: 1,
            name: '特色小吃街',
            imageUrl: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=400',
            foodType: '小吃',
            avgPrice: 50
          }
        ],
        relatedNotes: [
          {
            id: 1,
            title: '国庆周边游攻略分享',
            coverImage: 'https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=400',
            authorName: '旅行达人',
            viewCount: 5678
          }
        ]
      }
    }
  } catch (error) {
    // API调用失败时使用模拟数据
    await new Promise(resolve => setTimeout(resolve, 500))
    detail.value = {
      id: activityId.value,
      name: '国庆长假 · 城市周边游',
      highlight: '精选3条周边线路，带你探索城市周边的美丽风景',
      description: '国庆长假即将到来，你是否已经计划好了出行路线？我们精心挑选了3条城市周边游线路，涵盖自然风光、历史文化、美食体验等多种主题，让你在假期中充分放松身心，享受旅行的乐趣。',
      rules: '1. 活动时间为2025年10月1日至10月7日\n2. 参与活动需要完成指定打卡点打卡\n3. 完成所有打卡任务可获得精美礼品\n4. 活动最终解释权归平台所有',
      imageUrl: 'https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=800',
      startTime: '2025-10-01T00:00:00',
      endTime: '2025-10-07T23:59:59',
      status: 'online',
      relatedRoutes: [],
      relatedScenics: [],
      relatedFoods: [],
      relatedNotes: []
    }
  } finally {
    loading.value = false
  }
}

const viewRoute = (route: { id?: number }) => {
  if (route.id) {
    uni.navigateTo({
      url: `/pages/itinerary/itinerary-detail?id=${route.id}`
    })
  }
}

const viewScenic = (scenic: { id?: number }) => {
  if (scenic.id) {
    uni.navigateTo({
      url: `/pages/scenic/detail?id=${scenic.id}`
    })
  }
}

const viewFood = (food: { id?: number }) => {
  if (food.id) {
    uni.navigateTo({
      url: `/pages/food/detail?id=${food.id}`
    })
  }
}

const viewNote = (note: { id?: number }) => {
  if (note.id) {
    uni.navigateTo({
      url: `/pages/travel-note/detail?id=${note.id}`
    })
  }
}

const viewAllRoutes = () => {
  uni.navigateTo({
    url: '/pages/route/hot-routes'
  })
}

const viewAllScenics = () => {
  uni.switchTab({
    url: '/pages/home/home'
  })
}

const viewAllFoods = () => {
  uni.switchTab({
    url: '/pages/home/home'
  })
}

const viewAllNotes = () => {
  uni.switchTab({
    url: '/pages/travel-note/list'
  })
}

const handleShare = () => {
  // #ifdef H5
  if (navigator.share) {
    navigator.share({
      title: detail.value?.name || '活动详情',
      text: detail.value?.highlight || '',
      url: window.location.href
    }).catch(() => {})
  } else {
    // 复制链接
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      uni.showToast({
        title: '链接已复制',
        icon: 'success'
      })
    })
  }
  // #endif
  
  // #ifndef H5
  uni.showShareMenu({
    withShareTicket: true
  })
  // #endif
}

const handleParticipate = () => {
  if (!canParticipate.value) {
    uni.showToast({
      title: '活动已结束',
      icon: 'none'
    })
    return
  }
  
  // 跳转到打卡页面
  uni.switchTab({
    url: '/pages/checkin/checkin'
  })
}

onLoad((options: { id?: string | number }) => {
  const id = options.id
  if (id) {
    activityId.value = typeof id === 'string' ? parseInt(id) : id
    loadDetail()
  } else {
    uni.showToast({
      title: '活动ID不存在',
      icon: 'none'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
})
</script>

<style scoped>
.activity-detail-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
}

.header-image {
  width: 100%;
  height: 400rpx;
  position: relative;
  overflow: hidden;
}

.header-swiper {
  width: 100%;
  height: 100%;
}

.header-img {
  width: 100%;
  height: 100%;
}

.header-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80rpx;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.2), transparent);
}

.scroll {
  flex: 1;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
  color: #999;
}

.content {
  /* 底部预留更大空间，避免“相关游记”被底部操作栏遮挡 */
  padding: 0 24rpx 240rpx;
}

.header-section {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-top: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 10;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.name {
  font-size: 40rpx;
  font-weight: 700;
  color: #333333;
  flex: 1;
  line-height: 1.4;
}

.status-badge {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  flex-shrink: 0;
}

.status-active {
  background: #E8F5E9;
}

.status-active .status-text {
  color: #2FA66A;
}

.status-upcoming {
  background: #FFF3E0;
}

.status-upcoming .status-text {
  color: #FF9800;
}

.status-ended {
  background: #F5F5F5;
}

.status-ended .status-text {
  color: #999;
}

.status-unknown {
  background: #F5F5F5;
}

.status-unknown .status-text {
  color: #999;
}

.highlight-row {
  margin-bottom: 16rpx;
}

.highlight-text {
  font-size: 28rpx;
  color: #666666;
  line-height: 1.6;
}

.time-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.time-icon {
  font-size: 28rpx;
  color: #666666;
}

.time-text {
  font-size: 26rpx;
  color: #666666;
}

.intro-card,
.rules-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.title-icon {
  font-size: 28rpx;
}

.title-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
}

.card-content {
  margin-top: 0;
}

.intro-text,
.rules-text {
  font-size: 28rpx;
  color: #666666;
  line-height: 1.8;
  white-space: pre-line;
  text-align: justify;
}

.related-section {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: flex;
  align-items: center;
}

.section-title-icon {
  font-size: 32rpx;
  margin-right: 8rpx;
}

.section-more {
  font-size: 26rpx;
  color: #2FA66A;
}

.horizontal-scroll {
  white-space: nowrap;
  width: 100%;
}

.related-list {
  display: flex;
  gap: 20rpx;
}

.related-item {
  position: relative;
  width: 300rpx;
  height: 200rpx;
  border-radius: 16rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.related-cover {
  width: 100%;
  height: 100%;
}

.related-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
}

.related-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx;
  z-index: 1;
}

.related-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.related-meta {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}

.meta-divider {
  margin: 0 8rpx;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.note-item {
  display: flex;
  background: #F7F8FA;
  border-radius: 16rpx;
  overflow: hidden;
  padding: 20rpx;
  gap: 20rpx;
}

.note-cover {
  width: 160rpx;
  height: 120rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.note-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.note-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.note-meta {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}

.note-divider {
  margin: 0 8rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background-color: #ffffff;
  border-top: 1rpx solid #eeeeee;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.share-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  background-color: #f5f5f5;
  border-radius: 44rpx;
  border: none;
  flex-shrink: 0;
  transition: all 0.3s;
}

.share-btn:active {
  transform: scale(0.95);
  background-color: #eeeeee;
}

.share-icon {
  font-size: 40rpx;
  color: #666666;
}

.participate-btn {
  flex: 1;
  padding: 28rpx;
  border-radius: 24rpx;
  border: none;
  font-size: 28rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3ba272, #6fd3a5);
  color: #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(59, 162, 114, 0.3);
}

.participate-btn[disabled] {
  background: #e5e5e5;
  color: #999999;
  box-shadow: none;
}
</style>

