"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var utils_storage = require("../../utils/storage.js");
var store_user = require("../../store/user.js");
var utils_router = require("../../utils/router.js");
require("../../utils/http.js");
require("../../utils/config.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const foodId = common_vendor.ref(null);
    const loading = common_vendor.ref(false);
    const detail = common_vendor.ref(null);
    const nearbyScenics = common_vendor.ref([]);
    const isFavorite = common_vendor.ref(false);
    const isInPendingList = common_vendor.ref(false);
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    let lastClickTime = 0;
    const CLICK_DEBOUNCE_TIME = 300;
    const CACHE_KEY_PREFIX = "food_detail_";
    const CACHE_EXPIRE = 5 * 60;
    let nearbyScenicsTimer = null;
    let isPageActive = true;
    const FAVORITE_KEY = "food_favorites";
    const loadFavoriteStatus = () => {
      if (!foodId.value)
        return;
      const favorites = utils_storage.getCache(FAVORITE_KEY) || [];
      isFavorite.value = favorites.includes(foodId.value);
    };
    const checkPendingStatus = () => {
      if (!foodId.value)
        return;
      const pendingAdditions = utils_storage.getCache("route_pending_additions") || [];
      isInPendingList.value = pendingAdditions.some((item) => item.type === "food" && item.id === foodId.value);
    };
    const loadDetail = async (useCache = true) => {
      if (!foodId.value)
        return;
      if (useCache) {
        const cacheKey = `${CACHE_KEY_PREFIX}${foodId.value}`;
        const cached = utils_storage.getCache(cacheKey);
        if (cached) {
          detail.value = cached;
          loadFavoriteStatus();
          checkPendingStatus();
          if (nearbyScenicsTimer) {
            clearTimeout(nearbyScenicsTimer);
          }
          nearbyScenicsTimer = setTimeout(() => {
            if (isPageActive) {
              loadNearbyScenics();
            }
            nearbyScenicsTimer = null;
          }, 300);
          return;
        }
      }
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
          if (foodId.value) {
            const cacheKey = `${CACHE_KEY_PREFIX}${foodId.value}`;
            utils_storage.setCache(cacheKey, detail.value, CACHE_EXPIRE);
          }
          loadFavoriteStatus();
          checkPendingStatus();
          if (nearbyScenicsTimer) {
            clearTimeout(nearbyScenicsTimer);
          }
          nearbyScenicsTimer = setTimeout(() => {
            if (isPageActive) {
              loadNearbyScenics();
            }
            nearbyScenicsTimer = null;
          }, 300);
        } else {
          common_vendor.index.showToast({ title: res.data.msg || "\u52A0\u8F7D\u5931\u8D25", icon: "none" });
        }
      } catch (e) {
        common_vendor.index.showToast({ title: "\u7F51\u7EDC\u9519\u8BEF", icon: "none" });
      } finally {
        loading.value = false;
      }
    };
    const loadNearbyScenics = async () => {
      var _a;
      if (!isPageActive || !((_a = detail.value) == null ? void 0 : _a.cityId))
        return;
      try {
        const res = await api_content.scenicSpotApi.getHot(detail.value.cityId, 3);
        if (isPageActive && res.statusCode === 200 && res.data.code === 200) {
          nearbyScenics.value = res.data.data || [];
        }
      } catch (e) {
        console.warn("\u52A0\u8F7D\u9644\u8FD1\u666F\u70B9\u5931\u8D25:", e);
      }
    };
    const onViewScenic = (scenicId) => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
        return;
      }
      lastClickTime = now;
      if (!scenicId)
        return;
      utils_router.safeNavigateTo(`/pages/scenic/detail?id=${scenicId}`).catch((err) => {
        if (isPageActive) {
          console.error("\u9875\u9762\u8DF3\u8F6C\u5931\u8D25:", err);
          common_vendor.index.showToast({ title: "\u9875\u9762\u8DF3\u8F6C\u5931\u8D25", icon: "none" });
        }
      });
    };
    const toggleFavorite = () => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
        return;
      }
      lastClickTime = now;
      if (!user.value) {
        if (isPageActive) {
          common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        }
        setTimeout(() => {
          if (isPageActive) {
            utils_router.safeSwitchTab("/pages/profile/profile").catch(() => {
            });
          }
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
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
        return;
      }
      lastClickTime = now;
      if (!foodId.value)
        return;
      utils_router.safeSwitchTab("/pages/checkin/checkin").catch((err) => {
        if (isPageActive) {
          console.error("\u9875\u9762\u8DF3\u8F6C\u5931\u8D25:", err);
          common_vendor.index.showToast({ title: "\u9875\u9762\u8DF3\u8F6C\u5931\u8D25", icon: "none" });
        }
      });
    };
    const addToRoute = () => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
        return;
      }
      lastClickTime = now;
      if (!foodId.value || !detail.value)
        return;
      const pendingAdditions = utils_storage.getCache("route_pending_additions") || [];
      const exists = pendingAdditions.some((item) => item.type === "food" && item.id === foodId.value);
      if (!exists) {
        pendingAdditions.push({
          type: "food",
          id: foodId.value,
          name: detail.value.name || "\u7F8E\u98DF"
        });
        utils_storage.setCache("route_pending_additions", pendingAdditions, 60 * 24);
        isInPendingList.value = true;
        common_vendor.index.showToast({
          title: "\u5DF2\u6DFB\u52A0\u5230\u5F85\u9009\u5217\u8868",
          icon: "success",
          duration: 2e3
        });
      } else {
        const filtered = pendingAdditions.filter((item) => !(item.type === "food" && item.id === foodId.value));
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
    common_vendor.onLoad(() => {
      utils_router.resetNavigationState();
      isPageActive = true;
    });
    common_vendor.onMounted(() => {
      const pages = getCurrentPages();
      if (!pages || pages.length === 0)
        return;
      const currentPage = pages[pages.length - 1];
      const options = (currentPage == null ? void 0 : currentPage.options) || {};
      const id = options == null ? void 0 : options.id;
      if (id) {
        const numId = Number(id);
        if (!isNaN(numId) && numId > 0) {
          foodId.value = numId;
          loadDetail();
        }
      }
    });
    common_vendor.onShow(() => {
      isPageActive = true;
      checkPendingStatus();
    });
    common_vendor.onUnmounted(() => {
      isPageActive = false;
      if (nearbyScenicsTimer) {
        clearTimeout(nearbyScenicsTimer);
        nearbyScenicsTimer = null;
      }
      utils_router.resetNavigationState();
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
        x: common_vendor.t(isInPendingList.value ? "\u2713" : "+"),
        y: common_vendor.t(isInPendingList.value ? "\u5DF2\u6DFB\u52A0\u5230\u8DEF\u7EBF" : "\u6DFB\u52A0\u5230\u8DEF\u7EBF"),
        z: isInPendingList.value ? 1 : "",
        A: common_vendor.o(addToRoute)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-68d96164"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/food/detail.vue"]]);
wx.createPage(MiniProgramPage);
