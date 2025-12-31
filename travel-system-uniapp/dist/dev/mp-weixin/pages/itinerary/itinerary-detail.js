"use strict";
var common_vendor = require("../../common/vendor.js");
var api_route = require("../../api/route.js");
var store_user = require("../../store/user.js");
var utils_storage = require("../../utils/storage.js");
require("../../utils/http.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const routeId = common_vendor.ref(null);
    const loading = common_vendor.ref(false);
    const routeData = common_vendor.ref(null);
    const activeTab = common_vendor.ref("itinerary");
    const isFavorite = common_vendor.ref(false);
    const isExpanded = common_vendor.ref(false);
    const selectedDayIndex = common_vendor.ref(0);
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const currentDayData = common_vendor.computed(() => {
      var _a;
      if (!((_a = routeData.value) == null ? void 0 : _a.days) || routeData.value.days.length === 0)
        return null;
      return routeData.value.days[selectedDayIndex.value] || routeData.value.days[0];
    });
    const currentDayScenics = common_vendor.computed(() => {
      var _a, _b;
      if (!((_a = currentDayData.value) == null ? void 0 : _a.pois))
        return [];
      const sortedPois = [...currentDayData.value.pois].sort((a, b) => {
        var _a2, _b2;
        const sortA = ((_a2 = a.poi) == null ? void 0 : _a2.sort) || 0;
        const sortB = ((_b2 = b.poi) == null ? void 0 : _b2.sort) || 0;
        return sortA - sortB;
      });
      const scenicPois = sortedPois.filter((poi) => {
        var _a2;
        return ((_a2 = poi.poi) == null ? void 0 : _a2.poiType) === "scenic" && poi.detail;
      });
      const firstScenic = scenicPois[0];
      if (((_b = firstScenic == null ? void 0 : firstScenic.detail) == null ? void 0 : _b.suggestedVisitTime) && (firstScenic.detail.suggestedVisitTime.includes("\u5168\u5929") || firstScenic.detail.suggestedVisitTime.includes("\u4E00\u5929"))) {
        return [firstScenic.detail];
      }
      return scenicPois.map((poi) => poi.detail);
    });
    const currentDayFoods = common_vendor.computed(() => {
      var _a;
      if (!((_a = currentDayData.value) == null ? void 0 : _a.pois))
        return [];
      return currentDayData.value.pois.filter((poi) => {
        var _a2;
        return ((_a2 = poi.poi) == null ? void 0 : _a2.poiType) === "food" && poi.detail;
      }).map((poi) => poi.detail);
    });
    const routeTags = common_vendor.computed(() => {
      var _a, _b, _c, _d;
      const tags = [];
      if ((_b = (_a = routeData.value) == null ? void 0 : _a.route) == null ? void 0 : _b.suitablePeople) {
        tags.push(routeData.value.route.suitablePeople);
      }
      if ((_d = (_c = routeData.value) == null ? void 0 : _c.route) == null ? void 0 : _d.days) {
        tags.push(`${routeData.value.route.days}\u5929\u884C\u7A0B`);
      }
      return tags.length > 0 ? tags : ["\u667A\u80FD\u89C4\u5212"];
    });
    const routeRating = common_vendor.computed(() => {
      return "4.8";
    });
    const mapCenter = common_vendor.ref({
      latitude: 39.9042,
      longitude: 116.4074
    });
    const mapMarkers = common_vendor.ref([]);
    const mapPolyline = common_vendor.ref([]);
    const loadRouteDetail = async () => {
      if (!routeId.value)
        return;
      loading.value = true;
      try {
        const res = await api_route.routeApi.getDetail(routeId.value);
        if (res.statusCode === 200 && res.data.code === 200) {
          routeData.value = res.data.data;
          loadFavoriteStatus();
          initMapData();
        } else {
          common_vendor.index.showToast({ title: res.data.msg || "\u52A0\u8F7D\u5931\u8D25", icon: "none" });
        }
      } catch (e) {
        console.error("\u52A0\u8F7D\u8DEF\u7EBF\u8BE6\u60C5\u5931\u8D25:", e);
        common_vendor.index.showToast({ title: "\u7F51\u7EDC\u9519\u8BEF", icon: "none" });
      } finally {
        loading.value = false;
      }
    };
    const loadFavoriteStatus = () => {
      if (!routeId.value)
        return;
      const favorites = utils_storage.getCache("route_favorites") || [];
      isFavorite.value = favorites.includes(routeId.value);
    };
    const toggleFavorite = async () => {
      if (!user.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u767B\u5F55", icon: "none" });
        setTimeout(() => {
          common_vendor.index.switchTab({ url: "/pages/profile/profile" });
        }, 1500);
        return;
      }
      if (!routeId.value)
        return;
      try {
        await api_route.routeApi.toggleFavorite(user.value.id, routeId.value);
        isFavorite.value = !isFavorite.value;
        const favorites = utils_storage.getCache("route_favorites") || [];
        if (isFavorite.value) {
          if (!favorites.includes(routeId.value)) {
            favorites.push(routeId.value);
          }
        } else {
          const index = favorites.indexOf(routeId.value);
          if (index > -1) {
            favorites.splice(index, 1);
          }
        }
        utils_storage.setCache("route_favorites", favorites, 365 * 24 * 60);
        common_vendor.index.showToast({
          title: isFavorite.value ? "\u6536\u85CF\u6210\u529F" : "\u5DF2\u53D6\u6D88\u6536\u85CF",
          icon: "success"
        });
      } catch (e) {
        console.error("\u5207\u6362\u6536\u85CF\u5931\u8D25:", e);
        common_vendor.index.showToast({ title: "\u64CD\u4F5C\u5931\u8D25", icon: "none" });
      }
    };
    const initMapData = () => {
      var _a;
      if (!((_a = routeData.value) == null ? void 0 : _a.days))
        return;
      const markers = [];
      const polylines = [];
      let hasValidLocation = false;
      routeData.value.days.forEach((dayItem, dayIndex) => {
        if (!dayItem.pois)
          return;
        const sortedPois = [...dayItem.pois].sort((a, b) => {
          var _a2, _b;
          const sortA = ((_a2 = a.poi) == null ? void 0 : _a2.sort) || 0;
          const sortB = ((_b = b.poi) == null ? void 0 : _b.sort) || 0;
          return sortA - sortB;
        });
        const dayCoordinates = [];
        let dayMarkers = [];
        sortedPois.forEach((poiItem, poiIndex) => {
          var _a2;
          const detail = poiItem.detail;
          if (detail && (detail.latitude || detail.lat) && (detail.longitude || detail.lng || detail.lon)) {
            const lat = detail.latitude || detail.lat;
            const lng = detail.longitude || detail.lng || detail.lon;
            const marker = {
              id: `day${dayIndex}_poi${poiIndex}`,
              latitude: lat,
              longitude: lng,
              title: getPoiName(poiItem),
              width: 30,
              height: 30,
              iconPath: ((_a2 = poiItem.poi) == null ? void 0 : _a2.poiType) === "food" ? "/static/food-marker.png" : "/static/scenic-marker.png",
              callout: {
                content: `${getPoiName(poiItem)}`,
                color: "#333",
                fontSize: 12,
                borderRadius: 4,
                bgColor: "#fff",
                padding: 4,
                display: "BYCLICK"
              }
            };
            dayMarkers.push(marker);
            dayCoordinates.push({
              latitude: lat,
              longitude: lng
            });
            if (!hasValidLocation) {
              mapCenter.value = { latitude: lat, longitude: lng };
              hasValidLocation = true;
            }
          }
        });
        if (dayCoordinates.length > 1) {
          polylines.push({
            points: dayCoordinates,
            color: "#3BA272",
            width: 4,
            arrowLine: true,
            borderColor: "#2d8f5f",
            borderWidth: 1
          });
        }
        markers.push(...dayMarkers);
      });
      mapMarkers.value = markers;
      mapPolyline.value = polylines;
    };
    const formatDayContent = (dayData) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
      if (!dayData || !dayData.pois || dayData.pois.length === 0)
        return [];
      const sortedPois = [...dayData.pois].sort((a, b) => {
        var _a2, _b2;
        const sortA = ((_a2 = a.poi) == null ? void 0 : _a2.sort) || 0;
        const sortB = ((_b2 = b.poi) == null ? void 0 : _b2.sort) || 0;
        return sortA - sortB;
      });
      const scenicPois = sortedPois.filter((p) => {
        var _a2;
        return ((_a2 = p.poi) == null ? void 0 : _a2.poiType) === "scenic";
      });
      sortedPois.filter((p) => {
        var _a2;
        return ((_a2 = p.poi) == null ? void 0 : _a2.poiType) === "food";
      });
      const firstScenic = scenicPois[0];
      const isFullDay = ((_a = firstScenic == null ? void 0 : firstScenic.detail) == null ? void 0 : _a.suggestedVisitTime) && (firstScenic.detail.suggestedVisitTime.includes("\u5168\u5929") || firstScenic.detail.suggestedVisitTime.includes("\u4E00\u5929"));
      const groups = [];
      const morningGroup = {
        timeLabel: "\u4E0A\u5348",
        items: []
      };
      if (isFullDay) {
        const breakfastPoi = sortedPois.find((p) => {
          var _a2, _b2;
          const timeSlot = ((_a2 = p.poi) == null ? void 0 : _a2.timeSlot) || "";
          return ((_b2 = p.poi) == null ? void 0 : _b2.poiType) === "food" && timeSlot === "breakfast";
        }) || sortedPois.find((p) => {
          var _a2;
          return ((_a2 = p.poi) == null ? void 0 : _a2.poiType) === "food";
        });
        if (breakfastPoi && breakfastPoi.detail) {
          morningGroup.breakfast = {
            name: breakfastPoi.detail.name || "\u65E9\u9910",
            address: breakfastPoi.detail.address,
            specialty: breakfastPoi.detail.specialty || breakfastPoi.detail.intro,
            price: breakfastPoi.detail.avgPrice || breakfastPoi.detail.price
          };
        }
        if (firstScenic) {
          const scenic = firstScenic.detail;
          let lastLocation2 = morningGroup.breakfast ? morningGroup.breakfast.name : "";
          if (lastLocation2) {
            let routeInfo = null;
            if (firstScenic.route) {
              routeInfo = firstScenic.route;
            } else if ((_b = firstScenic.poi) == null ? void 0 : _b.note) {
              try {
                const noteJson = JSON.parse(firstScenic.poi.note);
                if (noteJson.from && noteJson.to) {
                  routeInfo = {
                    from: noteJson.from,
                    to: noteJson.to,
                    suggestedRoute: noteJson.suggestedRoute || "\u5EFA\u8BAE\u4F7F\u7528\u5BFC\u822A",
                    transport: noteJson.transport || "\u6B65\u884C/\u516C\u4EA4",
                    distance: noteJson.distance || "\u7EA61\u516C\u91CC"
                  };
                }
              } catch (e) {
              }
            }
            if (!routeInfo) {
              routeInfo = {
                from: lastLocation2,
                to: scenic.name,
                suggestedRoute: "\u5EFA\u8BAE\u4F7F\u7528\u5BFC\u822A",
                transport: "\u6B65\u884C/\u516C\u4EA4",
                distance: "\u7EA61\u516C\u91CC"
              };
            }
            morningGroup.items.push({ route: routeInfo });
          }
          let suggestedVisitTime = scenic.suggestedVisitTime;
          if (!suggestedVisitTime && ((_c = firstScenic.poi) == null ? void 0 : _c.stayTime)) {
            const stayMinutes = firstScenic.poi.stayTime;
            if (stayMinutes >= 60) {
              const hours = Math.floor(stayMinutes / 60);
              const minutes = stayMinutes % 60;
              suggestedVisitTime = minutes > 0 ? `\u7EA6${hours}\u5C0F\u65F6${minutes}\u5206\u949F` : `\u7EA6${hours}\u5C0F\u65F6`;
            } else {
              suggestedVisitTime = `\u7EA6${stayMinutes}\u5206\u949F`;
            }
          }
          let notes = ((_d = firstScenic.poi) == null ? void 0 : _d.note) || scenic.notes || scenic.ticketInfo;
          if (notes && typeof notes === "string" && notes.startsWith("{") && notes.includes("from")) {
            notes = scenic.notes || scenic.ticketInfo;
          }
          morningGroup.items.push({
            scenic: {
              name: scenic.name,
              intro: scenic.intro || scenic.description,
              suggestedVisitTime,
              notes,
              address: scenic.address,
              stationLabel: getStationLabel(1),
              sort: (_e = firstScenic.poi) == null ? void 0 : _e.sort
            }
          });
        }
        if (morningGroup.items.length > 0 || morningGroup.breakfast) {
          groups.push(morningGroup);
        }
        return groups;
      }
      let lastLocation = "";
      let stationIndex = 1;
      let consumedFoodIds = [];
      for (const poi of sortedPois) {
        const poiType = (_f = poi.poi) == null ? void 0 : _f.poiType;
        const timeSlot = ((_g = poi.poi) == null ? void 0 : _g.timeSlot) || "";
        if (poiType === "food" && timeSlot === "breakfast" && !consumedFoodIds.includes((_h = poi.detail) == null ? void 0 : _h.id)) {
          if (poi.detail) {
            morningGroup.breakfast = {
              name: poi.detail.name || "\u65E9\u9910",
              address: poi.detail.address,
              specialty: poi.detail.specialty || poi.detail.intro,
              price: poi.detail.avgPrice || poi.detail.price
            };
            lastLocation = poi.detail.name;
            consumedFoodIds.push(poi.detail.id);
          }
        } else if (poiType === "food" && timeSlot === "lunch" && !consumedFoodIds.includes((_i = poi.detail) == null ? void 0 : _i.id)) {
          if (poi.detail) {
            if (lastLocation) {
              let routeInfo = null;
              if (poi.route) {
                routeInfo = poi.route;
              } else if ((_j = poi.poi) == null ? void 0 : _j.note) {
                try {
                  const noteJson = JSON.parse(poi.poi.note);
                  if (noteJson.from && noteJson.to) {
                    routeInfo = {
                      from: noteJson.from,
                      to: noteJson.to,
                      suggestedRoute: noteJson.suggestedRoute || "\u5EFA\u8BAE\u4F7F\u7528\u5BFC\u822A",
                      transport: noteJson.transport || "\u6B65\u884C/\u516C\u4EA4",
                      distance: noteJson.distance || "\u7EA61\u516C\u91CC"
                    };
                  }
                } catch (e) {
                }
              }
              if (!routeInfo) {
                routeInfo = {
                  from: lastLocation,
                  to: poi.detail.name,
                  suggestedRoute: "\u5EFA\u8BAE\u4F7F\u7528\u5BFC\u822A",
                  transport: "\u6B65\u884C/\u516C\u4EA4",
                  distance: "\u7EA61\u516C\u91CC"
                };
              }
              morningGroup.items.push({ route: routeInfo });
            }
            morningGroup.lunch = {
              name: poi.detail.name || "\u5348\u9910",
              address: poi.detail.address,
              specialty: poi.detail.specialty || poi.detail.intro,
              price: poi.detail.avgPrice || poi.detail.price
            };
            lastLocation = poi.detail.name;
            consumedFoodIds.push(poi.detail.id);
          }
        } else if (poiType === "food" && timeSlot === "dinner" && !consumedFoodIds.includes((_k = poi.detail) == null ? void 0 : _k.id)) {
          if (poi.detail) {
            if (lastLocation) {
              let routeInfo = null;
              if (poi.route) {
                routeInfo = poi.route;
              } else if ((_l = poi.poi) == null ? void 0 : _l.note) {
                try {
                  const noteJson = JSON.parse(poi.poi.note);
                  if (noteJson.from && noteJson.to) {
                    routeInfo = {
                      from: noteJson.from,
                      to: noteJson.to,
                      suggestedRoute: noteJson.suggestedRoute || "\u5EFA\u8BAE\u4F7F\u7528\u5BFC\u822A",
                      transport: noteJson.transport || "\u6B65\u884C/\u516C\u4EA4",
                      distance: noteJson.distance || "\u7EA61\u516C\u91CC"
                    };
                  }
                } catch (e) {
                }
              }
              if (!routeInfo) {
                routeInfo = {
                  from: lastLocation,
                  to: poi.detail.name,
                  suggestedRoute: "\u5EFA\u8BAE\u4F7F\u7528\u5BFC\u822A",
                  transport: "\u6B65\u884C/\u516C\u4EA4",
                  distance: "\u7EA61\u516C\u91CC"
                };
              }
              morningGroup.items.push({ route: routeInfo });
            }
            morningGroup.dinner = {
              name: poi.detail.name || "\u665A\u9910",
              address: poi.detail.address,
              specialty: poi.detail.specialty || poi.detail.intro,
              price: poi.detail.avgPrice || poi.detail.price
            };
            lastLocation = poi.detail.name;
            consumedFoodIds.push(poi.detail.id);
          }
        } else if (poiType === "scenic" && poi.detail) {
          const scenic = poi.detail;
          if (lastLocation) {
            let routeInfo = null;
            if (poi.route) {
              routeInfo = poi.route;
            } else if ((_m = poi.poi) == null ? void 0 : _m.note) {
              try {
                const noteJson = JSON.parse(poi.poi.note);
                if (noteJson.from && noteJson.to) {
                  routeInfo = {
                    from: noteJson.from,
                    to: noteJson.to,
                    suggestedRoute: noteJson.suggestedRoute || "\u5EFA\u8BAE\u4F7F\u7528\u5BFC\u822A",
                    transport: noteJson.transport || "\u6B65\u884C/\u516C\u4EA4",
                    distance: noteJson.distance || "\u7EA61\u516C\u91CC"
                  };
                }
              } catch (e) {
              }
            }
            if (!routeInfo) {
              routeInfo = {
                from: lastLocation,
                to: scenic.name,
                suggestedRoute: "\u5EFA\u8BAE\u4F7F\u7528\u5BFC\u822A",
                transport: "\u6B65\u884C/\u516C\u4EA4",
                distance: "\u7EA61\u516C\u91CC"
              };
            }
            morningGroup.items.push({ route: routeInfo });
          }
          let suggestedVisitTime = scenic.suggestedVisitTime;
          if (!suggestedVisitTime && ((_n = poi.poi) == null ? void 0 : _n.stayTime)) {
            const stayMinutes = poi.poi.stayTime;
            if (stayMinutes >= 60) {
              const hours = Math.floor(stayMinutes / 60);
              const minutes = stayMinutes % 60;
              suggestedVisitTime = minutes > 0 ? `\u7EA6${hours}\u5C0F\u65F6${minutes}\u5206\u949F` : `\u7EA6${hours}\u5C0F\u65F6`;
            } else {
              suggestedVisitTime = `\u7EA6${stayMinutes}\u5206\u949F`;
            }
          }
          let notes = ((_o = poi.poi) == null ? void 0 : _o.note) || scenic.notes || scenic.ticketInfo;
          if (notes && typeof notes === "string" && notes.startsWith("{") && notes.includes("from")) {
            notes = scenic.notes || scenic.ticketInfo;
          }
          morningGroup.items.push({
            scenic: {
              name: scenic.name,
              intro: scenic.intro || scenic.description,
              suggestedVisitTime,
              notes,
              address: scenic.address,
              stationLabel: getStationLabel(stationIndex++),
              sort: (_p = poi.poi) == null ? void 0 : _p.sort
            }
          });
          lastLocation = scenic.name;
        }
      }
      if (morningGroup.items.length > 0 || morningGroup.breakfast || morningGroup.lunch || morningGroup.dinner) {
        groups.push(morningGroup);
      }
      return groups;
    };
    const getStationLabel = (index) => {
      const labels = ["\u7B2C\u4E00\u7AD9", "\u7B2C\u4E8C\u7AD9", "\u7B2C\u4E09\u7AD9", "\u7B2C\u56DB\u7AD9", "\u7B2C\u4E94\u7AD9", "\u7B2C\u516D\u7AD9", "\u7B2C\u4E03\u7AD9", "\u7B2C\u516B\u7AD9", "\u7B2C\u4E5D\u7AD9", "\u7B2C\u5341\u7AD9"];
      if (index <= labels.length) {
        return labels[index - 1];
      }
      return `\u7B2C${index}\u7AD9`;
    };
    const getPoiName = (poiItem) => {
      var _a, _b;
      if ((_a = poiItem.detail) == null ? void 0 : _a.name) {
        return poiItem.detail.name;
      }
      return ((_b = poiItem.poi) == null ? void 0 : _b.note) || "\u672A\u77E5\u5730\u70B9";
    };
    const toggleExpand = () => {
      isExpanded.value = !isExpanded.value;
    };
    const getDayDate = (dayIndex, dayNo) => {
      const actualDayIndex = dayNo !== void 0 ? dayNo - 1 : dayIndex;
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + actualDayIndex);
      const month = targetDate.getMonth() + 1;
      const date = targetDate.getDate();
      const weekdays = ["\u5468\u65E5", "\u5468\u4E00", "\u5468\u4E8C", "\u5468\u4E09", "\u5468\u56DB", "\u5468\u4E94", "\u5468\u516D"];
      const weekday = weekdays[targetDate.getDay()];
      return `${month}\u6708${date}\u65E5(${weekday})`;
    };
    const viewFullMap = () => {
      activeTab.value = "map";
    };
    const startNavigation = () => {
      var _a;
      if (!((_a = routeData.value) == null ? void 0 : _a.days) || routeData.value.days.length === 0) {
        common_vendor.index.showToast({ title: "\u6682\u65E0\u884C\u7A0B\u6570\u636E", icon: "none" });
        return;
      }
      for (const dayItem of routeData.value.days) {
        if (!dayItem.pois)
          continue;
        for (const poiItem of dayItem.pois) {
          const detail = poiItem.detail;
          if (detail && (detail.latitude || detail.lat) && (detail.longitude || detail.lng || detail.lon)) {
            const lat = detail.latitude || detail.lat;
            const lng = detail.longitude || detail.lng || detail.lon;
            common_vendor.index.openLocation({
              latitude: lat,
              longitude: lng,
              name: getPoiName(poiItem),
              address: detail.address || ""
            });
            return;
          }
        }
      }
      common_vendor.index.showToast({ title: "\u6682\u65E0\u4F4D\u7F6E\u4FE1\u606F", icon: "none" });
    };
    const enableItinerary = () => {
      if (!routeId.value)
        return;
      const myRoutes = utils_storage.getCache("my_routes") || [];
      if (!myRoutes.includes(routeId.value)) {
        myRoutes.push(routeId.value);
        utils_storage.setCache("my_routes", myRoutes, 365 * 24 * 60);
      }
      common_vendor.index.showToast({ title: "\u5DF2\u542F\u7528\u6B64\u884C\u7A0B", icon: "success" });
    };
    const onViewScenic = (scenic) => {
      if (!scenic || !scenic.id)
        return;
      common_vendor.index.navigateTo({
        url: `/pages/scenic/detail?id=${scenic.id}`
      });
    };
    const onViewFood = (food) => {
      if (!food || !food.id)
        return;
      common_vendor.index.navigateTo({
        url: `/pages/food/detail?id=${food.id}`
      });
    };
    common_vendor.onLoad((options) => {
      if (options.id) {
        routeId.value = Number(options.id);
        loadRouteDetail();
      }
    });
    common_vendor.onShow(() => {
      if (routeId.value) {
        loadFavoriteStatus();
      }
    });
    return (_ctx, _cache) => {
      var _a, _b, _c, _d, _e;
      return common_vendor.e({
        a: activeTab.value === "itinerary" ? 1 : "",
        b: common_vendor.o(($event) => activeTab.value = "itinerary"),
        c: activeTab.value === "map" ? 1 : "",
        d: common_vendor.o(($event) => activeTab.value = "map"),
        e: !loading.value && routeData.value
      }, !loading.value && routeData.value ? common_vendor.e({
        f: common_vendor.t(((_a = routeData.value.route) == null ? void 0 : _a.routeName) || "\u672A\u547D\u540D\u884C\u7A0B"),
        g: common_vendor.f(common_vendor.unref(routeTags), (tag, index, i0) => {
          return {
            a: common_vendor.t(tag),
            b: index
          };
        }),
        h: common_vendor.unref(routeRating)
      }, common_vendor.unref(routeRating) ? {
        i: common_vendor.t(common_vendor.unref(routeRating))
      } : {}, {
        j: (_b = routeData.value.route) == null ? void 0 : _b.summary
      }, ((_c = routeData.value.route) == null ? void 0 : _c.summary) ? common_vendor.e({
        k: common_vendor.t(isExpanded.value ? "\u25BC" : "\u25B6"),
        l: isExpanded.value ? 1 : "",
        m: common_vendor.t(isExpanded.value ? "\u6536\u8D77" : "\u5C55\u5F00\u8BE6\u60C5"),
        n: common_vendor.o(toggleExpand),
        o: isExpanded.value
      }, isExpanded.value ? {
        p: common_vendor.t(routeData.value.route.summary)
      } : {}) : {}, {
        q: activeTab.value === "itinerary"
      }, activeTab.value === "itinerary" ? {
        r: mapCenter.value.latitude,
        s: mapCenter.value.longitude,
        t: mapMarkers.value,
        v: mapPolyline.value,
        w: common_vendor.o(viewFullMap)
      } : {}, {
        x: activeTab.value === "itinerary" && routeData.value.days && routeData.value.days.length > 0
      }, activeTab.value === "itinerary" && routeData.value.days && routeData.value.days.length > 0 ? common_vendor.e({
        y: common_vendor.f(routeData.value.days, (dayItem, dayIndex, i0) => {
          var _a2, _b2;
          return {
            a: common_vendor.t(((_a2 = dayItem.day) == null ? void 0 : _a2.dayNo) || dayIndex + 1),
            b: ((_b2 = dayItem.day) == null ? void 0 : _b2.id) || dayIndex,
            c: selectedDayIndex.value === dayIndex ? 1 : "",
            d: common_vendor.o(($event) => selectedDayIndex.value = dayIndex)
          };
        }),
        z: common_vendor.unref(currentDayData)
      }, common_vendor.unref(currentDayData) ? common_vendor.e({
        A: common_vendor.t(((_d = common_vendor.unref(currentDayData).day) == null ? void 0 : _d.dayNo) || selectedDayIndex.value + 1),
        B: common_vendor.t(getDayDate(selectedDayIndex.value, (_e = common_vendor.unref(currentDayData).day) == null ? void 0 : _e.dayNo)),
        C: common_vendor.f(formatDayContent(common_vendor.unref(currentDayData)), (timeGroup, timeIndex, i0) => {
          return common_vendor.e({
            a: common_vendor.t(timeGroup.timeLabel),
            b: timeGroup.breakfast
          }, timeGroup.breakfast ? common_vendor.e({
            c: common_vendor.t(timeGroup.breakfast.name),
            d: timeGroup.breakfast.address
          }, timeGroup.breakfast.address ? {
            e: common_vendor.t(timeGroup.breakfast.address)
          } : {}, {
            f: timeGroup.breakfast.specialty
          }, timeGroup.breakfast.specialty ? {
            g: common_vendor.t(timeGroup.breakfast.specialty)
          } : {}, {
            h: timeGroup.breakfast.price
          }, timeGroup.breakfast.price ? {
            i: common_vendor.t(timeGroup.breakfast.price)
          } : {}) : {}, {
            j: timeGroup.lunch
          }, timeGroup.lunch ? common_vendor.e({
            k: common_vendor.t(timeGroup.lunch.name),
            l: timeGroup.lunch.address
          }, timeGroup.lunch.address ? {
            m: common_vendor.t(timeGroup.lunch.address)
          } : {}, {
            n: timeGroup.lunch.specialty
          }, timeGroup.lunch.specialty ? {
            o: common_vendor.t(timeGroup.lunch.specialty)
          } : {}, {
            p: timeGroup.lunch.price
          }, timeGroup.lunch.price ? {
            q: common_vendor.t(timeGroup.lunch.price)
          } : {}) : {}, {
            r: timeGroup.dinner
          }, timeGroup.dinner ? common_vendor.e({
            s: common_vendor.t(timeGroup.dinner.name),
            t: timeGroup.dinner.address
          }, timeGroup.dinner.address ? {
            v: common_vendor.t(timeGroup.dinner.address)
          } : {}, {
            w: timeGroup.dinner.specialty
          }, timeGroup.dinner.specialty ? {
            x: common_vendor.t(timeGroup.dinner.specialty)
          } : {}, {
            y: timeGroup.dinner.price
          }, timeGroup.dinner.price ? {
            z: common_vendor.t(timeGroup.dinner.price)
          } : {}) : {}, {
            A: common_vendor.f(timeGroup.items, (item, itemIndex, i1) => {
              return common_vendor.e({
                a: item.route
              }, item.route ? common_vendor.e({
                b: common_vendor.t(item.route.from),
                c: common_vendor.t(item.route.to),
                d: item.route.suggestedRoute
              }, item.route.suggestedRoute ? {
                e: common_vendor.t(item.route.suggestedRoute)
              } : {}, {
                f: item.route.transport
              }, item.route.transport ? {
                g: common_vendor.t(item.route.transport)
              } : {}, {
                h: item.route.distance
              }, item.route.distance ? {
                i: common_vendor.t(item.route.distance)
              } : {}) : {}, {
                j: item.scenic
              }, item.scenic ? common_vendor.e({
                k: common_vendor.t(item.scenic.stationLabel || "\u7B2C\u4E00\u7AD9"),
                l: common_vendor.t(item.scenic.name),
                m: item.scenic.intro
              }, item.scenic.intro ? {
                n: common_vendor.t(item.scenic.intro)
              } : {}, {
                o: item.scenic.suggestedVisitTime
              }, item.scenic.suggestedVisitTime ? {
                p: common_vendor.t(item.scenic.suggestedVisitTime)
              } : {}, {
                q: item.scenic.notes
              }, item.scenic.notes ? {
                r: common_vendor.t(item.scenic.notes)
              } : {}, {
                s: item.scenic.address
              }, item.scenic.address ? {
                t: common_vendor.t(item.scenic.address)
              } : {}) : {}, {
                v: itemIndex
              });
            }),
            B: timeIndex
          });
        }),
        D: common_vendor.unref(currentDayScenics).length > 0
      }, common_vendor.unref(currentDayScenics).length > 0 ? {
        E: common_vendor.f(common_vendor.unref(currentDayScenics), (scenic, k0, i0) => {
          return common_vendor.e({
            a: scenic.imageUrl
          }, scenic.imageUrl ? {
            b: scenic.imageUrl
          } : {}, {
            c: common_vendor.t(scenic.name),
            d: scenic.address
          }, scenic.address ? {
            e: common_vendor.t(scenic.address)
          } : {}, {
            f: scenic.price && scenic.price > 0
          }, scenic.price && scenic.price > 0 ? {
            g: common_vendor.t(scenic.price)
          } : {}, {
            h: scenic.score
          }, scenic.score ? {
            i: common_vendor.t(scenic.score)
          } : {}, {
            j: scenic.id,
            k: common_vendor.o(($event) => onViewScenic(scenic))
          });
        })
      } : {}, {
        F: common_vendor.unref(currentDayFoods).length > 0
      }, common_vendor.unref(currentDayFoods).length > 0 ? {
        G: common_vendor.f(common_vendor.unref(currentDayFoods), (food, k0, i0) => {
          return common_vendor.e({
            a: food.imageUrl
          }, food.imageUrl ? {
            b: food.imageUrl
          } : {}, {
            c: common_vendor.t(food.name),
            d: food.address
          }, food.address ? {
            e: common_vendor.t(food.address)
          } : {}, {
            f: food.avgPrice
          }, food.avgPrice ? {
            g: common_vendor.t(food.avgPrice)
          } : {}, {
            h: food.score
          }, food.score ? {
            i: common_vendor.t(food.score)
          } : {}, {
            j: food.id,
            k: common_vendor.o(($event) => onViewFood(food))
          });
        })
      } : {}) : {}) : {}, {
        H: activeTab.value === "map"
      }, activeTab.value === "map" ? {
        I: mapCenter.value.latitude,
        J: mapCenter.value.longitude,
        K: mapMarkers.value,
        L: mapPolyline.value
      } : {}) : {}, {
        M: loading.value
      }, loading.value ? {} : {}, {
        N: common_vendor.t(isFavorite.value ? "\u2665" : "\u2661"),
        O: isFavorite.value ? 1 : "",
        P: common_vendor.o(toggleFavorite),
        Q: common_vendor.o(startNavigation),
        R: common_vendor.o(enableItinerary)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1656b44a"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/itinerary/itinerary-detail.vue"]]);
wx.createPage(MiniProgramPage);
