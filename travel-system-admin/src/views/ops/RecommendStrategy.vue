<template>
  <div>
    <el-card class="mb-16">
      <el-alert
        title="后端接口未就绪：策略配置为占位展示"
        type="warning"
        :closable="false"
      />
      <p class="mt-12">在系统参数中预留 AI/权重等开关，当前仅演示表单结构。</p>
    </el-card>

    <el-card>
      <el-form label-width="140px" :model="form">
        <el-form-item label="启用 AI 加权">
          <el-switch v-model="form.enableAi" />
        </el-form-item>
        <el-form-item label="行为权重（浏览/点赞/收藏/打卡）">
          <el-input v-model="form.behaviorWeight" placeholder="如 1/3/5/8" />
        </el-form-item>
        <el-form-item label="缓存时间（分钟）">
          <el-input-number v-model="form.cacheMinutes" :min="0" />
        </el-form-item>
        <el-form-item label="策略编号（A/B 预留）">
          <el-input v-model="form.strategyCode" placeholder="如 STRATEGY_A" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary">保存（占位）</el-button>
          <el-button>重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

const form = reactive({
  enableAi: true,
  behaviorWeight: '1/3/5/8',
  cacheMinutes: 30,
  strategyCode: 'STRATEGY_A'
});
</script>

<style scoped>
.mb-16 {
  margin-bottom: 16px;
}
.mt-12 {
  margin-top: 12px;
  color: #666;
}
</style>






















