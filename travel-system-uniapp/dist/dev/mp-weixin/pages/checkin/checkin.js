"use strict";
var common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _component_LocalPin = common_vendor.resolveComponent("LocalPin");
  const _component_KnifeFork = common_vendor.resolveComponent("KnifeFork");
  const _component_CloseSmall = common_vendor.resolveComponent("CloseSmall");
  const _component_Add = common_vendor.resolveComponent("Add");
  (_component_LocalPin + _component_KnifeFork + _component_CloseSmall + _component_Add)();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const activeTab = common_vendor.ref("attraction");
    const checkinList = common_vendor.ref([]);
    common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const noMore = common_vendor.ref(false);
    const showModal = common_vendor.ref(false);
    const currentItem = common_vendor.ref(null);
    const uploadImages = common_vendor.ref([]);
    const checkinComment = common_vendor.ref("");
    const locationOk = common_vendor.ref(false);
    const locationMsg = common_vendor.ref("");
    const mockAttractions = [
      {
        id: 1,
        name: "\u5BBD\u7A84\u5DF7\u5B50",
        cover: "https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800",
        location: "\u6210\u90FD\u5E02\u9752\u7F8A\u533A",
        checkinCount: 1234,
        type: "attraction"
      },
      {
        id: 2,
        name: "\u9526\u91CC\u53E4\u8857",
        cover: "https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=800",
        location: "\u6210\u90FD\u5E02\u6B66\u4FAF\u533A",
        checkinCount: 987,
        type: "attraction"
      },
      {
        id: 3,
        name: "\u5927\u718A\u732B\u57FA\u5730",
        cover: "https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=800",
        location: "\u6210\u90FD\u5E02\u6210\u534E\u533A",
        checkinCount: 2156,
        type: "attraction"
      }
    ];
    const mockFoods = [
      {
        id: 101,
        name: "\u706B\u9505",
        cover: "https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800",
        location: "\u6210\u90FD\u5404\u5927\u5546\u5708",
        checkinCount: 3456,
        type: "food"
      },
      {
        id: 102,
        name: "\u4E32\u4E32\u9999",
        cover: "https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=800",
        location: "\u6210\u90FD\u5404\u5927\u5546\u5708",
        checkinCount: 2890,
        type: "food"
      },
      {
        id: 103,
        name: "\u62C5\u62C5\u9762",
        cover: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=800",
        location: "\u6210\u90FD\u5404\u5927\u5546\u5708",
        checkinCount: 1876,
        type: "food"
      }
    ];
    const switchTab = (tab) => {
      activeTab.value = tab;
      checkinList.value = [];
      noMore.value = false;
      loadCheckinList();
    };
    const loadCheckinList = () => {
      setTimeout(() => {
        checkinList.value = activeTab.value === "attraction" ? mockAttractions : mockFoods;
      }, 300);
    };
    const loadMore = () => {
      if (loading.value || noMore.value)
        return;
    };
    const viewDetail = (item) => {
      console.log("\u67E5\u770B\u8BE6\u60C5\uFF1A", item.id);
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
      closeModal();
      loadCheckinList();
    };
    common_vendor.onMounted(() => {
      loadCheckinList();
    });
    const ensureLocation = () => {
      common_vendor.index.getLocation({
        type: "gcj02",
        success: () => {
          locationOk.value = true;
          locationMsg.value = "";
        },
        fail: () => {
          locationOk.value = false;
          locationMsg.value = "\u5B9A\u4F4D\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u6216\u6388\u6743\u5B9A\u4F4D";
        }
      });
    };
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: common_vendor.p({
          theme: "outline",
          size: "28",
          fill: "#3ba272"
        }),
        b: activeTab.value === "attraction" ? 1 : "",
        c: common_vendor.o(($event) => switchTab("attraction")),
        d: common_vendor.p({
          theme: "outline",
          size: "28",
          fill: "#f5a524"
        }),
        e: activeTab.value === "food" ? 1 : "",
        f: common_vendor.o(($event) => switchTab("food")),
        g: common_vendor.f(checkinList.value, (item, k0, i0) => {
          return {
            a: item.cover,
            b: common_vendor.t(item.name),
            c: "6e5fa1f7-2-" + i0,
            d: common_vendor.t(item.location),
            e: common_vendor.t(item.checkinCount),
            f: common_vendor.o(($event) => openCheckinModal(item)),
            g: item.id,
            h: common_vendor.o(($event) => viewDetail(item))
          };
        }),
        h: common_vendor.p({
          theme: "outline",
          size: "22",
          fill: "#3ba272"
        }),
        i: loading.value
      }, loading.value ? {} : {}, {
        j: noMore.value
      }, noMore.value ? {} : {}, {
        k: common_vendor.o(loadMore),
        l: showModal.value
      }, showModal.value ? common_vendor.e({
        m: common_vendor.t((_a = currentItem.value) == null ? void 0 : _a.name),
        n: common_vendor.o(closeModal),
        o: common_vendor.p({
          theme: "outline",
          size: "26",
          fill: "#8a94a3"
        }),
        p: locationMsg.value
      }, locationMsg.value ? {
        q: common_vendor.t(locationMsg.value)
      } : {}, {
        r: common_vendor.f(uploadImages.value, (img, index, i0) => {
          return {
            a: img,
            b: common_vendor.o(($event) => removeImage(index)),
            c: "6e5fa1f7-4-" + i0,
            d: index
          };
        }),
        s: common_vendor.p({
          theme: "outline",
          size: "24",
          fill: "#ffffff"
        }),
        t: uploadImages.value.length < 9
      }, uploadImages.value.length < 9 ? {
        v: common_vendor.p({
          theme: "outline",
          size: "28",
          fill: "#3ba272"
        }),
        w: common_vendor.o(chooseImage)
      } : {}, {
        x: checkinComment.value,
        y: common_vendor.o(($event) => checkinComment.value = $event.detail.value),
        z: common_vendor.t(checkinComment.value.length),
        A: common_vendor.o(submitCheckin),
        B: common_vendor.o(() => {
        }),
        C: common_vendor.o(closeModal)
      }) : {});
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6e5fa1f7"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/checkin/checkin.vue"]]);
wx.createPage(MiniProgramPage);
