<template>
  <div>
    <el-card class="mb-16">
      <el-form :inline="true" :model="query" class="mt-12">
        <el-form-item label="昵称">
          <el-input v-model="query.nickname" placeholder="输入昵称" clearable />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="query.city" placeholder="输入城市" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="请选择" clearable style="width: 140px">
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="list" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="city" label="城市" />
        <el-table-column prop="createTime" label="注册时间" />
        <el-table-column prop="noteCount" label="游记数" width="90" />
        <el-table-column prop="checkinCount" label="打卡数" width="90" />
        <el-table-column prop="favoriteCount" label="收藏数" width="90" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="showDetail(row)">详情</el-button>
            <el-button
              size="small"
              type="warning"
              text
              @click="toggleStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-drawer v-model="detailVisible" title="用户详情" size="30%">
      <div v-if="detail">
        <p><b>ID：</b>{{ detail.id }}</p>
        <p><b>昵称：</b>{{ detail.nickname }}</p>
        <p><b>城市：</b>{{ detail.city }}</p>
        <p><b>状态：</b>{{ detail.status === 1 ? '正常' : '禁用' }}</p>
        <p><b>游记数：</b>{{ detail.noteCount ?? 0 }}</p>
        <p><b>收藏数：</b>{{ detail.favoriteCount ?? 0 }}</p>
        <p><b>打卡数：</b>{{ detail.checkinCount ?? 0 }}</p>
        <p><b>注册时间：</b>{{ detail.createTime }}</p>
      </div>
      <div v-else>加载中...</div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { fetchUserList, updateUserStatus, exportUserList, type AdminUser } from '@/api/user';
import { ElMessage } from 'element-plus';

const query = reactive({
  nickname: '',
  city: '',
  status: ''
});

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
});

const list = ref<AdminUser[]>([]);
const detail = ref<AdminUser | null>(null);
const detailVisible = ref(false);

const loadData = async () => {
  try {
    const params = {
      ...query,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    };
    const resp = await fetchUserList(params);
    if (resp.data.code === 200) {
      list.value = resp.data.rows;
      pagination.total = resp.data.total || 0;
    } else {
      ElMessage.error(resp.data.msg || '加载失败');
    }
  } catch (e) {
    ElMessage.error('请求失败');
  }
};

const handleSearch = () => {
  pagination.pageNum = 1; // 重置到第一页
  loadData();
};

const handleReset = () => {
  query.nickname = '';
  query.city = '';
  query.status = '';
  pagination.pageNum = 1; // 重置到第一页
  loadData();
};

const handleSizeChange = (val: number) => {
  pagination.pageSize = val;
  pagination.pageNum = 1; // 改变每页条数时重置到第一页
  loadData();
};

const handleCurrentChange = (val: number) => {
  pagination.pageNum = val;
  loadData();
};

const toggleStatus = async (row: AdminUser) => {
  if (!row.id) return;
  const next = row.status === 1 ? 0 : 1;
  try {
    const resp = await updateUserStatus({ id: row.id, status: next });
    if (resp.data.code === 200) {
      ElMessage.success(next === 1 ? '已启用' : '已禁用');
      loadData();
    } else {
      ElMessage.error(resp.data.msg || '操作失败');
    }
  } catch (e) {
    ElMessage.error('请求失败');
  }
};

const showDetail = (row: AdminUser) => {
  detail.value = row;
  detailVisible.value = true;
};

const handleExport = async () => {
  try {
    const resp = await exportUserList(query);
    const blob = new Blob([resp.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '用户列表.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    ElMessage.error('导出失败');
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.mb-16 {
  margin-bottom: 16px;
}
.mt-12 {
  margin-top: 12px;
}
</style>

