import type { InteriorBeat } from './liuyuan-study-interior-beat.js';
import type { ProgressData } from './progression.js';

export const interiorResumeKey = (playtest: boolean, draft: boolean) =>
  `gusu:liuyuan-interior:reload-v1:${playtest ? 'playtest' : 'campaign'}:${draft ? 'draft' : 'default'}`;
const stamp = (progress: ProgressData) => JSON.stringify([
  progress.updatedAt, progress.storyFlags, progress.completedTasks,
]);

/** Dialogue stages only: no player coordinates, input state or editor data. */
export function parseInteriorResume(raw: string | null, progress: ProgressData): InteriorBeat | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw), state = value?.state;
    if (value?.version !== 1 || value.progressStamp !== stamp(progress) || !state
      || !['silent','choice','explore','farewell','paper-paused','paper-rule','paper-window','paper-end'].includes(state.phase)
      || ![null,'search','wrong'].includes(state.answer)
      || typeof state.deskSeen !== 'boolean' || typeof state.windowSeen !== 'boolean') return null;
    const met = progress.storyFlags.includes('ly-scholar-met');
    const known = progress.storyFlags.includes('ly-scholar-trouble-known');
    const paper = ['paper-rule','paper-window','paper-end'].includes(state.phase);
    if ((state.phase === 'silent') !== !met || paper !== known) return null;
    if (['silent','choice'].includes(state.phase)
      && (state.answer !== null || state.deskSeen || state.windowSeen)) return null;
    if (['explore','farewell','paper-paused'].includes(state.phase) && state.answer === null) return null;
    if (['farewell','paper-paused','paper-rule','paper-window','paper-end'].includes(state.phase) && !state.deskSeen) return null;
    if (['paper-window','paper-end'].includes(state.phase) && !state.windowSeen) return null;
    return { phase: state.phase, answer: state.answer, deskSeen: state.deskSeen, windowSeen: state.windowSeen };
  } catch { return null; }
}
export function readInteriorResume(key: string, progress: ProgressData): InteriorBeat | null {
  try { return parseInteriorResume(sessionStorage.getItem(key), progress); } catch { return null; }
}
export function writeInteriorResume(key: string, progress: ProgressData, state: InteriorBeat): void {
  try { sessionStorage.setItem(key, JSON.stringify({version:1, progressStamp:stamp(progress), state})); }
  catch { /* Optional recovery must never interrupt play. */ }
}
