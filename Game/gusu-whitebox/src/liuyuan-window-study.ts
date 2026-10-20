import { STANDARD_PLAYER_PROFILE, type CollisionShape, type SceneGeometryObject } from './core/geometry.js';
import { collides, moveEntity } from './core/physics.js';
import { readScenePlateDraft } from './core/scene-plate-draft.js';
import {
  inspectWindow, nearestWindow, newWindowStudy, noteWindow,
  type WindowStudyView,
} from './core/liuyuan-window-study.js';
import {
  advanceShadowBeat, newShadowBeat, shadowPosition, SHADOW_TARGETS,
  SHADOW_TOTAL_BEATS, strikeShadowBeat, type ShadowBeatState,
} from './core/liuyuan-shadow-beat.js';
import { stoneForestReturnHref } from './core/liuyuan-research-link.js';
import {
  LIUYUAN_WINDOW_ROOM_DRAFT_REGIONS, LIUYUAN_WINDOW_ROOM_FEET,
  LIUYUAN_WINDOW_ROOM_GEOMETRY, LIUYUAN_WINDOW_ROOM_ID, LIUYUAN_WINDOW_ROOM_ACTOR_SCALE,
  LIUYUAN_WINDOW_ROOM_SPAWN, LIUYUAN_WINDOW_ROOM_WORLD_H,
  LIUYUAN_WINDOW_ROOM_WORLD_W, buildLiuyuanWindowRoomStudyMap,
} from './data/liuyuan-window-room-study.js';
import { T } from './data/tiles.js';
import { drawScholarGroundShadow, drawShenYanqiuAtFoot, perspectiveScholarHeight } from './render/scholar-sprite.js';

type Direction = 'left' | 'right' | 'up' | 'down';
const canvas = document.getElementById('view') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const story = document.getElementById('story')!;
const shadowGame = document.getElementById('shadowGame')!;
const shadowTarget = document.getElementById('shadowTarget')!;
const shadowMarker = document.getElementById('shadowMarker')!;
const shadowProgress = document.getElementById('shadowProgress')!;
const shadowSlow = document.getElementById('shadowSlow') as HTMLInputElement;
const params = new URLSearchParams(location.search);
const returnStone = document.getElementById('returnStone') as HTMLAnchorElement;
const returnHref = stoneForestReturnHref(location.search);
if (returnHref) { returnStone.href = returnHref; returnStone.hidden = false; }
const previewRequested = params.get('draft') === '1';
const debugGeometry = params.get('debug') === 'geometry';
const draft = readScenePlateDraft(LIUYUAN_WINDOW_ROOM_ID,
  LIUYUAN_WINDOW_ROOM_WORLD_W, LIUYUAN_WINDOW_ROOM_WORLD_H, buildLiuyuanWindowRoomStudyMap);
const actorScalePercent = draft?.actorScalePercent ?? 100;
const scene = buildLiuyuanWindowRoomStudyMap(draft?.regions ?? LIUYUAN_WINDOW_ROOM_DRAFT_REGIONS);
const geometry: readonly SceneGeometryObject[] = draft?.geometry ?? LIUYUAN_WINDOW_ROOM_GEOMETRY;
const obstacles: readonly CollisionShape[] = geometry.flatMap((object) => object.colliders ?? []);
const actor = { ...LIUYUAN_WINDOW_ROOM_SPAWN, dir: 0, moving: false, walkTime: 0 };
const pressed = new Set<Direction>();
let state = newWindowStudy();
let shadow: ShadowBeatState | null = null;
let last = 0;
shadowSlow.checked = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function drawShadow(): void {
  if (!shadow) return;
  const tolerance = shadowSlow.checked ? 0.13 : 0.085;
  shadowTarget.style.left = `${SHADOW_TARGETS[shadow.beats] * 100}%`;
  shadowTarget.style.width = `${tolerance * 200}%`;
  shadowMarker.style.left = `${shadowPosition(shadow) * 100}%`;
  shadowProgress.textContent = `${shadow.beats} / ${SHADOW_TOTAL_BEATS}`;
}
function closeShadow(): void {
  shadow = null; shadowGame.hidden = true;
}
function leaveShadow(): void {
  if (!shadow) return;
  closeShadow(); story.textContent = '你放下纸角。三处窗景还记得，随时可以再试。';
}

const art = new Image();
const pixelArt = document.createElement('canvas');
pixelArt.width = 480; pixelArt.height = 272;
const pixelCtx = pixelArt.getContext('2d')!;
let pixelArtReady = false;
art.addEventListener('load', () => {
  pixelCtx.imageSmoothingEnabled = true;
  pixelCtx.drawImage(art, 0, 0, pixelArt.width, pixelArt.height);
  pixelArtReady = true;
});
art.addEventListener('error', () => { story.textContent = '三窗底图未能载入，请检查研究图片路径。'; });
art.src = '../research-art/liuyuan-dongtian-three-windows-game-study-v2.png';
const scholar = new Image();
scholar.src = '../assets/characters/shen-yanqiu-sprites-v1.png';

function nearestFoot(): WindowStudyView {
  return nearestWindow(actor.x);
}
function nearWindow(): WindowStudyView | null {
  const view = nearestFoot();
  const foot = LIUYUAN_WINDOW_ROOM_FEET[view];
  return Math.hypot(actor.x - foot.x, actor.y - foot.y) <= 42 ? view : null;
}
function inspect(): void {
  if (shadow) { story.textContent = '先把纸角上的三道记号对好；按 Esc 可放下纸角。'; return; }
  const view = nearWindow();
  if (!view) { story.textContent = '再往窗前走两步，景才看得真切。'; return; }
  actor.dir = view === 'west' ? 1 : view === 'east' ? 2 : 3;
  const result = inspectWindow(state, view);
  state = result.state; story.textContent = result.line;
}
function note(): void {
  if (shadow) {
    const result = strikeShadowBeat(shadow, shadowSlow.checked);
    shadow = result.state;
    if (!result.hit) story.textContent = '影子错开了。手别急，三道记号从头再对；窗不必重看。';
    else if (!shadow.complete) story.textContent = `对上了第 ${shadow.beats} 道。等下一道记号入框。`;
    else {
      state = noteWindow(state, 'west').state;
      closeShadow();
      story.textContent = '三道影子终于叠合。你在纸上记下西侧蕉叶：看似相同的六角窗，窗后却是不同的景。真正去路还须绕院寻找。';
    }
    drawShadow(); return;
  }
  const view = nearWindow();
  if (!view) { story.textContent = '先靠近一扇窗，再把所见记在纸角上。'; return; }
  actor.dir = view === 'west' ? 1 : view === 'east' ? 2 : 3;
  const result = noteWindow(state, view);
  if (result.kind === 'solved' && !state.solved) {
    shadow = newShadowBeat(); shadowGame.hidden = false;
    story.textContent = '是西侧的蕉叶。你把纸角举到光里，等三道记号逐一对上。';
    drawShadow(); return;
  }
  state = result.state; story.textContent = result.line;
}

function drawDebugGeometry(): void {
  ctx.save();
  ctx.globalAlpha = .35;
  for (let y = 0; y < scene.h; y++) for (let x = 0; x < scene.w; x++) {
    if (scene.map[y * scene.w + x] !== T.WALL) {
      ctx.fillStyle = '#34d8b4'; ctx.fillRect(x * 16, y * 16, 16, 16);
    }
  }
  ctx.globalAlpha = 1;
  for (const foot of Object.values(LIUYUAN_WINDOW_ROOM_FEET)) {
    ctx.strokeStyle = '#b7ed77'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(foot.x, foot.y, 42, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#f6f2cc'; ctx.fillRect(foot.x - 2, foot.y - 2, 4, 4);
  }
  ctx.strokeStyle = '#ff5d9b'; ctx.lineWidth = 2;
  ctx.strokeRect(actor.x - STANDARD_PLAYER_PROFILE.halfW,
    actor.y - STANDARD_PLAYER_PROFILE.topInset,
    STANDARD_PLAYER_PROFILE.halfW * 2,
    STANDARD_PLAYER_PROFILE.topInset - STANDARD_PLAYER_PROFILE.bottomInset);
  const scale = LIUYUAN_WINDOW_ROOM_ACTOR_SCALE;
  const height = Math.round(perspectiveScholarHeight(actor.y,
    scale.farFootY, scale.nearFootY, scale.farHeight, scale.nearHeight) * actorScalePercent / 100);
  ctx.fillStyle = '#19251ee6'; ctx.fillRect(12, 12, 340, 30);
  ctx.fillStyle = '#f3e6bd'; ctx.font = '15px monospace';
  ctx.fillText(`actor ${height}px / middle window ~${scale.centralWindowVisualHeight}px`, 21, 32);
  ctx.restore();
}
function draw(): void {
  ctx.imageSmoothingEnabled = false;
  if (pixelArtReady) ctx.drawImage(pixelArt, 0, 0, canvas.width, canvas.height);
  else { ctx.fillStyle = '#6c7164'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  for (const view of state.inspected) {
    const foot = LIUYUAN_WINDOW_ROOM_FEET[view];
    ctx.fillStyle = '#ddc68c'; ctx.fillRect(foot.x - 3, foot.y + 10, 6, 2);
  }
  const active = nearWindow();
  if (active) {
    const foot = LIUYUAN_WINDOW_ROOM_FEET[active];
    ctx.fillStyle = '#e8cf91'; ctx.fillRect(foot.x - 11, foot.y + 14, 22, 2);
  }
  // Visual perspective varies with the foot Y; neither physics nor interaction points move.
  const scale = LIUYUAN_WINDOW_ROOM_ACTOR_SCALE;
  const height = Math.round(perspectiveScholarHeight(actor.y,
    scale.farFootY, scale.nearFootY, scale.farHeight, scale.nearHeight) * actorScalePercent / 100);
  drawScholarGroundShadow(ctx, actor.x, actor.y, height);
  if (scholar.complete && scholar.naturalWidth) {
    const frame = actor.moving ? 1 + Math.floor(actor.walkTime * 6) % 2 : 0;
    drawShenYanqiuAtFoot(ctx, scholar, actor.dir, frame, actor.x, actor.y, height);
  }
  if (debugGeometry) drawDebugGeometry();
}

function bindHold(id: string, direction: Direction): void {
  const button = document.getElementById(id) as HTMLButtonElement;
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault(); button.setPointerCapture(event.pointerId); pressed.add(direction);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const)
    button.addEventListener(type, () => pressed.delete(direction));
}
bindHold('moveUp', 'up'); bindHold('moveLeft', 'left');
bindHold('moveDown', 'down'); bindHold('moveRight', 'right');
document.getElementById('inspect')!.addEventListener('click', inspect);
document.getElementById('note')!.addEventListener('click', note);
document.getElementById('shadowLeave')!.addEventListener('click', leaveShadow);
document.getElementById('restart')!.addEventListener('click', () => {
  actor.x = LIUYUAN_WINDOW_ROOM_SPAWN.x; actor.y = LIUYUAN_WINDOW_ROOM_SPAWN.y;
  actor.dir = 0; actor.moving = false; actor.walkTime = 0;
  state = newWindowStudy(); pressed.clear();
  closeShadow();
  story.textContent = '纸角上仍是三道窗影。你退回屋中，再从头看一遍。';
});
const keyDirections: Readonly<Record<string, Direction>> = {
  arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down',
  arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
};
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (event.target instanceof HTMLInputElement &&
      (key === ' ' || key.startsWith('arrow'))) return;
  if (event.target instanceof HTMLButtonElement && key === ' ') return;
  if (keyDirections[key] || key === 'e' || key === ' ' || key === 'escape') event.preventDefault();
  if (key === 'escape' && shadow) {
    leaveShadow(); return;
  }
  if ((key === 'e' || key === ' ') && !event.repeat) {
    key === 'e' ? inspect() : note(); return;
  }
  if (keyDirections[key]) pressed.add(keyDirections[key]);
});
window.addEventListener('keyup', (event) => {
  const direction = keyDirections[event.key.toLowerCase()];
  if (direction) pressed.delete(direction);
});
window.addEventListener('blur', () => pressed.clear());

function tick(now: number): void {
  const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
  if (shadow) { shadow = advanceShadowBeat(shadow, dt, shadowSlow.checked); drawShadow(); }
  const dx = Number(pressed.has('right')) - Number(pressed.has('left'));
  const dy = Number(pressed.has('down')) - Number(pressed.has('up'));
  if (!shadow && (dx !== 0 || dy !== 0)) {
    actor.dir = dy > 0 ? 0 : dy < 0 ? 3 : dx > 0 ? 2 : 1;
    const length = Math.hypot(dx, dy);
    const beforeX = actor.x, beforeY = actor.y;
    moveEntity(scene.map, actor, dx / length * 190 * dt, dy / length * 190 * dt,
      scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE);
    actor.moving = actor.x !== beforeX || actor.y !== beforeY;
    if (actor.moving) actor.walkTime += dt;
  } else {
    actor.moving = false;
  }
  draw(); requestAnimationFrame(tick);
}
if (previewRequested && !draft) story.textContent = '尚无可用的编辑器草稿；先按这张研究图的默认脚点走一遍。';
if (draft) story.textContent = '你正在试走编辑器草稿。三窗的位置仍须由实景与年代证据复核。';
if (collides(scene.map, actor.x, actor.y, scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE))
  story.textContent = '出生点被草稿几何挡住了，请回编辑器检查。';
requestAnimationFrame(tick);
