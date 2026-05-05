"use strict";
var common_vendor = require("../../common/vendor.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const statusBarHeight = common_vendor.ref(0);
    const navRightPadding = common_vendor.ref(0);
    common_vendor.onMounted(() => {
      try {
        const sys = common_vendor.index.getSystemInfoSync();
        statusBarHeight.value = sys.statusBarHeight || 0;
        const menu = common_vendor.index.getMenuButtonBoundingClientRect();
        if (menu && sys.windowWidth) {
          navRightPadding.value = Math.max(0, sys.windowWidth - menu.left);
        } else {
          navRightPadding.value = 96;
        }
      } catch {
        statusBarHeight.value = 0;
        navRightPadding.value = 0;
      }
    });
    const feedbackTypes = [
      { value: "bug", label: "\u95EE\u9898\u53CD\u9988" },
      { value: "suggestion", label: "\u529F\u80FD\u5EFA\u8BAE" },
      { value: "complaint", label: "\u6295\u8BC9\u5EFA\u8BAE" },
      { value: "other", label: "\u5176\u4ED6" }
    ];
    const form = common_vendor.reactive({
      type: "bug",
      content: "",
      contact: "",
      images: []
    });
    const maxImages = 9;
    const submitting = common_vendor.ref(false);
    const canSubmit = common_vendor.computed(() => form.content.trim().length >= 10);
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    const chooseImage = () => {
      const remain = maxImages - form.images.length;
      if (remain <= 0)
        return;
      common_vendor.index.chooseImage({
        count: remain,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          form.images.push(...res.tempFilePaths);
        },
        fail: () => {
          common_vendor.index.showToast({ title: "\u9009\u62E9\u56FE\u7247\u5931\u8D25", icon: "none" });
        }
      });
    };
    const removeImage = (index) => {
      form.images.splice(index, 1);
    };
    const submitFeedback = async () => {
      if (!canSubmit.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u81F3\u5C11\u8F93\u516510\u4E2A\u5B57\u7684\u53CD\u9988\u5185\u5BB9", icon: "none" });
        return;
      }
      submitting.value = true;
      try {
        const feedbackData = {
          type: form.type,
          content: form.content,
          contact: form.contact,
          images: form.images,
          createTime: new Date().toISOString()
        };
        const feedbacks = common_vendor.index.getStorageSync("feedbacks") || [];
        feedbacks.push(feedbackData);
        common_vendor.index.setStorageSync("feedbacks", feedbacks);
        common_vendor.index.showToast({
          title: "\u53CD\u9988\u5DF2\u63D0\u4EA4\uFF0C\u611F\u8C22\u60A8\u7684\u5EFA\u8BAE\uFF01",
          icon: "success",
          duration: 2e3
        });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 2e3);
      } catch {
        common_vendor.index.showToast({ title: "\u63D0\u4EA4\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5", icon: "none" });
      } finally {
        submitting.value = false;
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(goBack),
        b: statusBarHeight.value + "px",
        c: navRightPadding.value + "px",
        d: common_vendor.f(feedbackTypes, (type, k0, i0) => {
          return {
            a: common_vendor.t(type.label),
            b: common_vendor.unref(form).type === type.value ? 1 : "",
            c: type.value,
            d: common_vendor.unref(form).type === type.value ? 1 : "",
            e: common_vendor.o(($event) => common_vendor.unref(form).type = type.value)
          };
        }),
        e: common_vendor.unref(form).content,
        f: common_vendor.o(($event) => common_vendor.unref(form).content = $event.detail.value),
        g: common_vendor.t(common_vendor.unref(form).content.length),
        h: common_vendor.unref(form).contact,
        i: common_vendor.o(($event) => common_vendor.unref(form).contact = $event.detail.value),
        j: common_vendor.f(common_vendor.unref(form).images, (image, index, i0) => {
          return {
            a: image,
            b: common_vendor.o(($event) => removeImage(index)),
            c: index
          };
        }),
        k: common_vendor.unref(form).images.length < maxImages
      }, common_vendor.unref(form).images.length < maxImages ? {
        l: common_vendor.o(chooseImage)
      } : {}, {
        m: common_vendor.t(submitting.value ? "\u63D0\u4EA4\u4E2D..." : "\u63D0\u4EA4\u53CD\u9988"),
        n: !common_vendor.unref(canSubmit) ? 1 : "",
        o: !common_vendor.unref(canSubmit) || submitting.value,
        p: submitting.value,
        q: common_vendor.o(submitFeedback)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-9c68c7a2"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/profile/feedback.vue"]]);
wx.createPage(MiniProgramPage);
