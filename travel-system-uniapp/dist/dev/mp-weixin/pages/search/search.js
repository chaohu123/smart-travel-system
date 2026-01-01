"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var utils_storage = require("../../utils/storage.js");
require("../../utils/http.js");
require("../../utils/config.js");
if (!Array) {
  const _component_Search = common_vendor.resolveComponent("Search");
  const _component_CloseSmall = common_vendor.resolveComponent("CloseSmall");
  (_component_Search + _component_CloseSmall)();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const keyword = common_vendor.ref("");
    const hasSearched = common_vendor.ref(false);
    const loading = common_vendor.ref(false);
    const noMore = common_vendor.ref(false);
    const page = common_vendor.ref(1);
    const pageSize = 10;
    const history = common_vendor.ref(utils_storage.getCache("search_history") || []);
    const tabs = [
      { key: "note", label: "\u6E38\u8BB0" },
      { key: "scenic", label: "\u666F\u70B9" },
      { key: "food", label: "\u7F8E\u98DF" }
    ];
    const activeTab = common_vendor.ref("note");
    const results = common_vendor.ref({
      notes: [],
      scenics: [],
      foods: []
    });
    const onSearch = () => {
      hasSearched.value = true;
      if (!keyword.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u8F93\u5165\u5173\u952E\u8BCD", icon: "none" });
        return;
      }
      page.value = 1;
      noMore.value = false;
      saveHistory(keyword.value);
      fetchData();
    };
    const clearKeyword = () => {
      keyword.value = "";
    };
    const saveHistory = (kw) => {
      const list = [kw, ...history.value.filter((i) => i !== kw)].slice(0, 8);
      history.value = list;
      utils_storage.setCache("search_history", list, 24 * 60);
    };
    const clearHistory = () => {
      history.value = [];
      utils_storage.setCache("search_history", []);
    };
    const useHistory = (kw) => {
      keyword.value = kw;
      onSearch();
    };
    const fetchData = async () => {
      var _a, _b, _c;
      loading.value = true;
      try {
        const [noteRes, scenicRes, foodRes] = await Promise.all([
          api_content.travelNoteApi.list({ pageNum: page.value, pageSize }),
          api_content.scenicSpotApi.list({ pageNum: page.value, pageSize }),
          api_content.foodApi.list({ pageNum: page.value, pageSize })
        ]);
        if (noteRes.statusCode === 200 && noteRes.data.code === 200) {
          const rows = ((_a = noteRes.data.data) == null ? void 0 : _a.rows) || noteRes.data.data || [];
          const filtered = rows.filter((n) => {
            var _a2;
            return (_a2 = n.title) == null ? void 0 : _a2.includes(keyword.value);
          });
          results.value.notes = page.value === 1 ? filtered : results.value.notes.concat(filtered);
          if (filtered.length < pageSize)
            noMore.value = true;
        }
        if (scenicRes.statusCode === 200 && scenicRes.data.code === 200) {
          const rows = ((_b = scenicRes.data.data) == null ? void 0 : _b.rows) || scenicRes.data.data || [];
          const filtered = rows.filter((n) => {
            var _a2;
            return (_a2 = n.name) == null ? void 0 : _a2.includes(keyword.value);
          });
          results.value.scenics = page.value === 1 ? filtered : results.value.scenics.concat(filtered);
        }
        if (foodRes.statusCode === 200 && foodRes.data.code === 200) {
          const rows = ((_c = foodRes.data.data) == null ? void 0 : _c.rows) || foodRes.data.data || [];
          const filtered = rows.filter((n) => {
            var _a2;
            return (_a2 = n.name) == null ? void 0 : _a2.includes(keyword.value);
          });
          results.value.foods = page.value === 1 ? filtered : results.value.foods.concat(filtered);
        }
      } finally {
        loading.value = false;
      }
    };
    const loadMore = () => {
      if (loading.value || noMore.value || !hasSearched.value)
        return;
      page.value += 1;
      fetchData();
    };
    const openNote = (item) => {
      common_vendor.index.navigateTo({ url: `/pages/travel-note/detail?id=${item.id}` });
    };
    const openScenic = (item) => {
      common_vendor.index.navigateTo({ url: `/pages/scenic/detail?id=${item.id}` });
    };
    const openFood = (item) => {
      common_vendor.index.navigateTo({ url: `/pages/food/detail?id=${item.id}` });
    };
    common_vendor.onMounted(() => {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options || {};
      if (options.keyword) {
        keyword.value = decodeURIComponent(options.keyword);
        onSearch();
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          theme: "outline",
          size: "26",
          fill: "#5f6c7b"
        }),
        b: common_vendor.o(onSearch),
        c: keyword.value,
        d: common_vendor.o(($event) => keyword.value = $event.detail.value),
        e: keyword.value
      }, keyword.value ? {
        f: common_vendor.o(clearKeyword),
        g: common_vendor.p({
          theme: "outline",
          size: "22",
          fill: "#a0a8b4"
        })
      } : {}, {
        h: common_vendor.o(onSearch),
        i: history.value.length
      }, history.value.length ? {
        j: common_vendor.o(clearHistory),
        k: common_vendor.f(history.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item),
            b: item,
            c: common_vendor.o(($event) => useHistory(item))
          };
        })
      } : {}, {
        l: common_vendor.f(tabs, (tab, k0, i0) => {
          return {
            a: common_vendor.t(tab.label),
            b: tab.key,
            c: activeTab.value === tab.key ? 1 : "",
            d: common_vendor.o(($event) => activeTab.value = tab.key)
          };
        }),
        m: !hasSearched.value
      }, !hasSearched.value ? {} : common_vendor.e({
        n: activeTab.value === "note"
      }, activeTab.value === "note" ? {
        o: common_vendor.f(results.value.notes, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.title),
            b: common_vendor.t(item.cityName || "\u70ED\u95E8\u57CE\u5E02"),
            c: item.id,
            d: common_vendor.o(($event) => openNote(item))
          };
        })
      } : activeTab.value === "scenic" ? {
        q: common_vendor.f(results.value.scenics, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.name),
            b: common_vendor.t(item.address || item.intro),
            c: item.id,
            d: common_vendor.o(($event) => openScenic(item))
          };
        })
      } : {
        r: common_vendor.f(results.value.foods, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.name),
            b: common_vendor.t(item.foodType || item.address),
            c: item.id,
            d: common_vendor.o(($event) => openFood(item))
          };
        })
      }, {
        p: activeTab.value === "scenic",
        s: loading.value
      }, loading.value ? {} : noMore.value && hasSearched.value ? {} : {}, {
        t: noMore.value && hasSearched.value
      }), {
        v: common_vendor.o(loadMore)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6a3cceca"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/search/search.vue"]]);
wx.createPage(MiniProgramPage);
