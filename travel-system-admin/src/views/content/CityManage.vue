<template>
  <div>
    <el-card class="mb-16">
      <el-form :inline="true" :model="query">
        <el-form-item label="城市名称">
          <el-input v-model="query.cityName" placeholder="请输入城市名称" clearable />
        </el-form-item>
        <el-form-item label="省份">
          <el-input v-model="query.province" placeholder="请输入省份" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleAdd">新增</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="list" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="cityName" label="城市名称" />
        <el-table-column prop="province" label="省份" />
        <el-table-column prop="country" label="国家" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" text @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="城市名称">
          <el-input v-model="form.cityName" />
        </el-form-item>
        <el-form-item label="省份">
          <el-input v-model="form.province" />
        </el-form-item>
        <el-form-item label="国家">
          <el-input v-model="form.country" />
        </el-form-item>
        <el-form-item label="纬度">
          <el-input-number v-model="form.latitude" :precision="6" />
        </el-form-item>
        <el-form-item label="经度">
          <el-input-number v-model="form.longitude" :precision="6" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import {
  deleteCity,
  fetchCityList,
  createCity,
  updateCity,
  type City
} from '@/api/city';
import { ElMessage, ElMessageBox } from 'element-plus';

const query = reactive<Partial<City>>({
  cityName: '',
  province: ''
});

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
});

const list = ref<City[]>([]);
const dialogVisible = ref(false);
const dialogTitle = ref('新增城市');
const form = reactive<City>({
  cityName: '',
  province: '',
  country: '',
  latitude: undefined,
  longitude: undefined,
  status: 1
});

const loadData = async () => {
  try {
    const params = {
      ...query,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    };
    const resp = await fetchCityList(params);
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
  query.cityName = '';
  query.province = '';
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

const handleAdd = () => {
  dialogTitle.value = '新增城市';
  Object.assign(form, {
    id: undefined,
    cityName: '',
    province: '',
    country: '',
    latitude: undefined,
    longitude: undefined,
    status: 1
  });
  dialogVisible.value = true;
};

const handleEdit = (row: City) => {
  dialogTitle.value = '编辑城市';
  Object.assign(form, row);
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  try {
    if (form.id) {
      const resp = await updateCity(form);
      if (resp.data.code === 200) {
        ElMessage.success('更新成功');
        dialogVisible.value = false;
        loadData();
      } else {
        ElMessage.error(resp.data.msg || '更新失败');
      }
    } else {
      const resp = await createCity(form);
      if (resp.data.code === 200) {
        ElMessage.success('创建成功');
        dialogVisible.value = false;
        loadData();
      } else {
        ElMessage.error(resp.data.msg || '创建失败');
      }
    }
  } catch (e) {
    ElMessage.error('请求失败');
  }
};

const handleDelete = (row: City) => {
  ElMessageBox.confirm(`确认删除城市「${row.cityName}」吗？`, '提示', {
    type: 'warning'
  })
    .then(async () => {
      try {
        const resp = await deleteCity(row.id!);
        if (resp.data.code === 200) {
          ElMessage.success('删除成功');
          loadData();
        } else {
          ElMessage.error(resp.data.msg || '删除失败');
        }
      } catch (e) {
        ElMessage.error('请求失败');
      }
    })
    .catch(() => {});
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.mb-16 {
  margin-bottom: 16px;
}
</style>














