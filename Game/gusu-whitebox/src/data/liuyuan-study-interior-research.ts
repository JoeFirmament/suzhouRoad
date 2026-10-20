import type { CollisionShape, SceneGeometryObject, WorldPoint } from '../core/geometry.js';
import type { FuxueTileRegion } from './fuxue.js';
import { T } from './tiles.js';

/** CH3-07 书斋内景的独立游戏演出，不是已核实的历史室内陈设。 */
export const LIUYUAN_STUDY_INTERIOR_ID = 'liuyuan-study-interior-research-v1';
export const LIUYUAN_STUDY_INTERIOR_WORLD_W = 1536;
export const LIUYUAN_STUDY_INTERIOR_WORLD_H = 1024;
export const LIUYUAN_STUDY_INTERIOR_W = 96;
export const LIUYUAN_STUDY_INTERIOR_H = 64;
export const LIUYUAN_STUDY_INTERIOR_SPAWN = { x: 770, y: 840 } as const;
export const LIUYUAN_STUDY_INTERIOR_COPYIST = { x: 630, y: 510 } as const;
export const LIUYUAN_STUDY_INTERIOR_DESK = { x: 480, y: 500 } as const;
export const LIUYUAN_STUDY_INTERIOR_SHELF = { x: 1120, y: 465 } as const;
export const LIUYUAN_STUDY_INTERIOR_WINDOW = { x: 815, y: 440 } as const;
export const LIUYUAN_STUDY_INTERIOR_EXIT = { x: 770, y: 890 } as const;

const FLOOR: readonly WorldPoint[] = [
  [162, 385], [1362, 385], [1480, 690], [1470, 920],
  [970, 955], [930, 1010], [590, 1010], [560, 955],
  [70, 920], [55, 710],
];
function inside(x: number, y: number, points: readonly WorldPoint[]): boolean {
  let result = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) result = !result;
  }
  return result;
}
function floorBands(): FuxueTileRegion[] {
  const regions: FuxueTileRegion[] = [];
  for (let y = 0; y < LIUYUAN_STUDY_INTERIOR_H; y++) {
    let start = -1;
    for (let x = 0; x <= LIUYUAN_STUDY_INTERIOR_W; x++) {
      const open = x < LIUYUAN_STUDY_INTERIOR_W && inside(x * 16 + 8, y * 16 + 8, FLOOR);
      if (open && start < 0) start = x;
      if (!open && start >= 0) {
        regions.push({ id: `study-room-floor-${y}-${start}`, x: start, y,
          w: x - start, h: 1, tile: T.CORR });
        start = -1;
      }
    }
  }
  return regions;
}
export const LIUYUAN_STUDY_INTERIOR_DRAFT_REGIONS: readonly FuxueTileRegion[] = floorBands();
export const LIUYUAN_STUDY_INTERIOR_GEOMETRY: readonly SceneGeometryObject[] = [
  { id: 'study-room-writing-desk', colliders: [{ x: 250, y: 287, w: 365, h: 168 }],
    occluder: { id: 'study-room-desk-front', depthY: 460, polygons: [[
      [235, 305], [623, 305], [623, 454], [235, 454],
    ]] } },
  { id: 'study-room-bookcase', colliders: [{ x: 1008, y: 90, w: 315, h: 305 }] },
  { id: 'study-room-west-wall', colliders: [{ points: [[0, 376], [80, 376], [80, 952], [0, 952]] }] },
  { id: 'study-room-east-wall', colliders: [{ points: [[1460, 376], [1536, 376], [1536, 952], [1460, 952]] }] },
  { id: 'study-room-threshold-left', occluder: { id: 'study-room-threshold-left', depthY: 1010,
    polygons: [[[0, 950], [585, 950], [585, 1024], [0, 1024]]] } },
  { id: 'study-room-threshold-right', occluder: { id: 'study-room-threshold-right', depthY: 1010,
    polygons: [[[946, 950], [1536, 950], [1536, 1024], [946, 1024]]] } },
];
export const LIUYUAN_STUDY_INTERIOR_OBSTACLES: readonly CollisionShape[] =
  LIUYUAN_STUDY_INTERIOR_GEOMETRY.flatMap((object) => object.colliders ?? []);

export function buildLiuyuanStudyInteriorMap(
  regions: readonly FuxueTileRegion[] = LIUYUAN_STUDY_INTERIOR_DRAFT_REGIONS,
) {
  const map = new Uint8Array(LIUYUAN_STUDY_INTERIOR_W * LIUYUAN_STUDY_INTERIOR_H);
  map.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_STUDY_INTERIOR_W && y < LIUYUAN_STUDY_INTERIOR_H) {
        map[y * LIUYUAN_STUDY_INTERIOR_W + x] = region.tile;
      }
    }
  }
  return { map, w: LIUYUAN_STUDY_INTERIOR_W, h: LIUYUAN_STUDY_INTERIOR_H,
    spawn: { ...LIUYUAN_STUDY_INTERIOR_SPAWN }, obstacles: LIUYUAN_STUDY_INTERIOR_OBSTACLES };
}
