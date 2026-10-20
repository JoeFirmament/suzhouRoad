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

  // src/core/liuyuan-window-study.ts
  var WINDOW_STUDY_X = {
    west: 123,
    middle: 480,
    east: 843
  };
  var WINDOW_STUDY_ORDER = ["west", "middle", "east"];
  function newWindowStudy() {
    return { inspected: /* @__PURE__ */ new Set(), solved: false };
  }
  function nearestWindow(x) {
    return WINDOW_STUDY_ORDER.reduce(
      (best, view) => Math.abs(x - WINDOW_STUDY_X[view]) < Math.abs(x - WINDOW_STUDY_X[best]) ? view : best,
      "middle"
    );
  }
  function inspectWindow(state2, view) {
    const inspected = new Set(state2.inspected);
    inspected.add(view);
    const line = view === "middle" ? "\u4E2D\u7A97\u7684\u8FB9\u591A\u6298\u4E86\u4E24\u89D2\u3002\u85E4\u5F71\u642D\u5728\u77F3\u4E0A\uFF0C\u8549\u53F6\u4E0D\u5728\u8FD9\u91CC\u3002" : view === "east" ? "\u8FD9\u6247\u4E5F\u662F\u516D\u89D2\u3002\u7A97\u540E\u7EC6\u7AFF\u6709\u8282\uFF0C\u53F6\u7A84\uFF0C\u98CE\u8FC7\u65F6\u4E00\u9F50\u4F4E\u5934\u3002" : "\u8FD9\u6247\u540C\u6837\u516D\u89D2\u3002\u7A97\u540E\u53F6\u7247\u9614\u5927\uFF0C\u4E00\u6839\u4E3B\u8109\u628A\u5B83\u5206\u6210\u4E24\u534A\u3002";
    return { state: { inspected, solved: state2.solved }, line, kind: "observation" };
  }
  function noteWindow(state2, view) {
    if (state2.solved) return { state: state2, line: "\u7EB8\u89D2\u5DF2\u8BB0\u4E0B\u90A3\u6247\u7A97\u3002\u4F60\u8FD8\u53EF\u4EE5\u56DE\u8EAB\u91CD\u65B0\u770B\u3002", kind: "solved" };
    if (state2.inspected.size < 3) {
      return { state: state2, line: "\u7EB8\u4E0A\u4E09\u9053\u7A97\u5F71\u8FD8\u5DEE\u4E00\u5904\u3002\u518D\u8D70\u51E0\u6B65\uFF0C\u522B\u53EA\u8BA4\u7A97\u6846\u3002", kind: "need-comparison" };
    }
    if (view === "middle") {
      return { state: state2, line: "\u4E2D\u95F4\u7684\u77F3\u4E0E\u85E4\u53EA\u5E2E\u4F60\u8BA4\u65B9\u5411\uFF1B\u7EB8\u4E0A\u7F3A\u7684\u662F\u4E24\u4FA7\u7684\u4E00\u7247\u53F6\u3002", kind: "wrong" };
    }
    if (view === "east") {
      return { state: state2, line: "\u8FD9\u4E00\u4FA7\u53F6\u7EC6\uFF0C\u7AFF\u6709\u8282\u3002\u7EB8\u89D2\u4E0A\u90A3\u9053\u9614\u53F6\u8109\u4E0D\u5728\u8FD9\u91CC\u3002", kind: "wrong" };
    }
    return {
      state: { inspected: state2.inspected, solved: true },
      line: "\u4E24\u6247\u516D\u89D2\u7A97\u5E76\u65E0\u9AD8\u4E0B\uFF1B\u4E0D\u540C\u7684\u662F\u7A97\u540E\u7684\u7AF9\u4E0E\u8549\u3002\u4F60\u5728\u7EB8\u4E0A\u8BB0\u4E0B\u8549\u5F71\uFF0C\u5B9E\u9645\u53BB\u8DEF\u4ECD\u8981\u7ED5\u9662\u5BFB\u627E\u3002",
      kind: "solved"
    };
  }

  // src/core/liuyuan-shadow-beat.ts
  var SHADOW_TARGETS = [0.28, 0.71, 0.44];
  var SHADOW_TOTAL_BEATS = SHADOW_TARGETS.length;
  function newShadowBeat() {
    return { phase: 0, beats: 0, misses: 0, complete: false };
  }
  function shadowPosition(state2) {
    return state2.phase <= 1 ? state2.phase : 2 - state2.phase;
  }
  function advanceShadowBeat(state2, dt, slow = false) {
    if (state2.complete) return state2;
    const speed = slow ? 0.38 : 0.86;
    return { ...state2, phase: (state2.phase + Math.max(0, dt) * speed) % 2 };
  }
  function strikeShadowBeat(state2, slow = false) {
    if (state2.complete) return { state: state2, hit: true };
    const tolerance = slow ? 0.13 : 0.085;
    const hit = Math.abs(shadowPosition(state2) - SHADOW_TARGETS[state2.beats]) <= tolerance;
    if (!hit) return { state: { ...state2, beats: 0, misses: state2.misses + 1 }, hit: false };
    const beats = state2.beats + 1;
    return { state: { ...state2, beats, complete: beats === SHADOW_TOTAL_BEATS }, hit: true };
  }

  // src/core/liuyuan-playtest.ts
  function isLiuyuanPlaytest(search) {
    const current = search ?? (typeof location === "undefined" ? "" : location.search);
    return new URLSearchParams(current).get("playtest") === "1";
  }
  function carryLiuyuanPlaytest(query, search) {
    if (isLiuyuanPlaytest(search)) query.set("playtest", "1");
  }

  // src/core/liuyuan-research-link.ts
  function stoneForestReturnHref(search, source = "window-study") {
    const params2 = new URLSearchParams(search);
    if (params2.get("researchFrom") !== "stone-forest") return null;
    const x = Number(params2.get("returnX"));
    const y = Number(params2.get("returnY"));
    if (!params2.has("returnX") || !params2.has("returnY") || !Number.isFinite(x) || !Number.isFinite(y)) return null;
    const back = new URLSearchParams({
      researchFrom: source,
      returnX: String(x),
      returnY: String(y)
    });
    if (params2.get("draft") === "1") back.set("draft", "1");
    if (params2.get("parent") === "return-walk") back.set("parent", "return-walk");
    if (params2.get("parent") === "modern-route") back.set("parent", "modern-route");
    carryLiuyuanPlaytest(back, search);
    return `liuyuan-stone-forest.html?${back}`;
  }

  // src/data/liuyuan-window-room-study.ts
  var LIUYUAN_WINDOW_ROOM_ID = "liuyuan-dongtian-three-windows-study-v1";
  var LIUYUAN_WINDOW_ROOM_W = 60;
  var LIUYUAN_WINDOW_ROOM_H = 34;
  var LIUYUAN_WINDOW_ROOM_WORLD_W = 960;
  var LIUYUAN_WINDOW_ROOM_WORLD_H = 544;
  var LIUYUAN_WINDOW_ROOM_SPAWN = { x: 480, y: 488 };
  var LIUYUAN_WINDOW_ROOM_FEET = {
    west: { x: 123, y: 448 },
    middle: { x: 480, y: 448 },
    east: { x: 843, y: 448 }
  };
  var LIUYUAN_WINDOW_ROOM_ACTOR_SCALE = {
    farFootY: 416,
    nearFootY: 528,
    farHeight: 145,
    nearHeight: 175,
    centralWindowVisualHeight: 176
  };
  var LIUYUAN_WINDOW_ROOM_DRAFT_REGIONS = [
    { id: "dongtian-walk-floor", x: 2, y: 26, w: 56, h: 7, tile: T.CORR }
  ];
  var LIUYUAN_WINDOW_ROOM_GEOMETRY = [
    { id: "dongtian-room-objects", colliders: [] }
  ];
  function buildLiuyuanWindowRoomStudyMap(regions = LIUYUAN_WINDOW_ROOM_DRAFT_REGIONS) {
    const map = new Uint8Array(LIUYUAN_WINDOW_ROOM_W * LIUYUAN_WINDOW_ROOM_H);
    map.fill(T.WALL);
    for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
      for (let x = region.x; x < region.x + region.w; x++) {
        if (x >= 0 && y >= 0 && x < LIUYUAN_WINDOW_ROOM_W && y < LIUYUAN_WINDOW_ROOM_H) {
          map[y * LIUYUAN_WINDOW_ROOM_W + x] = region.tile;
        }
      }
    }
    return {
      map,
      w: LIUYUAN_WINDOW_ROOM_W,
      h: LIUYUAN_WINDOW_ROOM_H,
      spawn: { ...LIUYUAN_WINDOW_ROOM_SPAWN },
      obstacles: []
    };
  }

  // src/render/scholar-sprite.ts
  var SHEN_YANQIU_FRAMES = [
    [
      { sx: 156, sy: 25, sw: 172, sh: 350 },
      { sx: 455, sy: 25, sw: 172, sh: 354 },
      { sx: 755, sy: 25, sw: 173, sh: 354 }
    ],
    [
      { sx: 160, sy: 387, sw: 172, sh: 346 },
      { sx: 458, sy: 387, sw: 175, sh: 346 },
      { sx: 761, sy: 387, sw: 167, sh: 346 }
    ],
    [
      { sx: 147, sy: 741, sw: 178, sh: 333 },
      { sx: 453, sy: 741, sw: 183, sh: 332 },
      { sx: 752, sy: 741, sw: 178, sh: 333 }
    ],
    [
      { sx: 157, sy: 1081, sw: 176, sh: 330 },
      { sx: 453, sy: 1081, sw: 176, sh: 331 },
      { sx: 753, sy: 1080, sw: 178, sh: 334 }
    ]
  ];
  function shenYanqiuFrame(direction, phase) {
    return SHEN_YANQIU_FRAMES[Math.max(0, Math.min(3, Math.floor(direction)))][Math.max(0, Math.min(2, Math.floor(phase)))];
  }
  function perspectiveScholarHeight(footY, farY, nearY, farHeight, nearHeight) {
    const t = Math.max(0, Math.min(1, (footY - farY) / (nearY - farY)));
    return Math.round(farHeight + (nearHeight - farHeight) * t);
  }
  function drawSpriteFrameAtFoot(ctx2, sprite, frame, footX, footY, height) {
    const drawnHeight = Math.round(height);
    const drawnWidth = Math.round(drawnHeight * frame.sw / frame.sh);
    ctx2.drawImage(
      sprite,
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
  function drawShenYanqiuAtFoot(ctx2, sprite, direction, phase, footX, footY, height) {
    drawSpriteFrameAtFoot(ctx2, sprite, shenYanqiuFrame(direction, phase), footX, footY, height);
  }
  function drawScholarGroundShadow(ctx2, footX, footY, height) {
    const x = Math.round(footX), y = Math.round(footY);
    const outer = Math.round(height * 0.4), inner = Math.round(height * 0.29);
    ctx2.fillStyle = "rgba(19, 27, 21, .12)";
    ctx2.fillRect(x - Math.floor(outer / 2), y - 3, outer, 5);
    ctx2.fillStyle = "rgba(19, 27, 21, .23)";
    ctx2.fillRect(x - Math.floor(inner / 2), y - 2, inner, 3);
  }

  // src/liuyuan-window-study.ts
  var canvas = document.getElementById("view");
  var ctx = canvas.getContext("2d");
  var story = document.getElementById("story");
  var shadowGame = document.getElementById("shadowGame");
  var shadowTarget = document.getElementById("shadowTarget");
  var shadowMarker = document.getElementById("shadowMarker");
  var shadowProgress = document.getElementById("shadowProgress");
  var shadowSlow = document.getElementById("shadowSlow");
  var params = new URLSearchParams(location.search);
  var returnStone = document.getElementById("returnStone");
  var returnHref = stoneForestReturnHref(location.search);
  if (returnHref) {
    returnStone.href = returnHref;
    returnStone.hidden = false;
  }
  var previewRequested = params.get("draft") === "1";
  var debugGeometry = params.get("debug") === "geometry";
  var draft = readScenePlateDraft(
    LIUYUAN_WINDOW_ROOM_ID,
    LIUYUAN_WINDOW_ROOM_WORLD_W,
    LIUYUAN_WINDOW_ROOM_WORLD_H,
    buildLiuyuanWindowRoomStudyMap
  );
  var actorScalePercent = draft?.actorScalePercent ?? 100;
  var scene = buildLiuyuanWindowRoomStudyMap(draft?.regions ?? LIUYUAN_WINDOW_ROOM_DRAFT_REGIONS);
  var geometry = draft?.geometry ?? LIUYUAN_WINDOW_ROOM_GEOMETRY;
  var obstacles = geometry.flatMap((object) => object.colliders ?? []);
  var actor = { ...LIUYUAN_WINDOW_ROOM_SPAWN, dir: 0, moving: false, walkTime: 0 };
  var pressed = /* @__PURE__ */ new Set();
  var state = newWindowStudy();
  var shadow = null;
  var last = 0;
  shadowSlow.checked = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function drawShadow() {
    if (!shadow) return;
    const tolerance = shadowSlow.checked ? 0.13 : 0.085;
    shadowTarget.style.left = `${SHADOW_TARGETS[shadow.beats] * 100}%`;
    shadowTarget.style.width = `${tolerance * 200}%`;
    shadowMarker.style.left = `${shadowPosition(shadow) * 100}%`;
    shadowProgress.textContent = `${shadow.beats} / ${SHADOW_TOTAL_BEATS}`;
  }
  function closeShadow() {
    shadow = null;
    shadowGame.hidden = true;
  }
  function leaveShadow() {
    if (!shadow) return;
    closeShadow();
    story.textContent = "\u4F60\u653E\u4E0B\u7EB8\u89D2\u3002\u4E09\u5904\u7A97\u666F\u8FD8\u8BB0\u5F97\uFF0C\u968F\u65F6\u53EF\u4EE5\u518D\u8BD5\u3002";
  }
  var art = new Image();
  var pixelArt = document.createElement("canvas");
  pixelArt.width = 480;
  pixelArt.height = 272;
  var pixelCtx = pixelArt.getContext("2d");
  var pixelArtReady = false;
  art.addEventListener("load", () => {
    pixelCtx.imageSmoothingEnabled = true;
    pixelCtx.drawImage(art, 0, 0, pixelArt.width, pixelArt.height);
    pixelArtReady = true;
  });
  art.addEventListener("error", () => {
    story.textContent = "\u4E09\u7A97\u5E95\u56FE\u672A\u80FD\u8F7D\u5165\uFF0C\u8BF7\u68C0\u67E5\u7814\u7A76\u56FE\u7247\u8DEF\u5F84\u3002";
  });
  art.src = "../research-art/liuyuan-dongtian-three-windows-game-study-v2.png";
  var scholar = new Image();
  scholar.src = "../assets/characters/shen-yanqiu-sprites-v1.png";
  function nearestFoot() {
    return nearestWindow(actor.x);
  }
  function nearWindow() {
    const view = nearestFoot();
    const foot = LIUYUAN_WINDOW_ROOM_FEET[view];
    return Math.hypot(actor.x - foot.x, actor.y - foot.y) <= 42 ? view : null;
  }
  function inspect() {
    if (shadow) {
      story.textContent = "\u5148\u628A\u7EB8\u89D2\u4E0A\u7684\u4E09\u9053\u8BB0\u53F7\u5BF9\u597D\uFF1B\u6309 Esc \u53EF\u653E\u4E0B\u7EB8\u89D2\u3002";
      return;
    }
    const view = nearWindow();
    if (!view) {
      story.textContent = "\u518D\u5F80\u7A97\u524D\u8D70\u4E24\u6B65\uFF0C\u666F\u624D\u770B\u5F97\u771F\u5207\u3002";
      return;
    }
    actor.dir = view === "west" ? 1 : view === "east" ? 2 : 3;
    const result = inspectWindow(state, view);
    state = result.state;
    story.textContent = result.line;
  }
  function note() {
    if (shadow) {
      const result2 = strikeShadowBeat(shadow, shadowSlow.checked);
      shadow = result2.state;
      if (!result2.hit) story.textContent = "\u5F71\u5B50\u9519\u5F00\u4E86\u3002\u624B\u522B\u6025\uFF0C\u4E09\u9053\u8BB0\u53F7\u4ECE\u5934\u518D\u5BF9\uFF1B\u7A97\u4E0D\u5FC5\u91CD\u770B\u3002";
      else if (!shadow.complete) story.textContent = `\u5BF9\u4E0A\u4E86\u7B2C ${shadow.beats} \u9053\u3002\u7B49\u4E0B\u4E00\u9053\u8BB0\u53F7\u5165\u6846\u3002`;
      else {
        state = noteWindow(state, "west").state;
        closeShadow();
        story.textContent = "\u4E09\u9053\u5F71\u5B50\u7EC8\u4E8E\u53E0\u5408\u3002\u4F60\u5728\u7EB8\u4E0A\u8BB0\u4E0B\u897F\u4FA7\u8549\u53F6\uFF1A\u770B\u4F3C\u76F8\u540C\u7684\u516D\u89D2\u7A97\uFF0C\u7A97\u540E\u5374\u662F\u4E0D\u540C\u7684\u666F\u3002\u771F\u6B63\u53BB\u8DEF\u8FD8\u987B\u7ED5\u9662\u5BFB\u627E\u3002";
      }
      drawShadow();
      return;
    }
    const view = nearWindow();
    if (!view) {
      story.textContent = "\u5148\u9760\u8FD1\u4E00\u6247\u7A97\uFF0C\u518D\u628A\u6240\u89C1\u8BB0\u5728\u7EB8\u89D2\u4E0A\u3002";
      return;
    }
    actor.dir = view === "west" ? 1 : view === "east" ? 2 : 3;
    const result = noteWindow(state, view);
    if (result.kind === "solved" && !state.solved) {
      shadow = newShadowBeat();
      shadowGame.hidden = false;
      story.textContent = "\u662F\u897F\u4FA7\u7684\u8549\u53F6\u3002\u4F60\u628A\u7EB8\u89D2\u4E3E\u5230\u5149\u91CC\uFF0C\u7B49\u4E09\u9053\u8BB0\u53F7\u9010\u4E00\u5BF9\u4E0A\u3002";
      drawShadow();
      return;
    }
    state = result.state;
    story.textContent = result.line;
  }
  function drawDebugGeometry() {
    ctx.save();
    ctx.globalAlpha = 0.35;
    for (let y = 0; y < scene.h; y++) for (let x = 0; x < scene.w; x++) {
      if (scene.map[y * scene.w + x] !== T.WALL) {
        ctx.fillStyle = "#34d8b4";
        ctx.fillRect(x * 16, y * 16, 16, 16);
      }
    }
    ctx.globalAlpha = 1;
    for (const foot of Object.values(LIUYUAN_WINDOW_ROOM_FEET)) {
      ctx.strokeStyle = "#b7ed77";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(foot.x, foot.y, 42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#f6f2cc";
      ctx.fillRect(foot.x - 2, foot.y - 2, 4, 4);
    }
    ctx.strokeStyle = "#ff5d9b";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      actor.x - STANDARD_PLAYER_PROFILE.halfW,
      actor.y - STANDARD_PLAYER_PROFILE.topInset,
      STANDARD_PLAYER_PROFILE.halfW * 2,
      STANDARD_PLAYER_PROFILE.topInset - STANDARD_PLAYER_PROFILE.bottomInset
    );
    const scale = LIUYUAN_WINDOW_ROOM_ACTOR_SCALE;
    const height = Math.round(perspectiveScholarHeight(
      actor.y,
      scale.farFootY,
      scale.nearFootY,
      scale.farHeight,
      scale.nearHeight
    ) * actorScalePercent / 100);
    ctx.fillStyle = "#19251ee6";
    ctx.fillRect(12, 12, 340, 30);
    ctx.fillStyle = "#f3e6bd";
    ctx.font = "15px monospace";
    ctx.fillText(`actor ${height}px / middle window ~${scale.centralWindowVisualHeight}px`, 21, 32);
    ctx.restore();
  }
  function draw() {
    ctx.imageSmoothingEnabled = false;
    if (pixelArtReady) ctx.drawImage(pixelArt, 0, 0, canvas.width, canvas.height);
    else {
      ctx.fillStyle = "#6c7164";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    for (const view of state.inspected) {
      const foot = LIUYUAN_WINDOW_ROOM_FEET[view];
      ctx.fillStyle = "#ddc68c";
      ctx.fillRect(foot.x - 3, foot.y + 10, 6, 2);
    }
    const active = nearWindow();
    if (active) {
      const foot = LIUYUAN_WINDOW_ROOM_FEET[active];
      ctx.fillStyle = "#e8cf91";
      ctx.fillRect(foot.x - 11, foot.y + 14, 22, 2);
    }
    const scale = LIUYUAN_WINDOW_ROOM_ACTOR_SCALE;
    const height = Math.round(perspectiveScholarHeight(
      actor.y,
      scale.farFootY,
      scale.nearFootY,
      scale.farHeight,
      scale.nearHeight
    ) * actorScalePercent / 100);
    drawScholarGroundShadow(ctx, actor.x, actor.y, height);
    if (scholar.complete && scholar.naturalWidth) {
      const frame = actor.moving ? 1 + Math.floor(actor.walkTime * 6) % 2 : 0;
      drawShenYanqiuAtFoot(ctx, scholar, actor.dir, frame, actor.x, actor.y, height);
    }
    if (debugGeometry) drawDebugGeometry();
  }
  function bindHold(id, direction) {
    const button = document.getElementById(id);
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      pressed.add(direction);
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
      button.addEventListener(type, () => pressed.delete(direction));
  }
  bindHold("moveUp", "up");
  bindHold("moveLeft", "left");
  bindHold("moveDown", "down");
  bindHold("moveRight", "right");
  document.getElementById("inspect").addEventListener("click", inspect);
  document.getElementById("note").addEventListener("click", note);
  document.getElementById("shadowLeave").addEventListener("click", leaveShadow);
  document.getElementById("restart").addEventListener("click", () => {
    actor.x = LIUYUAN_WINDOW_ROOM_SPAWN.x;
    actor.y = LIUYUAN_WINDOW_ROOM_SPAWN.y;
    actor.dir = 0;
    actor.moving = false;
    actor.walkTime = 0;
    state = newWindowStudy();
    pressed.clear();
    closeShadow();
    story.textContent = "\u7EB8\u89D2\u4E0A\u4ECD\u662F\u4E09\u9053\u7A97\u5F71\u3002\u4F60\u9000\u56DE\u5C4B\u4E2D\uFF0C\u518D\u4ECE\u5934\u770B\u4E00\u904D\u3002";
  });
  var keyDirections = {
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
    if (event.target instanceof HTMLInputElement && (key === " " || key.startsWith("arrow"))) return;
    if (event.target instanceof HTMLButtonElement && key === " ") return;
    if (keyDirections[key] || key === "e" || key === " " || key === "escape") event.preventDefault();
    if (key === "escape" && shadow) {
      leaveShadow();
      return;
    }
    if ((key === "e" || key === " ") && !event.repeat) {
      key === "e" ? inspect() : note();
      return;
    }
    if (keyDirections[key]) pressed.add(keyDirections[key]);
  });
  window.addEventListener("keyup", (event) => {
    const direction = keyDirections[event.key.toLowerCase()];
    if (direction) pressed.delete(direction);
  });
  window.addEventListener("blur", () => pressed.clear());
  function tick(now) {
    const dt = Math.min(0.05, (now - (last || now)) / 1e3);
    last = now;
    if (shadow) {
      shadow = advanceShadowBeat(shadow, dt, shadowSlow.checked);
      drawShadow();
    }
    const dx = Number(pressed.has("right")) - Number(pressed.has("left"));
    const dy = Number(pressed.has("down")) - Number(pressed.has("up"));
    if (!shadow && (dx !== 0 || dy !== 0)) {
      actor.dir = dy > 0 ? 0 : dy < 0 ? 3 : dx > 0 ? 2 : 1;
      const length = Math.hypot(dx, dy);
      const beforeX = actor.x, beforeY = actor.y;
      moveEntity(
        scene.map,
        actor,
        dx / length * 190 * dt,
        dy / length * 190 * dt,
        scene.w,
        scene.h,
        obstacles,
        STANDARD_PLAYER_PROFILE
      );
      actor.moving = actor.x !== beforeX || actor.y !== beforeY;
      if (actor.moving) actor.walkTime += dt;
    } else {
      actor.moving = false;
    }
    draw();
    requestAnimationFrame(tick);
  }
  if (previewRequested && !draft) story.textContent = "\u5C1A\u65E0\u53EF\u7528\u7684\u7F16\u8F91\u5668\u8349\u7A3F\uFF1B\u5148\u6309\u8FD9\u5F20\u7814\u7A76\u56FE\u7684\u9ED8\u8BA4\u811A\u70B9\u8D70\u4E00\u904D\u3002";
  if (draft) story.textContent = "\u4F60\u6B63\u5728\u8BD5\u8D70\u7F16\u8F91\u5668\u8349\u7A3F\u3002\u4E09\u7A97\u7684\u4F4D\u7F6E\u4ECD\u987B\u7531\u5B9E\u666F\u4E0E\u5E74\u4EE3\u8BC1\u636E\u590D\u6838\u3002";
  if (collides(scene.map, actor.x, actor.y, scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE))
    story.textContent = "\u51FA\u751F\u70B9\u88AB\u8349\u7A3F\u51E0\u4F55\u6321\u4F4F\u4E86\uFF0C\u8BF7\u56DE\u7F16\u8F91\u5668\u68C0\u67E5\u3002";
  requestAnimationFrame(tick);
})();
