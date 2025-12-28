<template>
  <el-dialog
    v-model="visible"
    title="地图选点"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="map-picker-container">
      <!-- 搜索框 -->
      <div class="search-box">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索地点（如：北京市天安门）"
          clearable
          :disabled="mapInitializing || !mapInitialized"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button
              @click="handleSearch"
              :loading="mapInitializing"
              :disabled="mapInitializing || !mapInitialized"
            >
              {{ mapInitializing ? '初始化中...' : '搜索' }}
            </el-button>
          </template>
        </el-input>
        <div v-if="mapInitializing" style="margin-top: 8px; color: #909399; font-size: 12px;">
          地图正在初始化，请稍候...
        </div>
      </div>

      <!-- 地图容器 -->
      <div id="map-container" class="map-container"></div>

      <!-- 选点信息显示 -->
      <div class="location-info" v-if="selectedLocation">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="地址">
            {{ selectedLocation.address }}
          </el-descriptions-item>
          <el-descriptions-item label="省份">
            {{ selectedLocation.province || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="城市">
            {{ selectedLocation.city || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="区县">
            {{ selectedLocation.district || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="纬度">
            {{ selectedLocation.latitude?.toFixed(6) }}
          </el-descriptions-item>
          <el-descriptions-item label="经度">
            {{ selectedLocation.longitude?.toFixed(6) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- API Key 提示 -->
      <el-alert
        v-if="!apiKey"
        title="未配置地图API Key"
        type="warning"
        :closable="false"
        style="margin-top: 16px;"
      >
        <template #default>
          <div>
            <p>请先配置高德地图API Key才能使用地图选点功能。</p>
            <p>获取API Key：<a href="https://console.amap.com/dev/key/app" target="_blank">https://console.amap.com/dev/key/app</a></p>
            <p>配置方式：在系统参数中配置"地图 API Key"</p>
            <p style="color: #f56c6c; margin-top: 8px;">⚠️ 注意：请确保API Key已启用"Web服务"和"地点搜索"服务权限</p>
            <p style="color: #e6a23c; margin-top: 8px;">💡 提示：如果出现"INVALID_USER_SCODE"错误，请检查是否启用了安全密钥。如果启用了，需要在配置文件中设置安全密钥；如果未启用，请在高德控制台关闭安全密钥验证。</p>
          </div>
        </template>
      </el-alert>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :disabled="!selectedLocation">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import { ElMessage } from 'element-plus';

// 声明全局AMap类型
declare global {
  interface Window {
    AMap: any;
    initAMap: () => void;
    _AMapSecurityConfig?: {
      securityJsCode: string;
    };
  }
}

interface LocationInfo {
  address: string;
  province?: string;
  city?: string;
  district?: string;
  latitude: number;
  longitude: number;
}

interface Props {
  modelValue: boolean;
  apiKey?: string;
  securityKey?: string; // 安全密钥（Security Key）
  initialLocation?: {
    latitude?: number;
    longitude?: number;
  };
  initialSearchKeyword?: string; // 初始搜索关键词（如景点名称或美食名称）
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', location: LocationInfo): void;
}

const props = withDefaults(defineProps<Props>(), {
  apiKey: '',
  securityKey: '',
  initialLocation: () => ({}),
  initialSearchKeyword: ''
});

const emit = defineEmits<Emits>();

const searchKeyword = ref('');
const selectedLocation = ref<LocationInfo | null>(null);
const mapInitialized = ref(false);
const mapInitializing = ref(false);
const pluginLoadRetryCount = ref(0);
const maxRetryCount = 3; // 最大重试次数
let map: any = null;
let marker: any = null;
let geocoder: any = null;
let placeSearch: any = null;
let pluginLoadTimeout: any = null;

// 使用computed来处理v-model双向绑定
const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
});

// 监听 modelValue 变化
watch(() => props.modelValue, (val: boolean) => {
  if (val && props.apiKey) {
    mapInitialized.value = false;
    mapInitializing.value = true;
    pluginLoadRetryCount.value = 0; // 重置重试计数
    // 如果有初始搜索关键词，填充到搜索框
    if (props.initialSearchKeyword) {
      searchKeyword.value = props.initialSearchKeyword;
    }
    nextTick(() => {
      initMap();
    });
  } else if (!val) {
    // 关闭时清理
    searchKeyword.value = '';
    selectedLocation.value = null;
    mapInitialized.value = false;
    mapInitializing.value = false;
    pluginLoadRetryCount.value = 0; // 重置重试计数

    // 清除插件加载超时定时器
    if (pluginLoadTimeout) {
      clearTimeout(pluginLoadTimeout);
      pluginLoadTimeout = null;
    }

    if (map) {
      setTimeout(() => {
        try {
          map.destroy();
        } catch (e) {
        }
        map = null;
        marker = null;
        geocoder = null;
        placeSearch = null;
      }, 300);
    }
  }
}, { immediate: true });

// 初始化地图
const initMap = () => {
  if (!props.apiKey) {
    ElMessage.warning('请先配置地图API Key');
    mapInitializing.value = false;
    return;
  }

  // 动态加载高德地图API
  if (!window.AMap) {
    // 清除所有旧的高德地图脚本标签（避免缓存问题）
    const existingScripts = document.querySelectorAll('script[src*="webapi.amap.com"]');
    existingScripts.forEach((script) => {
      script.remove();
    });

    // 清除旧的回调函数
    if ((window as any).initAMap) {
      (window as any).initAMap = undefined;
    }

    // 配置安全密钥（如果存在）
    // 高德地图要求通过 window._AMapSecurityConfig 全局配置对象来设置安全密钥
    if (props.securityKey && props.securityKey.trim() !== '') {
      (window as any)._AMapSecurityConfig = {
        securityJsCode: props.securityKey
      };
    } else {
      // 如果没有安全密钥，清除之前的配置
      if ((window as any)._AMapSecurityConfig) {
        delete (window as any)._AMapSecurityConfig;
      }
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    // 使用1.4.x版本，更稳定
    // 在URL中直接指定要加载的插件
    const scriptUrl = `https://webapi.amap.com/maps?v=1.4.15&key=${props.apiKey}&plugin=AMap.Geocoder,AMap.PlaceSearch,AMap.AutoComplete&callback=initAMap`;
    script.src = scriptUrl;
    script.async = true;
    script.defer = true;

    // 设置加载超时
    const timeout = setTimeout(() => {
      if (!window.AMap) {
        ElMessage.error('地图API加载超时，请检查网络连接或API Key是否正确');
        mapInitializing.value = false;
      }
    }, 10000);

    window.initAMap = () => {
      clearTimeout(timeout);
      if (window.AMap && window.AMap.plugin) {
        loadPluginsAndCreateMap();
      } else {
        ElMessage.error('地图API初始化失败，请刷新页面重试');
        mapInitializing.value = false;
      }
    };

    script.onerror = () => {
      clearTimeout(timeout);
      ElMessage.error('地图API脚本加载失败，请检查网络连接');
      mapInitializing.value = false;
    };

    document.head.appendChild(script);
  } else {
    loadPluginsAndCreateMap();
  }
};

// 加载插件并创建地图
const loadPluginsAndCreateMap = (isRetry: boolean = false) => {
  if (!window.AMap) {
    ElMessage.error('地图API加载失败');
    mapInitializing.value = false;
    return;
  }

  // 检查插件是否已经加载
  const checkPluginsLoaded = () => {
    return window.AMap.Geocoder && window.AMap.PlaceSearch && window.AMap.AutoComplete;
  };

  // 如果插件已经加载，直接创建地图
  if (checkPluginsLoaded()) {
    pluginLoadRetryCount.value = 0; // 重置重试计数
    if (!map) {
      createMapBase();
    }
    initMapServices();
    return;
  }

  // 如果是重试，显示提示
  if (isRetry) {
  }

  // 先创建基础地图（不依赖插件），然后再加载插件
  // 这样可以确保即使插件加载失败，地图也能显示
  try {
    // 清除之前的超时定时器
    if (pluginLoadTimeout) {
      clearTimeout(pluginLoadTimeout);
      pluginLoadTimeout = null;
    }

    // 如果地图不存在，先创建基础地图
    if (!map) {
      createMapBase();
    }

    // 等待地图加载完成后再加载插件
    if (map) {
      // 如果地图已经加载完成，直接加载插件
      if (map.getStatus && map.getStatus() === 'complete') {
        loadPluginsAfterMapReady();
      } else {
        // 等待地图加载完成
        map.on('complete', () => {
          loadPluginsAfterMapReady();
        });

        // 如果地图已经加载完成（complete事件可能已经触发），立即尝试加载插件
        setTimeout(() => {
          if (map && map.getStatus && map.getStatus() === 'complete') {
            loadPluginsAfterMapReady();
          }
        }, 500);
      }
    } else {
      handlePluginLoadFailure(false);
    }
  } catch (error) {
    handlePluginLoadFailure(false);
  }
};

// 在地图加载完成后加载插件
const loadPluginsAfterMapReady = () => {
  if (!map || !window.AMap) {
    return;
  }

  // 先尝试直接初始化服务（插件可能已经可用）
  try {
    if (window.AMap.Geocoder && window.AMap.PlaceSearch) {
      pluginLoadRetryCount.value = 0;
      initMapServices();
      return;
    }
  } catch (e) {
  }

  // 如果插件不可用，尝试加载
  loadPluginsWithRetry();
};

// 加载插件（带重试机制）
const loadPluginsWithRetry = () => {
  const checkPluginsLoaded = () => {
    try {
      return window.AMap.Geocoder && window.AMap.PlaceSearch && window.AMap.AutoComplete;
    } catch (e) {
      return false;
    }
  };

  // 使用AMap.plugin加载插件
  if (window.AMap.plugin) {

    try {
      // 尝试加载插件
      window.AMap.plugin(['AMap.Geocoder', 'AMap.PlaceSearch', 'AMap.AutoComplete'], () => {

        // 延迟检查，给插件时间完全加载
        setTimeout(() => {
          if (checkPluginsLoaded()) {
            pluginLoadRetryCount.value = 0;
            initMapServices();
          } else {
            startPollingForPlugins();
          }
        }, 1000);
      });
    } catch (error) {
      startPollingForPlugins();
    }
  } else {
    startPollingForPlugins();
  }

  // 同时启动轮询检查（作为备用方案）
  startPollingForPlugins();

  // 设置超时保护
  pluginLoadTimeout = setTimeout(() => {
    if (mapInitializing.value && !mapInitialized.value) {
      if (checkPluginsLoaded()) {
        pluginLoadRetryCount.value = 0;
        initMapServices();
      } else {
        handlePluginLoadFailure(false);
      }
    }
  }, 30000);
};

// 轮询检查插件是否加载
const startPollingForPlugins = () => {
  let pollCount = 0;
  const maxPolls = 60; // 30秒
  const interval = 500;

  const checkPluginsLoaded = () => {
    try {
      // 尝试直接创建服务实例来检查插件是否可用
      if (window.AMap.Geocoder && window.AMap.PlaceSearch) {
        try {
          // 尝试创建实例来验证插件是否真正可用
          new window.AMap.Geocoder({ city: '全国' });
          new window.AMap.PlaceSearch({ city: '全国', citylimit: false });
          return true;
        } catch (e) {
          // 如果创建失败，说明插件未完全加载
          return false;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const poll = () => {
    pollCount++;
    if (pollCount % 10 === 0) {
    }

    if (checkPluginsLoaded()) {
      if (pluginLoadTimeout) {
        clearTimeout(pluginLoadTimeout);
        pluginLoadTimeout = null;
      }
      pluginLoadRetryCount.value = 0;
      initMapServices();
      return;
    }

    if (pollCount < maxPolls && mapInitializing.value && !mapInitialized.value) {
      setTimeout(poll, interval);
    } else if (pollCount >= maxPolls) {
    }
  };

  // 延迟一点再开始轮询，给插件加载一些时间
  setTimeout(poll, 500);
};

// 处理插件加载失败
const handlePluginLoadFailure = (callbackExecuted: boolean) => {
  pluginLoadRetryCount.value++;

  if (pluginLoadRetryCount.value < maxRetryCount) {
    // 还有重试机会
    const retryDelay = 2000; // 2秒后重试

    ElMessage.warning({
      message: `地图插件加载失败，${retryDelay / 1000}秒后自动重试 (${pluginLoadRetryCount.value}/${maxRetryCount})`,
      duration: 3000
    });

    setTimeout(() => {
      if (mapInitializing.value && !mapInitialized.value) {
        loadPluginsAndCreateMap(true);
      }
    }, retryDelay);
  } else {
    // 重试次数用完，但允许地图显示（只是搜索功能不可用）
    pluginLoadRetryCount.value = 0; // 重置计数

    // 尝试初始化服务（即使插件可能未完全加载）
    try {
      // 尝试初始化可用的服务
      if (window.AMap.Geocoder) {
        geocoder = new window.AMap.Geocoder({
          city: '全国'
        });
      }

      if (window.AMap.PlaceSearch) {
        placeSearch = new window.AMap.PlaceSearch({
          city: '全国',
          citylimit: false,
          map: map,
          panel: '',
          pageSize: 10,
          pageIndex: 1
        });
      }

      // 标记为已初始化（即使部分功能可能不可用）
      mapInitialized.value = true;
      mapInitializing.value = false;

      const errorMsg = callbackExecuted
        ? '地图插件加载失败，部分功能可能不可用。地图已显示，但搜索功能可能受限。请刷新页面重试。'
        : '地图插件加载超时，部分功能可能不可用。地图已显示，但搜索功能可能受限。请刷新页面重试。';

      ElMessage.warning({
        message: errorMsg,
        duration: 8000,
        showClose: true
      });

    } catch (error) {
      mapInitializing.value = false;

      const errorMsg = callbackExecuted
        ? '地图插件加载失败，回调已执行但插件未完全加载。请检查网络连接或刷新页面重试。'
        : '地图插件加载超时，回调未执行。可能是网络问题或高德地图服务异常，请刷新页面重试。';

      ElMessage.error({
        message: errorMsg,
        duration: 8000,
        showClose: true
      });
    }
  }
};

// 创建基础地图（不依赖插件）
const createMapBase = () => {
  const container = document.getElementById('map-container');
  if (!container) {
    mapInitializing.value = false;
    return false;
  }

  if (!window.AMap) {
    ElMessage.error('地图API未加载');
    mapInitializing.value = false;
    return false;
  }

  // 如果地图已存在，先销毁
  if (map) {
    try {
      map.destroy();
    } catch (e) {
    }
    map = null;
    marker = null;
    geocoder = null;
    placeSearch = null;
  }

  try {
    // 创建地图实例
    map = new window.AMap.Map('map-container', {
      zoom: 13,
      center: props.initialLocation?.longitude && props.initialLocation?.latitude
        ? [props.initialLocation.longitude, props.initialLocation.latitude]
        : [116.397428, 39.90923], // 默认北京天安门
      mapStyle: 'amap://styles/normal'
    });

    // 创建标记
    marker = new window.AMap.Marker({
      position: map.getCenter(),
      draggable: true
    });
    marker.setMap(map);

    // 地图点击事件
    map.on('click', (e: any) => {
      const { lng, lat } = e.lnglat;
      if (marker) {
        marker.setPosition([lng, lat]);
      }
      // 只有在 geocoder 初始化后才调用反向地理编码
      if (geocoder) {
        reverseGeocode(lng, lat);
      }
    });

    // 标记拖拽事件
    marker.on('dragend', (e: any) => {
      const { lng, lat } = e.lnglat;
      // 只有在 geocoder 初始化后才调用反向地理编码
      if (geocoder) {
        reverseGeocode(lng, lat);
      }
    });

    return true;
  } catch (error) {
    ElMessage.error('创建地图失败，请检查API Key是否正确');
    mapInitializing.value = false;
    return false;
  }
};

// 初始化地图服务（需要插件）
const initMapServices = () => {
  if (!map) {
    return;
  }

  // 清除所有定时器
  if (pluginLoadTimeout) {
    clearTimeout(pluginLoadTimeout);
    pluginLoadTimeout = null;
  }

  try {
    // 初始化地理编码服务
    if (window.AMap.Geocoder) {
      geocoder = new window.AMap.Geocoder({
        city: '全国'
      });
    } else {
    }

    // 初始化地点搜索服务
    if (window.AMap.PlaceSearch) {
      placeSearch = new window.AMap.PlaceSearch({
        city: '全国',
        citylimit: false,
        map: map,
        panel: '',
        pageSize: 10,
        pageIndex: 1
      });
    } else {
    }

    // 标记为已初始化
    mapInitialized.value = true;
    mapInitializing.value = false;
    pluginLoadRetryCount.value = 0; // 重置重试计数

    // 如果有初始位置，设置地图中心并获取地址信息
    if (props.initialLocation?.longitude && props.initialLocation?.latitude) {
      const { longitude, latitude } = props.initialLocation;
      map.setCenter([longitude, latitude]);
      if (marker) {
        marker.setPosition([longitude, latitude]);
      }
      if (geocoder) {
        reverseGeocode(longitude, latitude);
      }
    } else if (props.initialSearchKeyword && searchKeyword.value && placeSearch) {
      // 如果有初始搜索关键词且没有初始位置，自动执行搜索
      setTimeout(() => {
        handleSearch();
      }, 500); // 延迟500ms确保地图完全加载
    }
  } catch (error) {
    ElMessage.error('初始化地图服务失败，请刷新页面重试');
    mapInitializing.value = false;
  }
};



// 反向地理编码（根据经纬度获取地址）
const reverseGeocode = (lng: number, lat: number) => {
  if (!geocoder) return;

  geocoder.getAddress([lng, lat], (status: string, result: any) => {
    if (status === 'complete' && result.info === 'OK') {
      const addressComponent = result.regeocode.addressComponent;
      selectedLocation.value = {
        address: result.regeocode.formattedAddress || result.regeocode.address,
        province: addressComponent.province,
        city: addressComponent.city || addressComponent.province,
        district: addressComponent.district,
        latitude: lat,
        longitude: lng
      };
    } else {
      ElMessage.error('获取地址信息失败');
    }
  });
};

// 搜索地点
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词');
    return;
  }

  // 检查地图是否已初始化
  if (mapInitializing.value) {
    ElMessage.warning('地图正在初始化，请稍候...');
    return;
  }

  if (!mapInitialized.value || !placeSearch) {
    ElMessage.warning('地图未初始化完成，请稍候再试');
    // 如果地图API已加载但未初始化，尝试重新初始化
    if (window.AMap && !map) {
      initMap();
    }
    return;
  }

  if (!map) {
    ElMessage.warning('地图未加载');
    return;
  }

  // 使用PlaceSearch进行搜索
  placeSearch.search(searchKeyword.value, (status: string, result: any) => {

    if (status === 'complete') {
      if (result && result.poiList && result.poiList.pois && result.poiList.pois.length > 0) {
        const poi = result.poiList.pois[0];

        // 获取坐标 - 处理不同的坐标格式
        let lng: number, lat: number;
        try {
          if (poi.location) {
            // location可能是AMap.LngLat对象或数组
            if (typeof poi.location.getLng === 'function') {
              lng = poi.location.getLng();
              lat = poi.location.getLat();
            } else if (typeof poi.location.lng === 'number') {
              lng = poi.location.lng;
              lat = poi.location.lat;
            } else if (Array.isArray(poi.location)) {
              [lng, lat] = poi.location;
            } else {
              throw new Error('无法解析坐标');
            }
          } else {
            throw new Error('POI没有坐标信息');
          }
        } catch (error) {
          ElMessage.error('无法获取地点坐标，请尝试其他地点');
          return;
        }

        // 移动地图中心
        map.setCenter([lng, lat]);
        map.setZoom(15);

        // 设置标记位置
        marker.setPosition([lng, lat]);

        // 先设置基本信息
        selectedLocation.value = {
          address: poi.address || poi.name || searchKeyword.value,
          province: poi.province || '',
          city: poi.city || poi.adname || '',
          district: poi.district || poi.adname || '',
          latitude: lat,
          longitude: lng
        };

        // 获取详细地址信息（反向地理编码）
        reverseGeocode(lng, lat);
      } else {
        ElMessage.warning('未找到相关地点，请尝试其他关键词');
      }
    } else if (status === 'no_data') {
      ElMessage.warning('未找到相关地点，请尝试其他关键词');
    } else if (status === 'error') {
      const errorMsg = result?.info || result || '搜索失败';
      let errorText = '';

      // 处理不同的错误类型
      if (errorMsg === 'INVALID_USER_SCODE' || String(errorMsg).includes('INVALID_USER_SCODE')) {
        // 检查是否配置了安全密钥
        const hasSecurityKey = props.securityKey && props.securityKey.trim() !== '';

        if (hasSecurityKey) {
          errorText = '⚠️ 安全密钥验证失败！\n\n可能的原因：\n1. 安全密钥配置不正确\n2. 域名白名单未配置或配置错误\n3. 高德控制台的安全密钥设置有问题\n\n✅ 解决方案：\n1. 检查高德控制台的安全密钥是否正确\n2. 确认域名白名单配置（留空表示无限制）\n3. 如果不需要安全密钥，请在配置文件中将 MAP_SECURITY_KEY 设置为空字符串';
        } else {
          errorText = '⚠️ 安全密钥验证失败！\n\n问题原因：\n高德控制台可能启用了安全密钥验证，但代码中未配置安全密钥。\n\n✅ 解决方案（二选一）：\n\n方案一：禁用安全密钥验证（推荐开发环境）\n1. 登录高德控制台：https://console.amap.com/\n2. 进入"应用管理" → 选择你的应用\n3. 找到"安全密钥"设置\n4. 关闭或清空安全密钥验证\n5. 等待1-2分钟生效后，刷新本页面重试\n\n方案二：配置安全密钥\n1. 在高德控制台获取安全密钥\n2. 在配置文件中设置 MAP_SECURITY_KEY\n3. 确保域名白名单配置正确（留空表示无限制）\n\n💡 提示：\n- 开发环境建议禁用安全密钥验证\n- 域名白名单留空 = 无域名限制\n- 如果域名白名单不为空，请确保包含当前访问的域名';
        }

        ElMessage.error({
          message: errorText,
          duration: 12000,
          showClose: true,
          dangerouslyUseHTMLString: false
        });
      } else if (errorMsg === 'INVALID_USER_KEY' || String(errorMsg).includes('INVALID_USER_KEY')) {
        errorText = 'API Key无效，请检查API Key是否正确配置';
        ElMessage.error(errorText);
      } else if (String(errorMsg).includes('USERKEY_PLAT') || String(errorMsg).includes('权限')) {
        errorText = 'API Key权限不足，请检查是否启用了"地点搜索"服务';
        ElMessage.error(errorText);
      } else if (String(errorMsg).includes('DAILY_QUERY_OVER_LIMIT')) {
        errorText = 'API调用次数超限，请检查配额或联系高德地图';
        ElMessage.error(errorText);
      } else {
        errorText = '搜索失败: ' + String(errorMsg);
        ElMessage.error(errorText);
      }
    } else {
      ElMessage.warning('搜索状态异常: ' + status);
    }
  });
};

// 确认选择
const handleConfirm = () => {
  if (!selectedLocation.value) {
    ElMessage.warning('请先选择地点');
    return;
  }
  emit('confirm', selectedLocation.value);
  visible.value = false;
};

// 关闭弹窗
const handleClose = () => {
  visible.value = false;
};
</script>

<style scoped>
.map-picker-container {
  width: 100%;
}

.search-box {
  margin-bottom: 16px;
}

.map-container {
  width: 100%;
  height: 400px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.location-info {
  margin-top: 16px;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
}
</style>

