<template>
  <div>
    <el-card class="mb-16">
      <el-form :inline="true" :model="query">
        <el-form-item label="路线名称">
          <el-input v-model="query.routeName" placeholder="请输入路线名称" clearable />
        </el-form-item>
        <el-form-item label="城市ID">
          <el-input-number v-model="query.cityId" placeholder="城市ID" clearable />
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
        <el-table-column prop="routeName" label="路线名称" />
        <el-table-column prop="cityId" label="城市ID" width="100" />
        <el-table-column prop="days" label="天数" width="80" />
        <el-table-column prop="suitablePeople" label="适合人群" width="120" />
        <el-table-column prop="viewCount" label="浏览数" width="100" />
        <el-table-column prop="favoriteCount" label="收藏数" width="100" />
        <el-table-column prop="useCount" label="使用数" width="100" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="260">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="info" text @click="openDayDrawer(row)">
              日程
            </el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="路线名称">
          <el-input v-model="form.routeName" />
        </el-form-item>
        <el-form-item label="城市ID">
          <el-input-number v-model="form.cityId" />
        </el-form-item>
        <el-form-item label="天数">
          <el-input-number v-model="form.days" :min="1" />
        </el-form-item>
        <el-form-item label="适合人群">
          <el-input v-model="form.suitablePeople" />
        </el-form-item>
        <el-form-item label="来源类型">
          <el-select v-model="form.sourceType">
            <el-option label="AI生成" value="ai" />
            <el-option label="用户创建" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.summary" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="封面图">
          <el-input v-model="form.coverImage" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="dayDrawer.visible" size="40%" title="行程日程维护">
      <el-space direction="vertical" fill style="width: 100%">
        <el-alert
          type="info"
          :closable="false"
          title="接口待后端实现 /admin/route/day/*，当前为占位编辑器"
        />
        <el-table :data="dayDrawer.days" border>
          <el-table-column prop="dayNo" label="Day" width="80" />
          <el-table-column prop="poiName" label="景点/美食" />
          <el-table-column prop="note" label="备注" />
          <el-table-column width="140" label="操作">
            <template #default="{ row, $index }">
              <el-button size="small" type="primary" text @click="editDay(row, $index)">
                编辑
              </el-button>
              <el-button size="small" type="danger" text @click="removeDay($index)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button type="success" @click="addDay">新增日程</el-button>
      </el-space>

      <el-dialog v-model="dayDrawer.editorVisible" title="日程明细" width="500px" append-to-body>
        <el-form :model="dayDrawer.editor" label-width="100px">
          <el-form-item label="第几天">
            <el-input-number v-model="dayDrawer.editor.dayNo" :min="1" />
          </el-form-item>
          <el-form-item label="景点/美食">
            <el-input v-model="dayDrawer.editor.poiName" placeholder="名称或ID（占位）" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="dayDrawer.editor.note" type="textarea" :rows="3" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dayDrawer.editorVisible = false">取消</el-button>
          <el-button type="primary" @click="saveDay">保存</el-button>
        </template>
      </el-dialog>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import {
  deleteRoute,
  fetchRouteList,
  createRoute,
  updateRoute,
  fetchRouteDays,
  saveRouteDay,
  deleteRouteDay,
  type TravelRoute
} from '@/api/route';
import { ElMessage, ElMessageBox } from 'element-plus';

const query = reactive<Partial<TravelRoute>>({
  routeName: ''
  // cityId 不设置，默认为 undefined，在构建请求参数时会过滤掉
} as Partial<TravelRoute>);

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
});

const list = ref<TravelRoute[]>([]);
const multipleSelection = ref<TravelRoute[]>([]);
const batchDeleteMode = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增路线');
const form = reactive<TravelRoute>({
  routeName: '',
  cityId: undefined,
  days: undefined,
  suitablePeople: '',
  sourceType: 'ai',
  summary: '',
  coverImage: ''
});

const dayDrawer = reactive({
  visible: false,
  editorVisible: false,
  currentRouteId: 0,
  days: [] as Array<{ id?: number; dayNo: number; poiName?: string; note?: string }>,
  editor: { id: undefined, dayNo: 1, poiName: '', note: '' } as {
    id?: number;
    dayNo: number;
    poiName?: string;
    note?: string;
  }
});

const loadData = async () => {
  try {
    // 过滤掉 undefined 值
    const params: any = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    };
    // 只添加非 undefined 的查询参数
    if (query.routeName !== undefined && query.routeName !== '') {
      params.routeName = query.routeName;
    }
    if (query.cityId !== undefined && query.cityId !== null) {
      params.cityId = query.cityId;
    }
    const resp = await fetchRouteList(params);
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
  query.routeName = '';
  // 使用 null 而不是 undefined，这样在构建 params 时更容易处理
  query.cityId = null as any;
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

const handleSelectionChange = (val: TravelRoute[]) => {
  multipleSelection.value = val;
};

const handleAdd = () => {
  dialogTitle.value = '新增路线';
  Object.assign(form, {
    id: undefined,
    routeName: '',
    cityId: undefined,
    days: undefined,
    suitablePeople: '',
    sourceType: 'ai',
    summary: '',
    coverImage: ''
  });
  dialogVisible.value = true;
};

const handleEdit = (row: TravelRoute) => {
  dialogTitle.value = '编辑路线';
  Object.assign(form, row);
  dialogVisible.value = true;
};

const openDayDrawer = async (row: TravelRoute) => {
  dayDrawer.visible = true;
  dayDrawer.currentRouteId = row.id!;
  try {
    const resp = await fetchRouteDays(row.id!);
    if (resp.data.code === 200) {
      dayDrawer.days = resp.data.rows || [];
    } else {
      dayDrawer.days = [];
      ElMessage.warning(resp.data.msg || '接口未就绪，已使用空数据');
    }
  } catch (e) {
    dayDrawer.days = [];
    ElMessage.warning('接口未就绪，使用占位数据');
  }
};

const addDay = () => {
  dayDrawer.editor = { id: undefined, dayNo: (dayDrawer.days.length || 0) + 1, poiName: '', note: '' };
  dayDrawer.editorVisible = true;
};

const editDay = (row: { id?: number; dayNo: number; poiName?: string; note?: string }, index: number) => {
  // 使用 any 暂存 index，避免类型约束报错（此处为前端占位逻辑）
  (dayDrawer.editor as any) = { ...row, index };
  dayDrawer.editorVisible = true;
};

const saveDay = async () => {
  const payload = {
    routeId: dayDrawer.currentRouteId,
    ...dayDrawer.editor
  };
  try {
    const resp = await saveRouteDay(payload);
    if (resp.data.code === 200) {
      ElMessage.success('保存成功');
      dayDrawer.editorVisible = false;
      openDayDrawer({ id: dayDrawer.currentRouteId } as TravelRoute);
    } else {
      ElMessage.error(resp.data.msg || '保存失败');
    }
  } catch (e) {
    ElMessage.error('接口未就绪，当前为占位保存');
    // 前端占位保存到本地
    const idx = (dayDrawer.editor as any).index;
    if (idx !== undefined) {
      dayDrawer.days[idx] = { ...dayDrawer.editor };
    } else {
      dayDrawer.days.push({ ...dayDrawer.editor });
    }
    dayDrawer.editorVisible = false;
  }
};

const removeDay = async (index: number) => {
  const target = dayDrawer.days[index];
  try {
    if (target?.id) {
      await deleteRouteDay(target.id);
    }
    dayDrawer.days.splice(index, 1);
    ElMessage.success('已删除');
  } catch (e) {
    dayDrawer.days.splice(index, 1);
    ElMessage.info('接口未就绪，本地删除');
  }
};

const handleSubmit = async () => {
  try {
    if (form.id) {
      const resp = await updateRoute(form);
      if (resp.data.code === 200) {
        ElMessage.success('更新成功');
        dialogVisible.value = false;
        loadData();
      } else {
        ElMessage.error(resp.data.msg || '更新失败');
      }
    } else {
      const resp = await createRoute(form);
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

const handleDelete = (row: TravelRoute) => {
  ElMessageBox.confirm(`确认删除路线「${row.routeName}」吗？`, '提示', {
    type: 'warning'
  })
    .then(async () => {
      try {
        const resp = await deleteRoute(row.id!);
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

const handleBatchDelete = () => {
  // 切换批量删除模式（进入/取消）
  if (batchDeleteMode.value) {
    // 取消删除：退出模式并清空选择
    batchDeleteMode.value = false;
    multipleSelection.value = [];
  } else {
    // 进入批量删除模式
    batchDeleteMode.value = true;
    multipleSelection.value = [];
    ElMessage.info('请选择要删除的路线');
  }
};

const handleConfirmDelete = () => {
  if (!batchDeleteMode.value) return;

  const ids = multipleSelection.value
    .map(item => item.id)
    .filter(id => typeof id === 'number') as number[];

  if (ids.length === 0) {
    ElMessage.warning('请选择要删除的路线');
    return;
  }

  ElMessageBox.confirm('确认删除所选数据吗？', '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  })
    .then(async () => {
      try {
        await Promise.all(ids.map(id => deleteRoute(id)));
        ElMessage.success('批量删除成功');
        multipleSelection.value = [];
        batchDeleteMode.value = false;
        loadData();
      } catch (e) {
        ElMessage.error('批量删除失败，请重试');
      }
    })
    .catch(() => {
      // 取消，不删除
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




