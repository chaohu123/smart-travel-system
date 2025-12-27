"use strict";
var utils_http = require("../utils/http.js");
const userApi = {
  loginByUserId: (userId) => {
    return utils_http.request({
      url: `/admin/user/${userId}`,
      method: "GET",
      showLoading: true
    });
  },
  listSimple: () => {
    return utils_http.request({
      url: "/admin/user/list",
      method: "GET",
      showLoading: false
    });
  },
  updateProfile: (payload) => {
    return utils_http.request({
      url: "/admin/user/update",
      method: "POST",
      data: payload,
      needAuth: false
    });
  },
  updateInterests: (userId, interests) => {
    return utils_http.request({
      url: "/admin/user/interests",
      method: "POST",
      data: { id: userId, interests },
      needAuth: false
    });
  }
};
exports.userApi = userApi;
