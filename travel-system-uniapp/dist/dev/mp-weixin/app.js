"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
var common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/home/home.js";
  "./pages/route/plan.js";
  "./pages/itinerary/itinerary-detail.js";
  "./pages/route/hot-routes.js";
  "./pages/recommend/interest.js";
  "./pages/checkin/checkin.js";
  "./pages/travel-note/list.js";
  "./pages/travel-note/detail.js";
  "./pages/travel-note/publish.js";
  "./pages/profile/profile.js";
  "./pages/profile/my-interaction.js";
  "./pages/profile/my-article.js";
  "./pages/profile/feedback.js";
  "./pages/profile/about.js";
  "./pages/profile/preference.js";
  "./pages/profile/history.js";
  "./pages/profile/user-home.js";
  "./pages/profile/messages.js";
  "./pages/profile/chat.js";
  "./pages/profile/followers.js";
  "./pages/profile/following.js";
  "./pages/profile/edit-profile.js";
  "./pages/footprint/footprint.js";
  "./pages/scenic/detail.js";
  "./pages/food/detail.js";
  "./pages/activity/detail.js";
  "./pages/city/select.js";
}
const isTimeoutError = (msg) => {
  const text = String(msg || "").toLowerCase();
  return text.includes("timeout") || text.includes("timedout");
};
const _sfc_main = {
  onUnhandledRejection(e) {
    var _a, _b;
    const message = ((_a = e == null ? void 0 : e.reason) == null ? void 0 : _a.errMsg) || ((_b = e == null ? void 0 : e.reason) == null ? void 0 : _b.message) || (e == null ? void 0 : e.reason) || "";
    if (isTimeoutError(message)) {
      return;
    }
    console.error("UnhandledRejection:", e);
  },
  onError(err) {
    if (isTimeoutError(err)) {
      return;
    }
    console.error("GlobalError:", err);
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {};
}
var App = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/App.vue"]]);
const isTimeoutMessage = (msg) => {
  const text = String(msg || "").toLowerCase();
  return text.includes("timeout") || text.includes("timedout");
};
const setupGlobalTimeoutGuards = () => {
  const wxAny = globalThis.wx;
  if (wxAny == null ? void 0 : wxAny.onUnhandledRejection) {
    wxAny.onUnhandledRejection((res) => {
      var _a, _b;
      const message = ((_a = res == null ? void 0 : res.reason) == null ? void 0 : _a.errMsg) || ((_b = res == null ? void 0 : res.reason) == null ? void 0 : _b.message) || (res == null ? void 0 : res.reason) || "";
      if (isTimeoutMessage(message)) {
        return;
      }
      console.error("UnhandledRejection:", res);
    });
  }
  if (wxAny == null ? void 0 : wxAny.onError) {
    wxAny.onError((err) => {
      if (isTimeoutMessage(err)) {
        return;
      }
      console.error("GlobalError:", err);
    });
  }
};
setupGlobalTimeoutGuards();
function createApp() {
  const app = common_vendor.createSSRApp(App);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
