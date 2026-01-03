<template>
  <view class="messages-page">
    <!-- 分类标签 -->
    <view class="tabs-container">
      <view
        v-for="tab in tabs"
        :key="tab.type"
        class="tab-item"
        :class="{ active: activeTab === tab.type }"
        @click="switchTab(tab.type)"
      >
        <text class="tab-text">{{ tab.label }}</text>
        <view v-if="tab.unreadCount > 0" class="tab-badge">{{ tab.unreadCount }}</view>
      </view>
    </view>

    <!-- 消息列表 -->
    <scroll-view
      scroll-y
      class="messages-scroll"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <!-- 骨架屏 -->
      <view v-if="loading && messagesList.length === 0" class="skeleton-list">
        <view v-for="i in 5" :key="i" class="skeleton-item">
          <view class="skeleton-avatar"></view>
          <view class="skeleton-content">
            <view class="skeleton-line"></view>
            <view class="skeleton-line short"></view>
          </view>
        </view>
      </view>

      <!-- 点赞消息列表 -->
      <view v-else-if="activeTab === 'like' && messagesList.length > 0" class="messages-list">
        <view
          v-for="message in messagesList"
          :key="message.id"
          class="message-item"
          :class="{ unread: !message.isRead }"
          @click="viewLikeMessage(message)"
        >
          <view class="message-avatar">
            <image
              class="avatar-img"
              :src="message.senderAvatar || defaultAvatar"
              mode="aspectFill"
            />
            <view v-if="!message.isRead" class="unread-dot"></view>
          </view>
          <view class="message-content">
            <view class="message-header">
              <text class="sender-name">{{ message.senderName || '未知用户' }}</text>
              <text class="message-time">{{ formatTime(message.createTime) }}</text>
            </view>
            <text class="message-text">赞了你的游记《{{ message.noteTitle || '未知游记' }}》</text>
            <view v-if="message.noteCover" class="message-note-preview">
              <image class="note-cover" :src="message.noteCover" mode="aspectFill" />
            </view>
          </view>
        </view>
      </view>

      <!-- 评论消息列表 -->
      <view v-else-if="activeTab === 'comment' && messagesList.length > 0" class="messages-list">
        <view
          v-for="message in messagesList"
          :key="message.id"
          class="message-item"
          :class="{ unread: !message.isRead }"
          @click="viewCommentMessage(message)"
        >
          <view class="message-avatar">
            <image
              class="avatar-img"
              :src="message.senderAvatar || defaultAvatar"
              mode="aspectFill"
            />
            <view v-if="!message.isRead" class="unread-dot"></view>
          </view>
          <view class="message-content">
            <view class="message-header">
              <text class="sender-name">{{ message.senderName || '匿名用户' }}</text>
              <text class="message-time">{{ formatTime(message.createTime) }}</text>
            </view>
            <text class="message-text">{{ message.content || '评论了你的游记' }}</text>
            <view v-if="message.noteTitle" class="message-related">
              <text class="related-text">《{{ message.noteTitle }}》</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 私信列表 -->
      <view v-else-if="activeTab === 'chat' && messagesList.length > 0" class="messages-list">
        <view
          v-for="chat in messagesList"
          :key="chat.id"
          class="chat-item"
          :class="{ unread: chat.unreadCount > 0 }"
          @click="openChat(chat)"
        >
          <image
            class="chat-avatar"
            :src="chat.avatar || defaultAvatar"
            mode="aspectFill"
          />
          <view class="chat-content">
            <view class="chat-header">
              <text class="chat-name">{{ chat.nickname || '未知用户' }}</text>
              <text class="chat-time">{{ formatTime(chat.lastMessageTime) }}</text>
            </view>
            <text class="chat-message">{{ chat.lastMessage || '暂无消息' }}</text>
          </view>
          <view v-if="chat.unreadCount > 0" class="chat-unread-badge">{{ chat.unreadCount }}</view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else-if="!loading && messagesList.length === 0" class="empty-state">
        <text class="empty-icon">{{ getEmptyIcon() }}</text>
        <text class="empty-text">{{ getEmptyText() }}</text>
        <text class="empty-tip">{{ getEmptyTip() }}</text>
      </view>

      <!-- 加载更多 -->
      <view v-if="hasMore && !loading && messagesList.length > 0" class="load-more">
        <text class="load-more-text">加载中...</text>
      </view>
      <view v-if="!hasMore && messagesList.length > 0" class="load-more">
        <text class="load-more-text">没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { userApi } from '@/api/user'
import { getCache, setCache } from '@/utils/storage'

const store = useUserStore()
const user = computed(() => store.state.profile)
const defaultAvatar = 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200'

// 用户信息缓存
const userInfoCache = ref<Record<number, { nickname: string; avatar: string }>>({})

// 获取用户信息
const getUserInfo = async (userId: number) => {
  if (userInfoCache.value[userId]) {
    return userInfoCache.value[userId]
  }
  
  try {
    const res = await userApi.getProfile(userId)
    if (res.statusCode === 200 && res.data.code === 200) {
      const userInfo = res.data.data?.userInfo || res.data.data || {}
      const info = {
        nickname: userInfo.nickname || '未知用户',
        avatar: userInfo.avatar || defaultAvatar
      }
      userInfoCache.value[userId] = info
      return info
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
  }
  
  return { nickname: '未知用户', avatar: defaultAvatar }
}

// 填充用户信息
const fillUserInfo = async (messages: any[]) => {
  for (const message of messages) {
    if (message.senderId && (!message.senderAvatar || !message.senderName)) {
      const userInfo = await getUserInfo(message.senderId)
      if (!message.senderAvatar) message.senderAvatar = userInfo.avatar
      if (!message.senderName) message.senderName = userInfo.nickname
    }
    // 私信列表
    if (message.userId && (!message.avatar || !message.nickname)) {
      const userInfo = await getUserInfo(message.userId)
      if (!message.avatar) message.avatar = userInfo.avatar
      if (!message.nickname) message.nickname = userInfo.nickname
    }
  }
}

// 分类标签
const tabs = ref([
  { type: 'like', label: '点赞', unreadCount: 0 },
  { type: 'comment', label: '评论', unreadCount: 0 },
  { type: 'chat', label: '私信', unreadCount: 0 }
])
const activeTab = ref('like')

// 消息列表
const messagesList = ref<any[]>([])
const loading = ref(false)
const refreshing = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)

// 保存已读状态（用于模拟数据，实际应该从后端获取）
// 从本地存储加载已读状态缓存
const loadReadStatusCache = (): Record<number, number> => {
  const cache = getCache<Record<number, number>>('message_read_status')
  return cache || {}
}

// 保存已读状态到本地存储
const saveReadStatusCache = () => {
  setCache('message_read_status', readStatusCache.value)
}

const readStatusCache = ref<Record<number, number>>(loadReadStatusCache())

// 切换分类
const switchTab = (type: string) => {
  if (activeTab.value === type) return
  activeTab.value = type
  pageNum.value = 1
  hasMore.value = true
  messagesList.value = []
  loadMessages(true)
}

// 加载消息列表
const loadMessages = async (reset = false) => {
  if (!user.value?.id) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  if (reset) {
    pageNum.value = 1
    hasMore.value = true
    messagesList.value = []
  }

  if (loading.value || (!reset && !hasMore.value)) return

  loading.value = true

  try {
    // TODO: 调用后端API获取消息列表
    // const res = await messageApi.getList(user.value.id, activeTab.value, pageNum.value, pageSize.value)
    
    // 模拟数据
    let newMessages: any[] = []
    
    if (activeTab.value === 'like') {
      newMessages = [
        {
          id: 1,
          senderId: 3,
          senderName: '旅行达人',
          senderAvatar: '',
          noteId: 1,
          noteTitle: '成都美食之旅',
          noteCover: '',
          isRead: readStatusCache.value[1] === 1,
          createTime: new Date().toISOString()
        },
        {
          id: 2,
          senderId: 4,
          senderName: '探索者',
          senderAvatar: '',
          noteId: 2,
          noteTitle: '西安古城游记',
          noteCover: '',
          isRead: readStatusCache.value[2] === 1,
          createTime: new Date(Date.now() - 3600000).toISOString()
        }
      ]
    } else if (activeTab.value === 'comment') {
      newMessages = [
        {
          id: 1,
          senderId: 3,
          senderName: '旅行达人',
          senderAvatar: '',
          noteId: 1,
          noteTitle: '成都美食之旅',
          content: '这个地方真的很不错！',
          isRead: readStatusCache.value[1] === 1,
          createTime: new Date().toISOString()
        },
        {
          id: 2,
          senderId: 4,
          senderName: '探索者',
          senderAvatar: '',
          noteId: 2,
          noteTitle: '西安古城游记',
          content: '回复了你：我也想去看看！',
          isRead: readStatusCache.value[2] === 1,
          createTime: new Date(Date.now() - 7200000).toISOString()
        }
      ]
    } else if (activeTab.value === 'chat') {
      // 私信的未读数量也使用缓存（1000+id作为key，存储unreadCount）
      const chat1Unread = readStatusCache.value[1001] !== undefined ? readStatusCache.value[1001] : 2
      const chat2Unread = readStatusCache.value[1002] !== undefined ? readStatusCache.value[1002] : 0
      
      newMessages = [
        {
          id: 1,
          userId: 3,
          nickname: '旅行达人',
          avatar: '',
          lastMessage: '你好，请问这个景点怎么去？',
          lastMessageTime: new Date().toISOString(),
          unreadCount: chat1Unread
        },
        {
          id: 2,
          userId: 4,
          nickname: '探索者',
          avatar: '',
          lastMessage: '谢谢你的分享！',
          lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
          unreadCount: chat2Unread
        }
      ]
    }

    // 同步填充用户信息，确保头像和昵称在显示前就加载完成
    await fillUserInfo(newMessages)

    if (reset) {
      messagesList.value = newMessages
    } else {
      messagesList.value.push(...newMessages)
    }

    hasMore.value = false // 模拟数据，设为false
    
    // 更新未读计数
    updateUnreadCount()
  } catch (error) {
    console.error('加载消息失败', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  loadMessages(true)
}

// 加载更多
const loadMore = () => {
  if (!loading.value && hasMore.value) {
    loadMessages(false)
  }
}

// 计算所有标签的未读数量（用于个人中心显示）
const calculateAllUnreadCount = () => {
  // 从模拟数据计算未读数（实际应该从后端获取）
  let likeUnread = 0
  let commentUnread = 0
  let chatUnread = 0
  
  // 点赞消息未读数
  const likeMessages = [
    { id: 1, isRead: readStatusCache.value[1] === 1 },
    { id: 2, isRead: readStatusCache.value[2] === 1 }
  ]
  likeUnread = likeMessages.filter(m => !m.isRead).length
  
  // 评论消息未读数
  const commentMessages = [
    { id: 1, isRead: readStatusCache.value[1] === 1 },
    { id: 2, isRead: readStatusCache.value[2] === 1 }
  ]
  commentUnread = commentMessages.filter(m => !m.isRead).length
  
  // 私信未读数
  const chat1Unread = readStatusCache.value[1001] !== undefined ? readStatusCache.value[1001] : 2
  const chat2Unread = readStatusCache.value[1002] !== undefined ? readStatusCache.value[1002] : 0
  chatUnread = chat1Unread + chat2Unread
  
  return {
    like: likeUnread,
    comment: commentUnread,
    chat: chatUnread,
    total: likeUnread + commentUnread + chatUnread
  }
}

// 更新未读计数
const updateUnreadCount = () => {
  // 计算点赞消息未读数（当前标签为like时，使用当前列表；否则需要从所有消息中筛选）
  if (activeTab.value === 'like') {
    tabs.value[0].unreadCount = messagesList.value.filter(m => !m.isRead).length
  } else {
    // 如果不是当前标签，从缓存计算
    const allUnread = calculateAllUnreadCount()
    tabs.value[0].unreadCount = allUnread.like
  }
  
  // 计算评论消息未读数
  if (activeTab.value === 'comment') {
    tabs.value[1].unreadCount = messagesList.value.filter(m => !m.isRead).length
  } else {
    const allUnread = calculateAllUnreadCount()
    tabs.value[1].unreadCount = allUnread.comment
  }
  
  // 计算私信未读数
  if (activeTab.value === 'chat') {
    tabs.value[2].unreadCount = messagesList.value.filter(m => m.unreadCount > 0).reduce((sum, m) => sum + (m.unreadCount || 0), 0)
  } else {
    const allUnread = calculateAllUnreadCount()
    tabs.value[2].unreadCount = allUnread.chat
  }
  
  // 更新本地存储中的未读总数（供个人中心页面使用）
  const allUnread = calculateAllUnreadCount()
  setCache('unread_message_count', allUnread.total)
}

// 查看点赞消息
const viewLikeMessage = async (message: any) => {
  if (!message.isRead) {
    message.isRead = true
    readStatusCache.value[message.id] = 1 // 保存已读状态（1表示已读）
    saveReadStatusCache() // 持久化到本地存储
    // TODO: 调用API标记为已读
    updateUnreadCount()
  }
  // 确保用户信息已加载
  if (message.senderId && (!message.senderAvatar || !message.senderName)) {
    const userInfo = await getUserInfo(message.senderId)
    message.senderAvatar = userInfo.avatar
    message.senderName = userInfo.nickname
  }
  if (message.noteId) {
    uni.navigateTo({ url: `/pages/travel-note/detail?id=${message.noteId}` })
  }
}

// 查看评论消息
const viewCommentMessage = async (message: any) => {
  if (!message.isRead) {
    message.isRead = true
    readStatusCache.value[message.id] = 1 // 保存已读状态（1表示已读）
    saveReadStatusCache() // 持久化到本地存储
    // TODO: 调用API标记为已读
    updateUnreadCount()
  }
  // 确保用户信息已加载
  if (message.senderId && (!message.senderAvatar || !message.senderName)) {
    const userInfo = await getUserInfo(message.senderId)
    message.senderAvatar = userInfo.avatar
    message.senderName = userInfo.nickname
  }
  if (message.noteId) {
    uni.navigateTo({ url: `/pages/travel-note/detail?id=${message.noteId}&tab=comment` })
  }
}

// 打开聊天
const openChat = (chat: any) => {
  // 清除未读数量
  if (chat.unreadCount > 0) {
    chat.unreadCount = 0
    readStatusCache.value[1000 + chat.id] = 0 // 保存已读状态（使用1000+id区分私信，存储unreadCount）
    saveReadStatusCache() // 持久化到本地存储
    updateUnreadCount()
    // TODO: 调用API标记私信为已读
  }
  
  uni.navigateTo({
    url: `/pages/profile/chat?userId=${chat.userId}&nickname=${encodeURIComponent(chat.nickname || '')}&avatar=${encodeURIComponent(chat.avatar || '')}`
  })
}

// 获取空状态图标
const getEmptyIcon = () => {
  if (activeTab.value === 'like') return '👍'
  if (activeTab.value === 'comment') return '💬'
  return '💌'
}

// 获取空状态文本
const getEmptyText = () => {
  if (activeTab.value === 'like') return '暂无点赞消息'
  if (activeTab.value === 'comment') return '暂无评论消息'
  return '暂无私信'
}

// 获取空状态提示
const getEmptyTip = () => {
  if (activeTab.value === 'like') return '收到点赞时会在这里显示'
  if (activeTab.value === 'comment') return '收到评论时会在这里显示'
  return '开始与好友聊天吧~'
}

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return `${date.getMonth() + 1}-${date.getDate()}`
}

onMounted(() => {
  // 初始化时加载所有标签的未读数量
  updateUnreadCount()
  loadMessages(true)
})

// 页面显示时重新加载数据（从其他页面返回时）
onShow(() => {
  // 重新加载当前标签的消息，确保已读状态和用户信息正确
  if (messagesList.value.length > 0) {
    loadMessages(true)
  }
})
</script>

<style scoped>
.messages-page {
  min-height: 100vh;
  background-color: #f8fafb;
  display: flex;
  flex-direction: column;
}

/* 分类标签 */
.tabs-container {
  display: flex;
  background: #fff;
  border-bottom: 1rpx solid #eee;
  padding: 0 20rpx;
}

.tab-item {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: #666;
  transition: color 0.3s;
}

.tab-item.active {
  color: #3ba272;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background: #3ba272;
  border-radius: 2rpx;
}

.tab-text {
  margin-right: 8rpx;
}

.tab-badge {
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  background: #ff4757;
  color: #fff;
  border-radius: 16rpx;
  font-size: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* 消息列表 */
.messages-scroll {
  flex: 1;
  height: calc(100vh - 200rpx);
}

.messages-list {
  padding: 20rpx;
}

.message-item {
  display: flex;
  gap: 20rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.message-item.unread {
  background: #f0f9ff;
}

.message-avatar {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  background: #f5f5f5;
}

.avatar-img {
  width: 100%;
  height: 100%;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3ba272, #57c18c);
}

.avatar-icon {
  font-size: 40rpx;
}

.unread-dot {
  position: absolute;
  top: 0;
  right: 0;
  width: 20rpx;
  height: 20rpx;
  background: #ff4757;
  border-radius: 50%;
  border: 3rpx solid #fff;
}

.message-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.message-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sender-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.message-time {
  font-size: 22rpx;
  color: #999;
  white-space: nowrap;
}

.message-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

.message-related {
  margin-top: 8rpx;
  padding: 12rpx;
  background: rgba(59, 162, 114, 0.1);
  border-radius: 8rpx;
}

.related-text {
  font-size: 24rpx;
  color: #3ba272;
}

.message-note-preview {
  margin-top: 12rpx;
  width: 200rpx;
  height: 120rpx;
  border-radius: 8rpx;
  overflow: hidden;
}

.note-cover {
  width: 100%;
  height: 100%;
}

/* 私信列表样式 */
.chat-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  position: relative;
}

.chat-item.unread {
  background: #f0f9ff;
}

.chat-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chat-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.chat-time {
  font-size: 22rpx;
  color: #999;
  white-space: nowrap;
}

.chat-message {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  overflow: hidden;
}

.chat-unread-badge {
  min-width: 36rpx;
  height: 36rpx;
  padding: 0 10rpx;
  background: #ff4757;
  color: #fff;
  border-radius: 18rpx;
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  flex-shrink: 0;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 40rpx;
  gap: 24rpx;
}

.empty-icon {
  font-size: 120rpx;
  opacity: 0.3;
}

.empty-text {
  font-size: 32rpx;
  color: #666;
}

.empty-tip {
  font-size: 26rpx;
  color: #999;
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 40rpx;
}

.load-more-text {
  font-size: 24rpx;
  color: #999;
}

/* 骨架屏 */
.skeleton-list {
  padding: 20rpx;
}

.skeleton-item {
  display: flex;
  gap: 20rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
}

.skeleton-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #f0f0f0;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.skeleton-line {
  height: 24rpx;
  background: #f0f0f0;
  border-radius: 4rpx;
}

.skeleton-line.short {
  width: 60%;
}
</style>
