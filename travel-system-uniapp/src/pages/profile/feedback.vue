<template>
  <view class="feedback-page">
    <!-- 1. 顶部导航栏 -->
    <view
      class="nav-bar"
      :style="{
        paddingTop: statusBarHeight + 'px',
        paddingRight: navRightPadding + 'px',
      }"
    >
      <text class="nav-back" @click="goBack">←</text>
    </view>

    <view class="page-body">
      <!-- 2. 页面标题区 -->
      <view class="hero">
        <text class="hero-title">意见反馈</text>
        <text class="hero-sub">您的建议是我们前进的动力</text>
      </view>

      <!-- 3. 反馈类型 2x2 -->
      <view class="card soft-shadow">
        <text class="card-label">反馈类型</text>
        <view class="type-grid">
          <view
            v-for="type in feedbackTypes"
            :key="type.value"
            class="type-cell"
            :class="{ 'type-cell--active': form.type === type.value }"
            hover-class="type-cell-hover"
            :hover-stay-time="80"
            @click="form.type = type.value"
          >
            <text class="type-cell-text" :class="{ 'type-cell-text--active': form.type === type.value }">
              {{ type.label }}
            </text>
          </view>
        </view>
      </view>

      <!-- 4. 反馈内容 -->
      <view class="card soft-shadow">
        <text class="card-label">反馈内容</text>
        <view class="textarea-wrap">
          <textarea
            v-model="form.content"
            class="content-input"
            placeholder="请描述您遇到的问题或建议，例如：在什么场景下出现、期望如何改进等，便于我们快速处理。"
            maxlength="500"
            :show-confirm-bar="false"
          />
          <text class="char-hint">已输入 {{ form.content.length }}/500</text>
        </view>
      </view>

      <!-- 5. 联系方式 -->
      <view class="card soft-shadow">
        <text class="card-label">联系方式<text class="optional">（可选）</text></text>
        <input
          v-model="form.contact"
          class="contact-input"
          placeholder="留下手机号/邮箱，方便我们回复您"
          type="text"
        />
      </view>

      <!-- 6. 上传截图 -->
      <view class="card soft-shadow card-bottom-space">
        <text class="card-label">上传截图<text class="optional">（可选）</text></text>
        <view class="image-upload">
          <view v-for="(image, index) in form.images" :key="index" class="image-item">
            <image :src="image" class="uploaded-image" mode="aspectFill" />
            <view class="image-delete" @click.stop="removeImage(index)">×</view>
          </view>
          <view
            v-if="form.images.length < maxImages"
            class="upload-btn"
            hover-class="upload-btn-hover"
            :hover-stay-time="80"
            @click="chooseImage"
          >
            <text class="upload-plus">+</text>
            <text class="upload-text">添加图片</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 7. 底部固定提交栏 -->
    <view class="bottom-bar safe-bottom">
      <button
        type="default"
        class="submit-btn"
        hover-class="submit-btn-hover"
        :class="{ 'submit-btn--disabled': !canSubmit }"
        :disabled="!canSubmit || submitting"
        :loading="submitting"
        @click="submitFeedback"
      >
        {{ submitting ? '提交中...' : '提交反馈' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

const statusBarHeight = ref(0)
/** 右侧预留宽度，避免标题与小程序胶囊菜单重叠（非微信端为对称占位） */
const navRightPadding = ref(0)

onMounted(() => {
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
})

const feedbackTypes = [
  { value: 'bug', label: '问题反馈' },
  { value: 'suggestion', label: '功能建议' },
  { value: 'complaint', label: '投诉建议' },
  { value: 'other', label: '其他' },
]

const form = reactive({
  type: 'bug',
  content: '',
  contact: '',
  images: [] as string[],
})

const maxImages = 9
const submitting = ref(false)

const canSubmit = computed(() => form.content.trim().length >= 10)

const goBack = () => {
  uni.navigateBack()
}

const chooseImage = () => {
  const remain = maxImages - form.images.length
  if (remain <= 0) return
  uni.chooseImage({
    count: remain,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      form.images.push(...res.tempFilePaths)
    },
    fail: () => {
      uni.showToast({ title: '选择图片失败', icon: 'none' })
    },
  })
}

const removeImage = (index: number) => {
  form.images.splice(index, 1)
}

const submitFeedback = async () => {
  if (!canSubmit.value) {
    uni.showToast({ title: '请至少输入10个字的反馈内容', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const feedbackData = {
      type: form.type,
      content: form.content,
      contact: form.contact,
      images: form.images,
      createTime: new Date().toISOString(),
    }
    const feedbacks = (uni.getStorageSync('feedbacks') || []) as any[]
    feedbacks.push(feedbackData)
    uni.setStorageSync('feedbacks', feedbacks)

    uni.showToast({
      title: '反馈已提交，感谢您的建议！',
      icon: 'success',
      duration: 2000,
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 2000)
  } catch {
    uni.showToast({ title: '提交失败，请稍后重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.feedback-page {
  min-height: 100vh;
  background: #f2f7f5;
  /* 底部固定栏占位，避免内容被遮挡；整页仅此处滚动，避免出现双滚动条 */
  padding-bottom: calc(200rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

/* 薄荷绿导航 */
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

.page-body {
  padding: 24rpx 24rpx 0;
  box-sizing: border-box;
}

.soft-shadow {
  box-shadow: 0 8rpx 24rpx rgba(45, 80, 70, 0.06);
}

/* 标题区 */
.hero {
  padding: 32rpx 8rpx 28rpx;
  text-align: center;
}

.hero-title {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: #2d3f39;
  letter-spacing: 2rpx;
}

.hero-sub {
  display: block;
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #7a9088;
  line-height: 1.5;
}

.card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 24rpx;
}

.card-bottom-space {
  margin-bottom: 8rpx;
}

.card-label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #344843;
  margin-bottom: 20rpx;
}

.optional {
  font-size: 24rpx;
  font-weight: 400;
  color: #9aa9a3;
}

/* 2x2 类型 */
.type-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.type-cell {
  min-height: 100rpx;
  padding: 20rpx 16rpx;
  border-radius: 20rpx;
  border: 2rpx solid #e5ebe8;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.type-cell-hover {
  transform: translateY(-4rpx);
  box-shadow: 0 8rpx 20rpx rgba(45, 80, 70, 0.08);
}

.type-cell--active {
  border-color: #7fc4b1;
  background: #e8f5f1;
  box-shadow: 0 4rpx 16rpx rgba(127, 196, 177, 0.25);
}

.type-cell-text {
  font-size: 28rpx;
  color: #5c6f69;
  text-align: center;
}

.type-cell-text--active {
  color: #2d8a6e;
  font-weight: 600;
}

/* 文本域 */
.textarea-wrap {
  position: relative;
}

.content-input {
  width: 100%;
  min-height: 280rpx;
  padding: 22rpx 22rpx 52rpx;
  background: #f5faf8;
  border-radius: 18rpx;
  font-size: 28rpx;
  color: #2d3f39;
  line-height: 1.65;
  box-sizing: border-box;
}

.char-hint {
  position: absolute;
  right: 18rpx;
  bottom: 14rpx;
  font-size: 22rpx;
  color: #9eb3ab;
}

.contact-input {
  width: 100%;
  height: 88rpx;
  padding: 0 22rpx;
  background: #f5faf8;
  border-radius: 18rpx;
  font-size: 28rpx;
  color: #2d3f39;
  box-sizing: border-box;
}

/* 上传 */
.image-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.image-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 18rpx;
  overflow: hidden;
  background: #eef4f1;
}

.uploaded-image {
  width: 100%;
  height: 100%;
}

.image-delete {
  position: absolute;
  top: 6rpx;
  right: 6rpx;
  width: 44rpx;
  height: 44rpx;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28rpx;
  line-height: 1;
}

.upload-btn {
  width: 200rpx;
  height: 200rpx;
  border-radius: 18rpx;
  border: 2rpx dashed #c5ddd4;
  background: #fafcfb;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
}

.upload-btn-hover {
  background: #eef6f3;
  border-color: #98cfc0;
}

.upload-plus {
  font-size: 56rpx;
  color: #7fc4b1;
  font-weight: 300;
  line-height: 1;
}

.upload-text {
  font-size: 24rpx;
  color: #7a9088;
}

/* 底部提交 */
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

.submit-btn {
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

.submit-btn::after {
  border: none;
}

.submit-btn-hover {
  background: #5fa894 !important;
}

.submit-btn--disabled {
  background: #c5ddd4 !important;
  color: #f5faf8 !important;
}
</style>
