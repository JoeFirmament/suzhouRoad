/** Fictional paper-and-shadow timing study; not a historical garden claim. */
export const SHADOW_TARGETS = [0.28, 0.71, 0.44] as const;
export const SHADOW_TOTAL_BEATS = SHADOW_TARGETS.length;

export interface ShadowBeatState {
  phase: number;
  beats: number;
  misses: number;
  complete: boolean;
}

export function newShadowBeat(): ShadowBeatState {
  return { phase: 0, beats: 0, misses: 0, complete: false };
}

export function shadowPosition(state: ShadowBeatState): number {
  return state.phase <= 1 ? state.phase : 2 - state.phase;
}

export function advanceShadowBeat(state: ShadowBeatState, dt: number, slow = false): ShadowBeatState {
  if (state.complete) return state;
  const speed = slow ? 0.38 : 0.86;
  return { ...state, phase: (state.phase + Math.max(0, dt) * speed) % 2 };
}

export function strikeShadowBeat(state: ShadowBeatState, slow = false): {
  state: ShadowBeatState; hit: boolean;
} {
  if (state.complete) return { state, hit: true };
  const tolerance = slow ? 0.13 : 0.085;
  const hit = Math.abs(shadowPosition(state) - SHADOW_TARGETS[state.beats]) <= tolerance;
  if (!hit) return { state: { ...state, beats: 0, misses: state.misses + 1 }, hit: false };
  const beats = state.beats + 1;
  return { state: { ...state, beats, complete: beats === SHADOW_TOTAL_BEATS }, hit: true };
}
