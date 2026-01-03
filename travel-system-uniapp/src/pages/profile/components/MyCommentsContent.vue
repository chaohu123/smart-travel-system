<template>
  <view class="comments-content">
    <scroll-view
      scroll-y
      class="scroll-view"
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 骨架屏 -->
      <view v-if="loading && commentList.length === 0" class="comment-list">
        <view v-for="i in 5" :key="i" class="skeleton-comment">
          <view class="skeleton-avatar"></view>
          <view class="skeleton-content">
            <view class="skeleton-line"></view>
            <view class="skeleton-line short"></view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else-if="!loading && commentList.length === 0" class="empty-state">
        <text class="empty-icon">💬</text>
        <text class="empty-text">还没有发表过评论</text>
        <text class="empty-tip">去分享你的想法吧~</text>
      </view>

      <!-- 评论列表 -->
      <view v-if="!loading && commentList.length > 0" class="comment-list">
        <view
          v-for="comment in commentList"
          :key="comment.id"
          class="comment-item"
          @click="viewDetail(comment.contentId, comment.contentType)"
        >
          <view class="comment-header">
            <view class="comment-content-info">
              <text class="content-title">{{ comment.contentTitle || '游记' }}</text>
              <text class="comment-time">{{ formatTime(comment.createTime) }}</text>
            </view>
          </view>
          
          <view class="comment-body">
            <text class="comment-text">{{ comment.content }}</text>
          </view>

          <view class="comment-footer">
            <view class="comment-actions">
              <view class="action-item">
                <text class="iconfont icon-icon"></text>
                <text>{{ comment.likeCount || 0 }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载更多提示 -->
      <view v-if="hasMore && !loading" class="load-more">
        <text class="load-more-text">上拉加载更多</text>
      </view>
      <view v-if="!hasMore && commentList.length > 0" class="load-more">
        <text class="load-more-text">没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { travelNoteInteractionApi } from '@/api/content'
import { useUserStore } from '@/store/user'

const store = useUserStore()
const user = computed(() => store.state.profile)

const commentList = ref<any[]>([])
const loading = ref(false)
const refreshing = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)

// 加载评论列表
const loadComments = async (reset = false) => {
  if (!user.value?.id) {
    console.log('[MyComments] 用户未登录')
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  if (reset) {
    pageNum.value = 1
    hasMore.value = true
    commentList.value = [] // 重置时清空列表
  }

  if (loading.value || (!reset && !hasMore.value)) {
    console.log('[MyComments] 正在加载或没有更多数据', { loading: loading.value, hasMore: hasMore.value, reset })
    return
  }

  loading.value = true
  console.log('[MyComments] 开始加载数据', {
    userId: user.value.id,
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    reset
  })

  try {
    const res = await travelNoteInteractionApi.listMyComments(user.value.id, pageNum.value, pageSize.value)
    
    console.log('[MyComments] API响应', {
      statusCode: res?.statusCode,
      code: res?.data?.code,
      msg: res?.data?.msg,
      data: res?.data?.data
    })

    if (res.statusCode === 200 && res.data.code === 200) {
      const data = res.data.data || {}
      const dataList = data.list || []
      
      console.log('[MyComments] 解析数据', {
        total: data.total,
        listLength: dataList.length,
        pageNum: data.pageNum,
        pageSize: data.pageSize,
        dataList: dataList
      })
      
      if (reset) {
        commentList.value = dataList
        console.log('[MyComments] 重置列表，新列表长度:', commentList.value.length)
      } else {
        // 使用循环替代扩展运算符，避免 Babel runtime 错误
        for (let i = 0; i < dataList.length; i++) {
          commentList.value.push(dataList[i])
        }
        console.log('[MyComments] 追加数据，列表长度:', commentList.value.length)
      }
      
      // 确保数据已赋值
      console.log('[MyComments] 赋值后列表状态', {
        listLength: commentList.value.length,
        listValue: commentList.value
      })

      hasMore.value = dataList.length >= pageSize.value
      if (hasMore.value) {
        pageNum.value++
      }

      // 立即重置 loading 状态，确保数据能显示
      loading.value = false
      refreshing.value = false
      
      // 等待 DOM 更新
      await nextTick()
      
      console.log('[MyComments] 数据加载完成', {
        currentListLength: commentList.value.length,
        hasMore: hasMore.value,
        nextPageNum: pageNum.value,
        loading: loading.value,
        listData: commentList.value,
        firstItem: commentList.value[0] || null
      })
      
      // 验证模板条件
      console.log('[MyComments] 模板条件检查', {
        '!loading': !loading.value,
        'commentList.length > 0': commentList.value.length > 0,
        'shouldDisplay': !loading.value && commentList.value.length > 0
      })
    } else {
      console.error('[MyComments] API返回错误', res?.data)
      uni.showToast({ title: res.data.msg || '加载失败', icon: 'none' })
      loading.value = false
      refreshing.value = false
    }
  } catch (e: any) {
    console.error('[MyComments] 加载评论列表失败', {
      error: e,
      message: e?.message,
      statusCode: e?.statusCode,
      stack: e?.stack
    })
    if (e.statusCode === 404) {
      console.log('[MyComments] 接口不存在，显示空状态')
      commentList.value = []
      hasMore.value = false
    } else {
      uni.showToast({ title: '加载失败: ' + (e?.message || '未知错误'), icon: 'none', duration: 3000 })
    }
    loading.value = false
    refreshing.value = false
  }
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  loadComments(true)
}

// 加载更多
const loadMore = () => {
  if (!loading.value && hasMore.value) {
    loadComments(false)
  }
}

// 查看详情
const viewDetail = (contentId: number, contentType: string) => {
  if (contentType === 'note') {
    uni.navigateTo({ url: `/pages/travel-note/detail?id=${contentId}` })
  } else {
    uni.showToast({ title: '暂不支持该类型', icon: 'none' })
  }
}

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes <= 0 ? '刚刚' : `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }
}

onMounted(() => {
  if (user.value) {
    loadComments(true)
  }
})
</script>

<style scoped>
.comments-content {
  height: 100%;
  background-color: #f8fafb;
  display: flex;
  flex-direction: column;
}

.scroll-view {
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
}

.comment-list {
  padding: 20rpx;
}

.comment-item {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.comment-content-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.content-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.comment-time {
  font-size: 24rpx;
  color: #999;
}

.comment-body {
  margin-bottom: 20rpx;
}

.comment-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.comment-footer {
  display: flex;
  justify-content: flex-end;
}

.comment-actions {
  display: flex;
  gap: 30rpx;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #999;
}

.action-item .iconfont {
  font-size: 28rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 40rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 40rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.empty-tip {
  font-size: 26rpx;
  color: #999;
}

.load-more {
  text-align: center;
  padding: 40rpx;
}

.load-more-text {
  font-size: 24rpx;
  color: #999;
}

.skeleton-comment {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  gap: 20rpx;
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
}

.skeleton-line {
  height: 24rpx;
  background: #f0f0f0;
  border-radius: 4rpx;
  margin-bottom: 12rpx;
}

.skeleton-line.short {
  width: 60%;
}
</style>

