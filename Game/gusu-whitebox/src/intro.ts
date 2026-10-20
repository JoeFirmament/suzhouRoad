import { hasStarted, hasStoryFlag, loadProgress, markStoryFlag, resetProgress, type ProgressData } from './core/progression.js';

type OpeningBeat = {
  scene: 'arrival' | 'fork' | 'gate';
  place: string;
  speaker: string;
  title: string;
  body: string;
  duration: number;
};

const beats: OpeningBeat[] = [
  {
    scene: 'arrival', place: '清末 · 苏州城南', speaker: '',
    title: '［隔水传来曲笛与缓慢的拍板］', body: '水面先有了声音。', duration: 5200,
  },
  {
    scene: 'arrival', place: '城南水边 · 清晨', speaker: '你',
    title: '曲声在水那边，又像从前面的巷子里来。', body: '石面还湿。你循着声音，走进一条不熟悉的路。', duration: 6500,
  },
  {
    scene: 'fork', place: '临水岔路', speaker: '陌生学子',
    title: '“再往前，是去听曲，不是去府学。”', body: '他越过你两步，看见你腰间的府学名帖，才停下来。', duration: 7000,
  },
  {
    scene: 'fork', place: '临水岔路', speaker: '陌生学子',
    title: '“唱在水那边，声音却绕到这里。”', body: '“苏州的路，不能只拿耳朵认。我也回府学——跟紧些。”', duration: 7500,
  },
  {
    scene: 'gate', place: '苏州府学 · 门前', speaker: '陌生学子',
    title: '“到了。先别忙着找先生。”', body: '“你连书箱往哪儿放都不知道。”', duration: 6500,
  },
  {
    scene: 'gate', place: '苏州府学 · 门槛', speaker: '陌生学子',
    title: '“进来。”', body: '清晨还早。从放下书箱开始。', duration: Infinity,
  },
];

const progress = loadProgress();
const continueButton = document.getElementById('continueButton') as HTMLButtonElement;
const newGameButton = document.getElementById('newGameButton') as HTMLButtonElement;
const saveGlimpse = document.getElementById('saveGlimpse')!;
const opening = document.getElementById('opening') as HTMLElement;
const openingImage = document.getElementById('openingImage')!;
const openingAnimation = document.getElementById('openingAnimation') as HTMLCanvasElement;
const animationCtx = openingAnimation.getContext('2d', { alpha: true })!;
const openingPlace = document.getElementById('openingPlace')!;
const openingSpeaker = document.getElementById('openingSpeaker')!;
const openingTitle = document.getElementById('openingTitle')!;
const openingBody = document.getElementById('openingBody')!;
const openingCount = document.getElementById('openingCount')!;
const openingNext = document.getElementById('openingNext') as HTMLButtonElement;
const skipOpening = document.getElementById('skipOpening') as HTMLButtonElement;
const confirmLayer = document.getElementById('newGameConfirm') as HTMLElement;
const cancelNewGame = document.getElementById('cancelNewGame') as HTMLButtonElement;
const confirmNewGame = document.getElementById('confirmNewGame') as HTMLButtonElement;
let beatIndex = 0;
let sceneStartedAt = performance.now();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const playerSprite = new Image();
playerSprite.src = '../assets/characters/scholar-player-sprites-v1.png';
const shenSprite = new Image();
shenSprite.src = '../assets/characters/shen-yanqiu-sprites-v1.png';
const SPRITE_CELL = 362;

type ActorColors = { robe: string; robeDark: string; accent: string };
const actorColors: Record<'student' | 'shen' | 'ajin' | 'teacher', ActorColors> = {
  student: { robe: '#d8ceae', robeDark: '#7e796d', accent: '#8f271d' },
  shen: { robe: '#6fa89e', robeDark: '#2a514c', accent: '#c8a04b' },
  ajin: { robe: '#b0bfa8', robeDark: '#6b4c2f', accent: '#c8a04b' },
  teacher: { robe: '#7e796d', robeDark: '#2b2824', accent: '#a39d90' },
};

function pxRect(x: number, y: number, w: number, h: number, color: string): void {
  animationCtx.fillStyle = color;
  animationCtx.fillRect(Math.round(x), Math.round(y), w, h);
}

function drawActor(x: number, y: number, colors: ActorColors, walking: boolean, time: number, facing = 1, carryingPaper = false): void {
  const step = walking && !reducedMotion ? Math.floor(time / 170) % 2 : 0;
  const bob = walking && !reducedMotion ? step : 0;
  const dir = facing < 0 ? -1 : 1;
  const yy = Math.round(y - bob);

  pxRect(x - 8, yy + 1, 17, 3, 'rgba(23,21,18,.38)');
  pxRect(x - 6, yy - 35, 13, 4, '#2b2824');
  pxRect(x - 8, yy - 31, 17, 4, '#171512');
  pxRect(x - 5, yy - 27, 11, 8, '#c8a47c');
  pxRect(x - 7, yy - 19, 15, 18, colors.robe);
  pxRect(x - 7, yy - 8, 15, 4, colors.accent);
  pxRect(x - 7, yy - 3, 15, 3, colors.robeDark);
  pxRect(x - 5 - step, yy, 4, 5, colors.robeDark);
  pxRect(x + 2 + step, yy, 4, 5, colors.robeDark);
  pxRect(x + dir * 7 - (dir < 0 ? 3 : 0), yy - 18 + step, 4, 11, '#b6906c');
  if (carryingPaper) {
    const paperX = x + dir * 11 - (dir < 0 ? 10 : 0);
    pxRect(paperX, yy - 18, 9, 7, '#f2ead6');
    pxRect(paperX + 1, yy - 16, 7, 1, '#a39d90');
  }
}

/** Intro 中的玩家必须与标题、园林场景共用同一角色母版。 */
function drawStudent(x: number, y: number, walking: boolean, time: number, facing: 'front' | 'left' | 'right' | 'back' = 'right'): void {
  if (!playerSprite.complete || playerSprite.naturalWidth === 0) {
    drawActor(x, y, actorColors.student, walking, time, facing === 'left' ? -1 : 1, true);
    return;
  }
  const step = walking && !reducedMotion ? Math.floor(time / 170) % 2 : 0;
  const bob = walking && !reducedMotion ? step : 0;
  const row = { front: 0, left: 1, right: 2, back: 3 }[facing];
  const frame = walking ? step + 1 : 0;
  const yy = Math.round(y - bob);
  pxRect(x - 8, yy + 1, 17, 3, 'rgba(23,21,18,.38)');
  animationCtx.drawImage(
    playerSprite,
    frame * SPRITE_CELL, row * SPRITE_CELL, SPRITE_CELL, SPRITE_CELL,
    Math.round(x - 18), Math.round(yy - 48), 36, 49,
  );
}

function drawShen(x: number, y: number, walking: boolean, time: number, facing: 'front' | 'left' | 'right' | 'back' = 'left'): void {
  if (!shenSprite.complete || shenSprite.naturalWidth === 0) {
    drawActor(x, y, actorColors.shen, walking, time, facing === 'left' ? -1 : 1);
    return;
  }
  const step = walking && !reducedMotion ? Math.floor(time / 170) % 2 : 0;
  const bob = walking && !reducedMotion ? step : 0;
  const row = { front: 0, left: 1, right: 2, back: 3 }[facing];
  const frame = walking ? step + 1 : 0;
  const yy = Math.round(y - bob);
  pxRect(x - 8, yy + 1, 17, 3, 'rgba(23,21,18,.38)');
  animationCtx.drawImage(
    shenSprite,
    frame * SPRITE_CELL, row * SPRITE_CELL, SPRITE_CELL, SPRITE_CELL,
    Math.round(x - 18), Math.round(yy - 48), 36, 49,
  );
}

function drawCityGate(): void {
  pxRect(208, 32, 70, 58, 'rgba(43,40,36,.68)');
  pxRect(200, 29, 86, 8, 'rgba(23,21,18,.82)');
  pxRect(216, 45, 18, 45, 'rgba(23,21,18,.75)');
  pxRect(252, 45, 18, 45, 'rgba(23,21,18,.75)');
  pxRect(234, 57, 18, 33, 'rgba(111,168,158,.24)');
  for (let x = 200; x < 286; x += 8) pxRect(x, 27 + (x % 16 ? 0 : -2), 6, 3, '#55524a');
}

function drawDeskAndAlbum(): void {
  pxRect(190, 72, 76, 8, '#6b4c2f');
  pxRect(196, 80, 6, 18, '#55524a');
  pxRect(253, 80, 6, 18, '#55524a');
  pxRect(213, 65, 34, 8, '#f2ead6');
  pxRect(230, 65, 1, 8, '#8f271d');
  pxRect(217, 68, 10, 1, '#a39d90');
  pxRect(234, 68, 10, 1, '#a39d90');
}

function drawWindows(time: number): void {
  for (let i = 0; i < 3; i++) {
    const active = reducedMotion ? i === 2 : Math.floor(time / 700) % 3 === i;
    const x = 178 + i * 32;
    pxRect(x, 48, 22, 28, '#2b2824');
    pxRect(x + 3, 51, 16, 22, active ? '#c8a04b' : '#6fa89e');
    pxRect(x + 5, 53, 12, 18, active ? '#8f271d' : '#2a514c');
  }
}

function drawOpeningAnimation(time: number): void {
  animationCtx.clearRect(0, 0, openingAnimation.width, openingAnimation.height);
  animationCtx.imageSmoothingEnabled = false;
  if (opening.hidden) { requestAnimationFrame(drawOpeningAnimation); return; }

  let elapsed = time - sceneStartedAt;
  const beatDuration = reducedMotion ? Math.min(beats[beatIndex].duration, 2200) : beats[beatIndex].duration;
  if (elapsed >= beatDuration && beatIndex < beats.length - 1) {
    beatIndex += 1;
    renderOpening();
    elapsed = 0;
  }
  const walk = reducedMotion ? 1 : Math.min(elapsed / Math.max(3400, beats[beatIndex].duration - 1000), 1);
  const bobTime = reducedMotion ? 0 : elapsed;

  if (beatIndex === 0) {
    if (elapsed > 1300) drawStudent(38 + walk * 52, 112, walk < 1, bobTime, 'right');
    for (let i = 0; i < 5; i++) pxRect(24 + i * 26, 120 - i, 7, 1, 'rgba(200,160,75,.32)');
  } else if (beatIndex === 1) {
    drawStudent(62 + walk * 126, 112, walk < 1, bobTime, 'right');
  } else if (beatIndex === 2) {
    drawStudent(133, 112, false, bobTime, 'right');
    drawShen(250 - walk * 70, 112, walk < .82, bobTime, 'left');
  } else if (beatIndex === 3) {
    const leave = Math.max(0, (walk - .45) / .55);
    drawStudent(136 + leave * 54, 112, leave > 0, bobTime, 'right');
    drawShen(181 + leave * 54, 112, leave > 0, bobTime, leave > 0 ? 'right' : 'left');
  } else if (beatIndex === 4) {
    drawShen(154 + walk * 54, 112, walk < 1, bobTime, 'right');
    drawStudent(112 + walk * 54, 112, walk < 1, bobTime, 'right');
  } else {
    drawStudent(178, 112, false, bobTime, 'right');
    drawShen(221, 112, false, bobTime, 'left');
  }
  requestAnimationFrame(drawOpeningAnimation);
}

function chapterLabel(data: ProgressData): string {
  return data.completedTasks.includes('canglang-three-windows') ? '章间 · 新的墨痕' : '第一章 · 水外有园';
}

function continueTarget(data: ProgressData): string {
  if (data.completedTasks.includes('canglang-three-windows')) return 'home.html';
  if (!hasStoryFlag(data, 'home-orientation-complete')) return 'home.html?scene=arrival';
  if (hasStoryFlag(data, 'fuxue-briefing-seen')) return 'sucheng.html';
  return 'home.html';
}

function renderSave(data: ProgressData): void {
  const started = hasStarted(data);
  continueButton.disabled = !started;
  if (!started) return;
  const completedGardens = Object.values(data.gardens).filter((state) => state === 'complete').length;
  const artsStarted = Object.values(data.arts).filter((value) => value > 0).length;
  saveGlimpse.innerHTML = `<p>本地游历记录</p><strong>${chapterLabel(data)}</strong><span>已访 ${completedGardens} / 9 园　·　六艺初修 ${artsStarted} / 6</span>`;
}

function renderOpening(): void {
  const beat = beats[beatIndex];
  sceneStartedAt = performance.now();
  openingImage.dataset.scene = beat.scene;
  openingPlace.textContent = beat.place;
  openingSpeaker.textContent = beat.speaker;
  openingTitle.textContent = beat.title;
  openingBody.textContent = beat.body;
  openingCount.textContent = beatIndex === beats.length - 1 ? '门槛之内，行动由你开始' : '';
  openingNext.hidden = beatIndex !== beats.length - 1;
  openingNext.textContent = '跨过门槛';
}

function startOpening(): void {
  beatIndex = 0;
  opening.hidden = false;
  renderOpening();
  openingNext.focus();
}

function finishOpening(): void {
  markStoryFlag('opening-arrival-seen');
  location.href = 'home.html?scene=arrival';
}

continueButton.addEventListener('click', () => {
  if (!hasStoryFlag(progress, 'opening-arrival-seen')) startOpening();
  else location.href = continueTarget(progress);
});

newGameButton.addEventListener('click', () => {
  if (hasStarted(progress)) {
    confirmLayer.hidden = false;
    cancelNewGame.focus();
  } else {
    resetProgress();
    startOpening();
  }
});

cancelNewGame.addEventListener('click', () => {
  confirmLayer.hidden = true;
  newGameButton.focus();
});
confirmNewGame.addEventListener('click', () => {
  resetProgress();
  confirmLayer.hidden = true;
  startOpening();
});
openingNext.addEventListener('click', () => {
  if (beatIndex === beats.length - 1) finishOpening();
});
skipOpening.addEventListener('click', finishOpening);
addEventListener('keydown', (event) => {
  if (!opening.hidden && !openingNext.hidden && ['Enter', ' '].includes(event.key)) {
    event.preventDefault();
    openingNext.click();
  }
});

renderSave(progress);
if (new URLSearchParams(location.search).get('mode') === 'opening') startOpening();
requestAnimationFrame(drawOpeningAnimation);
