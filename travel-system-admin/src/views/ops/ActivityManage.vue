<template>
  <div>
    <el-card class="mb-16">
      <el-alert
        title="后端接口未就绪：活动/专题列表使用占位数据"
        type="warning"
        :closable="false"
      />
      <p class="mt-12">支持配置时间段、关联线路/游记/景点/美食，接口就绪后替换为真实数据。</p>
    </el-card>

    <el-card>
      <el-table :data="mockActivities" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="活动/专题" />
        <el-table-column prop="timeRange" label="时间范围" width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'online' ? 'success' : 'info'">
              {{ row.status === 'online' ? '上线' : '下线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="highlight" label="亮点" />
        <el-table-column label="操作" width="180">
          <template #default>
            <el-button size="small" type="primary" text>编辑</el-button>
            <el-button size="small" type="danger" text>删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
const mockActivities = [
  { id: 1, name: '国庆长假 · 城市周边游', timeRange: '2025-10-01 ~ 2025-10-07', status: 'online', highlight: '精选3条周边线路' },
  { id: 2, name: '本地周末 · 亲子特辑', timeRange: '长期', status: 'online', highlight: '亲子标签线路+热门景点' },
  { id: 3, name: '美食节 · 夜经济', timeRange: '2025-11-01 ~ 2025-11-30', status: 'offline', highlight: '夜市美食+城市夜游' }
];
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
























