import { awardLiuyuanRainShadow, advanceLiuyuanChapter, LIUYUAN_CHAPTER_FLAGS } from '../src/core/liuyuan-progression.js';
import { loadProgress, saveProgress } from '../src/core/progression.js';
const records = new Map<string, string>();
Object.defineProperty(globalThis, 'location', { value: { search: '' }, configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: (key: string) => records.get(key) ?? null,
  setItem: (key: string, value: string) => records.set(key, value),
}, configurable: true });
function assert(value: unknown, message: string) { if (!value) throw new Error(message); }
// Old successes without a reward record receive the point on their next real win.
const old = loadProgress(); old.storyFlags.push('ly-rain-shadow-cleared'); saveProgress(old);
assert(awardLiuyuanRainShadow(), '旧成功未领奖应可在下一次成功领取');
const first = JSON.stringify(loadProgress());
assert(loadProgress().arts.yu === 1 && loadProgress().completedTasks.includes('liuyuan-rain-shadow'), '御奖励应持久记录');
assert(!awardLiuyuanRainShadow() && JSON.stringify(loadProgress()) === first, '重复结算不得再写属性或时间');
Object.defineProperty(globalThis, 'location', { value: { search: '?playtest=1' }, configurable: true });
assert(loadProgress().arts.yu === 0 && awardLiuyuanRainShadow(), '隔离试玩独立结算');
Object.defineProperty(globalThis, 'location', { value: { search: '' }, configurable: true });
assert(JSON.stringify(loadProgress()) === first, '试玩不污染正式奖励');
console.log('护画奖励：御 +1、幂等、旧成功兼容、正式/试玩隔离通过。');
let freeRoute = { ...loadProgress(), storyFlags: [], completedTasks: [], knowledge: [], arts: { ...loadProgress().arts, yu: 0, shu: 0 } } as ReturnType<typeof loadProgress>;
assert(advanceLiuyuanChapter(freeRoute, 'ly-gate-passed').reason === 'missing-previous', '未接送粥任务不应提交入园事件');
for (const flag of LIUYUAN_CHAPTER_FLAGS) {
  if (flag === 'ly-huabu-seen' || flag === 'ly-gate-clue' || flag === 'ly-florist-met' || flag === 'ly-magnolia-seen') continue;
  const result = advanceLiuyuanChapter(freeRoute, flag);
  assert(result.applied, `跳过问话后仍可推进 ${flag}`); freeRoute = result.progress;
}
assert(freeRoute.gardens.liuyuan === 'complete' && !freeRoute.storyFlags.includes('ly-huabu-seen')
  && !freeRoute.storyFlags.includes('ly-gate-clue') && !freeRoute.storyFlags.includes('ly-florist-met') && !freeRoute.storyFlags.includes('ly-magnolia-seen')
  && !freeRoute.knowledge.includes('liuyuan-magnolia-slip'), '自主入园可结算全章，不伪造可选问话');
console.log('可选入口问话：跳过后整章状态推进通过。');
