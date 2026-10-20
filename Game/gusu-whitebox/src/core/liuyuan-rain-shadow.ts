/** A fictional movement exercise inspired by the changing light of garden corridors.
 * No DOM, persistence, random spawns, or chapter rewards live in this simulation. */
export const RAIN_FIELD = { width: 320, height: 208, left: 24, right: 296, top: 32, bottom: 184 } as const;
/** Rain survival time begins only after the drawing has been picked up. */
export const RAIN_ROUND_SECONDS = 7;
export const RAIN_ROUND_NAMES = ['一折 · 猫拨画稿', '二折 · 雨从侧来', '三折 · 回身有路',
  '四折 · 雨从后至', '五折 · 侧雨换向', '六折 · 穿过斜雨'] as const;
export const RAIN_ROUND_COUNT = RAIN_ROUND_NAMES.length;
/** A single rescued sheet, with three readable increases in pressure. */
export const STORY_RAIN_STAGES = [
  { start: 0, name: '辨雨', tip: '先看竖向雨缝，下一阵亮处会换边。' },
  { start: 5.5, name: '换向', tip: '雨从侧面来了，改看雨缝的高低。' },
  { start: 10.75, name: '交雨', tip: '纵横雨势交错，先顾将近的一阵，紧处再护画。' },
] as const;
export const STORY_RAIN_WAVES = [
  { at: .45, axis: 'y', gap: 78, stage: 0 }, { at: 3, axis: 'y', gap: 220, stage: 0 },
  { at: 5.5, axis: 'x', gap: 76, stage: 1 }, { at: 8.1, axis: 'x', gap: 146, stage: 1 },
  { at: 10.75, axis: 'y', gap: 104, stage: 2 }, { at: 12.45, axis: 'x', gap: 64, stage: 2 },
  { at: 14, axis: 'y', gap: 236, stage: 2 }, { at: 15.4, axis: 'x', gap: 144, stage: 2 },
] as const;
const STORY_RAIN_BEATS = STORY_RAIN_WAVES.map((wave) => wave.at);
/** One mischievous cat, not five simultaneous enemies. Pickup is always safe. */
export const STORY_CAT_BEATS = [2.4, 6.65, 9.45, 12.8, 15.9] as const;
export interface RainCatPounce {
  fromX: number; fromY: number; toX: number; toY: number;
  age: number; warning: number; speed: number;
}
export function rainCatDuration(cat: RainCatPounce): number {
  return Math.hypot(cat.toX - cat.fromX, cat.toY - cat.fromY) / cat.speed;
}
export function rainCatPosition(cat: RainCatPounce): { x: number; y: number } {
  const t = Math.max(0, Math.min(1, (cat.age - cat.warning) / rainCatDuration(cat)));
  return { x: cat.fromX + (cat.toX - cat.fromX) * t, y: cat.fromY + (cat.toY - cat.fromY) * t };
}
export function rainCatHits(cat: RainCatPounce, x: number, y: number): boolean {
  if (cat.age < cat.warning || cat.age >= cat.warning + rainCatDuration(cat)) return false;
  const p = rainCatPosition(cat);
  return Math.hypot(x - p.x, y - p.y) <= 8;
}
export function rainStoryStage(s: Pick<RainShadow, 'rainTime'>): number {
  return s.rainTime >= STORY_RAIN_STAGES[2].start ? 2 : s.rainTime >= STORY_RAIN_STAGES[1].start ? 1 : 0;
}
export const RAIN_ROUND_TIPS = ['捡画后看青色雨缝，亮处不挡雨。', '雨从左右来，雨缝看高低。',
  '纵雨横雨交替，别守着捡画处。', '雨先从下方来，留意箭头。', '先右后左，缺口也换了位置。',
  '雨势交错。看准缺口，紧处再护画。'] as const;
export type RainPhase = 'ready' | 'running' | 'paused' | 'won' | 'lost';
export interface RainBand {
  axis: 'x' | 'y'; from: number; sign: number; gap: number; opening: number;
  age: number; warning: number; speed: number;
}
export interface RainShadow {
  story: boolean;
  phase: RainPhase; round: number; time: number; rainTime: number; total: number; health: number;
  x: number; y: number; collected: boolean; marks: number; hits: number;
  shield: number; cooldown: number; invulnerable: number; nextBand: number;
  bands: RainBand[]; gentle: boolean; result: string;
  cat: RainCatPounce | null; nextCat: number; catHits: number; lastHit: 'rain' | 'cat' | '';
  direction: number; moving: boolean;
  roundStart: { x: number; y: number; health: number; hits: number };
}
export interface RainInput { x: number; y: number; guard?: boolean; target?: { x: number; y: number } }
const WINDOWS = [{ x: 78, y: 128 }, { x: 239, y: 76 }, { x: 105, y: 65 },
  { x: 236, y: 140 }, { x: 92, y: 105 }, { x: 218, y: 64 }] as const;
export function rainWindow(state: RainShadow): { x: number; y: number } {
  return WINDOWS[Math.max(0, Math.min(RAIN_ROUND_COUNT - 1, state.round))];
}
export function rainPickupSeconds(state: RainShadow): number { return state.gentle ? 6 : 4; }
export function rainSecondsLeft(state: RainShadow): number {
  return Math.max(0, Math.ceil(state.collected ? rainDuration(state) - state.rainTime : rainPickupSeconds(state) - state.time));
}
export const rainDuration = (state: RainShadow) => state.story ? 18 : RAIN_ROUND_SECONDS;
export const rainRoundCount = (state: RainShadow) => state.story ? 1 : RAIN_ROUND_COUNT;
// This event has exactly three HP, including the slower accessibility setting.
export const rainHealthCapacity = (state: Pick<RainShadow, 'story' | 'gentle'>) => state.story ? 3 : state.gentle ? 7 : 5;
export const rainHitGrace = (state: Pick<RainShadow, 'story'>) => state.story ? .6 : .85;
export function createRainShadow(gentle = false, story = false): RainShadow {
  const health = rainHealthCapacity({ story, gentle });
  return { story, phase: 'ready', round: 0, time: 0, rainTime: 0, total: 0, health,
    x: 160, y: 157, collected: false, marks: 0, hits: 0, shield: 0,
    cooldown: 0, invulnerable: 0, nextBand: 0, bands: [], cat: null, nextCat: 0, catHits: 0, lastHit: '', gentle, result: '', direction: 0, moving: false,
    roundStart: { x: 160, y: 157, health, hits: 0 } };
}
/** Retry only the failed phrase, never make players repeat successful folds. */
export function retryRainShadow(state: RainShadow, gentle = state.gentle): RainShadow {
  if (state.phase !== 'lost' && state.phase !== 'ready') return state;
  const next = createRainShadow(gentle, state.story);
  next.round = state.round; next.marks = state.round;
  next.x = state.roundStart.x; next.y = state.roundStart.y;
  next.health = gentle === state.gentle ? state.roundStart.health : gentle ? rainHealthCapacity(next) : Math.min(rainHealthCapacity(next), state.roundStart.health);
  next.hits = state.roundStart.hits; next.total = Math.max(0, state.total - state.time);
  next.roundStart = { x: next.x, y: next.y, health: next.health, hits: next.hits };
  return next;
}
export function startRainShadow(state: RainShadow): void {
  if (state.phase === 'ready') state.phase = 'running';
}
export function pauseRainShadow(state: RainShadow): void {
  if (state.phase === 'running') state.phase = 'paused';
}
export function guardRainShadow(state: RainShadow): void {
  if (state.phase === 'running' && state.cooldown === 0) { state.shield = .6; state.cooldown = 2; }
}
export function bandPosition(band: RainBand): number {
  return band.from + band.sign * Math.max(0, band.age - band.warning) * band.speed;
}
export function rainBandLifetime(band: RainBand): number {
  // Slow horizontal rain must reach the far edge too; no fixed-time safe corner.
  if (band.speed <= 0) return Infinity;
  const end = band.axis === 'y' ? band.sign > 0 ? RAIN_FIELD.bottom + 16 : RAIN_FIELD.top - 16
    : band.sign > 0 ? RAIN_FIELD.right + 16 : RAIN_FIELD.left - 16;
  return band.warning + Math.abs(end - band.from) / band.speed;
}
export function rainBandHits(band: RainBand, x: number, y: number): boolean {
  if (band.age < band.warning) return false;
  const along = band.axis === 'y' ? y : x;
  const across = band.axis === 'y' ? x : y;
  // The small ink dot, not the whole visual silhouette, is the hitbox.
  return Math.abs(along - bandPosition(band)) <= 9
    && Math.abs(across - band.gap) > band.opening / 2 - 3;
}
function makeBand(state: RainShadow, index: number): RainBand {
  if (state.story) {
    const wave = STORY_RAIN_WAVES[index];
    const { axis, gap, stage } = wave;
    const sign = index % 2 ? -1 : 1;
    return { axis, sign, from: axis === 'y' ? sign > 0 ? 20 : 196 : sign > 0 ? 12 : 308,
      gap, age: 0, opening: (state.gentle ? [104, 88, 72] : [84, 66, 50])[stage],
      warning: (state.gentle ? [1.6, 1.35, 1.2] : [1.35, 1.1, .95])[stage],
      speed: (state.gentle ? [70, 84, 96] : [82, 100, 116])[stage] };
  }
  const axis = state.round === 0 || state.round === 3 ? 'y'
    : state.round === 1 || state.round === 4 ? 'x' : index % 2 ? 'x' : 'y';
  const sign = (index % 2 ? -1 : 1) * (state.round >= 3 ? -1 : 1);
  const shift = state.round >= 3 ? 1 : 0;
  const gap = axis === 'y' ? [78, 239, 105, 220][(index + shift) % 4] : [128, 76, 145, 65][(index + shift) % 4];
  return { axis, sign, from: axis === 'y' ? sign > 0 ? 20 : 196 : sign > 0 ? 12 : 308,
    gap, opening: state.gentle ? 76 : state.round === 0 ? 70 : state.round === 5 ? 48 : 62,
    warning: state.gentle || state.round === 0 ? 1.25 : .95, age: 0,
    speed: state.gentle ? 76 : state.round === 0 ? 88 : state.round === 5 ? 116 : 96 };
}
function step(state: RainShadow, dt: number, input: RainInput): void {
  state.time += dt; state.total += dt;
  state.cooldown = Math.max(0, state.cooldown - dt);
  state.shield = Math.max(0, state.shield - dt);
  state.invulnerable = Math.max(0, state.invulnerable - dt);
  if (input.guard) guardRainShadow(state);
  let dx = input.x, dy = input.y;
  if (input.target) { dx = input.target.x - state.x; dy = input.target.y - state.y; }
  const length = Math.hypot(dx, dy);
  state.moving = length > .1;
  if (length) {
    state.direction = dy > 0 ? 0 : dy < 0 ? 3 : dx > 0 ? 2 : 1;
    const distance = (state.shield > 0 ? 62 : 108) * dt;
    const amount = input.target ? Math.min(distance, length) : distance;
    state.x += dx / length * amount; state.y += dy / length * amount;
  }
  state.x = Math.max(RAIN_FIELD.left + 4, Math.min(RAIN_FIELD.right - 4, state.x));
  state.y = Math.max(RAIN_FIELD.top + 4, Math.min(RAIN_FIELD.bottom - 4, state.y));
  const light = rainWindow(state);
  if (!state.collected) {
    if (state.time >= .7 && Math.hypot(state.x - light.x, state.y - light.y) <= 13) {
      state.collected = true; state.marks++; state.rainTime = 0;
    } else {
      if (state.time >= rainPickupSeconds(state)) {
        state.phase = 'lost'; state.result = '猫拨落的画稿还在地上。走到金色画稿处，就会自动捡起。';
      }
      return; // No rain, warning, or damage before picking up the drawing.
    }
  }
  state.rainTime += dt;
  // A short breath and then a separate, full survival timer after pickup.
  const beats = state.story ? STORY_RAIN_BEATS : state.round === 2 || state.round === 5 ? [.35, 1.9, 3.45, 4.8] : [.35, 2.5, 4.65];
  while (state.nextBand < beats.length && state.rainTime >= beats[state.nextBand]) {
    state.bands.push(makeBand(state, state.nextBand)); state.nextBand++;
  }
  for (const band of state.bands) band.age += dt;
  state.bands = state.bands.filter((band) => band.age < rainBandLifetime(band));
  if (state.story && state.nextCat < STORY_CAT_BEATS.length && state.rainTime >= STORY_CAT_BEATS[state.nextCat]) {
    // Lock the aim once. Never home in after the player has read the warning.
    // Leap across the rain's travel axis: sidestepping can stay inside its gap.
    const band = state.bands.find((b) => b.age < b.warning) ?? state.bands[state.bands.length - 1];
    const horizontal = !band || band.axis === 'y';
    const stage = rainStoryStage(state);
    state.cat = { fromX: horizontal ? state.x < 160 ? 30 : 290 : state.x,
      fromY: horizontal ? state.y : state.y < 108 ? 38 : 178,
      toX: state.x, toY: state.y, age: 0,
      warning: (state.gentle ? [1.5, 1.35, 1.25] : [1.15, 1, .9])[stage],
      speed: (state.gentle ? [120, 135, 145] : [155, 175, 190])[stage] };
    // At the boundary, give even a point-blank cat a readable 24px approach.
    if (Math.hypot(state.cat.toX - state.cat.fromX, state.cat.toY - state.cat.fromY) < 24) {
      if (horizontal) state.cat.fromX = state.x < 160 ? state.x + 24 : state.x - 24;
      else state.cat.fromY = state.y < 108 ? state.y + 24 : state.y - 24;
    }
    state.nextCat++;
  }
  if (state.cat) {
    state.cat.age += dt;
    if (state.cat.age >= state.cat.warning + rainCatDuration(state.cat) + .5) state.cat = null;
  }
  const catHit = !!state.cat && rainCatHits(state.cat, state.x, state.y);
  const rainHit = state.shield === 0 && state.bands.some((band) => rainBandHits(band, state.x, state.y));
  // Shared immunity prevents a rain+cat contact from charging twice in one beat.
  // Raising the drawing shields rain, not a cat: it must be sidestepped.
  if (state.invulnerable === 0 && (catHit || rainHit)) {
    state.health--; state.hits++; state.invulnerable = rainHitGrace(state);
    state.lastHit = catHit ? 'cat' : 'rain'; if (catHit) state.catHits++;
  }
  if (state.health <= 0) {
    state.phase = 'lost'; state.result = state.lastHit === 'cat'
      ? 'HP 0/3 · 猫扑中了。回檐下缓一缓，再看它伏身的扑向，侧移让开；护画不能挡猫。'
      : state.story ? 'HP 0/3 · 淋雨失手了。回檐下缓一缓，看准雨缝，再来一回。'
        : '雨点浸湿了纸角。看准预告的缺口，再来一回。'; return;
  }
  if (state.rainTime >= rainDuration(state)) {
    if (state.round === rainRoundCount(state) - 1) {
      state.phase = 'won'; state.result = `${state.story ? '画稿抢回了' : '六页画稿都拾回了'}。${state.hits === 0 ? '纸角完好' : '纸角略乱，画意还在'}。猫蹲在檐下，像是什么也没做。`; return;
    }
    state.round++; state.time = 0; state.rainTime = 0; state.collected = false; state.nextBand = 0;
    state.bands = []; state.invulnerable = .6;
    state.roundStart = { x: state.x, y: state.y, health: state.health, hits: state.hits };
  }
}
export function updateRainShadow(state: RainShadow, seconds: number, input: RainInput): void {
  if (state.phase !== 'running' || !Number.isFinite(seconds) || seconds <= 0) return;
  // Clamp background-tab delays and subdivide to prevent tunnelling at low FPS.
  let remaining = Math.min(.1, seconds);
  while (remaining > 0 && state.phase === 'running') {
    const dt = Math.min(1 / 120, remaining); step(state, dt, input); remaining -= dt;
  }
}
