import { TILE, PALETTE as P } from '../config.js';
import { T } from '../data/tiles.js';
import type { MapData } from '../data/mapgen.js';
import { px, type Ctx } from './pixel.js';

/**
 * 复廊试铺段渲染（#slice）——assets/canglang/slice_corridor_v03.png 的引擎内移植。
 * 全部颜色取自定稿色板，零超板；噪声用确定性哈希（同帧稳定，重进不变图）。
 * 对应词表 tile：WATER/WALL/WIN(4纹样+3朱框特殊)/CORR/RAIL/DIRT/ROCK/TREE/BAMBOO/ROOF-XIE/ROOF-TING。
 */

// 确定性噪声 [0,1)
export function nz(x: number, y: number, s = 0): number {
  let h = (x * 374761393 + y * 668265263 + s * 974711) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = (h ^ (h >>> 16)) >>> 0;
  return (h % 10000) / 10000;
}

type G = Ctx;
const R = (g: G, x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

export function water(g: G, tx: number, ty: number, deep = false): void {
  const X = tx * TILE, Y = ty * TILE;
  R(g, X, Y, TILE, TILE, deep ? P.waterDeep : P.water);
  if (nz(tx, ty, 1) < 0.4) {
    const yy = Y + [3, 5, 9, 11][(nz(tx, ty, 2) * 4) | 0];
    const xx = X + ((nz(tx, ty, 3) * 5) | 0);
    R(g, xx, yy, 5 + ((nz(tx, ty, 4) * 6) | 0), 1, P.waterHi);
  }
  if (!deep && nz(tx, ty, 5) < 0.2) {
    g.fillStyle = P.waterDeep;
    g.fillRect(X + 2 + ((nz(tx, ty, 6) * 11) | 0), Y + 2 + ((nz(tx, ty, 7) * 11) | 0), 1, 1);
  }
}

export function corr(g: G, tx: number, ty: number): void {
  const X = tx * TILE, Y = ty * TILE;
  R(g, X, Y, TILE, TILE, P.path);
  R(g, X, Y, 1, TILE, P.pathAlt);
  R(g, X, Y + 8, TILE, 1, P.pathAlt);
  if (nz(tx, ty, 8) < 0.3) R(g, X + 2 + ((nz(tx, ty, 9) * 11) | 0), Y + 2 + ((nz(tx, ty, 10) * 11) | 0), 1, 1, P.wallShade);
}

export function post(g: G, tx: number, ty: number): void {
  const X = tx * TILE, Y = ty * TILE;
  R(g, X, Y, 2, TILE, P.wood);
  R(g, X + 2, Y, 1, TILE, P.woodDark);
}

export function rail(g: G, tx: number, ty: number): void {
  const X = tx * TILE, Y = ty * TILE;
  R(g, X, Y, TILE, TILE, P.rockBase);
  R(g, X, Y + 4, TILE, 1, P.rockTop);
  R(g, X, Y + 5, TILE, 1, P.inkPale);
  R(g, X, Y + 13, TILE, 1, P.rockDark);
  if (tx % 4 === 2) R(g, X + 7, Y, 2, TILE, P.wood);
}

export function wall(g: G, tx: number, ty: number): void {
  const X = tx * TILE, Y = ty * TILE;
  R(g, X, Y, TILE, TILE, P.wall);
  R(g, X, Y, TILE, 1, P.inkPale);
  R(g, X, Y + 14, TILE, 1, P.wallShade);
  R(g, X, Y + 15, TILE, 1, P.inkPale);
  if (tx % 4 === 0) R(g, X + 7, Y + 2, 1, 12, P.inkPale);
}

const WIN_PATS = ['bing', 'haitang', 'wan', 'meihua'] as const;
export function win(g: G, tx: number, ty: number, pat: typeof WIN_PATS[number]): void {
  wall(g, tx, ty);
  const X = tx * TILE, Y = ty * TILE;
  g.strokeStyle = P.wood; g.lineWidth = 1;
  g.strokeRect(X + 2.5, Y + 2.5, 11, 11);
  g.strokeStyle = P.gold;
  g.strokeRect(X + 3.5, Y + 3.5, 9, 9);
  const m = P.inkMid;
  g.fillStyle = m; g.strokeStyle = m;
  if (pat === 'bing') {
    g.fillRect(X + 4, Y + 4, 1, 1); line(g, X + 4, Y + 4, X + 12, Y + 12, m);
    line(g, X + 12, Y + 4, X + 4, Y + 12, m);
    line(g, X + 8, Y + 4, X + 8, Y + 12, m);
  } else if (pat === 'haitang') {
    for (const [ox, oy] of [[8, 5], [8, 11], [5, 8], [11, 8]]) g.strokeRect(X + ox - 2 + 0.5, Y + oy - 2 + 0.5, 3, 3);
    g.fillRect(X + 8, Y + 8, 1, 1);
  } else if (pat === 'wan') {
    line(g, X + 4, Y + 8, X + 12, Y + 8, m); line(g, X + 8, Y + 4, X + 8, Y + 12, m);
    line(g, X + 8, Y + 4, X + 11, Y + 4, m); line(g, X + 11, Y + 4, X + 11, Y + 7, m);
    line(g, X + 8, Y + 12, X + 5, Y + 12, m); line(g, X + 5, Y + 12, X + 5, Y + 9, m);
  } else {
    const pts: Array<[number, number]> = [[8, 4], [12, 6], [12, 10], [8, 12], [4, 10], [4, 6]];
    for (let i = 0; i < 6; i++) line(g, X + pts[i][0], Y + pts[i][1], X + pts[(i + 1) % 6][0], Y + pts[(i + 1) % 6][1], m);
    g.fillRect(X + 8, Y + 8, 1, 1);
  }
}

/** M2 特殊窗（方案 2 艺术加工）：朱框 + 朱亮点。 */
export function winSpecial(g: G, tx: number, ty: number, shape: 'fan' | 'leaf' | 'peach'): void {
  wall(g, tx, ty);
  const X = tx * TILE, Y = ty * TILE;
  g.strokeStyle = P.zhu; g.lineWidth = 1;
  g.strokeRect(X + 2.5, Y + 2.5, 11, 11);
  g.strokeRect(X + 4.5, Y + 4.5, 7, 7);
  const m = P.inkMid;
  if (shape === 'fan') {
    g.beginPath(); g.arc(X + 8, Y + 8, 4.5, Math.PI * 1.11, Math.PI * 1.89); g.stroke();
    for (const [ax, ay] of [[8, 4], [5, 5], [11, 5]]) line(g, X + 8, Y + 11, X + ax, Y + ay, m);
    g.fillStyle = P.zhuBright; g.fillRect(X + 8, Y + 11, 1, 1);
  } else if (shape === 'leaf') {
    line(g, X + 4, Y + 11, X + 11, Y + 4, m);
    g.beginPath(); g.ellipse(X + 7.5, Y + 7.5, 5, 2.4, -Math.PI / 4, 0, Math.PI * 2); g.stroke();
    g.fillStyle = P.zhuBright; g.fillRect(X + 11, Y + 4, 1, 1);
  } else {
    g.beginPath(); g.arc(X + 8, Y + 9.5, 4, 0, Math.PI * 2); g.stroke();
    line(g, X + 8, Y + 4, X + 6, Y + 7, m); line(g, X + 8, Y + 4, X + 10, Y + 7, m);
    g.fillStyle = P.zhuBright; g.fillRect(X + 8, Y + 4, 1, 1);
  }
}

export function line(g: G, x0: number, y0: number, x1: number, y1: number, c: string): void {
  g.strokeStyle = c; g.beginPath(); g.moveTo(x0 + 0.5, y0 + 0.5); g.lineTo(x1 + 0.5, y1 + 0.5); g.stroke();
}

export function rock(g: G, tx: number, ty: number, top: boolean): void {
  const X = tx * TILE, Y = ty * TILE;
  R(g, X, Y, TILE, TILE, P.rockBase);
  for (let i = 0; i < 4; i++) {
    const w = 2 + ((nz(tx, ty, 20 + i) * 4) | 0);
    R(g, X + ((nz(tx, ty, 30 + i) * 10) | 0), Y + ((nz(tx, ty, 40 + i) * 11) | 0), w, 2, P.rockDark);
  }
  if (top) for (let i = 0; i < 4; i++)
    g.fillStyle = P.rockTop, g.fillRect(X + 1 + ((nz(tx, ty, 50 + i) * 14) | 0), Y + 1 + ((nz(tx, ty, 60 + i) * 14) | 0), 1, 1);
}

export function dirt(g: G, tx: number, ty: number): void {
  const X = tx * TILE, Y = ty * TILE;
  R(g, X, Y, TILE, TILE, P.pathAlt);
  for (let i = 0; i < 4; i++) { g.fillStyle = P.grassAlt; g.fillRect(X + 1 + ((nz(tx, ty, 70 + i) * 14) | 0), Y + 1 + ((nz(tx, ty, 80 + i) * 14) | 0), 1, 1); }
  for (let i = 0; i < 2; i++) { g.fillStyle = P.rockDark; g.fillRect(X + 1 + ((nz(tx, ty, 90 + i) * 14) | 0), Y + 1 + ((nz(tx, ty, 95 + i) * 14) | 0), 1, 1); }
}

export function grassEdge(g: G, tx: number, ty: number): void {
  const X = tx * TILE, Y = ty * TILE;
  R(g, X, Y, TILE, TILE, P.grassAlt);
  for (let i = 0; i < 6; i++) { g.fillStyle = P.grass; g.fillRect(X + 1 + ((nz(tx, ty, 100 + i) * 14) | 0), Y + 1 + ((nz(tx, ty, 110 + i) * 14) | 0), 1, 1); }
}

/** 古树冠 32×32（深色，压在假山上）。 */
export function treeCanopy(g: G, tx: number, ty: number): void {
  const X = tx * TILE, Y = ty * TILE;
  R(g, X, Y, 32, 32, P.leafDark);
  for (let i = 0; i < 40; i++) { g.fillStyle = P.leafMid; g.fillRect(X + ((nz(tx, ty, 120 + i) * 32) | 0), Y + ((nz(tx, ty, 130 + i) * 32) | 0), 1, 1); }
  for (let i = 0; i < 14; i++) { g.fillStyle = P.leafHi; g.fillRect(X + 2 + ((nz(tx, ty, 140 + i) * 27) | 0), Y + 2 + ((nz(tx, ty, 150 + i) * 27) | 0), 1, 1); }
  g.fillStyle = P.pine; g.fillRect(X + 16, Y + 16, 1, 1);
}

export function bamboo(g: G, tx: number, ty: number): void {
  const X = tx * TILE, Y = ty * TILE;
  for (let i = 0, xx = X + 1; xx < X + 16; xx += 3, i++) {
    R(g, xx, Y + 1, 1, 14, P.pine);
    R(g, xx - 1, Y + 3 + (i % 3), 1, 4, P.leafMid);
  }
}

/** 面水轩硬山顶（top-down，中脊横贯）。 */
export function roofHip(g: G, x0: number, x1: number, r0: number, r1: number): void {
  const X = x0 * TILE, Y = r0 * TILE, W = (x1 - x0 + 1) * TILE, H = (r1 - r0 + 1) * TILE;
  R(g, X, Y, W, H, P.roof);
  const ridge = Y + (H >> 1);
  for (let i = X; i < X + W; i += 4) {
    line(g, i, Y + 2, Math.min(i + (ridge - Y - 2), X + W - 1), ridge - 1, P.roofDark);
    line(g, i, ridge + 1, Math.min(i + (Y + H - 2 - (ridge + 1)), X + W - 1), Y + H - 2, P.roofDark);
  }
  R(g, X, ridge, W, 1, P.ink);
  g.strokeStyle = P.ink; g.strokeRect(X + 0.5, Y + 0.5, W - 1, H - 1);
  R(g, X, Y + 1, W, 1, P.wall);
  R(g, X, Y + H - 2, W, 1, P.wallShade);
}

/** 观鱼处攒尖方亭。 */
export function roofTing(g: G, x0: number, x1: number, r0: number, r1: number): void {
  const X = x0 * TILE, Y = r0 * TILE, W = (x1 - x0 + 1) * TILE, H = (r1 - r0 + 1) * TILE;
  R(g, X, Y, W, H, P.roof);
  const cx = X + W / 2, cy = Y + H / 2;
  for (const [ox, oy] of [[X + 2, Y + 2], [X + W - 3, Y + 2], [X + 2, Y + H - 3], [X + W - 3, Y + H - 3]])
    line(g, ox, oy, cx, cy, P.roofDark);
  g.fillStyle = P.ink; g.fillRect(cx, cy, 1, 1);
  g.strokeStyle = P.ink; g.strokeRect(X + 0.5, Y + 0.5, W - 1, H - 1);
}

/** 山巅石亭（词表 #12 ROOF-TING，小攒尖）。 */
export function roofPeak(g: G, x0: number, x1: number, r0: number, r1: number): void {
  const X = x0 * TILE, Y = r0 * TILE, W = (x1 - x0 + 1) * TILE, H = (r1 - r0 + 1) * TILE;
  R(g, X, Y, W, H, P.roof);
  const cx = X + W / 2, cy = Y + H / 2;
  for (const [ox, oy] of [[X + 1, Y + 1], [X + W - 2, Y + 1], [X + 1, Y + H - 2], [X + W - 2, Y + H - 2]])
    line(g, ox, oy, cx, cy, P.roofDark);
  g.strokeStyle = P.ink; g.strokeRect(X + 0.5, Y + 0.5, W - 1, H - 1);
}

const CORR_X0 = 6, CORR_X1 = 115;
const SPECIAL: Record<number, 'fan' | 'leaf' | 'peach'> = { 35: 'fan', 60: 'leaf', 88: 'peach' };

export function makeLayer(w: number, h: number, draw: (g: G) => void): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  draw(g);
  return c;
}

export function buildSliceLayers(data: MapData): { base: HTMLCanvasElement; detail: HTMLCanvasElement; roof: HTMLCanvasElement } {
  const W = data.w * TILE, H = data.h * TILE;
  const base = makeLayer(W, H, (g) => {
    // 1) 地形基底层
    for (let ty = 0; ty < data.h; ty++) for (let tx = 0; tx < data.w; tx++) {
      const v = data.map[ty * data.w + tx];
      if (v === T.WATER) water(g, tx, ty, ty === 0);
      else if (v === T.RAIL) rail(g, tx, ty);
      else if (v === T.CORR || v === T.PAV) corr(g, tx, ty);
      else if (v === T.WALL) wall(g, tx, ty);
      else if (v === T.DIRT) dirt(g, tx, ty);
      else if (v === T.ROCK) rock(g, tx, ty, ty === 10);
      else if (v === T.GRASS) grassEdge(g, tx, ty);
    }
    // 2) 漏窗（4 纹样轮换）+ M2 三窗朱框
    for (let tx = CORR_X0 + 2; tx < CORR_X1; tx += 6)
      if (!SPECIAL[tx]) win(g, tx, 6, WIN_PATS[((tx / 6) | 0) % 4]);
    for (const [tx, shape] of Object.entries(SPECIAL)) winSpecial(g, +tx, 6, shape);
    // 3) 廊柱（装饰，不挡碰撞）：外廊北沿 + 内廊南沿
    for (let tx = CORR_X0; tx <= CORR_X1; tx += 3) { post(g, tx, 4); post(g, tx, 8); }
    // 4) 山体斑驳 + 裂缝 + 隆起石丘（不侵入内廊）
    for (let i = 0; i < 140; i++) {
      const tx = 6 + ((nz(i, 1, 200) * 108) | 0), ty = 10 + ((nz(i, 2, 200) * 3) | 0);
      R(g, tx * TILE + ((nz(i, 3, 200) * 6) | 0), ty * TILE + ((nz(i, 4, 200) * 9) | 0),
        5 + ((nz(i, 5, 200) * 8) | 0), 2 + ((nz(i, 6, 200) * 4) | 0), P.rockDark);
    }
    for (let i = 0; i < 60; i++) {
      const tx = 6 + ((nz(i, 7, 210) * 108) | 0), ty = 10 + ((nz(i, 8, 210) * 3) | 0);
      line(g, tx * TILE + 2 + ((nz(i, 9, 210) * 12) | 0), ty * TILE,
        tx * TILE + 2 + ((nz(i, 9, 210) * 12) | 0), ty * TILE + 6 + ((nz(i, 10, 210) * 9) | 0), P.inkPale);
    }
    for (const cx of [12, 26, 40, 52, 66, 80, 94, 108]) {
      const w = 2 + (cx % 2), x0 = cx * TILE, topR = 9;
      for (let rr = topR; rr < 10; rr++) {
        const inset = (rr - topR) * 3;
        R(g, x0 + inset, rr * TILE, w * TILE - inset * 2, TILE, P.rockBase);
      }
      R(g, x0 + 2, topR * TILE, w * TILE - 5, 1, P.rockTop);
      g.strokeStyle = P.rockDark;
      g.strokeRect(x0 + 0.5, topR * TILE + 0.5, w * TILE - 1, 10 * TILE - topR * TILE - 1);
    }
    // 5) 山巅石亭
    roofPeak(g, 56, 59, 11, 12);
    // 6) 西端面水轩 / 东端观鱼处
    roofHip(g, 0, 5, 4, 9);
    roofTing(g, 116, 118, 3, 6);
    // 7) 竹丛
    for (const bx of [18, 22, 100, 104]) { bamboo(g, bx, 10); bamboo(g, bx, 11); }
  });

  const detail = makeLayer(W, H, (g) => {
    for (const [tx, ty] of data.trees) treeCanopy(g, tx, ty);
  });

  const roof = makeLayer(W, H, () => { /* 屋顶已并入 base（建筑实心，玩家不入） */ });
  return { base, detail, roof };
}
