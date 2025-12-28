"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var store_user = require("../../store/user.js");
require("../../utils/http.js");
require("../../utils/storage.js");
if (!Array) {
  const _component_CloseSmall = common_vendor.resolveComponent("CloseSmall");
  _component_CloseSmall();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const title = common_vendor.ref("");
    const content = common_vendor.ref("");
    const imageUrls = common_vendor.ref([]);
    const cityList = common_vendor.ref([]);
    const selectedCity = common_vendor.ref(null);
    const scenicOptions = common_vendor.ref([]);
    const scenicIds = common_vendor.ref([]);
    const tagOptions = common_vendor.ref([]);
    const tagIds = common_vendor.ref([]);
    const submitting = common_vendor.ref(false);
    const loadCities = async () => {
      const res = await api_content.cityApi.list();
      const data = res.data;
      if (res.statusCode === 200 && data.code === 200) {
        cityList.value = (data.data || []).map((c) => ({
          id: c.id,
          name: c.cityName || c.name
        }));
      }
    };
    const loadTags = async () => {
      const res = await api_content.tagApi.list();
      const data = res.data;
      if (res.statusCode === 200 && data.code === 200) {
        tagOptions.value = data.data || [];
      }
    };
    const loadScenic = async (cityId) => {
      var _a;
      const res = await api_content.scenicSpotApi.list({ pageNum: 1, pageSize: 20, cityId });
      const data = res.data;
      if (res.statusCode === 200 && data.code === 200) {
        scenicOptions.value = (((_a = data.data) == null ? void 0 : _a.list) || []).map((s) => ({
          id: s.id,
          name: s.name
        }));
      }
    };
    const onCityChange = (e) => {
      var _a;
      const index = e.detail.value;
      selectedCity.value = cityList.value[index];
      scenicIds.value = [];
      loadScenic((_a = selectedCity.value) == null ? void 0 : _a.id);
    };
    const toggleScenic = (id) => {
      const idx = scenicIds.value.indexOf(id);
      if (idx > -1) {
        scenicIds.value.splice(idx, 1);
      } else {
        scenicIds.value.push(id);
      }
    };
    const toggleTag = (id) => {
      const idx = tagIds.value.indexOf(id);
      if (idx > -1) {
        tagIds.value.splice(idx, 1);
      } else {
        tagIds.value.push(id);
      }
    };
    const chooseImages = () => {
      const remain = 9 - imageUrls.value.length;
      common_vendor.index.chooseImage({
        count: remain,
        success: async (res) => {
          var _a;
          for (const path of res.tempFilePaths) {
            const uploadRes = await api_content.uploadApi.upload(path);
            const data = JSON.parse(uploadRes.data);
            if (uploadRes.statusCode === 200 && data.code === 200) {
              const imageUrl = typeof data.data === "string" ? data.data : (_a = data.data) == null ? void 0 : _a.url;
              if (imageUrl) {
                imageUrls.value.push(imageUrl);
              } else {
                common_vendor.index.showToast({ title: "\u4E0A\u4F20\u5931\u8D25\uFF1A\u672A\u83B7\u53D6\u5230\u56FE\u7247URL", icon: "none" });
                break;
              }
            } else {
              common_vendor.index.showToast({ title: data.msg || "\u4E0A\u4F20\u5931\u8D25", icon: "none" });
              break;
            }
          }
        }
      });
    };
    const removeImage = (idx) => {
      imageUrls.value.splice(idx, 1);
    };
    const validate = () => {
      if (title.value.trim().length < 4) {
        common_vendor.index.showToast({ title: "\u6807\u9898\u81F3\u5C11 4 \u4E2A\u5B57", icon: "none" });
        return false;
      }
      if (content.value.trim().length < 20) {
        common_vendor.index.showToast({ title: "\u6B63\u6587\u81F3\u5C11 20 \u4E2A\u5B57", icon: "none" });
        return false;
      }
      if (imageUrls.value.length === 0) {
        common_vendor.index.showToast({ title: "\u8BF7\u81F3\u5C11\u4E0A\u4F20\u4E00\u5F20\u56FE\u7247", icon: "none" });
        return false;
      }
      if (!selectedCity.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u9009\u62E9\u57CE\u5E02", icon: "none" });
        return false;
      }
      return true;
    };
    const onSubmit = async () => {
      if (submitting.value)
        return;
      if (!validate())
        return;
      if (!user.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55\u540E\u518D\u53D1\u5E03", icon: "none" });
        common_vendor.index.switchTab({ url: "/pages/profile/profile" });
        return;
      }
      submitting.value = true;
      try {
        const res = await api_content.travelNoteApi.publish({
          userId: user.value.id,
          title: title.value.trim(),
          content: content.value.trim(),
          cityId: selectedCity.value.id,
          cityName: selectedCity.value.name,
          imageUrls: imageUrls.value,
          scenicIds: scenicIds.value,
          tagIds: tagIds.value
        });
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          common_vendor.index.showToast({ title: "\u53D1\u5E03\u6210\u529F", icon: "success" });
          setTimeout(() => {
            common_vendor.index.redirectTo({ url: `/pages/travel-note/detail?id=${data.data.noteId}` });
          }, 300);
        } else {
          common_vendor.index.showToast({ title: data.msg || "\u53D1\u5E03\u5931\u8D25", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "\u7F51\u7EDC\u9519\u8BEF", icon: "none" });
      } finally {
        submitting.value = false;
      }
    };
    common_vendor.onMounted(() => {
      loadCities();
      loadTags();
      loadScenic();
    });
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: title.value,
        b: common_vendor.o(($event) => title.value = $event.detail.value),
        c: common_vendor.t(title.value.length),
        d: content.value,
        e: common_vendor.o(($event) => content.value = $event.detail.value),
        f: common_vendor.t(content.value.length),
        g: common_vendor.f(imageUrls.value, (img, idx, i0) => {
          return {
            a: img,
            b: common_vendor.o(($event) => removeImage(idx)),
            c: "464afb1e-0-" + i0,
            d: idx
          };
        }),
        h: common_vendor.p({
          theme: "outline",
          size: "24",
          fill: "#ffffff"
        }),
        i: imageUrls.value.length < 9
      }, imageUrls.value.length < 9 ? {
        j: common_vendor.o(chooseImages)
      } : {}, {
        k: common_vendor.t(((_a = selectedCity.value) == null ? void 0 : _a.name) || "\u8BF7\u9009\u62E9\u57CE\u5E02"),
        l: cityList.value,
        m: common_vendor.o(onCityChange),
        n: common_vendor.f(scenicOptions.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.name),
            b: item.id,
            c: scenicIds.value.includes(item.id) ? 1 : "",
            d: common_vendor.o(($event) => toggleScenic(item.id))
          };
        }),
        o: common_vendor.f(tagOptions.value, (tag, k0, i0) => {
          return {
            a: common_vendor.t(tag.tagName),
            b: tag.id,
            c: tagIds.value.includes(tag.id) ? 1 : "",
            d: common_vendor.o(($event) => toggleTag(tag.id))
          };
        }),
        p: common_vendor.t(submitting.value ? "\u53D1\u5E03\u4E2D..." : "\u53D1\u5E03"),
        q: submitting.value,
        r: common_vendor.o(onSubmit)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-464afb1e"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/travel-note/publish.vue"]]);
wx.createPage(MiniProgramPage);
