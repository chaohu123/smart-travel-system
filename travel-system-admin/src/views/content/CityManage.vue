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
          <el-button
            type="danger"
            @click="handleBatchDelete"
          >
            {{ batchDeleteMode ? '取消删除' : '批量删除' }}
          </el-button>
          <el-button
            v-if="batchDeleteMode"
            type="danger"
            plain
            @click="handleConfirmDelete"
          >
            确认删除
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table
        :data="list"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          v-if="batchDeleteMode"
          type="selection"
          width="50"
        />
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="900px">
      <el-form :model="form" label-width="120px" ref="formRef" :rules="formRules">
        <el-form-item
          label="城市ID"
          prop="id"
          :rules="[{ required: true, message: '请输入城市ID', trigger: 'blur' }]"
        >
          <el-input-number
            v-model="form.id"
            :disabled="dialogTitle === '编辑城市'"
            :min="1"
            :placeholder="dialogTitle === '编辑城市' ? '城市ID（不可修改）' : '请输入城市ID'"
            style="width: 100%;"
          />
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            {{ dialogTitle === '编辑城市' ? '城市唯一标识ID，不可修改' : '城市唯一标识ID（必填）' }}
          </div>
        </el-form-item>
        <el-form-item label="城市名称" prop="cityName" :rules="[{ required: true, message: '请输入城市名称', trigger: 'blur' }]">
          <el-input v-model="form.cityName" placeholder="请输入城市名称" />
        </el-form-item>
        <el-form-item label="位置">
          <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
            <el-radio-group v-model="locationMode">
              <el-radio value="map">地图选点（推荐）</el-radio>
              <el-radio value="manual">手动填写</el-radio>
            </el-radio-group>
          </div>
        </el-form-item>
        <el-form-item label="省份" prop="province" :rules="[{ required: true, message: '请输入省份', trigger: 'blur' }]">
          <el-input
            v-model="form.province"
            :placeholder="locationMode === 'map' ? '省份（地图选点后自动填充）' : '请输入省份'"
            :disabled="locationMode === 'map' && form.province"
            clearable
          />
        </el-form-item>
        <el-form-item label="经纬度" v-if="form.latitude && form.longitude" style="margin-top: 12px;">
          <el-row :gutter="16">
            <el-col :span="12">
              <div style="display: flex; align-items: center;">
                <span style="min-width: 50px; color: #606266; margin-right: 8px;">纬度：</span>
                <el-input-number v-model="form.latitude" :precision="6" placeholder="纬度" style="flex: 1;" />
              </div>
            </el-col>
            <el-col :span="12">
              <div style="display: flex; align-items: center;">
                <span style="min-width: 50px; color: #606266; margin-right: 8px;">经度：</span>
                <el-input-number v-model="form.longitude" :precision="6" placeholder="经度" style="flex: 1;" />
              </div>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item label="国家">
          <el-input v-model="form.country" placeholder="请输入国家（可选）" />
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

    <!-- 地图选点组件 -->
    <MapPicker
      v-model="mapPickerVisible"
      :api-key="mapApiKey"
      :security-key="mapSecurityKey"
      :initial-location="initialMapLocation"
      :initial-search-keyword="form.cityName"
      @confirm="handleMapPickerConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed, watch, nextTick } from 'vue';
import {
  deleteCity,
  fetchCityList,
  createCity,
  updateCity,
  type City
} from '@/api/city';
import { ElMessage, ElMessageBox } from 'element-plus';
import MapPicker from '@/components/MapPicker.vue';
import { getMapApiKey, getMapSecurityKey } from '@/config/map';

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
const formRef = ref();
const locationMode = ref('manual');
const mapPickerVisible = ref(false);
const mapApiKey = ref(getMapApiKey());
const mapSecurityKey = ref(getMapSecurityKey());
const initialMapLocation = computed(() => ({
  latitude: form.latitude,
  longitude: form.longitude
}));

const formRules = {
  id: [{ required: true, message: '请输入城市ID', trigger: 'blur' }],
  cityName: [{ required: true, message: '请输入城市名称', trigger: 'blur' }],
  province: [{ required: true, message: '请输入省份', trigger: 'blur' }]
};

const form = reactive<City>({
  id: undefined,
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

const multipleSelection = ref<City[]>([]);
const batchDeleteMode = ref(false);

const handleSelectionChange = (val: City[]) => {
  multipleSelection.value = val;
};

const handleAdd = () => {
  dialogTitle.value = '新增城市';
  locationMode.value = 'manual';
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
  // 重置表单验证
  nextTick(() => {
    if (formRef.value) {
      formRef.value.clearValidate();
    }
  });
};

const handleEdit = (row: City) => {
  dialogTitle.value = '编辑城市';
  locationMode.value = 'manual';
  Object.assign(form, row);
  dialogVisible.value = true;
  // 重置表单验证
  nextTick(() => {
    if (formRef.value) {
      formRef.value.clearValidate();
    }
  });
};

// 监听位置模式变化，当选择地图选点时自动打开地图
watch(locationMode, (newVal) => {
  if (newVal === 'map') {
    openMapPicker();
  }
});

// 打开地图选点
const openMapPicker = () => {
  if (!mapApiKey.value) {
    ElMessage.warning('地图API Key未配置，请检查配置文件');
    locationMode.value = 'manual';
    return;
  }
  mapPickerVisible.value = true;
};

// 地图选点确认回调
const handleMapPickerConfirm = (location: any) => {
  // 自动填充表单字段
  form.latitude = location.latitude;
  form.longitude = location.longitude;

  // 根据地址信息自动填充省份
  if (location.province) {
    form.province = location.province;
  }

  ElMessage.success('位置信息已自动填充');
  // 保持地图选点模式，不切换回手动模式
};

const handleSubmit = async () => {
  // 验证表单
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch (error) {
    ElMessage.warning('请完成必填项后再提交');
    return;
  }

  // 验证必填字段
  if (!form.id) {
    ElMessage.warning('请输入城市ID');
    return;
  }

  try {
    if (form.id && dialogTitle.value === '编辑城市') {
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
          // 删除成功后，重置到第一页并刷新数据
          pagination.pageNum = 1;
          await loadData();
        } else {
          ElMessage.error(resp.data.msg || '删除失败');
        }
      } catch (e) {
        console.error('删除失败:', e);
        ElMessage.error('请求失败，请重试');
      }
    })
    .catch(() => {});
};

const handleBatchDelete = () => {
  if (batchDeleteMode.value) {
    // 取消删除：退出模式并清空选择
    batchDeleteMode.value = false;
    multipleSelection.value = [];
  } else {
    // 进入批量删除模式
    batchDeleteMode.value = true;
    multipleSelection.value = [];
    ElMessage.info('请选择要删除的城市');
  }
};

const handleConfirmDelete = () => {
  if (!batchDeleteMode.value) return;

  const ids = multipleSelection.value
    .map(item => item.id)
    .filter(id => typeof id === 'number') as number[];

  if (ids.length === 0) {
    ElMessage.warning('请选择要删除的城市');
    return;
  }

  ElMessageBox.confirm('确认删除所选数据吗？', '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  })
    .then(async () => {
      try {
        await Promise.all(ids.map(id => deleteCity(id)));
        ElMessage.success('批量删除成功');
        multipleSelection.value = [];
        batchDeleteMode.value = false;
        pagination.pageNum = 1;
        await loadData();
      } catch (e) {
        console.error('批量删除失败:', e);
        ElMessage.error('批量删除失败，请重试');
      }
    })
    .catch(() => {
      // 用户取消
    });
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














