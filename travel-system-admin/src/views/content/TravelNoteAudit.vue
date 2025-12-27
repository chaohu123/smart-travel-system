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
      <el-table :data="list" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="author" label="作者" />
        <el-table-column prop="city" label="城市" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isFeatured" label="精选" width="90">
          <template #default="{ row }">
            <el-tag :type="row.isFeatured ? 'success' : 'info'">
              {{ row.isFeatured ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdTime" label="提交时间" width="180" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="handleView(row)">详情</el-button>
            <el-button size="small" type="success" text @click="handleAudit(row, 'pass')">
              通过
            </el-button>
            <el-button size="small" type="warning" text @click="handleAudit(row, 'reject')">
              拒绝
            </el-button>
            <el-button size="small" type="info" text @click="toggleFeatured(row)">
              {{ row.isFeatured ? '取消精选' : '设为精选' }}
            </el-button>
            <el-button size="small" type="danger" text @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-drawer v-model="detailVisible" size="50%" title="游记详情">
      <div v-if="detail">
        <h2>{{ detail.title }}</h2>
        <p style="color: #909399">
          作者：{{ detail.author || '-' }} ｜ 城市：{{ detail.city || '-' }}
        </p>
        <div class="content" v-html="detail.content"></div>
      </div>
      <div v-else>加载中...</div>
    </el-drawer>

    <el-dialog v-model="auditDialog.visible" :title="auditDialog.title" width="480px">
      <el-form label-width="100px">
        <el-form-item label="审核意见">
          <el-input
            v-model="auditDialog.remark"
            type="textarea"
            :rows="3"
            placeholder="可填写审核原因或备注"
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
  type TravelNote
} from '@/api/travelNote';
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
    } else {
      ElMessage.error(resp.data.msg || '加载失败');
    }
  } catch (e) {
    ElMessage.error('请求失败');
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
  try {
    const resp = await auditTravelNote({
      id: auditDialog.currentId,
      action: auditDialog.action,
      remark: auditDialog.remark
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
  ElMessageBox.confirm(`确认删除游记「${row.title}」吗？`, '提示', {
    type: 'warning'
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








