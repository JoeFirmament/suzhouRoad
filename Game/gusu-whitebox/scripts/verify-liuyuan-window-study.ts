import {
  inspectWindow, nearestWindow, newWindowStudy, noteWindow, WINDOW_STUDY_X,
} from '../src/core/liuyuan-window-study.js';
import { LIUYUAN_WINDOW_ROOM_FEET } from '../src/data/liuyuan-window-room-study.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(nearestWindow(WINDOW_STUDY_X.west) === 'west', '西侧窗脚点识别错误');
assert(nearestWindow(WINDOW_STUDY_X.middle) === 'middle', '中央窗脚点识别错误');
assert(nearestWindow(WINDOW_STUDY_X.east) === 'east', '东侧窗脚点识别错误');
for (const view of ['west', 'middle', 'east'] as const)
  assert(WINDOW_STUDY_X[view] === LIUYUAN_WINDOW_ROOM_FEET[view].x,
    `${view} 窗的辨认坐标与场景脚点漂移`);

let state = newWindowStudy();
assert(noteWindow(state, 'west').kind === 'need-comparison', '不能靠猜测跳过三处比较');
state = inspectWindow(state, 'middle').state;
state = inspectWindow(state, 'west').state;
assert(noteWindow(state, 'west').kind === 'need-comparison', '同形六角窗须比较两侧');
state = inspectWindow(state, 'east').state;
assert(state.inspected.size === 3, '应记录三处观察');
assert(noteWindow(state, 'east').kind === 'wrong', '东竹不应被误判为西蕉');
assert(noteWindow(state, 'middle').kind === 'wrong', '中央石窗不应被误判为侧窗');
const solved = noteWindow(state, 'west');
assert(solved.kind === 'solved' && solved.state.solved, '西蕉比较后应完成研究谜题');
assert(noteWindow(solved.state, 'west').kind === 'solved', '重复记窗须幂等');
assert(!state.solved, '原状态不可因新状态完成而被意外改写');
console.log('留园三窗研究谜题：三处观察、同形误选、正确辨影、重复操作均通过；不写 CH3 存档。');
