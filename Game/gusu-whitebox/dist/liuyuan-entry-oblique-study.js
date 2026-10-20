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
    for (const polygon2 of [a, b]) {
      for (let index = 0; index < polygon2.length; index++) {
        const p = polygon2[index], q = polygon2[(index + 1) % polygon2.length];
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
  var LIUYUAN_ENTRY_OBLIQUE_ACTOR_SCALE = {
    farFootY: 180,
    nearFootY: 915,
    farHeight: 105,
    nearHeight: 160
  };
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
  function insidePolygon(x, y, polygon2) {
    let inside = false;
    for (let i = 0, j = polygon2.length - 1; i < polygon2.length; j = i++) {
      const [xi, yi] = polygon2[i], [xj, yj] = polygon2[j];
      if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function rowBands(id, polygon2, tile) {
    const rows = [];
    for (let y = 0; y < LIUYUAN_ENTRY_OBLIQUE_H; y++) {
      let start = -1;
      for (let x = 0; x <= LIUYUAN_ENTRY_OBLIQUE_W; x++) {
        const open = x < LIUYUAN_ENTRY_OBLIQUE_W && insidePolygon(x * 16 + 8, y * 16 + 8, polygon2);
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
  function drawSpriteFrameAtFoot(ctx2, sprite2, frame2, footX, footY, height) {
    const drawnHeight = Math.round(height);
    const drawnWidth = Math.round(drawnHeight * frame2.sw / frame2.sh);
    ctx2.drawImage(
      sprite2,
      frame2.sx,
      frame2.sy,
      frame2.sw,
      frame2.sh,
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

  // src/liuyuan-entry-oblique-study.ts
  var canvas = document.getElementById("scene");
  var ctx = canvas.getContext("2d");
  var status = document.getElementById("status");
  var showGeometry = document.getElementById("showGeometry");
  var coords = document.getElementById("coords");
  var restart = document.getElementById("restart");
  var look = document.getElementById("look");
  var touchLook = document.getElementById("touchLook");
  var previewRequested = new URLSearchParams(location.search).get("draft") === "1";
  var draft = readScenePlateDraft(
    LIUYUAN_ENTRY_OBLIQUE_ID,
    LIUYUAN_ENTRY_OBLIQUE_WORLD_W,
    LIUYUAN_ENTRY_OBLIQUE_WORLD_H,
    buildLiuyuanEntryObliqueStudyMap
  );
  var actorScalePercent = draft?.actorScalePercent ?? 100;
  var scene = buildLiuyuanEntryObliqueStudyMap(draft?.regions ?? LIUYUAN_ENTRY_OBLIQUE_DRAFT_REGIONS);
  var geometry = draft?.geometry ?? LIUYUAN_ENTRY_OBLIQUE_GEOMETRY;
  var obstacles = geometry.flatMap((object) => object.colliders ?? []);
  var actor = {
    x: Number(LIUYUAN_ENTRY_OBLIQUE_SPAWN.x),
    y: Number(LIUYUAN_ENTRY_OBLIQUE_SPAWN.y),
    dir: 3,
    moving: false,
    walkTime: 0
  };
  var art = new Image();
  art.addEventListener("error", () => {
    status.textContent = "\u955C\u5934\u5019\u9009\u56FE\u672A\u8F7D\u5165\uFF0C\u8BF7\u68C0\u67E5\u8DEF\u5F84\u3002";
  });
  art.src = "../research-art/liuyuan-entry-oblique-pixel-study-v1.png";
  var sprite = new Image();
  sprite.src = "../assets/characters/scholar-player-sprites-v1.png";
  var keys = /* @__PURE__ */ new Set();
  var pressed = /* @__PURE__ */ new Set();
  var lastTime = 0;
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
  function near(point, radius) {
    return Math.hypot(actor.x - point.x, actor.y - point.y) <= radius;
  }
  function inspect() {
    status.textContent = near(LIUYUAN_ENTRY_OBLIQUE_FEET.stop, 95) ? "\u8FD9\u4E00\u955C\u5230\u6B64\u4E3A\u6B62\u3002\u53E4\u6728\u4EA4\u67EF\u5C0F\u5EAD\u53E6\u6709\u53EF\u8D70\u753B\u9762\uFF1B\u4E24\u5F20\u56FE\u7684\u771F\u5B9E\u95E8\u8DEF\u5C1A\u672A\u62FC\u63A5\u3002" : near(LIUYUAN_ENTRY_OBLIQUE_FEET.threshold, 85) ? "\u95E8\u6A90\u538B\u4F4E\u4E86\u5149\u3002\u67F1\u811A\u4E4B\u5916\u624D\u662F\u77F3\u8DEF\uFF0C\u522B\u4ECE\u74E6\u9762\u7A7F\u8FC7\u53BB\u3002" : "\u5899\u8FB9\u6E10\u6709\u5929\u5149\u3002\u5148\u770B\u811A\u4E0B\u54EA\u5904\u77F3\u5730\u771F\u6B63\u76F8\u8FDE\u3002";
  }
  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key === "e" || key === " ") {
      event.preventDefault();
      if (!event.repeat) inspect();
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
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
      button.addEventListener(type, () => pressed.delete(direction));
  }
  look.addEventListener("click", inspect);
  touchLook.addEventListener("click", inspect);
  restart.addEventListener("click", () => {
    actor.x = LIUYUAN_ENTRY_OBLIQUE_SPAWN.x;
    actor.y = LIUYUAN_ENTRY_OBLIQUE_SPAWN.y;
    actor.dir = 3;
    actor.moving = false;
    actor.walkTime = 0;
    keys.clear();
    pressed.clear();
    status.textContent = "\u56DE\u5230\u95E8\u5916\u3002\u8FD9\u4E2A\u955C\u5934\u53EA\u6821\u5E95\u56FE\u3001\u4E66\u751F\u6BD4\u4F8B\u4E0E\u8F6E\u5ED3\u3002";
  });
  function polygon(points) {
    points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
  }
  function drawDebug() {
    ctx.save();
    ctx.globalAlpha = 0.42;
    for (let y = 0; y < scene.h; y++) for (let x = 0; x < scene.w; x++) {
      const tile = scene.map[y * scene.w + x];
      if (tile === T.PATH || tile === T.CORR) {
        ctx.fillStyle = tile === T.PATH ? "#5cce8d" : "#3bd1d6";
        ctx.fillRect(x * 16, y * 16, 16, 16);
      }
    }
    ctx.fillStyle = "#e25450";
    for (const object of geometry) for (const shape of object.colliders ?? []) {
      ctx.beginPath();
      if ("x" in shape) ctx.rect(shape.x, shape.y, shape.w, shape.h);
      else polygon(shape.points);
      ctx.fill();
    }
    ctx.restore();
    for (const object of geometry) for (const shape of object.occluder?.polygons ?? []) {
      ctx.beginPath();
      polygon(shape);
      ctx.strokeStyle = "#45d8e3";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    for (const foot of Object.values(LIUYUAN_ENTRY_OBLIQUE_FEET)) {
      ctx.fillStyle = "#f4d478";
      ctx.fillRect(foot.x - 4, foot.y - 4, 8, 8);
    }
    const profile = STANDARD_PLAYER_PROFILE;
    ctx.strokeStyle = "#fc6fac";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      actor.x - profile.halfW,
      actor.y - profile.topInset,
      profile.halfW * 2,
      profile.topInset - profile.bottomInset
    );
  }
  function draw() {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#404b47";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (art.complete && art.naturalWidth) ctx.drawImage(art, 0, 0, canvas.width, canvas.height);
    const scale = LIUYUAN_ENTRY_OBLIQUE_ACTOR_SCALE;
    const height = Math.round(perspectiveScholarHeight(
      actor.y,
      scale.farFootY,
      scale.nearFootY,
      scale.farHeight,
      scale.nearHeight
    ) * actorScalePercent / 100);
    drawScholarGroundShadow(ctx, actor.x, actor.y, height);
    if (sprite.complete && sprite.naturalWidth) {
      const frame2 = actor.moving ? 1 + Math.floor(actor.walkTime * 6) % 2 : 0;
      drawScholarAtFoot(ctx, sprite, actor.dir, frame2, actor.x, actor.y, height);
    }
    if (art.complete && art.naturalWidth) for (const object of geometry) {
      const occluder = object.occluder;
      if (!occluder || actor.y >= occluder.depthY) continue;
      ctx.save();
      ctx.beginPath();
      for (const shape of occluder.polygons) polygon(shape);
      ctx.clip();
      ctx.drawImage(art, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    if (showGeometry.checked) drawDebug();
    coords.hidden = !showGeometry.checked;
    if (showGeometry.checked) coords.textContent = `\u978B\u5E95 (${Math.round(actor.x)}, ${Math.round(actor.y)}) \xB7 \u8EAB\u9AD8 ${height}px \xB7 ${draft ? "\u5F53\u524D\u8349\u7A3F" : "\u4EE3\u7801\u9ED8\u8BA4"}`;
  }
  function frame(time) {
    const dt = Math.min((time - (lastTime || time)) / 1e3, 0.05);
    lastTime = time;
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
        dx / length * 188 * dt,
        dy / length * 188 * dt,
        scene.w,
        scene.h,
        obstacles,
        STANDARD_PLAYER_PROFILE
      );
    }
    draw();
    requestAnimationFrame(frame);
  }
  if (previewRequested && !draft) status.textContent = "\u672A\u627E\u5230\u8BE5\u955C\u5934\u7684\u6709\u6548\u7F16\u8F91\u5668\u8349\u7A3F\uFF0C\u663E\u793A\u4EE3\u7801\u9ED8\u8BA4\u51E0\u4F55\u3002";
  if (draft) status.textContent = "\u6B63\u5728\u9884\u89C8\u7EDF\u4E00\u7F16\u8F91\u5668\u8349\u7A3F\uFF1B\u65E7\u5165\u53E3\u573A\u666F\u53CA\u8349\u7A3F\u672A\u6539\u52A8\u3002";
  if (collides(scene.map, actor.x, actor.y, scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE))
    status.textContent = "\u51FA\u751F\u811A\u70B9\u88AB\u5F53\u524D\u51E0\u4F55\u5C01\u4F4F\uFF0C\u8BF7\u56DE\u7F16\u8F91\u5668\u68C0\u67E5\u3002";
  requestAnimationFrame(frame);
})();
