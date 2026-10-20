"use strict";

// scripts/liuyuan-home-return-harness.ts
var import_node_assert = require("node:assert");
var import_node_fs = require("node:fs");
var import_node_vm = require("node:vm");

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

// src/core/geometry.ts
var STANDARD_PLAYER_PROFILE = {
  halfW: 4,
  topInset: 6,
  bottomInset: 1
};

// src/data/fuxue-geometry.ts
var FUXUE_ACTOR_PROFILE = STANDARD_PLAYER_PROFILE;
var FUXUE_GEOMETRY = [
  {
    id: "quarters-roof",
    occluder: {
      id: "quarters-roof",
      depthY: 118,
      polygons: [[[0, 28], [196, 28], [215, 46], [207, 108], [36, 112], [0, 94]]]
    }
  },
  {
    id: "old-tree-canopy",
    colliders: [
      { points: [[211, 154], [228, 143], [234, 194], [214, 198]] },
      { points: [[228, 143], [244, 148], [250, 190], [234, 198]] },
      { points: [[199, 190], [260, 190], [264, 221], [198, 222]] }
    ],
    occluder: {
      id: "old-tree-canopy",
      depthY: 228,
      polygons: [
        [
          [178, 116],
          [191, 99],
          [215, 94],
          [238, 104],
          [246, 123],
          [235, 141],
          [213, 148],
          [190, 140],
          [172, 126]
        ],
        [
          [224, 105],
          [250, 103],
          [278, 115],
          [297, 137],
          [289, 158],
          [267, 169],
          [244, 158],
          [232, 139]
        ],
        [
          [176, 140],
          [196, 128],
          [218, 141],
          [229, 161],
          [218, 183],
          [198, 193],
          [179, 181],
          [168, 158]
        ],
        [
          [218, 145],
          [243, 137],
          [270, 151],
          [291, 173],
          [279, 197],
          [253, 207],
          [232, 193],
          [210, 181]
        ],
        [
          [211, 154],
          [228, 134],
          [244, 145],
          [250, 190],
          [241, 216],
          [215, 210],
          [220, 181]
        ],
        [[199, 190], [260, 190], [264, 221], [198, 222]]
      ]
    }
  },
  {
    id: "bed-frame",
    colliders: [{ points: [[31, 116], [89, 116], [92, 173], [33, 176]] }],
    occluder: {
      id: "bed-frame",
      depthY: 176,
      polygons: [
        [[31, 116], [89, 116], [92, 173], [33, 176]],
        [[42, 120], [78, 120], [78, 154], [42, 158]]
      ]
    }
  },
  {
    id: "chest",
    colliders: [{ points: [[95, 128], [126, 128], [126, 155], [94, 155]] }],
    occluder: {
      id: "chest",
      depthY: 156,
      polygons: [[[95, 128], [126, 128], [126, 155], [94, 155]]]
    }
  },
  {
    id: "room-cabinet-desk",
    colliders: [
      { x: 142, y: 116, w: 15, h: 60 },
      { points: [[159, 138], [192, 138], [192, 170], [158, 172]] }
    ],
    occluder: {
      id: "room-cabinet-desk",
      depthY: 176,
      polygons: [
        [[142, 116], [157, 116], [157, 175], [142, 175]],
        [[159, 138], [192, 138], [192, 170], [182, 172], [158, 172]]
      ]
    }
  },
  {
    id: "minglun-eave",
    occluder: {
      id: "minglun-eave",
      depthY: 82,
      polygons: [[[202, 0], [502, 0], [492, 70], [216, 78]]]
    }
  },
  {
    id: "west-gate",
    occluder: {
      id: "west-gate",
      depthY: 346,
      polygons: [
        [[304, 212], [423, 212], [437, 230], [432, 266], [294, 266], [287, 246], [294, 226]],
        [[310, 258], [329, 258], [329, 345], [310, 345]],
        [[326, 262], [346, 264], [346, 329], [327, 320]],
        [[400, 258], [420, 258], [420, 345], [400, 345]],
        [[383, 264], [403, 262], [403, 320], [383, 329]],
        [[313, 260], [323, 260], [323, 286], [313, 286]],
        [[397, 260], [408, 260], [408, 286], [397, 286]]
      ]
    }
  },
  {
    id: "bridge-front-rail",
    occluder: {
      id: "bridge-front-rail",
      depthY: 232,
      polygons: [
        [
          [421, 193],
          [439, 204],
          [458, 210],
          [477, 210],
          [496, 201],
          [511, 191],
          [514, 218],
          [497, 230],
          [475, 237],
          [451, 233],
          [429, 225],
          [418, 214]
        ],
        [[422, 184], [435, 184], [435, 228], [422, 228]],
        [[456, 187], [469, 187], [469, 237], [456, 237]],
        [[502, 183], [515, 183], [515, 226], [502, 226]]
      ]
    }
  },
  {
    id: "courtyard-pond",
    effects: [{
      id: "courtyard-pond-ripple",
      kind: "water-ripple",
      // 点沿真实水面内缘标定，刻意避开岸石；换底图时只重标这里。
      polygons: [[
        [457, 134],
        [515, 125],
        [559, 129],
        [584, 143],
        [590, 176],
        [579, 215],
        [554, 244],
        [526, 258],
        [486, 260],
        [461, 247],
        [442, 224],
        [438, 194],
        [443, 160]
      ]],
      // 桥体从水面蒙版中扣除，波纹不会再扫过栏板与桥面。
      holes: [[
        [421, 176],
        [441, 168],
        [476, 168],
        [505, 180],
        [519, 198],
        [515, 218],
        [498, 234],
        [475, 241],
        [448, 236],
        [426, 224],
        [416, 210]
      ]],
      ripple: {
        color: "rgba(190, 211, 203, .48)",
        rowSpacing: 17,
        segmentSpacing: 43,
        minLength: 7,
        maxLength: 15,
        speedMs: 420
      }
    }]
  }
];
var FUXUE_OBSTACLES = FUXUE_GEOMETRY.flatMap((object) => object.colliders ?? []);
var FUXUE_OCCLUDERS = FUXUE_GEOMETRY.flatMap((object) => object.occluder ? [object.occluder] : []);
var FUXUE_EFFECTS = FUXUE_GEOMETRY.flatMap((object) => object.effects ?? []);

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

// src/data/fuxue.ts
var FUXUE_W = 46;
var FUXUE_H = 26;
var FUXUE_TILE_REGIONS = [
  { id: "west-courtyard", x: 1, y: 1, w: 37, h: 20, tile: T.PATH },
  { id: "south-street", x: 1, y: 21, w: 44, h: 5, tile: T.PATH },
  { id: "south-wall", x: 1, y: 15, w: 37, h: 6, tile: T.WALL },
  { id: "west-gate-opening", x: 21, y: 15, w: 4, h: 8, tile: T.PATH },
  { id: "minglun-hall", x: 14, y: 0, w: 17, h: 5, tile: T.WALL },
  { id: "minglun-platform", x: 15, y: 5, w: 15, h: 2, tile: T.PLAT },
  { id: "quarters-interior", x: 1, y: 2, w: 12, h: 9, tile: T.CORR },
  { id: "quarters-back-wall", x: 1, y: 1, w: 13, h: 6, tile: T.WALL },
  { id: "quarters-left-wall", x: 1, y: 1, w: 1, h: 10, tile: T.WALL },
  { id: "quarters-right-wall", x: 13, y: 1, w: 1, h: 10, tile: T.WALL },
  { id: "quarters-south-wall", x: 1, y: 10, w: 13, h: 1, tile: T.WALL },
  { id: "quarters-stairs", x: 7, y: 10, w: 3, h: 4, tile: T.CORR },
  { id: "courtyard-pond", x: 27, y: 6, w: 11, h: 11, tile: T.WATER },
  { id: "pond-bridge", x: 27, y: 11, w: 4, h: 3, tile: T.BRIDGE },
  { id: "east-temple", x: 38, y: 0, w: 8, h: 21, tile: T.WALL }
];
function fillRect(map2, x, y, w, h, tile) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    if (xx >= 0 && yy >= 0 && xx < FUXUE_W && yy < FUXUE_H) map2[yy * FUXUE_W + xx] = tile;
  }
}
function buildFuxueMap(regions = FUXUE_TILE_REGIONS) {
  const map2 = new Uint8Array(FUXUE_W * FUXUE_H);
  map2.fill(T.WALL);
  for (const region of regions) fillRect(map2, region.x, region.y, region.w, region.h, region.tile);
  return {
    map: map2,
    w: FUXUE_W,
    h: FUXUE_H,
    spawn: { x: 22 * TILE, y: 24 * TILE },
    obstacles: FUXUE_OBSTACLES
  };
}
var HOME_INTERACTIONS = [
  // 沈砚秋站在门洞偏右、门扇之后；原 x=24 格会被右门扇整个人盖住。
  { id: "shen", x: 23.25 * TILE, y: 19.5 * TILE, label: "\u6C88\u781A\u79CB" },
  // 交互锚点放在家具可接近的前缘，不放在碰撞体中心。
  { id: "desk", x: 10.25 * TILE, y: 10.75 * TILE, label: "\u7A97\u4E0B\u4E66\u6848" },
  { id: "bed", x: 6 * TILE, y: 9.5 * TILE, label: "\u5E8A\u94FA" },
  { id: "chest", x: 8 * TILE, y: 8.8 * TILE, label: "\u7BB1\u7B3C" },
  { id: "rubbings", x: 9.5 * TILE, y: 8.75 * TILE, label: "\u4E66\u67B6\u4E0E\u62D3\u7247" },
  // 书架本体不可穿入；锚点放到柜前走道，确保脚底盒可达。
  { id: "bookcase", x: 11.7 * TILE, y: 11.5 * TILE, label: "\u4E66\u67B6\u4E0B\u5C42" },
  { id: "corner", x: 33 * TILE, y: 3.5 * TILE, label: "\u5802\u540E\u6A90\u89D2" },
  { id: "courtyard", x: 17.5 * TILE, y: 13.5 * TILE, label: "\u8001\u6811\u4E0B" },
  { id: "minglun", x: 22 * TILE, y: 7.1 * TILE, label: "\u660E\u4F26\u5802\u524D" },
  { id: "gate", x: 22 * TILE, y: 20.5 * TILE, label: "\u897F\u5B66\u95E8" }
];

// src/core/physics.ts
var DEFAULT_PROFILE = STANDARD_PLAYER_PROFILE;
function solidAt(map2, px, py, w, h) {
  const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
  if (tx < 0 || ty < 0 || tx >= w || ty >= h) return true;
  return SOLID.has(map2[ty * w + tx]);
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
function collides(map2, x, y, w = MAP_W, h = MAP_H, obstacles = [], profile = DEFAULT_PROFILE) {
  return obstacles.some((shape) => collidesShape(x, y, shape, profile)) || (solidAt(map2, x - profile.halfW, y - profile.bottomInset, w, h) || solidAt(map2, x + profile.halfW, y - profile.bottomInset, w, h) || solidAt(map2, x - profile.halfW, y - profile.topInset, w, h) || solidAt(map2, x + profile.halfW, y - profile.topInset, w, h));
}

// scripts/liuyuan-home-return-harness.ts
var page = (0, import_node_fs.readFileSync)("home.html", "utf8");
function boot(search, storage) {
  const events = /* @__PURE__ */ new Map(), frames = [];
  const nodes = /* @__PURE__ */ new Map();
  let now = 0, cam = [0, 0], foot = [0, 0];
  const context = new Proxy({}, { get: (obj, key2) => key2 in obj ? obj[key2] : key2 === "drawImage" ? (img, ...args) => {
    if (img.src.includes("fuxue-west-home")) cam = [-args[4], -args[5]];
    if (img.src.includes("scholar-player")) foot = [args[4] + 9 + cam[0], args[5] + 23 + cam[1]];
  } : key2 === "measureText" ? () => ({ width: 0 }) : () => {
  } });
  const doc = { activeElement: null, hidden: false };
  function element2() {
    const handlers = /* @__PURE__ */ new Map();
    const children = [];
    const node = {
      hidden: false,
      disabled: false,
      textContent: "",
      dataset: {},
      children,
      classList: { toggle() {
      }, remove() {
      } },
      addEventListener: (type, fn) => handlers.set(type, [...handlers.get(type) ?? [], fn]),
      dispatch: (type, event = {}) => {
        for (const fn of handlers.get(type) ?? []) fn(event);
      },
      click: () => {
        if (!node.disabled) node.dispatch("click");
      },
      focus: () => {
        doc.activeElement = node;
      },
      getContext: () => context,
      append: (...items) => children.push(...items),
      prepend() {
      },
      replaceChildren: (...items) => {
        children.splice(0, children.length, ...items);
      },
      setPointerCapture() {
      },
      setAttribute() {
      },
      querySelector: () => children[0] ?? element2(),
      querySelectorAll: () => []
    };
    return node;
  }
  for (const tag of page.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)) {
    const node = element2();
    node.hidden = /\bhidden\b/.test(tag[0]);
    node.disabled = /\bdisabled\b/.test(tag[0]);
    nodes.set(tag[1], node);
  }
  const touch = element2(), moves2 = /* @__PURE__ */ new Map();
  for (const name of ["w", "a", "s", "d"]) {
    const node = element2();
    node.dataset.move = name;
    moves2.set(name, node);
  }
  const interact = element2(), cancel = element2();
  touch.querySelectorAll = (selector) => selector === "[data-move]" ? [...moves2.values()] : [];
  touch.querySelector = (selector) => selector.includes("interact") ? interact : cancel;
  doc.getElementById = (id) => nodes.get(id) ?? null;
  doc.createElement = element2;
  doc.querySelector = (selector) => selector === "[data-touch-controls]" ? touch : element2();
  const addEventListener = (type, fn) => events.set(type, [...events.get(type) ?? [], fn]);
  doc.addEventListener = addEventListener;
  class FakeImage {
    constructor() {
      this.complete = true;
      this.naturalWidth = 960;
      this.naturalHeight = 640;
      this.src = "";
    }
  }
  const script = page.match(/src="(dist\/home\.js)(?:\?[^"]*)?"/)[1];
  (0, import_node_vm.runInNewContext)((0, import_node_fs.readFileSync)(script, "utf8"), {
    document: doc,
    window: { addEventListener },
    addEventListener,
    location: { search, assign() {
    } },
    Image: FakeImage,
    URLSearchParams,
    structuredClone,
    console,
    localStorage: { getItem: (key2) => storage.get(key2) ?? null, setItem: (key2, value) => storage.set(key2, value) },
    performance: { now: () => now },
    requestAnimationFrame: (fn) => {
      frames.push(fn);
      return frames.length;
    },
    cancelAnimationFrame() {
    }
  });
  function frame(count = 1) {
    for (let i = 0; i < count; i++) {
      now += 16;
      const fn = frames.shift();
      (0, import_node_assert.strict)(fn);
      fn(now);
    }
  }
  function key(name, type = "keydown") {
    for (const fn of events.get(type) ?? []) fn({ key: name, repeat: false, preventDefault() {
    } });
  }
  function move(name, down, input) {
    if (input === "keyboard") key(name, down ? "keydown" : "keyup");
    else moves2.get(name).dispatch(down ? "pointerdown" : "pointerup", { pointerId: 1, preventDefault() {
    } });
  }
  frame();
  return { nodes, frame, key, move, interact, cancel, foot: () => [...foot] };
}
var map = buildFuxueMap();
var book = HOME_INTERACTIONS.find((item) => item.id === "bookcase");
function route() {
  const start = [map.spawn.x, map.spawn.y], queue = [start], parents = /* @__PURE__ */ new Map();
  parents.set(start.join(), -1);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const [x, y] = queue[cursor];
    if (Math.hypot(x - book.x, y - book.y) < 12) {
      const path = [];
      for (let i = cursor; i >= 0; i = parents.get(queue[i].join())) path.unshift(queue[i]);
      return path.filter((point, i) => i === 0 || i === path.length - 1 || point[0] - path[i - 1][0] !== path[i + 1][0] - point[0] || point[1] - path[i - 1][1] !== path[i + 1][1] - point[1]);
    }
    for (const [dx, dy] of [[4, 0], [-4, 0], [0, 4], [0, -4]]) {
      const next = [x + dx, y + dy], id = next.join();
      if (!parents.has(id) && [-2, 0, 2].every((ox) => [-2, 0, 2].every((oy) => !collides(map.map, next[0] + ox, next[1] + oy, map.w, map.h, map.obstacles, FUXUE_ACTOR_PROFILE)))) {
        parents.set(id, cursor);
        queue.push(next);
      }
    }
  }
  throw new Error("\u4E66\u67B6\u4E0D\u53EF\u8FBE\uFF0C\u8BB0\u5F55\u7A7A\u95F4\u95EE\u9898\uFF0C\u4E0D\u81EA\u52A8\u6539\u51E0\u4F55");
}
function runHomeReturn(savedJson, input, search) {
  const playtest = new URLSearchParams(search).get("playtest") === "1";
  const saveKey = playtest ? "gusu-nine-gardens-liuyuan-playtest-v1" : "gusu-nine-gardens-rpg-v1";
  const otherKey = playtest ? "gusu-nine-gardens-rpg-v1" : "gusu-nine-gardens-liuyuan-playtest-v1";
  const storage = /* @__PURE__ */ new Map([[saveKey, savedJson], [otherKey, "other-mode sentinel"]]);
  let home = boot(search, storage);
  (0, import_node_assert.strict)(home.nodes.get("homeObjective").textContent.includes("\u6838\u4E00\u6838"));
  for (const [x, y] of route().slice(1)) {
    let held = "";
    for (let i = 0; i < 800; i++) {
      const [px, py] = home.foot();
      if (Math.hypot(x - px, y - py) < 2) break;
      const name = Math.abs(x - px) >= Math.abs(y - py) ? x > px ? "d" : "a" : y > py ? "s" : "w";
      if (held !== name) {
        if (held) home.move(held, false, input);
        home.move(name, true, input);
        held = name;
      }
      home.frame();
      (0, import_node_assert.strict)(i < 799, `\u884C\u8D70\u5361\u4F4F ${home.foot()} \u2192 ${x},${y}`);
    }
    if (held) home.move(held, false, input);
  }
  (0, import_node_assert.strict)(!home.nodes.get("interactionPrompt").hidden);
  const nearFoot = home.foot();
  if (input === "keyboard") home.key("e");
  else home.interact.dispatch("pointerdown", { preventDefault() {
  } });
  import_node_assert.strict.equal(home.nodes.get("homeVariant").hidden, false, "\u672A\u62FE\u5176\u4ED6\u65E7\u4E66\u4E5F\u80FD\u76F4\u63A5\u6838\u672C");
  home.move("d", true, input);
  home.frame(25);
  import_node_assert.strict.deepEqual(home.foot(), nearFoot, "\u6838\u672C\u65F6\u51BB\u7ED3\u4E16\u754C\u884C\u8D70");
  if (input === "keyboard") {
    home.key("2");
    home.key("1");
    home.key("3");
    home.key("Escape");
  } else {
    for (const id of ["readVariantBook", "readVariantLeaf", "recordVariant", "closeVariant"]) home.nodes.get(id).click();
  }
  home.frame(10);
  import_node_assert.strict.deepEqual(home.foot(), nearFoot, "\u5173\u95ED\u5F39\u5C42\u6E05\u6389\u6309\u4F4F\u7684\u65B9\u5411\uFF0C\u4E0D\u6F02\u79FB");
  const after = JSON.parse(storage.get(saveKey));
  import_node_assert.strict.equal(after.knowledge.filter((id) => id === "liuyuan-garden-note-collated").length, 1);
  import_node_assert.strict.deepEqual(after.arts, JSON.parse(savedJson).arts, "\u6838\u672C\u4E0D\u80FD\u91CD\u53D1\u6216\u6539\u53D8\u516D\u827A");
  import_node_assert.strict.deepEqual(after.storyFlags, JSON.parse(savedJson).storyFlags, "\u5E9C\u5B66\u6838\u672C\u4E0D\u5F97\u8865\u9020\u7AE0\u8282\u6216\u5E9C\u5B66\u524D\u7F6E\u4E8B\u4EF6");
  import_node_assert.strict.equal(storage.get(otherKey), "other-mode sentinel");
  import_node_assert.strict.equal(home.nodes.get("homeJournal").href, `journal.html?chapter=1${playtest ? "&playtest=1" : ""}`);
  const beforeReload = storage.get(saveKey);
  home = boot(search, storage);
  (0, import_node_assert.strict)(!home.nodes.get("homeObjective").textContent.includes("\u6838\u4E00\u6838"), "\u5237\u65B0\u5DF2\u6838\u8BB0\u5F55\u4E0D\u518D\u50AC\u6838\u672C");
  import_node_assert.strict.equal(storage.get(saveKey), beforeReload, "\u5237\u65B0 Home \u4E0D\u91CD\u590D\u4FDD\u5B58\u6216\u5956\u52B1");
  return storage.get(saveKey);
}

// src/core/liuyuan-leaf-trace.ts
var LEAF_TRACE_PATHS = [
  [{ x: 276, y: 268 }, { x: 308, y: 268 }, { x: 308, y: 294 }, { x: 288, y: 294 }],
  [{ x: 394, y: 261 }, { x: 394, y: 235 }, { x: 424, y: 235 }, { x: 424, y: 257 }],
  [{ x: 520, y: 211 }, { x: 552, y: 211 }, { x: 552, y: 235 }]
];
function leafTraceView(index) {
  const path = LEAF_TRACE_PATHS[index];
  const xs = path.map((point) => point.x), ys = path.map((point) => point.y);
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2 - 100,
    y: (Math.min(...ys) + Math.max(...ys)) / 2 - 56.25,
    w: 200,
    h: 112.5
  };
}

// scripts/verify-liuyuan-input-smoke.ts
var import_node_fs2 = require("node:fs");
var import_node_vm2 = require("node:vm");

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
  const map2 = new Uint8Array(LIUYUAN_LVYIN_W * LIUYUAN_LVYIN_H);
  map2.fill(T.WALL);
  for (const region of regions) {
    for (let y = region.y; y < region.y + region.h; y++) for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_LVYIN_W && y < LIUYUAN_LVYIN_H) {
        map2[y * LIUYUAN_LVYIN_W + x] = region.tile;
      }
    }
  }
  return {
    map: map2,
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
  const map2 = new Uint8Array(LIUYUAN_COURT_W * LIUYUAN_COURT_H);
  map2.fill(T.WALL);
  for (const region of regions) {
    for (let y = region.y; y < region.y + region.h; y++) for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_COURT_W && y < LIUYUAN_COURT_H) {
        map2[y * LIUYUAN_COURT_W + x] = region.tile;
      }
    }
  }
  return {
    map: map2,
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
var LIUYUAN_ENTRY_QIAO_WAIT = { x: 566, y: 676 };
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
  const map2 = new Uint8Array(LIUYUAN_ENTRY_W * LIUYUAN_ENTRY_H);
  map2.fill(T.WALL);
  for (const region of regions) {
    for (let y = region.y; y < region.y + region.h; y++) {
      for (let x = region.x; x < region.x + region.w; x++) {
        if (x >= 0 && y >= 0 && x < LIUYUAN_ENTRY_W && y < LIUYUAN_ENTRY_H) {
          map2[y * LIUYUAN_ENTRY_W + x] = region.tile;
        }
      }
    }
  }
  return { map: map2, w: LIUYUAN_ENTRY_W, h: LIUYUAN_ENTRY_H, spawn: { ...LIUYUAN_ENTRY_SPAWN } };
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
  const map2 = new Uint8Array(LIUYUAN_STUDY_COURT_W * LIUYUAN_STUDY_COURT_H);
  map2.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_STUDY_COURT_W && y < LIUYUAN_STUDY_COURT_H) {
        map2[y * LIUYUAN_STUDY_COURT_W + x] = region.tile;
      }
    }
  }
  return {
    map: map2,
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
  const map2 = new Uint8Array(LIUYUAN_STONE_FOREST_W * LIUYUAN_STONE_FOREST_H);
  map2.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_STONE_FOREST_W && y < LIUYUAN_STONE_FOREST_H) {
        map2[y * LIUYUAN_STONE_FOREST_W + x] = region.tile;
      }
    }
  }
  return {
    map: map2,
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
  const map2 = new Uint8Array(LIUYUAN_EAST_HALL_W * LIUYUAN_EAST_HALL_H);
  map2.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) for (let x = region.x; x < region.x + region.w; x++) {
    if (x >= 0 && y >= 0 && x < LIUYUAN_EAST_HALL_W && y < LIUYUAN_EAST_HALL_H) map2[y * LIUYUAN_EAST_HALL_W + x] = region.tile;
  }
  return {
    map: map2,
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
  const map2 = new Uint8Array(LIUYUAN_FLOWER_W * LIUYUAN_FLOWER_H);
  map2.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_FLOWER_W && y < LIUYUAN_FLOWER_H) {
        map2[y * LIUYUAN_FLOWER_W + x] = region.tile;
      }
    }
  }
  return {
    map: map2,
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
  const map2 = new Uint8Array(LIUYUAN_STUDY_INTERIOR_W * LIUYUAN_STUDY_INTERIOR_H);
  map2.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_STUDY_INTERIOR_W && y < LIUYUAN_STUDY_INTERIOR_H) {
        map2[y * LIUYUAN_STUDY_INTERIOR_W + x] = region.tile;
      }
    }
  }
  return {
    map: map2,
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

// src/core/liuyuan-rain-shadow.ts
var RAIN_FIELD = { width: 320, height: 208, left: 24, right: 296, top: 32, bottom: 184 };
var RAIN_ROUND_SECONDS = 7;
var RAIN_ROUND_NAMES = [
  "\u4E00\u6298 \xB7 \u732B\u62E8\u753B\u7A3F",
  "\u4E8C\u6298 \xB7 \u96E8\u4ECE\u4FA7\u6765",
  "\u4E09\u6298 \xB7 \u56DE\u8EAB\u6709\u8DEF",
  "\u56DB\u6298 \xB7 \u96E8\u4ECE\u540E\u81F3",
  "\u4E94\u6298 \xB7 \u4FA7\u96E8\u6362\u5411",
  "\u516D\u6298 \xB7 \u7A7F\u8FC7\u659C\u96E8"
];
var RAIN_ROUND_COUNT = RAIN_ROUND_NAMES.length;
var STORY_RAIN_STAGES = [
  { start: 0, name: "\u8FA8\u96E8", tip: "\u5148\u770B\u7AD6\u5411\u96E8\u7F1D\uFF0C\u4E0B\u4E00\u9635\u4EAE\u5904\u4F1A\u6362\u8FB9\u3002" },
  { start: 5.5, name: "\u6362\u5411", tip: "\u96E8\u4ECE\u4FA7\u9762\u6765\u4E86\uFF0C\u6539\u770B\u96E8\u7F1D\u7684\u9AD8\u4F4E\u3002" },
  { start: 10.75, name: "\u4EA4\u96E8", tip: "\u7EB5\u6A2A\u96E8\u52BF\u4EA4\u9519\uFF0C\u5148\u987E\u5C06\u8FD1\u7684\u4E00\u9635\uFF0C\u7D27\u5904\u518D\u62A4\u753B\u3002" }
];
var STORY_RAIN_WAVES = [
  { at: 0.45, axis: "y", gap: 78, stage: 0 },
  { at: 3, axis: "y", gap: 220, stage: 0 },
  { at: 5.5, axis: "x", gap: 76, stage: 1 },
  { at: 8.1, axis: "x", gap: 146, stage: 1 },
  { at: 10.75, axis: "y", gap: 104, stage: 2 },
  { at: 12.45, axis: "x", gap: 64, stage: 2 },
  { at: 14, axis: "y", gap: 236, stage: 2 },
  { at: 15.4, axis: "x", gap: 144, stage: 2 }
];
var STORY_RAIN_BEATS = STORY_RAIN_WAVES.map((wave) => wave.at);
var STORY_CAT_BEATS = [2.4, 6.65, 9.45, 12.8, 15.9];
function rainCatDuration(cat) {
  return Math.hypot(cat.toX - cat.fromX, cat.toY - cat.fromY) / cat.speed;
}
function rainCatPosition(cat) {
  const t = Math.max(0, Math.min(1, (cat.age - cat.warning) / rainCatDuration(cat)));
  return { x: cat.fromX + (cat.toX - cat.fromX) * t, y: cat.fromY + (cat.toY - cat.fromY) * t };
}
function rainCatHits(cat, x, y) {
  if (cat.age < cat.warning || cat.age >= cat.warning + rainCatDuration(cat)) return false;
  const p = rainCatPosition(cat);
  return Math.hypot(x - p.x, y - p.y) <= 8;
}
function rainStoryStage(s) {
  return s.rainTime >= STORY_RAIN_STAGES[2].start ? 2 : s.rainTime >= STORY_RAIN_STAGES[1].start ? 1 : 0;
}
var WINDOWS = [
  { x: 78, y: 128 },
  { x: 239, y: 76 },
  { x: 105, y: 65 },
  { x: 236, y: 140 },
  { x: 92, y: 105 },
  { x: 218, y: 64 }
];
function rainWindow(state) {
  return WINDOWS[Math.max(0, Math.min(RAIN_ROUND_COUNT - 1, state.round))];
}
function rainPickupSeconds(state) {
  return state.gentle ? 6 : 4;
}
var rainDuration = (state) => state.story ? 18 : RAIN_ROUND_SECONDS;
var rainRoundCount = (state) => state.story ? 1 : RAIN_ROUND_COUNT;
var rainHealthCapacity = (state) => state.story ? 3 : state.gentle ? 7 : 5;
var rainHitGrace = (state) => state.story ? 0.6 : 0.85;
function createRainShadow(gentle = false, story = false) {
  const health = rainHealthCapacity({ story, gentle });
  return {
    story,
    phase: "ready",
    round: 0,
    time: 0,
    rainTime: 0,
    total: 0,
    health,
    x: 160,
    y: 157,
    collected: false,
    marks: 0,
    hits: 0,
    shield: 0,
    cooldown: 0,
    invulnerable: 0,
    nextBand: 0,
    bands: [],
    cat: null,
    nextCat: 0,
    catHits: 0,
    lastHit: "",
    gentle,
    result: "",
    direction: 0,
    moving: false,
    roundStart: { x: 160, y: 157, health, hits: 0 }
  };
}
function startRainShadow(state) {
  if (state.phase === "ready") state.phase = "running";
}
function guardRainShadow(state) {
  if (state.phase === "running" && state.cooldown === 0) {
    state.shield = 0.6;
    state.cooldown = 2;
  }
}
function bandPosition(band) {
  return band.from + band.sign * Math.max(0, band.age - band.warning) * band.speed;
}
function rainBandLifetime(band) {
  if (band.speed <= 0) return Infinity;
  const end = band.axis === "y" ? band.sign > 0 ? RAIN_FIELD.bottom + 16 : RAIN_FIELD.top - 16 : band.sign > 0 ? RAIN_FIELD.right + 16 : RAIN_FIELD.left - 16;
  return band.warning + Math.abs(end - band.from) / band.speed;
}
function rainBandHits(band, x, y) {
  if (band.age < band.warning) return false;
  const along = band.axis === "y" ? y : x;
  const across = band.axis === "y" ? x : y;
  return Math.abs(along - bandPosition(band)) <= 9 && Math.abs(across - band.gap) > band.opening / 2 - 3;
}
function makeBand(state, index) {
  if (state.story) {
    const wave = STORY_RAIN_WAVES[index];
    const { axis: axis2, gap: gap2, stage } = wave;
    const sign2 = index % 2 ? -1 : 1;
    return {
      axis: axis2,
      sign: sign2,
      from: axis2 === "y" ? sign2 > 0 ? 20 : 196 : sign2 > 0 ? 12 : 308,
      gap: gap2,
      age: 0,
      opening: (state.gentle ? [104, 88, 72] : [84, 66, 50])[stage],
      warning: (state.gentle ? [1.6, 1.35, 1.2] : [1.35, 1.1, 0.95])[stage],
      speed: (state.gentle ? [70, 84, 96] : [82, 100, 116])[stage]
    };
  }
  const axis = state.round === 0 || state.round === 3 ? "y" : state.round === 1 || state.round === 4 ? "x" : index % 2 ? "x" : "y";
  const sign = (index % 2 ? -1 : 1) * (state.round >= 3 ? -1 : 1);
  const shift = state.round >= 3 ? 1 : 0;
  const gap = axis === "y" ? [78, 239, 105, 220][(index + shift) % 4] : [128, 76, 145, 65][(index + shift) % 4];
  return {
    axis,
    sign,
    from: axis === "y" ? sign > 0 ? 20 : 196 : sign > 0 ? 12 : 308,
    gap,
    opening: state.gentle ? 76 : state.round === 0 ? 70 : state.round === 5 ? 48 : 62,
    warning: state.gentle || state.round === 0 ? 1.25 : 0.95,
    age: 0,
    speed: state.gentle ? 76 : state.round === 0 ? 88 : state.round === 5 ? 116 : 96
  };
}
function step(state, dt, input) {
  state.time += dt;
  state.total += dt;
  state.cooldown = Math.max(0, state.cooldown - dt);
  state.shield = Math.max(0, state.shield - dt);
  state.invulnerable = Math.max(0, state.invulnerable - dt);
  if (input.guard) guardRainShadow(state);
  let dx = input.x, dy = input.y;
  if (input.target) {
    dx = input.target.x - state.x;
    dy = input.target.y - state.y;
  }
  const length = Math.hypot(dx, dy);
  state.moving = length > 0.1;
  if (length) {
    state.direction = dy > 0 ? 0 : dy < 0 ? 3 : dx > 0 ? 2 : 1;
    const distance = (state.shield > 0 ? 62 : 108) * dt;
    const amount = input.target ? Math.min(distance, length) : distance;
    state.x += dx / length * amount;
    state.y += dy / length * amount;
  }
  state.x = Math.max(RAIN_FIELD.left + 4, Math.min(RAIN_FIELD.right - 4, state.x));
  state.y = Math.max(RAIN_FIELD.top + 4, Math.min(RAIN_FIELD.bottom - 4, state.y));
  const light = rainWindow(state);
  if (!state.collected) {
    if (state.time >= 0.7 && Math.hypot(state.x - light.x, state.y - light.y) <= 13) {
      state.collected = true;
      state.marks++;
      state.rainTime = 0;
    } else {
      if (state.time >= rainPickupSeconds(state)) {
        state.phase = "lost";
        state.result = "\u732B\u62E8\u843D\u7684\u753B\u7A3F\u8FD8\u5728\u5730\u4E0A\u3002\u8D70\u5230\u91D1\u8272\u753B\u7A3F\u5904\uFF0C\u5C31\u4F1A\u81EA\u52A8\u6361\u8D77\u3002";
      }
      return;
    }
  }
  state.rainTime += dt;
  const beats = state.story ? STORY_RAIN_BEATS : state.round === 2 || state.round === 5 ? [0.35, 1.9, 3.45, 4.8] : [0.35, 2.5, 4.65];
  while (state.nextBand < beats.length && state.rainTime >= beats[state.nextBand]) {
    state.bands.push(makeBand(state, state.nextBand));
    state.nextBand++;
  }
  for (const band of state.bands) band.age += dt;
  state.bands = state.bands.filter((band) => band.age < rainBandLifetime(band));
  if (state.story && state.nextCat < STORY_CAT_BEATS.length && state.rainTime >= STORY_CAT_BEATS[state.nextCat]) {
    const band = state.bands.find((b) => b.age < b.warning) ?? state.bands[state.bands.length - 1];
    const horizontal = !band || band.axis === "y";
    const stage = rainStoryStage(state);
    state.cat = {
      fromX: horizontal ? state.x < 160 ? 30 : 290 : state.x,
      fromY: horizontal ? state.y : state.y < 108 ? 38 : 178,
      toX: state.x,
      toY: state.y,
      age: 0,
      warning: (state.gentle ? [1.5, 1.35, 1.25] : [1.15, 1, 0.9])[stage],
      speed: (state.gentle ? [120, 135, 145] : [155, 175, 190])[stage]
    };
    if (Math.hypot(state.cat.toX - state.cat.fromX, state.cat.toY - state.cat.fromY) < 24) {
      if (horizontal) state.cat.fromX = state.x < 160 ? state.x + 24 : state.x - 24;
      else state.cat.fromY = state.y < 108 ? state.y + 24 : state.y - 24;
    }
    state.nextCat++;
  }
  if (state.cat) {
    state.cat.age += dt;
    if (state.cat.age >= state.cat.warning + rainCatDuration(state.cat) + 0.5) state.cat = null;
  }
  const catHit = !!state.cat && rainCatHits(state.cat, state.x, state.y);
  const rainHit = state.shield === 0 && state.bands.some((band) => rainBandHits(band, state.x, state.y));
  if (state.invulnerable === 0 && (catHit || rainHit)) {
    state.health--;
    state.hits++;
    state.invulnerable = rainHitGrace(state);
    state.lastHit = catHit ? "cat" : "rain";
    if (catHit) state.catHits++;
  }
  if (state.health <= 0) {
    state.phase = "lost";
    state.result = state.lastHit === "cat" ? "HP 0/3 \xB7 \u732B\u6251\u4E2D\u4E86\u3002\u56DE\u6A90\u4E0B\u7F13\u4E00\u7F13\uFF0C\u518D\u770B\u5B83\u4F0F\u8EAB\u7684\u6251\u5411\uFF0C\u4FA7\u79FB\u8BA9\u5F00\uFF1B\u62A4\u753B\u4E0D\u80FD\u6321\u732B\u3002" : state.story ? "HP 0/3 \xB7 \u6DCB\u96E8\u5931\u624B\u4E86\u3002\u56DE\u6A90\u4E0B\u7F13\u4E00\u7F13\uFF0C\u770B\u51C6\u96E8\u7F1D\uFF0C\u518D\u6765\u4E00\u56DE\u3002" : "\u96E8\u70B9\u6D78\u6E7F\u4E86\u7EB8\u89D2\u3002\u770B\u51C6\u9884\u544A\u7684\u7F3A\u53E3\uFF0C\u518D\u6765\u4E00\u56DE\u3002";
    return;
  }
  if (state.rainTime >= rainDuration(state)) {
    if (state.round === rainRoundCount(state) - 1) {
      state.phase = "won";
      state.result = `${state.story ? "\u753B\u7A3F\u62A2\u56DE\u4E86" : "\u516D\u9875\u753B\u7A3F\u90FD\u62FE\u56DE\u4E86"}\u3002${state.hits === 0 ? "\u7EB8\u89D2\u5B8C\u597D" : "\u7EB8\u89D2\u7565\u4E71\uFF0C\u753B\u610F\u8FD8\u5728"}\u3002\u732B\u8E72\u5728\u6A90\u4E0B\uFF0C\u50CF\u662F\u4EC0\u4E48\u4E5F\u6CA1\u505A\u3002`;
      return;
    }
    state.round++;
    state.time = 0;
    state.rainTime = 0;
    state.collected = false;
    state.nextBand = 0;
    state.bands = [];
    state.invulnerable = 0.6;
    state.roundStart = { x: state.x, y: state.y, health: state.health, hits: state.hits };
  }
}
function updateRainShadow(state, seconds, input) {
  if (state.phase !== "running" || !Number.isFinite(seconds) || seconds <= 0) return;
  let remaining = Math.min(0.1, seconds);
  while (remaining > 0 && state.phase === "running") {
    const dt = Math.min(1 / 120, remaining);
    step(state, dt, input);
    remaining -= dt;
  }
}

// scripts/rain-shadow-test-input.ts
function rainTestInput(s) {
  const target = s.collected ? { x: s.x, y: s.y } : rainWindow(s);
  if (s.collected) for (const axis of ["x", "y"]) {
    const band = s.bands.find((b) => b.axis === axis && (b.age < b.warning || b.sign * (bandPosition(b) - (axis === "y" ? s.y : s.x)) <= 9));
    if (band) {
      if (axis === "y") target.x = band.gap;
      else target.y = band.gap;
    }
  }
  if (s.cat && s.cat.age < s.cat.warning + rainCatDuration(s.cat)) {
    if (s.cat.fromX !== s.cat.toX) target.y = s.cat.toY + (s.cat.toY > 108 ? -22 : 22);
    else target.x = s.cat.toX + (s.cat.toX > 160 ? -22 : 22);
  }
  return {
    x: 0,
    y: 0,
    target,
    guard: s.bands.some((b) => b.age >= b.warning && rainBandHits(b, s.x, s.y))
  };
}

// scripts/verify-liuyuan-input-smoke.ts
function assert2(value, message) {
  if (!value) throw new Error(message);
}
var clipCalls = 0;
var bucketDraws = [];
var qiaoDraws = [];
var seatedDraws = [];
var context2d = new Proxy({}, { get: (target, property) => property === "fillRect" ? (x, y, w, h) => {
  if (target.fillStyle === "#3c3830") bucketDraws.push({ x: x + w / 2, y: y + h - 1 });
} : property === "measureText" ? () => ({ width: 0 }) : property === "clip" ? () => {
  clipCalls++;
} : property === "drawImage" ? (source, ...args) => {
  if (source.src?.includes("qiao-he-sprites")) qiaoDraws.push({ x: args[4] + args[6] / 2, y: args[5] + args[7] });
  if (source.src?.includes("liuyuan-gate-npcs")) seatedDraws.push({ role: args[0] === 200 ? "elder" : "gate", x: args[4] + args[6] / 2, y: args[5] + args[7] });
} : () => void 0 });
function element() {
  const handlers = /* @__PURE__ */ new Map();
  const attributes = /* @__PURE__ */ new Map();
  const target = {
    classList: { toggle() {
    } },
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
    getBoundingClientRect: () => target.width === 1280 && target.height === 720 ? { left: 0, top: 0, width: 1280 / 3, height: 720 / 3 } : { left: 0, top: 0, width: 320, height: 208 },
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
function boot2(page2, search, flagCount = search.includes("return=1") ? 14 : 13, initialProgressJson, draftRecord, readyImages = false, sessionRecords = {}) {
  const html = (0, import_node_fs2.readFileSync)(`${page2}.html`, "utf8");
  if ([
    "liuyuan-flower",
    "liuyuan-east-hall",
    "liuyuan-stone-forest",
    "liuyuan-study-court",
    "liuyuan-study-interior"
  ].includes(page2)) {
    const stageStart = html.indexOf('<div class="stage">');
    const hudStart = html.indexOf('<div class="hud">', stageStart);
    assert2(stageStart >= 0 && hudStart > stageStart, `${page2} \u7F3A\u5C11\u53EF\u89C1\u573A\u666F\u5BB9\u5668`);
    const stage = html.slice(stageStart, hudStart);
    const inStage = page2 === "liuyuan-flower" ? ["dialogueActions", "leafCarryActions", "borrowAlbum", "continueChapter", "toLvyinReturn"] : page2 === "liuyuan-east-hall" ? ["continueChapter", "toFlowerReturn"] : page2 === "liuyuan-stone-forest" ? ["toStudyCourt", "toEastHallReturn"] : page2 === "liuyuan-study-court" ? ["doorActions", "interiorResearch", "toStoneReturn"] : ["answerChoices", "paperChoices", "leafResearchLink"];
    for (const id of inStage) assert2(stage.includes(`id="${id}"`), `${page2} \u7684 ${id} \u5FC5\u987B\u7559\u5728\u573A\u666F\u5185`);
  }
  const script = html.match(/<script src="(dist\/[^\"]+\.js)(?:\?[^\"]+)?"/);
  assert2(script, `${page2} \u672A\u5F15\u7528\u6B63\u5F0F\u811A\u672C`);
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
  const rainDirections = /* @__PURE__ */ new Map();
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
  for (const match of html.matchAll(/<button\b[^>]*\bdata-rain-dir="([^"]+)"[^>]*>/g)) {
    const button = element();
    button.dataset.rainDir = match[1];
    rainDirections.set(match[1], button);
  }
  if (page2 !== "liuyuan-leaf-writing-study" && page2 !== "journal")
    assert2(directions.size === 4, `${page2} \u7F3A\u5C11\u56DB\u4E2A\u89E6\u5C4F\u65B9\u5411\u952E`);
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
      }
      return nodes[id];
    },
    createElement: () => element(),
    querySelectorAll: (selector) => selector === "[data-dir]" ? [...directions.values()] : selector === "[data-rain-dir]" ? [...rainDirections.values()] : selector === "[data-leaf-action]" ? [...leafActions.values()] : selector === "[data-stroke]" ? [...leafStrokes.values()] : []
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
  (0, import_node_vm2.runInNewContext)((0, import_node_fs2.readFileSync)(script[1], "utf8"), {
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
  }, { filename: `${page2}${search}` });
  if (search.includes("return=1")) {
    const returnCopy = page2 === "liuyuan-entry" ? nodes.modeTitle?.textContent : nodes.routeNotice?.textContent;
    assert2(returnCopy && /(出园|回|返程)/.test(returnCopy), `${page2} \u672A\u8FDB\u5165\u6B63\u5F0F\u8FD4\u7A0B\u6A21\u5F0F`);
  }
  const geometryToggle = nodes.showTiles ?? nodes.showGeometry;
  if (page2 !== "liuyuan-leaf-writing-study" && page2 !== "journal")
    assert2(geometryToggle && nodes.coords, `${page2} \u7F3A\u5C11\u8C03\u8BD5\u811A\u70B9`);
  let now = 0;
  function frame() {
    now += 16;
    qiaoDraws.length = 0;
    seatedDraws.length = 0;
    bucketDraws.length = 0;
    const callback = frames.shift();
    assert2(callback, `${page2} \u52A8\u753B\u5E27\u4E2D\u65AD`);
    callback(now);
  }
  function foot() {
    assert2(geometryToggle, `${page2} \u6CA1\u6709\u5730\u9762\u811A\u70B9`);
    geometryToggle.checked = true;
    frame();
    geometryToggle.checked = false;
    const match = nodes.coords.textContent.match(/(?:脚点|鞋底) \((\d+), (\d+)\)/);
    assert2(match, `${page2} \u672A\u8F93\u51FA\u811A\u70B9\u5750\u6807`);
    return [Number(match[1]), Number(match[2])];
  }
  function key(type, direction) {
    const name = { up: "ArrowUp", left: "ArrowLeft", down: "ArrowDown", right: "ArrowRight" }[direction];
    for (const handler of windowEvents.get(type) ?? []) handler({ key: name, repeat: false, preventDefault() {
    } });
  }
  function rawKey(name, type = "keydown") {
    for (const handler of windowEvents.get(type) ?? []) handler({ key: name, repeat: false, preventDefault() {
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
    qiaoDraws: () => qiaoDraws.slice(),
    seatedDraws: () => seatedDraws.slice(),
    bucketDraws: () => bucketDraws.slice(),
    key,
    rawKey,
    pointer,
    blur,
    pagehide,
    sessionRecords,
    nodes,
    leafActions,
    leafStrokes,
    rainDirections,
    assignedUrl: () => assignedUrl,
    savedProgress: () => progressJson,
    storyFlags: () => JSON.parse(progressJson).storyFlags
  };
}
var moves = [];
for (const [page2, search] of [...pages, ...returnPages]) {
  let usableDirections = 0;
  for (const direction of ["up", "left", "down", "right"]) {
    const keyboard = boot2(page2, search);
    const touch = boot2(page2, search);
    const startKey = keyboard.foot();
    const startTouch = touch.foot();
    assert2(startKey.join() === startTouch.join(), `${page2} \u4E24\u79CD\u8F93\u5165\u51FA\u751F\u70B9\u4E0D\u540C`);
    keyboard.key("keydown", direction);
    touch.pointer("pointerdown", direction);
    for (let i = 0; i < 8; i++) {
      keyboard.frame();
      touch.frame();
    }
    const endKey = keyboard.foot();
    const endTouch = touch.foot();
    assert2(endKey.join() === endTouch.join(), `${page2} ${direction} \u952E\u76D8/\u89E6\u5C4F\u811A\u70B9\u4E0D\u4E00\u81F4`);
    if (endKey.join() !== startKey.join()) usableDirections++;
    keyboard.key("keyup", direction);
    touch.pointer("pointerup", direction);
    for (let i = 0; i < 3; i++) {
      keyboard.frame();
      touch.frame();
    }
    assert2(keyboard.foot().join() === endKey.join(), `${page2} ${direction} \u677E\u952E\u540E\u4ECD\u5728\u884C\u8D70`);
    assert2(touch.foot().join() === endTouch.join(), `${page2} ${direction} \u677E\u5F00\u89E6\u5C4F\u952E\u540E\u4ECD\u5728\u884C\u8D70`);
    keyboard.key("keydown", direction);
    touch.pointer("pointerdown", direction);
    keyboard.blur();
    touch.blur();
    keyboard.frame();
    touch.frame();
    assert2(keyboard.foot().join() === endKey.join(), `${page2} \u5931\u7126\u540E\u952E\u76D8\u4ECD\u5728\u884C\u8D70`);
    assert2(touch.foot().join() === endTouch.join(), `${page2} \u5931\u7126\u540E\u89E6\u5C4F\u4ECD\u5728\u884C\u8D70`);
  }
  assert2(usableDirections > 0, `${page2} \u51FA\u751F\u70B9\u56DB\u65B9\u5411\u5747\u65E0\u6CD5\u79FB\u52A8`);
  moves.push(`${page2}${search.includes("return=1") ? "\u8FD4" : "\u8FDB"}: ${usableDirections}/4`);
}
console.log(`\u7559\u56ED\u516B\u5E55\u6B63\u5411\u4E0E\u4E03\u5E55\u8FD4\u7A0B\uFF1A\u952E\u76D8/\u89E6\u5C4F\u8FDE\u7EED\u79FB\u52A8\u3001\u677E\u5F00\u4E0E\u5931\u7126\u6A21\u62DF\u901A\u8FC7\uFF1B\u51FA\u751F\u70B9\u53EF\u8D70\u65B9\u5411 ${moves.join("\uFF0C")}\u3002`);
for (const input of ["keyboard", "touch"]) {
  const oblique = boot2("liuyuan-entry-oblique-study", "?draft=1");
  const start = oblique.foot();
  assert2(start.join() === "770,915", "\u659C\u4FEF\u89C6\u9996\u955C\u5934\u51FA\u751F\u811A\u70B9\u5E94\u5728\u95E8\u5916\u77F3\u8DEF");
  if (input === "keyboard") oblique.key("keydown", "up");
  else oblique.pointer("pointerdown", "up");
  for (let i = 0; i < 12; i++) oblique.frame();
  const after = oblique.foot();
  assert2(after[1] < start[1] && after[0] === start[0], `\u659C\u4FEF\u89C6\u9996\u955C\u5934${input}\u79FB\u52A8\u5E94\u6CBF\u95E8\u5916\u77F3\u8DEF\u5411\u95E8\u69DB`);
  if (input === "keyboard") oblique.key("keyup", "up");
  else oblique.pointer("pointerup", "up");
  for (let i = 0; i < 3; i++) oblique.frame();
  assert2(oblique.foot().join() === after.join(), `\u659C\u4FEF\u89C6\u9996\u955C\u5934${input}\u677E\u5F00\u540E\u5E94\u505C\u6B65`);
  oblique.nodes.look.click();
  assert2(oblique.nodes.status.textContent.includes("\u77F3\u5730"), "\u9996\u955C\u5934\u89C2\u5BDF\u5E94\u7ED9\u573A\u9762\u53CD\u9988\uFF0C\u4E0D\u5199\u7AE0\u8282\u72B6\u6001");
}
console.log("\u7559\u56ED\u659C\u4FEF\u89C6\u5165\u53E3\u9996\u955C\u5934: \u72EC\u7ACB\u9875\u9762\u952E\u76D8/\u89E6\u5C4F\u79FB\u52A8\u3001\u505C\u6B65\u548C\u89C2\u5BDF\u6A21\u62DF\u901A\u8FC7\uFF1B\u4E0D\u8BA1 CH3 \u6574\u7AE0\u3002");
for (const input of ["keyboard", "touch"]) {
  const lvyinPixel = boot2("liuyuan-lvyin", "?artStudy=pixel-v2&draft=1", 0, void 0, true);
  assert2(
    lvyinPixel.nodes.sceneBadge.textContent.includes("\u4E0D\u5199 CH3"),
    "\u50CF\u7D20\u4E34\u6C60\u7814\u7A76\u9875\u5FC5\u987B\u660E\u786E\u9694\u79BB\u7AE0\u6D41"
  );
  assert2(
    lvyinPixel.nodes.returnCourt.hidden,
    "\u50CF\u7D20\u4E34\u6C60\u7814\u7A76\u9875\u4E0D\u5E94\u8BEF\u5BFC\u8DF3\u56DE\u6B63\u5F0F\u5C0F\u5EAD"
  );
  assert2(
    lvyinPixel.nodes.editorLink.href.includes("liuyuan-lvyin-pond-pixel-study-v2"),
    "\u50CF\u7D20\u4E34\u6C60\u7814\u7A76\u9875\u987B\u94FE\u63A5\u72EC\u7ACB\u7F16\u8F91\u5668 ID"
  );
  const start = lvyinPixel.foot();
  if (input === "keyboard") lvyinPixel.key("keydown", "left");
  else lvyinPixel.pointer("pointerdown", "left");
  for (let i = 0; i < 12; i++) lvyinPixel.frame();
  const after = lvyinPixel.foot();
  assert2(after[0] < start[0], `\u50CF\u7D20\u4E34\u6C60${input}\u6CBF\u5CB8\u5E94\u53EF\u5411\u897F\u884C\u8D70`);
  if (input === "keyboard") lvyinPixel.key("keyup", "left");
  else lvyinPixel.pointer("pointerup", "left");
  for (let i = 0; i < 3; i++) lvyinPixel.frame();
  assert2(lvyinPixel.foot().join() === after.join(), `\u50CF\u7D20\u4E34\u6C60${input}\u677E\u5F00\u5E94\u505C\u6B65`);
  assert2(
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
      assert2(couldBeValidFoot, `${label} \u811A\u70B9\u8FDB\u5165\u6C34\u9762\u3001\u5B9E\u4F53\u6216\u975E\u94FA\u5730\u533A\uFF1A${next.join()}`);
      stagnant = next.join() === last.join() ? stagnant + 1 : 0;
      assert2(stagnant < 12, `${label} \u884C\u8D70\u5728 (${next.join()}) \u5361\u4F4F`);
      last = next;
    }
    for (const direction of [...held]) setHeld(direction, false);
    assert2(
      Math.hypot(last[0] - x, last[1] - y) < radius,
      `${label} \u672A\u8D70\u5230\u76EE\u6807\u811A\u70B9\uFF1A\u505C\u5728 (${last.join()})\uFF0C\u76EE\u6807 (${x},${y})`
    );
  }
}
for (const input of ["keyboard", "touch"]) {
  const entry = boot2("liuyuan-flower", "?chapter=1&playtest=1", 6);
  walkWaypoints(entry, input, [["\u5170\u76C6\u65C1\u53D1\u73B0\u753B\u7A3F", 650, 485, 26]], buildLiuyuanFlowerStudyMap());
  assert2(!entry.nodes.helpDrawing.hidden, "\u4EA4\u7CA5\u540E\u9760\u8FD1\u5170\u76C6\u5E94\u80FD\u53D1\u73B0\u53EF\u9009\u62A2\u753B");
  const lanternSave = entry.savedProgress();
  assert2(entry.nodes.interactionCue.textContent.includes("\u5170\u7A3F"), "\u5170\u7A3F\u63D0\u793A\u5E94\u4E0E\u6700\u8FD1\u4EA4\u4E92\u76EE\u6807\u4E00\u81F4");
  if (input === "keyboard") entry.rawKey("e");
  else entry.nodes.helpDrawing.click();
  assert2(!entry.nodes.lanternPuzzle.hidden, "\u62A2\u753B\u6253\u5F00\u73B0\u573A\u4E8B\u4EF6");
  const still = entry.foot();
  entry.rawKey("ArrowUp");
  entry.frame();
  entry.key("keyup", "up");
  assert2(entry.foot().join() === still.join(), "\u5C0F\u6E38\u620F\u65B9\u5411\u952E\u4E0D\u5E94\u63A8\u52A8\u771F\u5B9E\u89D2\u8272\u7A7F\u95E8");
  if (input === "keyboard") entry.rawKey("Enter");
  else entry.nodes.rainAction.click();
  entry.blur();
  for (let i = 0; i < 700; i++) entry.frame();
  assert2(entry.nodes.rainAction.textContent === "\u7EE7\u7EED\u62A2\u753B", "\u5207\u9875\u5E94\u6682\u505C\uFF0C\u4E0D\u53EF\u540E\u53F0\u53D7\u635F");
  const pausedRainHUD = entry.nodes.rainHud.textContent;
  entry.nodes.rainQuiet.checked = true;
  entry.nodes.rainQuiet.dispatch("change");
  assert2(
    entry.nodes.rainHud.textContent === pausedRainHUD && entry.nodes.rainAction.textContent === "\u7EE7\u7EED\u62A2\u753B",
    "\u5207\u6362\u5C11\u52A8\u6548\u53EA\u80FD\u91CD\u7ED8\uFF0C\u4E0D\u80FD\u6062\u590D\u8BA1\u65F6\u6216\u6539\u53D8\u6682\u505C\u72B6\u6001"
  );
  entry.nodes.rainSound.checked = true;
  entry.nodes.rainSound.dispatch("change");
  entry.nodes.rainSound.checked = false;
  entry.nodes.rainSound.dispatch("change");
  assert2(
    entry.nodes.rainHud.textContent === pausedRainHUD && entry.nodes.rainAction.textContent === "\u7EE7\u7EED\u62A2\u753B",
    "\u5F00\u5173\u97F3\u6548\u4E0D\u80FD\u6062\u590D\u6682\u505C\u3001\u91CD\u7F6EHP/\u56DE\u6C14\u6216\u8F93\u5165"
  );
  entry.nodes.rainAction.click();
  for (let i = 0; i < 600; i++) entry.frame();
  assert2(
    entry.nodes.rainAction.textContent === "\u518D\u8BD5\u4E00\u56DE" && !entry.storyFlags().includes("ly-rain-shadow-cleared") && entry.savedProgress() === lanternSave,
    "\u539F\u5730\u7B49\u5F85\u5931\u8D25\u3001\u5931\u8D25\u4E0D\u6539\u7AE0\u8FDB\u5EA6"
  );
  entry.nodes.rainAction.click();
  assert2(entry.nodes.rainAction.textContent === "\u6B63\u5728\u62A4\u753B", "\u5931\u8D25\u540E\u53EF\u5373\u65F6\u91CD\u65B0\u5F00\u59CB");
  const model = createRainShadow(false, true);
  startRainShadow(model);
  const visibleRainStages = /* @__PURE__ */ new Set();
  for (let frame = 0; frame < 3500 && model.phase === "running"; frame++) {
    const command = rainTestInput(model);
    const dx = Math.abs(command.target.x - model.x) > 1.4 ? Math.sign(command.target.x - model.x) : 0;
    const dy = Math.abs(command.target.y - model.y) > 1.4 ? Math.sign(command.target.y - model.y) : 0;
    for (const [dir, active] of [["left", dx < 0], ["right", dx > 0], ["up", dy < 0], ["down", dy > 0]]) {
      if (input === "keyboard") {
        entry.key(active ? "keydown" : "keyup", dir);
        if (active) {
          const alias = { left: "a", right: "d", up: "w", down: "s" }[dir];
          entry.rawKey(alias);
          entry.rawKey(alias, "keyup");
        }
      } else {
        const button = entry.rainDirections.get(dir);
        button.dispatch(active ? "pointerdown" : "pointerup", { pointerId: 1, preventDefault() {
        } });
        if (active) {
          button.dispatch("pointerdown", { pointerId: 9, preventDefault() {
          } });
          for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
            button.dispatch(type, { pointerId: 9 });
        }
      }
    }
    entry.nodes.rainGuard.dispatch(command.guard ? "pointerdown" : "pointerup", { pointerId: 2, preventDefault() {
    } });
    entry.frame();
    const visibleStage = entry.nodes.rainHud.textContent.match(/[123]\/3 (辨雨|换向|交雨)/);
    if (visibleStage) visibleRainStages.add(visibleStage[1]);
    updateRainShadow(model, 0.016, { x: dx, y: dy, guard: command.guard });
    if (frame === 100) {
      entry.nodes.rainQuiet.checked = false;
      entry.nodes.rainQuiet.dispatch("change");
    }
    if (frame === 120) {
      const hud = entry.nodes.rainHud.textContent;
      entry.nodes.rainSound.checked = false;
      entry.nodes.rainSound.dispatch("change");
      assert2(entry.nodes.rainHud.textContent === hud, "\u5173\u97F3\u6548\u4E0D\u80FD\u989D\u5916\u63A8\u8FDB\u6216\u91CD\u7F6E\u6A21\u62DF");
    }
  }
  assert2(
    model.phase === "won" && entry.nodes.rainHud.textContent.includes(`\u62FE\u56DE 1/1`),
    `\u6BCF\u6298\u987B\u771F\u5B9E\u79FB\u52A8\u5230\u7A97\u5F71\uFF1A${entry.nodes.rainHud.textContent} / ${entry.nodes.lanternFeedback.textContent}`
  );
  assert2(visibleRainStages.size === 3, "\u952E\u76D8/\u65B9\u5411\u6309\u94AE\u5B9E\u8DD1\u65F6\uFF0CHUD \u5FC5\u987B\u660E\u786E\u663E\u793A\u4E09\u6BB5\u96BE\u5EA6\uFF0C\u4E0D\u80FD\u53EA\u6539\u9690\u85CF\u53C2\u6570");
  assert2(entry.nodes.rainAction.textContent === "\u6536\u597D\u753B\u7A3F", "\u516D\u6298\u8D70\u5B8C\u987B\u6709\u80DC\u5229\u786E\u8BA4");
  entry.nodes.rainAction.click();
  assert2(entry.nodes.lanternPuzzle.hidden && entry.storyFlags().includes("ly-rain-shadow-cleared") && entry.storyFlags().includes("ly-florist-met"), "\u6210\u529F\u5E26\u56DE\u753B\u7A3F\u4E0E\u4EBA\u7269\u7EBF\u7D22");
  assert2(JSON.parse(entry.savedProgress()).knowledge.includes("liuyuan-album-orchid-leaf"), "\u6210\u529F\u6536\u5F55\u5170\u7A3F\u518C\u9875");
  entry.frame();
  assert2(
    !entry.nodes.viewCollected.hidden && entry.nodes.viewCollected.href.includes("playtest=1"),
    "\u518C\u9875\u5165\u53E3\u5E94\u53EF\u89C1\u4E14\u4F20\u9012\u9694\u79BB\u8BD5\u73A9\u6765\u6E90"
  );
  const rainReward = JSON.parse(entry.savedProgress());
  assert2(rainReward.arts.yu === JSON.parse(lanternSave).arts.yu + 1 && rainReward.completedTasks.includes("liuyuan-rain-shadow"), "\u62A4\u753B\u9996\u6B21\u6210\u529F\u5FC5\u987B\u7ED3\u7B97\u5FA1 +1");
  const skipped = boot2("liuyuan-flower", "?chapter=1&playtest=1", 0, lanternSave);
  walkWaypoints(skipped, input, [["\u53EF\u9009\u4E8B\u4EF6", 650, 485, 26]], buildLiuyuanFlowerStudyMap());
  skipped.nodes.helpDrawing.click();
  skipped.nodes.rainAction.click();
  for (let i = 0; i < 600; i++) skipped.frame();
  assert2(skipped.nodes.rainAction.textContent === "\u518D\u8BD5\u4E00\u56DE", "\u5931\u624B\u53EF\u91CD\u8BD5");
  skipped.nodes.lanternLeave.click();
  assert2(
    skipped.storyFlags().includes("ly-florist-met") && !skipped.storyFlags().includes("ly-rain-shadow-cleared") && JSON.parse(skipped.savedProgress()).arts.yu === JSON.parse(lanternSave).arts.yu,
    "\u5931\u624B\u7EE7\u7EED\u6709\u7EBF\u7D22\u4F46\u4E0D\u53D1\u6210\u529F\u5956\u52B1"
  );
  assert2(
    JSON.parse(skipped.savedProgress()).knowledge.includes("liuyuan-drawing-left") && !JSON.parse(skipped.savedProgress()).knowledge.includes("liuyuan-drawing-smudged"),
    "\u6CA1\u6361\u5230\u753B\u5C31\u8D85\u65F6\u4E0D\u5E94\u4F2A\u79F0\u7EB8\u88AB\u96E8\u6D78\u6E7F"
  );
  const declined = boot2("liuyuan-flower", "?chapter=1&playtest=1", 0, lanternSave);
  walkWaypoints(declined, input, [["\u65C1\u89C2\u53EF\u9009\u4E8B\u4EF6", 650, 485, 26]], buildLiuyuanFlowerStudyMap());
  declined.nodes.helpDrawing.click();
  declined.nodes.lanternLeave.click();
  assert2(declined.savedProgress() === lanternSave, "\u51C6\u5907\u754C\u9762\u9000\u51FA\u4E0D\u53D1\u5956\u3001\u4E0D\u4F2A\u9020\u4EBA\u7269\u7EBF\u7D22");
}
console.log("\u82B1\u623F\u62A2\u753B\uFF1A\u952E\u76D8/\u65B9\u5411\u6309\u94AE\u5355\u6B21\u4E8B\u4EF6\u3001\u5931\u8D25\u8FD4\u56DE\u3001\u516D\u827A/\u518C\u9875/\u7EBF\u7D22\u548C\u4E16\u754C\u51BB\u7ED3\u901A\u8FC7\u3002");
var wetDrawing = boot2("liuyuan-flower", "?chapter=1&playtest=1", 6);
walkWaypoints(wetDrawing, "touch", [["\u62A2\u753B\u524D", 650, 485, 26]], buildLiuyuanFlowerStudyMap());
wetDrawing.nodes.helpDrawing.click();
wetDrawing.nodes.rainAction.click();
wetDrawing.nodes.rainArena.dispatch("pointerdown", { pointerId: 4, clientX: 0, clientY: 0, preventDefault() {
} });
wetDrawing.nodes.rainArena.dispatch("pointermove", { pointerId: 4, clientX: -82, clientY: -29 });
for (let i = 0; i < 70; i++) wetDrawing.frame();
wetDrawing.nodes.rainArena.dispatch("pointermove", { pointerId: 4, clientX: 0, clientY: 0 });
for (let i = 0; i < 700; i++) wetDrawing.frame();
assert2(wetDrawing.nodes.rainAction.textContent === "\u518D\u8BD5\u4E00\u56DE", "\u6361\u5230\u540E\u4E0D\u907F\u96E8\u4F1A\u5931\u624B");
assert2(wetDrawing.nodes.rainHud.textContent.includes("HP 0/3"), "\u5931\u624B\u987B\u660E\u786E\u663E\u793A0/3 HP");
wetDrawing.nodes.lanternLeave.click();
assert2(JSON.parse(wetDrawing.savedProgress()).knowledge.includes("liuyuan-drawing-smudged") && !JSON.parse(wetDrawing.savedProgress()).knowledge.includes("liuyuan-album-orchid-leaf") && wetDrawing.nodes.sceneMessage.textContent.includes("\u62A2\u8FC7\u6E7F\u7EB8"), "\u6D78\u6E7F\u5206\u652F\u6709\u540E\u7EED\u7EBF\u7D22\uFF0C\u4E0D\u5F97\u8D60\u518C\u9875\u6216\u6210\u529F\u5956\u52B1");
var catDrawing = boot2("liuyuan-flower", "?chapter=1&playtest=1", 6);
walkWaypoints(catDrawing, "touch", [["\u62A2\u753B\u524D", 650, 485, 26]], buildLiuyuanFlowerStudyMap());
catDrawing.nodes.helpDrawing.click();
catDrawing.nodes.rainAction.click();
catDrawing.nodes.rainArena.dispatch("pointerdown", { pointerId: 4, clientX: 0, clientY: 0, preventDefault() {
} });
catDrawing.nodes.rainArena.dispatch("pointermove", { pointerId: 4, clientX: -82, clientY: -29 });
var catModel = createRainShadow(false, true);
startRainShadow(catModel);
for (let frame = 0; frame < 400 && !catModel.catHits; frame++) {
  updateRainShadow(catModel, 0.016, { x: 0, y: 0, target: rainWindow(catModel) });
  catDrawing.frame();
}
assert2(catModel.catHits === 1 && catModel.hits === 1, "\u732B\u78B0\u7EB8\u89D2\u6D4B\u8BD5\u987B\u53D1\u751F\u5728\u53D7\u96E8\u4E4B\u524D");
assert2(catDrawing.nodes.rainHud.textContent.includes("HP 2/3") && catDrawing.nodes.lanternFeedback.textContent.includes("HP \u22121"), "\u732B\u6251\u771F\u5B9EUI\u62631HP\u5E76\u62A5\u53D7\u51FB");
catDrawing.nodes.lanternLeave.click();
var catProgress = JSON.parse(catDrawing.savedProgress());
assert2(
  catDrawing.nodes.sceneMessage.textContent.includes("\u732B\u8E6D\u76B1") && catProgress.knowledge.includes("liuyuan-drawing-left") && !catProgress.knowledge.includes("liuyuan-drawing-smudged") && !catProgress.knowledge.includes("liuyuan-album-orchid-leaf"),
  "\u53EA\u6709\u732B\u8E6D\u76B1\u7684\u7EB8\u4E0D\u80FD\u5192\u79F0\u6E7F\u7A3F\uFF0C\u4E5F\u4E0D\u80FD\u9886\u5956\u6216\u4E22\u5931\u5BFB\u4EBA\u8854\u63A5"
);
var directRain = boot2("liuyuan-flower", "?playtest=1&minigame=rain-shadow", 0);
assert2(!directRain.nodes.lanternPuzzle.hidden, "\u76F4\u8FBE\u8BD5\u73A9\u94FE\u63A5\u5E94\u81EA\u52A8\u6253\u5F00\u65E0\u5B58\u6863\u7EC3\u4E60");
assert2(directRain.nodes.rainHud.textContent.includes("HP 3/3"), "\u51C6\u5907\u9875\u987B\u663E\u793A3HP");
directRain.nodes.rainGentle.checked = true;
directRain.nodes.rainGentle.dispatch("change", {});
assert2(directRain.nodes.rainHud.textContent.includes("HP 3/3"), "\u7F13\u96E8\u4E0D\u80FD\u628A3HP\u52A0\u52305");
directRain.nodes.rainGentle.checked = false;
directRain.nodes.rainGentle.dispatch("change", {});
assert2(directRain.nodes.lanternFeedback.textContent.includes("\u4EAE\u5904\u4E0D\u6321\u96E8"), "\u51C6\u5907\u63D0\u793A\u987B\u660E\u786E\u7A97\u5149\u4E0D\u662F\u907F\u96E8\u70B9");
directRain.frame();
directRain.nodes.rainAction.click();
var practiceSave = directRain.savedProgress();
var dragModel = createRainShadow(false, true);
startRainShadow(dragModel);
directRain.nodes.rainArena.dispatch("pointerdown", { pointerId: 4, clientX: 0, clientY: 0, preventDefault() {
} });
for (let frame = 0; frame < 3500 && dragModel.phase === "running"; frame++) {
  const command = rainTestInput(dragModel);
  if (frame % 60 === 10) {
    directRain.nodes.rainArena.dispatch("pointerdown", { pointerId: 9, clientX: 300, clientY: 200, preventDefault() {
    } });
    directRain.nodes.rainArena.dispatch("pointermove", { pointerId: 9, clientX: 0, clientY: 0 });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
      directRain.nodes.rainArena.dispatch(type, { pointerId: 9 });
  }
  directRain.nodes.rainArena.dispatch("pointermove", { pointerId: 4, clientX: command.target.x - 160, clientY: command.target.y - 157 });
  directRain.nodes.rainGuard.dispatch(command.guard ? "pointerdown" : "pointerup", { pointerId: 2, preventDefault() {
  } });
  directRain.frame();
  updateRainShadow(dragModel, 0.016, command);
}
directRain.nodes.rainArena.dispatch("pointerup", { pointerId: 4 });
assert2(dragModel.phase === "won" && directRain.nodes.rainAction.textContent === "\u6536\u597D\u753B\u7A3F", `\u753B\u9762\u62D6\u52A8\u53EF\u8D70\u901A\u516D\u6298\uFF1A${directRain.nodes.rainHud.textContent} / ${directRain.nodes.lanternFeedback.textContent}`);
assert2(directRain.savedProgress() === practiceSave, "\u7EC3\u4E60\u80DC\u5229\u7B49\u5F85\u786E\u8BA4\u671F\u95F4\u4E0D\u80FD\u5199\u8FDB\u5EA6");
directRain.nodes.rainAction.click();
assert2(
  directRain.nodes.lanternPuzzle.hidden && directRain.savedProgress() === practiceSave,
  "\u76F4\u8FBE\u7EC3\u4E60\u6210\u529F\u786E\u8BA4\u4E5F\u4E0D\u80FD\u653E\u884C\u3001\u6DFB\u65D7\u6807\u6216\u53D1\u516D\u827A"
);
assert2(directRain.storyFlags().length === 0, "\u76F4\u8FBE\u7EC3\u4E60\u9000\u51FA\u4E0D\u53EF\u653E\u884C\u6216\u53D1\u5956\u52B1");
{
  const search = "?chapter=1&playtest=1";
  const initial = boot2("liuyuan-court", search);
  const spawn = initial.foot().join();
  walkWaypoints(initial, "keyboard", [["\u5C0F\u5EAD\u4E2D\u6BB5", 1170, 680]], buildLiuyuanCourtStudyMap());
  initial.pagehide();
  const savedFoot = initial.foot().join();
  assert2(savedFoot !== spawn, "\u7EED\u63A5\u53CD\u4F8B\u5FC5\u987B\u4F7F\u7528\u5DF2\u79FB\u52A8\u811A\u70B9");
  const slot = Object.keys(initial.sessionRecords).find((key) => key.startsWith("gusu:liuyuan-court:"));
  assert2(slot, "\u5C0F\u5EAD\u987B\u751F\u6210\u72EC\u7ACB\u4F1A\u8BDD\u69FD");
  const raw = initial.sessionRecords[slot];
  const reload = (records, query = search) => boot2(
    "liuyuan-court",
    query,
    13,
    initial.savedProgress(),
    void 0,
    false,
    records
  );
  assert2(reload({ [slot]: raw }).foot().join() === savedFoot, "\u5408\u6CD5\u5C0F\u5EAD\u811A\u70B9\u53EF\u6062\u590D");
  for (const patch of [
    { x: -1 },
    { x: 0, y: 0 },
    { dir: 4 },
    { observed: "yes" },
    { geometryStamp: "changed" },
    { progressStamp: "changed" },
    { version: 999 }
  ]) {
    const value = JSON.stringify({ ...JSON.parse(raw), ...patch });
    assert2(reload({ [slot]: value }).foot().join() === spawn, `\u62D2\u7EDD\u5C0F\u5EAD\u975E\u6CD5\u7EED\u63A5 ${JSON.stringify(patch)}`);
  }
  assert2(reload({ [slot]: "{broken" }).foot().join() === spawn, "\u5C0F\u5EAD\u7834\u635F\u4F1A\u8BDD\u5E94\u56DE\u9000\u51FA\u751F\u70B9");
  for (const query of ["?chapter=1", "?chapter=1&playtest=1&draft=1", "?playtest=1"])
    assert2(reload({ [slot]: raw }, query).foot().join() === spawn, `\u5C0F\u5EAD\u4F1A\u8BDD\u9694\u79BB ${query}`);
  const resetCourt = reload({ [slot]: raw });
  resetCourt.nodes.reset.click();
  resetCourt.pagehide();
  assert2(reload(resetCourt.sessionRecords).foot().join() === spawn, "\u91CD\u7F6E\u5C0F\u5EAD\u540E\u5237\u65B0\u4E0D\u5F97\u56DE\u65E7\u811A\u70B9");
}
for (const input of ["keyboard", "touch"]) {
  const freeEntry = boot2("liuyuan-entry", "?playtest=1", 1);
  walkWaypoints(
    freeEntry,
    input,
    [["\u76F4\u63A5\u63D0\u6876\u8FDB\u95E8", 520, 575, 10]],
    { ...buildLiuyuanEntryStudyMap(), obstacles: [] }
  );
  assert2(freeEntry.storyFlags().includes("ly-gate-passed") && !freeEntry.storyFlags().includes("ly-huabu-seen") && !freeEntry.storyFlags().includes("ly-gate-clue") && freeEntry.nodes.dialogue.hidden, "\u63A5\u6876\u540E\u53EF\u4EE5\u4E0D\u542C\u6307\u8DEF\u3001\u4E0D\u7B54\u95E8\u623F\uFF0C\u76F4\u63A5\u8FDB\u5165\u5939\u5F04");
  walkWaypoints(
    freeEntry,
    input,
    [["\u5DF2\u5165\u56ED\u540E\u56DE\u8857\u9762", 566, 676, 10]],
    { ...buildLiuyuanEntryStudyMap(), obstacles: [] }
  );
  assert2(!freeEntry.nodes.interactionCue.textContent.includes("\u6307\u8DEF"), "\u5DF2\u6307\u8DEF\u9636\u6BB5\u7ED3\u675F\u4E0D\u80FD\u518D\u63D0\u793A\u6307\u8DEF");
  freeEntry.nodes.interact.click();
  assert2(
    freeEntry.nodes.line.textContent.includes("\u770B\u7740\u62C5\u5B50") && !freeEntry.storyFlags().includes("ly-huabu-seen"),
    "\u770B\u62C5\u5B50\u7684\u4E54\u79BE\u53EA\u80FD\u56DE\u5E94\u5F53\u524D\u5904\u5883\uFF0C\u4E0D\u91CD\u5F00\u6307\u8DEF\u624B\u7EED"
  );
  freeEntry.nodes.interact.click();
  walkWaypoints(
    freeEntry,
    input,
    [["\u6CBF\u5939\u5F04", 520, 400, 12], ["\u8F6C\u89D2\u5185\u4FA7", 470, 372, 10], ["\u7ED5\u8FC7\u65E7\u897F\u6298\u70B9", 430, 350, 10]],
    { ...buildLiuyuanEntryStudyMap(), obstacles: [] }
  );
  assert2(
    freeEntry.nodes.interactionCue.textContent.includes("\u5411\u4E0A"),
    "\u7ED5\u8FC7\u897F\u6298\u6837\u672C\u540E\u63D0\u793A\u5E94\u4ECE\u5F53\u524D\u7B2C\u4E8C\u5C0F\u5EAD\u5411\u524D\uFF0C\u4E0D\u8981\u6C42\u5012\u56DE\u53BB\u8E29\u70B9"
  );
  freeEntry.pagehide();
  const detour = Object.values(freeEntry.sessionRecords).map((raw) => JSON.parse(raw)).find((value) => value.state?.alleyCheckpoint !== void 0);
  assert2(detour?.state.alleyCheckpoint === 3, "\u53CD\u4F8B\u8DEF\u7EBF\u5FC5\u987B\u771F\u7684\u6F0F\u91C7\u897F\u6298\u70B9\uFF0C\u4E0D\u80FD\u53EA\u662F\u53E6\u4E00\u6761\u5DF2\u8E29\u5B8C\u8DEF\u7EBF");
  walkWaypoints(
    freeEntry,
    input,
    [["\u5317\u5411\u7A84\u5ECA", 430, 300, 10], ["\u6B47\u6876\u5904", 430, 250, 22]],
    { ...buildLiuyuanEntryStudyMap(), obstacles: [] }
  );
  assert2(!freeEntry.nodes.dialogue.hidden, "\u6F0F\u91C7\u897F\u6298\u8DEF\u70B9\u4F46\u62B5\u8FBE\u6B47\u6876\u5904\u4ECD\u987B\u51FA\u73B0\u53EF\u505A\u7684\u884C\u52A8");
  if (input === "keyboard") freeEntry.rawKey("1");
  else freeEntry.nodes.choices.children[0].click();
  assert2(freeEntry.storyFlags().includes("ly-alley-walked"), "\u62B5\u8FBE\u5E76\u653E\u6876\u624D\u5B8C\u6210\u672C\u6BB5\uFF0C\u4E0D\u80FD\u53D7\u6F0F\u8DEF\u70B9\u963B\u65AD");
  const reverse = boot2("liuyuan-entry", "?route=modern&from=court&return=1&playtest=1", 14);
  walkWaypoints(
    reverse,
    input,
    [
      ["\u5C0F\u5EAD\u53E3", 340, 232, 10],
      ["\u7A97\u524D", 420, 232, 10],
      ["\u6B47\u6876\u5904", 430, 250, 10],
      ["\u7A84\u5ECA", 430, 300, 10],
      ["\u5C0F\u5EAD", 430, 350, 10],
      ["\u7ED5\u8FC7\u897F\u6298", 470, 372, 10],
      ["\u72ED\u5ECA", 520, 400, 10],
      ["\u5929\u4E95", 520, 480, 10],
      ["\u524D\u5385", 520, 550, 10],
      ["\u95E8\u69DB\u524D", 520, 614, 12]
    ],
    { ...buildLiuyuanEntryStudyMap(), obstacles: [] }
  );
  assert2(!reverse.storyFlags().includes("ly-unlocked"), "\u6F0F\u8DEF\u70B9\u8FD4\u7A0B\u4E0D\u80FD\u8D8A\u8FC7\u95E8\u623F\u63D0\u524D\u7ED3\u7B97");
  if (reverse.nodes.dialogue.hidden) reverse.nodes.interact.click();
  reverse.nodes.interact.click();
  if (input === "keyboard") reverse.rawKey("1");
  else reverse.nodes.choices.children[0].click();
  reverse.nodes.interact.click();
  reverse.nodes.interact.click();
  walkWaypoints(
    reverse,
    input,
    [["\u8857\u9762\u5F52\u8FD8\u7A7A\u6876", 520, 656, 10]],
    { ...buildLiuyuanEntryStudyMap(), obstacles: [] }
  );
  assert2(!reverse.storyFlags().includes("ly-unlocked") && reverse.nodes.chapterComplete.hidden, "\u5230\u8857\u9762\u4F46\u672A\u4EA4\u6876\u4E0D\u80FD\u81EA\u52A8\u7ED3\u675F");
  if (input === "keyboard") reverse.rawKey("e");
  else reverse.nodes.interact.click();
  assert2(reverse.storyFlags().includes("ly-unlocked"), "\u6F0F\u91C7\u8FD4\u7A0B\u8DEF\u70B9\u4E5F\u53EF\u5728\u5E94\u7B54\u540E\u8D70\u5230\u8857\u9762\u5B8C\u6210");
}
{
  const entry = boot2("liuyuan-entry", "?playtest=1", 1, void 0, void 0, true);
  entry.frame();
  assert2(
    entry.qiaoDraws().length === 1 && Math.abs(entry.qiaoDraws()[0].x - LIUYUAN_ENTRY_QIAO_WAIT.x) <= 1,
    "\u63A5\u6876\u540E\u7684\u521D\u59CB\u4E54\u79BE\u5728\u95E8\u5916\u6307\u8DEF\u4F4D\u7F6E"
  );
  walkWaypoints(entry, "keyboard", [["\u76F4\u63A5\u5165\u95E8", 520, 590, 10]], { ...buildLiuyuanEntryStudyMap(), obstacles: [] });
  entry.frame();
  const mid = entry.qiaoDraws()[0];
  assert2(mid && mid.x > 540 && mid.x < LIUYUAN_ENTRY_QIAO_WAIT.x, "\u5165\u95E8\u540E\u4E54\u79BE\u5E94\u9010\u5E27\u9000\u56DE\u62C5\u8FB9\uFF0C\u4E0D\u77AC\u79FB\u6D88\u5931");
  const before = entry.savedProgress();
  for (let i = 0; i < 50; i++) entry.frame();
  assert2(
    entry.qiaoDraws().length === 1 && Math.abs(entry.qiaoDraws()[0].x - 540) <= 1,
    "\u9000\u56DE\u540E\u4ECD\u6709\u4E00\u4F4D\u7B49\u5F85\u7684\u4E54\u79BE\uFF0C\u4E0D\u91CD\u590D\u753B\u4E24\u4E2A\u66FF\u8EAB"
  );
  assert2(entry.savedProgress() === before, "NPC \u8D70\u4F4D\u4E0D\u80FD\u8FFD\u52A0\u8FDB\u5EA6\u6216\u5956\u52B1");
  assert2(
    entry.seatedDraws().length === 2 && entry.seatedDraws().some((npc) => npc.role === "elder" && npc.y === 655),
    "\u76F4\u63A5\u5165\u56ED\u540E\u8001\u53DF\u4ECD\u5B88\u8857\u4FA7\u62C5\u5B50\uFF0C\u95E8\u623F\u59CB\u7EC8\u5728\u95E8\u6D1E\uFF0C\u4E0D\u968F\u65D7\u6807\u6D88\u5931"
  );
  walkWaypoints(entry, "keyboard", [["\u56DE\u5230\u8001\u53DF\u8EAB\u8FB9", 493, 666, 8]], { ...buildLiuyuanEntryStudyMap(), obstacles: [] });
  assert2(entry.nodes.interactionCue.textContent.includes("\u4E54\u8001\u53DF"), "\u62C5\u8FB9\u63D0\u793A\u987B\u4E0E\u5B9E\u9645\u4EBA\u7269\u4E00\u81F4");
  const elderSave = entry.savedProgress();
  entry.nodes.interact.click();
  assert2(
    entry.nodes.speaker.textContent === "\u4E54\u8001\u53DF" && entry.nodes.line.textContent.includes("\u7A7A\u6876\u5E26\u56DE\u6765"),
    "\u5165\u56ED\u540E\u56DE\u5934\u4ECD\u80FD\u4E0E\u7559\u4E0B\u7684\u8001\u4EBA\u4EA4\u8C08"
  );
  assert2(entry.savedProgress() === elderSave, "\u62C5\u8FB9\u95F2\u8BDD\u4E0D\u5F97\u91CD\u53D1\u4EFB\u52A1\u3001\u827A\u6216\u53EF\u9009\u6307\u8DEF\u4E8B\u4EF6");
  const returning = boot2("liuyuan-entry", "?route=modern&from=court&return=1&playtest=1", 14, void 0, void 0, true);
  returning.frame();
  assert2(
    returning.qiaoDraws().length === 1 && Math.abs(returning.qiaoDraws()[0].x - 540) <= 1,
    "\u8FD4\u7A0B\u5148\u6062\u590D\u62C5\u8FB9\u7B49\u5019\u4F4D\u7F6E\uFF0C\u4E0D\u80FD\u5728\u95E8\u623F\u5E94\u7B54\u65F6\u51ED\u7A7A\u751F\u6210"
  );
  assert2(
    returning.seatedDraws().length === 2 && returning.seatedDraws().some((npc) => npc.role === "elder"),
    "\u8FD4\u7A0B\u6062\u590D\u540C\u4E00\u4F4D\u5B88\u62C5\u8001\u4EBA\uFF0C\u4E0D\u5728\u8FD8\u6876\u540E\u53E6\u751F\u6210\u66FF\u8EAB"
  );
}
for (const [memory, expected] of [
  ["liuyuan-album-orchid-leaf", "\u522B\u6401\u5728\u6211\u6848\u4E0A"],
  ["liuyuan-drawing-smudged", "\u60F3\u8D77\u82B1\u5320\u538B\u4F4F\u6E7F\u7EB8"],
  ["liuyuan-drawing-left", "\u627E\u4EBA\u5C31\u8BA4\u7B14\u6811"]
]) {
  const query = "?route=modern&from=study-court&playtest=1";
  const initial = boot2("liuyuan-study-interior", query, 9);
  const progress = JSON.parse(initial.savedProgress());
  progress.knowledge.push(memory);
  const interior = boot2("liuyuan-study-interior", query, 9, JSON.stringify(progress));
  walkWaypoints(
    interior,
    "keyboard",
    [["\u4E66\u658B\u4E2D\u592E", 770, 650], ["\u6284\u4E66\u4EBA\u6848\u524D", 630, 610, 22]],
    buildLiuyuanStudyInteriorMap()
  );
  assert2(
    !interior.nodes.answerChoices.hidden && interior.nodes.answerPrompt.textContent.includes(expected),
    `\u82B1\u623F\u7ECF\u5386\u5FC5\u987B\u51FA\u73B0\u5728\u4E66\u658B\u9996\u6B21\u4F1A\u9762\u7684\u5BF9\u767D\u4E2D\uFF1A${memory}`
  );
  const saved = JSON.parse(interior.savedProgress());
  assert2(
    saved.arts.yu === progress.arts.yu && saved.arts.shu === progress.arts.shu,
    "\u652F\u7EBF\u5BF9\u767D\u56DE\u54CD\u4E0D\u80FD\u518D\u6B21\u53D1\u653E\u516D\u827A"
  );
}
var completedProgressByInput = /* @__PURE__ */ new Map();
var entryMarkup = (0, import_node_fs2.readFileSync)("liuyuan-entry.html", "utf8");
assert2(
  /<div class="stage">[\s\S]*?<section id="dialogue"[\s\S]*?<\/section><\/div>/.test(entryMarkup),
  "\u5165\u53E3\u4EBA\u7269\u5BF9\u767D\u987B\u51FA\u73B0\u5728\u753B\u9762\u5185\uFF0C\u4E0D\u53EF\u85CF\u5728\u6574\u5F20\u753B\u5E03\u4E0B\u65B9"
);
for (const page2 of ["liuyuan-court", "liuyuan-lvyin"]) {
  const markup = (0, import_node_fs2.readFileSync)(`${page2}.html`, "utf8");
  assert2(
    /<div class="stage">[\s\S]*?<button class="stage-action" id="continueChapter"/.test(markup),
    `${page2} \u7684\u8FC7\u5E55\u6309\u94AE\u5E94\u4E0E\u573A\u666F\u5904\u4E8E\u540C\u4E00\u89C6\u91CE`
  );
  const chapterScene = boot2(page2, "?chapter=1");
  assert2(chapterScene.nodes.stageNote.hidden, `${page2} \u6B63\u5F0F\u7AE0\u6D41\u4E0D\u5E94\u8986\u76D6\u8C03\u8BD5\u8BF4\u660E\u5361`);
}
var playtestEntry = boot2("liuyuan-entry", "?playtest=1", 0);
playtestEntry.frame();
assert2(
  !playtestEntry.nodes.playtestBanner.hidden && playtestEntry.nodes.playtestStart.hidden,
  "\u8BD5\u73A9\u5165\u53E3\u5E94\u660E\u793A\u72EC\u7ACB\u8FDB\u5EA6\uFF0C\u4E0D\u518D\u663E\u793A\u91CD\u590D\u7684\u5F00\u59CB\u94FE\u63A5"
);
assert2(
  !playtestEntry.nodes.interactionCue.hidden && playtestEntry.nodes.interactionCue.textContent.includes("\u4E54\u8001\u53DF"),
  "\u4ECE\u5934\u8BD5\u73A9\u7684\u51FA\u751F\u70B9\u5E94\u76F4\u63A5\u663E\u793A\u8FD1\u8EAB\u4EBA\u7269\u4EA4\u4E92\u63D0\u793A"
);
playtestEntry.nodes.playtestRestart.click();
assert2(
  playtestEntry.assignedUrl() === "liuyuan-entry.html?playtest=1",
  "\u91CD\u5F00\u8BD5\u73A9\u5E94\u7559\u5728\u72EC\u7ACB\u8BD5\u73A9\u6A21\u5F0F"
);
var playtestEastHall = boot2(
  "liuyuan-east-hall",
  "?route=modern&from=flower&draft=1&playtest=1"
);
assert2(
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
    assert2(harness.nodes.choices?.children.length, `${label} \u7F3A\u5C11\u4EBA\u7269\u5E94\u7B54\u9009\u9879`);
    if (input === "keyboard") harness.rawKey("1");
    else harness.nodes.choices.children[0].click();
  };
  const advanceLines = (harness, count) => {
    for (let i = 0; i < count; i++) harness.nodes.interact.click();
  };
  let entry = boot2("liuyuan-entry", "?draft=1", 0, emptySave);
  const reloadEntry = () => {
    entry.pagehide();
    const footBefore = entry.foot();
    entry = boot2("liuyuan-entry", "?draft=1", 0, entry.savedProgress(), void 0, false, entry.sessionRecords);
    assert2(entry.foot().join() === footBefore.join(), `${input} \u5237\u65B0\u5E94\u6062\u590D\u5165\u53E3\u539F\u978B\u5E95\uFF0C\u4E0D\u9000\u56DE\u95E8\u5916`);
  };
  assert2(!entry.storyFlags().length, "\u5165\u53E3\u6D4B\u8BD5\u5FC5\u987B\u4ECE\u65E0\u7559\u56ED\u65D7\u6807\u7684\u5B58\u6863\u5F00\u59CB");
  entry.nodes.interact.click();
  assert2(entry.nodes.speaker.textContent === "\u89C2\u5BDF", "\u95E8\u5916\u5E94\u5148\u7531\u62C5\u5B50\u548C\u4EBA\u89E6\u53D1\u6545\u4E8B");
  advanceLines(entry, 2);
  chooseFirst(entry, "\u66FF\u8001\u53DF\u63D0\u7CA5");
  assert2(entry.storyFlags().includes("ly-errand-offered"), "\u63A5\u53D7\u6258\u4ED8\u540E\u624D\u8BB0\u5F55\u9001\u7CA5");
  entry.nodes.interact.click();
  const entryMap = buildLiuyuanEntryStudyMap();
  assert2(!collides(
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
  assert2(entry.storyFlags().includes("ly-huabu-seen"), "\u542C\u4E54\u79BE\u8BF4\u5C0F\u95E8\u540E\u624D\u8BB0\u5F55\u53E3\u4EE4");
  walkWaypoints(
    entry,
    input,
    [["\u95E8\u623F", 520, 614, 15]],
    { ...buildLiuyuanEntryStudyMap(), obstacles: [] }
  );
  entry.nodes.interact.click();
  advanceLines(entry, 2);
  chooseFirst(entry, "\u95E8\u623F\u7B2C\u4E00\u6B21\u62E6\u8DEF");
  assert2(
    entry.storyFlags().includes("ly-gate-clue") && !entry.storyFlags().includes("ly-gate-passed"),
    "\u7B2C\u4E00\u6B21\u62E6\u8DEF\u53EA\u7ED9\u7EBF\u7D22\uFF0C\u4E0D\u5E94\u76F4\u63A5\u8FC7\u95E8"
  );
  entry.nodes.interact.click();
  chooseFirst(entry, "\u7528\u8001\u53DF\u8EAB\u4EFD\u7EBF\u7D22\u7B54\u95E8\u623F");
  assert2(entry.storyFlags().includes("ly-gate-passed"), "\u6B63\u786E\u5E94\u7B54\u540E\u624D\u5141\u8BB8\u7A7F\u95E8");
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
  assert2(!entry.storyFlags().includes("ly-alley-walked"), "\u62B5\u8FBE\u5C0F\u5EAD\u53E3\u540E\u4ECD\u987B\u4EB2\u624B\u653E\u6876");
  if (entry.nodes.dialogue.hidden) entry.nodes.interact.click();
  chooseFirst(entry, "\u5C0F\u5EAD\u53E3\u653E\u6876");
  assert2(entry.storyFlags().includes("ly-alley-walked"), "\u653E\u6876\u540E\u624D\u7ED3\u7B97\u5939\u5F04\u5B9E\u8D70");
  reloadEntry();
  assert2(entry.nodes.status.textContent.includes("\u6876\u8FD8\u653E\u5728\u811A\u8FB9"), "\u653E\u6876\u540E\u5237\u65B0\u4E0D\u80FD\u81EA\u52A8\u63D0\u6876");
  entry.nodes.interact.click();
  chooseFirst(entry, "\u63D0\u6876\u540E\u6CBF\u5899\u897F\u884C");
  assert2(!entry.assignedUrl(), "\u63D0\u6876\u52A8\u4F5C\u5FC5\u987B\u7559\u5728\u672C\u5E55\uFF0C\u4E0D\u80FD\u76F4\u63A5\u8DF3\u8FC7\u897F\u6298\u77F3\u8DEF");
  entry.nodes.interact.click();
  assert2(!entry.assignedUrl(), "\u5728\u6B47\u6876\u4F4D\u7F6E\u6309 E \u4E0D\u80FD\u63D0\u524D\u5207\u5230\u5C0F\u5EAD");
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
  assert2(
    entry.assignedUrl() === "liuyuan-court.html?chapter=1&draft=1",
    "\u5165\u5C0F\u5EAD\u5E94\u4FDD\u7559\u7AE0\u8282\u548C\u8349\u7A3F\u9884\u89C8"
  );
  entry.pagehide();
  assert2(
    !entry.sessionRecords[entryResumeKey("campaign:forward:draft")],
    "\u79BB\u5F00\u5165\u53E3\u53BB\u5C0F\u5EAD\u540E\u4E0D\u80FD\u6B8B\u7559\u5165\u53E3\u4F4D\u7F6E\uFF0C\u5BFC\u81F4\u4E0B\u6B21\u5165\u56ED\u5077\u8DF3\u8DEF\u6BB5"
  );
  let court = boot2(
    "liuyuan-court",
    entry.assignedUrl().slice("liuyuan-court.html".length),
    0,
    entry.savedProgress()
  );
  assert2(court.storyFlags().includes("ly-alley-walked"), "\u5C0F\u5EAD\u5E94\u8BFB\u5230\u5165\u53E3\u5B9E\u8D70\u8FDB\u5EA6");
  walkWaypoints(court, input, [
    ["\u5C0F\u5EAD\u4E1C\u9662", 1170, 680],
    ["\u7A97\u4E0B", 1160, 650, 20]
  ], buildLiuyuanCourtStudyMap());
  court.nodes.look.click();
  court.pagehide();
  const courtFoot = court.foot().join();
  court = boot2("liuyuan-court", "?chapter=1&draft=1", 0, court.savedProgress(), void 0, false, court.sessionRecords);
  assert2(court.foot().join() === courtFoot, "\u5C0F\u5EAD\u89C2\u5BDF\u540E\u5237\u65B0\u987B\u4FDD\u7559\u811A\u70B9");
  walkWaypoints(court, input, [
    ["\u5EAD\u4E2D\u77F3\u8DEF", 790, 670],
    ["\u5EAD\u4E2D\u897F\u4FA7", 610, 625],
    ["\u5C0F\u5EAD\u6298\u89D2", 405, 550],
    ["\u897F\u5ECA", 340, 450],
    ["\u4E34\u6C60\u8F6C\u573A", 330, 305, 12]
  ], buildLiuyuanCourtStudyMap());
  court.nodes.continueChapter.click();
  court.pagehide();
  assert2(
    !Object.keys(court.sessionRecords).some((key) => key.startsWith("gusu:liuyuan-court:")),
    "\u5C0F\u5EAD\u79BB\u5E55\u540E pagehide \u4E0D\u5F97\u91CD\u5199\u65E7\u811A\u70B9"
  );
  assert2(
    court.assignedUrl() === "liuyuan-lvyin.html?chapter=1&courtWindow=1&draft=1",
    "\u89C2\u5BDF\u6F0F\u7A97\u5E76\u8D70\u5230\u897F\u5ECA\u624D\u53EF\u63A5\u4E34\u6C60\uFF0C\u4E14\u4FDD\u7559\u8349\u7A3F\u53C2\u6570"
  );
  const lvyin = boot2(
    "liuyuan-lvyin",
    court.assignedUrl().slice("liuyuan-lvyin.html".length),
    0,
    court.savedProgress()
  );
  walkWaypoints(lvyin, input, [
    ["\u6C60\u5357\u4E1C\u6BB5", 1250, 720],
    ["\u6C60\u5357\u4E2D\u6BB5", 930, 700, 25]
  ], buildLiuyuanLvyinStudyMap());
  const pavilionRoute = [
    ["\u6C60\u5357\u897F\u6BB5", 700, 710],
    ["\u53F0\u9636\u4E0B", 485, 630],
    ["\u8F69\u524D\u53F0\u9636", 375, 535],
    ["\u8F69\u524D", 250, 470, 25]
  ];
  walkWaypoints(lvyin, input, pavilionRoute, buildLiuyuanLvyinStudyMap());
  assert2(
    !lvyin.nodes.continueChapter.hidden && lvyin.nodes.stageNote.hidden,
    "\u770B\u6C60\u662F\u53EF\u9009\u63A2\u7D22\uFF0C\u672A\u89C2\u5BDF\u4E5F\u5FC5\u987B\u80FD\u7EE7\u7EED\u9001\u7CA5"
  );
  walkWaypoints(lvyin, input, [
    ["\u8F69\u524D\u53F0\u9636", 375, 535],
    ["\u53F0\u9636\u4E0B", 485, 630],
    ["\u6C60\u5357\u897F\u6BB5", 700, 710],
    ["\u6C60\u5357\u4E2D\u6BB5", 930, 700, 25]
  ], buildLiuyuanLvyinStudyMap());
  assert2(!lvyin.nodes.observePond.hidden, "\u6C60\u8FB9\u5FC5\u987B\u6709\u753B\u9762\u5185\u7684\u770B\u6C60\u6309\u94AE");
  lvyin.nodes.observePond.click();
  assert2(lvyin.nodes.look.textContent === "\u6536", "\u6C60\u8FB9\u89C2\u5BDF\u5E94\u5207\u5165\u53EF\u9000\u51FA\u7684\u7B2C\u4E00\u4EBA\u79F0\u53D6\u666F");
  lvyin.frame();
  assert2(
    !lvyin.nodes.stageNote.hidden && !lvyin.nodes.observePond.hidden,
    "\u6B63\u5F0F\u7AE0\u6D41\u53D6\u666F\u5FC5\u987B\u663E\u793A\u53CD\u9988\u548C\u6536\u56DE\u6309\u94AE"
  );
  assert2(lvyin.nodes.stageNote.textContent.includes("\u897F\u5317\u671B"), "\u53D6\u666F\u65F6\u5E94\u63D0\u793A\u89C6\u5411\u4E0E\u9000\u51FA\u65B9\u5F0F");
  lvyin.rawKey("Escape");
  assert2(lvyin.nodes.look.textContent === "\u770B", "Esc \u5E94\u6536\u56DE\u6C60\u8FB9\u53D6\u666F");
  lvyin.nodes.look.click();
  walkWaypoints(lvyin, input, [
    ["\u6C60\u5357\u897F\u6BB5", 700, 710],
    ["\u53F0\u9636\u4E0B", 485, 630],
    ["\u8F69\u524D\u53F0\u9636", 375, 535],
    ["\u8F69\u524D", 250, 470, 25]
  ], buildLiuyuanLvyinStudyMap());
  assert2(lvyin.nodes.look.textContent === "\u770B", "\u79FB\u52A8\u540E\u5E94\u81EA\u52A8\u6536\u56DE\u53D6\u666F\uFF0C\u7EE7\u7EED\u53EF\u8D70\u8DEF\u7EBF");
  lvyin.nodes.continueChapter.click();
  assert2(
    lvyin.assignedUrl() === "liuyuan-flower.html?chapter=1&draft=1",
    "\u4E34\u6C60\u89C2\u5BDF\u540E\u624D\u53EF\u4ECE\u8F69\u524D\u63A5\u82B1\u6728\u9662"
  );
  const flower = boot2(
    "liuyuan-flower",
    lvyin.assignedUrl().slice("liuyuan-flower.html".length),
    0,
    lvyin.savedProgress()
  );
  walkWaypoints(flower, input, [["\u6A90\u4E0B\u7CA5\u6876", 480, 500, 15]], buildLiuyuanFlowerStudyMap());
  flower.nodes.look.click();
  assert2(
    flower.storyFlags().includes("ly-porridge-delivered"),
    `\u5230\u6A90\u4E0B\u6401\u6876\u624D\u8BB0\u5F55\u9001\u8FBE\uFF1A\u811A\u70B9 ${flower.foot().join()}\uFF0C\u63D0\u793A ${flower.nodes.status.textContent}`
  );
  assert2(
    !flower.nodes.sceneMessage.hidden && flower.nodes.stageNote.hidden,
    "\u9001\u7CA5\u53CD\u9988\u5E94\u7559\u5728\u573A\u666F\u5185\uFF0C\u7AE0\u6D41\u8C03\u8BD5\u5361\u5E94\u9690\u85CF"
  );
  const deliveredProgress = flower.savedProgress();
  flower.nodes.look.click();
  assert2(
    flower.savedProgress() === deliveredProgress && flower.nodes.sceneMessage.textContent.includes("\u5DF2\u7ECF\u653E"),
    "\u91CD\u590D\u67E5\u770B\u7CA5\u6876\u987B\u627F\u8BA4\u5DF2\u4EA4\u4ED8\uFF0C\u4E0D\u91CD\u5199\u8FDB\u5EA6"
  );
  walkWaypoints(flower, input, [["\u672A\u95EE\u8BDD\u5148\u5230\u4E1C\u53E3", 1675, 445, 35]], buildLiuyuanFlowerStudyMap());
  assert2(
    !flower.nodes.continueChapter.hidden && !flower.storyFlags().includes("ly-florist-met"),
    "\u5DF2\u4EA4\u7CA5\u4F46\u672A\u95EE\u8BDD\u4E5F\u80FD\u79BB\u9662\uFF0C\u4E0D\u80FD\u4F2A\u9020\u82B1\u5320\u7EBF\u7D22"
  );
  assert2(flower.nodes.continueChapter.textContent.includes("\u7EB8\u58F0"), "\u672A\u542C\u82B1\u5320\u65F6\u51FA\u53E3\u4E0D\u80FD\u63D0\u793A\u672A\u77E5\u7684\u7B14\u6811");
  const silentFlower = boot2("liuyuan-flower", "?chapter=1&draft=1", 0, flower.savedProgress());
  walkWaypoints(silentFlower, input, [["\u4E0D\u95EE\u8BDD\u76F4\u63A5\u5230\u4E1C\u53E3", 1675, 445, 35]], buildLiuyuanFlowerStudyMap());
  silentFlower.nodes.continueChapter.click();
  assert2(silentFlower.nodes.transitionWords.textContent.includes("\u7FFB\u7EB8\u58F0") && !silentFlower.nodes.transitionWords.textContent.includes("\u82DE\u5C16"), "\u672A\u542C\u7EBF\u7D22\u7684\u8F6C\u573A\u4E0D\u80FD\u58F0\u79F0\u542C\u8FC7\u7B14\u6811");
  silentFlower.nodes.transitionContinue.click();
  const silentHall = boot2(
    "liuyuan-east-hall",
    silentFlower.assignedUrl().slice("liuyuan-east-hall.html".length),
    0,
    silentFlower.savedProgress()
  );
  assert2(
    silentHall.nodes.stageNote.hidden && !silentHall.storyFlags().includes("ly-florist-met"),
    "\u8DF3\u8FC7\u82B1\u5320\u540E\u5802\u524D\u987B\u4ECD\u63A5\u5165\u6B63\u5F0F\u7AE0\u6D41\uFF0C\u4E0D\u80FD\u964D\u4E3A\u7814\u7A76\u8BD5\u8D70"
  );
  walkWaypoints(silentHall, input, [["\u81EA\u770B\u5DE6\u6811", 515, 575, 18]], buildLiuyuanEastHallStudyMap());
  silentHall.nodes.look.click();
  walkWaypoints(silentHall, input, [["\u5802\u524D\u4E2D\u6BB5", 970, 620], ["\u81EA\u770B\u53F3\u6811", 1390, 615, 20]], buildLiuyuanEastHallStudyMap());
  silentHall.nodes.look.click();
  assert2(silentHall.storyFlags().includes("ly-magnolia-seen") && !silentHall.storyFlags().includes("ly-florist-met") && !silentHall.nodes.sceneMessage.textContent.includes("\u82B1\u5320\u8BF4"), "\u81EA\u4E3B\u770B\u6811\u987B\u63A8\u8FDB\u89C2\u5BDF\uFF0C\u4E0D\u80FD\u4F2A\u9020\u542C\u8BDD\u8BB0\u5FC6");
  walkWaypoints(silentHall, input, [["\u5802\u524D\u4E1C\u8DEF", 1670, 615], ["\u81EA\u4E3B\u63A2\u7D22\u4E1C\u53E3", 1670, 525, 22]], buildLiuyuanEastHallStudyMap());
  silentHall.nodes.continueChapter.click();
  assert2(
    silentHall.assignedUrl().startsWith("liuyuan-stone-forest.html?route=modern"),
    "\u4E0D\u542C\u82B1\u5320\u4E5F\u987B\u80FD\u7EE7\u7EED\u5230\u77F3\u6797"
  );
  const directHall = boot2("liuyuan-east-hall", "?route=modern&from=flower&draft=1", 0, silentFlower.savedProgress());
  walkWaypoints(directHall, input, [
    ["\u5802\u524D\u901A\u8DEF", 515, 620],
    ["\u5802\u524D\u4E2D\u6BB5", 970, 620],
    ["\u5802\u524D\u4E1C\u8DEF", 1670, 615],
    ["\u672A\u770B\u6811\u76F4\u63A5\u79BB\u9662", 1670, 525, 22]
  ], buildLiuyuanEastHallStudyMap());
  assert2(
    !directHall.nodes.continueChapter.hidden && !directHall.storyFlags().includes("ly-magnolia-seen"),
    "\u4E0D\u770B\u6811\u987B\u80FD\u79BB\u9662\uFF0C\u4E0D\u8865\u9020\u89C2\u5BDF\u4E8B\u4EF6"
  );
  directHall.nodes.continueChapter.click();
  const directStone = boot2(
    "liuyuan-stone-forest",
    directHall.assignedUrl().slice("liuyuan-stone-forest.html".length),
    0,
    directHall.savedProgress()
  );
  walkWaypoints(directStone, input, [["\u7ED5\u77F3\u81F3\u5ECA\u53E3", 530, 450, 25]], buildLiuyuanStoneForestStudyMap());
  assert2(
    !directStone.nodes.toStudyCourt.hidden && directStone.nodes.stageNote.hidden,
    "\u672A\u6309\u770B\u4E5F\u987B\u80FD\u4ECE\u5ECA\u53E3\u7EE7\u7EED\u5BFB\u4EBA\uFF0C\u4E0D\u80FD\u843D\u5165\u7814\u7A76\u6A21\u5F0F"
  );
  directStone.nodes.toStudyCourt.click();
  const directCourt = boot2(
    "liuyuan-study-court",
    directStone.assignedUrl().slice("liuyuan-study-court.html".length),
    0,
    directStone.savedProgress()
  );
  walkWaypoints(directCourt, input, [["\u9662\u4E2D\u77F3\u8DEF", 560, 750], ["\u4E66\u658B\u95E8\u524D", 480, 690, 20]], buildLiuyuanStudyCourtMap());
  directCourt.nodes.look.click();
  directCourt.frame();
  if (input === "keyboard") directCourt.rawKey("2");
  else directCourt.nodes.doorActions.querySelectorAll("[data-choice]").find((button) => button.dataset.choice === "knock").click();
  assert2(directCourt.storyFlags().includes("ly-study-found") && !directCourt.storyFlags().includes("ly-magnolia-seen") && !directCourt.storyFlags().includes("ly-florist-met"), "\u9760\u8FD1\u4E66\u658B\u53E9\u95E8\u53EF\u53D1\u73B0\u4EBA\u7269\uFF0C\u4E0D\u4F9D\u8D56\u82B1\u5320/\u53CC\u6811\u6253\u5361");
  flower.nodes.look.click();
  assert2(
    !flower.nodes.sceneMessage.hidden && flower.nodes.sceneMessage.textContent.includes("\u7CA5\u6876\u5DF2\u653E\u59A5"),
    "\u51FA\u53E3\u53CD\u9988\u4E0D\u80FD\u628A\u5DF2\u4EA4\u7CA5\u8BEF\u62A5\u6210\u672A\u4EA4\u7CA5"
  );
  walkWaypoints(flower, input, [["\u5170\u7A3F\u65C1\u7ECF\u8FC7", 650, 485, 26], ["\u82B1\u5320\u8EAB\u8FB9", 650, 400, 14]], buildLiuyuanFlowerStudyMap());
  flower.nodes.look.click();
  assert2(!flower.nodes.dialogueActions.hidden, `\u9760\u8FD1\u82B1\u5320\u540E\u5E94\u80FD\u95EE\u8BDD\u6216\u770B\u6362\u571F ${flower.foot()} ${flower.nodes.status.textContent} drawing=${flower.nodes.lanternPuzzle.hidden}`);
  assert2(
    flower.nodes.dialoguePrompt.textContent.length > 0,
    "\u82B1\u5320\u5E94\u7B54\u9762\u677F\u5E94\u540C\u65F6\u663E\u793A\u89E6\u53D1\u5B83\u7684\u5BF9\u767D"
  );
  flower.nodes.watchSoil.click();
  assert2(flower.storyFlags().includes("ly-florist-met"), "\u89C2\u5BDF\u6362\u571F\u540E\u5E94\u83B7\u5F97\u7B14\u6811\u7EBF\u7D22");
  flower.nodes.recallClue.click();
  assert2(
    !flower.nodes.sceneMessage.hidden && flower.nodes.sceneMessage.textContent.includes("\u7B14\u6811"),
    "\u56DE\u5FC6\u82B1\u5320\u7EBF\u7D22\u987B\u5728\u753B\u9762\u5185\u663E\u793A"
  );
  walkWaypoints(flower, input, [["\u82B1\u6728\u9662\u4E1C\u53E3", 1675, 445, 35]], buildLiuyuanFlowerStudyMap());
  flower.nodes.continueChapter.click();
  assert2(!flower.nodes.storyTransition.hidden && flower.assignedUrl() === "", "\u82B1\u623F\u51FA\u53E3\u5148\u5448\u73B0\u53D9\u4E8B\u8F6C\u573A\uFF0C\u4E0D\u63D0\u524D\u5207\u9875");
  const transitionProgress = flower.savedProgress();
  const transitionFoot = flower.foot().join();
  flower.key("keydown", "left");
  for (let i = 0; i < 10; i++) flower.frame();
  assert2(
    flower.foot().join() === transitionFoot && flower.savedProgress() === transitionProgress,
    "\u9605\u8BFB\u8F6C\u573A\u4E0D\u80FD\u79FB\u52A8\u4EBA\u7269\u6216\u53D1\u653E\u5956\u52B1"
  );
  if (input === "keyboard") flower.rawKey("Enter");
  else flower.nodes.transitionContinue.click();
  assert2(
    flower.assignedUrl() === "liuyuan-east-hall.html?route=modern&from=flower&draft=1",
    "\u82B1\u5320\u7EBF\u7D22\u540E\u5E94\u53EF\u8D70\u5230\u4E1C\u53E3\uFF0C\u63A5\u5802\u524D\u9662"
  );
  assert2(
    JSON.parse(flower.savedProgress()).arts.yu === 0,
    "\u666E\u901A\u8D70\u8DEF\u4E0D\u53D1\u5FA1\u827A"
  );
  const eastHall = boot2(
    "liuyuan-east-hall",
    flower.assignedUrl().slice("liuyuan-east-hall.html".length),
    0,
    flower.savedProgress()
  );
  walkWaypoints(eastHall, input, [["\u5802\u524D\u5DE6\u6811", 515, 575, 18]], buildLiuyuanEastHallStudyMap());
  eastHall.nodes.look.click();
  assert2(eastHall.storyFlags().includes("ly-magnolia-seen"), "\u4EB2\u773C\u770B\u8FC7\u4E00\u4FA7\u5373\u53EF\u8BB0\u5F55\u89C2\u5BDF\uFF0C\u4E0D\u8981\u6C42\u53CC\u6811\u6253\u5361");
  assert2(
    !eastHall.nodes.sceneMessage.hidden && eastHall.nodes.stageNote.hidden,
    "\u5802\u524D\u89C2\u5BDF\u53CD\u9988\u5E94\u5728\u753B\u9762\u5185\uFF0C\u7AE0\u6D41\u8C03\u8BD5\u5361\u5E94\u9690\u85CF"
  );
  walkWaypoints(eastHall, input, [
    ["\u5802\u524D\u4E2D\u6BB5", 970, 620],
    ["\u5802\u524D\u53F3\u6811", 1390, 615, 20]
  ], buildLiuyuanEastHallStudyMap());
  eastHall.nodes.look.click();
  assert2(eastHall.storyFlags().includes("ly-magnolia-seen"), "\u518D\u770B\u53E6\u4E00\u4FA7\u4ECD\u4FDD\u7559\u539F\u89C2\u5BDF\u8BB0\u5F55");
  walkWaypoints(eastHall, input, [
    ["\u5802\u524D\u4E1C\u8DEF", 1670, 615],
    ["\u77F3\u6797\u8F6C\u573A", 1670, 525, 22]
  ], buildLiuyuanEastHallStudyMap());
  eastHall.nodes.continueChapter.click();
  assert2(
    eastHall.assignedUrl() === "liuyuan-stone-forest.html?route=modern&from=east-hall&draft=1",
    "\u5802\u524D\u4E1C\u53E3\u5E94\u63A5\u77F3\u6797\uFF0C\u4FDD\u7559\u8349\u7A3F\u9884\u89C8"
  );
  const stone = boot2(
    "liuyuan-stone-forest",
    eastHall.assignedUrl().slice("liuyuan-stone-forest.html".length),
    0,
    eastHall.savedProgress()
  );
  walkWaypoints(stone, input, [["\u8F69\u524D\u77F3\u9636", 530, 450, 25]], buildLiuyuanStoneForestStudyMap());
  stone.nodes.look.click();
  stone.frame();
  assert2(
    !stone.nodes.sceneMessage.hidden && stone.nodes.stageNote.hidden,
    "\u77F3\u6797\u8F69\u524D\u53CD\u9988\u5E94\u5728\u753B\u9762\u5185\uFF0C\u7AE0\u6D41\u8C03\u8BD5\u5361\u5E94\u9690\u85CF"
  );
  assert2(
    !stone.nodes.toStudyCourt.hidden,
    `\u5728\u63D6\u5CF0\u8F69\u5916\u89C2\u5BDF\u540E\u5E94\u663E\u51FA\u4E66\u658B\u9662\u8F6C\u573A\uFF1A\u811A\u70B9 ${stone.foot().join()}\uFF0C\u63D0\u793A ${stone.nodes.status.textContent}\uFF0C\u6A21\u5F0F ${stone.nodes.modeBadge.textContent}`
  );
  assert2(
    stone.nodes.toGuanyun.hidden && stone.nodes.toWindowStudy.hidden,
    "\u6B63\u5F0F\u5BFB\u4EBA\u8DEF\u7EBF\u4E0D\u5E94\u663E\u793A\u5C1A\u672A\u63A5\u6545\u4E8B\u7684\u7814\u7A76\u8DF3\u9875\u6309\u94AE"
  );
  stone.rawKey("f");
  assert2(stone.assignedUrl() === "", "\u6B63\u5F0F\u8DEF\u7EBF\u6309 F \u4E0D\u5E94\u88AB\u7814\u7A76\u5207\u7247\u622A\u8D70");
  stone.nodes.toStudyCourt.click();
  assert2(
    stone.assignedUrl() === "liuyuan-study-court.html?route=modern&from=stone-forest&draft=1",
    "\u77F3\u6797\u7ECF\u8F69\u524D\u624D\u53EF\u63A5\u4E66\u658B\u9662"
  );
  const studyCourt = boot2(
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
  assert2(!studyCourt.nodes.doorActions.hidden, "\u4E66\u658B\u95E8\u524D\u542C\u5230\u7EB8\u58F0\u540E\u5E94\u51FA\u73B0\u8F7B\u53E9\u9009\u62E9");
  assert2(
    studyCourt.nodes.stageNote.hidden && studyCourt.nodes.doorPrompt.textContent.includes("\u7EB8"),
    "\u4E66\u658B\u95E8\u524D\u5E94\u5728\u753B\u9762\u4E2D\u542C\u89C1\u7EB8\u58F0\uFF0C\u4E0D\u80FD\u53EA\u5728\u4FA7\u680F\u7ED9\u9009\u9879"
  );
  if (input === "keyboard") studyCourt.rawKey("2");
  else studyCourt.nodes.doorActions.querySelectorAll("[data-choice]").find((button) => button.dataset.choice === "knock").click();
  assert2(studyCourt.storyFlags().includes("ly-study-found"), "\u5B9E\u9645\u8F7B\u53E9\u95E8\u540E\u624D\u8BB0\u5F55\u627E\u5230\u4E66\u658B");
  assert2(
    studyCourt.nodes.interiorResearch.href === "liuyuan-study-interior.html?route=modern&from=study-court&draft=1",
    "\u8F7B\u53E9\u540E\u5E94\u63A5\u4E66\u658B\u5185\u666F\u5E76\u4FDD\u7559\u8349\u7A3F\u53C2\u6570"
  );
  let interior = boot2(
    "liuyuan-study-interior",
    studyCourt.nodes.interiorResearch.href.slice("liuyuan-study-interior.html".length),
    0,
    studyCourt.savedProgress()
  );
  const reloadInterior = () => {
    interior.pagehide();
    const progressBefore = interior.savedProgress();
    interior = boot2(
      "liuyuan-study-interior",
      "?route=modern&from=study-court&draft=1",
      0,
      progressBefore,
      void 0,
      false,
      interior.sessionRecords
    );
    assert2(interior.savedProgress() === progressBefore, "\u4E66\u658B\u5237\u65B0\u53EA\u6062\u590D\u4F1A\u8BDD\uFF0C\u4E0D\u91CD\u5199\u7AE0\u8282\u6216\u5956\u52B1");
  };
  walkWaypoints(interior, input, [
    ["\u4E66\u658B\u4E2D\u592E", 770, 650],
    ["\u6284\u4E66\u4EBA\u6848\u524D", 630, 610, 22]
  ], buildLiuyuanStudyInteriorMap());
  interior.frame();
  assert2(
    !interior.nodes.answerChoices.hidden && interior.storyFlags().includes("ly-scholar-met"),
    "\u8D70\u8FD1\u6284\u4E66\u4EBA\u624D\u5E94\u5F00\u542F\u5E94\u7B54\u5E76\u8BB0\u5F55\u76F8\u89C1"
  );
  assert2(
    interior.nodes.stageNote.hidden && interior.nodes.answerPrompt.textContent.includes("\u95E8\u522B\u5173"),
    "\u6284\u4E66\u4EBA\u7684\u9996\u53E5\u4E0E\u5E94\u7B54\u5E94\u4E00\u8D77\u51FA\u73B0\u5728\u753B\u9762\u5185"
  );
  if (input === "keyboard") interior.rawKey("1");
  else interior.nodes.answerChoices.querySelectorAll("[data-answer]")[1].click();
  walkWaypoints(interior, input, [["\u4E66\u6848\u8FB9", 480, 610, 20]], buildLiuyuanStudyInteriorMap());
  interior.nodes.look.click();
  if (input === "touch") {
    walkWaypoints(interior, input, [["\u53EF\u9009\u5148\u770B\u7A97\u8FB9", 815, 540, 10]], buildLiuyuanStudyInteriorMap());
    interior.nodes.look.click();
  }
  reloadInterior();
  walkWaypoints(interior, input, [["\u5237\u65B0\u540E\u8D70\u5230\u4E2D\u592E", 770, 650], ["\u518D\u5230\u6284\u4E66\u4EBA\u65C1", 630, 610, 22]], buildLiuyuanStudyInteriorMap());
  interior.nodes.look.click();
  interior.frame();
  assert2(!interior.nodes.paperChoices.hidden, "\u6284\u4E66\u4EBA\u5377\u7EB8\u53C8\u653E\u4E0B\u65F6\u5E94\u51FA\u73B0\u8FFD\u95EE\u9009\u62E9");
  assert2(
    interior.nodes.paperPrompt.textContent.includes("\u7EB8") && interior.nodes.paperPrompt.textContent.includes("\u6838\u4E00\u6838"),
    "\u540C\u4E00\u6B21\u4EA4\u8C08\u987B\u5728\u753B\u9762\u5185\u4EA4\u4EE3\u6838\u672C\u6258\u4ED8\u4E0E\u5377\u7EB8\u52A8\u4F5C"
  );
  if (input === "keyboard") interior.rawKey("1");
  else interior.nodes.paperChoices.querySelectorAll("[data-paper-answer]")[1].click();
  assert2(interior.storyFlags().includes("ly-scholar-trouble-known"), "\u542C\u8FC7\u7EB8\u51FA\u95E8\u7684\u96BE\u9898\u624D\u63A8\u8FDB\u5267\u60C5");
  const oldInterior = boot2(
    "liuyuan-study-interior",
    "?route=modern&from=study-court&draft=1",
    0,
    interior.savedProgress()
  );
  oldInterior.frame();
  assert2(oldInterior.nodes.leafResearchLink.hidden, "\u65E0\u4F1A\u8BDD\u8BB0\u5F55\u7684\u65E7\u6863\u53EA\u77E5\u7EB8\u5F20\u5904\u5883\uFF0C\u4E0D\u80FD\u81EA\u52A8\u7B97\u4F5C\u53D1\u73B0\u65B0\u53F6");
  reloadInterior();
  interior.frame();
  assert2(interior.nodes.leafResearchLink.hidden, "\u53EA\u77E5\u7EB8\u5F20\u5904\u5883\u5237\u65B0\u4E0D\u5F97\u63D0\u524D\u6253\u5F00\u9898\u53F6\u5165\u53E3");
  walkWaypoints(interior, input, [["\u4E2D\u592E\u518D\u5165\u7A97\u8FB9", 770, 650], ["\u518D\u770B\u7A97\u5916\u53F6", 815, 540, 10]], buildLiuyuanStudyInteriorMap());
  interior.nodes.look.click();
  reloadInterior();
  assert2(interior.nodes.leafResearchLink.hidden, "\u770B\u8FC7\u65B0\u53F6\u4F46\u5C1A\u672A\u7ED3\u675F\u4EA4\u8C08\u65F6\uFF0C\u5237\u65B0\u4ECD\u4E0D\u80FD\u63D0\u524D\u6536\u675F");
  walkWaypoints(interior, input, [["\u4E2D\u592E\u518D\u5165\u6848\u524D", 770, 650], ["\u56DE\u5230\u6284\u4E66\u4EBA\u65C1", 630, 610, 22]], buildLiuyuanStudyInteriorMap());
  interior.nodes.look.click();
  reloadInterior();
  walkWaypoints(interior, input, [["\u8D70\u56DE\u95E8\u69DB", 770, 890, 25]], buildLiuyuanStudyInteriorMap());
  interior.frame();
  assert2(!interior.nodes.leafResearchLink.hidden, `\u4EBA\u7269\u5BF9\u767D\u7ED3\u675F\u540E\u4ECD\u987B\u8D70\u56DE\u95E8\u69DB\u624D\u663E\u51FA\u9898\u53F6\u5165\u53E3 ${interior.nodes.status.textContent} ${JSON.stringify(interior.sessionRecords)}`);
  assert2(
    interior.nodes.leafResearchLink.children[0].href === "liuyuan-leaf-writing-study.html?route=modern&from=study-interior&draft=1",
    "\u9898\u53F6\u7279\u5199\u94FE\u63A5\u5E94\u7EE7\u627F\u7AE0\u8282\u4E0E\u8349\u7A3F\u53C2\u6570"
  );
  let leaf = boot2(
    "liuyuan-leaf-writing-study",
    interior.nodes.leafResearchLink.children[0].href.slice("liuyuan-leaf-writing-study.html".length),
    0,
    interior.savedProgress()
  );
  const leafAct = (name, number) => {
    if (input === "keyboard") leaf.rawKey(number);
    else {
      const button = leaf.leafActions.get(name);
      assert2(button, `\u9898\u53F6\u7F3A\u5C11 ${name} \u89E6\u5C4F\u6309\u94AE`);
      button.click();
    }
  };
  assert2(leaf.nodes.variantWords.textContent.includes("\u79FB\u6B65\u666F\u5F02") && leaf.nodes.variantWords.textContent.includes("\u666F\u540C"), "\u9898\u53F6\u987B\u663E\u793A\u539F\u53E5\u53CA\u56DE\u5FC6\u4E2D\u7684\u5DEE\u522B\uFF0C\u4E0D\u80FD\u53EA\u8BA9\u73A9\u5BB6\u6284\u7A7A\u767D");
  leafAct("old", "1");
  assert2(!leaf.storyFlags().includes("ly-leaf-picked"), "\u67E5\u770B\u8001\u53F6\u4E0D\u5E94\u63D0\u524D\u8BB0\u5F55\u6458\u53F6");
  leafAct("new", "2");
  assert2(leaf.storyFlags().includes("ly-leaf-picked"), "\u4EB2\u624B\u6311\u65B0\u53F6\u624D\u8BB0\u5F55\u6458\u53F6");
  leafAct("test-ink", "1");
  leafAct("hard-write", "1");
  assert2(leaf.nodes.supportControls.hidden === false, "\u7528\u529B\u5199\u5931\u8D25\u540E\u5E94\u7559\u5728\u6258\u53F6\u9009\u62E9");
  leafAct("take-board", "2");
  if (input === "keyboard") {
    leaf.rawKey("1");
    leaf.rawKey("ArrowRight");
    leaf.blur();
    assert2(!leaf.storyFlags().includes("ly-leaf-written") && leaf.nodes.strokeControls.hidden === false, "\u534A\u7B14\u5931\u7126\u4E0D\u80FD\u5956\u52B1\u6216\u56DE\u9000\u5230\u9009\u53F6");
    leaf.rawKey("1");
    leaf.rawKey("ArrowUp");
    assert2(leaf.nodes.leafStatus.textContent.includes("\u65B9\u5411\u504F"), "\u65B9\u5411\u9519\u8BEF\u987B\u89E3\u91CA\u4E14\u5141\u8BB8\u672C\u6BB5\u91CD\u8BD5");
  }
  for (let index = 0; index < 3; index++) {
    if (input === "keyboard") leaf.rawKey(String(index + 1));
    else {
      const box = leaf.nodes.leafScene.getBoundingClientRect();
      const view = leafTraceView(index);
      const pointer = (point) => ({ pointerId: 7, button: 0, clientX: box.left + (point.x - view.x) * box.width / view.w, clientY: box.top + (point.y - view.y) * box.height / view.h, preventDefault() {
      } });
      const path = LEAF_TRACE_PATHS[index];
      leaf.nodes.leafScene.dispatch("pointerdown", pointer(path[0]));
      leaf.nodes.leafScene.dispatch("pointerup", { ...pointer(path[0]), pointerId: 8 });
      for (const point of path.slice(1)) leaf.nodes.leafScene.dispatch("pointermove", pointer(point));
      leaf.nodes.leafScene.dispatch("pointerup", pointer(path[path.length - 1]));
    }
    if (input === "keyboard") {
      const directions = [["ArrowRight", "ArrowDown", "ArrowLeft"], ["ArrowUp", "ArrowRight", "ArrowDown"], ["ArrowRight", "ArrowDown"]];
      assert2(leaf.nodes.doneControls.hidden, "\u6309\u6570\u5B57\u843D\u7B14\u4E0D\u80FD\u76F4\u63A5\u5B8C\u6210\u4E34\u5199");
      for (const direction of directions[index]) leaf.rawKey(direction);
    }
    if (index === 0) {
      leaf.rawKey("2");
      leaf.rawKey("ArrowUp");
      leaf.pagehide();
      const beforeReload = leaf.savedProgress();
      leaf = boot2(
        "liuyuan-leaf-writing-study",
        interior.nodes.leafResearchLink.children[0].href.slice("liuyuan-leaf-writing-study.html".length),
        0,
        beforeReload,
        void 0,
        false,
        leaf.sessionRecords
      );
      assert2(
        leaf.savedProgress() === beforeReload && leaf.nodes.leafStatus.textContent.includes("\u5DF2\u5199\u597D\u7684 1 \u6BB5"),
        "\u5237\u65B0\u987B\u4FDD\u7559\u4E00\u6BB5\u5B8C\u6574\u7B14\u8DEF\u3001\u4E22\u5F03\u534A\u7B14\u4E14\u4E0D\u7ED3\u7B97\u4E66\u827A"
      );
      assert2(!leaf.storyFlags().includes("ly-leaf-written"), "\u6062\u590D\u5230\u534A\u9014\u4E0D\u80FD\u4F2A\u9020\u5B8C\u6210");
    }
  }
  assert2(
    leaf.storyFlags().includes("ly-leaf-written") && !leaf.nodes.doneControls.hidden,
    "\u4E09\u5904\u4F9D\u6B21\u843D\u7B14\u540E\u624D\u5B8C\u6210\u9898\u53F6"
  );
  assert2(leaf.nodes.variantWords.textContent.includes("\u56DE\u5E9C\u5B66\u518D\u5BF9\u539F\u672C"), "\u9898\u5B8C\u7559\u4E0B\u6838\u7248\u672C\u7684\u4E0B\u4E00\u6B65\uFF0C\u4E0D\u80FD\u76F4\u63A5\u5224\u54EA\u672C\u6B63\u786E");
  assert2(JSON.parse(leaf.savedProgress()).knowledge.filter((value) => value === "liuyuan-garden-note-variant").length === 1, "\u9996\u6B21\u9898\u53F6\u987B\u7559\u4E0B\u53EF\u56DE\u770B\u7684\u56ED\u8BB0\u8BB0\u5F55\u4E14\u4E0D\u91CD\u590D");
  const leafProgress = JSON.parse(leaf.savedProgress());
  assert2(
    leafProgress.arts.shu === 1 && leafProgress.storyFlags.length === 13,
    "\u7A7A\u5B58\u6863\u5230\u9898\u53F6\u5E94\u4F9D\u5E8F\u5F97\u5230 13 \u4E2A\u4E8B\u4EF6\u5E76\u53EA\u53D1\u4E00\u6B21\u4E66\u827A"
  );
  assert2(
    leaf.nodes.returnFromDone.href === "liuyuan-study-court.html?route=modern&from=leaf&draft=1&return=1",
    "\u9898\u53F6\u5B8C\u6210\u540E\u5E94\u5E26\u8FD4\u7A0B\u4E0E\u8349\u7A3F\u53C2\u6570\u56DE\u4E66\u658B\u9662"
  );
  const journal = boot2("journal", "", 0, leaf.savedProgress());
  assert2(!journal.nodes.variantRecord.hidden && journal.nodes.variantAcademy.textContent.includes("\u666F\u540C") && journal.nodes.variantLeaf.textContent.includes("\u666F\u5F02"), "\u9898\u53F6\u4E4B\u540E\u56ED\u8C31\u987B\u80FD\u9010\u5B57\u5BF9\u7167\u4E24\u79CD\u8BB0\u5F55");
  assert2(journal.savedProgress() === leaf.savedProgress(), "\u7FFB\u770B\u5F02\u6587\u4E0D\u5199\u5956\u52B1\u4E0E\u8FDB\u5EA6");
  assert2(
    journal.nodes.currentObjective.textContent.includes("\u53D6\u7A7A\u6876") && journal.nodes.variantHomeLink.href === "liuyuan-study-court.html?route=modern&from=leaf&return=1",
    "\u9898\u53F6\u540E\u672A\u51FA\u56ED\u7684\u56ED\u8C31\u987B\u5148\u63A5\u6536\u53F6\u53D6\u6876\uFF0C\u4E0D\u5F97\u8DF3\u53BB\u5C1A\u672A\u5F00\u653E\u7684\u5E9C\u5B66\u6838\u672C"
  );
  assert2(journal.nodes.liuyuanWritingReward.textContent.includes("\u4E66 +1") && !journal.nodes.liuyuanGuardReward.textContent.includes("\u5FA1 +1"), "\u672C\u7AE0\u5956\u52B1\u53EA\u6309\u5B9E\u9645\u4EFB\u52A1\u7ED3\u7B97\uFF0C\u4E0D\u501F\u7528\u5176\u4ED6\u7AE0\u5168\u5C40\u5C5E\u6027");
  const foreignArtProgress = JSON.parse(leaf.savedProgress());
  foreignArtProgress.arts.yu = 9;
  const foreignArtJournal = boot2("journal", "", 0, JSON.stringify(foreignArtProgress));
  assert2(
    !foreignArtJournal.nodes.liuyuanGuardReward.textContent.includes("\u5FA1 +1"),
    "\u5DF2\u6709\u5176\u4ED6\u9014\u5F84\u5FA1\u5C5E\u6027\u4F46\u6CA1\u5B8C\u6210\u672C\u7AE0\u62A4\u753B\u65F6\uFF0C\u4E0D\u5F97\u5192\u79F0\u672C\u7AE0\u5956\u52B1"
  );
  const ongoingEntry = boot2("liuyuan-entry", "?playtest=1&draft=1", 0, leaf.savedProgress());
  assert2(!ongoingEntry.nodes.continueSavedStory.hidden && ongoingEntry.nodes.continueSavedStory.href === "liuyuan-study-court.html?route=modern&from=leaf&return=1&draft=1&playtest=1" && ongoingEntry.savedProgress() === leaf.savedProgress(), "\u4E2D\u9014\u91CD\u65B0\u6253\u5F00\u9996\u9875\u987B\u6709\u53EA\u8BFB\u7EED\u73A9\u4E66\u7B7E\uFF0C\u4E0D\u80FD\u8865\u9020\u4E8B\u4EF6");
  completedProgressByInput.set(input, leaf.savedProgress());
}
console.log("\u7A7A\u5B58\u6863\u2192\u9001\u7CA5\u2192\u5939\u5F04\u2192\u5C0F\u5EAD\u2192\u4E34\u6C60\u2192\u82B1\u6728\u9662\u2192\u5802\u524D\u53CC\u6811\u2192\u77F3\u6797\u2192\u4E66\u658B\u4EBA\u7269\u2192\u4EB2\u624B\u9898\u53F6\uFF1A\u952E\u76D8/\u89E6\u5C4F\u6B63\u5411\u52A8\u4F5C\u94FE\u901A\u8FC7\u3002");
for (const input of ["keyboard", "touch"]) {
  const studyCourt = boot2(
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
  assert2(
    studyCourt.assignedUrl() === "liuyuan-stone-forest.html?route=modern&from=study-court&draft=1&return=1",
    "\u4E66\u658B\u9662\u8FD4\u7A0B\u5E94\u63A5\u77F3\u6797\uFF0C\u5E76\u4FDD\u7559\u8349\u7A3F\u9884\u89C8"
  );
  const stone = boot2(
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
  assert2(
    stone.assignedUrl() === "liuyuan-east-hall.html?route=modern&from=stone-forest&draft=1&return=1",
    "\u77F3\u6797\u8FD4\u7A0B\u5E94\u63A5\u5802\u524D\u9662\uFF0C\u5E76\u4FDD\u7559\u8349\u7A3F\u9884\u89C8"
  );
  const eastHall = boot2(
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
  assert2(
    eastHall.assignedUrl() === "liuyuan-flower.html?route=modern&from=east-hall&draft=1&return=1",
    "\u5802\u524D\u9662\u8FD4\u7A0B\u5E94\u63A5\u82B1\u6728\u9662\uFF0C\u5E76\u4FDD\u7559\u8349\u7A3F\u9884\u89C8"
  );
  const flower = boot2(
    "liuyuan-flower",
    eastHall.assignedUrl().slice("liuyuan-flower.html".length),
    0,
    eastHall.savedProgress()
  );
  const hold = (direction) => input === "keyboard" ? flower.key("keydown", direction) : flower.pointer("pointerdown", direction);
  const release = (direction) => input === "keyboard" ? flower.key("keyup", direction) : flower.pointer("pointerup", direction);
  let position = flower.foot();
  assert2(position[0] > 1600 && position[1] < 500, "\u8FD4\u7A0B\u5E94\u4ECE\u82B1\u6728\u9662\u4E1C\u4FA7\u51FA\u751F");
  hold("down");
  for (let i = 0; i < 40; i++) flower.frame();
  release("down");
  position = flower.foot();
  assert2(position[1] >= 495 && position[1] <= 515, "\u4E1C\u4FA7\u901A\u9053\u5E94\u53EF\u4E0B\u884C\u5230\u82B1\u5320\u78B0\u649E\u76D2\u5357\u4FA7");
  hold("left");
  for (let i = 0; i < 850; i++) {
    flower.frame();
    if (i % 20 === 19 && flower.foot()[0] < 550) break;
  }
  release("left");
  position = flower.foot();
  assert2(position[0] < 550 && position[0] > 350, "\u7ED5\u8FC7\u82B1\u5320\u540E\u5E94\u5230\u8FBE\u7A7A\u6876\u9644\u8FD1");
  flower.nodes.look.click();
  assert2(
    flower.nodes.leafCarryActions && !flower.nodes.leafCarryActions.hidden,
    "\u8FD1\u6876\u89C2\u5BDF\u540E\u5E94\u51FA\u73B0\u6536\u53F6\u9009\u62E9"
  );
  assert2(
    flower.nodes.leafCarryPrompt.textContent.includes("\u6E7F\u58A8"),
    "\u6536\u53F6\u9009\u62E9\u5E94\u5728\u573A\u666F\u5185\u4EA4\u4EE3\u6E7F\u58A8\u96BE\u9898"
  );
  assert2(flower.nodes.returnWithStory.hidden, "\u672A\u6536\u53F6\u4E0D\u5F97\u63D0\u4F9B\u538B\u7F29\u8FD4\u7A0B");
  flower.nodes.returnWithStory.click();
  assert2(flower.nodes.storyTransition.hidden && flower.assignedUrl() === "", "\u672A\u6536\u53F6\u6309\u8F6C\u573A\u4E0D\u5F97\u7ED5\u8FC7\u7A7A\u6876");
  flower.nodes.placeInBucket.click();
  assert2(flower.storyFlags().includes("ly-leaf-carried"), "\u4EB2\u624B\u6536\u53F6\u5165\u6876\u624D\u53EF\u5199 ly-leaf-carried");
  const carriedJournal = boot2("journal", "?playtest=1&draft=1", 0, flower.savedProgress());
  assert2(carriedJournal.nodes.variantHomeLink.href === "liuyuan-entry.html?route=modern&from=flower&draft=1&return=1&playtest=1" && carriedJournal.nodes.currentObjective.textContent.includes("\u4EA4\u8FD8\u4E54\u79BE"), "\u5DF2\u6536\u53F6\u56ED\u8C31\u5E94\u63A5\u4EA4\u6876\uFF0C\u4FDD\u7559\u8349\u7A3F/\u8BD5\u73A9\u53C2\u6570");
  hold("right");
  for (let i = 0; i < 250; i++) {
    flower.frame();
    if (i % 20 === 19 && flower.foot()[0] > 770) break;
  }
  release("right");
  position = flower.foot();
  assert2(position[0] > 770 && position[0] < 910, "\u63D0\u7A7A\u6876\u540E\u5E94\u53EF\u6CBF\u9662\u5730\u8D70\u56DE\u5165\u53E3\u811A\u70B9");
  const compactFlower = boot2(
    "liuyuan-flower",
    "?route=modern&from=east-hall&draft=1&return=1",
    0,
    flower.savedProgress()
  );
  walkWaypoints(compactFlower, input, [
    ["\u82B1\u623F\u4E1C\u4FA7", 1720, 510],
    ["\u7ED5\u8FC7\u82B1\u5320\u5357\u4FA7", 650, 510],
    ["\u6CBF\u9662\u8DEF\u56DE\u5165\u53E3", 810, 510]
  ], buildLiuyuanFlowerStudyMap());
  assert2(!compactFlower.nodes.returnWithStory.hidden, "\u6536\u53F6\u540E\u7684\u539F\u9662\u53E3\u5E94\u63D0\u4F9B\u538B\u7F29\u8FD4\u7A0B\uFF0C\u4ECD\u53EF\u81EA\u884C\u539F\u8DEF\u8D70");
  const compactProgress = compactFlower.savedProgress();
  compactFlower.nodes.returnWithStory.click();
  assert2(!compactFlower.nodes.storyTransition.hidden && compactFlower.assignedUrl() === "" && compactFlower.savedProgress() === compactProgress, "\u8FD4\u7A0B\u8F6C\u573A\u4E0D\u53EF\u63D0\u524D\u51FA\u56ED\u6216\u53D1\u5956\u52B1");
  const compactFoot = compactFlower.foot().join();
  if (input === "keyboard") compactFlower.key("keydown", "left");
  else compactFlower.pointer("pointerdown", "left");
  for (let i = 0; i < 10; i++) compactFlower.frame();
  assert2(compactFlower.foot().join() === compactFoot, "\u8BFB\u8FD4\u7A0B\u8F6C\u573A\u987B\u51BB\u7ED3\u79FB\u52A8");
  if (input === "keyboard") compactFlower.rawKey("Enter");
  else compactFlower.nodes.transitionContinue.click();
  assert2(
    compactFlower.assignedUrl() === "liuyuan-entry.html?route=modern&from=flower&draft=1&return=1",
    "\u538B\u7F29\u8FD4\u7A0B\u4FDD\u7559\u5B9E\u9645\u6765\u6E90\u4E0E\u8349\u7A3F\u53C2\u6570"
  );
  const compactEntry = boot2(
    "liuyuan-entry",
    compactFlower.assignedUrl().slice("liuyuan-entry.html".length),
    0,
    compactFlower.savedProgress()
  );
  assert2(
    compactEntry.nodes.chapterComplete.hidden && !compactEntry.storyFlags().includes("ly-unlocked"),
    "\u538B\u7F29\u884C\u8D70\u53EA\u62B5\u5939\u5F04\u5185\u7AEF\uFF0C\u4E0D\u5F97\u81EA\u52A8\u5B8C\u6210\u95E8\u623F\u4E0E\u8FD8\u6876"
  );
  walkWaypoints(compactEntry, input, LIUYUAN_ALLEY_RETURN_CHECKPOINTS.slice(0, -1).map((point) => [point.label, point.x, point.y, 12]), { ...buildLiuyuanEntryStudyMap(), obstacles: [] });
  assert2(!compactEntry.storyFlags().includes("ly-unlocked"), "\u538B\u7F29\u8FD4\u7A0B\u62B5\u95E8\u69DB\u4ECD\u4E0D\u80FD\u63D0\u524D\u7ED3\u7B97");
  compactEntry.nodes.interact.click();
  compactEntry.nodes.nextLine.click();
  if (input === "keyboard") compactEntry.rawKey("1");
  else compactEntry.nodes.choices.children[0].click();
  compactEntry.nodes.interact.click();
  compactEntry.nodes.interact.click();
  walkWaypoints(compactEntry, input, [["\u771F\u5B9E\u8857\u9762", 520, 656, 10]], { ...buildLiuyuanEntryStudyMap(), obstacles: [] });
  assert2(!compactEntry.storyFlags().includes("ly-unlocked") && compactEntry.nodes.chapterComplete.hidden, "\u5230\u8857\u9762\u4F46\u672A\u4EA4\u6876\u4E0D\u80FD\u81EA\u52A8\u7ED3\u675F");
  if (input === "keyboard") compactEntry.rawKey("e");
  else compactEntry.nodes.interact.click();
  assert2(compactEntry.storyFlags().includes("ly-unlocked"), "\u538B\u7F29\u8FD4\u7A0B\u4ECD\u987B\u4EB2\u81EA\u8FC7\u95E8\u69DB\u5230\u8857\u9762\u5B8C\u6210");
  flower.nodes.toLvyinReturn.click();
  assert2(
    flower.assignedUrl() === "liuyuan-lvyin.html?route=modern&from=flower&draft=1&return=1",
    "\u56DE\u4E34\u6C60\u8F6C\u573A\u5E94\u5E26\u4E0A\u7AE0\u8282\u8FD4\u7A0B\u4E0E\u7F16\u8F91\u5668\u8349\u7A3F\u9884\u89C8"
  );
  const lvyin = boot2(
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
  assert2(
    lvyin.assignedUrl() === "liuyuan-court.html?route=modern&from=lvyin&draft=1&return=1",
    "\u6CBF\u4E34\u6C60\u77F3\u8DEF\u5230\u4E1C\u4FA7\u540E\u5E94\u80FD\u8F6C\u573A\u5C0F\u5EAD\uFF0C\u5E76\u4FDD\u7559\u8349\u7A3F\u9884\u89C8"
  );
  let court = boot2(
    "liuyuan-court",
    lvyin.assignedUrl().slice("liuyuan-court.html".length),
    0,
    lvyin.savedProgress()
  );
  walkWaypoints(court, input, [["\u5C0F\u5EAD\u897F\u5ECA\u4E2D\u9014", 340, 450]], buildLiuyuanCourtStudyMap());
  court.pagehide();
  const returnCourtFoot = court.foot().join();
  court = boot2(
    "liuyuan-court",
    "?route=modern&from=lvyin&draft=1&return=1",
    0,
    court.savedProgress(),
    void 0,
    false,
    court.sessionRecords
  );
  assert2(court.foot().join() === returnCourtFoot, "\u5C0F\u5EAD\u8FD4\u7A0B\u5237\u65B0\u987B\u4FDD\u7559\u811A\u70B9");
  walkWaypoints(court, input, [
    ["\u5C0F\u5EAD\u897F\u5ECA\u4E0B\u884C", 340, 450],
    ["\u5C0F\u5EAD\u6298\u89D2", 405, 550],
    ["\u5EAD\u4E2D\u897F\u4FA7", 610, 625],
    ["\u5EAD\u4E2D\u77F3\u8DEF", 790, 670],
    ["\u7A97\u4E0B\u77F3\u8DEF", 1170, 680],
    ["\u5939\u5F04\u53E3", 1560, 680, 45]
  ], buildLiuyuanCourtStudyMap());
  court.nodes.toEntryReturn.click();
  assert2(
    court.assignedUrl() === "liuyuan-entry.html?route=modern&from=court&draft=1&return=1",
    "\u6CBF\u5C0F\u5EAD\u77F3\u8DEF\u5230\u5939\u5F04\u53E3\u540E\u5E94\u80FD\u8F6C\u573A\u5165\u53E3\uFF0C\u5E76\u4FDD\u7559\u8349\u7A3F\u9884\u89C8"
  );
  let entry = boot2(
    "liuyuan-entry",
    court.assignedUrl().slice("liuyuan-entry.html".length),
    0,
    court.savedProgress()
  );
  const reloadReturn = () => {
    entry.pagehide();
    const footBefore = entry.foot();
    entry = boot2(
      "liuyuan-entry",
      "?route=modern&from=court&draft=1&return=1",
      0,
      entry.savedProgress(),
      void 0,
      false,
      entry.sessionRecords
    );
    assert2(entry.foot().join() === footBefore.join(), `${input} \u8FD4\u7A0B\u5237\u65B0\u5E94\u6062\u590D\u539F\u978B\u5E95`);
  };
  assert2(entry.nodes.chapterComplete?.hidden, "\u672A\u8D70\u8FD4\u7A0B\u5939\u5F04\u65F6\u4E0D\u53EF\u663E\u793A\u7AE0\u672B\u7ED3\u7B97");
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
  assert2(!entry.storyFlags().includes("ly-unlocked"), "\u7AD9\u5728\u95E8\u69DB\u5185\u4E0D\u53EF\u63D0\u524D\u7ED3\u7B97\u51FA\u56ED");
  entry.nodes.interact.click();
  assert2(
    !entry.nodes.dialogue?.hidden && entry.nodes.speaker?.textContent === "\u95E8\u623F",
    "\u95E8\u69DB\u524D\u5E94\u7531\u95E8\u623F\u4EBA\u7269\u89E6\u53D1\u5E94\u7B54"
  );
  entry.nodes.nextLine.click();
  assert2(entry.nodes.choices?.children.length === 2, "\u95E8\u623F\u5E94\u6709\u4E24\u79CD\u53EF\u9009\u5E94\u7B54");
  if (input === "keyboard") entry.rawKey("1");
  else entry.nodes.choices.children[0].click();
  entry.nodes.interact.click();
  entry.nodes.interact.click();
  reloadReturn();
  assert2(entry.nodes.status.textContent.includes("\u95E8\u623F\u5DF2\u8BA9\u5F00"), "\u95E8\u623F\u5E94\u7B54\u540E\u5237\u65B0\u4E0D\u5E94\u518D\u62E6\u8DEF");
  assert2(
    !entry.storyFlags().includes("ly-unlocked") && entry.nodes.chapterComplete.hidden,
    "\u95E8\u623F\u5DF2\u7ECF\u8BA9\u8DEF\u4F46\u73A9\u5BB6\u672A\u8E0F\u8857\u9762\u65F6\u4ECD\u4E0D\u53EF\u7ED3\u7B97"
  );
  walkWaypoints(entry, input, [[
    "\u8857\u9762\u811A\u70B9",
    LIUYUAN_ALLEY_RETURN_CHECKPOINTS.at(-1).x,
    LIUYUAN_ALLEY_RETURN_CHECKPOINTS.at(-1).y,
    10
  ]], { ...buildLiuyuanEntryStudyMap(), obstacles: [] });
  assert2(!entry.storyFlags().includes("ly-unlocked") && entry.nodes.chapterComplete.hidden, "\u5230\u8857\u9762\u4F46\u672A\u4EA4\u6876\u4E0D\u80FD\u81EA\u52A8\u7ED3\u675F");
  reloadReturn();
  assert2(entry.nodes.interactionCue.textContent.includes("\u4EA4\u8FD8\u4E54\u79BE"), "\u672A\u8FD8\u6876\u5237\u65B0\u5FC5\u987B\u6062\u590D\u4EA4\u6876\u63D0\u793A\uFF0C\u4E0D\u63D0\u524D\u7ED3\u7B97");
  if (input === "keyboard") entry.rawKey("e");
  else entry.nodes.interact.click();
  assert2(
    entry.storyFlags().includes("ly-unlocked") && !entry.nodes.chapterComplete.hidden,
    "\u95E8\u623F\u5E94\u7B54\u540E\u771F\u6B63\u8E0F\u5230\u8857\u9762\u624D\u53EF\u7ED3\u7B97\u7559\u56ED\u7AE0"
  );
  assert2(entry.nodes.chapterEcho.textContent.includes("\u4EB2\u624B\u8BD5\u8FC7"), "\u8DF3\u8FC7\u62A4\u753B\u7684\u7ED3\u5C3E\u4ECD\u987B\u56DE\u5E94\u4EB2\u624B\u9898\u53F6");
  entry.frame();
  assert2(entry.bucketDraws().length === 1, "\u79FB\u4EA4\u7B2C\u4E00\u5E27\u5E94\u53EA\u6709\u4E00\u53EA\u6876\uFF0C\u4E0D\u80FD\u63D0\u6876\u4E0E\u5730\u9762\u6876\u91CD\u590D\u663E\u793A");
  const handoverStart = entry.bucketDraws()[0];
  const handoverFoot = entry.foot().join();
  const handoverSave = entry.savedProgress();
  if (input === "keyboard") entry.key("keydown", "left");
  else entry.pointer("pointerdown", "left");
  for (let i = 0; i < 20; i++) entry.frame();
  const handoverMid = entry.bucketDraws()[0];
  assert2(
    handoverMid && handoverMid.x > handoverStart.x && handoverMid.x < 581,
    "\u6876\u5E94\u8FDE\u7EED\u79FB\u5411\u4E54\u79BE\u8EAB\u8FB9\uFF0C\u4E0D\u80FD\u70B9\u51FB\u540E\u77AC\u95F4\u6D88\u5931"
  );
  assert2(entry.foot().join() === handoverFoot, "\u4EA4\u8C08/\u79FB\u4EA4\u65F6\u6309\u4F4F\u65B9\u5411\u4E0D\u53EF\u62D6\u8D70\u89D2\u8272");
  if (input === "keyboard") entry.key("keyup", "left");
  else entry.pointer("pointerup", "left");
  for (let i = 0; i < 40; i++) entry.frame();
  assert2(entry.bucketDraws().length === 1 && Math.abs(entry.bucketDraws()[0].x - 580) <= 1 && entry.bucketDraws()[0].y === 676, "\u79FB\u4EA4\u540E\u6876\u7559\u5728\u62C5\u8FB9\uFF0C\u4E0D\u5728\u624B\u4E0A\u91CD\u590D\u753B");
  assert2(entry.savedProgress() === handoverSave, "\u52A8\u753B\u5E27\u4E0D\u80FD\u91CD\u590D\u5199\u5956\u52B1/\u7AE0\u8282\u7ED3\u7B97");
  const independentSave = JSON.parse(entry.savedProgress());
  independentSave.storyFlags = independentSave.storyFlags.filter((flag) => flag !== "ly-florist-met" && flag !== "ly-magnolia-seen");
  independentSave.knowledge = independentSave.knowledge.filter((item) => item !== "liuyuan-magnolia-slip");
  const independentEnding = boot2("liuyuan-entry", "?route=modern&from=flower&draft=1&return=1", 0, JSON.stringify(independentSave));
  independentEnding.frame();
  assert2(
    independentEnding.bucketDraws().length === 1 && Math.abs(independentEnding.bucketDraws()[0].x - 580) <= 1,
    "\u5B8C\u6210\u6863\u5237\u65B0\u987B\u76F4\u63A5\u6062\u590D\u62C5\u8FB9\u6876\uFF0C\u4E0D\u91CD\u64AD\u79FB\u4EA4\u6216\u91CD\u65B0\u63D0\u6876"
  );
  assert2(independentEnding.nodes.chapterEcho.textContent.includes("\u7EB8\u58F0") && !independentEnding.nodes.chapterEcho.textContent.includes("\u7B14\u6811"), "\u672A\u542C\u82B1\u5320\u7684\u7AE0\u672B\u4E0D\u5F97\u4F2A\u9020\u571F\u8BDD\u56DE\u5FC6");
  const revisit = boot2("liuyuan-entry", "", 0, entry.savedProgress());
  revisit.frame();
  assert2(
    !revisit.nodes.chapterComplete.hidden && revisit.nodes.modeTitle.textContent.includes("\u56DE\u770B"),
    "\u5B8C\u6210\u6863\u91CD\u65B0\u6253\u5F00\u9996\u9875\u987B\u6062\u590D\u7AE0\u672B\u56DE\u770B\uFF0C\u4E0D\u80FD\u8BEF\u5165\u9001\u7CA5\u8FDB\u884C\u4E2D"
  );
  assert2(
    revisit.savedProgress() === entry.savedProgress() && revisit.bucketDraws().length === 1,
    "\u56DE\u770B\u9996\u9875\u4E0D\u91CD\u5199\u4EFB\u52A1/\u5956\u52B1\uFF0C\u62C5\u8FB9\u6876\u4ECD\u5728"
  );
  revisit.nodes.reset.click();
  revisit.frame();
  assert2(
    !revisit.nodes.chapterComplete.hidden && revisit.savedProgress() === entry.savedProgress(),
    "\u5B8C\u6210\u6863\u56DE\u770B\u91CD\u7F6E\u4E5F\u4E0D\u80FD\u91CD\u65B0\u5F00\u59CB\u4EFB\u52A1"
  );
  const playtestRevisit = boot2("liuyuan-entry", "?playtest=1", 0, entry.savedProgress());
  assert2(
    !playtestRevisit.nodes.chapterComplete.hidden && playtestRevisit.nodes.returnCityMap.href === "sucheng.html?chapter=1&playtest=1" && playtestRevisit.nodes.returnChapterJournal.href === "journal.html?chapter=1&playtest=1",
    "\u5B8C\u6210\u8BD5\u73A9\u9996\u9875\u548C\u7AE0\u672B\u53BB\u5411\u5FC5\u987B\u4FDD\u7559\u72EC\u7ACB\u8BD5\u73A9\u6A21\u5F0F"
  );
  const completed = JSON.parse(entry.savedProgress());
  assert2(
    completed.storyFlags.join(",") === LIUYUAN_CHAPTER_FLAGS.join(","),
    "\u4ECE\u7A7A\u5B58\u6863\u8D70\u5B8C\u6574\u7AE0\u540E\u5E94\u6309\u56FA\u5B9A\u987A\u5E8F\u6070\u597D\u8BB0\u5F55 15 \u4E2A\u4E8B\u4EF6"
  );
  assert2(
    completed.arts.yu === 0 && completed.arts.shu === 1 && completed.gardens.liuyuan === "complete",
    "\u4ECE\u7A7A\u5B58\u6863\u8D70\u5B8C\u6574\u7AE0\u540E\u5FA1\u4E0E\u4E66\u5404\u589E\u52A0\u4E00\u6B21\uFF0C\u7559\u56ED\u56ED\u6001\u5B8C\u6210"
  );
  const homeSave = runHomeReturn(
    entry.savedProgress(),
    input,
    entry.nodes.returnVariantHome.href.slice("home.html".length)
  );
  assert2(
    JSON.parse(homeSave).knowledge.includes("liuyuan-garden-note-collated"),
    "\u65B0\u6863\u9001\u7CA5\u81F3\u8FD8\u6876\u540E\uFF0C\u540C\u4E00\u5B58\u6863\u6309\u771F\u5B9E\u53BB\u5411\u94FE\u63A5\u56DE\u5E9C\u5B66\u987B\u53EF\u5B8C\u6210\u6838\u672C"
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
assert2(parseEntryResume(JSON.stringify(validResume), resumeContext), "\u5408\u6CD5\u7EED\u63A5\u8BB0\u5F55\u5E94\u53EF\u6062\u590D");
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
  assert2(parseEntryResume(invalid, resumeContext) === null, "\u7834\u635F\u3001\u8FC7\u671F\u3001\u78B0\u649E\u6216\u975E\u6CD5\u7EED\u63A5\u5E94\u5B89\u5168\u56DE\u9000");
}
assert2(
  !parseEntryResume(JSON.stringify(validResume), { ...resumeContext, stateAllowed: () => false }),
  "\u5267\u60C5\u95E8\u69DB\u4E0D\u53EF\u7531\u4F1A\u8BDD\u7EED\u63A5\u7ED5\u8FC7"
);
assert2(
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
  const masked = boot2("liuyuan-entry", "?draft=1", 0, void 0, record, true);
  masked.frame();
  assert2(
    clipCalls > 0 === shouldCover,
    `\u5165\u53E3\u8349\u7A3F\u906E\u6321\u5E94\u6309\u7269\u4EF6\u843D\u5730\u7EBF\u91CD\u7ED8\uFF1AdepthY=${depthY}\uFF0Cclip=${clipCalls}`
  );
  assert2(masked.foot().join() === "520,656", "\u5165\u53E3\u906E\u6321\u8349\u7A3F\u4E0D\u5E94\u6539\u53D8\u73A9\u5BB6\u51FA\u751F\u811A\u70B9");
}
console.log("\u5165\u53E3\u7F16\u8F91\u5668\u8349\u7A3F\u906E\u6321\uFF1A\u811A\u70B9\u5728\u843D\u5730\u7EBF\u540E\u65B9\u91CD\u7ED8\u524D\u666F\uFF0C\u524D\u65B9\u4E0D\u91CD\u7ED8\uFF0C\u4F4D\u7F6E\u4FDD\u6301\u4E0D\u53D8\u3002");
for (const [memory, words] of [
  ["liuyuan-album-orchid-leaf", "\u82B1\u5320\u8D60\u4F60\u7684\u5170\u7A3F"],
  ["liuyuan-drawing-smudged", "\u6E7F\u7A3F\u8FD8\u538B\u5728\u6A90\u4E0B"],
  ["liuyuan-drawing-left", "\u6CA1\u6709\u622A\u65AD\u8FD9\u4E00\u7A0B"]
]) {
  const ending = boot2("liuyuan-entry", "?route=modern&from=court&return=1&playtest=1", 15);
  const progress = JSON.parse(ending.savedProgress());
  progress.knowledge.push(memory);
  const before = JSON.stringify(progress);
  const resumed = boot2("liuyuan-entry", "?route=modern&from=court&return=1&playtest=1", 15, before);
  assert2(
    !resumed.nodes.chapterComplete.hidden && resumed.nodes.chapterEcho.textContent.includes(words),
    `\u7AE0\u672B\u5237\u65B0\u5E94\u627F\u63A5 ${memory}`
  );
  assert2(resumed.savedProgress() === before, "\u7AE0\u672B\u56DE\u54CD\u53EA\u8BFB\u53D6\u7ECF\u5386\uFF0C\u4E0D\u91CD\u5199\u8FDB\u5EA6\u6216\u5956\u52B1");
}
console.log("\u65B0\u6863\u2192\u9001\u7CA5/\u63A2\u7D22/\u9898\u53F6\u2192\u8FC7\u95E8\u4EB2\u624B\u8FD8\u6876\u2192\u540C\u4E00\u5B58\u6863\u56DE\u5E9C\u5B66\u4E66\u67B6\u6838\u672C\uFF1A\u8FDE\u7EED\u8F93\u5165\u6A21\u62DF\u901A\u8FC7\uFF0C\u672A\u6CE8\u5165\u5E9C\u5B66\u524D\u7F6E\u65D7\u6807\u3002");
