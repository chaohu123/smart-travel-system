"use strict";
var common_vendor = require("../common/vendor.js");
let isNavigating = false;
let navigateTimer = null;
let lastNavigateUrl = "";
let lastNavigateTime = 0;
const NAVIGATE_DEBOUNCE_TIME = 300;
const TAB_BAR_PAGES = /* @__PURE__ */ new Set([
  "/pages/home/home",
  "/pages/route/plan",
  "/pages/checkin/checkin",
  "/pages/travel-note/list",
  "/pages/profile/profile"
]);
const normalizePath = (url) => {
  if (!url)
    return "";
  const purePath = url.split("?")[0];
  return purePath.startsWith("/") ? purePath : `/${purePath}`;
};
const isTabBarUrl = (url) => {
  return TAB_BAR_PAGES.has(normalizePath(url));
};
const safeNavigateTo = (url, options) => {
  if (isTabBarUrl(url)) {
    return safeSwitchTab(url);
  }
  const now = Date.now();
  if (isNavigating && lastNavigateUrl === url) {
    return Promise.resolve();
  }
  if (now - lastNavigateTime < NAVIGATE_DEBOUNCE_TIME && lastNavigateUrl === url) {
    return Promise.resolve();
  }
  if (navigateTimer) {
    clearTimeout(navigateTimer);
    navigateTimer = null;
  }
  isNavigating = true;
  lastNavigateUrl = url;
  lastNavigateTime = now;
  return new Promise((resolve, reject) => {
    common_vendor.index.navigateTo({
      url,
      ...options,
      success: (res) => {
        var _a;
        navigateTimer = setTimeout(() => {
          isNavigating = false;
          navigateTimer = null;
          lastNavigateUrl = "";
        }, 300);
        (_a = options == null ? void 0 : options.success) == null ? void 0 : _a.call(options, res);
        resolve();
      },
      fail: (err) => {
        var _a, _b, _c, _d, _e, _f;
        isNavigating = false;
        lastNavigateUrl = "";
        if (navigateTimer) {
          clearTimeout(navigateTimer);
          navigateTimer = null;
        }
        if ((_a = err.errMsg) == null ? void 0 : _a.includes("tabbar page")) {
          safeSwitchTab(url).then(resolve).catch(() => resolve());
          return;
        }
        if (((_b = err.errMsg) == null ? void 0 : _b.includes("timeout")) || ((_c = err.errMsg) == null ? void 0 : _c.includes("timedout"))) {
          common_vendor.index.showToast({
            title: "\u9875\u9762\u5207\u6362\u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",
            icon: "none",
            duration: 1800
          });
          (_d = options == null ? void 0 : options.fail) == null ? void 0 : _d.call(options, err);
          resolve();
          return;
        }
        if (((_e = err.errMsg) == null ? void 0 : _e.includes("webview")) || ((_f = err.errMsg) == null ? void 0 : _f.includes("route"))) {
          setTimeout(() => {
            safeNavigateTo(url, options).then(resolve).catch(reject);
          }, 500);
        } else {
          setTimeout(() => {
            isNavigating = false;
            lastNavigateUrl = "";
            safeNavigateTo(url, options).then(resolve).catch(reject);
          }, 300);
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
  const now = Date.now();
  if (isNavigating && lastNavigateUrl === url) {
    return Promise.resolve();
  }
  if (now - lastNavigateTime < NAVIGATE_DEBOUNCE_TIME && lastNavigateUrl === url) {
    return Promise.resolve();
  }
  if (navigateTimer) {
    clearTimeout(navigateTimer);
  }
  isNavigating = true;
  lastNavigateUrl = url;
  lastNavigateTime = now;
  return new Promise((resolve, reject) => {
    common_vendor.index.switchTab({
      url,
      ...options,
      success: (res) => {
        var _a;
        navigateTimer = setTimeout(() => {
          isNavigating = false;
          navigateTimer = null;
          lastNavigateUrl = "";
        }, 200);
        (_a = options == null ? void 0 : options.success) == null ? void 0 : _a.call(options, res);
        resolve();
      },
      fail: (err) => {
        var _a, _b, _c, _d, _e, _f;
        isNavigating = false;
        lastNavigateUrl = "";
        if (((_a = err.errMsg) == null ? void 0 : _a.includes("timeout")) || ((_b = err.errMsg) == null ? void 0 : _b.includes("timedout"))) {
          common_vendor.index.showToast({
            title: "\u9875\u9762\u5207\u6362\u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",
            icon: "none",
            duration: 1800
          });
          (_c = options == null ? void 0 : options.fail) == null ? void 0 : _c.call(options, err);
          resolve();
          return;
        }
        if (((_d = err.errMsg) == null ? void 0 : _d.includes("webview")) || ((_e = err.errMsg) == null ? void 0 : _e.includes("route"))) {
          setTimeout(() => {
            safeSwitchTab(url, options).then(resolve).catch(reject);
          }, 500);
        } else {
          (_f = options == null ? void 0 : options.fail) == null ? void 0 : _f.call(options, err);
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
  lastNavigateUrl = "";
  lastNavigateTime = 0;
  if (navigateTimer) {
    clearTimeout(navigateTimer);
    navigateTimer = null;
  }
};
exports.resetNavigationState = resetNavigationState;
exports.safeNavigateTo = safeNavigateTo;
exports.safeSwitchTab = safeSwitchTab;
