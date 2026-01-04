"use strict";
var common_vendor = require("../../common/vendor.js");
var api_user = require("../../api/user.js");
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
    const userStats = common_vendor.ref({
      notes: 0,
      favorites: 0,
      checkins: 0,
      likes: 0,
      comments: 0
    });
    const showLoginForm = common_vendor.ref(false);
    const form = common_vendor.reactive({
      userId: "",
      nickname: ""
    });
    const loggingIn = common_vendor.ref(false);
    const loadUserStats = async () => {
      var _a;
      if (!((_a = user.value) == null ? void 0 : _a.id))
        return;
      try {
        const res = await api_user.userApi.getStats(user.value.id);
        if (res.statusCode === 200 && res.data.code === 200) {
          const stats = res.data.data || {};
          userStats.value = {
            notes: stats.noteCount || 0,
            favorites: stats.favoriteCount || 0,
            checkins: stats.checkinCount || 0,
            likes: stats.likeCount || 0,
            comments: stats.commentCount || 0
          };
        }
      } catch (e) {
      }
    };
    common_vendor.watch(user, (newUser) => {
      if (newUser) {
        showLoginForm.value = false;
        loadUserStats();
      }
    }, { immediate: true });
    common_vendor.onMounted(() => {
      utils_router.resetNavigationState();
      if (user.value) {
        loadUserStats();
      }
    });
    let lastClickTime = 0;
    const CLICK_DEBOUNCE_TIME = 300;
    const navigateToMyNotes = () => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME)
        return;
      lastClickTime = now;
      if (!user.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        return;
      }
      utils_router.safeNavigateTo("/pages/profile/my-article").catch(() => {
      });
    };
    const navigateToMyCheckins = () => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME)
        return;
      lastClickTime = now;
      if (!user.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        return;
      }
      utils_router.safeNavigateTo("/pages/footprint/footprint").catch(() => {
      });
    };
    const navigateToMyInteraction = () => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME)
        return;
      lastClickTime = now;
      if (!user.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        return;
      }
      utils_router.safeNavigateTo("/pages/profile/my-interaction").catch(() => {
      });
    };
    const navigateToFeedback = () => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME)
        return;
      lastClickTime = now;
      utils_router.safeNavigateTo("/pages/profile/feedback").catch(() => {
      });
    };
    const navigateToAbout = () => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME)
        return;
      lastClickTime = now;
      utils_router.safeNavigateTo("/pages/profile/about").catch(() => {
      });
    };
    const navigateToPreference = () => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME)
        return;
      lastClickTime = now;
      if (!user.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        return;
      }
      utils_router.safeNavigateTo("/pages/profile/preference").catch(() => {
      });
    };
    const navigateToHistory = () => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME)
        return;
      lastClickTime = now;
      if (!user.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        return;
      }
      utils_router.safeNavigateTo("/pages/profile/history").catch(() => {
      });
    };
    const navigateToUserHome = () => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME)
        return;
      lastClickTime = now;
      if (!user.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        return;
      }
      utils_router.safeNavigateTo(`/pages/profile/user-home?userId=${user.value.id}`).catch(() => {
      });
    };
    const openLogin = () => {
      showLoginForm.value = true;
    };
    const closeLogin = () => {
      showLoginForm.value = false;
    };
    const onTestLogin = async () => {
      if (!form.userId) {
        common_vendor.index.showToast({ title: "\u8BF7\u8F93\u5165\u7528\u6237ID", icon: "none" });
        return;
      }
      loggingIn.value = true;
      try {
        const res = await api_user.userApi.loginByUserId(Number(form.userId));
        if (res.statusCode === 200 && res.data.code === 200) {
          const data = res.data.data || {};
          store.setUser(
            {
              id: data.id,
              nickname: form.nickname || data.nickname || `\u7528\u6237${data.id}`,
              avatar: data.avatar,
              city: data.city,
              interests: data.tags || [],
              signature: data.signature
            },
            `test-token-${data.id}`
          );
          common_vendor.index.showToast({ title: "\u767B\u5F55\u6210\u529F", icon: "success" });
          showLoginForm.value = false;
          await loadUserStats();
        } else {
          common_vendor.index.showToast({ title: res.data.msg || "\u767B\u5F55\u5931\u8D25", icon: "none" });
        }
      } catch (e) {
        common_vendor.index.showToast({ title: "\u8BF7\u6C42\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u540E\u7AEF\u63A5\u53E3", icon: "none" });
      } finally {
        loggingIn.value = false;
      }
    };
    const logout = () => {
      store.logout();
      common_vendor.index.showToast({ title: "\u5DF2\u9000\u51FA", icon: "none" });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: showLoginForm.value
      }, showLoginForm.value ? {
        b: common_vendor.o(closeLogin),
        c: common_vendor.unref(form).userId,
        d: common_vendor.o(($event) => common_vendor.unref(form).userId = $event.detail.value),
        e: common_vendor.unref(form).nickname,
        f: common_vendor.o(($event) => common_vendor.unref(form).nickname = $event.detail.value),
        g: loggingIn.value,
        h: common_vendor.o(onTestLogin)
      } : {}, {
        i: !common_vendor.unref(user)
      }, !common_vendor.unref(user) ? {
        j: common_vendor.o(openLogin)
      } : {
        k: common_vendor.unref(user).avatar || defaultAvatar,
        l: common_vendor.t(common_vendor.unref(user).nickname),
        m: common_vendor.t(common_vendor.unref(user).signature || "\u8BA9AI\u4E3A\u60A8\u91CF\u8EAB\u6253\u9020\u4E0B\u4E00\u6B21\u65C5\u884C"),
        n: common_vendor.o(navigateToUserHome)
      }, {
        o: common_vendor.t(userStats.value.notes || 0),
        p: common_vendor.o(navigateToMyNotes),
        q: common_vendor.t((userStats.value.likes || 0) + (userStats.value.favorites || 0) + (userStats.value.comments || 0)),
        r: common_vendor.o(navigateToMyInteraction),
        s: common_vendor.t(userStats.value.checkins || 0),
        t: common_vendor.o(navigateToMyCheckins),
        v: common_vendor.o(navigateToPreference),
        w: common_vendor.o(navigateToHistory),
        x: common_vendor.o(navigateToMyInteraction),
        y: common_vendor.o(navigateToMyNotes),
        z: common_vendor.o(navigateToMyCheckins),
        A: common_vendor.o(navigateToFeedback),
        B: common_vendor.o(navigateToAbout),
        C: common_vendor.unref(user)
      }, common_vendor.unref(user) ? {
        D: common_vendor.o(logout)
      } : {});
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-c010c622"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/profile/profile.vue"]]);
wx.createPage(MiniProgramPage);
