import type { LeafStudy } from './liuyuan-leaf-writing-study.js';
import type { ProgressData } from './progression.js';

/** Only completed practice segments are retained, never an active pointer or half-stroke. */
export const leafResumeKey = (playtest: boolean) => `gusu:liuyuan-leaf:reload-v1:${playtest ? 'playtest' : 'campaign'}`;
export const leafProgressStamp = (progress: ProgressData) => JSON.stringify([
  progress.updatedAt, progress.storyFlags, progress.completedTasks,
]);

export function parseLeafResume(raw: string | null, progress: ProgressData): LeafStudy | null {
  if (!raw || !progress.storyFlags.includes('ly-scholar-trouble-known')
    || progress.storyFlags.includes('ly-leaf-written')) return null;
  try {
    const value=JSON.parse(raw);
    if (!value || value.version!==1 || value.progressStamp!==leafProgressStamp(progress)) return null;
    const state=value.state;
    if (!state || !['choose','trial','support','write'].includes(state.phase)
      || !Number.isInteger(state.strokes) || state.strokes<0 || state.strokes>2
      || typeof state.oldLeafSeen!=='boolean' || typeof state.inkSeen!=='boolean') return null;
    if (state.phase!=='write' && state.strokes!==0) return null;
    if (state.inkSeen !== (state.phase==='support' || state.phase==='write')) return null;
    if (state.phase!=='choose' && !progress.storyFlags.includes('ly-leaf-picked')) return null;
    return {phase:state.phase, strokes:state.strokes, oldLeafSeen:state.oldLeafSeen, inkSeen:state.inkSeen};
  } catch { return null; }
}

export function readLeafResume(playtest: boolean, progress: ProgressData): LeafStudy | null {
  try { return parseLeafResume(sessionStorage.getItem(leafResumeKey(playtest)),progress); }
  catch { return null; }
}
export function writeLeafResume(playtest: boolean, progress: ProgressData, state: LeafStudy): void {
  try {
    if (state.phase==='done') sessionStorage.removeItem(leafResumeKey(playtest));
    else sessionStorage.setItem(leafResumeKey(playtest),JSON.stringify({version:1,
      progressStamp:leafProgressStamp(progress),state}));
  } catch { /* Optional checkpoint: restricted storage must not interrupt writing. */ }
}
