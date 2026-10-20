import { STANDARD_PLAYER_PROFILE, type CollisionShape } from './core/geometry.js';
import { collides, moveEntity } from './core/physics.js';
import { readScenePlateDraft } from './core/scene-plate-draft.js';
import { canReturnFromCompletedAlbum, loadCompositionDraft } from './core/liuyuan-composition-save.js';
import { advanceFloristBeat, type FloristBeatAction, type FloristBeatState } from './core/liuyuan-florist-beat.js';
import { commitLiuyuanChapterFlag, rememberLiuyuanFloristClue, awardLiuyuanRainShadow, rememberLiuyuanDrawing } from './core/liuyuan-progression.js';
import { createRainShadowUI } from './ui/liuyuan-rain-shadow.js';
import { drawDrawingIncident } from './render/liuyuan-drawing-incident.js';
import type { RainShadow } from './core/liuyuan-rain-shadow.js';
import { canEnterModernReturn, modernRouteHref } from './core/liuyuan-modern-route.js';
import { hasStoryFlag, loadProgress } from './core/progression.js';
import {
  LIUYUAN_FLOWER_BUCKET, LIUYUAN_FLOWER_DRAFT_REGIONS, LIUYUAN_FLOWER_EAST_EXIT,
  LIUYUAN_FLOWER_GEOMETRY, LIUYUAN_FLOWER_ID, LIUYUAN_FLOWER_REQUIRED_FEET,
  LIUYUAN_FLOWER_SPAWN, LIUYUAN_FLOWER_WORKER, LIUYUAN_FLOWER_WORKER_STAND, LIUYUAN_FLOWER_WORLD_H,
  LIUYUAN_FLOWER_WORLD_W, buildLiuyuanFlowerStudyMap,
} from './data/liuyuan-flower-study.js';
import { T } from './data/tiles.js';
import { LIUYUAN_CHARACTER_SCALE } from './data/liuyuan-character-scale.js';
import { drawScholarAtFoot, drawScholarGroundShadow } from './render/scholar-sprite.js';
import { carryingLiuyuanPorridge, drawLiuyuanPorridgeBucket } from './render/liuyuan-bucket.js';
import { chapterSceneHref } from './core/liuyuan-view-memory.js';
import { compositionRouteHref } from './core/liuyuan-composition-route.js';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const status = document.getElementById('status')!;
const stageNote = document.getElementById('stageNote')!;
const showGeometry = document.getElementById('showGeometry') as HTMLInputElement;
const coords = document.getElementById('coords')!;
const reset = document.getElementById('reset') as HTMLButtonElement;
const lookButton = document.getElementById('look') as HTMLButtonElement;
const dialogueActions = document.getElementById('dialogueActions') as HTMLElement;
const dialoguePrompt = document.getElementById('dialoguePrompt')!;
const leafCarryPrompt = document.getElementById('leafCarryPrompt')!;
const sceneMessage = document.getElementById('sceneMessage')!;
const interactionCue = document.getElementById('interactionCue')!;
const askStudy = document.getElementById('askStudy') as HTMLButtonElement;
const watchSoil = document.getElementById('watchSoil') as HTMLButtonElement;
const recallClue = document.getElementById('recallClue') as HTMLButtonElement;
const borrowAlbum = document.getElementById('borrowAlbum') as HTMLButtonElement;
const continueChapter = document.getElementById('continueChapter') as HTMLButtonElement;
const helpDrawing = document.getElementById('helpDrawing') as HTMLButtonElement;
const drawingPanel = document.getElementById('lanternPuzzle')!;
let drawingOpen = false;
let drawingPractice = false;
const drawingFoot = { x: LIUYUAN_FLOWER_WORKER.x + 70, y: LIUYUAN_FLOWER_WORKER.y + 70 };
function drawingAvailable(): boolean {
  return chapter && !modernReturn && hasStoryFlag(loadProgress(), 'ly-porridge-delivered')
    && !loadProgress().knowledge.includes('liuyuan-album-orchid-leaf');
}
function drawingIsNearest(): boolean {
  const distance = Math.hypot(actor.x - drawingFoot.x, actor.y - drawingFoot.y);
  return drawingAvailable() && distance < 90
    && distance <= Math.hypot(actor.x - LIUYUAN_FLOWER_WORKER.x, actor.y - LIUYUAN_FLOWER_WORKER.y)
    && distance <= Math.hypot(actor.x - LIUYUAN_FLOWER_BUCKET.x, actor.y - LIUYUAN_FLOWER_BUCKET.y);
}
const drawingGame = createRainShadowUI(finishDrawing, leaveDrawing, true);
function openDrawing(practice = false): void {
  if (drawingOpen || transitionUrl || (!practice && !drawingIsNearest())) return;
  drawingPractice = practice; drawingOpen = true;
  keys.clear(); pressed.clear(); dialogueActions.hidden = true; sceneMessage.hidden = true;
  drawingPanel.hidden = false;
  document.getElementById('drawingShade')!.hidden = false;
  drawingGame.show();
}
function closeDrawing(): void {
  drawingOpen = false; drawingPanel.hidden = true; drawingGame.close();
  document.getElementById('drawingShade')!.hidden = true;
  keys.clear(); pressed.clear(); helpDrawing.focus?.();
}
function drawingClue(): void {
  if (!hasStoryFlag(loadProgress(), 'ly-florist-met')) commitLiuyuanChapterFlag('ly-florist-met');
  rememberLiuyuanFloristClue(); floristBeat = 'heard'; recallClue.hidden = false;
}
function finishDrawing(state: Readonly<RainShadow>): void {
  closeDrawing();
  if (drawingPractice) { showSceneMessage('画稿收好了。这次是独立练习，不记录奖励。'); return; }
  const awarded = awardLiuyuanRainShadow();
  rememberLiuyuanDrawing('saved'); drawingClue();
  showSceneMessage(`${state.hits === 0 ? '你把兰稿完好地递回檐下。' : state.hits > state.catHits ? '纸角略湿，兰叶的笔势还看得清。' : '纸角被猫蹭皱了，兰叶的笔势还看得清。'}花匠把稿页让给你：“留着看吧。找书斋那位，先认笔树，别急着碰他的纸。”${awarded ? ' 御 +1。' : ' 御奖励已领取。'}画册收录：檐下兰稿。`);
}
function leaveDrawing(state: Readonly<RainShadow>): void {
  closeDrawing();
  if (drawingPractice) { showSceneMessage('收起练习，回到院里。'); return; }
  if (state.phase === 'ready') { showSceneMessage('你收回手，先看花匠忙他的活。'); return; }
  const wet = state.collected && state.hits > state.catHits;
  rememberLiuyuanDrawing(wet ? 'smudged' : 'left'); drawingClue();
  showSceneMessage(wet
    ? '花匠抢过湿纸压回檐下：“这张先晾着。你若找书斋那位，认笔树去；他的纸，比我这张还不肯离手。”失手没有属性奖励，仍可继续寻人。'
    : state.catHits > 0
      ? '花匠接过被猫蹭皱的画稿，抚平纸角：“猫的事我来管。找人就认笔树去。”这回没有属性奖励，仍可继续寻人。'
      : '你退回檐下，花匠自己拾起画稿压稳：“猫的事我来管。找人就认笔树去。”这回没有属性奖励，仍可继续寻人。');
}
helpDrawing.addEventListener('click', () => openDrawing());
const storyTransition = document.getElementById('storyTransition')!;
const transitionWords = document.getElementById('transitionWords')!;
const transitionContinue = document.getElementById('transitionContinue') as HTMLButtonElement;
let transitionUrl = '';
let transitionLeaving = false;
function finishTransition(): void {
  if (!transitionUrl || transitionLeaving) return;
  transitionLeaving = true;
  location.assign(transitionUrl);
}
transitionContinue.addEventListener('click', finishTransition);
const toLvyinReturn = document.getElementById('toLvyinReturn') as HTMLButtonElement;
const returnWithStory = document.getElementById('returnWithStory') as HTMLButtonElement;
const leafCarryActions = document.getElementById('leafCarryActions')!;
const placeInBucket = document.getElementById('placeInBucket') as HTMLButtonElement;
const keepInSleeve = document.getElementById('keepInSleeve') as HTMLButtonElement;
const routeNotice = document.getElementById('routeNotice')!;
const pageQuery = new URLSearchParams(location.search);
const chapter = pageQuery.get('chapter') === '1';
const modernReturn = canEnterModernReturn(location.search, loadProgress(), 'east-hall', 'ly-leaf-written');
const returnLvyin = document.getElementById('returnLvyin') as HTMLAnchorElement;
if (chapter) {
  returnLvyin.href = chapterSceneHref('liuyuan-lvyin.html', pageQuery.get('draft') === '1');
  (document.getElementById('editorLink') as HTMLAnchorElement).hidden = true;
  document.getElementById('toolSeparator')!.hidden = true;
  document.getElementById('sceneBadge')!.textContent = 'CH3 · 留园 · 花木院';
}
if (modernReturn) {
  returnLvyin.hidden = true;
  document.getElementById('sceneTools')!.hidden = true;
  document.getElementById('sceneBadge')!.textContent = 'CH3 · 留园 · 返程';
  routeNotice.textContent = '留园章返程：回到游戏增设的花木作业院，先取空桶，再沿当代区域顺序回临池。桶内藏叶是虚构人物的办法，非留园旧日门房制度；场景相接仍是游戏剪接。';
}
stageNote.hidden = chapter || modernReturn;
const mayContinue = () => chapter && hasStoryFlag(loadProgress(),'ly-porridge-delivered')
  && Math.hypot(actor.x-LIUYUAN_FLOWER_EAST_EXIT.x,actor.y-LIUYUAN_FLOWER_EAST_EXIT.y)<120;
continueChapter.addEventListener('click',()=>{
  if (!mayContinue() || transitionUrl) return;
  transitionUrl = modernRouteHref('liuyuan-east-hall.html','flower',pageQuery.get('draft')==='1');
  keys.clear(); pressed.clear();
  document.getElementById('transitionTitle')!.textContent = hasStoryFlag(loadProgress(), 'ly-florist-met')
    ? '循着“笔树”' : '院外的翻纸声';
  transitionWords.textContent = returnFromAlbum
    ? '那张三石小稿留在花匠案边。纸上的石有聚散，园路上的树却各有来去；你记起书斋里那句“苞尖像笔头”，仍想出院再看一眼。'
    : '粥桶留在檐下，花匠又低头忙他的兰。你记着那句“苞尖像笔头”，往院外寻去。';
  if (!hasStoryFlag(loadProgress(), 'ly-florist-met'))
    transitionWords.textContent = '粥已送到，空桶暂留檐下。花匠提起有人在书斋里忙得忘了吃饭；院外隐约有翻纸声。你想过去看看，再回来取桶。';
  if (loadProgress().knowledge.includes('liuyuan-album-orchid-leaf'))
    transitionWords.textContent = '兰稿收在身边，花匠那句“别急着碰他的纸”却让你留了心。循着笔树往前走，书斋里的人会怎样看待来客？';
  else if (loadProgress().knowledge.includes('liuyuan-drawing-smudged'))
    transitionWords.textContent = '湿纸还晾在檐下。花匠说，书斋那位也护着一张纸；你带着这点疑问，循笔树往前找。';
  storyTransition.hidden = false;
  transitionContinue.focus();
});

const previewRequested = new URLSearchParams(location.search).get('draft') === '1';
const draft = readScenePlateDraft(LIUYUAN_FLOWER_ID, LIUYUAN_FLOWER_WORLD_W,
  LIUYUAN_FLOWER_WORLD_H, buildLiuyuanFlowerStudyMap, LIUYUAN_FLOWER_REQUIRED_FEET);
const actorHeight = Math.round(LIUYUAN_CHARACTER_SCALE.flower.worldHeight * (draft?.actorScalePercent ?? 100) / 100);
const scene = buildLiuyuanFlowerStudyMap(draft?.regions ?? LIUYUAN_FLOWER_DRAFT_REGIONS);
const geometry = draft?.geometry ?? LIUYUAN_FLOWER_GEOMETRY;
const obstacles: readonly CollisionShape[] = geometry.flatMap((object) => object.colliders ?? []);
const albumReturnRequested = pageQuery.get('album') === 'done';
const returnFromAlbum = canReturnFromCompletedAlbum(albumReturnRequested, chapter,
  hasStoryFlag(loadProgress(), 'ly-florist-met'), loadCompositionDraft(chapter));
const returnFootOpen = !collides(scene.map, LIUYUAN_FLOWER_WORKER_STAND.x, LIUYUAN_FLOWER_WORKER_STAND.y,
  scene.w, scene.h, obstacles, STANDARD_PLAYER_PROFILE);
const actor = { ...(modernReturn ? LIUYUAN_FLOWER_EAST_EXIT
  : returnFromAlbum && returnFootOpen ? LIUYUAN_FLOWER_WORKER_STAND : LIUYUAN_FLOWER_SPAWN),
  dir: 1, moving: false, walkTime: 0 };
let carryingBucket = modernReturn
  ? hasStoryFlag(loadProgress(), 'ly-leaf-carried')
  : chapter && carryingLiuyuanPorridge(loadProgress());
let bucketDelivered = modernReturn
  ? !hasStoryFlag(loadProgress(), 'ly-leaf-carried')
  : chapter && hasStoryFlag(loadProgress(), 'ly-porridge-delivered');
const mayReturnToLvyin = () => modernReturn && hasStoryFlag(loadProgress(), 'ly-leaf-carried')
  && near(LIUYUAN_FLOWER_SPAWN, 115);
returnWithStory.addEventListener('click', () => {
  if (!mayReturnToLvyin() || transitionUrl) return;
  transitionUrl = modernRouteHref('liuyuan-entry.html', 'flower', previewRequested, true);
  keys.clear(); pressed.clear();
  document.getElementById('transitionTitle')!.textContent = '桶轻，字重';
  (document.getElementById('transitionImage') as HTMLImageElement).src = '../assets/scene25d/liuyuan-entrance-walkable-study-v2.svg?v=6';
  transitionWords.textContent = '粥送完了，提起空桶却比来时更小心。你沿来路穿过临池与小庭，叶片夹在桶内，没有再拿出来看。夹弄那头，乔禾还守着担子；门房的灯笼也还没修好。';
  transitionContinue.textContent = '走入夹弄 · Enter / E';
  storyTransition.hidden = false;
  transitionContinue.focus();
});
toLvyinReturn.addEventListener('click', () => {
  if (!transitionUrl && mayReturnToLvyin()) location.assign(modernRouteHref('liuyuan-lvyin.html', 'flower', previewRequested, true));
});
placeInBucket.addEventListener('click', () => {
  if (!modernReturn || !near(LIUYUAN_FLOWER_BUCKET, 115)) return;
  commitLiuyuanChapterFlag('ly-leaf-carried');
  carryingBucket = true; bucketDelivered = false; leafCarryActions.hidden = true;
  status.textContent = '空桶提起，叶片夹在桶内。沿石路回到院口，门外还等着还桶。';
  showSceneMessage(status.textContent);
});
keepInSleeve.addEventListener('click', () => {
  if (!modernReturn || !near(LIUYUAN_FLOWER_BUCKET, 115)) return;
  status.textContent = '湿墨在衣缝边蹭出毛边。你把叶片抽出来，还是得另找稳妥的地方。';
  leafCarryPrompt.textContent = status.textContent;
});
document.getElementById('closeLeafCarry')!.addEventListener('click', () => { leafCarryActions.hidden = true; });
document.getElementById('closeFloristDialogue')!.addEventListener('click', () => { dialogueActions.hidden = true; });
const keys = new Set<string>();
const pressed = new Set<string>();
let lastTime = 0;
let incidentTime = 0;
let workerGreeting = false;
let floristBeat: FloristBeatState = hasStoryFlag(loadProgress(), 'ly-florist-met') && chapter ? 'heard' : 'unmet';
const mayBorrowAlbum = () => near(LIUYUAN_FLOWER_WORKER, 125) && (chapter
  ? hasStoryFlag(loadProgress(), 'ly-porridge-delivered') && hasStoryFlag(loadProgress(), 'ly-florist-met')
  : workerGreeting);
borrowAlbum.addEventListener('click', () => {
  if (!drawingOpen && !transitionUrl && mayBorrowAlbum()) location.assign(compositionRouteHref('liuyuan-composition-study.html', chapter, previewRequested));
});

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
art.src = '../assets/scene25d/liuyuan-flower-work-yard-study-v1.png';
const sprite = new Image(); sprite.src = '../assets/characters/scholar-player-sprites-v1.png';
const florist = new Image(); florist.src = '../assets/characters/liuyuan-florist-concept-v1.png';
// Measured alpha>128 bounds: removes source-file padding above and below the
// kneeling pose, so the soil pile ends at LIUYUAN_FLOWER_WORKER's ground point.
const FLORIST_CROP = { x: 162, y: 101, w: 941, h: 1086 } as const;
const FLORIST_WORLD_HEIGHT = LIUYUAN_CHARACTER_SCALE.flower.kneelingFloristHeight;
const FLORIST_WORLD_WIDTH = Math.round(FLORIST_WORLD_HEIGHT * FLORIST_CROP.w / FLORIST_CROP.h);

function near(point: { x: number; y: number }, radius: number): boolean {
  return Math.hypot(actor.x - point.x, actor.y - point.y) < radius;
}
function showSceneMessage(words: string): void {
  sceneMessage.textContent = words;
  sceneMessage.hidden = false;
}
function speakToFlorist(action: FloristBeatAction): void {
  if (!near(LIUYUAN_FLOWER_WORKER, 125) || !chapter) return;
  const delivered = hasStoryFlag(loadProgress(), 'ly-porridge-delivered');
  const result = advanceFloristBeat(floristBeat, action, delivered);
  floristBeat = result.state;
  dialogueActions.hidden = !result.showChoices;
  status.textContent = result.line;
  if (result.heardClue) {
    const advanced = commitLiuyuanChapterFlag('ly-florist-met');
    if (advanced.reason === 'missing-previous') {
      status.textContent = '先把这趟送粥的来意办妥。';
      return;
    }
    rememberLiuyuanFloristClue();
    recallClue.hidden = false;
    status.textContent += ' 他又拿起一页空白兰谱：“若有闲，替我取一景。别只画花，给字留个位置。”';
  }
  if (result.showChoices) {
    dialoguePrompt.textContent = result.line;
    sceneMessage.hidden = true;
    keys.clear(); pressed.clear();
  } else showSceneMessage(status.textContent);
}
askStudy.addEventListener('click', () => speakToFlorist('ask'));
watchSoil.addEventListener('click', () => speakToFlorist('watch'));
recallClue.addEventListener('click', () => {
  if (!loadProgress().knowledge.includes('liuyuan-magnolia-slip')) return;
  status.textContent = '纸角只记了两个字：“笔树”。花匠没说是哪座院里的树。';
  showSceneMessage(status.textContent);
});
function interact(): void {
  if (transitionUrl || drawingOpen) return;
  if (modernReturn) {
    if (near(LIUYUAN_FLOWER_BUCKET, 115) && !hasStoryFlag(loadProgress(), 'ly-leaf-carried')) {
      leafCarryActions.hidden = false;
      status.textContent = '檐下的粥桶已经空了。叶片尚有湿墨，你要放在哪里？';
      leafCarryPrompt.textContent = status.textContent;
      sceneMessage.hidden = true;
      keys.clear(); pressed.clear();
    } else status.textContent = mayReturnToLvyin()
      ? '沿来时的石路回临池，桶里的叶暂且不要拿出来。'
      : '花匠还在忙。取好空桶，再向院口走。';
    return;
  }
  const bucketDistance = Math.hypot(actor.x - LIUYUAN_FLOWER_BUCKET.x, actor.y - LIUYUAN_FLOWER_BUCKET.y);
  const workerDistance = Math.hypot(actor.x - LIUYUAN_FLOWER_WORKER.x, actor.y - LIUYUAN_FLOWER_WORKER.y);
  if (drawingIsNearest()) { openDrawing(); return; }
  // 交互半径相交时，靠脚点较近的物件响应，避免花匠被桶位抢走按键。
  if (bucketDistance < 115 && (workerDistance >= 125 || bucketDistance <= workerDistance)) {
    if (!chapter) {
      status.textContent = '独立试走只看作业院，不记录送粥进度。'; return;
    }
    if (!hasStoryFlag(loadProgress(), 'ly-alley-walked')) {
      status.textContent = '先从夹弄把粥提进来。'; return;
    }
    if (hasStoryFlag(loadProgress(), 'ly-porridge-delivered')) {
      status.textContent = '粥桶已经放在檐下了。';
      showSceneMessage(status.textContent);
      return;
    }
    const result = commitLiuyuanChapterFlag('ly-porridge-delivered');
    carryingBucket = chapter && carryingLiuyuanPorridge(loadProgress());
    bucketDelivered = chapter && hasStoryFlag(loadProgress(), 'ly-porridge-delivered');
    dialogueActions.hidden = true;
    floristBeat = 'unmet';
    status.textContent = result.applied || hasStoryFlag(loadProgress(), 'ly-porridge-delivered')
      ? '你把粥桶搁在檐下。花匠拨着兰土：“书斋那位的粥，等他忙完自己来拿。一写起来，饭也顾不上。”院外隐约有翻纸声。' : '先把这趟送粥的来意办妥。';
    showSceneMessage(status.textContent);
    return;
  }
  if (workerDistance < 125) {
    if (!chapter) {
      workerGreeting = true;
      status.textContent = '花匠低头给盆兰换土，又递来一页空白兰谱：“取一景，右边给字留处。”这趟试走不推进章节。'; return;
    }
    workerGreeting = true;
    speakToFlorist('approach');
    return;
  }
  if (near(LIUYUAN_FLOWER_EAST_EXIT, 120)) {
    if (!chapter) {
      status.textContent = '这条边界暂作几何试走；跨园游线还需核图。'; return;
    }
    status.textContent = hasStoryFlag(loadProgress(), 'ly-florist-met')
      ? '东廊仍通向别的院子。花匠说的“笔树”，还不知道指哪株。'
      : hasStoryFlag(loadProgress(), 'ly-porridge-delivered')
        ? '粥桶已放妥。院外隐约有翻纸声；可以过去看看，也可以回兰盆旁问一句。'
        : '先把这趟粥送到檐下。';
    showSceneMessage(status.textContent);
    return;
  }
  status.textContent = workerGreeting ? '石地敞亮；檐下可放桶，花匠还蹲在兰盆旁。' : '花匠正忙着给兰换土。';
}
const directions: Record<string, string> = { arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right' };
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (drawingOpen) {
    if (key === 'tab') {
      const buttons = [...drawingPanel.querySelectorAll<HTMLElement>('button:not([disabled]):not([hidden]), input:not([disabled])')];
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (first && (event.shiftKey && document.activeElement === first || !event.shiftKey && document.activeElement === last)) {
        event.preventDefault(); (event.shiftKey ? last : first).focus();
      }
      return;
    }
    const target = event.target as HTMLElement | undefined;
    if ((target?.tagName === 'BUTTON' || target?.tagName === 'INPUT')
      && (event.key === 'Enter' || event.key === ' ' && target.id !== 'rainGuard')) return;
    if (!event.metaKey && !event.ctrlKey && !event.altKey) {
      drawingGame.keyDown(event.key, event.repeat);
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'enter', 'escape'].includes(key)
        || /^[wasdxp]$/.test(key)) event.preventDefault();
    }
    return;
  }
  if (transitionUrl) {
    event.preventDefault();
    if (!event.repeat && ['enter', 'e', 'escape', ' '].includes(key)) finishTransition();
    else if (key === 'tab') transitionContinue.focus();
    return;
  }
  if (key === 'escape' && (!dialogueActions.hidden || !leafCarryActions.hidden)) {
    event.preventDefault(); dialogueActions.hidden = true; leafCarryActions.hidden = true; return;
  }
  if (!leafCarryActions.hidden && (key === '1' || key === '2')) {
    event.preventDefault(); if (!event.repeat) (key === '1' ? placeInBucket : keepInSleeve).click(); return;
  }
  if (!dialogueActions.hidden && (key === '1' || key === '2')) {
    event.preventDefault(); if (!event.repeat) speakToFlorist(key === '1' ? 'ask' : 'watch'); return;
  }
  if (key === 'e') { event.preventDefault(); if (!event.repeat) interact(); return; }
  const direction = directions[key];
  if (direction) { event.preventDefault(); if (dialogueActions.hidden && leafCarryActions.hidden) keys.add(direction); }
});
window.addEventListener('keyup', (event) => { drawingGame.keyUp(event.key); const direction = directions[event.key.toLowerCase()]; if (direction) keys.delete(direction); });
window.addEventListener('blur', () => { keys.clear(); pressed.clear(); });
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-dir]')) {
  const dir = button.dataset.dir!;
  button.addEventListener('pointerdown', (event) => { if (transitionUrl || drawingOpen) return; event.preventDefault(); button.setPointerCapture(event.pointerId); pressed.add(dir); });
  button.addEventListener('pointerup', () => pressed.delete(dir));
  button.addEventListener('pointercancel', () => pressed.delete(dir));
  button.addEventListener('lostpointercapture', () => pressed.delete(dir));
}
lookButton.addEventListener('click', interact);
reset.addEventListener('click', () => {
  if (drawingOpen || transitionUrl) return;
  actor.x = modernReturn ? LIUYUAN_FLOWER_EAST_EXIT.x : LIUYUAN_FLOWER_SPAWN.x;
  actor.y = modernReturn ? LIUYUAN_FLOWER_EAST_EXIT.y : LIUYUAN_FLOWER_SPAWN.y;
  actor.dir = modernReturn ? 1 : 1;
  keys.clear(); pressed.clear(); dialogueActions.hidden = true; floristBeat = 'unmet'; workerGreeting = false;
  leafCarryActions.hidden = true;
  sceneMessage.hidden = true;
  carryingBucket = modernReturn
    ? hasStoryFlag(loadProgress(), 'ly-leaf-carried')
    : chapter && carryingLiuyuanPorridge(loadProgress());
  bucketDelivered = modernReturn
    ? !hasStoryFlag(loadProgress(), 'ly-leaf-carried')
    : chapter && hasStoryFlag(loadProgress(), 'ly-porridge-delivered');
  status.textContent = modernReturn
    ? carryingBucket ? '你回到院东侧；空桶已提在手中，沿石路回临池。' : '你回到院东侧；空桶还在檐下。'
    : '又回到院口。花匠仍在换兰土。';
});

function drawGeometry(): void {
  ctx.save(); ctx.globalAlpha = .5;
  for (let y = 0; y < scene.h; y++) for (let x = 0; x < scene.w; x++) {
    const tile = scene.map[y * scene.w + x];
    if (([T.PATH,T.CORR,T.PLAT,T.WATER] as readonly number[]).includes(tile)) {
      ctx.fillStyle = tile === T.WATER ? '#4c8dff' : tile === T.CORR ? '#27bfc2' : tile === T.PLAT ? '#f4d35e' : '#52d879';
      ctx.fillRect(x * 16, y * 16, 16, 16);
    }
  }
  ctx.globalAlpha = .75; ctx.fillStyle = '#ef5350';
  for (const object of geometry) for (const shape of object.colliders ?? []) {
    ctx.beginPath(); if ('x' in shape) ctx.rect(shape.x, shape.y, shape.w, shape.h);
    else shape.points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  for (const object of geometry) for (const polygon of object.occluder?.polygons ?? []) {
    ctx.beginPath(); polygon.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    ctx.closePath(); ctx.strokeStyle = '#35d8e6'; ctx.lineWidth = 3; ctx.stroke();
  }
  const p = STANDARD_PLAYER_PROFILE;
  ctx.strokeStyle = '#ff64a8'; ctx.lineWidth = 1;
  ctx.strokeRect(actor.x-p.halfW,actor.y-p.topInset,p.halfW*2,p.topInset-p.bottomInset);
}
function draw(): void {
  ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#c6c6b9'; ctx.fillRect(0,0,canvas.width,canvas.height);
  const zoom = LIUYUAN_CHARACTER_SCALE.flower.cameraZoom, viewW = canvas.width/zoom, viewH = canvas.height/zoom;
  const cameraX = Math.max(0,Math.min(LIUYUAN_FLOWER_WORLD_W-viewW,actor.x-viewW*.55));
  const cameraY = Math.max(0,Math.min(LIUYUAN_FLOWER_WORLD_H-viewH,actor.y-viewH*.90));
  ctx.save(); ctx.scale(zoom,zoom); ctx.translate(-Math.round(cameraX),-Math.round(cameraY));
  if (art.complete && art.naturalWidth) ctx.drawImage(pixelArtReady ? pixelArt : art,0,0,LIUYUAN_FLOWER_WORLD_W,LIUYUAN_FLOWER_WORLD_H);
  // Actor sprites sort by their foot Y, independently of the painted background.
  const drawFlorist = () => { if (florist.complete && florist.naturalWidth) {
    ctx.fillStyle = 'rgba(20,32,25,.22)'; ctx.fillRect(LIUYUAN_FLOWER_WORKER.x-18,LIUYUAN_FLOWER_WORKER.y-2,36,4);
    ctx.drawImage(florist,FLORIST_CROP.x,FLORIST_CROP.y,FLORIST_CROP.w,FLORIST_CROP.h,
      LIUYUAN_FLOWER_WORKER.x-Math.floor(FLORIST_WORLD_WIDTH/2),
      LIUYUAN_FLOWER_WORKER.y-FLORIST_WORLD_HEIGHT,FLORIST_WORLD_WIDTH,FLORIST_WORLD_HEIGHT);
  } };
  const drawScholar = () => {
    drawScholarGroundShadow(ctx, actor.x, actor.y, actorHeight);
    if (sprite.complete && sprite.naturalWidth) {
    const frame = actor.moving ? 1+(Math.floor(actor.walkTime*6)%2) : 0;
    drawScholarAtFoot(ctx, sprite, actor.dir, frame, actor.x, actor.y, actorHeight);
    } else { ctx.fillStyle='#344e44'; ctx.fillRect(actor.x-6,actor.y-38,12,38); }
    if (carryingBucket) drawLiuyuanPorridgeBucket(ctx, actor.x, actor.y, actorHeight, actor.dir, true);
  };
  if (bucketDelivered) drawLiuyuanPorridgeBucket(ctx,
    LIUYUAN_FLOWER_BUCKET.x, LIUYUAN_FLOWER_BUCKET.y, actorHeight, 0, false);
  const actors: { y: number; draw: () => void }[] = [{ y: actor.y, draw: drawScholar }, { y: LIUYUAN_FLOWER_WORKER.y, draw: drawFlorist }];
  if (drawingAvailable()) {
    const { x, y } = drawingFoot;
    actors.push({ y, draw: () => drawDrawingIncident(ctx, x, y, incidentTime) });
  }
  for (const item of actors.sort((a, b) => a.y - b.y)) item.draw();
  if (art.complete && art.naturalWidth) for (const object of geometry) {
    const occluder = object.occluder;
    if (!occluder || actor.y >= occluder.depthY) continue;
    ctx.save(); ctx.beginPath();
    for (const polygon of occluder.polygons) { polygon.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath(); }
    ctx.clip(); ctx.drawImage(pixelArtReady ? pixelArt : art,0,0,LIUYUAN_FLOWER_WORLD_W,LIUYUAN_FLOWER_WORLD_H); ctx.restore();
  }
  if (showGeometry.checked) drawGeometry();
  ctx.restore();
}
function tick(now: number): void {
  const dt=Math.min(.05,(now-(lastTime||now))/1000); lastTime=now;
  if (!drawingOpen && !transitionUrl) incidentTime += dt;
  if (drawingOpen) { actor.moving = false; drawingGame.tick(dt); draw(); requestAnimationFrame(tick); return; }
  if (transitionUrl) { actor.moving = false; draw(); requestAnimationFrame(tick); return; }
  const active=(dir:string)=>keys.has(dir)||pressed.has(dir);
  const dx=Number(active('right'))-Number(active('left')),dy=Number(active('down'))-Number(active('up'));
  actor.moving=dialogueActions.hidden && leafCarryActions.hidden && (dx!==0||dy!==0);
  if (actor.moving) {
    sceneMessage.hidden = true;
    actor.dir=dy>0?0:dy<0?3:dx>0?2:1; actor.walkTime+=dt;
    const length=Math.hypot(dx,dy);
    moveEntity(scene.map,actor,dx/length*95*dt,dy/length*95*dt,scene.w,scene.h,obstacles,STANDARD_PLAYER_PROFILE);
  }
  if (!dialogueActions.hidden && !near(LIUYUAN_FLOWER_WORKER, 165)) {
    dialogueActions.hidden = true;
    floristBeat = 'unmet';
  }
  if (modernReturn && !leafCarryActions.hidden && !near(LIUYUAN_FLOWER_BUCKET, 140))
    leafCarryActions.hidden = true;
  stageNote.textContent = modernReturn
    ? carryingBucket ? '叶片已随空桶带在身边，沿石院走向临池。' : '回檐下取空桶，再沿石院走向临池。'
    : near(LIUYUAN_FLOWER_WORKER,150) ? '花匠给盆兰换土，头也不抬。'
    : near(LIUYUAN_FLOWER_BUCKET,140) ? '檐下有一块可搁粥桶的石地。'
    : '石院里有人蹲着换兰土。';
  continueChapter.hidden = !mayContinue();
  continueChapter.textContent = hasStoryFlag(loadProgress(), 'ly-florist-met') ? '沿东廊 · 寻书斋' : '沿东廊 · 听纸声';
  toLvyinReturn.hidden = !mayReturnToLvyin();
  returnWithStory.hidden = !mayReturnToLvyin();
  borrowAlbum.hidden = modernReturn || !mayBorrowAlbum();
  helpDrawing.hidden = !drawingIsNearest() || !dialogueActions.hidden;
  const viewCollected = document.getElementById('viewCollected') as HTMLAnchorElement;
  viewCollected.hidden = !loadProgress().knowledge.includes('liuyuan-album-orchid-leaf');
  viewCollected.href = chapterSceneHref('journal.html', previewRequested);
  const bucketDistance = Math.hypot(actor.x - LIUYUAN_FLOWER_BUCKET.x, actor.y - LIUYUAN_FLOWER_BUCKET.y);
  const workerDistance = Math.hypot(actor.x - LIUYUAN_FLOWER_WORKER.x, actor.y - LIUYUAN_FLOWER_WORKER.y);
  const cue = drawingIsNearest() ? 'E · 抢住猫爪边的兰稿'
    : modernReturn && !hasStoryFlag(loadProgress(), 'ly-leaf-carried') && bucketDistance < 115
    ? 'E · 取空桶' : chapter && !hasStoryFlag(loadProgress(), 'ly-porridge-delivered')
      && bucketDistance < 115 && (workerDistance >= 125 || bucketDistance <= workerDistance)
      ? 'E · 放下粥桶' : chapter && workerDistance < 125 && hasStoryFlag(loadProgress(), 'ly-porridge-delivered')
        && !hasStoryFlag(loadProgress(), 'ly-florist-met') ? 'E · 与花匠说话' : '';
  interactionCue.hidden = !cue || !dialogueActions.hidden || !leafCarryActions.hidden || !sceneMessage.hidden;
  interactionCue.textContent = cue;
  if (chapter && !modernReturn && !hasStoryFlag(loadProgress(), 'ly-porridge-delivered')
    && near(LIUYUAN_FLOWER_EAST_EXIT, 120)) {
    interactionCue.textContent = '先到檐下放粥';
    interactionCue.hidden = !sceneMessage.hidden;
  }
  coords.hidden = !showGeometry.checked;
  if (showGeometry.checked) coords.textContent = `脚点 (${Math.round(actor.x)}, ${Math.round(actor.y)})`;
  draw(); requestAnimationFrame(tick);
}
if (previewRequested && !draft) status.textContent='没有找到可用且剧情脚点连通的草稿，正显示代码几何；编辑器原稿未删除。';
if (draft) status.textContent='正在预览编辑器草稿；可走面与花匠碰撞已同步。';
if (collides(scene.map,actor.x,actor.y,scene.w,scene.h,obstacles,STANDARD_PLAYER_PROFILE)) status.textContent='出生点被当前几何封住，请回编辑器检查。';
else if (returnFromAlbum) status.textContent = '你把兰谱与画谱交回院中。花匠把纸页压在檐下晾着，又去照看那盆兰；送粥与寻人的正事仍得往下办。';
else if (albumReturnRequested) status.textContent = '画谱还没有完整交成。先与花匠说话，再把兰谱和画谱都做完。';
else if (modernReturn && carryingBucket) status.textContent = '空桶已提在手中；叶片仍夹在桶里。沿石路回临池。';
if (pageQuery.get('minigame') === 'rain-shadow') openDrawing(true);
recallClue.hidden = !loadProgress().knowledge.includes('liuyuan-magnolia-slip');
requestAnimationFrame(tick);
