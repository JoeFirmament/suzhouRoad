"use strict";

// scripts/verify-editor-catalog.ts
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");

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
      edges: Object.keys(LIUYUAN_ENTRY_LOWER_FEET).slice(1).map((id, index, ids2) => ({
        from: `lower-${index === 0 ? "street" : ids2[index - 1]}`,
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
      edges: Object.keys(LIUYUAN_ENTRY_OBLIQUE_FEET).slice(1).map((id, index, ids2) => ({
        from: `oblique-${index === 0 ? "street" : ids2[index - 1]}`,
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
var SCENE_DRAFT_PREVIEWS = {
  "liuyuan-entrance-topology-study": { href: "liuyuan-entry.html?draft=1", label: "\u9884\u89C8\u7559\u56ED\u5165\u53E3 \xB7 \u5F53\u524D\u8349\u7A3F" },
  "liuyuan-entry-gate-misty-study-v2": { href: "liuyuan-entry-gate-misty-study.html?draft=1", label: "\u9884\u89C8\u51B7\u8C03\u95E8\u5899 \xB7 \u72EC\u7ACB\u7814\u7A76\u8349\u7A3F" },
  "liuyuan-entry-oblique-shot-study-v1": { href: "liuyuan-entry-oblique-study.html?draft=1", label: "\u9884\u89C8\u5165\u53E3\u659C\u4FEF\u89C6\u9996\u955C\u5934 \xB7 \u72EC\u7ACB\u6821\u4F4D\u8349\u7A3F" },
  "liuyuan-entry-lower-camera-study-v1": { href: "liuyuan-entry-lower-camera-study.html?draft=1", label: "\u9884\u89C8\u5165\u53E3\u4F4E\u673A\u4F4D \xB7 \u72EC\u7ACB\u7814\u7A76\u8349\u7A3F" },
  "liuyuan-alley-misty-study-v1": { href: "liuyuan-alley-misty-study.html?draft=1", label: "\u9884\u89C8\u51B7\u8C03\u5939\u5F04 \xB7 \u72EC\u7ACB\u7814\u7A76\u8349\u7A3F" },
  "liuyuan-tree-court-no-water-study-v1": { href: "liuyuan-court.html?draft=1", label: "\u9884\u89C8\u7559\u56ED\u5C0F\u5EAD \xB7 \u5F53\u524D\u8349\u7A3F" },
  "liuyuan-lvyin-pond-study-v1": { href: "liuyuan-lvyin.html?draft=1", label: "\u9884\u89C8\u7EFF\u836B\u8F69\u4E34\u6C60 \xB7 \u5F53\u524D\u8349\u7A3F" },
  "liuyuan-lvyin-pond-pixel-study-v2": { href: "liuyuan-lvyin.html?artStudy=pixel-v2&draft=1", label: "\u9884\u89C8\u7EFF\u836B\u8F69\u50CF\u7D20\u6821\u4F4D \xB7 \u72EC\u7ACB\u8349\u7A3F" },
  "liuyuan-flower-work-yard-study-v3": { href: "liuyuan-flower.html?draft=1", label: "\u9884\u89C8\u82B1\u6728\u4F5C\u4E1A\u9662 \xB7 \u5F53\u524D\u8349\u7A3F" },
  "liuyuan-youyicun-transition-study-v1": { href: "liuyuan-youyicun-study.html?draft=1", label: "\u9884\u89C8\u73B0\u72B6\u5706\u95E8\u51E0\u4F55 \xB7 \u5F53\u524D\u8349\u7A3F" },
  "liuyuan-east-hall-magnolia-court-study-v1": { href: "liuyuan-east-hall.html?draft=1", label: "\u9884\u89C8\u5B85\u9662\u5385\u524D \xB7 \u5F53\u524D\u8349\u7A3F" },
  "liuyuan-stone-forest-court-study-v1": { href: "liuyuan-stone-forest.html?draft=1", label: "\u9884\u89C8\u77F3\u6797\u5C0F\u9662 \xB7 \u5F53\u524D\u8349\u7A3F" },
  "liuyuan-study-court-research-v1": { href: "liuyuan-study-court.html?draft=1", label: "\u9884\u89C8\u5317\u7F18\u4E66\u658B\u9662 \xB7 \u5F53\u524D\u8349\u7A3F" },
  "liuyuan-study-interior-research-v1": { href: "liuyuan-study-interior.html?draft=1", label: "\u9884\u89C8\u4E66\u658B\u5185\u666F \xB7 \u5F53\u524D\u8349\u7A3F" },
  "liuyuan-dongtian-three-windows-study-v1": { href: "liuyuan-window-study.html?debug=geometry&draft=1", label: "\u9884\u89C8\u4E09\u7A97\u8FA8\u5F71 \xB7 \u5F53\u524D\u8349\u7A3F" },
  "liuyuan-guanyun-court-study-v1": { href: "liuyuan-guanyun.html?draft=1", label: "\u9884\u89C8\u51A0\u4E91\u5CF0\u65E7\u7A3F \xB7 \u5F53\u524D\u8349\u7A3F" },
  "liuyuan-guanyun-court-study-v2": { href: "liuyuan-guanyun-v2.html?draft=1", label: "\u9884\u89C8\u51A0\u4E91\u5CF0\uFF0F\u5357\u5385 v2 \xB7 \u5F53\u524D\u8349\u7A3F" }
};

// src/data/scene-evidence.ts
var SCENE_EVIDENCE = [
  {
    id: "opening-city-south",
    title: "\u5E8F\u7AE0 \xB7 \u82CF\u5DDE\u57CE\u5357\u6C34\u5DF7",
    period: "\u5149\u7EEA\u5341\u516D\u5E74\u524D\u540E\uFF08\u7EA6 1890\uFF09",
    state: "geometry",
    sources: [{
      id: "sucheng-1890",
      title: "\u300A\u8607\u57CE\u5168\u5716\u300B\u6E05\u672B\u57CE\u5E02\u5E95\u672C",
      local: "../assets/sucheng1890/",
      grade: "A",
      note: "\u53EA\u7528\u4E8E\u6CB3\u8857\u683C\u5C40\u548C\u57CE\u5357\u65B9\u5411\uFF1B\u5F53\u524D\u5E8F\u7AE0\u5C0F\u6865\u4E0E\u94FA\u9762\u5E76\u975E\u67D0\u6761\u5B9E\u540D\u8857\u5DF7\u590D\u539F\u3002"
    }],
    verifiedFacts: ["\u57CE\u5357\u6CB3\u8857\u76F8\u95F4\uFF0C\u6C34\u8DEF\u662F\u8FA8\u8BA4\u57CE\u5E02\u65B9\u5411\u7684\u91CD\u8981\u4F9D\u636E\u3002"],
    inferredForPlay: ["\u6606\u66F2\u58F0\u7ED5\u6C34\u800C\u6765", "\u65E0\u540D\u5C0F\u6865\u4E0E\u4E34\u6C34\u5C94\u8DEF", "\u4ECE\u6C34\u5DF7\u6B65\u884C\u81F3\u5E9C\u5B66\u7684\u8FDE\u7EED\u955C\u5934"],
    redLines: ["\u4E0D\u5F97\u7ED9\u672A\u8003\u8BC1\u7684\u5C0F\u6865\u3001\u5DF7\u9053\u548C\u5E97\u94FA\u5B89\u4E0A\u771F\u5B9E\u5730\u540D", "\u4E0D\u5F97\u628A\u5E8F\u7AE0\u753B\u9762\u79F0\u4E3A\u539F\u5740\u590D\u539F"]
  },
  {
    id: "fuxue-west-home",
    title: "\u82CF\u5DDE\u5E9C\u5B66 Home \xB7 \u897F\u5B66\u5207\u7247",
    period: "\u5149\u7EEA\u5341\u516D\u5E74\u524D\u540E\uFF08\u7EA6 1890\uFF09",
    state: "playable",
    sources: [{
      id: "fuxue-museum",
      title: "\u82CF\u5DDE\u7891\u523B\u535A\u7269\u9986\uFF08\u82CF\u5DDE\u6587\u5E99\u7BA1\u7406\u6240\uFF09\u5355\u4F4D\u7B80\u4ECB",
      url: "https://wglj.suzhou.gov.cn/szwhgdhlyj/wgjjgsz/202110/c3aaa7c3d3b74b0d9cc198d49f28a610.shtml",
      grade: "B",
      note: "\u786E\u8BA4\u5E9C\u5B66\u6587\u5E99\u6CBF\u9769\u3001\u73B0\u5B58\u660E\u4EE3\u91CD\u4FEE\u98CE\u683C\u3001\u89C4\u6A21\u4E0E\u7891\u523B/\u62D3\u7247\u529F\u80FD\u3002"
    }, {
      id: "fuxue-design",
      title: "\u300A\u82CF\u5DDE\u5E9C\u5B66 Home \u8BBE\u8BA1\u5B9A\u6848\u300B",
      local: "../\u59D1\u82CF\u4E5D\u56ED-\u82CF\u5DDE\u5E9C\u5B66Home\u8BBE\u8BA1\u5B9A\u6848.md",
      grade: "C",
      note: "\u897F\u5B66\u5BBF\u820D\u3001\u4E2A\u4EBA\u4E66\u6848\u4E0E\u751F\u6D3B\u9053\u5177\u4E3A\u6E38\u620F\u529F\u80FD\u5207\u7247\uFF0C\u4E0D\u5BA3\u79F0\u5BF9\u5E94\u73B0\u5B58\u5177\u4F53\u623F\u53F7\u3002"
    }],
    verifiedFacts: ["\u5E9C\u5B66\u6587\u5E99\u4E3A\u5E99\u5B66\u590D\u5408\u7A7A\u95F4", "\u5E9C\u5B66\u4FDD\u5B58\u7891\u523B\u4E0E\u62D3\u7247", "\u73B0\u5B58\u5EFA\u7B51\u591A\u4FDD\u7559\u660E\u4EE3\u91CD\u4FEE\u98CE\u683C"],
    inferredForPlay: ["\u897F\u4FA7\u658B\u820D\u4F5C\u4E3A\u73A9\u5BB6\u5BBF\u820D", "\u9662\u5185\u5C0F\u6C34\u9762\u4E0E\u6865", "\u4E66\u6848\u3001\u5E8A\u94FA\u3001\u7BB1\u7B3C\u7684\u5177\u4F53\u6446\u4F4D"],
    redLines: ["\u897F\u5B66\u95E8\u524D\u4E0D\u753B\u672A\u7ECF\u8BC1\u5B9E\u7684\u6CB3\u9053", "\u4E0D\u628A\u5F53\u524D\u5207\u7247\u5192\u5145\u5B8C\u6574\u5E9C\u5B66\u603B\u5E73\u9762", "\u73B0\u4EE3\u6587\u5E99\u5E7F\u573A\u53CA 2002 \u5E74\u540E\u8BBE\u65BD\u4E0D\u5F97\u8FDB\u5165 1890 \u573A\u666F"]
  },
  {
    id: "sucheng-1890-world",
    title: "\u300A\u8607\u57CE\u5168\u5716\u300BRPG \u4E16\u754C\u5C42",
    period: "\u6E05\u672B\u82CF\u5DDE",
    state: "geometry",
    sources: [{
      id: "sucheng-1890",
      title: "\u300A\u8607\u57CE\u5168\u5716\u300B\u79BB\u7EBF\u5E95\u672C\u4E0E\u8F6C\u8BD1\u8D44\u4EA7",
      local: "../assets/sucheng1890/",
      grade: "A",
      note: "\u4E16\u754C\u5C42\u53EA\u4F7F\u7528\u57CE\u5899\u3001\u6CB3\u9053\u3001\u4E3B\u8857\u548C\u56ED\u5740\u5173\u7CFB\uFF1B\u4E0D\u4EE5\u300A\u5E73\u6C5F\u56FE\u300B\u4EE3\u66FF\u6E05\u672B\u65E5\u5E38\u5730\u56FE\u3002"
    }, {
      id: "pingjiang-stele",
      title: "\u82CF\u5DDE\u7891\u523B\u535A\u7269\u9986\u300A\u5E73\u6C5F\u56FE\u300B\u8BF4\u660E",
      url: "https://wglj.suzhou.gov.cn/szwhgdhlyj/wgjjgsz/202110/c3aaa7c3d3b74b0d9cc198d49f28a610.shtml",
      grade: "B",
      note: "\u300A\u5E73\u6C5F\u56FE\u300B\u662F\u5B8B\u4EE3\u57CE\u5E02\u8BB0\u5FC6\u4E0E\u5E9C\u5B66\u85CF\u7891\uFF0C\u4E0D\u662F 1890 \u65E5\u5E38\u5BFC\u822A\u5E95\u56FE\u3002"
    }],
    verifiedFacts: ["\u5E9C\u5B66\u4E0E\u6CA7\u6D6A\u4EAD\u4F4D\u4E8E\u53E4\u57CE\u5357\u90E8\u4E14\u76F8\u90BB", "\u57CE\u5E02\u8FA8\u8DEF\u4EE5\u6CB3\u9053\u3001\u6865\u4E0E\u8857\u5DF7\u5171\u540C\u6784\u6210"],
    inferredForPlay: ["\u5730\u56FE\u968F\u8BFE\u4E1A\u9010\u6B65\u663E\u58A8", "\u672A\u89E3\u9501\u533A\u57DF\u4EE5\u7559\u767D\u5448\u73B0"],
    redLines: ["\u73B0\u4EE3\u9053\u8DEF\u548C\u5730\u94C1\u4E0D\u5F97\u5199\u8FDB 1890 \u4E16\u754C\u5C42", "\u300A\u5E73\u6C5F\u56FE\u300B\u4E0D\u5F97\u4F5C\u4E3A\u6E05\u672B\u5B9E\u65F6\u5BFC\u822A\u5730\u56FE"]
  },
  {
    id: "canglang-garden",
    title: "\u6CA7\u6D6A\u4EAD \xB7 \u6574\u56ED\u5BFC\u822A",
    period: "\u665A\u6E05\u4FEE\u590D\u540E\u7684\u6CA7\u6D6A\u4EAD",
    state: "playable",
    sources: [{
      id: "late-qing-visit",
      title: "\u6E05\u4EBA\u300A\u6E38\u6CA7\u6D6A\u4EAD\u8BB0\u300B",
      url: "https://ylj.suzhou.gov.cn/szsylj/ylwh/201910/dd3ad8eba81d49ffbef0d51403b9c265.shtml",
      grade: "A",
      note: "\u7ED9\u51FA\u6E21\u6865\u3001\u5C71\u95E8\u3001\u5047\u5C71\u3001\u6C34\u6C60\u3001\u5ECA\u3001\u9762\u6C34\u8F69\u7B49\u665A\u6E05\u7A7A\u95F4\u6B21\u5E8F\u3002"
    }, {
      id: "current-visitor-plan",
      title: "\u6CA7\u6D6A\u4EAD\u5168\u666F\u5BFC\u89C8\u56FE\uFF08\u542B\u5317\u7BAD\u5934\uFF09",
      url: "https://news.2500sz.com/uploadfiles/202509/08/2025090810003176504948.jpg",
      grade: "B",
      note: "\u7528\u4E8E\u6838\u5BF9\u4ECA\u5929\u7684\u5165\u53E3\u3001\u6865\u3001\u6C34\u548C\u56ED\u754C\u65B9\u4F4D\uFF1B1890 \u65AD\u4EE3\u4ECD\u987B\u4E0E\u540C\u671F\u53F2\u6599\u4EA4\u53C9\u6838\u67E5\u3002"
    }, {
      id: "unesco-plan",
      title: "UNESCO \u6CA7\u6D6A\u4EAD\u4FDD\u62A4\u8303\u56F4\u53CA\u7F13\u51B2\u533A\u5E73\u9762\u56FE",
      url: "https://whc.unesco.org/document/104745",
      grade: "B",
      note: "\u7528\u4E8E\u73B0\u72B6\u65B9\u4F4D\u3001\u56ED\u754C\u4E0E\u5468\u8FB9\u57CE\u5E02\u5173\u7CFB\uFF0C\u4E0D\u76F4\u63A5\u4EE3\u66FF 1890 \u5EFA\u7B51\u65AD\u4EE3\u3002"
    }],
    verifiedFacts: ["\u73B0\u72B6\u5BFC\u89C8\u56FE\u793A\u56ED\u5357\u53CA\u897F\u4FA7\u4E34\u5916\u6C34\uFF0C\u5357\u4FA7\u7ECF\u6865\u5165\u56ED", "\u5165\u95E8\u89C1\u5C71\uFF0C\u5C71\u4E0E\u6C34\u6784\u6210\u4E3B\u666F", "\u590D\u5ECA\u8054\u7CFB\u56ED\u5185\u5C71\u666F\u4E0E\u56ED\u5916\u6C34\u666F", "\u9762\u6C34\u8F69\u4F4D\u4E8E\u590D\u5ECA\u897F\u7AEF"],
    inferredForPlay: ["\u6574\u56ED\u538B\u7F29\u4E3A 1 tile \u7EA6 1 \u7C73", "\u4E09\u6247\u6559\u5B66\u7A97\u7684\u4F4D\u7F6E\u4E0E\u6731\u6846", "\u82E5\u5E72\u6811\u4F4D\u3001\u82B1\u5883\u548C\u652F\u8DEF\u5BBD\u5EA6"],
    redLines: ["\u4E0D\u53EF\u518D\u5C06\u5165\u53E3\u6865\u4E0E\u56ED\u5916\u6C34\u753B\u5230\u5317\u4FA7", "\u4E09\u6247\u6559\u5B66\u7A97\u5FC5\u987B\u6807\u4F5C\u827A\u672F\u52A0\u5DE5", "\u672A\u7ECF\u9010\u6247\u5B9E\u52D8\u4E0D\u5F97\u7ED9\u6F0F\u7A97\u7ED1\u5B9A\u771F\u5B9E\u7EB9\u6837", "\u4FDD\u62A4\u533A\u56FE\u4E0A\u7684\u73B0\u4EE3\u9053\u8DEF\u4E0D\u80FD\u76F4\u63A5\u8FDB\u5165\u665A\u6E05\u56ED\u5185"]
  },
  {
    id: "canglang-corridor",
    title: "\u6CA7\u6D6A\u4EAD \xB7 \u590D\u5ECA\u8FD1\u666F",
    period: "\u665A\u6E05\u7A7A\u95F4\u5173\u7CFB / \u6E38\u620F\u8FD1\u666F\u6F14\u7ECE",
    state: "playable",
    sources: [{
      id: "garden-bureau-corridor",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u56ED\u6797\u5EFA\u7B51\u201C\u590D\u5ECA\u201D\u8BF4\u660E",
      url: "https://ylj.suzhou.gov.cn/szsylj/ylys/201903/484421d38f504f5787a8f307925e3ad7.shtml",
      grade: "B",
      note: "\u786E\u8BA4\u590D\u5ECA\u7531\u4E24\u5ECA\u5939\u5899\u3001\u4EE5\u6F0F\u7A97\u8054\u7CFB\u4E24\u4FA7\u666F\u533A\u5E76\u4EA7\u751F\u6B65\u79FB\u666F\u5F02\u3002"
    }, {
      id: "late-qing-visit",
      title: "\u6E05\u4EBA\u300A\u6E38\u6CA7\u6D6A\u4EAD\u8BB0\u300B",
      url: "https://ylj.suzhou.gov.cn/szsylj/ylwh/201910/dd3ad8eba81d49ffbef0d51403b9c265.shtml",
      grade: "A",
      note: "\u786E\u8BA4\u4E34\u6C34\u5EFA\u7B51\u3001\u5ECA\u7EBF\u4E0E\u9762\u6C34\u8F69\u7B49\u7A7A\u95F4\u5173\u7CFB\u3002"
    }, {
      id: "canglang-window-figures",
      title: "\u66F9\u6797\u5A23\u300A\u56FE\u8BF4\u82CF\u5DDE\u56ED\u6797\xB7\u82B1\u7A97\u300B\u6CA7\u6D6A\u4EAD\u56FE\u4F8B",
      local: "../../SuzhouClassicGardenRag/Project/converted/\u56FE\u8BF4\u82CF\u5DDE\u56ED\u6797 \u82B1\u7A97 (\u66F9\u6797\u5A23) (z-library.sk, 1lib.sk, z-lib.sk)/hybrid_auto/",
      grade: "C",
      note: "\u672C\u5730\u5411\u91CF\u53EC\u56DE\u5E76\u4EBA\u5DE5\u6838\u56FE 1-87\u30013-95\u30014-69\u30013-235\u30013-32\u30012-86\uFF1B\u4EC5\u8BC1\u7EB9\u6837\u7C7B\u578B\uFF0C\u4E0D\u8BC1\u672C\u573A\u5177\u4F53\u7A97\u4F4D\u3001\u5E8F\u5217\u4E0E\u5E74\u4EE3\u3002"
    }],
    verifiedFacts: ["\u590D\u5ECA\u4EE5\u4E2D\u5899\u548C\u6F0F\u7A97\u8FDE\u63A5\u5185\u5C71\u5916\u6C34", "\u79FB\u52A8\u4F1A\u6539\u53D8\u900F\u7A97\u6240\u89C1\u666F\u7269"],
    inferredForPlay: ["\u53D7\u7EA6\u675F\u4E2D\u5FC3\u8DEF\u5F84", "\u4E09\u7A97\u770B\u2014\u5BF9\u2014\u5408\u673A\u5236", "\u5DEE\u5F02\u5316\u82B1\u7A97\u7EB9\u6837\u4E0E\u7A97\u5916\u4E09\u5E45\u666F", "\u53F3\u4E0A\u67FF\u6811\u4E0E\u679C\u5B9E"],
    redLines: ["\u4E0D\u5F97\u5BA3\u79F0\u5177\u4F53\u82B1\u7A97\u7EB9\u6837\u7684\u987A\u5E8F\u3001\u4E09\u5904\u7A97\u4F4D\u6216\u67FF\u6811\u4F4D\u7F6E\u662F\u5386\u53F2\u539F\u8C8C", "\u6C34\u7EB9\u4E0D\u5F97\u8986\u76D6\u5ECA\u9762\u4E0E\u77F3\u57FA", "\u753B\u9762\u4E0D\u753B\u901A\u957F\u524D\u680F\u4E0D\u7B49\u4E8E\u8003\u8BC1\u8BC1\u660E\u539F\u5740\u65E0\u680F\u6746"]
  },
  {
    id: "canglang-whole-garden-study-v2",
    title: "\u6CA7\u6D6A\u4EAD \xB7 \u7070\u7EFF\u89C6\u89C9\u8BD5\u7A3F v2",
    period: "\u665A\u6E05\u7A7A\u95F4\u5173\u7CFB / \u5F53\u4EE3\u5BFC\u89C8\u65B9\u4F4D",
    state: "reference",
    sources: [{
      id: "canglang-bureau",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u6CA7\u6D6A\u4EAD",
      url: "https://ylj.suzhou.gov.cn/szsylj/sjyc/201904/92cba6ca05a2451bb363c82895cc862e.shtml",
      grade: "B",
      note: "\u5916\u6C34\u3001\u5C71\u6797\u3001\u590D\u5ECA\u4E0E\u5802\u9986\u7684\u603B\u4F53\u5173\u7CFB\uFF1B\u4E0D\u80FD\u8BC1\u660E\u56FE\u4E2D\u6BCF\u4E00\u95E8\u3001\u6BCF\u68F5\u6811\u3002"
    }, {
      id: "canglang-late-qing-walk",
      title: "\u6E05\u4EBA\u300A\u6E38\u6CA7\u6D6A\u4EAD\u8BB0\u300B",
      url: "https://ylj.suzhou.gov.cn/szsylj/ylwh/201910/dd3ad8eba81d49ffbef0d51403b9c265.shtml",
      grade: "A",
      note: "\u6587\u4E2D\u660E\u786E\u5ECA\u5899\u5185\u5916\u7686\u53EF\u884C\u8D70\uFF0C\u6545\u6574\u56ED\u56FE\u5FC5\u987B\u8868\u73B0\u53CC\u4FA7\u5730\u9762\u3002"
    }],
    verifiedFacts: ["\u56ED\u5916\u6C34\u4E0E\u56ED\u4E2D\u5C71\u501F\u666F\u76F8\u63A5", "\u590D\u5ECA\u5899\u5185\u5916\u7686\u53EF\u884C\u8D70"],
    inferredForPlay: ["\u5177\u4F53\u6865\u5934\u4E0E\u5802\u9986\u843D\u811A\u70B9", "\u4E09\u7A97\u89C6\u89C9\u8C1C\u9898\u4F4D\u7F6E"],
    redLines: ["\u5F53\u524D\u56FE\u7684\u53CC\u4FA7\u5ECA\u9053\u4ECD\u4E0D\u6E05\u695A\uFF0C\u4E0D\u5F97\u94FA\u4E3A\u6B63\u5F0F\u53EF\u8D70\u5730\u56FE", "\u4E0D\u5F97\u7528\u5355\u4FA7\u7A97\u5899\u4EE3\u66FF\u590D\u5ECA"]
  },
  {
    id: "canglang-whole-garden-study",
    title: "\u6CA7\u6D6A\u4EAD \xB7 \u65E7\u5168\u56ED\u8BD5\u7A3F v1",
    period: "\u665A\u6E05\u7A7A\u95F4\u5173\u7CFB / \u5F53\u4EE3\u5BFC\u89C8\u65B9\u4F4D",
    state: "reference",
    sources: [{
      id: "canglang-v1-bureau",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u6CA7\u6D6A\u4EAD",
      url: "https://ylj.suzhou.gov.cn/szsylj/sjyc/201904/92cba6ca05a2451bb363c82895cc862e.shtml",
      grade: "B",
      note: "\u53EF\u7EA6\u675F\u56ED\u5916\u6C34\u3001\u590D\u5ECA\u3001\u5C71\u6797\u548C\u5802\u9986\u7684\u603B\u4F53\u5173\u7CFB\uFF0C\u4E0D\u8BC1\u660E\u65E7\u56FE\u7684\u95E8\u4F4D\u4E0E\u7EC6\u90E8\u3002"
    }],
    verifiedFacts: ["\u56ED\u5916\u6C34\u7ECF\u590D\u5ECA\u6F0F\u7A97\u4E0E\u56ED\u5185\u5C71\u666F\u76F8\u8054\u7CFB"],
    inferredForPlay: ["\u65E7\u56FE\u7684\u6865\u5934\u3001\u95E8\u4F4D\u548C\u6811\u4F4D"],
    redLines: ["\u65E7\u56FE\u53EA\u4F9B\u8349\u7A3F\u5BF9\u6BD4\uFF0C\u4E0D\u5F97\u66FF\u4EE3 v2 \u6216\u79F0\u4E3A\u5B9E\u6D4B\u5730\u56FE", "\u672A\u6838\u53CC\u4FA7\u5ECA\u5730\u524D\u4E0D\u5F97\u94FA\u6210\u6B63\u5F0F\u53EF\u8D70\u533A"]
  },
  {
    id: "wangshi-whole-garden-study",
    title: "\u7F51\u5E08\u56ED \xB7 \u5B85\u56ED\u5168\u56FE\u5F85\u6821\u51C6\u7A3F",
    period: "\u73B0\u72B6\u7A7A\u95F4\u5173\u7CFB\u53C2\u8003\uFF1B\u975E 1890 \u5B9E\u6D4B",
    state: "reference",
    sources: [{
      id: "wangshi-bureau",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u7F51\u5E08\u56ED",
      url: "https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/8aaf3adcfdaf485dada9a071aac3867f.shtml",
      grade: "B",
      note: "\u7EA6\u675F\u4E1C\u90E8\u4F4F\u5B85\u3001\u897F\u90E8\u6C60\u56ED\u4E0E\u5385\u5802\u540D\u79F0\uFF1B\u4E0D\u80FD\u8BC1\u660E\u6BCF\u5904\u665A\u6E05\u95E8\u7A97\u548C\u9648\u8BBE\u3002"
    }],
    verifiedFacts: ["\u5168\u56ED\u4E1C\u90E8\u4E3A\u4F4F\u5B85\uFF0C\u897F\u90E8\u4E3A\u6C60\u56ED", "\u4E1C\u90E8\u4F4F\u5B85\u5305\u542B\u8F7F\u5385\u3001\u4E07\u5377\u5802\u548C\u64B7\u79C0\u697C"],
    inferredForPlay: ["\u5F53\u524D\u56FE\u7684\u5404\u623F\u95F4\u95E8\u4F4D\u3001\u540E\u95E8\u53CA\u5C0F\u5F84\u5BBD\u5EA6"],
    redLines: ["\u73B0\u72B6\u5BFC\u89C8\u4E0D\u76F4\u63A5\u7B49\u4E8E 1890 \u5E74\u603B\u5E73\u9762", "\u95E8\u8DEF\u672A\u7ECF\u9010\u4E00\u4EBA\u5DE5\u6821\u51C6\uFF0C\u4E0D\u5F97\u4F5C\u4E3A\u6B63\u5F0F\u5173\u5361"]
  },
  {
    id: "tuisi-whole-garden-study",
    title: "\u9000\u601D\u56ED \xB7 \u6574\u56ED\u8BD5\u7A3F",
    period: "\u6E05\u672B\u65F6\u70B9\u5F85\u5BA1\uFF1B\u65B0\u7B51\u56ED",
    state: "reference",
    sources: [{
      id: "tuisi-bureau",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u9000\u601D\u56ED",
      url: "https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/3fdb8e8723cc4a8a88f3e912d0c48af4.shtml",
      grade: "B",
      note: "\u897F\u5B85\u3001\u4E1C\u56ED\u3001\u6C34\u69AD\u3001\u9000\u601D\u8349\u5802\u7B49\u683C\u5C40\uFF1B\u73B0\u5B58\u5E73\u9762\u4E0D\u80FD\u76F4\u63A5\u4EE3\u8868 1890 \u6811\u6728\u4E0E\u9648\u8BBE\u3002"
    }],
    verifiedFacts: ["\u4F4F\u5B85\u4F4D\u4E8E\u897F\u4FA7\u3001\u56ED\u6797\u4F4D\u4E8E\u4E1C\u4FA7", "\u4E1C\u56ED\u5EFA\u7B51\u73AF\u7ED5\u6C60\u6C34"],
    inferredForPlay: ["\u6C60\u8FB9\u8001\u6811\u7684\u5267\u672C\u4F4D\u7F6E", "\u8DE8\u6C34\u6708\u53F0\u4E0E\u5929\u6865\u7684\u73A9\u5BB6\u89E6\u53D1\u5750\u6807"],
    redLines: ["\u4E0D\u628A\u73B0\u5B58\u8001\u6811\u7684\u4ECA\u65E5\u6811\u9F84\u5199\u6210\u6545\u4E8B\u5E74\u4EE3\u7684\u65E2\u5B9A\u4E8B\u5B9E", "\u5B85\u9662\u753B\u7406\u8336\u626B\u53F6\u7B49\u751F\u6D3B\u6C14\u606F\uFF1B\u4E0D\u505A\u9634\u90C1\u7684\u4EEA\u5F0F\u6027\u9648\u8BBE", "CH8-10 \u501F\u5ECA\u901A\u884C\u987B\u533A\u5206\u53EF\u8D70\u5916\u5ECA\u4E0E\u7981\u5165\u5185\u5B85\uFF1B\u5019\u9009\u951A\u70B9\u5750\u6807\u5F85\u6821", "\u5267\u672C\u89C6\u89C9\u4F0F\u7B14\u4E0D\u80FD\u53D8\u4E3A\u53D1\u5149\u4EA4\u4E92\u70B9"]
  },
  {
    id: "ouyuan-whole-garden-study",
    title: "\u8026\u56ED \xB7 \u5B85\u4E2D\u53CC\u56ED\u8BD5\u7A3F",
    period: "\u6E05\u672B\u65F6\u70B9\u5F85\u5BA1",
    state: "reference",
    sources: [{
      id: "ouyuan-bureau",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u8026\u56ED",
      url: "https://ylj.suzhou.gov.cn/szsylj/sjyc/202509/b6e90b58ee1947fe9282ad5d7ecdae08.shtml",
      grade: "B",
      note: "\u4E2D\u90E8\u4F4F\u5B85\uFF0C\u4E1C\u897F\u4E24\u56ED\uFF0C\u4E1C\u56ED\u9EC4\u77F3\u3001\u897F\u56ED\u6E56\u77F3\u3002"
    }],
    verifiedFacts: ["\u5B85\u5C45\u4E2D\u3001\u56ED\u5206\u4E1C\u897F", "\u4E1C\u56ED\u9EC4\u77F3\u3001\u897F\u56ED\u6E56\u77F3"],
    inferredForPlay: ["\u4E24\u5757\u781A\u77F3\u7684\u5177\u4F53\u9648\u653E\u5750\u6807", "\u77F3\u51F3\u4E0A\u8001\u4EC6\u7684\u6D3B\u52A8\u70B9"],
    redLines: ["\u4ECA\u65E5\u65B0\u5165\u53E3\u4E0D\u80FD\u76F4\u63A5\u5145\u5F53\u6E05\u672B\u5165\u53E3", "\u592A\u6781\u5E03\u5C40\u4E0D\u80FD\u4F5C\u4E3A\u6E05\u672B\u5DF2\u8BC1\u53F2\u5B9E", "\u4FDD\u7559\u4E3B\u5BB6\u8FDC\u884C\u800C\u5B85\u9662\u6709\u4EBA\u7167\u770B\u7684\u751F\u6D3B\u611F\uFF0C\u4E0D\u505A\u60B2\u5267\u6697\u793A"]
  },
  {
    id: "liuyuan-tree-court-no-water-study-v1",
    title: "\u7559\u56ED \xB7 \u53E4\u6728\u4EA4\u67EF\u5C0F\u5EAD\u6E38\u620F\u8BD5\u8D70",
    period: "\u73B0\u72B6\u7A7A\u95F4\u5173\u7CFB\u53C2\u7167\uFF1B\u975E 1890 \u5B9E\u6D4B",
    state: "reference",
    sources: [{
      id: "liuyuan-court-bureau",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u7559\u56ED",
      url: "https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/b7c0f2058c75498c9ecbacf234e25b08.shtml",
      grade: "B",
      note: "\u4E2D\u90E8\u6709\u6C60\u4E14\u7EFF\u836B\u8F69\u4E34\u6C34\uFF0C\u4F46\u4E0D\u4EE3\u8868\u5357\u4FA7\u5165\u53E3\u5C31\u6709\u56ED\u5916\u6CB3\u3002"
    }, {
      id: "liuyuan-court-windows",
      title: "\u82CF\u5DDE\u5E02\u5730\u65B9\u5FD7\u529E \xB7 \u82CF\u5DDE\u53E4\u5178\u56ED\u6797\u6F0F\u7A97\u827A\u672F",
      url: "https://dfzb.suzhou.gov.cn/dfzb/fzxh/201002/4310c9b7dad442b99b209d301b8cdd82.shtml",
      grade: "B",
      note: "\u53E4\u6728\u4EA4\u67EF\u524D\u5ECA\u5317\u5899\u73B0\u6709\u516D\u6247\u6F0F\u7A97\uFF0C\u6587\u4E2D\u6309\u4E1C\u5230\u897F\u5217\u51FA\u516D\u79CD\u7EB9\u6837\uFF1B\u7B2C\u4E8C\u9879\u7F51\u9875\u7F3A\u5B57\uFF0C\u539F\u56FE\u3001\u5C3A\u5BF8\u548C\u665A\u6E05\u5B58\u8C8C\u672A\u6838\u3002"
    }, {
      id: "liuyuan-court-road-water",
      title: "\u82CF\u5DDE\u5E02\u7559\u56ED\u897F\u56ED\u5355\u5143\u63A7\u89C4\u8C03\u6574",
      url: "https://www.suzhou.gov.cn/szsrmzf/zdzxghyjzjhjd/202109/fb69b8429f4e4edf9f7ca91918e8f3a7.shtml",
      grade: "B",
      note: "\u7559\u56ED\u8DEF\u4E0E\u66F4\u5357\u9762\u7684\u4E0A\u5858\u6CB3\u662F\u4E0D\u540C\u7684\u5730\u7406\u8FB9\u754C\uFF1B\u4E0D\u80FD\u628A\u8857\u9762\u5C0F\u95E8\u76F4\u63A5\u753B\u6210\u4E34\u6CB3\u7801\u5934\u3002"
    }],
    verifiedFacts: ["\u7559\u56ED\u4E2D\u90E8\u6C60\u6C34\u4F4D\u4E8E\u56ED\u5185\uFF0C\u4E0D\u662F\u5165\u53E3\u5C0F\u95E8\u524D\u7684\u6CB3\u9053", "\u53E4\u6728\u4EA4\u67EF\u524D\u5ECA\u5317\u5899\u73B0\u6709\u516D\u6247\u6F0F\u7A97"],
    inferredForPlay: ["\u8FD9\u4E00\u5C0F\u5EAD\u7684\u659C\u4FEF\u89C6\u673A\u4F4D\u4E0E\u897F\u5411\u901A\u8DEF\u5F62\u72B6", "\u6811\u51A0\u3001\u82B1\u53F0\u3001\u94FA\u5730\u548C\u5899\u9762\u7684\u753B\u9762\u7EC6\u8282"],
    redLines: ["\u81EA\u52A8\u8DEF\u7EBF\u4E0E\u78B0\u649E\u901A\u8FC7\u4EC5\u4EE3\u8868\u8FD9\u5F20\u56FE\u7684\u73A9\u6CD5\u8BD5\u8D70\uFF1B\u672A\u505A\u771F\u673A\u9010\u50CF\u7D20\u906E\u6321\u548C\u771F\u5B9E\u95E8\u4F4D\u6838\u5BF9\uFF0C\u4E0D\u5F97\u4F5C\u4E3A\u6B63\u5F0F\u5173\u5361", "\u4E0D\u628A\u5317\u5899\u6F0F\u7A97\u753B\u4F5C\u95E8\u6D1E", "\u4E0D\u80FD\u628A\u73B0\u72B6\u6811\u5F62\u6216\u7A97\u683C\u7EB9\u6837\u5192\u5145 1890 \u539F\u8C8C", "\u5165\u53E3\u5E55\u4E0D\u51FA\u73B0\u56ED\u5916\u6CB3\u6216\u63D0\u524D\u5C55\u793A\u5B8C\u6574\u4E2D\u6C60"]
  },
  {
    id: "liuyuan-lvyin-pond-study-v1",
    title: "\u7559\u56ED \xB7 \u7EFF\u836B\u8F69\u4E34\u6C60\u6E38\u620F\u8BD5\u8D70",
    period: "\u73B0\u72B6\u7A7A\u95F4\u5173\u7CFB\u53C2\u7167\uFF1B\u975E 1890 \u5B9E\u6D4B",
    state: "reference",
    sources: [{
      id: "liuyuan-lvyin-bureau",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u7EFF\u836B\u8F69",
      url: "https://ylj.suzhou.gov.cn/szsylj/ylwh/201808/befc4b49080d44989ca9b79439db3840.shtml",
      grade: "B",
      note: "\u7EFF\u836B\u8F69\u4E3A\u4E34\u6C34\u655E\u8F69\uFF0C\u5357\u6709\u534E\u6B65\u5C0F\u7B51\u5EAD\uFF1B\u4ECA\u89C1\u9752\u67AB\u3001\u6989\u6811\u7684\u4F4D\u7F6E\u4E0D\u76F4\u63A5\u89C6\u4E3A 1890 \u539F\u8C8C\u3002"
    }, {
      id: "liuyuan-lvyin-garden",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u7559\u56ED",
      url: "https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/b7c0f2058c75498c9ecbacf234e25b08.shtml",
      grade: "B",
      note: "\u4E2D\u90E8\u4E3B\u6C60\u4E0E\u4E1C\u5357\u5EFA\u7B51\u3001\u897F\u5317\u5C71\u7684\u603B\u4F53\u5173\u7CFB\u3002"
    }, {
      id: "liuyuan-lvyin-historic",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u300A\u6E38\u82CF\u5907\u89C8\xB7\u7559\u56ED\u300B",
      url: "https://ylj.suzhou.gov.cn/szsylj/ylwh/201807/37222ea7f68c4ddd9cc08c9e769f39d7.shtml",
      grade: "B",
      note: "\u6C11\u56FD\u8BB0\u8FF0\u6C60\u5357\u6709\u7EFF\u836B\u8F69\uFF0C\u80FD\u652F\u6301\u8F83\u65E9\u7684\u7A7A\u95F4\u5173\u7CFB\uFF0C\u4E0D\u8DB3\u4EE5\u7CBE\u786E\u590D\u539F 1890 \u5E74\u680F\u6746\u548C\u67F1\u4F4D\u3002"
    }],
    verifiedFacts: ["\u7EFF\u836B\u8F69\u662F\u56ED\u5185\u4E2D\u6C60\u5357\u4FA7\u7684\u4E34\u6C34\u655E\u8F69", "\u56ED\u5185\u4E2D\u90E8\u4EE5\u4E00\u7247\u4E3B\u6C60\u7EC4\u7EC7\u5EFA\u7B51\u4E0E\u5C71\u666F"],
    inferredForPlay: ["\u4E1C\u4FA7\u8FDB\u5165\u811A\u70B9\u53CA\u8F69\u524D\u8FDE\u8D2F\u77F3\u8DEF", "\u5177\u4F53\u680F\u6746\u3001\u67F1\u811A\u3001\u6811\u4F4D\u3001\u6C60\u5CB8\u548C\u955C\u5934\u6784\u56FE"],
    redLines: ["\u53EA\u4F5C\u4E3A\u53EF\u884C\u8D70\u89C6\u89C9\u8BD5\u7A3F\uFF0C\u4E0D\u628A\u751F\u6210\u56FE\u5F53\u5B9E\u6D4B\u5E73\u9762", "\u4E0D\u5C06\u4ECA\u65E5\u533E\u989D\u3001\u6811\u5F62\u3001\u680F\u6746\u6216\u94FA\u5730\u5F62\u6001\u5199\u6210 1890 \u65E2\u5B9A\u4E8B\u5B9E", "\u4E34\u6C60\u6C34\u9762\u5C5E\u4E8E\u56ED\u5185\u4E2D\u6C60\uFF0C\u4E0D\u662F\u7559\u56ED\u95E8\u5916\u6CB3\u9053", "\u5230\u82B1\u6728\u4F5C\u4E1A\u9662\u7684\u955C\u5934\u526A\u63A5\u53EA\u8868\u793A\u6545\u4E8B\u5148\u540E\uFF0C\u4E0D\u80FD\u5192\u5145\u5B9E\u6D4B\u65E7\u95E8\u6D1E"]
  },
  {
    id: "liuyuan-lvyin-pond-pixel-study-v2",
    title: "\u7559\u56ED \xB7 \u7EFF\u836B\u8F69\u4E34\u6C60\u50CF\u7D20\u8BED\u8A00\u72EC\u7ACB\u6821\u4F4D",
    period: "\u73B0\u72B6\u7A7A\u95F4\u5173\u7CFB\u542F\u53D1\u7684\u6E38\u620F\u7814\u7A76\uFF1B\u975E 1890 \u5B9E\u6D4B",
    state: "reference",
    sources: [{
      id: "lvyin-v2-bureau",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u7EFF\u836B\u8F69",
      url: "https://ylj.suzhou.gov.cn/szsylj/ylwh/201808/befc4b49080d44989ca9b79439db3840.shtml",
      grade: "B",
      note: "\u4EC5\u652F\u6301\u7EFF\u836B\u8F69\u4E34\u6C34\u53CA\u4E0E\u534E\u6B65\u5C0F\u7B51\u7684\u73B0\u72B6\u7A7A\u95F4\u5173\u7CFB\uFF0C\u4E0D\u8BC1\u672C\u56FE\u9010\u67F1\u9010\u6811\u3002"
    }, {
      id: "lvyin-v2-rag",
      title: "\u672C\u5730 garden_knowledge \xB7 \u300A\u56ED\u6797\u6709\u5883\u300B\u7559\u56ED\u6C34\u6C60\u4E0E\u89C2\u666F\u6587\u5B57",
      local: "../../SuzhouClassicGardenRag/Project/converted/\u56ED\u6797\u6709\u5883/hybrid_auto/\u56ED\u6797\u6709\u5883.md",
      grade: "C",
      note: "2026-10-10 \u79BB\u7EBF\u6587\u5B57\u5411\u91CF\u53EC\u56DE\u7559\u56ED\u6C34\u6C60\u53CA\u6E38\u5ECA\u4E00\u822C\u8BBA\uFF1B\u672A\u53EC\u56DE\u7EFF\u836B\u8F69\u680F\u4F4D\u3001\u94FA\u5730\u6216\u6E05\u672B\u5CB8\u7EBF\u7684\u5B9A\u70B9\u8BC1\u636E\u3002"
    }, {
      id: "lvyin-v2-art",
      title: "\u7EFF\u836B\u8F69\u50CF\u7D20\u8BED\u8A00\u751F\u6210\u4E0E\u62D2\u7528\u8BB0\u5F55",
      local: "../research-art/liuyuan-lvyin-pixel-language-study-v2.prompt.md",
      grade: "C",
      note: "\u65E7\u53EF\u8D70\u56FE\u4E3A\u51E0\u4F55\u7F16\u8F91\u76EE\u6807\uFF0C\u5165\u53E3\u65B0\u56FE\u4EC5\u4F5C\u98CE\u683C\u53C2\u7167\uFF1B\u751F\u6210\u7A3F\u4FDD\u7559\u8F6E\u5ED3\u7684\u7A0B\u5EA6\u4ECD\u5F85\u9010\u50CF\u7D20\u5BA1\u6838\u3002"
    }],
    verifiedFacts: ["\u7EFF\u836B\u8F69\u4E0E\u56ED\u5185\u4E3B\u6C60\u76F8\u90BB", "\u56ED\u6797\u5C40\u73B0\u72B6\u8BF4\u660E\u8BB0\u8F69\u897F\u9752\u67AB\u3001\u4E1C\u6989\u6811\uFF1B\u4E0D\u7B49\u4E8E\u6E05\u672B\u540C\u682A"],
    inferredForPlay: ["\u73A9\u5BB6\u5230\u6C60\u8FB9\u540E\u624D\u7B2C\u4E00\u6B21\u5B8C\u6574\u770B\u89C1\u6C60\u666F", "\u6CBF\u7528\u65E7\u53EF\u8D70\u56FE\u7684\u5CB8\u7EBF\u3001\u680F\u6746\u3001\u77F3\u8DEF\u3001\u67F1\u811A\u4E0E\u521D\u89C1\u955C\u5934", "\u65B0\u56FE\u7684\u6811\u3001\u77F3\u3001\u5899\u4E0E\u74E6\u7247\u50CF\u7D20"],
    redLines: [
      "\u72EC\u7ACB\u7814\u7A76\u4E0D\u63A5 CH3\u3001\u4E0D\u5199\u65D7\u6807\u3001\u4E0D\u8986\u76D6\u6B63\u5F0F\u4E34\u6C60\u5E95\u56FE\u548C\u65E7\u73A9\u5BB6\u8349\u7A3F",
      "\u751F\u6210\u7A3F\u4E0D\u80FD\u53EB 1890 \u590D\u539F\uFF1B\u65E7\u56FE\u4E5F\u4E0D\u662F\u9010\u70B9\u6D4B\u7ED8",
      "\u9ED8\u8BA4 Tile \u901A\u8FC7\u4E0D\u80FD\u8BC1\u660E\u65B0\u56FE\u9010\u50CF\u7D20\u5BF9\u4F4D\uFF0C\u987B\u67E5\u680F\u811A\u3001\u6C34\u7EBF\u3001\u53F0\u9636\u4E0E\u4EBA\u7269\u6BD4\u4F8B",
      "\u5BF9\u5CB8\u73B0\u56FE\u5E76\u672A\u6E05\u695A\u5448\u73B0\u53EF\u4EAD\uFF0C\u4E0D\u5F97\u4EE5\u6B64\u56FE\u58F0\u79F0\u5DF2\u5151\u73B0\u6240\u6709\u4E3B\u666F\u8981\u6C42"
    ]
  },
  {
    id: "liuyuan-guanyun-court-study-v2",
    title: "\u7559\u56ED\u51A0\u4E91\u5CF0\u2014\u6797\u6CC9\u8006\u7855\u4E4B\u9986 \xB7 \u5357\u5317\u5BF9\u666F\u7814\u7A76\u5207\u7247",
    period: "\u6E05\u672B\u65F6\u70B9\u5F85\u5BA1\uFF1B\u73B0\u72B6\u8D44\u6599\u4E0E\u6C11\u56FD\u6E38\u8BB0\u4EC5\u4F9B\u7A7A\u95F4\u53C2\u7167",
    state: "geometry",
    sources: [{
      id: "guanyun-v2-bureau",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u7559\u56ED",
      url: "https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/b7c0f2058c75498c9ecbacf234e25b08.shtml",
      grade: "B",
      note: "\u6797\u6CC9\u8006\u7855\u4E4B\u9986\u7684\u5317\u4FA7\u662F\u51A0\u4E91\u5CF0\uFF0C\u5CF0\u524D\u4E3A\u6D63\u4E91\u6CBC\uFF0C\u5468\u8FB9\u6709\u51A0\u4E91\u697C\u7B49\u8D4F\u77F3\u5EFA\u7B51\uFF1B\u7167\u7247\u7EA6\u675F\u5CF0\u4F53\u526A\u5F71\u3002"
    }, {
      id: "guanyun-v2-study",
      title: "\u5218\u6D77\u71D5\u7B49\u300A\u7559\u56ED\u51A0\u4E91\u5CF0\u5EAD\u9662\u7A7A\u95F4\u9020\u56ED\u8981\u7D20\u7684\u91CF\u5316\u7279\u5F81\u53CA\u5176\u610F\u5883\u7814\u7A76\u300B",
      url: "https://www.wendangwang.com/doc/ca9f8060008319449905174d",
      grade: "B",
      note: "\u300A\u5B89\u5FBD\u519C\u4E1A\u79D1\u5B66\u300B2013, 41(21):8992\u20138996\uFF1B\u5728\u7EBF\u8F6C\u5F55\u6709 OCR \u9519\u8BEF\uFF0C\u5357\u5385\u2014\u5317\u697C\u5BF9\u666F\u987B\u518D\u6838\u539F\u7248\u56FE 1\u3002"
    }, {
      id: "guanyun-v2-art",
      title: "\u51A0\u4E91\u5CF0\u7814\u7A76\u56FE v2 \u56FE\u50CF\u8BF4\u660E",
      local: "../assets/scene25d/liuyuan-guanyun-court-study-v2.prompt.md",
      grade: "C",
      note: "\u6587\u672C\u751F\u6210\u7684 2.5D \u7814\u7A76\u56FE\uFF1B\u6240\u6709\u5177\u4F53\u7ACB\u9762\u3001\u6C60\u5CB8\u3001\u4EAD\u5ECA\u548C\u690D\u683D\u5F85\u6838\u3002"
    }],
    verifiedFacts: ["\u73B0\u72B6\u7A7A\u95F4\uFF1A\u6797\u6CC9\u8006\u7855\u4E4B\u9986\u5728\u51A0\u4E91\u5CF0\u5357\u4FA7", "\u73B0\u72B6\u7A7A\u95F4\uFF1A\u51A0\u4E91\u5CF0\u524D\u6709\u6D63\u4E91\u6CBC\uFF0C\u5317\u4FA7\u6709\u51A0\u4E91\u697C\u7B49\u8D4F\u77F3\u5EFA\u7B51"],
    inferredForPlay: ["\u5357\u5385\u6A90\u5ECA\u3001\u4E24\u4FA7\u5CB8\u8DEF\u3001\u6C60\u5CB8\u4E0E\u5317\u697C\u7684\u56FE\u4E0A\u50CF\u7D20", "\u6240\u6709\u95E8\u53E3\u3001\u690D\u683D\u4E0E\u4FA7\u4EAD\u4F4D\u7F6E"],
    redLines: ["\u56FE\u9762\u51E0\u4F55\u53EF\u901A\u884C\u4E0D\u4EE3\u8868\u771F\u5B9E\u53EF\u8D70\u95E8\u8DEF", "\u5357\u5385\u3001\u5317\u697C\u3001\u6D63\u4E91\u6CBC\u987B\u9010\u7269\u6838\u6E05\u672B\u9009\u5B9A\u65F6\u70B9\uFF0C\u4E0D\u80FD\u7531\u73B0\u72B6\u540C\u6846\u63A8\u5B9A\u5F53\u65F6\u9F50\u5907", "\u4E0D\u636E\u6B64\u7ED3\u7B97 CH3 \u4E66\u658B\u6216\u7389\u5170\u72B6\u6001", "\u4E0D\u53EF\u5C06\u751F\u6210\u56FE\u79F0\u4F5C\u6E05\u672B\u5B9E\u666F\u590D\u539F\uFF1B1909 \u524D\u540E\u6539\u9020\u63D0\u793A\u73B0\u72B6\u4EAD\u5ECA\u4E0D\u53EF\u81EA\u52A8\u56DE\u586B", "\u65E7 v1 \u7F3A\u5C11\u5357\u5385\u56F4\u5408\uFF0C\u4EC5\u4F5C\u8BEF\u5DEE\u5BF9\u7167"]
  },
  {
    id: "liuyuan-guanyun-court-study-v1",
    title: "\u7559\u56ED\u51A0\u4E91\u5CF0\u524D\u9662 \xB7 \u5CF0\u6CBC\u5CB8\u8DEF\u7814\u7A76\u5207\u7247",
    period: "\u65E7\u7A3F\uFF0C\u73B0\u72B6\u7167\u7247\u4E0E\u6C11\u56FD\u6E38\u8BB0\u53C2\u7167\uFF1B\u975E 1890 \u5B9E\u6D4B",
    state: "reference",
    sources: [{
      id: "guanyun-bureau",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u7559\u56ED\uFF08\u51A0\u4E91\u5CF0\u7167\u7247\uFF09",
      url: "https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/b7c0f2058c75498c9ecbacf234e25b08.shtml",
      grade: "B",
      note: "\u4E3B\u5CF0\u7626\u957F\u591A\u5B54\uFF0C\u524D\u6709\u6D63\u4E91\u6CBC\uFF0C\u80CC\u540E\u6709\u8D4F\u77F3\u5EFA\u7B51\uFF1B\u4E00\u5F20\u7167\u7247\u4E0D\u80FD\u63A8\u51FA\u5468\u8FB9\u5B8C\u6574\u95E8\u8DEF\u3002"
    }, {
      id: "guanyun-tour",
      title: "\u6731\u63D6\u6587\u300A\u6E38\u82CF\u5907\u89C8\xB7\u7559\u56ED\u300B\uFF08\u6C11\u56FD\uFF0C\u56ED\u6797\u5C40\u8F6C\u5F55\uFF09",
      url: "https://ylj.suzhou.gov.cn/szsylj/ylwh/201807/37222ea7f68c4ddd9cc08c9e769f39d7.shtml",
      grade: "B",
      note: "\u8BB0\u77F3\u6797\u5C0F\u9662\u5411\u4E1C\u56ED\u7684\u6E38\u89C8\u987A\u5E8F\u53CA\u51A0\u4E91\u5CF0\u3001\u6CBC\u3001\u5802\uFF1B\u5E76\u975E 1890 \u6D4B\u7ED8\u3002"
    }, {
      id: "guanyun-asset",
      title: "\u51A0\u4E91\u5CF0\u7814\u7A76\u56FE v1 \u56FE\u50CF\u8BF4\u660E",
      local: "../assets/scene25d/liuyuan-guanyun-court-study-v1.prompt.md",
      grade: "C",
      note: "\u5185\u7F6E\u56FE\u50CF\u751F\u6210\u7684\u6587\u672C\u63D0\u793A\u4E0E\u5F85\u6838\u7EC6\u90E8\uFF1B\u4E0D\u542B\u7167\u7247\u50CF\u7D20\u8F93\u5165\u3002"
    }],
    verifiedFacts: ["\u73B0\u72B6\u51A0\u4E91\u5CF0\u4E3A\u7626\u957F\u591A\u5B54\u5CF0\u77F3\uFF0C\u5CF0\u524D\u6709\u6D63\u4E91\u6CBC", "\u4E1C\u56ED\u6709\u56F4\u7ED5\u4E3B\u5CF0\u7684\u89C2\u77F3\u5EFA\u7B51"],
    inferredForPlay: ["\u6C60\u5CB8\u66F2\u7EBF\u3001\u5DE6\u53F3\u5CB8\u8DEF\u3001\u5385\u5802\u7ACB\u9762\u3001\u690D\u683D\u4E0E\u6240\u6709\u811A\u70B9", "\u524D\u5EAD\u5230\u5DE6\u53F3\u4FA7\u8DEF\u7684\u7ED5\u884C\u73A9\u6CD5"],
    redLines: ["\u7F3A\u5C11\u5357\u4FA7\u6797\u6CC9\u8006\u7855\u4E4B\u9986\u56F4\u5408\uFF0C\u5317\u4FA7\u51A0\u4E91\u697C\u5C42\u6B21\u4E5F\u753B\u9519\uFF1B\u4E0D\u5F97\u4F5C\u4E3A\u6B63\u5F0F\u7F8E\u672F", "\u5019\u9009\u56FE\u4E0D\u7B49\u4E8E\u771F\u5B9E\u5E73\u9762\u6216 1890 \u56ED\u8C8C", "\u4E0D\u628A\u4E24\u4FA7\u5C0F\u5CF0\u547D\u540D\u4E3A\u745E\u4E91\u5CF0\u6216\u5CAB\u4E91\u5CF0", "\u672A\u6838\u95E8\u4F4D\u524D\u4E0D\u5F97\u63A5\u5165\u6B63\u5F0F CH3 \u4EFB\u52A1\u7ED3\u7B97", "\u73A9\u5BB6\u4E0D\u80FD\u6D89\u6C34\u6216\u7A7F\u8FC7\u5CF0\u57FA"]
  },
  {
    id: "liuyuan-dongtian-three-windows-study-v1",
    title: "\u7559\u56ED\u6D1E\u5929\u4E00\u78A7 \xB7 \u4E09\u7A97\u8FA8\u5F71\u7814\u7A76\u5207\u7247",
    period: "\u73B0\u5B58\u56FE\u7248\u5F62\u5236\uFF1B\u6E05\u672B\u540C\u8C8C\u4E0E\u5C0F\u5C4B\u901A\u8DEF\u672A\u6838",
    state: "geometry",
    sources: [{
      id: "dongtian-doors-book",
      title: "\u66F9\u6797\u5A23\u300A\u56FE\u8BF4\u82CF\u5DDE\u56ED\u6797\xB7\u95E8\u7A97\u300B\u56FE 5-47\u30015-56",
      local: "../../SuzhouClassicGardenRag/Project/converted/\u56FE\u8BF4\u82CF\u5DDE\u56ED\u6797 \u95E8\u7A97 (\u66F9\u6797\u5A23) (z-library.sk, 1lib.sk, z-lib.sk)/hybrid_auto/\u56FE\u8BF4\u82CF\u5DDE\u56ED\u6797 \u95E8\u7A97 (\u66F9\u6797\u5A23) (z-library.sk, 1lib.sk, z-lib.sk).md",
      grade: "B",
      note: "\u672C\u5730\u6587\u5B57\u5411\u91CF\u68C0\u7D22\u547D\u4E2D\u5E76\u4EBA\u5DE5\u590D\u770B\u4E24\u5F20\u539F\u4E66\u56FE\u7248\uFF1B\u4E2D\u6241\u516B\u89D2\u3001\u4E24\u4FA7\u516D\u89D2\u53CA\u4E1C\u7AF9\u897F\u8549\u6709\u6587\u5B57\u4F9D\u636E\u3002\u626B\u63CF\u56FE\u4EC5\u5185\u90E8\u7814\u7A76\u3002"
    }, {
      id: "dongtian-art-prompt",
      title: "\u539F\u521B\u50CF\u7D20\u7814\u7A76\u56FE\u5236\u4F5C\u8BB0\u5F55",
      local: "../research-art/liuyuan-dongtian-three-windows-game-study-v2.prompt.md",
      grade: "C",
      note: "\u56FE\u50CF\u751F\u6210\u63D0\u793A\u3001\u53C2\u8003\u56FE\u7528\u9014\u548C\u672A\u6838\u5185\u5BB9\uFF1B\u4E0D\u662F\u73B0\u72B6\u6D4B\u7ED8\u6216\u6E05\u672B\u590D\u539F\u3002"
    }],
    verifiedFacts: ["\u8D44\u6599\u63CF\u8FF0\u6D1E\u5929\u4E00\u78A7\u5C0F\u5C4B\u4E2D\u95F4\u6241\u516B\u89D2\u7A97\u3001\u4E1C\u897F\u4E24\u4FA7\u516D\u89D2\u7A97", "\u8D44\u6599\u8BB0\u4E1C\u4FA7\u7AF9\u3001\u897F\u4FA7\u8549\uFF1B\u4E24\u5F20\u4E66\u4E2D\u56FE\u7248\u5DF2\u4EBA\u5DE5\u590D\u770B"],
    inferredForPlay: ["\u4E09\u58C1\u5728\u5355\u955C\u5934\u4E2D\u7684\u5C55\u5F00\u65B9\u5F0F\u3001\u4E09\u7A97\u95F4\u8DDD\u53CA\u50CF\u7D20\u5316\u753B\u9762", "\u524D\u666F\u53EF\u8D70\u5730\u9762\u3001\u4E09\u4E2A\u89C2\u5BDF\u811A\u70B9\u3001\u73A9\u5BB6\u5165\u5C4B\u4F4D\u7F6E\u548C\u7EB8\u89D2\u8C1C\u9898"],
    redLines: ["\u4E0D\u628A\u751F\u6210\u7814\u7A76\u56FE\u5F53\u4F5C\u5B9E\u6D4B\u5C0F\u5C4B\u6216\u6E05\u672B\u539F\u8C8C", "\u672A\u6838\u771F\u5B9E\u51FA\u5165\u53E3\u4E0E\u77F3\u6797\u9662\u8DEF\uFF0C\u4E0D\u63A5 CH3 \u6B63\u5F0F\u8F6C\u573A\u4E0E\u5956\u52B1", "\u4E0D\u5C06\u539F\u4E66\u626B\u63CF\u56FE\u590D\u5236\u8FDB\u516C\u5F00\u6E38\u620F\u7D20\u6750", "\u7A97\u6846\u5F62\u5236\u987B\u53EF\u8FA8\uFF1B\u5899\u57FA\u4E0D\u53EF\u7A7F\u8D8A\uFF0C\u89C2\u5BDF\u70B9\u987B\u4ECE\u51FA\u751F\u70B9\u53EF\u8FBE"]
  },
  {
    id: "liuyuan-youyicun-transition-study-v1",
    title: "\u7559\u56ED \xB7 \u73B0\u72B6\u5706\u95E8\u51E0\u4F55\u7814\u7A76\u5207\u7247\uFF08\u65E7\u6E38\u7EBF\u672A\u8BC1\uFF09",
    period: "\u73B0\u72B6\u5706\u95E8\u56FE\u7248\u542F\u53D1\uFF1B1909\u201C\u53C8\u4E00\u6751\u201D\u5ECA\u6BB5\u4F4D\u7F6E\u6709\u53CD\u8BC1\uFF0C1890 \u95E8\u4F4D\u672A\u6838",
    state: "reference",
    sources: [{
      id: "youyicun-tour",
      title: "\u6731\u63D6\u6587\u300A\u6E38\u82CF\u5907\u89C8\xB7\u7559\u56ED\u300B\uFF08\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40\u8F6C\u5F55\uFF09",
      url: "https://ylj.suzhou.gov.cn/szsylj/ylwh/201807/37222ea7f68c4ddd9cc08c9e769f39d7.shtml",
      grade: "B",
      note: "\u5148\u8BB0\u51A0\u4E91\u5CF0\u5357\u6709\u56DB\u9762\u5385\uFF0C\u540E\u8BB0\u4ECE\u5176\u524D\u5ECA\u897F\u884C\u81F3\u53C8\u4E00\u6751\u3001\u518D\u5F80\u5C0F\u84EC\u83B1\uFF0C\u5F7C\u5904\u6709\u82B1\u623F\u548C\u852C\u5703\uFF1B\u672C\u5E55\u5C06\u987A\u5E8F\u53CD\u5411\u4F5C\u8FD4\u56ED\u8DEF\u3002\u4E0D\u80FD\u8BEF\u4F5C\u4E2D\u90E8\u5385\u5802\uFF0C\u6C11\u56FD\u6587\u5B57\u4E5F\u4E0D\u662F 1890 \u95E8\u4F4D\u6D4B\u7ED8\u3002"
    }, {
      id: "youyicun-book-figures",
      title: "\u66F9\u6797\u5A23\u300A\u56ED\u5EAD\u4FE1\u6B65\u300B\u56FE 5-2\u30015-23",
      local: "../../SuzhouClassicGardenRag/Project/converted/\u56ED\u5EAD\u4FE1\u6B65 \u4E2D\u56FD\u53E4\u5178\u56ED\u6797\u6587\u5316\u89E3\u8BFB (\u66F9\u6797\u5A23\u8457, Cao Lindi zhu, \u66F9\u6797\u5A23\u8457, \u66F9\u6797\u5A23) /hybrid_auto/\u56ED\u5EAD\u4FE1\u6B65 \u4E2D\u56FD\u53E4\u5178\u56ED\u6797\u6587\u5316\u89E3\u8BFB (\u66F9\u6797\u5A23\u8457, Cao Lindi zhu, \u66F9\u6797\u5A23\u8457, \u66F9\u6797\u5A23) .md",
      grade: "B",
      note: "\u4EBA\u5DE5\u67E5\u770B\u73B0\u72B6\u5E73\u9762\u4E0E\u5706\u95E8\u7167\u7247\uFF1B\u7167\u7247\u91CC\u7684\u76C6\u666F\u5C55\u9648\u3001\u73B0\u72B6\u690D\u682A\u53CA\u95E8\u989D\u6587\u5B57\u4E0D\u5411\u6E05\u672B\u5012\u63A8\uFF0C\u539F\u4E66\u56FE\u672A\u590D\u5236\u5165\u6E38\u620F\u8D44\u6E90\u3002"
    }, {
      id: "youyicun-1909-archive-study",
      title: "\u7DD2\u65B9\u8CE2\u4E00\u300A\u7559\u5712\u8A66\u8AD6\u2014\u2014\u6863\u6848\u306B\u57FA\u3065\u304F\u4E2D\u56FD\u5EAD\u5712\u7D4C\u55B6\u306E\u5B9F\u614B\u300B",
      url: "https://kwansei.repo.nii.ac.jp/record/29225/files/%E7%B7%92%E6%96%B9%E8%B3%A2%E4%B8%80.pdf",
      grade: "B",
      note: "\u641C\u7D22\u5F15\u64CE\u53EF\u68C0\u7D22\u7684\u539F\u8BBA\u6587 OCR \u6307\u51FA\uFF1A1909 \u5E74\u201C\u53C8\u4E00\u6751\u201D\u662F\u6797\u6CC9\u8006\u7855\u4E4B\u9986\u897F\u4FA7\u76F8\u63A5\u5ECA\u6BB5\u4E4B\u540D\uFF0C\u5E76\u6BD4\u8F83\u300A\u8607\u5DDE\u7559\u5712\u5168\u56F3\u300B\u4E0E\u6539\u9020\u5DE5\u7A0B\u56FE\u3002\u672C\u8F6E\u539F PDF \u8FD4\u56DE 429\uFF0C\u539F\u56FE\u7248\u672A\u590D\u770B\uFF1B\u987B\u4EE5\u539F\u7248\u56FE\u6838\u5B9E\u540E\u624D\u53EF\u6539\u5B9A\u65E7\u95E8\u8DEF\u3002"
    }, {
      id: "youyicun-art-record",
      title: "\u539F\u521B\u50CF\u7D20\u7814\u7A76\u56FE\u5236\u4F5C\u8BB0\u5F55",
      local: "../research-art/liuyuan-youyicun-transition-pixel-study-v1.prompt.md",
      grade: "C",
      note: "\u751F\u6210\u56FE\u6309\u539F\u521B\u6784\u56FE\u4E8C\u6B21\u50CF\u7D20\u5316\uFF0C\u95E8\u4E0E\u94FA\u5730\u5C3A\u5BF8\u53EA\u4F9B\u8BD5\u8D70\u3001\u62D6\u62FD\u6821\u51C6\u3002"
    }],
    verifiedFacts: ["\u6C11\u56FD\u6E38\u7EBF\u6587\u5B57\u5C06\u51A0\u4E91\u5CF0\u5357\u4FA7\u56DB\u9762\u5385\u524D\u5ECA\u3001\u53C8\u4E00\u6751\u3001\u5C0F\u84EC\u83B1\u53CA\u82B1\u623F\u7F6E\u4E8E\u8FDE\u7EED\u6BB5\u843D", "\u73B0\u72B6\u8D44\u6599\u53EF\u89C1\u53C8\u4E00\u6751\u65B9\u5411\u6709\u5706\u95E8\u8FC7\u6E21\uFF1B\u5C1A\u65E0\u8BC1\u636E\u8BC1\u660E\u4E0E\u65E7\u201C\u53C8\u4E00\u6751\u201D\u5ECA\u6BB5\u540C\u5740"],
    inferredForPlay: ["\u73B0\u72B6\u5706\u95E8\u5728\u5355\u5E45 2.5D \u7814\u7A76\u56FE\u4E2D\u7684\u6784\u56FE", "\u5706\u95E8\u5BBD\u5EA6\u3001\u82B1\u7566\u3001\u94FA\u5730\u5F62\u72B6\u3001\u4EBA\u7269\u6BD4\u4F8B\u3001\u4E94\u4E2A\u811A\u70B9\u548C\u53EF\u8D70 Tile"],
    redLines: ["\u4E0D\u5F97\u79F0\u4E3A 1890 \u539F\u5740\u95E8\u4F4D\u6216\u5B8C\u6574\u82B1\u623F\u2014\u56DB\u9762\u5385\u5B9E\u8D70\u7EBF", "1909 \u6863\u6848\u7814\u7A76\u63D0\u793A\u65E7\u201C\u53C8\u4E00\u6751\u201D\u53EF\u80FD\u662F\u5385\u897F\u5ECA\u6BB5\uFF1B\u539F\u56FE\u7248\u672A\u6838\u524D\uFF0C\u73B0\u72B6\u5706\u95E8\u4EC5\u6D4B\u51E0\u4F55\uFF0C\u4E0D\u5F97\u4F5C\u4E3A\u65E7\u6E38\u7EBF\u540C\u4E00\u95E8", "\u73B0\u72B6\u76C6\u666F\u5C55\u9648\u3001\u8461\u8404\u67B6\u548C\u53EF\u8FA8\u95E8\u989D\u4E0D\u8FDB\u5165\u6E05\u672B\u753B\u9762", "\u672A\u6838\u95E8\u6D1E\u4E0E\u56DB\u9762\u5385\u5B9E\u9645\u63A5\u53E3\uFF0C\u4E0D\u63A5 CH3 \u8FDB\u5EA6\u6216\u77F3\u6797\u4E3B\u7EBF\u8F6C\u573A", "\u539F\u4E66\u626B\u63CF\u548C\u68C0\u7D22\u7F29\u7565\u56FE\u53EA\u7528\u4E8E\u5236\u4F5C\u7AEF\u6838\u67E5"]
  },
  {
    id: "liuyuan-stone-forest-court-study-v1",
    title: "\u7559\u56ED\u77F3\u6797\u5C0F\u9662 \xB7 \u7ED5\u5CF0\u53EF\u8D70\u7814\u7A76\u5207\u7247",
    period: "\u5218\u6C0F\u539F\u9662\u4E0E\u76DB\u6C0F\u4E1C\u6269\u7684\u76F8\u5BF9\u7A7A\u95F4\u5173\u7CFB\uFF1B\u975E 1890 \u5B9E\u6D4B",
    state: "geometry",
    sources: [{
      id: "stone-bureau-yifeng",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u63D6\u5CF0\u8F69",
      url: "https://ylj.suzhou.gov.cn/szsylj/ylwh/201604/f5d094ab93ef489896d01e7252578d4b.shtml",
      grade: "B",
      note: "\u5F15\u5218\u6055\u300A\u77F3\u6797\u5C0F\u9662\u8BF4\u300B\u8BB0\u665A\u7FE0\u5CF0\u3001\u56DB\u5CF0\u4E8C\u77F3\u3001\u63D6\u5CF0\u8F69\uFF0C\u5E76\u8FF0\u5C0F\u77F3\u6709\u5982\u572D\u3001\u5982\u74A7\u3001\u5982\u5782\u82F1\u3001\u5982\u8D25\u8549\u53F6\u7684\u4E0D\u540C\u59FF\u6001\uFF1B\u8FD9\u662F\u77F3\u5F62\u5DEE\u5F02\u7684\u521B\u4F5C\u4F9D\u636E\uFF0C\u4E0D\u7B49\u4E8E\u6BCF\u5757\u73B0\u5B58\u5B9E\u77F3\u8EAB\u4EFD\u3002"
    }, {
      id: "stone-period-tour",
      title: "\u6731\u63D6\u6587\u300A\u6E38\u82CF\u5907\u89C8\xB7\u7559\u56ED\u300B\uFF08\u6C11\u56FD\uFF0C\u56ED\u6797\u5C40\u8F6C\u5F55\uFF09",
      url: "https://ylj.suzhou.gov.cn/szsylj/ylwh/201807/37222ea7f68c4ddd9cc08c9e769f39d7.shtml",
      grade: "B",
      note: "\u8BB0\u6960\u6728\u5385\u4E4B\u540E\u7684\u77F3\u6797\u5C0F\u9662\u3001\u63D6\u5CF0\u8F69\uFF0C\u518D\u7531\u63D6\u5CF0\u8F69\u5165\u4E1C\u56ED\uFF1B\u4E0D\u80FD\u636E\u6B64\u63A8 1890 \u5E74\u95E8\u6D1E\u5750\u6807\u3002"
    }, {
      id: "stone-layout-study",
      title: "\u300A\u900F\u56ED\u89C2\u77F3\uFF1A\u7559\u56ED\u77F3\u6797\u5C0F\u9662\u56ED\u6797\u7A7A\u95F4\u8425\u5EFA\u903B\u8F91\u300B",
      url: "https://www.geores.com.cn/la/CN/abstract/article/1673-1530/78696",
      grade: "B",
      note: "2026-10-10 \u5DF2\u8BFB\u7528\u6237\u672C\u5730 PDF \u5E76\u89C6\u89C9\u6838\u56FE2\u30017\u300112\u300113\uFF1A\u4F20\u7ECF\u5802\u3001\u8FD8\u8BFB\u9986\u3001\u63D6\u5CF0\u8F69\u3001\u6D1E\u5929\u4E00\u78A7\u3001\u665A\u7FE0\u5CF0\u3001\u534A\u95F4\u548C\u7559\u5939\u5206\u5F00\uFF1B\u56FE13\u533A\u5206\u5218\u6C0F\u539F\u9662\u6D41\u7EBF\u4E0E\u5F53\u4EE3\u6E38\u7EBF\uFF0C\u6CE8\u79F01888\u20141891\u76DB\u6C0F\u6269\u56ED\u4FEE\u6539\u4E3B\u5165\u53E3\u3002\u5206\u6790\u56FE\u4E0D\u662F1890\u95E8\u4F4D\u5B9E\u6D4B\u3002"
    }],
    verifiedFacts: ["\u77F3\u6797\u5C0F\u9662\u4EE5\u665A\u7FE0\u5CF0\u7B49\u5CF0\u77F3\u4E3A\u4E2D\u5FC3\uFF0C\u63D6\u5CF0\u8F69\u662F\u89C2\u77F3\u4E66\u623F", "\u56FE12\u6240\u793A\u683C\u5C40\u4E2D\uFF0C\u8FD8\u8BFB\u9986\u5728\u77F3\u6797\u5317\u4FA7\uFF0C\u4F20\u7ECF\u5802\u5728\u897F\uFF0C\u63D6\u5CF0\u8F69\u548C\u6D1E\u5929\u4E00\u78A7\u5206\u5904\u4E3B\u77F3\u5357\u5317\u4E24\u4FA7\uFF1B\u539F\u9662\u4E0D\u662F\u56DB\u95E8\u5E76\u6392", "\u76DB\u6C0F\u4E1C\u6269\u5728\u539F\u9662\u4E1C\u5899\u5F00\u53E3\u901A\u51A0\u4E91\u5CF0\u9662\u843D\uFF1B\u56FE13\u6240\u7ED8\u65E9\u671F\u5165\u53E3\u6D41\u7EBF\u4E0E\u73B0\u884C\u6E38\u7EBF\u4E0D\u540C"],
    inferredForPlay: ["\u5355\u4E00\u753B\u9762\u538B\u7F29\u6570\u4E2A\u5C0F\u9662\u7684\u65B9\u5F0F", "v2 \u77F3\u5F62\u533A\u5206\u7EC6\u9AD8\u4E3B\u5CF0\u3001\u5C4F\u5E06\u77F3\u3001\u659C\u7247\u4E0E\u4F4E\u4F0F\u77F3\uFF1B\u4E0D\u5BF9\u5E94\u5177\u4F53\u5B9E\u540D\u77F3\u7684\u7CBE\u786E\u5916\u5F62", "\u672C\u56FE\u8549\u7AF9\u682A\u4F4D\u3001\u5ECA\u67F1\u3001\u94FA\u5730\u3001\u4EBA\u7269\u811A\u70B9\u548C\u78B0\u649E\u8FB9\u754C"],
    redLines: ["\u4EC5\u4F5C\u72EC\u7ACB\u53EF\u8D70\u7814\u7A76\u5207\u7247\uFF0C\u4E0D\u51ED\u751F\u6210\u56FE\u7ED9 1890 \u7CBE\u786E\u95E8\u4F4D\uFF1B\u4E00\u5F20\u56FE\u538B\u7F29\u6570\u9662\uFF0C\u4E0D\u53EF\u5347\u7EA7\u6210\u5B8C\u6574\u9662\u8DEF", "\u4E0D\u5F97\u628A v2 \u751F\u6210\u77F3\u5F62\u5F53\u4F5C\u665A\u7FE0\u3001\u72EC\u79C0\u3001\u6BB5\u9526\u7B49\u5B9E\u77F3\u7684\u7167\u7247\u590D\u539F", "\u4E0D\u628A\u63D6\u5CF0\u8F69\u8BA4\u4F5C\u5BD2\u58EB\u6240\u5728\u7684\u8FD8\u8BFB\u6211\u4E66\u658B", "\u5C1A\u65E0\u5DF2\u6838\u5B9E\u7684\u897F\u90E8\u82B1\u623F\u81F3\u6B64\u7684\u8FDE\u7EED\u5173\u5361\uFF0C\u4E0D\u80FD\u5047\u88C5\u76F8\u90BB", "\u51A0\u4E91\u5CF0 v2 \u65E2\u6709\u753B\u9762\u6309\u73A9\u5BB6\u610F\u89C1\u4FDD\u7559\uFF0C\u672C\u6B21\u4E0D\u501F\u77F3\u6797\u77F3\u5F62\u4FEE\u6539\u5B83", "\u5CF0\u77F3\u6839\u90E8\u4E0D\u53EF\u8D70\u3001\u5ECA\u67F1\u4E0D\u53EF\u7A7F\uFF0C\u524D\u666F\u5C4B\u6A90\u987B\u6309\u843D\u5730\u7EBF\u906E\u6321"]
  },
  {
    id: "liuyuan-study-court-research-v1",
    title: "\u7559\u56ED\u5317\u7F18\u4E66\u658B\u9662 \xB7 \u56F4\u5408\u4E0E\u7ED5\u884C\u7814\u7A76\u5207\u7247",
    period: "\u73B0\u72B6\u7A7A\u95F4\u542F\u53D1\uFF1B\u65E7\u540D\u548C 1890 \u95E8\u4F4D\u672A\u6838",
    state: "geometry",
    sources: [{
      id: "study-court-local-rag",
      title: "\u79BB\u7EBF garden_knowledge \u6587\u5B57\u5411\u91CF \xB7 \u66F9\u6797\u5A23\u300A\u82CF\u5DDE\u56ED\u6797\u533E\u989D\u6979\u8054\u9274\u8D4F\u300B\u6458\u5F55",
      local: "LIUYUAN_STUDY_COURT_AUDIT.md",
      grade: "C",
      note: "\u53EC\u56DE\u5218\u6C0F\u8FD8\u8BFB\u9986\u3001\u76DB\u6C0F\u540D\u79F0\u5019\u9009\u53CA\u4E24\u5C42\u786C\u5C71\u5C4B/\u56DE\u5ECA\u4FE1\u606F\uFF1BOCR \u539F\u4E66\u9875\u672A\u590D\u6838\uFF0C\u53EA\u4F5C\u5019\u9009\u3002"
    }, {
      id: "study-court-shanghai-bureau",
      title: "\u4E0A\u6D77\u5E02\u7EFF\u5316\u548C\u5E02\u5BB9\u7BA1\u7406\u5C40 \xB7 \u6700\u6709\u6587\u5316\u7684\u53E4\u5EFA\u7B51\u2014\u2014\u4E66\u623F",
      url: "https://lhsr.sh.gov.cn/jnylwh/20210726/b06653a5ca864616bea2fcf31e3c8020.html",
      grade: "B",
      note: "\u660E\u786E\u63D6\u5CF0\u8F69\u4E4B\u5317\u6709\u56F4\u5408\u5C0F\u9662\uFF0C\u8FD8\u6211\u8BFB\u4E66\u5904\u4E3A\u5750\u897F\u9762\u4E1C\u4E8C\u5C42\u786C\u5C71\u5C4B\uFF0C\u9662\u524D\u56DE\u5ECA\u3001\u6E56\u77F3\u82B1\u575B\u548C\u53E4\u6728\uFF1B\u6B64\u4E3A\u540E\u51FA\u73B0\u72B6\u4ECB\u7ECD\u3002"
    }, {
      id: "study-court-liuyuan-photo",
      title: "\u7559\u56ED\u7F72\u540D\u6587\u7AE0 \xB7 \u7559\u56ED\u4E4B\u4E66\u658B",
      url: "https://www.sohu.com/a/215827991_680285",
      grade: "B",
      note: "\u4EBA\u5DE5\u67E5\u770B\u8BE5\u7F72\u540D\u6587\u7AE0\u5185\u73B0\u72B6\u7167\u7247\uFF1A\u4E8C\u5C42\u6728\u683C\u7A97\u3001\u7070\u74E6\u4F4E\u5ECA\u4E0E\u9662\u4E2D\u4E54\u6728\u3002\u4E0D\u80FD\u4ECE\u7167\u7247\u53CD\u63A8\u6E05\u672B\u95E8\u8DEF\u6216\u6811\u79CD\u3002"
    }, {
      id: "study-court-art",
      title: "\u539F\u521B\u7814\u7A76\u5E95\u56FE\u751F\u6210\u8BB0\u5F55",
      local: "../assets/scene25d/liuyuan-study-court-research-v1.prompt.md",
      grade: "C",
      note: "\u5185\u7F6E imagegen \u751F\u6210\uFF0C\u4EC5\u4F9B\u7F16\u8F91\u5668\u7814\u7A76\u4E0E\u72EC\u7ACB\u8BD5\u8D70\uFF1B\u672A\u4F7F\u7528\u4E66\u56FE/\u7F51\u9875\u7167\u7247\u4F5C\u4E3A\u6E38\u620F\u8D34\u56FE\u3002"
    }],
    verifiedFacts: ["\u63D6\u5CF0\u8F69\u5317\u4FA7\u5B58\u5728\u5C01\u95ED\u7684\u8FD8\u6211\u8BFB\u4E66\u5904\u9662\u843D", "\u73B0\u72B6\u4E66\u623F\u4E3A\u4E8C\u5C42\u786C\u5C71\u9876\u3001\u5750\u897F\u9762\u4E1C\uFF0C\u9662\u524D\u6709\u56DE\u5ECA\u3001\u6E56\u77F3\u82B1\u575B\u548C\u4E54\u6728"],
    inferredForPlay: ["\u672C\u56FE\u5357\u7F18\u5165\u53E3\u3001\u7A97\u683C\u3001\u4E54\u6728\u548C\u77F3\u82B1\u53F0\u7684\u5177\u4F53\u682A\u4F4D", "\u4E66\u623F\u95E8\u524D\u7EB8\u58F0\u6765\u6E90\u4E0E\u94FA\u5730\u4E0A\u7684\u53EF\u7AD9\u811A\u70B9\u5206\u5F00\uFF1B\u4E8C\u8005\u5747\u4E3A\u6E38\u620F\u753B\u9762\u5019\u9009", "\u89D2\u8272\u811A\u70B9\u3001Tile \u4E0E\u906E\u6321\u8F6E\u5ED3"],
    redLines: ["\u4E0D\u5F97\u628A\u73B0\u72B6\u5E03\u7F6E\u79F0\u4E3A 1890 \u590D\u539F\uFF1B\u65E7\u95E8\u4F4D\u548C\u65F6\u671F\u4ECD\u5F85\u6838", "\u65E7\u540D\u201C\u8FD8\u8BFB\u6211\u4E66\u658B\uFF0F\u8FD8\u8BFB\u6211\u4E66\u5904\u201D\u6765\u6E90\u51B2\u7A81\uFF0C\u56FE\u4E0A\u4E0D\u753B\u533E\u3001\u4E0D\u628A\u5B83\u8BBE\u4E3A\u552F\u4E00\u8C1C\u5E95", "\u72EC\u7ACB\u6253\u5F00\u4E0D\u63D0\u4EA4 ly-study-found\uFF1B\u5F53\u4EE3\u6E38\u7EBF\u6A21\u5F0F\u4EC5\u5728\u73A9\u5BB6\u542C\u58F0\u540E\u8F7B\u53E9\u65F6\u63D0\u4EA4\u865A\u6784\u5267\u60C5\u4E8B\u4EF6\uFF0C\u4E0D\u628A\u77F3\u6797\u526A\u63A5\u5192\u5145\u5B9E\u95E8", "\u751F\u6210\u6811\u77F3\u5916\u5F62\u4E0D\u5BF9\u5E94\u53EF\u6307\u8BA4\u7684\u73B0\u5B58\u682A\u77F3"]
  },
  {
    id: "liuyuan-study-interior-research-v1",
    title: "\u7559\u56ED\u4E66\u658B\u5185\u666F \xB7 \u4EBA\u7269\u4E0E\u7EB8\u58F0\u7814\u7A76\u5207\u7247",
    period: "\u6E05\u672B\u6545\u4E8B\u7684\u5BA4\u5185\u6F14\u51FA\uFF1B\u5177\u4F53\u5185\u88C5\u3001\u7A97\u548C\u95E8\u4F4D\u672A\u6838",
    state: "geometry",
    sources: [{
      id: "study-room-local-rag",
      title: "\u79BB\u7EBF garden_knowledge \u6587\u5B57\u5411\u91CF \xB7 \u66F9\u6797\u5A23\u300A\u82CF\u5DDE\u56ED\u6797\u533E\u989D\u6979\u8054\u9274\u8D4F\u300B\u6458\u5F55",
      local: "LIUYUAN_STUDY_INTERIOR_AUDIT.md",
      grade: "C",
      note: "\u53EA\u53EC\u56DE\u4E66\u658B\u9662\u56F4\u5408\u3001\u4E8C\u5C42\u786C\u5C71\u3001\u5750\u897F\u671D\u4E1C\u7B49\u7A7A\u95F4\u6982\u8FF0\uFF0C\u6CA1\u6709\u684C\u6848\u3001\u67B6\u3001\u7A97\u3001\u4EBA\u7269\u7684\u539F\u4F4D\u8D44\u6599\uFF1B\u539F\u4E66\u56FE\u7248\u672A\u6838\u3002"
    }, {
      id: "study-room-bureau",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u7559\u56ED",
      url: "https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/b7c0f2058c75498c9ecbacf234e25b08.shtml",
      grade: "B",
      note: "\u77F3\u6797\u5C0F\u9662\u4E0E\u8FD8\u6211\u8BFB\u4E66\u5904\u540C\u5C5E\u76F8\u90BB\u9662\u843D\uFF0C\u6982\u8FF0\u7AF9\u77F3\u501A\u5899\u3001\u82AD\u8549\u6620\u7A97\uFF1B\u4E0D\u6307\u660E\u672C\u4E66\u658B\u67D0\u6247\u7A97\u3002"
    }, {
      id: "study-room-script",
      title: "\u300A\u59D1\u82CF\u4E5D\u56ED-\u5267\u672C-CH3\u7559\u56ED\u300BCH3-07",
      local: "../\u59D1\u82CF\u4E5D\u56ED-\u5267\u672C-CH3\u7559\u56ED.md",
      grade: "C",
      note: "\u65E0\u540D\u5BD2\u58EB\u3001\u7EB8\u7B14\u3001\u4E66\u67B6\u3001\u7A97\u5916\u8549\u5F71\u53CA\u5BF9\u8BDD\u662F\u4EBA\u7269\u6F14\u51FA\uFF1B\u4E0E\u53F2\u5B9E\u7A7A\u95F4\u5206\u5C42\u3002"
    }, {
      id: "study-room-art",
      title: "\u539F\u521B\u5185\u666F\u4E0E\u4EBA\u7269\u751F\u6210\u8BB0\u5F55",
      local: "../assets/scene25d/liuyuan-study-interior-research-v1.prompt.md",
      grade: "C",
      note: "\u5185\u7F6E imagegen \u72EC\u7ACB\u751F\u6210\u5E95\u56FE\u4E0E\u771F\u900F\u660E\u89D2\u8272\u7CBE\u7075\uFF1B\u672A\u590D\u5236\u4E66\u56FE\u6216\u7F51\u9875\u7167\u7247\u3002"
    }],
    verifiedFacts: ["\u7559\u56ED\u77F3\u6797\u5C0F\u9662\u4E00\u5E26\u6709\u76F8\u90BB\u4E66\u658B\u9662\u53CA\u8549\u5F71\u7A97\u666F\u7684\u603B\u4F53\u8BB0\u8FF0"],
    inferredForPlay: ["\u56FE\u4E2D\u6240\u6709\u5BA4\u5185\u9648\u8BBE\u3001\u7A97\u683C\u3001\u8549\u53F6\u682A\u4F4D\u3001\u95E8\u69DB\u548C\u5730\u677F", "\u65E0\u540D\u6284\u4E66\u4EBA\u53CA\u4E66\u6848\u2014\u7A97\u8FB9\u7684\u89C2\u5BDF\u8282\u62CD\u3001\u5377\u7EB8\u53C8\u653E\u4E0B\u7684\u52A8\u4F5C", "\u4EBA\u7269\u5C3A\u5BF8\u3001\u811A\u70B9\u3001\u78B0\u649E\u53CA\u4E66\u6848\u524D\u666F\u906E\u6321"],
    redLines: ["\u72EC\u7ACB\u6253\u5F00\u4E0D\u5199 CH3 \u65D7\u6807\uFF1B\u5F53\u4EE3\u6E38\u7EBF\u6A21\u5F0F\u5728\u4EB2\u8FD1\u6284\u4E66\u4EBA\u548C\u5F97\u77E5\u5377\u7EB8\u96BE\u9898\u540E\u5206\u522B\u8BB0\u865A\u6784\u5267\u60C5\u4E8B\u4EF6\uFF0C\u4E0D\u5047\u63A5\u4E66\u658B\u9662\u65E7\u95E8", "\u684C\u6848\u4E66\u67B6\u4E0E\u7A97\u4E0D\u662F 1890 \u5E74\u7684\u8003\u5B9A\u9648\u8BBE\uFF1B\u4E0D\u53EF\u6807\u4F5C\u590D\u539F", "\u7A97\u5916\u8549\u5F71\u53EA\u662F\u5168\u56ED\u63CF\u8FF0\u7528\u4E8E\u6F14\u51FA\uFF0C\u672A\u6838\u672C\u7A97\u539F\u4F4D\uFF1B\u4E0D\u53EF\u4F5C\u552F\u4E00\u53F2\u5B9E\u8C1C\u5E95", "\u201C\u56ED\u91CC\u7684\u7EB8\u51FA\u95E8\u8981\u8FC7\u624B\u201D\u6CA1\u6709\u76F4\u63A5\u6E05\u672B\u7559\u56ED\u53F2\u6599\uFF0C\u53EA\u80FD\u662F\u865A\u6784\u5BD2\u58EB\u7684\u5904\u5883\uFF0C\u4E0D\u5F97\u5199\u5165\u53F2\u5B9E\u77E5\u8BC6\u6761", "\u751F\u6210\u50CF\u7D20\u56FE\u53CA\u89D2\u8272\u4E0D\u80FD\u66FF\u4EE3\u5B9A\u5411\u5B9E\u666F\u7167\u7247\u6216\u539F\u4E66\u56FE\u7248"]
  },
  {
    id: "liuyuan-flower-work-yard-study-v3",
    title: "\u7559\u56ED \xB7 \u82B1\u6728\u4F5C\u4E1A\u9662\uFF08\u76C6\u5170\u5DE5\u4F5C\u533A\uFF09",
    period: "\u76DB\u6C0F\u82B1\u6728\u57F9\u80B2\u7684\u540E\u51FA\u8BB0\u8F7D\uFF1B\u975E 1890 \u5B9E\u6D4B",
    state: "geometry",
    sources: [{
      id: "liuyuan-flower-bureau",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u7559\u56ED",
      url: "https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/b7c0f2058c75498c9ecbacf234e25b08.shtml",
      grade: "B",
      note: "\u82B1\u6728\u4F5C\u4E1A\u533A\u4E0E\u4E2D\u90E8\u4E3B\u6C60\u3001\u4E1C\u90E8\u5385\u5802\u662F\u4E0D\u540C\u5206\u533A\uFF1B\u4E0D\u80FD\u628A\u82B1\u623F\u786C\u8D34\u5728\u6C60\u8FB9\u3002"
    }, {
      id: "liuyuan-flower-historic",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40\u8F6C\u5F55 \xB7 \u300A\u6E38\u82CF\u5907\u89C8\xB7\u7559\u56ED\u300B",
      url: "https://ylj.suzhou.gov.cn/szsylj/ylwh/201807/37222ea7f68c4ddd9cc08c9e769f39d7.shtml",
      grade: "B",
      note: "\u6C11\u56FD\u6587\u5B57\u8BB0\u82B1\u623F\u3001\u852C\u5703\u7684\u6E38\u7EBF\uFF0C\u4E0D\u662F 1890 \u5E74\u6D4B\u7ED8\u3002"
    }, {
      id: "liuyuan-flower-tree",
      title: "Flora of China \xB7 Yulania denudata",
      url: "https://www.efloras.org/florataxon.aspx?flora_id=2&taxon_id=250090269",
      grade: "B",
      note: "\u767D\u7389\u5170\u662F\u843D\u53F6\u4E54\u6728\uFF0C\u82B1\u82BD\u5375\u5F62\uFF1B\u672C\u5E55\u4E0D\u753B\u7389\u5170\uFF0C\u6B63\u5F0F\u6811\u7684\u89C2\u5BDF\u70B9\u987B\u53E6\u4F5C\u4E1C\u56ED\u573A\u666F\u3002"
    }, {
      id: "liuyuan-flower-script",
      title: "\u300A\u59D1\u82CF\u4E5D\u56ED-\u5267\u672C-CH3\u7559\u56ED\u300BCH3-05",
      local: "../\u59D1\u82CF\u4E5D\u56ED-\u5267\u672C-CH3\u7559\u56ED.md",
      grade: "C",
      note: "\u82B1\u5320\u6362\u571F\u7684\u662F\u76C6\u5170\uFF1B\u539F\u5267\u672C\u6B64\u5E55\u8FD1\u770B\u7389\u5170\u7684\u8282\u62CD\u9700\u79FB\u81F3\u4E1C\u90E8\u5802\u524D\uFF0C\u4E0D\u628A\u6811\u7F29\u6210\u76C6\u82D7\u3002"
    }],
    verifiedFacts: ["\u767D\u7389\u5170\u4E3A\u4E54\u6728\uFF0C\u4E0D\u80FD\u5F53\u4F5C\u642C\u52A8\u7684\u76C6\u683D", "\u7559\u56ED\u6709\u82B1\u6728\u4F5C\u4E1A/\u82B1\u623F\u7684\u540E\u51FA\u8BB0\u8F7D"],
    inferredForPlay: ["\u8FD9\u5904\u82B1\u6728\u4F5C\u4E1A\u9662\u4E0E\u623F\u5C4B\u7684\u7CBE\u786E\u4F4D\u7F6E", "\u82B1\u5320\u3001\u7CA5\u6876\u548C\u7531\u4E34\u6C60\u5904\u901A\u5F80\u6B64\u5730\u7684\u955C\u5934\u526A\u63A5"],
    redLines: ["\u76C6\u5170\u4E0E\u7389\u5170\u4E0D\u53EF\u6DF7\u6210\u4E00\u76C6", "\u5899\u811A\u5355\u682A\u7389\u5170 v2 \u56FE\u5DF2\u5426\u51B3\uFF0C\u4E0D\u53EF\u7528\u4F5C\u672C\u5E55", "\u5230\u4E1C\u90E8\u4E66\u658B\u7684\u65E7\u901A\u8DEF\u4E0E\u56DB\u95E8\u65B9\u4F4D\u5C1A\u672A\u6838\uFF0C\u4E0D\u5F97\u51ED\u6B64\u56FE\u76F4\u63A5\u6807\u4E3A\u53F2\u5B9E"]
  },
  {
    id: "liuyuan-east-hall-magnolia-court-study-v1",
    title: "\u7559\u56ED\u4E1C\u90E8\u5B85\u9662\u5385\u524D\u53CC\u7389\u5170 \xB7 \u690D\u683D\u8BED\u6CD5\u5019\u9009",
    period: "\u660E\u4EE3\u9020\u56ED\u901A\u5219\u7528\u4E8E\u665A\u6E05\u6545\u4E8B\u7684\u8BBE\u8BA1\u6F14\u7ECE\uFF1B\u975E 1890 \u5B9E\u690D\u8BC1\u636E",
    state: "reference",
    sources: [{
      id: "changwuzhi-magnolia",
      title: "\u6587\u9707\u4EA8\u300A\u957F\u7269\u5FD7\u300B\u5377\u4E8C \xB7 \u7389\u5170",
      url: "https://www.shidianguji.com/zh/mid-page/7577890052246061106",
      grade: "A",
      note: "\u201C\u5B9C\u79CD\u5385\u4E8B\u524D\uFF0C\u5BF9\u5217\u6570\u682A\u201D\u662F\u539F\u4E66\u7684\u5385\u524D\u7389\u5170\u53D6\u6CD5\uFF0C\u4E0D\u662F\u7559\u56ED\u6307\u5B9A\u5385\u5802\u7684\u5B58\u6811\u8BB0\u5F55\u3002"
    }, {
      id: "suzhou-garden-planting",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u690D\u7269",
      url: "https://ylj.suzhou.gov.cn/szsylj/ylwh/201903/d978d21439a549c88244479c92ffda86.shtml",
      grade: "B",
      note: "\u56ED\u6797\u6E38\u8D4F\u690D\u683D\u4EE5\u758F\u5BC6\u3001\u9AD8\u4F4E\u548C\u7A7A\u95F4\u5173\u8054\u7EC4\u7EC7\uFF0C\u4E0D\u5B9C\u5C06\u6574\u5EA7\u56ED\u955C\u50CF\u5316\uFF1B\u5385\u5802\u9644\u8FD1\u987B\u987E\u91C7\u5149\u3002"
    }, {
      id: "liuyuan-east-hall-script",
      title: "\u300A\u59D1\u82CF\u4E5D\u56ED-\u5267\u672C-CH3\u7559\u56ED\u300BCH3-06",
      local: "../\u59D1\u82CF\u4E5D\u56ED-\u5267\u672C-CH3\u7559\u56ED.md",
      grade: "C",
      note: "\u65E7\u7A3F\u66FE\u628A\u5385\u524D\u53CC\u6811\u548C\u533E\u989D\u5408\u6210\u8C1C\u9898\uFF1BCH3-06 \u5DF2\u6539\u4E3A\u4E32\u8054\u9662\u843D\u5BFB\u4E66\u658B\uFF0C\u672C\u56FE\u53EA\u4FDD\u7559\u690D\u683D\u8BED\u6CD5\u8BD5\u6F14\u3002"
    }],
    verifiedFacts: ["\u300A\u957F\u7269\u5FD7\u300B\u8BB0\u7389\u5170\u5B9C\u79CD\u5385\u4E8B\u524D\u3001\u5BF9\u5217\u6570\u682A", "\u56ED\u6797\u6E38\u8D4F\u533A\u82B1\u6728\u53EF\u7528\u975E\u5BF9\u79F0\u758F\u5BC6\u7EC4\u7EC7"],
    inferredForPlay: ["\u56FE\u4E2D\u4E24\u682A\u7389\u5170\u7684\u5177\u4F53\u682A\u4F4D\u3001\u6811\u9F84\u3001\u5385\u5802\u7ACB\u9762\u548C\u901A\u9053", "\u65E7\u7A3F\u8BD5\u56FE\u628A\u6B64\u5385\u5BF9\u5E94\u67D0\u5B9E\u540D\u5EFA\u7B51\uFF0C\u73B0\u5DF2\u64A4\u9500"],
    redLines: ["\u4E0D\u5F97\u628A\u8FD9\u5F20\u56FE\u79F0\u4F5C\u7559\u56ED 1890 \u5E74\u8FD8\u8BFB\u6211\u4E66\u658B\u5B9E\u666F", "\u5B85\u9662\u5385\u524D\u6210\u5BF9\u690D\u6811\u662F\u8BBE\u8BA1\u53D6\u6CD5\uFF0C\u4E0D\u662F\u6240\u6709\u82CF\u5DDE\u5B85\u9662\u90FD\u5FC5\u987B\u5982\u6B64", "\u72EC\u7ACB\u6253\u5F00\u4E0D\u63A8\u8FDB\u4E3B\u7EBF\uFF1B\u4EC5\u4ECE\u82B1\u6728\u9662\u643A\u5E26\u5F53\u4EE3\u6E38\u7EBF\u6807\u8BB0\u4E14\u5DF2\u9047\u82B1\u5320\u65F6\uFF0C\u89C2\u5BDF\u4E24\u6811\u540E\u53EF\u7ED3\u7B97\u865A\u6784\u7EBF\u7D22 ly-magnolia-seen\uFF1B\u7EDD\u4E0D\u5728\u6B64\u7ED3\u7B97 ly-study-found"]
  },
  {
    id: "liuyuan-entry-gate-style-study-v1",
    title: "\u7559\u56ED\u5165\u53E3 \xB7 \u95E8\u5916\u81F3\u95E8\u5385\u659C\u4FEF\u89C6\u7814\u7A76",
    period: "\u73B0\u72B6\u7A7A\u95F4\u8282\u594F\u53C2\u8003\uFF1B\u95E8\u4F4D\u3001\u6784\u4EF6\u5E74\u4EE3\u5747\u672A\u6838",
    state: "reference",
    sources: [{
      id: "entry-gate-study-rag",
      title: "\u300A\u56ED\u6797\u6709\u5883\u300B\xB7 \u534E\u6B65\u5C0F\u7B51\u72ED\u5F84\u4E0E\u7559\u56ED\u5165\u53E3\u6536\u653E",
      local: "../../SuzhouClassicGardenRag/Project/converted/\u56ED\u6797\u6709\u5883/hybrid_auto/\u56ED\u6797\u6709\u5883.md",
      grade: "C",
      note: "2026-10-10 \u79BB\u7EBF garden_knowledge \u6587\u5B57\u53EC\u56DE\uFF1A\u72ED\u957F\u5C0F\u5F84\u3001\u65F6\u6697\u65F6\u660E\u3001\u51E0\u7ECF\u8F6C\u6298\uFF1B\u539F\u6587\u540C\u65F6\u63D0\u9192\u4E0D\u80FD\u4EE5\u4ECA\u8BC1\u53E4\u3002\u6CA1\u6709\u65E7\u95E8\u4F4D\u548C\u95E8\u5385\u5C3A\u5BF8\u3002"
    }, {
      id: "entry-gate-study-bureau",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u7559\u56ED",
      url: "https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/b7c0f2058c75498c9ecbacf234e25b08.shtml",
      grade: "B",
      note: "\u53EA\u652F\u6301\u9662\u843D\u4EE5\u95E8\u6D1E\u3001\u66F2\u5ECA\u76F8\u8054\u5E76\u6709\u7A7A\u95F4\u5BF9\u6BD4\uFF1B\u4E0D\u652F\u6301\u751F\u6210\u56FE\u7684\u95E8\u6247\u3001\u706F\u3001\u6811\u77F3\u548C\u8857\u9762\u5750\u6807\u3002"
    }, {
      id: "entry-gate-study-art",
      title: "\u95E8\u5916\u81F3\u95E8\u5385\u659C\u4FEF\u89C6\u98CE\u683C\u7814\u7A76\u751F\u6210\u8BB0\u5F55",
      local: "../research-art/liuyuan-entry-gate-style-study-v1.prompt.md",
      grade: "C",
      note: "\u4EE5\u9879\u76EE\u5E9C\u5B66 Home \u548C\u7559\u56ED\u5C0F\u5EAD\u4F5C\u98CE\u683C\u53C2\u8003\u751F\u6210\uFF1B\u7814\u7A76\u56FE\u4E0D\u8FDB\u5165\u6B63\u5F0F\u516C\u5F00\u8D44\u6E90\u3002"
    }],
    verifiedFacts: ["\u73B0\u72B6\u7559\u56ED\u5165\u53E3\u901A\u8FC7\u95E8\u6D1E\u3001\u5ECA\u9053\u4E0E\u5C0F\u5EAD\u7EC4\u7EC7\u7531\u7A84\u5230\u5F00\u3001\u65F6\u6697\u65F6\u660E\u7684\u6E38\u89C8\u8282\u594F"],
    inferredForPlay: ["\u8FD9\u4E00\u955C\u7684\u95E8\u3001\u95E8\u67F1\u3001\u706F\u3001\u6811\u77F3\u3001\u79CD\u690D\u6C60\u548C\u77F3\u8DEF\u5F62\u6001", "\u95E8\u5916\u81F3\u5385\u5185\u7684\u811A\u70B9\u3001\u6BD4\u4F8B\u3001\u78B0\u649E\u4E0E\u906E\u6321\u5019\u9009"],
    redLines: ["2026-10-10 \u98CE\u683C\u5BA1\u67E5\u672A\u901A\u8FC7\uFF1A\u5E73\u6ED1\u7ED8\u753B\u3001\u5BF9\u79F0\u901A\u7528\u5EAD\u9662\u6784\u56FE\uFF1B\u4E0D\u5236\u4F5C\u8BD5\u73A9\u9875\uFF0C\u4E0D\u63A5 CH3 \u65D7\u6807\uFF0C\u4E0D\u66FF\u6362\u539F\u5165\u53E3\u7AE0\u8282\u56FE", "\u4E0D\u5F97\u58F0\u79F0 1890 \u7559\u56ED\u95E8\u4F4D\u6216\u95E8\u5385\u5B9E\u666F\u590D\u539F", "\u706F\u7B3C\u3001\u95E8\u6247\u3001\u6811\u77F3\u3001\u5899\u7EBF\u672A\u7ECF\u5B9A\u5411\u7167\u7247/\u6D4B\u7ED8\u6838\u5BF9\uFF0C\u4E0D\u4F5C\u56ED\u8C31\u53F2\u5B9E", "\u91CD\u505A\u50CF\u7D20\u8BED\u8A00\u5E76\u901A\u8FC7\u5E76\u6392\u5BA1\u67E5\u540E\uFF0C\u4ECD\u987B\u6821\u771F\u5B9E\u6D4F\u89C8\u5668\u56DB\u65B9\u5411\u3001\u89E6\u5C4F\u3001\u811A\u5E95\u76D2\u3001\u6A90\u53E3\u906E\u6321\u4E0E\u5E74\u4EE3\u8BC1\u636E"]
  },
  {
    id: "liuyuan-entry-gate-misty-study-v2",
    title: "\u7559\u56ED\u5165\u53E3 \xB7 \u7C89\u5899\u9EDB\u74E6\u95E8\u5899\u72EC\u7ACB\u7814\u7A76\u5207\u7247",
    period: "\u73B0\u72B6\u7A7A\u95F4\u8282\u594F\u53C2\u8003\uFF0F\u6E05\u672B\u95E8\u4F4D\u672A\u6838\uFF1B\u6E38\u620F\u7F8E\u672F\u8BD5\u7A3F",
    state: "reference",
    sources: [{
      id: "misty-gate-rag",
      title: "\u300A\u56ED\u6797\u6709\u5883\u300B\xB7 \u534E\u6B65\u5C0F\u7B51\u72ED\u5F84",
      local: "../../SuzhouClassicGardenRag/Project/converted/\u56ED\u6797\u6709\u5883/hybrid_auto/\u56ED\u6797\u6709\u5883.md",
      grade: "C",
      note: "2026-10-10 \u79BB\u7EBF garden_knowledge \u6587\u5B57\u5411\u91CF\u53EC\u56DE\uFF0C\u63D0\u5230\u7816\u780C\u95E8\u6D1E\u548C\u72ED\u957F\u5C0F\u5F84\uFF0C\u5E76\u660E\u8A00\u4ECA\u4E0D\u80FD\u8BC1\u53E4\uFF1B\u4E0D\u7ED9\u672C\u56FE\u95E8\u4F4D\u3001\u95E8\u9AD8\u548C\u6811\u77F3\u539F\u4F4D\u3002"
    }, {
      id: "misty-gate-art",
      title: "\u5165\u53E3\u2014\u5C0F\u5EAD\u70DF\u96E8\u50CF\u7D20\u8BED\u8A00\u751F\u6210/\u8FB9\u754C\u8BB0\u5F55",
      local: "../research-art/liuyuan-misty-style-pair-v2.prompt.md",
      grade: "C",
      note: "\u56FE\u4E3A\u672C\u9879\u76EE\u5185\u7F6E imagegen \u7814\u7A76\u5019\u9009\uFF1B\u6309\u51B7\u65E7\u767D\u7C89\u5899\u3001\u9EDB\u74E6\u3001\u7070\u77F3\u4E0E\u6F2B\u5C04\u5149\u8C03\u8272\uFF0C\u4E0D\u53EF\u5F53\u5B9E\u666F\u7167\u7247\u6216\u6B63\u5F0F\u50CF\u7D20\u6BCD\u7248\u3002"
    }, {
      id: "misty-gate-paving",
      title: "\u7559\u56ED\u94FA\u5730\u5411\u91CF\u8D44\u6599\u4E0E\u539F\u4F4D\u5F85\u6838\u6E05\u5355",
      local: "LIUYUAN_PAVING_RESEARCH.md",
      grade: "C",
      note: "\u68C0\u7D22\u867D\u5F97\u7559\u56ED\u82B1\u8857/\u51B0\u88C2\u7B49\u56FE\u7248\uFF0C\u5747\u672A\u6307\u5411\u672C\u95E8\u53E3\uFF1B\u6B64\u56FE\u6682\u4E0D\u753B\u82B1\u8857\u7EB9\u6837\u3002"
    }],
    verifiedFacts: ["\u672C\u5730\u8D44\u6599\u4EC5\u652F\u6301\u7559\u56ED\u90E8\u5206\u5165\u53E3\u7A7A\u95F4\u7684\u72ED\u5F84\u3001\u95E8\u6D1E\u3001\u6536\u653E\u8282\u594F\uFF0C\u4E0D\u652F\u6301\u6B64\u56FE\u5177\u4F53\u95E8\u4F4D"],
    inferredForPlay: ["\u672C\u955C\u7C89\u5899\u3001\u9EDB\u74E6\u3001\u77F3\u8DEF\u3001\u95E8\u67F1\u4F4D\u7F6E\u53CA\u978B\u5E95\u8FC7\u95E8\u7684\u53EF\u8D70\u51E0\u4F55", "\u96E8\u540E\u67D4\u5149\u4E0E\u51B7\u8C03\u7684\u7EDF\u4E00\u7F8E\u672F\u8BED\u6CD5"],
    redLines: [
      "\u72EC\u7ACB\u7814\u7A76\u8BD5\u73A9\u4E0D\u63A5 CH3\u3001\u4E0D\u5199\u7AE0\u8282\u8FDB\u5EA6\u3001\u4E0D\u66FF\u4EE3\u6B63\u5F0F\u5165\u53E3\u767D\u6A21\u4E0E\u73A9\u5BB6\u8349\u7A3F",
      "\u672A\u6838\u6811\u4F4D\u3001\u95E8\u6247\u3001\u67F1\u8DDD\u3001\u95E8\u69DB\u3001\u94FA\u5730\u4F4D\u7F6E\u548C\u6E05\u672B\u72B6\u6001\uFF0C\u4E0D\u79F0 1890 \u7559\u56ED\u539F\u8C8C",
      "\u751F\u6210\u56FE\u4ECD\u6709\u7EC6\u788E\u7EB9\u7406\u4E14\u53EA\u662F\u4E00\u955C\uFF0C\u987B\u7ECF\u7EDF\u4E00\u50CF\u7D20\u7F51\u683C\u3001\u4EBA\u7269\u6BD4\u4F8B\u3001\u906E\u6321\u3001\u7D20\u6750\u6743\u5229\u4E0E\u76F8\u90BB\u955C\u5934\u9A8C\u6536\u540E\u624D\u53EF\u664B\u7EA7"
    ]
  },
  {
    id: "liuyuan-alley-misty-study-v1",
    title: "\u7559\u56ED\u95E8\u5185 \xB7 \u7C89\u5899\u9EDB\u74E6\u5939\u5F04\u72EC\u7ACB\u7814\u7A76\u5207\u7247",
    period: "\u5F53\u4EE3\u7A7A\u95F4\u8282\u594F\u53C2\u8003\uFF0F\u6E05\u672B\u95E8\u8DEF\u672A\u6838\uFF1B\u6E38\u620F\u7F8E\u672F\u8BD5\u7A3F",
    state: "reference",
    sources: [{
      id: "misty-alley-rag",
      title: "\u300A\u56ED\u6797\u6709\u5883\u300B\xB7 \u534E\u6B65\u5C0F\u7B51\u72ED\u5F84",
      local: "../../SuzhouClassicGardenRag/Project/converted/\u56ED\u6797\u6709\u5883/hybrid_auto/\u56ED\u6797\u6709\u5883.md",
      grade: "C",
      note: "2026-10-10 \u79BB\u7EBF garden_knowledge \u6587\u5B57\u5411\u91CF\u518D\u67E5\uFF1A\u63D0\u5230\u7816\u780C\u95E8\u6D1E\u4E0E\u72ED\u957F\u5C0F\u5F84\uFF0C\u540C\u65F6\u63D0\u9192\u4ECA\u4E0D\u80FD\u8BC1\u53E4\uFF1B\u4E0D\u7ED9\u672C\u56FE\u5899\u7EBF\u3001\u690D\u7269\u3001\u94FA\u5730\u6216\u65E7\u95E8\u53E3\u5750\u6807\u3002"
    }, {
      id: "misty-alley-art",
      title: "\u95E8\u5185\u5939\u5F04\u51B7\u8C03\u7814\u7A76\u751F\u6210\u4E0E\u8FB9\u754C\u8BB0\u5F55",
      local: "../research-art/liuyuan-alley-misty-pixel-study-v1.prompt.md",
      grade: "C",
      note: "\u4EE5\u5185\u7F6E imagegen \u751F\u6210\u65B0\u56FE\uFF0C\u4EE5\u95E8\u5899 v3 \u4EC5\u4F5C\u8272\u677F/\u955C\u5934\u53C2\u8003\uFF1B\u975E\u5B9E\u666F\u7167\u7247\u6216\u5408\u683C\u50CF\u7D20\u6BCD\u7248\u3002"
    }, {
      id: "misty-alley-paving",
      title: "\u7559\u56ED\u94FA\u5730\u5411\u91CF\u8D44\u6599\u4E0E\u539F\u4F4D\u5F85\u6838\u6E05\u5355",
      local: "LIUYUAN_PAVING_RESEARCH.md",
      grade: "C",
      note: "\u77F3\u677F/\u5C0F\u7070\u77F3\u5757\u8854\u63A5\u53EA\u4F5C\u6E38\u620F\u56FE\u9762\u5019\u9009\uFF0C\u7559\u56ED\u82B1\u8857\u56FE\u7248\u672A\u5B9A\u4F4D\u6B64\u5939\u5F04\u3002"
    }],
    verifiedFacts: ["\u672C\u5730\u8D44\u6599\u53EA\u652F\u6301\u7559\u56ED\u5165\u53E3\u67D0\u5904\u6709\u72ED\u957F\u5C0F\u5F84\u7684\u7A7A\u95F4\u8282\u594F\uFF0C\u4E0D\u80FD\u786E\u5B9A\u672C\u56FE\u66F2\u6298\u548C\u5899\u4F4D"],
    inferredForPlay: ["\u672C\u955C\u5899\u7EBF\u3001\u690D\u683D\u3001\u94FA\u5730\u6750\u8D28\u4EA4\u63A5\u53CA\u978B\u5E95\u8DEF\u7EBF\u3001\u67F1\u811A\u78B0\u649E", "\u4E0E\u51B7\u8C03\u95E8\u5899\u7814\u7A76\u56FE\u76F8\u90BB\u7684\u6E38\u620F\u7F8E\u672F\u8BED\u6CD5"],
    redLines: [
      "\u72EC\u7ACB\u8BD5\u8D70\u4E0D\u63A5 CH3\u3001\u4E0D\u5199\u7AE0\u8282\u5B58\u6863\u3001\u4E0D\u66FF\u6362\u6B63\u5F0F\u5939\u5F04\u4E0E\u73A9\u5BB6\u65E7\u8349\u7A3F",
      "\u95E8\u5899\u5230\u672C\u955C\u53CA\u672C\u955C\u5230\u53E4\u6728\u4EA4\u67EF\u7684\u5B9E\u9645\u63A5\u53E3\u672A\u6838\uFF0C\u4E0D\u62FC\u6210\u6240\u8C13\u6E05\u672B\u5B9E\u666F\u901A\u8DEF",
      "\u751F\u6210\u56FE\u4ECD\u6709\u5E73\u6ED1\u7070\u9636\u7EB9\u7406\uFF1B\u987B\u6838\u50CF\u7D20\u7F51\u683C\u3001\u4EBA\u7269\u6BD4\u4F8B\u3001\u906E\u6321\u3001\u539F\u4F4D\u548C\u7D20\u6750\u4F7F\u7528\u6743\u540E\u624D\u53EF\u664B\u7EA7"
    ]
  },
  {
    id: "liuyuan-entry-lower-camera-study-v1",
    title: "\u7559\u56ED\u5165\u53E3 \xB7 \u4F4E\u673A\u4F4D\u9996\u955C\u5934\u7814\u7A76",
    period: "\u73B0\u72B6\u7A7A\u95F4\u8282\u594F\u542F\u53D1\uFF0F\u65E7\u95E8\u4F4D\u672A\u6838\uFF1B\u6E38\u620F\u7F8E\u672F\u5019\u9009",
    state: "reference",
    sources: [{
      id: "lower-entry-rag",
      title: "\u300A\u56ED\u6797\u6709\u5883\u300B\xB7 \u73B0\u72B6\u72ED\u5F84\u4E0E\u4ECA\u53E4\u8FB9\u754C",
      local: "../../SuzhouClassicGardenRag/Project/converted/\u56ED\u6797\u6709\u5883/hybrid_auto/\u56ED\u6797\u6709\u5883.md",
      grade: "C",
      note: "\u79BB\u7EBF\u5411\u91CF\u68C0\u7D22\u4EC5\u7ED9\u73B0\u72B6\u5165\u53E3\u7A7A\u95F4\u6536\u653E\u7684\u7814\u7A76\u7EBF\u7D22\uFF0C\u4E5F\u63D0\u9192\u4ECA\u666F\u4E0D\u53EF\u76F4\u63A5\u5F53\u65E7\u8C8C\u3002"
    }, {
      id: "lower-entry-bureau",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u7559\u56ED\u5EFA\u7B51",
      url: "https://ylj.suzhou.gov.cn/szsylj/ylys/201903/484421d38f504f5787a8f307925e3ad7.shtml",
      grade: "B",
      note: "\u652F\u6301\u56ED\u5185\u66F2\u5ECA\u8F6C\u6298\u3001\u5C0F\u9662\u7B49\u7C7B\u578B\uFF0C\u4E0D\u8BC1\u660E\u672C\u56FE\u95E8\u67F1\u3001\u6811\u4F4D\u548C\u94FA\u5730\u5750\u6807\u3002"
    }, {
      id: "lower-entry-process",
      title: "\u4F4E\u673A\u4F4D\u7814\u7A76\u56FE\u751F\u6210\u8BCD\u4E0E\u8FB9\u754C",
      local: "../research-art/liuyuan-entry-lower-camera-gameplay-candidate-v1.prompt.md",
      grade: "C",
      note: "\u539F\u521B\u751F\u6210\u7684\u53EF\u8D70\u7A7A\u95F4\u5047\u8BF4\uFF1B\u65E0\u65E7\u95E8\u6D4B\u7ED8\u6216\u5386\u53F2\u7167\u7247\u7684\u8BC1\u660E\u529B\u3002"
    }],
    verifiedFacts: ["\u7559\u56ED\u73B0\u72B6\u53EF\u501F\u9274\u72ED\u5F84\u4E0E\u5C0F\u9662\u5148\u6536\u540E\u653E\u7684\u4F53\u9A8C\uFF1B\u672C\u56FE\u5177\u4F53\u4F4D\u7F6E\u672A\u6838"],
    inferredForPlay: ["\u5355\u95E8\u3001\u95E8\u5916\u8BA9\u8DEF\u7A7A\u95F4\u3001\u95E8\u5185\u89C1\u5149\u4E0E\u6298\u8FD4\u811A\u70B9", "\u72EC\u7ACB\u4EBA\u7269\u3001\u95E8\u67F1\u78B0\u649E\u3001\u6A90\u53E3\u906E\u6321\u53CA\u690D\u7269\u758F\u5BC6"],
    redLines: [
      "\u53EA\u4F5C\u72EC\u7ACB\u7814\u7A76\u9875\uFF0C\u4E0D\u63A5 CH3\u3001\u4E0D\u5199\u7AE0\u65D7\u6807\u3001\u4E0D\u8986\u76D6\u65E7\u5165\u53E3\u8349\u7A3F",
      "\u4E0D\u5F97\u79F0\u4E3A\u6E05\u672B\u7559\u56ED\u5165\u53E3\u539F\u8C8C\uFF1B\u95E8\u4F4D\u3001\u5899\u7EBF\u3001\u690D\u682A\u548C\u94FA\u5730\u5747\u4E3A\u6E38\u620F\u5316\u5019\u9009",
      "\u5E95\u56FE\u53CA\u98CE\u683C\u63D0\u793A\u8BCD\u672A\u7ECF\u73A9\u5BB6\u6279\u51C6\uFF1B\u6D4F\u89C8\u5668\u5B9E\u8D70\u3001\u4EBA\u7269\u6BD4\u4F8B\u548C\u90BB\u955C\u8F6C\u573A\u901A\u8FC7\u524D\u4E0D\u53EF\u664B\u7EA7\u6B63\u5F0F\u573A\u666F"
    ]
  },
  {
    id: "liuyuan-entry-oblique-shot-study-v1",
    title: "\u7559\u56ED\u5165\u53E3 \xB7 \u659C\u4FEF\u89C6\u9996\u955C\u5934\u51E0\u4F55\u6821\u4F4D",
    period: "\u5F53\u4EE3\u5165\u53E3\u7A7A\u95F4\u6536\u653E\u542F\u53D1\uFF0F\u6E05\u672B\u95E8\u4F4D\u672A\u6838\uFF1B\u539F\u521B\u6E38\u620F\u5019\u9009",
    state: "reference",
    sources: [{
      id: "oblique-entry-rag",
      title: "\u300A\u56ED\u6797\u6709\u5883\u300B\xB7 \u534E\u6B65\u5C0F\u7B51\u72ED\u5F84",
      local: "../../SuzhouClassicGardenRag/Project/converted/\u56ED\u6797\u6709\u5883/hybrid_auto/\u56ED\u6797\u6709\u5883.md",
      grade: "C",
      note: "2026-10-10 \u79BB\u7EBF garden_knowledge \u6587\u5B57\u5411\u91CF\u5B9E\u67E5\uFF0C\u4EC5\u652F\u6301\u7559\u56ED\u4E00\u5904\u7816\u6D1E\u72ED\u5F84\u4E0E\u5148\u6536\u540E\u653E\uFF0C\u4E0D\u7ED9\u56FE\u4E2D\u95E8\u3001\u6811\u3001\u77F3\u5730\u7684\u65E7\u5740\u3002"
    }, {
      id: "oblique-entry-bureau",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u5EFA\u7B51",
      url: "https://ylj.suzhou.gov.cn/szsylj/ylys/201903/484421d38f504f5787a8f307925e3ad7.shtml",
      grade: "B",
      note: "\u652F\u6301\u53E4\u6728\u4EA4\u67EF\u3001\u534E\u6B65\u5C0F\u7B51\u4E00\u7C7B\u66F2\u5ECA\u8F6C\u6298\u5C0F\u9662\u7684\u73B0\u72B6\u7C7B\u578B\uFF0C\u975E\u56FE\u4E2D\u51E0\u4F55\u5750\u6807\u3002"
    }, {
      id: "oblique-entry-art",
      title: "\u5165\u53E3\u659C\u4FEF\u89C6\u751F\u6210\u8BCD\u53CA\u664B\u7EA7\u8FB9\u754C",
      local: "../research-art/liuyuan-entry-oblique-pixel-study-v1.prompt.md",
      grade: "C",
      note: "\u5185\u7F6E imagegen \u4EE5\u5E9C\u5B66\u955C\u5934\u4E3A\u53C2\u8003\u751F\u6210\u5E76\u4FEE\u8BA2\uFF1B\u975E\u5B9E\u666F\u626B\u63CF\uFF0C\u4E0D\u5177\u5907\u6E05\u672B\u95E8\u67F1\u3001\u94FA\u5730\u3001\u6811\u4F4D\u7684\u6765\u6E90\u3002"
    }],
    verifiedFacts: ["\u7559\u56ED\u5165\u53E3\u73B0\u72B6\u4F53\u9A8C\u6709\u72ED\u5F84\u4E0E\u5C0F\u9662\u7684\u6536\u653E\u8282\u594F\uFF1B\u672C\u56FE\u4EFB\u4F55\u5177\u4F53\u95E8\u4F4D\u5747\u672A\u6838"],
    inferredForPlay: ["1536\xD71024 \u4E16\u754C\u4E2D\u7684\u95E8\u5916\u2014\u95E8\u69DB\u2014\u8F6C\u89D2\u811A\u70B9", "\u95E8\u67F1\u78B0\u649E\u3001\u524D\u666F\u74E6\u6A90\u6DF1\u5EA6\u4E0E\u4E66\u751F\u6BD4\u4F8B\u5019\u9009"],
    redLines: [
      "\u672C\u9996\u955C\u4E0D\u63A5 CH3\u3001\u4E0D\u5199\u65D7\u6807\uFF0C\u4E0D\u9876\u66FF\u6B63\u5F0F\u5165\u53E3 11 \u6BB5\u8DEF\u5F84\u6216\u65E7\u8349\u7A3F",
      "\u751F\u6210\u95E8\u5899\u3001\u6811\u4F4D\u3001\u77F3\u5730\u3001\u67F1\u8DDD\u548C\u56DE\u5ECA\u8F6C\u89D2\u90FD\u4E0D\u662F 1890 \u7559\u56ED\u539F\u8C8C\u8BC1\u636E",
      "\u5373\u4F7F\u9ED8\u8BA4 Tile \u8FDE\u901A\uFF0C\u4E5F\u987B\u7EDF\u4E00\u7F16\u8F91\u5668\u8349\u7A3F\u3001\u5B9E\u9645\u6D4F\u89C8\u5668\u753B\u9762\u3001\u4EBA\u7269/NPC \u540C\u5C4F\u548C\u76F8\u90BB\u955C\u5934\u6838\u9A8C\u540E\u624D\u80FD\u664B\u7EA7"
    ]
  },
  {
    id: "liuyuan-entrance-topology-study",
    title: "\u7559\u56ED\u5165\u53E3 \xB7 \u70DF\u96E8\u5939\u5F04\u6E38\u620F\u573A\u666F",
    period: "\u827A\u672F\u5316\u6E38\u620F\u7A7A\u95F4\uFF1B\u975E\u6E05\u672B\u539F\u5740\u590D\u539F",
    state: "playable",
    sources: [{
      id: "liuyuan-entry-bureau",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u7559\u56ED",
      url: "https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/b7c0f2058c75498c9ecbacf234e25b08.shtml",
      grade: "B",
      note: "\u6821\u5BF9\u56ED\u5185\u4E2D\u90E8\u6C60\u56ED\u4E0E\u5ECA\u9053\u7684\u603B\u4F53\u5173\u7CFB\uFF0C\u4E0D\u8BC1\u660E\u767D\u6A21\u4E2D\u7684\u5C3A\u5BF8\u548C\u95E8\u4F4D\u3002"
    }, {
      id: "liuyuan-entry-local-gazetteer",
      title: "\u82CF\u5DDE\u5E02\u5730\u65B9\u5FD7\u529E \xB7 \u82CF\u5DDE\u53E4\u5178\u56ED\u6797\u6F0F\u7A97\u827A\u672F",
      url: "https://dfzb.suzhou.gov.cn/dfzb/fzxh/201002/4310c9b7dad442b99b209d301b8cdd82.shtml",
      grade: "B",
      note: "\u53E4\u6728\u4EA4\u67EF\u524D\u5ECA\u5317\u5899\u6709\u516D\u6247\u6F0F\u7A97\uFF0C\u6309\u4E1C\u5230\u897F\u5217\u7EB9\u6837\uFF1B\u7B2C\u4E8C\u9879\u7F51\u9875\u7F3A\u5B57\u3002\u6E38\u620F\u50CF\u7D20\u526A\u5F71\u53EA\u4F5C\u73B0\u72B6\u542F\u53D1\uFF0C\u4E0D\u662F\u5B9E\u7269\u6479\u672C\u6216\u665A\u6E05\u7A97\u5F62\u3002\u6F0F\u7A97\u53D6\u666F\uFF0C\u4E0D\u662F\u901A\u8DEF\u3002"
    }, {
      id: "liuyuan-entry-teaching",
      title: "\u7559\u56ED\u5165\u53E3\u7A7A\u95F4\u5C42\u6B21\u6559\u5B66\u793A\u610F",
      url: "https://www.huijujiaoyu.com/sys-nd/14.html",
      grade: "C",
      note: "\u53EA\u53D6\u5C0F\u95E8\u3001\u524D\u5385\u3001\u5929\u4E95\u3001\u66F2\u5ECA\u3001\u5C0F\u5EAD\u3001\u53E4\u6728\u4EA4\u67EF\u5317\u5899\u6F0F\u7A97\u3001\u897F\u6298\u7EFF\u836B\u8F69\u7684\u73B0\u72B6\u7A7A\u95F4\u5E8F\u5217\uFF1B\u56FE\u5E76\u975E\u665A\u6E05\u6D4B\u7ED8\u3002"
    }, {
      id: "liuyuan-entry-2024-paper",
      title: "\u5F20\u94B0 \xB7 \u7559\u56ED\u5165\u53E3\u6536\u653E\u7A7A\u95F4\u5206\u6790\uFF082024\uFF09",
      url: "https://pdf.hanspub.org/Design20240100000_40977282.pdf",
      grade: "C",
      note: "\u7B2C 52\u201353 \u9875\u6B63\u6587\u652F\u6301\u5C0F\u9662\u2014\u66F2\u5ECA\u2014\u5929\u4E95\u2014\u7A84\u901A\u9053\u2014\u53E4\u6728\u4EA4\u67EF\u2014\u7EFF\u836B\u8F69\u7684\u73B0\u72B6\u4F53\u9A8C\u987A\u5E8F\uFF1B\u56FE 1 \u672C\u8F6E\u672A\u80FD\u89C6\u89C9\u6838\u67E5\uFF0C\u4E0D\u80FD\u636E\u6B64\u5B9A\u8F6C\u89D2\u3001\u6BD4\u4F8B\u3001\u95E8\u4F4D\u6216\u6E05\u672B\u6784\u4EF6\u3002"
    }, {
      id: "liuyuan-entry-visual-perception-2026",
      title: "\u5B59\u65FB\u607A\u7B49 \xB7 \u57FA\u4E8E\u89C6\u89C9\u611F\u77E5\u7684\u7559\u56ED\u5165\u53E3\u7A7A\u95F4\u5E8F\u5217\u7814\u7A76\uFF082026\uFF09",
      url: "https://www.gardenmagazine.cn/ylzz/article/html/20250810001",
      grade: "B",
      note: "\u5DF2\u6838\u671F\u520A HTML \u5168\u6587\u4E0E\u56FE1\uFF1A\u5B9E\u9A8C\u4F7F\u75282023\u73B0\u72B6\u95E8\u5385\u53E3\u2014\u53E4\u6728\u4EA4\u67EF\u2014\u8FDE\u7EED\u6F0F\u7A97\u2014\u534E\u6B65\u5C0F\u7B51\u2014\u7EFF\u836B\u8F69\u7EA650\u7C73\u8DEF\u7EBF\uFF1B30\u4EBA\u62DB\u52DF\u300128\u7EC4\u6709\u6548VR\u89C2\u770B\u6570\u636E\u3002\u4EC5\u652F\u6301\u89C6\u7EBF\u5F15\u5BFC/\u6536\u653E\u4F53\u9A8C\uFF0C\u4E0D\u8BC1\u6E05\u672B\u95E8\u4F4D\u3001\u4EBA\u7269\u884C\u8D70\u6E38\u620F\u4E50\u8DA3\u6216\u73B0\u6709Tile\u6BD4\u4F8B\u3002"
    }, {
      id: "liuyuan-entry-ch3",
      title: "\u300A\u59D1\u82CF\u4E5D\u56ED-\u5267\u672C-CH3\u7559\u56ED\u300B",
      local: "../\u59D1\u82CF\u4E5D\u56ED-\u5267\u672C-CH3\u7559\u56ED.md",
      grade: "C",
      note: "\u6821\u51C6\u73A9\u5BB6\u5148\u884C\u8D70\u3001\u540E\u7AA5\u56ED\u7684\u53D9\u4E8B\u8282\u594F\u3002"
    }],
    verifiedFacts: ["\u7559\u56ED\u4E2D\u90E8\u4E3A\u6C60\u56ED\u5C71\u6C34\uFF0C\u5165\u53E3\u901A\u9053\u4EE5\u66F2\u5ECA\u53CA\u5C0F\u5EAD\u7EC4\u7EC7\u7A7A\u95F4\u5C42\u6B21", "\u53E4\u6728\u4EA4\u67EF\u524D\u5ECA\u5317\u5899\u73B0\u6709\u516D\u6247\u6F0F\u7A97\uFF0C\u9694\u7A97\u89C2\u666F\u800C\u975E\u7A7F\u884C"],
    inferredForPlay: ["\u5404\u6BB5\u957F\u5EA6\u3001\u5BBD\u5EA6\u3001\u811A\u70B9\u53CA CH3 \u89E6\u53D1\u5750\u6807", "\u7C89\u5899\u7070\u74E6\u3001\u5F02\u8D28\u94FA\u5730\u3001\u7AF9\u5F71\u3001\u4E54\u6728\u4E0E\u95E8\u5916\u5668\u7269\u7684\u539F\u521B\u6E38\u620F\u5316\u5E03\u7F6E"],
    redLines: ["\u4E0D\u5F97\u5C06\u6E38\u620F\u573A\u666F\u79F0\u4E3A 1890 \u7559\u56ED\u5B9E\u6D4B\u5E73\u9762\u6216\u65E7\u95E8\u4F4D\u590D\u539F", "\u516D\u6247\u6F0F\u7A97\u4E0D\u53EF\u505A\u95E8\u6D1E\uFF1B\u4ECE\u53E4\u6728\u4EA4\u67EF\u987B\u897F\u6298\u8FDB\u5C0F\u5EAD", "\u4E0D\u628A\u9694\u7A97\u7AA5\u56ED\u7B49\u540C\u4E8E\u5DF2\u7ECF\u770B\u5230\u5B8C\u6574\u6C60\u56ED", "\u672A\u7ECF\u8BB8\u53EF\u7684\u5B9E\u666F\u7167\u7247\u53CA\u8BBA\u6587\u56FE\u7248\u4E0D\u5F97\u76F4\u63A5\u8D34\u5165\u6E38\u620F\u8D44\u4EA7", "\u7F16\u8F91\u5668\u73A9\u5BB6\u8349\u7A3F\u548C\u5B9E\u9645\u6D4F\u89C8\u5668\u906E\u6321\u4ECD\u5E94\u5355\u72EC\u6838\u5BF9\uFF0C\u4EE3\u7801\u9ED8\u8BA4\u573A\u666F\u4E0D\u5F97\u8986\u76D6\u8349\u7A3F"]
  },
  {
    id: "liuyuan-whole-garden-study-v2",
    title: "\u7559\u56ED \xB7 \u65E7\u5168\u56ED\u8BEF\u7A3F v2\uFF08\u7981\u6B62\u94FA\u78B0\u649E\uFF09",
    period: "\u7EA6 1890 / \u73B0\u72B6\u7A7A\u95F4\u5173\u7CFB",
    state: "reference",
    sources: [{
      id: "liuyuan-bureau-v2",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u7559\u56ED",
      url: "https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/b7c0f2058c75498c9ecbacf234e25b08.shtml",
      grade: "B",
      note: "\u56DB\u533A\u5173\u7CFB\u4E0E\u56ED\u5185\u7A7A\u95F4\u6536\u653E\uFF1B\u56FE\u4E2D\u5357\u4FA7\u5939\u5F04\u7684\u5177\u4F53\u8F6C\u6298\u4E0D\u4F5C\u4E3A\u53F2\u5B9E\u3002"
    }, {
      id: "liuyuan-ch3-v2",
      title: "\u300A\u59D1\u82CF\u4E5D\u56ED-\u5267\u672C-CH3\u7559\u56ED\u300B",
      local: "../\u59D1\u82CF\u4E5D\u56ED-\u5267\u672C-CH3\u7559\u56ED.md",
      grade: "C",
      note: "\u5C0F\u95E8\u2014\u7A84\u6697\u5939\u5F04\u2014\u8C41\u7136\u89C1\u6C60\u4E3A\u5267\u60C5\u8282\u594F\u3002"
    }],
    verifiedFacts: ["\u7559\u56ED\u4E2D\u90E8\u4EE5\u5C71\u6C34\u4E3A\u4E3B\uFF0C\u4E1C\u90E8\u4EE5\u5385\u5802\u4E3A\u4E3B\uFF0C\u897F\u90E8\u4EE5\u5C71\u6797\u4E3A\u4E3B"],
    inferredForPlay: ["\u5939\u5F04\u4E09\u5F2F\u4E0E\u82B1\u5320\u4EA4\u7CA5\u4F4D\u7F6E", "\u56DB\u5904\u4E66\u658B\u95E8\u4F4D\u548C\u8549\u53F6\u4F4D\u7F6E"],
    redLines: ["\u6574\u56ED\u6784\u56FE\u4E0E\u6D4B\u7ED8\u56FE\u504F\u5DEE\u8FC7\u5927\uFF1B\u8BE5\u8D44\u4EA7\u4EC5\u4F9B\u8BEF\u7A3F\u5BF9\u7167\uFF0C\u4E0D\u5F97\u4F5C\u4E3A\u6700\u7EC8\u56FE\u6216\u78B0\u649E\u5E95\u56FE", "\u5C4B\u9876\u906E\u6321\u7684\u811A\u4E0B\u901A\u9053\u4E0D\u5F97\u5F00\u653E\u73A9\u5BB6\u79FB\u52A8", "\u4E0D\u628A\u73B0\u4EE3\u76C6\u666F\u9648\u5217\u642C\u8FDB 1890 \u5E74"]
  },
  {
    id: "liuyuan-whole-garden-study",
    title: "\u7559\u56ED \xB7 \u56DB\u533A\u89C6\u89C9\u8BD5\u7A3F",
    period: "\u7EA6 1890",
    state: "reference",
    sources: [{
      id: "liuyuan-bureau",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u7559\u56ED",
      url: "https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/b7c0f2058c75498c9ecbacf234e25b08.shtml",
      grade: "B",
      note: "\u4ECA\u65E5\u56DB\u533A\u4E0E\u4E2D\u90E8\u5C71\u6C34\u3001\u4E1C\u90E8\u5385\u5802\u3001\u897F\u90E8\u5C71\u6797\u7684\u5173\u7CFB\uFF1B\u4E0D\u76F4\u63A5\u8BC1\u660E 1890 \u6BCF\u5EA7\u5EFA\u7B51\u3002"
    }, {
      id: "liuyuan-plan",
      title: "\u7559\u56ED\u5168\u666F\u5BFC\u89C8\u5E73\u9762\uFF08\u5317\u7BAD\u5934\uFF09",
      url: "https://cyk200.pixnet.net/album/photo/794177082",
      grade: "B",
      note: "\u53EA\u6838\u73B0\u72B6\u65B9\u4F4D\u3001\u6BD4\u4F8B\u4E0E\u8DEF\u5F84\u610F\u5411\uFF1B\u73B0\u4EE3\u8BBE\u65BD\u3001\u76C6\u666F\u5C55\u4E0E\u552E\u7968\u533A\u4E0D\u5F97\u642C\u5165\u665A\u6E05\u3002"
    }, {
      id: "liuyuan-ch3",
      title: "\u300A\u59D1\u82CF\u4E5D\u56ED-\u5267\u672C-CH3\u7559\u56ED\u300B",
      local: "../\u59D1\u82CF\u4E5D\u56ED-\u5267\u672C-CH3\u7559\u56ED.md",
      grade: "C",
      note: "\u9001\u7CA5\u3001\u82B1\u623F\u3001\u7389\u5170\u3001\u56DB\u6247\u95E8\u3001\u8549\u53F6\u4F20\u4FE1\u4E3A\u5267\u672C\u5C42\uFF1B\u5173\u952E\u4EA4\u4E92\u987B\u5206\u79BB\u7CBE\u7075\u3002"
    }],
    verifiedFacts: ["\u7559\u56ED\u73B0\u72B6\u5206\u4E2D\u3001\u4E1C\u3001\u897F\u3001\u5317\u56DB\u666F\u533A", "\u4E2D\u90E8\u4EE5\u6C60\u56ED\u5C71\u6C34\u4E3A\u4E3B\uFF0C\u4E1C\u90E8\u5385\u5802\u9662\u843D\u5BC6\u96C6\uFF0C\u897F\u90E8\u6709\u5C71\u6797"],
    inferredForPlay: ["\u5357\u82B1\u623F\u4EA4\u7CA5\u70B9\u7684\u5750\u6807", "\u56DB\u5904\u4E66\u658B\u95E8\u4F4D\u7684\u8C1C\u9898\u987A\u5E8F", "\u7389\u5170\u4E0E\u82AD\u8549\u7684\u5177\u4F53\u682A\u4F4D"],
    redLines: ["\u73B0\u56FE\u5357\u5165\u53E3\u672A\u5B9E\u73B0\u7A84\u6697\u5939\u5F04\uFF0C\u4E0D\u5F97\u7ED3\u7B97 CH3-04", "\u73B0\u4EE3\u552E\u7968\u3001\u505C\u8F66\u4E0E\u76C6\u666F\u5C55\u793A\u4E0D\u5F97\u6DF7\u5165 1890 \u573A\u666F", "1888\u20131891 \u6269\u5EFA\u4E2D\u7684\u8BBE\u65BD\u4E0D\u5F97\u672A\u6838\u5373\u753B\u6210 1890 \u5DF2\u5B8C\u6210\u539F\u8C8C"]
  },
  {
    id: "zhuozheng-whole-garden-study-v4",
    title: "\u62D9\u653F\u56ED \xB7 \u4E1C\u5411\u65E7\u95E8\u4FEE\u8BA2\u8BD5\u7A3F v4",
    period: "\u7EA6 1890 / \u73B0\u72B6\u5E03\u5C40\u53C2\u7167",
    state: "reference",
    sources: [{
      id: "zhuozheng-east-old-gate",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u4E1C\u90E8\u65E7\u989D",
      url: "https://ylj.suzhou.gov.cn/szsylj/ylwh/201910/a05ea346c8fa44faa59ec419db471056.shtml",
      grade: "B",
      note: "\u8BB0\u8FF0\u4E1C\u90E8\u65E7\u95E8\u4F4D\u4E8E\u4F4F\u5B85\u5939\u5F04\u3001\u671D\u4E1C\u901A\u767E\u5BB6\u5DF7\uFF1B\u73B0\u4ECA\u5357\u95E8\u4E3A 1962 \u5E74\u65B0\u8F9F\u3002"
    }, {
      id: "zhuozheng-bureau-v4",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u62D9\u653F\u56ED",
      url: "https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/c1df393edc8745abb20e8a9bd5525782.shtml",
      grade: "B",
      note: "\u4E1C\u4E2D\u897F\u4E09\u90E8\uFF0C\u4E2D\u592E\u5927\u6C34\u3001\u897F\u6C60\u66F2\u5C3A\u5F62\u3001\u4E1C\u90E8\u5F00\u9614\uFF1B\u73B0\u72B6\u4E0D\u7B49\u4E8E 1890 \u95E8\u5899\u539F\u8C8C\u3002"
    }, {
      id: "zhuozheng-ch2-v4",
      title: "\u300A\u59D1\u82CF\u4E5D\u56ED-\u5267\u672C-CH2\u62D9\u653F\u56ED\u300B",
      local: "../\u59D1\u82CF\u4E5D\u56ED-\u5267\u672C-CH2\u62D9\u653F\u56ED.md",
      grade: "C",
      note: "\u4E09\u95F8\u5728\u4E16\u754C\u5C42\uFF0C\u591C\u5165\u4E1C\u90E8\u540E\u53EA\u4F5C\u6709\u9650\u89C2\u5BDF\u3002"
    }],
    verifiedFacts: ["\u4E1C\u90E8\u65E7\u5165\u53E3\u671D\u4E1C\u901A\u767E\u5BB6\u5DF7\uFF0C\u4E0D\u662F 1962 \u5E74\u540E\u5357\u95E8", "\u897F\u56ED\u6C34\u6C60\u5448\u66F2\u5C3A\u5F62\uFF0C\u4E2D\u592E\u5927\u6C34\u4E3A\u4E3B"],
    inferredForPlay: ["\u4E1C\u90E8\u6B8B\u56ED\u8352\u829C\u7A0B\u5EA6", "\u4E09\u6BB5\u4EA7\u6743\u5899\u4E0E\u65E7\u5165\u53E3\u7684\u56FE\u4E0A\u7CBE\u786E\u5750\u6807", "\u591C\u95F4\u6500\u5899\u4E0E\u7A97\u7684\u955C\u5934\u673A\u4F4D"],
    redLines: ["\u4E0D\u5F97\u6062\u590D\u4E1C\u90E8\u5357\u5411\u6E38\u5BA2\u6B63\u95E8", "\u4E0D\u5F97\u8BA9\u897F\u4E2D\u4E1C\u4E09\u56ED\u6210\u4E3A\u65E5\u5E38\u8D2F\u901A\u6E38\u7EBF", "\u751F\u6210\u753B\u9762\u4E0D\u80FD\u5192\u5145 1890 \u6D4B\u7ED8"]
  },
  {
    id: "zhuozheng-whole-garden-study-v3",
    title: "\u62D9\u653F\u56ED \xB7 \u4E09\u754C\u91CD\u7ED8\u8BD5\u7A3F v3",
    period: "\u7EA6 1890",
    state: "reference",
    sources: [{
      id: "zhuozheng-bureau",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u62D9\u653F\u56ED",
      url: "https://ylj.suzhou.gov.cn/szsylj/ylwh/201604/0aa1729654784346a463e9e46d2cbcae.shtml",
      grade: "B",
      note: "\u4ECA\u56ED\u4E3A\u897F\u8865\u56ED\u3001\u4E2D\u539F\u62D9\u653F\u56ED\u3001\u4E1C\u5F52\u7530\u56ED\u5C45\uFF1B\u73B0\u72B6\u8FB9\u754C\u4E0D\u80FD\u76F4\u63A5\u7B49\u4E8E 1890 \u5F00\u95E8\u72B6\u6001\u3002"
    }, {
      id: "zhuozheng-plan",
      title: "\u73B0\u72B6\u5168\u56ED\u5BFC\u89C8\u56FE",
      url: "https://news.2500sz.com/doc/2025/09/08/1169624.shtml",
      grade: "B",
      note: "\u4F9B\u5317\u5411\u3001\u4E09\u5757\u5730\u76F8\u5BF9\u6BD4\u4F8B\u3001\u6C60\u5CB8\u4E0E\u57CE\u8857\u5173\u7CFB\u53C2\u8003\uFF1B\u7981\u6B62\u6284\u4ECA\u5929\u7684\u6E38\u7EBF\u53CA\u9986\u820D\u3002"
    }, {
      id: "zhuozheng-ch2",
      title: "\u300A\u59D1\u82CF\u4E5D\u56ED-\u5267\u672C-CH2\u62D9\u653F\u56ED\u300B",
      local: "../\u59D1\u82CF\u4E5D\u56ED-\u5267\u672C-CH2\u62D9\u653F\u56ED.md",
      grade: "C",
      note: "\u897F\u56ED\u79C1\u95E8\u3001\u4E2D\u90E8\u4F1A\u9986\u3001\u4E1C\u56ED\u591C\u884C\u4E0E\u90A3\u6247\u7A97\u7684\u5267\u60C5\u5750\u6807\u4ECD\u987B\u9010\u4E00\u6838\u3002"
    }],
    verifiedFacts: ["\u4E1C\u3001\u4E2D\u3001\u897F\u4E09\u90E8\u5206\u533A\u53EF\u8FA8", "\u4E2D\u90E8\u6C34\u9762\u4E3A\u4E3B\u8981\u7A7A\u95F4\u8981\u7D20", "\u897F\u90E8\u4E3A\u65E7\u8865\u56ED\u3001\u4E1C\u90E8\u4E3A\u539F\u5F52\u7530\u56ED\u5C45"],
    inferredForPlay: ["\u4E1C\u5F52\u7530\u56ED\u5C45\u9057\u5740\u7684\u8352\u829C\u7A0B\u5EA6", "\u591C\u95F4\u7FFB\u5899\u548C\u7AA5\u7A97\u7684\u7CBE\u786E\u4F4D\u7F6E"],
    redLines: ["\u4E0D\u5F97\u628A\u4ECA\u65E5\u4E09\u56ED\u8FDE\u901A\u6E38\u7EBF\u642C\u5230 1890", "\u8352\u56ED\u662F\u5267\u672C\u7A7A\u95F4\u6F14\u7ECE\uFF0C\u4E0D\u5BA3\u79F0\u9010\u7269\u5386\u53F2\u590D\u539F", "\u65E7 v2 \u5357\u4FA7\u76F4\u6CB3\u4E0E\u5DE8\u578B\u8352\u5858\u6CA1\u6709\u4F9D\u636E", "CH2-02 \u6587\u6848\u65B9\u5411\u5DF2\u6539\uFF0C\u5B9E\u9645\u95E8\u4F4D\u53CA\u7ED5\u5899\u8857\u8DEF\u4ECD\u5F85\u6838"]
  },
  {
    id: "zhuozheng-whole-garden-study",
    title: "\u62D9\u653F\u56ED \xB7 \u65E7\u8BEF\u7A3F v2",
    period: "\u7EA6 1890 / \u5E9F\u5F03\u89C6\u89C9\u8BD5\u7A3F",
    state: "reference",
    sources: [{
      id: "zhuozheng-bureau-legacy",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u62D9\u653F\u56ED",
      url: "https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/c1df393edc8745abb20e8a9bd5525782.shtml",
      grade: "B",
      note: "\u7528\u4E8E\u8BC6\u522B\u65E7\u7A3F\u4E0E\u5B9E\u666F\u4E09\u5206\u533A\u3001\u6C34\u4F53\u5173\u7CFB\u7684\u51B2\u7A81\u3002"
    }],
    verifiedFacts: ["\u5168\u56ED\u5206\u4E1C\u3001\u4E2D\u3001\u897F\u4E09\u90E8\u5206\uFF0C\u4E2D\u592E\u4E3A\u5927\u6C34\u4E3B\u4F53"],
    inferredForPlay: ["\u65E7\u56FE\u4EC5\u4F9B\u6BD4\u8F83\u4E0E\u6D4F\u89C8\u5668\u8349\u7A3F\u8FC1\u79FB"],
    redLines: ["\u65E7\u7A3F\u5357\u4FA7\u957F\u76F4\u6CB3\u3001\u5DE8\u578B\u4E1C\u5858\u548C\u9519\u4F4D\u79C1\u95E8\u5747\u4E0D\u5F97\u8FDB\u5165\u6B63\u5F0F\u5173\u5361"]
  },
  {
    id: "huanxiu-whole-garden-study",
    title: "\u73AF\u79C0\u5C71\u5E84 \xB7 \u5C71\u5F84\u8BD5\u7A3F",
    period: "\u7EA6 1890",
    state: "reference",
    sources: [{
      id: "huanxiu-restoration",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u9648\u4ECE\u5468\u4E0E\u56ED\u6797\u4FEE\u590D",
      url: "https://ylj.suzhou.gov.cn/szsylj/ryyl/201902/4320700c8322412998c7f39c3f4a70ae.shtml",
      grade: "B",
      note: "\u786E\u8BA4\u5C71\u4F53\u4EE5\u5916\u90E8\u5206\u5EFA\u7B51\u540E\u4E16\u91CD\u5EFA\uFF0C\u4E0D\u80FD\u7167\u73B0\u72B6\u753B\u5165\u665A\u6E05\u3002"
    }, {
      id: "huanxiu-rockery",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u53E0\u5C71",
      url: "https://ylj.suzhou.gov.cn/szsylj/ylys/201903/0306817832f64a68bfd66c830d1ff994.shtml",
      grade: "B",
      note: "\u5047\u5C71\u3001\u6DA7\u8C37\u3001\u6C60\u6C34\u7684\u5173\u7CFB\u3002"
    }],
    verifiedFacts: ["\u6E56\u77F3\u5927\u5047\u5C71\u662F\u7A7A\u95F4\u4E3B\u666F", "\u5C71\u6C34\u4E4B\u95F4\u5B58\u5728\u7EB5\u6DF1\u6DA7\u8C37"],
    inferredForPlay: ["\u897F\u4E49\u5E84\u5E84\u5C4B\u5E03\u5C40", "\u4E0A\u5C71\u8DEF\u5F84\u7684\u5177\u4F53\u8F6C\u6298\u3001\u5CF0\u6D1E\u56DB\u8FA8\u70B9"],
    redLines: ["1980 \u5E74\u4EE3\u590D\u5EFA\u5EFA\u7B51\u4E0D\u53EF\u753B\u4F5C 1890 \u539F\u8C8C", "\u6479\u672C\u4E0D\u80FD\u5F53\u300A\u5177\u533A\u6797\u5C4B\u56FE\u300B\u771F\u8FF9"]
  },
  {
    id: "yipu-whole-garden-study-v3",
    title: "\u827A\u5703 \xB7 \u6C60\u5317\u5EF6\u5149\u9601\u4FEE\u8BA2\u8BD5\u7A3F v3",
    period: "\u7EA6 1890 / \u73B0\u72B6\u4E0E\u5730\u65B9\u5FD7\u4EA4\u53C9\u53C2\u7167",
    state: "reference",
    sources: [{
      id: "yipu-yanguangge-bureau",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u5EF6\u5149\u9601",
      url: "https://ylj.suzhou.gov.cn/szsylj/ylwh/201604/6a6fdbc9c24140adbe9e6ece60acd923.shtml",
      grade: "B",
      note: "\u660E\u786E\u5EF6\u5149\u9601\u5728\u6C60\u5317\u3001\u4E3A\u5927\u578B\u6C34\u69AD\u3001\u5357\u671B\u5047\u5C71\uFF1B\u4ECA\u65E5\u533E\u989D\u4E3A 1984 \u5E74\u4E66\uFF0C\u4E0D\u5F97\u653E\u5165\u665A\u6E05\u753B\u9762\u3002"
    }, {
      id: "yipu-local-gazetteer",
      title: "\u82CF\u5DDE\u5E02\u5730\u65B9\u5FD7\u529E\u516C\u5BA4 \xB7 \u82CF\u5DDE\u56ED\u6797\uFF1A\u4F60\u4E0D\u77E5\u9053\u7684\u79D8\u5BC6",
      url: "https://dfzb.suzhou.gov.cn/dfzb/fzxh/201704/298ecfc1035f44b4b24ed541427af4d5.shtml",
      grade: "B",
      note: "\u8BF4\u660E\u6E05\u521D\u59DC\u6C0F\u827A\u5703\u5DF2\u6709\u5EF6\u5149\u9601\u4E4B\u540D\uFF1B\u4F46\u4E0D\u80FD\u76F4\u63A5\u8BC1\u660E\u73B0\u5B58\u6C60\u5317\u6C34\u69AD\u7684\u5177\u4F53\u665A\u6E05\u6728\u6784\u3002"
    }, {
      id: "yipu-ch9-v3",
      title: "\u300A\u59D1\u82CF\u4E5D\u56ED-\u5267\u672C-CH9\u827A\u5703\u300B",
      local: "../\u59D1\u82CF\u4E5D\u56ED-\u5267\u672C-CH9\u827A\u5703.md",
      grade: "C",
      note: "\u516C\u6240\u6D3B\u8BA1\u3001\u6C60\u8FB9\u5C11\u4E00\u7B14\u4E0E\u542C\u58F0\u73A9\u6CD5\u5C5E\u4E8E\u6E38\u620F\u5267\u672C\u3002"
    }],
    verifiedFacts: ["\u5EF6\u5149\u9601\u662F\u6C60\u5317\u4E34\u6C34\u5EFA\u7B51\uFF0C\u671D\u5357\u53EF\u671B\u6C60\u5357\u5047\u5C71", "\u5EF6\u5149\u9601\u4E4B\u540D\u5728\u59DC\u6C0F\u827A\u5703\u65F6\u671F\u5DF2\u6709\u8BB0\u8FF0"],
    inferredForPlay: ["v3 \u56FE\u4E2D\u4E94\u5F00\u95F4\u6BD4\u4F8B\u3001\u95E8\u6D1E\u4E0E\u652F\u67F1\u5750\u6807", "\u5EF6\u5149\u9601\u548C\u4E1C\u5ECA\u7684\u73A9\u5BB6\u884C\u8D70\u8FDE\u63A5"],
    redLines: ["\u4E0D\u5F97\u628A 1984 \u5E74\u4E66\u5199\u7684\u73B0\u5B58\u533E\u989D\u753B\u8FDB 1890 \u573A\u666F", "\u73B0\u5B58\u9601\u4E0E\u540C\u540D\u65E7\u9601\u4E0D\u80FD\u672A\u7ECF\u6838\u8BC1\u4FBF\u8BF4\u6210\u540C\u4E00\u539F\u7269", "\u9601\u9762\u4E0B\u65B9\u6C34\u9762\u4E0D\u5F97\u94FA\u53EF\u8D70 Tile"]
  },
  {
    id: "yipu-whole-garden-study",
    title: "\u827A\u5703 \xB7 \u516C\u6240\u5B85\u56ED\u8BD5\u7A3F",
    period: "\u7EA6 1890",
    state: "reference",
    sources: [{
      id: "yipu-bureau",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u827A\u5703",
      url: "https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/40478a4c651f48088b8888dd8d9141f0.shtml",
      grade: "B",
      note: "\u65B9\u6C60\u3001\u6C60\u5357\u571F\u5C71\u3001\u4E73\u9C7C\u4EAD\u53CA\u82B9\u5E90\u7B49\u5173\u7CFB\u3002"
    }, {
      id: "yipu-guild",
      title: "\u82CF\u5DDE\u5E02\u56ED\u6797\u5C40 \xB7 \u4E03\u8944\u516C\u6240\u8BB0",
      url: "https://ylj.suzhou.gov.cn/szsylj/ylwh/201808/ad2d3e6f1350414cba449cd24ed9f7d8.shtml",
      grade: "A",
      note: "\u786E\u8BA4\u56ED\u5728\u665A\u6E05\u7528\u4F5C\u4E03\u8944\u516C\u6240\uFF0C\u4E0D\u5E94\u753B\u6210\u65E0\u4EBA\u7684\u7EAF\u89C2\u8D4F\u56ED\u3002"
    }],
    verifiedFacts: ["\u4E1C\u5B85\u897F\u56ED\u3001\u56ED\u4EE5\u65B9\u6C60\u4E3A\u6838\u5FC3", "\u6C60\u5357\u6709\u571F\u5C71\u3001\u6C60\u4E1C\u6709\u4E73\u9C7C\u4EAD", "\u665A\u6E05\u66FE\u4F5C\u4E03\u8944\u516C\u6240"],
    inferredForPlay: ["\u8D27\u7269\u3001\u8D26\u684C\u3001\u89C4\u6761\u7891\u7684\u5177\u4F53\u6446\u4F4D", "\u73A9\u5BB6\u5750\u4E0B\u505A\u5C11\u4E00\u7B14\u7684\u6C60\u8FB9\u70B9"],
    redLines: ["\u4E0D\u5F97\u590D\u7528\u65B9\u5411\u9519\u8BEF\u7684 v1 \u5E95\u56FE", "v2 \u6F0F\u6389\u6C60\u5317\u5EF6\u5149\u9601\uFF0C\u4E0D\u5F97\u4F5C\u6B63\u5F0F\u78B0\u649E\u5E95\u56FE", "\u540E\u4E16\u4FEE\u7F2E\u4F4F\u5B85\u53CA\u73B0\u4EE3\u8336\u5EA7\u4E0D\u5165 1890 \u573A\u666F"]
  }
];

// src/data/scene-research-candidates.ts
var CORPUS = "../../SuzhouClassicGardenRag/Project/converted/";
var SCENE_RESEARCH_CANDIDATES = [
  {
    id: "ly-youyicun-round-opening",
    sceneId: "liuyuan-youyicun-transition-study-v1",
    topic: "\u82B1\u623F\uFF0F\u5C0F\u84EC\u83B1\u2014\u53C8\u4E00\u6751\u2014\u56DB\u9762\u5385\u7684\u53CD\u5411\u8FD4\u56ED\u8DEF\u4E0E\u5706\u95E8\u73B0\u72B6\u56FE",
    sourceTitle: "\u300A\u56ED\u5EAD\u4FE1\u6B65\xB7\u98CE\u6708\u957F\u7559\u300B",
    localPath: `${CORPUS}\u56ED\u5EAD\u4FE1\u6B65 \u4E2D\u56FD\u53E4\u5178\u56ED\u6797\u6587\u5316\u89E3\u8BFB (\u66F9\u6797\u5A23\u8457, Cao Lindi zhu, \u66F9\u6797\u5A23\u8457, \u66F9\u6797\u5A23) /hybrid_auto/\u56ED\u5EAD\u4FE1\u6B65 \u4E2D\u56FD\u53E4\u5178\u56ED\u6797\u6587\u5316\u89E3\u8BFB (\u66F9\u6797\u5A23\u8457, Cao Lindi zhu, \u66F9\u6797\u5A23\u8457, \u66F9\u6797\u5A23) .md`,
    locator: "\u56FE 5-2 \u7559\u56ED\u5E73\u9762\u56FE\u3001\u56FE 5-23 \u67F3\u6697\u82B1\u660E\u53C8\u4E00\u6751\uFF1B\u539F\u4E66\u626B\u63CF\u5DF2\u4EBA\u5DE5\u770B\u56FE\uFF0C\u7167\u7247\u662F\u73B0\u72B6\u800C\u975E\u6E05\u672B",
    productionUse: "\u53EA\u501F\u95E8\u6D1E\u4E0E\u201C\u8F6C\u8FC7\u53BB\u624D\u6709\u56ED\u8DEF\u201D\u7684\u7A7A\u95F4\u5173\u7CFB\u5236\u4F5C\u7814\u7A76\u5207\u7247\uFF1B\u4E0D\u590D\u5236\u626B\u63CF\u50CF\u7D20\u6216\u95E8\u989D\u6587\u5B57\u3002",
    verifyBeforeUse: "\u53D6\u5F97\u53EF\u9760\u6E05\u672B\u5E73\u9762\u3001\u5706\u95E8\u5E74\u4EE3\u53CA\u82B1\u623F\u81F3\u56DB\u9762\u5385\u5B9E\u8D70\u63A5\u53E3\uFF1B\u4EBA\u5DE5\u6838\u94FA\u5730\u3001\u6811\u79CD\u4E0E\u4EBA\u7269/\u95E8\u9AD8\u6BD4\u4F8B\u3002",
    studyAsset: "../research-art/liuyuan-youyicun-transition-pixel-study-v1.png",
    studyPage: "liuyuan-youyicun-study.html",
    review: "pending",
    imageRights: "unreviewed"
  },
  {
    id: "ly-stone-hesuo-frame-depth",
    sceneId: "liuyuan-stone-forest-court-study-v1",
    topic: "\u9E64\u6240\u65B9\u95E8\u2014\u7A7A\u7A97\u2014\u82B1\u7A97\u2014\u82AD\u8549\u7684\u591A\u91CD\u89C6\u7EBF",
    sourceTitle: "\u300A\u56FE\u8BF4\u82CF\u5DDE\u56ED\u6797\xB7\u95E8\u7A97\u300B",
    localPath: `${CORPUS}\u56FE\u8BF4\u82CF\u5DDE\u56ED\u6797 \u95E8\u7A97 (\u66F9\u6797\u5A23) (z-library.sk, 1lib.sk, z-lib.sk)/hybrid_auto/\u56FE\u8BF4\u82CF\u5DDE\u56ED\u6797 \u95E8\u7A97 (\u66F9\u6797\u5A23) (z-library.sk, 1lib.sk, z-lib.sk).md`,
    locator: "\u56FE 2-5 \u81F3\u56FE 2-6\u3001\u56FE 5-20 \u81F3\u56FE 5-22\uFF1B\u5DF2\u4EBA\u5DE5\u67E5\u770B\u56FE 2-5\uFF0C\u4F46\u5404\u56FE\u9700\u9010\u5F20\u6838\u4F4D\u7F6E\u4E0E\u671D\u5411",
    productionUse: "CH3-06 \u53EF\u4EE5\u8BBE\u8BA1\u201C\u770B\u89C1\u82AD\u8549\u5374\u4E0D\u80FD\u76F4\u7A7F\u7A97\u201D\u7684\u8FA8\u8DEF\uFF1B\u751F\u6210\u50CF\u7D20\u56FE\u53EA\u6F14\u793A\u5C42\u6B21\uFF0C\u4E0D\u662F\u95E8\u6D1E\u5B9E\u6D4B\u3002",
    verifyBeforeUse: "\u5BF9\u7167\u5B9E\u666F\u5E73\u9762\u6807\u5B9A\u9E64\u6240\u4E0E\u77F3\u6797\u5C0F\u9662\u7684\u95E8\u7A97\uFF1B\u6838\u6E05\u672B\u72B6\u6001\u548C\u56FE\u50CF\u6388\u6743\uFF0C\u518D\u51B3\u5B9A\u6B63\u5F0F\u7A97\u683C\u3002",
    studyAsset: "../research-art/liuyuan-stone-forest-pattern-research-v2-pixel.png",
    review: "pending",
    imageRights: "unreviewed"
  },
  {
    id: "ly-ice-crack-paving-location",
    sceneId: "liuyuan-stone-forest-court-study-v1",
    topic: "\u7559\u56ED\u51B0\u88C2\u7EB9\u94FA\u5730\uFF1A\u56FE\u6848\u5C5E\u5B9E\uFF0C\u77F3\u6797\u5C0F\u9662\u4F4D\u7F6E\u672A\u8BC1\u5B9E",
    sourceTitle: "\u300A\u56FE\u8BF4\u82CF\u5DDE\u56ED\u6797\xB7\u94FA\u5730\u300B",
    localPath: `${CORPUS}\u56FE\u8BF4\u82CF\u5DDE\u56ED\u6797 \u94FA\u5730 (\u66F9\u6797\u5A23) (z-library.sk, 1lib.sk, z-lib.sk)/hybrid_auto/\u56FE\u8BF4\u82CF\u5DDE\u56ED\u6797 \u94FA\u5730 (\u66F9\u6797\u5A23) (z-library.sk, 1lib.sk, z-lib.sk).md`,
    locator: "\u56FE 1-22\uFF1B\u539F\u4E66\u56FE\u7248\u53EF\u89C1\u4E0D\u89C4\u5219\u51B0\u88C2\u62FC\u63A5\uFF0C\u4F46\u672A\u6807\u56ED\u5185\u62CD\u6444\u70B9",
    productionUse: "\u53EA\u4F5C\u6750\u8D28\u5019\u9009\uFF0C\u4E0D\u636E\u6B64\u5BA3\u79F0\u77F3\u6797\u5C0F\u9662\u6216 CH3 \u5FC5\u7ECF\u8DEF\u9762\u4E3A\u51B0\u88C2\u7EB9\u3002",
    verifyBeforeUse: "\u8865\u5E26\u65B9\u4F4D\u7684\u94FA\u5730\u5B9E\u666F\u7167\u7247\u53CA\u6D4B\u7ED8\uFF0C\u518D\u628A\u7EB9\u6837\u5B9E\u4F8B\u7ED1\u5B9A\u5230\u5177\u4F53 Tile \u533A\u57DF\u3002",
    review: "pending",
    imageRights: "unreviewed"
  },
  {
    id: "ly-stone-dongtian-three-windows",
    sceneId: "liuyuan-stone-forest-court-study-v1",
    topic: "\u201C\u6D1E\u5929\u4E00\u78A7\u201D\u5C0F\u5C4B\uFF1A\u4E2D\u516B\u89D2\u3001\u4E24\u4FA7\u516D\u89D2\uFF1B\u7AF9\u4E0E\u8549\u7684\u65B9\u4F4D",
    sourceTitle: "\u300A\u56FE\u8BF4\u82CF\u5DDE\u56ED\u6797\xB7\u95E8\u7A97\u300B",
    localPath: `${CORPUS}\u56FE\u8BF4\u82CF\u5DDE\u56ED\u6797 \u95E8\u7A97 (\u66F9\u6797\u5A23) (z-library.sk, 1lib.sk, z-lib.sk)/hybrid_auto/\u56FE\u8BF4\u82CF\u5DDE\u56ED\u6797 \u95E8\u7A97 (\u66F9\u6797\u5A23) (z-library.sk, 1lib.sk, z-lib.sk).md`,
    locator: "\u56FE 5-47\u3001\u56FE 5-56 \u53CA\u76F8\u90BB\u6BB5\u843D\uFF1B\u6587\u5B57\u79F0\u4E1C\u4FA7\u7FE0\u7AF9\u3001\u897F\u4FA7\u82AD\u8549\uFF0C\u4E24\u5F20\u56FE\u7248\u5DF2\u4EBA\u5DE5\u770B\u56FE",
    productionUse: "\u6BD4\u201C\u8BA4\u51FA\u516D\u89D2\u7A97\u201D\u66F4\u6709\u620F\uFF1A\u73A9\u5BB6\u987B\u5206\u8FA8\u4E24\u5B54\u540C\u4E3A\u516D\u89D2\u4F46\u7A97\u540E\u7AF9/\u8549\u4E0D\u540C\uFF0C\u518D\u4EE5\u4E2D\u95F4\u516B\u89D2\u7A97\u590D\u6838\u65B9\u4F4D\u3002",
    verifyBeforeUse: "\u6838\u4E09\u7A97\u4E0E\u5C0F\u5C4B\u7684\u540C\u4E00\u62CD\u6444\u90E8\u4F4D\u3001\u6E05\u672B\u5B58\u8C8C\u53CA\u771F\u5B9E\u53EF\u8D70\u5165\u53E3\uFF1B\u72EC\u7ACB\u7814\u7A76\u9875\u73B0\u6709\u4E09\u7A97\u56FE\uFF0C\u4F46\u4ECD\u4E0D\u80FD\u636E\u6B64\u63A5\u6210\u6B63\u5F0F\u77F3\u6797\u95E8\u8DEF\u3002",
    studyPage: "liuyuan-window-study.html",
    review: "pending",
    imageRights: "unreviewed"
  },
  {
    id: "ly-dongtian-window-room-plate",
    sceneId: "liuyuan-dongtian-three-windows-study-v1",
    topic: "\u4E09\u7A97\u72EC\u7ACB\u7814\u7A76\u623F\u95F4\uFF1A\u4E2D\u6241\u516B\u89D2\u3001\u897F\u8549\u3001\u4E1C\u7AF9",
    sourceTitle: "\u300A\u56FE\u8BF4\u82CF\u5DDE\u56ED\u6797\xB7\u95E8\u7A97\u300B",
    localPath: `${CORPUS}\u56FE\u8BF4\u82CF\u5DDE\u56ED\u6797 \u95E8\u7A97 (\u66F9\u6797\u5A23) (z-library.sk, 1lib.sk, z-lib.sk)/hybrid_auto/\u56FE\u8BF4\u82CF\u5DDE\u56ED\u6797 \u95E8\u7A97 (\u66F9\u6797\u5A23) (z-library.sk, 1lib.sk, z-lib.sk).md`,
    locator: "\u56FE 5-47\u3001\u56FE 5-56 \u53CA\u76F8\u90BB\u6587\u5B57\uFF1B2026-10-04 \u79BB\u7EBF\u6587\u5B57\u5411\u91CF\u518D\u6B21\u547D\u4E2D\uFF0C\u56FE\u7248\u5DF2\u4EBA\u5DE5\u590D\u770B",
    productionUse: "\u6B64\u7F16\u8F91\u5668\u6761\u76EE\u53EA\u6807\u5F53\u524D\u6E38\u620F\u7814\u7A76\u56FE\u7684\u5730\u9762\u3001\u4E09\u4E2A\u53EF\u8FBE\u811A\u70B9\u548C\u8349\u7A3F\uFF0C\u4E0D\u662F\u5B9E\u666F\u6D4B\u7ED8\u3002",
    verifyBeforeUse: "\u53D6\u5F97\u5E26\u65B9\u5411\u7684\u5E73\u9762\u548C\u540C\u671F\u8BC1\u636E\u540E\uFF0C\u624D\u80FD\u628A\u5C0F\u5C4B\u63A5\u5165\u77F3\u6797\u7AE0\u8282\u94FE\u3002",
    studyAsset: "../research-art/liuyuan-dongtian-three-windows-game-study-v2.png",
    studyPage: "liuyuan-window-study.html",
    review: "pending",
    imageRights: "unreviewed"
  },
  {
    id: "ly-g2-hall-window-patterns",
    sceneId: "liuyuan-guanyun-court-study-v2",
    topic: "\u6797\u6CC9\u8006\u7855\u4E4B\u9986\u7684\u5357\u5317\u5385\u7A97\u5F0F",
    sourceTitle: "\u300A\u56FE\u8BF4\u82CF\u5DDE\u56ED\u6797\xB7\u95E8\u7A97\u300B",
    localPath: `${CORPUS}\u56FE\u8BF4\u82CF\u5DDE\u56ED\u6797 \u95E8\u7A97 (\u66F9\u6797\u5A23) (z-library.sk, 1lib.sk, z-lib.sk)/hybrid_auto/\u56FE\u8BF4\u82CF\u5DDE\u56ED\u6797 \u95E8\u7A97 (\u66F9\u6797\u5A23) (z-library.sk, 1lib.sk, z-lib.sk).md`,
    locator: "\u68C0\u7D22\u201C\u6797\u6CC9\u8006\u7855\u4E4B\u9986\u201D\uFF1B\u91CD\u70B9\u6838\u56FE 5-77\u3001\u56FE 6-1\u3001\u56FE 6-46 \u4E0E\u5BF9\u5E94\u56FE\u7248",
    productionUse: "\u53EF\u5E2E\u52A9\u533A\u5206\u5357\u5317\u5385\u7684\u7A97\u5F0F\uFF0C\u4F46\u5F53\u524D v2 \u56FE\u7684\u95E8\u7A97\u4E0D\u5F97\u636E OCR \u76F4\u63A5\u91CD\u753B\u3002",
    verifyBeforeUse: "\u6838\u539F\u4E66\u56FE\u7248\u3001\u62CD\u6444\u90E8\u4F4D\u548C\u73B0\u72B6\u7167\u7247\uFF1B\u9010\u9879\u786E\u8BA4\u5B83\u5C5E\u4E8E\u6700\u7EC8\u9009\u5B9A\u7684\u6E05\u672B\u6545\u4E8B\u65F6\u6BB5\u3002",
    review: "pending",
    imageRights: "unreviewed"
  },
  {
    id: "ly-g2-east-expansion-date",
    sceneId: "liuyuan-guanyun-court-study-v2",
    topic: "\u4E1C\u56ED\u6269\u5EFA\u5E74\u4EE3\u4E0E\u9986\u524D\u9648\u8BBE",
    sourceTitle: "\u300A\u82CF\u5DDE\u56ED\u6797\u533E\u989D\u6979\u8054\u9274\u8D4F\u300B\u7B2C\u4E09\u7248",
    localPath: `${CORPUS}\u82CF\u5DDE\u56ED\u6797\u533E\u989D\u6979\u8054\u9274\u8D4F(\u7B2C\u4E09\u7248) (\u66F9\u6797\u5A23) /hybrid_auto/\u82CF\u5DDE\u56ED\u6797\u533E\u989D\u6979\u8054\u9274\u8D4F(\u7B2C\u4E09\u7248) (\u66F9\u6797\u5A23) .md`,
    locator: "\u68C0\u7D22\u201C1888\u20141891\u201D\u201C\u6797\u6CC9\u8006\u7855\u4E4B\u9986\u201D\u201C\u6D63\u4E91\u6CBC\u201D\uFF1B\u6838\u539F\u4E66\u9875\u7801",
    productionUse: "\u6750\u6599\u7ED9\u51FA\u7684\u4E1C\u56ED\u6269\u5EFA\u65F6\u95F4\u6A2A\u8DE8\u6E38\u620F\u8BBE\u5B9A\u5E74\uFF0C\u53EF\u4F5C\u4E3A\u5E74\u4EE3\u98CE\u9669\u8B66\u62A5\u3002",
    verifyBeforeUse: "\u6838\u539F\u4E66\u3001\u56ED\u5FD7\u53CA\u6863\u6848\uFF1B\u672A\u786E\u8BA4\u524D\u4E0D\u628A\u73B0\u72B6\u5385\u5185\u5C4F\u95E8\u3001\u7A97\u683C\u6216\u533E\u989D\u5199\u5165\u6E05\u672B\u6545\u4E8B\u5C42\u3002",
    review: "pending",
    imageRights: "unreviewed"
  },
  {
    id: "ly-g2-east-court-sequence",
    sceneId: "liuyuan-guanyun-court-study-v2",
    topic: "\u4E1C\u90E8\u9662\u843D\u4E0E\u5ECA\u7A97\u7684\u7A7A\u95F4\u5C42\u6B21",
    sourceTitle: "\u300A\u56ED\u6797\u6709\u5883\u300B",
    localPath: `${CORPUS}\u56ED\u6797\u6709\u5883/hybrid_auto/\u56ED\u6797\u6709\u5883.md`,
    locator: "\u68C0\u7D22\u201C\u63D6\u5CF0\u8F69\u3001\u4E94\u5CF0\u4ED9\u9986\u3001\u6797\u6CC9\u8006\u7855\u4E4B\u9986\u3001\u51A0\u4E91\u697C\u201D",
    productionUse: "\u63D0\u793A\u4E1C\u90E8\u5E76\u975E\u4E00\u5757\u655E\u5EAD\uFF1B\u53EF\u7528\u6765\u590D\u6838\u5206\u9662\u3001\u5ECA\u5E91\u4E0E\u7A97\u7684\u5C42\u6B21\u611F\u3002",
    verifyBeforeUse: "\u8FD9\u662F\u540E\u4E16\u8BBA\u8FF0\uFF0C\u987B\u4E0E\u6709\u65B9\u4F4D\u7684\u5E73\u9762\u53CA\u591A\u89D2\u5EA6\u5B9E\u666F\u4EA4\u53C9\u6838\u5BF9\uFF0C\u4E0D\u80FD\u636E\u6B64\u5B9A\u95E8\u4F4D\u3002",
    review: "pending",
    imageRights: "unreviewed"
  }
];

// scripts/verify-editor-catalog.ts
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
var ids = /* @__PURE__ */ new Set();
for (const plate of SCENE_PLATES) {
  assert(!ids.has(plate.id), `\u7F16\u8F91\u5668\u573A\u666F ID \u91CD\u590D\uFF1A${plate.id}`);
  ids.add(plate.id);
  assert((0, import_node_fs.existsSync)((0, import_node_path.resolve)(process.cwd(), plate.asset)), `\u7F16\u8F91\u5668\u5E95\u56FE\u4E0D\u5B58\u5728\uFF1A${plate.id} \u2192 ${plate.asset}`);
  const evidence = SCENE_EVIDENCE.find((item) => item.id === plate.id);
  assert(
    evidence && evidence.sources.length && evidence.redLines.length,
    `\u7F16\u8F91\u5668\u573A\u666F\u7F3A\u5E74\u4EE3\uFF0F\u6765\u6E90\uFF0F\u5236\u4F5C\u7EA2\u7EBF\uFF1A${plate.id}`
  );
}
for (const [id, preview] of Object.entries(SCENE_DRAFT_PREVIEWS)) {
  assert(ids.has(id), `\u8349\u7A3F\u9884\u89C8\u7F3A\u7F16\u8F91\u5668\u573A\u666F\uFF1A${id}`);
  assert(preview.href.includes("draft=1"), `\u8BD5\u73A9\u94FE\u63A5\u4E0D\u8BFB\u53D6\u8349\u7A3F\uFF1A${id}`);
  assert((0, import_node_fs.existsSync)((0, import_node_path.resolve)(process.cwd(), preview.href.split("?")[0])), `\u8BD5\u73A9\u9875\u4E0D\u5B58\u5728\uFF1A${preview.href}`);
}
var researchIds = /* @__PURE__ */ new Set();
for (const candidate of SCENE_RESEARCH_CANDIDATES) {
  assert(!researchIds.has(candidate.id), `RAG \u5019\u9009 ID \u91CD\u590D\uFF1A${candidate.id}`);
  researchIds.add(candidate.id);
  assert(ids.has(candidate.sceneId), `RAG \u5019\u9009\u65E0\u5BF9\u5E94\u7F16\u8F91\u5668\u573A\u666F\uFF1A${candidate.id}`);
  assert(
    candidate.review === "pending" && candidate.imageRights === "unreviewed",
    `\u672A\u7ECF\u4EBA\u5DE5\u5BA1\u6838\u7684 RAG \u5019\u9009\u4E0D\u5F97\u5347\u683C\u4E3A\u6E38\u620F\u7D20\u6750\uFF1A${candidate.id}`
  );
  assert(
    (0, import_node_fs.existsSync)((0, import_node_path.resolve)(process.cwd(), candidate.localPath)),
    `RAG \u5019\u9009\u6E90\u6587\u4EF6\u4E0D\u5B58\u5728\uFF1A${candidate.id}`
  );
  if (candidate.studyAsset) assert(
    (0, import_node_fs.existsSync)((0, import_node_path.resolve)(process.cwd(), candidate.studyAsset)),
    `RAG \u5019\u9009\u7814\u7A76\u56FE\u4E0D\u5B58\u5728\uFF1A${candidate.id}`
  );
  if (candidate.studyPage) assert(
    (0, import_node_fs.existsSync)((0, import_node_path.resolve)(process.cwd(), candidate.studyPage)),
    `RAG \u5019\u9009\u8BD5\u73A9\u9875\u4E0D\u5B58\u5728\uFF1A${candidate.id}`
  );
}
for (const id of [
  "canglang-corridor",
  "liuyuan-entrance-topology-study",
  "liuyuan-entry-gate-style-study-v1",
  "liuyuan-entry-gate-misty-study-v2",
  "liuyuan-entry-oblique-shot-study-v1",
  "liuyuan-entry-lower-camera-study-v1",
  "liuyuan-alley-misty-study-v1",
  "liuyuan-tree-court-no-water-study-v1",
  "liuyuan-lvyin-pond-study-v1",
  "liuyuan-lvyin-pond-pixel-study-v2",
  "liuyuan-flower-work-yard-study-v3",
  "liuyuan-youyicun-transition-study-v1",
  "liuyuan-stone-forest-court-study-v1",
  "liuyuan-study-court-research-v1",
  "liuyuan-study-interior-research-v1",
  "liuyuan-dongtian-three-windows-study-v1",
  "liuyuan-guanyun-court-study-v2"
]) assert(ids.has(id), `\u5728\u5236\u573A\u666F\u6216\u7814\u7A76\u5E95\u56FE\u672A\u8FDB\u5165\u7F16\u8F91\u5668\uFF1A${id}`);
assert(
  !Object.hasOwn(SCENE_DRAFT_PREVIEWS, "liuyuan-entry-gate-style-study-v1") && !(0, import_node_fs.existsSync)("liuyuan-entry-gate-study.html") && !(0, import_node_fs.existsSync)("src/liuyuan-entry-gate-study.ts"),
  "\u98CE\u683C\u672A\u901A\u8FC7\u7684\u95E8\u5916\u7814\u7A76\u7A3F\u4E0D\u5F97\u63D0\u4F9B\u8BD5\u73A9\u9875\u6216\u88AB\u8BEF\u8BA1\u4E3A\u7AE0\u8282\u573A\u666F"
);
assert(
  SCENE_PLATES.find((plate) => plate.id === "liuyuan-entrance-topology-study")?.asset === "../assets/scene25d/liuyuan-entrance-walkable-study-v2.svg",
  "\u5165\u53E3\u7F16\u8F91\u5668\u4E0E\u8BD5\u73A9\u9875\u987B\u4F7F\u7528\u540C\u4E00\u5F20\u53EF\u89C1\u5E95\u56FE"
);
var entrySource = (0, import_node_fs.readFileSync)("src/liuyuan-entry.ts", "utf8");
var runtimeAsset = entrySource.match(/background\.src = '([^']+)';/)?.[1]?.split("?")[0];
assert(
  runtimeAsset === SCENE_PLATES.find((plate) => plate.id === "liuyuan-entrance-topology-study")?.asset,
  "\u5165\u53E3\u8BD5\u73A9\u5E95\u56FE\u8DEF\u5F84\u5FC5\u987B\u4E0E\u7F16\u8F91\u5668\u573A\u666F\u8D44\u4EA7\u4E00\u81F4\uFF08\u6D4F\u89C8\u5668\u7F13\u5B58\u53C2\u6570\u4E0D\u6539\u53D8\u8D44\u4EA7\u8EAB\u4EFD\uFF09"
);
assert(
  !(0, import_node_fs.readFileSync)("src/liuyuan-entry.ts", "utf8").includes("ctx.fillRect(80, 25, 250, 125)"),
  "\u5165\u53E3\u65B0\u5E95\u56FE\u4E0D\u5E94\u88AB\u65E7\u7248\u906E\u6C60\u6574\u5757\u8272\u5E55\u8986\u76D6"
);
assert(
  !SCENE_PLATES.some((plate) => plate.asset.includes("liuyuan-flower-work-yard-study-v2.png") || plate.asset.includes("liuyuan-guanyun-court-concept-v0-rejected.png")),
  "\u5DF2\u5426\u51B3\u56FE\u4E0D\u5F97\u91CD\u65B0\u8FDB\u5165\u573A\u666F\u7F16\u8F91\u6E05\u5355"
);
console.log(`\u7F16\u8F91\u5668\u76EE\u5F55\uFF1A${SCENE_PLATES.length} \u5F20\u573A\u666F\u5E95\u56FE\u3001${Object.keys(SCENE_DRAFT_PREVIEWS).length} \u4E2A\u53EF\u8BFB\u53D6\u8349\u7A3F\u7684\u8BD5\u73A9\u9875\u3001${researchIds.size} \u6761\u5F85\u6838 RAG \u8D44\u6599\uFF1B\u8DEF\u5F84\u4E0E\u62D2\u7528\u7A3F\u68C0\u67E5\u901A\u8FC7\u3002`);
