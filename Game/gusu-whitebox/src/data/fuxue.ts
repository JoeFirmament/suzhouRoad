import { TILE } from '../config.js';
import type { CollisionShape } from '../core/geometry.js';
import { FUXUE_OBSTACLES } from './fuxue-geometry.js';
import { T } from './tiles.js';

export const FUXUE_W = 46;
export const FUXUE_H = 26;

export type HomeInteractionId =
  | 'shen' | 'desk' | 'bed' | 'chest' | 'rubbings' | 'bookcase' | 'corner'
  | 'courtyard' | 'minglun' | 'gate';

export interface HomeInteraction {
  id: HomeInteractionId;
  x: number;
  y: number;
  label: string;
}

export interface FuxueTileRegion {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tile: number;
}

/** 按顺序覆盖；后面的区域可以在前面的大片区域中开门、铺桥或恢复墙体。 */
export const FUXUE_TILE_REGIONS: readonly FuxueTileRegion[] = [
  { id: 'west-courtyard', x: 1, y: 1, w: 37, h: 20, tile: T.PATH },
  { id: 'south-street', x: 1, y: 21, w: 44, h: 5, tile: T.PATH },
  { id: 'south-wall', x: 1, y: 15, w: 37, h: 6, tile: T.WALL },
  { id: 'west-gate-opening', x: 21, y: 15, w: 4, h: 8, tile: T.PATH },
  { id: 'minglun-hall', x: 14, y: 0, w: 17, h: 5, tile: T.WALL },
  { id: 'minglun-platform', x: 15, y: 5, w: 15, h: 2, tile: T.PLAT },
  { id: 'quarters-interior', x: 1, y: 2, w: 12, h: 9, tile: T.CORR },
  { id: 'quarters-back-wall', x: 1, y: 1, w: 13, h: 6, tile: T.WALL },
  { id: 'quarters-left-wall', x: 1, y: 1, w: 1, h: 10, tile: T.WALL },
  { id: 'quarters-right-wall', x: 13, y: 1, w: 1, h: 10, tile: T.WALL },
  { id: 'quarters-south-wall', x: 1, y: 10, w: 13, h: 1, tile: T.WALL },
  { id: 'quarters-stairs', x: 7, y: 10, w: 3, h: 4, tile: T.CORR },
  { id: 'courtyard-pond', x: 27, y: 6, w: 11, h: 11, tile: T.WATER },
  { id: 'pond-bridge', x: 27, y: 11, w: 4, h: 3, tile: T.BRIDGE },
  { id: 'east-temple', x: 38, y: 0, w: 8, h: 21, tile: T.WALL },
];

function fillRect(map: Uint8Array, x: number, y: number, w: number, h: number, tile: number): void {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    if (xx >= 0 && yy >= 0 && xx < FUXUE_W && yy < FUXUE_H) map[yy * FUXUE_W + xx] = tile;
  }
}

export function buildFuxueMap(regions: readonly FuxueTileRegion[] = FUXUE_TILE_REGIONS): {
  map: Uint8Array;
  w: number;
  h: number;
  spawn: { x: number; y: number };
  obstacles: readonly CollisionShape[];
} {
  const map = new Uint8Array(FUXUE_W * FUXUE_H);
  map.fill(T.WALL);
  for (const region of regions) fillRect(map, region.x, region.y, region.w, region.h, region.tile);

  return {
    map,
    w: FUXUE_W,
    h: FUXUE_H,
    spawn: { x: 22 * TILE, y: 24 * TILE },
    obstacles: FUXUE_OBSTACLES,
  };
}

export const HOME_INTERACTIONS: HomeInteraction[] = [
  // 沈砚秋站在门洞偏右、门扇之后；原 x=24 格会被右门扇整个人盖住。
  { id: 'shen', x: 23.25 * TILE, y: 19.5 * TILE, label: '沈砚秋' },
  // 交互锚点放在家具可接近的前缘，不放在碰撞体中心。
  { id: 'desk', x: 10.25 * TILE, y: 10.75 * TILE, label: '窗下书案' },
  { id: 'bed', x: 6 * TILE, y: 9.5 * TILE, label: '床铺' },
  { id: 'chest', x: 8 * TILE, y: 8.8 * TILE, label: '箱笼' },
  { id: 'rubbings', x: 9.5 * TILE, y: 8.75 * TILE, label: '书架与拓片' },
  // 书架本体不可穿入；锚点放到柜前走道，确保脚底盒可达。
  { id: 'bookcase', x: 11.7 * TILE, y: 11.5 * TILE, label: '书架下层' },
  { id: 'corner', x: 33 * TILE, y: 3.5 * TILE, label: '堂后檐角' },
  { id: 'courtyard', x: 17.5 * TILE, y: 13.5 * TILE, label: '老树下' },
  { id: 'minglun', x: 22 * TILE, y: 7.1 * TILE, label: '明伦堂前' },
  { id: 'gate', x: 22 * TILE, y: 20.5 * TILE, label: '西学门' },
];
