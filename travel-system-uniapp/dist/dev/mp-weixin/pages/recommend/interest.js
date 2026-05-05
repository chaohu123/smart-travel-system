"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var utils_config = require("../../utils/config.js");
var utils_image = require("../../utils/image.js");
require("../../utils/http.js");
require("../../utils/storage.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const loading = common_vendor.ref(false);
    const scenicList = common_vendor.ref([]);
    const searchKeyword = common_vendor.ref("");
    const currentCityName = common_vendor.ref("\u5B9A\u4F4D\u4E2D...");
    const currentCityId = common_vendor.ref(null);
    const cityList = common_vendor.ref([]);
    const currentPage = common_vendor.ref(1);
    const pageSize = common_vendor.ref(6);
    const lastCityApplyTs = common_vendor.ref(0);
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    const filteredList = common_vendor.computed(() => {
      const keyword = searchKeyword.value.trim().toLowerCase();
      if (!keyword)
        return scenicList.value;
      return scenicList.value.filter((item) => {
        const text = `${item.name || ""}${item.address || ""}${item.city || ""}`.toLowerCase();
        return text.includes(keyword);
      });
    });
    const totalPages = common_vendor.computed(() => {
      if (!filteredList.value.length)
        return 1;
      return Math.ceil(filteredList.value.length / pageSize.value);
    });
    const pagedList = common_vendor.computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return filteredList.value.slice(start, end);
    });
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };
    const loadCityList = async () => {
      const res = await api_content.cityApi.list();
      const data = res.data;
      if (res.statusCode === 200 && data.code === 200) {
        cityList.value = (data.data || []).map((item) => ({
          id: item.id,
          name: item.cityName || item.name,
          latitude: item.latitude ? Number(item.latitude) : void 0,
          longitude: item.longitude ? Number(item.longitude) : void 0
        }));
      }
    };
    const matchCityByName = (name) => {
      const matched = cityList.value.find((city) => name.includes(city.name.replace(/市$/, "")) || city.name.includes(name));
      return matched || null;
    };
    const matchNearestCity = (latitude, longitude) => {
      const availableCities = cityList.value.filter((city) => Number.isFinite(city.latitude) && Number.isFinite(city.longitude));
      if (!availableCities.length)
        return null;
      let nearest = null;
      let minDistance = Number.POSITIVE_INFINITY;
      availableCities.forEach((city) => {
        const distance = calculateDistance(latitude, longitude, Number(city.latitude), Number(city.longitude));
        if (distance < minDistance) {
          minDistance = distance;
          nearest = city;
        }
      });
      return nearest;
    };
    const getUserCityAndLoad = () => {
      common_vendor.index.getLocation({
        type: "gcj02",
        geocode: true,
        success: (res) => {
          const addr = res.address || {};
          const cityName = (addr.city || addr.province || "").replace(/市|省$/, "");
          const byName = cityName ? matchCityByName(cityName) : null;
          const byDistance = matchNearestCity(res.latitude, res.longitude);
          const city = byName || byDistance;
          if (city) {
            currentCityName.value = city.name.replace(/市$/, "");
            currentCityId.value = city.id;
          } else {
            currentCityName.value = cityName || "\u5168\u56FD";
            currentCityId.value = null;
          }
          loadScenicList();
        },
        fail: () => {
          currentCityName.value = "\u5168\u56FD";
          currentCityId.value = null;
          loadScenicList();
        }
      });
    };
    const loadScenicList = async () => {
      loading.value = true;
      try {
        const params = {
          pageNum: 1,
          pageSize: 1e3
        };
        if (currentCityId.value) {
          params.cityId = currentCityId.value;
        }
        const res = await api_content.scenicSpotApi.list(params);
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          const raw = data.data;
          const rows = Array.isArray(raw == null ? void 0 : raw.rows) ? raw.rows : Array.isArray(raw == null ? void 0 : raw.list) ? raw.list : Array.isArray(raw) ? raw : [];
          scenicList.value = rows;
        } else {
          scenicList.value = [];
        }
      } catch {
        scenicList.value = [];
      } finally {
        loading.value = false;
        currentPage.value = 1;
      }
    };
    const onSearchConfirm = () => {
      currentPage.value = 1;
    };
    const chooseCity = () => {
      const handleCitySelected = (data) => {
        currentCityId.value = data.id;
        currentCityName.value = data.name;
        currentPage.value = 1;
        loadScenicList();
      };
      common_vendor.index.navigateTo({
        url: "/pages/city/select",
        events: {
          citySelected: handleCitySelected
        },
        success: (res) => {
          res.eventChannel.on("citySelected", handleCitySelected);
        }
      });
    };
    const applyCityFromStorage = () => {
      const selected = common_vendor.index.getStorageSync("ticket_selected_city");
      if (!selected || !selected.id || !selected.name)
        return;
      const ts = Number(selected.ts || 0);
      if (ts <= lastCityApplyTs.value)
        return;
      if (currentCityId.value === selected.id && currentCityName.value === selected.name) {
        lastCityApplyTs.value = ts;
        return;
      }
      currentCityId.value = selected.id;
      currentCityName.value = selected.name;
      currentPage.value = 1;
      lastCityApplyTs.value = ts;
      loadScenicList();
    };
    const goPrevPage = () => {
      if (currentPage.value <= 1)
        return;
      currentPage.value -= 1;
    };
    const goNextPage = () => {
      if (currentPage.value >= totalPages.value)
        return;
      currentPage.value += 1;
    };
    const goScenicDetail = (id) => {
      common_vendor.index.navigateTo({ url: `/pages/scenic/detail?id=${id}&from=ticket` });
    };
    common_vendor.onMounted(async () => {
      await loadCityList();
      getUserCityAndLoad();
    });
    common_vendor.onShow(() => {
      applyCityFromStorage();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(goBack),
        b: common_vendor.t(currentCityName.value),
        c: common_vendor.o(chooseCity),
        d: common_vendor.o(onSearchConfirm),
        e: searchKeyword.value,
        f: common_vendor.o(($event) => searchKeyword.value = $event.detail.value),
        g: common_vendor.o(onSearchConfirm),
        h: loading.value
      }, loading.value ? {} : common_vendor.unref(pagedList).length === 0 ? {
        j: common_vendor.t(scenicList.value.length === 0 ? "\u5F53\u524D\u5730\u533A\u6682\u65E0\u666F\u70B9" : "\u672A\u627E\u5230\u5339\u914D\u666F\u70B9")
      } : {
        k: common_vendor.f(common_vendor.unref(pagedList), (item, k0, i0) => {
          return {
            a: item.imageUrl ? common_vendor.unref(utils_image.getImageUrl)(item.imageUrl) : common_vendor.unref(utils_config.defaultScenicImage),
            b: common_vendor.t(item.name),
            c: common_vendor.t(item.price && Number(item.price) > 0 ? `\xA5${Number(item.price)}\u8D77` : "\u514D\u8D39"),
            d: !item.price || Number(item.price) === 0 ? 1 : "",
            e: common_vendor.t(item.address || `${item.province || ""}${item.city || ""}` || "\u5730\u5740\u5F85\u5B8C\u5584"),
            f: common_vendor.t(item.openTime || "\u5F00\u653E\u65F6\u95F4\u5F85\u5B9A"),
            g: common_vendor.t(item.suggestedVisitTime || "\u65F6\u957F\u5F85\u5B8C\u5584"),
            h: item.id,
            i: common_vendor.o(($event) => goScenicDetail(item.id))
          };
        })
      }, {
        i: common_vendor.unref(pagedList).length === 0,
        l: currentPage.value <= 1,
        m: common_vendor.o(goPrevPage),
        n: common_vendor.t(currentPage.value),
        o: common_vendor.t(common_vendor.unref(totalPages)),
        p: currentPage.value >= common_vendor.unref(totalPages),
        q: common_vendor.o(goNextPage)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-5ed50221"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/recommend/interest.vue"]]);
wx.createPage(MiniProgramPage);
