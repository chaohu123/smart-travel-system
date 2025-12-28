<template>
  <view class="home-page">
    <GuideOverlay />
    <LoginPrompt :visible="showLoginPrompt" @confirm="handleLoginConfirm" @cancel="handleLoginCancel" />
    <!-- 沉浸式顶部区域 -->
    <view class="home-header">
      <view class="header-bg">
        <!-- 渐变背景 -->
      </view>
      <view class="header-content">
        <view class="search-bar" @click="onSearchClick">
          <Search class="search-icon" theme="outline" size="28" fill="#5f6c7b" />
          <input
            class="search-input"
            type="text"
            v-model="searchKeyword"
            :placeholder="searchPlaceholder"
            confirm-type="search"
            @confirm="onSearchConfirm"
            disabled
          />
        </view>
      </view>
    </view>

    <!-- 滚动内容区 -->
    <scroll-view scroll-y class="home-scroll">
      <!-- 智能入口区（核心卖点） -->
      <view class="section smart-entry-section">
        <view class="feature-grid">
          <view
            v-for="item in featureEntries"
            :key="item.id"
            class="feature-card"
            :class="{ 'feature-card--active': activeFeatureId === item.id }"
            @touchstart="onFeatureTouchStart(item.id)"
            @touchend="onFeatureTouchEnd"
            @click="onFeatureClick(item)"
          >
            <view class="feature-icon-wrapper">
              <text class="feature-icon-text">{{ item.text }}</text>
            </view>
            <text class="feature-title">{{ item.title }}</text>
          </view>
        </view>
      </view>

      <!-- 热门景点 -->
      <view class="section">
        <view class="section-title-row">
          <view class="section-title-wrapper">
            <text class="section-title">热门景点</text>
            <picker
              mode="selector"
              :range="provinceList"
              :range-key="'name'"
              :value="selectedProvinceIndex"
              @change="onProvinceChange"
              class="province-picker"
            >
              <view class="province-selector">
                <text class="province-text">{{ selectedProvince || '全部省份' }}</text>
                <text class="province-arrow">▼</text>
              </view>
            </picker>
          </view>
        </view>
        <view class="scenic-list">
          <view
            v-for="item in filteredScenicList"
            :key="item.id"
            class="scenic-card"
            @click="onViewScenic(item)"
          >
            <!-- 景点图片 -->
            <view class="scenic-image-wrapper">
              <image
                class="scenic-image"
                :src="item.imageUrl"
                mode="aspectFill"
              />
            </view>
            <!-- 景点信息 -->
            <view class="scenic-content">
              <text class="scenic-name">{{ item.name }}</text>
              <view class="scenic-meta-row">
                <text class="scenic-location">位置：{{item.address || item.city || '未知地点' }}</text>
                <text class="scenic-price" :class="{ 'price-free': !item.price || item.price === 0 }">
                  {{ item.price && item.price > 0 ? `¥${item.price}` : '免费' }}
                </text>
              </view>
              <view class="scenic-meta-row" v-if="item.isWorldHeritage">
                <text class="scenic-heritage">世界文化遗产</text>
              </view>
              <view class="scenic-meta-row" v-if="item.openTime || item.suggestedVisitTime">
                <text class="scenic-open-time" v-if="item.openTime">开放时间：{{item.openTime}}</text>
                <text class="scenic-divider" v-if="item.openTime && item.suggestedVisitTime"> | </text>
                <text class="scenic-time" v-if="item.suggestedVisitTime">游览时长：{{item.suggestedVisitTime}}</text>
              </view>
              <view class="scenic-tags-row">
                <text class="scenic-match" v-if="item.isMatchUserRoute">符合您的路线</text>
                <view class="scenic-tags" v-if="item.tags && item.tags.length > 0">
                  <text
                    v-for="tag in item.tags"
                    :key="tag"
                    class="scenic-tag"
                  >{{ tag }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 推荐线路卡片（重点） -->
      <view class="section">
        <view class="section-title-row">
          <text class="section-title">推荐线路</text>
          <text class="section-subtitle">为你精选热门行程</text>
        </view>

        <SkeletonCards v-if="loadingRecommend" :count="4" />
        <view v-else class="route-grid">
          <view
            v-for="route in routeList.slice(0, 4)"
            :key="route.id"
            class="route-card route-card--grid"
            @click="onViewRoute(route)"
          >
            <view class="route-cover-wrapper route-cover-wrapper--grid">
              <image
                class="route-cover"
                :src="route.coverImage"
                mode="aspectFill"
              />
              <view class="route-badge">
                {{ route.days }}天
              </view>
            </view>
            <view class="route-content">
              <text class="route-title">{{ route.routeName }}</text>
              <text class="route-desc">{{ route.summary || '点击查看线路详情' }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 推荐游记列表 -->
      <view class="section">
        <view class="section-title-row">
          <text class="section-title">热门游记</text>
          <text class="section-subtitle">看看大家都在怎么玩</text>
        </view>

        <view class="note-list">
          <SkeletonCards v-if="loadingNotes" :count="2" />
          <template v-else>
            <view
              v-for="note in noteList"
              :key="note.id"
              class="note-card"
              @tap="onViewNote(note)"
            >
              <!-- 封面图片 -->
              <view class="note-cover-wrapper">
                <image
                  class="note-cover"
                  :src="note.coverImage "
                  mode="aspectFill"
                />
              </view>

              <!-- 内容区域 -->
              <view class="note-content-wrapper">
                <view class="note-content-header">
                  <!-- 左侧：头像、标题和作者昵称 -->
                  <view class="note-left-section">
                    <view class="note-avatar-wrapper">
                      <image
                        class="note-author-avatar"
                        :src="note.authorAvatar"
                        mode="aspectFill"
                      />
                      <text class="note-author-name">{{ note.authorName || '匿名用户' }}</text>
                    </view>
                    <text class="note-title">{{ note.title }}</text>
                  </view>

                  <!-- 右侧：点赞数和评论数 -->
                  <view class="note-stats">
                    <view class="note-stat-item" @tap.stop="toggleLike(note)">
                      <view class="note-icon-box" :class="{ 'is-active': note.isLiked && shouldAnimateMap[note.id] }">
                        <text
                          class="iconfont note-stat-icon"
                          :class="['icon-icon', { 'icon-liked': note.isLiked }]"
                        ></text>
                      </view>
                      <text class="note-stat-text" :class="{ 'text-active': note.isLiked }">{{ note.likeCount || 0 }}</text>
                    </view>
                    <view class="note-stat-item" @tap.stop="handleComment(note)">
                      <view class="note-icon-box">
                        <text class="iconfont icon-pinglun note-stat-icon"></text>
                      </view>
                      <text class="note-stat-text">{{ note.commentCount || 0 }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
            <EmptyState v-if="!noteList.length" text="暂无游记" btn-text="去搜索" @retry="onSearchClick" />
          </template>
        </view>
      </view>

      <!-- 人气美食 -->
      <view class="section">
        <view class="section-title-row">
          <text class="section-title">人气美食</text>
          <text class="section-subtitle">必吃榜单</text>
        </view>
        <scroll-view scroll-x class="food-scroll" show-scrollbar="false">
          <view class="food-list">
            <view
              v-for="item in foodList"
              :key="item.id"
              class="food-card"
              @click="onViewFood(item)"
            >
              <!-- 美食图片 -->
              <view class="food-image-wrapper">
                <image
                  v-if="item.imageUrl"
                  class="food-image"
                  :src="item.imageUrl"
                  mode="aspectFill"
                />
                <view v-else class="food-image-placeholder">
                  <text class="food-icon">🍜</text>
                </view>
              </view>
              <!-- 美食信息 -->
              <view class="food-content">
                <view class="food-name-row">
                  <text class="food-name">{{ item.name }}</text>
                  <text class="food-price" v-if="item.avgPrice">
                    ¥{{ item.avgPrice }}/人
                  </text>
                </view>
                <view class="food-meta-row">
                  <text class="food-address">{{ item.address || '地址未知' }}</text>
                  <text class="food-score" v-if="item.score">{{ item.score }}分</text>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app'
import { recommendApi, scenicSpotApi, type ApiResponse } from '@/api/content'
import { travelNoteApi, travelNoteInteractionApi } from '@/api/content'
import { request } from '@/utils/http'
import { useUserStore } from '@/store/user'
import EmptyState from '@/components/EmptyState.vue'
import SkeletonCards from '@/components/SkeletonCards.vue'
import GuideOverlay from '@/components/GuideOverlay.vue'
import LoginPrompt from '@/components/LoginPrompt.vue'
import { Search } from '@icon-park/vue-next'

const store = useUserStore()
const user = computed(() => store.state.profile)

const searchKeyword = ref('')
const searchPlaceholder = '输入城市 / 想去哪玩？'

// 智能入口
const activeFeatureId = ref<number | null>(null)

const featureEntries = ref([
  { id: 1, title: '智能规划', desc: '根据你的兴趣智能生成行程', icon: 'Brain', text: '智', type: 'planner' },
  { id: 2, title: '热门线路', desc: '看看大家都在走的爆款路线', icon: 'Fire', text: '线', type: 'hot-routes' },
  { id: 3, title: '兴趣推荐', desc: '美食 / 历史 / 亲子一键选择', icon: 'Magic', text: '趣', type: 'interest' },
])

// 推荐数据类型
interface RouteItem {
  id: number
  routeName: string
  days: number
  coverImage?: string
  summary?: string
  viewCount?: number
  favoriteCount?: number
}

interface NoteItem {
  id: number
  title: string
  cityName?: string
  viewCount?: number
  likeCount?: number
  favoriteCount?: number
  isFeatured?: number
  coverImage?: string
  authorAvatar?: string
  authorName?: string
  commentCount?: number
  isLiked?: boolean
}

interface ScenicItem {
  id: number
  name: string
  address?: string
  city?: string
  score?: number
  hotScore?: number
  intro?: string
  price?: number | null // 门票价格，null 或 0 表示免费
  province?: string // 省份
  imageUrl?: string // 景点图片
  isWorldHeritage?: boolean // 是否世界文化遗产
  suggestedVisitTime?: string // 建议游览时间
  openTime?: string // 开放时间
  isMatchUserRoute?: boolean // 是否符合用户路线
  tags?: string[] // 标签列表
}

interface FoodItem {
  id: number
  name: string
  address?: string
  foodType?: string
  avgPrice?: number
  score?: number
  hotScore?: number
  imageUrl?: string // 美食图片
}

const routeList = ref<RouteItem[]>([])
const noteList = ref<NoteItem[]>([])
const scenicList = ref<ScenicItem[]>([])
const foodList = ref<FoodItem[]>([])
const loadingRecommend = ref(false)
const loadingNotes = ref(false)
const notePage = ref(1)
const noteFinished = ref(false)
const shouldAnimateMap = ref<Record<number, boolean>>({})
const showLoginPrompt = ref(false)

// 省份列表
const provinceList = ref([
  { name: '全部省份', value: '' },
  { name: '北京', value: '北京' },
  { name: '上海', value: '上海' },
  { name: '广东', value: '广东' },
  { name: '浙江', value: '浙江' },
  { name: '江苏', value: '江苏' },
  { name: '四川', value: '四川' },
  { name: '陕西', value: '陕西' },
  { name: '福建', value: '福建' },
  { name: '山东', value: '山东' },
  { name: '河南', value: '河南' },
  { name: '湖北', value: '湖北' },
  { name: '湖南', value: '湖南' },
  { name: '安徽', value: '安徽' },
  { name: '河北', value: '河北' },
  { name: '辽宁', value: '辽宁' },
  { name: '江西', value: '江西' },
  { name: '重庆', value: '重庆' },
  { name: '云南', value: '云南' },
  { name: '广西', value: '广西' },
  { name: '山西', value: '山西' },
  { name: '内蒙古', value: '内蒙古' },
  { name: '贵州', value: '贵州' },
  { name: '新疆', value: '新疆' },
  { name: '吉林', value: '吉林' },
  { name: '黑龙江', value: '黑龙江' },
  { name: '海南', value: '海南' },
  { name: '甘肃', value: '甘肃' },
  { name: '宁夏', value: '宁夏' },
  { name: '青海', value: '青海' },
  { name: '西藏', value: '西藏' },
  { name: '天津', value: '天津' },
  { name: '香港', value: '香港' },
  { name: '澳门', value: '澳门' },
  { name: '台湾', value: '台湾' },
])

const selectedProvinceIndex = ref(0)
const selectedProvince = computed(() => provinceList.value[selectedProvinceIndex.value]?.name || '全部省份')

// 根据选择的省份筛选景点列表（现在后端已经按省份返回前3名，这里直接返回即可）
const filteredScenicList = computed(() => {
  return scenicList.value
})

// 省份选择变化
const onProvinceChange = (e: any) => {
  selectedProvinceIndex.value = e.detail.value
  // 省份改变时重新加载景点数据
  fetchHomeData()
}

type ListResponse<T> = UniApp.RequestSuccessCallbackResult & { data: ApiResponse<T[]> }

// 搜索事件
const onSearchClick = () => {
  uni.navigateTo({ url: '/pages/search/search' })
}

const onSearchConfirm = () => {
  if (!searchKeyword.value) {
    onSearchClick()
    return
  }
  uni.navigateTo({
    url: `/pages/search/search?keyword=${encodeURIComponent(searchKeyword.value)}`,
  })
}

// 智能入口事件
const onFeatureTouchStart = (id: number) => {
  activeFeatureId.value = id
}

const onFeatureTouchEnd = () => {
  activeFeatureId.value = null
}

const onFeatureClick = (item: (typeof featureEntries.value)[number]) => {
  if (item.type === 'planner') {
    uni.switchTab({ url: '/pages/route/plan' })
  } else if (item.type === 'hot-routes') {
    uni.showToast({ title: '功能开发中', icon: 'none' })
  } else if (item.type === 'interest') {
    uni.showToast({ title: '功能开发中', icon: 'none' })
  }
}

// 查看跳转
const onViewRoute = (route: RouteItem) => {
  uni.navigateTo({ url: `/pages/route/detail?id=${route.id}` })
}

const onViewNote = (note: NoteItem) => {
  uni.navigateTo({ url: `/pages/travel-note/detail?id=${note.id}` })
}

// 显示登录提示
const showLoginPromptDialog = () => {
  console.log('showLoginPromptDialog called')
  // 直接使用 uni.showModal，更可靠
  uni.showModal({
    title: '需要登录',
    content: '请先登录',
    confirmText: '去登录',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        // 用户选择去登录
        uni.switchTab({ url: '/pages/profile/profile' })
      }
      // 用户选择取消，什么都不做，留在当前页面
    }
  })
}

// 登录确认
const handleLoginConfirm = () => {
  showLoginPrompt.value = false
  // 跳转到登录页面（LoginPrompt组件内部会处理跳转）
}

// 登录取消
const handleLoginCancel = () => {
  showLoginPrompt.value = false
  // 用户选择取消，留在当前页面
}

// 点赞切换
const toggleLike = async (note: NoteItem) => {
  console.log('toggleLike called', note.id)
  // 检查登录状态
  if (!user.value) {
    console.log('User not logged in, showing login prompt')
    showLoginPromptDialog()
    return
  }

  try {
    console.log('Toggling like for note:', note.id, 'current state:', note.isLiked)
    // 先更新UI状态（乐观更新）
    const wasLiked = note.isLiked
    note.isLiked = !wasLiked
    if (!wasLiked) {
      note.likeCount = (note.likeCount || 0) + 1
      // 触发动画
      shouldAnimateMap.value[note.id] = true
      setTimeout(() => {
        shouldAnimateMap.value[note.id] = false
      }, 300)
    } else {
      note.likeCount = Math.max(0, (note.likeCount || 0) - 1)
    }

    // 调用后端API
    const res = await travelNoteInteractionApi.toggleLike(user.value.id, note.id)
    const data = res.data as ApiResponse<{ isLiked: boolean; likeCount?: number }>

    if (res.statusCode === 200 && data.code === 200) {
      // 使用后端返回的真实状态更新
      note.isLiked = data.data.isLiked
      if (data.data.likeCount !== undefined) {
        note.likeCount = data.data.likeCount
      }
    } else {
      // 如果API调用失败，回滚UI状态
      note.isLiked = wasLiked
      note.likeCount = wasLiked ? (note.likeCount || 0) + 1 : Math.max(0, (note.likeCount || 0) - 1)
      uni.showToast({
        title: data.msg || '操作失败',
        icon: 'none',
      })
    }
  } catch (error: any) {
    console.error('点赞失败:', error)
    // 回滚UI状态
    note.isLiked = !note.isLiked
    note.likeCount = note.isLiked ? (note.likeCount || 0) + 1 : Math.max(0, (note.likeCount || 0) - 1)
    uni.showToast({
      title: error?.message || '操作失败，请检查网络',
      icon: 'none',
    })
  }
}

// 评论处理
const handleComment = (note: NoteItem) => {
  console.log('handleComment called', note.id)
  // 检查登录状态
  if (!user.value) {
    console.log('User not logged in, showing login prompt')
    showLoginPromptDialog()
    return
  }
  uni.navigateTo({ url: `/pages/travel-note/detail?id=${note.id}&tab=comment` })
}

const onViewScenic = async (item: ScenicItem) => {
  // 点击景点时增加热度
  try {
    await scenicSpotApi.incrementHotScore(item.id)
  } catch (error) {
    // 静默失败，不影响页面跳转
    console.error('增加热度失败:', error)
  }
  uni.navigateTo({ url: `/pages/scenic/detail?id=${item.id}` })
}

const onViewFood = (item: FoodItem) => {
  uni.navigateTo({ url: `/pages/food/detail?id=${item.id}` })
}

// 拉取首页推荐数据
const fetchHomeData = async () => {
  if (loadingRecommend.value) return
  loadingRecommend.value = true
  const toastFail = (msg: string) => uni.showToast({ title: msg, icon: 'none' })
  try {
    // 获取当前选择的省份值
    const provinceValue = selectedProvince.value && selectedProvince.value !== '全部省份'
      ? provinceList.value[selectedProvinceIndex.value]?.value
      : undefined

    // 构建请求参数，不传递 undefined 值
    const scenicParams: any = { limit: 3 }
    const foodParams: any = { limit: 6 }

    // 如果选择了省份（不是"全部省份"），添加省份参数
    if (provinceValue && provinceValue !== '') {
      scenicParams.province = provinceValue
      foodParams.province = provinceValue
      console.log('[首页] 选择省份:', provinceValue, '美食参数:', foodParams)
    } else {
      console.log('[首页] 未选择省份或选择全部省份，不传递province参数')
    }

    const [routeRes, scenicRes, foodRes] = await Promise.all([
      recommendApi.routes(undefined, 10) as Promise<ListResponse<RouteItem>>,
      request({
        url: '/recommend/scenic-spots',
        method: 'GET',
        data: scenicParams,
        showLoading: false,
      }) as Promise<ListResponse<ScenicItem>>,
      request({
        url: '/recommend/foods',
        method: 'GET',
        data: foodParams,
        showLoading: false,
      }) as Promise<ListResponse<FoodItem>>,
    ])

    if (routeRes.statusCode === 200 && routeRes.data.code === 200) {
      routeList.value = routeRes.data.data || []
    } else {
      toastFail(routeRes.data.msg || '推荐线路加载失败')
    }

    if (scenicRes.statusCode === 200 && scenicRes.data.code === 200) {
      scenicList.value = scenicRes.data.data || []
      // 调试：打印价格信息
      console.log('景点数据:', scenicList.value)
      scenicList.value.forEach(item => {
        console.log(`${item.name} - price:`, item.price, 'type:', typeof item.price)
      })
    }

    if (foodRes.statusCode === 200 && foodRes.data.code === 200) {
      foodList.value = foodRes.data.data || []
      console.log('[首页] 美食数据加载成功，数量:', foodList.value.length, '省份:', provinceValue || '全部')
      if (foodList.value.length > 0) {
        console.log('[首页] 美食列表:', foodList.value.map(f => ({ name: f.name, address: f.address })))
      } else if (provinceValue) {
        console.warn('[首页] 选择了省份但未返回美食数据，可能该省份暂无美食数据')
      }
    } else {
      console.error('[首页] 美食数据加载失败:', foodRes.data)
      toastFail(foodRes.data?.msg || '推荐美食加载失败')
    }
  } catch (error) {
    toastFail('首页推荐加载失败')
  } finally {
    loadingRecommend.value = false
  }
}

const loadNotes = async (reset = false) => {
  if (loadingNotes.value || noteFinished.value) return
  loadingNotes.value = true
  if (reset) {
    notePage.value = 1
    noteFinished.value = false
  }
  try {
    const res = await travelNoteApi.list({ pageNum: notePage.value, pageSize: 6 })
    const data = res.data as any
    if (res.statusCode === 200 && data.code === 200) {
      const rows = data.data?.rows || data.data?.list || data.data || []
      // 初始化点赞状态，确保 commentCount 正确映射
      const processedRows = rows.map((item: any) => ({
        ...item,
        isLiked: item.isLiked || false,
        // 确保 commentCount 字段存在，如果后端返回的是 comment_count，需要转换
        commentCount: item.commentCount !== undefined ? item.commentCount : (item.comment_count || 0)
      }))
      noteList.value = notePage.value === 1 ? processedRows : noteList.value.concat(processedRows)
      if (rows.length < 6) noteFinished.value = true
      notePage.value += 1
    }
  } finally {
    loadingNotes.value = false
  }
}

// 更新游记评论数量的处理函数
const handleNoteCommentCountUpdate = (event: { noteId: number; commentCount: number }) => {
  const note = noteList.value.find(n => n.id === event.noteId)
  if (note) {
    note.commentCount = event.commentCount
  }
}

onMounted(() => {
  fetchHomeData()
  loadNotes(true)
  // 监听详情页发送的评论数量更新事件
  uni.$on('noteCommentCountUpdated', handleNoteCommentCountUpdate)
})

// 页面卸载时移除事件监听
onUnmounted(() => {
  uni.$off('noteCommentCountUpdated', handleNoteCommentCountUpdate)
})

// 页面显示时刷新数据（从详情页返回时更新评论数量等）
onShow(() => {
  // 刷新游记列表，确保评论数量等数据是最新的
  loadNotes(true)
})

// 下拉刷新
onPullDownRefresh(async () => {
  await fetchHomeData()
  await loadNotes(true)
  uni.stopPullDownRefresh()
})

onReachBottom(() => {
  loadNotes()
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
}

.home-header {
  position: relative;
  padding-top: var(--status-bar-height, 0);
  padding-bottom: 32rpx;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #3ba272 0%, #6fd3a5 100%);
}

.header-content {
  position: relative;
  padding: 24rpx 32rpx 0;
}

.search-bar {
  padding: 20rpx 24rpx;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10rpx);
}

.search-icon {
  margin-right: 12rpx;
}

.search-input {
  flex: 1;
  font-size: 26rpx;
  color: #333333;
}

.home-scroll {
  flex: 1;
}

.section {
  padding: 8rpx 24rpx 0;
}

.section-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12rpx;
  padding: 8rpx 8rpx 0;
}

.section-title-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

/* 省份选择器 */
.province-picker {
  margin-left: auto;
}

.province-selector {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  background-color: #f7f8fa;
  border-radius: 20rpx;
  border: 1rpx solid #e5e5e5;
}

.province-text {
  font-size: 24rpx;
  color: #666666;
}

.province-arrow {
  font-size: 20rpx;
  color: #999999;
  line-height: 1;
}

.section-subtitle {
  font-size: 22rpx;
  color: #999999;
}

/* 智能入口区样式 */
.smart-entry-section {
  margin-top: 24rpx;
}

.feature-grid {
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
}

.feature-card {
  flex: 1;
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #f0f0f0;
  transition: all 0.2s;
}

.feature-card--active {
  background-color: #e8f6f0;
  border-color: #3ba272;
  transform: translateY(-4rpx);
  box-shadow: 0 12rpx 32rpx rgba(59, 162, 114, 0.15);
}

.feature-icon-wrapper {
  width: 96rpx;
  height: 96rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #3ba272, #6fd3a5);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(59, 162, 114, 0.2);
}

.feature-icon-text {
  font-size: 48rpx;
  font-weight: 600;
  color: #ffffff;
  line-height: 1;
}

.feature-title {
  font-size: 28rpx;
  color: #333333;
  font-weight: 600;
  text-align: center;
}

/* 推荐线路四宫格 */
.route-grid {
  margin-top: 16rpx;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.route-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.08);
}

.route-card--grid {
  border: 2rpx solid #f0f0f0;
}

.route-cover-wrapper {
  position: relative;
  width: 100%;
  height: 0;
  overflow: hidden;
}

.route-cover-wrapper--grid {
  padding-bottom: 70%;
}

.route-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.route-badge {
  position: absolute;
  top: 12rpx;
  left: 12rpx;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(0, 0, 0, 0.6);
  color: #ffffff;
  font-size: 22rpx;
}

.route-content {
  padding: 18rpx 16rpx 16rpx;
}

.route-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.route-desc {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #666666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 推荐游记列表 */
.note-list {
  margin-top: 8rpx;
}

.note-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.05);
}

/* 封面图片 */
.note-cover-wrapper {
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 比例 */
  position: relative;
  overflow: hidden;
  background-color: #e5e5e5;
}

.note-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 内容区域 */
.note-content-wrapper {
  padding: 20rpx;
  position: relative;
}

.note-content-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

/* 左侧区域：头像、标题和作者昵称 */
.note-left-section {
  display: flex;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
  gap: 16rpx;
}

.note-avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 64rpx;
}

.note-author-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 999rpx;
  background-color: #e5e5e5;
  margin-bottom: 8rpx;
}

.note-author-name {
  font-size: 20rpx;
  color: #999999;
  line-height: 1.2;
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-title {
  flex: 1;
  font-size: 26rpx;
  font-weight: 600;
  color: #333333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-width: 0;
}

/* 右侧统计信息 */
.note-stats {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.note-stat-item {
  display: flex;
  align-items: center;
  gap: 4rpx;
  cursor: pointer;
  transition: all 0.2s;
  padding: 12rpx 8rpx;
  margin: -12rpx -8rpx;
  position: relative;
  z-index: 10;
  /* 确保可以点击 */
  pointer-events: auto;
  -webkit-tap-highlight-color: transparent;
  min-width: 80rpx;
  min-height: 60rpx;
  justify-content: center;
}

.note-stat-item:active {
  opacity: 0.7;
  transform: scale(0.95);
}

.note-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 48rpx;
}

.note-icon-box.is-active {
  animation: pop 0.3s ease-out;
}

@keyframes pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.note-stat-icon {
  font-size: 32rpx;
  line-height: 1;
  color: #666666;
  transition: color 0.2s;
}

/* 点赞图标已点赞状态 */
.note-icon-box .icon-icon.icon-liked {
  color:rgb(162, 59, 81);
}

/* 评论图标颜色 */
.note-icon-box .icon-pinglun {
  color: #666666;
}

.note-stat-text {
  font-size: 22rpx;
  color: #666666;
  transition: all 0.2s;
}

.note-stat-text.text-active {
  color: #3ba272;
  font-weight: 600;
}

/* 人气美食水平滚动样式 */
.food-scroll {
  margin-top: 8rpx;
  white-space: nowrap;
  width: 100%;
}

.food-list {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
  padding: 0 0 8rpx 0;
}

.food-card {
  flex-shrink: 0;
  width: 220rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}

/* 美食图片 */
.food-image-wrapper {
  width: 100%;
  height: 0;
  padding-bottom: 75%; /* 4:3 比例 */
  position: relative;
  overflow: hidden;
  background-color: #f0f0f0;
}

.food-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.food-image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
}

.food-icon {
  font-size: 60rpx;
}

/* 美食内容 */
.food-content {
  padding: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.food-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8rpx;
}

.food-name {
  flex: 1;
  font-size: 26rpx;
  font-weight: 600;
  color: #333333;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-width: 0;
}

.food-price {
  flex-shrink: 0;
  font-size: 24rpx;
  font-weight: 600;
  color: #3ba272;
}

.food-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8rpx;
}

.food-address {
  flex: 1;
  font-size: 22rpx;
  color: #666666;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-width: 0;
}

.food-score {
  flex-shrink: 0;
  font-size: 22rpx;
  color: #ff9800;
  font-weight: 600;
}

/* 热门景点样式 */
.scenic-list {
  margin-top: 8rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.scenic-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.scenic-image-wrapper {
  width: 100%;
  height: 0;
  padding-bottom: 35%; /* 缩小图片高度 */
  position: relative;
  overflow: hidden;
  background-color: #e5e5e5;
}

.scenic-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.scenic-content {
  padding: 24rpx;
}

.scenic-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  display: block;
  margin-bottom: 16rpx;
  line-height: 1.4;
}

.scenic-meta-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
  font-size: 24rpx;
  color: #666666;
}

.scenic-price {
  font-size: 26rpx;
  font-weight: 600;
  color: #3ba272;
}

.scenic-price.price-free {
  color: #ff6b6b;
}

.scenic-divider {
  color: #cccccc;
  font-size: 20rpx;
}

.scenic-heritage {
  color: #ff9800;
  font-size: 24rpx;
}

.scenic-location {
  flex: 1;
  color: #666666;
  font-size: 24rpx;
  margin-right: auto;
}

.scenic-open-time {
  color: #666666;
  font-size: 24rpx;
  flex: 1;
}

.scenic-time {
  color: #666666;
  font-size: 24rpx;
}

.scenic-tags-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 12rpx;
  flex-wrap: wrap;
}

.scenic-match {
  padding: 4rpx 12rpx;
  background-color: #e8f6f0;
  color: #3ba272;
  border-radius: 12rpx;
  font-size: 22rpx;
}

.scenic-tags {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}

.scenic-tag {
  padding: 4rpx 12rpx;
  background-color: #f0f0f0;
  color: #666666;
  border-radius: 12rpx;
  font-size: 22rpx;
}
</style>
