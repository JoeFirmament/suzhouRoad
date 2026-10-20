import { STANDARD_PLAYER_PROFILE, type CollisionShape, type SceneGeometryObject } from './core/geometry.js';
import { collides, moveEntity } from './core/physics.js';
import { readScenePlateDraft } from './core/scene-plate-draft.js';
import {
  GUANYUN_DRAFT_REGIONS, GUANYUN_RIGHT,
  GUANYUN_GEOMETRY, GUANYUN_ID,
  GUANYUN_VIEW, GUANYUN_SPAWN,
  GUANYUN_WORLD_H, GUANYUN_WORLD_W,
  GUANYUN_LEFT, buildGuanyunStudyMap,
} from './data/liuyuan-guanyun-study.js';
import { T } from './data/tiles.js';
import { drawScholarAtFoot, drawScholarGroundShadow } from './render/scholar-sprite.js';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const status = document.getElementById('status')!;
const stageNote = document.getElementById('stageNote')!;
const showGeometry = document.getElementById('showGeometry') as HTMLInputElement;
const coords = document.getElementById('coords')!;
const reset = document.getElementById('reset') as HTMLButtonElement;
const lookButton = document.getElementById('look') as HTMLButtonElement;
const previewRequested = new URLSearchParams(location.search).get('draft') === '1';
const draft = readScenePlateDraft(GUANYUN_ID, GUANYUN_WORLD_W,
  GUANYUN_WORLD_H, buildGuanyunStudyMap);
const actorHeight = Math.round(84 * (draft?.actorScalePercent ?? 100) / 100);
const scene = buildGuanyunStudyMap(draft?.regions ?? GUANYUN_DRAFT_REGIONS);
const geometry: readonly SceneGeometryObject[] = draft?.geometry ?? GUANYUN_GEOMETRY;
const obstacles: readonly CollisionShape[] = geometry.flatMap((object) => object.colliders ?? []);
const actor = { ...GUANYUN_SPAWN, dir: 2, moving: false, walkTime: 0 };
const keys = new Set<string>(), pressed = new Set<string>();
let lastTime = 0;

const art = new Image();
const pixelArt = document.createElement('canvas'); pixelArt.width = 768; pixelArt.height = 512;
const pixelCtx = pixelArt.getContext('2d')!;
let pixelArtReady = false;
art.addEventListener('load', () => {
  pixelCtx.imageSmoothingEnabled = true;
  pixelCtx.drawImage(art, 0, 0, pixelArt.width, pixelArt.height);
  pixelArtReady = true;
});
art.src = '../assets/scene25d/liuyuan-guanyun-court-study-v1.png';
const sprite = new Image(); sprite.src = '../assets/characters/scholar-player-sprites-v1.png';

function near(point: { x: number; y: number }, radius: number): boolean {
  return Math.hypot(actor.x - point.x, actor.y - point.y) < radius;
}
function interact(): void {
  if (near(GUANYUN_LEFT, 95)) {
    status.textContent = '西侧石路在树影里转弯。这里的通向何处，须等平面核对。'; return;
  }
  if (near(GUANYUN_VIEW, 135)) {
    status.textContent = '沼上照着石孔。风一过，峰影先散，水纹才慢慢跟上。'; return;
  }
  if (near(GUANYUN_RIGHT, 120)) {
    status.textContent = '东侧岸路贴着墙收窄。门位还不能凭画面认定。'; return;
  }
  status.textContent = '石在沼后，路在岸上。离近些，再细看。';
}
const directions: Record<string,string> = { arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right' };
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'e') { event.preventDefault(); if (!event.repeat) interact(); return; }
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
reset.addEventListener('click', () => {
  actor.x = GUANYUN_SPAWN.x; actor.y = GUANYUN_SPAWN.y; actor.dir = 2;
  keys.clear(); pressed.clear(); status.textContent = '你退回前庭，隔着水仍看得见冠云峰。';
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
  const zoom = 1.5, viewW = canvas.width/zoom, viewH = canvas.height/zoom;
  const cameraX = Math.max(0,Math.min(GUANYUN_WORLD_W-viewW,actor.x-viewW*.52));
  const cameraY = Math.max(0,Math.min(GUANYUN_WORLD_H-viewH,actor.y-viewH*.75));
  ctx.save(); ctx.scale(zoom,zoom); ctx.translate(-Math.round(cameraX),-Math.round(cameraY));
  if (art.complete && art.naturalWidth) ctx.drawImage(pixelArtReady ? pixelArt : art,0,0,
    GUANYUN_WORLD_W,GUANYUN_WORLD_H);
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
      GUANYUN_WORLD_W,GUANYUN_WORLD_H); ctx.restore();
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
    actor.dir = dy > 0 ? 0 : dy < 0 ? 3 : dx > 0 ? 2 : 1; actor.walkTime += dt;
    const length = Math.hypot(dx,dy);
    moveEntity(scene.map,actor,dx/length*95*dt,dy/length*95*dt,scene.w,scene.h,obstacles,STANDARD_PLAYER_PROFILE);
  }
  stageNote.textContent = near(GUANYUN_VIEW,145) ? '水沼在前，峰石在后。'
    : near(GUANYUN_LEFT,120) ? '左侧岸路尚待实景核对。'
    : near(GUANYUN_RIGHT,145) ? '右侧岸路尚待实景核对。'
    : '绕着浣云沼走，停在岸边望石。';
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
