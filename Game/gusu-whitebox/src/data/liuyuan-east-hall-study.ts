import type { CollisionShape, SceneGeometryObject, WorldPoint } from '../core/geometry.js';
import type { FuxueTileRegion } from './fuxue.js';
import { T } from './tiles.js';

/** 宅院厅前植栽语法试走；不指定为还读我书斋，也不重建 1890 株位。 */
export const LIUYUAN_EAST_HALL_ID = 'liuyuan-east-hall-magnolia-court-study-v1';
export const LIUYUAN_EAST_HALL_W = 111;
export const LIUYUAN_EAST_HALL_H = 56;
export const LIUYUAN_EAST_HALL_WORLD_W = 1776;
export const LIUYUAN_EAST_HALL_WORLD_H = 896;
export const LIUYUAN_EAST_HALL_SPAWN = { x: 385, y: 575 } as const;
export const LIUYUAN_EAST_HALL_LEFT_TREE = { x: 515, y: 460 } as const;
export const LIUYUAN_EAST_HALL_RIGHT_TREE = { x: 1390, y: 505 } as const;
export const LIUYUAN_EAST_HALL_CENTER = { x: 970, y: 540 } as const;
export const LIUYUAN_EAST_HALL_DOOR = { x: 980, y: 380 } as const;
export const LIUYUAN_EAST_HALL_EAST_EXIT = { x: 1675, y: 475 } as const;

const COURT: readonly WorldPoint[] = [
  [105, 388], [320, 385], [735, 370], [1210, 365], [1595, 390], [1776, 425],
  [1776, 896], [230, 896], [140, 715], [105, 510],
];
const EAST_PASSAGE: readonly WorldPoint[] = [
  [1580, 260], [1776, 255], [1776, 610], [1560, 590],
];

function inside(x: number, y: number, points: readonly WorldPoint[]): boolean {
  let result = false;
  for (let i = 0, j = points.length-1; i < points.length; j = i++) {
    const [xi,yi] = points[i], [xj,yj] = points[j];
    if ((yi > y) !== (yj > y) && x < (xj-xi)*(y-yi)/(yj-yi)+xi) result = !result;
  }
  return result;
}
function bands(id: string, points: readonly WorldPoint[], tile: number): FuxueTileRegion[] {
  const result: FuxueTileRegion[] = [];
  for (let y = 0; y < LIUYUAN_EAST_HALL_H; y++) {
    let first = -1;
    for (let x = 0; x <= LIUYUAN_EAST_HALL_W; x++) {
      const open = x < LIUYUAN_EAST_HALL_W && inside(x*16+8,y*16+8,points);
      if (open && first < 0) first = x;
      if (!open && first >= 0) { result.push({ id: `${id}-${y}-${first}`, x:first,y,w:x-first,h:1,tile }); first = -1; }
    }
  }
  return result;
}
export const LIUYUAN_EAST_HALL_DRAFT_REGIONS: readonly FuxueTileRegion[] = [
  ...bands('east-hall-court', COURT, T.PATH),
  ...bands('east-hall-side-passage', EAST_PASSAGE, T.CORR),
];

export const LIUYUAN_EAST_HALL_GEOMETRY: readonly SceneGeometryObject[] = [
  { id: 'east-hall-left-tree-bed', colliders: [{ points: [[305,345],[690,340],[730,423],[685,480],[310,466]] }] },
  { id: 'east-hall-right-tree-bed', colliders: [{ points: [[1240,350],[1555,355],[1590,505],[1220,512]] }] },
  { id: 'east-hall-side-work-shelf', colliders: [{ x: 15, y: 270, w: 260, h: 120 }] },
  { id: 'east-hall-front-steps', colliders: [
    { x: 810, y: 315, w: 20, h: 78 }, { x: 1155, y: 315, w: 25, h: 80 },
  ] },
  { id: 'east-hall-left-crown', occluder: { id: 'east-hall-left-crown', depthY: 455,
    polygons: [[[315,70],[475,18],[680,10],[770,105],[765,280],[700,340],[575,305],[475,350],[350,300]]] } },
  { id: 'east-hall-right-crown', occluder: { id: 'east-hall-right-crown', depthY: 495,
    polygons: [[[1155,45],[1325,5],[1500,10],[1635,150],[1585,330],[1470,380],[1290,350],[1190,270]]] } },
  { id: 'east-hall-foreground-left-eave', occluder: { id: 'east-hall-foreground-left-eave', depthY: 895,
    polygons: [[[0,625],[220,615],[350,896],[0,896]]] } },
  { id: 'east-hall-foreground-right-eave', occluder: { id: 'east-hall-foreground-right-eave', depthY: 895,
    polygons: [[[1590,665],[1776,620],[1776,896],[1610,896]]] } },
];
export const LIUYUAN_EAST_HALL_OBSTACLES: readonly CollisionShape[] =
  LIUYUAN_EAST_HALL_GEOMETRY.flatMap((object) => object.colliders ?? []);

export function buildLiuyuanEastHallStudyMap(regions: readonly FuxueTileRegion[] = LIUYUAN_EAST_HALL_DRAFT_REGIONS) {
  const map = new Uint8Array(LIUYUAN_EAST_HALL_W*LIUYUAN_EAST_HALL_H);
  map.fill(T.WALL);
  for (const region of regions) for (let y=region.y; y<region.y+region.h; y++) for (let x=region.x; x<region.x+region.w; x++) {
    if (x>=0 && y>=0 && x<LIUYUAN_EAST_HALL_W && y<LIUYUAN_EAST_HALL_H) map[y*LIUYUAN_EAST_HALL_W+x]=region.tile;
  }
  return { map,w:LIUYUAN_EAST_HALL_W,h:LIUYUAN_EAST_HALL_H,
    spawn:{...LIUYUAN_EAST_HALL_SPAWN},obstacles:LIUYUAN_EAST_HALL_OBSTACLES };
}
