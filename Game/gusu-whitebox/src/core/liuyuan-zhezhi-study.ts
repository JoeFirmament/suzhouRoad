/** A direct-manipulation study of the “one wave, three turns” branch form.
 * The points are a game-made diagram, not a traced Song painting.
 */
export type BranchPoint = { x: number; y: number };
export type BranchStudyState = {
  stem: [BranchPoint, BranchPoint, BranchPoint, BranchPoint, BranchPoint];
  blooms: [BranchPoint, BranchPoint];
  selected: number;
};

export const BRANCH_BOARD = { width: 960, height: 480 } as const;
export const INITIAL_BRANCH_STUDY: BranchStudyState = {
  stem: [
    { x: 100, y: 300 }, { x: 225, y: 282 }, { x: 355, y: 295 },
    { x: 490, y: 270 }, { x: 640, y: 286 },
  ],
  blooms: [{ x: 240, y: 235 }, { x: 515, y: 225 }],
  selected: 0,
};

export type BranchRead = { turns: number; turnsAt: [boolean, boolean, boolean]; bloomGap: number; bloomsNearStem: [boolean, boolean] };
export type BranchAssessment = {
  /** `passed` records that the player completed an observation round,
   * not that a hidden aesthetic score has been reached. */
  passed: boolean;
  code: 'straight' | 'compressed' | 'scattered' | 'observed';
  line: string;
  notes: [string, string, string];
};

function distance(a: BranchPoint, b: BranchPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointToSegment(point: BranchPoint, a: BranchPoint, b: BranchPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return distance(point, a);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
  return distance(point, { x: a.x + t * dx, y: a.y + t * dy });
}

function branchTurnAngle(previous: BranchPoint, pivot: BranchPoint, next: BranchPoint): number {
  const a = { x: previous.x - pivot.x, y: previous.y - pivot.y };
  const b = { x: next.x - pivot.x, y: next.y - pivot.y };
  const denominator = Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y);
  if (!denominator) return 0;
  const insideAngle = Math.acos(Math.max(-1, Math.min(1, (a.x * b.x + a.y * b.y) / denominator))) * 180 / Math.PI;
  return Math.abs(180 - insideAngle);
}

export function readBranchStudy(state: BranchStudyState): BranchRead {
  const angles = [1, 2, 3].map((index) => branchTurnAngle(state.stem[index - 1], state.stem[index], state.stem[index + 1]));
  const turnsAt = angles.map((angle) => angle >= 24) as [boolean, boolean, boolean];
  const turns = turnsAt.filter(Boolean).length;
  const bloomsNearStem = state.blooms.map((bloom) =>
    Math.min(...state.stem.slice(0, -1).map((point, index) => pointToSegment(bloom, point, state.stem[index + 1]))) <= 105,
  ) as [boolean, boolean];
  return { turns, turnsAt, bloomGap: distance(state.blooms[0], state.blooms[1]), bloomsNearStem };
}

export function assessBranchStudy(state: BranchStudyState): BranchAssessment {
  const reading = readBranchStudy(state);
  const pathLength = state.stem.slice(0, -1).reduce((sum, point, index) => sum + distance(point, state.stem[index + 1]), 0);
  const chord = Math.max(1, distance(state.stem[0], state.stem[state.stem.length - 1]));
  const sinuosity = pathLength / chord;
  const notes: [string, string, string] = [
    reading.turns === 0 || sinuosity < 1.06
      ? '枝势：首尾相望，整体较直；若想有“回身”，可以再试着转动一处。'
      : reading.turns === 3 && sinuosity > 1.55
        ? '枝势：转身很多，气息略急；收缓其中一折，也许更连贯。'
        : '枝势：已有起伏，首尾仍相承；可以比较转折的轻重。',
    reading.bloomGap < 54
      ? '花意：两簇相聚，主次暂不分明；可拉开一点，也可保留为浓处。'
      : reading.bloomGap > 260
        ? '花意：两簇相望较远；中段的空处因此更开阔。'
        : reading.bloomsNearStem.some((near) => !near)
          ? '花意：有一簇离枝稍远，像另起一景；你可以让它靠枝，也可以有意留开。'
          : '花意：两簇彼此有别，也都与枝势相应。',
    Math.abs((state.blooms[0].x + state.blooms[1].x) / 2 - 480) < 85
      ? '余白：花与枝大致落在画心附近，两侧空处较为相持。'
      : (state.blooms[0].x + state.blooms[1].x) / 2 < 395
        ? '余白：画材偏左，右侧留空较阔；可看看这份偏置是否合意。'
        : '余白：画材偏右，左侧留空较阔；可看看这份偏置是否合意。',
  ];
  const code: BranchAssessment['code'] = reading.turns === 0 || sinuosity < 1.06
    ? 'straight'
    : reading.bloomGap < 54 ? 'compressed'
      : reading.bloomGap > 260 ? 'scattered' : 'observed';
  return {
    passed: true, code,
    line: notes.join(' '),
    notes,
  };
}

export function moveBranchHandle(state: BranchStudyState, selected: number, point: BranchPoint): BranchStudyState {
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
  const stem = state.stem.map((item) => ({ ...item })) as BranchStudyState['stem'];
  const blooms = state.blooms.map((item) => ({ ...item })) as BranchStudyState['blooms'];
  if (selected >= 0 && selected < stem.length) {
    stem[selected] = { x: clamp(point.x, 58, 850), y: clamp(point.y, 58, 420) };
  } else if (selected === 5 || selected === 6) {
    blooms[selected - 5] = { x: clamp(point.x, 58, 900), y: clamp(point.y, 58, 420) };
  }
  return { stem, blooms, selected };
}

export function nudgeBranchHandle(state: BranchStudyState, dx: number, dy: number): BranchStudyState {
  const point = state.selected < 5 ? state.stem[state.selected] : state.blooms[state.selected - 5];
  return moveBranchHandle(state, state.selected, { x: point.x + dx, y: point.y + dy });
}
