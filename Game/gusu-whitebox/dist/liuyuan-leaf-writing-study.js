"use strict";
(() => {
  // src/core/liuyuan-leaf-trace.ts
  var LEAF_TRACE_PATHS = [
    [{ x: 276, y: 268 }, { x: 308, y: 268 }, { x: 308, y: 294 }, { x: 288, y: 294 }],
    [{ x: 394, y: 261 }, { x: 394, y: 235 }, { x: 424, y: 235 }, { x: 424, y: 257 }],
    [{ x: 520, y: 211 }, { x: 552, y: 211 }, { x: 552, y: 235 }]
  ];
  function leafTraceView(index) {
    const path = LEAF_TRACE_PATHS[index];
    const xs = path.map((point) => point.x), ys = path.map((point) => point.y);
    return {
      x: (Math.min(...xs) + Math.max(...xs)) / 2 - 100,
      y: (Math.min(...ys) + Math.max(...ys)) / 2 - 56.25,
      w: 200,
      h: 112.5
    };
  }
  var distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function beginLeafTrace(path, point = path[0]) {
    return distance(point, path[0]) <= 12 ? { node: 0, point, failed: false } : null;
  }
  function traceFinished(trace2, path) {
    return !trace2.failed && trace2.node === path.length - 1;
  }
  function moveLeafTrace(trace2, path, point) {
    if (trace2.failed || traceFinished(trace2, path)) return trace2;
    const a = path[trace2.node], b = path[trace2.node + 1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)));
    const onPath = { x: a.x + t * dx, y: a.y + t * dy };
    if (distance(point, onPath) > 12 || distance(point, trace2.point) > 48)
      return { ...trace2, failed: true };
    return { node: distance(point, b) <= 7 ? trace2.node + 1 : trace2.node, point, failed: false };
  }
  function nextTraceDirection(trace2, path) {
    if (trace2.failed || traceFinished(trace2, path)) return null;
    const a = path[trace2.node], b = path[trace2.node + 1];
    return b.x > a.x ? "right" : b.x < a.x ? "left" : b.y > a.y ? "down" : "up";
  }
  function stepLeafTrace(trace2, path, direction) {
    if (!nextTraceDirection(trace2, path)) return trace2;
    return direction === nextTraceDirection(trace2, path) ? moveLeafTrace(trace2, path, path[trace2.node + 1]) : { ...trace2, failed: true };
  }

  // src/core/liuyuan-leaf-writing-study.ts
  var INITIAL_LEAF_STUDY = { phase: "choose", strokes: 0, oldLeafSeen: false, inkSeen: false };
  function advanceLeafStudy(state, action) {
    if (action === "retry") return { state: INITIAL_LEAF_STUDY, line: "\u98CE\u5439\u8FC7\u53F6\u7F18\u3002\u518D\u6311\u4E00\u7247\uFF0C\u4ECE\u5934\u8BD5\u3002" };
    if (state.phase === "choose") {
      if (action === "old") return { state: { ...state, oldLeafSeen: true }, line: "\u8001\u53F6\u8FB9\u7F18\u5F00\u4E86\u53E3\uFF1B\u624D\u63E1\u4F4F\u53F6\u67C4\uFF0C\u88C2\u53E3\u53C8\u5F80\u91CC\u8D70\u4E86\u4E00\u5BF8\u3002" };
      if (action === "new") return { state: { ...state, phase: "trial" }, line: "\u65B0\u53F6\u97E7\uFF0C\u53F6\u8109\u5C1A\u633A\u3002\u4F60\u62E3\u4E0B\u8FD9\u4E00\u7247\u3002" };
    }
    if (state.phase === "trial" && action === "test-ink") return {
      state: { ...state, phase: "support", inkSeen: true },
      line: "\u7B14\u5C16\u4E00\u6309\uFF0C\u58A8\u987A\u7740\u53F6\u8109\u6D07\u5F00\u3002\u8FD9\u6837\u5199\uFF0C\u8BB0\u4E0D\u4F4F\u90A3\u53E5\u5F02\u6587\u3002"
    };
    if (state.phase === "support") {
      if (action === "hard-write") return { state, line: "\u53F6\u9762\u8FD8\u5728\u6643\uFF0C\u58A8\u75D5\u6563\u4E86\u3002\u518D\u7528\u529B\u53EA\u4F1A\u5212\u7834\u5B83\u3002" };
      if (action === "take-board") return {
        state: { ...state, phase: "write" },
        line: "\u5899\u6839\u4E00\u5757\u65E7\u6F06\u677F\u3002\u4F60\u628A\u53F6\u5B50\u94FA\u5E73\uFF0C\u677F\u53EA\u7A33\u4F4F\u4E86\u624B\uFF1B\u58A8\u80FD\u5426\u7559\u4F4F\uFF0C\u8FD8\u5F97\u5C0F\u5FC3\u8BD5\u3002"
      };
    }
    if (state.phase === "write" && action === "stroke") {
      const strokes = Math.min(3, state.strokes + 1);
      return strokes === 3 ? { state: { ...state, phase: "done", strokes }, line: "\u672B\u7B14\u6536\u4F4F\u3002\u4F60\u628A\u53F6\u8FB9\u538B\u5E73\uFF0C\u5939\u8FDB\u8896\u91CC\uFF0C\u6CA1\u6709\u6298\u3002" } : { state: { ...state, strokes }, line: strokes === 1 ? "\u5148\u4ECE\u53F6\u67C4\u4E00\u4FA7\u843D\u7B14\u3002\u7B14\u52BF\u8F7B\u4E9B\u3002" : "\u58A8\u8FF9\u8FD8\u6E7F\u3002\u4F59\u4E0B\u7684\u4E00\u5904\uFF0C\u522B\u78B0\u5230\u521A\u5199\u8FC7\u7684\u5730\u65B9\u3002" };
    }
    return { state, line: "" };
  }

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
  function hasStoryFlag(progress, flag) {
    const alias = FLAG_ALIASES[flag];
    return progress.storyFlags.includes(flag) || !!alias && progress.storyFlags.includes(alias);
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

  // src/core/liuyuan-modern-route.ts
  function modernRouteHref(page, from, draft = false, returning = false) {
    const query = new URLSearchParams({ route: "modern", from });
    if (draft) query.set("draft", "1");
    if (returning) query.set("return", "1");
    carryLiuyuanPlaytest(query);
    return `${page}?${query}`;
  }
  function canEnterModernRoute(search, progress, from, prerequisite) {
    const query = new URLSearchParams(search);
    return query.get("route") === "modern" && query.get("from") === from && hasStoryFlag(progress, prerequisite);
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
    const requiredFlag = flag === "ly-gate-passed" ? "ly-errand-offered" : index > 0 ? LIUYUAN_CHAPTER_FLAGS[index - 1] : void 0;
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
  function commitLiuyuanChapterFlag(flag) {
    const result = advanceLiuyuanChapter(loadProgress(), flag);
    if (result.applied) saveProgress(result.progress);
    return result;
  }

  // src/core/liuyuan-leaf-resume.ts
  var leafResumeKey = (playtest2) => `gusu:liuyuan-leaf:reload-v1:${playtest2 ? "playtest" : "campaign"}`;
  var leafProgressStamp = (progress) => JSON.stringify([
    progress.updatedAt,
    progress.storyFlags,
    progress.completedTasks
  ]);
  function parseLeafResume(raw, progress) {
    if (!raw || !progress.storyFlags.includes("ly-scholar-trouble-known") || progress.storyFlags.includes("ly-leaf-written")) return null;
    try {
      const value = JSON.parse(raw);
      if (!value || value.version !== 1 || value.progressStamp !== leafProgressStamp(progress)) return null;
      const state = value.state;
      if (!state || !["choose", "trial", "support", "write"].includes(state.phase) || !Number.isInteger(state.strokes) || state.strokes < 0 || state.strokes > 2 || typeof state.oldLeafSeen !== "boolean" || typeof state.inkSeen !== "boolean") return null;
      if (state.phase !== "write" && state.strokes !== 0) return null;
      if (state.inkSeen !== (state.phase === "support" || state.phase === "write")) return null;
      if (state.phase !== "choose" && !progress.storyFlags.includes("ly-leaf-picked")) return null;
      return { phase: state.phase, strokes: state.strokes, oldLeafSeen: state.oldLeafSeen, inkSeen: state.inkSeen };
    } catch {
      return null;
    }
  }
  function readLeafResume(playtest2, progress) {
    try {
      return parseLeafResume(sessionStorage.getItem(leafResumeKey(playtest2)), progress);
    } catch {
      return null;
    }
  }
  function writeLeafResume(playtest2, progress, state) {
    try {
      if (state.phase === "done") sessionStorage.removeItem(leafResumeKey(playtest2));
      else sessionStorage.setItem(leafResumeKey(playtest2), JSON.stringify({
        version: 1,
        progressStamp: leafProgressStamp(progress),
        state
      }));
    } catch {
    }
  }

  // src/liuyuan-leaf-writing-study.ts
  var canvas = document.getElementById("leafScene");
  var ctx = canvas.getContext("2d");
  var status = document.getElementById("leafStatus");
  var hint = document.getElementById("operationHint");
  var routeNotice = document.getElementById("routeNotice");
  var modeBadge = document.getElementById("modeBadge");
  var returnToCourt = document.getElementById("returnToCourt");
  var returnFromDone = document.getElementById("returnFromDone");
  var variantWords = document.getElementById("variantWords");
  var draftRequested = new URLSearchParams(location.search).get("draft") === "1";
  var modernChapter = canEnterModernRoute(location.search, loadProgress(), "study-interior", "ly-scholar-trouble-known");
  if (modernChapter) {
    modeBadge.textContent = "\u7559\u56ED\u7AE0 \xB7 \u9898\u53F6\u9053\u5177\u7279\u5199 / \u6E38\u620F\u6F14\u7ECE";
    routeNotice.textContent = "\u8FD9\u662F\u865A\u6784\u4EFB\u52A1\u7684\u8FD1\u666F\u64CD\u4F5C\uFF0C\u4E0D\u662F\u6E05\u672B\u7559\u56ED\u8549\u682A\u6216\u4E66\u5199\u6750\u6599\u7684\u590D\u539F\u3002\u65E7\u6F06\u677F\u4EC5\u5E2E\u52A9\u89D2\u8272\u7A33\u4F4F\u53F6\u7247\uFF1B\u771F\u5B9E\u58A8\u8272\u3001\u8010\u4E45\u4E0E\u6F06\u677F\u6258\u53F6\u6548\u679C\u5C1A\u672A\u5B9E\u6D4B\u3002\u6000\u7D20\u4F20\u8BB0\u5206\u522B\u8BB0\u8549\u53F6\u548C\u6F06\u677F\u5199\u5B57\uFF0C\u5E76\u672A\u8BF4\u4EE5\u677F\u6258\u53F6\u3002";
    returnToCourt.href = modernRouteHref("liuyuan-study-court.html", "leaf", draftRequested, true);
    returnFromDone.href = returnToCourt.href;
  }
  var controls = {
    choose: document.getElementById("chooseControls"),
    trial: document.getElementById("trialControls"),
    support: document.getElementById("supportControls"),
    write: document.getElementById("strokeControls"),
    done: document.getElementById("doneControls")
  };
  var playtest = isLiuyuanPlaytest();
  var resumed = modernChapter ? readLeafResume(playtest, loadProgress()) : null;
  var study = modernChapter && hasStoryFlag(loadProgress(), "ly-leaf-written") ? { phase: "done", strokes: 3, oldLeafSeen: false, inkSeen: true } : resumed ?? (modernChapter && hasStoryFlag(loadProgress(), "ly-leaf-picked") ? { phase: "trial", strokes: 0, oldLeafSeen: false, inkSeen: false } : INITIAL_LEAF_STUDY);
  if (study.phase === "done") status.textContent = "\u8FD9\u7247\u53F6\u5DF2\u7ECF\u9898\u597D\u3002\u6CBF\u6765\u8DEF\u56DE\u4E66\u658B\u9662\uFF0C\u53BB\u53D6\u7A7A\u6876\u3002";
  else if (resumed) status.textContent = study.phase === "write" ? `\u5DF2\u5199\u597D\u7684 ${study.strokes} \u6BB5\u4ECD\u5728\u3002\u4ECE\u7B2C ${study.strokes + 1} \u6BB5\u4EAE\u70B9\u91CD\u65B0\u843D\u7B14\u3002` : "\u53F6\u7247\u8FD8\u5728\u624B\u8FB9\uFF0C\u63A5\u7740\u521A\u624D\u7684\u64CD\u4F5C\u3002";
  function saveLeafCheckpoint() {
    if (modernChapter) writeLeafResume(playtest, loadProgress(), study);
  }
  if (study.phase === "done") saveLeafCheckpoint();
  window.addEventListener("pagehide", saveLeafCheckpoint);
  var trace = null;
  var tracePointer = null;
  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }
  function polygon(points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    ctx.fill();
  }
  function drawLeaf() {
    const view = study.phase === "write" ? leafTraceView(study.strokes) : { x: 0, y: 0, w: 800, h: 450 };
    ctx.setTransform(canvas.width / view.w, 0, 0, canvas.height / view.h, -view.x * canvas.width / view.w, -view.y * canvas.height / view.h);
    const writing = study.phase === "write" || study.phase === "done";
    const board = writing ? "#594332" : "#536450";
    rect(0, 0, 800, 450, "#202b27");
    for (let y = 0; y < 450; y += 24) rect(0, y, 800, 2, "#293931");
    rect(90, 345, 630, 22, "#73604a");
    rect(112, 366, 590, 15, "#4c3d30");
    if (writing) {
      rect(132, 157, 540, 205, "#2a241f");
      rect(142, 150, 520, 200, board);
      rect(149, 157, 506, 186, "#66513c");
    } else {
      rect(165, 167, 465, 175, "#465841");
      rect(175, 174, 445, 161, board);
    }
    polygon([[149, 303], [206, 289], [215, 302], [150, 317]], "#899c62");
    polygon([
      [206, 290],
      [243, 239],
      [323, 194],
      [431, 174],
      [548, 183],
      [636, 214],
      [657, 231],
      [613, 253],
      [535, 286],
      [424, 313],
      [326, 321],
      [250, 310]
    ], "#354f35");
    polygon([
      [211, 289],
      [251, 246],
      [334, 205],
      [430, 184],
      [545, 191],
      [633, 215],
      [646, 229],
      [607, 245],
      [532, 273],
      [421, 302],
      [324, 310],
      [250, 301]
    ], study.phase === "choose" ? "#657753" : "#63825a");
    polygon([[238, 285], [286, 241], [382, 210], [497, 198], [592, 211], [635, 226], [554, 224], [443, 246], [331, 278]], "#83a276");
    polygon([[235, 296], [315, 277], [415, 249], [531, 230], [642, 225], [531, 238], [417, 260], [317, 290]], "#b2ba81");
    for (let i = 0; i < 5; i++) {
      const x = 289 + i * 64, y = 282 - i * 11;
      polygon([[x, y], [x + 18, y - 45], [x + 26, y - 50], [x + 10, y - 6]], "#526f4b");
      polygon([[x, y], [x + 25, y + 24], [x + 34, y + 17], [x + 8, y - 4]], "#506a49");
    }
    if (study.phase === "choose") {
      polygon([
        [65, 157],
        [104, 112],
        [161, 91],
        [213, 98],
        [279, 124],
        [303, 139],
        [248, 151],
        [206, 166],
        [158, 173],
        [112, 167]
      ], "#706f47");
      polygon([[89, 148], [121, 117], [171, 104], [223, 116], [278, 137], [220, 139], [164, 159]], "#8a8954");
      rect(98, 157, 62, 6, "#a58d5b");
      polygon([[231, 111], [240, 107], [236, 137], [224, 141]], "#202b27");
      polygon([[257, 124], [266, 121], [255, 148], [245, 152]], "#202b27");
    }
    if (study.inkSeen && !writing) {
      rect(376, 252, 13, 9, "#242f27");
      rect(391, 259, 19, 6, "#2b3a30");
      rect(413, 264, 8, 16, "#2c3830");
    }
    if (writing) {
      LEAF_TRACE_PATHS.forEach((path, index) => {
        for (let segment = 0; segment < path.length - 1; segment++) {
          const a = path[segment], b = path[segment + 1];
          const ink = index < study.strokes || index === study.strokes && trace && segment < trace.node;
          const color = ink ? "#213b34" : index === study.strokes ? "#d7c79a" : "#829078";
          const count = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
          for (let step = 0; step <= count; step += 2)
            rect(Math.round(a.x + (b.x - a.x) * step / count) - 2, Math.round(a.y + (b.y - a.y) * step / count) - 2, 4, 4, color);
        }
        if (index === study.strokes && study.phase === "write") {
          const point = trace?.point ?? path[0];
          if (trace && trace.node < path.length - 1) {
            const from = path[trace.node], length = Math.max(Math.abs(point.x - from.x), Math.abs(point.y - from.y));
            for (let step = 0; step < length; step += 2)
              rect(Math.round(from.x + (point.x - from.x) * step / length) - 2, Math.round(from.y + (point.y - from.y) * step / length) - 2, 4, 4, "#213b34");
          }
          rect(point.x - 4, point.y - 4, 8, 8, "#f3e2a4");
          rect(path[path.length - 1].x - 3, path[path.length - 1].y - 3, 6, 6, "#c19c71");
        }
      });
    }
    if (study.phase === "done") {
      rect(579, 279, 45, 12, "#c6b693");
      rect(619, 282, 13, 6, "#5a4336");
    }
  }
  function render() {
    for (const [phase, element] of Object.entries(controls)) element.hidden = phase !== study.phase;
    variantWords.textContent = study.phase === "done" ? `\u53F6\u4E0A\u8BB0\u4E0B\uFF1A\u201C${LIUYUAN_TEXT_VARIANT.copyist}\u201D\u56DE\u5E9C\u5B66\u518D\u5BF9\u539F\u672C\uFF0C\u5148\u4E0D\u66FF\u8FD9\u4E00\u4E2A\u5B57\u4E0B\u7ED3\u8BBA\u3002` : `\u8981\u5E26\u8D70\u7684\u539F\u53E5\uFF1A\u201C${LIUYUAN_TEXT_VARIANT.copyist}\u201D\u4F60\u8BB0\u5F97\u5E9C\u5B66\u672C\u662F\u201C\u666F\u540C\u201D\u3002\u5148\u7167\u6240\u89C1\u8BB0\u4E0B\uFF0C\u4E0D\u80FD\u51ED\u5370\u8C61\u6539\u5B57\u3002`;
    hint.textContent = study.phase === "write" ? `\u7B2C ${study.strokes + 1}/3 \u6BB5\uFF1A\u4ECE\u4EAE\u70B9\u6309\u4F4F\uFF0C\u6CBF\u6D45\u8272\u7B14\u8DEF\u62D6\u5230\u672B\u7AEF\u518D\u62AC\u624B\u3002\u952E\u76D8\u6309 ${study.strokes + 1} \u843D\u7B14\uFF0C\u7528\u65B9\u5411\u952E\u6CBF\u7B14\u8DEF\u7EED\u5199\u3002\u65E0\u8BA1\u65F6\uFF0C\u504F\u51FA\u53EA\u91CD\u8BD5\u672C\u6BB5\u3002` : study.phase === "done" ? modernChapter ? "\u9898\u53F6\u6536\u597D\u3002\u7B49\u58A8\u7A0D\u5B9A\uFF0C\u56DE\u4E66\u658B\u9662\uFF0C\u6CBF\u6765\u8DEF\u53BB\u53D6\u7A7A\u6876\u3002" : "\u6B64\u7814\u7A76\u5C0F\u6837\u5230\u6B64\u4E3A\u6B62\uFF1B\u72EC\u7ACB\u7EC3\u4E60\u4E0D\u5199\u7AE0\u8282\u5B58\u6863\u6216\u516D\u827A\u3002" : "\u952E\u76D8\u6309\u6570\u5B57 1\u30012 \u9009\u62E9\uFF1B\u89E6\u5C4F\u53EF\u70B9\u6309\u94AE\u3002\u5931\u624B\u4E0D\u4F1A\u6263\u5206\u3002";
    drawLeaf();
  }
  function act(action) {
    trace = null;
    tracePointer = null;
    const wasChoosing = study.phase === "choose";
    const next = advanceLeafStudy(study, action);
    study = next.state;
    if (modernChapter && wasChoosing && action === "new" && study.phase === "trial")
      commitLiuyuanChapterFlag("ly-leaf-picked");
    const awarded = modernChapter && study.phase === "done" && action === "stroke" ? commitLiuyuanChapterFlag("ly-leaf-written").applied : false;
    if (next.line) status.textContent = next.line;
    if (modernChapter && study.phase === "done" && hasStoryFlag(loadProgress(), "ly-leaf-written"))
      status.textContent += `${awarded ? " \u4E66 +1\u3002" : " \u8FD9\u7247\u53F6\u7684\u4E66\u827A\u5956\u52B1\u5DF2\u9886\u53D6\u3002"}\u7EB8\u7559\u5728\u4ED6\u6848\u4E0A\uFF0C\u4F60\u628A\u8BB0\u4E0B\u7684\u90A3\u53E5\u5E26\u8D70\u3002`;
    saveLeafCheckpoint();
    render();
  }
  function stroke(index) {
    if (study.phase !== "write") return;
    if (index !== study.strokes) {
      status.textContent = index < study.strokes ? "\u8FD9\u5904\u58A8\u8FF9\u8FD8\u6E7F\u3002\u522B\u518D\u78B0\uFF0C\u6CBF\u53F6\u8109\u5F80\u524D\u3002" : "\u5148\u4ECE\u53F6\u67C4\u4E00\u4FA7\u5199\u8D77\uFF0C\u5B57\u624D\u6709\u5730\u65B9\u6392\u3002";
      return;
    }
    if (tracePointer !== null) return;
    trace = beginLeafTrace(LEAF_TRACE_PATHS[study.strokes]);
    status.textContent = "\u7B14\u5C16\u843D\u5728\u4EAE\u70B9\u3002\u770B\u6E05\u7B14\u8DEF\uFF0C\u7528\u65B9\u5411\u952E\u7EED\u5199\u3002";
    render();
  }
  document.querySelectorAll("[data-leaf-action]").forEach((button) => {
    button.addEventListener("click", () => act(button.dataset.leafAction));
  });
  document.querySelectorAll("[data-stroke]").forEach((button) => {
    button.addEventListener("click", () => stroke(Number(button.dataset.stroke)));
  });
  function abandonTrace(words) {
    trace = null;
    tracePointer = null;
    if (study.phase === "write") {
      status.textContent = words;
      render();
    }
  }
  function pointerPoint(event) {
    const box = canvas.getBoundingClientRect();
    const view = leafTraceView(study.strokes);
    return { x: view.x + (event.clientX - box.left) * view.w / box.width, y: view.y + (event.clientY - box.top) * view.h / box.height };
  }
  canvas.addEventListener("pointerdown", (event) => {
    if (study.phase !== "write" || tracePointer !== null || event.button !== void 0 && event.button !== 0) return;
    event.preventDefault();
    const next = beginLeafTrace(LEAF_TRACE_PATHS[study.strokes], pointerPoint(event));
    if (!next) {
      status.textContent = "\u5148\u5728\u4EAE\u70B9\u843D\u7B14\uFF0C\u518D\u6CBF\u7B14\u8DEF\u5199\u3002";
      return;
    }
    trace = next;
    tracePointer = event.pointerId;
    canvas.setPointerCapture(event.pointerId);
    render();
  });
  canvas.addEventListener("pointermove", (event) => {
    if (event.pointerId !== tracePointer || !trace || study.phase !== "write") return;
    event.preventDefault();
    trace = moveLeafTrace(trace, LEAF_TRACE_PATHS[study.strokes], pointerPoint(event));
    if (trace.failed) {
      abandonTrace("\u7B14\u5C16\u504F\u51FA\u53BB\u4E86\u3002\u5DF2\u5199\u597D\u7684\u6BB5\u843D\u8FD8\u5728\uFF0C\u4ECE\u672C\u6BB5\u4EAE\u70B9\u518D\u6765\u3002");
      return;
    }
    render();
  });
  canvas.addEventListener("pointerup", (event) => {
    if (event.pointerId !== tracePointer || !trace || study.phase !== "write") return;
    event.preventDefault();
    trace = moveLeafTrace(trace, LEAF_TRACE_PATHS[study.strokes], pointerPoint(event));
    const finished = traceFinished(trace, LEAF_TRACE_PATHS[study.strokes]);
    tracePointer = null;
    if (finished) act("stroke");
    else abandonTrace("\u8FD9\u4E00\u7B14\u8FD8\u6CA1\u6709\u5199\u5230\u672B\u7AEF\u3002\u4ECE\u4EAE\u70B9\u63A5\u7740\u8BD5\uFF0C\u524D\u9762\u5199\u597D\u7684\u4E0D\u52A8\u3002");
  });
  for (const type of ["pointercancel", "lostpointercapture"]) canvas.addEventListener(type, (event) => {
    if (event.pointerId === tracePointer) abandonTrace("\u5148\u6536\u7B14\uFF0C\u672C\u6BB5\u7A0D\u540E\u518D\u8BD5\u3002");
  });
  window.addEventListener("blur", () => abandonTrace("\u5148\u6536\u7B14\uFF0C\u672C\u6BB5\u7A0D\u540E\u518D\u8BD5\u3002"));
  function traceDirection(direction) {
    if (study.phase !== "write" || !trace || tracePointer !== null) return;
    trace = stepLeafTrace(trace, LEAF_TRACE_PATHS[study.strokes], direction);
    if (trace.failed) abandonTrace("\u65B9\u5411\u504F\u4E86\u3002\u770B\u7740\u6D45\u8272\u7B14\u8DEF\uFF0C\u4ECE\u672C\u6BB5\u4EAE\u70B9\u91CD\u5199\u3002");
    else if (traceFinished(trace, LEAF_TRACE_PATHS[study.strokes])) act("stroke");
    else {
      status.textContent = "\u8FD9\u4E00\u8F6C\u6536\u7A33\u4E86\uFF0C\u6CBF\u4E0B\u4E00\u6BB5\u7B14\u8DEF\u7EED\u5199\u3002";
      render();
    }
  }
  document.querySelectorAll("[data-trace-dir]").forEach((button) => {
    button.addEventListener("click", () => traceDirection(button.dataset.traceDir));
  });
  window.addEventListener("keydown", (event) => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    const direction = { ArrowUp: "up", ArrowRight: "right", ArrowDown: "down", ArrowLeft: "left" }[event.key];
    if (study.phase === "write" && direction) {
      event.preventDefault();
      traceDirection(direction);
      return;
    }
    if (!["1", "2", "3"].includes(event.key)) return;
    const index = Number(event.key) - 1;
    if (study.phase === "write") {
      event.preventDefault();
      stroke(index);
      return;
    }
    const actions = {
      choose: ["old", "new"],
      trial: ["test-ink"],
      support: ["hard-write", "take-board"]
    };
    const action = actions[study.phase]?.[index];
    if (action) {
      event.preventDefault();
      act(action);
    }
  });
  render();
})();
