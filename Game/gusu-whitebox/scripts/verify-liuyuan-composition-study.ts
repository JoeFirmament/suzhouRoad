import {
  INITIAL_STONE_STUDY, assessStoneComposition, nudgeStudyStone, placeStudyStone,
  readStoneSpacing,
} from '../src/core/liuyuan-composition-study.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const even = structuredClone(INITIAL_STONE_STUDY);
assert(assessStoneComposition(even).code === 'same-spacing', '初始三石有序但间距齐整，反馈应指导变化');

const varied = placeStudyStone(even, 1, { x: 390, y: 268 });
assert(assessStoneComposition(varied).passed, '一对相近、另一处舒展的三石稿可通过');
assert(readStoneSpacing(varied).nearestGaps[2] - readStoneSpacing(varied).nearestGaps[0] >= 38,
  '通过稿的最近邻间距应有可见变化');

const merged = placeStudyStone(even, 1, { x: 285, y: 268 });
assert(assessStoneComposition(merged).code === 'merged', '两块轮廓压得太深时应指出并合问题');

const isolated = placeStudyStone({ stones: [
  { x: 140, y: 240 }, { x: 460, y: 240 }, { x: 810, y: 240 },
], selected: 0 }, 0, { x: 140, y: 240 });
assert(assessStoneComposition(isolated).code === 'too-isolated', '三石各自成孤时应提示收近一组');

const clamped = placeStudyStone(even, 0, { x: -400, y: 999 });
assert(clamped.stones[0].x > 0 && clamped.stones[0].y < 480, '拖动石样不得越出版心边界');
assert(even.stones[1].x === INITIAL_STONE_STUDY.stones[1].x, '状态更新不得污染初始稿');
assert(nudgeStudyStone(varied, 12, -6).stones[1].x === varied.stones[1].x + 12,
  '方向键微调只移动选中的石样');

console.log('留园三石小稿：并合/齐整/过散反馈、可行组合、边界与状态不可变检查完成。');
