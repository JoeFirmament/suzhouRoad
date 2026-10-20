import { STANDARD_PLAYER_PROFILE, type CollisionShape } from './core/geometry.js';
import { loadProgress } from './core/progression.js';
import { entryGeometryStamp } from './core/liuyuan-entry-resume.js';
import { collides, moveEntity } from './core/physics.js';
import { readScenePlateDraft } from './core/scene-plate-draft.js';
import {
  LIUYUAN_COURT_DRAFT_REGIONS,
  LIUYUAN_COURT_GEOMETRY,
  LIUYUAN_COURT_REQUIRED_FEET,
  LIUYUAN_COURT_SPAWN,
  LIUYUAN_COURT_WEST_EXIT,
  LIUYUAN_COURT_WINDOW_FOOT,
  LIUYUAN_COURT_WORLD_H,
  LIUYUAN_COURT_WORLD_W,
  buildLiuyuanCourtStudyMap,
} from './data/liuyuan-court-study.js';
import { T } from './data/tiles.js';
import { LIUYUAN_CHARACTER_SCALE } from './data/liuyuan-character-scale.js';
import { drawScholarAtFoot, drawScholarGroundShadow } from './render/scholar-sprite.js';
import { carryingLiuyuanPorridge, drawLiuyuanPorridgeBucket } from './render/liuyuan-bucket.js';
import { lvyinSceneUrl } from './core/liuyuan-view-memory.js';
import { canEnterModernReturn, modernRouteHref } from './core/liuyuan-modern-route.js';

const SCENE_ID = 'liuyuan-tree-court-no-water-study-v1';
const canvas = document.getElementById('scene') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const status = document.getElementById('status')!;
const stageNote = document.getElementById('stageNote')!;
const showGeometry = document.getElementById('showGeometry') as HTMLInputElement;
const coords = document.getElementById('coords')!;
const reset = document.getElementById('reset') as HTMLButtonElement;
const lookButton = document.getElementById('look') as HTMLButtonElement;
const continueChapter = document.getElementById('continueChapter') as HTMLButtonElement;
const toEntryReturn = document.getElementById('toEntryReturn') as HTMLButtonElement;
const routeNotice = document.getElementById('routeNotice')!;
const sceneParams = new URLSearchParams(location.search);
const chapterMode = sceneParams.get('chapter') === '1';
const modernReturn = canEnterModernReturn(location.search, loadProgress(), 'lvyin', 'ly-leaf-carried');
const sceneNav = document.getElementById('sceneNav') as HTMLAnchorElement;
if (chapterMode) {
  sceneNav.hidden = true;
  (document.getElementById('editorNav') as HTMLAnchorElement).hidden = true;
  document.getElementById('sceneTools')!.hidden = true;
  document.getElementById('sceneBadge')!.textContent = 'CH3 · 留园 · 小庭';
}
if (modernReturn) {
  sceneNav.hidden = true;
  (document.getElementById('editorNav') as HTMLAnchorElement).hidden = true;
  document.getElementById('sceneTools')!.hidden = true;
  document.getElementById('sceneBadge')!.textContent = 'CH3 · 留园 · 返程';
  routeNotice.textContent = '留园章返程：从池边西廊回到小庭，沿同一条铺地走向夹弄。区域关系参照现状，场景边界为游戏剪接，不是清末实门。';
}
stageNote.hidden = chapterMode || modernReturn;
const art = new Image();
const pixelArt = document.createElement('canvas');
pixelArt.width = 888; pixelArt.height = 448;
const pixelCtx = pixelArt.getContext('2d')!;
let pixelArtReady = false;
art.addEventListener('load', () => {
  pixelCtx.imageSmoothingEnabled = true;
  pixelCtx.drawImage(art, 0, 0, pixelArt.width, pixelArt.height);
  pixelArtReady = true;
});
art.src = '../assets/scene25d/liuyuan-tree-court-no-water-study-v1.png';
const sprite = new Image();
sprite.src = '../assets/characters/scholar-player-sprites-v1.png';

const previewRequested = new URLSearchParams(location.search).get('draft') === '1';
const draft = readScenePlateDraft(SCENE_ID, LIUYUAN_COURT_WORLD_W, LIUYUAN_COURT_WORLD_H,
  buildLiuyuanCourtStudyMap, LIUYUAN_COURT_REQUIRED_FEET);
const regions = draft?.regions ?? LIUYUAN_COURT_DRAFT_REGIONS;
const geometry = draft?.geometry ?? LIUYUAN_COURT_GEOMETRY;
const scene = buildLiuyuanCourtStudyMap(regions);
const obstacles: readonly CollisionShape[] = geometry.flatMap((object) => object.colliders ?? []);
// Sprite rows: down, left, right, up. The visual body is anchored at the feet.
const FACING = { down: 0, left: 1, right: 2, up: 3 } as const;
// 旧 88px 透明整格实际可见约 82–85px；以 84px 可见身高保持小庭视觉标尺。
const PLAYER_VISIBLE_HEIGHT = LIUYUAN_CHARACTER_SCALE.court.worldHeight;
const actorHeight = Math.round(PLAYER_VISIBLE_HEIGHT * (draft?.actorScalePercent ?? 100) / 100);
const carryingBucket = modernReturn || chapterMode && carryingLiuyuanPorridge(loadProgress());
const actor = { ...(modernReturn ? LIUYUAN_COURT_WEST_EXIT : LIUYUAN_COURT_SPAWN),
  dir: (modernReturn ? FACING.right : FACING.left) as number, moving: false, walkTime: 0 };
const keys = new Set<string>();
const pressed = new Set<string>();
let observed = sceneParams.get('courtWindow') === '1';
let lastTime = 0;
// Reload checkpoints are isolated from campaign progress and editor drafts.
const resumeKey = `gusu:liuyuan-court:reload-v1:${sceneParams.get('playtest') === '1' ? 'playtest' : 'campaign'}:${modernReturn ? 'return' : chapterMode ? 'chapter' : 'study'}:${previewRequested ? 'draft' : 'default'}`;
const geometryStamp = entryGeometryStamp(scene.map, obstacles);
const progressStamp = () => {
  const progress = loadProgress();
  return JSON.stringify([progress.updatedAt, [...progress.storyFlags].sort()]);
};
let leaving = false;
let lastResume = '';
let lastResumeAt = 0;
function saveResume(): void {
  if (leaving) return;
  const value = JSON.stringify({ version: 1, geometryStamp, progressStamp: progressStamp(),
    x: actor.x, y: actor.y, dir: actor.dir, observed });
  if (value === lastResume) return;
  try { sessionStorage.setItem(resumeKey, value); lastResume = value; } catch { /* Optional storage. */ }
}
function leaveScene(url: string): void {
  leaving = true;
  try { sessionStorage.removeItem(resumeKey); } catch { /* Optional storage. */ }
  location.assign(url);
}
try {
  const saved = JSON.parse(sessionStorage.getItem(resumeKey) ?? 'null');
  if (saved?.version === 1 && saved.geometryStamp === geometryStamp && saved.progressStamp === progressStamp()
    && Number.isFinite(saved.x) && Number.isFinite(saved.y)
    && saved.x >= 0 && saved.x < LIUYUAN_COURT_WORLD_W && saved.y >= 0 && saved.y < LIUYUAN_COURT_WORLD_H
    && Number.isInteger(saved.dir) && saved.dir >= 0 && saved.dir <= 3 && typeof saved.observed === 'boolean'
    && !collides(scene.map, saved.x, saved.y, scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE)) {
    actor.x = saved.x; actor.y = saved.y; actor.dir = saved.dir; observed = saved.observed;
  }
} catch { /* Corrupt or unavailable storage falls back to the normal entrance. */ }
const mayContinue = () => chapterMode && loadProgress().storyFlags.includes('ly-alley-walked')
  && Math.hypot(actor.x - LIUYUAN_COURT_WEST_EXIT.x, actor.y - LIUYUAN_COURT_WEST_EXIT.y) < 28;
const goNext = () => { if (mayContinue()) leaveScene(lvyinSceneUrl(observed, previewRequested)); };
const mayReturnToEntry = () => modernReturn && Math.hypot(actor.x-LIUYUAN_COURT_SPAWN.x,
  actor.y-LIUYUAN_COURT_SPAWN.y) < 100;
toEntryReturn.addEventListener('click', () => {
  if (mayReturnToEntry()) leaveScene(modernRouteHref('liuyuan-entry.html','court',previewRequested,true));
});

const directions: Record<string, string> = {
  arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
};

function observe(): void {
  if (modernReturn) {
    status.textContent = mayReturnToEntry() ? '小庭口到了。继续沿夹弄返回门外。'
      : '北墙的窗仍只可看，不可走。沿铺地往东。';
    return;
  }
  if (Math.hypot(actor.x - LIUYUAN_COURT_WINDOW_FOOT.x, actor.y - LIUYUAN_COURT_WINDOW_FOOT.y) > 80) {
    status.textContent = '还隔着庭院，窗影辨不真切。'; return;
  }
  observed = true;
  saveResume();
  status.textContent = '窗里只借来一线山色。要见园子，还得向西走。';
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'e') { event.preventDefault(); if (!event.repeat) {
    if (mayReturnToEntry()) toEntryReturn.click(); else if (mayContinue()) goNext(); else observe();
  } return; }
  const direction = directions[key];
  if (direction) { event.preventDefault(); keys.add(direction); }
});
window.addEventListener('keyup', (event) => {
  const direction = directions[event.key.toLowerCase()];
  if (direction) keys.delete(direction);
  saveResume();
});
window.addEventListener('blur', () => { keys.clear(); pressed.clear(); saveResume(); });
window.addEventListener('pagehide', saveResume);
document.addEventListener?.('visibilitychange', () => {
  if (document.hidden) { keys.clear(); pressed.clear(); saveResume(); }
});
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-dir]')) {
  const dir = button.dataset.dir!;
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault(); button.setPointerCapture(event.pointerId); pressed.add(dir);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
    button.addEventListener(type, () => { pressed.delete(dir); saveResume(); });
}
lookButton.addEventListener('click', observe);
continueChapter.addEventListener('click', goNext);
reset.addEventListener('click', () => {
  actor.x = modernReturn ? LIUYUAN_COURT_WEST_EXIT.x : LIUYUAN_COURT_SPAWN.x;
  actor.y = modernReturn ? LIUYUAN_COURT_WEST_EXIT.y : LIUYUAN_COURT_SPAWN.y;
  actor.dir = modernReturn ? FACING.right : FACING.left;
  keys.clear(); pressed.clear(); observed = false;
  saveResume();
  status.textContent = modernReturn ? '从小庭西廊沿石路往东走。' : '从小庭东侧向西走。';
});

function drawGeometry(): void {
  ctx.save(); ctx.globalAlpha = .5;
  for (let y = 0; y < scene.h; y++) for (let x = 0; x < scene.w; x++) {
    const tile = scene.map[y * scene.w + x];
    if (tile === T.PATH || tile === T.CORR) {
      ctx.fillStyle = tile === T.CORR ? '#27bfc2' : '#52d879';
      ctx.fillRect(x * 16, y * 16, 16, 16);
    }
  }
  ctx.globalAlpha = .75; ctx.fillStyle = '#ef5350';
  for (const object of geometry) for (const shape of object.colliders ?? []) {
    ctx.beginPath();
    if ('x' in shape) ctx.rect(shape.x, shape.y, shape.w, shape.h);
    else shape.points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  for (const object of geometry) for (const polygon of object.occluder?.polygons ?? []) {
    ctx.beginPath(); polygon.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath(); ctx.strokeStyle = '#35d8e6'; ctx.lineWidth = 3; ctx.stroke();
  }
  const p = STANDARD_PLAYER_PROFILE;
  ctx.strokeStyle = '#ff64a8'; ctx.lineWidth = 1;
  ctx.strokeRect(actor.x - p.halfW, actor.y - p.topInset,
    p.halfW * 2, p.topInset - p.bottomInset);
}

function redrawForeground(): void {
  if (!art.complete || !art.naturalWidth) return;
  for (const object of geometry) {
    const occluder = object.occluder;
    if (!occluder || actor.y >= occluder.depthY) continue;
    ctx.save(); ctx.beginPath();
    for (const polygon of occluder.polygons) {
      polygon.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
    }
    ctx.clip();
    ctx.drawImage(pixelArtReady ? pixelArt : art, 0, 0, LIUYUAN_COURT_WORLD_W, LIUYUAN_COURT_WORLD_H);
    ctx.restore();
  }
}

function draw(): void {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#c6c6b9'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const zoom = LIUYUAN_CHARACTER_SCALE.court.cameraZoom;
  const viewW = canvas.width / zoom, viewH = canvas.height / zoom;
  // 角色留在画面下三分之一，才能同时看见北墙的六扇窗与脚下通路。
  const cameraX = Math.max(0, Math.min(LIUYUAN_COURT_WORLD_W - viewW, actor.x - viewW * .55));
  const cameraY = Math.max(0, Math.min(LIUYUAN_COURT_WORLD_H - viewH, actor.y - viewH * .78));
  ctx.save(); ctx.scale(zoom, zoom); ctx.translate(-Math.round(cameraX), -Math.round(cameraY));
  if (art.complete && art.naturalWidth) ctx.drawImage(pixelArtReady ? pixelArt : art,
    0, 0, LIUYUAN_COURT_WORLD_W, LIUYUAN_COURT_WORLD_H);
  drawScholarGroundShadow(ctx, actor.x, actor.y, actorHeight);
  if (sprite.complete && sprite.naturalWidth) {
    const frame = actor.moving ? 1 + (Math.floor(actor.walkTime * 6) % 2) : 0;
    drawScholarAtFoot(ctx, sprite, actor.dir, frame, actor.x, actor.y, actorHeight);
  } else {
    ctx.fillStyle = '#344e44'; ctx.fillRect(actor.x - 5, actor.y - 22, 10, 22);
  }
  if (carryingBucket) drawLiuyuanPorridgeBucket(ctx, actor.x, actor.y, actorHeight, actor.dir, true);
  redrawForeground();
  if (showGeometry.checked) drawGeometry();
  ctx.restore();
}

function tick(now: number): void {
  const dt = Math.min(.05, (now - (lastTime || now)) / 1000); lastTime = now;
  const active = (dir: string) => keys.has(dir) || pressed.has(dir);
  const dx = Number(active('right')) - Number(active('left'));
  const dy = Number(active('down')) - Number(active('up'));
  actor.moving = dx !== 0 || dy !== 0;
  if (actor.moving) {
    actor.dir = dy > 0 ? FACING.down : dy < 0 ? FACING.up : dx > 0 ? FACING.right : FACING.left;
    actor.walkTime += dt;
    const length = Math.hypot(dx, dy);
    moveEntity(scene.map, actor, dx / length * 95 * dt, dy / length * 95 * dt,
      scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE);
  }
  const inWestPassage = actor.x < 600 && actor.y < 575;
  stageNote.textContent = modernReturn ? '沿同一条庭院石路向东，窗不是路。'
    : inWestPassage
    ? '墙近了，路仍在脚下。再往前，才会见到园内的池。'
    : '脚下是小庭石路。北墙的窗只能望，西边的廊才可走。';
  if (modernReturn) {
    status.textContent = mayReturnToEntry() ? '小庭口到了。按 E 或点按钮返回夹弄。'
      : '沿小庭铺地往东走，桶提稳。';
  } else if (Math.hypot(actor.x - LIUYUAN_COURT_WEST_EXIT.x, actor.y - LIUYUAN_COURT_WEST_EXIT.y) < 28) {
    status.textContent = mayContinue() ? '西廊尽头。继续往前，才会见池。按 E 或点“沿西廊继续”。'
      : '西廊尽头。下一段才临园内中池；独立试走止于此。';
  } else if (inWestPassage) {
    status.textContent = '廊墙渐窄，沿石路继续向前。';
  } else if (!observed && Math.hypot(actor.x - LIUYUAN_COURT_WINDOW_FOOT.x, actor.y - LIUYUAN_COURT_WINDOW_FOOT.y) < 80) {
    status.textContent = '墙上六窗漏进一点光。按 E，停下来看。';
  } else if (!observed && (status.textContent?.startsWith('还隔着') || status.textContent?.startsWith('廊墙'))) {
    status.textContent = '沿小庭铺地向西走。';
  }
  coords.hidden = !showGeometry.checked;
  continueChapter.hidden = !mayContinue();
  toEntryReturn.hidden = !mayReturnToEntry();
  if (showGeometry.checked) coords.textContent = `脚点 (${Math.round(actor.x)}, ${Math.round(actor.y)})`;
  if (now - lastResumeAt >= 250) { saveResume(); lastResumeAt = now; }
  draw(); requestAnimationFrame(tick);
}

if (previewRequested && !draft) status.textContent = '草稿未载入：可能尚未保存，或路被 Tile／物件堵断。现显示代码几何，浏览器草稿未改动。';
if (draft) status.textContent = '正在预览编辑器草稿；可走地面与遮挡已同步。';
if (chapterMode && !loadProgress().storyFlags.includes('ly-alley-walked')) {
  status.textContent = '需先从入口亲自走完夹弄；此页仍可独立试走。';
}
if (collides(scene.map, actor.x, actor.y, scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE)) {
  status.textContent = '出生点被当前几何封住，请回编辑器检查。';
}
requestAnimationFrame(tick);
