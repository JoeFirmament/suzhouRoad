import { TILE, PALETTE as P } from '../config.js';
import { T } from '../data/tiles.js';
import type { MapData, Building } from '../data/mapgen.js';
import type { Ctx } from './pixel.js';

/**
 * 沧浪亭整园 2.5D 渲染 v3 —— 风格基线：小飞虹 2.5D 等距像素画（用户 2026-09-28 定标）。
 * 与 v2 差距四刀：①相机 3× 特写（main.ts）；②逐像素精绘（瓦垄/瓦当/万字纹/树冠团块/石纹逐点画）；
 * ③全立物落地投影；④色板 v3 增补 8 色（浓郁饱和基调）。
 * 结构不变：ground（平地+倒影烘焙）+ strips[ty]（每行对象条带，含上溢），主循环按行合成遮挡。
 */

type G = Ctx;
const R = (g: G, x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const LINE = (g: G, x0: number, y0: number, x1: number, y1: number, c: string) => {
  g.strokeStyle = c; g.beginPath(); g.moveTo(x0 + 0.5, y0 + 0.5); g.lineTo(x1 + 0.5, y1 + 0.5); g.stroke();
};
const SHADOW = 'rgba(43,40,36,.24)';
function shadowE(g: G, cx: number, cy: number, rx: number, ry: number): void {
  g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = SHADOW; g.fill();
}

function nz(x: number, y: number, s = 0): number {
  let h = (x * 374761393 + y * 668265263 + s * 974711) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = (h ^ (h >>> 16)) >>> 0;
  return (h % 10000) / 10000;
}
/** 椭圆内撒点（逐像素质感）。 */
function speckle(g: G, cx: number, cy: number, rx: number, ry: number, n: number, seed: number, colors: string[]): void {
  for (let i = 0; i < n; i++) {
    const a = nz(seed, i, 7) * Math.PI * 2;
    const rr = Math.sqrt(nz(seed, i, 8));
    const x = cx + Math.cos(a) * rx * rr, y = cy + Math.sin(a) * ry * rr;
    R(g, x | 0, y | 0, 1, 1, colors[i % colors.length]);
  }
}

/* ================= 平地（ground 缓存，逐 tile） ================= */

function gGrass(g: G, tx: number, ty: number, flower: boolean): void {
  const X = tx * TILE, Y = ty * TILE;
  R(g, X, Y, TILE, TILE, P.leafSat);                          // 饱和草坪基色
  for (let i = 0; i < 4; i++)                                  // 亮斑回填
    R(g, X + ((nz(tx, ty, 2 + i) * 13) | 0), Y + ((nz(tx, ty, 12 + i) * 13) | 0), 2 + ((nz(tx, ty, 16 + i) * 2) | 0), 1, P.grassAlt);
  for (let i = 0; i < 5; i++)                                  // 深浅斑驳
    R(g, X + ((nz(tx, ty, 1 + i) * 15) | 0), Y + ((nz(tx, ty, 11 + i) * 15) | 0), 1, 1, i < 3 ? P.leafDeep : P.willow);
  if (nz(tx, ty, 21) < 0.25) R(g, X + 2 + ((nz(tx, ty, 22) * 10) | 0), Y + 2 + ((nz(tx, ty, 23) * 10) | 0), 3, 2, P.leafDeep);
  if (flower) {
    for (let i = 0; i < 3; i++)
      R(g, X + 3 + ((nz(tx, ty, 10 + i) * 10) | 0), Y + 3 + ((nz(tx, ty, 20 + i) * 10) | 0), 1, 1, [P.zhuBright, P.gold, P.willow][i]);
  }
}

function gWater(g: G, tx: number, ty: number, deep: boolean, bank: boolean): void {
  const X = tx * TILE, Y = ty * TILE;
  R(g, X, Y, TILE, TILE, deep ? P.waterTealDeep : P.waterTeal);
  for (let i = 0; i < 2; i++)                                    // 波光双线
    R(g, X + ((nz(tx, ty, 4 + i) * 4) | 0), Y + 2 + ((nz(tx, ty, 6 + i) * 12) | 0), 5 + ((nz(tx, ty, 8 + i) * 8) | 0), 1, i ? P.waterTealDeep : P.waterGlow);
  if (nz(tx, ty, 10) < 0.3) R(g, X + ((nz(tx, ty, 11) * 12) | 0), Y + ((nz(tx, ty, 12) * 14) | 0), 2, 1, P.waterGlow);
  if (bank) {
    R(g, X, Y, TILE, 2, P.rockBase); R(g, X, Y + 2, TILE, 1, P.rockDark);
    for (let x = X + 1; x < X + TILE; x += 4) R(g, x, Y + 2, 1, 2, P.rockBase); // 岸石齿
  }
}

function gFloor(g: G, tx: number, ty: number, kind: 'path' | 'corr' | 'dirt' | 'bridge'): void {
  const X = tx * TILE, Y = ty * TILE;
  if (kind === 'path') {
    R(g, X, Y, TILE, TILE, P.path);
    R(g, X, Y + 5, TILE, 1, P.pathAlt);
    R(g, X + 4 + ((nz(tx, ty, 8) * 8) | 0), Y, 1, TILE, P.pathAlt);
    if (nz(tx, ty, 13) < 0.4) R(g, X + ((nz(tx, ty, 14) * 12) | 0), Y + ((nz(tx, ty, 15) * 12) | 0), 2, 1, P.pathAlt);
  } else if (kind === 'corr') {
    R(g, X, Y, TILE, TILE, P.path);
    R(g, X, Y, 1, TILE, P.pathAlt);
    R(g, X, Y + 8, TILE, 1, P.pathAlt);
    if (nz(tx, ty, 9) < 0.3) R(g, X + 2 + ((nz(tx, ty, 11) * 12) | 0), Y + 2 + ((nz(tx, ty, 12) * 12) | 0), 1, 1, P.wallShade);
  } else if (kind === 'dirt') {
    R(g, X, Y, TILE, TILE, P.pathAlt);
    for (let i = 0; i < 4; i++) R(g, X + 1 + ((nz(tx, ty, 30 + i) * 14) | 0), Y + 1 + ((nz(tx, ty, 40 + i) * 14) | 0), 1, 1, P.grass);
  } else { // bridge
    R(g, X, Y, TILE, TILE, P.rockBase);
    R(g, X, Y, 2, TILE, P.rockDark); R(g, X + TILE - 2, Y, 2, TILE, P.rockDark);
    R(g, X, Y, TILE, 1, P.rockTop);
    if (ty % 2 === 0) R(g, X + 2, Y + 7, TILE - 4, 1, P.rockDark);
  }
}

function gRockGround(g: G, tx: number, ty: number): void {
  const X = tx * TILE, Y = ty * TILE;
  R(g, X, Y, TILE, TILE, P.rockBase);
  for (let i = 0; i < 3; i++)
    R(g, X + ((nz(tx, ty, 50 + i) * 13) | 0), Y + ((nz(tx, ty, 54 + i) * 13) | 0), 2, 1, i ? P.rockDark : P.rockTop);
}

/* ================= 对象（strips，底边锚定 ty 行底 = 条带 local y=64） ================= */

const STRIP_H = 64;
const LOCAL_B = 64;

/** 粉墙立面 + 瓦帽。 */
function wall25(g: G, tx: number, ty: number): void {
  const X = tx * TILE, Yb = LOCAL_B;
  R(g, X, Yb - 14, TILE, 14, P.wall);
  R(g, X + TILE - 1, Yb - 14, 1, 14, P.wallShade);
  R(g, X, Yb - 14, TILE, 1, P.wallShade);
  if (tx % 4 === 0) R(g, X + 7, Yb - 13, 1, 12, P.wallShade);
  R(g, X - 1, Yb - 17, TILE + 2, 3, P.roofChar);           // 瓦帽（炭色）
  R(g, X - 1, Yb - 17, TILE + 2, 1, P.roof);
  R(g, X - 1, Yb - 15, TILE + 2, 1, P.roofRidge);
}

const WIN_PATS = ['bing', 'haitang', 'wan', 'meihua'] as const;

/** 漏窗 = 粉墙上开窗（暗洞 + 木框 + 纹样；三窗朱框特殊形）。 */
function win25(g: G, tx: number, ty: number, pat: string, special: 'fan' | 'leaf' | 'peach' | null): void {
  wall25(g, tx, ty);
  const X = tx * TILE, Yb = LOCAL_B;
  const ox = X + 3, oy = Yb - 13, ow = 10, oh = 9;
  R(g, ox, oy, ow, oh, P.qingDeep);                         // 透窗深底
  if (special) {
    g.strokeStyle = P.zhu; g.lineWidth = 1;
    g.strokeRect(ox + 0.5, oy + 0.5, ow - 1, oh - 1);
    const m = P.inkPale, cx = ox + ow / 2, cy = oy + oh / 2;
    if (special === 'fan') {
      g.beginPath(); g.arc(cx, cy + 2, 3.6, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
      LINE(g, cx, cy + 3, cx, oy + 1, m); LINE(g, cx, cy + 3, ox + 1, oy + 2, m); LINE(g, cx, cy + 3, ox + ow - 1, oy + 2, m);
      R(g, cx, cy + 3, 1, 1, P.zhuBright);
    } else if (special === 'leaf') {
      LINE(g, ox + 1, oy + oh - 1, ox + ow - 1, oy + 1, m);
      g.beginPath(); g.ellipse(cx, cy, 4.4, 2, -Math.PI / 4, 0, Math.PI * 2); g.stroke();
      R(g, ox + ow - 1, oy + 1, 1, 1, P.zhuBright);
    } else {
      g.beginPath(); g.arc(cx, cy + 1.5, 3.4, 0, Math.PI * 2); g.stroke();
      LINE(g, cx, oy + 1, cx - 2, oy + 4, m); LINE(g, cx, oy + 1, cx + 2, oy + 4, m);
      R(g, cx, oy + 1, 1, 1, P.zhuBright);
    }
    g.lineWidth = 1;
  } else {
    g.strokeStyle = P.wood; g.strokeRect(ox + 0.5, oy + 0.5, ow - 1, oh - 1);
    g.strokeStyle = P.gold; g.strokeRect(ox + 1.5, oy + 1.5, ow - 3, oh - 3);
    const m = P.inkPale;
    if (pat === 'bing') { LINE(g, ox + 2, oy + 2, ox + ow - 2, oy + oh - 2, m); LINE(g, ox + ow - 2, oy + 2, ox + 2, oy + oh - 2, m); LINE(g, cx0(ox, ow), oy + 2, cx0(ox, ow), oy + oh - 2, m); }
    else if (pat === 'haitang') { for (const [ax, ay] of [[3, 2], [3, 6], [1, 4], [5, 4]]) g.strokeRect(ox + ax + 0.5, oy + ay + 0.5, 2, 2); }
    else if (pat === 'wan') { LINE(g, ox + 1, cy0(oy, oh), ox + ow - 1, cy0(oy, oh), m); LINE(g, cx0(ox, ow), oy + 1, cx0(ox, ow), oy + oh - 1, m); LINE(g, cx0(ox, ow), oy + 1, ox + ow - 2, oy + 1, m); LINE(g, ox + 2, oy + oh - 1, cx0(ox, ow), oy + oh - 1, m); }
    else { const pts: Array<[number, number]> = [[5, 1], [8, 3], [8, 6], [5, 8], [2, 6], [2, 3]]; for (let i = 0; i < 6; i++) LINE(g, ox + pts[i][0], oy + pts[i][1], ox + pts[(i + 1) % 6][0], oy + pts[(i + 1) % 6][1], m); R(g, ox + 4, oy + 4, 1, 1, m); }
  }
}
const cx0 = (o: number, w: number) => o + (w >> 1);
const cy0 = (o: number, h: number) => o + (h >> 1);

/** 廊柱（落地投影+柱础）。 */
function post25(g: G, tx: number, ty: number): void {
  const X = tx * TILE, Yb = LOCAL_B;
  shadowE(g, X + 8, Yb - 1, 5, 2);
  R(g, X + 6, Yb - 14, 3, 13, P.wood);
  R(g, X + 9, Yb - 14, 1, 13, P.woodDark);
  R(g, X + 5, Yb - 2, 5, 2, P.woodDark);                    // 柱础
}

/** 朱红栏杆（万字格逐格画）。 */
function redRail25(g: G, tx: number): void {
  const X = tx * TILE, Yb = LOCAL_B;
  R(g, X, Yb - 12, TILE, 2, P.zhu);            // 扶手
  R(g, X, Yb - 10, TILE, 1, P.sealRed);
  R(g, X, Yb - 3, TILE, 2, P.zhu);             // 下枋
  R(g, X, Yb - 1, TILE, 1, P.sealRed);
  for (let x = X + 1; x < X + TILE; x += 4) {  // 万字格（回纹）
    R(g, x, Yb - 8, 1, 5, P.zhu);
    R(g, x + 1, Yb - 8, 2, 1, P.zhu);
    R(g, x + 1, Yb - 5, 2, 1, P.zhu);
    R(g, x + 2, Yb - 7, 1, 2, P.sealRed);
  }
  if (tx % 3 === 0) { R(g, X + 7, Yb - 13, 2, 13, P.sealRed); R(g, X + 7, Yb - 13, 1, 13, P.zhu); } // 望柱
}

/** 复廊连排瓦顶（逐像素瓦垄+瓦当+吻）。 */
function corrRoof25(g: G, x0: number, x1: number): void {
  const X0 = x0 * TILE - 4, X1 = (x1 + 1) * TILE + 4, Yb = LOCAL_B;
  const yTop = Yb - 33, yBot = Yb - 1, w = X1 - X0;
  R(g, X0, yTop + 2, w, yBot - yTop - 2, P.roofChar);        // 坡面
  for (let y = yTop + 5; y < yBot - 3; y += 5) R(g, X0, y, w, 1, P.ink);       // 瓦行（横）
  for (let x = X0 + 2; x < X1 - 1; x += 4) R(g, x, yTop + 4, 1, yBot - yTop - 6, P.inkMid); // 筒瓦（竖）
  R(g, X0, yTop + 3, w, 1, P.inkMid);                        // 坡顶受光
  R(g, X0, yTop, w, 2, P.roofRidge);                         // 正脊
  R(g, X0, yTop, w, 1, P.inkPale);
  R(g, X0 - 1, yTop - 3, 3, 4, P.roofRidge); R(g, X1 - 2, yTop - 3, 3, 4, P.roofRidge); // 吻
  R(g, X0, yBot - 2, w, 2, P.roofRidge);                     // 檐口
  for (let x = X0 + 1; x < X1; x += 3) R(g, x, yBot, 1, 1, P.inkMid);   // 瓦当
}

/** 假山巨石（棱面分色：受光面/背光面/裂缝/透孔；行间向上叠压消缝）。 */
function rock25(g: G, tx: number, ty: number, topEdge: boolean): void {
  const X = tx * TILE, Yb = LOCAL_B;
  const roll = nz(tx, ty, 60);
  if (roll < 0.08) return;
  const poly = (pts: number[][], c: string) => {
    g.beginPath(); g.moveTo(pts[0][0] + .5, pts[0][1] + .5);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0] + .5, pts[i][1] + .5);
    g.closePath(); g.fillStyle = c; g.fill();
  };
  const jag = 1 + ((nz(tx, ty, 52) * 3) | 0);
  const h = topEdge ? 15 + jag : 22;                 // 非顶行向上叠压入上一行条带
  const bx = X, bw = 16, by = Yb - h;
  shadowE(g, X + 8, Yb - 1, 13, 3);
  const hy = by + (h * 0.45 | 0);
  poly([[bx, by + 4 + jag], [bx + 3, by + jag], [bx + 12, by + 1 + jag], [bx + bw, by + 4 + jag],
        [bx + bw, Yb - 3], [bx + 12, Yb], [bx + 3, Yb], [bx, Yb - 3]], P.rockBase);      // 主石
  poly([[bx + 1, by + 5 + jag], [bx + 4, by + 1 + jag], [bx + 11, by + 2 + jag], [bx + 13, by + 5 + jag],
        [bx + 13, hy], [bx + 1, hy]], P.rockTop);                                        // 受光面
  poly([[bx + 12, by + 3 + jag], [bx + bw, by + 5 + jag], [bx + bw, Yb - 3], [bx + 13, Yb - 1],
        [bx + 12, Yb - 1]], P.rockDark);                                                 // 背光面
  LINE(g, bx + 4, hy - 4, bx + 7 + ((nz(tx, ty, 54) * 4) | 0), Yb - 4, P.rockDark);      // 裂缝
  LINE(g, bx + 10, hy - 2, bx + 8, Yb - 3, P.rockDark);
  if (nz(tx, ty, 61) < 0.3) { const hx = bx + 4 + ((nz(tx, ty, 62) * 7) | 0), hyy = hy + 3; R(g, hx, hyy, 3, 2, P.inkHeavy); R(g, hx, hyy, 2, 1, P.qingDeep); } // 透孔
  if (topEdge) for (let i = 0; i < 2; i++) R(g, bx + 2 + ((nz(tx, ty, 63 + i) * 10) | 0), by + 1 + jag, 1, 1, P.leafSat); // 苔
}

/** 竹丛（密秆+多层叶）。 */
function bamboo25(g: G, tx: number, ty: number): void {
  const X = tx * TILE, Yb = LOCAL_B;
  shadowE(g, X + 8, Yb - 1, 7, 2);
  for (let i = 0, xx = X + 3; xx <= X + 13; xx += 5, i++) {
    const h = 17 + ((nz(tx, ty, 70 + i) * 7) | 0);
    R(g, xx, Yb - h, 1, h, P.pine);
    R(g, xx + 1, Yb - h + 3, 1, h - 5, P.willow);
    for (let l = 0; l < 4; l++) {
      const ly = Yb - h + 2 + l * 4 + ((nz(tx, ty, 74 + i * 4 + l) * 2) | 0);
      R(g, xx - 2, ly, 3, 1, nz(tx, ty, 80 + l) < 0.5 ? P.leafSat : P.leafDeep);
      R(g, xx, ly - 1, 4, 1, nz(tx, ty, 84 + l) < 0.5 ? P.leafSat : P.leafDeep);
    }
  }
}

/** 古树（露根+分枝+六团块浓冠+逐像素叶点）。 */
function tree25(g: G, tx: number, ty: number): void {
  const cx = tx * TILE + 16, Yb = LOCAL_B;
  shadowE(g, cx + 2, Yb - 1, 22, 5);
  R(g, cx - 3, Yb - 15, 6, 15, P.wood);                        // 粗干
  R(g, cx + 3, Yb - 11, 2, 11, P.woodDark);
  R(g, cx - 8, Yb - 3, 16, 2, P.woodDark);                     // 露根
  LINE(g, cx, Yb - 15, cx - 9, Yb - 24, P.woodDark);           // 分枝
  LINE(g, cx + 2, Yb - 14, cx + 11, Yb - 26, P.woodDark);
  const blobs: Array<[number, number, number, number, string]> = [
    [cx, Yb - 36, 20, 15, P.leafDeep], [cx - 12, Yb - 40, 12, 10, P.leafDeep],
    [cx + 12, Yb - 33, 11, 9, P.leafDeep], [cx - 3, Yb - 46, 10, 8, P.leafDeep],
    [cx - 17, Yb - 31, 8, 7, P.leafDeep], [cx + 18, Yb - 41, 7, 6, P.leafDeep],
  ];
  for (const [bx, by, brx, bry, c] of blobs) { g.beginPath(); g.ellipse(bx, by, brx, bry, 0, 0, Math.PI * 2); g.fillStyle = c; g.fill(); }
  const mids: Array<[number, number, number, number]> = [
    [cx - 10, Yb - 40, 9, 7], [cx + 6, Yb - 36, 8, 6], [cx - 3, Yb - 45, 7, 5], [cx + 14, Yb - 42, 5, 4],
  ];
  for (const [bx, by, brx, bry] of mids) { g.beginPath(); g.ellipse(bx, by, brx, bry, 0, 0, Math.PI * 2); g.fillStyle = P.leafSat; g.fill(); }
  for (const [bx, by, brx, bry] of mids) speckle(g, bx, by, brx, bry, 12, (bx * 7 + by) | 0, [P.leafHi, P.willow]);
  speckle(g, cx, Yb - 36, 20, 14, 24, tx * 91 + ty, [P.leafHi, P.pine, P.willow]);
  speckle(g, cx, Yb - 30, 18, 9, 14, tx * 57 + ty, [P.leafDeep, P.pine]);
}

/** 建筑（台基+排柱立面+格窗+瓦坡吻脊）。 */
function building25(g: G, b: Building): void {
  const X0 = b.x0 * TILE, X1 = (b.x1 + 1) * TILE, Yb = LOCAL_B;
  const w = X1 - X0, depth = b.y1 - b.y0 + 1;
  const fh = depth >= 6 ? 14 : 12;
  const Ye = Yb - fh;
  shadowE(g, (X0 + X1) / 2, Yb - 1, w * 0.55, 5);

  // 台基
  R(g, X0 - 2, Yb - 3, w + 4, 3, P.rockBase);
  R(g, X0 - 2, Yb - 3, w + 4, 1, P.rockTop);
  R(g, X0 - 2, Yb - 1, w + 4, 1, P.rockDark);

  // 立面
  R(g, X0, Ye, w, fh - 3, P.wall);
  R(g, X1 - 1, Ye, 1, fh - 3, P.wallShade);
  R(g, X0, Ye + fh - 4, w, 1, P.wallShade);
  R(g, X0, Ye, w, 2, P.woodDark);                            // 檐下枋
  for (let px = X0 + 2; px < X1 - 2; px += 12) {             // 排柱
    R(g, px, Ye + 2, 2, fh - 5, P.wood);
    R(g, px + 2, Ye + 2, 1, fh - 5, P.woodDark);
  }
  const mid = (X0 + X1) / 2;
  if (w >= 72) { R(g, mid - 10, Yb - 12, 20, 9, P.woodDark); R(g, mid - 1, Yb - 12, 2, 9, P.wood); }  // 大堂门
  else if (w >= 40) { R(g, mid - 7, Yb - 10, 14, 7, P.woodDark); R(g, mid - 1, Yb - 10, 2, 7, P.wood); }
  for (let px = X0 + 8; px < X1 - 10; px += 12) {            // 格窗
    if (Math.abs(px - mid) < 14 && w >= 40) continue;
    R(g, px, Ye + 4, 7, 5, P.woodDark);
    R(g, px + 1, Ye + 5, 5, 3, P.inkHeavy);
    R(g, px + 3, Ye + 5, 1, 3, P.gold);
  }

  if (b.kind === 'hip') {
    const rh = Math.min(22, 10 + depth * 1.4);
    const Yr = Ye - rh;
    g.beginPath();
    g.moveTo(X0 + 3, Yr); g.lineTo(X1 - 3, Yr); g.lineTo(X1 + 3, Ye); g.lineTo(X0 - 3, Ye);
    g.closePath(); g.fillStyle = P.roofChar; g.fill();
    for (let yy = Yr + 3; yy < Ye - 2; yy += 3) {            // 瓦行（横）
      const t = (yy - Yr) / (Ye - Yr);
      const xL = X0 + 3 - 6 * t, xR = X1 - 3 + 6 * t;
      R(g, xL, yy, xR - xL, 1, P.inkMid);
    }
    R(g, X0 - 3, Ye, w + 6, 1, P.inkPale);                   // 檐口
    R(g, X0 - 3, Ye + 1, w + 6, 1, P.roofRidge);
    for (let x = X0 - 2; x < X1 + 2; x += 3) R(g, x, Ye + 2, 1, 1, P.inkMid); // 瓦当
    R(g, X0 + 1, Yr - 2, w - 2 + 4, 2, P.roofRidge);         // 正脊
    R(g, X0 + 1, Yr - 2, w - 2 + 4, 1, P.inkPale);
    R(g, X0 - 1, Yr - 4, 3, 4, P.roofRidge); R(g, X1 - 2, Yr - 4, 3, 4, P.roofRidge); // 吻
    LINE(g, X0 + 3, Yr, X0 - 3, Ye, P.ink);                  // 垂脊
    LINE(g, X1 - 3, Yr, X1 + 3, Ye, P.ink);
  } else { // ting / peak：攒尖
    const rh = b.kind === 'ting' ? 17 : 13;
    const Yt = Ye - rh, cxm = (X0 + X1) / 2;
    g.beginPath();
    g.moveTo(X0 - 3, Ye); g.lineTo(X1 + 3, Ye); g.lineTo(cxm, Yt);
    g.closePath(); g.fillStyle = P.roofChar; g.fill();
    for (let yy = Ye - 2; yy > Yt; yy -= 3) {
      const t = (Ye - yy) / rh;
      const half = (w / 2 + 3) * (1 - t);
      R(g, cxm - half, yy, half * 2, 1, P.inkMid);
    }
    LINE(g, X0 - 3, Ye, cxm, Yt, P.ink); LINE(g, X1 + 3, Ye, cxm, Yt, P.ink);
    R(g, cxm - 1, Yt - 3, 3, 4, P.roofRidge); R(g, cxm, Yt - 5, 1, 2, P.zhuBright); // 宝顶
    R(g, X0 - 3, Ye, w + 6, 1, P.inkPale);
    for (let x = X0 - 2; x < X1 + 2; x += 3) R(g, x, Ye + 2, 1, 1, P.inkMid);
  }
}

/* ================= 组装 ================= */

function makeCanvas(w: number, h: number): [HTMLCanvasElement, G] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  return [c, g];
}

export function buildGarden25d(data: MapData): { ground: HTMLCanvasElement; strips: HTMLCanvasElement[] } {
  const W = data.w * TILE, H = data.h * TILE;

  // ---- ground：平地缓存 ----
  const [ground, gg] = makeCanvas(W, H);
  for (let ty = 0; ty < data.h; ty++) for (let tx = 0; tx < data.w; tx++) {
    const v = data.map[ty * data.w + tx];
    if (v === T.WATER) {
      const bank = ty > 0 && data.map[(ty - 1) * data.w + tx] !== T.WATER && data.map[(ty - 1) * data.w + tx] !== T.BRIDGE;
      gWater(gg, tx, ty, ty <= 2, bank);
    }
    else if (v === T.GRASS) gGrass(gg, tx, ty, false);
    else if (v === T.FLOWER) gGrass(gg, tx, ty, true);
    else if (v === T.PATH) gFloor(gg, tx, ty, 'path');
    else if (v === T.CORR || v === T.PAV) gFloor(gg, tx, ty, 'corr');
    else if (v === T.DIRT) gFloor(gg, tx, ty, 'dirt');
    else if (v === T.BRIDGE) gFloor(gg, tx, ty, 'bridge');
    else if (v === T.ROCK) gRockGround(gg, tx, ty);
    else if (v === T.RAIL) { R(gg, tx * TILE, ty * TILE, TILE, TILE, P.rockBase); R(gg, tx * TILE, ty * TILE, TILE, 2, P.rockTop); R(gg, tx * TILE, ty * TILE + TILE - 1, TILE, 1, P.rockDark); }
    else if (v === T.WALL || v === T.WIN) R(gg, tx * TILE, ty * TILE, TILE, TILE, P.path);
    else R(gg, tx * TILE, ty * TILE, TILE, TILE, P.grassAlt);
  }

  // ---- strips：逐行对象 ----
  const strips: HTMLCanvasElement[] = [];
  const winSet = new Set(data.winX);
  const buildings: Building[] = data.buildings ?? [];

  for (let ty = 0; ty < data.h; ty++) {
    const [sc, g] = makeCanvas(W, STRIP_H);

    // 1) 假山
    for (let tx = 0; tx < data.w; tx++) {
      if (data.map[ty * data.w + tx] !== T.ROCK) continue;
      const above = ty > 0 ? data.map[(ty - 1) * data.w + tx] : T.GRASS;
      rock25(g, tx, ty, above !== T.ROCK);
    }
    // 2) 竹林
    for (let tx = 0; tx < data.w; tx++) {
      if (data.map[ty * data.w + tx] === T.BAMBOO) bamboo25(g, tx, ty);
    }
    // 3) 粉墙/漏窗
    for (let tx = 0; tx < data.w; tx++) {
      const v = data.map[ty * data.w + tx];
      if (v === T.WALL) wall25(g, tx, ty);
      else if (v === T.WIN) {
        const special = winSet.has(tx) ? (['fan', 'leaf', 'peach'] as const)[data.winX.indexOf(tx)] : null;
        win25(g, tx, ty, WIN_PATS[((tx / 5) | 0) % 4], special);
      }
    }
    // 3.5) 朱红栏杆（复廊临水一侧）
    if (ty >= 6 && ty <= 8) {
      for (let tx = 0; tx < data.w; tx++) {
        const v7 = data.map[ty * data.w + tx];
        if (v7 === T.WATER || v7 === T.ROOF || v7 === T.BRIDGE || v7 === T.WALL || v7 === T.WIN) continue;
        if (ty + 1 < data.h && data.map[(ty + 1) * data.w + tx] === T.CORR) redRail25(g, tx);
      }
    }
    // 4) 廊柱（每 2 tile 一柱）
    for (let tx = 7; tx <= 88; tx += 2) {
      if ((ty === 8 || ty === 10) && data.map[ty * data.w + tx] === T.CORR) post25(g, tx, ty);
    }
    // 4.5) 复廊连排瓦顶
    if (ty === 8) {
      let x = 0;
      while (x < data.w) {
        if (data.map[8 * data.w + x] !== T.CORR) { x++; continue; }
        const x0 = x;
        while (x < data.w && data.map[8 * data.w + x] === T.CORR) x++;
        corrRoof25(g, x0, x - 1);
      }
    }
    // 5) 古树
    for (const [x, y] of data.trees) {
      if (y + 1 === ty) tree25(g, x, ty);
    }
    // 6) 建筑
    for (const b of buildings) {
      if (b.y1 === ty) building25(g, b);
    }

    strips.push(sc);
  }

  bakeReflection(ground, strips, data);

  return { ground, strips };
}

/* ================= 倒影烘焙 + 荷叶 ================= */

const hex2rgb = (h: string): [number, number, number] =>
  [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

function bakeReflection(ground: HTMLCanvasElement, strips: HTMLCanvasElement[], data: MapData): void {
  const W = ground.width, H = ground.height;
  const [comp, cg] = makeCanvas(W, H);
  cg.drawImage(ground, 0, 0);
  for (let ty = 0; ty < data.h; ty++) cg.drawImage(strips[ty], 0, ty * TILE - (STRIP_H - TILE));
  const img = cg.getImageData(0, 0, W, H).data;

  const [refl, rg] = makeCanvas(W, H);
  const rImg = rg.createImageData(W, H);
  const wd = hex2rgb(P.waterTealDeep);

  for (let tx = 0; tx < data.w; tx++) {
    let ty = 0;
    while (ty < data.h) {
      if (data.map[ty * data.w + tx] !== T.WATER) { ty++; continue; }
      const r0 = ty;
      while (ty < data.h && data.map[ty * data.w + tx] === T.WATER) ty++;
      const bot = ty * TILE;
      for (let y = r0 * TILE; y < bot; y++) {
        const k = bot - y;
        const sy = bot - 1 + k;
        if (sy >= H - 1) continue;
        const wob = Math.round(Math.sin(y * 0.6 + (tx % 5) * 0.8) * 2);
        const m = 0.58 - Math.min(0.15, k / bot * 0.3);      // 近岸浓、远岸淡
        for (let xx = 0; xx < TILE; xx++) {
          const px = tx * TILE + xx + wob;
          if (px < 0 || px >= W) continue;
          const d = (y * W + px) * 4;
          const stx = (px / TILE) | 0, sty = (sy / TILE) | 0;
          if (data.map[sty * data.w + stx] === T.WATER) {
            rImg.data[d] = wd[0]; rImg.data[d + 1] = wd[1]; rImg.data[d + 2] = wd[2]; rImg.data[d + 3] = 255;
            continue;
          }
          const s = (sy * W + px) * 4, s2 = ((sy + 1) * W + px) * 4;   // 双行均值=纵向模糊（去雨丝感）
          rImg.data[d]     = (((img[s]     + img[s2]) * 0.5) * (1 - m) + wd[0] * m) * 0.78;
          rImg.data[d + 1] = (((img[s + 1] + img[s2 + 1]) * 0.5) * (1 - m) + wd[1] * m) * 0.82;
          rImg.data[d + 2] = (((img[s + 2] + img[s2 + 2]) * 0.5) * (1 - m) + wd[2] * m) * 0.84;
          rImg.data[d + 3] = 255;
        }
      }
    }
  }
  rg.putImageData(rImg, 0, 0);
  const g2 = ground.getContext('2d')!;
  g2.drawImage(refl, 0, 0);

  // 波光横线（倒影之上）
  for (let ty2 = 0; ty2 < data.h; ty2++) for (let tx2 = 0; tx2 < data.w; tx2++) {
    if (data.map[ty2 * data.w + tx2] !== T.WATER || nz(tx2, ty2, 140) > 0.18) continue;
    const X = tx2 * TILE + ((nz(tx2, ty2, 141) * 6) | 0), Y = ty2 * TILE + 2 + ((nz(tx2, ty2, 142) * 12) | 0);
    R(g2, X, Y, 4 + ((nz(tx2, ty2, 143) * 9) | 0), 1, P.waterGlow);
  }

  // 荷叶 + 萍 + 荷花
  for (let ty2 = 0; ty2 < data.h; ty2++) for (let tx2 = 0; tx2 < data.w; tx2++) {
    if (data.map[ty2 * data.w + tx2] !== T.WATER || nz(tx2, ty2, 120) > 0.09) continue;
    const X = tx2 * TILE, Y = ty2 * TILE;
    for (let i = 0; i < 3; i++) {
      const lx = X + 2 + ((nz(tx2, ty2, 121 + i) * 11) | 0), ly = Y + 2 + ((nz(tx2, ty2, 125 + i) * 11) | 0);
      const r = 3 + ((nz(tx2, ty2, 129 + i) * 3) | 0);
      g2.beginPath(); g2.ellipse(lx, ly, r + 1, r, 0, 0, Math.PI * 2); g2.fillStyle = P.leafDeep; g2.fill();
      g2.beginPath(); g2.ellipse(lx, ly - 0.5, r, r - 0.8, 0, 0, Math.PI * 2); g2.fillStyle = P.leafSat; g2.fill();
      g2.beginPath(); g2.ellipse(lx, ly - 0.5, r * 0.45, r * 0.4, 0, 0, Math.PI * 2); g2.fillStyle = P.leafDeep; g2.fill();
      R(g2, lx - 1, ly - 2, 1, 1, P.willow);
    }
    if (nz(tx2, ty2, 133) < 0.35) { R(g2, X + 7, Y + 6, 2, 2, P.zhuBright); R(g2, X + 7, Y + 6, 1, 1, P.gold); }
  }
}
