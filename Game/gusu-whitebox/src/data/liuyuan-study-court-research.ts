import type { CollisionShape, SceneGeometryObject, WorldPoint } from '../core/geometry.js';
import type { FuxueTileRegion } from './fuxue.js';
import { T } from './tiles.js';
import { LIUYUAN_CHARACTER_SCALE } from './liuyuan-character-scale.js';

/** 北缘书斋院现状启发的游戏切片；入口、树位与铺地并非清末实测。 */
export const LIUYUAN_STUDY_COURT_ID = 'liuyuan-study-court-research-v1';
export const LIUYUAN_STUDY_COURT_W = 96;
export const LIUYUAN_STUDY_COURT_H = 64;
export const LIUYUAN_STUDY_COURT_WORLD_W = 1536;
export const LIUYUAN_STUDY_COURT_WORLD_H = 1024;
/** 与书房门框的游戏画面比例基准；非历史尺寸。试玩与统一编辑器共用。 */
export const LIUYUAN_STUDY_COURT_ACTOR_HEIGHT = LIUYUAN_CHARACTER_SCALE.studyCourt.worldHeight;
export const LIUYUAN_STUDY_COURT_SPAWN = { x: 720, y: 842 } as const;
/** 仅是当前游戏图上的可站交互脚点，不是历史门洞坐标。 */
export const LIUYUAN_STUDY_COURT_DOOR = { x: 480, y: 695 } as const;
export const LIUYUAN_STUDY_COURT_DOOR_SOUND = { x: 445, y: 650 } as const;
export const LIUYUAN_STUDY_COURT_DOOR_CHOICE_RADIUS = 38;
export const LIUYUAN_STUDY_COURT_DOOR_HEAR_RADIUS = 142;
export const LIUYUAN_STUDY_COURT_TREE = { x: 924, y: 734 } as const;
export const LIUYUAN_STUDY_COURT_CORRIDOR = { x: 1325, y: 660 } as const;

const COURT: readonly WorldPoint[] = [
  [365, 535], [550, 485], [1315, 475], [1455, 520], [1455, 810],
  [1350, 930], [435, 950], [305, 860], [305, 665],
];
function inside(x: number, y: number, points: readonly WorldPoint[]): boolean {
  let result = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) result = !result;
  }
  return result;
}
function bands(): FuxueTileRegion[] {
  const regions: FuxueTileRegion[] = [];
  for (let y = 0; y < LIUYUAN_STUDY_COURT_H; y++) {
    let start = -1;
    for (let x = 0; x <= LIUYUAN_STUDY_COURT_W; x++) {
      const open = x < LIUYUAN_STUDY_COURT_W && inside(x * 16 + 8, y * 16 + 8, COURT);
      if (open && start < 0) start = x;
      if (!open && start >= 0) {
        regions.push({ id: `study-paving-${y}-${start}`, x: start, y, w: x - start, h: 1, tile: T.PATH });
        start = -1;
      }
    }
  }
  return regions;
}
export const LIUYUAN_STUDY_COURT_DRAFT_REGIONS: readonly FuxueTileRegion[] = bands();
export const LIUYUAN_STUDY_COURT_GEOMETRY: readonly SceneGeometryObject[] = [
  { id: 'study-tree-rock-flowerbed', colliders: [{ points: [
    [853, 510], [965, 467], [1108, 483], [1242, 548],
    [1275, 660], [1190, 705], [1000, 699], [866, 628],
  ] }], occluder: { id: 'study-tree-canopy', depthY: 680, polygons: [[
    [721, 125], [866, 43], [1068, 30], [1268, 126], [1298, 357],
    [1204, 539], [1090, 573], [1010, 662], [897, 590], [797, 480], [696, 291],
  ]] } },
  { id: 'study-west-post', colliders: [{ x: 395, y: 517, w: 23, h: 67 }] },
  { id: 'study-north-post', colliders: [{ x: 610, y: 454, w: 22, h: 59 }] },
  { id: 'study-east-post', colliders: [{ x: 1370, y: 447, w: 26, h: 91 }],
    occluder: { id: 'study-east-post-front', depthY: 533, polygons: [[
      [1367, 252], [1402, 252], [1402, 545], [1367, 545],
    ]] } },
  { id: 'study-foreground-left-wall', occluder: { id: 'study-foreground-left-wall', depthY: 1010,
    polygons: [[[0, 854], [288, 873], [365, 1024], [0, 1024]]] } },
  { id: 'study-foreground-right-wall', occluder: { id: 'study-foreground-right-wall', depthY: 1000,
    polygons: [[[1378, 870], [1536, 790], [1536, 1024], [1390, 1024]]] } },
];
export const LIUYUAN_STUDY_COURT_OBSTACLES: readonly CollisionShape[] =
  LIUYUAN_STUDY_COURT_GEOMETRY.flatMap((object) => object.colliders ?? []);

export function buildLiuyuanStudyCourtMap(
  regions: readonly FuxueTileRegion[] = LIUYUAN_STUDY_COURT_DRAFT_REGIONS,
) {
  const map = new Uint8Array(LIUYUAN_STUDY_COURT_W * LIUYUAN_STUDY_COURT_H);
  map.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_STUDY_COURT_W && y < LIUYUAN_STUDY_COURT_H) {
        map[y * LIUYUAN_STUDY_COURT_W + x] = region.tile;
      }
    }
  }
  return { map, w: LIUYUAN_STUDY_COURT_W, h: LIUYUAN_STUDY_COURT_H,
    spawn: { ...LIUYUAN_STUDY_COURT_SPAWN }, obstacles: LIUYUAN_STUDY_COURT_OBSTACLES };
}
