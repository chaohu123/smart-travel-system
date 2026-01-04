<template>
  <view class="chat-page">
    <!-- 导航栏 -->
    <view class="navbar">
      <view class="nav-back" @click="goBack">
        <text class="iconfont icon-arrow-left"></text>
      </view>
      <view class="nav-user" @click="viewUserProfile">
        <image class="nav-avatar" :src="targetUser.avatar || defaultAvatar" mode="aspectFill" />
        <text class="nav-name">{{ targetUser.nickname || '未知用户' }}</text>
      </view>
      <view class="nav-placeholder"></view>
    </view>

    <!-- 消息列表 -->
    <scroll-view
      scroll-y
      class="chat-scroll"
      :scroll-top="scrollTop"
      :scroll-into-view="scrollIntoView"
      scroll-with-animation
    >
      <view class="chat-messages" id="chat-messages">
        <view
          v-for="(message, index) in messages"
          :key="message.id"
          :id="`msg-${index}`"
          class="message-wrapper"
          :class="{ 'message-own': message.isOwn }"
        >
          <view class="message-item">
            <image
              v-if="!message.isOwn"
              class="message-avatar"
              :src="message.avatar || defaultAvatar"
              mode="aspectFill"
            />
            <view class="message-bubble" :class="{ 'bubble-own': message.isOwn }">
              <text class="message-text">{{ message.content }}</text>
            </view>
            <image
              v-if="message.isOwn"
              class="message-avatar"
              :src="currentUserAvatar"
              mode="aspectFill"
            />
          </view>
          <view class="message-time-text">{{ formatMessageTime(message.createTime) }}</view>
        </view>
      </view>
    </scroll-view>

    <!-- 输入框 -->
    <view class="input-container">
      <view class="input-box">
        <input
          class="input-field"
          v-model="inputText"
          placeholder="输入消息..."
          :focus="inputFocus"
          @confirm="sendMessage"
          @blur="inputFocus = false"
        />
        <view class="send-btn" @click="sendMessage" :class="{ 'send-btn-active': inputText.trim() }">
          <text class="send-btn-text">发送</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'

const store = useUserStore()
const currentUser = computed(() => store.state.profile)
const defaultAvatar = 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200'

// 目标用户信息
const targetUser = ref({
  userId: 0,
  nickname: '',
  avatar: ''
})

// 当前用户头像
const currentUserAvatar = computed(() => currentUser.value?.avatar || defaultAvatar)

// 消息列表
const messages = ref<any[]>([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)

// 输入框
const inputText = ref('')
const inputFocus = ref(false)

// 滚动控制
const scrollTop = ref(0)
const scrollIntoView = ref('')

// 加载聊天记录
const loadMessages = async (reset = false) => {
  if (!currentUser.value?.id || !targetUser.value.userId) return

  if (reset) {
    pageNum.value = 1
    hasMore.value = true
    messages.value = []
  }

  if (loading.value || (!reset && !hasMore.value)) return

  loading.value = true

  try {
    // TODO: 调用后端API获取聊天记录
    // const res = await chatApi.getMessages(currentUser.value.id, targetUser.value.userId, pageNum.value, pageSize.value)
    
    // 模拟数据
    const mockMessages = [
      {
        id: 1,
        senderId: targetUser.value.userId,
        content: '你好，请问这个景点怎么去？',
        createTime: new Date(Date.now() - 3600000).toISOString(),
        isOwn: false,
        avatar: targetUser.value.avatar
      },
      {
        id: 2,
        senderId: currentUser.value.id,
        content: '你好！你可以坐地铁2号线到XX站，然后步行10分钟就到了。',
        createTime: new Date(Date.now() - 3300000).toISOString(),
        isOwn: true
      },
      {
        id: 3,
        senderId: targetUser.value.userId,
        content: '好的，谢谢你的分享！',
        createTime: new Date(Date.now() - 3000000).toISOString(),
        isOwn: false,
        avatar: targetUser.value.avatar
      }
    ]

    if (reset) {
      messages.value = mockMessages.reverse() // 倒序，最新的在底部
    } else {
      messages.value = [...mockMessages.reverse(), ...messages.value]
    }

    hasMore.value = false // 模拟数据

    // 滚动到底部
    nextTick(() => {
      scrollToBottom()
    })
  } catch (error) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 发送消息
const sendMessage = async () => {
  const content = inputText.value.trim()
  if (!content) return

  if (!currentUser.value?.id) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  // 先添加到消息列表（乐观更新）
  const newMessage = {
    id: Date.now(),
    senderId: currentUser.value.id,
    content: content,
    createTime: new Date().toISOString(),
    isOwn: true
  }
  messages.value.push(newMessage)
  inputText.value = ''

  // 滚动到底部
  nextTick(() => {
    scrollToBottom()
  })

  try {
    // TODO: 调用后端API发送消息
    // const res = await chatApi.sendMessage(currentUser.value.id, targetUser.value.userId, content)
    
    // 模拟发送成功
  } catch (error) {
    // 发送失败，移除消息
    const index = messages.value.findIndex(m => m.id === newMessage.id)
    if (index > -1) {
      messages.value.splice(index, 1)
    }
    uni.showToast({ title: '发送失败，请重试', icon: 'none' })
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messages.value.length > 0) {
    const lastIndex = messages.value.length - 1
    scrollIntoView.value = `msg-${lastIndex}`
    setTimeout(() => {
      scrollIntoView.value = ''
    }, 300)
  }
}

// 格式化消息时间
const formatMessageTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  // 如果是今天，显示时间
  if (days === 0) {
    const hours = date.getHours()
    const minutes = date.getMinutes()
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }
  
  // 如果是昨天
  if (days === 1) {
    return '昨天'
  }
  
  // 如果是一周内
  if (days < 7) {
    return `${days}天前`
  }
  
  // 更早的日期
  return `${date.getMonth() + 1}-${date.getDate()}`
}

// 查看用户主页
const viewUserProfile = () => {
  uni.navigateTo({
    url: `/pages/profile/user-home?userId=${targetUser.value.userId}`
  })
}

// 返回
const goBack = () => {
  uni.navigateBack()
}

onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages()
  if (pages && pages.length > 0) {
    const currentPage = pages[pages.length - 1]
    const options = (currentPage as any).options || {}
    if (options.userId) {
      targetUser.value.userId = Number(options.userId)
      targetUser.value.nickname = decodeURIComponent(options.nickname || '')
      targetUser.value.avatar = decodeURIComponent(options.avatar || '')
    }
  }

  loadMessages(true)
})

onShow(() => {
  // 页面显示时，如果有新消息，重新加载
  loadMessages(true)
})
</script>

<style scoped>
.chat-page {
  min-height: 100vh;
  background-color: #f0f0f0;
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

.nav-user {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
}

.nav-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
}

.nav-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.nav-placeholder {
  width: 60rpx;
}

/* 消息列表 */
.chat-scroll {
  flex: 1;
  height: calc(100vh - 200rpx);
}

.chat-messages {
  padding: 30rpx 20rpx;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.message-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.message-wrapper.message-own {
  align-items: flex-end;
}

.message-item {
  display: flex;
  align-items: flex-end;
  gap: 16rpx;
  max-width: 70%;
}

.message-wrapper.message-own .message-item {
  flex-direction: row-reverse;
  align-self: flex-end;
}

.message-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.message-bubble {
  padding: 20rpx 24rpx;
  background: #fff;
  border-radius: 20rpx;
  position: relative;
  word-wrap: break-word;
  word-break: break-all;
}

.message-bubble.bubble-own {
  background: #3ba272;
}

.message-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
}

.bubble-own .message-text {
  color: #fff;
}

.message-time-text {
  font-size: 22rpx;
  color: #999;
  padding: 0 20rpx;
  text-align: center;
  margin-top: 8rpx;
}

.message-wrapper.message-own .message-time-text {
  text-align: right;
}

/* 输入框 */
.input-container {
  padding: 20rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1rpx solid #eee;
}

.input-box {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 24rpx;
  background: #f5f5f5;
  border-radius: 40rpx;
}

.input-field {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  background: transparent;
}

.send-btn {
  padding: 12rpx 32rpx;
  background: #ddd;
  border-radius: 30rpx;
  transition: all 0.3s;
}

.send-btn-active {
  background: #3ba272;
}

.send-btn-text {
  font-size: 26rpx;
  color: #fff;
  font-weight: 600;
}

.send-btn:not(.send-btn-active) .send-btn-text {
  color: #999;
}
</style>

