<template>
  <div class="dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">数据总览</h1>
      <p class="page-desc">智能旅游系统运营仪表盘 - 实时监控平台运营数据与趋势</p>
    </div>

    <!-- 系统活跃度总览 -->
    <div class="activity-overview" v-if="!kpiCards[0].loading">
      <el-card class="activity-card">
        <div class="activity-content">
          <div class="activity-label">系统活跃度</div>
          <div class="activity-status" :class="activityStatusClass">
            <el-icon class="activity-icon">
              <component :is="activityIcon" />
            </el-icon>
            <span class="activity-text">{{ activityStatusText }}</span>
          </div>
          <div class="activity-desc">{{ activityDesc }}</div>
        </div>
      </el-card>
    </div>

    <!-- 1️⃣ 核心指标区（KPI区） -->
    <div class="kpi-section">
      <div class="section-title">核心运营指标</div>
      <el-row :gutter="20" class="kpi-cards">
        <el-col :span="6" v-for="kpi in kpiCards" :key="kpi.key">
          <el-card class="kpi-card" :class="{ loading: kpi.loading }">
            <div class="kpi-content">
              <div class="kpi-header">
                <el-icon class="kpi-icon" :class="kpi.iconClass">
                  <component :is="kpi.icon" />
                </el-icon>
                <span class="kpi-label">{{ kpi.label }}</span>
              </div>
              <div class="kpi-value">
                <span v-if="kpi.loading">加载中...</span>
                <span v-else>{{ formatNumber(kpi.value) }}</span>
              </div>
              <div class="kpi-trend" v-if="!kpi.loading && kpi.trend !== null">
                <span class="trend-text" :class="kpi.trendClass">
                  <el-icon class="trend-icon">
                    <component :is="kpi.trendIcon" />
                  </el-icon>
                  {{ kpi.trendText }}
                </span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 增长亮点洞察 -->
    <div class="insight-section" v-if="growthInsights.length > 0">
      <el-card class="insight-card">
        <template #header>
          <div class="insight-header">
            <el-icon class="insight-icon"><ArrowUp /></el-icon>
            <span class="insight-title">增长亮点</span>
          </div>
        </template>
        <div class="insight-list">
          <div v-for="(insight, index) in growthInsights" :key="index" class="insight-item">
            <el-icon class="insight-item-icon" :class="insight.class">
              <component :is="insight.icon" />
            </el-icon>
            <span class="insight-text">{{ insight.text }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 2️⃣ 趋势分析区 -->
    <div class="trend-section">
      <div class="section-title">趋势分析</div>
      <el-row :gutter="20">
        <!-- 游记发布趋势 -->
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="chart-header">
                <span class="chart-title">游记发布趋势</span>
                <el-radio-group v-model="travelNoteDays" size="small" @change="handleTravelNoteDaysChange">
                  <el-radio-button :label="7">7天</el-radio-button>
                  <el-radio-button :label="14">14天</el-radio-button>
                  <el-radio-button :label="30">30天</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div class="chart-container">
              <div v-if="travelNoteTrendLoading" class="loading-placeholder">加载中...</div>
              <div v-else-if="travelNoteTrendData.length === 0" class="empty-placeholder">暂无数据</div>
              <div v-else class="line-chart-wrapper">
                <svg class="line-chart" :viewBox="`0 0 ${chartWidth} ${chartHeight}`" preserveAspectRatio="none">
                  <!-- 网格线 -->
                  <g class="grid-lines">
                    <line v-for="i in 5" :key="i" 
                      :x1="0" 
                      :y1="(i - 1) * (chartHeight / 5)" 
                      :x2="chartWidth" 
                      :y2="(i - 1) * (chartHeight / 5)"
                      stroke="#f0f0f0" 
                      stroke-width="1" />
                  </g>
                  <!-- 折线 -->
                  <polyline
                    :points="travelNoteLinePoints"
                    fill="none"
                    stroke="#409eff"
                    stroke-width="2"
                    class="line-path"
                  />
                  <!-- 数据点 -->
                  <circle
                    v-for="(point, index) in travelNotePoints"
                    :key="index"
                    :cx="point.x"
                    :cy="point.y"
                    r="4"
                    fill="#409eff"
                    class="data-point"
                  />
                  <!-- 标签 -->
                  <text
                    v-for="(point, index) in travelNotePoints"
                    :key="`label-${index}`"
                    :x="point.x"
                    :y="point.y - 8"
                    text-anchor="middle"
                    font-size="10"
                    fill="#909399"
                    class="point-label"
                  >
                    {{ point.value }}
                  </text>
                </svg>
                <!-- X轴标签 -->
                <div class="x-axis-labels">
                  <span v-for="(item, index) in travelNoteTrendData" :key="index" class="x-label">
                    {{ formatDateShort(item.day) }}
                  </span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 打卡趋势 -->
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="chart-header">
                <span class="chart-title">打卡趋势</span>
                <el-radio-group v-model="checkinDays" size="small" @change="handleCheckinDaysChange">
                  <el-radio-button :label="7">7天</el-radio-button>
                  <el-radio-button :label="14">14天</el-radio-button>
                  <el-radio-button :label="30">30天</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div class="chart-container">
              <div v-if="checkinTrendLoading" class="loading-placeholder">加载中...</div>
              <div v-else-if="checkinTrendData.length === 0" class="empty-placeholder">暂无数据</div>
              <div v-else class="line-chart-wrapper">
                <svg class="line-chart" :viewBox="`0 0 ${chartWidth} ${chartHeight}`" preserveAspectRatio="none">
                  <!-- 网格线 -->
                  <g class="grid-lines">
                    <line v-for="i in 5" :key="i" 
                      :x1="0" 
                      :y1="(i - 1) * (chartHeight / 5)" 
                      :x2="chartWidth" 
                      :y2="(i - 1) * (chartHeight / 5)"
                      stroke="#f0f0f0" 
                      stroke-width="1" />
                  </g>
                  <!-- 折线 -->
                  <polyline
                    :points="checkinLinePoints"
                    fill="none"
                    stroke="#67c23a"
                    stroke-width="2"
                    class="line-path"
                  />
                  <!-- 数据点 -->
                  <circle
                    v-for="(point, index) in checkinPoints"
                    :key="index"
                    :cx="point.x"
                    :cy="point.y"
                    r="4"
                    fill="#67c23a"
                    class="data-point"
                  />
                  <!-- 标签 -->
                  <text
                    v-for="(point, index) in checkinPoints"
                    :key="`label-${index}`"
                    :x="point.x"
                    :y="point.y - 8"
                    text-anchor="middle"
                    font-size="10"
                    fill="#909399"
                    class="point-label"
                  >
                    {{ point.value }}
                  </text>
                </svg>
                <!-- X轴标签 -->
                <div class="x-axis-labels">
                  <span v-for="(item, index) in checkinTrendData" :key="index" class="x-label">
                    {{ formatDateShort(item.day) }}
                  </span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 3️⃣ 分布统计区 -->
    <div class="distribution-section">
      <div class="section-title">分布统计</div>
      <el-card class="distribution-card">
        <template #header>
          <div class="chart-header">
            <span class="chart-title">热门城市 TOP 10</span>
          </div>
        </template>
        <div class="distribution-container">
          <div v-if="cityTopLoading" class="loading-placeholder">加载中...</div>
          <div v-else-if="cityTopData.length === 0" class="empty-placeholder">暂无数据</div>
          <div v-else class="city-list">
            <div v-for="(item, index) in cityTopData" :key="index" class="city-item">
              <div class="city-rank" :class="getRankClass(index)">{{ index + 1 }}</div>
              <div class="city-name">{{ item.city }}</div>
              <div class="city-count">
                <span class="count-value">{{ item.count }}</span>
                <span class="count-unit">篇游记</span>
              </div>
              <div class="city-bar-wrapper">
                <div 
                  class="city-bar" 
                  :style="{ width: `${(item.count / maxCityCount) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 4️⃣ 运营辅助区（预留） -->
    <div class="operation-section">
      <div class="section-title">运营辅助与策略扩展</div>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="operation-module">
            <div class="module-header">
              <el-icon class="module-icon"><UserFilled /></el-icon>
              <span class="module-title">用户运营</span>
            </div>
            <div class="module-content">
              <p class="module-desc">• 活跃用户分析</p>
              <p class="module-desc">• 用户留存率统计</p>
              <p class="module-desc">• 用户行为画像</p>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="operation-module">
            <div class="module-header">
              <el-icon class="module-icon"><Document /></el-icon>
              <span class="module-title">推荐策略</span>
            </div>
            <div class="module-content">
              <p class="module-desc">• 推荐效果分析</p>
              <p class="module-desc">• 内容标签分布</p>
              <p class="module-desc">• 个性化推荐优化</p>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="operation-module">
            <div class="module-header">
              <el-icon class="module-icon"><Bell /></el-icon>
              <span class="module-title">运营预警</span>
            </div>
            <div class="module-content">
              <p class="module-desc">• 数据异常监控</p>
              <p class="module-desc">• 运营指标预警</p>
              <p class="module-desc">• 系统健康度</p>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
  User, 
  Document, 
  Location, 
  ArrowUp,
  ArrowDown,
  Minus,
  InfoFilled,
  UserFilled,
  Bell,
  CircleCheck,
  Warning,
  CircleClose
} from '@element-plus/icons-vue';
import { fetchUserSummary, fetchTravelNoteTrend, fetchCheckinTrend, fetchCityTop } from '../api/stat';
import type { TrendData, CityTopData } from '../api/stat';

// KPI卡片数据
interface KPICard {
  key: string;
  label: string;
  value: number;
  loading: boolean;
  icon: any;
  iconClass: string;
  trend: number | null; // 趋势值（百分比）
  trendText: string;
  trendClass: string;
  trendIcon: any;
}

const kpiCards = ref<KPICard[]>([
  {
    key: 'totalUsers',
    label: '用户总数',
    value: 0,
    loading: true,
    icon: User,
    iconClass: 'icon-user',
    trend: null,
    trendText: '',
    trendClass: '',
    trendIcon: Minus
  },
  {
    key: 'todayUsers',
    label: '今日新增用户',
    value: 0,
    loading: true,
    icon: User,
    iconClass: 'icon-user-add',
    trend: null,
    trendText: '',
    trendClass: '',
    trendIcon: Minus
  },
  {
    key: 'totalNotes',
    label: '游记总数',
    value: 0,
    loading: true,
    icon: Document,
    iconClass: 'icon-note',
    trend: null,
    trendText: '',
    trendClass: '',
    trendIcon: Minus
  },
  {
    key: 'totalCheckins',
    label: '打卡总数',
    value: 0,
    loading: true,
    icon: Location,
    iconClass: 'icon-checkin',
    trend: null,
    trendText: '',
    trendClass: '',
    trendIcon: Minus
  }
]);

// 趋势数据
const travelNoteTrendData = ref<TrendData[]>([]);
const travelNoteTrendLoading = ref(true);
const travelNoteDays = ref(14);

const checkinTrendData = ref<TrendData[]>([]);
const checkinTrendLoading = ref(true);
const checkinDays = ref(14);

// 热门城市数据
const cityTopData = ref<CityTopData[]>([]);
const cityTopLoading = ref(true);

// 图表尺寸
const chartWidth = 600;
const chartHeight = 200;

// 计算折线图数据点
const travelNotePoints = computed(() => {
  if (travelNoteTrendData.value.length === 0) return [];
  const maxCount = Math.max(...travelNoteTrendData.value.map(item => item.count), 1);
  const padding = 20;
  const stepX = (chartWidth - padding * 2) / (travelNoteTrendData.value.length - 1 || 1);
  const usableHeight = chartHeight - padding * 2;
  
  return travelNoteTrendData.value.map((item, index) => ({
    x: padding + index * stepX,
    y: padding + (1 - item.count / maxCount) * usableHeight,
    value: item.count
  }));
});

const travelNoteLinePoints = computed(() => {
  return travelNotePoints.value.map(p => `${p.x},${p.y}`).join(' ');
});

const checkinPoints = computed(() => {
  if (checkinTrendData.value.length === 0) return [];
  const maxCount = Math.max(...checkinTrendData.value.map(item => item.count), 1);
  const padding = 20;
  const stepX = (chartWidth - padding * 2) / (checkinTrendData.value.length - 1 || 1);
  const usableHeight = chartHeight - padding * 2;
  
  return checkinTrendData.value.map((item, index) => ({
    x: padding + index * stepX,
    y: padding + (1 - item.count / maxCount) * usableHeight,
    value: item.count
  }));
});

const checkinLinePoints = computed(() => {
  return checkinPoints.value.map(p => `${p.x},${p.y}`).join(' ');
});

const maxCityCount = computed(() => {
  if (cityTopData.value.length === 0) return 1;
  return Math.max(...cityTopData.value.map(item => item.count), 1);
});

// 系统活跃度计算
const activityStatus = computed(() => {
  if (kpiCards.value.some(card => card.loading)) return null;
  
  const upCount = kpiCards.value.filter(card => 
    card.trend !== null && card.trend > 0
  ).length;
  
  const totalTrendCards = kpiCards.value.filter(card => 
    card.trend !== null
  ).length;
  
  if (totalTrendCards === 0) return null;
  
  const upRatio = upCount / totalTrendCards;
  
  if (upRatio >= 0.75) {
    return { 
      level: 'high', 
      text: '非常活跃', 
      class: 'activity-high',
      icon: CircleCheck,
      desc: '系统各项指标均呈上升趋势，运营状态良好'
    };
  } else if (upRatio >= 0.5) {
    return { 
      level: 'medium', 
      text: '较为活跃', 
      class: 'activity-medium',
      icon: Warning,
      desc: '系统整体运行平稳，部分指标有增长空间'
    };
  } else if (upRatio >= 0.25) {
    return { 
      level: 'low', 
      text: '活跃度一般', 
      class: 'activity-low',
      icon: Warning,
      desc: '部分指标下降，建议关注运营策略调整'
    };
  } else {
    return { 
      level: 'very-low', 
      text: '活跃度较低', 
      class: 'activity-very-low',
      icon: CircleClose,
      desc: '多项指标下降，需要及时采取运营措施'
    };
  }
});

const activityStatusClass = computed(() => activityStatus.value?.class || '');
const activityStatusText = computed(() => activityStatus.value?.text || '计算中...');
const activityDesc = computed(() => activityStatus.value?.desc || '');
const activityIcon = computed(() => activityStatus.value?.icon || InfoFilled);

// 增长亮点洞察
const growthInsights = computed(() => {
  const insights: Array<{ text: string; class: string; icon: any }> = [];
  
  // 找出增长最快的指标
  const growingCards = kpiCards.value
    .filter(card => card.trend !== null && card.trend > 0)
    .sort((a, b) => (b.trend || 0) - (a.trend || 0));
  
  if (growingCards.length > 0) {
    const topCard = growingCards[0];
    insights.push({
      text: `${topCard.label}增长最快，较昨日上升${topCard.trend?.toFixed(1)}%`,
      class: 'insight-up',
      icon: ArrowUp
    });
  }
  
  // 热门城市洞察
  if (cityTopData.value.length > 0) {
    const topCity = cityTopData.value[0];
    insights.push({
      text: `${topCity.city}最受欢迎，已有${topCity.count}篇游记`,
      class: 'insight-city',
      icon: Location
    });
  }
  
  // 趋势洞察
  if (travelNoteTrendData.value.length >= 2) {
    const recent = travelNoteTrendData.value.slice(-3);
    const avgRecent = recent.reduce((sum, item) => sum + item.count, 0) / recent.length;
    const earlier = travelNoteTrendData.value.slice(0, 3);
    const avgEarlier = earlier.reduce((sum, item) => sum + item.count, 0) / earlier.length;
    
    if (avgRecent > avgEarlier * 1.2) {
      insights.push({
        text: '游记发布量近期显著提升，内容创作活跃',
        class: 'insight-up',
        icon: Document
      });
    }
  }
  
  return insights;
});

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
};

// 格式化日期（短格式）
const formatDateShort = (dateStr: string) => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
};

// 计算趋势
const calculateTrend = (current: number, previous: number): { value: number; text: string; class: string; icon: any } => {
  if (previous === 0) {
    return { value: 0, text: '较昨日持平', class: 'trend-neutral', icon: Minus };
  }
  const percent = ((current - previous) / previous) * 100;
  if (percent > 0) {
    return { 
      value: percent, 
      text: `较昨日 ↑${percent.toFixed(1)}%`, 
      class: 'trend-up', 
      icon: ArrowUp 
    };
  } else if (percent < 0) {
    return { 
      value: percent, 
      text: `较昨日 ↓${Math.abs(percent).toFixed(1)}%`, 
      class: 'trend-down', 
      icon: ArrowDown 
    };
  } else {
    return { value: 0, text: '较昨日持平', class: 'trend-neutral', icon: Minus };
  }
};

// 获取排名样式类
const getRankClass = (index: number): string => {
  if (index === 0) return 'rank-gold';
  if (index === 1) return 'rank-silver';
  if (index === 2) return 'rank-bronze';
  return 'rank-normal';
};

// 加载用户统计
const loadUserSummary = async () => {
  try {
    const response = await fetchUserSummary();
    if (response.data.code === 200) {
      const data = response.data.data;
      
      // 用户总数
      kpiCards.value[0].value = data.total;
      kpiCards.value[0].loading = false;
      
      // 今日新增用户
      kpiCards.value[1].value = data.today;
      kpiCards.value[1].loading = false;
      
      // 计算趋势
      const userTrend = calculateTrend(data.today, data.yesterday);
      kpiCards.value[1].trend = userTrend.value;
      kpiCards.value[1].trendText = userTrend.text;
      kpiCards.value[1].trendClass = userTrend.class;
      kpiCards.value[1].trendIcon = userTrend.icon;
    }
  } catch (error) {
    console.error('加载用户统计失败:', error);
    kpiCards.value[0].loading = false;
    kpiCards.value[1].loading = false;
  }
};

// 加载游记趋势
const loadTravelNoteTrend = async () => {
  try {
    travelNoteTrendLoading.value = true;
    const response = await fetchTravelNoteTrend(travelNoteDays.value);
    if (response.data.code === 200) {
      const result = response.data.data;
      travelNoteTrendData.value = result.trend.reverse();
      
      // 计算游记总数
      const total = travelNoteTrendData.value.reduce((sum, item) => sum + item.count, 0);
      kpiCards.value[2].value = total;
      kpiCards.value[2].loading = false;
      
      // 计算趋势
      const noteTrend = calculateTrend(result.todayCount, result.yesterdayCount);
      kpiCards.value[2].trend = noteTrend.value;
      kpiCards.value[2].trendText = noteTrend.text;
      kpiCards.value[2].trendClass = noteTrend.class;
      kpiCards.value[2].trendIcon = noteTrend.icon;
    }
  } catch (error) {
    console.error('加载游记趋势失败:', error);
  } finally {
    travelNoteTrendLoading.value = false;
  }
};

// 加载打卡趋势
const loadCheckinTrend = async () => {
  try {
    checkinTrendLoading.value = true;
    const response = await fetchCheckinTrend(checkinDays.value);
    if (response.data.code === 200) {
      const result = response.data.data;
      checkinTrendData.value = result.trend.reverse();
      
      // 计算打卡总数
      const total = checkinTrendData.value.reduce((sum, item) => sum + item.count, 0);
      kpiCards.value[3].value = total;
      kpiCards.value[3].loading = false;
      
      // 计算趋势
      const checkinTrend = calculateTrend(result.todayCount, result.yesterdayCount);
      kpiCards.value[3].trend = checkinTrend.value;
      kpiCards.value[3].trendText = checkinTrend.text;
      kpiCards.value[3].trendClass = checkinTrend.class;
      kpiCards.value[3].trendIcon = checkinTrend.icon;
    }
  } catch (error) {
    console.error('加载打卡趋势失败:', error);
  } finally {
    checkinTrendLoading.value = false;
  }
};

// 加载热门城市
const loadCityTop = async () => {
  try {
    cityTopLoading.value = true;
    const response = await fetchCityTop();
    if (response.data.code === 200) {
      cityTopData.value = response.data.data;
    }
  } catch (error) {
    console.error('加载热门城市失败:', error);
  } finally {
    cityTopLoading.value = false;
  }
};

// 时间范围切换
const handleTravelNoteDaysChange = () => {
  loadTravelNoteTrend();
};

const handleCheckinDaysChange = () => {
  loadCheckinTrend();
};

// 加载所有数据
const loadAllData = async () => {
  await Promise.all([
    loadUserSummary(),
    loadTravelNoteTrend(),
    loadCheckinTrend(),
    loadCityTop()
  ]);
};

onMounted(() => {
  loadAllData();
});
</script>

<style scoped>
.dashboard {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

/* 页面标题 */
.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-desc {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

/* 系统活跃度总览 */
.activity-overview {
  margin-bottom: 24px;
}

.activity-card {
  border-radius: 8px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.activity-content {
  padding: 8px 0;
  color: #fff;
}

.activity-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.activity-status {
  display: flex;
  align-items: center;
  margin: 12px 0;
}

.activity-icon {
  font-size: 24px;
  margin-right: 8px;
}

.activity-text {
  font-size: 20px;
  font-weight: 600;
}

.activity-desc {
  font-size: 13px;
  opacity: 0.85;
  margin-top: 8px;
}

.activity-high {
  color: #67c23a;
}

.activity-medium {
  color: #e6a23c;
}

.activity-low {
  color: #f56c6c;
}

.activity-very-low {
  color: #f56c6c;
}

/* 增长亮点洞察 */
.insight-section {
  margin-bottom: 24px;
}

.insight-card {
  border-radius: 8px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.insight-header {
  display: flex;
  align-items: center;
  color: #fff;
}

.insight-icon {
  font-size: 20px;
  margin-right: 8px;
}

.insight-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.insight-list {
  padding: 8px 0;
}

.insight-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  color: #fff;
}

.insight-item-icon {
  font-size: 18px;
  margin-right: 10px;
}

.insight-item-icon.insight-up {
  color: #67c23a;
}

.insight-item-icon.insight-city {
  color: #409eff;
}

.insight-text {
  font-size: 14px;
  opacity: 0.95;
}

/* 统一模块标题 */
.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

/* 1️⃣ 核心指标区（KPI区） */
.kpi-section {
  margin-bottom: 24px;
}

.kpi-cards {
  margin: 0;
}

.kpi-card {
  border-radius: 8px;
  transition: all 0.3s;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.kpi-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.kpi-card.loading {
  opacity: 0.6;
}

.kpi-content {
  padding: 8px 0;
}

.kpi-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.kpi-icon {
  font-size: 24px;
  margin-right: 8px;
}

.kpi-icon.icon-user {
  color: #409eff;
}

.kpi-icon.icon-user-add {
  color: #67c23a;
}

.kpi-icon.icon-note {
  color: #e6a23c;
}

.kpi-icon.icon-checkin {
  color: #f56c6c;
}

.kpi-label {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

.kpi-value {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  margin: 16px 0;
  min-height: 48px;
  display: flex;
  align-items: center;
  line-height: 1;
}

.kpi-trend {
  margin-top: 8px;
}

.trend-text {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
}

.trend-icon {
  margin-right: 4px;
  font-size: 14px;
}

.trend-up {
  color: #67c23a;
}

.trend-down {
  color: #f56c6c;
}

.trend-neutral {
  color: #909399;
}

/* 2️⃣ 趋势分析区 */
.trend-section {
  margin-bottom: 24px;
}

.chart-card {
  border-radius: 8px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  min-height: 280px;
  padding: 20px 0;
}

.loading-placeholder,
.empty-placeholder {
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.line-chart-wrapper {
  position: relative;
  height: 280px;
  padding: 20px 0 40px;
}

.line-chart {
  width: 100%;
  height: 200px;
  display: block;
}

.grid-lines line {
  opacity: 0.5;
}

.line-path {
  transition: all 0.3s;
}

.data-point {
  cursor: pointer;
  transition: r 0.2s;
}

.data-point:hover {
  r: 6;
}

.point-label {
  pointer-events: none;
}

.x-axis-labels {
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
  padding: 0 20px;
}

.x-label {
  font-size: 12px;
  color: #909399;
  flex: 1;
  text-align: center;
}

/* 3️⃣ 分布统计区 */
.distribution-section {
  margin-bottom: 24px;
}

.distribution-card {
  border-radius: 8px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.distribution-container {
  min-height: 400px;
  padding: 10px 0;
}

.city-list {
  padding: 0;
}

.city-item {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s;
}

.city-item:last-child {
  border-bottom: none;
}

.city-item:hover {
  background-color: #f5f7fa;
  border-radius: 6px;
  padding-left: 12px;
  padding-right: 12px;
}

.city-rank {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  border-radius: 50%;
  font-size: 16px;
  margin-right: 16px;
  flex-shrink: 0;
}

.rank-gold {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 4px 12px rgba(245, 87, 108, 0.3);
}

.rank-silver {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
}

.rank-bronze {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  box-shadow: 0 4px 12px rgba(67, 233, 123, 0.3);
}

.rank-normal {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.city-name {
  flex: 1;
  font-size: 16px;
  color: #303133;
  font-weight: 500;
}

.city-count {
  display: flex;
  align-items: baseline;
  margin-right: 20px;
  min-width: 120px;
  justify-content: flex-end;
}

.count-value {
  font-size: 22px;
  font-weight: 700;
  color: #409eff;
  margin-right: 6px;
}

.count-unit {
  font-size: 13px;
  color: #909399;
}

.city-bar-wrapper {
  width: 240px;
  height: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
  margin-left: 20px;
}

.city-bar {
  height: 100%;
  background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
  border-radius: 5px;
  transition: width 0.5s ease;
}

/* 4️⃣ 运营辅助区 */
.operation-section {
  margin-bottom: 24px;
}

.operation-module {
  border-radius: 8px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  height: 100%;
}

.operation-module:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.module-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.module-icon {
  font-size: 24px;
  margin-right: 10px;
  color: #409eff;
}

.module-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.module-content {
  padding: 8px 0;
}

.module-desc {
  font-size: 14px;
  color: #606266;
  line-height: 2;
  margin: 4px 0;
}
</style>
