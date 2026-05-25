<template>
  <div>
    <el-card class="mb-16">
      <template #header>
        <div class="card-header">
          <span>等级管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增等级
          </el-button>
        </div>
      </template>

      <!-- 经验值计算规则配置 -->
      <el-card class="mb-16" shadow="never">
        <template #header>
          <span>经验值计算规则</span>
        </template>
        <el-form :model="expRuleForm" label-width="180px">
          <el-form-item label="评论获得经验">
            <el-input-number v-model="expRuleForm.commentExp" :min="0" :max="1000" />
            <span class="form-tip">每次发布评论获得的经验值</span>
          </el-form-item>
          <el-form-item label="游记获得经验">
            <el-input-number v-model="expRuleForm.noteExp" :min="0" :max="1000" />
            <span class="form-tip">每次发布游记获得的经验值</span>
          </el-form-item>
          <el-form-item label="打卡获得经验">
            <el-input-number v-model="expRuleForm.checkinExp" :min="0" :max="1000" />
            <span class="form-tip">每次打卡获得的经验值</span>
          </el-form-item>
          <el-form-item label="签到获得经验">
            <el-input-number v-model="expRuleForm.dailyCheckinExp" :min="0" :max="1000" />
            <span class="form-tip">每日签到获得的经验值</span>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveExpRules">保存规则</el-button>
            <el-button @click="loadExpRules">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 等级列表 -->
      <el-table :data="levelList" border stripe v-loading="loading">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="level" label="等级" width="80" align="center">
          <template #default="{ row }">
            <el-tag type="success">LV{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="levelName" label="等级名称" width="150" />
        <el-table-column prop="minExperience" label="最低经验值" width="120" align="center" />
        <el-table-column prop="maxExperience" label="最高经验值" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.maxExperience">{{ row.maxExperience }}</span>
            <span v-else style="color: #999;">无上限</span>
          </template>
        </el-table-column>
        <el-table-column prop="medalName" label="勋章名称" width="150" />
        <el-table-column prop="medalIcon" label="勋章图标" width="100" align="center">
          <template #default="{ row }">
            <span style="font-size: 24px;">{{ row.medalIcon || '徽章' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadLevelList"
          @current-change="loadLevelList"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="140px"
      >
        <el-form-item label="等级" prop="level">
          <el-input-number
            v-model="form.level"
            :min="1"
            :max="100"
            :disabled="form.id !== undefined"
          />
          <span class="form-tip">等级数字，不可重复</span>
        </el-form-item>
        <el-form-item label="等级名称" prop="levelName">
          <el-input v-model="form.levelName" placeholder="如：新手、达人、专家" />
        </el-form-item>
        <el-form-item label="最低经验值" prop="minExperience">
          <el-input-number v-model="form.minExperience" :min="0" />
          <span class="form-tip">达到此经验值可升级到此等级</span>
        </el-form-item>
        <el-form-item label="最高经验值" prop="maxExperience">
          <el-input-number v-model="form.maxExperience" :min="0" />
          <span class="form-tip">留空表示无上限</span>
        </el-form-item>
        <el-form-item label="勋章名称" prop="medalName">
          <el-input v-model="form.medalName" placeholder="如：新手、达人、专家" />
        </el-form-item>
        <el-form-item label="勋章图标" prop="medalIcon">
          <el-input v-model="form.medalIcon" placeholder="输入图标文本，如：新手、达人、专家" />
          <div class="medal-preview">
            <span class="preview-icon">{{ form.medalIcon || '徽章' }}</span>
            <span class="preview-text">预览效果</span>
          </div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="等级描述信息"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import {
  fetchLevelList,
  createLevel,
  updateLevel,
  deleteLevel,
  fetchExpRules,
  saveExpRules as saveExpRulesApi
} from '@/api/level';

interface Level {
  id?: number;
  level: number;
  levelName: string;
  minExperience: number;
  maxExperience?: number;
  medalName: string;
  medalIcon: string;
  description?: string;
  status: number;
}

const loading = ref(false);
const submitting = ref(false);
const levelList = ref<Level[]>([]);
const pageNum = ref(1);
const pageSize = ref(10);
const total = ref(0);
const dialogVisible = ref(false);
const dialogTitle = ref('新增等级');
const formRef = ref();

const form = reactive<Level>({
  level: 1,
  levelName: '',
  minExperience: 0,
  maxExperience: undefined,
  medalName: '',
  medalIcon: '徽章',
  description: '',
  status: 1
});

const expRuleForm = reactive({
  commentExp: 1,
  noteExp: 10,
  checkinExp: 20,
  dailyCheckinExp: 5
});

const rules = {
  level: [{ required: true, message: '请输入等级', trigger: 'blur' }],
  levelName: [{ required: true, message: '请输入等级名称', trigger: 'blur' }],
  minExperience: [{ required: true, message: '请输入最低经验值', trigger: 'blur' }],
  medalName: [{ required: true, message: '请输入勋章名称', trigger: 'blur' }],
  medalIcon: [{ required: true, message: '请输入勋章图标', trigger: 'blur' }]
};

// 加载等级列表
const loadLevelList = async () => {
  loading.value = true;
  try {
    const resp = await fetchLevelList({
      pageNum: pageNum.value,
      pageSize: pageSize.value
    });
    if (resp.data.code === 200) {
      levelList.value = resp.data.rows || [];
      total.value = resp.data.total || 0;
    } else {
      ElMessage.error(resp.data.msg || '加载失败');
    }
  } catch (error: any) {
    ElMessage.error(error.message || '加载失败');
  } finally {
    loading.value = false;
  }
};

// 加载经验值规则
const loadExpRules = async () => {
  try {
    const resp = await fetchExpRules();
    if (resp.data.code === 200 && resp.data.data) {
      Object.assign(expRuleForm, resp.data.data);
    }
  } catch (error: any) {
    console.error('加载经验值规则失败', error);
  }
};

// 保存经验值规则
const saveExpRules = async () => {
  try {
    const resp = await saveExpRulesApi(expRuleForm);
    if (resp.data.code === 200) {
      ElMessage.success('保存成功');
    } else {
      ElMessage.error(resp.data.msg || '保存失败');
    }
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败');
  }
};

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增等级';
  resetForm();
  dialogVisible.value = true;
};

// 编辑
const handleEdit = (row: Level) => {
  dialogTitle.value = '编辑等级';
  Object.assign(form, { ...row });
  dialogVisible.value = true;
};

// 删除
const handleDelete = async (row: Level) => {
  try {
    await ElMessageBox.confirm('确定要删除该等级吗？', '提示', {
      type: 'warning'
    });
    const resp = await deleteLevel(row.id!);
    if (resp.data.code === 200) {
      ElMessage.success('删除成功');
      loadLevelList();
    } else {
      ElMessage.error(resp.data.msg || '删除失败');
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败');
    }
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true;
      try {
        let resp;
        if (form.id) {
          resp = await updateLevel(form);
        } else {
          resp = await createLevel(form);
        }
        if (resp.data.code === 200) {
          ElMessage.success(form.id ? '更新成功' : '创建成功');
          dialogVisible.value = false;
          loadLevelList();
        } else {
          ElMessage.error(resp.data.msg || '操作失败');
        }
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败');
      } finally {
        submitting.value = false;
      }
    }
  });
};

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    id: undefined,
    level: 1,
    levelName: '',
    minExperience: 0,
    maxExperience: undefined,
    medalName: '',
    medalIcon: '徽章',
    description: '',
    status: 1
  });
  formRef.value?.clearValidate();
};

onMounted(() => {
  loadLevelList();
  loadExpRules();
});
</script>

<style scoped>
.mb-16 {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #999;
}

.medal-preview {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
}

.preview-icon {
  font-size: 32px;
}

.preview-text {
  font-size: 14px;
  color: #666;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>

