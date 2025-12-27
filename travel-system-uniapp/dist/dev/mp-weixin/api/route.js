"use strict";
var utils_http = require("../utils/http.js");
const routeApi = {
  generate: (data) => {
    return utils_http.request({
      url: "/route/generate",
      method: "POST",
      data,
      needAuth: true
    });
  },
  getDetail: (id) => {
    return utils_http.request({
      url: `/route/${id}`,
      method: "GET"
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
  }
};
exports.routeApi = routeApi;
