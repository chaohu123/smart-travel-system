"use strict";
var common_vendor = require("../common/vendor.js");
var api_content = require("../api/content.js");
function getSelectedCity() {
  const raw = common_vendor.index.getStorageSync("ticket_selected_city");
  if (!(raw == null ? void 0 : raw.id) || !(raw == null ? void 0 : raw.name))
    return null;
  return raw;
}
async function syncSelectedCityName() {
  const selected = getSelectedCity();
  if (!selected)
    return null;
  try {
    const res = await api_content.cityApi.list();
    const data = res.data;
    if (res.statusCode !== 200 || data.code !== 200)
      return selected;
    const row = (data.data || []).find((c) => Number(c.id) === Number(selected.id));
    if (!row)
      return selected;
    const name = row.cityName || row.name;
    if (!name || name === selected.name)
      return selected;
    const updated = { ...selected, name };
    common_vendor.index.setStorageSync("ticket_selected_city", updated);
    return updated;
  } catch {
    return selected;
  }
}
exports.syncSelectedCityName = syncSelectedCityName;
