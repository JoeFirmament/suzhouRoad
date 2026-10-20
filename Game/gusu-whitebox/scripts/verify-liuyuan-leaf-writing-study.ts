import { strict as assert } from 'node:assert';
import { advanceLeafStudy, INITIAL_LEAF_STUDY } from '../src/core/liuyuan-leaf-writing-study.js';
import { LEAF_TRACE_PATHS, beginLeafTrace, moveLeafTrace, stepLeafTrace, traceFinished } from '../src/core/liuyuan-leaf-trace.js';
import { parseLeafResume, leafProgressStamp, leafResumeKey } from '../src/core/liuyuan-leaf-resume.js';
import type { ProgressData } from '../src/core/progression.js';

let state = INITIAL_LEAF_STUDY;
state = advanceLeafStudy(state, 'old').state;
assert.equal(state.phase, 'choose');
assert.equal(state.oldLeafSeen, true);
state = advanceLeafStudy(state, 'new').state;
assert.equal(state.phase, 'trial');
assert.equal(advanceLeafStudy(state, 'take-board').state.phase, 'trial');
state = advanceLeafStudy(state, 'test-ink').state;
assert.equal(state.inkSeen, true);
assert.equal(advanceLeafStudy(state, 'hard-write').state.phase, 'support');
state = advanceLeafStudy(state, 'take-board').state;
for (let i = 0; i < 3; i++) state = advanceLeafStudy(state, 'stroke').state;
assert.equal(state.phase, 'done');
assert.equal(state.strokes, 3);
assert.equal(advanceLeafStudy(state, 'stroke').state.strokes, 3);
state = advanceLeafStudy(state, 'retry').state;
assert.deepEqual(state, INITIAL_LEAF_STUDY);
console.log('Liuyuan leaf-writing research beat: OK');
for (const path of LEAF_TRACE_PATHS) {
  assert.equal(beginLeafTrace(path,path[path.length-1]),null,'不能从末端落笔');
  let trace=beginLeafTrace(path)!;
  assert.equal(traceFinished(trace,path),false,'仅落笔不完成');
  assert.equal(stepLeafTrace(trace,path,'left').failed,true,'方向错了只结束本段尝试');
  assert.equal(moveLeafTrace(trace,path,{x:path[0].x,y:path[0].y+70}).failed,true,'偏出笔路应失败');
  const skipped=moveLeafTrace(trace,path,path[path.length-1]);
  assert.equal(traceFinished(skipped,path),false,'跳过转折不能完成');
  for (let segment=1;segment<path.length;segment++) {
    const from=path[segment-1],to=path[segment];
    for (let sample=1;sample<=12;sample++) trace=moveLeafTrace(trace,path,
      {x:from.x+(to.x-from.x)*sample/12,y:from.y+(to.y-from.y)*sample/12});
  }
  assert.equal(traceFinished(trace,path),true,'连续沿笔路临写可完成');
}
console.log('Leaf trace: starts, turns, off-path, skipped-corner and continuous input: OK');
const progress={updatedAt:10,storyFlags:['ly-scholar-trouble-known','ly-leaf-picked'],
  completedTasks:[]} as unknown as ProgressData;
const checkpoint={version:1,progressStamp:leafProgressStamp(progress),
  state:{phase:'write',strokes:1,oldLeafSeen:true,inkSeen:true}};
const raw=JSON.stringify(checkpoint);
assert.equal(parseLeafResume(raw,progress)?.strokes,1);
assert.equal(parseLeafResume(raw,{...progress,updatedAt:11}),null,'读档变化拒绝旧续写');
assert.equal(parseLeafResume(raw,{...progress,storyFlags:[...progress.storyFlags,'ly-leaf-written']}),null);
assert.equal(parseLeafResume('{',progress),null);
for (const state of [
  {...checkpoint.state,strokes:3}, {...checkpoint.state,phase:'done'},
  {...checkpoint.state,inkSeen:false}, {...checkpoint.state,phase:'trial'},
  {...checkpoint.state,strokes:1.5}, {...checkpoint.state,oldLeafSeen:'yes'},
]) assert.equal(parseLeafResume(JSON.stringify({...checkpoint,state}),progress),null);
assert.notEqual(leafResumeKey(true),leafResumeKey(false),'试玩与正式续写不能共槽');
console.log('Leaf reload: completed segments, stale/corrupt records and mode isolation: OK');
