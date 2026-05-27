"use strict";
const PERIOD_META = [
  { key: "morning", label: "\u4E0A\u5348", order: 1 },
  { key: "noon", label: "\u4E2D\u5348", order: 2 },
  { key: "afternoon", label: "\u4E0B\u5348", order: 3 },
  { key: "evening", label: "\u665A\u4E0A", order: 4 }
];
function extractBracketedPlaceNames(text) {
  const names = [];
  if (!text)
    return names;
  const re = /【([^】\n]{2,40})】/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    const name = match[1].trim();
    if (name && /[\u4e00-\u9fa5]/.test(name)) {
      names.push(name);
    }
  }
  return names;
}
function extractLoosePlaceNames(text) {
  const names = [];
  if (!text)
    return names;
  const patterns = [
    /(?:前往|抵达|到达|游览|参观|打卡|漫步于|行至)[「「【]?([\u4e00-\u9fa5A-Za-z0-9·（）()\-]{2,24})[」」】]?/g
  ];
  for (const re of patterns) {
    let match;
    while ((match = re.exec(text)) !== null) {
      const name = match[1].trim();
      if (name && !["\u5730\u94C1", "\u516C\u4EA4", "\u51FA\u79DF", "\u8F7B\u8F68", "\u9152\u5E97", "\u9910\u5385"].some((w) => name.includes(w))) {
        names.push(name);
      }
    }
  }
  return names;
}
function extractPlacesFromAiIntro(intro) {
  const seen = /* @__PURE__ */ new Set();
  const stops = [];
  let sortOrder = 0;
  for (const period of PERIOD_META) {
    const text = String(intro[period.key] || "").trim();
    if (!text)
      continue;
    const bracketed = extractBracketedPlaceNames(text);
    const names = bracketed.length > 0 ? bracketed : extractLoosePlaceNames(text);
    for (const name of names) {
      const dedupeKey = name.replace(/\s/g, "");
      if (seen.has(dedupeKey))
        continue;
      seen.add(dedupeKey);
      sortOrder += 1;
      stops.push({
        name,
        period: period.label,
        periodOrder: period.order,
        sortOrder
      });
    }
  }
  return stops;
}
function dayHasAiIntro(intro) {
  return PERIOD_META.some((p) => String(intro[p.key] || "").trim().length > 0);
}
exports.dayHasAiIntro = dayHasAiIntro;
exports.extractPlacesFromAiIntro = extractPlacesFromAiIntro;
