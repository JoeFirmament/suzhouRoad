import type { CollisionShape, SceneGeometryObject, WorldPoint } from '../core/geometry.js';
import type { FuxueTileRegion } from './fuxue.js';
import { T } from './tiles.js';

/** 绿荫轩临池的游戏视觉试切片；取现状空间关系，不是 1890 年测绘。 */
export const LIUYUAN_LVYIN_ID = 'liuyuan-lvyin-pond-study-v1';
export const LIUYUAN_LVYIN_W = 111;
export const LIUYUAN_LVYIN_H = 56;
export const LIUYUAN_LVYIN_WORLD_W = LIUYUAN_LVYIN_W * 16;
export const LIUYUAN_LVYIN_WORLD_H = LIUYUAN_LVYIN_H * 16;
export const LIUYUAN_LVYIN_SPAWN = { x: 1660, y: 740 } as const;
export const LIUYUAN_LVYIN_BANK_FOOT = { x: 930, y: 690 } as const;
export const LIUYUAN_LVYIN_PAVILION_FOOT = { x: 250, y: 470 } as const;
/** 池边不能被新遮挡物/Tile 封断；角色要能往返岸边、轩内与小庭接口。 */
export const LIUYUAN_LVYIN_REQUIRED_FEET = [
  { id: '小庭接入', ...LIUYUAN_LVYIN_SPAWN, radius: 24, mustStand: true },
  { id: '临池停步', ...LIUYUAN_LVYIN_BANK_FOOT, radius: 75 },
  { id: '轩内转场', ...LIUYUAN_LVYIN_PAVILION_FOOT, radius: 65, mustStand: true },
] as const;

// 先让不可走地面可读，再由连贯铺地覆盖；所有点都在图片的统一世界坐标内。
const POND: readonly WorldPoint[] = [
  [255, 95], [700, 65], [1120, 165], [1370, 280], [1320, 535],
  [1120, 560], [790, 490], [495, 440], [275, 350],
];
const BANK_FLOOR: readonly WorldPoint[] = [
  [465, 555], [1010, 585], [1235, 625], [1560, 595], [1776, 650],
  [1776, 896], [1120, 896], [1040, 780], [710, 790], [430, 725], [380, 620],
];
const PAVILION_FLOOR: readonly WorldPoint[] = [
  [40, 345], [345, 345], [440, 460], [395, 545], [190, 555], [40, 510],
];
const PAVILION_STEPS: readonly WorldPoint[] = [
  [280, 490], [430, 480], [560, 620], [485, 675], [335, 575],
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
  for (let y = 0; y < LIUYUAN_LVYIN_H; y++) {
    let start = -1;
    for (let x = 0; x <= LIUYUAN_LVYIN_W; x++) {
      const open = x < LIUYUAN_LVYIN_W && insidePolygon(x * 16 + 8, y * 16 + 8, polygon);
      if (open && start < 0) start = x;
      if (!open && start >= 0) {
        output.push({ id: `${id}-${y}-${start}`, x: start, y, w: x - start, h: 1, tile });
        start = -1;
      }
    }
  }
  return output;
}

export const LIUYUAN_LVYIN_DRAFT_REGIONS: readonly FuxueTileRegion[] = [
  ...bands('central-pond', POND, T.WATER),
  ...bands('pond-bank-paving', BANK_FLOOR, T.PATH),
  ...bands('pavilion-floor', PAVILION_FLOOR, T.CORR),
  ...bands('pavilion-steps', PAVILION_STEPS, T.PLAT),
];

export const LIUYUAN_LVYIN_GEOMETRY: readonly SceneGeometryObject[] = [
  {
    id: 'lvyin-waterfront-railing',
    // 每段是凸四边形，避免把折线整段交给只支持凸形 SAT 的碰撞器。
    colliders: [
      { points: [[455, 423], [680, 432], [650, 495], [455, 480]] },
      { points: [[680, 432], [930, 503], [900, 570], [650, 495]] },
      { points: [[930, 503], [1235, 548], [1235, 605], [900, 570]] },
    ],
  },
  {
    id: 'lvyin-east-planting-bed',
    colliders: [{ points: [[1250, 425], [1570, 455], [1580, 610], [1265, 610]] }],
  },
  {
    id: 'lvyin-right-wall',
    colliders: [{ x: 1680, y: 150, w: 96, h: 495 }],
  },
  {
    id: 'lvyin-pavilion-front-posts',
    colliders: [{ x: 102, y: 440, w: 22, h: 70 }, { x: 360, y: 420, w: 24, h: 80 }],
    occluder: {
      id: 'lvyin-pavilion-front-posts', depthY: 505,
      polygons: [
        [[85, 260], [132, 260], [130, 510], [98, 510]],
        [[347, 260], [396, 260], [391, 510], [355, 510]],
      ],
    },
  },
  {
    id: 'lvyin-foreground-roof',
    occluder: {
      id: 'lvyin-foreground-roof', depthY: 825,
      polygons: [[[0, 696], [380, 705], [560, 790], [560, 896], [0, 896]]],
    },
  },
];

export const LIUYUAN_LVYIN_OBSTACLES: readonly CollisionShape[] =
  LIUYUAN_LVYIN_GEOMETRY.flatMap((object) => object.colliders ?? []);

export function buildLiuyuanLvyinStudyMap(regions: readonly FuxueTileRegion[] = LIUYUAN_LVYIN_DRAFT_REGIONS) {
  const map = new Uint8Array(LIUYUAN_LVYIN_W * LIUYUAN_LVYIN_H);
  map.fill(T.WALL);
  for (const region of regions) {
    for (let y = region.y; y < region.y + region.h; y++) for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_LVYIN_W && y < LIUYUAN_LVYIN_H) {
        map[y * LIUYUAN_LVYIN_W + x] = region.tile;
      }
    }
  }
  return {
    map, w: LIUYUAN_LVYIN_W, h: LIUYUAN_LVYIN_H,
    spawn: { ...LIUYUAN_LVYIN_SPAWN }, obstacles: LIUYUAN_LVYIN_OBSTACLES,
  };
}
