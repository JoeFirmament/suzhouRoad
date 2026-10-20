import type { CollisionShape, SceneGeometryObject, WorldPoint } from '../core/geometry.js';
import type { FuxueTileRegion } from './fuxue.js';
import { T } from './tiles.js';

/** 仅校门外—门厅这一镜：现状启发的游戏研究，不是留园旧门位测绘。 */
export const LIUYUAN_ENTRY_GATE_ID = 'liuyuan-entry-gate-style-study-v1';
export const LIUYUAN_ENTRY_GATE_W = 104;
export const LIUYUAN_ENTRY_GATE_H = 59;
export const LIUYUAN_ENTRY_GATE_WORLD_W = LIUYUAN_ENTRY_GATE_W * 16;
export const LIUYUAN_ENTRY_GATE_WORLD_H = LIUYUAN_ENTRY_GATE_H * 16;
export const LIUYUAN_ENTRY_GATE_FEET = {
  street: { x: 830, y: 755 },
  approach: { x: 830, y: 560 },
  threshold: { x: 830, y: 428 },
  hall: { x: 830, y: 315 },
} as const;
export const LIUYUAN_ENTRY_GATE_SPAWN = LIUYUAN_ENTRY_GATE_FEET.street;
export const LIUYUAN_ENTRY_GATE_ACTOR_SCALE = {
  farFootY: 315, nearFootY: 755, farHeight: 140, nearHeight: 172,
} as const;

// 世界像素和图像像素相差不到 1%；边界只取看得清的石地内缘，
// 不把种植池、门柱、屋瓦或图片最下缘的屋檐判作可走地面。
const STREET: readonly WorldPoint[] = [
  [84, 515], [580, 515], [580, 485], [1090, 485], [1090, 515], [1580, 515],
  [1580, 790], [1110, 790], [1110, 860], [555, 860], [555, 790], [84, 790],
];
const GATE: readonly WorldPoint[] = [
  [690, 230], [985, 230], [985, 435], [1090, 485], [580, 485], [690, 435],
];

function insidePolygon(x: number, y: number, polygon: readonly WorldPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function bands(id: string, polygon: readonly WorldPoint[], tile: number): FuxueTileRegion[] {
  const output: FuxueTileRegion[] = [];
  for (let y = 0; y < LIUYUAN_ENTRY_GATE_H; y++) {
    let start = -1;
    for (let x = 0; x <= LIUYUAN_ENTRY_GATE_W; x++) {
      const open = x < LIUYUAN_ENTRY_GATE_W && insidePolygon(x * 16 + 8, y * 16 + 8, polygon);
      if (open && start < 0) start = x;
      if (!open && start >= 0) {
        output.push({ id: `${id}-${y}-${start}`, x: start, y, w: x - start, h: 1, tile });
        start = -1;
      }
    }
  }
  return output;
}

export const LIUYUAN_ENTRY_GATE_DRAFT_REGIONS: readonly FuxueTileRegion[] = [
  ...bands('gate-street', STREET, T.PATH),
  ...bands('gate-hall', GATE, T.CORR),
];

/** 物件分开标：碰撞取种植池与门柱根脚，檐口前景只取上方瓦面。 */
export const LIUYUAN_ENTRY_GATE_GEOMETRY: readonly SceneGeometryObject[] = [
  { id: 'entry-gate-left-bed', colliders: [{ x: 65, y: 350, w: 520, h: 150 }] },
  { id: 'entry-gate-right-bed', colliders: [{ x: 1090, y: 345, w: 535, h: 153 }] },
  { id: 'entry-gate-left-post', colliders: [{ x: 606, y: 151, w: 86, h: 285 }] },
  { id: 'entry-gate-right-post', colliders: [{ x: 991, y: 150, w: 84, h: 285 }] },
  { id: 'entry-gate-upper-eave', occluder: {
    id: 'entry-gate-upper-eave', depthY: 426,
    polygons: [[[582, 0], [1080, 0], [1080, 155], [582, 155]]],
  } },
  { id: 'entry-gate-foreground-left-eave', occluder: {
    id: 'entry-gate-foreground-left-eave', depthY: 840,
    polygons: [[[0, 715], [460, 745], [545, 835], [545, 944], [0, 944]]],
  } },
  { id: 'entry-gate-foreground-right-eave', occluder: {
    id: 'entry-gate-foreground-right-eave', depthY: 850,
    polygons: [[[1200, 800], [1664, 800], [1664, 944], [1170, 944]]],
  } },
];
export const LIUYUAN_ENTRY_GATE_OBSTACLES: readonly CollisionShape[] =
  LIUYUAN_ENTRY_GATE_GEOMETRY.flatMap((object) => object.colliders ?? []);

export function buildLiuyuanEntryGateStudyMap(
  regions: readonly FuxueTileRegion[] = LIUYUAN_ENTRY_GATE_DRAFT_REGIONS,
) {
  const map = new Uint8Array(LIUYUAN_ENTRY_GATE_W * LIUYUAN_ENTRY_GATE_H);
  map.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_ENTRY_GATE_W && y < LIUYUAN_ENTRY_GATE_H) {
        map[y * LIUYUAN_ENTRY_GATE_W + x] = region.tile;
      }
    }
  }
  return { map, w: LIUYUAN_ENTRY_GATE_W, h: LIUYUAN_ENTRY_GATE_H,
    spawn: { ...LIUYUAN_ENTRY_GATE_SPAWN }, obstacles: LIUYUAN_ENTRY_GATE_OBSTACLES };
}
