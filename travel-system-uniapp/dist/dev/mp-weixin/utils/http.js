"use strict";
var common_vendor = require("../common/vendor.js");
var utils_storage = require("./storage.js");
var utils_config = require("./config.js");
const BASE_URL = utils_config.API_BASE_URL;
const getToken = () => utils_storage.getCache("token");
const pendingRequests = /* @__PURE__ */ new Map();
const getRequestKey = (url, method, data) => {
  const dataStr = data ? JSON.stringify(data) : "";
  return `${method}:${url}:${dataStr}`;
};
const handleAuthFail = () => {
  utils_storage.removeCache("token");
  utils_storage.removeCache("user");
  common_vendor.index.showToast({ title: "\u767B\u5F55\u5DF2\u5931\u6548\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55", icon: "none" });
  setTimeout(() => {
    common_vendor.index.switchTab({ url: "/pages/profile/profile" });
  }, 400);
};
const cleanParams = (params) => {
  if (!params || typeof params !== "object") {
    return params;
  }
  if (Array.isArray(params)) {
    return params.map(cleanParams).filter((item) => item !== void 0 && item !== null);
  }
  const cleaned = {};
  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const value = params[key];
      if (value !== void 0 && value !== null && value !== "undefined" && value !== "null") {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
};
const request = (options) => {
  const {
    url,
    needAuth = false,
    showLoading = true,
    needRetry = false,
    enableCache = false,
    cacheTime = 5 * 60,
    header = {},
    data,
    method = "GET",
    ...rest
  } = options;
  const token = getToken();
  const headers = { ...header };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (needAuth && !token) {
    handleAuthFail();
    return Promise.reject(new Error("no-token"));
  }
  const cleanedData = data ? cleanParams(data) : void 0;
  const requestKey = getRequestKey(url, method, cleanedData);
  const cacheKey = `api_cache_${requestKey}`;
  if (enableCache && method === "GET") {
    const cached = utils_storage.getCache(cacheKey);
    if (cached) {
      return Promise.resolve({
        statusCode: 200,
        data: cached
      });
    }
  }
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey);
  }
  if (showLoading) {
    common_vendor.index.showLoading({ title: "\u52A0\u8F7D\u4E2D", mask: true });
  }
  const run = () => new Promise((resolve, reject) => {
    const timeout = rest.timeout || 6e4;
    const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
    common_vendor.index.request({
      url: fullUrl,
      method,
      header: headers,
      data: cleanedData,
      timeout,
      ...rest,
      success: (res) => {
        if (res.statusCode === 401 || res.statusCode === 403) {
          handleAuthFail();
          reject(res);
          return;
        }
        if (enableCache && method === "GET" && res.statusCode === 200 && res.data) {
          utils_storage.setCache(cacheKey, res.data, cacheTime);
        }
        resolve(res);
      },
      fail: (err) => {
        reject(err);
      },
      complete: () => {
        if (showLoading) {
          common_vendor.index.hideLoading();
        }
        pendingRequests.delete(requestKey);
      }
    });
  });
  const requestPromise = needRetry ? run().catch((err) => {
    return run().catch(() => Promise.reject(err));
  }) : run();
  pendingRequests.set(requestKey, requestPromise);
  return requestPromise;
};
const uploadFile = (url, filePath) => {
  const token = getToken();
  return common_vendor.index.uploadFile({
    url: url.startsWith("http") ? url : `${BASE_URL}${url}`,
    filePath,
    name: "file",
    header: token ? { Authorization: `Bearer ${token}` } : {}
  });
};
exports.request = request;
exports.uploadFile = uploadFile;
