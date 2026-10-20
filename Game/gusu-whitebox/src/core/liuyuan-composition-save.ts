import { assessStoneComposition, type StoneStudyState } from './liuyuan-composition-study.js';
import { assessBranchStudy, type BranchStudyState } from './liuyuan-zhezhi-study.js';

/** Local art-practice drafts only: no CH3 flags, 六艺 or geometry-editor data. */
export type StoneCheckpoint = { state: StoneStudyState; passed: boolean; exampleViewed: boolean };
/** The persisted `passed` field is a v2 compatibility name: it means the player
 * completed an observation/review round, not that a visual threshold was met. */
export type BranchCheckpoint = { state: BranchStudyState; passed: boolean };
export type CompositionDraft = { version: 2; stone?: StoneCheckpoint; branch?: BranchCheckpoint };

const STORAGE_PREFIX = 'gusu-garden-composition-practice-v2-';
const emptyDraft = (): CompositionDraft => ({ version: 2 });
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const validPoint = (value: unknown): value is { x: number; y: number } =>
  record(value) && typeof value.x === 'number' && Number.isFinite(value.x) && value.x >= 0 && value.x <= 960
  && typeof value.y === 'number' && Number.isFinite(value.y) && value.y >= 0 && value.y <= 480;

export function parseCompositionDraft(raw: string | null): CompositionDraft {
  if (!raw) return emptyDraft();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!record(parsed) || parsed.version !== 2) return emptyDraft();
    const draft = emptyDraft();

    if (record(parsed.stone) && record(parsed.stone.state)) {
      const positions = parsed.stone.state.stones;
      const selected = parsed.stone.state.selected;
      if (Array.isArray(positions) && positions.length === 3 && positions.every(validPoint)
        && (selected === 0 || selected === 1 || selected === 2)) {
        const state: StoneStudyState = {
          stones: positions.map((point) => ({ x: point.x, y: point.y })) as StoneStudyState['stones'],
          selected,
        };
        const exampleViewed = parsed.stone.exampleViewed === true;
        draft.stone = {
          state, exampleViewed,
          passed: exampleViewed && parsed.stone.passed === true && assessStoneComposition(state).passed,
        };
      }
    }

    if (record(parsed.branch) && record(parsed.branch.state)) {
      const stem = parsed.branch.state.stem;
      const blooms = parsed.branch.state.blooms;
      const selected = parsed.branch.state.selected;
      if (Array.isArray(stem) && stem.length === 5 && stem.every(validPoint)
        && Array.isArray(blooms) && blooms.length === 2 && blooms.every(validPoint)
        && Number.isInteger(selected) && (selected as number) >= 0 && (selected as number) <= 6) {
        const state: BranchStudyState = {
          stem: stem.map((point) => ({ x: point.x, y: point.y })) as BranchStudyState['stem'],
          blooms: blooms.map((point) => ({ x: point.x, y: point.y })) as BranchStudyState['blooms'],
          selected: selected as number,
        };
        draft.branch = { state, passed: parsed.branch.passed === true && assessBranchStudy(state).passed };
      }
    }
    return draft;
  } catch {
    return emptyDraft();
  }
}

export function loadCompositionDraft(chapter: boolean): CompositionDraft {
  try { return parseCompositionDraft(localStorage.getItem(`${STORAGE_PREFIX}${chapter ? 'chapter' : 'study'}`)); }
  catch { return emptyDraft(); }
}

export function saveCompositionDraft(chapter: boolean, draft: CompositionDraft): boolean {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${chapter ? 'chapter' : 'study'}`, JSON.stringify(draft));
    return true;
  } catch { return false; }
}

/** URL parameters are navigation hints, never evidence that the player finished the study. */
export function canReturnFromCompletedAlbum(
  requested: boolean, chapter: boolean, floristMet: boolean, draft: CompositionDraft,
): boolean {
  const stone = draft.stone;
  return requested && (!chapter || floristMet)
    && stone?.exampleViewed === true && stone.passed === true && assessStoneComposition(stone.state).passed;
}
