import type { DepthLayer } from '../core/geometry.js';
export type { DepthLayer, DepthOccluder, WorldPoint } from '../core/geometry.js';

/**
 * 2.5D 画家算法：北侧（较小 y）先画，南侧（较大 y）后画。
 * 人物使用脚点 y，建筑使用落地线 y；order 保证同一深度时结果稳定。
 */
export function compareDepthLayers(a: DepthLayer, b: DepthLayer): number {
  return a.depthY - b.depthY || a.order - b.order;
}
