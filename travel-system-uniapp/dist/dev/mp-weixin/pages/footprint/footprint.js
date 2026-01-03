"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var store_user = require("../../store/user.js");
require("../../utils/http.js");
require("../../utils/storage.js");
require("../../utils/config.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const stats = common_vendor.ref({
      provinces: 0,
      cities: 0,
      attractions: 0,
      foods: 0
    });
    const checkinData = common_vendor.ref([]);
    const checkedProvinces = common_vendor.ref(/* @__PURE__ */ new Set());
    const checkedCities = common_vendor.ref(/* @__PURE__ */ new Set());
    const cityCoordinates = {
      "\u5317\u4EAC": { latitude: 39.9042, longitude: 116.4074 },
      "\u4E0A\u6D77": { latitude: 31.2304, longitude: 121.4737 },
      "\u5E7F\u5DDE": { latitude: 23.1291, longitude: 113.2644 },
      "\u6DF1\u5733": { latitude: 22.5431, longitude: 114.0579 },
      "\u676D\u5DDE": { latitude: 30.2741, longitude: 120.1551 },
      "\u5357\u4EAC": { latitude: 32.0603, longitude: 118.7969 },
      "\u6210\u90FD": { latitude: 30.6624, longitude: 104.0633 },
      "\u91CD\u5E86": { latitude: 29.563, longitude: 106.5516 },
      "\u897F\u5B89": { latitude: 34.3416, longitude: 108.9398 },
      "\u6B66\u6C49": { latitude: 30.5928, longitude: 114.3055 },
      "\u5929\u6D25": { latitude: 39.3434, longitude: 117.3616 },
      "\u82CF\u5DDE": { latitude: 31.2989, longitude: 120.5853 },
      "\u957F\u6C99": { latitude: 28.2278, longitude: 112.9388 },
      "\u90D1\u5DDE": { latitude: 34.7466, longitude: 113.6254 },
      "\u6D4E\u5357": { latitude: 36.6512, longitude: 117.1201 },
      "\u9752\u5C9B": { latitude: 36.0671, longitude: 120.3826 },
      "\u5927\u8FDE": { latitude: 38.914, longitude: 121.6147 },
      "\u53A6\u95E8": { latitude: 24.4798, longitude: 118.0819 },
      "\u798F\u5DDE": { latitude: 26.0745, longitude: 119.2965 },
      "\u6606\u660E": { latitude: 25.0389, longitude: 102.7183 },
      "\u8D35\u9633": { latitude: 26.647, longitude: 106.6302 },
      "\u5357\u5B81": { latitude: 22.817, longitude: 108.3669 },
      "\u6D77\u53E3": { latitude: 20.0444, longitude: 110.1999 },
      "\u4E09\u4E9A": { latitude: 18.2479, longitude: 109.5027 },
      "\u54C8\u5C14\u6EE8": { latitude: 45.7731, longitude: 126.6167 },
      "\u957F\u6625": { latitude: 43.8171, longitude: 125.3235 },
      "\u6C88\u9633": { latitude: 41.8057, longitude: 123.4315 },
      "\u77F3\u5BB6\u5E84": { latitude: 38.0428, longitude: 114.5149 },
      "\u592A\u539F": { latitude: 37.8706, longitude: 112.5489 },
      "\u547C\u548C\u6D69\u7279": { latitude: 40.8414, longitude: 111.7519 },
      "\u4E4C\u9C81\u6728\u9F50": { latitude: 43.8256, longitude: 87.6168 },
      "\u62C9\u8428": { latitude: 29.6626, longitude: 91.1149 },
      "\u897F\u5B81": { latitude: 36.6171, longitude: 101.7782 },
      "\u94F6\u5DDD": { latitude: 38.4872, longitude: 106.2309 },
      "\u5170\u5DDE": { latitude: 36.0611, longitude: 103.8343 },
      "\u5408\u80A5": { latitude: 31.8206, longitude: 117.2272 },
      "\u5357\u660C": { latitude: 28.682, longitude: 115.8579 },
      "\u6D1B\u9633": { latitude: 34.6197, longitude: 112.454 },
      "\u5F00\u5C01": { latitude: 34.7971, longitude: 114.3074 },
      "\u6842\u6797": { latitude: 25.2345, longitude: 110.1999 },
      "\u4E3D\u6C5F": { latitude: 26.855, longitude: 100.2277 },
      "\u5927\u7406": { latitude: 25.6065, longitude: 100.2676 },
      "\u5F20\u5BB6\u754C": { latitude: 29.1171, longitude: 110.4792 },
      "\u9EC4\u5C71": { latitude: 30.1329, longitude: 118.1689 },
      "\u4E5D\u5BE8\u6C9F": { latitude: 33.26, longitude: 103.914 },
      "\u6566\u714C": { latitude: 40.1411, longitude: 94.6619 },
      "\u627F\u5FB7": { latitude: 40.9516, longitude: 117.9634 },
      "\u79E6\u7687\u5C9B": { latitude: 39.9354, longitude: 119.6005 },
      "\u70DF\u53F0": { latitude: 37.4638, longitude: 121.4479 },
      "\u5A01\u6D77": { latitude: 37.5133, longitude: 122.1204 },
      "\u5B81\u6CE2": { latitude: 29.8683, longitude: 121.544 },
      "\u6E29\u5DDE": { latitude: 28.0006, longitude: 120.6994 },
      "\u65E0\u9521": { latitude: 31.4912, longitude: 120.3124 },
      "\u626C\u5DDE": { latitude: 32.3932, longitude: 119.4129 },
      "\u9547\u6C5F": { latitude: 32.1877, longitude: 119.4528 },
      "\u5609\u5174": { latitude: 30.7522, longitude: 120.7555 },
      "\u7ECD\u5174": { latitude: 30.0303, longitude: 120.582 },
      "\u6E56\u5DDE": { latitude: 30.893, longitude: 120.0868 },
      "\u53F0\u5DDE": { latitude: 28.6564, longitude: 121.4208 },
      "\u91D1\u534E": { latitude: 29.079, longitude: 119.6474 },
      "\u8862\u5DDE": { latitude: 28.9706, longitude: 118.859 },
      "\u821F\u5C71": { latitude: 30.016, longitude: 122.2072 },
      "\u4E3D\u6C34": { latitude: 28.4518, longitude: 119.9229 }
    };
    const provinceNameMap = {
      "\u5317\u4EAC\u5E02": "\u5317\u4EAC",
      "\u5929\u6D25\u5E02": "\u5929\u6D25",
      "\u6CB3\u5317\u7701": "\u6CB3\u5317",
      "\u5C71\u897F\u7701": "\u5C71\u897F",
      "\u5185\u8499\u53E4\u81EA\u6CBB\u533A": "\u5185\u8499\u53E4",
      "\u8FBD\u5B81\u7701": "\u8FBD\u5B81",
      "\u5409\u6797\u7701": "\u5409\u6797",
      "\u9ED1\u9F99\u6C5F\u7701": "\u9ED1\u9F99\u6C5F",
      "\u4E0A\u6D77\u5E02": "\u4E0A\u6D77",
      "\u6C5F\u82CF\u7701": "\u6C5F\u82CF",
      "\u6D59\u6C5F\u7701": "\u6D59\u6C5F",
      "\u5B89\u5FBD\u7701": "\u5B89\u5FBD",
      "\u798F\u5EFA\u7701": "\u798F\u5EFA",
      "\u6C5F\u897F\u7701": "\u6C5F\u897F",
      "\u5C71\u4E1C\u7701": "\u5C71\u4E1C",
      "\u6CB3\u5357\u7701": "\u6CB3\u5357",
      "\u6E56\u5317\u7701": "\u6E56\u5317",
      "\u6E56\u5357\u7701": "\u6E56\u5357",
      "\u5E7F\u4E1C\u7701": "\u5E7F\u4E1C",
      "\u5E7F\u897F\u58EE\u65CF\u81EA\u6CBB\u533A": "\u5E7F\u897F",
      "\u6D77\u5357\u7701": "\u6D77\u5357",
      "\u91CD\u5E86\u5E02": "\u91CD\u5E86",
      "\u56DB\u5DDD\u7701": "\u56DB\u5DDD",
      "\u8D35\u5DDE\u7701": "\u8D35\u5DDE",
      "\u4E91\u5357\u7701": "\u4E91\u5357",
      "\u897F\u85CF\u81EA\u6CBB\u533A": "\u897F\u85CF",
      "\u9655\u897F\u7701": "\u9655\u897F",
      "\u7518\u8083\u7701": "\u7518\u8083",
      "\u9752\u6D77\u7701": "\u9752\u6D77",
      "\u5B81\u590F\u56DE\u65CF\u81EA\u6CBB\u533A": "\u5B81\u590F",
      "\u65B0\u7586\u7EF4\u543E\u5C14\u81EA\u6CBB\u533A": "\u65B0\u7586",
      "\u53F0\u6E7E\u7701": "\u53F0\u6E7E",
      "\u9999\u6E2F\u7279\u522B\u884C\u653F\u533A": "\u9999\u6E2F",
      "\u6FB3\u95E8\u7279\u522B\u884C\u653F\u533A": "\u6FB3\u95E8"
    };
    const userLocation = common_vendor.ref(null);
    const currentCity = common_vendor.ref("");
    const mapCenter = common_vendor.ref({
      latitude: 35,
      longitude: 104
    });
    const mapScale = common_vendor.ref(10);
    common_vendor.ref(false);
    const mapLoaded = common_vendor.ref(false);
    const userLocationMarker = common_vendor.ref([]);
    const mapCircles = common_vendor.ref([]);
    const mapPolygons = common_vendor.ref([]);
    const onMapTap = (e) => {
      console.log("[Footprint] \u5730\u56FE\u88AB\u70B9\u51FB", e);
    };
    const onRegionChange = (e) => {
    };
    const onMapUpdated = () => {
    };
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    const createBlueCircleIcon = () => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const ctx = common_vendor.index.createCanvasContext("blue-circle-canvas");
            const size = 30;
            const radius = size / 2 - 2;
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, radius, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.setFillStyle("#1890FF");
            ctx.fill();
            ctx.setStrokeStyle("#FFFFFF");
            ctx.setLineWidth(2);
            ctx.stroke();
            ctx.draw(false, () => {
              setTimeout(() => {
                common_vendor.index.canvasToTempFilePath({
                  canvasId: "blue-circle-canvas",
                  success: (res) => {
                    console.log("[Footprint] \u84DD\u8272\u5706\u70B9\u56FE\u6807\u751F\u6210\u6210\u529F", res.tempFilePath);
                    resolve(res.tempFilePath);
                  },
                  fail: (err) => {
                    console.error("[Footprint] \u751F\u6210\u56FE\u6807\u5931\u8D25", err);
                    reject(err);
                  }
                });
              }, 200);
            });
          } catch (error) {
            console.error("[Footprint] Canvas \u521B\u5EFA\u5931\u8D25", error);
            reject(error);
          }
        }, 100);
      });
    };
    const getCityByCoordinates = (latitude, longitude) => {
      let nearestCity = "";
      let minDistance = Infinity;
      for (const key in cityCoordinates) {
        if (cityCoordinates.hasOwnProperty(key)) {
          const coords = cityCoordinates[key];
          const distance = Math.sqrt(
            Math.pow(coords.latitude - latitude, 2) + Math.pow(coords.longitude - longitude, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestCity = key;
          }
        }
      }
      console.log(`[Footprint] \u5750\u6807\u67E5\u627E\u57CE\u5E02: (${latitude}, ${longitude}) -> ${nearestCity}, \u8DDD\u79BB: ${minDistance.toFixed(4)}`);
      return nearestCity;
    };
    const getUserLocation = () => {
      console.log("[Footprint] \u{1F4CD} \u5F00\u59CB\u83B7\u53D6\u4F4D\u7F6E...");
      console.log('[Footprint] \u{1F4A1} \u63D0\u793A\uFF1A\u5F00\u53D1\u6A21\u5F0F\u4E0B\u4F7F\u7528\u7684\u662F\u6A21\u62DF\u4F4D\u7F6E\uFF0C\u53EF\u901A\u8FC7\u5F00\u53D1\u8005\u5DE5\u5177"\u6A21\u62DF\u5668"\u83DC\u5355\u8BBE\u7F6E');
      common_vendor.index.getLocation({
        type: "gcj02",
        geocode: true,
        success: (res) => {
          var _a, _b, _c;
          console.log("[Footprint] \u83B7\u53D6\u4F4D\u7F6E\u6210\u529F", res);
          console.log("[Footprint] \u{1F4CD} \u5750\u6807\u4FE1\u606F:", {
            latitude: res.latitude,
            longitude: res.longitude,
            isSimulated: "\u5F00\u53D1\u6A21\u5F0F\u4E0B\u4E3A\u6A21\u62DF\u4F4D\u7F6E\uFF0C\u771F\u673A\u4E3A\u771F\u5B9E\u4F4D\u7F6E"
          });
          let cityName = "";
          if ((_a = res.address) == null ? void 0 : _a.city) {
            cityName = res.address.city.replace(/市$/, "");
          } else if ((_b = res.address) == null ? void 0 : _b.province) {
            cityName = res.address.province.replace(/省$/, "");
          } else if ((_c = res.address) == null ? void 0 : _c.district) {
            cityName = res.address.district.replace(/区$|县$/, "");
          }
          if (!cityName) {
            cityName = getCityByCoordinates(res.latitude, res.longitude);
            console.log("[Footprint] \u901A\u8FC7\u5750\u6807\u67E5\u627E\u57CE\u5E02:", cityName);
          }
          userLocation.value = {
            latitude: res.latitude,
            longitude: res.longitude,
            city: cityName
          };
          mapCenter.value = {
            latitude: res.latitude,
            longitude: res.longitude
          };
          currentCity.value = cityName;
          createBlueCircleIcon().then((iconPath) => {
            userLocationMarker.value = [{
              id: "user-location",
              latitude: res.latitude,
              longitude: res.longitude,
              title: "\u6211\u7684\u4F4D\u7F6E",
              iconPath,
              width: 30,
              height: 30,
              anchor: { x: 0.5, y: 0.5 },
              callout: {
                content: `\u{1F4CD} ${currentCity.value || "\u6211\u7684\u4F4D\u7F6E"}`,
                color: "#333",
                fontSize: 14,
                borderRadius: 8,
                bgColor: "#1890FF",
                padding: 8,
                display: "BYCLICK",
                textAlign: "center",
                borderColor: "#0050B3",
                borderWidth: 2
              }
            }];
          }).catch(() => {
            console.warn("[Footprint] \u751F\u6210\u84DD\u8272\u5706\u70B9\u56FE\u6807\u5931\u8D25\uFF0C\u4F7F\u7528\u9ED8\u8BA4\u56FE\u6807");
            userLocationMarker.value = [{
              id: "user-location",
              latitude: res.latitude,
              longitude: res.longitude,
              title: "\u6211\u7684\u4F4D\u7F6E",
              iconPath: "",
              width: 30,
              height: 30,
              anchor: { x: 0.5, y: 0.5 },
              callout: {
                content: `\u{1F4CD} ${currentCity.value || "\u6211\u7684\u4F4D\u7F6E"}`,
                color: "#333",
                fontSize: 14,
                borderRadius: 8,
                bgColor: "#1890FF",
                padding: 8,
                display: "BYCLICK",
                textAlign: "center",
                borderColor: "#0050B3",
                borderWidth: 2
              }
            }];
          });
          console.log("[Footprint] \u7528\u6237\u4F4D\u7F6E:", {
            latitude: res.latitude,
            longitude: res.longitude,
            city: currentCity.value,
            address: res.address
          });
        },
        fail: (err) => {
          console.error("[Footprint] \u83B7\u53D6\u4F4D\u7F6E\u5931\u8D25", err);
          common_vendor.index.showToast({
            title: "\u83B7\u53D6\u4F4D\u7F6E\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u5B9A\u4F4D\u6743\u9650",
            icon: "none",
            duration: 2e3
          });
          mapCenter.value = {
            latitude: 35,
            longitude: 104
          };
          mapScale.value = 5;
        }
      });
    };
    const normalizeCityName = (cityName) => {
      if (!cityName)
        return "";
      return cityName.replace(/市|省|自治区|特别行政区|壮族自治区|回族自治区|维吾尔自治区|地区|县|区/g, "").trim();
    };
    const findCityCoordinates = (cityName) => {
      if (!cityName)
        return null;
      if (cityCoordinates[cityName]) {
        return cityCoordinates[cityName];
      }
      const normalized = normalizeCityName(cityName);
      if (normalized && cityCoordinates[normalized]) {
        return cityCoordinates[normalized];
      }
      for (const key in cityCoordinates) {
        if (cityCoordinates.hasOwnProperty(key)) {
          const coords = cityCoordinates[key];
          if (key.includes(normalized) || normalized.includes(key)) {
            return coords;
          }
        }
      }
      return null;
    };
    const provinceCenters = {
      "\u5317\u4EAC": { latitude: 39.9042, longitude: 116.4074 },
      "\u4E0A\u6D77": { latitude: 31.2304, longitude: 121.4737 },
      "\u5929\u6D25": { latitude: 39.3434, longitude: 117.3616 },
      "\u91CD\u5E86": { latitude: 29.563, longitude: 106.5516 },
      "\u6CB3\u5317": { latitude: 38.0428, longitude: 114.5149 },
      "\u5C71\u897F": { latitude: 37.8706, longitude: 112.5489 },
      "\u5185\u8499\u53E4": { latitude: 40.8414, longitude: 111.7519 },
      "\u8FBD\u5B81": { latitude: 41.8057, longitude: 123.4315 },
      "\u5409\u6797": { latitude: 43.8171, longitude: 125.3235 },
      "\u9ED1\u9F99\u6C5F": { latitude: 45.7731, longitude: 126.6167 },
      "\u6C5F\u82CF": { latitude: 32.0603, longitude: 118.7969 },
      "\u6D59\u6C5F": { latitude: 30.2741, longitude: 120.1551 },
      "\u5B89\u5FBD": { latitude: 31.8206, longitude: 117.2272 },
      "\u798F\u5EFA": { latitude: 26.0745, longitude: 119.2965 },
      "\u6C5F\u897F": { latitude: 28.682, longitude: 115.8579 },
      "\u5C71\u4E1C": { latitude: 36.6512, longitude: 117.1201 },
      "\u6CB3\u5357": { latitude: 34.7466, longitude: 113.6254 },
      "\u6E56\u5317": { latitude: 30.5928, longitude: 114.3055 },
      "\u6E56\u5357": { latitude: 28.2278, longitude: 112.9388 },
      "\u5E7F\u4E1C": { latitude: 23.1291, longitude: 113.2644 },
      "\u5E7F\u897F": { latitude: 22.817, longitude: 108.3669 },
      "\u6D77\u5357": { latitude: 20.0444, longitude: 110.1999 },
      "\u56DB\u5DDD": { latitude: 30.6624, longitude: 104.0633 },
      "\u8D35\u5DDE": { latitude: 26.647, longitude: 106.6302 },
      "\u4E91\u5357": { latitude: 25.0389, longitude: 102.7183 },
      "\u897F\u85CF": { latitude: 29.6626, longitude: 91.1149 },
      "\u9655\u897F": { latitude: 34.3416, longitude: 108.9398 },
      "\u7518\u8083": { latitude: 36.0611, longitude: 103.8343 },
      "\u9752\u6D77": { latitude: 36.6171, longitude: 101.7782 },
      "\u5B81\u590F": { latitude: 38.4872, longitude: 106.2309 },
      "\u65B0\u7586": { latitude: 43.8256, longitude: 87.6168 },
      "\u53F0\u6E7E": { latitude: 25.033, longitude: 121.5654 },
      "\u9999\u6E2F": { latitude: 22.3193, longitude: 114.1694 },
      "\u6FB3\u95E8": { latitude: 22.1987, longitude: 113.5439 }
    };
    const updateMapMarkers = () => {
      mapCircles.value = [];
      console.log("[Footprint] \u5F00\u59CB\u66F4\u65B0\u5730\u56FE\u6807\u8BB0\uFF0C\u6253\u5361\u6570\u636E\u6570\u91CF:", checkinData.value.length);
      const cityMarkerMap = /* @__PURE__ */ new Map();
      checkinData.value.forEach((item, index) => {
        console.log(`[Footprint] \u5904\u7406\u7B2C ${index + 1} \u6761\u6570\u636E:`, {
          cityName: item.cityName,
          city: item.city,
          provinceName: item.provinceName,
          province: item.province,
          latitude: item.latitude,
          longitude: item.longitude,
          targetName: item.targetName,
          targetType: item.targetType
        });
        const cityName = item.cityName || item.city;
        const provinceName = item.provinceName || item.province;
        let lat = item.latitude;
        let lng = item.longitude;
        if (lat && typeof lat === "object") {
          lat = parseFloat(lat.toString());
        }
        if (lng && typeof lng === "object") {
          lng = parseFloat(lng.toString());
        }
        if (lat != null && lng != null) {
          lat = Number(lat);
          lng = Number(lng);
          if (isNaN(lat) || isNaN(lng) || lat < 18 || lat > 54 || lng < 73 || lng > 135) {
            console.warn(`[Footprint] \u5750\u6807\u65E0\u6548\uFF0C\u5DF2\u8DF3\u8FC7: lat=${lat}, lng=${lng}`);
            lat = null;
            lng = null;
          }
        }
        let coordinates = null;
        if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
          coordinates = { latitude: lat, longitude: lng };
          console.log(`[Footprint] \u4F7F\u7528\u6570\u636E\u4E2D\u7684\u5750\u6807:`, coordinates);
        } else if (cityName) {
          coordinates = findCityCoordinates(cityName);
          if (coordinates) {
            console.log(`[Footprint] \u4ECE\u57CE\u5E02\u540D\u79F0\u627E\u5230\u5750\u6807: ${cityName} ->`, coordinates);
          } else {
            console.log(`[Footprint] \u57CE\u5E02\u540D\u79F0\u672A\u627E\u5230\u5750\u6807: ${cityName}`);
          }
        }
        if (!coordinates && provinceName) {
          const normalizedProvince = normalizeCityName(provinceName);
          if (normalizedProvince && provinceCenters[normalizedProvince]) {
            coordinates = provinceCenters[normalizedProvince];
            console.log(`[Footprint] \u4F7F\u7528\u7701\u4EFD\u4E2D\u5FC3\u70B9: ${normalizedProvince} ->`, coordinates);
          }
        }
        if (coordinates) {
          const normalizedCity = cityName ? normalizeCityName(cityName) : provinceName ? normalizeCityName(provinceName) : "\u672A\u77E5";
          const key = `${normalizedCity}_${provinceName || ""}`;
          if (cityMarkerMap.has(key)) {
            const existing = cityMarkerMap.get(key);
            existing.count++;
            console.log(`[Footprint] \u589E\u52A0\u57CE\u5E02\u8BA1\u6570: ${key} -> ${existing.count}`);
          } else {
            cityMarkerMap.set(key, {
              city: normalizedCity,
              province: provinceName || "",
              count: 1,
              coordinates
            });
            console.log(`[Footprint] \u6DFB\u52A0\u65B0\u57CE\u5E02\u6807\u8BB0: ${key}`, coordinates);
          }
        } else {
          console.warn(`[Footprint] \u8DF3\u8FC7\u65E0\u5750\u6807\u7684\u6570\u636E:`, { cityName, provinceName, lat, lng });
        }
      });
      console.log(`[Footprint] \u57CE\u5E02\u6807\u8BB0\u6620\u5C04\u5B8C\u6210\uFF0C\u5171 ${cityMarkerMap.size} \u4E2A\u57CE\u5E02`);
      cityMarkerMap.forEach((data, key) => {
        const lat = data.coordinates.latitude;
        const lng = data.coordinates.longitude;
        if (isNaN(lat) || isNaN(lng) || lat < 18 || lat > 54 || lng < 73 || lng > 135) {
          console.warn(`[Footprint] \u8DF3\u8FC7\u65E0\u6548\u5750\u6807\u7684\u57CE\u5E02: ${data.city}`, { lat, lng });
          return;
        }
        const circle = {
          latitude: lat,
          longitude: lng,
          color: "#FFD700",
          fillColor: "#FFD70066",
          radius: 3e4,
          strokeWidth: 3
        };
        mapCircles.value.push(circle);
        console.log(`[Footprint] \u6DFB\u52A0\u9EC4\u8272\u5706\u5708: ${data.city}`, { lat, lng });
      });
      console.log("[Footprint] \u5730\u56FE\u6807\u8BB0\u66F4\u65B0\u5B8C\u6210", {
        circles: mapCircles.value.length,
        cities: Array.from(cityMarkerMap.keys())
      });
    };
    const loadCheckinData = async () => {
      var _a;
      if (!((_a = user.value) == null ? void 0 : _a.id)) {
        console.log("[Footprint] \u7528\u6237\u672A\u767B\u5F55");
        mapLoaded.value = true;
        return;
      }
      try {
        const res = await api_content.checkinApi.getMyCheckins(user.value.id, 1, 1e3);
        if (res.statusCode === 200 && res.data.code === 200) {
          const data = res.data.data || {};
          const list = data.list || [];
          console.log("[Footprint] API\u8FD4\u56DE\u7684\u539F\u59CB\u6570\u636E:", {
            statusCode: res.statusCode,
            code: res.data.code,
            data,
            listLength: list.length,
            firstItem: list[0] || null
          });
          checkinData.value = list;
          console.log("[Footprint] \u4FDD\u5B58\u7684\u6253\u5361\u6570\u636E:", checkinData.value);
          const provinceSet = /* @__PURE__ */ new Set();
          const citySet = /* @__PURE__ */ new Set();
          let attractionCount = 0;
          let foodCount = 0;
          console.log("[Footprint] \u539F\u59CB\u6570\u636E\u5217\u8868:", list);
          list.forEach((item, index) => {
            console.log(`[Footprint] \u5904\u7406\u7B2C ${index + 1} \u6761\u6570\u636E\u7528\u4E8E\u7EDF\u8BA1:`, {
              targetType: item.targetType,
              cityName: item.cityName,
              city: item.city,
              provinceName: item.provinceName,
              province: item.province
            });
            if (item.targetType === "scenic") {
              attractionCount++;
            } else if (item.targetType === "food") {
              foodCount++;
            }
            let provinceName = item.provinceName || item.province;
            let cityName = item.cityName || item.city;
            if (provinceName) {
              provinceName = provinceNameMap[provinceName] || provinceName;
              provinceName = provinceName.replace(/省|市|自治区|特别行政区|壮族自治区|回族自治区|维吾尔自治区/g, "");
              if (provinceName) {
                provinceSet.add(provinceName);
              }
            }
            if (cityName) {
              const normalizedCity = normalizeCityName(cityName);
              if (normalizedCity) {
                citySet.add(normalizedCity);
              }
            }
          });
          console.log("[Footprint] \u7EDF\u8BA1\u7ED3\u679C:", {
            provinceSet: Array.from(provinceSet),
            citySet: Array.from(citySet),
            attractionCount,
            foodCount
          });
          checkedProvinces.value = provinceSet;
          checkedCities.value = citySet;
          stats.value = {
            provinces: provinceSet.size,
            cities: citySet.size,
            attractions: attractionCount,
            foods: foodCount
          };
          updateMapMarkers();
          console.log("[Footprint] \u6570\u636E\u52A0\u8F7D\u5B8C\u6210", {
            provinces: Array.from(provinceSet),
            cities: Array.from(citySet),
            stats: stats.value,
            circles: mapCircles.value.length
          });
        } else {
          console.error("[Footprint] API\u8FD4\u56DE\u9519\u8BEF", res.data);
        }
      } catch (e) {
        console.error("[Footprint] \u52A0\u8F7D\u6253\u5361\u6570\u636E\u5931\u8D25", e);
        if (e.statusCode === 404 || !e.statusCode) {
          console.log("[Footprint] \u63A5\u53E3\u4E0D\u5B58\u5728\uFF0C\u4F7F\u7528\u6A21\u62DF\u6570\u636E");
          checkedProvinces.value = /* @__PURE__ */ new Set(["\u5317\u4EAC", "\u4E0A\u6D77", "\u5E7F\u4E1C", "\u6D59\u6C5F"]);
          checkedCities.value = /* @__PURE__ */ new Set(["\u5317\u4EAC", "\u4E0A\u6D77", "\u5E7F\u5DDE", "\u6DF1\u5733", "\u676D\u5DDE"]);
          stats.value = {
            provinces: 4,
            cities: 5,
            attractions: 12,
            foods: 8
          };
          checkinData.value = [
            { id: 1, targetId: 1, cityName: "\u5317\u4EAC", provinceName: "\u5317\u4EAC", targetType: "scenic", latitude: 39.9042, longitude: 116.4074 },
            { id: 2, targetId: 2, cityName: "\u4E0A\u6D77", provinceName: "\u4E0A\u6D77", targetType: "scenic", latitude: 31.2304, longitude: 121.4737 },
            { id: 3, targetId: 3, cityName: "\u5E7F\u5DDE", provinceName: "\u5E7F\u4E1C", targetType: "scenic", latitude: 23.1291, longitude: 113.2644 },
            { id: 4, targetId: 4, cityName: "\u6DF1\u5733", provinceName: "\u5E7F\u4E1C", targetType: "food", latitude: 22.5431, longitude: 114.0579 },
            { id: 5, targetId: 5, cityName: "\u676D\u5DDE", provinceName: "\u6D59\u6C5F", targetType: "scenic", latitude: 30.2741, longitude: 120.1551 }
          ];
          updateMapMarkers();
        }
      }
    };
    common_vendor.onMounted(() => {
      mapLoaded.value = true;
      getUserLocation();
      if (user.value) {
        loadCheckinData();
      } else {
        common_vendor.index.showToast({
          title: "\u8BF7\u5148\u767B\u5F55",
          icon: "none"
        });
      }
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
        g: userLocationMarker.value,
        h: mapCircles.value,
        i: mapPolygons.value,
        j: common_vendor.o(onRegionChange),
        k: common_vendor.o(onMapTap),
        l: common_vendor.o(onMapUpdated),
        m: common_vendor.t(stats.value.provinces || 0),
        n: common_vendor.t(stats.value.cities || 0),
        o: common_vendor.t(stats.value.attractions || 0),
        p: common_vendor.t(stats.value.foods || 0)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-2aa02d9b"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/footprint/footprint.vue"]]);
wx.createPage(MiniProgramPage);
