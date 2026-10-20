import type { CollisionShape, SceneGeometryObject, WorldPoint } from '../core/geometry.js';
import type { FuxueTileRegion } from './fuxue.js';
import { T } from './tiles.js';

/** New camera/geometry trial for CH3's FIRST entrance shot only; never an 1890 survey. */
export const LIUYUAN_ENTRY_OBLIQUE_ID = 'liuyuan-entry-oblique-shot-study-v1';
export const LIUYUAN_ENTRY_OBLIQUE_W = 96;
export const LIUYUAN_ENTRY_OBLIQUE_H = 64;
export const LIUYUAN_ENTRY_OBLIQUE_WORLD_W = LIUYUAN_ENTRY_OBLIQUE_W * 16;
export const LIUYUAN_ENTRY_OBLIQUE_WORLD_H = LIUYUAN_ENTRY_OBLIQUE_H * 16;
export const LIUYUAN_ENTRY_OBLIQUE_FEET = {
  street: { x: 770, y: 915 },
  gateFront: { x: 770, y: 790 },
  threshold: { x: 770, y: 725 },
  hall: { x: 770, y: 595 },
  bend: { x: 690, y: 385 },
  lightwell: { x: 520, y: 270 },
  stop: { x: 315, y: 180 },
} as const;
export const LIUYUAN_ENTRY_OBLIQUE_SPAWN = LIUYUAN_ENTRY_OBLIQUE_FEET.street;
export const LIUYUAN_ENTRY_OBLIQUE_ACTOR_SCALE = {
  farFootY: 180, nearFootY: 915, farHeight: 105, nearHeight: 160,
} as const;

// Conservative visible-stone strips. Roofs are not walkable; the covered passage
// remains traversable beneath a separately depth-sorted foreground roof mask.
const STREET: readonly WorldPoint[] = [
  [610, 1024], [1090, 1024], [1080, 792], [650, 792],
];
const GATE: readonly WorldPoint[] = [
  [674, 810], [890, 810], [882, 547], [696, 547],
];
const INNER_PASSAGE: readonly WorldPoint[] = [
  [678, 570], [888, 570], [847, 437], [789, 360], [670, 346], [603, 398],
];
const WEST_TURN: readonly WorldPoint[] = [
  [615, 435], [785, 379], [715, 314], [635, 264], [517, 250], [500, 352],
];
const LIGHTWELL: readonly WorldPoint[] = [
  [435, 365], [610, 304], [588, 188], [435, 170], [365, 245],
];
const FAR_PATH: readonly WorldPoint[] = [
  [197, 267], [474, 267], [524, 177], [453, 123], [197, 123],
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
  for (let y = 0; y < LIUYUAN_ENTRY_OBLIQUE_H; y++) {
    let start = -1;
    for (let x = 0; x <= LIUYUAN_ENTRY_OBLIQUE_W; x++) {
      const open = x < LIUYUAN_ENTRY_OBLIQUE_W && insidePolygon(x * 16 + 8, y * 16 + 8, polygon);
      if (open && start < 0) start = x;
      if (!open && start >= 0) {
        rows.push({ id: `${id}-${y}-${start}`, x: start, y, w: x - start, h: 1, tile });
        start = -1;
      }
    }
  }
  return rows;
}

export const LIUYUAN_ENTRY_OBLIQUE_DRAFT_REGIONS: readonly FuxueTileRegion[] = [
  ...rowBands('street', STREET, T.PATH),
  ...rowBands('gate', GATE, T.CORR),
  ...rowBands('inner-passage', INNER_PASSAGE, T.CORR),
  ...rowBands('west-turn', WEST_TURN, T.CORR),
  ...rowBands('lightwell', LIGHTWELL, T.PATH),
  ...rowBands('far-path', FAR_PATH, T.PATH),
];

export const LIUYUAN_ENTRY_OBLIQUE_GEOMETRY: readonly SceneGeometryObject[] = [
  {
    id: 'oblique-gate-left-post',
    colliders: [{ x: 642, y: 661, w: 39, h: 111 }],
  },
  {
    id: 'oblique-gate-right-post',
    colliders: [{ x: 890, y: 660, w: 40, h: 113 }],
  },
  {
    id: 'oblique-gate-roof',
    occluder: {
      id: 'oblique-gate-roof', depthY: 789,
      polygons: [[[600, 383], [980, 383], [980, 555], [600, 555]]],
    },
  },
  {
    id: 'oblique-left-foreground-roof',
    occluder: {
      id: 'oblique-left-foreground-roof', depthY: 1020,
      polygons: [[[0, 825], [380, 825], [660, 970], [660, 1024], [0, 1024]]],
    },
  },
  {
    id: 'oblique-right-foreground-roof',
    occluder: {
      id: 'oblique-right-foreground-roof', depthY: 1020,
      polygons: [[[1290, 799], [1536, 799], [1536, 1024], [1060, 1024]]],
    },
  },
];
export const LIUYUAN_ENTRY_OBLIQUE_OBSTACLES: readonly CollisionShape[] =
  LIUYUAN_ENTRY_OBLIQUE_GEOMETRY.flatMap((object) => object.colliders ?? []);

export function buildLiuyuanEntryObliqueStudyMap(
  regions: readonly FuxueTileRegion[] = LIUYUAN_ENTRY_OBLIQUE_DRAFT_REGIONS,
) {
  const map = new Uint8Array(LIUYUAN_ENTRY_OBLIQUE_W * LIUYUAN_ENTRY_OBLIQUE_H);
  map.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_ENTRY_OBLIQUE_W && y < LIUYUAN_ENTRY_OBLIQUE_H) {
        map[y * LIUYUAN_ENTRY_OBLIQUE_W + x] = region.tile;
      }
    }
  }
  return { map, w: LIUYUAN_ENTRY_OBLIQUE_W, h: LIUYUAN_ENTRY_OBLIQUE_H,
    spawn: { ...LIUYUAN_ENTRY_OBLIQUE_SPAWN }, obstacles: LIUYUAN_ENTRY_OBLIQUE_OBSTACLES };
}
