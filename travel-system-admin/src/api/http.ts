import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

// 自定义参数序列化器，确保 undefined 值不会被序列化
const paramsSerializer = (params: any): string => {
  if (!params || typeof params !== 'object') {
    return '';
  }

  const searchParams = new URLSearchParams();
  let hasFiltered = false;

  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const value = params[key];

      // 跳过 undefined、null 和字符串 "undefined"、"null"
      if (value === undefined || value === null || value === 'undefined' || value === 'null') {
        hasFiltered = true;
        console.warn(`[参数序列化器] 跳过无效参数: ${key} = ${value}`);
        continue;
      }

      // 处理数组
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (item !== undefined && item !== null && item !== 'undefined' && item !== 'null') {
            searchParams.append(key, String(item));
          } else {
            hasFiltered = true;
            console.warn(`[参数序列化器] 跳过无效数组项: ${key}[${index}] = ${item}`);
          }
        });
      } else {
        // 处理普通值
        searchParams.append(key, String(value));
      }
    }
  }

  const result = searchParams.toString();
  if (hasFiltered) {
    console.log('[参数序列化器] 序列化结果:', result);
  }

  return result;
};

const http = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  timeout: 10000,
  // 使用自定义参数序列化器，确保 undefined 值不会被序列化
  paramsSerializer
});

// 递归清理对象中的 undefined 和 null 值
const cleanParams = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return undefined;
  }

  // 如果是字符串 "undefined" 或 "null"，返回 undefined
  if (typeof obj === 'string' && (obj === 'undefined' || obj === 'null')) {
    return undefined;
  }

  // 如果是数组，递归清理每个元素
  if (Array.isArray(obj)) {
    const cleaned = obj.map(cleanParams).filter(item => item !== undefined && item !== null);
    return cleaned.length > 0 ? cleaned : undefined;
  }

  // 如果是对象，递归清理每个属性
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const cleanedValue = cleanParams(obj[key]);
        // 只添加非 undefined 的值
        if (cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }

  return obj;
};

// 请求拦截器：过滤掉 undefined 和 null 的查询参数
http.interceptors.request.use(
  (config) => {
    // 处理查询参数，过滤掉 undefined 和 null
    if (config.params) {
      // 记录原始参数（用于调试）
      const originalParams = JSON.stringify(config.params);

      // 先使用 cleanParams 递归清理
      const cleaned = cleanParams(config.params);
      // 如果清理后是 undefined，设置为空对象
      config.params = cleaned !== undefined ? cleaned : {};

      // 再次确保清理：直接删除 undefined、null 和字符串 "undefined"、"null"
      if (config.params && typeof config.params === 'object') {
        const finalParams: Record<string, any> = {};
        for (const key in config.params) {
          if (Object.prototype.hasOwnProperty.call(config.params, key)) {
            const value = config.params[key];
            // 只保留有效值
            if (value !== undefined && value !== null && value !== 'undefined' && value !== 'null') {
              finalParams[key] = value;
            } else {
              // 记录被过滤的参数
              console.warn(`[HTTP拦截器] 过滤掉无效参数: ${key} = ${value}`);
            }
          }
        }
        config.params = finalParams;

        // 如果参数被过滤，记录日志
        if (originalParams !== JSON.stringify(config.params)) {
          console.log('[HTTP拦截器] 参数已清理:', {
            method: config.method,
            url: config.url,
            原始参数: JSON.parse(originalParams),
            清理后参数: config.params
          });
        }
      }
    }

    // 检查 URL 中是否包含 "undefined" 字符串（路径参数）
    if (config.url) {
      // 检查完整 URL（包括 baseURL）
      const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
      if (fullUrl.includes('/undefined') || fullUrl.includes('undefined')) {
        console.error('[HTTP拦截器] 检测到 URL 中包含 undefined 值:', fullUrl);
        console.error('[HTTP拦截器] 请求配置:', config);
        return Promise.reject(new Error('请求参数错误：ID 不能为空'));
      }
    }

    // 最终检查：确保 params 中没有 undefined
    if (config.params && typeof config.params === 'object') {
      for (const key in config.params) {
        const value = config.params[key];
        if (value === undefined || value === 'undefined') {
          console.error('[HTTP拦截器] 发现未清理的 undefined 参数:', key, '在请求:', config.method, config.url);
          delete config.params[key];
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

http.interceptors.response.use(
  (resp) => resp,
  (error) => {
    return Promise.reject(error);
  }
);

export default http;





