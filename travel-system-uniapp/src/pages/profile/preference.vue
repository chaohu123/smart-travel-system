<template>
  <view class="preference-page">
    <!-- 顶部导航 -->
    <view
      class="nav-bar"
      :style="{
        paddingTop: statusBarHeight + 'px',
        paddingRight: navRightPadding + 'px',
      }"
    >
      <text class="nav-back" @click="goBack">←</text>
      <text class="nav-title">AI偏好设置</text>
    </view>

    <scroll-view scroll-y class="page-scroll" :show-scrollbar="false">
      <!-- 兴趣标签 -->
      <view class="card soft-shadow">
        <text class="card-label">兴趣标签</text>
        <text class="card-desc">选择您感兴趣的标签，AI将据此为您推荐景点与线路</text>
        <view class="tags-wrap">
          <view
            v-for="name in presetTagNames"
            :key="name"
            class="tag-chip"
            :class="{ 'tag-chip--active': selectedNames.includes(name) }"
            hover-class="tag-chip-hover"
            :hover-stay-time="80"
            @click="toggleTagName(name)"
          >
            <text class="tag-chip-text">{{ name }}</text>
          </view>
        </view>
      </view>

      <!-- 推荐偏好 -->
      <view class="card soft-shadow card-pref">
        <text class="card-label">推荐偏好</text>
        <text class="card-desc">调整推荐算法的权重设置</text>

        <view
          v-for="item in weightItems"
          :key="item.key"
          class="weight-block"
          :class="{ 'weight-block--active': activeSliderKey === item.key }"
        >
          <view class="weight-head">
            <text class="weight-name">{{ item.title }}</text>
            <text class="weight-pct">{{ preferences[item.key] }}%</text>
          </view>
          <text class="weight-tip">{{ item.tip }}</text>
          <slider
            class="weight-slider"
            :value="preferences[item.key]"
            min="0"
            max="100"
            step="5"
            :active-color="mintActive"
            background-color="#e5ebe8"
            :block-size="22"
            :block-color="mintBlock"
            @changing="() => onSliderChanging(item.key)"
            @change="(e: any) => onWeightChange(item.key, e)"
          />
        </view>

        <view class="reset-row">
          <text class="reset-link" @click="resetWeights">重置默认设置</text>
        </view>
      </view>

      <view class="scroll-bottom-space" />
    </scroll-view>

    <!-- 底部保存 -->
    <view class="bottom-bar safe-bottom">
      <button
        type="default"
        class="save-btn"
        hover-class="save-btn-hover"
        :class="{ 'save-btn--disabled': saving }"
        :disabled="saving"
        :loading="saving"
        @click="savePreferences"
      >
        {{ saving ? '保存中...' : '保存设置' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { tagApi } from '@/api/content'
import { userApi } from '@/api/user'
import { useUserStore } from '@/store/user'
import { safeNavigateBack } from '@/utils/router'

const store = useUserStore()
const user = computed(() => store.state.profile)

const mintActive = '#7fc4b1'
const mintBlock = '#5fa894'

const statusBarHeight = ref(0)
const navRightPadding = ref(0)

const presetTagNames = [
  '自然风光',
  '古镇人文',
  '海岛度假',
  '美食探店',
  '户外徒步',
  '亲子游',
  '网红打卡',
  '小众秘境',
] as const

const tagList = ref<any[]>([])
const selectedNames = ref<string[]>([])
const saving = ref(false)
const activeSliderKey = ref<string | null>(null)

const preferences = reactive({
  hotWeight: 50,
  personalWeight: 50,
  freshWeight: 50,
})

type WeightKey = 'hotWeight' | 'personalWeight' | 'freshWeight'

const weightItems = computed(() => [
  {
    key: 'hotWeight' as const,
    title: '热门度权重',
    tip: '数值越高，越优先推荐热门、高互动的景点与线路',
  },
  {
    key: 'personalWeight' as const,
    title: '个性化权重',
    tip: '数值越高，越贴合您的兴趣标签与历史行为',
  },
  {
    key: 'freshWeight' as const,
    title: '新鲜度权重',
    tip: '数值越高，越优先推荐新上线、近期更新的内容',
  },
])

const goBack = () => {
  safeNavigateBack({ fallbackUrl: '/pages/profile/profile' })
}

const toggleTagName = (name: string) => {
  const i = selectedNames.value.indexOf(name)
  if (i > -1) selectedNames.value.splice(i, 1)
  else selectedNames.value.push(name)
}

const onSliderChanging = (key: string) => {
  activeSliderKey.value = key
}

const onWeightChange = (key: WeightKey, e: any) => {
  preferences[key] = Number(e?.detail?.value ?? preferences[key])
  activeSliderKey.value = null
}

const resetWeights = () => {
  preferences.hotWeight = 50
  preferences.personalWeight = 50
  preferences.freshWeight = 50
  uni.showToast({ title: '已恢复默认权重', icon: 'none' })
}

const loadTags = async () => {
  try {
    const res = await tagApi.list()
    if (res.statusCode === 200 && res.data.code === 200) {
      tagList.value = res.data.data || []
    }
  } catch {
    /* empty */
  }
}

const loadPreferences = async () => {
  if (!user.value?.id) return
  try {
    const saved = uni.getStorageSync(`preferences_${user.value.id}`) as any
    if (saved?.preferences) {
      const p = saved.preferences
      if (typeof p.hotWeight === 'number') preferences.hotWeight = p.hotWeight
      if (typeof p.personalWeight === 'number') preferences.personalWeight = p.personalWeight
      if (typeof p.freshWeight === 'number') preferences.freshWeight = p.freshWeight
    }
    if (saved?.selectedNames && Array.isArray(saved.selectedNames)) {
      selectedNames.value = saved.selectedNames.filter((n: string) => presetTagNames.includes(n as any))
    } else if (saved?.selectedTags && Array.isArray(saved.selectedTags) && tagList.value.length) {
      const names = tagList.value
        .filter((t: any) => saved.selectedTags.includes(t.id))
        .map((t: any) => t.name)
      selectedNames.value = names.filter((n: string) => presetTagNames.includes(n as any))
    } else if (user.value.interests?.length) {
      selectedNames.value = user.value.interests.filter((n: string) =>
        presetTagNames.includes(n as any),
      )
    }
  } catch {
    /* empty */
  }
}

const savePreferences = async () => {
  if (!user.value?.id) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  saving.value = true
  try {
    if (selectedNames.value.length > 0) {
      await userApi.updateInterests(user.value.id, [...selectedNames.value])
    }
    const dataToSave = {
      preferences: { ...preferences },
      selectedNames: [...selectedNames.value],
    }
    uni.setStorageSync(`preferences_${user.value.id}`, dataToSave)
    uni.showToast({ title: '设置已保存', icon: 'success' })
    store.setUser({ ...user.value, interests: [...selectedNames.value] }, store.state.token)
  } catch {
    uni.showToast({ title: '保存失败，请稍后重试', icon: 'none' })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const sys = uni.getSystemInfoSync()
    statusBarHeight.value = sys.statusBarHeight || 0
    // #ifdef MP-WEIXIN
    const menu = uni.getMenuButtonBoundingClientRect()
    if (menu && sys.windowWidth) {
      navRightPadding.value = Math.max(0, sys.windowWidth - menu.left)
    } else {
      navRightPadding.value = 96
    }
    // #endif
    // #ifndef MP-WEIXIN
    navRightPadding.value = 0
    // #endif
  } catch {
    statusBarHeight.value = 0
    navRightPadding.value = 0
  }
  await loadTags()
  await loadPreferences()
})
</script>

<style scoped>
.preference-page {
  min-height: 100vh;
  background: #f2f7f5;
  display: flex;
  flex-direction: column;
}

.nav-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  height: 96rpx;
  padding: 0 24rpx;
  background: #98cfc0;
  box-sizing: content-box;
}

.nav-back {
  position: relative;
  z-index: 2;
  width: 72rpx;
  font-size: 40rpx;
  color: #ffffff;
  line-height: 96rpx;
}

.nav-title {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  font-size: 34rpx;
  font-weight: 600;
  color: #ffffff;
  pointer-events: none;
}

.page-scroll {
  flex: 1;
  height: 0;
  padding: 24rpx 24rpx 0;
  box-sizing: border-box;
}

.scroll-bottom-space {
  height: 200rpx;
}

.soft-shadow {
  box-shadow: 0 8rpx 24rpx rgba(45, 80, 70, 0.06);
}

/* 标题区 */
.hero {
  padding: 8rpx 8rpx 32rpx;
  text-align: center;
}

.hero-title {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: #2d3f39;
  letter-spacing: 1rpx;
}

.hero-sub {
  display: block;
  margin-top: 16rpx;
  font-size: 28rpx;
  color: #5c6f69;
  line-height: 1.45;
}

.hero-hint {
  display: block;
  margin-top: 16rpx;
  padding: 0 16rpx;
  font-size: 24rpx;
  color: #9aa9a3;
  line-height: 1.55;
}

.card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx 24rpx 32rpx;
  margin-bottom: 24rpx;
}

.card-pref {
  padding-bottom: 24rpx;
}

.card-label {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #344843;
}

.card-desc {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #8a9a94;
  line-height: 1.55;
}

.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 24rpx;
}

.tag-chip {
  padding: 18rpx 26rpx;
  border-radius: 999rpx;
  background: #f3f5f4;
  border: 2rpx solid #e5ebe8;
}

.tag-chip-hover {
  opacity: 0.92;
}

.tag-chip--active {
  background: #7fc4b1;
  border-color: #6bb89f;
  box-shadow: 0 6rpx 16rpx rgba(127, 196, 177, 0.45);
}

.tag-chip-text {
  font-size: 26rpx;
  color: #5a6762;
}

.tag-chip--active .tag-chip-text {
  color: #ffffff;
  font-weight: 600;
}

.weight-block {
  margin-top: 28rpx;
  padding: 20rpx 0 8rpx;
  border-radius: 16rpx;
  transition: background 0.2s ease;
}

.weight-block--active {
  background: rgba(152, 207, 192, 0.18);
}

.weight-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.weight-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #344843;
}

.weight-pct {
  font-size: 30rpx;
  font-weight: 700;
  color: #2d8a6e;
  min-width: 88rpx;
  text-align: right;
}

.weight-tip {
  display: block;
  margin-top: 8rpx;
  margin-bottom: 12rpx;
  font-size: 24rpx;
  color: #8a9a94;
  line-height: 1.45;
}

.weight-slider {
  margin: 0;
}

.reset-row {
  display: flex;
  justify-content: center;
  margin-top: 12rpx;
  padding-top: 8rpx;
}

.reset-link {
  font-size: 26rpx;
  color: #6bb89f;
  text-decoration: underline;
  text-underline-offset: 4rpx;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx 28rpx;
  background: rgba(242, 247, 245, 0.96);
  border-top: 1rpx solid #e4ece8;
  z-index: 99;
}

.safe-bottom {
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
}

.save-btn {
  margin: 0;
  width: 100%;
  height: 92rpx;
  line-height: 92rpx;
  border-radius: 999rpx;
  border: none;
  background: #7fc4b1;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 600;
}

.save-btn::after {
  border: none;
}

.save-btn-hover {
  background: #5fa894 !important;
}

.save-btn--disabled {
  background: #c5ddd4 !important;
  color: #f5faf8 !important;
}
</style>
