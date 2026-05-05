"use strict";
var common_vendor = require("../../common/vendor.js");
var api_route = require("../../api/route.js");
var store_user = require("../../store/user.js");
var utils_storage = require("../../utils/storage.js");
var utils_config = require("../../utils/config.js");
var utils_image = require("../../utils/image.js");
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
    const safeText = (value) => {
      if (value == null)
        return "";
      if (typeof value === "string")
        return value;
      if (typeof value === "number" || typeof value === "boolean")
        return String(value);
      try {
        return JSON.stringify(value);
      } catch (e) {
        return "";
      }
    };
    const parseDayIntro = (dayData) => {
      var _a;
      const intro = (_a = dayData == null ? void 0 : dayData.day) == null ? void 0 : _a.intro;
      const empty = { morning: "", noon: "", afternoon: "", evening: "" };
      if (!intro)
        return empty;
      const introText = safeText(intro).trim();
      if (!introText)
        return empty;
      try {
        if (introText.startsWith("{") && introText.endsWith("}")) {
          const parsed = JSON.parse(introText);
          return {
            morning: safeText(parsed == null ? void 0 : parsed.morning),
            noon: safeText((parsed == null ? void 0 : parsed.noon) || (parsed == null ? void 0 : parsed.lunch)),
            afternoon: safeText(parsed == null ? void 0 : parsed.afternoon),
            evening: safeText(parsed == null ? void 0 : parsed.evening)
          };
        }
      } catch (e) {
      }
      return {
        morning: introText,
        noon: "",
        afternoon: "",
        evening: ""
      };
    };
    const parseAiBlockFields = (text) => {
      const raw = safeText(text).trim();
      const empty = { title: "", timeSchedule: "", detail: "", transport: "", rawFallback: "" };
      if (!raw)
        return empty;
      const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
      const timeRe = /^\*?\s*时间安排[：:]\s*(.+)$/;
      const detailRe = /^\*?\s*详细行程[：:]\s*(.+)$/;
      const transRe = /^\*?\s*交通方式[：:]\s*(.+)$/;
      const isFieldLine = (line) => timeRe.test(line) || detailRe.test(line) || transRe.test(line);
      const firstFieldIdx = lines.findIndex((l) => isFieldLine(l));
      if (firstFieldIdx === -1) {
        return { title: "", timeSchedule: "", detail: "", transport: "", rawFallback: raw };
      }
      const title = firstFieldIdx > 0 ? lines.slice(0, firstFieldIdx).join("\n").trim() : "";
      let timeSchedule = "";
      let detail = "";
      let transport = "";
      let pendingDetail = false;
      for (let i = firstFieldIdx; i < lines.length; i++) {
        const line = lines[i];
        const tm = line.match(timeRe);
        if (tm) {
          timeSchedule = tm[1].trim();
          pendingDetail = false;
          continue;
        }
        const dm = line.match(detailRe);
        if (dm) {
          detail = dm[1].trim();
          pendingDetail = true;
          continue;
        }
        const trm = line.match(transRe);
        if (trm) {
          transport = trm[1].trim();
          pendingDetail = false;
          continue;
        }
        if (pendingDetail) {
          detail += (detail ? "\n" : "") + line;
        }
      }
      const hasStruct = !!(timeSchedule || detail || transport);
      if (!hasStruct) {
        return { title: "", timeSchedule: "", detail: "", transport: "", rawFallback: raw };
      }
      return { title, timeSchedule, detail, transport, rawFallback: "" };
    };
    const aiTimelineBlocks = common_vendor.computed(() => {
      const day = currentDayData.value;
      if (!day)
        return [];
      const intro = parseDayIntro(day);
      const rawBlocks = [
        { key: "morning", label: "\u4E0A\u5348", text: safeText(intro.morning).trim() },
        { key: "noon", label: "\u4E2D\u5348", text: safeText(intro.noon).trim() },
        { key: "afternoon", label: "\u4E0B\u5348", text: safeText(intro.afternoon).trim() },
        { key: "evening", label: "\u665A\u4E0A", text: safeText(intro.evening).trim() }
      ];
      return rawBlocks.filter((b) => b.text.length > 0).map((b) => ({
        label: b.label,
        fields: parseAiBlockFields(b.text)
      }));
    });
    const useAiTimelineOnly = common_vendor.computed(() => aiTimelineBlocks.value.length > 0);
    const isNarrativeRelevant = (text, names) => {
      const content = safeText(text).trim();
      if (!content)
        return false;
      if (!names || names.length === 0)
        return false;
      return names.some((name) => !!name && content.includes(name));
    };
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
    const routeMapMode = common_vendor.ref("day");
    const markerIconCache = common_vendor.ref({});
    let mapUpdateGen = 0;
    const DAY_LINE_COLORS = ["#3BA272", "#2F7DDB", "#F59E0B", "#EF4444", "#8B5CF6", "#14B8A6", "#EC4899"];
    const getDayLineColor = (dayNo) => DAY_LINE_COLORS[(Math.max(1, dayNo) - 1) % DAY_LINE_COLORS.length];
    const fullMapLegends = common_vendor.computed(() => {
      var _a, _b;
      if (activeTab.value !== "map" || routeMapMode.value !== "full" || !((_b = (_a = routeData.value) == null ? void 0 : _a.days) == null ? void 0 : _b.length))
        return [];
      return routeData.value.days.map((day, idx) => {
        var _a2;
        const dayNo = Number(((_a2 = day == null ? void 0 : day.day) == null ? void 0 : _a2.dayNo) || idx + 1);
        return {
          dayNo,
          color: getDayLineColor(dayNo)
        };
      });
    });
    const createPoiMarkerIcon = (type) => {
      if (markerIconCache.value[type]) {
        return Promise.resolve(markerIconCache.value[type]);
      }
      return new Promise((resolve) => {
        try {
          const ctx = common_vendor.index.createCanvasContext("poi-marker-canvas");
          const size = 64;
          const r = 22;
          const cx = size / 2;
          const cy = 28;
          ctx.clearRect(0, 0, size, size);
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, 2 * Math.PI);
          ctx.closePath();
          const fill = type === "food" ? "#3BA272" : "#5D92B0";
          ctx.setFillStyle(fill);
          ctx.fill();
          ctx.setStrokeStyle("#FFFFFF");
          ctx.setLineWidth(4);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx, cy + r + 2);
          ctx.lineTo(cx - 10, cy + r + 18);
          ctx.lineTo(cx + 10, cy + r + 18);
          ctx.closePath();
          ctx.setFillStyle(fill);
          ctx.fill();
          ctx.setStrokeStyle("#FFFFFF");
          ctx.setLineWidth(3);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
          ctx.closePath();
          ctx.setFillStyle("#FFFFFF");
          ctx.fill();
          ctx.draw(false, () => {
            setTimeout(() => {
              common_vendor.index.canvasToTempFilePath({
                canvasId: "poi-marker-canvas",
                success: (res) => {
                  markerIconCache.value[type] = res.tempFilePath;
                  resolve(res.tempFilePath);
                },
                fail: () => {
                  resolve("");
                }
              });
            }, 60);
          });
        } catch {
          resolve("");
        }
      });
    };
    const loadRouteDetail = async () => {
      if (!routeId.value)
        return;
      loading.value = true;
      try {
        const res = await api_route.routeApi.getDetail(routeId.value);
        if (res.statusCode === 200 && res.data.code === 200) {
          routeData.value = res.data.data;
          loadFavoriteStatus();
          updateMapData();
        } else {
          common_vendor.index.showToast({ title: res.data.msg || "\u52A0\u8F7D\u5931\u8D25", icon: "none" });
        }
      } catch (e) {
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
        common_vendor.index.showToast({ title: "\u64CD\u4F5C\u5931\u8D25", icon: "none" });
      }
    };
    const toCoordNumber = (v) => {
      const n = typeof v === "number" ? v : parseFloat(String(v));
      return Number.isFinite(n) ? n : null;
    };
    const isChinaCoord = (lat, lng) => lat >= 3 && lat <= 54.5 && lng >= 73 && lng <= 135.5;
    const extractPoiCoord = (detail) => {
      var _a, _b, _c;
      if (!detail)
        return null;
      const latRaw = (_a = detail.latitude) != null ? _a : detail.lat;
      const lngRaw = (_c = (_b = detail.longitude) != null ? _b : detail.lng) != null ? _c : detail.lon;
      const lat = toCoordNumber(latRaw);
      const lng = toCoordNumber(lngRaw);
      if (lat == null || lng == null)
        return null;
      if (!isChinaCoord(lat, lng))
        return null;
      return { latitude: lat, longitude: lng };
    };
    const updateMapData = () => {
      var _a, _b;
      routeMapMode.value = "day";
      const gen = ++mapUpdateGen;
      mapMarkers.value = [];
      mapPolyline.value = [];
      if (!((_a = routeData.value) == null ? void 0 : _a.days) || routeData.value.days.length === 0)
        return;
      const dayItem = routeData.value.days[selectedDayIndex.value];
      if (!dayItem || !dayItem.pois || dayItem.pois.length === 0) {
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
      const dayCoordinates = [];
      const dayNo = ((_b = dayItem.day) == null ? void 0 : _b.dayNo) || selectedDayIndex.value + 1;
      let poiOrder = 1;
      Promise.all([createPoiMarkerIcon("scenic"), createPoiMarkerIcon("food")]).then(([scenicIcon, foodIcon]) => {
        if (gen !== mapUpdateGen)
          return;
        sortedPois.forEach((poiItem, poiIndex) => {
          var _a2, _b2;
          const detail = poiItem.detail;
          if (!detail) {
            return;
          }
          const coord = extractPoiCoord(detail);
          if (coord) {
            const lat = coord.latitude;
            const lng = coord.longitude;
            const isScenic = ((_a2 = poiItem.poi) == null ? void 0 : _a2.poiType) === "scenic";
            const orderLabel = isScenic ? `D${dayNo}-${poiOrder}` : "";
            const poiName = getPoiName(poiItem);
            const markerTitle = orderLabel ? `${orderLabel} ${poiName}` : poiName;
            const markerId = (dayNo || 1) * 1e3 + (poiIndex + 1);
            const isFood = ((_b2 = poiItem.poi) == null ? void 0 : _b2.poiType) === "food";
            const marker = {
              id: markerId,
              latitude: lat,
              longitude: lng,
              title: markerTitle,
              width: 40,
              height: 40,
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
            const icon = isFood ? foodIcon : scenicIcon;
            if (icon)
              marker.iconPath = icon;
            markers.push(marker);
            dayCoordinates.push({
              latitude: lat,
              longitude: lng
            });
            if (isScenic) {
              poiOrder++;
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
        if (gen === mapUpdateGen) {
          mapMarkers.value = markers;
          mapPolyline.value = polylines;
        }
      }).catch(() => {
      });
    };
    const updateFullMapData = () => {
      var _a;
      routeMapMode.value = "full";
      const gen = ++mapUpdateGen;
      mapMarkers.value = [];
      mapPolyline.value = [];
      const days = ((_a = routeData.value) == null ? void 0 : _a.days) || [];
      if (!days.length)
        return;
      Promise.all([createPoiMarkerIcon("scenic"), createPoiMarkerIcon("food")]).then(([scenicIcon, foodIcon]) => {
        if (gen !== mapUpdateGen)
          return;
        const markers = [];
        const polylines = [];
        const allCoords = [];
        days.forEach((dayItem, dayIdx) => {
          var _a2;
          const sortedPois = [...(dayItem == null ? void 0 : dayItem.pois) || []].sort((a, b) => {
            var _a3, _b;
            const sortA = ((_a3 = a.poi) == null ? void 0 : _a3.sort) || 0;
            const sortB = ((_b = b.poi) == null ? void 0 : _b.sort) || 0;
            return sortA - sortB;
          });
          const dayNo = Number(((_a2 = dayItem == null ? void 0 : dayItem.day) == null ? void 0 : _a2.dayNo) || dayIdx + 1);
          const dayCoords = [];
          let scenicSeq = 1;
          sortedPois.forEach((poiItem, poiIdx) => {
            var _a3;
            const detail = poiItem == null ? void 0 : poiItem.detail;
            const coord = extractPoiCoord(detail);
            if (!coord)
              return;
            const isFood = ((_a3 = poiItem.poi) == null ? void 0 : _a3.poiType) === "food";
            const markerTitle = `${isFood ? "\u98DF" : "\u666F"} Day${dayNo}-${isFood ? poiIdx + 1 : scenicSeq} ${getPoiName(poiItem)}`;
            if (!isFood)
              scenicSeq++;
            const marker = {
              id: dayNo * 1e4 + poiIdx + 1,
              latitude: coord.latitude,
              longitude: coord.longitude,
              title: markerTitle,
              width: 34,
              height: 34,
              callout: {
                content: markerTitle,
                color: "#2d2d2d",
                fontSize: 12,
                borderRadius: 6,
                bgColor: "#ffffff",
                padding: 6,
                display: "BYCLICK",
                textAlign: "center"
              }
            };
            const icon = isFood ? foodIcon : scenicIcon;
            if (icon)
              marker.iconPath = icon;
            markers.push(marker);
            dayCoords.push(coord);
            allCoords.push(coord);
          });
          if (dayCoords.length > 1) {
            polylines.push({
              points: dayCoords,
              color: getDayLineColor(dayNo),
              width: 5,
              arrowLine: true,
              dottedLine: false
            });
          }
        });
        if (allCoords.length) {
          let sumLat = 0;
          let sumLng = 0;
          allCoords.forEach((p) => {
            sumLat += p.latitude;
            sumLng += p.longitude;
          });
          mapCenter.value = {
            latitude: sumLat / allCoords.length,
            longitude: sumLng / allCoords.length
          };
        }
        if (gen === mapUpdateGen) {
          mapMarkers.value = markers;
          mapPolyline.value = polylines;
        }
      }).catch(() => {
      });
    };
    const formatDayContent = (dayData) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
      if (!dayData || !dayData.pois || dayData.pois.length === 0)
        return [];
      const dayIntro = parseDayIntro(dayData);
      const poiNames = (dayData.pois || []).map((p) => {
        var _a2;
        return safeText((_a2 = p == null ? void 0 : p.detail) == null ? void 0 : _a2.name).trim();
      }).filter((name) => !!name);
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
      if (isFullDay && scenicPois.length === 1) {
        const morningGroup2 = {
          timeLabel: "\u4E0A\u5348",
          description: dayIntro.morning,
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
            morningGroup2.items.push({ route: routeInfo });
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
          morningGroup2.items.push({
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
        return [morningGroup2];
      }
      const groups = [];
      const morningGroup = {
        timeLabel: "\u4E0A\u5348",
        description: isNarrativeRelevant(dayIntro.morning, poiNames) ? dayIntro.morning : "",
        items: []
      };
      const noonGroup = {
        timeLabel: "\u4E2D\u5348",
        description: isNarrativeRelevant(dayIntro.noon, poiNames) ? dayIntro.noon : "",
        items: []
      };
      const afternoonGroup = {
        timeLabel: "\u4E0B\u5348",
        description: isNarrativeRelevant(dayIntro.afternoon, poiNames) ? dayIntro.afternoon : "",
        items: []
      };
      const eveningGroup = {
        timeLabel: "\u665A\u4E0A",
        description: isNarrativeRelevant(dayIntro.evening, poiNames) ? dayIntro.evening : "",
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
        } else if (poiType === "scenic" && poi.detail) {
          const scenic = poi.detail;
          scenicCount++;
          if (!lunchInserted && lunchPoi && scenicCount >= lunchInsertAfterScenic) {
            if (lastLocation && lunchPoi.detail) {
              let routeInfo = null;
              if (lunchPoi.route) {
                routeInfo = lunchPoi.route;
              } else if ((_i = lunchPoi.poi) == null ? void 0 : _i.note) {
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
                to: scenic.name,
                suggestedRoute: "\u5EFA\u8BAE\u4F7F\u7528\u5BFC\u822A",
                transport: "\u6B65\u884C/\u516C\u4EA4",
                distance: "\u7EA61\u516C\u91CC"
              };
            }
            targetGroup.items.push({ route: routeInfo });
          }
          let suggestedVisitTime = scenic.suggestedVisitTime;
          if (!suggestedVisitTime && ((_k = poi.poi) == null ? void 0 : _k.stayTime)) {
            const stayMinutes = poi.poi.stayTime;
            if (stayMinutes >= 60) {
              const hours = Math.floor(stayMinutes / 60);
              const minutes = stayMinutes % 60;
              suggestedVisitTime = minutes > 0 ? `\u7EA6${hours}\u5C0F\u65F6${minutes}\u5206\u949F` : `\u7EA6${hours}\u5C0F\u65F6`;
            } else {
              suggestedVisitTime = `\u7EA6${stayMinutes}\u5206\u949F`;
            }
          }
          let notes = ((_l = poi.poi) == null ? void 0 : _l.note) || scenic.notes || scenic.ticketInfo;
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
              sort: (_m = poi.poi) == null ? void 0 : _m.sort
            }
          });
          lastLocation = scenic.name;
        } else if (poiType === "food" && timeSlot === "lunch" && !consumedFoodIds.includes((_n = poi.detail) == null ? void 0 : _n.id)) {
          if (poi.detail && !lunchInserted) {
            if (lastLocation) {
              let routeInfo = null;
              if (poi.route) {
                routeInfo = poi.route;
              } else if ((_o = poi.poi) == null ? void 0 : _o.note) {
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
        } else if (poiType === "food" && timeSlot === "dinner" && !consumedFoodIds.includes((_p = poi.detail) == null ? void 0 : _p.id)) {
          if (poi.detail) {
            if (lastLocation) {
              let routeInfo = null;
              if (poi.route) {
                routeInfo = poi.route;
              } else if ((_q = poi.poi) == null ? void 0 : _q.note) {
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
      updateFullMapData();
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
        api_route.routeApi.recordView(routeId.value).then(() => {
          var _a;
          const r = (_a = routeData.value) == null ? void 0 : _a.route;
          if (r)
            r.viewCount = Number(r.viewCount || 0) + 1;
        }).catch(() => {
        });
        loadRouteDetail();
      }
    });
    common_vendor.onShow(() => {
      if (routeId.value) {
        loadFavoriteStatus();
      }
    });
    common_vendor.watch(selectedDayIndex, () => {
      if (routeData.value && activeTab.value !== "map") {
        updateMapData();
      }
    });
    common_vendor.watch(activeTab, (tab) => {
      if (!routeData.value)
        return;
      if (tab === "map") {
        updateFullMapData();
      } else {
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
        C: common_vendor.unref(useAiTimelineOnly)
      }, common_vendor.unref(useAiTimelineOnly) ? {
        D: common_vendor.f(common_vendor.unref(aiTimelineBlocks), (block, blockIndex, i0) => {
          return common_vendor.e({
            a: common_vendor.t(block.label),
            b: block.fields.rawFallback
          }, block.fields.rawFallback ? {
            c: common_vendor.t(block.fields.rawFallback)
          } : common_vendor.e({
            d: block.fields.title
          }, block.fields.title ? {
            e: common_vendor.t(block.fields.title)
          } : {}, {
            f: block.fields.timeSchedule
          }, block.fields.timeSchedule ? {
            g: common_vendor.t(block.fields.timeSchedule)
          } : {}, {
            h: block.fields.detail
          }, block.fields.detail ? {
            i: common_vendor.t(block.fields.detail)
          } : {}, {
            j: block.fields.transport
          }, block.fields.transport ? {
            k: common_vendor.t(block.fields.transport)
          } : {}), {
            l: `ai-${blockIndex}`
          });
        })
      } : {
        E: common_vendor.f(formatDayContent(common_vendor.unref(currentDayData)), (timeGroup, timeIndex, i0) => {
          return common_vendor.e({
            a: common_vendor.t(timeGroup.timeLabel),
            b: timeGroup.description
          }, timeGroup.description ? {
            c: common_vendor.t(timeGroup.description)
          } : {}, {
            d: timeGroup.breakfast
          }, timeGroup.breakfast ? common_vendor.e({
            e: common_vendor.t(timeGroup.breakfast.name),
            f: timeGroup.breakfast.address
          }, timeGroup.breakfast.address ? {
            g: common_vendor.t(timeGroup.breakfast.address)
          } : {}, {
            h: timeGroup.breakfast.specialty
          }, timeGroup.breakfast.specialty ? {
            i: common_vendor.t(timeGroup.breakfast.specialty)
          } : {}, {
            j: timeGroup.breakfast.price
          }, timeGroup.breakfast.price ? {
            k: common_vendor.t(timeGroup.breakfast.price)
          } : {}) : {}, {
            l: timeGroup.lunch
          }, timeGroup.lunch ? common_vendor.e({
            m: common_vendor.t(timeGroup.lunch.name),
            n: timeGroup.lunch.address
          }, timeGroup.lunch.address ? {
            o: common_vendor.t(timeGroup.lunch.address)
          } : {}, {
            p: timeGroup.lunch.specialty
          }, timeGroup.lunch.specialty ? {
            q: common_vendor.t(timeGroup.lunch.specialty)
          } : {}, {
            r: timeGroup.lunch.price
          }, timeGroup.lunch.price ? {
            s: common_vendor.t(timeGroup.lunch.price)
          } : {}) : {}, {
            t: timeGroup.dinner
          }, timeGroup.dinner ? common_vendor.e({
            v: common_vendor.t(timeGroup.dinner.name),
            w: timeGroup.dinner.address
          }, timeGroup.dinner.address ? {
            x: common_vendor.t(timeGroup.dinner.address)
          } : {}, {
            y: timeGroup.dinner.specialty
          }, timeGroup.dinner.specialty ? {
            z: common_vendor.t(timeGroup.dinner.specialty)
          } : {}, {
            A: timeGroup.dinner.price
          }, timeGroup.dinner.price ? {
            B: common_vendor.t(timeGroup.dinner.price)
          } : {}) : {}, {
            C: common_vendor.f(timeGroup.items, (item, itemIndex, i1) => {
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
            D: timeIndex
          });
        })
      }, {
        F: !common_vendor.unref(useAiTimelineOnly) && common_vendor.unref(currentDayScenics).length > 0
      }, !common_vendor.unref(useAiTimelineOnly) && common_vendor.unref(currentDayScenics).length > 0 ? {
        G: common_vendor.f(common_vendor.unref(currentDayScenics), (scenic, k0, i0) => {
          return common_vendor.e({
            a: scenic.imageUrl ? common_vendor.unref(utils_image.getImageUrl)(scenic.imageUrl) : common_vendor.unref(utils_config.defaultScenicImage),
            b: common_vendor.t(scenic.name),
            c: scenic.address
          }, scenic.address ? {
            d: common_vendor.t(scenic.address)
          } : {}, {
            e: scenic.price && scenic.price > 0
          }, scenic.price && scenic.price > 0 ? {
            f: common_vendor.t(scenic.price)
          } : {}, {
            g: scenic.score
          }, scenic.score ? {
            h: common_vendor.t(scenic.score)
          } : {}, {
            i: scenic.id,
            j: common_vendor.o(($event) => onViewScenic(scenic))
          });
        })
      } : {}, {
        H: !common_vendor.unref(useAiTimelineOnly) && common_vendor.unref(currentDayFoods).length > 0
      }, !common_vendor.unref(useAiTimelineOnly) && common_vendor.unref(currentDayFoods).length > 0 ? {
        I: common_vendor.f(common_vendor.unref(currentDayFoods), (food, k0, i0) => {
          return common_vendor.e({
            a: food.imageUrl ? common_vendor.unref(utils_image.getImageUrl)(food.imageUrl) : common_vendor.unref(utils_config.defaultFoodImage),
            b: common_vendor.t(food.name),
            c: food.address
          }, food.address ? {
            d: common_vendor.t(food.address)
          } : {}, {
            e: food.avgPrice
          }, food.avgPrice ? {
            f: common_vendor.t(food.avgPrice)
          } : {}, {
            g: food.score
          }, food.score ? {
            h: common_vendor.t(food.score)
          } : {}, {
            i: food.id,
            j: common_vendor.o(($event) => onViewFood(food))
          });
        })
      } : {}) : {}) : {}, {
        J: activeTab.value === "map"
      }, activeTab.value === "map" ? common_vendor.e({
        K: mapCenter.value.latitude,
        L: mapCenter.value.longitude,
        M: mapMarkers.value,
        N: mapPolyline.value,
        O: common_vendor.unref(fullMapLegends).length > 0
      }, common_vendor.unref(fullMapLegends).length > 0 ? {
        P: common_vendor.f(common_vendor.unref(fullMapLegends), (item, k0, i0) => {
          return {
            a: item.color,
            b: common_vendor.t(item.dayNo),
            c: item.dayNo
          };
        })
      } : {}) : {}) : {}, {
        Q: loading.value
      }, loading.value ? {} : {}, {
        R: common_vendor.t(isFavorite.value ? "\u2665" : "\u2661"),
        S: isFavorite.value ? 1 : "",
        T: common_vendor.o(toggleFavorite),
        U: common_vendor.o(startNavigation),
        V: common_vendor.o(enableItinerary)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1656b44a"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/itinerary/itinerary-detail.vue"]]);
wx.createPage(MiniProgramPage);
