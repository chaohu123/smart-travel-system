<template>
  <div>
    <el-card class="mb-16">
      <el-form :inline="true" :model="query">
        <el-form-item label="内容类型">
          <el-select v-model="query.contentType" placeholder="请选择" clearable>
            <el-option label="游记" value="travel_note" />
            <el-option label="景点" value="scenic_spot" />
            <el-option label="美食" value="food" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容ID">
          <el-input-number v-model="query.contentId" placeholder="内容ID" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="请选择" clearable>
            <el-option label="已审核" :value="1" />
            <el-option label="待审核" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="list" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="contentType" label="内容类型" width="120" />
        <el-table-column prop="contentId" label="内容ID" width="100" />
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column prop="content" label="评论内容" show-overflow-tooltip />
        <el-table-column prop="likeCount" label="点赞数" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'warning'">
              {{ row.status === 1 ? '已审核' : '待审核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="success" text @click="handleAudit(row, 1)">
              通过
            </el-button>
            <el-button size="small" type="warning" text @click="handleAudit(row, 0)">
              驳回
            </el-button>
            <el-button size="small" type="danger" text @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="内容类型">
          <el-select v-model="form.contentType">
            <el-option label="游记" value="travel_note" />
            <el-option label="景点" value="scenic_spot" />
            <el-option label="美食" value="food" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容ID">
          <el-input-number v-model="form.contentId" />
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input-number v-model="form.userId" />
        </el-form-item>
        <el-form-item label="评论内容">
          <el-input v-model="form.content" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">已审核</el-radio>
            <el-radio :label="0">待审核</el-radio>
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
  deleteComment,
  fetchCommentList,
  createComment,
  updateComment,
  auditComment,
  type Comment
} from '@/api/comment';
import { ElMessage, ElMessageBox } from 'element-plus';

const query = reactive<Partial<Comment>>({
  contentType: ''
  // contentId 和 status 不设置，默认为 undefined，在构建请求参数时会过滤掉
} as Partial<Comment>);

const list = ref<Comment[]>([]);
const dialogVisible = ref(false);
const dialogTitle = ref('编辑评论');
const form = reactive<Comment>({
  contentType: '',
  contentId: undefined,
  userId: undefined,
  content: '',
  status: 1
});

const loadData = async () => {
  try {
    // 过滤掉 undefined 值
    const params: any = {};
    if (query.contentType !== undefined && query.contentType !== '') {
      params.contentType = query.contentType;
    }
    if (query.contentId !== undefined && query.contentId !== null) {
      params.contentId = query.contentId;
    }
    if (query.status !== undefined && query.status !== null) {
      params.status = query.status;
    }
    const resp = await fetchCommentList(params);
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
  query.contentType = '';
  // 使用 null 而不是 undefined，这样在构建 params 时更容易处理
  query.contentId = null as any;
  query.status = null as any;
  loadData();
};

const handleEdit = (row: Comment) => {
  dialogTitle.value = '编辑评论';
  Object.assign(form, row);
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  try {
    const resp = await updateComment(form);
    if (resp.data.code === 200) {
      ElMessage.success('更新成功');
      dialogVisible.value = false;
      loadData();
    } else {
      ElMessage.error(resp.data.msg || '更新失败');
    }
  } catch (e) {
    ElMessage.error('请求失败');
  }
};

const handleDelete = (row: Comment) => {
  ElMessageBox.confirm(`确认删除该评论吗？`, '提示', {
    type: 'warning'
  })
    .then(async () => {
      try {
        const resp = await deleteComment(row.id!);
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

const handleAudit = async (row: Comment, status: number) => {
  try {
    const resp = await auditComment({ id: row.id!, status });
    if (resp.data.code === 200) {
      ElMessage.success(status === 1 ? '已通过' : '已驳回');
      loadData();
    } else {
      ElMessage.error(resp.data.msg || '操作失败');
    }
  } catch (e) {
    ElMessage.error('请求失败');
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
</style>




