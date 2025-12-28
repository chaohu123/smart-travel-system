"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var utils_storage = require("../../utils/storage.js");
var store_user = require("../../store/user.js");
require("../../utils/http.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const foodId = common_vendor.ref(null);
    const loading = common_vendor.ref(false);
    const detail = common_vendor.ref(null);
    const nearbyScenics = common_vendor.ref([]);
    const isFavorite = common_vendor.ref(false);
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const FAVORITE_KEY = "food_favorites";
    const loadFavoriteStatus = () => {
      if (!foodId.value)
        return;
      const favorites = utils_storage.getCache(FAVORITE_KEY) || [];
      isFavorite.value = favorites.includes(foodId.value);
    };
    const loadDetail = async () => {
      if (!foodId.value)
        return;
      loading.value = true;
      try {
        const res = await api_content.foodApi.getDetail(foodId.value);
        if (res.statusCode === 200 && res.data.code === 200) {
          const data = res.data.data;
          if (data && data.food) {
            detail.value = data.food;
          } else {
            detail.value = data;
          }
          console.log("\u7F8E\u98DF\u8BE6\u60C5\u6570\u636E:", detail.value);
          loadFavoriteStatus();
          loadNearbyScenics();
        } else {
          common_vendor.index.showToast({ title: res.data.msg || "\u52A0\u8F7D\u5931\u8D25", icon: "none" });
        }
      } catch (e) {
        console.error("\u52A0\u8F7D\u7F8E\u98DF\u8BE6\u60C5\u5931\u8D25:", e);
        common_vendor.index.showToast({ title: "\u7F51\u7EDC\u9519\u8BEF", icon: "none" });
      } finally {
        loading.value = false;
      }
    };
    const loadNearbyScenics = async () => {
      if (!detail.value)
        return;
      try {
        const cityId = detail.value.cityId;
        if (!cityId)
          return;
        const res = await api_content.scenicSpotApi.getHot(cityId, 3);
        if (res.statusCode === 200 && res.data.code === 200) {
          nearbyScenics.value = res.data.data || [];
        }
      } catch (e) {
        console.error("\u52A0\u8F7D\u9644\u8FD1\u666F\u70B9\u5931\u8D25:", e);
      }
    };
    const onViewScenic = (scenicId) => {
      common_vendor.index.navigateTo({
        url: `/pages/scenic/detail?id=${scenicId}`
      });
    };
    const toggleFavorite = () => {
      if (!user.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        setTimeout(() => {
          common_vendor.index.switchTab({ url: "/pages/profile/profile" });
        }, 1500);
        return;
      }
      if (!foodId.value)
        return;
      const favorites = utils_storage.getCache(FAVORITE_KEY) || [];
      const index = favorites.indexOf(foodId.value);
      if (index > -1) {
        favorites.splice(index, 1);
        isFavorite.value = false;
        common_vendor.index.showToast({ title: "\u5DF2\u53D6\u6D88\u6536\u85CF", icon: "success" });
      } else {
        favorites.push(foodId.value);
        isFavorite.value = true;
        common_vendor.index.showToast({ title: "\u6536\u85CF\u6210\u529F", icon: "success" });
      }
      utils_storage.setCache(FAVORITE_KEY, favorites, 365 * 24 * 60);
    };
    const goCheckin = () => {
      if (!foodId.value)
        return;
      common_vendor.index.switchTab({ url: "/pages/checkin/checkin" });
    };
    const addToRoute = () => {
      if (!foodId.value || !detail.value)
        return;
      common_vendor.index.navigateTo({
        url: `/pages/route/plan?foodId=${foodId.value}&foodName=${encodeURIComponent(detail.value.name || "")}`
      });
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
      var _a, _b;
      return common_vendor.e({
        a: (_a = detail.value) == null ? void 0 : _a.imageUrl
      }, ((_b = detail.value) == null ? void 0 : _b.imageUrl) ? {
        b: detail.value.imageUrl
      } : {}, {
        c: loading.value
      }, loading.value ? {} : detail.value ? common_vendor.e({
        e: common_vendor.t(detail.value.name),
        f: detail.value.foodType
      }, detail.value.foodType ? {
        g: common_vendor.t(detail.value.foodType)
      } : {}, {
        h: common_vendor.t(detail.value.cityName || "\u672A\u77E5\u57CE\u5E02"),
        i: common_vendor.t(detail.value.score ? typeof detail.value.score === "number" ? detail.value.score.toFixed(1) : Number(detail.value.score).toFixed(1) : "--"),
        j: common_vendor.t(detail.value.hotScore || 0),
        k: common_vendor.t(detail.value.avgPrice ? `\xA5${detail.value.avgPrice}` : "--"),
        l: detail.value.address
      }, detail.value.address ? {
        m: common_vendor.t(detail.value.address)
      } : {}, {
        n: detail.value.foodType
      }, detail.value.foodType ? {
        o: common_vendor.t(detail.value.foodType)
      } : {}, {
        p: detail.value.intro
      }, detail.value.intro ? {
        q: common_vendor.t(detail.value.intro)
      } : {}, {
        r: nearbyScenics.value.length > 0
      }, nearbyScenics.value.length > 0 ? {
        s: common_vendor.f(nearbyScenics.value, (scenic, k0, i0) => {
          return common_vendor.e({
            a: scenic.imageUrl
          }, scenic.imageUrl ? {
            b: scenic.imageUrl
          } : {}, {
            c: common_vendor.t(scenic.name),
            d: scenic.score
          }, scenic.score ? {
            e: common_vendor.t(scenic.score)
          } : {}, {
            f: scenic.id,
            g: common_vendor.o(($event) => onViewScenic(scenic.id))
          });
        })
      } : {}) : {}, {
        d: detail.value,
        t: isFavorite.value ? 1 : "",
        v: common_vendor.o(toggleFavorite),
        w: common_vendor.o(goCheckin),
        x: common_vendor.o(addToRoute)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-68d96164"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/food/detail.vue"]]);
wx.createPage(MiniProgramPage);
