import type { CollisionProfile, CollisionShape } from './geometry.js';
import { collides } from './physics.js';
import type { SceneRouteGraph } from '../data/scene-plates.js';

export interface RouteGeometryFinding {
  from: string;
  to: string;
  state: 'candidate' | 'confirmed';
  blockedAt?: readonly [x: number, y: number];
  reason?: 'stairs';
}

/**
 * 每条连线是需要可站立的直线段；曲折巷道必须拆成多段路点。
 * 本检查只证明 Tile + 物件碰撞不阻挡人物脚点，不证明底图的历史门位或视觉遮挡正确。
 */
export function auditRouteGeometry(
  graph: SceneRouteGraph,
  map: Uint8Array,
  width: number,
  height: number,
  obstacles: readonly CollisionShape[],
  profile: CollisionProfile,
): { findings: RouteGeometryFinding[]; errors: string[] } {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const findings: RouteGeometryFinding[] = [];
  const errors: string[] = [];
  for (const edge of graph.edges) {
    if (edge.state === 'blocked') continue;
    const from = nodes.get(edge.from), to = nodes.get(edge.to);
    if (!from || !to) continue; // 端点缺失由 validateRouteGraph 负责。
    if (edge.via === 'stairs' || (from.level ?? 0) !== (to.level ?? 0)) {
      findings.push({ from: edge.from, to: edge.to, state: edge.state, reason: 'stairs' });
      // 平面碰撞无法验证跨层路，不能错误地宣称已核。
      if (edge.state === 'confirmed') errors.push(`${edge.from} → ${edge.to}: 跨层路线须单独实走验证`);
      continue;
    }
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(length / 4));
    let blockedAt: readonly [number, number] | undefined;
    for (let step = 0; step <= steps; step++) {
      const fraction = step / steps;
      const x = from.x + (to.x - from.x) * fraction;
      const y = from.y + (to.y - from.y) * fraction;
      if (collides(map, x, y, width, height, obstacles, profile)) {
        blockedAt = [Math.round(x), Math.round(y)];
        break;
      }
    }
    findings.push({ from: edge.from, to: edge.to, state: edge.state, blockedAt });
    if (blockedAt && edge.state === 'confirmed') {
      errors.push(`${edge.from} → ${edge.to}: 已确认路线在 (${blockedAt[0]}, ${blockedAt[1]}) 受阻`);
    }
  }
  return { findings, errors };
}
