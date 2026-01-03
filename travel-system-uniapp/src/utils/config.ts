/**
 * 应用配置文件
 * 统一管理服务器地址等配置
 * 
 * 开发模式配置说明：
 * 1. H5 平台：使用 localhost:8080（本地开发）
 * 2. 微信小程序：由于平台限制，需要使用局域网 IP 地址
 * 
 * 如何获取本机 IP（仅微信小程序需要）：
 * Windows: 在命令行运行 ipconfig，查找 "IPv4 地址"
 * Mac/Linux: 在终端运行 ifconfig，查找 inet 地址
 */

// ========== 开发环境配置 ==========
// H5 平台使用 localhost（本地开发）
const DEV_CONFIG = {
  // API 基础地址
  API_BASE_URL: 'http://localhost:8080/api/v1',
  // 静态资源基础地址（图片等）
  STATIC_BASE_URL: 'http://localhost:8080',
}

// ========== 微信小程序配置 ==========
// 微信小程序由于平台限制，不能访问 localhost，需要使用局域网 IP
// 请将下面的 LOCAL_IP 替换为你的本机局域网 IP 地址
const LOCAL_IP = '192.168.142.1' // ⚠️ 微信小程序需要：请修改为你的本机 IP 地址

const MP_WEIXIN_CONFIG = {
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
 * 
 * 配置说明：
 * - H5 平台：使用 localhost:8080（本地开发模式）
 * - 微信小程序：由于平台限制，使用局域网 IP 地址
 */
const getConfig = () => {
  // #ifdef MP-WEIXIN
  // 微信小程序环境：必须使用局域网 IP，因为微信小程序不允许访问 localhost
  // 注意：后端需要监听 0.0.0.0 才能通过 IP 访问
  return MP_WEIXIN_CONFIG
  // #endif

  // #ifndef MP-WEIXIN
  // H5 等其他平台：使用 localhost（本地开发模式）
  return DEV_CONFIG
  // #endif
}

export const config = getConfig()

// 导出配置项
export const API_BASE_URL = config.API_BASE_URL
export const STATIC_BASE_URL = config.STATIC_BASE_URL

