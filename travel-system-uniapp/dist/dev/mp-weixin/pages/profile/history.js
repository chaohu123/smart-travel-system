"use strict";
var common_vendor = require("../../common/vendor.js");
var store_user = require("../../store/user.js");
var api_route = require("../../api/route.js");
require("../../utils/storage.js");
require("../../utils/http.js");
require("../../utils/config.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const filterOptions = [
      { value: "all", label: "\u5168\u90E8" },
      { value: "completed", label: "\u5DF2\u5B8C\u6210" },
      { value: "ongoing", label: "\u8FDB\u884C\u4E2D" },
      { value: "planned", label: "\u8BA1\u5212\u4E2D" }
    ];
    const currentFilter = common_vendor.ref("all");
    const historyList = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const refreshing = common_vendor.ref(false);
    const pageNum = common_vendor.ref(1);
    const pageSize = common_vendor.ref(10);
    const hasMore = common_vendor.ref(true);
    const switchFilter = (value) => {
      currentFilter.value = value;
      pageNum.value = 1;
      hasMore.value = true;
      historyList.value = [];
      loadHistory(true);
    };
    const loadHistory = async (reset = false) => {
      var _a, _b;
      if (!((_a = user.value) == null ? void 0 : _a.id)) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        return;
      }
      if (reset) {
        pageNum.value = 1;
        hasMore.value = true;
        historyList.value = [];
      }
      if (loading.value || !reset && !hasMore.value) {
        return;
      }
      loading.value = true;
      try {
        const res = await api_route.routeApi.listMyRoutes(user.value.id);
        if (res && res.statusCode === 200 && res.data.code === 200) {
          let dataList = [];
          if (Array.isArray(res.data.data)) {
            dataList = res.data.data;
          } else if ((_b = res.data.data) == null ? void 0 : _b.list) {
            dataList = res.data.data.list;
          }
          if (currentFilter.value !== "all") {
            dataList = dataList.filter((item) => {
              const status = item.status || "planned";
              return status === currentFilter.value;
            });
          }
          if (reset) {
            historyList.value = dataList;
          } else {
            historyList.value.push(...dataList);
          }
          hasMore.value = dataList.length >= pageSize.value;
          if (hasMore.value) {
            pageNum.value++;
          }
        }
      } catch (error) {
        console.error("\u52A0\u8F7D\u89C4\u5212\u5386\u53F2\u5931\u8D25", error);
        loadLocalHistory();
      } finally {
        loading.value = false;
        refreshing.value = false;
      }
    };
    const loadLocalHistory = () => {
      var _a;
      const localHistory = common_vendor.index.getStorageSync(`plan_history_${(_a = user.value) == null ? void 0 : _a.id}`) || [];
      historyList.value = localHistory;
      hasMore.value = false;
    };
    const onRefresh = () => {
      refreshing.value = true;
      loadHistory(true);
    };
    const loadMore = () => {
      if (!loading.value && hasMore.value) {
        loadHistory(false);
      }
    };
    const formatTime = (time) => {
      if (!time)
        return "";
      const date = new Date(time);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
      if (days === 0) {
        return "\u4ECA\u5929";
      } else if (days === 1) {
        return "\u6628\u5929";
      } else if (days < 7) {
        return `${days}\u5929\u524D`;
      } else {
        return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
      }
    };
    const getStatusText = (status) => {
      const statusMap = {
        "completed": "\u5DF2\u5B8C\u6210",
        "ongoing": "\u8FDB\u884C\u4E2D",
        "planned": "\u8BA1\u5212\u4E2D"
      };
      return statusMap[status] || "\u8BA1\u5212\u4E2D";
    };
    const viewDetail = (item) => {
      if (item.id) {
        common_vendor.index.navigateTo({ url: `/pages/route/detail?id=${item.id}` });
      } else {
        common_vendor.index.navigateTo({ url: `/pages/route/plan` });
      }
    };
    const sharePlan = (item) => {
      common_vendor.index.showShareMenu({
        withShareTicket: true,
        menus: ["shareAppMessage", "shareTimeline"]
      });
      common_vendor.index.showToast({ title: "\u5206\u4EAB\u529F\u80FD\u5F00\u53D1\u4E2D", icon: "none" });
    };
    const deletePlan = (id) => {
      common_vendor.index.showModal({
        title: "\u786E\u8BA4\u5220\u9664",
        content: "\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u6761\u89C4\u5212\u8BB0\u5F55\u5417\uFF1F",
        success: (res) => {
          if (res.confirm) {
            const index = historyList.value.findIndex((item) => item.id === id);
            if (index > -1) {
              historyList.value.splice(index, 1);
              common_vendor.index.showToast({ title: "\u5220\u9664\u6210\u529F", icon: "success" });
            }
          }
        }
      });
    };
    const goToPlan = () => {
      common_vendor.index.navigateTo({ url: "/pages/route/plan" });
    };
    common_vendor.onMounted(() => {
      if (user.value) {
        loadHistory(true);
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(filterOptions, (filter, k0, i0) => {
          return {
            a: common_vendor.t(filter.label),
            b: filter.value,
            c: currentFilter.value === filter.value ? 1 : "",
            d: common_vendor.o(($event) => switchFilter(filter.value))
          };
        }),
        b: loading.value && historyList.value.length === 0
      }, loading.value && historyList.value.length === 0 ? {
        c: common_vendor.f(5, (i, k0, i0) => {
          return {
            a: i
          };
        })
      } : !loading.value && historyList.value.length === 0 ? {
        e: common_vendor.o(goToPlan)
      } : {
        f: common_vendor.f(historyList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: item.coverImage
          }, item.coverImage ? {
            b: item.coverImage
          } : {}, {
            c: item.status
          }, item.status ? {
            d: common_vendor.t(getStatusText(item.status)),
            e: common_vendor.n(`status-${item.status}`)
          } : {}, {
            f: common_vendor.t(item.title || item.routeName || "\u672A\u547D\u540D\u884C\u7A0B"),
            g: common_vendor.t(formatTime(item.createTime)),
            h: common_vendor.t(item.destination || "\u672A\u77E5\u76EE\u7684\u5730"),
            i: common_vendor.t(item.days || 0),
            j: item.summary
          }, item.summary ? {
            k: common_vendor.t(item.summary)
          } : {}, {
            l: common_vendor.o(($event) => sharePlan()),
            m: common_vendor.o(($event) => deletePlan(item.id)),
            n: item.id,
            o: common_vendor.o(($event) => viewDetail(item))
          });
        })
      }, {
        d: !loading.value && historyList.value.length === 0,
        g: hasMore.value && !loading.value
      }, hasMore.value && !loading.value ? {} : {}, {
        h: !hasMore.value && historyList.value.length > 0
      }, !hasMore.value && historyList.value.length > 0 ? {} : {}, {
        i: common_vendor.o(loadMore),
        j: refreshing.value,
        k: common_vendor.o(onRefresh)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ab48eb4c"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/profile/history.vue"]]);
wx.createPage(MiniProgramPage);
