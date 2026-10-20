import { STANDARD_PLAYER_PROFILE, type CollisionShape, type SceneGeometryObject, type WorldPoint } from './core/geometry.js';
import { collides, moveEntity } from './core/physics.js';
import { readScenePlateDraft } from './core/scene-plate-draft.js';
import {
  LIUYUAN_ENTRY_LOWER_ACTOR_SCALE, LIUYUAN_ENTRY_LOWER_DRAFT_REGIONS,
  LIUYUAN_ENTRY_LOWER_FEET, LIUYUAN_ENTRY_LOWER_GEOMETRY, LIUYUAN_ENTRY_LOWER_ID,
  LIUYUAN_ENTRY_LOWER_NPC_FEET,
  LIUYUAN_ENTRY_LOWER_SPAWN, LIUYUAN_ENTRY_LOWER_WORLD_H, LIUYUAN_ENTRY_LOWER_WORLD_W,
  buildLiuyuanEntryLowerStudyMap,
} from './data/liuyuan-entry-lower-camera-study.js';
import { T } from './data/tiles.js';
import { drawScholarAtFoot, drawScholarGroundShadow, perspectiveScholarHeight } from './render/scholar-sprite.js';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const status = document.getElementById('status')!;
const showPeople = document.getElementById('showPeople') as HTMLInputElement;
const showGeometry = document.getElementById('showGeometry') as HTMLInputElement;
const coords = document.getElementById('coords')!;
const restart = document.getElementById('restart') as HTMLButtonElement;
const look = document.getElementById('look') as HTMLButtonElement;
const touchLook = document.getElementById('touchLook') as HTMLButtonElement;
const previewRequested = new URLSearchParams(location.search).get('draft') === '1';
const draft = readScenePlateDraft(LIUYUAN_ENTRY_LOWER_ID,
  LIUYUAN_ENTRY_LOWER_WORLD_W, LIUYUAN_ENTRY_LOWER_WORLD_H, buildLiuyuanEntryLowerStudyMap);
const actorScalePercent = draft?.actorScalePercent ?? 100;
const scene = buildLiuyuanEntryLowerStudyMap(draft?.regions ?? LIUYUAN_ENTRY_LOWER_DRAFT_REGIONS);
const geometry: readonly SceneGeometryObject[] = draft?.geometry ?? LIUYUAN_ENTRY_LOWER_GEOMETRY;
const obstacles: readonly CollisionShape[] = geometry.flatMap((object) => object.colliders ?? []);
const actor = { x: Number(LIUYUAN_ENTRY_LOWER_SPAWN.x), y: Number(LIUYUAN_ENTRY_LOWER_SPAWN.y),
  dir: 3, moving: false, walkTime: 0 };
const art = new Image();
art.addEventListener('error', () => { status.textContent = '镜头候选图未载入，请检查路径。'; });
art.src = '../research-art/liuyuan-entry-lower-camera-gameplay-candidate-v1.png';
const sprite = new Image();
sprite.src = '../assets/characters/scholar-player-sprites-v1.png';
const gateNpcs = new Image();
gateNpcs.src = '../assets/characters/liuyuan-gate-npcs-concept-v1.png';
const qiao = new Image();
qiao.src = '../assets/characters/qiao-he-sprites-concept-v1.png';
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
  status.textContent = near(LIUYUAN_ENTRY_LOWER_FEET.stop, 82)
    ? '这一镜到第一口天光为止；真正接入夹弄前，还须对齐下一镜头的路。'
    : near(LIUYUAN_ENTRY_LOWER_FEET.threshold, 90)
    ? '门檐挡住半片天。鞋底要走在石地上，不能从门柱穿过去。'
    : '门外够两个人让路，粥桶与修灯的动作要在这块地上发生。';
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
  actor.x = LIUYUAN_ENTRY_LOWER_SPAWN.x; actor.y = LIUYUAN_ENTRY_LOWER_SPAWN.y;
  actor.dir = 3; actor.moving = false; actor.walkTime = 0;
  keys.clear(); pressed.clear();
  status.textContent = '回到门外。此页只校底图、书生比例和轮廓。';
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
  for (const foot of Object.values(LIUYUAN_ENTRY_LOWER_FEET)) {
    ctx.fillStyle = '#f4d478'; ctx.fillRect(foot.x - 4, foot.y - 4, 8, 8);
  }
  for (const [name, foot] of Object.entries(LIUYUAN_ENTRY_LOWER_NPC_FEET)) {
    ctx.fillStyle = '#ecbc7c'; ctx.fillRect(foot.x - 6, foot.y - 2, 12, 4);
    ctx.fillRect(foot.x - 2, foot.y - 6, 4, 12);
    ctx.font = 'bold 18px sans-serif'; ctx.fillText(name, foot.x + 10, foot.y - 8);
  }
  const profile = STANDARD_PLAYER_PROFILE;
  ctx.strokeStyle = '#fc6fac'; ctx.lineWidth = 2;
  ctx.strokeRect(actor.x - profile.halfW, actor.y - profile.topInset,
    profile.halfW * 2, profile.topInset - profile.bottomInset);
}
function heightAt(footY: number): number {
  const scale = LIUYUAN_ENTRY_LOWER_ACTOR_SCALE;
  return perspectiveScholarHeight(footY, scale.farFootY, scale.nearFootY,
    scale.farHeight, scale.nearHeight);
}
interface VisibleNpcFrame { sx: number; sy: number; sw: number; sh: number }
// Alpha>40 silhouette bounds, measured within the original sprite sheets.
// Cropping before sizing keeps the visible shoes, not the transparent cell, on the foot anchor.
const VENDOR_FRAME: VisibleNpcFrame = { sx: 201, sy: 142, sw: 452, sh: 815 };
const GATEKEEPER_FRAME: VisibleNpcFrame = { sx: 876, sy: 142, sw: 486, sh: 820 };
const QIAO_FRAME: VisibleNpcFrame = { sx: 164, sy: 33, sw: 154, sh: 329 };
function drawGroundedNpc(image: HTMLImageElement, frame: VisibleNpcFrame,
  foot: { x: number; y: number }, visibleHeight: number): void {
  const height = Math.round(visibleHeight);
  const width = Math.round(height * frame.sw / frame.sh);
  drawScholarGroundShadow(ctx, foot.x, foot.y, height);
  ctx.drawImage(image, frame.sx, frame.sy, frame.sw, frame.sh,
    Math.round(foot.x - width / 2), Math.round(foot.y - height), width, height);
}
function drawResearchPeople(beforeActor: boolean): void {
  // Temporary ratios only; actors and lamp remain separate from the bitmap.
  if (gateNpcs.complete && gateNpcs.naturalWidth) {
    for (const [foot, frame, ratio] of [
      [LIUYUAN_ENTRY_LOWER_NPC_FEET.oldVendor, VENDOR_FRAME, .70],
      [LIUYUAN_ENTRY_LOWER_NPC_FEET.gatekeeper, GATEKEEPER_FRAME, .72],
    ] as const) {
      if ((foot.y <= actor.y) !== beforeActor) continue;
      drawGroundedNpc(gateNpcs, frame, foot, heightAt(foot.y) * ratio);
    }
  }
  const qiaoFoot = LIUYUAN_ENTRY_LOWER_NPC_FEET.qiao;
  if (qiao.complete && qiao.naturalWidth && (qiaoFoot.y <= actor.y) === beforeActor) {
    drawGroundedNpc(qiao, QIAO_FRAME, qiaoFoot, heightAt(qiaoFoot.y) * .78);
  }
}
function draw(): void {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#404b47'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (art.complete && art.naturalWidth) ctx.drawImage(art, 0, 0, canvas.width, canvas.height);
  const height = Math.round(heightAt(actor.y) * actorScalePercent / 100);
  if (showPeople.checked) drawResearchPeople(true);
  drawScholarGroundShadow(ctx, actor.x, actor.y, height);
  if (sprite.complete && sprite.naturalWidth) {
    const frame = actor.moving ? 1 + Math.floor(actor.walkTime * 6) % 2 : 0;
    drawScholarAtFoot(ctx, sprite, actor.dir, frame, actor.x, actor.y, height);
  }
  if (showPeople.checked) drawResearchPeople(false);
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
if (previewRequested && !draft) status.textContent = '没有这个研究镜头的有效草稿，显示代码默认几何。';
if (draft) status.textContent = '正在预览独立编辑器草稿；原入口与旧斜俯视草稿未改。';
if (collides(scene.map, actor.x, actor.y, scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE))
  status.textContent = '出生脚点被当前几何封住，请回编辑器检查。';
requestAnimationFrame(frame);
