"use strict";
var common_vendor = require("../common/vendor.js");
var utils_storage = require("./storage.js");
const BASE_URL = "http://localhost:8080/api/v1";
const getToken = () => utils_storage.getCache("token");
const handleAuthFail = () => {
  utils_storage.removeCache("token");
  utils_storage.removeCache("user");
  common_vendor.index.showToast({ title: "\u767B\u5F55\u5DF2\u5931\u6548\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55", icon: "none" });
  setTimeout(() => {
    common_vendor.index.switchTab({ url: "/pages/profile/profile" });
  }, 400);
};
const request = (options) => {
  const {
    url,
    needAuth = false,
    showLoading = true,
    needRetry = false,
    header = {},
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
  if (showLoading) {
    common_vendor.index.showLoading({ title: "\u52A0\u8F7D\u4E2D", mask: true });
  }
  const run = () => new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: url.startsWith("http") ? url : `${BASE_URL}${url}`,
      header: headers,
      ...rest,
      success: (res) => {
        if (res.statusCode === 401 || res.statusCode === 403) {
          handleAuthFail();
          reject(res);
          return;
        }
        resolve(res);
      },
      fail: reject,
      complete: () => {
        if (showLoading) {
          common_vendor.index.hideLoading();
        }
      }
    });
  });
  if (!needRetry) {
    return run();
  }
  return run().catch((err) => {
    return run().catch(() => Promise.reject(err));
  });
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
