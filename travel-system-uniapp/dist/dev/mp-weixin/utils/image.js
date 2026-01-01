"use strict";
var utils_config = require("./config.js");
const BASE_URL = utils_config.STATIC_BASE_URL;
const getImageUrl = (url, noCache = true) => {
  if (!url) {
    return "/static/default-image.jpg";
  }
  let fullUrl = "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    fullUrl = url;
  } else {
    if (url.startsWith("/uploads/")) {
      fullUrl = `${BASE_URL}${url}`;
    } else if (url.startsWith("uploads/")) {
      fullUrl = `${BASE_URL}/${url}`;
    } else {
      fullUrl = `${BASE_URL}${url.startsWith("/") ? url : "/" + url}`;
    }
  }
  if (noCache && fullUrl.includes(BASE_URL)) {
    const separator = fullUrl.includes("?") ? "&" : "?";
    fullUrl = `${fullUrl}${separator}_t=${Date.now()}`;
  }
  return fullUrl;
};
exports.getImageUrl = getImageUrl;
