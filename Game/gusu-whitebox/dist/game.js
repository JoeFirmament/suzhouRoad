"use strict";
(() => {
  // src/config.ts
  var TILE = 16;
  var MAP_W = 80;
  var MAP_H = 50;
  var VIEW_W = 960;
  var VIEW_H = 600;
  var TUNING = {
    moveSpeed: 64,
    // px/s  [PLACEHOLDER] 手感反馈项①走路速度
    camLerp: 0.12,
    // 镜头跟随插值 [PLACEHOLDER] 反馈项②跟不跟手
    viewTriggerRadius: 22,
    // 取景触发半径 px
    stopBeatMs: 300,
    // 合窗静默拍（signature moment）
    walkAnimFps: 8,
    pulsePeriodMs: 1400,
    // 取景点光圈脉动周期
    homeInteractRadius: 27,
    // 府学近物交互半径 px
    cornerTriggerRadius: 24,
    // 堂后檐角拾遗触发半径 px
    albumStrokeMs: 260,
    // 园谱归页每幅景落下的阶梯动画时长 ms
    // ——「今按」层浮现时序（《剧本文件规范》§2.6.3 规格 1：今按永远在玩家之后）——
    // 剧本里各章一致写作「落笔 → 页成 → 稍顿 → 今按浮出」；本键就是那个「稍顿」。
    // 2026-09-30：由 CH5 的 TUNING.wszAnnotationDelayMs 提升为通用键（CH5–CH9 连欠五章，终章乙幕整幕依赖它）。
    annotationDelayMs: 1e3,
    // [PLACEHOLDER] 玩家动作 → 今按浮现 之间的停顿 ms（建议区间 800–1200）
    annotationFadeMs: 260,
    // 今按阶梯式淡入时长 ms（steps，走像素纪律；不是 CSS 缓动）
    annotationSteps: 4
    // 淡入阶梯数（像素纪律：位移/透明度只允许阶梯，不允许平滑插值）
  };
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
    /** 世界文字（1890）：台词、匾额、题跋原文、诗卡正文。最"在场"的一层。 */
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

  // src/data/mapgen.ts
  var idx = (x, y) => y * MAP_W + x;
  var at = (map, x, y) => x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? T.WALL : map[idx(x, y)];
  function rect(map, x0, y0, x1, y1, v) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) map[idx(x, y)] = v;
  }
  function blob(map, x0, y0, x1, y1, v) {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const rx = (x1 - x0) / 2 + 0.5, ry = (y1 - y0) / 2 + 0.5;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy > 1 || map[idx(x, y)] !== T.GRASS) continue;
      if (v === T.ROCK && Math.abs(dx) < 0.7 && Math.abs(dy) < 0.7 && (x * 7 + y * 11) % 9 === 0) continue;
      map[idx(x, y)] = v;
    }
  }
  function scatter(map, v, n, x0, y0, x1, y1) {
    let left = n, tries = 0;
    const cap = n * 60;
    while (left > 0 && tries < cap) {
      const x = x0 + (Math.random() * (x1 - x0 + 1) | 0);
      const y = y0 + (Math.random() * (y1 - y0 + 1) | 0);
      tries++;
      if (at(map, x, y) === T.GRASS) {
        map[idx(x, y)] = v;
        left--;
      }
    }
  }
  function buildCanglangMap() {
    const map = new Uint8Array(MAP_W * MAP_H);
    rect(map, 0, 0, MAP_W - 1, MAP_H - 1, T.GRASS);
    rect(map, 0, 0, MAP_W - 1, 4, T.WATER);
    rect(map, 0, 5, MAP_W - 1, 5, T.PATH);
    rect(map, 6, 6, 73, 7, T.CORR);
    rect(map, 6, 8, 73, 8, T.WALL);
    rect(map, 6, 9, 73, 9, T.CORR);
    for (const x of [6, 7, 72, 73]) map[idx(x, 8)] = T.CORR;
    const winX = [18, 38, 58];
    for (const x of winX) map[idx(x, 8)] = T.WIN;
    rect(map, 0, 10, MAP_W - 1, 10, T.PATH);
    rect(map, 12, 10, 12, 30, T.PATH);
    rect(map, 12, 18, 40, 18, T.PATH);
    rect(map, 12, 24, 64, 24, T.PATH);
    rect(map, 12, 30, 60, 30, T.PATH);
    rect(map, 26, 12, 26, 21, T.WALL);
    map[idx(26, 18)] = T.PATH;
    map[idx(26, 19)] = T.PATH;
    rect(map, 46, 24, 46, 33, T.WALL);
    map[idx(46, 28)] = T.PATH;
    map[idx(46, 29)] = T.PATH;
    rect(map, 12, 40, 40, 40, T.WALL);
    map[idx(26, 40)] = T.PATH;
    map[idx(26, 41)] = T.PATH;
    blob(map, 14, 11, 42, 16, T.ROCK);
    blob(map, 20, 13, 36, 15, T.ROCK);
    rect(map, 48, 32, 62, 40, T.WATER);
    rect(map, 54, 30, 55, 42, T.BRIDGE);
    rect(map, 50, 26, 60, 29, T.PLAT);
    rect(map, 30, 33, 35, 37, T.PLAT);
    scatter(map, T.FLOWER, 40, 2, 12, MAP_W - 3, 46);
    const trees = [
      [8, 14],
      [10, 20],
      [16, 13],
      [22, 12],
      [34, 12],
      [43, 13],
      [46, 18],
      [66, 13],
      [70, 15],
      [74, 12],
      [8, 27],
      [16, 34],
      [24, 44],
      [30, 27],
      [40, 36],
      [44, 26],
      [66, 30],
      [72, 26],
      [76, 36],
      [68, 42],
      [38, 44],
      [8, 40]
    ];
    for (const [x, y] of trees) if (at(map, x, y) === T.GRASS) map[idx(x, y)] = T.TREE;
    rect(map, 0, 48, MAP_W - 1, 48, T.WALL);
    return {
      map,
      w: MAP_W,
      h: MAP_H,
      trees,
      spawn: { x: 12 * TILE + 8, y: 22 * TILE },
      winX
    };
  }
  function buildCorridorSlice() {
    const W = 120, H = 14;
    const map = new Uint8Array(W * H);
    const set = (x, y, v) => {
      if (x >= 0 && y >= 0 && x < W && y < H) map[y * W + x] = v;
    };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let v = T.GRASS;
      if (y <= 3) v = T.WATER;
      else if (y === 4) v = T.RAIL;
      else if (y === 5) v = T.CORR;
      else if (y === 6) v = T.WALL;
      else if (y === 7 || y === 8) v = T.CORR;
      else if (y === 9) v = T.DIRT;
      else if (y <= 12) v = T.ROCK;
      map[y * W + x] = v;
    }
    const CORR_X02 = 6, CORR_X12 = 115;
    for (let x = CORR_X02 + 2; x < CORR_X12; x += 6) set(x, 6, T.WIN);
    const winX = [35, 60, 88];
    for (const x of winX) set(x, 6, T.WIN);
    for (const x of [6, 7, 114, 115]) set(x, 6, T.CORR);
    for (let y = 4; y <= 9; y++) for (let x = 0; x <= 5; x++) set(x, y, T.ROOF);
    for (let y = 3; y <= 6; y++) for (let x = 116; x <= 118; x++) set(x, y, T.ROOF);
    for (let y = 7; y <= 8; y++) for (let x = 116; x <= 118; x++) set(x, y, T.PAV);
    for (let y = 11; y <= 12; y++) for (let x = 56; x <= 59; x++) set(x, y, T.ROOF);
    const trees = [[72, 10]];
    return {
      map,
      w: W,
      h: H,
      trees,
      spawn: { x: 8 * TILE + 8, y: 5 * TILE + 12 },
      // 外廊西段
      winX
    };
  }
  function buildCanglangGarden() {
    const W = 100, H = 57;
    const map = new Uint8Array(W * H);
    const set = (x, y, v) => {
      if (x >= 0 && y >= 0 && x < W && y < H) map[y * W + x] = v;
    };
    const fill = (x0, y0, x1, y1, v) => {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, v);
    };
    fill(0, 0, W - 1, H - 1, T.GRASS);
    fill(0, 0, W - 1, 5, T.WATER);
    fill(0, 6, W - 1, 6, T.RAIL);
    fill(46, 0, 49, 7, T.BRIDGE);
    fill(7, 8, 88, 8, T.CORR);
    fill(7, 9, 88, 9, T.WALL);
    fill(7, 10, 88, 10, T.CORR);
    fill(46, 8, 49, 10, T.CORR);
    fill(43, 7, 45, 8, T.ROOF);
    fill(50, 7, 52, 8, T.ROOF);
    const winX = [24, 64, 80];
    for (let x = 8; x <= 87; x += 3) {
      if (winX.includes(x) || x >= 44 && x <= 51) continue;
      set(x, 9, T.WIN);
    }
    for (const x of winX) set(x, 9, T.WIN);
    blobGarden(map, W, H, 12, 14, 50, 32, T.ROCK);
    fill(24, 12, 25, 19, T.DIRT);
    fill(18, 20, 44, 21, T.DIRT);
    fill(30, 22, 31, 32, T.DIRT);
    fill(44, 21, 45, 32, T.DIRT);
    fill(27, 16, 31, 19, T.ROOF);
    fill(34, 27, 37, 29, T.ROOF);
    fill(6, 33, 88, 33, T.PATH);
    fill(58, 16, 72, 24, T.ROOF);
    fill(56, 25, 74, 27, T.PAV);
    fill(64, 28, 65, 32, T.PATH);
    fill(76, 18, 88, 23, T.ROOF);
    fill(76, 24, 88, 25, T.PAV);
    fill(82, 26, 83, 32, T.PATH);
    fill(58, 29, 64, 31, T.ROOF);
    fill(65, 30, 66, 32, T.PATH);
    fill(74, 36, 86, 41, T.ROOF);
    fill(74, 42, 86, 42, T.PAV);
    fill(80, 43, 81, 46, T.PATH);
    fill(52, 34, 53, 41, T.PATH);
    fill(48, 42, 54, 45, T.ROOF);
    fill(44, 38, 58, 48, T.BAMBOO);
    fill(47, 41, 55, 46, T.GRASS);
    fill(48, 42, 54, 45, T.ROOF);
    fill(52, 42, 53, 48, T.PATH);
    fill(24, 48, 36, 54, T.BAMBOO);
    fill(28, 43, 29, 54, T.PATH);
    fill(26, 50, 36, 53, T.GRASS);
    fill(30, 50, 34, 52, T.ROOF);
    fill(26, 36, 27, 47, T.PATH);
    fill(16, 40, 19, 43, T.ROOF);
    fill(17, 44, 18, 47, T.PATH);
    fill(6, 34, 15, 34, T.PATH);
    fill(0, 55, W - 1, 55, T.WALL);
    fill(0, 7, 0, 55, T.WALL);
    fill(94, 7, 94, 55, T.WALL);
    const trees = [
      // 西南小院枫杨（数株合抱）
      [4, 38],
      [8, 42],
      [5, 47],
      [11, 49],
      [13, 44],
      // 山上古木
      [16, 16],
      [21, 15],
      [35, 15],
      [40, 17],
      [46, 16],
      [14, 26],
      [47, 28],
      [20, 30],
      [38, 31],
      // 庭院树
      [54, 18],
      [75, 15],
      [90, 28],
      [90, 45],
      [70, 46],
      [60, 44],
      [42, 34],
      [70, 34],
      // 竹林外缘
      [40, 50],
      [46, 52],
      [34, 44]
    ];
    for (const [x, y] of trees) if (map[y * W + x] === T.GRASS) map[y * W + x] = T.TREE;
    for (let i = 0; i < 60; i++) {
      const x = 2 + i * 37 % (W - 4), y = 12 + i * 53 % (H - 15);
      if (map[y * W + x] === T.GRASS) map[y * W + x] = T.FLOWER;
    }
    const buildings = [
      { x0: 1, y0: 7, x1: 6, y1: 11, kind: "hip" },
      // 面水轩（西端收头，硬山）
      { x0: 89, y0: 7, x1: 93, y1: 10, kind: "ting" },
      // 观鱼处（东端尽头，攒尖方亭）
      { x0: 43, y0: 7, x1: 45, y1: 8, kind: "hip" },
      // 门楼西
      { x0: 50, y0: 7, x1: 52, y1: 8, kind: "hip" },
      // 门楼东
      { x0: 27, y0: 16, x1: 31, y1: 19, kind: "peak" },
      // 沧浪亭（山巅石亭）
      { x0: 34, y0: 27, x1: 37, y1: 29, kind: "hip" },
      // 印心石屋
      { x0: 58, y0: 16, x1: 72, y1: 24, kind: "hip" },
      // 明道堂
      { x0: 76, y0: 18, x1: 88, y1: 23, kind: "hip" },
      // 五百名贤祠
      { x0: 58, y0: 29, x1: 64, y1: 31, kind: "hip" },
      // 瑶华境界
      { x0: 74, y0: 36, x1: 86, y1: 41, kind: "hip" },
      // 清香馆
      { x0: 48, y0: 42, x1: 54, y1: 45, kind: "hip" },
      // 翠玲珑
      { x0: 30, y0: 50, x1: 34, y1: 52, kind: "peak" },
      // 看山楼
      { x0: 16, y0: 40, x1: 19, y1: 43, kind: "peak" }
      // 御碑亭
    ];
    const landmarks = [
      { id: "north-bridge-gate", label: "\u6E21\u6865\u4E0E\u5317\u5411\u5C71\u95E8", x: 47.5 * TILE, y: 11.5 * TILE, evidence: "verified" },
      { id: "canglang-pavilion", label: "\u5C71\u5DC5\u6CA7\u6D6A\u4EAD", x: 29 * TILE, y: 21.5 * TILE, evidence: "verified" },
      { id: "double-corridor", label: "\u4E34\u6C34\u590D\u5ECA", x: 62 * TILE, y: 10.5 * TILE, evidence: "verified" },
      { id: "mianshui-xuan", label: "\u9762\u6C34\u8F69\uFF08\u897F\u7AEF\uFF09", x: 7.5 * TILE, y: 10.5 * TILE, evidence: "verified" },
      { id: "guanyu-place", label: "\u89C2\u9C7C\u5904\uFF08\u4E1C\u7AEF\uFF09", x: 89.5 * TILE, y: 11.5 * TILE, evidence: "verified" },
      { id: "mingdao-hall", label: "\u660E\u9053\u5802", x: 64.5 * TILE, y: 27.5 * TILE, evidence: "verified" },
      { id: "five-hundred-worthies", label: "\u4E94\u767E\u540D\u8D24\u7960", x: 82 * TILE, y: 26.5 * TILE, evidence: "verified" },
      { id: "qingxiang-hall", label: "\u6E05\u9999\u9986\u4E00\u5E26", x: 80 * TILE, y: 43.5 * TILE, evidence: "verified" },
      { id: "teaching-windows", label: "\u4E09\u6247\u6559\u5B66\u7A97\uFF08\u827A\u672F\u52A0\u5DE5\uFF09", x: 64 * TILE, y: 8.5 * TILE, evidence: "fiction" }
    ];
    fill(89, 11, 93, 11, T.PAV);
    return {
      map,
      w: W,
      h: H,
      trees,
      spawn: { x: 47 * TILE + 8, y: 12 * TILE },
      // 渡桥入门，开门见山
      winX,
      buildings,
      landmarks
    };
  }
  function blobGarden(map, W, _H, x0, y0, x1, y1, v) {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const rx = (x1 - x0) / 2 + 0.5, ry = (y1 - y0) / 2 + 0.5;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy > 1) continue;
      if (Math.abs(dx) < 0.7 && Math.abs(dy) < 0.7 && (x * 7 + y * 11) % 17 === 0) continue;
      map[y * W + x] = v;
    }
  }

  // src/data/views.ts
  var VIEW_SPOTS = [
    {
      id: 0,
      x: 18 * 16 + 8,
      y: 9 * 16 + 8,
      poem: "\u6CA7\u6D6A\u4E4B\u6C34\u6E05\u516E\uFF0C\u53EF\u4EE5\u6FEF\u543E\u7F28",
      source: "\u300A\u695A\u8F9E\xB7\u6E14\u7236\u300B",
      hint: "\u6C34\u7A97\uFF1A\u6C34\u9762 + \u6C34\u69AD\u4E00\u89D2"
    },
    {
      id: 1,
      x: 38 * 16 + 8,
      y: 9 * 16 + 8,
      poem: "\u4E00\u5F84\u62B1\u5E7D\u5C71\uFF0C\u5C45\u7136\u57CE\u5E02\u95F4",
      source: "\u82CF\u821C\u94A6\u300A\u6CA7\u6D6A\u4EAD\u300B",
      hint: "\u5C71\u7A97\uFF1A\u5047\u5C71\u8F6E\u5ED3\u8FDE\u7EF5"
    },
    {
      id: 2,
      x: 58 * 16 + 8,
      y: 9 * 16 + 8,
      poem: "\u6E05\u98CE\u660E\u6708\u672C\u65E0\u4EF7\uFF0C\u8FD1\u6C34\u8FDC\u5C71\u7686\u6709\u60C5",
      source: "\u6CA7\u6D6A\u4EAD\u96C6\u53E5\u8054",
      hint: "\u5168\u666F\u7A97\uFF1A\u5C71 + \u6C34 + \u6865 + \u4EAD\u89D2"
    }
  ];
  var SLICE_SPOTS = [
    {
      id: 0,
      x: 35 * 16 + 8,
      y: 7 * 16 + 12,
      poem: "\u6CA7\u6D6A\u4E4B\u6C34\u6E05\u516E\uFF0C\u53EF\u4EE5\u6FEF\u543E\u7F28",
      source: "\u300A\u695A\u8F9E\xB7\u6E14\u7236\u300B",
      hint: "\u7A97\u4E00\xB7\u770B\uFF1A\u9759\u6B62\u5BF9\u4F4D"
    },
    {
      id: 1,
      x: 60 * 16 + 8,
      y: 7 * 16 + 12,
      poem: "\u4E00\u5F84\u62B1\u5E7D\u5C71\uFF0C\u5C45\u7136\u57CE\u5E02\u95F4",
      source: "\u82CF\u821C\u94A6\u300A\u6CA7\u6D6A\u4EAD\u300B",
      hint: "\u7A97\u4E8C\xB7\u5BF9\uFF1A\u7EB9\u6837\u5339\u914D"
    },
    {
      id: 2,
      x: 88 * 16 + 8,
      y: 7 * 16 + 12,
      poem: "\u6E05\u98CE\u660E\u6708\u672C\u65E0\u4EF7\uFF0C\u8FD1\u6C34\u8FDC\u5C71\u7686\u6709\u60C5",
      source: "\u6CA7\u6D6A\u4EAD\u96C6\u53E5\u8054",
      hint: "\u7A97\u4E09\xB7\u5408\uFF1A\u79FB\u52A8\u5BF9\u4F4D"
    }
  ];
  var GARDEN_SPOTS = [
    {
      id: 0,
      x: 24 * 16 + 8,
      y: 10 * 16 + 8,
      poem: "\u6CA7\u6D6A\u4E4B\u6C34\u6E05\u516E\uFF0C\u53EF\u4EE5\u6FEF\u543E\u7F28",
      source: "\u300A\u695A\u8F9E\xB7\u6E14\u7236\u300B",
      hint: "\u7A97\u4E00\xB7\u770B\uFF1A\u5916\u5ECA\u6C34\u9762"
    },
    {
      id: 1,
      x: 64 * 16 + 8,
      y: 10 * 16 + 8,
      poem: "\u4E00\u5F84\u62B1\u5E7D\u5C71\uFF0C\u5C45\u7136\u57CE\u5E02\u95F4",
      source: "\u82CF\u821C\u94A6\u300A\u6CA7\u6D6A\u4EAD\u300B",
      hint: "\u7A97\u4E8C\xB7\u5BF9\uFF1A\u5185\u5ECA\u5C71\u666F"
    },
    {
      id: 2,
      x: 80 * 16 + 8,
      y: 10 * 16 + 8,
      poem: "\u6E05\u98CE\u660E\u6708\u672C\u65E0\u4EF7\uFF0C\u8FD1\u6C34\u8FDC\u5C71\u7686\u6709\u60C5",
      source: "\u6CA7\u6D6A\u4EAD\u96C6\u53E5\u8054",
      hint: "\u7A97\u4E09\xB7\u5408\uFF1A\u4E94\u767E\u540D\u8D24\u7960\u65B9\u5411"
    }
  ];

  // src/core/engine.ts
  var Engine = class {
    constructor() {
      this.keys = /* @__PURE__ */ new Set();
      this.virtualKeys = /* @__PURE__ */ new Set();
      this.last = 0;
      this.raf = 0;
      this.running = false;
      this.onInteract = null;
      this.onCancel = null;
      /** 触屏/鼠标：点画布 = 交互（骨架版，正式版换虚拟摇杆）。 */
      this.onTap = null;
    }
    attachKeys() {
      addEventListener("keydown", (e) => {
        if (e.repeat) return;
        const k = e.key.toLowerCase();
        this.keys.add(k);
        if (k === "e" || k === " " || k === "enter") this.onInteract?.();
        if (k === "escape") this.onCancel?.();
        if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
      });
      addEventListener("keyup", (e) => this.keys.delete(e.key.toLowerCase()));
    }
    attachTap(el) {
      el.addEventListener("pointerdown", () => this.onTap?.());
    }
    /**
     * 移动端输入与键盘共用同一套轴值。按钮只负责“按住/松开”，
     * 不直接改玩家坐标，保证触屏与键盘走完全相同的碰撞和调参链路。
     */
    attachTouchControls(root) {
      if (!root) return;
      const releaseAll = () => {
        this.virtualKeys.clear();
        root.querySelectorAll(".is-active").forEach((el) => el.classList.remove("is-active"));
      };
      root.querySelectorAll("[data-move]").forEach((button) => {
        const key = button.dataset.move;
        if (!key) return;
        const set = (active) => {
          if (active) this.virtualKeys.add(key);
          else this.virtualKeys.delete(key);
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
      root.querySelector('[data-action="interact"]')?.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        this.onInteract?.();
      });
      root.querySelector('[data-action="cancel"]')?.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        this.onCancel?.();
      });
      addEventListener("blur", releaseAll);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) releaseAll();
      });
    }
    axis() {
      const down = (key) => this.keys.has(key) || this.virtualKeys.has(key);
      let dx = (down("d") || down("arrowright") ? 1 : 0) - (down("a") || down("arrowleft") ? 1 : 0);
      let dy = (down("s") || down("arrowdown") ? 1 : 0) - (down("w") || down("arrowup") ? 1 : 0);
      if (dx && dy) {
        dx *= Math.SQRT1_2;
        dy *= Math.SQRT1_2;
      }
      return { dx, dy };
    }
    start(step) {
      if (this.running) return;
      this.running = true;
      this.last = performance.now();
      const tick = (now2) => {
        const dt = Math.min((now2 - this.last) / 1e3, 0.05);
        this.last = now2;
        step(dt);
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }
    stop() {
      this.running = false;
      cancelAnimationFrame(this.raf);
    }
  };

  // src/core/geometry.ts
  var STANDARD_PLAYER_PROFILE = {
    halfW: 4,
    topInset: 6,
    bottomInset: 1
  };

  // src/core/physics.ts
  var DEFAULT_PROFILE = STANDARD_PLAYER_PROFILE;
  function solidAt(map, px2, py, w, h) {
    const tx = Math.floor(px2 / TILE), ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= w || ty >= h) return true;
    return SOLID.has(map[ty * w + tx]);
  }
  function collidesRect(x, y, rect2, profile) {
    const left = x - profile.halfW, right = x + profile.halfW;
    const top = y - profile.topInset, bottom = y - profile.bottomInset;
    return right > rect2.x && left < rect2.x + rect2.w && bottom > rect2.y && top < rect2.y + rect2.h;
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
  function moveEntity(map, p, dx, dy, w = MAP_W, h = MAP_H, obstacles = [], profile = DEFAULT_PROFILE) {
    if (dx !== 0) {
      const ox = p.x;
      p.x += dx;
      if (collides(map, p.x, p.y, w, h, obstacles, profile)) p.x = ox;
    }
    if (dy !== 0) {
      const oy = p.y;
      p.y += dy;
      if (collides(map, p.x, p.y, w, h, obstacles, profile)) p.y = oy;
    }
  }

  // src/core/scene-validation.ts
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

  // src/render/pixel.ts
  function px(g, x, y, w, h, color) {
    g.fillStyle = color;
    g.fillRect(x | 0, y | 0, w | 0, h | 0);
  }

  // src/render/scene.ts
  var playerSprite = new Image();
  playerSprite.src = "../assets/characters/scholar-player-sprites-v1.png";
  var SPRITE_CELL = 362;
  function makeLayer(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    draw(g);
    return c;
  }
  function buildLayers(data2) {
    const W = MAP_W * TILE, H = MAP_H * TILE;
    const { map, trees } = data2;
    const at2 = (x, y) => x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? T.WALL : map[y * MAP_W + x];
    const base = makeLayer(W, H, (g) => {
      for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
        const v = at2(x, y), X = x * TILE, Y = y * TILE;
        switch (v) {
          case T.GRASS:
            px(g, X, Y, TILE, TILE, (x * 7 + y * 13) % 5 < 2 ? PALETTE.grass : PALETTE.grassAlt);
            break;
          case T.PATH:
            px(g, X, Y, TILE, TILE, (x + y) % 3 === 0 ? PALETTE.pathAlt : PALETTE.path);
            if ((x + y) % 4 === 0) px(g, X + 5, Y + 7, 2, 2, PALETTE.wallShade);
            break;
          case T.WATER: {
            px(g, X, Y, TILE, TILE, PALETTE.water);
            if ((x * 3 + y * 5) % 6 === 0) px(g, X + 3, Y + 6, 8, 1, PALETTE.waterHi);
            break;
          }
          case T.WALL:
            px(g, X, Y, TILE, TILE, PALETTE.wall);
            if (at2(x, y + 1) !== T.WALL && at2(x, y + 1) !== T.WIN) px(g, X, Y + TILE - 3, TILE, 3, PALETTE.wallShade);
            break;
          case T.WIN: {
            px(g, X, Y, TILE, TILE, PALETTE.wall);
            px(g, X, Y, TILE, 2, PALETTE.wood);
            px(g, X, Y + TILE - 2, TILE, 2, PALETTE.wood);
            px(g, X, Y, 2, TILE, PALETTE.wood);
            px(g, X + TILE - 2, Y, 2, TILE, PALETTE.wood);
            g.fillStyle = PALETTE.gold;
            for (let i = 0; i < 3; i++) g.fillRect(X + 3 + i * 4, Y + 3, 2, TILE - 6);
            g.fillRect(X + 3, Y + 7, TILE - 6, 2);
            break;
          }
          case T.CORR:
            px(g, X, Y, TILE, TILE, PALETTE.path);
            break;
          case T.PLAT:
            px(g, X, Y, TILE, TILE, PALETTE.pathAlt);
            px(g, X, Y, TILE, 1, PALETTE.wallShade);
            break;
          case T.BRIDGE:
            px(g, X, Y, TILE, TILE, PALETTE.pathAlt);
            px(g, X, Y, 1, TILE, PALETTE.wood);
            px(g, X + TILE - 1, Y, 1, TILE, PALETTE.wood);
            break;
          case T.FLOWER:
            px(g, X, Y, TILE, TILE, PALETTE.grass);
            px(g, X + 4, Y + 5, 3, 3, "#d88a8a");
            px(g, X + 9, Y + 9, 2, 2, "#e6b45c");
            break;
        }
      }
    });
    const detail = makeLayer(W, H, (g) => {
      for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
        if (at2(x, y) === T.PATH && at2(x, y + 1) === T.WATER) px(g, x * TILE, y * TILE + TILE - 2, TILE, 2, "#b0a890");
      }
      for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
        if (at2(x, y) !== T.ROCK) continue;
        const X = x * TILE, Y = y * TILE;
        px(g, X, Y, TILE, TILE, PALETTE.rockBase);
        if (at2(x, y - 1) !== T.ROCK) px(g, X, Y, TILE, 3, PALETTE.rockTop);
        if (at2(x, y + 1) !== T.ROCK) px(g, X, Y + TILE - 3, TILE, 3, PALETTE.rockDark);
        if (at2(x - 1, y) !== T.ROCK) px(g, X, Y, 2, TILE, PALETTE.rockDark);
        if (at2(x + 1, y) !== T.ROCK) px(g, X + TILE - 2, Y, 2, TILE, PALETTE.rockDark);
        if ((x * 3 + y * 5) % 7 === 0) px(g, X + 5, Y + 6, 3, 2, "#6f8a63");
      }
      for (const [tx, ty] of trees) {
        const X = tx * TILE, Y = ty * TILE;
        px(g, X - 4, Y - 13, TILE + 8, 4, PALETTE.leafHi);
        px(g, X - 7, Y - 9, TILE + 14, 5, PALETTE.leafMid);
        px(g, X - 5, Y - 4, TILE + 10, 4, PALETTE.leafDark);
      }
    });
    const roof = makeLayer(W, H, (g) => {
      px(g, 6 * TILE - 6, 6 * TILE - 8, 68 * TILE + 12, 10, PALETTE.roof);
      for (let x = 6 * TILE - 6; x < 74 * TILE + 6; x += 8) px(g, x, 6 * TILE - 8, 4, 4, PALETTE.roofDark);
      px(g, 49 * TILE, 25 * TILE, 12 * TILE, 8, PALETTE.roof);
      px(g, 29 * TILE, 31 * TILE, 7 * TILE, 8, PALETTE.roof);
    });
    return { base, detail, roof };
  }
  function drawLayers(ctx2, layers2, cam2) {
    for (const l of [layers2.base, layers2.detail, layers2.roof]) {
      ctx2.drawImage(l, -cam2.x | 0, -cam2.y | 0);
    }
  }
  function drawPlayer(ctx2, p, cam2) {
    const X = p.x - cam2.x | 0, Y = p.y - cam2.y | 0;
    const frame = p.moving ? 1 + (p.wt * TUNING.walkAnimFps | 0) % 2 : 0;
    ctx2.fillStyle = "rgba(43,40,36,.18)";
    ctx2.fillRect(X - 5, Y - 1, 10, 2);
    if (playerSprite.complete && playerSprite.naturalWidth > 0) {
      ctx2.drawImage(
        playerSprite,
        frame * SPRITE_CELL,
        p.dir * SPRITE_CELL,
        SPRITE_CELL,
        SPRITE_CELL,
        X - 9,
        Y - 23,
        18,
        24
      );
      return;
    }
    px(ctx2, X - 3, Y - 4, 2, 4, PALETTE.ink);
    px(ctx2, X + 1, Y - 4, 2, 4, PALETTE.ink);
    if (frame === 1) px(ctx2, X - 3, Y - 2, 2, 2, PALETTE.ink);
    if (frame === 2) px(ctx2, X + 1, Y - 2, 2, 2, PALETTE.ink);
    px(ctx2, X - 4, Y - 11, 8, 8, PALETTE.qing);
    px(ctx2, X - 4, Y - 6, 8, 1, "#2f5a52");
    px(ctx2, X - 3, Y - 16, 6, 5, "#e8d5b5");
    px(ctx2, X - 3, Y - 17, 6, 2, PALETTE.ink);
    px(ctx2, X - 4, Y - 7, 8, 1, PALETTE.zhu);
  }
  function drawMarkers(ctx2, spots2, cam2, captured, now2) {
    for (const s of spots2) {
      if (captured.has(s.id)) continue;
      const X = s.x - cam2.x, Y = s.y - cam2.y;
      const pulse = 4 + Math.sin(now2 / 220 + s.id) * 1.5;
      ctx2.strokeStyle = PALETTE.zhu;
      ctx2.lineWidth = 1.5;
      ctx2.beginPath();
      ctx2.arc(X, Y - 6, pulse + 3, 0, Math.PI * 2);
      ctx2.stroke();
      px(ctx2, X - 1, Y - 7, 2, 2, PALETTE.zhu);
    }
  }

  // src/render/geometry-debug.ts
  function drawTileGeometryDebug(g, scene, cam2, view, actor, profile) {
    const tx0 = Math.max(0, Math.floor(cam2.x / TILE) - 1);
    const ty0 = Math.max(0, Math.floor(cam2.y / TILE) - 1);
    const tx1 = Math.min(scene.w - 1, Math.ceil((cam2.x + view.w) / TILE) + 1);
    const ty1 = Math.min(scene.h - 1, Math.ceil((cam2.y + view.h) / TILE) + 1);
    g.save();
    g.lineWidth = 1;
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      if (!SOLID.has(scene.map[ty * scene.w + tx])) continue;
      const x = Math.round(tx * TILE - cam2.x);
      const y = Math.round(ty * TILE - cam2.y);
      g.fillStyle = "rgba(225, 54, 54, .22)";
      g.strokeStyle = "rgba(239, 83, 80, .82)";
      g.fillRect(x, y, TILE, TILE);
      g.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    }
    for (const shape of scene.obstacles ?? []) {
      g.fillStyle = "rgba(225, 54, 54, .3)";
      g.strokeStyle = "#ef5350";
      if ("x" in shape) {
        const x = Math.round(shape.x - cam2.x);
        const y = Math.round(shape.y - cam2.y);
        g.fillRect(x, y, shape.w, shape.h);
        g.strokeRect(x + 0.5, y + 0.5, shape.w - 1, shape.h - 1);
      } else {
        g.beginPath();
        shape.points.forEach(([worldX, worldY], index) => index === 0 ? g.moveTo(Math.round(worldX - cam2.x), Math.round(worldY - cam2.y)) : g.lineTo(Math.round(worldX - cam2.x), Math.round(worldY - cam2.y)));
        g.closePath();
        g.fill();
        g.stroke();
      }
    }
    const footY = Math.round(actor.y - cam2.y);
    g.strokeStyle = "#f4d35e";
    g.beginPath();
    g.moveTo(0, footY + 0.5);
    g.lineTo(view.w, footY + 0.5);
    g.stroke();
    const left = Math.round(actor.x - profile.halfW - cam2.x);
    const top = Math.round(actor.y - profile.topInset - cam2.y);
    const width = profile.halfW * 2;
    const height = profile.topInset - profile.bottomInset;
    g.fillStyle = "rgba(231, 74, 255, .42)";
    g.strokeStyle = "#f263ff";
    g.fillRect(left, top, width, height);
    g.strokeRect(left + 0.5, top + 0.5, width - 1, height - 1);
    const footX = Math.round(actor.x - cam2.x);
    g.strokeStyle = "#fff";
    g.beginPath();
    g.moveTo(footX - 3, footY + 0.5);
    g.lineTo(footX + 3, footY + 0.5);
    g.moveTo(footX + 0.5, footY - 3);
    g.lineTo(footX + 0.5, footY + 3);
    g.stroke();
    g.restore();
  }
  function drawSceneLandmarks(g, landmarks, cam2) {
    g.save();
    g.textBaseline = "bottom";
    g.font = "4px monospace";
    for (const landmark of landmarks) {
      const x = Math.round(landmark.x - cam2.x), y = Math.round(landmark.y - cam2.y);
      g.strokeStyle = landmark.evidence === "verified" ? "#50e37a" : landmark.evidence === "inferred" ? "#f3c85b" : "#d864ff";
      g.fillStyle = g.strokeStyle;
      g.beginPath();
      g.arc(x, y, 3, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.moveTo(x - 5, y);
      g.lineTo(x + 5, y);
      g.moveTo(x, y - 5);
      g.lineTo(x, y + 5);
      g.stroke();
      g.fillText(landmark.label, x + 5, y - 3);
    }
    g.restore();
  }

  // src/render/slice.ts
  function nz(x, y, s = 0) {
    let h = x * 374761393 + y * 668265263 + s * 974711 | 0;
    h = Math.imul(h ^ h >>> 13, 1274126177);
    h = (h ^ h >>> 16) >>> 0;
    return h % 1e4 / 1e4;
  }
  var R = (g, x, y, w, h, c) => {
    g.fillStyle = c;
    g.fillRect(x, y, w, h);
  };
  function water(g, tx, ty, deep = false) {
    const X = tx * TILE, Y = ty * TILE;
    R(g, X, Y, TILE, TILE, deep ? PALETTE.waterDeep : PALETTE.water);
    if (nz(tx, ty, 1) < 0.4) {
      const yy = Y + [3, 5, 9, 11][nz(tx, ty, 2) * 4 | 0];
      const xx = X + (nz(tx, ty, 3) * 5 | 0);
      R(g, xx, yy, 5 + (nz(tx, ty, 4) * 6 | 0), 1, PALETTE.waterHi);
    }
    if (!deep && nz(tx, ty, 5) < 0.2) {
      g.fillStyle = PALETTE.waterDeep;
      g.fillRect(X + 2 + (nz(tx, ty, 6) * 11 | 0), Y + 2 + (nz(tx, ty, 7) * 11 | 0), 1, 1);
    }
  }
  function corr(g, tx, ty) {
    const X = tx * TILE, Y = ty * TILE;
    R(g, X, Y, TILE, TILE, PALETTE.path);
    R(g, X, Y, 1, TILE, PALETTE.pathAlt);
    R(g, X, Y + 8, TILE, 1, PALETTE.pathAlt);
    if (nz(tx, ty, 8) < 0.3) R(g, X + 2 + (nz(tx, ty, 9) * 11 | 0), Y + 2 + (nz(tx, ty, 10) * 11 | 0), 1, 1, PALETTE.wallShade);
  }
  function post(g, tx, ty) {
    const X = tx * TILE, Y = ty * TILE;
    R(g, X, Y, 2, TILE, PALETTE.wood);
    R(g, X + 2, Y, 1, TILE, PALETTE.woodDark);
  }
  function rail(g, tx, ty) {
    const X = tx * TILE, Y = ty * TILE;
    R(g, X, Y, TILE, TILE, PALETTE.rockBase);
    R(g, X, Y + 4, TILE, 1, PALETTE.rockTop);
    R(g, X, Y + 5, TILE, 1, PALETTE.inkPale);
    R(g, X, Y + 13, TILE, 1, PALETTE.rockDark);
    if (tx % 4 === 2) R(g, X + 7, Y, 2, TILE, PALETTE.wood);
  }
  function wall(g, tx, ty) {
    const X = tx * TILE, Y = ty * TILE;
    R(g, X, Y, TILE, TILE, PALETTE.wall);
    R(g, X, Y, TILE, 1, PALETTE.inkPale);
    R(g, X, Y + 14, TILE, 1, PALETTE.wallShade);
    R(g, X, Y + 15, TILE, 1, PALETTE.inkPale);
    if (tx % 4 === 0) R(g, X + 7, Y + 2, 1, 12, PALETTE.inkPale);
  }
  var WIN_PATS = ["bing", "haitang", "wan", "meihua"];
  function win(g, tx, ty, pat) {
    wall(g, tx, ty);
    const X = tx * TILE, Y = ty * TILE;
    g.strokeStyle = PALETTE.wood;
    g.lineWidth = 1;
    g.strokeRect(X + 2.5, Y + 2.5, 11, 11);
    g.strokeStyle = PALETTE.gold;
    g.strokeRect(X + 3.5, Y + 3.5, 9, 9);
    const m = PALETTE.inkMid;
    g.fillStyle = m;
    g.strokeStyle = m;
    if (pat === "bing") {
      g.fillRect(X + 4, Y + 4, 1, 1);
      line(g, X + 4, Y + 4, X + 12, Y + 12, m);
      line(g, X + 12, Y + 4, X + 4, Y + 12, m);
      line(g, X + 8, Y + 4, X + 8, Y + 12, m);
    } else if (pat === "haitang") {
      for (const [ox, oy] of [[8, 5], [8, 11], [5, 8], [11, 8]]) g.strokeRect(X + ox - 2 + 0.5, Y + oy - 2 + 0.5, 3, 3);
      g.fillRect(X + 8, Y + 8, 1, 1);
    } else if (pat === "wan") {
      line(g, X + 4, Y + 8, X + 12, Y + 8, m);
      line(g, X + 8, Y + 4, X + 8, Y + 12, m);
      line(g, X + 8, Y + 4, X + 11, Y + 4, m);
      line(g, X + 11, Y + 4, X + 11, Y + 7, m);
      line(g, X + 8, Y + 12, X + 5, Y + 12, m);
      line(g, X + 5, Y + 12, X + 5, Y + 9, m);
    } else {
      const pts = [[8, 4], [12, 6], [12, 10], [8, 12], [4, 10], [4, 6]];
      for (let i = 0; i < 6; i++) line(g, X + pts[i][0], Y + pts[i][1], X + pts[(i + 1) % 6][0], Y + pts[(i + 1) % 6][1], m);
      g.fillRect(X + 8, Y + 8, 1, 1);
    }
  }
  function winSpecial(g, tx, ty, shape) {
    wall(g, tx, ty);
    const X = tx * TILE, Y = ty * TILE;
    g.strokeStyle = PALETTE.zhu;
    g.lineWidth = 1;
    g.strokeRect(X + 2.5, Y + 2.5, 11, 11);
    g.strokeRect(X + 4.5, Y + 4.5, 7, 7);
    const m = PALETTE.inkMid;
    if (shape === "fan") {
      g.beginPath();
      g.arc(X + 8, Y + 8, 4.5, Math.PI * 1.11, Math.PI * 1.89);
      g.stroke();
      for (const [ax, ay] of [[8, 4], [5, 5], [11, 5]]) line(g, X + 8, Y + 11, X + ax, Y + ay, m);
      g.fillStyle = PALETTE.zhuBright;
      g.fillRect(X + 8, Y + 11, 1, 1);
    } else if (shape === "leaf") {
      line(g, X + 4, Y + 11, X + 11, Y + 4, m);
      g.beginPath();
      g.ellipse(X + 7.5, Y + 7.5, 5, 2.4, -Math.PI / 4, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = PALETTE.zhuBright;
      g.fillRect(X + 11, Y + 4, 1, 1);
    } else {
      g.beginPath();
      g.arc(X + 8, Y + 9.5, 4, 0, Math.PI * 2);
      g.stroke();
      line(g, X + 8, Y + 4, X + 6, Y + 7, m);
      line(g, X + 8, Y + 4, X + 10, Y + 7, m);
      g.fillStyle = PALETTE.zhuBright;
      g.fillRect(X + 8, Y + 4, 1, 1);
    }
  }
  function line(g, x0, y0, x1, y1, c) {
    g.strokeStyle = c;
    g.beginPath();
    g.moveTo(x0 + 0.5, y0 + 0.5);
    g.lineTo(x1 + 0.5, y1 + 0.5);
    g.stroke();
  }
  function rock(g, tx, ty, top) {
    const X = tx * TILE, Y = ty * TILE;
    R(g, X, Y, TILE, TILE, PALETTE.rockBase);
    for (let i = 0; i < 4; i++) {
      const w = 2 + (nz(tx, ty, 20 + i) * 4 | 0);
      R(g, X + (nz(tx, ty, 30 + i) * 10 | 0), Y + (nz(tx, ty, 40 + i) * 11 | 0), w, 2, PALETTE.rockDark);
    }
    if (top) for (let i = 0; i < 4; i++)
      g.fillStyle = PALETTE.rockTop, g.fillRect(X + 1 + (nz(tx, ty, 50 + i) * 14 | 0), Y + 1 + (nz(tx, ty, 60 + i) * 14 | 0), 1, 1);
  }
  function dirt(g, tx, ty) {
    const X = tx * TILE, Y = ty * TILE;
    R(g, X, Y, TILE, TILE, PALETTE.pathAlt);
    for (let i = 0; i < 4; i++) {
      g.fillStyle = PALETTE.grassAlt;
      g.fillRect(X + 1 + (nz(tx, ty, 70 + i) * 14 | 0), Y + 1 + (nz(tx, ty, 80 + i) * 14 | 0), 1, 1);
    }
    for (let i = 0; i < 2; i++) {
      g.fillStyle = PALETTE.rockDark;
      g.fillRect(X + 1 + (nz(tx, ty, 90 + i) * 14 | 0), Y + 1 + (nz(tx, ty, 95 + i) * 14 | 0), 1, 1);
    }
  }
  function grassEdge(g, tx, ty) {
    const X = tx * TILE, Y = ty * TILE;
    R(g, X, Y, TILE, TILE, PALETTE.grassAlt);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = PALETTE.grass;
      g.fillRect(X + 1 + (nz(tx, ty, 100 + i) * 14 | 0), Y + 1 + (nz(tx, ty, 110 + i) * 14 | 0), 1, 1);
    }
  }
  function treeCanopy(g, tx, ty) {
    const X = tx * TILE, Y = ty * TILE;
    R(g, X, Y, 32, 32, PALETTE.leafDark);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = PALETTE.leafMid;
      g.fillRect(X + (nz(tx, ty, 120 + i) * 32 | 0), Y + (nz(tx, ty, 130 + i) * 32 | 0), 1, 1);
    }
    for (let i = 0; i < 14; i++) {
      g.fillStyle = PALETTE.leafHi;
      g.fillRect(X + 2 + (nz(tx, ty, 140 + i) * 27 | 0), Y + 2 + (nz(tx, ty, 150 + i) * 27 | 0), 1, 1);
    }
    g.fillStyle = PALETTE.pine;
    g.fillRect(X + 16, Y + 16, 1, 1);
  }
  function bamboo(g, tx, ty) {
    const X = tx * TILE, Y = ty * TILE;
    for (let i = 0, xx = X + 1; xx < X + 16; xx += 3, i++) {
      R(g, xx, Y + 1, 1, 14, PALETTE.pine);
      R(g, xx - 1, Y + 3 + i % 3, 1, 4, PALETTE.leafMid);
    }
  }
  function roofHip(g, x0, x1, r0, r1) {
    const X = x0 * TILE, Y = r0 * TILE, W = (x1 - x0 + 1) * TILE, H = (r1 - r0 + 1) * TILE;
    R(g, X, Y, W, H, PALETTE.roof);
    const ridge = Y + (H >> 1);
    for (let i = X; i < X + W; i += 4) {
      line(g, i, Y + 2, Math.min(i + (ridge - Y - 2), X + W - 1), ridge - 1, PALETTE.roofDark);
      line(g, i, ridge + 1, Math.min(i + (Y + H - 2 - (ridge + 1)), X + W - 1), Y + H - 2, PALETTE.roofDark);
    }
    R(g, X, ridge, W, 1, PALETTE.ink);
    g.strokeStyle = PALETTE.ink;
    g.strokeRect(X + 0.5, Y + 0.5, W - 1, H - 1);
    R(g, X, Y + 1, W, 1, PALETTE.wall);
    R(g, X, Y + H - 2, W, 1, PALETTE.wallShade);
  }
  function roofTing(g, x0, x1, r0, r1) {
    const X = x0 * TILE, Y = r0 * TILE, W = (x1 - x0 + 1) * TILE, H = (r1 - r0 + 1) * TILE;
    R(g, X, Y, W, H, PALETTE.roof);
    const cx = X + W / 2, cy = Y + H / 2;
    for (const [ox, oy] of [[X + 2, Y + 2], [X + W - 3, Y + 2], [X + 2, Y + H - 3], [X + W - 3, Y + H - 3]])
      line(g, ox, oy, cx, cy, PALETTE.roofDark);
    g.fillStyle = PALETTE.ink;
    g.fillRect(cx, cy, 1, 1);
    g.strokeStyle = PALETTE.ink;
    g.strokeRect(X + 0.5, Y + 0.5, W - 1, H - 1);
  }
  function roofPeak(g, x0, x1, r0, r1) {
    const X = x0 * TILE, Y = r0 * TILE, W = (x1 - x0 + 1) * TILE, H = (r1 - r0 + 1) * TILE;
    R(g, X, Y, W, H, PALETTE.roof);
    const cx = X + W / 2, cy = Y + H / 2;
    for (const [ox, oy] of [[X + 1, Y + 1], [X + W - 2, Y + 1], [X + 1, Y + H - 2], [X + W - 2, Y + H - 2]])
      line(g, ox, oy, cx, cy, PALETTE.roofDark);
    g.strokeStyle = PALETTE.ink;
    g.strokeRect(X + 0.5, Y + 0.5, W - 1, H - 1);
  }
  var CORR_X0 = 6;
  var CORR_X1 = 115;
  var SPECIAL = { 35: "fan", 60: "leaf", 88: "peach" };
  function makeLayer2(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    draw(g);
    return c;
  }
  function buildSliceLayers(data2) {
    const W = data2.w * TILE, H = data2.h * TILE;
    const base = makeLayer2(W, H, (g) => {
      for (let ty = 0; ty < data2.h; ty++) for (let tx = 0; tx < data2.w; tx++) {
        const v = data2.map[ty * data2.w + tx];
        if (v === T.WATER) water(g, tx, ty, ty === 0);
        else if (v === T.RAIL) rail(g, tx, ty);
        else if (v === T.CORR || v === T.PAV) corr(g, tx, ty);
        else if (v === T.WALL) wall(g, tx, ty);
        else if (v === T.DIRT) dirt(g, tx, ty);
        else if (v === T.ROCK) rock(g, tx, ty, ty === 10);
        else if (v === T.GRASS) grassEdge(g, tx, ty);
      }
      for (let tx = CORR_X0 + 2; tx < CORR_X1; tx += 6)
        if (!SPECIAL[tx]) win(g, tx, 6, WIN_PATS[(tx / 6 | 0) % 4]);
      for (const [tx, shape] of Object.entries(SPECIAL)) winSpecial(g, +tx, 6, shape);
      for (let tx = CORR_X0; tx <= CORR_X1; tx += 3) {
        post(g, tx, 4);
        post(g, tx, 8);
      }
      for (let i = 0; i < 140; i++) {
        const tx = 6 + (nz(i, 1, 200) * 108 | 0), ty = 10 + (nz(i, 2, 200) * 3 | 0);
        R(
          g,
          tx * TILE + (nz(i, 3, 200) * 6 | 0),
          ty * TILE + (nz(i, 4, 200) * 9 | 0),
          5 + (nz(i, 5, 200) * 8 | 0),
          2 + (nz(i, 6, 200) * 4 | 0),
          PALETTE.rockDark
        );
      }
      for (let i = 0; i < 60; i++) {
        const tx = 6 + (nz(i, 7, 210) * 108 | 0), ty = 10 + (nz(i, 8, 210) * 3 | 0);
        line(
          g,
          tx * TILE + 2 + (nz(i, 9, 210) * 12 | 0),
          ty * TILE,
          tx * TILE + 2 + (nz(i, 9, 210) * 12 | 0),
          ty * TILE + 6 + (nz(i, 10, 210) * 9 | 0),
          PALETTE.inkPale
        );
      }
      for (const cx of [12, 26, 40, 52, 66, 80, 94, 108]) {
        const w = 2 + cx % 2, x0 = cx * TILE, topR = 9;
        for (let rr = topR; rr < 10; rr++) {
          const inset = (rr - topR) * 3;
          R(g, x0 + inset, rr * TILE, w * TILE - inset * 2, TILE, PALETTE.rockBase);
        }
        R(g, x0 + 2, topR * TILE, w * TILE - 5, 1, PALETTE.rockTop);
        g.strokeStyle = PALETTE.rockDark;
        g.strokeRect(x0 + 0.5, topR * TILE + 0.5, w * TILE - 1, 10 * TILE - topR * TILE - 1);
      }
      roofPeak(g, 56, 59, 11, 12);
      roofHip(g, 0, 5, 4, 9);
      roofTing(g, 116, 118, 3, 6);
      for (const bx of [18, 22, 100, 104]) {
        bamboo(g, bx, 10);
        bamboo(g, bx, 11);
      }
    });
    const detail = makeLayer2(W, H, (g) => {
      for (const [tx, ty] of data2.trees) treeCanopy(g, tx, ty);
    });
    const roof = makeLayer2(W, H, () => {
    });
    return { base, detail, roof };
  }

  // src/render/garden25d.ts
  var R2 = (g, x, y, w, h, c) => {
    g.fillStyle = c;
    g.fillRect(x, y, w, h);
  };
  var LINE = (g, x0, y0, x1, y1, c) => {
    g.strokeStyle = c;
    g.beginPath();
    g.moveTo(x0 + 0.5, y0 + 0.5);
    g.lineTo(x1 + 0.5, y1 + 0.5);
    g.stroke();
  };
  var SHADOW = "rgba(43,40,36,.24)";
  function shadowE(g, cx, cy, rx, ry) {
    g.beginPath();
    g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    g.fillStyle = SHADOW;
    g.fill();
  }
  function nz2(x, y, s = 0) {
    let h = x * 374761393 + y * 668265263 + s * 974711 | 0;
    h = Math.imul(h ^ h >>> 13, 1274126177);
    h = (h ^ h >>> 16) >>> 0;
    return h % 1e4 / 1e4;
  }
  function speckle(g, cx, cy, rx, ry, n, seed, colors) {
    for (let i = 0; i < n; i++) {
      const a = nz2(seed, i, 7) * Math.PI * 2;
      const rr = Math.sqrt(nz2(seed, i, 8));
      const x = cx + Math.cos(a) * rx * rr, y = cy + Math.sin(a) * ry * rr;
      R2(g, x | 0, y | 0, 1, 1, colors[i % colors.length]);
    }
  }
  function gGrass(g, tx, ty, flower) {
    const X = tx * TILE, Y = ty * TILE;
    R2(g, X, Y, TILE, TILE, PALETTE.leafSat);
    for (let i = 0; i < 4; i++)
      R2(g, X + (nz2(tx, ty, 2 + i) * 13 | 0), Y + (nz2(tx, ty, 12 + i) * 13 | 0), 2 + (nz2(tx, ty, 16 + i) * 2 | 0), 1, PALETTE.grassAlt);
    for (let i = 0; i < 5; i++)
      R2(g, X + (nz2(tx, ty, 1 + i) * 15 | 0), Y + (nz2(tx, ty, 11 + i) * 15 | 0), 1, 1, i < 3 ? PALETTE.leafDeep : PALETTE.willow);
    if (nz2(tx, ty, 21) < 0.25) R2(g, X + 2 + (nz2(tx, ty, 22) * 10 | 0), Y + 2 + (nz2(tx, ty, 23) * 10 | 0), 3, 2, PALETTE.leafDeep);
    if (flower) {
      for (let i = 0; i < 3; i++)
        R2(g, X + 3 + (nz2(tx, ty, 10 + i) * 10 | 0), Y + 3 + (nz2(tx, ty, 20 + i) * 10 | 0), 1, 1, [PALETTE.zhuBright, PALETTE.gold, PALETTE.willow][i]);
    }
  }
  function gWater(g, tx, ty, deep, bank) {
    const X = tx * TILE, Y = ty * TILE;
    R2(g, X, Y, TILE, TILE, deep ? PALETTE.waterTealDeep : PALETTE.waterTeal);
    for (let i = 0; i < 2; i++)
      R2(g, X + (nz2(tx, ty, 4 + i) * 4 | 0), Y + 2 + (nz2(tx, ty, 6 + i) * 12 | 0), 5 + (nz2(tx, ty, 8 + i) * 8 | 0), 1, i ? PALETTE.waterTealDeep : PALETTE.waterGlow);
    if (nz2(tx, ty, 10) < 0.3) R2(g, X + (nz2(tx, ty, 11) * 12 | 0), Y + (nz2(tx, ty, 12) * 14 | 0), 2, 1, PALETTE.waterGlow);
    if (bank) {
      R2(g, X, Y, TILE, 2, PALETTE.rockBase);
      R2(g, X, Y + 2, TILE, 1, PALETTE.rockDark);
      for (let x = X + 1; x < X + TILE; x += 4) R2(g, x, Y + 2, 1, 2, PALETTE.rockBase);
    }
  }
  function gFloor(g, tx, ty, kind) {
    const X = tx * TILE, Y = ty * TILE;
    if (kind === "path") {
      R2(g, X, Y, TILE, TILE, PALETTE.path);
      R2(g, X, Y + 5, TILE, 1, PALETTE.pathAlt);
      R2(g, X + 4 + (nz2(tx, ty, 8) * 8 | 0), Y, 1, TILE, PALETTE.pathAlt);
      if (nz2(tx, ty, 13) < 0.4) R2(g, X + (nz2(tx, ty, 14) * 12 | 0), Y + (nz2(tx, ty, 15) * 12 | 0), 2, 1, PALETTE.pathAlt);
    } else if (kind === "corr") {
      R2(g, X, Y, TILE, TILE, PALETTE.path);
      R2(g, X, Y, 1, TILE, PALETTE.pathAlt);
      R2(g, X, Y + 8, TILE, 1, PALETTE.pathAlt);
      if (nz2(tx, ty, 9) < 0.3) R2(g, X + 2 + (nz2(tx, ty, 11) * 12 | 0), Y + 2 + (nz2(tx, ty, 12) * 12 | 0), 1, 1, PALETTE.wallShade);
    } else if (kind === "dirt") {
      R2(g, X, Y, TILE, TILE, PALETTE.pathAlt);
      for (let i = 0; i < 4; i++) R2(g, X + 1 + (nz2(tx, ty, 30 + i) * 14 | 0), Y + 1 + (nz2(tx, ty, 40 + i) * 14 | 0), 1, 1, PALETTE.grass);
    } else {
      R2(g, X, Y, TILE, TILE, PALETTE.rockBase);
      R2(g, X, Y, 2, TILE, PALETTE.rockDark);
      R2(g, X + TILE - 2, Y, 2, TILE, PALETTE.rockDark);
      R2(g, X, Y, TILE, 1, PALETTE.rockTop);
      if (ty % 2 === 0) R2(g, X + 2, Y + 7, TILE - 4, 1, PALETTE.rockDark);
    }
  }
  function gRockGround(g, tx, ty) {
    const X = tx * TILE, Y = ty * TILE;
    R2(g, X, Y, TILE, TILE, PALETTE.rockBase);
    for (let i = 0; i < 3; i++)
      R2(g, X + (nz2(tx, ty, 50 + i) * 13 | 0), Y + (nz2(tx, ty, 54 + i) * 13 | 0), 2, 1, i ? PALETTE.rockDark : PALETTE.rockTop);
  }
  var STRIP_H = 64;
  var LOCAL_B = 64;
  function wall25(g, tx, ty) {
    const X = tx * TILE, Yb = LOCAL_B;
    R2(g, X, Yb - 14, TILE, 14, PALETTE.wall);
    R2(g, X + TILE - 1, Yb - 14, 1, 14, PALETTE.wallShade);
    R2(g, X, Yb - 14, TILE, 1, PALETTE.wallShade);
    if (tx % 4 === 0) R2(g, X + 7, Yb - 13, 1, 12, PALETTE.wallShade);
    R2(g, X - 1, Yb - 17, TILE + 2, 3, PALETTE.roofChar);
    R2(g, X - 1, Yb - 17, TILE + 2, 1, PALETTE.roof);
    R2(g, X - 1, Yb - 15, TILE + 2, 1, PALETTE.roofRidge);
  }
  var WIN_PATS2 = ["bing", "haitang", "wan", "meihua"];
  function win25(g, tx, ty, pat, special) {
    wall25(g, tx, ty);
    const X = tx * TILE, Yb = LOCAL_B;
    const ox = X + 3, oy = Yb - 13, ow = 10, oh = 9;
    R2(g, ox, oy, ow, oh, PALETTE.qingDeep);
    if (special) {
      g.strokeStyle = PALETTE.zhu;
      g.lineWidth = 1;
      g.strokeRect(ox + 0.5, oy + 0.5, ow - 1, oh - 1);
      const m = PALETTE.inkPale, cx = ox + ow / 2, cy = oy + oh / 2;
      if (special === "fan") {
        g.beginPath();
        g.arc(cx, cy + 2, 3.6, Math.PI * 1.08, Math.PI * 1.92);
        g.stroke();
        LINE(g, cx, cy + 3, cx, oy + 1, m);
        LINE(g, cx, cy + 3, ox + 1, oy + 2, m);
        LINE(g, cx, cy + 3, ox + ow - 1, oy + 2, m);
        R2(g, cx, cy + 3, 1, 1, PALETTE.zhuBright);
      } else if (special === "leaf") {
        LINE(g, ox + 1, oy + oh - 1, ox + ow - 1, oy + 1, m);
        g.beginPath();
        g.ellipse(cx, cy, 4.4, 2, -Math.PI / 4, 0, Math.PI * 2);
        g.stroke();
        R2(g, ox + ow - 1, oy + 1, 1, 1, PALETTE.zhuBright);
      } else {
        g.beginPath();
        g.arc(cx, cy + 1.5, 3.4, 0, Math.PI * 2);
        g.stroke();
        LINE(g, cx, oy + 1, cx - 2, oy + 4, m);
        LINE(g, cx, oy + 1, cx + 2, oy + 4, m);
        R2(g, cx, oy + 1, 1, 1, PALETTE.zhuBright);
      }
      g.lineWidth = 1;
    } else {
      g.strokeStyle = PALETTE.wood;
      g.strokeRect(ox + 0.5, oy + 0.5, ow - 1, oh - 1);
      g.strokeStyle = PALETTE.gold;
      g.strokeRect(ox + 1.5, oy + 1.5, ow - 3, oh - 3);
      const m = PALETTE.inkPale;
      if (pat === "bing") {
        LINE(g, ox + 2, oy + 2, ox + ow - 2, oy + oh - 2, m);
        LINE(g, ox + ow - 2, oy + 2, ox + 2, oy + oh - 2, m);
        LINE(g, cx0(ox, ow), oy + 2, cx0(ox, ow), oy + oh - 2, m);
      } else if (pat === "haitang") {
        for (const [ax, ay] of [[3, 2], [3, 6], [1, 4], [5, 4]]) g.strokeRect(ox + ax + 0.5, oy + ay + 0.5, 2, 2);
      } else if (pat === "wan") {
        LINE(g, ox + 1, cy0(oy, oh), ox + ow - 1, cy0(oy, oh), m);
        LINE(g, cx0(ox, ow), oy + 1, cx0(ox, ow), oy + oh - 1, m);
        LINE(g, cx0(ox, ow), oy + 1, ox + ow - 2, oy + 1, m);
        LINE(g, ox + 2, oy + oh - 1, cx0(ox, ow), oy + oh - 1, m);
      } else {
        const pts = [[5, 1], [8, 3], [8, 6], [5, 8], [2, 6], [2, 3]];
        for (let i = 0; i < 6; i++) LINE(g, ox + pts[i][0], oy + pts[i][1], ox + pts[(i + 1) % 6][0], oy + pts[(i + 1) % 6][1], m);
        R2(g, ox + 4, oy + 4, 1, 1, m);
      }
    }
  }
  var cx0 = (o, w) => o + (w >> 1);
  var cy0 = (o, h) => o + (h >> 1);
  function post25(g, tx, ty) {
    const X = tx * TILE, Yb = LOCAL_B;
    shadowE(g, X + 8, Yb - 1, 5, 2);
    R2(g, X + 6, Yb - 14, 3, 13, PALETTE.wood);
    R2(g, X + 9, Yb - 14, 1, 13, PALETTE.woodDark);
    R2(g, X + 5, Yb - 2, 5, 2, PALETTE.woodDark);
  }
  function redRail25(g, tx) {
    const X = tx * TILE, Yb = LOCAL_B;
    R2(g, X, Yb - 12, TILE, 2, PALETTE.zhu);
    R2(g, X, Yb - 10, TILE, 1, PALETTE.sealRed);
    R2(g, X, Yb - 3, TILE, 2, PALETTE.zhu);
    R2(g, X, Yb - 1, TILE, 1, PALETTE.sealRed);
    for (let x = X + 1; x < X + TILE; x += 4) {
      R2(g, x, Yb - 8, 1, 5, PALETTE.zhu);
      R2(g, x + 1, Yb - 8, 2, 1, PALETTE.zhu);
      R2(g, x + 1, Yb - 5, 2, 1, PALETTE.zhu);
      R2(g, x + 2, Yb - 7, 1, 2, PALETTE.sealRed);
    }
    if (tx % 3 === 0) {
      R2(g, X + 7, Yb - 13, 2, 13, PALETTE.sealRed);
      R2(g, X + 7, Yb - 13, 1, 13, PALETTE.zhu);
    }
  }
  function corrRoof25(g, x0, x1) {
    const X0 = x0 * TILE - 4, X1 = (x1 + 1) * TILE + 4, Yb = LOCAL_B;
    const yTop = Yb - 33, yBot = Yb - 1, w = X1 - X0;
    R2(g, X0, yTop + 2, w, yBot - yTop - 2, PALETTE.roofChar);
    for (let y = yTop + 5; y < yBot - 3; y += 5) R2(g, X0, y, w, 1, PALETTE.ink);
    for (let x = X0 + 2; x < X1 - 1; x += 4) R2(g, x, yTop + 4, 1, yBot - yTop - 6, PALETTE.inkMid);
    R2(g, X0, yTop + 3, w, 1, PALETTE.inkMid);
    R2(g, X0, yTop, w, 2, PALETTE.roofRidge);
    R2(g, X0, yTop, w, 1, PALETTE.inkPale);
    R2(g, X0 - 1, yTop - 3, 3, 4, PALETTE.roofRidge);
    R2(g, X1 - 2, yTop - 3, 3, 4, PALETTE.roofRidge);
    R2(g, X0, yBot - 2, w, 2, PALETTE.roofRidge);
    for (let x = X0 + 1; x < X1; x += 3) R2(g, x, yBot, 1, 1, PALETTE.inkMid);
  }
  function rock25(g, tx, ty, topEdge) {
    const X = tx * TILE, Yb = LOCAL_B;
    const roll = nz2(tx, ty, 60);
    if (roll < 0.08) return;
    const poly = (pts, c) => {
      g.beginPath();
      g.moveTo(pts[0][0] + 0.5, pts[0][1] + 0.5);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0] + 0.5, pts[i][1] + 0.5);
      g.closePath();
      g.fillStyle = c;
      g.fill();
    };
    const jag = 1 + (nz2(tx, ty, 52) * 3 | 0);
    const h = topEdge ? 15 + jag : 22;
    const bx = X, bw = 16, by = Yb - h;
    shadowE(g, X + 8, Yb - 1, 13, 3);
    const hy = by + (h * 0.45 | 0);
    poly([
      [bx, by + 4 + jag],
      [bx + 3, by + jag],
      [bx + 12, by + 1 + jag],
      [bx + bw, by + 4 + jag],
      [bx + bw, Yb - 3],
      [bx + 12, Yb],
      [bx + 3, Yb],
      [bx, Yb - 3]
    ], PALETTE.rockBase);
    poly([
      [bx + 1, by + 5 + jag],
      [bx + 4, by + 1 + jag],
      [bx + 11, by + 2 + jag],
      [bx + 13, by + 5 + jag],
      [bx + 13, hy],
      [bx + 1, hy]
    ], PALETTE.rockTop);
    poly([
      [bx + 12, by + 3 + jag],
      [bx + bw, by + 5 + jag],
      [bx + bw, Yb - 3],
      [bx + 13, Yb - 1],
      [bx + 12, Yb - 1]
    ], PALETTE.rockDark);
    LINE(g, bx + 4, hy - 4, bx + 7 + (nz2(tx, ty, 54) * 4 | 0), Yb - 4, PALETTE.rockDark);
    LINE(g, bx + 10, hy - 2, bx + 8, Yb - 3, PALETTE.rockDark);
    if (nz2(tx, ty, 61) < 0.3) {
      const hx = bx + 4 + (nz2(tx, ty, 62) * 7 | 0), hyy = hy + 3;
      R2(g, hx, hyy, 3, 2, PALETTE.inkHeavy);
      R2(g, hx, hyy, 2, 1, PALETTE.qingDeep);
    }
    if (topEdge) for (let i = 0; i < 2; i++) R2(g, bx + 2 + (nz2(tx, ty, 63 + i) * 10 | 0), by + 1 + jag, 1, 1, PALETTE.leafSat);
  }
  function bamboo25(g, tx, ty) {
    const X = tx * TILE, Yb = LOCAL_B;
    shadowE(g, X + 8, Yb - 1, 7, 2);
    for (let i = 0, xx = X + 3; xx <= X + 13; xx += 5, i++) {
      const h = 17 + (nz2(tx, ty, 70 + i) * 7 | 0);
      R2(g, xx, Yb - h, 1, h, PALETTE.pine);
      R2(g, xx + 1, Yb - h + 3, 1, h - 5, PALETTE.willow);
      for (let l = 0; l < 4; l++) {
        const ly = Yb - h + 2 + l * 4 + (nz2(tx, ty, 74 + i * 4 + l) * 2 | 0);
        R2(g, xx - 2, ly, 3, 1, nz2(tx, ty, 80 + l) < 0.5 ? PALETTE.leafSat : PALETTE.leafDeep);
        R2(g, xx, ly - 1, 4, 1, nz2(tx, ty, 84 + l) < 0.5 ? PALETTE.leafSat : PALETTE.leafDeep);
      }
    }
  }
  function tree25(g, tx, ty) {
    const cx = tx * TILE + 16, Yb = LOCAL_B;
    shadowE(g, cx + 2, Yb - 1, 22, 5);
    R2(g, cx - 3, Yb - 15, 6, 15, PALETTE.wood);
    R2(g, cx + 3, Yb - 11, 2, 11, PALETTE.woodDark);
    R2(g, cx - 8, Yb - 3, 16, 2, PALETTE.woodDark);
    LINE(g, cx, Yb - 15, cx - 9, Yb - 24, PALETTE.woodDark);
    LINE(g, cx + 2, Yb - 14, cx + 11, Yb - 26, PALETTE.woodDark);
    const blobs = [
      [cx, Yb - 36, 20, 15, PALETTE.leafDeep],
      [cx - 12, Yb - 40, 12, 10, PALETTE.leafDeep],
      [cx + 12, Yb - 33, 11, 9, PALETTE.leafDeep],
      [cx - 3, Yb - 46, 10, 8, PALETTE.leafDeep],
      [cx - 17, Yb - 31, 8, 7, PALETTE.leafDeep],
      [cx + 18, Yb - 41, 7, 6, PALETTE.leafDeep]
    ];
    for (const [bx, by, brx, bry, c] of blobs) {
      g.beginPath();
      g.ellipse(bx, by, brx, bry, 0, 0, Math.PI * 2);
      g.fillStyle = c;
      g.fill();
    }
    const mids = [
      [cx - 10, Yb - 40, 9, 7],
      [cx + 6, Yb - 36, 8, 6],
      [cx - 3, Yb - 45, 7, 5],
      [cx + 14, Yb - 42, 5, 4]
    ];
    for (const [bx, by, brx, bry] of mids) {
      g.beginPath();
      g.ellipse(bx, by, brx, bry, 0, 0, Math.PI * 2);
      g.fillStyle = PALETTE.leafSat;
      g.fill();
    }
    for (const [bx, by, brx, bry] of mids) speckle(g, bx, by, brx, bry, 12, bx * 7 + by | 0, [PALETTE.leafHi, PALETTE.willow]);
    speckle(g, cx, Yb - 36, 20, 14, 24, tx * 91 + ty, [PALETTE.leafHi, PALETTE.pine, PALETTE.willow]);
    speckle(g, cx, Yb - 30, 18, 9, 14, tx * 57 + ty, [PALETTE.leafDeep, PALETTE.pine]);
  }
  function building25(g, b) {
    const X0 = b.x0 * TILE, X1 = (b.x1 + 1) * TILE, Yb = LOCAL_B;
    const w = X1 - X0, depth = b.y1 - b.y0 + 1;
    const fh = depth >= 6 ? 14 : 12;
    const Ye = Yb - fh;
    shadowE(g, (X0 + X1) / 2, Yb - 1, w * 0.55, 5);
    R2(g, X0 - 2, Yb - 3, w + 4, 3, PALETTE.rockBase);
    R2(g, X0 - 2, Yb - 3, w + 4, 1, PALETTE.rockTop);
    R2(g, X0 - 2, Yb - 1, w + 4, 1, PALETTE.rockDark);
    R2(g, X0, Ye, w, fh - 3, PALETTE.wall);
    R2(g, X1 - 1, Ye, 1, fh - 3, PALETTE.wallShade);
    R2(g, X0, Ye + fh - 4, w, 1, PALETTE.wallShade);
    R2(g, X0, Ye, w, 2, PALETTE.woodDark);
    for (let px2 = X0 + 2; px2 < X1 - 2; px2 += 12) {
      R2(g, px2, Ye + 2, 2, fh - 5, PALETTE.wood);
      R2(g, px2 + 2, Ye + 2, 1, fh - 5, PALETTE.woodDark);
    }
    const mid = (X0 + X1) / 2;
    if (w >= 72) {
      R2(g, mid - 10, Yb - 12, 20, 9, PALETTE.woodDark);
      R2(g, mid - 1, Yb - 12, 2, 9, PALETTE.wood);
    } else if (w >= 40) {
      R2(g, mid - 7, Yb - 10, 14, 7, PALETTE.woodDark);
      R2(g, mid - 1, Yb - 10, 2, 7, PALETTE.wood);
    }
    for (let px2 = X0 + 8; px2 < X1 - 10; px2 += 12) {
      if (Math.abs(px2 - mid) < 14 && w >= 40) continue;
      R2(g, px2, Ye + 4, 7, 5, PALETTE.woodDark);
      R2(g, px2 + 1, Ye + 5, 5, 3, PALETTE.inkHeavy);
      R2(g, px2 + 3, Ye + 5, 1, 3, PALETTE.gold);
    }
    if (b.kind === "hip") {
      const rh = Math.min(22, 10 + depth * 1.4);
      const Yr = Ye - rh;
      g.beginPath();
      g.moveTo(X0 + 3, Yr);
      g.lineTo(X1 - 3, Yr);
      g.lineTo(X1 + 3, Ye);
      g.lineTo(X0 - 3, Ye);
      g.closePath();
      g.fillStyle = PALETTE.roofChar;
      g.fill();
      for (let yy = Yr + 3; yy < Ye - 2; yy += 3) {
        const t = (yy - Yr) / (Ye - Yr);
        const xL = X0 + 3 - 6 * t, xR = X1 - 3 + 6 * t;
        R2(g, xL, yy, xR - xL, 1, PALETTE.inkMid);
      }
      R2(g, X0 - 3, Ye, w + 6, 1, PALETTE.inkPale);
      R2(g, X0 - 3, Ye + 1, w + 6, 1, PALETTE.roofRidge);
      for (let x = X0 - 2; x < X1 + 2; x += 3) R2(g, x, Ye + 2, 1, 1, PALETTE.inkMid);
      R2(g, X0 + 1, Yr - 2, w - 2 + 4, 2, PALETTE.roofRidge);
      R2(g, X0 + 1, Yr - 2, w - 2 + 4, 1, PALETTE.inkPale);
      R2(g, X0 - 1, Yr - 4, 3, 4, PALETTE.roofRidge);
      R2(g, X1 - 2, Yr - 4, 3, 4, PALETTE.roofRidge);
      LINE(g, X0 + 3, Yr, X0 - 3, Ye, PALETTE.ink);
      LINE(g, X1 - 3, Yr, X1 + 3, Ye, PALETTE.ink);
    } else {
      const rh = b.kind === "ting" ? 17 : 13;
      const Yt = Ye - rh, cxm = (X0 + X1) / 2;
      g.beginPath();
      g.moveTo(X0 - 3, Ye);
      g.lineTo(X1 + 3, Ye);
      g.lineTo(cxm, Yt);
      g.closePath();
      g.fillStyle = PALETTE.roofChar;
      g.fill();
      for (let yy = Ye - 2; yy > Yt; yy -= 3) {
        const t = (Ye - yy) / rh;
        const half = (w / 2 + 3) * (1 - t);
        R2(g, cxm - half, yy, half * 2, 1, PALETTE.inkMid);
      }
      LINE(g, X0 - 3, Ye, cxm, Yt, PALETTE.ink);
      LINE(g, X1 + 3, Ye, cxm, Yt, PALETTE.ink);
      R2(g, cxm - 1, Yt - 3, 3, 4, PALETTE.roofRidge);
      R2(g, cxm, Yt - 5, 1, 2, PALETTE.zhuBright);
      R2(g, X0 - 3, Ye, w + 6, 1, PALETTE.inkPale);
      for (let x = X0 - 2; x < X1 + 2; x += 3) R2(g, x, Ye + 2, 1, 1, PALETTE.inkMid);
    }
  }
  function makeCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    return [c, g];
  }
  function buildGarden25d(data2) {
    const W = data2.w * TILE, H = data2.h * TILE;
    const [ground, gg] = makeCanvas(W, H);
    for (let ty = 0; ty < data2.h; ty++) for (let tx = 0; tx < data2.w; tx++) {
      const v = data2.map[ty * data2.w + tx];
      if (v === T.WATER) {
        const bank = ty > 0 && data2.map[(ty - 1) * data2.w + tx] !== T.WATER && data2.map[(ty - 1) * data2.w + tx] !== T.BRIDGE;
        gWater(gg, tx, ty, ty <= 2, bank);
      } else if (v === T.GRASS) gGrass(gg, tx, ty, false);
      else if (v === T.FLOWER) gGrass(gg, tx, ty, true);
      else if (v === T.PATH) gFloor(gg, tx, ty, "path");
      else if (v === T.CORR || v === T.PAV) gFloor(gg, tx, ty, "corr");
      else if (v === T.DIRT) gFloor(gg, tx, ty, "dirt");
      else if (v === T.BRIDGE) gFloor(gg, tx, ty, "bridge");
      else if (v === T.ROCK) gRockGround(gg, tx, ty);
      else if (v === T.RAIL) {
        R2(gg, tx * TILE, ty * TILE, TILE, TILE, PALETTE.rockBase);
        R2(gg, tx * TILE, ty * TILE, TILE, 2, PALETTE.rockTop);
        R2(gg, tx * TILE, ty * TILE + TILE - 1, TILE, 1, PALETTE.rockDark);
      } else if (v === T.WALL || v === T.WIN) R2(gg, tx * TILE, ty * TILE, TILE, TILE, PALETTE.path);
      else R2(gg, tx * TILE, ty * TILE, TILE, TILE, PALETTE.grassAlt);
    }
    const strips = [];
    const winSet = new Set(data2.winX);
    const buildings = data2.buildings ?? [];
    for (let ty = 0; ty < data2.h; ty++) {
      const [sc, g] = makeCanvas(W, STRIP_H);
      for (let tx = 0; tx < data2.w; tx++) {
        if (data2.map[ty * data2.w + tx] !== T.ROCK) continue;
        const above = ty > 0 ? data2.map[(ty - 1) * data2.w + tx] : T.GRASS;
        rock25(g, tx, ty, above !== T.ROCK);
      }
      for (let tx = 0; tx < data2.w; tx++) {
        if (data2.map[ty * data2.w + tx] === T.BAMBOO) bamboo25(g, tx, ty);
      }
      for (let tx = 0; tx < data2.w; tx++) {
        const v = data2.map[ty * data2.w + tx];
        if (v === T.WALL) wall25(g, tx, ty);
        else if (v === T.WIN) {
          const special = winSet.has(tx) ? ["fan", "leaf", "peach"][data2.winX.indexOf(tx)] : null;
          win25(g, tx, ty, WIN_PATS2[(tx / 5 | 0) % 4], special);
        }
      }
      if (ty >= 6 && ty <= 8) {
        for (let tx = 0; tx < data2.w; tx++) {
          const v7 = data2.map[ty * data2.w + tx];
          if (v7 === T.WATER || v7 === T.ROOF || v7 === T.BRIDGE || v7 === T.WALL || v7 === T.WIN) continue;
          if (ty + 1 < data2.h && data2.map[(ty + 1) * data2.w + tx] === T.CORR) redRail25(g, tx);
        }
      }
      for (let tx = 7; tx <= 88; tx += 2) {
        if ((ty === 8 || ty === 10) && data2.map[ty * data2.w + tx] === T.CORR) post25(g, tx, ty);
      }
      if (ty === 8) {
        let x = 0;
        while (x < data2.w) {
          if (data2.map[8 * data2.w + x] !== T.CORR) {
            x++;
            continue;
          }
          const x0 = x;
          while (x < data2.w && data2.map[8 * data2.w + x] === T.CORR) x++;
          corrRoof25(g, x0, x - 1);
        }
      }
      for (const [x, y] of data2.trees) {
        if (y + 1 === ty) tree25(g, x, ty);
      }
      for (const b of buildings) {
        if (b.y1 === ty) building25(g, b);
      }
      strips.push(sc);
    }
    bakeReflection(ground, strips, data2);
    return { ground, strips };
  }
  var hex2rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  function bakeReflection(ground, strips, data2) {
    const W = ground.width, H = ground.height;
    const [comp, cg] = makeCanvas(W, H);
    cg.drawImage(ground, 0, 0);
    for (let ty = 0; ty < data2.h; ty++) cg.drawImage(strips[ty], 0, ty * TILE - (STRIP_H - TILE));
    const img = cg.getImageData(0, 0, W, H).data;
    const [refl, rg] = makeCanvas(W, H);
    const rImg = rg.createImageData(W, H);
    const wd = hex2rgb(PALETTE.waterTealDeep);
    for (let tx = 0; tx < data2.w; tx++) {
      let ty = 0;
      while (ty < data2.h) {
        if (data2.map[ty * data2.w + tx] !== T.WATER) {
          ty++;
          continue;
        }
        const r0 = ty;
        while (ty < data2.h && data2.map[ty * data2.w + tx] === T.WATER) ty++;
        const bot = ty * TILE;
        for (let y = r0 * TILE; y < bot; y++) {
          const k = bot - y;
          const sy = bot - 1 + k;
          if (sy >= H - 1) continue;
          const wob = Math.round(Math.sin(y * 0.6 + tx % 5 * 0.8) * 2);
          const m = 0.58 - Math.min(0.15, k / bot * 0.3);
          for (let xx = 0; xx < TILE; xx++) {
            const px2 = tx * TILE + xx + wob;
            if (px2 < 0 || px2 >= W) continue;
            const d = (y * W + px2) * 4;
            const stx = px2 / TILE | 0, sty = sy / TILE | 0;
            if (data2.map[sty * data2.w + stx] === T.WATER) {
              rImg.data[d] = wd[0];
              rImg.data[d + 1] = wd[1];
              rImg.data[d + 2] = wd[2];
              rImg.data[d + 3] = 255;
              continue;
            }
            const s = (sy * W + px2) * 4, s2 = ((sy + 1) * W + px2) * 4;
            rImg.data[d] = ((img[s] + img[s2]) * 0.5 * (1 - m) + wd[0] * m) * 0.78;
            rImg.data[d + 1] = ((img[s + 1] + img[s2 + 1]) * 0.5 * (1 - m) + wd[1] * m) * 0.82;
            rImg.data[d + 2] = ((img[s + 2] + img[s2 + 2]) * 0.5 * (1 - m) + wd[2] * m) * 0.84;
            rImg.data[d + 3] = 255;
          }
        }
      }
    }
    rg.putImageData(rImg, 0, 0);
    const g2 = ground.getContext("2d");
    g2.drawImage(refl, 0, 0);
    for (let ty2 = 0; ty2 < data2.h; ty2++) for (let tx2 = 0; tx2 < data2.w; tx2++) {
      if (data2.map[ty2 * data2.w + tx2] !== T.WATER || nz2(tx2, ty2, 140) > 0.18) continue;
      const X = tx2 * TILE + (nz2(tx2, ty2, 141) * 6 | 0), Y = ty2 * TILE + 2 + (nz2(tx2, ty2, 142) * 12 | 0);
      R2(g2, X, Y, 4 + (nz2(tx2, ty2, 143) * 9 | 0), 1, PALETTE.waterGlow);
    }
    for (let ty2 = 0; ty2 < data2.h; ty2++) for (let tx2 = 0; tx2 < data2.w; tx2++) {
      if (data2.map[ty2 * data2.w + tx2] !== T.WATER || nz2(tx2, ty2, 120) > 0.09) continue;
      const X = tx2 * TILE, Y = ty2 * TILE;
      for (let i = 0; i < 3; i++) {
        const lx = X + 2 + (nz2(tx2, ty2, 121 + i) * 11 | 0), ly = Y + 2 + (nz2(tx2, ty2, 125 + i) * 11 | 0);
        const r = 3 + (nz2(tx2, ty2, 129 + i) * 3 | 0);
        g2.beginPath();
        g2.ellipse(lx, ly, r + 1, r, 0, 0, Math.PI * 2);
        g2.fillStyle = PALETTE.leafDeep;
        g2.fill();
        g2.beginPath();
        g2.ellipse(lx, ly - 0.5, r, r - 0.8, 0, 0, Math.PI * 2);
        g2.fillStyle = PALETTE.leafSat;
        g2.fill();
        g2.beginPath();
        g2.ellipse(lx, ly - 0.5, r * 0.45, r * 0.4, 0, 0, Math.PI * 2);
        g2.fillStyle = PALETTE.leafDeep;
        g2.fill();
        R2(g2, lx - 1, ly - 2, 1, 1, PALETTE.willow);
      }
      if (nz2(tx2, ty2, 133) < 0.35) {
        R2(g2, X + 7, Y + 6, 2, 2, PALETTE.zhuBright);
        R2(g2, X + 7, Y + 6, 1, 1, PALETTE.gold);
      }
    }
  }

  // src/render/frameui.ts
  function hillSil(g, w, h) {
    g.fillStyle = "#a8bca4";
    g.beginPath();
    g.moveTo(0, h * 0.55);
    for (let i = 0; i <= 8; i++) g.lineTo(w * i / 8, h * 0.55 - Math.sin(i / 8 * Math.PI) * h * 0.22);
    g.lineTo(w, h);
    g.lineTo(0, h);
    g.fill();
  }
  function waterBand(g, w, h) {
    g.fillStyle = PALETTE.water;
    g.fillRect(0, h * 0.62, w, h * 0.38);
    g.fillStyle = PALETTE.waterHi;
    for (let i = 0; i < 7; i++) g.fillRect(i * 29 % w, h * 0.66 + i * 7 % (h * 0.28), 10, 1);
  }
  function pavSil(g, x, y, s) {
    g.fillStyle = "#7a746a";
    g.fillRect(x - s / 2, y, s, 4);
    g.beginPath();
    g.moveTo(x - s * 0.7, y);
    g.lineTo(x, y - s * 0.45);
    g.lineTo(x + s * 0.7, y);
    g.fill();
    g.fillStyle = "#5a544c";
    g.fillRect(x - 2, y + 4, 4, s * 0.5);
  }
  function bridgeSil(g, w, h) {
    g.fillStyle = "#98928a";
    g.beginPath();
    g.moveTo(w * 0.2, h * 0.75);
    g.quadraticCurveTo(w * 0.5, h * 0.4, w * 0.8, h * 0.75);
    g.lineTo(w * 0.8, h * 0.8);
    g.quadraticCurveTo(w * 0.5, h * 0.47, w * 0.2, h * 0.8);
    g.fill();
  }
  function rockSil(g, w, h) {
    g.fillStyle = "#8a9a84";
    for (let i = 0; i < 5; i++) {
      const x = w * 0.12 + i * w * 0.18;
      g.beginPath();
      g.moveTo(x, h * 0.7);
      g.quadraticCurveTo(x + 8, h * 0.35, x + 20, h * 0.7);
      g.fill();
    }
  }
  function drawSpotScene(g, spot, x0, y0, w, h) {
    g.save();
    g.translate(x0, y0);
    g.beginPath();
    g.rect(0, 0, w, h);
    g.clip();
    g.fillStyle = "#dfe8e2";
    g.fillRect(0, 0, w, h);
    switch (spot.id) {
      case 0:
        waterBand(g, w, h);
        pavSil(g, w * 0.5, h * 0.52, 44);
        break;
      case 1:
        hillSil(g, w, h);
        rockSil(g, w, h);
        break;
      case 2:
        hillSil(g, w, h);
        waterBand(g, w, h);
        bridgeSil(g, w, h);
        pavSil(g, w * 0.72, h * 0.42, 30);
        break;
    }
    g.restore();
  }
  function drawFrameUI(g, spot, captured, total, now2, beat) {
    const fw = VIEW_W * 0.62, fh = VIEW_H * 0.62;
    const x0 = (VIEW_W - fw) / 2, y0 = (VIEW_H - fh) / 2 - 14;
    const L = 26, c = 3;
    g.fillStyle = "rgba(30,30,38,.45)";
    g.fillRect(0, 0, VIEW_W, y0);
    g.fillRect(0, y0 + fh, VIEW_W, VIEW_H - y0 - fh);
    g.fillRect(0, y0, x0, fh);
    g.fillRect(x0 + fw, y0, VIEW_W - x0 - fw, fh);
    drawSpotScene(g, spot, x0, y0, fw, fh);
    g.strokeStyle = PALETTE.qing;
    g.lineWidth = c;
    const corner = (cx, cy, sx, sy) => {
      g.beginPath();
      g.moveTo(cx + sx * L, cy);
      g.lineTo(cx, cy);
      g.lineTo(cx, cy + sy * L);
      g.stroke();
    };
    corner(x0, y0, 1, 1);
    corner(x0 + fw, y0, -1, 1);
    corner(x0, y0 + fh, 1, -1);
    corner(x0 + fw, y0 + fh, -1, -1);
    g.lineWidth = 1.5;
    for (let i = 1; i <= 3; i++) {
      const t = fw / 4 * i;
      g.beginPath();
      g.moveTo(x0 + t, y0);
      g.lineTo(x0 + t, y0 + 6);
      g.stroke();
      g.beginPath();
      g.moveTo(x0 + t, y0 + fh);
      g.lineTo(x0 + t, y0 + fh - 6);
      g.stroke();
    }
    const cardW = 300, cardH = 64, cardX = (VIEW_W - cardW) / 2, cardY = VIEW_H - cardH - 18;
    px(g, cardX, cardY, cardW, cardH, "#f7f2e7");
    px(g, cardX, cardY, cardW, 2, "#c9bfa8");
    g.fillStyle = PALETTE.ink;
    g.font = '15px "Songti SC","STSong",serif';
    g.fillText(spot.poem, cardX + 16, cardY + 26);
    g.fillStyle = PALETTE.ink === "#2b2824" ? "#6b6355" : "#6b6355";
    g.font = '11px "Songti SC","STSong",serif';
    g.fillText(spot.source, cardX + 16, cardY + 46);
    for (let i = 0; i < total; i++) {
      const filled = i < captured;
      px(g, cardX + cardW - 20 - i * 18, cardY + 10, 10, 10, filled ? PALETTE.zhu : "#d8ceae");
    }
    g.fillStyle = "#6b6355";
    g.font = '12px "PingFang SC",sans-serif';
    g.fillText("\u6309 E / \u70B9\u51FB \u2014\u2014 \u5408\u4E0A\u8FD9\u4E00\u5E45", cardX + 16, cardY + cardH - 8);
    if (beat) {
      g.fillStyle = "rgba(10,10,12,.55)";
      g.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }
  function drawToast(g, text, sinceMs) {
    if (sinceMs > 2600) return;
    const a = sinceMs < 300 ? sinceMs / 300 : sinceMs > 2200 ? (2600 - sinceMs) / 400 : 1;
    g.globalAlpha = Math.max(0, Math.min(1, a));
    px(g, VIEW_W / 2 - 110, 60, 220, 46, "#f7f2e7");
    px(g, VIEW_W / 2 - 110, 60, 220, 3, PALETTE.zhu);
    g.fillStyle = PALETTE.ink;
    g.font = '18px "Songti SC","STSong",serif';
    g.textAlign = "center";
    g.fillText(text, VIEW_W / 2, 90);
    g.textAlign = "left";
    g.globalAlpha = 1;
  }

  // src/ui/viewfinder.ts
  var Viewfinder = class {
    constructor(spots2) {
      this.spots = spots2;
      this.captured = /* @__PURE__ */ new Set();
      this.state = { mode: "idle" };
      this.onAllCaptured = null;
      /** 成片即存相册（Web 存档双保险的 localStorage 挂点，白模期先内存）。 */
      this.album = [];
    }
    spotNear(x, y) {
      let best = null, bd = Infinity;
      for (const s of this.spots) {
        const d = Math.hypot(x - s.x, y - s.y);
        if (d < TUNING.viewTriggerRadius && d < bd) {
          bd = d;
          best = s;
        }
      }
      return best;
    }
    /** 返回是否接管了这次交互。 */
    interact(x, y, now2) {
      if (this.state.mode === "framing") {
        this.capture(now2);
        return true;
      }
      if (this.state.mode === "beat") return true;
      const s = this.spotNear(x, y);
      if (s) {
        this.state = { mode: "framing", idx: s.id, enteredAt: now2 };
        return true;
      }
      return false;
    }
    cancel() {
      if (this.state.mode !== "idle") this.state = { mode: "idle" };
    }
    capture(now2) {
      if (this.state.mode !== "framing") return;
      const idx2 = this.state.idx;
      if (!this.captured.has(idx2)) {
        this.captured.add(idx2);
        const s = this.spots[idx2];
        this.album.push({ id: idx2, poem: s.poem, source: s.source, at: now2 });
        if (this.captured.size === this.spots.length) this.onAllCaptured?.();
      }
      this.state = { mode: "idle" };
    }
    /** 静默拍结束时由主循环调用：进入 framing 即视为可成片。 */
    update(now2) {
      if (this.state.mode === "beat" && now2 - this.state.enteredAt >= TUNING.stopBeatMs) {
        this.state = { mode: "idle" };
      }
    }
    get framingIdx() {
      return this.state.mode === "framing" ? this.state.idx : null;
    }
  };

  // src/core/progression.ts
  var SAVE_KEY = "gusu-nine-gardens-rpg-v1";
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
  function hasStoryFlag(progress, flag) {
    const alias = FLAG_ALIASES[flag];
    return progress.storyFlags.includes(flag) || !!alias && progress.storyFlags.includes(alias);
  }
  function markStoryFlag(flag) {
    const progress = loadProgress();
    if (!progress.storyFlags.includes(flag)) {
      progress.storyFlags.push(flag);
      saveProgress(progress);
    }
    return progress;
  }
  function saveProgress(progress) {
    try {
      progress.updatedAt = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
    } catch {
    }
  }

  // src/main.ts
  var canvas = document.getElementById("game");
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  var ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  var params = new URLSearchParams(location.search);
  var debugGeometry = params.get("debug") === "geometry";
  var MODE = location.hash === "#slice" ? "slice" : location.hash === "#garden" || location.pathname.endsWith("garden.html") ? "garden" : "main";
  var data = MODE === "slice" ? buildCorridorSlice() : MODE === "garden" ? buildCanglangGarden() : buildCanglangMap();
  if (debugGeometry) {
    const geometryErrors = validateTileScene(MODE, data, STANDARD_PLAYER_PROFILE);
    if (geometryErrors.length) console.warn("[\u573A\u666F\u51E0\u4F55\u6821\u9A8C]", ...geometryErrors);
    else console.info(`[\u573A\u666F\u51E0\u4F55\u6821\u9A8C] ${MODE} \u901A\u8FC7`);
  }
  var worldW = data.w * TILE;
  var worldH = data.h * TILE;
  var layers = MODE === "slice" ? buildSliceLayers(data) : MODE === "garden" ? null : buildLayers(data);
  var g25 = MODE === "garden" ? buildGarden25d(data) : null;
  var spots = MODE === "slice" ? SLICE_SPOTS : MODE === "garden" ? GARDEN_SPOTS : VIEW_SPOTS;
  var vf = new Viewfinder(spots);
  var engine = new Engine();
  var storyBlocking = false;
  var player = { x: data.spawn.x, y: data.spawn.y, dir: 0, moving: false, wt: 0 };
  var cam = { x: 0, y: 0 };
  function clampCam(v, max) {
    if (max <= 0) return max / 2;
    return v < 0 ? 0 : v > max ? max : v;
  }
  var toastText = "";
  var toastAt = 0;
  var now = 0;
  var ZOOM = MODE === "garden" ? 3 : 1;
  var viewW = Math.floor(VIEW_W / ZOOM);
  var viewH = Math.floor(VIEW_H / ZOOM);
  engine.onInteract = () => {
    if (storyBlocking) return;
    if (vf.interact(player.x, player.y, now)) return;
  };
  engine.onCancel = () => vf.cancel();
  engine.onTap = () => {
    if (storyBlocking) return;
    if (vf.interact(player.x, player.y, now)) return;
  };
  engine.attachKeys();
  engine.attachTap(canvas);
  engine.attachTouchControls(document.querySelector("[data-touch-controls]"));
  vf.onAllCaptured = () => {
    toastText = MODE === "slice" ? "\u4E09\u7A97\u5408 \xB7 \u8BD5\u94FA\u6BB5\u901A\u8FC7" : MODE === "garden" ? "\u4E09\u7A97\u5408 \xB7 \u6CA7\u6D6A\u4EAD" : "\u56ED\u8C31 +1 \xB7 \u6CA7\u6D6A\u4EAD";
    toastAt = now;
  };
  if (location.hash === "#view") {
    vf.state = { mode: "framing", idx: 0, enteredAt: 0 };
  }
  var sp = location.hash.match(/x(\d+)y(\d+)/);
  if (sp) {
    player.x = +sp[1] * TILE + 8;
    player.y = +sp[2] * TILE + 14;
  }
  var arrivalLayer = document.getElementById("gardenArrival");
  if (MODE === "garden" && arrivalLayer) {
    const progress = loadProgress();
    const forcedArrival = params.get("scene") === "arrival";
    const closeArrival = () => {
      markStoryFlag("canglang-arrival-seen");
      arrivalLayer.hidden = true;
      storyBlocking = false;
      canvas.focus();
    };
    document.getElementById("arrivalExplore")?.addEventListener("click", closeArrival);
    document.getElementById("arrivalCorridor")?.addEventListener("click", () => markStoryFlag("canglang-arrival-seen"));
    if (forcedArrival || !hasStoryFlag(progress, "canglang-arrival-seen")) {
      arrivalLayer.hidden = false;
      storyBlocking = true;
      document.getElementById("arrivalExplore")?.focus();
    }
  }
  engine.start((dt) => {
    now = performance.now();
    vf.update(now);
    const a = engine.axis();
    player.moving = !!(a.dx || a.dy) && vf.state.mode === "idle" && !storyBlocking;
    if (player.moving) {
      if (Math.abs(a.dx) >= Math.abs(a.dy)) player.dir = a.dx < 0 ? 1 : 2;
      else player.dir = a.dy < 0 ? 3 : 0;
      player.wt += dt;
      moveEntity(
        data.map,
        player,
        a.dx * TUNING.moveSpeed * dt,
        a.dy * TUNING.moveSpeed * dt,
        data.w,
        data.h,
        [],
        STANDARD_PLAYER_PROFILE
      );
    } else {
      player.wt = 0;
    }
    const targetX = clampCam(player.x - viewW / 2, worldW - viewW);
    const targetY = worldH >= viewH ? clampCam(player.y - viewH / 2, worldH - viewH) : -(viewH - worldH) / 2;
    cam.x += (targetX - cam.x) * TUNING.camLerp;
    cam.y += (targetY - cam.y) * TUNING.camLerp;
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (MODE === "garden" && g25) {
      ctx.save();
      ctx.scale(ZOOM, ZOOM);
      ctx.drawImage(g25.ground, Math.round(-cam.x), Math.round(-cam.y));
      const pyRow = Math.floor(player.y / TILE);
      const y0 = Math.max(0, Math.floor(cam.y / TILE) - 1);
      const y1 = Math.min(data.h - 1, Math.ceil((cam.y + viewH) / TILE) + 1);
      let playerDrawn = pyRow < y0;
      for (let ty = y0; ty <= y1; ty++) {
        if (ty === pyRow) {
          drawPlayer(ctx, player, cam);
          playerDrawn = true;
        }
        ctx.drawImage(g25.strips[ty], Math.round(-cam.x), Math.round(ty * TILE - 48 - cam.y));
      }
      if (!playerDrawn) drawPlayer(ctx, player, cam);
      drawMarkers(ctx, spots, cam, vf.captured, now);
      if (debugGeometry) {
        drawTileGeometryDebug(ctx, data, cam, { w: viewW, h: viewH }, player, STANDARD_PLAYER_PROFILE);
        if (data.landmarks) drawSceneLandmarks(ctx, data.landmarks, cam);
      }
      ctx.restore();
    } else if (layers) {
      drawLayers(ctx, layers, cam);
      drawPlayer(ctx, player, cam);
      drawMarkers(ctx, spots, cam, vf.captured, now);
      if (debugGeometry) {
        drawTileGeometryDebug(ctx, data, cam, { w: VIEW_W, h: VIEW_H }, player, STANDARD_PLAYER_PROFILE);
        if (data.landmarks) drawSceneLandmarks(ctx, data.landmarks, cam);
      }
    }
    const fi = vf.framingIdx;
    if (fi !== null) {
      const beat = vf.state.mode === "beat";
      drawFrameUI(ctx, spots[fi], vf.captured.size, spots.length, now, beat);
    }
    if (toastText) drawToast(ctx, toastText, now - toastAt);
    if (vf.state.mode === "idle" && now - toastAt > 3e3) {
      ctx.fillStyle = "rgba(43,40,36,.55)";
      ctx.fillRect(0, VIEW_H - 26, VIEW_W, 26);
      ctx.fillStyle = "#f2ead6";
      ctx.font = '13px "PingFang SC",sans-serif';
      ctx.fillText(
        MODE === "slice" ? "\u590D\u5ECA\u8BD5\u94FA v0.3 \xB7 60 \u7C73 \xB7 WASD/\u65B9\u5411\u952E \u79FB\u52A8 \xB7 \u8D70\u8FD1\u6731\u6846\u7A97\u6309 E \u53D6\u666F \xB7 Esc \u9000\u51FA" : MODE === "garden" ? "\u6CA7\u6D6A\u4EAD 2.5D \u7279\u5199 3\xD7 \xB7 WASD/\u65B9\u5411\u952E \u6E38\u8D70 \xB7 \u6731\u6846\u7A97\u6309 E \u53D6\u666F \xB7 Esc \u9000\u51FA\u53D6\u666F" : "\u767D\u6A21 v0.1 \xB7 WASD/\u65B9\u5411\u952E \u79FB\u52A8 \xB7 \u8D70\u8FD1\u6F0F\u7A97\u5149\u5708\u6309 E \u53D6\u666F \xB7 Esc \u9000\u51FA\u53D6\u666F",
        14,
        VIEW_H - 9
      );
    }
  });
})();
