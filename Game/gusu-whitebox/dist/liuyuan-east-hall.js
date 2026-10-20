"use strict";
(() => {
  // src/core/geometry.ts
  var STANDARD_PLAYER_PROFILE = {
    halfW: 4,
    topInset: 6,
    bottomInset: 1
  };

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

  // src/core/scene-validation.ts
  function unreachableSceneFeet(scene2, targets, profile, step = 4) {
    if (!targets.length) return [];
    if (collides(
      scene2.map,
      scene2.spawn.x,
      scene2.spawn.y,
      scene2.w,
      scene2.h,
      scene2.obstacles ?? [],
      profile
    )) return targets.map((target) => target.id);
    const remaining = new Map(targets.map((target) => [target.id, target]));
    const blockedFeet = targets.filter((target) => target.mustStand && collides(
      scene2.map,
      target.x,
      target.y,
      scene2.w,
      scene2.h,
      scene2.obstacles ?? [],
      profile
    )).map((target) => target.id);
    if (blockedFeet.length) return blockedFeet;
    const queue = [[scene2.spawn.x, scene2.spawn.y]];
    const visited = /* @__PURE__ */ new Set([`${scene2.spawn.x},${scene2.spawn.y}`]);
    const worldW = scene2.w * 16, worldH = scene2.h * 16;
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
          scene2.map,
          nextX,
          nextY,
          scene2.w,
          scene2.h,
          scene2.obstacles ?? [],
          profile
        )) continue;
        visited.add(key);
        queue.push([nextX, nextY]);
      }
    }
    return [...remaining.keys()];
  }
  function validateTileScene(id, scene2, profile) {
    const errors = [];
    if (!Number.isInteger(scene2.w) || !Number.isInteger(scene2.h) || scene2.w <= 0 || scene2.h <= 0) {
      errors.push(`${id}: \u5730\u56FE\u5BBD\u9AD8\u5FC5\u987B\u4E3A\u6B63\u6574\u6570`);
    }
    if (scene2.map.length !== scene2.w * scene2.h) {
      errors.push(`${id}: map.length \u4E0E w \xD7 h \u4E0D\u4E00\u81F4`);
    }
    if (profile.halfW <= 0 || profile.bottomInset < 0 || profile.topInset <= profile.bottomInset) {
      errors.push(`${id}: \u4EBA\u7269\u811A\u5E95\u76D2\u65E0\u6548`);
    }
    if (collides(
      scene2.map,
      scene2.spawn.x,
      scene2.spawn.y,
      scene2.w,
      scene2.h,
      scene2.obstacles ?? [],
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
        const scene2 = buildMap(data.tileRegions);
        const obstacles2 = geometry2.flatMap((object) => object.colliders ?? []);
        if (validateTileScene(sceneId, { ...scene2, obstacles: obstacles2 }, STANDARD_PLAYER_PROFILE).length) continue;
        if (unreachableSceneFeet({ ...scene2, obstacles: obstacles2 }, requiredFeet, STANDARD_PLAYER_PROFILE).length) continue;
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
  function modernRouteHref(page, from, draft2 = false, returning = false) {
    const query = new URLSearchParams({ route: "modern", from });
    if (draft2) query.set("draft", "1");
    if (returning) query.set("return", "1");
    carryLiuyuanPlaytest(query);
    return `${page}?${query}`;
  }
  function canEnterModernReturn(search, progress, from, prerequisite) {
    const query = new URLSearchParams(search);
    return query.get("return") === "1" && canEnterModernRoute(search, progress, from, prerequisite);
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

  // src/core/liuyuan-view-memory.ts
  function chapterSceneHref(page, draft2 = false) {
    const query = new URLSearchParams({ chapter: "1" });
    if (draft2) query.set("draft", "1");
    carryLiuyuanPlaytest(query);
    return `${page}?${query}`;
  }

  // src/data/liuyuan-east-hall-study.ts
  var LIUYUAN_EAST_HALL_ID = "liuyuan-east-hall-magnolia-court-study-v1";
  var LIUYUAN_EAST_HALL_W = 111;
  var LIUYUAN_EAST_HALL_H = 56;
  var LIUYUAN_EAST_HALL_WORLD_W = 1776;
  var LIUYUAN_EAST_HALL_WORLD_H = 896;
  var LIUYUAN_EAST_HALL_SPAWN = { x: 385, y: 575 };
  var LIUYUAN_EAST_HALL_LEFT_TREE = { x: 515, y: 460 };
  var LIUYUAN_EAST_HALL_RIGHT_TREE = { x: 1390, y: 505 };
  var LIUYUAN_EAST_HALL_CENTER = { x: 970, y: 540 };
  var LIUYUAN_EAST_HALL_DOOR = { x: 980, y: 380 };
  var LIUYUAN_EAST_HALL_EAST_EXIT = { x: 1675, y: 475 };
  var COURT = [
    [105, 388],
    [320, 385],
    [735, 370],
    [1210, 365],
    [1595, 390],
    [1776, 425],
    [1776, 896],
    [230, 896],
    [140, 715],
    [105, 510]
  ];
  var EAST_PASSAGE = [
    [1580, 260],
    [1776, 255],
    [1776, 610],
    [1560, 590]
  ];
  function inside(x, y, points) {
    let result = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i], [xj, yj] = points[j];
      if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) result = !result;
    }
    return result;
  }
  function bands(id, points, tile) {
    const result = [];
    for (let y = 0; y < LIUYUAN_EAST_HALL_H; y++) {
      let first = -1;
      for (let x = 0; x <= LIUYUAN_EAST_HALL_W; x++) {
        const open = x < LIUYUAN_EAST_HALL_W && inside(x * 16 + 8, y * 16 + 8, points);
        if (open && first < 0) first = x;
        if (!open && first >= 0) {
          result.push({ id: `${id}-${y}-${first}`, x: first, y, w: x - first, h: 1, tile });
          first = -1;
        }
      }
    }
    return result;
  }
  var LIUYUAN_EAST_HALL_DRAFT_REGIONS = [
    ...bands("east-hall-court", COURT, T.PATH),
    ...bands("east-hall-side-passage", EAST_PASSAGE, T.CORR)
  ];
  var LIUYUAN_EAST_HALL_GEOMETRY = [
    { id: "east-hall-left-tree-bed", colliders: [{ points: [[305, 345], [690, 340], [730, 423], [685, 480], [310, 466]] }] },
    { id: "east-hall-right-tree-bed", colliders: [{ points: [[1240, 350], [1555, 355], [1590, 505], [1220, 512]] }] },
    { id: "east-hall-side-work-shelf", colliders: [{ x: 15, y: 270, w: 260, h: 120 }] },
    { id: "east-hall-front-steps", colliders: [
      { x: 810, y: 315, w: 20, h: 78 },
      { x: 1155, y: 315, w: 25, h: 80 }
    ] },
    { id: "east-hall-left-crown", occluder: {
      id: "east-hall-left-crown",
      depthY: 455,
      polygons: [[[315, 70], [475, 18], [680, 10], [770, 105], [765, 280], [700, 340], [575, 305], [475, 350], [350, 300]]]
    } },
    { id: "east-hall-right-crown", occluder: {
      id: "east-hall-right-crown",
      depthY: 495,
      polygons: [[[1155, 45], [1325, 5], [1500, 10], [1635, 150], [1585, 330], [1470, 380], [1290, 350], [1190, 270]]]
    } },
    { id: "east-hall-foreground-left-eave", occluder: {
      id: "east-hall-foreground-left-eave",
      depthY: 895,
      polygons: [[[0, 625], [220, 615], [350, 896], [0, 896]]]
    } },
    { id: "east-hall-foreground-right-eave", occluder: {
      id: "east-hall-foreground-right-eave",
      depthY: 895,
      polygons: [[[1590, 665], [1776, 620], [1776, 896], [1610, 896]]]
    } }
  ];
  var LIUYUAN_EAST_HALL_OBSTACLES = LIUYUAN_EAST_HALL_GEOMETRY.flatMap((object) => object.colliders ?? []);
  function buildLiuyuanEastHallStudyMap(regions = LIUYUAN_EAST_HALL_DRAFT_REGIONS) {
    const map = new Uint8Array(LIUYUAN_EAST_HALL_W * LIUYUAN_EAST_HALL_H);
    map.fill(T.WALL);
    for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_EAST_HALL_W && y < LIUYUAN_EAST_HALL_H) map[y * LIUYUAN_EAST_HALL_W + x] = region.tile;
    }
    return {
      map,
      w: LIUYUAN_EAST_HALL_W,
      h: LIUYUAN_EAST_HALL_H,
      spawn: { ...LIUYUAN_EAST_HALL_SPAWN },
      obstacles: LIUYUAN_EAST_HALL_OBSTACLES
    };
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

  // src/liuyuan-east-hall.ts
  var canvas = document.getElementById("scene");
  var ctx = canvas.getContext("2d");
  var status = document.getElementById("status");
  var stageNote = document.getElementById("stageNote");
  var showGeometry = document.getElementById("showGeometry");
  var coords = document.getElementById("coords");
  var reset = document.getElementById("reset");
  var lookButton = document.getElementById("look");
  var continueChapter = document.getElementById("continueChapter");
  var toFlowerReturn = document.getElementById("toFlowerReturn");
  var routeNotice = document.getElementById("routeNotice");
  var backToFlower = document.getElementById("backToFlower");
  var modeBadge = document.getElementById("modeBadge");
  var interactionCue = document.getElementById("interactionCue");
  var sceneMessage = document.getElementById("sceneMessage");
  var modernChapter = canEnterModernRoute(location.search, loadProgress(), "flower", "ly-porridge-delivered");
  var modernReturn = canEnterModernReturn(location.search, loadProgress(), "stone-forest", "ly-leaf-written");
  if (modernChapter) {
    modeBadge.textContent = "\u7559\u56ED \xB7 \u5802\u524D\u5BFB\u4EBA";
    document.getElementById("editorLink").hidden = true;
    document.getElementById("toolSeparator").hidden = true;
    routeNotice.textContent = "\u7559\u56ED\u7AE0 \xB7 \u4F9D\u5F53\u4EE3\u5BFC\u89C8\u6E38\u7EBF\u526A\u63A5\uFF1B\u8FD9\u5EA7\u5802\u524D\u53CC\u6811\u9662\u53CA\u95E8\u4F4D\u4E3A\u6E38\u620F\u5408\u6210\uFF0C\u4E0D\u662F\u5386\u53F2\u6216\u73B0\u72B6\u5B9E\u6D4B\u3002";
  }
  if (modernReturn) {
    modeBadge.textContent = "\u7559\u56ED \xB7 \u8FD4\u7A0B \xB7 \u5802\u524D";
    routeNotice.textContent = "\u7531\u77F3\u6797\u5411\u897F\u56DE\u5802\u524D\u9662\uFF0C\u518D\u5F80\u82B1\u6728\u4F5C\u4E1A\u9662\u3002\u4E24\u682A\u4E54\u6728\u53CA\u5176\u682A\u4F4D\u5C5E\u4E8E\u6E38\u620F\u8BBE\u8BA1\uFF1B\u6B64\u5904\u4E0D\u662F\u6E05\u672B\u6216\u5F53\u4EE3\u7684\u5B9E\u6D4B\u95E8\u8DEF\u3002";
    backToFlower.hidden = true;
    document.getElementById("sceneTools").hidden = true;
  }
  stageNote.hidden = modernChapter || modernReturn;
  var previewRequested = new URLSearchParams(location.search).get("draft") === "1";
  if (modernChapter) backToFlower.href = chapterSceneHref("liuyuan-flower.html", previewRequested);
  else if (previewRequested) backToFlower.href = "liuyuan-flower.html?chapter=1&draft=1";
  var draft = readScenePlateDraft(
    LIUYUAN_EAST_HALL_ID,
    LIUYUAN_EAST_HALL_WORLD_W,
    LIUYUAN_EAST_HALL_WORLD_H,
    buildLiuyuanEastHallStudyMap
  );
  var actorHeight = Math.round(LIUYUAN_CHARACTER_SCALE.eastHall.worldHeight * (draft?.actorScalePercent ?? 100) / 100);
  var scene = buildLiuyuanEastHallStudyMap(draft?.regions ?? LIUYUAN_EAST_HALL_DRAFT_REGIONS);
  var geometry = draft?.geometry ?? LIUYUAN_EAST_HALL_GEOMETRY;
  var obstacles = geometry.flatMap((object) => object.colliders ?? []);
  var actor = {
    ...modernReturn ? LIUYUAN_EAST_HALL_EAST_EXIT : LIUYUAN_EAST_HALL_SPAWN,
    dir: modernReturn ? 1 : 2,
    moving: false,
    walkTime: 0
  };
  var keys = /* @__PURE__ */ new Set();
  var pressed = /* @__PURE__ */ new Set();
  var lastTime = 0;
  var art = new Image();
  var pixelArt = document.createElement("canvas");
  pixelArt.width = 888;
  pixelArt.height = 448;
  var pixelCtx = pixelArt.getContext("2d");
  var pixelArtReady = false;
  art.addEventListener("load", () => {
    pixelCtx.imageSmoothingEnabled = true;
    pixelCtx.drawImage(art, 0, 0, 888, 448);
    pixelArtReady = true;
  });
  art.src = "../assets/scene25d/liuyuan-east-hall-magnolia-court-study-v1.png";
  var sprite = new Image();
  sprite.src = "../assets/characters/scholar-player-sprites-v1.png";
  var seen = { left: false, right: false };
  var mayContinue = () => modernChapter && hasStoryFlag(loadProgress(), "ly-porridge-delivered") && near(LIUYUAN_EAST_HALL_EAST_EXIT, 120);
  var mayReturnToFlower = () => modernReturn && near(LIUYUAN_EAST_HALL_SPAWN, 95);
  continueChapter.addEventListener("click", () => {
    if (mayContinue()) location.assign(modernRouteHref("liuyuan-stone-forest.html", "east-hall", previewRequested));
  });
  toFlowerReturn.addEventListener("click", () => {
    if (mayReturnToFlower()) location.assign(modernRouteHref("liuyuan-flower.html", "east-hall", previewRequested, true));
  });
  function near(point, r) {
    return Math.hypot(actor.x - point.x, actor.y - point.y) < r;
  }
  function showSceneMessage(words) {
    sceneMessage.textContent = words;
    sceneMessage.hidden = false;
  }
  function inspectTree(side) {
    seen[side] = true;
    const both = seen.left && seen.right;
    const heardFlorist = hasStoryFlag(loadProgress(), "ly-florist-met");
    if (modernChapter) commitLiuyuanChapterFlag("ly-magnolia-seen");
    const clue = heardFlorist ? "\u82DE\u5C16\u76F4\u7ACB\uFF0C\u50CF\u4E00\u652F\u5C1A\u672A\u843D\u7EB8\u7684\u7B14\u3002\u82B1\u5320\u8BF4\u7684\u201C\u7B14\u6811\u201D\uFF0C\u4E5F\u8BB8\u5C31\u662F\u8FD9\u6837\u7684\u3002" : "\u82DE\u5C16\u76F4\u7ACB\uFF0C\u50CF\u4E00\u652F\u5C1A\u672A\u843D\u7EB8\u7684\u7B14\u3002\u4F60\u8BB0\u4F4F\u8FD9\u4E2A\u6A21\u6837\uFF0C\u4ECD\u4E0D\u77E5\u9053\u770B\u4E66\u7684\u4EBA\u5728\u54EA\u95F4\u5C4B\u91CC\u3002";
    status.textContent = both ? "\u53E6\u4E00\u4FA7\u7684\u82DE\u5C16\u4E5F\u4E00\u6837\u3002\u6811\u7684\u5F62\u72B6\u76F8\u540C\uFF0C\u4E0D\u80FD\u51ED\u5B83\u65AD\u5B9A\u54EA\u95F4\u662F\u4E66\u623F\u3002\u5385\u5802\u91CC\u5F88\u9759\uFF0C\u4E1C\u5ECA\u8FD8\u901A\u5411\u522B\u5904\u3002" : `${clue} \u5385\u5802\u91CC\u5F88\u9759\uFF0C\u4E1C\u5ECA\u8FD8\u901A\u5411\u522B\u5904\u3002`;
    showSceneMessage(status.textContent);
  }
  function interact() {
    if (modernReturn) {
      status.textContent = mayReturnToFlower() ? "\u6765\u65F6\u7684\u9662\u8DEF\u5230\u4E86\u3002\u5F80\u897F\u56DE\u82B1\u6728\u9662\uFF0C\u6A90\u4E0B\u7684\u7A7A\u6876\u8FD8\u7B49\u7740\u4F60\u3002" : "\u4E24\u682A\u6811\u4ECD\u5728\u5802\u524D\u3002\u6CBF\u4E2D\u95F4\u77F3\u8DEF\u5F80\u897F\u8D70\uFF0C\u4E0D\u8E0F\u8FDB\u6811\u6C60\u3002";
      return;
    }
    if (near(LIUYUAN_EAST_HALL_LEFT_TREE, 125)) {
      inspectTree("left");
      return;
    }
    if (near(LIUYUAN_EAST_HALL_RIGHT_TREE, 130)) {
      inspectTree("right");
      return;
    }
    if (near(LIUYUAN_EAST_HALL_DOOR, 95)) {
      status.textContent = "\u95E8\u6A90\u4E0B\u5F88\u9759\uFF0C\u6CA1\u6709\u7FFB\u7EB8\u58F0\u3002\u8FD9\u91CC\u66F4\u50CF\u5F85\u5BA2\u7684\u5385\u5802\uFF1B\u4F60\u8981\u627E\u7684\u4EBA\u6216\u8BB8\u4ECD\u5728\u4E1C\u8FB9\u3002";
      return;
    }
    if (near(LIUYUAN_EAST_HALL_EAST_EXIT, 120)) {
      status.textContent = mayContinue() ? "\u5ECA\u5B50\u5411\u4E1C\u53C8\u6298\u4E86\u4E00\u6B21\uFF0C\u77F3\u5F71\u6321\u4F4F\u4E86\u540E\u9762\u7684\u9662\u5B50\u3002\u4F60\u53EF\u4EE5\u7ED5\u8FC7\u53BB\u770B\u770B\u3002" : "\u8FD9\u8D9F\u7CA5\u8FD8\u6CA1\u6709\u9001\u5230\u3002\u5148\u56DE\u6A90\u4E0B\u653E\u59A5\u7CA5\u6876\u3002";
      return;
    }
    if (near(LIUYUAN_EAST_HALL_CENTER, 135)) {
      status.textContent = "\u77F3\u8DEF\u4ECE\u4E24\u68F5\u6811\u4E4B\u95F4\u7A7F\u8FC7\u3002\u5385\u95E8\u5B89\u9759\uFF0C\u4E1C\u8FB9\u8FD8\u6709\u4E00\u6298\u5ECA\u5B50\u3002";
      return;
    }
    status.textContent = "\u9662\u91CC\u4E24\u8FB9\u90FD\u6709\u6811\u3002\u5148\u6CBF\u77F3\u8DEF\u8D70\u8FD1\u770B\u770B\u3002";
  }
  var directions = { arrowup: "up", w: "up", arrowdown: "down", s: "down", arrowleft: "left", a: "left", arrowright: "right", d: "right" };
  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key === "e") {
      event.preventDefault();
      if (!event.repeat) interact();
      return;
    }
    const dir = directions[key];
    if (dir) {
      event.preventDefault();
      keys.add(dir);
    }
  });
  window.addEventListener("keyup", (event) => {
    const dir = directions[event.key.toLowerCase()];
    if (dir) keys.delete(dir);
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
    button.addEventListener("pointerup", () => pressed.delete(dir));
    button.addEventListener("pointercancel", () => pressed.delete(dir));
    button.addEventListener("lostpointercapture", () => pressed.delete(dir));
  }
  lookButton.addEventListener("click", interact);
  reset.addEventListener("click", () => {
    actor.x = modernReturn ? LIUYUAN_EAST_HALL_EAST_EXIT.x : LIUYUAN_EAST_HALL_SPAWN.x;
    actor.y = modernReturn ? LIUYUAN_EAST_HALL_EAST_EXIT.y : LIUYUAN_EAST_HALL_SPAWN.y;
    actor.dir = modernReturn ? 1 : 2;
    keys.clear();
    pressed.clear();
    sceneMessage.hidden = true;
    status.textContent = modernReturn ? "\u4F60\u56DE\u5230\u4E1C\u4FA7\u8F6C\u89D2\uFF0C\u518D\u6CBF\u5802\u524D\u77F3\u8DEF\u5F80\u897F\u8D70\u3002" : "\u4F60\u9000\u56DE\u897F\u4FA7\u77F3\u8DEF\uFF0C\u5385\u5802\u4ECD\u5728\u6811\u540E\u3002";
  });
  function drawGeometry() {
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let y = 0; y < scene.h; y++) for (let x = 0; x < scene.w; x++) {
      const tile = scene.map[y * scene.w + x];
      if ([T.PATH, T.CORR, T.PLAT, T.WATER].includes(tile)) {
        ctx.fillStyle = tile === T.WATER ? "#4c8dff" : tile === T.CORR ? "#27bfc2" : tile === T.PLAT ? "#f4d35e" : "#52d879";
        ctx.fillRect(x * 16, y * 16, 16, 16);
      }
    }
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = "#ef5350";
    for (const object of geometry) for (const shape of object.colliders ?? []) {
      ctx.beginPath();
      if ("x" in shape) ctx.rect(shape.x, shape.y, shape.w, shape.h);
      else shape.points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    for (const object of geometry) for (const polygon of object.occluder?.polygons ?? []) {
      ctx.beginPath();
      polygon.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
      ctx.strokeStyle = "#35d8e6";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    const p = STANDARD_PLAYER_PROFILE;
    ctx.strokeStyle = "#ff64a8";
    ctx.lineWidth = 1;
    ctx.strokeRect(actor.x - p.halfW, actor.y - p.topInset, p.halfW * 2, p.topInset - p.bottomInset);
  }
  function draw() {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#c6c6b9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const zoom = LIUYUAN_CHARACTER_SCALE.eastHall.cameraZoom, viewW = canvas.width / zoom, viewH = canvas.height / zoom;
    const cameraX = Math.max(0, Math.min(LIUYUAN_EAST_HALL_WORLD_W - viewW, actor.x - viewW * 0.5));
    const cameraY = Math.max(0, Math.min(LIUYUAN_EAST_HALL_WORLD_H - viewH, actor.y - viewH * 0.78));
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-Math.round(cameraX), -Math.round(cameraY));
    if (art.complete && art.naturalWidth) ctx.drawImage(pixelArtReady ? pixelArt : art, 0, 0, LIUYUAN_EAST_HALL_WORLD_W, LIUYUAN_EAST_HALL_WORLD_H);
    drawScholarGroundShadow(ctx, actor.x, actor.y, actorHeight);
    if (sprite.complete && sprite.naturalWidth) {
      const frame = actor.moving ? 1 + Math.floor(actor.walkTime * 6) % 2 : 0;
      drawScholarAtFoot(ctx, sprite, actor.dir, frame, actor.x, actor.y, actorHeight);
    } else {
      ctx.fillStyle = "#344e44";
      ctx.fillRect(actor.x - 6, actor.y - 38, 12, 38);
    }
    if (art.complete && art.naturalWidth) for (const object of geometry) {
      const occluder = object.occluder;
      if (!occluder || actor.y >= occluder.depthY) continue;
      ctx.save();
      ctx.beginPath();
      for (const polygon of occluder.polygons) {
        polygon.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.closePath();
      }
      ctx.clip();
      ctx.drawImage(pixelArtReady ? pixelArt : art, 0, 0, LIUYUAN_EAST_HALL_WORLD_W, LIUYUAN_EAST_HALL_WORLD_H);
      ctx.restore();
    }
    if (showGeometry.checked) drawGeometry();
    ctx.restore();
  }
  function tick(now) {
    const dt = Math.min(0.05, (now - (lastTime || now)) / 1e3);
    lastTime = now;
    const active = (dir) => keys.has(dir) || pressed.has(dir);
    const dx = Number(active("right")) - Number(active("left")), dy = Number(active("down")) - Number(active("up"));
    actor.moving = dx !== 0 || dy !== 0;
    if (actor.moving) {
      sceneMessage.hidden = true;
      actor.dir = dy > 0 ? 0 : dy < 0 ? 3 : dx > 0 ? 2 : 1;
      actor.walkTime += dt;
      const length = Math.hypot(dx, dy);
      moveEntity(scene.map, actor, dx / length * 95 * dt, dy / length * 95 * dt, scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE);
    }
    stageNote.textContent = modernReturn ? "\u8D70\u56DE\u5802\u524D\u897F\u4FA7\uFF0C\u4E0D\u8E0F\u6811\u6C60\u3002" : near(LIUYUAN_EAST_HALL_LEFT_TREE, 150) || near(LIUYUAN_EAST_HALL_RIGHT_TREE, 150) ? "\u6811\u6839\u5728\u571F\u91CC\uFF0C\u77F3\u8FB9\u53EF\u4EE5\u505C\u6B65\uFF1B\u522B\u8E0F\u8FDB\u6811\u6C60\u3002" : near(LIUYUAN_EAST_HALL_DOOR, 125) ? "\u5385\u95E8\u5728\u6811\u540E\uFF0C\u95E8\u69DB\u8FD8\u672A\u5F00\u653E\u3002" : "\u9662\u91CC\u4E24\u4FA7\u6709\u6811\uFF0C\u4E2D\u95F4\u7559\u7740\u901A\u5411\u5385\u95E8\u7684\u77F3\u8DEF\u3002";
    continueChapter.hidden = !mayContinue();
    toFlowerReturn.hidden = !mayReturnToFlower();
    const cue = !modernReturn && near(LIUYUAN_EAST_HALL_LEFT_TREE, 125) && !seen.left ? "E \xB7 \u770B\u5DE6\u4FA7\u4E54\u6728" : !modernReturn && near(LIUYUAN_EAST_HALL_RIGHT_TREE, 130) && !seen.right ? "E \xB7 \u770B\u53F3\u4FA7\u4E54\u6728" : "";
    interactionCue.hidden = !cue || !sceneMessage.hidden;
    interactionCue.textContent = cue;
    coords.hidden = !showGeometry.checked;
    if (showGeometry.checked) coords.textContent = `\u811A\u70B9 (${Math.round(actor.x)}, ${Math.round(actor.y)}) \xB7 \u53CC\u6811 ${Number(seen.left) + Number(seen.right)}/2`;
    draw();
    requestAnimationFrame(tick);
  }
  if (previewRequested && !draft) status.textContent = "\u6CA1\u6709\u627E\u5230\u53EF\u7528\u8349\u7A3F\uFF0C\u6B63\u663E\u793A\u4EE3\u7801\u4E2D\u7684\u573A\u666F\u51E0\u4F55\u3002";
  if (draft) status.textContent = "\u6B63\u5728\u9884\u89C8\u7F16\u8F91\u5668\u8349\u7A3F\uFF1B\u53EF\u8D70\u9762\u3001\u6811\u6C60\u4E0E\u906E\u6321\u5DF2\u540C\u6B65\u3002";
  if (collides(scene.map, actor.x, actor.y, scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE)) status.textContent = "\u51FA\u751F\u70B9\u88AB\u5F53\u524D\u51E0\u4F55\u5C01\u4F4F\uFF0C\u8BF7\u56DE\u7F16\u8F91\u5668\u68C0\u67E5\u3002";
  requestAnimationFrame(tick);
})();
