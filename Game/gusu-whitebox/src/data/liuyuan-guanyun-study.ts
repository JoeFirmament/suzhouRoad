import type { CollisionShape, SceneGeometryObject, WorldPoint } from '../core/geometry.js';
import type { FuxueTileRegion } from './fuxue.js';
import { T } from './tiles.js';

/** 冠云峰前院研究切片：图像坐标，不是留园实测总平面。 */
export const GUANYUN_ID = 'liuyuan-guanyun-court-study-v1';
export const GUANYUN_W = 96, GUANYUN_H = 64;
export const GUANYUN_WORLD_W = 1536, GUANYUN_WORLD_H = 1024;
export const GUANYUN_SPAWN = { x: 535, y: 904 } as const;
export const GUANYUN_VIEW = { x: 790, y: 856 } as const;
export const GUANYUN_LEFT = { x: 155, y: 725 } as const;
export const GUANYUN_RIGHT = { x: 1455, y: 726 } as const;

const POND: readonly WorldPoint[] = [[208,482],[330,448],[530,452],[665,475],[855,500],[1080,499],[1260,512],[1360,576],[1420,693],[1400,782],[1195,806],[940,780],[705,757],[480,737],[285,716],[153,652]];
const FRONT_PATH: readonly WorldPoint[] = [[50,744],[210,715],[380,752],[710,770],[1000,800],[1380,792],[1510,755],[1536,1024],[0,1024],[0,770]];
const LEFT_PATH: readonly WorldPoint[] = [[0,333],[115,348],[226,429],[216,580],[178,697],[245,761],[0,797]];
const RIGHT_PATH: readonly WorldPoint[] = [[1373,415],[1510,394],[1536,409],[1536,800],[1420,811],[1420,694]];

function inside(x: number, y: number, points: readonly WorldPoint[]): boolean {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
export function guanyunBands(id: string, points: readonly WorldPoint[], tile: number): FuxueTileRegion[] {
  const result: FuxueTileRegion[] = [];
  for (let y = 0; y < GUANYUN_H; y++) {
    let first = -1;
    for (let x = 0; x <= GUANYUN_W; x++) {
      const open = x < GUANYUN_W && inside(x * 16 + 8, y * 16 + 8, points);
      if (open && first < 0) first = x;
      if (!open && first >= 0) { result.push({ id: `${id}-${y}-${first}`, x: first, y, w: x - first, h: 1, tile }); first = -1; }
    }
  }
  return result;
}
export const GUANYUN_DRAFT_REGIONS: readonly FuxueTileRegion[] = [
  ...guanyunBands('guanyun-pond', POND, T.WATER),
  ...guanyunBands('guanyun-left', LEFT_PATH, T.PATH),
  ...guanyunBands('guanyun-right', RIGHT_PATH, T.PATH),
  ...guanyunBands('guanyun-front', FRONT_PATH, T.PATH),
];
export const GUANYUN_GEOMETRY: readonly SceneGeometryObject[] = [
  { id: 'guanyun-main-peak', colliders: [{ points: [[742,351],[809,337],[906,375],[955,457],[910,500],[768,493],[721,443]] }],
    occluder: { id: 'guanyun-peak-mask', depthY: 492, polygons: [[[766,38],[827,44],[864,89],[882,136],[920,325],[935,467],[905,500],[758,488],[726,421],[759,281]]] } },
  { id: 'guanyun-pond-bank', colliders: [{ points: [[270,690],[465,724],[682,744],[896,769],[1195,793],[1403,775],[1408,799],[1192,817],[891,789],[673,759],[459,741],[262,710]] }] },
  { id: 'guanyun-rear-hall', colliders: [{ x: 659, y: 140, w: 670, h: 225 }],
    occluder: { id: 'guanyun-hall-eaves', depthY: 351, polygons: [[[563,0],[1408,0],[1375,182],[645,206]]] } },
  { id: 'guanyun-left-foreground', occluder: { id: 'guanyun-left-foreground', depthY: 1005,
    polygons: [[[0,657],[146,650],[207,818],[365,931],[420,1024],[0,1024]]] } },
  { id: 'guanyun-right-foreground', occluder: { id: 'guanyun-right-foreground', depthY: 1012,
    polygons: [[[1400,829],[1536,749],[1536,1024],[1280,1024]]] } },
];
export const GUANYUN_OBSTACLES: readonly CollisionShape[] = GUANYUN_GEOMETRY.flatMap((object) => object.colliders ?? []);
export function buildGuanyunStudyMap(regions: readonly FuxueTileRegion[] = GUANYUN_DRAFT_REGIONS) {
  const map = new Uint8Array(GUANYUN_W * GUANYUN_H); map.fill(T.WALL);
  for (const region of regions) for (let y = region.y; y < region.y + region.h; y++)
    for (let x = region.x; x < region.x + region.w; x++)
      if (x >= 0 && y >= 0 && x < GUANYUN_W && y < GUANYUN_H) map[y * GUANYUN_W + x] = region.tile;
  return { map, w: GUANYUN_W, h: GUANYUN_H, spawn: { ...GUANYUN_SPAWN }, obstacles: GUANYUN_OBSTACLES };
}
