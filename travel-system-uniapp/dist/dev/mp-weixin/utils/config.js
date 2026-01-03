"use strict";
const LOCAL_IP = "192.168.142.1";
const MP_WEIXIN_CONFIG = {
  API_BASE_URL: `http://${LOCAL_IP}:8080/api/v1`,
  STATIC_BASE_URL: `http://${LOCAL_IP}:8080`
};
const getConfig = () => {
  return MP_WEIXIN_CONFIG;
};
const config = getConfig();
const API_BASE_URL = config.API_BASE_URL;
const STATIC_BASE_URL = config.STATIC_BASE_URL;
exports.API_BASE_URL = API_BASE_URL;
exports.STATIC_BASE_URL = STATIC_BASE_URL;
