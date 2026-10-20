import { STANDARD_PLAYER_PROFILE, type CollisionShape, type SceneGeometryObject } from './core/geometry.js';
import { collides, moveEntity } from './core/physics.js';
import { advanceStudyCourtBeat, resumeStudyCourtBeat } from './core/liuyuan-study-court-beat.js';
import type { StudyCourtBeat, StudyCourtChoice } from './core/liuyuan-study-court-beat.js';
import { readScenePlateDraft } from './core/scene-plate-draft.js';
import { canEnterModernReturn, canEnterModernRoute, modernRouteHref } from './core/liuyuan-modern-route.js';
import { commitLiuyuanChapterFlag } from './core/liuyuan-progression.js';
import { hasStoryFlag, loadProgress } from './core/progression.js';
import {
  LIUYUAN_STUDY_COURT_CORRIDOR, LIUYUAN_STUDY_COURT_DOOR,
  LIUYUAN_STUDY_COURT_DOOR_CHOICE_RADIUS, LIUYUAN_STUDY_COURT_DOOR_HEAR_RADIUS,
  LIUYUAN_STUDY_COURT_DOOR_SOUND,
  LIUYUAN_STUDY_COURT_ACTOR_HEIGHT,
  LIUYUAN_STUDY_COURT_DRAFT_REGIONS, LIUYUAN_STUDY_COURT_GEOMETRY,
  LIUYUAN_STUDY_COURT_ID, LIUYUAN_STUDY_COURT_SPAWN,
  LIUYUAN_STUDY_COURT_TREE, LIUYUAN_STUDY_COURT_WORLD_H,
  LIUYUAN_STUDY_COURT_WORLD_W, buildLiuyuanStudyCourtMap,
} from './data/liuyuan-study-court-research.js';
import { T } from './data/tiles.js';
import { LIUYUAN_CHARACTER_SCALE } from './data/liuyuan-character-scale.js';
import { drawScholarAtFoot, drawScholarGroundShadow } from './render/scholar-sprite.js';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const status = document.getElementById('status')!;
const stageNote = document.getElementById('stageNote')!;
const showGeometry = document.getElementById('showGeometry') as HTMLInputElement;
const coords = document.getElementById('coords')!;
const doorActions = document.getElementById('doorActions')!;
const doorPrompt = document.getElementById('doorPrompt')!;
const interactionCue = document.getElementById('interactionCue')!;
const sceneMessage = document.getElementById('sceneMessage')!;
const interiorResearch = document.getElementById('interiorResearch') as HTMLAnchorElement;
const backToStone = document.getElementById('backToStone') as HTMLAnchorElement;
const routeNotice = document.getElementById('routeNotice')!;
const modeBadge = document.getElementById('modeBadge')!;
const toStoneReturn = document.getElementById('toStoneReturn') as HTMLButtonElement;
const previewRequested = new URLSearchParams(location.search).get('draft') === '1';
const modernChapter = canEnterModernRoute(location.search, loadProgress(), 'stone-forest', 'ly-porridge-delivered');
const modernReturn = canEnterModernReturn(location.search, loadProgress(), 'leaf', 'ly-leaf-written');
if (modernChapter) {
  modeBadge.textContent = '留园 · 书斋门前';
  backToStone.hidden = false;
  backToStone.href = modernRouteHref('liuyuan-stone-forest.html', 'east-hall', previewRequested);
  routeNotice.textContent = '留园章：石林与读书空间的相对关系借当代资料，书斋院、门位和人物对话是游戏合成。不能据此认作清末实门。';
  interiorResearch.href = modernRouteHref('liuyuan-study-interior.html', 'study-court', previewRequested);
  interiorResearch.textContent = '轻叩之后 · 进入书斋';
}
if (modernReturn) {
  modeBadge.textContent = '留园 · 返程 · 书斋院';
  routeNotice.textContent = '从书斋门前沿院中铺地走回石林。此回程沿用当代空间关系与游戏剪接，不是清末门位复原；题叶字迹的材料表现仍是虚构。';
}
stageNote.hidden = modernChapter || modernReturn;
(document.getElementById('editorLink') as HTMLAnchorElement).hidden = modernChapter || modernReturn;
const draft = readScenePlateDraft(LIUYUAN_STUDY_COURT_ID, LIUYUAN_STUDY_COURT_WORLD_W,
  LIUYUAN_STUDY_COURT_WORLD_H, buildLiuyuanStudyCourtMap);
const scene = buildLiuyuanStudyCourtMap(draft?.regions ?? LIUYUAN_STUDY_COURT_DRAFT_REGIONS);
const geometry: readonly SceneGeometryObject[] = draft?.geometry ?? LIUYUAN_STUDY_COURT_GEOMETRY;
const obstacles: readonly CollisionShape[] = geometry.flatMap((object) => object.colliders ?? []);
const actorHeight = Math.round(LIUYUAN_STUDY_COURT_ACTOR_HEIGHT * (draft?.actorScalePercent ?? 100) / 100);
const actor = { x: Number(modernReturn ? LIUYUAN_STUDY_COURT_DOOR.x : LIUYUAN_STUDY_COURT_SPAWN.x),
  y: Number(modernReturn ? LIUYUAN_STUDY_COURT_DOOR.y : LIUYUAN_STUDY_COURT_SPAWN.y),
  dir: 3, moving: false, walkTime: 0 };
const mayReturnToStone = () => modernReturn && near(LIUYUAN_STUDY_COURT_SPAWN, 85);
toStoneReturn.addEventListener('click', () => {
  if (mayReturnToStone()) location.assign(modernRouteHref('liuyuan-stone-forest.html', 'study-court', previewRequested, true));
});
const keys = new Set<string>(), pressed = new Set<string>();
const art = new Image(); art.src = '../assets/scene25d/liuyuan-study-court-research-v1.png';
const sprite = new Image(); sprite.src = '../assets/characters/scholar-player-sprites-v1.png';
let lastTime = 0;
const chapterBeat = (): StudyCourtBeat => resumeStudyCourtBeat(modernChapter
  && hasStoryFlag(loadProgress(), 'ly-study-found'));
let beat: StudyCourtBeat = chapterBeat();

function near(point: { x: number; y: number }, radius: number): boolean {
  return Math.hypot(actor.x - point.x, actor.y - point.y) < radius;
}
function showSceneMessage(words: string): void { sceneMessage.textContent = words; sceneMessage.hidden = false; }
function interact(): void {
  if (modernReturn) {
    status.textContent = mayReturnToStone()
      ? '院口在前。沿来路回石林，叶片先托在手中。'
      : '纸声留在身后。沿花台外的铺地走回院口。';
    showSceneMessage(status.textContent);
    return;
  }
  if (near(LIUYUAN_STUDY_COURT_DOOR, LIUYUAN_STUDY_COURT_DOOR_CHOICE_RADIUS)) {
    if (!beat.heard) hearFromDoor();
    else status.textContent = '门虚掩着。你可以先听一听，也可以轻叩。';
  } else if (near(LIUYUAN_STUDY_COURT_DOOR_SOUND, LIUYUAN_STUDY_COURT_DOOR_HEAR_RADIUS)) {
    if (!beat.heard) hearFromDoor();
    else status.textContent = '纸声从台阶上方传来，门仍虚掩着。';
  } else if (near(LIUYUAN_STUDY_COURT_TREE, 125)) {
    status.textContent = '树影落在花台上；从湖石旁绕过去，脚步声便轻了。';
  } else if (near(LIUYUAN_STUDY_COURT_CORRIDOR, 100)) {
    status.textContent = '廊子转过一角，外头的声音渐渐听不见了。';
  } else status.textContent = '院中有风，书斋的门在树影那边。';
  if (!beat.heard || !near(LIUYUAN_STUDY_COURT_DOOR, LIUYUAN_STUDY_COURT_DOOR_CHOICE_RADIUS))
    showSceneMessage(status.textContent);
}
function hearFromDoor(): void {
  const next = advanceStudyCourtBeat(beat, 'hear');
  beat = next.beat;
  if (next.line) { status.textContent = next.line; doorPrompt.textContent = next.line; }
}
function chooseAtDoor(choice: StudyCourtChoice): void {
  if (!near(LIUYUAN_STUDY_COURT_DOOR, LIUYUAN_STUDY_COURT_DOOR_CHOICE_RADIUS) || !beat.heard) return;
  const next = advanceStudyCourtBeat(beat, choice);
  beat = next.beat;
  if (next.line) { status.textContent = next.line; doorPrompt.textContent = next.line; }
  if (choice === 'knock' && next.beat.choice === 'knock') {
    if (modernChapter) commitLiuyuanChapterFlag('ly-study-found');
    interiorResearch.hidden = false;
    if (modernChapter) interiorResearch.textContent = '轻叩之后 · 进入书斋';
    showSceneMessage(status.textContent);
  }
}
const directions: Record<string,string> = { arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right' };
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'e') { event.preventDefault(); if (!event.repeat) interact(); return; }
  if (key === '1' || key === '2') {
    if (!doorActions.hidden) { event.preventDefault(); if (!event.repeat) chooseAtDoor(key === '1' ? 'listen' : 'knock'); }
    return;
  }
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
document.getElementById('look')!.addEventListener('click', interact);
for (const button of doorActions.querySelectorAll<HTMLButtonElement>('[data-choice]')) {
  button.addEventListener('click', () => chooseAtDoor(button.dataset.choice as StudyCourtChoice));
}
document.getElementById('reset')!.addEventListener('click', () => {
  actor.x = modernReturn ? LIUYUAN_STUDY_COURT_DOOR.x : LIUYUAN_STUDY_COURT_SPAWN.x;
  actor.y = modernReturn ? LIUYUAN_STUDY_COURT_DOOR.y : LIUYUAN_STUDY_COURT_SPAWN.y;
  actor.dir = modernReturn ? 0 : 3;
  keys.clear(); pressed.clear(); beat = chapterBeat();
  doorActions.hidden = true; interiorResearch.hidden = true;
  sceneMessage.hidden = true;
  status.textContent = modernReturn ? '你回到书斋门前；沿铺地走向院口。'
    : beat.choice === 'knock' ? '这扇门已轻叩过。沿铺地走回门前，就能再入屋。'
    : '你回到院中，先从树旁认路。';
});
function trace(points: readonly (readonly [number,number])[]): void {
  ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath();
}
function drawGeometry(): void {
  ctx.save(); ctx.globalAlpha = .48;
  for (let y = 0; y < scene.h; y++) for (let x = 0; x < scene.w; x++) {
    const tile = scene.map[y*scene.w+x]; if (tile === T.WALL) continue;
    ctx.fillStyle = tile === T.WATER ? '#4c8dff' : tile === T.CORR ? '#27bfc2' : '#52d879';
    ctx.fillRect(x*16,y*16,16,16);
  }
  ctx.globalAlpha = .72; ctx.fillStyle = '#ef5350';
  for (const object of geometry) for (const shape of object.colliders ?? []) {
    if ('x' in shape) ctx.fillRect(shape.x,shape.y,shape.w,shape.h);
    else { trace(shape.points); ctx.fill(); }
  }
  ctx.restore();
  for (const object of geometry) for (const polygon of object.occluder?.polygons ?? []) {
    trace(polygon); ctx.strokeStyle = '#35d8e6'; ctx.lineWidth = 3; ctx.stroke();
  }
  const p = STANDARD_PLAYER_PROFILE; ctx.strokeStyle = '#ff64a8'; ctx.lineWidth = 1;
  ctx.strokeRect(actor.x-p.halfW,actor.y-p.topInset,p.halfW*2,p.topInset-p.bottomInset);
}
function draw(): void {
  ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#c6c6b9'; ctx.fillRect(0,0,canvas.width,canvas.height);
  const zoom = LIUYUAN_CHARACTER_SCALE.studyCourt.cameraZoom, viewW = canvas.width/zoom, viewH = canvas.height/zoom;
  const cameraX = Math.max(0,Math.min(LIUYUAN_STUDY_COURT_WORLD_W-viewW,actor.x-viewW*.52));
  const cameraY = Math.max(0,Math.min(LIUYUAN_STUDY_COURT_WORLD_H-viewH,actor.y-viewH*.7));
  ctx.save(); ctx.scale(zoom,zoom); ctx.translate(-Math.round(cameraX),-Math.round(cameraY));
  if (art.complete && art.naturalWidth) ctx.drawImage(art,0,0,LIUYUAN_STUDY_COURT_WORLD_W,LIUYUAN_STUDY_COURT_WORLD_H);
  drawScholarGroundShadow(ctx, actor.x, actor.y, actorHeight);
  if (sprite.complete && sprite.naturalWidth) {
    const frame = actor.moving ? 1+(Math.floor(actor.walkTime*6)%2) : 0;
    drawScholarAtFoot(ctx,sprite,actor.dir,frame,actor.x,actor.y,actorHeight);
  } else { ctx.fillStyle = '#344e44'; ctx.fillRect(actor.x-6,actor.y-38,12,38); }
  if (art.complete && art.naturalWidth) for (const object of geometry) {
    const occluder = object.occluder; if (!occluder || actor.y >= occluder.depthY) continue;
    ctx.save(); ctx.beginPath();
    for (const polygon of occluder.polygons) polygon.forEach(([x,y],i) => {
      if (i) ctx.lineTo(x,y); else ctx.moveTo(x,y);
      if (i === polygon.length-1) ctx.closePath();
    });
    ctx.clip(); ctx.drawImage(art,0,0,LIUYUAN_STUDY_COURT_WORLD_W,LIUYUAN_STUDY_COURT_WORLD_H); ctx.restore();
  }
  if (showGeometry.checked) drawGeometry(); ctx.restore();
}
function tick(now: number): void {
  const dt = Math.min(.05,(now-(lastTime||now))/1000); lastTime = now;
  const active = (dir: string) => keys.has(dir) || pressed.has(dir);
  const dx = Number(active('right'))-Number(active('left'));
  const dy = Number(active('down'))-Number(active('up'));
  actor.moving = dx !== 0 || dy !== 0;
  if (actor.moving) {
    sceneMessage.hidden = true;
    actor.dir = dy > 0 ? 0 : dy < 0 ? 3 : dx > 0 ? 2 : 1; actor.walkTime += dt;
    const length = Math.hypot(dx,dy);
    moveEntity(scene.map,actor,dx/length*100*dt,dy/length*100*dt,scene.w,scene.h,obstacles,STANDARD_PLAYER_PROFILE);
  }
  if (!modernReturn && near(LIUYUAN_STUDY_COURT_DOOR_SOUND, LIUYUAN_STUDY_COURT_DOOR_HEAR_RADIUS) && !beat.heard) hearFromDoor();
  doorActions.hidden = modernReturn || !beat.heard || beat.choice === 'knock'
    || !near(LIUYUAN_STUDY_COURT_DOOR, LIUYUAN_STUDY_COURT_DOOR_CHOICE_RADIUS);
  interiorResearch.hidden = modernReturn || beat.choice !== 'knock'
    || !near(LIUYUAN_STUDY_COURT_DOOR, LIUYUAN_STUDY_COURT_DOOR_CHOICE_RADIUS);
  toStoneReturn.hidden = !mayReturnToStone();
  const cue = !modernReturn && !beat.heard && near(LIUYUAN_STUDY_COURT_DOOR_SOUND, LIUYUAN_STUDY_COURT_DOOR_HEAR_RADIUS)
    ? 'E · 听门里的纸声' : '';
  interactionCue.hidden = !cue || !doorActions.hidden || !sceneMessage.hidden;
  interactionCue.textContent = cue;
  stageNote.textContent = modernReturn ? '沿院中铺地走回入口，不踏进树石花台。'
    : near(LIUYUAN_STUDY_COURT_DOOR, LIUYUAN_STUDY_COURT_DOOR_CHOICE_RADIUS) ? '门虚掩着。先听，还是轻叩？'
    : beat.heard && near(LIUYUAN_STUDY_COURT_DOOR_SOUND, LIUYUAN_STUDY_COURT_DOOR_HEAR_RADIUS) ? '纸声隔着石阶；门在近前。'
    : near(LIUYUAN_STUDY_COURT_TREE,130) ? '花台占着院心，沿铺地绕行。'
    : '院墙围住声音，书斋在西侧。';
  coords.hidden = !showGeometry.checked;
  if (showGeometry.checked) coords.textContent = `脚点 (${Math.round(actor.x)}, ${Math.round(actor.y)})`;
  draw(); requestAnimationFrame(tick);
}
if (modernChapter && beat.choice === 'knock')
  status.textContent = '门已经轻叩过。沿院中铺地走回门前，可继续书斋里的事。';
if (previewRequested && !draft) status.textContent = '未找到本幕草稿，显示代码中的几何初稿。';
if (previewRequested && !modernChapter) interiorResearch.href += '?draft=1';
if (draft) status.textContent = '正在预览编辑器草稿；图面、碰撞与人物比例已同步。';
if (collides(scene.map,actor.x,actor.y,scene.w,scene.h,obstacles,STANDARD_PLAYER_PROFILE))
  status.textContent = '出生点被当前几何封住，请回编辑器检查。';
requestAnimationFrame(tick);
