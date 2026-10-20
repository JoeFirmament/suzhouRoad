import { STANDARD_PLAYER_PROFILE, type CollisionShape, type SceneGeometryObject } from './core/geometry.js';
import { collides, moveEntity } from './core/physics.js';
import { readScenePlateDraft } from './core/scene-plate-draft.js';
import { advanceReturnWalk, completedReturnWalk, INITIAL_RETURN_WALK, type ReturnWalkState } from './core/liuyuan-return-walk.js';
import { hasStoryFlag, loadProgress } from './core/progression.js';
import { carryLiuyuanPlaytest } from './core/liuyuan-playtest.js';
import { chapterSceneHref } from './core/liuyuan-view-memory.js';
import {
  LIUYUAN_YOUYICUN_DRAFT_REGIONS, LIUYUAN_YOUYICUN_FEET,
  LIUYUAN_YOUYICUN_GEOMETRY, LIUYUAN_YOUYICUN_ID, LIUYUAN_YOUYICUN_SPAWN,
  LIUYUAN_YOUYICUN_ACTOR_SCALE,
  LIUYUAN_YOUYICUN_WORLD_H, LIUYUAN_YOUYICUN_WORLD_W, buildLiuyuanYouyicunStudyMap,
} from './data/liuyuan-youyicun-study.js';
import { T } from './data/tiles.js';
import { drawScholarAtFoot, drawScholarGroundShadow, perspectiveScholarHeight } from './render/scholar-sprite.js';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const status = document.getElementById('status')!;
const showGeometry = document.getElementById('showGeometry') as HTMLInputElement;
const coords = document.getElementById('coords')!;
const restart = document.getElementById('restart') as HTMLButtonElement;
const look = document.getElementById('look') as HTMLButtonElement;
const returnToFlower = document.getElementById('returnToFlower') as HTMLAnchorElement;
const researchContinue = document.getElementById('researchContinue') as HTMLButtonElement;
const recallClue = document.getElementById('recallClue') as HTMLButtonElement;
const params = new URLSearchParams(location.search);
const chapterPreview = params.get('chapterPreview') === '1';
if (chapterPreview) returnToFlower.href = chapterSceneHref('liuyuan-flower.html');
recallClue.hidden = !chapterPreview || !hasStoryFlag(loadProgress(), 'ly-florist-met');
recallClue.addEventListener('click', () => {
  if (!chapterPreview || !hasStoryFlag(loadProgress(), 'ly-florist-met')) return;
  status.textContent = '花匠说：“那树开前，苞尖像笔头。”他没说是哪一院。';
});
const draft = readScenePlateDraft(LIUYUAN_YOUYICUN_ID,
  LIUYUAN_YOUYICUN_WORLD_W, LIUYUAN_YOUYICUN_WORLD_H, buildLiuyuanYouyicunStudyMap);
const actorScalePercent = draft?.actorScalePercent ?? 100;
const scene = buildLiuyuanYouyicunStudyMap(draft?.regions ?? LIUYUAN_YOUYICUN_DRAFT_REGIONS);
const geometry: readonly SceneGeometryObject[] = draft?.geometry ?? LIUYUAN_YOUYICUN_GEOMETRY;
const obstacles: readonly CollisionShape[] = geometry.flatMap((object) => object.colliders ?? []);
const actor = { x: Number(LIUYUAN_YOUYICUN_SPAWN.x), y: Number(LIUYUAN_YOUYICUN_SPAWN.y),
  dir: 2, moving: false, walkTime: 0 };
const pressed = new Set<string>();
const keys = new Set<string>();
let lastTime = 0;
const resumeFromStone = chapterPreview && params.get('researchFrom') === 'stone-forest'
  && !collides(scene.map, LIUYUAN_YOUYICUN_FEET.onward.x, LIUYUAN_YOUYICUN_FEET.onward.y,
    scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE);
if (resumeFromStone) {
  actor.x = LIUYUAN_YOUYICUN_FEET.onward.x;
  actor.y = LIUYUAN_YOUYICUN_FEET.onward.y;
  status.textContent = '你回到这张圆门研究图的止步点。旧廊段的实际入口仍待查。';
}
let returnWalk: ReturnWalkState = resumeFromStone ? completedReturnWalk() : { ...INITIAL_RETURN_WALK };
function continueResearch(): void {
  if (chapterPreview && returnWalk.reachedEnd && near(LIUYUAN_YOUYICUN_FEET.onward, 80)) {
    const next = new URLSearchParams({ researchFrom: 'return-walk' });
    if (params.get('draft') === '1') next.set('draft', '1');
    carryLiuyuanPlaytest(next);
    location.assign(`liuyuan-stone-forest.html?${next}`);
  }
}
researchContinue.addEventListener('click', continueResearch);

const art = new Image();
art.src = '../research-art/liuyuan-youyicun-transition-pixel-study-v1.png';
art.addEventListener('error', () => { status.textContent = '研究底图未载入，请检查图片路径。'; });
const sprite = new Image();
sprite.src = '../assets/characters/scholar-player-sprites-v1.png';

function near(point: { x: number; y: number }, radius: number): boolean {
  return Math.hypot(actor.x - point.x, actor.y - point.y) <= radius;
}

function inspect(): void {
  if (near(LIUYUAN_YOUYICUN_FEET.gardenSide, 86)) {
    if (returnWalk.crossed) {
      returnWalk = advanceReturnWalk(returnWalk, 'look-back');
      actor.dir = 0;
      status.textContent = '你转身。门圈只留下窄窄一幅来路；这只是现状圆门的图面试走。';
    } else status.textContent = '门洞就在前面，先沿铺地走过去。';
  } else if (near(LIUYUAN_YOUYICUN_FEET.gateFront, 95)
    || near(LIUYUAN_YOUYICUN_FEET.threshold, 75)) {
    status.textContent = '门里还看得见一截铺地，走过去，景就窄了。';
  } else if (near(LIUYUAN_YOUYICUN_FEET.onward, 80)) {
    status.textContent = returnWalk.lookedBack
      ? '图面到此为止。若要另看石林研究片段，可按 F；本圆门不能推定四面厅门位。'
      : '身后的门圈还没回望；本圆门与旧厅廊的关系尚未核实。';
  } else {
    status.textContent = '沿脚下石路走，先从圆门穿过去，再回头看。';
  }
}

const directions: Readonly<Record<string, string>> = {
  arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down',
  arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
};
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === ' ' && (event.target instanceof HTMLButtonElement ||
      event.target instanceof HTMLInputElement)) return;
  if (key === 'e' || key === ' ') {
    event.preventDefault(); if (!event.repeat) inspect(); return;
  }
  if (key === 'f') { event.preventDefault(); if (!event.repeat) continueResearch(); return; }
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
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
    button.addEventListener(type, () => pressed.delete(direction));
  }
}
look.addEventListener('click', inspect);
restart.addEventListener('click', () => {
  actor.x = LIUYUAN_YOUYICUN_SPAWN.x; actor.y = LIUYUAN_YOUYICUN_SPAWN.y;
  actor.dir = 2; keys.clear(); pressed.clear();
  returnWalk = { ...INITIAL_RETURN_WALK };
  researchContinue.hidden = true;
  status.textContent = '你回到这张圆门研究图的起点。';
});

function tracePolygon(points: readonly (readonly [number, number])[]): void {
  ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
}

function drawDebug(): void {
  ctx.save();
  ctx.globalAlpha = .46;
  for (let y = 0; y < scene.h; y++) for (let x = 0; x < scene.w; x++) {
    const tile = scene.map[y * scene.w + x];
    if (tile !== T.WALL) {
      ctx.fillStyle = tile === T.CORR ? '#36c5cf' : '#55c68b';
      ctx.fillRect(x * 16, y * 16, 16, 16);
    }
  }
  ctx.globalAlpha = .7;
  ctx.fillStyle = '#e55b51';
  for (const object of geometry) for (const shape of object.colliders ?? []) {
    if ('x' in shape) ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
    else { tracePolygon(shape.points); ctx.fill(); }
  }
  ctx.restore();
  for (const object of geometry) for (const polygon of object.occluder?.polygons ?? []) {
    ctx.strokeStyle = '#39d7e0'; ctx.lineWidth = 3;
    tracePolygon(polygon); ctx.stroke();
  }
  for (const foot of Object.values(LIUYUAN_YOUYICUN_FEET)) {
    ctx.fillStyle = '#f1df98'; ctx.fillRect(foot.x - 4, foot.y - 4, 8, 8);
  }
  const p = STANDARD_PLAYER_PROFILE;
  ctx.strokeStyle = '#ff68ab'; ctx.lineWidth = 2;
  ctx.strokeRect(actor.x - p.halfW, actor.y - p.topInset,
    p.halfW * 2, p.topInset - p.bottomInset);
}

function draw(): void {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#626c62'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(canvas.width / LIUYUAN_YOUYICUN_WORLD_W, canvas.height / LIUYUAN_YOUYICUN_WORLD_H);
  if (art.complete && art.naturalWidth) ctx.drawImage(art, 0, 0,
    LIUYUAN_YOUYICUN_WORLD_W, LIUYUAN_YOUYICUN_WORLD_H);
  const scale = LIUYUAN_YOUYICUN_ACTOR_SCALE;
  const height = Math.round(perspectiveScholarHeight(actor.y,
    scale.farFootY, scale.nearFootY, scale.farHeight, scale.nearHeight) * actorScalePercent / 100);
  drawScholarGroundShadow(ctx, actor.x, actor.y, height);
  if (sprite.complete && sprite.naturalWidth) {
    const frame = actor.moving ? 1 + Math.floor(actor.walkTime * 6) % 2 : 0;
    drawScholarAtFoot(ctx, sprite, actor.dir, frame, actor.x, actor.y, height);
  }
  if (art.complete && art.naturalWidth) for (const object of geometry) {
    const occluder = object.occluder;
    if (!occluder || actor.y >= occluder.depthY) continue;
    ctx.save(); ctx.beginPath();
    for (const polygon of occluder.polygons) {
      polygon.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
    }
    ctx.clip(); ctx.drawImage(art, 0, 0,
      LIUYUAN_YOUYICUN_WORLD_W, LIUYUAN_YOUYICUN_WORLD_H); ctx.restore();
  }
  if (showGeometry.checked) drawDebug();
  ctx.restore();
}

function tick(now: number): void {
  const dt = Math.min(.05, (now - (lastTime || now)) / 1000); lastTime = now;
  const active = (direction: string) => keys.has(direction) || pressed.has(direction);
  const dx = Number(active('right')) - Number(active('left'));
  const dy = Number(active('down')) - Number(active('up'));
  actor.moving = dx !== 0 || dy !== 0;
  if (actor.moving) {
    actor.dir = dy > 0 ? 0 : dy < 0 ? 3 : dx > 0 ? 2 : 1;
    actor.walkTime += dt;
    const length = Math.hypot(dx, dy);
    moveEntity(scene.map, actor, dx / length * 155 * dt, dy / length * 155 * dt,
      scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE);
  }
  if (!returnWalk.thresholdSeen && near(LIUYUAN_YOUYICUN_FEET.threshold, 45)) {
    returnWalk = advanceReturnWalk(returnWalk, 'threshold');
    status.textContent = '脚下跨过门槛，院墙把身后的声音收住了。';
  }
  if (returnWalk.thresholdSeen && !returnWalk.crossed && near(LIUYUAN_YOUYICUN_FEET.gardenSide, 45)) {
    returnWalk = advanceReturnWalk(returnWalk, 'inside');
    status.textContent = '到了门的另一侧。风从来路吹来，不妨回头看一眼。';
  }
  if (returnWalk.lookedBack && !returnWalk.reachedEnd && near(LIUYUAN_YOUYICUN_FEET.onward, 70)) {
    returnWalk = advanceReturnWalk(returnWalk, 'onward');
    status.textContent = '圆门几何练习到此。按 F 可另看石林研究片段；四面厅前廊的真实入口尚未核。';
  }
  researchContinue.hidden = !chapterPreview || !returnWalk.reachedEnd
    || !near(LIUYUAN_YOUYICUN_FEET.onward, 80);
  coords.hidden = !showGeometry.checked;
  if (showGeometry.checked) {
    const scale = LIUYUAN_YOUYICUN_ACTOR_SCALE;
    const height = Math.round(perspectiveScholarHeight(actor.y,
      scale.farFootY, scale.nearFootY, scale.farHeight, scale.nearHeight) * actorScalePercent / 100);
    coords.textContent = `脚点 (${Math.round(actor.x)}, ${Math.round(actor.y)}) · 人物 ${height}px（${actorScalePercent}%）/ 圆门约 ${scale.gateOpeningVisualHeight}px（图面标尺）`;
  }
  draw(); requestAnimationFrame(tick);
}
if (params.get('draft') === '1' && !draft) status.textContent = '没有可用编辑器草稿，正在使用代码候选几何。';
if (draft) status.textContent = '正在预览本幕编辑器草稿；不会改写 CH3 存档。';
if (collides(scene.map, actor.x, actor.y, scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE)) {
  status.textContent = '出生脚点被几何封住，请回编辑器校准。';
}
requestAnimationFrame(tick);
