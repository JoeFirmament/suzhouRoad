import { bandPosition, rainBandHits, rainWindow, rainCatDuration, type RainShadow } from '../src/core/liuyuan-rain-shadow.js';

/** Test driver: follows the drawn target/gap geometry, never mutates the game. */
export function rainTestInput(s: RainShadow) {
  const target = s.collected ? { x: s.x, y: s.y } : rainWindow(s);
  if (s.collected) for (const axis of ['x', 'y'] as const) {
    const band = s.bands.find((b) => b.axis === axis
      && (b.age < b.warning || b.sign * (bandPosition(b) - (axis === 'y' ? s.y : s.x)) <= 9));
    if (band) { if (axis === 'y') target.x = band.gap; else target.y = band.gap; }
  }
  if (s.cat && s.cat.age < s.cat.warning + rainCatDuration(s.cat)) {
    // Read the locked amber aim, then sidestep; no future state or teleporting.
    if (s.cat.fromX !== s.cat.toX) target.y = s.cat.toY + (s.cat.toY > 108 ? -22 : 22);
    else target.x = s.cat.toX + (s.cat.toX > 160 ? -22 : 22);
  }
  return { x: 0, y: 0, target,
    guard: s.bands.some((b) => b.age >= b.warning && rainBandHits(b, s.x, s.y)) };
}
