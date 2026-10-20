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
  function readScenePlateDraft(sceneId, worldW, worldH, buildMap) {
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

  // src/core/liuyuan-return-walk.ts
  var INITIAL_RETURN_WALK = {
    thresholdSeen: false,
    crossed: false,
    lookedBack: false,
    reachedEnd: false
  };
  function advanceReturnWalk(state, event) {
    switch (event) {
      case "threshold":
        return { ...state, thresholdSeen: true };
      case "inside":
        return state.thresholdSeen ? { ...state, crossed: true } : state;
      case "look-back":
        return state.crossed ? { ...state, lookedBack: true } : state;
      case "onward":
        return state.lookedBack ? { ...state, reachedEnd: true } : state;
    }
  }
  function completedReturnWalk() {
    return ["threshold", "inside", "look-back", "onward"].reduce(advanceReturnWalk, INITIAL_RETURN_WALK);
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

  // src/core/liuyuan-view-memory.ts
  function chapterSceneHref(page, draft2 = false) {
    const query = new URLSearchParams({ chapter: "1" });
    if (draft2) query.set("draft", "1");
    carryLiuyuanPlaytest(query);
    return `${page}?${query}`;
  }

  // src/data/liuyuan-youyicun-study.ts
  var LIUYUAN_YOUYICUN_ID = "liuyuan-youyicun-transition-study-v1";
  var LIUYUAN_YOUYICUN_W = 96;
  var LIUYUAN_YOUYICUN_H = 64;
  var LIUYUAN_YOUYICUN_WORLD_W = 1536;
  var LIUYUAN_YOUYICUN_WORLD_H = 1024;
  var LIUYUAN_YOUYICUN_SPAWN = { x: 624, y: 872 };
  var LIUYUAN_YOUYICUN_FEET = {
    gateFront: { x: 920, y: 680 },
    threshold: { x: 968, y: 616 },
    gardenSide: { x: 997, y: 526 },
    onward: { x: 1072, y: 414 }
  };
  var LIUYUAN_YOUYICUN_ACTOR_SCALE = {
    farFootY: 390,
    nearFootY: 900,
    farHeight: 200,
    nearHeight: 280,
    gateOpeningVisualHeight: 410
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
  var LIUYUAN_YOUYICUN_GEOMETRY = [
    { id: "youyicun-wall-and-bed-candidates", colliders: [] }
  ];
  function buildLiuyuanYouyicunStudyMap(regions = LIUYUAN_YOUYICUN_DRAFT_REGIONS) {
    const map = new Uint8Array(LIUYUAN_YOUYICUN_W * LIUYUAN_YOUYICUN_H);
    map.fill(T.WALL);
    for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
      for (let x = region.x; x < region.x + region.w; x++) {
        if (x >= 0 && y >= 0 && x < LIUYUAN_YOUYICUN_W && y < LIUYUAN_YOUYICUN_H) {
          map[y * LIUYUAN_YOUYICUN_W + x] = region.tile;
        }
      }
    }
    return {
      map,
      w: LIUYUAN_YOUYICUN_W,
      h: LIUYUAN_YOUYICUN_H,
      spawn: { ...LIUYUAN_YOUYICUN_SPAWN },
      obstacles: []
    };
  }

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

  // src/liuyuan-youyicun-study.ts
  var canvas = document.getElementById("scene");
  var ctx = canvas.getContext("2d");
  var status = document.getElementById("status");
  var showGeometry = document.getElementById("showGeometry");
  var coords = document.getElementById("coords");
  var restart = document.getElementById("restart");
  var look = document.getElementById("look");
  var returnToFlower = document.getElementById("returnToFlower");
  var researchContinue = document.getElementById("researchContinue");
  var recallClue = document.getElementById("recallClue");
  var params = new URLSearchParams(location.search);
  var chapterPreview = params.get("chapterPreview") === "1";
  if (chapterPreview) returnToFlower.href = chapterSceneHref("liuyuan-flower.html");
  recallClue.hidden = !chapterPreview || !hasStoryFlag(loadProgress(), "ly-florist-met");
  recallClue.addEventListener("click", () => {
    if (!chapterPreview || !hasStoryFlag(loadProgress(), "ly-florist-met")) return;
    status.textContent = "\u82B1\u5320\u8BF4\uFF1A\u201C\u90A3\u6811\u5F00\u524D\uFF0C\u82DE\u5C16\u50CF\u7B14\u5934\u3002\u201D\u4ED6\u6CA1\u8BF4\u662F\u54EA\u4E00\u9662\u3002";
  });
  var draft = readScenePlateDraft(
    LIUYUAN_YOUYICUN_ID,
    LIUYUAN_YOUYICUN_WORLD_W,
    LIUYUAN_YOUYICUN_WORLD_H,
    buildLiuyuanYouyicunStudyMap
  );
  var actorScalePercent = draft?.actorScalePercent ?? 100;
  var scene = buildLiuyuanYouyicunStudyMap(draft?.regions ?? LIUYUAN_YOUYICUN_DRAFT_REGIONS);
  var geometry = draft?.geometry ?? LIUYUAN_YOUYICUN_GEOMETRY;
  var obstacles = geometry.flatMap((object) => object.colliders ?? []);
  var actor = {
    x: Number(LIUYUAN_YOUYICUN_SPAWN.x),
    y: Number(LIUYUAN_YOUYICUN_SPAWN.y),
    dir: 2,
    moving: false,
    walkTime: 0
  };
  var pressed = /* @__PURE__ */ new Set();
  var keys = /* @__PURE__ */ new Set();
  var lastTime = 0;
  var resumeFromStone = chapterPreview && params.get("researchFrom") === "stone-forest" && !collides(
    scene.map,
    LIUYUAN_YOUYICUN_FEET.onward.x,
    LIUYUAN_YOUYICUN_FEET.onward.y,
    scene.w,
    scene.h,
    obstacles,
    STANDARD_PLAYER_PROFILE
  );
  if (resumeFromStone) {
    actor.x = LIUYUAN_YOUYICUN_FEET.onward.x;
    actor.y = LIUYUAN_YOUYICUN_FEET.onward.y;
    status.textContent = "\u4F60\u56DE\u5230\u8FD9\u5F20\u5706\u95E8\u7814\u7A76\u56FE\u7684\u6B62\u6B65\u70B9\u3002\u65E7\u5ECA\u6BB5\u7684\u5B9E\u9645\u5165\u53E3\u4ECD\u5F85\u67E5\u3002";
  }
  var returnWalk = resumeFromStone ? completedReturnWalk() : { ...INITIAL_RETURN_WALK };
  function continueResearch() {
    if (chapterPreview && returnWalk.reachedEnd && near(LIUYUAN_YOUYICUN_FEET.onward, 80)) {
      const next = new URLSearchParams({ researchFrom: "return-walk" });
      if (params.get("draft") === "1") next.set("draft", "1");
      carryLiuyuanPlaytest(next);
      location.assign(`liuyuan-stone-forest.html?${next}`);
    }
  }
  researchContinue.addEventListener("click", continueResearch);
  var art = new Image();
  art.src = "../research-art/liuyuan-youyicun-transition-pixel-study-v1.png";
  art.addEventListener("error", () => {
    status.textContent = "\u7814\u7A76\u5E95\u56FE\u672A\u8F7D\u5165\uFF0C\u8BF7\u68C0\u67E5\u56FE\u7247\u8DEF\u5F84\u3002";
  });
  var sprite = new Image();
  sprite.src = "../assets/characters/scholar-player-sprites-v1.png";
  function near(point, radius) {
    return Math.hypot(actor.x - point.x, actor.y - point.y) <= radius;
  }
  function inspect() {
    if (near(LIUYUAN_YOUYICUN_FEET.gardenSide, 86)) {
      if (returnWalk.crossed) {
        returnWalk = advanceReturnWalk(returnWalk, "look-back");
        actor.dir = 0;
        status.textContent = "\u4F60\u8F6C\u8EAB\u3002\u95E8\u5708\u53EA\u7559\u4E0B\u7A84\u7A84\u4E00\u5E45\u6765\u8DEF\uFF1B\u8FD9\u53EA\u662F\u73B0\u72B6\u5706\u95E8\u7684\u56FE\u9762\u8BD5\u8D70\u3002";
      } else status.textContent = "\u95E8\u6D1E\u5C31\u5728\u524D\u9762\uFF0C\u5148\u6CBF\u94FA\u5730\u8D70\u8FC7\u53BB\u3002";
    } else if (near(LIUYUAN_YOUYICUN_FEET.gateFront, 95) || near(LIUYUAN_YOUYICUN_FEET.threshold, 75)) {
      status.textContent = "\u95E8\u91CC\u8FD8\u770B\u5F97\u89C1\u4E00\u622A\u94FA\u5730\uFF0C\u8D70\u8FC7\u53BB\uFF0C\u666F\u5C31\u7A84\u4E86\u3002";
    } else if (near(LIUYUAN_YOUYICUN_FEET.onward, 80)) {
      status.textContent = returnWalk.lookedBack ? "\u56FE\u9762\u5230\u6B64\u4E3A\u6B62\u3002\u82E5\u8981\u53E6\u770B\u77F3\u6797\u7814\u7A76\u7247\u6BB5\uFF0C\u53EF\u6309 F\uFF1B\u672C\u5706\u95E8\u4E0D\u80FD\u63A8\u5B9A\u56DB\u9762\u5385\u95E8\u4F4D\u3002" : "\u8EAB\u540E\u7684\u95E8\u5708\u8FD8\u6CA1\u56DE\u671B\uFF1B\u672C\u5706\u95E8\u4E0E\u65E7\u5385\u5ECA\u7684\u5173\u7CFB\u5C1A\u672A\u6838\u5B9E\u3002";
    } else {
      status.textContent = "\u6CBF\u811A\u4E0B\u77F3\u8DEF\u8D70\uFF0C\u5148\u4ECE\u5706\u95E8\u7A7F\u8FC7\u53BB\uFF0C\u518D\u56DE\u5934\u770B\u3002";
    }
  }
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
    const key = event.key.toLowerCase();
    if (key === " " && (event.target instanceof HTMLButtonElement || event.target instanceof HTMLInputElement)) return;
    if (key === "e" || key === " ") {
      event.preventDefault();
      if (!event.repeat) inspect();
      return;
    }
    if (key === "f") {
      event.preventDefault();
      if (!event.repeat) continueResearch();
      return;
    }
    const direction = directions[key];
    if (direction) {
      event.preventDefault();
      keys.add(direction);
    }
  });
  window.addEventListener("keyup", (event) => {
    const direction = directions[event.key.toLowerCase()];
    if (direction) keys.delete(direction);
  });
  window.addEventListener("blur", () => {
    keys.clear();
    pressed.clear();
  });
  for (const button of document.querySelectorAll("[data-dir]")) {
    const direction = button.dataset.dir;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      pressed.add(direction);
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
      button.addEventListener(type, () => pressed.delete(direction));
    }
  }
  look.addEventListener("click", inspect);
  restart.addEventListener("click", () => {
    actor.x = LIUYUAN_YOUYICUN_SPAWN.x;
    actor.y = LIUYUAN_YOUYICUN_SPAWN.y;
    actor.dir = 2;
    keys.clear();
    pressed.clear();
    returnWalk = { ...INITIAL_RETURN_WALK };
    researchContinue.hidden = true;
    status.textContent = "\u4F60\u56DE\u5230\u8FD9\u5F20\u5706\u95E8\u7814\u7A76\u56FE\u7684\u8D77\u70B9\u3002";
  });
  function tracePolygon(points) {
    ctx.beginPath();
    points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
  }
  function drawDebug() {
    ctx.save();
    ctx.globalAlpha = 0.46;
    for (let y = 0; y < scene.h; y++) for (let x = 0; x < scene.w; x++) {
      const tile = scene.map[y * scene.w + x];
      if (tile !== T.WALL) {
        ctx.fillStyle = tile === T.CORR ? "#36c5cf" : "#55c68b";
        ctx.fillRect(x * 16, y * 16, 16, 16);
      }
    }
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "#e55b51";
    for (const object of geometry) for (const shape of object.colliders ?? []) {
      if ("x" in shape) ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
      else {
        tracePolygon(shape.points);
        ctx.fill();
      }
    }
    ctx.restore();
    for (const object of geometry) for (const polygon of object.occluder?.polygons ?? []) {
      ctx.strokeStyle = "#39d7e0";
      ctx.lineWidth = 3;
      tracePolygon(polygon);
      ctx.stroke();
    }
    for (const foot of Object.values(LIUYUAN_YOUYICUN_FEET)) {
      ctx.fillStyle = "#f1df98";
      ctx.fillRect(foot.x - 4, foot.y - 4, 8, 8);
    }
    const p = STANDARD_PLAYER_PROFILE;
    ctx.strokeStyle = "#ff68ab";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      actor.x - p.halfW,
      actor.y - p.topInset,
      p.halfW * 2,
      p.topInset - p.bottomInset
    );
  }
  function draw() {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#626c62";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(canvas.width / LIUYUAN_YOUYICUN_WORLD_W, canvas.height / LIUYUAN_YOUYICUN_WORLD_H);
    if (art.complete && art.naturalWidth) ctx.drawImage(
      art,
      0,
      0,
      LIUYUAN_YOUYICUN_WORLD_W,
      LIUYUAN_YOUYICUN_WORLD_H
    );
    const scale = LIUYUAN_YOUYICUN_ACTOR_SCALE;
    const height = Math.round(perspectiveScholarHeight(
      actor.y,
      scale.farFootY,
      scale.nearFootY,
      scale.farHeight,
      scale.nearHeight
    ) * actorScalePercent / 100);
    drawScholarGroundShadow(ctx, actor.x, actor.y, height);
    if (sprite.complete && sprite.naturalWidth) {
      const frame = actor.moving ? 1 + Math.floor(actor.walkTime * 6) % 2 : 0;
      drawScholarAtFoot(ctx, sprite, actor.dir, frame, actor.x, actor.y, height);
    }
    if (art.complete && art.naturalWidth) for (const object of geometry) {
      const occluder = object.occluder;
      if (!occluder || actor.y >= occluder.depthY) continue;
      ctx.save();
      ctx.beginPath();
      for (const polygon of occluder.polygons) {
        polygon.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.closePath();
      }
      ctx.clip();
      ctx.drawImage(
        art,
        0,
        0,
        LIUYUAN_YOUYICUN_WORLD_W,
        LIUYUAN_YOUYICUN_WORLD_H
      );
      ctx.restore();
    }
    if (showGeometry.checked) drawDebug();
    ctx.restore();
  }
  function tick(now) {
    const dt = Math.min(0.05, (now - (lastTime || now)) / 1e3);
    lastTime = now;
    const active = (direction) => keys.has(direction) || pressed.has(direction);
    const dx = Number(active("right")) - Number(active("left"));
    const dy = Number(active("down")) - Number(active("up"));
    actor.moving = dx !== 0 || dy !== 0;
    if (actor.moving) {
      actor.dir = dy > 0 ? 0 : dy < 0 ? 3 : dx > 0 ? 2 : 1;
      actor.walkTime += dt;
      const length = Math.hypot(dx, dy);
      moveEntity(
        scene.map,
        actor,
        dx / length * 155 * dt,
        dy / length * 155 * dt,
        scene.w,
        scene.h,
        obstacles,
        STANDARD_PLAYER_PROFILE
      );
    }
    if (!returnWalk.thresholdSeen && near(LIUYUAN_YOUYICUN_FEET.threshold, 45)) {
      returnWalk = advanceReturnWalk(returnWalk, "threshold");
      status.textContent = "\u811A\u4E0B\u8DE8\u8FC7\u95E8\u69DB\uFF0C\u9662\u5899\u628A\u8EAB\u540E\u7684\u58F0\u97F3\u6536\u4F4F\u4E86\u3002";
    }
    if (returnWalk.thresholdSeen && !returnWalk.crossed && near(LIUYUAN_YOUYICUN_FEET.gardenSide, 45)) {
      returnWalk = advanceReturnWalk(returnWalk, "inside");
      status.textContent = "\u5230\u4E86\u95E8\u7684\u53E6\u4E00\u4FA7\u3002\u98CE\u4ECE\u6765\u8DEF\u5439\u6765\uFF0C\u4E0D\u59A8\u56DE\u5934\u770B\u4E00\u773C\u3002";
    }
    if (returnWalk.lookedBack && !returnWalk.reachedEnd && near(LIUYUAN_YOUYICUN_FEET.onward, 70)) {
      returnWalk = advanceReturnWalk(returnWalk, "onward");
      status.textContent = "\u5706\u95E8\u51E0\u4F55\u7EC3\u4E60\u5230\u6B64\u3002\u6309 F \u53EF\u53E6\u770B\u77F3\u6797\u7814\u7A76\u7247\u6BB5\uFF1B\u56DB\u9762\u5385\u524D\u5ECA\u7684\u771F\u5B9E\u5165\u53E3\u5C1A\u672A\u6838\u3002";
    }
    researchContinue.hidden = !chapterPreview || !returnWalk.reachedEnd || !near(LIUYUAN_YOUYICUN_FEET.onward, 80);
    coords.hidden = !showGeometry.checked;
    if (showGeometry.checked) {
      const scale = LIUYUAN_YOUYICUN_ACTOR_SCALE;
      const height = Math.round(perspectiveScholarHeight(
        actor.y,
        scale.farFootY,
        scale.nearFootY,
        scale.farHeight,
        scale.nearHeight
      ) * actorScalePercent / 100);
      coords.textContent = `\u811A\u70B9 (${Math.round(actor.x)}, ${Math.round(actor.y)}) \xB7 \u4EBA\u7269 ${height}px\uFF08${actorScalePercent}%\uFF09/ \u5706\u95E8\u7EA6 ${scale.gateOpeningVisualHeight}px\uFF08\u56FE\u9762\u6807\u5C3A\uFF09`;
    }
    draw();
    requestAnimationFrame(tick);
  }
  if (params.get("draft") === "1" && !draft) status.textContent = "\u6CA1\u6709\u53EF\u7528\u7F16\u8F91\u5668\u8349\u7A3F\uFF0C\u6B63\u5728\u4F7F\u7528\u4EE3\u7801\u5019\u9009\u51E0\u4F55\u3002";
  if (draft) status.textContent = "\u6B63\u5728\u9884\u89C8\u672C\u5E55\u7F16\u8F91\u5668\u8349\u7A3F\uFF1B\u4E0D\u4F1A\u6539\u5199 CH3 \u5B58\u6863\u3002";
  if (collides(scene.map, actor.x, actor.y, scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE)) {
    status.textContent = "\u51FA\u751F\u811A\u70B9\u88AB\u51E0\u4F55\u5C01\u4F4F\uFF0C\u8BF7\u56DE\u7F16\u8F91\u5668\u6821\u51C6\u3002";
  }
  requestAnimationFrame(tick);
})();
