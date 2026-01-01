"use strict";
const LOCAL_IP = "192.168.142.1";
const DEV_CONFIG = {
  API_BASE_URL: "http://localhost:8080/api/v1",
  STATIC_BASE_URL: "http://localhost:8080"
};
const PREVIEW_CONFIG = {
  API_BASE_URL: `http://${LOCAL_IP}:8080/api/v1`,
  STATIC_BASE_URL: `http://${LOCAL_IP}:8080`
};
const getConfig = () => {
  try {
    const wxGlobal = typeof wx !== "undefined" ? wx : null;
    if (wxGlobal && wxGlobal.getAppBaseInfo) {
      const appBaseInfo = wxGlobal.getAppBaseInfo();
      if (appBaseInfo && appBaseInfo.platform === "devtools") {
        return DEV_CONFIG;
      }
      return PREVIEW_CONFIG;
    }
  } catch (e) {
  }
  return PREVIEW_CONFIG;
};
const config = getConfig();
const API_BASE_URL = config.API_BASE_URL;
const STATIC_BASE_URL = config.STATIC_BASE_URL;
exports.API_BASE_URL = API_BASE_URL;
exports.STATIC_BASE_URL = STATIC_BASE_URL;
