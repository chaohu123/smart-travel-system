/**
 * 地图配置
 * 高德地图API Key
 */
export const MAP_API_KEY = 'b49d114eb175a158b25db7bf30156a3d';

/**
 * 高德地图安全密钥（Security Key）
 * 如果启用了安全密钥，需要配置此值
 * 获取方式：高德控制台 -> 应用管理 -> 安全密钥
 *
 * 注意：如果出现 INVALID_USER_SCODE 错误，可能是域名白名单未配置
 * 开发环境建议：设置为空字符串 '' 来禁用安全密钥验证
 * 生产环境：配置正确的安全密钥和域名白名单
 */
export const MAP_SECURITY_KEY = '00e742b2e27d5f78d215f1b27efb460f';

/**
 * 获取地图API Key
 * 优先从环境变量获取，如果没有则使用默认配置
 */
export const getMapApiKey = (): string => {
  // 可以从环境变量获取
  const envKey = import.meta.env.VITE_AMAP_API_KEY;
  return envKey || MAP_API_KEY;
};

/**
 * 获取地图安全密钥
 * 优先从环境变量获取，如果没有则使用默认配置
 */
export const getMapSecurityKey = (): string => {
  // 可以从环境变量获取
  const envKey = import.meta.env.VITE_AMAP_SECURITY_KEY;
  return envKey || MAP_SECURITY_KEY;
};

