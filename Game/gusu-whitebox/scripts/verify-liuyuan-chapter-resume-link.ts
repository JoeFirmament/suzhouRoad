import { strict as assert } from 'node:assert';
import { loadProgress } from '../src/core/progression.js';
import { advanceLiuyuanChapter, LIUYUAN_CHAPTER_FLAGS } from '../src/core/liuyuan-progression.js';
import { liuyuanChapterResumeLink } from '../src/core/liuyuan-chapter-resume-link.js';
let progress=loadProgress();
assert.equal(liuyuanChapterResumeLink(progress,''),null,'空档不应跳过接差');
const expected=new Map([
  ['ly-alley-walked','liuyuan-flower.html'],['ly-porridge-delivered','liuyuan-east-hall.html'],
  ['ly-study-found','liuyuan-study-interior.html'],['ly-leaf-picked','liuyuan-leaf-writing-study.html'],
  ['ly-leaf-written','liuyuan-study-court.html'],['ly-leaf-carried','liuyuan-entry.html'],
]);
for(const flag of LIUYUAN_CHAPTER_FLAGS){
  const next=advanceLiuyuanChapter(progress,flag);assert(next.applied);progress=next.progress;
  if(!expected.has(flag))continue;
  const before=JSON.stringify(progress);
  const link=liuyuanChapterResumeLink(progress,'?draft=1&playtest=1');assert(link);
  assert(link.href.startsWith(expected.get(flag)!));
  assert(link.href.includes('draft=1')&&link.href.includes('playtest=1'));
  assert.equal(JSON.stringify(progress),before,'续玩不能补造旗标或奖励');
  assert.equal(liuyuanChapterResumeLink(progress,'?returnStudy=1'),null,'研究逆行不抢正式书签');
  assert.equal(liuyuanChapterResumeLink(progress,'?return=1'),null,'返程本页不跳回另一阶段');
}
assert.equal(liuyuanChapterResumeLink(progress,''),null,'完成档交给回看面板，不再提示继续任务');
console.log('留园首页续玩：六个已提交阶段、空档/完成档/研究/返程边界、参数与只读通过。');
