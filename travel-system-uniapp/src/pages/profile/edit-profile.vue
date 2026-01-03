<template>
  <view class="edit-profile-page">
    <!-- 导航栏 -->
    <view class="navbar">
      <view class="nav-back" @click="goBack">
        <text class="iconfont icon-arrow-left"></text>
      </view>
      <text class="nav-title">编辑资料</text>
      <view class="nav-save" @click="saveProfile">
        <text>保存</text>
      </view>
    </view>

    <!-- 表单内容 -->
    <scroll-view scroll-y class="form-scroll">
      <!-- 头像 -->
      <view class="form-section">
        <text class="section-label">头像</text>
        <view class="avatar-upload" @click="chooseAvatar">
          <image
            v-if="formData.avatar"
            class="avatar-preview"
            :src="formData.avatar"
            mode="aspectFill"
          />
          <view v-else class="avatar-placeholder">
            <text class="iconfont icon-camera"></text>
            <text class="placeholder-text">点击上传</text>
          </view>
          <view class="avatar-mask">
            <text class="iconfont icon-bianji"></text>
          </view>
        </view>
      </view>

      <!-- 昵称 -->
      <view class="form-section">
        <text class="section-label">昵称</text>
        <input
          class="form-input"
          v-model="formData.nickname"
          placeholder="请输入昵称"
          maxlength="20"
        />
      </view>

      <!-- 个性签名 -->
      <view class="form-section">
        <text class="section-label">个性签名</text>
        <textarea
          class="form-textarea"
          v-model="formData.signature"
          placeholder="分享你的个性签名，让更多人了解你~"
          maxlength="100"
        />
        <text class="char-count">{{ formData.signature.length }}/100</text>
      </view>

      <!-- 邮箱 -->
      <view class="form-section">
        <text class="section-label">邮箱</text>
        <input
          class="form-input"
          v-model="formData.email"
          type="email"
          placeholder="请输入邮箱地址"
        />
      </view>

    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { userApi } from '@/api/user'
import { uploadApi } from '@/api/content'
import { useUserStore } from '@/store/user'

const store = useUserStore()
const user = computed(() => store.state.profile)

// 表单数据
const formData = reactive({
  avatar: '',
  nickname: '',
  signature: '',
  email: ''
})

// 用户信息
const userInfo = ref<any>({})
const saving = ref(false)

// 加载用户信息
const loadUserInfo = async () => {
  if (!user.value?.id) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
    return
  }

  try {
    const res = await userApi.getProfile(user.value.id)
    if (res.statusCode === 200 && res.data.code === 200) {
      const data = res.data.data || {}
      const userInfoData = data.userInfo || data
      
      userInfo.value = userInfoData
      formData.avatar = userInfoData.avatar || ''
      formData.nickname = userInfoData.nickname || ''
      formData.signature = userInfoData.signature || ''
      formData.email = userInfoData.email || ''
    }
  } catch (error) {
    console.error('加载用户信息失败', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

// 选择头像
const chooseAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]
      uni.showLoading({ title: '上传中...', mask: true })
      
      try {
        // 上传头像
        const uploadRes = await uploadApi.upload(tempFilePath)
        if (uploadRes.statusCode === 200) {
          let result
          if (typeof uploadRes.data === 'string') {
            result = JSON.parse(uploadRes.data)
          } else {
            result = uploadRes.data
          }
          if (result.code === 200 && result.data?.url) {
            formData.avatar = result.data.url
            uni.hideLoading()
            uni.showToast({ title: '上传成功', icon: 'success' })
          } else {
            uni.hideLoading()
            uni.showToast({ title: result.msg || '上传失败', icon: 'none' })
          }
        } else {
          uni.hideLoading()
          uni.showToast({ title: '上传失败', icon: 'none' })
        }
      } catch (error) {
        console.error('上传头像失败', error)
        uni.hideLoading()
        uni.showToast({ title: '上传失败', icon: 'none' })
      }
    }
  })
}

// 保存资料
const saveProfile = async () => {
  if (!user.value?.id) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  // 验证昵称
  if (!formData.nickname || formData.nickname.trim() === '') {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return
  }

  // 验证邮箱格式（如果填写了）
  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    uni.showToast({ title: '请输入正确的邮箱地址', icon: 'none' })
    return
  }

  if (saving.value) return
  saving.value = true

  try {
    const res = await userApi.updateProfile({
      id: user.value.id,
      nickname: formData.nickname.trim(),
      signature: formData.signature.trim(),
      email: formData.email.trim(),
      avatar: formData.avatar
    })

    if (res.statusCode === 200 && res.data.code === 200) {
      // 更新本地用户信息
      store.setUser({
        ...user.value,
        nickname: formData.nickname.trim(),
        signature: formData.signature.trim(),
        avatar: formData.avatar,
        email: formData.email.trim() || undefined
      })
      
      uni.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      uni.showToast({ title: res.data.msg || '保存失败', icon: 'none' })
    }
  } catch (error) {
    console.error('保存资料失败', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

// 返回
const goBack = () => {
  uni.navigateBack()
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.edit-profile-page {
  min-height: 100vh;
  background-color: #f8fafb;
  display: flex;
  flex-direction: column;
}

/* 导航栏 */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  padding-top: calc(20rpx + env(safe-area-inset-top));
  background: #fff;
  border-bottom: 1rpx solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-back {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-back .iconfont {
  font-size: 36rpx;
  color: #333;
}

.nav-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.nav-save {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-save text {
  font-size: 30rpx;
  color: #3ba272;
  font-weight: 600;
}

/* 表单 */
.form-scroll {
  flex: 1;
  height: calc(100vh - 120rpx);
}

.form-section {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.section-label {
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
}

/* 头像上传 */
.avatar-upload {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  overflow: hidden;
  align-self: center;
}

.avatar-preview {
  width: 100%;
  height: 100%;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.avatar-placeholder .iconfont {
  font-size: 60rpx;
  color: #999;
}

.placeholder-text {
  font-size: 24rpx;
  color: #999;
}

.avatar-mask {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60rpx;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-mask .iconfont {
  font-size: 28rpx;
  color: #fff;
}

/* 输入框 */
.form-input {
  padding: 24rpx;
  background: #f8fafb;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
}

.form-textarea {
  padding: 24rpx;
  background: #f8fafb;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
  min-height: 200rpx;
  line-height: 1.6;
}

.char-count {
  font-size: 24rpx;
  color: #999;
  text-align: right;
  margin-top: -10rpx;
}

.form-readonly {
  padding: 24rpx;
  background: #f8fafb;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #999;
}
</style>

