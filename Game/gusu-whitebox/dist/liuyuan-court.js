"use strict";
(() => {
  // src/core/geometry.ts
  var STANDARD_PLAYER_PROFILE = {
    halfW: 4,
    topInset: 6,
    bottomInset: 1
  };

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

  // src/core/liuyuan-entry-resume.ts
  function entryGeometryStamp(map, obstacles2) {
    let hash = 2166136261;
    for (const value of map) hash = Math.imul(hash ^ value, 16777619);
    const shapes = JSON.stringify(obstacles2);
    for (let index = 0; index < shapes.length; index++)
      hash = Math.imul(hash ^ shapes.charCodeAt(index), 16777619);
    return `${map.length}:${hash >>> 0}`;
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

  // src/data/liuyuan-court-study.ts
  var LIUYUAN_COURT_W = 111;
  var LIUYUAN_COURT_H = 56;
  var LIUYUAN_COURT_WORLD_W = LIUYUAN_COURT_W * 16;
  var LIUYUAN_COURT_WORLD_H = LIUYUAN_COURT_H * 16;
  var LIUYUAN_COURT_SPAWN = { x: 1600, y: 680 };
  var LIUYUAN_COURT_WINDOW_FOOT = { x: 1160, y: 615 };
  var LIUYUAN_COURT_WEST_EXIT = { x: 330, y: 305 };
  var LIUYUAN_COURT_REQUIRED_FEET = [
    { id: "\u5C0F\u5EAD\u5165\u53E3", ...LIUYUAN_COURT_SPAWN, radius: 20, mustStand: true },
    { id: "\u516D\u7A97\u89C2\u5BDF\u4F4D", ...LIUYUAN_COURT_WINDOW_FOOT, radius: 60 },
    { id: "\u7EFF\u836B\u8F69\u8F6C\u573A", ...LIUYUAN_COURT_WEST_EXIT, radius: 26, mustStand: true }
  ];
  var COURT_FLOOR = [
    [550, 575],
    [1776, 575],
    [1776, 742],
    [1020, 742],
    [760, 698],
    [550, 630]
  ];
  var COURT_TO_PASSAGE = [
    [355, 515],
    [555, 540],
    [760, 620],
    [760, 698],
    [550, 630],
    [355, 570]
  ];
  var WEST_PASSAGE = [
    [265, 245],
    [385, 245],
    [435, 350],
    [460, 455],
    [490, 525],
    [355, 570],
    [230, 515],
    [235, 350]
  ];
  function insidePolygon(x, y, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
      if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function bands(id, polygon, tile) {
    const output = [];
    for (let y = 0; y < LIUYUAN_COURT_H; y++) {
      let start = -1;
      for (let x = 0; x <= LIUYUAN_COURT_W; x++) {
        const open = x < LIUYUAN_COURT_W && insidePolygon(x * 16 + 8, y * 16 + 8, polygon);
        if (open && start < 0) start = x;
        if (!open && start >= 0) {
          output.push({ id: `${id}-${y}-${start}`, x: start, y, w: x - start, h: 1, tile });
          start = -1;
        }
      }
    }
    return output;
  }
  var LIUYUAN_COURT_DRAFT_REGIONS = [
    ...bands("court-paving", COURT_FLOOR, T.PATH),
    ...bands("court-west-turn", COURT_TO_PASSAGE, T.PATH),
    ...bands("west-narrow-passage", WEST_PASSAGE, T.CORR)
  ];
  var LIUYUAN_COURT_GEOMETRY = [
    {
      id: "liuyuan-six-window-north-wall",
      // 漏窗是墙中取景口，不是角色通行门。Tile 已封墙；物件便于在编辑器单独校准。
      colliders: [{ x: 580, y: 250, w: 1060, h: 250 }]
    },
    {
      id: "liuyuan-court-raised-bed",
      colliders: [{ x: 905, y: 445, w: 605, h: 128 }]
    },
    {
      id: "liuyuan-court-front-eave",
      // 屋檐只作前景遮挡；屋顶下方的地面由 Tile 单独封住。
      occluder: {
        id: "liuyuan-court-front-eave",
        depthY: 790,
        polygons: [[
          [0, 580],
          [190, 600],
          [420, 650],
          [680, 695],
          [940, 750],
          [1180, 790],
          [1180, 896],
          [0, 896]
        ]]
      }
    },
    {
      id: "liuyuan-court-east-eave",
      occluder: {
        id: "liuyuan-court-east-eave",
        depthY: 790,
        polygons: [[[1580, 760], [1776, 735], [1776, 896], [1580, 896]]]
      }
    }
  ];
  var LIUYUAN_COURT_OBSTACLES = LIUYUAN_COURT_GEOMETRY.flatMap((object) => object.colliders ?? []);
  function buildLiuyuanCourtStudyMap(regions2 = LIUYUAN_COURT_DRAFT_REGIONS) {
    const map = new Uint8Array(LIUYUAN_COURT_W * LIUYUAN_COURT_H);
    map.fill(T.WALL);
    for (const region of regions2) {
      for (let y = region.y; y < region.y + region.h; y++) for (let x = region.x; x < region.x + region.w; x++) {
        if (x >= 0 && y >= 0 && x < LIUYUAN_COURT_W && y < LIUYUAN_COURT_H) {
          map[y * LIUYUAN_COURT_W + x] = region.tile;
        }
      }
    }
    return {
      map,
      w: LIUYUAN_COURT_W,
      h: LIUYUAN_COURT_H,
      spawn: { ...LIUYUAN_COURT_SPAWN },
      obstacles: LIUYUAN_COURT_OBSTACLES
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

  // src/render/liuyuan-bucket.ts
  function carryingLiuyuanPorridge(progress) {
    return hasStoryFlag(progress, "ly-errand-offered") && !hasStoryFlag(progress, "ly-porridge-delivered");
  }
  function liuyuanBucketAnchor(footX, footY, actorHeight2, direction, carried) {
    const side = direction === 2 ? -1 : 1;
    return {
      x: footX + (carried ? side * actorHeight2 * 0.27 : 0),
      y: footY - (carried ? actorHeight2 * 0.16 : 0)
    };
  }
  function drawLiuyuanPorridgeBucket(ctx2, footX, footY, actorHeight2, direction, carried, grounded = !carried) {
    const h = Math.max(9, Math.round(actorHeight2 * 0.23));
    const w = Math.max(8, Math.round(h * 0.78));
    const anchor = liuyuanBucketAnchor(footX, footY, actorHeight2, direction, carried);
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

  // src/core/liuyuan-view-memory.ts
  function lvyinSceneUrl(sawCourtWindow, draft2 = false) {
    const query = new URLSearchParams({ chapter: "1" });
    if (sawCourtWindow) query.set("courtWindow", "1");
    if (draft2) query.set("draft", "1");
    carryLiuyuanPlaytest(query);
    return `liuyuan-lvyin.html?${query}`;
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

  // src/liuyuan-court.ts
  var SCENE_ID = "liuyuan-tree-court-no-water-study-v1";
  var canvas = document.getElementById("scene");
  var ctx = canvas.getContext("2d");
  var status = document.getElementById("status");
  var stageNote = document.getElementById("stageNote");
  var showGeometry = document.getElementById("showGeometry");
  var coords = document.getElementById("coords");
  var reset = document.getElementById("reset");
  var lookButton = document.getElementById("look");
  var continueChapter = document.getElementById("continueChapter");
  var toEntryReturn = document.getElementById("toEntryReturn");
  var routeNotice = document.getElementById("routeNotice");
  var sceneParams = new URLSearchParams(location.search);
  var chapterMode = sceneParams.get("chapter") === "1";
  var modernReturn = canEnterModernReturn(location.search, loadProgress(), "lvyin", "ly-leaf-carried");
  var sceneNav = document.getElementById("sceneNav");
  if (chapterMode) {
    sceneNav.hidden = true;
    document.getElementById("editorNav").hidden = true;
    document.getElementById("sceneTools").hidden = true;
    document.getElementById("sceneBadge").textContent = "CH3 \xB7 \u7559\u56ED \xB7 \u5C0F\u5EAD";
  }
  if (modernReturn) {
    sceneNav.hidden = true;
    document.getElementById("editorNav").hidden = true;
    document.getElementById("sceneTools").hidden = true;
    document.getElementById("sceneBadge").textContent = "CH3 \xB7 \u7559\u56ED \xB7 \u8FD4\u7A0B";
    routeNotice.textContent = "\u7559\u56ED\u7AE0\u8FD4\u7A0B\uFF1A\u4ECE\u6C60\u8FB9\u897F\u5ECA\u56DE\u5230\u5C0F\u5EAD\uFF0C\u6CBF\u540C\u4E00\u6761\u94FA\u5730\u8D70\u5411\u5939\u5F04\u3002\u533A\u57DF\u5173\u7CFB\u53C2\u7167\u73B0\u72B6\uFF0C\u573A\u666F\u8FB9\u754C\u4E3A\u6E38\u620F\u526A\u63A5\uFF0C\u4E0D\u662F\u6E05\u672B\u5B9E\u95E8\u3002";
  }
  stageNote.hidden = chapterMode || modernReturn;
  var art = new Image();
  var pixelArt = document.createElement("canvas");
  pixelArt.width = 888;
  pixelArt.height = 448;
  var pixelCtx = pixelArt.getContext("2d");
  var pixelArtReady = false;
  art.addEventListener("load", () => {
    pixelCtx.imageSmoothingEnabled = true;
    pixelCtx.drawImage(art, 0, 0, pixelArt.width, pixelArt.height);
    pixelArtReady = true;
  });
  art.src = "../assets/scene25d/liuyuan-tree-court-no-water-study-v1.png";
  var sprite = new Image();
  sprite.src = "../assets/characters/scholar-player-sprites-v1.png";
  var previewRequested = new URLSearchParams(location.search).get("draft") === "1";
  var draft = readScenePlateDraft(
    SCENE_ID,
    LIUYUAN_COURT_WORLD_W,
    LIUYUAN_COURT_WORLD_H,
    buildLiuyuanCourtStudyMap,
    LIUYUAN_COURT_REQUIRED_FEET
  );
  var regions = draft?.regions ?? LIUYUAN_COURT_DRAFT_REGIONS;
  var geometry = draft?.geometry ?? LIUYUAN_COURT_GEOMETRY;
  var scene = buildLiuyuanCourtStudyMap(regions);
  var obstacles = geometry.flatMap((object) => object.colliders ?? []);
  var FACING = { down: 0, left: 1, right: 2, up: 3 };
  var PLAYER_VISIBLE_HEIGHT = LIUYUAN_CHARACTER_SCALE.court.worldHeight;
  var actorHeight = Math.round(PLAYER_VISIBLE_HEIGHT * (draft?.actorScalePercent ?? 100) / 100);
  var carryingBucket = modernReturn || chapterMode && carryingLiuyuanPorridge(loadProgress());
  var actor = {
    ...modernReturn ? LIUYUAN_COURT_WEST_EXIT : LIUYUAN_COURT_SPAWN,
    dir: modernReturn ? FACING.right : FACING.left,
    moving: false,
    walkTime: 0
  };
  var keys = /* @__PURE__ */ new Set();
  var pressed = /* @__PURE__ */ new Set();
  var observed = sceneParams.get("courtWindow") === "1";
  var lastTime = 0;
  var resumeKey = `gusu:liuyuan-court:reload-v1:${sceneParams.get("playtest") === "1" ? "playtest" : "campaign"}:${modernReturn ? "return" : chapterMode ? "chapter" : "study"}:${previewRequested ? "draft" : "default"}`;
  var geometryStamp = entryGeometryStamp(scene.map, obstacles);
  var progressStamp = () => {
    const progress = loadProgress();
    return JSON.stringify([progress.updatedAt, [...progress.storyFlags].sort()]);
  };
  var leaving = false;
  var lastResume = "";
  var lastResumeAt = 0;
  function saveResume() {
    if (leaving) return;
    const value = JSON.stringify({
      version: 1,
      geometryStamp,
      progressStamp: progressStamp(),
      x: actor.x,
      y: actor.y,
      dir: actor.dir,
      observed
    });
    if (value === lastResume) return;
    try {
      sessionStorage.setItem(resumeKey, value);
      lastResume = value;
    } catch {
    }
  }
  function leaveScene(url) {
    leaving = true;
    try {
      sessionStorage.removeItem(resumeKey);
    } catch {
    }
    location.assign(url);
  }
  try {
    const saved = JSON.parse(sessionStorage.getItem(resumeKey) ?? "null");
    if (saved?.version === 1 && saved.geometryStamp === geometryStamp && saved.progressStamp === progressStamp() && Number.isFinite(saved.x) && Number.isFinite(saved.y) && saved.x >= 0 && saved.x < LIUYUAN_COURT_WORLD_W && saved.y >= 0 && saved.y < LIUYUAN_COURT_WORLD_H && Number.isInteger(saved.dir) && saved.dir >= 0 && saved.dir <= 3 && typeof saved.observed === "boolean" && !collides(scene.map, saved.x, saved.y, scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE)) {
      actor.x = saved.x;
      actor.y = saved.y;
      actor.dir = saved.dir;
      observed = saved.observed;
    }
  } catch {
  }
  var mayContinue = () => chapterMode && loadProgress().storyFlags.includes("ly-alley-walked") && Math.hypot(actor.x - LIUYUAN_COURT_WEST_EXIT.x, actor.y - LIUYUAN_COURT_WEST_EXIT.y) < 28;
  var goNext = () => {
    if (mayContinue()) leaveScene(lvyinSceneUrl(observed, previewRequested));
  };
  var mayReturnToEntry = () => modernReturn && Math.hypot(
    actor.x - LIUYUAN_COURT_SPAWN.x,
    actor.y - LIUYUAN_COURT_SPAWN.y
  ) < 100;
  toEntryReturn.addEventListener("click", () => {
    if (mayReturnToEntry()) leaveScene(modernRouteHref("liuyuan-entry.html", "court", previewRequested, true));
  });
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
  function observe() {
    if (modernReturn) {
      status.textContent = mayReturnToEntry() ? "\u5C0F\u5EAD\u53E3\u5230\u4E86\u3002\u7EE7\u7EED\u6CBF\u5939\u5F04\u8FD4\u56DE\u95E8\u5916\u3002" : "\u5317\u5899\u7684\u7A97\u4ECD\u53EA\u53EF\u770B\uFF0C\u4E0D\u53EF\u8D70\u3002\u6CBF\u94FA\u5730\u5F80\u4E1C\u3002";
      return;
    }
    if (Math.hypot(actor.x - LIUYUAN_COURT_WINDOW_FOOT.x, actor.y - LIUYUAN_COURT_WINDOW_FOOT.y) > 80) {
      status.textContent = "\u8FD8\u9694\u7740\u5EAD\u9662\uFF0C\u7A97\u5F71\u8FA8\u4E0D\u771F\u5207\u3002";
      return;
    }
    observed = true;
    saveResume();
    status.textContent = "\u7A97\u91CC\u53EA\u501F\u6765\u4E00\u7EBF\u5C71\u8272\u3002\u8981\u89C1\u56ED\u5B50\uFF0C\u8FD8\u5F97\u5411\u897F\u8D70\u3002";
  }
  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key === "e") {
      event.preventDefault();
      if (!event.repeat) {
        if (mayReturnToEntry()) toEntryReturn.click();
        else if (mayContinue()) goNext();
        else observe();
      }
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
    saveResume();
  });
  window.addEventListener("blur", () => {
    keys.clear();
    pressed.clear();
    saveResume();
  });
  window.addEventListener("pagehide", saveResume);
  document.addEventListener?.("visibilitychange", () => {
    if (document.hidden) {
      keys.clear();
      pressed.clear();
      saveResume();
    }
  });
  for (const button of document.querySelectorAll("[data-dir]")) {
    const dir = button.dataset.dir;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      pressed.add(dir);
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
      button.addEventListener(type, () => {
        pressed.delete(dir);
        saveResume();
      });
  }
  lookButton.addEventListener("click", observe);
  continueChapter.addEventListener("click", goNext);
  reset.addEventListener("click", () => {
    actor.x = modernReturn ? LIUYUAN_COURT_WEST_EXIT.x : LIUYUAN_COURT_SPAWN.x;
    actor.y = modernReturn ? LIUYUAN_COURT_WEST_EXIT.y : LIUYUAN_COURT_SPAWN.y;
    actor.dir = modernReturn ? FACING.right : FACING.left;
    keys.clear();
    pressed.clear();
    observed = false;
    saveResume();
    status.textContent = modernReturn ? "\u4ECE\u5C0F\u5EAD\u897F\u5ECA\u6CBF\u77F3\u8DEF\u5F80\u4E1C\u8D70\u3002" : "\u4ECE\u5C0F\u5EAD\u4E1C\u4FA7\u5411\u897F\u8D70\u3002";
  });
  function drawGeometry() {
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let y = 0; y < scene.h; y++) for (let x = 0; x < scene.w; x++) {
      const tile = scene.map[y * scene.w + x];
      if (tile === T.PATH || tile === T.CORR) {
        ctx.fillStyle = tile === T.CORR ? "#27bfc2" : "#52d879";
        ctx.fillRect(x * 16, y * 16, 16, 16);
      }
    }
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = "#ef5350";
    for (const object of geometry) for (const shape of object.colliders ?? []) {
      ctx.beginPath();
      if ("x" in shape) ctx.rect(shape.x, shape.y, shape.w, shape.h);
      else shape.points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    for (const object of geometry) for (const polygon of object.occluder?.polygons ?? []) {
      ctx.beginPath();
      polygon.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
      ctx.strokeStyle = "#35d8e6";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    const p = STANDARD_PLAYER_PROFILE;
    ctx.strokeStyle = "#ff64a8";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      actor.x - p.halfW,
      actor.y - p.topInset,
      p.halfW * 2,
      p.topInset - p.bottomInset
    );
  }
  function redrawForeground() {
    if (!art.complete || !art.naturalWidth) return;
    for (const object of geometry) {
      const occluder = object.occluder;
      if (!occluder || actor.y >= occluder.depthY) continue;
      ctx.save();
      ctx.beginPath();
      for (const polygon of occluder.polygons) {
        polygon.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.closePath();
      }
      ctx.clip();
      ctx.drawImage(pixelArtReady ? pixelArt : art, 0, 0, LIUYUAN_COURT_WORLD_W, LIUYUAN_COURT_WORLD_H);
      ctx.restore();
    }
  }
  function draw() {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#c6c6b9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const zoom = LIUYUAN_CHARACTER_SCALE.court.cameraZoom;
    const viewW = canvas.width / zoom, viewH = canvas.height / zoom;
    const cameraX = Math.max(0, Math.min(LIUYUAN_COURT_WORLD_W - viewW, actor.x - viewW * 0.55));
    const cameraY = Math.max(0, Math.min(LIUYUAN_COURT_WORLD_H - viewH, actor.y - viewH * 0.78));
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-Math.round(cameraX), -Math.round(cameraY));
    if (art.complete && art.naturalWidth) ctx.drawImage(
      pixelArtReady ? pixelArt : art,
      0,
      0,
      LIUYUAN_COURT_WORLD_W,
      LIUYUAN_COURT_WORLD_H
    );
    drawScholarGroundShadow(ctx, actor.x, actor.y, actorHeight);
    if (sprite.complete && sprite.naturalWidth) {
      const frame = actor.moving ? 1 + Math.floor(actor.walkTime * 6) % 2 : 0;
      drawScholarAtFoot(ctx, sprite, actor.dir, frame, actor.x, actor.y, actorHeight);
    } else {
      ctx.fillStyle = "#344e44";
      ctx.fillRect(actor.x - 5, actor.y - 22, 10, 22);
    }
    if (carryingBucket) drawLiuyuanPorridgeBucket(ctx, actor.x, actor.y, actorHeight, actor.dir, true);
    redrawForeground();
    if (showGeometry.checked) drawGeometry();
    ctx.restore();
  }
  function tick(now) {
    const dt = Math.min(0.05, (now - (lastTime || now)) / 1e3);
    lastTime = now;
    const active = (dir) => keys.has(dir) || pressed.has(dir);
    const dx = Number(active("right")) - Number(active("left"));
    const dy = Number(active("down")) - Number(active("up"));
    actor.moving = dx !== 0 || dy !== 0;
    if (actor.moving) {
      actor.dir = dy > 0 ? FACING.down : dy < 0 ? FACING.up : dx > 0 ? FACING.right : FACING.left;
      actor.walkTime += dt;
      const length = Math.hypot(dx, dy);
      moveEntity(
        scene.map,
        actor,
        dx / length * 95 * dt,
        dy / length * 95 * dt,
        scene.w,
        scene.h,
        obstacles,
        STANDARD_PLAYER_PROFILE
      );
    }
    const inWestPassage = actor.x < 600 && actor.y < 575;
    stageNote.textContent = modernReturn ? "\u6CBF\u540C\u4E00\u6761\u5EAD\u9662\u77F3\u8DEF\u5411\u4E1C\uFF0C\u7A97\u4E0D\u662F\u8DEF\u3002" : inWestPassage ? "\u5899\u8FD1\u4E86\uFF0C\u8DEF\u4ECD\u5728\u811A\u4E0B\u3002\u518D\u5F80\u524D\uFF0C\u624D\u4F1A\u89C1\u5230\u56ED\u5185\u7684\u6C60\u3002" : "\u811A\u4E0B\u662F\u5C0F\u5EAD\u77F3\u8DEF\u3002\u5317\u5899\u7684\u7A97\u53EA\u80FD\u671B\uFF0C\u897F\u8FB9\u7684\u5ECA\u624D\u53EF\u8D70\u3002";
    if (modernReturn) {
      status.textContent = mayReturnToEntry() ? "\u5C0F\u5EAD\u53E3\u5230\u4E86\u3002\u6309 E \u6216\u70B9\u6309\u94AE\u8FD4\u56DE\u5939\u5F04\u3002" : "\u6CBF\u5C0F\u5EAD\u94FA\u5730\u5F80\u4E1C\u8D70\uFF0C\u6876\u63D0\u7A33\u3002";
    } else if (Math.hypot(actor.x - LIUYUAN_COURT_WEST_EXIT.x, actor.y - LIUYUAN_COURT_WEST_EXIT.y) < 28) {
      status.textContent = mayContinue() ? "\u897F\u5ECA\u5C3D\u5934\u3002\u7EE7\u7EED\u5F80\u524D\uFF0C\u624D\u4F1A\u89C1\u6C60\u3002\u6309 E \u6216\u70B9\u201C\u6CBF\u897F\u5ECA\u7EE7\u7EED\u201D\u3002" : "\u897F\u5ECA\u5C3D\u5934\u3002\u4E0B\u4E00\u6BB5\u624D\u4E34\u56ED\u5185\u4E2D\u6C60\uFF1B\u72EC\u7ACB\u8BD5\u8D70\u6B62\u4E8E\u6B64\u3002";
    } else if (inWestPassage) {
      status.textContent = "\u5ECA\u5899\u6E10\u7A84\uFF0C\u6CBF\u77F3\u8DEF\u7EE7\u7EED\u5411\u524D\u3002";
    } else if (!observed && Math.hypot(actor.x - LIUYUAN_COURT_WINDOW_FOOT.x, actor.y - LIUYUAN_COURT_WINDOW_FOOT.y) < 80) {
      status.textContent = "\u5899\u4E0A\u516D\u7A97\u6F0F\u8FDB\u4E00\u70B9\u5149\u3002\u6309 E\uFF0C\u505C\u4E0B\u6765\u770B\u3002";
    } else if (!observed && (status.textContent?.startsWith("\u8FD8\u9694\u7740") || status.textContent?.startsWith("\u5ECA\u5899"))) {
      status.textContent = "\u6CBF\u5C0F\u5EAD\u94FA\u5730\u5411\u897F\u8D70\u3002";
    }
    coords.hidden = !showGeometry.checked;
    continueChapter.hidden = !mayContinue();
    toEntryReturn.hidden = !mayReturnToEntry();
    if (showGeometry.checked) coords.textContent = `\u811A\u70B9 (${Math.round(actor.x)}, ${Math.round(actor.y)})`;
    if (now - lastResumeAt >= 250) {
      saveResume();
      lastResumeAt = now;
    }
    draw();
    requestAnimationFrame(tick);
  }
  if (previewRequested && !draft) status.textContent = "\u8349\u7A3F\u672A\u8F7D\u5165\uFF1A\u53EF\u80FD\u5C1A\u672A\u4FDD\u5B58\uFF0C\u6216\u8DEF\u88AB Tile\uFF0F\u7269\u4EF6\u5835\u65AD\u3002\u73B0\u663E\u793A\u4EE3\u7801\u51E0\u4F55\uFF0C\u6D4F\u89C8\u5668\u8349\u7A3F\u672A\u6539\u52A8\u3002";
  if (draft) status.textContent = "\u6B63\u5728\u9884\u89C8\u7F16\u8F91\u5668\u8349\u7A3F\uFF1B\u53EF\u8D70\u5730\u9762\u4E0E\u906E\u6321\u5DF2\u540C\u6B65\u3002";
  if (chapterMode && !loadProgress().storyFlags.includes("ly-alley-walked")) {
    status.textContent = "\u9700\u5148\u4ECE\u5165\u53E3\u4EB2\u81EA\u8D70\u5B8C\u5939\u5F04\uFF1B\u6B64\u9875\u4ECD\u53EF\u72EC\u7ACB\u8BD5\u8D70\u3002";
  }
  if (collides(scene.map, actor.x, actor.y, scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE)) {
    status.textContent = "\u51FA\u751F\u70B9\u88AB\u5F53\u524D\u51E0\u4F55\u5C01\u4F4F\uFF0C\u8BF7\u56DE\u7F16\u8F91\u5668\u68C0\u67E5\u3002";
  }
  requestAnimationFrame(tick);
})();
