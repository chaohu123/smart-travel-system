"use strict";
var common_vendor = require("../../common/vendor.js");
var api_activity = require("../../api/activity.js");
var api_content = require("../../api/content.js");
var utils_config = require("../../utils/config.js");
var utils_image = require("../../utils/image.js");
var store_user = require("../../store/user.js");
var utils_selectedCity = require("../../utils/selectedCity.js");
require("../../utils/http.js");
require("../../utils/storage.js");
if (!Math) {
  (common_vendor.unref(common_vendor.CloseSmall) + common_vendor.unref(common_vendor.Search) + common_vendor.unref(common_vendor.LocalPin) + common_vendor.unref(common_vendor.KnifeFork) + common_vendor.unref(common_vendor.Add))();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = store_user.useUserStore();
    const currentUser = common_vendor.computed(() => store.state.profile);
    const activeTab = common_vendor.ref("attraction");
    const checkinList = common_vendor.ref([]);
    const pageNum = common_vendor.ref(1);
    const pageSize = common_vendor.ref(10);
    const total = common_vendor.ref(0);
    const loading = common_vendor.ref(false);
    const noMore = common_vendor.ref(false);
    const showModal = common_vendor.ref(false);
    const currentItem = common_vendor.ref(null);
    const uploadImages = common_vendor.ref([]);
    const checkinComment = common_vendor.ref("");
    const locationOk = common_vendor.ref(false);
    const locationMsg = common_vendor.ref("");
    const searchKeyword = common_vendor.ref("");
    const showFilterModal = common_vendor.ref(false);
    const currentSort = common_vendor.ref("default");
    const activeFilters = common_vendor.ref(["all"]);
    const cardAnimate = common_vendor.ref(false);
    const userLocation = common_vendor.ref(null);
    const activityList = common_vendor.ref([]);
    const refreshing = common_vendor.ref(false);
    const currentCity = common_vendor.ref("\u5B9A\u4F4D\u4E2D...");
    const currentCityId = common_vendor.ref(null);
    const locationStatus = common_vendor.ref("idle");
    const manualCitySelected = common_vendor.ref(false);
    const lastCityApplyTs = common_vendor.ref(0);
    const citySelectionPending = common_vendor.ref(false);
    const citySelectorOpenTs = common_vendor.ref(0);
    let locationTimer = null;
    const sortOptions = [
      { label: "\u9ED8\u8BA4", value: "default" },
      { label: "\u8DDD\u79BB\u6700\u8FD1", value: "distance" },
      { label: "\u6700\u70ED\u95E8", value: "hot" },
      { label: "\u6253\u5361\u6700\u591A", value: "checkin" }
    ];
    const filterOptions = [
      { label: "\u5168\u90E8", value: "all" },
      { label: "\u5DF2\u6253\u5361", value: "checked" },
      { label: "\u9644\u8FD1", value: "nearby" }
    ];
    const mockAttractions = [
      {
        id: 1,
        name: "\u5BBD\u7A84\u5DF7\u5B50",
        cover: utils_config.defaultScenicImage,
        location: "\u6210\u90FD\u5E02\u9752\u7F8A\u533A",
        checkinCount: 1234,
        type: "attraction",
        tag: "hot"
      }
    ];
    const mockFoods = [
      {
        id: 101,
        name: "\u706B\u9505",
        cover: utils_config.defaultFoodImage,
        location: "\u6210\u90FD\u5404\u5927\u5546\u5708",
        checkinCount: 3456,
        type: "food",
        tag: "hot"
      }
    ];
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };
    const normalizeCityName = (name) => {
      return String(name || "").trim().replace(/市$/, "").replace(/省$/, "").replace(/自治区$/, "").replace(/特别行政区$/, "");
    };
    const mapCityItem = (raw) => {
      const name = (raw == null ? void 0 : raw.cityName) || (raw == null ? void 0 : raw.name);
      if (!(raw == null ? void 0 : raw.id) || !name)
        return null;
      const latRaw = raw.latitude;
      const lngRaw = raw.longitude;
      const latitude = typeof latRaw === "number" ? latRaw : typeof latRaw === "string" ? parseFloat(latRaw) : NaN;
      const longitude = typeof lngRaw === "number" ? lngRaw : typeof lngRaw === "string" ? parseFloat(lngRaw) : NaN;
      return {
        id: Number(raw.id),
        name,
        latitude,
        longitude
      };
    };
    const resolveLocatedCity = async (cityName, latitude, longitude) => {
      try {
        const resp = await api_content.cityApi.list();
        const response = resp.data;
        if (resp.statusCode !== 200 || response.code !== 200)
          return null;
        const cities = (response.data || []).map((item) => mapCityItem(item)).filter((item) => !!item);
        const normalizedName = normalizeCityName(cityName);
        if (normalizedName) {
          const matched = cities.find((city) => normalizeCityName(city.name) === normalizedName);
          if (matched)
            return matched;
        }
        let nearest = null;
        let minDist = Number.POSITIVE_INFINITY;
        cities.forEach((city) => {
          if (!Number.isFinite(city.latitude) || !Number.isFinite(city.longitude))
            return;
          const distance = calculateDistance(latitude, longitude, city.latitude, city.longitude);
          if (distance < minDist) {
            minDist = distance;
            nearest = city;
          }
        });
        return nearest;
      } catch {
        return null;
      }
    };
    const getUserLocation = () => {
      locationStatus.value = "loading";
      if (!manualCitySelected.value) {
        currentCity.value = "\u5B9A\u4F4D\u4E2D...";
      }
      if (locationTimer !== null) {
        clearTimeout(locationTimer);
      }
      locationTimer = setTimeout(() => {
        if (locationStatus.value === "loading") {
          locationStatus.value = "fail";
          if (!manualCitySelected.value) {
            currentCity.value = "\u5B9A\u4F4D\u5931\u8D25\uFF0C\u70B9\u51FB\u91CD\u8BD5";
          }
        }
      }, 5e3);
      common_vendor.index.getLocation({
        type: "gcj02",
        altitude: false,
        geocode: true,
        timeout: 5e3,
        success: async (res) => {
          if (locationTimer !== null) {
            clearTimeout(locationTimer);
            locationTimer = null;
          }
          locationStatus.value = "success";
          userLocation.value = {
            latitude: res.latitude,
            longitude: res.longitude
          };
          checkinList.value.forEach((item) => {
            if (item.latitude && item.longitude) {
              const distance = calculateDistance(
                res.latitude,
                res.longitude,
                item.latitude,
                item.longitude
              );
              item.distance = distance < 1 ? `${Math.round(distance * 1e3)}m` : `${distance.toFixed(1)}km`;
            }
          });
          const addr = res.address || {};
          let cityName = "";
          if (addr.city) {
            cityName = addr.city.replace(/市$/, "");
          } else if (addr.province) {
            cityName = addr.province.replace(/省$/, "");
          } else if (addr.district) {
            cityName = addr.district.replace(/(区|县)$/, "");
          }
          if (cityName && !manualCitySelected.value) {
            currentCity.value = cityName;
          } else {
            try {
              api_content.cityApi.list().then((resp) => {
                const response = resp.data;
                if (resp.statusCode === 200 && response.code === 200) {
                  const rawCities = response.data || [];
                  const withLocation = rawCities.map((c) => {
                    const name = c.cityName || c.name;
                    if (!name)
                      return null;
                    const latRaw = c.latitude;
                    const lngRaw = c.longitude;
                    const lat = typeof latRaw === "number" ? latRaw : typeof latRaw === "string" ? parseFloat(latRaw) : NaN;
                    const lng = typeof lngRaw === "number" ? lngRaw : typeof lngRaw === "string" ? parseFloat(lngRaw) : NaN;
                    if (!Number.isFinite(lat) || !Number.isFinite(lng))
                      return null;
                    return {
                      id: c.id,
                      name,
                      latitude: lat,
                      longitude: lng
                    };
                  }).filter((c) => !!c);
                  if (!withLocation.length)
                    return;
                  let nearest = null;
                  let minDist = Number.POSITIVE_INFINITY;
                  withLocation.forEach((city) => {
                    const d = calculateDistance(
                      res.latitude,
                      res.longitude,
                      city.latitude,
                      city.longitude
                    );
                    if (d < minDist) {
                      minDist = d;
                      nearest = city;
                    }
                  });
                  if (nearest && nearest.name && !manualCitySelected.value) {
                    currentCity.value = nearest.name.replace(/市$/, "");
                  }
                }
              }).catch(() => {
              });
            } catch {
            }
          }
          if (!manualCitySelected.value) {
            const locatedCity = await resolveLocatedCity(cityName, res.latitude, res.longitude);
            if (locatedCity) {
              currentCity.value = normalizeCityName(locatedCity.name);
              currentCityId.value = locatedCity.id;
            } else if (cityName) {
              currentCity.value = cityName;
              currentCityId.value = null;
            }
            checkinList.value = [];
            pageNum.value = 1;
            total.value = 0;
            noMore.value = false;
            cardAnimate.value = false;
            loadCheckinList();
          }
          if (userLocation.value) {
            currentSort.value = "distance";
          }
        },
        fail: (err) => {
          if (locationTimer !== null) {
            clearTimeout(locationTimer);
            locationTimer = null;
          }
          locationStatus.value = "fail";
          let errorMsg = "\u83B7\u53D6\u4F4D\u7F6E\u5931\u8D25";
          if (err.errMsg) {
            if (err.errMsg.includes("auth deny") || err.errMsg.includes("authorize")) {
              errorMsg = "\u9700\u8981\u4F4D\u7F6E\u6743\u9650\u624D\u80FD\u4F7F\u7528\u6B64\u529F\u80FD\uFF0C\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u5F00\u542F";
              common_vendor.index.openSetting({
                success: (res) => {
                  if (res.authSetting["scope.userLocation"]) {
                    getUserLocation();
                  }
                }
              });
            } else if (err.errMsg.includes("timeout")) {
              errorMsg = "\u5B9A\u4F4D\u8D85\u65F6\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5";
            } else if (err.errMsg.includes("fail")) {
              errorMsg = "\u5B9A\u4F4D\u670D\u52A1\u4E0D\u53EF\u7528\uFF0C\u8BF7\u68C0\u67E5\u8BBE\u5907\u5B9A\u4F4D\u8BBE\u7F6E";
            }
          }
          if (!manualCitySelected.value) {
            currentCity.value = "\u5B9A\u4F4D\u5931\u8D25\uFF0C\u70B9\u51FB\u91CD\u8BD5";
            currentCityId.value = null;
            loadCheckinList();
          }
          common_vendor.index.showToast({
            title: errorMsg,
            icon: "none",
            duration: 2e3
          });
        }
      });
    };
    const handleLocationClick = () => {
      if (locationStatus.value === "loading")
        return;
      manualCitySelected.value = false;
      currentCityId.value = null;
      getUserLocation();
    };
    const filteredList = common_vendor.computed(() => {
      let list = [...checkinList.value];
      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase();
        list = list.filter(
          (item) => item.name.toLowerCase().includes(keyword) || item.location.toLowerCase().includes(keyword)
        );
      }
      if (activeFilters.value.includes("checked")) {
        list = list.filter((item) => item.isChecked);
      }
      if (activeFilters.value.includes("nearby") && userLocation.value) {
        list = list.filter((item) => {
          if (!item.latitude || !item.longitude)
            return false;
          const distance = calculateDistance(
            userLocation.value.latitude,
            userLocation.value.longitude,
            item.latitude,
            item.longitude
          );
          return distance < 10;
        });
      }
      if (currentSort.value === "distance" && userLocation.value) {
        list.sort((a, b) => {
          if (!a.latitude || !a.longitude)
            return 1;
          if (!b.latitude || !b.longitude)
            return -1;
          const distA = calculateDistance(
            userLocation.value.latitude,
            userLocation.value.longitude,
            a.latitude,
            a.longitude
          );
          const distB = calculateDistance(
            userLocation.value.latitude,
            userLocation.value.longitude,
            b.latitude,
            b.longitude
          );
          return distA - distB;
        });
      } else if (currentSort.value === "hot") {
        list.sort((a, b) => {
          if (a.tag === "hot" && b.tag !== "hot")
            return -1;
          if (a.tag !== "hot" && b.tag === "hot")
            return 1;
          return b.checkinCount - a.checkinCount;
        });
      } else if (currentSort.value === "checkin") {
        list.sort((a, b) => b.checkinCount - a.checkinCount);
      }
      const totalCount = list.length;
      if (total.value !== totalCount) {
        total.value = totalCount;
      }
      const start = (pageNum.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return list.slice(start, end);
    });
    const totalPages = common_vendor.computed(() => {
      if (!total.value || total.value <= 0)
        return 1;
      return Math.max(1, Math.ceil(total.value / pageSize.value));
    });
    const switchTab = (tab) => {
      activeTab.value = tab;
      checkinList.value = [];
      pageNum.value = 1;
      total.value = 0;
      noMore.value = false;
      cardAnimate.value = false;
      searchKeyword.value = "";
      loadCheckinList();
    };
    const loadCheckinList = async () => {
      loading.value = true;
      noMore.value = false;
      try {
        if (activeTab.value === "attraction") {
          const scenicParams = {
            pageNum: 1,
            pageSize: 1e3
          };
          if (currentCityId.value !== null) {
            scenicParams.cityId = currentCityId.value;
          }
          const res = await api_content.scenicSpotApi.list(scenicParams);
          const response = res.data;
          if (res.statusCode === 200 && response.code === 200) {
            const raw = response.data;
            const rows = Array.isArray(raw == null ? void 0 : raw.rows) ? raw.rows : Array.isArray(raw == null ? void 0 : raw.list) ? raw.list : Array.isArray(raw) ? raw : [];
            checkinList.value = rows.map((item) => ({
              id: item.id,
              targetId: item.targetId || item.id,
              name: item.name,
              cover: utils_image.getImageUrl(item.imageUrl) || utils_config.defaultScenicImage,
              location: item.address || `${item.province || ""}${item.city || ""}`,
              checkinCount: item.hotScore || 0,
              type: "attraction",
              tag: item.hotScore && item.hotScore > 1e4 ? "hot" : void 0,
              latitude: item.latitude,
              longitude: item.longitude,
              isChecked: false
            }));
            total.value = checkinList.value.length;
          } else {
            checkinList.value = [...mockAttractions];
            total.value = mockAttractions.length;
          }
        } else {
          const foodParams = {
            pageNum: 1,
            pageSize: 1e3
          };
          if (currentCityId.value !== null) {
            foodParams.cityId = currentCityId.value;
          }
          const res = await api_content.foodApi.list(foodParams);
          const response = res.data;
          if (res.statusCode === 200 && response.code === 200) {
            const raw = response.data;
            const rows = Array.isArray(raw == null ? void 0 : raw.rows) ? raw.rows : Array.isArray(raw == null ? void 0 : raw.list) ? raw.list : Array.isArray(raw) ? raw : [];
            checkinList.value = rows.map((item) => ({
              id: item.id,
              targetId: item.targetId || item.id,
              name: item.name,
              cover: utils_image.getImageUrl(item.imageUrl) || utils_config.defaultFoodImage,
              location: item.address || item.cityName || "",
              checkinCount: item.hotScore || 0,
              type: "food",
              tag: item.hotScore && item.hotScore > 1e4 ? "hot" : void 0,
              latitude: item.latitude,
              longitude: item.longitude,
              isChecked: false
            }));
            total.value = checkinList.value.length;
          } else {
            checkinList.value = [...mockFoods];
            total.value = mockFoods.length;
          }
        }
        await markCheckedItems();
      } catch (error) {
        checkinList.value = activeTab.value === "attraction" ? [...mockAttractions] : [...mockFoods];
      } finally {
        loading.value = false;
        cardAnimate.value = true;
      }
    };
    const markCheckedItems = async () => {
      var _a, _b;
      const userId = (_a = currentUser.value) == null ? void 0 : _a.id;
      if (!userId || checkinList.value.length === 0)
        return;
      try {
        const res = await api_content.checkinApi.getMyCheckins(userId, 1, 1e3);
        const response = res.data;
        if (res.statusCode !== 200 || response.code !== 200)
          return;
        const records = ((_b = response.data) == null ? void 0 : _b.list) || [];
        const currentTargetType = activeTab.value === "attraction" ? "scenic" : "food";
        const checkedIds = new Set(
          records.filter((record) => record.targetType === currentTargetType).map((record) => Number(record.targetId))
        );
        checkinList.value.forEach((item) => {
          item.isChecked = checkedIds.has(Number(item.targetId || item.id));
        });
      } catch (error) {
      }
    };
    const goPrevPage = () => {
      if (pageNum.value <= 1 || loading.value)
        return;
      pageNum.value -= 1;
      loadCheckinList();
    };
    const goNextPage = () => {
      if (pageNum.value >= totalPages.value || loading.value)
        return;
      pageNum.value += 1;
      loadCheckinList();
    };
    const loadMore = () => {
      if (loading.value || noMore.value)
        return;
    };
    const viewDetail = (item) => {
      const targetId = item.targetId || item.id;
      if (item.type === "attraction") {
        common_vendor.index.navigateTo({ url: `/pages/scenic/detail?id=${targetId}&from=checkin` });
      } else {
        common_vendor.index.navigateTo({ url: `/pages/food/detail?id=${targetId}&from=checkin` });
      }
    };
    const viewActivity = (activity) => {
      if (activity.id) {
        common_vendor.index.navigateTo({ url: `/pages/activity/detail?id=${activity.id}` });
      } else {
        common_vendor.index.showToast({
          title: "\u6D3B\u52A8\u4FE1\u606F\u9519\u8BEF",
          icon: "none"
        });
      }
    };
    const loadActivities = async () => {
      try {
        const res = await api_activity.activityApi.getList({
          status: "online",
          pageNum: 1,
          pageSize: 10
        });
        if (res.statusCode === 200 && res.data.code === 200) {
          const activities = (res.data.data.rows || []).filter(
            (activity) => activity.status === "online" || activity.status === "upcoming"
          );
          activityList.value = activities.map((activity) => ({
            id: activity.id,
            name: activity.name || "",
            highlight: activity.highlight || "",
            imageUrl: activity.imageUrl || ""
          }));
        } else {
          activityList.value = [];
        }
      } catch (error) {
        activityList.value = [];
      }
    };
    const handleSearch = () => {
      const kw = searchKeyword.value.trim();
      if (!kw) {
        searchKeyword.value = "";
        return;
      }
      searchKeyword.value = kw;
      pageNum.value = 1;
    };
    const clearSearch = () => {
      searchKeyword.value = "";
    };
    const applySelectedCity = (data, shouldReload = true) => {
      const cityId = Number(data == null ? void 0 : data.id);
      const cityName = String((data == null ? void 0 : data.name) || "").trim();
      const ts = Number((data == null ? void 0 : data.ts) || Date.now());
      if (!cityId || !cityName)
        return false;
      const unchanged = currentCityId.value === cityId && currentCity.value === cityName;
      currentCity.value = cityName;
      currentCityId.value = cityId;
      manualCitySelected.value = true;
      lastCityApplyTs.value = Math.max(lastCityApplyTs.value, ts);
      if (shouldReload && !unchanged) {
        checkinList.value = [];
        pageNum.value = 1;
        total.value = 0;
        noMore.value = false;
        cardAnimate.value = false;
        loadCheckinList();
      }
      return true;
    };
    const applyCityFromStorage = async () => {
      await utils_selectedCity.syncSelectedCityName();
      const selected = common_vendor.index.getStorageSync("ticket_selected_city");
      if (!selected || !selected.id || !selected.name)
        return false;
      const ts = Number(selected.ts || 0);
      if (citySelectorOpenTs.value && ts <= citySelectorOpenTs.value)
        return false;
      if (ts && ts <= lastCityApplyTs.value)
        return false;
      return applySelectedCity(selected, true);
    };
    const openCitySelector = async () => {
      citySelectionPending.value = true;
      citySelectorOpenTs.value = Date.now();
      const handleCitySelected = (data) => {
        citySelectionPending.value = false;
        applySelectedCity(data, true);
      };
      common_vendor.index.navigateTo({
        url: "/pages/city/select",
        events: {
          citySelected: handleCitySelected
        },
        success: (res) => {
          res.eventChannel.on("citySelected", handleCitySelected);
        }
      });
    };
    const toggleFilter = (value) => {
      if (value === "all") {
        activeFilters.value = ["all"];
      } else {
        const index = activeFilters.value.indexOf(value);
        if (index > -1) {
          activeFilters.value.splice(index, 1);
          if (activeFilters.value.length === 0) {
            activeFilters.value = ["all"];
          }
        } else {
          const allIndex = activeFilters.value.indexOf("all");
          if (allIndex > -1) {
            activeFilters.value.splice(allIndex, 1);
          }
          activeFilters.value.push(value);
        }
      }
    };
    const resetFilter = () => {
      currentSort.value = "default";
      activeFilters.value = ["all"];
    };
    const applyFilter = () => {
      showFilterModal.value = false;
    };
    const showLoginPromptDialog = () => {
      common_vendor.index.showModal({
        title: "\u9700\u8981\u767B\u5F55",
        content: "\u6253\u5361\u524D\u9700\u8981\u5148\u767B\u5F55\u8D26\u53F7",
        confirmText: "\u53BB\u767B\u5F55",
        cancelText: "\u53D6\u6D88",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.switchTab({ url: "/pages/profile/profile" });
          }
        }
      });
    };
    const openCheckinModal = (item) => {
      if (!currentUser.value) {
        showLoginPromptDialog();
        return;
      }
      if (item.isChecked) {
        common_vendor.index.showToast({ title: "\u4F60\u5DF2\u7ECF\u6253\u5361\u8FC7\u5566", icon: "none" });
        return;
      }
      currentItem.value = item;
      uploadImages.value = [];
      checkinComment.value = "";
      showModal.value = true;
      ensureLocation();
    };
    const closeModal = () => {
      showModal.value = false;
      currentItem.value = null;
    };
    const chooseImage = () => {
      common_vendor.index.chooseImage({
        count: 1 - uploadImages.value.length,
        success: (res) => {
          uploadImages.value.push(...res.tempFilePaths);
        }
      });
    };
    const removeImage = (index) => {
      uploadImages.value.splice(index, 1);
    };
    const getUploadedPhotoUrl = async () => {
      var _a;
      const firstImage = uploadImages.value[0];
      if (!firstImage)
        return void 0;
      const uploadRes = await api_content.uploadApi.upload(firstImage);
      const uploadData = uploadRes.data;
      if (uploadRes.statusCode !== 200 || (uploadData == null ? void 0 : uploadData.code) !== 200) {
        throw new Error((uploadData == null ? void 0 : uploadData.msg) || "\u56FE\u7247\u4E0A\u4F20\u5931\u8D25");
      }
      if (typeof (uploadData == null ? void 0 : uploadData.data) === "string") {
        return uploadData.data;
      }
      return (_a = uploadData == null ? void 0 : uploadData.data) == null ? void 0 : _a.url;
    };
    const submitCheckin = async () => {
      var _a, _b;
      const userId = (_a = currentUser.value) == null ? void 0 : _a.id;
      if (!userId) {
        showLoginPromptDialog();
        return;
      }
      if (!locationOk.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u5F00\u542F\u5B9A\u4F4D\u6743\u9650", icon: "none" });
        return;
      }
      if (!currentItem.value) {
        common_vendor.index.showToast({
          title: "\u6253\u5361\u76EE\u6807\u5F02\u5E38\uFF0C\u8BF7\u91CD\u8BD5",
          icon: "none"
        });
        return;
      }
      try {
        const targetType = currentItem.value.type === "attraction" ? "scenic" : "food";
        const latitude = currentItem.value.latitude;
        const longitude = currentItem.value.longitude;
        const photoUrl = await getUploadedPhotoUrl();
        await api_content.checkinApi.addCheckin({
          userId,
          targetType,
          targetId: currentItem.value.targetId || currentItem.value.id,
          photoUrl,
          content: checkinComment.value.trim() || void 0,
          latitude,
          longitude
        });
        common_vendor.index.showToast({
          title: "\u6253\u5361\u6210\u529F",
          icon: "success"
        });
        const item = checkinList.value.find((i) => i.id === currentItem.value.id);
        if (item) {
          item.isChecked = true;
          item.checkinCount += 1;
        }
        closeModal();
      } catch (error) {
        common_vendor.index.showToast({
          title: ((_b = error == null ? void 0 : error.data) == null ? void 0 : _b.msg) || (error == null ? void 0 : error.message) || "\u6253\u5361\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",
          icon: "none"
        });
      }
    };
    const ensureLocation = () => {
      common_vendor.index.getLocation({
        type: "gcj02",
        altitude: false,
        geocode: false,
        success: () => {
          locationOk.value = true;
          locationMsg.value = "";
        },
        fail: (err) => {
          locationOk.value = false;
          let errorMsg = "\u5B9A\u4F4D\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u6216\u6388\u6743\u5B9A\u4F4D";
          if (err.errMsg) {
            if (err.errMsg.includes("auth deny") || err.errMsg.includes("authorize")) {
              errorMsg = "\u9700\u8981\u4F4D\u7F6E\u6743\u9650\uFF0C\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u5F00\u542F";
              common_vendor.index.showModal({
                title: "\u9700\u8981\u4F4D\u7F6E\u6743\u9650",
                content: "\u4E3A\u4E86\u63D0\u4F9B\u66F4\u597D\u7684\u670D\u52A1\uFF0C\u9700\u8981\u83B7\u53D6\u60A8\u7684\u4F4D\u7F6E\u4FE1\u606F\u3002\u662F\u5426\u524D\u5F80\u8BBE\u7F6E\u5F00\u542F\uFF1F",
                confirmText: "\u53BB\u8BBE\u7F6E",
                cancelText: "\u53D6\u6D88",
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    common_vendor.index.openSetting({
                      success: (settingRes) => {
                        if (settingRes.authSetting["scope.userLocation"]) {
                          ensureLocation();
                        }
                      }
                    });
                  }
                }
              });
            } else if (err.errMsg.includes("timeout")) {
              errorMsg = "\u5B9A\u4F4D\u8D85\u65F6\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5";
            } else if (err.errMsg.includes("fail")) {
              errorMsg = "\u5B9A\u4F4D\u670D\u52A1\u4E0D\u53EF\u7528\uFF0C\u8BF7\u68C0\u67E5\u8BBE\u5907\u5B9A\u4F4D\u8BBE\u7F6E";
            }
          }
          locationMsg.value = errorMsg;
        }
      });
    };
    const onRefresh = async () => {
      refreshing.value = true;
      common_vendor.index.showLoading({
        title: "\u5237\u65B0\u4E2D...",
        mask: true
      });
      try {
        await Promise.all([
          new Promise((resolve) => {
            loadCheckinList();
            resolve();
          }),
          loadActivities()
        ]);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "\u5237\u65B0\u6210\u529F",
          icon: "success",
          duration: 1500
        });
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "\u5237\u65B0\u5931\u8D25",
          icon: "none",
          duration: 2e3
        });
      } finally {
        setTimeout(() => {
          refreshing.value = false;
        }, 500);
      }
    };
    common_vendor.onMounted(() => {
      getUserLocation();
      loadActivities();
    });
    common_vendor.onShow(async () => {
      if (citySelectionPending.value) {
        citySelectionPending.value = false;
        await applyCityFromStorage();
      }
    });
    common_vendor.onUnmounted(() => {
      if (locationTimer !== null) {
        clearTimeout(locationTimer);
        locationTimer = null;
      }
    });
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: activeTab.value === "attraction" ? "\u4F8B\u5982\uFF1A\u5929\u5B89\u95E8\u5E7F\u573A" : "\u4F8B\u5982\uFF1A\u5317\u4EAC\u70E4\u9E2D",
        b: common_vendor.o(handleSearch),
        c: searchKeyword.value,
        d: common_vendor.o(($event) => searchKeyword.value = $event.detail.value),
        e: searchKeyword.value
      }, searchKeyword.value ? {
        f: common_vendor.o(clearSearch),
        g: common_vendor.p({
          theme: "outline",
          size: "20",
          fill: "#9EA7B0"
        })
      } : {}, {
        h: common_vendor.p({
          theme: "outline",
          size: "24",
          fill: "#2FA66A"
        }),
        i: common_vendor.o(handleSearch),
        j: common_vendor.t(currentCity.value || "\u5B9A\u4F4D\u4E2D..."),
        k: common_vendor.o(handleLocationClick),
        l: common_vendor.o(openCitySelector),
        m: activityList.value.length > 0
      }, activityList.value.length > 0 ? {
        n: common_vendor.f(activityList.value, (activity, k0, i0) => {
          return {
            a: common_vendor.unref(utils_image.getImageUrl)(activity.imageUrl) || "https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=800",
            b: common_vendor.t(activity.name),
            c: common_vendor.t(activity.highlight),
            d: activity.id,
            e: common_vendor.o(($event) => viewActivity(activity))
          };
        })
      } : {}, {
        o: common_vendor.p({
          theme: "outline",
          size: "28",
          fill: "#2FA66A"
        }),
        p: activeTab.value === "attraction" ? 1 : "",
        q: common_vendor.o(($event) => switchTab("attraction")),
        r: common_vendor.p({
          theme: "outline",
          size: "28",
          fill: "#2FA66A"
        }),
        s: activeTab.value === "food" ? 1 : "",
        t: common_vendor.o(($event) => switchTab("food")),
        v: common_vendor.f(common_vendor.unref(filteredList), (item, k0, i0) => {
          return common_vendor.e({
            a: item.cover,
            b: item.tag
          }, item.tag ? {
            c: common_vendor.t(item.tag === "hot" ? "\u70ED\u95E8" : item.tag === "new" ? "\u65B0" : ""),
            d: common_vendor.n(`tag-${item.tag}`)
          } : {}, {
            e: common_vendor.t(item.name),
            f: "6e5fa1f7-4-" + i0,
            g: common_vendor.t(item.location),
            h: common_vendor.t(item.checkinCount),
            i: item.distance
          }, item.distance ? {} : {}, {
            j: item.distance
          }, item.distance ? {
            k: common_vendor.t(item.distance)
          } : {}, {
            l: common_vendor.t(item.isChecked ? "\u5DF2\u6253\u5361" : "\u53BB\u6253\u5361"),
            m: item.isChecked ? 1 : "",
            n: common_vendor.o(($event) => openCheckinModal(item)),
            o: item.id,
            p: common_vendor.o(($event) => viewDetail(item))
          });
        }),
        w: common_vendor.p({
          theme: "outline",
          size: "18",
          fill: "#9EA7B0"
        }),
        x: cardAnimate.value ? 1 : "",
        y: loading.value
      }, loading.value ? {} : {}, {
        z: noMore.value && common_vendor.unref(filteredList).length > 0
      }, noMore.value && common_vendor.unref(filteredList).length > 0 ? {} : {}, {
        A: !loading.value && common_vendor.unref(filteredList).length === 0
      }, !loading.value && common_vendor.unref(filteredList).length === 0 ? {} : {}, {
        B: !loading.value && total.value > 0
      }, !loading.value && total.value > 0 ? {
        C: pageNum.value === 1,
        D: common_vendor.o(goPrevPage),
        E: common_vendor.t(pageNum.value),
        F: common_vendor.t(common_vendor.unref(totalPages)),
        G: pageNum.value === common_vendor.unref(totalPages),
        H: common_vendor.o(goNextPage)
      } : {}, {
        I: common_vendor.o(loadMore),
        J: refreshing.value,
        K: common_vendor.o(onRefresh),
        L: showFilterModal.value
      }, showFilterModal.value ? {
        M: common_vendor.o(($event) => showFilterModal.value = false),
        N: common_vendor.p({
          theme: "outline",
          size: "24",
          fill: "#9EA7B0"
        }),
        O: common_vendor.f(sortOptions, (sort, k0, i0) => {
          return {
            a: common_vendor.t(sort.label),
            b: sort.value,
            c: currentSort.value === sort.value ? 1 : "",
            d: common_vendor.o(($event) => currentSort.value = sort.value)
          };
        }),
        P: common_vendor.f(filterOptions, (filter, k0, i0) => {
          return {
            a: common_vendor.t(filter.label),
            b: filter.value,
            c: activeFilters.value.includes(filter.value) ? 1 : "",
            d: common_vendor.o(($event) => toggleFilter(filter.value))
          };
        }),
        Q: common_vendor.o(resetFilter),
        R: common_vendor.o(applyFilter),
        S: common_vendor.o(() => {
        }),
        T: common_vendor.o(($event) => showFilterModal.value = false)
      } : {}, {
        U: showModal.value
      }, showModal.value ? common_vendor.e({
        V: common_vendor.t((_a = currentItem.value) == null ? void 0 : _a.name),
        W: common_vendor.o(closeModal),
        X: locationMsg.value
      }, locationMsg.value ? {
        Y: common_vendor.t(locationMsg.value)
      } : {}, {
        Z: common_vendor.f(uploadImages.value, (img, index, i0) => {
          return {
            a: img,
            b: common_vendor.o(($event) => removeImage(index)),
            c: "6e5fa1f7-6-" + i0,
            d: index
          };
        }),
        aa: common_vendor.p({
          theme: "outline",
          size: "24",
          fill: "#ffffff"
        }),
        ab: uploadImages.value.length < 1
      }, uploadImages.value.length < 1 ? {
        ac: common_vendor.p({
          theme: "outline",
          size: "28",
          fill: "#3ba272"
        }),
        ad: common_vendor.o(chooseImage)
      } : {}, {
        ae: checkinComment.value,
        af: common_vendor.o(($event) => checkinComment.value = $event.detail.value),
        ag: common_vendor.t(checkinComment.value.length),
        ah: common_vendor.o(submitCheckin),
        ai: common_vendor.o(() => {
        }),
        aj: common_vendor.o(closeModal)
      }) : {});
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6e5fa1f7"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/checkin/checkin.vue"]]);
wx.createPage(MiniProgramPage);
