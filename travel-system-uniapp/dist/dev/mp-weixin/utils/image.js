"use strict";
var utils_config = require("./config.js");
const BASE_URL = utils_config.STATIC_BASE_URL;
const getImageUrl = (url, noCache = true) => {
  if (!url) {
    return "";
  }
  const rawUrl = String(url).trim();
  if (!rawUrl)
    return "";
  let fullUrl = "";
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    fullUrl = rawUrl;
  } else {
    if (rawUrl.startsWith("/uploads/")) {
      fullUrl = `${BASE_URL}${rawUrl}`;
    } else if (rawUrl.startsWith("uploads/")) {
      fullUrl = `${BASE_URL}/${rawUrl}`;
    } else {
      fullUrl = `${BASE_URL}${rawUrl.startsWith("/") ? rawUrl : "/" + rawUrl}`;
    }
  }
  try {
    const base = new URL(BASE_URL);
    const targetOrigin = `${base.protocol}//${base.host}`;
    fullUrl = fullUrl.replace(/^https?:\/\/localhost(?::\d+)?/i, targetOrigin).replace(/^https?:\/\/127\.0\.0\.1(?::\d+)?/i, targetOrigin);
  } catch (e) {
  }
  if (noCache && fullUrl.includes(BASE_URL)) {
    const separator = fullUrl.includes("?") ? "&" : "?";
    fullUrl = `${fullUrl}${separator}_t=${Date.now()}`;
  }
  return fullUrl;
};
exports.getImageUrl = getImageUrl;
