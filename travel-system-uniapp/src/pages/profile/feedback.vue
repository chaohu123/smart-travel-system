<template>
  <view class="feedback-page">
    <view class="feedback-container">
      <view class="feedback-header">
        <text class="page-title">意见反馈</text>
        <text class="page-subtitle">您的建议是我们前进的动力</text>
      </view>

      <view class="feedback-form">
        <!-- 反馈类型 -->
        <view class="form-section">
          <text class="section-label">反馈类型</text>
          <view class="type-options">
            <view
              v-for="type in feedbackTypes"
              :key="type.value"
              class="type-option"
              :class="{ active: form.type === type.value }"
              @click="form.type = type.value"
            >
              <text class="type-icon">{{ type.icon }}</text>
              <text class="type-text">{{ type.label }}</text>
            </view>
          </view>
        </view>

        <!-- 反馈内容 -->
        <view class="form-section">
          <text class="section-label">反馈内容</text>
          <textarea
            v-model="form.content"
            class="content-input"
            placeholder="请详细描述您遇到的问题或建议，我们会认真对待每一条反馈..."
            maxlength="500"
            :show-confirm-bar="false"
          />
          <view class="char-count">{{ form.content.length }}/500</view>
        </view>

        <!-- 联系方式（可选） -->
        <view class="form-section">
          <text class="section-label">联系方式（可选）</text>
          <input
            v-model="form.contact"
            class="contact-input"
            placeholder="邮箱或手机号，方便我们与您联系"
            type="text"
          />
        </view>

        <!-- 上传截图 -->
        <view class="form-section">
          <text class="section-label">上传截图（可选）</text>
          <view class="image-upload">
            <view
              v-for="(image, index) in form.images"
              :key="index"
              class="image-item"
            >
              <image :src="image" class="uploaded-image" mode="aspectFill" />
              <view class="image-delete" @click="removeImage(index)">×</view>
            </view>
            <view
              v-if="form.images.length < 3"
              class="upload-btn"
              @click="chooseImage"
            >
              <text class="iconfont icon-tianjia"></text>
              <text class="upload-text">添加图片</text>
            </view>
          </view>
        </view>

        <!-- 提交按钮 -->
        <button
          class="submit-btn"
          :class="{ disabled: !canSubmit }"
          :disabled="!canSubmit || submitting"
          :loading="submitting"
          @click="submitFeedback"
        >
          {{ submitting ? '提交中...' : '提交反馈' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useUserStore } from '@/store/user'

const store = useUserStore()
const user = computed(() => store.state.profile)

const feedbackTypes = [
  { value: 'bug', label: '问题反馈', icon: '🐛' },
  { value: 'suggestion', label: '功能建议', icon: '💡' },
  { value: 'complaint', label: '投诉建议', icon: '😞' },
  { value: 'other', label: '其他', icon: '📝' }
]

const form = reactive({
  type: 'bug',
  content: '',
  contact: '',
  images: [] as string[]
})

const submitting = ref(false)

const canSubmit = computed(() => {
  return form.content.trim().length >= 10
})

const chooseImage = () => {
  uni.chooseImage({
    count: 3 - form.images.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      form.images.push(...res.tempFilePaths)
    },
    fail: (err) => {
      console.error('选择图片失败', err)
      uni.showToast({ title: '选择图片失败', icon: 'none' })
    }
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
    // 这里可以调用后端API提交反馈
    // 暂时使用本地存储模拟
    const feedbackData = {
      userId: user.value?.id || 0,
      type: form.type,
      content: form.content,
      contact: form.contact,
      images: form.images,
      createTime: new Date().toISOString()
    }

    // 保存到本地存储（实际应该调用API）
    const feedbacks = uni.getStorageSync('feedbacks') || []
    feedbacks.push(feedbackData)
    uni.setStorageSync('feedbacks', feedbacks)

    uni.showToast({ title: '反馈提交成功，感谢您的建议！', icon: 'success' })

    // 延迟返回上一页
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('提交反馈失败', error)
    uni.showToast({ title: '提交失败，请稍后重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.feedback-page {
  min-height: 100vh;
  background-color: #f8fafb;
}

.feedback-container {
  padding: 40rpx;
}

.feedback-header {
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

.feedback-form {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.form-section {
  margin-bottom: 40rpx;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.type-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.type-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30rpx 20rpx;
  background: #f8fafb;
  border-radius: 16rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s;
}

.type-option.active {
  background: #e4f7ef;
  border-color: #3ba272;
}

.type-icon {
  font-size: 48rpx;
  margin-bottom: 12rpx;
}

.type-text {
  font-size: 26rpx;
  color: #666;
}

.type-option.active .type-text {
  color: #3ba272;
  font-weight: 600;
}

.content-input {
  width: 100%;
  min-height: 300rpx;
  padding: 24rpx;
  background: #f8fafb;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  box-sizing: border-box;
}

.char-count {
  text-align: right;
  font-size: 24rpx;
  color: #999;
  margin-top: 12rpx;
}

.contact-input {
  width: 100%;
  padding: 24rpx;
  background: #f8fafb;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
}

.image-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.image-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.uploaded-image {
  width: 100%;
  height: 100%;
}

.image-delete {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 48rpx;
  height: 48rpx;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
}

.upload-btn {
  width: 200rpx;
  height: 200rpx;
  background: #f8fafb;
  border: 2rpx dashed #ddd;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.upload-btn .iconfont {
  font-size: 48rpx;
  color: #999;
}

.upload-text {
  font-size: 24rpx;
  color: #999;
}

.submit-btn {
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

.submit-btn.disabled {
  background: #e0e0e0;
  color: #999;
}
</style>

