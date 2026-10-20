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

  // src/core/liuyuan-text-variant.ts
  var LIUYUAN_TEXT_VARIANT = {
    knowledgeId: "liuyuan-garden-note-variant",
    academy: "\u9694\u7A97\u770B\u5C71\uFF0C\u79FB\u6B65\u666F\u540C\u3002",
    copyist: "\u9694\u7A97\u770B\u5C71\uFF0C\u79FB\u6B65\u666F\u5F02\u3002",
    sourceLabel: "\u81EA\u62DF\u56ED\u8BB0 \xB7 \u6E38\u620F\u6545\u4E8B"
  };

  // src/core/liuyuan-variant-collation.ts
  var LIUYUAN_VARIANT_COLLATED = "liuyuan-garden-note-collated";

  // src/core/liuyuan-modern-route.ts
  function modernRouteHref(page, from, draft = false, returning = false) {
    const query = new URLSearchParams({ route: "modern", from });
    if (draft) query.set("draft", "1");
    if (returning) query.set("return", "1");
    carryLiuyuanPlaytest(query);
    return `${page}?${query}`;
  }

  // src/core/liuyuan-view-memory.ts
  function chapterSceneHref(page, draft = false) {
    const query = new URLSearchParams({ chapter: "1" });
    if (draft) query.set("draft", "1");
    carryLiuyuanPlaytest(query);
    return `${page}?${query}`;
  }

  // src/journal.ts
  var progress = loadProgress();
  document.getElementById("journalHome").href = chapterSceneHref("home.html");
  var drawingAlbum = document.getElementById("drawingAlbum");
  drawingAlbum.hidden = !progress.knowledge.includes("liuyuan-album-orchid-leaf");
  if (!drawingAlbum.hidden) {
    const ctx = document.getElementById("orchidLeaf").getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#dfd1af";
    ctx.fillRect(0, 0, 160, 104);
    ctx.fillStyle = "#f0e5ca";
    ctx.fillRect(4, 4, 152, 96);
    const leaf = (points, color) => {
      ctx.fillStyle = color;
      for (const [x, y, w, h] of points) ctx.fillRect(x, y, w, h);
    };
    leaf([[70, 72, 4, 12], [66, 62, 4, 12], [62, 52, 4, 12], [54, 42, 8, 4], [44, 36, 10, 4], [32, 34, 12, 3]], "#536655");
    leaf([[74, 64, 3, 20], [77, 50, 3, 16], [80, 38, 3, 14], [83, 28, 3, 12], [86, 20, 3, 10]], "#334e43");
    leaf([[76, 76, 5, 8], [81, 64, 4, 12], [85, 56, 4, 10], [89, 48, 6, 8], [95, 44, 12, 4], [107, 46, 10, 3]], "#6e7e5f");
    leaf([[67, 78, 3, 6], [62, 72, 5, 4], [55, 68, 7, 3], [44, 67, 11, 2], [34, 70, 10, 2]], "#738269");
    leaf([[92, 68, 2, 16], [94, 57, 2, 12], [96, 48, 2, 11], [97, 43, 3, 6]], "#536655");
    leaf([[94, 38, 4, 8], [98, 40, 8, 3], [91, 44, 6, 3], [98, 45, 3, 6]], "#aa8266");
    leaf([[121, 75, 8, 2], [121, 79, 8, 2], [121, 83, 8, 2], [120, 73, 2, 14], [129, 73, 2, 14]], "#a5624b");
  }
  document.getElementById("liuyuanNote").hidden = !hasStoryFlag(progress, "ly-unlocked");
  document.getElementById("liuyuanEcho").textContent = drawingChapterEcho(progress.knowledge);
  document.getElementById("variantRecord").hidden = !hasStoryFlag(progress, "ly-leaf-written");
  document.getElementById("variantAcademy").textContent = LIUYUAN_TEXT_VARIANT.academy;
  document.getElementById("variantLeaf").textContent = LIUYUAN_TEXT_VARIANT.copyist;
  var leftGarden = hasStoryFlag(progress, "ly-unlocked");
  var collated = progress.knowledge.includes(LIUYUAN_VARIANT_COLLATED);
  document.getElementById("variantFollowup").textContent = collated ? "\u5DF2\u56DE\u5E9C\u5B66\u6838\u8FC7\u539F\u672C\uFF1A\u786E\u662F\u201C\u666F\u540C\u201D\u3002\u8FD9\u4E00\u4E2A\u5B57\u7684\u5DEE\u522B\u662F\u771F\u7684\uFF1B\u54EA\u5904\u5148\u6539\u4E86\u5B57\uFF0C\u4ECD\u5F85\u67E5\u3002" : leftGarden ? "\u5148\u4FDD\u5B58\u6240\u89C1\uFF0C\u56DE\u5E9C\u5B66\u518D\u6838\u539F\u672C\u3002\u540C\u4E0E\u5F02\uFF0C\u7A76\u7ADF\u662F\u4F20\u6284\u7684\u5DEE\u522B\uFF0C\u8FD8\u662F\u770B\u666F\u7684\u5DEE\u522B\uFF1F" : "\u5B57\u5DF2\u7ECF\u8BB0\u4E0B\u3002\u5148\u56DE\u82B1\u6728\u9662\u53D6\u7A7A\u6876\uFF0C\u6536\u597D\u53F6\u7247\uFF0C\u51FA\u56ED\u540E\u5C06\u6876\u4EA4\u8FD8\u4E54\u79BE\uFF0C\u518D\u56DE\u5E9C\u5B66\u6838\u539F\u672C\u3002";
  var leafInBucket = hasStoryFlag(progress, "ly-leaf-carried");
  var draftRoute = new URLSearchParams(location.search).get("draft") === "1";
  var variantLink = document.getElementById("variantHomeLink");
  variantLink.href = leftGarden ? chapterSceneHref("home.html") : leafInBucket ? modernRouteHref("liuyuan-entry.html", "flower", draftRoute, true) : modernRouteHref("liuyuan-study-court.html", "leaf", draftRoute, true);
  variantLink.textContent = leftGarden ? collated ? "\u56DE\u5E9C\u5B66 \xB7 \u91CD\u770B\u539F\u672C" : "\u56DE\u5E9C\u5B66\u4E66\u67B6\u6838\u672C" : leafInBucket ? "\u56DE\u5939\u5F04 \xB7 \u628A\u7A7A\u6876\u4EA4\u8FD8\u4E54\u79BE" : "\u56DE\u4E66\u658B\u95E8\u524D \xB7 \u6CBF\u6765\u8DEF\u53D6\u6876";
  var rewards = document.getElementById("liuyuanRewards");
  rewards.hidden = !hasStoryFlag(progress, "ly-errand-offered");
  document.getElementById("liuyuanWritingReward").textContent = progress.completedTasks.includes("liuyuan-leaf-writing") ? "\u9898\u53F6\u4E34\u5199\uFF1A\u4E66 +1\uFF0C\u9996\u6B21\u5956\u52B1\u5DF2\u9886\u53D6\u3002" : "\u9898\u53F6\u4E34\u5199\uFF1A\u5C1A\u672A\u5B8C\u6210\uFF0C\u6CA1\u6709\u4E66\u827A\u5956\u52B1\u3002";
  document.getElementById("liuyuanGuardReward").textContent = progress.completedTasks.includes("liuyuan-rain-shadow") ? "\u62A4\u753B\u8D70\u4F4D\uFF1A\u5FA1 +1\uFF0C\u9996\u6B21\u5956\u52B1\u5DF2\u9886\u53D6\u3002" : "\u62A4\u753B\u8D70\u4F4D\uFF1A\u5C1A\u672A\u9886\u53D6\u5FA1\u827A\u5956\u52B1\uFF1B\u8FD9\u9879\u6311\u6218\u53EF\u4EE5\u4E0D\u505A\u3002";
  if (hasStoryFlag(progress, "ly-errand-offered")) {
    document.getElementById("chapterTitle").textContent = "\u7559\u56ED \xB7 \u4E00\u652F\u7CA5\u7684\u8DEF";
    document.getElementById("currentObjective").textContent = leftGarden ? collated ? "\u5F02\u6587\u5DF2\u8BB0\u5165\u56ED\u8C31\uFF0C\u53EF\u7EE7\u7EED\u63A2\u7D22" : "\u56DE\u5E9C\u5B66\u4E66\u67B6\uFF0C\u6838\u4E00\u6838\u53F6\u4E0A\u90A3\u4E2A\u5B57" : hasStoryFlag(progress, "ly-leaf-written") ? hasStoryFlag(progress, "ly-leaf-carried") ? "\u8FC7\u95E8\u623F\uFF0C\u4EB2\u624B\u5C06\u7A7A\u6876\u4EA4\u8FD8\u4E54\u79BE" : "\u56DE\u82B1\u6728\u9662\u53D6\u7A7A\u6876\uFF0C\u6536\u597D\u53F6\u7247" : hasStoryFlag(progress, "ly-scholar-trouble-known") ? "\u770B\u770B\u65B0\u53F6\uFF0C\u4EB2\u624B\u8BD5\u5199\u90A3\u4E00\u884C" : hasStoryFlag(progress, "ly-study-found") ? "\u770B\u770B\u6848\u4E0A\u90A3\u884C\u5B57\uFF0C\u518D\u4E0E\u6284\u4E66\u4EBA\u4EA4\u8C08" : hasStoryFlag(progress, "ly-porridge-delivered") ? "\u6CBF\u9662\u8DEF\u63A2\u7D22\uFF0C\u5BFB\u627E\u7FFB\u7EB8\u58F0" : "\u628A\u7CA5\u9001\u5230\u82B1\u623F\u6A90\u4E0B";
  }
  var arts = [
    ["li", "\u793C", "\u5904\u7406\u4EBA\u7269\u5173\u7CFB"],
    ["yue", "\u4E50", "\u8282\u594F\u64CD\u4F5C"],
    ["she", "\u5C04", "\u7784\u51C6\u4E0E\u6295\u63B7"],
    ["yu", "\u5FA1", "\u62A4\u753B\u8D70\u4F4D"],
    ["shu", "\u4E66", "\u9898\u53F6\u4E0E\u4E34\u5199"],
    ["shuMath", "\u6570", "\u63A8\u6F14\u673A\u5173"]
  ];
  var gardens = [
    ["canglang", "\u6CA7\u6D6A\u4EAD"],
    ["wangshi", "\u7F51\u5E08\u56ED"],
    ["zhuozheng", "\u62D9\u653F\u56ED"],
    ["shizilin", "\u72EE\u5B50\u6797"],
    ["liuyuan", "\u7559\u56ED"],
    ["ouyuan", "\u8026\u56ED"],
    ["yipu", "\u827A\u5703"],
    ["huanxiu", "\u73AF\u79C0\u5C71\u5E84"],
    ["tuisi", "\u9000\u601D\u56ED"]
  ];
  var stateLabel = { locked: "\u672A\u89E3\u9501", clue: "\u65B0\u7EBF\u7D22", open: "\u53EF\u5165\u56ED", entered: "\u5DF2\u5165\u56ED", complete: "\u5DF2\u8BBF" };
  var knowledgeLabel = {
    "canglang-double-corridor": "\u6CA7\u6D6A\u4EAD \xB7 \u4E34\u6C34\u590D\u5ECA",
    "moving-view-through-windows": "\u4E09\u7A97 \xB7 \u79FB\u6B65\u6362\u666F",
    "liuyuan-cramped-alley": "\u7559\u56ED \xB7 \u5939\u5F04\u7684\u6536\u653E",
    "liuyuan-magnolia-slip": "\u7559\u56ED \xB7 \u82B1\u5320\u8BF4\u7684\u201C\u7B14\u6811\u201D",
    "liuyuan-garden-note-variant": "\u9898\u53F6 \xB7 \u56ED\u8BB0\u201C\u666F\u540C\uFF0F\u666F\u5F02\u201D\uFF08\u81EA\u62DF\u6545\u4E8B\uFF09",
    "liuyuan-garden-note-collated": "\u6838\u672C \xB7 \u5E9C\u5B66\u85CF\u672C\u786E\u4E3A\u201C\u666F\u540C\u201D\uFF0C\u4E24\u672C\u5DEE\u5F02\u4ECD\u5F85\u67E5",
    "liuyuan-album-orchid-leaf": "\u753B\u518C \xB7 \u6A90\u4E0B\u5170\u7A3F\uFF08\u82B1\u5320\u8D60\u9875\uFF09",
    "liuyuan-drawing-saved": "\u7559\u56ED \xB7 \u62A2\u56DE\u82B1\u5320\u7684\u5170\u7A3F",
    "liuyuan-drawing-smudged": "\u7559\u56ED \xB7 \u6E7F\u7EB8\u667E\u5728\u6A90\u4E0B\uFF0C\u4E66\u658B\u7684\u4EBA\u62A4\u7740\u53E6\u4E00\u5F20\u7EB8",
    "liuyuan-drawing-left": "\u7559\u56ED \xB7 \u9000\u56DE\u6A90\u4E0B\uFF0C\u8BB0\u4F4F\u82B1\u5320\u8BF4\u7684\u7B14\u6811"
  };
  var canglangDone = progress.completedTasks.includes("canglang-three-windows");
  if (!hasStoryFlag(progress, "ly-errand-offered")) {
    document.getElementById("chapterTitle").textContent = canglangDone ? "\u7AE0\u95F4 \xB7 \u65B0\u7684\u58A8\u75D5" : "\u7B2C\u4E00\u7AE0 \xB7 \u6C34\u5916\u6709\u56ED";
    document.getElementById("currentObjective").textContent = canglangDone ? "\u56DE\u5E9C\u5B66\u6574\u7406\u56ED\u8C31\uFF0C\u8FFD\u67E5\u7F51\u5E08\u56ED\u7EBF\u7D22" : "\u4ECE\u5E9C\u5B66\u51FA\u53D1\uFF0C\u5B8C\u6210\u6CA7\u6D6A\u4EAD\u590D\u5ECA\u4E09\u7A97";
  }
  document.getElementById("gardenCount").textContent = `${gardens.filter(([id]) => progress.gardens[id] === "complete").length} / 9`;
  var artsList = document.getElementById("artsList");
  for (const [id, name, verb] of arts) {
    const li = document.createElement("li");
    li.classList.toggle("active", progress.arts[id] > 0);
    li.innerHTML = `<b>${name}</b><span>${progress.arts[id] > 0 && id === "shuMath" ? "\u89C2\u4F4D \xB7 \u521D\u8BC6" : `${verb} \xB7 ${artStage(progress.arts[id])}`}</span>`;
    artsList.append(li);
  }
  var gardenList = document.getElementById("gardenList");
  gardens.forEach(([id, name], index) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><b>${name}</b><em>${stateLabel[progress.gardens[id]]}</em>`;
    gardenList.append(li);
  });
  var knowledgeList = document.getElementById("knowledgeList");
  if (progress.knowledge.length) {
    knowledgeList.innerHTML = "";
    for (const id of progress.knowledge) {
      const item = document.createElement("span");
      item.textContent = knowledgeLabel[id] ?? id;
      knowledgeList.append(item);
    }
  }
})();
