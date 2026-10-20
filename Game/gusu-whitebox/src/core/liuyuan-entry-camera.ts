/**
 * The entrance is one walkable world, but its camera reads like three linked
 * compositions: street/gate, the concealed west bend, then the north windows.
 * These are game shot positions, not a claim about any historical view point.
 */
export const LIUYUAN_ENTRY_VIEW = { width: 504, height: 344 } as const;
export const LIUYUAN_ENTRY_WORLD = { width: 1008, height: 688 } as const;

export type EntryCameraBeat = 'gate' | 'bend' | 'windows';
export interface EntryCameraPosition { x: number; y: number; beat: EntryCameraBeat }

interface ShotKey {
  footX: number;
  footY: number;
  cameraX: number;
  cameraY: number;
}

/** Same walking order as the editor route graph; return play projects onto it in reverse. */
export const LIUYUAN_ENTRY_SHOT_KEYS: readonly ShotKey[] = [
  { footX: 520, footY: 656, cameraX: 268, cameraY: 344 }, // street: first well only
  { footX: 520, footY: 610, cameraX: 268, cameraY: 344 }, // one open gate
  { footX: 520, footY: 550, cameraX: 268, cameraY: 332 }, // front hall
  { footX: 520, footY: 480, cameraX: 268, cameraY: 295 }, // first lightwell
  { footX: 520, footY: 400, cameraX: 250, cameraY: 270 }, // narrow south passage
  { footX: 430, footY: 400, cameraX: 200, cameraY: 262 }, // west bend, windows hidden
  { footX: 430, footY: 374, cameraX: 185, cameraY: 236 }, // second lightwell
  { footX: 430, footY: 300, cameraX: 150, cameraY: 160 }, // first view of six windows
  { footX: 430, footY: 250, cameraX: 110, cameraY: 90 },  // tree court
  { footX: 420, footY: 232, cameraX: 100, cameraY: 78 },  // window foot
  { footX: 340, footY: 232, cameraX: 70, cameraY: 78 },   // west passage
  { footX: 290, footY: 232, cameraX: 35, cameraY: 78 },   // exit to next shot
];

function clamp(value: number, lower: number, upper: number): number {
  return Math.max(lower, Math.min(upper, value));
}

/** Project a free-walking foot point onto the route; no story flags or Tile changes. */
export function entryCameraForFoot(footX: number, footY: number): EntryCameraPosition {
  let bestDistance = Infinity;
  let bestSegment = 0;
  let bestT = 0;
  for (let index = 0; index < LIUYUAN_ENTRY_SHOT_KEYS.length - 1; index++) {
    const from = LIUYUAN_ENTRY_SHOT_KEYS[index];
    const to = LIUYUAN_ENTRY_SHOT_KEYS[index + 1];
    const dx = to.footX - from.footX;
    const dy = to.footY - from.footY;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared ? clamp(((footX - from.footX) * dx + (footY - from.footY) * dy)
      / lengthSquared, 0, 1) : 0;
    const offX = footX - (from.footX + dx * t);
    const offY = footY - (from.footY + dy * t);
    const distance = offX * offX + offY * offY;
    if (distance < bestDistance) { bestDistance = distance; bestSegment = index; bestT = t; }
  }
  const from = LIUYUAN_ENTRY_SHOT_KEYS[bestSegment];
  const to = LIUYUAN_ENTRY_SHOT_KEYS[bestSegment + 1];
  const progress = bestSegment + bestT;
  const beat: EntryCameraBeat = progress < 3 ? 'gate' : progress < 7 ? 'bend' : 'windows';
  return {
    x: clamp(from.cameraX + (to.cameraX - from.cameraX) * bestT,
      0, LIUYUAN_ENTRY_WORLD.width - LIUYUAN_ENTRY_VIEW.width),
    y: clamp(from.cameraY + (to.cameraY - from.cameraY) * bestT,
      0, LIUYUAN_ENTRY_WORLD.height - LIUYUAN_ENTRY_VIEW.height),
    beat,
  };
}
