<template>
  <div class="dashboard">
    <el-row :gutter="16">
      <el-col :span="6" v-for="card in cards" :key="card.title">
        <el-card>
          <div class="card-title">{{ card.title }}</div>
          <div class="card-value">{{ card.value }}</div>
          <div class="card-desc">{{ card.desc }}</div>
        </el-card>
      </el-col>
    </el-row>
    <el-card class="mt-16">
      <div class="chart-placeholder">
        数据看板占位（待接统计接口 stat/*）
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
const cards = [
  { title: '今日新增用户', value: '--', desc: '待接接口' },
  { title: '游记发布总数', value: '--', desc: 'stat/travelNote/trend' },
  { title: '打卡次数', value: '--', desc: 'stat/checkin/trend' },
  { title: '热门城市 TOP', value: '--', desc: 'stat/city/top' }
];
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card-title {
  font-size: 14px;
  color: #909399;
}
.card-value {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 600;
}
.card-desc {
  margin-top: 4px;
  color: #a0a3a9;
  font-size: 12px;
}
.chart-placeholder {
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  border: 1px dashed #dcdfe6;
}
.mt-16 {
  margin-top: 16px;
}
</style>























