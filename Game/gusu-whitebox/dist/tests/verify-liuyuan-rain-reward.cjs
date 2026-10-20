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

// src/core/liuyuan-text-variant.ts
var LIUYUAN_TEXT_VARIANT = {
  knowledgeId: "liuyuan-garden-note-variant",
  academy: "\u9694\u7A97\u770B\u5C71\uFF0C\u79FB\u6B65\u666F\u540C\u3002",
  copyist: "\u9694\u7A97\u770B\u5C71\uFF0C\u79FB\u6B65\u666F\u5F02\u3002",
  sourceLabel: "\u81EA\u62DF\u56ED\u8BB0 \xB7 \u6E38\u620F\u6545\u4E8B"
};

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
  const requiredFlag = flag === "ly-gate-passed" ? "ly-errand-offered" : flag === "ly-magnolia-seen" || flag === "ly-study-found" ? "ly-porridge-delivered" : index > 0 ? LIUYUAN_CHAPTER_FLAGS[index - 1] : void 0;
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
      addOnce(next.knowledge, "liuyuan-cramped-alley");
    }
  }
  if (flag === "ly-florist-met") addOnce(next.knowledge, "liuyuan-magnolia-slip");
  if (flag === "ly-leaf-written" && !next.completedTasks.includes(LEAF_TASK_ID)) {
    next.completedTasks.push(LEAF_TASK_ID);
    next.arts.shu += 1;
  }
  if (flag === "ly-leaf-written") addOnce(next.knowledge, LIUYUAN_TEXT_VARIANT.knowledgeId);
  if (flag === "ly-unlocked") next.gardens.liuyuan = "complete";
  return { progress: next, applied: true, reason: "applied" };
}
function awardLiuyuanRainShadow() {
  const progress = loadProgress();
  const task = "liuyuan-rain-shadow";
  if (progress.completedTasks.includes(task)) return false;
  progress.completedTasks.push(task);
  if (!progress.storyFlags.includes("ly-rain-shadow-cleared")) progress.storyFlags.push("ly-rain-shadow-cleared");
  progress.arts.yu += 1;
  saveProgress(progress);
  return true;
}

// scripts/verify-liuyuan-rain-reward.ts
var records = /* @__PURE__ */ new Map();
Object.defineProperty(globalThis, "location", { value: { search: "" }, configurable: true });
Object.defineProperty(globalThis, "localStorage", { value: {
  getItem: (key) => records.get(key) ?? null,
  setItem: (key, value) => records.set(key, value)
}, configurable: true });
function assert(value, message) {
  if (!value) throw new Error(message);
}
var old = loadProgress();
old.storyFlags.push("ly-rain-shadow-cleared");
saveProgress(old);
assert(awardLiuyuanRainShadow(), "\u65E7\u6210\u529F\u672A\u9886\u5956\u5E94\u53EF\u5728\u4E0B\u4E00\u6B21\u6210\u529F\u9886\u53D6");
var first = JSON.stringify(loadProgress());
assert(loadProgress().arts.yu === 1 && loadProgress().completedTasks.includes("liuyuan-rain-shadow"), "\u5FA1\u5956\u52B1\u5E94\u6301\u4E45\u8BB0\u5F55");
assert(!awardLiuyuanRainShadow() && JSON.stringify(loadProgress()) === first, "\u91CD\u590D\u7ED3\u7B97\u4E0D\u5F97\u518D\u5199\u5C5E\u6027\u6216\u65F6\u95F4");
Object.defineProperty(globalThis, "location", { value: { search: "?playtest=1" }, configurable: true });
assert(loadProgress().arts.yu === 0 && awardLiuyuanRainShadow(), "\u9694\u79BB\u8BD5\u73A9\u72EC\u7ACB\u7ED3\u7B97");
Object.defineProperty(globalThis, "location", { value: { search: "" }, configurable: true });
assert(JSON.stringify(loadProgress()) === first, "\u8BD5\u73A9\u4E0D\u6C61\u67D3\u6B63\u5F0F\u5956\u52B1");
console.log("\u62A4\u753B\u5956\u52B1\uFF1A\u5FA1 +1\u3001\u5E42\u7B49\u3001\u65E7\u6210\u529F\u517C\u5BB9\u3001\u6B63\u5F0F/\u8BD5\u73A9\u9694\u79BB\u901A\u8FC7\u3002");
var freeRoute = { ...loadProgress(), storyFlags: [], completedTasks: [], knowledge: [], arts: { ...loadProgress().arts, yu: 0, shu: 0 } };
assert(advanceLiuyuanChapter(freeRoute, "ly-gate-passed").reason === "missing-previous", "\u672A\u63A5\u9001\u7CA5\u4EFB\u52A1\u4E0D\u5E94\u63D0\u4EA4\u5165\u56ED\u4E8B\u4EF6");
for (const flag of LIUYUAN_CHAPTER_FLAGS) {
  if (flag === "ly-huabu-seen" || flag === "ly-gate-clue" || flag === "ly-florist-met" || flag === "ly-magnolia-seen") continue;
  const result = advanceLiuyuanChapter(freeRoute, flag);
  assert(result.applied, `\u8DF3\u8FC7\u95EE\u8BDD\u540E\u4ECD\u53EF\u63A8\u8FDB ${flag}`);
  freeRoute = result.progress;
}
assert(freeRoute.gardens.liuyuan === "complete" && !freeRoute.storyFlags.includes("ly-huabu-seen") && !freeRoute.storyFlags.includes("ly-gate-clue") && !freeRoute.storyFlags.includes("ly-florist-met") && !freeRoute.storyFlags.includes("ly-magnolia-seen") && !freeRoute.knowledge.includes("liuyuan-magnolia-slip"), "\u81EA\u4E3B\u5165\u56ED\u53EF\u7ED3\u7B97\u5168\u7AE0\uFF0C\u4E0D\u4F2A\u9020\u53EF\u9009\u95EE\u8BDD");
console.log("\u53EF\u9009\u5165\u53E3\u95EE\u8BDD\uFF1A\u8DF3\u8FC7\u540E\u6574\u7AE0\u72B6\u6001\u63A8\u8FDB\u901A\u8FC7\u3002");
