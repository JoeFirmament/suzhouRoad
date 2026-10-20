"use strict";
(() => {
  // src/core/geometry.ts
  var STANDARD_PLAYER_PROFILE = {
    halfW: 4,
    topInset: 6,
    bottomInset: 1
  };

  // src/core/liuyuan-entry-flow.ts
  var LIUYUAN_ALLEY_CHECKPOINTS = [
    { x: 520, y: 550, label: "\u524D\u5385" },
    { x: 520, y: 480, label: "\u7B2C\u4E00\u5929\u4E95" },
    { x: 520, y: 400, label: "\u72ED\u5ECA" },
    { x: 430, y: 400, label: "\u897F\u6298" },
    { x: 430, y: 374, label: "\u7B2C\u4E8C\u5C0F\u5EAD" },
    { x: 430, y: 300, label: "\u5317\u5411\u7A84\u5ECA" },
    { x: 430, y: 250, label: "\u53E4\u6728\u4EA4\u67EF\u9644\u8FD1" }
  ];
  var LIUYUAN_ENTRY_COURT_EXIT = { x: 290, y: 232 };
  var LIUYUAN_ENTRY_REQUIRED_FEET = [
    { id: "\u95E8\u5916", x: 520, y: 656, radius: 10, mustStand: true },
    { id: "\u95E8\u69DB\u5185", x: 520, y: 614, radius: 18 },
    ...LIUYUAN_ALLEY_CHECKPOINTS.map((foot) => ({
      ...foot,
      id: foot.label,
      radius: 24,
      mustStand: foot.x === 430 && foot.y === 250
    })),
    { id: "\u7A97\u524D", x: 420, y: 232, radius: 24 },
    { id: "\u897F\u6298\u5C0F\u5EAD\u53E3", x: 340, y: 232, radius: 24 },
    { id: "\u53E4\u6728\u4EA4\u67EF\u8F6C\u573A", ...LIUYUAN_ENTRY_COURT_EXIT, radius: 24, mustStand: true }
  ];
  function advanceAlleyCheckpoint(index, x, y, radius = 24) {
    const next = LIUYUAN_ALLEY_CHECKPOINTS[index];
    if (!next) return index;
    return Math.hypot(x - next.x, y - next.y) <= radius ? index + 1 : index;
  }
  function alleyWalkComplete(index) {
    return index >= LIUYUAN_ALLEY_CHECKPOINTS.length;
  }
  var LIUYUAN_ALLEY_RETURN_CHECKPOINTS = [
    { x: 340, y: 232, label: "\u5C0F\u5EAD\u897F\u6298\u53E3" },
    { x: 420, y: 232, label: "\u5317\u5899\u7A97\u524D" },
    { x: 430, y: 250, label: "\u6B47\u6876\u5904" },
    { x: 430, y: 300, label: "\u5317\u5411\u7A84\u5ECA" },
    { x: 430, y: 374, label: "\u7B2C\u4E8C\u5C0F\u5EAD" },
    { x: 430, y: 400, label: "\u897F\u6298" },
    { x: 520, y: 400, label: "\u72ED\u5ECA" },
    { x: 520, y: 480, label: "\u7B2C\u4E00\u5929\u4E95" },
    { x: 520, y: 550, label: "\u524D\u5385" },
    { x: 520, y: 614, label: "\u95E8\u69DB\u5185" },
    { x: 520, y: 656, label: "\u95E8\u5916" }
  ];
  function advanceAlleyReturnCheckpoint(index, x, y, radius = 24) {
    const next = LIUYUAN_ALLEY_RETURN_CHECKPOINTS[index];
    if (!next) return index;
    const effectiveRadius = index === LIUYUAN_ALLEY_RETURN_CHECKPOINTS.length - 1 ? Math.min(radius, 10) : radius;
    return Math.hypot(x - next.x, y - next.y) <= effectiveRadius ? index + 1 : index;
  }
  function alleyReturnComplete(index) {
    return index >= LIUYUAN_ALLEY_RETURN_CHECKPOINTS.length;
  }
  function canCompleteLiuyuanReturn(index, gateAnswered2) {
    return gateAnswered2 && alleyReturnComplete(index);
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
  function resetProgress() {
    const progress = cloneDefault();
    saveProgress(progress);
    return progress;
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
  function commitLiuyuanChapterFlag(flag) {
    const result = advanceLiuyuanChapter(loadProgress(), flag);
    if (result.applied) saveProgress(result.progress);
    return result;
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

  // src/data/tiles.ts
  var T = {
    GRASS: 0,
    PATH: 1,
    WATER: 2,
    WALL: 3,
    // 粉墙（实心）
    CORR: 4,
    // 廊内地面
    ROCK: 5,
    // 假山
    TREE: 6,
    PLAT: 7,
    // 台地/水榭平台
    BRIDGE: 8,
    // 石桥（可走）
    FLOWER: 9,
    // 花境（装饰，可走）
    WIN: 10,
    // 漏窗（墙上的窗，实心；取景点在廊内对侧）
    // —— P2 试铺段新增（词表 tile-lexicon-canglang #1-18 落地）——
    DIRT: 11,
    // 假山蹬道泥土路（可走）
    RAIL: 12,
    // 临水石栏（实心）
    ROOF: 13,
    // 建筑屋顶（面水轩/观鱼处/石亭，实心）
    PAV: 14,
    // 亭前平台（可走）
    BAMBOO: 15
    // 竹林（实心，翠玲珑/看山楼周边）
  };
  var SOLID = /* @__PURE__ */ new Set([
    T.WALL,
    T.WATER,
    T.ROCK,
    T.TREE,
    T.WIN,
    T.RAIL,
    T.ROOF,
    T.BAMBOO
  ]);

  // src/config.ts
  var TILE = 16;
  var MAP_W = 80;
  var MAP_H = 50;
  var PALETTE = {
    paper: "#f2ead6",
    // 宣纸底
    grass: "#bcd6a4",
    grassAlt: "#b3cf9b",
    path: "#e6dcc2",
    pathAlt: "#d8ceae",
    water: "#9ecfc9",
    waterHi: "#c2e0da",
    wall: "#fbf7ec",
    wallShade: "#d9d2c0",
    roof: "#b8b2a2",
    roofDark: "#a8a292",
    wood: "#8a6844",
    zhu: "#b03a2e",
    // 朱红点睛（唯一重色）
    qing: "#3d7068",
    // 青水/判定 UI
    rockTop: "#b0bfa8",
    rockBase: "#93a48c",
    rockDark: "#78876f",
    leafHi: "#9cc487",
    leafMid: "#8fbb78",
    leafDark: "#7fae6a",
    ink: "#2b2824",
    gold: "#c8a04b",
    // —— P0-1 色板增补 10 色（2026-09-27，色源：assets/palette/palette.json）——
    inkPale: "#a39d90",
    // 淡墨
    inkMid: "#7e796d",
    // 中墨
    inkHeavy: "#55524a",
    // 重墨
    stele: "#171512",
    // 碑墨（拓片最深）
    waterDeep: "#6fa89e",
    // 水深
    qingDeep: "#2a514c",
    // 深潭/夜水
    woodDark: "#6b4c2f",
    // 木影
    zhuBright: "#d95543",
    // 朱亮
    sealRed: "#8f271d",
    // 印泥深红
    pine: "#5f7d4f",
    // 松柏深叶
    // —— v3 风格基线增补 8 色（2026-09-28，参考小飞虹 2.5D 像素画：浓郁饱和基调）——
    roofChar: "#4e4c45",
    // 瓦炭（坡面主色，深灰瓦）
    roofRidge: "#33322d",
    // 脊墨
    waterTeal: "#5b9484",
    // 饱和青绿水
    waterTealDeep: "#3c6e63",
    // 青绿深水
    waterGlow: "#a5cdb4",
    // 水面波光
    leafSat: "#71b054",
    // 饱和叶
    leafDeep: "#4c8a42",
    // 深叶
    willow: "#8fc065"
    // 柳黄
  };
  var TYPE_LAYERS = {
    /** 世界文字（清末故事层）：台词、匾额、题跋原文、诗卡正文。最"在场"的一层。 */
    world: {
      font: '"Songti SC","STSong","Noto Serif SC",serif',
      ink: PALETTE.ink,
      // 焦墨 #2b2824
      size: 15
    },
    /** 玩家手迹：玩家自己写的字（题跋、落款、抄联）。墨与正文同浓，但**是手写体**，且**必带朱印**。 */
    hand: {
      font: '"Kaiti SC","STKaiti","KaiTi","Noto Serif CJK SC",serif',
      ink: PALETTE.ink,
      // 焦墨 #2b2824（同正文浓度——玩家写的字不打折）
      size: 16,
      seal: PALETTE.zhu
      // 朱印 #b03a2e（全作唯一重色）
    },
    /** 今按（后世之评）：不在世界观之内的一层。**七个分离信号**见 annotation.ts 文件头。 */
    annote: {
      font: '"Songti SC","STSong","Noto Serif SC",serif',
      // 印刷体（"印"出来的，不是"写"出来的）
      ink: PALETTE.inkHeavy,
      // 重墨 #55524a —— 比正文轻一档，不夺正文的权威
      size: 12,
      // 小一号
      lineHeight: 1.75,
      label: "\u4ECA\u6309",
      // 起首二字（规格 5）
      labelInk: PALETTE.inkMid,
      // 中墨 #7e796d
      rule: PALETTE.inkPale,
      // 左侧界行 #a39d90（古籍版框界行的意译）
      ground: PALETTE.wall
      // 贴条纸底 #fbf7ec —— 比正文纸更亮更冷，"从别处来的一张纸"
    }
  };

  // src/core/physics.ts
  var DEFAULT_PROFILE = STANDARD_PLAYER_PROFILE;
  function solidAt(map, px, py, w, h) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= w || ty >= h) return true;
    return SOLID.has(map[ty * w + tx]);
  }
  function collidesRect(x, y, rect, profile) {
    const left = x - profile.halfW, right = x + profile.halfW;
    const top = y - profile.topInset, bottom = y - profile.bottomInset;
    return right > rect.x && left < rect.x + rect.w && bottom > rect.y && top < rect.y + rect.h;
  }
  function isRect(shape) {
    return "x" in shape;
  }
  function project(points, axisX, axisY) {
    let min = Infinity, max = -Infinity;
    for (const [x, y] of points) {
      const value = x * axisX + y * axisY;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
    return [min, max];
  }
  function convexPolygonsOverlap(a, b) {
    for (const polygon of [a, b]) {
      for (let index = 0; index < polygon.length; index++) {
        const p = polygon[index], q = polygon[(index + 1) % polygon.length];
        const axisX = -(q[1] - p[1]), axisY = q[0] - p[0];
        const [minA, maxA] = project(a, axisX, axisY);
        const [minB, maxB] = project(b, axisX, axisY);
        if (maxA <= minB || maxB <= minA) return false;
      }
    }
    return true;
  }
  function collidesShape(x, y, shape, profile) {
    if (isRect(shape)) return collidesRect(x, y, shape, profile);
    if (shape.points.length < 3) return false;
    const left = x - profile.halfW, right = x + profile.halfW;
    const top = y - profile.topInset, bottom = y - profile.bottomInset;
    const actor2 = [[left, top], [right, top], [right, bottom], [left, bottom]];
    return convexPolygonsOverlap(actor2, shape.points);
  }
  function collides(map, x, y, w = MAP_W, h = MAP_H, obstacles2 = [], profile = DEFAULT_PROFILE) {
    return obstacles2.some((shape) => collidesShape(x, y, shape, profile)) || (solidAt(map, x - profile.halfW, y - profile.bottomInset, w, h) || solidAt(map, x + profile.halfW, y - profile.bottomInset, w, h) || solidAt(map, x - profile.halfW, y - profile.topInset, w, h) || solidAt(map, x + profile.halfW, y - profile.topInset, w, h));
  }
  function moveEntity(map, p, dx, dy, w = MAP_W, h = MAP_H, obstacles2 = [], profile = DEFAULT_PROFILE) {
    if (dx !== 0) {
      const ox = p.x;
      p.x += dx;
      if (collides(map, p.x, p.y, w, h, obstacles2, profile)) p.x = ox;
    }
    if (dy !== 0) {
      const oy = p.y;
      p.y += dy;
      if (collides(map, p.x, p.y, w, h, obstacles2, profile)) p.y = oy;
    }
  }

  // src/core/liuyuan-entry-resume.ts
  function entryResumeKey(slot) {
    return `gusu:liuyuan-entry:reload-v1:${slot}`;
  }
  function entryGeometryStamp(map, obstacles2) {
    let hash = 2166136261;
    for (const value of map) hash = Math.imul(hash ^ value, 16777619);
    const shapes = JSON.stringify(obstacles2);
    for (let index = 0; index < shapes.length; index++)
      hash = Math.imul(hash ^ shapes.charCodeAt(index), 16777619);
    return `${map.length}:${hash >>> 0}`;
  }
  function parseEntryResume(raw, context) {
    if (!raw) return null;
    try {
      const value = JSON.parse(raw);
      if (!value || value.version !== 1 || value.progressStamp !== context.progressStamp || value.geometryStamp !== context.geometryStamp) return null;
      const state = value.state;
      if (!state || !Number.isFinite(state.x) || !Number.isFinite(state.y) || !Number.isInteger(state.dir) || state.dir < 0 || state.dir > 3 || !Number.isInteger(state.alleyCheckpoint) || state.alleyCheckpoint < 0 || state.alleyCheckpoint > context.maxAlley || !Number.isInteger(state.returnCheckpoint) || state.returnCheckpoint < 0 || state.returnCheckpoint > context.maxReturn || typeof state.gateAnswered !== "boolean" || typeof state.bucketResting !== "boolean" || !context.canStand(state.x, state.y) || !context.stateAllowed(state)) return null;
      return {
        x: state.x,
        y: state.y,
        dir: state.dir,
        alleyCheckpoint: state.alleyCheckpoint,
        returnCheckpoint: state.returnCheckpoint,
        gateAnswered: state.gateAnswered,
        bucketResting: state.bucketResting
      };
    } catch {
      return null;
    }
  }
  function readEntryResume(context) {
    try {
      return parseEntryResume(sessionStorage.getItem(entryResumeKey(context.slot)), context);
    } catch {
      return null;
    }
  }
  function writeEntryResume(context, state) {
    try {
      sessionStorage.setItem(entryResumeKey(context.slot), JSON.stringify({
        version: 1,
        progressStamp: context.progressStamp,
        geometryStamp: context.geometryStamp,
        state
      }));
    } catch {
    }
  }
  function clearEntryResume(slot) {
    try {
      sessionStorage.removeItem(entryResumeKey(slot));
    } catch {
    }
  }

  // src/core/scene-validation.ts
  function unreachableSceneFeet(scene, targets, profile, step = 4) {
    if (!targets.length) return [];
    if (collides(
      scene.map,
      scene.spawn.x,
      scene.spawn.y,
      scene.w,
      scene.h,
      scene.obstacles ?? [],
      profile
    )) return targets.map((target) => target.id);
    const remaining = new Map(targets.map((target) => [target.id, target]));
    const blockedFeet = targets.filter((target) => target.mustStand && collides(
      scene.map,
      target.x,
      target.y,
      scene.w,
      scene.h,
      scene.obstacles ?? [],
      profile
    )).map((target) => target.id);
    if (blockedFeet.length) return blockedFeet;
    const queue = [[scene.spawn.x, scene.spawn.y]];
    const visited = /* @__PURE__ */ new Set([`${scene.spawn.x},${scene.spawn.y}`]);
    const worldW = scene.w * 16, worldH = scene.h * 16;
    for (let cursor = 0; cursor < queue.length && remaining.size; cursor++) {
      const [x, y] = queue[cursor];
      for (const target of remaining.values()) {
        if (Math.hypot(x - target.x, y - target.y) <= target.radius) remaining.delete(target.id);
      }
      for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
        const nextX = x + dx, nextY = y + dy;
        if (nextX < 0 || nextY < 0 || nextX >= worldW || nextY >= worldH) continue;
        const key = `${nextX},${nextY}`;
        if (visited.has(key) || collides(
          scene.map,
          nextX,
          nextY,
          scene.w,
          scene.h,
          scene.obstacles ?? [],
          profile
        )) continue;
        visited.add(key);
        queue.push([nextX, nextY]);
      }
    }
    return [...remaining.keys()];
  }
  function validateTileScene(id, scene, profile) {
    const errors = [];
    if (!Number.isInteger(scene.w) || !Number.isInteger(scene.h) || scene.w <= 0 || scene.h <= 0) {
      errors.push(`${id}: \u5730\u56FE\u5BBD\u9AD8\u5FC5\u987B\u4E3A\u6B63\u6574\u6570`);
    }
    if (scene.map.length !== scene.w * scene.h) {
      errors.push(`${id}: map.length \u4E0E w \xD7 h \u4E0D\u4E00\u81F4`);
    }
    if (profile.halfW <= 0 || profile.bottomInset < 0 || profile.topInset <= profile.bottomInset) {
      errors.push(`${id}: \u4EBA\u7269\u811A\u5E95\u76D2\u65E0\u6548`);
    }
    if (collides(
      scene.map,
      scene.spawn.x,
      scene.spawn.y,
      scene.w,
      scene.h,
      scene.obstacles ?? [],
      profile
    )) errors.push(`${id}: \u51FA\u751F\u811A\u70B9\u843D\u5728\u78B0\u649E\u4F53\u5185`);
    return errors;
  }

  // src/core/scene-plate-draft.ts
  function sceneDraftRecords(sceneId) {
    const prefix = `gusu-geometry-plate:${sceneId}:`;
    const candidates = [];
    if (window.name.startsWith(prefix)) try {
      candidates.push(JSON.parse(window.name.slice(prefix.length)));
    } catch {
    }
    try {
      for (const key of [`gusu:geometry-editor:${sceneId}:v1`, `gusu:geometry-editor:${sceneId}:latest`]) {
        const raw = localStorage.getItem(key);
        if (raw) candidates.push(JSON.parse(raw));
      }
    } catch {
    }
    return candidates.filter((item) => typeof item.value === "string" && Number.isFinite(item.savedAt)).sort((a, b) => b.savedAt - a.savedAt);
  }
  function readScenePlateDraft(sceneId, worldW, worldH, buildMap, requiredFeet = []) {
    if (new URLSearchParams(location.search).get("draft") !== "1") return null;
    const validPolygon = (value) => Array.isArray(value) && value.length >= 3 && value.every((point) => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite) && point[0] >= 0 && point[1] >= 0 && point[0] <= worldW && point[1] <= worldH);
    const validCollider = (value) => {
      if (!validPolygon(value)) return false;
      let sign = 0;
      for (let i = 0; i < value.length; i++) {
        const a = value[i], b = value[(i + 1) % value.length], c = value[(i + 2) % value.length];
        const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
        if (cross === 0) continue;
        if (sign && Math.sign(cross) !== sign) return false;
        sign = Math.sign(cross);
      }
      return sign !== 0;
    };
    const validEffect = (value) => value.kind === "water-ripple" && typeof value.id === "string" && !!value.id.trim() && Array.isArray(value.polygons) && value.polygons.length > 0 && value.polygons.every(validPolygon) && Array.isArray(value.holes ?? []) && (value.holes ?? []).every(validPolygon) && typeof value.ripple?.color === "string" && !!value.ripple.color && Number.isFinite(value.ripple.rowSpacing) && value.ripple.rowSpacing > 0 && Number.isFinite(value.ripple.segmentSpacing) && value.ripple.segmentSpacing > 0 && Number.isFinite(value.ripple.minLength) && value.ripple.minLength > 0 && Number.isFinite(value.ripple.maxLength) && value.ripple.maxLength >= value.ripple.minLength && Number.isFinite(value.ripple.speedMs) && value.ripple.speedMs > 0;
    for (const record of sceneDraftRecords(sceneId)) {
      try {
        const data = JSON.parse(record.value);
        if (data.format !== "gusu-scene-geometry" || data.sceneId !== sceneId || data.world?.width !== worldW || data.world?.height !== worldH || !Array.isArray(data.tileRegions) || !Array.isArray(data.objects)) continue;
        if (data.actorScalePercent !== void 0 && (!Number.isInteger(data.actorScalePercent) || data.actorScalePercent < 40 || data.actorScalePercent > 250)) continue;
        if (!data.tileRegions.every((item) => typeof item.id === "string" && [item.x, item.y, item.w, item.h, item.tile].every(Number.isInteger) && item.w > 0 && item.h > 0 && item.x >= 0 && item.y >= 0 && item.x + item.w <= worldW / 16 && item.y + item.h <= worldH / 16)) continue;
        if (!data.objects.every((item) => typeof item.id === "string" && (item.colliders ?? []).every(validCollider) && (!item.occluder || Number.isFinite(item.occluder.depthY) && (item.occluder.polygons ?? []).every(validPolygon)) && Array.isArray(item.effects ?? []) && (item.effects ?? []).every(validEffect))) continue;
        const geometry2 = data.objects.map((item) => ({
          id: item.id,
          colliders: (item.colliders ?? []).map((points) => ({ points })),
          occluder: item.occluder ? {
            id: item.id,
            depthY: item.occluder.depthY,
            polygons: item.occluder.polygons
          } : void 0,
          effects: (item.effects ?? []).map((effect) => ({
            id: effect.id,
            kind: "water-ripple",
            polygons: effect.polygons,
            holes: effect.holes ?? [],
            ripple: { ...effect.ripple }
          }))
        }));
        const scene = buildMap(data.tileRegions);
        const obstacles2 = geometry2.flatMap((object) => object.colliders ?? []);
        if (validateTileScene(sceneId, { ...scene, obstacles: obstacles2 }, STANDARD_PLAYER_PROFILE).length) continue;
        if (unreachableSceneFeet({ ...scene, obstacles: obstacles2 }, requiredFeet, STANDARD_PLAYER_PROFILE).length) continue;
        return {
          regions: data.tileRegions,
          geometry: geometry2,
          actorScalePercent: data.actorScalePercent ?? 100,
          assetPath: typeof data.asset?.path === "string" ? data.asset.path : void 0
        };
      } catch {
      }
    }
    return null;
  }

  // src/data/liuyuan-entry-study.ts
  var LIUYUAN_ENTRY_W = 63;
  var LIUYUAN_ENTRY_H = 43;
  var LIUYUAN_ENTRY_SPAWN = { x: 520, y: 656 };
  var LIUYUAN_ENTRY_QIAO_WAIT = { x: 566, y: 676 };
  var LIUYUAN_ENTRY_DRAFT_REGIONS = [
    { id: "street-approach", x: 30, y: 39, w: 6, h: 4, tile: T.PATH },
    { id: "small-gate-threshold", x: 31, y: 36, w: 3, h: 4, tile: T.CORR },
    { id: "front-hall", x: 29, y: 32, w: 7, h: 5, tile: T.CORR },
    { id: "first-light-well", x: 29, y: 28, w: 7, h: 5, tile: T.PATH },
    { id: "long-south-corridor", x: 31, y: 24, w: 3, h: 5, tile: T.CORR },
    { id: "west-turn", x: 26, y: 23, w: 8, h: 3, tile: T.CORR },
    { id: "second-light-well", x: 24, y: 21, w: 6, h: 5, tile: T.PATH },
    { id: "north-narrow-corridor", x: 26, y: 17, w: 3, h: 6, tile: T.CORR },
    { id: "ancient-tree-court", x: 23, y: 14, w: 8, h: 5, tile: T.PATH },
    { id: "west-to-green-shade", x: 18, y: 14, w: 9, h: 3, tile: T.CORR },
    { id: "green-shade-threshold", x: 16, y: 11, w: 5, h: 6, tile: T.PATH },
    // 六扇漏窗是北侧实墙中的取景孔，不是玩家可穿过的门洞。
    { id: "six-leak-windows-solid", x: 23, y: 13, w: 7, h: 1, tile: T.WIN },
    { id: "pond-not-walkable", x: 6, y: 2, w: 12, h: 6, tile: T.WATER }
  ];
  function buildLiuyuanEntryStudyMap(regions = LIUYUAN_ENTRY_DRAFT_REGIONS) {
    const map = new Uint8Array(LIUYUAN_ENTRY_W * LIUYUAN_ENTRY_H);
    map.fill(T.WALL);
    for (const region of regions) {
      for (let y = region.y; y < region.y + region.h; y++) {
        for (let x = region.x; x < region.x + region.w; x++) {
          if (x >= 0 && y >= 0 && x < LIUYUAN_ENTRY_W && y < LIUYUAN_ENTRY_H) {
            map[y * LIUYUAN_ENTRY_W + x] = region.tile;
          }
        }
      }
    }
    return { map, w: LIUYUAN_ENTRY_W, h: LIUYUAN_ENTRY_H, spawn: { ...LIUYUAN_ENTRY_SPAWN } };
  }

  // src/data/liuyuan-character-scale.ts
  var LIUYUAN_CHARACTER_SCALE = {
    entry: { farFootY: 250, nearFootY: 656, farHeight: 60, nearHeight: 63, cameraZoom: 2 },
    court: { worldHeight: 84, cameraZoom: 1.5 },
    lvyin: { worldHeight: 84, cameraZoom: 1.5 },
    flower: { worldHeight: 84, cameraZoom: 1.5, kneelingFloristHeight: 72 },
    eastHall: { worldHeight: 84, cameraZoom: 1.5 },
    stoneForest: { worldHeight: 84, cameraZoom: 1.5 },
    studyCourt: { worldHeight: 120, cameraZoom: 0.9 },
    studyInterior: { worldHeight: 180, cameraZoom: 0.75 }
  };
  var CHAPTER_SCENE_SCALE = {
    "liuyuan-tree-court-no-water-study-v1": LIUYUAN_CHARACTER_SCALE.court,
    "liuyuan-lvyin-pond-study-v1": LIUYUAN_CHARACTER_SCALE.lvyin,
    "liuyuan-flower-work-yard-study-v3": LIUYUAN_CHARACTER_SCALE.flower,
    "liuyuan-east-hall-magnolia-court-study-v1": LIUYUAN_CHARACTER_SCALE.eastHall,
    "liuyuan-stone-forest-court-study-v1": LIUYUAN_CHARACTER_SCALE.stoneForest,
    "liuyuan-study-court-research-v1": LIUYUAN_CHARACTER_SCALE.studyCourt,
    "liuyuan-study-interior-research-v1": LIUYUAN_CHARACTER_SCALE.studyInterior
  };
  var CHAPTER_SCENE_ZOOM = {
    "liuyuan-entrance-topology-study": LIUYUAN_CHARACTER_SCALE.entry.cameraZoom,
    "liuyuan-tree-court-no-water-study-v1": LIUYUAN_CHARACTER_SCALE.court.cameraZoom,
    "liuyuan-lvyin-pond-study-v1": LIUYUAN_CHARACTER_SCALE.lvyin.cameraZoom,
    "liuyuan-flower-work-yard-study-v3": LIUYUAN_CHARACTER_SCALE.flower.cameraZoom,
    "liuyuan-east-hall-magnolia-court-study-v1": LIUYUAN_CHARACTER_SCALE.eastHall.cameraZoom,
    "liuyuan-stone-forest-court-study-v1": LIUYUAN_CHARACTER_SCALE.stoneForest.cameraZoom,
    "liuyuan-study-court-research-v1": LIUYUAN_CHARACTER_SCALE.studyCourt.cameraZoom,
    "liuyuan-study-interior-research-v1": LIUYUAN_CHARACTER_SCALE.studyInterior.cameraZoom
  };

  // src/data/corridor-geometry.ts
  var CORRIDOR_ROUTE = [
    { x: 62, y: 278 },
    { x: 178, y: 274 },
    { x: 316, y: 274 },
    { x: 470, y: 277 },
    { x: 610, y: 284 },
    { x: 738, y: 279 }
  ];
  var CORRIDOR_WATER_EDGE = [
    [0, 302],
    [72, 307],
    [160, 304],
    [238, 310],
    [330, 307],
    [421, 314],
    [507, 311],
    [595, 309],
    [690, 306],
    [793, 297]
  ];
  var CORRIDOR_EFFECTS = [{
    id: "corridor-water-ripple",
    kind: "water-ripple",
    polygons: [[...CORRIDOR_WATER_EDGE, [793, 496], [0, 496]]],
    holes: [
      [[0, 302], [75, 307], [107, 326], [121, 361], [151, 389], [169, 437], [190, 496], [0, 496]],
      [[690, 306], [731, 320], [758, 350], [793, 361], [793, 496], [699, 496], [691, 444], [679, 402]]
    ],
    ripple: {
      color: "rgba(192, 224, 196, .12)",
      rowSpacing: 9,
      segmentSpacing: 71,
      minLength: 8,
      maxLength: 33,
      speedMs: 360
    }
  }];
  var CORRIDOR_POST_OCCLUDERS = [82, 213, 304, 391, 474, 558, 641, 705].map((x, index) => {
    const id = `corridor-post-${String(index + 1).padStart(2, "0")}`;
    return { id, occluder: {
      id,
      depthY: 287,
      polygons: [[[x - 4, 186], [x + 5, 186], [x + 5, 287], [x - 4, 287]]]
    } };
  });

  // src/data/liuyuan-window-room-study.ts
  var LIUYUAN_WINDOW_ROOM_SPAWN = { x: 480, y: 488 };
  var LIUYUAN_WINDOW_ROOM_FEET = {
    west: { x: 123, y: 448 },
    middle: { x: 480, y: 448 },
    east: { x: 843, y: 448 }
  };
  var LIUYUAN_WINDOW_ROOM_DRAFT_REGIONS = [
    { id: "dongtian-walk-floor", x: 2, y: 26, w: 56, h: 7, tile: T.CORR }
  ];

  // src/data/liuyuan-youyicun-study.ts
  var LIUYUAN_YOUYICUN_SPAWN = { x: 624, y: 872 };
  var LIUYUAN_YOUYICUN_FEET = {
    gateFront: { x: 920, y: 680 },
    threshold: { x: 968, y: 616 },
    gardenSide: { x: 997, y: 526 },
    onward: { x: 1072, y: 414 }
  };
  var LIUYUAN_YOUYICUN_DRAFT_REGIONS = [
    { id: "youyicun-near-lower", x: 31, y: 58, w: 52, h: 5, tile: T.PATH },
    { id: "youyicun-near-middle", x: 31, y: 51, w: 46, h: 7, tile: T.PATH },
    { id: "youyicun-near-upper", x: 33, y: 48, w: 40, h: 3, tile: T.PATH },
    { id: "youyicun-approach-lower", x: 34, y: 45, w: 38, h: 3, tile: T.PATH },
    { id: "youyicun-approach-upper", x: 40, y: 41, w: 32, h: 4, tile: T.PATH },
    { id: "youyicun-gate-throat", x: 51, y: 35, w: 18, h: 7, tile: T.CORR },
    { id: "youyicun-inner-path", x: 59, y: 26, w: 13, h: 10, tile: T.PATH },
    { id: "youyicun-far-path", x: 61, y: 23, w: 11, h: 6, tile: T.PATH }
  ];

  // src/data/liuyuan-flower-study.ts
  var LIUYUAN_FLOWER_W = 111;
  var LIUYUAN_FLOWER_H = 56;
  var LIUYUAN_FLOWER_WORLD_W = LIUYUAN_FLOWER_W * 16;
  var LIUYUAN_FLOWER_WORLD_H = LIUYUAN_FLOWER_H * 16;
  var LIUYUAN_FLOWER_SPAWN = { x: 820, y: 500 };
  var LIUYUAN_FLOWER_WORKER_STAND = { x: 650, y: 485 };
  var LIUYUAN_FLOWER_BUCKET = { x: 480, y: 445 };
  var LIUYUAN_FLOWER_EAST_EXIT = { x: 1675, y: 445 };
  var LIUYUAN_FLOWER_REQUIRED_FEET = [
    { id: "\u9662\u53E3", ...LIUYUAN_FLOWER_SPAWN, radius: 16, mustStand: true },
    { id: "\u6A90\u4E0B\u7CA5\u6876", ...LIUYUAN_FLOWER_BUCKET, radius: 90 },
    { id: "\u82B1\u5320\u65C1", ...LIUYUAN_FLOWER_WORKER_STAND, radius: 55 },
    { id: "\u4E1C\u4FA7\u8F6C\u573A", ...LIUYUAN_FLOWER_EAST_EXIT, radius: 80, mustStand: true }
  ];
  var YARD_FLOOR = [
    [350, 348],
    [1570, 348],
    [1640, 390],
    [1640, 585],
    [1580, 685],
    [1540, 852],
    [790, 896],
    [695, 824],
    [595, 685],
    [350, 525]
  ];
  var EAST_PASSAGE = [
    [1570, 350],
    [1776, 340],
    [1776, 565],
    [1600, 565]
  ];
  function insidePolygon(x, y, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i], [xj, yj] = points[j];
      if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function bands(id, points, tile) {
    const result = [];
    for (let y = 0; y < LIUYUAN_FLOWER_H; y++) {
      let start = -1;
      for (let x = 0; x <= LIUYUAN_FLOWER_W; x++) {
        const open = x < LIUYUAN_FLOWER_W && insidePolygon(x * 16 + 8, y * 16 + 8, points);
        if (open && start < 0) start = x;
        if (!open && start >= 0) {
          result.push({ id: `${id}-${y}-${start}`, x: start, y, w: x - start, h: 1, tile });
          start = -1;
        }
      }
    }
    return result;
  }
  var LIUYUAN_FLOWER_DRAFT_REGIONS = [
    ...bands("flower-yard-floor", YARD_FLOOR, T.PATH),
    ...bands("flower-east-passage", EAST_PASSAGE, T.CORR)
  ];
  var LIUYUAN_FLOWER_GEOMETRY = [
    { id: "flower-work-table", colliders: [{ x: 110, y: 260, w: 275, h: 185 }] },
    { id: "flower-rear-potting-bed", colliders: [{ x: 610, y: 235, w: 960, h: 110 }] },
    { id: "flower-worker-foot", colliders: [{ x: 522, y: 427, w: 84, h: 32 }] },
    {
      id: "flower-front-left-eave",
      occluder: {
        id: "flower-front-left-eave",
        depthY: 875,
        polygons: [[[0, 575], [300, 565], [605, 760], [760, 896], [0, 896]]]
      }
    },
    {
      id: "flower-front-right-eave",
      occluder: {
        id: "flower-front-right-eave",
        depthY: 830,
        polygons: [[[1590, 630], [1776, 615], [1776, 896], [1660, 896]]]
      }
    }
  ];
  var LIUYUAN_FLOWER_OBSTACLES = LIUYUAN_FLOWER_GEOMETRY.flatMap((object) => object.colliders ?? []);

  // src/data/liuyuan-entry-oblique-study.ts
  var LIUYUAN_ENTRY_OBLIQUE_W = 96;
  var LIUYUAN_ENTRY_OBLIQUE_H = 64;
  var LIUYUAN_ENTRY_OBLIQUE_WORLD_W = LIUYUAN_ENTRY_OBLIQUE_W * 16;
  var LIUYUAN_ENTRY_OBLIQUE_WORLD_H = LIUYUAN_ENTRY_OBLIQUE_H * 16;
  var LIUYUAN_ENTRY_OBLIQUE_FEET = {
    street: { x: 770, y: 915 },
    gateFront: { x: 770, y: 790 },
    threshold: { x: 770, y: 725 },
    hall: { x: 770, y: 595 },
    bend: { x: 690, y: 385 },
    lightwell: { x: 520, y: 270 },
    stop: { x: 315, y: 180 }
  };
  var LIUYUAN_ENTRY_OBLIQUE_SPAWN = LIUYUAN_ENTRY_OBLIQUE_FEET.street;
  var STREET = [
    [610, 1024],
    [1090, 1024],
    [1080, 792],
    [650, 792]
  ];
  var GATE = [
    [674, 810],
    [890, 810],
    [882, 547],
    [696, 547]
  ];
  var INNER_PASSAGE = [
    [678, 570],
    [888, 570],
    [847, 437],
    [789, 360],
    [670, 346],
    [603, 398]
  ];
  var WEST_TURN = [
    [615, 435],
    [785, 379],
    [715, 314],
    [635, 264],
    [517, 250],
    [500, 352]
  ];
  var LIGHTWELL = [
    [435, 365],
    [610, 304],
    [588, 188],
    [435, 170],
    [365, 245]
  ];
  var FAR_PATH = [
    [197, 267],
    [474, 267],
    [524, 177],
    [453, 123],
    [197, 123]
  ];
  function insidePolygon2(x, y, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
      if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function rowBands(id, polygon, tile) {
    const rows = [];
    for (let y = 0; y < LIUYUAN_ENTRY_OBLIQUE_H; y++) {
      let start = -1;
      for (let x = 0; x <= LIUYUAN_ENTRY_OBLIQUE_W; x++) {
        const open = x < LIUYUAN_ENTRY_OBLIQUE_W && insidePolygon2(x * 16 + 8, y * 16 + 8, polygon);
        if (open && start < 0) start = x;
        if (!open && start >= 0) {
          rows.push({ id: `${id}-${y}-${start}`, x: start, y, w: x - start, h: 1, tile });
          start = -1;
        }
      }
    }
    return rows;
  }
  var LIUYUAN_ENTRY_OBLIQUE_DRAFT_REGIONS = [
    ...rowBands("street", STREET, T.PATH),
    ...rowBands("gate", GATE, T.CORR),
    ...rowBands("inner-passage", INNER_PASSAGE, T.CORR),
    ...rowBands("west-turn", WEST_TURN, T.CORR),
    ...rowBands("lightwell", LIGHTWELL, T.PATH),
    ...rowBands("far-path", FAR_PATH, T.PATH)
  ];
  var LIUYUAN_ENTRY_OBLIQUE_GEOMETRY = [
    {
      id: "oblique-gate-left-post",
      colliders: [{ x: 642, y: 661, w: 39, h: 111 }]
    },
    {
      id: "oblique-gate-right-post",
      colliders: [{ x: 890, y: 660, w: 40, h: 113 }]
    },
    {
      id: "oblique-gate-roof",
      occluder: {
        id: "oblique-gate-roof",
        depthY: 789,
        polygons: [[[600, 383], [980, 383], [980, 555], [600, 555]]]
      }
    },
    {
      id: "oblique-left-foreground-roof",
      occluder: {
        id: "oblique-left-foreground-roof",
        depthY: 1020,
        polygons: [[[0, 825], [380, 825], [660, 970], [660, 1024], [0, 1024]]]
      }
    },
    {
      id: "oblique-right-foreground-roof",
      occluder: {
        id: "oblique-right-foreground-roof",
        depthY: 1020,
        polygons: [[[1290, 799], [1536, 799], [1536, 1024], [1060, 1024]]]
      }
    }
  ];
  var LIUYUAN_ENTRY_OBLIQUE_OBSTACLES = LIUYUAN_ENTRY_OBLIQUE_GEOMETRY.flatMap((object) => object.colliders ?? []);

  // src/data/liuyuan-entry-lower-camera-study.ts
  var LIUYUAN_ENTRY_LOWER_W = 105;
  var LIUYUAN_ENTRY_LOWER_H = 59;
  var LIUYUAN_ENTRY_LOWER_FEET = {
    street: { x: 780, y: 830 },
    approach: { x: 975, y: 670 },
    threshold: { x: 1098, y: 550 },
    gateInside: { x: 1100, y: 470 },
    lightwell: { x: 1160, y: 365 },
    stop: { x: 1270, y: 315 }
  };
  var LIUYUAN_ENTRY_LOWER_SPAWN = LIUYUAN_ENTRY_LOWER_FEET.street;
  var LIUYUAN_ENTRY_LOWER_NPC_FEET = {
    oldVendor: { x: 650, y: 747 },
    qiao: { x: 845, y: 720 },
    gatekeeper: { x: 1360, y: 680 }
  };
  var OUTER_STONE = [
    [0, 390],
    [540, 485],
    [850, 545],
    [1260, 595],
    [1672, 710],
    [1672, 941],
    [0, 941]
  ];
  var GATE_SILL = [
    [985, 635],
    [1233, 635],
    [1220, 496],
    [997, 496]
  ];
  var INNER_STONE = [
    [1005, 512],
    [1210, 512],
    [1250, 313],
    [1084, 290],
    [1032, 353]
  ];
  var TURN_OUT_OF_SIGHT = [
    [1140, 385],
    [1250, 385],
    [1370, 303],
    [1315, 285],
    [1212, 286]
  ];
  function insidePolygon3(x, y, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i], [xj, yj] = points[j];
      if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function bands2(id, shape, tile) {
    const regions = [];
    for (let y = 0; y < LIUYUAN_ENTRY_LOWER_H; y++) {
      let start = -1;
      for (let x = 0; x <= LIUYUAN_ENTRY_LOWER_W; x++) {
        const open = x < LIUYUAN_ENTRY_LOWER_W && insidePolygon3(x * 16 + 8, y * 16 + 8, shape);
        if (open && start < 0) start = x;
        if (!open && start >= 0) {
          regions.push({ id: `${id}-${y}-${start}`, x: start, y, w: x - start, h: 1, tile });
          start = -1;
        }
      }
    }
    return regions;
  }
  var LIUYUAN_ENTRY_LOWER_DRAFT_REGIONS = [
    ...bands2("outer-stone", OUTER_STONE, T.PATH),
    ...bands2("gate-sill", GATE_SILL, T.CORR),
    ...bands2("inner-stone", INNER_STONE, T.CORR),
    ...bands2("turn", TURN_OUT_OF_SIGHT, T.PATH)
  ];
  var LIUYUAN_ENTRY_LOWER_GEOMETRY = [
    { id: "lower-entry-left-jamb", colliders: [{ x: 874, y: 470, w: 128, h: 102 }] },
    { id: "lower-entry-right-jamb", colliders: [{ x: 1214, y: 480, w: 118, h: 123 }] },
    { id: "lower-entry-wall-leaf-base", colliders: [{ x: 580, y: 416, w: 178, h: 85 }] },
    { id: "lower-entry-gate-eave", occluder: {
      id: "lower-entry-gate-eave",
      depthY: 556,
      polygons: [[[835, 22], [1384, 22], [1384, 241], [835, 241]]]
    } },
    { id: "lower-entry-left-foreground-roof", occluder: {
      id: "lower-entry-left-foreground-roof",
      depthY: 931,
      polygons: [[[0, 665], [286, 665], [286, 941], [0, 941]]]
    } }
  ];
  var LIUYUAN_ENTRY_LOWER_OBSTACLES = LIUYUAN_ENTRY_LOWER_GEOMETRY.flatMap((object) => object.colliders ?? []);

  // src/data/scene-plates.ts
  var SCENE_PLATES_BASE = [
    {
      id: "canglang-whole-garden-study-v2",
      label: "\u6CA7\u6D6A\u4EAD\u5168\u56ED \xB7 \u7070\u7EFF\u89C6\u89C9\u8BD5\u7A3F v2",
      asset: "../assets/scene25d/canglang-whole-garden-study-v2.png",
      width: 1120,
      height: 1408,
      tileW: 70,
      tileH: 88,
      note: "\u4FDD\u7559\u5BFC\u89C8\u56FE\u7684\u5357\u6865\u3001\u897F\u5357\u56ED\u5916\u6C34\u3001\u4E2D\u592E\u5C71\u6797\u4E0E\u5317\u4FA7\u5EFA\u7B51\u7FA4\uFF1B\u6309\u5168\u56ED\u7EDF\u4E00\u7070\u7EFF\u77F3\u8272\u91CD\u7ED8\u3002\u590D\u5ECA\u53CC\u901A\u9053\u3001\u5385\u5802\u95E8\u4F4D\u53CA\u6865\u5934\u2014\u5C71\u5F84\u7684\u5B9E\u9645\u53EF\u8D70\u5173\u7CFB\u4ECD\u672A\u901A\u8FC7\u9A8C\u6536\uFF1B\u4EC5\u4F9B\u89C6\u89C9\u5BF9\u6BD4\u548C\u5267\u672C\u951A\u70B9\u6807\u5B9A\uFF0C\u4E0D\u5F97\u4F5C\u4E3A\u6B63\u5F0F\u78B0\u649E\u5E95\u56FE\u3002\u65E7 v1 \u4E0E\u5176\u6D4F\u89C8\u5668\u8349\u7A3F\u4FDD\u7559\u3002",
      storyAnchors: [
        { id: "canglang-v2-south-bridge", x: 675, y: 1165, label: "\u9694\u6C34\u5165\u56ED", kind: "trigger", scriptRef: "CH1-02/03", note: "\u6865\u4E0E\u56ED\u5916\u6C34\u5173\u7CFB\u4E3A\u73B0\u72B6\u5BFC\u89C8\u56FE\u4F9D\u636E\uFF1B\u6865\u5934\u7AD9\u4F4D\u4E0E\u665A\u6E05\u7EC6\u90E8\u5F85\u590D\u6838\u3002" },
        { id: "canglang-v2-hill", x: 480, y: 660, label: "\u5C71\u6797\u521D\u89C1", kind: "visual", scriptRef: "CH1-03", note: "\u5165\u56ED\u5148\u611F\u5230\u5C71\u4E0E\u5899\uFF0C\u4E0D\u5F39\u5168\u666F\u8BF4\u660E\uFF1B\u5177\u4F53\u6811\u4F4D\u4E0D\u4F5C\u53F2\u5B9E\u3002" },
        { id: "canglang-v2-corridor", x: 275, y: 790, label: "\u5916\u6C34\u5185\u5C71 \xB7 \u590D\u5ECA", kind: "trigger", scriptRef: "CH1-03/04", note: "\u6B64\u5904\u53EA\u662F\u5267\u672C\u5B9A\u4F4D\u3002\u53CC\u4FA7\u5ECA\u9053\u7684\u5730\u9762\u5C1A\u4E0D\u6E05\u6670\uFF0C\u4E0D\u80FD\u6CBF\u751F\u6210\u56FE\u76F4\u63A5\u94FA\u53EF\u8D70\u7F51\u683C\uFF1B\u4E09\u7A97\u4E3A\u827A\u672F\u52A0\u5DE5\u3002" },
        { id: "canglang-v2-north-halls", x: 390, y: 420, label: "\u5802\u9986\u533A", kind: "visual", scriptRef: "CH1-03", note: "\u5802\u9986\u5206\u533A\u4F9D\u56ED\u6797\u5C40\u6982\u8FF0\uFF1B\u5355\u5EA7\u5EFA\u7B51\u540D\u79F0\u3001\u95E8\u4F4D\u548C\u665A\u6E05\u72B6\u6001\u5F85\u5E73\u9762\u4E0E\u53F2\u6599\u9010\u4E00\u6838\u51C6\u3002" }
      ]
    },
    {
      id: "canglang-whole-garden-study",
      label: "\u6CA7\u6D6A\u4EAD\u5168\u56ED \xB7 \u65E7\u8BD5\u7A3F v1\uFF08\u4FDD\u7559\u8349\u7A3F\uFF09",
      asset: "../assets/scene25d/canglang-whole-garden-study-v1.png",
      width: 1120,
      height: 1408,
      tileW: 70,
      tileH: 88,
      note: "\u53C2\u7167\u6CA7\u6D6A\u4EAD\u5168\u666F\u5BFC\u89C8\u56FE\u53CA\u5B9E\u666F\u7167\u8F6C\u8BD1\uFF1B\u5385\u5802\u95E8\u8DEF\u3001\u590D\u5ECA\u53CC\u901A\u9053\u548C\u5357\u95E8\u52A8\u7EBF\u4ECD\u9700\u4EBA\u5DE5\u6838\u5BF9\u3002\u4EC5\u4F5C\u7F16\u8F91\u5668\u6807\u5B9A\u5E95\u56FE\uFF0C\u4E0D\u662F\u6B63\u5F0F\u5173\u5361\u3002"
    },
    {
      id: "canglang-corridor",
      label: "\u6CA7\u6D6A\u4EAD \xB7 \u590D\u5ECA\u8FD1\u666F\u82F1\u96C4\u573A\u666F\uFF08\u53EF\u73A9\u5E95\u56FE\uFF09",
      asset: "../assets/canglang/corridor-hero-v4-motifs.png",
      width: 793,
      height: 496,
      tileW: 50,
      tileH: 31,
      note: "\u4E0E corridor.html \u540C\u4E00\u5F20\u8FD1\u666F\u56FE\uFF0C\u4EE5 793\xD7496 \u903B\u8F91\u5750\u6807\u6807\u6CE8\u4E09\u7A97\u3001\u8DEF\u7EBF\u4E0E\u6C34\u7EB9\u3002\u6B63\u5F0F\u8BD5\u73A9\u4F7F\u7528\u53D7\u7EA6\u675F\u4E2D\u5FC3\u7EBF\u548C\u7EC6\u5C0F\u6A2A\u5411\u5FAE\u8C03\uFF0C\u4E0D\u4F7F\u7528\u666E\u901A Tile \u81EA\u7531\u884C\u8D70\uFF1B\u7F16\u8F91\u5668\u8349\u7A3F\u5148\u4F9B\u4EBA\u5DE5\u6838\u56FE\uFF0C\u5C1A\u4E0D\u81EA\u52A8\u66FF\u6362\u8BE5\u9875\u73A9\u6CD5\u6570\u636E\u3002\u5404\u7A97\u7EB9\u6837\u53C2\u8003\u6CA7\u6D6A\u4EAD\u82B1\u7A97\u7C7B\u578B\u4F5C\u5DEE\u5F02\u5316\u6F14\u7ECE\uFF0C\u53F3\u4E0A\u67FF\u6811\u4E3A\u827A\u672F\u914D\u7F6E\uFF1B\u4E09\u7A97\u4F4D\u7F6E\u3001\u5177\u4F53\u7EB9\u6837\u5E8F\u5217\u4E0E\u6811\u4F4D\u4E0D\u5F97\u6807\u4F5C\u5386\u53F2\u539F\u8C8C\u3002",
      storyAnchors: [
        { id: "cl-corridor-window-1", x: 153, y: 275, label: "\u7B2C\u4E00\u7A97 \xB7 \u770B", kind: "interaction", scriptRef: "CH1-04", note: "\u6E38\u620F\u7A97\u4F4D\uFF1B\u811A\u70B9\u6CBF\u5ECA\u7EBF\uFF0C\u4E0D\u5728\u6C34\u9762\uFF1B\u7A97\u7EB9\u53D6\u51B0\u88C2\u7CFB\u4F5C\u50CF\u7D20\u8F6C\u8BD1\u3002" },
        { id: "cl-corridor-window-2", x: 314, y: 274, label: "\u7B2C\u4E8C\u7A97 \xB7 \u5BF9", kind: "interaction", scriptRef: "CH1-04", note: "\u827A\u672F\u52A0\u5DE5\u7684\u4E2D\u6BB5\u53D6\u666F\u70B9\uFF1B\u7A97\u7EB9\u53D6\u82B1\u74F6\u7CFB\u4F5C\u50CF\u7D20\u8F6C\u8BD1\u3002" },
        { id: "cl-corridor-window-3", x: 489, y: 278, label: "\u7B2C\u4E09\u7A97 \xB7 \u5408", kind: "interaction", scriptRef: "CH1-04", note: "\u827A\u672F\u52A0\u5DE5\u7684\u672B\u6BB5\u53D6\u666F\u70B9\uFF1B\u7A97\u7EB9\u53D6\u8377\u82B1\u7CFB\u4F5C\u50CF\u7D20\u8F6C\u8BD1\u3002" }
      ],
      routeGraph: {
        nodes: CORRIDOR_ROUTE.map((point, index) => ({
          id: `cl-corridor-route-${index + 1}`,
          x: point.x,
          y: point.y,
          label: index === 0 ? "\u897F\u7AEF\u5165\u5ECA" : index === CORRIDOR_ROUTE.length - 1 ? "\u4E1C\u7AEF\u6B62\u6B65" : `\u5ECA\u7EBF ${index + 1}`,
          kind: index === 0 ? "entry" : index === CORRIDOR_ROUTE.length - 1 ? "goal" : "waypoint",
          anchorId: index >= 1 && index <= 3 ? `cl-corridor-window-${index}` : void 0,
          note: "\u4EC5\u5BF9\u9F50\u5F53\u524D\u8BD5\u73A9\u4E2D\u5FC3\u7EBF\uFF1B\u7F16\u8F91\u5668\u6539\u52A8\u4E0D\u81EA\u52A8\u6539\u5199\u6E38\u620F\u53D7\u7EA6\u675F\u8FD0\u52A8\u3002"
        })),
        edges: CORRIDOR_ROUTE.slice(1).map((_, index) => ({
          from: `cl-corridor-route-${index + 1}`,
          to: `cl-corridor-route-${index + 2}`,
          state: "candidate",
          via: "walk",
          note: "\u5019\u9009\u6807\u6CE8\u7EBF\uFF1B\u6E38\u620F\u4ECD\u4EE5\u4EE3\u7801\u4E2D\u7684\u53D7\u7EA6\u675F\u8DEF\u5F84\u4E3A\u51C6\u3002"
        }))
      }
    },
    {
      id: "wangshi-whole-garden-study",
      label: "\u7F51\u5E08\u56ED\u5B85\u56ED \xB7 \u5F85\u6821\u51C6\u5E95\u56FE",
      asset: "../assets/scene25d/wangshi-whole-garden-study-v1.png",
      width: 1248,
      height: 1248,
      tileW: 78,
      tileH: 78,
      note: "\u53C2\u7167\u5168\u56ED\u5E73\u9762\u53CA\u5B9E\u666F\uFF1A\u4E1C\u90E8\u4F4F\u5B85\u3001\u897F\u90E8\u6C60\u56ED\u548C\u5185\u56ED\u5747\u4FDD\u7559\u3002\u623F\u95F4\u51FA\u5165\u53E3\u3001\u540E\u95E8\u53CA 1890 \u5E74\u72B6\u6001\u4ECD\u5F85\u4EBA\u5DE5\u6838\u5BF9\uFF1B\u4E0D\u662F\u6B63\u5F0F\u5173\u5361\u3002"
    },
    {
      id: "liuyuan-tree-court-no-water-study-v1",
      label: "\u7559\u56ED \xB7 \u53E4\u6728\u4EA4\u67EF\u5C0F\u5EAD\u6E38\u620F\u8BD5\u8D70 v1",
      asset: "../assets/scene25d/liuyuan-tree-court-no-water-study-v1.png",
      width: 1776,
      height: 896,
      tileW: 111,
      tileH: 56,
      note: "\u5C40\u90E8\u6E38\u620F\u573A\u666F\u8BD5\u8D70\u7248\uFF1A\u672C\u5E55\u4E0D\u753B\u56ED\u5916\u6CB3\u9053\uFF0C\u4E5F\u4E0D\u63D0\u524D\u5C55\u793A\u56ED\u5185\u4E2D\u6C60\uFF1B\u4EE3\u7801\u5DF2\u6309\u56FE\u9762\u94FA\u5EAD\u9662/\u897F\u5ECA Tile\u3001\u5C01\u5899\u4E0E\u82B1\u53F0\u3001\u62C6\u524D\u666F\u5C4B\u6A90\u906E\u6321\u3002CH3 \u5165\u53E3\u653E\u6876\u540E\u53EF\u526A\u63A5\u8FDB\u6B64\u5207\u7247\uFF0C\u8D70\u5230\u897F\u5ECA\u5C3D\u5934\u518D\u526A\u63A5\u7EFF\u836B\u8F69\uFF1B\u526A\u63A5\u53EA\u8868\u793A\u7A7A\u95F4\u5148\u540E\uFF0C\u4E0D\u58F0\u79F0\u4E24\u5E55\u5DF2\u6309\u5386\u53F2\u95E8\u6D1E\u5750\u6807\u62FC\u63A5\u3002\u5317\u5899\u516D\u6F0F\u7A97\u4E0E\u897F\u5411\u66F2\u5ECA\u53EA\u53D6\u73B0\u72B6\u5173\u7CFB\uFF1B\u6811\u5F62\u3001\u7A97\u683C\u3001\u5899\u4F4D\u3001\u94FA\u5730\u5C3A\u5BF8\u5747\u672A\u4F5C 1890 \u65AD\u4EE3\u6216\u5B9E\u6D4B\u6838\u5BF9\uFF0C\u4E0D\u5F97\u4F5C\u6B63\u5F0F\u5173\u5361\u3002\u65E7\u5165\u53E3\u767D\u6A21\u8349\u7A3F\u4E0D\u8FC1\u79FB\u3002",
      storyAnchors: [
        { id: "ly-court-v1-windows", x: 1180, y: 365, label: "\u5317\u5899\u516D\u6F0F\u7A97\uFF08\u89C6\u89C9\u5019\u9009\uFF09", kind: "visual", scriptRef: "CH3-04", note: "\u516D\u7A97\u6570\u76EE\u636E\u73B0\u72B6\u6587\u5B57\uFF1B\u7A97\u683C\u6837\u5F0F\u548C 1890 \u5E74\u5B58\u8C8C\u672A\u6838\uFF0C\u4E0D\u8BB8\u7A7F\u7A97\u3002" },
        { id: "ly-court-v1-window-foot", x: 1160, y: 615, label: "\u505C\u6B65\u9694\u7A97\u770B", kind: "interaction", scriptRef: "CH3-04", note: "\u8FD9\u662F\u7AD9\u5728\u82B1\u53F0\u5357\u4FA7\u7684\u6E38\u620F\u89C2\u5BDF\u811A\u70B9\uFF0C\u4E0D\u662F\u7A97\u7684\u771F\u5B9E\u5386\u53F2\u7AD9\u4F4D\uFF1B\u4E0D\u5F39\u5BFC\u6E38\u5F0F\u8BF4\u660E\u5361\u3002" },
        { id: "ly-court-v1-west-passage", x: 340, y: 420, label: "\u5411\u897F\u8D70\u7684\u7A84\u5ECA\uFF08\u5019\u9009\uFF09", kind: "boundary", scriptRef: "CH3-04", note: "\u6B64\u5E55\u4E0D\u89C1\u6C34\uFF1B\u4E0B\u4E00\u5E55\u624D\u4ECE\u7EFF\u836B\u8F69\u65B9\u5411\u6253\u5F00\u4E2D\u90E8\u6C60\u56ED\u3002\u786E\u5207\u8F6C\u89D2\u548C\u95E8\u4F4D\u5C1A\u5F85\u5E73\u9762\u53CA\u7167\u7247\u6807\u5B9A\u3002" }
      ],
      routeGraph: {
        nodes: [
          { id: "court-entry", x: 1600, y: 680, label: "\u5C0F\u5EAD\u4E1C\u4FA7", kind: "entry", note: "\u5C40\u90E8\u5207\u7247\u51FA\u751F\u70B9\uFF1B\u4E0E\u5165\u53E3\u767D\u6A21\u7684\u63A5\u70B9\u5F85\u6807\u5B9A\u3002" },
          { id: "window-foot", x: 1160, y: 615, label: "\u9694\u7A97\u505C\u6B65", kind: "waypoint", anchorId: "ly-court-v1-window-foot", note: "\u5728\u82B1\u53F0\u5357\u4FA7\u770B\uFF0C\u4E0D\u7A7F\u7A97\u3002" },
          { id: "court-middle", x: 880, y: 635, label: "\u5C0F\u5EAD\u94FA\u5730", kind: "waypoint", note: "\u53EF\u7ED5\u884C\u800C\u975E\u6CBF\u4EFB\u52A1\u7BAD\u5934\u3002" },
          { id: "west-turn", x: 650, y: 610, label: "\u8F6C\u5411\u897F\u5ECA", kind: "waypoint", note: "\u4E0E\u5C4B\u6A90\u524D\u666F\u5206\u5C42\u3002" },
          { id: "passage-mouth", x: 440, y: 535, label: "\u7A84\u5ECA\u53E3", kind: "waypoint", note: "\u811A\u4E0B\u94FA\u5730\u5FC5\u987B\u8FDE\u7EED\u3002" },
          { id: "passage-bend", x: 340, y: 420, label: "\u897F\u5ECA\u4E2D\u6BB5", kind: "waypoint", anchorId: "ly-court-v1-west-passage", note: "\u5899\u4E0E\u5ECA\u76F8\u90BB\uFF0C\u4ECD\u672A\u6838\u771F\u5B9E\u8F6C\u89D2\u3002" },
          { id: "court-west-exit", x: 330, y: 305, label: "\u897F\u5ECA\u5C3D\u5934", kind: "goal", note: "\u5C40\u90E8\u573A\u666F\u6B62\u6B65\u70B9\uFF1B\u4E0B\u4E00\u573A\u666F\u624D\u53EF\u89C1\u56ED\u5185\u4E2D\u6C60\u3002" }
        ],
        edges: [
          ["court-entry", "window-foot"],
          ["window-foot", "court-middle"],
          ["court-middle", "west-turn"],
          ["west-turn", "passage-mouth"],
          ["passage-mouth", "passage-bend"],
          ["passage-bend", "court-west-exit"]
        ].map(([from, to]) => ({
          from,
          to,
          state: "candidate",
          via: "walk",
          note: "\u53EA\u786E\u8BA4\u5F53\u524D\u8BD5\u8D70\u56FE\u4E0A\u7684\u811A\u70B9\u8DEF\u5F84\uFF1B\u95E8\u5899\u5386\u53F2\u5750\u6807\u672A\u6838\u3002"
        }))
      }
    },
    {
      id: "liuyuan-lvyin-pond-study-v1",
      label: "\u7559\u56ED \xB7 \u7EFF\u836B\u8F69\u4E34\u6C60\u6E38\u620F\u8BD5\u8D70 v1",
      asset: "../assets/scene25d/liuyuan-lvyin-pond-study-v1.png",
      width: 1776,
      height: 896,
      tileW: 111,
      tileH: 56,
      note: "\u4E34\u6C60\u8BD5\u5207\u7247\uFF1A\u4F9D\u636E\u56ED\u6797\u5C40\u6240\u8FF0\u7EFF\u836B\u8F69\u4E34\u4E2D\u90E8\u6C60\u56ED\u53CA\u53E4\u6728\u4EA4\u67EF\u540E\u897F\u6298\u7684\u73B0\u72B6\u5173\u7CFB\u3002CH3 \u6A21\u5F0F\u53EF\u7531\u5C0F\u5EAD\u897F\u5ECA\u5C3D\u5934\u955C\u5934\u526A\u63A5\u5230\u672C\u5207\u7247\uFF0C\u4F46\u5C1A\u672A\u6309\u5B9E\u9645\u95E8\u6D1E\u5750\u6807\u62FC\u63A5\u3002\u4E1C\u4FA7\u5E72\u8DEF\u3001\u655E\u8F69\u4E0E\u540C\u4E00\u7247\u6C60\u6C34\u53EF\u8BD5\u8D70\uFF1B\u680F\u6746\u3001\u67F1\u4F4D\u3001\u690D\u683D\u548C\u5386\u53F2\u95E8\u4F4D\u5C1A\u672A\u5B9E\u6D4B\uFF0C\u4E0D\u80FD\u5F53\u4F5C 1890 \u590D\u539F\u6216\u6B63\u5F0F\u901A\u5173\u56FE\u3002",
      storyAnchors: [
        { id: "ly-lvyin-east-entry", x: 1660, y: 740, label: "\u7531\u4E1C\u4FA7\u77F3\u8DEF\u5165", kind: "boundary", scriptRef: "CH3-04", note: "\u73A9\u6CD5\u63A5\u5165\u811A\u70B9\uFF1BCH3 \u6A21\u5F0F\u53EF\u526A\u63A5\u81F3\u6B64\uFF0C\u4F46\u4E0E\u524D\u4E00\u5E55\u5B9E\u9645\u95E8\u6D1E\u5C1A\u672A\u5BF9\u9F50\u3002" },
        { id: "ly-lvyin-bank", x: 930, y: 690, label: "\u4E2D\u6C60\u521D\u89C1", kind: "interaction", scriptRef: "CH3-04", note: "\u73A9\u5BB6\u4EB2\u8D70\u81F3\u6B64\u518D\u5B8C\u6574\u89C1\u6C60\uFF1B\u4E0D\u662F\u56ED\u5916\u6CB3\u3002" },
        { id: "ly-lvyin-pavilion", x: 250, y: 470, label: "\u7EFF\u836B\u8F69\u4E34\u6C34\u5904", kind: "interaction", scriptRef: "CH3-04", note: "\u4E34\u6C34\u655E\u8F69\u7684\u73B0\u72B6\u5173\u7CFB\u6709\u636E\uFF1B\u67F1\u811A\u548C\u680F\u4F4D\u662F\u89C6\u89C9\u5019\u9009\u3002" }
      ],
      routeGraph: {
        nodes: [
          { id: "lvyin-entry", x: 1660, y: 740, label: "\u4E1C\u4FA7\u77F3\u8DEF", kind: "entry", anchorId: "ly-lvyin-east-entry", note: "\u72EC\u7ACB\u5207\u7247\u51FA\u751F\u70B9\u3002" },
          { id: "lvyin-east-bank", x: 1380, y: 730, label: "\u6C60\u4E1C\u5357\u77F3\u8DEF", kind: "waypoint", note: "\u6C34\u5CB8\u4E4B\u5916\u7684\u5E72\u8DEF\u3002" },
          { id: "lvyin-bank", x: 930, y: 690, label: "\u4E34\u6C60\u505C\u6B65", kind: "waypoint", anchorId: "ly-lvyin-bank", note: "\u680F\u5185\u5730\u9762\u3002" },
          { id: "lvyin-west-paving", x: 590, y: 665, label: "\u8F69\u524D\u77F3\u8DEF", kind: "waypoint", note: "\u9760\u5357\u7ED5\u5F00\u6C60\u680F\u3002" },
          { id: "lvyin-steps", x: 405, y: 575, label: "\u8F69\u524D\u53F0\u9636", kind: "waypoint", note: "\u4E0E\u4EAD\u67F1\u843D\u5730\u8303\u56F4\u5206\u5F00\u3002" },
          { id: "lvyin-pavilion", x: 250, y: 470, label: "\u7EFF\u836B\u8F69", kind: "goal", anchorId: "ly-lvyin-pavilion", note: "\u53EF\u7AD9\u7ACB\u7684\u655E\u8F69\u5730\u9762\u3002" }
        ],
        edges: [
          ["lvyin-entry", "lvyin-east-bank"],
          ["lvyin-east-bank", "lvyin-bank"],
          ["lvyin-bank", "lvyin-west-paving"],
          ["lvyin-west-paving", "lvyin-steps"],
          ["lvyin-steps", "lvyin-pavilion"]
        ].map(([from, to]) => ({
          from,
          to,
          state: "candidate",
          via: "walk",
          note: "\u4EC5\u4E3A\u5F53\u524D\u89C6\u89C9\u8BD5\u7A3F\u7684\u6E38\u620F\u8DEF\u7EBF\uFF1B\u5B9E\u666F\u680F\u4F4D\u4E0E\u5386\u53F2\u95E8\u4F4D\u5C1A\u672A\u9A8C\u6536\u3002"
        }))
      }
    },
    {
      id: "liuyuan-guanyun-court-study-v2",
      label: "\u7559\u56ED \xB7 \u51A0\u4E91\u5CF0\uFF0F\u6797\u6CC9\u8006\u7855\u4E4B\u9986 v2\uFF08\u7814\u7A76\u5019\u9009\uFF09",
      asset: "../assets/scene25d/liuyuan-guanyun-court-study-v2.png",
      width: 1536,
      height: 1024,
      tileW: 96,
      tileH: 64,
      note: "\u6309\u56ED\u6797\u5C40\u8D44\u6599\u6821\u6B63\u4E3A\u5357\u4FA7\u6797\u6CC9\u8006\u7855\u4E4B\u9986\u2014\u6D63\u4E91\u6CBC\u2014\u51A0\u4E91\u5CF0\u2014\u5317\u4FA7\u51A0\u4E91\u697C\uFF0C\u5357\u5385\u6A90\u5ECA\u7EB3\u5165\u753B\u9762\u3002\u5EFA\u7B51\u5177\u4F53\u5916\u89C2\u3001\u5DE6\u53F3\u4EAD\u5ECA\u95E8\u4F4D\u3001\u6C60\u5CB8\u548C\u690D\u683D\u5C1A\u672A\u5B9E\u6D4B\uFF1B\u4EC5\u72EC\u7ACB\u8BD5\u8D70\uFF0C\u4E0D\u63A5 CH3 \u6B63\u5F0F\u7ED3\u7B97\u3002v1 \u5F00\u653E\u524D\u5EAD\u4EC5\u4F5C\u8BEF\u5DEE\u5BF9\u7167\u3002",
      storyAnchors: [
        { id: "ly-guanyun-v2-hall", x: 757, y: 941, label: "\u6797\u6CC9\u8006\u7855\u4E4B\u9986\u5317\u5411\u5ECA\u4E0B\uFF08\u5019\u9009\uFF09", kind: "boundary", scriptRef: "CH3-06", note: "\u6B64\u5EFA\u7B51\u5728\u51A0\u4E91\u5CF0\u5357\u4FA7\u7684\u5173\u7CFB\u6709\u5B98\u65B9\u8D44\u6599\u4F9D\u636E\uFF1B\u672C\u56FE\u5ECA\u67F1\u4E0E\u95E8\u4F4D\u975E\u5B9E\u6D4B\u3002" },
        { id: "ly-guanyun-v2-view", x: 758, y: 638, label: "\u5385\u5317\u4E34\u6CBC\u671B\u5CF0", kind: "interaction", scriptRef: "CH3-06", note: "\u4ECE\u5357\u4FA7\u7ECF\u6CBC\u671B\u5CF0\u518D\u89C1\u5317\u697C\uFF1B\u6C34\u5CB8\u5F62\u72B6\u5F85\u6838\u3002" },
        { id: "ly-guanyun-v2-left", x: 361, y: 414, label: "\u897F\u5CB8\u8DEF\u5019\u9009", kind: "boundary", scriptRef: "CH3-06", note: "\u53EA\u4F9B\u56FE\u9762\u8BD5\u8D70\uFF0C\u4E0D\u8BA4\u5B9A\u5386\u53F2\u95E8\u4F4D\u3002" },
        { id: "ly-guanyun-v2-right", x: 1180, y: 405, label: "\u4E1C\u5CB8\u8DEF\u5019\u9009", kind: "boundary", scriptRef: "CH3-06", note: "\u53EA\u4F9B\u56FE\u9762\u8BD5\u8D70\uFF0C\u4E0D\u8BA4\u5B9A\u5386\u53F2\u95E8\u4F4D\u3002" }
      ],
      routeGraph: {
        nodes: [
          { id: "g2-hall", x: 757, y: 941, label: "\u5357\u5385\u5317\u5411\u5ECA\u4E0B", kind: "entry", anchorId: "ly-guanyun-v2-hall", note: "\u72EC\u7ACB\u8BD5\u8D70\u51FA\u751F\u70B9\u3002" },
          { id: "g2-passage", x: 757, y: 724, label: "\u5357\u5385\u6A90\u4E0B", kind: "waypoint", note: "\u5C4B\u6A90\u906E\u6321\u8DEF\u5F84\u3002" },
          { id: "g2-view", x: 758, y: 638, label: "\u6CBC\u524D\u8D4F\u5CF0", kind: "waypoint", anchorId: "ly-guanyun-v2-view", note: "\u7AD9\u5728\u6C34\u5357\u7684\u94FA\u5730\u3002" },
          { id: "g2-west-terrace", x: 379, y: 664, label: "\u897F\u4FA7\u8F6C\u5F2F", kind: "waypoint", note: "\u7ED5\u5F00\u6C34\u6CBC\u5DE6\u7AEF\u3002" },
          { id: "g2-west-bank", x: 361, y: 414, label: "\u897F\u5CB8\u8DEF", kind: "goal", anchorId: "ly-guanyun-v2-left", note: "\u6682\u4E0D\u6307\u5B9A\u901A\u5F80\u4F55\u95E8\u3002" },
          { id: "g2-east-terrace", x: 1160, y: 665, label: "\u4E1C\u4FA7\u8F6C\u5F2F", kind: "waypoint", note: "\u7ED5\u5F00\u6C34\u6CBC\u53F3\u7AEF\u3002" },
          { id: "g2-east-bank", x: 1180, y: 405, label: "\u4E1C\u5CB8\u8DEF", kind: "goal", anchorId: "ly-guanyun-v2-right", note: "\u6682\u4E0D\u6307\u5B9A\u901A\u5F80\u4F55\u95E8\u3002" }
        ],
        edges: [
          ["g2-hall", "g2-passage"],
          ["g2-passage", "g2-view"],
          ["g2-view", "g2-west-terrace"],
          ["g2-west-terrace", "g2-west-bank"],
          ["g2-view", "g2-east-terrace"],
          ["g2-east-terrace", "g2-east-bank"]
        ].map(([from, to]) => ({
          from,
          to,
          state: "candidate",
          via: "walk",
          note: "\u53EA\u9A8C\u8BC1\u7814\u7A76\u56FE\u7684\u53EF\u8D70\u811A\u70B9\uFF0C\u4E0D\u8BA4\u5B9A\u665A\u6E05\u95E8\u6D1E\u3002"
        }))
      }
    },
    {
      id: "liuyuan-guanyun-court-study-v1",
      label: "\u7559\u56ED \xB7 \u51A0\u4E91\u5CF0\u524D\u9662 v1\uFF08\u7814\u7A76\u5019\u9009\uFF09",
      asset: "../assets/scene25d/liuyuan-guanyun-court-study-v1.png",
      width: 1536,
      height: 1024,
      tileW: 96,
      tileH: 64,
      note: "\u65E7\u7248\u8BEF\u5DEE\u5BF9\u7167\uFF1A\u7F3A\u5C11\u5357\u4FA7\u6797\u6CC9\u8006\u7855\u4E4B\u9986\u7684\u56F4\u5408\uFF0C\u5317\u4FA7\u51A0\u4E91\u697C\u4E5F\u753B\u5F97\u50CF\u4E00\u5C42\u5385\u5802\u3002v2 \u5DF2\u6539\u6784\u56FE\uFF1B\u672C\u7248\u4ECD\u4FDD\u7559\u7F16\u8F91\u5668\u8349\u7A3F\uFF0C\u4E0D\u5F97\u4F5C\u4E3A\u6B63\u5F0F\u5B9E\u666F\u573A\u666F\u3002",
      storyAnchors: [
        { id: "ly-guanyun-entry", x: 535, y: 904, label: "\u524D\u9662\u5165\u53E3\u5019\u9009", kind: "boundary", scriptRef: "CH3-06", note: "\u56FE\u9762\u811A\u70B9\uFF0C\u5E76\u975E\u5386\u53F2\u95E8\u6D1E\u3002" },
        { id: "ly-guanyun-view", x: 790, y: 856, label: "\u6D63\u4E91\u6CBC\u524D\u671B\u51A0\u4E91\u5CF0", kind: "interaction", scriptRef: "CH3-06", note: "\u5CF0\u3001\u6CBC\u3001\u540E\u65B9\u5EFA\u7B51\u5173\u7CFB\u89C1\u56ED\u6797\u5C40\u73B0\u72B6\u8D44\u6599\uFF1B\u7CBE\u786E\u4F4D\u7F6E\u672A\u6838\u3002" },
        { id: "ly-guanyun-left", x: 155, y: 725, label: "\u897F\u5CB8\u8DEF\u5019\u9009", kind: "boundary", scriptRef: "CH3-06", note: "\u53EA\u9A8C\u8BC1\u56FE\u9762\u5DE6\u4FA7\u5E72\u8DEF\u3002" },
        { id: "ly-guanyun-right", x: 1455, y: 726, label: "\u4E1C\u5CB8\u8DEF\u5019\u9009", kind: "boundary", scriptRef: "CH3-06", note: "\u53EA\u9A8C\u8BC1\u56FE\u9762\u53F3\u4FA7\u5E72\u8DEF\u3002" }
      ],
      routeGraph: {
        nodes: [
          { id: "guanyun-entry", x: 535, y: 904, label: "\u524D\u5EAD", kind: "entry", anchorId: "ly-guanyun-entry", note: "\u72EC\u7ACB\u5207\u7247\u51FA\u751F\u70B9\u3002" },
          { id: "guanyun-view", x: 790, y: 856, label: "\u4E34\u6CBC\u8D4F\u77F3", kind: "waypoint", anchorId: "ly-guanyun-view", note: "\u6CBC\u524D\u94FA\u5730\u7684\u89C2\u5BDF\u70B9\u3002" },
          { id: "guanyun-left-bend", x: 290, y: 851, label: "\u897F\u4FA7\u8F6C\u5F2F", kind: "waypoint", note: "\u907F\u5F00\u524D\u666F\u77F3\u5806\u3002" },
          { id: "guanyun-left", x: 155, y: 725, label: "\u897F\u5CB8\u8DEF", kind: "goal", anchorId: "ly-guanyun-left", note: "\u5019\u9009\u4FA7\u8DEF\uFF0C\u975E\u771F\u5B9E\u95E8\u4F4D\u3002" },
          { id: "guanyun-right-bend", x: 1350, y: 890, label: "\u4E1C\u4FA7\u8F6C\u5F2F", kind: "waypoint", note: "\u4ECE\u524D\u5EAD\u7ED5\u5411\u53F3\u5CB8\u3002" },
          { id: "guanyun-right-bank", x: 1480, y: 855, label: "\u4E1C\u5CB8\u811A", kind: "waypoint", note: "\u5148\u7ED5\u8FC7\u5CB8\u77F3\uFF0C\u518D\u5411\u5317\u8D70\u3002" },
          { id: "guanyun-right", x: 1455, y: 726, label: "\u4E1C\u5CB8\u8DEF", kind: "goal", anchorId: "ly-guanyun-right", note: "\u5019\u9009\u4FA7\u8DEF\uFF0C\u975E\u771F\u5B9E\u95E8\u4F4D\u3002" }
        ],
        edges: [
          ["guanyun-entry", "guanyun-view"],
          ["guanyun-entry", "guanyun-left-bend"],
          ["guanyun-left-bend", "guanyun-left"],
          ["guanyun-view", "guanyun-right-bend"],
          ["guanyun-right-bend", "guanyun-right-bank"],
          ["guanyun-right-bank", "guanyun-right"]
        ].map(([from, to]) => ({
          from,
          to,
          state: "candidate",
          via: "walk",
          note: "\u4EC5\u4E3A\u751F\u6210\u56FE\u7684\u73A9\u6CD5\u5019\u9009\u901A\u8DEF\uFF1B\u4E0D\u662F\u5B9E\u666F\u6216\u665A\u6E05\u95E8\u8DEF\u5B9A\u4F4D\u3002"
        }))
      }
    },
    {
      id: "liuyuan-dongtian-three-windows-study-v1",
      label: "\u7559\u56ED \xB7 \u6D1E\u5929\u4E00\u78A7\u4E09\u7A97\u8FA8\u5F71\uFF08\u7814\u7A76\u5207\u7247\uFF09",
      asset: "../research-art/liuyuan-dongtian-three-windows-game-study-v2.png",
      width: 960,
      height: 544,
      tileW: 60,
      tileH: 34,
      note: "\u7528\u672C\u5730\u56FE\u7248\u6240\u8F7D\u4E09\u9762\u73AF\u5899\u3001\u4E2D\u6241\u516B\u89D2\u53CA\u4E24\u4FA7\u516D\u89D2\u3001\u4E1C\u7AF9\u897F\u8549\u5236\u4F5C\u7684\u72EC\u7ACB\u6E38\u620F\u5316\u623F\u95F4\u3002\u7F8E\u672F\u56FE\u539F\u59CB\u50CF\u7D20 1672\xD7941\uFF0C\u53EA\u5728\u6B64\u7F16\u8F91\u5668\u4E0E\u5C0F\u6837\u9875\u7F29\u653E\u5230 960\xD7544 \u4E16\u754C\u5750\u6807\u3002\u524D\u666F\u5730\u9762\u53EF\u8D70\uFF1B\u5899\u89D2\u3001\u94FA\u5730\u3001\u7A97\u8DDD\u3001\u5165\u53E3\u4E0E\u6E05\u672B\u5B58\u8C8C\u672A\u6D4B\u7ED8\uFF0C\u4E0D\u8FDE CH3 \u6B63\u5F0F\u95E8\u8DEF\u3002\u7F16\u8F91\u5668\u8349\u7A3F\u53EA\u4F9B\u672C\u5E55\u8BD5\u8D70\u3002",
      storyAnchors: [
        {
          id: "ly-dongtian-west-banana",
          ...LIUYUAN_WINDOW_ROOM_FEET.west,
          label: "\u897F\u7A97 \xB7 \u8549\u5F71",
          kind: "interaction",
          scriptRef: "CH3-06 \u7814\u7A76\u5019\u9009",
          note: "\u540C\u5F62\u516D\u89D2\u7A97\u4E4B\u4E00\uFF1B\u811A\u70B9\u662F\u4E3A\u6E38\u620F\u7ED8\u5236\u7684\u53EF\u8FBE\u7AD9\u4F4D\uFF0C\u4E0D\u662F\u5B9E\u6D4B\u4F4D\u7F6E\u3002"
        },
        {
          id: "ly-dongtian-middle-stone",
          ...LIUYUAN_WINDOW_ROOM_FEET.middle,
          label: "\u4E2D\u7A97 \xB7 \u77F3\u4E0E\u85E4",
          kind: "interaction",
          scriptRef: "CH3-06 \u7814\u7A76\u5019\u9009",
          note: "\u6241\u516B\u89D2\u7A97\u53EA\u7528\u4E8E\u6821\u65B9\u5411\uFF1B\u73B0\u72B6\u7A97\u540E\u77F3\u85E4\u6709\u56FE\u7248\uFF0C\u6E05\u672B\u72B6\u6001\u4ECD\u672A\u6838\u3002"
        },
        {
          id: "ly-dongtian-east-bamboo",
          ...LIUYUAN_WINDOW_ROOM_FEET.east,
          label: "\u4E1C\u7A97 \xB7 \u7AF9\u5F71",
          kind: "interaction",
          scriptRef: "CH3-06 \u7814\u7A76\u5019\u9009",
          note: "\u53E6\u4E00\u5B54\u516D\u89D2\u7A97\uFF1B\u4E1C\u7AF9\u7684\u65B9\u4F4D\u6765\u81EA\u672C\u5730\u68C0\u7D22\u539F\u6587\uFF0C\u672A\u4F5C\u540C\u671F\u65AD\u4EE3\u3002"
        }
      ],
      routeGraph: {
        nodes: [
          {
            id: "dongtian-room-spawn",
            ...LIUYUAN_WINDOW_ROOM_SPAWN,
            label: "\u5C4B\u5185\u94FA\u5730",
            kind: "entry",
            note: "\u72EC\u7ACB\u5C0F\u6837\u51FA\u751F\u811A\u70B9\uFF1B\u975E\u5386\u53F2\u5165\u53E3\u3002"
          },
          {
            id: "dongtian-west",
            ...LIUYUAN_WINDOW_ROOM_FEET.west,
            label: "\u897F\u7A97\u524D",
            kind: "goal",
            anchorId: "ly-dongtian-west-banana",
            note: "\u8D74\u8549\u5F71\u89C2\u5BDF\u3002"
          },
          {
            id: "dongtian-middle",
            ...LIUYUAN_WINDOW_ROOM_FEET.middle,
            label: "\u4E2D\u7A97\u524D",
            kind: "waypoint",
            anchorId: "ly-dongtian-middle-stone",
            note: "\u4ECE\u77F3\u85E4\u6821\u65B9\u5411\u3002"
          },
          {
            id: "dongtian-east",
            ...LIUYUAN_WINDOW_ROOM_FEET.east,
            label: "\u4E1C\u7A97\u524D",
            kind: "goal",
            anchorId: "ly-dongtian-east-bamboo",
            note: "\u8D74\u7AF9\u5F71\u89C2\u5BDF\u3002"
          }
        ],
        edges: [
          { from: "dongtian-room-spawn", to: "dongtian-middle", state: "candidate", via: "walk", note: "\u56FE\u9762\u53EF\u8D70\uFF0C\u4E0D\u8BC1\u660E\u771F\u5B9E\u5165\u53E3\u3002" },
          { from: "dongtian-middle", to: "dongtian-west", state: "candidate", via: "walk", note: "\u540C\u5BA4\u7A97\u524D\u94FA\u5730\uFF0C\u5386\u53F2\u94FA\u88C5\u672A\u6838\u3002" },
          { from: "dongtian-middle", to: "dongtian-east", state: "candidate", via: "walk", note: "\u540C\u5BA4\u7A97\u524D\u94FA\u5730\uFF0C\u5386\u53F2\u94FA\u88C5\u672A\u6838\u3002" }
        ]
      }
    },
    {
      id: "liuyuan-youyicun-transition-study-v1",
      label: "\u7559\u56ED \xB7 \u73B0\u72B6\u5706\u95E8\u51E0\u4F55\uFF08\u65E7\u6E38\u7EBF\u5F85\u6838\uFF09",
      asset: "../research-art/liuyuan-youyicun-transition-pixel-study-v1.png",
      width: 1536,
      height: 1024,
      tileW: 96,
      tileH: 64,
      note: "\u53C2\u7167\u300A\u6E38\u82CF\u5907\u89C8\u300B\u6E38\u7EBF\u53CA\u300A\u56ED\u5EAD\u4FE1\u6B65\u300B\u73B0\u72B6\u5706\u95E8\u56FE\u7248\u5236\u4F5C\u7684\u50CF\u7D20\u5316\u51E0\u4F55\u5019\u9009\u3002\u6863\u6848\u7814\u7A76\u7684\u53EF\u68C0\u7D22\u8BBA\u6587\u6587\u5B57\u63D0\u793A\uFF1A1909 \u5E74\u201C\u53C8\u4E00\u6751\u201D\u6307\u6797\u6CC9\u8006\u7855\u4E4B\u9986\u897F\u4FA7\u76F8\u63A5\u5ECA\u6BB5\uFF1B\u539F\u56FE\u7248\u5C1A\u672A\u6838\uFF0C\u6545\u672C\u5706\u95E8\u4E0D\u5F97\u5145\u4F5C\u65E7\u6E38\u7EBF\u540C\u4E00\u95E8\u3002\u5706\u95E8\u4E0E\u94FA\u5730\u662F\u56FE\u9762\u6F14\u7ECE\uFF0C\u4E0D\u662F 1890 \u5E74\u95E8\u4F4D\u6216\u6E05\u672B\u539F\u8C8C\u3002\u4FDD\u7559\u539F ID \u4E0E\u6D4F\u89C8\u5668\u8349\u7A3F\uFF0C\u4EC5\u4F9B\u62D6\u62FD Tile\u3001\u78B0\u649E\u3001\u906E\u6321\u548C\u72EC\u7ACB\u8BD5\u8D70\uFF1B\u4E0D\u5199 CH3 \u8FDB\u5EA6\u3002",
      storyAnchors: [
        { id: "ly-youyicun-entry", ...LIUYUAN_YOUYICUN_SPAWN, label: "\u73B0\u72B6\u5706\u95E8\u56FE\u9762\u8D77\u70B9", kind: "boundary", scriptRef: "\u72EC\u7ACB\u51E0\u4F55\u7814\u7A76", note: "\u53EA\u662F\u672C\u56FE\u51FA\u751F\u811A\u70B9\uFF0C\u4E0D\u4EE3\u8868\u897F\u90E8\u82B1\u623F\u5386\u53F2\u63A5\u70B9\u3002" },
        { id: "ly-youyicun-front", ...LIUYUAN_YOUYICUN_FEET.gateFront, label: "\u95E8\u524D\u56DE\u671B", kind: "interaction", scriptRef: "\u72EC\u7ACB\u51E0\u4F55\u7814\u7A76", note: "\u5706\u95E8\u5728\u73B0\u72B6\u56FE\u7248\u53EF\u89C1\uFF1B\u672C\u56FE\u95E8\u4F4D\u4E0E\u62CD\u6444\u89C6\u89D2\u4ECD\u4E3A\u827A\u672F\u52A0\u5DE5\u3002" },
        { id: "ly-youyicun-threshold", ...LIUYUAN_YOUYICUN_FEET.threshold, label: "\u95E8\u69DB\u8BD5\u8D70", kind: "trigger", scriptRef: "\u72EC\u7ACB\u51E0\u4F55\u7814\u7A76", note: "\u4EC5\u6D4B\u8BD5\u753B\u9762\u80FD\u5426\u7A7F\u95E8\uFF0C\u4E0D\u5199\u7AE0\u8282\u65D7\u6807\u3002" },
        { id: "ly-youyicun-inner", ...LIUYUAN_YOUYICUN_FEET.gardenSide, label: "\u95E8\u540E\u56FE\u9762", kind: "interaction", scriptRef: "\u72EC\u7ACB\u51E0\u4F55\u7814\u7A76", note: "\u56FE\u9762\u690D\u682A\u3001\u811A\u70B9\u548C\u65E7\u6E38\u7EBF\u5BF9\u5E94\u5173\u7CFB\u5747\u672A\u6838\u3002" },
        { id: "ly-youyicun-onward", ...LIUYUAN_YOUYICUN_FEET.onward, label: "\u56FE\u9762\u7EC8\u70B9 \xB7 \u6B62\u6B65", kind: "boundary", scriptRef: "\u72EC\u7ACB\u51E0\u4F55\u7814\u7A76", note: "1909 \u6863\u6848\u7814\u7A76\u63D0\u793A\u65E7\u201C\u53C8\u4E00\u6751\u201D\u53E6\u4E3A\u5385\u897F\u5ECA\u6BB5\uFF1B\u672C\u5706\u95E8\u4E0D\u81EA\u52A8\u63A5\u56DB\u9762\u5385\u6216\u77F3\u6797\u3002" }
      ],
      routeGraph: {
        nodes: [
          { id: "youyicun-entry", ...LIUYUAN_YOUYICUN_SPAWN, label: "\u56FE\u9762\u8D77\u70B9", kind: "entry", anchorId: "ly-youyicun-entry", note: "\u4E0D\u4EE3\u8868\u82B1\u6728\u9662\u5386\u53F2\u6765\u8DEF\u3002" },
          { id: "youyicun-front", ...LIUYUAN_YOUYICUN_FEET.gateFront, label: "\u95E8\u524D", kind: "waypoint", anchorId: "ly-youyicun-front", note: "\u4ECE\u524D\u666F\u94FA\u5730\u63A5\u8FD1\u5706\u95E8\u3002" },
          { id: "youyicun-threshold", ...LIUYUAN_YOUYICUN_FEET.threshold, label: "\u95E8\u69DB", kind: "waypoint", anchorId: "ly-youyicun-threshold", note: "\u5706\u95E8\u4E2D\u5FC3\u811A\u70B9\uFF0C\u89C6\u89C9\u9700\u590D\u6838\u3002" },
          { id: "youyicun-inner", ...LIUYUAN_YOUYICUN_FEET.gardenSide, label: "\u95E8\u540E", kind: "waypoint", anchorId: "ly-youyicun-inner", note: "\u4E0D\u4EE3\u8868\u6E05\u672B\u5B9E\u6D4B\u3002" },
          { id: "youyicun-onward", ...LIUYUAN_YOUYICUN_FEET.onward, label: "\u56FE\u9762\u6B62\u6B65\u70B9", kind: "goal", anchorId: "ly-youyicun-onward", note: "\u4E0D\u63A8\u5B9A\u4E3A\u56DB\u9762\u5385\u65B9\u5411\u3002" }
        ],
        edges: [
          ["youyicun-entry", "youyicun-front"],
          ["youyicun-front", "youyicun-threshold"],
          ["youyicun-threshold", "youyicun-inner"],
          ["youyicun-inner", "youyicun-onward"]
        ].map(([from, to]) => ({
          from,
          to,
          state: "candidate",
          via: "walk",
          note: "\u4EC5\u9A8C\u8BC1\u751F\u6210\u7814\u7A76\u56FE\u4E0A\u7684\u94FA\u5730\u8FDE\u901A\uFF1B\u771F\u5B9E\u95E8\u4F4D\u4E0E\u5E74\u4EE3\u5F85\u6838\u3002"
        }))
      }
    },
    {
      id: "liuyuan-stone-forest-court-study-v1",
      label: "\u7559\u56ED \xB7 \u77F3\u6797\u5C0F\u9662\u7ED5\u5CF0\u8BD5\u8D70\uFF08\u77F3\u5F62\u4FEE\u8BA2\u56FE v2\uFF09",
      asset: "../assets/scene25d/liuyuan-stone-forest-court-study-v2.png",
      width: 1776,
      height: 896,
      tileW: 111,
      tileH: 56,
      note: "\u57FA\u4E8E\u56ED\u6797\u5C40\u300A\u63D6\u5CF0\u8F69\u300B\u3001\u6C11\u56FD\u300A\u6E38\u82CF\u5907\u89C8\u300B\u4E0E\u300A\u900F\u56ED\u89C2\u77F3\u300B\u56FE12/13\u5F62\u6210\u7684\u6E38\u620F\u5207\u7247\uFF1Bv2 \u77F3\u5F62\u6309\u5218\u6055\u6240\u8FF0\u4E0D\u540C\u5C0F\u77F3\u5F62\u6001\u91CD\u65B0\u7ED8\u5236\uFF0C\u4E0D\u5BF9\u5E94\u5177\u4F53\u5B9E\u77F3\u8EAB\u4EFD\u3002\u56FE12\u628A\u4F20\u7ECF\u5802\u3001\u8FD8\u8BFB\u9986\u3001\u63D6\u5CF0\u8F69\u3001\u6D1E\u5929\u4E00\u78A7\u53CA\u4E09\u7EC4\u9694\u9662\u5206\u5F00\uFF1B\u5F53\u524D\u753B\u9762\u538B\u7F29\u591A\u4E2A\u5C0F\u9662\uFF0C\u53EA\u4F9B\u7814\u7A76\u6E38\u8D70\u548C\u89C2\u77F3\uFF0C\u4E0D\u4F5C\u4E3A 1890 \u5B9E\u6D4B\u5E73\u9762\u6216 CH3-06 \u6B63\u5F0F\u9662\u8DEF\u3002",
      storyAnchors: [
        { id: "ly-stone-entry", x: 465, y: 550, label: "\u897F\u4FA7\u9662\u8DEF\u8FDB\u5165", kind: "boundary", scriptRef: "CH3-05/06", note: "\u53EA\u4F5C\u77F3\u6797\u5C0F\u9662\u5C40\u90E8\u8BD5\u8D70\u5165\u53E3\uFF1B\u4ECE\u897F\u90E8\u82B1\u623F\u6A2A\u7A7F\u4E2D\u90E8\u7684\u5173\u5361\u5C1A\u672A\u5236\u4F5C\u3002" },
        { id: "ly-stone-yifeng", x: 525, y: 390, label: "\u63D6\u5CF0\u8F69\u524D\u505C\u6B65", kind: "interaction", scriptRef: "CH3-06", note: "\u4E66\u623F/\u8D4F\u77F3\u5EFA\u7B51\u73B0\u72B6\u5173\u7CFB\u6709\u636E\uFF1B\u672C\u56FE\u7ACB\u9762\u548C\u95E8\u4F4D\u672A\u9A8C 1890\u3002" },
        { id: "ly-stone-peak", x: 975, y: 710, label: "\u4E3B\u77F3\u524D\u770B\u77F3\uFF08\u665A\u7FE0\u5CF0\u4F4D\u7F6E\u610F\u5411\uFF09", kind: "interaction", scriptRef: "CH3-06", note: "\u665A\u7FE0\u5CF0\u662F\u53F2\u6599\u4E2D\u7684\u89C2\u8D4F\u4E2D\u5FC3\uFF0C\u4F46\u8FD9\u5757\u751F\u6210\u77F3\u4E0D\u662F\u5176\u5B9E\u666F\u5916\u5F62\uFF0C\u811A\u70B9\u4EA6\u4E3A\u6E38\u620F\u62DF\u5236\u3002" },
        { id: "ly-stone-east", x: 1635, y: 530, label: "\u5411\u4E1C\u56ED\u5ECA\u9053", kind: "boundary", scriptRef: "CH3-06", note: "\u76DB\u6C0F\u4E1C\u6269\u5728\u77F3\u6797\u5C0F\u9662\u4E1C\u4FA7\u901A\u4E1C\u56ED\u6709\u7814\u7A76\u4F9D\u636E\uFF1B\u5B9E\u9645\u95E8\u6D1E\u5750\u6807\u5F85\u6D4B\u7ED8\u3002" }
      ],
      routeGraph: {
        nodes: [
          { id: "stone-entry", x: 465, y: 550, label: "\u897F\u4FA7\u9662\u8DEF", kind: "entry", anchorId: "ly-stone-entry", note: "\u72EC\u7ACB\u5207\u7247\u51FA\u751F\u811A\u70B9\u3002" },
          { id: "stone-yifeng", x: 525, y: 390, label: "\u63D6\u5CF0\u8F69\u524D", kind: "waypoint", anchorId: "ly-stone-yifeng", note: "\u53EF\u505C\u5728\u5ECA\u4E0B\uFF0C\u4E0D\u7A7F\u67F1\u811A\u3002" },
          { id: "stone-front-left", x: 575, y: 620, label: "\u5CF0\u77F3\u897F\u5357", kind: "waypoint", note: "\u4ECE\u7A84\u5904\u8F6C\u5411\u5CF0\u77F3\u524D\u65B9\u3002" },
          { id: "stone-front-turn", x: 730, y: 700, label: "\u5CF0\u77F3\u524D\u6298", kind: "waypoint", note: "\u4E0D\u5207\u8FC7\u5CF0\u77F3\u6839\u811A\u3002" },
          { id: "stone-peak-view", x: 975, y: 710, label: "\u4E3B\u77F3\u524D", kind: "waypoint", anchorId: "ly-stone-peak", note: "\u4EC5\u9A8C\u8BC1\u5F53\u524D\u5E95\u56FE\u4E0A\u7684\u94FA\u5730\u89C2\u77F3\u811A\u70B9\u3002" },
          { id: "stone-front-right", x: 1280, y: 710, label: "\u5CF0\u77F3\u4E1C\u5357", kind: "waypoint", note: "\u6CBF\u77F3\u8DEF\u8F6C\u5411\u53F3\u5ECA\u3002" },
          { id: "stone-east-bend", x: 1480, y: 620, label: "\u4E1C\u4FA7\u5C0F\u9662", kind: "waypoint", note: "\u907F\u5F00\u5CF0\u77F3\u548C\u53F3\u5ECA\u67F1\u3002" },
          { id: "stone-east-exit", x: 1635, y: 530, label: "\u4E1C\u56ED\u65B9\u5411", kind: "goal", anchorId: "ly-stone-east", note: "\u4EC5\u8BD5\u8D70\u5230\u4E1C\u4FA7\u5ECA\u53E3\u3002" }
        ],
        edges: [
          ["stone-entry", "stone-yifeng"],
          ["stone-entry", "stone-front-left"],
          ["stone-front-left", "stone-front-turn"],
          ["stone-front-turn", "stone-peak-view"],
          ["stone-peak-view", "stone-front-right"],
          ["stone-front-right", "stone-east-bend"],
          ["stone-east-bend", "stone-east-exit"]
        ].map(([from, to]) => ({
          from,
          to,
          state: "candidate",
          via: "walk",
          note: "\u53EA\u9A8C\u8BC1\u5F53\u524D\u751F\u6210\u753B\u9762\u4E0A\u7684\u901A\u8DEF\u4E0E\u89D2\u8272\u811A\u70B9\uFF0C\u4E0D\u58F0\u79F0\u5386\u53F2\u95E8\u6D1E\u7CBE\u786E\u4F4D\u7F6E\u3002"
        }))
      }
    },
    {
      id: "liuyuan-study-court-research-v1",
      label: "\u7559\u56ED \xB7 \u5317\u7F18\u4E66\u658B\u9662\u72EC\u7ACB\u7814\u7A76\u8BD5\u8D70 v1",
      asset: "../assets/scene25d/liuyuan-study-court-research-v1.png",
      width: 1536,
      height: 1024,
      tileW: 96,
      tileH: 64,
      note: "\u4F9D\u636E\u73B0\u72B6\u8D44\u6599\u201C\u77F3\u6797\u5317\u4FA7\u56F4\u5408\u4E66\u658B\u9662\u3001\u4E8C\u5C42\u786C\u5C71\u5C4B\u5750\u897F\u671D\u4E1C\u3001\u658B\u524D\u56DE\u5ECA\u4E0E\u6E56\u77F3\u82B1\u575B\u201D\u5236\u4F5C\u7684\u539F\u521B\u6E38\u620F\u5E95\u56FE\u3002\u5357\u7F18\u5F00\u53E3\u3001\u6811\u4F4D\u3001\u7A97\u683C\u3001\u94FA\u5730\u5C3A\u5EA6\u548C\u67F1\u4F4D\u5168\u662F\u6E38\u620F\u5019\u9009\uFF0C\u4E0D\u80FD\u79F0\u6E05\u672B\u590D\u539F\uFF1B\u65E7\u540D\u201C\u8FD8\u8BFB\u6211\u4E66\u658B\uFF0F\u5904\u201D\u4E0E\u73B0\u540D\u6709\u51B2\u7A81\uFF0C\u4E0D\u5728\u56FE\u4E0A\u753B\u533E\u3002\u72EC\u7ACB\u7814\u7A76\u4E0D\u5199\u5B58\u6863\uFF1B\u5F53\u4EE3\u6E38\u7EBF\u6E38\u620F\u6A21\u5F0F\u53EF\u5728\u542C\u58F0\u8F7B\u53E9\u540E\u7ED3\u7B97\u865A\u6784\u627E\u4E66\u658B\u4E8B\u4EF6\u3002",
      storyAnchors: [
        { id: "ly-study-court-entry", x: 720, y: 842, label: "\u9662\u4E2D\u7814\u7A76\u51FA\u751F\u70B9", kind: "boundary", scriptRef: "CH3-06/\u72EC\u7ACB\u7814\u7A76", note: "\u4E0D\u4EE3\u8868\u77F3\u6797\u65E7\u95E8\u6D1E\u3002" },
        { id: "ly-study-court-door", x: 480, y: 695, label: "\u897F\u4FA7\u4E66\u623F\u95E8\u524D\u53EF\u7AD9\u811A\u70B9", kind: "interaction", scriptRef: "CH3-06/\u72EC\u7ACB\u7814\u7A76", note: "\u5728\u94FA\u5730\u4E0A\u542C\u58F0\u3001\u8F7B\u53E9\u7684\u6E38\u620F\u811A\u70B9\uFF1B\u5B83\u4E0D\u662F\u95E8\u6D1E\u5750\u6807\uFF0C\u6E05\u672B\u95E8\u4F4D\u4E0E\u533E\u989D\u672A\u6838\u3002" },
        { id: "ly-study-court-tree", x: 924, y: 734, label: "\u7ED5\u82B1\u53F0", kind: "interaction", scriptRef: "CH3-06/\u72EC\u7ACB\u7814\u7A76", note: "\u6E56\u77F3\u82B1\u53F0\u6709\u73B0\u72B6\u4F9D\u636E\uFF1B\u5177\u4F53\u6811\u79CD\u3001\u682A\u4F4D\u4E0E\u82B1\u53F0\u5C3A\u5BF8\u4E3A\u7F8E\u672F\u5019\u9009\u3002" },
        { id: "ly-study-court-corridor", x: 1325, y: 660, label: "\u4E1C\u4FA7\u5ECA\u4E0B\u6B62\u6B65", kind: "boundary", scriptRef: "CH3-06/\u72EC\u7ACB\u7814\u7A76", note: "\u53EA\u6D4B\u8BD5\u5C0F\u9662\u7ED5\u884C\uFF0C\u4E0D\u63A8\u65AD\u901A\u5411\u4F55\u5904\u3002" }
      ],
      routeGraph: {
        nodes: [
          { id: "study-entry", x: 720, y: 842, label: "\u9662\u4E2D", kind: "entry", anchorId: "ly-study-court-entry", note: "\u72EC\u7ACB\u7814\u7A76\u51FA\u751F\u70B9\u3002" },
          { id: "study-door", x: 480, y: 695, label: "\u4E66\u623F\u95E8\u524D\u94FA\u5730", kind: "goal", anchorId: "ly-study-court-door", note: "\u7AD9\u5B9A\u540E\u53EF\u542C\u6216\u53E9\uFF1B\u4E0D\u662F\u65E7\u95E8\u6D1E\u5750\u6807\u3002" },
          { id: "study-tree", x: 924, y: 734, label: "\u82B1\u53F0\u5357\u4FA7", kind: "waypoint", anchorId: "ly-study-court-tree", note: "\u4E0D\u5F97\u8E29\u5165\u6811\u6839\u77F3\u5E8A\u3002" },
          { id: "study-south-turn", x: 1265, y: 780, label: "\u82B1\u53F0\u4E1C\u5357\u8F6C\u5F2F", kind: "waypoint", note: "\u6CBF\u56FE\u9762\u94FA\u5730\u7ED5\u8FC7\u82B1\u53F0\u3002" },
          { id: "study-corridor", x: 1325, y: 660, label: "\u4E1C\u5ECA\u6B62\u6B65", kind: "goal", anchorId: "ly-study-court-corridor", note: "\u4E0D\u8FDE\u63A5\u5386\u53F2\u95E8\u6D1E\u3002" }
        ],
        edges: [
          { from: "study-entry", to: "study-door", state: "candidate", via: "walk", note: "\u6E38\u620F\u56FE\u9762\u8DEF\u5F84\uFF0C\u4E0D\u662F\u6E05\u672B\u5B9E\u6D4B\u3002" },
          { from: "study-entry", to: "study-tree", state: "candidate", via: "walk", note: "\u5728\u82B1\u53F0\u524D\u7ED5\u884C\u3002" },
          { from: "study-tree", to: "study-south-turn", state: "candidate", via: "walk", note: "\u6CBF\u82B1\u53F0\u5357\u4FA7\u7ED5\u8FC7\u3002" },
          { from: "study-south-turn", to: "study-corridor", state: "candidate", via: "walk", note: "\u4EC5\u4F9B\u7814\u7A76\u8BD5\u8D70\u3002" }
        ]
      }
    },
    {
      id: "liuyuan-study-interior-research-v1",
      label: "\u7559\u56ED \xB7 \u4E66\u658B\u5185\u666F\u4EBA\u7269\u7814\u7A76\u8BD5\u8D70 v1",
      asset: "../assets/scene25d/liuyuan-study-interior-research-v1.png",
      width: 1536,
      height: 1024,
      tileW: 96,
      tileH: 64,
      note: "CH3-07/08 \u5BA4\u5185\u4EBA\u7269\u8282\u62CD\u7814\u7A76\u56FE\uFF1A\u4E66\u6848\u3001\u67B6\u3001\u7A97\u5916\u8549\u5F71\u4E0E\u95E8\u69DB\u90FD\u662F\u6E38\u620F\u6F14\u51FA\u5019\u9009\uFF0C\u65E0\u6E05\u672B\u539F\u4F4D\u7167\u7247\u3002\u72EC\u7ACB\u8BD5\u8D70\u4E0D\u5199\u7AE0\u8282\u65D7\u6807\uFF1B\u5F53\u4EE3\u6E38\u7EBF\u6E38\u620F\u6A21\u5F0F\u53EF\u5728\u4EBA\u7269\u5BF9\u8BDD\u4E2D\u8BB0\u5F55\u865A\u6784\u4E8B\u4EF6\u3002\u5377\u7EB8/\u8FC7\u624B\u53F0\u8BCD\u5C5E\u865A\u6784\u4EBA\u7269\u5904\u5883\uFF0C\u4E0D\u662F\u6E05\u672B\u95E8\u623F\u5236\u5EA6\u8BC1\u636E\uFF1B\u4E0D\u4E0E\u4E66\u658B\u9662\u5047\u63A5\u5386\u53F2\u95E8\u8DEF\u3002",
      storyAnchors: [
        { id: "ly-study-room-entry", x: 770, y: 840, label: "\u5BA4\u5185\u7814\u7A76\u51FA\u751F\u70B9", kind: "boundary", scriptRef: "CH3-07/\u72EC\u7ACB\u7814\u7A76", note: "\u72EC\u7ACB\u955C\u5934\u843D\u70B9\uFF0C\u975E\u5DF2\u6838\u65E7\u95E8\u3002" },
        { id: "ly-study-room-copyist", x: 630, y: 510, label: "\u6284\u4E66\u4EBA\u65C1", kind: "npc", scriptRef: "CH3-07/\u6E38\u620F\u5408\u6210", note: "\u865A\u6784\u65E0\u540D\u89D2\u8272\uFF1B\u9700\u4EB2\u8FD1\u624D\u5F00\u53E3\u3002\u5F53\u4EE3\u6E38\u7EBF\u7AE0\u6A21\u5F0F\u624D\u5199 ly-scholar-met\u3002" },
        { id: "ly-study-room-desk", x: 480, y: 500, label: "\u6848\u5934\u7EB8\u7B14", kind: "interaction", scriptRef: "CH3-07/\u72EC\u7ACB\u7814\u7A76", note: "\u80FD\u770B\u89C1\u7EB8\u7B14\uFF0C\u4E0D\u58F0\u79F0\u684C\u6848\u662F\u5386\u53F2\u539F\u7269\u3002" },
        { id: "ly-study-room-shelf", x: 1120, y: 465, label: "\u4E66\u67B6", kind: "interaction", scriptRef: "CH3-07/\u72EC\u7ACB\u7814\u7A76", note: "\u53EF\u9009\u89C2\u5BDF\uFF1B\u67B6\u4F4D\u53CA\u4E66\u7C4D\u5747\u4E3A\u6F14\u51FA\u3002" },
        { id: "ly-study-room-window", x: 815, y: 440, label: "\u7A97\u5916\u8549\u5F71", kind: "interaction", scriptRef: "CH3-07/\u72EC\u7ACB\u7814\u7A76", note: "\u7559\u56ED\u77F3\u6797\u4E00\u5E26\u8549\u5F71\u6709\u603B\u4F53\u6587\u5B57\u4F9D\u636E\uFF1B\u672C\u7A97\u4E0E\u682A\u4F4D\u672A\u6838\u3002" }
      ],
      routeGraph: {
        nodes: [
          { id: "study-room-entry", x: 770, y: 840, label: "\u95E8\u69DB\u5185", kind: "entry", anchorId: "ly-study-room-entry", note: "\u7814\u7A76\u843D\u70B9\u3002" },
          { id: "study-room-person", x: 630, y: 510, label: "\u4EBA\u65C1", kind: "waypoint", anchorId: "ly-study-room-copyist", note: "\u8D70\u8FD1\u542C\u89C1\u7B2C\u4E00\u53E5\u3002" },
          { id: "study-room-desk", x: 480, y: 500, label: "\u6848\u524D", kind: "goal", anchorId: "ly-study-room-desk", note: "\u7EB8\u7B14\u4F9B\u73A9\u5BB6\u4EB2\u770B\u3002" },
          { id: "study-room-window", x: 815, y: 440, label: "\u7A97\u524D", kind: "goal", anchorId: "ly-study-room-window", note: "\u8549\u53F6\u4ECE\u7A97\u683C\u5916\u89C1\u3002" },
          { id: "study-room-shelf", x: 1120, y: 465, label: "\u67B6\u524D", kind: "goal", anchorId: "ly-study-room-shelf", note: "\u53EF\u9009\u89C2\u5BDF\u3002" }
        ],
        edges: [
          ["study-room-entry", "study-room-person"],
          ["study-room-person", "study-room-desk"],
          ["study-room-person", "study-room-window"],
          ["study-room-window", "study-room-shelf"]
        ].map(([from, to]) => ({
          from,
          to,
          state: "candidate",
          via: "walk",
          note: "\u53EA\u9A8C\u8BC1\u8FD9\u5F20\u7814\u7A76\u56FE\u5185\u90E8\u53EF\u8D70\u5173\u7CFB\uFF0C\u4E0D\u58F0\u79F0\u6E05\u672B\u5BA4\u5185\u5C3A\u5EA6\u3002"
        }))
      }
    },
    {
      id: "liuyuan-flower-work-yard-study-v3",
      label: "\u7559\u56ED \xB7 \u82B1\u6728\u4F5C\u4E1A\u9662\u6E38\u620F\u8BD5\u8D70 v3\uFF08\u76C6\u5170\u5DE5\u4F5C\u533A\uFF09",
      asset: "../assets/scene25d/liuyuan-flower-work-yard-study-v1.png",
      width: 1776,
      height: 896,
      tileW: 111,
      tileH: 56,
      note: "CH3-05 \u82B1\u623F/\u82B1\u5320\u673A\u5236\u7684\u89C6\u89C9\u5019\u9009\uFF1A\u6C11\u56FD\u300A\u6E38\u82CF\u5907\u89C8\u300B\u5728\u5C0F\u84EC\u83B1\u4E00\u6BB5\u8BB0\u82B1\u623F\u4E0E\u852C\u5703\uFF0C\u786E\u5207\u65E7\u5740\u5F85\u6838\uFF1B\u672C\u56FE\u53EA\u4F5C\u82B1\u6728\u4F5C\u4E1A\u9662\u7684\u73A9\u6CD5\u6F14\u7ECE\uFF0C\u4E0D\u590D\u539F 1890 \u65E7\u95E8\u4F4D\u3002\u76C6\u4E2D\u7684\u662F\u5170\uFF1B\u672C\u5E55\u4E0D\u6446\u76C6\u683D\u7389\u5170\uFF0C\u4E5F\u4E0D\u628A\u7389\u5170\u585E\u8FDB\u5899\u811A\u3002",
      storyAnchors: [
        { id: "ly-flower-v1-entry", x: 820, y: 500, label: "\u7531\u56ED\u8DEF\u8FDB\u5165\u4F5C\u4E1A\u9662", kind: "boundary", scriptRef: "CH3-05", note: "\u955C\u5934\u4ECE\u9662\u4E2D\u5F00\u9614\u77F3\u9762\u63A5\u5165\uFF0C\u80FD\u770B\u89C1\u6A90\u4E0B\u6876\u4F4D\u4E0E\u82B1\u5320\uFF1B\u4E0E\u7EFF\u836B\u8F69\u4E4B\u95F4\u662F\u5267\u60C5\u526A\u63A5\uFF0C\u4E0D\u662F\u5DF2\u6838\u5B9E\u7684\u65E7\u95E8\u6D1E\u3002" },
        { id: "ly-flower-v1-bucket", x: 520, y: 500, label: "\u6A90\u4E0B\u653E\u7CA5\u6876 \xB7 \u73A9\u5BB6\u811A\u70B9", kind: "interaction", scriptRef: "CH3-05", note: "\u73A9\u5BB6\u7AD9\u5728\u6876\u4F4D (480,445) \u524D\u7684\u5B89\u5168\u94FA\u5730\u4EA4\u7CA5\uFF1B\u9001\u7CA5\u5173\u7CFB\u4E3A\u5267\u672C\u6F14\u7ECE\uFF0C\u4E0D\u58F0\u79F0\u7559\u5B58\u5B9E\u7269\u3002" },
        { id: "ly-flower-v1-worker", ...LIUYUAN_FLOWER_WORKER_STAND, label: "\u82B1\u5320\u8EAB\u4FA7 \xB7 \u73A9\u5BB6\u811A\u70B9", kind: "npc", scriptRef: "CH3-05", note: "\u73A9\u5BB6\u7AD9\u5728\u82B1\u5320 (565,450) \u8EAB\u4FA7\u800C\u975E\u8E29\u5176\u78B0\u649E\u76D2\uFF1B\u76DB\u6C0F\u96C7\u82B1\u5DE5/\u5170\u82B1\u57F9\u80B2\u6709\u540E\u51FA\u8BB0\u8F7D\uFF0C\u5177\u4F53\u4EBA\u7269\u865A\u6784\u3002" },
        { id: "ly-flower-v1-east-exit", x: 1675, y: 445, label: "\u8FD4\u56ED\u8DEF\u65B9\u5411\uFF08\u5360\u4F4D\uFF09", kind: "boundary", scriptRef: "CH3-06", note: "\u6C11\u56FD\u6E38\u8BB0\u628A\u82B1\u623F\u548C\u4E1C\u56ED\u5206\u5728\u4E0D\u540C\u6BB5\u843D\uFF1B\u8FD9\u91CC\u4E0D\u662F\u76F4\u901A\u4E1C\u90E8\u4E66\u658B\u7684\u5386\u53F2\u95E8\u6D1E\u3002" }
      ],
      routeGraph: {
        nodes: [
          { id: "flower-entry", x: 820, y: 500, label: "\u9662\u5730\u955C\u5934\u843D\u70B9", kind: "entry", anchorId: "ly-flower-v1-entry", note: "\u672C\u5207\u7247\u51FA\u751F\u70B9\uFF1B\u4E0D\u662F\u5386\u53F2\u95E8\u6D1E\u3002" },
          { id: "flower-bucket", x: 520, y: 500, label: "\u6A90\u4E0B\u6876\u4F4D\u524D", kind: "waypoint", anchorId: "ly-flower-v1-bucket", note: "\u53EF\u7AD9\u7ACB\u811A\u70B9\uFF0C\u4E0D\u8FDB\u5DE5\u4F5C\u53F0\u3002" },
          { id: "flower-worker", ...LIUYUAN_FLOWER_WORKER_STAND, label: "\u82B1\u5320\u8EAB\u4FA7", kind: "waypoint", anchorId: "ly-flower-v1-worker", note: "\u4E0D\u8E29\u65B0\u57F9\u571F\uFF1B\u5170\u8C31\u4EA4\u753B\u8FD4\u56DE\u672C\u811A\u70B9\u3002" },
          { id: "flower-east-exit", x: 1675, y: 445, label: "\u8FD4\u56ED\u8DEF\u8BD5\u8D70\u8FB9\u754C", kind: "goal", anchorId: "ly-flower-v1-east-exit", note: "\u4ECD\u9700\u5236\u4F5C\u8DE8\u56ED\u8FC7\u6E21\uFF1B\u5E76\u975E\u65E7\u95E8\u4F4D\u3002" }
        ],
        edges: [
          ["flower-entry", "flower-bucket"],
          ["flower-bucket", "flower-worker"],
          ["flower-worker", "flower-east-exit"]
        ].map(([from, to]) => ({
          from,
          to,
          state: "candidate",
          via: "walk",
          note: "\u53EA\u9A8C\u8BC1\u6B64\u56FE\u53EF\u8D70\u811A\u70B9\uFF1B\u771F\u5B9E\u82B1\u623F\u4E0E\u4E1C\u90E8\u9662\u843D\u901A\u8DEF\u672A\u8003\u5B9A\u3002"
        }))
      }
    },
    {
      id: "liuyuan-east-hall-magnolia-court-study-v1",
      label: "\u7559\u56ED \xB7 \u4E1C\u90E8\u5B85\u9662\u5385\u524D\u53CC\u7389\u5170\uFF08\u690D\u683D\u8BED\u6CD5\u5019\u9009\uFF09",
      asset: "../assets/scene25d/liuyuan-east-hall-magnolia-court-study-v1.png",
      width: 1776,
      height: 896,
      tileW: 111,
      tileH: 56,
      note: "\u6309\u300A\u957F\u7269\u5FD7\u300B\u7389\u5170\u5B9C\u79CD\u5385\u4E8B\u524D\u3001\u5BF9\u5217\u6570\u682A\uFF0C\u5236\u4F5C\u5B85\u9662\u5385\u524D\u7684\u4E24\u682A\u5730\u690D\u4E54\u6728\uFF1B\u5DE6\u4FA7\u76C6\u5170\u5DE5\u4F5C\u6A90\u4E0E\u53F3\u4FA7\u8F83\u81EA\u7531\u7684\u56ED\u666F\u7528\u4E8E\u5BF9\u6BD4\u3002\u6B64\u56FE\u53EA\u793A\u8303\u201C\u5B85\u7684\u5385\u524D\u5C40\u90E8\u6709\u79E9\u5E8F\u3001\u56ED\u7684\u6E38\u8D4F\u690D\u683D\u8F83\u81EA\u7531\u201D\u7684\u8BBE\u8BA1\u8BED\u6CD5\uFF0C\u4E0D\u8BC1\u660E\u7559\u56ED 1890 \u5E74\u67D0\u4E00\u5B9E\u540D\u5385\u5802\u524D\u6709\u8FD9\u4E24\u682A\u6216\u6B64\u95E8\u4F4D\u3002\u5F53\u4EE3\u6E38\u7EBF\u6E38\u620F\u6A21\u5F0F\u53EF\u5728\u4EB2\u770B\u4E24\u6811\u540E\u63A8\u8FDB\u865A\u6784\u201C\u7B14\u6811\u201D\u7EBF\u7D22\uFF0C\u72EC\u7ACB\u7814\u7A76\u4E0D\u63A8\u8FDB\uFF1B\u4ECD\u4E0D\u53EF\u628A\u6B64\u5385\u5F53\u4F5C\u8FD8\u8BFB\u6211\u4E66\u658B\u6216\u76F4\u63A5\u7ED3\u7B97\u56DB\u95E8\u8C1C\u9898\u3002",
      storyAnchors: [
        { id: "ly-east-pair-left", x: 520, y: 365, label: "\u5DE6\u4FA7\u5730\u690D\u7389\u5170", kind: "visual", scriptRef: "CH3-06", note: "\u6811\u6839\u4F4D\u4E8E\u5802\u524D\u6811\u6C60\uFF0C\u975E\u76C6\u683D\uFF1B\u5177\u4F53\u5386\u53F2\u682A\u4F4D\u5F85\u6838\u3002" },
        { id: "ly-east-pair-right", x: 1390, y: 420, label: "\u53F3\u4FA7\u5730\u690D\u7389\u5170", kind: "visual", scriptRef: "CH3-06", note: "\u4E24\u682A\u5F62\u6210\u5C40\u90E8\u5385\u5802\u8F74\u7EBF\uFF0C\u4E0D\u8981\u6C42\u6574\u4E2A\u56ED\u6797\u5BF9\u79F0\u3002" },
        { id: "ly-east-hall-threshold", x: 1010, y: 390, label: "\u5385\u5802\u95E8\u69DB\u5019\u9009", kind: "boundary", scriptRef: "CH3-06/07", note: "\u672A\u6838\u662F\u5426\u5BF9\u5E94\u8FD8\u8BFB\u6211\u4E66\u658B\u53CA 1890 \u533E\u989D\uFF1B\u7981\u6B62\u51ED\u751F\u6210\u56FE\u5B9A\u540D\u3002" },
        { id: "ly-east-side-garden", x: 1630, y: 270, label: "\u4FA7\u56ED\u81EA\u7531\u690D\u683D", kind: "visual", scriptRef: "CH3-06", note: "\u6E38\u8D4F\u533A\u7528\u975E\u5BF9\u79F0\u758F\u5BC6\uFF0C\u4E0D\u4F5C\u82B1\u575B\u5F0F\u955C\u50CF\u3002" },
        { id: "ly-east-left-view-foot", x: 530, y: 550, label: "\u5DE6\u6811\u6C60\u5916\u89C2\u5BDF\u811A\u70B9", kind: "interaction", scriptRef: "CH3-06", note: "\u73A9\u5BB6\u8DB3\u90E8\u5728\u77F3\u8DEF\uFF1B\u4E0E\u6811\u6839\u89C6\u89C9\u951A\u70B9\u5206\u5F00\u3002" },
        { id: "ly-east-right-view-foot", x: 1390, y: 580, label: "\u53F3\u6811\u6C60\u5916\u89C2\u5BDF\u811A\u70B9", kind: "interaction", scriptRef: "CH3-06", note: "\u73A9\u5BB6\u8DB3\u90E8\u5728\u6811\u6C60\u5357\u4FA7\uFF1B\u4E0E\u6811\u51A0/\u6811\u6839\u89C6\u89C9\u951A\u70B9\u5206\u5F00\u3002" },
        { id: "ly-east-door-foot", x: 980, y: 410, label: "\u95E8\u524D\u6B62\u6B65\u811A\u70B9", kind: "boundary", scriptRef: "CH3-06/07", note: "\u672A\u6838\u95E8\u5185\uFF0C\u811A\u70B9\u53EA\u5230\u9636\u524D\u3002" }
      ],
      routeGraph: {
        nodes: [
          { id: "east-hall-entry", x: 385, y: 575, label: "\u897F\u4FA7\u9662\u5730", kind: "entry", note: "\u4ECE\u82B1\u6728\u4F5C\u4E1A\u533A\u526A\u63A5\uFF0C\u4E0D\u662F\u5DF2\u6838\u65E7\u95E8\u4F4D\u3002" },
          { id: "east-hall-left-tree", x: 530, y: 550, label: "\u5DE6\u6811\u524D", kind: "waypoint", anchorId: "ly-east-left-view-foot", note: "\u505C\u5728\u6811\u6C60\u5357\u4FA7\uFF0C\u4E0D\u7A7F\u6811\u6839\u3002" },
          { id: "east-hall-center", x: 970, y: 545, label: "\u5385\u524D\u4E2D\u8DEF", kind: "waypoint", note: "\u4ECE\u4E24\u682A\u4E4B\u95F4\u770B\u5385\u5802\u3002" },
          { id: "east-hall-door", x: 980, y: 410, label: "\u672A\u547D\u540D\u5385\u524D", kind: "waypoint", anchorId: "ly-east-door-foot", note: "\u53EA\u5230\u95E8\u69DB\uFF0C\u672A\u6807\u5B9A\u5385\u5185\u3002" },
          { id: "east-hall-right-tree", x: 1390, y: 580, label: "\u53F3\u6811\u524D", kind: "waypoint", anchorId: "ly-east-right-view-foot", note: "\u6811\u6C60\u5357\u4FA7\u53EF\u7AD9\uFF1B\u4E24\u6811\u6210\u5C40\u90E8\u5385\u524D\u4E00\u5BF9\u3002" },
          { id: "east-hall-east-bend", x: 1660, y: 590, label: "\u4FA7\u5ECA\u8F6C\u89D2", kind: "waypoint", note: "\u7ED5\u8FC7\u53F3\u6811\u6C60\uFF0C\u4E0D\u659C\u7A7F\u3002" },
          { id: "east-hall-east-exit", x: 1675, y: 475, label: "\u4E0B\u4E00\u9662\u65B9\u5411", kind: "goal", note: "\u4E1C\u4FA7\u51FA\u53E3\u53EA\u4F5C\u73A9\u6CD5\u8FB9\u754C\u3002" }
        ],
        edges: [
          ["east-hall-entry", "east-hall-left-tree"],
          ["east-hall-left-tree", "east-hall-center"],
          ["east-hall-center", "east-hall-door"],
          ["east-hall-center", "east-hall-right-tree"],
          ["east-hall-right-tree", "east-hall-east-bend"],
          ["east-hall-east-bend", "east-hall-east-exit"]
        ].map(([from, to]) => ({
          from,
          to,
          state: "candidate",
          via: "walk",
          note: "\u4EC5\u6B64\u6E38\u620F\u5207\u7247\u7684\u811A\u70B9\u8DEF\u5F84\uFF0C\u4E0D\u5BF9\u5E94 1890 \u5386\u53F2\u95E8\u6D1E\u3002"
        }))
      }
    },
    {
      id: "liuyuan-entry-gate-style-study-v1",
      label: "\u7559\u56ED \xB7 \u95E8\u5916\u81F3\u95E8\u5385\u7814\u7A76 v1\u3010\u98CE\u683C\u672A\u901A\u8FC7\u3011",
      asset: "../research-art/liuyuan-entry-gate-style-study-v1.png",
      width: 1664,
      height: 944,
      tileW: 104,
      tileH: 59,
      note: "\u98CE\u683C\u590D\u6838\u672A\u901A\u8FC7\uFF1A\u56FE\u9762\u662F\u7EC6\u817B\u7ED8\u753B\u800C\u975E\u7EDF\u4E00\u50CF\u7D20\u8D44\u4EA7\uFF0C\u4E14\u95E8\u4E0E\u4E24\u4FA7\u82B1\u6C60\u8FC7\u4E8E\u5BF9\u79F0\u3001\u8FD1\u6B63\u9762\uFF1B\u4E0D\u80FD\u4F5C\u4E3A\u5408\u683C\u5165\u53E3\u66FF\u6362\u3002\u4EC5\u7559\u72EC\u7ACB\u7814\u7A76\u5E95\u56FE\u4F9B\u6BD4\u4F8B\u3001\u5730\u9762\u548C\u524D\u666F\u6821\u9A8C\u3002\u95E8\u6247\u3001\u706F\u3001\u6811\u77F3\u53CA\u8857\u9762\u5BBD\u5EA6\u672A\u7ECF\u5B9E\u666F/\u5E74\u4EE3\u6838\u4F4D\uFF1B\u5E76\u975E 1890 \u7559\u56ED\u5165\u53E3\u590D\u539F\uFF0C\u4E5F\u4E0D\u63A5 CH3 \u8FDB\u5EA6\u3002\u65E2\u6709\u5165\u53E3\u8349\u7A3F\u4E0D\u8FC1\u79FB\u3001\u4E0D\u8986\u76D6\u3002\u8BE6\u89C1 LIUYUAN_VISUAL_STYLE_AUDIT.md\u3002",
      storyAnchors: [
        {
          id: "ly-gate-study-threshold",
          x: 830,
          y: 428,
          label: "\u95E8\u69DB\u89C2\u5BDF\u811A\u70B9\u5019\u9009",
          kind: "boundary",
          scriptRef: "\u72EC\u7ACB\u51E0\u4F55\u7814\u7A76",
          note: "\u53EA\u770B\u53EF\u8D70\u5730\u9762\u4E0E\u95E8\u67F1\u6BD4\u4F8B\uFF0C\u4E0D\u8868\u793A\u5DF2\u6838\u771F\u5B9E\u95E8\u4F4D\uFF0C\u4E5F\u4E0D\u5199 CH3 \u65D7\u6807\u3002"
        }
      ],
      routeGraph: {
        nodes: [
          { id: "study-street", x: 830, y: 755, label: "\u95E8\u5916\u77F3\u8DEF", kind: "entry", note: "\u98CE\u683C\u7814\u7A76\u51FA\u751F\u70B9\u3002" },
          { id: "study-approach", x: 830, y: 560, label: "\u95E8\u524D", kind: "waypoint", note: "\u5BBD\u77F3\u8DEF\u6536\u5411\u95E8\u6D1E\u3002" },
          { id: "study-threshold", x: 830, y: 428, label: "\u95E8\u69DB", kind: "waypoint", anchorId: "ly-gate-study-threshold", note: "\u53EA\u6821\u811A\u70B9\u548C\u95E8\u67F1\uFF0C\u4E0D\u4F5C\u65E7\u95E8\u8BC1\u636E\u3002" },
          { id: "study-hall", x: 830, y: 315, label: "\u95E8\u5385\u5730\u9762", kind: "goal", note: "\u5207\u7247\u5728\u5385\u5185\u6B62\u6B65\uFF1B\u4E0B\u4E00\u5E55\u771F\u5B9E\u63A5\u53E3\u5F85\u6838\u3002" }
        ],
        edges: [
          ["study-street", "study-approach"],
          ["study-approach", "study-threshold"],
          ["study-threshold", "study-hall"]
        ].map(([from, to]) => ({
          from,
          to,
          state: "candidate",
          via: "walk",
          note: "\u6309\u6B64\u6E38\u620F\u56FE\u94FA\u5730\u6807\u5B9A\u7684\u5019\u9009\u811A\u70B9\uFF0C\u4E0D\u5BF9\u5E94\u6E05\u672B\u6D4B\u7ED8\u3002"
        }))
      }
    },
    {
      id: "liuyuan-entry-gate-misty-study-v2",
      label: "\u7559\u56ED \xB7 \u7C89\u5899\u9EDB\u74E6\u95E8\u5899\u8BD5\u8D70 v2\u3010\u72EC\u7ACB\u7814\u7A76\u3011",
      asset: "../research-art/liuyuan-entry-gate-misty-pixel-study-v3.png",
      width: 1664,
      height: 944,
      tileW: 104,
      tileH: 59,
      note: "\u672C\u5F20\u53EA\u662F\u95E8\u5916\u2014\u95E8\u5385\u4E00\u955C\u7684\u51B7\u8C03\u50CF\u7D20\u8BED\u6CD5/\u811A\u70B9\u7814\u7A76\uFF0C\u4E0D\u8986\u76D6\u6574\u6761\u5165\u53E3\u5939\u5F04\u3001\u4E0D\u63A5 CH3\u3001\u4E0D\u628A\u751F\u6210\u95E8\u67F1\u6811\u4F4D\u6216\u94FA\u5730\u8BA4\u4F5C 1890 \u5B9E\u666F\u3002\u4E0E\u65E7 v1 \u72EC\u7ACB\u573A\u666F ID\uFF0C\u4FDD\u7559\u6240\u6709\u65E7\u8349\u7A3F\uFF1B\u56FE\u4E2D\u7684\u77F3\u5730\u6750\u8D28\u6682\u4E3A\u672A\u5B9A\u4F4D\u7684\u6E38\u620F\u5019\u9009\uFF0C\u4E0D\u80FD\u5C06\u82B1\u8857\u7EB9\u6837\u51ED\u7A7A\u94FA\u5728\u5165\u53E3\u3002",
      storyAnchors: [
        {
          id: "ly-gate-misty-threshold",
          x: 1020,
          y: 517,
          label: "\u95E8\u69DB\u7814\u7A76\u811A\u70B9",
          kind: "boundary",
          scriptRef: "\u72EC\u7ACB\u51E0\u4F55\u7814\u7A76",
          note: "\u7528\u4E8E\u4EBA\u7269\u6BD4\u4F8B\u4E0E\u8FDB\u95E8\u906E\u6321\u6821\u51C6\uFF0C\u672A\u6838\u5B9E\u6E05\u672B\u95E8\u4F4D\u6216\u95E8\u69DB\u5F62\u5236\u3002"
        }
      ],
      routeGraph: {
        nodes: [
          { id: "misty-street", x: 835, y: 782, label: "\u95E8\u5916\u77F3\u8DEF", kind: "entry", note: "\u6B64\u56FE\u7814\u7A76\u51FA\u751F\u70B9\u3002" },
          { id: "misty-approach", x: 946, y: 630, label: "\u95E8\u524D\u6536\u675F", kind: "waypoint", note: "\u6CBF\u56FE\u9762\u53EF\u89C1\u77F3\u8DEF\u884C\u8D70\u3002" },
          { id: "misty-threshold", x: 1020, y: 517, label: "\u95E8\u69DB", kind: "waypoint", anchorId: "ly-gate-misty-threshold", note: "\u978B\u5E95\u8DE8\u7EBF\uFF0C\u4E0D\u7A7F\u67F1\u811A\u3002" },
          { id: "misty-hall", x: 1020, y: 340, label: "\u95E8\u5185\u6B62\u6B65", kind: "goal", note: "\u5207\u7247\u6B62\u4E8E\u5BA4\u5185\u53EF\u89C1\u5730\u9762\uFF1B\u4E0B\u4E00\u6BB5\u5939\u5F04\u4E0D\u5728\u672C\u56FE\u3002" }
        ],
        edges: [
          ["misty-street", "misty-approach"],
          ["misty-approach", "misty-threshold"],
          ["misty-threshold", "misty-hall"]
        ].map(([from, to]) => ({
          from,
          to,
          state: "candidate",
          via: "walk",
          note: "\u6E38\u620F\u7814\u7A76\u56FE\u5019\u9009\u811A\u70B9\uFF0C\u4E0D\u662F\u5DF2\u6838\u6E05\u672B\u6E38\u7EBF\u3002"
        }))
      }
    },
    {
      id: "liuyuan-entry-lower-camera-study-v1",
      label: "\u7559\u56ED \xB7 \u95E8\u5916\u81F3\u7B2C\u4E00\u89C1\u5149 \xB7 \u4F4E\u673A\u4F4D\u7814\u7A76\u3010\u672A\u63A5\u7AE0\u6D41\u3011",
      asset: "../research-art/liuyuan-entry-lower-camera-gameplay-candidate-v1.png",
      width: 1672,
      height: 941,
      tileW: 105,
      tileH: 59,
      note: "\u4ECE\u5934\u751F\u6210\u7684\u4F4E\u673A\u4F4D\u6E38\u620F\u955C\u5934\uFF1B\u95E8\u5916\u7A7A\u5730\u7ED9\u4E54\u79BE\u3001\u8001\u53DF\u3001\u4E66\u751F\uFF0C\u95E8\u53F3\u7559\u95E8\u623F\u4FEE\u706F\u4F4D\u7F6E\u3002\u690D\u7269\u548C\u94FA\u5730\u662F\u6E38\u620F\u5316\u6784\u56FE\u5019\u9009\uFF0C\u672A\u6838\u65E7\u95E8\u3001\u6811\u79CD\u682A\u4F4D\u4E0E\u82B1\u8857\u7EB9\u6837\u3002\u72EC\u7ACB\u65B0 ID \u4FDD\u7559\u6240\u6709\u65E7\u5165\u53E3\u8349\u7A3F\uFF1B\u4EC5\u6821\u4E00\u955C\u811A\u70B9\u3001\u95E8\u67F1\u548C\u89D2\u8272\uFF0C\u4E0D\u5199 CH3\uFF0C\u4E5F\u4E0D\u7B49\u4E8E\u5165\u53E3\u6574\u94FE\u6362\u88C5\u6216\u753B\u98CE\u6279\u51C6\u3002",
      storyAnchors: [
        {
          id: "ly-lower-vendor",
          ...LIUYUAN_ENTRY_LOWER_NPC_FEET.oldVendor,
          label: "\u4E54\u8001\u53DF\u811A\u70B9\u7814\u7A76",
          kind: "npc",
          scriptRef: "CH3-01 \u955C\u5934\u5019\u9009",
          note: "\u5750\u59FF\u7CBE\u7075\u7684\u978B\u5E95\u843D\u5728\u6B64\u70B9\uFF1B\u4EBA\u7269\u4E0D\u70D8\u7119\u8FDB\u5E95\u56FE\uFF0C\u7AD9\u4F4D\u4E0D\u662F\u53F2\u5B9E\u3002",
          routeRequired: false
        },
        {
          id: "ly-lower-qiao",
          ...LIUYUAN_ENTRY_LOWER_NPC_FEET.qiao,
          label: "\u4E54\u79BE\u811A\u70B9\u7814\u7A76",
          kind: "npc",
          scriptRef: "CH3-02 \u955C\u5934\u5019\u9009",
          note: "\u4E0E\u8001\u53DF\u5206\u5F00\u6821\u6BD4\u4F8B\u548C\u524D\u540E\u5C42\u7EA7\uFF1B\u8857\u9762\u4F4D\u7F6E\u662F\u5267\u60C5\u865A\u6784\u3002",
          routeRequired: false
        },
        {
          id: "ly-lower-gatekeeper",
          ...LIUYUAN_ENTRY_LOWER_NPC_FEET.gatekeeper,
          label: "\u95E8\u623F\u4FEE\u706F\u811A\u70B9\u7814\u7A76",
          kind: "npc",
          scriptRef: "CH3-03 \u955C\u5934\u5019\u9009",
          note: "\u5728\u53F3\u95E8\u67F1\u5916\u7684\u53EF\u8D70\u77F3\u5730\u8BD5\u6446\uFF1B\u53EF\u9009\u6276\u706F\u5C5E\u4E8E\u5267\u60C5\u865A\u6784\u3002",
          routeRequired: false
        },
        {
          id: "ly-lower-threshold",
          ...LIUYUAN_ENTRY_LOWER_FEET.threshold,
          label: "\u5355\u95E8\u95E8\u69DB\u5019\u9009\u811A\u70B9",
          kind: "boundary",
          scriptRef: "\u72EC\u7ACB\u51E0\u4F55\u7814\u7A76",
          note: "\u53EA\u68C0\u8FC7\u95E8\u4E0E\u6A90\u53E3\u906E\u6321\uFF1B\u6E05\u672B\u95E8\u4F4D\u672A\u6838\u3002"
        }
      ],
      routeGraph: {
        nodes: Object.entries(LIUYUAN_ENTRY_LOWER_FEET).map(([id, foot], index, all) => ({
          id: `lower-${id}`,
          x: foot.x,
          y: foot.y,
          label: id,
          kind: index === 0 ? "entry" : index === all.length - 1 ? "goal" : "waypoint",
          anchorId: id === "threshold" ? "ly-lower-threshold" : void 0,
          note: "\u751F\u6210\u56FE\u7684\u53EF\u89C1\u77F3\u5730\u811A\u70B9\uFF0C\u975E\u53F2\u5B9E\u5750\u6807\uFF1B\u76EE\u524D\u53EA\u8D1F\u8D23\u9996\u955C\u3002"
        })),
        edges: Object.keys(LIUYUAN_ENTRY_LOWER_FEET).slice(1).map((id, index, ids) => ({
          from: `lower-${index === 0 ? "street" : ids[index - 1]}`,
          to: `lower-${id}`,
          state: "candidate",
          via: "walk",
          note: "\u65B0\u5E95\u56FE\u4E13\u7528\u8DEF\u7EBF\uFF1B\u4E0D\u5F97\u5957\u7528\u65E7 1008\xD7688 \u767D\u6A21\u3001\u65E7\u659C\u4FEF\u89C6\u8349\u7A3F\u6216\u63A8\u5B9A\u6E05\u672B\u95E8\u4F4D\u3002"
        }))
      }
    },
    {
      id: "liuyuan-entry-oblique-shot-study-v1",
      label: "\u7559\u56ED \xB7 \u5165\u53E3\u659C\u4FEF\u89C6\u9996\u955C\u5934\u6821\u4F4D\u3010\u672A\u63A5\u7AE0\u6D41\u3011",
      asset: "../research-art/liuyuan-entry-oblique-pixel-study-v1.png",
      width: 1536,
      height: 1024,
      tileW: 96,
      tileH: 64,
      note: "\u6309\u5E9C\u5B66\u9AD8\u4F4D\u659C\u4FEF\u89C6\u91CD\u65B0\u7814\u7A76\u95E8\u5916\u2014\u95E8\u69DB\u2014\u95E8\u5185\u8F6C\u6298\uFF0C\u72EC\u7ACB\u573A\u666F ID \u4E0D\u8986\u76D6\u5165\u53E3\u767D\u6A21\u4E0E\u73A9\u5BB6\u8349\u7A3F\u3002\u56FE\u9762\u4E3A AI \u8F85\u52A9\u539F\u521B\u50CF\u7D20\u5019\u9009\uFF0C\u95E8\u3001\u6811\u3001\u94FA\u5730\u548C\u5899\u7EBF\u672A\u6838\u5B9E\u6E05\u672B\u539F\u4F4D\uFF1B\u53EA\u6821\u4EBA\u7269\u3001\u811A\u70B9\u3001\u78B0\u649E\u3001\u524D\u666F\u6A90\uFF0C\u4E0D\u5199 CH3 \u72B6\u6001\uFF0C\u4E0D\u7B97\u6574\u6761\u5165\u53E3\u53EF\u73A9\u3002",
      storyAnchors: [
        {
          id: "ly-entry-oblique-gate",
          ...LIUYUAN_ENTRY_OBLIQUE_FEET.threshold,
          label: "\u95E8\u69DB\u811A\u70B9\u5019\u9009",
          kind: "boundary",
          scriptRef: "\u72EC\u7ACB\u51E0\u4F55\u7814\u7A76",
          note: "\u672C\u56FE\u53EA\u6821\u8FC7\u95E8\u548C\u524D\u666F\u74E6\u9762\uFF1B\u4E0D\u662F\u5386\u53F2\u65E7\u95E8\u5B9A\u4F4D\u3002"
        },
        {
          id: "ly-entry-oblique-lightwell",
          ...LIUYUAN_ENTRY_OBLIQUE_FEET.lightwell,
          label: "\u7B2C\u4E00\u6B21\u89C1\u5149\u5019\u9009",
          kind: "visual",
          scriptRef: "\u72EC\u7ACB\u51E0\u4F55\u7814\u7A76",
          note: "\u53EA\u4F5C\u6536\u653E\u8282\u62CD\uFF0C\u4E0D\u628A\u751F\u6210\u690D\u683D\u4F5C\u4E3A\u5B9E\u666F\u6216\u89E3\u8C1C\u9898\u76EE\u3002"
        }
      ],
      routeGraph: {
        nodes: Object.entries(LIUYUAN_ENTRY_OBLIQUE_FEET).map(([id, foot], index, all) => ({
          id: `oblique-${id}`,
          x: foot.x,
          y: foot.y,
          label: id,
          kind: index === 0 ? "entry" : index === all.length - 1 ? "goal" : "waypoint",
          anchorId: id === "threshold" ? "ly-entry-oblique-gate" : id === "lightwell" ? "ly-entry-oblique-lightwell" : void 0,
          note: "\u4EC5\u6B64\u5019\u9009\u56FE\u7684\u56FE\u9762\u811A\u70B9\uFF1B\u4E0D\u6620\u5C04\u6216\u8986\u76D6\u73B0\u6709\u5165\u53E3 11 \u6BB5\u5750\u6807\u3002"
        })),
        edges: Object.keys(LIUYUAN_ENTRY_OBLIQUE_FEET).slice(1).map((id, index, ids) => ({
          from: `oblique-${index === 0 ? "street" : ids[index - 1]}`,
          to: `oblique-${id}`,
          state: "candidate",
          via: "walk",
          note: "\u56FE\u9762\u94FA\u5730\u7684\u5019\u9009\u8FDE\u7EBF\uFF1B\u9700\u9ED8\u8BA4\u51E0\u4F55\u548C\u73A9\u5BB6\u8349\u7A3F\u5206\u522B\u9A8C\u8BC1\u3002"
        }))
      }
    },
    {
      id: "liuyuan-alley-misty-study-v1",
      label: "\u7559\u56ED \xB7 \u95E8\u5185\u51B7\u8C03\u5939\u5F04\u8BD5\u8D70 v1\u3010\u72EC\u7ACB\u7814\u7A76\u3011",
      asset: "../research-art/liuyuan-alley-misty-pixel-study-v1.png",
      width: 1664,
      height: 944,
      tileW: 104,
      tileH: 59,
      note: "\u672C\u955C\u627F\u63A5\u7C89\u5899\u9EDB\u74E6\u95E8\u5899\u7684\u8272\u677F\u4E0E\u76F8\u673A\uFF0C\u7814\u7A76\u72ED\u5F84\u884C\u8D70\u3001\u5899\u811A\u78B0\u649E\u548C\u77F3\u677F/\u5C0F\u7070\u77F3\u5757\u7684\u56FE\u9762\u4EA4\u63A5\u3002\u5899\u7EBF\u3001\u6811\u4F4D\u3001\u94FA\u5730\u8F6C\u6298\u53CA\u6E05\u672B\u5750\u6807\u5747\u672A\u6838\uFF1B\u4E0D\u628A\u82B1\u8857\u56FE\u7248\u8BEF\u690D\u5728\u5939\u5F04\uFF0C\u4E0D\u66FF\u6362\u6B63\u5F0F CH3 \u767D\u6A21\uFF0C\u4E0D\u8986\u76D6\u65E7\u8349\u7A3F\u3002",
      storyAnchors: [{
        id: "ly-alley-misty-bend",
        x: 1095,
        y: 480,
        label: "\u7A84\u5DF7\u8F6C\u89D2\u7814\u7A76\u811A\u70B9",
        kind: "boundary",
        scriptRef: "\u72EC\u7ACB\u51E0\u4F55\u7814\u7A76",
        note: "\u53EA\u6821\u51C6\u73A9\u5BB6\u5728\u8F6C\u89D2\u505C\u6B65\u4E0E\u4EBA\u7269\u7F29\u5C3A\uFF1B\u4E0D\u662F\u65E7\u8DEF\u95E8\u4F4D\u8BC1\u636E\u3002"
      }],
      routeGraph: {
        nodes: [
          { id: "alley-threshold", x: 800, y: 850, label: "\u95E8\u69DB\u5185", kind: "entry", note: "\u72EC\u7ACB\u7814\u7A76\u51FA\u751F\u70B9\u3002" },
          { id: "alley-first-narrow", x: 915, y: 640, label: "\u5165\u7A84\u5DF7", kind: "waypoint", note: "\u6CBF\u53EF\u89C1\u94FA\u5730\u5411\u91CC\u3002" },
          { id: "alley-bend", x: 1095, y: 480, label: "\u8F6C\u89D2", kind: "waypoint", anchorId: "ly-alley-misty-bend", note: "\u77F3\u6750\u53D8\u5316\u4EC5\u4F5C\u7814\u7A76\u5019\u9009\u3002" },
          { id: "alley-end", x: 1190, y: 320, label: "\u5DF7\u5C3E\u6B62\u6B65", kind: "goal", note: "\u4E0D\u76F4\u63A5\u63A5 CH3 \u5C0F\u5EAD\uFF0C\u63A5\u53E3\u672A\u6838\u3002" }
        ],
        edges: [
          ["alley-threshold", "alley-first-narrow"],
          ["alley-first-narrow", "alley-bend"],
          ["alley-bend", "alley-end"]
        ].map(([from, to]) => ({
          from,
          to,
          state: "candidate",
          via: "walk",
          note: "\u6309\u7814\u7A76\u56FE\u94FA\u5730\u6807\u5B9A\u811A\u70B9\uFF0C\u975E\u6E05\u672B\u6D4B\u7ED8\u3002"
        }))
      }
    },
    {
      id: "liuyuan-entrance-topology-study",
      label: "\u7559\u56ED \xB7 \u70DF\u96E8\u5939\u5F04\uFF08\u7AE0\u8282\u5165\u53E3\uFF09",
      asset: "../assets/scene25d/liuyuan-entrance-walkable-study-v2.svg",
      width: 1008,
      height: 688,
      tileW: 63,
      tileH: 43,
      note: "\u7F16\u8F91\u5668\u4E0E\u6B63\u5F0F\u8BD5\u73A9\u5171\u7528\u540C\u4E00\u5F20 1008\xD7688 \u6E38\u620F\u573A\u666F\uFF0C\u6CBF\u7528\u539F\u6709\u811A\u70B9\u3001Tile\u3001\u5267\u60C5\u4E0E\u8FD4\u7A0B\u94FE\uFF0C\u4E0D\u8FC1\u79FB\u6216\u8986\u76D6\u6D4F\u89C8\u5668\u8349\u7A3F\u3002\u5357\u95E8\u4E24\u7FFC\u3001\u7B2C\u4E8C\u5929\u4E95\u4E1C\u4FA7\u53CA\u5317\u5899\u516D\u7A97\u5DF2\u8865\u4EE3\u7801\u539F\u751F\u6D45\u7ACB\u9762\uFF1B\u5317\u5ECA\u753B\u9762\u4EC5\u9759\u6001\u88C1\u5207\u590D\u6838\uFF0C\u65E7\u8349\u7A3F\u906E\u6321\u4ECD\u5F85\u5B9E\u8D70\u3002\u65E0\u5165\u53E3\u539F\u4F4D\u56FE\u7248\u7684\u83F1\u5F62\u82B1\u8857\u5DF2\u64A4\u4E3A\u666E\u901A\u77F3\u677F\u3002\u516D\u7A97\u8F6E\u5ED3\u501F\u73B0\u72B6\u5730\u65B9\u5FD7\u6587\u5B57\u4F5C\u539F\u521B\u50CF\u7D20\u526A\u5F71\uFF0C\u7B2C\u4E8C\u7A97\u7EB9\u540D\u548C\u6E05\u672B\u5B58\u8C8C\u672A\u6838\uFF0C\u4E0D\u4F5C\u5B9E\u7269\u6479\u672C\u3002\u516D\u7A97\u662F\u5B9E\u5899\uFF1B\u897F\u6298\u51FA\u53E3\u901A\u5411\u4E0B\u4E00\u5E55\u3002",
      storyAnchors: [
        { id: "ly-entry-gate", x: 520, y: 610, label: "\u5357\u4FA7\u5C0F\u95E8", kind: "trigger", scriptRef: "CH3-03/04", note: "\u6545\u4E8B\u5165\u53E3\uFF1B\u5177\u4F53\u5386\u53F2\u95E8\u4F4D\u5F85\u6838\u3002" },
        { id: "ly-entry-second-court", x: 430, y: 374, label: "\u66F2\u5ECA\u540E\u7684\u7B2C\u4E8C\u5C0F\u5EAD", kind: "trigger", scriptRef: "CH3-04", note: "\u5148\u6536\u540E\u653E\u7684\u4E2D\u6BB5\uFF0C\u4E0D\u5728\u6B64\u76F4\u63A5\u5C55\u793A\u5168\u6C60\u3002" },
        { id: "ly-entry-window", x: 420, y: 232, label: "\u5317\u5899\u9694\u7A97\u7AA5\u56ED", kind: "visual", scriptRef: "CH3-04", note: "\u7AD9\u5728\u7A97\u5357\u4FA7\uFF0C\u53EA\u89C1\u5C40\u90E8\u666F\uFF1B\u7A97\u672C\u8EAB\u4E0D\u53EF\u7A7F\u8FC7\u3002" },
        { id: "ly-entry-shade", x: 290, y: 232, label: "\u897F\u6298\u5C0F\u5EAD\u65B9\u5411", kind: "boundary", scriptRef: "CH3-04", note: "\u5165\u53E3\u6BB5\u7EC8\u70B9\uFF1B\u5267\u60C5\u63A5\u5165\u5C0F\u5EAD\uFF0C\u4E0D\u5BA3\u79F0\u5386\u53F2\u95E8\u6D1E\u76F8\u63A5\u3002" }
      ],
      routeGraph: {
        nodes: [
          { id: "street", x: 520, y: 656, label: "\u8857\u9762", kind: "entry", note: "\u7AE0\u8282\u51FA\u751F\u70B9" },
          { id: "gate", x: 520, y: 610, label: "\u5C0F\u95E8", kind: "portal", anchorId: "ly-entry-gate", note: "\u5165\u53E3\u95E8\u69DB" },
          { id: "hall", x: 520, y: 550, label: "\u524D\u5385", kind: "waypoint", note: "\u7531\u5C0F\u95E8\u5165\u5185" },
          { id: "well-one", x: 520, y: 480, label: "\u7B2C\u4E00\u5929\u4E95", kind: "waypoint", note: "\u7B2C\u4E00\u6B21\u89C1\u5149" },
          { id: "south-corridor", x: 520, y: 400, label: "\u72ED\u957F\u5ECA", kind: "waypoint", note: "\u5411\u5317\u6536\u7A84" },
          { id: "west-bend", x: 430, y: 400, label: "\u5411\u897F\u6298", kind: "waypoint", note: "\u5FC5\u987B\u5206\u6BB5\u8F6C\u5F2F\uFF0C\u4E0D\u7A7F\u5899\u659C\u5207" },
          { id: "second-court", x: 430, y: 374, label: "\u7B2C\u4E8C\u5C0F\u5EAD", kind: "waypoint", anchorId: "ly-entry-second-court", note: "\u8FDE\u7EED\u884C\u8D70\u9A8C\u8BC1\u70B9" },
          { id: "north-corridor", x: 430, y: 300, label: "\u5317\u5411\u7A84\u5ECA", kind: "waypoint", note: "\u4ECE\u5EAD\u9662\u7EE7\u7EED\u5411\u5317" },
          { id: "tree-court", x: 430, y: 250, label: "\u53E4\u6728\u4EA4\u67EF\u9644\u8FD1", kind: "waypoint", note: "\u4EC5\u793A\u610F\u76F8\u90BB\u7A7A\u95F4" },
          { id: "window", x: 420, y: 232, label: "\u5317\u4FA7\u6F0F\u7A97\u524D", kind: "waypoint", anchorId: "ly-entry-window", note: "\u4E0D\u7A7F\u7A97\uFF1B\u53EA\u53EF\u5C40\u90E8\u7AA5\u56ED" },
          { id: "west-exit", x: 340, y: 232, label: "\u6298\u5411\u897F", kind: "waypoint", note: "\u4ECE\u53E4\u6728\u4EA4\u67EF\u5411\u897F\u8D70" },
          { id: "green-shade", x: 290, y: 232, label: "\u7EFF\u836B\u8F69\u65B9\u5411", kind: "goal", anchorId: "ly-entry-shade", note: "\u6B64\u5904\u505C\u6B62\uFF0C\u6C60\u56ED\u63A5\u53E3\u5F85\u5236\u4F5C" }
        ],
        edges: [
          ["street", "gate"],
          ["gate", "hall"],
          ["hall", "well-one"],
          ["well-one", "south-corridor"],
          ["south-corridor", "west-bend"],
          ["west-bend", "second-court"],
          ["second-court", "north-corridor"],
          ["north-corridor", "tree-court"],
          ["tree-court", "window"],
          ["window", "west-exit"],
          ["west-exit", "green-shade"]
        ].map(([from, to]) => ({ from, to, state: "confirmed", via: "walk", note: "\u4EE3\u7801\u9ED8\u8BA4 Tile \u4E0E\u7AE0\u8282\u811A\u70B9\u5171\u7528\u6B64\u6BB5\uFF1B\u5386\u53F2\u95E8\u4F4D\u4E0D\u4F5C\u590D\u539F\u58F0\u660E\u3002" }))
      }
    },
    {
      id: "liuyuan-whole-garden-study-v2",
      label: "\u7559\u56ED \xB7 \u65E7\u5168\u56ED\u8BEF\u7A3F v2\uFF08\u7981\u6B62\u94FA\u78B0\u649E\uFF09",
      asset: "../assets/scene25d/liuyuan-whole-garden-study-v2.png",
      width: 1536,
      height: 1024,
      tileW: 96,
      tileH: 64,
      note: "\u5DF2\u5426\u51B3\u4F5C\u5B9E\u666F\u6216\u78B0\u649E\u5E95\u56FE\uFF1A\u897F\u4FA7\u88AB\u753B\u6210\u591A\u7247\u6E56\u6CBC\u548C\u6D6E\u6865\uFF0C\u4E3B\u6C60\u7834\u788E\uFF0C\u5317\u90E8\u6210\u89C4\u6574\u82B1\u5703\uFF1B\u4E0E\u7559\u56ED\u6D4B\u7ED8\u53CA\u5B98\u65B9\u201C\u4E2D\u6C60\u3001\u897F\u5C71\u3001\u4E1C\u5385\u201D\u7684\u683C\u5C40\u660E\u663E\u4E0D\u5408\u3002\u5165\u53E3\u5C4B\u9876\u4EA6\u906E\u4F4F\u811A\u70B9\u3002\u4EC5\u4FDD\u7559\u65E7\u56FE\u4F9B\u8BEF\u5DEE\u5BF9\u7167\uFF0Cv1 \u53CA\u6D4F\u89C8\u5668\u8349\u7A3F\u4E5F\u4E0D\u5220\u9664\u3002",
      storyAnchors: [
        { id: "ly-v2-small-gate", x: 665, y: 905, label: "\u5357\u4FA7\u5C0F\u95E8", kind: "trigger", scriptRef: "CH3-03/04", note: "\u5165\u53E3\u5DF2\u6536\u7A84\uFF1B\u5386\u53F2\u95E8\u4F4D\u4E0E\u53EF\u8D70\u811A\u70B9\u5F85\u5E73\u9762\u548C\u5B9E\u8D70\u6838\u5BF9\u3002" },
        { id: "ly-v2-alley", x: 820, y: 735, label: "\u4E09\u5F2F\u5939\u5F04", kind: "trigger", scriptRef: "CH3-04", note: "\u5C4B\u9876\u63A9\u853D\u4E86\u5C40\u90E8\u5730\u9762\uFF1B\u672A\u6807\u5B9A\u8FDE\u7EED\u53EF\u8D70 Tile \u524D\uFF0C\u4E0D\u7ED3\u7B97\u5FA1\xB7\u884C\u8DEF\u3002" },
        { id: "ly-v2-pond-reveal", x: 735, y: 585, label: "\u51FA\u5F04\u89C1\u6C60", kind: "visual", scriptRef: "CH3-04", note: "\u6536\u653E\u5173\u7CFB\u662F\u955C\u5934\u76EE\u6807\uFF0C\u673A\u4F4D\u4E0E\u95E8\u6D1E\u9700\u624B\u5DE5\u6821\u51C6\u3002" },
        { id: "ly-v2-flower-work", x: 955, y: 735, label: "\u65E7\u82B1\u5320\u5360\u4F4D\uFF08\u5E9F\uFF09", kind: "npc", scriptRef: "CH3-05", note: "\u82B1\u623F\u4E0E\u4E1C\u56ED\u5173\u7CFB\u4E0D\u7B26\uFF0C\u6B64\u70B9\u53EA\u4F9B\u8BEF\u7A3F\u5BA1\u8BA1\uFF1B\u76C6\u5170\u4E0E\u7389\u5170\u4E0D\u53EF\u6DF7\u7528\u3002" },
        { id: "ly-v2-four-doors", x: 1130, y: 400, label: "\u65E7\u56DB\u95E8\u5360\u4F4D\uFF08\u5E9F\uFF09", kind: "trigger", scriptRef: "CH3-06", note: "\u56DB\u95E8\u5E76\u6392\u6A21\u578B\u5DF2\u64A4\u9500\uFF1B\u5404\u9662\u5E94\u5206\u680B\u8003\u8BC1\uFF0C\u4E0D\u5F97\u636E\u6B64\u7ED3\u7B97\u3002" },
        { id: "ly-v2-study", x: 1220, y: 465, label: "\u8FD8\u8BFB\u6211\u4E66\u658B\u5019\u9009", kind: "interaction", scriptRef: "CH3-07/08/09", note: "\u658B\u540D\u4E0E\u82AD\u8549\u53F6\u73A9\u6CD5\u89C1\u5267\u672C\uFF1B\u5177\u4F53\u5EFA\u7B51\u4E0E\u682A\u4F4D\u4ECD\u5F85\u6838\u3002" }
      ]
    },
    {
      id: "liuyuan-whole-garden-study",
      label: "\u7559\u56ED \xB7 \u56DB\u533A\u89C6\u89C9\u8BD5\u7A3F v1",
      asset: "../assets/scene25d/liuyuan-whole-garden-study-v1.png",
      width: 1536,
      height: 1024,
      tileW: 96,
      tileH: 64,
      note: "\u6309\u5E26\u5317\u7BAD\u5934\u7684\u5168\u56ED\u5BFC\u89C8\u56FE\u53CA\u56ED\u6797\u5C40\u56DB\u533A\u8BF4\u660E\u7EA6\u675F\u897F\u5C71\u3001\u4E2D\u6C60\u3001\u4E1C\u5385\u4E0E\u5317\u90E8\u683D\u690D\u533A\u3002\u5165\u53E3\u56FE\u50CF\u5C1A\u672A\u8868\u73B0\u5267\u672C\u5FC5\u9700\u7684\u7A84\u6697\u66F2\u6298\u5939\u5F04\uFF1B1890 \u4E1C\u56ED\u6269\u5EFA\u3001\u5404\u4E66\u658B\u95E8\u4F4D\u53CA\u82B1\u623F\u682A\u4F4D\u4E5F\u5F85\u6838\u3002\u53EA\u4F9B\u7F8E\u672F\u4E0E\u5267\u672C\u951A\u70B9\u5BF9\u7167\uFF0C\u5C1A\u4E0D\u53EF\u94FA\u6B63\u5F0F\u53EF\u8D70\u7F51\u683C\u3002",
      storyAnchors: [
        { id: "ly-v1-alley-threshold", x: 665, y: 850, label: "\u5C0F\u95E8\u4E0E\u5939\u5F04\u5F85\u91CD\u753B", kind: "trigger", scriptRef: "CH3-03/04", note: "\u73B0\u56FE\u5357\u5165\u53E3\u8FC7\u4E8E\u655E\u4EAE\uFF0C\u672A\u6EE1\u8DB3\u4E09\u5F2F\u540E\u8C41\u7136\u5F00\u6717\uFF1B\u6B63\u5F0F\u5939\u5F04\u9700\u53E6\u5236\u6216\u91CD\u753B\uFF0C\u4E0D\u80FD\u5728\u6B64\u76F4\u63A5\u7ED3\u7B97\u5FA1\xB7\u884C\u8DEF\u3002" },
        { id: "ly-v1-flower-work", x: 850, y: 790, label: "\u65E7\u82B1\u623F\u5360\u4F4D\uFF08\u672A\u6838\uFF09", kind: "npc", scriptRef: "CH3-05", note: "\u6C11\u56FD\u6E38\u8BB0\u5C06\u82B1\u623F\u7F6E\u4E8E\u897F\u90E8\u5C0F\u84EC\u83B1\u4E00\u5E26\uFF1B\u6B64\u56FE\u5357\u90E8\u70B9\u4F4D\u4E0D\u53EF\u7528\u4F5C\u6B63\u5F0F\u5165\u53E3\u3002\u82B1\u5320\u76C6\u4E2D\u662F\u5170\uFF0C\u4E0D\u753B\u7389\u5170\u76C6\u82D7\u3002" },
        { id: "ly-v1-four-doors", x: 1130, y: 400, label: "\u65E7\u56DB\u95E8\u5360\u4F4D\uFF08\u5E9F\uFF09", kind: "trigger", scriptRef: "CH3-06", note: "\u56DB\u95E8\u5E76\u6392\u6A21\u578B\u5DF2\u64A4\u9500\uFF1B\u771F\u5B9E\u5EFA\u7B51\u5206\u5728\u76F8\u8FDE\u7684\u4E0D\u540C\u9662\u843D\uFF0C\u4E0D\u80FD\u636E\u751F\u6210\u56FE\u5B9A\u4F4D\u3002" },
        { id: "ly-v1-study", x: 1220, y: 465, label: "\u65E7\u4E66\u658B\u5360\u4F4D\uFF08\u672A\u6838\uFF09", kind: "interaction", scriptRef: "CH3-07/08/09", note: "\u4E66\u658B\u3001\u8549\u53F6\u53CA\u95E8\u989D\u90FD\u672A\u843D\u4F4D\uFF1B\u76DB\u6C0F\u65F6\u671F\u8FD8\u8BFB\u6211\u4E66\u658B/\u5904\u540D\u79F0\u5B58\u6765\u6E90\u51B2\u7A81\uFF0C\u4E0D\u80FD\u7ED9 1890 \u533E\u989D\u5B9A\u5B57\u3002" },
        { id: "ly-v1-middle-pond", x: 650, y: 455, label: "\u4E2D\u592E\u6C60\u56ED", kind: "visual", scriptRef: "CH3-04", note: "\u51FA\u7A84\u5F04\u540E\u7684\u7A7A\u95F4\u91CA\u653E\uFF1B\u6C34\u8FB9\u53EF\u8D70\u7EBF\u3001\u6C60\u5CB8\u78B0\u649E\u548C\u6865\u5934\u4ECD\u5F85\u4EBA\u5DE5\u6807\u5B9A\u3002" }
      ]
    },
    {
      id: "tuisi-whole-garden-study",
      label: "\u9000\u601D\u56ED \xB7 \u897F\u5B85\u4E1C\u56ED\u8BD5\u7A3F",
      asset: "../assets/scene25d/tuisi-whole-garden-study-v1.png",
      width: 1536,
      height: 1024,
      tileW: 96,
      tileH: 64,
      note: "\u53C2\u8003\u9000\u601D\u56ED\u5E73\u9762\u4E0E\u5B98\u65B9\u89E3\u8BF4\uFF1B\u897F\u5B85\u2014\u4E2D\u5EAD\u2014\u4E1C\u56ED\u5173\u7CFB\u4FDD\u7559\u3002\u4EBA\u7269/\u9053\u5177\u5750\u6807\u662F\u5267\u672C\u7F16\u8F91\u951A\u70B9\uFF0C\u987B\u9010\u70B9\u62D6\u62FD\u590D\u6838\uFF1B\u6811\u53EA\u4F9B\u89C2\u770B\uFF0C\u4E0D\u662F\u4EA4\u4E92\u3002",
      storyAnchors: [
        { id: "tuisi-house-gate", x: 300, y: 580, label: "\u4EFB\u5B85\u65E0\u533E\u95E8", kind: "trigger", scriptRef: "CH8-04", note: "\u95E8\u3001\u5F71\u58C1\u3001\u95E8\u5385\uFF1B\u4E0D\u53EF\u753B\u5546\u53F7\u6216\u706F\u7B3C\u5F0F\u6837\u3002" },
        { id: "tuisi-moon-gate", x: 845, y: 275, label: "\u897F\u5B85\u5165\u4E1C\u56ED", kind: "trigger", scriptRef: "CH8-05", note: "\u4E09\u8FDB\u5B85\u2014\u4E2D\u5EAD\u2014\u6708\u6D1E\u95E8\u8F6C\u573A\uFF1B\u751F\u6D3B\u9648\u8BBE\u72EC\u7ACB\uFF0C\u7816\u989D\u4E0D\u653E\u672A\u7ECF\u6838\u5B9A\u7684\u5B57\u3002" },
        { id: "tuisi-pond-reveal", x: 940, y: 400, label: "\u4E00\u6C60\u73AF\u5C4B", kind: "visual", scriptRef: "CH8-06/07", note: "\u6C34\u4E0E\u56DB\u5468\u623F\u5B50\u7684\u5173\u7CFB\u7531\u73A9\u5BB6\u89C2\u5BDF\u5F97\u51FA\uFF0C\u4E0D\u5F39\u8BF4\u660E\u5361\u3002" },
        { id: "tuisi-old-tree", x: 1115, y: 225, label: "\u6C60\u8FB9\u8001\u6811", kind: "visual", scriptRef: "CH8-08", note: "\u53EA\u770B\u89C1\uFF1B\u4E0D\u53D1\u4EFB\u52A1\u3001\u4E0D\u5F39\u63D0\u793A\u3001\u4E0D\u8FDB\u65E5\u5FD7\u3002\u4F4D\u7F6E\u4E0E\u6811\u9F84\u5747\u5F85\u6838\u3002" },
        { id: "tuisi-water-terrace", x: 1270, y: 740, label: "\u9000\u4E00\u6B65\u53D6\u666F", kind: "interaction", scriptRef: "CH8-09", note: "\u73A9\u5BB6\u4E3B\u52A8\u9000\u4E00\u6B65\u5E76\u53D6\u666F\uFF1B\u8DE8\u6C34\u6708\u53F0\u7684\u771F\u5B9E\u5BF9\u5E94\u7269\u5F85\u6838\u3002" },
        { id: "tuisi-upper-gallery-permission", x: 1165, y: 425, label: "\u5148\u95EE\u53EF\u5426\u501F\u5ECA", kind: "npc", scriptRef: "CH8-10", note: "\u8BBF\u56ED\u793C\u89E6\u53D1\u5019\u9009\u70B9\uFF1B\u8001\u4EC6\u8BB8\u53EF\u5916\u5ECA\u3001\u5185\u5B85\u95E8\u4E0D\u53EF\u7A7F\u3002\u5750\u6807\u9700\u5BF9\u56FE\u91CD\u6821\u3002" },
        { id: "tuisi-upper-gallery", x: 1190, y: 355, label: "\u5929\u6865\u4FEF\u770B", kind: "trigger", scriptRef: "CH8-11", note: "\u4E8C\u5C42\u5ECA\u7684\u9AD8\u4F4E\u5C42\u5173\u7CFB\u8981\u5355\u72EC\u5EFA\u51E0\u4F55\uFF0C\u4E0D\u5F97\u5F53\u4F5C\u5E73\u9762\u6865\u3002" }
      ]
    },
    {
      id: "ouyuan-whole-garden-study",
      label: "\u8026\u56ED \xB7 \u4E2D\u5B85\u53CC\u56ED\u8BD5\u7A3F",
      asset: "../assets/scene25d/ouyuan-whole-garden-study-v1.png",
      width: 1536,
      height: 1024,
      tileW: 96,
      tileH: 64,
      note: "\u53C2\u8003\u5168\u56ED\u5E73\u9762\u548C\u5B98\u65B9\u5206\u533A\uFF1A\u4E2D\u5B85\u3001\u897F\u5C0F\u56ED\u3001\u4E1C\u5927\u56ED\uFF1B\u4ECA\u65E5\u5165\u53E3\u672A\u5FC5\u662F 1890 \u5165\u53E3\u3002\u6807\u8BB0\u4EC5\u4F9B\u5267\u672C\u6392\u6F14\u3002",
      storyAnchors: [
        { id: "ouyuan-house-gate", x: 500, y: 825, label: "\u5C0F\u65B0\u6865\u5DF7\u5165\u5B85", kind: "trigger", scriptRef: "CH7-02", note: "\u95E8\u65E0\u533E\uFF1B\u5386\u53F2\u5165\u53E3\u9700\u590D\u6838\uFF0C\u4E0D\u4EE5\u4ECA\u65E5\u68C0\u7968\u53E3\u66FF\u4EE3\u3002" },
        { id: "ouyuan-central-halls", x: 560, y: 385, label: "\u4E2D\u5B85\u56DB\u8FDB", kind: "trigger", scriptRef: "CH7-03", note: "\u95E8\u5385\u2014\u8F7F\u5385\u2014\u8F7D\u9152\u5802\u2014\u697C\u5385\uFF1B\u4E66\u6848\u3001\u8336\u5177\u7B49\u751F\u6D3B\u9648\u8BBE\u7528\u72EC\u7ACB\u7CBE\u7075\u3002" },
        { id: "ouyuan-east-pond", x: 1085, y: 515, label: "\u4E1C\u56ED\u6C60\u4E0E\u9EC4\u77F3", kind: "interaction", scriptRef: "CH7-04/09", note: "\u6C60\u897F\u8FB9\u6B65\u9053\u4E3A\u64CD\u4F5C\u70B9\uFF0C\u4E0E\u897F\u56ED\u4E95\u6210\u5BF9\uFF1B\u4E1C\u56ED\u9EC4\u77F3\u800C\u975E\u6CDB\u5316\u767D\u8272\u6E56\u77F3\u3002" },
        { id: "ouyuan-west-well", x: 215, y: 320, label: "\u897F\u56ED\u4E95\u4E0E\u6E56\u77F3", kind: "interaction", scriptRef: "CH7-05/06/09", note: "\u73A9\u5BB6\u4E3B\u52A8\u5728\u4E1C\u6C60\u3001\u897F\u4E95\u4E24\u7AEF\u5B8C\u6210\u914D\u5BF9\u3002" },
        { id: "ouyuan-stone-bench", x: 905, y: 585, label: "\u8001\u4EC6\u77F3\u51F3", kind: "npc", scriptRef: "CH7-07", note: "\u4EBA\u7269\u89E6\u53D1\u5BF9\u8BDD\uFF1B\u4E0D\u5F97\u63D0\u524D\u4EE3\u73A9\u5BB6\u8BF4\u51FA\u7B54\u6848\u3002" },
        { id: "ouyuan-sedan-hall", x: 550, y: 635, label: "\u8F7F\u5385\u5BF9\u8054", kind: "interaction", scriptRef: "CH7-08", note: "\u5BF9\u8054\u53E6\u5236\u53EF\u8BFB\u9053\u5177\uFF1B\u6587\u5B57\u6309\u5267\u672C\u4E0E\u8003\u636E\u590D\u6838\u3002" },
        { id: "ouyuan-west-library", x: 165, y: 520, label: "\u9CBD\u781A\u5E90\u53CC\u781A", kind: "interaction", scriptRef: "CH7-10", note: "\u533E\u4E0E\u4E24\u5757\u781A\u77F3\u72EC\u7ACB\u9053\u5177\uFF1B\u6240\u5728\u623F\u95F4\u5F85\u5B9E\u5730\u56FE\u6838\u3002" }
      ],
      routeGraph: {
        nodes: [
          { id: "entry", x: 500, y: 825, label: "\u5DF7\u53E3\u5165\u5B85", kind: "entry", anchorId: "ouyuan-house-gate", note: "\u5165\u53E3\u5E74\u4EE3\u548C\u95E8\u4F4D\u5F85\u590D\u6838\u3002" },
          { id: "front-hall", x: 525, y: 755, label: "\u524D\u5385", kind: "waypoint", note: "\u53EA\u6CBF\u53EF\u89C1\u95E8\u69DB\u5165\u5385\uFF0C\u5C4B\u9876\u88C1\u5207\u9700\u914D\u5408\u3002" },
          { id: "sedan-hall", x: 550, y: 635, label: "\u8F7F\u5385", kind: "goal", anchorId: "ouyuan-sedan-hall", note: "\u5BF9\u8054\u4EA4\u4E92\u5728\u5385\u5185\u3002" },
          { id: "middle-hall", x: 555, y: 505, label: "\u4E2D\u8FDB", kind: "waypoint", note: "\u5357\u5317\u5385\u5802\u8FDE\u7EED\u6027\u987B\u9010\u95E8\u6838\u5BF9\u3002" },
          { id: "central-halls", x: 560, y: 385, label: "\u8F7D\u9152\u5802\uFF0F\u697C\u5385", kind: "goal", anchorId: "ouyuan-central-halls", note: "\u5185\u5916\u5BA4\u5C42\u7EA7\u4E0E\u53EF\u8D70\u95E8\u69DB\u987B\u62C6\u51FA\uFF1B\u9648\u8BBE\u53E6\u4F5C\u7CBE\u7075\u3002" },
          { id: "west-portal", x: 410, y: 395, label: "\u901A\u897F\u56ED\u95E8", kind: "portal", note: "\u5019\u9009\u95E8\u6D1E\uFF1B\u6309\u5E73\u9762\u6838\u5B9E\uFF0C\u4E0D\u8981\u7A7F\u5899\u3002" },
          { id: "west-well", x: 215, y: 320, label: "\u897F\u56ED\u4E95", kind: "goal", anchorId: "ouyuan-west-well", note: "\u6B65\u70B9\u5E94\u5728\u4E95\u65C1\uFF0C\u4E0D\u5728\u4E95\u6C34\u4E0A\u3002" },
          { id: "west-library", x: 165, y: 520, label: "\u9CBD\u781A\u5E90", kind: "goal", anchorId: "ouyuan-west-library", note: "\u85CF\u4E66\u697C\u5165\u53E3\u4E0E\u697C\u5C42\u5F85\u6838\u3002" },
          { id: "east-portal", x: 785, y: 395, label: "\u901A\u4E1C\u56ED\u95E8", kind: "portal", note: "\u5019\u9009\u95E8\u6D1E\uFF1B\u4E1C\u56ED\u9EC4\u77F3\u8FD1\u666F\u4E0D\u80FD\u6321\u8DEF\u3002" },
          { id: "east-walk", x: 925, y: 440, label: "\u4E1C\u56ED\u897F\u8DEF", kind: "waypoint", note: "\u7ED5\u9EC4\u77F3\u62B5\u6C60\u8FB9\u3002" },
          { id: "east-pond", x: 1085, y: 515, label: "\u4E1C\u56ED\u6C60", kind: "goal", anchorId: "ouyuan-east-pond", note: "\u6C60\u8FB9\u5B89\u5168\u7AD9\u4F4D\uFF1B\u4E0D\u53EF\u843D\u5728\u6C34\u4E2D\u3002" },
          { id: "east-pavilion", x: 1375, y: 455, label: "\u4E1C\u56ED\u4EAD", kind: "waypoint", note: "\u4EAD\u4E0E\u6C60\u5CB8\u7684\u8FDE\u63A5\u987B\u5BF9\u7167\u7247\u590D\u6838\u3002" },
          { id: "south-court", x: 795, y: 635, label: "\u5357\u5EAD\u56DE\u8DEF", kind: "waypoint", note: "\u8349\u5730\u4E0D\u53EF\u5168\u90E8\u9ED8\u8BA4\u4E3A\u53EF\u8D70\uFF1B\u6309\u5B9E\u9645\u8E0F\u6B65\u6536\u7A84\u3002" },
          { id: "stone-bench", x: 905, y: 585, label: "\u77F3\u51F3", kind: "goal", anchorId: "ouyuan-stone-bench", note: "\u8001\u4EC6\u6D3B\u52A8\u70B9\u3002" }
        ],
        edges: [
          { from: "entry", to: "front-hall", state: "candidate", note: "\u5DF7\u53E3\u81F3\u524D\u5385\u3002" },
          { from: "front-hall", to: "sedan-hall", state: "candidate", note: "\u5357\u5317\u5385\u5802\u95E8\u69DB\u3002" },
          { from: "sedan-hall", to: "middle-hall", state: "candidate", note: "\u4E2D\u8F74\u4E0B\u4E00\u8FDB\u3002" },
          { from: "middle-hall", to: "central-halls", state: "candidate", note: "\u4E2D\u8F74\u6B63\u5385\u3002" },
          { from: "central-halls", to: "west-portal", state: "candidate", note: "\u7ECF\u5B85\u5165\u897F\u56ED\u3002" },
          { from: "west-portal", to: "west-well", state: "candidate", note: "\u897F\u56ED\u4E95\u65C1\u8DEF\u3002" },
          { from: "west-well", to: "west-library", state: "candidate", note: "\u897F\u56ED\u81F3\u9CBD\u781A\u5E90\u3002" },
          { from: "central-halls", to: "east-portal", state: "candidate", note: "\u7ECF\u5B85\u5165\u4E1C\u56ED\u3002" },
          { from: "east-portal", to: "east-walk", state: "candidate", note: "\u4E1C\u56ED\u897F\u8DEF\u3002" },
          { from: "east-walk", to: "east-pond", state: "candidate", note: "\u5230\u6C60\u897F\u5CB8\u3002" },
          { from: "east-pond", to: "east-pavilion", state: "candidate", note: "\u6CBF\u6C60\u5CB8\u5230\u4EAD\u3002" },
          { from: "east-portal", to: "south-court", state: "candidate", note: "\u5EAD\u9662\u5206\u8DEF\u3002" },
          { from: "south-court", to: "stone-bench", state: "candidate", note: "\u8001\u4EC6\u77F3\u51F3\u3002" },
          { from: "stone-bench", to: "east-pond", state: "candidate", note: "\u77F3\u51F3\u81F3\u6C60\u5CB8\u56DE\u8DEF\uFF0C\u9700\u5B9E\u6D4B\u95E8\u6D1E\u3002" }
        ]
      }
    },
    {
      id: "zhuozheng-whole-garden-study-v4",
      label: "\u62D9\u653F\u56ED \xB7 \u4E1C\u5411\u65E7\u95E8\u4FEE\u8BA2\u8BD5\u7A3F v4",
      asset: "../assets/scene25d/zhuozheng-whole-garden-study-v4.png",
      width: 1536,
      height: 1024,
      tileW: 96,
      tileH: 64,
      note: "\u4F9D\u56ED\u6797\u5C40\u6240\u8F7D\u4E1C\u90E8\u65E7\u5165\u53E3\u671D\u4E1C\u3001\u901A\u767E\u5BB6\u5DF7\u7684\u5173\u7CFB\uFF0C\u53BB\u6389 v3 \u4E1C\u90E8\u5357\u5411\u6B63\u95E8\uFF0C\u5728\u4E1C\u4FA7\u8865\u7A84\u5DF7\u4E0E\u5C0F\u95E8\uFF1B\u4FDD\u7559\u897F\u8865\u56ED\u3001\u4E2D\u4F1A\u9986\u3001\u4E1C\u5F52\u7530\u56ED\u5C45\u7684\u4EA7\u6743\u5899\u3002\u65E7\u95E8\u7CBE\u786E\u4F4D\u7F6E\u3001\u5404\u5385\u6C60\u4E0E 1890 \u5EFA\u7B51\u65AD\u4EE3\u672A\u6838\uFF1B\u4E0D\u5F97\u628A\u6B64\u56FE\u5F53\u5386\u53F2\u6D4B\u7ED8\u6216\u53EF\u8D70\u5173\u5361\u3002",
      storyAnchors: [
        { id: "zz-v4-buyuan-gate", x: 190, y: 810, label: "\u897F\u90E8\u8865\u56ED\u79C1\u95E8", kind: "boundary", scriptRef: "CH2-01", note: "\u95E8\u623F\u63A8\u6258\u53D1\u751F\u4E8E\u8857\u5C42\uFF1B\u95E8\u4F4D\u4E0E\u5F62\u5236\u4ECD\u5F85\u53F2\u6599\u6838\u5B9A\uFF0C\u56ED\u5185\u521D\u8BBF\u4E0D\u53EF\u8FDB\u5165\u3002" },
        { id: "zz-v4-huiguan-gate", x: 580, y: 805, label: "\u4E2D\u90E8\u4F1A\u9986\u95E8", kind: "boundary", scriptRef: "CH2-02/03", note: "\u95E8\u548C\u77F3\u523B\u5E94\u5728\u8FD1\u666F\u5236\u4F5C\uFF1B\u5F53\u524D\u56FE\u4EC5\u8868\u8FBE\u4E0E\u8865\u56ED\u4E0D\u540C\u7684\u4EA7\u6743\u3002" },
        { id: "zz-v4-west-middle-wall", x: 355, y: 450, label: "\u897F\u4E2D\u9694\u5899", kind: "boundary", scriptRef: "CH2-08/10", note: "\u65E0\u666E\u901A\u901A\u8DEF\uFF1B\u5899\u7EBF\u5177\u4F53\u5750\u6807\u662F\u7F8E\u672F\u5019\u9009\u3002" },
        { id: "zz-v4-middle-east-wall", x: 1035, y: 470, label: "\u4E2D\u4E1C\u9694\u5899", kind: "boundary", scriptRef: "CH2-07/08/10", note: "\u591C\u95F4\u7FFB\u5899\u5E94\u53E6\u4F5C\u53D7\u63A7\u8F6C\u573A\uFF0C\u4E0D\u53EF\u5C06\u5899\u753B\u6210\u5F00\u653E\u95E8\u6D1E\u3002" },
        { id: "zz-v4-east-old-gate", x: 1490, y: 765, label: "\u4E1C\u90E8\u65E7\u5165\u53E3 \xB7 \u671D\u767E\u5BB6\u5DF7", kind: "boundary", scriptRef: "CH2-01/07", note: "\u4E1C\u5411\u65E7\u95E8\u6709\u53F2\u6599\u4F9D\u636E\uFF1B\u6B64\u5750\u6807\u3001\u95E8\u5F62\u53CA 1890 \u5F00\u95ED\u72B6\u6001\u5C1A\u672A\u6838\u5B9E\uFF0C\u4E0D\u80FD\u89C6\u4F5C\u5E38\u89C4\u5165\u53E3\u3002" },
        { id: "zz-v4-east-ruin", x: 1240, y: 570, label: "\u4E1C\u90E8\u6B8B\u56ED", kind: "visual", scriptRef: "CH2-07/08", note: "\u8352\u829C\u7A0B\u5EA6\u4E3A\u5267\u60C5\u6F14\u7ECE\uFF0C\u4E0D\u662F\u9010\u7269\u590D\u539F\u3002" },
        { id: "zz-v4-window", x: 970, y: 335, label: "\u90A3\u6247\u7A97 \xB7 \u5F85\u6838\u673A\u4F4D", kind: "visual", scriptRef: "CH2-09", note: "\u4EC5\u5267\u60C5\u4E00\u6B21\u6027\u955C\u5934\uFF0C\u4E0D\u5728\u5730\u56FE\u4E0A\u63D0\u524D\u63D0\u793A\u3002" },
        { id: "zz-v4-wall-sketch", x: 1220, y: 745, label: "\u753B\u4E09\u9053\u5899", kind: "interaction", scriptRef: "CH2-10", note: "\u4E1C\u90E8\u79BB\u56ED\u524D\u7531\u73A9\u5BB6\u4EB2\u624B\u753B\uFF0C\u5B9E\u9645\u5B89\u5168\u7AD9\u4F4D\u5F85\u6807\u5B9A\u3002" }
      ],
      routeGraph: {
        // CH2 夜入东园的候选骨架；白天三闸在城图街层，不从这里连接西园或会馆。
        nodes: [
          { id: "east-night-entry", x: 1460, y: 685, label: "\u4E1C\u90E8\u5899\u5185\u843D\u811A", kind: "entry", note: "\u4E54\u74F7\u5E26\u5165\u540E\u7684\u843D\u811A\u5019\u9009\uFF1B\u4E0D\u662F\u767D\u5929\u4ECE\u65E7\u95E8\u5165\u56ED\u3002" },
          { id: "east-south-path", x: 1375, y: 710, label: "\u4E1C\u56ED\u5357\u4FA7\u5C0F\u5F84", kind: "waypoint", note: "\u907F\u5F00\u6C34\u8FB9\u4E0E\u5899\u6839\uFF1B\u5730\u9762\u5BBD\u5EA6\u987B\u4EBA\u5DE5\u6821\u51C6\u3002" },
          { id: "east-sketch", x: 1220, y: 745, label: "\u753B\u4E09\u9053\u5899", kind: "goal", anchorId: "zz-v4-wall-sketch", note: "CH2-10 \u4E34\u79BB\u56ED\u7AD9\u4F4D\uFF1B\u4E0D\u63D0\u524D\u5C55\u793A\u4EA4\u4E92\u3002" },
          { id: "east-observe", x: 1165, y: 635, label: "\u9694\u5899\u89C2\u5BDF", kind: "waypoint", note: "\u4EC5\u4ECE\u4E1C\u56ED\u4FA7\u770B\u4E2D\u897F\u5206\u754C\uFF1B\u4E0D\u8DE8\u5899\u3002" }
        ],
        edges: [
          { from: "east-night-entry", to: "east-south-path", state: "candidate", note: "\u591C\u95F4\u5165\u56ED\u540E\u6CBF\u4E1C\u4FA7\u65F1\u8DEF\u884C\u8D70\u3002" },
          { from: "east-south-path", to: "east-sketch", state: "candidate", note: "\u6CBF\u5357\u4FA7\u8DEF\u5230\u8BB0\u5899\u70B9\u3002" },
          { from: "east-sketch", to: "east-observe", state: "candidate", note: "\u4E1C\u90E8\u89C2\u5BDF\u8FB9\u754C\uFF0C\u4E0D\u80FD\u8DE8\u5165\u4F1A\u9986\u3002" }
        ]
      }
    },
    {
      id: "zhuozheng-whole-garden-study-v3",
      label: "\u62D9\u653F\u56ED \xB7 \u65E7\u4E09\u754C\u8BD5\u7A3F v3\uFF08\u5357\u95E8\u9519\u8BEF\uFF09",
      asset: "../assets/scene25d/zhuozheng-whole-garden-study-v3.png",
      width: 1536,
      height: 1024,
      tileW: 96,
      tileH: 64,
      note: "\u65E7\u8BD5\u7A3F\u4FDD\u7559\u8349\u7A3F\uFF1A\u867D\u64A4\u53BB v2 \u5357\u4FA7\u957F\u76F4\u6CB3\u53CA\u5DE8\u578B\u4E1C\u5858\uFF0C\u4F46\u628A\u4E1C\u90E8\u65E7\u95E8\u9519\u8BEF\u5730\u753B\u5728\u5357\u9762\uFF1B\u56ED\u6797\u5C40\u8BB0\u8F7D\u5176\u671D\u4E1C\u901A\u767E\u5BB6\u5DF7\u3002\u4E0D\u5F97\u4F5C\u4E3A\u6B63\u5F0F\u51E0\u4F55\u6765\u6E90\uFF0C\u6539\u7528 v4 \u7EE7\u7EED\u6807\u5B9A\u3002",
      storyAnchors: [
        { id: "zz-v3-buyuan-gate", x: 190, y: 808, label: "\u897F\u90E8\u8865\u56ED\u79C1\u95E8", kind: "boundary", scriptRef: "CH2-01", note: "\u5F20\u6C0F\u5BB6\u56ED\u5728\u897F\uFF0C\u521D\u8BBF\u4E0D\u53EF\u5165\uFF1B\u786E\u5207 1890 \u95E8\u4F4D\u4E0E\u95E8\u623F\u5F85\u53F2\u6599\u6838\u5B9A\u3002" },
        { id: "zz-v3-huiguan-gate", x: 580, y: 802, label: "\u4E2D\u90E8\u4F1A\u9986\u95E8", kind: "boundary", scriptRef: "CH2-02/03", note: "\u4F1A\u9986\u4E0E\u8865\u56ED\u5404\u6709\u4EA7\u6743\uFF0C\u4E0D\u53EF\u753B\u6210\u540C\u4E00\u6E38\u89C8\u5165\u53E3\uFF1B\u77F3\u523B\u505A\u72EC\u7ACB\u53EF\u8BFB\u9053\u5177\u3002" },
        { id: "zz-v3-west-middle-wall", x: 355, y: 420, label: "\u897F\u4E2D\u4EA7\u6743\u5899", kind: "boundary", scriptRef: "CH2-08/10", note: "\u8FB9\u754C\u4F4D\u7F6E\u4E3A\u89C6\u89C9\u5019\u9009\uFF1B\u4E0D\u8BB8\u9884\u8BBE\u53EF\u901A\u8FC7\u95E8\u6D1E\u3002" },
        { id: "zz-v3-middle-east-wall", x: 1030, y: 450, label: "\u4E2D\u4E1C\u4EA7\u6743\u5899", kind: "boundary", scriptRef: "CH2-07/08/10", note: "\u591C\u95F4\u7FFB\u5899\u7684\u7CBE\u786E\u4F4D\u7F6E\u5F85\u6838\uFF1B\u6B64\u5904\u4E0D\u5F97\u5F53\u4F5C\u65E5\u5E38\u901A\u8DEF\u3002" },
        { id: "zz-v3-east-ruin", x: 1250, y: 590, label: "\u5F52\u7530\u56ED\u5C45\u6B8B\u56ED", kind: "visual", scriptRef: "CH2-07/08", note: "\u8352\u829C\u7A0B\u5EA6\u662F\u5267\u672C\u6F14\u7ECE\uFF1B\u4E0D\u80FD\u79F0\u9010\u7269\u590D\u539F\uFF0C\u4E5F\u4E0D\u5E94\u753B\u6210\u5360\u6EE1\u4E1C\u90E8\u7684\u6CBC\u6CFD\u3002" },
        { id: "zz-v3-window", x: 960, y: 330, label: "\u90A3\u6247\u7A97 \xB7 \u673A\u4F4D\u5F85\u6838", kind: "visual", scriptRef: "CH2-09", note: "\u73A9\u5BB6\u9000\u8EAB\u65F6\u624D\u51FA\u73B0\u4E00\u6B21\uFF1B\u5F53\u524D\u5750\u6807\u4E0D\u662F\u5386\u53F2\u7A97\u4F4D\u3002" },
        { id: "zz-v3-wall-sketch", x: 1220, y: 745, label: "\u753B\u4E09\u9053\u5899", kind: "interaction", scriptRef: "CH2-10", note: "\u56DE\u5230\u4E1C\u90E8\u4E34\u79BB\u56ED\u65F6\u7531\u73A9\u5BB6\u4EB2\u624B\u753B\uFF1B\u4E0D\u63D0\u524D\u5F39\u4EFB\u52A1\u5361\u3002" }
      ]
    },
    {
      id: "zhuozheng-whole-garden-study",
      label: "\u62D9\u653F\u56ED \xB7 \u65E7\u8BEF\u7A3F v2\uFF08\u4FDD\u7559\u8349\u7A3F\uFF09",
      asset: "../assets/scene25d/zhuozheng-whole-garden-study-v2.png",
      width: 1536,
      height: 1024,
      tileW: 96,
      tileH: 64,
      note: "\u65E7\u8BEF\u7A3F\u4EC5\u4F9B\u6BD4\u8F83\u53CA\u4FDD\u7559\u6D4F\u89C8\u5668\u8349\u7A3F\uFF1A\u5357\u4FA7\u957F\u76F4\u6CB3\u672A\u6838\u3001\u4E1C\u90E8\u5DE8\u578B\u8352\u5858\u5931\u771F\uFF0C\u4E14\u897F\u90E8\u79C1\u56ED\u95E8\u7684\u951A\u70B9\u9519\u6807\u5230\u4E1C\u90E8\u3002\u4E0D\u5F97\u4F5C\u4E3A\u6B63\u5F0F\u51E0\u4F55\u6765\u6E90\uFF1B\u6539\u7528 v3 \u91CD\u65B0\u6807\u5B9A\u3002",
      storyAnchors: [
        { id: "zz-private-gate", x: 1250, y: 850, label: "\u4E1C\u56ED\u5916\u5899", kind: "boundary", scriptRef: "CH2-01/07", note: "\u521D\u8BBF\u4E0D\u53EF\u5165\uFF1B\u591C\u95F4\u4ECE\u5F52\u7530\u56ED\u5C45\u5E9F\u5740\u4E00\u4FA7\u7FFB\u5899\u3002\u5B9E\u9645\u591C\u8DEF\u53E6\u573A\u5236\u4F5C\u3002" },
        { id: "zz-huiguan-gate", x: 620, y: 600, label: "\u4F1A\u9986\u95E8", kind: "boundary", scriptRef: "CH2-02", note: "\u4E2D\u90E8\u4E0D\u662F\u516C\u5171\u5165\u53E3\uFF1B\u4E0D\u53EF\u505A\u4E3A\u666E\u901A\u5F00\u95E8\u4EA4\u4E92\u3002" },
        { id: "zz-middle-wall", x: 930, y: 435, label: "\u4E2D\u4E1C\u9694\u5899", kind: "boundary", scriptRef: "CH2-08", note: "\u4E09\u5757\u5730\u7684\u8FB9\u754C\u662F\u73A9\u6CD5\u6838\u5FC3\uFF1B\u78B0\u649E\u5FC5\u987B\u95ED\u5408\u3002" },
        { id: "zz-watcher-window", x: 865, y: 320, label: "\u90A3\u6247\u7A97", kind: "visual", scriptRef: "CH2-09", note: "\u4EC5\u6B64\u4E00\u6B21\u3001\u4E0D\u53EF\u56DE\u770B\uFF1B\u5728\u73A9\u5BB6\u505A\u5B8C\u89C2\u5BDF\u6B63\u8981\u9000\u65F6\u51FA\u73B0\u3002" },
        { id: "zz-wall-sketch", x: 1120, y: 730, label: "\u753B\u4E09\u9053\u5899", kind: "interaction", scriptRef: "CH2-10", note: "\u5E94\u5728\u8FD4\u56DE\u8352\u56ED\u3001\u51C6\u5907\u79BB\u5F00\u65F6\u89E6\u53D1\uFF0C\u4E0D\u63D0\u524D\u53D1\u4EFB\u52A1\u5361\u3002" }
      ]
    },
    {
      id: "huanxiu-whole-garden-study",
      label: "\u73AF\u79C0\u5C71\u5E84 \xB7 \u5C71\u5F84\u8BD5\u7A3F",
      asset: "../assets/scene25d/huanxiu-whole-garden-study-v1.png",
      width: 1536,
      height: 1024,
      tileW: 96,
      tileH: 64,
      note: "\u4EE5\u4ECA\u65E5\u5047\u5C71\u5E73\u9762\u7EA6\u675F\u6C34\u77F3\u62D3\u6251\uFF0C\u897F\u4FA7\u5E84\u5C4B\u4E3A\u6F14\u7ECE\uFF1B1980 \u5E74\u4EE3\u590D\u5EFA\u5EFA\u7B51\u4E0D\u5F97\u4F5C\u4E3A 1890 \u5B9E\u666F\u3002\u5C71\u4F53\u8DEF\u5F84\u62D3\u6251\u548C\u5C42\u9AD8\u5C1A\u672A\u6838\uFF0C\u4E0D\u80FD\u4E0A\u7EBF\u3002",
      storyAnchors: [
        { id: "hx-yizhuang-gate", x: 360, y: 810, label: "\u6C6A\u6C0F\u4E49\u5E84\u95E8", kind: "trigger", scriptRef: "CH6-02", note: "\u6734\u7D20\u9662\u5899\uFF0C\u4E0D\u753B\u98DE\u6A90\uFF1B\u56ED\u540D\u4E0D\u662F\u8857\u574A\u79F0\u547C\u3002" },
        { id: "hx-ledger", x: 300, y: 300, label: "\u8D26\u623F\u5212\u7EBF", kind: "interaction", scriptRef: "CH6-03/04", note: "\u7B97\u76D8\u3001\u8D26\u518C\u3001\u88AB\u5212\u6389\u7684\u4E24\u884C\u8981\u505A\u72EC\u7ACB\u53EF\u8BFB\u9053\u5177\u3002" },
        { id: "hx-east-inscription", x: 625, y: 245, label: "\u4E1C\u504F\u6709\u56ED", kind: "interaction", scriptRef: "CH6-05", note: "\u5D4C\u5899\u7891\u4E3A\u5267\u672C\u6F14\u7ECE\uFF1B\u4E0D\u5728\u7891\u4E0A\u5199\u56ED\u540D\u3002" },
        { id: "hx-mountain-first-view", x: 760, y: 630, label: "\u7B2C\u4E00\u773C\u5C71", kind: "visual", scriptRef: "CH6-06", note: "\u5C71\u811A\u6B65\u9053\u770B\u85E4\u2014\u6C34\u2014\u8865\u79CB\u822B\u2014\u5C71\uFF1B\u4E0D\u51FA\u73B0\u4EA4\u4E92\u63D0\u793A\u3002" },
        { id: "hx-copy-scroll", x: 325, y: 120, label: "\u65E7\u7BB1\u4E0E\u6479\u672C", kind: "interaction", scriptRef: "CH6-08", note: "\u5377\u5B50\u662F\u6479\u672C\uFF0C\u7EDD\u975E\u300A\u5177\u533A\u6797\u5C4B\u56FE\u300B\u771F\u8FF9\u3002" },
        { id: "hx-summit-path", x: 930, y: 185, label: "\u767B\u5C71\u4E0E\u5CF0\u6D1E", kind: "trigger", scriptRef: "CH6-09/10", note: "\u5FA1\xB7\u884C\u8DEF\uFF1B\u5CF0\u3001\u6EAA\u3001\u6C34\u69AD\u3001\u6D1E\u56DB\u5904\u6807\u8BB0\u9700\u518D\u7EC6\u5206\uFF0C\u5C71\u8DEF\u987B\u53E6\u5EFA\u9AD8\u4F4E\u5C42\u51E0\u4F55\u3002" }
      ]
    },
    {
      id: "yipu-whole-garden-study",
      label: "\u827A\u5703 \xB7 \u65E7\u8BD5\u7A3F v2\uFF08\u7F3A\u5EF6\u5149\u9601\uFF09",
      asset: "../assets/scene25d/yipu-whole-garden-study-v2.png",
      width: 1184,
      height: 1328,
      tileW: 74,
      tileH: 83,
      note: "\u65E7\u56FE\u4FDD\u7559\u6D4F\u89C8\u5668\u8349\u7A3F\uFF1A\u867D\u6709\u4E1C\u5B85\u897F\u56ED\u3001\u6C60\u5357\u571F\u5C71\u3001\u6C60\u4E1C\u4E73\u9C7C\u4EAD\u4E0E\u897F\u4FA7\u5C0F\u9662\uFF0C\u5374\u6F0F\u6389\u6C60\u5317\u6A2A\u8DE8\u6C34\u9762\u7684\u5EF6\u5149\u9601\u4E3B\u4F53\uFF1B\u4E0D\u53EF\u4F5C\u4E3A\u6B63\u5F0F\u51E0\u4F55\u5E95\u56FE\u3002",
      storyAnchors: [
        { id: "yipu-guild-gate", x: 1080, y: 1040, label: "\u6DF1\u5DF7\u516C\u6240\u95E8", kind: "trigger", scriptRef: "CH9-03", note: "1890 \u4E3A\u4E03\u8944\u516C\u6240\uFF1B\u95E8\u989D\u5185\u5BB9\u548C\u4F4D\u7F6E\u5F85\u8003\u3002" },
        { id: "yipu-busy-forecourt", x: 945, y: 990, label: "\u6D3B\u8BA1\u5360\u6EE1\u524D\u9662", kind: "visual", scriptRef: "CH9-04", note: "\u8BA9\u73A9\u5BB6\u7B2C\u4E00\u773C\u770B\u4E0D\u5230\u56ED\uFF1B\u8D27\u7269\u7CBE\u7075\u53EF\u79FB\u9664\uFF0C\u4E0D\u6D82\u6B7B\u5728\u5E95\u56FE\u3002" },
        { id: "yipu-inset-tablet", x: 690, y: 580, label: "\u5ECA\u4E0B\u89C4\u6761\u7891", kind: "interaction", scriptRef: "CH9-05/11", note: "\u5D4C\u5899\u9752\u77F3\uFF0C\u4E0D\u662F\u7891\u4EAD\uFF1B\u7891\u523B\u4F4D\u7F6E\u5C5E\u4E8E\u5267\u672C\u6F14\u7ECE\u3002" },
        { id: "yipu-pond-seat", x: 675, y: 765, label: "\u6C60\u8FB9\u5C11\u4E00\u7B14", kind: "interaction", scriptRef: "CH9-06/08/09", note: "\u6C60\u4E1C\u6B65\u9053\u4E0A\u7684\u5019\u9009\u64CD\u4F5C\u70B9\uFF1B\u540C\u4E00\u673A\u4F4D\u770B\u6C34\u3001\u5899\u3001\u5C71\uFF0C\u53EF\u5750\u4E0B\u3001\u644A\u56ED\u8C31\uFF0C\u4E4B\u540E\u542C\u58F0\u3002" },
        { id: "yipu-south-earth-hill", x: 380, y: 1050, label: "\u6C60\u5357\u571F\u5C71", kind: "interaction", scriptRef: "CH9-07", note: "\u571F\u5C71\u4E3A\u4E3B\u3001\u6E56\u77F3\u62A4\u5761\uFF1B\u4E0D\u5F97\u753B\u6210\u7EAF\u6E56\u77F3\u5927\u5C71\u3002" },
        { id: "yipu-west-moon-gate", x: 255, y: 800, label: "\u82B9\u5E90\u6708\u6D1E\u95E8", kind: "trigger", scriptRef: "CH9-07", note: "\u8FDB\u5165\u897F\u9662\u4E0E\u5C0F\u6C60\uFF0C\u95E8\u6D1E\u9700\u53EF\u901A\u8FC7\u3002" },
        { id: "yipu-accounts", x: 950, y: 1060, label: "\u53F8\u4E8B\u8D26\u684C", kind: "npc", scriptRef: "CH9-10", note: "\u53F8\u4E8B\u6536\u8D26\u3001\u77F3\u5757\u538B\u7EB8\uFF1B\u53EA\u7ED9\u573A\u666F\u7269\u8BC1\uFF0C\u4E0D\u5FF5\u5236\u5EA6\u8BF4\u660E\u3002" }
      ],
      routeGraph: {
        nodes: [
          { id: "entry", x: 1080, y: 1040, label: "\u4E1C\u4FA7\u5DF7\u95E8", kind: "entry", anchorId: "yipu-guild-gate", note: "1890 \u516C\u6240\u5165\u53E3\u5F85\u6838\uFF0C\u4E0D\u628A\u4ECA\u65E5\u95E8\u989D\u5F53\u8BC1\u636E\u3002" },
          { id: "forecourt", x: 945, y: 990, label: "\u5FD9\u788C\u524D\u9662", kind: "waypoint", anchorId: "yipu-busy-forecourt", note: "\u8D27\u7269\u53EF\u79FB\uFF1B\u7559\u51FA\u4EBA\u7269\u901A\u8DEF\u3002" },
          { id: "accounts", x: 950, y: 1060, label: "\u53F8\u4E8B\u8D26\u684C", kind: "goal", anchorId: "yipu-accounts", note: "NPC \u4EA4\u4E92\u70B9\u987B\u5728\u8D26\u684C\u524D\u3002" },
          { id: "east-south-passage", x: 735, y: 930, label: "\u4E1C\u5ECA\u5357\u6BB5", kind: "waypoint", note: "\u907F\u5F00\u5899\u57FA\u548C\u524D\u9662\u5C0F\u6C60\u3002" },
          { id: "east-middle-passage", x: 690, y: 760, label: "\u4E1C\u5ECA\u6C60\u8FB9", kind: "waypoint", note: "\u6C34\u4E0E\u5ECA\u4E4B\u95F4\u9700\u8981\u72EC\u7ACB\u6C60\u5CB8\u78B0\u649E\u3002" },
          { id: "tablet", x: 690, y: 580, label: "\u5ECA\u4E0B\u9752\u77F3", kind: "goal", anchorId: "yipu-inset-tablet", note: "\u7891\u662F\u5D4C\u5899\uFF0C\u4E0D\u5360\u6B65\u9053\u3002" },
          { id: "north-hall", x: 650, y: 300, label: "\u5317\u90E8\u5802\u5C4B", kind: "waypoint", note: "\u5B85\u56ED\u4EA4\u754C\u4E0E\u5385\u5185\u95E8\u69DB\u5F85\u6838\u3002" },
          { id: "pond-seat", x: 675, y: 765, label: "\u6C60\u4E1C\u5750\u70B9", kind: "goal", anchorId: "yipu-pond-seat", note: "CH9-08/09 \u5171\u4EAB\u673A\u4F4D\uFF0C\u4EBA\u7269\u4E0D\u80FD\u7AD9\u6C34\u91CC\u3002" },
          { id: "south-turn", x: 565, y: 955, label: "\u6C60\u5357\u8F6C\u6298", kind: "waypoint", note: "\u6CBF\u5CB8\u5411\u571F\u5C71\uFF0C\u4E0D\u4ECE\u6C34\u9762\u6284\u8FD1\u8DEF\u3002" },
          { id: "earth-hill", x: 380, y: 1050, label: "\u571F\u5C71\u811A", kind: "goal", anchorId: "yipu-south-earth-hill", note: "\u4E3B\u4F53\u571F\u5C71\uFF1B\u6E56\u77F3\u4EC5\u5C40\u90E8\u62A4\u5761\u3002" },
          { id: "west-moon-gate", x: 255, y: 800, label: "\u82B9\u5E90\u6708\u95E8", kind: "portal", anchorId: "yipu-west-moon-gate", note: "\u6708\u6D1E\u95E8\u4E0B\u5FC5\u987B\u53EF\u901A\u884C\u3002" },
          { id: "west-bank", x: 190, y: 600, label: "\u6C60\u897F\u7A84\u8DEF", kind: "waypoint", note: "\u6C60\u5CB8\u4E0E\u5899\u4E4B\u95F4\u5BBD\u5EA6\u5F85\u5B9E\u6D4B\u3002" },
          { id: "north-west-court", x: 350, y: 305, label: "\u5317\u897F\u5EAD\u9662", kind: "waypoint", note: "\u4E0E\u5317\u5802\u8FDE\u901A\uFF0C\u5F62\u6210\u73AF\u6C60\u56DE\u8DEF\u3002" }
        ],
        edges: [
          { from: "entry", to: "forecourt", state: "candidate", note: "\u4E1C\u5DF7\u5165\u516C\u6240\u3002" },
          { from: "forecourt", to: "accounts", state: "candidate", note: "\u524D\u9662\u81F3\u8D26\u684C\u3002" },
          { from: "forecourt", to: "east-south-passage", state: "candidate", note: "\u7ECF\u524D\u9662\u5165\u4E1C\u5ECA\u3002" },
          { from: "east-south-passage", to: "east-middle-passage", state: "candidate", note: "\u4E1C\u5ECA\u6CBF\u6C60\u5317\u884C\u3002" },
          { from: "east-middle-passage", to: "tablet", state: "candidate", note: "\u5ECA\u4E0B\u89C1\u7891\u3002" },
          { from: "tablet", to: "north-hall", state: "candidate", note: "\u5ECA\u81F3\u5317\u90E8\u5802\u5C4B\u3002" },
          { from: "east-middle-passage", to: "pond-seat", state: "candidate", note: "\u6B65\u9053\u81F3\u5750\u70B9\u3002" },
          { from: "pond-seat", to: "south-turn", state: "candidate", note: "\u6CBF\u6C60\u4E1C\u5357\u5CB8\u8D70\u3002" },
          { from: "south-turn", to: "earth-hill", state: "candidate", note: "\u6C60\u5357\u81F3\u571F\u5C71\u3002" },
          { from: "earth-hill", to: "west-moon-gate", state: "candidate", note: "\u5C71\u811A\u8F6C\u897F\u9662\uFF1B\u6838\u6708\u95E8\u65B9\u4F4D\u3002" },
          { from: "west-moon-gate", to: "west-bank", state: "candidate", note: "\u897F\u4FA7\u7A84\u8DEF\u3002" },
          { from: "west-bank", to: "north-west-court", state: "candidate", note: "\u7ED5\u6C60\u897F\u5317\u884C\u3002" },
          { from: "north-west-court", to: "north-hall", state: "candidate", note: "\u7ECF\u5317\u5EAD\u56DE\u5230\u5802\u5C4B\uFF0C\u5F62\u6210\u73AF\u7EBF\u3002" }
        ]
      }
    }
  ];
  var yipuV2 = SCENE_PLATES_BASE.find((plate) => plate.id === "yipu-whole-garden-study");
  var yipuV3 = {
    ...yipuV2,
    id: "yipu-whole-garden-study-v3",
    label: "\u827A\u5703 \xB7 \u6C60\u5317\u5EF6\u5149\u9601\u4FEE\u8BA2\u8BD5\u7A3F v3",
    asset: "../assets/scene25d/yipu-whole-garden-study-v3.png",
    note: "\u6C60\u5317\u8865\u51FA\u6A2A\u5411\u4E94\u5F00\u95F4\u4E34\u6C34\u5EF6\u5149\u9601\uFF0C\u5317\u63A5\u5EAD\u9662\u4E0E\u4E3B\u5385\uFF0C\u4E1C\u4FA7\u4FDD\u7559\u5165\u9601\u8DEF\u5F84\uFF1B\u5EF6\u5149\u9601\u4E3A\u665A\u6E05\u4E03\u8944\u516C\u6240\u65F6\u671F\u7A7A\u95F4\uFF0C\u4E0D\u7167\u642C 1984 \u5E74\u533E\u989D\u3002\u9601\u524D\u7F18\u3001\u652F\u67F1\u3001\u5ECA\u95E8\u548C\u6C34\u9762\u6263\u9664\u533A\u4ECD\u9700\u4EBA\u5DE5\u6838\u5BF9\uFF0C\u4E0D\u80FD\u76F4\u63A5\u5F53\u6B63\u5F0F\u78B0\u649E\u5E95\u56FE\u3002v2 \u4E0E\u6D4F\u89C8\u5668\u8349\u7A3F\u4FDD\u7559\u3002",
    storyAnchors: [
      ...yipuV2.storyAnchors ?? [],
      { id: "yipu-v3-yanguangge", x: 420, y: 515, label: "\u5EF6\u5149\u9601 \xB7 \u4E34\u6C34\u5411\u5357", kind: "visual", scriptRef: "CH9-06/08/09", note: "\u6C60\u5317\u4E94\u5F00\u95F4\u6C34\u69AD\uFF0C\u4E3A\u73A9\u5BB6\u6C60\u4E1C\u5750\u70B9\u6240\u89C1\u7684\u5BF9\u666F\uFF1B\u53EF\u8FDB\u5165\u4F46\u4E0D\u53E6\u53D1\u4EFB\u52A1\u3002\u9601\u5185\u811A\u70B9\u4E0E\u6C34\u9762\u754C\u7EBF\u5F85\u7F16\u8F91\u5668\u5B9E\u8D70\u3002" }
    ],
    routeGraph: {
      nodes: [
        ...yipuV2.routeGraph?.nodes ?? [],
        { id: "yanguangge-east-portal", x: 560, y: 520, label: "\u5EF6\u5149\u9601\u4E1C\u7AEF\u95E8", kind: "portal", note: "\u4E0E\u4E1C\u4FA7\u5ECA\u9053\u7684\u95E8\u6D1E\u5019\u9009\uFF1B\u4E0D\u53EF\u7A7F\u5899\u6216\u843D\u6C34\u3002" },
        { id: "yanguangge-floor", x: 420, y: 515, label: "\u5EF6\u5149\u9601\u4E34\u6C34\u5ECA\u9762", kind: "goal", anchorId: "yipu-v3-yanguangge", note: "\u4E94\u5F00\u95F4\u6C34\u69AD\u5185\u7684\u5019\u9009\u811A\u70B9\uFF1B\u9601\u524D\u7F18\u4E0B\u65B9\u4E3A\u6C34\uFF0C\u78B0\u649E\u5FC5\u987B\u6CBF\u680F\u6746\u622A\u6B62\u3002" }
      ],
      edges: [
        ...yipuV2.routeGraph?.edges ?? [],
        { from: "tablet", to: "yanguangge-east-portal", state: "candidate", note: "\u4EC5\u4FDD\u7559\u8DEF\u7EBF\u610F\u56FE\uFF1Bv3 \u56FE\u4E0A\u7891\u4F4D\u81F3\u9601\u4E1C\u95E8\u4E4B\u95F4\u88AB\u4E1C\u4FA7\u5EFA\u7B51\u548C\u5EAD\u5899\u5207\u65AD\uFF0C\u4E0D\u80FD\u76F4\u63A5\u5F00\u653E Tile\uFF0C\u987B\u91CD\u6838\u5E95\u56FE\u548C\u95E8\u5ECA\u8FDE\u63A5\u3002" },
        { from: "yanguangge-east-portal", to: "yanguangge-floor", state: "candidate", note: "\u6CBF\u6C34\u69AD\u5BA4\u5185\u5730\u9762\u897F\u884C\uFF1B\u4E0D\u5F97\u8D70\u8FDB\u6C60\u9762\u3002" }
      ]
    }
  };
  var lvyinExistingPlate = SCENE_PLATES_BASE.find((plate) => plate.id === "liuyuan-lvyin-pond-study-v1");
  var lvyinPixelStudy = {
    ...lvyinExistingPlate,
    id: "liuyuan-lvyin-pond-pixel-study-v2",
    label: "\u7559\u56ED \xB7 \u7EFF\u836B\u8F69\u4E34\u6C60\u50CF\u7D20\u8BED\u8A00\u3010\u72EC\u7ACB\u6821\u4F4D\u3011",
    asset: "../research-art/liuyuan-lvyin-pixel-language-study-v2.png",
    storyAnchors: lvyinExistingPlate.storyAnchors?.map((anchor) => ({
      ...anchor,
      scriptRef: "\u72EC\u7ACB\u51E0\u4F55\u7814\u7A76",
      note: `${anchor.note} \u672C\u72EC\u7ACB\u7A3F\u53EA\u7528\u4E8E\u50CF\u7D20\u4E0E\u539F\u8F6E\u5ED3\u5BF9\u7167\uFF0C\u4E0D\u89E6\u53D1 CH3\u3002`
    })),
    note: "\u7528\u65E7\u4E34\u6C60\u56FE\u4F5C\u51E0\u4F55\u7F16\u8F91\u76EE\u6807\u3001\u5165\u53E3\u659C\u4FEF\u89C6\u56FE\u4F5C\u50CF\u7D20\u8BED\u8A00\u53C2\u7167\uFF1B\u9488\u5BF9\u6811\u51A0\u91CD\u590D\u548C\u5355\u8C03\u9A73\u5CB8\u4FEE\u8BA2\u7684\u73B0\u72B6\u542F\u53D1\u7814\u7A76\u7A3F\u3002\u6CBF\u7528\u65E7\u56FE\u5CB8\u8DEF\u548C\u680F\u6746\u7684\u4EE3\u7801\u8F6E\u5ED3\u4F5C\u5BF9\u7167\uFF0C\u672A\u9010\u50CF\u7D20\u590D\u6838\u65B0\u56FE\u7684\u680F\u811A\u4E0E\u6C34\u7EBF\uFF0C\u4E14\u65E7\u56FE\u672C\u8EAB\u5E76\u975E\u6E05\u672B\u6D4B\u7ED8\uFF1B\u4E0D\u63A5 CH3\u3001\u4E0D\u66FF\u6362\u65E7\u56FE\u6216\u8349\u7A3F\u3002\u5230\u6C60\u8FB9\u6309 E \u7684\u4E3B\u52A8\u671B\u6C60\u64CD\u4F5C\u53EF\u5728\u72EC\u7ACB\u9875\u6821\u753B\u9762\u8282\u594F\u3002"
  };
  var SCENE_PLATES = [
    ...SCENE_PLATES_BASE.slice(0, -1),
    lvyinPixelStudy,
    yipuV3,
    yipuV2
  ];

  // src/render/scholar-sprite.ts
  var SCHOLAR_FRAMES = [
    [
      { sx: 159, sy: 25, sw: 164, sh: 341 },
      { sx: 457, sy: 25, sw: 165, sh: 348 },
      { sx: 757, sy: 25, sw: 164, sh: 348 }
    ],
    [
      { sx: 159, sy: 375, sw: 175, sh: 345 },
      { sx: 450, sy: 375, sw: 180, sh: 340 },
      { sx: 754, sy: 375, sw: 174, sh: 345 }
    ],
    [
      { sx: 147, sy: 722, sw: 177, sh: 345 },
      { sx: 451, sy: 722, sw: 188, sh: 345 },
      { sx: 750, sy: 722, sw: 183, sh: 345 }
    ],
    [
      { sx: 157, sy: 1069, sw: 175, sh: 337 },
      { sx: 454, sy: 1069, sw: 176, sh: 341 },
      { sx: 749, sy: 1069, sw: 179, sh: 343 }
    ]
  ];
  function scholarFrame(direction, phase) {
    return SCHOLAR_FRAMES[Math.max(0, Math.min(3, Math.floor(direction)))][Math.max(0, Math.min(2, Math.floor(phase)))];
  }
  function perspectiveScholarHeight(footY, farY, nearY, farHeight, nearHeight) {
    const t = Math.max(0, Math.min(1, (footY - farY) / (nearY - farY)));
    return Math.round(farHeight + (nearHeight - farHeight) * t);
  }
  function drawScholarAtFoot(ctx2, sprite2, direction, phase, footX, footY, height) {
    drawSpriteFrameAtFoot(ctx2, sprite2, scholarFrame(direction, phase), footX, footY, height);
  }
  function drawSpriteFrameAtFoot(ctx2, sprite2, frame, footX, footY, height) {
    const drawnHeight = Math.round(height);
    const drawnWidth = Math.round(drawnHeight * frame.sw / frame.sh);
    ctx2.drawImage(
      sprite2,
      frame.sx,
      frame.sy,
      frame.sw,
      frame.sh,
      Math.round(footX) - Math.floor(drawnWidth / 2),
      Math.round(footY) - drawnHeight,
      drawnWidth,
      drawnHeight
    );
  }
  function drawScholarGroundShadow(ctx2, footX, footY, height) {
    const x = Math.round(footX), y = Math.round(footY);
    const outer = Math.round(height * 0.4), inner = Math.round(height * 0.29);
    ctx2.fillStyle = "rgba(19, 27, 21, .12)";
    ctx2.fillRect(x - Math.floor(outer / 2), y - 3, outer, 5);
    ctx2.fillStyle = "rgba(19, 27, 21, .23)";
    ctx2.fillRect(x - Math.floor(inner / 2), y - 2, inner, 3);
  }

  // src/render/liuyuan-bucket.ts
  function carryingLiuyuanPorridge(progress) {
    return hasStoryFlag(progress, "ly-errand-offered") && !hasStoryFlag(progress, "ly-porridge-delivered");
  }
  function liuyuanBucketAnchor(footX, footY, actorHeight, direction, carried) {
    const side = direction === 2 ? -1 : 1;
    return {
      x: footX + (carried ? side * actorHeight * 0.27 : 0),
      y: footY - (carried ? actorHeight * 0.16 : 0)
    };
  }
  function drawLiuyuanPorridgeBucket(ctx2, footX, footY, actorHeight, direction, carried, grounded = !carried) {
    const h = Math.max(9, Math.round(actorHeight * 0.23));
    const w = Math.max(8, Math.round(h * 0.78));
    const anchor = liuyuanBucketAnchor(footX, footY, actorHeight, direction, carried);
    const x = Math.round(anchor.x - w / 2);
    const bottom = Math.round(anchor.y);
    const y = bottom - h;
    if (grounded) {
      ctx2.fillStyle = "rgba(23, 31, 24, .2)";
      ctx2.fillRect(x - 2, bottom - 1, w + 4, 3);
    }
    ctx2.fillStyle = "#3c3830";
    ctx2.fillRect(x - 1, y + 2, w + 2, h - 1);
    ctx2.fillStyle = "#78634b";
    ctx2.fillRect(x + 1, y + 3, w - 2, h - 4);
    ctx2.fillStyle = "#a58a65";
    ctx2.fillRect(x + 2, y + 4, Math.max(1, Math.floor(w / 3)), h - 6);
    ctx2.fillStyle = "#463c32";
    ctx2.fillRect(x, y + Math.floor(h * 0.6), w, 2);
    ctx2.fillStyle = "#c0b4a0";
    ctx2.fillRect(x, y, w, 3);
    ctx2.fillStyle = "#4b4033";
    ctx2.fillRect(x + 1, y - 4, 2, 4);
    ctx2.fillRect(x + w - 3, y - 4, 2, 4);
    ctx2.fillRect(x + 2, y - 5, Math.max(1, w - 4), 2);
  }

  // src/core/liuyuan-modern-route.ts
  function canEnterModernReturn(search, progress, from, prerequisite) {
    const query = new URLSearchParams(search);
    return query.get("return") === "1" && canEnterModernRoute(search, progress, from, prerequisite);
  }
  function canEnterModernRoute(search, progress, from, prerequisite) {
    const query = new URLSearchParams(search);
    return query.get("route") === "modern" && query.get("from") === from && hasStoryFlag(progress, prerequisite);
  }

  // src/core/liuyuan-view-memory.ts
  function chapterSceneHref(page, draft2 = false) {
    const query = new URLSearchParams({ chapter: "1" });
    if (draft2) query.set("draft", "1");
    carryLiuyuanPlaytest(query);
    return `${page}?${query}`;
  }

  // src/core/liuyuan-chapter-resume-link.ts
  function liuyuanChapterResumeLink(progress, search) {
    const current = new URLSearchParams(search);
    if (current.get("returnStudy") === "1" || current.get("return") === "1" || hasStoryFlag(progress, "ly-unlocked")) return null;
    const flag = (id) => hasStoryFlag(progress, id);
    let page, label, query;
    if (flag("ly-leaf-carried")) {
      page = "liuyuan-entry.html";
      label = "\u7EE7\u7EED\u8FD4\u7A0B \xB7 \u5C06\u7A7A\u6876\u4EA4\u8FD8\u4E54\u79BE";
      query = new URLSearchParams({ route: "modern", from: "flower", return: "1" });
    } else if (flag("ly-leaf-written")) {
      page = "liuyuan-study-court.html";
      label = "\u53F6\u4E0A\u5B57\u5DF2\u5199\u597D \xB7 \u56DE\u53BB\u53D6\u7A7A\u6876";
      query = new URLSearchParams({ route: "modern", from: "leaf", return: "1" });
    } else if (flag("ly-leaf-picked")) {
      page = "liuyuan-leaf-writing-study.html";
      label = "\u7EE7\u7EED\u9898\u53F6 \xB7 \u63A5\u7EED\u4E34\u5199";
      query = new URLSearchParams({ route: "modern", from: "study-interior" });
    } else if (flag("ly-study-found")) {
      page = "liuyuan-study-interior.html";
      label = "\u7EE7\u7EED\u4E66\u658B\u91CC\u7684\u6258\u4ED8";
      query = new URLSearchParams({ route: "modern", from: "study-court" });
    } else if (flag("ly-porridge-delivered")) {
      page = "liuyuan-east-hall.html";
      label = "\u7CA5\u5DF2\u9001\u5230 \xB7 \u7EE7\u7EED\u5BFB\u627E\u4E66\u658B";
      query = new URLSearchParams({ route: "modern", from: "flower" });
    } else if (flag("ly-alley-walked")) {
      page = "liuyuan-flower.html";
      label = "\u7EE7\u7EED\u9001\u7CA5 \xB7 \u53BB\u82B1\u623F\u6A90\u4E0B";
      query = new URLSearchParams({ chapter: "1" });
    } else return null;
    if (current.get("draft") === "1") query.set("draft", "1");
    if (current.get("playtest") === "1") query.set("playtest", "1");
    return { href: `${page}?${query}`, label };
  }

  // src/core/liuyuan-entry-camera.ts
  var LIUYUAN_ENTRY_VIEW = { width: 504, height: 344 };
  var LIUYUAN_ENTRY_WORLD = { width: 1008, height: 688 };
  var LIUYUAN_ENTRY_SHOT_KEYS = [
    { footX: 520, footY: 656, cameraX: 268, cameraY: 344 },
    // street: first well only
    { footX: 520, footY: 610, cameraX: 268, cameraY: 344 },
    // one open gate
    { footX: 520, footY: 550, cameraX: 268, cameraY: 332 },
    // front hall
    { footX: 520, footY: 480, cameraX: 268, cameraY: 295 },
    // first lightwell
    { footX: 520, footY: 400, cameraX: 250, cameraY: 270 },
    // narrow south passage
    { footX: 430, footY: 400, cameraX: 200, cameraY: 262 },
    // west bend, windows hidden
    { footX: 430, footY: 374, cameraX: 185, cameraY: 236 },
    // second lightwell
    { footX: 430, footY: 300, cameraX: 150, cameraY: 160 },
    // first view of six windows
    { footX: 430, footY: 250, cameraX: 110, cameraY: 90 },
    // tree court
    { footX: 420, footY: 232, cameraX: 100, cameraY: 78 },
    // window foot
    { footX: 340, footY: 232, cameraX: 70, cameraY: 78 },
    // west passage
    { footX: 290, footY: 232, cameraX: 35, cameraY: 78 }
    // exit to next shot
  ];
  function clamp(value, lower, upper) {
    return Math.max(lower, Math.min(upper, value));
  }
  function entryCameraForFoot(footX, footY) {
    let bestDistance = Infinity;
    let bestSegment = 0;
    let bestT = 0;
    for (let index = 0; index < LIUYUAN_ENTRY_SHOT_KEYS.length - 1; index++) {
      const from2 = LIUYUAN_ENTRY_SHOT_KEYS[index];
      const to2 = LIUYUAN_ENTRY_SHOT_KEYS[index + 1];
      const dx = to2.footX - from2.footX;
      const dy = to2.footY - from2.footY;
      const lengthSquared = dx * dx + dy * dy;
      const t = lengthSquared ? clamp(((footX - from2.footX) * dx + (footY - from2.footY) * dy) / lengthSquared, 0, 1) : 0;
      const offX = footX - (from2.footX + dx * t);
      const offY = footY - (from2.footY + dy * t);
      const distance = offX * offX + offY * offY;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestSegment = index;
        bestT = t;
      }
    }
    const from = LIUYUAN_ENTRY_SHOT_KEYS[bestSegment];
    const to = LIUYUAN_ENTRY_SHOT_KEYS[bestSegment + 1];
    const progress = bestSegment + bestT;
    const beat = progress < 3 ? "gate" : progress < 7 ? "bend" : "windows";
    return {
      x: clamp(
        from.cameraX + (to.cameraX - from.cameraX) * bestT,
        0,
        LIUYUAN_ENTRY_WORLD.width - LIUYUAN_ENTRY_VIEW.width
      ),
      y: clamp(
        from.cameraY + (to.cameraY - from.cameraY) * bestT,
        0,
        LIUYUAN_ENTRY_WORLD.height - LIUYUAN_ENTRY_VIEW.height
      ),
      beat
    };
  }

  // src/liuyuan-entry.ts
  var canvas = document.getElementById("scene");
  var ctx = canvas.getContext("2d");
  var status = document.getElementById("status");
  var showTiles = document.getElementById("showTiles");
  var coords = document.getElementById("coords");
  var reset = document.getElementById("reset");
  var interactButton = document.getElementById("interact");
  var dialogueBox = document.getElementById("dialogue");
  var speaker = document.getElementById("speaker");
  var line = document.getElementById("line");
  var choicesBox = document.getElementById("choices");
  var nextLine = document.getElementById("nextLine");
  var chapterComplete = document.getElementById("chapterComplete");
  var updateChapterEcho = () => {
    document.getElementById("chapterEcho").textContent = drawingChapterEcho(loadProgress().knowledge);
  };
  updateChapterEcho();
  var params = new URLSearchParams(location.search);
  var atmosphereStudyRequested = params.get("art") === "atmosphere-v1";
  var atmosphereStudyEnabled = atmosphereStudyRequested && params.get("draft") !== "1";
  document.getElementById("returnVariantHome").href = chapterSceneHref("home.html");
  document.getElementById("returnCityMap").href = chapterSceneHref("sucheng.html");
  document.getElementById("returnChapterJournal").href = chapterSceneHref("journal.html");
  var playtest = isLiuyuanPlaytest(location.search);
  var playtestStart = document.getElementById("playtestStart");
  var playtestBanner = document.getElementById("playtestBanner");
  var playtestRestart = document.getElementById("playtestRestart");
  var playtestFileWarning = document.getElementById("playtestFileWarning");
  var interactionCue = document.getElementById("interactionCue");
  playtestStart.hidden = playtest;
  playtestBanner.hidden = !playtest;
  playtestFileWarning.hidden = !playtest || location.protocol !== "file:";
  playtestRestart.addEventListener("click", () => {
    if (!playtest) return;
    leavingEntry = true;
    clearEntryResume(resumeSlot);
    resetProgress();
    location.assign("liuyuan-entry.html?playtest=1");
  });
  var continueStory = document.getElementById("continueSavedStory");
  var savedStory = liuyuanChapterResumeLink(loadProgress(), location.search);
  continueStory.hidden = !savedStory;
  if (savedStory) {
    continueStory.href = savedStory.href;
    continueStory.textContent = savedStory.label;
  }
  var returnStudy = params.get("returnStudy") === "1";
  var artStudyBadge = document.getElementById("artStudyBadge");
  artStudyBadge.hidden = !atmosphereStudyRequested;
  artStudyBadge.textContent = atmosphereStudyEnabled ? "\u7F8E\u672F\u5019\u9009\u9884\u89C8 \xB7 \u4EC5\u89C6\u89C9\u53E0\u5C42\uFF0C\u539F\u8DEF\u7EBF\u3001\u78B0\u649E\u4E0E\u8349\u7A3F\u4E0D\u53D8\uFF1B\u975E\u5B9E\u666F\u590D\u539F\u3002" : "\u7F8E\u672F\u5019\u9009\u53E0\u5C42\u4E0D\u7528\u4E8E\u7F16\u8F91\u5668\u8349\u7A3F\uFF0C\u5DF2\u4FDD\u6301\u539F\u6837\u3002";
  var completedRevisit = !returnStudy && hasStoryFlag(loadProgress(), "ly-unlocked") && hasStoryFlag(loadProgress(), "ly-leaf-carried");
  var modernReturn = completedRevisit || canEnterModernReturn(location.search, loadProgress(), "court", "ly-leaf-carried") || canEnterModernReturn(location.search, loadProgress(), "flower", "ly-leaf-carried");
  var returnAlreadyComplete = modernReturn && hasStoryFlag(loadProgress(), "ly-unlocked");
  chapterComplete.hidden = !returnAlreadyComplete;
  if (playtest && (savedStory || modernReturn || returnAlreadyComplete))
    document.getElementById("playtestAdvice").textContent = returnAlreadyComplete ? "\u8FD9\u4E00\u7A0B\u5DF2\u7ECF\u5B8C\u6210\uFF0C\u53EF\u4EE5\u56DE\u770B\u95E8\u5916\u6216\u53BB\u5E9C\u5B66\u6838\u672C\u3002" : modernReturn ? "\u7A7A\u6876\u5728\u624B\u3002\u6CBF\u5939\u5F04\u56DE\u5230\u95E8\u69DB\uFF0C\u4E0E\u95E8\u623F\u8BF4\u8FC7\u8BDD\uFF0C\u518D\u5230\u8857\u9762\u8FD8\u7ED9\u4E54\u79BE\u3002" : "\u8BD5\u73A9\u8FDB\u5EA6\u5DF2\u4FDD\u7559\uFF0C\u53EF\u7EE7\u7EED\u5F53\u524D\u5267\u60C5\uFF0C\u4E5F\u53EF\u4ECE\u5934\u91CD\u8BD5\u73A9\u3002";
  var returnWalk = returnStudy || modernReturn;
  var returnStart = LIUYUAN_ENTRY_COURT_EXIT;
  var returnFinish = { x: 520, y: 656 };
  if (returnStudy) {
    document.title = "\u7559\u56ED\u5165\u53E3 \xB7 \u6CBF\u5939\u5F04\u539F\u8DEF\u8FD4\u56DE";
    document.getElementById("modeTitle").textContent = "\u4ECE\u5C0F\u5EAD\uFF0C\u539F\u8DEF\u8D70\u56DE\u95E8\u5916";
    document.getElementById("modeIntro").textContent = "\u6CBF\u540C\u4E00\u6761\u5939\u5F04\u4ECE\u5C0F\u5EAD\u8D70\u56DE\u8857\u9762\uFF0C\u7559\u610F\u4E24\u6B21\u5929\u4E95\u4E0E\u6298\u5411\u897F\u7684\u8F6C\u5F2F\u3002";
    document.getElementById("modeNote").textContent = "\u65B9\u5411\u952E / WASD / \u89E6\u5C4F\u65B9\u5411\u952E\u79FB\u52A8\uFF0CE\u3001\u7A7A\u683C\u6216\u201C\u67E5\u770B\u201D\u89C2\u5BDF\u3002\u6B64\u4E3A\u4E0D\u5199\u7AE0\u8282\u72B6\u6001\u3001\u4E0D\u53D1\u516D\u827A\u7684\u9006\u884C\u81EA\u7531\u8BD5\u73A9\uFF1B\u573A\u666F\u662F\u827A\u672F\u5316\u6E38\u620F\u7A7A\u95F4\uFF0C\u4E0D\u590D\u539F\u6E05\u672B\u95E8\u4F4D\u3002";
    interactButton.textContent = "\u67E5\u770B";
    reset.textContent = "\u56DE\u5230\u5C0F\u5EAD\u7AEF";
  }
  if (modernReturn) {
    document.title = "\u7559\u56ED\u7AE0 \xB7 \u7A7A\u6876\u51FA\u56ED";
    document.getElementById("modeTitle").textContent = "\u6CBF\u5939\u5F04\uFF0C\u63D0\u7A7A\u6876\u51FA\u56ED";
    document.getElementById("modeIntro").textContent = "\u4ECE\u5C0F\u5EAD\u53E3\u6CBF\u540C\u4E00\u6761\u7A84\u8DEF\u5F80\u5916\u8D70\u3002\u95E8\u623F\u4ECD\u5728\u4FEE\u706F\u7B3C\uFF1B\u5148\u5230\u95E8\u69DB\u524D\u5E94\u7B54\uFF0C\u518D\u8D70\u5230\u8857\u9762\u3002";
    document.getElementById("modeNote").textContent = "\u5165\u53E3\u6CBF\u539F\u6709\u53EF\u8D70\u8DEF\u7EBF\u5448\u73B0\uFF0C\u9001\u7CA5\u4FA7\u95E8\u3001\u95E8\u623F\u9A8C\u6876\u4E0E\u8549\u53F6\u85CF\u6CD5\u5747\u4E3A\u5267\u60C5\u6F14\u7ECE\u3002\u987B\u4EB2\u8D70\u5B8C\u5939\u5F04\u3001\u4E0E\u95E8\u623F\u5E94\u7B54\u624D\u7ED3\u7B97\u672C\u7AE0\u3002";
    interactButton.textContent = "\u4EA4\u8C08 / \u67E5\u770B";
    reset.textContent = "\u56DE\u5230\u5C0F\u5EAD\u53E3";
  }
  if (returnAlreadyComplete) {
    document.getElementById("modeTitle").textContent = "\u4ECE\u7559\u56ED\u95E8\u5916\uFF0C\u56DE\u770B\u8FD9\u4E00\u7A0B";
    document.getElementById("modeIntro").textContent = "\u5DF2\u7ECF\u6CBF\u5939\u5F04\u51FA\u56ED\uFF0C\u7A7A\u6876\u4EA4\u56DE\u4E54\u79BE\u3002\u6B64\u5904\u53EF\u56DE\u770B\u95E8\u5916\u573A\u666F\u3002";
    document.getElementById("modeNote").textContent = "\u672C\u7AE0\u5DF2\u7ED3\u7B97\u3002\u53EF\u56DE\u300A\u8607\u57CE\u5168\u5716\u300B\u6216\u7FFB\u770B\u56ED\u8C31\uFF1B\u5165\u53E3\u662F\u6E38\u620F\u5316\u573A\u666F\uFF0C\u4E0D\u5BF9\u5E94\u6E05\u672B\u539F\u95E8\u4F4D\u3002";
    reset.textContent = "\u56DE\u5230\u95E8\u5916";
  }
  var reverseStudyLink = document.getElementById("reverseStudyLink");
  reverseStudyLink.hidden = modernReturn;
  reverseStudyLink.href = returnStudy ? "liuyuan-entry.html" : "liuyuan-entry.html?returnStudy=1";
  reverseStudyLink.textContent = returnStudy ? "\u8FD4\u56DE\u5165\u53E3\u7AE0\u6D41" : "\u53E6\u770B\u5939\u5F04\u9006\u884C\u81EA\u7531\u8BD5\u73A9\uFF08\u4E0D\u7B97 CH3\uFF09";
  if (params.get("draft") === "1") reverseStudyLink.href += returnStudy ? "?draft=1" : "&draft=1";
  var draft = readScenePlateDraft(
    "liuyuan-entrance-topology-study",
    1008,
    688,
    buildLiuyuanEntryStudyMap,
    LIUYUAN_ENTRY_REQUIRED_FEET
  );
  var actorScalePercent = draft?.actorScalePercent ?? 100;
  var mapData = buildLiuyuanEntryStudyMap(draft?.regions ?? LIUYUAN_ENTRY_DRAFT_REGIONS);
  var geometry = draft?.geometry ?? [];
  var obstacles = geometry.flatMap((object) => object.colliders ?? []);
  var draftBadge = document.getElementById("draftBadge");
  draftBadge.hidden = params.get("draft") !== "1";
  if (!draft) draftBadge.textContent = "\u6CA1\u6709\u53EF\u7528\u4E14\u5168\u7A0B\u53EF\u8FBE\u7684\u7F16\u8F91\u5668\u8349\u7A3F\uFF0C\u6B63\u4F7F\u7528\u9ED8\u8BA4\u51E0\u4F55\uFF1B\u539F\u8349\u7A3F\u672A\u5220\u9664\uFF0C\u53EF\u56DE\u7F16\u8F91\u5668\u68C0\u67E5\u5939\u5F04\u3002";
  else if (draft.assetPath && draft.assetPath !== "../assets/scene25d/liuyuan-entrance-walkable-study-v2.svg") {
    draftBadge.textContent = "\u6B63\u5728\u9884\u89C8\u65E7\u5E95\u56FE\u4E0A\u7684\u7F16\u8F91\u5668\u8349\u7A3F\uFF1BTile \u53EF\u8BD5\u8D70\uFF0C\u4F46\u906E\u6321\u3001\u82B1\u76C6\u4E0E\u6A90\u53E3\u8BF7\u5728\u65B0\u5E95\u56FE\u4E0A\u91CD\u6821\u540E\u518D\u786E\u8BA4\u4FDD\u5B58\u3002";
  }
  var graph = SCENE_PLATES.find((plate) => plate.id === "liuyuan-entrance-topology-study").routeGraph;
  var background = new Image();
  background.src = "../assets/scene25d/liuyuan-entrance-walkable-study-v2.svg?v=6";
  var atmosphereLayer = new Image();
  if (atmosphereStudyEnabled) atmosphereLayer.src = "../research-art/liuyuan-entry-atmosphere-layer-v1.svg?v=2";
  var sprite = new Image();
  sprite.src = "../assets/characters/scholar-player-sprites-v1.png";
  var qiao = new Image();
  qiao.src = "../assets/characters/qiao-he-sprites-concept-v1.png";
  var gateNpcs = new Image();
  gateNpcs.src = "../assets/characters/liuyuan-gate-npcs-concept-v1.png";
  var actor = {
    ...returnAlreadyComplete ? returnFinish : returnWalk ? returnStart : LIUYUAN_ENTRY_SPAWN,
    dir: returnAlreadyComplete ? 0 : returnWalk ? 2 : 1,
    moving: false,
    walkTime: 0
  };
  var entryCamera = entryCameraForFoot(actor.x, actor.y);
  var QIAO_START = { x: 540, y: 676 };
  var QIAO_GATE = LIUYUAN_ENTRY_QIAO_WAIT;
  var QIAO_RETURN_WAIT = LIUYUAN_ENTRY_QIAO_WAIT;
  var qiaoWaitsByBundle = () => said("ly-huabu-seen") || said("ly-gate-passed");
  var qiaoActor = {
    x: returnWalk ? returnAlreadyComplete ? QIAO_RETURN_WAIT.x : QIAO_START.x : qiaoWaitsByBundle() ? QIAO_START.x : said("ly-errand-offered") ? QIAO_GATE.x : QIAO_START.x,
    y: QIAO_START.y,
    moving: false,
    walkTime: 0
  };
  var ENTRY_ACTOR_SCALE = LIUYUAN_CHARACTER_SCALE.entry;
  var QIAO_ENTRY_FRAMES = [
    [{ x: 162, y: 32, w: 157, h: 330 }, { x: 108, y: 32, w: 156, h: 330 }, { x: 57, y: 32, w: 155, h: 330 }],
    [{ x: 157, y: 6, w: 164, h: 356 }, { x: 101, y: 6, w: 168, h: 356 }, { x: 49, y: 6, w: 171, h: 356 }]
  ];
  function drawQiaoAtFoot(footX, footY, moving, walkTime) {
    const frame = moving ? 1 + Math.floor(walkTime * 6) % 2 : 0;
    const row = moving ? 1 : 0;
    const crop = QIAO_ENTRY_FRAMES[row][frame];
    const height = 49;
    const width = Math.round(height * crop.w / crop.h);
    drawScholarGroundShadow(ctx, footX, footY, height);
    ctx.drawImage(
      qiao,
      frame * 362 + crop.x,
      row * 2 * 362 + crop.y,
      crop.w,
      crop.h,
      Math.round(footX - width / 2),
      Math.round(footY - height),
      width,
      height
    );
  }
  function drawSeatedNpcAtFoot(sourceX, cropX, cropW, cropH, footX, footY, height) {
    const width = Math.round(height * cropW / cropH);
    drawScholarGroundShadow(ctx, footX, footY, height);
    ctx.drawImage(
      gateNpcs,
      sourceX + cropX,
      142,
      cropW,
      cropH,
      Math.round(footX - width / 2),
      footY - height,
      width,
      height
    );
  }
  var alleyCheckpoint = 0;
  var returnCheckpoint = returnAlreadyComplete ? LIUYUAN_ALLEY_RETURN_CHECKPOINTS.length : 0;
  var gateAnswered = returnAlreadyComplete;
  var bucketHandover = null;
  var RETURNED_BUCKET = { x: QIAO_RETURN_WAIT.x + 14, y: QIAO_RETURN_WAIT.y };
  var carryingBucket = modernReturn && !returnAlreadyComplete || !returnWalk && carryingLiuyuanPorridge(loadProgress());
  var bucketRestingAtExit = false;
  var dialogue = null;
  function said(flag) {
    return loadProgress().storyFlags.includes(flag);
  }
  var resumeSlot = `${playtest ? "playtest" : "campaign"}:${returnStudy ? "study-return" : modernReturn ? "chapter-return" : "forward"}:${params.get("draft") === "1" ? "draft" : "default"}${atmosphereStudyEnabled ? ":art-atmosphere-v1" : ""}`;
  var geometryStamp = entryGeometryStamp(mapData.map, obstacles);
  var leavingEntry = false;
  function resumeContext() {
    const progress = loadProgress();
    return {
      slot: resumeSlot,
      progressStamp: JSON.stringify([progress.updatedAt, [...progress.storyFlags].sort()]),
      geometryStamp,
      maxAlley: LIUYUAN_ALLEY_CHECKPOINTS.length,
      maxReturn: LIUYUAN_ALLEY_RETURN_CHECKPOINTS.length,
      canStand: (x, y) => !collides(mapData.map, x, y, mapData.w, mapData.h, obstacles, STANDARD_PLAYER_PROFILE),
      stateAllowed: (state) => {
        if (returnAlreadyComplete) return false;
        if (!returnWalk && !progress.storyFlags.includes("ly-gate-passed") && (state.y < 615 || state.alleyCheckpoint > 0)) return false;
        if (state.bucketResting && (returnWalk || !progress.storyFlags.includes("ly-alley-walked") || !carryingLiuyuanPorridge(progress))) return false;
        if (!returnWalk && (state.returnCheckpoint !== 0 || state.gateAnswered)) return false;
        if (returnWalk && (state.alleyCheckpoint !== 0 || state.bucketResting)) return false;
        if (modernReturn && state.gateAnswered && state.returnCheckpoint < LIUYUAN_ALLEY_RETURN_CHECKPOINTS.length - 1) return false;
        if (modernReturn && !state.gateAnswered && state.y > 625) return false;
        return true;
      }
    };
  }
  var resumed = readEntryResume(resumeContext());
  if (resumed) {
    actor.x = resumed.x;
    actor.y = resumed.y;
    actor.dir = resumed.dir;
    alleyCheckpoint = resumed.alleyCheckpoint;
    returnCheckpoint = resumed.returnCheckpoint;
    gateAnswered = resumed.gateAnswered;
    bucketRestingAtExit = resumed.bucketResting;
    if (bucketRestingAtExit) carryingBucket = false;
    Object.assign(entryCamera, entryCameraForFoot(actor.x, actor.y));
    const notice = document.getElementById("resumeNotice");
    notice.hidden = false;
    notice.textContent = bucketRestingAtExit ? "\u5DF2\u63A5\u7EED\u672C\u6807\u7B7E\u9875\u7684\u4F4D\u7F6E\uFF1B\u7CA5\u6876\u4ECD\u653E\u5728\u7A97\u524D\uFF0C\u9760\u8FD1\u540E\u518D\u63D0\u8D77\u3002" : "\u5DF2\u63A5\u7EED\u672C\u6807\u7B7E\u9875\u7684\u4F4D\u7F6E\u4E0E\u884C\u8D70\u6B21\u5E8F\uFF1B\u7EE7\u7EED\u9760\u8FD1\u4EBA\u7269\u6216\u7269\u4EF6\u4E92\u52A8\u3002";
  }
  var lastResumeWrite = -Infinity;
  var lastResumeValue = "";
  function saveEntryResume() {
    if (leavingEntry || returnAlreadyComplete) return;
    const context = resumeContext();
    const state = {
      x: actor.x,
      y: actor.y,
      dir: actor.dir,
      alleyCheckpoint,
      returnCheckpoint,
      gateAnswered,
      bucketResting: bucketRestingAtExit
    };
    const value = JSON.stringify([context.progressStamp, state]);
    if (value === lastResumeValue) return;
    writeEntryResume(context, state);
    lastResumeValue = value;
  }
  window.addEventListener("pagehide", saveEntryResume);
  window.addEventListener("blur", saveEntryResume);
  var near = (x, y, radius) => Math.hypot(actor.x - x, actor.y - y) <= radius;
  var keys = /* @__PURE__ */ new Set();
  var pressed = /* @__PURE__ */ new Set();
  var directions = {
    arrowup: "up",
    w: "up",
    arrowdown: "down",
    s: "down",
    arrowleft: "left",
    a: "left",
    arrowright: "right",
    d: "right"
  };
  window.addEventListener("keydown", (event) => {
    if (/^[1-9]$/.test(event.key) && dialogue && !event.repeat) {
      const index = Number(event.key) - 1;
      if (dialogue.index === dialogue.lines.length - 1 && dialogue.choices[index]) {
        event.preventDefault();
        chooseDialogue(index);
        return;
      }
    }
    if (event.key.toLowerCase() === "e" || event.key === " ") {
      event.preventDefault();
      if (!event.repeat) interact();
      return;
    }
    const direction = directions[event.key.toLowerCase()];
    if (!direction) return;
    event.preventDefault();
    keys.add(direction);
  });
  window.addEventListener("keyup", (event) => {
    const direction = directions[event.key.toLowerCase()];
    if (direction) keys.delete(direction);
    saveEntryResume();
  });
  window.addEventListener("blur", () => {
    keys.clear();
    pressed.clear();
  });
  for (const button of document.querySelectorAll("[data-dir]")) {
    const dir = button.dataset.dir;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      pressed.add(dir);
    });
    button.addEventListener("pointerup", () => {
      pressed.delete(dir);
      saveEntryResume();
    });
    button.addEventListener("pointercancel", () => pressed.delete(dir));
    button.addEventListener("lostpointercapture", () => pressed.delete(dir));
  }
  reset.addEventListener("click", () => {
    bucketHandover = null;
    clearEntryResume(resumeSlot);
    lastResumeValue = "";
    document.getElementById("resumeNotice").hidden = true;
    const completed = modernReturn && hasStoryFlag(loadProgress(), "ly-unlocked");
    chapterComplete.hidden = !completed;
    updateChapterEcho();
    actor.x = completed ? returnFinish.x : returnWalk ? returnStart.x : LIUYUAN_ENTRY_SPAWN.x;
    actor.y = completed ? returnFinish.y : returnWalk ? returnStart.y : LIUYUAN_ENTRY_SPAWN.y;
    Object.assign(entryCamera, entryCameraForFoot(actor.x, actor.y));
    actor.dir = completed ? 0 : returnWalk ? 2 : 1;
    alleyCheckpoint = 0;
    returnCheckpoint = completed ? LIUYUAN_ALLEY_RETURN_CHECKPOINTS.length : 0;
    gateAnswered = completed;
    bucketRestingAtExit = false;
    carryingBucket = modernReturn && !completed || !returnWalk && carryingLiuyuanPorridge(loadProgress());
    qiaoActor.x = returnWalk ? completed ? QIAO_RETURN_WAIT.x : QIAO_START.x : qiaoWaitsByBundle() ? QIAO_START.x : said("ly-errand-offered") ? QIAO_GATE.x : QIAO_START.x;
    qiaoActor.y = QIAO_START.y;
    qiaoActor.moving = false;
    keys.clear();
    pressed.clear();
    dialogue = null;
    renderDialogue();
  });
  interactButton.addEventListener("click", interact);
  nextLine.addEventListener("click", interact);
  function passGate() {
    commitLiuyuanChapterFlag("ly-gate-passed");
    showDialogue([{ who: "\u95E8\u623F", words: "\u82B1\u623F\u7684\uFF1F\u8FDB\u53BB\u5427\u3002\u6876\u63D0\u7A33\uFF0C\u522B\u6025\u7740\u8DD1\u3002" }]);
  }
  function showDialogue(lines, choices = []) {
    dialogue = { lines, index: 0, choices };
    keys.clear();
    pressed.clear();
    renderDialogue();
  }
  function chooseDialogue(index) {
    if (!dialogue || dialogue.index !== dialogue.lines.length - 1) return;
    const choice = dialogue.choices[index];
    if (!choice) return;
    dialogue = null;
    renderDialogue();
    choice.act();
  }
  function renderDialogue() {
    if (!dialogue) {
      dialogueBox.hidden = true;
      return;
    }
    dialogueBox.hidden = false;
    speaker.textContent = dialogue.lines[dialogue.index].who;
    line.textContent = dialogue.lines[dialogue.index].words;
    choicesBox.replaceChildren();
    const atEnd = dialogue.index === dialogue.lines.length - 1;
    nextLine.hidden = atEnd && dialogue.choices.length > 0;
    nextLine.textContent = atEnd ? "\u6536\u8D77" : "\u7EE7\u7EED";
    if (atEnd) for (const [index, choice] of dialogue.choices.entries()) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `${index + 1} \xB7 ${choice.label}`;
      button.addEventListener("click", () => chooseDialogue(index));
      choicesBox.append(button);
    }
  }
  function nearWaitingElder() {
    return actor.y > 640 && near(493, 655, 43) && Math.hypot(actor.x - 493, actor.y - 655) < Math.hypot(actor.x - qiaoActor.x, actor.y - qiaoActor.y);
  }
  function canHandBackBucket() {
    return modernReturn && !said("ly-unlocked") && gateAnswered && alleyReturnComplete(returnCheckpoint) && actor.y >= 646 && near(qiaoActor.x, qiaoActor.y, 64);
  }
  function handBackBucket() {
    if (!canHandBackBucket()) return;
    const completed = commitLiuyuanChapterFlag("ly-unlocked");
    if (completed.reason === "missing-previous") return;
    const height = Math.round(perspectiveScholarHeight(
      actor.y,
      ENTRY_ACTOR_SCALE.farFootY,
      ENTRY_ACTOR_SCALE.nearFootY,
      ENTRY_ACTOR_SCALE.farHeight,
      ENTRY_ACTOR_SCALE.nearHeight
    ) * actorScalePercent / 100);
    bucketHandover = { ...liuyuanBucketAnchor(actor.x, actor.y, height, actor.dir, true), height, elapsed: 0 };
    carryingBucket = false;
    keys.clear();
    pressed.clear();
    chapterComplete.hidden = false;
    updateChapterEcho();
    reset.textContent = "\u56DE\u5230\u95E8\u5916";
    document.getElementById("modeTitle").textContent = "\u4ECE\u7559\u56ED\u95E8\u5916\uFF0C\u56DE\u770B\u8FD9\u4E00\u7A0B";
    document.getElementById("modeIntro").textContent = "\u7A7A\u6876\u5DF2\u4EA4\u56DE\u4E54\u79BE\u3002\u53F6\u7247\u7559\u5728\u4F60\u8EAB\u8FB9\uFF0C\u56DE\u5E9C\u5B66\u6838\u4E00\u6838\u90A3\u4E00\u4E2A\u5B57\u3002";
    document.getElementById("modeNote").textContent = "\u672C\u7AE0\u5DF2\u7ED3\u7B97\u3002\u53EF\u56DE\u300A\u8607\u57CE\u5168\u5716\u300B\u6216\u7FFB\u770B\u56ED\u8C31\uFF1B\u5165\u53E3\u662F\u6E38\u620F\u5316\u573A\u666F\uFF0C\u4E0D\u5BF9\u5E94\u6E05\u672B\u539F\u95E8\u4F4D\u3002";
    showDialogue([
      { who: "\u89C2\u5BDF", words: "\u4F60\u628A\u53F6\u7247\u53D6\u51FA\u6536\u597D\uFF0C\u5C06\u7A7A\u6876\u9012\u7ED9\u4E54\u79BE\u3002\u5979\u63A5\u4F4F\u6876\u8033\uFF0C\u6401\u56DE\u62C5\u8FB9\u3002" },
      { who: "\u4E54\u79BE", words: "\u8FD9\u4E00\u8D9F\uFF0C\u591A\u8C22\u4F60\u3002\u7237\u7237\u8FD8\u5728\u7B49\u3002\u4F60\u6B47\u6B47\u518D\u8D70\u3002" },
      { who: "\u89C2\u5BDF", words: drawingChapterEcho(loadProgress().knowledge) }
    ]);
  }
  function interact() {
    if (dialogue) {
      if (dialogue.index < dialogue.lines.length - 1) dialogue.index++;
      else if (dialogue.choices.length === 0) dialogue = null;
      renderDialogue();
      return;
    }
    if (modernReturn) {
      if (canHandBackBucket()) {
        handBackBucket();
        return;
      }
      if (said("ly-unlocked") && nearWaitingElder()) {
        showDialogue([{ who: "\u4E54\u8001\u53DF", words: "\u6876\u56DE\u6765\u4E86\uFF1F\u597D\u3002\u6B47\u4E00\u6B47\uFF0C\u522B\u6025\u7740\u8D76\u4E0B\u4E00\u8D9F\u3002" }]);
        return;
      }
      if (!gateAnswered && near(520, 614, 40)) {
        showDialogue([
          { who: "\u95E8\u623F", words: "\u82B1\u623F\u7684\uFF1F\u6876\u600E\u4E48\u8F7B\u4E86\uFF1F" },
          { who: "\u89C2\u5BDF", words: "\u4ED6\u6401\u4E0B\u4FEE\u5230\u4E00\u534A\u7684\u706F\u7B3C\uFF0C\u773C\u775B\u843D\u5728\u6876\u4E0A\u3002" }
        ], [
          { label: "\u9012\u7ED9\u4ED6\u6382\u4E00\u6382", act: () => answerReturnGate("hand") },
          { label: "\u81EA\u5DF1\u6380\u5E03\u7ED9\u4ED6\u770B", act: () => answerReturnGate("show") }
        ]);
      } else showDialogue([{ who: "\u89C2\u5BDF", words: gateAnswered ? "\u95E8\u623F\u5DF2\u8BA9\u5F00\u3002\u518D\u8D70\u51E0\u6B65\uFF0C\u8857\u9762\u7684\u5149\u5C31\u5230\u4E86\u3002" : "\u6CBF\u540C\u4E00\u6761\u5939\u5F04\u5F80\u5916\u8D70\uFF0C\u5230\u95E8\u69DB\u524D\u518D\u8BF4\u8BDD\u3002" }]);
      return;
    }
    if (returnStudy) {
      showDialogue([{ who: "\u89C2\u5BDF", words: alleyReturnComplete(returnCheckpoint) ? "\u7A84\u5ECA\u7EC8\u4E8E\u653E\u5F00\uFF0C\u95E8\u5916\u7684\u5929\u5149\u8FCE\u8FC7\u6765\u3002" : "\u540C\u4E00\u6761\u7A84\u8DEF\uFF0C\u56DE\u5934\u8D70\u65F6\uFF0C\u5149\u4ECE\u8EAB\u540E\u8FFD\u4E0A\u6765\u3002" }]);
      return;
    }
    if (!said("ly-errand-offered") && near(493, 655, 43)) {
      showDialogue([
        { who: "\u89C2\u5BDF", words: "\u62C5\u5934\u6302\u7740\u4E00\u6839\u7AF9\u6886\u3002\u6572\u7684\u4EBA\u6CA1\u6572\u3002\u6876\u4E0A\u8499\u7684\u5E03\u662F\u65B0\u7684\uFF0C\u62C5\u5B50\u5374\u65E7\u3002" },
        { who: "\u4E54\u8001\u53DF", words: "\u963F\u79BE\u2014\u2014\u6876\uFF0C\u63D0\u7A33\u3002\u8FD9\u6761\u5939\u5F04\uFF0C\u6211\u8FDB\u53BB\u4E00\u8D9F\u5F97\u6B47\u4E24\u56DE\u3002\u7559\u56ED\uFF0C\u82B1\u623F\u7684\uFF0C\u8001\u4E3B\u987E\u4E86\u3002" },
        { who: "\u4E54\u79BE", words: "\u6211\u4E0D\u6562\u8FDB\u3002\u90A3\u4E2A\u4EBA\u95EE\u6211\u51E0\u5C81\u3002" }
      ], [
        { label: "\u6211\u66FF\u4F60\u63D0", act: () => {
          commitLiuyuanChapterFlag("ly-errand-offered");
          carryingBucket = carryingLiuyuanPorridge(loadProgress());
          showDialogue([{ who: "\u89C2\u5BDF", words: "\u62C5\u5B50\u7559\u5728\u5899\u6839\uFF0C\u7CA5\u6876\u63D0\u5728\u624B\u4E0A\u3002\u4E54\u79BE\u5411\u524D\u8D70\u4E86\u51E0\u6B65\uFF0C\u56DE\u5934\u7B49\u4F60\u3002" }]);
        } },
        { label: "\u8BA9\u963F\u79BE\u63D0", act: () => showDialogue([{ who: "\u4E54\u8001\u53DF", words: "\u5979\u63D0\u5F97\u52A8\u4E00\u6876\uFF0C\u63D0\u4E0D\u52A8\u4E00\u8DEF\u3002" }], [{ label: "\u6211\u6765\u63D0", act: () => {
          commitLiuyuanChapterFlag("ly-errand-offered");
          carryingBucket = carryingLiuyuanPorridge(loadProgress());
          showDialogue([{ who: "\u89C2\u5BDF", words: "\u4F60\u628A\u6876\u63D0\u5728\u624B\u4E0A\u3002\u4E54\u79BE\u5728\u524D\u9762\u7B49\u3002" }]);
        } }]) }
      ]);
      return;
    }
    if (said("ly-errand-offered") && !said("ly-huabu-seen") && !said("ly-gate-passed") && near(QIAO_GATE.x, QIAO_GATE.y, 32)) {
      showDialogue([
        { who: "\u4E54\u79BE", words: "\u8FDB\u5C0F\u95E8\uFF0C\u5341\u4E03\u6B65\uFF0C\u8F6C\u5F2F\u3002\u6211\u8DDF\u7237\u7237\u8D70\u8FC7\uFF0C\u8D70\u4E00\u6B21\u8BB0\u4E00\u6B21\u3002" },
        { who: "\u4E54\u79BE", words: "\u62C5\u5B50\u505C\u8FD9\u513F\u3002\u4EBA\u4ECE\u8FB9\u4E0A\u5C0F\u95E8\u8FDB\u3002\u4F60\u5F80\u91CC\u8D70\uFF0C\u6211\u56DE\u53BB\u770B\u62C5\u5B50\u3002" }
      ], [{ label: "\u63D0\u6876\u53BB\u5C0F\u95E8", act: () => {
        commitLiuyuanChapterFlag("ly-huabu-seen");
      } }]);
      return;
    }
    if (qiaoWaitsByBundle() && near(qiaoActor.x, qiaoActor.y, 32) && !nearWaitingElder()) {
      showDialogue([{ who: "\u4E54\u79BE", words: "\u4F60\u8D70\u4F60\u7684\uFF0C\u6211\u770B\u7740\u62C5\u5B50\u3002\u7A7A\u6876\u51FA\u6765\u65F6\uFF0C\u522B\u5FD8\u4E86\u8FD8\u6211\u3002" }]);
      return;
    }
    if (said("ly-errand-offered") && nearWaitingElder()) {
      showDialogue([{ who: "\u4E54\u8001\u53DF", words: "\u53BB\u5427\uFF0C\u62C5\u5B50\u6211\u5B88\u7740\u3002\u9001\u5230\u4E86\uFF0C\u628A\u7A7A\u6876\u5E26\u56DE\u6765\u3002" }]);
      return;
    }
    if (said("ly-huabu-seen") && !said("ly-gate-passed") && near(520, 614, 34)) {
      if (!said("ly-gate-clue")) {
        showDialogue([
          { who: "\u89C2\u5BDF", words: "\u95E8\u6D1E\u91CC\u7684\u4EBA\u5728\u4FEE\u4E00\u53EA\u706F\u7B3C\uFF0C\u773C\u775B\u6CA1\u62AC\u3002" },
          { who: "\u4E66\u751F", words: "\u6211\u60F3\u8FDB\u53BB\u3002" },
          { who: "\u95E8\u623F", words: "\u9001\u8D27\u7684\u8D70\u90A3\u8FB9\u3002" }
        ], [{ label: "\u9000\u5F00\u60F3\u60F3", act: () => {
          commitLiuyuanChapterFlag("ly-gate-clue");
        } }]);
      } else {
        showDialogue([{ who: "\u89C2\u5BDF", words: "\u8001\u53DF\u8BF4\u8FC7\uFF1A\u201C\u82B1\u623F\u7684\uFF0C\u8001\u4E3B\u987E\u4E86\u3002\u201D\u95E8\u623F\u4ECD\u4F4E\u5934\u4FEE\u706F\u7B3C\u3002" }], [
          { label: "\u6211\u7ED9\u82B1\u623F\u9001\u7CA5", act: () => passGate() },
          { label: "\u6211\u60F3\u8FDB\u53BB", act: () => showDialogue([{ who: "\u95E8\u623F", words: "\u9001\u8D27\u7684\u8D70\u90A3\u8FB9\u3002" }]) }
        ]);
      }
      return;
    }
    if (said("ly-gate-passed") && !said("ly-alley-walked") && near(430, 250, 28)) {
      alleyCheckpoint = LIUYUAN_ALLEY_CHECKPOINTS.length;
      showDialogue([{ who: "\u89C2\u5BDF", words: "\u8D70\u8FC7\u7A84\u5ECA\uFF0C\u5149\u5FFD\u7136\u677E\u5F00\u4E86\u4E00\u4E9B\u3002\u4F60\u628A\u6876\u653E\u5728\u811A\u8FB9\uFF0C\u76F4\u4E86\u76F4\u8170\u3002" }], [
        { label: "\u653E\u7A33\u6876\uFF0C\u6B47\u4E00\u53E3\u6C14", act: () => {
          commitLiuyuanChapterFlag("ly-alley-walked");
          bucketRestingAtExit = true;
          carryingBucket = false;
          showDialogue([{ who: "\u89C2\u5BDF", words: "\u5C0F\u5EAD\u5C31\u5728\u773C\u524D\uFF0C\u5899\u4E0A\u7684\u6F0F\u7A97\u8FD8\u672A\u770B\u6E05\u3002\u7CA5\u8FD8\u5F97\u9001\u5230\u82B1\u5320\u624B\u91CC\u3002" }], [
            { label: "\u518D\u63D0\u8D77\u6876\uFF0C\u6CBF\u5899\u5411\u897F", act: () => liftBucket() }
          ]);
        } }
      ]);
      return;
    }
    if (said("ly-alley-walked") && !bucketRestingAtExit && near(LIUYUAN_ENTRY_COURT_EXIT.x, LIUYUAN_ENTRY_COURT_EXIT.y, 22)) {
      enterCourt();
      return;
    }
    if (said("ly-alley-walked") && bucketRestingAtExit && near(430, 250, 28)) {
      showDialogue([{ who: "\u89C2\u5BDF", words: "\u5C0F\u5EAD\u5C31\u5728\u773C\u524D\uFF0C\u5899\u4E0A\u7684\u6F0F\u7A97\u8FD8\u672A\u770B\u6E05\u3002\u7CA5\u8FD8\u5F97\u9001\u5230\u82B1\u5320\u624B\u91CC\u3002" }], [
        { label: "\u63D0\u8D77\u6876\uFF0C\u6CBF\u5899\u5411\u897F", act: () => liftBucket() }
      ]);
      return;
    }
    if (said("ly-gate-passed") && !said("ly-alley-walked")) {
      showDialogue([{ who: "\u89C2\u5BDF", words: alleyDirectionHint() }]);
    }
  }
  function alleyDirectionHint() {
    if (near(430, 250, 28)) return "\u5230\u7A97\u524D\u7A7A\u5730\uFF0C\u653E\u7A33\u7CA5\u6876\u6B47\u4E00\u53E3\u6C14\uFF0C\u518D\u7EE7\u7EED\u9001\u5F80\u82B1\u623F\u3002";
    const next = LIUYUAN_ALLEY_CHECKPOINTS[actor.x < 466 ? actor.y < 324 ? 6 : 5 : actor.y < 424 ? 3 : actor.y < 504 ? 2 : actor.y < 574 ? 1 : 0];
    const dx = next.x - actor.x, dy = next.y - actor.y;
    const direction = Math.abs(dx) > Math.abs(dy) ? dx < 0 ? "\u5411\u5DE6" : "\u5411\u53F3" : dy < 0 ? "\u5411\u4E0A" : "\u5411\u4E0B";
    return `\u7CA5\u8FD8\u8981\u9001\u5230\u82B1\u623F\u3002\u6CBF\u811A\u4E0B\u77F3\u8DEF${direction}\u8D70\uFF0C\u7ECF\u8FC7${next.label}\u3002`;
  }
  function updateInteractionCue() {
    let label = "";
    if (!dialogue && !returnWalk) {
      if (!said("ly-errand-offered") && near(493, 655, 43)) label = "E \xB7 \u542C\u4E54\u8001\u53DF\u8BF4\u8BDD";
      else if (said("ly-errand-offered") && !said("ly-huabu-seen") && !said("ly-gate-passed") && near(QIAO_GATE.x, QIAO_GATE.y, 32)) label = "E \xB7 \u542C\u4E54\u79BE\u6307\u8DEF";
      else if (qiaoWaitsByBundle() && near(qiaoActor.x, qiaoActor.y, 32) && !nearWaitingElder()) label = "E \xB7 \u4E0E\u770B\u62C5\u5B50\u7684\u4E54\u79BE\u8BF4\u8BDD";
      else if (said("ly-errand-offered") && nearWaitingElder()) label = "E \xB7 \u4E0E\u62C5\u8FB9\u7684\u4E54\u8001\u53DF\u8BF4\u8BDD";
      else if (said("ly-huabu-seen") && !said("ly-gate-passed") && near(520, 614, 34)) label = "E \xB7 \u4E0E\u95E8\u623F\u5E94\u7B54";
      else if (said("ly-alley-walked") && !bucketRestingAtExit && near(LIUYUAN_ENTRY_COURT_EXIT.x, LIUYUAN_ENTRY_COURT_EXIT.y, 22)) label = "E \xB7 \u8F6C\u8FC7\u5899\u89D2\uFF0C\u8D70\u5165\u5C0F\u5EAD";
      else if (bucketRestingAtExit && near(430, 250, 28)) label = "E \xB7 \u63D0\u8D77\u7CA5\u6876";
      else if (!said("ly-alley-walked") && said("ly-gate-passed") && near(430, 250, 28)) label = "E \xB7 \u5728\u5C0F\u5EAD\u53E3\u6B47\u811A";
    } else if (!dialogue && canHandBackBucket()) {
      label = "E \xB7 \u628A\u7A7A\u6876\u4EA4\u8FD8\u4E54\u79BE";
    } else if (!dialogue && modernReturn && said("ly-unlocked") && nearWaitingElder()) {
      label = "E \xB7 \u4E0E\u62C5\u8FB9\u7684\u4E54\u8001\u53DF\u8BF4\u8BDD";
    } else if (!dialogue && modernReturn && !gateAnswered && near(520, 614, 40)) {
      label = "E \xB7 \u5411\u95E8\u623F\u4EA4\u4EE3\u7A7A\u6876";
    }
    interactionCue.hidden = !label;
    interactionCue.textContent = label;
    if (label) interactButton.textContent = label.replace(/^E · /, "");
    else interactButton.textContent = returnStudy ? "\u67E5\u770B" : "\u4EA4\u8C08 / \u67E5\u770B";
    if (!label && !dialogue && !returnWalk && said("ly-gate-passed") && !said("ly-alley-walked")) {
      interactionCue.hidden = false;
      interactionCue.textContent = alleyDirectionHint();
    }
  }
  function answerReturnGate(choice) {
    gateAnswered = true;
    returnCheckpoint = Math.max(returnCheckpoint, LIUYUAN_ALLEY_RETURN_CHECKPOINTS.length - 1);
    showDialogue([
      { who: "\u89C2\u5BDF", words: choice === "hand" ? "\u4ED6\u63A5\u8FC7\u7A7A\u6876\u6382\u4E86\u6382\uFF0C\u542C\u89C1\u6876\u5E95\u8F7B\u8F7B\u4E00\u54CD\uFF0C\u53C8\u9012\u56DE\u6765\u3002" : "\u4F60\u6380\u8D77\u6876\u5E03\u3002\u4ED6\u770B\u89C1\u6876\u5E95\u5DF2\u7A7A\uFF0C\u53EA\u628A\u706F\u7B3C\u5F80\u65C1\u8FB9\u632A\u4E86\u632A\u3002" },
      { who: "\u95E8\u623F", words: said("ly-rain-shadow-cleared") ? "\u7CA5\u9001\u5230\u4E86\u5C31\u597D\u3002\u4F60\u624B\u91CC\u8FD8\u591A\u4E86\u4E00\u9875\u5170\u7A3F\uFF1F\u82B1\u5320\u80AF\u9001\u4E1C\u897F\uFF0C\u5012\u96BE\u5F97\u3002" : said("ly-lantern-helped") ? "\u7CA5\u9001\u5230\u4E86\u5C31\u597D\u3002\u706F\u8FD8\u7A33\u7740\u5462\u3002\u8D70\u7F62\uFF0C\u522B\u6321\u7740\u95E8\u3002" : "\u7CA5\u9001\u5230\u4E86\u5C31\u597D\u3002\u8D70\u7F62\uFF0C\u522B\u6321\u7740\u95E8\u3002" }
    ]);
  }
  function liftBucket() {
    bucketRestingAtExit = false;
    carryingBucket = carryingLiuyuanPorridge(loadProgress());
    const notice = document.getElementById("resumeNotice");
    if (!notice.hidden) notice.textContent = "\u6876\u5DF2\u63D0\u8D77\uFF1B\u6CBF\u6F0F\u7A97\u5357\u4FA7\u7684\u77F3\u8DEF\u5411\u897F\u3002";
  }
  function enterCourt() {
    if (!said("ly-alley-walked") || bucketRestingAtExit || !near(LIUYUAN_ENTRY_COURT_EXIT.x, LIUYUAN_ENTRY_COURT_EXIT.y, 22)) return;
    leavingEntry = true;
    clearEntryResume(resumeSlot);
    location.assign(chapterSceneHref("liuyuan-court.html", params.get("draft") === "1"));
  }
  function trace(points) {
    ctx.beginPath();
    points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
  }
  function redrawBackgroundPolygon(points) {
    if (!background.complete || !background.naturalWidth) return;
    ctx.save();
    trace(points);
    ctx.clip();
    ctx.drawImage(background, 0, 0, 1008, 688);
    ctx.restore();
  }
  function drawDebug() {
    ctx.save();
    ctx.globalAlpha = 0.55;
    for (let y = 0; y < mapData.h; y++) for (let x = 0; x < mapData.w; x++) {
      const tile = mapData.map[y * mapData.w + x];
      if (tile === T.PATH || tile === T.CORR) {
        ctx.fillStyle = tile === T.CORR ? "#759a89" : "#b9a673";
        ctx.fillRect(x * 16, y * 16, 16, 16);
      } else if (tile === T.WATER) {
        ctx.fillStyle = "#567d87";
        ctx.fillRect(x * 16, y * 16, 16, 16);
      }
    }
    ctx.restore();
    ctx.fillStyle = "rgba(220, 66, 55, .7)";
    for (const shape of obstacles) {
      if ("x" in shape) ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
      else {
        ctx.beginPath();
        shape.points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.closePath();
        ctx.fill();
      }
    }
    for (const node of graph.nodes) {
      ctx.fillStyle = "#503d6a";
      ctx.fillRect(node.x - 2, node.y - 2, 4, 4);
    }
    const p = STANDARD_PLAYER_PROFILE;
    ctx.strokeStyle = "#bf3f81";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      actor.x - p.halfW + 0.5,
      actor.y - p.topInset + 0.5,
      p.halfW * 2 - 1,
      p.topInset - p.bottomInset - 1
    );
  }
  function draw() {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#ebe8df";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const cameraX = Math.round(entryCamera.x);
    const cameraY = Math.round(entryCamera.y);
    ctx.save();
    ctx.scale(ENTRY_ACTOR_SCALE.cameraZoom, ENTRY_ACTOR_SCALE.cameraZoom);
    ctx.translate(-cameraX, -cameraY);
    if (background.complete && background.naturalWidth) ctx.drawImage(background, 0, 0, 1008, 688);
    if (atmosphereStudyEnabled && atmosphereLayer.complete && atmosphereLayer.naturalWidth)
      ctx.drawImage(atmosphereLayer, 0, 0, 1008, 688);
    if (showTiles.checked) drawDebug();
    if (!returnStudy && said("ly-lantern-helped")) {
      ctx.fillStyle = "rgba(218, 170, 101, .12)";
      ctx.fillRect(557, 583, 22, 23);
      ctx.fillStyle = "rgba(232, 187, 111, .16)";
      ctx.fillRect(561, 588, 13, 14);
    }
    const people = [];
    if (!returnStudy && gateNpcs.complete && gateNpcs.naturalWidth) {
      people.push({ y: 655, draw: () => drawSeatedNpcAtFoot(0, 200, 456, 816, 493, 655, 52) });
      people.push({ y: 613, draw: () => drawSeatedNpcAtFoot(768, 106, 490, 822, 558, 613, 54) });
    }
    if (!returnStudy && qiao.complete && qiao.naturalWidth) people.push({ y: qiaoActor.y, draw: () => {
      drawQiaoAtFoot(qiaoActor.x, qiaoActor.y, qiaoActor.moving, qiaoActor.walkTime);
    } });
    for (const person of people.filter((person2) => person2.y <= actor.y)) person.draw();
    const actorHeight = Math.round(perspectiveScholarHeight(
      actor.y,
      ENTRY_ACTOR_SCALE.farFootY,
      ENTRY_ACTOR_SCALE.nearFootY,
      ENTRY_ACTOR_SCALE.farHeight,
      ENTRY_ACTOR_SCALE.nearHeight
    ) * actorScalePercent / 100);
    drawScholarGroundShadow(ctx, actor.x, actor.y, actorHeight);
    if (sprite.complete && sprite.naturalWidth) {
      const frame = actor.moving ? 1 + Math.floor(actor.walkTime * 6) % 2 : 0;
      drawScholarAtFoot(ctx, sprite, actor.dir, frame, actor.x, actor.y, actorHeight);
    } else {
      ctx.fillStyle = "#334e47";
      ctx.fillRect(actor.x - 7, actor.y - 30, 14, 30);
    }
    if (carryingBucket) drawLiuyuanPorridgeBucket(ctx, actor.x, actor.y, actorHeight, actor.dir, true);
    if (bucketRestingAtExit) drawLiuyuanPorridgeBucket(ctx, 455, 250, actorHeight, 0, false);
    if (bucketHandover) {
      const t = Math.min(1, bucketHandover.elapsed / 0.75), blend = t * t * (3 - 2 * t);
      const x = bucketHandover.x + (RETURNED_BUCKET.x - bucketHandover.x) * blend;
      const y = bucketHandover.y + (RETURNED_BUCKET.y - bucketHandover.y) * blend - 4 * Math.sin(Math.PI * t);
      drawLiuyuanPorridgeBucket(ctx, x, y, bucketHandover.height + (49 - bucketHandover.height) * blend, 0, false, false);
    } else if (modernReturn && said("ly-unlocked")) {
      drawLiuyuanPorridgeBucket(ctx, RETURNED_BUCKET.x, RETURNED_BUCKET.y, 49, 0, false);
    }
    for (const person of people.filter((person2) => person2.y > actor.y)) person.draw();
    for (const object of geometry) {
      const mask = object.occluder;
      if (!mask || actor.y >= mask.depthY) continue;
      for (const polygon of mask.polygons) redrawBackgroundPolygon(polygon);
    }
    ctx.restore();
  }
  var lastTime = 0;
  function tick(now) {
    const dt = Math.min(0.05, (now - (lastTime || now)) / 1e3);
    lastTime = now;
    if (bucketHandover) {
      bucketHandover.elapsed += dt;
      if (bucketHandover.elapsed >= 0.75) bucketHandover = null;
    }
    if (!returnStudy) {
      const target = modernReturn ? gateAnswered ? QIAO_RETURN_WAIT : QIAO_START : qiaoWaitsByBundle() ? QIAO_START : said("ly-errand-offered") ? QIAO_GATE : QIAO_START;
      const dx2 = target.x - qiaoActor.x;
      const dy2 = target.y - qiaoActor.y;
      const remaining = Math.hypot(dx2, dy2);
      qiaoActor.moving = remaining > 0.5;
      if (qiaoActor.moving) {
        const step = Math.min(remaining, 52 * dt);
        qiaoActor.x += dx2 / remaining * step;
        qiaoActor.y += dy2 / remaining * step;
        qiaoActor.walkTime += dt;
      }
    }
    const active = (dir) => keys.has(dir) || pressed.has(dir);
    const dx = Number(active("right")) - Number(active("left"));
    const dy = Number(active("down")) - Number(active("up"));
    actor.moving = !dialogue && !bucketHandover && (dx !== 0 || dy !== 0);
    if (actor.moving) {
      actor.dir = dy > 0 ? 0 : dy < 0 ? 3 : dx > 0 ? 2 : 1;
      actor.walkTime += dt;
      const unit = Math.hypot(dx, dy);
      const previous = { x: actor.x, y: actor.y };
      moveEntity(
        mapData.map,
        actor,
        dx / unit * 90 * dt,
        dy / unit * 90 * dt,
        mapData.w,
        mapData.h,
        obstacles,
        STANDARD_PLAYER_PROFILE
      );
      if (!returnWalk && !said("ly-gate-passed") && actor.y < (said("ly-errand-offered") ? 600 : 615)) {
        if (said("ly-errand-offered")) {
          commitLiuyuanChapterFlag("ly-gate-passed");
        } else {
          actor.x = previous.x;
          actor.y = previous.y;
          if (near(520, 615, 34)) {
            if (said("ly-huabu-seen")) interact();
            else showDialogue([{ who: "\u4E54\u79BE", words: "\u5148\u8FC7\u6765\u3002\u6211\u8BA4\u5F97\u8FD9\u9053\u5C0F\u95E8\uFF0C\u4F60\u542C\u6211\u8BF4\u3002" }]);
          }
        }
      }
      if (modernReturn && !gateAnswered && actor.y > 625) {
        actor.x = previous.x;
        actor.y = previous.y;
        if (near(520, 614, 40)) interact();
      }
      if (returnWalk) {
        const wasComplete = alleyReturnComplete(returnCheckpoint);
        returnCheckpoint = advanceAlleyReturnCheckpoint(returnCheckpoint, actor.x, actor.y);
        if (near(returnFinish.x, returnFinish.y, 10) && (!modernReturn || gateAnswered))
          returnCheckpoint = LIUYUAN_ALLEY_RETURN_CHECKPOINTS.length;
        if (!wasComplete && alleyReturnComplete(returnCheckpoint)) {
          if (modernReturn && canCompleteLiuyuanReturn(returnCheckpoint, gateAnswered)) {
            status.textContent = "\u4E54\u79BE\u5728\u62C5\u8FB9\u7B49\u4F60\u3002\u628A\u7A7A\u6876\u4EB2\u624B\u4EA4\u56DE\u53BB\uFF0C\u53F6\u7247\u7559\u5728\u8EAB\u8FB9\u3002";
          } else if (returnStudy) showDialogue([
            { who: "\u89C2\u5BDF", words: "\u7A84\u5ECA\u7EC8\u4E8E\u653E\u5F00\uFF0C\u95E8\u5916\u7684\u5929\u5149\u8FCE\u8FC7\u6765\u3002" }
          ]);
        }
      } else if (said("ly-gate-passed") && !said("ly-alley-walked")) {
        alleyCheckpoint = advanceAlleyCheckpoint(alleyCheckpoint, actor.x, actor.y);
        if (near(430, 250, 22)) {
          alleyCheckpoint = LIUYUAN_ALLEY_CHECKPOINTS.length;
          interact();
        }
      }
    }
    const atGoal = near(LIUYUAN_ENTRY_COURT_EXIT.x, LIUYUAN_ENTRY_COURT_EXIT.y, 22);
    if (modernReturn) status.textContent = hasStoryFlag(loadProgress(), "ly-unlocked") ? "\u5DF2\u4ECE\u95E8\u5916\u8D70\u51FA\uFF0C\u7559\u56ED\u7AE0\u5B8C\u6210\u3002" : canHandBackBucket() ? "\u4E54\u79BE\u5728\u62C5\u8FB9\u7B49\u7740\u3002\u6309 E \u6216\u4EA4\u8C08\uFF0C\u628A\u7A7A\u6876\u4EA4\u8FD8\u5979\u3002" : gateAnswered ? "\u95E8\u623F\u5DF2\u8BA9\u5F00\u3002\u518D\u8D70\u5230\u8857\u9762\u3002" : returnCheckpoint >= LIUYUAN_ALLEY_RETURN_CHECKPOINTS.length - 1 ? "\u95E8\u69DB\u5185\uFF0C\u505C\u6B65\u4E0E\u95E8\u623F\u8BF4\u8BDD\u3002" : "\u63D0\u7740\u7A7A\u6876\u6CBF\u5939\u5F04\u8FD4\u56DE\uFF1B\u95E8\u5916\u8FD8\u6709\u4E54\u79BE\u3002";
    else if (returnStudy) status.textContent = alleyReturnComplete(returnCheckpoint) ? "\u4F60\u5DF2\u6CBF\u5939\u5F04\u56DE\u5230\u95E8\u5916\uFF1B\u6B64\u5904\u5C1A\u4E0D\u662F\u6B63\u5F0F\u51FA\u56ED\u3002" : "\u4ECE\u5C0F\u5EAD\u6298\u56DE\u5939\u5F04\uFF0C\u4EB2\u81EA\u8D70\u8FC7\u7A84\u5904\uFF0C\u518D\u5230\u95E8\u5916\u3002";
    else if (atGoal) status.textContent = said("ly-alley-walked") && !bucketRestingAtExit ? "\u8F6C\u89D2\u5230\u4E86\u3002\u6309 E \u6216\u70B9\u6309\u94AE\uFF0C\u6CBF\u77F3\u8DEF\u8D70\u5165\u5C0F\u5EAD\u3002" : bucketRestingAtExit ? "\u7CA5\u6876\u8FD8\u5728\u7A97\u524D\u3002\u5148\u56DE\u53BB\u63D0\u8D77\uFF0C\u518D\u7EE7\u7EED\u9001\u7CA5\u3002" : "\u5899\u6839\u6709\u98CE\uFF0C\u8FDC\u5904\u50CF\u6709\u6C34\u58F0\u3002";
    else if (!said("ly-errand-offered")) status.textContent = "\u5899\u6839\u7684\u65E7\u62C5\u5B50\u8FD8\u5728\uFF0C\u4E54\u8001\u53DF\u62AC\u773C\u770B\u4F60\u3002";
    else if (!said("ly-huabu-seen") && !said("ly-gate-passed")) status.textContent = "\u4E54\u79BE\u5728\u95E8\u5916\u7B49\u5019\u3002\u53EF\u4EE5\u95EE\u8DEF\uFF0C\u4E5F\u53EF\u4EE5\u76F4\u63A5\u63D0\u6876\u8FDB\u95E8\u3002";
    else if (!said("ly-gate-passed")) status.textContent = "\u95E8\u623F\u6CA1\u6709\u62AC\u5934\uFF0C\u624B\u91CC\u90A3\u53EA\u706F\u7B3C\u8FD8\u6CA1\u624E\u5B8C\u3002";
    else if (alleyWalkComplete(alleyCheckpoint) && !said("ly-alley-walked")) status.textContent = "\u811A\u8FB9\u6709\u5904\u7A7A\u5730\uFF0C\u6876\u6CBF\u8F7B\u8F7B\u78D5\u5728\u77F3\u4E0A\u3002";
    else if (said("ly-alley-walked") && near(430, 250, 28)) status.textContent = bucketRestingAtExit ? "\u6876\u8FD8\u653E\u5728\u811A\u8FB9\u3002\u63D0\u8D77\u540E\uFF0C\u6CBF\u6F0F\u7A97\u5357\u4FA7\u7684\u77F3\u8DEF\u5411\u897F\u3002" : "\u6876\u63D0\u7A33\u4E86\u3002\u6CBF\u5899\u5411\u897F\uFF0C\u8F6C\u89D2\u5904\u7684\u77F3\u8DEF\u63A5\u7740\u5F80\u91CC\u3002";
    else status.textContent = alleyCheckpoint < 2 ? "\u8EAB\u540E\u7684\u8BF4\u8BDD\u58F0\u6E10\u8FDC\uFF0C\u811A\u4E0B\u77F3\u8DEF\u4ECD\u7A84\u3002" : alleyCheckpoint < 4 ? "\u5ECA\u5B50\u628A\u5929\u5149\u538B\u4F4E\u4E86\uFF0C\u8F6C\u89D2\u5904\u6709\u4E00\u7EBF\u4EAE\u3002" : alleyCheckpoint < 6 ? "\u5899\u5916\u6709\u53F6\u5F71\u52A8\uFF0C\u6876\u91CC\u7684\u7CA5\u8FD8\u6E29\u7740\u3002" : "\u8DEF\u5FFD\u7136\u5BBD\u4E86\u4E00\u70B9\uFF0C\u98CE\u4ECE\u524D\u9762\u8FDB\u6765\u3002";
    updateInteractionCue();
    const cameraTarget = entryCameraForFoot(actor.x, actor.y);
    const cameraEase = 1 - Math.exp(-8 * dt);
    entryCamera.x += (cameraTarget.x - entryCamera.x) * cameraEase;
    entryCamera.y += (cameraTarget.y - entryCamera.y) * cameraEase;
    entryCamera.beat = cameraTarget.beat;
    coords.hidden = !showTiles.checked;
    if (showTiles.checked) coords.textContent = `\u811A\u70B9 (${Math.round(actor.x)}, ${Math.round(actor.y)}) \xB7 \u53D6\u666F ${entryCamera.beat}`;
    if (now - lastResumeWrite >= 250) {
      saveEntryResume();
      lastResumeWrite = now;
    }
    draw();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  if (params.get("minigame") === "rain-shadow") location.assign(chapterSceneHref("liuyuan-flower.html", params.get("draft") === "1") + "&minigame=rain-shadow");
})();
