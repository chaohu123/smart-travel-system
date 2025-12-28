"use strict";
var common_vendor = require("../../common/vendor.js");
var api_route = require("../../api/route.js");
var store_user = require("../../store/user.js");
require("../../utils/http.js");
require("../../utils/storage.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const routeId = common_vendor.ref(null);
    const loading = common_vendor.ref(false);
    const routeDetail = common_vendor.ref(null);
    const isFavorite = common_vendor.ref(false);
    const selectedDayIndex = common_vendor.ref(0);
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const routeTitle = common_vendor.computed(() => {
      var _a;
      if (!((_a = routeDetail.value) == null ? void 0 : _a.route))
        return "\u667A\u80FD\u89C4\u5212\u7ED3\u679C";
      const routeName = routeDetail.value.route.routeName;
      const days = routeDetail.value.route.days;
      return `${routeName}\xB7${days}\u65E5\u6E38`;
    });
    const selectedDayData = common_vendor.computed(() => {
      var _a;
      if (!((_a = routeDetail.value) == null ? void 0 : _a.days) || routeDetail.value.days.length === 0)
        return null;
      return routeDetail.value.days[selectedDayIndex.value] || null;
    });
    const summaryFeatures = common_vendor.computed(() => {
      var _a;
      const features = [];
      if ((_a = routeDetail.value) == null ? void 0 : _a.route) {
        const route = routeDetail.value.route;
        if (route.days) {
          features.push(`\u8986\u76D6${route.days}\u5929\u7ECF\u5178\u884C\u7A0B`);
        }
        features.push("\u6BCF\u65E5\u6B65\u884C<1.5\u4E07\u6B65,\u8282\u594F\u8212\u9002");
        features.push("\u7A7F\u63D2\u5F53\u5730\u7F8E\u98DF\u4F53\u9A8C");
        features.push("\u9884\u7B97:\u4EBA\u5747\u7EA6800\u5143(\u4E0D\u542B\u4F4F\u5BBF)");
      }
      return features;
    });
    const getPoiTypeClass = (type) => {
      if (type === "scenic")
        return "poi-type-scenic";
      if (type === "food")
        return "poi-type-food";
      return "";
    };
    const getPoiName = (poiData) => {
      var _a;
      if ((_a = poiData.detail) == null ? void 0 : _a.name)
        return poiData.detail.name;
      return "\u672A\u77E5\u5730\u70B9";
    };
    const getPoiAddress = (poiData) => {
      var _a;
      if ((_a = poiData.detail) == null ? void 0 : _a.address)
        return poiData.detail.address;
      return "";
    };
    const getPoiScore = (poiData) => {
      var _a;
      if ((_a = poiData.detail) == null ? void 0 : _a.score) {
        const score = typeof poiData.detail.score === "number" ? poiData.detail.score : Number(poiData.detail.score);
        return score.toFixed(1);
      }
      return null;
    };
    const getPoiPrice = (poiData) => {
      var _a, _b;
      if ((_a = poiData.detail) == null ? void 0 : _a.price) {
        const price = typeof poiData.detail.price === "number" ? poiData.detail.price : Number(poiData.detail.price);
        if (price === 0)
          return "\u514D\u8D39";
        return `\xA5${price}`;
      }
      if ((_b = poiData.detail) == null ? void 0 : _b.avgPrice) {
        return `\u4EBA\u5747\xA5${poiData.detail.avgPrice}`;
      }
      return null;
    };
    const getPoiTips = (poiData) => {
      var _a;
      if ((_a = poiData.detail) == null ? void 0 : _a.intro) {
        return poiData.detail.intro.substring(0, 50) + "...";
      }
      return null;
    };
    const getPoiSuggestion = (poiData) => {
      var _a;
      if ((_a = poiData.detail) == null ? void 0 : _a.suggestion) {
        return poiData.detail.suggestion;
      }
      return null;
    };
    const getDayTitle = (dayData) => {
      var _a;
      if ((_a = dayData.day) == null ? void 0 : _a.title) {
        return dayData.day.title;
      }
      return "\u7ECF\u5178\u4E4B\u65C5";
    };
    const getDayDuration = (dayData) => {
      if (dayData.pois && dayData.pois.length > 0) {
        let totalMinutes = 0;
        dayData.pois.forEach((poi) => {
          var _a;
          if ((_a = poi.poi) == null ? void 0 : _a.stayTime) {
            totalMinutes += poi.poi.stayTime;
          }
        });
        return Math.ceil(totalMinutes / 60);
      }
      return 8;
    };
    const selectDay = (index) => {
      selectedDayIndex.value = index;
    };
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    const checkPoi = (poiData) => {
      viewPoiDetail(poiData);
    };
    const navigatePoi = (poiData) => {
      var _a;
      if ((_a = poiData.detail) == null ? void 0 : _a.address) {
        common_vendor.index.openLocation({
          address: poiData.detail.address,
          success: () => {
            console.log("\u6253\u5F00\u5730\u56FE\u6210\u529F");
          }
        });
      }
    };
    const editRoute = () => {
      common_vendor.index.showToast({
        title: "\u7F16\u8F91\u529F\u80FD\u5F00\u53D1\u4E2D",
        icon: "none"
      });
    };
    const saveRoute = () => {
      common_vendor.index.showToast({
        title: "\u4FDD\u5B58\u6210\u529F",
        icon: "success"
      });
    };
    const regenerateRoute = () => {
      common_vendor.index.showToast({
        title: "\u91CD\u65B0\u751F\u6210\u529F\u80FD\u5F00\u53D1\u4E2D",
        icon: "none"
      });
    };
    const viewPoiDetail = (poiData) => {
      if (!poiData.poi || !poiData.detail)
        return;
      const poiType = poiData.poi.poiType;
      const poiId = poiData.poi.poiId;
      if (poiType === "scenic") {
        common_vendor.index.navigateTo({
          url: `/pages/scenic/detail?id=${poiId}`
        });
      } else if (poiType === "food") {
        common_vendor.index.navigateTo({
          url: `/pages/food/detail?id=${poiId}`
        });
      }
    };
    const loadDetail = async () => {
      var _a;
      if (!routeId.value)
        return;
      loading.value = true;
      console.log("========== \u5F00\u59CB\u52A0\u8F7D\u8DEF\u7EBF\u8BE6\u60C5 ==========");
      console.log("\u8DEF\u7EBFID:", routeId.value);
      try {
        const res = await api_route.routeApi.getDetail(routeId.value);
        console.log("API\u54CD\u5E94\u72B6\u6001\u7801:", res.statusCode);
        console.log("API\u54CD\u5E94\u6570\u636E:", JSON.stringify(res.data, null, 2));
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          routeDetail.value = data.data;
          console.log("\u8DEF\u7EBF\u8BE6\u60C5\u52A0\u8F7D\u6210\u529F");
          console.log("\u8DEF\u7EBF\u57FA\u672C\u4FE1\u606F:", JSON.stringify(data.data.route, null, 2));
          console.log("\u5929\u6570\u6570\u636E:", ((_a = data.data.days) == null ? void 0 : _a.length) || 0, "\u5929");
          if (data.data.days && data.data.days.length > 0) {
            data.data.days.forEach((day, index) => {
              console.log(`\u7B2C${index + 1}\u5929\u6570\u636E:`, JSON.stringify(day, null, 2));
            });
          }
          loadFavoriteStatus();
          console.log("========== \u8DEF\u7EBF\u8BE6\u60C5\u52A0\u8F7D\u5B8C\u6210 ==========");
        } else {
          console.error("API\u8FD4\u56DE\u9519\u8BEF:", data.msg || "\u672A\u77E5\u9519\u8BEF");
          common_vendor.index.showToast({
            title: data.msg || "\u52A0\u8F7D\u5931\u8D25",
            icon: "none"
          });
        }
      } catch (error) {
        console.error("========== \u52A0\u8F7D\u8DEF\u7EBF\u8BE6\u60C5\u5931\u8D25 ==========");
        console.error("\u9519\u8BEF\u4FE1\u606F:", error.message);
        console.error("\u9519\u8BEF\u5806\u6808:", error.stack);
        common_vendor.index.showToast({
          title: "\u7F51\u7EDC\u9519\u8BEF",
          icon: "none"
        });
      } finally {
        loading.value = false;
      }
    };
    const loadFavoriteStatus = async () => {
      if (!routeId.value || !user.value)
        return;
    };
    const toggleFavorite = async () => {
      var _a, _b, _c;
      if (!user.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        setTimeout(() => {
          common_vendor.index.switchTab({ url: "/pages/profile/profile" });
        }, 1500);
        return;
      }
      if (!routeId.value)
        return;
      try {
        const res = await api_route.routeApi.toggleFavorite(user.value.id, routeId.value);
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          isFavorite.value = (_b = (_a = data.data) == null ? void 0 : _a.isFavorite) != null ? _b : !isFavorite.value;
          common_vendor.index.showToast({
            title: isFavorite.value ? "\u6536\u85CF\u6210\u529F" : "\u5DF2\u53D6\u6D88\u6536\u85CF",
            icon: "success"
          });
          if ((_c = routeDetail.value) == null ? void 0 : _c.route) {
            routeDetail.value.route.favoriteCount = (routeDetail.value.route.favoriteCount || 0) + (isFavorite.value ? 1 : -1);
          }
        } else {
          common_vendor.index.showToast({
            title: data.msg || "\u64CD\u4F5C\u5931\u8D25",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.showToast({
          title: "\u7F51\u7EDC\u9519\u8BEF",
          icon: "none"
        });
      }
    };
    common_vendor.onMounted(() => {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options || {};
      if (options.id) {
        routeId.value = Number(options.id);
        loadDetail();
      }
    });
    return (_ctx, _cache) => {
      var _a, _b, _c;
      return common_vendor.e({
        a: common_vendor.o(goBack),
        b: common_vendor.t(common_vendor.unref(routeTitle)),
        c: common_vendor.t(isFavorite.value ? "\u2764\uFE0F" : "\u{1F90D}"),
        d: isFavorite.value ? 1 : "",
        e: common_vendor.o(toggleFavorite),
        f: loading.value
      }, loading.value ? {} : routeDetail.value ? common_vendor.e({
        h: common_vendor.t(((_a = routeDetail.value.route) == null ? void 0 : _a.routeName) || "\u672A\u547D\u540D\u8DEF\u7EBF"),
        i: common_vendor.f(common_vendor.unref(summaryFeatures), (feature, idx, i0) => {
          return {
            a: common_vendor.t(feature),
            b: idx
          };
        }),
        j: routeDetail.value.days && routeDetail.value.days.length > 0
      }, routeDetail.value.days && routeDetail.value.days.length > 0 ? {
        k: common_vendor.f(routeDetail.value.days, (day, index, i0) => {
          return {
            a: common_vendor.t(index + 1),
            b: index,
            c: selectedDayIndex.value === index ? 1 : "",
            d: common_vendor.o(($event) => selectDay(index))
          };
        })
      } : {}, {
        l: common_vendor.unref(selectedDayData)
      }, common_vendor.unref(selectedDayData) ? common_vendor.e({
        m: common_vendor.t(selectedDayIndex.value + 1),
        n: common_vendor.t(getDayTitle(common_vendor.unref(selectedDayData))),
        o: (_b = common_vendor.unref(selectedDayData).day) == null ? void 0 : _b.intro
      }, ((_c = common_vendor.unref(selectedDayData).day) == null ? void 0 : _c.intro) ? {
        p: common_vendor.t(common_vendor.unref(selectedDayData).day.intro)
      } : {}, {
        q: common_vendor.t(getDayDuration(common_vendor.unref(selectedDayData)))
      }) : {}, {
        r: common_vendor.unref(selectedDayData) && common_vendor.unref(selectedDayData).pois
      }, common_vendor.unref(selectedDayData) && common_vendor.unref(selectedDayData).pois ? {
        s: common_vendor.f(common_vendor.unref(selectedDayData).pois, (poiData, poiIndex, i0) => {
          var _a2;
          return common_vendor.e({
            a: common_vendor.t(getPoiName(poiData)),
            b: getPoiScore(poiData)
          }, getPoiScore(poiData) ? {
            c: common_vendor.t(getPoiScore(poiData))
          } : {}, {
            d: getPoiPrice(poiData)
          }, getPoiPrice(poiData) ? {
            e: common_vendor.t(getPoiPrice(poiData))
          } : {}, {
            f: getPoiAddress(poiData)
          }, getPoiAddress(poiData) ? {
            g: common_vendor.t(getPoiAddress(poiData))
          } : {}, {
            h: getPoiTips(poiData)
          }, getPoiTips(poiData) ? {
            i: common_vendor.t(getPoiTips(poiData))
          } : {}, {
            j: getPoiSuggestion(poiData)
          }, getPoiSuggestion(poiData) ? {
            k: common_vendor.t(getPoiSuggestion(poiData))
          } : {}, {
            l: common_vendor.o(($event) => checkPoi(poiData)),
            m: common_vendor.o(($event) => navigatePoi(poiData)),
            n: poiIndex,
            o: common_vendor.n(getPoiTypeClass((_a2 = poiData.poi) == null ? void 0 : _a2.poiType)),
            p: common_vendor.o(($event) => viewPoiDetail(poiData))
          });
        })
      } : {}) : {}, {
        g: routeDetail.value,
        t: common_vendor.o(editRoute),
        v: common_vendor.o(saveRoute),
        w: common_vendor.o(regenerateRoute)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-bcda044a"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/route/detail.vue"]]);
wx.createPage(MiniProgramPage);
