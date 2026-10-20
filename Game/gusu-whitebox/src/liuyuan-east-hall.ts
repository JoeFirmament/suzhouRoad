import { STANDARD_PLAYER_PROFILE, type CollisionShape, type SceneGeometryObject } from './core/geometry.js';
import { collides, moveEntity } from './core/physics.js';
import { readScenePlateDraft } from './core/scene-plate-draft.js';
import { canEnterModernReturn, canEnterModernRoute, modernRouteHref } from './core/liuyuan-modern-route.js';
import { commitLiuyuanChapterFlag } from './core/liuyuan-progression.js';
import { hasStoryFlag, loadProgress } from './core/progression.js';
import { chapterSceneHref } from './core/liuyuan-view-memory.js';
import {
  LIUYUAN_EAST_HALL_CENTER, LIUYUAN_EAST_HALL_DOOR, LIUYUAN_EAST_HALL_DRAFT_REGIONS,
  LIUYUAN_EAST_HALL_EAST_EXIT, LIUYUAN_EAST_HALL_GEOMETRY, LIUYUAN_EAST_HALL_ID,
  LIUYUAN_EAST_HALL_LEFT_TREE, LIUYUAN_EAST_HALL_RIGHT_TREE, LIUYUAN_EAST_HALL_SPAWN,
  LIUYUAN_EAST_HALL_WORLD_H, LIUYUAN_EAST_HALL_WORLD_W, buildLiuyuanEastHallStudyMap,
} from './data/liuyuan-east-hall-study.js';
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
const continueChapter = document.getElementById('continueChapter') as HTMLButtonElement;
const toFlowerReturn = document.getElementById('toFlowerReturn') as HTMLButtonElement;
const routeNotice = document.getElementById('routeNotice')!;
const backToFlower = document.getElementById('backToFlower') as HTMLAnchorElement;
const modeBadge = document.getElementById('modeBadge')!;
const interactionCue = document.getElementById('interactionCue')!;
const sceneMessage = document.getElementById('sceneMessage')!;
const modernChapter = canEnterModernRoute(location.search, loadProgress(), 'flower', 'ly-porridge-delivered');
const modernReturn = canEnterModernReturn(location.search, loadProgress(), 'stone-forest', 'ly-leaf-written');
if (modernChapter) {
  modeBadge.textContent = '留园 · 堂前寻人';
  (document.getElementById('editorLink') as HTMLAnchorElement).hidden = true;
  document.getElementById('toolSeparator')!.hidden = true;
  routeNotice.textContent = '留园章 · 依当代导览游线剪接；这座堂前双树院及门位为游戏合成，不是历史或现状实测。';
}
if (modernReturn) {
  modeBadge.textContent = '留园 · 返程 · 堂前';
  routeNotice.textContent = '由石林向西回堂前院，再往花木作业院。两株乔木及其株位属于游戏设计；此处不是清末或当代的实测门路。';
  backToFlower.hidden = true;
  document.getElementById('sceneTools')!.hidden = true;
}
stageNote.hidden = modernChapter || modernReturn;
const previewRequested = new URLSearchParams(location.search).get('draft') === '1';
if (modernChapter) backToFlower.href = chapterSceneHref('liuyuan-flower.html', previewRequested);
else if (previewRequested) backToFlower.href = 'liuyuan-flower.html?chapter=1&draft=1';
const draft = readScenePlateDraft(LIUYUAN_EAST_HALL_ID,LIUYUAN_EAST_HALL_WORLD_W,
  LIUYUAN_EAST_HALL_WORLD_H,buildLiuyuanEastHallStudyMap);
const actorHeight = Math.round(LIUYUAN_CHARACTER_SCALE.eastHall.worldHeight * (draft?.actorScalePercent ?? 100) / 100);
const scene = buildLiuyuanEastHallStudyMap(draft?.regions ?? LIUYUAN_EAST_HALL_DRAFT_REGIONS);
const geometry: readonly SceneGeometryObject[] = draft?.geometry ?? LIUYUAN_EAST_HALL_GEOMETRY;
const obstacles: readonly CollisionShape[] = geometry.flatMap((object) => object.colliders ?? []);
const actor = { ...(modernReturn ? LIUYUAN_EAST_HALL_EAST_EXIT : LIUYUAN_EAST_HALL_SPAWN),
  dir: modernReturn ? 1 : 2, moving:false, walkTime:0 };
const keys = new Set<string>(), pressed = new Set<string>();
let lastTime = 0;

const art = new Image();
const pixelArt = document.createElement('canvas'); pixelArt.width=888; pixelArt.height=448;
const pixelCtx = pixelArt.getContext('2d')!;
let pixelArtReady=false;
art.addEventListener('load',()=>{pixelCtx.imageSmoothingEnabled=true;pixelCtx.drawImage(art,0,0,888,448);pixelArtReady=true;});
art.src='../assets/scene25d/liuyuan-east-hall-magnolia-court-study-v1.png';
const sprite=new Image(); sprite.src='../assets/characters/scholar-player-sprites-v1.png';
// The modern-route chapter may use this disclosed composite to advance the
// fictional clue, but never asserts the depicted twin trees existed here.
const seen = { left: false, right: false };
const mayContinue = () => modernChapter && hasStoryFlag(loadProgress(), 'ly-porridge-delivered')
  && near(LIUYUAN_EAST_HALL_EAST_EXIT, 120);
const mayReturnToFlower = () => modernReturn && near(LIUYUAN_EAST_HALL_SPAWN, 95);
continueChapter.addEventListener('click', () => {
  if (mayContinue()) location.assign(modernRouteHref('liuyuan-stone-forest.html', 'east-hall', previewRequested));
});
toFlowerReturn.addEventListener('click', () => {
  if (mayReturnToFlower()) location.assign(modernRouteHref('liuyuan-flower.html', 'east-hall', previewRequested, true));
});

function near(point:{x:number;y:number},r:number):boolean { return Math.hypot(actor.x-point.x,actor.y-point.y)<r; }
function showSceneMessage(words: string): void { sceneMessage.textContent = words; sceneMessage.hidden = false; }
function inspectTree(side:'left'|'right'):void {
  seen[side]=true;
  const both = seen.left && seen.right;
  const heardFlorist = hasStoryFlag(loadProgress(), 'ly-florist-met');
  if (modernChapter) commitLiuyuanChapterFlag('ly-magnolia-seen');
  const clue = heardFlorist
    ? '苞尖直立，像一支尚未落纸的笔。花匠说的“笔树”，也许就是这样的。'
    : '苞尖直立，像一支尚未落纸的笔。你记住这个模样，仍不知道看书的人在哪间屋里。';
  status.textContent = both
    ? '另一侧的苞尖也一样。树的形状相同，不能凭它断定哪间是书房。厅堂里很静，东廊还通向别处。'
    : `${clue} 厅堂里很静，东廊还通向别处。`;
  showSceneMessage(status.textContent);

}
function interact():void {
  if (modernReturn) {
    status.textContent = mayReturnToFlower()
      ? '来时的院路到了。往西回花木院，檐下的空桶还等着你。'
      : '两株树仍在堂前。沿中间石路往西走，不踏进树池。';
    return;
  }
  if (near(LIUYUAN_EAST_HALL_LEFT_TREE,125)) { inspectTree('left'); return; }
  if (near(LIUYUAN_EAST_HALL_RIGHT_TREE,130)) { inspectTree('right'); return; }
  if (near(LIUYUAN_EAST_HALL_DOOR,95)) {
    status.textContent = '门檐下很静，没有翻纸声。这里更像待客的厅堂；你要找的人或许仍在东边。';
    return;
  }
  if (near(LIUYUAN_EAST_HALL_EAST_EXIT,120)) {
    status.textContent = mayContinue()
      ? '廊子向东又折了一次，石影挡住了后面的院子。你可以绕过去看看。'
      : '这趟粥还没有送到。先回檐下放妥粥桶。';
    return;
  }
  if (near(LIUYUAN_EAST_HALL_CENTER,135)) {
    status.textContent = '石路从两棵树之间穿过。厅门安静，东边还有一折廊子。';
    return;
  }
  status.textContent='院里两边都有树。先沿石路走近看看。';
}
const directions:Record<string,string>={arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right'};
window.addEventListener('keydown',(event)=>{
  const key=event.key.toLowerCase();
  if(key==='e'){event.preventDefault();if(!event.repeat)interact();return;}
  const dir=directions[key];if(dir){event.preventDefault();keys.add(dir);}
});
window.addEventListener('keyup',(event)=>{const dir=directions[event.key.toLowerCase()];if(dir)keys.delete(dir);});
window.addEventListener('blur',()=>{keys.clear();pressed.clear();});
for(const button of document.querySelectorAll<HTMLButtonElement>('[data-dir]')){
  const dir=button.dataset.dir!;
  button.addEventListener('pointerdown',(event)=>{event.preventDefault();button.setPointerCapture(event.pointerId);pressed.add(dir);});
  button.addEventListener('pointerup',()=>pressed.delete(dir));
  button.addEventListener('pointercancel',()=>pressed.delete(dir));
  button.addEventListener('lostpointercapture',()=>pressed.delete(dir));
}
lookButton.addEventListener('click',interact);
reset.addEventListener('click',()=>{actor.x=modernReturn?LIUYUAN_EAST_HALL_EAST_EXIT.x:LIUYUAN_EAST_HALL_SPAWN.x;
  actor.y=modernReturn?LIUYUAN_EAST_HALL_EAST_EXIT.y:LIUYUAN_EAST_HALL_SPAWN.y;actor.dir=modernReturn?1:2;
  keys.clear();pressed.clear();sceneMessage.hidden=true;status.textContent=modernReturn?'你回到东侧转角，再沿堂前石路往西走。':'你退回西侧石路，厅堂仍在树后。';});

function drawGeometry():void {
  ctx.save();ctx.globalAlpha=.5;
  for(let y=0;y<scene.h;y++)for(let x=0;x<scene.w;x++){
    const tile=scene.map[y*scene.w+x];
    if(([T.PATH,T.CORR,T.PLAT,T.WATER] as readonly number[]).includes(tile)){
      ctx.fillStyle=tile===T.WATER?'#4c8dff':tile===T.CORR?'#27bfc2':tile===T.PLAT?'#f4d35e':'#52d879';
      ctx.fillRect(x*16,y*16,16,16);
    }
  }
  ctx.globalAlpha=.75;ctx.fillStyle='#ef5350';
  for(const object of geometry)for(const shape of object.colliders??[]){
    ctx.beginPath();if('x'in shape)ctx.rect(shape.x,shape.y,shape.w,shape.h);
    else shape.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
    ctx.closePath();ctx.fill();
  }
  ctx.restore();
  for(const object of geometry)for(const polygon of object.occluder?.polygons??[]){
    ctx.beginPath();polygon.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
    ctx.closePath();ctx.strokeStyle='#35d8e6';ctx.lineWidth=3;ctx.stroke();
  }
  const p=STANDARD_PLAYER_PROFILE;ctx.strokeStyle='#ff64a8';ctx.lineWidth=1;
  ctx.strokeRect(actor.x-p.halfW,actor.y-p.topInset,p.halfW*2,p.topInset-p.bottomInset);
}
function draw():void {
  ctx.imageSmoothingEnabled=false;ctx.fillStyle='#c6c6b9';ctx.fillRect(0,0,canvas.width,canvas.height);
  const zoom=LIUYUAN_CHARACTER_SCALE.eastHall.cameraZoom,viewW=canvas.width/zoom,viewH=canvas.height/zoom;
  const cameraX=Math.max(0,Math.min(LIUYUAN_EAST_HALL_WORLD_W-viewW,actor.x-viewW*.5));
  const cameraY=Math.max(0,Math.min(LIUYUAN_EAST_HALL_WORLD_H-viewH,actor.y-viewH*.78));
  ctx.save();ctx.scale(zoom,zoom);ctx.translate(-Math.round(cameraX),-Math.round(cameraY));
  if(art.complete&&art.naturalWidth)ctx.drawImage(pixelArtReady?pixelArt:art,0,0,LIUYUAN_EAST_HALL_WORLD_W,LIUYUAN_EAST_HALL_WORLD_H);
  drawScholarGroundShadow(ctx, actor.x, actor.y, actorHeight);
  if(sprite.complete&&sprite.naturalWidth){const frame=actor.moving?1+(Math.floor(actor.walkTime*6)%2):0;
    drawScholarAtFoot(ctx, sprite, actor.dir, frame, actor.x, actor.y, actorHeight);
  }else{ctx.fillStyle='#344e44';ctx.fillRect(actor.x-6,actor.y-38,12,38);}
  if(art.complete&&art.naturalWidth)for(const object of geometry){
    const occluder=object.occluder;if(!occluder||actor.y>=occluder.depthY)continue;
    ctx.save();ctx.beginPath();
    for(const polygon of occluder.polygons){polygon.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}
    ctx.clip();ctx.drawImage(pixelArtReady?pixelArt:art,0,0,LIUYUAN_EAST_HALL_WORLD_W,LIUYUAN_EAST_HALL_WORLD_H);ctx.restore();
  }
  if(showGeometry.checked)drawGeometry();ctx.restore();
}
function tick(now:number):void {
  const dt=Math.min(.05,(now-(lastTime||now))/1000);lastTime=now;
  const active=(dir:string)=>keys.has(dir)||pressed.has(dir);
  const dx=Number(active('right'))-Number(active('left')),dy=Number(active('down'))-Number(active('up'));
  actor.moving=dx!==0||dy!==0;
  if(actor.moving){sceneMessage.hidden=true;actor.dir=dy>0?0:dy<0?3:dx>0?2:1;actor.walkTime+=dt;
    const length=Math.hypot(dx,dy);
    moveEntity(scene.map,actor,dx/length*95*dt,dy/length*95*dt,scene.w,scene.h,obstacles,STANDARD_PLAYER_PROFILE);
  }
  stageNote.textContent=modernReturn?'走回堂前西侧，不踏树池。'
    : near(LIUYUAN_EAST_HALL_LEFT_TREE,150)||near(LIUYUAN_EAST_HALL_RIGHT_TREE,150)
    ? '树根在土里，石边可以停步；别踏进树池。'
    : near(LIUYUAN_EAST_HALL_DOOR,125)?'厅门在树后，门槛还未开放。':'院里两侧有树，中间留着通向厅门的石路。';
  continueChapter.hidden = !mayContinue();
  toFlowerReturn.hidden = !mayReturnToFlower();
  const cue = !modernReturn && near(LIUYUAN_EAST_HALL_LEFT_TREE, 125) && !seen.left
    ? 'E · 看左侧乔木' : !modernReturn && near(LIUYUAN_EAST_HALL_RIGHT_TREE, 130) && !seen.right
      ? 'E · 看右侧乔木' : '';
  interactionCue.hidden = !cue || !sceneMessage.hidden;
  interactionCue.textContent = cue;
  coords.hidden=!showGeometry.checked;
  if(showGeometry.checked)coords.textContent=`脚点 (${Math.round(actor.x)}, ${Math.round(actor.y)}) · 双树 ${Number(seen.left)+Number(seen.right)}/2`;
  draw();requestAnimationFrame(tick);
}
if(previewRequested&&!draft)status.textContent='没有找到可用草稿，正显示代码中的场景几何。';
if(draft)status.textContent='正在预览编辑器草稿；可走面、树池与遮挡已同步。';
if(collides(scene.map,actor.x,actor.y,scene.w,scene.h,obstacles,STANDARD_PLAYER_PROFILE))status.textContent='出生点被当前几何封住，请回编辑器检查。';
requestAnimationFrame(tick);
