"use strict";
var common_vendor = require("../common/vendor.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  props: {
    visible: { type: Boolean, required: true },
    message: { type: String, required: false, default: "\u8BF7\u5148\u767B\u5F55" }
  },
  setup(__props, { emit }) {
    const props = __props;
    common_vendor.watch(() => props.visible, (newVal) => {
      console.log("LoginPrompt visible changed:", newVal);
    }, { immediate: true });
    const handleConfirm = () => {
      emit("confirm");
      common_vendor.index.switchTab({ url: "/pages/profile/profile" });
    };
    const handleCancel = () => {
      emit("cancel");
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.visible
      }, __props.visible ? {
        b: common_vendor.o(handleCancel),
        c: common_vendor.t(__props.message),
        d: common_vendor.o(handleCancel),
        e: common_vendor.o(handleConfirm),
        f: common_vendor.o(() => {
        }),
        g: common_vendor.o(handleCancel)
      } : {});
    };
  }
});
var Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-d2d8bca6"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/components/LoginPrompt.vue"]]);
wx.createComponent(Component);
