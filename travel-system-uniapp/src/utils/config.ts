/**
 * 应用配置文件
 * 统一管理服务器地址等配置
 * 
 * 本地开发配置说明：
 * 1. 在微信开发者工具中：使用 localhost:8080（已自动配置）
 * 2. 在真机预览时：需要修改 LOCAL_IP 为你的本机局域网 IP（如 192.168.1.100）
 * 
 * 如何获取本机 IP：
 * Windows: 在命令行运行 ipconfig，查找 IPv4 地址
 * Mac/Linux: 在终端运行 ifconfig 或 ip addr，查找局域网 IP
 */

// ========== 本地开发配置 ==========
// 请将下面的 LOCAL_IP 替换为你的本机局域网 IP 地址
// 例如：192.168.1.100、192.168.0.105 等
// 注意：真机预览时必须使用局域网 IP，不能使用 localhost
// 
// 如何获取本机 IP：
// Windows: 在命令行运行 ipconfig，查找 "IPv4 地址"
// Mac/Linux: 在终端运行 ifconfig，查找 inet 地址
// 
// 检测到的可能 IP 地址：
// - 192.168.142.1
// - 192.168.214.1  
// - 192.168.32.1
// 请选择你当前连接 WiFi/网络对应的 IP（通常是第一个）
const LOCAL_IP = '192.168.142.1' // ⚠️ 请修改为你的本机 IP 地址

// 开发环境配置（微信开发者工具）
const DEV_CONFIG = {
  // API 基础地址
  API_BASE_URL: 'http://localhost:8080/api/v1',
  // 静态资源基础地址（图片等）
  STATIC_BASE_URL: 'http://localhost:8080',
}

// 真机预览配置（使用局域网 IP）
const PREVIEW_CONFIG = {
  // API 基础地址
  API_BASE_URL: `http://${LOCAL_IP}:8080/api/v1`,
  // 静态资源基础地址（图片等）
  STATIC_BASE_URL: `http://${LOCAL_IP}:8080`,
}

// 生产环境配置（有服务器时使用）
const PROD_CONFIG = {
  // API 基础地址 - 请替换为实际的服务器地址
  API_BASE_URL: 'https://api.yourdomain.com/api/v1',
  // 静态资源基础地址（图片等）- 请替换为实际的服务器地址
  STATIC_BASE_URL: 'https://yourdomain.com',
}

/**
 * 获取当前环境配置
 */
const getConfig = () => {
  // #ifdef MP-WEIXIN
  // 微信小程序环境判断
  try {
    // @ts-ignore - wx 是微信小程序的全局对象
    const wxGlobal = typeof wx !== 'undefined' ? wx : null
    if (wxGlobal && wxGlobal.getAppBaseInfo) {
      const appBaseInfo = wxGlobal.getAppBaseInfo()
      // 开发工具环境：使用 localhost
      if (appBaseInfo && appBaseInfo.platform === 'devtools') {
        return DEV_CONFIG
      }
      // 真机预览：使用局域网 IP
      // 注意：如果 LOCAL_IP 未配置，会使用 localhost（可能无法访问）
      return PREVIEW_CONFIG
    }
  } catch (e) {
    // 忽略错误，使用预览配置
  }
  // 真机预览或生产环境
  return PREVIEW_CONFIG
  // #endif

  // #ifndef MP-WEIXIN
  // 其他平台默认使用开发环境配置
  return DEV_CONFIG
  // #endif
}

export const config = getConfig()

// 导出配置项
export const API_BASE_URL = config.API_BASE_URL
export const STATIC_BASE_URL = config.STATIC_BASE_URL

