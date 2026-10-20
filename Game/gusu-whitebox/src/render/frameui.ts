import { PALETTE as P, VIEW_W, VIEW_H } from '../config.js';
import type { ViewSpot } from '../data/views.js';
import { px, type Ctx } from './pixel.js';

/** 取景画面内的程序化景致（白模期）。三个窗各有构图，对应数据层 hint。 */

function hillSil(g: Ctx, w: number, h: number): void {
  g.fillStyle = '#a8bca4';
  g.beginPath(); g.moveTo(0, h * 0.55);
  for (let i = 0; i <= 8; i++) g.lineTo((w * i) / 8, h * 0.55 - Math.sin((i / 8) * Math.PI) * h * 0.22);
  g.lineTo(w, h); g.lineTo(0, h); g.fill();
}

function waterBand(g: Ctx, w: number, h: number): void {
  g.fillStyle = P.water; g.fillRect(0, h * 0.62, w, h * 0.38);
  g.fillStyle = P.waterHi;
  for (let i = 0; i < 7; i++) g.fillRect((i * 29) % w, h * 0.66 + ((i * 7) % (h * 0.28)), 10, 1);
}

function pavSil(g: Ctx, x: number, y: number, s: number): void {
  g.fillStyle = '#7a746a';
  g.fillRect(x - s / 2, y, s, 4);
  g.beginPath(); g.moveTo(x - s * 0.7, y); g.lineTo(x, y - s * 0.45); g.lineTo(x + s * 0.7, y); g.fill();
  g.fillStyle = '#5a544c'; g.fillRect(x - 2, y + 4, 4, s * 0.5);
}

function bridgeSil(g: Ctx, w: number, h: number): void {
  g.fillStyle = '#98928a';
  g.beginPath(); g.moveTo(w * 0.2, h * 0.75);
  g.quadraticCurveTo(w * 0.5, h * 0.4, w * 0.8, h * 0.75);
  g.lineTo(w * 0.8, h * 0.8);
  g.quadraticCurveTo(w * 0.5, h * 0.47, w * 0.2, h * 0.8);
  g.fill();
}

function rockSil(g: Ctx, w: number, h: number): void {
  g.fillStyle = '#8a9a84';
  for (let i = 0; i < 5; i++) {
    const x = w * 0.12 + i * w * 0.18;
    g.beginPath(); g.moveTo(x, h * 0.7);
    g.quadraticCurveTo(x + 8, h * 0.35, x + 20, h * 0.7);
    g.fill();
  }
}

export function drawSpotScene(g: Ctx, spot: ViewSpot, x0: number, y0: number, w: number, h: number): void {
  g.save();
  g.translate(x0, y0);
  g.beginPath(); g.rect(0, 0, w, h); g.clip();
  g.fillStyle = '#dfe8e2'; g.fillRect(0, 0, w, h);
  switch (spot.id) {
    case 0: waterBand(g, w, h); pavSil(g, w * 0.5, h * 0.52, 44); break;
    case 1: hillSil(g, w, h); rockSil(g, w, h); break;
    case 2: hillSil(g, w, h); waterBand(g, w, h); bridgeSil(g, w, h); pavSil(g, w * 0.72, h * 0.42, 30); break;
  }
  g.restore();
}

/** 取景 UI：纯框角 + 刻度 + 纸感诗卡 + 朱印。框外压暗、框内不动。 */
export function drawFrameUI(g: Ctx, spot: ViewSpot, captured: number, total: number, now: number, beat: boolean): void {
  const fw = VIEW_W * 0.62, fh = VIEW_H * 0.62;
  const x0 = (VIEW_W - fw) / 2, y0 = (VIEW_H - fh) / 2 - 14;
  const L = 26, c = 3;

  // 框外压暗（画在框内景之上）
  g.fillStyle = 'rgba(30,30,38,.45)';
  g.fillRect(0, 0, VIEW_W, y0);
  g.fillRect(0, y0 + fh, VIEW_W, VIEW_H - y0 - fh);
  g.fillRect(0, y0, x0, fh);
  g.fillRect(x0 + fw, y0, VIEW_W - x0 - fw, fh);

  // 框内景
  drawSpotScene(g, spot, x0, y0, fw, fh);

  // 青色框角 + 刻度
  g.strokeStyle = P.qing; g.lineWidth = c;
  const corner = (cx: number, cy: number, sx: number, sy: number) => {
    g.beginPath();
    g.moveTo(cx + sx * L, cy); g.lineTo(cx, cy); g.lineTo(cx, cy + sy * L);
    g.stroke();
  };
  corner(x0, y0, 1, 1); corner(x0 + fw, y0, -1, 1);
  corner(x0, y0 + fh, 1, -1); corner(x0 + fw, y0 + fh, -1, -1);
  g.lineWidth = 1.5;
  for (let i = 1; i <= 3; i++) {
    const t = (fw / 4) * i;
    g.beginPath(); g.moveTo(x0 + t, y0); g.lineTo(x0 + t, y0 + 6); g.stroke();
    g.beginPath(); g.moveTo(x0 + t, y0 + fh); g.lineTo(x0 + t, y0 + fh - 6); g.stroke();
  }

  // 纸感诗卡（成片提示：按 E 合上）
  const cardW = 300, cardH = 64, cardX = (VIEW_W - cardW) / 2, cardY = VIEW_H - cardH - 18;
  px(g, cardX, cardY, cardW, cardH, '#f7f2e7');
  px(g, cardX, cardY, cardW, 2, '#c9bfa8');
  g.fillStyle = P.ink;
  g.font = '15px "Songti SC","STSong",serif';
  g.fillText(spot.poem, cardX + 16, cardY + 26);
  g.fillStyle = P.ink === '#2b2824' ? '#6b6355' : '#6b6355';
  g.font = '11px "Songti SC","STSong",serif';
  g.fillText(spot.source, cardX + 16, cardY + 46);
  // 朱印（已集数量，卡右上角，避开文字区）
  for (let i = 0; i < total; i++) {
    const filled = i < captured;
    px(g, cardX + cardW - 20 - i * 18, cardY + 10, 10, 10, filled ? P.zhu : '#d8ceae');
  }
  // 操作提示（左对齐，不与印章重叠）
  g.fillStyle = '#6b6355';
  g.font = '12px "PingFang SC",sans-serif';
  g.fillText('按 E / 点击 —— 合上这一幅', cardX + 16, cardY + cardH - 8);
  if (beat) {
    g.fillStyle = 'rgba(10,10,12,.55)';
    g.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

/** 全屏印章提示（三窗集齐 → 园谱 +1）。 */
export function drawToast(g: Ctx, text: string, sinceMs: number): void {
  if (sinceMs > 2600) return;
  const a = sinceMs < 300 ? sinceMs / 300 : sinceMs > 2200 ? (2600 - sinceMs) / 400 : 1;
  g.globalAlpha = Math.max(0, Math.min(1, a));
  px(g, VIEW_W / 2 - 110, 60, 220, 46, '#f7f2e7');
  px(g, VIEW_W / 2 - 110, 60, 220, 3, P.zhu);
  g.fillStyle = P.ink;
  g.font = '18px "Songti SC","STSong",serif';
  g.textAlign = 'center';
  g.fillText(text, VIEW_W / 2, 90);
  g.textAlign = 'left';
  g.globalAlpha = 1;
}
