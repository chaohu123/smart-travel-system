"use strict";
var utils_http = require("../utils/http.js");
const recommendApi = {
  routes: (userId, limit = 10) => {
    return utils_http.request({
      url: "/recommend/routes",
      method: "GET",
      data: { userId, limit },
      showLoading: false
    });
  },
  travelNotes: (userId, limit = 10) => {
    return utils_http.request({
      url: "/recommend/travel-notes",
      method: "GET",
      data: { userId, limit },
      showLoading: false
    });
  },
  scenicSpots: (userId, cityId, limit = 3, province) => {
    return utils_http.request({
      url: "/recommend/scenic-spots",
      method: "GET",
      data: { userId, cityId, limit, province },
      showLoading: false
    });
  },
  foods: (userId, cityId, limit = 10, province) => {
    return utils_http.request({
      url: "/recommend/foods",
      method: "GET",
      data: { userId, cityId, limit, province },
      showLoading: false
    });
  }
};
const scenicSpotApi = {
  list: (params) => {
    return utils_http.request({
      url: "/scenic/list",
      method: "GET",
      data: params || {},
      showLoading: false
    });
  },
  getDetail: (id) => {
    return utils_http.request({
      url: `/scenic/${id}`,
      method: "GET",
      showLoading: true
    });
  },
  getHot: (cityId, limit = 10) => {
    return utils_http.request({
      url: "/scenic/hot",
      method: "GET",
      data: { cityId, limit },
      showLoading: false
    });
  },
  incrementHotScore: (id) => {
    return utils_http.request({
      url: `/scenic/${id}/increment-hot`,
      method: "POST",
      showLoading: false,
      needAuth: false
    });
  }
};
const travelNoteApi = {
  list: (params) => {
    return utils_http.request({
      url: "/travel/note/list",
      method: "GET",
      data: params || {},
      showLoading: false
    });
  },
  getDetail: (id, userId) => {
    return utils_http.request({
      url: `/travel/note/${id}`,
      method: "GET",
      data: { userId },
      showLoading: true
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
  },
  listMyFavorites: (userId, pageNum = 1, pageSize = 10) => {
    return utils_http.request({
      url: "/travel/note/my/favorites",
      method: "GET",
      data: { userId, pageNum, pageSize },
      needAuth: true
    });
  },
  listMyNotes: (userId, pageNum = 1, pageSize = 10) => {
    return utils_http.request({
      url: "/travel/note/my/list",
      method: "GET",
      data: { userId, pageNum, pageSize },
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
      needAuth: true
    });
  },
  toggleFavorite: (userId, noteId) => {
    return utils_http.request({
      url: "/travel/note/interaction/favorite",
      method: "POST",
      data: { userId, noteId },
      needAuth: true
    });
  },
  publishComment: (data) => {
    return utils_http.request({
      url: "/travel/note/interaction/comment",
      method: "POST",
      data,
      needAuth: true
    });
  },
  listComments: (params) => {
    return utils_http.request({
      url: "/travel/note/interaction/comment/list",
      method: "GET",
      data: params,
      showLoading: false
    });
  }
};
const foodApi = {
  list: (params) => {
    return utils_http.request({
      url: "/food/list",
      method: "GET",
      data: params || {},
      showLoading: false
    });
  },
  getDetail: (id) => {
    return utils_http.request({
      url: `/food/${id}`,
      method: "GET",
      showLoading: true
    });
  },
  getHot: (cityId, limit = 10) => {
    return utils_http.request({
      url: "/food/hot",
      method: "GET",
      data: { cityId, limit },
      showLoading: false
    });
  }
};
const cityApi = {
  list: () => {
    return utils_http.request({
      url: "/city/list",
      method: "GET",
      showLoading: false
    });
  }
};
const tagApi = {
  list: () => {
    return utils_http.request({
      url: "/tag/list",
      method: "GET",
      showLoading: false
    });
  }
};
const uploadApi = {
  upload: (filePath) => {
    return utils_http.uploadFile("/upload/image", filePath);
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
