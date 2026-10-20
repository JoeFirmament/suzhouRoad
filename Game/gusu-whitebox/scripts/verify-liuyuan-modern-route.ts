import { canEnterModernReturn, canEnterModernRoute, modernRouteHref } from '../src/core/liuyuan-modern-route.js';
import { advanceAlleyReturnCheckpoint, canCompleteLiuyuanReturn, LIUYUAN_ALLEY_RETURN_CHECKPOINTS } from '../src/core/liuyuan-entry-flow.js';
import { advanceLiuyuanChapter, LIUYUAN_CHAPTER_FLAGS } from '../src/core/liuyuan-progression.js';
import { stoneForestPrevious, stoneForestReturnHref, windowStudyHref } from '../src/core/liuyuan-research-link.js';
import type { ProgressData } from '../src/core/progression.js';

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

const progress: ProgressData = {
  version: 1,
  arts: { li: 0, yue: 0, she: 0, yu: 0, shu: 0, shuMath: 0 },
  gardens: { canglang: 'open', wangshi: 'locked', zhuozheng: 'locked', shizilin: 'locked',
    liuyuan: 'locked', ouyuan: 'locked', yipu: 'locked', huanxiu: 'locked', tuisi: 'locked' },
  completedTasks: [], knowledge: [], storyFlags: [], updatedAt: 0,
};
const hall = modernRouteHref('liuyuan-east-hall.html', 'flower', true);
assert(hall.includes('route=modern') && hall.includes('from=flower') && hall.includes('draft=1'),
  '当代参考游线须携带来源与草稿预览标记');
assert(!canEnterModernRoute(hall.slice(hall.indexOf('?')), progress, 'flower', 'ly-porridge-delivered'),
  '单靠查询参数不得跳过实际送粥');
progress.storyFlags.push('ly-porridge-delivered');
assert(canEnterModernRoute(hall.slice(hall.indexOf('?')), progress, 'flower', 'ly-porridge-delivered'),
  '完成送粥后可进入标记为当代参考的东部合成院');
assert(!canEnterModernRoute('?route=modern&from=stone-forest', progress, 'flower', 'ly-porridge-delivered'),
  '来源错误不能冒充花房转场');
assert(!canEnterModernRoute('?route=historic&from=flower', progress, 'flower', 'ly-porridge-delivered'),
  '当代参考不得误标历史游线');
const stone = stoneForestPrevious('?route=modern&from=east-hall&draft=1');
assert(stone.fromModernRoute && stone.href.includes('from=flower') && stone.href.includes('draft=1'),
  '石林必须回到堂前游戏合成院，并保留草稿预览');
const window = windowStudyHref({x:525,y:390}, true, false, true);
const back = stoneForestReturnHref(window.slice(window.indexOf('?')));
assert(back?.includes('parent=modern-route') && stoneForestPrevious(back.slice(back.indexOf('?'))).fromModernRoute,
  '可选三窗研究往返后仍保留当代游线来源');
for (const flag of LIUYUAN_CHAPTER_FLAGS.slice(0, 7)) progress.storyFlags.push(flag);
const prematureStudy = advanceLiuyuanChapter(progress, 'ly-study-found');
assert(prematureStudy.applied && !prematureStudy.progress.storyFlags.includes('ly-magnolia-seen'),
  '送粥后可自主发现书斋，不能补造看树事件');
const undelivered = { ...progress, storyFlags: progress.storyFlags.filter(flag => flag !== 'ly-porridge-delivered') };
assert(advanceLiuyuanChapter(undelivered, 'ly-study-found').reason === 'missing-previous',
  '寻人仍需先完成实际送粥');
const observed = advanceLiuyuanChapter(progress, 'ly-magnolia-seen');
assert(observed.applied && !observed.progress.storyFlags.includes('ly-study-found'),
  '双树观察只推进线索，不自动发现书斋');
const knocked = advanceLiuyuanChapter(observed.progress, 'ly-study-found');
assert(knocked.applied && knocked.progress.arts.shu === 0,
  '叩门发现书斋不提前发书艺奖励');
const met = advanceLiuyuanChapter(knocked.progress, 'ly-scholar-met');
const trouble = advanceLiuyuanChapter(met.progress, 'ly-scholar-trouble-known');
assert(met.applied && trouble.applied && trouble.progress.arts.shu === 0,
  '抄书人对话可推进事件，但题叶未完成前不发书艺');
const picked = advanceLiuyuanChapter(trouble.progress, 'ly-leaf-picked');
const written = advanceLiuyuanChapter(picked.progress, 'ly-leaf-written');
assert(picked.applied && written.applied && written.progress.arts.shu === 1,
  '必须先取叶、再题写，且只在题写后发一次书艺');
assert(!advanceLiuyuanChapter(written.progress, 'ly-leaf-written').applied
  && advanceLiuyuanChapter(written.progress, 'ly-leaf-written').progress.arts.shu === 1,
  '重试题写不能刷书艺');
const returnSteps = [
  ['leaf','liuyuan-study-court.html'], ['study-court','liuyuan-stone-forest.html'],
  ['stone-forest','liuyuan-east-hall.html'], ['east-hall','liuyuan-flower.html'],
] as const;
for (const [from,page] of returnSteps) {
  const href = modernRouteHref(page, from, true, true);
  assert(canEnterModernReturn(href.slice(href.indexOf('?')), written.progress, from, 'ly-leaf-written'),
    `返程 ${from} 须具备正确来源、已题叶旗标与草稿预览`);
  assert(!canEnterModernReturn(`?route=modern&from=${from}`, written.progress, from, 'ly-leaf-written'),
    `正向模式不得误认成返程 ${from}`);
}
const carried = advanceLiuyuanChapter(written.progress, 'ly-leaf-carried');
assert(carried.applied && carried.progress.arts.shu === 1, '空桶收叶后不再发书艺');
for (const [from,page] of [
  ['flower','liuyuan-lvyin.html'], ['lvyin','liuyuan-court.html'], ['court','liuyuan-entry.html'],
] as const) {
  const href = modernRouteHref(page, from, false, true);
  assert(canEnterModernReturn(href.slice(href.indexOf('?')), carried.progress, from, 'ly-leaf-carried'),
    `返程 ${from} 须在空桶收叶之后`);
}
let index = 0;
for (const point of LIUYUAN_ALLEY_RETURN_CHECKPOINTS) index = advanceAlleyReturnCheckpoint(index, point.x, point.y);
assert(!canCompleteLiuyuanReturn(index, false), '仅走出门外、未应答门房不得结算');
assert(canCompleteLiuyuanReturn(index, true), '完整逆行与门房应答后才可结算');
const unlocked = advanceLiuyuanChapter(carried.progress, 'ly-unlocked');
assert(unlocked.applied && unlocked.progress.gardens.liuyuan === 'complete'
  && unlocked.progress.arts.shu === 1, '出园只完成园态，不重复发书艺');
console.log('留园当代游线入口：来源、前置章节事件与草稿参数通过。');
