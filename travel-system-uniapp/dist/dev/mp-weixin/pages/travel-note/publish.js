"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var store_user = require("../../store/user.js");
require("../../utils/http.js");
require("../../utils/storage.js");
require("../../utils/config.js");
if (!Array) {
  const _component_CloseSmall = common_vendor.resolveComponent("CloseSmall");
  _component_CloseSmall();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const noteId = common_vendor.ref(null);
    const isEditMode = common_vendor.computed(() => noteId.value !== null);
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
    const loading = common_vendor.ref(false);
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
    const loadNoteDetail = async (id) => {
      if (!user.value)
        return;
      loading.value = true;
      try {
        const res = await api_content.travelNoteApi.getDetail(id, user.value.id);
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          const note = data.data;
          title.value = note.title || "";
          content.value = note.content || "";
          imageUrls.value = note.imageUrls || note.images || [];
          if (note.cityId) {
            const city = cityList.value.find((c) => c.id === note.cityId);
            if (city) {
              selectedCity.value = city;
              await loadScenic(city.id);
            }
          }
          scenicIds.value = note.scenicIds || [];
          tagIds.value = note.tagIds || [];
        } else {
          common_vendor.index.showToast({ title: data.msg || "\u52A0\u8F7D\u5931\u8D25", icon: "none" });
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 1500);
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "\u52A0\u8F7D\u5931\u8D25", icon: "none" });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
      } finally {
        loading.value = false;
      }
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
        let res;
        if (isEditMode.value && noteId.value) {
          res = await api_content.travelNoteApi.update(noteId.value, {
            userId: user.value.id,
            title: title.value.trim(),
            content: content.value.trim(),
            cityId: selectedCity.value.id,
            cityName: selectedCity.value.name,
            imageUrls: imageUrls.value,
            scenicIds: scenicIds.value,
            tagIds: tagIds.value
          });
        } else {
          res = await api_content.travelNoteApi.publish({
            userId: user.value.id,
            title: title.value.trim(),
            content: content.value.trim(),
            cityId: selectedCity.value.id,
            cityName: selectedCity.value.name,
            imageUrls: imageUrls.value,
            scenicIds: scenicIds.value,
            tagIds: tagIds.value
          });
        }
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          if (isEditMode.value) {
            common_vendor.index.showToast({ title: "\u66F4\u65B0\u6210\u529F", icon: "success" });
            setTimeout(() => {
              if (noteId.value) {
                common_vendor.index.redirectTo({ url: `/pages/travel-note/detail?id=${noteId.value}` });
              } else {
                common_vendor.index.navigateBack();
              }
            }, 300);
          } else {
            common_vendor.index.showToast({ title: "\u5DF2\u63D0\u4EA4\uFF0C\u7B49\u5F85\u5BA1\u6838", icon: "success" });
            setTimeout(() => {
              common_vendor.index.redirectTo({ url: "/pages/profile/my-article?status=pending" });
            }, 1500);
          }
        } else {
          common_vendor.index.showToast({ title: data.msg || (isEditMode.value ? "\u66F4\u65B0\u5931\u8D25" : "\u53D1\u5E03\u5931\u8D25"), icon: "none" });
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "\u7F51\u7EDC\u9519\u8BEF", icon: "none" });
      } finally {
        submitting.value = false;
      }
    };
    common_vendor.onMounted(() => {
      common_vendor.nextTick(() => {
        try {
          let pages = [];
          if (typeof common_vendor.index !== "undefined" && common_vendor.index.getCurrentPages) {
            const getPagesFn = common_vendor.index.getCurrentPages;
            if (typeof getPagesFn === "function") {
              pages = getPagesFn();
            }
          }
          if (pages && pages.length > 0) {
            const currentPage = pages[pages.length - 1];
            const options = currentPage.options || {};
            if (options.id) {
              noteId.value = parseInt(options.id);
            }
          }
        } catch (error) {
          console.warn("\u83B7\u53D6\u9875\u9762\u53C2\u6570\u5931\u8D25:", error);
        }
        loadCities().then(() => {
          loadTags();
          loadScenic();
          if (noteId.value) {
            loadNoteDetail(noteId.value);
          }
        });
      });
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
        p: common_vendor.t(loading.value ? "\u52A0\u8F7D\u4E2D..." : submitting.value ? common_vendor.unref(isEditMode) ? "\u66F4\u65B0\u4E2D..." : "\u53D1\u5E03\u4E2D..." : common_vendor.unref(isEditMode) ? "\u66F4\u65B0" : "\u53D1\u5E03"),
        q: submitting.value || loading.value,
        r: common_vendor.o(onSubmit)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-464afb1e"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/travel-note/publish.vue"]]);
wx.createPage(MiniProgramPage);
