"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var utils_storage = require("../../utils/storage.js");
var store_user = require("../../store/user.js");
var utils_router = require("../../utils/router.js");
var utils_config = require("../../utils/config.js");
var utils_image = require("../../utils/image.js");
require("../../utils/http.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const defaultAvatar = "https://img0.baidu.com/it/u=3514125058,2569457770&fm=253&fmt=auto&app=138&f=PNG?w=256&h=256";
    const scenicId = common_vendor.ref(null);
    const loading = common_vendor.ref(false);
    const detail = common_vendor.ref(null);
    const isFavorite = common_vendor.ref(false);
    const isInPendingList = common_vendor.ref(false);
    const nearbyFoods = common_vendor.ref([]);
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    let lastClickTime = 0;
    const CLICK_DEBOUNCE_TIME = 300;
    const CACHE_KEY_PREFIX = "scenic_detail_";
    const CACHE_EXPIRE = 5 * 60;
    const checkinList = common_vendor.ref([]);
    const hasCheckedIn = common_vendor.ref(false);
    const myCheckin = common_vendor.ref(null);
    const FAVORITE_KEY = "scenic_favorites";
    const showCheckinModal = common_vendor.ref(false);
    const uploadImages = common_vendor.ref([]);
    const checkinComment = common_vendor.ref("");
    const locationOk = common_vendor.ref(false);
    const locationMsg = common_vendor.ref("");
    const showTicketModal = common_vendor.ref(false);
    const ticketCount = common_vendor.ref(1);
    const selectedPlayDate = common_vendor.ref("");
    const selectedTicketId = common_vendor.ref(1);
    const ticketOptions = common_vendor.computed(() => {
      var _a;
      const basePrice = Number(((_a = detail.value) == null ? void 0 : _a.price) || 0);
      if (!basePrice || basePrice <= 0)
        return [];
      return [
        {
          id: 1,
          name: "\u6210\u4EBA\u7968",
          originalPrice: basePrice,
          discountPrice: basePrice
        }
      ];
    });
    const ticketTotalPrice = common_vendor.computed(() => {
      const ticket = ticketOptions.value.find((item) => item.id === selectedTicketId.value);
      return ((ticket == null ? void 0 : ticket.discountPrice) || 0) * ticketCount.value;
    });
    const isFreeScenic = common_vendor.computed(() => {
      var _a, _b;
      return !((_a = detail.value) == null ? void 0 : _a.price) || Number((_b = detail.value) == null ? void 0 : _b.price) === 0;
    });
    common_vendor.watch(
      ticketOptions,
      (options) => {
        if (!options.length)
          return;
        const exists = options.some((item) => item.id === selectedTicketId.value);
        if (!exists) {
          selectedTicketId.value = options[0].id;
        }
      },
      { immediate: true }
    );
    const loadFavoriteStatus = () => {
      if (!scenicId.value)
        return;
      const favorites = utils_storage.getCache(FAVORITE_KEY) || [];
      isFavorite.value = favorites.includes(scenicId.value);
    };
    const checkPendingStatus = () => {
      if (!scenicId.value)
        return;
      const pendingAdditions = utils_storage.getCache("route_pending_additions") || [];
      isInPendingList.value = pendingAdditions.some((item) => item.type === "scenic" && item.id === scenicId.value);
    };
    const toggleFavorite = () => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
        return;
      }
      lastClickTime = now;
      if (!user.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        setTimeout(() => {
          utils_router.safeSwitchTab("/pages/profile/profile");
        }, 1500);
        return;
      }
      if (!scenicId.value)
        return;
      const favorites = utils_storage.getCache(FAVORITE_KEY) || [];
      const index = favorites.indexOf(scenicId.value);
      if (index > -1) {
        favorites.splice(index, 1);
        isFavorite.value = false;
        common_vendor.index.showToast({ title: "\u5DF2\u53D6\u6D88\u6536\u85CF", icon: "success" });
      } else {
        favorites.push(scenicId.value);
        isFavorite.value = true;
        common_vendor.index.showToast({ title: "\u6536\u85CF\u6210\u529F", icon: "success" });
      }
      utils_storage.setCache(FAVORITE_KEY, favorites, 365 * 24 * 60);
    };
    const loadDetail = async (useCache = true) => {
      if (!scenicId.value)
        return;
      if (useCache) {
        const cacheKey = `${CACHE_KEY_PREFIX}${scenicId.value}`;
        const cached = utils_storage.getCache(cacheKey);
        if (cached && Number(cached.id) === Number(scenicId.value)) {
          detail.value = cached;
          loadFavoriteStatus();
          checkPendingStatus();
          setTimeout(() => {
            loadNearbyFoods();
          }, 300);
          return;
        } else if (cached) {
          utils_storage.removeCache(cacheKey);
        }
      }
      loading.value = true;
      try {
        const res = await api_content.scenicSpotApi.getDetail(scenicId.value);
        if (res.statusCode === 200 && res.data.code === 200) {
          const data = res.data.data;
          if (data && data.spot) {
            detail.value = {
              ...data.spot,
              tags: data.tags || []
            };
          } else {
            detail.value = data;
          }
          if (scenicId.value) {
            const cacheKey = `${CACHE_KEY_PREFIX}${scenicId.value}`;
            utils_storage.setCache(cacheKey, detail.value, CACHE_EXPIRE);
          }
          loadFavoriteStatus();
          checkPendingStatus();
          setTimeout(() => {
            loadNearbyFoods();
          }, 300);
        } else {
          common_vendor.index.showToast({ title: res.data.msg || "\u52A0\u8F7D\u5931\u8D25", icon: "none" });
        }
      } catch (e) {
        common_vendor.index.showToast({ title: "\u7F51\u7EDC\u9519\u8BEF", icon: "none" });
      } finally {
        loading.value = false;
      }
    };
    const loadNearbyFoods = async () => {
      var _a;
      if (!((_a = detail.value) == null ? void 0 : _a.cityId))
        return;
      try {
        const res = await api_content.foodApi.getHot(detail.value.cityId, 3);
        if (res.statusCode === 200 && res.data.code === 200) {
          nearbyFoods.value = res.data.data || [];
        }
      } catch (e) {
      }
    };
    const loadScenicCheckins = async () => {
      var _a, _b, _c;
      if (!scenicId.value)
        return;
      try {
        const res = await api_content.checkinApi.getTargetCheckins("scenic", scenicId.value, 1, 10, (_a = user.value) == null ? void 0 : _a.id);
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          const list = data.data && data.data.list || [];
          checkinList.value = list || [];
          hasCheckedIn.value = !!((_b = data.data) == null ? void 0 : _b.hasCheckedIn);
          myCheckin.value = ((_c = data.data) == null ? void 0 : _c.myCheckin) || null;
        }
      } catch (e) {
      }
    };
    const onViewFood = (foodId) => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
        return;
      }
      lastClickTime = now;
      if (!foodId)
        return;
      utils_router.safeNavigateTo(`/pages/food/detail?id=${foodId}`).catch(() => {
        common_vendor.index.showToast({ title: "\u9875\u9762\u8DF3\u8F6C\u5931\u8D25", icon: "none" });
      });
    };
    const goCheckin = () => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
        return;
      }
      lastClickTime = now;
      if (!scenicId.value)
        return;
      if (hasCheckedIn.value) {
        common_vendor.index.showToast({ title: "\u4F60\u5DF2\u7ECF\u6253\u5361\u8FC7\u5566", icon: "none" });
        return;
      }
      openCheckinModal();
    };
    const addToRoute = () => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
        return;
      }
      lastClickTime = now;
      if (!scenicId.value || !detail.value)
        return;
      const pendingAdditions = utils_storage.getCache("route_pending_additions") || [];
      const exists = pendingAdditions.some((item) => item.type === "scenic" && item.id === scenicId.value);
      if (!exists) {
        pendingAdditions.push({
          type: "scenic",
          id: scenicId.value,
          name: detail.value.name || "\u666F\u70B9"
        });
        utils_storage.setCache("route_pending_additions", pendingAdditions, 60 * 24);
        isInPendingList.value = true;
        common_vendor.index.showToast({
          title: "\u5DF2\u6DFB\u52A0\u5230\u5F85\u9009\u5217\u8868",
          icon: "success",
          duration: 2e3
        });
      } else {
        const filtered = pendingAdditions.filter((item) => !(item.type === "scenic" && item.id === scenicId.value));
        if (filtered.length > 0) {
          utils_storage.setCache("route_pending_additions", filtered, 60 * 24);
        } else {
          utils_storage.removeCache("route_pending_additions");
        }
        isInPendingList.value = false;
        common_vendor.index.showToast({
          title: "\u5DF2\u4ECE\u5F85\u9009\u5217\u8868\u79FB\u9664",
          icon: "success",
          duration: 2e3
        });
      }
    };
    common_vendor.onMounted(() => {
      const pages = getCurrentPages();
      if (!pages || pages.length === 0)
        return;
      const currentPage = pages[pages.length - 1];
      const options = (currentPage == null ? void 0 : currentPage.options) || {};
      const id = options == null ? void 0 : options.id;
      if (id) {
        const numId = Number(id);
        if (!isNaN(numId) && numId > 0) {
          scenicId.value = numId;
          loadDetail();
          loadScenicCheckins();
        }
      }
    });
    common_vendor.onShow(() => {
      checkPendingStatus();
    });
    const showLoginPromptDialog = () => {
      common_vendor.index.showModal({
        title: "\u9700\u8981\u767B\u5F55",
        content: "\u6253\u5361\u524D\u9700\u8981\u5148\u767B\u5F55\u8D26\u53F7",
        confirmText: "\u53BB\u767B\u5F55",
        cancelText: "\u53D6\u6D88",
        success: (res) => {
          if (res.confirm) {
            utils_router.safeSwitchTab("/pages/profile/profile");
          }
        }
      });
    };
    const ensureLocation = () => {
      common_vendor.index.getLocation({
        type: "gcj02",
        altitude: false,
        geocode: false,
        success: () => {
          locationOk.value = true;
          locationMsg.value = "";
        },
        fail: (err) => {
          locationOk.value = false;
          let errorMsg = "\u5B9A\u4F4D\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u6216\u6388\u6743\u5B9A\u4F4D";
          if (err == null ? void 0 : err.errMsg) {
            const msg = err.errMsg;
            if (msg.includes("auth deny") || msg.includes("authorize")) {
              errorMsg = "\u9700\u8981\u4F4D\u7F6E\u6743\u9650\uFF0C\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u5F00\u542F";
              common_vendor.index.showModal({
                title: "\u9700\u8981\u4F4D\u7F6E\u6743\u9650",
                content: "\u4E3A\u4E86\u5B8C\u6210\u6253\u5361\uFF0C\u9700\u8981\u83B7\u53D6\u60A8\u7684\u4F4D\u7F6E\u4FE1\u606F\u3002\u662F\u5426\u524D\u5F80\u8BBE\u7F6E\u5F00\u542F\uFF1F",
                confirmText: "\u53BB\u8BBE\u7F6E",
                cancelText: "\u53D6\u6D88",
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    common_vendor.index.openSetting({
                      success: (settingRes) => {
                        var _a;
                        if ((_a = settingRes.authSetting) == null ? void 0 : _a["scope.userLocation"]) {
                          ensureLocation();
                        }
                      }
                    });
                  }
                }
              });
            } else if (msg.includes("timeout")) {
              errorMsg = "\u5B9A\u4F4D\u8D85\u65F6\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5";
            } else if (msg.includes("fail")) {
              errorMsg = "\u5B9A\u4F4D\u670D\u52A1\u4E0D\u53EF\u7528\uFF0C\u8BF7\u68C0\u67E5\u8BBE\u5907\u5B9A\u4F4D\u8BBE\u7F6E";
            }
          }
          locationMsg.value = errorMsg;
        }
      });
    };
    const openCheckinModal = () => {
      if (!user.value) {
        showLoginPromptDialog();
        return;
      }
      if (!detail.value || !scenicId.value)
        return;
      uploadImages.value = [];
      checkinComment.value = "";
      showCheckinModal.value = true;
      ensureLocation();
    };
    const closeCheckinModal = () => {
      showCheckinModal.value = false;
    };
    const chooseImage = () => {
      common_vendor.index.chooseImage({
        count: 1 - uploadImages.value.length,
        success: (res) => {
          uploadImages.value.push(...res.tempFilePaths);
        }
      });
    };
    const removeImage = (index) => {
      uploadImages.value.splice(index, 1);
    };
    const getUploadedPhotoUrl = async () => {
      var _a;
      const firstImage = uploadImages.value[0];
      if (!firstImage)
        return void 0;
      const uploadRes = await api_content.uploadApi.upload(firstImage);
      const uploadData = uploadRes.data;
      if (uploadRes.statusCode !== 200 || (uploadData == null ? void 0 : uploadData.code) !== 200) {
        throw new Error((uploadData == null ? void 0 : uploadData.msg) || "\u56FE\u7247\u4E0A\u4F20\u5931\u8D25");
      }
      if (typeof (uploadData == null ? void 0 : uploadData.data) === "string") {
        return uploadData.data;
      }
      return (_a = uploadData == null ? void 0 : uploadData.data) == null ? void 0 : _a.url;
    };
    const submitCheckin = async () => {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      const userId = (_a = user.value) == null ? void 0 : _a.id;
      if (!userId) {
        showLoginPromptDialog();
        return;
      }
      if (!scenicId.value)
        return;
      if (!locationOk.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u5F00\u542F\u5B9A\u4F4D\u6743\u9650", icon: "none" });
        return;
      }
      try {
        const photoUrl = await getUploadedPhotoUrl();
        await api_content.checkinApi.addCheckin({
          userId,
          targetType: "scenic",
          targetId: scenicId.value,
          photoUrl,
          content: checkinComment.value.trim() || void 0,
          latitude: (_b = detail.value) == null ? void 0 : _b.latitude,
          longitude: (_c = detail.value) == null ? void 0 : _c.longitude
        });
        common_vendor.index.showToast({ title: "\u6253\u5361\u6210\u529F", icon: "success" });
        const localCheckin = {
          id: Date.now(),
          userId,
          userNickname: ((_d = user.value) == null ? void 0 : _d.nickname) || "\u6211",
          userAvatar: (_e = user.value) == null ? void 0 : _e.avatar,
          targetType: "scenic",
          targetId: scenicId.value,
          photoUrl,
          content: checkinComment.value.trim(),
          latitude: (_f = detail.value) == null ? void 0 : _f.latitude,
          longitude: (_g = detail.value) == null ? void 0 : _g.longitude,
          checkinTime: new Date().toISOString()
        };
        hasCheckedIn.value = true;
        myCheckin.value = localCheckin;
        checkinList.value = [localCheckin, ...checkinList.value.filter((item) => item.userId !== userId)];
        closeCheckinModal();
        await loadScenicCheckins();
      } catch (error) {
        common_vendor.index.showToast({
          title: ((_h = error == null ? void 0 : error.data) == null ? void 0 : _h.msg) || (error == null ? void 0 : error.message) || "\u6253\u5361\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",
          icon: "none"
        });
      }
    };
    const openTicketModal = () => {
      if (!detail.value)
        return;
      if (isFreeScenic.value) {
        common_vendor.index.showToast({ title: "\u8BE5\u666F\u70B9\u514D\u8D39\uFF0C\u65E0\u9700\u9884\u8BA2\u95E8\u7968", icon: "none" });
        return;
      }
      if (!ticketOptions.value.length) {
        common_vendor.index.showToast({ title: "\u8BE5\u666F\u70B9\u6682\u672A\u914D\u7F6E\u53EF\u9884\u8BA2\u7968\u79CD", icon: "none" });
        return;
      }
      showTicketModal.value = true;
    };
    const closeTicketModal = () => {
      showTicketModal.value = false;
    };
    const onPlayDateChange = (e) => {
      selectedPlayDate.value = e.detail.value;
    };
    const changeTicketCount = (step) => {
      const next = ticketCount.value + step;
      if (next < 1 || next > 9)
        return;
      ticketCount.value = next;
    };
    const submitTicketOrder = () => {
      if (!selectedPlayDate.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u9009\u62E9\u6E38\u73A9\u65E5\u671F", icon: "none" });
        return;
      }
      if (!user.value) {
        showLoginPromptDialog();
        return;
      }
      common_vendor.index.showToast({ title: "\u95E8\u7968\u9884\u8BA2\u6210\u529F", icon: "success" });
      closeTicketModal();
    };
    return (_ctx, _cache) => {
      var _a, _b, _c;
      return common_vendor.e({
        a: common_vendor.unref(utils_image.getImageUrl)((_a = detail.value) == null ? void 0 : _a.imageUrl) || common_vendor.unref(utils_config.defaultScenicImage),
        b: loading.value
      }, loading.value ? {} : detail.value ? common_vendor.e({
        d: common_vendor.t(detail.value.name),
        e: detail.value.isWorldHeritage
      }, detail.value.isWorldHeritage ? {} : {}, {
        f: common_vendor.t(detail.value.province || ""),
        g: common_vendor.t(detail.value.province && detail.value.city ? "/" : ""),
        h: common_vendor.t(detail.value.city || ""),
        i: common_vendor.t(detail.value.score ? typeof detail.value.score === "number" ? detail.value.score.toFixed(1) : Number(detail.value.score).toFixed(1) : "--"),
        j: common_vendor.t(detail.value.hotScore || 0),
        k: common_vendor.t(detail.value.price && Number(detail.value.price) > 0 ? `\xA5${Number(detail.value.price)}` : "\u514D\u8D39"),
        l: !detail.value.price || Number(detail.value.price) === 0 ? 1 : "",
        m: detail.value.address
      }, detail.value.address ? {
        n: common_vendor.t(detail.value.address)
      } : {}, {
        o: detail.value.openTime
      }, detail.value.openTime ? {
        p: common_vendor.t(detail.value.openTime)
      } : {}, {
        q: detail.value.suggestedVisitTime
      }, detail.value.suggestedVisitTime ? {
        r: common_vendor.t(detail.value.suggestedVisitTime)
      } : {}, {
        s: detail.value.ticketInfo
      }, detail.value.ticketInfo ? {
        t: common_vendor.t(detail.value.ticketInfo)
      } : {}, {
        v: (!detail.value.price || Number(detail.value.price) === 0) && detail.value.freeNotice
      }, (!detail.value.price || Number(detail.value.price) === 0) && detail.value.freeNotice ? {
        w: common_vendor.t(detail.value.freeNotice)
      } : {}, {
        x: detail.value.intro
      }, detail.value.intro ? {
        y: common_vendor.t(detail.value.intro)
      } : {}, {
        z: detail.value.tags && detail.value.tags.length > 0
      }, detail.value.tags && detail.value.tags.length > 0 ? {
        A: common_vendor.f(detail.value.tags, (tag, k0, i0) => {
          return {
            a: common_vendor.t(tag),
            b: tag
          };
        })
      } : {}, {
        B: nearbyFoods.value.length > 0
      }, nearbyFoods.value.length > 0 ? {
        C: common_vendor.f(nearbyFoods.value, (food, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.unref(utils_image.getImageUrl)(food.imageUrl) || common_vendor.unref(utils_config.defaultFoodImage),
            b: common_vendor.t(food.name),
            c: food.score
          }, food.score ? {
            d: common_vendor.t(food.score)
          } : {}, {
            e: food.id,
            f: common_vendor.o(($event) => onViewFood(food.id))
          });
        })
      } : {}, {
        D: checkinList.value.length > 0
      }, checkinList.value.length > 0 ? {
        E: common_vendor.f(checkinList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.unref(utils_image.getImageUrl)(item.userAvatar) || defaultAvatar,
            b: common_vendor.t(item.userNickname || "\u6E38\u5BA2"),
            c: common_vendor.t(item.checkinTime),
            d: item.content
          }, item.content ? {
            e: common_vendor.t(item.content)
          } : {}, {
            f: item.photoUrl
          }, item.photoUrl ? {
            g: common_vendor.unref(utils_image.getImageUrl)(item.photoUrl)
          } : {}, {
            h: item.id
          });
        })
      } : {}) : {}, {
        c: detail.value,
        F: isFavorite.value ? 1 : "",
        G: common_vendor.o(toggleFavorite),
        H: common_vendor.t(hasCheckedIn.value ? "\u5DF2\u6253\u5361" : "\u53BB\u6253\u5361"),
        I: hasCheckedIn.value ? 1 : "",
        J: common_vendor.o(goCheckin),
        K: common_vendor.t(isInPendingList.value ? "\u5DF2\u6DFB\u52A0\u5230\u8DEF\u7EBF" : "\u6DFB\u52A0\u5230\u8DEF\u7EBF"),
        L: isInPendingList.value ? 1 : "",
        M: common_vendor.o(addToRoute),
        N: !common_vendor.unref(isFreeScenic)
      }, !common_vendor.unref(isFreeScenic) ? {
        O: common_vendor.o(openTicketModal)
      } : {}, {
        P: showCheckinModal.value
      }, showCheckinModal.value ? common_vendor.e({
        Q: common_vendor.t(((_b = detail.value) == null ? void 0 : _b.name) || ""),
        R: common_vendor.o(closeCheckinModal),
        S: locationMsg.value
      }, locationMsg.value ? {
        T: common_vendor.t(locationMsg.value)
      } : {}, {
        U: common_vendor.f(uploadImages.value, (img, index, i0) => {
          return {
            a: img,
            b: common_vendor.o(($event) => removeImage(index)),
            c: index
          };
        }),
        V: uploadImages.value.length < 1
      }, uploadImages.value.length < 1 ? {
        W: common_vendor.o(chooseImage)
      } : {}, {
        X: checkinComment.value,
        Y: common_vendor.o(($event) => checkinComment.value = $event.detail.value),
        Z: common_vendor.t(checkinComment.value.length),
        aa: common_vendor.o(submitCheckin),
        ab: common_vendor.o(() => {
        }),
        ac: common_vendor.o(closeCheckinModal)
      }) : {}, {
        ad: showTicketModal.value
      }, showTicketModal.value ? {
        ae: common_vendor.t(((_c = detail.value) == null ? void 0 : _c.name) || ""),
        af: common_vendor.o(closeTicketModal),
        ag: common_vendor.f(common_vendor.unref(ticketOptions), (ticket, k0, i0) => {
          return {
            a: common_vendor.t(ticket.name),
            b: common_vendor.t(ticket.originalPrice),
            c: common_vendor.t(ticket.discountPrice),
            d: ticket.id,
            e: selectedTicketId.value === ticket.id ? 1 : "",
            f: common_vendor.o(($event) => selectedTicketId.value = ticket.id)
          };
        }),
        ah: common_vendor.t(selectedPlayDate.value || "\u8BF7\u9009\u62E9\u65E5\u671F"),
        ai: selectedPlayDate.value,
        aj: common_vendor.o(onPlayDateChange),
        ak: common_vendor.o(($event) => changeTicketCount(-1)),
        al: common_vendor.t(ticketCount.value),
        am: common_vendor.o(($event) => changeTicketCount(1)),
        an: common_vendor.t(common_vendor.unref(ticketTotalPrice)),
        ao: common_vendor.o(submitTicketOrder),
        ap: common_vendor.o(() => {
        }),
        aq: common_vendor.o(closeTicketModal)
      } : {});
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-44e281b9"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/scenic/detail.vue"]]);
wx.createPage(MiniProgramPage);
