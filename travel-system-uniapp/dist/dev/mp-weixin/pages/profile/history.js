"use strict";
var common_vendor = require("../../common/vendor.js");
var store_user = require("../../store/user.js");
var api_route = require("../../api/route.js");
var utils_router = require("../../utils/router.js");
require("../../utils/storage.js");
require("../../utils/http.js");
require("../../utils/config.js");
require("../../utils/image.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const defaultCover = "https://ts2.tc.mm.bing.net/th/id/OIP-C.D0FxyIfldS08x95YBJdFQAHaFj?rs=1&pid=ImgDetMain&o=7&rm=3";
    const pageSize = 10;
    const loading = common_vendor.ref(false);
    const refreshing = common_vendor.ref(false);
    const allHistory = common_vendor.ref([]);
    const currentPage = common_vendor.ref(1);
    const searchKeyword = common_vendor.ref("");
    const filterDest = common_vendor.ref("");
    const filterDatePreset = common_vendor.ref("all");
    const filterPopupVisible = common_vendor.ref(false);
    const editPopupVisible = common_vendor.ref(false);
    const editRouteId = common_vendor.ref(null);
    const editName = common_vendor.ref("");
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const formatCount = (count) => {
      if (!count)
        return "0";
      if (count >= 1e4)
        return `${(count / 1e4).toFixed(1)}w`;
      return String(count);
    };
    const formatTime = (time) => {
      if (!time)
        return "";
      const date = new Date(time);
      if (Number.isNaN(date.getTime()))
        return "";
      const diff = Date.now() - date.getTime();
      const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
      if (days <= 0)
        return "\u4ECA\u5929";
      if (days === 1)
        return "\u6628\u5929";
      if (days < 7)
        return `${days}\u5929\u524D`;
      return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
    };
    const normalizeRoute = (item) => {
      return {
        id: Number(item.id || 0),
        routeName: item.routeName || item.title,
        title: item.title,
        days: Number(item.days || 0),
        coverImage: item.coverImage || item.imageUrl,
        summary: item.summary,
        destination: item.destination || item.cityName || item.city || "\u672A\u77E5\u76EE\u7684\u5730",
        createTime: item.createTime,
        favoriteCount: Number(item.favoriteCount || 0),
        viewCount: Number(item.viewCount || 0)
      };
    };
    const datePresetOptions = [
      { key: "all", label: "\u5168\u90E8" },
      { key: "today", label: "\u4ECA\u5929" },
      { key: "week", label: "\u8FD17\u5929" },
      { key: "month", label: "\u8FD130\u5929" }
    ];
    const matchesDateFilter = (createTime) => {
      if (filterDatePreset.value === "all")
        return true;
      if (!createTime)
        return true;
      const t = new Date(createTime).getTime();
      if (Number.isNaN(t))
        return true;
      const now = Date.now();
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      if (filterDatePreset.value === "today")
        return t >= startOfToday.getTime();
      if (filterDatePreset.value === "week")
        return now - t <= 7 * 24 * 60 * 60 * 1e3;
      if (filterDatePreset.value === "month")
        return now - t <= 30 * 24 * 60 * 60 * 1e3;
      return true;
    };
    const filteredHistory = common_vendor.computed(() => {
      let list = allHistory.value;
      const kw = searchKeyword.value.trim().toLowerCase();
      if (kw) {
        list = list.filter((r) => {
          const name = (r.routeName || r.title || "").toLowerCase();
          return name.includes(kw);
        });
      }
      if (filterDest.value) {
        list = list.filter((r) => (r.destination || "") === filterDest.value);
      }
      list = list.filter((r) => matchesDateFilter(r.createTime));
      return list;
    });
    const filterActiveHint = common_vendor.computed(
      () => !!(filterDest.value || filterDatePreset.value !== "all")
    );
    const destinationPickerRange = common_vendor.computed(() => {
      const set = /* @__PURE__ */ new Set();
      allHistory.value.forEach((r) => {
        if (r.destination)
          set.add(r.destination);
      });
      return ["\u5168\u90E8", ...Array.from(set).sort()];
    });
    const destPickerIndex = common_vendor.computed(() => {
      const range = destinationPickerRange.value;
      const key = filterDest.value ? filterDest.value : "\u5168\u90E8";
      const idx = range.indexOf(key);
      return idx >= 0 ? idx : 0;
    });
    const onDestPickerChange = (e) => {
      const idx = Number(e.detail.value);
      const range = destinationPickerRange.value;
      const v = range[idx];
      filterDest.value = v === "\u5168\u90E8" ? "" : v;
    };
    const resetFilters = () => {
      searchKeyword.value = "";
      filterDest.value = "";
      filterDatePreset.value = "all";
      currentPage.value = 1;
    };
    const mergeHistory = (serverList, localList) => {
      const safeNum = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };
      const pickMaxCount = (a, b) => Math.max(safeNum(a), safeNum(b));
      const merged = /* @__PURE__ */ new Map();
      [...serverList, ...localList].forEach((raw) => {
        const item = normalizeRoute(raw);
        if (!item.id)
          return;
        const exist = merged.get(item.id);
        if (!exist) {
          merged.set(item.id, item);
          return;
        }
        merged.set(item.id, {
          ...exist,
          ...item,
          routeName: item.routeName || exist.routeName,
          destination: item.destination || exist.destination,
          coverImage: item.coverImage || exist.coverImage,
          summary: item.summary || exist.summary,
          createTime: item.createTime || exist.createTime,
          viewCount: pickMaxCount(exist.viewCount, item.viewCount),
          favoriteCount: pickMaxCount(exist.favoriteCount, item.favoriteCount),
          useCount: pickMaxCount(exist.useCount, item.useCount)
        });
      });
      return Array.from(merged.values()).sort((a, b) => {
        const at = new Date(a.createTime || "").getTime() || 0;
        const bt = new Date(b.createTime || "").getTime() || 0;
        return bt - at;
      });
    };
    const totalPages = common_vendor.computed(() => {
      const n = filteredHistory.value.length;
      if (n === 0)
        return 1;
      return Math.ceil(n / pageSize);
    });
    const pagedHistory = common_vendor.computed(() => {
      const list = filteredHistory.value;
      const start = (currentPage.value - 1) * pageSize;
      return list.slice(start, start + pageSize);
    });
    const visiblePages = common_vendor.computed(() => {
      const total = totalPages.value;
      if (total <= 5) {
        return Array.from({ length: total }, (_, i) => i + 1);
      }
      let start = Math.max(1, currentPage.value - 2);
      let end = Math.min(total, start + 4);
      if (end - start < 4) {
        start = Math.max(1, end - 4);
      }
      const pages = [];
      for (let i = start; i <= end; i++)
        pages.push(i);
      return pages;
    });
    common_vendor.watch([searchKeyword, filterDest, filterDatePreset], () => {
      currentPage.value = 1;
    });
    common_vendor.watch(
      () => [filteredHistory.value.length, totalPages.value],
      () => {
        if (currentPage.value > totalPages.value) {
          currentPage.value = Math.max(1, totalPages.value);
        }
      }
    );
    const loadHistory = async (reset = false) => {
      var _a, _b, _c;
      if (!((_a = user.value) == null ? void 0 : _a.id)) {
        allHistory.value = [];
        currentPage.value = 1;
        return;
      }
      if (loading.value)
        return;
      loading.value = true;
      try {
        const local = common_vendor.index.getStorageSync(`plan_history_${user.value.id}`) || [];
        let serverList = [];
        const res = await api_route.routeApi.listMyRoutes(user.value.id);
        if ((res == null ? void 0 : res.statusCode) === 200 && ((_b = res == null ? void 0 : res.data) == null ? void 0 : _b.code) === 200) {
          serverList = Array.isArray(res.data.data) ? res.data.data : ((_c = res.data.data) == null ? void 0 : _c.list) || [];
        }
        allHistory.value = mergeHistory(serverList, local);
        if (reset)
          currentPage.value = 1;
      } catch (e) {
        const local = common_vendor.index.getStorageSync(`plan_history_${user.value.id}`) || [];
        allHistory.value = mergeHistory([], local);
        if (reset)
          currentPage.value = 1;
      } finally {
        loading.value = false;
        refreshing.value = false;
      }
    };
    const onRefresh = () => {
      refreshing.value = true;
      loadHistory(true);
    };
    const prevPage = () => {
      if (currentPage.value > 1)
        currentPage.value -= 1;
    };
    const nextPage = () => {
      if (currentPage.value < totalPages.value)
        currentPage.value += 1;
    };
    const goPage = (page) => {
      if (page < 1 || page > totalPages.value)
        return;
      currentPage.value = page;
    };
    const viewDetail = (item) => {
      if (!item.id)
        return;
      common_vendor.index.navigateTo({
        url: `/pages/itinerary/itinerary-detail?id=${encodeURIComponent(item.id)}`,
        success: () => {
          setTimeout(() => {
            var _a;
            item.viewCount = Number(item.viewCount || 0) + 1;
            try {
              const userId = (_a = user.value) == null ? void 0 : _a.id;
              if (userId) {
                const storageKey = `plan_history_${userId}`;
                const history = common_vendor.index.getStorageSync(storageKey) || [];
                const next = history.map((it) => {
                  if (Number(it == null ? void 0 : it.id) !== Number(item.id))
                    return it;
                  return { ...it, viewCount: Number((it == null ? void 0 : it.viewCount) || 0) + 1 };
                });
                common_vendor.index.setStorageSync(storageKey, next);
              }
            } catch {
            }
            api_route.routeApi.recordView(Number(item.id)).catch(() => {
            });
          }, 0);
        }
      });
    };
    const openEdit = (item) => {
      editRouteId.value = Number(item.id);
      editName.value = (item.routeName || item.title || "").trim();
      editPopupVisible.value = true;
    };
    const submitEdit = async () => {
      var _a;
      const rid = editRouteId.value;
      const name = editName.value.trim();
      if (!rid)
        return;
      if (!name) {
        common_vendor.index.showToast({ title: "\u8BF7\u8F93\u5165\u540D\u79F0", icon: "none" });
        return;
      }
      try {
        await api_route.routeApi.updateName(rid, name);
      } catch (e) {
      }
      const userId = (_a = user.value) == null ? void 0 : _a.id;
      if (userId) {
        const storageKey = `plan_history_${userId}`;
        const history = common_vendor.index.getStorageSync(storageKey) || [];
        const next = history.map((it) => {
          if (Number(it == null ? void 0 : it.id) !== Number(rid))
            return it;
          return { ...it, routeName: name, title: name };
        });
        common_vendor.index.setStorageSync(storageKey, next);
      }
      allHistory.value = allHistory.value.map((r) => r.id === rid ? { ...r, routeName: name, title: name } : r);
      editPopupVisible.value = false;
      common_vendor.index.showToast({ title: "\u5DF2\u4FDD\u5B58", icon: "success" });
    };
    const confirmDelete = (item) => {
      const rid = Number(item.id);
      if (!rid)
        return;
      common_vendor.index.showModal({
        title: "\u5220\u9664\u8DEF\u7EBF",
        content: "\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u6761\u8DEF\u7EBF\u5417\uFF1F\u5220\u9664\u540E\u4E0D\u53EF\u6062\u590D\u3002",
        confirmText: "\u5220\u9664",
        cancelText: "\u53D6\u6D88",
        success: async (res) => {
          var _a;
          if (!res.confirm)
            return;
          try {
            await api_route.routeApi.discard(rid);
          } catch (e) {
          }
          const userId = (_a = user.value) == null ? void 0 : _a.id;
          if (userId) {
            const storageKey = `plan_history_${userId}`;
            const history = common_vendor.index.getStorageSync(storageKey) || [];
            common_vendor.index.setStorageSync(storageKey, history.filter((it) => Number(it == null ? void 0 : it.id) !== Number(rid)));
          }
          allHistory.value = allHistory.value.filter((r) => r.id !== rid);
          common_vendor.index.showToast({ title: "\u5DF2\u5220\u9664", icon: "success" });
        }
      });
    };
    const goToPlan = () => {
      utils_router.safeSwitchTab("/pages/route/plan").catch(() => {
      });
    };
    common_vendor.onMounted(() => {
      loadHistory(true);
    });
    common_vendor.onShow(() => {
      loadHistory(true);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: loading.value && allHistory.value.length === 0
      }, loading.value && allHistory.value.length === 0 ? {
        b: common_vendor.f(4, (i, k0, i0) => {
          return {
            a: i
          };
        })
      } : !loading.value && allHistory.value.length === 0 ? {
        d: common_vendor.o(goToPlan)
      } : common_vendor.e({
        e: common_vendor.t(common_vendor.unref(filteredHistory).length),
        f: common_vendor.t(currentPage.value),
        g: common_vendor.t(common_vendor.unref(totalPages)),
        h: common_vendor.unref(filteredHistory).length === 0 && allHistory.value.length > 0
      }, common_vendor.unref(filteredHistory).length === 0 && allHistory.value.length > 0 ? {
        i: common_vendor.o(resetFilters)
      } : {}, {
        j: common_vendor.f(common_vendor.unref(pagedHistory), (route, k0, i0) => {
          return common_vendor.e({
            a: route.coverImage || defaultCover,
            b: common_vendor.t(route.days || 0),
            c: common_vendor.t(route.routeName || route.title || "\u672A\u547D\u540D\u8DEF\u7EBF"),
            d: common_vendor.t(formatTime(route.createTime)),
            e: common_vendor.o(($event) => openEdit(route)),
            f: common_vendor.o(($event) => confirmDelete(route)),
            g: route.summary
          }, route.summary ? {
            h: common_vendor.t(route.summary)
          } : {}, {
            i: common_vendor.t(route.destination || "\u672A\u77E5\u76EE\u7684\u5730"),
            j: common_vendor.t(formatCount(route.favoriteCount)),
            k: common_vendor.t(formatCount(route.viewCount)),
            l: route.id,
            m: common_vendor.o(($event) => viewDetail(route))
          });
        }),
        k: common_vendor.o(() => {
        })
      }), {
        c: !loading.value && allHistory.value.length === 0,
        l: refreshing.value,
        m: common_vendor.o(onRefresh),
        n: !loading.value || allHistory.value.length > 0
      }, !loading.value || allHistory.value.length > 0 ? common_vendor.e({
        o: searchKeyword.value,
        p: common_vendor.o(($event) => searchKeyword.value = $event.detail.value),
        q: searchKeyword.value
      }, searchKeyword.value ? {
        r: common_vendor.o(($event) => searchKeyword.value = "")
      } : {}, {
        s: common_vendor.unref(filterActiveHint)
      }, common_vendor.unref(filterActiveHint) ? {} : {}, {
        t: common_vendor.o(($event) => filterPopupVisible.value = true),
        v: common_vendor.unref(filteredHistory).length > 0
      }, common_vendor.unref(filteredHistory).length > 0 ? {
        w: currentPage.value === 1 ? 1 : "",
        x: common_vendor.o(prevPage),
        y: common_vendor.f(common_vendor.unref(visiblePages), (page, k0, i0) => {
          return {
            a: common_vendor.t(page),
            b: page,
            c: currentPage.value === page ? 1 : "",
            d: common_vendor.o(($event) => goPage(page))
          };
        }),
        z: currentPage.value === common_vendor.unref(totalPages) ? 1 : "",
        A: common_vendor.o(nextPage)
      } : {}) : {}, {
        B: filterPopupVisible.value
      }, filterPopupVisible.value ? {
        C: common_vendor.t(filterDest.value || "\u5168\u90E8"),
        D: common_vendor.unref(destinationPickerRange),
        E: common_vendor.unref(destPickerIndex),
        F: common_vendor.o(onDestPickerChange),
        G: common_vendor.f(datePresetOptions, (p, k0, i0) => {
          return {
            a: common_vendor.t(p.label),
            b: p.key,
            c: filterDatePreset.value === p.key ? 1 : "",
            d: common_vendor.o(($event) => filterDatePreset.value = p.key)
          };
        }),
        H: common_vendor.o(resetFilters),
        I: common_vendor.o(($event) => filterPopupVisible.value = false),
        J: common_vendor.o(() => {
        }),
        K: common_vendor.o(($event) => filterPopupVisible.value = false)
      } : {}, {
        L: editPopupVisible.value
      }, editPopupVisible.value ? {
        M: editName.value,
        N: common_vendor.o(($event) => editName.value = $event.detail.value),
        O: common_vendor.o(($event) => editPopupVisible.value = false),
        P: common_vendor.o(submitEdit),
        Q: common_vendor.o(() => {
        }),
        R: common_vendor.o(($event) => editPopupVisible.value = false)
      } : {});
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ab48eb4c"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/profile/history.vue"]]);
wx.createPage(MiniProgramPage);
