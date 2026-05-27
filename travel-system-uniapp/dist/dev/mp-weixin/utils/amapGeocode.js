"use strict";
var common_vendor = require("../common/vendor.js");
var utils_http = require("./http.js");
var utils_config = require("./config.js");
const CACHE_PREFIX = "amap_geocode_";
const cache = /* @__PURE__ */ new Map();
const DEFAULT_CITY_RADIUS_KM = 80;
function cacheKey(address, city, cityId) {
  return `${CACHE_PREFIX}${cityId || ""}::${city || ""}::${address.trim()}`;
}
function distanceKm(lat1, lng1, lat2, lng2) {
  const earthRadiusKm = 6371;
  const latDistance = (lat2 - lat1) * Math.PI / 180;
  const lngDistance = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}
function isCoordNearCity(coord, cityCenter, maxKm = DEFAULT_CITY_RADIUS_KM) {
  if (!cityCenter)
    return true;
  return distanceKm(coord.latitude, coord.longitude, cityCenter.latitude, cityCenter.longitude) <= maxKm;
}
function parseLocation(location) {
  if (!location)
    return null;
  const parts = location.split(",");
  if (parts.length < 2)
    return null;
  const lng = parseFloat(parts[0]);
  const lat = parseFloat(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng))
    return null;
  if (lat < 3 || lat > 54.5 || lng < 73 || lng > 135.5)
    return null;
  return { latitude: lat, longitude: lng };
}
async function geocodeViaBackend(address, city, cityId) {
  var _a, _b;
  try {
    const res = await utils_http.request({
      url: "/map/geocode",
      method: "GET",
      data: { address, city: city || "", cityId: cityId || "" },
      showLoading: false
    });
    if (res.statusCode === 200 && ((_a = res.data) == null ? void 0 : _a.code) === 200 && ((_b = res.data) == null ? void 0 : _b.data)) {
      const lat = parseFloat(String(res.data.data.latitude));
      const lng = parseFloat(String(res.data.data.longitude));
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { latitude: lat, longitude: lng };
      }
    }
  } catch {
  }
  return null;
}
async function geocodeViaAmap(address, city) {
  var _a;
  try {
    const cityParam = city ? `&city=${encodeURIComponent(city)}` : "";
    const url = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(address)}${cityParam}&key=${utils_config.AMAP_WEB_KEY}`;
    const res = await new Promise((resolve, reject) => {
      common_vendor.index.request({ url, method: "GET", success: resolve, fail: reject });
    });
    const data = res.data;
    if ((data == null ? void 0 : data.status) !== "1" || !((_a = data.geocodes) == null ? void 0 : _a.length)) {
      return null;
    }
    return parseLocation(data.geocodes[0].location || "");
  } catch {
    return null;
  }
}
async function geocodeAddress(address, city, cityId, cityCenter) {
  var _a;
  const raw = (address || "").trim();
  if (!raw)
    return null;
  const key = cacheKey(raw, city, cityId);
  if (cache.has(key))
    return (_a = cache.get(key)) != null ? _a : null;
  const accept = (point) => {
    if (!point)
      return null;
    if (!isCoordNearCity(point, cityCenter))
      return null;
    return point;
  };
  const backendPoint = accept(await geocodeViaBackend(raw, city, cityId));
  if (backendPoint) {
    cache.set(key, backendPoint);
    return backendPoint;
  }
  const directPoint = accept(await geocodeViaAmap(raw, city));
  cache.set(key, directPoint);
  return directPoint;
}
exports.geocodeAddress = geocodeAddress;
exports.isCoordNearCity = isCoordNearCity;
