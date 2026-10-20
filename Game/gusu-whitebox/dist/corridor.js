"use strict";
(() => {
  // src/core/progression.ts
  var SAVE_KEY = "gusu-nine-gardens-rpg-v1";
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
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return cloneDefault();
      const saved = JSON.parse(raw);
      const base = cloneDefault();
      return {
        ...base,
        ...saved,
        arts: { ...base.arts, ...saved.arts ?? {} },
        gardens: { ...base.gardens, ...saved.gardens ?? {} },
        completedTasks: Array.isArray(saved.completedTasks) ? saved.completedTasks : [],
        knowledge: Array.isArray(saved.knowledge) ? saved.knowledge : [],
        storyFlags: Array.isArray(saved.storyFlags) ? saved.storyFlags : [],
        updatedAt: typeof saved.updatedAt === "number" ? saved.updatedAt : 0
      };
    } catch {
      return cloneDefault();
    }
  }
  function saveProgress(progress) {
    try {
      progress.updatedAt = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
    } catch {
    }
  }
  function completeCanglangThreeWindows() {
    const progress = loadProgress();
    const taskId = "canglang-three-windows";
    if (progress.completedTasks.includes(taskId)) return { progress, rewarded: false };
    progress.completedTasks.push(taskId);
    progress.arts.shuMath += 1;
    progress.gardens.canglang = "complete";
    progress.gardens.wangshi = "clue";
    progress.knowledge.push("canglang-double-corridor", "moving-view-through-windows");
    saveProgress(progress);
    return { progress, rewarded: true };
  }

  // src/data/corridor-geometry.ts
  var CORRIDOR_ROUTE = [
    { x: 62, y: 278 },
    { x: 178, y: 274 },
    { x: 316, y: 274 },
    { x: 470, y: 277 },
    { x: 610, y: 284 },
    { x: 738, y: 279 }
  ];
  var CORRIDOR_LANE = { min: -5, max: 6 };
  var CORRIDOR_SPOTS = [
    { t: 0.135, verb: "\u770B", instruction: "\u8D70\u5230\u7B2C\u4E00\u6247\u82B1\u7A97\u524D\uFF0C\u6309 E \u53D6\u666F", line: "\u7A97\u4E0D\u52A8\uFF0C\u666F\u4F1A\u53D8\u3002", frame: { x: 131, y: 205, w: 43, h: 36 } },
    { t: 0.373, verb: "\u5BF9", instruction: "\u6CBF\u5ECA\u5411\u4E1C\uFF0C\u627E\u5230\u7A97\u7EB9\u4E0E\u5C71\u77F3\u76F8\u5BF9\u7684\u4F4D\u7F6E", line: "\u53E4\u4EBA\u51FF\u7A97\u65F6\uFF0C\u65E9\u628A\u5916\u9762\u7684\u666F\u7B97\u597D\u4E86\u3002", frame: { x: 291, y: 213, w: 45, h: 33 } },
    { t: 0.632, verb: "\u5408", instruction: "\u7EE7\u7EED\u79FB\u6B65\uFF0C\u5728\u7B2C\u4E09\u6247\u7A97\u524D\u505C\u4E0B", line: "\u5408\u4E0A\u4E86\u3002\u4E5D\u56ED\u7684\u7A97\uFF0C\u5408\u7684\u90FD\u662F\u8FD9\u4E00\u4E0B\u3002", frame: { x: 467, y: 217, w: 42, h: 35 } }
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
  function corridorWaterEdgeY(x) {
    if (x <= CORRIDOR_WATER_EDGE[0][0]) return CORRIDOR_WATER_EDGE[0][1];
    for (let i = 1; i < CORRIDOR_WATER_EDGE.length; i++) {
      const [rightX, rightY] = CORRIDOR_WATER_EDGE[i];
      if (x <= rightX) {
        const [leftX, leftY] = CORRIDOR_WATER_EDGE[i - 1];
        return leftY + (rightY - leftY) * (x - leftX) / (rightX - leftX);
      }
    }
    return CORRIDOR_WATER_EDGE[CORRIDOR_WATER_EDGE.length - 1][1];
  }
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
  function validateCorridorGeometry() {
    const errors = [];
    for (const object of CORRIDOR_POST_OCCLUDERS) {
      if (!object.occluder || object.occluder.depthY < 0 || object.occluder.depthY > 496) {
        errors.push(`${object.id}: \u906E\u6321\u6DF1\u5EA6\u7EBF\u65E0\u6548`);
        continue;
      }
      for (const polygon of object.occluder.polygons) {
        if (polygon.length < 3 || polygon.some(([x, y]) => x < 0 || y < 0 || x > 793 || y > 496)) {
          errors.push(`${object.id}: \u906E\u6321\u88C1\u7247\u8D8A\u51FA\u753B\u5E03\u6216\u70B9\u6570\u4E0D\u8DB3`);
        }
      }
    }
    if (CORRIDOR_WATER_EDGE[0][0] !== 0 || CORRIDOR_WATER_EDGE[CORRIDOR_WATER_EDGE.length - 1][0] !== 793 || CORRIDOR_WATER_EDGE.some(([x], index) => index > 0 && x <= CORRIDOR_WATER_EDGE[index - 1][0])) {
      errors.push("corridor.waterEdge: \u6C34\u5CB8\u7EBF\u987B\u4ECE 0 \u5230 793 \u4E14 x \u4E25\u683C\u9012\u589E");
    }
    if (CORRIDOR_ROUTE.length < 2) errors.push("corridor: \u8DEF\u5F84\u81F3\u5C11\u9700\u8981\u4E24\u4E2A\u70B9");
    for (let index = 0; index < CORRIDOR_ROUTE.length - 1; index++) {
      const a = CORRIDOR_ROUTE[index], b = CORRIDOR_ROUTE[index + 1];
      if (Math.hypot(b.x - a.x, b.y - a.y) <= 0) errors.push(`corridor.route[${index}]: \u76F8\u90BB\u70B9\u91CD\u5408`);
    }
    let previous = -Infinity;
    for (const [index, spot] of CORRIDOR_SPOTS.entries()) {
      if (spot.t <= 0 || spot.t >= 1) errors.push(`corridor.spot[${index}]: t \u5FC5\u987B\u4F4D\u4E8E (0, 1)`);
      if (spot.t <= previous) errors.push(`corridor.spot[${index}]: \u4EFB\u52A1\u987A\u5E8F\u5FC5\u987B\u6CBF\u8DEF\u5F84\u9012\u589E`);
      if (spot.frame.w <= 0 || spot.frame.h <= 0 || spot.frame.x < 0 || spot.frame.y < 0 || spot.frame.x + spot.frame.w > 793 || spot.frame.y + spot.frame.h > 496) {
        errors.push(`corridor.spot[${index}]: \u7A97\u6846\u8D8A\u51FA\u903B\u8F91\u753B\u5E03`);
      }
      previous = spot.t;
    }
    if (CORRIDOR_LANE.min >= CORRIDOR_LANE.max) errors.push("corridor: lane \u8303\u56F4\u65E0\u6548");
    for (const effect of CORRIDOR_EFFECTS) {
      const polygons = [...effect.polygons, ...effect.holes ?? []];
      for (const [index, polygon] of polygons.entries()) {
        if (polygon.length < 3) errors.push(`${effect.id}.polygon[${index}]: \u81F3\u5C11\u9700\u8981\u4E09\u4E2A\u70B9`);
        for (const [x, y] of polygon) {
          if (x < 0 || y < 0 || x > 793 || y > 496) {
            errors.push(`${effect.id}.polygon[${index}]: \u70B9 (${x}, ${y}) \u8D85\u51FA\u903B\u8F91\u753B\u5E03`);
          }
        }
      }
      const style = effect.ripple;
      if (style.rowSpacing <= 0 || style.segmentSpacing <= 0 || style.minLength <= 0 || style.maxLength < style.minLength || style.speedMs <= 0) {
        errors.push(`${effect.id}: \u6CE2\u7EB9\u53C2\u6570\u65E0\u6548`);
      }
    }
    return errors;
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
  function readSceneActorScalePercent(sceneId, worldW, worldH) {
    if (new URLSearchParams(location.search).get("actorDraft") !== "1") return null;
    for (const record of sceneDraftRecords(sceneId)) try {
      const data = JSON.parse(record.value);
      if (data.format !== "gusu-scene-geometry" || data.sceneId !== sceneId || data.world?.width !== worldW || data.world?.height !== worldH) continue;
      if (data.actorScalePercent === void 0) return 100;
      if (Number.isInteger(data.actorScalePercent) && data.actorScalePercent >= 40 && data.actorScalePercent <= 250) return data.actorScalePercent;
    } catch {
    }
    return null;
  }
  function readSceneVisualOccluders(sceneId, worldW, worldH) {
    if (new URLSearchParams(location.search).get("actorDraft") !== "1") return null;
    for (const record of sceneDraftRecords(sceneId)) try {
      const data = JSON.parse(record.value);
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
  function drawScholarAtFoot(ctx2, sprite, direction, phase, footX, footY, height) {
    drawSpriteFrameAtFoot(ctx2, sprite, scholarFrame(direction, phase), footX, footY, height);
  }
  function drawSpriteFrameAtFoot(ctx2, sprite, frame2, footX, footY, height) {
    const drawnHeight = Math.round(height);
    const drawnWidth = Math.round(drawnHeight * frame2.sw / frame2.sh);
    ctx2.drawImage(
      sprite,
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

  // src/corridor.ts
  var canvas = document.getElementById("corridorGame");
  var ctx = canvas.getContext("2d", { alpha: false });
  var loading = document.getElementById("loading");
  var toast = document.getElementById("toast");
  var objective = document.getElementById("objective");
  var resetButton = document.getElementById("resetButton");
  var completionLayer = document.getElementById("completionLayer");
  var stayButton = document.getElementById("stayButton");
  var image = new Image();
  var playerSprite = new Image();
  playerSprite.src = "../assets/characters/scholar-player-sprites-v1.png";
  var W = canvas.width;
  var H = canvas.height;
  var actorScalePercent = readSceneActorScalePercent("canglang-corridor", W, H) ?? 100;
  var visualOccluders = readSceneVisualOccluders("canglang-corridor", W, H) ?? CORRIDOR_POST_OCCLUDERS;
  var actorVisibleHeight = Math.round(52 * actorScalePercent / 100);
  var reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var params = new URLSearchParams(location.search);
  var debugGeometry = params.get("debug") === "geometry";
  if (debugGeometry) {
    const geometryErrors = validateCorridorGeometry();
    if (geometryErrors.length) console.warn("[\u590D\u5ECA\u51E0\u4F55\u6821\u9A8C]", ...geometryErrors);
    else console.info("[\u590D\u5ECA\u51E0\u4F55\u6821\u9A8C] \u901A\u8FC7");
  }
  var route = CORRIDOR_ROUTE;
  var spots = CORRIDOR_SPOTS;
  var segmentLengths = [];
  var totalLength = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const n = Math.hypot(route[i + 1].x - route[i].x, route[i + 1].y - route[i].y);
    segmentLengths.push(n);
    totalLength += n;
  }
  var keys = /* @__PURE__ */ new Set();
  var virtualKeys = /* @__PURE__ */ new Set();
  var state = {
    t: 0.055,
    lane: 0,
    targetT: null,
    direction: 1,
    moving: false,
    captured: /* @__PURE__ */ new Set(),
    beat: null,
    toastUntil: 0,
    toastText: "",
    lastTime: 0,
    completionAt: 0,
    completionShown: false
  };
  var clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function pointOnRoute(t, lane = 0) {
    let remaining = clamp(t, 0, 1) * totalLength;
    for (let i = 0; i < segmentLengths.length; i++) {
      if (remaining <= segmentLengths[i] || i === segmentLengths.length - 1) {
        const ratio = clamp(remaining / segmentLengths[i], 0, 1);
        const a = route[i], b = route[i + 1];
        const tx = (b.x - a.x) / segmentLengths[i], ty = (b.y - a.y) / segmentLengths[i];
        return { x: a.x + (b.x - a.x) * ratio - ty * lane, y: a.y + (b.y - a.y) * ratio + tx * lane, tx, ty };
      }
      remaining -= segmentLengths[i];
    }
    return { ...route[route.length - 1], tx: 1, ty: 0 };
  }
  function nearestRouteT(x, y) {
    let best = Infinity, bestT = 0, traversed = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const a = route[i], b = route[i + 1];
      const vx = b.x - a.x, vy = b.y - a.y;
      const ratio = clamp(((x - a.x) * vx + (y - a.y) * vy) / (vx * vx + vy * vy), 0, 1);
      const px = a.x + vx * ratio, py = a.y + vy * ratio;
      const d = Math.hypot(x - px, y - py);
      if (d < best) {
        best = d;
        bestT = (traversed + segmentLengths[i] * ratio) / totalLength;
      }
      traversed += segmentLengths[i];
    }
    return best < 58 ? bestT : null;
  }
  function activeIndex() {
    return state.captured.size;
  }
  function showToast(text, now) {
    state.toastText = text;
    state.toastUntil = now + 1900;
    toast.textContent = text;
    toast.classList.add("is-visible");
  }
  function updateHud() {
    const active = activeIndex();
    document.querySelectorAll("[data-window]").forEach((item, idx) => {
      item.classList.toggle("is-captured", state.captured.has(idx));
      item.classList.toggle("is-active", idx === active && active < spots.length);
    });
    objective.textContent = active >= spots.length ? "\u8BFE\u4E1A\u5B8C\u6210 \xB7 \u6570\u827A\u300C\u89C2\u4F4D\u300D\u521D\u8BC6\uFF0C\u300A\u8607\u57CE\u5168\u5716\u300B\u663E\u51FA\u65B0\u7684\u56ED\u6797\u7EBF\u7D22" : spots[active].instruction;
  }
  function interact(now) {
    if (state.beat) return;
    const idx = activeIndex();
    if (idx >= spots.length) {
      showToast("\u4E09\u7A97\u5DF2\u6536\u5165\u56ED\u8C31", now);
      return;
    }
    const distance = Math.abs(state.t - spots[idx].t);
    if (distance > 0.045) {
      showToast(state.t < spots[idx].t ? "\u518D\u6CBF\u5ECA\u5411\u4E1C\u8D70\u4E00\u4E9B" : "\u521A\u624D\u7684\u7A97\u4F4D\u5728\u8EAB\u540E", now);
      return;
    }
    state.targetT = null;
    state.moving = false;
    state.beat = { idx, startedAt: now };
  }
  function finishBeat(now) {
    if (!state.beat || now - state.beat.startedAt < 300) return;
    const { idx } = state.beat;
    state.captured.add(idx);
    state.beat = null;
    if (idx === spots.length - 1) {
      completeCanglangThreeWindows();
      state.completionAt = now + 1600;
    }
    showToast(`${spots[idx].verb} \xB7 ${spots[idx].line}`, now);
    updateHud();
  }
  function showCompletion() {
    if (state.completionShown) return;
    state.completionShown = true;
    completionLayer.hidden = false;
    stayButton.focus();
  }
  function drawWater(time) {
    if (reducedMotion) return;
    drawWaterRipples(ctx, CORRIDOR_EFFECTS, { x: 0, y: 0 }, time);
  }
  function drawPlayerReflection(time) {
    if (!playerSprite.complete || !playerSprite.naturalWidth) return;
    const p = pointOnRoute(state.t, state.lane);
    const edgeY = corridorWaterEdgeY(p.x);
    const frame2 = state.moving ? 1 + Math.floor(time / 130) % 2 : 0;
    const direction = state.direction > 0 ? 2 : 1;
    ctx.save();
    ctx.beginPath();
    for (const effect of CORRIDOR_EFFECTS) for (const polygon of [...effect.polygons, ...effect.holes ?? []]) {
      polygon.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
    }
    ctx.clip("evenodd");
    ctx.globalAlpha = 0.14;
    const sway = reducedMotion ? 0 : Math.sin(time * 2e-3 + p.x * 0.03) * 1.5;
    ctx.translate(Math.round(p.x + sway), Math.round(edgeY + 2));
    ctx.scale(1, -0.58);
    drawScholarAtFoot(ctx, playerSprite, direction, frame2, 0, 0, actorVisibleHeight);
    ctx.restore();
  }
  function drawGeometryDebug() {
    ctx.save();
    ctx.lineWidth = 1;
    for (const effect of CORRIDOR_EFFECTS) {
      ctx.fillStyle = "rgba(54, 126, 255, .12)";
      ctx.strokeStyle = "#4c8dff";
      for (const polygon of effect.polygons) {
        ctx.beginPath();
        polygon.forEach(([x, y], index) => index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.strokeStyle = "#ff9d45";
      for (const polygon of effect.holes ?? []) {
        ctx.beginPath();
        polygon.forEach(([x, y], index) => index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
        ctx.closePath();
        ctx.stroke();
      }
    }
    for (const [lane, color] of [[CORRIDOR_LANE.min, "#ef5350"], [0, "#35d8e6"], [CORRIDOR_LANE.max, "#ef5350"]]) {
      ctx.strokeStyle = color;
      ctx.beginPath();
      for (let t = 0; t <= 1.001; t += 0.02) {
        const p = pointOnRoute(Math.min(t, 1), lane);
        if (t === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    const actor = pointOnRoute(state.t, state.lane);
    ctx.fillStyle = "rgba(231, 74, 255, .45)";
    ctx.strokeStyle = "#f263ff";
    ctx.fillRect(Math.round(actor.x) - 4, Math.round(actor.y) - 6, 8, 5);
    ctx.strokeRect(Math.round(actor.x) - 3.5, Math.round(actor.y) - 5.5, 7, 4);
    ctx.restore();
  }
  function drawPlayer(time) {
    const p = pointOnRoute(state.t, state.lane);
    const step = state.moving ? Math.floor(time / 130) % 2 : 0;
    const bob = state.moving && !reducedMotion ? step : 0;
    const x = Math.round(p.x), y = Math.round(p.y - bob);
    drawScholarGroundShadow(ctx, x, p.y, actorVisibleHeight);
    if (playerSprite.complete && playerSprite.naturalWidth > 0) {
      const frame2 = state.moving ? step + 1 : 0;
      const row = state.direction > 0 ? 2 : 1;
      drawScholarAtFoot(ctx, playerSprite, row, frame2, x, y, actorVisibleHeight);
      return;
    }
    ctx.fillStyle = "#302820";
    ctx.fillRect(x - 6, y - 43, 13, 6);
    ctx.fillRect(x - 8, y - 39, 17, 5);
    ctx.fillStyle = "#d1aa80";
    ctx.fillRect(x - 5, y - 34, 11, 8);
    ctx.fillStyle = "#e0d5b9";
    ctx.fillRect(x - 7, y - 26, 15, 24);
    ctx.fillStyle = "#8f3b30";
    ctx.fillRect(x - 7, y - 12, 15, 3);
    ctx.fillStyle = "#5b4634";
    const stride = state.direction > 0 ? step : 1 - step;
    ctx.fillRect(x - 5 - stride, y - 2, 4, 5);
    ctx.fillRect(x + 2 + stride, y - 2, 4, 5);
    ctx.fillStyle = "#b6a681";
    const arm = state.direction > 0 ? 1 : -1;
    ctx.fillRect(x + arm * 8 - 2, y - 25 + step, 4, 13);
  }
  function redrawPosts() {
    const footY = pointOnRoute(state.t, state.lane).y;
    for (const object of visualOccluders) {
      const mask = object.occluder;
      if (!mask || footY >= mask.depthY) continue;
      ctx.save();
      ctx.beginPath();
      for (const polygon of mask.polygons) {
        polygon.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.closePath();
      }
      ctx.clip("evenodd");
      ctx.drawImage(image, 0, 0, W, H);
      ctx.restore();
    }
  }
  function drawSpotMarker(spot, idx, time) {
    const captured = state.captured.has(idx);
    const active = idx === activeIndex();
    if (!active && !captured) return;
    const alpha = captured ? 0.55 : 0.72 + Math.sin(time * 4e-3) * 0.22;
    const f = spot.frame;
    ctx.save();
    ctx.strokeStyle = captured ? `rgba(200,160,75,${alpha})` : `rgba(217,85,67,${alpha})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(f.x - 3, f.y - 3, f.w + 6, f.h + 6);
    ctx.fillStyle = captured ? "#c8a04b" : "#d95543";
    ctx.fillRect(f.x + f.w / 2 - 2, f.y - 9, 5, 5);
    ctx.restore();
  }
  function drawBeat() {
    if (!state.beat) return;
    const spot = spots[state.beat.idx], f = spot.frame;
    ctx.fillStyle = "rgba(16,24,20,.28)";
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.beginPath();
    ctx.rect(f.x - 6, f.y - 6, f.w + 12, f.h + 12);
    ctx.clip();
    ctx.drawImage(image, 0, 0, W, H);
    ctx.restore();
    ctx.strokeStyle = "#f2ead6";
    ctx.lineWidth = 2;
    ctx.strokeRect(f.x - 7, f.y - 7, f.w + 14, f.h + 14);
  }
  function draw(time) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0, W, H);
    drawPlayerReflection(time);
    drawWater(time);
    spots.forEach((spot, idx) => drawSpotMarker(spot, idx, time));
    drawPlayer(time);
    redrawPosts();
    drawBeat();
    if (debugGeometry) drawGeometryDebug();
    if (time > state.toastUntil) toast.classList.remove("is-visible");
  }
  function down(key) {
    return keys.has(key) || virtualKeys.has(key);
  }
  function update(dt, now) {
    finishBeat(now);
    if (state.completionAt > 0 && now >= state.completionAt) showCompletion();
    if (!completionLayer.hidden) {
      state.moving = false;
      return;
    }
    if (state.beat) {
      state.moving = false;
      return;
    }
    const along = Number(down("d") || down("arrowright")) - Number(down("a") || down("arrowleft"));
    const across = Number(down("s") || down("arrowdown")) - Number(down("w") || down("arrowup"));
    state.moving = along !== 0 || across !== 0 || state.targetT !== null;
    if (along) {
      state.direction = along;
      state.targetT = null;
      state.t = clamp(state.t + along * dt * 0.17, 0.025, 0.975);
    } else if (state.targetT !== null) {
      const delta = state.targetT - state.t;
      if (Math.abs(delta) < 3e-3) {
        state.t = state.targetT;
        state.targetT = null;
      } else {
        state.direction = Math.sign(delta);
        state.t = clamp(state.t + Math.sign(delta) * dt * 0.19, 0.025, 0.975);
      }
    }
    state.lane = clamp(state.lane + across * dt * 12, CORRIDOR_LANE.min, CORRIDOR_LANE.max);
  }
  function frame(time) {
    const dt = Math.min((time - state.lastTime) / 1e3 || 0.016, 0.05);
    state.lastTime = time;
    update(dt, time);
    draw(time);
    requestAnimationFrame(frame);
  }
  function reset() {
    state.t = 0.055;
    state.lane = 0;
    state.targetT = null;
    state.captured.clear();
    state.beat = null;
    state.completionAt = 0;
    state.completionShown = false;
    completionLayer.hidden = true;
    updateHud();
    showToast("\u5DF2\u56DE\u5230\u9762\u6C34\u8F69\u4E00\u7AEF", performance.now());
    canvas.focus();
  }
  addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d"].includes(key)) {
      event.preventDefault();
      keys.add(key);
    }
    if (["e", " ", "enter"].includes(key)) {
      event.preventDefault();
      interact(performance.now());
    }
  });
  addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
  function releaseVirtual() {
    virtualKeys.clear();
    document.querySelectorAll(".is-active").forEach((el) => el.classList.remove("is-active"));
  }
  addEventListener("blur", () => {
    keys.clear();
    releaseVirtual();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseVirtual();
  });
  document.querySelectorAll("[data-move]").forEach((button) => {
    const key = button.dataset.move;
    const set = (active) => {
      if (active) virtualKeys.add(key);
      else virtualKeys.delete(key);
      button.classList.toggle("is-active", active);
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      set(true);
    });
    button.addEventListener("pointerup", () => set(false));
    button.addEventListener("pointercancel", () => set(false));
    button.addEventListener("lostpointercapture", () => set(false));
  });
  document.querySelector('[data-action="interact"]').addEventListener("pointerdown", (event) => {
    event.preventDefault();
    interact(performance.now());
  });
  canvas.addEventListener("pointerdown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * W / rect.width;
    const y = (event.clientY - rect.top) * H / rect.height;
    const target = nearestRouteT(x, y);
    if (target === null) {
      showToast("\u8BF7\u70B9\u51FB\u590D\u5ECA\u6B65\u9053", performance.now());
      return;
    }
    state.targetT = clamp(target, 0.025, 0.975);
    canvas.focus();
  });
  resetButton.addEventListener("click", reset);
  stayButton.addEventListener("click", () => {
    completionLayer.hidden = true;
    canvas.focus();
  });
  if (params.get("scene") === "complete") {
    state.completionShown = true;
    completionLayer.hidden = false;
  }
  image.addEventListener("load", () => {
    loading.classList.add("is-hidden");
    updateHud();
    if (completionLayer.hidden) canvas.focus();
    else stayButton.focus();
    requestAnimationFrame(frame);
  });
  image.addEventListener("error", () => {
    loading.textContent = "\u573A\u666F\u6BCD\u7248\u52A0\u8F7D\u5931\u8D25\u3002";
  });
  image.src = "../assets/canglang/corridor-hero-v4-motifs.png";
})();
