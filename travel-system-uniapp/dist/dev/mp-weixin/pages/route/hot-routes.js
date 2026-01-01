"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var store_user = require("../../store/user.js");
require("../../utils/http.js");
require("../../utils/storage.js");
require("../../utils/config.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const routeList = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const refreshing = common_vendor.ref(false);
    const pageNum = common_vendor.ref(1);
    const pageSize = common_vendor.ref(10);
    const hasMore = common_vendor.ref(true);
    const formatCount = (count) => {
      if (!count)
        return "0";
      if (count >= 1e4) {
        return (count / 1e4).toFixed(1) + "w";
      }
      return count.toString();
    };
    const getHotIndex = (route) => {
      return routeList.value.findIndex((r) => r.id === route.id) + 1;
    };
    const onViewRoute = (route) => {
      common_vendor.index.navigateTo({ url: `/pages/itinerary/itinerary-detail?id=${route.id}` });
    };
    const loadRoutes = async (reset = false) => {
      var _a;
      if (loading.value || !hasMore.value && !reset)
        return;
      loading.value = true;
      if (reset) {
        pageNum.value = 1;
        hasMore.value = true;
        routeList.value = [];
      }
      try {
        const userId = (_a = user.value) == null ? void 0 : _a.id;
        const limit = pageSize.value * pageNum.value;
        const res = await api_content.recommendApi.routes(userId, limit);
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          const newRoutes = data.data || [];
          if (reset) {
            routeList.value = newRoutes;
          } else {
            const existingIds = new Set(routeList.value.map((r) => r.id));
            const uniqueNewRoutes = newRoutes.filter((r) => !existingIds.has(r.id));
            routeList.value = [...routeList.value, ...uniqueNewRoutes];
          }
          hasMore.value = newRoutes.length >= limit;
          if (hasMore.value) {
            pageNum.value += 1;
          }
        } else {
          common_vendor.index.showToast({
            title: data.msg || "\u52A0\u8F7D\u5931\u8D25",
            icon: "none"
          });
        }
      } catch (error) {
        console.error("\u52A0\u8F7D\u8DEF\u7EBF\u5931\u8D25:", error);
        common_vendor.index.showToast({
          title: (error == null ? void 0 : error.message) || "\u7F51\u7EDC\u9519\u8BEF",
          icon: "none"
        });
      } finally {
        loading.value = false;
        refreshing.value = false;
      }
    };
    const onRefresh = () => {
      refreshing.value = true;
      loadRoutes(true);
    };
    const loadMore = () => {
      if (!loading.value && hasMore.value) {
        loadRoutes();
      }
    };
    common_vendor.onMounted(() => {
      loadRoutes(true);
    });
    common_vendor.onPullDownRefresh(async () => {
      await loadRoutes(true);
      common_vendor.index.stopPullDownRefresh();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: loading.value && routeList.value.length === 0
      }, loading.value && routeList.value.length === 0 ? {
        b: common_vendor.f(6, (i, k0, i0) => {
          return {
            a: i
          };
        })
      } : common_vendor.e({
        c: common_vendor.f(routeList.value, (route, k0, i0) => {
          return common_vendor.e({
            a: route.coverImage || "/static/default-route.jpg",
            b: getHotIndex(route) <= 3
          }, getHotIndex(route) <= 3 ? {
            c: common_vendor.t(getHotIndex(route))
          } : {}, {
            d: common_vendor.t(route.days),
            e: common_vendor.t(route.routeName),
            f: route.summary
          }, route.summary ? {
            g: common_vendor.t(route.summary)
          } : {}, {
            h: common_vendor.t(formatCount(route.viewCount)),
            i: common_vendor.t(formatCount(route.favoriteCount)),
            j: common_vendor.t(formatCount(route.useCount)),
            k: route.id,
            l: common_vendor.o(($event) => onViewRoute(route))
          });
        }),
        d: !loading.value && routeList.value.length === 0
      }, !loading.value && routeList.value.length === 0 ? {} : {}, {
        e: loading.value && routeList.value.length > 0
      }, loading.value && routeList.value.length > 0 ? {} : {}, {
        f: !hasMore.value && routeList.value.length > 0
      }, !hasMore.value && routeList.value.length > 0 ? {} : {}), {
        g: common_vendor.o(loadMore),
        h: refreshing.value,
        i: common_vendor.o(onRefresh)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-8ad93658"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/route/hot-routes.vue"]]);
wx.createPage(MiniProgramPage);
