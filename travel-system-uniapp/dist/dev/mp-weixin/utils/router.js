"use strict";
var common_vendor = require("../common/vendor.js");
let isNavigating = false;
let isNavigatingBack = false;
let navigateTimer = null;
let lastNavigateUrl = "";
let lastNavigateTime = 0;
let lastNavigateBackTime = 0;
const NAVIGATE_DEBOUNCE_TIME = 300;
const NAVIGATE_BACK_DEBOUNCE_TIME = 300;
const NAVIGATE_TIMEOUT = 4500;
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
const isTabBarUrl = (url) => TAB_BAR_PAGES.has(normalizePath(url));
const getErrMsg = (err) => String((err == null ? void 0 : err.errMsg) || (err == null ? void 0 : err.message) || err || "");
const isTimeoutError = (err) => {
  const msg = getErrMsg(err).toLowerCase();
  return msg.includes("timeout") || msg.includes("timedout");
};
const isRouteBusyError = (err) => {
  const msg = getErrMsg(err).toLowerCase();
  return msg.includes("webview") || msg.includes("route") || msg.includes("navigate");
};
const isWebviewRouteError = (err) => {
  const msg = getErrMsg(err).toLowerCase();
  return msg.includes("webview") || msg.includes("navigateback") || msg.includes("routedone") || msg.includes("page route");
};
const getPageStackLength = () => {
  var _a;
  try {
    return ((_a = getCurrentPages()) == null ? void 0 : _a.length) || 0;
  } catch {
    return 0;
  }
};
const navigateBackFallback = (fallbackUrl) => {
  if (isTabBarUrl(fallbackUrl)) {
    return safeSwitchTab(fallbackUrl);
  }
  return safeRedirectTo(fallbackUrl);
};
const shouldSkipNavigate = (url) => {
  const now = Date.now();
  return isNavigating && lastNavigateUrl === url || now - lastNavigateTime < NAVIGATE_DEBOUNCE_TIME && lastNavigateUrl === url;
};
const lockNavigation = (url) => {
  if (navigateTimer) {
    clearTimeout(navigateTimer);
    navigateTimer = null;
  }
  isNavigating = true;
  lastNavigateUrl = url;
  lastNavigateTime = Date.now();
};
const unlockNavigation = (delay = 80) => {
  if (navigateTimer) {
    clearTimeout(navigateTimer);
    navigateTimer = null;
  }
  navigateTimer = setTimeout(() => {
    isNavigating = false;
    lastNavigateUrl = "";
    navigateTimer = null;
  }, delay);
};
const notifyRouteTimeout = () => {
  common_vendor.index.showToast({
    title: "\u9875\u9762\u5207\u6362\u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",
    icon: "none",
    duration: 1600
  });
};
const withoutCallbacks = (options) => {
  if (!options)
    return options;
  const { success, fail, complete, ...rest } = options;
  return rest;
};
const runWithNavigationTimeout = (url, options, runner, releaseDelay = 80) => {
  lockNavigation(url);
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeoutTimer = setTimeout(() => {
      var _a, _b;
      if (settled)
        return;
      settled = true;
      const err = { errMsg: "route timeout" };
      unlockNavigation(0);
      notifyRouteTimeout();
      (_a = options == null ? void 0 : options.fail) == null ? void 0 : _a.call(options, err);
      (_b = options == null ? void 0 : options.complete) == null ? void 0 : _b.call(options);
      resolve();
    }, NAVIGATE_TIMEOUT);
    const finish = (callback) => {
      if (settled)
        return;
      settled = true;
      clearTimeout(timeoutTimer);
      callback();
    };
    runner({
      success: (res) => {
        finish(() => {
          var _a, _b;
          unlockNavigation(releaseDelay);
          (_a = options == null ? void 0 : options.success) == null ? void 0 : _a.call(options, res);
          (_b = options == null ? void 0 : options.complete) == null ? void 0 : _b.call(options);
          resolve();
        });
      },
      fail: (err) => {
        finish(() => {
          var _a, _b, _c, _d;
          unlockNavigation(0);
          if (isTimeoutError(err)) {
            notifyRouteTimeout();
            (_a = options == null ? void 0 : options.fail) == null ? void 0 : _a.call(options, err);
            (_b = options == null ? void 0 : options.complete) == null ? void 0 : _b.call(options);
            resolve();
            return;
          }
          (_c = options == null ? void 0 : options.fail) == null ? void 0 : _c.call(options, err);
          (_d = options == null ? void 0 : options.complete) == null ? void 0 : _d.call(options);
          reject(err);
        });
      },
      complete: () => {
        var _a;
        if (!settled) {
          (_a = options == null ? void 0 : options.complete) == null ? void 0 : _a.call(options);
        }
      }
    });
  });
};
const safeNavigateTo = (url, options, retryCount = 0) => {
  if (isTabBarUrl(url)) {
    return safeSwitchTab(url);
  }
  if (shouldSkipNavigate(url)) {
    return Promise.resolve();
  }
  return runWithNavigationTimeout(
    url,
    options,
    (handlers) => {
      common_vendor.index.navigateTo({
        url,
        ...options,
        success: handlers.success,
        fail: (err) => {
          if (getErrMsg(err).includes("tabbar page")) {
            safeSwitchTab(url).then(handlers.success).catch(handlers.fail);
            return;
          }
          if (!isTimeoutError(err) && isRouteBusyError(err) && retryCount < 1) {
            unlockNavigation(0);
            setTimeout(() => {
              safeNavigateTo(url, withoutCallbacks(options), retryCount + 1).then(handlers.success).catch(handlers.fail);
            }, 180);
            return;
          }
          handlers.fail(err);
        },
        complete: handlers.complete
      });
    },
    120
  );
};
const safeSwitchTab = (url, options, retryCount = 0) => {
  if (shouldSkipNavigate(url)) {
    return Promise.resolve();
  }
  return runWithNavigationTimeout(
    url,
    options,
    (handlers) => {
      common_vendor.index.switchTab({
        url,
        ...options,
        success: handlers.success,
        fail: (err) => {
          if (!isTimeoutError(err) && isRouteBusyError(err) && retryCount < 1) {
            unlockNavigation(0);
            setTimeout(() => {
              safeSwitchTab(url, withoutCallbacks(options), retryCount + 1).then(handlers.success).catch(handlers.fail);
            }, 180);
            return;
          }
          handlers.fail(err);
        },
        complete: handlers.complete
      });
    },
    80
  );
};
const safeRedirectTo = (url, options, retryCount = 0) => {
  if (shouldSkipNavigate(url)) {
    return Promise.resolve();
  }
  return runWithNavigationTimeout(
    url,
    options,
    (handlers) => {
      common_vendor.index.redirectTo({
        url,
        ...options,
        success: handlers.success,
        fail: (err) => {
          if (!isTimeoutError(err) && isRouteBusyError(err) && retryCount < 1) {
            unlockNavigation(0);
            setTimeout(() => {
              safeRedirectTo(url, withoutCallbacks(options), retryCount + 1).then(handlers.success).catch(handlers.fail);
            }, 180);
            return;
          }
          handlers.fail(err);
        },
        complete: handlers.complete
      });
    },
    120
  );
};
const safeNavigateBack = (options) => {
  var _a;
  const delta = Math.max(1, (_a = options == null ? void 0 : options.delta) != null ? _a : 1);
  const fallbackUrl = (options == null ? void 0 : options.fallbackUrl) || "/pages/home/home";
  const now = Date.now();
  if (isNavigatingBack || now - lastNavigateBackTime < NAVIGATE_BACK_DEBOUNCE_TIME) {
    return Promise.resolve();
  }
  const stackLength = getPageStackLength();
  if (stackLength <= 1 || stackLength <= delta) {
    return navigateBackFallback(fallbackUrl).catch(() => void 0);
  }
  isNavigatingBack = true;
  lastNavigateBackTime = now;
  return new Promise((resolve) => {
    const { fallbackUrl: _fallback, ...navigateOptions } = options || {};
    common_vendor.index.navigateBack({
      delta,
      ...navigateOptions,
      success: (res) => {
        var _a2, _b;
        setTimeout(() => {
          isNavigatingBack = false;
        }, 120);
        (_a2 = options == null ? void 0 : options.success) == null ? void 0 : _a2.call(options, res);
        (_b = options == null ? void 0 : options.complete) == null ? void 0 : _b.call(options);
        resolve();
      },
      fail: (err) => {
        var _a2, _b;
        isNavigatingBack = false;
        if (isWebviewRouteError(err)) {
          navigateBackFallback(fallbackUrl).then(() => resolve()).catch(() => resolve());
          return;
        }
        (_a2 = options == null ? void 0 : options.fail) == null ? void 0 : _a2.call(options, err);
        (_b = options == null ? void 0 : options.complete) == null ? void 0 : _b.call(options);
        resolve();
      }
    });
  });
};
const resetNavigationState = () => {
  isNavigating = false;
  isNavigatingBack = false;
  lastNavigateUrl = "";
  lastNavigateTime = 0;
  lastNavigateBackTime = 0;
  if (navigateTimer) {
    clearTimeout(navigateTimer);
    navigateTimer = null;
  }
};
exports.resetNavigationState = resetNavigationState;
exports.safeNavigateBack = safeNavigateBack;
exports.safeNavigateTo = safeNavigateTo;
exports.safeRedirectTo = safeRedirectTo;
exports.safeSwitchTab = safeSwitchTab;
