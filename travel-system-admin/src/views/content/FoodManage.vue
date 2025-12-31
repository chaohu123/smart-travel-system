<template>
  <div>
    <el-card class="mb-16">
      <el-form :inline="true" :model="query">
        <el-form-item label="美食名称">
          <el-input v-model="query.name" placeholder="请输入美食名称" clearable />
        </el-form-item>
        <el-form-item label="省份">
          <el-input v-model="query.province" placeholder="请输入省份（如：浙江省）" clearable />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="query.city" placeholder="请输入城市（如：杭州市）" clearable />
        </el-form-item>
        <el-form-item label="美食类型">
          <el-input v-model="query.foodType" placeholder="请输入美食类型" clearable />
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
        <el-table-column prop="name" label="美食名称" />
        <el-table-column label="省份/城市" min-width="160">
          <template #default="{ row }">
            <span>{{ row.province || '-' }}</span>
            <span v-if="row.city"> / {{ row.city }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地址" />
        <el-table-column prop="foodType" label="美食类型" width="120" />
        <el-table-column prop="avgPrice" label="平均价格" width="120">
          <template #default="{ row }">
            <span v-if="row.avgPrice">¥{{ row.avgPrice }}/人</span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="评分" width="100">
          <template #default="{ row }">
            <span v-if="row.score">{{ row.score }}分</span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="isRecommend" label="推荐" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isRecommend === 1 ? 'success' : 'info'">
              {{ row.isRecommend === 1 ? '是' : '否' }}
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="900px">
      <!-- 步骤条 -->
      <el-steps :active="currentStep" finish-status="success" style="margin-bottom: 30px;">
        <el-step title="基本信息" />
        <el-step title="价格和类型" />
        <el-step title="其他信息和图片" />
      </el-steps>

      <el-form :model="form" label-width="120px" ref="formRef">
        <!-- 第一步：基本信息 -->
        <div v-show="currentStep === 0">
          <el-form-item label="美食名称" prop="name" :rules="[{ required: true, message: '请输入美食名称', trigger: 'blur' }]">
            <el-input v-model="form.name" placeholder="请输入美食名称" />
          </el-form-item>

          <el-form-item label="位置">
            <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
              <div style="display: flex; flex-direction: column; min-width: 120px;">
                <el-radio-group v-model="locationMode">
                  <el-radio value="map">地图选点（推荐）</el-radio>
                </el-radio-group>
              </div>
              <div style="display: flex; align-items: center; gap: 16px; flex: 1;">
                <el-radio-group v-model="locationMode">
                  <el-radio value="manual">手动填写</el-radio>
                </el-radio-group>
                <el-form-item
                  v-show="locationMode === 'manual'"
                  prop="province"
                  :rules="[{ required: true, message: '请选择省份', trigger: 'change' }]"
                  style="margin-bottom: 0; flex: 1; min-width: 150px;"
                >
                  <el-select v-model="form.province" placeholder="请选择省份" @change="handleProvinceChange" clearable style="width: 100%;">
                    <el-option
                      v-for="province in provinceOptions"
                      :key="province.value"
                      :label="province.label"
                      :value="province.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item
                  v-show="locationMode === 'manual'"
                  prop="city"
                  :rules="[{ required: true, message: '请选择城市', trigger: 'change' }]"
                  style="margin-bottom: 0; flex: 1; min-width: 150px;"
                >
                  <el-select v-model="form.city" placeholder="请选择城市" clearable :disabled="!form.province" style="width: 100%;">
                    <el-option
                      v-for="city in cityOptions"
                      :key="city"
                      :label="city"
                      :value="city"
                    />
                  </el-select>
                </el-form-item>
              </div>
            </div>
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
          <el-form-item label="详细地址" prop="address" :rules="[{ required: true, message: '请输入详细地址', trigger: 'blur' }]">
            <el-input v-model="form.address" placeholder="请输入详细地址" />
          </el-form-item>
        </div>

        <!-- 第二步：价格和类型 -->
        <div v-show="currentStep === 1">
          <el-form-item label="美食类型" prop="foodType" :rules="[{ required: true, message: '请输入美食类型', trigger: 'blur' }]">
            <el-input v-model="form.foodType" placeholder="如：川菜、粤菜、小吃" />
          </el-form-item>

          <el-form-item label="平均价格">
            <el-input-number v-model="form.avgPrice" :min="0" :precision="2" placeholder="人均价格（元）" style="width: 100%;" />
          </el-form-item>
        </div>

        <!-- 第三步：其他信息和图片 -->
        <div v-show="currentStep === 2">
          <el-form-item label="是否推荐">
            <el-radio-group v-model="form.isRecommend">
              <el-radio :label="1">是</el-radio>
              <el-radio :label="0">否</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="初始评分">
            <el-slider v-model="scoreRate" :min="0" :max="5" :step="0.1" show-input @change="handleScoreChange" style="width: 100%;" />
          </el-form-item>

          <el-form-item label="简介" prop="intro" :rules="[{ required: true, message: '请输入简介', trigger: 'blur' }]">
            <el-input v-model="form.intro" type="textarea" :rows="6" placeholder="请输入美食简介" />
          </el-form-item>

          <!-- 美食图片 - URL链接 -->
          <el-form-item label="添加URL上传图片">
            <div style="margin-bottom: 16px;">
              <div style="display: flex; gap: 8px; align-items: center;">
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
              <div class="upload-tip" style="margin-top: 8px;">输入URL后点击"添加"按钮将图片添加到列表</div>
            </div>
            <!-- 预览区域 -->
            <div v-if="previewUrlList.length > 0" style="margin-bottom: 16px;">
              <div style="color: #606266; font-size: 14px; margin-bottom: 8px;">预览图片（点击"添加"按钮添加到列表）：</div>
              <div class="image-list">
                <div v-for="(url, index) in previewUrlList" :key="'preview-' + index" class="image-item">
                  <img
                    :src="getImageUrl(url)"
                    class="image-preview-small"
                    @error="handleImageError"
                    crossorigin="anonymous"
                    referrerpolicy="no-referrer"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
            <!-- 已添加的图片列表 -->
            <div v-if="urlImageList.length > 0" class="image-list">
              <div v-for="(url, index) in urlImageList" :key="'url-' + index" class="image-item">
                <img
                  :src="getImageUrl(url)"
                  class="image-preview-small"
                  @error="handleImageError"
                  crossorigin="anonymous"
                  referrerpolicy="no-referrer"
                  loading="lazy"
                />
                <el-button
                  type="danger"
                  size="small"
                  circle
                  class="image-delete-btn"
                  @click="removeUrlImage(index)"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </div>
          </el-form-item>

          <!-- 美食图片 - 本地上传 -->
          <el-form-item label="本地上传图片">
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
              <div v-if="uploadedImageList.length > 0" class="image-list">
                <div v-for="(url, index) in uploadedImageList" :key="'upload-' + index" class="image-item">
                  <img
                    :src="getImageUrl(url)"
                    class="image-preview-small"
                    @error="handleImageError"
                    crossorigin="anonymous"
                    referrerpolicy="no-referrer"
                    loading="lazy"
                  />
                  <el-button
                    type="danger"
                    size="small"
                    circle
                    class="image-delete-btn"
                    @click="removeUploadedImage(index)"
                  >
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
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

    <!-- 地图选点组件 -->
    <MapPicker
      v-model="mapPickerVisible"
      :api-key="mapApiKey"
      :security-key="mapSecurityKey"
      :initial-location="initialMapLocation"
      :initial-search-keyword="form.name"
      @confirm="handleMapPickerConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed, nextTick, watch } from 'vue';
import {
  deleteFood,
  fetchFoodList,
  createFood,
  updateFood,
  type Food
} from '@/api/food';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Close } from '@element-plus/icons-vue';
import MapPicker from '@/components/MapPicker.vue';
import { getMapApiKey, getMapSecurityKey } from '@/config/map';

const query = reactive<Partial<Food>>({
  name: '',
  province: '',
  city: '',
  foodType: ''
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

const list = ref<Food[]>([]);
const multipleSelection = ref<Food[]>([]);
const batchDeleteMode = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增美食');
const uploadAction = ref('http://localhost:8080/api/v1/admin/upload/image');
const urlImageInput = ref('');
const urlImageList = ref<string[]>([]);
const uploadedImageList = ref<string[]>([]);
const previewUrlList = ref<string[]>([]);
const currentStep = ref(0);
const formRef = ref();
const locationMode = ref('manual');
const scoreRate = ref(4.0);
const mapPickerVisible = ref(false);
const mapApiKey = ref(getMapApiKey()); // 从配置文件获取地图API Key
const mapSecurityKey = ref(getMapSecurityKey()); // 从配置文件获取地图安全密钥
const initialMapLocation = computed(() => ({
  latitude: form.latitude,
  longitude: form.longitude
}));

const form = reactive<Food>({
  name: '',
  province: '',
  city: '',
  address: '',
  latitude: undefined,
  longitude: undefined,
  foodType: '',
  avgPrice: undefined,
  intro: '',
  imageUrl: '',
  score: undefined,
  hotScore: 0,
  isRecommend: 0
});

const loadData = async () => {
  try {
    // 构建查询参数，过滤掉空字符串和undefined
    const params: any = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    };
    
    // 只添加非空的查询条件
    if (query.name && query.name.trim()) {
      params.name = query.name.trim();
    }
    if (query.province && query.province.trim()) {
      params.province = query.province.trim();
    }
    if (query.city && query.city.trim()) {
      params.city = query.city.trim();
    }
    if (query.foodType && query.foodType.trim()) {
      params.foodType = query.foodType.trim();
    }
    
    const resp = await fetchFoodList(params);
    if (resp.data.code === 200) {
      list.value = resp.data.rows;
      pagination.total = resp.data.total || 0;
    } else {
      ElMessage.error(resp.data.msg || '加载失败');
    }
  } catch (e) {
    console.error('查询失败:', e);
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
  query.foodType = '';
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

const handleSelectionChange = (val: Food[]) => {
  multipleSelection.value = val;
};

const handleAdd = () => {
  dialogTitle.value = '新增美食';
  currentStep.value = 0;
  urlImageInput.value = '';
  urlImageList.value = [];
  uploadedImageList.value = [];
  previewUrlList.value = [];
  locationMode.value = 'manual';
  scoreRate.value = 4.0;
  Object.assign(form, {
    id: undefined,
    name: '',
    province: '',
    city: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
    foodType: '',
    avgPrice: undefined,
    intro: '',
    imageUrl: '',
    score: 4.0,
    hotScore: 0,
    isRecommend: 0
  });
  dialogVisible.value = true;
  // 重置表单验证
  nextTick(() => {
    if (formRef.value) {
      formRef.value.clearValidate();
    }
  });
};

const handleEdit = (row: Food) => {
  dialogTitle.value = '编辑美食';
  currentStep.value = 0;
  locationMode.value = 'manual';
  scoreRate.value = row.score ? Number(row.score) : 4.0;
  // 解析图片URL（可能是逗号分隔的多个URL，支持中英文逗号）
  if (row.imageUrl) {
    let imageUrlStr = row.imageUrl;

    // 先尝试解码整个字符串
    try {
      imageUrlStr = decodeURIComponent(imageUrlStr);
    } catch (e) {
      // 解码失败，使用原字符串
    }

    const imageUrls = imageUrlStr
      .split(/[,，]/) // 支持英文逗号和中文逗号
      .map(url => {
        url = url.trim();

        // 去除URL中可能存在的编码逗号字符
        url = url.replace(/%EF%BC%8C/gi, ''); // 去除中文逗号的编码
        url = url.replace(/%2C/gi, ''); // 去除英文逗号的编码

        // 去除首尾可能残留的编码字符
        url = url.replace(/^[%EF%BC%8C%2C，,]+/, '');
        url = url.replace(/[%EF%BC%8C%2C，,]+$/, '');

        // 再次尝试解码
        try {
          const decoded = decodeURIComponent(url);
          if (decoded.startsWith('http://') || decoded.startsWith('https://') || decoded.startsWith('/')) {
            url = decoded;
          }
        } catch (e) {
          // 解码失败，使用原URL
        }

        return url.trim();
      })
      .filter(url => url);

    urlImageList.value = imageUrls.filter(url => url.startsWith('http'));
    uploadedImageList.value = imageUrls.filter(url => !url.startsWith('http'));
    urlImageInput.value = urlImageList.value.join(', ');
  } else {
    urlImageList.value = [];
    uploadedImageList.value = [];
    urlImageInput.value = '';
  }
  Object.assign(form, row);
  dialogVisible.value = true;
  // 重置表单验证
  nextTick(() => {
    if (formRef.value) {
      formRef.value.clearValidate();
    }
  });
};

// 步骤切换
const nextStep = async () => {
  if (!formRef.value) return;

  // 验证当前步骤的表单字段
  const fieldsToValidate: string[] = [];
  if (currentStep.value === 0) {
    fieldsToValidate.push('name', 'province', 'city', 'address');
  } else if (currentStep.value === 1) {
    fieldsToValidate.push('foodType');
  }

  if (fieldsToValidate.length > 0) {
    try {
      await formRef.value.validateField(fieldsToValidate);
      currentStep.value++;
    } catch (error) {
      ElMessage.warning('请完成必填项后再继续');
    }
  } else {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

// 评分改变
const handleScoreChange = (value: number) => {
  form.score = value;
};

// 打开地图选点
const openMapPicker = () => {
  if (!mapApiKey.value) {
    ElMessage.warning('地图API Key未配置，请检查配置文件');
    return;
  }
  mapPickerVisible.value = true;
};

// 监听位置模式变化，当选择地图选点时自动打开地图
watch(locationMode, (newVal) => {
  if (newVal === 'map') {
    openMapPicker();
  }
});

// 辅助函数：标准化省份名称（去除后缀）
const normalizeProvinceName = (province: string): string => {
  if (!province) return '';
  // 去除常见的省份后缀
  return province.replace(/省|市|自治区|特别行政区|维吾尔自治区|壮族自治区|回族自治区/g, '').trim();
};

// 辅助函数：标准化城市名称（去除后缀，但保留直辖市）
const normalizeCityName = (city: string, province: string): string => {
  if (!city) return '';
  // 直辖市：北京、上海、天津、重庆，保持原样
  const directCities = ['北京', '上海', '天津', '重庆'];
  if (directCities.includes(province) && directCities.includes(city)) {
    return city;
  }
  // 其他城市：去除常见的城市后缀
  return city.replace(/市|区|县|自治州|地区|自治县/g, '').trim();
};

// 地图选点确认回调
const handleMapPickerConfirm = (location: any) => {
  console.log('地图选点返回的数据:', location);

  // 自动填充表单字段
  form.latitude = location.latitude;
  form.longitude = location.longitude;
  form.address = location.address;

  let provinceMatched = false;
  let cityMatched = false;

  // 改进的省份匹配逻辑
  if (location.province) {
    const provinceText = normalizeProvinceName(location.province);

    // 先尝试精确匹配（包含后缀）
    let provinceMatch = provinceOptions.find(p => p.label === location.province);

    // 如果精确匹配失败，尝试去除后缀后匹配
    if (!provinceMatch) {
      provinceMatch = provinceOptions.find(p => {
        const pLabel = normalizeProvinceName(p.label);
        return pLabel === provinceText ||
               p.label === provinceText ||
               location.province.includes(p.label) ||
               p.label.includes(location.province);
      });
    }

    if (provinceMatch) {
      form.province = provinceMatch.value;
      provinceMatched = true;
      console.log('匹配到省份:', provinceMatch.value);
      // 触发城市选项更新
      handleProvinceChange(provinceMatch.value);
    } else {
      console.warn('未找到匹配的省份:', location.province);
      ElMessage.warning(`未找到匹配的省份: ${location.province}，请手动选择`);
    }
  }

  // 改进的城市匹配逻辑（需要等待城市选项更新）
  if (location.city && form.province) {
    // 保存到局部常量，确保类型安全
    const cityName = location.city;
    const provinceName = form.province;
    
    // 使用 nextTick 确保城市选项已更新
    nextTick(() => {
      // 再次检查，确保在异步回调中值仍然存在
      if (!cityName || !provinceName) {
        return;
      }
      
      const cityText = normalizeCityName(cityName, provinceName);

      // 先尝试精确匹配
      let cityMatch = cityOptions.value.find(c => c === cityName);

      // 如果精确匹配失败，尝试去除后缀后匹配
      if (!cityMatch) {
        cityMatch = cityOptions.value.find(c => {
          const cText = normalizeCityName(c, provinceName);
          return cText === cityText ||
                 c === cityText ||
                 cityName === c ||
                 cityName.includes(c) ||
                 c.includes(cityName) ||
                 normalizeCityName(cityName, provinceName) === c ||
                 normalizeCityName(c, provinceName) === normalizeCityName(cityName, provinceName);
        });
      }

      // 特殊处理：直辖市
      const directCities = ['北京', '上海', '天津', '重庆'];
      if (!cityMatch && directCities.includes(provinceName)) {
        // 直辖市：如果城市名称包含省份名称，使用省份名称作为城市
        const normalizedProvince = normalizeProvinceName(provinceName);
        const normalizedCity = normalizeCityName(cityName, provinceName);
        if (normalizedCity === normalizedProvince || cityName.includes(provinceName) || provinceName.includes(normalizeCityName(cityName, provinceName))) {
          cityMatch = provinceName;
        }
      }

      if (cityMatch) {
        form.city = cityMatch;
        cityMatched = true;
        console.log('匹配到城市:', cityMatch, '原始城市名称:', cityName);
        ElMessage.success('位置信息已自动填充，省份和城市已自动选择');
      } else {
        console.warn('未找到匹配的城市:', cityName, '省份:', provinceName);
        console.log('可用的城市选项:', cityOptions.value);
        // 如果仍然没有匹配，尝试使用原始城市名称（去除常见后缀后）
        const fallbackCity = normalizeCityName(cityName, provinceName);
        if (fallbackCity && fallbackCity !== location.city) {
          form.city = fallbackCity;
          ElMessage.warning({
            message: `已自动填充城市名称: ${fallbackCity}，如果提交失败，请手动选择正确的城市。`,
            duration: 5000,
            showClose: true
          });
        } else {
          ElMessage.warning({
            message: `未找到匹配的城市: ${location.city}，请手动选择城市。\n提示：请确保该城市已在城市管理中创建。`,
            duration: 5000,
            showClose: true
          });
        }
      }
    });
  } else if (location.city && !form.province) {
    // 如果只有城市没有省份，提示用户先选择省份
    ElMessage.warning('请先选择省份，然后再选择城市');
  } else if (provinceMatched && !location.city) {
    ElMessage.success('位置信息已自动填充，请手动选择城市');
  } else if (!provinceMatched && !cityMatched) {
    ElMessage.warning('请手动选择省份和城市');
  }

  // 保持地图选点模式，不切换回手动模式
};

const handleImageSuccess = (response: any, file: any) => {
  if (response && response.code === 200) {
    const imageUrl = response.data.url || response.data;
    uploadedImageList.value.push(imageUrl);
    ElMessage.success('图片上传成功');
  } else {
    ElMessage.error(response?.msg || '图片上传失败');
  }
};

// 解析URL字符串为URL数组
const parseUrlString = (inputText: string): string[] => {
  if (!inputText.trim()) {
    return [];
  }

  // 先尝试解码整个字符串（处理URL编码的逗号）
  try {
    inputText = decodeURIComponent(inputText);
  } catch (e) {
    // 如果解码失败，使用原字符串
  }

  // 同时支持英文逗号和中文逗号分隔
  const urls = inputText
    .split(/[,，]/) // 支持英文逗号和中文逗号
    .map(url => {
      // 去除首尾空白
      url = url.trim();

      // 去除URL中可能存在的编码逗号字符（%EF%BC%8C是中文逗号，%2C是英文逗号）
      url = url.replace(/%EF%BC%8C/gi, ''); // 去除中文逗号的编码
      url = url.replace(/%2C/gi, ''); // 去除英文逗号的编码

      // 去除首尾可能残留的编码字符
      url = url.replace(/^[%EF%BC%8C%2C，,]+/, '');
      url = url.replace(/[%EF%BC%8C%2C，,]+$/, '');

      // 再次尝试解码（处理其他可能的编码字符）
      try {
        const decoded = decodeURIComponent(url);
        // 如果解码后仍然是有效的URL格式，使用解码后的
        if (decoded.startsWith('http://') || decoded.startsWith('https://') || decoded.startsWith('/')) {
          url = decoded;
        }
      } catch (e) {
        // 如果解码失败，使用原URL
      }

      return url.trim();
    })
    .filter(url => {
      // 过滤掉空字符串和无效URL
      return url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'));
    });

  return urls;
};

// 处理URL输入框变化事件（实时解析）
const handleUrlInputChange = () => {
  previewUrlList.value = parseUrlString(urlImageInput.value);
};

// 添加预览的URL图片到列表
const handleAddUrlImages = () => {
  if (previewUrlList.value.length > 0) {
    const count = previewUrlList.value.length;
    // 将预览的URL添加到已添加列表
    urlImageList.value.push(...previewUrlList.value);
    // 清空输入框和预览列表
    urlImageInput.value = '';
    previewUrlList.value = [];
    ElMessage.success(`成功添加 ${count} 张图片`);
  }
};

// 移除URL图片
const removeUrlImage = (index: number) => {
  urlImageList.value.splice(index, 1);
  urlImageInput.value = urlImageList.value.join(', ');
};

// 移除上传的图片
const removeUploadedImage = (index: number) => {
  uploadedImageList.value.splice(index, 1);
};

// 获取完整的图片URL
const getImageUrl = (url: string) => {
  if (!url) return '';
  // 如果已经是完整URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // 对于外部图片URL，尝试添加一些参数来避免跨域问题
    // 注意：某些CDN可能不支持，这只是尝试
    try {
      const urlObj = new URL(url);
      // 如果是百度图片CDN，可能需要特殊处理
      if (urlObj.hostname.includes('bcebos.com') || urlObj.hostname.includes('baidu.com')) {
        // 保持原URL，但添加crossorigin属性（在img标签上）
        return url;
      }
    } catch (e) {
      // URL解析失败，直接返回原URL
    }
    return url;
  }
  // 如果是相对路径，添加基础URL
  if (url.startsWith('/')) {
    return `http://localhost:8080${url}`;
  }
  return url;
};

// 处理图片加载错误
const handleImageError = (event: any) => {
  console.error('图片加载失败:', event.target.src);
  // 设置占位图，避免显示破损图片图标
  const target = event.target as HTMLImageElement;
  // 使用一个透明的1x1像素占位图，或者使用data URI
  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5Zu+54mH5aSx6LSlPC90ZXh0Pjwvc3ZnPg==';
  // 添加错误标记，方便后续处理
  target.setAttribute('data-error', 'true');
  target.style.backgroundColor = '#f5f5f5';
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
    // 验证最后一步的表单字段
    if (!formRef.value) return;
    try {
      await formRef.value.validateField(['intro']);
    } catch (error) {
      ElMessage.warning('请完成必填项后再提交');
      return;
    }

    // 验证省份和城市是否已选择
    if (!form.province || !form.city) {
      ElMessage.error('请选择省份和城市');
      // 如果是在最后一步，跳回第一步让用户选择
      if (currentStep.value === 2) {
        currentStep.value = 0;
      }
      return;
    }

    // 合并所有图片URL
    const allImages = [...urlImageList.value, ...uploadedImageList.value];
    const imageUrlString = allImages.join(',');

    // 处理价格字段：将字符串转换为数字
    const submitData: any = { ...form };
    const avgPriceValue = submitData.avgPrice;
    if (avgPriceValue !== undefined && avgPriceValue !== null && avgPriceValue !== '') {
      const avgPriceNum = parseFloat(String(avgPriceValue));
      submitData.avgPrice = isNaN(avgPriceNum) ? 0 : avgPriceNum;
    } else {
      submitData.avgPrice = undefined;
    }

    // 设置图片URL（多个URL用逗号分隔）
    submitData.imageUrl = imageUrlString;

    // 确保提交的城市和省份名称格式正确（与数据库中的格式一致）
    console.log('提交数据 - 省份:', submitData.province, '城市:', submitData.city);

    if (form.id) {
      const resp = await updateFood(submitData);
      if (resp.data.code === 200) {
        ElMessage.success('更新成功');
        dialogVisible.value = false;
        loadData();
      } else {
        // 如果是城市未找到的错误，提供更友好的提示
        if (resp.data.msg && resp.data.msg.includes('未找到对应的城市')) {
          ElMessage.error({
            message: `更新失败：${resp.data.msg}\n\n解决方案：\n1. 请先在城市管理中创建该城市\n2. 或者手动选择已存在的城市`,
            duration: 6000,
            showClose: true
          });
          // 跳回第一步让用户重新选择
          currentStep.value = 0;
        } else {
          ElMessage.error(resp.data.msg || '更新失败');
        }
      }
    } else {
      const resp = await createFood(submitData);
      if (resp.data.code === 200) {
        ElMessage.success('创建成功');
        dialogVisible.value = false;
        // 新增成功后，重置到第一页并清除查询条件，确保能看到新添加的美食
        query.name = '';
        query.province = '';
        query.city = '';
        query.foodType = '';
        pagination.pageNum = 1;
        loadData();
      } else {
        // 如果是城市未找到的错误，提供更友好的提示
        if (resp.data.msg && resp.data.msg.includes('未找到对应的城市')) {
          ElMessage.error({
            message: `创建失败：${resp.data.msg}\n\n解决方案：\n1. 请先在城市管理中创建该城市\n2. 或者手动选择已存在的城市`,
            duration: 6000,
            showClose: true
          });
          // 跳回第一步让用户重新选择
          currentStep.value = 0;
        } else {
          ElMessage.error(resp.data.msg || '创建失败');
        }
      }
    }
  } catch (e) {
    ElMessage.error('请求失败');
  }
};

const handleDelete = (row: Food) => {
  ElMessageBox.confirm(`确认删除美食「${row.name}」吗？`, '提示', {
    type: 'warning'
  })
    .then(async () => {
      try {
        const resp = await deleteFood(row.id!);
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
    ElMessage.info('请选择要删除的美食');
  }
};

const handleConfirmDelete = () => {
  if (!batchDeleteMode.value) return;

  const ids = multipleSelection.value
      .map(item => item.id)
      .filter(id => typeof id === 'number') as number[];

  if (ids.length === 0) {
    ElMessage.warning('请选择要删除的美食');
    return;
  }
  ElMessageBox.confirm('确认删除所选数据吗？', '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  })
      .then(async () => {
        try {
          await Promise.all(ids.map(id => deleteFood(id)));
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
</style>
