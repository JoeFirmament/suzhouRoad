import { hasStoryFlag, type ProgressData } from '../core/progression.js';

/** 送粥道具只随任务状态出现；场景草稿与研究切片不写入此状态。 */
export function carryingLiuyuanPorridge(progress: ProgressData): boolean {
  return hasStoryFlag(progress, 'ly-errand-offered')
    && !hasStoryFlag(progress, 'ly-porridge-delivered');
}

export function liuyuanBucketAnchor(footX: number, footY: number, actorHeight: number, direction: number, carried: boolean) {
  const side = direction === 2 ? -1 : 1;
  return { x: footX + (carried ? side * actorHeight * .27 : 0),
    y: footY - (carried ? actorHeight * .16 : 0) };
}

/** 原创像素化道具，不表示留园史料中有某种特定桶式。 */
export function drawLiuyuanPorridgeBucket(
  ctx: CanvasRenderingContext2D, footX: number, footY: number,
  actorHeight: number, direction: number, carried: boolean, grounded = !carried,
): void {
  const h = Math.max(9, Math.round(actorHeight * .23));
  const w = Math.max(8, Math.round(h * .78));
  const anchor = liuyuanBucketAnchor(footX, footY, actorHeight, direction, carried);
  const x = Math.round(anchor.x - w / 2);
  const bottom = Math.round(anchor.y);
  const y = bottom - h;
  if (grounded) {
    ctx.fillStyle = 'rgba(23, 31, 24, .2)';
    ctx.fillRect(x - 2, bottom - 1, w + 4, 3);
  }
  ctx.fillStyle = '#3c3830';
  ctx.fillRect(x - 1, y + 2, w + 2, h - 1);
  ctx.fillStyle = '#78634b';
  ctx.fillRect(x + 1, y + 3, w - 2, h - 4);
  ctx.fillStyle = '#a58a65';
  ctx.fillRect(x + 2, y + 4, Math.max(1, Math.floor(w / 3)), h - 6);
  ctx.fillStyle = '#463c32';
  ctx.fillRect(x, y + Math.floor(h * .60), w, 2);
  // 布盖与提梁分开画，缩尺后仍能读出“提着一只桶”。
  ctx.fillStyle = '#c0b4a0';
  ctx.fillRect(x, y, w, 3);
  ctx.fillStyle = '#4b4033';
  ctx.fillRect(x + 1, y - 4, 2, 4);
  ctx.fillRect(x + w - 3, y - 4, 2, 4);
  ctx.fillRect(x + 2, y - 5, Math.max(1, w - 4), 2);
}
