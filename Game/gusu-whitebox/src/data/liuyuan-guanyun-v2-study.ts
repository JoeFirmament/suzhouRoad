import type { CollisionShape, SceneGeometryObject, WorldPoint } from '../core/geometry.js';
import type { FuxueTileRegion } from './fuxue.js';
import { T } from './tiles.js';
import { guanyunBands } from './liuyuan-guanyun-study.js';

/** 南厅—沼—峰—北楼的图面试走；所有坐标仅用于 v2 图像标定，四者同年存在尚未逐物核准。 */
export const GUANYUN_V2_ID = 'liuyuan-guanyun-court-study-v2';
export const GUANYUN_V2_W = 96, GUANYUN_V2_H = 64;
export const GUANYUN_V2_WORLD_W = 1536, GUANYUN_V2_WORLD_H = 1024;
export const GUANYUN_V2_SPAWN = { x: 757, y: 941 } as const;
export const GUANYUN_V2_VIEW = { x: 758, y: 638 } as const;
export const GUANYUN_V2_LEFT = { x: 361, y: 414 } as const;
export const GUANYUN_V2_RIGHT = { x: 1180, y: 405 } as const;
const POND: readonly WorldPoint[] = [[441,452],[593,430],[830,429],[1016,436],[1128,476],[1139,573],[1051,599],[747,609],[485,591],[419,540]];
const SOUTH_PASSAGE: readonly WorldPoint[] = [[643,1024],[872,1024],[869,694],[638,694]];
const SOUTH_TERRACE: readonly WorldPoint[] = [[335,615],[1192,615],[1230,720],[322,720]];
const WEST_BANK: readonly WorldPoint[] = [[314,277],[455,278],[468,449],[405,604],[317,658],[288,489]];
const EAST_BANK: readonly WorldPoint[] = [[1104,281],[1259,269],[1275,520],[1210,663],[1108,597]];
const NORTH_COURT: readonly WorldPoint[] = [[364,251],[1165,250],[1214,443],[1112,449],[970,419],[849,414],[645,411],[458,447],[353,419]];
export const GUANYUN_V2_DRAFT_REGIONS: readonly FuxueTileRegion[] = [
  ...guanyunBands('guanyun-v2-north', NORTH_COURT, T.PATH),
  ...guanyunBands('guanyun-v2-west', WEST_BANK, T.PATH),
  ...guanyunBands('guanyun-v2-east', EAST_BANK, T.PATH),
  ...guanyunBands('guanyun-v2-terrace', SOUTH_TERRACE, T.PATH),
  ...guanyunBands('guanyun-v2-hall-passage', SOUTH_PASSAGE, T.CORR),
  ...guanyunBands('guanyun-v2-pond', POND, T.WATER),
];
export const GUANYUN_V2_GEOMETRY: readonly SceneGeometryObject[] = [
  { id: 'guanyun-v2-huanyun-pond', effects: [{
    id: 'guanyun-v2-huanyun-ripples', kind: 'water-ripple',
    // 比 Tile 水面向内收，避开岸石、峰影与台前石栏；仍待逐像素人工核图。
    polygons: [[[510,491],[620,478],[909,478],[1034,484],[1061,510],[1031,552],[910,574],[640,570],[524,545],[500,516]]],
    ripple: { color: 'rgba(198, 214, 197, .14)', rowSpacing: 20, segmentSpacing: 64,
      minLength: 5, maxLength: 15, speedMs: 620 },
  }] },
  { id: 'guanyun-v2-peak-bed', colliders: [{ points: [[670,321],[703,286],[851,286],[886,333],[857,393],[688,395]] }],
    occluder: { id: 'guanyun-v2-peak-mask', depthY: 386,
      polygons: [[[734,64],[791,65],[835,122],[851,193],[875,350],[850,395],[695,396],[675,349],[718,222]]] } },
  { id: 'guanyun-v2-pond-south-rail', colliders: [
    { points: [[492,579],[630,592],[628,608],[487,600]] },
    { points: [[630,592],[790,595],[778,610],[628,608]] },
    { points: [[790,595],[954,592],[962,609],[778,610]] },
    { points: [[954,592],[1088,573],[1102,597],[962,609]] },
  ] },
  { id: 'guanyun-v2-north-building', colliders: [{ x: 564, y: 70, w: 431, h: 166 }],
    occluder: { id: 'guanyun-v2-north-eave', depthY: 232, polygons: [[[553,0],[1045,0],[1027,222],[563,226]]] } },
  { id: 'guanyun-v2-south-hall-west-post', colliders: [{ x: 635, y: 857, w: 23, h: 69 }] },
  { id: 'guanyun-v2-south-hall-east-post', colliders: [{ x: 861, y: 857, w: 23, h: 69 }] },
  // 屋顶的绘制深度取厅柱落脚线，不取檐口最低像素；人物从厅下穿过时上半身仍在檐后。
  { id: 'guanyun-v2-south-hall-roof', occluder: { id: 'guanyun-v2-south-hall-roof', depthY: 926,
    polygons: [[[241,690],[1295,689],[1285,854],[249,855]]] } },
  { id: 'guanyun-v2-west-pavilion-roof', occluder: { id: 'guanyun-v2-west-pavilion-roof', depthY: 480,
    polygons: [[[0,272],[335,265],[376,375],[10,394]]] } },
  { id: 'guanyun-v2-east-pavilion-roof', occluder: { id: 'guanyun-v2-east-pavilion-roof', depthY: 450,
    polygons: [[[1200,184],[1536,210],[1536,412],[1232,393]]] } },
];
export const GUANYUN_V2_OBSTACLES: readonly CollisionShape[] = GUANYUN_V2_GEOMETRY.flatMap((object) => object.colliders ?? []);
export function buildGuanyunV2Map(regions: readonly FuxueTileRegion[] = GUANYUN_V2_DRAFT_REGIONS) {
  const map = new Uint8Array(GUANYUN_V2_W * GUANYUN_V2_H); map.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++)
    for (let x = region.x; x < region.x + region.w; x++)
      if (x >= 0 && y >= 0 && x < GUANYUN_V2_W && y < GUANYUN_V2_H) map[y * GUANYUN_V2_W + x] = region.tile;
  return { map, w: GUANYUN_V2_W, h: GUANYUN_V2_H,
    spawn: { ...GUANYUN_V2_SPAWN }, obstacles: GUANYUN_V2_OBSTACLES };
}
