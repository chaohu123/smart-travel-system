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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="900px" :close-on-click-modal="false">
      <!-- 步骤条 -->
      <el-steps :active="currentStep" finish-status="success" style="margin-bottom: 30px;">
        <el-step title="基本信息" />
        <el-step title="选择关联内容" />
        <el-step title="图片和状态" />
      </el-steps>

      <el-form :model="form" label-width="120px" ref="formRef">
        <!-- 第一步：基本信息 -->
        <div v-show="currentStep === 0">
          <el-form-item label="打卡点名称" prop="name" :rules="[{ required: true, message: '请输入打卡点名称', trigger: 'blur' }]">
            <el-input v-model="form.name" placeholder="请输入打卡点名称" />
          </el-form-item>

          <el-form-item label="类型" prop="targetType" :rules="[{ required: true, message: '请选择类型', trigger: 'change' }]">
            <el-radio-group v-model="form.targetType" @change="handleTypeChange">
              <el-radio value="scenic">景点</el-radio>
              <el-radio value="food">美食</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="地点" prop="location">
            <el-input v-model="form.location" placeholder="自动填充或手动输入地点" />
          </el-form-item>
        </div>

        <!-- 第二步：选择关联内容 -->
        <div v-show="currentStep === 1">
          <el-form-item label="选择内容" prop="targetId" :rules="[{ required: true, message: '请选择关联的景点或美食', trigger: 'change' }]">
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
              <el-tag
                v-if="form.targetId && selectedTargetName"
                closable
                @close="handleClearTarget"
                size="large"
              >
                {{ selectedTargetName }}
              </el-tag>
            </div>
            <el-button type="primary" @click="openTargetDialog">
              {{ form.targetType === 'scenic' ? '选择景点' : '选择美食' }}
            </el-button>
          </el-form-item>
        </div>

        <!-- 第三步：图片和状态 -->
        <div v-show="currentStep === 2">
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

          <el-form-item label="状态" prop="isActive">
            <el-radio-group v-model="form.isActive">
              <el-radio :value="1">启用</el-radio>
              <el-radio :value="0">禁用</el-radio>
            </el-radio-group>
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <div style="display: flex; justify-content: space-between;">
          <el-button @click="dialogVisible = false">取消</el-button>
          <div>
            <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
            <el-button v-if="currentStep < 2" type="primary" @click="nextStep">下一步</el-button>
            <el-button v-if="currentStep === 2" type="primary" @click="handleSubmit">完成</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 关联内容选择对话框 -->
    <el-dialog
      v-model="targetDialogVisible"
      :title="targetDialogTitle"
      width="800px"
      :close-on-click-modal="false"
    >
      <div style="margin-bottom: 16px;">
        <el-input
          v-model="targetSearchKeyword"
          placeholder="请输入关键词搜索"
          clearable
          style="width: 300px;"
          @input="handleTargetSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      
      <el-table
        ref="targetTableRef"
        :data="targetList"
        style="width: 100%"
        max-height="400"
        :row-key="getTargetRowKey"
        @selection-change="handleTargetSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column
          v-if="form.targetType === 'scenic'"
          prop="name"
          label="景点名称"
        />
        <el-table-column
          v-if="form.targetType === 'food'"
          prop="name"
          label="美食名称"
        />
        <el-table-column
          v-if="form.targetType === 'scenic'"
          prop="city"
          label="城市"
          width="120"
        />
        <el-table-column
          v-if="form.targetType === 'food'"
          prop="foodType"
          label="类型"
          width="120"
        />
        <el-table-column
          v-if="form.targetType === 'scenic'"
          prop="address"
          label="地址"
          min-width="200"
        />
        <el-table-column
          v-if="form.targetType === 'food'"
          prop="address"
          label="地址"
          min-width="200"
        />
      </el-table>
      
      <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
        <el-pagination
          v-model:current-page="targetPagination.pageNum"
          v-model:page-size="targetPagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="targetPagination.total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleTargetSizeChange"
          @current-change="handleTargetCurrentChange"
        />
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="targetDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmTargetSelection">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
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
const currentStep = ref(0)

// 关联内容选择对话框相关
const targetDialogVisible = ref(false)
const targetDialogTitle = ref('选择景点')
const targetList = ref<any[]>([])
const targetSearchKeyword = ref('')
const targetPagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})
const targetSelectedItems = ref<any[]>([])
const targetTableRef = ref()
const selectedTargetName = ref('')

const uploadAction = ref('http://localhost:8080/api/v1/admin/upload')

const loadList = async () => {
  try {
    const params: any = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
    }
    if (query.name) {
      params.name = query.name
    }
    if (query.targetType) {
      params.targetType = query.targetType
    }
    
    console.log('加载打卡点列表，参数:', params)
    const res = await fetchCheckinPointList(params)
    console.log('打卡点列表响应:', res)
    
    if (res.data && res.data.code === 200) {
      list.value = res.data.rows || res.data.data || []
      pagination.total = res.data.total || 0
      console.log('打卡点列表加载成功，数量:', list.value.length, '总数:', pagination.total)
      
      // 如果返回空数据，给出提示
      if (list.value.length === 0 && pagination.total === 0) {
        console.info('打卡点列表为空，数据库中没有打卡点数据')
        ElMessage.info('暂无打卡点数据，请先添加打卡点')
      }
    } else {
      const errorMsg = res.data?.msg || '加载失败'
      console.error('打卡点API返回错误:', res.data)
      ElMessage.error(errorMsg)
      // 如果API返回错误，尝试使用空数组
      list.value = []
      pagination.total = 0
    }
  } catch (error: any) {
    console.error('加载打卡点列表失败，错误详情:', error)
    const errorMessage = error?.response?.data?.msg || error?.message || '加载失败，请检查网络连接'
    ElMessage.error(errorMessage)
    // 发生错误时，使用空数组
    list.value = []
    pagination.total = 0
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
  currentStep.value = 0
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
  selectedTargetName.value = ''
  targetList.value = []
  targetSearchKeyword.value = ''
  dialogVisible.value = true
  // 重置表单验证
  nextTick(() => {
    if (formRef.value) {
      formRef.value.clearValidate()
    }
  })
}

const handleEdit = async (row: CheckinPoint) => {
  dialogTitle.value = '编辑打卡点'
  currentStep.value = 0
  Object.assign(form, { ...row })
  // 加载关联内容信息
  if (form.targetId) {
    await loadTargetInfo()
  }
  dialogVisible.value = true
  // 重置表单验证
  nextTick(() => {
    if (formRef.value) {
      formRef.value.clearValidate()
    }
  })
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

// 步骤切换
const nextStep = async () => {
  if (!formRef.value) return

  // 验证当前步骤的表单字段
  const fieldsToValidate: string[] = []
  if (currentStep.value === 0) {
    fieldsToValidate.push('name', 'targetType')
  } else if (currentStep.value === 1) {
    fieldsToValidate.push('targetId')
  }

  if (fieldsToValidate.length > 0) {
    try {
      await formRef.value.validateField(fieldsToValidate)
      currentStep.value++
    } catch (error) {
      ElMessage.warning('请完成必填项后再继续')
    }
  } else {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const handleTypeChange = () => {
  form.targetId = undefined
  form.targetName = ''
  selectedTargetName.value = ''
  targetList.value = []
}

// 打开关联内容选择对话框
const openTargetDialog = async () => {
  if (!form.targetType) {
    ElMessage.warning('请先选择类型')
    return
  }
  targetSearchKeyword.value = ''
  targetPagination.pageNum = 1
  targetPagination.pageSize = 10
  targetSelectedItems.value = []
  targetDialogTitle.value = form.targetType === 'scenic' ? '选择景点' : '选择美食'
  
  await loadTargetList()
  targetDialogVisible.value = true
}

// 加载关联内容列表
const loadTargetList = async () => {
  try {
    const params: any = {
      pageNum: targetPagination.pageNum,
      pageSize: targetPagination.pageSize,
    }
    
    if (targetSearchKeyword.value) {
      params.name = targetSearchKeyword.value
    }
    
    let res: any
    if (form.targetType === 'scenic') {
      res = await fetchScenicSpotList(params)
    } else {
      res = await fetchFoodList(params)
    }
    
    if (res && res.data.code === 200) {
      targetList.value = res.data.rows || []
      targetPagination.total = res.data.total || 0
      
      // 设置已选中的项
      nextTick(() => {
        if (targetTableRef.value) {
          targetTableRef.value.clearSelection()
          if (form.targetId) {
            const selectedItem = targetList.value.find((item: any) => item.id === form.targetId)
            if (selectedItem) {
              targetTableRef.value.toggleRowSelection(selectedItem, true)
            }
          }
        }
      })
    }
  } catch (error) {
    console.error('加载关联内容列表失败', error)
    ElMessage.error('加载列表失败')
  }
}

// 搜索关联内容
const handleTargetSearch = () => {
  targetPagination.pageNum = 1
  loadTargetList()
}

// 关联内容分页大小改变
const handleTargetSizeChange = (size: number) => {
  targetPagination.pageSize = size
  targetPagination.pageNum = 1
  loadTargetList()
}

// 关联内容分页改变
const handleTargetCurrentChange = (page: number) => {
  targetPagination.pageNum = page
  loadTargetList()
}

// 获取表格行key
const getTargetRowKey = (row: any) => {
  return row.id
}

// 关联内容选择改变
const handleTargetSelectionChange = (selection: any[]) => {
  targetSelectedItems.value = selection
}

// 确认关联内容选择
const confirmTargetSelection = () => {
  if (targetSelectedItems.value.length === 0) {
    ElMessage.warning('请至少选择一项')
    return
  }
  
  // 只允许选择一个
  const selectedItem = targetSelectedItems.value[0]
  form.targetId = selectedItem.id
  form.targetName = selectedItem.name || ''
  selectedTargetName.value = selectedItem.name || ''
  
  // 自动填充地点和图片
  if (!form.location && selectedItem.address) {
    form.location = selectedItem.address
  }
  if (!form.imageUrl && selectedItem.imageUrl) {
    form.imageUrl = selectedItem.imageUrl
  }
  
  targetDialogVisible.value = false
  ElMessage.success('选择成功')
}

// 清除已选择的内容
const handleClearTarget = () => {
  form.targetId = undefined
  form.targetName = ''
  selectedTargetName.value = ''
  form.location = ''
  form.imageUrl = ''
}

// 加载已选中的关联内容信息
const loadTargetInfo = async () => {
  if (!form.targetId) return
  try {
    if (form.targetType === 'scenic') {
      const res = await fetchScenicSpotList({ pageNum: 1, pageSize: 100 })
      if (res.data.code === 200) {
        const item = res.data.rows?.find(r => r.id === form.targetId)
        if (item) {
          selectedTargetName.value = item.name || ''
          if (!form.location && item.address) {
            form.location = item.address
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
          selectedTargetName.value = item.name || ''
          if (!form.location && item.address) {
            form.location = item.address
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
    // 验证最后一步的表单字段
    try {
      await formRef.value.validateField(['imageUrl', 'isActive'])
    } catch (error) {
      ElMessage.warning('请完成必填项后再提交')
      return
    }
    
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
  :deep(.el-upload) {
    width: 200px !important;
    height: 112px !important;
    border: 1px dashed #d9d9d9;
    border-radius: 8px;
    overflow: hidden;
  }
  
  :deep(.avatar) {
    width: 200px !important;
    height: 112px !important;
    max-width: 200px !important;
    max-height: 112px !important;
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

