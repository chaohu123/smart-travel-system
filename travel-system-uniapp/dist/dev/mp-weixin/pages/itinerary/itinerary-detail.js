"use strict";
var common_vendor = require("../../common/vendor.js");
var api_route = require("../../api/route.js");
var store_user = require("../../store/user.js");
var utils_storage = require("../../utils/storage.js");
require("../../utils/http.js");
require("../../utils/config.js");
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
      var _a;
      if (!((_a = currentDayData.value) == null ? void 0 : _a.pois))
        return [];
      const sortedPois = [...currentDayData.value.pois].sort((a, b) => {
        var _a2, _b;
        const sortA = ((_a2 = a.poi) == null ? void 0 : _a2.sort) || 0;
        const sortB = ((_b = b.poi) == null ? void 0 : _b.sort) || 0;
        return sortA - sortB;
      });
      const scenicPois = sortedPois.filter((poi) => {
        var _a2;
        return ((_a2 = poi.poi) == null ? void 0 : _a2.poiType) === "scenic" && poi.detail;
      });
      return scenicPois.map((poi) => poi.detail);
    });
    const currentDayFoods = common_vendor.computed(() => {
      var _a;
      if (!((_a = currentDayData.value) == null ? void 0 : _a.pois))
        return [];
      const sortedPois = [...currentDayData.value.pois].sort((a, b) => {
        var _a2, _b;
        const sortA = ((_a2 = a.poi) == null ? void 0 : _a2.sort) || 0;
        const sortB = ((_b = b.poi) == null ? void 0 : _b.sort) || 0;
        return sortA - sortB;
      });
      const foodMap = /* @__PURE__ */ new Map();
      sortedPois.forEach((poi) => {
        var _a2;
        if (((_a2 = poi.poi) == null ? void 0 : _a2.poiType) === "food" && poi.detail) {
          const foodId = poi.detail.id;
          if (!foodMap.has(foodId)) {
            foodMap.set(foodId, poi.detail);
          }
        }
      });
      return Array.from(foodMap.values());
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
      var _a, _b, _c, _d, _e;
      if (!routeId.value)
        return;
      loading.value = true;
      try {
        const res = await api_route.routeApi.getDetail(routeId.value);
        console.log("========== \u8DEF\u7EBF\u8BE6\u60C5API\u8FD4\u56DE\u6570\u636E ==========");
        console.log("\u5B8C\u6574\u54CD\u5E94:", JSON.stringify(res, null, 2));
        if (res.statusCode === 200 && res.data.code === 200) {
          routeData.value = res.data.data;
          console.log("\u8DEF\u7EBF\u6570\u636E:", routeData.value);
          console.log("\u8DEF\u7EBF\u540D\u79F0:", (_b = (_a = routeData.value) == null ? void 0 : _a.route) == null ? void 0 : _b.routeName);
          console.log("\u5929\u6570:", (_d = (_c = routeData.value) == null ? void 0 : _c.days) == null ? void 0 : _d.length);
          if ((_e = routeData.value) == null ? void 0 : _e.days) {
            routeData.value.days.forEach((dayItem, dayIndex) => {
              var _a2, _b2;
              const dayNo = ((_a2 = dayItem.day) == null ? void 0 : _a2.dayNo) || dayIndex + 1;
              console.log(`
========== Day ${dayNo} \u6570\u636E ==========`);
              console.log("Day\u5BF9\u8C61:", dayItem.day);
              console.log("POI\u6570\u91CF:", ((_b2 = dayItem.pois) == null ? void 0 : _b2.length) || 0);
              if (dayItem.pois && dayItem.pois.length > 0) {
                const sortedPois = [...dayItem.pois].sort((a, b) => {
                  var _a3, _b3;
                  const sortA = ((_a3 = a.poi) == null ? void 0 : _a3.sort) || 0;
                  const sortB = ((_b3 = b.poi) == null ? void 0 : _b3.sort) || 0;
                  return sortA - sortB;
                });
                sortedPois.forEach((poi, poiIndex) => {
                  var _a3, _b3, _c2, _d2;
                  const poiType = ((_a3 = poi.poi) == null ? void 0 : _a3.poiType) || "unknown";
                  const poiId = (_b3 = poi.poi) == null ? void 0 : _b3.poiId;
                  const sort = ((_c2 = poi.poi) == null ? void 0 : _c2.sort) || 0;
                  const detail = poi.detail;
                  const name = (detail == null ? void 0 : detail.name) || "\u672A\u77E5";
                  const timeSlot = ((_d2 = poi.poi) == null ? void 0 : _d2.timeSlot) || "";
                  console.log(`  POI[${poiIndex}] (sort=${sort}):`);
                  console.log(`    \u7C7B\u578B: ${poiType}`);
                  console.log(`    POI ID: ${poiId}`);
                  console.log(`    \u540D\u79F0: ${name}`);
                  console.log(`    \u65F6\u95F4\u6BB5: ${timeSlot || "\u65E0"}`);
                  if (detail == null ? void 0 : detail.address) {
                    console.log(`    \u5730\u5740: ${detail.address}`);
                  }
                  if (poiType === "scenic" && (detail == null ? void 0 : detail.suggestedVisitTime)) {
                    console.log(`    \u5EFA\u8BAE\u6E38\u73A9\u65F6\u95F4: ${detail.suggestedVisitTime}`);
                  }
                });
              } else {
                console.log("  \u8BE5\u5929\u6CA1\u6709POI\u6570\u636E");
              }
            });
          }
          console.log("========================================\n");
          loadFavoriteStatus();
          updateMapData();
        } else {
          console.error("API\u8FD4\u56DE\u9519\u8BEF:", res.data);
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
    const updateMapData = () => {
      var _a, _b;
      mapMarkers.value = [];
      mapPolyline.value = [];
      if (!((_a = routeData.value) == null ? void 0 : _a.days) || routeData.value.days.length === 0)
        return;
      const dayItem = routeData.value.days[selectedDayIndex.value];
      if (!dayItem || !dayItem.pois || dayItem.pois.length === 0) {
        console.log("\u5F53\u524D\u5929\u6CA1\u6709POI\u6570\u636E");
        return;
      }
      const markers = [];
      const polylines = [];
      const sortedPois = [...dayItem.pois].sort((a, b) => {
        var _a2, _b2;
        const sortA = ((_a2 = a.poi) == null ? void 0 : _a2.sort) || 0;
        const sortB = ((_b2 = b.poi) == null ? void 0 : _b2.sort) || 0;
        return sortA - sortB;
      });
      console.log(`\u66F4\u65B0\u5730\u56FE\u6570\u636E - Day ${selectedDayIndex.value + 1}, POI\u6570\u91CF: ${sortedPois.length}`);
      const dayCoordinates = [];
      const dayNo = ((_b = dayItem.day) == null ? void 0 : _b.dayNo) || selectedDayIndex.value + 1;
      let poiOrder = 1;
      sortedPois.forEach((poiItem, poiIndex) => {
        var _a2, _b2;
        const detail = poiItem.detail;
        if (!detail) {
          console.warn(`POI ${poiIndex} \u6CA1\u6709detail\u6570\u636E`);
          return;
        }
        if (detail && (detail.latitude || detail.lat) && (detail.longitude || detail.lng || detail.lon)) {
          const lat = detail.latitude || detail.lat;
          const lng = detail.longitude || detail.lng || detail.lon;
          const isScenic = ((_a2 = poiItem.poi) == null ? void 0 : _a2.poiType) === "scenic";
          const orderLabel = isScenic ? `D${dayNo}-${poiOrder}` : "";
          const poiName = getPoiName(poiItem);
          const markerTitle = orderLabel ? `${orderLabel} ${poiName}` : poiName;
          const marker = {
            id: `day${selectedDayIndex.value}_poi${poiIndex}`,
            latitude: lat,
            longitude: lng,
            title: markerTitle,
            width: 40,
            height: 40,
            iconPath: ((_b2 = poiItem.poi) == null ? void 0 : _b2.poiType) === "food" ? "/static/food-marker.png" : "/static/scenic-marker.png",
            callout: {
              content: markerTitle,
              color: "#333",
              fontSize: 14,
              borderRadius: 4,
              bgColor: "#fff",
              padding: 8,
              display: "BYCLICK",
              textAlign: "center"
            }
          };
          markers.push(marker);
          dayCoordinates.push({
            latitude: lat,
            longitude: lng
          });
          if (isScenic) {
            poiOrder++;
          }
        } else {
          console.warn(`POI ${poiIndex} (${getPoiName(poiItem)}) \u6CA1\u6709\u6709\u6548\u7684\u5750\u6807\u4FE1\u606F`);
        }
      });
      console.log(`\u5730\u56FE\u6807\u8BB0\u6570\u91CF: ${markers.length}, \u5750\u6807\u70B9\u6570\u91CF: ${dayCoordinates.length}`);
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
      if (dayCoordinates.length > 0) {
        let sumLat = 0;
        let sumLng = 0;
        dayCoordinates.forEach((coord) => {
          sumLat += coord.latitude;
          sumLng += coord.longitude;
        });
        mapCenter.value = {
          latitude: sumLat / dayCoordinates.length,
          longitude: sumLng / dayCoordinates.length
        };
      }
      mapMarkers.value = markers;
      mapPolyline.value = polylines;
    };
    const formatDayContent = (dayData) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t;
      if (!dayData || !dayData.pois || dayData.pois.length === 0)
        return [];
      const sortedPois = [...dayData.pois].sort((a, b) => {
        var _a2, _b2;
        const sortA = ((_a2 = a.poi) == null ? void 0 : _a2.sort) || 0;
        const sortB = ((_b2 = b.poi) == null ? void 0 : _b2.sort) || 0;
        return sortA - sortB;
      });
      const dayNo = ((_a = dayData.day) == null ? void 0 : _a.dayNo) || selectedDayIndex.value + 1;
      console.log(`
========== formatDayContent - Day ${dayNo} ==========`);
      console.log("\u6392\u5E8F\u540E\u7684POI\u5217\u8868:");
      sortedPois.forEach((poi, index) => {
        var _a2, _b2, _c2, _d2;
        const poiType = ((_a2 = poi.poi) == null ? void 0 : _a2.poiType) || "unknown";
        const sort = ((_b2 = poi.poi) == null ? void 0 : _b2.sort) || 0;
        const name = ((_c2 = poi.detail) == null ? void 0 : _c2.name) || "\u672A\u77E5";
        const timeSlot = ((_d2 = poi.poi) == null ? void 0 : _d2.timeSlot) || "";
        console.log(`  [${index}] sort=${sort}, type=${poiType}, name=${name}, timeSlot=${timeSlot}`);
      });
      const scenicPois = sortedPois.filter((p) => {
        var _a2;
        return ((_a2 = p.poi) == null ? void 0 : _a2.poiType) === "scenic";
      });
      const foodPois = sortedPois.filter((p) => {
        var _a2;
        return ((_a2 = p.poi) == null ? void 0 : _a2.poiType) === "food";
      });
      console.log(`\u666F\u70B9\u6570\u91CF: ${scenicPois.length}, \u7F8E\u98DF\u6570\u91CF: ${foodPois.length}`);
      const firstScenic = scenicPois[0];
      const isFullDay = ((_b = firstScenic == null ? void 0 : firstScenic.detail) == null ? void 0 : _b.suggestedVisitTime) && (firstScenic.detail.suggestedVisitTime.includes("\u5168\u5929") || firstScenic.detail.suggestedVisitTime.includes("\u4E00\u5929"));
      if (firstScenic) {
        console.log(`\u7B2C\u4E00\u4E2A\u666F\u70B9: ${(_c = firstScenic.detail) == null ? void 0 : _c.name}, \u6E38\u73A9\u65F6\u95F4: ${(_d = firstScenic.detail) == null ? void 0 : _d.suggestedVisitTime}, \u662F\u5426\u5168\u5929: ${isFullDay}`);
      }
      if (isFullDay && scenicPois.length === 1) {
        const morningGroup2 = {
          timeLabel: "\u4E0A\u5348",
          items: []
        };
        const breakfastPoi = sortedPois.find((p) => {
          var _a2, _b2;
          const timeSlot = ((_a2 = p.poi) == null ? void 0 : _a2.timeSlot) || "";
          return ((_b2 = p.poi) == null ? void 0 : _b2.poiType) === "food" && timeSlot === "breakfast";
        }) || sortedPois.find((p) => {
          var _a2;
          return ((_a2 = p.poi) == null ? void 0 : _a2.poiType) === "food";
        });
        if (breakfastPoi && breakfastPoi.detail) {
          morningGroup2.breakfast = {
            name: breakfastPoi.detail.name || "\u65E9\u9910",
            address: breakfastPoi.detail.address,
            specialty: breakfastPoi.detail.specialty || breakfastPoi.detail.intro,
            price: breakfastPoi.detail.avgPrice || breakfastPoi.detail.price
          };
        }
        if (firstScenic) {
          const scenic = firstScenic.detail;
          let lastLocation2 = morningGroup2.breakfast ? morningGroup2.breakfast.name : "";
          if (lastLocation2) {
            let routeInfo = null;
            if (firstScenic.route) {
              routeInfo = firstScenic.route;
            } else if ((_e = firstScenic.poi) == null ? void 0 : _e.note) {
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
            morningGroup2.items.push({ route: routeInfo });
          }
          let suggestedVisitTime = scenic.suggestedVisitTime;
          if (!suggestedVisitTime && ((_f = firstScenic.poi) == null ? void 0 : _f.stayTime)) {
            const stayMinutes = firstScenic.poi.stayTime;
            if (stayMinutes >= 60) {
              const hours = Math.floor(stayMinutes / 60);
              const minutes = stayMinutes % 60;
              suggestedVisitTime = minutes > 0 ? `\u7EA6${hours}\u5C0F\u65F6${minutes}\u5206\u949F` : `\u7EA6${hours}\u5C0F\u65F6`;
            } else {
              suggestedVisitTime = `\u7EA6${stayMinutes}\u5206\u949F`;
            }
          }
          let notes = ((_g = firstScenic.poi) == null ? void 0 : _g.note) || scenic.notes || scenic.ticketInfo;
          if (notes && typeof notes === "string" && notes.startsWith("{") && notes.includes("from")) {
            notes = scenic.notes || scenic.ticketInfo;
          }
          morningGroup2.items.push({
            scenic: {
              name: scenic.name,
              intro: scenic.intro || scenic.description,
              suggestedVisitTime,
              notes,
              address: scenic.address,
              stationLabel: getStationLabel(1),
              sort: (_h = firstScenic.poi) == null ? void 0 : _h.sort
            }
          });
        }
        return [morningGroup2];
      }
      const groups = [];
      const morningGroup = {
        timeLabel: "\u4E0A\u5348",
        items: []
      };
      const noonGroup = {
        timeLabel: "\u4E2D\u5348",
        items: []
      };
      const afternoonGroup = {
        timeLabel: "\u4E0B\u5348",
        items: []
      };
      const eveningGroup = {
        timeLabel: "\u665A\u4E0A",
        items: []
      };
      let lastLocation = "";
      let stationIndex = 1;
      let consumedFoodIds = [];
      let scenicCount = 0;
      let lunchInserted = false;
      const lunchPoi = sortedPois.find((p) => {
        var _a2, _b2;
        const timeSlot = ((_a2 = p.poi) == null ? void 0 : _a2.timeSlot) || "";
        return ((_b2 = p.poi) == null ? void 0 : _b2.poiType) === "food" && timeSlot === "lunch";
      });
      const totalScenics = scenicPois.length;
      const lunchInsertAfterScenic = totalScenics > 0 ? Math.max(1, Math.min(totalScenics, Math.ceil(totalScenics * 0.4))) : 0;
      for (const poi of sortedPois) {
        const poiType = (_i = poi.poi) == null ? void 0 : _i.poiType;
        const timeSlot = ((_j = poi.poi) == null ? void 0 : _j.timeSlot) || "";
        if (poiType === "food" && timeSlot === "breakfast" && !consumedFoodIds.includes((_k = poi.detail) == null ? void 0 : _k.id)) {
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
        } else if (poiType === "scenic" && poi.detail) {
          const scenic = poi.detail;
          scenicCount++;
          if (!lunchInserted && lunchPoi && scenicCount >= lunchInsertAfterScenic) {
            if (lastLocation && lunchPoi.detail) {
              let routeInfo = null;
              if (lunchPoi.route) {
                routeInfo = lunchPoi.route;
              } else if ((_l = lunchPoi.poi) == null ? void 0 : _l.note) {
                try {
                  const noteJson = JSON.parse(lunchPoi.poi.note);
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
                  to: lunchPoi.detail.name,
                  suggestedRoute: "\u5EFA\u8BAE\u4F7F\u7528\u5BFC\u822A",
                  transport: "\u6B65\u884C/\u516C\u4EA4",
                  distance: "\u7EA61\u516C\u91CC"
                };
              }
              noonGroup.items.push({ route: routeInfo });
            }
            noonGroup.lunch = {
              name: lunchPoi.detail.name || "\u5348\u9910",
              address: lunchPoi.detail.address,
              specialty: lunchPoi.detail.specialty || lunchPoi.detail.intro,
              price: lunchPoi.detail.avgPrice || lunchPoi.detail.price
            };
            lastLocation = lunchPoi.detail.name;
            consumedFoodIds.push(lunchPoi.detail.id);
            lunchInserted = true;
          }
          let targetGroup = morningGroup;
          if (lunchInserted) {
            if (scenicCount > lunchInsertAfterScenic) {
              targetGroup = afternoonGroup;
            } else {
              targetGroup = morningGroup;
            }
          } else {
            if (scenicCount > lunchInsertAfterScenic) {
              targetGroup = afternoonGroup;
            } else {
              targetGroup = morningGroup;
            }
          }
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
            targetGroup.items.push({ route: routeInfo });
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
          targetGroup.items.push({
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
        } else if (poiType === "food" && timeSlot === "lunch" && !consumedFoodIds.includes((_q = poi.detail) == null ? void 0 : _q.id)) {
          if (poi.detail && !lunchInserted) {
            if (lastLocation) {
              let routeInfo = null;
              if (poi.route) {
                routeInfo = poi.route;
              } else if ((_r = poi.poi) == null ? void 0 : _r.note) {
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
              noonGroup.items.push({ route: routeInfo });
            }
            noonGroup.lunch = {
              name: poi.detail.name || "\u5348\u9910",
              address: poi.detail.address,
              specialty: poi.detail.specialty || poi.detail.intro,
              price: poi.detail.avgPrice || poi.detail.price
            };
            lastLocation = poi.detail.name;
            consumedFoodIds.push(poi.detail.id);
            lunchInserted = true;
          }
        } else if (poiType === "food" && timeSlot === "dinner" && !consumedFoodIds.includes((_s = poi.detail) == null ? void 0 : _s.id)) {
          if (poi.detail) {
            if (lastLocation) {
              let routeInfo = null;
              if (poi.route) {
                routeInfo = poi.route;
              } else if ((_t = poi.poi) == null ? void 0 : _t.note) {
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
              eveningGroup.items.push({ route: routeInfo });
            }
            eveningGroup.dinner = {
              name: poi.detail.name || "\u665A\u9910",
              address: poi.detail.address,
              specialty: poi.detail.specialty || poi.detail.intro,
              price: poi.detail.avgPrice || poi.detail.price
            };
            lastLocation = poi.detail.name;
            consumedFoodIds.push(poi.detail.id);
          }
        }
      }
      if (morningGroup.items.length > 0 || morningGroup.breakfast) {
        groups.push(morningGroup);
      }
      if (noonGroup.items.length > 0 || noonGroup.lunch) {
        groups.push(noonGroup);
      }
      if (afternoonGroup.items.length > 0) {
        groups.push(afternoonGroup);
      }
      if (eveningGroup.items.length > 0 || eveningGroup.dinner) {
        groups.push(eveningGroup);
      }
      console.log(`\u683C\u5F0F\u5316\u5B8C\u6210\uFF0C\u751F\u6210 ${groups.length} \u4E2A\u65F6\u95F4\u6BB5\u7EC4`);
      groups.forEach((group, index) => {
        console.log(`  \u65F6\u95F4\u6BB5\u7EC4[${index}]: ${group.timeLabel}`);
        if (group.breakfast)
          console.log(`    \u65E9\u9910: ${group.breakfast.name}`);
        if (group.lunch)
          console.log(`    \u5348\u9910: ${group.lunch.name}`);
        if (group.dinner)
          console.log(`    \u665A\u9910: ${group.dinner.name}`);
        console.log(`    \u666F\u70B9\u6570\u91CF: ${group.items.filter((item) => item.scenic).length}`);
      });
      console.log("========================================\n");
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
    const handleDayChange = (dayIndex) => {
      selectedDayIndex.value = dayIndex;
      updateMapData();
    };
    const viewFullMap = () => {
      activeTab.value = "map";
      updateMapData();
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
    common_vendor.watch(selectedDayIndex, () => {
      if (routeData.value) {
        updateMapData();
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
            d: common_vendor.o(($event) => handleDayChange(dayIndex))
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
