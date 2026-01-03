"use strict";
var common_vendor = require("../../common/vendor.js");
var store_user = require("../../store/user.js");
var api_content = require("../../api/content.js");
var utils_image = require("../../utils/image.js");
var utils_router = require("../../utils/router.js");
require("../../utils/storage.js");
require("../../utils/http.js");
require("../../utils/config.js");
if (!Math) {
  SkeletonCards();
}
const SkeletonCards = () => "../../components/SkeletonCards.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const noteList = common_vendor.ref([]);
    const pageNum = common_vendor.ref(1);
    const pageSize = common_vendor.ref(10);
    const loading = common_vendor.ref(false);
    const noMore = common_vendor.ref(false);
    const networkError = common_vendor.ref(false);
    const imageLoadedMap = common_vendor.ref({});
    const imageLoadTimers = common_vendor.ref(/* @__PURE__ */ new Map());
    const statusFilters = [
      { key: "all", label: "\u5168\u90E8" },
      { key: "pass", label: "\u5DF2\u53D1\u8868" },
      { key: "pending", label: "\u5F85\u5BA1\u6838" },
      { key: "reject", label: "\u88AB\u9A73\u56DE" },
      { key: "private", label: "\u79C1\u4EBA" }
    ];
    const selectedStatus = common_vendor.ref("all");
    const scrollTop = common_vendor.ref(0);
    const searchKeyword = common_vendor.ref("");
    const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iI0U1RTVFNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5RUE3QjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==";
    const defaultAvatar = "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200";
    const loadNotes = async (reset = false) => {
      var _a;
      if (!((_a = user.value) == null ? void 0 : _a.id)) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        return;
      }
      if (reset) {
        pageNum.value = 1;
        noMore.value = false;
        noteList.value = [];
        networkError.value = false;
        if (loading.value) {
          loading.value = false;
        }
      }
      if (!reset && loading.value || !reset && noMore.value) {
        return;
      }
      loading.value = true;
      networkError.value = false;
      try {
        let status = void 0;
        if (selectedStatus.value === "all") {
          status = void 0;
        } else {
          status = selectedStatus.value;
        }
        const res = await api_content.travelNoteApi.listMyNotes(user.value.id, pageNum.value, pageSize.value, status);
        const response = res.data;
        if (res.statusCode === 200 && response.code === 200) {
          const data = response.data;
          if (data.list && data.list.length > 0) {
            let newNotes = data.list.map((item) => ({
              ...item,
              isLiked: item.isLiked || false,
              isFavorite: item.isFavorite || false,
              commentCount: item.commentCount !== void 0 ? item.commentCount : item.comment_count || 0,
              favoriteCount: item.favoriteCount !== void 0 ? item.favoriteCount : item.favorite_count || 0
            }));
            if (searchKeyword.value && searchKeyword.value.trim()) {
              const keyword = searchKeyword.value.trim().toLowerCase();
              newNotes = newNotes.filter((note) => {
                const title = (note.title || "").toLowerCase();
                const content = (note.content || "").toLowerCase();
                const cityName = (note.cityName || "").toLowerCase();
                return title.includes(keyword) || content.includes(keyword) || cityName.includes(keyword);
              });
            }
            if (reset) {
              noteList.value = newNotes;
            } else {
              noteList.value.push(...newNotes);
            }
            newNotes.forEach((note) => {
              if (note.coverImage && !imageLoadedMap.value[note.id]) {
                imageLoadedMap.value[note.id] = false;
              }
            });
            if (data.list.length < pageSize.value) {
              noMore.value = true;
            } else {
              pageNum.value++;
            }
          } else {
            noMore.value = true;
            if (reset) {
              noteList.value = [];
            }
          }
        } else {
          networkError.value = true;
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
      pageNum.value = 1;
      noteList.value = [];
      noMore.value = false;
      networkError.value = false;
      loadNotes(true);
    };
    const onSearchInput = () => {
      clearTimeout(searchTimer.value);
      searchTimer.value = setTimeout(() => {
        handleSearch();
      }, 500);
    };
    const clearSearch = () => {
      searchKeyword.value = "";
      if (searchTimer.value) {
        clearTimeout(searchTimer.value);
      }
      handleSearch();
    };
    const searchTimer = common_vendor.ref(void 0);
    const loadMore = () => {
      if (!loading.value && !noMore.value) {
        loadNotes();
      }
    };
    const onImageLoad = (noteId) => {
      imageLoadedMap.value[noteId] = true;
    };
    const onImageError = (noteId) => {
      imageLoadedMap.value[noteId] = false;
    };
    const getStatusTag = (note) => {
      if (note.isPrivate)
        return "\u79C1\u4EBA";
      if (note.status === "pass")
        return "\u5DF2\u53D1\u8868";
      if (note.status === "pending")
        return "\u5F85\u5BA1\u6838";
      if (note.status === "reject")
        return "\u5DF2\u9A73\u56DE";
      return null;
    };
    const getStatusTagClass = (note) => {
      if (note.isPrivate)
        return "status-private";
      if (note.status === "pass")
        return "status-pass";
      if (note.status === "pending")
        return "status-pending";
      if (note.status === "reject")
        return "status-reject";
      return "";
    };
    const clearImageLoadTimers = () => {
      imageLoadTimers.value.forEach((timer) => {
        clearTimeout(timer);
      });
      imageLoadTimers.value.clear();
    };
    const cleanupImageLoadedMap = () => {
      const currentNoteIds = new Set(noteList.value.map((note) => note.id));
      const keysToDelete = [];
      Object.keys(imageLoadedMap.value).forEach((key) => {
        const noteId = Number(key);
        if (!currentNoteIds.has(noteId)) {
          keysToDelete.push(noteId);
        }
      });
      keysToDelete.forEach((noteId) => {
        delete imageLoadedMap.value[noteId];
      });
    };
    const switchStatus = (status) => {
      if (selectedStatus.value === status && noteList.value.length > 0) {
        return;
      }
      selectedStatus.value = status;
      pageNum.value = 1;
      noMore.value = false;
      networkError.value = false;
      scrollTop.value = 0;
      common_vendor.nextTick(() => {
        scrollTop.value = 0;
      });
      clearImageLoadTimers();
      noteList.value = [];
      cleanupImageLoadedMap();
      loadNotes(true);
    };
    const handleNoteClick = (note) => {
      if (note.status === "reject") {
        common_vendor.index.showModal({
          title: "\u6E38\u8BB0\u88AB\u9A73\u56DE",
          content: note.auditRemark || "\u5BA1\u6838\u4E0D\u901A\u8FC7\uFF0C\u8BF7\u7F16\u8F91\u540E\u91CD\u65B0\u63D0\u4EA4",
          confirmText: "\u53BB\u7F16\u8F91",
          cancelText: "\u67E5\u770B\u8BE6\u60C5",
          success: (res) => {
            if (res.confirm) {
              editNote(note);
            } else {
              viewDetail(note.id);
            }
          }
        });
      } else {
        viewDetail(note.id);
      }
    };
    const viewDetail = (id) => {
      utils_router.safeNavigateTo(`/pages/travel-note/detail?id=${id}`);
    };
    const editNote = (note) => {
      if (!user.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        return;
      }
      utils_router.safeNavigateTo(`/pages/travel-note/publish?id=${note.id}`);
    };
    const deleteNote = (note) => {
      if (!user.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        return;
      }
      common_vendor.index.showModal({
        title: "\u786E\u8BA4\u5220\u9664",
        content: "\u5220\u9664\u540E\u65E0\u6CD5\u6062\u590D\uFF0C\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u7BC7\u6E38\u8BB0\u5417\uFF1F",
        confirmText: "\u5220\u9664",
        cancelText: "\u53D6\u6D88",
        confirmColor: "#ff3b30",
        success: async (res) => {
          if (res.confirm) {
            try {
              const deleteRes = await api_content.travelNoteApi.delete(note.id, user.value.id);
              const data = deleteRes.data;
              if (deleteRes.statusCode === 200 && data.code === 200) {
                common_vendor.index.showToast({ title: "\u5220\u9664\u6210\u529F", icon: "success" });
                const index = noteList.value.findIndex((n) => n.id === note.id);
                if (index > -1) {
                  noteList.value.splice(index, 1);
                }
              } else {
                common_vendor.index.showToast({ title: data.msg || "\u5220\u9664\u5931\u8D25", icon: "none" });
              }
            } catch (error) {
              common_vendor.index.showToast({ title: (error == null ? void 0 : error.message) || "\u5220\u9664\u5931\u8D25", icon: "none" });
            }
          }
        }
      });
    };
    const togglePrivate = async (note) => {
      if (!user.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        return;
      }
      const isPrivate = !note.isPrivate;
      try {
        const res = await api_content.travelNoteApi.setPrivate(note.id, user.value.id, isPrivate);
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          note.isPrivate = isPrivate;
          if (isPrivate) {
            note.status = "private";
          } else {
            note.status = "pending";
          }
          common_vendor.index.showToast({ title: isPrivate ? "\u5DF2\u8BBE\u4E3A\u79C1\u4EBA" : "\u5DF2\u8BBE\u4E3A\u516C\u5F00\uFF0C\u7B49\u5F85\u5BA1\u6838", icon: "success" });
        } else {
          common_vendor.index.showToast({ title: data.msg || "\u64CD\u4F5C\u5931\u8D25", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.showToast({ title: (error == null ? void 0 : error.message) || "\u64CD\u4F5C\u5931\u8D25", icon: "none" });
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
    const publishNote = () => {
      utils_router.safeNavigateTo("/pages/travel-note/publish");
    };
    const retryLoad = () => {
      networkError.value = false;
      pageNum.value = 1;
      noteList.value = [];
      noMore.value = false;
      loadNotes();
    };
    common_vendor.onLoad((options) => {
      if (options.status) {
        const validStatus = ["all", "pass", "pending", "reject", "private"];
        if (validStatus.includes(options.status)) {
          selectedStatus.value = options.status;
        }
      }
    });
    common_vendor.onShow(() => {
      if (user.value && noteList.value.length === 0 && !loading.value) {
        pageNum.value = 1;
        noteList.value = [];
        noMore.value = false;
        loadNotes();
      }
    });
    common_vendor.onMounted(() => {
      if (user.value) {
        loadNotes();
      } else {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
      }
    });
    common_vendor.onUnmounted(() => {
      clearImageLoadTimers();
      if (searchTimer.value) {
        clearTimeout(searchTimer.value);
      }
      imageLoadedMap.value = {};
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(handleSearch),
        b: common_vendor.o([($event) => searchKeyword.value = $event.detail.value, onSearchInput]),
        c: searchKeyword.value,
        d: searchKeyword.value
      }, searchKeyword.value ? {
        e: common_vendor.o(clearSearch)
      } : {}, {
        f: common_vendor.f(statusFilters, (status, k0, i0) => {
          return {
            a: common_vendor.t(status.label),
            b: status.key,
            c: selectedStatus.value === status.key ? 1 : "",
            d: common_vendor.o(($event) => switchStatus(status.key))
          };
        }),
        g: loading.value && noteList.value.length === 0
      }, loading.value && noteList.value.length === 0 ? {
        h: common_vendor.p({
          count: 6
        })
      } : {
        i: common_vendor.f(noteList.value, (note, k0, i0) => {
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
            h: getStatusTag(note)
          }, getStatusTag(note) ? {
            i: common_vendor.t(getStatusTag(note)),
            j: common_vendor.n(getStatusTagClass(note))
          } : {}, {
            k: note.authorAvatar || defaultAvatar,
            l: common_vendor.t(note.authorName || "\u533F\u540D\u7528\u6237"),
            m: common_vendor.t(formatTime(note.createTime)),
            n: common_vendor.t(note.title),
            o: common_vendor.t(note.cityName || "\u672A\u77E5\u5730\u70B9"),
            p: note.status === "reject" && note.auditRemark
          }, note.status === "reject" && note.auditRemark ? {
            q: common_vendor.t(note.auditRemark)
          } : {}, {
            r: common_vendor.n({
              "icon-liked": note.isLiked
            }),
            s: common_vendor.t(note.likeCount || 0),
            t: note.isLiked ? 1 : "",
            v: common_vendor.o(($event) => toggleLike(note)),
            w: common_vendor.t(note.commentCount || 0),
            x: common_vendor.o(($event) => handleComment(note)),
            y: common_vendor.n({
              "icon-favorited": note.isFavorite
            }),
            z: common_vendor.t(note.favoriteCount || 0),
            A: note.isFavorite ? 1 : "",
            B: common_vendor.o(($event) => toggleFavorite(note)),
            C: common_vendor.o(($event) => editNote(note)),
            D: common_vendor.n(note.isPrivate ? "icon-gongkai" : "icon-siyou"),
            E: common_vendor.t(note.isPrivate ? "\u8BBE\u4E3A\u516C\u5F00" : "\u8BBE\u4E3A\u79C1\u4EBA"),
            F: common_vendor.o(($event) => togglePrivate(note)),
            G: common_vendor.o(($event) => deleteNote(note)),
            H: note.id,
            I: common_vendor.o(($event) => handleNoteClick(note))
          });
        })
      }, {
        j: loading.value && noteList.value.length > 0
      }, loading.value && noteList.value.length > 0 ? {} : noMore.value && noteList.value.length > 0 ? {} : !loading.value && noteList.value.length === 0 && !networkError.value ? {
        m: common_vendor.o(publishNote)
      } : networkError.value ? {
        o: common_vendor.o(retryLoad)
      } : {}, {
        k: noMore.value && noteList.value.length > 0,
        l: !loading.value && noteList.value.length === 0 && !networkError.value,
        n: networkError.value,
        p: scrollTop.value,
        q: common_vendor.o(loadMore)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-45957dff"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/profile/my-article.vue"]]);
wx.createPage(MiniProgramPage);
