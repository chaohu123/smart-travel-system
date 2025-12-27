"use strict";
var common_vendor = require("../common/vendor.js");
const now = () => Date.now();
const setCache = (key, value, minutes = 0) => {
  const payload = {
    value,
    expire: minutes > 0 ? now() + minutes * 60 * 1e3 : 0
  };
  common_vendor.index.setStorageSync(key, payload);
};
const getCache = (key) => {
  try {
    const payload = common_vendor.index.getStorageSync(key);
    if (!payload)
      return null;
    if (payload.expire && payload.expire > 0 && payload.expire < now()) {
      removeCache(key);
      return null;
    }
    return payload.value;
  } catch (e) {
    return null;
  }
};
const removeCache = (key) => {
  try {
    common_vendor.index.removeStorageSync(key);
  } catch (e) {
  }
};
exports.getCache = getCache;
exports.removeCache = removeCache;
exports.setCache = setCache;
