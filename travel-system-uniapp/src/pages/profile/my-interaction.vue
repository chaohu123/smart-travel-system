<template>
  <view class="my-interaction-page">
    <!-- 顶部 Tab -->
    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: currentTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="tab-content">
      <!-- 我的收藏 -->
      <view v-if="currentTab === 'favorites'" class="favorites-content">
        <!-- 分类选择 -->
        <view class="category-tabs">
          <view
            v-for="category in favoriteCategories"
            :key="category.key"
            class="category-tab"
            :class="{ active: currentFavoriteCategory === category.key }"
            @click="switchFavoriteCategory(category.key)"
          >
            <text class="category-text">{{ category.label }}</text>
          </view>
        </view>

        <!-- 内容列表 -->
        <scroll-view
          scroll-y
          class="scroll-view"
          @scrolltolower="loadMoreFavorites"
          :refresher-enabled="true"
          :refresher-triggered="favoritesRefreshing"
          @refresherrefresh="onRefreshFavorites"
        >
          <!-- 骨架屏 -->
          <view v-if="favoritesLoading && favoritesList.length === 0" class="content-list">
            <view v-for="i in 6" :key="i" class="skeleton-card">
              <view class="skeleton-cover"></view>
              <view class="skeleton-content">
                <view class="skeleton-line"></view>
                <view class="skeleton-line short"></view>
              </view>
            </view>
          </view>

          <!-- 空状态 -->
          <view v-else-if="!favoritesLoading && favoritesList.length === 0" class="empty-state">
            <text class="empty-icon iconfont icon-menpiao"></text>
            <text class="empty-text">还没有收藏任何{{ getFavoriteCategoryLabel() }}</text>
            <text class="empty-tip">去发现精彩内容吧~</text>
          </view>

          <!-- 游记列表 -->
          <view v-if="!favoritesLoading && currentFavoriteCategory === 'note' && favoritesList.length > 0" class="content-list note-list">
            <view
              v-for="item in favoritesList"
              :key="item.id"
              class="note-card"
              @click="viewNoteDetail(item.id)"
            >
              <view class="note-cover-wrapper">
                <image
                  v-if="item.coverImage"
                  class="note-cover"
                  :src="getImageUrl(item.coverImage)"
                  mode="aspectFill"
                  :lazy-load="true"
                />
                <view v-if="getNoteTag(item)" class="note-tag">
                  {{ getNoteTag(item) }}
                </view>
              </view>

              <view class="note-info">
                <view class="note-meta-row">
                  <image
                    class="note-author-avatar"
                    :src="getImageUrl(item.authorAvatar) || defaultAvatar"
                    mode="aspectFill"
                  />
                  <text class="note-author-name">{{ item.authorName || '匿名用户' }}</text>
                  <text class="note-publish-time">{{ formatTime(item.createTime) }}</text>
                </view>

                <view class="note-title-row">
                  <text class="note-title">{{ item.title }}</text>
                </view>

                <view class="note-location-row">
                  <text class="note-location">{{ item.cityName || '未知地点' }}</text>
                </view>

                <view class="note-actions-row">
                  <view class="note-action-item">
                    <text class="iconfont note-action-icon" :class="['icon-icon', { 'icon-liked': item.isLiked }]"></text>
                    <text class="note-action-count" :class="{ 'text-active': item.isLiked }">
                      {{ item.likeCount || 0 }}
                    </text>
                  </view>
                  <view class="note-action-item">
                    <text class="iconfont icon-pinglun note-action-icon"></text>
                    <text class="note-action-count">{{ item.commentCount || 0 }}</text>
                  </view>
                  <view class="note-action-item">
                    <text class="iconfont note-action-icon icon-shoucang icon-favorited"></text>
                    <text class="note-action-count text-active">{{ item.favoriteCount || 0 }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 景点列表 -->
          <view v-if="!favoritesLoading && currentFavoriteCategory === 'scenic' && favoritesList.length > 0" class="content-list scenic-list">
            <view
              v-for="item in favoritesList"
              :key="item.id"
              class="scenic-card"
              @click="viewScenicDetail(item.id)"
            >
              <image
                v-if="item.imageUrl"
                class="scenic-image"
                :src="getImageUrl(item.imageUrl)"
                mode="aspectFill"
              />
              <view class="scenic-info">
                <text class="scenic-name">{{ item.name }}</text>
                <text class="scenic-address">{{ item.address || '未知地址' }}</text>
                <view v-if="item.intro" class="scenic-intro">
                  <text class="scenic-intro-text">{{ item.intro }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 美食列表 -->
          <view v-if="!favoritesLoading && currentFavoriteCategory === 'food' && favoritesList.length > 0" class="content-list food-list">
            <view
              v-for="item in favoritesList"
              :key="item.id"
              class="food-card"
              @click="viewFoodDetail(item.id)"
            >
              <image
                v-if="item.imageUrl"
                class="food-image"
                :src="getImageUrl(item.imageUrl)"
                mode="aspectFill"
              />
              <view class="food-info">
                <text class="food-name">{{ item.name }}</text>
                <text class="food-address">{{ item.address || '未知地址' }}</text>
                <view v-if="item.foodType" class="food-type">
                  <text class="food-type-text">{{ item.foodType }}</text>
                </view>
                <view v-if="item.intro" class="food-intro">
                  <text class="food-intro-text">{{ item.intro }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 路线列表 -->
          <view v-if="!favoritesLoading && currentFavoriteCategory === 'route' && favoritesList.length > 0" class="content-list route-list">
            <view
              v-for="item in favoritesList"
              :key="item.id"
              class="route-card"
              @click="viewRouteDetail(item.id)"
            >
              <view class="route-cover-wrapper">
                <image
                  v-if="item.coverImage"
                  class="route-cover"
                  :src="getImageUrl(item.coverImage)"
                  mode="aspectFill"
                  :lazy-load="true"
                />
              </view>
              <view class="route-info">
                <text class="route-name">{{ item.routeName || item.name || '未命名路线' }}</text>
                <text class="route-days">{{ item.days || 0 }}天行程</text>
                <view v-if="item.summary" class="route-summary">
                  <text class="route-summary-text">{{ item.summary }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 加载更多提示 -->
          <view v-if="favoritesHasMore && !favoritesLoading" class="load-more">
            <text class="load-more-text">上拉加载更多</text>
          </view>
          <view v-if="!favoritesHasMore && favoritesList.length > 0" class="load-more">
            <text class="load-more-text">没有更多了</text>
          </view>
        </scroll-view>
      </view>

      <!-- 我的点赞 -->
      <view v-if="currentTab === 'likes'" class="likes-content">
        <!-- 分类选择 -->
        <view class="category-tabs">
          <view
            v-for="category in likeCategories"
            :key="category.key"
            class="category-tab"
            :class="{ active: currentLikeCategory === category.key }"
            @click="switchLikeCategory(category.key)"
          >
            <text class="category-text">{{ category.label }}</text>
          </view>
        </view>

        <scroll-view
          scroll-y
          class="scroll-view"
          @scrolltolower="loadMoreLikes"
          :refresher-enabled="true"
          :refresher-triggered="likesRefreshing"
          @refresherrefresh="onRefreshLikes"
        >
          <!-- 骨架屏 -->
          <view v-if="likesLoading && likesList.length === 0" class="note-list">
            <view v-for="i in 6" :key="i" class="skeleton-card">
              <view class="skeleton-cover"></view>
              <view class="skeleton-content">
                <view class="skeleton-line"></view>
                <view class="skeleton-line short"></view>
              </view>
            </view>
          </view>

          <!-- 空状态 -->
          <view v-else-if="!likesLoading && likesList.length === 0" class="empty-state">
            <text class="empty-icon iconfont icon-icon"></text>
            <text class="empty-text">还没有点赞过任何{{ getLikeCategoryLabel() }}</text>
            <text class="empty-tip">去发现精彩内容吧~</text>
          </view>

          <!-- 点赞游记列表 -->
          <view v-if="!likesLoading && currentLikeCategory === 'note' && likesList.length > 0" class="note-list">
            <view
              v-for="note in likesList"
              :key="note.id"
              class="note-card"
              @click="viewNoteDetail(note.id)"
            >
              <view class="note-cover-wrapper">
                <image
                  v-if="note.coverImage"
                  class="note-cover"
                  :src="getImageUrl(note.coverImage)"
                  mode="aspectFill"
                  :lazy-load="true"
                />
                <view v-if="getNoteTag(note)" class="note-tag">
                  {{ getNoteTag(note) }}
                </view>
              </view>

              <view class="note-info">
                <view class="note-meta-row">
                  <image
                    class="note-author-avatar"
                    :src="getImageUrl(note.authorAvatar) || defaultAvatar"
                    mode="aspectFill"
                  />
                  <text class="note-author-name">{{ note.authorName || '匿名用户' }}</text>
                  <text class="note-publish-time">{{ formatTime(note.createTime) }}</text>
                </view>

                <view class="note-title-row">
                  <text class="note-title">{{ note.title }}</text>
                </view>

                <view class="note-location-row">
                  <text class="note-location">{{ note.cityName || '未知地点' }}</text>
                </view>

                <view class="note-actions-row">
                  <view class="note-action-item">
                    <text class="iconfont icon-icon note-action-icon icon-liked"></text>
                    <text class="note-action-count text-active">{{ note.likeCount || 0 }}</text>
                  </view>
                  <view class="note-action-item">
                    <text class="iconfont icon-pinglun note-action-icon"></text>
                    <text class="note-action-count">{{ note.commentCount || 0 }}</text>
                  </view>
                  <view class="note-action-item">
                    <text class="iconfont note-action-icon" :class="['icon-shoucang', { 'icon-favorited': note.isFavorite }]"></text>
                    <text class="note-action-count" :class="{ 'text-active': note.isFavorite }">
                      {{ note.favoriteCount || 0 }}
                    </text>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 点赞评论列表 -->
          <view v-if="!likesLoading && currentLikeCategory === 'comment' && likesList.length > 0" class="comment-list">
            <view
              v-for="comment in likesList"
              :key="comment.id"
              class="comment-item"
              @click="viewCommentDetail(comment.contentId, comment.contentType)"
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
          <view v-if="likesHasMore && !likesLoading" class="load-more">
            <text class="load-more-text">上拉加载更多</text>
          </view>
          <view v-if="!likesHasMore && likesList.length > 0" class="load-more">
            <text class="load-more-text">没有更多了</text>
          </view>
        </scroll-view>
      </view>

      <!-- 我的评论 -->
      <view v-if="currentTab === 'comments'" class="comments-content">
        <scroll-view
          scroll-y
          class="scroll-view"
          @scrolltolower="loadMoreComments"
          :refresher-enabled="true"
          :refresher-triggered="commentsRefreshing"
          @refresherrefresh="onRefreshComments"
        >
          <!-- 骨架屏 -->
          <view v-if="commentsLoading && commentsList.length === 0" class="comment-list">
            <view v-for="i in 5" :key="i" class="skeleton-comment">
              <view class="skeleton-avatar"></view>
              <view class="skeleton-content">
                <view class="skeleton-line"></view>
                <view class="skeleton-line short"></view>
              </view>
            </view>
          </view>

          <!-- 空状态 -->
          <view v-else-if="!commentsLoading && commentsList.length === 0" class="empty-state">
            <text class="empty-icon iconfont icon-pinglun"></text>
            <text class="empty-text">还没有发表过评论</text>
            <text class="empty-tip">去分享你的想法吧~</text>
          </view>

          <!-- 评论列表 -->
          <view v-if="!commentsLoading && commentsList.length > 0" class="comment-list">
            <view
              v-for="comment in commentsList"
              :key="comment.id"
              class="comment-item"
              @click="viewCommentDetail(comment.contentId, comment.contentType)"
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
          <view v-if="commentsHasMore && !commentsLoading" class="load-more">
            <text class="load-more-text">上拉加载更多</text>
          </view>
          <view v-if="!commentsHasMore && commentsList.length > 0" class="load-more">
            <text class="load-more-text">没有更多了</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { travelNoteApi, scenicSpotApi, foodApi, travelNoteInteractionApi } from '@/api/content'
import { routeApi } from '@/api/route'
import { useUserStore } from '@/store/user'
import { safeNavigateTo, resetNavigationState } from '@/utils/router'
import { getImageUrl } from '@/utils/image'

const store = useUserStore()
const user = computed(() => store.state.profile)
const defaultAvatar = 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200'

// TabKey 类型
type TabKey = 'favorites' | 'likes' | 'comments'

// Tabs 配置
const tabs: { key: TabKey; label: string }[] = [
  { key: 'favorites', label: '我的收藏' },
  { key: 'likes', label: '我的点赞' },
  { key: 'comments', label: '我的评论' }
]

// 当前 Tab
const currentTab = ref<TabKey>('favorites')

// 切换 Tab
const switchTab = (key: TabKey) => {
  currentTab.value = key
  // 切换tab时加载对应数据
  if (key === 'favorites') {
    // 切换到收藏tab时，如果当前分类没有数据，则加载
    if (favoritesList.value.length === 0) {
      loadFavoritesData(true)
    }
  } else if (key === 'likes') {
    // 切换到点赞tab时，如果当前分类没有数据，则加载
    if (likesList.value.length === 0 || currentLikeCategory.value !== 'note') {
      // 如果列表为空，或者当前分类不是默认的note，重新加载
      if (currentLikeCategory.value !== 'note') {
        currentLikeCategory.value = 'note'
      }
      likesList.value = []
      loadLikesData(true)
    }
  } else if (key === 'comments') {
    // 切换到评论tab时，如果没有数据，则加载
    if (commentsList.value.length === 0) {
      loadCommentsData(true)
    }
  }
}

// ========== 我的收藏相关 ==========
const favoriteCategories = [
  { key: 'note', label: '游记' },
  { key: 'scenic', label: '景点' },
  { key: 'food', label: '美食' },
  { key: 'route', label: '路线' }
]

const currentFavoriteCategory = ref('note')
const favoritesList = ref<any[]>([])
const favoritesLoading = ref(false)
const favoritesRefreshing = ref(false)
const favoritesPageNum = ref(1)
const favoritesPageSize = ref(10)
const favoritesHasMore = ref(true)

// 切换收藏分类
const switchFavoriteCategory = (key: string) => {
  // 如果点击的是当前分类，且已有数据，不重复加载
  if (currentFavoriteCategory.value === key && favoritesList.value.length > 0) {
    return
  }
  currentFavoriteCategory.value = key
  favoritesPageNum.value = 1
  favoritesHasMore.value = true
  favoritesList.value = [] // 清空列表，只显示当前分类的数据
  loadFavoritesData(true)
}

// 获取收藏分类标签
const getFavoriteCategoryLabel = () => {
  const category = favoriteCategories.find(c => c.key === currentFavoriteCategory.value)
  return category?.label || '内容'
}

// 加载收藏数据
const loadFavoritesData = async (reset = false) => {
  if (!user.value?.id) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  if (reset) {
    favoritesPageNum.value = 1
    favoritesHasMore.value = true
    favoritesList.value = [] // 重置时清空列表，确保只显示当前分类的数据
  }

  if (favoritesLoading.value || (!reset && !favoritesHasMore.value)) {
    return
  }

  favoritesLoading.value = true

  try {
    let res: any

    if (currentFavoriteCategory.value === 'note') {
      res = await travelNoteApi.listMyFavorites(user.value.id, favoritesPageNum.value, favoritesPageSize.value)
    } else if (currentFavoriteCategory.value === 'scenic') {
      res = await scenicSpotApi.getMyFavorites(user.value.id, favoritesPageNum.value, favoritesPageSize.value)
    } else if (currentFavoriteCategory.value === 'food') {
      res = await foodApi.getMyFavorites(user.value.id, favoritesPageNum.value, favoritesPageSize.value)
    } else if (currentFavoriteCategory.value === 'route') {
      // 注意：这里可能需要根据实际API调整
      res = await routeApi.listMyRoutes(user.value.id)
      // 如果返回的是数组，需要转换为分页格式
      if (res && res.statusCode === 200 && res.data.code === 200) {
        const dataList = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.list || [])
        res.data.data = {
          list: dataList,
          total: dataList.length,
          pageNum: favoritesPageNum.value,
          pageSize: favoritesPageSize.value
        }
      }
    }


    if (res && res.statusCode === 200 && res.data.code === 200) {
      const data = res.data.data || {}
      const dataList = data.list || []
      
      
      if (reset) {
        favoritesList.value = dataList
      } else {
        for (let i = 0; i < dataList.length; i++) {
          favoritesList.value.push(dataList[i])
        }
      }

      favoritesHasMore.value = dataList.length >= favoritesPageSize.value
      if (favoritesHasMore.value) {
        favoritesPageNum.value++
      }

      favoritesLoading.value = false
      favoritesRefreshing.value = false
      
      await nextTick()
      
    } else {
      uni.showToast({ title: res?.data?.msg || '加载失败', icon: 'none' })
      favoritesLoading.value = false
      favoritesRefreshing.value = false
    }
  } catch (e: any) {
    uni.showToast({ title: '加载失败: ' + (e?.message || '未知错误'), icon: 'none', duration: 3000 })
    favoritesLoading.value = false
    favoritesRefreshing.value = false
  }
}

// 下拉刷新收藏
const onRefreshFavorites = () => {
  favoritesRefreshing.value = true
  loadFavoritesData(true)
}

// 加载更多收藏
const loadMoreFavorites = () => {
  if (!favoritesLoading.value && favoritesHasMore.value) {
    loadFavoritesData(false)
  }
}

// ========== 我的点赞相关 ==========
const likeCategories = [
  { key: 'note', label: '游记' },
  { key: 'comment', label: '评论' }
]

const currentLikeCategory = ref('note')
const likesList = ref<any[]>([])
const likesLoading = ref(false)
const likesRefreshing = ref(false)
const likesPageNum = ref(1)
const likesPageSize = ref(10)
const likesHasMore = ref(true)

// 切换点赞分类
const switchLikeCategory = (key: string) => {
  // 如果点击的是当前分类，且已有数据，不重复加载
  if (currentLikeCategory.value === key && likesList.value.length > 0) {
    return
  }
  currentLikeCategory.value = key
  likesPageNum.value = 1
  likesHasMore.value = true
  likesList.value = [] // 清空列表，只显示当前分类的数据
  loadLikesData(true)
}

// 获取点赞分类标签
const getLikeCategoryLabel = () => {
  const category = likeCategories.find(c => c.key === currentLikeCategory.value)
  return category?.label || '内容'
}

// 加载点赞列表
const loadLikesData = async (reset = false) => {
  if (!user.value?.id) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  if (reset) {
    likesPageNum.value = 1
    likesHasMore.value = true
    likesList.value = []
  }

  if (likesLoading.value || (!reset && !likesHasMore.value)) {
    return
  }

  likesLoading.value = true

  try {
    let res: any
    
    if (currentLikeCategory.value === 'note') {
      // 加载点赞的游记
      res = await travelNoteInteractionApi.listMyLikes(user.value.id, likesPageNum.value, likesPageSize.value)
    } else if (currentLikeCategory.value === 'comment') {
      // 加载点赞的评论
      // 注意：如果后端没有专门的点赞评论API，这里可以尝试从评论列表中筛选
      // 或者显示提示信息
      try {
        // 尝试获取用户的评论列表，然后筛选出被点赞的评论
        const commentRes = await travelNoteInteractionApi.listMyComments(
          user.value.id,
          likesPageNum.value,
          likesPageSize.value
        )
        
        if (commentRes.statusCode === 200 && commentRes.data.code === 200) {
          const commentData = commentRes.data.data || {}
          const commentList = commentData.list || []
          
          // 筛选出有点赞的评论（likeCount > 0）
          const likedComments = commentList.filter((comment: any) => (comment.likeCount || 0) > 0)
          
          if (reset) {
            likesList.value = likedComments
          } else {
            likesList.value.push(...likedComments)
          }
          
          likesHasMore.value = likedComments.length >= likesPageSize.value
          if (likesHasMore.value) {
            likesPageNum.value++
          }
        } else {
          // 如果接口不存在或返回错误，显示空状态
          likesList.value = []
          likesHasMore.value = false
        }
      } catch (error) {
        // 如果接口不存在，显示空状态而不是错误提示
        likesList.value = []
        likesHasMore.value = false
      }
      
      likesLoading.value = false
      likesRefreshing.value = false
      return
    }
    

    if (res.statusCode === 200 && res.data.code === 200) {
      const data = res.data.data || {}
      const dataList = data.list || []
      
      
      if (reset) {
        likesList.value = dataList
      } else {
        for (let i = 0; i < dataList.length; i++) {
          likesList.value.push(dataList[i])
        }
      }

      likesHasMore.value = dataList.length >= likesPageSize.value
      if (likesHasMore.value) {
        likesPageNum.value++
      }

      likesLoading.value = false
      likesRefreshing.value = false
      
      await nextTick()
      
    } else {
      uni.showToast({ title: res.data.msg || '加载失败', icon: 'none' })
      likesLoading.value = false
      likesRefreshing.value = false
    }
  } catch (e: any) {
    uni.showToast({ title: '加载失败: ' + (e?.message || '未知错误'), icon: 'none', duration: 3000 })
    likesLoading.value = false
    likesRefreshing.value = false
  }
}

// 下拉刷新点赞
const onRefreshLikes = () => {
  likesRefreshing.value = true
  loadLikesData(true)
}

// 加载更多点赞
const loadMoreLikes = () => {
  if (!likesLoading.value && likesHasMore.value) {
    loadLikesData(false)
  }
}

// ========== 我的评论相关 ==========
const commentsList = ref<any[]>([])
const commentsLoading = ref(false)
const commentsRefreshing = ref(false)
const commentsPageNum = ref(1)
const commentsPageSize = ref(10)
const commentsHasMore = ref(true)

// 加载评论列表
const loadCommentsData = async (reset = false) => {
  if (!user.value?.id) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  if (reset) {
    commentsPageNum.value = 1
    commentsHasMore.value = true
    commentsList.value = []
  }

  if (commentsLoading.value || (!reset && !commentsHasMore.value)) {
    return
  }

  commentsLoading.value = true

  try {
    const res = await travelNoteInteractionApi.listMyComments(user.value.id, commentsPageNum.value, commentsPageSize.value)
    

    if (res.statusCode === 200 && res.data.code === 200) {
      const data = res.data.data || {}
      const dataList = data.list || []
      
      
      if (reset) {
        commentsList.value = dataList
      } else {
        for (let i = 0; i < dataList.length; i++) {
          commentsList.value.push(dataList[i])
        }
      }

      commentsHasMore.value = dataList.length >= commentsPageSize.value
      if (commentsHasMore.value) {
        commentsPageNum.value++
      }

      commentsLoading.value = false
      commentsRefreshing.value = false
      
      await nextTick()
      
    } else {
      uni.showToast({ title: res.data.msg || '加载失败', icon: 'none' })
      commentsLoading.value = false
      commentsRefreshing.value = false
    }
  } catch (e: any) {
    if (e.statusCode === 404) {
      commentsList.value = []
      commentsHasMore.value = false
    } else {
      uni.showToast({ title: '加载失败: ' + (e?.message || '未知错误'), icon: 'none', duration: 3000 })
    }
    commentsLoading.value = false
    commentsRefreshing.value = false
  }
}

// 下拉刷新评论
const onRefreshComments = () => {
  commentsRefreshing.value = true
  loadCommentsData(true)
}

// 加载更多评论
const loadMoreComments = () => {
  if (!commentsLoading.value && commentsHasMore.value) {
    loadCommentsData(false)
  }
}

// ========== 通用方法 ==========
// 点击防抖
let lastClickTime = 0
const CLICK_DEBOUNCE_TIME = 300

// 查看详情
const viewNoteDetail = (id: number) => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  safeNavigateTo(`/pages/travel-note/detail?id=${id}`).catch(() => {
    // 静默处理错误
  })
}

const viewScenicDetail = (id: number) => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  safeNavigateTo(`/pages/scenic/detail?id=${id}`).catch(() => {
    // 静默处理错误
  })
}

const viewFoodDetail = (id: number) => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  safeNavigateTo(`/pages/food/detail?id=${id}`).catch(() => {
    // 静默处理错误
  })
}

const viewRouteDetail = (id: number) => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  safeNavigateTo(`/pages/route/detail?id=${id}`).catch(() => {
    // 静默处理错误
  })
}

const viewCommentDetail = (contentId: number, contentType: string) => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  
  if (contentType === 'note') {
    safeNavigateTo(`/pages/travel-note/detail?id=${contentId}`).catch(() => {
      // 静默处理错误
    })
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

// 获取标签
const getNoteTag = (note: any) => {
  if (note.isFeatured) return '精选'
  if (note.isHot) return '热门'
  return ''
}

// 初始化 - 只在页面加载时加载当前tab的数据
onMounted(() => {
  if (user.value) {
    // 默认显示"我的收藏"，加载收藏数据
    if (currentTab.value === 'favorites') {
      loadFavoritesData(true)
    }
  }
})
</script>

<style scoped>
.my-interaction-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f8fafb;
}

/* 顶部 tabs */
.tabs {
  display: flex;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
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
  background-color: #3ba272;
  border-radius: 2rpx;
}

.tab-content {
  flex: 1;
  overflow: hidden;
}

/* ========== 我的收藏样式 ========== */
.favorites-content {
  width: 100%;
  height: 100%;
  background-color: #f8fafb;
  display: flex;
  flex-direction: column;
}

.category-tabs {
  display: flex;
  background: #fff;
  border-bottom: 1rpx solid #eee;
  position: sticky;
  top: 0;
  z-index: 9;
  flex-shrink: 0;
}

.category-tab {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24rpx 0;
  position: relative;
}

.category-tab.active {
  color: #3ba272;
}

.category-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50rpx;
  height: 4rpx;
  background: #3ba272;
  border-radius: 2rpx;
}

.category-text {
  font-size: 26rpx;
  color: #666;
}

.category-tab.active .category-text {
  color: #3ba272;
  font-weight: 600;
}

.scroll-view {
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
}

.content-list {
  padding: 20rpx;
}

.note-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  box-sizing: border-box;
}

.note-card {
  width: calc((100% - 20rpx) / 2);
  flex: 0 0 calc((100% - 20rpx) / 2);
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

.note-cover-wrapper {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  overflow: hidden;
}

.note-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.note-tag {
  position: absolute;
  top: 12rpx;
  left: 12rpx;
  background: rgba(59, 162, 114, 0.9);
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.note-info {
  padding: 20rpx;
}

.note-meta-row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.note-author-avatar {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  margin-right: 12rpx;
}

.note-author-name {
  font-size: 24rpx;
  color: #666;
  margin-right: 12rpx;
}

.note-publish-time {
  font-size: 22rpx;
  color: #999;
  margin-left: auto;
}

.note-title-row {
  margin-bottom: 8rpx;
}

.note-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.note-location-row {
  margin-bottom: 12rpx;
}

.note-location {
  font-size: 24rpx;
  color: #999;
}

.note-actions-row {
  display: flex;
  justify-content: space-around;
  padding-top: 12rpx;
  border-top: 1rpx solid #f5f5f5;
}

.note-action-item {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.note-action-icon {
  font-size: 32rpx;
  color: #999;
}

.note-action-icon.icon-liked {
  color: #ff6b6b;
}

.note-action-icon.icon-favorited {
  color: #ff6b6b;
}

.note-action-count {
  font-size: 24rpx;
  color: #999;
}

.note-action-count.text-active {
  color: #ff6b6b;
}

.scenic-list,
.food-list,
.route-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.scenic-card,
.food-card,
.route-card {
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  display: flex;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.scenic-image,
.food-image {
  width: 200rpx;
  height: 200rpx;
  flex-shrink: 0;
}

.route-cover-wrapper {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  flex-shrink: 0;
  overflow: hidden;
}

.route-cover {
  width: 100%;
  height: 100%;
}

.scenic-info,
.food-info,
.route-info {
  flex: 1;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.scenic-name,
.food-name,
.route-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
}

.route-days {
  font-size: 24rpx;
  color: #3ba272;
  margin-bottom: 12rpx;
}

.scenic-address,
.food-address {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.scenic-intro,
.food-intro,
.route-summary {
  margin-top: 8rpx;
}

.scenic-intro-text,
.food-intro-text,
.route-summary-text {
  font-size: 24rpx;
  color: #999;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.food-type {
  margin-top: 8rpx;
}

.food-type-text {
  font-size: 24rpx;
  color: #3ba272;
  background: #e4f7ef;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  display: inline-block;
}

/* ========== 我的点赞样式 ========== */
.likes-content {
  width: 100%;
  height: 100%;
  background-color: #f8fafb;
  display: flex;
  flex-direction: column;
}

/* ========== 我的评论样式 ========== */
.comments-content {
  width: 100%;
  height: 100%;
  background-color: #f8fafb;
  display: flex;
  flex-direction: column;
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

/* ========== 通用样式 ========== */
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

.skeleton-card {
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
}

.skeleton-cover {
  width: 100%;
  padding-top: 56.25%;
  background: #f0f0f0;
}

.skeleton-content {
  padding: 20rpx;
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
</style>
