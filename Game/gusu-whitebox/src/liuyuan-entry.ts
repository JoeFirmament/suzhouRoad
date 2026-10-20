import { STANDARD_PLAYER_PROFILE, type CollisionShape, type SceneGeometryObject,
  type WorldPoint } from './core/geometry.js';
import { alleyReturnComplete, alleyWalkComplete, canCompleteLiuyuanReturn, advanceAlleyCheckpoint,
  advanceAlleyReturnCheckpoint, LIUYUAN_ENTRY_REQUIRED_FEET, LIUYUAN_ENTRY_COURT_EXIT,
  LIUYUAN_ALLEY_RETURN_CHECKPOINTS, LIUYUAN_ALLEY_CHECKPOINTS } from './core/liuyuan-entry-flow.js';
import { commitLiuyuanChapterFlag } from './core/liuyuan-progression.js';
import { drawingChapterEcho } from './core/liuyuan-drawing-echo.js';
import { moveEntity, collides } from './core/physics.js';
import { clearEntryResume, entryGeometryStamp, readEntryResume, writeEntryResume,
  type EntryResumeContext } from './core/liuyuan-entry-resume.js';
import { readScenePlateDraft } from './core/scene-plate-draft.js';
import { hasStoryFlag, loadProgress, resetProgress, type StoryFlag } from './core/progression.js';
import { isLiuyuanPlaytest } from './core/liuyuan-playtest.js';
import { LIUYUAN_ENTRY_DRAFT_REGIONS, LIUYUAN_ENTRY_SPAWN, LIUYUAN_ENTRY_QIAO_WAIT,
  buildLiuyuanEntryStudyMap } from './data/liuyuan-entry-study.js';
import { LIUYUAN_CHARACTER_SCALE } from './data/liuyuan-character-scale.js';
import { SCENE_PLATES } from './data/scene-plates.js';
import { T } from './data/tiles.js';
import { drawScholarAtFoot, drawScholarGroundShadow, perspectiveScholarHeight } from './render/scholar-sprite.js';
import { carryingLiuyuanPorridge, drawLiuyuanPorridgeBucket, liuyuanBucketAnchor } from './render/liuyuan-bucket.js';
import { canEnterModernReturn } from './core/liuyuan-modern-route.js';
import { chapterSceneHref } from './core/liuyuan-view-memory.js';
import { liuyuanChapterResumeLink } from './core/liuyuan-chapter-resume-link.js';
import { entryCameraForFoot, LIUYUAN_ENTRY_SHOT_KEYS, LIUYUAN_ENTRY_VIEW } from './core/liuyuan-entry-camera.js';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const status = document.getElementById('status')!;
const showTiles = document.getElementById('showTiles') as HTMLInputElement;
const coords = document.getElementById('coords')!;
const reset = document.getElementById('reset') as HTMLButtonElement;
const interactButton = document.getElementById('interact') as HTMLButtonElement;
const dialogueBox = document.getElementById('dialogue') as HTMLElement;
const speaker = document.getElementById('speaker')!;
const line = document.getElementById('line')!;
const choicesBox = document.getElementById('choices')!;
const nextLine = document.getElementById('nextLine') as HTMLButtonElement;
const chapterComplete = document.getElementById('chapterComplete') as HTMLElement;
const updateChapterEcho = () => {
  document.getElementById('chapterEcho')!.textContent = drawingChapterEcho(loadProgress().knowledge);
};
updateChapterEcho();
const params = new URLSearchParams(location.search);
/** ?debug=plate：把三段落镜框、12 个脚点与可走面叠在真实美术上，供底图对位。 */
const plateDebug = params.get('debug') === 'plate';
const atmosphereStudyRequested = params.get('art') === 'atmosphere-v1';
const atmosphereStudyEnabled = atmosphereStudyRequested && params.get('draft') !== '1';
/** ?art=plate-v3：只把灰模换进画面做对位试走，不写任何进度；默认仍是 v2。 */
const plateBlockout = params.get('art') === 'plate-v3' && params.get('draft') !== '1';
(document.getElementById('returnVariantHome') as HTMLAnchorElement).href=chapterSceneHref('home.html');
(document.getElementById('returnCityMap') as HTMLAnchorElement).href=chapterSceneHref('sucheng.html');
(document.getElementById('returnChapterJournal') as HTMLAnchorElement).href=chapterSceneHref('journal.html');
const playtest = isLiuyuanPlaytest(location.search);
const playtestStart = document.getElementById('playtestStart') as HTMLAnchorElement;
const playtestBanner = document.getElementById('playtestBanner') as HTMLElement;
const playtestRestart = document.getElementById('playtestRestart') as HTMLButtonElement;
const playtestFileWarning = document.getElementById('playtestFileWarning') as HTMLElement;
const interactionCue = document.getElementById('interactionCue') as HTMLElement;
playtestStart.hidden = playtest;
playtestBanner.hidden = !playtest;
playtestFileWarning.hidden = !playtest || location.protocol !== 'file:';
if (atmosphereStudyEnabled) playtestStart.href += '&art=atmosphere-v1';
playtestRestart.addEventListener('click', () => {
  if (!playtest) return;
  leavingEntry = true;
  clearEntryResume(resumeSlot);
  resetProgress();
  location.assign(`liuyuan-entry.html?playtest=1${atmosphereStudyEnabled ? '&art=atmosphere-v1' : ''}`);
});
const continueStory = document.getElementById('continueSavedStory') as HTMLAnchorElement;
const savedStory = liuyuanChapterResumeLink(loadProgress(),location.search);
continueStory.hidden = !savedStory;
if (savedStory) { continueStory.href=savedStory.href; continueStory.textContent=savedStory.label; }
const returnStudy = params.get('returnStudy') === '1';
const artStudyBadge = document.getElementById('artStudyBadge')!;
artStudyBadge.hidden = !(atmosphereStudyRequested || plateBlockout);
artStudyBadge.textContent = plateBlockout
  ? '底图灰模预览（v3）· 只回答“画在哪”，屋顶与墙尚未作美术；默认仍是 v2。'
  : atmosphereStudyEnabled
  ? '美术候选预览 · 仅视觉叠层，原路线、碰撞与草稿不变；非实景复原。'
  : '美术候选叠层不用于编辑器草稿，已保持原样。';
const completedRevisit = !returnStudy && hasStoryFlag(loadProgress(), 'ly-unlocked')
  && hasStoryFlag(loadProgress(), 'ly-leaf-carried');
const modernReturn = completedRevisit || canEnterModernReturn(location.search, loadProgress(), 'court', 'ly-leaf-carried')
  || canEnterModernReturn(location.search, loadProgress(), 'flower', 'ly-leaf-carried');
const returnAlreadyComplete = modernReturn && hasStoryFlag(loadProgress(), 'ly-unlocked');
chapterComplete.hidden = !returnAlreadyComplete;
if (playtest && (savedStory || modernReturn || returnAlreadyComplete))
  document.getElementById('playtestAdvice')!.textContent = returnAlreadyComplete
    ? '这一程已经完成，可以回看门外或去府学核本。'
    : modernReturn ? '空桶在手。沿夹弄回到门槛，与门房说过话，再到街面还给乔禾。'
      : '试玩进度已保留，可继续当前剧情，也可从头重试玩。';
const returnWalk = returnStudy || modernReturn;
const returnStart = LIUYUAN_ENTRY_COURT_EXIT;
const returnFinish = { x: 520, y: 656 } as const;
if (returnStudy) {
  document.title = '留园入口 · 沿夹弄原路返回';
  document.getElementById('modeTitle')!.textContent = '从小庭，原路走回门外';
  document.getElementById('modeIntro')!.textContent = '沿同一条夹弄从小庭走回街面，留意两次天井与折向西的转弯。';
  document.getElementById('modeNote')!.textContent = '方向键 / WASD / 触屏方向键移动，E、空格或“查看”观察。此为不写章节状态、不发六艺的逆行自由试玩；场景是艺术化游戏空间，不复原清末门位。';
  interactButton.textContent = '查看';
  reset.textContent = '回到小庭端';
}
if (modernReturn) {
  document.title = '留园章 · 空桶出园';
  document.getElementById('modeTitle')!.textContent = '沿夹弄，提空桶出园';
  document.getElementById('modeIntro')!.textContent = '从小庭口沿同一条窄路往外走。门房仍在修灯笼；先到门槛前应答，再走到街面。';
  document.getElementById('modeNote')!.textContent = '入口沿原有可走路线呈现，送粥侧门、门房验桶与蕉叶藏法均为剧情演绎。须亲走完夹弄、与门房应答才结算本章。';
  interactButton.textContent = '交谈 / 查看';
  reset.textContent = '回到小庭口';
}
if (returnAlreadyComplete) {
  document.getElementById('modeTitle')!.textContent = '从留园门外，回看这一程';
  document.getElementById('modeIntro')!.textContent = '已经沿夹弄出园，空桶交回乔禾。此处可回看门外场景。';
  document.getElementById('modeNote')!.textContent = '本章已结算。可回《蘇城全圖》或翻看园谱；入口是游戏化场景，不对应清末原门位。';
  reset.textContent = '回到门外';
}
const reverseStudyLink = document.getElementById('reverseStudyLink') as HTMLAnchorElement;
reverseStudyLink.hidden = modernReturn;
reverseStudyLink.href = returnStudy ? 'liuyuan-entry.html' : 'liuyuan-entry.html?returnStudy=1';
reverseStudyLink.textContent = returnStudy ? '返回入口章流' : '另看夹弄逆行自由试玩（不算 CH3）';
if (params.get('draft') === '1') reverseStudyLink.href += returnStudy ? '?draft=1' : '&draft=1';
if (atmosphereStudyEnabled) reverseStudyLink.href += returnStudy ? '?art=atmosphere-v1' : '&art=atmosphere-v1';
const draft = readScenePlateDraft('liuyuan-entrance-topology-study', 1008, 688,
  buildLiuyuanEntryStudyMap, LIUYUAN_ENTRY_REQUIRED_FEET);
const actorScalePercent = draft?.actorScalePercent ?? 100;
const mapData = buildLiuyuanEntryStudyMap(draft?.regions ?? LIUYUAN_ENTRY_DRAFT_REGIONS);
const geometry: readonly SceneGeometryObject[] = draft?.geometry ?? [];
const obstacles: readonly CollisionShape[] = geometry.flatMap((object) => object.colliders ?? []);
const draftBadge = document.getElementById('draftBadge')!;
draftBadge.hidden = params.get('draft') !== '1';
if (!draft) draftBadge.textContent = '没有可用且全程可达的编辑器草稿，正使用默认几何；原草稿未删除，可回编辑器检查夹弄。';
else if (draft.assetPath && draft.assetPath !== '../assets/scene25d/liuyuan-entrance-walkable-study-v2.svg') {
  draftBadge.textContent = '正在预览旧底图上的编辑器草稿；Tile 可试走，但遮挡、花盆与檐口请在新底图上重校后再确认保存。';
}
const graph = SCENE_PLATES.find((plate) => plate.id === 'liuyuan-entrance-topology-study')!.routeGraph!;
const background = new Image();
background.src = plateBlockout
  ? '../assets/scene25d/liuyuan-entrance-walkable-study-v3.svg?v=1'
  : '../assets/scene25d/liuyuan-entrance-walkable-study-v2.svg?v=6';
const atmosphereLayer = new Image();
if (atmosphereStudyEnabled) atmosphereLayer.src = '../research-art/liuyuan-entry-atmosphere-layer-v1.svg?v=2';
const sprite = new Image();
sprite.src = '../assets/characters/scholar-player-sprites-v1.png';
const qiao = new Image();
qiao.src = '../assets/characters/qiao-he-sprites-concept-v1.png';
const gateNpcs = new Image();
gateNpcs.src = '../assets/characters/liuyuan-gate-npcs-concept-v1.png';
const actor: { x: number; y: number; dir: number; moving: boolean; walkTime: number } = {
  ...(returnAlreadyComplete ? returnFinish : returnWalk ? returnStart : LIUYUAN_ENTRY_SPAWN),
  dir: returnAlreadyComplete ? 0 : returnWalk ? 2 : 1,
  moving: false, walkTime: 0 };
const entryCamera = entryCameraForFoot(actor.x, actor.y);
const QIAO_START = { x: 540, y: 676 } as const;
const QIAO_GATE = LIUYUAN_ENTRY_QIAO_WAIT;
const QIAO_RETURN_WAIT = LIUYUAN_ENTRY_QIAO_WAIT;
const qiaoWaitsByBundle = () => said('ly-huabu-seen') || said('ly-gate-passed');
const qiaoActor = {
  x: returnWalk ? returnAlreadyComplete ? QIAO_RETURN_WAIT.x : QIAO_START.x
    : qiaoWaitsByBundle() ? QIAO_START.x : said('ly-errand-offered') ? QIAO_GATE.x : QIAO_START.x,
  y: QIAO_START.y,
  moving: false, walkTime: 0,
};
// 入口保留原 1008×688 脚点与镜头；人物按实际非透明轮廓裁切并锚定鞋底。
const ENTRY_ACTOR_SCALE = LIUYUAN_CHARACTER_SCALE.entry;
const QIAO_ENTRY_FRAMES = [
  [{ x: 162, y: 32, w: 157, h: 330 }, { x: 108, y: 32, w: 156, h: 330 }, { x: 57, y: 32, w: 155, h: 330 }],
  [{ x: 157, y: 6, w: 164, h: 356 }, { x: 101, y: 6, w: 168, h: 356 }, { x: 49, y: 6, w: 171, h: 356 }],
] as const;
function drawQiaoAtFoot(footX: number, footY: number, moving: boolean, walkTime: number): void {
  const frame = moving ? 1 + Math.floor(walkTime * 6) % 2 : 0;
  const row = moving ? 1 : 0;
  const crop = QIAO_ENTRY_FRAMES[row][frame];
  const height = 49;
  const width = Math.round(height * crop.w / crop.h);
  drawScholarGroundShadow(ctx, footX, footY, height);
  ctx.drawImage(qiao, frame * 362 + crop.x, row * 2 * 362 + crop.y, crop.w, crop.h,
    Math.round(footX - width / 2), Math.round(footY - height), width, height);
}
function drawSeatedNpcAtFoot(sourceX: number, cropX: number, cropW: number, cropH: number,
  footX: number, footY: number, height: number): void {
  const width = Math.round(height * cropW / cropH);
  drawScholarGroundShadow(ctx, footX, footY, height);
  ctx.drawImage(gateNpcs, sourceX + cropX, 142, cropW, cropH,
    Math.round(footX - width / 2), footY - height, width, height);
}
let alleyCheckpoint = 0;
let returnCheckpoint = returnAlreadyComplete ? LIUYUAN_ALLEY_RETURN_CHECKPOINTS.length : 0;
let gateAnswered = returnAlreadyComplete;
let bucketHandover: { x: number; y: number; height: number; elapsed: number } | null = null;
const RETURNED_BUCKET = { x: QIAO_RETURN_WAIT.x + 14, y: QIAO_RETURN_WAIT.y } as const;
let carryingBucket = modernReturn && !returnAlreadyComplete
  || !returnWalk && carryingLiuyuanPorridge(loadProgress());
let bucketRestingAtExit = false;
type DialogueLine = { who: string; words: string };
type DialogueChoice = { label: string; act: () => void };
let dialogue: { lines: DialogueLine[]; index: number; choices: DialogueChoice[] } | null = null;
function said(flag: StoryFlag): boolean { return loadProgress().storyFlags.includes(flag); }
const resumeSlot = `${playtest ? 'playtest' : 'campaign'}:${returnStudy ? 'study-return' : modernReturn ? 'chapter-return' : 'forward'}:${params.get('draft') === '1' ? 'draft' : 'default'}${atmosphereStudyEnabled ? ':art-atmosphere-v1' : ''}`;
const geometryStamp = entryGeometryStamp(mapData.map, obstacles);
let leavingEntry = false;
function resumeContext(): EntryResumeContext {
  const progress = loadProgress();
  return { slot: resumeSlot,
    progressStamp: JSON.stringify([progress.updatedAt, [...progress.storyFlags].sort()]),
    geometryStamp, maxAlley: LIUYUAN_ALLEY_CHECKPOINTS.length,
    maxReturn: LIUYUAN_ALLEY_RETURN_CHECKPOINTS.length,
    canStand: (x, y) => !collides(mapData.map, x, y, mapData.w, mapData.h, obstacles, STANDARD_PLAYER_PROFILE),
    stateAllowed: (state) => {
      if (returnAlreadyComplete) return false;
      if (!returnWalk && !progress.storyFlags.includes('ly-gate-passed')
        && (state.y < 615 || state.alleyCheckpoint > 0)) return false;
      if (state.bucketResting && (returnWalk || !progress.storyFlags.includes('ly-alley-walked')
        || !carryingLiuyuanPorridge(progress))) return false;
      if (!returnWalk && (state.returnCheckpoint !== 0 || state.gateAnswered)) return false;
      if (returnWalk && (state.alleyCheckpoint !== 0 || state.bucketResting)) return false;
      if (modernReturn && state.gateAnswered && state.returnCheckpoint < LIUYUAN_ALLEY_RETURN_CHECKPOINTS.length - 1) return false;
      if (modernReturn && !state.gateAnswered && state.y > 625) return false;
      return true;
    } };
}
const resumed = readEntryResume(resumeContext());
if (resumed) {
  actor.x = resumed.x; actor.y = resumed.y; actor.dir = resumed.dir;
  alleyCheckpoint = resumed.alleyCheckpoint; returnCheckpoint = resumed.returnCheckpoint;
  gateAnswered = resumed.gateAnswered; bucketRestingAtExit = resumed.bucketResting;
  if (bucketRestingAtExit) carryingBucket = false;
  Object.assign(entryCamera, entryCameraForFoot(actor.x, actor.y));
  const notice = document.getElementById('resumeNotice')!;
  notice.hidden = false;
  notice.textContent = bucketRestingAtExit
    ? '已接续本标签页的位置；粥桶仍放在窗前，靠近后再提起。'
    : '已接续本标签页的位置与行走次序；继续靠近人物或物件互动。';
}
let lastResumeWrite = -Infinity;
let lastResumeValue = '';
function saveEntryResume(): void {
  if (leavingEntry || returnAlreadyComplete) return;
  const context = resumeContext();
  const state = { x: actor.x, y: actor.y, dir: actor.dir, alleyCheckpoint, returnCheckpoint,
    gateAnswered, bucketResting: bucketRestingAtExit };
  const value = JSON.stringify([context.progressStamp, state]);
  if (value === lastResumeValue) return;
  writeEntryResume(context, state);
  lastResumeValue = value;
}
window.addEventListener('pagehide', saveEntryResume);
window.addEventListener('blur', saveEntryResume);
const near = (x: number, y: number, radius: number) => Math.hypot(actor.x - x, actor.y - y) <= radius;
const keys = new Set<string>();
const pressed = new Set<string>();
const directions: Record<string, string> = {
  arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
};

window.addEventListener('keydown', (event) => {
  if (/^[1-9]$/.test(event.key) && dialogue && !event.repeat) {
    const index = Number(event.key) - 1;
    if (dialogue.index === dialogue.lines.length - 1 && dialogue.choices[index]) {
      event.preventDefault();
      chooseDialogue(index);
      return;
    }
  }
  if (event.key.toLowerCase() === 'e' || event.key === ' ') {
    event.preventDefault();
    if (!event.repeat) interact();
    return;
  }
  const direction = directions[event.key.toLowerCase()];
  if (!direction) return;
  event.preventDefault(); keys.add(direction);
});
window.addEventListener('keyup', (event) => {
  const direction = directions[event.key.toLowerCase()];
  if (direction) keys.delete(direction);
  saveEntryResume();
});
window.addEventListener('blur', () => { keys.clear(); pressed.clear(); });
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-dir]')) {
  const dir = button.dataset.dir!;
  button.addEventListener('pointerdown', (event) => { event.preventDefault(); button.setPointerCapture(event.pointerId); pressed.add(dir); });
  button.addEventListener('pointerup', () => { pressed.delete(dir); saveEntryResume(); });
  button.addEventListener('pointercancel', () => pressed.delete(dir));
  button.addEventListener('lostpointercapture', () => pressed.delete(dir));
}
reset.addEventListener('click', () => {
  bucketHandover = null;
  clearEntryResume(resumeSlot);
  lastResumeValue = '';
  document.getElementById('resumeNotice')!.hidden = true;
  const completed = modernReturn && hasStoryFlag(loadProgress(), 'ly-unlocked');
  chapterComplete.hidden = !completed;
  updateChapterEcho();
  actor.x = completed ? returnFinish.x : returnWalk ? returnStart.x : LIUYUAN_ENTRY_SPAWN.x;
  actor.y = completed ? returnFinish.y : returnWalk ? returnStart.y : LIUYUAN_ENTRY_SPAWN.y;
  Object.assign(entryCamera, entryCameraForFoot(actor.x, actor.y));
  actor.dir = completed ? 0 : returnWalk ? 2 : 1;
  alleyCheckpoint = 0;
  returnCheckpoint = completed ? LIUYUAN_ALLEY_RETURN_CHECKPOINTS.length : 0;
  gateAnswered = completed;
  bucketRestingAtExit = false;
  carryingBucket = modernReturn && !completed
    || !returnWalk && carryingLiuyuanPorridge(loadProgress());
  qiaoActor.x = returnWalk ? completed ? QIAO_RETURN_WAIT.x : QIAO_START.x
    : qiaoWaitsByBundle() ? QIAO_START.x : said('ly-errand-offered') ? QIAO_GATE.x : QIAO_START.x;
  qiaoActor.y = QIAO_START.y;
  qiaoActor.moving = false;
  keys.clear(); pressed.clear();
  dialogue = null; renderDialogue();
});
interactButton.addEventListener('click', interact);
nextLine.addEventListener('click', interact);

function passGate(): void {
  commitLiuyuanChapterFlag('ly-gate-passed');
  showDialogue([{ who: '门房', words: '花房的？进去吧。桶提稳，别急着跑。' }]);
}

function showDialogue(lines: DialogueLine[], choices: DialogueChoice[] = []): void {
  dialogue = { lines, index: 0, choices };
  keys.clear(); pressed.clear();
  renderDialogue();
}

function chooseDialogue(index: number): void {
  if (!dialogue || dialogue.index !== dialogue.lines.length - 1) return;
  const choice = dialogue.choices[index];
  if (!choice) return;
  dialogue = null;
  renderDialogue();
  choice.act();
}

function renderDialogue(): void {
  if (!dialogue) { dialogueBox.hidden = true; return; }
  dialogueBox.hidden = false;
  speaker.textContent = dialogue.lines[dialogue.index].who;
  line.textContent = dialogue.lines[dialogue.index].words;
  choicesBox.replaceChildren();
  const atEnd = dialogue.index === dialogue.lines.length - 1;
  nextLine.hidden = atEnd && dialogue.choices.length > 0;
  nextLine.textContent = atEnd ? '收起' : '继续';
  if (atEnd) for (const [index, choice] of dialogue.choices.entries()) {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = `${index + 1} · ${choice.label}`;
    button.addEventListener('click', () => chooseDialogue(index));
    choicesBox.append(button);
  }
}

function nearWaitingElder(): boolean {
  return actor.y > 640 && near(493, 655, 43)
    && Math.hypot(actor.x - 493, actor.y - 655) < Math.hypot(actor.x - qiaoActor.x, actor.y - qiaoActor.y);
}

function canHandBackBucket(): boolean {
  return modernReturn && !said('ly-unlocked') && gateAnswered
    && alleyReturnComplete(returnCheckpoint) && actor.y >= 646
    && near(qiaoActor.x, qiaoActor.y, 64);
}
function handBackBucket(): void {
  if (!canHandBackBucket()) return;
  const completed = commitLiuyuanChapterFlag('ly-unlocked');
  if (completed.reason === 'missing-previous') return;
  const height = Math.round(perspectiveScholarHeight(actor.y, ENTRY_ACTOR_SCALE.farFootY,
    ENTRY_ACTOR_SCALE.nearFootY, ENTRY_ACTOR_SCALE.farHeight, ENTRY_ACTOR_SCALE.nearHeight) * actorScalePercent / 100);
  bucketHandover = { ...liuyuanBucketAnchor(actor.x, actor.y, height, actor.dir, true), height, elapsed: 0 };
  carryingBucket = false;
  keys.clear(); pressed.clear();
  chapterComplete.hidden = false;
  updateChapterEcho();
  reset.textContent = '回到门外';
  document.getElementById('modeTitle')!.textContent = '从留园门外，回看这一程';
  document.getElementById('modeIntro')!.textContent = '空桶已交回乔禾。叶片留在你身边，回府学核一核那一个字。';
  document.getElementById('modeNote')!.textContent = '本章已结算。可回《蘇城全圖》或翻看园谱；入口是游戏化场景，不对应清末原门位。';
  showDialogue([
    { who: '观察', words: '你把叶片取出收好，将空桶递给乔禾。她接住桶耳，搁回担边。' },
    { who: '乔禾', words: '这一趟，多谢你。爷爷还在等。你歇歇再走。' },
    { who: '观察', words: drawingChapterEcho(loadProgress().knowledge) },
  ]);
}

function interact(): void {
  if (dialogue) {
    if (dialogue.index < dialogue.lines.length - 1) dialogue.index++;
    else if (dialogue.choices.length === 0) dialogue = null;
    renderDialogue();
    return;
  }
  if (modernReturn) {
    if (canHandBackBucket()) { handBackBucket(); return; }
    if (said('ly-unlocked') && nearWaitingElder()) {
      showDialogue([{ who: '乔老叟', words: '桶回来了？好。歇一歇，别急着赶下一趟。' }]);
      return;
    }
    if (!gateAnswered && near(520, 614, 40)) {
      showDialogue([
        { who: '门房', words: '花房的？桶怎么轻了？' },
        { who: '观察', words: '他搁下修到一半的灯笼，眼睛落在桶上。' },
      ], [
        { label: '递给他掂一掂', act: () => answerReturnGate('hand') },
        { label: '自己掀布给他看', act: () => answerReturnGate('show') },
      ]);
    } else showDialogue([{ who: '观察', words: gateAnswered
      ? '门房已让开。再走几步，街面的光就到了。'
      : '沿同一条夹弄往外走，到门槛前再说话。' }]);
    return;
  }
  if (returnStudy) {
    showDialogue([{ who: '观察', words: alleyReturnComplete(returnCheckpoint)
      ? '窄廊终于放开，门外的天光迎过来。'
      : '同一条窄路，回头走时，光从身后追上来。' }]);
    return;
  }
  if (!said('ly-errand-offered') && near(493, 655, 43)) {
    showDialogue([
      { who: '观察', words: '担头挂着一根竹梆。敲的人没敲。桶上蒙的布是新的，担子却旧。' },
      { who: '乔老叟', words: '阿禾——桶，提稳。这条夹弄，我进去一趟得歇两回。留园，花房的，老主顾了。' },
      { who: '乔禾', words: '我不敢进。那个人问我几岁。' },
    ], [
      { label: '我替你提', act: () => { commitLiuyuanChapterFlag('ly-errand-offered'); carryingBucket = carryingLiuyuanPorridge(loadProgress()); showDialogue([{ who: '观察', words: '担子留在墙根，粥桶提在手上。乔禾向前走了几步，回头等你。' }]); } },
      { label: '让阿禾提', act: () => showDialogue([{ who: '乔老叟', words: '她提得动一桶，提不动一路。' }], [{ label: '我来提', act: () => { commitLiuyuanChapterFlag('ly-errand-offered'); carryingBucket = carryingLiuyuanPorridge(loadProgress()); showDialogue([{ who: '观察', words: '你把桶提在手上。乔禾在前面等。' }]); } }]) },
    ]);
    return;
  }
  if (said('ly-errand-offered') && !said('ly-huabu-seen') && !said('ly-gate-passed') && near(QIAO_GATE.x, QIAO_GATE.y, 32)) {
    showDialogue([
      { who: '乔禾', words: '进小门，十七步，转弯。我跟爷爷走过，走一次记一次。' },
      { who: '乔禾', words: '担子停这儿。人从边上小门进。你往里走，我回去看担子。' },
    ], [{ label: '提桶去小门', act: () => { commitLiuyuanChapterFlag('ly-huabu-seen'); } }]);
    return;
  }
  if (qiaoWaitsByBundle() && near(qiaoActor.x,qiaoActor.y,32) && !nearWaitingElder()) {
    showDialogue([{who:'乔禾',words:'你走你的，我看着担子。空桶出来时，别忘了还我。'}]);
    return;
  }
  if (said('ly-errand-offered') && nearWaitingElder()) {
    showDialogue([{ who: '乔老叟', words: '去吧，担子我守着。送到了，把空桶带回来。' }]);
    return;
  }
  if (said('ly-huabu-seen') && !said('ly-gate-passed') && near(520, 614, 34)) {
    if (!said('ly-gate-clue')) {
      showDialogue([
        { who: '观察', words: '门洞里的人在修一只灯笼，眼睛没抬。' },
        { who: '书生', words: '我想进去。' },
        { who: '门房', words: '送货的走那边。' },
      ], [{ label: '退开想想', act: () => { commitLiuyuanChapterFlag('ly-gate-clue'); } }]);
    } else {
      showDialogue([{ who: '观察', words: '老叟说过：“花房的，老主顾了。”门房仍低头修灯笼。' }], [
        { label: '我给花房送粥', act: () => passGate() },
        { label: '我想进去', act: () => showDialogue([{ who: '门房', words: '送货的走那边。' }]) },

      ]);
    }
    return;
  }
  if (said('ly-gate-passed') && !said('ly-alley-walked') && near(430, 250, 28)) {
    alleyCheckpoint=LIUYUAN_ALLEY_CHECKPOINTS.length;
    showDialogue([{ who: '观察', words: '走过窄廊，光忽然松开了一些。你把桶放在脚边，直了直腰。' }], [
      { label: '放稳桶，歇一口气', act: () => {
        commitLiuyuanChapterFlag('ly-alley-walked');
        bucketRestingAtExit = true;
        carryingBucket = false;
        showDialogue([{ who: '观察', words: '小庭就在眼前，墙上的漏窗还未看清。粥还得送到花匠手里。' }], [
          { label: '再提起桶，沿墙向西', act: () => liftBucket() },
        ]);
      } },
    ]);
    return;
  }
  if (said('ly-alley-walked') && !bucketRestingAtExit
    && near(LIUYUAN_ENTRY_COURT_EXIT.x, LIUYUAN_ENTRY_COURT_EXIT.y, 22)) {
    enterCourt();
    return;
  }
  if (said('ly-alley-walked') && bucketRestingAtExit && near(430, 250, 28)) {
    showDialogue([{ who: '观察', words: '小庭就在眼前，墙上的漏窗还未看清。粥还得送到花匠手里。' }], [
      { label: '提起桶，沿墙向西', act: () => liftBucket() },
    ]);
    return;
  }
  if (said('ly-gate-passed') && !said('ly-alley-walked')) {
    showDialogue([{ who: '观察', words: alleyDirectionHint() }]);
  }
}

function alleyDirectionHint(): string {
  if (near(430,250,28)) return '到窗前空地，放稳粥桶歇一口气，再继续送往花房。';
  // Guide from the current corridor region, even if a previous sample was missed.
  const next = LIUYUAN_ALLEY_CHECKPOINTS[actor.x < 466
    ? actor.y < 324 ? 6 : 5
    : actor.y < 424 ? 3 : actor.y < 504 ? 2 : actor.y < 574 ? 1 : 0];
  const dx = next.x - actor.x, dy = next.y - actor.y;
  const direction = Math.abs(dx) > Math.abs(dy) ? dx < 0 ? '向左' : '向右' : dy < 0 ? '向上' : '向下';
  return `粥还要送到花房。沿脚下石路${direction}走，经过${next.label}。`;
}

function updateInteractionCue(): void {
  let label = '';
  if (!dialogue && !returnWalk) {
    if (!said('ly-errand-offered') && near(493, 655, 43)) label = 'E · 听乔老叟说话';
    else if (said('ly-errand-offered') && !said('ly-huabu-seen') && !said('ly-gate-passed') && near(QIAO_GATE.x, QIAO_GATE.y, 32)) label = 'E · 听乔禾指路';
    else if (qiaoWaitsByBundle() && near(qiaoActor.x,qiaoActor.y,32) && !nearWaitingElder()) label = 'E · 与看担子的乔禾说话';
    else if (said('ly-errand-offered') && nearWaitingElder()) label = 'E · 与担边的乔老叟说话';
    else if (said('ly-huabu-seen') && !said('ly-gate-passed') && near(520, 614, 34)) label = 'E · 与门房应答';
    else if (said('ly-alley-walked') && !bucketRestingAtExit
      && near(LIUYUAN_ENTRY_COURT_EXIT.x, LIUYUAN_ENTRY_COURT_EXIT.y, 22)) label = 'E · 转过墙角，走入小庭';
    else if (bucketRestingAtExit && near(430, 250, 28)) label = 'E · 提起粥桶';
    else if (!said('ly-alley-walked') && said('ly-gate-passed')
      && near(430, 250, 28)) label = 'E · 在小庭口歇脚';
  } else if (!dialogue && canHandBackBucket()) {
    label = 'E · 把空桶交还乔禾';
  } else if (!dialogue && modernReturn && said('ly-unlocked') && nearWaitingElder()) {
    label = 'E · 与担边的乔老叟说话';
  } else if (!dialogue && modernReturn && !gateAnswered
    && near(520, 614, 40)) {
    label = 'E · 向门房交代空桶';
  }
  interactionCue.hidden = !label;
  interactionCue.textContent = label;
  if (label) interactButton.textContent = label.replace(/^E · /, '');
  else interactButton.textContent = returnStudy ? '查看' : '交谈 / 查看';
  if (!label && !dialogue && !returnWalk
    && said('ly-gate-passed') && !said('ly-alley-walked')) {
    interactionCue.hidden = false;
    interactionCue.textContent = alleyDirectionHint();
  }
}
function answerReturnGate(choice: 'hand' | 'show'): void {
  gateAnswered = true;
  returnCheckpoint = Math.max(returnCheckpoint, LIUYUAN_ALLEY_RETURN_CHECKPOINTS.length-1);
  showDialogue([
    { who: '观察', words: choice === 'hand'
      ? '他接过空桶掂了掂，听见桶底轻轻一响，又递回来。'
      : '你掀起桶布。他看见桶底已空，只把灯笼往旁边挪了挪。' },
    { who: '门房', words: said('ly-rain-shadow-cleared')
      ? '粥送到了就好。你手里还多了一页兰稿？花匠肯送东西，倒难得。'
      : said('ly-lantern-helped') ? '粥送到了就好。灯还稳着呢。走罢，别挡着门。'
      : '粥送到了就好。走罢，别挡着门。' },
  ]);
}

function liftBucket(): void {
  bucketRestingAtExit = false;
  carryingBucket = carryingLiuyuanPorridge(loadProgress());
  const notice = document.getElementById('resumeNotice')!;
  if (!notice.hidden) notice.textContent = '桶已提起；沿漏窗南侧的石路向西。';
}

function enterCourt(): void {
  if (!said('ly-alley-walked') || bucketRestingAtExit
    || !near(LIUYUAN_ENTRY_COURT_EXIT.x, LIUYUAN_ENTRY_COURT_EXIT.y, 22)) return;
  leavingEntry = true;
  clearEntryResume(resumeSlot);
  location.assign(chapterSceneHref('liuyuan-court.html', params.get('draft') === '1'));
}

function trace(points: readonly WorldPoint[]): void {
  ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
}

function redrawBackgroundPolygon(points: readonly WorldPoint[]): void {
  if (!background.complete || !background.naturalWidth) return;
  ctx.save(); trace(points); ctx.clip();
  ctx.drawImage(background, 0, 0, 1008, 688);
  ctx.restore();
}

function drawPlateDebug(): void {
  const beatColor: Record<string, string> = { gate: '#ff3b30', bend: '#ffb300', windows: '#34c759' };
  ctx.save();
  ctx.globalAlpha = .1;
  for (let y = 0; y < mapData.h; y++) for (let x = 0; x < mapData.w; x++) {
    const tile = mapData.map[y * mapData.w + x];
    if (tile === T.PATH || tile === T.CORR) {
      ctx.fillStyle = '#00ff88'; ctx.fillRect(x * 16, y * 16, 16, 16);
    }
  }
  ctx.restore();
  ctx.save();
  ctx.lineWidth = 2;
  ctx.font = '11px monospace';
  LIUYUAN_ENTRY_SHOT_KEYS.forEach((key, index) => {
    const beat = index < 3 ? 'gate' : index < 8 ? 'bend' : 'windows';
    ctx.strokeStyle = beatColor[beat];
    ctx.globalAlpha = .7;
    ctx.strokeRect(key.cameraX + .5, key.cameraY + .5, LIUYUAN_ENTRY_VIEW.width - 1, LIUYUAN_ENTRY_VIEW.height - 1);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffe600';
    ctx.fillRect(key.footX - 3, key.footY - 3, 6, 6);
    ctx.fillStyle = 'rgba(20,24,20,.72)';
    ctx.fillRect(key.footX + 5, key.footY - 13, 58, 13);
    ctx.fillStyle = '#ffe600';
    ctx.fillText(`${String(index + 1).padStart(2, '0')} ${beat}`, key.footX + 7, key.footY - 3);
  });
  ctx.globalAlpha = .9;
  ctx.strokeStyle = '#2f7bff';
  ctx.beginPath();
  LIUYUAN_ENTRY_SHOT_KEYS.forEach((key, index) => index ? ctx.lineTo(key.footX, key.footY) : ctx.moveTo(key.footX, key.footY));
  ctx.stroke();
  ctx.restore();
}

function drawDebug(): void {
  ctx.save();
  ctx.globalAlpha = .55;
  for (let y = 0; y < mapData.h; y++) for (let x = 0; x < mapData.w; x++) {
    const tile = mapData.map[y * mapData.w + x];
    if (tile === T.PATH || tile === T.CORR) {
      ctx.fillStyle = tile === T.CORR ? '#759a89' : '#b9a673';
      ctx.fillRect(x * 16, y * 16, 16, 16);
    } else if (tile === T.WATER) {
      ctx.fillStyle = '#567d87'; ctx.fillRect(x * 16, y * 16, 16, 16);
    }
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(220, 66, 55, .7)';
  for (const shape of obstacles) {
    if ('x' in shape) ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
    else {
      ctx.beginPath(); shape.points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath(); ctx.fill();
    }
  }
  for (const node of graph.nodes) {
    ctx.fillStyle = '#503d6a'; ctx.fillRect(node.x - 2, node.y - 2, 4, 4);
  }
  const p = STANDARD_PLAYER_PROFILE;
  ctx.strokeStyle = '#bf3f81'; ctx.lineWidth = 1;
  ctx.strokeRect(actor.x - p.halfW + .5, actor.y - p.topInset + .5,
    p.halfW * 2 - 1, p.topInset - p.bottomInset - 1);
}

function draw(): void {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#ebe8df'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Camera follows the route's three authored reveals, not a fixed actor-center offset.
  const cameraX = Math.round(entryCamera.x);
  const cameraY = Math.round(entryCamera.y);
  ctx.save();
  ctx.scale(ENTRY_ACTOR_SCALE.cameraZoom, ENTRY_ACTOR_SCALE.cameraZoom);
  ctx.translate(-cameraX, -cameraY);
  if (background.complete && background.naturalWidth) ctx.drawImage(background, 0, 0, 1008, 688);
  if (atmosphereStudyEnabled && atmosphereLayer.complete && atmosphereLayer.naturalWidth)
    ctx.drawImage(atmosphereLayer, 0, 0, 1008, 688);
  if (plateDebug) drawPlateDebug();
  if (showTiles.checked) drawDebug();
  // The fictional lamp is already part of the gatekeeper sprite. A small
  // hard-edged warm patch shows that the optional repair changed this place.
  if (!returnStudy && said('ly-lantern-helped')) {
    ctx.fillStyle = 'rgba(218, 170, 101, .12)'; ctx.fillRect(557, 583, 22, 23);
    ctx.fillStyle = 'rgba(232, 187, 111, .16)'; ctx.fillRect(561, 588, 13, 14);
  }
  const people: { y: number; draw: () => void }[] = [];
  if (!returnStudy && gateNpcs.complete && gateNpcs.naturalWidth) {
    // People stay at their work places; camera movement takes them out of view.
    people.push({ y: 655, draw: () => drawSeatedNpcAtFoot(0, 200, 456, 816, 493, 655, 52) });
    people.push({ y: 613, draw: () => drawSeatedNpcAtFoot(768, 106, 490, 822, 558, 613, 54) });
  }
  if (!returnStudy && qiao.complete && qiao.naturalWidth) people.push({ y: qiaoActor.y, draw: () => {
    drawQiaoAtFoot(qiaoActor.x, qiaoActor.y, qiaoActor.moving, qiaoActor.walkTime);
  } });
  for (const person of people.filter((person) => person.y <= actor.y)) person.draw();
  const actorHeight = Math.round(perspectiveScholarHeight(actor.y, ENTRY_ACTOR_SCALE.farFootY,
    ENTRY_ACTOR_SCALE.nearFootY, ENTRY_ACTOR_SCALE.farHeight, ENTRY_ACTOR_SCALE.nearHeight)
    * actorScalePercent / 100);
  drawScholarGroundShadow(ctx, actor.x, actor.y, actorHeight);
  if (sprite.complete && sprite.naturalWidth) {
    const frame = actor.moving ? 1 + (Math.floor(actor.walkTime * 6) % 2) : 0;
    drawScholarAtFoot(ctx, sprite, actor.dir, frame, actor.x, actor.y, actorHeight);
  } else {
    ctx.fillStyle = '#334e47'; ctx.fillRect(actor.x - 7, actor.y - 30, 14, 30);
  }
  if (carryingBucket) drawLiuyuanPorridgeBucket(ctx, actor.x, actor.y, actorHeight, actor.dir, true);
  if (bucketRestingAtExit) drawLiuyuanPorridgeBucket(ctx, 455, 250, actorHeight, 0, false);
  if (bucketHandover) {
    const t = Math.min(1, bucketHandover.elapsed / .75), blend = t * t * (3 - 2 * t);
    const x = bucketHandover.x + (RETURNED_BUCKET.x - bucketHandover.x) * blend;
    const y = bucketHandover.y + (RETURNED_BUCKET.y - bucketHandover.y) * blend - 4 * Math.sin(Math.PI * t);
    drawLiuyuanPorridgeBucket(ctx, x, y, bucketHandover.height + (49 - bucketHandover.height) * blend, 0, false, false);
  } else if (modernReturn && said('ly-unlocked')) {
    drawLiuyuanPorridgeBucket(ctx, RETURNED_BUCKET.x, RETURNED_BUCKET.y, 49, 0, false);
  }

  for (const person of people.filter((person) => person.y > actor.y)) person.draw();
  // The unified editor owns front masks and their object foot-depth. Repaint only
  // the matching part of this same background; masks never alter Tile or NPC routes.
  for (const object of geometry) {
    const mask = object.occluder;
    if (!mask || actor.y >= mask.depthY) continue;
    for (const polygon of mask.polygons) redrawBackgroundPolygon(polygon);
  }
  ctx.restore();
}

let lastTime = 0;
function tick(now: number): void {
  const dt = Math.min(.05, (now - (lastTime || now)) / 1000); lastTime = now;
  if (bucketHandover) {
    bucketHandover.elapsed += dt;
    if (bucketHandover.elapsed >= .75) bucketHandover = null;
  }
  if (!returnStudy) {
    const target = modernReturn ? gateAnswered ? QIAO_RETURN_WAIT : QIAO_START
      : qiaoWaitsByBundle() ? QIAO_START : said('ly-errand-offered') ? QIAO_GATE : QIAO_START;
    const dx = target.x - qiaoActor.x;
    const dy = target.y - qiaoActor.y;
    const remaining = Math.hypot(dx, dy);
    qiaoActor.moving = remaining > .5;
    if (qiaoActor.moving) {
      const step = Math.min(remaining, 52 * dt);
      qiaoActor.x += dx / remaining * step;
      qiaoActor.y += dy / remaining * step;
      qiaoActor.walkTime += dt;
    }
  }
  const active = (dir: string) => keys.has(dir) || pressed.has(dir);
  const dx = Number(active('right')) - Number(active('left'));
  const dy = Number(active('down')) - Number(active('up'));
  actor.moving = !dialogue && !bucketHandover && (dx !== 0 || dy !== 0);
  if (actor.moving) {
    // Sprite rows are down, left, right, up.
    actor.dir = dy > 0 ? 0 : dy < 0 ? 3 : dx > 0 ? 2 : 1;
    actor.walkTime += dt;
    const unit = Math.hypot(dx, dy);
    const previous = { x: actor.x, y: actor.y };
    moveEntity(mapData.map, actor, dx / unit * 90 * dt, dy / unit * 90 * dt,
      mapData.w, mapData.h, obstacles, STANDARD_PLAYER_PROFILE);
    if (!returnWalk && !said('ly-gate-passed') && actor.y < (said('ly-errand-offered') ? 600 : 615)) {
      if (said('ly-errand-offered')) {
        commitLiuyuanChapterFlag('ly-gate-passed');
      } else {
      actor.x = previous.x; actor.y = previous.y;
      // An invisible story gate must speak when the player reaches it.
      if (near(520, 615, 34)) {
        if (said('ly-huabu-seen')) interact();
        else showDialogue([{ who: '乔禾', words: '先过来。我认得这道小门，你听我说。' }]);
      }
      }
    }
    if (modernReturn && !gateAnswered && actor.y > 625) {
      actor.x = previous.x; actor.y = previous.y;
      if (near(520, 614, 40)) interact();
    }
    if (returnWalk) {
      const wasComplete = alleyReturnComplete(returnCheckpoint);
      returnCheckpoint = advanceAlleyReturnCheckpoint(returnCheckpoint, actor.x, actor.y);
      // Route samples are reminders, not a hidden ordered challenge.
      if (near(returnFinish.x,returnFinish.y,10) && (!modernReturn || gateAnswered))
        returnCheckpoint=LIUYUAN_ALLEY_RETURN_CHECKPOINTS.length;
      if (!wasComplete && alleyReturnComplete(returnCheckpoint)) {
        if (modernReturn && canCompleteLiuyuanReturn(returnCheckpoint, gateAnswered)) {
          status.textContent = '乔禾在担边等你。把空桶亲手交回去，叶片留在身边。';
        } else if (returnStudy) showDialogue([
          { who: '观察', words: '窄廊终于放开，门外的天光迎过来。' },
        ]);
      }
    } else if (said('ly-gate-passed') && !said('ly-alley-walked')) {
      alleyCheckpoint = advanceAlleyCheckpoint(alleyCheckpoint, actor.x, actor.y);
      if (near(430,250,22)) {
        alleyCheckpoint=LIUYUAN_ALLEY_CHECKPOINTS.length;
        interact();
      }
    }
  }
  const atGoal = near(LIUYUAN_ENTRY_COURT_EXIT.x, LIUYUAN_ENTRY_COURT_EXIT.y, 22);
  if (modernReturn) status.textContent = hasStoryFlag(loadProgress(), 'ly-unlocked')
    ? '已从门外走出，留园章完成。'
    : canHandBackBucket() ? '乔禾在担边等着。按 E 或交谈，把空桶交还她。'
    : gateAnswered ? '门房已让开。再走到街面。'
    : returnCheckpoint >= LIUYUAN_ALLEY_RETURN_CHECKPOINTS.length-1 ? '门槛内，停步与门房说话。'
    : '提着空桶沿夹弄返回；门外还有乔禾。';
  else if (returnStudy) status.textContent = alleyReturnComplete(returnCheckpoint)
    ? '你已沿夹弄回到门外；此处尚不是正式出园。'
    : '从小庭折回夹弄，亲自走过窄处，再到门外。';
  else if (atGoal) status.textContent = said('ly-alley-walked') && !bucketRestingAtExit
    ? '转角到了。按 E 或点按钮，沿石路走入小庭。'
    : bucketRestingAtExit ? '粥桶还在窗前。先回去提起，再继续送粥。' : '墙根有风，远处像有水声。';
  else if (!said('ly-errand-offered')) status.textContent = '墙根的旧担子还在，乔老叟抬眼看你。';
  else if (!said('ly-huabu-seen') && !said('ly-gate-passed')) status.textContent = '乔禾在门外等候。可以问路，也可以直接提桶进门。';
  else if (!said('ly-gate-passed')) status.textContent = '门房没有抬头，手里那只灯笼还没扎完。';
  else if (alleyWalkComplete(alleyCheckpoint) && !said('ly-alley-walked')) status.textContent = '脚边有处空地，桶沿轻轻磕在石上。';
  else if (said('ly-alley-walked') && near(430, 250, 28)) status.textContent = bucketRestingAtExit
    ? '桶还放在脚边。提起后，沿漏窗南侧的石路向西。' : '桶提稳了。沿墙向西，转角处的石路接着往里。';
  else status.textContent = alleyCheckpoint < 2 ? '身后的说话声渐远，脚下石路仍窄。'
    : alleyCheckpoint < 4 ? '廊子把天光压低了，转角处有一线亮。'
    : alleyCheckpoint < 6 ? '墙外有叶影动，桶里的粥还温着。'
    : '路忽然宽了一点，风从前面进来。';
  updateInteractionCue();
  const cameraTarget = entryCameraForFoot(actor.x, actor.y);
  const cameraEase = 1 - Math.exp(-8 * dt);
  entryCamera.x += (cameraTarget.x - entryCamera.x) * cameraEase;
  entryCamera.y += (cameraTarget.y - entryCamera.y) * cameraEase;
  entryCamera.beat = cameraTarget.beat;
  coords.hidden = !showTiles.checked;
  if (showTiles.checked) coords.textContent = `脚点 (${Math.round(actor.x)}, ${Math.round(actor.y)}) · 取景 ${entryCamera.beat}`;
  if (now - lastResumeWrite >= 250) { saveEntryResume(); lastResumeWrite = now; }
  draw(); requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
// Direct practice entry never grants gate/quest flags, regardless of URL/save state.
if (params.get('minigame') === 'rain-shadow') location.assign(chapterSceneHref('liuyuan-flower.html', params.get('draft') === '1') + '&minigame=rain-shadow');
