import { carryLiuyuanPlaytest, isLiuyuanPlaytest } from './core/liuyuan-playtest.js';
import { drawingChapterEcho } from './core/liuyuan-drawing-echo.js';
import { artStage, hasStoryFlag, loadProgress, type ArtId, type GardenId } from './core/progression.js';

const progress = loadProgress();
document.getElementById('liuyuanJourney')!.hidden = !hasStoryFlag(progress, 'ly-unlocked');
document.getElementById('liuyuanJourneyWords')!.textContent = drawingChapterEcho(progress.knowledge);
const artOrder: Array<[ArtId, string]> = [
  ['li', '礼'], ['yue', '乐'], ['she', '射'], ['yu', '御'], ['shu', '书'], ['shuMath', '数'],
];

for (const [id, label] of artOrder) {
  const item = document.querySelector<HTMLElement>(`[data-art="${id}"]`);
  if (!item) continue;
  const value = progress.arts[id];
  item.querySelector('b')!.textContent = label;
  item.querySelector('span')!.textContent = artStage(value);
  item.classList.toggle('has-progress', value > 0);
}

document.querySelectorAll<HTMLElement>('[data-garden]').forEach((node) => {
  const id = node.dataset.garden as GardenId;
  const state = progress.gardens[id];
  node.dataset.state = state;
  const stateLabel = node.querySelector<HTMLElement>('[data-state]');
  if (stateLabel) stateLabel.textContent = state === 'complete' ? '已访' : state === 'entered' ? '已入园' : state === 'open' ? '可入园' : state === 'clue' ? '新线索' : '未解锁';
});

const questTitle = document.getElementById('questTitle')!;
const questBody = document.getElementById('questBody')!;
const canglangDone = progress.completedTasks.includes('canglang-three-windows');
questTitle.textContent = canglangDone ? '课二 · 网师园的那条船……' : '课一 · 到了复廊，替我看一眼水';
questBody.textContent = canglangDone
  ? '三窗已经收入园谱。《蘇城全圖》东南一带浮出新的墨痕，但入园条件尚未齐备。'
  : '从城南进入沧浪亭，沿临水复廊完成“看—对—合”，修习数艺的第一课。';

// 调试/回看序章时，把强制入园场景沿世界层传递下去；正式首轮由存档标记自动触发。
if (new URLSearchParams(location.search).get('scene') === 'prologue') {
  document.querySelectorAll<HTMLAnchorElement>('a[href="garden.html"]').forEach((link) => {
    link.href = 'garden.html?scene=arrival';
  });
}

// Core chapter exits keep the save slot, including an existing prologue parameter.
if (isLiuyuanPlaytest()) {
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(link => {
    const href = link.getAttribute('href') ?? '';
    if (!/^(home|journal|liuyuan-entry|garden)\.html(?:[?#]|$)/.test(href)) return;
    const [target, hash] = href.split('#');
    const [page, search = ''] = target.split('?');
    const query = new URLSearchParams(search);
    carryLiuyuanPlaytest(query);
    link.href = `${page}?${query}${hash === undefined ? '' : `#${hash}`}`;
  });
}
