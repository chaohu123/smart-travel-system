"use strict";
var common_vendor = require("../common/vendor.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  props: {
    count: { type: Number, required: false }
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(__props.count, (n, k0, i0) => {
          return {
            a: n
          };
        })
      };
    };
  }
});
var Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-687db016"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/components/SkeletonCards.vue"]]);
wx.createComponent(Component);
