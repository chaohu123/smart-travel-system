"use strict";
var common_vendor = require("../common/vendor.js");
let isNavigating = false;
let navigateTimer = null;
const safeNavigateTo = (url, options) => {
  if (isNavigating) {
    console.warn("\u6B63\u5728\u8DF3\u8F6C\u4E2D\uFF0C\u5FFD\u7565\u91CD\u590D\u8DF3\u8F6C\u8BF7\u6C42:", url);
    return;
  }
  if (navigateTimer) {
    clearTimeout(navigateTimer);
  }
  isNavigating = true;
  return new Promise((resolve, reject) => {
    common_vendor.index.navigateTo({
      url,
      ...options,
      success: (res) => {
        var _a;
        navigateTimer = setTimeout(() => {
          isNavigating = false;
          navigateTimer = null;
        }, 300);
        (_a = options == null ? void 0 : options.success) == null ? void 0 : _a.call(options, res);
        resolve();
      },
      fail: (err) => {
        var _a, _b, _c;
        isNavigating = false;
        console.error("\u9875\u9762\u8DF3\u8F6C\u5931\u8D25:", err);
        if (((_a = err.errMsg) == null ? void 0 : _a.includes("webview")) || ((_b = err.errMsg) == null ? void 0 : _b.includes("route"))) {
          console.warn("\u68C0\u6D4B\u5230\u8DEF\u7531\u9519\u8BEF\uFF0C\u5EF6\u8FDF\u91CD\u8BD5...");
          setTimeout(() => {
            safeNavigateTo(url, options).then(resolve).catch(reject);
          }, 500);
        } else {
          (_c = options == null ? void 0 : options.fail) == null ? void 0 : _c.call(options, err);
          reject(err);
        }
      },
      complete: () => {
        var _a;
        (_a = options == null ? void 0 : options.complete) == null ? void 0 : _a.call(options);
      }
    });
  });
};
const safeSwitchTab = (url, options) => {
  if (isNavigating) {
    console.warn("\u6B63\u5728\u8DF3\u8F6C\u4E2D\uFF0C\u5FFD\u7565\u91CD\u590D\u8DF3\u8F6C\u8BF7\u6C42:", url);
    return;
  }
  if (navigateTimer) {
    clearTimeout(navigateTimer);
  }
  isNavigating = true;
  return new Promise((resolve, reject) => {
    common_vendor.index.switchTab({
      url,
      ...options,
      success: (res) => {
        var _a;
        navigateTimer = setTimeout(() => {
          isNavigating = false;
          navigateTimer = null;
        }, 300);
        (_a = options == null ? void 0 : options.success) == null ? void 0 : _a.call(options, res);
        resolve();
      },
      fail: (err) => {
        var _a, _b, _c;
        isNavigating = false;
        console.error("Tab \u5207\u6362\u5931\u8D25:", err);
        if (((_a = err.errMsg) == null ? void 0 : _a.includes("webview")) || ((_b = err.errMsg) == null ? void 0 : _b.includes("route"))) {
          console.warn("\u68C0\u6D4B\u5230\u8DEF\u7531\u9519\u8BEF\uFF0C\u5EF6\u8FDF\u91CD\u8BD5...");
          setTimeout(() => {
            safeSwitchTab(url, options).then(resolve).catch(reject);
          }, 500);
        } else {
          (_c = options == null ? void 0 : options.fail) == null ? void 0 : _c.call(options, err);
          reject(err);
        }
      },
      complete: () => {
        var _a;
        (_a = options == null ? void 0 : options.complete) == null ? void 0 : _a.call(options);
      }
    });
  });
};
const resetNavigationState = () => {
  isNavigating = false;
  if (navigateTimer) {
    clearTimeout(navigateTimer);
    navigateTimer = null;
  }
};
exports.resetNavigationState = resetNavigationState;
exports.safeNavigateTo = safeNavigateTo;
exports.safeSwitchTab = safeSwitchTab;
