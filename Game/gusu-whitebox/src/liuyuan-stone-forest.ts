import { STANDARD_PLAYER_PROFILE, type CollisionShape, type SceneGeometryObject } from './core/geometry.js';
import { collides, moveEntity } from './core/physics.js';
import { readScenePlateDraft } from './core/scene-plate-draft.js';
import { hasStoryFlag, loadProgress } from './core/progression.js';
import { canEnterModernReturn, modernRouteHref } from './core/liuyuan-modern-route.js';
import { guanyunStudyHref, safeStoneForestReturnFoot, stoneForestPrevious, windowStudyHref } from './core/liuyuan-research-link.js';
import {
  LIUYUAN_STONE_FOREST_DRAFT_REGIONS, LIUYUAN_STONE_FOREST_EAST_EXIT,
  LIUYUAN_STONE_FOREST_GEOMETRY, LIUYUAN_STONE_FOREST_ID,
  LIUYUAN_STONE_FOREST_PEAK_FOOT, LIUYUAN_STONE_FOREST_SPAWN,
  LIUYUAN_STONE_FOREST_WORLD_H, LIUYUAN_STONE_FOREST_WORLD_W,
  LIUYUAN_STONE_FOREST_YIFENG_FOOT, buildLiuyuanStoneForestStudyMap,
} from './data/liuyuan-stone-forest-study.js';
import { T } from './data/tiles.js';
import { LIUYUAN_CHARACTER_SCALE } from './data/liuyuan-character-scale.js';
import { drawScholarAtFoot, drawScholarGroundShadow } from './render/scholar-sprite.js';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const status = document.getElementById('status')!;
const stageNote = document.getElementById('stageNote')!;
const showGeometry = document.getElementById('showGeometry') as HTMLInputElement;
const coords = document.getElementById('coords')!;
const reset = document.getElementById('reset') as HTMLButtonElement;
const lookButton = document.getElementById('look') as HTMLButtonElement;
const toGuanyun = document.getElementById('toGuanyun') as HTMLButtonElement;
const toWindowStudy = document.getElementById('toWindowStudy') as HTMLButtonElement;
const toStudyCourt = document.getElementById('toStudyCourt') as HTMLButtonElement;
const toEastHallReturn = document.getElementById('toEastHallReturn') as HTMLButtonElement;
const routeNotice = document.getElementById('routeNotice')!;
const modeBadge = document.getElementById('modeBadge')!;
const interactionCue = document.getElementById('interactionCue')!;
const sceneMessage = document.getElementById('sceneMessage')!;
const returnToPrevious = document.getElementById('returnToPrevious') as HTMLAnchorElement;
const recallClue = document.getElementById('recallClue') as HTMLButtonElement;
const previous = stoneForestPrevious(location.search);
const fromReturnWalk = previous.fromReturnWalk;
const modernChapter = previous.fromModernRoute && hasStoryFlag(loadProgress(), 'ly-porridge-delivered');
const modernReturn = canEnterModernReturn(location.search, loadProgress(), 'study-court', 'ly-leaf-written');
if (modernChapter) {
  modeBadge.textContent = '留园 · 石林寻人';
  toStudyCourt.textContent = '循纸声 · 寻书斋';
  document.getElementById('sceneTools')!.hidden = true;
  routeNotice.textContent = '留园章采用当代导览游线的相对顺序。石林至书斋院为游戏镜头剪接，未核实具体门洞与清末走法；三窗、冠云峰仍是可选研究画面。';
}
if (modernReturn) {
  modeBadge.textContent = 'CH3 · 留园 · 石林返程';
  document.getElementById('sceneTools')!.hidden = true;
  routeNotice.textContent = '书斋院到石林按当代区域关系剪接。由轩前沿石根外的铺地回到西侧院路；出口只是游戏边界，非清末实门。';
}
returnToPrevious.href = previous.href;
returnToPrevious.textContent = previous.label;
stageNote.hidden = modernChapter || modernReturn;
returnToPrevious.hidden = !fromReturnWalk;
recallClue.hidden = !(fromReturnWalk || modernChapter) || !hasStoryFlag(loadProgress(), 'ly-florist-met');
recallClue.addEventListener('click', () => {
  if (!(fromReturnWalk || modernChapter) || !hasStoryFlag(loadProgress(), 'ly-florist-met')) return;
  status.textContent = '“笔树”还只是花匠的一句土话。石林小院里，先认清脚下的路。';
});
const previewRequested = new URLSearchParams(location.search).get('draft') === '1';
const draft = readScenePlateDraft(LIUYUAN_STONE_FOREST_ID, LIUYUAN_STONE_FOREST_WORLD_W,
  LIUYUAN_STONE_FOREST_WORLD_H, buildLiuyuanStoneForestStudyMap);
const actorHeight = Math.round(LIUYUAN_CHARACTER_SCALE.stoneForest.worldHeight * (draft?.actorScalePercent ?? 100) / 100);
const scene = buildLiuyuanStoneForestStudyMap(draft?.regions ?? LIUYUAN_STONE_FOREST_DRAFT_REGIONS);
const geometry: readonly SceneGeometryObject[] = draft?.geometry ?? LIUYUAN_STONE_FOREST_GEOMETRY;
const obstacles: readonly CollisionShape[] = geometry.flatMap((object) => object.colliders ?? []);
const actor = { x: Number(modernReturn ? LIUYUAN_STONE_FOREST_YIFENG_FOOT.x : LIUYUAN_STONE_FOREST_SPAWN.x),
  y: Number(modernReturn ? LIUYUAN_STONE_FOREST_YIFENG_FOOT.y : LIUYUAN_STONE_FOREST_SPAWN.y),
  dir: 2, moving: false, walkTime: 0 };
const mayReturnToEastHall = () => modernReturn && near(LIUYUAN_STONE_FOREST_SPAWN, 90);
toEastHallReturn.addEventListener('click', () => {
  if (mayReturnToEastHall()) location.assign(modernRouteHref('liuyuan-east-hall.html', 'stone-forest', previewRequested, true));
});
const returnedWindowFoot = safeStoneForestReturnFoot(location.search, LIUYUAN_STONE_FOREST_YIFENG_FOOT,
  (x, y) => collides(scene.map, x, y, scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE));
const returnedGuanyunFoot = safeStoneForestReturnFoot(location.search, LIUYUAN_STONE_FOREST_EAST_EXIT,
  (x, y) => collides(scene.map, x, y, scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE), 'guanyun-study');
const returnedFoot = returnedWindowFoot ?? returnedGuanyunFoot;
if (returnedFoot) {
  actor.x = returnedFoot.x; actor.y = returnedFoot.y;
  status.textContent = returnedWindowFoot
    ? '你回到轩前。三窗纸角仍是独立研究，石林真实通路还未接上。'
    : '你回到石林东侧廊口。冠云峰场景是研究剪接，真实门位仍待核。';
}
const keys = new Set<string>(), pressed = new Set<string>();
let windowStudyReady = Boolean(returnedWindowFoot);
let guanyunStudyReady = Boolean(returnedGuanyunFoot);
let lastTime = 0;

const art = new Image();
const pixelArt = document.createElement('canvas'); pixelArt.width = 888; pixelArt.height = 448;
const pixelCtx = pixelArt.getContext('2d')!;
let pixelArtReady = false;
art.addEventListener('load', () => {
  pixelCtx.imageSmoothingEnabled = true;
  pixelCtx.drawImage(art, 0, 0, pixelArt.width, pixelArt.height);
  pixelArtReady = true;
});
art.src = '../assets/scene25d/liuyuan-stone-forest-court-study-v2.png';
const sprite = new Image(); sprite.src = '../assets/characters/scholar-player-sprites-v1.png';

function near(point: { x: number; y: number }, radius: number): boolean {
  return Math.hypot(actor.x - point.x, actor.y - point.y) < radius;
}
function showSceneMessage(words: string): void { sceneMessage.textContent = words; sceneMessage.hidden = false; }
function interact(): void {
  if (modernReturn) {
    status.textContent = mayReturnToEastHall()
      ? '西侧院路到了。沿来路回堂前，再去檐下取空桶。'
      : '石根不能踏。沿铺地往西，走回先前看树的院子。';
    return;
  }
  if (near(LIUYUAN_STONE_FOREST_YIFENG_FOOT, 95)) {
    windowStudyReady = true;
    status.textContent = modernChapter
      ? '石边可以歇脚。廊后隐约有翻纸声，绕过去看看。'
      : '轩前的石阶很窄。想另看三窗，可按 F 或点研究按钮；那是独立画面，不是眼前这扇门。';
    if (modernChapter) showSceneMessage('石林边可歇脚。窗与石互相借景，书斋还在前头。');
    return;
  }
  if (near(LIUYUAN_STONE_FOREST_PEAK_FOOT, 135)) {
    status.textContent = '主石仿佛收着肩，旁边低石又像败蕉叶。你退开一步，孔眼里漏出后面的竹。';
    if (modernChapter) showSceneMessage(status.textContent);
    return;
  }
  if (near(LIUYUAN_STONE_FOREST_EAST_EXIT, 120)) {
    guanyunStudyReady = true;
    status.textContent = modernChapter ? '东廊明亮些，纸声却仍在石林另一侧。先回轩前的廊口看看。'
      : '东廊的光亮一些。按 F 或点按钮可另看冠云峰研究图，不是这张图上的实门。'; return;
  }
  status.textContent = '路脚就在石边，石根可不能踏。';
}
function openWindowStudy(): void {
  if (modernChapter || modernReturn) return;
  if (!near(LIUYUAN_STONE_FOREST_YIFENG_FOOT, 95)) return;
  if (!windowStudyReady) {
    status.textContent = '先在轩前停一停，看看峰石与窗，再决定是否看三窗研究。'; return;
  }
  location.href = windowStudyHref({ x: actor.x, y: actor.y }, previewRequested, fromReturnWalk, modernChapter);
}
function openGuanyunStudy(): void {
  if (modernChapter || modernReturn) return;
  if (!near(LIUYUAN_STONE_FOREST_EAST_EXIT, 120)) return;
  if (!guanyunStudyReady) {
    status.textContent = '先在东廊口看一看，再决定是否跳看冠云峰研究图。'; return;
  }
  location.href = guanyunStudyHref({ x: actor.x, y: actor.y }, previewRequested, fromReturnWalk, modernChapter);
}
toStudyCourt.addEventListener('click', () => {
  if (modernChapter && near(LIUYUAN_STONE_FOREST_YIFENG_FOOT, 95))
    location.assign(modernRouteHref('liuyuan-study-court.html', 'stone-forest', previewRequested));
});
function openNearbyResearch(): void {
  if (modernReturn) return;
  if (near(LIUYUAN_STONE_FOREST_YIFENG_FOOT, 95)) openWindowStudy();
  else if (near(LIUYUAN_STONE_FOREST_EAST_EXIT, 120)) openGuanyunStudy();
}
const directions: Record<string,string> = { arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right' };
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'e') { event.preventDefault(); if (!event.repeat) interact(); return; }
  if (key === 'f') { event.preventDefault(); if (!event.repeat) openNearbyResearch(); return; }
  const dir = directions[key]; if (dir) { event.preventDefault(); keys.add(dir); }
});
window.addEventListener('keyup', (event) => { const dir = directions[event.key.toLowerCase()]; if (dir) keys.delete(dir); });
window.addEventListener('blur', () => { keys.clear(); pressed.clear(); });
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-dir]')) {
  const dir = button.dataset.dir!;
  button.addEventListener('pointerdown', (event) => { event.preventDefault(); button.setPointerCapture(event.pointerId); pressed.add(dir); });
  button.addEventListener('pointerup', () => pressed.delete(dir));
  button.addEventListener('pointercancel', () => pressed.delete(dir));
  button.addEventListener('lostpointercapture', () => pressed.delete(dir));
}
lookButton.addEventListener('click', interact);
toWindowStudy.addEventListener('click', openWindowStudy);
toGuanyun.addEventListener('click', openGuanyunStudy);
reset.addEventListener('click', () => {
  actor.x = modernReturn ? LIUYUAN_STONE_FOREST_YIFENG_FOOT.x : LIUYUAN_STONE_FOREST_SPAWN.x;
  actor.y = modernReturn ? LIUYUAN_STONE_FOREST_YIFENG_FOOT.y : LIUYUAN_STONE_FOREST_SPAWN.y;
  actor.dir = modernReturn ? 0 : 2;
  keys.clear(); pressed.clear(); sceneMessage.hidden = true; status.textContent = '你退回西侧小院，峰石仍挡着半边路。';
  windowStudyReady = false;
  guanyunStudyReady = false;
});

function tracePolygon(points: readonly (readonly [number,number])[]): void {
  ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath();
}
function drawGeometry(): void {
  ctx.save(); ctx.globalAlpha = .48;
  for (let y = 0; y < scene.h; y++) for (let x = 0; x < scene.w; x++) {
    const tile = scene.map[y*scene.w+x];
    if (([T.PATH,T.CORR,T.PLAT,T.WATER] as readonly number[]).includes(tile)) {
      ctx.fillStyle = tile === T.WATER ? '#4c8dff' : tile === T.CORR ? '#27bfc2' : tile === T.PLAT ? '#f4d35e' : '#52d879';
      ctx.fillRect(x*16,y*16,16,16);
    }
  }
  ctx.globalAlpha = .72; ctx.fillStyle = '#ef5350';
  for (const object of geometry) for (const shape of object.colliders ?? []) {
    if ('x' in shape) { ctx.fillRect(shape.x,shape.y,shape.w,shape.h); }
    else { tracePolygon(shape.points); ctx.fill(); }
  }
  ctx.restore();
  for (const object of geometry) for (const polygon of object.occluder?.polygons ?? []) {
    tracePolygon(polygon); ctx.strokeStyle = '#35d8e6'; ctx.lineWidth = 3; ctx.stroke();
  }
  const p = STANDARD_PLAYER_PROFILE; ctx.strokeStyle = '#ff64a8'; ctx.lineWidth = 1;
  ctx.strokeRect(actor.x-p.halfW,actor.y-p.topInset,p.halfW*2,p.topInset-p.bottomInset);
}
function draw(): void {
  ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#c6c6b9'; ctx.fillRect(0,0,canvas.width,canvas.height);
  const zoom = LIUYUAN_CHARACTER_SCALE.stoneForest.cameraZoom, viewW = canvas.width/zoom, viewH = canvas.height/zoom;
  const cameraX = Math.max(0,Math.min(LIUYUAN_STONE_FOREST_WORLD_W-viewW,actor.x-viewW*.52));
  const cameraY = Math.max(0,Math.min(LIUYUAN_STONE_FOREST_WORLD_H-viewH,actor.y-viewH*.75));
  ctx.save(); ctx.scale(zoom,zoom); ctx.translate(-Math.round(cameraX),-Math.round(cameraY));
  if (art.complete && art.naturalWidth) ctx.drawImage(pixelArtReady ? pixelArt : art,0,0,
    LIUYUAN_STONE_FOREST_WORLD_W,LIUYUAN_STONE_FOREST_WORLD_H);
  drawScholarGroundShadow(ctx, actor.x, actor.y, actorHeight);
  if (sprite.complete && sprite.naturalWidth) {
    const frame = actor.moving ? 1+(Math.floor(actor.walkTime*6)%2) : 0;
    drawScholarAtFoot(ctx, sprite, actor.dir, frame, actor.x, actor.y, actorHeight);
  } else { ctx.fillStyle = '#344e44'; ctx.fillRect(actor.x-6,actor.y-38,12,38); }
  if (art.complete && art.naturalWidth) for (const object of geometry) {
    const occluder = object.occluder; if (!occluder || actor.y >= occluder.depthY) continue;
    ctx.save(); ctx.beginPath();
    for (const polygon of occluder.polygons) { polygon.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath(); }
    ctx.clip(); ctx.drawImage(pixelArtReady ? pixelArt : art,0,0,
      LIUYUAN_STONE_FOREST_WORLD_W,LIUYUAN_STONE_FOREST_WORLD_H); ctx.restore();
  }
  if (showGeometry.checked) drawGeometry(); ctx.restore();
}
function tick(now: number): void {
  const dt = Math.min(.05,(now-(lastTime||now))/1000); lastTime=now;
  const active = (dir:string) => keys.has(dir) || pressed.has(dir);
  const dx = Number(active('right'))-Number(active('left'));
  const dy = Number(active('down'))-Number(active('up'));
  actor.moving = dx !== 0 || dy !== 0;
  if (actor.moving) {
    sceneMessage.hidden = true;
    actor.dir = dy > 0 ? 0 : dy < 0 ? 3 : dx > 0 ? 2 : 1; actor.walkTime += dt;
    const length = Math.hypot(dx,dy);
    moveEntity(scene.map,actor,dx/length*95*dt,dy/length*95*dt,scene.w,scene.h,obstacles,STANDARD_PLAYER_PROFILE);
  }
  stageNote.textContent = modernReturn ? '沿铺地返回西侧，不踏峰石根脚。'
    : near(LIUYUAN_STONE_FOREST_PEAK_FOOT,145) ? '石边仅留一条铺地，脚下慢些。'
    : near(LIUYUAN_STONE_FOREST_YIFENG_FOOT,120) ? '轩前可停步，窗里仍看得见石。'
    : near(LIUYUAN_STONE_FOREST_EAST_EXIT,145) ? '东廊口可先观察，再看另一张研究图。'
    : '峰石挡住去路，铺地从两侧慢慢绕开。';
  toGuanyun.hidden = modernChapter || modernReturn || !guanyunStudyReady || !near(LIUYUAN_STONE_FOREST_EAST_EXIT, 120);
  toWindowStudy.hidden = modernChapter || modernReturn || !windowStudyReady || !near(LIUYUAN_STONE_FOREST_YIFENG_FOOT, 95);
  toEastHallReturn.hidden = !mayReturnToEastHall();
  toStudyCourt.hidden = !modernChapter || !near(LIUYUAN_STONE_FOREST_YIFENG_FOOT, 95);
  const cue = modernChapter && near(LIUYUAN_STONE_FOREST_YIFENG_FOOT, 95)
    ? '廊后有翻纸声 · 可以继续寻人' : modernChapter && near(LIUYUAN_STONE_FOREST_PEAK_FOOT, 135)
      ? 'E · 看石中竹影' : '';
  interactionCue.hidden = !cue || !sceneMessage.hidden;
  interactionCue.textContent = cue;
  coords.hidden = !showGeometry.checked;
  if (showGeometry.checked) coords.textContent = `脚点 (${Math.round(actor.x)}, ${Math.round(actor.y)})`;
  draw(); requestAnimationFrame(tick);
}
if (previewRequested && !draft) status.textContent = '没有找到可用草稿，正显示代码中的场景几何。';
if (draft) status.textContent = '正在预览编辑器草稿；铺地、峰石与遮挡已同步。';
if (collides(scene.map,actor.x,actor.y,scene.w,scene.h,obstacles,STANDARD_PLAYER_PROFILE)) {
  status.textContent = '出生点被当前几何封住，请回编辑器检查。';
}
requestAnimationFrame(tick);
