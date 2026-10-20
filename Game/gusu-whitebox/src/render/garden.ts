import { TILE, PALETTE as P } from '../config.js';
import { T } from '../data/tiles.js';
import type { MapData, Building } from '../data/mapgen.js';
import {
  nz, water, corr, rail, wall, win, winSpecial, rock, dirt, grassEdge,
  treeCanopy, bamboo, roofHip, roofTing, roofPeak, post, line, makeLayer,
} from './slice.js';
import type { Ctx } from './pixel.js';

/**
 * 沧浪亭整园渲染（#garden）——「图纸→像素→艺术化→底图」第 3-4 步。
 * tile 语义画法与试铺段一致（同一套 painter），新增：石板径、石桥、竹林、屋顶建筑群。
 * 漏窗按 map 中 WIN 位渲染，winX 三窗用朱框特殊形（方案 2）。
 */

type G = Ctx;
const R = (g: G, x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

/** 石板径（园路，比廊道略淡）。 */
function pathStone(g: G, tx: number, ty: number): void {
  const X = tx * TILE, Y = ty * TILE;
  R(g, X, Y, TILE, TILE, P.path);
  R(g, X, Y + 5, TILE, 1, P.pathAlt);
  R(g, X + ((nz(tx, ty, 3) * 8) | 0) + 4, Y, 1, TILE, P.pathAlt);
  if (nz(tx, ty, 8) < 0.25) R(g, X + 2 + ((nz(tx, ty, 9) * 11) | 0), Y + 2 + ((nz(tx, ty, 10) * 11) | 0), 1, 1, P.wallShade);
}

/** 石桥面（渡桥，纵向石板）。 */
function bridge(g: G, tx: number, ty: number): void {
  const X = tx * TILE, Y = ty * TILE;
  R(g, X, Y, TILE, TILE, P.rockBase);
  R(g, X, Y, 2, TILE, P.rockDark);
  R(g, X + TILE - 2, Y, 2, TILE, P.rockDark);
  R(g, X, Y, TILE, 1, P.rockTop);
  if (ty % 2 === 0) R(g, X + 2, Y + 7, TILE - 4, 1, P.rockDark);
}

const WIN_PATS = ['bing', 'haitang', 'wan', 'meihua'] as const;

export function buildGardenLayers(data: MapData): { base: HTMLCanvasElement; detail: HTMLCanvasElement; roof: HTMLCanvasElement } {
  const W = data.w * TILE, H = data.h * TILE;
  const winSet = new Set(data.winX);

  const base = makeLayer(W, H, (g) => {
    // 1) 地形基底层
    for (let ty = 0; ty < data.h; ty++) for (let tx = 0; tx < data.w; tx++) {
      const v = data.map[ty * data.w + tx];
      if (v === T.WATER) water(g, tx, ty, ty === 0);
      else if (v === T.RAIL) rail(g, tx, ty);
      else if (v === T.CORR || v === T.PAV) corr(g, tx, ty);
      else if (v === T.BRIDGE) bridge(g, tx, ty);
      else if (v === T.WALL) wall(g, tx, ty);
      else if (v === T.WIN) { /* 第二遍画窗 */ }
      else if (v === T.PATH) pathStone(g, tx, ty);
      else if (v === T.DIRT) dirt(g, tx, ty);
      else if (v === T.ROCK) rock(g, tx, ty, ty === 14);
      else if (v === T.BAMBOO) bamboo(g, tx, ty);
      else if (v === T.GRASS || v === T.FLOWER) grassEdge(g, tx, ty);
    }
    // 2) 漏窗（4 纹样轮换）+ 三窗朱框（方案 2）
    for (let ty = 0; ty < data.h; ty++) for (let tx = 0; tx < data.w; tx++) {
      if (data.map[ty * data.w + tx] !== T.WIN) continue;
      if (winSet.has(tx)) winSpecial(g, tx, ty, ['fan', 'leaf', 'peach'][data.winX.indexOf(tx)] as 'fan' | 'leaf' | 'peach');
      else win(g, tx, ty, WIN_PATS[((tx / 5) | 0) % 4]);
    }
    // 3) 廊柱：复廊两沿（装饰不挡碰撞）
    for (let tx = 7; tx <= 88; tx += 3) { post(g, tx, 8); post(g, tx, 10); }
    // 4) 假山体积：斑驳 + 裂缝（只作用于 ROCK 区域）
    for (let i = 0; i < 220; i++) {
      const tx = 12 + ((nz(i, 1, 200) * 39) | 0), ty = 14 + ((nz(i, 2, 200) * 19) | 0);
      if (data.map[ty * data.w + tx] !== T.ROCK) continue;
      R(g, tx * TILE + ((nz(i, 3, 200) * 6) | 0), ty * TILE + ((nz(i, 4, 200) * 9) | 0),
        5 + ((nz(i, 5, 200) * 8) | 0), 2 + ((nz(i, 6, 200) * 4) | 0), P.rockDark);
    }
    for (let i = 0; i < 90; i++) {
      const tx = 12 + ((nz(i, 7, 210) * 39) | 0), ty = 14 + ((nz(i, 8, 210) * 19) | 0);
      if (data.map[ty * data.w + tx] !== T.ROCK) continue;
      const xx = tx * TILE + 2 + ((nz(i, 9, 210) * 12) | 0), yy = ty * TILE;
      line(g, xx, yy, xx, yy + 6 + ((nz(i, 10, 210) * 9) | 0), P.inkPale);
    }
    // 5) 界墙顶灰线（南/西/东界墙加顶厚感）
    for (let tx = 0; tx < data.w; tx++) R(g, tx * TILE, 55 * TILE, TILE, 2, P.inkPale);
  });

  // 6) 屋顶建筑群（实心，画在 base 上层）
  const buildings: Building[] = data.buildings ?? [];
  const roof = makeLayer(W, H, (g) => {
    for (const b of buildings) {
      if (b.kind === 'ting') roofTing(g, b.x0, b.x1, b.y0, b.y1);
      else if (b.kind === 'peak') roofPeak(g, b.x0, b.x1, b.y0, b.y1);
      else roofHip(g, b.x0, b.x1, b.y0, b.y1);
    }
  });

  // 7) 古树冠
  const detail = makeLayer(W, H, (g) => {
    for (const [tx, ty] of data.trees) treeCanopy(g, tx, ty);
  });

  return { base, detail, roof };
}
