"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var api_route = require("../../api/route.js");
var store_user = require("../../store/user.js");
require("../../utils/http.js");
require("../../utils/storage.js");
require("../../utils/config.js");
require("../../utils/image.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const routeList = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const refreshing = common_vendor.ref(false);
    const pageNum = common_vendor.ref(1);
    const pageSize = common_vendor.ref(10);
    const keyword = common_vendor.ref("");
    const filterPopupVisible = common_vendor.ref(false);
    const filterDays = common_vendor.ref(0);
    const sortKey = common_vendor.ref("hot");
    const dayOptions = [
      { value: 0, label: "\u5168\u90E8" },
      { value: 2, label: "2\u5929" },
      { value: 3, label: "3\u5929" },
      { value: 4, label: "4\u5929" },
      { value: 5, label: "5\u5929" },
      { value: 6, label: "6\u5929" },
      { value: 7, label: "7\u5929" }
    ];
    const sortOptions = [
      { value: "hot", label: "\u9ED8\u8BA4\u70ED\u5EA6" },
      { value: "view", label: "\u6D4F\u89C8\u91CF\u6700\u9AD8" },
      { value: "fav", label: "\u6536\u85CF\u91CF\u6700\u9AD8" },
      { value: "use", label: "\u4F7F\u7528\u91CF\u6700\u9AD8" },
      { value: "daysAsc", label: "\u5929\u6570\u6700\u5C11" },
      { value: "daysDesc", label: "\u5929\u6570\u6700\u591A" }
    ];
    const filterActiveHint = common_vendor.computed(() => !!(filterDays.value || sortKey.value !== "hot"));
    const normalizedKeyword = common_vendor.computed(() => keyword.value.trim().toLowerCase());
    const filteredRoutes = common_vendor.computed(() => {
      let list = routeList.value.slice();
      const kw = normalizedKeyword.value;
      if (kw) {
        list = list.filter((r) => {
          const name = (r.routeName || "").toLowerCase();
          const summary = (r.summary || "").toLowerCase();
          return name.includes(kw) || summary.includes(kw);
        });
      }
      if (filterDays.value) {
        list = list.filter((r) => Number(r.days || 0) === Number(filterDays.value));
      }
      const safeNum = (n) => typeof n === "number" && !Number.isNaN(n) ? n : 0;
      if (sortKey.value === "view")
        list.sort((a, b) => safeNum(b.viewCount) - safeNum(a.viewCount));
      if (sortKey.value === "fav")
        list.sort((a, b) => safeNum(b.favoriteCount) - safeNum(a.favoriteCount));
      if (sortKey.value === "use")
        list.sort((a, b) => safeNum(b.useCount) - safeNum(a.useCount));
      if (sortKey.value === "daysAsc")
        list.sort((a, b) => safeNum(a.days) - safeNum(b.days));
      if (sortKey.value === "daysDesc")
        list.sort((a, b) => safeNum(b.days) - safeNum(a.days));
      return list;
    });
    const totalPages = common_vendor.computed(() => Math.max(1, Math.ceil(filteredRoutes.value.length / pageSize.value)));
    const pagedRoutes = common_vendor.computed(() => {
      const start = (pageNum.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return filteredRoutes.value.slice(start, end);
    });
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
      if (route && route.id) {
        route.viewCount = Number(route.viewCount || 0) + 1;
        api_route.routeApi.recordView(route.id).catch(() => {
        });
      }
      common_vendor.index.navigateTo({ url: `/pages/itinerary/itinerary-detail?id=${route.id}` });
    };
    const loadRoutes = async (reset = false) => {
      var _a;
      if (loading.value)
        return;
      loading.value = true;
      if (reset) {
        pageNum.value = 1;
        routeList.value = [];
      }
      try {
        const userId = (_a = user.value) == null ? void 0 : _a.id;
        const limit = 1e3;
        const res = await api_content.recommendApi.routes(userId, limit);
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          const newRoutes = data.data || [];
          routeList.value = newRoutes;
        } else {
          common_vendor.index.showToast({
            title: data.msg || "\u52A0\u8F7D\u5931\u8D25",
            icon: "none"
          });
        }
      } catch (error) {
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
    const goPrevPage = () => {
      if (pageNum.value <= 1 || loading.value)
        return;
      pageNum.value -= 1;
    };
    const goNextPage = () => {
      if (pageNum.value >= totalPages.value || loading.value)
        return;
      pageNum.value += 1;
    };
    const onSearchConfirm = () => {
      pageNum.value = 1;
    };
    const clearKeyword = () => {
      keyword.value = "";
    };
    const resetFilters = () => {
      keyword.value = "";
      filterDays.value = 0;
      sortKey.value = "hot";
      pageNum.value = 1;
    };
    common_vendor.watch([normalizedKeyword, filterDays, sortKey], () => {
      pageNum.value = 1;
    });
    common_vendor.watch([filteredRoutes], () => {
      if (pageNum.value > totalPages.value)
        pageNum.value = totalPages.value;
    });
    common_vendor.onMounted(() => {
      loadRoutes(true);
    });
    common_vendor.onShow(() => {
      if (routeList.value.length > 0) {
        loadRoutes(false);
      }
    });
    common_vendor.onPullDownRefresh(async () => {
      await loadRoutes(true);
      common_vendor.index.stopPullDownRefresh();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(onSearchConfirm),
        b: keyword.value,
        c: common_vendor.o(($event) => keyword.value = $event.detail.value),
        d: keyword.value
      }, keyword.value ? {
        e: common_vendor.o(clearKeyword)
      } : {}, {
        f: common_vendor.unref(filterActiveHint)
      }, common_vendor.unref(filterActiveHint) ? {} : {}, {
        g: common_vendor.o(($event) => filterPopupVisible.value = true),
        h: !loading.value && routeList.value.length > 0
      }, !loading.value && routeList.value.length > 0 ? {
        i: common_vendor.t(common_vendor.unref(filteredRoutes).length)
      } : {}, {
        j: loading.value && routeList.value.length === 0
      }, loading.value && routeList.value.length === 0 ? {
        k: common_vendor.f(6, (i, k0, i0) => {
          return {
            a: i
          };
        })
      } : common_vendor.e({
        l: common_vendor.f(common_vendor.unref(pagedRoutes), (route, k0, i0) => {
          return common_vendor.e({
            a: route.coverImage || "https://ts2.tc.mm.bing.net/th/id/OIP-C.D0FxyIfldS08x95YBJdFQAHaFj?rs=1&pid=ImgDetMain&o=7&rm=3",
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
        m: !loading.value && common_vendor.unref(filteredRoutes).length === 0
      }, !loading.value && common_vendor.unref(filteredRoutes).length === 0 ? {
        n: common_vendor.t(routeList.value.length === 0 ? "\u6682\u65E0\u70ED\u95E8\u8DEF\u7EBF" : "\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u8DEF\u7EBF"),
        o: common_vendor.t(routeList.value.length === 0 ? "\u7A0D\u540E\u518D\u6765\u770B\u770B\u5427" : "\u8BD5\u8BD5\u8C03\u6574\u641C\u7D22\u6216\u7B5B\u9009\u6761\u4EF6")
      } : {}), {
        p: refreshing.value,
        q: common_vendor.o(onRefresh),
        r: !loading.value && common_vendor.unref(filteredRoutes).length > 0
      }, !loading.value && common_vendor.unref(filteredRoutes).length > 0 ? {
        s: pageNum.value === 1,
        t: common_vendor.o(goPrevPage),
        v: common_vendor.t(pageNum.value),
        w: common_vendor.t(common_vendor.unref(totalPages)),
        x: pageNum.value === common_vendor.unref(totalPages),
        y: common_vendor.o(goNextPage)
      } : {}, {
        z: filterPopupVisible.value
      }, filterPopupVisible.value ? {
        A: common_vendor.f(dayOptions, (d, k0, i0) => {
          return {
            a: common_vendor.t(d.label),
            b: d.value,
            c: filterDays.value === d.value ? 1 : "",
            d: common_vendor.o(($event) => filterDays.value = d.value)
          };
        }),
        B: common_vendor.f(sortOptions, (s, k0, i0) => {
          return {
            a: common_vendor.t(s.label),
            b: s.value,
            c: sortKey.value === s.value ? 1 : "",
            d: common_vendor.o(($event) => sortKey.value = s.value)
          };
        }),
        C: common_vendor.o(resetFilters),
        D: common_vendor.o(($event) => filterPopupVisible.value = false),
        E: common_vendor.o(() => {
        }),
        F: common_vendor.o(($event) => filterPopupVisible.value = false)
      } : {});
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-8ad93658"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/route/hot-routes.vue"]]);
wx.createPage(MiniProgramPage);
