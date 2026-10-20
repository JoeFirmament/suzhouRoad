import { STANDARD_PLAYER_PROFILE, type CollisionShape } from './core/geometry.js';
import { collides, moveEntity } from './core/physics.js';
import { readScenePlateDraft } from './core/scene-plate-draft.js';
import {
  LIUYUAN_LVYIN_BANK_FOOT, LIUYUAN_LVYIN_DRAFT_REGIONS, LIUYUAN_LVYIN_GEOMETRY,
  LIUYUAN_LVYIN_ID, LIUYUAN_LVYIN_PAVILION_FOOT, LIUYUAN_LVYIN_REQUIRED_FEET, LIUYUAN_LVYIN_SPAWN,
  LIUYUAN_LVYIN_WORLD_H, LIUYUAN_LVYIN_WORLD_W, buildLiuyuanLvyinStudyMap,
} from './data/liuyuan-lvyin-study.js';
import { hasStoryFlag, loadProgress } from './core/progression.js';
import { T } from './data/tiles.js';
import { LIUYUAN_CHARACTER_SCALE } from './data/liuyuan-character-scale.js';
import { drawScholarAtFoot, drawScholarGroundShadow } from './render/scholar-sprite.js';
import { carryingLiuyuanPorridge, drawLiuyuanPorridgeBucket } from './render/liuyuan-bucket.js';
import { chapterSceneHref, courtReturnUrl, lvyinBankLine } from './core/liuyuan-view-memory.js';
import { canEnterModernReturn, modernRouteHref } from './core/liuyuan-modern-route.js';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const status = document.getElementById('status')!;
const stageNote = document.getElementById('stageNote')!;
const showGeometry = document.getElementById('showGeometry') as HTMLInputElement;
const coords = document.getElementById('coords')!;
const reset = document.getElementById('reset') as HTMLButtonElement;
const lookButton = document.getElementById('look') as HTMLButtonElement;
const continueChapter = document.getElementById('continueChapter') as HTMLButtonElement;
const observePond = document.getElementById('observePond') as HTMLButtonElement;
const toCourtReturn = document.getElementById('toCourtReturn') as HTMLButtonElement;
const routeNotice = document.getElementById('routeNotice')!;
const sceneParams = new URLSearchParams(location.search);
const pixelStudy = sceneParams.get('artStudy') === 'pixel-v2';
const chapter = !pixelStudy && sceneParams.get('chapter') === '1';
const modernReturn = !pixelStudy
  && canEnterModernReturn(location.search, loadProgress(), 'flower', 'ly-leaf-carried');
const sawCourtWindow = sceneParams.get('courtWindow') === '1';
const returnCourt = document.getElementById('returnCourt') as HTMLAnchorElement;
if (pixelStudy) {
  document.title = '留园 · 绿荫轩像素语言校位';
  document.getElementById('sceneBadge')!.textContent = '留园 · 临池美术／几何独立研究；不写 CH3 状态';
  (document.getElementById('editorLink') as HTMLAnchorElement).href =
    'geometry-editor.html?scene=liuyuan-lvyin-pond-pixel-study-v2';
  returnCourt.hidden = true;
  routeNotice.textContent = '本页沿用绿荫轩原有的可走岸线和望池操作，只对照新版像素底图与人物比例。水岸、栏杆、植栽和铺地未按清末实测；不接留园章结算，也不读取旧版编辑器草稿。';
}
if (chapter) returnCourt.href = courtReturnUrl(sawCourtWindow, sceneParams.get('draft') === '1');
if (chapter) {
  (document.getElementById('editorLink') as HTMLAnchorElement).hidden = true;
  document.getElementById('toolSeparator')!.hidden = true;
  document.getElementById('sceneBadge')!.textContent = 'CH3 · 留园 · 临池';
}
if (modernReturn) {
  returnCourt.hidden = true;
  (document.getElementById('editorLink') as HTMLAnchorElement).hidden = true;
  document.getElementById('sceneTools')!.hidden = true;
  document.getElementById('sceneBadge')!.textContent = 'CH3 · 留园 · 返程';
  routeNotice.textContent = '留园章返程：沿池南石路从绿荫轩走回小庭。路径参照当代空间顺序，跨幕接口是游戏剪接；不是清末门洞实测。桶与叶片的携带方式属故事演绎。';
}
stageNote.hidden = chapter || modernReturn;
const art = new Image();
const pixelArt = document.createElement('canvas');
pixelArt.width = 888; pixelArt.height = 448;
const pixelCtx = pixelArt.getContext('2d')!;
let pixelArtReady = false;
art.addEventListener('load', () => {
  if (pixelStudy) return; // New candidate already has pixel clusters; smoothing would blur them.
  pixelCtx.imageSmoothingEnabled = true;
  pixelCtx.drawImage(art, 0, 0, pixelArt.width, pixelArt.height);
  pixelArtReady = true;
});
art.src = pixelStudy ? '../research-art/liuyuan-lvyin-pixel-language-study-v2.png'
  : '../assets/scene25d/liuyuan-lvyin-pond-study-v1.png';
const sprite = new Image();
sprite.src = '../assets/characters/scholar-player-sprites-v1.png';

const previewRequested = new URLSearchParams(location.search).get('draft') === '1';
const draft = readScenePlateDraft(pixelStudy ? 'liuyuan-lvyin-pond-pixel-study-v2' : LIUYUAN_LVYIN_ID,
  LIUYUAN_LVYIN_WORLD_W, LIUYUAN_LVYIN_WORLD_H,
  buildLiuyuanLvyinStudyMap, LIUYUAN_LVYIN_REQUIRED_FEET);
const actorHeight = Math.round(LIUYUAN_CHARACTER_SCALE.lvyin.worldHeight * (draft?.actorScalePercent ?? 100) / 100);
const carryingBucket = modernReturn || chapter && carryingLiuyuanPorridge(loadProgress());
const scene = buildLiuyuanLvyinStudyMap(draft?.regions ?? LIUYUAN_LVYIN_DRAFT_REGIONS);
const geometry = draft?.geometry ?? LIUYUAN_LVYIN_GEOMETRY;
const obstacles: readonly CollisionShape[] = geometry.flatMap((object) => object.colliders ?? []);
const actor = { ...(modernReturn ? LIUYUAN_LVYIN_PAVILION_FOOT : LIUYUAN_LVYIN_SPAWN),
  dir: modernReturn ? 2 : 1, moving: false, walkTime: 0 };
const keys = new Set<string>();
const pressed = new Set<string>();
let observed = false;
let lookingAcrossPond = false;
let lastTime = 0;
let cameraX = Number.NaN;
let cameraY = Number.NaN;
let cameraZoom = Number.NaN;
const mayContinue = () => chapter
  && hasStoryFlag(loadProgress(), 'ly-alley-walked')
  && Math.hypot(actor.x - LIUYUAN_LVYIN_PAVILION_FOOT.x, actor.y - LIUYUAN_LVYIN_PAVILION_FOOT.y) < 110;
const goNext = () => { if (mayContinue()) location.assign(chapterSceneHref('liuyuan-flower.html', previewRequested)); };
continueChapter.addEventListener('click', goNext);
const mayReturnToCourt = () => modernReturn && Math.hypot(actor.x-LIUYUAN_LVYIN_SPAWN.x,
  actor.y-LIUYUAN_LVYIN_SPAWN.y) < 105;
toCourtReturn.addEventListener('click', () => {
  if (mayReturnToCourt()) location.assign(modernRouteHref('liuyuan-court.html','lvyin',previewRequested,true));
});

const directions: Record<string, string> = {
  arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
};

function observe(): void {
  if (modernReturn) {
    status.textContent = mayReturnToCourt() ? '小庭方向到了；从这里接回同一条游戏院路。'
      : '池水在旁，脚下仍是石路。提稳空桶，沿岸走回小庭。';
    return;
  }
  if (lookingAcrossPond) {
    lookingAcrossPond = false;
    lookButton.textContent = '看';
    status.textContent = '收回目光，沿石路往轩里走。';
    return;
  }
  if (Math.hypot(actor.x - LIUYUAN_LVYIN_BANK_FOOT.x, actor.y - LIUYUAN_LVYIN_BANK_FOOT.y) < 115) {
    observed = true;
    lookingAcrossPond = true;
    lookButton.textContent = '收';
    keys.clear(); pressed.clear();
    status.textContent = lvyinBankLine(sawCourtWindow);
  } else if (Math.hypot(actor.x - LIUYUAN_LVYIN_PAVILION_FOOT.x, actor.y - LIUYUAN_LVYIN_PAVILION_FOOT.y) < 110) {
    status.textContent = observed && chapter ? '轩里有风。粥还温着；该往花房找人了。' : '轩里有风。池在栏外，脚下仍是干燥的石面。';
  } else status.textContent = '还未走到水边；沿石路向西。';
}

observePond.addEventListener('click', observe);

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'escape' && lookingAcrossPond) { event.preventDefault(); observe(); return; }
  if (key === 'e') {
    event.preventDefault();
    if (!event.repeat) { if (mayReturnToCourt()) toCourtReturn.click(); else if (mayContinue()) goNext(); else observe(); }
    return;
  }
  const direction = directions[key];
  if (direction) {
    event.preventDefault();
    if (lookingAcrossPond) observe();
    keys.add(direction);
  }
});
window.addEventListener('keyup', (event) => {
  const direction = directions[event.key.toLowerCase()];
  if (direction) keys.delete(direction);
});
window.addEventListener('blur', () => { keys.clear(); pressed.clear(); });
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-dir]')) {
  const dir = button.dataset.dir!;
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (lookingAcrossPond) observe();
    button.setPointerCapture(event.pointerId); pressed.add(dir);
  });
  button.addEventListener('pointerup', () => pressed.delete(dir));
  button.addEventListener('pointercancel', () => pressed.delete(dir));
  button.addEventListener('lostpointercapture', () => pressed.delete(dir));
}
lookButton.addEventListener('click', observe);
reset.addEventListener('click', () => {
  actor.x = modernReturn ? LIUYUAN_LVYIN_PAVILION_FOOT.x : LIUYUAN_LVYIN_SPAWN.x;
  actor.y = modernReturn ? LIUYUAN_LVYIN_PAVILION_FOOT.y : LIUYUAN_LVYIN_SPAWN.y;
  actor.dir = modernReturn ? 2 : 1;
  keys.clear(); pressed.clear(); observed = false; lookingAcrossPond = false;
  lookButton.textContent = '看';
  status.textContent = modernReturn ? '从轩前往东，沿池南石路回小庭。' : '从东侧石路向西，水声渐近。';
});

function drawGeometry(): void {
  ctx.save(); ctx.globalAlpha = .5;
  for (let y = 0; y < scene.h; y++) for (let x = 0; x < scene.w; x++) {
    const tile = scene.map[y * scene.w + x];
    if (tile === T.PATH || tile === T.CORR || tile === T.PLAT || tile === T.WATER) {
      ctx.fillStyle = tile === T.WATER ? '#4c8dff' : tile === T.CORR ? '#27bfc2' : tile === T.PLAT ? '#f4d35e' : '#52d879';
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
  ctx.strokeRect(actor.x - p.halfW, actor.y - p.topInset, p.halfW * 2, p.topInset - p.bottomInset);
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
    ctx.drawImage(pixelArtReady ? pixelArt : art, 0, 0, LIUYUAN_LVYIN_WORLD_W, LIUYUAN_LVYIN_WORLD_H);
    ctx.restore();
  }
}

function draw(): void {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#c6c6b9'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  // At the bank, E briefly adopts the student's north-westward gaze. This is a
  // camera move over the same walkable plate, not a separate/uncollidable scene.
  const targetZoom = lookingAcrossPond ? 1.12 : LIUYUAN_CHARACTER_SCALE.lvyin.cameraZoom;
  const viewW = canvas.width / targetZoom, viewH = canvas.height / targetZoom;
  const targetX = lookingAcrossPond ? 85
    : Math.max(0, Math.min(LIUYUAN_LVYIN_WORLD_W - viewW, actor.x - viewW * .55));
  const targetY = lookingAcrossPond ? 18
    : Math.max(0, Math.min(LIUYUAN_LVYIN_WORLD_H - viewH, actor.y - viewH * .78));
  cameraX = Number.isFinite(cameraX) ? cameraX + (targetX - cameraX) * .12 : targetX;
  cameraY = Number.isFinite(cameraY) ? cameraY + (targetY - cameraY) * .12 : targetY;
  cameraZoom = Number.isFinite(cameraZoom) ? cameraZoom + (targetZoom - cameraZoom) * .12 : targetZoom;
  ctx.save(); ctx.scale(cameraZoom, cameraZoom); ctx.translate(-Math.round(cameraX), -Math.round(cameraY));
  if (art.complete && art.naturalWidth) ctx.drawImage(pixelArtReady ? pixelArt : art,
    0, 0, LIUYUAN_LVYIN_WORLD_W, LIUYUAN_LVYIN_WORLD_H);
  if (!lookingAcrossPond) {
    drawScholarGroundShadow(ctx, actor.x, actor.y, actorHeight);
    if (sprite.complete && sprite.naturalWidth) {
      const frame = actor.moving ? 1 + (Math.floor(actor.walkTime * 6) % 2) : 0;
      drawScholarAtFoot(ctx, sprite, actor.dir, frame, actor.x, actor.y, actorHeight);
    } else {
      ctx.fillStyle = '#344e44'; ctx.fillRect(actor.x - 6, actor.y - 38, 12, 38);
    }
    if (carryingBucket) drawLiuyuanPorridgeBucket(ctx, actor.x, actor.y, actorHeight, actor.dir, true);
    redrawForeground();
  }
  if (showGeometry.checked) drawGeometry();
  ctx.restore();
}

function tick(now: number): void {
  const dt = Math.min(.05, (now - (lastTime || now)) / 1000); lastTime = now;
  const active = (dir: string) => keys.has(dir) || pressed.has(dir);
  const dx = Number(active('right')) - Number(active('left'));
  const dy = Number(active('down')) - Number(active('up'));
  actor.moving = !lookingAcrossPond && (dx !== 0 || dy !== 0);
  if (actor.moving) {
    // Sprite rows are down, left, right, up.
    actor.dir = dy > 0 ? 0 : dy < 0 ? 3 : dx > 0 ? 2 : 1;
    actor.walkTime += dt;
    const length = Math.hypot(dx, dy);
    moveEntity(scene.map, actor, dx / length * 95 * dt, dy / length * 95 * dt,
      scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE);
  }
  const atBank = Math.hypot(actor.x - LIUYUAN_LVYIN_BANK_FOOT.x, actor.y - LIUYUAN_LVYIN_BANK_FOOT.y) < 115;
  stageNote.textContent = lookingAcrossPond ? '从池边向西北望。按 E／Esc 收回视线，或用方向键继续走。'
    : modernReturn ? '池水在侧，不可跨栏；沿铺地回小庭。'
    : actor.x > 1300
    ? '仍在东侧石路。沿着墙脚向西，池面才会展开。'
    : atBank ? '此处可停步看水；栏外不是路。' : '轩在池南。石路与水岸分开，别跨过栏。';
  if (!modernReturn && atBank && !observed) status.textContent = '池面在眼前。按 E，停下来看一眼。';
  observePond.hidden = modernReturn || !(lookingAcrossPond || atBank && !observed);
  observePond.textContent = lookingAcrossPond ? '收回目光 · E / Esc' : '停步看池 · E';
  if (chapter || modernReturn) {
    stageNote.hidden = !lookingAcrossPond;
    if (lookingAcrossPond) stageNote.textContent = `从池边向西北望。${lvyinBankLine(sawCourtWindow)} 按 E / Esc 收回目光，或移动继续走。`;
  }
  continueChapter.hidden = !mayContinue();
  toCourtReturn.hidden = !mayReturnToCourt();
  coords.hidden = !showGeometry.checked;
  if (showGeometry.checked) coords.textContent = `脚点 (${Math.round(actor.x)}, ${Math.round(actor.y)})`;
  draw(); requestAnimationFrame(tick);
}

if (previewRequested && !draft) status.textContent = '草稿未载入：可能尚未保存，或池边通路被 Tile／物件堵断。现显示代码几何，浏览器草稿未改动。';
if (draft) status.textContent = '正在预览编辑器草稿；水岸、石路和遮挡已同步。';
if (pixelStudy && !draft && !previewRequested)
  status.textContent = '从东侧石路走到水边，再按 E 对照第一眼池景；此页不写章节进度。';
if (collides(scene.map, actor.x, actor.y, scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE)) {
  status.textContent = '出生点被当前几何封住，请回编辑器检查。';
}
requestAnimationFrame(tick);
