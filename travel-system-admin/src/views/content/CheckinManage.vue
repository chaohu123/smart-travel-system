<template>
  <div>
    <el-card class="mb-16">
      <el-form :inline="true" :model="query">
        <el-form-item label="打卡点名称">
          <el-input v-model="query.name" placeholder="请输入打卡点名称" clearable />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="query.targetType" placeholder="请选择类型" clearable style="width: 150px;">
            <el-option label="景点" value="scenic" />
            <el-option label="美食" value="food" />
          </el-select>
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
        <el-table-column prop="name" label="打卡点名称" min-width="150" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.targetType === 'scenic' ? 'success' : 'warning'">
              {{ row.targetType === 'scenic' ? '景点' : '美食' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="targetName" label="关联内容" min-width="150" />
        <el-table-column prop="location" label="地点" min-width="150" />
        <el-table-column prop="checkinCount" label="打卡次数" width="120" />
        <el-table-column prop="isActive" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive === 1 ? 'success' : 'info'">
              {{ row.isActive === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px">
      <el-form :model="form" label-width="120px" ref="formRef">
        <el-form-item label="打卡点名称" prop="name" :rules="[{ required: true, message: '请输入打卡点名称', trigger: 'blur' }]">
          <el-input v-model="form.name" placeholder="请输入打卡点名称" />
        </el-form-item>

        <el-form-item label="类型" prop="targetType" :rules="[{ required: true, message: '请选择类型', trigger: 'change' }]">
          <el-radio-group v-model="form.targetType" @change="handleTypeChange">
            <el-radio value="scenic">景点</el-radio>
            <el-radio value="food">美食</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="选择内容" prop="targetId" :rules="[{ required: true, message: '请选择关联的景点或美食', trigger: 'change' }]">
          <el-select
            v-model="form.targetId"
            :placeholder="form.targetType === 'scenic' ? '请选择景点' : '请选择美食'"
            filterable
            remote
            :remote-method="handleRemoteSearch"
            :loading="loadingOptions"
            clearable
            style="width: 100%"
            @change="handleTargetChange"
          >
            <el-option
              v-for="item in targetOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            >
              <span>{{ item.name }}</span>
              <span style="color: #8492a6; font-size: 13px; margin-left: 10px;">{{ item.location || item.address }}</span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="封面图片" prop="imageUrl">
          <el-upload
            class="avatar-uploader"
            :action="uploadAction"
            :show-file-list="false"
            :on-success="handleImageSuccess"
            :before-upload="beforeImageUpload"
          >
            <img v-if="form.imageUrl" :src="form.imageUrl" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div style="color: #909399; font-size: 12px; margin-top: 8px;">建议尺寸：16:9，大小不超过2MB</div>
        </el-form-item>

        <el-form-item label="地点" prop="location">
          <el-input v-model="form.location" placeholder="自动填充或手动输入地点" />
        </el-form-item>

        <el-form-item label="状态" prop="isActive">
          <el-radio-group v-model="form.isActive">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { fetchCheckinPointList, createCheckinPoint, updateCheckinPoint, deleteCheckinPoint, type CheckinPoint } from '@/api/checkin'
import { fetchScenicSpotList, type ScenicSpot } from '@/api/scenic'
import { fetchFoodList, type Food } from '@/api/food'
import http from '@/api/http'

const query = reactive({
  name: '',
  targetType: '' as 'scenic' | 'food' | '',
})

const list = ref<CheckinPoint[]>([])
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const dialogVisible = ref(false)
const dialogTitle = ref('新增打卡点')
const form = reactive<CheckinPoint>({
  name: '',
  targetType: 'scenic',
  targetId: undefined,
  targetName: '',
  imageUrl: '',
  location: '',
  isActive: 1,
})

const formRef = ref()
const batchDeleteMode = ref(false)
const selectedRows = ref<CheckinPoint[]>([])

const targetOptions = ref<Array<{ id: number; name: string; location?: string; address?: string }>>([])
const loadingOptions = ref(false)
const uploadAction = ref('http://localhost:8080/api/v1/admin/upload')

const loadList = async () => {
  try {
    const params: Partial<CheckinPoint & { pageNum?: number; pageSize?: number }> = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
    }
    if (query.name) {
      params.name = query.name
    }
    if (query.targetType) {
      params.targetType = query.targetType as 'scenic' | 'food'
    }
    const res = await fetchCheckinPointList(params)
    if (res.data.code === 200) {
      list.value = res.data.rows || []
      pagination.total = res.data.total || 0
    } else {
      ElMessage.error(res.data.msg || '加载失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '加载失败')
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  loadList()
}

const handleReset = () => {
  query.name = ''
  query.targetType = ''
  pagination.pageNum = 1
  loadList()
}

const handleAdd = () => {
  dialogTitle.value = '新增打卡点'
  Object.assign(form, {
    id: undefined,
    name: '',
    targetType: 'scenic',
    targetId: undefined,
    targetName: '',
    imageUrl: '',
    location: '',
    isActive: 1,
  })
  targetOptions.value = []
  dialogVisible.value = true
}

const handleEdit = (row: CheckinPoint) => {
  dialogTitle.value = '编辑打卡点'
  Object.assign(form, { ...row })
  // 加载关联内容信息
  if (form.targetId) {
    loadTargetOptions()
  }
  dialogVisible.value = true
}

const handleDelete = async (row: CheckinPoint) => {
  try {
    await ElMessageBox.confirm('确定要删除该打卡点吗？', '提示', {
      type: 'warning',
    })
    const res = await deleteCheckinPoint(row.id!)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      loadList()
    } else {
      ElMessage.error(res.data.msg || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handleBatchDelete = () => {
  batchDeleteMode.value = !batchDeleteMode.value
  if (!batchDeleteMode.value) {
    selectedRows.value = []
  }
}

const handleSelectionChange = (selection: CheckinPoint[]) => {
  selectedRows.value = selection
}

const handleConfirmDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的打卡点')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个打卡点吗？`, '提示', {
      type: 'warning',
    })
    // 批量删除
    const promises = selectedRows.value.map(row => deleteCheckinPoint(row.id!))
    await Promise.all(promises)
    ElMessage.success('删除成功')
    batchDeleteMode.value = false
    selectedRows.value = []
    loadList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handleTypeChange = () => {
  form.targetId = undefined
  form.targetName = ''
  targetOptions.value = []
}

const handleRemoteSearch = async (query: string) => {
  if (!query || query.length < 1) {
    targetOptions.value = []
    return
  }
  loadingOptions.value = true
  try {
    if (form.targetType === 'scenic') {
      const res = await fetchScenicSpotList({ name: query, pageNum: 1, pageSize: 20 })
      if (res.data.code === 200) {
        targetOptions.value = (res.data.rows || []).map(item => ({
          id: item.id!,
          name: item.name || '',
          location: item.address || item.city || '',
        }))
      }
    } else {
      const res = await fetchFoodList({ name: query, pageNum: 1, pageSize: 20 })
      if (res.data.code === 200) {
        targetOptions.value = (res.data.rows || []).map(item => ({
          id: item.id!,
          name: item.name || '',
          location: item.address || item.city || '',
        }))
      }
    }
  } catch (error) {
    console.error('搜索失败', error)
  } finally {
    loadingOptions.value = false
  }
}

const loadTargetOptions = async () => {
  if (!form.targetId) return
  try {
    if (form.targetType === 'scenic') {
      const res = await fetchScenicSpotList({ pageNum: 1, pageSize: 100 })
      if (res.data.code === 200) {
        const item = res.data.rows?.find(r => r.id === form.targetId)
        if (item) {
          targetOptions.value = [{
            id: item.id!,
            name: item.name || '',
            location: item.address || item.city || '',
          }]
          form.targetName = item.name || ''
          if (!form.location) {
            form.location = item.address || `${item.province || ''}${item.city || ''}`
          }
          if (!form.imageUrl && item.imageUrl) {
            form.imageUrl = item.imageUrl
          }
        }
      }
    } else {
      const res = await fetchFoodList({ pageNum: 1, pageSize: 100 })
      if (res.data.code === 200) {
        const item = res.data.rows?.find(r => r.id === form.targetId)
        if (item) {
          targetOptions.value = [{
            id: item.id!,
            name: item.name || '',
            location: item.address || item.city || '',
          }]
          form.targetName = item.name || ''
          if (!form.location) {
            form.location = item.address || `${item.province || ''}${item.city || ''}`
          }
          if (!form.imageUrl && item.imageUrl) {
            form.imageUrl = item.imageUrl
          }
        }
      }
    }
  } catch (error) {
    console.error('加载内容失败', error)
  }
}

const handleTargetChange = async (targetId: number) => {
  if (!targetId) {
    form.targetName = ''
    form.location = ''
    return
  }
  await loadTargetOptions()
}

const handleImageSuccess = (response: any) => {
  if (response.code === 200) {
    form.imageUrl = response.data || response.url
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(response.msg || '上传失败')
  }
}

const beforeImageUpload = (file: File) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('上传图片只能是 JPG/PNG/WEBP 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过 2MB!')
  }
  return isJPG && isLt2M
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    const res = form.id
      ? await updateCheckinPoint(form)
      : await createCheckinPoint(form)
    if (res.data.code === 200) {
      ElMessage.success(form.id ? '更新成功' : '创建成功')
      dialogVisible.value = false
      loadList()
    } else {
      ElMessage.error(res.data.msg || '操作失败')
    }
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || '操作失败')
    }
  }
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.pageNum = 1
  loadList()
}

const handleCurrentChange = (page: number) => {
  pagination.pageNum = page
  loadList()
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.mb-16 {
  margin-bottom: 16px;
}

.avatar-uploader {
  :deep(.avatar) {
    width: 200px;
    height: 112px;
    display: block;
    object-fit: cover;
    border-radius: 8px;
  }
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 200px;
  height: 112px;
  line-height: 112px;
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.avatar-uploader-icon:hover {
  border-color: #409eff;
}
</style>

