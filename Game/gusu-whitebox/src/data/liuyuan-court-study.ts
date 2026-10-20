import type { CollisionShape, SceneGeometryObject, WorldPoint } from '../core/geometry.js';
import type { FuxueTileRegion } from './fuxue.js';
import { T } from './tiles.js';

/** 与无水小庭图共用世界坐标；仍是待实景校准的游戏切片，不是 1890 测绘。 */
export const LIUYUAN_COURT_W = 111;
export const LIUYUAN_COURT_H = 56;
export const LIUYUAN_COURT_WORLD_W = LIUYUAN_COURT_W * 16;
export const LIUYUAN_COURT_WORLD_H = LIUYUAN_COURT_H * 16;
export const LIUYUAN_COURT_SPAWN = { x: 1600, y: 680 } as const;
export const LIUYUAN_COURT_WINDOW_FOOT = { x: 1160, y: 615 } as const;
export const LIUYUAN_COURT_WEST_EXIT = { x: 330, y: 305 } as const;
/** 剧情观察点与正返转场须同时连通；编辑器草稿只读预览时据此防断路。 */
export const LIUYUAN_COURT_REQUIRED_FEET = [
  { id: '小庭入口', ...LIUYUAN_COURT_SPAWN, radius: 20, mustStand: true },
  { id: '六窗观察位', ...LIUYUAN_COURT_WINDOW_FOOT, radius: 60 },
  { id: '绿荫轩转场', ...LIUYUAN_COURT_WEST_EXIT, radius: 26, mustStand: true },
] as const;

// 由图面可辨的铺地内缘收缩而来；屋顶和树冠绝不被当作可走地面。
const COURT_FLOOR: readonly WorldPoint[] = [
  [550, 575], [1776, 575], [1776, 742], [1020, 742], [760, 698], [550, 630],
];
const COURT_TO_PASSAGE: readonly WorldPoint[] = [
  [355, 515], [555, 540], [760, 620], [760, 698], [550, 630], [355, 570],
];
const WEST_PASSAGE: readonly WorldPoint[] = [
  [265, 245], [385, 245], [435, 350], [460, 455], [490, 525],
  [355, 570], [230, 515], [235, 350],
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
  for (let y = 0; y < LIUYUAN_COURT_H; y++) {
    let start = -1;
    for (let x = 0; x <= LIUYUAN_COURT_W; x++) {
      const open = x < LIUYUAN_COURT_W && insidePolygon(x * 16 + 8, y * 16 + 8, polygon);
      if (open && start < 0) start = x;
      if (!open && start >= 0) {
        output.push({ id: `${id}-${y}-${start}`, x: start, y, w: x - start, h: 1, tile });
        start = -1;
      }
    }
  }
  return output;
}

/** 每条扫描带都可在编辑器里拖动；比把整张图直接判为地面安全。 */
export const LIUYUAN_COURT_DRAFT_REGIONS: readonly FuxueTileRegion[] = [
  ...bands('court-paving', COURT_FLOOR, T.PATH),
  ...bands('court-west-turn', COURT_TO_PASSAGE, T.PATH),
  ...bands('west-narrow-passage', WEST_PASSAGE, T.CORR),
];

export const LIUYUAN_COURT_GEOMETRY: readonly SceneGeometryObject[] = [
  {
    id: 'liuyuan-six-window-north-wall',
    // 漏窗是墙中取景口，不是角色通行门。Tile 已封墙；物件便于在编辑器单独校准。
    colliders: [{ x: 580, y: 250, w: 1060, h: 250 }],
  },
  {
    id: 'liuyuan-court-raised-bed',
    colliders: [{ x: 905, y: 445, w: 605, h: 128 }],
  },
  {
    id: 'liuyuan-court-front-eave',
    // 屋檐只作前景遮挡；屋顶下方的地面由 Tile 单独封住。
    occluder: {
      id: 'liuyuan-court-front-eave', depthY: 790,
      polygons: [[
        [0, 580], [190, 600], [420, 650], [680, 695], [940, 750],
        [1180, 790], [1180, 896], [0, 896],
      ]],
    },
  },
  {
    id: 'liuyuan-court-east-eave',
    occluder: {
      id: 'liuyuan-court-east-eave', depthY: 790,
      polygons: [[[1580, 760], [1776, 735], [1776, 896], [1580, 896]]],
    },
  },
];

export const LIUYUAN_COURT_OBSTACLES: readonly CollisionShape[] =
  LIUYUAN_COURT_GEOMETRY.flatMap((object) => object.colliders ?? []);

export function buildLiuyuanCourtStudyMap(regions: readonly FuxueTileRegion[] = LIUYUAN_COURT_DRAFT_REGIONS) {
  const map = new Uint8Array(LIUYUAN_COURT_W * LIUYUAN_COURT_H);
  map.fill(T.WALL);
  for (const region of regions) {
    for (let y = region.y; y < region.y + region.h; y++) for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= 0 && y >= 0 && x < LIUYUAN_COURT_W && y < LIUYUAN_COURT_H) {
        map[y * LIUYUAN_COURT_W + x] = region.tile;
      }
    }
  }
  return {
    map, w: LIUYUAN_COURT_W, h: LIUYUAN_COURT_H,
    spawn: { ...LIUYUAN_COURT_SPAWN }, obstacles: LIUYUAN_COURT_OBSTACLES,
  };
}
