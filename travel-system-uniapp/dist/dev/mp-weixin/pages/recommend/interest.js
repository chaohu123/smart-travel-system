"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var utils_http = require("../../utils/http.js");
var store_user = require("../../store/user.js");
require("../../utils/storage.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const tagList = common_vendor.ref([]);
    const selectedTags = common_vendor.ref([]);
    const activeTab = common_vendor.ref("route");
    const contentList = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const refreshing = common_vendor.ref(false);
    const pageNum = common_vendor.ref(1);
    const pageSize = common_vendor.ref(10);
    const hasMore = common_vendor.ref(true);
    const contentTabs = [
      { type: "route", label: "\u8DEF\u7EBF", icon: "\u{1F5FA}\uFE0F" },
      { type: "scenic", label: "\u666F\u70B9", icon: "\u{1F3DE}\uFE0F" },
      { type: "food", label: "\u7F8E\u98DF", icon: "\u{1F35C}" },
      { type: "note", label: "\u6E38\u8BB0", icon: "\u{1F4DD}" }
    ];
    const getTagIcon = (tagName) => {
      const iconMap = {
        "\u7F8E\u98DF": "\u{1F35C}",
        "\u5386\u53F2": "\u{1F3DB}\uFE0F",
        "\u4EB2\u5B50": "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}",
        "\u81EA\u7136": "\u{1F332}",
        "\u6587\u5316": "\u{1F4DA}",
        "\u4F11\u95F2": "\u2615",
        "\u63A2\u9669": "\u26F0\uFE0F",
        "\u6444\u5F71": "\u{1F4F7}",
        "\u8D2D\u7269": "\u{1F6CD}\uFE0F",
        "\u591C\u751F\u6D3B": "\u{1F303}",
        "\u5B97\u6559": "\u{1F54C}",
        "\u5EFA\u7B51": "\u{1F3D7}\uFE0F",
        "\u827A\u672F": "\u{1F3A8}",
        "\u8FD0\u52A8": "\u26BD",
        "\u6E29\u6CC9": "\u2668\uFE0F"
      };
      return iconMap[tagName] || "\u{1F3F7}\uFE0F";
    };
    const toggleTag = (tagId) => {
      const index = selectedTags.value.indexOf(tagId);
      if (index > -1) {
        selectedTags.value.splice(index, 1);
      } else {
        selectedTags.value.push(tagId);
      }
      loadContent(true);
    };
    const switchTab = (type) => {
      if (activeTab.value === type)
        return;
      activeTab.value = type;
      loadContent(true);
    };
    const formatCount = (count) => {
      if (!count)
        return "0";
      if (count >= 1e4) {
        return (count / 1e4).toFixed(1) + "w";
      }
      return count.toString();
    };
    const loadTags = async () => {
      try {
        const res = await api_content.tagApi.list();
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          tagList.value = data.data || [];
        }
      } catch (error) {
        console.error("\u52A0\u8F7D\u6807\u7B7E\u5931\u8D25:", error);
      }
    };
    const loadContent = async (reset = false) => {
      var _a;
      if (loading.value || !hasMore.value && !reset)
        return;
      if (selectedTags.value.length === 0) {
        if (reset) {
          contentList.value = [];
        }
        return;
      }
      loading.value = true;
      if (reset) {
        pageNum.value = 1;
        hasMore.value = true;
        contentList.value = [];
      }
      try {
        const userId = (_a = user.value) == null ? void 0 : _a.id;
        const tagNames = tagList.value.filter((tag) => selectedTags.value.includes(tag.id)).map((tag) => tag.name).join(",");
        let res;
        const limit = pageSize.value * pageNum.value;
        switch (activeTab.value) {
          case "route":
            res = await api_content.recommendApi.routes(userId, limit);
            break;
          case "scenic":
            res = await utils_http.request({
              url: "/scenic/list",
              method: "GET",
              data: {
                pageNum: pageNum.value,
                pageSize: pageSize.value,
                tagName: tagNames || void 0
              },
              showLoading: false
            });
            break;
          case "food":
            res = await utils_http.request({
              url: "/food/list",
              method: "GET",
              data: {
                pageNum: pageNum.value,
                pageSize: pageSize.value,
                tagName: tagNames || void 0
              },
              showLoading: false
            });
            break;
          case "note":
            res = await api_content.travelNoteApi.list({
              pageNum: pageNum.value,
              pageSize: pageSize.value,
              tagName: tagNames || void 0
            });
            break;
        }
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          let newItems = [];
          if (activeTab.value === "route") {
            newItems = data.data || [];
          } else {
            const listData = data.data;
            if (listData == null ? void 0 : listData.rows) {
              newItems = listData.rows;
            } else if (listData == null ? void 0 : listData.list) {
              newItems = listData.list;
            } else if (Array.isArray(listData)) {
              newItems = listData;
            }
          }
          if (reset) {
            contentList.value = newItems;
          } else {
            const existingIds = new Set(contentList.value.map((item) => item.id));
            const uniqueNewItems = newItems.filter((item) => !existingIds.has(item.id));
            contentList.value = [...contentList.value, ...uniqueNewItems];
          }
          if (activeTab.value === "route") {
            hasMore.value = newItems.length >= limit;
          } else {
            const listData = data.data;
            const total = (listData == null ? void 0 : listData.total) || 0;
            hasMore.value = contentList.value.length < total;
          }
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
        console.error("\u52A0\u8F7D\u5185\u5BB9\u5931\u8D25:", error);
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
      loadContent(true);
    };
    const loadMore = () => {
      if (!loading.value && hasMore.value) {
        loadContent();
      }
    };
    const onViewRoute = (item) => {
      common_vendor.index.navigateTo({ url: `/pages/route/detail?id=${item.id}` });
    };
    const onViewScenic = (item) => {
      common_vendor.index.navigateTo({ url: `/pages/scenic/detail?id=${item.id}` });
    };
    const onViewFood = (item) => {
      common_vendor.index.navigateTo({ url: `/pages/food/detail?id=${item.id}` });
    };
    const onViewNote = (item) => {
      common_vendor.index.navigateTo({ url: `/pages/travel-note/detail?id=${item.id}` });
    };
    common_vendor.watch(selectedTags, () => {
      loadContent(true);
    }, { deep: true });
    common_vendor.onMounted(() => {
      loadTags();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(tagList.value, (tag, k0, i0) => {
          return {
            a: common_vendor.t(getTagIcon(tag.name)),
            b: common_vendor.t(tag.name),
            c: tag.id,
            d: selectedTags.value.includes(tag.id) ? 1 : "",
            e: common_vendor.o(($event) => toggleTag(tag.id))
          };
        }),
        b: common_vendor.f(contentTabs, (tab, k0, i0) => {
          return {
            a: common_vendor.t(tab.icon),
            b: common_vendor.t(tab.label),
            c: tab.type,
            d: activeTab.value === tab.type ? 1 : "",
            e: common_vendor.o(($event) => switchTab(tab.type))
          };
        }),
        c: loading.value && contentList.value.length === 0
      }, loading.value && contentList.value.length === 0 ? {
        d: common_vendor.f(4, (i, k0, i0) => {
          return {
            a: i
          };
        })
      } : common_vendor.e({
        e: activeTab.value === "route"
      }, activeTab.value === "route" ? {
        f: common_vendor.f(contentList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: item.coverImage || "/static/default-route.jpg",
            b: common_vendor.t(item.days),
            c: common_vendor.t(item.routeName),
            d: item.summary
          }, item.summary ? {
            e: common_vendor.t(item.summary)
          } : {}, {
            f: common_vendor.t(formatCount(item.viewCount)),
            g: common_vendor.t(formatCount(item.favoriteCount)),
            h: item.id,
            i: common_vendor.o(($event) => onViewRoute(item))
          });
        })
      } : {}, {
        g: activeTab.value === "scenic"
      }, activeTab.value === "scenic" ? {
        h: common_vendor.f(contentList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: item.imageUrl || "/static/default-scenic.jpg",
            b: item.score
          }, item.score ? {
            c: common_vendor.t(item.score)
          } : {}, {
            d: common_vendor.t(item.name),
            e: item.address
          }, item.address ? {
            f: common_vendor.t(item.address)
          } : {}, {
            g: item.tags && item.tags.length > 0
          }, item.tags && item.tags.length > 0 ? {
            h: common_vendor.f(item.tags.slice(0, 3), (tag, k1, i1) => {
              return {
                a: common_vendor.t(tag),
                b: tag
              };
            })
          } : {}, {
            i: item.id,
            j: common_vendor.o(($event) => onViewScenic(item))
          });
        })
      } : {}, {
        i: activeTab.value === "food"
      }, activeTab.value === "food" ? {
        j: common_vendor.f(contentList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: item.imageUrl || "/static/default-food.jpg",
            b: item.avgPrice
          }, item.avgPrice ? {
            c: common_vendor.t(item.avgPrice)
          } : {}, {
            d: common_vendor.t(item.name),
            e: item.address
          }, item.address ? {
            f: common_vendor.t(item.address)
          } : {}, {
            g: item.score
          }, item.score ? {
            h: common_vendor.t(item.score)
          } : {}, {
            i: item.foodType
          }, item.foodType ? {
            j: common_vendor.t(item.foodType)
          } : {}, {
            k: item.id,
            l: common_vendor.o(($event) => onViewFood(item))
          });
        })
      } : {}, {
        k: activeTab.value === "note"
      }, activeTab.value === "note" ? {
        l: common_vendor.f(contentList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: item.coverImage || "/static/default-note.jpg",
            b: common_vendor.t(item.title),
            c: item.authorName
          }, item.authorName ? {
            d: item.authorAvatar || "/static/default-avatar.png",
            e: common_vendor.t(item.authorName)
          } : {}, {
            f: common_vendor.t(formatCount(item.viewCount)),
            g: common_vendor.t(formatCount(item.likeCount)),
            h: common_vendor.t(formatCount(item.commentCount)),
            i: item.id,
            j: common_vendor.o(($event) => onViewNote(item))
          });
        })
      } : {}, {
        m: !loading.value && contentList.value.length === 0
      }, !loading.value && contentList.value.length === 0 ? {
        n: common_vendor.t(selectedTags.value.length === 0 ? "\u8BF7\u9009\u62E9\u5174\u8DA3\u6807\u7B7E" : "\u6682\u65E0\u63A8\u8350\u5185\u5BB9"),
        o: common_vendor.t(selectedTags.value.length === 0 ? "\u9009\u62E9\u6807\u7B7E\u540E\u4E3A\u4F60\u63A8\u8350\u76F8\u5173\u5185\u5BB9" : "\u6362\u4E2A\u6807\u7B7E\u8BD5\u8BD5\u5427")
      } : {}, {
        p: loading.value && contentList.value.length > 0
      }, loading.value && contentList.value.length > 0 ? {} : {}, {
        q: !hasMore.value && contentList.value.length > 0
      }, !hasMore.value && contentList.value.length > 0 ? {} : {}), {
        r: common_vendor.o(loadMore),
        s: refreshing.value,
        t: common_vendor.o(onRefresh)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-5ed50221"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/recommend/interest.vue"]]);
wx.createPage(MiniProgramPage);
