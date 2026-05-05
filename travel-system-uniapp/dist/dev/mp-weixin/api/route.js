"use strict";
var utils_http = require("../utils/http.js");
const routeApi = {
  generate: (data) => {
    return utils_http.request({
      url: "/route/generate",
      method: "POST",
      data,
      needAuth: true,
      showLoading: false,
      timeout: 12e4
    });
  },
  getDetail: (id) => {
    return utils_http.request({
      url: `/route/${id}`,
      method: "GET",
      showLoading: false
    });
  },
  recordView: (id) => {
    return utils_http.request({
      url: `/route/${id}/view`,
      method: "POST",
      showLoading: false
    });
  },
  toggleFavorite: (userId, routeId) => {
    return utils_http.request({
      url: "/route/favorite",
      method: "POST",
      data: { userId, routeId },
      needAuth: true
    });
  },
  listMyRoutes: (userId) => {
    return utils_http.request({
      url: "/route/my",
      method: "GET",
      data: { userId },
      needAuth: true
    });
  },
  updateName: (routeId, routeName) => {
    return utils_http.request({
      url: `/route/${routeId}/name`,
      method: "PUT",
      data: { routeName },
      needAuth: true,
      showLoading: false
    });
  },
  discard: (routeId) => {
    return utils_http.request({
      url: `/route/${routeId}`,
      method: "DELETE",
      needAuth: true,
      showLoading: false
    });
  }
};
exports.routeApi = routeApi;
