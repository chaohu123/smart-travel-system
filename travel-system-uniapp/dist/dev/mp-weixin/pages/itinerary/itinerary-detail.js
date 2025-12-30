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
      var _a;
      if (!((_a = currentDayData.value) == null ? void 0 : _a.pois))
        return [];
      return currentDayData.value.pois.filter((poi) => {
        var _a2;
        return ((_a2 = poi.poi) == null ? void 0 : _a2.poiType) === "scenic" && poi.detail;
      }).map((poi) => poi.detail);
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
      if (!dayData || !dayData.pois || dayData.pois.length === 0)
        return [];
      const sortedPois = [...dayData.pois].sort((a, b) => {
        var _a, _b;
        const sortA = ((_a = a.poi) == null ? void 0 : _a.sort) || 0;
        const sortB = ((_b = b.poi) == null ? void 0 : _b.sort) || 0;
        return sortA - sortB;
      });
      const groups = [];
      const timeGroups = {};
      sortedPois.forEach((poi, index) => {
        var _a, _b;
        const sort = ((_a = poi.poi) == null ? void 0 : _a.sort) || index + 1;
        let timeLabel = "\u4E0A\u5348";
        if (((_b = poi.poi) == null ? void 0 : _b.poiType) === "food") {
          if (sort <= 1) {
            timeLabel = "\u4E0A\u5348";
          } else if (sort <= 3) {
            timeLabel = "\u4E2D\u5348";
          } else {
            timeLabel = "\u665A\u4E0A";
          }
        } else {
          timeLabel = sort <= sortedPois.length / 2 ? "\u4E0A\u5348" : "\u4E0B\u5348";
        }
        if (!timeGroups[timeLabel]) {
          timeGroups[timeLabel] = [];
        }
        timeGroups[timeLabel].push(poi);
      });
      Object.keys(timeGroups).forEach((timeLabel) => {
        const pois = timeGroups[timeLabel];
        const group = {
          timeLabel,
          items: []
        };
        if (timeLabel === "\u4E0A\u5348") {
          const breakfastPoi = pois.find((p) => {
            var _a;
            return ((_a = p.poi) == null ? void 0 : _a.poiType) === "food";
          });
          if (breakfastPoi && breakfastPoi.detail) {
            group.breakfast = {
              name: breakfastPoi.detail.name || "\u65E9\u9910",
              address: breakfastPoi.detail.address,
              specialty: breakfastPoi.detail.specialty || breakfastPoi.detail.intro,
              price: breakfastPoi.detail.avgPrice || breakfastPoi.detail.price
            };
          }
        }
        let lastLocation = "";
        if (group.breakfast) {
          lastLocation = group.breakfast.name;
        }
        pois.forEach((poi, index) => {
          var _a, _b, _c, _d, _e, _f, _g;
          if (((_a = poi.poi) == null ? void 0 : _a.poiType) === "food" && timeLabel === "\u4E0A\u5348") {
            return;
          }
          if (((_b = poi.poi) == null ? void 0 : _b.poiType) === "scenic" && poi.detail) {
            const scenic = poi.detail;
            if (lastLocation) {
              let routeInfo = null;
              if (poi.route) {
                routeInfo = poi.route;
              } else if ((_c = poi.poi) == null ? void 0 : _c.note) {
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
              group.items.push({
                route: routeInfo
              });
            }
            let notes = ((_d = poi.poi) == null ? void 0 : _d.note) || scenic.notes || scenic.ticketInfo;
            if (notes && typeof notes === "string" && notes.startsWith("{") && notes.includes("from")) {
              notes = scenic.notes || scenic.ticketInfo;
            }
            let suggestedVisitTime = scenic.suggestedVisitTime;
            if (!suggestedVisitTime && ((_e = poi.poi) == null ? void 0 : _e.stayTime)) {
              const stayMinutes = poi.poi.stayTime;
              if (stayMinutes >= 60) {
                const hours = Math.floor(stayMinutes / 60);
                const minutes = stayMinutes % 60;
                suggestedVisitTime = minutes > 0 ? `\u7EA6${hours}\u5C0F\u65F6${minutes}\u5206\u949F` : `\u7EA6${hours}\u5C0F\u65F6`;
              } else {
                suggestedVisitTime = `\u7EA6${stayMinutes}\u5206\u949F`;
              }
            }
            group.items.push({
              scenic: {
                name: scenic.name,
                intro: scenic.intro || scenic.description,
                suggestedVisitTime,
                notes,
                address: scenic.address,
                time: formatTime((_f = poi.poi) == null ? void 0 : _f.sort, timeLabel),
                sort: (_g = poi.poi) == null ? void 0 : _g.sort
              }
            });
            lastLocation = scenic.name;
          }
        });
        if (group.items.length > 0 || group.breakfast) {
          groups.push(group);
        }
      });
      const timeOrder = ["\u4E0A\u5348", "\u4E2D\u5348", "\u4E0B\u5348", "\u665A\u4E0A"];
      groups.sort((a, b) => {
        return timeOrder.indexOf(a.timeLabel) - timeOrder.indexOf(b.timeLabel);
      });
      return groups;
    };
    const formatTime = (sort, timeLabel) => {
      if (timeLabel === "\u4E0A\u5348") {
        return "09:00";
      } else if (timeLabel === "\u4E2D\u5348") {
        return "13:00";
      } else if (timeLabel === "\u4E0B\u5348") {
        return "15:00";
      } else if (timeLabel === "\u665A\u4E0A") {
        return "18:00";
      }
      if (sort) {
        let hour = 9;
        if (sort <= 2) {
          hour = 9;
        } else if (sort <= 4) {
          hour = 13;
        } else if (sort <= 6) {
          hour = 15;
        } else {
          hour = 18;
        }
        return `${String(hour).padStart(2, "0")}:00`;
      }
      return "09:00";
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
            j: common_vendor.f(timeGroup.items, (item, itemIndex, i1) => {
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
                k: common_vendor.t(item.scenic.time || formatTime(item.scenic.sort, timeGroup.timeLabel)),
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
            k: timeIndex
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
