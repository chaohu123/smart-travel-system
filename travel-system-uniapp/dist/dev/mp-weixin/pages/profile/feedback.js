"use strict";
var common_vendor = require("../../common/vendor.js");
var store_user = require("../../store/user.js");
require("../../utils/storage.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const feedbackTypes = [
      { value: "bug", label: "\u95EE\u9898\u53CD\u9988", icon: "\u{1F41B}" },
      { value: "suggestion", label: "\u529F\u80FD\u5EFA\u8BAE", icon: "\u{1F4A1}" },
      { value: "complaint", label: "\u6295\u8BC9\u5EFA\u8BAE", icon: "\u{1F61E}" },
      { value: "other", label: "\u5176\u4ED6", icon: "\u{1F4DD}" }
    ];
    const form = common_vendor.reactive({
      type: "bug",
      content: "",
      contact: "",
      images: []
    });
    const submitting = common_vendor.ref(false);
    const canSubmit = common_vendor.computed(() => {
      return form.content.trim().length >= 10;
    });
    const chooseImage = () => {
      common_vendor.index.chooseImage({
        count: 3 - form.images.length,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          form.images.push(...res.tempFilePaths);
        },
        fail: (err) => {
          common_vendor.index.showToast({ title: "\u9009\u62E9\u56FE\u7247\u5931\u8D25", icon: "none" });
        }
      });
    };
    const removeImage = (index) => {
      form.images.splice(index, 1);
    };
    const submitFeedback = async () => {
      var _a;
      if (!canSubmit.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u81F3\u5C11\u8F93\u516510\u4E2A\u5B57\u7684\u53CD\u9988\u5185\u5BB9", icon: "none" });
        return;
      }
      submitting.value = true;
      try {
        const feedbackData = {
          userId: ((_a = user.value) == null ? void 0 : _a.id) || 0,
          type: form.type,
          content: form.content,
          contact: form.contact,
          images: form.images,
          createTime: new Date().toISOString()
        };
        const feedbacks = common_vendor.index.getStorageSync("feedbacks") || [];
        feedbacks.push(feedbackData);
        common_vendor.index.setStorageSync("feedbacks", feedbacks);
        common_vendor.index.showToast({ title: "\u53CD\u9988\u63D0\u4EA4\u6210\u529F\uFF0C\u611F\u8C22\u60A8\u7684\u5EFA\u8BAE\uFF01", icon: "success" });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
      } catch (error) {
        common_vendor.index.showToast({ title: "\u63D0\u4EA4\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5", icon: "none" });
      } finally {
        submitting.value = false;
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(feedbackTypes, (type, k0, i0) => {
          return {
            a: common_vendor.t(type.icon),
            b: common_vendor.t(type.label),
            c: type.value,
            d: common_vendor.unref(form).type === type.value ? 1 : "",
            e: common_vendor.o(($event) => common_vendor.unref(form).type = type.value)
          };
        }),
        b: common_vendor.unref(form).content,
        c: common_vendor.o(($event) => common_vendor.unref(form).content = $event.detail.value),
        d: common_vendor.t(common_vendor.unref(form).content.length),
        e: common_vendor.unref(form).contact,
        f: common_vendor.o(($event) => common_vendor.unref(form).contact = $event.detail.value),
        g: common_vendor.f(common_vendor.unref(form).images, (image, index, i0) => {
          return {
            a: image,
            b: common_vendor.o(($event) => removeImage(index)),
            c: index
          };
        }),
        h: common_vendor.unref(form).images.length < 3
      }, common_vendor.unref(form).images.length < 3 ? {
        i: common_vendor.o(chooseImage)
      } : {}, {
        j: common_vendor.t(submitting.value ? "\u63D0\u4EA4\u4E2D..." : "\u63D0\u4EA4\u53CD\u9988"),
        k: !common_vendor.unref(canSubmit) ? 1 : "",
        l: !common_vendor.unref(canSubmit) || submitting.value,
        m: submitting.value,
        n: common_vendor.o(submitFeedback)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-9c68c7a2"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/profile/feedback.vue"]]);
wx.createPage(MiniProgramPage);
