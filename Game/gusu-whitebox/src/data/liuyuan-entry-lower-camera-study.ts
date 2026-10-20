import type { CollisionShape, SceneGeometryObject, WorldPoint } from '../core/geometry.js';
import type { FuxueTileRegion } from './fuxue.js';
import { T } from './tiles.js';

/** A fresh, isolated game-camera study. Nothing here locates an 1890 gate. */
export const LIUYUAN_ENTRY_LOWER_ID = 'liuyuan-entry-lower-camera-study-v1';
export const LIUYUAN_ENTRY_LOWER_W = 105;
export const LIUYUAN_ENTRY_LOWER_H = 59;
export const LIUYUAN_ENTRY_LOWER_WORLD_W = 1672;
export const LIUYUAN_ENTRY_LOWER_WORLD_H = 941;
export const LIUYUAN_ENTRY_LOWER_FEET = {
  street: { x: 780, y: 830 },
  approach: { x: 975, y: 670 },
  threshold: { x: 1098, y: 550 },
  gateInside: { x: 1100, y: 470 },
  lightwell: { x: 1160, y: 365 },
  stop: { x: 1270, y: 315 },
} as const;
export const LIUYUAN_ENTRY_LOWER_SPAWN = LIUYUAN_ENTRY_LOWER_FEET.street;
/** Fictional CH3 cast blocking for this art study, not historical placement. */
export const LIUYUAN_ENTRY_LOWER_NPC_FEET = {
  oldVendor: { x: 650, y: 747 },
  qiao: { x: 845, y: 720 },
  gatekeeper: { x: 1360, y: 680 },
} as const;
export const LIUYUAN_ENTRY_LOWER_ACTOR_SCALE = {
  farFootY: 315, nearFootY: 830, farHeight: 165, nearHeight: 195,
} as const;

// These are conservative floor shapes read from the generated research image.
// They are not survey polygons, and no unsupported window or historical plaque is inferred.
const OUTER_STONE: readonly WorldPoint[] = [
  [0, 390], [540, 485], [850, 545], [1260, 595], [1672, 710], [1672, 941], [0, 941],
];
const GATE_SILL: readonly WorldPoint[] = [
  [985, 635], [1233, 635], [1220, 496], [997, 496],
];
const INNER_STONE: readonly WorldPoint[] = [
  [1005, 512], [1210, 512], [1250, 313], [1084, 290], [1032, 353],
];
const TURN_OUT_OF_SIGHT: readonly WorldPoint[] = [
  [1140, 385], [1250, 385], [1370, 303], [1315, 285], [1212, 286],
];

function insidePolygon(x: number, y: number, points: readonly WorldPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function bands(id: string, shape: readonly WorldPoint[], tile: number): FuxueTileRegion[] {
  const regions: FuxueTileRegion[] = [];
  for (let y = 0; y < LIUYUAN_ENTRY_LOWER_H; y++) {
    let start = -1;
    for (let x = 0; x <= LIUYUAN_ENTRY_LOWER_W; x++) {
      const open = x < LIUYUAN_ENTRY_LOWER_W && insidePolygon(x * 16 + 8, y * 16 + 8, shape);
      if (open && start < 0) start = x;
      if (!open && start >= 0) {
        regions.push({ id: `${id}-${y}-${start}`, x: start, y, w: x - start, h: 1, tile });
        start = -1;
      }
    }
  }
  return regions;
}

export const LIUYUAN_ENTRY_LOWER_DRAFT_REGIONS: readonly FuxueTileRegion[] = [
  ...bands('outer-stone', OUTER_STONE, T.PATH),
  ...bands('gate-sill', GATE_SILL, T.CORR),
  ...bands('inner-stone', INNER_STONE, T.CORR),
  ...bands('turn', TURN_OUT_OF_SIGHT, T.PATH),
];

export const LIUYUAN_ENTRY_LOWER_GEOMETRY: readonly SceneGeometryObject[] = [
  { id: 'lower-entry-left-jamb', colliders: [{ x: 874, y: 470, w: 128, h: 102 }] },
  { id: 'lower-entry-right-jamb', colliders: [{ x: 1214, y: 480, w: 118, h: 123 }] },
  { id: 'lower-entry-wall-leaf-base', colliders: [{ x: 580, y: 416, w: 178, h: 85 }] },
  { id: 'lower-entry-gate-eave', occluder: {
    id: 'lower-entry-gate-eave', depthY: 556,
    polygons: [[[835, 22], [1384, 22], [1384, 241], [835, 241]]],
  } },
  { id: 'lower-entry-left-foreground-roof', occluder: {
    id: 'lower-entry-left-foreground-roof', depthY: 931,
    polygons: [[[0, 665], [286, 665], [286, 941], [0, 941]]],
  } },
];
export const LIUYUAN_ENTRY_LOWER_OBSTACLES: readonly CollisionShape[] =
  LIUYUAN_ENTRY_LOWER_GEOMETRY.flatMap((object) => object.colliders ?? []);

export function buildLiuyuanEntryLowerStudyMap(
  regions: readonly FuxueTileRegion[] = LIUYUAN_ENTRY_LOWER_DRAFT_REGIONS,
) {
  const map = new Uint8Array(LIUYUAN_ENTRY_LOWER_W * LIUYUAN_ENTRY_LOWER_H);
  map.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_ENTRY_LOWER_W && y < LIUYUAN_ENTRY_LOWER_H) {
        map[y * LIUYUAN_ENTRY_LOWER_W + x] = region.tile;
      }
    }
  }
  return { map, w: LIUYUAN_ENTRY_LOWER_W, h: LIUYUAN_ENTRY_LOWER_H,
    spawn: { ...LIUYUAN_ENTRY_LOWER_SPAWN }, obstacles: LIUYUAN_ENTRY_LOWER_OBSTACLES };
}
