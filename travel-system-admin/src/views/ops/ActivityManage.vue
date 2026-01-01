<template>
  <div>
    <el-card class="mb-16">
      <el-form :inline="true" :model="query">
        <el-form-item label="活动名称">
          <el-input v-model="query.name" placeholder="请输入活动名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="请选择状态" clearable style="width: 150px;">
            <el-option label="上线" value="online" />
            <el-option label="下线" value="offline" />
            <el-option label="即将开始" value="upcoming" />
            <el-option label="已结束" value="ended" />
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
        <el-table-column prop="name" label="活动名称" min-width="200" />
        <el-table-column label="时间范围" width="250">
          <template #default="{ row }">
            <span v-if="row.startTime || row.endTime">
              {{ formatTimeRange(row.startTime, row.endTime) }}
            </span>
            <span v-else>长期有效</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="highlight" label="亮点" min-width="150" />
        <el-table-column label="关联内容" width="200">
          <template #default="{ row }">
            <div class="related-counts">
              <span v-if="row.relatedRouteIds?.length" class="count-item">路线: {{ row.relatedRouteIds.length }}</span>
              <span v-if="row.relatedScenicIds?.length" class="count-item">景点: {{ row.relatedScenicIds.length }}</span>
              <span v-if="row.relatedFoodIds?.length" class="count-item">美食: {{ row.relatedFoodIds.length }}</span>
              <span v-if="row.relatedNoteIds?.length" class="count-item">游记: {{ row.relatedNoteIds.length }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="{ row }">
            <el-button size="small" type="success" text @click="handleViewParticipants(row)">查看报名人</el-button>
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
        <el-step title="活动内容和时间" />
        <el-step title="关联内容" />
      </el-steps>

      <el-form :model="form" label-width="120px" ref="formRef">
        <!-- 第一步：基本信息 -->
        <div v-show="currentStep === 0">
          <el-form-item label="活动名称" prop="name" :rules="[{ required: true, message: '请输入活动名称', trigger: 'blur' }]">
            <el-input v-model="form.name" placeholder="请输入活动名称" />
          </el-form-item>

          <el-form-item label="活动亮点" prop="highlight">
            <el-input v-model="form.highlight" placeholder="请输入活动亮点（简短描述）" maxlength="100" show-word-limit />
          </el-form-item>

          <el-form-item label="活动介绍" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="6"
              placeholder="请输入活动详细介绍"
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="活动规则" prop="rules">
            <el-input
              v-model="form.rules"
              type="textarea"
              :rows="6"
              placeholder="请输入活动规则（每行一条）"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="form.status">
              <el-radio value="online">上线</el-radio>
              <el-radio value="offline">下线</el-radio>
              <el-radio value="upcoming">即将开始</el-radio>
              <el-radio value="ended">已结束</el-radio>
            </el-radio-group>
          </el-form-item>
        </div>

        <!-- 第二步：活动内容和时间 -->
        <div v-show="currentStep === 1">
          <el-form-item label="封面图片" prop="imageUrl">
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <!-- URL输入方式 -->
              <div>
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
                  <el-input
                    v-model="urlImageInput"
                    placeholder="请输入图片URL，多个URL用逗号分隔"
                    @input="handleUrlInputChange"
                    clearable
                    style="flex: 1;"
                  />
                  <el-button
                    type="primary"
                    :disabled="previewUrlList.length === 0"
                    @click="handleAddUrlImages"
                  >
                    添加
                  </el-button>
                </div>
                <div style="color: #909399; font-size: 12px; margin-bottom: 8px;">输入URL后点击"添加"按钮将图片添加到列表</div>
                <!-- 预览区域 -->
                <div v-if="previewUrlList.length > 0" style="margin-bottom: 16px;">
                  <div style="color: #606266; font-size: 14px; margin-bottom: 8px;">预览图片（点击"添加"按钮添加到列表）：</div>
                  <div class="image-list">
                    <div v-for="(url, index) in previewUrlList" :key="'preview-' + index" class="image-item">
                      <img :src="getImageUrl(url)" class="image-preview-small" @error="handleImageError" />
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 本地上传 -->
              <div class="upload-container">
                <div class="upload-wrapper">
                  <el-upload
                    :action="uploadAction"
                    :show-file-list="false"
                    :on-success="handleImageSuccess"
                    :before-upload="beforeImageUpload"
                    :multiple="true"
                    class="multi-image-uploader"
                  >
                    <div class="upload-button">
                      <el-icon class="image-uploader-icon"><Plus /></el-icon>
                      <div style="margin-top: 8px; color: #8c939d; font-size: 12px;">点击上传</div>
                    </div>
                  </el-upload>
                  <div class="upload-tip">支持jpg/png格式，大小不超过2MB，可上传多张图片</div>
                </div>
              </div>
              
              <!-- 已添加的图片列表 -->
              <div v-if="activityImageList.length > 0" class="image-list">
                <div v-for="(url, index) in activityImageList" :key="'image-' + index" class="image-item">
                  <img :src="getImageUrl(url)" class="image-preview-small" @error="handleImageError" />
                  <el-button
                    type="danger"
                    size="small"
                    circle
                    class="image-delete-btn"
                    @click="removeActivityImage(index)"
                  >
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
              </div>
              
              <!-- 主封面图片（第一张） -->
              <div v-if="activityImageList.length > 0" style="margin-top: 8px;">
                <div style="color: #606266; font-size: 14px; margin-bottom: 8px;">主封面图片（第一张将作为活动封面）：</div>
                <div style="width: 200px; height: 112px; overflow: hidden; border-radius: 8px; border: 1px solid #dcdfe6;">
                  <img :src="getImageUrl(activityImageList[0])" style="width: 200px; height: 112px; object-fit: cover; display: block;" />
                </div>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="活动时间">
            <el-date-picker
              v-model="timeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
              @change="handleTimeRangeChange"
            />
            <div style="color: #909399; font-size: 12px; margin-top: 8px;">留空表示长期有效</div>
          </el-form-item>
        </div>

        <!-- 第三步：关联内容 -->
        <div v-show="currentStep === 2">
          <el-form-item label="关联路线">
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
              <el-tag
                v-for="routeId in form.relatedRouteIds"
                :key="routeId"
                closable
                @close="removeRelatedItem('route', routeId)"
              >
                {{ getRouteName(routeId) }}
              </el-tag>
            </div>
            <el-button type="primary" @click="openRelatedDialog('route')">添加路线</el-button>
          </el-form-item>

          <el-form-item label="关联景点">
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
              <el-tag
                v-for="scenicId in form.relatedScenicIds"
                :key="scenicId"
                closable
                @close="removeRelatedItem('scenic', scenicId)"
              >
                {{ getScenicName(scenicId) }}
              </el-tag>
            </div>
            <el-button type="primary" @click="openRelatedDialog('scenic')">添加景点</el-button>
          </el-form-item>

          <el-form-item label="关联美食">
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
              <el-tag
                v-for="foodId in form.relatedFoodIds"
                :key="foodId"
                closable
                @close="removeRelatedItem('food', foodId)"
              >
                {{ getFoodName(foodId) }}
              </el-tag>
            </div>
            <el-button type="primary" @click="openRelatedDialog('food')">添加美食</el-button>
          </el-form-item>

          <el-form-item label="关联游记">
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
              <el-tag
                v-for="noteId in form.relatedNoteIds"
                :key="noteId"
                closable
                @close="removeRelatedItem('note', noteId)"
              >
                {{ getNoteTitle(noteId) }}
              </el-tag>
            </div>
            <el-button type="primary" @click="openRelatedDialog('note')">添加游记</el-button>
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

    <!-- 报名人列表弹窗 -->
    <el-dialog v-model="participantsDialogVisible" :title="participantsDialogTitle" width="900px" :close-on-click-modal="false">
      <div v-loading="loadingParticipants">
        <el-table :data="participantsList" style="width: 100%" stripe>
          <el-table-column prop="nickname" label="用户昵称" min-width="120">
            <template #default="{ row }">
              <div style="display: flex; align-items: center; gap: 8px;">
                <el-avatar v-if="row.avatar" :src="row.avatar" :size="32" />
                <el-avatar v-else :size="32">{{ row.nickname?.charAt(0) || 'U' }}</el-avatar>
                <span>{{ row.nickname || '未知用户' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="city" label="城市" width="100" />
          <el-table-column prop="gender" label="性别" width="80">
            <template #default="{ row }">
              <span v-if="row.gender === 1">男</span>
              <span v-else-if="row.gender === 2">女</span>
              <span v-else>未知</span>
            </template>
          </el-table-column>
          <el-table-column prop="noteCount" label="游记数" width="90" />
          <el-table-column prop="checkinCount" label="打卡数" width="90" />
          <el-table-column prop="favoriteCount" label="收藏数" width="90" />
          <el-table-column prop="activityCount" label="报名活动次数" width="120" />
          <el-table-column prop="registrationTime" label="报名时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.registrationTime) }}
            </template>
          </el-table-column>
        </el-table>
        <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
          <el-pagination
            v-model:current-page="participantsPagination.pageNum"
            v-model:page-size="participantsPagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="participantsPagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleParticipantsSizeChange"
            @current-change="handleParticipantsCurrentChange"
          />
        </div>
      </div>
    </el-dialog>

    <!-- 关联内容选择对话框 -->
    <el-dialog
      v-model="relatedDialogVisible"
      :title="relatedDialogTitle"
      width="800px"
      :close-on-click-modal="false"
    >
      <div style="margin-bottom: 16px;">
        <el-input
          v-model="relatedSearchKeyword"
          placeholder="请输入关键词搜索"
          clearable
          style="width: 300px;"
          @input="handleRelatedSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      
      <el-table
        ref="relatedTableRef"
        :data="relatedList"
        style="width: 100%"
        max-height="400"
        :row-key="getRowKey"
        @selection-change="handleRelatedSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column
          v-if="currentRelatedType === 'route'"
          prop="routeName"
          label="路线名称"
        />
        <el-table-column
          v-if="currentRelatedType === 'scenic'"
          prop="name"
          label="景点名称"
        />
        <el-table-column
          v-if="currentRelatedType === 'food'"
          prop="name"
          label="美食名称"
        />
        <el-table-column
          v-if="currentRelatedType === 'note'"
          prop="title"
          label="游记标题"
        />
        <el-table-column
          v-if="currentRelatedType === 'route'"
          prop="days"
          label="天数"
          width="80"
        />
        <el-table-column
          v-if="currentRelatedType === 'scenic'"
          prop="city"
          label="城市"
          width="120"
        />
        <el-table-column
          v-if="currentRelatedType === 'food'"
          prop="foodType"
          label="类型"
          width="120"
        />
        <el-table-column
          v-if="currentRelatedType === 'note'"
          prop="authorName"
          label="作者"
          width="120"
        />
      </el-table>
      
      <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
        <el-pagination
          v-model:current-page="relatedPagination.pageNum"
          v-model:page-size="relatedPagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="relatedPagination.total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleRelatedSizeChange"
          @current-change="handleRelatedCurrentChange"
        />
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="relatedDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmRelatedSelection">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Close, Search } from '@element-plus/icons-vue'
import { fetchActivityList, createActivity, updateActivity, deleteActivity, fetchActivityParticipants, batchDeleteActivity, type Activity, type ActivityParticipant } from '@/api/activity'
import { fetchRouteList, type TravelRoute } from '@/api/route'
import { fetchScenicSpotList, type ScenicSpot } from '@/api/scenic'
import { fetchFoodList, type Food } from '@/api/food'
import { fetchTravelNoteList, type TravelNote } from '@/api/travelNote'
import http from '@/api/http'

const query = reactive({
  name: '',
  status: '' as 'online' | 'offline' | 'upcoming' | 'ended' | '',
})

const list = ref<Activity[]>([])
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const dialogVisible = ref(false)
const dialogTitle = ref('新增活动')
const form = reactive<Activity>({
  name: '',
  highlight: '',
  description: '',
  rules: '',
  imageUrl: '',
  startTime: '',
  endTime: '',
  status: 'online',
  relatedRouteIds: [],
  relatedScenicIds: [],
  relatedFoodIds: [],
  relatedNoteIds: [],
})

const formRef = ref()
const timeRange = ref<[string, string] | null>(null)
const uploadAction = ref('http://localhost:8080/api/v1/admin/upload/image')
const currentStep = ref(0)
const activityImageList = ref<string[]>([])
const urlImageInput = ref('')
const previewUrlList = ref<string[]>([])

// 关联内容对话框相关
const relatedDialogVisible = ref(false)
const relatedDialogTitle = ref('')
const currentRelatedType = ref<'route' | 'scenic' | 'food' | 'note'>('route')
const relatedList = ref<any[]>([])
const relatedSearchKeyword = ref('')
const relatedPagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})
const relatedSelectedItems = ref<any[]>([])
const relatedNameMap = ref<Map<number, string>>(new Map())
const relatedTableRef = ref()

// 获取表格行key
const getRowKey = (row: any) => {
  return row.id
}

// 关联内容选项
const routeOptions = ref<Array<{ id?: number; routeName?: string }>>([])
const scenicOptions = ref<Array<{ id?: number; name?: string }>>([])
const foodOptions = ref<Array<{ id?: number; name?: string }>>([])
const noteOptions = ref<Array<{ id?: number; title?: string }>>([])

const loadingRoutes = ref(false)
const loadingScenics = ref(false)
const loadingFoods = ref(false)
const loadingNotes = ref(false)

// 批量删除相关
const batchDeleteMode = ref(false)
const multipleSelection = ref<Activity[]>([])

// 报名人列表相关
const participantsDialogVisible = ref(false)
const participantsDialogTitle = ref('报名人列表')
const participantsList = ref<ActivityParticipant[]>([])
const loadingParticipants = ref(false)
const currentActivityId = ref<number | null>(null)
const participantsPagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const loadList = async () => {
  try {
    const params: Partial<Activity & { pageNum?: number; pageSize?: number }> = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
    }
    if (query.name) {
      params.name = query.name
    }
    if (query.status) {
      params.status = query.status as any
    }
    const res = await fetchActivityList(params)
    if (res.data.code === 200) {
      list.value = res.data.rows || []
      pagination.total = res.data.total || 0
      // 如果返回空数据，给出提示
      if (list.value.length === 0 && pagination.total === 0) {
        console.info('活动列表为空，数据库中没有活动数据')
      }
    } else {
      ElMessage.error(res.data.msg || '加载失败')
      // API返回错误时，如果后端未就绪，使用模拟数据
      if (res.data.code === 500 || res.data.code === 404) {
        console.warn('活动API返回错误，使用模拟数据', res.data.msg)
        list.value = [
          { id: 1, name: '国庆长假 · 城市周边游', startTime: '2025-10-01T00:00:00', endTime: '2025-10-07T23:59:59', status: 'online', highlight: '精选3条周边线路', relatedRouteIds: [1, 2], relatedScenicIds: [1], relatedFoodIds: [1] },
          { id: 2, name: '本地周末 · 亲子特辑', status: 'online', highlight: '亲子标签线路+热门景点', relatedRouteIds: [2], relatedScenicIds: [1, 2] },
          { id: 3, name: '美食节 · 夜经济', startTime: '2025-11-01T00:00:00', endTime: '2025-11-30T23:59:59', status: 'offline', highlight: '夜市美食+城市夜游', relatedFoodIds: [1, 2] }
        ]
        pagination.total = list.value.length
      }
    }
  } catch (error: any) {
    // API未就绪时使用模拟数据
    console.warn('活动API调用失败，使用模拟数据', error)
    ElMessage.warning('后端服务未连接，显示模拟数据')
    list.value = [
      { id: 1, name: '国庆长假 · 城市周边游', startTime: '2025-10-01T00:00:00', endTime: '2025-10-07T23:59:59', status: 'online', highlight: '精选3条周边线路', relatedRouteIds: [1, 2], relatedScenicIds: [1], relatedFoodIds: [1] },
      { id: 2, name: '本地周末 · 亲子特辑', status: 'online', highlight: '亲子标签线路+热门景点', relatedRouteIds: [2], relatedScenicIds: [1, 2] },
      { id: 3, name: '美食节 · 夜经济', startTime: '2025-11-01T00:00:00', endTime: '2025-11-30T23:59:59', status: 'offline', highlight: '夜市美食+城市夜游', relatedFoodIds: [1, 2] }
    ]
    pagination.total = list.value.length
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  loadList()
}

const handleReset = () => {
  query.name = ''
  query.status = ''
  pagination.pageNum = 1
  loadList()
}

const handleAdd = () => {
  dialogTitle.value = '新增活动'
  currentStep.value = 0
  Object.assign(form, {
    id: undefined,
    name: '',
    highlight: '',
    description: '',
    rules: '',
    imageUrl: '',
    startTime: '',
    endTime: '',
    status: 'online',
    relatedRouteIds: [],
    relatedScenicIds: [],
    relatedFoodIds: [],
    relatedNoteIds: [],
  })
  timeRange.value = null
  routeOptions.value = []
  scenicOptions.value = []
  foodOptions.value = []
  noteOptions.value = []
  activityImageList.value = []
  urlImageInput.value = ''
  previewUrlList.value = []
  dialogVisible.value = true
}

const handleEdit = async (row: Activity) => {
  dialogTitle.value = '编辑活动'
  currentStep.value = 0
  Object.assign(form, { ...row })
  if (form.startTime && form.endTime) {
    timeRange.value = [form.startTime, form.endTime]
  } else {
    timeRange.value = null
  }
  // 初始化图片列表（如果有图片URL，添加到列表）
  if (form.imageUrl) {
    activityImageList.value = [form.imageUrl]
  } else {
    activityImageList.value = []
  }
  urlImageInput.value = ''
  previewUrlList.value = []
  // 加载关联内容选项和名称映射
  await loadRelatedOptions()
  await loadRelatedNames()
  dialogVisible.value = true
}

// 加载已选中的关联内容名称
const loadRelatedNames = async () => {
  relatedNameMap.value.clear()
  
  // 加载路线名称
  if (form.relatedRouteIds && form.relatedRouteIds.length > 0) {
    try {
      const res = await fetchRouteList({ pageNum: 1, pageSize: 100 })
      if (res.data.code === 200) {
        res.data.rows.forEach((item: TravelRoute) => {
          if (form.relatedRouteIds.includes(item.id!)) {
            relatedNameMap.value.set(item.id!, item.routeName || '')
          }
        })
      }
    } catch (error) {
      console.error('加载路线名称失败', error)
    }
  }
  
  // 加载景点名称
  if (form.relatedScenicIds && form.relatedScenicIds.length > 0) {
    try {
      const res = await fetchScenicSpotList({ pageNum: 1, pageSize: 100 })
      if (res.data.code === 200) {
        res.data.rows.forEach((item: ScenicSpot) => {
          if (form.relatedScenicIds.includes(item.id!)) {
            relatedNameMap.value.set(item.id!, item.name || '')
          }
        })
      }
    } catch (error) {
      console.error('加载景点名称失败', error)
    }
  }
  
  // 加载美食名称
  if (form.relatedFoodIds && form.relatedFoodIds.length > 0) {
    try {
      const res = await fetchFoodList({ pageNum: 1, pageSize: 100 })
      if (res.data.code === 200) {
        res.data.rows.forEach((item: Food) => {
          if (form.relatedFoodIds.includes(item.id!)) {
            relatedNameMap.value.set(item.id!, item.name || '')
          }
        })
      }
    } catch (error) {
      console.error('加载美食名称失败', error)
    }
  }
  
  // 加载游记标题
  if (form.relatedNoteIds && form.relatedNoteIds.length > 0) {
    try {
      const res = await fetchTravelNoteList({ pageNum: 1, pageSize: 100 })
      if (res.data.code === 200) {
        res.data.rows.forEach((item: TravelNote) => {
          if (form.relatedNoteIds.includes(item.id!)) {
            relatedNameMap.value.set(item.id!, item.title || '')
          }
        })
      }
    } catch (error) {
      console.error('加载游记标题失败', error)
    }
  }
}

const nextStep = () => {
  if (currentStep.value < 2) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const handleDelete = async (row: Activity) => {
  try {
    await ElMessageBox.confirm('确定要删除该活动吗？', '提示', {
      type: 'warning',
    })
    try {
      await deleteActivity(row.id!)
      ElMessage.success('删除成功')
      loadList()
    } catch (error: any) {
      ElMessage.error(error.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handleTimeRangeChange = (val: [string, string] | null) => {
  if (val && val.length === 2) {
    form.startTime = val[0]
    form.endTime = val[1]
  } else {
    form.startTime = ''
    form.endTime = ''
  }
}

const handleRouteSearch = async (query: string) => {
  if (!query || query.length < 1) {
    routeOptions.value = []
    return
  }
  loadingRoutes.value = true
  try {
    const res = await fetchRouteList({ routeName: query, pageNum: 1, pageSize: 20 })
    if (res.data.code === 200) {
      routeOptions.value = (res.data.rows || []).map(item => ({
        id: item.id,
        routeName: item.routeName,
      }))
    }
  } catch (error) {
    console.error('搜索路线失败', error)
  } finally {
    loadingRoutes.value = false
  }
}

const handleScenicSearch = async (query: string) => {
  if (!query || query.length < 1) {
    scenicOptions.value = []
    return
  }
  loadingScenics.value = true
  try {
    const res = await fetchScenicSpotList({ name: query, pageNum: 1, pageSize: 20 })
    if (res.data.code === 200) {
      scenicOptions.value = (res.data.rows || []).map(item => ({
        id: item.id,
        name: item.name,
      }))
    }
  } catch (error) {
    console.error('搜索景点失败', error)
  } finally {
    loadingScenics.value = false
  }
}

const handleFoodSearch = async (query: string) => {
  if (!query || query.length < 1) {
    foodOptions.value = []
    return
  }
  loadingFoods.value = true
  try {
    const res = await fetchFoodList({ name: query, pageNum: 1, pageSize: 20 })
    if (res.data.code === 200) {
      foodOptions.value = (res.data.rows || []).map(item => ({
        id: item.id,
        name: item.name,
      }))
    }
  } catch (error) {
    console.error('搜索美食失败', error)
  } finally {
    loadingFoods.value = false
  }
}

const handleNoteSearch = async (query: string) => {
  if (!query || query.length < 1) {
    noteOptions.value = []
    return
  }
  loadingNotes.value = true
  try {
    const res = await fetchTravelNoteList({ title: query, pageNum: 1, pageSize: 20 })
    if (res.data.code === 200) {
      noteOptions.value = (res.data.rows || []).map(item => ({
        id: item.id,
        title: item.title,
      }))
    }
  } catch (error) {
    console.error('搜索游记失败', error)
  } finally {
    loadingNotes.value = false
  }
}

// 获取当前类型的已选中ID列表
const getCurrentRelatedIds = (): number[] => {
  if (currentRelatedType.value === 'route') {
    return form.relatedRouteIds || []
  } else if (currentRelatedType.value === 'scenic') {
    return form.relatedScenicIds || []
  } else if (currentRelatedType.value === 'food') {
    return form.relatedFoodIds || []
  } else if (currentRelatedType.value === 'note') {
    return form.relatedNoteIds || []
  }
  return []
}

// 打开关联内容对话框
const openRelatedDialog = async (type: 'route' | 'scenic' | 'food' | 'note') => {
  currentRelatedType.value = type
  relatedSearchKeyword.value = ''
  relatedPagination.pageNum = 1
  relatedPagination.pageSize = 10
  relatedSelectedItems.value = []
  
  const titles = {
    route: '选择路线',
    scenic: '选择景点',
    food: '选择美食',
    note: '选择游记'
  }
  relatedDialogTitle.value = titles[type]
  
  await loadRelatedList()
  relatedDialogVisible.value = true
}

// 加载关联内容列表
const loadRelatedList = async () => {
  try {
    const params: any = {
      pageNum: relatedPagination.pageNum,
      pageSize: relatedPagination.pageSize,
    }
    
    if (relatedSearchKeyword.value) {
      if (currentRelatedType.value === 'route') {
        params.routeName = relatedSearchKeyword.value
      } else if (currentRelatedType.value === 'scenic') {
        params.name = relatedSearchKeyword.value
      } else if (currentRelatedType.value === 'food') {
        params.name = relatedSearchKeyword.value
      } else if (currentRelatedType.value === 'note') {
        params.title = relatedSearchKeyword.value
      }
    }
    
    let res: any
    if (currentRelatedType.value === 'route') {
      res = await fetchRouteList(params)
    } else if (currentRelatedType.value === 'scenic') {
      res = await fetchScenicSpotList(params)
    } else if (currentRelatedType.value === 'food') {
      res = await fetchFoodList(params)
    } else if (currentRelatedType.value === 'note') {
      res = await fetchTravelNoteList(params)
    }
    
    if (res && res.data.code === 200) {
      relatedList.value = res.data.rows || []
      relatedPagination.total = res.data.total || 0
      
      // 更新名称映射
      relatedList.value.forEach((item: any) => {
        if (currentRelatedType.value === 'route') {
          relatedNameMap.value.set(item.id, item.routeName)
        } else if (currentRelatedType.value === 'scenic') {
          relatedNameMap.value.set(item.id, item.name)
        } else if (currentRelatedType.value === 'food') {
          relatedNameMap.value.set(item.id, item.name)
        } else if (currentRelatedType.value === 'note') {
          relatedNameMap.value.set(item.id, item.title)
        }
      })
      
      // 设置已选中的项
      nextTick(() => {
        if (relatedTableRef.value) {
          relatedTableRef.value.clearSelection()
          const currentIds = getCurrentRelatedIds()
          relatedList.value.forEach((item: any) => {
            if (currentIds.includes(item.id)) {
              relatedTableRef.value.toggleRowSelection(item, true)
            }
          })
        }
      })
    }
  } catch (error) {
    console.error('加载关联内容列表失败', error)
    ElMessage.error('加载列表失败')
  }
}

// 搜索关联内容
const handleRelatedSearch = () => {
  relatedPagination.pageNum = 1
  loadRelatedList()
}

// 关联内容分页大小改变
const handleRelatedSizeChange = (size: number) => {
  relatedPagination.pageSize = size
  relatedPagination.pageNum = 1
  loadRelatedList()
}

// 关联内容分页改变
const handleRelatedCurrentChange = (page: number) => {
  relatedPagination.pageNum = page
  loadRelatedList()
}

// 关联内容选择改变
const handleRelatedSelectionChange = (selection: any[]) => {
  relatedSelectedItems.value = selection
}

// 确认关联内容选择
const confirmRelatedSelection = () => {
  const selectedIds = relatedSelectedItems.value.map(item => item.id)
  
  if (currentRelatedType.value === 'route') {
    // 合并已选中的ID，去重
    const existingIds = form.relatedRouteIds || []
    const newIds = [...new Set([...existingIds, ...selectedIds])]
    form.relatedRouteIds = newIds
  } else if (currentRelatedType.value === 'scenic') {
    const existingIds = form.relatedScenicIds || []
    const newIds = [...new Set([...existingIds, ...selectedIds])]
    form.relatedScenicIds = newIds
  } else if (currentRelatedType.value === 'food') {
    const existingIds = form.relatedFoodIds || []
    const newIds = [...new Set([...existingIds, ...selectedIds])]
    form.relatedFoodIds = newIds
  } else if (currentRelatedType.value === 'note') {
    const existingIds = form.relatedNoteIds || []
    const newIds = [...new Set([...existingIds, ...selectedIds])]
    form.relatedNoteIds = newIds
  }
  
  relatedDialogVisible.value = false
  ElMessage.success(`已添加 ${selectedIds.length} 项`)
}

// 移除关联项
const removeRelatedItem = (type: 'route' | 'scenic' | 'food' | 'note', id: number) => {
  if (type === 'route') {
    form.relatedRouteIds = form.relatedRouteIds.filter(routeId => routeId !== id)
  } else if (type === 'scenic') {
    form.relatedScenicIds = form.relatedScenicIds.filter(scenicId => scenicId !== id)
  } else if (type === 'food') {
    form.relatedFoodIds = form.relatedFoodIds.filter(foodId => foodId !== id)
  } else if (type === 'note') {
    form.relatedNoteIds = form.relatedNoteIds.filter(noteId => noteId !== id)
  }
}

// 获取关联项名称
const getRouteName = (id: number) => {
  return relatedNameMap.value.get(id) || routeOptions.value.find(r => r.id === id)?.routeName || `路线${id}`
}

const getScenicName = (id: number) => {
  return relatedNameMap.value.get(id) || scenicOptions.value.find(s => s.id === id)?.name || `景点${id}`
}

const getFoodName = (id: number) => {
  return relatedNameMap.value.get(id) || foodOptions.value.find(f => f.id === id)?.name || `美食${id}`
}

const getNoteTitle = (id: number) => {
  return relatedNameMap.value.get(id) || noteOptions.value.find(n => n.id === id)?.title || `游记${id}`
}

const loadRelatedOptions = async () => {
  // 加载已选中的关联内容
  if (form.relatedRouteIds && form.relatedRouteIds.length > 0) {
    try {
      const res = await fetchRouteList({ pageNum: 1, pageSize: 100 })
      if (res.data.code === 200) {
        routeOptions.value = (res.data.rows || [])
          .filter(item => form.relatedRouteIds?.includes(item.id!))
          .map(item => ({ id: item.id, routeName: item.routeName }))
      }
    } catch (error) {
      console.error('加载路线选项失败', error)
    }
  }
  if (form.relatedScenicIds && form.relatedScenicIds.length > 0) {
    try {
      const res = await fetchScenicSpotList({ pageNum: 1, pageSize: 100 })
      if (res.data.code === 200) {
        scenicOptions.value = (res.data.rows || [])
          .filter(item => form.relatedScenicIds?.includes(item.id!))
          .map(item => ({ id: item.id, name: item.name }))
      }
    } catch (error) {
      console.error('加载景点选项失败', error)
    }
  }
  if (form.relatedFoodIds && form.relatedFoodIds.length > 0) {
    try {
      const res = await fetchFoodList({ pageNum: 1, pageSize: 100 })
      if (res.data.code === 200) {
        foodOptions.value = (res.data.rows || [])
          .filter(item => form.relatedFoodIds?.includes(item.id!))
          .map(item => ({ id: item.id, name: item.name }))
      }
    } catch (error) {
      console.error('加载美食选项失败', error)
    }
  }
  if (form.relatedNoteIds && form.relatedNoteIds.length > 0) {
    try {
      const res = await fetchTravelNoteList({ pageNum: 1, pageSize: 100 })
      if (res.data.code === 200) {
        noteOptions.value = (res.data.rows || [])
          .filter(item => form.relatedNoteIds?.includes(item.id!))
          .map(item => ({ id: item.id, title: item.title }))
      }
    } catch (error) {
      console.error('加载游记选项失败', error)
    }
  }
}

const handleImageSuccess = (response: any, file: any) => {
  if (response && response.code === 200) {
    const imageUrl = response.data?.url || response.data || response.url
    if (imageUrl) {
      activityImageList.value.push(imageUrl)
      // 第一张图片作为主封面
      if (activityImageList.value.length === 1) {
        form.imageUrl = imageUrl
      }
      ElMessage.success('图片上传成功')
    } else {
      ElMessage.error('图片URL获取失败')
    }
  } else {
    ElMessage.error(response?.msg || '图片上传失败')
  }
}

const beforeImageUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('上传文件只能是图片格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 解析URL字符串为URL数组
const parseUrlString = (inputText: string): string[] => {
  if (!inputText.trim()) {
    return []
  }
  const urls = inputText
    .split(/[,，]/)
    .map(url => url.trim())
    .filter(url => url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')))
  return urls
}

// 处理URL输入框变化事件（实时解析）
const handleUrlInputChange = () => {
  previewUrlList.value = parseUrlString(urlImageInput.value)
}

// 添加预览的URL图片到列表
const handleAddUrlImages = () => {
  if (previewUrlList.value.length > 0) {
    const count = previewUrlList.value.length
    activityImageList.value.push(...previewUrlList.value)
    // 第一张图片作为主封面
    if (activityImageList.value.length === count) {
      form.imageUrl = activityImageList.value[0]
    }
    urlImageInput.value = ''
    previewUrlList.value = []
    ElMessage.success(`成功添加 ${count} 张图片`)
  }
}

// 移除活动图片
const removeActivityImage = (index: number) => {
  activityImageList.value.splice(index, 1)
  // 更新主封面为第一张图片
  if (activityImageList.value.length > 0) {
    form.imageUrl = activityImageList.value[0]
  } else {
    form.imageUrl = ''
  }
}

// 获取完整的图片URL
const getImageUrl = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  if (url.startsWith('/')) {
    return `http://localhost:8080${url}`
  }
  return url
}

// 处理图片加载错误
const handleImageError = (event: any) => {
  console.error('图片加载失败:', event.target.src)
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    
    // 确保主封面图片是图片列表的第一张
    if (activityImageList.value.length > 0) {
      form.imageUrl = activityImageList.value[0]
    }
    
    try {
      const res = form.id
        ? await updateActivity(form)
        : await createActivity(form)
      if (res.data.code === 200) {
        ElMessage.success(form.id ? '更新成功' : '创建成功')
        dialogVisible.value = false
        loadList()
      } else {
        ElMessage.error(res.data.msg || '操作失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '操作失败')
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

const formatTimeRange = (start?: string, end?: string) => {
  if (!start && !end) return '长期有效'
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
  if (start && end) {
    return `${formatDate(start)} ~ ${formatDate(end)}`
  }
  if (start) {
    return `${formatDate(start)} 开始`
  }
  if (end) {
    return `${formatDate(end)} 结束`
  }
  return ''
}

const getStatusType = (status?: string) => {
  if (status === 'online') return 'success'
  if (status === 'upcoming') return 'warning'
  if (status === 'ended' || status === 'offline') return 'info'
  return 'info'
}

const getStatusText = (status?: string) => {
  if (status === 'online') return '上线'
  if (status === 'upcoming') return '即将开始'
  if (status === 'ended') return '已结束'
  if (status === 'offline') return '下线'
  return '未知'
}

const handleViewParticipants = async (row: Activity) => {
  if (!row.id) {
    ElMessage.error('活动ID不存在')
    return
  }
  currentActivityId.value = row.id
  participantsDialogTitle.value = `报名人列表 - ${row.name}`
  participantsPagination.pageNum = 1
  participantsPagination.pageSize = 10
  participantsDialogVisible.value = true
  await loadParticipants()
}

const loadParticipants = async () => {
  if (!currentActivityId.value) return
  
  loadingParticipants.value = true
  try {
    const res = await fetchActivityParticipants(currentActivityId.value, {
      pageNum: participantsPagination.pageNum,
      pageSize: participantsPagination.pageSize,
    })
    if (res.data.code === 200) {
      participantsList.value = res.data.rows || []
      participantsPagination.total = res.data.total || 0
    } else {
      ElMessage.error(res.data.msg || '加载失败')
    }
  } catch (error: any) {
    console.error('加载报名人列表失败', error)
    ElMessage.error('加载报名人列表失败')
    // 使用模拟数据
    participantsList.value = [
      {
        id: 1,
        activityId: currentActivityId.value,
        userId: 1,
        registrationTime: new Date().toISOString(),
        nickname: '测试用户1',
        avatar: '',
        city: '北京',
        gender: 1,
        noteCount: 5,
        checkinCount: 10,
        favoriteCount: 8,
        activityCount: 3,
      },
      {
        id: 2,
        activityId: currentActivityId.value,
        userId: 2,
        registrationTime: new Date().toISOString(),
        nickname: '测试用户2',
        avatar: '',
        city: '上海',
        gender: 2,
        noteCount: 3,
        checkinCount: 7,
        favoriteCount: 5,
        activityCount: 2,
      },
    ]
    participantsPagination.total = participantsList.value.length
  } finally {
    loadingParticipants.value = false
  }
}

const handleParticipantsSizeChange = (size: number) => {
  participantsPagination.pageSize = size
  participantsPagination.pageNum = 1
  loadParticipants()
}

const handleParticipantsCurrentChange = (page: number) => {
  participantsPagination.pageNum = page
  loadParticipants()
}

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const handleBatchDelete = () => {
  batchDeleteMode.value = !batchDeleteMode.value
  if (!batchDeleteMode.value) {
    multipleSelection.value = []
  }
}

const handleSelectionChange = (selection: Activity[]) => {
  multipleSelection.value = selection
}

const handleConfirmDelete = async () => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请至少选择一个活动')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${multipleSelection.value.length} 个活动吗？`,
      '批量删除确认',
      {
        type: 'warning',
      }
    )
    
    const ids = multipleSelection.value.map(item => item.id!).filter(id => id !== undefined)
    if (ids.length === 0) {
      ElMessage.warning('没有有效的活动ID')
      return
    }
    
    try {
      const res = await batchDeleteActivity(ids)
      if (res.data.code === 200) {
        ElMessage.success(`成功删除 ${res.data.successCount || ids.length} 个活动`)
        batchDeleteMode.value = false
        multipleSelection.value = []
        loadList()
      } else {
        ElMessage.error(res.data.msg || '批量删除失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '批量删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败')
    }
  }
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.mb-16 {
  margin-bottom: 16px;
}

.related-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.count-item {
  font-size: 12px;
  color: #666;
  padding: 2px 8px;
  background: #f5f5f5;
  border-radius: 4px;
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

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.image-item {
  position: relative;
  width: 120px;
  height: 120px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
}

.image-preview-small {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 10;
}

.upload-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
}

.upload-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.multi-image-uploader :deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  background-color: #fafafa;
}

.multi-image-uploader :deep(.el-upload:hover) {
  border-color: #409eff;
}

.upload-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.image-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}
</style>
