import { loadProgress, saveProgress, type ProgressData, type StoryFlag } from './progression.js';
import { LIUYUAN_TEXT_VARIANT } from './liuyuan-text-variant.js';

/** CH3 events: directions, gate talk, florist talk and tree inspection are optional; bypasses never forge them. */
export const LIUYUAN_CHAPTER_FLAGS = [
  'ly-errand-offered',
  'ly-huabu-seen',
  'ly-gate-clue',
  'ly-gate-passed',
  'ly-alley-walked',
  'ly-porridge-delivered',
  'ly-florist-met',
  'ly-magnolia-seen',
  'ly-study-found',
  'ly-scholar-met',
  'ly-scholar-trouble-known',
  'ly-leaf-picked',
  'ly-leaf-written',
  'ly-leaf-carried',
  'ly-unlocked',
] as const satisfies readonly StoryFlag[];

export type LiuyuanChapterFlag = typeof LIUYUAN_CHAPTER_FLAGS[number];
export type LiuyuanAdvanceResult = {
  progress: ProgressData;
  applied: boolean;
  reason: 'applied' | 'already-applied' | 'missing-previous';
  requiredFlag?: LiuyuanChapterFlag;
};

const ALLEY_TASK_ID = 'liuyuan-alley-walk';
const LEAF_TASK_ID = 'liuyuan-leaf-writing';

function addOnce(values: string[], value: string): void {
  if (!values.includes(value)) values.push(value);
}

/** 纯状态转移：不写浏览器存档，便于回放和自动验收。 */
export function advanceLiuyuanChapter(progress: ProgressData, flag: LiuyuanChapterFlag): LiuyuanAdvanceResult {
  if (progress.storyFlags.includes(flag)) return { progress, applied: false, reason: 'already-applied' };
  const index = LIUYUAN_CHAPTER_FLAGS.indexOf(flag);
  const requiredFlag = flag === 'ly-gate-passed' ? 'ly-errand-offered'
    : flag === 'ly-magnolia-seen' || flag === 'ly-study-found' ? 'ly-porridge-delivered'
    : index > 0 ? LIUYUAN_CHAPTER_FLAGS[index - 1] : undefined;
  if (requiredFlag && !progress.storyFlags.includes(requiredFlag)) {
    return { progress, applied: false, reason: 'missing-previous', requiredFlag };
  }

  const next: ProgressData = {
    ...progress,
    arts: { ...progress.arts },
    gardens: { ...progress.gardens },
    completedTasks: [...progress.completedTasks],
    knowledge: [...progress.knowledge],
    storyFlags: [...progress.storyFlags, flag],
  };
  if (flag === 'ly-errand-offered' && next.gardens.liuyuan === 'locked') next.gardens.liuyuan = 'clue';
  if (flag === 'ly-gate-passed') next.gardens.liuyuan = 'open';
  if (flag === 'ly-alley-walked') {
    next.gardens.liuyuan = 'entered';
    if (!next.completedTasks.includes(ALLEY_TASK_ID)) {
      next.completedTasks.push(ALLEY_TASK_ID);
      addOnce(next.knowledge, 'liuyuan-cramped-alley');
    }
  }
  if (flag === 'ly-florist-met') addOnce(next.knowledge, 'liuyuan-magnolia-slip');
  if (flag === 'ly-leaf-written' && !next.completedTasks.includes(LEAF_TASK_ID)) {
    next.completedTasks.push(LEAF_TASK_ID);
    next.arts.shu += 1;
  }
  if (flag === 'ly-leaf-written') addOnce(next.knowledge, LIUYUAN_TEXT_VARIANT.knowledgeId);
  if (flag === 'ly-unlocked') next.gardens.liuyuan = 'complete';
  return { progress: next, applied: true, reason: 'applied' };
}

/** 页面中的事件入口：重复触发不刷属性；缺前置事件时不静默跳关。 */
export function commitLiuyuanChapterFlag(flag: LiuyuanChapterFlag): LiuyuanAdvanceResult {
  const result = advanceLiuyuanChapter(loadProgress(), flag);
  if (result.applied) saveProgress(result.progress);
  return result;
}

/** Optional play earns one art point once; preview callers must not invoke this. */
export function awardLiuyuanRainShadow(): boolean {
  const progress = loadProgress();
  const task = 'liuyuan-rain-shadow';
  if (progress.completedTasks.includes(task)) return false;
  progress.completedTasks.push(task);
  if (!progress.storyFlags.includes('ly-rain-shadow-cleared')) progress.storyFlags.push('ly-rain-shadow-cleared');
  progress.arts.yu += 1;
  saveProgress(progress);
  return true;
}

/** A completed rescue leaves an original album leaf; a mishap only leaves a memory. */
export function rememberLiuyuanDrawing(outcome: 'saved' | 'smudged' | 'left'): void {
  const progress = loadProgress();
  const memory = `liuyuan-drawing-${outcome}`;
  if (progress.knowledge.includes(memory)) return;
  progress.knowledge.push(memory);
  if (outcome === 'saved') addOnce(progress.knowledge, 'liuyuan-album-orchid-leaf');
  saveProgress(progress);
}

/** Older saves may already have heard the florist before the note was persisted. */
export function rememberLiuyuanFloristClue(): boolean {
  const progress = loadProgress();
  if (!progress.storyFlags.includes('ly-florist-met')
    || progress.knowledge.includes('liuyuan-magnolia-slip')) return false;
  progress.knowledge.push('liuyuan-magnolia-slip');
  saveProgress(progress);
  return true;
}
