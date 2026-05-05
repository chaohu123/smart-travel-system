<template>
  <view class="scenic-detail-page">
    <view class="title-safe-space"></view>
    <!-- 顶部图片：无图时使用默认图 -->
    <view class="header-image">
      <image
        class="header-img"
        :src="getImageUrl(detail?.imageUrl) || defaultScenicImage"
        mode="aspectFill"
        :lazy-load="false"
      />
      <view class="header-overlay"></view>
    </view>

    <scroll-view scroll-y class="scroll">
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>

      <view v-else-if="detail" class="content">
        <!-- 景点名称和基本信息 -->
        <view class="header-section">
          <view class="title-row">
            <text class="name">{{ detail.name }}</text>
            <view class="heritage-badge" v-if="detail.isWorldHeritage">
              <text class="heritage-text">世界文化遗产</text>
            </view>
          </view>
          <view class="location-row">
            <text class="iconfont icon-weizhi location-icon"></text>
            <text class="location-text">{{ detail.province || '' }}{{ detail.province && detail.city ? '/' : '' }}{{ detail.city || '' }}</text>
          </view>

          <!-- 评分和热度 -->
          <view class="stats-row">
            <view class="stat-item">
              <text class="stat-label">评分</text>
              <text class="stat-value score-value">{{ detail.score ? (typeof detail.score === 'number' ? detail.score.toFixed(1) : Number(detail.score).toFixed(1)) : '--' }}</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item">
              <text class="stat-label">热度</text>
              <text class="stat-value hot-value">{{ detail.hotScore || 0 }}</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item">
              <text class="stat-label">价格</text>
              <text class="stat-value price-value" :class="{ 'price-free': !detail.price || Number(detail.price) === 0 }">
                {{ detail.price && Number(detail.price) > 0 ? `¥${Number(detail.price)}` : '免费' }}
              </text>
            </view>
          </view>
        </view>

        <!-- 详细信息卡片 -->
        <view class="info-card">
          <view class="info-item" v-if="detail.address">
            <view class="info-label">
              <text class="iconfont icon-weizhi info-icon"></text>
              <text class="info-title">地址</text>
            </view>
            <text class="info-content">{{ detail.address }}</text>
          </view>

          <view class="info-item" v-if="detail.openTime">
            <view class="info-label">
              <text class="iconfont icon-kaifangshijian info-icon"></text>
              <text class="info-title">开放时间</text>
            </view>
            <text class="info-content">{{ detail.openTime }}</text>
          </view>

          <view class="info-item" v-if="detail.suggestedVisitTime">
            <view class="info-label">
              <text class="iconfont icon-tongxunshichang info-icon"></text>
              <text class="info-title">建议游览时长</text>
            </view>
            <text class="info-content">{{ detail.suggestedVisitTime }}</text>
          </view>

          <view class="info-item" v-if="detail.ticketInfo">
            <view class="info-label">
              <text class="iconfont icon-menpiao info-icon"></text>
              <text class="info-title">门票信息</text>
            </view>
            <text class="info-content">{{ detail.ticketInfo }}</text>
          </view>

          <view class="info-item" v-if="(!detail.price || Number(detail.price) === 0) && detail.freeNotice">
            <view class="info-label">
              <text class="iconfont icon-qita info-icon"></text>
              <text class="info-title">温馨提示</text>
            </view>
            <text class="info-content free-notice-content">{{ detail.freeNotice }}</text>
          </view>
        </view>

        <!-- 简介卡片 -->
        <view class="intro-card" v-if="detail.intro">
          <view class="card-title">
            <text class="iconfont icon-jingdianjieshao title-icon"></text>
            <text class="title-text">景点简介</text>
          </view>
          <text class="intro-text">{{ detail.intro }}</text>
        </view>

        <!-- 标签 -->
        <view class="tags-card" v-if="detail.tags && detail.tags.length > 0">
          <view class="card-title">
            <text class="iconfont icon-qita title-icon"></text>
            <text class="title-text">标签</text>
          </view>
          <view class="tags-list">
            <text
              v-for="tag in detail.tags"
              :key="tag"
              class="tag-item"
            >{{ tag }}</text>
          </view>
        </view>

        <!-- 附近美食 -->
        <view class="nearby-food-card" v-if="nearbyFoods.length > 0">
          <view class="card-title">
            <text class="iconfont icon-fujinmeishi title-icon"></text>
            <text class="title-text">附近美食</text>
          </view>
          <view class="food-list">
            <view
              v-for="food in nearbyFoods"
              :key="food.id"
              class="food-item"
              @click="onViewFood(food.id)"
            >
              <image
                class="food-image"
                :src="getImageUrl(food.imageUrl) || defaultFoodImage"
                mode="aspectFill"
                :lazy-load="true"
              />
              <text class="food-name">{{ food.name }}</text>
              <text class="food-score" v-if="food.score">评分 {{ food.score }}</text>
            </view>
          </view>
        </view>

        <!-- 打卡评价（展示他人打卡 + 自己打卡入口） -->
        <view class="intro-card">
          <view class="card-title">
            <text class="iconfont icon-jingdianjieshao title-icon"></text>
            <text class="title-text">打卡评价</text>
          </view>

          <!-- 他人打卡列表 -->
          <view v-if="checkinList.length > 0" class="checkin-list">
            <view
              v-for="item in checkinList"
              :key="item.id"
              class="checkin-item"
            >
              <view class="checkin-user-row">
                <image
                  class="checkin-avatar"
                  :src="getImageUrl(item.userAvatar) || defaultAvatar"
                  mode="aspectFill"
                />
                <view class="checkin-user-info">
                  <text class="checkin-nickname">{{ item.userNickname || '游客' }}</text>
                  <text class="checkin-time">{{ item.checkinTime }}</text>
                </view>
              </view>
              <view v-if="item.content" class="checkin-content-text">
                {{ item.content }}
              </view>
              <view v-if="item.photoUrl" class="checkin-photo-row">
                <image
                  :src="getImageUrl(item.photoUrl)"
                  class="checkin-photo"
                  mode="aspectFill"
                />
              </view>
            </view>
          </view>
          <view v-else class="checkin-empty">
            <text>还没有人打卡，快来成为第一位打卡者吧～</text>
          </view>

          <!-- 自己打卡入口：简单按钮，引导回打卡页 -->
          <view class="checkin-self-row">
            <button class="checkin-self-btn" @click="goCheckin">
              我也要去打卡
            </button>
          </view>
        </view>
      </view>

      <view v-else class="loading">
        <text>未找到景点信息</text>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="favorite-btn" @click="toggleFavorite">
        <text
          class="iconfont icon-shoucang favorite-icon"
          :class="{ 'favorited': isFavorite }"
        ></text>
      </view>
      <view class="action-buttons">
        <button class="action-btn checkin-btn" @click="goCheckin">
          <text class="btn-text">去打卡</text>
        </button>
        <button
          class="action-btn route-btn"
          :class="{ 'added': isInPendingList }"
          @click="addToRoute"
        >
          <text class="btn-text">{{ isInPendingList ? '已添加到路线' : '添加到路线' }}</text>
        </button>
        <button v-if="!isFreeScenic" class="action-btn ticket-btn" @click="openTicketModal">
          <text class="btn-text">门票预订</text>
        </button>
        <view v-else class="action-btn ticket-btn ticket-btn-disabled">
          <text class="btn-text">免费景点</text>
        </view>
      </view>
    </view>

    <!-- 打卡弹窗（景点详情内直接打卡） -->
    <view v-if="showCheckinModal" class="modal-overlay" @click="closeCheckinModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">打卡 {{ detail?.name || '' }}</text>
          <text class="modal-close" @click="closeCheckinModal">×</text>
        </view>

        <view class="modal-body">
          <view class="upload-section">
            <text class="section-label">上传照片</text>
            <text v-if="locationMsg" class="location-warning">{{ locationMsg }}</text>
            <view class="upload-area">
              <view v-for="(img, index) in uploadImages" :key="index" class="upload-item">
                <image class="upload-image" :src="img" mode="aspectFill" />
                <text class="upload-delete" @click="removeImage(index)">×</text>
              </view>
              <view v-if="uploadImages.length < 9" class="upload-add" @click="chooseImage">
                <text class="upload-text">添加照片</text>
              </view>
            </view>
          </view>

          <view class="comment-section">
            <text class="section-label">简短评价</text>
            <textarea
              v-model="checkinComment"
              class="comment-input"
              placeholder="分享你的感受..."
              maxlength="200"
            />
            <text class="char-count">{{ checkinComment.length }}/200</text>
          </view>
        </view>

        <view class="modal-footer">
          <button class="submit-btn" @click="submitCheckin">提交打卡</button>
        </view>
      </view>
    </view>

    <!-- 门票预订弹窗 -->
    <view v-if="showTicketModal" class="modal-overlay" @click="closeTicketModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">预订 {{ detail?.name || '' }}</text>
          <text class="modal-close" @click="closeTicketModal">×</text>
        </view>
        <view class="modal-body">
          <view class="ticket-block">
            <text class="section-label">票种</text>
            <view
              v-for="ticket in ticketOptions"
              :key="ticket.id"
              class="ticket-option"
              :class="{ active: selectedTicketId === ticket.id }"
              @click="selectedTicketId = ticket.id"
            >
              <text class="ticket-option-name">{{ ticket.name }}</text>
              <view class="ticket-option-price">
                <text class="ticket-origin">¥{{ ticket.originalPrice }}</text>
                <text class="ticket-discount">¥{{ ticket.discountPrice }}</text>
              </view>
            </view>
          </view>
          <view class="ticket-block">
            <text class="section-label">游玩日期</text>
            <picker mode="date" :value="selectedPlayDate" @change="onPlayDateChange">
              <view class="ticket-input">{{ selectedPlayDate || '请选择日期' }}</view>
            </picker>
          </view>
          <view class="ticket-block">
            <text class="section-label">人数</text>
            <view class="ticket-counter">
              <text class="counter-btn" @click="changeTicketCount(-1)">-</text>
              <text class="counter-num">{{ ticketCount }}</text>
              <text class="counter-btn" @click="changeTicketCount(1)">+</text>
            </view>
          </view>
          <view class="ticket-total">合计：¥{{ ticketTotalPrice }}</view>
        </view>
        <view class="modal-footer">
          <button class="submit-btn" @click="submitTicketOrder">立即预订</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { scenicSpotApi, foodApi, checkinApi, type ApiResponse } from '@/api/content'
import { getCache, setCache, removeCache } from '@/utils/storage'
import { useUserStore } from '@/store/user'
import { safeNavigateTo, safeSwitchTab } from '@/utils/router'
import { defaultFoodImage, defaultScenicImage } from '@/utils/config'
import { getImageUrl } from '@/utils/image'

const defaultAvatar =
  'https://img0.baidu.com/it/u=3514125058,2569457770&fm=253&fmt=auto&app=138&f=PNG?w=256&h=256'

const scenicId = ref<number | null>(null)
const loading = ref(false)
const detail = ref<any>(null)
const isFavorite = ref(false)
const isInPendingList = ref(false) // 是否在待选列表中
const nearbyFoods = ref<any[]>([])
const store = useUserStore()
const user = computed(() => store.state.profile)

// 点击防抖
let lastClickTime = 0
const CLICK_DEBOUNCE_TIME = 300

// 数据缓存键
const CACHE_KEY_PREFIX = 'scenic_detail_'
const CACHE_EXPIRE = 5 * 60 // 5分钟缓存

// 打卡评价相关状态
const checkinList = ref<any[]>([])

// 收藏功能（使用本地存储）
const FAVORITE_KEY = 'scenic_favorites'

// 打卡弹窗相关状态
const showCheckinModal = ref(false)
const uploadImages = ref<string[]>([])
const checkinComment = ref('')
const locationOk = ref(false)
const locationMsg = ref('')

const showTicketModal = ref(false)
const ticketCount = ref(1)
const selectedPlayDate = ref('')
const selectedTicketId = ref(1)
const ticketOptions = computed(() => {
  const basePrice = Number(detail.value?.price || 0)
  if (!basePrice || basePrice <= 0) return []

  // 基于景点详情价格动态构造可选票种，不写死具体金额。
  return [
    {
      id: 1,
      name: '成人票',
      originalPrice: basePrice,
      discountPrice: basePrice,
    },
  ]
})
const ticketTotalPrice = computed(() => {
  const ticket = ticketOptions.value.find((item) => item.id === selectedTicketId.value)
  return (ticket?.discountPrice || 0) * ticketCount.value
})
const isFreeScenic = computed(() => !detail.value?.price || Number(detail.value?.price) === 0)

watch(
  ticketOptions,
  (options) => {
    if (!options.length) return
    const exists = options.some((item) => item.id === selectedTicketId.value)
    if (!exists) {
      selectedTicketId.value = options[0].id
    }
  },
  { immediate: true },
)

const loadFavoriteStatus = () => {
  if (!scenicId.value) return
  const favorites = getCache<number[]>(FAVORITE_KEY) || []
  isFavorite.value = favorites.includes(scenicId.value)
}

// 检查是否在待选列表中
const checkPendingStatus = () => {
  if (!scenicId.value) return
  const pendingAdditions = getCache<Array<{ type: 'scenic' | 'food', id: number, name: string }>>('route_pending_additions') || []
  isInPendingList.value = pendingAdditions.some(item => item.type === 'scenic' && item.id === scenicId.value)
}

const toggleFavorite = () => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
    return // 防止快速重复点击
  }
  lastClickTime = now
  
  if (!user.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => {
      safeSwitchTab('/pages/profile/profile')
    }, 1500)
    return
  }

  if (!scenicId.value) return

  const favorites = getCache<number[]>(FAVORITE_KEY) || []
  const index = favorites.indexOf(scenicId.value)

  if (index > -1) {
    favorites.splice(index, 1)
    isFavorite.value = false
    uni.showToast({ title: '已取消收藏', icon: 'success' })
  } else {
    favorites.push(scenicId.value)
    isFavorite.value = true
    uni.showToast({ title: '收藏成功', icon: 'success' })
  }

  setCache(FAVORITE_KEY, favorites, 365 * 24 * 60)
}

const loadDetail = async (useCache = true) => {
  if (!scenicId.value) return
  
  // 尝试从缓存读取
  if (useCache) {
    const cacheKey = `${CACHE_KEY_PREFIX}${scenicId.value}`
    const cached = getCache<any>(cacheKey)
    if (cached) {
      detail.value = cached
      loadFavoriteStatus()
      checkPendingStatus()
      // 延迟加载附近美食（非关键数据）
      setTimeout(() => {
        loadNearbyFoods()
      }, 300)
      return
    }
  }
  
  loading.value = true
  try {
    const res = await scenicSpotApi.getDetail(scenicId.value)
    if (res.statusCode === 200 && res.data.code === 200) {
      // 后端返回的数据结构是 { spot: ScenicSpot, tags: List<String> }，需要合并
      const data = res.data.data
      if (data && data.spot) {
        detail.value = {
          ...data.spot,
          tags: data.tags || []
        }
      } else {
        detail.value = data
      }
      
      // 缓存数据
      if (scenicId.value) {
        const cacheKey = `${CACHE_KEY_PREFIX}${scenicId.value}`
        setCache(cacheKey, detail.value, CACHE_EXPIRE)
      }
      
      // 加载收藏状态
      loadFavoriteStatus()
      // 检查待选列表状态
      checkPendingStatus()
      // 延迟加载附近美食（非关键数据）
      setTimeout(() => {
        loadNearbyFoods()
      }, 300)
    } else {
      uni.showToast({ title: res.data.msg || '加载失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '网络错误', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const loadNearbyFoods = async () => {
  if (!detail.value?.cityId) return
  try {
    const res = await foodApi.getHot(detail.value.cityId, 3)
    if (res.statusCode === 200 && res.data.code === 200) {
      nearbyFoods.value = res.data.data || []
    }
  } catch (e) {
    // 静默处理错误，不影响主流程
  }
}

// 加载当前景点的打卡列表（用于展示他人打卡）
const loadScenicCheckins = async () => {
  if (!scenicId.value) return
  try {
    const res = await checkinApi.getTargetCheckins('scenic', scenicId.value, 1, 10)
    const data = res.data as ApiResponse<{ list: any[] }>
    if (res.statusCode === 200 && data.code === 200) {
      const list = (data.data && (data.data as any).list) || []
      checkinList.value = list || []
    }
  } catch (e) {
    // 静默失败，不影响主流程
  }
}

const onViewFood = (foodId: number) => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
    return // 防止快速重复点击
  }
  lastClickTime = now
  
  if (!foodId) return
  safeNavigateTo(`/pages/food/detail?id=${foodId}`).catch(() => {
    uni.showToast({ title: '页面跳转失败', icon: 'none' })
  })
}

const goCheckin = () => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
    return // 防止快速重复点击
  }
  lastClickTime = now
  
  if (!scenicId.value) return
  openCheckinModal()
}

const addToRoute = () => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
    return // 防止快速重复点击
  }
  lastClickTime = now
  
  if (!scenicId.value || !detail.value) return

  // 将景点添加到路线规划的待选列表中，用户可以在路线规划页面选择任意天数添加
  const pendingAdditions = getCache<Array<{ type: 'scenic' | 'food', id: number, name: string }>>('route_pending_additions') || []

  // 检查是否已存在
  const exists = pendingAdditions.some(item => item.type === 'scenic' && item.id === scenicId.value)

  if (!exists) {
    // 添加到待选列表
    pendingAdditions.push({
      type: 'scenic',
      id: scenicId.value,
      name: detail.value.name || '景点'
    })
    setCache('route_pending_additions', pendingAdditions, 60 * 24) // 保存24小时
    isInPendingList.value = true

    uni.showToast({
      title: '已添加到待选列表',
      icon: 'success',
      duration: 2000
    })
  } else {
    // 从待选列表中移除
    const filtered = pendingAdditions.filter(item => !(item.type === 'scenic' && item.id === scenicId.value))
    if (filtered.length > 0) {
      setCache('route_pending_additions', filtered, 60 * 24)
    } else {
      removeCache('route_pending_additions')
    }
    isInPendingList.value = false

    uni.showToast({
      title: '已从待选列表移除',
      icon: 'success',
      duration: 2000
    })
  }
}

onMounted(() => {
  const pages = getCurrentPages()
  if (!pages || pages.length === 0) return
  const currentPage = pages[pages.length - 1] as any
  const options = (currentPage?.options || {}) as { id?: string; from?: string }
  const id = options?.id
  if (id) {
    const numId = Number(id)
    if (!isNaN(numId) && numId > 0) {
      scenicId.value = numId
      loadDetail()
      loadScenicCheckins()
    }
  }
})

// 页面显示时检查待选列表状态（处理从路线规划页返回的情况）
onShow(() => {
  checkPendingStatus()
})

const showLoginPromptDialog = () => {
  uni.showModal({
    title: '需要登录',
    content: '打卡前需要先登录账号',
    confirmText: '去登录',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        safeSwitchTab('/pages/profile/profile')
      }
    },
  })
}

const ensureLocation = () => {
  uni.getLocation({
    type: 'gcj02',
    altitude: false,
    geocode: false,
    success: () => {
      locationOk.value = true
      locationMsg.value = ''
    },
    fail: (err) => {
      locationOk.value = false
      let errorMsg = '定位失败，请检查网络或授权定位'
      if ((err as any)?.errMsg) {
        const msg = (err as any).errMsg as string
        if (msg.includes('auth deny') || msg.includes('authorize')) {
          errorMsg = '需要位置权限，请在设置中开启'
          uni.showModal({
            title: '需要位置权限',
            content: '为了完成打卡，需要获取您的位置信息。是否前往设置开启？',
            confirmText: '去设置',
            cancelText: '取消',
            success: (modalRes) => {
              if (modalRes.confirm) {
                uni.openSetting({
                  success: (settingRes) => {
                    if ((settingRes as any).authSetting?.['scope.userLocation']) {
                      ensureLocation()
                    }
                  },
                })
              }
            },
          })
        } else if (msg.includes('timeout')) {
          errorMsg = '定位超时，请检查网络连接'
        } else if (msg.includes('fail')) {
          errorMsg = '定位服务不可用，请检查设备定位设置'
        }
      }
      locationMsg.value = errorMsg
    },
  })
}

const openCheckinModal = () => {
  if (!user.value) {
    showLoginPromptDialog()
    return
  }
  if (!detail.value || !scenicId.value) return

  uploadImages.value = []
  checkinComment.value = ''
  showCheckinModal.value = true
  ensureLocation()
}

const closeCheckinModal = () => {
  showCheckinModal.value = false
}

const chooseImage = () => {
  uni.chooseImage({
    count: 9 - uploadImages.value.length,
    success: (res) => {
      uploadImages.value.push(...res.tempFilePaths)
    },
  })
}

const removeImage = (index: number) => {
  uploadImages.value.splice(index, 1)
}

const submitCheckin = async () => {
  const userId = user.value?.id
  if (!userId) {
    showLoginPromptDialog()
    return
  }
  if (!scenicId.value) return

  if (!locationOk.value) {
    uni.showToast({ title: '请先开启定位权限', icon: 'none' })
    return
  }

  try {
    await checkinApi.addCheckin({
      userId,
      targetType: 'scenic',
      targetId: scenicId.value,
      content: checkinComment.value.trim() || undefined,
      latitude: detail.value?.latitude,
      longitude: detail.value?.longitude,
    })

    uni.showToast({ title: '打卡成功', icon: 'success' })
    closeCheckinModal()
    loadScenicCheckins()
  } catch (error: any) {
    uni.showToast({
      title: error?.data?.msg || error?.message || '打卡失败，请稍后重试',
      icon: 'none',
    })
  }
}

const openTicketModal = () => {
  if (!detail.value) return
  if (isFreeScenic.value) {
    uni.showToast({ title: '该景点免费，无需预订门票', icon: 'none' })
    return
  }
  if (!ticketOptions.value.length) {
    uni.showToast({ title: '该景点暂未配置可预订票种', icon: 'none' })
    return
  }
  showTicketModal.value = true
}

const closeTicketModal = () => {
  showTicketModal.value = false
}

const onPlayDateChange = (e: any) => {
  selectedPlayDate.value = e.detail.value
}

const changeTicketCount = (step: number) => {
  const next = ticketCount.value + step
  if (next < 1 || next > 9) return
  ticketCount.value = next
}

const submitTicketOrder = () => {
  if (!selectedPlayDate.value) {
    uni.showToast({ title: '请选择游玩日期', icon: 'none' })
    return
  }
  if (!user.value) {
    showLoginPromptDialog()
    return
  }
  uni.showToast({ title: '门票预订成功', icon: 'success' })
  closeTicketModal()
}
</script>

<style scoped>
.scenic-detail-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
}

.title-safe-space {
  height: 12rpx;
}

/* 顶部图片 */
.header-image {
  width: 100%;
  height: 400rpx;
  position: relative;
  overflow: hidden;
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
  box-sizing: border-box;
  padding-top: 12rpx;
}

.content {
  padding: 0 24rpx 240rpx;
}

/* 头部信息区域 */
.header-section {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-top: 32rpx;
  position: relative;
  z-index: 10;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  margin-bottom: 24rpx;
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

.heritage-badge {
  padding: 8rpx 16rpx;
  background: linear-gradient(135deg, #ff9800, #ffb74d);
  border-radius: 20rpx;
}

.heritage-text {
  font-size: 22rpx;
  color: #ffffff;
  font-weight: 600;
}

.location-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 24rpx;
}

.location-icon {
  font-size: 24rpx;
  color: #666666;
}

.location-text {
  font-size: 26rpx;
  color: #666666;
}

.stats-row {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-top: 1rpx solid #f0f0f0;
  border-bottom: 1rpx solid #f0f0f0;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #999999;
}

.stat-value {
  font-size: 32rpx;
  font-weight: 600;
}

.score-value {
  color: #3ba272;
}

.hot-value {
  color: #ff6b6b;
}

.price-value {
  color: #3ba272;
}

.price-value.price-free {
  color: #ff6b6b;
}

.stat-divider {
  width: 1rpx;
  height: 40rpx;
  background-color: #e5e5e5;
}

/* 信息卡片 */
.info-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.info-item {
  margin-bottom: 32rpx;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.info-icon {
  font-size: 28rpx;
  color: #3ba272;
}

.info-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.info-content {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.6;
  display: block;
  padding-left: 40rpx;
}

.free-notice-content {
  color: #3ba272;
  font-weight: 500;
  background-color: #e8f6f0;
  padding: 12rpx 20rpx;
  border-radius: 12rpx;
  display: inline-block;
  margin-left: 40rpx;
}

/* 简介卡片 */
.intro-card {
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
  color: #3ba272;
}

.title-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
}

.intro-text {
  font-size: 28rpx;
  color: #666666;
  line-height: 1.8;
  text-align: justify;
}

/* 标签卡片 */
.tags-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag-item {
  padding: 12rpx 24rpx;
  background-color: #f0f7f4;
  color: #3ba272;
  border-radius: 20rpx;
  font-size: 24rpx;
  border: 1rpx solid #e8f6f0;
}

/* 附近美食卡片 */
.nearby-food-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  overflow: visible;
}

.food-list {
  display: flex;
  gap: 10rpx;
  width: 100%;
  padding-bottom: 8rpx;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
}

.food-item {
  flex: 1;
  min-width: 200rpx;
  max-width: 240rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
  box-sizing: border-box;
  flex-shrink: 0;
}

.food-item:active {
  transform: scale(0.95);
}

.food-image {
  width: 100%;
  height: 150rpx;
  border-radius: 16rpx;
  background-color: #f5f5f5;
  margin-bottom: 12rpx;
}

.food-image-placeholder {
  width: 100%;
  height: 150rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
}

.food-icon {
  font-size: 60rpx;
  color: #ffffff;
}

.food-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #333333;
  text-align: center;
  margin-bottom: 8rpx;
  width: 100%;
  word-break: break-all;
  word-wrap: break-word;
  line-height: 1.5;
  display: block;
  overflow: visible;
}

.food-score {
  font-size: 22rpx;
  color: #999999;
  text-align: center;
  width: 100%;
  word-break: break-all;
  word-wrap: break-word;
  line-height: 1.4;
  margin-top: 4rpx;
}

/* 打卡评价样式（列表 + 自己打卡按钮） */
.checkin-list {
  margin-top: 8rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.checkin-item {
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.checkin-item:last-child {
  border-bottom-width: 0;
}

.checkin-user-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.checkin-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background-color: #e5e5e5;
  flex-shrink: 0;
}

.checkin-user-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.checkin-nickname {
  font-size: 26rpx;
  color: #333333;
  font-weight: 500;
}

.checkin-time {
  font-size: 22rpx;
  color: #999999;
}

.checkin-content-text {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #555555;
  line-height: 1.6;
}

.checkin-photo-row {
  margin-top: 10rpx;
}

.checkin-photo {
  width: 100%;
  height: 260rpx;
  border-radius: 16rpx;
  background-color: #f5f5f5;
}

.checkin-empty {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #999999;
}

.checkin-self-row {
  margin-top: 16rpx;
  display: flex;
  justify-content: flex-end;
}

.checkin-self-btn {
  padding: 16rpx 32rpx;
  background-color: #3ba272;
  color: #ffffff;
  border-radius: 32rpx;
  font-size: 26rpx;
  border: none;
}

.loading {
  padding: 80rpx 32rpx;
  text-align: center;
  color: #999999;
  font-size: 28rpx;
}

/* 底部操作栏 */
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

.favorite-btn {
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 44rpx;
  flex-shrink: 0;
  transition: all 0.3s;
}

.favorite-btn:active {
  transform: scale(0.95);
  background-color: #eeeeee;
}

.favorite-icon {
  font-size: 44rpx;
  color: #999999;
  transition: color 0.3s;
}

.favorite-icon.favorited {
  color: #ffd700;
}

.action-buttons {
  flex: 1;
  display: flex;
  gap: 16rpx;
}

.action-btn {
  flex: 1;
  padding: 28rpx;
  border-radius: 24rpx;
  font-size: 28rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  border: none;
}

.checkin-btn {
  background: linear-gradient(135deg, #3ba272, #6fd3a5);
  color: #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(59, 162, 114, 0.3);
}

.route-btn {
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(64, 158, 255, 0.3);
}

.ticket-btn {
  background: linear-gradient(135deg, #50b999, #72cfb2);
  color: #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(80, 185, 153, 0.3);
}

.ticket-btn-disabled {
  background: #dfe9e5;
  box-shadow: none;
}

.ticket-btn-disabled .btn-text {
  color: #6f827c;
}

.route-btn.added {
  background: linear-gradient(135deg, #3ba272, #6fd3a5);
  box-shadow: 0 8rpx 24rpx rgba(59, 162, 114, 0.3);
}

.btn-icon {
  font-size: 32rpx;
  font-weight: 700;
}

.btn-text {
  font-size: 28rpx;
  color: #ffffff;
  display: inline-block;
}

/* 打卡弹窗（景点详情内直接打卡） */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-height: 80vh;
  background-color: #ffffff;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #eeeeee;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.modal-close {
  font-size: 44rpx;
  color: #999999;
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  flex: 1;
  padding: 32rpx;
  overflow-y: auto;
}

.upload-section {
  margin-bottom: 28rpx;
}

.section-label {
  font-size: 28rpx;
  color: #333333;
  font-weight: 600;
  display: block;
  margin-bottom: 16rpx;
}

.location-warning {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #f59e0b;
}

.upload-area {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.upload-item {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.upload-image {
  width: 100%;
  height: 100%;
}

.upload-delete {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 999rpx;
  background-color: rgba(0, 0, 0, 0.6);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
}

.upload-add {
  width: 160rpx;
  height: 160rpx;
  border: 2rpx dashed #cccccc;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f6f7;
}

.upload-text {
  font-size: 24rpx;
  color: #3ba272;
  font-weight: 600;
}

.comment-section {
  position: relative;
}

.comment-input {
  width: 100%;
  min-height: 200rpx;
  padding: 20rpx;
  background-color: #f5f6f7;
  border-radius: 16rpx;
  font-size: 26rpx;
  color: #333333;
  box-sizing: border-box;
}

.char-count {
  position: absolute;
  bottom: 12rpx;
  right: 20rpx;
  font-size: 22rpx;
  color: #999999;
}

.modal-footer {
  padding: 24rpx 32rpx 32rpx;
  border-top: 1rpx solid #eeeeee;
}

.submit-btn {
  width: 100%;
  padding: 24rpx;
  background-color: #2fa66a;
  color: #ffffff;
  border-radius: 48rpx;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
}

.ticket-block {
  margin-bottom: 22rpx;
}

.ticket-option {
  border: 2rpx solid #e7ecea;
  border-radius: 16rpx;
  padding: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10rpx;
}

.ticket-option.active {
  border-color: #3ba272;
  background: #eef9f4;
}

.ticket-option-name {
  font-size: 26rpx;
  color: #33413d;
}

.ticket-option-price {
  display: flex;
  align-items: baseline;
  gap: 10rpx;
}

.ticket-origin {
  font-size: 22rpx;
  color: #9aa8a3;
  text-decoration: line-through;
}

.ticket-discount {
  font-size: 28rpx;
  color: #e05050;
  font-weight: 700;
}

.ticket-input {
  margin-top: 12rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 12rpx;
  background: #f5f7f6;
  padding: 0 20rpx;
  font-size: 26rpx;
  color: #495c56;
}

.ticket-counter {
  margin-top: 12rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.counter-num {
  font-size: 30rpx;
  font-weight: 600;
  color: #2f3c38;
}

.ticket-total {
  margin-top: 8rpx;
  text-align: right;
  font-size: 30rpx;
  color: #e05050;
  font-weight: 700;
}
</style>
