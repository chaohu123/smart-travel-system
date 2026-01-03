<template>
  <view class="preference-page">
    <view class="preference-container">
      <!-- 页面头部 -->
      <view class="page-header">
        <text class="page-title">AI偏好设置</text>
        <text class="page-subtitle">定制您的专属推荐算法</text>
      </view>

      <!-- 兴趣标签 -->
      <view class="setting-section">
        <view class="section-header">
          <text class="section-title">兴趣标签</text>
          <text class="section-desc">选择您感兴趣的标签，AI将据此为您推荐内容</text>
        </view>
        <view class="tags-container">
          <view
            v-for="tag in tagList"
            :key="tag.id"
            class="tag-item"
            :class="{ active: selectedTags.includes(tag.id) }"
            @click="toggleTag(tag.id)"
          >
            <text class="tag-icon">{{ getTagIcon(tag.name) }}</text>
            <text class="tag-name">{{ tag.name }}</text>
          </view>
        </view>
      </view>

      <!-- 推荐偏好 -->
      <view class="setting-section">
        <view class="section-header">
          <text class="section-title">推荐偏好</text>
          <text class="section-desc">调整推荐算法的权重设置</text>
        </view>
        
        <view class="preference-item">
          <view class="preference-label">
            <text class="label-text">热门度权重</text>
            <text class="label-desc">更偏向推荐热门内容</text>
          </view>
          <slider
            :value="preferences.hotWeight"
            min="0"
            max="100"
            step="10"
            activeColor="#3ba272"
            backgroundColor="#e0e0e0"
            block-size="20"
            @change="onHotWeightChange"
          />
          <text class="preference-value">{{ preferences.hotWeight }}%</text>
        </view>

        <view class="preference-item">
          <view class="preference-label">
            <text class="label-text">个性化权重</text>
            <text class="label-desc">更偏向根据您的兴趣推荐</text>
          </view>
          <slider
            :value="preferences.personalWeight"
            min="0"
            max="100"
            step="10"
            activeColor="#3ba272"
            backgroundColor="#e0e0e0"
            block-size="20"
            @change="onPersonalWeightChange"
          />
          <text class="preference-value">{{ preferences.personalWeight }}%</text>
        </view>

        <view class="preference-item">
          <view class="preference-label">
            <text class="label-text">新鲜度权重</text>
            <text class="label-desc">更偏向推荐最新发布的内容</text>
          </view>
          <slider
            :value="preferences.freshWeight"
            min="0"
            max="100"
            step="10"
            activeColor="#3ba272"
            backgroundColor="#e0e0e0"
            block-size="20"
            @change="onFreshWeightChange"
          />
          <text class="preference-value">{{ preferences.freshWeight }}%</text>
        </view>
      </view>

      <!-- 其他设置 -->
      <view class="setting-section">
        <view class="section-header">
          <text class="section-title">其他设置</text>
        </view>
        
        <view class="switch-item">
          <view class="switch-label">
            <text class="label-text">开启智能推送</text>
            <text class="label-desc">根据您的偏好推送相关内容</text>
          </view>
          <switch
            :checked="preferences.enablePush"
            color="#3ba272"
            @change="onPushChange"
          />
        </view>

        <view class="switch-item">
          <view class="switch-label">
            <text class="label-text">开启位置推荐</text>
            <text class="label-desc">基于当前位置推荐附近内容</text>
          </view>
          <switch
            :checked="preferences.enableLocation"
            color="#3ba272"
            @change="onLocationChange"
          />
        </view>
      </view>

      <!-- 保存按钮 -->
      <button
        class="save-btn"
        :class="{ disabled: saving }"
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

const store = useUserStore()
const user = computed(() => store.state.profile)

const tagList = ref<any[]>([])
const selectedTags = ref<number[]>([])
const saving = ref(false)

const preferences = reactive({
  hotWeight: 50,
  personalWeight: 50,
  freshWeight: 50,
  enablePush: true,
  enableLocation: true
})

// 获取标签图标
const getTagIcon = (tagName: string) => {
  const iconMap: Record<string, string> = {
    '自然风光': '🏔️',
    '历史文化': '🏛️',
    '美食': '🍜',
    '购物': '🛍️',
    '娱乐': '🎢',
    '休闲': '🌴',
    '运动': '⚽',
    '摄影': '📷',
    '亲子': '👨‍👩‍👧',
    '情侣': '💑',
    '朋友': '👥',
    '独自': '🚶'
  }
  return iconMap[tagName] || '🏷️'
}

// 切换标签
const toggleTag = (tagId: number) => {
  const index = selectedTags.value.indexOf(tagId)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tagId)
  }
}

// 滑块变化
const onHotWeightChange = (e: any) => {
  preferences.hotWeight = e.detail.value
}

const onPersonalWeightChange = (e: any) => {
  preferences.personalWeight = e.detail.value
}

const onFreshWeightChange = (e: any) => {
  preferences.freshWeight = e.detail.value
}

// 开关变化
const onPushChange = (e: any) => {
  preferences.enablePush = e.detail.value
}

const onLocationChange = (e: any) => {
  preferences.enableLocation = e.detail.value
}

// 加载标签列表
const loadTags = async () => {
  try {
    const res = await tagApi.list()
    if (res.statusCode === 200 && res.data.code === 200) {
      tagList.value = res.data.data || []
    }
  } catch (error) {
    console.error('加载标签失败', error)
  }
}

// 加载用户偏好设置
const loadPreferences = async () => {
  if (!user.value?.id) return

  try {
    // 从本地存储加载
    const saved = uni.getStorageSync(`preferences_${user.value.id}`)
    if (saved) {
      Object.assign(preferences, saved.preferences || {})
      selectedTags.value = saved.selectedTags || []
    } else {
      // 如果有用户兴趣标签，加载它们
      if (user.value.interests && user.value.interests.length > 0) {
        // 根据兴趣名称匹配标签ID
        const interestNames = user.value.interests
        const matchedTags = tagList.value.filter(tag => 
          interestNames.includes(tag.name)
        )
        selectedTags.value = matchedTags.map(tag => tag.id)
      }
    }
  } catch (error) {
    console.error('加载偏好设置失败', error)
  }
}

// 保存偏好设置
const savePreferences = async () => {
  if (!user.value?.id) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  saving.value = true

  try {
    // 保存兴趣标签
    if (selectedTags.value.length > 0) {
      const selectedTagNames = tagList.value
        .filter(tag => selectedTags.value.includes(tag.id))
        .map(tag => tag.name)
      
      await userApi.updateInterests(user.value.id, selectedTagNames)
    }

    // 保存偏好设置到本地存储
    const dataToSave = {
      preferences: { ...preferences },
      selectedTags: [...selectedTags.value]
    }
    uni.setStorageSync(`preferences_${user.value.id}`, dataToSave)

    uni.showToast({ title: '设置已保存', icon: 'success' })
    
    // 更新store中的用户信息
    if (selectedTags.value.length > 0) {
      const selectedTagNames = tagList.value
        .filter(tag => selectedTags.value.includes(tag.id))
        .map(tag => tag.name)
      store.setUser({ ...user.value, interests: selectedTagNames }, store.state.token)
    }
  } catch (error) {
    console.error('保存偏好设置失败', error)
    uni.showToast({ title: '保存失败，请稍后重试', icon: 'none' })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadTags()
  await loadPreferences()
})
</script>

<style scoped>
.preference-page {
  min-height: 100vh;
  background-color: #f8fafb;
}

.preference-container {
  padding: 40rpx;
}

.page-header {
  margin-bottom: 40rpx;
}

.page-title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.page-subtitle {
  display: block;
  font-size: 26rpx;
  color: #999;
}

.setting-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-header {
  margin-bottom: 30rpx;
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

.section-desc {
  display: block;
  font-size: 24rpx;
  color: #999;
  line-height: 1.6;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 24rpx;
  background: #f8fafb;
  border-radius: 40rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s;
}

.tag-item.active {
  background: #e4f7ef;
  border-color: #3ba272;
}

.tag-icon {
  font-size: 32rpx;
}

.tag-name {
  font-size: 26rpx;
  color: #666;
}

.tag-item.active .tag-name {
  color: #3ba272;
  font-weight: 600;
}

.preference-item {
  margin-bottom: 40rpx;
}

.preference-item:last-child {
  margin-bottom: 0;
}

.preference-label {
  margin-bottom: 20rpx;
}

.label-text {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.label-desc {
  display: block;
  font-size: 24rpx;
  color: #999;
}

.preference-value {
  display: block;
  text-align: right;
  font-size: 24rpx;
  color: #3ba272;
  font-weight: 600;
  margin-top: 12rpx;
}

.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.switch-item:last-child {
  border-bottom: none;
}

.switch-label {
  flex: 1;
}

.save-btn {
  width: 100%;
  margin-top: 40rpx;
  background: linear-gradient(135deg, #3ba272, #57c18c);
  color: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
}

.save-btn.disabled {
  background: #e0e0e0;
  color: #999;
}
</style>

