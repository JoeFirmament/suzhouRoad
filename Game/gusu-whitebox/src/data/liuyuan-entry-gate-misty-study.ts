import type { CollisionShape, SceneGeometryObject, WorldPoint } from '../core/geometry.js';
import type { FuxueTileRegion } from './fuxue.js';
import { T } from './tiles.js';

/** 独立的门墙美术/几何研究切片；不是清末入口坐标，也不替代整条夹弄。 */
export const LIUYUAN_GATE_MISTY_ID = 'liuyuan-entry-gate-misty-study-v2';
export const LIUYUAN_GATE_MISTY_W = 104;
export const LIUYUAN_GATE_MISTY_H = 59;
export const LIUYUAN_GATE_MISTY_WORLD_W = LIUYUAN_GATE_MISTY_W * 16;
export const LIUYUAN_GATE_MISTY_WORLD_H = LIUYUAN_GATE_MISTY_H * 16;
export const LIUYUAN_GATE_MISTY_FEET = {
  street: { x: 835, y: 782 },
  approach: { x: 946, y: 630 },
  threshold: { x: 1020, y: 517 },
  hall: { x: 1020, y: 340 },
} as const;
export const LIUYUAN_GATE_MISTY_SPAWN = LIUYUAN_GATE_MISTY_FEET.street;
export const LIUYUAN_GATE_MISTY_ACTOR_SCALE = {
  farFootY: 340, nearFootY: 782, farHeight: 138, nearHeight: 174,
} as const;

// 保守地只铺图面清楚的连续石路；两侧树丛、粉墙及屋瓦均是禁行区。
// 多边形以图像像素拟合，经 1672×941 原图到 1664×944 世界坐标微缩放。
const APPROACH: readonly WorldPoint[] = [
  [280, 943], [1075, 943], [1115, 845], [1170, 740], [1190, 650],
  [1185, 515], [835, 515], [710, 565], [560, 650], [430, 790],
];
const HALL: readonly WorldPoint[] = [
  [905, 215], [1130, 215], [1170, 505], [1190, 530], [835, 530], [865, 490],
];

function insidePolygon(x: number, y: number, polygon: readonly WorldPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function rowBands(id: string, polygon: readonly WorldPoint[], tile: number): FuxueTileRegion[] {
  const rows: FuxueTileRegion[] = [];
  for (let y = 0; y < LIUYUAN_GATE_MISTY_H; y++) {
    let start = -1;
    for (let x = 0; x <= LIUYUAN_GATE_MISTY_W; x++) {
      const open = x < LIUYUAN_GATE_MISTY_W && insidePolygon(x * 16 + 8, y * 16 + 8, polygon);
      if (open && start < 0) start = x;
      if (!open && start >= 0) {
        rows.push({ id: `${id}-${y}-${start}`, x: start, y, w: x - start, h: 1, tile });
        start = -1;
      }
    }
  }
  return rows;
}

export const LIUYUAN_GATE_MISTY_DRAFT_REGIONS: readonly FuxueTileRegion[] = [
  ...rowBands('approach', APPROACH, T.PATH),
  ...rowBands('hall', HALL, T.CORR),
];

/** 柱脚与前景瓦面按新图重标；不沿用旧对称花池碰撞。 */
export const LIUYUAN_GATE_MISTY_GEOMETRY: readonly SceneGeometryObject[] = [
  { id: 'misty-gate-left-post', colliders: [{ x: 770, y: 417, w: 84, h: 105 }] },
  { id: 'misty-gate-right-post', colliders: [{ x: 1182, y: 418, w: 82, h: 112 }] },
  { id: 'misty-gate-eave', occluder: {
    id: 'misty-gate-eave', depthY: 510,
    polygons: [[[695, 0], [1335, 0], [1335, 178], [695, 178]]],
  } },
  { id: 'misty-right-foreground-roof', occluder: {
    id: 'misty-right-foreground-roof', depthY: 874,
    polygons: [[[1490, 465], [1664, 475], [1664, 944], [1450, 944]]],
  } },
];
export const LIUYUAN_GATE_MISTY_OBSTACLES: readonly CollisionShape[] =
  LIUYUAN_GATE_MISTY_GEOMETRY.flatMap((object) => object.colliders ?? []);

export function buildLiuyuanGateMistyStudyMap(
  regions: readonly FuxueTileRegion[] = LIUYUAN_GATE_MISTY_DRAFT_REGIONS,
) {
  const map = new Uint8Array(LIUYUAN_GATE_MISTY_W * LIUYUAN_GATE_MISTY_H);
  map.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_GATE_MISTY_W && y < LIUYUAN_GATE_MISTY_H) {
        map[y * LIUYUAN_GATE_MISTY_W + x] = region.tile;
      }
    }
  }
  return { map, w: LIUYUAN_GATE_MISTY_W, h: LIUYUAN_GATE_MISTY_H,
    spawn: { ...LIUYUAN_GATE_MISTY_SPAWN }, obstacles: LIUYUAN_GATE_MISTY_OBSTACLES };
}
