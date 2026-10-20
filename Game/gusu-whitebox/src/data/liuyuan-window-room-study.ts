import type { SceneGeometryObject } from '../core/geometry.js';
import type { FuxueTileRegion } from './fuxue.js';
import { T } from './tiles.js';

/** 只给「洞天一碧」三窗研究图标可玩的前景地面，不代表实测室内平面。 */
export const LIUYUAN_WINDOW_ROOM_ID = 'liuyuan-dongtian-three-windows-study-v1';
export const LIUYUAN_WINDOW_ROOM_W = 60;
export const LIUYUAN_WINDOW_ROOM_H = 34;
export const LIUYUAN_WINDOW_ROOM_WORLD_W = 960;
export const LIUYUAN_WINDOW_ROOM_WORLD_H = 544;
export const LIUYUAN_WINDOW_ROOM_SPAWN = { x: 480, y: 488 } as const;
export const LIUYUAN_WINDOW_ROOM_FEET = {
  west: { x: 123, y: 448 },
  middle: { x: 480, y: 448 },
  east: { x: 843, y: 448 },
} as const;

/** 当前研究底图的视觉标定，不是小屋的实测尺寸。换底图必须重标。 */
export const LIUYUAN_WINDOW_ROOM_ACTOR_SCALE = {
  farFootY: 416, nearFootY: 528,
  farHeight: 145, nearHeight: 175,
  centralWindowVisualHeight: 176,
} as const;

export const LIUYUAN_WINDOW_ROOM_DRAFT_REGIONS: readonly FuxueTileRegion[] = [
  { id: 'dongtian-walk-floor', x: 2, y: 26, w: 56, h: 7, tile: T.CORR },
];

/** 先不虚构家具落地形状；上方墙基由不可走 Tile 负责。 */
export const LIUYUAN_WINDOW_ROOM_GEOMETRY: readonly SceneGeometryObject[] = [
  { id: 'dongtian-room-objects', colliders: [] },
];

export function buildLiuyuanWindowRoomStudyMap(
  regions: readonly FuxueTileRegion[] = LIUYUAN_WINDOW_ROOM_DRAFT_REGIONS,
) {
  const map = new Uint8Array(LIUYUAN_WINDOW_ROOM_W * LIUYUAN_WINDOW_ROOM_H);
  map.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_WINDOW_ROOM_W && y < LIUYUAN_WINDOW_ROOM_H) {
        map[y * LIUYUAN_WINDOW_ROOM_W + x] = region.tile;
      }
    }
  }
  return { map, w: LIUYUAN_WINDOW_ROOM_W, h: LIUYUAN_WINDOW_ROOM_H,
    spawn: { ...LIUYUAN_WINDOW_ROOM_SPAWN }, obstacles: [] };
}
