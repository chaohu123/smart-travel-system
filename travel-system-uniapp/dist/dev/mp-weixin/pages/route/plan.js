"use strict";
var common_vendor = require("../../common/vendor.js");
var api_route = require("../../api/route.js");
var api_content = require("../../api/content.js");
var store_user = require("../../store/user.js");
var utils_storage = require("../../utils/storage.js");
require("../../utils/http.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const cityList = common_vendor.ref([]);
    const destination = common_vendor.ref("\u5317\u4EAC");
    const selectedDayIndex = common_vendor.ref(1);
    const selectedTags = common_vendor.ref([]);
    const selectedCompanion = common_vendor.ref(1);
    const loading = common_vendor.ref(false);
    const recentRoutes = common_vendor.ref([]);
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const startDate = common_vendor.ref("");
    const endDate = common_vendor.ref("");
    const minDate = common_vendor.ref(new Date().toISOString().split("T")[0]);
    const dailySelections = common_vendor.ref([]);
    const selectorVisible = common_vendor.ref(false);
    const selectorTab = common_vendor.ref("pending");
    const selectorType = common_vendor.ref("scenic");
    const selectorDayIndex = common_vendor.ref(0);
    const selectorList = common_vendor.ref([]);
    const selectorTempSelected = common_vendor.ref([]);
    const favoriteScenics = common_vendor.ref([]);
    const favoriteFoods = common_vendor.ref([]);
    const allScenics = common_vendor.ref([]);
    const allFoods = common_vendor.ref([]);
    const pendingScenics = common_vendor.ref([]);
    const pendingFoods = common_vendor.ref([]);
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
      return destination.value.trim() !== "" && selectedTags.value.length > 0 && startDate.value !== "" && endDate.value !== "";
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
    const travelDays = common_vendor.computed(() => {
      if (!startDate.value || !endDate.value)
        return 0;
      const start = new Date(startDate.value);
      const end = new Date(endDate.value);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24)) + 1;
      return diffDays;
    });
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekdays = ["\u5468\u65E5", "\u5468\u4E00", "\u5468\u4E8C", "\u5468\u4E09", "\u5468\u56DB", "\u5468\u4E94", "\u5468\u516D"];
      const weekday = weekdays[date.getDay()];
      return `${month}\u6708${day}\u65E5(${weekday})`;
    };
    const onStartDateChange = (e) => {
      const selectedDate = e.detail.value;
      if (!endDate.value || selectedDate <= endDate.value) {
        startDate.value = selectedDate;
        updateDailySelections();
      } else {
        common_vendor.index.showToast({
          title: "\u5F00\u59CB\u65E5\u671F\u4E0D\u80FD\u665A\u4E8E\u7ED3\u675F\u65E5\u671F",
          icon: "none"
        });
      }
    };
    const onEndDateChange = (e) => {
      const selectedDate = e.detail.value;
      if (!startDate.value) {
        common_vendor.index.showToast({
          title: "\u8BF7\u5148\u9009\u62E9\u5F00\u59CB\u65E5\u671F",
          icon: "none"
        });
        return;
      }
      if (selectedDate >= startDate.value) {
        endDate.value = selectedDate;
        updateDailySelections();
      } else {
        common_vendor.index.showToast({
          title: "\u7ED3\u675F\u65E5\u671F\u4E0D\u80FD\u65E9\u4E8E\u5F00\u59CB\u65E5\u671F",
          icon: "none"
        });
      }
    };
    const updateDailySelections = () => {
      const days = travelDays.value;
      if (days > 0) {
        while (dailySelections.value.length < days) {
          dailySelections.value.push({ scenicIds: [], foodIds: [] });
        }
        while (dailySelections.value.length > days) {
          dailySelections.value.pop();
        }
      }
    };
    const selectCompanion = (companionId) => {
      selectedCompanion.value = companionId;
    };
    const viewRoute = (routeId) => {
      common_vendor.index.navigateTo({
        url: `/pages/itinerary/itinerary-detail?id=${routeId}`
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
      common_vendor.index.hideLoading();
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
        let selectedDays = travelDays.value;
        if (selectedDays === 0) {
          selectedDays = ((_a = dayOptions.value[selectedDayIndex.value]) == null ? void 0 : _a.value) || 3;
        }
        if (!startDate.value || !endDate.value) {
          common_vendor.index.showToast({
            title: "\u8BF7\u9009\u62E9\u6E38\u73A9\u65F6\u95F4",
            icon: "none"
          });
          loading.value = false;
          return;
        }
        const companion = companionList.value.find((c) => c.id === selectedCompanion.value);
        const suitablePeople = companion ? companion.name : "\u72EC\u884C";
        const dailySelectionsData = dailySelections.value.map((day, index) => ({
          day: index + 1,
          scenicIds: day.scenicIds || [],
          foodIds: day.foodIds || []
        }));
        const res = await api_route.routeApi.generate({
          cityId,
          days: selectedDays,
          tagIds: selectedTags.value,
          suitablePeople,
          useAi: true,
          dailySelections: dailySelectionsData,
          startDate: startDate.value,
          endDate: endDate.value
        });
        if (res.statusCode === 200 && res.data.code === 200) {
          const routeId = res.data.data.routeId;
          if (!routeId) {
            common_vendor.index.showToast({
              title: "\u8DEF\u7EBFID\u83B7\u53D6\u5931\u8D25",
              icon: "none"
            });
            loading.value = false;
            return;
          }
          loading.value = false;
          await new Promise((resolve) => setTimeout(resolve, 800));
          const detailUrl = `/pages/itinerary/itinerary-detail?id=${encodeURIComponent(routeId)}`;
          console.log("[generateRoute] \u51C6\u5907\u8DF3\u8F6C\u5230\u8BE6\u60C5\u9875:", detailUrl);
          common_vendor.index.navigateTo({
            url: detailUrl,
            success: () => {
              console.log("[generateRoute] \u8DF3\u8F6C\u6210\u529F");
            },
            fail: (err) => {
              console.error("[generateRoute] navigateTo \u5931\u8D25:", err);
              common_vendor.index.redirectTo({
                url: detailUrl,
                success: () => {
                  console.log("[generateRoute] redirectTo \u6210\u529F");
                },
                fail: (redirectErr) => {
                  console.error("[generateRoute] redirectTo \u4E5F\u5931\u8D25:", redirectErr);
                  common_vendor.index.showToast({
                    title: "\u9875\u9762\u8DF3\u8F6C\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u5237\u65B0",
                    icon: "none",
                    duration: 3e3
                  });
                }
              });
            }
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
    const openDaySelector = async (dayIndex, type) => {
      selectorDayIndex.value = dayIndex;
      selectorType.value = type;
      loadPendingAdditions();
      const hasPending = type === "scenic" ? pendingScenics.value.length > 0 : pendingFoods.value.length > 0;
      selectorTab.value = hasPending ? "pending" : user.value ? "favorite" : "all";
      selectorTempSelected.value = [...type === "scenic" ? dailySelections.value[dayIndex].scenicIds : dailySelections.value[dayIndex].foodIds];
      await loadSelectorList();
      selectorVisible.value = true;
    };
    const getPendingCount = () => {
      if (selectorType.value === "scenic") {
        return pendingScenics.value.length;
      } else {
        return pendingFoods.value.length;
      }
    };
    const loadSelectorList = async () => {
      var _a, _b, _c, _d;
      try {
        if (selectorTab.value === "pending") {
          if (selectorType.value === "scenic") {
            selectorList.value = pendingScenics.value;
          } else {
            selectorList.value = pendingFoods.value;
          }
        } else if (selectorTab.value === "favorite") {
          if (selectorType.value === "scenic") {
            if (favoriteScenics.value.length === 0) {
              const res = await api_content.scenicSpotApi.getMyFavorites(user.value.id);
              if (res.statusCode === 200 && res.data.code === 200) {
                favoriteScenics.value = (((_a = res.data.data) == null ? void 0 : _a.list) || []).map((item) => ({
                  id: item.id,
                  name: item.name
                }));
              }
            }
            selectorList.value = favoriteScenics.value;
          } else {
            if (favoriteFoods.value.length === 0) {
              const res = await api_content.foodApi.getMyFavorites(user.value.id);
              if (res.statusCode === 200 && res.data.code === 200) {
                favoriteFoods.value = (((_b = res.data.data) == null ? void 0 : _b.list) || []).map((item) => ({
                  id: item.id,
                  name: item.name
                }));
              }
            }
            selectorList.value = favoriteFoods.value;
          }
        } else {
          const cityName = extractCityFromDestination(destination.value);
          const cityId = findCityId(cityName);
          if (selectorType.value === "scenic") {
            if (allScenics.value.length === 0 || cityId) {
              const res = await api_content.scenicSpotApi.list({ cityId: cityId || void 0, pageSize: 100 });
              if (res.statusCode === 200 && res.data.code === 200) {
                allScenics.value = (((_c = res.data.data) == null ? void 0 : _c.list) || []).map((item) => ({
                  id: item.id,
                  name: item.name
                }));
              }
            }
            selectorList.value = allScenics.value;
          } else {
            if (allFoods.value.length === 0 || cityId) {
              const res = await api_content.foodApi.list({ cityId: cityId || void 0, pageSize: 100 });
              if (res.statusCode === 200 && res.data.code === 200) {
                allFoods.value = (((_d = res.data.data) == null ? void 0 : _d.list) || []).map((item) => ({
                  id: item.id,
                  name: item.name
                }));
              }
            }
            selectorList.value = allFoods.value;
          }
        }
      } catch (error) {
        console.error("\u52A0\u8F7D\u9009\u62E9\u5668\u5217\u8868\u5931\u8D25:", error);
        common_vendor.index.showToast({ title: "\u52A0\u8F7D\u5931\u8D25", icon: "none" });
      }
    };
    common_vendor.watch(selectorTab, () => {
      loadSelectorList();
    });
    const isSelected = (id) => {
      return selectorTempSelected.value.includes(id);
    };
    const toggleSelect = (id) => {
      const index = selectorTempSelected.value.indexOf(id);
      if (index > -1) {
        selectorTempSelected.value.splice(index, 1);
      } else {
        selectorTempSelected.value.push(id);
      }
    };
    const confirmSelection = () => {
      if (selectorType.value === "scenic") {
        dailySelections.value[selectorDayIndex.value].scenicIds = [...selectorTempSelected.value];
      } else {
        dailySelections.value[selectorDayIndex.value].foodIds = [...selectorTempSelected.value];
      }
      closeSelector();
      const count = selectorTempSelected.value.length;
      if (count > 0) {
        common_vendor.index.showToast({
          title: `\u5DF2\u6DFB\u52A0${count}\u9879\u5230\u7B2C${selectorDayIndex.value + 1}\u5929`,
          icon: "success",
          duration: 2e3
        });
      }
    };
    const closeSelector = () => {
      selectorVisible.value = false;
      selectorTempSelected.value = [];
    };
    const removeScenic = (dayIndex, scenicId) => {
      const index = dailySelections.value[dayIndex].scenicIds.indexOf(scenicId);
      if (index > -1) {
        dailySelections.value[dayIndex].scenicIds.splice(index, 1);
      }
    };
    const removeFood = (dayIndex, foodId) => {
      const index = dailySelections.value[dayIndex].foodIds.indexOf(foodId);
      if (index > -1) {
        dailySelections.value[dayIndex].foodIds.splice(index, 1);
      }
    };
    const getScenicName = (id) => {
      const scenic = [...pendingScenics.value, ...favoriteScenics.value, ...allScenics.value].find((s) => s.id === id);
      return (scenic == null ? void 0 : scenic.name) || `\u666F\u70B9${id}`;
    };
    const getFoodName = (id) => {
      const food = [...pendingFoods.value, ...favoriteFoods.value, ...allFoods.value].find((f) => f.id === id);
      return (food == null ? void 0 : food.name) || `\u7F8E\u98DF${id}`;
    };
    const selectorTitle = common_vendor.computed(() => {
      const dayText = `\u7B2C${selectorDayIndex.value + 1}\u5929`;
      const typeText = selectorType.value === "scenic" ? "\u666F\u70B9" : "\u7F8E\u98DF";
      return `${dayText} - \u9009\u62E9${typeText}`;
    });
    const loadPendingAdditions = () => {
      const pendingAdditions = utils_storage.getCache("route_pending_additions");
      pendingScenics.value = [];
      pendingFoods.value = [];
      if (pendingAdditions && pendingAdditions.length > 0) {
        pendingAdditions.forEach((item) => {
          if (item.type === "scenic") {
            if (!pendingScenics.value.find((s) => s.id === item.id)) {
              pendingScenics.value.push({ id: item.id, name: item.name });
              if (!allScenics.value.find((s) => s.id === item.id)) {
                allScenics.value.push({ id: item.id, name: item.name });
              }
            }
          } else if (item.type === "food") {
            if (!pendingFoods.value.find((f) => f.id === item.id)) {
              pendingFoods.value.push({ id: item.id, name: item.name });
              if (!allFoods.value.find((f) => f.id === item.id)) {
                allFoods.value.push({ id: item.id, name: item.name });
              }
            }
          }
        });
      }
    };
    common_vendor.onMounted(() => {
      var _a;
      loadCities();
      loadTags();
      const days = ((_a = dayOptions.value[selectedDayIndex.value]) == null ? void 0 : _a.value) || 3;
      for (let i = 0; i < days; i++) {
        dailySelections.value.push({ scenicIds: [], foodIds: [] });
      }
      loadPendingAdditions();
    });
    common_vendor.onShow(() => {
      loadPendingAdditions();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o([($event) => destination.value = $event.detail.value, onDestinationInput]),
        b: destination.value,
        c: common_vendor.t(startDate.value ? formatDate(startDate.value) : "\u9009\u62E9\u5F00\u59CB\u65E5\u671F"),
        d: !startDate.value ? 1 : "",
        e: startDate.value,
        f: minDate.value,
        g: common_vendor.o(onStartDateChange),
        h: common_vendor.t(endDate.value ? formatDate(endDate.value) : "\u9009\u62E9\u7ED3\u675F\u65E5\u671F"),
        i: !endDate.value ? 1 : "",
        j: endDate.value,
        k: startDate.value || minDate.value,
        l: common_vendor.o(onEndDateChange),
        m: common_vendor.unref(travelDays) > 0
      }, common_vendor.unref(travelDays) > 0 ? {
        n: common_vendor.t(common_vendor.unref(travelDays)),
        o: common_vendor.t(common_vendor.unref(travelDays) - 1)
      } : {}, {
        p: common_vendor.f(tagList.value, (tag, k0, i0) => {
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
        q: common_vendor.f(companionList.value, (companion, k0, i0) => {
          return {
            a: common_vendor.t(companion.name),
            b: companion.id,
            c: selectedCompanion.value === companion.id ? 1 : "",
            d: common_vendor.o(($event) => selectCompanion(companion.id))
          };
        }),
        r: pendingScenics.value.length > 0 || pendingFoods.value.length > 0
      }, pendingScenics.value.length > 0 || pendingFoods.value.length > 0 ? {
        s: common_vendor.t(pendingScenics.value.length + pendingFoods.value.length)
      } : {}, {
        t: common_vendor.f(dailySelections.value, (day, dayIndex, i0) => {
          return common_vendor.e({
            a: common_vendor.t(dayIndex + 1),
            b: common_vendor.t(day.scenicIds.length),
            c: common_vendor.o(($event) => openDaySelector(dayIndex, "scenic")),
            d: common_vendor.t(day.foodIds.length),
            e: common_vendor.o(($event) => openDaySelector(dayIndex, "food")),
            f: day.scenicIds.length > 0 || day.foodIds.length > 0
          }, day.scenicIds.length > 0 || day.foodIds.length > 0 ? common_vendor.e({
            g: day.scenicIds.length > 0
          }, day.scenicIds.length > 0 ? {
            h: common_vendor.f(day.scenicIds, (scenicId, k1, i1) => {
              return {
                a: common_vendor.t(getScenicName(scenicId)),
                b: common_vendor.o(($event) => removeScenic(dayIndex, scenicId)),
                c: scenicId
              };
            })
          } : {}, {
            i: day.foodIds.length > 0
          }, day.foodIds.length > 0 ? {
            j: common_vendor.f(day.foodIds, (foodId, k1, i1) => {
              return {
                a: common_vendor.t(getFoodName(foodId)),
                b: common_vendor.o(($event) => removeFood(dayIndex, foodId)),
                c: foodId
              };
            })
          } : {}) : {}, {
            k: dayIndex
          });
        }),
        v: !common_vendor.unref(canSubmit) ? 1 : "",
        w: common_vendor.o(generateRoute),
        x: recentRoutes.value.length > 0
      }, recentRoutes.value.length > 0 ? {
        y: common_vendor.f(recentRoutes.value, (route, k0, i0) => {
          return {
            a: common_vendor.t(route.title),
            b: route.id,
            c: common_vendor.o(($event) => viewRoute(route.id))
          };
        })
      } : {}, {
        z: loading.value
      }, loading.value ? {} : {}, {
        A: selectorVisible.value
      }, selectorVisible.value ? common_vendor.e({
        B: common_vendor.t(common_vendor.unref(selectorTitle)),
        C: common_vendor.o(closeSelector),
        D: getPendingCount() > 0
      }, getPendingCount() > 0 ? {
        E: common_vendor.t(getPendingCount())
      } : {}, {
        F: selectorTab.value === "pending" ? 1 : "",
        G: common_vendor.o(($event) => selectorTab.value = "pending"),
        H: selectorTab.value === "favorite" ? 1 : "",
        I: common_vendor.o(($event) => selectorTab.value = "favorite"),
        J: selectorTab.value === "all" ? 1 : "",
        K: common_vendor.o(($event) => selectorTab.value = "all"),
        L: common_vendor.f(selectorList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.name),
            b: isSelected(item.id)
          }, isSelected(item.id) ? {} : {}, {
            c: item.id,
            d: isSelected(item.id) ? 1 : "",
            e: common_vendor.o(($event) => toggleSelect(item.id))
          });
        }),
        M: selectorList.value.length === 0
      }, selectorList.value.length === 0 ? {} : {}, {
        N: common_vendor.o(confirmSelection),
        O: common_vendor.o(() => {
        }),
        P: common_vendor.o(closeSelector)
      }) : {});
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f6d30d9a"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/route/plan.vue"]]);
wx.createPage(MiniProgramPage);
