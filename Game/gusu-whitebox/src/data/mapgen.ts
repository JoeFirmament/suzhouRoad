import { TILE, MAP_W, MAP_H } from '../config.js';
import { T } from './tiles.js';

export interface Building {
  x0: number; y0: number; x1: number; y1: number;
  kind: 'hip' | 'ting' | 'peak';   // 硬山/歇山横脊 | 攒尖方亭 | 小攒尖石亭
}

export interface SceneLandmark {
  id: string;
  label: string;
  x: number;
  y: number;
  evidence: 'verified' | 'inferred' | 'fiction';
}

export interface MapData {
  map: Uint8Array;
  w: number; h: number;             // 地图尺寸（tile）——大地图与试铺段共用
  trees: Array<[number, number]>;   // tile 坐标
  spawn: { x: number; y: number };  // 像素坐标（脚底）
  winX: number[];                   // 三扇教学窗的列号
  buildings?: Building[];           // 屋顶建筑（渲染层画顶）
  landmarks?: SceneLandmark[];      // 实景语义锚点（坐标为可接近脚点，不是建筑中心）
}

const idx = (x: number, y: number) => y * MAP_W + x;
const at = (map: Uint8Array, x: number, y: number) =>
  x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? T.WALL : map[idx(x, y)];

function rect(map: Uint8Array, x0: number, y0: number, x1: number, y1: number, v: number) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) map[idx(x, y)] = v;
}

/** 椭圆填充（假山成组），内部偶留草地孔做石缝，带尝试上限防死循环。 */
function blob(map: Uint8Array, x0: number, y0: number, x1: number, y1: number, v: number) {
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const rx = (x1 - x0) / 2 + 0.5, ry = (y1 - y0) / 2 + 0.5;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const dx = (x - cx) / rx, dy = (y - cy) / ry;
    if (dx * dx + dy * dy > 1 || map[idx(x, y)] !== T.GRASS) continue;
    if (v === T.ROCK && Math.abs(dx) < 0.7 && Math.abs(dy) < 0.7 && (x * 7 + y * 11) % 9 === 0) continue;
    map[idx(x, y)] = v;
  }
}

function scatter(map: Uint8Array, v: number, n: number, x0: number, y0: number, x1: number, y1: number) {
  let left = n, tries = 0;
  const cap = n * 60; // 保险：找不到空地就放弃，绝不死循环
  while (left > 0 && tries < cap) {
    const x = x0 + ((Math.random() * (x1 - x0 + 1)) | 0);
    const y = y0 + ((Math.random() * (y1 - y0 + 1)) | 0);
    tries++;
    if (at(map, x, y) === T.GRASS) { map[idx(x, y)] = v; left--; }
  }
}

/**
 * 沧浪亭白模地图 v2（程序化）。
 * 考据注记：本图为示意白模——面水轩端位、复廊长度、窗纹、树位
 * 全部待刘敦桢《苏州古典园林》总平面图与实勘裁决后重排。
 */
export function buildCanglangMap(): MapData {
  const map = new Uint8Array(MAP_W * MAP_H);
  rect(map, 0, 0, MAP_W - 1, MAP_H - 1, T.GRASS);

  // 北面外水（葑溪）+ 石岸
  rect(map, 0, 0, MAP_W - 1, 4, T.WATER);
  rect(map, 0, 5, MAP_W - 1, 5, T.PATH);

  // 复廊：外廊 / 中墙 / 内廊
  rect(map, 6, 6, 73, 7, T.CORR);
  rect(map, 6, 8, 73, 8, T.WALL);
  rect(map, 6, 9, 73, 9, T.CORR);
  // 廊两端开口（走复廊需从两端进出）
  for (const x of [6, 7, 72, 73]) map[idx(x, 8)] = T.CORR;

  // 三扇教学漏窗
  const winX = [18, 38, 58];
  for (const x of winX) map[idx(x, 8)] = T.WIN;

  // 动径
  rect(map, 0, 10, MAP_W - 1, 10, T.PATH);   // 廊南横径
  rect(map, 12, 10, 12, 30, T.PATH);          // 主径
  rect(map, 12, 18, 40, 18, T.PATH);          // 北支径（穿月门）
  rect(map, 12, 24, 64, 24, T.PATH);          // 中横径
  rect(map, 12, 30, 60, 30, T.PATH);          // 南横径

  // 粉墙 + 月门（两格门洞，碰撞盒占两格）
  rect(map, 26, 12, 26, 21, T.WALL);
  map[idx(26, 18)] = T.PATH; map[idx(26, 19)] = T.PATH;
  rect(map, 46, 24, 46, 33, T.WALL);
  map[idx(46, 28)] = T.PATH; map[idx(46, 29)] = T.PATH;
  rect(map, 12, 40, 40, 40, T.WALL);
  map[idx(26, 40)] = T.PATH; map[idx(26, 41)] = T.PATH;

  // 假山带（成组）
  blob(map, 14, 11, 42, 16, T.ROCK);
  blob(map, 20, 13, 36, 15, T.ROCK);

  // 东部水池 + 石桥 + 水榭平台 + 亭
  rect(map, 48, 32, 62, 40, T.WATER);
  rect(map, 54, 30, 55, 42, T.BRIDGE);
  rect(map, 50, 26, 60, 29, T.PLAT);
  rect(map, 30, 33, 35, 37, T.PLAT);

  // 花境与树
  scatter(map, T.FLOWER, 40, 2, 12, MAP_W - 3, 46);
  const trees: Array<[number, number]> = [
    [8, 14], [10, 20], [16, 13], [22, 12], [34, 12], [43, 13], [46, 18], [66, 13],
    [70, 15], [74, 12], [8, 27], [16, 34], [24, 44], [30, 27], [40, 36], [44, 26],
    [66, 30], [72, 26], [76, 36], [68, 42], [38, 44], [8, 40],
  ];
  for (const [x, y] of trees) if (at(map, x, y) === T.GRASS) map[idx(x, y)] = T.TREE;

  rect(map, 0, 48, MAP_W - 1, 48, T.WALL); // 南界墙

  return {
    map,
    w: MAP_W, h: MAP_H,
    trees,
    spawn: { x: 12 * TILE + 8, y: 22 * TILE },
    winX,
  };
}

/**
 * 复廊试铺段（#slice 模式）。布局与 assets/canglang/slice_corridor_v03.png 一致：
 * 120×14 tile，1 tile=0.5m，全长 60 米（考据值：219 吴尺×0.275m）。
 *   r0-3 葑溪 | r4 石栏 | r5 外廊 | r6 中墙(漏窗) | r7-8 内廊 | r9 蹬道 | r10-12 假山 | r13 山缘
 * 西端面水轩(x0-5) · 东端观鱼处(x116-118) · 山巅石亭(x56-59) · M2三窗朱框 x=35/60/88（方案2 艺术加工）。
 * 考据注记：直段漏窗约21扇、其余窗均为长方形框（王雪乔 2021）；特殊框形仅三窗使用。
 */
export function buildCorridorSlice(): MapData {
  const W = 120, H = 14;
  const map = new Uint8Array(W * H);
  const set = (x: number, y: number, v: number) => {
    if (x >= 0 && y >= 0 && x < W && y < H) map[y * W + x] = v;
  };

  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let v: number = T.GRASS;
    if (y <= 3) v = T.WATER;
    else if (y === 4) v = T.RAIL;
    else if (y === 5) v = T.CORR;
    else if (y === 6) v = T.WALL;
    else if (y === 7 || y === 8) v = T.CORR;
    else if (y === 9) v = T.DIRT;
    else if (y <= 12) v = T.ROCK;
    map[y * W + x] = v;
  }

  // 中墙漏窗：每 6 tile 一扇（≈3m，21 扇节奏）
  const CORR_X0 = 6, CORR_X1 = 115;
  for (let x = CORR_X0 + 2; x < CORR_X1; x += 6) set(x, 6, T.WIN);
  // M2 三窗（方案 2：直段朱框特殊窗，渲染层区分框形）
  const winX = [35, 60, 88];
  for (const x of winX) set(x, 6, T.WIN);
  // 复廊两端必须让外廊与内廊连通；任务点可达性测试会守住这条约束。
  for (const x of [6, 7, 114, 115]) set(x, 6, T.CORR);

  // 西端：面水轩（硬山顶，占 r4-9）
  for (let y = 4; y <= 9; y++) for (let x = 0; x <= 5; x++) set(x, y, T.ROOF);
  // 东端：观鱼处（攒尖方亭 r3-6）+ 亭前平台 r7-8
  for (let y = 3; y <= 6; y++) for (let x = 116; x <= 118; x++) set(x, y, T.ROOF);
  for (let y = 7; y <= 8; y++) for (let x = 116; x <= 118; x++) set(x, y, T.PAV);
  // 山巅石亭（词表 #12 ROOF-TING）
  for (let y = 11; y <= 12; y++) for (let x = 56; x <= 59; x++) set(x, y, T.ROOF);

  const trees: Array<[number, number]> = [[72, 10]];

  return {
    map,
    w: W, h: H,
    trees,
    spawn: { x: 8 * TILE + 8, y: 5 * TILE + 12 },   // 外廊西段
    winX,
  };
}

/**
 * 沧浪亭整园底图 v1（#garden）——四步管线「图纸→像素→艺术化→底图」第一版。
 * 图纸来源（v1 为文字平面转译，扫描件到位后逐项校正）：
 *   · 沈鸿鑫《苏舜钦与沧浪亭》人民日报（引刘敦桢《苏州古典园林》布局）：园门北向、开门见山、
 *     山巅沧浪亭、山南明道堂/五百名贤祠/看山楼、复廊北临水面水轩（西）观鱼处（东）。
 *   · 本地宝官方游线：北门渡石桥入园→两翼修廊→中央山丘→西南枫杨小院→东清香馆五百名贤祠
 *     →南翠玲珑看山楼→折东明道堂→堂北山巅沧浪亭→复廊观鱼处面水轩。
 *   · 考据三表/复廊三挂起项考据：复廊 60m 西端面水轩、东端观鱼处；三窗方案 2 直段朱框。
 * 比例：1 tile = 1m；园内约 94m × 56m（实园 1.1ha 量级相符）。
 */
export function buildCanglangGarden(): MapData {
  const W = 100, H = 57;
  const map = new Uint8Array(W * H);
  const set = (x: number, y: number, v: number) => {
    if (x >= 0 && y >= 0 && x < W && y < H) map[y * W + x] = v;
  };
  const fill = (x0: number, y0: number, x1: number, y1: number, v: number) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, v);
  };

  fill(0, 0, W - 1, H - 1, T.GRASS);

  // —— 北：葑溪（园外借景）+ 驳岸 + 石桥 ——
  fill(0, 0, W - 1, 5, T.WATER);            // y0 深水（渲染层按行判）
  fill(0, 6, W - 1, 6, T.RAIL);             // 临水驳岸石栏（复廊外侧）
  fill(46, 0, 49, 7, T.BRIDGE);             // 渡桥：自北岸越水至门

  // —— 复廊（y8 外廊 | y9 中墙漏窗 | y10 内廊），x7-88；西端面水轩、东端观鱼处 ——
  fill(7, 8, 88, 8, T.CORR);
  fill(7, 9, 88, 9, T.WALL);
  fill(7, 10, 88, 10, T.CORR);
  // 园门洞：x46-49 三行打通（渡桥直入）
  fill(46, 8, 49, 10, T.CORR);
  // 门楼屋顶（门洞两侧）
  fill(43, 7, 45, 8, T.ROOF);
  fill(50, 7, 52, 8, T.ROOF);

  // 中墙漏窗：每 3 tile 一扇（≈每间一窗，参考图密度），避开门洞与三窗
  const winX = [24, 64, 80];
  for (let x = 8; x <= 87; x += 3) {
    if (winX.includes(x) || (x >= 44 && x <= 51)) continue;
    set(x, 9, T.WIN);
  }
  for (const x of winX) set(x, 9, T.WIN);

  // —— 中央假山（土石相间，开门见山）——
  // 先填山体，再刻蹬道
  blobGarden(map, W, H, 12, 14, 50, 32, T.ROCK);
  fill(24, 12, 25, 19, T.DIRT);             // 北蹬道（自廊后登山）
  fill(18, 20, 44, 21, T.DIRT);             // 山脊径
  fill(30, 22, 31, 32, T.DIRT);             // 南蹬道下山
  fill(44, 21, 45, 32, T.DIRT);             // 东径下山
  // 山巅沧浪亭（石柱方亭，词表 #12）
  fill(27, 16, 31, 19, T.ROOF);
  // 印心石屋（山南小筑）
  fill(34, 27, 37, 29, T.ROOF);

  // —— 山南径 + 主庭院 ——
  fill(6, 33, 88, 33, T.PATH);

  // 明道堂（园中最大建筑）+ 前庭
  fill(58, 16, 72, 24, T.ROOF);
  fill(56, 25, 74, 27, T.PAV);
  fill(64, 28, 65, 32, T.PATH);
  // 五百名贤祠 + 前院
  fill(76, 18, 88, 23, T.ROOF);
  fill(76, 24, 88, 25, T.PAV);
  fill(82, 26, 83, 32, T.PATH);
  // 瑶华境界（山南厅，考据：不在复廊线上）
  fill(58, 29, 64, 31, T.ROOF);
  fill(65, 30, 66, 32, T.PATH);

  // —— 东南：清香馆 + 翠玲珑（竹林环抱）——
  fill(74, 36, 86, 41, T.ROOF);
  fill(74, 42, 86, 42, T.PAV);
  fill(80, 43, 81, 46, T.PATH);
  fill(52, 34, 53, 41, T.PATH);             // 山南径→翠玲珑
  fill(48, 42, 54, 45, T.ROOF);
  fill(44, 38, 58, 48, T.BAMBOO);
  // 竹林中清出屋基与路
  fill(47, 41, 55, 46, T.GRASS);
  fill(48, 42, 54, 45, T.ROOF);
  fill(52, 42, 53, 48, T.PATH);

  // —— 极南：看山楼 + 竹林 ——
  fill(24, 48, 36, 54, T.BAMBOO);
  fill(28, 43, 29, 54, T.PATH);             // 南径贯穿竹林（至南界墙前）
  fill(26, 50, 36, 53, T.GRASS);            // 楼前空地
  fill(30, 50, 34, 52, T.ROOF);             // 看山楼（路东侧，曲廊尽处）
  fill(26, 36, 27, 47, T.PATH);             // 山南径→竹林北口

  // —— 西南枫杨小院 + 御碑亭 ——
  fill(16, 40, 19, 43, T.ROOF);             // 御碑亭（小攒尖）
  fill(17, 44, 18, 47, T.PATH);
  fill(6, 34, 15, 34, T.PATH);              // 西南院入口径

  // —— 园界墙：南/西/东（北面临水敞开=借景，无墙）——
  fill(0, 55, W - 1, 55, T.WALL);
  fill(0, 7, 0, 55, T.WALL);
  fill(94, 7, 94, 55, T.WALL);

  // —— 树与花境 ——
  const trees: Array<[number, number]> = [
    // 西南小院枫杨（数株合抱）
    [4, 38], [8, 42], [5, 47], [11, 49], [13, 44],
    // 山上古木
    [16, 16], [21, 15], [35, 15], [40, 17], [46, 16], [14, 26], [47, 28], [20, 30], [38, 31],
    // 庭院树
    [54, 18], [75, 15], [90, 28], [90, 45], [70, 46], [60, 44], [42, 34], [70, 34],
    // 竹林外缘
    [40, 50], [46, 52], [34, 44],
  ];
  for (const [x, y] of trees) if (map[y * W + x] === T.GRASS) map[y * W + x] = T.TREE;
  for (let i = 0; i < 60; i++) {
    const x = 2 + ((i * 37) % (W - 4)), y = 12 + ((i * 53) % (H - 15));
    if (map[y * W + x] === T.GRASS) map[y * W + x] = T.FLOWER;
  }

  const buildings: Building[] = [
    { x0: 1, y0: 7, x1: 6, y1: 11, kind: 'hip' },       // 面水轩（西端收头，硬山）
    { x0: 89, y0: 7, x1: 93, y1: 10, kind: 'ting' },    // 观鱼处（东端尽头，攒尖方亭）
    { x0: 43, y0: 7, x1: 45, y1: 8, kind: 'hip' },      // 门楼西
    { x0: 50, y0: 7, x1: 52, y1: 8, kind: 'hip' },      // 门楼东
    { x0: 27, y0: 16, x1: 31, y1: 19, kind: 'peak' },   // 沧浪亭（山巅石亭）
    { x0: 34, y0: 27, x1: 37, y1: 29, kind: 'hip' },    // 印心石屋
    { x0: 58, y0: 16, x1: 72, y1: 24, kind: 'hip' },    // 明道堂
    { x0: 76, y0: 18, x1: 88, y1: 23, kind: 'hip' },    // 五百名贤祠
    { x0: 58, y0: 29, x1: 64, y1: 31, kind: 'hip' },    // 瑶华境界
    { x0: 74, y0: 36, x1: 86, y1: 41, kind: 'hip' },    // 清香馆
    { x0: 48, y0: 42, x1: 54, y1: 45, kind: 'hip' },    // 翠玲珑
    { x0: 30, y0: 50, x1: 34, y1: 52, kind: 'peak' },   // 看山楼
    { x0: 16, y0: 40, x1: 19, y1: 43, kind: 'peak' },   // 御碑亭
  ];

  const landmarks: SceneLandmark[] = [
    { id: 'north-bridge-gate', label: '渡桥与北向山门', x: 47.5 * TILE, y: 11.5 * TILE, evidence: 'verified' },
    { id: 'canglang-pavilion', label: '山巅沧浪亭', x: 29 * TILE, y: 21.5 * TILE, evidence: 'verified' },
    { id: 'double-corridor', label: '临水复廊', x: 62 * TILE, y: 10.5 * TILE, evidence: 'verified' },
    { id: 'mianshui-xuan', label: '面水轩（西端）', x: 7.5 * TILE, y: 10.5 * TILE, evidence: 'verified' },
    { id: 'guanyu-place', label: '观鱼处（东端）', x: 89.5 * TILE, y: 11.5 * TILE, evidence: 'verified' },
    { id: 'mingdao-hall', label: '明道堂', x: 64.5 * TILE, y: 27.5 * TILE, evidence: 'verified' },
    { id: 'five-hundred-worthies', label: '五百名贤祠', x: 82 * TILE, y: 26.5 * TILE, evidence: 'verified' },
    { id: 'qingxiang-hall', label: '清香馆一带', x: 80 * TILE, y: 43.5 * TILE, evidence: 'verified' },
    { id: 'teaching-windows', label: '三扇教学窗（艺术加工）', x: 64 * TILE, y: 8.5 * TILE, evidence: 'fiction' },
  ];

  // 观鱼处亭前平台（复廊衔接）
  fill(89, 11, 93, 11, T.PAV);

  return {
    map,
    w: W, h: H,
    trees,
    spawn: { x: 47 * TILE + 8, y: 12 * TILE },     // 渡桥入门，开门见山
    winX,
    buildings,
    landmarks,
  };
}

/** 整园假山 blob（mapgen 内部版，直接按给定尺寸工作）。 */
function blobGarden(map: Uint8Array, W: number, _H: number, x0: number, y0: number, x1: number, y1: number, v: number): void {
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const rx = (x1 - x0) / 2 + 0.5, ry = (y1 - y0) / 2 + 0.5;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const dx = (x - cx) / rx, dy = (y - cy) / ry;
    if (dx * dx + dy * dy > 1) continue;
    if (Math.abs(dx) < 0.7 && Math.abs(dy) < 0.7 && (x * 7 + y * 11) % 17 === 0) continue; // 少量石缝留草
    map[y * W + x] = v;
  }
}
