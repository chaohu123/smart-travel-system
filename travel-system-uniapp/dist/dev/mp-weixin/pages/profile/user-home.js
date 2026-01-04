"use strict";
var common_vendor = require("../../common/vendor.js");
var api_user = require("../../api/user.js");
var store_user = require("../../store/user.js");
var utils_storage = require("../../utils/storage.js");
var utils_router = require("../../utils/router.js");
require("../../utils/http.js");
require("../../utils/config.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = store_user.useUserStore();
    const currentUser = common_vendor.computed(() => store.state.profile);
    const defaultAvatar = "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200";
    const targetUserId = common_vendor.ref(null);
    const userInfo = common_vendor.ref({
      id: null,
      nickname: "",
      avatar: "",
      level: 1,
      experience: 0,
      medals: []
    });
    const userStats = common_vendor.ref({
      notes: 0,
      likes: 0,
      favorites: 0,
      comments: 0,
      checkins: 0,
      totalLikes: 0,
      followers: 0,
      following: 0
    });
    const unreadMessageCount = common_vendor.ref(0);
    const latestMessage = common_vendor.ref("");
    const interactionList = common_vendor.ref([]);
    const isOwnProfile = common_vendor.computed(() => {
      var _a;
      if (!targetUserId.value)
        return true;
      return ((_a = currentUser.value) == null ? void 0 : _a.id) === targetUserId.value;
    });
    const currentExp = common_vendor.computed(() => userInfo.value.experience || 0);
    const nextLevelExp = common_vendor.computed(() => {
      const level = userInfo.value.level || 1;
      return 100 * (level + 1);
    });
    const prevLevelExp = common_vendor.computed(() => {
      const level = userInfo.value.level || 1;
      if (level === 1) {
        return 0;
      }
      return 100 * (level - 1);
    });
    const expProgress = common_vendor.computed(() => {
      const current = currentExp.value;
      const next = nextLevelExp.value;
      const prev = prevLevelExp.value;
      if (next === prev)
        return 100;
      if (current <= prev)
        return 0;
      const progress = (current - prev) / (next - prev) * 100;
      const result = Math.max(0, Math.min(100, progress));
      return result;
    });
    const loading = common_vendor.ref(false);
    common_vendor.ref(false);
    const isFollowing = common_vendor.ref(false);
    const showAvatarPreview = common_vendor.ref(false);
    const hasCheckedInToday = common_vendor.ref(false);
    const loadUserInfo = async () => {
      var _a, _b, _c;
      const userId = targetUserId.value || ((_a = currentUser.value) == null ? void 0 : _a.id);
      if (!userId) {
        common_vendor.index.showToast({ title: "\u7528\u6237\u4E0D\u5B58\u5728", icon: "none" });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
        return;
      }
      loading.value = true;
      try {
        const profileRes = await api_user.userApi.getProfile(userId);
        if (profileRes.statusCode === 200 && profileRes.data.code === 200) {
          const data = profileRes.data.data || {};
          const userInfoData = data.userInfo || data;
          userInfo.value = {
            id: userInfoData.id,
            nickname: userInfoData.nickname || "\u672A\u8BBE\u7F6E\u6635\u79F0",
            avatar: userInfoData.avatar || "",
            level: userInfoData.level || 1,
            experience: userInfoData.experience || 0,
            medals: userInfoData.medals || [],
            signature: userInfoData.signature || ""
          };
        }
        const statsRes = await api_user.userApi.getStats(userId);
        if (statsRes.statusCode === 200 && statsRes.data.code === 200) {
          const stats = statsRes.data.data || {};
          userStats.value = {
            notes: stats.noteCount || 0,
            likes: stats.likeCount || 0,
            favorites: stats.favoriteCount || 0,
            comments: stats.commentCount || 0,
            checkins: stats.checkinCount || 0,
            totalLikes: stats.totalLikes || stats.likeCount || 0,
            followers: stats.followerCount || stats.followers || 0,
            following: stats.followingCount || stats.following || 0
          };
        }
        if (!isOwnProfile.value && ((_b = currentUser.value) == null ? void 0 : _b.id)) {
          try {
            const followingRes = await api_user.userApi.getFollowing(currentUser.value.id, 1, 100);
            if (followingRes.statusCode === 200 && followingRes.data.code === 200) {
              const followingList = ((_c = followingRes.data.data) == null ? void 0 : _c.list) || [];
              isFollowing.value = followingList.some((u) => u.id === userId);
            }
          } catch (error) {
          }
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "\u52A0\u8F7D\u5931\u8D25", icon: "none" });
      } finally {
        loading.value = false;
        checkTodayCheckInStatus();
      }
    };
    const previewAvatar = () => {
      if (isOwnProfile.value) {
        showAvatarPreview.value = true;
      }
    };
    const closeAvatarPreview = () => {
      showAvatarPreview.value = false;
    };
    const changeAvatar = () => {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: async (res) => {
          res.tempFilePaths[0];
          common_vendor.index.showToast({ title: "\u5934\u50CF\u4E0A\u4F20\u529F\u80FD\u5F00\u53D1\u4E2D", icon: "none" });
        }
      });
    };
    let lastClickTime = 0;
    const CLICK_DEBOUNCE_TIME = 300;
    const editProfile = () => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME)
        return;
      lastClickTime = now;
      utils_router.safeNavigateTo("/pages/profile/edit-profile").catch(() => {
      });
    };
    const openChat = () => {
      var _a;
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME)
        return;
      lastClickTime = now;
      const targetId = targetUserId.value || ((_a = userInfo.value) == null ? void 0 : _a.id);
      if (!targetId) {
        common_vendor.index.showToast({ title: "\u7528\u6237\u4E0D\u5B58\u5728", icon: "none" });
        return;
      }
      utils_router.safeNavigateTo(`/pages/profile/chat?userId=${targetId}&nickname=${encodeURIComponent(userInfo.value.nickname || "")}&avatar=${encodeURIComponent(userInfo.value.avatar || "")}`).catch(() => {
      });
    };
    const checkTodayCheckInStatus = () => {
      if (!isOwnProfile.value)
        return;
      const today = new Date().toDateString();
      const lastCheckInDate = utils_storage.getCache("lastCheckInDate");
      hasCheckedInToday.value = lastCheckInDate === today;
    };
    const checkIn = async () => {
      var _a, _b, _c, _d;
      const userId = (_a = currentUser.value) == null ? void 0 : _a.id;
      if (!userId) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        return;
      }
      const today = new Date().toDateString();
      const lastCheckInDate = utils_storage.getCache("lastCheckInDate");
      if (lastCheckInDate === today) {
        common_vendor.index.showToast({ title: "\u4ECA\u5929\u5DF2\u7ECF\u7B7E\u5230\u8FC7\u4E86", icon: "none" });
        return;
      }
      try {
        const res = await api_user.userApi.checkIn(userId);
        if (res.statusCode === 200 && res.data.code === 200) {
          utils_storage.setCache("lastCheckInDate", today, 24 * 60);
          hasCheckedInToday.value = true;
          common_vendor.index.showToast({ title: "\u7B7E\u5230\u6210\u529F\uFF01+10\u7ECF\u9A8C", icon: "success" });
          await loadUserInfo();
          checkTodayCheckInStatus();
        } else {
          common_vendor.index.showToast({ title: res.data.msg || "\u7B7E\u5230\u5931\u8D25", icon: "none" });
        }
      } catch (error) {
        if (((_b = error == null ? void 0 : error.data) == null ? void 0 : _b.code) === 400 && ((_d = (_c = error == null ? void 0 : error.data) == null ? void 0 : _c.msg) == null ? void 0 : _d.includes("\u5DF2\u7B7E\u5230"))) {
          utils_storage.setCache("lastCheckInDate", today, 24 * 60);
          hasCheckedInToday.value = true;
          checkTodayCheckInStatus();
          common_vendor.index.showToast({ title: "\u4ECA\u5929\u5DF2\u7ECF\u7B7E\u5230\u8FC7\u4E86", icon: "none" });
        } else {
          common_vendor.index.showToast({ title: "\u7B7E\u5230\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5", icon: "none" });
        }
      }
    };
    const followUser = async () => {
      var _a, _b;
      let currentUserId = (_a = currentUser.value) == null ? void 0 : _a.id;
      if (!currentUserId) {
        const cachedUser = utils_storage.getCache("user");
        if (cachedUser == null ? void 0 : cachedUser.id) {
          currentUserId = cachedUser.id;
          store.setUser(cachedUser);
        }
      }
      const targetId = targetUserId.value || ((_b = userInfo.value) == null ? void 0 : _b.id);
      if (!currentUserId) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        return;
      }
      if (!targetId) {
        common_vendor.index.showToast({ title: "\u7528\u6237\u4E0D\u5B58\u5728", icon: "none" });
        return;
      }
      try {
        const res = await api_user.userApi.toggleFollow(Number(currentUserId), Number(targetId));
        if (res.statusCode === 200 && res.data.code === 200) {
          isFollowing.value = !isFollowing.value;
          if (isFollowing.value) {
            userStats.value.followers = (userStats.value.followers || 0) + 1;
          } else {
            userStats.value.followers = Math.max(0, (userStats.value.followers || 0) - 1);
          }
          common_vendor.index.showToast({
            title: isFollowing.value ? "\u5173\u6CE8\u6210\u529F" : "\u53D6\u6D88\u5173\u6CE8",
            icon: "success"
          });
        } else {
          common_vendor.index.showToast({ title: res.data.msg || "\u64CD\u4F5C\u5931\u8D25", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5", icon: "none" });
      }
    };
    const viewNotes = () => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME)
        return;
      lastClickTime = now;
      if (isOwnProfile.value) {
        utils_router.safeNavigateTo("/pages/travel-note/list?my=true").catch(() => {
        });
      }
    };
    const viewCheckins = () => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME)
        return;
      lastClickTime = now;
      if (isOwnProfile.value) {
        utils_router.safeNavigateTo("/pages/footprint/footprint").catch(() => {
        });
      }
    };
    const viewFollowers = () => {
      var _a;
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME)
        return;
      lastClickTime = now;
      const userId = targetUserId.value || ((_a = currentUser.value) == null ? void 0 : _a.id);
      if (userId) {
        utils_router.safeNavigateTo(`/pages/profile/followers?userId=${userId}`).catch(() => {
        });
      }
    };
    const viewFollowing = () => {
      var _a;
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME)
        return;
      lastClickTime = now;
      const userId = targetUserId.value || ((_a = currentUser.value) == null ? void 0 : _a.id);
      if (userId) {
        utils_router.safeNavigateTo(`/pages/profile/following?userId=${userId}`).catch(() => {
        });
      }
    };
    const loadUnreadMessageCount = () => {
      const count = utils_storage.getCache("unread_message_count");
      unreadMessageCount.value = count || 0;
    };
    const viewMessages = () => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME)
        return;
      lastClickTime = now;
      utils_router.safeNavigateTo("/pages/profile/messages").catch(() => {
      });
    };
    const viewAllInteractions = () => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME)
        return;
      lastClickTime = now;
      utils_router.safeNavigateTo("/pages/profile/my-interaction").catch(() => {
      });
    };
    const handleInteractionClick = (item) => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME)
        return;
      lastClickTime = now;
      if (item.type === "like" || item.type === "comment") {
        if (item.contentId) {
          utils_router.safeNavigateTo(`/pages/travel-note/detail?id=${item.contentId}`).catch(() => {
          });
        }
      } else if (item.type === "follow") {
        if (item.userId) {
          utils_router.safeNavigateTo(`/pages/profile/user-home?userId=${item.userId}`).catch(() => {
          });
        }
      } else if (item.type === "newNote") {
        if (item.noteId) {
          utils_router.safeNavigateTo(`/pages/travel-note/detail?id=${item.noteId}`).catch(() => {
          });
        } else if (item.userId) {
          utils_router.safeNavigateTo(`/pages/profile/user-home?userId=${item.userId}`).catch(() => {
          });
        }
      }
    };
    const formatInteractionText = (item) => {
      const userName = item.userName || "\u67D0\u7528\u6237";
      if (item.type === "like") {
        return `${userName} \u8D5E\u4E86\u4F60\u7684\u6E38\u8BB0`;
      } else if (item.type === "comment") {
        return `${userName} \u8BC4\u8BBA\u4E86\u4F60\u7684\u6E38\u8BB0`;
      } else if (item.type === "follow") {
        return `${userName} \u5173\u6CE8\u4E86\u4F60`;
      } else if (item.type === "newNote") {
        return `${userName} \u53D1\u5E03\u4E86\u65B0\u6E38\u8BB0\u300A${item.noteTitle || "\u65B0\u6E38\u8BB0"}\u300B`;
      }
      return "";
    };
    const getInteractionIcon = (type) => {
      if (type === "like")
        return "\u{1F44D}";
      if (type === "comment")
        return "\u{1F4AC}";
      if (type === "follow")
        return "\u2795";
      if (type === "newNote")
        return "\u{1F4DD}";
      return "\u{1F514}";
    };
    const loadInteractions = async () => {
      if (!isOwnProfile.value)
        return;
      try {
        const mockInteractions = [
          {
            type: "newNote",
            userName: "\u65C5\u884C\u8FBE\u4EBA",
            userAvatar: "",
            userId: 3,
            noteId: 1,
            noteTitle: "\u6210\u90FD\u7F8E\u98DF\u4E4B\u65C5",
            createTime: new Date().toISOString()
          },
          {
            type: "newNote",
            userName: "\u63A2\u7D22\u8005",
            userAvatar: "",
            userId: 4,
            noteId: 2,
            noteTitle: "\u897F\u5B89\u53E4\u57CE\u6E38\u8BB0",
            createTime: new Date(Date.now() - 36e5).toISOString()
          },
          {
            type: "like",
            userName: "\u65C5\u884C\u8FBE\u4EBA",
            userAvatar: "",
            contentId: 1,
            createTime: new Date(Date.now() - 72e5).toISOString()
          },
          {
            type: "comment",
            userName: "\u63A2\u7D22\u8005",
            userAvatar: "",
            contentId: 2,
            createTime: new Date(Date.now() - 108e5).toISOString()
          },
          {
            type: "follow",
            userName: "\u65B0\u670B\u53CB",
            userAvatar: "",
            userId: 123,
            createTime: new Date(Date.now() - 144e5).toISOString()
          }
        ];
        interactionList.value = mockInteractions.slice(0, 5);
      } catch (error) {
      }
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
    common_vendor.onMounted(() => {
      var _a;
      utils_router.resetNavigationState();
      const pages = getCurrentPages();
      if (pages && pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        const options = currentPage.options || {};
        if (options.userId) {
          const userId = Number(options.userId);
          if (!isNaN(userId) && userId > 0) {
            targetUserId.value = userId;
          }
        }
      }
      if (!((_a = currentUser.value) == null ? void 0 : _a.id)) {
        const cachedUser = utils_storage.getCache("user");
        if (cachedUser == null ? void 0 : cachedUser.id) {
          store.setUser(cachedUser);
        }
      }
      loadUserInfo();
      loadInteractions();
      checkTodayCheckInStatus();
      loadUnreadMessageCount();
    });
    common_vendor.onShow(() => {
      var _a;
      if (!((_a = currentUser.value) == null ? void 0 : _a.id)) {
        const cachedUser = utils_storage.getCache("user");
        if (cachedUser == null ? void 0 : cachedUser.id) {
          store.setUser(cachedUser);
        }
      }
      loadUserInfo();
      checkTodayCheckInStatus();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: userInfo.value.avatar || defaultAvatar,
        b: common_vendor.unref(isOwnProfile)
      }, common_vendor.unref(isOwnProfile) ? {
        c: common_vendor.o(changeAvatar)
      } : {}, {
        d: common_vendor.o(previewAvatar),
        e: common_vendor.t(userInfo.value.nickname || "\u672A\u8BBE\u7F6E\u6635\u79F0"),
        f: common_vendor.t(userInfo.value.level || 1),
        g: common_vendor.unref(expProgress) + "%",
        h: common_vendor.t(common_vendor.unref(currentExp)),
        i: common_vendor.t(common_vendor.unref(nextLevelExp)),
        j: common_vendor.t(userStats.value.followers || 0),
        k: common_vendor.o(viewFollowers),
        l: common_vendor.t(userStats.value.following || 0),
        m: common_vendor.o(viewFollowing),
        n: common_vendor.t(userInfo.value.signature || "\u8FD9\u4E2A\u4EBA\u5F88\u61D2\uFF0C\u8FD8\u6CA1\u6709\u8BBE\u7F6E\u4E2A\u6027\u7B7E\u540D~"),
        o: common_vendor.unref(isOwnProfile)
      }, common_vendor.unref(isOwnProfile) ? {
        p: common_vendor.o(editProfile)
      } : {
        q: common_vendor.t(isFollowing.value ? "\u5DF2\u5173\u6CE8" : "\u5173\u6CE8"),
        r: common_vendor.o(followUser),
        s: common_vendor.o(openChat)
      }, {
        t: common_vendor.unref(isOwnProfile)
      }, common_vendor.unref(isOwnProfile) ? {
        v: common_vendor.t(hasCheckedInToday.value ? "\u5DF2\u7B7E\u5230" : "\u7B7E\u5230"),
        w: hasCheckedInToday.value ? 1 : "",
        x: common_vendor.o(checkIn)
      } : {}, {
        y: common_vendor.t(userStats.value.notes || 0),
        z: common_vendor.o(viewNotes),
        A: common_vendor.t(userStats.value.totalLikes || 0),
        B: common_vendor.t(userStats.value.checkins || 0),
        C: common_vendor.o(viewCheckins),
        D: common_vendor.unref(isOwnProfile)
      }, common_vendor.unref(isOwnProfile) ? common_vendor.e({
        E: unreadMessageCount.value > 0
      }, unreadMessageCount.value > 0 ? {
        F: common_vendor.t(unreadMessageCount.value > 99 ? "99+" : unreadMessageCount.value)
      } : {}, {
        G: latestMessage.value
      }, latestMessage.value ? {
        H: common_vendor.t(latestMessage.value)
      } : {}, {
        I: common_vendor.o(viewMessages)
      }) : {}, {
        J: common_vendor.unref(isOwnProfile)
      }, common_vendor.unref(isOwnProfile) ? common_vendor.e({
        K: common_vendor.o(viewAllInteractions),
        L: common_vendor.f(interactionList.value, (item, index, i0) => {
          return common_vendor.e({
            a: item.userAvatar
          }, item.userAvatar ? {
            b: item.userAvatar
          } : {
            c: common_vendor.t(getInteractionIcon(item.type))
          }, {
            d: common_vendor.t(formatInteractionText(item)),
            e: common_vendor.t(formatTime(item.createTime)),
            f: index,
            g: common_vendor.o(($event) => handleInteractionClick(item))
          });
        }),
        M: interactionList.value.length === 0
      }, interactionList.value.length === 0 ? {} : {}) : {}, {
        N: showAvatarPreview.value
      }, showAvatarPreview.value ? {
        O: userInfo.value.avatar || defaultAvatar,
        P: common_vendor.o(() => {
        }),
        Q: common_vendor.o(closeAvatarPreview)
      } : {});
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-21aed532"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/profile/user-home.vue"]]);
wx.createPage(MiniProgramPage);
