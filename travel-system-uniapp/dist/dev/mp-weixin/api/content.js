"use strict";
var utils_http = require("../utils/http.js");
const filterParams = (params) => {
  const filtered = {};
  for (const key in params) {
    if (params[key] !== void 0 && params[key] !== null) {
      filtered[key] = params[key];
    }
  }
  return filtered;
};
const travelNoteApi = {
  list: (params) => {
    return utils_http.request({
      url: "/travel/note/list",
      method: "GET",
      data: filterParams(params),
      needRetry: true
    });
  },
  getDetail: (id, userId) => {
    return utils_http.request({
      url: `/travel/note/${id}`,
      method: "GET",
      data: filterParams({ userId })
    });
  },
  publish: (data) => {
    return utils_http.request({
      url: "/travel/note",
      method: "POST",
      data,
      needAuth: true
    });
  },
  update: (id, data) => {
    return utils_http.request({
      url: `/travel/note/${id}`,
      method: "PUT",
      data,
      needAuth: true
    });
  },
  delete: (id, userId) => {
    return utils_http.request({
      url: `/travel/note/${id}`,
      method: "DELETE",
      data: { userId },
      needAuth: true
    });
  }
};
const travelNoteInteractionApi = {
  toggleLike: (userId, noteId) => {
    return utils_http.request({
      url: "/travel/note/interaction/like",
      method: "POST",
      data: { userId, noteId },
      needAuth: true,
      showLoading: false
    });
  },
  toggleFavorite: (userId, noteId) => {
    return utils_http.request({
      url: "/travel/note/interaction/favorite",
      method: "POST",
      data: { userId, noteId },
      needAuth: true,
      showLoading: false
    });
  },
  publishComment: (data) => {
    return utils_http.request({
      url: "/travel/note/interaction/comment",
      method: "POST",
      data,
      needAuth: true,
      showLoading: true
    });
  },
  listComments: (params) => {
    return utils_http.request({
      url: "/travel/note/interaction/comment/list",
      method: "GET",
      data: filterParams(params)
    });
  }
};
const scenicSpotApi = {
  list: (params) => {
    return utils_http.request({
      url: "/scenic/list",
      method: "GET",
      data: filterParams(params)
    });
  },
  getDetail: (id) => {
    return utils_http.request({
      url: `/scenic/${id}`,
      method: "GET"
    });
  },
  getHot: (cityId, limit) => {
    return utils_http.request({
      url: "/scenic/hot",
      method: "GET",
      data: filterParams({ cityId, limit })
    });
  },
  incrementHotScore: (id) => {
    return utils_http.request({
      url: `/scenic/${id}/increment-hot`,
      method: "POST"
    });
  }
};
const foodApi = {
  list: (params) => {
    return utils_http.request({
      url: "/food/list",
      method: "GET",
      data: filterParams(params)
    });
  },
  getDetail: (id) => {
    return utils_http.request({
      url: `/food/${id}`,
      method: "GET"
    });
  },
  getHot: (cityId, limit) => {
    return utils_http.request({
      url: "/food/hot",
      method: "GET",
      data: filterParams({ cityId, limit })
    });
  }
};
const cityApi = {
  list: () => {
    return utils_http.request({
      url: "/city/list",
      method: "GET"
    });
  }
};
const recommendApi = {
  routes: (userId, limit, cityId) => {
    return utils_http.request({
      url: "/recommend/routes",
      method: "GET",
      data: filterParams({ userId, limit, cityId }),
      needRetry: true
    });
  },
  travelNotes: (userId, limit) => {
    return utils_http.request({
      url: "/recommend/travel-notes",
      method: "GET",
      data: filterParams({ userId, limit }),
      needRetry: true
    });
  },
  scenicSpots: (userId, cityId, limit, province) => {
    return utils_http.request({
      url: "/recommend/scenic-spots",
      method: "GET",
      data: filterParams({ userId, cityId, limit, province }),
      needRetry: true
    });
  },
  foods: (userId, cityId, limit) => {
    return utils_http.request({
      url: "/recommend/foods",
      method: "GET",
      data: filterParams({ userId, cityId, limit }),
      needRetry: true
    });
  }
};
const tagApi = {
  list: () => {
    return utils_http.request({
      url: "/tag/list",
      method: "GET"
    });
  }
};
const uploadApi = {
  upload: (filePath) => {
    return utils_http.uploadFile("/upload", filePath);
  }
};
exports.cityApi = cityApi;
exports.foodApi = foodApi;
exports.recommendApi = recommendApi;
exports.scenicSpotApi = scenicSpotApi;
exports.tagApi = tagApi;
exports.travelNoteApi = travelNoteApi;
exports.travelNoteInteractionApi = travelNoteInteractionApi;
exports.uploadApi = uploadApi;
