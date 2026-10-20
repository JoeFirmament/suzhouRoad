import type { FuxueTileRegion } from './fuxue.js';
import type { CollisionShape, SceneGeometryObject } from '../core/geometry.js';
import { T } from './tiles.js';

/** 只覆盖艺圃 v3 的延光阁局部；未覆盖的全园地面仍不可走。 */
export const YIPU_YANGUANGGE_W = 74;
export const YIPU_YANGUANGGE_H = 83;
export const YIPU_YANGUANGGE_SPAWN = { x: 560, y: 520 } as const;

/** 编辑器标定种子：阁内可走、东端可接入；池心作为不可走水体。 */
export const YIPU_YANGUANGGE_DRAFT_REGIONS: readonly FuxueTileRegion[] = [
  { id: 'yanguangge-east-connection', x: 33, y: 31, w: 5, h: 4, tile: T.CORR },
  { id: 'yanguangge-five-bay-floor', x: 17, y: 31, w: 17, h: 3, tile: T.CORR },
  { id: 'yanguangge-pond-core', x: 18, y: 35, w: 14, h: 13, tile: T.WATER },
];

/** v3 图上局部首轮贴边。精确柱脚和屋檐轮廓仍须在编辑器中逐点复核。 */
export const YIPU_YANGUANGGE_GEOMETRY: readonly SceneGeometryObject[] = [
  {
    id: 'yanguangge-eave',
    occluder: {
      id: 'yanguangge-eave', depthY: 538,
      polygons: [[
        [250, 467], [263, 451], [280, 443], [519, 443], [539, 452],
        [555, 472], [545, 492], [258, 492], [248, 479],
      ]],
    },
  },
  {
    id: 'yanguangge-front-rail',
    colliders: [{ points: [[270, 540], [533, 540], [535, 553], [270, 553]] }],
    occluder: {
      id: 'yanguangge-front-rail', depthY: 553,
      polygons: [[[269, 526], [535, 526], [536, 552], [269, 552]]],
    },
  },
  {
    id: 'yanguangge-front-posts',
    colliders: [
      { x: 275, y: 535, w: 7, h: 17 },
      { x: 327, y: 535, w: 7, h: 17 },
      { x: 379, y: 535, w: 7, h: 17 },
      { x: 431, y: 535, w: 7, h: 17 },
      { x: 483, y: 535, w: 7, h: 17 },
      { x: 526, y: 535, w: 7, h: 17 },
    ],
    occluder: {
      id: 'yanguangge-front-posts', depthY: 552,
      polygons: [
        [[275, 486], [282, 486], [282, 552], [275, 552]],
        [[327, 486], [334, 486], [334, 552], [327, 552]],
        [[379, 486], [386, 486], [386, 552], [379, 552]],
        [[431, 486], [438, 486], [438, 552], [431, 552]],
        [[483, 486], [490, 486], [490, 552], [483, 552]],
        [[526, 486], [533, 486], [533, 552], [526, 552]],
      ],
    },
  },
  {
    id: 'yanguangge-east-door',
    // 上下两段门框留出 y=505–535 的穿行口，不用一块墙封死东端。
    colliders: [
      { x: 536, y: 491, w: 12, h: 14 },
      { x: 536, y: 535, w: 12, h: 17 },
    ],
    occluder: {
      id: 'yanguangge-east-door', depthY: 552,
      polygons: [
        [[536, 479], [548, 479], [548, 505], [536, 505]],
        [[536, 535], [548, 535], [548, 552], [536, 552]],
      ],
    },
  },
  {
    id: 'yipu-square-pond',
    effects: [{
      id: 'yipu-square-pond-ripple',
      kind: 'water-ripple',
      // v3 底图的池水内缘初稿：离开延光阁前栏、岸石和东南乳鱼亭一段安全距离。
      // 水边尚未逐像素验收；在编辑器拖动顶点时，只修改这个物件，不改廊面通行区。
      polygons: [[
        [264, 559], [508, 559], [530, 572], [534, 612], [519, 650],
        [536, 682], [537, 731], [516, 758], [496, 775], [494, 817],
        [476, 852], [448, 871], [420, 864], [396, 848], [365, 846],
        [347, 825], [318, 820], [293, 795], [275, 765], [264, 729],
        [272, 687], [259, 652], [260, 605],
      ]],
      holes: [
        // 池中石簇：水纹不能跨到石头表面。
        [[372, 699], [408, 693], [433, 712], [444, 737], [419, 752], [390, 748], [372, 732]],
        // 西南岸的探入石阶与植栽。
        [[270, 764], [303, 777], [326, 805], [351, 815], [359, 844], [321, 847], [291, 814]],
      ],
      ripple: {
        color: 'rgba(178, 195, 180, .16)',
        rowSpacing: 20,
        segmentSpacing: 62,
        minLength: 5,
        maxLength: 13,
        speedMs: 610,
      },
    }],
  },
];

export const YIPU_YANGUANGGE_OBSTACLES: readonly CollisionShape[] =
  YIPU_YANGUANGGE_GEOMETRY.flatMap((object) => object.colliders ?? []);

export function validateYipuYanguanggeGeometry(): string[] {
  const errors: string[] = [];
  for (const object of YIPU_YANGUANGGE_GEOMETRY) {
    for (const [index, shape] of (object.colliders ?? []).entries()) {
      const points = 'x' in shape
        ? [[shape.x, shape.y], [shape.x + shape.w, shape.y + shape.h]]
        : shape.points;
      if ('x' in shape && (shape.w <= 0 || shape.h <= 0)) errors.push(`${object.id}.collider[${index}]: 非正尺寸`);
      if (points.length < 2) errors.push(`${object.id}.collider[${index}]: 点不足`);
      for (const [x, y] of points) if (x < 0 || y < 0 || x > 1184 || y > 1328) {
        errors.push(`${object.id}.collider[${index}]: 越界`);
      }
    }
    for (const effect of object.effects ?? []) {
      if (effect.polygons.length === 0) errors.push(`${object.id}.${effect.id}: 水面区域为空`);
      const style = effect.ripple;
      if (style.rowSpacing <= 0 || style.segmentSpacing <= 0 || style.minLength <= 0
        || style.maxLength < style.minLength || style.speedMs <= 0) {
        errors.push(`${object.id}.${effect.id}: 波纹参数无效`);
      }
      for (const [kind, polygons] of [['polygon', effect.polygons], ['hole', effect.holes ?? []]] as const) {
        for (const [index, polygon] of polygons.entries()) {
          if (polygon.length < 3) errors.push(`${object.id}.${effect.id}.${kind}[${index}]: 点不足`);
          for (const [x, y] of polygon) if (x < 0 || y < 0 || x > 1184 || y > 1328) {
            errors.push(`${object.id}.${effect.id}.${kind}[${index}]: 越界`);
          }
        }
      }
    }
    const occluder = object.occluder;
    if (!occluder) continue;
    if (occluder.id !== object.id) errors.push(`${object.id}: 遮挡 ID 不一致`);
    if (occluder.depthY < 0 || occluder.depthY > 1328) errors.push(`${object.id}: 落地线越界`);
    for (const [index, polygon] of occluder.polygons.entries()) {
      if (polygon.length < 3) errors.push(`${object.id}.occluder[${index}]: 点不足`);
      for (const [x, y] of polygon) if (x < 0 || y < 0 || x > 1184 || y > 1328) {
        errors.push(`${object.id}.occluder[${index}]: 越界`);
      }
    }
  }
  return errors;
}

export function buildYipuYanguanggeStudyMap(regions: readonly FuxueTileRegion[] = YIPU_YANGUANGGE_DRAFT_REGIONS) {
  const map = new Uint8Array(YIPU_YANGUANGGE_W * YIPU_YANGUANGGE_H);
  map.fill(T.WALL);
  for (const region of regions) {
    for (let y = region.y; y < region.y + region.h; y++) {
      for (let x = region.x; x < region.x + region.w; x++) {
        if (x >= 0 && y >= 0 && x < YIPU_YANGUANGGE_W && y < YIPU_YANGUANGGE_H) {
          map[y * YIPU_YANGUANGGE_W + x] = region.tile;
        }
      }
    }
  }
  return {
    map, w: YIPU_YANGUANGGE_W, h: YIPU_YANGUANGGE_H,
    spawn: { ...YIPU_YANGUANGGE_SPAWN }, obstacles: YIPU_YANGUANGGE_OBSTACLES,
  };
}
