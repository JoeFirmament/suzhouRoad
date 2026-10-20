/** Liuyuan stone-spacing study inspired by Pan Tianshou figs. 61–63.
 * All coordinates belong to a removable paper study, never the garden scene.
 */
export type StonePoint = { x: number; y: number };
export type StoneIndex = 0 | 1 | 2;
export type StoneStudyState = {
  stones: [StonePoint, StonePoint, StonePoint];
  selected: StoneIndex;
};

export const STONE_BOARD = { width: 960, height: 480 } as const;
export const STONE_RADII = [64, 52, 40] as const;
const EDGE = 72;

export const INITIAL_STONE_STUDY: StoneStudyState = {
  stones: [
    { x: 220, y: 268 },
    { x: 430, y: 268 },
    { x: 640, y: 268 },
  ],
  selected: 0,
};

export type StoneGapRead = {
  nearestGaps: [number, number, number];
  closestPair: [StoneIndex, StoneIndex];
  mostOpenPair: [StoneIndex, StoneIndex];
  text: string;
};

export type StoneCompositionAssessment = {
  passed: boolean;
  code: 'merged' | 'same-spacing' | 'too-isolated' | 'varied';
  line: string;
};

export function selectStudyStone(state: StoneStudyState, selected: StoneIndex): StoneStudyState {
  return { ...state, selected };
}

export function placeStudyStone(state: StoneStudyState, index: StoneIndex, point: StonePoint): StoneStudyState {
  const radius = STONE_RADII[index];
  const stones = state.stones.map((stone, current) => current === index
    ? {
      x: Math.max(radius + EDGE, Math.min(STONE_BOARD.width - radius - EDGE, point.x)),
      y: Math.max(radius + EDGE, Math.min(STONE_BOARD.height - radius - EDGE, point.y)),
    }
    : { ...stone }) as StoneStudyState['stones'];
  return { stones, selected: index };
}

export function nudgeStudyStone(state: StoneStudyState, dx: number, dy: number): StoneStudyState {
  const selected = state.selected;
  const point = state.stones[selected];
  return placeStudyStone(state, selected, { x: point.x + dx, y: point.y + dy });
}

function pairGap(state: StoneStudyState, first: StoneIndex, second: StoneIndex): number {
  const a = state.stones[first];
  const b = state.stones[second];
  return Math.hypot(a.x - b.x, a.y - b.y) - STONE_RADII[first] - STONE_RADII[second];
}

/** Reads each stone's nearest neighbour so the third, non-adjacent distance
 * cannot trivially make an otherwise evenly spaced row look varied. */
export function readStoneSpacing(state: StoneStudyState): StoneGapRead {
  const pairs: { first: StoneIndex; second: StoneIndex; gap: number }[] = [
    { first: 0, second: 1, gap: pairGap(state, 0, 1) },
    { first: 0, second: 2, gap: pairGap(state, 0, 2) },
    { first: 1, second: 2, gap: pairGap(state, 1, 2) },
  ];
  const eachStoneNearest = ([0, 1, 2] as StoneIndex[]).map((stone) => {
    const connected = pairs.filter((pair) => pair.first === stone || pair.second === stone);
    return connected.sort((a, b) => a.gap - b.gap)[0];
  });
  const compacted = eachStoneNearest.map((pair) => pair.gap).sort((a, b) => a - b) as [number, number, number];
  const closestPair = eachStoneNearest.reduce((best, pair) => pair.gap < best.gap ? pair : best, eachStoneNearest[0]);
  const mostOpenPair = eachStoneNearest.reduce((best, pair) => pair.gap > best.gap ? pair : best, eachStoneNearest[0]);
  const low = compacted[0];
  const high = compacted[2];
  const text = low < -18
    ? '有两块石形压得太深，先让轮廓重新分开。'
    : high - low < 38
      ? '三石都看得见，不过邻近的空隙还太齐；试着让一对相依些，另一处舒展开。'
      : low > 108
        ? '三石各自站得太远，彼此尚未形成一组；让其中两块靠近些。'
        : '已有近处相应、远处稍开的变化。';
  return {
    nearestGaps: compacted,
    closestPair: [closestPair.first, closestPair.second],
    mostOpenPair: [mostOpenPair.first, mostOpenPair.second],
    text,
  };
}

/** One explicit paper-study brief, not a universal score for garden stones. */
export function assessStoneComposition(state: StoneStudyState): StoneCompositionAssessment {
  const { nearestGaps } = readStoneSpacing(state);
  const [tightest, , widest] = nearestGaps;
  if (tightest < -18) return {
    passed: false, code: 'merged',
    line: '石匠轻轻把纸转了半圈：“这两块挨得太深，轮廓快并成一团。留一道能辨石形的气口，再看一眼。”',
  };
  if (widest - tightest < 38) return {
    passed: false, code: 'same-spacing',
    line: '石匠用指节沿三处空隙点过：“石形各有不同，间距却像尺量。让一对相依，再把另一处放开些。”',
  };
  if (tightest > 108) return {
    passed: false, code: 'too-isolated',
    line: '石匠说：“三块都好看清，却各自成孤。收近一对，让它们先有照应。”',
  };
  return {
    passed: true, code: 'varied',
    line: '石匠看了片刻，点头道：“三块仍各有石形，一处相亲，一处舒展。图六一、六二各有不同取法；这张小稿也自有它的气口。”',
  };
}
