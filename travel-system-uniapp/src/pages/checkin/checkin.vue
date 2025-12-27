<template>
  <view class="checkin-page">
    <!-- 顶部 Tabs -->
    <view class="tabs-header">
      <view
        class="tab-item"
        :class="{ active: activeTab === 'attraction' }"
        @click="switchTab('attraction')"
      >
        <LocalPin class="tab-icon" theme="outline" size="28" fill="#3ba272" />
        <text class="tab-text">景点打卡</text>
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTab === 'food' }"
        @click="switchTab('food')"
      >
        <KnifeFork class="tab-icon" theme="outline" size="28" fill="#f5a524" />
        <text class="tab-text">美食打卡</text>
      </view>
    </view>

    <!-- 打卡列表 -->
    <scroll-view scroll-y class="checkin-scroll" @scrolltolower="loadMore">
      <view class="checkin-list">
        <view
          v-for="item in checkinList"
          :key="item.id"
          class="checkin-card"
          @click="viewDetail(item)"
        >
          <image
            class="checkin-cover"
            :src="item.cover"
            mode="aspectFill"
          />
          <view class="checkin-content">
            <text class="checkin-name">{{ item.name }}</text>
            <view class="checkin-location">
              <LocalPin class="location-icon" theme="outline" size="22" fill="#3ba272" />
              <text class="location-text">{{ item.location }}</text>
            </view>
            <view class="checkin-footer">
              <view class="checkin-meta">
                <text class="meta-text">已打卡 {{ item.checkinCount }} 次</text>
              </view>
              <button
                class="checkin-btn"
                hover-class="checkin-btn--hover"
                @click.stop="openCheckinModal(item)"
              >
                去打卡
              </button>
            </view>
          </view>
        </view>
      </view>

      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>
      <view v-if="noMore" class="no-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>

    <!-- 打卡弹窗 -->
    <view v-if="showModal" class="modal-overlay" @click="closeModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">打卡 {{ currentItem?.name }}</text>
          <CloseSmall class="modal-close" @click="closeModal" theme="outline" size="26" fill="#8a94a3" />
        </view>

        <view class="modal-body">
          <!-- 上传图片 -->
          <view class="upload-section">
            <text class="section-label">上传照片</text>
            <text v-if="locationMsg" class="location-warning">{{ locationMsg }}</text>
            <view class="upload-area">
              <view
                v-for="(img, index) in uploadImages"
                :key="index"
                class="upload-item"
              >
                <image
                  class="upload-image"
                  :src="img"
                  mode="aspectFill"
                />
                <CloseSmall
                  class="upload-delete"
                  @click="removeImage(index)"
                  theme="outline"
                  size="24"
                  fill="#ffffff"
                />
              </view>
              <view
                v-if="uploadImages.length < 9"
                class="upload-add"
                @click="chooseImage"
              >
                <Add class="upload-icon" theme="outline" size="28" fill="#3ba272" />
                <text class="upload-text">添加照片</text>
              </view>
            </view>
          </view>

          <!-- 评价输入 -->
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
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

type TabType = 'attraction' | 'food'

interface CheckinItem {
  id: number
  name: string
  cover: string
  location: string
  checkinCount: number
  type: TabType
}

const activeTab = ref<TabType>('attraction')
const checkinList = ref<CheckinItem[]>([])
const myCheckins = ref<CheckinItem[]>([])
const loading = ref(false)
const noMore = ref(false)
const showModal = ref(false)
const currentItem = ref<CheckinItem | null>(null)
const uploadImages = ref<string[]>([])
const checkinComment = ref('')
const locationOk = ref(false)
const locationMsg = ref('')

// Mock 数据
const mockAttractions: CheckinItem[] = [
  {
    id: 1,
    name: '宽窄巷子',
    cover: 'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800',
    location: '成都市青羊区',
    checkinCount: 1234,
    type: 'attraction',
  },
  {
    id: 2,
    name: '锦里古街',
    cover: 'https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=800',
    location: '成都市武侯区',
    checkinCount: 987,
    type: 'attraction',
  },
  {
    id: 3,
    name: '大熊猫基地',
    cover: 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=800',
    location: '成都市成华区',
    checkinCount: 2156,
    type: 'attraction',
  },
]

const mockFoods: CheckinItem[] = [
  {
    id: 101,
    name: '火锅',
    cover: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800',
    location: '成都各大商圈',
    checkinCount: 3456,
    type: 'food',
  },
  {
    id: 102,
    name: '串串香',
    cover: 'https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=800',
    location: '成都各大商圈',
    checkinCount: 2890,
    type: 'food',
  },
  {
    id: 103,
    name: '担担面',
    cover: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=800',
    location: '成都各大商圈',
    checkinCount: 1876,
    type: 'food',
  },
]

const switchTab = (tab: TabType) => {
  activeTab.value = tab
  checkinList.value = []
  noMore.value = false
  loadCheckinList()
}

const loadCheckinList = () => {
  // 模拟加载数据
  setTimeout(() => {
    checkinList.value = activeTab.value === 'attraction' ? mockAttractions : mockFoods
  }, 300)
}

const loadMyCheckins = async () => {
  // 预留对接后端我的打卡接口
  myCheckins.value = []
}

const loadMore = () => {
  if (loading.value || noMore.value) return
  // 这里可以实现分页加载
}

const viewDetail = (item: CheckinItem) => {
  // 跳转到详情页（待实现）
  console.log('查看详情：', item.id)
}

const openCheckinModal = (item: CheckinItem) => {
  currentItem.value = item
  uploadImages.value = []
  checkinComment.value = ''
  showModal.value = true
  ensureLocation()
}

const closeModal = () => {
  showModal.value = false
  currentItem.value = null
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

const submitCheckin = () => {
  if (!locationOk.value) {
    uni.showToast({ title: '请先开启定位权限', icon: 'none' })
    return
  }
  if (uploadImages.value.length === 0) {
    uni.showToast({
      title: '请至少上传一张照片',
      icon: 'none',
    })
    return
  }

  // 这里调用后端接口提交打卡
  uni.showToast({
    title: '打卡成功',
    icon: 'success',
  })

  closeModal()
  // 刷新列表
  loadCheckinList()
}

onMounted(() => {
  loadCheckinList()
})

const ensureLocation = () => {
  uni.getLocation({
    type: 'gcj02',
    success: () => {
      locationOk.value = true
      locationMsg.value = ''
    },
    fail: () => {
      locationOk.value = false
      locationMsg.value = '定位失败，请检查网络或授权定位'
    },
  })
}
</script>

<style scoped>
.checkin-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
}

.tabs-header {
  display: flex;
  background-color: #ffffff;
  border-bottom: 1rpx solid #eeeeee;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24rpx 0;
  position: relative;
}

.tab-item.active {
  color: #3ba272;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background-color: #3ba272;
  border-radius: 2rpx;
}

.tab-icon {
  font-size: 32rpx;
  margin-bottom: 8rpx;
}

.tab-text {
  font-size: 26rpx;
  color: #666666;
}

.tab-item.active .tab-text {
  color: #3ba272;
  font-weight: 600;
}

.checkin-scroll {
  flex: 1;
}

.checkin-list {
  padding: 24rpx;
}

.checkin-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.checkin-cover {
  width: 100%;
  height: 300rpx;
  background-color: #e5e5e5;
}

.checkin-content {
  padding: 20rpx;
}

.checkin-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
  display: block;
  margin-bottom: 12rpx;
}

.checkin-location {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.location-icon {
  font-size: 24rpx;
  margin-right: 8rpx;
}

.location-text {
  font-size: 24rpx;
  color: #999999;
}

.checkin-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.meta-text {
  font-size: 22rpx;
  color: #999999;
}

.checkin-btn {
  padding: 12rpx 32rpx;
  border-radius: 999rpx;
  background-color: #3ba272;
  color: #ffffff;
  font-size: 26rpx;
  line-height: 1.6;
}

.checkin-btn--hover {
  background-color: #31875e;
}

.loading,
.no-more {
  text-align: center;
  padding: 40rpx;
  color: #999999;
  font-size: 26rpx;
}

/* 打卡弹窗样式 */
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
  padding: 32rpx;
  border-bottom: 1rpx solid #eeeeee;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.modal-close {
  font-size: 36rpx;
  color: #999999;
  width: 48rpx;
  height: 48rpx;
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
  margin-bottom: 32rpx;
}

.location-warning {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #f59e0b;
}

.section-label {
  font-size: 28rpx;
  color: #333333;
  font-weight: 600;
  display: block;
  margin-bottom: 16rpx;
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
  width: 32rpx;
  height: 32rpx;
  background-color: rgba(0, 0, 0, 0.6);
  color: #ffffff;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
}

.upload-add {
  width: 160rpx;
  height: 160rpx;
  border: 2rpx dashed #cccccc;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f7f8fa;
}

.upload-icon {
  font-size: 48rpx;
  color: #999999;
  margin-bottom: 8rpx;
}

.upload-text {
  font-size: 22rpx;
  color: #999999;
}

.comment-section {
  position: relative;
}

.comment-input {
  width: 100%;
  min-height: 200rpx;
  padding: 20rpx;
  background-color: #f7f8fa;
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
  background-color: #3ba272;
  color: #ffffff;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
}
</style>



