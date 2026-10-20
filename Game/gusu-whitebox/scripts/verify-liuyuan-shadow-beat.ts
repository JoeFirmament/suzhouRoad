import {
  advanceShadowBeat, newShadowBeat, shadowPosition, SHADOW_TARGETS,
  SHADOW_TOTAL_BEATS, strikeShadowBeat,
} from '../src/core/liuyuan-shadow-beat.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

let state = newShadowBeat();
assert(!strikeShadowBeat(state).hit, '不应靠开始时乱按过第一拍');
state = strikeShadowBeat(state).state;
assert(state.beats === 0 && state.misses === 1, '失手应重置连拍，但保留可重试状态');
for (let beat = 0; beat < SHADOW_TOTAL_BEATS; beat++) {
  state = { ...state, phase: SHADOW_TARGETS[beat] };
  assert(Math.abs(shadowPosition(state) - SHADOW_TARGETS[beat]) < 1e-9, '目标与浮标坐标须一致');
  const result = strikeShadowBeat(state);
  assert(result.hit && result.state.beats === beat + 1, `第 ${beat + 1} 拍应命中`);
  state = result.state;
}
assert(state.complete, '三拍后应完成');
assert(advanceShadowBeat(state, 1) === state, '完成后浮标应停止');
assert(strikeShadowBeat(state).state === state, '完成后重复操作应幂等');
const normal = advanceShadowBeat(newShadowBeat(), 1);
const slow = advanceShadowBeat(newShadowBeat(), 1, true);
assert(shadowPosition(slow) < shadowPosition(normal), '慢速模式须确实放慢');
assert(strikeShadowBeat({ ...newShadowBeat(), phase: 0.40 }, true).hit,
  '慢速模式应有较宽判定');
assert(!strikeShadowBeat({ ...newShadowBeat(), phase: 0.40 }).hit,
  '标准模式不应误用慢速判定');
console.log('留园纸角对影：三拍、失手重试、慢速辅助、完成幂等均通过。');
