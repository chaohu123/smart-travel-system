"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
var utils_http = require("../../utils/http.js");
var api_activity = require("../../api/activity.js");
var store_user = require("../../store/user.js");
var utils_router = require("../../utils/router.js");
var utils_config = require("../../utils/config.js");
var utils_image = require("../../utils/image.js");
var utils_tabPreload = require("../../utils/tabPreload.js");
require("../../utils/storage.js");
if (!Math) {
  (GuideOverlay + LoginPrompt + common_vendor.unref(common_vendor.Search) + SkeletonCards + EmptyState)();
}
const EmptyState = () => "../../components/EmptyState.js";
const SkeletonCards = () => "../../components/SkeletonCards.js";
const GuideOverlay = () => "../../components/GuideOverlay.js";
const LoginPrompt = () => "../../components/LoginPrompt.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = store_user.useUserStore();
    const user = common_vendor.computed(() => store.state.profile);
    const searchKeyword = common_vendor.ref("");
    const searchPlaceholder = "\u8F93\u5165\u57CE\u5E02 / \u60F3\u53BB\u54EA\u73A9\uFF1F";
    const activeFeatureId = common_vendor.ref(null);
    const featureEntries = common_vendor.ref([
      { id: 1, title: "\u667A\u80FD\u89C4\u5212", desc: "\u6839\u636E\u4F60\u7684\u5174\u8DA3\u667A\u80FD\u751F\u6210\u884C\u7A0B", icon: "Brain", text: "\u667A", type: "planner" },
      { id: 2, title: "\u70ED\u95E8\u7EBF\u8DEF", desc: "\u770B\u770B\u5927\u5BB6\u90FD\u5728\u8D70\u7684\u7206\u6B3E\u8DEF\u7EBF", icon: "Fire", text: "\u7EBF", type: "hot-routes" },
      { id: 3, title: "\u95E8\u7968\u9884\u8BA2", desc: "\u6309\u6240\u5728\u5730\u533A\u7B5B\u9009\u666F\u70B9\u5E76\u9884\u8BA2", icon: "Magic", text: "\u7968", type: "interest" }
    ]);
    const routeList = common_vendor.ref([]);
    const noteList = common_vendor.ref([]);
    const scenicList = common_vendor.ref([]);
    const foodList = common_vendor.ref([]);
    const loadingRecommend = common_vendor.ref(false);
    const loadingNotes = common_vendor.ref(false);
    const notePage = common_vendor.ref(1);
    const noteFinished = common_vendor.ref(false);
    const shouldAnimateMap = common_vendor.ref({});
    const showLoginPrompt = common_vendor.ref(false);
    const isInitialLoad = common_vendor.ref(true);
    const lastRefreshTime = common_vendor.ref(0);
    const searchLoading = common_vendor.ref(false);
    const searchScenicResults = common_vendor.ref([]);
    const searchFoodResults = common_vendor.ref([]);
    const searchNoteResults = common_vendor.ref([]);
    const searchActivityResults = common_vendor.ref([]);
    let searchTimer = null;
    const currentCityId = common_vendor.ref(null);
    const currentCityName = common_vendor.ref("");
    const isSearching = common_vendor.computed(() => searchKeyword.value.trim().length > 0);
    const hasSearchResult = common_vendor.computed(() => {
      return searchScenicResults.value.length > 0 || searchFoodResults.value.length > 0 || searchNoteResults.value.length > 0 || searchActivityResults.value.length > 0;
    });
    const defaultRouteImage = "https://ts2.tc.mm.bing.net/th/id/OIP-C.D0FxyIfldS08x95YBJdFQAHaFj?rs=1&pid=ImgDetMain&o=7&rm=3";
    const defaultNoteImage = "/static/default-note.jpg";
    const provinceList = common_vendor.ref([
      { name: "\u5168\u90E8\u7701\u4EFD", value: "" },
      { name: "\u5317\u4EAC", value: "\u5317\u4EAC" },
      { name: "\u4E0A\u6D77", value: "\u4E0A\u6D77" },
      { name: "\u5E7F\u4E1C", value: "\u5E7F\u4E1C" },
      { name: "\u6D59\u6C5F", value: "\u6D59\u6C5F" },
      { name: "\u6C5F\u82CF", value: "\u6C5F\u82CF" },
      { name: "\u56DB\u5DDD", value: "\u56DB\u5DDD" },
      { name: "\u9655\u897F", value: "\u9655\u897F" },
      { name: "\u798F\u5EFA", value: "\u798F\u5EFA" },
      { name: "\u5C71\u4E1C", value: "\u5C71\u4E1C" },
      { name: "\u6CB3\u5357", value: "\u6CB3\u5357" },
      { name: "\u6E56\u5317", value: "\u6E56\u5317" },
      { name: "\u6E56\u5357", value: "\u6E56\u5357" },
      { name: "\u5B89\u5FBD", value: "\u5B89\u5FBD" },
      { name: "\u6CB3\u5317", value: "\u6CB3\u5317" },
      { name: "\u8FBD\u5B81", value: "\u8FBD\u5B81" },
      { name: "\u6C5F\u897F", value: "\u6C5F\u897F" },
      { name: "\u91CD\u5E86", value: "\u91CD\u5E86" },
      { name: "\u4E91\u5357", value: "\u4E91\u5357" },
      { name: "\u5E7F\u897F", value: "\u5E7F\u897F" },
      { name: "\u5C71\u897F", value: "\u5C71\u897F" },
      { name: "\u5185\u8499\u53E4", value: "\u5185\u8499\u53E4" },
      { name: "\u8D35\u5DDE", value: "\u8D35\u5DDE" },
      { name: "\u65B0\u7586", value: "\u65B0\u7586" },
      { name: "\u5409\u6797", value: "\u5409\u6797" },
      { name: "\u9ED1\u9F99\u6C5F", value: "\u9ED1\u9F99\u6C5F" },
      { name: "\u6D77\u5357", value: "\u6D77\u5357" },
      { name: "\u7518\u8083", value: "\u7518\u8083" },
      { name: "\u5B81\u590F", value: "\u5B81\u590F" },
      { name: "\u9752\u6D77", value: "\u9752\u6D77" },
      { name: "\u897F\u85CF", value: "\u897F\u85CF" },
      { name: "\u5929\u6D25", value: "\u5929\u6D25" },
      { name: "\u9999\u6E2F", value: "\u9999\u6E2F" },
      { name: "\u6FB3\u95E8", value: "\u6FB3\u95E8" },
      { name: "\u53F0\u6E7E", value: "\u53F0\u6E7E" }
    ]);
    const selectedProvinceIndex = common_vendor.ref(0);
    const selectedProvince = common_vendor.computed(() => {
      var _a;
      return ((_a = provinceList.value[selectedProvinceIndex.value]) == null ? void 0 : _a.name) || "\u5168\u90E8\u7701\u4EFD";
    });
    const scrollTop = common_vendor.ref(0);
    const showBackToTop = common_vendor.ref(false);
    const onScroll = (e) => {
      const scrollTopValue = e.detail.scrollTop;
      showBackToTop.value = scrollTopValue > 300;
    };
    const scrollToTop = () => {
      scrollTop.value = 0;
      setTimeout(() => {
        scrollTop.value = 0.01;
      }, 100);
    };
    const filteredScenicList = common_vendor.computed(() => {
      return scenicList.value;
    });
    const onProvinceChange = (e) => {
      selectedProvinceIndex.value = e.detail.value;
      currentCityId.value = null;
      currentCityName.value = "";
      fetchHomeData();
      fetchHomeData();
    };
    const normalizeCityName = (name) => {
      return String(name || "").trim().replace(/市$/, "").replace(/省$/, "").replace(/自治区$/, "").replace(/特别行政区$/, "");
    };
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };
    const applyProvinceByName = (provinceName) => {
      const normalizedProvince = normalizeCityName(provinceName);
      if (!normalizedProvince)
        return false;
      const index = provinceList.value.findIndex((province) => {
        return normalizeCityName(province.name) === normalizedProvince || normalizeCityName(province.value) === normalizedProvince;
      });
      if (index <= 0)
        return false;
      selectedProvinceIndex.value = index;
      return true;
    };
    const resolveLocatedCity = async (cityName, latitude, longitude) => {
      try {
        const res = await api_content.cityApi.list();
        const data = res.data;
        if (res.statusCode !== 200 || data.code !== 200)
          return null;
        const cities = (data.data || []).map((item) => {
          const name = (item == null ? void 0 : item.cityName) || (item == null ? void 0 : item.name);
          if (!(item == null ? void 0 : item.id) || !name)
            return null;
          const latRaw = item.latitude;
          const lngRaw = item.longitude;
          const lat = typeof latRaw === "number" ? latRaw : typeof latRaw === "string" ? parseFloat(latRaw) : NaN;
          const lng = typeof lngRaw === "number" ? lngRaw : typeof lngRaw === "string" ? parseFloat(lngRaw) : NaN;
          return {
            id: Number(item.id),
            name,
            province: item.province,
            latitude: lat,
            longitude: lng
          };
        }).filter((item) => !!item);
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
    const locateCurrentCity = () => {
      return new Promise((resolve) => {
        common_vendor.index.getLocation({
          type: "gcj02",
          altitude: false,
          geocode: true,
          timeout: 5e3,
          success: async (res) => {
            const addr = res.address || {};
            const cityName = normalizeCityName(addr.city || addr.province || addr.district || "");
            const provinceName = addr.province || "";
            const locatedCity = await resolveLocatedCity(cityName, res.latitude, res.longitude);
            if (locatedCity) {
              currentCityId.value = locatedCity.id;
              currentCityName.value = normalizeCityName(locatedCity.name);
              applyProvinceByName(locatedCity.province || provinceName);
            } else {
              currentCityId.value = null;
              currentCityName.value = cityName;
              applyProvinceByName(provinceName);
            }
            resolve();
          },
          fail: () => {
            currentCityId.value = null;
            currentCityName.value = "";
            resolve();
          }
        });
      });
    };
    const onSearchClick = () => {
    };
    const onSearchConfirm = () => {
      runGlobalSearch();
    };
    const onSearchInput = () => {
      if (searchTimer)
        clearTimeout(searchTimer);
      if (!searchKeyword.value.trim()) {
        clearSearchResults();
        return;
      }
      searchTimer = setTimeout(() => {
        runGlobalSearch();
      }, 300);
    };
    const clearSearchResults = () => {
      searchScenicResults.value = [];
      searchFoodResults.value = [];
      searchNoteResults.value = [];
      searchActivityResults.value = [];
    };
    const extractRows = (raw) => {
      if (Array.isArray(raw == null ? void 0 : raw.rows))
        return raw.rows;
      if (Array.isArray(raw == null ? void 0 : raw.list))
        return raw.list;
      if (Array.isArray(raw))
        return raw;
      return [];
    };
    const fuzzyMatch = (keyword, ...fields) => {
      const normalizedKeyword = keyword.trim().toLowerCase();
      const text = fields.filter((field) => field !== void 0 && field !== null).map((field) => String(field).toLowerCase()).join(" ");
      return text.includes(normalizedKeyword);
    };
    const runGlobalSearch = async () => {
      const keyword = searchKeyword.value.trim();
      if (!keyword) {
        clearSearchResults();
        return;
      }
      searchLoading.value = true;
      try {
        const [scenicRes, foodRes, noteRes, activityRes] = await Promise.all([
          api_content.scenicSpotApi.list({ pageNum: 1, pageSize: 200 }),
          api_content.foodApi.list({ pageNum: 1, pageSize: 200 }),
          api_content.travelNoteApi.list({ pageNum: 1, pageSize: 200 }),
          api_activity.activityApi.getList({ pageNum: 1, pageSize: 200 })
        ]);
        const scenicRows = scenicRes.statusCode === 200 && scenicRes.data.code === 200 ? extractRows(scenicRes.data.data) : [];
        const foodRows = foodRes.statusCode === 200 && foodRes.data.code === 200 ? extractRows(foodRes.data.data) : [];
        const noteRows = noteRes.statusCode === 200 && noteRes.data.code === 200 ? extractRows(noteRes.data.data) : [];
        const activityRows = activityRes.statusCode === 200 && activityRes.data.code === 200 ? extractRows(activityRes.data.data) : [];
        searchScenicResults.value = scenicRows.filter((item) => fuzzyMatch(keyword, item.name, item.address, item.city, item.intro)).slice(0, 8);
        searchFoodResults.value = foodRows.filter((item) => fuzzyMatch(keyword, item.name, item.address, item.foodType)).slice(0, 8);
        searchNoteResults.value = noteRows.filter((item) => fuzzyMatch(keyword, item.title, item.content, item.authorName, item.cityName)).slice(0, 8);
        searchActivityResults.value = activityRows.filter((item) => fuzzyMatch(keyword, item.name, item.highlight, item.description)).slice(0, 8);
      } catch (error) {
        clearSearchResults();
        common_vendor.index.showToast({
          title: "\u641C\u7D22\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",
          icon: "none"
        });
      } finally {
        searchLoading.value = false;
      }
    };
    const onFeatureTouchStart = (id) => {
      activeFeatureId.value = id;
    };
    const onFeatureTouchEnd = () => {
      activeFeatureId.value = null;
    };
    const onFeatureClick = (item) => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
        return;
      }
      lastClickTime = now;
      if (item.type === "planner") {
        utils_router.safeSwitchTab("/pages/route/plan").catch(() => {
          common_vendor.index.showToast({
            title: "\u8DF3\u8F6C\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5",
            icon: "none"
          });
        });
      } else if (item.type === "hot-routes") {
        utils_router.safeNavigateTo("/pages/route/hot-routes").catch(() => {
          common_vendor.index.showToast({
            title: "\u8DF3\u8F6C\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5",
            icon: "none"
          });
        });
      } else if (item.type === "interest") {
        utils_router.safeNavigateTo("/pages/recommend/interest").catch(() => {
          common_vendor.index.showToast({
            title: "\u8DF3\u8F6C\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5",
            icon: "none"
          });
        });
      }
    };
    let lastClickTime = 0;
    const CLICK_DEBOUNCE_TIME = 300;
    const onViewRoute = (route) => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
        return;
      }
      lastClickTime = now;
      if (!route || !route.id) {
        return;
      }
      utils_router.safeNavigateTo(`/pages/itinerary/itinerary-detail?id=${route.id}`).catch(() => {
        common_vendor.index.showToast({
          title: "\u8DF3\u8F6C\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5",
          icon: "none"
        });
      });
    };
    const viewAuthorProfile = (note) => {
      const userId = note.userId || note.authorId || note.user_id;
      if (userId) {
        common_vendor.index.navigateTo({ url: `/pages/profile/user-home?userId=${userId}` });
      } else {
        common_vendor.index.showToast({ title: "\u65E0\u6CD5\u83B7\u53D6\u7528\u6237\u4FE1\u606F", icon: "none" });
      }
    };
    const onViewNote = (note) => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
        return;
      }
      lastClickTime = now;
      if (!note || !note.id) {
        return;
      }
      utils_router.safeNavigateTo(`/pages/travel-note/detail?id=${note.id}`).catch(() => {
        common_vendor.index.showToast({
          title: "\u8DF3\u8F6C\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5",
          icon: "none"
        });
      });
    };
    const showLoginPromptDialog = () => {
      common_vendor.index.showModal({
        title: "\u9700\u8981\u767B\u5F55",
        content: "\u8BF7\u5148\u767B\u5F55",
        confirmText: "\u53BB\u767B\u5F55",
        cancelText: "\u53D6\u6D88",
        success: (res) => {
          if (res.confirm) {
            utils_router.safeSwitchTab("/pages/profile/profile");
          }
        }
      });
    };
    const handleLoginConfirm = () => {
      showLoginPrompt.value = false;
    };
    const handleLoginCancel = () => {
      showLoginPrompt.value = false;
    };
    const toggleLike = async (note) => {
      if (!user.value) {
        showLoginPromptDialog();
        return;
      }
      try {
        const wasLiked = note.isLiked;
        note.isLiked = !wasLiked;
        if (!wasLiked) {
          note.likeCount = (note.likeCount || 0) + 1;
          shouldAnimateMap.value[note.id] = true;
          setTimeout(() => {
            shouldAnimateMap.value[note.id] = false;
          }, 300);
        } else {
          note.likeCount = Math.max(0, (note.likeCount || 0) - 1);
        }
        const res = await api_content.travelNoteInteractionApi.toggleLike(user.value.id, note.id);
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          note.isLiked = data.data.isLiked;
          if (data.data.likeCount !== void 0) {
            note.likeCount = data.data.likeCount;
          }
        } else {
          note.isLiked = wasLiked;
          note.likeCount = wasLiked ? (note.likeCount || 0) + 1 : Math.max(0, (note.likeCount || 0) - 1);
          common_vendor.index.showToast({
            title: data.msg || "\u64CD\u4F5C\u5931\u8D25",
            icon: "none"
          });
        }
      } catch (error) {
        note.isLiked = !note.isLiked;
        note.likeCount = note.isLiked ? (note.likeCount || 0) + 1 : Math.max(0, (note.likeCount || 0) - 1);
        common_vendor.index.showToast({
          title: (error == null ? void 0 : error.message) || "\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC",
          icon: "none"
        });
      }
    };
    const handleComment = (note) => {
      if (!user.value) {
        showLoginPromptDialog();
        return;
      }
      utils_router.safeNavigateTo(`/pages/travel-note/detail?id=${note.id}&tab=comment`);
    };
    const onViewScenic = async (item) => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
        return;
      }
      lastClickTime = now;
      if (!item || !item.id) {
        return;
      }
      utils_router.safeNavigateTo(`/pages/scenic/detail?id=${item.id}`).catch(() => {
        common_vendor.index.showToast({
          title: "\u8DF3\u8F6C\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5",
          icon: "none"
        });
      });
      api_content.scenicSpotApi.incrementHotScore(item.id).catch(() => {
      });
    };
    const onViewFood = (item) => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
        return;
      }
      lastClickTime = now;
      if (!item || !item.id) {
        return;
      }
      utils_router.safeNavigateTo(`/pages/food/detail?id=${item.id}`).catch(() => {
        common_vendor.index.showToast({
          title: "\u8DF3\u8F6C\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5",
          icon: "none"
        });
      });
    };
    const onViewActivity = (item) => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
        return;
      }
      lastClickTime = now;
      if (!item || !item.id)
        return;
      utils_router.safeNavigateTo(`/pages/activity/detail?id=${item.id}`).catch(() => {
        common_vendor.index.showToast({
          title: "\u8DF3\u8F6C\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5",
          icon: "none"
        });
      });
    };
    const fetchHomeData = async (priority = "high") => {
      var _a, _b;
      if (loadingRecommend.value)
        return;
      loadingRecommend.value = true;
      const toastFail = (msg) => common_vendor.index.showToast({ title: msg, icon: "none" });
      try {
        const provinceValue = selectedProvince.value && selectedProvince.value !== "\u5168\u90E8\u7701\u4EFD" ? (_a = provinceList.value[selectedProvinceIndex.value]) == null ? void 0 : _a.value : void 0;
        const scenicParams = { limit: 3 };
        const foodParams = { limit: 6 };
        if (currentCityId.value) {
          scenicParams.cityId = currentCityId.value;
          foodParams.cityId = currentCityId.value;
        }
        if (provinceValue && provinceValue !== "") {
          scenicParams.province = provinceValue;
          foodParams.province = provinceValue;
        }
        if (priority === "high") {
          const [routeRes, scenicRes] = await Promise.all([
            api_content.recommendApi.routes(void 0, 10),
            utils_http.request({
              url: "/recommend/scenic-spots",
              method: "GET",
              data: scenicParams,
              showLoading: false
            })
          ]);
          if (routeRes.statusCode === 200 && routeRes.data.code === 200) {
            routeList.value = routeRes.data.data || [];
          } else {
            toastFail(routeRes.data.msg || "\u63A8\u8350\u7EBF\u8DEF\u52A0\u8F7D\u5931\u8D25");
          }
          if (scenicRes.statusCode === 200 && scenicRes.data.code === 200) {
            scenicList.value = scenicRes.data.data || [];
          }
          setTimeout(() => {
            fetchFoodData(foodParams, toastFail);
          }, 300);
        } else {
          const [routeRes, scenicRes, foodRes] = await Promise.all([
            api_content.recommendApi.routes(void 0, 10),
            utils_http.request({
              url: "/recommend/scenic-spots",
              method: "GET",
              data: scenicParams,
              showLoading: false
            }),
            utils_http.request({
              url: "/recommend/foods",
              method: "GET",
              data: foodParams,
              showLoading: false
            })
          ]);
          if (routeRes.statusCode === 200 && routeRes.data.code === 200) {
            routeList.value = routeRes.data.data || [];
          } else {
            toastFail(routeRes.data.msg || "\u63A8\u8350\u7EBF\u8DEF\u52A0\u8F7D\u5931\u8D25");
          }
          if (scenicRes.statusCode === 200 && scenicRes.data.code === 200) {
            scenicList.value = scenicRes.data.data || [];
          }
          if (foodRes.statusCode === 200 && foodRes.data.code === 200) {
            foodList.value = foodRes.data.data || [];
          } else {
            toastFail(((_b = foodRes.data) == null ? void 0 : _b.msg) || "\u63A8\u8350\u7F8E\u98DF\u52A0\u8F7D\u5931\u8D25");
          }
        }
      } catch (error) {
        toastFail("\u9996\u9875\u63A8\u8350\u52A0\u8F7D\u5931\u8D25");
      } finally {
        loadingRecommend.value = false;
      }
    };
    const fetchFoodData = async (foodParams, toastFail) => {
      var _a;
      try {
        const foodRes = await utils_http.request({
          url: "/recommend/foods",
          method: "GET",
          data: foodParams,
          showLoading: false
        });
        if (foodRes.statusCode === 200 && foodRes.data.code === 200) {
          foodList.value = foodRes.data.data || [];
        } else {
          toastFail(((_a = foodRes.data) == null ? void 0 : _a.msg) || "\u63A8\u8350\u7F8E\u98DF\u52A0\u8F7D\u5931\u8D25");
        }
      } catch (error) {
      }
    };
    const loadNotes = async (reset = false) => {
      var _a, _b;
      if (loadingNotes.value || noteFinished.value)
        return;
      loadingNotes.value = true;
      if (reset) {
        notePage.value = 1;
        noteFinished.value = false;
      }
      try {
        const res = await api_content.travelNoteApi.list({ pageNum: notePage.value, pageSize: 6 });
        const data = res.data;
        if (res.statusCode === 200 && data.code === 200) {
          const rows = ((_a = data.data) == null ? void 0 : _a.rows) || ((_b = data.data) == null ? void 0 : _b.list) || data.data || [];
          const processedRows = rows.map((item) => ({
            ...item,
            isLiked: item.isLiked || false,
            commentCount: item.commentCount !== void 0 ? item.commentCount : item.comment_count || 0
          }));
          noteList.value = notePage.value === 1 ? processedRows : noteList.value.concat(processedRows);
          if (rows.length < 6)
            noteFinished.value = true;
          notePage.value += 1;
        }
      } finally {
        loadingNotes.value = false;
      }
    };
    const handleNoteCommentCountUpdate = (event) => {
      const note = noteList.value.find((n) => n.id === event.noteId);
      if (note) {
        note.commentCount = event.commentCount;
      }
    };
    common_vendor.onLoad(() => {
      utils_router.resetNavigationState();
    });
    common_vendor.onMounted(async () => {
      await locateCurrentCity();
      fetchHomeData("high");
      loadNotes(true);
      utils_tabPreload.preloadTabData();
      isInitialLoad.value = false;
      lastRefreshTime.value = Date.now();
      common_vendor.index.$on("noteCommentCountUpdated", handleNoteCommentCountUpdate);
    });
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("noteCommentCountUpdated", handleNoteCommentCountUpdate);
      if (searchTimer) {
        clearTimeout(searchTimer);
        searchTimer = null;
      }
    });
    common_vendor.onShow(() => {
      const now = Date.now();
      if (!isInitialLoad.value && now - lastRefreshTime.value < 5e3) {
        return;
      }
      if (noteList.value.length > 0) {
        loadNotes(true);
      }
      lastRefreshTime.value = now;
    });
    common_vendor.onPullDownRefresh(async () => {
      await locateCurrentCity();
      await fetchHomeData("low");
      await loadNotes(true);
      lastRefreshTime.value = Date.now();
      common_vendor.index.stopPullDownRefresh();
    });
    common_vendor.onReachBottom(() => {
      if (isSearching.value)
        return;
      loadNotes();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(handleLoginConfirm),
        b: common_vendor.o(handleLoginCancel),
        c: common_vendor.p({
          visible: showLoginPrompt.value
        }),
        d: common_vendor.p({
          theme: "outline",
          size: "28",
          fill: "#5f6c7b"
        }),
        e: searchPlaceholder,
        f: common_vendor.o([($event) => searchKeyword.value = $event.detail.value, onSearchInput]),
        g: common_vendor.o(onSearchConfirm),
        h: searchKeyword.value,
        i: common_vendor.o(onSearchClick),
        j: common_vendor.unref(isSearching)
      }, common_vendor.unref(isSearching) ? common_vendor.e({
        k: common_vendor.t(searchKeyword.value.trim()),
        l: searchLoading.value
      }, searchLoading.value ? {} : !common_vendor.unref(hasSearchResult) ? {} : common_vendor.e({
        n: searchScenicResults.value.length
      }, searchScenicResults.value.length ? {
        o: common_vendor.f(searchScenicResults.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.name),
            b: common_vendor.t(item.address || item.city || "\u666F\u70B9"),
            c: `s-${item.id}`,
            d: common_vendor.o(($event) => onViewScenic(item))
          };
        })
      } : {}, {
        p: searchFoodResults.value.length
      }, searchFoodResults.value.length ? {
        q: common_vendor.f(searchFoodResults.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.name),
            b: common_vendor.t(item.address || item.foodType || "\u7F8E\u98DF"),
            c: `f-${item.id}`,
            d: common_vendor.o(($event) => onViewFood(item))
          };
        })
      } : {}, {
        r: searchNoteResults.value.length
      }, searchNoteResults.value.length ? {
        s: common_vendor.f(searchNoteResults.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.title),
            b: common_vendor.t(item.authorName || "\u533F\u540D\u4F5C\u8005"),
            c: `n-${item.id}`,
            d: common_vendor.o(($event) => onViewNote(item))
          };
        })
      } : {}, {
        t: searchActivityResults.value.length
      }, searchActivityResults.value.length ? {
        v: common_vendor.f(searchActivityResults.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.name),
            b: common_vendor.t(item.highlight || "\u6D3B\u52A8\u8BE6\u60C5"),
            c: `a-${item.id}`,
            d: common_vendor.o(($event) => onViewActivity(item))
          };
        })
      } : {}), {
        m: !common_vendor.unref(hasSearchResult)
      }) : {}, {
        w: !common_vendor.unref(isSearching)
      }, !common_vendor.unref(isSearching) ? {
        x: common_vendor.f(featureEntries.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.text),
            b: common_vendor.t(item.title),
            c: item.id,
            d: activeFeatureId.value === item.id ? 1 : "",
            e: common_vendor.o(($event) => onFeatureTouchStart(item.id)),
            f: common_vendor.o(($event) => onFeatureClick(item))
          };
        }),
        y: common_vendor.o(onFeatureTouchEnd)
      } : {}, {
        z: !common_vendor.unref(isSearching)
      }, !common_vendor.unref(isSearching) ? {
        A: common_vendor.t(common_vendor.unref(selectedProvince) || "\u5168\u90E8\u7701\u4EFD"),
        B: provinceList.value,
        C: selectedProvinceIndex.value,
        D: common_vendor.o(onProvinceChange),
        E: common_vendor.f(common_vendor.unref(filteredScenicList), (item, k0, i0) => {
          return common_vendor.e({
            a: item.imageUrl ? common_vendor.unref(utils_image.getImageUrl)(item.imageUrl) : common_vendor.unref(utils_config.defaultScenicImage),
            b: common_vendor.t(item.name),
            c: common_vendor.t(item.address || item.city || "\u672A\u77E5\u5730\u70B9"),
            d: common_vendor.t(item.price && item.price > 0 ? `\xA5${item.price}` : "\u514D\u8D39"),
            e: !item.price || item.price === 0 ? 1 : "",
            f: (!item.price || item.price === 0) && item.freeNotice
          }, (!item.price || item.price === 0) && item.freeNotice ? {
            g: common_vendor.t(item.freeNotice)
          } : {}, {
            h: item.isWorldHeritage
          }, item.isWorldHeritage ? {} : {}, {
            i: item.openTime || item.suggestedVisitTime
          }, item.openTime || item.suggestedVisitTime ? common_vendor.e({
            j: item.openTime
          }, item.openTime ? {
            k: common_vendor.t(item.openTime)
          } : {}, {
            l: item.openTime && item.suggestedVisitTime
          }, item.openTime && item.suggestedVisitTime ? {} : {}, {
            m: item.suggestedVisitTime
          }, item.suggestedVisitTime ? {
            n: common_vendor.t(item.suggestedVisitTime)
          } : {}) : {}, {
            o: item.isMatchUserRoute
          }, item.isMatchUserRoute ? {} : {}, {
            p: item.tags && item.tags.length > 0
          }, item.tags && item.tags.length > 0 ? {
            q: common_vendor.f(item.tags, (tag, k1, i1) => {
              return {
                a: common_vendor.t(tag),
                b: tag
              };
            })
          } : {}, {
            r: item.id,
            s: common_vendor.o(($event) => onViewScenic(item))
          });
        })
      } : {}, {
        F: !common_vendor.unref(isSearching)
      }, !common_vendor.unref(isSearching) ? common_vendor.e({
        G: loadingRecommend.value
      }, loadingRecommend.value ? {
        H: common_vendor.p({
          count: 4
        })
      } : {
        I: common_vendor.f(routeList.value.slice(0, 4), (route, k0, i0) => {
          return {
            a: route.coverImage ? common_vendor.unref(utils_image.getImageUrl)(route.coverImage) : defaultRouteImage,
            b: common_vendor.t(route.days),
            c: common_vendor.t(route.routeName),
            d: common_vendor.t(route.summary || "\u70B9\u51FB\u67E5\u770B\u7EBF\u8DEF\u8BE6\u60C5"),
            e: route.id,
            f: common_vendor.o(($event) => onViewRoute(route))
          };
        })
      }) : {}, {
        J: !common_vendor.unref(isSearching)
      }, !common_vendor.unref(isSearching) ? common_vendor.e({
        K: loadingNotes.value
      }, loadingNotes.value ? {
        L: common_vendor.p({
          count: 2
        })
      } : common_vendor.e({
        M: common_vendor.f(noteList.value, (note, k0, i0) => {
          return {
            a: note.coverImage ? common_vendor.unref(utils_image.getImageUrl)(note.coverImage) : defaultNoteImage,
            b: common_vendor.unref(utils_image.getImageUrl)(note.authorAvatar),
            c: common_vendor.t(note.authorName || "\u533F\u540D\u7528\u6237"),
            d: common_vendor.o(($event) => viewAuthorProfile(note)),
            e: common_vendor.t(note.title),
            f: common_vendor.n({
              "icon-liked": note.isLiked
            }),
            g: note.isLiked && shouldAnimateMap.value[note.id] ? 1 : "",
            h: common_vendor.t(note.likeCount || 0),
            i: note.isLiked ? 1 : "",
            j: common_vendor.o(($event) => toggleLike(note)),
            k: common_vendor.t(note.commentCount || 0),
            l: common_vendor.o(($event) => handleComment(note)),
            m: note.id,
            n: common_vendor.o(($event) => onViewNote(note))
          };
        }),
        N: !noteList.value.length
      }, !noteList.value.length ? {
        O: common_vendor.o(onSearchClick),
        P: common_vendor.p({
          text: "\u6682\u65E0\u6E38\u8BB0",
          ["btn-text"]: "\u53BB\u641C\u7D22"
        })
      } : {})) : {}, {
        Q: !common_vendor.unref(isSearching)
      }, !common_vendor.unref(isSearching) ? {
        R: common_vendor.f(foodList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: item.imageUrl ? common_vendor.unref(utils_image.getImageUrl)(item.imageUrl) : common_vendor.unref(utils_config.defaultFoodImage),
            b: common_vendor.t(item.name),
            c: item.avgPrice
          }, item.avgPrice ? {
            d: common_vendor.t(item.avgPrice)
          } : {}, {
            e: common_vendor.t(item.address || "\u5730\u5740\u672A\u77E5"),
            f: item.score
          }, item.score ? {
            g: common_vendor.t(item.score)
          } : {}, {
            h: item.id,
            i: common_vendor.o(($event) => onViewFood(item))
          });
        })
      } : {}, {
        S: scrollTop.value,
        T: common_vendor.o(onScroll),
        U: showBackToTop.value ? 1 : "",
        V: common_vendor.o(scrollToTop)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-087d42bb"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/home/home.vue"]]);
wx.createPage(MiniProgramPage);
