"use strict";

// scripts/verify-liuyuan-input-smoke.ts
var import_node_fs = require("node:fs");
var import_node_vm = require("node:vm");

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

// src/data/liuyuan-lvyin-study.ts
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
var POND = [
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
function insidePolygon(x, y, polygon) {
  let inside5 = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside5 = !inside5;
  }
  return inside5;
}
function bands(id, polygon, tile) {
  const output = [];
  for (let y = 0; y < LIUYUAN_LVYIN_H; y++) {
    let start = -1;
    for (let x = 0; x <= LIUYUAN_LVYIN_W; x++) {
      const open = x < LIUYUAN_LVYIN_W && insidePolygon(x * 16 + 8, y * 16 + 8, polygon);
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
  ...bands("central-pond", POND, T.WATER),
  ...bands("pond-bank-paving", BANK_FLOOR, T.PATH),
  ...bands("pavilion-floor", PAVILION_FLOOR, T.CORR),
  ...bands("pavilion-steps", PAVILION_STEPS, T.PLAT)
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
function insidePolygon2(x, y, polygon) {
  let inside5 = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside5 = !inside5;
  }
  return inside5;
}
function bands2(id, polygon, tile) {
  const output = [];
  for (let y = 0; y < LIUYUAN_COURT_H; y++) {
    let start = -1;
    for (let x = 0; x <= LIUYUAN_COURT_W; x++) {
      const open = x < LIUYUAN_COURT_W && insidePolygon2(x * 16 + 8, y * 16 + 8, polygon);
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
  ...bands2("court-paving", COURT_FLOOR, T.PATH),
  ...bands2("court-west-turn", COURT_TO_PASSAGE, T.PATH),
  ...bands2("west-narrow-passage", WEST_PASSAGE, T.CORR)
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

// src/data/liuyuan-entry-study.ts
var LIUYUAN_ENTRY_W = 63;
var LIUYUAN_ENTRY_H = 43;
var LIUYUAN_ENTRY_SPAWN = { x: 520, y: 656 };
var LIUYUAN_ENTRY_QIAO_WAIT = { x: 550, y: 657 };
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

// src/data/liuyuan-study-court-research.ts
var LIUYUAN_STUDY_COURT_W = 96;
var LIUYUAN_STUDY_COURT_H = 64;
var LIUYUAN_STUDY_COURT_ACTOR_HEIGHT = LIUYUAN_CHARACTER_SCALE.studyCourt.worldHeight;
var LIUYUAN_STUDY_COURT_SPAWN = { x: 720, y: 842 };
var COURT = [
  [365, 535],
  [550, 485],
  [1315, 475],
  [1455, 520],
  [1455, 810],
  [1350, 930],
  [435, 950],
  [305, 860],
  [305, 665]
];
function inside(x, y, points) {
  let result = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) result = !result;
  }
  return result;
}
function bands3() {
  const regions = [];
  for (let y = 0; y < LIUYUAN_STUDY_COURT_H; y++) {
    let start = -1;
    for (let x = 0; x <= LIUYUAN_STUDY_COURT_W; x++) {
      const open = x < LIUYUAN_STUDY_COURT_W && inside(x * 16 + 8, y * 16 + 8, COURT);
      if (open && start < 0) start = x;
      if (!open && start >= 0) {
        regions.push({ id: `study-paving-${y}-${start}`, x: start, y, w: x - start, h: 1, tile: T.PATH });
        start = -1;
      }
    }
  }
  return regions;
}
var LIUYUAN_STUDY_COURT_DRAFT_REGIONS = bands3();
var LIUYUAN_STUDY_COURT_GEOMETRY = [
  { id: "study-tree-rock-flowerbed", colliders: [{ points: [
    [853, 510],
    [965, 467],
    [1108, 483],
    [1242, 548],
    [1275, 660],
    [1190, 705],
    [1e3, 699],
    [866, 628]
  ] }], occluder: { id: "study-tree-canopy", depthY: 680, polygons: [[
    [721, 125],
    [866, 43],
    [1068, 30],
    [1268, 126],
    [1298, 357],
    [1204, 539],
    [1090, 573],
    [1010, 662],
    [897, 590],
    [797, 480],
    [696, 291]
  ]] } },
  { id: "study-west-post", colliders: [{ x: 395, y: 517, w: 23, h: 67 }] },
  { id: "study-north-post", colliders: [{ x: 610, y: 454, w: 22, h: 59 }] },
  {
    id: "study-east-post",
    colliders: [{ x: 1370, y: 447, w: 26, h: 91 }],
    occluder: { id: "study-east-post-front", depthY: 533, polygons: [[
      [1367, 252],
      [1402, 252],
      [1402, 545],
      [1367, 545]
    ]] }
  },
  { id: "study-foreground-left-wall", occluder: {
    id: "study-foreground-left-wall",
    depthY: 1010,
    polygons: [[[0, 854], [288, 873], [365, 1024], [0, 1024]]]
  } },
  { id: "study-foreground-right-wall", occluder: {
    id: "study-foreground-right-wall",
    depthY: 1e3,
    polygons: [[[1378, 870], [1536, 790], [1536, 1024], [1390, 1024]]]
  } }
];
var LIUYUAN_STUDY_COURT_OBSTACLES = LIUYUAN_STUDY_COURT_GEOMETRY.flatMap((object) => object.colliders ?? []);
function buildLiuyuanStudyCourtMap(regions = LIUYUAN_STUDY_COURT_DRAFT_REGIONS) {
  const map = new Uint8Array(LIUYUAN_STUDY_COURT_W * LIUYUAN_STUDY_COURT_H);
  map.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_STUDY_COURT_W && y < LIUYUAN_STUDY_COURT_H) {
        map[y * LIUYUAN_STUDY_COURT_W + x] = region.tile;
      }
    }
  }
  return {
    map,
    w: LIUYUAN_STUDY_COURT_W,
    h: LIUYUAN_STUDY_COURT_H,
    spawn: { ...LIUYUAN_STUDY_COURT_SPAWN },
    obstacles: LIUYUAN_STUDY_COURT_OBSTACLES
  };
}

// src/data/liuyuan-stone-forest-study.ts
var LIUYUAN_STONE_FOREST_W = 111;
var LIUYUAN_STONE_FOREST_H = 56;
var LIUYUAN_STONE_FOREST_SPAWN = { x: 465, y: 550 };
var LEFT_COURT = [
  [210, 360],
  [620, 315],
  [795, 385],
  [810, 620],
  [680, 740],
  [365, 685],
  [210, 530]
];
var FRONT_WALK = [
  [440, 570],
  [750, 565],
  [1290, 580],
  [1555, 520],
  [1680, 645],
  [1570, 800],
  [1090, 825],
  [690, 765],
  [410, 665]
];
var RIGHT_COURT = [
  [1240, 325],
  [1776, 305],
  [1776, 650],
  [1510, 730],
  [1240, 625]
];
var PAVILION_FLOOR2 = [
  [345, 255],
  [650, 250],
  [660, 405],
  [340, 420]
];
function inside2(x, y, points) {
  let result = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) result = !result;
  }
  return result;
}
function bands4(id, points, tile) {
  const result = [];
  for (let y = 0; y < LIUYUAN_STONE_FOREST_H; y++) {
    let first = -1;
    for (let x = 0; x <= LIUYUAN_STONE_FOREST_W; x++) {
      const open = x < LIUYUAN_STONE_FOREST_W && inside2(x * 16 + 8, y * 16 + 8, points);
      if (open && first < 0) first = x;
      if (!open && first >= 0) {
        result.push({ id: `${id}-${y}-${first}`, x: first, y, w: x - first, h: 1, tile });
        first = -1;
      }
    }
  }
  return result;
}
var LIUYUAN_STONE_FOREST_DRAFT_REGIONS = [
  ...bands4("stone-left-court", LEFT_COURT, T.PATH),
  ...bands4("stone-front-walk", FRONT_WALK, T.PATH),
  ...bands4("stone-right-court", RIGHT_COURT, T.CORR),
  ...bands4("stone-yifeng-floor", PAVILION_FLOOR2, T.PLAT)
];
var LIUYUAN_STONE_FOREST_GEOMETRY = [
  { id: "stone-main-peak-bed", colliders: [{ points: [
    [645, 495],
    [710, 400],
    [880, 365],
    [1090, 375],
    [1270, 455],
    [1315, 605],
    [1165, 665],
    [840, 650],
    [650, 585]
  ] }] },
  { id: "stone-left-rock-cluster", colliders: [{ points: [[235, 395], [370, 375], [425, 475], [380, 535], [245, 515]] }] },
  { id: "stone-right-rock-cluster", colliders: [{ points: [[1480, 360], [1580, 360], [1635, 465], [1585, 510], [1460, 480]] }] },
  {
    id: "stone-leaning-leaf-v2",
    colliders: [{ points: [[613, 505], [672, 490], [711, 547], [679, 576], [622, 565]] }],
    occluder: {
      id: "stone-leaning-leaf-v2-occluder",
      depthY: 565,
      polygons: [[[626, 493], [652, 481], [680, 500], [706, 544], [690, 563], [636, 563], [610, 526]]]
    }
  },
  { id: "stone-yifeng-west-post", colliders: [{ x: 364, y: 345, w: 23, h: 46 }] },
  { id: "stone-yifeng-east-post", colliders: [{ x: 625, y: 342, w: 23, h: 48 }] },
  { id: "stone-east-corridor-post", colliders: [{ x: 1648, y: 430, w: 25, h: 78 }] },
  { id: "stone-main-peak-occluder", occluder: {
    id: "stone-main-peak-occluder",
    depthY: 625,
    polygons: [[
      [675, 285],
      [900, 145],
      [1010, 125],
      [1165, 325],
      [1300, 405],
      [1340, 645],
      [1135, 675],
      [890, 650],
      [675, 580]
    ]]
  } },
  { id: "stone-front-left-eave", occluder: {
    id: "stone-front-left-eave",
    depthY: 880,
    polygons: [[[0, 495], [325, 500], [895, 780], [860, 896], [0, 896]]]
  } },
  { id: "stone-front-right-eave", occluder: {
    id: "stone-front-right-eave",
    depthY: 890,
    polygons: [[[1340, 800], [1776, 625], [1776, 896], [1350, 896]]]
  } },
  { id: "stone-east-corridor-roof", occluder: {
    id: "stone-east-corridor-roof",
    depthY: 480,
    polygons: [[[1260, 110], [1776, 165], [1776, 375], [1320, 300]]]
  } }
];
var LIUYUAN_STONE_FOREST_OBSTACLES = LIUYUAN_STONE_FOREST_GEOMETRY.flatMap((object) => object.colliders ?? []);
function buildLiuyuanStoneForestStudyMap(regions = LIUYUAN_STONE_FOREST_DRAFT_REGIONS) {
  const map = new Uint8Array(LIUYUAN_STONE_FOREST_W * LIUYUAN_STONE_FOREST_H);
  map.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_STONE_FOREST_W && y < LIUYUAN_STONE_FOREST_H) {
        map[y * LIUYUAN_STONE_FOREST_W + x] = region.tile;
      }
    }
  }
  return {
    map,
    w: LIUYUAN_STONE_FOREST_W,
    h: LIUYUAN_STONE_FOREST_H,
    spawn: { ...LIUYUAN_STONE_FOREST_SPAWN },
    obstacles: LIUYUAN_STONE_FOREST_OBSTACLES
  };
}

// src/data/liuyuan-east-hall-study.ts
var LIUYUAN_EAST_HALL_W = 111;
var LIUYUAN_EAST_HALL_H = 56;
var LIUYUAN_EAST_HALL_SPAWN = { x: 385, y: 575 };
var COURT2 = [
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
function inside3(x, y, points) {
  let result = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) result = !result;
  }
  return result;
}
function bands5(id, points, tile) {
  const result = [];
  for (let y = 0; y < LIUYUAN_EAST_HALL_H; y++) {
    let first = -1;
    for (let x = 0; x <= LIUYUAN_EAST_HALL_W; x++) {
      const open = x < LIUYUAN_EAST_HALL_W && inside3(x * 16 + 8, y * 16 + 8, points);
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
  ...bands5("east-hall-court", COURT2, T.PATH),
  ...bands5("east-hall-side-passage", EAST_PASSAGE, T.CORR)
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
var EAST_PASSAGE2 = [
  [1570, 350],
  [1776, 340],
  [1776, 565],
  [1600, 565]
];
function insidePolygon3(x, y, points) {
  let inside5 = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside5 = !inside5;
  }
  return inside5;
}
function bands6(id, points, tile) {
  const result = [];
  for (let y = 0; y < LIUYUAN_FLOWER_H; y++) {
    let start = -1;
    for (let x = 0; x <= LIUYUAN_FLOWER_W; x++) {
      const open = x < LIUYUAN_FLOWER_W && insidePolygon3(x * 16 + 8, y * 16 + 8, points);
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
  ...bands6("flower-yard-floor", YARD_FLOOR, T.PATH),
  ...bands6("flower-east-passage", EAST_PASSAGE2, T.CORR)
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

// src/data/liuyuan-study-interior-research.ts
var LIUYUAN_STUDY_INTERIOR_W = 96;
var LIUYUAN_STUDY_INTERIOR_H = 64;
var LIUYUAN_STUDY_INTERIOR_SPAWN = { x: 770, y: 840 };
var FLOOR = [
  [162, 385],
  [1362, 385],
  [1480, 690],
  [1470, 920],
  [970, 955],
  [930, 1010],
  [590, 1010],
  [560, 955],
  [70, 920],
  [55, 710]
];
function inside4(x, y, points) {
  let result = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) result = !result;
  }
  return result;
}
function floorBands() {
  const regions = [];
  for (let y = 0; y < LIUYUAN_STUDY_INTERIOR_H; y++) {
    let start = -1;
    for (let x = 0; x <= LIUYUAN_STUDY_INTERIOR_W; x++) {
      const open = x < LIUYUAN_STUDY_INTERIOR_W && inside4(x * 16 + 8, y * 16 + 8, FLOOR);
      if (open && start < 0) start = x;
      if (!open && start >= 0) {
        regions.push({
          id: `study-room-floor-${y}-${start}`,
          x: start,
          y,
          w: x - start,
          h: 1,
          tile: T.CORR
        });
        start = -1;
      }
    }
  }
  return regions;
}
var LIUYUAN_STUDY_INTERIOR_DRAFT_REGIONS = floorBands();
var LIUYUAN_STUDY_INTERIOR_GEOMETRY = [
  {
    id: "study-room-writing-desk",
    colliders: [{ x: 250, y: 287, w: 365, h: 168 }],
    occluder: { id: "study-room-desk-front", depthY: 460, polygons: [[
      [235, 305],
      [623, 305],
      [623, 454],
      [235, 454]
    ]] }
  },
  { id: "study-room-bookcase", colliders: [{ x: 1008, y: 90, w: 315, h: 305 }] },
  { id: "study-room-west-wall", colliders: [{ points: [[0, 376], [80, 376], [80, 952], [0, 952]] }] },
  { id: "study-room-east-wall", colliders: [{ points: [[1460, 376], [1536, 376], [1536, 952], [1460, 952]] }] },
  { id: "study-room-threshold-left", occluder: {
    id: "study-room-threshold-left",
    depthY: 1010,
    polygons: [[[0, 950], [585, 950], [585, 1024], [0, 1024]]]
  } },
  { id: "study-room-threshold-right", occluder: {
    id: "study-room-threshold-right",
    depthY: 1010,
    polygons: [[[946, 950], [1536, 950], [1536, 1024], [946, 1024]]]
  } }
];
var LIUYUAN_STUDY_INTERIOR_OBSTACLES = LIUYUAN_STUDY_INTERIOR_GEOMETRY.flatMap((object) => object.colliders ?? []);
function buildLiuyuanStudyInteriorMap(regions = LIUYUAN_STUDY_INTERIOR_DRAFT_REGIONS) {
  const map = new Uint8Array(LIUYUAN_STUDY_INTERIOR_W * LIUYUAN_STUDY_INTERIOR_H);
  map.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_STUDY_INTERIOR_W && y < LIUYUAN_STUDY_INTERIOR_H) {
        map[y * LIUYUAN_STUDY_INTERIOR_W + x] = region.tile;
      }
    }
  }
  return {
    map,
    w: LIUYUAN_STUDY_INTERIOR_W,
    h: LIUYUAN_STUDY_INTERIOR_H,
    spawn: { ...LIUYUAN_STUDY_INTERIOR_SPAWN },
    obstacles: LIUYUAN_STUDY_INTERIOR_OBSTACLES
  };
}

// src/core/liuyuan-entry-resume.ts
function entryResumeKey(slot) {
  return `gusu:liuyuan-entry:reload-v1:${slot}`;
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

// scripts/verify-liuyuan-input-smoke.ts
function assert(value, message) {
  if (!value) throw new Error(message);
}
var clipCalls = 0;
var context2d = new Proxy({}, { get: (_, property) => property === "measureText" ? () => ({ width: 0 }) : property === "clip" ? () => {
  clipCalls++;
} : () => void 0 });
function element() {
  const handlers = /* @__PURE__ */ new Map();
  const attributes = /* @__PURE__ */ new Map();
  const target = {
    checked: false,
    hidden: false,
    textContent: "",
    innerHTML: "",
    href: "",
    dataset: {},
    width: 960,
    height: 640,
    children: [],
    addEventListener(type, handler) {
      handlers.set(type, [...handlers.get(type) ?? [], handler]);
    },
    dispatch(type, event = {}) {
      for (const handler of handlers.get(type) ?? []) handler(event);
    },
    click() {
      target.dispatch("click");
    },
    focus() {
    },
    setPointerCapture() {
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    getBoundingClientRect: () => ({ width: 122 }),
    getContext: () => context2d,
    querySelector: () => element(),
    querySelectorAll: () => [],
    replaceChildren(...children) {
      target.children = children;
    },
    append(...children) {
      target.children.push(...children);
    }
  };
  return target;
}
var pages = [
  ["liuyuan-entry", ""],
  ["liuyuan-court", "?chapter=1"],
  ["liuyuan-lvyin", "?chapter=1"],
  ["liuyuan-flower", "?chapter=1"],
  ["liuyuan-east-hall", "?route=modern&from=flower"],
  ["liuyuan-stone-forest", "?route=modern&from=east-hall"],
  ["liuyuan-study-court", "?route=modern&from=stone-forest"],
  ["liuyuan-study-interior", "?route=modern&from=study-court"]
];
var returnPages = [
  ["liuyuan-entry", "?route=modern&from=court&return=1"],
  ["liuyuan-court", "?route=modern&from=lvyin&return=1"],
  ["liuyuan-lvyin", "?route=modern&from=flower&return=1"],
  ["liuyuan-flower", "?route=modern&from=east-hall&return=1"],
  ["liuyuan-east-hall", "?route=modern&from=stone-forest&return=1"],
  ["liuyuan-stone-forest", "?route=modern&from=study-court&return=1"],
  ["liuyuan-study-court", "?route=modern&from=leaf&return=1"]
];
function boot(page, search, flagCount = search.includes("return=1") ? 14 : 13, initialProgressJson, draftRecord, readyImages = false, sessionRecords = {}) {
  const html = (0, import_node_fs.readFileSync)(`${page}.html`, "utf8");
  if ([
    "liuyuan-flower",
    "liuyuan-east-hall",
    "liuyuan-stone-forest",
    "liuyuan-study-court",
    "liuyuan-study-interior"
  ].includes(page)) {
    const stageStart = html.indexOf('<div class="stage">');
    const hudStart = html.indexOf('<div class="hud">', stageStart);
    assert(stageStart >= 0 && hudStart > stageStart, `${page} \u7F3A\u5C11\u53EF\u89C1\u573A\u666F\u5BB9\u5668`);
    const stage = html.slice(stageStart, hudStart);
    const inStage = page === "liuyuan-flower" ? ["dialogueActions", "leafCarryActions", "borrowAlbum", "continueChapter", "toLvyinReturn"] : page === "liuyuan-east-hall" ? ["continueChapter", "toFlowerReturn"] : page === "liuyuan-stone-forest" ? ["toStudyCourt", "toEastHallReturn"] : page === "liuyuan-study-court" ? ["doorActions", "interiorResearch", "toStoneReturn"] : ["answerChoices", "paperChoices", "leafResearchLink"];
    for (const id of inStage) assert(stage.includes(`id="${id}"`), `${page} \u7684 ${id} \u5FC5\u987B\u7559\u5728\u573A\u666F\u5185`);
  }
  const script = html.match(/<script src="(dist\/[^\"]+\.js)(?:\?[^\"]+)?"/);
  assert(script, `${page} \u672A\u5F15\u7528\u6B63\u5F0F\u811A\u672C`);
  const ids = /* @__PURE__ */ new Set();
  const initiallyHidden = /* @__PURE__ */ new Set();
  for (const tag of html.matchAll(/<[^>]+>/g)) {
    const id = tag[0].match(/\bid="([^"]+)"/)?.[1];
    if (!id) continue;
    ids.add(id);
    if (/(?:\s)hidden(?:\s|>)/.test(tag[0])) initiallyHidden.add(id);
  }
  const nodes = {};
  const directions = /* @__PURE__ */ new Map();
  const leafActions = /* @__PURE__ */ new Map();
  const leafStrokes = /* @__PURE__ */ new Map();
  const lanternPieces = /* @__PURE__ */ new Map();
  const lanternAdjust = /* @__PURE__ */ new Map();
  for (const match of html.matchAll(/<button\b[^>]*\bdata-dir="(up|left|down|right)"[^>]*>/g)) {
    const direction = match[1];
    const button = element();
    button.dataset.dir = direction;
    directions.set(direction, button);
  }
  for (const match of html.matchAll(/<button\b[^>]*\bdata-leaf-action="([^"]+)"[^>]*>/g)) {
    const button = element();
    button.dataset.leafAction = match[1];
    leafActions.set(match[1], button);
  }
  for (const match of html.matchAll(/<button\b[^>]*\bdata-stroke="([^"]+)"[^>]*>/g)) {
    const button = element();
    button.dataset.stroke = match[1];
    leafStrokes.set(match[1], button);
  }
  for (const match of html.matchAll(/<button\b[^>]*\bdata-lantern-piece="([^"]+)"[^>]*>/g)) {
    const button = element();
    button.dataset.lanternPiece = match[1];
    lanternPieces.set(match[1], button);
  }
  for (const match of html.matchAll(/<button\b[^>]*\bdata-lantern-adjust="([^"]+)"[^>]*>/g)) {
    const button = element();
    button.dataset.lanternAdjust = match[1];
    lanternAdjust.set(match[1], button);
  }
  if (page !== "liuyuan-leaf-writing-study")
    assert(directions.size === 4, `${page} \u7F3A\u5C11\u56DB\u4E2A\u89E6\u5C4F\u65B9\u5411\u952E`);
  const windowEvents = /* @__PURE__ */ new Map();
  const frames = [];
  const document = {
    getElementById: (id) => {
      if (!ids.has(id)) return null;
      if (!nodes[id]) {
        nodes[id] = element();
        nodes[id].hidden = initiallyHidden.has(id);
        const choiceGroups = {
          doorActions: ["choice", ["listen", "knock"]],
          answerChoices: ["answer", ["search", "wrong"]],
          paperChoices: ["paperAnswer", ["paper-ask", "paper-wait"]]
        };
        if (choiceGroups[id]) {
          const [name, values] = choiceGroups[id];
          const buttons = values.map((value) => {
            const button = element();
            button.dataset[name] = value;
            return button;
          });
          const attr = name === "paperAnswer" ? "data-paper-answer" : `data-${name}`;
          nodes[id].querySelectorAll = (selector) => selector === `[${attr}]` ? buttons : [];
        }
        if (id === "leafResearchLink") {
          const anchor = element();
          nodes[id].children = [anchor];
          nodes[id].querySelector = () => anchor;
        }
        if (id === "lanternPuzzle") {
          nodes[id].querySelectorAll = (selector) => selector === "[data-lantern-piece]" ? [...lanternPieces.values()] : selector === "[data-lantern-adjust]" ? [...lanternAdjust.values()] : [];
          nodes[id].querySelector = (selector) => {
            const key2 = selector?.match(/data-lantern-piece="([^"]+)"/)?.[1];
            return key2 ? lanternPieces.get(key2) ?? element() : element();
          };
        }
      }
      return nodes[id];
    },
    createElement: () => element(),
    querySelectorAll: (selector) => selector === "[data-dir]" ? [...directions.values()] : selector === "[data-leaf-action]" ? [...leafActions.values()] : selector === "[data-stroke]" ? [...leafStrokes.values()] : []
  };
  const progress = {
    version: 1,
    arts: { li: 0, yue: 0, she: 0, yu: 1, shu: 1, shuMath: 0 },
    gardens: {
      canglang: "open",
      wangshi: "locked",
      zhuozheng: "locked",
      shizilin: "locked",
      liuyuan: "entered",
      ouyuan: "locked",
      yipu: "locked",
      huanxiu: "locked",
      tuisi: "locked"
    },
    completedTasks: [],
    knowledge: [],
    storyFlags: LIUYUAN_CHAPTER_FLAGS.slice(0, flagCount),
    updatedAt: 1
  };
  class FakeImage {
    constructor() {
      this.complete = readyImages;
      this.naturalWidth = readyImages ? 1008 : 0;
      this.naturalHeight = readyImages ? 688 : 0;
      this.src = "";
    }
    addEventListener() {
    }
  }
  let progressJson = initialProgressJson ?? JSON.stringify(progress);
  const progressKey = search.includes("playtest=1") ? "gusu-nine-gardens-liuyuan-playtest-v1" : "gusu-nine-gardens-rpg-v1";
  let assignedUrl = "";
  (0, import_node_vm.runInNewContext)((0, import_node_fs.readFileSync)(script[1], "utf8"), {
    document,
    window: { name: "", addEventListener(type, handler) {
      windowEvents.set(type, [...windowEvents.get(type) ?? [], handler]);
    } },
    location: { search, assign(url) {
      assignedUrl = url;
    }, href: "" },
    localStorage: {
      getItem: (key2) => key2 === progressKey ? progressJson : key2 === "gusu:geometry-editor:liuyuan-entrance-topology-study:latest" ? draftRecord ?? null : null,
      setItem(key2, value) {
        if (key2 === progressKey) progressJson = value;
      }
    },
    sessionStorage: {
      getItem: (key2) => sessionRecords[key2] ?? null,
      setItem(key2, value) {
        sessionRecords[key2] = value;
      },
      removeItem(key2) {
        delete sessionRecords[key2];
      }
    },
    Image: FakeImage,
    URLSearchParams,
    structuredClone,
    requestAnimationFrame: (callback) => {
      frames.push(callback);
      return frames.length;
    }
  }, { filename: `${page}${search}` });
  if (search.includes("return=1")) {
    const returnCopy = page === "liuyuan-entry" ? nodes.modeTitle?.textContent : nodes.routeNotice?.textContent;
    assert(returnCopy && /(出园|回|返程)/.test(returnCopy), `${page} \u672A\u8FDB\u5165\u6B63\u5F0F\u8FD4\u7A0B\u6A21\u5F0F`);
  }
  const geometryToggle = nodes.showTiles ?? nodes.showGeometry;
  if (page !== "liuyuan-leaf-writing-study")
    assert(geometryToggle && nodes.coords, `${page} \u7F3A\u5C11\u8C03\u8BD5\u811A\u70B9`);
  let now = 0;
  function frame() {
    now += 16;
    const callback = frames.shift();
    assert(callback, `${page} \u52A8\u753B\u5E27\u4E2D\u65AD`);
    callback(now);
  }
  function foot() {
    assert(geometryToggle, `${page} \u6CA1\u6709\u5730\u9762\u811A\u70B9`);
    geometryToggle.checked = true;
    frame();
    geometryToggle.checked = false;
    const match = nodes.coords.textContent.match(/(?:脚点|鞋底) \((\d+), (\d+)\)/);
    assert(match, `${page} \u672A\u8F93\u51FA\u811A\u70B9\u5750\u6807`);
    return [Number(match[1]), Number(match[2])];
  }
  function key(type, direction) {
    const name = { up: "ArrowUp", left: "ArrowLeft", down: "ArrowDown", right: "ArrowRight" }[direction];
    for (const handler of windowEvents.get(type) ?? []) handler({ key: name, repeat: false, preventDefault() {
    } });
  }
  function rawKey(name) {
    for (const handler of windowEvents.get("keydown") ?? []) handler({ key: name, repeat: false, preventDefault() {
    } });
  }
  function pointer(type, direction) {
    directions.get(direction).dispatch(type, { pointerId: 1, preventDefault() {
    } });
  }
  function blur() {
    for (const handler of windowEvents.get("blur") ?? []) handler({});
  }
  function pagehide() {
    for (const handler of windowEvents.get("pagehide") ?? []) handler({});
  }
  return {
    frame,
    foot,
    key,
    rawKey,
    pointer,
    blur,
    pagehide,
    sessionRecords,
    nodes,
    leafActions,
    leafStrokes,
    lanternPieces,
    lanternAdjust,
    assignedUrl: () => assignedUrl,
    savedProgress: () => progressJson,
    storyFlags: () => JSON.parse(progressJson).storyFlags
  };
}
var moves = [];
for (const [page, search] of [...pages, ...returnPages]) {
  let usableDirections = 0;
  for (const direction of ["up", "left", "down", "right"]) {
    const keyboard = boot(page, search);
    const touch = boot(page, search);
    const startKey = keyboard.foot();
    const startTouch = touch.foot();
    assert(startKey.join() === startTouch.join(), `${page} \u4E24\u79CD\u8F93\u5165\u51FA\u751F\u70B9\u4E0D\u540C`);
    keyboard.key("keydown", direction);
    touch.pointer("pointerdown", direction);
    for (let i = 0; i < 8; i++) {
      keyboard.frame();
      touch.frame();
    }
    const endKey = keyboard.foot();
    const endTouch = touch.foot();
    assert(endKey.join() === endTouch.join(), `${page} ${direction} \u952E\u76D8/\u89E6\u5C4F\u811A\u70B9\u4E0D\u4E00\u81F4`);
    if (endKey.join() !== startKey.join()) usableDirections++;
    keyboard.key("keyup", direction);
    touch.pointer("pointerup", direction);
    for (let i = 0; i < 3; i++) {
      keyboard.frame();
      touch.frame();
    }
    assert(keyboard.foot().join() === endKey.join(), `${page} ${direction} \u677E\u952E\u540E\u4ECD\u5728\u884C\u8D70`);
    assert(touch.foot().join() === endTouch.join(), `${page} ${direction} \u677E\u5F00\u89E6\u5C4F\u952E\u540E\u4ECD\u5728\u884C\u8D70`);
    keyboard.key("keydown", direction);
    touch.pointer("pointerdown", direction);
    keyboard.blur();
    touch.blur();
    keyboard.frame();
    touch.frame();
    assert(keyboard.foot().join() === endKey.join(), `${page} \u5931\u7126\u540E\u952E\u76D8\u4ECD\u5728\u884C\u8D70`);
    assert(touch.foot().join() === endTouch.join(), `${page} \u5931\u7126\u540E\u89E6\u5C4F\u4ECD\u5728\u884C\u8D70`);
  }
  assert(usableDirections > 0, `${page} \u51FA\u751F\u70B9\u56DB\u65B9\u5411\u5747\u65E0\u6CD5\u79FB\u52A8`);
  moves.push(`${page}${search.includes("return=1") ? "\u8FD4" : "\u8FDB"}: ${usableDirections}/4`);
}
console.log(`\u7559\u56ED\u516B\u5E55\u6B63\u5411\u4E0E\u4E03\u5E55\u8FD4\u7A0B\uFF1A\u952E\u76D8/\u89E6\u5C4F\u8FDE\u7EED\u79FB\u52A8\u3001\u677E\u5F00\u4E0E\u5931\u7126\u6A21\u62DF\u901A\u8FC7\uFF1B\u51FA\u751F\u70B9\u53EF\u8D70\u65B9\u5411 ${moves.join("\uFF0C")}\u3002`);
for (const input of ["keyboard", "touch"]) {
  const oblique = boot("liuyuan-entry-oblique-study", "?draft=1");
  const start = oblique.foot();
  assert(start.join() === "770,915", "\u659C\u4FEF\u89C6\u9996\u955C\u5934\u51FA\u751F\u811A\u70B9\u5E94\u5728\u95E8\u5916\u77F3\u8DEF");
  if (input === "keyboard") oblique.key("keydown", "up");
  else oblique.pointer("pointerdown", "up");
  for (let i = 0; i < 12; i++) oblique.frame();
  const after = oblique.foot();
  assert(after[1] < start[1] && after[0] === start[0], `\u659C\u4FEF\u89C6\u9996\u955C\u5934${input}\u79FB\u52A8\u5E94\u6CBF\u95E8\u5916\u77F3\u8DEF\u5411\u95E8\u69DB`);
  if (input === "keyboard") oblique.key("keyup", "up");
  else oblique.pointer("pointerup", "up");
  for (let i = 0; i < 3; i++) oblique.frame();
  assert(oblique.foot().join() === after.join(), `\u659C\u4FEF\u89C6\u9996\u955C\u5934${input}\u677E\u5F00\u540E\u5E94\u505C\u6B65`);
  oblique.nodes.look.click();
  assert(oblique.nodes.status.textContent.includes("\u77F3\u5730"), "\u9996\u955C\u5934\u89C2\u5BDF\u5E94\u7ED9\u573A\u9762\u53CD\u9988\uFF0C\u4E0D\u5199\u7AE0\u8282\u72B6\u6001");
}
console.log("\u7559\u56ED\u659C\u4FEF\u89C6\u5165\u53E3\u9996\u955C\u5934: \u72EC\u7ACB\u9875\u9762\u952E\u76D8/\u89E6\u5C4F\u79FB\u52A8\u3001\u505C\u6B65\u548C\u89C2\u5BDF\u6A21\u62DF\u901A\u8FC7\uFF1B\u4E0D\u8BA1 CH3 \u6574\u7AE0\u3002");
for (const input of ["keyboard", "touch"]) {
  const lvyinPixel = boot("liuyuan-lvyin", "?artStudy=pixel-v2&draft=1", 0, void 0, true);
  assert(
    lvyinPixel.nodes.sceneBadge.textContent.includes("\u4E0D\u5199 CH3"),
    "\u50CF\u7D20\u4E34\u6C60\u7814\u7A76\u9875\u5FC5\u987B\u660E\u786E\u9694\u79BB\u7AE0\u6D41"
  );
  assert(
    lvyinPixel.nodes.returnCourt.hidden,
    "\u50CF\u7D20\u4E34\u6C60\u7814\u7A76\u9875\u4E0D\u5E94\u8BEF\u5BFC\u8DF3\u56DE\u6B63\u5F0F\u5C0F\u5EAD"
  );
  assert(
    lvyinPixel.nodes.editorLink.href.includes("liuyuan-lvyin-pond-pixel-study-v2"),
    "\u50CF\u7D20\u4E34\u6C60\u7814\u7A76\u9875\u987B\u94FE\u63A5\u72EC\u7ACB\u7F16\u8F91\u5668 ID"
  );
  const start = lvyinPixel.foot();
  if (input === "keyboard") lvyinPixel.key("keydown", "left");
  else lvyinPixel.pointer("pointerdown", "left");
  for (let i = 0; i < 12; i++) lvyinPixel.frame();
  const after = lvyinPixel.foot();
  assert(after[0] < start[0], `\u50CF\u7D20\u4E34\u6C60${input}\u6CBF\u5CB8\u5E94\u53EF\u5411\u897F\u884C\u8D70`);
  if (input === "keyboard") lvyinPixel.key("keyup", "left");
  else lvyinPixel.pointer("pointerup", "left");
  for (let i = 0; i < 3; i++) lvyinPixel.frame();
  assert(lvyinPixel.foot().join() === after.join(), `\u50CF\u7D20\u4E34\u6C60${input}\u677E\u5F00\u5E94\u505C\u6B65`);
  assert(
    lvyinPixel.storyFlags().length === 0 && !lvyinPixel.assignedUrl(),
    "\u50CF\u7D20\u4E34\u6C60\u7814\u7A76\u9875\u4E0D\u53EF\u5199\u65D7\u6807\u6216\u8DF3\u8F6C\u6B63\u5F0F\u7AE0\u6D41"
  );
}
console.log("\u7EFF\u836B\u8F69\u50CF\u7D20\u6821\u4F4D: \u72EC\u7ACB\u8349\u7A3F\u3001\u952E\u76D8/\u89E6\u5C4F\u79FB\u52A8\u4E0E\u7AE0\u6D41\u9694\u79BB\u6A21\u62DF\u901A\u8FC7\uFF1B\u56FE\u9762\u4ECD\u5F85\u4EBA\u5DE5\u5BF9\u4F4D\u3002");
function walkWaypoints(harness, input, waypoints, scene) {
  const held = /* @__PURE__ */ new Set();
  const setHeld = (direction, active) => {
    if (active === held.has(direction)) return;
    if (active) held.add(direction);
    else held.delete(direction);
    if (input === "keyboard") harness.key(active ? "keydown" : "keyup", direction);
    else harness.pointer(active ? "pointerdown" : "pointerup", direction);
  };
  for (const [label, x, y, radius = 30] of waypoints) {
    let last = harness.foot();
    let stagnant = 0;
    for (let i = 0; i < 150; i++) {
      const dx = x - last[0], dy = y - last[1];
      if (Math.hypot(dx, dy) < radius) break;
      const threshold = Math.min(8, radius / 2);
      setHeld("left", dx < -threshold);
      setHeld("right", dx > threshold);
      setHeld("up", dy < -threshold);
      setHeld("down", dy > threshold);
      for (let frame = 0; frame < 6; frame++) harness.frame();
      const next = harness.foot();
      const couldBeValidFoot = [-0.5, 0, 0.5].some((ox) => [-0.5, 0, 0.5].some((oy) => !collides(
        scene.map,
        next[0] + ox,
        next[1] + oy,
        scene.w,
        scene.h,
        scene.obstacles,
        STANDARD_PLAYER_PROFILE
      )));
      assert(couldBeValidFoot, `${label} \u811A\u70B9\u8FDB\u5165\u6C34\u9762\u3001\u5B9E\u4F53\u6216\u975E\u94FA\u5730\u533A\uFF1A${next.join()}`);
      stagnant = next.join() === last.join() ? stagnant + 1 : 0;
      assert(stagnant < 12, `${label} \u884C\u8D70\u5728 (${next.join()}) \u5361\u4F4F`);
      last = next;
    }
    for (const direction of [...held]) setHeld(direction, false);
    assert(
      Math.hypot(last[0] - x, last[1] - y) < radius,
      `${label} \u672A\u8D70\u5230\u76EE\u6807\u811A\u70B9\uFF1A\u505C\u5728 (${last.join()})\uFF0C\u76EE\u6807 (${x},${y})`
    );
  }
}
for (const input of ["keyboard", "touch"]) {
  const lanternSave = JSON.stringify({
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
    storyFlags: ["ly-errand-offered", "ly-huabu-seen", "ly-gate-clue"],
    updatedAt: 0
  });
  const entry = boot("liuyuan-entry", "", 0, lanternSave);
  walkWaypoints(
    entry,
    input,
    [["\u95E8\u623F\u706F\u7B3C", 520, 614, 15]],
    { ...buildLiuyuanEntryStudyMap(), obstacles: [] }
  );
  if (entry.nodes.dialogue.hidden) entry.nodes.interact.click();
  assert(entry.nodes.choices.children.length === 3, "\u95E8\u623F\u5E94\u4FDD\u7559\u539F\u5E94\u7B54\u5E76\u591A\u4E00\u4E2A\u81EA\u613F\u6276\u706F\u9009\u9879");
  if (input === "keyboard") entry.rawKey("3");
  else entry.nodes.choices.children[2].click();
  assert(
    !entry.nodes.lanternPuzzle.hidden && !entry.storyFlags().includes("ly-gate-passed"),
    "\u6276\u706F\u5F00\u59CB\u65F6\u4EBA\u5E94\u505C\u4F4F\u3001\u95E8\u8FD8\u4E0D\u80FD\u76F4\u63A5\u901A\u884C"
  );
  const still = entry.foot();
  entry.rawKey("ArrowUp");
  entry.frame();
  assert(entry.foot().join() === still.join(), "\u6276\u706F\u65F6\u65B9\u5411\u952E\u4E0D\u5E94\u63A8\u52A8\u89D2\u8272\u7A7F\u95E8");
  if (input === "keyboard") entry.rawKey("1");
  else entry.lanternPieces.get("0").click();
  if (input === "keyboard") entry.rawKey("Enter");
  else entry.nodes.lanternTry.click();
  assert(
    !entry.nodes.lanternPuzzle.hidden && !entry.storyFlags().includes("ly-lantern-helped"),
    "\u9519\u8BEF\u7AF9\u7BFE\u5E94\u80FD\u91CD\u8BD5\uFF0C\u4E0D\u53EF\u767D\u62FF\u6276\u706F\u72B6\u6001"
  );
  if (input === "keyboard") entry.rawKey("2");
  else entry.lanternPieces.get("1").click();
  if (input === "keyboard") entry.rawKey("Enter");
  else entry.nodes.lanternTry.click();
  assert(
    !entry.nodes.lanternPuzzle.hidden && !entry.storyFlags().includes("ly-gate-passed"),
    "\u9009\u5BF9\u5F27\u5F62\u4F46\u672A\u5BF9\u51C6\u63A5\u5934\u65F6\u4ECD\u4E0D\u53EF\u76F4\u63A5\u8FC7\u5173"
  );
  if (input === "touch") {
    entry.nodes.lanternTarget.dispatch("pointerdown", { pointerId: 1, clientX: 10, preventDefault() {
    } });
    entry.nodes.lanternTarget.dispatch("pointermove", { pointerId: 1, clientX: 19.15 });
    entry.nodes.lanternTarget.dispatch("pointerup", { pointerId: 1 });
    assert(
      entry.nodes.lanternFittedPiece.getAttribute("transform")?.includes("translate(0 0)"),
      "\u62D6\u52A8\u7AF9\u7BFE\u5E94\u771F\u5B9E\u6539\u53D8\u5176\u6A2A\u5411\u4F4D\u7F6E"
    );
  }
  for (let step = 0; step < 3; step++) {
    if (input === "keyboard") {
      entry.rawKey("ArrowRight");
      entry.rawKey("ArrowUp");
    } else entry.lanternAdjust.get("counterclockwise").click();
  }
  assert(!entry.nodes.lanternPuzzle.hidden, "\u5BF9\u51C6\u540E\u8FD8\u987B\u7531\u73A9\u5BB6\u4E3B\u52A8\u8BD5\u6276\u7A33");
  if (input === "keyboard") entry.rawKey("Enter");
  else entry.nodes.lanternTry.click();
  assert(entry.nodes.lanternPuzzle.hidden && entry.storyFlags().includes("ly-lantern-helped") && entry.storyFlags().includes("ly-gate-passed"), "\u9009\u5F62\u5E76\u5BF9\u51C6\u706F\u9AA8\u540E\u5E94\u7559\u4E0B\u4EBA\u7269\u8BB0\u5FC6\u5E76\u653E\u884C");
  const skipped = boot("liuyuan-entry", "", 0, lanternSave);
  walkWaypoints(
    skipped,
    input,
    [["\u95E8\u623F\u706F\u7B3C", 520, 614, 15]],
    { ...buildLiuyuanEntryStudyMap(), obstacles: [] }
  );
  if (skipped.nodes.dialogue.hidden) skipped.nodes.interact.click();
  if (input === "keyboard") skipped.rawKey("3");
  else skipped.nodes.choices.children[2].click();
  skipped.nodes.lanternLeave.click();
  assert(
    skipped.storyFlags().includes("ly-gate-passed") && !skipped.storyFlags().includes("ly-lantern-helped"),
    "\u8DF3\u8FC7\u6276\u706F\u4ECD\u5E94\u6B63\u5E38\u9001\u7CA5\uFF0C\u4E0D\u80FD\u8BEF\u8BB0\u5E2E\u706F"
  );
}
console.log("\u5165\u53E3\u6276\u706F\uFF1A\u952E\u76D8/\u70B9\u6309\u9009\u5F62\u3001\u5E73\u79FB\u3001\u8F6C\u89D2\u3001\u8BD5\u6276\u7A33\u3001\u9519\u8BEF\u91CD\u8BD5\u3001\u6682\u505C\u884C\u8D70\u4E0E\u975E\u5FC5\u7ECF\u653E\u884C\u6A21\u62DF\u901A\u8FC7\u3002");
var lanternPreview = boot("liuyuan-entry", "", 0, JSON.stringify({
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
}));
lanternPreview.nodes.replayLantern.click();
assert(!lanternPreview.nodes.lanternPuzzle.hidden, "\u65E7\u5B58\u6863\u548C\u7A7A\u5B58\u6863\u90FD\u5E94\u80FD\u5355\u72EC\u56DE\u770B\u6276\u706F");
lanternPreview.lanternPieces.get("1").click();
for (let step = 0; step < 3; step++) {
  lanternPreview.lanternAdjust.get("right").click();
  lanternPreview.lanternAdjust.get("counterclockwise").click();
}
lanternPreview.nodes.lanternTry.click();
assert(
  lanternPreview.nodes.lanternPuzzle.hidden && lanternPreview.storyFlags().length === 0,
  "\u5355\u72EC\u56DE\u770B\u4E0D\u5E94\u7ED9\u73A9\u5BB6\u5B58\u6863\u6DFB\u706F\u9AA8\u6216\u95E8\u623F\u7AE0\u65D7\u6807"
);
var completedProgressByInput = /* @__PURE__ */ new Map();
var entryMarkup = (0, import_node_fs.readFileSync)("liuyuan-entry.html", "utf8");
assert(
  /<div class="stage">[\s\S]*?<section id="dialogue"[\s\S]*?<\/section><\/div>/.test(entryMarkup),
  "\u5165\u53E3\u4EBA\u7269\u5BF9\u767D\u987B\u51FA\u73B0\u5728\u753B\u9762\u5185\uFF0C\u4E0D\u53EF\u85CF\u5728\u6574\u5F20\u753B\u5E03\u4E0B\u65B9"
);
for (const page of ["liuyuan-court", "liuyuan-lvyin"]) {
  const markup = (0, import_node_fs.readFileSync)(`${page}.html`, "utf8");
  assert(
    /<div class="stage">[\s\S]*?<button class="stage-action" id="continueChapter"/.test(markup),
    `${page} \u7684\u8FC7\u5E55\u6309\u94AE\u5E94\u4E0E\u573A\u666F\u5904\u4E8E\u540C\u4E00\u89C6\u91CE`
  );
  const chapterScene = boot(page, "?chapter=1");
  assert(chapterScene.nodes.stageNote.hidden, `${page} \u6B63\u5F0F\u7AE0\u6D41\u4E0D\u5E94\u8986\u76D6\u8C03\u8BD5\u8BF4\u660E\u5361`);
}
var playtestEntry = boot("liuyuan-entry", "?playtest=1", 0);
playtestEntry.frame();
assert(
  !playtestEntry.nodes.playtestBanner.hidden && playtestEntry.nodes.playtestStart.hidden,
  "\u8BD5\u73A9\u5165\u53E3\u5E94\u660E\u793A\u72EC\u7ACB\u8FDB\u5EA6\uFF0C\u4E0D\u518D\u663E\u793A\u91CD\u590D\u7684\u5F00\u59CB\u94FE\u63A5"
);
assert(
  !playtestEntry.nodes.interactionCue.hidden && playtestEntry.nodes.interactionCue.textContent.includes("\u4E54\u8001\u53DF"),
  "\u4ECE\u5934\u8BD5\u73A9\u7684\u51FA\u751F\u70B9\u5E94\u76F4\u63A5\u663E\u793A\u8FD1\u8EAB\u4EBA\u7269\u4EA4\u4E92\u63D0\u793A"
);
playtestEntry.nodes.playtestRestart.click();
assert(
  playtestEntry.assignedUrl() === "liuyuan-entry.html?playtest=1",
  "\u91CD\u5F00\u8BD5\u73A9\u5E94\u7559\u5728\u72EC\u7ACB\u8BD5\u73A9\u6A21\u5F0F"
);
var playtestEastHall = boot(
  "liuyuan-east-hall",
  "?route=modern&from=flower&draft=1&playtest=1"
);
assert(
  playtestEastHall.nodes.backToFlower.href === "liuyuan-flower.html?chapter=1&draft=1&playtest=1",
  "\u5802\u524D\u9662\u9876\u90E8\u8FD4\u82B1\u6728\u9662\u94FE\u63A5\u4E0D\u80FD\u4E22\u6389\u72EC\u7ACB\u8BD5\u73A9\u5B58\u6863"
);
for (const input of ["keyboard", "touch"]) {
  const emptySave = JSON.stringify({
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
  });
  const chooseFirst = (harness, label) => {
    assert(harness.nodes.choices?.children.length, `${label} \u7F3A\u5C11\u4EBA\u7269\u5E94\u7B54\u9009\u9879`);
    if (input === "keyboard") harness.rawKey("1");
    else harness.nodes.choices.children[0].click();
  };
  const advanceLines = (harness, count) => {
    for (let i = 0; i < count; i++) harness.nodes.interact.click();
  };
  let entry = boot("liuyuan-entry", "?draft=1", 0, emptySave);
  const reloadEntry = () => {
    entry.pagehide();
    const footBefore = entry.foot();
    entry = boot("liuyuan-entry", "?draft=1", 0, entry.savedProgress(), void 0, false, entry.sessionRecords);
    assert(entry.foot().join() === footBefore.join(), `${input} \u5237\u65B0\u5E94\u6062\u590D\u5165\u53E3\u539F\u978B\u5E95\uFF0C\u4E0D\u9000\u56DE\u95E8\u5916`);
  };
  assert(!entry.storyFlags().length, "\u5165\u53E3\u6D4B\u8BD5\u5FC5\u987B\u4ECE\u65E0\u7559\u56ED\u65D7\u6807\u7684\u5B58\u6863\u5F00\u59CB");
  entry.nodes.interact.click();
  assert(entry.nodes.speaker.textContent === "\u89C2\u5BDF", "\u95E8\u5916\u5E94\u5148\u7531\u62C5\u5B50\u548C\u4EBA\u89E6\u53D1\u6545\u4E8B");
  advanceLines(entry, 2);
  chooseFirst(entry, "\u66FF\u8001\u53DF\u63D0\u7CA5");
  assert(entry.storyFlags().includes("ly-errand-offered"), "\u63A5\u53D7\u6258\u4ED8\u540E\u624D\u8BB0\u5F55\u9001\u7CA5");
  entry.nodes.interact.click();
  const entryMap = buildLiuyuanEntryStudyMap();
  assert(!collides(
    entryMap.map,
    LIUYUAN_ENTRY_QIAO_WAIT.x,
    LIUYUAN_ENTRY_QIAO_WAIT.y,
    entryMap.w,
    entryMap.h
  ), "\u4E54\u79BE\u5E94\u505C\u5728\u95E8\u5916\u77F3\u8DEF\uFF0C\u4E0D\u7AD9\u5728\u5899\u4F53\u4E2D");
  walkWaypoints(
    entry,
    input,
    [["\u4E54\u79BE", LIUYUAN_ENTRY_QIAO_WAIT.x, LIUYUAN_ENTRY_QIAO_WAIT.y, 15]],
    { ...buildLiuyuanEntryStudyMap(), obstacles: [] }
  );
  entry.nodes.interact.click();
  advanceLines(entry, 1);
  chooseFirst(entry, "\u4E54\u79BE\u6307\u8DEF");
  assert(entry.storyFlags().includes("ly-huabu-seen"), "\u542C\u4E54\u79BE\u8BF4\u5C0F\u95E8\u540E\u624D\u8BB0\u5F55\u53E3\u4EE4");
  walkWaypoints(
    entry,
    input,
    [["\u95E8\u623F", 520, 614, 15]],
    { ...buildLiuyuanEntryStudyMap(), obstacles: [] }
  );
  entry.nodes.interact.click();
  advanceLines(entry, 2);
  chooseFirst(entry, "\u95E8\u623F\u7B2C\u4E00\u6B21\u62E6\u8DEF");
  assert(
    entry.storyFlags().includes("ly-gate-clue") && !entry.storyFlags().includes("ly-gate-passed"),
    "\u7B2C\u4E00\u6B21\u62E6\u8DEF\u53EA\u7ED9\u7EBF\u7D22\uFF0C\u4E0D\u5E94\u76F4\u63A5\u8FC7\u95E8"
  );
  entry.nodes.interact.click();
  chooseFirst(entry, "\u7528\u8001\u53DF\u8EAB\u4EFD\u7EBF\u7D22\u7B54\u95E8\u623F");
  assert(entry.storyFlags().includes("ly-gate-passed"), "\u6B63\u786E\u5E94\u7B54\u540E\u624D\u5141\u8BB8\u7A7F\u95E8");
  advanceLines(entry, 3);
  walkWaypoints(
    entry,
    input,
    LIUYUAN_ALLEY_CHECKPOINTS.slice(0, 4).map((point) => [point.label, point.x, point.y, 12]),
    { ...buildLiuyuanEntryStudyMap(), obstacles: [] }
  );
  reloadEntry();
  walkWaypoints(
    entry,
    input,
    LIUYUAN_ALLEY_CHECKPOINTS.slice(4).map((point, index) => [point.label, point.x, point.y, index === 2 ? 24 : 12]),
    { ...buildLiuyuanEntryStudyMap(), obstacles: [] }
  );
  assert(!entry.storyFlags().includes("ly-alley-walked"), "\u62B5\u8FBE\u5C0F\u5EAD\u53E3\u540E\u4ECD\u987B\u4EB2\u624B\u653E\u6876");
  if (entry.nodes.dialogue.hidden) entry.nodes.interact.click();
  chooseFirst(entry, "\u5C0F\u5EAD\u53E3\u653E\u6876");
  assert(entry.storyFlags().includes("ly-alley-walked"), "\u653E\u6876\u540E\u624D\u7ED3\u7B97\u5939\u5F04\u5B9E\u8D70");
  reloadEntry();
  assert(entry.nodes.status.textContent.includes("\u6876\u8FD8\u653E\u5728\u811A\u8FB9"), "\u653E\u6876\u540E\u5237\u65B0\u4E0D\u80FD\u81EA\u52A8\u63D0\u6876");
  entry.nodes.interact.click();
  chooseFirst(entry, "\u63D0\u6876\u540E\u6CBF\u5899\u897F\u884C");
  assert(!entry.assignedUrl(), "\u63D0\u6876\u52A8\u4F5C\u5FC5\u987B\u7559\u5728\u672C\u5E55\uFF0C\u4E0D\u80FD\u76F4\u63A5\u8DF3\u8FC7\u897F\u6298\u77F3\u8DEF");
  entry.nodes.interact.click();
  assert(!entry.assignedUrl(), "\u5728\u6B47\u6876\u4F4D\u7F6E\u6309 E \u4E0D\u80FD\u63D0\u524D\u5207\u5230\u5C0F\u5EAD");
  walkWaypoints(entry, input, [
    ["\u6F0F\u7A97\u5357\u4FA7", 420, 232, 8],
    ["\u5C0F\u5EAD\u897F\u6298\u53E3", 340, 232, 12]
  ], { ...buildLiuyuanEntryStudyMap(), obstacles: [] });
  reloadEntry();
  walkWaypoints(
    entry,
    input,
    [["\u897F\u53E3\u8F6C\u573A", 290, 232, 12]],
    { ...buildLiuyuanEntryStudyMap(), obstacles: [] }
  );
  entry.nodes.interact.click();
  assert(
    entry.assignedUrl() === "liuyuan-court.html?chapter=1&draft=1",
    "\u5165\u5C0F\u5EAD\u5E94\u4FDD\u7559\u7AE0\u8282\u548C\u8349\u7A3F\u9884\u89C8"
  );
  entry.pagehide();
  assert(
    !entry.sessionRecords[entryResumeKey("campaign:forward:draft")],
    "\u79BB\u5F00\u5165\u53E3\u53BB\u5C0F\u5EAD\u540E\u4E0D\u80FD\u6B8B\u7559\u5165\u53E3\u4F4D\u7F6E\uFF0C\u5BFC\u81F4\u4E0B\u6B21\u5165\u56ED\u5077\u8DF3\u8DEF\u6BB5"
  );
  const court = boot(
    "liuyuan-court",
    entry.assignedUrl().slice("liuyuan-court.html".length),
    0,
    entry.savedProgress()
  );
  assert(court.storyFlags().includes("ly-alley-walked"), "\u5C0F\u5EAD\u5E94\u8BFB\u5230\u5165\u53E3\u5B9E\u8D70\u8FDB\u5EA6");
  walkWaypoints(court, input, [
    ["\u5C0F\u5EAD\u4E1C\u9662", 1170, 680],
    ["\u7A97\u4E0B", 1160, 650, 20]
  ], buildLiuyuanCourtStudyMap());
  court.nodes.look.click();
  walkWaypoints(court, input, [
    ["\u5EAD\u4E2D\u77F3\u8DEF", 790, 670],
    ["\u5EAD\u4E2D\u897F\u4FA7", 610, 625],
    ["\u5C0F\u5EAD\u6298\u89D2", 405, 550],
    ["\u897F\u5ECA", 340, 450],
    ["\u4E34\u6C60\u8F6C\u573A", 330, 305, 12]
  ], buildLiuyuanCourtStudyMap());
  court.nodes.continueChapter.click();
  assert(
    court.assignedUrl() === "liuyuan-lvyin.html?chapter=1&courtWindow=1&draft=1",
    "\u89C2\u5BDF\u6F0F\u7A97\u5E76\u8D70\u5230\u897F\u5ECA\u624D\u53EF\u63A5\u4E34\u6C60\uFF0C\u4E14\u4FDD\u7559\u8349\u7A3F\u53C2\u6570"
  );
  const lvyin = boot(
    "liuyuan-lvyin",
    court.assignedUrl().slice("liuyuan-lvyin.html".length),
    0,
    court.savedProgress()
  );
  walkWaypoints(lvyin, input, [
    ["\u6C60\u5357\u4E1C\u6BB5", 1250, 720],
    ["\u6C60\u5357\u4E2D\u6BB5", 930, 700, 25]
  ], buildLiuyuanLvyinStudyMap());
  lvyin.nodes.look.click();
  assert(lvyin.nodes.look.textContent === "\u6536", "\u6C60\u8FB9\u89C2\u5BDF\u5E94\u5207\u5165\u53EF\u9000\u51FA\u7684\u7B2C\u4E00\u4EBA\u79F0\u53D6\u666F");
  lvyin.frame();
  assert(lvyin.nodes.stageNote.textContent.includes("\u897F\u5317\u671B"), "\u53D6\u666F\u65F6\u5E94\u63D0\u793A\u89C6\u5411\u4E0E\u9000\u51FA\u65B9\u5F0F");
  lvyin.rawKey("Escape");
  assert(lvyin.nodes.look.textContent === "\u770B", "Esc \u5E94\u6536\u56DE\u6C60\u8FB9\u53D6\u666F");
  lvyin.nodes.look.click();
  walkWaypoints(lvyin, input, [
    ["\u6C60\u5357\u897F\u6BB5", 700, 710],
    ["\u53F0\u9636\u4E0B", 485, 630],
    ["\u8F69\u524D\u53F0\u9636", 375, 535],
    ["\u8F69\u524D", 250, 470, 25]
  ], buildLiuyuanLvyinStudyMap());
  assert(lvyin.nodes.look.textContent === "\u770B", "\u79FB\u52A8\u540E\u5E94\u81EA\u52A8\u6536\u56DE\u53D6\u666F\uFF0C\u7EE7\u7EED\u53EF\u8D70\u8DEF\u7EBF");
  lvyin.nodes.continueChapter.click();
  assert(
    lvyin.assignedUrl() === "liuyuan-flower.html?chapter=1&draft=1",
    "\u4E34\u6C60\u89C2\u5BDF\u540E\u624D\u53EF\u4ECE\u8F69\u524D\u63A5\u82B1\u6728\u9662"
  );
  const flower = boot(
    "liuyuan-flower",
    lvyin.assignedUrl().slice("liuyuan-flower.html".length),
    0,
    lvyin.savedProgress()
  );
  walkWaypoints(flower, input, [["\u6A90\u4E0B\u7CA5\u6876", 480, 500, 15]], buildLiuyuanFlowerStudyMap());
  flower.nodes.look.click();
  assert(
    flower.storyFlags().includes("ly-porridge-delivered"),
    `\u5230\u6A90\u4E0B\u6401\u6876\u624D\u8BB0\u5F55\u9001\u8FBE\uFF1A\u811A\u70B9 ${flower.foot().join()}\uFF0C\u63D0\u793A ${flower.nodes.status.textContent}`
  );
  assert(
    !flower.nodes.sceneMessage.hidden && flower.nodes.stageNote.hidden,
    "\u9001\u7CA5\u53CD\u9988\u5E94\u7559\u5728\u573A\u666F\u5185\uFF0C\u7AE0\u6D41\u8C03\u8BD5\u5361\u5E94\u9690\u85CF"
  );
  walkWaypoints(flower, input, [["\u82B1\u5320\u8EAB\u8FB9", 650, 485, 26]], buildLiuyuanFlowerStudyMap());
  flower.nodes.look.click();
  assert(!flower.nodes.dialogueActions.hidden, "\u9760\u8FD1\u82B1\u5320\u540E\u5E94\u80FD\u95EE\u8BDD\u6216\u770B\u6362\u571F");
  assert(
    flower.nodes.dialoguePrompt.textContent.length > 0,
    "\u82B1\u5320\u5E94\u7B54\u9762\u677F\u5E94\u540C\u65F6\u663E\u793A\u89E6\u53D1\u5B83\u7684\u5BF9\u767D"
  );
  flower.nodes.watchSoil.click();
  assert(flower.storyFlags().includes("ly-florist-met"), "\u89C2\u5BDF\u6362\u571F\u540E\u5E94\u83B7\u5F97\u7B14\u6811\u7EBF\u7D22");
  walkWaypoints(flower, input, [["\u82B1\u6728\u9662\u4E1C\u53E3", 1675, 445, 35]], buildLiuyuanFlowerStudyMap());
  flower.nodes.continueChapter.click();
  assert(
    flower.assignedUrl() === "liuyuan-east-hall.html?route=modern&from=flower&draft=1",
    "\u82B1\u5320\u7EBF\u7D22\u540E\u5E94\u53EF\u8D70\u5230\u4E1C\u53E3\uFF0C\u63A5\u5802\u524D\u9662"
  );
  assert(
    JSON.parse(flower.savedProgress()).arts.yu === 1,
    "\u5939\u5F04\u5B9E\u8D70\u5E94\u5728\u540C\u4E00\u4EFD\u5B58\u6863\u4E2D\u63D0\u5347\u5FA1\u827A"
  );
  const eastHall = boot(
    "liuyuan-east-hall",
    flower.assignedUrl().slice("liuyuan-east-hall.html".length),
    0,
    flower.savedProgress()
  );
  walkWaypoints(eastHall, input, [["\u5802\u524D\u5DE6\u6811", 515, 575, 18]], buildLiuyuanEastHallStudyMap());
  eastHall.nodes.look.click();
  assert(!eastHall.storyFlags().includes("ly-magnolia-seen"), "\u53EA\u770B\u4E00\u4FA7\u4E54\u6728\u4E0D\u53EF\u5F97\u5230\u7B14\u6811\u7EBF\u7D22");
  assert(
    !eastHall.nodes.sceneMessage.hidden && eastHall.nodes.stageNote.hidden,
    "\u5802\u524D\u89C2\u5BDF\u53CD\u9988\u5E94\u5728\u753B\u9762\u5185\uFF0C\u7AE0\u6D41\u8C03\u8BD5\u5361\u5E94\u9690\u85CF"
  );
  walkWaypoints(eastHall, input, [
    ["\u5802\u524D\u4E2D\u6BB5", 970, 620],
    ["\u5802\u524D\u53F3\u6811", 1390, 615, 20]
  ], buildLiuyuanEastHallStudyMap());
  eastHall.nodes.look.click();
  assert(eastHall.storyFlags().includes("ly-magnolia-seen"), "\u4E24\u4FA7\u4E54\u6728\u90FD\u89C2\u5BDF\u540E\u624D\u8BB0\u5F55\u7B14\u6811\u7EBF\u7D22");
  walkWaypoints(eastHall, input, [
    ["\u5802\u524D\u4E1C\u8DEF", 1670, 615],
    ["\u77F3\u6797\u8F6C\u573A", 1670, 525, 22]
  ], buildLiuyuanEastHallStudyMap());
  eastHall.nodes.continueChapter.click();
  assert(
    eastHall.assignedUrl() === "liuyuan-stone-forest.html?route=modern&from=east-hall&draft=1",
    "\u5802\u524D\u4E1C\u53E3\u5E94\u63A5\u77F3\u6797\uFF0C\u4FDD\u7559\u8349\u7A3F\u9884\u89C8"
  );
  const stone = boot(
    "liuyuan-stone-forest",
    eastHall.assignedUrl().slice("liuyuan-stone-forest.html".length),
    0,
    eastHall.savedProgress()
  );
  walkWaypoints(stone, input, [["\u8F69\u524D\u77F3\u9636", 530, 450, 25]], buildLiuyuanStoneForestStudyMap());
  stone.nodes.look.click();
  stone.frame();
  assert(
    !stone.nodes.sceneMessage.hidden && stone.nodes.stageNote.hidden,
    "\u77F3\u6797\u8F69\u524D\u53CD\u9988\u5E94\u5728\u753B\u9762\u5185\uFF0C\u7AE0\u6D41\u8C03\u8BD5\u5361\u5E94\u9690\u85CF"
  );
  assert(
    !stone.nodes.toStudyCourt.hidden,
    `\u5728\u63D6\u5CF0\u8F69\u5916\u89C2\u5BDF\u540E\u5E94\u663E\u51FA\u4E66\u658B\u9662\u8F6C\u573A\uFF1A\u811A\u70B9 ${stone.foot().join()}\uFF0C\u63D0\u793A ${stone.nodes.status.textContent}\uFF0C\u6A21\u5F0F ${stone.nodes.modeBadge.textContent}`
  );
  stone.nodes.toStudyCourt.click();
  assert(
    stone.assignedUrl() === "liuyuan-study-court.html?route=modern&from=stone-forest&draft=1",
    "\u77F3\u6797\u7ECF\u8F69\u524D\u624D\u53EF\u63A5\u4E66\u658B\u9662"
  );
  const studyCourt = boot(
    "liuyuan-study-court",
    stone.assignedUrl().slice("liuyuan-study-court.html".length),
    0,
    stone.savedProgress()
  );
  walkWaypoints(studyCourt, input, [
    ["\u9662\u4E2D\u77F3\u8DEF", 560, 750],
    ["\u4E66\u658B\u95E8\u524D", 480, 695, 22]
  ], buildLiuyuanStudyCourtMap());
  studyCourt.nodes.look.click();
  studyCourt.frame();
  assert(!studyCourt.nodes.doorActions.hidden, "\u4E66\u658B\u95E8\u524D\u542C\u5230\u7EB8\u58F0\u540E\u5E94\u51FA\u73B0\u8F7B\u53E9\u9009\u62E9");
  assert(
    studyCourt.nodes.stageNote.hidden && studyCourt.nodes.doorPrompt.textContent.includes("\u7EB8"),
    "\u4E66\u658B\u95E8\u524D\u5E94\u5728\u753B\u9762\u4E2D\u542C\u89C1\u7EB8\u58F0\uFF0C\u4E0D\u80FD\u53EA\u5728\u4FA7\u680F\u7ED9\u9009\u9879"
  );
  if (input === "keyboard") studyCourt.rawKey("2");
  else studyCourt.nodes.doorActions.querySelectorAll("[data-choice]").find((button) => button.dataset.choice === "knock").click();
  assert(studyCourt.storyFlags().includes("ly-study-found"), "\u5B9E\u9645\u8F7B\u53E9\u95E8\u540E\u624D\u8BB0\u5F55\u627E\u5230\u4E66\u658B");
  assert(
    studyCourt.nodes.interiorResearch.href === "liuyuan-study-interior.html?route=modern&from=study-court&draft=1",
    "\u8F7B\u53E9\u540E\u5E94\u63A5\u4E66\u658B\u5185\u666F\u5E76\u4FDD\u7559\u8349\u7A3F\u53C2\u6570"
  );
  const interior = boot(
    "liuyuan-study-interior",
    studyCourt.nodes.interiorResearch.href.slice("liuyuan-study-interior.html".length),
    0,
    studyCourt.savedProgress()
  );
  walkWaypoints(interior, input, [
    ["\u4E66\u658B\u4E2D\u592E", 770, 650],
    ["\u6284\u4E66\u4EBA\u6848\u524D", 630, 610, 22]
  ], buildLiuyuanStudyInteriorMap());
  interior.frame();
  assert(
    !interior.nodes.answerChoices.hidden && interior.storyFlags().includes("ly-scholar-met"),
    "\u8D70\u8FD1\u6284\u4E66\u4EBA\u624D\u5E94\u5F00\u542F\u5E94\u7B54\u5E76\u8BB0\u5F55\u76F8\u89C1"
  );
  assert(
    interior.nodes.stageNote.hidden && interior.nodes.answerPrompt.textContent.includes("\u95E8\u522B\u5173"),
    "\u6284\u4E66\u4EBA\u7684\u9996\u53E5\u4E0E\u5E94\u7B54\u5E94\u4E00\u8D77\u51FA\u73B0\u5728\u753B\u9762\u5185"
  );
  if (input === "keyboard") interior.rawKey("1");
  else interior.nodes.answerChoices.querySelectorAll("[data-answer]")[0].click();
  walkWaypoints(interior, input, [["\u4E66\u6848\u8FB9", 480, 610, 20]], buildLiuyuanStudyInteriorMap());
  interior.nodes.look.click();
  walkWaypoints(interior, input, [["\u7A97\u8FB9", 815, 560, 22]], buildLiuyuanStudyInteriorMap());
  interior.nodes.look.click();
  walkWaypoints(interior, input, [["\u518D\u5230\u6284\u4E66\u4EBA\u65C1", 630, 610, 22]], buildLiuyuanStudyInteriorMap());
  interior.nodes.look.click();
  interior.nodes.look.click();
  interior.frame();
  assert(!interior.nodes.paperChoices.hidden, "\u6284\u4E66\u4EBA\u5377\u7EB8\u53C8\u653E\u4E0B\u65F6\u5E94\u51FA\u73B0\u8FFD\u95EE\u9009\u62E9");
  assert(
    interior.nodes.paperPrompt.textContent.includes("\u7EB8"),
    "\u5377\u7EB8\u9009\u62E9\u5E94\u5728\u573A\u666F\u5185\u4EA4\u4EE3\u89E6\u53D1\u7684\u52A8\u4F5C"
  );
  if (input === "keyboard") interior.rawKey("1");
  else interior.nodes.paperChoices.querySelectorAll("[data-paper-answer]")[0].click();
  assert(interior.storyFlags().includes("ly-scholar-trouble-known"), "\u542C\u8FC7\u7EB8\u51FA\u95E8\u7684\u96BE\u9898\u624D\u63A8\u8FDB\u5267\u60C5");
  walkWaypoints(interior, input, [["\u518D\u770B\u7A97\u5916\u53F6", 815, 560, 22]], buildLiuyuanStudyInteriorMap());
  interior.nodes.look.click();
  walkWaypoints(interior, input, [["\u56DE\u5230\u6284\u4E66\u4EBA\u65C1", 630, 610, 22]], buildLiuyuanStudyInteriorMap());
  interior.nodes.look.click();
  walkWaypoints(interior, input, [["\u8D70\u56DE\u95E8\u69DB", 770, 890, 25]], buildLiuyuanStudyInteriorMap());
  interior.frame();
  assert(!interior.nodes.leafResearchLink.hidden, "\u4EBA\u7269\u5BF9\u767D\u7ED3\u675F\u540E\u4ECD\u987B\u8D70\u56DE\u95E8\u69DB\u624D\u663E\u51FA\u9898\u53F6\u5165\u53E3");
  assert(
    interior.nodes.leafResearchLink.children[0].href === "liuyuan-leaf-writing-study.html?route=modern&from=study-interior&draft=1",
    "\u9898\u53F6\u7279\u5199\u94FE\u63A5\u5E94\u7EE7\u627F\u7AE0\u8282\u4E0E\u8349\u7A3F\u53C2\u6570"
  );
  const leaf = boot(
    "liuyuan-leaf-writing-study",
    interior.nodes.leafResearchLink.children[0].href.slice("liuyuan-leaf-writing-study.html".length),
    0,
    interior.savedProgress()
  );
  const leafAct = (name, number) => {
    if (input === "keyboard") leaf.rawKey(number);
    else {
      const button = leaf.leafActions.get(name);
      assert(button, `\u9898\u53F6\u7F3A\u5C11 ${name} \u89E6\u5C4F\u6309\u94AE`);
      button.click();
    }
  };
  leafAct("old", "1");
  assert(!leaf.storyFlags().includes("ly-leaf-picked"), "\u67E5\u770B\u8001\u53F6\u4E0D\u5E94\u63D0\u524D\u8BB0\u5F55\u6458\u53F6");
  leafAct("new", "2");
  assert(leaf.storyFlags().includes("ly-leaf-picked"), "\u4EB2\u624B\u6311\u65B0\u53F6\u624D\u8BB0\u5F55\u6458\u53F6");
  leafAct("test-ink", "1");
  leafAct("hard-write", "1");
  assert(leaf.nodes.supportControls.hidden === false, "\u7528\u529B\u5199\u5931\u8D25\u540E\u5E94\u7559\u5728\u6258\u53F6\u9009\u62E9");
  leafAct("take-board", "2");
  for (let index = 0; index < 3; index++) {
    if (input === "keyboard") leaf.rawKey(String(index + 1));
    else leaf.leafStrokes.get(String(index)).click();
  }
  assert(
    leaf.storyFlags().includes("ly-leaf-written") && !leaf.nodes.doneControls.hidden,
    "\u4E09\u5904\u4F9D\u6B21\u843D\u7B14\u540E\u624D\u5B8C\u6210\u9898\u53F6"
  );
  const leafProgress = JSON.parse(leaf.savedProgress());
  assert(
    leafProgress.arts.shu === 1 && leafProgress.storyFlags.length === 13,
    "\u7A7A\u5B58\u6863\u5230\u9898\u53F6\u5E94\u4F9D\u5E8F\u5F97\u5230 13 \u4E2A\u4E8B\u4EF6\u5E76\u53EA\u53D1\u4E00\u6B21\u4E66\u827A"
  );
  assert(
    leaf.nodes.returnFromDone.href === "liuyuan-study-court.html?route=modern&from=leaf&draft=1&return=1",
    "\u9898\u53F6\u5B8C\u6210\u540E\u5E94\u5E26\u8FD4\u7A0B\u4E0E\u8349\u7A3F\u53C2\u6570\u56DE\u4E66\u658B\u9662"
  );
  completedProgressByInput.set(input, leaf.savedProgress());
}
console.log("\u7A7A\u5B58\u6863\u2192\u9001\u7CA5\u2192\u5939\u5F04\u2192\u5C0F\u5EAD\u2192\u4E34\u6C60\u2192\u82B1\u6728\u9662\u2192\u5802\u524D\u53CC\u6811\u2192\u77F3\u6797\u2192\u4E66\u658B\u4EBA\u7269\u2192\u4EB2\u624B\u9898\u53F6\uFF1A\u952E\u76D8/\u89E6\u5C4F\u6B63\u5411\u52A8\u4F5C\u94FE\u901A\u8FC7\u3002");
for (const input of ["keyboard", "touch"]) {
  const studyCourt = boot(
    "liuyuan-study-court",
    "?route=modern&from=leaf&draft=1&return=1",
    0,
    completedProgressByInput.get(input)
  );
  walkWaypoints(studyCourt, input, [
    ["\u4E66\u658B\u9662\u95E8\u524D\u79BB\u5F00", 560, 750],
    ["\u4E66\u658B\u9662\u53E3", 705, 830, 35]
  ], buildLiuyuanStudyCourtMap());
  studyCourt.nodes.toStoneReturn.click();
  assert(
    studyCourt.assignedUrl() === "liuyuan-stone-forest.html?route=modern&from=study-court&draft=1&return=1",
    "\u4E66\u658B\u9662\u8FD4\u7A0B\u5E94\u63A5\u77F3\u6797\uFF0C\u5E76\u4FDD\u7559\u8349\u7A3F\u9884\u89C8"
  );
  const stone = boot(
    "liuyuan-stone-forest",
    studyCourt.assignedUrl().slice("liuyuan-stone-forest.html".length),
    0,
    studyCourt.savedProgress()
  );
  walkWaypoints(stone, input, [
    ["\u63D6\u5CF0\u8F69\u5916\u9662\u5730", 530, 475],
    ["\u77F3\u6797\u897F\u9662\u8DEF", 470, 545, 28]
  ], buildLiuyuanStoneForestStudyMap());
  stone.nodes.toEastHallReturn.click();
  assert(
    stone.assignedUrl() === "liuyuan-east-hall.html?route=modern&from=stone-forest&draft=1&return=1",
    "\u77F3\u6797\u8FD4\u7A0B\u5E94\u63A5\u5802\u524D\u9662\uFF0C\u5E76\u4FDD\u7559\u8349\u7A3F\u9884\u89C8"
  );
  const eastHall = boot(
    "liuyuan-east-hall",
    stone.assignedUrl().slice("liuyuan-east-hall.html".length),
    0,
    stone.savedProgress()
  );
  walkWaypoints(eastHall, input, [
    ["\u5802\u524D\u4E1C\u4FA7\u4E0B\u884C", 1670, 615],
    ["\u5802\u524D\u4E1C\u9662\u8DEF", 1350, 615],
    ["\u5802\u524D\u4E2D\u592E\u77F3\u8DEF", 970, 620],
    ["\u5802\u524D\u897F\u9662\u8DEF", 600, 620],
    ["\u82B1\u6728\u9662\u65B9\u5411", 405, 580, 35]
  ], buildLiuyuanEastHallStudyMap());
  eastHall.nodes.toFlowerReturn.click();
  assert(
    eastHall.assignedUrl() === "liuyuan-flower.html?route=modern&from=east-hall&draft=1&return=1",
    "\u5802\u524D\u9662\u8FD4\u7A0B\u5E94\u63A5\u82B1\u6728\u9662\uFF0C\u5E76\u4FDD\u7559\u8349\u7A3F\u9884\u89C8"
  );
  const flower = boot(
    "liuyuan-flower",
    eastHall.assignedUrl().slice("liuyuan-flower.html".length),
    0,
    eastHall.savedProgress()
  );
  const hold = (direction) => input === "keyboard" ? flower.key("keydown", direction) : flower.pointer("pointerdown", direction);
  const release = (direction) => input === "keyboard" ? flower.key("keyup", direction) : flower.pointer("pointerup", direction);
  let position = flower.foot();
  assert(position[0] > 1600 && position[1] < 500, "\u8FD4\u7A0B\u5E94\u4ECE\u82B1\u6728\u9662\u4E1C\u4FA7\u51FA\u751F");
  hold("down");
  for (let i = 0; i < 40; i++) flower.frame();
  release("down");
  position = flower.foot();
  assert(position[1] >= 495 && position[1] <= 515, "\u4E1C\u4FA7\u901A\u9053\u5E94\u53EF\u4E0B\u884C\u5230\u82B1\u5320\u78B0\u649E\u76D2\u5357\u4FA7");
  hold("left");
  for (let i = 0; i < 850; i++) {
    flower.frame();
    if (i % 20 === 19 && flower.foot()[0] < 550) break;
  }
  release("left");
  position = flower.foot();
  assert(position[0] < 550 && position[0] > 350, "\u7ED5\u8FC7\u82B1\u5320\u540E\u5E94\u5230\u8FBE\u7A7A\u6876\u9644\u8FD1");
  flower.nodes.look.click();
  assert(
    flower.nodes.leafCarryActions && !flower.nodes.leafCarryActions.hidden,
    "\u8FD1\u6876\u89C2\u5BDF\u540E\u5E94\u51FA\u73B0\u6536\u53F6\u9009\u62E9"
  );
  assert(
    flower.nodes.leafCarryPrompt.textContent.includes("\u6E7F\u58A8"),
    "\u6536\u53F6\u9009\u62E9\u5E94\u5728\u573A\u666F\u5185\u4EA4\u4EE3\u6E7F\u58A8\u96BE\u9898"
  );
  flower.nodes.placeInBucket.click();
  assert(flower.storyFlags().includes("ly-leaf-carried"), "\u4EB2\u624B\u6536\u53F6\u5165\u6876\u624D\u53EF\u5199 ly-leaf-carried");
  hold("right");
  for (let i = 0; i < 250; i++) {
    flower.frame();
    if (i % 20 === 19 && flower.foot()[0] > 770) break;
  }
  release("right");
  position = flower.foot();
  assert(position[0] > 770 && position[0] < 910, "\u63D0\u7A7A\u6876\u540E\u5E94\u53EF\u6CBF\u9662\u5730\u8D70\u56DE\u5165\u53E3\u811A\u70B9");
  flower.nodes.toLvyinReturn.click();
  assert(
    flower.assignedUrl() === "liuyuan-lvyin.html?route=modern&from=flower&draft=1&return=1",
    "\u56DE\u4E34\u6C60\u8F6C\u573A\u5E94\u5E26\u4E0A\u7AE0\u8282\u8FD4\u7A0B\u4E0E\u7F16\u8F91\u5668\u8349\u7A3F\u9884\u89C8"
  );
  const lvyin = boot(
    "liuyuan-lvyin",
    flower.assignedUrl().slice("liuyuan-lvyin.html".length),
    0,
    flower.savedProgress()
  );
  walkWaypoints(lvyin, input, [
    ["\u8F69\u524D\u53F0\u9636", 375, 535],
    ["\u53F0\u9636\u4E0B", 485, 630],
    ["\u6C60\u5357\u77F3\u8DEF\u897F\u6BB5", 700, 710],
    ["\u4E34\u6C60\u4E2D\u6BB5", 930, 700],
    ["\u6C60\u5357\u77F3\u8DEF\u4E1C\u6BB5", 1250, 720],
    ["\u5C0F\u5EAD\u65B9\u5411", 1650, 740]
  ], buildLiuyuanLvyinStudyMap());
  lvyin.nodes.toCourtReturn.click();
  assert(
    lvyin.assignedUrl() === "liuyuan-court.html?route=modern&from=lvyin&draft=1&return=1",
    "\u6CBF\u4E34\u6C60\u77F3\u8DEF\u5230\u4E1C\u4FA7\u540E\u5E94\u80FD\u8F6C\u573A\u5C0F\u5EAD\uFF0C\u5E76\u4FDD\u7559\u8349\u7A3F\u9884\u89C8"
  );
  const court = boot(
    "liuyuan-court",
    lvyin.assignedUrl().slice("liuyuan-court.html".length),
    0,
    lvyin.savedProgress()
  );
  walkWaypoints(court, input, [
    ["\u5C0F\u5EAD\u897F\u5ECA\u4E0B\u884C", 340, 450],
    ["\u5C0F\u5EAD\u6298\u89D2", 405, 550],
    ["\u5EAD\u4E2D\u897F\u4FA7", 610, 625],
    ["\u5EAD\u4E2D\u77F3\u8DEF", 790, 670],
    ["\u7A97\u4E0B\u77F3\u8DEF", 1170, 680],
    ["\u5939\u5F04\u53E3", 1560, 680, 45]
  ], buildLiuyuanCourtStudyMap());
  court.nodes.toEntryReturn.click();
  assert(
    court.assignedUrl() === "liuyuan-entry.html?route=modern&from=court&draft=1&return=1",
    "\u6CBF\u5C0F\u5EAD\u77F3\u8DEF\u5230\u5939\u5F04\u53E3\u540E\u5E94\u80FD\u8F6C\u573A\u5165\u53E3\uFF0C\u5E76\u4FDD\u7559\u8349\u7A3F\u9884\u89C8"
  );
  let entry = boot(
    "liuyuan-entry",
    court.assignedUrl().slice("liuyuan-entry.html".length),
    0,
    court.savedProgress()
  );
  const reloadReturn = () => {
    entry.pagehide();
    const footBefore = entry.foot();
    entry = boot(
      "liuyuan-entry",
      "?route=modern&from=court&draft=1&return=1",
      0,
      entry.savedProgress(),
      void 0,
      false,
      entry.sessionRecords
    );
    assert(entry.foot().join() === footBefore.join(), `${input} \u8FD4\u7A0B\u5237\u65B0\u5E94\u6062\u590D\u539F\u978B\u5E95`);
  };
  assert(entry.nodes.chapterComplete?.hidden, "\u672A\u8D70\u8FD4\u7A0B\u5939\u5F04\u65F6\u4E0D\u53EF\u663E\u793A\u7AE0\u672B\u7ED3\u7B97");
  walkWaypoints(
    entry,
    input,
    LIUYUAN_ALLEY_RETURN_CHECKPOINTS.slice(0, 5).map((point) => [point.label, point.x, point.y, 12]),
    { ...buildLiuyuanEntryStudyMap(), obstacles: [] }
  );
  reloadReturn();
  walkWaypoints(
    entry,
    input,
    LIUYUAN_ALLEY_RETURN_CHECKPOINTS.slice(5, -1).map((point) => [point.label, point.x, point.y, 12]),
    { ...buildLiuyuanEntryStudyMap(), obstacles: [] }
  );
  assert(!entry.storyFlags().includes("ly-unlocked"), "\u7AD9\u5728\u95E8\u69DB\u5185\u4E0D\u53EF\u63D0\u524D\u7ED3\u7B97\u51FA\u56ED");
  entry.nodes.interact.click();
  assert(
    !entry.nodes.dialogue?.hidden && entry.nodes.speaker?.textContent === "\u95E8\u623F",
    "\u95E8\u69DB\u524D\u5E94\u7531\u95E8\u623F\u4EBA\u7269\u89E6\u53D1\u5E94\u7B54"
  );
  entry.nodes.nextLine.click();
  assert(entry.nodes.choices?.children.length === 2, "\u95E8\u623F\u5E94\u6709\u4E24\u79CD\u53EF\u9009\u5E94\u7B54");
  if (input === "keyboard") entry.rawKey("1");
  else entry.nodes.choices.children[0].click();
  entry.nodes.interact.click();
  entry.nodes.interact.click();
  reloadReturn();
  assert(entry.nodes.status.textContent.includes("\u95E8\u623F\u5DF2\u8BA9\u5F00"), "\u95E8\u623F\u5E94\u7B54\u540E\u5237\u65B0\u4E0D\u5E94\u518D\u62E6\u8DEF");
  assert(
    !entry.storyFlags().includes("ly-unlocked") && entry.nodes.chapterComplete.hidden,
    "\u95E8\u623F\u5DF2\u7ECF\u8BA9\u8DEF\u4F46\u73A9\u5BB6\u672A\u8E0F\u8857\u9762\u65F6\u4ECD\u4E0D\u53EF\u7ED3\u7B97"
  );
  walkWaypoints(entry, input, [[
    "\u8857\u9762\u811A\u70B9",
    LIUYUAN_ALLEY_RETURN_CHECKPOINTS.at(-1).x,
    LIUYUAN_ALLEY_RETURN_CHECKPOINTS.at(-1).y,
    10
  ]], { ...buildLiuyuanEntryStudyMap(), obstacles: [] });
  assert(
    entry.storyFlags().includes("ly-unlocked") && !entry.nodes.chapterComplete.hidden,
    "\u95E8\u623F\u5E94\u7B54\u540E\u771F\u6B63\u8E0F\u5230\u8857\u9762\u624D\u53EF\u7ED3\u7B97\u7559\u56ED\u7AE0"
  );
  const completed = JSON.parse(entry.savedProgress());
  assert(
    completed.storyFlags.join(",") === LIUYUAN_CHAPTER_FLAGS.join(","),
    "\u4ECE\u7A7A\u5B58\u6863\u8D70\u5B8C\u6574\u7AE0\u540E\u5E94\u6309\u56FA\u5B9A\u987A\u5E8F\u6070\u597D\u8BB0\u5F55 15 \u4E2A\u4E8B\u4EF6"
  );
  assert(
    completed.arts.yu === 1 && completed.arts.shu === 1 && completed.gardens.liuyuan === "complete",
    "\u4ECE\u7A7A\u5B58\u6863\u8D70\u5B8C\u6574\u7AE0\u540E\u5FA1\u4E0E\u4E66\u5404\u589E\u52A0\u4E00\u6B21\uFF0C\u7559\u56ED\u56ED\u6001\u5B8C\u6210"
  );
}
console.log("\u540C\u4E00\u4EFD\u7A7A\u5B58\u6863\u9898\u53F6\u540E\u2192\u4E66\u658B\u9662\u2192\u77F3\u6797\u2192\u5802\u524D\u2192\u82B1\u6728\u9662\u2192\u4E34\u6C60\u2192\u5C0F\u5EAD\u2192\u5939\u5F04\u2192\u8857\u9762\uFF1A\u952E\u76D8/\u89E6\u5C4F\u8FD4\u7A0B\u300115 \u4E8B\u4EF6\u3001\u5FA1/\u4E66\u5956\u52B1\u4E0E\u56ED\u6001\u7ED3\u7B97\u901A\u8FC7\u3002");
console.log("\u5165\u53E3\u5237\u65B0\u7EED\u63A5\uFF1A\u6B63\u5411\u4E2D\u6BB5\u3001\u653E\u6876\u3001\u63D0\u6876\u897F\u6298\u3001\u9006\u884C\u4E2D\u6BB5\u3001\u95E8\u623F\u5DF2\u5E94\u7B54\u5747\u4FDD\u7559\u811A\u70B9\u548C\u72B6\u6001\uFF1B\u79BB\u5E55\u6E05\u9664\u5165\u53E3\u4F1A\u8BDD\u4F4D\u7F6E\u3002");
var validResume = {
  version: 1,
  progressStamp: "progress-A",
  geometryStamp: "geometry-A",
  state: {
    x: 420,
    y: 232,
    dir: 1,
    alleyCheckpoint: 7,
    returnCheckpoint: 0,
    gateAnswered: false,
    bucketResting: false
  }
};
var resumeContext = {
  slot: "test",
  progressStamp: "progress-A",
  geometryStamp: "geometry-A",
  maxAlley: 7,
  maxReturn: 11,
  canStand: (x, y) => x === 420 && y === 232,
  stateAllowed: () => true
};
assert(parseEntryResume(JSON.stringify(validResume), resumeContext), "\u5408\u6CD5\u7EED\u63A5\u8BB0\u5F55\u5E94\u53EF\u6062\u590D");
for (const invalid of [
  "{broken",
  "null",
  JSON.stringify({ ...validResume, version: 2 }),
  JSON.stringify({ ...validResume, progressStamp: "old-save" }),
  JSON.stringify({ ...validResume, geometryStamp: "old-draft" }),
  JSON.stringify({ ...validResume, state: { ...validResume.state, x: 421 } }),
  JSON.stringify({ ...validResume, state: { ...validResume.state, dir: 8 } }),
  JSON.stringify({ ...validResume, state: { ...validResume.state, alleyCheckpoint: 8 } }),
  JSON.stringify({ ...validResume, state: { ...validResume.state, bucketResting: "true" } })
]) {
  assert(parseEntryResume(invalid, resumeContext) === null, "\u7834\u635F\u3001\u8FC7\u671F\u3001\u78B0\u649E\u6216\u975E\u6CD5\u7EED\u63A5\u5E94\u5B89\u5168\u56DE\u9000");
}
assert(
  !parseEntryResume(JSON.stringify(validResume), { ...resumeContext, stateAllowed: () => false }),
  "\u5267\u60C5\u95E8\u69DB\u4E0D\u53EF\u7531\u4F1A\u8BDD\u7EED\u63A5\u7ED5\u8FC7"
);
assert(
  entryResumeKey("playtest:forward:default") !== entryResumeKey("campaign:forward:default") && entryResumeKey("campaign:forward:draft") !== entryResumeKey("campaign:chapter-return:draft"),
  "\u72EC\u7ACB\u8BD5\u73A9\u3001\u6B63\u5F0F\u7AE0\u6D41\u3001\u6B63\u8FD4\u7A0B\u4E0E\u8349\u7A3F\u4F4D\u7F6E\u5E94\u4F7F\u7528\u4E0D\u540C\u69FD"
);
console.log("\u7EED\u63A5\u8FB9\u754C\uFF1A\u635F\u574F\u3001\u5B58\u6863/\u51E0\u4F55\u53D8\u5316\u3001\u975E\u6CD5\u811A\u70B9\u3001\u5267\u60C5\u95E8\u69DB\u53CA\u6A21\u5F0F\u9694\u79BB\u53CD\u4F8B\u901A\u8FC7\u3002");
for (const [depthY, shouldCover] of [[670, true], [600, false]]) {
  const record = JSON.stringify({ savedAt: 1, value: JSON.stringify({
    format: "gusu-scene-geometry",
    sceneId: "liuyuan-entrance-topology-study",
    world: { width: 1008, height: 688 },
    tileRegions: LIUYUAN_ENTRY_DRAFT_REGIONS,
    objects: [{ id: "gate-front-mask", occluder: {
      depthY,
      polygons: [[[505, 604], [535, 604], [535, 635], [505, 635]]]
    } }],
    actorScalePercent: 100
  }) });
  clipCalls = 0;
  const masked = boot("liuyuan-entry", "?draft=1", 0, void 0, record, true);
  masked.frame();
  assert(
    clipCalls > 0 === shouldCover,
    `\u5165\u53E3\u8349\u7A3F\u906E\u6321\u5E94\u6309\u7269\u4EF6\u843D\u5730\u7EBF\u91CD\u7ED8\uFF1AdepthY=${depthY}\uFF0Cclip=${clipCalls}`
  );
  assert(masked.foot().join() === "520,656", "\u5165\u53E3\u906E\u6321\u8349\u7A3F\u4E0D\u5E94\u6539\u53D8\u73A9\u5BB6\u51FA\u751F\u811A\u70B9");
}
console.log("\u5165\u53E3\u7F16\u8F91\u5668\u8349\u7A3F\u906E\u6321\uFF1A\u811A\u70B9\u5728\u843D\u5730\u7EBF\u540E\u65B9\u91CD\u7ED8\u524D\u666F\uFF0C\u524D\u65B9\u4E0D\u91CD\u7ED8\uFF0C\u4F4D\u7F6E\u4FDD\u6301\u4E0D\u53D8\u3002");
