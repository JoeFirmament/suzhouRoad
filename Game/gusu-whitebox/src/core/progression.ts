import { isLiuyuanPlaytest } from './liuyuan-playtest.js';

export type ArtId = 'li' | 'yue' | 'she' | 'yu' | 'shu' | 'shuMath';
export type GardenId = 'canglang' | 'wangshi' | 'zhuozheng' | 'shizilin' | 'liuyuan' | 'ouyuan' | 'yipu' | 'huanxiu' | 'tuisi';
export type GardenState = 'locked' | 'clue' | 'open' | 'entered' | 'complete';
export type StoryFlag =
  | 'opening-arrival-seen'
  | 'opening-seen'
  | 'shen-met'
  | 'home-desk-known'
  | 'home-rubbings-known'
  | 'home-courtyard-heard'
  | 'home-gate-known'
  | 'home-bookcase-book-known'
  | 'home-pages-known'
  | 'home-corner-leaf-known'
  | 'home-broken-leaf-seen'
  | 'home-teacher-letter-known'
  | 'home-orientation-complete'
  | 'gu-met'
  | 'first-lesson-offered'
  | 'fuxue-briefing-seen'
  | 'city-map-introduced'
  | 'ajin-met'
  | 'nine-gardens-album-introduced'
  | 'canglang-arrival-seen'
  | 'fuxue-first-return-seen'
  | 'ly-errand-offered'
  | 'ly-huabu-seen'
  | 'ly-gate-clue'
  | 'ly-lantern-helped'
  | 'ly-rain-shadow-cleared'
  | 'ly-gate-passed'
  | 'ly-alley-walked'
  | 'ly-porridge-delivered'
  | 'ly-florist-met'
  | 'ly-magnolia-seen'
  | 'ly-study-found'
  | 'ly-scholar-met'
  | 'ly-scholar-trouble-known'
  | 'ly-leaf-picked'
  | 'ly-leaf-written'
  | 'ly-leaf-carried'
  | 'ly-unlocked';

export interface ProgressData {
  version: 1;
  arts: Record<ArtId, number>;
  gardens: Record<GardenId, GardenState>;
  completedTasks: string[];
  knowledge: string[];
  storyFlags: StoryFlag[];
  updatedAt: number;
}

const SAVE_KEY = 'gusu-nine-gardens-rpg-v1';
const LIUYUAN_PLAYTEST_KEY = 'gusu-nine-gardens-liuyuan-playtest-v1';
const activeSaveKey = () => isLiuyuanPlaytest() ? LIUYUAN_PLAYTEST_KEY : SAVE_KEY;
// Some file:// and private browser contexts deny Web Storage. Keep each save
// slot separately in memory so a demo cannot leak into the campaign slot.
const volatileProgress = new Map<string, ProgressData>();
const storageWriteFailed = new Set<string>();

/** 新剧本采用的新命名与早期白模存档双向兼容。 */
const FLAG_ALIASES: Partial<Record<StoryFlag, StoryFlag>> = {
  'opening-arrival-seen': 'opening-seen',
  'opening-seen': 'opening-arrival-seen',
  'first-lesson-offered': 'fuxue-briefing-seen',
  'fuxue-briefing-seen': 'first-lesson-offered',
};

const DEFAULT_PROGRESS: ProgressData = {
  version: 1,
  arts: { li: 0, yue: 0, she: 0, yu: 0, shu: 0, shuMath: 0 },
  gardens: {
    canglang: 'open', wangshi: 'locked', zhuozheng: 'locked', shizilin: 'locked', liuyuan: 'locked',
    ouyuan: 'locked', yipu: 'locked', huanxiu: 'locked', tuisi: 'locked',
  },
  completedTasks: [],
  knowledge: [],
  storyFlags: [],
  updatedAt: 0,
};

function cloneDefault(): ProgressData {
  return JSON.parse(JSON.stringify(DEFAULT_PROGRESS)) as ProgressData;
}

export function loadProgress(): ProgressData {
  const key = activeSaveKey();
  const fallback = volatileProgress.get(key);
  if (storageWriteFailed.has(key) && fallback) return structuredClone(fallback);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback ? structuredClone(fallback) : cloneDefault();
    const saved = JSON.parse(raw) as Partial<ProgressData>;
    const base = cloneDefault();
    const progress: ProgressData = {
      ...base,
      ...saved,
      arts: { ...base.arts, ...(saved.arts ?? {}) },
      gardens: { ...base.gardens, ...(saved.gardens ?? {}) },
      completedTasks: Array.isArray(saved.completedTasks) ? saved.completedTasks : [],
      knowledge: Array.isArray(saved.knowledge) ? saved.knowledge : [],
      storyFlags: Array.isArray(saved.storyFlags) ? saved.storyFlags : [],
      updatedAt: typeof saved.updatedAt === 'number' ? saved.updatedAt : 0,
    };
    volatileProgress.set(key, structuredClone(progress));
    return progress;
  } catch {
    return fallback ? structuredClone(fallback) : cloneDefault();
  }
}

export function hasStoryFlag(progress: ProgressData, flag: StoryFlag): boolean {
  const alias = FLAG_ALIASES[flag];
  return progress.storyFlags.includes(flag) || (!!alias && progress.storyFlags.includes(alias));
}

export function markStoryFlag(flag: StoryFlag): ProgressData {
  const progress = loadProgress();
  if (!progress.storyFlags.includes(flag)) {
    progress.storyFlags.push(flag);
    saveProgress(progress);
  }
  return progress;
}

export function saveProgress(progress: ProgressData): void {
  progress.updatedAt = Date.now();
  const key = activeSaveKey();
  volatileProgress.set(key, structuredClone(progress));
  try {
    localStorage.setItem(key, JSON.stringify(progress));
    storageWriteFailed.delete(key);
  } catch {
    storageWriteFailed.add(key);
    // file:// 或隐私模式可能禁用存储；至少本页的事件不能因此卡死。
  }
}

export function resetProgress(): ProgressData {
  const progress = cloneDefault();
  saveProgress(progress);
  return progress;
}

export function hasStarted(progress: ProgressData): boolean {
  return progress.updatedAt > 0 || progress.completedTasks.length > 0 || progress.storyFlags.length > 0;
}

/** 任务奖励只结算一次，避免重复游玩刷属性。 */
export function completeCanglangThreeWindows(): { progress: ProgressData; rewarded: boolean } {
  const progress = loadProgress();
  const taskId = 'canglang-three-windows';
  if (progress.completedTasks.includes(taskId)) return { progress, rewarded: false };

  progress.completedTasks.push(taskId);
  progress.arts.shuMath += 1;
  progress.gardens.canglang = 'complete';
  progress.gardens.wangshi = 'clue';
  progress.knowledge.push('canglang-double-corridor', 'moving-view-through-windows');
  saveProgress(progress);
  return { progress, rewarded: true };
}

export function artStage(value: number): string {
  return value <= 0 ? '未习' : value === 1 ? '初识' : value === 2 ? '入门' : '通晓';
}
