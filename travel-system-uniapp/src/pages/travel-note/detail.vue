<template>
  <view class="note-detail-page" :class="{ 'no-scroll': commentEditorVisible }">
    <LoginPrompt :visible="showLoginPrompt" @confirm="handleLoginConfirm" @cancel="handleLoginCancel" />
    <scroll-view scroll-y class="detail-scroll">
      <view v-if="noteDetail" class="detail-content">
        <!-- 顶部封面 -->
        <view v-if="coverImage" class="cover-section">
          <image
            class="cover-image"
            :src="coverImage"
            mode="aspectFill"
            @click="previewImage(0)"
          />
        </view>

        <!-- 标题 -->
        <view class="note-header">
          <text class="note-title">{{ noteDetail.note?.title }}</text>
        </view>

        <!-- 作者卡片 -->
        <view class="author-card">
          <image
            class="author-avatar"
            :src="authorAvatar"
            mode="aspectFill"
          />
          <view class="author-info">
            <text class="author-name">{{ authorName }}</text>
            <text class="note-meta">
              {{ formatTime(noteDetail.note?.createTime) }} ·
              浏览量 {{ noteDetail.note?.viewCount || 0 }}
            </text>
          </view>
        </view>

        <!-- 正文内容（图文混排） -->
        <view class="note-body">
          <text class="note-text">{{ noteDetail.note?.content }}</text>

          <!-- 图片列表 -->
          <view v-if="noteDetail.images && noteDetail.images.length > 0" class="image-list">
            <view
              v-for="(img, index) in noteDetail.images"
              :key="index"
              class="image-item"
            >
              <image
                class="note-image"
                :src="img.url"
                mode="aspectFill"
                @click="previewImage(index)"
              />
            </view>
          </view>
        </view>

        <!-- 评论区域 -->
        <view class="comment-section">
          <view class="section-header">
            <text class="section-title">评论 ({{ commentCount }})</text>
          </view>
          <view
            v-for="comment in comments"
            :key="comment.id"
            class="comment-item"
          >
            <image
              class="comment-avatar"
              :src="comment.avatar || comment.userAvatar || authorAvatar"
              mode="aspectFill"
            />
            <view class="comment-content-wrapper">
              <text class="comment-author">{{ comment.nickname || '匿名用户' }}</text>
              <text class="comment-content">{{ comment.content }}</text>
              <text class="comment-time">{{ formatTime(comment.createTime) }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="loading">
        <text>加载中...</text>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <view
        class="action-btn"
        :class="{ active: isLiked }"
        @tap="toggleLike"
      >
        <text
          class="iconfont action-icon icon-icon"
          :class="{ 'icon-liked': isLiked }"
        ></text>
        <text class="action-text">{{ noteDetail?.note?.likeCount || 0 }}</text>
      </view>
      <view
        class="action-btn"
        :class="{ active: isFavorite }"
        @tap="toggleFavorite"
      >
        <text
          class="iconfont action-icon icon-shoucang"
          :class="{ 'icon-favorited': isFavorite }"
        ></text>
        <text class="action-text">收藏</text>
      </view>
      <view class="action-btn" @tap="openCommentEditor">
        <text class="iconfont action-icon icon-pinglun"></text>
        <text class="action-text">{{ commentCount }}</text>
      </view>
    </view>

    <!-- 评论输入弹层 -->
    <view
      v-if="commentEditorVisible"
      class="comment-editor-mask"
      catchtouchmove
      @click.self="closeCommentEditor"
    >
      <view class="comment-editor" @click.stop>
        <view class="editor-header">
          <text class="editor-title">发表评论</text>
          <CloseSmall class="editor-close" @click="closeCommentEditor" theme="outline" size="26" fill="#8a94a3" />
        </view>
        <view class="editor-input-wrapper" @tap.stop>
          <textarea
            v-model="commentContent"
            class="editor-input"
            placeholder="分享你的想法..."
            maxlength="300"
            :focus="textareaFocus"
            :cursor-spacing="20"
            :adjust-position="true"
            :show-confirm-bar="false"
            :auto-height="true"
            @tap.stop="handleTextareaTap"
            @click.stop="handleTextareaTap"
          />
        </view>
        <view class="editor-footer">
          <text class="editor-count">{{ commentContent.length }}/300</text>
          <button
            class="editor-submit"
            :disabled="!commentContent.trim() || submitting"
            @click="submitComment"
          >
            {{ submitting ? '提交中...' : '发表' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { travelNoteApi, travelNoteInteractionApi } from '@/api/content'
import { useUserStore } from '@/store/user'
import LoginPrompt from '@/components/LoginPrompt.vue'

// API 响应类型定义
interface ApiResponse<T = any> {
  code: number
  msg?: string
  data: T
}

const store = useUserStore()
const user = computed(() => store.state.profile)
const noteId = ref<number | null>(null)
const noteDetail = ref<any>(null)
const isLiked = ref(false)
const isFavorite = ref(false)
const comments = ref<any[]>([])
const commentEditorVisible = ref(false)
const commentContent = ref('')
const submitting = ref(false)
const showLoginPrompt = ref(false)
const textareaFocus = ref(false)

// 评论数量（优先使用后端返回的真实数据）
const commentCount = computed(() => {
  // 优先使用后端返回的 commentCount，这是真实的评论总数
  if (noteDetail.value?.note?.commentCount !== undefined && noteDetail.value.note.commentCount !== null) {
    return noteDetail.value.note.commentCount
  }
  // 如果后端没有返回，则使用实际加载的评论数量
  return comments.value.length || 0
})

const coverImage = computed(() => {
  if (noteDetail.value?.images && noteDetail.value.images.length > 0) {
    return noteDetail.value.images[0].url
  }
  return null
})

const authorAvatar = computed(() => {
  // 优先使用author对象中的avatar
  if (noteDetail.value?.author?.avatar) {
    return noteDetail.value.author.avatar
  }
  // 如果没有author信息，尝试从note中获取（兼容旧数据）
  if (noteDetail.value?.note?.authorAvatar) {
    return noteDetail.value.note.authorAvatar
  }
  // 默认头像
  return 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200'
})

const authorName = computed(() => {
  // 优先使用author对象中的nickname
  if (noteDetail.value?.author?.nickname) {
    return noteDetail.value.author.nickname
  }
  // 如果没有author信息，尝试从note中获取（兼容旧数据）
  if (noteDetail.value?.note?.authorName) {
    return noteDetail.value.note.authorName
  }
  // 最后使用userId作为后备
  return `用户${noteDetail.value?.note?.userId || ''}`
})

const previewImage = (index: number | string) => {
  if (!noteDetail.value?.images) return
  const urls = noteDetail.value.images.map((img: any) => img.url)
  uni.previewImage({
    current: typeof index === 'string' ? parseInt(index) : index,
    urls: urls,
  })
}

// 显示登录提示
const showLoginPromptDialog = () => {
  // 直接使用 uni.showModal，更可靠
  uni.showModal({
    title: '需要登录',
    content: '请先登录',
    confirmText: '去登录',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        // 用户选择去登录
        uni.switchTab({ url: '/pages/profile/profile' })
      }
      // 用户选择取消，什么都不做，留在当前页面
    }
  })
}

// 登录确认
const handleLoginConfirm = () => {
  showLoginPrompt.value = false
  // 跳转到登录页面（LoginPrompt组件内部会处理跳转）
}

// 登录取消
const handleLoginCancel = () => {
  showLoginPrompt.value = false
  // 用户选择取消，留在当前页面
}

const toggleLike = async () => {
  if (!noteId.value) return

  try {
    if (!user.value) {
      showLoginPromptDialog()
      return
    }
    const res = await travelNoteInteractionApi.toggleLike(user.value.id, noteId.value)
    const data = res.data as ApiResponse<{ isLiked: boolean; likeCount?: number }>
    if (res.statusCode === 200 && data.code === 200) {
      isLiked.value = data.data.isLiked
      if (noteDetail.value?.note) {
        // 使用后端返回的点赞数，如果没有则自己计算
        if (data.data.likeCount !== undefined) {
          noteDetail.value.note.likeCount = data.data.likeCount
        } else {
          noteDetail.value.note.likeCount = data.data.isLiked
            ? (noteDetail.value.note.likeCount || 0) + 1
            : Math.max((noteDetail.value.note.likeCount || 0) - 1, 0)
        }
      }
      uni.showToast({
        title: data.data.isLiked ? '点赞成功' : '取消点赞',
        icon: 'success',
      })
    } else {
      uni.showToast({
        title: data.msg || '操作失败',
        icon: 'none',
      })
    }
  } catch (error: any) {
    uni.showToast({
      title: error?.message || '操作失败，请检查网络',
      icon: 'none',
    })
  }
}

const toggleFavorite = async () => {
  if (!noteId.value) return

  try {
    if (!user.value) {
      showLoginPromptDialog()
      return
    }
    const res = await travelNoteInteractionApi.toggleFavorite(user.value.id, noteId.value)
    const data = res.data as ApiResponse<{ isFavorite: boolean; favoriteCount?: number }>
    if (res.statusCode === 200 && data.code === 200) {
      isFavorite.value = data.data.isFavorite
      // 更新收藏数（如果有）
      if (data.data.favoriteCount !== undefined && noteDetail.value?.note) {
        noteDetail.value.note.favoriteCount = data.data.favoriteCount
      }
      uni.showToast({
        title: isFavorite.value ? '收藏成功' : '取消收藏',
        icon: 'success',
      })
    } else {
      uni.showToast({
        title: data.msg || '操作失败',
        icon: 'none',
      })
    }
  } catch (error: any) {
    uni.showToast({
      title: error?.message || '操作失败，请检查网络',
      icon: 'none',
    })
  }
}

const openCommentEditor = () => {
  if (!user.value) {
    showLoginPromptDialog()
    return
  }

  // 先重置焦点状态
  textareaFocus.value = false
  commentContent.value = ''
  commentEditorVisible.value = true

  // 增加延迟时间，确保弹层和 textarea 完全渲染
  // 微信开发者工具需要更长的延迟
  nextTick(() => {
    setTimeout(() => {
      textareaFocus.value = true
    }, 300) // 从 100ms 增加到 300ms
  })
}

// textarea 点击事件处理函数
const handleTextareaTap = (e?: any) => {
  // 阻止事件冒泡
  if (e) {
    e.stopPropagation()
  }
  // 强制触发焦点，确保在微信开发者工具中可以输入
  textareaFocus.value = false
  nextTick(() => {
    textareaFocus.value = true
  })
}

const closeCommentEditor = () => {
  if (submitting.value) return

  textareaFocus.value = false
  commentEditorVisible.value = false
  commentContent.value = ''
}

const submitComment = async () => {
  if (!noteId.value) return
  if (!commentContent.value.trim()) {
    uni.showToast({ title: '请输入评论内容', icon: 'none' })
    return
  }

  // 检查登录状态
  if (!user.value) {
    closeCommentEditor()
    showLoginPromptDialog()
    return
  }

  submitting.value = true
  try {
    const res = await travelNoteInteractionApi.publishComment({
      userId: user.value.id,
      contentType: 'note',
      contentId: noteId.value,
      content: commentContent.value.trim(),
    })
    const data = res.data as ApiResponse<{ commentId?: number; commentCount?: number }>
    if (res.statusCode === 200 && data.code === 200) {
      uni.showToast({ title: '评论成功', icon: 'success' })
      commentContent.value = ''
      commentEditorVisible.value = false
      // 重新加载评论
      await loadComments()
      // 更新评论数
      if (noteDetail.value?.note) {
        if (data.data?.commentCount !== undefined) {
          noteDetail.value.note.commentCount = data.data.commentCount
        } else {
          noteDetail.value.note.commentCount = (noteDetail.value.note.commentCount || 0) + 1
        }
      }
    } else {
      uni.showToast({ title: data.msg || '评论失败', icon: 'none'       })
    }
  } catch (error: any) {
    uni.showToast({
      title: error?.message || '网络错误，请检查网络连接',
      icon: 'none'
    })
  } finally {
    submitting.value = false
  }
}

const formatTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const loadDetail = async () => {
  if (!noteId.value) return

  try {
    const res = await travelNoteApi.getDetail(noteId.value, user.value?.id)
    const data = res.data as ApiResponse
    if (res.statusCode === 200 && data.code === 200) {
      noteDetail.value = data.data
      // 同步收藏状态（从后端返回的数据中获取）
      if (data.data?.isFavorite !== undefined) {
        isFavorite.value = data.data.isFavorite
      }
      // 同步点赞状态（从后端返回的数据中获取）
      if (data.data?.isLiked !== undefined) {
        isLiked.value = data.data.isLiked
      }
    } else {
      uni.showToast({
        title: '加载失败',
        icon: 'none',
      })
    }
  } catch (error) {
    uni.showToast({
      title: '网络错误',
      icon: 'none',
    })
  }
}

const loadComments = async () => {
  if (!noteId.value) return

  try {
    const res = await travelNoteInteractionApi.listComments({
      contentType: 'note',
      contentId: noteId.value,
      pageNum: 1,
      pageSize: 1000, // 增加页面大小以获取所有评论
    })
    const data = res.data as ApiResponse<any[]>
    if (res.statusCode === 200 && data.code === 200) {
      // 确保字段名正确映射
      comments.value = (data.data || []).map((comment: any) => ({
        ...comment,
        // 兼容不同的字段名
        nickname: comment.nickname || comment.userName || comment.nick_name,
        avatar: comment.avatar || comment.userAvatar || comment.user_avatar,
      }))
    }
  } catch (error) {
    // 忽略评论加载错误，但不影响页面显示
  }
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = (currentPage.options || {}) as { id?: string | number }
  const id = options.id
  if (id) {
    noteId.value = typeof id === 'string' ? parseInt(id) : id
    if (noteId.value) {
      loadDetail()
      loadComments()
    }
  }
})
</script>

<style scoped>
.note-detail-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
}

.note-detail-page.no-scroll {
  height: 100vh;
  overflow: hidden;
}

.detail-scroll {
  flex: 1;
}

.detail-content {
  padding-bottom: 120rpx;
}

/* 顶部封面 */
.cover-section {
  width: 100%;
  height: 500rpx;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  background-color: #e5e5e5;
}

/* 标题 */
.note-header {
  padding: 32rpx 32rpx 24rpx;
  background-color: #ffffff;
}

.note-title {
  font-size: 40rpx;
  font-weight: 600;
  color: #333333;
  line-height: 1.5;
}

/* 作者卡片 */
.author-card {
  display: flex;
  align-items: center;
  padding: 24rpx 32rpx;
  background-color: #ffffff;
  border-bottom: 1rpx solid #f0f0f0;
}

.author-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 999rpx;
  background-color: #e5e5e5;
  margin-right: 20rpx;
}

.author-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 28rpx;
  color: #333333;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.note-meta {
  font-size: 24rpx;
  color: #999999;
}

/* 正文内容 */
.note-body {
  padding: 32rpx;
  background-color: #ffffff;
  margin-top: 16rpx;
}

.note-text {
  font-size: 30rpx;
  color: #333333;
  line-height: 2;
  display: block;
  margin-bottom: 32rpx;
}

.image-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.image-item {
  width: 100%;
  border-radius: 16rpx;
  overflow: hidden;
}

.note-image {
  width: 100%;
  min-height: 400rpx;
  background-color: #e5e5e5;
}

/* 评论区域 */
.comment-section {
  margin-top: 16rpx;
  background-color: #ffffff;
  padding: 32rpx;
}

.section-header {
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.comment-item {
  display: flex;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 999rpx;
  background-color: #e5e5e5;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.comment-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.comment-author {
  font-size: 26rpx;
  color: #333333;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.comment-content {
  font-size: 28rpx;
  color: #333333;
  line-height: 1.6;
  margin-bottom: 8rpx;
}

.comment-time {
  font-size: 22rpx;
  color: #999999;
}

/* 底部操作栏 */
.comment-editor-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  z-index: 999;
}

.comment-editor {
  width: 100%;
  background: #ffffff;
  border-top-left-radius: 24rpx;
  border-top-right-radius: 24rpx;
  padding: 24rpx;
  position: relative;
  z-index: 1000;
  /* 确保编辑器可以接收所有交互事件 */
  pointer-events: auto;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.editor-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
}

.editor-close {
  font-size: 32rpx;
  color: #999999;
}

.editor-input-wrapper {
  width: 100%;
  position: relative;
  z-index: 10;
  margin-bottom: 12rpx;
  /* 确保可以接收点击事件 */
  pointer-events: auto;
}

.editor-input {
  width: 100%;
  min-height: 160rpx;
  padding: 16rpx;
  background: #f7f8fa;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;
  line-height: 1.6;
  word-break: break-all;
  border: 1rpx solid transparent;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  display: block;
  position: relative;
  z-index: 11;
  pointer-events: auto;
  /* 确保可以接收触摸事件 */
  touch-action: manipulation;
}

.editor-footer {
  margin-top: 12rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-count {
  font-size: 24rpx;
  color: #999999;
}

.editor-submit {
  padding: 16rpx 32rpx;
  background-color: #3ba272;
  color: #ffffff;
  border-radius: 999rpx;
  font-size: 28rpx;
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 20rpx 0;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #ffffff;
  border-top: 1rpx solid #f0f0f0;
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 0 32rpx;
  position: relative;
  z-index: 10;
  /* 确保可以点击 */
  pointer-events: auto;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.2s;
}

.action-btn:active {
  transform: scale(0.95);
  opacity: 0.8;
}

.action-btn.active {
  color: #3ba272;
}

.action-icon {
  font-size: 44rpx;
  line-height: 1;
  color: #d0d5dd;
  transition: color 0.2s;
}

/* 点赞图标已点赞状态 */
.action-btn.active .icon-icon.icon-liked {
  color: rgb(162, 59, 81);
}

/* 评论图标颜色 */
.action-icon.icon-pinglun {
  color: #5f6c7b;
}

/* 收藏图标已收藏状态 */
.action-btn.active .icon-shoucang.icon-favorited {
  color: #f5a524;
}

/* 收藏图标未收藏状态 */
.action-icon.icon-shoucang {
  color: #d0d5dd;
}

.action-text {
  font-size: 22rpx;
  color: #666666;
}

.action-btn.active .action-text {
  color: #3ba272;
}

.loading {
  text-align: center;
  padding: 100rpx 40rpx;
  color: #999999;
  font-size: 28rpx;
}
</style>

