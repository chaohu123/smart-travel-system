"use strict";
var common_vendor = require("../../common/vendor.js");
var api_route = require("../../api/route.js");
var api_content = require("../../api/content.js");
require("../../utils/http.js");
require("../../utils/storage.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const cityList = common_vendor.ref([]);
    const destination = common_vendor.ref("\u5317\u4EAC");
    const selectedDayIndex = common_vendor.ref(1);
    const selectedTags = common_vendor.ref([]);
    const selectedCompanion = common_vendor.ref(1);
    const loading = common_vendor.ref(false);
    const recentRoutes = common_vendor.ref([]);
    const dayOptions = common_vendor.ref([
      { label: "2\u5929", value: 2 },
      { label: "3\u5929", value: 3 },
      { label: "4\u5929", value: 4 },
      { label: "5\u5929", value: 5 },
      { label: "6\u5929", value: 6 },
      { label: "7\u5929", value: 7 },
      { label: "2\u59291\u665A", value: 2 },
      { label: "3\u59292\u665A", value: 3 },
      { label: "5\u59294\u665A", value: 5 }
    ]);
    const tagList = common_vendor.ref([]);
    const tagColors = [
      "#3ba272",
      "#ff6b9d",
      "#ff9800",
      "#9c27b0",
      "#2196f3",
      "#f44336",
      "#00bcd4",
      "#ffc107"
    ];
    const companionList = common_vendor.ref([
      { id: 1, name: "\u72EC\u884C" },
      { id: 2, name: "\u60C5\u4FA3" },
      { id: 3, name: "\u5BB6\u5EAD" },
      { id: 4, name: "\u670B\u53CB" },
      { id: 5, name: "\u4EB2\u5B50" }
    ]);
    const canSubmit = common_vendor.computed(() => {
      return destination.value.trim() !== "" && selectedTags.value.length > 0;
    });
    const onDestinationInput = (e) => {
      const input = e.detail.value;
      destination.value = input;
      const dayMatch = input.match(/(\d+)[日天]/);
      if (dayMatch) {
        const days = parseInt(dayMatch[1]);
        const dayOption = dayOptions.value.find((opt) => opt.value === days);
        if (dayOption) {
          selectedDayIndex.value = dayOptions.value.indexOf(dayOption);
        }
      }
    };
    const onDayChange = (e) => {
      selectedDayIndex.value = e.detail.value;
    };
    const selectCompanion = (companionId) => {
      selectedCompanion.value = companionId;
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
    const extractCityFromDestination = (dest) => {
      const cleaned = dest.replace(/\d+[日天]游?/g, "").trim();
      return cleaned || dest;
    };
    const findCityId = (cityName) => {
      const city = cityList.value.find(
        (c) => c.name.includes(cityName) || cityName.includes(c.name)
      );
      return city ? city.id : null;
    };
    const generateRoute = async () => {
      var _a;
      if (!canSubmit.value) {
        common_vendor.index.showToast({
          title: "\u8BF7\u5B8C\u6210\u5FC5\u586B\u9879",
          icon: "none"
        });
        return;
      }
      loading.value = true;
      try {
        const cityName = extractCityFromDestination(destination.value);
        let cityId = findCityId(cityName);
        if (!cityId && cityList.value.length > 0) {
          cityId = cityList.value[0].id;
        }
        if (!cityId) {
          common_vendor.index.showToast({
            title: "\u672A\u627E\u5230\u5BF9\u5E94\u57CE\u5E02\uFF0C\u8BF7\u68C0\u67E5\u76EE\u7684\u5730\u8F93\u5165",
            icon: "none",
            duration: 2e3
          });
          loading.value = false;
          return;
        }
        const selectedDays = ((_a = dayOptions.value[selectedDayIndex.value]) == null ? void 0 : _a.value) || 3;
        const companion = companionList.value.find((c) => c.id === selectedCompanion.value);
        const suitablePeople = companion ? companion.name : "\u72EC\u884C";
        const res = await api_route.routeApi.generate({
          cityId,
          days: selectedDays,
          tagIds: selectedTags.value,
          suitablePeople,
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
    const loadTags = async () => {
      try {
        const res = await api_content.tagApi.list();
        const response = res.data;
        if (res.statusCode === 200 && response.code === 200) {
          const tags = response.data || [];
          tagList.value = tags.map((tag, index) => ({
            id: tag.id,
            name: tag.tagName || tag.name,
            color: tagColors[index % tagColors.length]
          }));
          console.log("\u6807\u7B7E\u5217\u8868\u52A0\u8F7D\u6210\u529F:", tagList.value);
        }
      } catch (error) {
        console.error("\u52A0\u8F7D\u6807\u7B7E\u5217\u8868\u5931\u8D25", error);
        tagList.value = [];
      }
    };
    common_vendor.onMounted(() => {
      loadCities();
      loadTags();
    });
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: common_vendor.o([($event) => destination.value = $event.detail.value, onDestinationInput]),
        b: destination.value,
        c: common_vendor.t(((_a = dayOptions.value[selectedDayIndex.value]) == null ? void 0 : _a.label) || "3\u5929"),
        d: dayOptions.value,
        e: selectedDayIndex.value,
        f: common_vendor.o(onDayChange),
        g: common_vendor.f(tagList.value, (tag, k0, i0) => {
          return {
            a: common_vendor.t(tag.name),
            b: tag.id,
            c: selectedTags.value.includes(tag.id) ? 1 : "",
            d: common_vendor.s(selectedTags.value.includes(tag.id) ? {
              backgroundColor: tag.color,
              borderColor: tag.color
            } : {}),
            e: common_vendor.o(($event) => toggleTag(tag.id))
          };
        }),
        h: common_vendor.f(companionList.value, (companion, k0, i0) => {
          return {
            a: common_vendor.t(companion.name),
            b: companion.id,
            c: selectedCompanion.value === companion.id ? 1 : "",
            d: common_vendor.o(($event) => selectCompanion(companion.id))
          };
        }),
        i: !common_vendor.unref(canSubmit) ? 1 : "",
        j: common_vendor.o(generateRoute),
        k: recentRoutes.value.length > 0
      }, recentRoutes.value.length > 0 ? {
        l: common_vendor.f(recentRoutes.value, (route, k0, i0) => {
          return {
            a: common_vendor.t(route.title),
            b: route.id,
            c: common_vendor.o(($event) => viewRoute(route.id))
          };
        })
      } : {}, {
        m: loading.value
      }, loading.value ? {} : {});
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f6d30d9a"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/route/plan.vue"]]);
wx.createPage(MiniProgramPage);
