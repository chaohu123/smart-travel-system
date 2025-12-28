"use strict";
var common_vendor = require("../../common/vendor.js");
var api_content = require("../../api/content.js");
require("../../utils/http.js");
require("../../utils/storage.js");
if (!Array) {
  const _component_Eyes = common_vendor.resolveComponent("Eyes");
  const _component_Like = common_vendor.resolveComponent("Like");
  (_component_Eyes + _component_Like)();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const cityList = common_vendor.ref([
      { id: null, name: "\u5168\u90E8\u57CE\u5E02" }
    ]);
    const selectedCity = common_vendor.ref(null);
    const sortBy = common_vendor.ref("hot");
    const noteList = common_vendor.ref([]);
    const pageNum = common_vendor.ref(1);
    const pageSize = common_vendor.ref(10);
    const loading = common_vendor.ref(false);
    const noMore = common_vendor.ref(false);
    const onCityChange = (e) => {
      selectedCity.value = cityList.value[e.detail.value];
      pageNum.value = 1;
      noteList.value = [];
      loadNotes();
    };
    const changeSort = (sort) => {
      sortBy.value = sort;
      pageNum.value = 1;
      noteList.value = [];
      loadNotes();
    };
    const loadNotes = async () => {
      var _a;
      if (loading.value || noMore.value)
        return;
      loading.value = true;
      try {
        const params = {
          pageNum: pageNum.value,
          pageSize: pageSize.value,
          sortBy: sortBy.value
        };
        if (((_a = selectedCity.value) == null ? void 0 : _a.id) != null) {
          params.cityId = selectedCity.value.id;
        }
        const res = await api_content.travelNoteApi.list(params);
        const response = res.data;
        if (res.statusCode === 200 && response.code === 200) {
          const data = response.data;
          if (data.list && data.list.length > 0) {
            noteList.value.push(...data.list);
            if (data.list.length < pageSize.value) {
              noMore.value = true;
            } else {
              pageNum.value++;
            }
          } else {
            noMore.value = true;
          }
        }
      } catch (error) {
        common_vendor.index.showToast({
          title: "\u52A0\u8F7D\u5931\u8D25",
          icon: "none"
        });
      } finally {
        loading.value = false;
      }
    };
    const loadMore = () => {
      loadNotes();
    };
    const viewDetail = (id) => {
      common_vendor.index.navigateTo({
        url: `/pages/travel-note/detail?id=${id}`
      });
    };
    const loadCities = async () => {
      try {
        const res = await api_content.cityApi.list();
        const response = res.data;
        if (res.statusCode === 200 && response.code === 200) {
          const cities = response.data || [];
          cityList.value = [
            { id: null, name: "\u5168\u90E8\u57CE\u5E02" },
            ...cities.map((city) => ({
              id: city.id,
              name: city.cityName || city.name
            }))
          ];
        }
      } catch (error) {
      }
    };
    common_vendor.onMounted(() => {
      loadCities().then(() => {
        selectedCity.value = cityList.value[0];
        loadNotes();
      });
    });
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: common_vendor.t(((_a = selectedCity.value) == null ? void 0 : _a.name) || "\u5168\u90E8\u57CE\u5E02"),
        b: cityList.value,
        c: common_vendor.o(onCityChange),
        d: sortBy.value === "hot" ? 1 : "",
        e: common_vendor.o(($event) => changeSort("hot")),
        f: sortBy.value === "time" ? 1 : "",
        g: common_vendor.o(($event) => changeSort("time")),
        h: common_vendor.f(noteList.value, (note, k0, i0) => {
          return common_vendor.e({
            a: note.coverImage
          }, note.coverImage ? {
            b: note.coverImage
          } : {}, {
            c: common_vendor.t(note.title),
            d: note.authorAvatar || "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200",
            e: common_vendor.t(note.authorName || "\u533F\u540D\u7528\u6237"),
            f: "7cadc62c-0-" + i0,
            g: common_vendor.t(note.viewCount || 0),
            h: "7cadc62c-1-" + i0,
            i: common_vendor.t(note.likeCount || 0),
            j: note.id,
            k: common_vendor.o(($event) => viewDetail(note.id))
          });
        }),
        i: common_vendor.p({
          theme: "outline",
          size: "26",
          fill: "#8a94a3"
        }),
        j: common_vendor.p({
          theme: "outline",
          size: "26",
          fill: "#3ba272"
        }),
        k: loading.value
      }, loading.value ? {} : {}, {
        l: noMore.value
      }, noMore.value ? {} : {}, {
        m: common_vendor.o(loadMore)
      });
    };
  }
});
var MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-7cadc62c"], ["__file", "D:/APPdalley/smart-travel-system/travel-system-uniapp/src/pages/travel-note/list.vue"]]);
wx.createPage(MiniProgramPage);
