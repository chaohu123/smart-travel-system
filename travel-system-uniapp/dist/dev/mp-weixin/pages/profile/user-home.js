"use strict";
var common_vendor = require("../../common/vendor.js");
var api_user = require("../../api/user.js");
var api_content = require("../../api/content.js");
var store_user = require("../../store/user.js");
require("../../utils/http.js");
require("../../utils/storage.js");
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
      checkins: 0
    });
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
    const expProgress = common_vendor.computed(() => {
      const current = currentExp.value;
      const next = nextLevelExp.value;
      const prev = 100 * (userInfo.value.level || 1);
      if (next === prev)
        return 100;
      return Math.floor((current - prev) / (next - prev) * 100);
    });
    const tabs = [
      { key: "notes", label: "\u6E38\u8BB0" }
    ];
    const currentTab = common_vendor.ref("notes");
    const contentList = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const refreshing = common_vendor.ref(false);
    const pageNum = common_vendor.ref(1);
    const pageSize = common_vendor.ref(10);
    const hasMore = common_vendor.ref(true);
    const isFollowing = common_vendor.ref(false);
    const showAvatarPreview = common_vendor.ref(false);
    const getMedalIcon = (medal) => {
      const iconMap = {
        "\u65B0\u624B": "\u{1F331}",
        "\u8FBE\u4EBA": "\u2B50",
        "\u4E13\u5BB6": "\u{1F3C6}",
        "\u5927\u5E08": "\u{1F451}",
        "\u65C5\u884C\u5BB6": "\u2708\uFE0F",
        "\u63A2\u7D22\u8005": "\u{1F5FA}\uFE0F"
      };
      return iconMap[medal.name || medal] || "\u{1F3C5}";
    };
    const loadUserInfo = async () => {
      var _a;
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
            medals: userInfoData.medals || []
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
            checkins: stats.checkinCount || 0
          };
        }
      } catch (error) {
        console.error("\u52A0\u8F7D\u7528\u6237\u4FE1\u606F\u5931\u8D25", error);
        common_vendor.index.showToast({ title: "\u52A0\u8F7D\u5931\u8D25", icon: "none" });
      } finally {
        loading.value = false;
      }
    };
    const loadContent = async (reset = false) => {
      var _a;
      const userId = targetUserId.value || ((_a = currentUser.value) == null ? void 0 : _a.id);
      if (!userId)
        return;
      if (reset) {
        pageNum.value = 1;
        hasMore.value = true;
        contentList.value = [];
      }
      if (loading.value || !reset && !hasMore.value)
        return;
      loading.value = true;
      try {
        if (currentTab.value === "notes") {
          const res = await api_content.travelNoteApi.listMyNotes(userId, pageNum.value, pageSize.value);
          if (res.statusCode === 200 && res.data.code === 200) {
            const data = res.data.data || {};
            const list = data.list || [];
            if (reset) {
              contentList.value = list;
            } else {
              contentList.value.push(...list);
            }
            hasMore.value = list.length >= pageSize.value;
            if (hasMore.value) {
              pageNum.value++;
            }
          }
        }
      } catch (error) {
        console.error("\u52A0\u8F7D\u5185\u5BB9\u5931\u8D25", error);
      } finally {
        loading.value = false;
        refreshing.value = false;
      }
    };
    const switchTab = (key) => {
      currentTab.value = key;
      loadContent(true);
    };
    const onRefresh = () => {
      refreshing.value = true;
      loadUserInfo();
      loadContent(true);
    };
    const loadMore = () => {
      if (!loading.value && hasMore.value) {
        loadContent(false);
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
    const editProfile = () => {
      common_vendor.index.navigateTo({ url: "/pages/profile/edit-profile" });
    };
    const checkIn = async () => {
      try {
        common_vendor.index.showToast({ title: "\u7B7E\u5230\u6210\u529F\uFF01+5\u7ECF\u9A8C", icon: "success" });
        await loadUserInfo();
      } catch (error) {
        common_vendor.index.showToast({ title: "\u7B7E\u5230\u5931\u8D25", icon: "none" });
      }
    };
    const followUser = async () => {
      isFollowing.value = !isFollowing.value;
      common_vendor.index.showToast({
        title: isFollowing.value ? "\u5173\u6CE8\u6210\u529F" : "\u53D6\u6D88\u5173\u6CE8",
        icon: "success"
      });
    };
    const viewNotes = () => {
      if (isOwnProfile.value) {
        common_vendor.index.navigateTo({ url: "/pages/travel-note/list?my=true" });
      }
    };
    const viewInteractions = () => {
      if (isOwnProfile.value) {
        common_vendor.index.navigateTo({ url: "/pages/profile/my-interaction" });
      }
    };
    const viewCheckins = () => {
      if (isOwnProfile.value) {
        common_vendor.index.navigateTo({ url: "/pages/footprint/footprint" });
      }
    };
    const viewNoteDetail = (id) => {
      common_vendor.index.navigateTo({ url: `/pages/travel-note/detail?id=${id}` });
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
    const getImageUrl = (url) => {
      if (!url)
        return "";
      if (url.startsWith("http"))
        return url;
      return `https://your-api-domain.com${url}`;
    };
    const getEmptyIcon = () => {
      if (currentTab.value === "notes")
        return "\u{1F4DD}";
      return "\u{1F4ED}";
    };
    const getEmptyText = () => {
      if (currentTab.value === "notes") {
        return isOwnProfile.value ? "\u8FD8\u6CA1\u6709\u53D1\u5E03\u8FC7\u6E38\u8BB0" : "\u8BE5\u7528\u6237\u8FD8\u6CA1\u6709\u53D1\u5E03\u6E38\u8BB0";
      }
      return "\u6682\u65E0\u5185\u5BB9";
    };
    common_vendor.onMounted(() => {
      const pages = getCurrentPages();
      if (pages && pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        const options = currentPage.options || {};
        if (options.userId) {
          targetUserId.value = Number(options.userId);
        }
      }
      loadUserInfo();
      loadContent(true);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: userInfo.value.avatar || defaultAvatar,
        b: common_vendor.o(previewAvatar),
        c: common_vendor.unref(isOwnProfile)
      }, common_vendor.unref(isOwnProfile) ? {
        d: common_vendor.o(changeAvatar)
      } : {}, {
        e: common_vendor.t(userInfo.value.nickname || "\u672A\u8BBE\u7F6E\u6635\u79F0"),
        f: common_vendor.t(userInfo.value.level || 1),
        g: userInfo.value.medals && userInfo.value.medals.length > 0
      }, userInfo.value.medals && userInfo.value.medals.length > 0 ? common_vendor.e({
        h: common_vendor.f(userInfo.value.medals.slice(0, 3), (medal, index, i0) => {
          return {
            a: common_vendor.t(getMedalIcon(medal)),
            b: index
          };
        }),
        i: userInfo.value.medals.length > 3
      }, userInfo.value.medals.length > 3 ? {
        j: common_vendor.t(userInfo.value.medals.length - 3)
      } : {}) : {}, {
        k: common_vendor.unref(expProgress) + "%",
        l: common_vendor.t(common_vendor.unref(currentExp)),
        m: common_vendor.t(common_vendor.unref(nextLevelExp)),
        n: common_vendor.unref(isOwnProfile)
      }, common_vendor.unref(isOwnProfile) ? {
        o: common_vendor.o(editProfile)
      } : !common_vendor.unref(isOwnProfile) ? {
        q: common_vendor.n(isFollowing.value ? "icon-guanzhu" : "icon-guanzhu1"),
        r: common_vendor.t(isFollowing.value ? "\u5DF2\u5173\u6CE8" : "\u5173\u6CE8"),
        s: common_vendor.o(followUser)
      } : {}, {
        p: !common_vendor.unref(isOwnProfile),
        t: common_vendor.unref(isOwnProfile)
      }, common_vendor.unref(isOwnProfile) ? {
        v: common_vendor.o(checkIn)
      } : {}, {
        w: common_vendor.t(userStats.value.notes || 0),
        x: common_vendor.o(viewNotes),
        y: common_vendor.t((userStats.value.likes || 0) + (userStats.value.favorites || 0) + (userStats.value.comments || 0)),
        z: common_vendor.o(viewInteractions),
        A: common_vendor.t(userStats.value.checkins || 0),
        B: common_vendor.o(viewCheckins),
        C: common_vendor.f(tabs, (tab, k0, i0) => {
          return {
            a: common_vendor.t(tab.label),
            b: tab.key,
            c: currentTab.value === tab.key ? 1 : "",
            d: common_vendor.o(($event) => switchTab(tab.key))
          };
        }),
        D: currentTab.value === "notes"
      }, currentTab.value === "notes" ? {
        E: common_vendor.f(contentList.value, (note, k0, i0) => {
          return common_vendor.e({
            a: note.coverImage
          }, note.coverImage ? {
            b: getImageUrl(note.coverImage)
          } : {}, {
            c: common_vendor.t(note.title),
            d: common_vendor.t(formatTime(note.createTime)),
            e: common_vendor.t(note.likeCount || 0),
            f: common_vendor.t(note.commentCount || 0),
            g: note.id,
            h: common_vendor.o(($event) => viewNoteDetail(note.id))
          });
        })
      } : {}, {
        F: !loading.value && contentList.value.length === 0
      }, !loading.value && contentList.value.length === 0 ? {
        G: common_vendor.t(getEmptyIcon()),
        H: common_vendor.t(getEmptyText())
      } : {}, {
        I: hasMore.value && !loading.value
      }, hasMore.value && !loading.value ? {} : {}, {
        J: !hasMore.value && contentList.value.length > 0
      }, !hasMore.value && contentList.value.length > 0 ? {} : {}, {
        K: common_vendor.o(loadMore),
        L: refreshing.value,
        M: common_vendor.o(onRefresh),
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
