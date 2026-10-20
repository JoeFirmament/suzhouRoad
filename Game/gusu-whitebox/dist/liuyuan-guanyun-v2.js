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
    const params = new URLSearchParams(search);
    if (params.get("researchFrom") !== "stone-forest") return null;
    const x = Number(params.get("returnX"));
    const y = Number(params.get("returnY"));
    if (!params.has("returnX") || !params.has("returnY") || !Number.isFinite(x) || !Number.isFinite(y)) return null;
    const back = new URLSearchParams({
      researchFrom: source,
      returnX: String(x),
      returnY: String(y)
    });
    if (params.get("draft") === "1") back.set("draft", "1");
    if (params.get("parent") === "return-walk") back.set("parent", "return-walk");
    if (params.get("parent") === "modern-route") back.set("parent", "modern-route");
    carryLiuyuanPlaytest(back, search);
    return `liuyuan-stone-forest.html?${back}`;
  }

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
  var GUANYUN_V2_VIEW = { x: 758, y: 638 };
  var GUANYUN_V2_LEFT = { x: 361, y: 414 };
  var GUANYUN_V2_RIGHT = { x: 1180, y: 405 };
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

  // src/render/effects.ts
  function drawWaterRipples(g, regions, cam, now) {
    for (const effect of regions) {
      if (effect.kind !== "water-ripple") continue;
      const allPoints = effect.polygons.flat();
      if (!allPoints.length) continue;
      const minX = Math.min(...allPoints.map(([x]) => x));
      const maxX = Math.max(...allPoints.map(([x]) => x));
      const minY = Math.min(...allPoints.map(([, y]) => y));
      const maxY = Math.max(...allPoints.map(([, y]) => y));
      const style = effect.ripple;
      const phase = Math.floor(now / style.speedMs);
      g.save();
      g.beginPath();
      for (const polygon of [...effect.polygons, ...effect.holes ?? []]) {
        polygon.forEach(([x, y], index) => index === 0 ? g.moveTo(Math.round(x - cam.x), Math.round(y - cam.y)) : g.lineTo(Math.round(x - cam.x), Math.round(y - cam.y)));
        g.closePath();
      }
      g.clip("evenodd");
      g.fillStyle = style.color;
      for (let yy = minY + phase % 3 * 3; yy <= maxY; yy += style.rowSpacing) {
        const row = Math.floor(yy / style.rowSpacing);
        const shift = ((row * 17 + phase * 5) % style.segmentSpacing + style.segmentSpacing) % style.segmentSpacing;
        for (let xx = minX - style.segmentSpacing + shift; xx <= maxX; xx += style.segmentSpacing) {
          const span = style.maxLength - style.minLength + 1;
          const length = style.minLength + Math.abs((row * 11 + Math.floor(xx) * 3) % span);
          g.fillRect(Math.round(xx - cam.x), Math.round(yy - cam.y), length, 1);
        }
      }
      g.restore();
    }
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

  // src/liuyuan-guanyun-v2.ts
  var canvas = document.getElementById("scene");
  var ctx = canvas.getContext("2d");
  var status = document.getElementById("status");
  var stageNote = document.getElementById("stageNote");
  var showGeometry = document.getElementById("showGeometry");
  var geometryLegend = document.getElementById("geometryLegend");
  var coords = document.getElementById("coords");
  var reset = document.getElementById("reset");
  var lookButton = document.getElementById("look");
  var returnToStone = document.getElementById("returnToStone");
  var returnHref = stoneForestReturnHref(location.search, "guanyun-study");
  if (returnHref) returnToStone.href = returnHref;
  var previewRequested = new URLSearchParams(location.search).get("draft") === "1";
  var draft = readScenePlateDraft(
    GUANYUN_V2_ID,
    GUANYUN_V2_WORLD_W,
    GUANYUN_V2_WORLD_H,
    buildGuanyunV2Map
  );
  var actorScalePercent = draft?.actorScalePercent ?? 100;
  var scene = buildGuanyunV2Map(draft?.regions ?? GUANYUN_V2_DRAFT_REGIONS);
  var geometry = draft?.geometry ?? GUANYUN_V2_GEOMETRY;
  var obstacles = geometry.flatMap((object) => object.colliders ?? []);
  var effects = geometry.flatMap((object) => object.effects ?? []);
  var actor = { ...GUANYUN_V2_SPAWN, dir: 2, moving: false, walkTime: 0 };
  var keys = /* @__PURE__ */ new Set();
  var pressed = /* @__PURE__ */ new Set();
  var lastTime = 0;
  var art = new Image();
  var pixelArt = document.createElement("canvas");
  pixelArt.width = 768;
  pixelArt.height = 512;
  var pixelCtx = pixelArt.getContext("2d");
  var pixelArtReady = false;
  art.addEventListener("load", () => {
    pixelCtx.imageSmoothingEnabled = true;
    pixelCtx.drawImage(art, 0, 0, pixelArt.width, pixelArt.height);
    pixelArtReady = true;
  });
  art.src = "../assets/scene25d/liuyuan-guanyun-court-study-v2.png";
  var sprite = new Image();
  sprite.src = "../assets/characters/scholar-player-sprites-v1.png";
  function near(point, radius) {
    return Math.hypot(actor.x - point.x, actor.y - point.y) < radius;
  }
  function interact() {
    if (near(GUANYUN_V2_LEFT, 95)) {
      status.textContent = "\u897F\u5CB8\u7ED5\u5230\u6C60\u540E\uFF0C\u56DE\u8EAB\u53EF\u89C1\u5357\u4FA7\u6797\u6CC9\u8006\u7855\u4E4B\u9986\u7684\u6A90\u5F71\u3002";
      return;
    }
    if (near(GUANYUN_V2_VIEW, 135)) {
      status.textContent = "\u4ECE\u6797\u6CC9\u8006\u7855\u4E4B\u9986\u5411\u5317\u671B\uFF0C\u6D63\u4E91\u6CBC\u8FD1\uFF0C\u51A0\u4E91\u5CF0\u9AD8\uFF0C\u51A0\u4E91\u697C\u5728\u540E\u3002";
      return;
    }
    if (near(GUANYUN_V2_RIGHT, 120)) {
      status.textContent = "\u4E1C\u4FA7\u7ED5\u6C60\u540E\uFF0C\u51A0\u4E91\u5CF0\u7684\u5B54\u773C\u6362\u4E86\u5F62\uFF1B\u51FA\u5165\u53E3\u4ECD\u5F85\u6838\u3002";
      return;
    }
    if (near(GUANYUN_V2_SPAWN, 100)) {
      status.textContent = "\u6797\u6CC9\u8006\u7855\u4E4B\u9986\u7684\u6A90\u5F71\u843D\u5728\u811A\u8FB9\u3002\u8DE8\u51FA\u53BB\uFF0C\u6C60\u6C34\u3001\u77F3\u5CF0\u548C\u5317\u697C\u624D\u4E00\u5C42\u5C42\u663E\u51FA\u6765\u3002";
      return;
    }
    status.textContent = "\u77F3\u5728\u6CBC\u540E\uFF0C\u8DEF\u5728\u5CB8\u4E0A\u3002\u79BB\u8FD1\u4E9B\uFF0C\u518D\u7EC6\u770B\u3002";
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
    actor.x = GUANYUN_V2_SPAWN.x;
    actor.y = GUANYUN_V2_SPAWN.y;
    actor.dir = 2;
    keys.clear();
    pressed.clear();
    status.textContent = "\u4F60\u9000\u56DE\u6797\u6CC9\u8006\u7855\u4E4B\u9986\u5317\u5411\u6A90\u4E0B\u3002";
  });
  function tracePolygon(points) {
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
  }
  function drawGeometry() {
    ctx.save();
    ctx.globalAlpha = 0.48;
    for (let y = 0; y < scene.h; y++) for (let x = 0; x < scene.w; x++) {
      const tile = scene.map[y * scene.w + x];
      if ([T.PATH, T.CORR, T.PLAT, T.WATER].includes(tile)) {
        ctx.fillStyle = tile === T.WATER ? "#4c8dff" : tile === T.CORR ? "#27bfc2" : tile === T.PLAT ? "#f4d35e" : "#52d879";
        ctx.fillRect(x * 16, y * 16, 16, 16);
      }
    }
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = "#ef5350";
    for (const object of geometry) for (const shape of object.colliders ?? []) {
      if ("x" in shape) {
        ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
      } else {
        tracePolygon(shape.points);
        ctx.fill();
      }
    }
    ctx.restore();
    for (const effect of effects) {
      ctx.strokeStyle = "#4c8dff";
      ctx.lineWidth = 3;
      for (const polygon of effect.polygons) {
        tracePolygon(polygon);
        ctx.stroke();
      }
      ctx.strokeStyle = "#ff9d45";
      for (const polygon of effect.holes ?? []) {
        tracePolygon(polygon);
        ctx.stroke();
      }
    }
    for (const object of geometry) if (object.occluder) {
      const { polygons, depthY } = object.occluder;
      for (const polygon of polygons) {
        tracePolygon(polygon);
        ctx.strokeStyle = "#35d8e6";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      const xs = polygons.flatMap((polygon) => polygon.map(([x]) => x));
      if (!xs.length) continue;
      const left = Math.min(...xs), right = Math.max(...xs);
      ctx.strokeStyle = "#f4d35e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(left, depthY);
      ctx.lineTo(right, depthY);
      ctx.stroke();
      ctx.fillStyle = "#f4d35e";
      ctx.font = "12px monospace";
      ctx.fillText(`${object.id} \xB7 Y${depthY}`, left + 4, depthY - 5);
    }
    const p = STANDARD_PLAYER_PROFILE;
    ctx.strokeStyle = "#ff64a8";
    ctx.lineWidth = 1;
    ctx.strokeRect(actor.x - p.halfW, actor.y - p.topInset, p.halfW * 2, p.topInset - p.bottomInset);
    ctx.strokeStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(actor.x - 5, actor.y);
    ctx.lineTo(actor.x + 5, actor.y);
    ctx.moveTo(actor.x, actor.y - 5);
    ctx.lineTo(actor.x, actor.y + 5);
    ctx.stroke();
  }
  function draw() {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#c6c6b9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const zoom = 1.5, viewW = canvas.width / zoom, viewH = canvas.height / zoom;
    const cameraX = Math.max(0, Math.min(GUANYUN_V2_WORLD_W - viewW, actor.x - viewW * 0.52));
    const cameraY = Math.max(0, Math.min(GUANYUN_V2_WORLD_H - viewH, actor.y - viewH * 0.75));
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-Math.round(cameraX), -Math.round(cameraY));
    if (art.complete && art.naturalWidth) ctx.drawImage(
      pixelArtReady ? pixelArt : art,
      0,
      0,
      GUANYUN_V2_WORLD_W,
      GUANYUN_V2_WORLD_H
    );
    drawWaterRipples(ctx, effects, { x: 0, y: 0 }, performance.now());
    const scholarHeight = Math.round(perspectiveScholarHeight(actor.y, 300, 950, 56, 82) * actorScalePercent / 100);
    drawScholarGroundShadow(ctx, actor.x, actor.y, scholarHeight);
    if (sprite.complete && sprite.naturalWidth) {
      const frame = actor.moving ? 1 + Math.floor(actor.walkTime * 6) % 2 : 0;
      drawScholarAtFoot(ctx, sprite, actor.dir, frame, actor.x, actor.y, scholarHeight);
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
      ctx.drawImage(
        pixelArtReady ? pixelArt : art,
        0,
        0,
        GUANYUN_V2_WORLD_W,
        GUANYUN_V2_WORLD_H
      );
      ctx.restore();
    }
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
      actor.dir = dy > 0 ? 0 : dy < 0 ? 3 : dx > 0 ? 2 : 1;
      actor.walkTime += dt;
      const length = Math.hypot(dx, dy);
      moveEntity(scene.map, actor, dx / length * 95 * dt, dy / length * 95 * dt, scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE);
    }
    stageNote.textContent = near(GUANYUN_V2_VIEW, 145) ? "\u5357\u5385\u5728\u8EAB\u540E\uFF0C\u6D63\u4E91\u6CBC\u4E0E\u51A0\u4E91\u5CF0\u4F9D\u6B21\u5728\u524D\u3002" : near(GUANYUN_V2_LEFT, 120) ? "\u5DE6\u4FA7\u5CB8\u8DEF\u5C1A\u5F85\u5B9E\u666F\u6838\u5BF9\u3002" : near(GUANYUN_V2_RIGHT, 145) ? "\u53F3\u4FA7\u5CB8\u8DEF\u5C1A\u5F85\u5B9E\u666F\u6838\u5BF9\u3002" : "\u4ECE\u5357\u5385\u51FA\uFF0C\u5148\u5230\u6CBC\u524D\uFF0C\u518D\u6CBF\u4E24\u5CB8\u7F13\u7F13\u7ED5\u884C\u3002";
    coords.hidden = !showGeometry.checked;
    geometryLegend.hidden = !showGeometry.checked;
    if (showGeometry.checked) coords.textContent = `\u811A\u70B9 (${Math.round(actor.x)}, ${Math.round(actor.y)})`;
    draw();
    requestAnimationFrame(tick);
  }
  if (previewRequested && !draft) status.textContent = "\u6CA1\u6709\u627E\u5230\u53EF\u7528\u8349\u7A3F\uFF0C\u6B63\u663E\u793A\u4EE3\u7801\u4E2D\u7684\u573A\u666F\u51E0\u4F55\u3002";
  if (draft) status.textContent = "\u6B63\u5728\u9884\u89C8\u7F16\u8F91\u5668\u8349\u7A3F\uFF1B\u94FA\u5730\u3001\u5CF0\u77F3\u4E0E\u906E\u6321\u5DF2\u540C\u6B65\u3002";
  if (collides(scene.map, actor.x, actor.y, scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE)) {
    status.textContent = "\u51FA\u751F\u70B9\u88AB\u5F53\u524D\u51E0\u4F55\u5C01\u4F4F\uFF0C\u8BF7\u56DE\u7F16\u8F91\u5668\u68C0\u67E5\u3002";
  }
  requestAnimationFrame(tick);
})();
