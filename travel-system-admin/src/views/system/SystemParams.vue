<template>
  <div>
    <el-card class="mb-16">
      <el-alert
        title="后端接口未就绪：系统参数占位数据"
        type="warning"
        :closable="false"
      />
    </el-card>
    <el-row :gutter="16">
      <el-col :span="8" v-for="card in cards" :key="card.title">
        <el-card>
          <div class="card-title">{{ card.title }}</div>
          <div class="card-desc">{{ card.desc }}</div>
          <el-button size="small" type="primary">配置（占位）</el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
const cards = [
  { title: '地图 API Key', desc: '用于定位/路线规划调用' },
  { title: 'AI Key 与模型参数', desc: '行程文案、问答等' },
  { title: '推荐策略参数', desc: '行为权重、缓存时间' }
];
</script>

<style scoped>
.mb-16 {
  margin-bottom: 16px;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}
.card-desc {
  margin-bottom: 12px;
  color: #606266;
}
</style>
























