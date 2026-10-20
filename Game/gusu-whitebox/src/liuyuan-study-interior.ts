import { STANDARD_PLAYER_PROFILE, type CollisionShape, type SceneGeometryObject } from './core/geometry.js';
import { collides, moveEntity } from './core/physics.js';
import { readScenePlateDraft } from './core/scene-plate-draft.js';
import { canEnterModernRoute, modernRouteHref } from './core/liuyuan-modern-route.js';
import { commitLiuyuanChapterFlag } from './core/liuyuan-progression.js';
import { hasStoryFlag, loadProgress } from './core/progression.js';
import { advanceInteriorBeat, resumeInteriorBeat } from './core/liuyuan-study-interior-beat.js';
import { interiorResumeKey, readInteriorResume, writeInteriorResume } from './core/liuyuan-interior-resume.js';
import { drawingInteriorEcho } from './core/liuyuan-drawing-echo.js';
import { readLiuyuanVariant } from './core/liuyuan-text-variant.js';
import type { InteriorAnswer, InteriorBeat, InteriorPaperAnswer } from './core/liuyuan-study-interior-beat.js';
import {
  LIUYUAN_STUDY_INTERIOR_COPYIST, LIUYUAN_STUDY_INTERIOR_DESK,
  LIUYUAN_STUDY_INTERIOR_DRAFT_REGIONS, LIUYUAN_STUDY_INTERIOR_EXIT,
  LIUYUAN_STUDY_INTERIOR_GEOMETRY, LIUYUAN_STUDY_INTERIOR_ID,
  LIUYUAN_STUDY_INTERIOR_SHELF, LIUYUAN_STUDY_INTERIOR_SPAWN,
  LIUYUAN_STUDY_INTERIOR_WINDOW, LIUYUAN_STUDY_INTERIOR_WORLD_H,
  LIUYUAN_STUDY_INTERIOR_WORLD_W, buildLiuyuanStudyInteriorMap,
} from './data/liuyuan-study-interior-research.js';
import { T } from './data/tiles.js';
import { LIUYUAN_CHARACTER_SCALE } from './data/liuyuan-character-scale.js';
import { drawScholarAtFoot, drawScholarGroundShadow } from './render/scholar-sprite.js';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const status = document.getElementById('status')!;
const stageNote = document.getElementById('stageNote')!;
const choices = document.getElementById('answerChoices')!;
const paperChoices = document.getElementById('paperChoices')!;
const answerPrompt = document.getElementById('answerPrompt')!;
const paperPrompt = document.getElementById('paperPrompt')!;
const interactionCue = document.getElementById('interactionCue')!;
const sceneMessage = document.getElementById('sceneMessage')!;
const leafResearchLink = document.getElementById('leafResearchLink')!;
const leafResearchAnchor = leafResearchLink.querySelector('a') as HTMLAnchorElement;
const backToStudyCourt = document.getElementById('backToStudyCourt') as HTMLAnchorElement;
const routeNotice = document.getElementById('routeNotice')!;
const modeBadge = document.getElementById('modeBadge')!;
const showGeometry = document.getElementById('showGeometry') as HTMLInputElement;
const coords = document.getElementById('coords')!;
const previewRequested = new URLSearchParams(location.search).get('draft') === '1';
const modernChapter = canEnterModernRoute(location.search, loadProgress(), 'study-court', 'ly-study-found');
if (modernChapter) {
  modeBadge.textContent = '留园 · 笔声未停';
  backToStudyCourt.textContent = '回到书斋院';
  backToStudyCourt.href = modernRouteHref('liuyuan-study-court.html', 'stone-forest', previewRequested);
  leafResearchAnchor.href = modernRouteHref('liuyuan-leaf-writing-study.html', 'study-interior', previewRequested);
  leafResearchAnchor.textContent = '去窗外 · 试写新叶';
  routeNotice.textContent = '留园章 · 当代空间关系的游戏合成。人物、室内物件、蕉叶与“纸出门”的处境为剧情演绎，不是清末室内或规章复原；经此章的人物对白进入题叶特写后，完成题写才结算一次书艺。';
} else if (previewRequested) {
  backToStudyCourt.href = 'liuyuan-study-court.html?draft=1';
}
stageNote.hidden = modernChapter;
(document.getElementById('editorLink') as HTMLAnchorElement).hidden = modernChapter;
const draft = readScenePlateDraft(LIUYUAN_STUDY_INTERIOR_ID,
  LIUYUAN_STUDY_INTERIOR_WORLD_W, LIUYUAN_STUDY_INTERIOR_WORLD_H, buildLiuyuanStudyInteriorMap);
const scene = buildLiuyuanStudyInteriorMap(draft?.regions ?? LIUYUAN_STUDY_INTERIOR_DRAFT_REGIONS);
const geometry: readonly SceneGeometryObject[] = draft?.geometry ?? LIUYUAN_STUDY_INTERIOR_GEOMETRY;
const obstacles: readonly CollisionShape[] = geometry.flatMap((object) => object.colliders ?? []);
const actorHeight = Math.round(LIUYUAN_CHARACTER_SCALE.studyInterior.worldHeight * (draft?.actorScalePercent ?? 100) / 100);
const actor = { x: Number(LIUYUAN_STUDY_INTERIOR_SPAWN.x), y: Number(LIUYUAN_STUDY_INTERIOR_SPAWN.y),
  dir: 3, moving: false, walkTime: 0 };
const keys = new Set<string>(), pressed = new Set<string>();
const art = new Image(); art.src = '../assets/scene25d/liuyuan-study-interior-research-v1.png';
const sprite = new Image(); sprite.src = '../assets/characters/scholar-player-sprites-v1.png';
const copyist = new Image(); copyist.src = '../assets/characters/liuyuan-copyist-seated-research-v1.png';
const resumeKey = interiorResumeKey(new URLSearchParams(location.search).get('playtest') === '1', previewRequested);
const chapterBeat = (): InteriorBeat => {
  if (!modernChapter) return resumeInteriorBeat(false, false);
  const progress = loadProgress();
  return readInteriorResume(resumeKey, progress) ?? resumeInteriorBeat(
    hasStoryFlag(progress, 'ly-scholar-met'), hasStoryFlag(progress, 'ly-scholar-trouble-known'),
    hasStoryFlag(progress, 'ly-leaf-picked'));
};
let beat: InteriorBeat = chapterBeat();
function saveBeat(): void {
  if (modernChapter) writeInteriorResume(resumeKey, loadProgress(), beat);
}
window.addEventListener('pagehide', saveBeat);
let lastTime = 0;

function distance(point: { x: number; y: number }): number {
  return Math.hypot(actor.x - point.x, actor.y - point.y);
}
function showSceneMessage(words: string): void { sceneMessage.textContent = words; sceneMessage.hidden = false; }
function say(action: 'greet' | 'desk' | 'window' | 'shelf' | 'return'): void {
  const next = advanceInteriorBeat(beat, action);
  beat = next.beat;
  if (next.line) {
    const echo = modernChapter && action === 'greet' ? drawingInteriorEcho(loadProgress().knowledge) : '';
    const words = echo ? `${next.line} ${echo}` : next.line;
    status.textContent = words;
    showSceneMessage(words);
    if (next.beat.phase === 'choice') answerPrompt.textContent = `${words} 你答——`;
    if (next.beat.phase === 'paper-paused') paperPrompt.textContent = `${next.line} 你答——`;
  }
  if (modernChapter && action === 'greet' && next.beat.phase === 'choice')
    commitLiuyuanChapterFlag('ly-scholar-met');
  saveBeat();
}
function choose(answer: InteriorAnswer): void {
  if (distance(LIUYUAN_STUDY_INTERIOR_COPYIST) >= 160 || beat.phase !== 'choice') return;
  const next = advanceInteriorBeat(beat, answer);
  beat = next.beat;
  if (next.line) { status.textContent = next.line; showSceneMessage(next.line); }
  choices.hidden = true;
  saveBeat();
}
function choosePaper(answer: InteriorPaperAnswer): void {
  if (distance(LIUYUAN_STUDY_INTERIOR_COPYIST) >= 160 || beat.phase !== 'paper-paused') return;
  const next = advanceInteriorBeat(beat, answer);
  beat = next.beat;
  if (next.line) { status.textContent = next.line; showSceneMessage(next.line); }
  if (modernChapter && next.beat.phase === 'paper-rule')
    commitLiuyuanChapterFlag('ly-scholar-trouble-known');
  paperChoices.hidden = true;
  saveBeat();
}
function interact(): void {
  const targets = [
    { point: LIUYUAN_STUDY_INTERIOR_COPYIST, action: 'return' as const },
    { point: LIUYUAN_STUDY_INTERIOR_DESK, action: 'desk' as const },
    { point: LIUYUAN_STUDY_INTERIOR_WINDOW, action: 'window' as const },
    { point: LIUYUAN_STUDY_INTERIOR_SHELF, action: 'shelf' as const },
  ].map((target) => ({ ...target, distance: distance(target.point) }))
    .filter((target) => target.distance < 125)
    .sort((a, b) => a.distance - b.distance);
  const target = targets[0];
  if (target) {
    if (target.action === 'return' && beat.phase === 'silent') say('greet');
    else if (target.action === 'return' && beat.phase === 'choice') status.textContent = '他还没有回头，等你答一句。';
    else if (beat.phase === 'choice') status.textContent = '他在等你答话。';
    else say(target.action);
  } else if (distance(LIUYUAN_STUDY_INTERIOR_EXIT) < 100) {
    status.textContent = '门槛在身后。院中的风比屋里大些。';
  } else status.textContent = '脚下木板微微响了一声，他的笔没有停。';
  if (!target || beat.phase === 'choice') showSceneMessage(status.textContent);
}

const directions: Record<string,string> = { arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right' };
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'e') { event.preventDefault(); if (!event.repeat) interact(); return; }
  if (key === '1' || key === '2') {
    if (!choices.hidden) { event.preventDefault(); if (!event.repeat) choose(key === '1' ? 'search' : 'wrong'); }
    else if (!paperChoices.hidden) { event.preventDefault(); if (!event.repeat) choosePaper(key === '1' ? 'paper-ask' : 'paper-wait'); }
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
for (const button of choices.querySelectorAll<HTMLButtonElement>('[data-answer]')) {
  button.addEventListener('click', () => choose(button.dataset.answer as InteriorAnswer));
}
for (const button of paperChoices.querySelectorAll<HTMLButtonElement>('[data-paper-answer]')) {
  button.addEventListener('click', () => choosePaper(button.dataset.paperAnswer as InteriorPaperAnswer));
}
document.getElementById('look')!.addEventListener('click', interact);
document.getElementById('reset')!.addEventListener('click', () => {
  actor.x = LIUYUAN_STUDY_INTERIOR_SPAWN.x; actor.y = LIUYUAN_STUDY_INTERIOR_SPAWN.y; actor.dir = 3;
  keys.clear(); pressed.clear(); beat = chapterBeat();
  choices.hidden = true; paperChoices.hidden = true;
  leafResearchLink.hidden = true;
  sceneMessage.hidden = true;
  status.textContent = modernChapter && beat.phase === 'paper-end'
    ? '你重新站在门槛里。那句话已听见；窗外的叶还在，走回门边可继续题写。'
    : '你重新站在门槛里。那人仍在抄书。';
});
function trace(points: readonly (readonly [number,number])[]): void {
  ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath();
}
function drawGeometry(): void {
  ctx.save(); ctx.globalAlpha = .45;
  for (let y = 0; y < scene.h; y++) for (let x = 0; x < scene.w; x++) {
    const tile = scene.map[y*scene.w+x]; if (tile === T.WALL) continue;
    ctx.fillStyle = tile === T.CORR ? '#27bfc2' : '#52d879';
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
function redrawArtPolygon(polygon: readonly (readonly [number,number])[]): void {
  if (!art.complete || !art.naturalWidth) return;
  ctx.save(); trace(polygon); ctx.clip();
  ctx.drawImage(art,0,0,LIUYUAN_STUDY_INTERIOR_WORLD_W,LIUYUAN_STUDY_INTERIOR_WORLD_H); ctx.restore();
}
function drawRolledPaper(): void {
  ctx.fillStyle = 'rgba(26, 18, 12, .28)'; ctx.fillRect(420, 303, 91, 8);
  ctx.fillStyle = '#d8c9a7'; ctx.fillRect(420, 288, 88, 14);
  ctx.fillStyle = '#b8a47e'; ctx.fillRect(420, 299, 88, 4);
  ctx.fillStyle = '#f1e5ca'; ctx.fillRect(422, 288, 82, 4);
  ctx.fillStyle = '#715944'; ctx.fillRect(504, 288, 5, 14);
}
function draw(): void {
  ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#302a23'; ctx.fillRect(0,0,canvas.width,canvas.height);
  const zoom = LIUYUAN_CHARACTER_SCALE.studyInterior.cameraZoom, viewW = canvas.width/zoom, viewH = canvas.height/zoom;
  const cameraX = Math.max(0,Math.min(LIUYUAN_STUDY_INTERIOR_WORLD_W-viewW,actor.x-viewW*.52));
  const cameraY = Math.max(0,Math.min(LIUYUAN_STUDY_INTERIOR_WORLD_H-viewH,actor.y-viewH*.9));
  ctx.save(); ctx.scale(zoom,zoom); ctx.translate(-Math.round(cameraX),-Math.round(cameraY));
  if (art.complete && art.naturalWidth) ctx.drawImage(art,0,0,LIUYUAN_STUDY_INTERIOR_WORLD_W,LIUYUAN_STUDY_INTERIOR_WORLD_H);
  if (copyist.complete && copyist.naturalWidth) {
    const height = 205, width = Math.round(height * copyist.naturalWidth / copyist.naturalHeight);
    ctx.drawImage(copyist,450-Math.round(width/2),365-height,width,height);
    for (const object of geometry) if (object.id === 'study-room-writing-desk') {
      for (const polygon of object.occluder?.polygons ?? []) redrawArtPolygon(polygon);
    }
  }
  if (beat.phase === 'paper-paused') drawRolledPaper();
  drawScholarGroundShadow(ctx,actor.x,actor.y,actorHeight);
  if (sprite.complete && sprite.naturalWidth) {
    const frame = actor.moving ? 1+(Math.floor(actor.walkTime*6)%2) : 0;
    drawScholarAtFoot(ctx,sprite,actor.dir,frame,actor.x,actor.y,actorHeight);
  } else { ctx.fillStyle = '#e8dfcc'; ctx.fillRect(actor.x-8,actor.y-70,16,70); }
  for (const object of geometry) {
    const occluder = object.occluder; if (!occluder || actor.y >= occluder.depthY) continue;
    for (const polygon of occluder.polygons) redrawArtPolygon(polygon);
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
    moveEntity(scene.map,actor,dx/length*130*dt,dy/length*130*dt,
      scene.w,scene.h,obstacles,STANDARD_PLAYER_PROFILE);
  }
  if (beat.phase === 'silent' && distance(LIUYUAN_STUDY_INTERIOR_COPYIST) < 155) say('greet');
  choices.hidden = beat.phase !== 'choice' || distance(LIUYUAN_STUDY_INTERIOR_COPYIST) >= 160;
  paperChoices.hidden = beat.phase !== 'paper-paused' || distance(LIUYUAN_STUDY_INTERIOR_COPYIST) >= 160;
  leafResearchLink.hidden = beat.phase !== 'paper-end' || distance(LIUYUAN_STUDY_INTERIOR_EXIT) >= 125;
  const cue = beat.phase === 'explore' || beat.phase === 'farewell' || beat.phase === 'paper-rule'
    ? distance(LIUYUAN_STUDY_INTERIOR_DESK) < 125 ? 'E · 看案上的纸'
      : distance(LIUYUAN_STUDY_INTERIOR_WINDOW) < 125 ? 'E · 看窗外蕉影'
      : distance(LIUYUAN_STUDY_INTERIOR_COPYIST) < 125 ? 'E · 再与他交谈' : ''
    : '';
  interactionCue.hidden = !cue || !choices.hidden || !paperChoices.hidden || !sceneMessage.hidden;
  interactionCue.textContent = cue;
  stageNote.textContent = beat.phase === 'paper-paused' ? '一张纸卷起，又按回了案上。'
    : distance(LIUYUAN_STUDY_INTERIOR_WINDOW) < 130 ? '风动，蕉影落在窗格里。'
    : distance(LIUYUAN_STUDY_INTERIOR_DESK) < 135 ? '笔尖在纸上走得很慢。'
    : '书斋里安静得能听见脚下的木板。';
  coords.hidden = !showGeometry.checked;
  if (showGeometry.checked) coords.textContent = `脚点 (${Math.round(actor.x)}, ${Math.round(actor.y)})`;
  draw(); requestAnimationFrame(tick);
}
if (modernChapter && beat.phase === 'paper-end')
  status.textContent = `${readLiuyuanVariant()}回到门槛，可继续题写。`;
else if (modernChapter && beat.phase === 'paper-rule')
  status.textContent = '核本的托付已经听过，纸仍留在案上。他的视线停在窗外；你还没有找到带字出去的办法。';
else if (modernChapter && beat.phase === 'paper-window')
  status.textContent = '你已看见窗外的新叶。回到抄书人身边，再听他一句。';
else if (modernChapter && beat.phase === 'choice')
  status.textContent = '他已说过“门别关”。走近案前，再答他一句。';
if (previewRequested && !draft) status.textContent = '未找到本幕草稿，显示代码中的几何初稿。';
if (draft) status.textContent = '正在预览编辑器草稿；图面、碰撞与人物比例已同步。';
if (collides(scene.map,actor.x,actor.y,scene.w,scene.h,obstacles,STANDARD_PLAYER_PROFILE))
  status.textContent = '出生点被当前几何封住，请回编辑器检查。';
requestAnimationFrame(tick);
