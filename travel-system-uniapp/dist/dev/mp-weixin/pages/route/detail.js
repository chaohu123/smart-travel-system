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
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const formatDate = (dateStr) => {
      if (!dateStr)
        return "";
      try {
        const date = new Date(dateStr);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}\u6708${day}\u65E5`;
      } catch (e) {
        return dateStr;
      }
    };
    const getPoiTypeName = (type) => {
      if (type === "scenic")
        return "\u666F\u70B9";
      if (type === "food")
        return "\u7F8E\u98DF";
      return "\u5730\u70B9";
    };
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
      if (!routeId.value)
        return;
      loading.value = true;
      try {
        const res = await api_route.routeApi.getDetail(routeId.value);
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          routeDetail.value = data.data;
          loadFavoriteStatus();
        } else {
          common_vendor.index.showToast({
            title: data.msg || "\u52A0\u8F7D\u5931\u8D25",
            icon: "none"
          });
        }
      } catch (error) {
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
    const useRoute = () => {
      if (!routeId.value)
        return;
      common_vendor.index.navigateTo({
        url: `/pages/route/plan?routeId=${routeId.value}`
      });
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
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
      return common_vendor.e({
        a: (_b = (_a = routeDetail.value) == null ? void 0 : _a.route) == null ? void 0 : _b.coverImage
      }, ((_d = (_c = routeDetail.value) == null ? void 0 : _c.route) == null ? void 0 : _d.coverImage) ? {
        b: routeDetail.value.route.coverImage
      } : {}, {
        c: loading.value
      }, loading.value ? {} : routeDetail.value ? common_vendor.e({
        e: common_vendor.t(((_e = routeDetail.value.route) == null ? void 0 : _e.routeName) || "\u672A\u547D\u540D\u8DEF\u7EBF"),
        f: common_vendor.t(((_f = routeDetail.value.route) == null ? void 0 : _f.days) || 0),
        g: (_g = routeDetail.value.route) == null ? void 0 : _g.suitablePeople
      }, ((_h = routeDetail.value.route) == null ? void 0 : _h.suitablePeople) ? {
        h: common_vendor.t(routeDetail.value.route.suitablePeople)
      } : {}, {
        i: common_vendor.t(((_i = routeDetail.value.route) == null ? void 0 : _i.viewCount) || 0),
        j: common_vendor.t(((_j = routeDetail.value.route) == null ? void 0 : _j.favoriteCount) || 0),
        k: common_vendor.t(((_k = routeDetail.value.route) == null ? void 0 : _k.useCount) || 0),
        l: (_l = routeDetail.value.route) == null ? void 0 : _l.summary
      }, ((_m = routeDetail.value.route) == null ? void 0 : _m.summary) ? {
        m: common_vendor.t(routeDetail.value.route.summary)
      } : {}, {
        n: routeDetail.value.days && routeDetail.value.days.length > 0
      }, routeDetail.value.days && routeDetail.value.days.length > 0 ? {
        o: common_vendor.t(routeDetail.value.days.length),
        p: common_vendor.f(routeDetail.value.days, (dayData, dayIndex, i0) => {
          return common_vendor.e({
            a: common_vendor.t(dayIndex + 1),
            b: dayData.day
          }, dayData.day ? common_vendor.e({
            c: dayData.day.date
          }, dayData.day.date ? {
            d: common_vendor.t(formatDate(dayData.day.date))
          } : {}, {
            e: dayData.day.summary
          }, dayData.day.summary ? {
            f: common_vendor.t(dayData.day.summary)
          } : {}) : {}, {
            g: dayData.pois && dayData.pois.length > 0
          }, dayData.pois && dayData.pois.length > 0 ? {
            h: common_vendor.f(dayData.pois, (poiData, poiIndex, i1) => {
              var _a2, _b2, _c2, _d2;
              return common_vendor.e({
                a: common_vendor.t(poiIndex + 1),
                b: common_vendor.t(getPoiTypeName((_a2 = poiData.poi) == null ? void 0 : _a2.poiType)),
                c: common_vendor.n(getPoiTypeClass((_b2 = poiData.poi) == null ? void 0 : _b2.poiType)),
                d: common_vendor.t(getPoiName(poiData)),
                e: poiData.detail
              }, poiData.detail ? common_vendor.e({
                f: getPoiAddress(poiData)
              }, getPoiAddress(poiData) ? {
                g: common_vendor.t(getPoiAddress(poiData))
              } : {}, {
                h: getPoiScore(poiData)
              }, getPoiScore(poiData) ? {
                i: common_vendor.t(getPoiScore(poiData))
              } : {}) : {}, {
                j: (_c2 = poiData.poi) == null ? void 0 : _c2.visitTime
              }, ((_d2 = poiData.poi) == null ? void 0 : _d2.visitTime) ? {
                k: common_vendor.t(poiData.poi.visitTime)
              } : {}, {
                l: poiIndex,
                m: common_vendor.o(($event) => viewPoiDetail(poiData))
              });
            })
          } : {}, {
            i: dayIndex
          });
        })
      } : {}) : {}, {
        d: routeDetail.value,
        q: common_vendor.t(isFavorite.value ? "\u2764\uFE0F" : "\u{1F90D}"),
        r: isFavorite.value ? 1 : "",
        s: common_vendor.o(toggleFavorite),
        t: common_vendor.o(useRoute)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-bcda044a"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/route/detail.vue"]]);
wx.createPage(MiniProgramPage);
