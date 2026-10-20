import type { SceneRouteGraph, SceneStoryAnchor } from '../data/scene-plates.js';

/** Structural route audit only. It cannot prove that a line avoids a wall or pond in the art. */
export function validateRouteGraph(
  graph: SceneRouteGraph,
  anchors: readonly SceneStoryAnchor[],
  width: number,
  height: number,
): string[] {
  const errors: string[] = [];
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  if (nodes.size !== graph.nodes.length) errors.push('路线节点 ID 重复');
  const entries = graph.nodes.filter((node) => node.kind === 'entry');
  if (entries.length !== 1) errors.push('路线骨架必须恰有一个入口节点');
  const anchorById = new Map(anchors.map((anchor) => [anchor.id, anchor]));
  for (const node of graph.nodes) {
    if (!node.id.trim() || !node.label.trim()) errors.push('路线节点 ID 或名称为空');
    if (!Number.isFinite(node.x) || !Number.isFinite(node.y)
      || node.x < 0 || node.y < 0 || node.x > width || node.y > height) errors.push(`${node.id}: 节点越界`);
    if (!Number.isInteger(node.level ?? 0) || (node.level ?? 0) < 0 || (node.level ?? 0) > 4) {
      errors.push(`${node.id}: 路线层高必须是 0–4 的整数`);
    }
    if (node.anchorId) {
      const anchor = anchorById.get(node.anchorId);
      if (!anchor) errors.push(`${node.id}: 关联了不存在的剧本锚点`);
      else if (Math.hypot(node.x - anchor.x, node.y - anchor.y) > 32) {
        errors.push(`${node.id}: 与剧本锚点 ${node.anchorId} 相距超过 32px，请一同校准`);
      }
    }
  }
  const neighbor = new Map(graph.nodes.map((node) => [node.id, new Set<string>()]));
  const edgeIds = new Set<string>();
  for (const edge of graph.edges) {
    if (!nodes.has(edge.from) || !nodes.has(edge.to)) { errors.push(`${edge.from} → ${edge.to}: 端点不存在`); continue; }
    if (edge.from === edge.to) errors.push(`${edge.from}: 路线不能自连`);
    const from = nodes.get(edge.from)!, to = nodes.get(edge.to)!;
    if (edge.state !== 'blocked' && (from.level ?? 0) !== (to.level ?? 0) && edge.via !== 'stairs') {
      errors.push(`${edge.from} → ${edge.to}: 跨层只能通过楼梯/山径转换边`);
    }
    const key = [edge.from, edge.to].sort().join('|');
    if (edgeIds.has(key)) errors.push(`${edge.from} → ${edge.to}: 重复连线`);
    edgeIds.add(key);
    if (edge.state !== 'blocked') {
      neighbor.get(edge.from)?.add(edge.to);
      neighbor.get(edge.to)?.add(edge.from);
    }
  }
  if (entries.length === 1) {
    const seen = new Set<string>([entries[0].id]);
    const queue = [entries[0].id];
    for (let cursor = 0; cursor < queue.length; cursor++) {
      for (const next of neighbor.get(queue[cursor]) ?? []) {
        if (!seen.has(next)) { seen.add(next); queue.push(next); }
      }
    }
    for (const node of graph.nodes) {
      if (!seen.has(node.id)) errors.push(`${node.id}: 从入口不可达`);
    }
    for (const anchor of anchors) {
      if (anchor.kind === 'visual' || anchor.kind === 'boundary' || anchor.routeRequired === false) continue;
      if (!graph.nodes.some((node) => node.anchorId === anchor.id && seen.has(node.id))) {
        errors.push(`${anchor.id}: 剧本行动点没有可达路线节点`);
      }
    }
  }
  return errors;
}
