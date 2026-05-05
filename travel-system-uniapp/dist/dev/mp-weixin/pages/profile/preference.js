"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var api_user = require("../../api/user.js");
var store_user = require("../../store/user.js");
require("../../utils/http.js");
require("../../utils/storage.js");
require("../../utils/config.js");
require("../../utils/image.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const mintActive = "#7fc4b1";
    const mintBlock = "#5fa894";
    const statusBarHeight = common_vendor.ref(0);
    const navRightPadding = common_vendor.ref(0);
    const presetTagNames = [
      "\u81EA\u7136\u98CE\u5149",
      "\u53E4\u9547\u4EBA\u6587",
      "\u6D77\u5C9B\u5EA6\u5047",
      "\u7F8E\u98DF\u63A2\u5E97",
      "\u6237\u5916\u5F92\u6B65",
      "\u4EB2\u5B50\u6E38",
      "\u7F51\u7EA2\u6253\u5361",
      "\u5C0F\u4F17\u79D8\u5883"
    ];
    const tagList = common_vendor.ref([]);
    const selectedNames = common_vendor.ref([]);
    const saving = common_vendor.ref(false);
    const activeSliderKey = common_vendor.ref(null);
    const preferences = common_vendor.reactive({
      hotWeight: 50,
      personalWeight: 50,
      freshWeight: 50
    });
    const weightItems = common_vendor.computed(() => [
      {
        key: "hotWeight",
        title: "\u70ED\u95E8\u5EA6\u6743\u91CD",
        tip: "\u6570\u503C\u8D8A\u9AD8\uFF0C\u8D8A\u4F18\u5148\u63A8\u8350\u70ED\u95E8\u3001\u9AD8\u4E92\u52A8\u7684\u666F\u70B9\u4E0E\u7EBF\u8DEF"
      },
      {
        key: "personalWeight",
        title: "\u4E2A\u6027\u5316\u6743\u91CD",
        tip: "\u6570\u503C\u8D8A\u9AD8\uFF0C\u8D8A\u8D34\u5408\u60A8\u7684\u5174\u8DA3\u6807\u7B7E\u4E0E\u5386\u53F2\u884C\u4E3A"
      },
      {
        key: "freshWeight",
        title: "\u65B0\u9C9C\u5EA6\u6743\u91CD",
        tip: "\u6570\u503C\u8D8A\u9AD8\uFF0C\u8D8A\u4F18\u5148\u63A8\u8350\u65B0\u4E0A\u7EBF\u3001\u8FD1\u671F\u66F4\u65B0\u7684\u5185\u5BB9"
      }
    ]);
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    const toggleTagName = (name) => {
      const i = selectedNames.value.indexOf(name);
      if (i > -1)
        selectedNames.value.splice(i, 1);
      else
        selectedNames.value.push(name);
    };
    const onSliderChanging = (key) => {
      activeSliderKey.value = key;
    };
    const onWeightChange = (key, e) => {
      var _a, _b;
      preferences[key] = Number((_b = (_a = e == null ? void 0 : e.detail) == null ? void 0 : _a.value) != null ? _b : preferences[key]);
      activeSliderKey.value = null;
    };
    const resetWeights = () => {
      preferences.hotWeight = 50;
      preferences.personalWeight = 50;
      preferences.freshWeight = 50;
      common_vendor.index.showToast({ title: "\u5DF2\u6062\u590D\u9ED8\u8BA4\u6743\u91CD", icon: "none" });
    };
    const loadTags = async () => {
      try {
        const res = await api_content.tagApi.list();
        if (res.statusCode === 200 && res.data.code === 200) {
          tagList.value = res.data.data || [];
        }
      } catch {
      }
    };
    const loadPreferences = async () => {
      var _a, _b;
      if (!((_a = user.value) == null ? void 0 : _a.id))
        return;
      try {
        const saved = common_vendor.index.getStorageSync(`preferences_${user.value.id}`);
        if (saved == null ? void 0 : saved.preferences) {
          const p = saved.preferences;
          if (typeof p.hotWeight === "number")
            preferences.hotWeight = p.hotWeight;
          if (typeof p.personalWeight === "number")
            preferences.personalWeight = p.personalWeight;
          if (typeof p.freshWeight === "number")
            preferences.freshWeight = p.freshWeight;
        }
        if ((saved == null ? void 0 : saved.selectedNames) && Array.isArray(saved.selectedNames)) {
          selectedNames.value = saved.selectedNames.filter((n) => presetTagNames.includes(n));
        } else if ((saved == null ? void 0 : saved.selectedTags) && Array.isArray(saved.selectedTags) && tagList.value.length) {
          const names = tagList.value.filter((t) => saved.selectedTags.includes(t.id)).map((t) => t.name);
          selectedNames.value = names.filter((n) => presetTagNames.includes(n));
        } else if ((_b = user.value.interests) == null ? void 0 : _b.length) {
          selectedNames.value = user.value.interests.filter(
            (n) => presetTagNames.includes(n)
          );
        }
      } catch {
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
        if (selectedNames.value.length > 0) {
          await api_user.userApi.updateInterests(user.value.id, [...selectedNames.value]);
        }
        const dataToSave = {
          preferences: { ...preferences },
          selectedNames: [...selectedNames.value]
        };
        common_vendor.index.setStorageSync(`preferences_${user.value.id}`, dataToSave);
        common_vendor.index.showToast({ title: "\u8BBE\u7F6E\u5DF2\u4FDD\u5B58", icon: "success" });
        store.setUser({ ...user.value, interests: [...selectedNames.value] }, store.state.token);
      } catch {
        common_vendor.index.showToast({ title: "\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5", icon: "none" });
      } finally {
        saving.value = false;
      }
    };
    common_vendor.onMounted(async () => {
      try {
        const sys = common_vendor.index.getSystemInfoSync();
        statusBarHeight.value = sys.statusBarHeight || 0;
        const menu = common_vendor.index.getMenuButtonBoundingClientRect();
        if (menu && sys.windowWidth) {
          navRightPadding.value = Math.max(0, sys.windowWidth - menu.left);
        } else {
          navRightPadding.value = 96;
        }
      } catch {
        statusBarHeight.value = 0;
        navRightPadding.value = 0;
      }
      await loadTags();
      await loadPreferences();
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(goBack),
        b: statusBarHeight.value + "px",
        c: navRightPadding.value + "px",
        d: common_vendor.f(common_vendor.unref(presetTagNames), (name, k0, i0) => {
          return {
            a: common_vendor.t(name),
            b: name,
            c: selectedNames.value.includes(name) ? 1 : "",
            d: common_vendor.o(($event) => toggleTagName(name))
          };
        }),
        e: common_vendor.f(common_vendor.unref(weightItems), (item, k0, i0) => {
          return {
            a: common_vendor.t(item.title),
            b: common_vendor.t(common_vendor.unref(preferences)[item.key]),
            c: common_vendor.t(item.tip),
            d: common_vendor.unref(preferences)[item.key],
            e: common_vendor.o(() => onSliderChanging(item.key)),
            f: common_vendor.o((e) => onWeightChange(item.key, e)),
            g: item.key,
            h: activeSliderKey.value === item.key ? 1 : ""
          };
        }),
        f: mintActive,
        g: mintBlock,
        h: common_vendor.o(resetWeights),
        i: common_vendor.t(saving.value ? "\u4FDD\u5B58\u4E2D..." : "\u4FDD\u5B58\u8BBE\u7F6E"),
        j: saving.value ? 1 : "",
        k: saving.value,
        l: saving.value,
        m: common_vendor.o(savePreferences)
      };
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-03adf605"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/profile/preference.vue"]]);
wx.createPage(MiniProgramPage);
