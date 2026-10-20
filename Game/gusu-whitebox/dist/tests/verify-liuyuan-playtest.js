"use strict";

// src/core/liuyuan-playtest.ts
function isLiuyuanPlaytest(search) {
  const current = search ?? (typeof location === "undefined" ? "" : location.search);
  return new URLSearchParams(current).get("playtest") === "1";
}
function carryLiuyuanPlaytest(query, search) {
  if (isLiuyuanPlaytest(search)) query.set("playtest", "1");
}

// src/core/progression.ts
var SAVE_KEY = "gusu-nine-gardens-rpg-v1";
var LIUYUAN_PLAYTEST_KEY = "gusu-nine-gardens-liuyuan-playtest-v1";
var activeSaveKey = () => isLiuyuanPlaytest() ? LIUYUAN_PLAYTEST_KEY : SAVE_KEY;
var volatileProgress = /* @__PURE__ */ new Map();
var storageWriteFailed = /* @__PURE__ */ new Set();
var DEFAULT_PROGRESS = {
  version: 1,
  arts: { li: 0, yue: 0, she: 0, yu: 0, shu: 0, shuMath: 0 },
  gardens: {
    canglang: "open",
    wangshi: "locked",
    zhuozheng: "locked",
    shizilin: "locked",
    liuyuan: "locked",
    ouyuan: "locked",
    yipu: "locked",
    huanxiu: "locked",
    tuisi: "locked"
  },
  completedTasks: [],
  knowledge: [],
  storyFlags: [],
  updatedAt: 0
};
function cloneDefault() {
  return JSON.parse(JSON.stringify(DEFAULT_PROGRESS));
}
function loadProgress() {
  const key = activeSaveKey();
  const fallback = volatileProgress.get(key);
  if (storageWriteFailed.has(key) && fallback) return structuredClone(fallback);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback ? structuredClone(fallback) : cloneDefault();
    const saved = JSON.parse(raw);
    const base = cloneDefault();
    const progress = {
      ...base,
      ...saved,
      arts: { ...base.arts, ...saved.arts ?? {} },
      gardens: { ...base.gardens, ...saved.gardens ?? {} },
      completedTasks: Array.isArray(saved.completedTasks) ? saved.completedTasks : [],
      knowledge: Array.isArray(saved.knowledge) ? saved.knowledge : [],
      storyFlags: Array.isArray(saved.storyFlags) ? saved.storyFlags : [],
      updatedAt: typeof saved.updatedAt === "number" ? saved.updatedAt : 0
    };
    volatileProgress.set(key, structuredClone(progress));
    return progress;
  } catch {
    return fallback ? structuredClone(fallback) : cloneDefault();
  }
}
function markStoryFlag(flag) {
  const progress = loadProgress();
  if (!progress.storyFlags.includes(flag)) {
    progress.storyFlags.push(flag);
    saveProgress(progress);
  }
  return progress;
}
function saveProgress(progress) {
  progress.updatedAt = Date.now();
  const key = activeSaveKey();
  volatileProgress.set(key, structuredClone(progress));
  try {
    localStorage.setItem(key, JSON.stringify(progress));
    storageWriteFailed.delete(key);
  } catch {
    storageWriteFailed.add(key);
  }
}
function resetProgress() {
  const progress = cloneDefault();
  saveProgress(progress);
  return progress;
}

// src/core/liuyuan-view-memory.ts
function chapterSceneHref(page2, draft = false) {
  const query = new URLSearchParams({ chapter: "1" });
  if (draft) query.set("draft", "1");
  carryLiuyuanPlaytest(query);
  return `${page2}?${query}`;
}
function lvyinSceneUrl(sawCourtWindow, draft = false) {
  const query = new URLSearchParams({ chapter: "1" });
  if (sawCourtWindow) query.set("courtWindow", "1");
  if (draft) query.set("draft", "1");
  carryLiuyuanPlaytest(query);
  return `liuyuan-lvyin.html?${query}`;
}

// src/core/liuyuan-modern-route.ts
function modernRouteHref(page2, from, draft = false, returning = false) {
  const query = new URLSearchParams({ route: "modern", from });
  if (draft) query.set("draft", "1");
  if (returning) query.set("return", "1");
  carryLiuyuanPlaytest(query);
  return `${page2}?${query}`;
}

// src/core/liuyuan-composition-route.ts
function compositionRouteHref(page2, chapter, draft, albumDone = false) {
  const query = new URLSearchParams();
  if (chapter) query.set("chapter", "1");
  if (draft) query.set("draft", "1");
  if (albumDone) query.set("album", "done");
  carryLiuyuanPlaytest(query);
  return `${page2}${query.toString() ? `?${query}` : ""}`;
}

// scripts/verify-liuyuan-playtest.ts
var records = /* @__PURE__ */ new Map();
var page = { search: "" };
Object.defineProperty(globalThis, "location", { value: page, configurable: true });
Object.defineProperty(globalThis, "localStorage", { value: {
  getItem: (key) => records.get(key) ?? null,
  setItem: (key, value) => {
    records.set(key, value);
  }
}, configurable: true });
function assert(value, message) {
  if (!value) throw new Error(message);
}
page.search = "?playtest=1";
markStoryFlag("ly-errand-offered");
assert(loadProgress().storyFlags.includes("ly-errand-offered"), "\u8BD5\u73A9\u65D7\u6807\u5E94\u5728\u8BD5\u73A9\u9875\u8BFB\u56DE");
assert(records.has("gusu-nine-gardens-liuyuan-playtest-v1"), "\u8BD5\u73A9\u53EA\u80FD\u5199\u5165\u72EC\u7ACB\u952E");
assert(!records.has("gusu-nine-gardens-rpg-v1"), "\u8BD5\u73A9\u4E0D\u53EF\u65B0\u5EFA\u6B63\u5F0F\u5B58\u6863");
assert(chapterSceneHref("liuyuan-court.html") === "liuyuan-court.html?chapter=1&playtest=1", "\u5165\u5C0F\u5EAD\u987B\u643A\u5E26\u8BD5\u73A9\u6A21\u5F0F");
assert(lvyinSceneUrl(true) === "liuyuan-lvyin.html?chapter=1&courtWindow=1&playtest=1", "\u4E34\u6C60\u987B\u643A\u5E26\u8BD5\u73A9\u6A21\u5F0F");
assert(modernRouteHref("liuyuan-east-hall.html", "flower") === "liuyuan-east-hall.html?route=modern&from=flower&playtest=1", "\u73B0\u4EE3\u7AE0\u6D41\u987B\u643A\u5E26\u8BD5\u73A9\u6A21\u5F0F");
assert(compositionRouteHref("liuyuan-composition-study.html", true, false) === "liuyuan-composition-study.html?chapter=1&playtest=1", "\u6784\u56FE\u5C0F\u6E38\u620F\u987B\u643A\u5E26\u8BD5\u73A9\u6A21\u5F0F");
resetProgress();
assert(loadProgress().storyFlags.length === 0, "\u91CD\u5F00\u8BD5\u73A9\u5E94\u6E05\u9664\u8BD5\u73A9\u8FDB\u5EA6");
page.search = "";
assert(loadProgress().storyFlags.length === 0, "\u9000\u51FA\u8BD5\u73A9\u4E0D\u80FD\u4ECE\u5185\u5B58\u4E32\u5165\u6B63\u5F0F\u8FDB\u5EA6");
markStoryFlag("shen-met");
assert(records.has("gusu-nine-gardens-rpg-v1"), "\u6B63\u5F0F\u6A21\u5F0F\u4ECD\u5E94\u5199\u81EA\u5DF1\u7684\u952E");
page.search = "?playtest=1";
assert(!loadProgress().storyFlags.includes("shen-met"), "\u6B63\u5F0F\u65D7\u6807\u4E0D\u80FD\u4E32\u8FDB\u8BD5\u73A9");
assert(!records.get("gusu-nine-gardens-liuyuan-playtest-v1")?.includes("shen-met"), "\u4E24\u4E2A\u5B58\u6863\u5E94\u5B8C\u5168\u9694\u79BB");
console.log("\u7559\u56ED\u8BD5\u73A9\u5B58\u6863\u9694\u79BB\u3001\u91CD\u5F00\u3001\u5165\u53E3\u81F3\u7AE0\u6D41\u4E0E\u5C0F\u6E38\u620F\u53C2\u6570\u4F20\u9012\u901A\u8FC7\u3002");
