"use strict";

// src/core/liuyuan-playtest.ts
function isLiuyuanPlaytest(search) {
  const current = search ?? (typeof location === "undefined" ? "" : location.search);
  return new URLSearchParams(current).get("playtest") === "1";
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

// src/core/liuyuan-progression.ts
var LIUYUAN_CHAPTER_FLAGS = [
  "ly-errand-offered",
  "ly-huabu-seen",
  "ly-gate-clue",
  "ly-gate-passed",
  "ly-alley-walked",
  "ly-porridge-delivered",
  "ly-florist-met",
  "ly-magnolia-seen",
  "ly-study-found",
  "ly-scholar-met",
  "ly-scholar-trouble-known",
  "ly-leaf-picked",
  "ly-leaf-written",
  "ly-leaf-carried",
  "ly-unlocked"
];
var ALLEY_TASK_ID = "liuyuan-alley-walk";
var LEAF_TASK_ID = "liuyuan-leaf-writing";
function addOnce(values, value) {
  if (!values.includes(value)) values.push(value);
}
function advanceLiuyuanChapter(progress, flag) {
  if (progress.storyFlags.includes(flag)) return { progress, applied: false, reason: "already-applied" };
  const index = LIUYUAN_CHAPTER_FLAGS.indexOf(flag);
  const requiredFlag = index > 0 ? LIUYUAN_CHAPTER_FLAGS[index - 1] : void 0;
  if (requiredFlag && !progress.storyFlags.includes(requiredFlag)) {
    return { progress, applied: false, reason: "missing-previous", requiredFlag };
  }
  const next = {
    ...progress,
    arts: { ...progress.arts },
    gardens: { ...progress.gardens },
    completedTasks: [...progress.completedTasks],
    knowledge: [...progress.knowledge],
    storyFlags: [...progress.storyFlags, flag]
  };
  if (flag === "ly-errand-offered" && next.gardens.liuyuan === "locked") next.gardens.liuyuan = "clue";
  if (flag === "ly-gate-passed") next.gardens.liuyuan = "open";
  if (flag === "ly-alley-walked") {
    next.gardens.liuyuan = "entered";
    if (!next.completedTasks.includes(ALLEY_TASK_ID)) {
      next.completedTasks.push(ALLEY_TASK_ID);
      next.arts.yu += 1;
      addOnce(next.knowledge, "liuyuan-cramped-alley");
    }
  }
  if (flag === "ly-florist-met") addOnce(next.knowledge, "liuyuan-magnolia-slip");
  if (flag === "ly-leaf-written" && !next.completedTasks.includes(LEAF_TASK_ID)) {
    next.completedTasks.push(LEAF_TASK_ID);
    next.arts.shu += 1;
  }
  if (flag === "ly-unlocked") next.gardens.liuyuan = "complete";
  return { progress: next, applied: true, reason: "applied" };
}
function commitLiuyuanChapterFlag(flag) {
  const result = advanceLiuyuanChapter(loadProgress(), flag);
  if (result.applied) saveProgress(result.progress);
  return result;
}

// scripts/verify-progress-storage-fallback.ts
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
var stale = JSON.stringify(loadProgress());
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: () => stale, setItem: () => {
    throw new Error("read-only storage");
  } }
});
assert(commitLiuyuanChapterFlag("ly-errand-offered").applied, "\u53EA\u8BFB\u5B58\u50A8\u65F6\u4ECD\u987B\u63A5\u5230\u5DEE\u4E8B");
assert(commitLiuyuanChapterFlag("ly-huabu-seen").applied, "\u540E\u7EED\u5BF9\u767D\u4E0D\u5F97\u56E0\u5B58\u6863\u4E0D\u53EF\u7528\u800C\u5361\u4F4F");
var copy = loadProgress();
copy.storyFlags.push("ly-gate-clue");
assert(!loadProgress().storyFlags.includes("ly-gate-clue"), "\u8BFB\u53D6\u5E94\u8FD4\u56DE\u72EC\u7ACB\u526F\u672C");
assert(commitLiuyuanChapterFlag("ly-gate-clue").applied, "\u95E8\u623F\u7EBF\u7D22\u5E94\u53EF\u7EE7\u7EED\u63A8\u8FDB");
assert(commitLiuyuanChapterFlag("ly-gate-passed").applied, "\u95E8\u623F\u5E94\u80FD\u653E\u884C");
assert(loadProgress().storyFlags.includes("ly-gate-passed"), "\u65E0\u672C\u5730\u5B58\u50A8\u65F6\u672C\u9875\u4ECD\u5E94\u8BB0\u4F4F\u653E\u884C");
delete globalThis.localStorage;
assert(commitLiuyuanChapterFlag("ly-alley-walked").applied, "\u53EA\u8BFB\u5B58\u50A8\u4E0D\u5E94\u963B\u65AD\u4E0B\u4E00\u5E55");
assert(loadProgress().storyFlags.includes("ly-alley-walked"), "\u8BFB\u53D6\u65E7\u5B58\u6863\u4E0D\u5E94\u8986\u76D6\u672A\u80FD\u6301\u4E45\u5316\u7684\u65B0\u72B6\u6001");
console.log("\u8FDB\u5EA6\u5B58\u50A8\u56DE\u9000\uFF1AWeb Storage \u4E0D\u53EF\u7528\u6216\u53EA\u8BFB\u65F6\uFF0C\u540C\u9875\u7AE0\u6D41\u53EF\u6309\u5E8F\u63A8\u8FDB\u3002");
