/**
 * 书生精灵不是均匀的 362px 网格：各列人物中心约相隔 300px，
 * 最后一行脚底还距名义格底 36px。裁整格会造成横向跳帧与悬浮。
 * 以下是 scholar-player-sprites-v1.png 在 alpha>128 时量得的轮廓，
 * 每边留 2px 透明抗锯齿余量，但底边锚在实际鞋底像素。
 */
export interface ScholarFrame { sx: number; sy: number; sw: number; sh: number }

export const SCHOLAR_FRAMES: readonly (readonly ScholarFrame[])[] = [
  [
    { sx: 159, sy: 25, sw: 164, sh: 341 },
    { sx: 457, sy: 25, sw: 165, sh: 348 },
    { sx: 757, sy: 25, sw: 164, sh: 348 },
  ],
  [
    { sx: 159, sy: 375, sw: 175, sh: 345 },
    { sx: 450, sy: 375, sw: 180, sh: 340 },
    { sx: 754, sy: 375, sw: 174, sh: 345 },
  ],
  [
    { sx: 147, sy: 722, sw: 177, sh: 345 },
    { sx: 451, sy: 722, sw: 188, sh: 345 },
    { sx: 750, sy: 722, sw: 183, sh: 345 },
  ],
  [
    { sx: 157, sy: 1069, sw: 175, sh: 337 },
    { sx: 454, sy: 1069, sw: 176, sh: 341 },
    { sx: 749, sy: 1069, sw: 179, sh: 343 },
  ],
];

/** shen-yanqiu-sprites-v1.png 的 alpha>128 实测裁片；鞋底取裁片下缘。 */
export const SHEN_YANQIU_FRAMES: readonly (readonly ScholarFrame[])[] = [
  [
    { sx: 156, sy: 25, sw: 172, sh: 350 },
    { sx: 455, sy: 25, sw: 172, sh: 354 },
    { sx: 755, sy: 25, sw: 173, sh: 354 },
  ],
  [
    { sx: 160, sy: 387, sw: 172, sh: 346 },
    { sx: 458, sy: 387, sw: 175, sh: 346 },
    { sx: 761, sy: 387, sw: 167, sh: 346 },
  ],
  [
    { sx: 147, sy: 741, sw: 178, sh: 333 },
    { sx: 453, sy: 741, sw: 183, sh: 332 },
    { sx: 752, sy: 741, sw: 178, sh: 333 },
  ],
  [
    { sx: 157, sy: 1081, sw: 176, sh: 330 },
    { sx: 453, sy: 1081, sw: 176, sh: 331 },
    { sx: 753, sy: 1080, sw: 178, sh: 334 },
  ],
];

export function scholarFrame(direction: number, phase: number): ScholarFrame {
  return SCHOLAR_FRAMES[Math.max(0, Math.min(3, Math.floor(direction)))]
    [Math.max(0, Math.min(2, Math.floor(phase)))];
}

export function shenYanqiuFrame(direction: number, phase: number): ScholarFrame {
  return SHEN_YANQIU_FRAMES[Math.max(0, Math.min(3, Math.floor(direction)))]
    [Math.max(0, Math.min(2, Math.floor(phase)))];
}

/** 仅用于带透视缩尺的手绘场景；脚点不因视觉缩放而移动。 */
export function perspectiveScholarHeight(
  footY: number, farY: number, nearY: number, farHeight: number, nearHeight: number,
): number {
  const t = Math.max(0, Math.min(1, (footY - farY) / (nearY - farY)));
  return Math.round(farHeight + (nearHeight - farHeight) * t);
}

/** height 是可见人物身高，不包含透明的 362px 旧格。 */
export function drawScholarAtFoot(
  ctx: CanvasRenderingContext2D, sprite: HTMLImageElement,
  direction: number, phase: number, footX: number, footY: number, height: number,
): void {
  drawSpriteFrameAtFoot(ctx, sprite, scholarFrame(direction, phase), footX, footY, height);
}

function drawSpriteFrameAtFoot(
  ctx: CanvasRenderingContext2D, sprite: HTMLImageElement, frame: ScholarFrame,
  footX: number, footY: number, height: number,
): void {
  const drawnHeight = Math.round(height);
  const drawnWidth = Math.round(drawnHeight * frame.sw / frame.sh);
  ctx.drawImage(sprite, frame.sx, frame.sy, frame.sw, frame.sh,
    Math.round(footX) - Math.floor(drawnWidth / 2), Math.round(footY) - drawnHeight,
    drawnWidth, drawnHeight);
}

export function drawShenYanqiuAtFoot(
  ctx: CanvasRenderingContext2D, sprite: HTMLImageElement,
  direction: number, phase: number, footX: number, footY: number, height: number,
): void {
  drawSpriteFrameAtFoot(ctx, sprite, shenYanqiuFrame(direction, phase), footX, footY, height);
}

export function drawScholarGroundShadow(
  ctx: CanvasRenderingContext2D, footX: number, footY: number, height: number,
): void {
  const x = Math.round(footX), y = Math.round(footY);
  const outer = Math.round(height * .40), inner = Math.round(height * .29);
  ctx.fillStyle = 'rgba(19, 27, 21, .12)';
  ctx.fillRect(x - Math.floor(outer / 2), y - 3, outer, 5);
  ctx.fillStyle = 'rgba(19, 27, 21, .23)';
  ctx.fillRect(x - Math.floor(inner / 2), y - 2, inner, 3);
}
