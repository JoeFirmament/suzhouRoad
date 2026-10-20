import { completeCanglangThreeWindows } from './core/progression.js';
import {
  CORRIDOR_EFFECTS,
  CORRIDOR_LANE,
  CORRIDOR_POST_OCCLUDERS,
  CORRIDOR_ROUTE,
  CORRIDOR_SPOTS,
  corridorWaterEdgeY,
  validateCorridorGeometry,
  type CorridorPoint,
  type CorridorWindowSpot,
} from './data/corridor-geometry.js';
import { drawWaterRipples } from './render/effects.js';
import { readSceneActorScalePercent, readSceneVisualOccluders } from './core/scene-plate-draft.js';
import { drawScholarAtFoot, drawScholarGroundShadow } from './render/scholar-sprite.js';

const canvas = document.getElementById('corridorGame') as HTMLCanvasElement;
const ctx = canvas.getContext('2d', { alpha: false })!;
const loading = document.getElementById('loading')!;
const toast = document.getElementById('toast')!;
const objective = document.getElementById('objective')!;
const resetButton = document.getElementById('resetButton')!;
const completionLayer = document.getElementById('completionLayer') as HTMLElement;
const stayButton = document.getElementById('stayButton') as HTMLButtonElement;
const image = new Image();
const playerSprite = new Image();
playerSprite.src = '../assets/characters/scholar-player-sprites-v1.png';

const W = canvas.width;
const H = canvas.height;
const actorScalePercent = readSceneActorScalePercent('canglang-corridor', W, H) ?? 100;
const visualOccluders = readSceneVisualOccluders('canglang-corridor', W, H) ?? CORRIDOR_POST_OCCLUDERS;
const actorVisibleHeight = Math.round(52 * actorScalePercent / 100);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);
const debugGeometry = params.get('debug') === 'geometry';
if (debugGeometry) {
  const geometryErrors = validateCorridorGeometry();
  if (geometryErrors.length) console.warn('[复廊几何校验]', ...geometryErrors);
  else console.info('[复廊几何校验] 通过');
}

type RoutePoint = CorridorPoint & { tx: number; ty: number };

// 逻辑画布为母版的一半；路线贴合临水外廊的脚线，而不是从图片反推碰撞地图。
const route = CORRIDOR_ROUTE;
const spots = CORRIDOR_SPOTS;

const segmentLengths: number[] = [];
let totalLength = 0;
for (let i = 0; i < route.length - 1; i++) {
  const n = Math.hypot(route[i + 1].x - route[i].x, route[i + 1].y - route[i].y);
  segmentLengths.push(n);
  totalLength += n;
}

const keys = new Set<string>();
const virtualKeys = new Set<string>();
const state = {
  t: .055,
  lane: 0,
  targetT: null as number | null,
  direction: 1,
  moving: false,
  captured: new Set<number>(),
  beat: null as { idx: number; startedAt: number } | null,
  toastUntil: 0,
  toastText: '',
  lastTime: 0,
  completionAt: 0,
  completionShown: false,
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function pointOnRoute(t: number, lane = 0): RoutePoint {
  let remaining = clamp(t, 0, 1) * totalLength;
  for (let i = 0; i < segmentLengths.length; i++) {
    if (remaining <= segmentLengths[i] || i === segmentLengths.length - 1) {
      const ratio = clamp(remaining / segmentLengths[i], 0, 1);
      const a = route[i], b = route[i + 1];
      const tx = (b.x - a.x) / segmentLengths[i], ty = (b.y - a.y) / segmentLengths[i];
      return { x: a.x + (b.x - a.x) * ratio - ty * lane, y: a.y + (b.y - a.y) * ratio + tx * lane, tx, ty };
    }
    remaining -= segmentLengths[i];
  }
  return { ...route[route.length - 1], tx: 1, ty: 0 };
}

function nearestRouteT(x: number, y: number): number | null {
  let best = Infinity, bestT = 0, traversed = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i], b = route[i + 1];
    const vx = b.x - a.x, vy = b.y - a.y;
    const ratio = clamp(((x - a.x) * vx + (y - a.y) * vy) / (vx * vx + vy * vy), 0, 1);
    const px = a.x + vx * ratio, py = a.y + vy * ratio;
    const d = Math.hypot(x - px, y - py);
    if (d < best) { best = d; bestT = (traversed + segmentLengths[i] * ratio) / totalLength; }
    traversed += segmentLengths[i];
  }
  return best < 58 ? bestT : null;
}

function activeIndex(): number { return state.captured.size; }

function showToast(text: string, now: number): void {
  state.toastText = text;
  state.toastUntil = now + 1900;
  toast.textContent = text;
  toast.classList.add('is-visible');
}

function updateHud(): void {
  const active = activeIndex();
  document.querySelectorAll<HTMLElement>('[data-window]').forEach((item, idx) => {
    item.classList.toggle('is-captured', state.captured.has(idx));
    item.classList.toggle('is-active', idx === active && active < spots.length);
  });
  objective.textContent = active >= spots.length
    ? '课业完成 · 数艺「观位」初识，《蘇城全圖》显出新的园林线索'
    : spots[active].instruction;
}

function interact(now: number): void {
  if (state.beat) return;
  const idx = activeIndex();
  if (idx >= spots.length) { showToast('三窗已收入园谱', now); return; }
  const distance = Math.abs(state.t - spots[idx].t);
  if (distance > .045) {
    showToast(state.t < spots[idx].t ? '再沿廊向东走一些' : '刚才的窗位在身后', now);
    return;
  }
  state.targetT = null;
  state.moving = false;
  state.beat = { idx, startedAt: now };
}

function finishBeat(now: number): void {
  if (!state.beat || now - state.beat.startedAt < 300) return;
  const { idx } = state.beat;
  state.captured.add(idx);
  state.beat = null;
  if (idx === spots.length - 1) {
    completeCanglangThreeWindows();
    state.completionAt = now + 1600;
  }
  showToast(`${spots[idx].verb} · ${spots[idx].line}`, now);
  updateHud();
}

function showCompletion(): void {
  if (state.completionShown) return;
  state.completionShown = true;
  completionLayer.hidden = false;
  stayButton.focus();
}

function drawWater(time: number): void {
  if (reducedMotion) return;
  drawWaterRipples(ctx, CORRIDOR_EFFECTS, { x: 0, y: 0 }, time);
}

function drawPlayerReflection(time: number): void {
  if (!playerSprite.complete || !playerSprite.naturalWidth) return;
  const p = pointOnRoute(state.t, state.lane);
  const edgeY = corridorWaterEdgeY(p.x);
  const frame = state.moving ? 1 + Math.floor(time / 130) % 2 : 0;
  const direction = state.direction > 0 ? 2 : 1;
  ctx.save();
  // 复用水纹的有效水域，偶奇裁切可避开两侧山石和前景岸面。
  ctx.beginPath();
  for (const effect of CORRIDOR_EFFECTS) for (const polygon of [...effect.polygons, ...(effect.holes ?? [])]) {
    polygon.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
  }
  ctx.clip('evenodd');
  ctx.globalAlpha = .14;
  const sway = reducedMotion ? 0 : Math.sin(time * .002 + p.x * .03) * 1.5;
  ctx.translate(Math.round(p.x + sway), Math.round(edgeY + 2));
  ctx.scale(1, -.58);
  drawScholarAtFoot(ctx, playerSprite, direction, frame, 0, 0, actorVisibleHeight);
  ctx.restore();
}

function drawGeometryDebug(): void {
  ctx.save();
  ctx.lineWidth = 1;
  for (const effect of CORRIDOR_EFFECTS) {
    ctx.fillStyle = 'rgba(54, 126, 255, .12)';
    ctx.strokeStyle = '#4c8dff';
    for (const polygon of effect.polygons) {
      ctx.beginPath();
      polygon.forEach(([x, y], index) => index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.strokeStyle = '#ff9d45';
    for (const polygon of effect.holes ?? []) {
      ctx.beginPath();
      polygon.forEach(([x, y], index) => index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
      ctx.closePath(); ctx.stroke();
    }
  }

  for (const [lane, color] of [[CORRIDOR_LANE.min, '#ef5350'], [0, '#35d8e6'], [CORRIDOR_LANE.max, '#ef5350']] as const) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    for (let t = 0; t <= 1.001; t += .02) {
      const p = pointOnRoute(Math.min(t, 1), lane);
      if (t === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
  const actor = pointOnRoute(state.t, state.lane);
  ctx.fillStyle = 'rgba(231, 74, 255, .45)';
  ctx.strokeStyle = '#f263ff';
  ctx.fillRect(Math.round(actor.x) - 4, Math.round(actor.y) - 6, 8, 5);
  ctx.strokeRect(Math.round(actor.x) - 3.5, Math.round(actor.y) - 5.5, 7, 4);
  ctx.restore();
}

function drawPlayer(time: number): void {
  const p = pointOnRoute(state.t, state.lane);
  const step = state.moving ? Math.floor(time / 130) % 2 : 0;
  const bob = state.moving && !reducedMotion ? step : 0;
  const x = Math.round(p.x), y = Math.round(p.y - bob);
  drawScholarGroundShadow(ctx, x, p.y, actorVisibleHeight);
  if (playerSprite.complete && playerSprite.naturalWidth > 0) {
    const frame = state.moving ? step + 1 : 0;
    const row = state.direction > 0 ? 2 : 1;
    drawScholarAtFoot(ctx, playerSprite, row, frame, x, y, actorVisibleHeight);
    return;
  }
  ctx.fillStyle = '#302820'; ctx.fillRect(x - 6, y - 43, 13, 6); ctx.fillRect(x - 8, y - 39, 17, 5);
  ctx.fillStyle = '#d1aa80'; ctx.fillRect(x - 5, y - 34, 11, 8);
  ctx.fillStyle = '#e0d5b9'; ctx.fillRect(x - 7, y - 26, 15, 24);
  ctx.fillStyle = '#8f3b30'; ctx.fillRect(x - 7, y - 12, 15, 3);
  ctx.fillStyle = '#5b4634';
  const stride = state.direction > 0 ? step : 1 - step;
  ctx.fillRect(x - 5 - stride, y - 2, 4, 5); ctx.fillRect(x + 2 + stride, y - 2, 4, 5);
  ctx.fillStyle = '#b6a681';
  const arm = state.direction > 0 ? 1 : -1;
  ctx.fillRect(x + arm * 8 - 2, y - 25 + step, 4, 13);
}

function redrawPosts(): void {
  // 只回绘脚点在人物前方的裁片；草稿仅能改变视觉遮挡，不改变受约束路线。
  const footY = pointOnRoute(state.t, state.lane).y;
  for (const object of visualOccluders) {
    const mask = object.occluder;
    if (!mask || footY >= mask.depthY) continue;
    ctx.save();
    ctx.beginPath();
    for (const polygon of mask.polygons) {
      polygon.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
    }
    ctx.clip('evenodd');
    ctx.drawImage(image, 0, 0, W, H);
    ctx.restore();
  }
}

function drawSpotMarker(spot: CorridorWindowSpot, idx: number, time: number): void {
  const captured = state.captured.has(idx);
  const active = idx === activeIndex();
  if (!active && !captured) return;
  const alpha = captured ? .55 : .72 + Math.sin(time * .004) * .22;
  const f = spot.frame;
  ctx.save();
  ctx.strokeStyle = captured ? `rgba(200,160,75,${alpha})` : `rgba(217,85,67,${alpha})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(f.x - 3, f.y - 3, f.w + 6, f.h + 6);
  ctx.fillStyle = captured ? '#c8a04b' : '#d95543';
  ctx.fillRect(f.x + f.w / 2 - 2, f.y - 9, 5, 5);
  ctx.restore();
}

function drawBeat(): void {
  if (!state.beat) return;
  const spot = spots[state.beat.idx], f = spot.frame;
  ctx.fillStyle = 'rgba(16,24,20,.28)'; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.beginPath(); ctx.rect(f.x - 6, f.y - 6, f.w + 12, f.h + 12); ctx.clip();
  ctx.drawImage(image, 0, 0, W, H);
  ctx.restore();
  ctx.strokeStyle = '#f2ead6'; ctx.lineWidth = 2; ctx.strokeRect(f.x - 7, f.y - 7, f.w + 14, f.h + 14);
}

function draw(time: number): void {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0, W, H);
  drawPlayerReflection(time);
  drawWater(time);
  spots.forEach((spot, idx) => drawSpotMarker(spot, idx, time));
  drawPlayer(time);
  redrawPosts();
  drawBeat();
  if (debugGeometry) drawGeometryDebug();
  if (time > state.toastUntil) toast.classList.remove('is-visible');
}

function down(key: string): boolean { return keys.has(key) || virtualKeys.has(key); }

function update(dt: number, now: number): void {
  finishBeat(now);
  if (state.completionAt > 0 && now >= state.completionAt) showCompletion();
  if (!completionLayer.hidden) { state.moving = false; return; }
  if (state.beat) { state.moving = false; return; }
  const along = Number(down('d') || down('arrowright')) - Number(down('a') || down('arrowleft'));
  const across = Number(down('s') || down('arrowdown')) - Number(down('w') || down('arrowup'));
  state.moving = along !== 0 || across !== 0 || state.targetT !== null;
  if (along) {
    state.direction = along;
    state.targetT = null;
    state.t = clamp(state.t + along * dt * .17, .025, .975);
  } else if (state.targetT !== null) {
    const delta = state.targetT - state.t;
    if (Math.abs(delta) < .003) { state.t = state.targetT; state.targetT = null; }
    else { state.direction = Math.sign(delta); state.t = clamp(state.t + Math.sign(delta) * dt * .19, .025, .975); }
  }
  state.lane = clamp(state.lane + across * dt * 12, CORRIDOR_LANE.min, CORRIDOR_LANE.max);
}

function frame(time: number): void {
  const dt = Math.min((time - state.lastTime) / 1000 || .016, .05);
  state.lastTime = time;
  update(dt, time);
  draw(time);
  requestAnimationFrame(frame);
}

function reset(): void {
  state.t = .055; state.lane = 0; state.targetT = null; state.captured.clear(); state.beat = null;
  state.completionAt = 0; state.completionShown = false; completionLayer.hidden = true;
  updateHud();
  showToast('已回到面水轩一端', performance.now());
  canvas.focus();
}

addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'w', 'a', 's', 'd'].includes(key)) {
    event.preventDefault(); keys.add(key);
  }
  if (['e', ' ', 'enter'].includes(key)) { event.preventDefault(); interact(performance.now()); }
});
addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));

function releaseVirtual(): void {
  virtualKeys.clear();
  document.querySelectorAll('.is-active').forEach((el) => el.classList.remove('is-active'));
}
addEventListener('blur', () => { keys.clear(); releaseVirtual(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) releaseVirtual(); });

document.querySelectorAll<HTMLElement>('[data-move]').forEach((button) => {
  const key = button.dataset.move!;
  const set = (active: boolean) => {
    if (active) virtualKeys.add(key); else virtualKeys.delete(key);
    button.classList.toggle('is-active', active);
  };
  button.addEventListener('pointerdown', (event) => { event.preventDefault(); button.setPointerCapture(event.pointerId); set(true); });
  button.addEventListener('pointerup', () => set(false));
  button.addEventListener('pointercancel', () => set(false));
  button.addEventListener('lostpointercapture', () => set(false));
});
document.querySelector<HTMLElement>('[data-action="interact"]')!.addEventListener('pointerdown', (event) => {
  event.preventDefault(); interact(performance.now());
});

canvas.addEventListener('pointerdown', (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * W / rect.width;
  const y = (event.clientY - rect.top) * H / rect.height;
  const target = nearestRouteT(x, y);
  if (target === null) { showToast('请点击复廊步道', performance.now()); return; }
  state.targetT = clamp(target, .025, .975);
  canvas.focus();
});

resetButton.addEventListener('click', reset);
stayButton.addEventListener('click', () => {
  completionLayer.hidden = true;
  canvas.focus();
});
if (params.get('scene') === 'complete') {
  state.completionShown = true;
  completionLayer.hidden = false;
}
image.addEventListener('load', () => {
  loading.classList.add('is-hidden');
  updateHud();
  if (completionLayer.hidden) canvas.focus(); else stayButton.focus();
  requestAnimationFrame(frame);
});
image.addEventListener('error', () => { loading.textContent = '场景母版加载失败。'; });
image.src = '../assets/canglang/corridor-hero-v4-motifs.png';
