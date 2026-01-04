"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var api_route = require("../../api/route.js");
var store_user = require("../../store/user.js");
var utils_router = require("../../utils/router.js");
require("../../utils/http.js");
require("../../utils/storage.js");
require("../../utils/config.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const defaultAvatar = "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200";
    const tabs = [
      { key: "favorites", label: "\u6211\u7684\u6536\u85CF" },
      { key: "likes", label: "\u6211\u7684\u70B9\u8D5E" },
      { key: "comments", label: "\u6211\u7684\u8BC4\u8BBA" }
    ];
    const currentTab = common_vendor.ref("favorites");
    const switchTab = (key) => {
      currentTab.value = key;
      if (key === "favorites") {
        if (favoritesList.value.length === 0) {
          loadFavoritesData(true);
        }
      } else if (key === "likes") {
        if (likesList.value.length === 0 || currentLikeCategory.value !== "note") {
          if (currentLikeCategory.value !== "note") {
            currentLikeCategory.value = "note";
          }
          likesList.value = [];
          loadLikesData(true);
        }
      } else if (key === "comments") {
        if (commentsList.value.length === 0) {
          loadCommentsData(true);
        }
      }
    };
    const favoriteCategories = [
      { key: "note", label: "\u6E38\u8BB0" },
      { key: "scenic", label: "\u666F\u70B9" },
      { key: "food", label: "\u7F8E\u98DF" },
      { key: "route", label: "\u8DEF\u7EBF" }
    ];
    const currentFavoriteCategory = common_vendor.ref("note");
    const favoritesList = common_vendor.ref([]);
    const favoritesLoading = common_vendor.ref(false);
    const favoritesRefreshing = common_vendor.ref(false);
    const favoritesPageNum = common_vendor.ref(1);
    const favoritesPageSize = common_vendor.ref(10);
    const favoritesHasMore = common_vendor.ref(true);
    const switchFavoriteCategory = (key) => {
      if (currentFavoriteCategory.value === key && favoritesList.value.length > 0) {
        return;
      }
      currentFavoriteCategory.value = key;
      favoritesPageNum.value = 1;
      favoritesHasMore.value = true;
      favoritesList.value = [];
      loadFavoritesData(true);
    };
    const getFavoriteCategoryLabel = () => {
      const category = favoriteCategories.find((c) => c.key === currentFavoriteCategory.value);
      return (category == null ? void 0 : category.label) || "\u5185\u5BB9";
    };
    const loadFavoritesData = async (reset = false) => {
      var _a, _b, _c;
      if (!((_a = user.value) == null ? void 0 : _a.id)) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        return;
      }
      if (reset) {
        favoritesPageNum.value = 1;
        favoritesHasMore.value = true;
        favoritesList.value = [];
      }
      if (favoritesLoading.value || !reset && !favoritesHasMore.value) {
        return;
      }
      favoritesLoading.value = true;
      try {
        let res;
        if (currentFavoriteCategory.value === "note") {
          res = await api_content.travelNoteApi.listMyFavorites(user.value.id, favoritesPageNum.value, favoritesPageSize.value);
        } else if (currentFavoriteCategory.value === "scenic") {
          res = await api_content.scenicSpotApi.getMyFavorites(user.value.id, favoritesPageNum.value, favoritesPageSize.value);
        } else if (currentFavoriteCategory.value === "food") {
          res = await api_content.foodApi.getMyFavorites(user.value.id, favoritesPageNum.value, favoritesPageSize.value);
        } else if (currentFavoriteCategory.value === "route") {
          res = await api_route.routeApi.listMyRoutes(user.value.id);
          if (res && res.statusCode === 200 && res.data.code === 200) {
            const dataList = Array.isArray(res.data.data) ? res.data.data : ((_b = res.data.data) == null ? void 0 : _b.list) || [];
            res.data.data = {
              list: dataList,
              total: dataList.length,
              pageNum: favoritesPageNum.value,
              pageSize: favoritesPageSize.value
            };
          }
        }
        if (res && res.statusCode === 200 && res.data.code === 200) {
          const data = res.data.data || {};
          const dataList = data.list || [];
          if (reset) {
            favoritesList.value = dataList;
          } else {
            for (let i = 0; i < dataList.length; i++) {
              favoritesList.value.push(dataList[i]);
            }
          }
          favoritesHasMore.value = dataList.length >= favoritesPageSize.value;
          if (favoritesHasMore.value) {
            favoritesPageNum.value++;
          }
          favoritesLoading.value = false;
          favoritesRefreshing.value = false;
          await common_vendor.nextTick();
        } else {
          common_vendor.index.showToast({ title: ((_c = res == null ? void 0 : res.data) == null ? void 0 : _c.msg) || "\u52A0\u8F7D\u5931\u8D25", icon: "none" });
          favoritesLoading.value = false;
          favoritesRefreshing.value = false;
        }
      } catch (e) {
        common_vendor.index.showToast({ title: "\u52A0\u8F7D\u5931\u8D25: " + ((e == null ? void 0 : e.message) || "\u672A\u77E5\u9519\u8BEF"), icon: "none", duration: 3e3 });
        favoritesLoading.value = false;
        favoritesRefreshing.value = false;
      }
    };
    const onRefreshFavorites = () => {
      favoritesRefreshing.value = true;
      loadFavoritesData(true);
    };
    const loadMoreFavorites = () => {
      if (!favoritesLoading.value && favoritesHasMore.value) {
        loadFavoritesData(false);
      }
    };
    const likeCategories = [
      { key: "note", label: "\u6E38\u8BB0" },
      { key: "comment", label: "\u8BC4\u8BBA" }
    ];
    const currentLikeCategory = common_vendor.ref("note");
    const likesList = common_vendor.ref([]);
    const likesLoading = common_vendor.ref(false);
    const likesRefreshing = common_vendor.ref(false);
    const likesPageNum = common_vendor.ref(1);
    const likesPageSize = common_vendor.ref(10);
    const likesHasMore = common_vendor.ref(true);
    const switchLikeCategory = (key) => {
      if (currentLikeCategory.value === key && likesList.value.length > 0) {
        return;
      }
      currentLikeCategory.value = key;
      likesPageNum.value = 1;
      likesHasMore.value = true;
      likesList.value = [];
      loadLikesData(true);
    };
    const getLikeCategoryLabel = () => {
      const category = likeCategories.find((c) => c.key === currentLikeCategory.value);
      return (category == null ? void 0 : category.label) || "\u5185\u5BB9";
    };
    const loadLikesData = async (reset = false) => {
      var _a;
      if (!((_a = user.value) == null ? void 0 : _a.id)) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        return;
      }
      if (reset) {
        likesPageNum.value = 1;
        likesHasMore.value = true;
        likesList.value = [];
      }
      if (likesLoading.value || !reset && !likesHasMore.value) {
        return;
      }
      likesLoading.value = true;
      try {
        let res;
        if (currentLikeCategory.value === "note") {
          res = await api_content.travelNoteInteractionApi.listMyLikes(user.value.id, likesPageNum.value, likesPageSize.value);
        } else if (currentLikeCategory.value === "comment") {
          try {
            const commentRes = await api_content.travelNoteInteractionApi.listMyComments(
              user.value.id,
              likesPageNum.value,
              likesPageSize.value
            );
            if (commentRes.statusCode === 200 && commentRes.data.code === 200) {
              const commentData = commentRes.data.data || {};
              const commentList = commentData.list || [];
              const likedComments = commentList.filter((comment) => (comment.likeCount || 0) > 0);
              if (reset) {
                likesList.value = likedComments;
              } else {
                likesList.value.push(...likedComments);
              }
              likesHasMore.value = likedComments.length >= likesPageSize.value;
              if (likesHasMore.value) {
                likesPageNum.value++;
              }
            } else {
              likesList.value = [];
              likesHasMore.value = false;
            }
          } catch (error) {
            likesList.value = [];
            likesHasMore.value = false;
          }
          likesLoading.value = false;
          likesRefreshing.value = false;
          return;
        }
        if (res.statusCode === 200 && res.data.code === 200) {
          const data = res.data.data || {};
          const dataList = data.list || [];
          if (reset) {
            likesList.value = dataList;
          } else {
            for (let i = 0; i < dataList.length; i++) {
              likesList.value.push(dataList[i]);
            }
          }
          likesHasMore.value = dataList.length >= likesPageSize.value;
          if (likesHasMore.value) {
            likesPageNum.value++;
          }
          likesLoading.value = false;
          likesRefreshing.value = false;
          await common_vendor.nextTick();
        } else {
          common_vendor.index.showToast({ title: res.data.msg || "\u52A0\u8F7D\u5931\u8D25", icon: "none" });
          likesLoading.value = false;
          likesRefreshing.value = false;
        }
      } catch (e) {
        common_vendor.index.showToast({ title: "\u52A0\u8F7D\u5931\u8D25: " + ((e == null ? void 0 : e.message) || "\u672A\u77E5\u9519\u8BEF"), icon: "none", duration: 3e3 });
        likesLoading.value = false;
        likesRefreshing.value = false;
      }
    };
    const onRefreshLikes = () => {
      likesRefreshing.value = true;
      loadLikesData(true);
    };
    const loadMoreLikes = () => {
      if (!likesLoading.value && likesHasMore.value) {
        loadLikesData(false);
      }
    };
    const commentsList = common_vendor.ref([]);
    const commentsLoading = common_vendor.ref(false);
    const commentsRefreshing = common_vendor.ref(false);
    const commentsPageNum = common_vendor.ref(1);
    const commentsPageSize = common_vendor.ref(10);
    const commentsHasMore = common_vendor.ref(true);
    const loadCommentsData = async (reset = false) => {
      var _a;
      if (!((_a = user.value) == null ? void 0 : _a.id)) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        return;
      }
      if (reset) {
        commentsPageNum.value = 1;
        commentsHasMore.value = true;
        commentsList.value = [];
      }
      if (commentsLoading.value || !reset && !commentsHasMore.value) {
        return;
      }
      commentsLoading.value = true;
      try {
        const res = await api_content.travelNoteInteractionApi.listMyComments(user.value.id, commentsPageNum.value, commentsPageSize.value);
        if (res.statusCode === 200 && res.data.code === 200) {
          const data = res.data.data || {};
          const dataList = data.list || [];
          if (reset) {
            commentsList.value = dataList;
          } else {
            for (let i = 0; i < dataList.length; i++) {
              commentsList.value.push(dataList[i]);
            }
          }
          commentsHasMore.value = dataList.length >= commentsPageSize.value;
          if (commentsHasMore.value) {
            commentsPageNum.value++;
          }
          commentsLoading.value = false;
          commentsRefreshing.value = false;
          await common_vendor.nextTick();
        } else {
          common_vendor.index.showToast({ title: res.data.msg || "\u52A0\u8F7D\u5931\u8D25", icon: "none" });
          commentsLoading.value = false;
          commentsRefreshing.value = false;
        }
      } catch (e) {
        if (e.statusCode === 404) {
          commentsList.value = [];
          commentsHasMore.value = false;
        } else {
          common_vendor.index.showToast({ title: "\u52A0\u8F7D\u5931\u8D25: " + ((e == null ? void 0 : e.message) || "\u672A\u77E5\u9519\u8BEF"), icon: "none", duration: 3e3 });
        }
        commentsLoading.value = false;
        commentsRefreshing.value = false;
      }
    };
    const onRefreshComments = () => {
      commentsRefreshing.value = true;
      loadCommentsData(true);
    };
    const loadMoreComments = () => {
      if (!commentsLoading.value && commentsHasMore.value) {
        loadCommentsData(false);
      }
    };
    let lastClickTime = 0;
    const CLICK_DEBOUNCE_TIME = 300;
    const viewNoteDetail = (id) => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME)
        return;
      lastClickTime = now;
      utils_router.safeNavigateTo(`/pages/travel-note/detail?id=${id}`).catch(() => {
      });
    };
    const viewScenicDetail = (id) => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME)
        return;
      lastClickTime = now;
      utils_router.safeNavigateTo(`/pages/scenic/detail?id=${id}`).catch(() => {
      });
    };
    const viewFoodDetail = (id) => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME)
        return;
      lastClickTime = now;
      utils_router.safeNavigateTo(`/pages/food/detail?id=${id}`).catch(() => {
      });
    };
    const viewRouteDetail = (id) => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME)
        return;
      lastClickTime = now;
      utils_router.safeNavigateTo(`/pages/route/detail?id=${id}`).catch(() => {
      });
    };
    const viewCommentDetail = (contentId, contentType) => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME)
        return;
      lastClickTime = now;
      if (contentType === "note") {
        utils_router.safeNavigateTo(`/pages/travel-note/detail?id=${contentId}`).catch(() => {
        });
      } else {
        common_vendor.index.showToast({ title: "\u6682\u4E0D\u652F\u6301\u8BE5\u7C7B\u578B", icon: "none" });
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
        const hours = Math.floor(diff / (1e3 * 60 * 60));
        if (hours === 0) {
          const minutes = Math.floor(diff / (1e3 * 60));
          return minutes <= 0 ? "\u521A\u521A" : `${minutes}\u5206\u949F\u524D`;
        }
        return `${hours}\u5C0F\u65F6\u524D`;
      } else if (days < 7) {
        return `${days}\u5929\u524D`;
      } else {
        return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
      }
    };
    const getImageUrl = (url) => {
      if (!url)
        return "";
      if (url.startsWith("http"))
        return url;
      return `https://your-api-domain.com${url}`;
    };
    const getNoteTag = (note) => {
      if (note.isFeatured)
        return "\u7CBE\u9009";
      if (note.isHot)
        return "\u70ED\u95E8";
      return "";
    };
    common_vendor.onMounted(() => {
      if (user.value) {
        if (currentTab.value === "favorites") {
          loadFavoritesData(true);
        }
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(tabs, (tab, k0, i0) => {
          return {
            a: common_vendor.t(tab.label),
            b: tab.key,
            c: currentTab.value === tab.key ? 1 : "",
            d: common_vendor.o(($event) => switchTab(tab.key))
          };
        }),
        b: currentTab.value === "favorites"
      }, currentTab.value === "favorites" ? common_vendor.e({
        c: common_vendor.f(favoriteCategories, (category, k0, i0) => {
          return {
            a: common_vendor.t(category.label),
            b: category.key,
            c: currentFavoriteCategory.value === category.key ? 1 : "",
            d: common_vendor.o(($event) => switchFavoriteCategory(category.key))
          };
        }),
        d: favoritesLoading.value && favoritesList.value.length === 0
      }, favoritesLoading.value && favoritesList.value.length === 0 ? {
        e: common_vendor.f(6, (i, k0, i0) => {
          return {
            a: i
          };
        })
      } : !favoritesLoading.value && favoritesList.value.length === 0 ? {
        g: common_vendor.t(getFavoriteCategoryLabel())
      } : {}, {
        f: !favoritesLoading.value && favoritesList.value.length === 0,
        h: !favoritesLoading.value && currentFavoriteCategory.value === "note" && favoritesList.value.length > 0
      }, !favoritesLoading.value && currentFavoriteCategory.value === "note" && favoritesList.value.length > 0 ? {
        i: common_vendor.f(favoritesList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: item.coverImage
          }, item.coverImage ? {
            b: getImageUrl(item.coverImage)
          } : {}, {
            c: getNoteTag(item)
          }, getNoteTag(item) ? {
            d: common_vendor.t(getNoteTag(item))
          } : {}, {
            e: item.authorAvatar || defaultAvatar,
            f: common_vendor.t(item.authorName || "\u533F\u540D\u7528\u6237"),
            g: common_vendor.t(formatTime(item.createTime)),
            h: common_vendor.t(item.title),
            i: common_vendor.t(item.cityName || "\u672A\u77E5\u5730\u70B9"),
            j: common_vendor.n({
              "icon-liked": item.isLiked
            }),
            k: common_vendor.t(item.likeCount || 0),
            l: item.isLiked ? 1 : "",
            m: common_vendor.t(item.commentCount || 0),
            n: common_vendor.t(item.favoriteCount || 0),
            o: item.id,
            p: common_vendor.o(($event) => viewNoteDetail(item.id))
          });
        })
      } : {}, {
        j: !favoritesLoading.value && currentFavoriteCategory.value === "scenic" && favoritesList.value.length > 0
      }, !favoritesLoading.value && currentFavoriteCategory.value === "scenic" && favoritesList.value.length > 0 ? {
        k: common_vendor.f(favoritesList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: item.imageUrl
          }, item.imageUrl ? {
            b: getImageUrl(item.imageUrl)
          } : {}, {
            c: common_vendor.t(item.name),
            d: common_vendor.t(item.address || "\u672A\u77E5\u5730\u5740"),
            e: item.intro
          }, item.intro ? {
            f: common_vendor.t(item.intro)
          } : {}, {
            g: item.id,
            h: common_vendor.o(($event) => viewScenicDetail(item.id))
          });
        })
      } : {}, {
        l: !favoritesLoading.value && currentFavoriteCategory.value === "food" && favoritesList.value.length > 0
      }, !favoritesLoading.value && currentFavoriteCategory.value === "food" && favoritesList.value.length > 0 ? {
        m: common_vendor.f(favoritesList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: item.imageUrl
          }, item.imageUrl ? {
            b: getImageUrl(item.imageUrl)
          } : {}, {
            c: common_vendor.t(item.name),
            d: common_vendor.t(item.address || "\u672A\u77E5\u5730\u5740"),
            e: item.foodType
          }, item.foodType ? {
            f: common_vendor.t(item.foodType)
          } : {}, {
            g: item.intro
          }, item.intro ? {
            h: common_vendor.t(item.intro)
          } : {}, {
            i: item.id,
            j: common_vendor.o(($event) => viewFoodDetail(item.id))
          });
        })
      } : {}, {
        n: !favoritesLoading.value && currentFavoriteCategory.value === "route" && favoritesList.value.length > 0
      }, !favoritesLoading.value && currentFavoriteCategory.value === "route" && favoritesList.value.length > 0 ? {
        o: common_vendor.f(favoritesList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: item.coverImage
          }, item.coverImage ? {
            b: getImageUrl(item.coverImage)
          } : {}, {
            c: common_vendor.t(item.routeName || item.name || "\u672A\u547D\u540D\u8DEF\u7EBF"),
            d: common_vendor.t(item.days || 0),
            e: item.summary
          }, item.summary ? {
            f: common_vendor.t(item.summary)
          } : {}, {
            g: item.id,
            h: common_vendor.o(($event) => viewRouteDetail(item.id))
          });
        })
      } : {}, {
        p: favoritesHasMore.value && !favoritesLoading.value
      }, favoritesHasMore.value && !favoritesLoading.value ? {} : {}, {
        q: !favoritesHasMore.value && favoritesList.value.length > 0
      }, !favoritesHasMore.value && favoritesList.value.length > 0 ? {} : {}, {
        r: common_vendor.o(loadMoreFavorites),
        s: favoritesRefreshing.value,
        t: common_vendor.o(onRefreshFavorites)
      }) : {}, {
        v: currentTab.value === "likes"
      }, currentTab.value === "likes" ? common_vendor.e({
        w: common_vendor.f(likeCategories, (category, k0, i0) => {
          return {
            a: common_vendor.t(category.label),
            b: category.key,
            c: currentLikeCategory.value === category.key ? 1 : "",
            d: common_vendor.o(($event) => switchLikeCategory(category.key))
          };
        }),
        x: likesLoading.value && likesList.value.length === 0
      }, likesLoading.value && likesList.value.length === 0 ? {
        y: common_vendor.f(6, (i, k0, i0) => {
          return {
            a: i
          };
        })
      } : !likesLoading.value && likesList.value.length === 0 ? {
        A: common_vendor.t(getLikeCategoryLabel())
      } : {}, {
        z: !likesLoading.value && likesList.value.length === 0,
        B: !likesLoading.value && currentLikeCategory.value === "note" && likesList.value.length > 0
      }, !likesLoading.value && currentLikeCategory.value === "note" && likesList.value.length > 0 ? {
        C: common_vendor.f(likesList.value, (note, k0, i0) => {
          return common_vendor.e({
            a: note.coverImage
          }, note.coverImage ? {
            b: getImageUrl(note.coverImage)
          } : {}, {
            c: getNoteTag(note)
          }, getNoteTag(note) ? {
            d: common_vendor.t(getNoteTag(note))
          } : {}, {
            e: note.authorAvatar || defaultAvatar,
            f: common_vendor.t(note.authorName || "\u533F\u540D\u7528\u6237"),
            g: common_vendor.t(formatTime(note.createTime)),
            h: common_vendor.t(note.title),
            i: common_vendor.t(note.cityName || "\u672A\u77E5\u5730\u70B9"),
            j: common_vendor.t(note.likeCount || 0),
            k: common_vendor.t(note.commentCount || 0),
            l: common_vendor.n({
              "icon-favorited": note.isFavorite
            }),
            m: common_vendor.t(note.favoriteCount || 0),
            n: note.isFavorite ? 1 : "",
            o: note.id,
            p: common_vendor.o(($event) => viewNoteDetail(note.id))
          });
        })
      } : {}, {
        D: !likesLoading.value && currentLikeCategory.value === "comment" && likesList.value.length > 0
      }, !likesLoading.value && currentLikeCategory.value === "comment" && likesList.value.length > 0 ? {
        E: common_vendor.f(likesList.value, (comment, k0, i0) => {
          return {
            a: common_vendor.t(comment.contentTitle || "\u6E38\u8BB0"),
            b: common_vendor.t(formatTime(comment.createTime)),
            c: common_vendor.t(comment.content),
            d: common_vendor.t(comment.likeCount || 0),
            e: comment.id,
            f: common_vendor.o(($event) => viewCommentDetail(comment.contentId, comment.contentType))
          };
        })
      } : {}, {
        F: likesHasMore.value && !likesLoading.value
      }, likesHasMore.value && !likesLoading.value ? {} : {}, {
        G: !likesHasMore.value && likesList.value.length > 0
      }, !likesHasMore.value && likesList.value.length > 0 ? {} : {}, {
        H: common_vendor.o(loadMoreLikes),
        I: likesRefreshing.value,
        J: common_vendor.o(onRefreshLikes)
      }) : {}, {
        K: currentTab.value === "comments"
      }, currentTab.value === "comments" ? common_vendor.e({
        L: commentsLoading.value && commentsList.value.length === 0
      }, commentsLoading.value && commentsList.value.length === 0 ? {
        M: common_vendor.f(5, (i, k0, i0) => {
          return {
            a: i
          };
        })
      } : !commentsLoading.value && commentsList.value.length === 0 ? {} : {}, {
        N: !commentsLoading.value && commentsList.value.length === 0,
        O: !commentsLoading.value && commentsList.value.length > 0
      }, !commentsLoading.value && commentsList.value.length > 0 ? {
        P: common_vendor.f(commentsList.value, (comment, k0, i0) => {
          return {
            a: common_vendor.t(comment.contentTitle || "\u6E38\u8BB0"),
            b: common_vendor.t(formatTime(comment.createTime)),
            c: common_vendor.t(comment.content),
            d: common_vendor.t(comment.likeCount || 0),
            e: comment.id,
            f: common_vendor.o(($event) => viewCommentDetail(comment.contentId, comment.contentType))
          };
        })
      } : {}, {
        Q: commentsHasMore.value && !commentsLoading.value
      }, commentsHasMore.value && !commentsLoading.value ? {} : {}, {
        R: !commentsHasMore.value && commentsList.value.length > 0
      }, !commentsHasMore.value && commentsList.value.length > 0 ? {} : {}, {
        S: common_vendor.o(loadMoreComments),
        T: commentsRefreshing.value,
        U: common_vendor.o(onRefreshComments)
      }) : {});
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-4b25709b"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/profile/my-interaction.vue"]]);
wx.createPage(MiniProgramPage);
