/** CH3-06 spatial rehearsal only: no chapter flag and no claim about a historic gate. */
export type ReturnWalkState = {
  thresholdSeen: boolean;
  crossed: boolean;
  lookedBack: boolean;
  reachedEnd: boolean;
};
export const INITIAL_RETURN_WALK: ReturnWalkState = {
  thresholdSeen: false, crossed: false, lookedBack: false, reachedEnd: false,
};
export type ReturnWalkEvent = 'threshold' | 'inside' | 'look-back' | 'onward';

export function advanceReturnWalk(state: ReturnWalkState, event: ReturnWalkEvent): ReturnWalkState {
  switch (event) {
    case 'threshold': return { ...state, thresholdSeen: true };
    case 'inside': return state.thresholdSeen ? { ...state, crossed: true } : state;
    case 'look-back': return state.crossed ? { ...state, lookedBack: true } : state;
    case 'onward': return state.lookedBack ? { ...state, reachedEnd: true } : state;
  }
}

/** Restore only the independent geometry rehearsal after its research cut. No CH3 flag. */
export function completedReturnWalk(): ReturnWalkState {
  return (['threshold', 'inside', 'look-back', 'onward'] as const)
    .reduce<ReturnWalkState>(advanceReturnWalk, INITIAL_RETURN_WALK);
}
