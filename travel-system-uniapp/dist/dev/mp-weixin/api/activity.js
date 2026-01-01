"use strict";
var utils_http = require("../utils/http.js");
const activityApi = {
  getList: (params) => {
    return utils_http.request({
      url: "/activity/list",
      method: "GET",
      data: params
    });
  },
  getDetail: (id) => {
    return utils_http.request({
      url: `/activity/${id}`,
      method: "GET"
    });
  }
};
exports.activityApi = activityApi;
