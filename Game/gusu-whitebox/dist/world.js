"use strict";
(() => {
  // src/core/liuyuan-playtest.ts
  function isLiuyuanPlaytest(search) {
    const current = search ?? (typeof location === "undefined" ? "" : location.search);
    return new URLSearchParams(current).get("playtest") === "1";
  }
  function carryLiuyuanPlaytest(query, search) {
    if (isLiuyuanPlaytest(search)) query.set("playtest", "1");
  }

  // src/core/liuyuan-drawing-echo.ts
  function drawingChapterEcho(knowledge) {
    const ending = "\u7A7A\u6876\u8FD8\u4E86\uFF0C\u9898\u8FC7\u7684\u53F6\u7559\u5728\u8EAB\u8FB9\u3002\u4E66\u658B\u90A3\u5F20\u4E0D\u80AF\u79BB\u624B\u7684\u7EB8\uFF0C\u4F60\u7EC8\u7A76\u6CA1\u6709\u5F3A\u7D22\u3002" + (knowledge.includes("liuyuan-garden-note-collated") ? "\u5E9C\u5B66\u539F\u672C\u5DF2\u6838\u8FC7\uFF0C\u786E\u662F\u201C\u666F\u540C\u201D\u3002\u8FD9\u4E00\u4E2A\u5B57\u7684\u5DEE\u522B\uFF0C\u4ECD\u503C\u5F97\u8FFD\u67E5\u3002" : "\u201C\u666F\u540C\u201D\u4E0E\u201C\u666F\u5F02\u201D\u7684\u5DEE\u522B\uFF0C\u4E5F\u8981\u7B49\u56DE\u5E9C\u5B66\u6838\u8FC7\u539F\u672C\u518D\u8BF4\u3002");
    if (knowledge.includes("liuyuan-album-orchid-leaf"))
      return `${ending}\u82B1\u5320\u8D60\u4F60\u7684\u5170\u7A3F\u4E5F\u6536\u5728\u8896\u4E2D\uFF1A\u6709\u7684\u7EB8\u80FD\u501F\u6765\u770B\uFF0C\u6709\u7684\u5B57\uFF0C\u8981\u81EA\u5DF1\u53E6\u627E\u5730\u65B9\u5199\u3002`;
    if (knowledge.includes("liuyuan-drawing-smudged"))
      return `${ending}\u82B1\u623F\u7684\u6E7F\u7A3F\u8FD8\u538B\u5728\u6A90\u4E0B\u3002\u4F60\u60F3\u8D77\u8BD5\u58A8\u65F6\u6D07\u5F00\u7684\u53F6\u8109\uFF0C\u8FD9\u56DE\u53EA\u6258\u4F4F\u53F6\u8FB9\uFF0C\u8BA9\u58A8\u6162\u6162\u5E72\u3002`;
    if (knowledge.includes("liuyuan-drawing-left"))
      return `${ending}\u732B\u8FB9\u7684\u753B\u7A3F\u4EA4\u56DE\u82B1\u5320\u7167\u770B\uFF0C\u4F60\u5FAA\u4ED6\u90A3\u53E5\u201C\u7B14\u6811\u201D\u627E\u5230\u4E86\u4EBA\u3002\u6CA1\u505A\u5B8C\u7684\u90A3\u4EF6\u4E8B\uFF0C\u5E76\u6CA1\u6709\u622A\u65AD\u8FD9\u4E00\u7A0B\u3002`;
    return knowledge.includes("liuyuan-magnolia-slip") ? `${ending}\u82B1\u5320\u7684\u4E00\u53E5\u201C\u7B14\u6811\u201D\uFF0C\u628A\u4F60\u5E26\u5230\u7EB8\u58F0\u524D\uFF1B\u5E26\u51FA\u6765\u7684\u8FD9\u7247\u53F6\uFF0C\u662F\u4F60\u4EB2\u624B\u8BD5\u8FC7\u7684\u529E\u6CD5\u3002` : `${ending}\u4F60\u5FAA\u7740\u9662\u95F4\u7684\u7EB8\u58F0\u627E\u5230\u4E66\u658B\uFF1B\u5E26\u51FA\u6765\u7684\u8FD9\u7247\u53F6\uFF0C\u662F\u4F60\u4EB2\u624B\u8BD5\u8FC7\u7684\u529E\u6CD5\u3002`;
  }

  // src/core/progression.ts
  var SAVE_KEY = "gusu-nine-gardens-rpg-v1";
  var LIUYUAN_PLAYTEST_KEY = "gusu-nine-gardens-liuyuan-playtest-v1";
  var activeSaveKey = () => isLiuyuanPlaytest() ? LIUYUAN_PLAYTEST_KEY : SAVE_KEY;
  var volatileProgress = /* @__PURE__ */ new Map();
  var storageWriteFailed = /* @__PURE__ */ new Set();
  var FLAG_ALIASES = {
    "opening-arrival-seen": "opening-seen",
    "opening-seen": "opening-arrival-seen",
    "first-lesson-offered": "fuxue-briefing-seen",
    "fuxue-briefing-seen": "first-lesson-offered"
  };
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
      const progress2 = {
        ...base,
        ...saved,
        arts: { ...base.arts, ...saved.arts ?? {} },
        gardens: { ...base.gardens, ...saved.gardens ?? {} },
        completedTasks: Array.isArray(saved.completedTasks) ? saved.completedTasks : [],
        knowledge: Array.isArray(saved.knowledge) ? saved.knowledge : [],
        storyFlags: Array.isArray(saved.storyFlags) ? saved.storyFlags : [],
        updatedAt: typeof saved.updatedAt === "number" ? saved.updatedAt : 0
      };
      volatileProgress.set(key, structuredClone(progress2));
      return progress2;
    } catch {
      return fallback ? structuredClone(fallback) : cloneDefault();
    }
  }
  function hasStoryFlag(progress2, flag) {
    const alias = FLAG_ALIASES[flag];
    return progress2.storyFlags.includes(flag) || !!alias && progress2.storyFlags.includes(alias);
  }
  function artStage(value) {
    return value <= 0 ? "\u672A\u4E60" : value === 1 ? "\u521D\u8BC6" : value === 2 ? "\u5165\u95E8" : "\u901A\u6653";
  }

  // src/world.ts
  var progress = loadProgress();
  document.getElementById("liuyuanJourney").hidden = !hasStoryFlag(progress, "ly-unlocked");
  document.getElementById("liuyuanJourneyWords").textContent = drawingChapterEcho(progress.knowledge);
  var artOrder = [
    ["li", "\u793C"],
    ["yue", "\u4E50"],
    ["she", "\u5C04"],
    ["yu", "\u5FA1"],
    ["shu", "\u4E66"],
    ["shuMath", "\u6570"]
  ];
  for (const [id, label] of artOrder) {
    const item = document.querySelector(`[data-art="${id}"]`);
    if (!item) continue;
    const value = progress.arts[id];
    item.querySelector("b").textContent = label;
    item.querySelector("span").textContent = artStage(value);
    item.classList.toggle("has-progress", value > 0);
  }
  document.querySelectorAll("[data-garden]").forEach((node) => {
    const id = node.dataset.garden;
    const state = progress.gardens[id];
    node.dataset.state = state;
    const stateLabel = node.querySelector("[data-state]");
    if (stateLabel) stateLabel.textContent = state === "complete" ? "\u5DF2\u8BBF" : state === "entered" ? "\u5DF2\u5165\u56ED" : state === "open" ? "\u53EF\u5165\u56ED" : state === "clue" ? "\u65B0\u7EBF\u7D22" : "\u672A\u89E3\u9501";
  });
  var questTitle = document.getElementById("questTitle");
  var questBody = document.getElementById("questBody");
  var canglangDone = progress.completedTasks.includes("canglang-three-windows");
  questTitle.textContent = canglangDone ? "\u8BFE\u4E8C \xB7 \u7F51\u5E08\u56ED\u7684\u90A3\u6761\u8239\u2026\u2026" : "\u8BFE\u4E00 \xB7 \u5230\u4E86\u590D\u5ECA\uFF0C\u66FF\u6211\u770B\u4E00\u773C\u6C34";
  questBody.textContent = canglangDone ? "\u4E09\u7A97\u5DF2\u7ECF\u6536\u5165\u56ED\u8C31\u3002\u300A\u8607\u57CE\u5168\u5716\u300B\u4E1C\u5357\u4E00\u5E26\u6D6E\u51FA\u65B0\u7684\u58A8\u75D5\uFF0C\u4F46\u5165\u56ED\u6761\u4EF6\u5C1A\u672A\u9F50\u5907\u3002" : "\u4ECE\u57CE\u5357\u8FDB\u5165\u6CA7\u6D6A\u4EAD\uFF0C\u6CBF\u4E34\u6C34\u590D\u5ECA\u5B8C\u6210\u201C\u770B\u2014\u5BF9\u2014\u5408\u201D\uFF0C\u4FEE\u4E60\u6570\u827A\u7684\u7B2C\u4E00\u8BFE\u3002";
  if (new URLSearchParams(location.search).get("scene") === "prologue") {
    document.querySelectorAll('a[href="garden.html"]').forEach((link) => {
      link.href = "garden.html?scene=arrival";
    });
  }
  if (isLiuyuanPlaytest()) {
    document.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href") ?? "";
      if (!/^(home|journal|liuyuan-entry|garden)\.html(?:[?#]|$)/.test(href)) return;
      const [target, hash] = href.split("#");
      const [page, search = ""] = target.split("?");
      const query = new URLSearchParams(search);
      carryLiuyuanPlaytest(query);
      link.href = `${page}?${query}${hash === void 0 ? "" : `#${hash}`}`;
    });
  }
})();
