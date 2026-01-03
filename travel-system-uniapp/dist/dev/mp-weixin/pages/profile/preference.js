"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var api_user = require("../../api/user.js");
var store_user = require("../../store/user.js");
require("../../utils/http.js");
require("../../utils/storage.js");
require("../../utils/config.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const tagList = common_vendor.ref([]);
    const selectedTags = common_vendor.ref([]);
    const saving = common_vendor.ref(false);
    const preferences = common_vendor.reactive({
      hotWeight: 50,
      personalWeight: 50,
      freshWeight: 50,
      enablePush: true,
      enableLocation: true
    });
    const getTagIcon = (tagName) => {
      const iconMap = {
        "\u81EA\u7136\u98CE\u5149": "\u{1F3D4}\uFE0F",
        "\u5386\u53F2\u6587\u5316": "\u{1F3DB}\uFE0F",
        "\u7F8E\u98DF": "\u{1F35C}",
        "\u8D2D\u7269": "\u{1F6CD}\uFE0F",
        "\u5A31\u4E50": "\u{1F3A2}",
        "\u4F11\u95F2": "\u{1F334}",
        "\u8FD0\u52A8": "\u26BD",
        "\u6444\u5F71": "\u{1F4F7}",
        "\u4EB2\u5B50": "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}",
        "\u60C5\u4FA3": "\u{1F491}",
        "\u670B\u53CB": "\u{1F465}",
        "\u72EC\u81EA": "\u{1F6B6}"
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
    };
    const onHotWeightChange = (e) => {
      preferences.hotWeight = e.detail.value;
    };
    const onPersonalWeightChange = (e) => {
      preferences.personalWeight = e.detail.value;
    };
    const onFreshWeightChange = (e) => {
      preferences.freshWeight = e.detail.value;
    };
    const onPushChange = (e) => {
      preferences.enablePush = e.detail.value;
    };
    const onLocationChange = (e) => {
      preferences.enableLocation = e.detail.value;
    };
    const loadTags = async () => {
      try {
        const res = await api_content.tagApi.list();
        if (res.statusCode === 200 && res.data.code === 200) {
          tagList.value = res.data.data || [];
        }
      } catch (error) {
        console.error("\u52A0\u8F7D\u6807\u7B7E\u5931\u8D25", error);
      }
    };
    const loadPreferences = async () => {
      var _a;
      if (!((_a = user.value) == null ? void 0 : _a.id))
        return;
      try {
        const saved = common_vendor.index.getStorageSync(`preferences_${user.value.id}`);
        if (saved) {
          Object.assign(preferences, saved.preferences || {});
          selectedTags.value = saved.selectedTags || [];
        } else {
          if (user.value.interests && user.value.interests.length > 0) {
            const interestNames = user.value.interests;
            const matchedTags = tagList.value.filter(
              (tag) => interestNames.includes(tag.name)
            );
            selectedTags.value = matchedTags.map((tag) => tag.id);
          }
        }
      } catch (error) {
        console.error("\u52A0\u8F7D\u504F\u597D\u8BBE\u7F6E\u5931\u8D25", error);
      }
    };
    const savePreferences = async () => {
      var _a;
      if (!((_a = user.value) == null ? void 0 : _a.id)) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        return;
      }
      saving.value = true;
      try {
        if (selectedTags.value.length > 0) {
          const selectedTagNames = tagList.value.filter((tag) => selectedTags.value.includes(tag.id)).map((tag) => tag.name);
          await api_user.userApi.updateInterests(user.value.id, selectedTagNames);
        }
        const dataToSave = {
          preferences: { ...preferences },
          selectedTags: [...selectedTags.value]
        };
        common_vendor.index.setStorageSync(`preferences_${user.value.id}`, dataToSave);
        common_vendor.index.showToast({ title: "\u8BBE\u7F6E\u5DF2\u4FDD\u5B58", icon: "success" });
        if (selectedTags.value.length > 0) {
          const selectedTagNames = tagList.value.filter((tag) => selectedTags.value.includes(tag.id)).map((tag) => tag.name);
          store.setUser({ ...user.value, interests: selectedTagNames }, store.state.token);
        }
      } catch (error) {
        console.error("\u4FDD\u5B58\u504F\u597D\u8BBE\u7F6E\u5931\u8D25", error);
        common_vendor.index.showToast({ title: "\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5", icon: "none" });
      } finally {
        saving.value = false;
      }
    };
    common_vendor.onMounted(async () => {
      await loadTags();
      await loadPreferences();
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(tagList.value, (tag, k0, i0) => {
          return {
            a: common_vendor.t(getTagIcon(tag.name)),
            b: common_vendor.t(tag.name),
            c: tag.id,
            d: selectedTags.value.includes(tag.id) ? 1 : "",
            e: common_vendor.o(($event) => toggleTag(tag.id))
          };
        }),
        b: common_vendor.unref(preferences).hotWeight,
        c: common_vendor.o(onHotWeightChange),
        d: common_vendor.t(common_vendor.unref(preferences).hotWeight),
        e: common_vendor.unref(preferences).personalWeight,
        f: common_vendor.o(onPersonalWeightChange),
        g: common_vendor.t(common_vendor.unref(preferences).personalWeight),
        h: common_vendor.unref(preferences).freshWeight,
        i: common_vendor.o(onFreshWeightChange),
        j: common_vendor.t(common_vendor.unref(preferences).freshWeight),
        k: common_vendor.unref(preferences).enablePush,
        l: common_vendor.o(onPushChange),
        m: common_vendor.unref(preferences).enableLocation,
        n: common_vendor.o(onLocationChange),
        o: common_vendor.t(saving.value ? "\u4FDD\u5B58\u4E2D..." : "\u4FDD\u5B58\u8BBE\u7F6E"),
        p: saving.value ? 1 : "",
        q: saving.value,
        r: common_vendor.o(savePreferences)
      };
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-03adf605"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/profile/preference.vue"]]);
wx.createPage(MiniProgramPage);
