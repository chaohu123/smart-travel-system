"use strict";
var common_vendor = require("../common/vendor.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  props: {
    text: { type: String, required: false },
    icon: { type: String, required: false },
    btnText: { type: String, required: false }
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.icon
      }, __props.icon ? {
        b: __props.icon
      } : {}, {
        c: common_vendor.t(__props.text),
        d: __props.btnText
      }, __props.btnText ? {
        e: common_vendor.t(__props.btnText),
        f: common_vendor.o(($event) => _ctx.$emit("retry"))
      } : {});
    };
  }
});
var Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b2b92118"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/components/EmptyState.vue"]]);
wx.createComponent(Component);
