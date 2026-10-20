import { commitLiuyuanChapterFlag } from '../src/core/liuyuan-progression.js';
import { loadProgress } from '../src/core/progression.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// A readable but unwritable storage must not repeatedly restore an older save.
const stale = JSON.stringify(loadProgress());
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: { getItem: () => stale, setItem: () => { throw new Error('read-only storage'); } },
});
assert(commitLiuyuanChapterFlag('ly-errand-offered').applied, '只读存储时仍须接到差事');
assert(commitLiuyuanChapterFlag('ly-huabu-seen').applied, '后续对白不得因存档不可用而卡住');
const copy = loadProgress();
copy.storyFlags.push('ly-gate-clue');
assert(!loadProgress().storyFlags.includes('ly-gate-clue'), '读取应返回独立副本');
assert(commitLiuyuanChapterFlag('ly-gate-clue').applied, '门房线索应可继续推进');
assert(commitLiuyuanChapterFlag('ly-gate-passed').applied, '门房应能放行');
assert(loadProgress().storyFlags.includes('ly-gate-passed'), '无本地存储时本页仍应记住放行');
delete (globalThis as typeof globalThis & { localStorage?: Storage }).localStorage;
assert(commitLiuyuanChapterFlag('ly-alley-walked').applied, '只读存储不应阻断下一幕');
assert(loadProgress().storyFlags.includes('ly-alley-walked'), '读取旧存档不应覆盖未能持久化的新状态');
console.log('进度存储回退：Web Storage 不可用或只读时，同页章流可按序推进。');
