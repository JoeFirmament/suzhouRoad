import {
  INITIAL_STONE_STUDY, STONE_BOARD, STONE_RADII, assessStoneComposition,
  nudgeStudyStone, placeStudyStone, readStoneSpacing, selectStudyStone,
  type StoneIndex, type StoneStudyState,
} from './core/liuyuan-composition-study.js';
import { loadCompositionDraft, saveCompositionDraft } from './core/liuyuan-composition-save.js';
import { compositionRouteHref } from './core/liuyuan-composition-route.js';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const feedback = document.getElementById('feedback')!;
const liveRead = document.getElementById('liveRead')!;
const analysis = document.getElementById('analysis')!;
const analysisText = document.getElementById('analysisText')!;
const practice = document.getElementById('practice')!;
const saveNote = document.getElementById('saveNote')!;
const nextAfterReview = document.getElementById('nextAfterReview')!;
const params = new URLSearchParams(location.search);
const chapter = params.get('chapter') === '1';
const previewRequested = params.get('draft') === '1';
(document.getElementById('returnFlower') as HTMLAnchorElement).href = compositionRouteHref('liuyuan-flower.html', chapter, previewRequested);
(document.getElementById('returnAlbum') as HTMLAnchorElement).href = compositionRouteHref('liuyuan-flower.html', chapter, previewRequested, true);

const stoneButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-stone]')];
const nudgeButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-nudge]')];
const restored = loadCompositionDraft(chapter).stone;
let state: StoneStudyState = restored ? structuredClone(restored.state) : structuredClone(INITIAL_STONE_STUDY);
let exampleViewed = restored?.exampleViewed ?? false;
let reviewed = restored?.passed ?? false;
let dragging: StoneIndex | null = null;
let dragOrigin: StoneStudyState | null = null;
const history: StoneStudyState[] = [];
practice.hidden = !exampleViewed;

function colors(index: StoneIndex): { base: string; lit: string; shade: string } {
  return [
    { base: '#626a64', lit: '#95978a', shade: '#3b4540' },
    { base: '#70776e', lit: '#aaab98', shade: '#454d47' },
    { base: '#565f5b', lit: '#899085', shade: '#343d39' },
  ][index];
}

function drawStone(index: StoneIndex): void {
  const { x, y } = state.stones[index];
  const r = STONE_RADII[index];
  const palette = colors(index);
  const shape: readonly [number, number][] = index === 0
    ? [[-.67,.8],[-.7,.42],[-.48,.22],[-.44,-.2],[-.16,-.57],[.02,-.79],[.17,-.33],[.37,-.53],[.59,-.16],[.67,.4],[.43,.65],[.11,.79]]
    : index === 1
      ? [[-.79,.66],[-.68,.18],[-.48,-.17],[-.12,-.24],[.04,-.64],[.27,-.39],[.49,-.43],[.75,.02],[.7,.47],[.48,.69],[.06,.72],[-.34,.82]]
      : [[-.53,.78],[-.61,.4],[-.35,.11],[-.28,-.43],[-.05,-.74],[.13,-.26],[.33,-.58],[.56,-.11],[.49,.45],[.24,.72]];

  ctx.save();
  ctx.translate(x, y);
  // The broken silhouette and two ink planes keep each sample recognizable at game scale.
  ctx.fillStyle = '#716f60a8';
  ctx.beginPath();
  ctx.ellipse(4, r * .72, r * .86, r * .18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  shape.forEach(([px, py], point) => point ? ctx.lineTo(px * r, py * r) : ctx.moveTo(px * r, py * r));
  ctx.closePath();
  ctx.fillStyle = palette.base;
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * .065);
  ctx.strokeStyle = palette.shade;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r * .48, r * .14);
  ctx.lineTo(-r * .28, -r * .24);
  ctx.lineTo(-r * .04, -r * .39);
  ctx.lineTo(r * .1, -r * .07);
  ctx.lineTo(r * .36, r * .08);
  ctx.lineTo(r * .5, r * .39);
  ctx.lineWidth = Math.max(2, r * .09);
  ctx.strokeStyle = palette.lit;
  ctx.stroke();
  ctx.fillStyle = '#d8d3bf';
  ctx.beginPath();
  if (index === 0) {
    ctx.ellipse(-r * .05, -r * .02, r * .11, r * .2, -.18, 0, Math.PI * 2);
  } else if (index === 1) {
    ctx.ellipse(r * .23, r * .06, r * .1, r * .13, .2, 0, Math.PI * 2);
  } else {
    ctx.ellipse(-r * .08, r * .08, r * .1, r * .15, -.12, 0, Math.PI * 2);
  }
  ctx.fill();
  if (state.selected === index && practice && !practice.hidden) {
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.16, r * 1.16, 0, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#e5c886';
    ctx.stroke();
  }
  ctx.restore();
}

function drawPaper(): void {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#d9d1bc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#d3cab4';
  for (let y = 15; y < canvas.height; y += 32) {
    ctx.fillRect(0, y, canvas.width, 1);
  }
  ctx.strokeStyle = '#a39a81';
  ctx.lineWidth = 2;
  ctx.strokeRect(26, 25, canvas.width - 52, canvas.height - 50);
  ctx.strokeStyle = '#b4aa90';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(56, 90);
  ctx.bezierCurveTo(170, 52, 232, 92, 326, 62);
  ctx.moveTo(641, 84);
  ctx.bezierCurveTo(733, 112, 816, 48, 901, 82);
  ctx.stroke();
  // Draw back-to-front by foot position, preserving depth if the paper stones overlap slightly.
  ([0, 1, 2] as StoneIndex[]).sort((a, b) => state.stones[a].y - state.stones[b].y)
    .forEach(drawStone);
}

function refresh(): void {
  stoneButtons.forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.stone) === state.selected)));
  const spacing = readStoneSpacing(state);
  liveRead.textContent = `当前观察：${spacing.text}`;
  drawPaper();
}

function persist(): void {
  const draft = loadCompositionDraft(chapter);
  draft.stone = {
    state: structuredClone(state),
    exampleViewed,
    passed: exampleViewed && reviewed && assessStoneComposition(state).passed,
  };
  saveNote.textContent = saveCompositionDraft(chapter, draft)
    ? '石稿已保存在本机浏览器；不改动地图草稿、主线旗标或六艺。'
    : '此浏览器未允许保存；本页仍可试玩，离开后可能从头开始。';
}

function change(next: StoneStudyState, message: string): void {
  if (JSON.stringify(next.stones) === JSON.stringify(state.stones) && next.selected === state.selected) return;
  history.push(structuredClone(state));
  state = next;
  reviewed = false;
  analysis.hidden = true;
  nextAfterReview.hidden = true;
  feedback.textContent = message;
  refresh();
  persist();
}

function selectStone(index: StoneIndex): void {
  change(selectStudyStone(state, index), `已选中石样${index + 1}。拖动它，或用方向键挪动。`);
  canvas.focus({ preventScroll: true });
}

function pointerPosition(event: PointerEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / rect.width * STONE_BOARD.width,
    y: (event.clientY - rect.top) / rect.height * STONE_BOARD.height,
  };
}

function hitStone(point: { x: number; y: number }): StoneIndex | null {
  const ordered = ([0, 1, 2] as StoneIndex[]).sort((a, b) => state.stones[b].y - state.stones[a].y);
  for (const index of ordered) {
    const stone = state.stones[index];
    if (Math.hypot(point.x - stone.x, point.y - stone.y) <= STONE_RADII[index] * 1.2) return index;
  }
  return null;
}

canvas.addEventListener('pointerdown', (event) => {
  const hit = hitStone(pointerPosition(event));
  if (hit === null) return;
  if (hit !== state.selected) state = selectStudyStone(state, hit);
  dragging = hit;
  dragOrigin = structuredClone(state);
  canvas.setPointerCapture(event.pointerId);
  refresh();
  feedback.textContent = `正在移动石样${hit + 1}。放下后看一看三石之间的空隙。`;
});
canvas.addEventListener('pointermove', (event) => {
  if (dragging === null || !canvas.hasPointerCapture(event.pointerId)) return;
  const index = dragging;
  const next = placeStudyStone(state, index, pointerPosition(event));
  if (JSON.stringify(next.stones) === JSON.stringify(state.stones)) return;
  state = next;
  reviewed = false;
  analysis.hidden = true;
  nextAfterReview.hidden = true;
  refresh();
});
function finishDrag(): void {
  if (dragging === null) return;
  if (dragOrigin && JSON.stringify(dragOrigin.stones) !== JSON.stringify(state.stones)) history.push(dragOrigin);
  dragging = null;
  dragOrigin = null;
  feedback.textContent = '石样放稳了。看看彼此相近的两块，与较疏开的那一处。';
  persist();
}
canvas.addEventListener('pointerup', finishDrag);
canvas.addEventListener('pointercancel', finishDrag);

stoneButtons.forEach((button) => button.addEventListener('click', () => selectStone(Number(button.dataset.stone) as StoneIndex)));
nudgeButtons.forEach((button) => button.addEventListener('click', () => {
  const deltas: Record<string, [number, number]> = { left: [-12, 0], right: [12, 0], up: [0, -12], down: [0, 12] };
  const [dx, dy] = deltas[button.dataset.nudge ?? ''] ?? [0, 0];
  change(nudgeStudyStone(state, dx, dy), '轻轻挪了一步。纸上石形仍在，可以接着调整。');
}));

document.getElementById('startPractice')!.addEventListener('click', () => {
  exampleViewed = true;
  practice.hidden = false;
  refresh();
  feedback.textContent = '现在开始摆稿。先不要追求像哪一幅，只看三块的关系怎样变化。';
  persist();
  practice.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.getElementById('review')!.addEventListener('click', () => {
  const result = assessStoneComposition(state);
  reviewed = result.passed;
  feedback.textContent = result.line;
  analysisText.textContent = result.passed
    ? '本次委托完成：三石可分辨，并出现了疏密变化。改变其中任何一块的位置，都可以再试新的组织方式。'
    : `还未合这张小稿的明示条件：${readStoneSpacing(state).text}`;
  analysis.hidden = false;
  nextAfterReview.hidden = !result.passed;
  refresh();
  persist();
});

document.getElementById('undo')!.addEventListener('click', () => {
  const previous = history.pop();
  if (!previous) { feedback.textContent = '还没有可退回的一步。'; return; }
  state = previous;
  reviewed = false;
  analysis.hidden = true;
  nextAfterReview.hidden = true;
  refresh();
  feedback.textContent = '退回上一步。另一种疏密也可以试试看。';
  persist();
});

document.getElementById('reset')!.addEventListener('click', () => {
  history.push(structuredClone(state));
  state = structuredClone(INITIAL_STONE_STUDY);
  reviewed = false;
  analysis.hidden = true;
  nextAfterReview.hidden = true;
  refresh();
  feedback.textContent = '石样回到初始位置。先试着让一对更相近，再放开另一处。';
  persist();
});

window.addEventListener('keydown', (event) => {
  if (!exampleViewed || practice.hidden || event.altKey || event.ctrlKey || event.metaKey) return;
  const key = event.key.toLowerCase();
  if (key === '1' || key === '2' || key === '3') {
    selectStone((Number(key) - 1) as StoneIndex);
    event.preventDefault();
    return;
  }
  if (document.activeElement !== canvas) return;
  const deltas: Record<string, [number, number]> = {
    arrowleft: [-6, 0], arrowright: [6, 0], arrowup: [0, -6], arrowdown: [0, 6],
  };
  const delta = deltas[key];
  if (!delta) return;
  change(nudgeStudyStone(state, delta[0], delta[1]), '细细调整了一点位置。');
  event.preventDefault();
});

const savedPass = restored?.passed === true && assessStoneComposition(state).passed;
if (exampleViewed) {
  practice.hidden = false;
  if (savedPass) {
    nextAfterReview.hidden = false;
    analysis.hidden = false;
    analysisText.textContent = '上次交成的石稿已留在案上；也可以重新挪动石样，再试一张。';
    feedback.textContent = '这张稿子仍符合石匠的委托。';
  } else if (restored) {
    feedback.textContent = '已接上次摆稿。石样可以继续调整。';
  }
}
refresh();
