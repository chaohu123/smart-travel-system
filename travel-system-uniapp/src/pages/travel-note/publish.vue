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
import { onLoad } from '@dcloudio/uni-app'
import {
  travelNoteApi,
  cityApi,
  scenicSpotApi,
  tagApi,
  uploadApi,
  type ApiResponse,
} from '@/api/content'
import { useUserStore } from '@/store/user'
import { getImageUrl } from '@/utils/image'
import { STATIC_BASE_URL } from '@/utils/config'

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

/**
 * 从完整 URL 中提取相对路径，用于提交给后端
 * 例如: http://192.168.142.1:8080/uploads/2026/01/03/xxx.jpg -> /uploads/2026/01/03/xxx.jpg
 */
const extractRelativePath = (url: string): string => {
  if (!url) return url
  // 如果已经是相对路径，直接返回
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // 去掉查询参数
    return url.split('?')[0]
  }
  // 从完整 URL 中提取路径部分
  try {
    const urlObj = new URL(url)
    return urlObj.pathname + urlObj.search
  } catch {
    // 如果 URL 解析失败，尝试手动提取
    if (url.includes(STATIC_BASE_URL)) {
      const path = url.substring(url.indexOf(STATIC_BASE_URL) + STATIC_BASE_URL.length)
      return path.split('?')[0]
    }
    return url
  }
}

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
            // 使用 getImageUrl 转换，确保小程序端能正确显示
            // 注意：提交时需要原始相对路径，但显示时需要完整 URL
            // 这里存储完整 URL 用于显示，提交时会提取相对路径
            imageUrls.value.push(getImageUrl(imageUrl, false))
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
      const detail = data.data
      // 后端返回的数据结构：{ note: {...}, images: [...], tags: [...], scenics: [...] }
      const note = detail.note || detail // 兼容不同的数据结构
      
      console.log('=== 加载游记详情 ===')
      console.log('完整数据:', detail)
      console.log('游记基本信息:', note)
      console.log('图片列表:', detail.images)
      console.log('景点列表:', detail.scenics)
      console.log('标签列表:', detail.tags)
      
      // 填充基本信息
      title.value = note.title || note.title || ''
      content.value = note.content || note.content || ''
      
      console.log('填充后的标题:', title.value, '长度:', title.value.length)
      console.log('填充后的正文:', content.value.substring(0, 50) + '...', '长度:', content.value.length)
      
      // 处理图片：后端返回的是 images 数组，每个元素有 url 和 sort 属性
      // 需要使用 getImageUrl 将相对路径转换为完整 URL，确保小程序端能正确加载
      if (detail.images && Array.isArray(detail.images)) {
        // 按 sort 排序，然后提取 url
        const sortedImages = [...detail.images].sort((a: any, b: any) => (a.sort || 0) - (b.sort || 0))
        imageUrls.value = sortedImages.map((img: any) => {
          // 兼容不同的数据结构：可能是对象 {url: "..."} 或直接是字符串
          const url = img.url || img
          return url ? getImageUrl(url, false) : null // 编辑页面不需要缓存时间戳
        }).filter((url: any) => url && typeof url === 'string')
      } else if (note.imageUrls) {
        imageUrls.value = Array.isArray(note.imageUrls) 
          ? note.imageUrls.map((url: string) => getImageUrl(url, false)).filter(Boolean)
          : []
      } else if (note.images) {
        // 兼容处理
        const images = Array.isArray(note.images) ? note.images : []
        imageUrls.value = images.map((img: any) => {
          const url = typeof img === 'string' ? img : (img.url || '')
          return url ? getImageUrl(url, false) : null
        }).filter(Boolean)
      } else {
        imageUrls.value = []
      }
      
      // 设置城市（需要等待城市列表加载完成）
      const cityId = note.cityId || note.city_id // 兼容不同的字段名
      if (cityId) {
        // 确保城市列表已加载
        if (cityList.value.length === 0) {
          await loadCities()
        }
        const city = cityList.value.find(c => c.id === cityId || c.id === Number(cityId))
        if (city) {
          selectedCity.value = city
          console.log('设置城市:', city)
          // 加载该城市的景点列表
          await loadScenic(city.id)
        } else {
          // 如果城市列表中找不到，尝试从 note 中获取城市信息
          const cityName = note.cityName || note.city_name
          if (cityName) {
            // 创建一个临时城市对象
            selectedCity.value = { id: Number(cityId), name: cityName }
            console.log('使用临时城市对象:', selectedCity.value)
            await loadScenic(Number(cityId))
          } else {
            console.warn('未找到城市信息，cityId:', cityId)
          }
        }
      } else {
        console.warn('游记没有城市ID')
      }
      
      // 处理景点ID：后端返回的是 scenics 数组，每个元素有 id 属性
      if (detail.scenics && Array.isArray(detail.scenics)) {
        scenicIds.value = detail.scenics.map((scenic: any) => {
          const id = scenic.id || scenic.scenicId || scenic.scenic_id
          return id != null ? Number(id) : null
        }).filter((id: any) => id != null)
        console.log('填充景点ID:', scenicIds.value)
      } else if (note.scenicIds || note.scenic_ids) {
        const ids = note.scenicIds || note.scenic_ids
        scenicIds.value = Array.isArray(ids) ? ids.map((id: any) => Number(id)) : []
        console.log('从note中填充景点ID:', scenicIds.value)
      } else {
        scenicIds.value = []
        console.log('没有景点ID')
      }
      
      // 处理标签ID：后端返回的是 tags 数组，直接是 ID 列表
      if (detail.tags && Array.isArray(detail.tags)) {
        tagIds.value = detail.tags.map((id: any) => Number(id)).filter((id: any) => id != null && !isNaN(id))
        console.log('填充标签ID:', tagIds.value)
      } else if (note.tagIds || note.tag_ids) {
        const ids = note.tagIds || note.tag_ids
        tagIds.value = Array.isArray(ids) ? ids.map((id: any) => Number(id)) : []
        console.log('从note中填充标签ID:', tagIds.value)
      } else {
        tagIds.value = []
        console.log('没有标签ID')
      }
      
      console.log('数据填充完成 - 标题:', title.value, '正文长度:', content.value.length, '图片数:', imageUrls.value.length)
    } else {
      uni.showToast({ title: data.msg || '加载失败', icon: 'none' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
  } catch (error) {
    console.error('加载游记详情失败:', error)
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
      // 提交时需要将完整 URL 转换为相对路径
      const relativeImageUrls = imageUrls.value.map(extractRelativePath)
      res = await travelNoteApi.update(noteId.value, {
        userId: user.value.id,
        title: title.value.trim(),
        content: content.value.trim(),
        cityId: selectedCity.value!.id,
        cityName: selectedCity.value!.name,
        imageUrls: relativeImageUrls,
        scenicIds: scenicIds.value,
        tagIds: tagIds.value,
      })
    } else {
      // 新建模式：发布游记
      // 提交时需要将完整 URL 转换为相对路径
      const relativeImageUrls = imageUrls.value.map(extractRelativePath)
      res = await travelNoteApi.publish({
        userId: user.value.id,
        title: title.value.trim(),
        content: content.value.trim(),
        cityId: selectedCity.value!.id,
        cityName: selectedCity.value!.name,
        imageUrls: relativeImageUrls,
        scenicIds: scenicIds.value,
        tagIds: tagIds.value,
      })
    }
    const data = res.data as ApiResponse<{ noteId?: number }>
    if (res.statusCode === 200 && data.code === 200) {
      if (isEditMode.value) {
        // 编辑模式：已提交，等待审核（已发布的游记修改后需要重新审核）
        uni.showToast({ title: '已提交，等待审核', icon: 'success' })
        setTimeout(() => {
          // 跳转到我的游记页面，显示待审核状态
          uni.redirectTo({ url: '/pages/profile/my-article?status=pending' })
        }, 1500)
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

// 使用 onLoad 获取页面参数（更可靠的方式）
onLoad((options: any) => {
  console.log('onLoad 获取到的参数:', options)
  if (options && options.id) {
    noteId.value = parseInt(options.id)
    console.log('检测到编辑模式，游记ID:', noteId.value)
  } else {
    console.log('非编辑模式，没有ID参数')
  }
})

onMounted(() => {
  // 先加载基础数据（城市、标签、景点），然后再加载游记详情
  Promise.all([
    loadCities(),
    loadTags(),
    loadScenic()
  ]).then(() => {
    console.log('基础数据加载完成 - 城市数:', cityList.value.length, '标签数:', tagOptions.value.length, '景点数:', scenicOptions.value.length)
    // 如果是编辑模式，等待基础数据加载完成后再加载游记详情
    if (noteId.value) {
      console.log('开始加载游记详情，ID:', noteId.value)
      loadNoteDetail(noteId.value)
    } else {
      console.log('非编辑模式，不加载详情')
    }
  }).catch((error) => {
    console.error('加载基础数据失败:', error)
    // 即使基础数据加载失败，如果是编辑模式也尝试加载详情
    if (noteId.value) {
      console.log('基础数据加载失败，但仍尝试加载游记详情，ID:', noteId.value)
      loadNoteDetail(noteId.value)
    }
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

