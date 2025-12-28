"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var utils_http = require("../../utils/http.js");
var store_user = require("../../store/user.js");
require("../../utils/storage.js");
if (!Math) {
  (GuideOverlay + LoginPrompt + common_vendor.unref(common_vendor.Search) + SkeletonCards + EmptyState)();
}
const EmptyState = () => "../../components/EmptyState.js";
const SkeletonCards = () => "../../components/SkeletonCards.js";
const GuideOverlay = () => "../../components/GuideOverlay.js";
const LoginPrompt = () => "../../components/LoginPrompt.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const searchKeyword = common_vendor.ref("");
    const searchPlaceholder = "\u8F93\u5165\u57CE\u5E02 / \u60F3\u53BB\u54EA\u73A9\uFF1F";
    const activeFeatureId = common_vendor.ref(null);
    const featureEntries = common_vendor.ref([
      { id: 1, title: "\u667A\u80FD\u89C4\u5212", desc: "\u6839\u636E\u4F60\u7684\u5174\u8DA3\u667A\u80FD\u751F\u6210\u884C\u7A0B", icon: "Brain", text: "\u667A", type: "planner" },
      { id: 2, title: "\u70ED\u95E8\u7EBF\u8DEF", desc: "\u770B\u770B\u5927\u5BB6\u90FD\u5728\u8D70\u7684\u7206\u6B3E\u8DEF\u7EBF", icon: "Fire", text: "\u7EBF", type: "hot-routes" },
      { id: 3, title: "\u5174\u8DA3\u63A8\u8350", desc: "\u7F8E\u98DF / \u5386\u53F2 / \u4EB2\u5B50\u4E00\u952E\u9009\u62E9", icon: "Magic", text: "\u8DA3", type: "interest" }
    ]);
    const routeList = common_vendor.ref([]);
    const noteList = common_vendor.ref([]);
    const scenicList = common_vendor.ref([]);
    const foodList = common_vendor.ref([]);
    const loadingRecommend = common_vendor.ref(false);
    const loadingNotes = common_vendor.ref(false);
    const notePage = common_vendor.ref(1);
    const noteFinished = common_vendor.ref(false);
    const shouldAnimateMap = common_vendor.ref({});
    const showLoginPrompt = common_vendor.ref(false);
    const provinceList = common_vendor.ref([
      { name: "\u5168\u90E8\u7701\u4EFD", value: "" },
      { name: "\u5317\u4EAC", value: "\u5317\u4EAC" },
      { name: "\u4E0A\u6D77", value: "\u4E0A\u6D77" },
      { name: "\u5E7F\u4E1C", value: "\u5E7F\u4E1C" },
      { name: "\u6D59\u6C5F", value: "\u6D59\u6C5F" },
      { name: "\u6C5F\u82CF", value: "\u6C5F\u82CF" },
      { name: "\u56DB\u5DDD", value: "\u56DB\u5DDD" },
      { name: "\u9655\u897F", value: "\u9655\u897F" },
      { name: "\u798F\u5EFA", value: "\u798F\u5EFA" },
      { name: "\u5C71\u4E1C", value: "\u5C71\u4E1C" },
      { name: "\u6CB3\u5357", value: "\u6CB3\u5357" },
      { name: "\u6E56\u5317", value: "\u6E56\u5317" },
      { name: "\u6E56\u5357", value: "\u6E56\u5357" },
      { name: "\u5B89\u5FBD", value: "\u5B89\u5FBD" },
      { name: "\u6CB3\u5317", value: "\u6CB3\u5317" },
      { name: "\u8FBD\u5B81", value: "\u8FBD\u5B81" },
      { name: "\u6C5F\u897F", value: "\u6C5F\u897F" },
      { name: "\u91CD\u5E86", value: "\u91CD\u5E86" },
      { name: "\u4E91\u5357", value: "\u4E91\u5357" },
      { name: "\u5E7F\u897F", value: "\u5E7F\u897F" },
      { name: "\u5C71\u897F", value: "\u5C71\u897F" },
      { name: "\u5185\u8499\u53E4", value: "\u5185\u8499\u53E4" },
      { name: "\u8D35\u5DDE", value: "\u8D35\u5DDE" },
      { name: "\u65B0\u7586", value: "\u65B0\u7586" },
      { name: "\u5409\u6797", value: "\u5409\u6797" },
      { name: "\u9ED1\u9F99\u6C5F", value: "\u9ED1\u9F99\u6C5F" },
      { name: "\u6D77\u5357", value: "\u6D77\u5357" },
      { name: "\u7518\u8083", value: "\u7518\u8083" },
      { name: "\u5B81\u590F", value: "\u5B81\u590F" },
      { name: "\u9752\u6D77", value: "\u9752\u6D77" },
      { name: "\u897F\u85CF", value: "\u897F\u85CF" },
      { name: "\u5929\u6D25", value: "\u5929\u6D25" },
      { name: "\u9999\u6E2F", value: "\u9999\u6E2F" },
      { name: "\u6FB3\u95E8", value: "\u6FB3\u95E8" },
      { name: "\u53F0\u6E7E", value: "\u53F0\u6E7E" }
    ]);
    const selectedProvinceIndex = common_vendor.ref(0);
    const selectedProvince = common_vendor.computed(() => {
      var _a;
      return ((_a = provinceList.value[selectedProvinceIndex.value]) == null ? void 0 : _a.name) || "\u5168\u90E8\u7701\u4EFD";
    });
    const scrollTop = common_vendor.ref(0);
    const showBackToTop = common_vendor.ref(false);
    const onScroll = (e) => {
      const scrollTopValue = e.detail.scrollTop;
      showBackToTop.value = scrollTopValue > 300;
    };
    const scrollToTop = () => {
      scrollTop.value = 0;
      setTimeout(() => {
        scrollTop.value = 0.01;
      }, 100);
    };
    const filteredScenicList = common_vendor.computed(() => {
      return scenicList.value;
    });
    const onProvinceChange = (e) => {
      selectedProvinceIndex.value = e.detail.value;
      fetchHomeData();
    };
    const onSearchClick = () => {
      common_vendor.index.navigateTo({ url: "/pages/search/search" });
    };
    const onSearchConfirm = () => {
      if (!searchKeyword.value) {
        onSearchClick();
        return;
      }
      common_vendor.index.navigateTo({
        url: `/pages/search/search?keyword=${encodeURIComponent(searchKeyword.value)}`
      });
    };
    const onFeatureTouchStart = (id) => {
      activeFeatureId.value = id;
    };
    const onFeatureTouchEnd = () => {
      activeFeatureId.value = null;
    };
    const onFeatureClick = (item) => {
      if (item.type === "planner") {
        common_vendor.index.switchTab({ url: "/pages/route/plan" });
      } else if (item.type === "hot-routes") {
        common_vendor.index.showToast({ title: "\u529F\u80FD\u5F00\u53D1\u4E2D", icon: "none" });
      } else if (item.type === "interest") {
        common_vendor.index.showToast({ title: "\u529F\u80FD\u5F00\u53D1\u4E2D", icon: "none" });
      }
    };
    const onViewRoute = (route) => {
      common_vendor.index.navigateTo({ url: `/pages/route/detail?id=${route.id}` });
    };
    const onViewNote = (note) => {
      common_vendor.index.navigateTo({ url: `/pages/travel-note/detail?id=${note.id}` });
    };
    const showLoginPromptDialog = () => {
      console.log("showLoginPromptDialog called");
      common_vendor.index.showModal({
        title: "\u9700\u8981\u767B\u5F55",
        content: "\u8BF7\u5148\u767B\u5F55",
        confirmText: "\u53BB\u767B\u5F55",
        cancelText: "\u53D6\u6D88",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.switchTab({ url: "/pages/profile/profile" });
          }
        }
      });
    };
    const handleLoginConfirm = () => {
      showLoginPrompt.value = false;
    };
    const handleLoginCancel = () => {
      showLoginPrompt.value = false;
    };
    const toggleLike = async (note) => {
      console.log("toggleLike called", note.id);
      if (!user.value) {
        console.log("User not logged in, showing login prompt");
        showLoginPromptDialog();
        return;
      }
      try {
        console.log("Toggling like for note:", note.id, "current state:", note.isLiked);
        const wasLiked = note.isLiked;
        note.isLiked = !wasLiked;
        if (!wasLiked) {
          note.likeCount = (note.likeCount || 0) + 1;
          shouldAnimateMap.value[note.id] = true;
          setTimeout(() => {
            shouldAnimateMap.value[note.id] = false;
          }, 300);
        } else {
          note.likeCount = Math.max(0, (note.likeCount || 0) - 1);
        }
        const res = await api_content.travelNoteInteractionApi.toggleLike(user.value.id, note.id);
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          note.isLiked = data.data.isLiked;
          if (data.data.likeCount !== void 0) {
            note.likeCount = data.data.likeCount;
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
        console.error("\u70B9\u8D5E\u5931\u8D25:", error);
        note.isLiked = !note.isLiked;
        note.likeCount = note.isLiked ? (note.likeCount || 0) + 1 : Math.max(0, (note.likeCount || 0) - 1);
        common_vendor.index.showToast({
          title: (error == null ? void 0 : error.message) || "\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC",
          icon: "none"
        });
      }
    };
    const handleComment = (note) => {
      if (!user.value) {
        showLoginPromptDialog();
        return;
      }
      common_vendor.index.navigateTo({ url: `/pages/travel-note/detail?id=${note.id}&tab=comment` });
    };
    const onViewScenic = async (item) => {
      try {
        await api_content.scenicSpotApi.incrementHotScore(item.id);
      } catch (error) {
        console.error("\u589E\u52A0\u70ED\u5EA6\u5931\u8D25:", error);
      }
      common_vendor.index.navigateTo({ url: `/pages/scenic/detail?id=${item.id}` });
    };
    const onViewFood = (item) => {
      common_vendor.index.navigateTo({ url: `/pages/food/detail?id=${item.id}` });
    };
    const fetchHomeData = async () => {
      var _a, _b;
      if (loadingRecommend.value)
        return;
      loadingRecommend.value = true;
      const toastFail = (msg) => common_vendor.index.showToast({ title: msg, icon: "none" });
      try {
        const provinceValue = selectedProvince.value && selectedProvince.value !== "\u5168\u90E8\u7701\u4EFD" ? (_a = provinceList.value[selectedProvinceIndex.value]) == null ? void 0 : _a.value : void 0;
        const scenicParams = { limit: 3 };
        const foodParams = { limit: 6 };
        if (provinceValue && provinceValue !== "") {
          scenicParams.province = provinceValue;
          foodParams.province = provinceValue;
          console.log("[\u9996\u9875] \u9009\u62E9\u7701\u4EFD:", provinceValue, "\u7F8E\u98DF\u53C2\u6570:", foodParams);
        } else {
          console.log("[\u9996\u9875] \u672A\u9009\u62E9\u7701\u4EFD\u6216\u9009\u62E9\u5168\u90E8\u7701\u4EFD\uFF0C\u4E0D\u4F20\u9012province\u53C2\u6570");
        }
        const [routeRes, scenicRes, foodRes] = await Promise.all([
          api_content.recommendApi.routes(void 0, 10),
          utils_http.request({
            url: "/recommend/scenic-spots",
            method: "GET",
            data: scenicParams,
            showLoading: false
          }),
          utils_http.request({
            url: "/recommend/foods",
            method: "GET",
            data: foodParams,
            showLoading: false
          })
        ]);
        if (routeRes.statusCode === 200 && routeRes.data.code === 200) {
          routeList.value = routeRes.data.data || [];
        } else {
          toastFail(routeRes.data.msg || "\u63A8\u8350\u7EBF\u8DEF\u52A0\u8F7D\u5931\u8D25");
        }
        if (scenicRes.statusCode === 200 && scenicRes.data.code === 200) {
          scenicList.value = scenicRes.data.data || [];
          console.log("\u666F\u70B9\u6570\u636E:", scenicList.value);
          scenicList.value.forEach((item) => {
            console.log(`${item.name} - price:`, item.price, "type:", typeof item.price);
          });
        }
        if (foodRes.statusCode === 200 && foodRes.data.code === 200) {
          foodList.value = foodRes.data.data || [];
          console.log("[\u9996\u9875] \u7F8E\u98DF\u6570\u636E\u52A0\u8F7D\u6210\u529F\uFF0C\u6570\u91CF:", foodList.value.length, "\u7701\u4EFD:", provinceValue || "\u5168\u90E8");
          if (foodList.value.length > 0) {
            console.log("[\u9996\u9875] \u7F8E\u98DF\u5217\u8868:", foodList.value.map((f) => ({ name: f.name, address: f.address })));
          } else if (provinceValue) {
            console.warn("[\u9996\u9875] \u9009\u62E9\u4E86\u7701\u4EFD\u4F46\u672A\u8FD4\u56DE\u7F8E\u98DF\u6570\u636E\uFF0C\u53EF\u80FD\u8BE5\u7701\u4EFD\u6682\u65E0\u7F8E\u98DF\u6570\u636E");
            if (foodList.value.length === 0) {
              common_vendor.index.showToast({
                title: `\u8BE5\u7701\u4EFD\u6682\u65E0\u7F8E\u98DF\u6570\u636E`,
                icon: "none",
                duration: 2e3
              });
            }
          }
        } else {
          console.error("[\u9996\u9875] \u7F8E\u98DF\u6570\u636E\u52A0\u8F7D\u5931\u8D25:", foodRes.data);
          toastFail(((_b = foodRes.data) == null ? void 0 : _b.msg) || "\u63A8\u8350\u7F8E\u98DF\u52A0\u8F7D\u5931\u8D25");
        }
      } catch (error) {
        console.error("[\u9996\u9875] \u63A8\u8350\u6570\u636E\u52A0\u8F7D\u5F02\u5E38:", error);
        toastFail("\u9996\u9875\u63A8\u8350\u52A0\u8F7D\u5931\u8D25");
      } finally {
        loadingRecommend.value = false;
      }
    };
    const loadNotes = async (reset = false) => {
      var _a, _b;
      if (loadingNotes.value || noteFinished.value)
        return;
      loadingNotes.value = true;
      if (reset) {
        notePage.value = 1;
        noteFinished.value = false;
      }
      try {
        const res = await api_content.travelNoteApi.list({ pageNum: notePage.value, pageSize: 6 });
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          const rows = ((_a = data.data) == null ? void 0 : _a.rows) || ((_b = data.data) == null ? void 0 : _b.list) || data.data || [];
          const processedRows = rows.map((item) => ({
            ...item,
            isLiked: item.isLiked || false,
            commentCount: item.commentCount !== void 0 ? item.commentCount : item.comment_count || 0
          }));
          noteList.value = notePage.value === 1 ? processedRows : noteList.value.concat(processedRows);
          if (rows.length < 6)
            noteFinished.value = true;
          notePage.value += 1;
        }
      } finally {
        loadingNotes.value = false;
      }
    };
    const handleNoteCommentCountUpdate = (event) => {
      const note = noteList.value.find((n) => n.id === event.noteId);
      if (note) {
        note.commentCount = event.commentCount;
      }
    };
    common_vendor.onMounted(() => {
      fetchHomeData();
      loadNotes(true);
      common_vendor.index.$on("noteCommentCountUpdated", handleNoteCommentCountUpdate);
    });
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("noteCommentCountUpdated", handleNoteCommentCountUpdate);
    });
    common_vendor.onShow(() => {
      loadNotes(true);
    });
    common_vendor.onPullDownRefresh(async () => {
      await fetchHomeData();
      await loadNotes(true);
      common_vendor.index.stopPullDownRefresh();
    });
    common_vendor.onReachBottom(() => {
      loadNotes();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(handleLoginConfirm),
        b: common_vendor.o(handleLoginCancel),
        c: common_vendor.p({
          visible: showLoginPrompt.value
        }),
        d: common_vendor.p({
          theme: "outline",
          size: "28",
          fill: "#5f6c7b"
        }),
        e: searchPlaceholder,
        f: common_vendor.o(onSearchConfirm),
        g: searchKeyword.value,
        h: common_vendor.o(($event) => searchKeyword.value = $event.detail.value),
        i: common_vendor.o(onSearchClick),
        j: common_vendor.f(featureEntries.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.text),
            b: common_vendor.t(item.title),
            c: item.id,
            d: activeFeatureId.value === item.id ? 1 : "",
            e: common_vendor.o(($event) => onFeatureTouchStart(item.id)),
            f: common_vendor.o(($event) => onFeatureClick(item))
          };
        }),
        k: common_vendor.o(onFeatureTouchEnd),
        l: common_vendor.t(common_vendor.unref(selectedProvince) || "\u5168\u90E8\u7701\u4EFD"),
        m: provinceList.value,
        n: selectedProvinceIndex.value,
        o: common_vendor.o(onProvinceChange),
        p: common_vendor.f(common_vendor.unref(filteredScenicList), (item, k0, i0) => {
          return common_vendor.e({
            a: item.imageUrl,
            b: common_vendor.t(item.name),
            c: common_vendor.t(item.address || item.city || "\u672A\u77E5\u5730\u70B9"),
            d: common_vendor.t(item.price && item.price > 0 ? `\xA5${item.price}` : "\u514D\u8D39"),
            e: !item.price || item.price === 0 ? 1 : "",
            f: item.isWorldHeritage
          }, item.isWorldHeritage ? {} : {}, {
            g: item.openTime || item.suggestedVisitTime
          }, item.openTime || item.suggestedVisitTime ? common_vendor.e({
            h: item.openTime
          }, item.openTime ? {
            i: common_vendor.t(item.openTime)
          } : {}, {
            j: item.openTime && item.suggestedVisitTime
          }, item.openTime && item.suggestedVisitTime ? {} : {}, {
            k: item.suggestedVisitTime
          }, item.suggestedVisitTime ? {
            l: common_vendor.t(item.suggestedVisitTime)
          } : {}) : {}, {
            m: item.isMatchUserRoute
          }, item.isMatchUserRoute ? {} : {}, {
            n: item.tags && item.tags.length > 0
          }, item.tags && item.tags.length > 0 ? {
            o: common_vendor.f(item.tags, (tag, k1, i1) => {
              return {
                a: common_vendor.t(tag),
                b: tag
              };
            })
          } : {}, {
            p: item.id,
            q: common_vendor.o(($event) => onViewScenic(item))
          });
        }),
        q: loadingRecommend.value
      }, loadingRecommend.value ? {
        r: common_vendor.p({
          count: 4
        })
      } : {
        s: common_vendor.f(routeList.value.slice(0, 4), (route, k0, i0) => {
          return {
            a: route.coverImage,
            b: common_vendor.t(route.days),
            c: common_vendor.t(route.routeName),
            d: common_vendor.t(route.summary || "\u70B9\u51FB\u67E5\u770B\u7EBF\u8DEF\u8BE6\u60C5"),
            e: route.id,
            f: common_vendor.o(($event) => onViewRoute(route))
          };
        })
      }, {
        t: loadingNotes.value
      }, loadingNotes.value ? {
        v: common_vendor.p({
          count: 2
        })
      } : common_vendor.e({
        w: common_vendor.f(noteList.value, (note, k0, i0) => {
          return {
            a: note.coverImage,
            b: note.authorAvatar,
            c: common_vendor.t(note.authorName || "\u533F\u540D\u7528\u6237"),
            d: common_vendor.t(note.title),
            e: common_vendor.n({
              "icon-liked": note.isLiked
            }),
            f: note.isLiked && shouldAnimateMap.value[note.id] ? 1 : "",
            g: common_vendor.t(note.likeCount || 0),
            h: note.isLiked ? 1 : "",
            i: common_vendor.o(($event) => toggleLike(note)),
            j: common_vendor.t(note.commentCount || 0),
            k: common_vendor.o(($event) => handleComment(note)),
            l: note.id,
            m: common_vendor.o(($event) => onViewNote(note))
          };
        }),
        x: !noteList.value.length
      }, !noteList.value.length ? {
        y: common_vendor.o(onSearchClick),
        z: common_vendor.p({
          text: "\u6682\u65E0\u6E38\u8BB0",
          ["btn-text"]: "\u53BB\u641C\u7D22"
        })
      } : {}), {
        A: common_vendor.f(foodList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: item.imageUrl
          }, item.imageUrl ? {
            b: item.imageUrl
          } : {}, {
            c: common_vendor.t(item.name),
            d: item.avgPrice
          }, item.avgPrice ? {
            e: common_vendor.t(item.avgPrice)
          } : {}, {
            f: common_vendor.t(item.address || "\u5730\u5740\u672A\u77E5"),
            g: item.score
          }, item.score ? {
            h: common_vendor.t(item.score)
          } : {}, {
            i: item.id,
            j: common_vendor.o(($event) => onViewFood(item))
          });
        }),
        B: scrollTop.value,
        C: common_vendor.o(onScroll),
        D: showBackToTop.value ? 1 : "",
        E: common_vendor.o(scrollToTop)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-087d42bb"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/home/home.vue"]]);
wx.createPage(MiniProgramPage);
