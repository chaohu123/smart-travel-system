"use strict";
var common_vendor = require("../../common/vendor.js");
var api_route = require("../../api/route.js");
var api_content = require("../../api/content.js");
require("../../utils/http.js");
require("../../utils/storage.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const cityList = common_vendor.ref([]);
    const selectedCity = common_vendor.ref(null);
    const selectedDays = common_vendor.ref(3);
    const selectedTags = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const recentRoutes = common_vendor.ref([]);
    const canSubmit = common_vendor.computed(() => {
      return selectedCity.value !== null && selectedTags.value.length > 0;
    });
    const decreaseDays = () => {
      if (selectedDays.value > 1) {
        selectedDays.value--;
      }
    };
    const increaseDays = () => {
      if (selectedDays.value < 7) {
        selectedDays.value++;
      }
    };
    const tagList = common_vendor.ref([
      { id: 1, name: "\u7F8E\u98DF" },
      { id: 2, name: "\u5386\u53F2" },
      { id: 3, name: "\u81EA\u7136" },
      { id: 4, name: "\u4EB2\u5B50" },
      { id: 5, name: "\u8D2D\u7269" }
    ]);
    const onCityChange = (e) => {
      selectedCity.value = cityList.value[e.detail.value];
    };
    const viewRoute = (routeId) => {
      common_vendor.index.navigateTo({
        url: `/pages/route/detail?id=${routeId}`
      });
    };
    const toggleTag = (tagId) => {
      const index = selectedTags.value.indexOf(tagId);
      if (index > -1) {
        selectedTags.value.splice(index, 1);
      } else {
        selectedTags.value.push(tagId);
      }
    };
    const generateRoute = async () => {
      if (!canSubmit.value) {
        common_vendor.index.showToast({
          title: "\u8BF7\u5B8C\u6210\u5FC5\u586B\u9879",
          icon: "none"
        });
        return;
      }
      loading.value = true;
      try {
        const res = await api_route.routeApi.generate({
          cityId: selectedCity.value.id,
          days: selectedDays.value,
          tagIds: selectedTags.value,
          useAi: true
        });
        if (res.statusCode === 200 && res.data.code === 200) {
          const routeId = res.data.data.routeId;
          common_vendor.index.navigateTo({
            url: `/pages/route/detail?id=${routeId}`
          });
        } else {
          common_vendor.index.showToast({
            title: res.data.msg || "\u751F\u6210\u5931\u8D25",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.showToast({
          title: "\u7F51\u7EDC\u9519\u8BEF",
          icon: "none"
        });
      } finally {
        loading.value = false;
      }
    };
    const loadCities = async () => {
      try {
        const res = await api_content.cityApi.list();
        const response = res.data;
        if (res.statusCode === 200 && response.code === 200) {
          const cities = response.data || [];
          cityList.value = cities.map((city) => ({
            id: city.id,
            name: city.cityName || city.name
          }));
        }
      } catch (error) {
        console.error("\u52A0\u8F7D\u57CE\u5E02\u5217\u8868\u5931\u8D25", error);
      }
    };
    common_vendor.onMounted(() => {
      loadCities();
    });
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: common_vendor.t(((_a = selectedCity.value) == null ? void 0 : _a.name) || "\u8BF7\u9009\u62E9\u57CE\u5E02"),
        b: !selectedCity.value ? 1 : "",
        c: cityList.value,
        d: common_vendor.o(onCityChange),
        e: selectedDays.value <= 1 ? 1 : "",
        f: common_vendor.o(decreaseDays),
        g: common_vendor.t(selectedDays.value),
        h: selectedDays.value >= 7 ? 1 : "",
        i: common_vendor.o(increaseDays),
        j: common_vendor.f(tagList.value, (tag, k0, i0) => {
          return {
            a: common_vendor.t(tag.name),
            b: tag.id,
            c: selectedTags.value.includes(tag.id) ? 1 : "",
            d: common_vendor.o(($event) => toggleTag(tag.id))
          };
        }),
        k: !common_vendor.unref(canSubmit) ? 1 : "",
        l: common_vendor.o(generateRoute),
        m: recentRoutes.value.length > 0
      }, recentRoutes.value.length > 0 ? {
        n: common_vendor.f(recentRoutes.value, (route, k0, i0) => {
          return {
            a: common_vendor.t(route.title),
            b: route.id,
            c: common_vendor.o(($event) => viewRoute(route.id))
          };
        })
      } : {}, {
        o: loading.value
      }, loading.value ? {} : {});
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f6d30d9a"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/route/plan.vue"]]);
wx.createPage(MiniProgramPage);
