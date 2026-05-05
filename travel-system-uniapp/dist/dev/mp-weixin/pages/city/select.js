"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var utils_image = require("../../utils/image.js");
require("../../utils/http.js");
require("../../utils/storage.js");
require("../../utils/config.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const searchKeyword = common_vendor.ref("");
    const allCities = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const buildCityItem = (raw) => {
      const id = raw.id;
      const name = raw.cityName || raw.name;
      if (!id || !name)
        return null;
      const pinyinSource = raw.pinyin || raw.py || raw.spell || raw.pinyinFull || name;
      const firstChar = pinyinSource.trim().charAt(0);
      let initial = "#";
      if (firstChar) {
        const upper = firstChar.toUpperCase();
        if (upper >= "A" && upper <= "Z") {
          initial = upper;
        }
      }
      return {
        id,
        name,
        imageUrl: raw.imageUrl || "",
        pinyinKey: pinyinSource.toLowerCase(),
        initial
      };
    };
    const filteredCities = common_vendor.computed(() => {
      const kw = searchKeyword.value.trim().toLowerCase();
      if (!kw)
        return allCities.value;
      return allCities.value.filter((c) => {
        return c.name.toLowerCase().includes(kw) || c.pinyinKey.includes(kw);
      });
    });
    const groupedCityList = common_vendor.computed(() => {
      const groups = {};
      filteredCities.value.forEach((city) => {
        const key = city.initial || "#";
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(city);
      });
      const initials = Object.keys(groups).sort((a, b) => {
        if (a === "#")
          return 1;
        if (b === "#")
          return -1;
        return a.localeCompare(b);
      });
      return initials.map((initial) => ({
        initial,
        cities: groups[initial].sort(
          (a, b) => a.pinyinKey.localeCompare(b.pinyinKey)
        )
      }));
    });
    const clearSearch = () => {
      searchKeyword.value = "";
    };
    const loadCities = async () => {
      loading.value = true;
      try {
        const res = await api_content.cityApi.list();
        const response = res.data;
        if (res.statusCode === 200 && response.code === 200) {
          const raw = response.data || [];
          const mapped = raw.map((c) => buildCityItem(c)).filter((c) => !!c);
          allCities.value = mapped;
        } else {
          common_vendor.index.showToast({
            title: response.msg || "\u57CE\u5E02\u52A0\u8F7D\u5931\u8D25",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.showToast({
          title: "\u57CE\u5E02\u52A0\u8F7D\u5931\u8D25",
          icon: "none"
        });
      } finally {
        loading.value = false;
      }
    };
    let eventChannel = null;
    const selectCity = (city) => {
      common_vendor.index.setStorageSync("ticket_selected_city", {
        id: city.id,
        name: city.name,
        ts: Date.now()
      });
      if (eventChannel) {
        eventChannel.emit("citySelected", {
          id: city.id,
          name: city.name
        });
      }
      common_vendor.index.navigateBack();
    };
    common_vendor.onLoad(() => {
      try {
        eventChannel = common_vendor.index.getOpenerEventChannel ? common_vendor.index.getOpenerEventChannel() : null;
      } catch {
        eventChannel = null;
      }
    });
    common_vendor.onMounted(() => {
      loadCities();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: searchKeyword.value,
        b: common_vendor.o(($event) => searchKeyword.value = $event.detail.value),
        c: searchKeyword.value
      }, searchKeyword.value ? {
        d: common_vendor.o(clearSearch)
      } : {}, {
        e: common_vendor.f(common_vendor.unref(groupedCityList), (group, k0, i0) => {
          return {
            a: common_vendor.t(group.initial),
            b: common_vendor.f(group.cities, (city, k1, i1) => {
              return common_vendor.e({
                a: city.imageUrl
              }, city.imageUrl ? {
                b: common_vendor.unref(utils_image.getImageUrl)(city.imageUrl)
              } : {}, {
                c: common_vendor.t(city.name),
                d: city.id,
                e: common_vendor.o(($event) => selectCity(city))
              });
            }),
            c: group.initial
          };
        }),
        f: !common_vendor.unref(groupedCityList).length && !loading.value
      }, !common_vendor.unref(groupedCityList).length && !loading.value ? {} : {}, {
        g: loading.value
      }, loading.value ? {} : {});
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-cffe5168"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/city/select.vue"]]);
wx.createPage(MiniProgramPage);
