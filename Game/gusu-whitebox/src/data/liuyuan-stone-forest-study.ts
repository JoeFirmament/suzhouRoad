import type { CollisionShape, SceneGeometryObject, WorldPoint } from '../core/geometry.js';
import type { FuxueTileRegion } from './fuxue.js';
import { T } from './tiles.js';

/** 石林小院研究切片：只验证画面中的走地/峰石/廊柱，不复原 1890 门洞坐标。 */
export const LIUYUAN_STONE_FOREST_ID = 'liuyuan-stone-forest-court-study-v1';
export const LIUYUAN_STONE_FOREST_W = 111;
export const LIUYUAN_STONE_FOREST_H = 56;
export const LIUYUAN_STONE_FOREST_WORLD_W = 1776;
export const LIUYUAN_STONE_FOREST_WORLD_H = 896;
export const LIUYUAN_STONE_FOREST_SPAWN = { x: 465, y: 550 } as const;
export const LIUYUAN_STONE_FOREST_PEAK_FOOT = { x: 975, y: 710 } as const;
export const LIUYUAN_STONE_FOREST_YIFENG_FOOT = { x: 525, y: 390 } as const;
export const LIUYUAN_STONE_FOREST_EAST_EXIT = { x: 1635, y: 530 } as const;

const LEFT_COURT: readonly WorldPoint[] = [
  [210, 360], [620, 315], [795, 385], [810, 620], [680, 740], [365, 685], [210, 530],
];
const FRONT_WALK: readonly WorldPoint[] = [
  [440, 570], [750, 565], [1290, 580], [1555, 520], [1680, 645],
  [1570, 800], [1090, 825], [690, 765], [410, 665],
];
const RIGHT_COURT: readonly WorldPoint[] = [
  [1240, 325], [1776, 305], [1776, 650], [1510, 730], [1240, 625],
];
const PAVILION_FLOOR: readonly WorldPoint[] = [
  [345, 255], [650, 250], [660, 405], [340, 420],
];

function inside(x: number, y: number, points: readonly WorldPoint[]): boolean {
  let result = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) result = !result;
  }
  return result;
}
function bands(id: string, points: readonly WorldPoint[], tile: number): FuxueTileRegion[] {
  const result: FuxueTileRegion[] = [];
  for (let y = 0; y < LIUYUAN_STONE_FOREST_H; y++) {
    let first = -1;
    for (let x = 0; x <= LIUYUAN_STONE_FOREST_W; x++) {
      const open = x < LIUYUAN_STONE_FOREST_W && inside(x * 16 + 8, y * 16 + 8, points);
      if (open && first < 0) first = x;
      if (!open && first >= 0) {
        result.push({ id: `${id}-${y}-${first}`, x: first, y, w: x - first, h: 1, tile });
        first = -1;
      }
    }
  }
  return result;
}

export const LIUYUAN_STONE_FOREST_DRAFT_REGIONS: readonly FuxueTileRegion[] = [
  ...bands('stone-left-court', LEFT_COURT, T.PATH),
  ...bands('stone-front-walk', FRONT_WALK, T.PATH),
  ...bands('stone-right-court', RIGHT_COURT, T.CORR),
  ...bands('stone-yifeng-floor', PAVILION_FLOOR, T.PLAT),
];

export const LIUYUAN_STONE_FOREST_GEOMETRY: readonly SceneGeometryObject[] = [
  { id: 'stone-main-peak-bed', colliders: [{ points: [
    [645, 495], [710, 400], [880, 365], [1090, 375], [1270, 455],
    [1315, 605], [1165, 665], [840, 650], [650, 585],
  ] }] },
  { id: 'stone-left-rock-cluster', colliders: [{ points: [[235,395],[370,375],[425,475],[380,535],[245,515]] }] },
  { id: 'stone-right-rock-cluster', colliders: [{ points: [[1480,360],[1580,360],[1635,465],[1585,510],[1460,480]] }] },
  { id: 'stone-leaning-leaf-v2', colliders: [{ points: [[613,505],[672,490],[711,547],[679,576],[622,565]] }],
    occluder: { id: 'stone-leaning-leaf-v2-occluder', depthY: 565,
      polygons: [[[626,493],[652,481],[680,500],[706,544],[690,563],[636,563],[610,526]]] } },
  { id: 'stone-yifeng-west-post', colliders: [{ x: 364, y: 345, w: 23, h: 46 }] },
  { id: 'stone-yifeng-east-post', colliders: [{ x: 625, y: 342, w: 23, h: 48 }] },
  { id: 'stone-east-corridor-post', colliders: [{ x: 1648, y: 430, w: 25, h: 78 }] },
  { id: 'stone-main-peak-occluder', occluder: { id: 'stone-main-peak-occluder', depthY: 625,
    polygons: [[[675,285],[900,145],[1010,125],[1165,325],[1300,405],
      [1340,645],[1135,675],[890,650],[675,580]]] } },
  { id: 'stone-front-left-eave', occluder: { id: 'stone-front-left-eave', depthY: 880,
    polygons: [[[0,495],[325,500],[895,780],[860,896],[0,896]]] } },
  { id: 'stone-front-right-eave', occluder: { id: 'stone-front-right-eave', depthY: 890,
    polygons: [[[1340,800],[1776,625],[1776,896],[1350,896]]] } },
  { id: 'stone-east-corridor-roof', occluder: { id: 'stone-east-corridor-roof', depthY: 480,
    polygons: [[[1260,110],[1776,165],[1776,375],[1320,300]]] } },
];
export const LIUYUAN_STONE_FOREST_OBSTACLES: readonly CollisionShape[] =
  LIUYUAN_STONE_FOREST_GEOMETRY.flatMap((object) => object.colliders ?? []);

export function buildLiuyuanStoneForestStudyMap(
  regions: readonly FuxueTileRegion[] = LIUYUAN_STONE_FOREST_DRAFT_REGIONS,
) {
  const map = new Uint8Array(LIUYUAN_STONE_FOREST_W * LIUYUAN_STONE_FOREST_H);
  map.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_STONE_FOREST_W && y < LIUYUAN_STONE_FOREST_H) {
        map[y * LIUYUAN_STONE_FOREST_W + x] = region.tile;
      }
    }
  }
  return { map, w: LIUYUAN_STONE_FOREST_W, h: LIUYUAN_STONE_FOREST_H,
    spawn: { ...LIUYUAN_STONE_FOREST_SPAWN }, obstacles: LIUYUAN_STONE_FOREST_OBSTACLES };
}
