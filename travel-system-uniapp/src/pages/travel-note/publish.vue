<template>
  <view class="publish-page">
    <scroll-view scroll-y class="scroll">
      <view class="form-card">
        <view class="form-item">
          <text class="label">标题 *</text>
          <input
            class="input"
            v-model="title"
            maxlength="50"
            placeholder="请输入游记标题（4-50 字）"
          />
          <text class="desc">{{ title.length }}/50</text>
        </view>

        <view class="form-item">
          <text class="label">正文 *</text>
          <textarea
            class="textarea"
            v-model="content"
            maxlength="1000"
            placeholder="记录你的行程、玩法与感受（至少 20 字）"
          />
          <text class="desc">{{ content.length }}/1000</text>
        </view>

        <view class="form-item">
          <text class="label">图片 *</text>
          <view class="upload-list">
            <view v-for="(img, idx) in imageUrls" :key="idx" class="upload-item">
              <image class="upload-img" :src="img" mode="aspectFill" />
              <CloseSmall
                class="upload-delete"
                @click="removeImage(idx)"
                theme="outline"
                size="24"
                fill="#ffffff"
              />
            </view>
            <view v-if="imageUrls.length < 9" class="upload-add" @click="chooseImages">
              <text class="add-icon">＋</text>
              <text class="add-text">添加</text>
            </view>
          </view>
          <text class="desc">最多 9 张，至少 1 张</text>
        </view>

        <view class="form-item picker-item">
          <text class="label">城市 *</text>
          <picker mode="selector" :range="cityList" range-key="name" @change="onCityChange">
            <view class="picker-value">
              {{ selectedCity?.name || '请选择城市' }}
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="label">关联景点（可多选）</text>
          <view class="tag-list">
            <view
              v-for="item in scenicOptions"
              :key="item.id"
              class="tag"
              :class="{ active: scenicIds.includes(item.id) }"
              @click="toggleScenic(item.id)"
            >
              {{ item.name }}
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="label">标签（可多选）</text>
          <view class="tag-list">
            <view
              v-for="tag in tagOptions"
              :key="tag.id"
              class="tag"
              :class="{ active: tagIds.includes(tag.id) }"
              @click="toggleTag(tag.id)"
            >
              {{ tag.tagName }}
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="submit-bar">
      <button class="submit-btn" :loading="submitting || loading" @click="onSubmit">
        {{ loading ? '加载中...' : (submitting ? (isEditMode ? '更新中...' : '发布中...') : (isEditMode ? '更新' : '发布')) }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue'
import {
  travelNoteApi,
  cityApi,
  scenicSpotApi,
  tagApi,
  uploadApi,
  type ApiResponse,
} from '@/api/content'
import { useUserStore } from '@/store/user'

interface CityItem {
  id: number
  name: string
}

interface ScenicItem {
  id: number
  name: string
}

interface TagItem {
  id: number
  tagName: string
}

const store = useUserStore()
const user = computed(() => store.state.profile)
const noteId = ref<number | null>(null) // 编辑模式下的游记ID
const isEditMode = computed(() => noteId.value !== null)
const title = ref('')
const content = ref('')
const imageUrls = ref<string[]>([])
const cityList = ref<CityItem[]>([])
const selectedCity = ref<CityItem | null>(null)
const scenicOptions = ref<ScenicItem[]>([])
const scenicIds = ref<number[]>([])
const tagOptions = ref<TagItem[]>([])
const tagIds = ref<number[]>([])
const submitting = ref(false)
const loading = ref(false)

const loadCities = async () => {
  const res = await cityApi.list()
  const data = res.data as ApiResponse<any[]>
  if (res.statusCode === 200 && data.code === 200) {
    cityList.value = (data.data || []).map((c: any) => ({
      id: c.id,
      name: c.cityName || c.name,
    }))
  }
}

const loadTags = async () => {
  const res = await tagApi.list()
  const data = res.data as ApiResponse<any[]>
  if (res.statusCode === 200 && data.code === 200) {
    tagOptions.value = data.data || []
  }
}

const loadScenic = async (cityId?: number) => {
  const res = await scenicSpotApi.list({ pageNum: 1, pageSize: 20, cityId })
  const data = res.data as ApiResponse<{ list: any[] }>
  if (res.statusCode === 200 && data.code === 200) {
    scenicOptions.value = (data.data?.list || []).map((s: any) => ({
      id: s.id,
      name: s.name,
    }))
  }
}

const onCityChange = (e: any) => {
  const index = e.detail.value
  selectedCity.value = cityList.value[index]
  scenicIds.value = []
  loadScenic(selectedCity.value?.id)
}

const toggleScenic = (id: number) => {
  const idx = scenicIds.value.indexOf(id)
  if (idx > -1) {
    scenicIds.value.splice(idx, 1)
  } else {
    scenicIds.value.push(id)
  }
}

const toggleTag = (id: number) => {
  const idx = tagIds.value.indexOf(id)
  if (idx > -1) {
    tagIds.value.splice(idx, 1)
  } else {
    tagIds.value.push(id)
  }
}

const chooseImages = () => {
  const remain = 9 - imageUrls.value.length
  uni.chooseImage({
    count: remain,
    success: async (res) => {
      for (const path of res.tempFilePaths) {
        const uploadRes = await uploadApi.upload(path)
        const data = JSON.parse(uploadRes.data) as ApiResponse<{ url: string }>
        if (uploadRes.statusCode === 200 && data.code === 200) {
          // 后端返回格式：{ code: 200, msg: "success", data: { url: "..." } }
          const imageUrl = typeof data.data === 'string' ? data.data : data.data?.url
          if (imageUrl) {
            imageUrls.value.push(imageUrl)
          } else {
            uni.showToast({ title: '上传失败：未获取到图片URL', icon: 'none' })
            break
          }
        } else {
          uni.showToast({ title: data.msg || '上传失败', icon: 'none' })
          break
        }
      }
    },
  })
}

const removeImage = (idx: number) => {
  imageUrls.value.splice(idx, 1)
}

const validate = () => {
  if (title.value.trim().length < 4) {
    uni.showToast({ title: '标题至少 4 个字', icon: 'none' })
    return false
  }
  if (content.value.trim().length < 20) {
    uni.showToast({ title: '正文至少 20 个字', icon: 'none' })
    return false
  }
  if (imageUrls.value.length === 0) {
    uni.showToast({ title: '请至少上传一张图片', icon: 'none' })
    return false
  }
  if (!selectedCity.value) {
    uni.showToast({ title: '请选择城市', icon: 'none' })
    return false
  }
  return true
}

// 加载游记详情（编辑模式）
const loadNoteDetail = async (id: number) => {
  if (!user.value) return
  loading.value = true
  try {
    const res = await travelNoteApi.getDetail(id, user.value.id)
    const data = res.data as ApiResponse<any>
    if (res.statusCode === 200 && data.code === 200) {
      const note = data.data
      title.value = note.title || ''
      content.value = note.content || ''
      imageUrls.value = note.imageUrls || note.images || []
      
      // 设置城市
      if (note.cityId) {
        const city = cityList.value.find(c => c.id === note.cityId)
        if (city) {
          selectedCity.value = city
          await loadScenic(city.id)
        }
      }
      
      // 设置景点和标签
      scenicIds.value = note.scenicIds || []
      tagIds.value = note.tagIds || []
    } else {
      uni.showToast({ title: data.msg || '加载失败', icon: 'none' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
  } catch (error) {
    uni.showToast({ title: '加载失败', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } finally {
    loading.value = false
  }
}

const onSubmit = async () => {
  if (submitting.value) return
  if (!validate()) return
  if (!user.value) {
    uni.showToast({ title: '请先登录后再发布', icon: 'none' })
    uni.switchTab({ url: '/pages/profile/profile' })
    return
  }
  submitting.value = true
  try {
    let res: any
    if (isEditMode.value && noteId.value) {
      // 编辑模式：更新游记
      res = await travelNoteApi.update(noteId.value, {
        userId: user.value.id,
        title: title.value.trim(),
        content: content.value.trim(),
        cityId: selectedCity.value!.id,
        cityName: selectedCity.value!.name,
        imageUrls: imageUrls.value,
        scenicIds: scenicIds.value,
        tagIds: tagIds.value,
      })
    } else {
      // 新建模式：发布游记
      res = await travelNoteApi.publish({
        userId: user.value.id,
        title: title.value.trim(),
        content: content.value.trim(),
        cityId: selectedCity.value!.id,
        cityName: selectedCity.value!.name,
        imageUrls: imageUrls.value,
        scenicIds: scenicIds.value,
        tagIds: tagIds.value,
      })
    }
    const data = res.data as ApiResponse<{ noteId?: number }>
    if (res.statusCode === 200 && data.code === 200) {
      if (isEditMode.value) {
        // 编辑模式：更新成功，跳转到详情页
        uni.showToast({ title: '更新成功', icon: 'success' })
        setTimeout(() => {
          if (noteId.value) {
            uni.redirectTo({ url: `/pages/travel-note/detail?id=${noteId.value}` })
          } else {
            uni.navigateBack()
          }
        }, 300)
      } else {
        // 新建模式：已提交，等待审核，跳转到我的游记页面
        uni.showToast({ title: '已提交，等待审核', icon: 'success' })
        setTimeout(() => {
          // 跳转到我的游记页面，显示待审核状态
          uni.redirectTo({ url: '/pages/profile/my-article?status=pending' })
        }, 1500)
      }
    } else {
      uni.showToast({ title: data.msg || (isEditMode.value ? '更新失败' : '发布失败'), icon: 'none' })
    }
  } catch (error) {
    uni.showToast({ title: '网络错误', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  // 检查是否是编辑模式
  // 使用 nextTick 确保页面完全初始化后再获取参数
  nextTick(() => {
    try {
      // 在 uniapp 中，getCurrentPages 通过 uni 对象访问
      // 添加延迟确保页面栈已初始化（特别是通过 tabbar 切换时）
      let pages: any[] = []
      
      // 尝试通过 uni.getCurrentPages 获取
      if (typeof uni !== 'undefined' && uni.getCurrentPages) {
        const getPagesFn = uni.getCurrentPages
        if (typeof getPagesFn === 'function') {
          pages = getPagesFn()
        }
      }
      
      if (pages && pages.length > 0) {
        const currentPage = pages[pages.length - 1]
        const options = (currentPage as any).options || {}
        if (options.id) {
          noteId.value = parseInt(options.id)
        }
      }
    } catch (error) {
      console.warn('获取页面参数失败:', error)
    }
    
    loadCities().then(() => {
      loadTags()
      loadScenic()
      // 如果是编辑模式，加载游记详情
      if (noteId.value) {
        loadNoteDetail(noteId.value)
      }
    })
  })
})
</script>

<style scoped>
.publish-page {
  min-height: 100vh;
  background: #f7f8fa;
  display: flex;
  flex-direction: column;
}

.scroll {
  flex: 1;
}

.form-card {
  background: #ffffff;
  margin: 24rpx;
  padding: 24rpx;
  border-radius: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
}

.form-item {
  margin-bottom: 24rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333333;
  font-weight: 600;
  margin-bottom: 12rpx;
}

.input {
  width: 100%;
  padding: 16rpx 20rpx;
  background: #f7f8fa;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333333;
}

.textarea {
  width: 100%;
  min-height: 200rpx;
  padding: 16rpx 20rpx;
  background: #f7f8fa;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333333;
}

.desc {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #999999;
}

.upload-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.upload-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  overflow: hidden;
}

.upload-img {
  width: 100%;
  height: 100%;
  background: #e5e5e5;
}

.upload-delete {
  position: absolute;
  top: 6rpx;
  right: 6rpx;
  background: rgba(0, 0, 0, 0.5);
  color: #ffffff;
  border-radius: 50%;
  width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}

.upload-add {
  width: 200rpx;
  height: 200rpx;
  border: 1rpx dashed #c0c0c0;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999999;
  background: #fafafa;
}

.add-icon {
  font-size: 48rpx;
  line-height: 1;
}

.add-text {
  font-size: 24rpx;
}

.picker-item .picker-value {
  padding: 16rpx 20rpx;
  background: #f7f8fa;
  border-radius: 12rpx;
  color: #333333;
  font-size: 28rpx;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag {
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  background: #f1f3f5;
  color: #666666;
  font-size: 24rpx;
}

.tag.active {
  background: #e6f5ed;
  color: #3ba272;
  border: 1rpx solid #3ba272;
}

.submit-bar {
  padding: 16rpx 24rpx;
  background: #ffffff;
  border-top: 1rpx solid #f0f0f0;
}

.submit-btn {
  width: 100%;
  background: #3ba272;
  color: #ffffff;
  border-radius: 999rpx;
  font-size: 30rpx;
  padding: 20rpx 0;
}
</style>

