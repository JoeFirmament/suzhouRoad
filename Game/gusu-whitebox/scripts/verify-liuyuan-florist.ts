import { advanceFloristBeat } from '../src/core/liuyuan-florist-beat.js';
import { advanceLiuyuanChapter, commitLiuyuanChapterFlag, LIUYUAN_CHAPTER_FLAGS,
  rememberLiuyuanFloristClue } from '../src/core/liuyuan-progression.js';
import { loadProgress, saveProgress } from '../src/core/progression.js';
import { carryingLiuyuanPorridge } from '../src/render/liuyuan-bucket.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const saved = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key: string) => saved.get(key) ?? null,
  setItem: (key: string, value: string) => { saved.set(key, value); },
} });

let progress = loadProgress();
assert(!carryingLiuyuanPorridge(progress), '接差前不能出现随身粥桶');
for (const flag of LIUYUAN_CHAPTER_FLAGS) {
  if (flag === 'ly-florist-met') break;
  progress = advanceLiuyuanChapter(progress, flag).progress;
  if (flag === 'ly-errand-offered') assert(carryingLiuyuanPorridge(progress), '接差后应提桶');
  if (flag === 'ly-alley-walked') assert(carryingLiuyuanPorridge(progress), '走完夹弄仍应提桶');
  if (flag === 'ly-porridge-delivered') assert(!carryingLiuyuanPorridge(progress), '交粥后手中不应有桶');
}
saveProgress(progress);
assert(!advanceFloristBeat('unmet', 'approach', false).heardClue, '未交粥不得获得线索');
const offer = advanceFloristBeat('unmet', 'approach', true);
assert(offer.state === 'choice' && offer.showChoices, '交粥后应开放两种互动');
for (const choice of ['ask', 'watch'] as const) {
  assert(advanceFloristBeat(offer.state, choice, true).heardClue, `${choice} 应听见笔树`);
}
assert(commitLiuyuanChapterFlag('ly-florist-met').applied, '听见土话后应结算花匠一幕');
assert(loadProgress().knowledge.filter((item) => item === 'liuyuan-magnolia-slip').length === 1,
  '线索须且只须记录一次');
assert(!commitLiuyuanChapterFlag('ly-florist-met').applied, '重听不应重复推进章节');
assert(!rememberLiuyuanFloristClue(), '新存档不应重复写入线索');

const oldSave = loadProgress();
oldSave.knowledge = oldSave.knowledge.filter((item) => item !== 'liuyuan-magnolia-slip');
saveProgress(oldSave);
assert(rememberLiuyuanFloristClue(), '旧存档重听后应补回纸角线索');
assert(!rememberLiuyuanFloristClue(), '旧存档补线索只能执行一次');
console.log('留园送粥／花匠互动：提桶至交付、交粥前阻断、两种听法、线索幂等、旧存档补记通过。');
