<template>
  <div>
    <el-card class="mb-16">
      <el-form :inline="true" :model="query">
        <el-form-item label="景点名称">
          <el-input v-model="query.name" placeholder="请输入景点名称" clearable />
        </el-form-item>
        <el-form-item label="省份">
          <el-input v-model="query.province" placeholder="请输入省份（如：浙江省）" clearable />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="query.city" placeholder="请输入城市（如：杭州市）" clearable />
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
        <el-table-column prop="name" label="景点名称" />
        <el-table-column label="省份/城市" min-width="160">
          <template #default="{ row }">
            <span>{{ row.province || '-' }}</span>
            <span v-if="row.city"> / {{ row.city }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地址" />
        <el-table-column prop="ticketInfo" label="门票" min-width="120">
          <template #default="{ row }">
            <span>{{ row.ticketInfo || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="isRecommend" label="推荐" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isRecommend === 1 ? 'success' : 'info'">
              {{ row.isRecommend === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="openTime" label="开发时间" width="180" />
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
      <el-form :model="form" label-width="120px">
        <el-form-item label="景点名称">
          <el-input v-model="form.name" />
        </el-form-item>

        <!-- 省份、城市、地址在同一行 -->
        <el-form-item label="位置信息">
          <el-row :gutter="16">
            <el-col :span="8">
              <div style="display: flex; align-items: center;">
                <span style="min-width: 50px; color: #606266; margin-right: 8px;">省份：</span>
                <el-select v-model="form.province" placeholder="请选择省份" @change="handleProvinceChange" clearable style="flex: 1;">
                  <el-option
                    v-for="province in provinceOptions"
                    :key="province.value"
                    :label="province.label"
                    :value="province.value"
                  />
                </el-select>
              </div>
            </el-col>
            <el-col :span="8">
              <div style="display: flex; align-items: center;">
                <span style="min-width: 50px; color: #606266; margin-right: 8px;">城市：</span>
                <el-select v-model="form.city" placeholder="请选择城市" clearable :disabled="!form.province" style="flex: 1;">
                  <el-option
                    v-for="city in cityOptions"
                    :key="city"
                    :label="city"
                    :value="city"
                  />
                </el-select>
              </div>
            </el-col>
            <el-col :span="8">
              <div style="display: flex; align-items: center;">
                <span style="min-width: 50px; color: #606266; margin-right: 8px;">地址：</span>
                <el-input v-model="form.address" placeholder="详细地址" />
              </div>
            </el-col>
          </el-row>
        </el-form-item>

        <!-- 经度纬度 -->
        <el-form-item label="经纬度">
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

        <!-- 价格、建议游览时间、开放时间水平排列 -->
        <el-form-item label="基本信息">
          <el-row :gutter="16">
            <el-col :span="8">
              <div style="display: flex; align-items: center;">
                <span style="min-width: 50px; color: #606266; margin-right: 8px;">价格：</span>
                <el-input v-model="form.price" placeholder="请输入门票价格若无则填0" />
              </div>
            </el-col>
            <el-col :span="8">
              <div style="display: flex; align-items: center;">
                <span style="min-width: 90px; color: #606266; margin-right: 8px;">游览时长：</span>
                <el-input v-model="form.suggestedVisitTime" placeholder="如：2-3小时" />
              </div>
            </el-col>
            <el-col :span="8">
              <div style="display: flex; align-items: center;">
                <span style="min-width: 80px; color: #606266; margin-right: 8px;">开放时间：</span>
                <el-input v-model="form.openTime" placeholder="如：08:30-17:00" />
              </div>
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item label="世界文化遗产">
          <el-radio-group v-model="form.isWorldHeritage">
            <el-radio :label="1">是</el-radio>
            <el-radio :label="0">否</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="简介">
          <el-input v-model="form.intro" type="textarea" :rows="3" />
        </el-form-item>

        <el-form-item label="门票信息">
          <el-input v-model="form.ticketInfo" />
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

        <!-- 景点图片移到最后 -->
        <el-form-item label="景点图片">
          <el-radio-group v-model="imageUploadType" style="margin-bottom: 12px">
            <el-radio label="url">URL链接</el-radio>
            <el-radio label="upload">本地上传</el-radio>
          </el-radio-group>
          <div v-if="imageUploadType === 'url'">
            <el-input v-model="form.imageUrl" placeholder="请输入图片URL" />
          </div>
          <div v-else>
            <el-upload
              class="image-uploader"
              :action="uploadAction"
              :show-file-list="false"
              :on-success="handleImageSuccess"
              :before-upload="beforeImageUpload"
            >
              <img v-if="form.imageUrl" :src="form.imageUrl" class="image-preview" />
              <el-icon v-else class="image-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">支持jpg/png格式，大小不超过2MB</div>
          </div>
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
import { onMounted, reactive, ref, computed } from 'vue';
import {
  deleteScenicSpot,
  fetchScenicSpotList,
  createScenicSpot,
  updateScenicSpot,
  type ScenicSpot
} from '@/api/scenic';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import http from '@/api/http';

const query = reactive<Partial<ScenicSpot>>({
  name: '',
  province: '',
  city: ''
});

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
});

// 省份城市映射数据
const provinceCityMap: Record<string, string[]> = {
  '北京': ['北京', '东城区', '西城区', '朝阳区', '海淀区', '丰台区', '石景山区', '通州区', '顺义区', '昌平区', '大兴区', '房山区', '门头沟区', '平谷区', '怀柔区', '密云区', '延庆区'],
  '上海': ['上海', '黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '浦东新区', '闵行区', '宝山区', '嘉定区', '金山区', '松江区', '青浦区', '奉贤区', '崇明区'],
  '广东': ['广州', '深圳', '珠海', '汕头', '佛山', '韶关', '湛江', '肇庆', '江门', '茂名', '惠州', '梅州', '汕尾', '河源', '阳江', '清远', '东莞', '中山', '潮州', '揭阳', '云浮'],
  '浙江': ['杭州', '宁波', '温州', '嘉兴', '湖州', '绍兴', '金华', '衢州', '舟山', '台州', '丽水'],
  '江苏': ['南京', '无锡', '徐州', '常州', '苏州', '南通', '连云港', '淮安', '盐城', '扬州', '镇江', '泰州', '宿迁'],
  '四川': ['成都', '自贡', '攀枝花', '泸州', '德阳', '绵阳', '广元', '遂宁', '内江', '乐山', '南充', '眉山', '宜宾', '广安', '达州', '雅安', '巴中', '资阳'],
  '陕西': ['西安', '铜川', '宝鸡', '咸阳', '渭南', '延安', '汉中', '榆林', '安康', '商洛'],
  '福建': ['福州', '厦门', '莆田', '三明', '泉州', '漳州', '南平', '龙岩', '宁德'],
  '山东': ['济南', '青岛', '淄博', '枣庄', '东营', '烟台', '潍坊', '济宁', '泰安', '威海', '日照', '临沂', '德州', '聊城', '滨州', '菏泽'],
  '河南': ['郑州', '开封', '洛阳', '平顶山', '安阳', '鹤壁', '新乡', '焦作', '濮阳', '许昌', '漯河', '三门峡', '南阳', '商丘', '信阳', '周口', '驻马店', '济源'],
  '湖北': ['武汉', '黄石', '十堰', '宜昌', '襄阳', '鄂州', '荆门', '孝感', '荆州', '黄冈', '咸宁', '随州'],
  '湖南': ['长沙', '株洲', '湘潭', '衡阳', '邵阳', '岳阳', '常德', '张家界', '益阳', '郴州', '永州', '怀化', '娄底'],
  '安徽': ['合肥', '芜湖', '蚌埠', '淮南', '马鞍山', '淮北', '铜陵', '安庆', '黄山', '滁州', '阜阳', '宿州', '六安', '亳州', '池州', '宣城'],
  '河北': ['石家庄', '唐山', '秦皇岛', '邯郸', '邢台', '保定', '张家口', '承德', '沧州', '廊坊', '衡水'],
  '辽宁': ['沈阳', '大连', '鞍山', '抚顺', '本溪', '丹东', '锦州', '营口', '阜新', '辽阳', '盘锦', '铁岭', '朝阳', '葫芦岛'],
  '江西': ['南昌', '景德镇', '萍乡', '九江', '新余', '鹰潭', '赣州', '吉安', '宜春', '抚州', '上饶'],
  '重庆': ['重庆', '万州区', '涪陵区', '渝中区', '大渡口区', '江北区', '沙坪坝区', '九龙坡区', '南岸区', '北碚区', '綦江区', '大足区', '渝北区', '巴南区'],
  '云南': ['昆明', '曲靖', '玉溪', '保山', '昭通', '丽江', '普洱', '临沧'],
  '广西': ['南宁', '柳州', '桂林', '梧州', '北海', '防城港', '钦州', '贵港', '玉林', '百色', '贺州', '河池', '来宾', '崇左'],
  '山西': ['太原', '大同', '阳泉', '长治', '晋城', '朔州', '晋中', '运城', '忻州', '临汾', '吕梁'],
  '内蒙古': ['呼和浩特', '包头', '乌海', '赤峰', '通辽', '鄂尔多斯', '呼伦贝尔', '巴彦淖尔', '乌兰察布'],
  '贵州': ['贵阳', '六盘水', '遵义', '安顺', '毕节', '铜仁'],
  '新疆': ['乌鲁木齐', '克拉玛依', '吐鲁番', '哈密'],
  '吉林': ['长春', '吉林', '四平', '辽源', '通化', '白山', '松原', '白城'],
  '黑龙江': ['哈尔滨', '齐齐哈尔', '鸡西', '鹤岗', '双鸭山', '大庆', '伊春', '佳木斯', '七台河', '牡丹江', '黑河', '绥化'],
  '海南': ['海口', '三亚', '三沙', '儋州'],
  '甘肃': ['兰州', '嘉峪关', '金昌', '白银', '天水', '武威', '张掖', '平凉', '酒泉', '庆阳', '定西', '陇南'],
  '宁夏': ['银川', '石嘴山', '吴忠', '固原', '中卫'],
  '青海': ['西宁', '海东'],
  '西藏': ['拉萨', '日喀则', '昌都', '林芝', '山南', '那曲', '阿里'],
  '天津': ['天津', '和平区', '河东区', '河西区', '南开区', '河北区', '红桥区', '东丽区', '西青区', '津南区', '北辰区', '武清区', '宝坻区', '滨海新区', '宁河区', '静海区', '蓟州区'],
  '香港': ['香港', '中西区', '湾仔区', '东区', '南区', '深水埗区', '油尖旺区', '九龙城区', '黄大仙区', '观塘区', '荃湾区', '屯门区', '元朗区', '北区', '大埔区', '沙田区', '西贡区', '离岛区'],
  '澳门': ['澳门', '花地玛堂区', '花王堂区', '望德堂区', '大堂区', '风顺堂区', '嘉模堂区', '路凼填海区', '圣方济各堂区'],
  '台湾': ['台北', '新北', '桃园', '台中', '台南', '高雄', '基隆', '新竹', '嘉义']
};

// 省份选项（用于表单下拉框）
const provinceOptions = Object.keys(provinceCityMap).map(key => ({
  label: key,
  value: key
}));

// 城市选项（根据选择的省份动态变化）
const cityOptions = computed(() => {
  if (!form.province) {
    return [];
  }
  return provinceCityMap[form.province] || [];
});

// 省份改变处理函数
const handleProvinceChange = (value: string) => {
  // 省份改变时，清空城市选择
  form.city = '';
};

// 查询表单使用的省份列表（保留原有逻辑）
const provinceList = [
  { name: '全部省份', value: '' },
  ...Object.keys(provinceCityMap).map(name => ({ name, value: name }))
] as const;

const selectedProvinceIndex = ref(0);
const selectedProvince = computed(() => provinceList[selectedProvinceIndex.value]?.name || '全部省份');

const list = ref<ScenicSpot[]>([]);
const dialogVisible = ref(false);
const dialogTitle = ref('新增景点');
const imageUploadType = ref<'url' | 'upload'>('url');
const uploadAction = ref('http://localhost:8080/admin/upload/image');

const form = reactive<ScenicSpot>({
  name: '',
  province: '',
  city: '',
  address: '',
  latitude: undefined,
  longitude: undefined,
  intro: '',
  openTime: '',
  ticketInfo: '',
  price: undefined,
  imageUrl: '',
  isWorldHeritage: 0,
  suggestedVisitTime: '',
  score: undefined,
  hotScore: 0,
  isRecommend: 0
});

const loadData = async () => {
  try {
    const params = {
      ...query,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    };
    const resp = await fetchScenicSpotList(params);
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
  query.name = '';
  query.province = '';
  query.city = '';
  selectedProvinceIndex.value = 0;
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

const onProvinceChange = (e: any) => {
  const idx = Number(e?.detail?.value ?? e?.target?.value ?? 0);
  selectedProvinceIndex.value = idx;
  query.province = provinceList[idx]?.value || '';
  // 搜索时同步触发筛选
  handleSearch();
};

const handleAdd = () => {
  dialogTitle.value = '新增景点';
  imageUploadType.value = 'url';
  Object.assign(form, {
    id: undefined,
    name: '',
    province: '',
    city: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
    intro: '',
    openTime: '',
    ticketInfo: '',
    price: undefined,
    imageUrl: '',
    isWorldHeritage: 0,
    suggestedVisitTime: '',
    score: undefined,
    hotScore: 0,
    isRecommend: 0
  });
  dialogVisible.value = true;
};

const handleEdit = (row: ScenicSpot) => {
  dialogTitle.value = '编辑景点';
  imageUploadType.value = row.imageUrl && row.imageUrl.startsWith('http') ? 'url' : 'upload';
  Object.assign(form, row);
  dialogVisible.value = true;
};

const handleImageSuccess = (response: any) => {
  if (response && response.code === 200) {
    form.imageUrl = response.data.url || response.data;
    ElMessage.success('图片上传成功');
  } else {
    ElMessage.error(response?.msg || '图片上传失败');
  }
};

const beforeImageUpload = (file: File) => {
  const isImage = file.type.startsWith('image/');
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error('只能上传图片文件!');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!');
    return false;
  }
  return true;
};

const handleSubmit = async () => {
  try {
    // 处理价格字段：将字符串转换为数字
    const submitData: any = { ...form };
    const priceValue = submitData.price;
    if (priceValue !== undefined && priceValue !== null && priceValue !== '') {
      const priceNum = parseFloat(String(priceValue));
      submitData.price = isNaN(priceNum) ? 0 : priceNum;
    } else {
      submitData.price = 0;
    }

    if (form.id) {
      const resp = await updateScenicSpot(submitData);
      if (resp.data.code === 200) {
        ElMessage.success('更新成功');
        dialogVisible.value = false;
        loadData();
      } else {
        ElMessage.error(resp.data.msg || '更新失败');
      }
    } else {
      const resp = await createScenicSpot(submitData);
      if (resp.data.code === 200) {
        ElMessage.success('创建成功');
        dialogVisible.value = false;
        // 新增成功后，重置到第一页并清除查询条件，确保能看到新添加的景点
        query.name = '';
        query.province = '';
        query.city = '';
        pagination.pageNum = 1;
        loadData();
      } else {
        ElMessage.error(resp.data.msg || '创建失败');
      }
    }
  } catch (e) {
    ElMessage.error('请求失败');
  }
};

const handleDelete = (row: ScenicSpot) => {
  ElMessageBox.confirm(`确认删除景点「${row.name}」吗？`, '提示', {
    type: 'warning'
  })
    .then(async () => {
      try {
        const resp = await deleteScenicSpot(row.id!);
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

.image-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 178px;
  height: 178px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.image-uploader:hover {
  border-color: #409eff;
}

.image-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}
</style>











