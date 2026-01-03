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
    const user = common_vendor.computed(() => store.state.profile);
    const formData = common_vendor.reactive({
      avatar: "",
      nickname: "",
      signature: "",
      email: ""
    });
    const userInfo = common_vendor.ref({});
    const saving = common_vendor.ref(false);
    const loadUserInfo = async () => {
      var _a;
      if (!((_a = user.value) == null ? void 0 : _a.id)) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
        return;
      }
      try {
        const res = await api_user.userApi.getProfile(user.value.id);
        if (res.statusCode === 200 && res.data.code === 200) {
          const data = res.data.data || {};
          const userInfoData = data.userInfo || data;
          userInfo.value = userInfoData;
          formData.avatar = userInfoData.avatar || "";
          formData.nickname = userInfoData.nickname || "";
          formData.signature = userInfoData.signature || "";
          formData.email = userInfoData.email || "";
        }
      } catch (error) {
        console.error("\u52A0\u8F7D\u7528\u6237\u4FE1\u606F\u5931\u8D25", error);
        common_vendor.index.showToast({ title: "\u52A0\u8F7D\u5931\u8D25", icon: "none" });
      }
    };
    const chooseAvatar = () => {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: async (res) => {
          var _a;
          const tempFilePath = res.tempFilePaths[0];
          common_vendor.index.showLoading({ title: "\u4E0A\u4F20\u4E2D...", mask: true });
          try {
            const uploadRes = await api_content.uploadApi.upload(tempFilePath);
            if (uploadRes.statusCode === 200) {
              let result;
              if (typeof uploadRes.data === "string") {
                result = JSON.parse(uploadRes.data);
              } else {
                result = uploadRes.data;
              }
              if (result.code === 200 && ((_a = result.data) == null ? void 0 : _a.url)) {
                formData.avatar = result.data.url;
                common_vendor.index.hideLoading();
                common_vendor.index.showToast({ title: "\u4E0A\u4F20\u6210\u529F", icon: "success" });
              } else {
                common_vendor.index.hideLoading();
                common_vendor.index.showToast({ title: result.msg || "\u4E0A\u4F20\u5931\u8D25", icon: "none" });
              }
            } else {
              common_vendor.index.hideLoading();
              common_vendor.index.showToast({ title: "\u4E0A\u4F20\u5931\u8D25", icon: "none" });
            }
          } catch (error) {
            console.error("\u4E0A\u4F20\u5934\u50CF\u5931\u8D25", error);
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({ title: "\u4E0A\u4F20\u5931\u8D25", icon: "none" });
          }
        }
      });
    };
    const saveProfile = async () => {
      var _a;
      if (!((_a = user.value) == null ? void 0 : _a.id)) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        return;
      }
      if (!formData.nickname || formData.nickname.trim() === "") {
        common_vendor.index.showToast({ title: "\u8BF7\u8F93\u5165\u6635\u79F0", icon: "none" });
        return;
      }
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        common_vendor.index.showToast({ title: "\u8BF7\u8F93\u5165\u6B63\u786E\u7684\u90AE\u7BB1\u5730\u5740", icon: "none" });
        return;
      }
      if (saving.value)
        return;
      saving.value = true;
      try {
        const res = await api_user.userApi.updateProfile({
          id: user.value.id,
          nickname: formData.nickname.trim(),
          signature: formData.signature.trim(),
          email: formData.email.trim(),
          avatar: formData.avatar
        });
        if (res.statusCode === 200 && res.data.code === 200) {
          store.setUser({
            ...user.value,
            nickname: formData.nickname.trim(),
            signature: formData.signature.trim(),
            avatar: formData.avatar,
            email: formData.email.trim() || void 0
          });
          common_vendor.index.showToast({ title: "\u4FDD\u5B58\u6210\u529F", icon: "success" });
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 1500);
        } else {
          common_vendor.index.showToast({ title: res.data.msg || "\u4FDD\u5B58\u5931\u8D25", icon: "none" });
        }
      } catch (error) {
        console.error("\u4FDD\u5B58\u8D44\u6599\u5931\u8D25", error);
        common_vendor.index.showToast({ title: "\u4FDD\u5B58\u5931\u8D25", icon: "none" });
      } finally {
        saving.value = false;
      }
    };
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    common_vendor.onMounted(() => {
      loadUserInfo();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(goBack),
        b: common_vendor.o(saveProfile),
        c: common_vendor.unref(formData).avatar
      }, common_vendor.unref(formData).avatar ? {
        d: common_vendor.unref(formData).avatar
      } : {}, {
        e: common_vendor.o(chooseAvatar),
        f: common_vendor.unref(formData).nickname,
        g: common_vendor.o(($event) => common_vendor.unref(formData).nickname = $event.detail.value),
        h: common_vendor.unref(formData).signature,
        i: common_vendor.o(($event) => common_vendor.unref(formData).signature = $event.detail.value),
        j: common_vendor.t(common_vendor.unref(formData).signature.length),
        k: common_vendor.unref(formData).email,
        l: common_vendor.o(($event) => common_vendor.unref(formData).email = $event.detail.value)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-5eb8b010"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/profile/edit-profile.vue"]]);
wx.createPage(MiniProgramPage);
