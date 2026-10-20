import { assessStoneComposition, type StoneStudyState } from '../src/core/liuyuan-composition-study.js';
import { assessBranchStudy, type BranchStudyState } from '../src/core/liuyuan-zhezhi-study.js';
import {
  canReturnFromCompletedAlbum, loadCompositionDraft, parseCompositionDraft, saveCompositionDraft,
  type CompositionDraft,
} from '../src/core/liuyuan-composition-save.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const stoneState: StoneStudyState = {
  stones: [{ x: 220, y: 268 }, { x: 390, y: 268 }, { x: 640, y: 268 }], selected: 1,
};
const branchState: BranchStudyState = {
  stem: [
    { x: 100, y: 350 }, { x: 230, y: 220 }, { x: 360, y: 340 },
    { x: 500, y: 180 }, { x: 640, y: 330 },
  ],
  blooms: [{ x: 280, y: 250 }, { x: 560, y: 250 }], selected: 0,
};
assert(assessStoneComposition(stoneState).passed, '样例石稿应符合本局委托');
assert(assessBranchStudy(branchState).passed, '样例枝稿应符合本局委托');

const complete: CompositionDraft = {
  version: 2,
  stone: { state: stoneState, passed: true, exampleViewed: true },
  branch: { state: branchState, passed: true },
};
const parsed = parseCompositionDraft(JSON.stringify(complete));
assert(parsed.stone?.passed && parsed.branch?.passed, '两张有效构图稿都应能恢复');
assert(canReturnFromCompletedAlbum(true, true, true, parsed), '章节花匠已见且石稿完成后可交稿返院');
assert(canReturnFromCompletedAlbum(true, false, false, parsed), '独立研究完成石稿后可返回花匠身旁');
assert(!canReturnFromCompletedAlbum(false, true, true, parsed), '普通返院不得伪装成已交稿');
assert(!canReturnFromCompletedAlbum(true, true, false, parsed), '未见花匠不能靠网址参数冒充完成章节委托');
assert(!canReturnFromCompletedAlbum(true, false, false, { version: 2 }), '空白练习稿不可播放交稿回响');
assert(!parseCompositionDraft('{broken').stone, '破损存档须安全回到空白研究稿');
assert(!parseCompositionDraft(JSON.stringify({ ...complete, version: 1 })).stone, '旧版草稿不能伪装成新版已完成');

const falseStone = parseCompositionDraft(JSON.stringify({
  ...complete,
  stone: { state: { stones: [
    { x: 220, y: 268 }, { x: 430, y: 268 }, { x: 640, y: 268 },
  ], selected: 0 }, passed: true, exampleViewed: true },
}));
assert(!falseStone.stone?.passed, '不能仅凭存档字段跳过石稿实判');
assert(!canReturnFromCompletedAlbum(true, false, false, falseStone), '未完成三石委托不得返院');

const falseBranch = parseCompositionDraft(JSON.stringify({
  ...complete, branch: { state: { ...branchState, blooms: [{ x: 400, y: 250 }, { x: 430, y: 250 }] }, passed: true },
}));
assert(!falseBranch.branch?.passed, '花簇挤合时不能恢复为已交枝稿');

const values = new Map<string, string>();
(globalThis as { localStorage?: Storage }).localStorage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => { values.set(key, value); },
  removeItem: (key: string) => { values.delete(key); },
  clear: () => { values.clear(); },
  key: (index: number) => [...values.keys()][index] ?? null,
  get length() { return values.size; },
} as Storage;
const oldKey = 'gusu-liuyuan-composition-practice-v1-study';
values.set(oldKey, '{"version":1,"orchid":{"old":true}}');
assert(!loadCompositionDraft(false).stone && values.has(oldKey), '新版练习应隔离旧键而不覆盖旧草稿');
assert(saveCompositionDraft(false, complete), '独立研究稿应可保存');
assert(!loadCompositionDraft(true).stone, '章节模式和独立研究模式不应串档');
assert(loadCompositionDraft(false).branch?.passed, '同模式回访应恢复折枝练习');
console.log('构图练习存档：版本隔离、错误数据回退、两关恢复与模式隔离检查完成。');
