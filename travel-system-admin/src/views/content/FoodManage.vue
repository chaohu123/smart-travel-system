<template>
  <div>
    <el-card class="mb-16">
      <el-form :inline="true" :model="query">
        <el-form-item label="美食名称">
          <el-input v-model="query.name" placeholder="请输入美食名称" clearable />
        </el-form-item>
        <el-form-item label="城市ID">
          <el-input-number v-model="query.cityId" placeholder="城市ID" clearable />
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
        <el-table-column prop="name" label="美食名称" />
        <el-table-column prop="cityId" label="城市ID" width="100" />
        <el-table-column prop="foodType" label="类型" width="120" />
        <el-table-column prop="address" label="地址" />
        <el-table-column prop="avgPrice" label="均价" width="100" />
        <el-table-column prop="score" label="评分" width="100" />
        <el-table-column prop="isRecommend" label="推荐" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isRecommend === 1 ? 'success' : 'info'">
              {{ row.isRecommend === 1 ? '是' : '否' }}
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
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="美食名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="城市ID">
          <el-input-number v-model="form.cityId" />
        </el-form-item>
        <el-form-item label="类型">
          <el-input v-model="form.foodType" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" />
        </el-form-item>
        <el-form-item label="纬度">
          <el-input-number v-model="form.latitude" :precision="6" />
        </el-form-item>
        <el-form-item label="经度">
          <el-input-number v-model="form.longitude" :precision="6" />
        </el-form-item>
        <el-form-item label="均价">
          <el-input-number v-model="form.avgPrice" :precision="2" :min="0" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.intro" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="评分">
          <el-input-number v-model="form.score" :precision="1" :min="0" :max="5" />
        </el-form-item>
        <el-form-item label="推荐">
          <el-radio-group v-model="form.isRecommend">
            <el-radio :label="1">是</el-radio>
            <el-radio :label="0">否</el-radio>
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
  deleteFood,
  fetchFoodList,
  createFood,
  updateFood,
  type Food
} from '@/api/food';
import { ElMessage, ElMessageBox } from 'element-plus';

const query = reactive<Partial<Food>>({
  name: '',
  cityId: undefined
});

const list = ref<Food[]>([]);
const dialogVisible = ref(false);
const dialogTitle = ref('新增美食');
const form = reactive<Food>({
  name: '',
  cityId: undefined,
  foodType: '',
  address: '',
  latitude: undefined,
  longitude: undefined,
  avgPrice: undefined,
  intro: '',
  score: undefined,
  hotScore: 0,
  isRecommend: 0
});

const loadData = async () => {
  try {
    const resp = await fetchFoodList(query);
    if (resp.data.code === 200) {
      list.value = resp.data.rows;
    } else {
      ElMessage.error(resp.data.msg || '加载失败');
    }
  } catch (e) {
    ElMessage.error('请求失败');
  }
};

const handleSearch = () => {
  loadData();
};

const handleReset = () => {
  query.name = '';
  query.cityId = undefined;
  loadData();
};

const handleAdd = () => {
  dialogTitle.value = '新增美食';
  Object.assign(form, {
    id: undefined,
    name: '',
    cityId: undefined,
    foodType: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
    avgPrice: undefined,
    intro: '',
    score: undefined,
    hotScore: 0,
    isRecommend: 0
  });
  dialogVisible.value = true;
};

const handleEdit = (row: Food) => {
  dialogTitle.value = '编辑美食';
  Object.assign(form, row);
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  try {
    if (form.id) {
      const resp = await updateFood(form);
      if (resp.data.code === 200) {
        ElMessage.success('更新成功');
        dialogVisible.value = false;
        loadData();
      } else {
        ElMessage.error(resp.data.msg || '更新失败');
      }
    } else {
      const resp = await createFood(form);
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

const handleDelete = (row: Food) => {
  ElMessageBox.confirm(`确认删除美食「${row.name}」吗？`, '提示', {
    type: 'warning'
  })
    .then(async () => {
      try {
        const resp = await deleteFood(row.id!);
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



















