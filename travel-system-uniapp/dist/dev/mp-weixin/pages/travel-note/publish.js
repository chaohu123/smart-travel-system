"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var store_user = require("../../store/user.js");
var utils_image = require("../../utils/image.js");
var utils_config = require("../../utils/config.js");
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
    const extractRelativePath = (url) => {
      if (!url)
        return url;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return url.split("?")[0];
      }
      try {
        const urlObj = new URL(url);
        return urlObj.pathname + urlObj.search;
      } catch {
        if (url.includes(utils_config.STATIC_BASE_URL)) {
          const path = url.substring(url.indexOf(utils_config.STATIC_BASE_URL) + utils_config.STATIC_BASE_URL.length);
          return path.split("?")[0];
        }
        return url;
      }
    };
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
                imageUrls.value.push(utils_image.getImageUrl(imageUrl, false));
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
          const detail = data.data;
          const note = detail.note || detail;
          console.log("=== \u52A0\u8F7D\u6E38\u8BB0\u8BE6\u60C5 ===");
          console.log("\u5B8C\u6574\u6570\u636E:", detail);
          console.log("\u6E38\u8BB0\u57FA\u672C\u4FE1\u606F:", note);
          console.log("\u56FE\u7247\u5217\u8868:", detail.images);
          console.log("\u666F\u70B9\u5217\u8868:", detail.scenics);
          console.log("\u6807\u7B7E\u5217\u8868:", detail.tags);
          title.value = note.title || note.title || "";
          content.value = note.content || note.content || "";
          console.log("\u586B\u5145\u540E\u7684\u6807\u9898:", title.value, "\u957F\u5EA6:", title.value.length);
          console.log("\u586B\u5145\u540E\u7684\u6B63\u6587:", content.value.substring(0, 50) + "...", "\u957F\u5EA6:", content.value.length);
          if (detail.images && Array.isArray(detail.images)) {
            const sortedImages = [...detail.images].sort((a, b) => (a.sort || 0) - (b.sort || 0));
            imageUrls.value = sortedImages.map((img) => {
              const url = img.url || img;
              return url ? utils_image.getImageUrl(url, false) : null;
            }).filter((url) => url && typeof url === "string");
          } else if (note.imageUrls) {
            imageUrls.value = Array.isArray(note.imageUrls) ? note.imageUrls.map((url) => utils_image.getImageUrl(url, false)).filter(Boolean) : [];
          } else if (note.images) {
            const images = Array.isArray(note.images) ? note.images : [];
            imageUrls.value = images.map((img) => {
              const url = typeof img === "string" ? img : img.url || "";
              return url ? utils_image.getImageUrl(url, false) : null;
            }).filter(Boolean);
          } else {
            imageUrls.value = [];
          }
          const cityId = note.cityId || note.city_id;
          if (cityId) {
            if (cityList.value.length === 0) {
              await loadCities();
            }
            const city = cityList.value.find((c) => c.id === cityId || c.id === Number(cityId));
            if (city) {
              selectedCity.value = city;
              console.log("\u8BBE\u7F6E\u57CE\u5E02:", city);
              await loadScenic(city.id);
            } else {
              const cityName = note.cityName || note.city_name;
              if (cityName) {
                selectedCity.value = { id: Number(cityId), name: cityName };
                console.log("\u4F7F\u7528\u4E34\u65F6\u57CE\u5E02\u5BF9\u8C61:", selectedCity.value);
                await loadScenic(Number(cityId));
              } else {
                console.warn("\u672A\u627E\u5230\u57CE\u5E02\u4FE1\u606F\uFF0CcityId:", cityId);
              }
            }
          } else {
            console.warn("\u6E38\u8BB0\u6CA1\u6709\u57CE\u5E02ID");
          }
          if (detail.scenics && Array.isArray(detail.scenics)) {
            scenicIds.value = detail.scenics.map((scenic) => {
              const id2 = scenic.id || scenic.scenicId || scenic.scenic_id;
              return id2 != null ? Number(id2) : null;
            }).filter((id2) => id2 != null);
            console.log("\u586B\u5145\u666F\u70B9ID:", scenicIds.value);
          } else if (note.scenicIds || note.scenic_ids) {
            const ids = note.scenicIds || note.scenic_ids;
            scenicIds.value = Array.isArray(ids) ? ids.map((id2) => Number(id2)) : [];
            console.log("\u4ECEnote\u4E2D\u586B\u5145\u666F\u70B9ID:", scenicIds.value);
          } else {
            scenicIds.value = [];
            console.log("\u6CA1\u6709\u666F\u70B9ID");
          }
          if (detail.tags && Array.isArray(detail.tags)) {
            tagIds.value = detail.tags.map((id2) => Number(id2)).filter((id2) => id2 != null && !isNaN(id2));
            console.log("\u586B\u5145\u6807\u7B7EID:", tagIds.value);
          } else if (note.tagIds || note.tag_ids) {
            const ids = note.tagIds || note.tag_ids;
            tagIds.value = Array.isArray(ids) ? ids.map((id2) => Number(id2)) : [];
            console.log("\u4ECEnote\u4E2D\u586B\u5145\u6807\u7B7EID:", tagIds.value);
          } else {
            tagIds.value = [];
            console.log("\u6CA1\u6709\u6807\u7B7EID");
          }
          console.log("\u6570\u636E\u586B\u5145\u5B8C\u6210 - \u6807\u9898:", title.value, "\u6B63\u6587\u957F\u5EA6:", content.value.length, "\u56FE\u7247\u6570:", imageUrls.value.length);
        } else {
          common_vendor.index.showToast({ title: data.msg || "\u52A0\u8F7D\u5931\u8D25", icon: "none" });
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 1500);
        }
      } catch (error) {
        console.error("\u52A0\u8F7D\u6E38\u8BB0\u8BE6\u60C5\u5931\u8D25:", error);
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
          const relativeImageUrls = imageUrls.value.map(extractRelativePath);
          res = await api_content.travelNoteApi.update(noteId.value, {
            userId: user.value.id,
            title: title.value.trim(),
            content: content.value.trim(),
            cityId: selectedCity.value.id,
            cityName: selectedCity.value.name,
            imageUrls: relativeImageUrls,
            scenicIds: scenicIds.value,
            tagIds: tagIds.value
          });
        } else {
          const relativeImageUrls = imageUrls.value.map(extractRelativePath);
          res = await api_content.travelNoteApi.publish({
            userId: user.value.id,
            title: title.value.trim(),
            content: content.value.trim(),
            cityId: selectedCity.value.id,
            cityName: selectedCity.value.name,
            imageUrls: relativeImageUrls,
            scenicIds: scenicIds.value,
            tagIds: tagIds.value
          });
        }
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          if (isEditMode.value) {
            common_vendor.index.showToast({ title: "\u5DF2\u63D0\u4EA4\uFF0C\u7B49\u5F85\u5BA1\u6838", icon: "success" });
            setTimeout(() => {
              common_vendor.index.redirectTo({ url: "/pages/profile/my-article?status=pending" });
            }, 1500);
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
    common_vendor.onLoad((options) => {
      console.log("onLoad \u83B7\u53D6\u5230\u7684\u53C2\u6570:", options);
      if (options && options.id) {
        noteId.value = parseInt(options.id);
        console.log("\u68C0\u6D4B\u5230\u7F16\u8F91\u6A21\u5F0F\uFF0C\u6E38\u8BB0ID:", noteId.value);
      } else {
        console.log("\u975E\u7F16\u8F91\u6A21\u5F0F\uFF0C\u6CA1\u6709ID\u53C2\u6570");
      }
    });
    common_vendor.onMounted(() => {
      Promise.all([
        loadCities(),
        loadTags(),
        loadScenic()
      ]).then(() => {
        console.log("\u57FA\u7840\u6570\u636E\u52A0\u8F7D\u5B8C\u6210 - \u57CE\u5E02\u6570:", cityList.value.length, "\u6807\u7B7E\u6570:", tagOptions.value.length, "\u666F\u70B9\u6570:", scenicOptions.value.length);
        if (noteId.value) {
          console.log("\u5F00\u59CB\u52A0\u8F7D\u6E38\u8BB0\u8BE6\u60C5\uFF0CID:", noteId.value);
          loadNoteDetail(noteId.value);
        } else {
          console.log("\u975E\u7F16\u8F91\u6A21\u5F0F\uFF0C\u4E0D\u52A0\u8F7D\u8BE6\u60C5");
        }
      }).catch((error) => {
        console.error("\u52A0\u8F7D\u57FA\u7840\u6570\u636E\u5931\u8D25:", error);
        if (noteId.value) {
          console.log("\u57FA\u7840\u6570\u636E\u52A0\u8F7D\u5931\u8D25\uFF0C\u4F46\u4ECD\u5C1D\u8BD5\u52A0\u8F7D\u6E38\u8BB0\u8BE6\u60C5\uFF0CID:", noteId.value);
          loadNoteDetail(noteId.value);
        }
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
