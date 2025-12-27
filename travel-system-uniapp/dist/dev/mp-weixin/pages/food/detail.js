"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
require("../../utils/http.js");
require("../../utils/storage.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const foodId = common_vendor.ref(null);
    const loading = common_vendor.ref(false);
    const detail = common_vendor.ref(null);
    const loadDetail = async () => {
      if (!foodId.value)
        return;
      loading.value = true;
      try {
        const res = await api_content.foodApi.getDetail(foodId.value);
        if (res.statusCode === 200 && res.data.code === 200) {
          detail.value = res.data.data;
        } else {
          common_vendor.index.showToast({ title: res.data.msg || "\u52A0\u8F7D\u5931\u8D25", icon: "none" });
        }
      } catch (e) {
        common_vendor.index.showToast({ title: "\u7F51\u7EDC\u9519\u8BEF", icon: "none" });
      } finally {
        loading.value = false;
      }
    };
    const goCheckin = () => {
      if (!foodId.value)
        return;
      common_vendor.index.switchTab({ url: "/pages/checkin/checkin" });
    };
    common_vendor.onMounted(() => {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options || {};
      if (options.id) {
        foodId.value = Number(options.id);
        loadDetail();
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: loading.value
      }, loading.value ? {} : detail.value ? common_vendor.e({
        c: common_vendor.t(detail.value.name),
        d: common_vendor.t(detail.value.cityName || ""),
        e: common_vendor.t(detail.value.score || "--"),
        f: common_vendor.t(detail.value.hotScore || 0),
        g: detail.value.avgPrice
      }, detail.value.avgPrice ? {
        h: common_vendor.t(detail.value.avgPrice)
      } : {}, {
        i: common_vendor.t(detail.value.address || "\u6682\u65E0\u5730\u5740\u4FE1\u606F"),
        j: detail.value.foodType
      }, detail.value.foodType ? {
        k: common_vendor.t(detail.value.foodType)
      } : {}, {
        l: common_vendor.t(detail.value.intro || "\u6682\u65E0\u7B80\u4ECB")
      }) : {}, {
        b: detail.value,
        m: common_vendor.o(goCheckin)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-68d96164"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/food/detail.vue"]]);
wx.createPage(MiniProgramPage);
