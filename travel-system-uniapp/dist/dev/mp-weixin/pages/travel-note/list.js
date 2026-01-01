"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var utils_router = require("../../utils/router.js");
var store_user = require("../../store/user.js");
require("../../utils/http.js");
require("../../utils/storage.js");
require("../../utils/config.js");
if (!Math) {
  (common_vendor.unref(common_vendor.Search) + common_vendor.unref(common_vendor.CloseSmall))();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const cityList = common_vendor.ref([
      { id: null, name: "\u5168\u90E8\u57CE\u5E02" }
    ]);
    const selectedCity = common_vendor.ref(null);
    const sortBy = common_vendor.ref("hot");
    const noteList = common_vendor.ref([]);
    const allNoteList = common_vendor.ref([]);
    const pageNum = common_vendor.ref(1);
    const pageSize = common_vendor.ref(10);
    const loading = common_vendor.ref(false);
    const noMore = common_vendor.ref(false);
    const searchKeyword = common_vendor.ref("");
    const shouldAnimateMap = common_vendor.ref({});
    const onCityChange = (e) => {
      selectedCity.value = cityList.value[e.detail.value];
      pageNum.value = 1;
      noteList.value = [];
      allNoteList.value = [];
      noMore.value = false;
      searchKeyword.value = "";
      loadNotes();
    };
    const changeSort = (sort) => {
      sortBy.value = sort;
      pageNum.value = 1;
      noteList.value = [];
      allNoteList.value = [];
      noMore.value = false;
      searchKeyword.value = "";
      loadNotes();
    };
    const loadNotes = async () => {
      var _a;
      if (loading.value || noMore.value)
        return;
      loading.value = true;
      try {
        const params = {
          pageNum: pageNum.value,
          pageSize: pageSize.value,
          sortBy: sortBy.value
        };
        if (((_a = selectedCity.value) == null ? void 0 : _a.id) != null) {
          params.cityId = selectedCity.value.id;
        }
        const res = await api_content.travelNoteApi.list(params);
        const response = res.data;
        if (res.statusCode === 200 && response.code === 200) {
          const data = response.data;
          if (data.list && data.list.length > 0) {
            const newNotes = data.list.map((item) => ({
              ...item,
              isLiked: item.isLiked || false,
              commentCount: item.commentCount !== void 0 ? item.commentCount : item.comment_count || 0
            }));
            noteList.value.push(...newNotes);
            allNoteList.value.push(...newNotes);
            if (data.list.length < pageSize.value) {
              noMore.value = true;
            } else {
              pageNum.value++;
            }
          } else {
            noMore.value = true;
          }
        }
      } catch (error) {
        common_vendor.index.showToast({
          title: "\u52A0\u8F7D\u5931\u8D25",
          icon: "none"
        });
      } finally {
        loading.value = false;
      }
    };
    const handleSearch = () => {
      if (!searchKeyword.value.trim()) {
        noteList.value = [...allNoteList.value];
        return;
      }
      const keyword = searchKeyword.value.toLowerCase().trim();
      const filtered = allNoteList.value.filter((note) => {
        var _a, _b, _c;
        const titleMatch = (_a = note.title) == null ? void 0 : _a.toLowerCase().includes(keyword);
        const contentMatch = (_b = note.content) == null ? void 0 : _b.toLowerCase().includes(keyword);
        const authorMatch = (_c = note.authorName) == null ? void 0 : _c.toLowerCase().includes(keyword);
        return titleMatch || contentMatch || authorMatch;
      });
      noteList.value = filtered;
    };
    const onSearchInput = () => {
      handleSearch();
    };
    const clearSearch = () => {
      searchKeyword.value = "";
      noteList.value = [...allNoteList.value];
    };
    const publishNote = () => {
      utils_router.safeNavigateTo("/pages/travel-note/publish");
    };
    const loadMore = () => {
      loadNotes();
    };
    const viewDetail = (id) => {
      utils_router.safeNavigateTo(`/pages/travel-note/detail?id=${id}`);
    };
    const toggleLike = async (note) => {
      if (!user.value) {
        common_vendor.index.showModal({
          title: "\u9700\u8981\u767B\u5F55",
          content: "\u8BF7\u5148\u767B\u5F55",
          confirmText: "\u53BB\u767B\u5F55",
          cancelText: "\u53D6\u6D88",
          success: (res) => {
            if (res.confirm) {
              utils_router.safeNavigateTo("/pages/profile/profile");
            }
          }
        });
        return;
      }
      try {
        const wasLiked = note.isLiked;
        note.isLiked = !wasLiked;
        if (!wasLiked) {
          shouldAnimateMap.value[note.id] = true;
          setTimeout(() => {
            shouldAnimateMap.value[note.id] = false;
          }, 300);
        }
        const res = await api_content.travelNoteInteractionApi.toggleLike(user.value.id, note.id);
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          note.isLiked = data.data.isLiked;
          if (data.data.likeCount !== void 0) {
            note.likeCount = data.data.likeCount;
          } else {
            note.likeCount = note.isLiked ? (note.likeCount || 0) + 1 : Math.max(0, (note.likeCount || 0) - 1);
          }
        } else {
          note.isLiked = wasLiked;
          note.likeCount = wasLiked ? (note.likeCount || 0) + 1 : Math.max(0, (note.likeCount || 0) - 1);
          common_vendor.index.showToast({
            title: data.msg || "\u64CD\u4F5C\u5931\u8D25",
            icon: "none"
          });
        }
      } catch (error) {
        note.isLiked = !note.isLiked;
        note.likeCount = note.isLiked ? (note.likeCount || 0) + 1 : Math.max(0, (note.likeCount || 0) - 1);
        common_vendor.index.showToast({
          title: (error == null ? void 0 : error.message) || "\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC",
          icon: "none"
        });
      }
    };
    const handleComment = (note) => {
      utils_router.safeNavigateTo(`/pages/travel-note/detail?id=${note.id}&tab=comment`);
    };
    const loadCities = async () => {
      try {
        const res = await api_content.cityApi.list();
        const response = res.data;
        if (res.statusCode === 200 && response.code === 200) {
          const cities = response.data || [];
          cityList.value = [
            { id: null, name: "\u5168\u90E8\u57CE\u5E02" },
            ...cities.map((city) => ({
              id: city.id,
              name: city.cityName || city.name
            }))
          ];
        }
      } catch (error) {
      }
    };
    common_vendor.onMounted(() => {
      loadCities().then(() => {
        selectedCity.value = cityList.value[0];
        loadNotes();
      });
    });
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: common_vendor.p({
          theme: "outline",
          size: "24",
          fill: "#9EA7B0"
        }),
        b: common_vendor.o(handleSearch),
        c: common_vendor.o([($event) => searchKeyword.value = $event.detail.value, onSearchInput]),
        d: searchKeyword.value,
        e: searchKeyword.value
      }, searchKeyword.value ? {
        f: common_vendor.o(clearSearch),
        g: common_vendor.p({
          theme: "outline",
          size: "20",
          fill: "#9EA7B0"
        })
      } : {}, {
        h: common_vendor.p({
          theme: "outline",
          size: "28",
          fill: "#2FA66A"
        }),
        i: common_vendor.o(handleSearch),
        j: common_vendor.t(((_a = selectedCity.value) == null ? void 0 : _a.name) || "\u5168\u90E8\u57CE\u5E02"),
        k: cityList.value,
        l: common_vendor.o(onCityChange),
        m: sortBy.value === "hot" ? 1 : "",
        n: common_vendor.o(($event) => changeSort("hot")),
        o: sortBy.value === "time" ? 1 : "",
        p: common_vendor.o(($event) => changeSort("time")),
        q: common_vendor.f(noteList.value, (note, k0, i0) => {
          return common_vendor.e({
            a: note.coverImage
          }, note.coverImage ? {
            b: note.coverImage
          } : {}, {
            c: note.authorAvatar || "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200",
            d: common_vendor.t(note.title),
            e: common_vendor.t(note.authorName || "\u533F\u540D\u7528\u6237"),
            f: common_vendor.n({
              "icon-liked": note.isLiked
            }),
            g: note.isLiked && shouldAnimateMap.value[note.id] ? 1 : "",
            h: common_vendor.t(note.likeCount || 0),
            i: note.isLiked ? 1 : "",
            j: common_vendor.o(($event) => toggleLike(note)),
            k: common_vendor.t(note.commentCount || 0),
            l: common_vendor.o(($event) => handleComment(note)),
            m: note.id,
            n: common_vendor.o(($event) => viewDetail(note.id))
          });
        }),
        r: loading.value
      }, loading.value ? {} : {}, {
        s: noMore.value && noteList.value.length > 0
      }, noMore.value && noteList.value.length > 0 ? {} : {}, {
        t: !loading.value && noteList.value.length === 0
      }, !loading.value && noteList.value.length === 0 ? {
        v: common_vendor.t(searchKeyword.value ? "\u672A\u627E\u5230\u76F8\u5173\u6E38\u8BB0" : "\u6682\u65E0\u6E38\u8BB0")
      } : {}, {
        w: common_vendor.o(loadMore),
        x: common_vendor.o(publishNote)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-7cadc62c"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/travel-note/list.vue"]]);
wx.createPage(MiniProgramPage);
