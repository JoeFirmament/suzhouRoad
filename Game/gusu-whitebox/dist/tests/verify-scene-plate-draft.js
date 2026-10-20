"use strict";

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
  const actor = [[left, top], [right, top], [right, bottom], [left, bottom]];
  return convexPolygonsOverlap(actor, shape.points);
}
function collides(map, x, y, w = MAP_W, h = MAP_H, obstacles = [], profile = DEFAULT_PROFILE) {
  return obstacles.some((shape) => collidesShape(x, y, shape, profile)) || (solidAt(map, x - profile.halfW, y - profile.bottomInset, w, h) || solidAt(map, x + profile.halfW, y - profile.bottomInset, w, h) || solidAt(map, x - profile.halfW, y - profile.topInset, w, h) || solidAt(map, x + profile.halfW, y - profile.topInset, w, h));
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
  const prefix2 = `gusu-geometry-plate:${sceneId}:`;
  const candidates = [];
  if (window.name.startsWith(prefix2)) try {
    candidates.push(JSON.parse(window.name.slice(prefix2.length)));
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
function readSceneActorScalePercent(sceneId, worldW, worldH) {
  if (new URLSearchParams(location.search).get("actorDraft") !== "1") return null;
  for (const record2 of sceneDraftRecords(sceneId)) try {
    const data = JSON.parse(record2.value);
    if (data.format !== "gusu-scene-geometry" || data.sceneId !== sceneId || data.world?.width !== worldW || data.world?.height !== worldH) continue;
    if (data.actorScalePercent === void 0) return 100;
    if (Number.isInteger(data.actorScalePercent) && data.actorScalePercent >= 40 && data.actorScalePercent <= 250) return data.actorScalePercent;
  } catch {
  }
  return null;
}
function readSceneVisualOccluders(sceneId, worldW, worldH) {
  if (new URLSearchParams(location.search).get("actorDraft") !== "1") return null;
  for (const record2 of sceneDraftRecords(sceneId)) try {
    const data = JSON.parse(record2.value);
    if (data.format !== "gusu-scene-geometry" || data.sceneId !== sceneId || data.world?.width !== worldW || data.world?.height !== worldH || !Array.isArray(data.objects) || (data.seedRevision ?? 0) < 1) continue;
    const masks = [];
    let valid = true;
    const ids = /* @__PURE__ */ new Set();
    for (const item of data.objects) {
      if (!item.occluder) continue;
      const { depthY, polygons } = item.occluder;
      if (typeof item.id !== "string" || !item.id.trim() || ids.has(item.id) || !Number.isFinite(depthY) || depthY < 0 || depthY > worldH || !Array.isArray(polygons) || !polygons.length || !polygons.every((polygon) => Array.isArray(polygon) && polygon.length >= 3 && polygon.every((point) => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite) && point[0] >= 0 && point[1] >= 0 && point[0] <= worldW && point[1] <= worldH))) {
        valid = false;
        break;
      }
      ids.add(item.id);
      masks.push({ id: item.id, occluder: {
        id: item.id,
        depthY,
        polygons
      } });
    }
    if (valid) return masks;
  } catch {
  }
  return null;
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
  for (const record2 of sceneDraftRecords(sceneId)) {
    try {
      const data = JSON.parse(record2.value);
      if (data.format !== "gusu-scene-geometry" || data.sceneId !== sceneId || data.world?.width !== worldW || data.world?.height !== worldH || !Array.isArray(data.tileRegions) || !Array.isArray(data.objects)) continue;
      if (data.actorScalePercent !== void 0 && (!Number.isInteger(data.actorScalePercent) || data.actorScalePercent < 40 || data.actorScalePercent > 250)) continue;
      if (!data.tileRegions.every((item) => typeof item.id === "string" && [item.x, item.y, item.w, item.h, item.tile].every(Number.isInteger) && item.w > 0 && item.h > 0 && item.x >= 0 && item.y >= 0 && item.x + item.w <= worldW / 16 && item.y + item.h <= worldH / 16)) continue;
      if (!data.objects.every((item) => typeof item.id === "string" && (item.colliders ?? []).every(validCollider) && (!item.occluder || Number.isFinite(item.occluder.depthY) && (item.occluder.polygons ?? []).every(validPolygon)) && Array.isArray(item.effects ?? []) && (item.effects ?? []).every(validEffect))) continue;
      const geometry = data.objects.map((item) => ({
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
      const obstacles = geometry.flatMap((object) => object.colliders ?? []);
      if (validateTileScene(sceneId, { ...scene, obstacles }, STANDARD_PLAYER_PROFILE).length) continue;
      if (unreachableSceneFeet({ ...scene, obstacles }, requiredFeet, STANDARD_PLAYER_PROFILE).length) continue;
      return {
        regions: data.tileRegions,
        geometry,
        actorScalePercent: data.actorScalePercent ?? 100,
        assetPath: typeof data.asset?.path === "string" ? data.asset.path : void 0
      };
    } catch {
    }
  }
  return null;
}

// src/data/corridor-geometry.ts
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

// src/data/liuyuan-guanyun-study.ts
var GUANYUN_W = 96;
var GUANYUN_H = 64;
var POND = [[208, 482], [330, 448], [530, 452], [665, 475], [855, 500], [1080, 499], [1260, 512], [1360, 576], [1420, 693], [1400, 782], [1195, 806], [940, 780], [705, 757], [480, 737], [285, 716], [153, 652]];
var FRONT_PATH = [[50, 744], [210, 715], [380, 752], [710, 770], [1e3, 800], [1380, 792], [1510, 755], [1536, 1024], [0, 1024], [0, 770]];
var LEFT_PATH = [[0, 333], [115, 348], [226, 429], [216, 580], [178, 697], [245, 761], [0, 797]];
var RIGHT_PATH = [[1373, 415], [1510, 394], [1536, 409], [1536, 800], [1420, 811], [1420, 694]];
function inside(x, y, points) {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
function guanyunBands(id, points, tile) {
  const result = [];
  for (let y = 0; y < GUANYUN_H; y++) {
    let first = -1;
    for (let x = 0; x <= GUANYUN_W; x++) {
      const open = x < GUANYUN_W && inside(x * 16 + 8, y * 16 + 8, points);
      if (open && first < 0) first = x;
      if (!open && first >= 0) {
        result.push({ id: `${id}-${y}-${first}`, x: first, y, w: x - first, h: 1, tile });
        first = -1;
      }
    }
  }
  return result;
}
var GUANYUN_DRAFT_REGIONS = [
  ...guanyunBands("guanyun-pond", POND, T.WATER),
  ...guanyunBands("guanyun-left", LEFT_PATH, T.PATH),
  ...guanyunBands("guanyun-right", RIGHT_PATH, T.PATH),
  ...guanyunBands("guanyun-front", FRONT_PATH, T.PATH)
];
var GUANYUN_GEOMETRY = [
  {
    id: "guanyun-main-peak",
    colliders: [{ points: [[742, 351], [809, 337], [906, 375], [955, 457], [910, 500], [768, 493], [721, 443]] }],
    occluder: { id: "guanyun-peak-mask", depthY: 492, polygons: [[[766, 38], [827, 44], [864, 89], [882, 136], [920, 325], [935, 467], [905, 500], [758, 488], [726, 421], [759, 281]]] }
  },
  { id: "guanyun-pond-bank", colliders: [{ points: [[270, 690], [465, 724], [682, 744], [896, 769], [1195, 793], [1403, 775], [1408, 799], [1192, 817], [891, 789], [673, 759], [459, 741], [262, 710]] }] },
  {
    id: "guanyun-rear-hall",
    colliders: [{ x: 659, y: 140, w: 670, h: 225 }],
    occluder: { id: "guanyun-hall-eaves", depthY: 351, polygons: [[[563, 0], [1408, 0], [1375, 182], [645, 206]]] }
  },
  { id: "guanyun-left-foreground", occluder: {
    id: "guanyun-left-foreground",
    depthY: 1005,
    polygons: [[[0, 657], [146, 650], [207, 818], [365, 931], [420, 1024], [0, 1024]]]
  } },
  { id: "guanyun-right-foreground", occluder: {
    id: "guanyun-right-foreground",
    depthY: 1012,
    polygons: [[[1400, 829], [1536, 749], [1536, 1024], [1280, 1024]]]
  } }
];
var GUANYUN_OBSTACLES = GUANYUN_GEOMETRY.flatMap((object) => object.colliders ?? []);

// src/data/liuyuan-guanyun-v2-study.ts
var GUANYUN_V2_ID = "liuyuan-guanyun-court-study-v2";
var GUANYUN_V2_W = 96;
var GUANYUN_V2_H = 64;
var GUANYUN_V2_WORLD_W = 1536;
var GUANYUN_V2_WORLD_H = 1024;
var GUANYUN_V2_SPAWN = { x: 757, y: 941 };
var POND2 = [[441, 452], [593, 430], [830, 429], [1016, 436], [1128, 476], [1139, 573], [1051, 599], [747, 609], [485, 591], [419, 540]];
var SOUTH_PASSAGE = [[643, 1024], [872, 1024], [869, 694], [638, 694]];
var SOUTH_TERRACE = [[335, 615], [1192, 615], [1230, 720], [322, 720]];
var WEST_BANK = [[314, 277], [455, 278], [468, 449], [405, 604], [317, 658], [288, 489]];
var EAST_BANK = [[1104, 281], [1259, 269], [1275, 520], [1210, 663], [1108, 597]];
var NORTH_COURT = [[364, 251], [1165, 250], [1214, 443], [1112, 449], [970, 419], [849, 414], [645, 411], [458, 447], [353, 419]];
var GUANYUN_V2_DRAFT_REGIONS = [
  ...guanyunBands("guanyun-v2-north", NORTH_COURT, T.PATH),
  ...guanyunBands("guanyun-v2-west", WEST_BANK, T.PATH),
  ...guanyunBands("guanyun-v2-east", EAST_BANK, T.PATH),
  ...guanyunBands("guanyun-v2-terrace", SOUTH_TERRACE, T.PATH),
  ...guanyunBands("guanyun-v2-hall-passage", SOUTH_PASSAGE, T.CORR),
  ...guanyunBands("guanyun-v2-pond", POND2, T.WATER)
];
var GUANYUN_V2_GEOMETRY = [
  { id: "guanyun-v2-huanyun-pond", effects: [{
    id: "guanyun-v2-huanyun-ripples",
    kind: "water-ripple",
    // 比 Tile 水面向内收，避开岸石、峰影与台前石栏；仍待逐像素人工核图。
    polygons: [[[510, 491], [620, 478], [909, 478], [1034, 484], [1061, 510], [1031, 552], [910, 574], [640, 570], [524, 545], [500, 516]]],
    ripple: {
      color: "rgba(198, 214, 197, .14)",
      rowSpacing: 20,
      segmentSpacing: 64,
      minLength: 5,
      maxLength: 15,
      speedMs: 620
    }
  }] },
  {
    id: "guanyun-v2-peak-bed",
    colliders: [{ points: [[670, 321], [703, 286], [851, 286], [886, 333], [857, 393], [688, 395]] }],
    occluder: {
      id: "guanyun-v2-peak-mask",
      depthY: 386,
      polygons: [[[734, 64], [791, 65], [835, 122], [851, 193], [875, 350], [850, 395], [695, 396], [675, 349], [718, 222]]]
    }
  },
  { id: "guanyun-v2-pond-south-rail", colliders: [
    { points: [[492, 579], [630, 592], [628, 608], [487, 600]] },
    { points: [[630, 592], [790, 595], [778, 610], [628, 608]] },
    { points: [[790, 595], [954, 592], [962, 609], [778, 610]] },
    { points: [[954, 592], [1088, 573], [1102, 597], [962, 609]] }
  ] },
  {
    id: "guanyun-v2-north-building",
    colliders: [{ x: 564, y: 70, w: 431, h: 166 }],
    occluder: { id: "guanyun-v2-north-eave", depthY: 232, polygons: [[[553, 0], [1045, 0], [1027, 222], [563, 226]]] }
  },
  { id: "guanyun-v2-south-hall-west-post", colliders: [{ x: 635, y: 857, w: 23, h: 69 }] },
  { id: "guanyun-v2-south-hall-east-post", colliders: [{ x: 861, y: 857, w: 23, h: 69 }] },
  // 屋顶的绘制深度取厅柱落脚线，不取檐口最低像素；人物从厅下穿过时上半身仍在檐后。
  { id: "guanyun-v2-south-hall-roof", occluder: {
    id: "guanyun-v2-south-hall-roof",
    depthY: 926,
    polygons: [[[241, 690], [1295, 689], [1285, 854], [249, 855]]]
  } },
  { id: "guanyun-v2-west-pavilion-roof", occluder: {
    id: "guanyun-v2-west-pavilion-roof",
    depthY: 480,
    polygons: [[[0, 272], [335, 265], [376, 375], [10, 394]]]
  } },
  { id: "guanyun-v2-east-pavilion-roof", occluder: {
    id: "guanyun-v2-east-pavilion-roof",
    depthY: 450,
    polygons: [[[1200, 184], [1536, 210], [1536, 412], [1232, 393]]]
  } }
];
var GUANYUN_V2_OBSTACLES = GUANYUN_V2_GEOMETRY.flatMap((object) => object.colliders ?? []);
function buildGuanyunV2Map(regions = GUANYUN_V2_DRAFT_REGIONS) {
  const map = new Uint8Array(GUANYUN_V2_W * GUANYUN_V2_H);
  map.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++)
    for (let x = region.x; x < region.x + region.w; x++)
      if (x >= 0 && y >= 0 && x < GUANYUN_V2_W && y < GUANYUN_V2_H) map[y * GUANYUN_V2_W + x] = region.tile;
  return {
    map,
    w: GUANYUN_V2_W,
    h: GUANYUN_V2_H,
    spawn: { ...GUANYUN_V2_SPAWN },
    obstacles: GUANYUN_V2_OBSTACLES
  };
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
  let inside2 = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside2 = !inside2;
  }
  return inside2;
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
function buildLiuyuanCourtStudyMap(regions = LIUYUAN_COURT_DRAFT_REGIONS) {
  const map = new Uint8Array(LIUYUAN_COURT_W * LIUYUAN_COURT_H);
  map.fill(T.WALL);
  for (const region of regions) {
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

// src/data/liuyuan-lvyin-study.ts
var LIUYUAN_LVYIN_ID = "liuyuan-lvyin-pond-study-v1";
var LIUYUAN_LVYIN_W = 111;
var LIUYUAN_LVYIN_H = 56;
var LIUYUAN_LVYIN_WORLD_W = LIUYUAN_LVYIN_W * 16;
var LIUYUAN_LVYIN_WORLD_H = LIUYUAN_LVYIN_H * 16;
var LIUYUAN_LVYIN_SPAWN = { x: 1660, y: 740 };
var LIUYUAN_LVYIN_BANK_FOOT = { x: 930, y: 690 };
var LIUYUAN_LVYIN_PAVILION_FOOT = { x: 250, y: 470 };
var LIUYUAN_LVYIN_REQUIRED_FEET = [
  { id: "\u5C0F\u5EAD\u63A5\u5165", ...LIUYUAN_LVYIN_SPAWN, radius: 24, mustStand: true },
  { id: "\u4E34\u6C60\u505C\u6B65", ...LIUYUAN_LVYIN_BANK_FOOT, radius: 75 },
  { id: "\u8F69\u5185\u8F6C\u573A", ...LIUYUAN_LVYIN_PAVILION_FOOT, radius: 65, mustStand: true }
];
var POND3 = [
  [255, 95],
  [700, 65],
  [1120, 165],
  [1370, 280],
  [1320, 535],
  [1120, 560],
  [790, 490],
  [495, 440],
  [275, 350]
];
var BANK_FLOOR = [
  [465, 555],
  [1010, 585],
  [1235, 625],
  [1560, 595],
  [1776, 650],
  [1776, 896],
  [1120, 896],
  [1040, 780],
  [710, 790],
  [430, 725],
  [380, 620]
];
var PAVILION_FLOOR = [
  [40, 345],
  [345, 345],
  [440, 460],
  [395, 545],
  [190, 555],
  [40, 510]
];
var PAVILION_STEPS = [
  [280, 490],
  [430, 480],
  [560, 620],
  [485, 675],
  [335, 575]
];
function insidePolygon2(x, y, polygon) {
  let inside2 = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside2 = !inside2;
  }
  return inside2;
}
function bands2(id, polygon, tile) {
  const output = [];
  for (let y = 0; y < LIUYUAN_LVYIN_H; y++) {
    let start = -1;
    for (let x = 0; x <= LIUYUAN_LVYIN_W; x++) {
      const open = x < LIUYUAN_LVYIN_W && insidePolygon2(x * 16 + 8, y * 16 + 8, polygon);
      if (open && start < 0) start = x;
      if (!open && start >= 0) {
        output.push({ id: `${id}-${y}-${start}`, x: start, y, w: x - start, h: 1, tile });
        start = -1;
      }
    }
  }
  return output;
}
var LIUYUAN_LVYIN_DRAFT_REGIONS = [
  ...bands2("central-pond", POND3, T.WATER),
  ...bands2("pond-bank-paving", BANK_FLOOR, T.PATH),
  ...bands2("pavilion-floor", PAVILION_FLOOR, T.CORR),
  ...bands2("pavilion-steps", PAVILION_STEPS, T.PLAT)
];
var LIUYUAN_LVYIN_GEOMETRY = [
  {
    id: "lvyin-waterfront-railing",
    // 每段是凸四边形，避免把折线整段交给只支持凸形 SAT 的碰撞器。
    colliders: [
      { points: [[455, 423], [680, 432], [650, 495], [455, 480]] },
      { points: [[680, 432], [930, 503], [900, 570], [650, 495]] },
      { points: [[930, 503], [1235, 548], [1235, 605], [900, 570]] }
    ]
  },
  {
    id: "lvyin-east-planting-bed",
    colliders: [{ points: [[1250, 425], [1570, 455], [1580, 610], [1265, 610]] }]
  },
  {
    id: "lvyin-right-wall",
    colliders: [{ x: 1680, y: 150, w: 96, h: 495 }]
  },
  {
    id: "lvyin-pavilion-front-posts",
    colliders: [{ x: 102, y: 440, w: 22, h: 70 }, { x: 360, y: 420, w: 24, h: 80 }],
    occluder: {
      id: "lvyin-pavilion-front-posts",
      depthY: 505,
      polygons: [
        [[85, 260], [132, 260], [130, 510], [98, 510]],
        [[347, 260], [396, 260], [391, 510], [355, 510]]
      ]
    }
  },
  {
    id: "lvyin-foreground-roof",
    occluder: {
      id: "lvyin-foreground-roof",
      depthY: 825,
      polygons: [[[0, 696], [380, 705], [560, 790], [560, 896], [0, 896]]]
    }
  }
];
var LIUYUAN_LVYIN_OBSTACLES = LIUYUAN_LVYIN_GEOMETRY.flatMap((object) => object.colliders ?? []);
function buildLiuyuanLvyinStudyMap(regions = LIUYUAN_LVYIN_DRAFT_REGIONS) {
  const map = new Uint8Array(LIUYUAN_LVYIN_W * LIUYUAN_LVYIN_H);
  map.fill(T.WALL);
  for (const region of regions) {
    for (let y = region.y; y < region.y + region.h; y++) for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_LVYIN_W && y < LIUYUAN_LVYIN_H) {
        map[y * LIUYUAN_LVYIN_W + x] = region.tile;
      }
    }
  }
  return {
    map,
    w: LIUYUAN_LVYIN_W,
    h: LIUYUAN_LVYIN_H,
    spawn: { ...LIUYUAN_LVYIN_SPAWN },
    obstacles: LIUYUAN_LVYIN_OBSTACLES
  };
}

// src/data/liuyuan-entry-oblique-study.ts
var LIUYUAN_ENTRY_OBLIQUE_ID = "liuyuan-entry-oblique-shot-study-v1";
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
function insidePolygon3(x, y, polygon) {
  let inside2 = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside2 = !inside2;
  }
  return inside2;
}
function rowBands(id, polygon, tile) {
  const rows = [];
  for (let y = 0; y < LIUYUAN_ENTRY_OBLIQUE_H; y++) {
    let start = -1;
    for (let x = 0; x <= LIUYUAN_ENTRY_OBLIQUE_W; x++) {
      const open = x < LIUYUAN_ENTRY_OBLIQUE_W && insidePolygon3(x * 16 + 8, y * 16 + 8, polygon);
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
function buildLiuyuanEntryObliqueStudyMap(regions = LIUYUAN_ENTRY_OBLIQUE_DRAFT_REGIONS) {
  const map = new Uint8Array(LIUYUAN_ENTRY_OBLIQUE_W * LIUYUAN_ENTRY_OBLIQUE_H);
  map.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_ENTRY_OBLIQUE_W && y < LIUYUAN_ENTRY_OBLIQUE_H) {
        map[y * LIUYUAN_ENTRY_OBLIQUE_W + x] = region.tile;
      }
    }
  }
  return {
    map,
    w: LIUYUAN_ENTRY_OBLIQUE_W,
    h: LIUYUAN_ENTRY_OBLIQUE_H,
    spawn: { ...LIUYUAN_ENTRY_OBLIQUE_SPAWN },
    obstacles: LIUYUAN_ENTRY_OBLIQUE_OBSTACLES
  };
}

// src/data/liuyuan-entry-study.ts
var LIUYUAN_ENTRY_W = 63;
var LIUYUAN_ENTRY_H = 43;
var LIUYUAN_ENTRY_SPAWN = { x: 520, y: 656 };
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

// src/data/liuyuan-flower-study.ts
var LIUYUAN_FLOWER_ID = "liuyuan-flower-work-yard-study-v3";
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
function insidePolygon4(x, y, points) {
  let inside2 = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside2 = !inside2;
  }
  return inside2;
}
function bands3(id, points, tile) {
  const result = [];
  for (let y = 0; y < LIUYUAN_FLOWER_H; y++) {
    let start = -1;
    for (let x = 0; x <= LIUYUAN_FLOWER_W; x++) {
      const open = x < LIUYUAN_FLOWER_W && insidePolygon4(x * 16 + 8, y * 16 + 8, points);
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
  ...bands3("flower-yard-floor", YARD_FLOOR, T.PATH),
  ...bands3("flower-east-passage", EAST_PASSAGE, T.CORR)
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
function buildLiuyuanFlowerStudyMap(regions = LIUYUAN_FLOWER_DRAFT_REGIONS) {
  const map = new Uint8Array(LIUYUAN_FLOWER_W * LIUYUAN_FLOWER_H);
  map.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_FLOWER_W && y < LIUYUAN_FLOWER_H) {
        map[y * LIUYUAN_FLOWER_W + x] = region.tile;
      }
    }
  }
  return {
    map,
    w: LIUYUAN_FLOWER_W,
    h: LIUYUAN_FLOWER_H,
    spawn: { ...LIUYUAN_FLOWER_SPAWN },
    obstacles: LIUYUAN_FLOWER_OBSTACLES
  };
}

// scripts/verify-scene-plate-draft.ts
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
var pond = GUANYUN_V2_GEOMETRY.find((object) => object.id === "guanyun-v2-huanyun-pond");
assert(pond?.effects?.length, "\u6D4B\u8BD5\u5E95\u56FE\u7F3A\u6C34\u7EB9\u7269\u4EF6");
var draft = {
  format: "gusu-scene-geometry",
  version: 2,
  sceneId: GUANYUN_V2_ID,
  world: { width: GUANYUN_V2_WORLD_W, height: GUANYUN_V2_WORLD_H },
  actorScalePercent: 175,
  tileRegions: GUANYUN_V2_DRAFT_REGIONS,
  objects: [{ id: pond.id, colliders: [], effects: pond.effects }]
};
var prefix = `gusu-geometry-plate:${GUANYUN_V2_ID}:`;
var record = { value: JSON.stringify(draft), savedAt: Date.now() };
Object.defineProperty(globalThis, "location", { configurable: true, value: { search: "?draft=1" } });
Object.defineProperty(globalThis, "window", { configurable: true, value: { name: prefix + JSON.stringify(record) } });
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => null } });
var loaded = readScenePlateDraft(GUANYUN_V2_ID, GUANYUN_V2_WORLD_W, GUANYUN_V2_WORLD_H, buildGuanyunV2Map);
assert(
  loaded?.geometry[0]?.effects?.[0]?.id === "guanyun-v2-huanyun-ripples",
  "\u9884\u89C8\u8349\u7A3F\u65F6\u6C34\u7EB9\u8499\u7248\u6216\u53C2\u6570\u672A\u968F\u7269\u4EF6\u8BFB\u53D6"
);
assert(
  loaded.geometry[0].effects[0].ripple.rowSpacing === pond.effects[0].ripple.rowSpacing,
  "\u9884\u89C8\u8349\u7A3F\u65F6\u6C34\u7EB9\u53C2\u6570\u4E0D\u4E00\u81F4"
);
assert(loaded.actorScalePercent === 175, "\u7F16\u8F91\u5668\u8BBE\u7F6E\u7684\u4EBA\u7269\u6BD4\u4F8B\u5E94\u8FDB\u5165\u573A\u666F\u8349\u7A3F\u9884\u89C8");
globalThis.window.name = prefix + JSON.stringify({
  value: JSON.stringify({ ...draft, actorScalePercent: void 0 }),
  savedAt: Date.now() + 1
});
assert(readScenePlateDraft(
  GUANYUN_V2_ID,
  GUANYUN_V2_WORLD_W,
  GUANYUN_V2_WORLD_H,
  buildGuanyunV2Map
)?.actorScalePercent === 100, "\u65E7\u8349\u7A3F\u672A\u8BBE\u7F6E\u4EBA\u7269\u6BD4\u4F8B\u65F6\u5E94\u4FDD\u6301\u539F\u6709 100%");
globalThis.window.name = prefix + JSON.stringify({
  value: JSON.stringify({ ...draft, actorScalePercent: 999 }),
  savedAt: Date.now() + 2
});
assert(readScenePlateDraft(
  GUANYUN_V2_ID,
  GUANYUN_V2_WORLD_W,
  GUANYUN_V2_WORLD_H,
  buildGuanyunV2Map
) === null, "\u8D8A\u754C\u7684\u4EBA\u7269\u6BD4\u4F8B\u4E0D\u80FD\u8FDB\u5165\u573A\u666F\u9884\u89C8");
globalThis.window.name = prefix + JSON.stringify({
  value: JSON.stringify({ ...draft, objects: [{ id: pond.id, effects: [{
    ...pond.effects[0],
    ripple: { ...pond.effects[0].ripple, rowSpacing: 0 }
  }] }] }),
  savedAt: Date.now() + 1
});
assert(
  readScenePlateDraft(GUANYUN_V2_ID, GUANYUN_V2_WORLD_W, GUANYUN_V2_WORLD_H, buildGuanyunV2Map) === null,
  "\u65E0\u6548\u6C34\u7EB9\u53C2\u6570\u4E0D\u5E94\u66FF\u6362\u4EE3\u7801\u4E2D\u7684\u573A\u666F\u51E0\u4F55"
);
var concaveCollider = [[700, 700], [760, 700], [760, 720], [720, 720], [720, 760], [700, 760]];
globalThis.window.name = prefix + JSON.stringify({
  value: JSON.stringify({ ...draft, objects: [{ id: "invalid-rail", colliders: [concaveCollider], effects: [] }] }),
  savedAt: Date.now() + 2
});
assert(
  readScenePlateDraft(GUANYUN_V2_ID, GUANYUN_V2_WORLD_W, GUANYUN_V2_WORLD_H, buildGuanyunV2Map) === null,
  "\u51F9\u5F62\u78B0\u649E\u8349\u7A3F\u4E0D\u5E94\u7ED5\u8FC7\u7F16\u8F91\u5668\u6821\u9A8C\u8FDB\u5165 SAT \u7269\u7406\u9884\u89C8"
);
for (const [sceneId, width, height, regions, buildMap] of [
  [
    "liuyuan-tree-court-no-water-study-v1",
    LIUYUAN_COURT_WORLD_W,
    LIUYUAN_COURT_WORLD_H,
    LIUYUAN_COURT_DRAFT_REGIONS,
    buildLiuyuanCourtStudyMap
  ],
  [
    LIUYUAN_LVYIN_ID,
    LIUYUAN_LVYIN_WORLD_W,
    LIUYUAN_LVYIN_WORLD_H,
    LIUYUAN_LVYIN_DRAFT_REGIONS,
    buildLiuyuanLvyinStudyMap
  ],
  [
    "liuyuan-lvyin-pond-pixel-study-v2",
    LIUYUAN_LVYIN_WORLD_W,
    LIUYUAN_LVYIN_WORLD_H,
    LIUYUAN_LVYIN_DRAFT_REGIONS,
    buildLiuyuanLvyinStudyMap
  ],
  [
    LIUYUAN_ENTRY_OBLIQUE_ID,
    LIUYUAN_ENTRY_OBLIQUE_WORLD_W,
    LIUYUAN_ENTRY_OBLIQUE_WORLD_H,
    LIUYUAN_ENTRY_OBLIQUE_DRAFT_REGIONS,
    buildLiuyuanEntryObliqueStudyMap
  ]
]) {
  const valid = {
    format: "gusu-scene-geometry",
    sceneId,
    world: { width, height },
    actorScalePercent: 145,
    tileRegions: regions,
    objects: []
  };
  globalThis.window.name = `gusu-geometry-plate:${sceneId}:` + JSON.stringify({
    value: JSON.stringify(valid),
    savedAt: Date.now() + 20
  });
  assert(
    readScenePlateDraft(sceneId, width, height, buildMap)?.actorScalePercent === 145,
    `${sceneId}: \u6709\u6548\u65E7\u8349\u7A3F\u7684\u4EBA\u7269\u6BD4\u4F8B\u53CA Tile \u5E94\u7EE7\u7EED\u53EF\u8BFB`
  );
  globalThis.window.name = `gusu-geometry-plate:${sceneId}:` + JSON.stringify({
    value: JSON.stringify({ ...valid, objects: [{ id: "bad-collider", colliders: [concaveCollider] }] }),
    savedAt: Date.now() + 21
  });
  assert(
    readScenePlateDraft(sceneId, width, height, buildMap) === null,
    `${sceneId}: \u51F9\u5F62\u78B0\u649E\u8349\u7A3F\u987B\u56DE\u9000\u4EE3\u7801\u51E0\u4F55\uFF0C\u4E0D\u53EF\u8FDB\u5165\u884C\u8D70\u7269\u7406`
  );
}
var entryId = "liuyuan-entrance-topology-study";
var entryDraft = {
  format: "gusu-scene-geometry",
  sceneId: entryId,
  world: { width: 1008, height: 688 },
  actorScalePercent: 120,
  tileRegions: LIUYUAN_ENTRY_DRAFT_REGIONS,
  objects: []
};
var entryRecord = (value) => `gusu-geometry-plate:${entryId}:` + JSON.stringify({
  value: JSON.stringify(value),
  savedAt: Date.now() + 30
});
globalThis.location.search = "?draft=1";
globalThis.window.name = entryRecord(entryDraft);
assert(
  readScenePlateDraft(
    entryId,
    1008,
    688,
    buildLiuyuanEntryStudyMap,
    LIUYUAN_ENTRY_REQUIRED_FEET
  )?.actorScalePercent === 120,
  "\u5165\u53E3\u6709\u6548\u8349\u7A3F\u7684\u6BD4\u4F8B\u548C Tile \u5E94\u6B63\u5E38\u8FDB\u5165\u9884\u89C8"
);
globalThis.window.name = entryRecord({ ...entryDraft, tileRegions: [
  ...LIUYUAN_ENTRY_DRAFT_REGIONS,
  { id: "blocked-corridor", x: 31, y: 24, w: 3, h: 5, tile: T.WALL }
] });
assert(
  readScenePlateDraft(
    entryId,
    1008,
    688,
    buildLiuyuanEntryStudyMap,
    LIUYUAN_ENTRY_REQUIRED_FEET
  ) === null,
  "\u5165\u53E3\u8349\u7A3F\u5373\u4F7F\u51FA\u751F\u70B9\u5B89\u5168\uFF0C\u5835\u65AD\u5939\u5F04\u4E2D\u6BB5\u4E5F\u5FC5\u987B\u56DE\u9000"
);
globalThis.window.name = entryRecord({ ...entryDraft, objects: [
  { id: "blocked-by-object", colliders: [[[490, 416], [550, 416], [550, 440], [490, 440]]] }
] });
assert(
  readScenePlateDraft(
    entryId,
    1008,
    688,
    buildLiuyuanEntryStudyMap,
    LIUYUAN_ENTRY_REQUIRED_FEET
  ) === null,
  "\u5165\u53E3\u8349\u7A3F\u7684\u65B0\u7269\u4EF6\u4E0D\u80FD\u9694\u65AD\u5FC5\u7ECF\u8DEF\u800C\u4ECD\u88AB\u8BD5\u73A9\u8F7D\u5165"
);
globalThis.window.name = entryRecord({ ...entryDraft, objects: [
  { id: "return-spawn-post", colliders: [[[425, 245], [435, 245], [435, 255], [425, 255]]] }
] });
assert(
  readScenePlateDraft(
    entryId,
    1008,
    688,
    buildLiuyuanEntryStudyMap,
    LIUYUAN_ENTRY_REQUIRED_FEET
  ) === null,
  "\u5165\u53E3\u8FD4\u7A0B\u51FA\u751F\u811A\u70B9\u5373\u4F7F\u9644\u8FD1\u6709\u53EF\u8D70\u5730\uFF0C\u4E5F\u4E0D\u80FD\u88AB\u8349\u7A3F\u7269\u4EF6\u538B\u4F4F"
);
var flowerDraft = {
  format: "gusu-scene-geometry",
  sceneId: LIUYUAN_FLOWER_ID,
  world: { width: LIUYUAN_FLOWER_WORLD_W, height: LIUYUAN_FLOWER_WORLD_H },
  tileRegions: LIUYUAN_FLOWER_DRAFT_REGIONS,
  objects: []
};
var flowerRecord = (value) => `gusu-geometry-plate:${LIUYUAN_FLOWER_ID}:` + JSON.stringify({
  value: JSON.stringify(value),
  savedAt: Date.now() + 31
});
globalThis.window.name = flowerRecord(flowerDraft);
assert(
  readScenePlateDraft(
    LIUYUAN_FLOWER_ID,
    LIUYUAN_FLOWER_WORLD_W,
    LIUYUAN_FLOWER_WORLD_H,
    buildLiuyuanFlowerStudyMap,
    LIUYUAN_FLOWER_REQUIRED_FEET
  ) !== null,
  "\u82B1\u6728\u9662\u53EF\u8D70\u8349\u7A3F\u4ECD\u5E94\u6B63\u5E38\u8BFB\u53D6"
);
globalThis.window.name = flowerRecord({ ...flowerDraft, objects: [
  { id: "cross-yard-fence", colliders: [[[900, 340], [940, 340], [940, 895], [900, 895]]] }
] });
assert(
  readScenePlateDraft(
    LIUYUAN_FLOWER_ID,
    LIUYUAN_FLOWER_WORLD_W,
    LIUYUAN_FLOWER_WORLD_H,
    buildLiuyuanFlowerStudyMap,
    LIUYUAN_FLOWER_REQUIRED_FEET
  ) === null,
  "\u82B1\u6728\u9662\u8349\u7A3F\u4E0D\u80FD\u5728\u51FA\u751F\u70B9\u4ECD\u5B89\u5168\u65F6\u9694\u65AD\u4E1C\u4FA7\u4E3B\u7EBF\u8F6C\u573A"
);
globalThis.window.name = flowerRecord({ ...flowerDraft, objects: [
  { id: "return-spawn-pot", colliders: [[[1670, 440], [1680, 440], [1680, 450], [1670, 450]]] }
] });
assert(
  readScenePlateDraft(
    LIUYUAN_FLOWER_ID,
    LIUYUAN_FLOWER_WORLD_W,
    LIUYUAN_FLOWER_WORLD_H,
    buildLiuyuanFlowerStudyMap,
    LIUYUAN_FLOWER_REQUIRED_FEET
  ) === null,
  "\u82B1\u6728\u9662\u4E1C\u4FA7\u8FD4\u7A0B\u51FA\u751F\u70B9\u4E0D\u80FD\u88AB\u8349\u7A3F\u82B1\u76C6\u76D6\u4F4F"
);
for (const [sceneId, width, height, regions, buildMap, requiredFeet] of [
  [
    "liuyuan-tree-court-no-water-study-v1",
    LIUYUAN_COURT_WORLD_W,
    LIUYUAN_COURT_WORLD_H,
    LIUYUAN_COURT_DRAFT_REGIONS,
    buildLiuyuanCourtStudyMap,
    LIUYUAN_COURT_REQUIRED_FEET
  ],
  [
    LIUYUAN_LVYIN_ID,
    LIUYUAN_LVYIN_WORLD_W,
    LIUYUAN_LVYIN_WORLD_H,
    LIUYUAN_LVYIN_DRAFT_REGIONS,
    buildLiuyuanLvyinStudyMap,
    LIUYUAN_LVYIN_REQUIRED_FEET
  ],
  [
    "liuyuan-lvyin-pond-pixel-study-v2",
    LIUYUAN_LVYIN_WORLD_W,
    LIUYUAN_LVYIN_WORLD_H,
    LIUYUAN_LVYIN_DRAFT_REGIONS,
    buildLiuyuanLvyinStudyMap,
    LIUYUAN_LVYIN_REQUIRED_FEET
  ]
]) {
  const sceneDraft = {
    format: "gusu-scene-geometry",
    sceneId,
    world: { width, height },
    tileRegions: regions,
    objects: []
  };
  const sceneRecord = (value) => `gusu-geometry-plate:${sceneId}:` + JSON.stringify({
    value: JSON.stringify(value),
    savedAt: Date.now() + 32
  });
  globalThis.window.name = sceneRecord(sceneDraft);
  assert(
    readScenePlateDraft(sceneId, width, height, buildMap, requiredFeet) !== null,
    `${sceneId}: \u9ED8\u8BA4\u94FA\u5730\u987B\u80FD\u5230\u8FBE\u5168\u90E8\u5267\u60C5\u811A\u70B9`
  );
  globalThis.window.name = sceneRecord({ ...sceneDraft, tileRegions: [
    ...regions,
    { id: "cross-scene-wall", x: 65, y: 0, w: 4, h: 56, tile: T.WALL }
  ] });
  assert(
    readScenePlateDraft(sceneId, width, height, buildMap, requiredFeet) === null,
    `${sceneId}: \u51FA\u751F\u70B9\u53EF\u7AD9\u4F46\u6A2A\u65AD\u8DEF\u5F84\u7684\u8349\u7A3F\u987B\u56DE\u9000\uFF0C\u4E0D\u80FD\u8BA9 CH3 \u5361\u5173`
  );
  const returnFoot = requiredFeet[requiredFeet.length - 1];
  const { x, y } = returnFoot;
  globalThis.window.name = sceneRecord({ ...sceneDraft, objects: [
    { id: "return-spawn-obstacle", colliders: [[[x - 5, y - 5], [x + 5, y - 5], [x + 5, y + 5], [x - 5, y + 5]]] }
  ] });
  assert(
    readScenePlateDraft(sceneId, width, height, buildMap, requiredFeet) === null,
    `${sceneId}: \u8FD4\u7A0B\u51FA\u751F\u70B9\u4E0D\u80FD\u88AB\u8349\u7A3F\u7269\u4EF6\u538B\u4F4F\uFF0C\u5373\u4F7F\u76EE\u6807\u534A\u5F84\u5185\u4ECD\u53EF\u8D70`
  );
}
var corridorId = "canglang-corridor";
var corridorPrefix = `gusu-geometry-plate:${corridorId}:`;
globalThis.location.search = "?actorDraft=1";
globalThis.window.name = corridorPrefix + JSON.stringify({
  value: JSON.stringify({
    format: "gusu-scene-geometry",
    sceneId: corridorId,
    world: { width: 793, height: 496 },
    actorScalePercent: 160,
    tileRegions: [{ id: "invalid", x: -1 }],
    objects: [{ id: "invalid" }]
  }),
  savedAt: Date.now() + 3
});
assert(
  readSceneActorScalePercent(corridorId, 793, 496) === 160,
  "\u590D\u5ECA\u5E94\u53EA\u8BFB\u53D6\u4EBA\u7269\u89C6\u89C9\u500D\u7387\uFF0C\u4E0D\u4F9D\u8D56\u672A\u63A5\u5165\u7684 Tile \u548C\u7269\u4EF6"
);
assert(
  readSceneVisualOccluders(corridorId, 793, 496) === null,
  "\u590D\u5ECA\u65E7\u8349\u7A3F\u65E0\u65B0\u7248\u906E\u6321\u7269\u4EF6\u65F6\u5E94\u56DE\u9000\u5230\u4EE3\u7801\u9ED8\u8BA4"
);
var post = CORRIDOR_POST_OCCLUDERS[0];
globalThis.window.name = corridorPrefix + JSON.stringify({
  value: JSON.stringify({
    format: "gusu-scene-geometry",
    sceneId: corridorId,
    world: { width: 793, height: 496 },
    seedRevision: 1,
    tileRegions: [{ id: "poison", x: -1 }],
    routeGraph: { nodes: null },
    objects: [{ id: post.id, colliders: [[[9999, 9999]]], occluder: post.occluder }]
  }),
  savedAt: Date.now() + 10
});
assert(
  readSceneVisualOccluders(corridorId, 793, 496)?.[0]?.id === post.id,
  "\u590D\u5ECA\u5E94\u53EA\u8BFB\u53D6\u906E\u6321\uFF0C\u5FFD\u7565\u8349\u7A3F\u4E2D\u975E\u6CD5 Tile\u3001\u78B0\u649E\u4E0E\u8DEF\u7EBF"
);
assert(
  readSceneVisualOccluders(corridorId, 800, 496) === null,
  "\u5E95\u56FE\u4E16\u754C\u5C3A\u5BF8\u53D8\u5316\u540E\u4E0D\u5E94\u6CBF\u7528\u65E7\u906E\u6321"
);
globalThis.window.name = corridorPrefix + JSON.stringify({
  value: JSON.stringify({
    format: "gusu-scene-geometry",
    sceneId: corridorId,
    world: { width: 793, height: 496 },
    seedRevision: 1,
    objects: [{ id: post.id, occluder: { depthY: 287, polygons: [[[0, 0], [900, 0], [1, 1]]] } }]
  }),
  savedAt: Date.now() + 11
});
assert(
  readSceneVisualOccluders(corridorId, 793, 496) === null,
  "\u8D8A\u754C\u906E\u6321\u88C1\u7247\u4E0D\u5E94\u8FDB\u5165\u590D\u5ECA\u9884\u89C8"
);
assert(
  readSceneActorScalePercent(corridorId, 800, 496) === null,
  "\u5E95\u56FE\u4E16\u754C\u5C3A\u5BF8\u53D8\u5316\u540E\u4E0D\u5E94\u6CBF\u7528\u65E7\u6BD4\u4F8B"
);
globalThis.location.search = "";
assert(
  readSceneActorScalePercent(corridorId, 793, 496) === null,
  "\u6B63\u5F0F\u590D\u5ECA\u8BD5\u8D70\u4E0D\u5E94\u81EA\u52A8\u8BFB\u53D6\u7F16\u8F91\u5668\u8349\u7A3F"
);
globalThis.location.search = "?actorDraft=1";
globalThis.window.name = corridorPrefix + JSON.stringify({
  value: JSON.stringify({
    format: "gusu-scene-geometry",
    sceneId: corridorId,
    world: { width: 793, height: 496 }
  }),
  savedAt: Date.now() + 4
});
assert(
  readSceneActorScalePercent(corridorId, 793, 496) === 100,
  "\u590D\u5ECA\u65E7\u8349\u7A3F\u7F3A\u5C11\u6BD4\u4F8B\u5B57\u6BB5\u65F6\u5E94\u4FDD\u6301 100%"
);
globalThis.window.name = corridorPrefix + JSON.stringify({
  value: JSON.stringify({
    format: "gusu-scene-geometry",
    sceneId: corridorId,
    world: { width: 793, height: 496 },
    actorScalePercent: 999
  }),
  savedAt: Date.now() + 5
});
assert(
  readSceneActorScalePercent(corridorId, 793, 496) === null,
  "\u8D8A\u754C\u6BD4\u4F8B\u4E0D\u5E94\u8FDB\u5165\u590D\u5ECA\u89C6\u89C9\u9884\u89C8"
);
console.log("\u573A\u666F\u8349\u7A3F\u9884\u89C8\uFF1A\u7559\u56ED\u6BD4\u4F8B\u548C\u6C34\u7EB9\u5B8C\u6574\u8BFB\u53D6\uFF0C\u5165\u53E3/\u5C0F\u5EAD/\u4E34\u6C60/\u82B1\u6728\u9662\u6709\u6548\u8349\u7A3F\u53EF\u8F7D\u5165\u3001\u65AD\u8DEF\u8349\u7A3F\u53EA\u8BFB\u56DE\u9000\uFF1B\u590D\u5ECA\u4EC5\u4EBA\u7269\u6BD4\u4F8B\u53CA\u906E\u6321\u53EF\u9884\u89C8\u3002");
