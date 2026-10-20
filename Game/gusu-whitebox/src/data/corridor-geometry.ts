import type { SceneEffectRegion, SceneGeometryObject } from '../core/geometry.js';

export type CorridorPoint = { x: number; y: number };
export type CorridorWindowSpot = {
  t: number;
  verb: '看' | '对' | '合';
  instruction: string;
  line: string;
  frame: { x: number; y: number; w: number; h: number };
};

/** 复廊近景属于受约束路径场景，脚点沿中心线移动，lane 只允许廊内横向微调。 */
export const CORRIDOR_ROUTE: readonly CorridorPoint[] = [
  { x: 62, y: 278 }, { x: 178, y: 274 }, { x: 316, y: 274 },
  { x: 470, y: 277 }, { x: 610, y: 284 }, { x: 738, y: 279 },
];

export const CORRIDOR_LANE = { min: -5, max: 6 } as const;

export const CORRIDOR_SPOTS: readonly CorridorWindowSpot[] = [
  { t: .135, verb: '看', instruction: '走到第一扇花窗前，按 E 取景', line: '窗不动，景会变。', frame: { x: 131, y: 205, w: 43, h: 36 } },
  { t: .373, verb: '对', instruction: '沿廊向东，找到窗纹与山石相对的位置', line: '古人凿窗时，早把外面的景算好了。', frame: { x: 291, y: 213, w: 45, h: 33 } },
  { t: .632, verb: '合', instruction: '继续移步，在第三扇窗前停下', line: '合上了。九园的窗，合的都是这一下。', frame: { x: 467, y: 217, w: 42, h: 35 } },
];

/** 水面内缘与两侧前景扣除区，坐标对应 793×496 逻辑画布。 */
export const CORRIDOR_WATER_EDGE: readonly (readonly [number, number])[] = [
  [0, 302], [72, 307], [160, 304], [238, 310], [330, 307], [421, 314],
  [507, 311], [595, 309], [690, 306], [793, 297],
];

export function corridorWaterEdgeY(x: number): number {
  if (x <= CORRIDOR_WATER_EDGE[0][0]) return CORRIDOR_WATER_EDGE[0][1];
  for (let i = 1; i < CORRIDOR_WATER_EDGE.length; i++) {
    const [rightX, rightY] = CORRIDOR_WATER_EDGE[i];
    if (x <= rightX) {
      const [leftX, leftY] = CORRIDOR_WATER_EDGE[i - 1];
      return leftY + (rightY - leftY) * (x - leftX) / (rightX - leftX);
    }
  }
  return CORRIDOR_WATER_EDGE[CORRIDOR_WATER_EDGE.length - 1][1];
}

export const CORRIDOR_EFFECTS: readonly SceneEffectRegion[] = [{
  id: 'corridor-water-ripple',
  kind: 'water-ripple',
  polygons: [[...CORRIDOR_WATER_EDGE, [793, 496], [0, 496]]],
  holes: [
    [[0, 302], [75, 307], [107, 326], [121, 361], [151, 389], [169, 437], [190, 496], [0, 496]],
    [[690, 306], [731, 320], [758, 350], [793, 361], [793, 496], [699, 496], [691, 444], [679, 402]],
  ],
  ripple: {
    color: 'rgba(192, 224, 196, .12)',
    rowSpacing: 9,
    segmentSpacing: 71,
    minLength: 8,
    maxLength: 33,
    speedMs: 360,
  },
}];

/** 近侧柱的初始裁片。只是编辑器起点；精确轮廓由玩家在统一场景编辑器中标定。 */
export const CORRIDOR_POST_OCCLUDERS: readonly SceneGeometryObject[] =
  [82, 213, 304, 391, 474, 558, 641, 705].map((x, index) => {
    const id = `corridor-post-${String(index + 1).padStart(2, '0')}`;
    return { id, occluder: { id, depthY: 287,
      polygons: [[[x - 4, 186], [x + 5, 186], [x + 5, 287], [x - 4, 287]]] } };
  });

export function validateCorridorGeometry(): string[] {
  const errors: string[] = [];
  for (const object of CORRIDOR_POST_OCCLUDERS) {
    if (!object.occluder || object.occluder.depthY < 0 || object.occluder.depthY > 496) {
      errors.push(`${object.id}: 遮挡深度线无效`);
      continue;
    }
    for (const polygon of object.occluder.polygons) {
      if (polygon.length < 3 || polygon.some(([x, y]) => x < 0 || y < 0 || x > 793 || y > 496)) {
        errors.push(`${object.id}: 遮挡裁片越出画布或点数不足`);
      }
    }
  }
  if (CORRIDOR_WATER_EDGE[0][0] !== 0 || CORRIDOR_WATER_EDGE[CORRIDOR_WATER_EDGE.length - 1][0] !== 793
    || CORRIDOR_WATER_EDGE.some(([x], index) => index > 0 && x <= CORRIDOR_WATER_EDGE[index - 1][0])) {
    errors.push('corridor.waterEdge: 水岸线须从 0 到 793 且 x 严格递增');
  }
  if (CORRIDOR_ROUTE.length < 2) errors.push('corridor: 路径至少需要两个点');
  for (let index = 0; index < CORRIDOR_ROUTE.length - 1; index++) {
    const a = CORRIDOR_ROUTE[index], b = CORRIDOR_ROUTE[index + 1];
    if (Math.hypot(b.x - a.x, b.y - a.y) <= 0) errors.push(`corridor.route[${index}]: 相邻点重合`);
  }
  let previous = -Infinity;
  for (const [index, spot] of CORRIDOR_SPOTS.entries()) {
    if (spot.t <= 0 || spot.t >= 1) errors.push(`corridor.spot[${index}]: t 必须位于 (0, 1)`);
    if (spot.t <= previous) errors.push(`corridor.spot[${index}]: 任务顺序必须沿路径递增`);
    if (spot.frame.w <= 0 || spot.frame.h <= 0 || spot.frame.x < 0 || spot.frame.y < 0
      || spot.frame.x + spot.frame.w > 793 || spot.frame.y + spot.frame.h > 496) {
      errors.push(`corridor.spot[${index}]: 窗框越出逻辑画布`);
    }
    previous = spot.t;
  }
  if (CORRIDOR_LANE.min >= CORRIDOR_LANE.max) errors.push('corridor: lane 范围无效');
  for (const effect of CORRIDOR_EFFECTS) {
    const polygons = [...effect.polygons, ...(effect.holes ?? [])];
    for (const [index, polygon] of polygons.entries()) {
      if (polygon.length < 3) errors.push(`${effect.id}.polygon[${index}]: 至少需要三个点`);
      for (const [x, y] of polygon) {
        if (x < 0 || y < 0 || x > 793 || y > 496) {
          errors.push(`${effect.id}.polygon[${index}]: 点 (${x}, ${y}) 超出逻辑画布`);
        }
      }
    }
    const style = effect.ripple;
    if (style.rowSpacing <= 0 || style.segmentSpacing <= 0 || style.minLength <= 0
      || style.maxLength < style.minLength || style.speedMs <= 0) {
      errors.push(`${effect.id}: 波纹参数无效`);
    }
  }
  return errors;
}
