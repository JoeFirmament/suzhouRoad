import type { SceneEffectRegion } from '../core/geometry.js';
import type { Ctx } from './pixel.js';

/**
 * 数据驱动的水波：算法不知道池塘形状，只在场景提供的多边形蒙版内绘制。
 * 使用世界坐标生成波纹，相机只影响最后落点，因此镜头移动不会造成水纹漂移。
 */
export function drawWaterRipples(
  g: Ctx,
  regions: readonly SceneEffectRegion[],
  cam: { x: number; y: number },
  now: number,
): void {
  for (const effect of regions) {
    if (effect.kind !== 'water-ripple') continue;
    const allPoints = effect.polygons.flat();
    if (!allPoints.length) continue;
    const minX = Math.min(...allPoints.map(([x]) => x));
    const maxX = Math.max(...allPoints.map(([x]) => x));
    const minY = Math.min(...allPoints.map(([, y]) => y));
    const maxY = Math.max(...allPoints.map(([, y]) => y));
    const style = effect.ripple;
    const phase = Math.floor(now / style.speedMs);

    g.save();
    g.beginPath();
    for (const polygon of [...effect.polygons, ...(effect.holes ?? [])]) {
      polygon.forEach(([x, y], index) => index === 0
        ? g.moveTo(Math.round(x - cam.x), Math.round(y - cam.y))
        : g.lineTo(Math.round(x - cam.x), Math.round(y - cam.y)));
      g.closePath();
    }
    g.clip('evenodd');
    g.fillStyle = style.color;
    for (let yy = minY + (phase % 3) * 3; yy <= maxY; yy += style.rowSpacing) {
      const row = Math.floor(yy / style.rowSpacing);
      const shift = ((row * 17 + phase * 5) % style.segmentSpacing + style.segmentSpacing) % style.segmentSpacing;
      for (let xx = minX - style.segmentSpacing + shift; xx <= maxX; xx += style.segmentSpacing) {
        const span = style.maxLength - style.minLength + 1;
        const length = style.minLength + Math.abs((row * 11 + Math.floor(xx) * 3) % span);
        g.fillRect(Math.round(xx - cam.x), Math.round(yy - cam.y), length, 1);
      }
    }
    g.restore();
  }
}
