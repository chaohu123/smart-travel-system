<template>
  <div>
    <el-card class="mb-16">
      <el-form :inline="true" :model="query">
        <el-form-item label="标题">
          <el-input v-model="query.title" placeholder="请输入游记标题" clearable />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="query.author" placeholder="作者昵称" clearable />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="query.city" placeholder="城市" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="请选择" clearable style="width: 140px">
            <el-option label="待审核" value="pending" />
            <el-option label="通过" value="pass" />
            <el-option label="拒绝" value="reject" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <div style="margin-bottom: 16px;">
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
          确认删除 ({{ multipleSelection.length }})
        </el-button>
      </div>
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
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="作者" width="120">
          <template #default="{ row }">
            <span>{{ getAuthorName(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="城市" width="120">
          <template #default="{ row }">
            <span>{{ row.cityName || row.city || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditRemark" label="审核备注" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.auditRemark" style="color: #E6A23C;">{{ row.auditRemark }}</span>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="isFeatured" label="精选" width="90">
          <template #default="{ row }">
            <el-tag :type="row.isFeatured ? 'success' : 'info'">
              {{ row.isFeatured ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="180">
          <template #default="{ row }">
            <span>{{ formatTime(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="500" fixed="right">
          <template #default="{ row }">
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <el-button size="small" type="primary" text @click="handleView(row)">详情</el-button>
              <el-button size="small" type="success" text @click="handleAudit(row, 'pass')">通过</el-button>
              <el-button size="small" type="warning" text @click="handleAudit(row, 'reject')">拒绝</el-button>
            <el-button size="small" type="info" text @click="toggleFeatured(row)">
              {{ row.isFeatured ? '取消精选' : '设为精选' }}
            </el-button>
              <el-button size="small" type="danger" text @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-drawer v-model="detailVisible" size="60%" title="游记详情">
      <div v-if="detail" style="padding: 20px;">
        <h2 style="margin-bottom: 16px;">{{ detail.title }}</h2>
        <div style="margin-bottom: 20px; color: #909399; font-size: 14px;">
          <p>作者：{{ getAuthorName(detail) }}</p>
          <p>城市：{{ detail.cityName || detail.city || '-' }}</p>
          <p>提交时间：{{ formatTime(detail.createTime) }}</p>
          <p>状态：<el-tag :type="statusTagType(detail.status)">{{ statusText(detail.status) }}</el-tag></p>
          <p v-if="detail.auditRemark" style="color: #E6A23C; margin-top: 8px;">
            审核备注：{{ detail.auditRemark }}
          </p>
        </div>
        <el-divider />
        <div class="content" v-html="detail.content" style="margin-bottom: 30px; line-height: 1.8;"></div>
        
        <!-- 图片展示 -->
        <div v-if="detail.images && detail.images.length > 0" style="margin-bottom: 30px;">
          <h3 style="margin-bottom: 16px;">图片</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 12px;">
            <el-image
              v-for="(img, index) in detail.images"
              :key="index"
              :src="img.url || img"
              :preview-src-list="detail.images.map((i: any) => i.url || i)"
              :initial-index="index"
              style="width: 200px; height: 200px; border-radius: 8px;"
              fit="cover"
            />
          </div>
        </div>

        <el-divider />
        
        <!-- 评论列表 -->
        <div>
          <h3 style="margin-bottom: 16px;">评论 ({{ comments.length }})</h3>
          <div v-if="comments.length === 0" style="color: #909399; text-align: center; padding: 40px;">
            暂无评论
          </div>
          <div v-else>
            <div
              v-for="comment in comments"
              :key="comment.id"
              style="padding: 16px; margin-bottom: 16px; background: #f5f7fa; border-radius: 8px;"
            >
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: 600; margin-right: 12px;">{{ comment.nickname || comment.userName || '匿名用户' }}</span>
                <span style="color: #909399; font-size: 12px;">{{ formatTime(comment.createTime) }}</span>
              </div>
              <div style="color: #606266; line-height: 1.6;">{{ comment.content }}</div>
            </div>
          </div>
        </div>
      </div>
      <div v-else style="text-align: center; padding: 40px;">加载中...</div>
    </el-drawer>

    <el-dialog v-model="auditDialog.visible" :title="auditDialog.title" width="480px">
      <el-form label-width="100px">
        <el-form-item 
          :label="auditDialog.action === 'reject' ? '驳回原因' : '审核意见'"
          :rules="auditDialog.action === 'reject' ? [{ required: true, message: '驳回原因不能为空', trigger: 'blur' }] : []"
        >
          <el-input
            v-model="auditDialog.remark"
            type="textarea"
            :rows="3"
            :placeholder="auditDialog.action === 'reject' ? '请填写驳回原因（必填）' : '可填写审核原因或备注'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import {
  deleteTravelNote,
  fetchTravelNoteDetail,
  fetchTravelNoteList,
  featureTravelNote,
  auditTravelNote,
  batchDeleteTravelNotes,
  type TravelNote
} from '@/api/travelNote';
import { fetchCommentList } from '@/api/comment';
import { ElMessage, ElMessageBox } from 'element-plus';

const query = reactive({
  title: '',
  author: '',
  city: '',
  status: ''
});

const list = ref<TravelNote[]>([]);
const detailVisible = ref(false);
const detail = ref<TravelNote | null>(null);
const comments = ref<any[]>([]);
const multipleSelection = ref<TravelNote[]>([]);
const batchDeleteMode = ref(false);
const auditDialog = reactive({
  visible: false,
  action: 'pass' as 'pass' | 'reject',
  currentId: 0,
  title: '',
  remark: ''
});

const loadData = async () => {
  try {
    const resp = await fetchTravelNoteList(query);
    if (resp.data.code === 200) {
      list.value = resp.data.rows || [];
      // 如果数据中没有作者信息，尝试从后端获取（如果需要的话）
      // 这里假设后端已经返回了作者信息，如果没有则需要额外查询
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
  query.title = '';
  query.author = '';
  query.city = '';
  loadData();
};

const handleView = async (row: TravelNote) => {
  try {
    const resp = await fetchTravelNoteDetail(row.id);
    if (resp.data.code === 200) {
      detail.value = resp.data.data;
      detailVisible.value = true;
      // 加载评论
      await loadComments(row.id!);
    } else {
      ElMessage.error(resp.data.msg || '加载失败');
    }
  } catch (e) {
    ElMessage.error('请求失败');
  }
};

// 加载评论
const loadComments = async (noteId: number) => {
  try {
    const params: any = {
      contentType: 'note',
      contentId: noteId
    };
    const resp = await fetchCommentList(params);
    if (resp.data.code === 200) {
      comments.value = resp.data.rows || resp.data.data || [];
    }
  } catch (e) {
    console.error('加载评论失败:', e);
    comments.value = [];
  }
};

const handleAudit = (row: TravelNote, action: 'pass' | 'reject') => {
  auditDialog.visible = true;
  auditDialog.action = action;
  auditDialog.currentId = row.id!;
  auditDialog.title = action === 'pass' ? '审核通过' : '审核拒绝';
  auditDialog.remark = '';
};

const submitAudit = async () => {
  // 如果是驳回操作，必须填写备注
  if (auditDialog.action === 'reject' && !auditDialog.remark?.trim()) {
    ElMessage.warning('驳回时必须填写驳回原因');
    return;
  }
  
  try {
    const resp = await auditTravelNote({
      id: auditDialog.currentId,
      action: auditDialog.action,
      remark: auditDialog.remark?.trim() || null
    });
    if (resp.data.code === 200) {
      ElMessage.success('操作成功');
      auditDialog.visible = false;
      loadData();
    } else {
      ElMessage.error(resp.data.msg || '操作失败');
    }
  } catch (e) {
    ElMessage.error('请求失败');
  }
};

const toggleFeatured = async (row: TravelNote) => {
  try {
    const resp = await featureTravelNote({ id: row.id!, isFeatured: row.isFeatured ? 0 : 1 });
    if (resp.data.code === 200) {
      ElMessage.success(row.isFeatured ? '已取消精选' : '设为精选');
      loadData();
    } else {
      ElMessage.error(resp.data.msg || '操作失败');
    }
  } catch (e) {
    ElMessage.error('请求失败');
  }
};

const handleDelete = (row: TravelNote) => {
  ElMessageBox.confirm(`确认删除游记「${row.title}」吗？删除后数据将无法恢复！`, '提示', {
    type: 'warning',
    confirmButtonText: '确定删除',
    cancelButtonText: '取消'
  })
    .then(async () => {
      try {
        const resp = await deleteTravelNote(row.id);
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

// 批量删除
const handleBatchDelete = () => {
  if (batchDeleteMode.value) {
    batchDeleteMode.value = false;
    multipleSelection.value = [];
  } else {
    batchDeleteMode.value = true;
    multipleSelection.value = [];
    ElMessage.info('请选择要删除的游记');
  }
};

const handleSelectionChange = (val: TravelNote[]) => {
  multipleSelection.value = val;
};

const handleConfirmDelete = () => {
  if (!batchDeleteMode.value) return;

  const ids = multipleSelection.value
    .map(item => item.id)
    .filter(id => typeof id === 'number') as number[];

  if (ids.length === 0) {
    ElMessage.warning('请选择要删除的游记');
    return;
  }
  
  ElMessageBox.confirm(`确认删除所选 ${ids.length} 条游记吗？删除后数据将无法恢复！`, '提示', {
    type: 'warning',
    confirmButtonText: '确定删除',
    cancelButtonText: '取消'
  })
    .then(async () => {
      try {
        // 使用批量删除API，如果没有则逐个删除
        try {
          await batchDeleteTravelNotes(ids);
        } catch (e) {
          // 如果批量删除API不存在，则逐个删除
          await Promise.all(ids.map(id => deleteTravelNote(id)));
        }
        ElMessage.success('批量删除成功');
        multipleSelection.value = [];
        batchDeleteMode.value = false;
        await loadData();
      } catch (e) {
        console.error('批量删除失败:', e);
        ElMessage.error('批量删除失败，请重试');
      }
    })
    .catch(() => {});
};

// 获取作者名称（优先使用nickname字段）
const getAuthorName = (row: TravelNote) => {
  // 优先使用authorName字段（后端已映射nickname到authorName）
  if (row.authorName) return row.authorName;
  
  // 兼容其他可能的字段
  if (row.author) return row.author;
  if (row.authorNickname) return row.authorNickname;
  
  // 从用户对象中获取
  if (row.user) {
    if (row.user.nickname) return row.user.nickname;
    if (row.user.userName) return row.user.userName;
    if (row.user.name) return row.user.name;
  }
  
  // 从作者信息对象中获取
  if (row.authorInfo) {
    if (row.authorInfo.nickname) return row.authorInfo.nickname;
    if (row.authorInfo.userName) return row.authorInfo.userName;
    if (row.authorInfo.name) return row.authorInfo.name;
  }
  
  // 如果有userId，显示用户ID
  if (row.userId) return `用户${row.userId}`;
  
  return '-';
};

// 格式化时间
const formatTime = (time?: string) => {
  if (!time) return '-';
  const date = new Date(time);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const statusText = (status?: TravelNote['status']) => {
  if (status === 'pass') return '通过';
  if (status === 'reject') return '拒绝';
  return '待审核';
};

const statusTagType = (status?: TravelNote['status']) => {
  if (status === 'pass') return 'success';
  if (status === 'reject') return 'danger';
  return 'warning';
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.mb-16 {
  margin-bottom: 16px;
}
.content {
  margin-top: 16px;
  line-height: 1.6;
}
</style>








