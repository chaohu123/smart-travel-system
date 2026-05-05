"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var store_user = require("../../store/user.js");
var utils_amapDistrict = require("../../utils/amapDistrict.js");
require("../../utils/http.js");
require("../../utils/storage.js");
require("../../utils/config.js");
require("../../utils/image.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    var _a;
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const mapPageProxy = (_a = common_vendor.getCurrentInstance()) == null ? void 0 : _a.proxy;
    const stats = common_vendor.ref({
      provinces: 0,
      cities: 0,
      attractions: 0,
      foods: 0
    });
    const checkinData = common_vendor.ref([]);
    const checkedProvinces = common_vendor.ref(/* @__PURE__ */ new Set());
    const checkedCities = common_vendor.ref(/* @__PURE__ */ new Set());
    const visitedProvinceKeywords = common_vendor.ref(/* @__PURE__ */ new Set());
    const cityCoordinates = {
      \u5317\u4EAC: { latitude: 39.9042, longitude: 116.4074 },
      \u4E0A\u6D77: { latitude: 31.2304, longitude: 121.4737 },
      \u5E7F\u5DDE: { latitude: 23.1291, longitude: 113.2644 },
      \u6DF1\u5733: { latitude: 22.5431, longitude: 114.0579 },
      \u676D\u5DDE: { latitude: 30.2741, longitude: 120.1551 },
      \u5357\u4EAC: { latitude: 32.0603, longitude: 118.7969 },
      \u6210\u90FD: { latitude: 30.6624, longitude: 104.0633 },
      \u91CD\u5E86: { latitude: 29.563, longitude: 106.5516 },
      \u897F\u5B89: { latitude: 34.3416, longitude: 108.9398 },
      \u6B66\u6C49: { latitude: 30.5928, longitude: 114.3055 },
      \u5929\u6D25: { latitude: 39.3434, longitude: 117.3616 },
      \u82CF\u5DDE: { latitude: 31.2989, longitude: 120.5853 },
      \u957F\u6C99: { latitude: 28.2278, longitude: 112.9388 },
      \u90D1\u5DDE: { latitude: 34.7466, longitude: 113.6254 },
      \u6D4E\u5357: { latitude: 36.6512, longitude: 117.1201 },
      \u9752\u5C9B: { latitude: 36.0671, longitude: 120.3826 },
      \u53A6\u95E8: { latitude: 24.4798, longitude: 118.0819 },
      \u798F\u5DDE: { latitude: 26.0745, longitude: 119.2965 },
      \u6606\u660E: { latitude: 25.0389, longitude: 102.7183 },
      \u5408\u80A5: { latitude: 31.8206, longitude: 117.2272 },
      \u5357\u660C: { latitude: 28.682, longitude: 115.8579 }
    };
    const provinceNameMap = {
      \u5317\u4EAC\u5E02: "\u5317\u4EAC",
      \u5929\u6D25\u5E02: "\u5929\u6D25",
      \u6CB3\u5317\u7701: "\u6CB3\u5317",
      \u5C71\u897F\u7701: "\u5C71\u897F",
      \u5185\u8499\u53E4\u81EA\u6CBB\u533A: "\u5185\u8499\u53E4",
      \u8FBD\u5B81\u7701: "\u8FBD\u5B81",
      \u5409\u6797\u7701: "\u5409\u6797",
      \u9ED1\u9F99\u6C5F\u7701: "\u9ED1\u9F99\u6C5F",
      \u4E0A\u6D77\u5E02: "\u4E0A\u6D77",
      \u6C5F\u82CF\u7701: "\u6C5F\u82CF",
      \u6D59\u6C5F\u7701: "\u6D59\u6C5F",
      \u5B89\u5FBD\u7701: "\u5B89\u5FBD",
      \u798F\u5EFA\u7701: "\u798F\u5EFA",
      \u6C5F\u897F\u7701: "\u6C5F\u897F",
      \u5C71\u4E1C\u7701: "\u5C71\u4E1C",
      \u6CB3\u5357\u7701: "\u6CB3\u5357",
      \u6E56\u5317\u7701: "\u6E56\u5317",
      \u6E56\u5357\u7701: "\u6E56\u5357",
      \u5E7F\u4E1C\u7701: "\u5E7F\u4E1C",
      \u5E7F\u897F\u58EE\u65CF\u81EA\u6CBB\u533A: "\u5E7F\u897F",
      \u6D77\u5357\u7701: "\u6D77\u5357",
      \u91CD\u5E86\u5E02: "\u91CD\u5E86",
      \u56DB\u5DDD\u7701: "\u56DB\u5DDD",
      \u8D35\u5DDE\u7701: "\u8D35\u5DDE",
      \u4E91\u5357\u7701: "\u4E91\u5357",
      \u897F\u85CF\u81EA\u6CBB\u533A: "\u897F\u85CF",
      \u9655\u897F\u7701: "\u9655\u897F",
      \u7518\u8083\u7701: "\u7518\u8083",
      \u9752\u6D77\u7701: "\u9752\u6D77",
      \u5B81\u590F\u56DE\u65CF\u81EA\u6CBB\u533A: "\u5B81\u590F",
      \u65B0\u7586\u7EF4\u543E\u5C14\u81EA\u6CBB\u533A: "\u65B0\u7586",
      \u53F0\u6E7E\u7701: "\u53F0\u6E7E",
      \u9999\u6E2F\u7279\u522B\u884C\u653F\u533A: "\u9999\u6E2F",
      \u6FB3\u95E8\u7279\u522B\u884C\u653F\u533A: "\u6FB3\u95E8"
    };
    const CHINA_PROVINCE_KEYWORDS = [
      "\u5317\u4EAC\u5E02",
      "\u5929\u6D25\u5E02",
      "\u6CB3\u5317\u7701",
      "\u5C71\u897F\u7701",
      "\u5185\u8499\u53E4\u81EA\u6CBB\u533A",
      "\u8FBD\u5B81\u7701",
      "\u5409\u6797\u7701",
      "\u9ED1\u9F99\u6C5F\u7701",
      "\u4E0A\u6D77\u5E02",
      "\u6C5F\u82CF\u7701",
      "\u6D59\u6C5F\u7701",
      "\u5B89\u5FBD\u7701",
      "\u798F\u5EFA\u7701",
      "\u6C5F\u897F\u7701",
      "\u5C71\u4E1C\u7701",
      "\u6CB3\u5357\u7701",
      "\u6E56\u5317\u7701",
      "\u6E56\u5357\u7701",
      "\u5E7F\u4E1C\u7701",
      "\u5E7F\u897F\u58EE\u65CF\u81EA\u6CBB\u533A",
      "\u6D77\u5357\u7701",
      "\u91CD\u5E86\u5E02",
      "\u56DB\u5DDD\u7701",
      "\u8D35\u5DDE\u7701",
      "\u4E91\u5357\u7701",
      "\u897F\u85CF\u81EA\u6CBB\u533A",
      "\u9655\u897F\u7701",
      "\u7518\u8083\u7701",
      "\u9752\u6D77\u7701",
      "\u5B81\u590F\u56DE\u65CF\u81EA\u6CBB\u533A",
      "\u65B0\u7586\u7EF4\u543E\u5C14\u81EA\u6CBB\u533A"
    ];
    const shortProvinceToSearchKeyword = (short) => {
      if (!short)
        return null;
      const row = Object.entries(provinceNameMap).find(([, v]) => v === short);
      if (row)
        return row[0];
      if (short.endsWith("\u7701") || short.endsWith("\u5E02") || short.endsWith("\u81EA\u6CBB\u533A"))
        return short;
      if (short === "\u5185\u8499\u53E4")
        return "\u5185\u8499\u53E4\u81EA\u6CBB\u533A";
      if (short === "\u5E7F\u897F")
        return "\u5E7F\u897F\u58EE\u65CF\u81EA\u6CBB\u533A";
      if (short === "\u5B81\u590F")
        return "\u5B81\u590F\u56DE\u65CF\u81EA\u6CBB\u533A";
      if (short === "\u65B0\u7586")
        return "\u65B0\u7586\u7EF4\u543E\u5C14\u81EA\u6CBB\u533A";
      if (short === "\u9999\u6E2F")
        return "\u9999\u6E2F\u7279\u522B\u884C\u653F\u533A";
      if (short === "\u6FB3\u95E8")
        return "\u6FB3\u95E8\u7279\u522B\u884C\u653F\u533A";
      return `${short}\u7701`;
    };
    const currentCity = common_vendor.ref("");
    const mapCenter = common_vendor.ref({ latitude: 35, longitude: 104 });
    const mapScale = common_vendor.ref(10);
    const showLocationDot = common_vendor.ref(false);
    const mapMarkers = common_vendor.ref([]);
    const mapPolygons = common_vendor.ref([]);
    const activeCallout = common_vendor.ref("");
    let polygonLoadGen = 0;
    let markerIdSeq = 10001;
    const normalizeCityName = (cityName) => {
      if (!cityName)
        return "";
      return cityName.replace(/市|省|自治区|特别行政区|壮族自治区|回族自治区|维吾尔自治区|地区|县|区/g, "").trim();
    };
    const findCityCoordinates = (cityName) => {
      if (!cityName)
        return null;
      if (cityCoordinates[cityName])
        return cityCoordinates[cityName];
      const normalized = normalizeCityName(cityName);
      if (normalized && cityCoordinates[normalized])
        return cityCoordinates[normalized];
      for (const key in cityCoordinates) {
        if (key.includes(normalized) || normalized.includes(key)) {
          return cityCoordinates[key];
        }
      }
      return null;
    };
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    const onRegionChange = () => {
    };
    const fitBoundsFromMarkers = () => {
      const pts = mapMarkers.value;
      if (!pts.length)
        return;
      let minLat = 90;
      let maxLat = -90;
      let minLng = 180;
      let maxLng = -180;
      for (const p of pts) {
        minLat = Math.min(minLat, p.latitude);
        maxLat = Math.max(maxLat, p.latitude);
        minLng = Math.min(minLng, p.longitude);
        maxLng = Math.max(maxLng, p.longitude);
      }
      mapCenter.value = {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2
      };
      const latSpan = Math.max(0.12, maxLat - minLat);
      const lngSpan = Math.max(0.12, maxLng - minLng);
      const span = Math.max(latSpan, lngSpan * 0.85);
      let scale = 13;
      if (span > 10)
        scale = 4;
      else if (span > 6)
        scale = 5;
      else if (span > 3)
        scale = 6;
      else if (span > 1.5)
        scale = 7;
      else if (span > 0.8)
        scale = 9;
      else if (span > 0.35)
        scale = 11;
      else if (span > 0.15)
        scale = 12;
      mapScale.value = scale;
    };
    const fitFootprintBounds = () => {
      var _a2;
      const pts = mapMarkers.value;
      if (!pts.length) {
        common_vendor.index.showToast({ title: "\u6682\u65E0\u57CE\u5E02\u6253\u5361\u70B9", icon: "none" });
        return;
      }
      if (mapPageProxy) {
        try {
          const ctx = common_vendor.index.createMapContext("footprintMap", mapPageProxy);
          (_a2 = ctx.includePoints) == null ? void 0 : _a2.call(ctx, {
            points: pts.map((p) => ({
              latitude: p.latitude,
              longitude: p.longitude
            })),
            padding: [80, 80, 120, 80]
          });
          return;
        } catch {
        }
      }
      fitBoundsFromMarkers();
    };
    const recenterOnMe = () => {
      showLocationDot.value = true;
      getUserLocation();
    };
    const onMarkerTap = (e) => {
      var _a2, _b;
      const mid = (_a2 = e == null ? void 0 : e.detail) == null ? void 0 : _a2.markerId;
      const m = mapMarkers.value.find((x) => x.id === mid || String(x.id) === String(mid));
      if ((_b = m == null ? void 0 : m.callout) == null ? void 0 : _b.content) {
        activeCallout.value = m.callout.content;
      }
    };
    const formatCityCalloutLabel = (displayCity) => {
      if (!displayCity)
        return "\u76EE\u7684\u5730";
      if (displayCity.endsWith("\u5E02") || displayCity.endsWith("\u5DDE") || displayCity.endsWith("\u53BF")) {
        return displayCity;
      }
      return `${displayCity}\u5E02`;
    };
    const initLocation = () => {
      common_vendor.index.authorize({
        scope: "scope.userLocation",
        success: () => {
          showLocationDot.value = true;
          getUserLocation();
        },
        fail: () => {
          common_vendor.index.showModal({
            title: "\u9700\u8981\u4F4D\u7F6E\u6743\u9650",
            content: "\u5C55\u793A\u9644\u8FD1\u8DB3\u8FF9\u4E0E\u5730\u56FE\u5B9A\u4F4D\u9700\u8981\u5F00\u542F\u4F4D\u7F6E\u6743\u9650\uFF0C\u53EF\u5728\u8BBE\u7F6E\u4E2D\u6253\u5F00\u3002",
            confirmText: "\u53BB\u8BBE\u7F6E",
            success: (r) => {
              if (r.confirm) {
                common_vendor.index.openSetting({});
              }
            }
          });
          showLocationDot.value = false;
        }
      });
    };
    const getUserLocation = () => {
      common_vendor.index.getLocation({
        type: "gcj02",
        geocode: true,
        success: (res) => {
          var _a2, _b;
          let cityName = "";
          if ((_a2 = res.address) == null ? void 0 : _a2.city) {
            cityName = res.address.city.replace(/市$/, "");
          } else if ((_b = res.address) == null ? void 0 : _b.province) {
            cityName = res.address.province.replace(/省$/, "");
          }
          if (!cityName) {
            const keys = Object.keys(cityCoordinates);
            let best = "";
            let d = Infinity;
            for (const k of keys) {
              const c = cityCoordinates[k];
              const dist = (c.latitude - res.latitude) * (c.latitude - res.latitude) + (c.longitude - res.longitude) * (c.longitude - res.longitude);
              if (dist < d) {
                d = dist;
                best = k;
              }
            }
            cityName = best;
          }
          currentCity.value = cityName;
          mapCenter.value = { latitude: res.latitude, longitude: res.longitude };
          mapScale.value = 11;
        },
        fail: () => {
          common_vendor.index.showToast({ title: "\u83B7\u53D6\u4F4D\u7F6E\u5931\u8D25\uFF0C\u53EF\u624B\u52A8\u7F29\u653E\u5730\u56FE\u67E5\u770B", icon: "none" });
          mapCenter.value = { latitude: 35, longitude: 104 };
          mapScale.value = 5;
        }
      });
    };
    const buildCityMarkers = () => {
      const cityMap = /* @__PURE__ */ new Map();
      checkinData.value.forEach((item) => {
        const cityName = item.cityName || item.city;
        let lat = item.latitude;
        let lng = item.longitude;
        if (lat && typeof lat === "object")
          lat = parseFloat(String(lat));
        if (lng && typeof lng === "object")
          lng = parseFloat(String(lng));
        let coords = null;
        if (lat != null && lng != null) {
          const la = Number(lat);
          const ln = Number(lng);
          if (!Number.isNaN(la) && !Number.isNaN(ln) && la >= 18 && la <= 54 && ln >= 73 && ln <= 135) {
            coords = { latitude: la, longitude: ln };
          }
        }
        if (!coords && cityName) {
          const f = findCityCoordinates(cityName);
          if (f)
            coords = f;
        }
        if (!coords)
          return;
        const displayCity = normalizeCityName(cityName || "") || "\u76EE\u7684\u5730";
        const key = `${displayCity}_${coords.latitude}_${coords.longitude}`;
        const exist = cityMap.get(key);
        if (exist)
          exist.count += 1;
        else
          cityMap.set(key, {
            displayCity,
            count: 1,
            lat: coords.latitude,
            lng: coords.longitude
          });
      });
      const scenicCountByCity = (cityDisplay) => checkinData.value.filter(
        (x) => normalizeCityName(x.cityName || x.city || "") === cityDisplay && x.targetType === "scenic"
      ).length;
      const foodCountByCity = (cityDisplay) => checkinData.value.filter(
        (x) => normalizeCityName(x.cityName || x.city || "") === cityDisplay && x.targetType === "food"
      ).length;
      mapMarkers.value = [];
      cityMap.forEach((data) => {
        const sid = markerIdSeq++;
        const scenicN = scenicCountByCity(data.displayCity);
        const foodN = foodCountByCity(data.displayCity);
        const line = `\u5DF2\u5230\u8FBE${formatCityCalloutLabel(data.displayCity)}\uFF0C\u666F\u70B9${scenicN}\u4E2A \xB7 \u7F8E\u98DF${foodN}\u4E2A`;
        mapMarkers.value.push({
          id: sid,
          latitude: data.lat,
          longitude: data.lng,
          title: data.displayCity,
          width: 28,
          height: 28,
          anchor: { x: 0.5, y: 1 },
          callout: {
            content: line,
            color: "#2d3f39",
            fontSize: 13,
            borderRadius: 10,
            bgColor: "#e8f5f1",
            padding: 10,
            display: "BYCLICK",
            textAlign: "center"
          }
        });
      });
    };
    const MINT_FILL = "#7fc4b199";
    const MINT_STROKE = "#1a6b4a";
    const GRAY_FILL = "#d8dedc99";
    const GRAY_STROKE = "#b0b8b5";
    const POLYGON_FETCH_BATCH = 6;
    const loadProvincePolygons = async () => {
      const gen = ++polygonLoadGen;
      const visited = visitedProvinceKeywords.value;
      const grayPolys = [];
      const mintPolys = [];
      const kws = [...CHINA_PROVINCE_KEYWORDS];
      for (let i = 0; i < kws.length; i += POLYGON_FETCH_BATCH) {
        if (gen !== polygonLoadGen)
          return;
        const chunk = kws.slice(i, i + POLYGON_FETCH_BATCH);
        const chunkResults = await Promise.all(
          chunk.map(async (keyword) => {
            const isVisited = visited.has(keyword);
            const rings = await utils_amapDistrict.fetchDistrictRings(keyword) || [];
            return { isVisited, rings };
          })
        );
        for (const { isVisited, rings } of chunkResults) {
          for (const pts of rings) {
            if (pts.length < 3)
              continue;
            const poly = {
              points: pts,
              strokeWidth: isVisited ? 2 : 1,
              strokeColor: isVisited ? MINT_STROKE : GRAY_STROKE,
              fillColor: isVisited ? MINT_FILL : GRAY_FILL
            };
            if (isVisited)
              mintPolys.push(poly);
            else
              grayPolys.push(poly);
          }
        }
      }
      if (gen === polygonLoadGen) {
        mapPolygons.value = [...grayPolys, ...mintPolys];
      }
    };
    const applyFootprintFromList = (list) => {
      checkinData.value = list;
      const provinceSet = /* @__PURE__ */ new Set();
      const citySet = /* @__PURE__ */ new Set();
      const provinceKw = /* @__PURE__ */ new Set();
      let attractionCount = 0;
      let foodCount = 0;
      list.forEach((item) => {
        if (item.targetType === "scenic")
          attractionCount++;
        else if (item.targetType === "food")
          foodCount++;
        let provinceName = item.provinceName || item.province;
        let cityName = item.cityName || item.city;
        if (provinceName) {
          const fullKw = provinceNameMap[provinceName] !== void 0 ? provinceName : shortProvinceToSearchKeyword(
            provinceName.replace(
              /省|市|自治区|特别行政区|壮族自治区|回族自治区|维吾尔自治区/g,
              ""
            ) || provinceName
          );
          const short = provinceNameMap[provinceName] || provinceName;
          const cleaned = short.replace(
            /省|市|自治区|特别行政区|壮族自治区|回族自治区|维吾尔自治区/g,
            ""
          );
          if (cleaned)
            provinceSet.add(cleaned);
          if (fullKw)
            provinceKw.add(fullKw);
        }
        if (cityName) {
          const nc = normalizeCityName(cityName);
          if (nc)
            citySet.add(nc);
        }
      });
      checkedProvinces.value = provinceSet;
      checkedCities.value = citySet;
      visitedProvinceKeywords.value = provinceKw;
      stats.value = {
        provinces: provinceSet.size,
        cities: citySet.size,
        attractions: attractionCount,
        foods: foodCount
      };
      buildCityMarkers();
      loadProvincePolygons();
    };
    const loadCheckinData = async () => {
      var _a2;
      if (!((_a2 = user.value) == null ? void 0 : _a2.id))
        return;
      try {
        const res = await api_content.checkinApi.getMyCheckins(user.value.id, 1, 1e3);
        if (res.statusCode === 200 && res.data.code === 200) {
          const data = res.data.data || {};
          const list = data.list || [];
          applyFootprintFromList(list);
          return;
        }
      } catch {
      }
      applyFootprintFromList([
        {
          id: 1,
          targetId: 1,
          cityName: "\u5317\u4EAC",
          provinceName: "\u5317\u4EAC\u5E02",
          targetType: "scenic",
          latitude: 39.9042,
          longitude: 116.4074
        },
        {
          id: 2,
          targetId: 2,
          cityName: "\u4E0A\u6D77",
          provinceName: "\u4E0A\u6D77\u5E02",
          targetType: "scenic",
          latitude: 31.2304,
          longitude: 121.4737
        }
      ]);
    };
    common_vendor.watch(
      () => {
        var _a2;
        return (_a2 = user.value) == null ? void 0 : _a2.id;
      },
      (id) => {
        if (id)
          void loadCheckinData();
      }
    );
    common_vendor.onMounted(() => {
      var _a2;
      initLocation();
      if ((_a2 = user.value) == null ? void 0 : _a2.id) {
        void loadCheckinData();
      } else {
        common_vendor.index.showToast({ title: "\u767B\u5F55\u540E\u540C\u6B65\u8DB3\u8FF9", icon: "none" });
        visitedProvinceKeywords.value = /* @__PURE__ */ new Set();
        buildCityMarkers();
        void loadProvincePolygons();
      }
    });
    common_vendor.onShow(() => {
      var _a2;
      common_vendor.index.getSetting({
        success: (res) => {
          if (res.authSetting["scope.userLocation"]) {
            showLocationDot.value = true;
            getUserLocation();
          }
        }
      });
      if ((_a2 = user.value) == null ? void 0 : _a2.id) {
        void loadCheckinData();
      }
    });
    common_vendor.onPullDownRefresh(async () => {
      var _a2;
      initLocation();
      if ((_a2 = user.value) == null ? void 0 : _a2.id) {
        await loadCheckinData();
      }
      common_vendor.index.stopPullDownRefresh();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(goBack),
        b: currentCity.value
      }, currentCity.value ? {
        c: common_vendor.t(currentCity.value)
      } : {}, {
        d: mapCenter.value.latitude,
        e: mapCenter.value.longitude,
        f: mapScale.value,
        g: mapMarkers.value,
        h: mapPolygons.value,
        i: showLocationDot.value,
        j: common_vendor.o(onMarkerTap),
        k: common_vendor.o(onRegionChange),
        l: common_vendor.o(fitFootprintBounds),
        m: common_vendor.o(recenterOnMe),
        n: activeCallout.value
      }, activeCallout.value ? {
        o: common_vendor.t(activeCallout.value),
        p: common_vendor.o(($event) => activeCallout.value = "")
      } : {}, {
        q: common_vendor.t(stats.value.provinces || 0),
        r: !stats.value.provinces ? 1 : "",
        s: common_vendor.t(stats.value.cities || 0),
        t: !stats.value.cities ? 1 : "",
        v: common_vendor.t(stats.value.attractions || 0),
        w: !stats.value.attractions ? 1 : "",
        x: common_vendor.t(stats.value.foods || 0),
        y: !stats.value.foods ? 1 : ""
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-2aa02d9b"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/footprint/footprint.vue"]]);
wx.createPage(MiniProgramPage);
