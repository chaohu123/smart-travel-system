"use strict";
var common_vendor = require("../common/vendor.js");
var utils_config = require("./config.js");
const CACHE_PREFIX = "amap_district_rings_";
const MAX_POINTS_PER_RING = 200;
function trimPoints(points) {
  if (points.length <= MAX_POINTS_PER_RING)
    return points;
  const step = Math.ceil(points.length / MAX_POINTS_PER_RING);
  const sampled = [];
  for (let i = 0; i < points.length; i += step) {
    sampled.push(points[i]);
  }
  if (sampled.length > 1) {
    const a = sampled[0];
    const b = sampled[sampled.length - 1];
    if (a.latitude !== b.latitude || a.longitude !== b.longitude) {
      sampled.push({ ...a });
    }
  }
  return sampled;
}
function parseAmapPolylineRings(polyline) {
  if (!polyline)
    return [];
  const rings = [];
  for (const block of polyline.split("|")) {
    const pts = [];
    for (const seg of block.split(";")) {
      const t = seg.trim();
      if (!t)
        continue;
      const parts = t.split(",");
      if (parts.length < 2)
        continue;
      const lng = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        pts.push({ latitude: lat, longitude: lng });
      }
    }
    const trimmed = trimPoints(pts);
    if (trimmed.length >= 3)
      rings.push(trimmed);
  }
  return rings;
}
async function fetchDistrictRings(keyword) {
  const cacheKey = CACHE_PREFIX + keyword;
  try {
    const cached = common_vendor.index.getStorageSync(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  } catch {
  }
  const url = `https://restapi.amap.com/v3/config/district?keywords=${encodeURIComponent(keyword)}&subdistrict=0&extensions=all&key=${encodeURIComponent(utils_config.AMAP_WEB_KEY)}`;
  return new Promise((resolve) => {
    common_vendor.index.request({
      url,
      method: "GET",
      success: (res) => {
        var _a, _b;
        const data = res.data;
        if (res.statusCode !== 200 || (data == null ? void 0 : data.status) !== "1" || !((_a = data == null ? void 0 : data.districts) == null ? void 0 : _a.length)) {
          resolve(null);
          return;
        }
        const polyline = (_b = data.districts[0]) == null ? void 0 : _b.polyline;
        const rings = parseAmapPolylineRings(polyline);
        if (!rings.length) {
          resolve(null);
          return;
        }
        try {
          common_vendor.index.setStorageSync(cacheKey, rings);
        } catch {
        }
        resolve(rings);
      },
      fail: () => resolve(null)
    });
  });
}
exports.fetchDistrictRings = fetchDistrictRings;
