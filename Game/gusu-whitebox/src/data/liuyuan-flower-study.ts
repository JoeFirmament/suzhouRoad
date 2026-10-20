import type { CollisionShape, SceneGeometryObject, WorldPoint } from '../core/geometry.js';
import type { FuxueTileRegion } from './fuxue.js';
import { T } from './tiles.js';

/** 北部花木作业区的玩法切片；只依据史料中的花房/兰花作业，不复原 1890 门位。 */
export const LIUYUAN_FLOWER_ID = 'liuyuan-flower-work-yard-study-v3';
export const LIUYUAN_FLOWER_W = 111;
export const LIUYUAN_FLOWER_H = 56;
export const LIUYUAN_FLOWER_WORLD_W = LIUYUAN_FLOWER_W * 16;
export const LIUYUAN_FLOWER_WORLD_H = LIUYUAN_FLOWER_H * 16;
export const LIUYUAN_FLOWER_SPAWN = { x: 820, y: 500 } as const;
export const LIUYUAN_FLOWER_WORKER = { x: 565, y: 450 } as const;
export const LIUYUAN_FLOWER_WORKER_STAND = { x: 650, y: 485 } as const;
export const LIUYUAN_FLOWER_BUCKET = { x: 480, y: 445 } as const;
export const LIUYUAN_FLOWER_EAST_EXIT = { x: 1675, y: 445 } as const;
/** Chapter interactions and both transfer edges must remain reachable in an editor draft. */
export const LIUYUAN_FLOWER_REQUIRED_FEET = [
  { id: '院口', ...LIUYUAN_FLOWER_SPAWN, radius: 16, mustStand: true },
  { id: '檐下粥桶', ...LIUYUAN_FLOWER_BUCKET, radius: 90 },
  { id: '花匠旁', ...LIUYUAN_FLOWER_WORKER_STAND, radius: 55 },
  { id: '东侧转场', ...LIUYUAN_FLOWER_EAST_EXIT, radius: 80, mustStand: true },
] as const;

/** 只把图上可见的院地转为 Tile；前景屋顶、后排盆架与花房墙都非地面。 */
const YARD_FLOOR: readonly WorldPoint[] = [
  [350, 348], [1570, 348], [1640, 390], [1640, 585],
  [1580, 685], [1540, 852], [790, 896], [695, 824], [595, 685], [350, 525],
];
const EAST_PASSAGE: readonly WorldPoint[] = [
  [1570, 350], [1776, 340], [1776, 565], [1600, 565],
];

function insidePolygon(x: number, y: number, points: readonly WorldPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function bands(id: string, points: readonly WorldPoint[], tile: number): FuxueTileRegion[] {
  const result: FuxueTileRegion[] = [];
  for (let y = 0; y < LIUYUAN_FLOWER_H; y++) {
    let start = -1;
    for (let x = 0; x <= LIUYUAN_FLOWER_W; x++) {
      const open = x < LIUYUAN_FLOWER_W && insidePolygon(x * 16 + 8, y * 16 + 8, points);
      if (open && start < 0) start = x;
      if (!open && start >= 0) {
        result.push({ id: `${id}-${y}-${start}`, x: start, y, w: x - start, h: 1, tile });
        start = -1;
      }
    }
  }
  return result;
}

export const LIUYUAN_FLOWER_DRAFT_REGIONS: readonly FuxueTileRegion[] = [
  ...bands('flower-yard-floor', YARD_FLOOR, T.PATH),
  ...bands('flower-east-passage', EAST_PASSAGE, T.CORR),
];

export const LIUYUAN_FLOWER_GEOMETRY: readonly SceneGeometryObject[] = [
  { id: 'flower-work-table', colliders: [{ x: 110, y: 260, w: 275, h: 185 }] },
  { id: 'flower-rear-potting-bed', colliders: [{ x: 610, y: 235, w: 960, h: 110 }] },
  { id: 'flower-worker-foot', colliders: [{ x: 522, y: 427, w: 84, h: 32 }] },
  {
    id: 'flower-front-left-eave',
    occluder: { id: 'flower-front-left-eave', depthY: 875,
      polygons: [[[0, 575], [300, 565], [605, 760], [760, 896], [0, 896]]] },
  },
  {
    id: 'flower-front-right-eave',
    occluder: { id: 'flower-front-right-eave', depthY: 830,
      polygons: [[[1590, 630], [1776, 615], [1776, 896], [1660, 896]]] },
  },
];

export const LIUYUAN_FLOWER_OBSTACLES: readonly CollisionShape[] =
  LIUYUAN_FLOWER_GEOMETRY.flatMap((object) => object.colliders ?? []);

export function buildLiuyuanFlowerStudyMap(regions: readonly FuxueTileRegion[] = LIUYUAN_FLOWER_DRAFT_REGIONS) {
  const map = new Uint8Array(LIUYUAN_FLOWER_W * LIUYUAN_FLOWER_H);
  map.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_FLOWER_W && y < LIUYUAN_FLOWER_H) {
        map[y * LIUYUAN_FLOWER_W + x] = region.tile;
      }
    }
  }
  return { map, w: LIUYUAN_FLOWER_W, h: LIUYUAN_FLOWER_H,
    spawn: { ...LIUYUAN_FLOWER_SPAWN }, obstacles: LIUYUAN_FLOWER_OBSTACLES };
}
