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
  },
  getStats: (userId) => {
    return utils_http.request({
      url: "/user/stats",
      method: "GET",
      data: userId ? { userId } : {},
      showLoading: false
    });
  },
  getProfile: (userId) => {
    return utils_http.request({
      url: "/user/profile",
      method: "GET",
      data: { userId },
      showLoading: true
    });
  },
  checkIn: (userId) => {
    return utils_http.request({
      url: "/user/checkin",
      method: "POST",
      data: { userId },
      showLoading: true,
      needAuth: true
    });
  },
  getFollowers: (userId, pageNum = 1, pageSize = 20) => {
    return utils_http.request({
      url: "/user/followers",
      method: "GET",
      data: { userId, pageNum, pageSize },
      showLoading: false
    });
  },
  getFollowing: (userId, pageNum = 1, pageSize = 20) => {
    return utils_http.request({
      url: "/user/following",
      method: "GET",
      data: { userId, pageNum, pageSize },
      showLoading: false
    });
  },
  toggleFollow: (userId, targetUserId) => {
    return utils_http.request({
      url: "/user/follow",
      method: "POST",
      data: { userId, targetUserId },
      showLoading: true,
      needAuth: true
    });
  }
};
exports.userApi = userApi;
