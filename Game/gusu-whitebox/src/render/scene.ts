import { TILE, MAP_W, MAP_H, PALETTE as P, TUNING } from '../config.js';
import { T } from '../data/tiles.js';
import type { MapData } from '../data/mapgen.js';
import { px, type Ctx } from './pixel.js';

const playerSprite = new Image();
playerSprite.src = '../assets/characters/scholar-player-sprites-v1.png';
const SPRITE_CELL = 362;

/** 三层离屏渲染：base（地形）/ detail（山石树岸）/ roof（屋顶遮挡）。换真像素资产只换本文件。 */

function makeLayer(w: number, h: number, draw: (g: Ctx) => void): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  draw(g);
  return c;
}

export interface Layers { base: HTMLCanvasElement; detail: HTMLCanvasElement; roof: HTMLCanvasElement }

export function buildLayers(data: MapData): Layers {
  const W = MAP_W * TILE, H = MAP_H * TILE;
  const { map, trees } = data;
  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? T.WALL : map[y * MAP_W + x];

  const base = makeLayer(W, H, (g) => {
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
      const v = at(x, y), X = x * TILE, Y = y * TILE;
      switch (v) {
        case T.GRASS:
          px(g, X, Y, TILE, TILE, (x * 7 + y * 13) % 5 < 2 ? P.grass : P.grassAlt);
          break;
        case T.PATH:
          px(g, X, Y, TILE, TILE, (x + y) % 3 === 0 ? P.pathAlt : P.path);
          if ((x + y) % 4 === 0) px(g, X + 5, Y + 7, 2, 2, P.wallShade);
          break;
        case T.WATER: {
          px(g, X, Y, TILE, TILE, P.water);
          if ((x * 3 + y * 5) % 6 === 0) px(g, X + 3, Y + 6, 8, 1, P.waterHi);
          break;
        }
        case T.WALL:
          px(g, X, Y, TILE, TILE, P.wall);
          if (at(x, y + 1) !== T.WALL && at(x, y + 1) !== T.WIN) px(g, X, Y + TILE - 3, TILE, 3, P.wallShade);
          break;
        case T.WIN: {
          // 漏窗：暗框 + 金棕窗格，与粉墙拉开对比
          px(g, X, Y, TILE, TILE, P.wall);
          px(g, X, Y, TILE, 2, P.wood); px(g, X, Y + TILE - 2, TILE, 2, P.wood);
          px(g, X, Y, 2, TILE, P.wood); px(g, X + TILE - 2, Y, 2, TILE, P.wood);
          g.fillStyle = P.gold;
          for (let i = 0; i < 3; i++) g.fillRect(X + 3 + i * 4, Y + 3, 2, TILE - 6);
          g.fillRect(X + 3, Y + 7, TILE - 6, 2);
          break;
        }
        case T.CORR:
          px(g, X, Y, TILE, TILE, P.path);
          break;
        case T.PLAT:
          px(g, X, Y, TILE, TILE, P.pathAlt);
          px(g, X, Y, TILE, 1, P.wallShade);
          break;
        case T.BRIDGE:
          px(g, X, Y, TILE, TILE, P.pathAlt);
          px(g, X, Y, 1, TILE, P.wood); px(g, X + TILE - 1, Y, 1, TILE, P.wood);
          break;
        case T.FLOWER:
          px(g, X, Y, TILE, TILE, P.grass);
          px(g, X + 4, Y + 5, 3, 3, '#d88a8a');
          px(g, X + 9, Y + 9, 2, 2, '#e6b45c');
          break;
      }
    }
    // 树干（画进 base，树冠画 detail 压在人物之上由 roof 层之后处理）
  });

  const detail = makeLayer(W, H, (g) => {
    // 石岸描边
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
      if (at(x, y) === T.PATH && at(x, y + 1) === T.WATER) px(g, x * TILE, y * TILE + TILE - 2, TILE, 2, '#b0a890');
    }
    // 假山：整块填充 + 顶受光 + 底压深 + 苔点
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
      if (at(x, y) !== T.ROCK) continue;
      const X = x * TILE, Y = y * TILE;
      px(g, X, Y, TILE, TILE, P.rockBase);
      if (at(x, y - 1) !== T.ROCK) px(g, X, Y, TILE, 3, P.rockTop);
      if (at(x, y + 1) !== T.ROCK) px(g, X, Y + TILE - 3, TILE, 3, P.rockDark);
      if (at(x - 1, y) !== T.ROCK) px(g, X, Y, 2, TILE, P.rockDark);
      if (at(x + 1, y) !== T.ROCK) px(g, X + TILE - 2, Y, 2, TILE, P.rockDark);
      if ((x * 3 + y * 5) % 7 === 0) px(g, X + 5, Y + 6, 3, 2, '#6f8a63');
    }
    // 树冠
    for (const [tx, ty] of trees) {
      const X = tx * TILE, Y = ty * TILE;
      px(g, X - 4, Y - 13, TILE + 8, 4, P.leafHi);
      px(g, X - 7, Y - 9, TILE + 14, 5, P.leafMid);
      px(g, X - 5, Y - 4, TILE + 10, 4, P.leafDark);
    }
  });

  const roof = makeLayer(W, H, (g) => {
    // 复廊屋顶
    px(g, 6 * TILE - 6, 6 * TILE - 8, (68) * TILE + 12, 10, P.roof);
    for (let x = 6 * TILE - 6; x < 74 * TILE + 6; x += 8) px(g, x, 6 * TILE - 8, 4, 4, P.roofDark);
    // 水榭与亭屋顶
    px(g, 49 * TILE, 25 * TILE, 12 * TILE, 8, P.roof);
    px(g, 29 * TILE, 31 * TILE, 7 * TILE, 8, P.roof);
  });

  return { base, detail, roof };
}

export function drawLayers(ctx: Ctx, layers: Layers, cam: { x: number; y: number }): void {
  for (const l of [layers.base, layers.detail, layers.roof]) {
    ctx.drawImage(l, -cam.x | 0, -cam.y | 0);
  }
}

/** 玩家：由角色原画母版派生的四向三帧精灵；未加载时保留程序化后备。 */
export function drawPlayer(ctx: Ctx, p: { x: number; y: number; dir: number; moving: boolean; wt: number }, cam: { x: number; y: number }): void {
  const X = (p.x - cam.x) | 0, Y = (p.y - cam.y) | 0;
  const frame = p.moving ? 1 + ((p.wt * TUNING.walkAnimFps | 0) % 2) : 0;
  // 影
  ctx.fillStyle = 'rgba(43,40,36,.18)';
  ctx.fillRect(X - 5, Y - 1, 10, 2);
  if (playerSprite.complete && playerSprite.naturalWidth > 0) {
    ctx.drawImage(
      playerSprite,
      frame * SPRITE_CELL, p.dir * SPRITE_CELL, SPRITE_CELL, SPRITE_CELL,
      X - 9, Y - 23, 18, 24,
    );
    return;
  }
  // 腿
  px(ctx, X - 3, Y - 4, 2, 4, P.ink);
  px(ctx, X + 1, Y - 4, 2, 4, P.ink);
  if (frame === 1) px(ctx, X - 3, Y - 2, 2, 2, P.ink);
  if (frame === 2) px(ctx, X + 1, Y - 2, 2, 2, P.ink);
  // 身（青袍）
  px(ctx, X - 4, Y - 11, 8, 8, P.qing);
  px(ctx, X - 4, Y - 6, 8, 1, '#2f5a52');
  // 头
  px(ctx, X - 3, Y - 16, 6, 5, '#e8d5b5');
  px(ctx, X - 3, Y - 17, 6, 2, P.ink); // 发
  // 朱色腰带点睛
  px(ctx, X - 4, Y - 7, 8, 1, P.zhu);
}

/** 取景点脉动光圈（未取完时显示）。 */
export function drawMarkers(ctx: Ctx, spots: Array<{ x: number; y: number; id: number }>, cam: { x: number; y: number }, captured: Set<number>, now: number): void {
  for (const s of spots) {
    if (captured.has(s.id)) continue;
    const X = s.x - cam.x, Y = s.y - cam.y;
    const pulse = 4 + Math.sin(now / 220 + s.id) * 1.5;
    ctx.strokeStyle = P.zhu;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(X, Y - 6, pulse + 3, 0, Math.PI * 2); ctx.stroke();
    px(ctx, X - 1, Y - 7, 2, 2, P.zhu);
  }
}
