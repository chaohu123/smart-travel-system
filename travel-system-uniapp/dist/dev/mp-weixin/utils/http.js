"use strict";
var common_vendor = require("../common/vendor.js");
var utils_storage = require("./storage.js");
var utils_config = require("./config.js");
var utils_image = require("./image.js");
const BASE_URL = utils_config.API_BASE_URL;
const DEFAULT_TIMEOUT = 15e3;
const DEFAULT_CACHE_TIME = 3 * 60;
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
const normalizeUploadUrlInData = (value) => {
  if (value === null || value === void 0)
    return value;
  if (typeof value === "string") {
    const raw = value.trim();
    if (raw.startsWith("/uploads/") || raw.startsWith("uploads/")) {
      return utils_image.getImageUrl(raw, false);
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeUploadUrlInData(item));
  }
  if (typeof value === "object") {
    const out = {};
    Object.keys(value).forEach((key) => {
      out[key] = normalizeUploadUrlInData(value[key]);
    });
    return out;
  }
  return value;
};
const isSuccessfulApiData = (data) => {
  if (!data || typeof data !== "object") {
    return true;
  }
  return data.code === void 0 || data.code === 200;
};
const request = (options) => {
  const {
    url,
    needAuth = false,
    showLoading = true,
    needRetry = false,
    enableCache = false,
    disableCache = false,
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
  const canCache = method === "GET" && !disableCache && (enableCache || !showLoading);
  if (canCache) {
    const cached = utils_storage.getCache(cacheKey);
    if (cached && isSuccessfulApiData(cached)) {
      return Promise.resolve({
        statusCode: 200,
        data: cached
      });
    } else if (cached) {
      utils_storage.removeCache(cacheKey);
    }
  }
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey);
  }
  if (showLoading) {
    common_vendor.index.showLoading({ title: "\u52A0\u8F7D\u4E2D", mask: true });
  }
  const run = () => new Promise((resolve, reject) => {
    const timeout = rest.timeout || DEFAULT_TIMEOUT;
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
        if (res && res.data) {
          res.data = normalizeUploadUrlInData(res.data);
        }
        if (canCache && res.statusCode === 200 && res.data && isSuccessfulApiData(res.data)) {
          utils_storage.setCache(cacheKey, res.data, enableCache ? cacheTime : DEFAULT_CACHE_TIME);
        }
        resolve(res);
      },
      fail: (err) => {
        const errMsg = String((err == null ? void 0 : err.errMsg) || "");
        if (errMsg.includes("timeout")) {
          resolve({
            statusCode: 408,
            data: {
              code: 408,
              msg: "\u8BF7\u6C42\u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5"
            }
          });
          return;
        }
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
    const errMsg = String((err == null ? void 0 : err.errMsg) || "");
    if (errMsg.includes("timeout")) {
      return Promise.resolve({
        statusCode: 408,
        data: { code: 408, msg: "\u8BF7\u6C42\u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" }
      });
    }
    return run().catch(() => Promise.reject(err));
  }) : run();
  pendingRequests.set(requestKey, requestPromise);
  return requestPromise;
};
const uploadFile = (url, filePath, timeout = 6e4) => {
  const token = getToken();
  const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
  return new Promise((resolve, reject) => {
    common_vendor.index.uploadFile({
      url: fullUrl,
      filePath,
      name: "file",
      header: token ? { Authorization: `Bearer ${token}` } : {},
      timeout,
      success: (res) => {
        let normalizedData = res.data;
        try {
          if (typeof res.data === "string") {
            normalizedData = JSON.parse(res.data);
          }
        } catch (e) {
          normalizedData = res.data;
        }
        resolve({
          ...res,
          data: normalizeUploadUrlInData(normalizedData)
        });
      },
      fail: (err) => {
        const errMsg = String((err == null ? void 0 : err.errMsg) || "");
        if (errMsg.includes("timeout")) {
          resolve({
            statusCode: 408,
            data: { code: 408, msg: "\u4E0A\u4F20\u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" }
          });
          return;
        }
        reject(err);
      }
    });
  });
};
exports.request = request;
exports.uploadFile = uploadFile;
