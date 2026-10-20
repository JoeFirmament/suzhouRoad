import { loadProgress, saveProgress, type ProgressData } from './progression.js';
export const LIUYUAN_VARIANT_COLLATED = 'liuyuan-garden-note-collated';
export function canCollateLiuyuan(progress: ProgressData): boolean {
  return progress.storyFlags.includes('ly-unlocked') && progress.storyFlags.includes('ly-leaf-written');
}
export function recordLiuyuanCollation(bookRead: boolean, leafRead: boolean): boolean {
  const progress=loadProgress();
  if (!bookRead || !leafRead || !canCollateLiuyuan(progress)
    || progress.knowledge.includes(LIUYUAN_VARIANT_COLLATED)) return false;
  progress.knowledge.push(LIUYUAN_VARIANT_COLLATED);
  saveProgress(progress);
  return true;
}
