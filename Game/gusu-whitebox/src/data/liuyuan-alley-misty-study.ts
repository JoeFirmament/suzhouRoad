import type { CollisionShape, SceneGeometryObject, WorldPoint } from '../core/geometry.js';
import type { FuxueTileRegion } from './fuxue.js';
import { T } from './tiles.js';

/** 门墙之后的独立画风/步行研究；不是清末夹弄的测绘或正式 CH3 通路。 */
export const LIUYUAN_ALLEY_MISTY_ID = 'liuyuan-alley-misty-study-v1';
export const LIUYUAN_ALLEY_MISTY_W = 104;
export const LIUYUAN_ALLEY_MISTY_H = 59;
export const LIUYUAN_ALLEY_MISTY_WORLD_W = LIUYUAN_ALLEY_MISTY_W * 16;
export const LIUYUAN_ALLEY_MISTY_WORLD_H = LIUYUAN_ALLEY_MISTY_H * 16;
export const LIUYUAN_ALLEY_MISTY_FEET = {
  threshold: { x: 800, y: 850 },
  firstNarrow: { x: 915, y: 640 },
  bend: { x: 1095, y: 480 },
  end: { x: 1190, y: 320 },
} as const;
export const LIUYUAN_ALLEY_MISTY_SPAWN = LIUYUAN_ALLEY_MISTY_FEET.threshold;
export const LIUYUAN_ALLEY_MISTY_ACTOR_SCALE = {
  farFootY: 320, nearFootY: 850, farHeight: 122, nearHeight: 174,
} as const;

// 只在图上清晰可见的路面铺 Tile；草木和墙基退让，用户可在统一编辑器细调。
const WALKWAY: readonly WorldPoint[] = [
  [100, 943], [1560, 943], [1475, 785], [1395, 645], [1350, 520],
  [1325, 370], [1300, 265], [1110, 265], [1020, 330], [925, 420],
  [800, 500], [600, 590], [420, 705], [255, 840],
];
function insidePolygon(x: number, y: number, polygon: readonly WorldPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function rowBands(id: string, polygon: readonly WorldPoint[]): FuxueTileRegion[] {
  const rows: FuxueTileRegion[] = [];
  for (let y = 0; y < LIUYUAN_ALLEY_MISTY_H; y++) {
    let start = -1;
    for (let x = 0; x <= LIUYUAN_ALLEY_MISTY_W; x++) {
      const open = x < LIUYUAN_ALLEY_MISTY_W && insidePolygon(x * 16 + 8, y * 16 + 8, polygon);
      if (open && start < 0) start = x;
      if (!open && start >= 0) {
        rows.push({ id: `${id}-${y}-${start}`, x: start, y, w: x - start, h: 1, tile: T.PATH });
        start = -1;
      }
    }
  }
  return rows;
}
export const LIUYUAN_ALLEY_MISTY_DRAFT_REGIONS: readonly FuxueTileRegion[] = rowBands('alley', WALKWAY);
export const LIUYUAN_ALLEY_MISTY_GEOMETRY: readonly SceneGeometryObject[] = [
  { id: 'misty-alley-left-wall-foot', colliders: [{ x: 722, y: 398, w: 94, h: 128 }] },
  { id: 'misty-alley-right-wall-foot', colliders: [{ x: 1460, y: 440, w: 82, h: 160 }] },
  { id: 'misty-alley-left-eave', occluder: {
    id: 'misty-alley-left-eave', depthY: 520,
    polygons: [[[0, 0], [840, 0], [840, 190], [0, 345]]],
  } },
  { id: 'misty-alley-right-eave', occluder: {
    id: 'misty-alley-right-eave', depthY: 565,
    polygons: [[[1380, 0], [1664, 0], [1664, 240], [1430, 130]]],
  } },
];
export const LIUYUAN_ALLEY_MISTY_OBSTACLES: readonly CollisionShape[] =
  LIUYUAN_ALLEY_MISTY_GEOMETRY.flatMap((object) => object.colliders ?? []);

export function buildLiuyuanAlleyMistyStudyMap(
  regions: readonly FuxueTileRegion[] = LIUYUAN_ALLEY_MISTY_DRAFT_REGIONS,
) {
  const map = new Uint8Array(LIUYUAN_ALLEY_MISTY_W * LIUYUAN_ALLEY_MISTY_H);
  map.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_ALLEY_MISTY_W && y < LIUYUAN_ALLEY_MISTY_H)
        map[y * LIUYUAN_ALLEY_MISTY_W + x] = region.tile;
    }
  }
  return { map, w: LIUYUAN_ALLEY_MISTY_W, h: LIUYUAN_ALLEY_MISTY_H,
    spawn: { ...LIUYUAN_ALLEY_MISTY_SPAWN }, obstacles: LIUYUAN_ALLEY_MISTY_OBSTACLES };
}
