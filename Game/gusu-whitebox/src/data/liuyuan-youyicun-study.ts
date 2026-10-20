import type { SceneGeometryObject } from '../core/geometry.js';
import type { FuxueTileRegion } from './fuxue.js';
import { T } from './tiles.js';

/** 又一村圆门研究图：仅供编辑器和独立试走，不是清末门位测绘。 */
export const LIUYUAN_YOUYICUN_ID = 'liuyuan-youyicun-transition-study-v1';
export const LIUYUAN_YOUYICUN_W = 96;
export const LIUYUAN_YOUYICUN_H = 64;
export const LIUYUAN_YOUYICUN_WORLD_W = 1536;
export const LIUYUAN_YOUYICUN_WORLD_H = 1024;
export const LIUYUAN_YOUYICUN_SPAWN = { x: 624, y: 872 } as const;
export const LIUYUAN_YOUYICUN_FEET = {
  gateFront: { x: 920, y: 680 },
  threshold: { x: 968, y: 616 },
  gardenSide: { x: 997, y: 526 },
  onward: { x: 1072, y: 414 },
} as const;

/** 只按本张研究图的圆门图面标尺估算，非史料中的真实门高。 */
export const LIUYUAN_YOUYICUN_ACTOR_SCALE = {
  farFootY: 390, nearFootY: 900,
  farHeight: 200, nearHeight: 280,
  gateOpeningVisualHeight: 410,
} as const;

/** 按图面铺地的逐段收口 Tile；边界留给玩家在编辑器校准，不代表实地游线。 */
export const LIUYUAN_YOUYICUN_DRAFT_REGIONS: readonly FuxueTileRegion[] = [
  { id: 'youyicun-near-lower', x: 31, y: 58, w: 52, h: 5, tile: T.PATH },
  { id: 'youyicun-near-middle', x: 31, y: 51, w: 46, h: 7, tile: T.PATH },
  { id: 'youyicun-near-upper', x: 33, y: 48, w: 40, h: 3, tile: T.PATH },
  { id: 'youyicun-approach-lower', x: 34, y: 45, w: 38, h: 3, tile: T.PATH },
  { id: 'youyicun-approach-upper', x: 40, y: 41, w: 32, h: 4, tile: T.PATH },
  { id: 'youyicun-gate-throat', x: 51, y: 35, w: 18, h: 7, tile: T.CORR },
  { id: 'youyicun-inner-path', x: 59, y: 26, w: 13, h: 10, tile: T.PATH },
  { id: 'youyicun-far-path', x: 61, y: 23, w: 11, h: 6, tile: T.PATH },
];

/** 墙、门圈和花畦的精准轮廓留待用户对图拖拽；默认只由 Tile 封禁大区域。 */
export const LIUYUAN_YOUYICUN_GEOMETRY: readonly SceneGeometryObject[] = [
  { id: 'youyicun-wall-and-bed-candidates', colliders: [] },
];

export function buildLiuyuanYouyicunStudyMap(
  regions: readonly FuxueTileRegion[] = LIUYUAN_YOUYICUN_DRAFT_REGIONS,
) {
  const map = new Uint8Array(LIUYUAN_YOUYICUN_W * LIUYUAN_YOUYICUN_H);
  map.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_YOUYICUN_W && y < LIUYUAN_YOUYICUN_H) {
        map[y * LIUYUAN_YOUYICUN_W + x] = region.tile;
      }
    }
  }
  return { map, w: LIUYUAN_YOUYICUN_W, h: LIUYUAN_YOUYICUN_H,
    spawn: { ...LIUYUAN_YOUYICUN_SPAWN }, obstacles: [] };
}
