"use strict";
var common_vendor = require("../common/vendor.js");
var utils_storage = require("../utils/storage.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const visible = common_vendor.ref(false);
    const steps = [
      { title: "\u667A\u80FD\u89C4\u5212", desc: "\u5728\u9996\u9875\u8FDB\u5165\u201C\u667A\u80FD\u89C4\u5212\u201D\u5FEB\u901F\u751F\u6210\u884C\u7A0B" },
      { title: "\u6E38\u8BB0\u53D1\u5E03", desc: "\u5728\u6E38\u8BB0\u9875\u53D1\u5E03\u56FE\u6587\uFF0C\u5206\u4EAB\u4F53\u9A8C" },
      { title: "\u6253\u5361", desc: "\u5728\u666F\u70B9/\u7F8E\u98DF\u9875\u4E0A\u4F20\u7167\u7247\u5B8C\u6210\u6253\u5361" }
    ];
    const close = () => {
      visible.value = false;
      utils_storage.setCache("guided", true, 60 * 24 * 365);
    };
    common_vendor.onMounted(() => {
      const guided = utils_storage.getCache("guided");
      if (!guided) {
        visible.value = true;
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: visible.value
      }, visible.value ? {
        b: common_vendor.f(steps, (step, k0, i0) => {
          return {
            a: common_vendor.t(step.title),
            b: common_vendor.t(step.desc),
            c: step.title
          };
        }),
        c: common_vendor.o(close),
        d: common_vendor.o(() => {
        }),
        e: common_vendor.o(close)
      } : {});
    };
  }
});
var Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-4e0f27e4"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/components/GuideOverlay.vue"]]);
wx.createComponent(Component);
