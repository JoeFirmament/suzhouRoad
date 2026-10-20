/** Reload-only walking checkpoint. It never writes campaign or editor data. */
export interface EntryWalkCheckpoint {
  x: number;
  y: number;
  dir: number;
  alleyCheckpoint: number;
  returnCheckpoint: number;
  gateAnswered: boolean;
  bucketResting: boolean;
}

export interface EntryResumeContext {
  slot: string;
  progressStamp: string;
  geometryStamp: string;
  maxAlley: number;
  maxReturn: number;
  canStand: (x: number, y: number) => boolean;
  stateAllowed: (state: EntryWalkCheckpoint) => boolean;
}

export function entryResumeKey(slot: string): string {
  return `gusu:liuyuan-entry:reload-v1:${slot}`;
}

/** A geometry change invalidates an old foot location, not the player's draft. */
export function entryGeometryStamp(map: Uint8Array, obstacles: unknown): string {
  let hash = 2166136261;
  for (const value of map) hash = Math.imul(hash ^ value, 16777619);
  const shapes = JSON.stringify(obstacles);
  for (let index = 0; index < shapes.length; index++)
    hash = Math.imul(hash ^ shapes.charCodeAt(index), 16777619);
  return `${map.length}:${hash >>> 0}`;
}

export function parseEntryResume(raw: string | null, context: EntryResumeContext): EntryWalkCheckpoint | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || value.version !== 1 || value.progressStamp !== context.progressStamp
      || value.geometryStamp !== context.geometryStamp) return null;
    const state = value.state;
    if (!state || !Number.isFinite(state.x) || !Number.isFinite(state.y)
      || !Number.isInteger(state.dir) || state.dir < 0 || state.dir > 3
      || !Number.isInteger(state.alleyCheckpoint) || state.alleyCheckpoint < 0
      || state.alleyCheckpoint > context.maxAlley
      || !Number.isInteger(state.returnCheckpoint) || state.returnCheckpoint < 0
      || state.returnCheckpoint > context.maxReturn
      || typeof state.gateAnswered !== 'boolean' || typeof state.bucketResting !== 'boolean'
      || !context.canStand(state.x, state.y) || !context.stateAllowed(state)) return null;
    // Explicit projection avoids carrying arbitrary extra keys from Web Storage.
    return { x: state.x, y: state.y, dir: state.dir, alleyCheckpoint: state.alleyCheckpoint,
      returnCheckpoint: state.returnCheckpoint, gateAnswered: state.gateAnswered,
      bucketResting: state.bucketResting };
  } catch { return null; }
}

export function readEntryResume(context: EntryResumeContext): EntryWalkCheckpoint | null {
  try { return parseEntryResume(sessionStorage.getItem(entryResumeKey(context.slot)), context); }
  catch { return null; }
}

export function writeEntryResume(context: EntryResumeContext, state: EntryWalkCheckpoint): void {
  try {
    sessionStorage.setItem(entryResumeKey(context.slot), JSON.stringify({ version: 1,
      progressStamp: context.progressStamp, geometryStamp: context.geometryStamp, state }));
  } catch { /* file:// or privacy restrictions must not break walking. */ }
}

export function clearEntryResume(slot: string): void {
  try { sessionStorage.removeItem(entryResumeKey(slot)); }
  catch { /* This reload checkpoint is optional. */ }
}
