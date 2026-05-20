"use strict";
var api_activity = require("../api/activity.js");
var api_content = require("../api/content.js");
let hasPreloaded = false;
const runSoon = (task, delay = 800) => {
  setTimeout(task, delay);
};
const preloadTabData = () => {
  if (hasPreloaded)
    return;
  hasPreloaded = true;
  runSoon(() => {
    Promise.allSettled([
      api_content.cityApi.list(),
      api_content.tagApi.list(),
      api_content.travelNoteApi.list({ pageNum: 1, pageSize: 10, sortBy: "hot" }),
      api_content.scenicSpotApi.list({ pageNum: 1, pageSize: 1e3 }),
      api_activity.activityApi.getList({ status: "online", pageNum: 1, pageSize: 10 })
    ]).catch(() => {
      hasPreloaded = false;
    });
  });
};
exports.preloadTabData = preloadTabData;
