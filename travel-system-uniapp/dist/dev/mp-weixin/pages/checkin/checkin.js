"use strict";
var common_vendor = require("../../common/vendor.js");
var api_activity = require("../../api/activity.js");
var utils_image = require("../../utils/image.js");
require("../../utils/http.js");
require("../../utils/storage.js");
require("../../utils/config.js");
if (!Math) {
  (common_vendor.unref(common_vendor.Search) + common_vendor.unref(common_vendor.CloseSmall) + common_vendor.unref(common_vendor.Filter) + common_vendor.unref(common_vendor.LocalPin) + common_vendor.unref(common_vendor.KnifeFork) + common_vendor.unref(common_vendor.Add))();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const activeTab = common_vendor.ref("attraction");
    const checkinList = common_vendor.ref([]);
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
        cover: "https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800",
        location: "\u6210\u90FD\u5E02\u9752\u7F8A\u533A",
        checkinCount: 1234,
        type: "attraction",
        tag: "hot",
        distance: "2.5km",
        latitude: 30.6624,
        longitude: 104.0633,
        isChecked: false
      },
      {
        id: 2,
        name: "\u9526\u91CC\u53E4\u8857",
        cover: "https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=800",
        location: "\u6210\u90FD\u5E02\u6B66\u4FAF\u533A",
        checkinCount: 987,
        type: "attraction",
        tag: "new",
        distance: "5.8km",
        latitude: 30.65,
        longitude: 104.05,
        isChecked: true
      },
      {
        id: 3,
        name: "\u5927\u718A\u732B\u57FA\u5730",
        cover: "https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=800",
        location: "\u6210\u90FD\u5E02\u6210\u534E\u533A",
        checkinCount: 2156,
        type: "attraction",
        distance: "12.3km",
        latitude: 30.74,
        longitude: 104.14,
        isChecked: false
      },
      {
        id: 4,
        name: "\u6B66\u4FAF\u7960",
        cover: "https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=800",
        location: "\u6210\u90FD\u5E02\u6B66\u4FAF\u533A",
        checkinCount: 1567,
        type: "attraction",
        tag: "hot",
        distance: "6.2km",
        latitude: 30.648,
        longitude: 104.048,
        isChecked: false
      }
    ];
    const mockFoods = [
      {
        id: 101,
        name: "\u706B\u9505",
        cover: "https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800",
        location: "\u6210\u90FD\u5404\u5927\u5546\u5708",
        checkinCount: 3456,
        type: "food",
        tag: "hot",
        distance: "1.2km",
        latitude: 30.6624,
        longitude: 104.0633,
        isChecked: false
      },
      {
        id: 102,
        name: "\u4E32\u4E32\u9999",
        cover: "https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=800",
        location: "\u6210\u90FD\u5404\u5927\u5546\u5708",
        checkinCount: 2890,
        type: "food",
        distance: "3.5km",
        latitude: 30.65,
        longitude: 104.05,
        isChecked: true
      },
      {
        id: 103,
        name: "\u62C5\u62C5\u9762",
        cover: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=800",
        location: "\u6210\u90FD\u5404\u5927\u5546\u5708",
        checkinCount: 1876,
        type: "food",
        tag: "new",
        distance: "4.8km",
        latitude: 30.64,
        longitude: 104.04,
        isChecked: false
      },
      {
        id: 104,
        name: "\u9EBB\u5A46\u8C46\u8150",
        cover: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=800",
        location: "\u6210\u90FD\u5404\u5927\u5546\u5708",
        checkinCount: 2345,
        type: "food",
        tag: "hot",
        distance: "2.1km",
        latitude: 30.67,
        longitude: 104.07,
        isChecked: false
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
    const getUserLocation = () => {
      common_vendor.index.getLocation({
        type: "gcj02",
        altitude: false,
        geocode: false,
        success: (res) => {
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
        },
        fail: (err) => {
          console.error("\u83B7\u53D6\u4F4D\u7F6E\u5931\u8D25:", err);
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
          common_vendor.index.showToast({
            title: errorMsg,
            icon: "none",
            duration: 2e3
          });
        }
      });
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
      return list;
    });
    const switchTab = (tab) => {
      activeTab.value = tab;
      checkinList.value = [];
      noMore.value = false;
      cardAnimate.value = false;
      searchKeyword.value = "";
      loadCheckinList();
    };
    const loadCheckinList = () => {
      loading.value = true;
      setTimeout(() => {
        checkinList.value = activeTab.value === "attraction" ? [...mockAttractions] : [...mockFoods];
        loading.value = false;
        cardAnimate.value = true;
        getUserLocation();
      }, 300);
    };
    const loadMore = () => {
      if (loading.value || noMore.value)
        return;
    };
    const viewDetail = (item) => {
      if (item.type === "attraction") {
        common_vendor.index.navigateTo({ url: `/pages/scenic/detail?id=${item.id}` });
      } else {
        common_vendor.index.navigateTo({ url: `/pages/food/detail?id=${item.id}` });
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
        console.error("\u52A0\u8F7D\u6D3B\u52A8\u5217\u8868\u5931\u8D25", error);
        activityList.value = [];
      }
    };
    const handleSearch = () => {
      console.log("\u641C\u7D22:", searchKeyword.value);
    };
    const clearSearch = () => {
      searchKeyword.value = "";
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
    const openCheckinModal = (item) => {
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
        count: 9 - uploadImages.value.length,
        success: (res) => {
          uploadImages.value.push(...res.tempFilePaths);
        }
      });
    };
    const removeImage = (index) => {
      uploadImages.value.splice(index, 1);
    };
    const submitCheckin = () => {
      if (!locationOk.value) {
        common_vendor.index.showToast({ title: "\u8BF7\u5148\u5F00\u542F\u5B9A\u4F4D\u6743\u9650", icon: "none" });
        return;
      }
      if (uploadImages.value.length === 0) {
        common_vendor.index.showToast({
          title: "\u8BF7\u81F3\u5C11\u4E0A\u4F20\u4E00\u5F20\u7167\u7247",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showToast({
        title: "\u6253\u5361\u6210\u529F",
        icon: "success"
      });
      if (currentItem.value) {
        const item = checkinList.value.find((i) => i.id === currentItem.value.id);
        if (item) {
          item.isChecked = true;
          item.checkinCount += 1;
        }
      }
      closeModal();
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
          console.error("\u5B9A\u4F4D\u5931\u8D25:", err);
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
        console.error("\u5237\u65B0\u5931\u8D25", error);
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
      loadCheckinList();
      getUserLocation();
      loadActivities();
    });
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: common_vendor.p({
          theme: "outline",
          size: "24",
          fill: "#9EA7B0"
        }),
        b: activeTab.value === "attraction" ? "\u641C\u7D22\u666F\u70B9..." : "\u641C\u7D22\u7F8E\u98DF...",
        c: common_vendor.o(handleSearch),
        d: searchKeyword.value,
        e: common_vendor.o(($event) => searchKeyword.value = $event.detail.value),
        f: searchKeyword.value
      }, searchKeyword.value ? {
        g: common_vendor.o(clearSearch),
        h: common_vendor.p({
          theme: "outline",
          size: "20",
          fill: "#9EA7B0"
        })
      } : {}, {
        i: common_vendor.p({
          theme: "outline",
          size: "24",
          fill: "#2FA66A"
        }),
        j: common_vendor.o(($event) => showFilterModal.value = true),
        k: activityList.value.length > 0
      }, activityList.value.length > 0 ? {
        l: common_vendor.f(activityList.value, (activity, k0, i0) => {
          return {
            a: common_vendor.unref(utils_image.getImageUrl)(activity.imageUrl) || "https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=800",
            b: common_vendor.t(activity.name),
            c: common_vendor.t(activity.highlight),
            d: activity.id,
            e: common_vendor.o(($event) => viewActivity(activity))
          };
        })
      } : {}, {
        m: common_vendor.p({
          theme: "outline",
          size: "28",
          fill: "#2FA66A"
        }),
        n: activeTab.value === "attraction" ? 1 : "",
        o: common_vendor.o(($event) => switchTab("attraction")),
        p: common_vendor.p({
          theme: "outline",
          size: "28",
          fill: "#2FA66A"
        }),
        q: activeTab.value === "food" ? 1 : "",
        r: common_vendor.o(($event) => switchTab("food")),
        s: common_vendor.f(common_vendor.unref(filteredList), (item, k0, i0) => {
          return common_vendor.e({
            a: item.cover,
            b: item.tag
          }, item.tag ? {
            c: common_vendor.t(item.tag === "hot" ? "\u70ED\u95E8" : item.tag === "new" ? "\u65B0" : ""),
            d: common_vendor.n(`tag-${item.tag}`)
          } : {}, {
            e: common_vendor.t(item.name),
            f: "6e5fa1f7-5-" + i0,
            g: common_vendor.t(item.location),
            h: common_vendor.t(item.checkinCount),
            i: item.distance
          }, item.distance ? {} : {}, {
            j: item.distance
          }, item.distance ? {
            k: common_vendor.t(item.distance)
          } : {}, {
            l: common_vendor.o(($event) => openCheckinModal(item)),
            m: item.id,
            n: common_vendor.o(($event) => viewDetail(item))
          });
        }),
        t: common_vendor.p({
          theme: "outline",
          size: "18",
          fill: "#9EA7B0"
        }),
        v: cardAnimate.value ? 1 : "",
        w: loading.value
      }, loading.value ? {} : {}, {
        x: noMore.value && common_vendor.unref(filteredList).length > 0
      }, noMore.value && common_vendor.unref(filteredList).length > 0 ? {} : {}, {
        y: !loading.value && common_vendor.unref(filteredList).length === 0
      }, !loading.value && common_vendor.unref(filteredList).length === 0 ? {} : {}, {
        z: common_vendor.o(loadMore),
        A: refreshing.value,
        B: common_vendor.o(onRefresh),
        C: showFilterModal.value
      }, showFilterModal.value ? {
        D: common_vendor.o(($event) => showFilterModal.value = false),
        E: common_vendor.p({
          theme: "outline",
          size: "24",
          fill: "#9EA7B0"
        }),
        F: common_vendor.f(sortOptions, (sort, k0, i0) => {
          return {
            a: common_vendor.t(sort.label),
            b: sort.value,
            c: currentSort.value === sort.value ? 1 : "",
            d: common_vendor.o(($event) => currentSort.value = sort.value)
          };
        }),
        G: common_vendor.f(filterOptions, (filter, k0, i0) => {
          return {
            a: common_vendor.t(filter.label),
            b: filter.value,
            c: activeFilters.value.includes(filter.value) ? 1 : "",
            d: common_vendor.o(($event) => toggleFilter(filter.value))
          };
        }),
        H: common_vendor.o(resetFilter),
        I: common_vendor.o(applyFilter),
        J: common_vendor.o(() => {
        }),
        K: common_vendor.o(($event) => showFilterModal.value = false)
      } : {}, {
        L: showModal.value
      }, showModal.value ? common_vendor.e({
        M: common_vendor.t((_a = currentItem.value) == null ? void 0 : _a.name),
        N: common_vendor.o(closeModal),
        O: common_vendor.p({
          theme: "outline",
          size: "26",
          fill: "#8a94a3"
        }),
        P: locationMsg.value
      }, locationMsg.value ? {
        Q: common_vendor.t(locationMsg.value)
      } : {}, {
        R: common_vendor.f(uploadImages.value, (img, index, i0) => {
          return {
            a: img,
            b: common_vendor.o(($event) => removeImage(index)),
            c: "6e5fa1f7-8-" + i0,
            d: index
          };
        }),
        S: common_vendor.p({
          theme: "outline",
          size: "24",
          fill: "#ffffff"
        }),
        T: uploadImages.value.length < 9
      }, uploadImages.value.length < 9 ? {
        U: common_vendor.p({
          theme: "outline",
          size: "28",
          fill: "#3ba272"
        }),
        V: common_vendor.o(chooseImage)
      } : {}, {
        W: checkinComment.value,
        X: common_vendor.o(($event) => checkinComment.value = $event.detail.value),
        Y: common_vendor.t(checkinComment.value.length),
        Z: common_vendor.o(submitCheckin),
        aa: common_vendor.o(() => {
        }),
        ab: common_vendor.o(closeModal)
      }) : {});
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6e5fa1f7"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/checkin/checkin.vue"]]);
wx.createPage(MiniProgramPage);
