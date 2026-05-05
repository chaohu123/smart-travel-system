<template>
  <div class="dashboard">
    <!-- 运营预警 -->
    <section v-if="activityReady" class="alert-panel">
      <div class="alert-panel-inner">
        <div class="alert-icon-wrap">
          <el-icon class="alert-icon"><Warning /></el-icon>
        </div>
        <div class="alert-body">
          <div class="alert-head">
            <span class="alert-title">运营预警</span>
            <span class="alert-badge" :class="activityStatusClass">{{ activityStatusText }}</span>
          </div>
          <p class="alert-lead">{{ activityDesc }}</p>
          <ul class="alert-suggestions">
            <li v-for="(line, i) in operationSuggestions" :key="i">{{ line }}</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 核心指标 -->
    <section class="kpi-section">
      <el-row :gutter="24">
        <el-col v-for="kpi in kpiCards" :key="kpi.key" :xs="24" :sm="12" :lg="6">
          <div class="kpi-card" :class="{ loading: kpi.loading }">
            <div class="kpi-top">
              <el-icon class="kpi-icon"><component :is="kpi.icon" /></el-icon>
              <span class="kpi-label">{{ kpi.label }}</span>
            </div>
            <div class="kpi-value">
              <span v-if="kpi.loading">…</span>
              <span v-else>{{ formatNumber(kpi.value) }}</span>
            </div>
            <div v-if="!kpi.loading && kpi.trend !== null" class="kpi-foot">
              <span class="kpi-trend" :class="kpi.trendClass">
                <el-icon class="kpi-trend-ic"><component :is="kpi.trendIcon" /></el-icon>
                {{ kpi.trendText }}
              </span>
              <span class="kpi-hint">较昨日</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </section>

    <!-- 趋势 + 柱状图 -->
    <section class="charts-section">
      <el-row :gutter="24">
        <el-col :xs="24" :lg="14">
          <div class="panel-card chart-panel">
            <div class="panel-head">
              <div>
                <h2 class="panel-title">用户增长与游记发布</h2>
                <p class="panel-sub">双折线趋势（按日统计）</p>
              </div>
              <el-radio-group v-model="chartRangeDays" size="small" class="range-tabs" @change="onChartRangeChange">
                <el-radio-button :label="7">7 天</el-radio-button>
                <el-radio-button :label="14">14 天</el-radio-button>
                <el-radio-button :label="30">30 天</el-radio-button>
              </el-radio-group>
            </div>
            <div class="panel-body chart-body">
              <div v-if="trendChartsLoading" class="chart-placeholder is-loading">
                <span class="loading-dots" aria-hidden="true">
                  <span class="loading-dot" />
                  <span class="loading-dot" />
                  <span class="loading-dot" />
                </span>
                <span>加载趋势数据…</span>
              </div>
              <div v-else-if="mergedTrendDays.length === 0" class="chart-placeholder muted is-empty">
                <el-icon class="empty-icon"><DataAnalysis /></el-icon>
                <span class="empty-text">暂无趋势数据</span>
              </div>
              <div v-else class="dual-chart">
                <div class="chart-legend">
                  <span class="lg-item"><i class="dot dot-a" />新增用户</span>
                  <span class="lg-item"><i class="dot dot-b" />游记发布</span>
                </div>
                <svg class="dual-svg" :viewBox="`0 0 ${chartWidth} ${chartHeight}`" preserveAspectRatio="none">
                  <g class="grid">
                    <line
                      v-for="i in 5"
                      :key="i"
                      :x1="0"
                      :y1="padY + ((i - 1) * (chartHeight - padY * 2)) / 4"
                      :x2="chartWidth"
                      :y2="padY + ((i - 1) * (chartHeight - padY * 2)) / 4"
                    />
                  </g>
                  <polyline class="line line-user" :points="dualLines.userPoly" fill="none" />
                  <polyline class="line line-note" :points="dualLines.notePoly" fill="none" />
                  <circle
                    v-for="(p, idx) in dualLines.userPts"
                    :key="'u' + idx"
                    class="pt pt-user"
                    :cx="p.x"
                    :cy="p.y"
                    r="3.5"
                  />
                  <circle
                    v-for="(p, idx) in dualLines.notePts"
                    :key="'n' + idx"
                    class="pt pt-note"
                    :cx="p.x"
                    :cy="p.y"
                    r="3.5"
                  />
                </svg>
                <div class="x-labels">
                  <span v-for="item in xLabelItems" :key="item.day" class="x-lbl">
                    {{ formatDateShort(item.day) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :lg="10">
          <div class="panel-card chart-panel">
            <div class="panel-head">
              <div>
                <h2 class="panel-title">打卡地点热度</h2>
                <p class="panel-sub">按打卡记录聚合 TOP 地点</p>
              </div>
            </div>
            <div class="panel-body bar-body">
              <div v-if="pointHotLoading" class="chart-placeholder is-loading">
                <span class="loading-dots" aria-hidden="true">
                  <span class="loading-dot" />
                  <span class="loading-dot" />
                  <span class="loading-dot" />
                </span>
                <span>加载热度数据…</span>
              </div>
              <div v-else-if="pointHotData.length === 0" class="chart-placeholder muted is-empty">
                <el-icon class="empty-icon"><Histogram /></el-icon>
                <span class="empty-text">暂无打卡地点数据</span>
              </div>
              <div v-else class="bar-list">
                <div v-for="(row, idx) in pointHotData" :key="idx" class="bar-row">
                  <span class="bar-name" :title="row.name">{{ row.name }}</span>
                  <div class="bar-track">
                    <div
                      class="bar-fill"
                      :style="{ width: `${(row.count / pointHotMax) * 100}%` }"
                    />
                  </div>
                  <span class="bar-count">{{ row.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import {
  User,
  Document,
  Location,
  ArrowUp,
  ArrowDown,
  Minus,
  Warning,
  DataAnalysis,
  Histogram
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import {
  fetchUserSummary,
  fetchTravelNoteTrend,
  fetchCheckinTrend,
  fetchUserTrend,
  fetchCheckinPointTop
} from '../api/stat';
import type { TrendData, CheckinPointTopData } from '../api/stat';

interface KPICard {
  key: string;
  label: string;
  value: number;
  loading: boolean;
  icon: any;
  trend: number | null;
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
    trend: null,
    trendText: '',
    trendClass: '',
    trendIcon: Minus
  },
  {
    key: 'totalNotes',
    label: '游记发布量（区间）',
    value: 0,
    loading: true,
    icon: Document,
    trend: null,
    trendText: '',
    trendClass: '',
    trendIcon: Minus
  },
  {
    key: 'totalCheckins',
    label: '打卡次数（区间）',
    value: 0,
    loading: true,
    icon: Location,
    trend: null,
    trendText: '',
    trendClass: '',
    trendIcon: Minus
  }
]);

const travelNoteTrendData = ref<TrendData[]>([]);
const userTrendData = ref<TrendData[]>([]);
const chartRangeDays = ref(14);
const trendChartsLoading = ref(true);

const pointHotData = ref<CheckinPointTopData[]>([]);
const pointHotLoading = ref(true);

const chartWidth = 640;
const chartHeight = 240;
const padY = 32;

const noteByDay = computed(() => {
  const m: Record<string, number> = {};
  travelNoteTrendData.value.forEach((d) => {
    m[d.day] = d.count;
  });
  return m;
});

const userByDay = computed(() => {
  const m: Record<string, number> = {};
  userTrendData.value.forEach((d) => {
    m[d.day] = d.count;
  });
  return m;
});

const mergedTrendDays = computed(() => {
  const s = new Set<string>();
  travelNoteTrendData.value.forEach((d) => s.add(d.day));
  userTrendData.value.forEach((d) => s.add(d.day));
  return Array.from(s).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
});

const xLabelItems = computed(() => {
  const days = mergedTrendDays.value;
  const n = days.length;
  if (!n) return [] as { day: string }[];
  if (n <= 8) return days.map((day) => ({ day }));
  const idxs = [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor((3 * n) / 4), n - 1];
  const uniq = [...new Set(idxs)].filter((i) => i >= 0 && i < n).sort((a, b) => a - b);
  return uniq.map((i) => ({ day: days[i] }));
});

const dualLines = computed(() => {
  const days = mergedTrendDays.value;
  if (!days.length) {
    return { notePts: [] as { x: number; y: number }[], userPts: [] as { x: number; y: number }[], notePoly: '', userPoly: '' };
  }
  const padX = 28;
  const maxNote = Math.max(...days.map((d) => noteByDay.value[d] || 0), 1);
  const maxUser = Math.max(...days.map((d) => userByDay.value[d] || 0), 1);
  const innerW = chartWidth - padX * 2;
  const innerH = chartHeight - padY * 2;
  const step = days.length > 1 ? innerW / (days.length - 1) : 0;

  const notePts = days.map((day, i) => ({
    x: padX + i * step,
    y: padY + (1 - (noteByDay.value[day] || 0) / maxNote) * innerH
  }));
  const userPts = days.map((day, i) => ({
    x: padX + i * step,
    y: padY + (1 - (userByDay.value[day] || 0) / maxUser) * innerH
  }));

  return {
    notePts,
    userPts,
    notePoly: notePts.map((p) => `${p.x},${p.y}`).join(' '),
    userPoly: userPts.map((p) => `${p.x},${p.y}`).join(' ')
  };
});

const pointHotMax = computed(() => {
  if (!pointHotData.value.length) return 1;
  return Math.max(...pointHotData.value.map((r) => r.count), 1);
});

const activityReady = computed(() => !kpiCards.value.some((c) => c.loading));

const activityStatus = computed(() => {
  if (!activityReady.value) return null;

  const upCount = kpiCards.value.filter((card) => card.trend !== null && card.trend > 0).length;
  const totalTrendCards = kpiCards.value.filter((card) => card.trend !== null).length;
  if (totalTrendCards === 0) return null;
  const upRatio = upCount / totalTrendCards;

  if (upRatio >= 0.75) {
    return {
      level: 'high',
      text: '健康',
      class: 'st-high',
      desc: '核心指标多数向好，可继续保持当前运营节奏。'
    };
  }
  if (upRatio >= 0.5) {
    return {
      level: 'medium',
      text: '关注',
      class: 'st-mid',
      desc: '整体平稳，建议对回落指标做定向复盘。'
    };
  }
  if (upRatio >= 0.25) {
    return {
      level: 'low',
      text: '预警',
      class: 'st-low',
      desc: '多项指标走弱，建议加强活动曝光与内容供给。'
    };
  }
  return {
    level: 'very-low',
    text: '强预警',
    class: 'st-bad',
    desc: '多项指标明显下滑，建议尽快制定干预与复盘计划。'
  };
});

const activityStatusClass = computed(() => activityStatus.value?.class || '');
const activityStatusText = computed(() => activityStatus.value?.text || '');
const activityDesc = computed(() => activityStatus.value?.desc || '');

const growthInsights = computed(() => {
  const insights: Array<{ text: string }> = [];
  const growingCards = kpiCards.value
    .filter((card) => card.trend !== null && card.trend > 0)
    .sort((a, b) => (b.trend || 0) - (a.trend || 0));
  if (growingCards.length > 0) {
    const topCard = growingCards[0];
    insights.push({
      text: `${topCard.label}环比表现最佳，${topCard.trendText.replace('较昨日', '').trim()}。`
    });
  }
  if (travelNoteTrendData.value.length >= 2) {
    const recent = travelNoteTrendData.value.slice(-3);
    const avgRecent = recent.reduce((sum, item) => sum + item.count, 0) / recent.length;
    const earlier = travelNoteTrendData.value.slice(0, 3);
    const avgEarlier = earlier.reduce((sum, item) => sum + item.count, 0) / earlier.length;
    if (avgRecent > avgEarlier * 1.15) {
      insights.push({ text: '游记发布节奏近期抬升，可顺势做话题或打卡联动。' });
    }
  }
  if (pointHotData.value.length > 0) {
    insights.push({
      text: `「${pointHotData.value[0].name}」打卡最集中，适合作为线下活动或推荐位重点。`
    });
  }
  return insights;
});

const operationSuggestions = computed(() => {
  const lines: string[] = [];
  if (activityDesc.value) lines.push(activityDesc.value);
  growthInsights.value.forEach((g) => lines.push(g.text));
  if (lines.length < 2) {
    lines.push('保持每日查看核心指标与内容质量，避免异常波动被忽略。');
  }
  return lines.slice(0, 4);
});

const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
};

const formatDateShort = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const calculateTrend = (
  current: number,
  previous: number
): { value: number; text: string; class: string; icon: any } => {
  if (previous === 0) {
    return { value: 0, text: '持平', class: 'trend-neutral', icon: Minus };
  }
  const percent = ((current - previous) / previous) * 100;
  if (percent > 0) {
    return {
      value: percent,
      text: `↑ ${percent.toFixed(1)}%`,
      class: 'trend-up',
      icon: ArrowUp
    };
  }
  if (percent < 0) {
    return {
      value: percent,
      text: `↓ ${Math.abs(percent).toFixed(1)}%`,
      class: 'trend-down',
      icon: ArrowDown
    };
  }
  return { value: 0, text: '持平', class: 'trend-neutral', icon: Minus };
};

const loadUserSummary = async () => {
  try {
    const response = await fetchUserSummary();
    if (response.data.code === 200) {
      const data = response.data.data;
      kpiCards.value[0].value = data.total;
      kpiCards.value[0].loading = false;
      kpiCards.value[1].value = data.today;
      kpiCards.value[1].loading = false;
      const userTrend = calculateTrend(data.today, data.yesterday);
      kpiCards.value[1].trend = userTrend.value;
      kpiCards.value[1].trendText = userTrend.text;
      kpiCards.value[1].trendClass = userTrend.class;
      kpiCards.value[1].trendIcon = userTrend.icon;
    }
  } catch (e) {
    console.error(e);
    kpiCards.value[0].loading = false;
    kpiCards.value[1].loading = false;
  }
};

const loadTravelNoteTrend = async () => {
  try {
    const response = await fetchTravelNoteTrend(chartRangeDays.value);
    if (response.data.code === 200) {
      const result = response.data.data;
      travelNoteTrendData.value = result.trend.slice().reverse();
      const total = travelNoteTrendData.value.reduce((sum, item) => sum + item.count, 0);
      kpiCards.value[2].value = total;
      kpiCards.value[2].loading = false;
      const noteTrend = calculateTrend(result.todayCount, result.yesterdayCount);
      kpiCards.value[2].trend = noteTrend.value;
      kpiCards.value[2].trendText = noteTrend.text;
      kpiCards.value[2].trendClass = noteTrend.class;
      kpiCards.value[2].trendIcon = noteTrend.icon;
    }
  } catch (e) {
    console.error(e);
  }
};

const loadCheckinTrend = async () => {
  try {
    const response = await fetchCheckinTrend(chartRangeDays.value);
    if (response.data.code === 200) {
      const result = response.data.data;
      const trend = result.trend.slice().reverse();
      const total = trend.reduce((sum, item) => sum + item.count, 0);
      kpiCards.value[3].value = total;
      kpiCards.value[3].loading = false;
      const t = calculateTrend(result.todayCount, result.yesterdayCount);
      kpiCards.value[3].trend = t.value;
      kpiCards.value[3].trendText = t.text;
      kpiCards.value[3].trendClass = t.class;
      kpiCards.value[3].trendIcon = t.icon;
    }
  } catch (e) {
    console.error(e);
  }
};

const loadUserTrend = async () => {
  try {
    const response = await fetchUserTrend(chartRangeDays.value);
    if (response.data.code === 200) {
      userTrendData.value = response.data.data.trend.slice().reverse();
    }
  } catch (e) {
    console.error(e);
    userTrendData.value = [];
  }
};

const loadPointHot = async () => {
  pointHotLoading.value = true;
  try {
    const response = await fetchCheckinPointTop();
    if (response.data.code === 200) {
      const raw = response.data.data as unknown as { name: string; count: number }[];
      pointHotData.value = (raw || []).map((r) => ({
        name: formatPointHotName(String(r.name ?? '未命名地点')),
        count: Number(r.count ?? 0)
      }));
    }
  } catch (e) {
    console.error(e);
    pointHotData.value = [];
  } finally {
    pointHotLoading.value = false;
  }
};

const formatPointHotName = (name: string): string => {
  const source = (name || '').trim();
  if (!source) return '未命名地点';
  if (/^scenic#\d+$/i.test(source)) {
    return source.replace(/^scenic#/i, '景点#');
  }
  if (/^food#\d+$/i.test(source)) {
    return source.replace(/^food#/i, '美食#');
  }
  return source;
};

const loadTrendPair = async () => {
  trendChartsLoading.value = true;
  try {
    await Promise.all([loadTravelNoteTrend(), loadUserTrend(), loadCheckinTrend()]);
  } finally {
    trendChartsLoading.value = false;
  }
};

const onChartRangeChange = () => {
  loadTrendPair();
};

const loadAllData = async () => {
  await Promise.all([loadUserSummary(), loadTrendPair(), loadPointHot()]);
};

const exportCsv = () => {
  const rows: string[][] = [];
  rows.push(['智能旅游 · 数据总览报表', new Date().toLocaleString('zh-CN')]);
  rows.push([]);
  rows.push(['指标', '数值', '环比摘要']);
  kpiCards.value.forEach((k) => {
    rows.push([k.label, String(k.value), k.trend !== null ? k.trendText : '—']);
  });
  rows.push([]);
  rows.push(['日期', '新增用户', '游记发布']);
  mergedTrendDays.value.forEach((day) => {
    rows.push([day, String(userByDay.value[day] || 0), String(noteByDay.value[day] || 0)]);
  });
  rows.push([]);
  rows.push(['打卡地点', '次数']);
  pointHotData.value.forEach((p) => rows.push([p.name, String(p.count)]));
  const body = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dashboard-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success('报表已导出为 CSV');
};

const onDashboardAction = (ev: Event) => {
  const e = ev as CustomEvent<'refresh' | 'export'>;
  if (e.detail === 'refresh') {
    loadAllData().then(() => ElMessage.success('数据已刷新'));
  } else if (e.detail === 'export') {
    exportCsv();
  }
};

onMounted(() => {
  loadAllData();
  window.addEventListener('admin-dashboard-action', onDashboardAction as EventListener);
});

onUnmounted(() => {
  window.removeEventListener('admin-dashboard-action', onDashboardAction as EventListener);
});
</script>

<style scoped>
.dashboard {
  padding: 28px 32px 48px;
  max-width: 1440px;
  margin: 0 auto;
}

@media (max-width: 991px) {
  .dashboard {
    padding: 22px 20px 40px;
  }

  .kpi-section :deep(.el-col),
  .charts-section :deep(.el-col) {
    margin-bottom: 20px;
  }

  .kpi-section :deep(.el-row > .el-col:last-child),
  .charts-section :deep(.el-row > .el-col:last-child) {
    margin-bottom: 0;
  }
}

.alert-panel {
  margin-bottom: 28px;
  border-radius: var(--admin-radius);
  padding: 1px;
  background: linear-gradient(
    120deg,
    rgba(93, 146, 176, 0.38),
    rgba(184, 212, 230, 0.28)
  );
  box-shadow:
    var(--admin-shadow),
    0 0 0 1px rgba(255, 255, 255, 0.6) inset;
}

.alert-panel-inner {
  position: relative;
  display: flex;
  gap: 20px;
  padding: 22px 28px;
  border-radius: calc(var(--admin-radius) - 1px);
  background: linear-gradient(
    105deg,
    rgba(227, 238, 245, 0.94),
    rgba(255, 255, 255, 0.9)
  );
  backdrop-filter: blur(6px);
  overflow: hidden;
}

.alert-panel-inner::after {
  content: '';
  position: absolute;
  right: -48px;
  top: 50%;
  transform: translateY(-50%);
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(93, 146, 176, 0.14) 0%,
    rgba(122, 169, 196, 0.06) 45%,
    transparent 70%
  );
  pointer-events: none;
}

.alert-icon-wrap {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(93, 146, 176, 0.16);
  color: var(--admin-lake-600);
}

.alert-icon {
  font-size: 22px;
}

.alert-body {
  position: relative;
  z-index: 1;
  min-width: 0;
  flex: 1;
  max-width: min(100%, 920px);
}

.alert-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.alert-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--admin-text);
  letter-spacing: -0.01em;
}

.alert-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
  letter-spacing: 0.02em;
}

.st-high {
  background: rgba(93, 146, 176, 0.2);
  color: var(--admin-lake-600);
}
.st-mid {
  background: rgba(234, 179, 8, 0.12);
  color: #a16207;
}
.st-low {
  background: rgba(249, 115, 22, 0.12);
  color: #c2410c;
}
.st-bad {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.alert-lead {
  margin: 0 0 10px;
  font-size: 13px;
  color: var(--admin-muted);
  line-height: 1.55;
}

.alert-suggestions {
  margin: 0;
  padding-left: 0;
  list-style: none;
  color: var(--admin-text);
  font-size: 13px;
  line-height: 1.65;
}

.alert-suggestions li {
  position: relative;
  padding-left: 14px;
  margin-bottom: 6px;
}

.alert-suggestions li:last-child {
  margin-bottom: 0;
}

.alert-suggestions li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--admin-lake-400);
  opacity: 0.85;
}

.kpi-section {
  margin-bottom: 64px;
}

.kpi-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(165deg, #ffffff 0%, rgba(247, 250, 252, 0.65) 100%);
  border-radius: var(--admin-radius);
  border: 1px solid var(--admin-border);
  padding: 22px 22px 20px;
  box-shadow:
    var(--admin-shadow),
    0 0 0 1px rgba(255, 255, 255, 0.85) inset;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
  height: 100%;
}

.kpi-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--admin-lake-400), var(--admin-lake-600));
  opacity: 0.55;
  border-radius: var(--admin-radius) var(--admin-radius) 0 0;
}

.kpi-card::after {
  content: '';
  position: absolute;
  right: -28px;
  top: -28px;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(93, 146, 176, 0.09) 0%, transparent 72%);
  pointer-events: none;
}

.kpi-card:hover:not(.loading) {
  transform: none;
  box-shadow:
    0 2px 6px rgba(15, 23, 42, 0.05),
    0 12px 28px rgba(15, 23, 42, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.85) inset;
  border-color: rgba(93, 146, 176, 0.28);
}

.kpi-card.loading {
  opacity: 0.72;
}

.kpi-top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.kpi-icon {
  font-size: 22px;
  color: var(--admin-lake-500);
  padding: 8px;
  border-radius: var(--admin-radius-sm);
  background: rgba(93, 146, 176, 0.1);
}

.kpi-label {
  font-size: 13px;
  color: var(--admin-muted);
  font-weight: 600;
}

.kpi-value {
  position: relative;
  z-index: 1;
  font-size: 30px;
  font-weight: 700;
  color: var(--admin-text);
  letter-spacing: -0.03em;
  line-height: 1.15;
  min-height: 36px;
  font-variant-numeric: tabular-nums;
}

.kpi-foot {
  position: relative;
  z-index: 1;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(229, 233, 238, 0.85);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.kpi-trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
}

.kpi-trend-ic {
  font-size: 14px;
}

.kpi-hint {
  font-size: 12px;
  color: var(--admin-muted);
}

.trend-up {
  color: #15803d;
}
.trend-down {
  color: #b91c1c;
}
.trend-neutral {
  color: var(--admin-muted);
}

.charts-section {
  margin-top: 0;
  padding-top: 4px;
  clear: both;
}

.panel-card {
  background: linear-gradient(180deg, #ffffff 0%, rgba(252, 253, 254, 0.92) 100%);
  border-radius: var(--admin-radius);
  border: 1px solid var(--admin-border);
  box-shadow:
    var(--admin-shadow),
    0 0 0 1px rgba(255, 255, 255, 0.85) inset;
  height: 100%;
  min-height: 368px;
  display: flex;
  flex-direction: column;
  transition:
    box-shadow 0.22s ease,
    border-color 0.22s ease;
}

.panel-card:hover {
  border-color: rgba(93, 146, 176, 0.22);
  box-shadow:
    0 2px 6px rgba(15, 23, 42, 0.05),
    0 12px 32px rgba(15, 23, 42, 0.07),
    0 0 0 1px rgba(255, 255, 255, 0.85) inset;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px 16px;
  border-bottom: 1px solid rgba(229, 233, 238, 0.75);
}

.panel-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--admin-text);
  letter-spacing: -0.02em;
}

.panel-sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--admin-muted);
  line-height: 1.45;
}

.range-tabs {
  flex-shrink: 0;
}

.range-tabs :deep(.el-radio-button__inner) {
  border-radius: 8px !important;
  padding: 7px 14px;
  font-weight: 500;
  border-color: var(--admin-border) !important;
  background: var(--admin-surface-2);
  color: var(--admin-muted);
  box-shadow: none !important;
}

.range-tabs :deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-top-left-radius: 10px !important;
  border-bottom-left-radius: 10px !important;
}

.range-tabs :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-top-right-radius: 10px !important;
  border-bottom-right-radius: 10px !important;
}

.range-tabs :deep(.el-radio-button.is-active .el-radio-button__inner),
.range-tabs :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: linear-gradient(145deg, var(--admin-lake-500), var(--admin-lake-600)) !important;
  border-color: var(--admin-lake-500) !important;
  color: #fff !important;
}

.range-tabs :deep(.el-radio-button.is-active .el-radio-button__inner:hover),
.range-tabs :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner:hover) {
  background: linear-gradient(145deg, var(--admin-lake-500), #3d6d8a) !important;
  border-color: var(--admin-lake-600) !important;
}

.panel-body {
  flex: 1;
  padding: 20px 24px 24px;
}

.chart-placeholder {
  min-height: 288px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--admin-text);
}

.chart-placeholder.is-loading {
  flex-direction: column;
  gap: 14px;
  color: var(--admin-muted);
  font-weight: 500;
}

.loading-dots {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  justify-content: center;
}

.loading-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--admin-lake-500);
  opacity: 0.35;
  animation: dash-bounce 0.75s ease-in-out infinite;
}

.loading-dot:nth-child(2) {
  animation-delay: 0.12s;
}

.loading-dot:nth-child(3) {
  animation-delay: 0.24s;
}

@keyframes dash-bounce {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.35;
  }
  50% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

.chart-placeholder.muted {
  color: var(--admin-muted);
}

.chart-placeholder.is-empty {
  flex-direction: column;
  gap: 14px;
  padding: 24px 16px;
  border-radius: var(--admin-radius-sm);
  margin-top: 4px;
  background: rgba(246, 248, 250, 0.65);
  border: 1px dashed rgba(184, 212, 230, 0.65);
  animation: empty-fade 0.45s ease-out;
}

@keyframes empty-fade {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chart-placeholder .empty-icon {
  font-size: 44px;
  color: var(--admin-lake-400);
  opacity: 0.45;
}

.chart-placeholder .empty-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--admin-muted);
}

.dual-chart {
  position: relative;
  padding: 14px 16px 10px;
  border-radius: var(--admin-radius-sm);
  background: linear-gradient(
    165deg,
    rgba(246, 248, 250, 0.9) 0%,
    rgba(255, 255, 255, 0.55) 100%
  );
  border: 1px solid rgba(229, 233, 238, 0.75);
}

.chart-legend {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  padding: 6px 6px 12px;
  font-size: 12px;
  color: var(--admin-muted);
}

.lg-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.dot-a {
  background: var(--admin-lake-400);
}
.dot-b {
  background: var(--admin-lake-600);
}

.dual-svg {
  width: 100%;
  height: 220px;
  display: block;
}

.grid line {
  stroke: var(--admin-border);
  stroke-width: 1;
  stroke-dasharray: 4 6;
  opacity: 0.85;
}

.line {
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.line-user {
  stroke: var(--admin-lake-400);
}

.line-note {
  stroke: var(--admin-lake-600);
}

.pt {
  vector-effect: non-scaling-stroke;
}
.pt-user {
  fill: #fff;
  stroke: var(--admin-lake-400);
  stroke-width: 2;
}
.pt-note {
  fill: #fff;
  stroke: var(--admin-lake-600);
  stroke-width: 2;
}

.x-labels {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px 0;
  min-height: 22px;
}

.x-lbl {
  font-size: 11px;
  color: var(--admin-muted);
}

.bar-body {
  padding-top: 10px;
}

.bar-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 10px;
}

.bar-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 2.2fr auto;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  padding: 8px 12px;
  margin: 0 -12px;
  border-radius: var(--admin-radius-sm);
  transition: background 0.18s ease;
}

.bar-row:hover {
  background: rgba(93, 146, 176, 0.07);
}

.bar-name {
  color: var(--admin-text);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-track {
  height: 10px;
  border-radius: 999px;
  background: var(--admin-surface-2);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--admin-lake-400), var(--admin-lake-600));
  transition: width 0.45s ease;
}

.bar-count {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--admin-lake-600);
  min-width: 36px;
  text-align: right;
}
</style>
