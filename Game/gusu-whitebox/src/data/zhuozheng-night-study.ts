import type { FuxueTileRegion } from './fuxue.js';
import { T } from './tiles.js';

/** CH2 夜入东园的窄路标定种子；不是 1890 测绘，也不是正式运行时关卡。 */
export const ZHUOZHENG_NIGHT_W = 96;
export const ZHUOZHENG_NIGHT_H = 64;
export const ZHUOZHENG_NIGHT_SPAWN = { x: 1460, y: 685 } as const;

/** 后覆盖前；其余所有 Tile 保持实心，防止白天误入西园与会馆。 */
export const ZHUOZHENG_NIGHT_DRAFT_REGIONS: readonly FuxueTileRegion[] = [
  { id: 'east-night-landing', x: 90, y: 42, w: 3, h: 3, tile: T.PATH },
  { id: 'east-south-east-turn', x: 85, y: 43, w: 7, h: 3, tile: T.PATH },
  { id: 'east-south-walk', x: 75, y: 45, w: 12, h: 3, tile: T.PATH },
  { id: 'east-sketch-turn', x: 72, y: 42, w: 5, h: 6, tile: T.PATH },
  { id: 'east-observe-walk', x: 72, y: 39, w: 3, h: 6, tile: T.PATH },
];

export function buildZhuozhengNightStudyMap(regions: readonly FuxueTileRegion[] = ZHUOZHENG_NIGHT_DRAFT_REGIONS) {
  const map = new Uint8Array(ZHUOZHENG_NIGHT_W * ZHUOZHENG_NIGHT_H);
  map.fill(T.WALL);
  for (const region of regions) {
    for (let y = region.y; y < region.y + region.h; y++) {
      for (let x = region.x; x < region.x + region.w; x++) {
        if (x >= 0 && y >= 0 && x < ZHUOZHENG_NIGHT_W && y < ZHUOZHENG_NIGHT_H) {
          map[y * ZHUOZHENG_NIGHT_W + x] = region.tile;
        }
      }
    }
  }
  return { map, w: ZHUOZHENG_NIGHT_W, h: ZHUOZHENG_NIGHT_H, spawn: { ...ZHUOZHENG_NIGHT_SPAWN } };
}
