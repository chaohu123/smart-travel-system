"use strict";
var common_vendor = require("../../common/vendor.js");
var api_activity = require("../../api/activity.js");
var utils_image = require("../../utils/image.js");
require("../../utils/http.js");
require("../../utils/storage.js");
require("../../utils/config.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const activityId = common_vendor.ref(null);
    const loading = common_vendor.ref(false);
    const detail = common_vendor.ref(null);
    const imageList = common_vendor.computed(() => {
      var _a;
      if (!((_a = detail.value) == null ? void 0 : _a.imageUrl))
        return [];
      return [utils_image.getImageUrl(detail.value.imageUrl)];
    });
    const timeRange = common_vendor.computed(() => {
      if (!detail.value)
        return "";
      const start = detail.value.startTime;
      const end = detail.value.endTime;
      if (!start && !end)
        return "\u957F\u671F\u6709\u6548";
      if (start && end) {
        return `${formatDate(start)} ~ ${formatDate(end)}`;
      }
      if (start) {
        return `${formatDate(start)} \u5F00\u59CB`;
      }
      if (end) {
        return `${formatDate(end)} \u7ED3\u675F`;
      }
      return "";
    });
    const statusText = common_vendor.computed(() => {
      var _a;
      if (!((_a = detail.value) == null ? void 0 : _a.status))
        return "\u672A\u77E5";
      const status = detail.value.status;
      if (status === "online" || status === "active")
        return "\u8FDB\u884C\u4E2D";
      if (status === "upcoming")
        return "\u5373\u5C06\u5F00\u59CB";
      if (status === "ended" || status === "offline")
        return "\u5DF2\u7ED3\u675F";
      return "\u672A\u77E5";
    });
    const statusClass = common_vendor.computed(() => {
      var _a;
      if (!((_a = detail.value) == null ? void 0 : _a.status))
        return "status-unknown";
      const status = detail.value.status;
      if (status === "online" || status === "active")
        return "status-active";
      if (status === "upcoming")
        return "status-upcoming";
      if (status === "ended" || status === "offline")
        return "status-ended";
      return "status-unknown";
    });
    const canParticipate = common_vendor.computed(() => {
      var _a;
      if (!((_a = detail.value) == null ? void 0 : _a.status))
        return false;
      return detail.value.status === "online" || detail.value.status === "active";
    });
    const participateText = common_vendor.computed(() => {
      if (!canParticipate.value)
        return "\u6D3B\u52A8\u5DF2\u7ED3\u675F";
      return "\u7ACB\u5373\u53C2\u4E0E";
    });
    const relatedRoutes = common_vendor.computed(() => {
      var _a;
      return ((_a = detail.value) == null ? void 0 : _a.relatedRoutes) || [];
    });
    const relatedScenics = common_vendor.computed(() => {
      var _a;
      return ((_a = detail.value) == null ? void 0 : _a.relatedScenics) || [];
    });
    const relatedFoods = common_vendor.computed(() => {
      var _a;
      return ((_a = detail.value) == null ? void 0 : _a.relatedFoods) || [];
    });
    const relatedNotes = common_vendor.computed(() => {
      var _a;
      return ((_a = detail.value) == null ? void 0 : _a.relatedNotes) || [];
    });
    const formatDate = (dateStr) => {
      if (!dateStr)
        return "";
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    const formatCount = (count) => {
      if (!count)
        return "0";
      if (count < 1e3)
        return String(count);
      if (count < 1e4)
        return `${(count / 1e3).toFixed(1)}k`;
      return `${(count / 1e4).toFixed(1)}w`;
    };
    const loadDetail = async () => {
      if (!activityId.value)
        return;
      loading.value = true;
      try {
        const res = await api_activity.activityApi.getDetail(activityId.value);
        if (res.statusCode === 200 && res.data.code === 200) {
          detail.value = res.data.data;
        } else {
          await new Promise((resolve) => setTimeout(resolve, 500));
          detail.value = {
            id: activityId.value,
            name: "\u56FD\u5E86\u957F\u5047 \xB7 \u57CE\u5E02\u5468\u8FB9\u6E38",
            highlight: "\u7CBE\u90093\u6761\u5468\u8FB9\u7EBF\u8DEF\uFF0C\u5E26\u4F60\u63A2\u7D22\u57CE\u5E02\u5468\u8FB9\u7684\u7F8E\u4E3D\u98CE\u666F",
            description: "\u56FD\u5E86\u957F\u5047\u5373\u5C06\u5230\u6765\uFF0C\u4F60\u662F\u5426\u5DF2\u7ECF\u8BA1\u5212\u597D\u4E86\u51FA\u884C\u8DEF\u7EBF\uFF1F\u6211\u4EEC\u7CBE\u5FC3\u6311\u9009\u4E863\u6761\u57CE\u5E02\u5468\u8FB9\u6E38\u7EBF\u8DEF\uFF0C\u6DB5\u76D6\u81EA\u7136\u98CE\u5149\u3001\u5386\u53F2\u6587\u5316\u3001\u7F8E\u98DF\u4F53\u9A8C\u7B49\u591A\u79CD\u4E3B\u9898\uFF0C\u8BA9\u4F60\u5728\u5047\u671F\u4E2D\u5145\u5206\u653E\u677E\u8EAB\u5FC3\uFF0C\u4EAB\u53D7\u65C5\u884C\u7684\u4E50\u8DA3\u3002",
            rules: "1. \u6D3B\u52A8\u65F6\u95F4\u4E3A2025\u5E7410\u67081\u65E5\u81F310\u67087\u65E5\n2. \u53C2\u4E0E\u6D3B\u52A8\u9700\u8981\u5B8C\u6210\u6307\u5B9A\u6253\u5361\u70B9\u6253\u5361\n3. \u5B8C\u6210\u6240\u6709\u6253\u5361\u4EFB\u52A1\u53EF\u83B7\u5F97\u7CBE\u7F8E\u793C\u54C1\n4. \u6D3B\u52A8\u6700\u7EC8\u89E3\u91CA\u6743\u5F52\u5E73\u53F0\u6240\u6709",
            imageUrl: "https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=800",
            startTime: "2025-10-01T00:00:00",
            endTime: "2025-10-07T23:59:59",
            status: "online",
            relatedRoutes: [
              {
                id: 1,
                routeName: "\u5468\u8FB9\u81EA\u7136\u98CE\u51492\u65E5\u6E38",
                coverImage: "https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=400",
                days: 2,
                favoriteCount: 1234
              },
              {
                id: 2,
                routeName: "\u5386\u53F2\u6587\u5316\u63A2\u7D223\u65E5\u6E38",
                coverImage: "https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=400",
                days: 3,
                favoriteCount: 856
              }
            ],
            relatedScenics: [
              {
                id: 1,
                name: "\u81EA\u7136\u516C\u56ED",
                imageUrl: "https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=400",
                score: 4.8,
                city: "\u5317\u4EAC"
              },
              {
                id: 2,
                name: "\u5386\u53F2\u535A\u7269\u9986",
                imageUrl: "https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=400",
                score: 4.6,
                city: "\u5317\u4EAC"
              }
            ],
            relatedFoods: [
              {
                id: 1,
                name: "\u7279\u8272\u5C0F\u5403\u8857",
                imageUrl: "https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=400",
                foodType: "\u5C0F\u5403",
                avgPrice: 50
              }
            ],
            relatedNotes: [
              {
                id: 1,
                title: "\u56FD\u5E86\u5468\u8FB9\u6E38\u653B\u7565\u5206\u4EAB",
                coverImage: "https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=400",
                authorName: "\u65C5\u884C\u8FBE\u4EBA",
                viewCount: 5678
              }
            ]
          };
        }
      } catch (error) {
        console.warn("\u6D3B\u52A8API\u672A\u5C31\u7EEA\uFF0C\u4F7F\u7528\u6A21\u62DF\u6570\u636E", error);
        await new Promise((resolve) => setTimeout(resolve, 500));
        detail.value = {
          id: activityId.value,
          name: "\u56FD\u5E86\u957F\u5047 \xB7 \u57CE\u5E02\u5468\u8FB9\u6E38",
          highlight: "\u7CBE\u90093\u6761\u5468\u8FB9\u7EBF\u8DEF\uFF0C\u5E26\u4F60\u63A2\u7D22\u57CE\u5E02\u5468\u8FB9\u7684\u7F8E\u4E3D\u98CE\u666F",
          description: "\u56FD\u5E86\u957F\u5047\u5373\u5C06\u5230\u6765\uFF0C\u4F60\u662F\u5426\u5DF2\u7ECF\u8BA1\u5212\u597D\u4E86\u51FA\u884C\u8DEF\u7EBF\uFF1F\u6211\u4EEC\u7CBE\u5FC3\u6311\u9009\u4E863\u6761\u57CE\u5E02\u5468\u8FB9\u6E38\u7EBF\u8DEF\uFF0C\u6DB5\u76D6\u81EA\u7136\u98CE\u5149\u3001\u5386\u53F2\u6587\u5316\u3001\u7F8E\u98DF\u4F53\u9A8C\u7B49\u591A\u79CD\u4E3B\u9898\uFF0C\u8BA9\u4F60\u5728\u5047\u671F\u4E2D\u5145\u5206\u653E\u677E\u8EAB\u5FC3\uFF0C\u4EAB\u53D7\u65C5\u884C\u7684\u4E50\u8DA3\u3002",
          rules: "1. \u6D3B\u52A8\u65F6\u95F4\u4E3A2025\u5E7410\u67081\u65E5\u81F310\u67087\u65E5\n2. \u53C2\u4E0E\u6D3B\u52A8\u9700\u8981\u5B8C\u6210\u6307\u5B9A\u6253\u5361\u70B9\u6253\u5361\n3. \u5B8C\u6210\u6240\u6709\u6253\u5361\u4EFB\u52A1\u53EF\u83B7\u5F97\u7CBE\u7F8E\u793C\u54C1\n4. \u6D3B\u52A8\u6700\u7EC8\u89E3\u91CA\u6743\u5F52\u5E73\u53F0\u6240\u6709",
          imageUrl: "https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=800",
          startTime: "2025-10-01T00:00:00",
          endTime: "2025-10-07T23:59:59",
          status: "online",
          relatedRoutes: [],
          relatedScenics: [],
          relatedFoods: [],
          relatedNotes: []
        };
      } finally {
        loading.value = false;
      }
    };
    const viewRoute = (route) => {
      if (route.id) {
        common_vendor.index.navigateTo({
          url: `/pages/itinerary/itinerary-detail?id=${route.id}`
        });
      }
    };
    const viewScenic = (scenic) => {
      if (scenic.id) {
        common_vendor.index.navigateTo({
          url: `/pages/scenic/detail?id=${scenic.id}`
        });
      }
    };
    const viewFood = (food) => {
      if (food.id) {
        common_vendor.index.navigateTo({
          url: `/pages/food/detail?id=${food.id}`
        });
      }
    };
    const viewNote = (note) => {
      if (note.id) {
        common_vendor.index.navigateTo({
          url: `/pages/travel-note/detail?id=${note.id}`
        });
      }
    };
    const viewAllRoutes = () => {
      common_vendor.index.navigateTo({
        url: "/pages/route/hot-routes"
      });
    };
    const viewAllScenics = () => {
      common_vendor.index.switchTab({
        url: "/pages/home/home"
      });
    };
    const viewAllFoods = () => {
      common_vendor.index.switchTab({
        url: "/pages/home/home"
      });
    };
    const viewAllNotes = () => {
      common_vendor.index.switchTab({
        url: "/pages/travel-note/list"
      });
    };
    const handleShare = () => {
      common_vendor.index.showShareMenu({
        withShareTicket: true
      });
    };
    const handleParticipate = () => {
      if (!canParticipate.value) {
        common_vendor.index.showToast({
          title: "\u6D3B\u52A8\u5DF2\u7ED3\u675F",
          icon: "none"
        });
        return;
      }
      common_vendor.index.switchTab({
        url: "/pages/checkin/checkin"
      });
    };
    common_vendor.onLoad((options) => {
      const id = options.id;
      if (id) {
        activityId.value = typeof id === "string" ? parseInt(id) : id;
        loadDetail();
      } else {
        common_vendor.index.showToast({
          title: "\u6D3B\u52A8ID\u4E0D\u5B58\u5728",
          icon: "none"
        });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
      }
    });
    return (_ctx, _cache) => {
      var _a, _b;
      return common_vendor.e({
        a: (_a = detail.value) == null ? void 0 : _a.imageUrl
      }, ((_b = detail.value) == null ? void 0 : _b.imageUrl) ? {
        b: common_vendor.f(common_vendor.unref(imageList), (img, index, i0) => {
          return {
            a: img,
            b: index
          };
        })
      } : {}, {
        c: loading.value
      }, loading.value ? {} : detail.value ? common_vendor.e({
        e: common_vendor.t(detail.value.name),
        f: common_vendor.t(common_vendor.unref(statusText)),
        g: common_vendor.n(common_vendor.unref(statusClass)),
        h: detail.value.highlight
      }, detail.value.highlight ? {
        i: common_vendor.t(detail.value.highlight)
      } : {}, {
        j: common_vendor.unref(timeRange)
      }, common_vendor.unref(timeRange) ? {
        k: common_vendor.t(common_vendor.unref(timeRange))
      } : {}, {
        l: detail.value.description
      }, detail.value.description ? {
        m: common_vendor.t(detail.value.description)
      } : {}, {
        n: detail.value.rules
      }, detail.value.rules ? {
        o: common_vendor.t(detail.value.rules)
      } : {}, {
        p: common_vendor.unref(relatedRoutes).length > 0
      }, common_vendor.unref(relatedRoutes).length > 0 ? {
        q: common_vendor.o(viewAllRoutes),
        r: common_vendor.f(common_vendor.unref(relatedRoutes), (route, k0, i0) => {
          return {
            a: route.coverImage || "/static/default-route.jpg",
            b: common_vendor.t(route.routeName),
            c: common_vendor.t(route.days),
            d: common_vendor.t(formatCount(route.favoriteCount)),
            e: route.id,
            f: common_vendor.o(($event) => viewRoute(route))
          };
        })
      } : {}, {
        s: common_vendor.unref(relatedScenics).length > 0
      }, common_vendor.unref(relatedScenics).length > 0 ? {
        t: common_vendor.o(viewAllScenics),
        v: common_vendor.f(common_vendor.unref(relatedScenics), (scenic, k0, i0) => {
          return {
            a: scenic.imageUrl || "/static/default-scenic.jpg",
            b: common_vendor.t(scenic.name),
            c: common_vendor.t(scenic.score ? Number(scenic.score).toFixed(1) : "--"),
            d: common_vendor.t(scenic.city || ""),
            e: scenic.id,
            f: common_vendor.o(($event) => viewScenic(scenic))
          };
        })
      } : {}, {
        w: common_vendor.unref(relatedFoods).length > 0
      }, common_vendor.unref(relatedFoods).length > 0 ? {
        x: common_vendor.o(viewAllFoods),
        y: common_vendor.f(common_vendor.unref(relatedFoods), (food, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.unref(utils_image.getImageUrl)(food.imageUrl) || "/static/default-food.jpg",
            b: common_vendor.t(food.name),
            c: common_vendor.t(food.foodType || ""),
            d: food.avgPrice
          }, food.avgPrice ? {
            e: common_vendor.t(Number(food.avgPrice).toFixed(0))
          } : {}, {
            f: food.id,
            g: common_vendor.o(($event) => viewFood(food))
          });
        })
      } : {}, {
        z: common_vendor.unref(relatedNotes).length > 0
      }, common_vendor.unref(relatedNotes).length > 0 ? {
        A: common_vendor.o(viewAllNotes),
        B: common_vendor.f(common_vendor.unref(relatedNotes), (note, k0, i0) => {
          return {
            a: note.coverImage || "/static/default-note.jpg",
            b: common_vendor.t(note.title),
            c: common_vendor.t(note.authorName || "\u533F\u540D\u7528\u6237"),
            d: common_vendor.t(formatCount(note.viewCount)),
            e: note.id,
            f: common_vendor.o(($event) => viewNote(note))
          };
        })
      } : {}) : {}, {
        d: detail.value,
        C: common_vendor.o(handleShare),
        D: common_vendor.t(common_vendor.unref(participateText)),
        E: common_vendor.o(handleParticipate),
        F: !common_vendor.unref(canParticipate)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-71a995fd"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/activity/detail.vue"]]);
wx.createPage(MiniProgramPage);
