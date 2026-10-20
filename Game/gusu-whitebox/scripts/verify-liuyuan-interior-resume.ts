import { INITIAL_INTERIOR_BEAT, advanceInteriorBeat } from '../src/core/liuyuan-study-interior-beat.js';
import { interiorResumeKey, parseInteriorResume, writeInteriorResume, readInteriorResume } from '../src/core/liuyuan-interior-resume.js';
import { loadProgress } from '../src/core/progression.js';
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const data = new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{value:{getItem:()=>null},configurable:true});
Object.defineProperty(globalThis,'sessionStorage',{value:{getItem:(key:string)=>data.get(key)??null,
  setItem:(key:string,value:string)=>data.set(key,value)},configurable:true});
const progress=loadProgress();
const key=interiorResumeKey(false,false);
let beat=advanceInteriorBeat(INITIAL_INTERIOR_BEAT,'greet').beat;
progress.storyFlags.push('ly-scholar-met');
for(const action of ['search','desk','return'] as const) {
  beat=advanceInteriorBeat(beat,action).beat;
  writeInteriorResume(key,progress,beat);
  assert(JSON.stringify(readInteriorResume(key,progress))===JSON.stringify(beat),`${action} 续接必须保留真实阶段`);
}
beat=advanceInteriorBeat(beat,'paper-ask').beat; progress.storyFlags.push('ly-scholar-trouble-known');
for(const action of ['return','window','return'] as const) {
  beat=advanceInteriorBeat(beat,action).beat; writeInteriorResume(key,progress,beat);
  assert(readInteriorResume(key,progress)?.phase===beat.phase,`${action} 不得在恢复时跳步`);
}
const raw=data.get(key)!; const record=JSON.parse(raw);
for(const state of [{...beat,windowSeen:false},{...beat,deskSeen:false},{...beat,phase:'bad'},
  {...beat,answer:'bad'},{...beat,phase:'explore',answer:'search'}])
  assert(!parseInteriorResume(JSON.stringify({...record,state}),progress),'非法/前置矛盾状态必须拒绝');
assert(!parseInteriorResume('{broken',progress),'坏 JSON 安全回退');
assert(!parseInteriorResume(raw,{...progress,updatedAt:progress.updatedAt+1}),'换档后不得使用旧续接');
assert(!readInteriorResume(interiorResumeKey(true,false),progress)
  && !readInteriorResume(interiorResumeKey(false,true),progress),'试玩/草稿会话必须隔离');
console.log('书斋续接：应答、案头、托付、纸张处境、窗边、收束分阶段恢复及坏记录/换档/模式隔离通过。');
