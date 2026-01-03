"use strict";
var common_vendor = require("../../common/vendor.js");
var api_user = require("../../api/user.js");
var store_user = require("../../store/user.js");
require("../../utils/http.js");
require("../../utils/storage.js");
require("../../utils/config.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = store_user.useUserStore();
    const currentUser = common_vendor.computed(() => store.state.profile);
    const currentUserId = common_vendor.computed(() => {
      var _a;
      return (_a = currentUser.value) == null ? void 0 : _a.id;
    });
    const defaultAvatar = "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200";
    const targetUserId = common_vendor.ref(null);
    const isOwnProfile = common_vendor.computed(() => {
      if (!targetUserId.value)
        return true;
      return currentUserId.value === targetUserId.value;
    });
    const followingList = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const refreshing = common_vendor.ref(false);
    const pageNum = common_vendor.ref(1);
    const pageSize = common_vendor.ref(20);
    const hasMore = common_vendor.ref(true);
    const loadFollowing = async (reset = false) => {
      const userId = targetUserId.value || currentUserId.value;
      if (!userId) {
        common_vendor.index.showToast({ title: "\u7528\u6237\u4E0D\u5B58\u5728", icon: "none" });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
        return;
      }
      if (reset) {
        pageNum.value = 1;
        hasMore.value = true;
        followingList.value = [];
      }
      if (loading.value || !reset && !hasMore.value)
        return;
      loading.value = true;
      try {
        const res = await api_user.userApi.getFollowing(userId, pageNum.value, pageSize.value);
        if (res.statusCode === 200 && res.data.code === 200) {
          const data = res.data.data || {};
          const list = data.list || [];
          if (reset) {
            followingList.value = list;
          } else {
            followingList.value.push(...list);
          }
          hasMore.value = list.length >= pageSize.value;
          if (hasMore.value) {
            pageNum.value++;
          }
        } else {
          common_vendor.index.showToast({ title: res.data.msg || "\u52A0\u8F7D\u5931\u8D25", icon: "none" });
        }
      } catch (error) {
        console.error("\u52A0\u8F7D\u5173\u6CE8\u5217\u8868\u5931\u8D25", error);
        common_vendor.index.showToast({ title: "\u52A0\u8F7D\u5931\u8D25", icon: "none" });
      } finally {
        loading.value = false;
        refreshing.value = false;
      }
    };
    const onRefresh = () => {
      refreshing.value = true;
      loadFollowing(true);
    };
    const loadMore = () => {
      if (!loading.value && hasMore.value) {
        loadFollowing(false);
      }
    };
    const viewUserProfile = (userId) => {
      common_vendor.index.navigateTo({ url: `/pages/profile/user-home?userId=${userId}` });
    };
    const toggleFollow = async (following) => {
      if (!currentUserId.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        return;
      }
      common_vendor.index.showModal({
        title: "\u786E\u8BA4\u53D6\u6D88\u5173\u6CE8",
        content: `\u786E\u5B9A\u8981\u53D6\u6D88\u5173\u6CE8 ${following.nickname || "\u8BE5\u7528\u6237"} \u5417\uFF1F`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await api_user.userApi.toggleFollow(currentUserId.value, following.id);
              if (result.statusCode === 200 && result.data.code === 200) {
                const index = followingList.value.findIndex((item) => item.id === following.id);
                if (index > -1) {
                  followingList.value.splice(index, 1);
                }
                common_vendor.index.showToast({ title: "\u5DF2\u53D6\u6D88\u5173\u6CE8", icon: "success" });
              } else {
                common_vendor.index.showToast({ title: result.data.msg || "\u64CD\u4F5C\u5931\u8D25", icon: "none" });
              }
            } catch (error) {
              console.error("\u53D6\u6D88\u5173\u6CE8\u5931\u8D25", error);
              common_vendor.index.showToast({ title: "\u64CD\u4F5C\u5931\u8D25", icon: "none" });
            }
          }
        }
      });
    };
    const goBack = () => {
      common_vendor.index.navigateBack();
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
      loadFollowing(true);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(goBack),
        b: loading.value && followingList.value.length === 0
      }, loading.value && followingList.value.length === 0 ? {
        c: common_vendor.f(5, (i, k0, i0) => {
          return {
            a: i
          };
        })
      } : followingList.value.length > 0 ? {
        e: common_vendor.f(followingList.value, (following, k0, i0) => {
          return common_vendor.e({
            a: following.avatar || defaultAvatar,
            b: common_vendor.t(following.nickname || "\u672A\u8BBE\u7F6E\u6635\u79F0")
          }, common_vendor.unref(isOwnProfile) ? {
            c: common_vendor.o(($event) => toggleFollow(following))
          } : {}, {
            d: following.id,
            e: common_vendor.o(($event) => viewUserProfile(following.id))
          });
        }),
        f: common_vendor.unref(isOwnProfile)
      } : {}, {
        d: followingList.value.length > 0,
        g: hasMore.value && !loading.value && followingList.value.length > 0
      }, hasMore.value && !loading.value && followingList.value.length > 0 ? {} : {}, {
        h: !hasMore.value && followingList.value.length > 0
      }, !hasMore.value && followingList.value.length > 0 ? {} : {}, {
        i: refreshing.value,
        j: common_vendor.o(onRefresh),
        k: common_vendor.o(loadMore)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-437ebe57"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/profile/following.vue"]]);
wx.createPage(MiniProgramPage);
