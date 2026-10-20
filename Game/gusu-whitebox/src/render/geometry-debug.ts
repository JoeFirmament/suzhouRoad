import { TILE } from '../config.js';
import type { CollisionProfile, CollisionShape } from '../core/geometry.js';
import type { SceneLandmark } from '../data/mapgen.js';
import { SOLID } from '../data/tiles.js';
import type { Ctx } from './pixel.js';

/** 通用 Tile 场景调试层；必须在与人物相同的世界变换内绘制。 */
export function drawTileGeometryDebug(
  g: Ctx,
  scene: { map: Uint8Array; w: number; h: number; obstacles?: readonly CollisionShape[] },
  cam: { x: number; y: number },
  view: { w: number; h: number },
  actor: { x: number; y: number },
  profile: CollisionProfile,
): void {
  const tx0 = Math.max(0, Math.floor(cam.x / TILE) - 1);
  const ty0 = Math.max(0, Math.floor(cam.y / TILE) - 1);
  const tx1 = Math.min(scene.w - 1, Math.ceil((cam.x + view.w) / TILE) + 1);
  const ty1 = Math.min(scene.h - 1, Math.ceil((cam.y + view.h) / TILE) + 1);

  g.save();
  g.lineWidth = 1;
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    if (!SOLID.has(scene.map[ty * scene.w + tx])) continue;
    const x = Math.round(tx * TILE - cam.x);
    const y = Math.round(ty * TILE - cam.y);
    g.fillStyle = 'rgba(225, 54, 54, .22)';
    g.strokeStyle = 'rgba(239, 83, 80, .82)';
    g.fillRect(x, y, TILE, TILE);
    g.strokeRect(x + .5, y + .5, TILE - 1, TILE - 1);
  }

  for (const shape of scene.obstacles ?? []) {
    g.fillStyle = 'rgba(225, 54, 54, .3)';
    g.strokeStyle = '#ef5350';
    if ('x' in shape) {
      const x = Math.round(shape.x - cam.x);
      const y = Math.round(shape.y - cam.y);
      g.fillRect(x, y, shape.w, shape.h);
      g.strokeRect(x + .5, y + .5, shape.w - 1, shape.h - 1);
    } else {
      g.beginPath();
      shape.points.forEach(([worldX, worldY], index) => index === 0
        ? g.moveTo(Math.round(worldX - cam.x), Math.round(worldY - cam.y))
        : g.lineTo(Math.round(worldX - cam.x), Math.round(worldY - cam.y)));
      g.closePath(); g.fill(); g.stroke();
    }
  }

  // 黄色线显示当前脚点所在的排序深度，便于核对逐行遮挡切换。
  const footY = Math.round(actor.y - cam.y);
  g.strokeStyle = '#f4d35e';
  g.beginPath();
  g.moveTo(0, footY + .5);
  g.lineTo(view.w, footY + .5);
  g.stroke();

  const left = Math.round(actor.x - profile.halfW - cam.x);
  const top = Math.round(actor.y - profile.topInset - cam.y);
  const width = profile.halfW * 2;
  const height = profile.topInset - profile.bottomInset;
  g.fillStyle = 'rgba(231, 74, 255, .42)';
  g.strokeStyle = '#f263ff';
  g.fillRect(left, top, width, height);
  g.strokeRect(left + .5, top + .5, width - 1, height - 1);
  const footX = Math.round(actor.x - cam.x);
  g.strokeStyle = '#fff';
  g.beginPath();
  g.moveTo(footX - 3, footY + .5);
  g.lineTo(footX + 3, footY + .5);
  g.moveTo(footX + .5, footY - 3);
  g.lineTo(footX + .5, footY + 3);
  g.stroke();
  g.restore();
}

/** 绿色语义锚点：核对实景建筑关系与可接近位置，不参与碰撞。 */
export function drawSceneLandmarks(
  g: CanvasRenderingContext2D,
  landmarks: readonly SceneLandmark[],
  cam: { x: number; y: number },
): void {
  g.save();
  g.textBaseline = 'bottom';
  g.font = '4px monospace';
  for (const landmark of landmarks) {
    const x = Math.round(landmark.x - cam.x), y = Math.round(landmark.y - cam.y);
    g.strokeStyle = landmark.evidence === 'verified' ? '#50e37a'
      : landmark.evidence === 'inferred' ? '#f3c85b' : '#d864ff';
    g.fillStyle = g.strokeStyle;
    g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x + 5, y); g.moveTo(x, y - 5); g.lineTo(x, y + 5); g.stroke();
    g.fillText(landmark.label, x + 5, y - 3);
  }
  g.restore();
}
