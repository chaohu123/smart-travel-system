<template>
  <view class="about-page">
    <view class="about-container">
      <!-- Logo和App名称 -->
      <view class="app-header">
        <view class="app-logo">
          <text class="logo-icon">✈️</text>
        </view>
        <text class="app-name">智能旅行系统</text>
        <text class="app-version">Version 1.0.0</text>
      </view>

      <!-- 应用介绍 -->
      <view class="section">
        <view class="section-title">关于我们</view>
        <view class="section-content">
          <text class="content-text">
            智能旅行系统是一款基于AI技术的智能旅行规划应用，致力于为用户提供个性化的旅行方案和优质的服务体验。
          </text>
          <text class="content-text">
            我们通过先进的算法分析您的兴趣偏好，为您推荐最适合的景点、美食和路线，让每一次旅行都成为难忘的回忆。
          </text>
        </view>
      </view>

      <!-- 核心功能 -->
      <view class="section">
        <view class="section-title">核心功能</view>
        <view class="feature-list">
          <view class="feature-item">
            <text class="feature-icon">🤖</text>
            <view class="feature-content">
              <text class="feature-title">AI智能推荐</text>
              <text class="feature-desc">基于用户偏好智能推荐景点、美食和路线</text>
            </view>
          </view>
          <view class="feature-item">
            <text class="feature-icon">📝</text>
            <view class="feature-content">
              <text class="feature-title">游记分享</text>
              <text class="feature-desc">记录旅行点滴，分享精彩瞬间</text>
            </view>
          </view>
          <view class="feature-item">
            <text class="feature-icon">🗺️</text>
            <view class="feature-content">
              <text class="feature-title">路线规划</text>
              <text class="feature-desc">智能规划最优旅行路线，节省时间</text>
            </view>
          </view>
          <view class="feature-item">
            <text class="feature-icon">📍</text>
            <view class="feature-content">
              <text class="feature-title">足迹打卡</text>
              <text class="feature-desc">记录旅行足迹，留下美好回忆</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 联系方式 -->
      <view class="section">
        <view class="section-title">联系我们</view>
        <view class="contact-list">
          <view class="contact-item" @click="copyText('support@smarttravel.com')">
            <text class="contact-icon">📧</text>
            <text class="contact-label">邮箱</text>
            <text class="contact-value">support@smarttravel.com</text>
            <text class="contact-arrow">›</text>
          </view>
          <view class="contact-item" @click="copyText('400-888-8888')">
            <text class="contact-icon">📞</text>
            <text class="contact-label">客服热线</text>
            <text class="contact-value">400-888-8888</text>
            <text class="contact-arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 其他信息 -->
      <view class="section">
        <view class="info-list">
          <view class="info-item">
            <text class="info-label">隐私政策</text>
            <text class="info-arrow">›</text>
          </view>
          <view class="info-item">
            <text class="info-label">用户协议</text>
            <text class="info-arrow">›</text>
          </view>
          <view class="info-item">
            <text class="info-label">开源许可</text>
            <text class="info-arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 版权信息 -->
      <view class="copyright">
        <text class="copyright-text">© 2024 智能旅行系统</text>
        <text class="copyright-text">All Rights Reserved</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const copyText = (text: string) => {
  uni.setClipboardData({
    data: text,
    success: () => {
      uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
    }
  })
}
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  background-color: #f8fafb;
}

.about-container {
  padding: 40rpx;
}

.app-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
  background: linear-gradient(135deg, #3ba272, #57c18c);
  border-radius: 24rpx;
  margin-bottom: 40rpx;
}

.app-logo {
  width: 160rpx;
  height: 160rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
  border: 6rpx solid rgba(255, 255, 255, 0.3);
}

.logo-icon {
  font-size: 80rpx;
}

.app-name {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 12rpx;
}

.app-version {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.section {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.content-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
}

.feature-icon {
  font-size: 48rpx;
  flex-shrink: 0;
}

.feature-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.feature-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.feature-desc {
  font-size: 24rpx;
  color: #999;
  line-height: 1.6;
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.contact-item:last-child {
  border-bottom: none;
}

.contact-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.contact-label {
  font-size: 28rpx;
  color: #666;
  width: 160rpx;
}

.contact-value {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.contact-arrow {
  font-size: 32rpx;
  color: #ccc;
  margin-left: 20rpx;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 28rpx;
  color: #333;
}

.info-arrow {
  font-size: 32rpx;
  color: #ccc;
}

.copyright {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0 40rpx;
  gap: 12rpx;
}

.copyright-text {
  font-size: 24rpx;
  color: #999;
}
</style>

