"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var utils_storage = require("../../utils/storage.js");
var store_user = require("../../store/user.js");
require("../../utils/http.js");
require("../../utils/config.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const scenicId = common_vendor.ref(null);
    const loading = common_vendor.ref(false);
    const detail = common_vendor.ref(null);
    const isFavorite = common_vendor.ref(false);
    const isInPendingList = common_vendor.ref(false);
    const nearbyFoods = common_vendor.ref([]);
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const FAVORITE_KEY = "scenic_favorites";
    const loadFavoriteStatus = () => {
      if (!scenicId.value)
        return;
      const favorites = utils_storage.getCache(FAVORITE_KEY) || [];
      isFavorite.value = favorites.includes(scenicId.value);
    };
    const checkPendingStatus = () => {
      if (!scenicId.value)
        return;
      const pendingAdditions = utils_storage.getCache("route_pending_additions") || [];
      isInPendingList.value = pendingAdditions.some((item) => item.type === "scenic" && item.id === scenicId.value);
    };
    const toggleFavorite = () => {
      if (!user.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        setTimeout(() => {
          common_vendor.index.switchTab({ url: "/pages/profile/profile" });
        }, 1500);
        return;
      }
      if (!scenicId.value)
        return;
      const favorites = utils_storage.getCache(FAVORITE_KEY) || [];
      const index = favorites.indexOf(scenicId.value);
      if (index > -1) {
        favorites.splice(index, 1);
        isFavorite.value = false;
        common_vendor.index.showToast({ title: "\u5DF2\u53D6\u6D88\u6536\u85CF", icon: "success" });
      } else {
        favorites.push(scenicId.value);
        isFavorite.value = true;
        common_vendor.index.showToast({ title: "\u6536\u85CF\u6210\u529F", icon: "success" });
      }
      utils_storage.setCache(FAVORITE_KEY, favorites, 365 * 24 * 60);
    };
    const loadDetail = async () => {
      if (!scenicId.value)
        return;
      loading.value = true;
      try {
        const res = await api_content.scenicSpotApi.getDetail(scenicId.value);
        if (res.statusCode === 200 && res.data.code === 200) {
          const data = res.data.data;
          if (data && data.spot) {
            detail.value = {
              ...data.spot,
              tags: data.tags || []
            };
          } else {
            detail.value = data;
          }
          loadFavoriteStatus();
          checkPendingStatus();
          loadNearbyFoods();
        } else {
          common_vendor.index.showToast({ title: res.data.msg || "\u52A0\u8F7D\u5931\u8D25", icon: "none" });
        }
      } catch (e) {
        common_vendor.index.showToast({ title: "\u7F51\u7EDC\u9519\u8BEF", icon: "none" });
      } finally {
        loading.value = false;
      }
    };
    const loadNearbyFoods = async () => {
      if (!detail.value)
        return;
      try {
        const cityId = detail.value.cityId;
        if (!cityId)
          return;
        const res = await api_content.foodApi.getHot(cityId, 3);
        if (res.statusCode === 200 && res.data.code === 200) {
          nearbyFoods.value = res.data.data || [];
        }
      } catch (e) {
        console.error("\u52A0\u8F7D\u9644\u8FD1\u7F8E\u98DF\u5931\u8D25:", e);
      }
    };
    const onViewFood = (foodId) => {
      common_vendor.index.navigateTo({
        url: `/pages/food/detail?id=${foodId}`
      });
    };
    const goCheckin = () => {
      if (!scenicId.value)
        return;
      common_vendor.index.switchTab({ url: "/pages/checkin/checkin" });
    };
    const addToRoute = () => {
      if (!scenicId.value || !detail.value)
        return;
      const pendingAdditions = utils_storage.getCache("route_pending_additions") || [];
      const exists = pendingAdditions.some((item) => item.type === "scenic" && item.id === scenicId.value);
      if (!exists) {
        pendingAdditions.push({
          type: "scenic",
          id: scenicId.value,
          name: detail.value.name || "\u666F\u70B9"
        });
        utils_storage.setCache("route_pending_additions", pendingAdditions, 60 * 24);
        isInPendingList.value = true;
        common_vendor.index.showToast({
          title: "\u5DF2\u6DFB\u52A0\u5230\u5F85\u9009\u5217\u8868",
          icon: "success",
          duration: 2e3
        });
      } else {
        const filtered = pendingAdditions.filter((item) => !(item.type === "scenic" && item.id === scenicId.value));
        if (filtered.length > 0) {
          utils_storage.setCache("route_pending_additions", filtered, 60 * 24);
        } else {
          utils_storage.removeCache("route_pending_additions");
        }
        isInPendingList.value = false;
        common_vendor.index.showToast({
          title: "\u5DF2\u4ECE\u5F85\u9009\u5217\u8868\u79FB\u9664",
          icon: "success",
          duration: 2e3
        });
      }
    };
    common_vendor.onMounted(() => {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options || {};
      if (options.id) {
        scenicId.value = Number(options.id);
        loadDetail();
      }
    });
    common_vendor.onShow(() => {
      checkPendingStatus();
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
        f: detail.value.isWorldHeritage
      }, detail.value.isWorldHeritage ? {} : {}, {
        g: common_vendor.t(detail.value.province || ""),
        h: common_vendor.t(detail.value.province && detail.value.city ? "/" : ""),
        i: common_vendor.t(detail.value.city || ""),
        j: common_vendor.t(detail.value.score ? typeof detail.value.score === "number" ? detail.value.score.toFixed(1) : Number(detail.value.score).toFixed(1) : "--"),
        k: common_vendor.t(detail.value.hotScore || 0),
        l: common_vendor.t(detail.value.price && Number(detail.value.price) > 0 ? `\xA5${Number(detail.value.price)}` : "\u514D\u8D39"),
        m: !detail.value.price || Number(detail.value.price) === 0 ? 1 : "",
        n: detail.value.address
      }, detail.value.address ? {
        o: common_vendor.t(detail.value.address)
      } : {}, {
        p: detail.value.openTime
      }, detail.value.openTime ? {
        q: common_vendor.t(detail.value.openTime)
      } : {}, {
        r: detail.value.suggestedVisitTime
      }, detail.value.suggestedVisitTime ? {
        s: common_vendor.t(detail.value.suggestedVisitTime)
      } : {}, {
        t: detail.value.ticketInfo
      }, detail.value.ticketInfo ? {
        v: common_vendor.t(detail.value.ticketInfo)
      } : {}, {
        w: (!detail.value.price || Number(detail.value.price) === 0) && detail.value.freeNotice
      }, (!detail.value.price || Number(detail.value.price) === 0) && detail.value.freeNotice ? {
        x: common_vendor.t(detail.value.freeNotice)
      } : {}, {
        y: detail.value.intro
      }, detail.value.intro ? {
        z: common_vendor.t(detail.value.intro)
      } : {}, {
        A: detail.value.tags && detail.value.tags.length > 0
      }, detail.value.tags && detail.value.tags.length > 0 ? {
        B: common_vendor.f(detail.value.tags, (tag, k0, i0) => {
          return {
            a: common_vendor.t(tag),
            b: tag
          };
        })
      } : {}, {
        C: nearbyFoods.value.length > 0
      }, nearbyFoods.value.length > 0 ? {
        D: common_vendor.f(nearbyFoods.value, (food, k0, i0) => {
          return common_vendor.e({
            a: food.imageUrl
          }, food.imageUrl ? {
            b: food.imageUrl
          } : {}, {
            c: common_vendor.t(food.name),
            d: food.score
          }, food.score ? {
            e: common_vendor.t(food.score)
          } : {}, {
            f: food.id,
            g: common_vendor.o(($event) => onViewFood(food.id))
          });
        })
      } : {}) : {}, {
        d: detail.value,
        E: isFavorite.value ? 1 : "",
        F: common_vendor.o(toggleFavorite),
        G: common_vendor.o(goCheckin),
        H: common_vendor.t(isInPendingList.value ? "\u2713" : "+"),
        I: common_vendor.t(isInPendingList.value ? "\u5DF2\u6DFB\u52A0\u5230\u8DEF\u7EBF" : "\u6DFB\u52A0\u5230\u8DEF\u7EBF"),
        J: isInPendingList.value ? 1 : "",
        K: common_vendor.o(addToRoute)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-44e281b9"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/scenic/detail.vue"]]);
wx.createPage(MiniProgramPage);
