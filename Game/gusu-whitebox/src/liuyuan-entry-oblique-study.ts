import { STANDARD_PLAYER_PROFILE, type CollisionShape, type SceneGeometryObject, type WorldPoint } from './core/geometry.js';
import { collides, moveEntity } from './core/physics.js';
import { readScenePlateDraft } from './core/scene-plate-draft.js';
import {
  LIUYUAN_ENTRY_OBLIQUE_ACTOR_SCALE, LIUYUAN_ENTRY_OBLIQUE_DRAFT_REGIONS,
  LIUYUAN_ENTRY_OBLIQUE_FEET, LIUYUAN_ENTRY_OBLIQUE_GEOMETRY, LIUYUAN_ENTRY_OBLIQUE_ID,
  LIUYUAN_ENTRY_OBLIQUE_SPAWN, LIUYUAN_ENTRY_OBLIQUE_WORLD_H, LIUYUAN_ENTRY_OBLIQUE_WORLD_W,
  buildLiuyuanEntryObliqueStudyMap,
} from './data/liuyuan-entry-oblique-study.js';
import { T } from './data/tiles.js';
import { drawScholarAtFoot, drawScholarGroundShadow, perspectiveScholarHeight } from './render/scholar-sprite.js';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const status = document.getElementById('status')!;
const showGeometry = document.getElementById('showGeometry') as HTMLInputElement;
const coords = document.getElementById('coords')!;
const restart = document.getElementById('restart') as HTMLButtonElement;
const look = document.getElementById('look') as HTMLButtonElement;
const touchLook = document.getElementById('touchLook') as HTMLButtonElement;
const previewRequested = new URLSearchParams(location.search).get('draft') === '1';
const draft = readScenePlateDraft(LIUYUAN_ENTRY_OBLIQUE_ID,
  LIUYUAN_ENTRY_OBLIQUE_WORLD_W, LIUYUAN_ENTRY_OBLIQUE_WORLD_H, buildLiuyuanEntryObliqueStudyMap);
const actorScalePercent = draft?.actorScalePercent ?? 100;
const scene = buildLiuyuanEntryObliqueStudyMap(draft?.regions ?? LIUYUAN_ENTRY_OBLIQUE_DRAFT_REGIONS);
const geometry: readonly SceneGeometryObject[] = draft?.geometry ?? LIUYUAN_ENTRY_OBLIQUE_GEOMETRY;
const obstacles: readonly CollisionShape[] = geometry.flatMap((object) => object.colliders ?? []);
const actor = { x: Number(LIUYUAN_ENTRY_OBLIQUE_SPAWN.x), y: Number(LIUYUAN_ENTRY_OBLIQUE_SPAWN.y),
  dir: 3, moving: false, walkTime: 0 };
const art = new Image();
art.addEventListener('error', () => { status.textContent = '镜头候选图未载入，请检查路径。'; });
art.src = '../research-art/liuyuan-entry-oblique-pixel-study-v1.png';
const sprite = new Image();
sprite.src = '../assets/characters/scholar-player-sprites-v1.png';
const keys = new Set<string>();
const pressed = new Set<string>();
let lastTime = 0;

const directions: Readonly<Record<string, string>> = {
  arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down',
  arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
};
function near(point: { x: number; y: number }, radius: number): boolean {
  return Math.hypot(actor.x - point.x, actor.y - point.y) <= radius;
}
function inspect(): void {
  status.textContent = near(LIUYUAN_ENTRY_OBLIQUE_FEET.stop, 95)
    ? '这一镜到此为止。古木交柯小庭另有可走画面；两张图的真实门路尚未拼接。'
    : near(LIUYUAN_ENTRY_OBLIQUE_FEET.threshold, 85)
    ? '门檐压低了光。柱脚之外才是石路，别从瓦面穿过去。'
    : '墙边渐有天光。先看脚下哪处石地真正相连。';
}
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'e' || key === ' ') { event.preventDefault(); if (!event.repeat) inspect(); return; }
  const direction = directions[key];
  if (direction) { event.preventDefault(); keys.add(direction); }
});
window.addEventListener('keyup', (event) => {
  const direction = directions[event.key.toLowerCase()];
  if (direction) keys.delete(direction);
});
window.addEventListener('blur', () => { keys.clear(); pressed.clear(); });
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-dir]')) {
  const direction = button.dataset.dir!;
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault(); button.setPointerCapture(event.pointerId); pressed.add(direction);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const)
    button.addEventListener(type, () => pressed.delete(direction));
}
look.addEventListener('click', inspect);
touchLook.addEventListener('click', inspect);
restart.addEventListener('click', () => {
  actor.x = LIUYUAN_ENTRY_OBLIQUE_SPAWN.x; actor.y = LIUYUAN_ENTRY_OBLIQUE_SPAWN.y;
  actor.dir = 3; actor.moving = false; actor.walkTime = 0;
  keys.clear(); pressed.clear();
  status.textContent = '回到门外。这个镜头只校底图、书生比例与轮廓。';
});

function polygon(points: readonly WorldPoint[]): void {
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
}
function drawDebug(): void {
  ctx.save(); ctx.globalAlpha = .42;
  for (let y = 0; y < scene.h; y++) for (let x = 0; x < scene.w; x++) {
    const tile = scene.map[y * scene.w + x];
    if (tile === T.PATH || tile === T.CORR) {
      ctx.fillStyle = tile === T.PATH ? '#5cce8d' : '#3bd1d6';
      ctx.fillRect(x * 16, y * 16, 16, 16);
    }
  }
  ctx.fillStyle = '#e25450';
  for (const object of geometry) for (const shape of object.colliders ?? []) {
    ctx.beginPath();
    if ('x' in shape) ctx.rect(shape.x, shape.y, shape.w, shape.h);
    else polygon(shape.points);
    ctx.fill();
  }
  ctx.restore();
  for (const object of geometry) for (const shape of object.occluder?.polygons ?? []) {
    ctx.beginPath(); polygon(shape); ctx.strokeStyle = '#45d8e3'; ctx.lineWidth = 3; ctx.stroke();
  }
  for (const foot of Object.values(LIUYUAN_ENTRY_OBLIQUE_FEET)) {
    ctx.fillStyle = '#f4d478'; ctx.fillRect(foot.x - 4, foot.y - 4, 8, 8);
  }
  const profile = STANDARD_PLAYER_PROFILE;
  ctx.strokeStyle = '#fc6fac'; ctx.lineWidth = 2;
  ctx.strokeRect(actor.x - profile.halfW, actor.y - profile.topInset,
    profile.halfW * 2, profile.topInset - profile.bottomInset);
}
function draw(): void {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#404b47'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (art.complete && art.naturalWidth) ctx.drawImage(art, 0, 0, canvas.width, canvas.height);
  const scale = LIUYUAN_ENTRY_OBLIQUE_ACTOR_SCALE;
  const height = Math.round(perspectiveScholarHeight(actor.y, scale.farFootY, scale.nearFootY,
    scale.farHeight, scale.nearHeight) * actorScalePercent / 100);
  drawScholarGroundShadow(ctx, actor.x, actor.y, height);
  if (sprite.complete && sprite.naturalWidth) {
    const frame = actor.moving ? 1 + Math.floor(actor.walkTime * 6) % 2 : 0;
    drawScholarAtFoot(ctx, sprite, actor.dir, frame, actor.x, actor.y, height);
  }
  if (art.complete && art.naturalWidth) for (const object of geometry) {
    const occluder = object.occluder;
    if (!occluder || actor.y >= occluder.depthY) continue;
    ctx.save(); ctx.beginPath();
    for (const shape of occluder.polygons) polygon(shape);
    ctx.clip(); ctx.drawImage(art, 0, 0, canvas.width, canvas.height); ctx.restore();
  }
  if (showGeometry.checked) drawDebug();
  coords.hidden = !showGeometry.checked;
  if (showGeometry.checked) coords.textContent = `鞋底 (${Math.round(actor.x)}, ${Math.round(actor.y)}) · 身高 ${height}px · ${draft ? '当前草稿' : '代码默认'}`;
}
function frame(time: number): void {
  const dt = Math.min((time - (lastTime || time)) / 1000, .05); lastTime = time;
  const active = (direction: string) => keys.has(direction) || pressed.has(direction);
  const dx = Number(active('right')) - Number(active('left'));
  const dy = Number(active('down')) - Number(active('up'));
  actor.moving = dx !== 0 || dy !== 0;
  if (actor.moving) {
    actor.dir = dy > 0 ? 0 : dy < 0 ? 3 : dx > 0 ? 2 : 1;
    actor.walkTime += dt;
    const length = Math.hypot(dx, dy);
    moveEntity(scene.map, actor, dx / length * 188 * dt, dy / length * 188 * dt,
      scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE);
  }
  draw(); requestAnimationFrame(frame);
}
if (previewRequested && !draft) status.textContent = '未找到该镜头的有效编辑器草稿，显示代码默认几何。';
if (draft) status.textContent = '正在预览统一编辑器草稿；旧入口场景及草稿未改动。';
if (collides(scene.map, actor.x, actor.y, scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE))
  status.textContent = '出生脚点被当前几何封住，请回编辑器检查。';
requestAnimationFrame(frame);
