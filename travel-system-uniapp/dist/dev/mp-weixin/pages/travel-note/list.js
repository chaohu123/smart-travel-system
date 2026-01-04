"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var utils_router = require("../../utils/router.js");
var store_user = require("../../store/user.js");
var utils_image = require("../../utils/image.js");
require("../../utils/http.js");
require("../../utils/storage.js");
require("../../utils/config.js");
if (!Math) {
  (common_vendor.unref(common_vendor.CloseSmall) + SkeletonCards)();
}
const SkeletonCards = () => "../../components/SkeletonCards.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const cityList = common_vendor.ref([
      { id: null, name: "\u5168\u90E8\u57CE\u5E02", province: null }
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
    const networkError = common_vendor.ref(false);
    const shouldAnimateMap = common_vendor.ref({});
    const imageLoadedMap = common_vendor.ref({});
    const fabExpanded = common_vendor.ref(false);
    const showFilterPanel = common_vendor.ref(false);
    const selectedProvince = common_vendor.ref(null);
    const selectedFilterCity = common_vendor.ref(null);
    const provinceList = common_vendor.ref([]);
    const filteredCityList = common_vendor.ref([]);
    const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iI0U1RTVFNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5RUE3QjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==";
    const defaultAvatar = "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200";
    const scrollTop = common_vendor.ref(0);
    const onCityChange = (e) => {
      selectedCity.value = cityList.value[e.detail.value];
      pageNum.value = 1;
      noteList.value = [];
      allNoteList.value = [];
      noMore.value = false;
      searchKeyword.value = "";
      networkError.value = false;
      loadNotes();
    };
    const changeSort = (sort) => {
      sortBy.value = sort;
      pageNum.value = 1;
      noteList.value = [];
      allNoteList.value = [];
      noMore.value = false;
      searchKeyword.value = "";
      networkError.value = false;
      loadNotes();
    };
    const loadNotes = async () => {
      var _a;
      if (loading.value || noMore.value)
        return;
      loading.value = true;
      networkError.value = false;
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
              isFavorite: item.isFavorite || false,
              commentCount: item.commentCount !== void 0 ? item.commentCount : item.comment_count || 0,
              favoriteCount: item.favoriteCount !== void 0 ? item.favoriteCount : item.favorite_count || 0
            }));
            noteList.value.push(...newNotes);
            allNoteList.value.push(...newNotes);
            newNotes.forEach((note, index) => {
              if (note.coverImage) {
                if (index < 6) {
                  imageLoadedMap.value[note.id] = true;
                } else {
                  imageLoadedMap.value[note.id] = false;
                }
              }
            });
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
        networkError.value = true;
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
    const loadMore = () => {
      if (!searchKeyword.value.trim() && !loading.value && !noMore.value) {
        loadNotes();
      }
    };
    let scrollTimer = null;
    const onScroll = (e) => {
      scrollTop.value = e.detail.scrollTop;
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
      scrollTimer = setTimeout(() => {
        checkLazyLoad();
      }, 200);
    };
    const checkLazyLoad = () => {
      const visibleCount = 10;
      noteList.value.slice(0, visibleCount).forEach((note) => {
        if (!imageLoadedMap.value[note.id] && note.coverImage) {
          imageLoadedMap.value[note.id] = true;
        }
      });
    };
    const onImageLoad = (noteId) => {
      imageLoadedMap.value[noteId] = true;
    };
    const onImageError = (noteId) => {
      imageLoadedMap.value[noteId] = false;
    };
    const getNoteTag = (note) => {
      if (sortBy.value === "hot" && (note.likeCount || 0) > 50) {
        return "\u70ED";
      }
      if (sortBy.value === "time") {
        const date = new Date(note.createTime);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
        if (days <= 1) {
          return "\u65B0";
        }
      }
      return null;
    };
    let lastClickTime = 0;
    const CLICK_DEBOUNCE_TIME = 300;
    const viewDetail = (id) => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
        return;
      }
      lastClickTime = now;
      utils_router.safeNavigateTo(`/pages/travel-note/detail?id=${id}`);
    };
    const viewAuthorProfile = (userId) => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
        return;
      }
      lastClickTime = now;
      if (userId) {
        utils_router.safeNavigateTo(`/pages/profile/user-home?userId=${userId}`);
      }
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
    const toggleFavorite = async (note) => {
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
        const wasFavorite = note.isFavorite;
        note.isFavorite = !wasFavorite;
        const res = await api_content.travelNoteInteractionApi.toggleFavorite(user.value.id, note.id);
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          note.isFavorite = data.data.isFavorite;
          if (data.data.favoriteCount !== void 0) {
            note.favoriteCount = data.data.favoriteCount;
          } else {
            note.favoriteCount = note.isFavorite ? (note.favoriteCount || 0) + 1 : Math.max(0, (note.favoriteCount || 0) - 1);
          }
        } else {
          note.isFavorite = wasFavorite;
          note.favoriteCount = wasFavorite ? (note.favoriteCount || 0) + 1 : Math.max(0, (note.favoriteCount || 0) - 1);
          common_vendor.index.showToast({
            title: data.msg || "\u64CD\u4F5C\u5931\u8D25",
            icon: "none"
          });
        }
      } catch (error) {
        note.isFavorite = !note.isFavorite;
        note.favoriteCount = note.isFavorite ? (note.favoriteCount || 0) + 1 : Math.max(0, (note.favoriteCount || 0) - 1);
        common_vendor.index.showToast({
          title: (error == null ? void 0 : error.message) || "\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC",
          icon: "none"
        });
      }
    };
    const handleComment = (note) => {
      utils_router.safeNavigateTo(`/pages/travel-note/detail?id=${note.id}&tab=comment`);
    };
    const formatTime = (time) => {
      if (!time)
        return "";
      const date = new Date(time);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
      if (days === 0)
        return "\u4ECA\u5929";
      if (days === 1)
        return "\u6628\u5929";
      if (days < 7)
        return `${days}\u5929\u524D`;
      return `${date.getMonth() + 1}-${date.getDate()}`;
    };
    const loadCities = async () => {
      try {
        const res = await api_content.cityApi.list();
        const response = res.data;
        if (res.statusCode === 200 && response.code === 200) {
          const cities = response.data || [];
          const cityData = cities.map((city) => ({
            id: city.id,
            name: city.cityName || city.name,
            province: city.province || city.provinceName || extractProvince(city.cityName || city.name)
          }));
          cityList.value = [
            { id: null, name: "\u5168\u90E8\u57CE\u5E02", province: null },
            ...cityData
          ];
          const provinces = /* @__PURE__ */ new Set();
          cityData.forEach((city) => {
            if (city.province) {
              provinces.add(city.province);
            }
          });
          provinceList.value = Array.from(provinces).sort();
          filteredCityList.value = [...cityList.value];
        }
      } catch (error) {
      }
    };
    const extractProvince = (cityName) => {
      const provinceMap = {
        "\u5317\u4EAC": "\u5317\u4EAC",
        "\u4E0A\u6D77": "\u4E0A\u6D77",
        "\u5929\u6D25": "\u5929\u6D25",
        "\u91CD\u5E86": "\u91CD\u5E86",
        "\u6210\u90FD": "\u56DB\u5DDD",
        "\u897F\u5B89": "\u9655\u897F",
        "\u676D\u5DDE": "\u6D59\u6C5F",
        "\u53A6\u95E8": "\u798F\u5EFA",
        "\u5E7F\u5DDE": "\u5E7F\u4E1C",
        "\u6DF1\u5733": "\u5E7F\u4E1C",
        "\u5357\u4EAC": "\u6C5F\u82CF",
        "\u82CF\u5DDE": "\u6C5F\u82CF",
        "\u6B66\u6C49": "\u6E56\u5317",
        "\u957F\u6C99": "\u6E56\u5357",
        "\u90D1\u5DDE": "\u6CB3\u5357",
        "\u6D4E\u5357": "\u5C71\u4E1C",
        "\u9752\u5C9B": "\u5C71\u4E1C",
        "\u5927\u8FDE": "\u8FBD\u5B81",
        "\u6C88\u9633": "\u8FBD\u5B81",
        "\u54C8\u5C14\u6EE8": "\u9ED1\u9F99\u6C5F",
        "\u957F\u6625": "\u5409\u6797",
        "\u77F3\u5BB6\u5E84": "\u6CB3\u5317",
        "\u592A\u539F": "\u5C71\u897F",
        "\u5408\u80A5": "\u5B89\u5FBD",
        "\u5357\u660C": "\u6C5F\u897F",
        "\u798F\u5DDE": "\u798F\u5EFA",
        "\u5357\u5B81": "\u5E7F\u897F",
        "\u6D77\u53E3": "\u6D77\u5357",
        "\u6606\u660E": "\u4E91\u5357",
        "\u8D35\u9633": "\u8D35\u5DDE",
        "\u62C9\u8428": "\u897F\u85CF",
        "\u5170\u5DDE": "\u7518\u8083",
        "\u897F\u5B81": "\u9752\u6D77",
        "\u94F6\u5DDD": "\u5B81\u590F",
        "\u4E4C\u9C81\u6728\u9F50": "\u65B0\u7586",
        "\u547C\u548C\u6D69\u7279": "\u5185\u8499\u53E4"
      };
      for (const [city, province] of Object.entries(provinceMap)) {
        if (cityName.includes(city)) {
          return province;
        }
      }
      return null;
    };
    const selectProvince = (province) => {
      selectedProvince.value = province;
      if (province) {
        filteredCityList.value = cityList.value.filter(
          (city) => city.province === province || city.id === null
        );
      } else {
        filteredCityList.value = cityList.value;
      }
      if (selectedFilterCity.value !== null) {
        const exists = filteredCityList.value.some((city) => city.id === selectedFilterCity.value);
        if (!exists) {
          selectedFilterCity.value = null;
        }
      }
    };
    const selectFilterCity = (cityId) => {
      selectedFilterCity.value = cityId;
    };
    const resetFilter = () => {
      selectedProvince.value = null;
      selectedFilterCity.value = null;
      filteredCityList.value = cityList.value;
    };
    const applyFilter = () => {
      showFilterPanel.value = false;
      if (selectedFilterCity.value !== null) {
        const city = cityList.value.find((c) => c.id === selectedFilterCity.value);
        if (city) {
          selectedCity.value = city;
        }
      } else {
        selectedCity.value = cityList.value[0];
      }
      pageNum.value = 1;
      noteList.value = [];
      allNoteList.value = [];
      noMore.value = false;
      searchKeyword.value = "";
      networkError.value = false;
      loadNotes();
    };
    const hasActiveFilter = common_vendor.computed(() => {
      return selectedProvince.value !== null || selectedFilterCity.value !== null;
    });
    const toggleFab = () => {
      fabExpanded.value = !fabExpanded.value;
    };
    const handleFabAction = (action) => {
      fabExpanded.value = false;
      if (action === "publish") {
        publishNote();
      } else if (action === "image") {
        publishNote();
      }
    };
    const publishNote = () => {
      utils_router.safeNavigateTo("/pages/travel-note/publish");
    };
    const retryLoad = () => {
      networkError.value = false;
      pageNum.value = 1;
      noteList.value = [];
      allNoteList.value = [];
      noMore.value = false;
      loadNotes();
    };
    common_vendor.onLoad(() => {
      loadCities().then(() => {
        selectedCity.value = cityList.value[0];
        loadNotes();
      });
    });
    common_vendor.onMounted(() => {
      if (noteList.value.length === 0 && !loading.value) {
        loadCities().then(() => {
          selectedCity.value = cityList.value[0];
          loadNotes();
        });
      }
    });
    common_vendor.onUnmounted(() => {
      fabExpanded.value = false;
      if (scrollTimer) {
        clearTimeout(scrollTimer);
        scrollTimer = null;
      }
    });
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: common_vendor.t(((_a = selectedCity.value) == null ? void 0 : _a.name) || "\u5168\u90E8\u57CE\u5E02"),
        b: cityList.value,
        c: common_vendor.o(onCityChange),
        d: common_vendor.o(handleSearch),
        e: common_vendor.o([($event) => searchKeyword.value = $event.detail.value, onSearchInput]),
        f: searchKeyword.value,
        g: searchKeyword.value
      }, searchKeyword.value ? {
        h: common_vendor.o(clearSearch),
        i: common_vendor.p({
          theme: "outline",
          size: "18",
          fill: "#9EA7B0"
        })
      } : {}, {
        j: sortBy.value === "hot" ? 1 : "",
        k: common_vendor.o(($event) => changeSort("hot")),
        l: sortBy.value === "time" ? 1 : "",
        m: common_vendor.o(($event) => changeSort("time")),
        n: common_vendor.unref(hasActiveFilter)
      }, common_vendor.unref(hasActiveFilter) ? {} : {}, {
        o: common_vendor.o(($event) => showFilterPanel.value = true),
        p: showFilterPanel.value
      }, showFilterPanel.value ? {
        q: common_vendor.o(($event) => showFilterPanel.value = false),
        r: selectedProvince.value === null ? 1 : "",
        s: common_vendor.o(($event) => selectProvince(null)),
        t: common_vendor.f(provinceList.value, (province, k0, i0) => {
          return {
            a: common_vendor.t(province),
            b: province,
            c: selectedProvince.value === province ? 1 : "",
            d: common_vendor.o(($event) => selectProvince(province))
          };
        }),
        v: selectedFilterCity.value === null ? 1 : "",
        w: common_vendor.o(($event) => selectFilterCity(null)),
        x: common_vendor.f(filteredCityList.value, (city, k0, i0) => {
          var _a2;
          return {
            a: common_vendor.t(city.name),
            b: (_a2 = city.id) != null ? _a2 : "all",
            c: selectedFilterCity.value === city.id ? 1 : "",
            d: common_vendor.o(($event) => selectFilterCity(city.id))
          };
        }),
        y: common_vendor.o(resetFilter),
        z: common_vendor.o(applyFilter),
        A: common_vendor.o(() => {
        }),
        B: common_vendor.o(($event) => showFilterPanel.value = false)
      } : {}, {
        C: loading.value && noteList.value.length === 0
      }, loading.value && noteList.value.length === 0 ? {
        D: common_vendor.p({
          count: 6
        })
      } : {
        E: common_vendor.f(noteList.value, (note, k0, i0) => {
          return common_vendor.e({
            a: note.coverImage
          }, note.coverImage ? {
            b: imageLoadedMap.value[note.id] ? 1 : "",
            c: common_vendor.unref(utils_image.getImageUrl)(note.coverImage),
            d: common_vendor.o(($event) => onImageLoad(note.id)),
            e: common_vendor.o(($event) => onImageError(note.id))
          } : {}, {
            f: !imageLoadedMap.value[note.id]
          }, !imageLoadedMap.value[note.id] ? {
            g: placeholderImage
          } : {}, {
            h: getNoteTag(note)
          }, getNoteTag(note) ? {
            i: common_vendor.t(getNoteTag(note))
          } : {}, {
            j: note.authorAvatar || defaultAvatar,
            k: common_vendor.o(($event) => viewAuthorProfile(note.userId)),
            l: common_vendor.t(note.authorName || "\u533F\u540D\u7528\u6237"),
            m: common_vendor.t(formatTime(note.createTime)),
            n: common_vendor.t(note.title),
            o: common_vendor.t(note.cityName || "\u672A\u77E5\u5730\u70B9"),
            p: common_vendor.n({
              "icon-liked": note.isLiked
            }),
            q: common_vendor.t(note.likeCount || 0),
            r: note.isLiked ? 1 : "",
            s: common_vendor.o(($event) => toggleLike(note)),
            t: common_vendor.t(note.commentCount || 0),
            v: common_vendor.o(($event) => handleComment(note)),
            w: common_vendor.n({
              "icon-favorited": note.isFavorite
            }),
            x: common_vendor.t(note.favoriteCount || 0),
            y: note.isFavorite ? 1 : "",
            z: common_vendor.o(($event) => toggleFavorite(note)),
            A: note.id,
            B: common_vendor.o(($event) => viewDetail(note.id))
          });
        })
      }, {
        F: loading.value && noteList.value.length > 0
      }, loading.value && noteList.value.length > 0 ? {} : noMore.value && noteList.value.length > 0 ? {} : !loading.value && noteList.value.length === 0 && !networkError.value ? common_vendor.e({
        I: common_vendor.t(searchKeyword.value ? "\u672A\u627E\u5230\u76F8\u5173\u6E38\u8BB0" : "\u6682\u65E0\u6E38\u8BB0"),
        J: !searchKeyword.value
      }, !searchKeyword.value ? {
        K: common_vendor.o(publishNote)
      } : {}) : networkError.value ? {
        M: common_vendor.o(retryLoad)
      } : {}, {
        G: noMore.value && noteList.value.length > 0,
        H: !loading.value && noteList.value.length === 0 && !networkError.value,
        L: networkError.value,
        N: common_vendor.o(loadMore),
        O: common_vendor.o(onScroll),
        P: fabExpanded.value ? 1 : "",
        Q: common_vendor.o(toggleFab),
        R: fabExpanded.value
      }, fabExpanded.value ? {
        S: common_vendor.o(($event) => handleFabAction("publish")),
        T: common_vendor.o(($event) => handleFabAction("image")),
        U: common_vendor.o(() => {
        }),
        V: common_vendor.o(toggleFab)
      } : {});
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-7cadc62c"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/travel-note/list.vue"]]);
wx.createPage(MiniProgramPage);
