<template>
  <view class="plan-page">
    <view class="page-bg"></view>
    
    <!-- 步骤指示器 -->
    <view class="step-indicator">
      <view class="step-indicator-header">
        <text class="step-indicator-title">生成属于自己的专属路线</text>
      </view>
      <view class="step-indicator-content">
        <view 
          v-for="(step, index) in steps" 
          :key="index"
          class="step-item"
          :class="{ 
            active: currentStep === index, 
            completed: currentStep > index 
          }"
          @click="goToStep(index)"
        >
          <view class="step-circle">
            <text v-if="currentStep > index" class="step-check">✓</text>
            <text v-else class="step-number">{{ index + 1 }}</text>
          </view>
          <text class="step-label">{{ step.label }}</text>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="plan-scroll">
      <!-- 步骤1: 目的地选择 -->
      <view v-show="currentStep === 0" class="step-content">
        <view class="step-header">
          <text class="step-title">选择目的地</text>
          <text class="step-subtitle">告诉我们你想去哪里</text>
        </view>
        
        <!-- 热门城市卡片 - 一行显示4个 -->
        <view class="city-cards">
          <view
            v-for="city in popularCities.slice(0, 4)"
            :key="city.id"
            class="city-card"
            :class="{ active: selectedCity?.id === city.id }"
            @click="selectCity(city)"
          >
            <view 
              class="city-card-bg" 
              :style="{ 
                backgroundImage: city.image ? `url(${city.image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundColor: city.image ? 'transparent' : '#667eea'
              }"
            >
              <view class="city-card-overlay"></view>
            </view>
            <view class="city-card-content">
              <text class="city-name">{{ city.name }}</text>
              <text class="city-desc">{{ city.desc || '热门旅游城市' }}</text>
            </view>
            <view v-if="selectedCity?.id === city.id" class="city-check-icon">✓</view>
          </view>
        </view>

        <!-- 自定义输入 -->
        <view class="custom-destination">
          <text class="custom-label">或输入其他目的地</text>
          <input
            class="destination-input"
            v-model="destination"
            placeholder="输入城市名称..."
            placeholder-style="color: #999999;"
            @input="onDestinationInput"
            type="text"
            maxlength="50"
          />
        </view>


        <!-- 快速标签入口 -->
        <view class="quick-tags-section">
          <view class="quick-tags-header">
            <text class="quick-tags-title">快速选择</text>
          </view>
          <view class="quick-tags-list">
            <view
              v-for="tag in quickTags"
              :key="tag.id"
              class="quick-tag-item"
              :class="{ active: selectedQuickTags.includes(tag.id) }"
              @click="toggleQuickTag(tag.id)"
            >
              <text class="quick-tag-icon">{{ tag.icon }}</text>
              <text class="quick-tag-text">{{ tag.name }}</text>
            </view>
          </view>
        </view>

        <!-- 底部自然语言输入提示 -->
        <view class="nlp-trigger-section">
          <view class="nlp-trigger-btn" @tap="openNlpModal">
            <text class="nlp-trigger-icon">💭</text>
            <text class="nlp-trigger-text">点击输入我的想法</text>
            <text class="nlp-trigger-arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 步骤2: 时间与成员选择 -->
      <view v-show="currentStep === 1" class="step-content">
        <view class="step-header">
          <text class="step-title">选择出行时间与成员</text>
          <text class="step-subtitle">规划你的旅行日期和同行人员</text>
        </view>

        <!-- 日期选择 -->
        <view class="date-picker-container">
          <view class="date-input-wrapper">
            <view class="date-input date-input-clickable" @click="openDatePicker('start')">
              <text class="date-label">开始日期</text>
              <text class="date-value" :class="{ placeholder: !startDate }">
                {{ startDate ? formatDate(startDate) : '选择开始日期' }}
              </text>
            </view>
            <text class="date-separator">至</text>
            <view class="date-input date-input-clickable" @click="openDatePicker('end')">
              <text class="date-label">结束日期</text>
              <text class="date-value" :class="{ placeholder: !endDate }">
                {{ endDate ? formatDate(endDate) : '选择结束日期' }}
              </text>
            </view>
          </view>
          
          <view v-if="travelDays > 0" class="days-display">
            <text class="days-text">共 {{ travelDays }} 天 {{ travelDays - 1 }} 晚</text>
          </view>

          <!-- 日期提示信息 -->
          <view v-if="dateTips" class="date-tips">
            <text class="date-tips-icon">ℹ️</text>
            <text class="date-tips-text">{{ dateTips }}</text>
          </view>
        </view>

        <!-- 成员选择 -->
        <view class="companion-section">
          <text class="section-label">选择同行成员</text>
          <view class="companion-grid">
            <view
              v-for="companion in companionList"
              :key="companion.id"
              class="companion-card"
              :class="{ active: selectedCompanion === companion.id }"
              @click="selectCompanion(companion.id)"
            >
              <view class="companion-icon-wrapper">
                <text class="companion-icon">{{ companion.icon }}</text>
              </view>
              <text class="companion-name">{{ companion.name }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 步骤3: 偏好设置 -->
      <view v-show="currentStep === 2" class="step-content">
        <view class="step-header">
          <text class="step-title">设置旅行偏好</text>
          <text class="step-subtitle">帮助我们更好地为你规划</text>
        </view>

        <!-- 偏好标签 -->
        <view class="preference-tags-section">
          <text class="section-label">旅行风格</text>
          <view class="tag-list">
            <view
              v-for="tag in tagList"
              :key="tag.id"
              class="tag-item"
              :class="{ active: selectedTags.includes(tag.id) }"
              :style="selectedTags.includes(tag.id) ? { backgroundColor: tag.color, borderColor: tag.color } : {}"
              @click="toggleTag(tag.id)"
            >
              <text>{{ tag.name }}</text>
            </view>
          </view>
        </view>

        <!-- 松弛感滑块 -->
        <view class="slider-section">
          <view class="slider-header">
            <text class="slider-label">行程节奏</text>
            <text class="slider-value">{{ relaxationText }}</text>
          </view>
          <view class="slider-container">
            <view class="slider-labels">
              <text class="slider-left">😴 睡到自然醒</text>
              <text class="slider-right">⚡ 打卡狂魔</text>
            </view>
            <slider
              class="preference-slider"
              :value="relaxationValue"
              min="0"
              max="100"
              step="10"
              activeColor="#3ba272"
              backgroundColor="#e5e5e5"
              block-color="#3ba272"
              block-size="20"
              @change="onRelaxationChange"
            />
          </view>
        </view>

        <!-- 预算滑块 -->
        <view class="slider-section">
          <view class="slider-header">
            <text class="slider-label">预算偏好</text>
            <text class="slider-value">{{ budgetText }}</text>
          </view>
          <view class="slider-container">
            <view class="slider-labels">
              <text class="slider-left">💰 经济实惠</text>
              <text class="slider-right">💎 奢华享受</text>
            </view>
            <slider
              class="preference-slider"
              :value="budgetValue"
              min="0"
              max="100"
              step="10"
              activeColor="#3ba272"
              backgroundColor="#e5e5e5"
              block-color="#3ba272"
              block-size="20"
              @change="onBudgetChange"
            />
          </view>
        </view>

        <!-- 景点和美食日期分配 -->
        <view v-if="travelDays > 0 && (pendingScenics.length > 0 || pendingFoods.length > 0)" class="item-schedule-section">
          <text class="section-label">安排已添加的景点和美食</text>
          <text class="section-hint">将您从详情页添加的景点和美食分配到具体的日期和时间段</text>
          
          <!-- 待分配的景点 -->
          <view v-if="pendingScenics.length > 0" class="schedule-items">
            <text class="schedule-items-title">待分配景点</text>
            <view
              v-for="scenic in pendingScenics"
              :key="scenic.id"
              class="schedule-item-card"
            >
              <view class="schedule-item-info">
                <text class="schedule-item-name">📍 {{ scenic.name }}</text>
                <text v-if="getScenicSchedule(scenic.id)" class="schedule-item-time">
                  {{ getScenicScheduleText(scenic.id) }}
                </text>
              </view>
              <view class="schedule-item-actions">
                <button class="schedule-btn" @tap="openScenicScheduleModal(scenic)">安排时间</button>
                <text v-if="getScenicSchedule(scenic.id)" class="schedule-remove" @tap="removeScenicSchedule(scenic.id)">移除</text>
              </view>
            </view>
          </view>

          <!-- 待分配的美食 -->
          <view v-if="pendingFoods.length > 0" class="schedule-items">
            <text class="schedule-items-title">待分配美食</text>
            <view
              v-for="food in pendingFoods"
              :key="food.id"
              class="schedule-item-card"
            >
              <view class="schedule-item-info">
                <text class="schedule-item-name">🍜 {{ food.name }}</text>
                <text v-if="getFoodSchedule(food.id)" class="schedule-item-time">
                  {{ getFoodScheduleText(food.id) }}
                </text>
              </view>
              <view class="schedule-item-actions">
                <button class="schedule-btn" @tap="openFoodScheduleModal(food)">安排时间</button>
                <text v-if="getFoodSchedule(food.id)" class="schedule-remove" @tap="removeFoodSchedule(food.id)">移除</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 导航按钮 -->
      <view class="step-navigation">
        <button
          v-if="currentStep > 0"
          class="nav-btn prev-btn"
          @click="prevStep"
        >
          上一步
        </button>
        <button
          class="nav-btn next-btn"
          :class="{ disabled: !canGoNext }"
          @click="nextStep"
        >
          {{ currentStep === steps.length - 1 ? '开始智能规划' : '下一步' }}
        </button>
      </view>
    </scroll-view>

    <!-- 日期选择弹窗 - 使用picker-view实现滚动选择器 -->
    <view v-if="showDatePicker" class="date-picker-modal" @tap.stop="closeDatePicker">
      <view class="date-picker-modal-content" @tap.stop>
        <view class="date-picker-header">
          <text class="date-picker-cancel" @tap.stop="closeDatePicker">取消</text>
          <text class="date-picker-title">{{ datePickerType === 'start' ? '选择开始日期' : '选择结束日期' }}</text>
          <text class="date-picker-confirm" @tap.stop="confirmDatePicker">确定</text>
        </view>
        <view class="date-picker-body">
          <picker-view
            :value="datePickerValue"
            @change="onPickerViewChange"
            class="date-picker-view"
          >
            <!-- 年份列 -->
            <picker-view-column>
              <view
                v-for="(year, index) in yearList"
                :key="index"
                class="picker-view-item"
              >
                {{ year }}年
              </view>
            </picker-view-column>
            <!-- 月份列 -->
            <picker-view-column>
              <view
                v-for="(month, index) in monthList"
                :key="index"
                class="picker-view-item"
              >
                {{ month }}月
              </view>
            </picker-view-column>
            <!-- 日期列 -->
            <picker-view-column>
              <view
                v-for="(day, index) in dayList"
                :key="index"
                class="picker-view-item"
              >
                {{ day }}日
              </view>
            </picker-view-column>
          </picker-view>
        </view>
      </view>
    </view>

    <!-- 景点时间段分配弹窗 -->
    <view v-if="showScenicScheduleModal" class="schedule-modal" @tap.stop="closeScenicScheduleModal">
      <view class="schedule-modal-content" @tap.stop>
        <view class="schedule-modal-header">
          <text class="schedule-modal-title">安排景点时间</text>
          <text class="schedule-modal-close" @tap.stop="closeScenicScheduleModal">×</text>
        </view>
        <view class="schedule-modal-body">
          <text class="schedule-item-name-large">📍 {{ currentScheduleItem?.name }}</text>
          
          <view class="schedule-day-selector">
            <text class="schedule-label">选择日期</text>
            <view class="schedule-day-options">
              <view
                v-for="day in travelDays"
                :key="day"
                class="schedule-day-option"
                :class="{ active: scenicScheduleForm.day === day }"
                @tap="scenicScheduleForm.day = day"
              >
                第{{ day }}天
              </view>
            </view>
          </view>

          <view class="schedule-time-selector">
            <text class="schedule-label">选择时间段</text>
            <view class="schedule-time-options">
              <view
                v-for="slot in scenicTimeSlots"
                :key="slot.value"
                class="schedule-time-option"
                :class="{ active: scenicScheduleForm.timeSlot === slot.value }"
                @tap="scenicScheduleForm.timeSlot = slot.value"
              >
                <text class="schedule-time-icon">{{ slot.icon }}</text>
                <text class="schedule-time-text">{{ slot.label }}</text>
              </view>
            </view>
          </view>
        </view>
        <view class="schedule-modal-footer">
          <button class="schedule-cancel-btn" @tap.stop="closeScenicScheduleModal">取消</button>
          <button class="schedule-confirm-btn" @tap.stop="confirmScenicSchedule">确定</button>
        </view>
      </view>
    </view>

    <!-- 美食时间段分配弹窗 -->
    <view v-if="showFoodScheduleModal" class="schedule-modal" @tap.stop="closeFoodScheduleModal">
      <view class="schedule-modal-content" @tap.stop>
        <view class="schedule-modal-header">
          <text class="schedule-modal-title">安排美食时间</text>
          <text class="schedule-modal-close" @tap.stop="closeFoodScheduleModal">×</text>
        </view>
        <view class="schedule-modal-body">
          <text class="schedule-item-name-large">🍜 {{ currentScheduleItem?.name }}</text>
          
          <view class="schedule-day-selector">
            <text class="schedule-label">选择日期</text>
            <view class="schedule-day-options">
              <view
                v-for="day in travelDays"
                :key="day"
                class="schedule-day-option"
                :class="{ active: foodScheduleForm.day === day }"
                @tap="foodScheduleForm.day = day"
              >
                第{{ day }}天
              </view>
            </view>
          </view>

          <view class="schedule-time-selector">
            <text class="schedule-label">选择时间段</text>
            <view class="schedule-time-options">
              <view
                v-for="slot in foodTimeSlots"
                :key="slot.value"
                class="schedule-time-option"
                :class="{ active: foodScheduleForm.timeSlot === slot.value }"
                @tap="foodScheduleForm.timeSlot = slot.value"
              >
                <text class="schedule-time-icon">{{ slot.icon }}</text>
                <text class="schedule-time-text">{{ slot.label }}</text>
              </view>
            </view>
          </view>
        </view>
        <view class="schedule-modal-footer">
          <button class="schedule-cancel-btn" @tap.stop="closeFoodScheduleModal">取消</button>
          <button class="schedule-confirm-btn" @tap.stop="confirmFoodSchedule">确定</button>
        </view>
      </view>
    </view>

    <!-- 自然语言输入弹窗 -->
    <view v-if="showNlpInput" class="nlp-modal" @tap.stop="closeNlpModal">
      <view class="nlp-modal-content" @tap.stop>
        <view class="nlp-header">
          <text class="nlp-title">💬 一句话生成行程</text>
          <text class="nlp-close" @tap.stop="closeNlpModal">×</text>
        </view>
        <textarea
          class="nlp-input"
          v-model="nlpText"
          placeholder="我想下周去大理玩三天，预算3000，喜欢安静，不去热门景点..."
          placeholder-style="color: #999999;"
          @input="onNlpInput"
          maxlength="200"
          :focus="showNlpInput"
        />
        <view class="nlp-hint">
          <text>支持自然语言描述，系统将自动解析您的需求</text>
        </view>
        <button class="nlp-submit-btn" @tap.stop="parseNlpText">智能解析</button>
      </view>
    </view>

    <!-- 增强的加载动画 -->
    <view v-if="loading" class="loading-overlay">
      <view class="loading-content">
        <view class="loading-animation">
          <view class="earth-container">
            <text class="earth-icon">🌍</text>
          </view>
          <view class="airplane-container">
            <text class="airplane-icon">✈️</text>
          </view>
        </view>
        <view class="loading-steps">
          <view
            v-for="(step, index) in loadingSteps"
            :key="index"
            class="loading-step-item"
            :class="{ active: currentLoadingStep === index }"
          >
            <text class="loading-step-icon">{{ currentLoadingStep > index ? '✓' : '○' }}</text>
            <text class="loading-step-text">{{ step }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 选择器弹窗（保留原有功能） -->
    <view v-if="selectorVisible" class="selector-modal" @click="closeSelector">
      <view class="selector-content" @click.stop>
        <view class="selector-header">
          <text class="selector-title">{{ selectorTitle }}</text>
          <text class="selector-close" @click="closeSelector">×</text>
        </view>
        <view class="selector-tabs">
          <view
            class="selector-tab"
            :class="{ active: selectorTab === 'pending' }"
            @click="selectorTab = 'pending'"
          >
            <text>待选列表</text>
            <text v-if="getPendingCount() > 0" class="tab-badge">{{ getPendingCount() }}</text>
          </view>
          <view
            class="selector-tab"
            :class="{ active: selectorTab === 'favorite' }"
            @click="selectorTab = 'favorite'"
          >
            <text>我的收藏</text>
          </view>
          <view
            class="selector-tab"
            :class="{ active: selectorTab === 'all' }"
            @click="selectorTab = 'all'"
          >
            <text>全部</text>
          </view>
        </view>
        <scroll-view scroll-y class="selector-list">
          <view
            v-for="item in selectorList"
            :key="item.id"
            class="selector-item"
            :class="{ selected: isSelected(item.id) }"
            @click="toggleSelect(item.id)"
          >
            <text class="selector-item-name">{{ item.name }}</text>
            <text v-if="isSelected(item.id)" class="selector-check">✓</text>
          </view>
          <view v-if="selectorList.length === 0" class="selector-empty">
            <text>暂无数据</text>
          </view>
        </scroll-view>
        <view class="selector-footer">
          <button class="selector-btn" @click="confirmSelection">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { routeApi } from '@/api/route'
import { cityApi, tagApi, scenicSpotApi, foodApi } from '@/api/content'
import { useUserStore } from '@/store/user'
import { getCache, setCache, removeCache } from '@/utils/storage'

// API 响应类型定义
interface ApiResponse<T = any> {
  code: number
  msg?: string
  data: T
}

// 步骤定义
const steps = [
  { label: '目的地', key: 'destination' },
  { label: '时间与成员', key: 'timeAndCompanion' },
  { label: '偏好', key: 'preference' }
]

const currentStep = ref(0)
const showNlpInput = ref(false)
const nlpText = ref('')

// 城市相关
const cityList = ref<{ id: number; name: string; image?: string; desc?: string }[]>([])
const popularCities = ref<Array<{ id: number; name: string; image?: string; desc?: string }>>([])
const selectedCity = ref<{ id: number; name: string } | null>(null)
const destination = ref('')

// 日期相关
const startDate = ref<string>('')
const endDate = ref<string>('')
const minDate = ref<string>(new Date().toISOString().split('T')[0])
const dateTips = ref('')

// 成员相关
const selectedCompanion = ref<number>(1)
const companionList = ref([
  { id: 1, name: '独行', icon: '🚶' },
  { id: 2, name: '情侣', icon: '💑' },
  { id: 3, name: '家庭', icon: '👨‍👩‍👧' },
  { id: 4, name: '朋友', icon: '👥' },
  { id: 5, name: '亲子', icon: '👨‍👩‍👦' },
  { id: 6, name: '带老人', icon: '👴' },
])

// 偏好相关
const selectedTags = ref<number[]>([])
const tagList = ref<Array<{ id: number; name: string; color: string }>>([])
const relaxationValue = ref(50) // 0-100, 0=松弛, 100=紧凑
const budgetValue = ref(50) // 0-100, 0=经济, 100=奢华

// 快速标签
const quickTags = ref([
  { id: 1, name: '带娃出游', icon: '👶' },
  { id: 2, name: '深度摄影', icon: '📷' },
  { id: 3, name: '特种兵行程', icon: '⚡' },
  { id: 4, name: '休闲度假', icon: '🏖️' },
  { id: 5, name: '美食之旅', icon: '🍜' },
  { id: 6, name: '文化探索', icon: '🏛️' },
])
const selectedQuickTags = ref<number[]>([])

// 加载相关
const loading = ref(false)
const currentLoadingStep = ref(0)
const loadingSteps = ref([
  '正在分析您的需求...',
  '正在匹配最佳景点...',
  '正在优化交通路线...',
  '正在生成行程安排...',
  '即将完成...'
])

// 其他状态
const store = useUserStore()
const user = computed(() => store.state.profile)

// 每天的选择数据 - 新的数据结构，支持时间段分配
interface DaySelection {
  scenicIds: number[]
  foodIds: number[]
  // 景点分配到时间段：{ scenicId: { day: number, timeSlot: 'morning' | 'afternoon' | 'evening' | 'night' } }
  scenicTimeSlots: Record<number, { day: number, timeSlot: string }>
  // 美食分配到时间段：{ foodId: { day: number, timeSlot: 'breakfast' | 'lunch' | 'dinner' | 'snack' } }
  foodTimeSlots: Record<number, { day: number, timeSlot: string }>
}

const dailySelections = ref<DaySelection[]>([])

// 日期选择弹窗
const showDatePicker = ref(false)
const datePickerType = ref<'start' | 'end'>('start')
const datePickerValue = ref<number[]>([0, 0, 0]) // [年索引, 月索引, 日索引]
const tempSelectedDate = ref<string>('') // 临时选择的日期

// 生成年份列表（当前年份前后各10年）
const yearList = computed(() => {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let i = currentYear - 10; i <= currentYear + 10; i++) {
    years.push(i)
  }
  return years
})

// 生成月份列表
const monthList = computed(() => {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
})

// 生成日期列表（根据年月动态计算）
const dayList = computed(() => {
  const yearIndex = datePickerValue.value[0]
  const monthIndex = datePickerValue.value[1]
  const year = yearList.value[yearIndex]
  const month = monthList.value[monthIndex]
  
  // 计算该月的天数
  const daysInMonth = new Date(year, month, 0).getDate()
  const days: number[] = []
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }
  return days
})

// 景点和美食时间段分配
const showScenicScheduleModal = ref(false)
const showFoodScheduleModal = ref(false)
const currentScheduleItem = ref<{ id: number, name: string } | null>(null)

// 景点时间段选项
const scenicTimeSlots = [
  { value: 'morning', label: '上午', icon: '🌅' },
  { value: 'afternoon', label: '下午', icon: '☀️' },
  { value: 'evening', label: '傍晚', icon: '🌆' },
  { value: 'night', label: '晚上', icon: '🌙' },
]

// 美食时间段选项
const foodTimeSlots = [
  { value: 'breakfast', label: '早餐', icon: '🌅' },
  { value: 'lunch', label: '午餐', icon: '☀️' },
  { value: 'dinner', label: '晚餐', icon: '🌆' },
  { value: 'snack', label: '小吃', icon: '🍡' },
]

// 时间段分配表单
const scenicScheduleForm = ref({ day: 1, timeSlot: 'morning' })
const foodScheduleForm = ref({ day: 1, timeSlot: 'breakfast' })

// 存储所有景点和美食的时间段分配
const allScenicSchedules = ref<Record<number, { day: number, timeSlot: string }>>({})
const allFoodSchedules = ref<Record<number, { day: number, timeSlot: string }>>({})

// 选择器相关
const selectorVisible = ref(false)
const selectorTab = ref<'pending' | 'favorite' | 'all'>('pending')
const selectorType = ref<'scenic' | 'food'>('scenic')
const selectorDayIndex = ref(0)
const selectorList = ref<Array<{ id: number, name: string }>>([])
const selectorTempSelected = ref<number[]>([])

// 收藏列表缓存
const favoriteScenics = ref<Array<{ id: number, name: string }>>([])
const favoriteFoods = ref<Array<{ id: number, name: string }>>([])
const allScenics = ref<Array<{ id: number, name: string }>>([])
const allFoods = ref<Array<{ id: number, name: string }>>([])

// 待选列表
const pendingScenics = ref<Array<{ id: number, name: string }>>([])
const pendingFoods = ref<Array<{ id: number, name: string }>>([])

// 标签颜色预设
const tagColors = [
  '#3ba272', '#ff6b9d', '#ff9800', '#9c27b0',
  '#2196f3', '#f44336', '#00bcd4', '#ffc107',
]

// 计算属性
const travelDays = computed(() => {
  if (!startDate.value || !endDate.value) return 0
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  return diffDays
})

const relaxationText = computed(() => {
  if (relaxationValue.value < 30) return '非常轻松'
  if (relaxationValue.value < 60) return '适度安排'
  if (relaxationValue.value < 80) return '紧凑充实'
  return '极限挑战'
})

const budgetText = computed(() => {
  if (budgetValue.value < 30) return '经济实惠'
  if (budgetValue.value < 60) return '中等消费'
  if (budgetValue.value < 80) return '品质享受'
  return '奢华体验'
})

const canGoNext = computed(() => {
  switch (currentStep.value) {
    case 0:
      return selectedCity.value !== null || destination.value.trim() !== ''
    case 1:
      return startDate.value !== '' && endDate.value !== '' && selectedCompanion.value > 0
    case 2:
      return selectedTags.value.length > 0
    default:
      return false
  }
})

const selectorTitle = computed(() => {
  const dayText = `第${selectorDayIndex.value + 1}天`
  const typeText = selectorType.value === 'scenic' ? '景点' : '美食'
  return `${dayText} - 选择${typeText}`
})

// 方法
// 日期选择相关方法
const openDatePicker = (type: 'start' | 'end') => {
  datePickerType.value = type
  const currentDate = type === 'start' ? startDate.value : endDate.value
  const dateStr = currentDate || minDate.value
  
  // 解析当前日期，设置picker-view的初始值
  if (dateStr) {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    
    // 找到对应的索引
    const yearIndex = yearList.value.findIndex(y => y === year)
    const monthIndex = monthList.value.findIndex(m => m === month)
    const dayIndex = dayList.value.findIndex(d => d === day)
    
    datePickerValue.value = [
      yearIndex >= 0 ? yearIndex : 10, // 默认当前年份
      monthIndex >= 0 ? monthIndex : new Date().getMonth(),
      dayIndex >= 0 ? dayIndex : new Date().getDate() - 1
    ]
  } else {
    // 如果没有日期，使用当前日期
    const now = new Date()
    const yearIndex = yearList.value.findIndex(y => y === now.getFullYear())
    datePickerValue.value = [
      yearIndex >= 0 ? yearIndex : 10,
      now.getMonth(),
      now.getDate() - 1
    ]
  }
  
  showDatePicker.value = true
}

const closeDatePicker = () => {
  showDatePicker.value = false
  tempSelectedDate.value = ''
}

// picker-view的change事件
const onPickerViewChange = (e: any) => {
  const newValue = e.detail.value
  datePickerValue.value = newValue
  
  // 更新日期列表（因为月份或年份改变时，天数可能变化）
  const yearIndex = newValue[0]
  const monthIndex = newValue[1]
  const dayIndex = newValue[2]
  
  const year = yearList.value[yearIndex]
  const month = monthList.value[monthIndex]
  
  // 计算该月的最大天数
  const maxDays = new Date(year, month, 0).getDate()
  
  // 如果当前选择的日期超过了最大天数，调整为最大天数
  if (dayIndex >= maxDays) {
    datePickerValue.value[2] = maxDays - 1
  }
}

// 确认日期选择
const confirmDatePicker = () => {
  const yearIndex = datePickerValue.value[0]
  const monthIndex = datePickerValue.value[1]
  const dayIndex = datePickerValue.value[2]
  
  const year = yearList.value[yearIndex]
  const month = monthList.value[monthIndex]
  
  // 重新计算日期列表以确保获取正确的日期
  const maxDays = new Date(year, month, 0).getDate()
  const actualDayIndex = Math.min(dayIndex, maxDays - 1)
  const day = actualDayIndex + 1
  
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  
  onDatePickerChange({ detail: { value: dateStr } })
  closeDatePicker()
}

const goToStep = (index: number) => {
  if (index <= currentStep.value) {
    currentStep.value = index
  }
}

const nextStep = () => {
  if (!canGoNext.value) {
    uni.showToast({
      title: '请完成当前步骤',
      icon: 'none'
    })
    return
  }
  
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  } else {
    generateRoute()
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const selectCity = (city: { id: number; name: string }) => {
  selectedCity.value = city
  destination.value = city.name
}

const onDestinationInput = (e: any) => {
  destination.value = e.detail.value
  selectedCity.value = null
}

const onDatePickerChange = (e: any) => {
  const selectedDate = e.detail.value
  if (datePickerType.value === 'start') {
    if (!endDate.value || selectedDate <= endDate.value) {
      startDate.value = selectedDate
      updateDateTips()
      updateDailySelections()
    } else {
      uni.showToast({
        title: '开始日期不能晚于结束日期',
        icon: 'none'
      })
      return
    }
  } else {
    if (!startDate.value) {
      uni.showToast({
        title: '请先选择开始日期',
        icon: 'none'
      })
      return
    }
    if (selectedDate >= startDate.value) {
      endDate.value = selectedDate
      updateDateTips()
      updateDailySelections()
    } else {
      uni.showToast({
        title: '结束日期不能早于开始日期',
        icon: 'none'
      })
      return
    }
  }
  closeDatePicker()
}

const updateDateTips = () => {
  if (!startDate.value) {
    dateTips.value = ''
    return
  }
  
  const date = new Date(startDate.value)
  const month = date.getMonth() + 1
  
  // 简单的季节提示
  if (month >= 3 && month <= 5) {
    dateTips.value = '春季是旅游的好时节，气候宜人'
  } else if (month >= 6 && month <= 8) {
    dateTips.value = '夏季旅游，注意防暑降温'
  } else if (month >= 9 && month <= 11) {
    dateTips.value = '秋季风景优美，适合出行'
  } else {
    dateTips.value = '冬季旅游，注意保暖'
  }
}

const updateDailySelections = () => {
  const days = travelDays.value
  if (days > 0) {
    while (dailySelections.value.length < days) {
      dailySelections.value.push({ 
        scenicIds: [], 
        foodIds: [],
        scenicTimeSlots: {},
        foodTimeSlots: {}
      })
    }
    while (dailySelections.value.length > days) {
      dailySelections.value.pop()
    }
  }
}

// 景点时间段分配方法
const openScenicScheduleModal = (scenic: { id: number, name: string }) => {
  currentScheduleItem.value = scenic
  // 如果已有分配，恢复表单
  if (allScenicSchedules.value[scenic.id]) {
    scenicScheduleForm.value = { ...allScenicSchedules.value[scenic.id] }
  } else {
    scenicScheduleForm.value = { day: 1, timeSlot: 'morning' }
  }
  showScenicScheduleModal.value = true
}

const closeScenicScheduleModal = () => {
  showScenicScheduleModal.value = false
  currentScheduleItem.value = null
}

const confirmScenicSchedule = () => {
  if (!currentScheduleItem.value) return
  
  const scenicId = currentScheduleItem.value.id
  const schedule = {
    day: scenicScheduleForm.value.day,
    timeSlot: scenicScheduleForm.value.timeSlot
  }
  
  // 保存到allScenicSchedules（主要存储）
  allScenicSchedules.value[scenicId] = schedule
  
  // 更新dailySelections（同步存储，确保数据一致性）
  const dayIndex = scenicScheduleForm.value.day - 1
  if (dailySelections.value[dayIndex]) {
    if (!dailySelections.value[dayIndex].scenicIds.includes(scenicId)) {
      dailySelections.value[dayIndex].scenicIds.push(scenicId)
    }
    dailySelections.value[dayIndex].scenicTimeSlots[scenicId] = schedule
  }
  
  console.log('景点时间段分配:', {
    scenicId,
    schedule,
    allScenicSchedules: allScenicSchedules.value,
    dailySelections: dailySelections.value[dayIndex]
  })
  
  closeScenicScheduleModal()
  uni.showToast({
    title: '安排成功',
    icon: 'success'
  })
}

const removeScenicSchedule = (scenicId: number) => {
  if (allScenicSchedules.value[scenicId]) {
    const schedule = allScenicSchedules.value[scenicId]
    const dayIndex = schedule.day - 1
    if (dailySelections.value[dayIndex]) {
      const index = dailySelections.value[dayIndex].scenicIds.indexOf(scenicId)
      if (index > -1) {
        dailySelections.value[dayIndex].scenicIds.splice(index, 1)
      }
      delete dailySelections.value[dayIndex].scenicTimeSlots[scenicId]
    }
    delete allScenicSchedules.value[scenicId]
    uni.showToast({
      title: '已移除',
      icon: 'success'
    })
  }
}

const getScenicSchedule = (scenicId: number) => {
  return allScenicSchedules.value[scenicId] || null
}

const getScenicScheduleText = (scenicId: number) => {
  const schedule = allScenicSchedules.value[scenicId]
  if (!schedule) return ''
  const timeSlot = scenicTimeSlots.find(s => s.value === schedule.timeSlot)
  return `第${schedule.day}天 ${timeSlot?.label || schedule.timeSlot}`
}

// 美食时间段分配方法
const openFoodScheduleModal = (food: { id: number, name: string }) => {
  currentScheduleItem.value = food
  // 如果已有分配，恢复表单
  if (allFoodSchedules.value[food.id]) {
    foodScheduleForm.value = { ...allFoodSchedules.value[food.id] }
  } else {
    foodScheduleForm.value = { day: 1, timeSlot: 'breakfast' }
  }
  showFoodScheduleModal.value = true
}

const closeFoodScheduleModal = () => {
  showFoodScheduleModal.value = false
  currentScheduleItem.value = null
}

const confirmFoodSchedule = () => {
  if (!currentScheduleItem.value) return
  
  const foodId = currentScheduleItem.value.id
  const schedule = {
    day: foodScheduleForm.value.day,
    timeSlot: foodScheduleForm.value.timeSlot
  }
  
  // 保存到allFoodSchedules（主要存储）
  allFoodSchedules.value[foodId] = schedule
  
  // 更新dailySelections（同步存储，确保数据一致性）
  const dayIndex = foodScheduleForm.value.day - 1
  if (dailySelections.value[dayIndex]) {
    if (!dailySelections.value[dayIndex].foodIds.includes(foodId)) {
      dailySelections.value[dayIndex].foodIds.push(foodId)
    }
    dailySelections.value[dayIndex].foodTimeSlots[foodId] = schedule
  }
  
  console.log('美食时间段分配:', {
    foodId,
    schedule,
    allFoodSchedules: allFoodSchedules.value,
    dailySelections: dailySelections.value[dayIndex]
  })
  
  closeFoodScheduleModal()
  uni.showToast({
    title: '安排成功',
    icon: 'success'
  })
}

const removeFoodSchedule = (foodId: number) => {
  if (allFoodSchedules.value[foodId]) {
    const schedule = allFoodSchedules.value[foodId]
    const dayIndex = schedule.day - 1
    if (dailySelections.value[dayIndex]) {
      const index = dailySelections.value[dayIndex].foodIds.indexOf(foodId)
      if (index > -1) {
        dailySelections.value[dayIndex].foodIds.splice(index, 1)
      }
      delete dailySelections.value[dayIndex].foodTimeSlots[foodId]
    }
    delete allFoodSchedules.value[foodId]
    uni.showToast({
      title: '已移除',
      icon: 'success'
    })
  }
}

const getFoodSchedule = (foodId: number) => {
  return allFoodSchedules.value[foodId] || null
}

const getFoodScheduleText = (foodId: number) => {
  const schedule = allFoodSchedules.value[foodId]
  if (!schedule) return ''
  const timeSlot = foodTimeSlots.find(s => s.value === schedule.timeSlot)
  return `第${schedule.day}天 ${timeSlot?.label || schedule.timeSlot}`
}

const selectCompanion = (companionId: number) => {
  selectedCompanion.value = companionId
}

const toggleTag = (tagId: number) => {
  const index = selectedTags.value.indexOf(tagId)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tagId)
  }
}

const toggleQuickTag = (tagId: number) => {
  const index = selectedQuickTags.value.indexOf(tagId)
  if (index > -1) {
    selectedQuickTags.value.splice(index, 1)
  } else {
    selectedQuickTags.value.push(tagId)
  }
}

const onRelaxationChange = (e: any) => {
  relaxationValue.value = e.detail.value
}

const onBudgetChange = (e: any) => {
  budgetValue.value = e.detail.value
}

const onNlpInput = (e: any) => {
  nlpText.value = e.detail.value
}

const openNlpModal = () => {
  showNlpInput.value = true
  // 清空之前的输入
  nlpText.value = ''
}

const closeNlpModal = () => {
  showNlpInput.value = false
}

const parseNlpText = () => {
  if (!nlpText.value.trim()) {
    uni.showToast({
      title: '请输入您的需求',
      icon: 'none'
    })
    return
  }
  
  // 简单的NLP解析（实际应该调用后端API）
  const text = nlpText.value
  
  // 提取城市
  const cityMatch = text.match(/(去|到|前往)(.{1,10}?)(玩|旅游|旅行|游)/)
  if (cityMatch) {
    destination.value = cityMatch[2].trim()
  }
  
  // 提取天数
  const dayMatch = text.match(/(\d+)[日天]/)
  if (dayMatch) {
    const days = parseInt(dayMatch[1])
    const today = new Date()
    startDate.value = today.toISOString().split('T')[0]
    const end = new Date(today)
    end.setDate(today.getDate() + days - 1)
    endDate.value = end.toISOString().split('T')[0]
    updateDailySelections()
  }
  
  // 提取预算
  const budgetMatch = text.match(/预算(\d+)/)
  if (budgetMatch) {
    const budget = parseInt(budgetMatch[1])
    if (budget < 2000) budgetValue.value = 20
    else if (budget < 5000) budgetValue.value = 50
    else budgetValue.value = 80
  }
  
  // 提取偏好
  if (text.includes('安静') || text.includes('休闲')) {
    relaxationValue.value = 20
  } else if (text.includes('紧凑') || text.includes('特种兵')) {
    relaxationValue.value = 90
  }
  
  if (text.includes('带娃') || text.includes('亲子')) {
    selectedCompanion.value = 5
  } else if (text.includes('情侣')) {
    selectedCompanion.value = 2
  }
  
  showNlpInput.value = false
  uni.showToast({
    title: '解析完成',
    icon: 'success'
  })
  
  // 自动跳转到下一步
  setTimeout(() => {
    if (currentStep.value === 0 && destination.value) {
      nextStep()
    }
  }, 500)
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekday = weekdays[date.getDay()]
  return `${month}月${day}日(${weekday})`
}

const extractCityFromDestination = (dest: string): string => {
  const cleaned = dest.replace(/\d+[日天]游?/g, '').trim()
  return cleaned || dest
}

const findCityId = (cityName: string): number | null => {
  const city = cityList.value.find(c =>
    c.name.includes(cityName) || cityName.includes(c.name)
  )
  return city ? city.id : null
}

const generateRoute = async () => {
  if (!canGoNext.value) {
    uni.showToast({
      title: '请完成所有必填项',
      icon: 'none',
    })
    return
  }

  uni.hideLoading()
  loading.value = true
  currentLoadingStep.value = 0

  // 模拟加载步骤
  const stepInterval = setInterval(() => {
    if (currentLoadingStep.value < loadingSteps.value.length - 1) {
      currentLoadingStep.value++
    } else {
      clearInterval(stepInterval)
    }
  }, 1500)

  try {
    const cityName = extractCityFromDestination(destination.value)
    let cityId = selectedCity.value?.id || findCityId(cityName)

    if (!cityId && cityList.value.length > 0) {
      cityId = cityList.value[0].id
    }

    if (!cityId) {
      uni.showToast({
        title: '未找到对应城市，请检查目的地输入',
        icon: 'none',
        duration: 2000,
      })
      loading.value = false
      clearInterval(stepInterval)
      return
    }

    let selectedDays = travelDays.value
    if (selectedDays === 0) {
      selectedDays = 3
    }

    if (!startDate.value || !endDate.value) {
      uni.showToast({
        title: '请选择游玩时间',
        icon: 'none',
      })
      loading.value = false
      clearInterval(stepInterval)
      return
    }

    const companion = companionList.value.find(c => c.id === selectedCompanion.value)
    const suitablePeople = companion ? companion.name : '独行'

    // 构建包含时间段信息的dailySelections数据
    const dailySelectionsData = dailySelections.value.map((day, index) => {
      const dayNum = index + 1
      
      // 构建景点的时间段分配
      const scenicTimeSlots: Array<{ scenicId: number, timeSlot: string }> = []
      
      // 优先从allScenicSchedules中获取（这是主要存储）
      if (allScenicSchedules.value) {
        Object.keys(allScenicSchedules.value).forEach(scenicIdStr => {
          const scenicId = parseInt(scenicIdStr)
          const schedule = allScenicSchedules.value[scenicId]
          // 如果这个景点被分配到了当前这一天，就添加到时间段列表中
          if (schedule && schedule.day === dayNum) {
            scenicTimeSlots.push({
              scenicId: scenicId,
              timeSlot: schedule.timeSlot
            })
          }
        })
      }
      
      // 同时也从day.scenicTimeSlots中获取（作为备用，确保数据完整性）
      if (day.scenicTimeSlots) {
        Object.keys(day.scenicTimeSlots).forEach(scenicIdStr => {
          const scenicId = parseInt(scenicIdStr)
          const schedule = day.scenicTimeSlots[scenicId]
          // 检查是否已经添加过，避免重复
          if (schedule && schedule.day === dayNum && !scenicTimeSlots.find(s => s.scenicId === scenicId)) {
            scenicTimeSlots.push({
              scenicId: scenicId,
              timeSlot: schedule.timeSlot
            })
          }
        })
      }
      
      // 构建美食的时间段分配
      const foodTimeSlots: Array<{ foodId: number, timeSlot: string }> = []
      
      // 优先从allFoodSchedules中获取（这是主要存储）
      if (allFoodSchedules.value) {
        Object.keys(allFoodSchedules.value).forEach(foodIdStr => {
          const foodId = parseInt(foodIdStr)
          const schedule = allFoodSchedules.value[foodId]
          // 如果这个美食被分配到了当前这一天，就添加到时间段列表中
          if (schedule && schedule.day === dayNum) {
            foodTimeSlots.push({
              foodId: foodId,
              timeSlot: schedule.timeSlot
            })
          }
        })
      }
      
      // 同时也从day.foodTimeSlots中获取（作为备用，确保数据完整性）
      if (day.foodTimeSlots) {
        Object.keys(day.foodTimeSlots).forEach(foodIdStr => {
          const foodId = parseInt(foodIdStr)
          const schedule = day.foodTimeSlots[foodId]
          // 检查是否已经添加过，避免重复
          if (schedule && schedule.day === dayNum && !foodTimeSlots.find(f => f.foodId === foodId)) {
            foodTimeSlots.push({
              foodId: foodId,
              timeSlot: schedule.timeSlot
            })
          }
        })
      }
      
      const dayData = {
        day: dayNum,
        scenicIds: day.scenicIds || [],
        foodIds: day.foodIds || [],
        scenicTimeSlots: scenicTimeSlots.length > 0 ? scenicTimeSlots : undefined,
        foodTimeSlots: foodTimeSlots.length > 0 ? foodTimeSlots : undefined,
      }
      
      // 调试输出
      if (scenicTimeSlots.length > 0 || foodTimeSlots.length > 0) {
        console.log(`第${dayNum}天的时间段分配:`, {
          scenicTimeSlots,
          foodTimeSlots
        })
      }
      
      return dayData
    })
    
    // 调试输出，检查时间段信息
    console.log('提交的dailySelections数据:', JSON.stringify(dailySelectionsData, null, 2))
    console.log('allScenicSchedules:', allScenicSchedules.value)
    console.log('allFoodSchedules:', allFoodSchedules.value)

    const res = await routeApi.generate({
      cityId: cityId,
      days: selectedDays,
      tagIds: selectedTags.value,
      suitablePeople: suitablePeople,
      useAi: true,
      dailySelections: dailySelectionsData,
      startDate: startDate.value,
      endDate: endDate.value,
    })

    clearInterval(stepInterval)
    currentLoadingStep.value = loadingSteps.value.length - 1

    if (res.statusCode === 200 && res.data.code === 200) {
      const routeId = res.data.data.routeId

      if (!routeId) {
        uni.showToast({
          title: '路线ID获取失败',
          icon: 'none'
        })
        loading.value = false
        return
      }

      loading.value = false

      await new Promise(resolve => setTimeout(resolve, 800))

      const detailUrl = `/pages/itinerary/itinerary-detail?id=${encodeURIComponent(routeId)}`
      console.log('[generateRoute] 准备跳转到详情页:', detailUrl)

      uni.navigateTo({
        url: detailUrl,
        success: () => {
          console.log('[generateRoute] 跳转成功')
        },
        fail: (err) => {
          console.error('[generateRoute] navigateTo 失败:', err)
          uni.redirectTo({
            url: detailUrl,
            fail: (redirectErr) => {
              console.error('[generateRoute] redirectTo 也失败:', redirectErr)
              uni.showToast({
                title: '页面跳转失败，请手动刷新',
                icon: 'none',
                duration: 3000
              })
            }
          })
        }
      })
    } else {
      uni.showToast({
        title: res.data.msg || '生成失败',
        icon: 'none',
      })
      loading.value = false
    }
  } catch (error) {
    uni.showToast({
      title: '网络错误',
      icon: 'none',
    })
    loading.value = false
  }
}

const loadCities = async () => {
  try {
    const res = await cityApi.list()
    const response = res.data as ApiResponse<any[]>
    if (res.statusCode === 200 && response.code === 200) {
      const cities = response.data || []
      cityList.value = cities.map((city: any) => ({
        id: city.id,
        name: city.cityName || city.name,
        image: city.imageUrl,
        desc: city.description,
      }))
      
      // 取前6个作为热门城市
      popularCities.value = cityList.value.slice(0, 6)
    }
  } catch (error) {
    console.error('加载城市列表失败', error)
  }
}

const loadTags = async () => {
  try {
    const res = await tagApi.list()
    const response = res.data as ApiResponse<any[]>
    if (res.statusCode === 200 && response.code === 200) {
      const tags = response.data || []
      tagList.value = tags.map((tag: any, index: number) => ({
        id: tag.id,
        name: tag.tagName || tag.name,
        color: tagColors[index % tagColors.length],
      }))
    }
  } catch (error) {
    console.error('加载标签列表失败', error)
    tagList.value = []
  }
}

// 选择器相关方法（保留原有功能）
const openDaySelector = async (dayIndex: number, type: 'scenic' | 'food') => {
  selectorDayIndex.value = dayIndex
  selectorType.value = type
  loadPendingAdditions()
  const hasPending = type === 'scenic' ? pendingScenics.value.length > 0 : pendingFoods.value.length > 0
  selectorTab.value = hasPending ? 'pending' : (user.value ? 'favorite' : 'all')
  selectorTempSelected.value = [...(type === 'scenic'
    ? dailySelections.value[dayIndex].scenicIds
    : dailySelections.value[dayIndex].foodIds)]
  await loadSelectorList()
  selectorVisible.value = true
}

const getPendingCount = () => {
  if (selectorType.value === 'scenic') {
    return pendingScenics.value.length
  } else {
    return pendingFoods.value.length
  }
}

const loadSelectorList = async () => {
  try {
    if (selectorTab.value === 'pending') {
      if (selectorType.value === 'scenic') {
        selectorList.value = pendingScenics.value
      } else {
        selectorList.value = pendingFoods.value
      }
    } else if (selectorTab.value === 'favorite') {
      if (selectorType.value === 'scenic') {
        if (favoriteScenics.value.length === 0) {
          const res = await scenicSpotApi.getMyFavorites(user.value!.id)
          if (res.statusCode === 200 && res.data.code === 200) {
            favoriteScenics.value = (res.data.data?.list || []).map((item: any) => ({
              id: item.id,
              name: item.name,
            }))
          }
        }
        selectorList.value = favoriteScenics.value
      } else {
        if (favoriteFoods.value.length === 0) {
          const res = await foodApi.getMyFavorites(user.value!.id)
          if (res.statusCode === 200 && res.data.code === 200) {
            favoriteFoods.value = (res.data.data?.list || []).map((item: any) => ({
              id: item.id,
              name: item.name,
            }))
          }
        }
        selectorList.value = favoriteFoods.value
      }
    } else {
      const cityName = extractCityFromDestination(destination.value)
      const cityId = selectedCity.value?.id || findCityId(cityName)

      if (selectorType.value === 'scenic') {
        if (allScenics.value.length === 0 || cityId) {
          const res = await scenicSpotApi.list({ cityId: cityId || undefined, pageSize: 100 })
          if (res.statusCode === 200 && res.data.code === 200) {
            allScenics.value = (res.data.data?.list || []).map((item: any) => ({
              id: item.id,
              name: item.name,
            }))
          }
        }
        selectorList.value = allScenics.value
      } else {
        if (allFoods.value.length === 0 || cityId) {
          const res = await foodApi.list({ cityId: cityId || undefined, pageSize: 100 })
          if (res.statusCode === 200 && res.data.code === 200) {
            allFoods.value = (res.data.data?.list || []).map((item: any) => ({
              id: item.id,
              name: item.name,
            }))
          }
        }
        selectorList.value = allFoods.value
      }
    }
  } catch (error) {
    console.error('加载选择器列表失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

watch(selectorTab, () => {
  loadSelectorList()
})

const isSelected = (id: number) => {
  return selectorTempSelected.value.includes(id)
}

const toggleSelect = (id: number) => {
  const index = selectorTempSelected.value.indexOf(id)
  if (index > -1) {
    selectorTempSelected.value.splice(index, 1)
  } else {
    selectorTempSelected.value.push(id)
  }
}

const confirmSelection = () => {
  if (selectorType.value === 'scenic') {
    dailySelections.value[selectorDayIndex.value].scenicIds = [...selectorTempSelected.value]
  } else {
    dailySelections.value[selectorDayIndex.value].foodIds = [...selectorTempSelected.value]
  }
  closeSelector()
  const count = selectorTempSelected.value.length
  if (count > 0) {
    uni.showToast({
      title: `已添加${count}项到第${selectorDayIndex.value + 1}天`,
      icon: 'success',
      duration: 2000
    })
  }
}

const closeSelector = () => {
  selectorVisible.value = false
  selectorTempSelected.value = []
}

const removeScenic = (dayIndex: number, scenicId: number) => {
  const index = dailySelections.value[dayIndex].scenicIds.indexOf(scenicId)
  if (index > -1) {
    dailySelections.value[dayIndex].scenicIds.splice(index, 1)
  }
}

const removeFood = (dayIndex: number, foodId: number) => {
  const index = dailySelections.value[dayIndex].foodIds.indexOf(foodId)
  if (index > -1) {
    dailySelections.value[dayIndex].foodIds.splice(index, 1)
  }
}

const getScenicName = (id: number) => {
  const scenic = [...pendingScenics.value, ...favoriteScenics.value, ...allScenics.value].find(s => s.id === id)
  return scenic?.name || `景点${id}`
}

const getFoodName = (id: number) => {
  const food = [...pendingFoods.value, ...favoriteFoods.value, ...allFoods.value].find(f => f.id === id)
  return food?.name || `美食${id}`
}

const loadPendingAdditions = () => {
  const pendingAdditions = getCache<Array<{ type: 'scenic' | 'food', id: number, name: string }>>('route_pending_additions')
  pendingScenics.value = []
  pendingFoods.value = []
  if (pendingAdditions && pendingAdditions.length > 0) {
    pendingAdditions.forEach((item) => {
      if (item.type === 'scenic') {
        if (!pendingScenics.value.find(s => s.id === item.id)) {
          pendingScenics.value.push({ id: item.id, name: item.name })
          if (!allScenics.value.find(s => s.id === item.id)) {
            allScenics.value.push({ id: item.id, name: item.name })
          }
        }
      } else if (item.type === 'food') {
        if (!pendingFoods.value.find(f => f.id === item.id)) {
          pendingFoods.value.push({ id: item.id, name: item.name })
          if (!allFoods.value.find(f => f.id === item.id)) {
            allFoods.value.push({ id: item.id, name: item.name })
          }
        }
      }
    })
  }
}

onMounted(() => {
  loadCities()
  loadTags()
  loadPendingAdditions()
})

onShow(() => {
  loadPendingAdditions()
})
</script>

<style scoped>
/* 基础样式 */
.plan-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
  position: relative;
}

.page-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, #f0f8f5 0%, #f7f8fa 100%);
  z-index: 0;
}

.plan-scroll {
  flex: 1;
  position: relative;
  z-index: 1;
  padding-top: 180rpx;
}

/* 步骤指示器 */
.step-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #ffffff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.step-indicator-header {
  padding: 20rpx 32rpx 12rpx;
  text-align: center;
  border-bottom: 1rpx solid #f0f0f0;
}

.step-indicator-title {
  font-size: 26rpx;
  color: #3ba272;
  font-weight: 600;
}

.step-indicator-content {
  padding: 16rpx 32rpx 24rpx;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  flex: 1;
  cursor: pointer;
  transition: all 0.2s;
}

.step-item:active {
  opacity: 0.7;
}

.step-circle {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background-color: #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.step-item.active .step-circle {
  background-color: #3ba272;
  transform: scale(1.1);
}

.step-item.completed .step-circle {
  background-color: #3ba272;
}

.step-number {
  font-size: 28rpx;
  color: #999999;
  font-weight: 600;
}

.step-item.active .step-number {
  color: #ffffff;
}

.step-check {
  font-size: 32rpx;
  color: #ffffff;
  font-weight: 600;
}

.step-label {
  font-size: 22rpx;
  color: #999999;
}

.step-item.active .step-label {
  color: #3ba272;
  font-weight: 600;
}

.step-item.completed .step-label {
  color: #3ba272;
}

/* 自然语言输入弹窗 */
.nlp-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.nlp-modal-content {
  width: 85%;
  max-width: 600rpx;
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease-out;
  position: relative;
  z-index: 3001;
}

@keyframes slideUp {
  from {
    transform: translateY(100rpx);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.nlp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.nlp-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.nlp-close {
  font-size: 48rpx;
  color: #999999;
  line-height: 1;
}

.nlp-input {
  width: 100%;
  min-height: 200rpx;
  padding: 24rpx;
  background-color: #f7f8fa;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333333;
  line-height: 1.6;
  box-sizing: border-box;
  margin-bottom: 16rpx;
}

.nlp-hint {
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 24rpx;
}

.nlp-submit-btn {
  width: 100%;
  padding: 24rpx;
  background: linear-gradient(135deg, #3ba272, #6fd3a5);
  color: #ffffff;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
  border: none;
}

/* 底部自然语言输入触发按钮 */
.nlp-trigger-section {
  margin-top: 48rpx;
  padding: 24rpx 0;
}

.nlp-trigger-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  background: linear-gradient(135deg, #f7f8fa 0%, #ffffff 100%);
  border-radius: 16rpx;
  border: 2rpx dashed #3ba272;
  transition: all 0.3s;
}

.nlp-trigger-btn:active {
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
  transform: scale(0.98);
}

.nlp-trigger-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.nlp-trigger-text {
  flex: 1;
  font-size: 28rpx;
  color: #3ba272;
  font-weight: 500;
}

.nlp-trigger-arrow {
  font-size: 32rpx;
  color: #3ba272;
  font-weight: 300;
}

/* 快速标签 */
.quick-tags-section {
  margin-top: 48rpx;
  margin-bottom: 24rpx;
}

.quick-tags-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.quick-tags-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.quick-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.quick-tag-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 24rpx;
  background-color: #ffffff;
  border-radius: 999rpx;
  border: 2rpx solid #e5e5e5;
  transition: all 0.2s;
}

.quick-tag-item:active {
  transform: scale(0.95);
}

.quick-tag-item.active {
  background-color: #3ba272;
  border-color: #3ba272;
  box-shadow: 0 4rpx 12rpx rgba(59, 162, 114, 0.3);
}

.quick-tag-icon {
  font-size: 32rpx;
}

.quick-tag-text {
  font-size: 26rpx;
  color: #666666;
}

.quick-tag-item.active .quick-tag-text {
  color: #ffffff;
}

/* 步骤内容 */
.step-content {
  padding: 24rpx 24rpx 32rpx;
  min-height: calc(100vh - 200rpx);
}

.step-header {
  margin-bottom: 32rpx;
  text-align: center;
}

.step-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #333333;
  margin-bottom: 12rpx;
}

.step-subtitle {
  display: block;
  font-size: 26rpx;
  color: #999999;
}

/* 城市卡片 */
.city-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
  margin-bottom: 32rpx;
}

.city-card {
  position: relative;
  height: 180rpx;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.city-card.active {
  transform: scale(1.02);
  box-shadow: 0 8rpx 24rpx rgba(59, 162, 114, 0.4);
  border: 4rpx solid #3ba272;
}

.city-card:active {
  transform: scale(0.98);
}

.city-card-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
}

.city-card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.6) 100%);
}

.city-card-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12rpx 6rpx;
  z-index: 1;
  overflow: hidden;
}

.city-name {
  display: block;
  font-size: 24rpx;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 4rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.city-desc {
  display: block;
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.city-check-icon {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 36rpx;
  height: 36rpx;
  background-color: #3ba272;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #ffffff;
  font-weight: 600;
  z-index: 2;
  box-shadow: 0 4rpx 12rpx rgba(59, 162, 114, 0.4);
}

/* 自定义目的地 */
.custom-destination {
  margin-top: 32rpx;
  width: 100%;
  box-sizing: border-box;
}

.custom-label {
  display: block;
  font-size: 26rpx;
  color: #666666;
  margin-bottom: 16rpx;
}

.destination-input {
  width: 100%;
  padding: 28rpx 24rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 500;
  color: #333333;
  border: 2rpx solid #e5e5e5;
  transition: all 0.2s;
  box-sizing: border-box;
  line-height: 1.5;
  min-height: 88rpx;
  display: block;
  word-wrap: break-word;
  word-break: break-all;
  overflow: visible;
  text-overflow: clip;
}

.destination-input:focus {
  border-color: #3ba272;
}

/* 实时预测反馈 */
.prediction-feedback {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 24rpx;
  padding: 20rpx;
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
  border-radius: 16rpx;
  border-left: 4rpx solid #3ba272;
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.prediction-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.prediction-text {
  font-size: 24rpx;
  color: #2e7d32;
  line-height: 1.5;
  flex: 1;
}

/* 日期选择 */
.date-picker-container {
  width: 100%;
}

.date-input-wrapper {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 28rpx 24rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  border: 2rpx solid #e5e5e5;
  transition: all 0.2s;
}

.date-input-wrapper:active {
  border-color: #3ba272;
  background-color: #f7f8fa;
}

.date-picker-item {
  flex: 1;
}

.date-input {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.date-input-clickable {
  cursor: pointer;
  transition: all 0.2s;
}

.date-input-clickable:active {
  opacity: 0.7;
}

.date-label {
  font-size: 22rpx;
  color: #999999;
}

.date-value {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}

.date-value.placeholder {
  color: #999999;
  font-weight: normal;
}

.date-separator {
  font-size: 24rpx;
  color: #999999;
  margin: 0 8rpx;
  padding-top: 24rpx;
}

.days-display {
  margin-top: 20rpx;
  padding: 16rpx 24rpx;
  background-color: #e8f5e9;
  border-radius: 12rpx;
  display: inline-block;
}

.days-text {
  font-size: 26rpx;
  color: #2e7d32;
  font-weight: 600;
}

.date-tips {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 20rpx;
  padding: 16rpx 20rpx;
  background-color: #fff3e0;
  border-radius: 12rpx;
  border-left: 4rpx solid #ff9800;
  animation: fadeInUp 0.3s ease-out;
}

.date-tips-icon {
  font-size: 28rpx;
  flex-shrink: 0;
}

.date-tips-text {
  font-size: 24rpx;
  color: #e65100;
  line-height: 1.5;
  flex: 1;
}

/* 成员选择 */
.companion-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.companion-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 32rpx 24rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
  border: 2rpx solid #e5e5e5;
  transition: all 0.3s;
}

.companion-card:active {
  transform: scale(0.95);
}

.companion-card.active {
  background-color: #3ba272;
  border-color: #3ba272;
  box-shadow: 0 8rpx 24rpx rgba(59, 162, 114, 0.3);
  transform: translateY(-4rpx);
}

.companion-icon-wrapper {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f7f8fa;
  border-radius: 50%;
  transition: all 0.3s;
}

.companion-card.active .companion-icon-wrapper {
  background-color: rgba(255, 255, 255, 0.2);
}

.companion-icon {
  font-size: 48rpx;
}

.companion-name {
  font-size: 26rpx;
  color: #333333;
  font-weight: 500;
}

.companion-card.active .companion-name {
  color: #ffffff;
}

/* 偏好设置 */
.preference-tags-section {
  margin-bottom: 48rpx;
}

.section-label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 20rpx;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag-item {
  padding: 18rpx 32rpx;
  background-color: #f7f8fa;
  border-radius: 999rpx;
  font-size: 26rpx;
  color: #666666;
  border: 2rpx solid #e5e5e5;
  transition: all 0.2s;
  line-height: 1;
}

.tag-item:active {
  transform: scale(0.95);
}

.tag-item.active {
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
  transform: translateY(-2rpx);
}

/* 滑块样式 */
.slider-section {
  margin-bottom: 48rpx;
  padding: 32rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.slider-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.slider-value {
  font-size: 26rpx;
  color: #3ba272;
  font-weight: 600;
  padding: 8rpx 16rpx;
  background-color: #e8f5e9;
  border-radius: 16rpx;
}

.slider-container {
  width: 100%;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.slider-left,
.slider-right {
  font-size: 24rpx;
  color: #999999;
}

.preference-slider {
  width: 100%;
  margin: 0;
}

/* 导航按钮 */
.step-navigation {
  display: flex;
  gap: 20rpx;
  padding: 32rpx 24rpx;
  background-color: #ffffff;
  border-top: 1rpx solid #f0f0f0;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.nav-btn {
  flex: 1;
  padding: 28rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
  transition: all 0.3s;
}

.prev-btn {
  background-color: #f7f8fa;
  color: #666666;
}

.prev-btn:active {
  background-color: #e5e5e5;
}

.next-btn {
  background: linear-gradient(135deg, #3ba272 0%, #6fd3a5 100%);
  color: #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(59, 162, 114, 0.3);
}

.next-btn:active:not(.disabled) {
  transform: translateY(2rpx);
  box-shadow: 0 4rpx 16rpx rgba(59, 162, 114, 0.3);
}

.next-btn.disabled {
  background: #cccccc;
  box-shadow: none;
  opacity: 0.6;
}

/* 增强的加载动画 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-content {
  background-color: #ffffff;
  border-radius: 32rpx;
  padding: 60rpx 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.3);
  max-width: 80%;
}

.loading-animation {
  position: relative;
  width: 300rpx;
  height: 300rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.earth-container {
  position: absolute;
  width: 200rpx;
  height: 200rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: rotateEarth 3s linear infinite;
}

.earth-icon {
  font-size: 200rpx;
  line-height: 1;
}

@keyframes rotateEarth {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.airplane-container {
  position: absolute;
  width: 300rpx;
  height: 300rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: flyAround 4s ease-in-out infinite;
}

.airplane-icon {
  font-size: 80rpx;
  line-height: 1;
  transform-origin: center;
}

@keyframes flyAround {
  0% {
    transform: translateX(-120rpx) translateY(-120rpx) rotate(-45deg);
  }
  25% {
    transform: translateX(120rpx) translateY(-120rpx) rotate(45deg);
  }
  50% {
    transform: translateX(120rpx) translateY(120rpx) rotate(135deg);
  }
  75% {
    transform: translateX(-120rpx) translateY(120rpx) rotate(225deg);
  }
  100% {
    transform: translateX(-120rpx) translateY(-120rpx) rotate(315deg);
  }
}

.loading-steps {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  width: 100%;
  min-width: 400rpx;
}

.loading-step-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 12rpx 0;
  opacity: 0.4;
  transition: all 0.3s;
}

.loading-step-item.active {
  opacity: 1;
}

.loading-step-icon {
  font-size: 24rpx;
  color: #3ba272;
  font-weight: 600;
  width: 32rpx;
  text-align: center;
}

.loading-step-item.active .loading-step-icon {
  color: #3ba272;
  font-size: 28rpx;
}

.loading-step-text {
  font-size: 26rpx;
  color: #333333;
  flex: 1;
}

.loading-step-item.active .loading-step-text {
  font-weight: 600;
  color: #3ba272;
}

/* 选择器弹窗 */
.selector-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.selector-content {
  width: 90%;
  max-width: 600rpx;
  max-height: 80vh;
  background-color: #ffffff;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.selector-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.selector-close {
  font-size: 48rpx;
  color: #999999;
  line-height: 1;
}

.selector-tabs {
  display: flex;
  border-bottom: 1rpx solid #f0f0f0;
}

.selector-tab {
  flex: 1;
  padding: 24rpx;
  text-align: center;
  font-size: 28rpx;
  color: #666666;
  border-bottom: 4rpx solid transparent;
  position: relative;
}

.selector-tab.active {
  color: #3ba272;
  border-bottom-color: #3ba272;
}

.selector-list {
  flex: 1;
  max-height: 60vh;
  padding: 16rpx;
}

.selector-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background-color: #f7f8fa;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s;
}

.selector-item.selected {
  background-color: #e8f5e9;
  border-color: #3ba272;
}

.selector-item-name {
  font-size: 28rpx;
  color: #333333;
  flex: 1;
}

.selector-check {
  font-size: 32rpx;
  color: #3ba272;
  font-weight: 600;
}

.selector-empty {
  padding: 80rpx 32rpx;
  text-align: center;
  color: #999999;
  font-size: 28rpx;
}

.selector-footer {
  padding: 24rpx;
  border-top: 1rpx solid #f0f0f0;
}

.selector-btn {
  width: 100%;
  padding: 24rpx;
  background: linear-gradient(135deg, #3ba272, #6fd3a5);
  color: #ffffff;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
  border: none;
}

.tab-badge {
  display: inline-block;
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  background-color: #ff5722;
  color: #ffffff;
  border-radius: 16rpx;
  font-size: 20rpx;
  line-height: 32rpx;
  text-align: center;
  margin-left: 8rpx;
}

/* 日期选择弹窗 */
.date-picker-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.date-picker-modal-content {
  width: 85%;
  max-width: 600rpx;
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.2);
}

.date-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  background-color: #f5f5f5;
  border-radius: 24rpx 24rpx 0 0;
  margin: -32rpx -32rpx 0 -32rpx;
}

.date-picker-cancel {
  font-size: 28rpx;
  color: #666666;
  padding: 8rpx 16rpx;
}

.date-picker-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  flex: 1;
  text-align: center;
}

.date-picker-confirm {
  font-size: 28rpx;
  color: #3ba272;
  font-weight: 600;
  padding: 8rpx 16rpx;
}

.date-picker-body {
  padding: 32rpx 0;
  height: 400rpx;
}

.date-picker-view {
  width: 100%;
  height: 100%;
}

.picker-view-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80rpx;
  font-size: 32rpx;
  color: #333333;
}

/* 成员选择区域 */
.companion-section {
  margin-top: 48rpx;
}

/* 景点和美食时间段分配 */
.item-schedule-section {
  margin-top: 48rpx;
  padding: 32rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-hint {
  display: block;
  font-size: 24rpx;
  color: #999999;
  margin-top: 8rpx;
  margin-bottom: 24rpx;
  line-height: 1.5;
}

.schedule-items {
  margin-top: 32rpx;
}

.schedule-items-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 20rpx;
}

.schedule-item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background-color: #f7f8fa;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  border: 2rpx solid #e5e5e5;
}

.schedule-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.schedule-item-name {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}

.schedule-item-time {
  font-size: 24rpx;
  color: #3ba272;
}

.schedule-item-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.schedule-btn {
  padding: 12rpx 24rpx;
  background-color: #3ba272;
  color: #ffffff;
  border-radius: 12rpx;
  font-size: 24rpx;
  border: none;
}

.schedule-remove {
  font-size: 24rpx;
  color: #ff5722;
  text-decoration: underline;
}

/* 时间段分配弹窗 */
.schedule-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.schedule-modal-content {
  width: 85%;
  max-width: 600rpx;
  max-height: 80vh;
  background-color: #ffffff;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.schedule-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.schedule-modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.schedule-modal-close {
  font-size: 48rpx;
  color: #999999;
  line-height: 1;
}

.schedule-modal-body {
  flex: 1;
  padding: 32rpx;
  overflow-y: auto;
}

.schedule-item-name-large {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 32rpx;
  text-align: center;
}

.schedule-day-selector,
.schedule-time-selector {
  margin-bottom: 32rpx;
}

.schedule-label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 20rpx;
}

.schedule-day-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.schedule-day-option {
  padding: 16rpx 24rpx;
  background-color: #f7f8fa;
  border-radius: 12rpx;
  border: 2rpx solid #e5e5e5;
  font-size: 26rpx;
  color: #666666;
  transition: all 0.2s;
}

.schedule-day-option.active {
  background-color: #3ba272;
  border-color: #3ba272;
  color: #ffffff;
}

.schedule-time-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.schedule-time-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 24rpx;
  background-color: #f7f8fa;
  border-radius: 16rpx;
  border: 2rpx solid #e5e5e5;
  transition: all 0.2s;
}

.schedule-time-option.active {
  background-color: #3ba272;
  border-color: #3ba272;
}

.schedule-time-icon {
  font-size: 40rpx;
}

.schedule-time-text {
  font-size: 26rpx;
  color: #666666;
}

.schedule-time-option.active .schedule-time-text {
  color: #ffffff;
}

.schedule-modal-footer {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #f0f0f0;
}

.schedule-cancel-btn,
.schedule-confirm-btn {
  flex: 1;
  padding: 24rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
  border: none;
}

.schedule-cancel-btn {
  background-color: #f7f8fa;
  color: #666666;
}

.schedule-confirm-btn {
  background: linear-gradient(135deg, #3ba272, #6fd3a5);
  color: #ffffff;
}
</style>