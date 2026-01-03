"use strict";
var common_vendor = require("../../common/vendor.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const copyText = (text) => {
      common_vendor.index.setClipboardData({
        data: text,
        success: () => {
          common_vendor.index.showToast({ title: "\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F", icon: "success" });
        }
      });
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(($event) => copyText("support@smarttravel.com")),
        b: common_vendor.o(($event) => copyText("400-888-8888"))
      };
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-72f81853"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/profile/about.vue"]]);
wx.createPage(MiniProgramPage);
