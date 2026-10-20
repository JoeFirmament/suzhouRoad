import type { FuxueTileRegion } from './fuxue.js';
import { T } from './tiles.js';

/**
 * 留园章入口的游戏化可走区域，不是历史门位测绘。
 * 默认全墙，只有被逐段声明的门厅、曲廊、小庭可以行走；
 * 这组 Tile 与入口美术、统一编辑器和正式剧情共用 1008×688 坐标。
 */
export const LIUYUAN_ENTRY_W = 63;
export const LIUYUAN_ENTRY_H = 43;
export const LIUYUAN_ENTRY_SPAWN = { x: 520, y: 656 } as const;
/** Fictional staging on the street, clear of the seated gatekeeper's silhouette. */
export const LIUYUAN_ENTRY_QIAO_WAIT = { x: 566, y: 676 } as const;

/** 后列区域覆盖前列；走廊宽 32px，需用玩家脚底盒实走。 */
export const LIUYUAN_ENTRY_DRAFT_REGIONS: readonly FuxueTileRegion[] = [
  { id: 'street-approach', x: 30, y: 39, w: 6, h: 4, tile: T.PATH },
  { id: 'small-gate-threshold', x: 31, y: 36, w: 3, h: 4, tile: T.CORR },
  { id: 'front-hall', x: 29, y: 32, w: 7, h: 5, tile: T.CORR },
  { id: 'first-light-well', x: 29, y: 28, w: 7, h: 5, tile: T.PATH },
  { id: 'long-south-corridor', x: 31, y: 24, w: 3, h: 5, tile: T.CORR },
  { id: 'west-turn', x: 26, y: 23, w: 8, h: 3, tile: T.CORR },
  { id: 'second-light-well', x: 24, y: 21, w: 6, h: 5, tile: T.PATH },
  { id: 'north-narrow-corridor', x: 26, y: 17, w: 3, h: 6, tile: T.CORR },
  { id: 'ancient-tree-court', x: 23, y: 14, w: 8, h: 5, tile: T.PATH },
  { id: 'west-to-green-shade', x: 18, y: 14, w: 9, h: 3, tile: T.CORR },
  { id: 'green-shade-threshold', x: 16, y: 11, w: 5, h: 6, tile: T.PATH },
  // 六扇漏窗是北侧实墙中的取景孔，不是玩家可穿过的门洞。
  { id: 'six-leak-windows-solid', x: 23, y: 13, w: 7, h: 1, tile: T.WIN },
  { id: 'pond-not-walkable', x: 6, y: 2, w: 12, h: 6, tile: T.WATER },
];

export function buildLiuyuanEntryStudyMap(regions: readonly FuxueTileRegion[] = LIUYUAN_ENTRY_DRAFT_REGIONS) {
  const map = new Uint8Array(LIUYUAN_ENTRY_W * LIUYUAN_ENTRY_H);
  map.fill(T.WALL);
  for (const region of regions) {
    for (let y = region.y; y < region.y + region.h; y++) {
      for (let x = region.x; x < region.x + region.w; x++) {
        if (x >= 0 && y >= 0 && x < LIUYUAN_ENTRY_W && y < LIUYUAN_ENTRY_H) {
          map[y * LIUYUAN_ENTRY_W + x] = region.tile;
        }
      }
    }
  }
  return { map, w: LIUYUAN_ENTRY_W, h: LIUYUAN_ENTRY_H, spawn: { ...LIUYUAN_ENTRY_SPAWN } };
}
