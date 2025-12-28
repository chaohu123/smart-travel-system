<template>
  <div>
    <el-card class="mb-16">
      <el-alert
        title="后端接口未就绪：操作日志占位数据"
        type="warning"
        :closable="false"
      />
    </el-card>
    <el-card>
      <el-table :data="mockLogs" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="admin" label="管理员" width="120" />
        <el-table-column prop="action" label="操作" />
        <el-table-column prop="target" label="对象" />
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="result" label="结果" width="100">
          <template #default="{ row }">
            <el-tag :type="row.result === 'success' ? 'success' : 'danger'">
              {{ row.result === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
const mockLogs = [
  { id: 1, admin: 'admin', action: '审核游记', target: 'ID 1001', time: '2025-10-10 10:10', result: 'success' },
  { id: 2, admin: 'operator', action: '设为精选', target: 'ID 1002', time: '2025-10-10 11:20', result: 'success' },
  { id: 3, admin: 'admin', action: '删除评论', target: 'ID 888', time: '2025-10-10 12:00', result: 'success' }
];
</script>

<style scoped>
.mb-16 {
  margin-bottom: 16px;
}
</style>

























