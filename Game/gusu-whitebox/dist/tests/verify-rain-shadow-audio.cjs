"use strict";

// src/core/liuyuan-rain-shadow.ts
var RAIN_FIELD = { width: 320, height: 208, left: 24, right: 296, top: 32, bottom: 184 };
var RAIN_ROUND_SECONDS = 7;
var RAIN_ROUND_NAMES = [
  "\u4E00\u6298 \xB7 \u732B\u62E8\u753B\u7A3F",
  "\u4E8C\u6298 \xB7 \u96E8\u4ECE\u4FA7\u6765",
  "\u4E09\u6298 \xB7 \u56DE\u8EAB\u6709\u8DEF",
  "\u56DB\u6298 \xB7 \u96E8\u4ECE\u540E\u81F3",
  "\u4E94\u6298 \xB7 \u4FA7\u96E8\u6362\u5411",
  "\u516D\u6298 \xB7 \u7A7F\u8FC7\u659C\u96E8"
];
var RAIN_ROUND_COUNT = RAIN_ROUND_NAMES.length;
var STORY_RAIN_STAGES = [
  { start: 0, name: "\u8FA8\u96E8", tip: "\u5148\u770B\u7AD6\u5411\u96E8\u7F1D\uFF0C\u4E0B\u4E00\u9635\u4EAE\u5904\u4F1A\u6362\u8FB9\u3002" },
  { start: 5.5, name: "\u6362\u5411", tip: "\u96E8\u4ECE\u4FA7\u9762\u6765\u4E86\uFF0C\u6539\u770B\u96E8\u7F1D\u7684\u9AD8\u4F4E\u3002" },
  { start: 10.75, name: "\u4EA4\u96E8", tip: "\u7EB5\u6A2A\u96E8\u52BF\u4EA4\u9519\uFF0C\u5148\u987E\u5C06\u8FD1\u7684\u4E00\u9635\uFF0C\u7D27\u5904\u518D\u62A4\u753B\u3002" }
];
var STORY_RAIN_WAVES = [
  { at: 0.45, axis: "y", gap: 78, stage: 0 },
  { at: 3, axis: "y", gap: 220, stage: 0 },
  { at: 5.5, axis: "x", gap: 76, stage: 1 },
  { at: 8.1, axis: "x", gap: 146, stage: 1 },
  { at: 10.75, axis: "y", gap: 104, stage: 2 },
  { at: 12.45, axis: "x", gap: 64, stage: 2 },
  { at: 14, axis: "y", gap: 236, stage: 2 },
  { at: 15.4, axis: "x", gap: 144, stage: 2 }
];
var STORY_RAIN_BEATS = STORY_RAIN_WAVES.map((wave) => wave.at);
var STORY_CAT_BEATS = [2.4, 6.65, 9.45, 12.8, 15.9];
function rainCatDuration(cat) {
  return Math.hypot(cat.toX - cat.fromX, cat.toY - cat.fromY) / cat.speed;
}
function rainCatPosition(cat) {
  const t = Math.max(0, Math.min(1, (cat.age - cat.warning) / rainCatDuration(cat)));
  return { x: cat.fromX + (cat.toX - cat.fromX) * t, y: cat.fromY + (cat.toY - cat.fromY) * t };
}
function rainCatHits(cat, x, y) {
  if (cat.age < cat.warning || cat.age >= cat.warning + rainCatDuration(cat)) return false;
  const p = rainCatPosition(cat);
  return Math.hypot(x - p.x, y - p.y) <= 8;
}
function rainStoryStage(s) {
  return s.rainTime >= STORY_RAIN_STAGES[2].start ? 2 : s.rainTime >= STORY_RAIN_STAGES[1].start ? 1 : 0;
}
var WINDOWS = [
  { x: 78, y: 128 },
  { x: 239, y: 76 },
  { x: 105, y: 65 },
  { x: 236, y: 140 },
  { x: 92, y: 105 },
  { x: 218, y: 64 }
];
function rainWindow(state) {
  return WINDOWS[Math.max(0, Math.min(RAIN_ROUND_COUNT - 1, state.round))];
}
function rainPickupSeconds(state) {
  return state.gentle ? 6 : 4;
}
var rainDuration = (state) => state.story ? 18 : RAIN_ROUND_SECONDS;
var rainRoundCount = (state) => state.story ? 1 : RAIN_ROUND_COUNT;
var rainHealthCapacity = (state) => state.story ? 3 : state.gentle ? 7 : 5;
var rainHitGrace = (state) => state.story ? 0.6 : 0.85;
function createRainShadow(gentle = false, story = false) {
  const health = rainHealthCapacity({ story, gentle });
  return {
    story,
    phase: "ready",
    round: 0,
    time: 0,
    rainTime: 0,
    total: 0,
    health,
    x: 160,
    y: 157,
    collected: false,
    marks: 0,
    hits: 0,
    shield: 0,
    cooldown: 0,
    invulnerable: 0,
    nextBand: 0,
    bands: [],
    cat: null,
    nextCat: 0,
    catHits: 0,
    lastHit: "",
    gentle,
    result: "",
    direction: 0,
    moving: false,
    roundStart: { x: 160, y: 157, health, hits: 0 }
  };
}
function startRainShadow(state) {
  if (state.phase === "ready") state.phase = "running";
}
function guardRainShadow(state) {
  if (state.phase === "running" && state.cooldown === 0) {
    state.shield = 0.6;
    state.cooldown = 2;
  }
}
function bandPosition(band) {
  return band.from + band.sign * Math.max(0, band.age - band.warning) * band.speed;
}
function rainBandLifetime(band) {
  if (band.speed <= 0) return Infinity;
  const end = band.axis === "y" ? band.sign > 0 ? RAIN_FIELD.bottom + 16 : RAIN_FIELD.top - 16 : band.sign > 0 ? RAIN_FIELD.right + 16 : RAIN_FIELD.left - 16;
  return band.warning + Math.abs(end - band.from) / band.speed;
}
function rainBandHits(band, x, y) {
  if (band.age < band.warning) return false;
  const along = band.axis === "y" ? y : x;
  const across = band.axis === "y" ? x : y;
  return Math.abs(along - bandPosition(band)) <= 9 && Math.abs(across - band.gap) > band.opening / 2 - 3;
}
function makeBand(state, index) {
  if (state.story) {
    const wave = STORY_RAIN_WAVES[index];
    const { axis: axis2, gap: gap2, stage } = wave;
    const sign2 = index % 2 ? -1 : 1;
    return {
      axis: axis2,
      sign: sign2,
      from: axis2 === "y" ? sign2 > 0 ? 20 : 196 : sign2 > 0 ? 12 : 308,
      gap: gap2,
      age: 0,
      opening: (state.gentle ? [104, 88, 72] : [84, 66, 50])[stage],
      warning: (state.gentle ? [1.6, 1.35, 1.2] : [1.35, 1.1, 0.95])[stage],
      speed: (state.gentle ? [70, 84, 96] : [82, 100, 116])[stage]
    };
  }
  const axis = state.round === 0 || state.round === 3 ? "y" : state.round === 1 || state.round === 4 ? "x" : index % 2 ? "x" : "y";
  const sign = (index % 2 ? -1 : 1) * (state.round >= 3 ? -1 : 1);
  const shift = state.round >= 3 ? 1 : 0;
  const gap = axis === "y" ? [78, 239, 105, 220][(index + shift) % 4] : [128, 76, 145, 65][(index + shift) % 4];
  return {
    axis,
    sign,
    from: axis === "y" ? sign > 0 ? 20 : 196 : sign > 0 ? 12 : 308,
    gap,
    opening: state.gentle ? 76 : state.round === 0 ? 70 : state.round === 5 ? 48 : 62,
    warning: state.gentle || state.round === 0 ? 1.25 : 0.95,
    age: 0,
    speed: state.gentle ? 76 : state.round === 0 ? 88 : state.round === 5 ? 116 : 96
  };
}
function step(state, dt, input) {
  state.time += dt;
  state.total += dt;
  state.cooldown = Math.max(0, state.cooldown - dt);
  state.shield = Math.max(0, state.shield - dt);
  state.invulnerable = Math.max(0, state.invulnerable - dt);
  if (input.guard) guardRainShadow(state);
  let dx = input.x, dy = input.y;
  if (input.target) {
    dx = input.target.x - state.x;
    dy = input.target.y - state.y;
  }
  const length = Math.hypot(dx, dy);
  state.moving = length > 0.1;
  if (length) {
    state.direction = dy > 0 ? 0 : dy < 0 ? 3 : dx > 0 ? 2 : 1;
    const distance = (state.shield > 0 ? 62 : 108) * dt;
    const amount = input.target ? Math.min(distance, length) : distance;
    state.x += dx / length * amount;
    state.y += dy / length * amount;
  }
  state.x = Math.max(RAIN_FIELD.left + 4, Math.min(RAIN_FIELD.right - 4, state.x));
  state.y = Math.max(RAIN_FIELD.top + 4, Math.min(RAIN_FIELD.bottom - 4, state.y));
  const light = rainWindow(state);
  if (!state.collected) {
    if (state.time >= 0.7 && Math.hypot(state.x - light.x, state.y - light.y) <= 13) {
      state.collected = true;
      state.marks++;
      state.rainTime = 0;
    } else {
      if (state.time >= rainPickupSeconds(state)) {
        state.phase = "lost";
        state.result = "\u732B\u62E8\u843D\u7684\u753B\u7A3F\u8FD8\u5728\u5730\u4E0A\u3002\u8D70\u5230\u91D1\u8272\u753B\u7A3F\u5904\uFF0C\u5C31\u4F1A\u81EA\u52A8\u6361\u8D77\u3002";
      }
      return;
    }
  }
  state.rainTime += dt;
  const beats = state.story ? STORY_RAIN_BEATS : state.round === 2 || state.round === 5 ? [0.35, 1.9, 3.45, 4.8] : [0.35, 2.5, 4.65];
  while (state.nextBand < beats.length && state.rainTime >= beats[state.nextBand]) {
    state.bands.push(makeBand(state, state.nextBand));
    state.nextBand++;
  }
  for (const band of state.bands) band.age += dt;
  state.bands = state.bands.filter((band) => band.age < rainBandLifetime(band));
  if (state.story && state.nextCat < STORY_CAT_BEATS.length && state.rainTime >= STORY_CAT_BEATS[state.nextCat]) {
    const band = state.bands.find((b) => b.age < b.warning) ?? state.bands[state.bands.length - 1];
    const horizontal = !band || band.axis === "y";
    const stage = rainStoryStage(state);
    state.cat = {
      fromX: horizontal ? state.x < 160 ? 30 : 290 : state.x,
      fromY: horizontal ? state.y : state.y < 108 ? 38 : 178,
      toX: state.x,
      toY: state.y,
      age: 0,
      warning: (state.gentle ? [1.5, 1.35, 1.25] : [1.15, 1, 0.9])[stage],
      speed: (state.gentle ? [120, 135, 145] : [155, 175, 190])[stage]
    };
    if (Math.hypot(state.cat.toX - state.cat.fromX, state.cat.toY - state.cat.fromY) < 24) {
      if (horizontal) state.cat.fromX = state.x < 160 ? state.x + 24 : state.x - 24;
      else state.cat.fromY = state.y < 108 ? state.y + 24 : state.y - 24;
    }
    state.nextCat++;
  }
  if (state.cat) {
    state.cat.age += dt;
    if (state.cat.age >= state.cat.warning + rainCatDuration(state.cat) + 0.5) state.cat = null;
  }
  const catHit = !!state.cat && rainCatHits(state.cat, state.x, state.y);
  const rainHit = state.shield === 0 && state.bands.some((band) => rainBandHits(band, state.x, state.y));
  if (state.invulnerable === 0 && (catHit || rainHit)) {
    state.health--;
    state.hits++;
    state.invulnerable = rainHitGrace(state);
    state.lastHit = catHit ? "cat" : "rain";
    if (catHit) state.catHits++;
  }
  if (state.health <= 0) {
    state.phase = "lost";
    state.result = state.lastHit === "cat" ? "HP 0/3 \xB7 \u732B\u6251\u4E2D\u4E86\u3002\u56DE\u6A90\u4E0B\u7F13\u4E00\u7F13\uFF0C\u518D\u770B\u5B83\u4F0F\u8EAB\u7684\u6251\u5411\uFF0C\u4FA7\u79FB\u8BA9\u5F00\uFF1B\u62A4\u753B\u4E0D\u80FD\u6321\u732B\u3002" : state.story ? "HP 0/3 \xB7 \u6DCB\u96E8\u5931\u624B\u4E86\u3002\u56DE\u6A90\u4E0B\u7F13\u4E00\u7F13\uFF0C\u770B\u51C6\u96E8\u7F1D\uFF0C\u518D\u6765\u4E00\u56DE\u3002" : "\u96E8\u70B9\u6D78\u6E7F\u4E86\u7EB8\u89D2\u3002\u770B\u51C6\u9884\u544A\u7684\u7F3A\u53E3\uFF0C\u518D\u6765\u4E00\u56DE\u3002";
    return;
  }
  if (state.rainTime >= rainDuration(state)) {
    if (state.round === rainRoundCount(state) - 1) {
      state.phase = "won";
      state.result = `${state.story ? "\u753B\u7A3F\u62A2\u56DE\u4E86" : "\u516D\u9875\u753B\u7A3F\u90FD\u62FE\u56DE\u4E86"}\u3002${state.hits === 0 ? "\u7EB8\u89D2\u5B8C\u597D" : "\u7EB8\u89D2\u7565\u4E71\uFF0C\u753B\u610F\u8FD8\u5728"}\u3002\u732B\u8E72\u5728\u6A90\u4E0B\uFF0C\u50CF\u662F\u4EC0\u4E48\u4E5F\u6CA1\u505A\u3002`;
      return;
    }
    state.round++;
    state.time = 0;
    state.rainTime = 0;
    state.collected = false;
    state.nextBand = 0;
    state.bands = [];
    state.invulnerable = 0.6;
    state.roundStart = { x: state.x, y: state.y, health: state.health, hits: state.hits };
  }
}
function updateRainShadow(state, seconds, input) {
  if (state.phase !== "running" || !Number.isFinite(seconds) || seconds <= 0) return;
  let remaining = Math.min(0.1, seconds);
  while (remaining > 0 && state.phase === "running") {
    const dt = Math.min(1 / 120, remaining);
    step(state, dt, input);
    remaining -= dt;
  }
}

// src/audio/rain-shadow-audio.ts
function rainAudioFrame(s) {
  return {
    phase: s.phase,
    marks: s.marks,
    hits: s.hits,
    lastHit: s.lastHit,
    band: s.nextBand,
    cat: s.nextCat,
    catPhase: !s.cat ? "none" : s.cat.age < s.cat.warning ? "aim" : s.cat.age < s.cat.warning + rainCatDuration(s.cat) ? "leap" : "land",
    guard: s.shield > 0
  };
}
function rainAudioEvents(before, after) {
  if (before.phase !== "running") return [];
  if (after.phase === "lost") return ["lose"];
  if (after.phase === "won") return ["win"];
  if (after.phase !== "running") return [];
  if (after.hits > before.hits) return [after.lastHit === "cat" ? "hit-cat" : "hit-rain"];
  const cues = [];
  if (after.marks > before.marks) cues.push("pickup");
  if (after.cat > before.cat && after.catPhase === "aim") cues.push("cat-ready");
  if (after.cat === before.cat && before.catPhase === "aim" && after.catPhase === "leap") cues.push("cat-leap");
  if (after.cat === before.cat && before.catPhase === "leap" && after.catPhase === "land") cues.push("cat-land");
  if (after.guard && !before.guard) cues.push("guard");
  if (after.band > before.band && !cues.length) cues.push("rain");
  return cues;
}
var NOTES = {
  pickup: [[0, 660, 760, 0.09, "sine"], [0.08, 880, 880, 0.13, "sine"]],
  rain: [[0, 420, 230, 0.08, "sine"]],
  "cat-ready": [[0, 540, 690, 0.09, "sine"], [0.085, 690, 480, 0.1, "sine"]],
  "cat-leap": [[0, 170, 100, 0.1, "triangle"]],
  "cat-land": [[0, 440, 380, 0.08, "sine"]],
  "hit-rain": [[0, 280, 160, 0.13, "triangle"]],
  "hit-cat": [[0, 155, 110, 0.15, "triangle"]],
  guard: [[0, 350, 510, 0.1, "sine"]],
  win: [[0, 440, 440, 0.14, "sine"], [0.12, 550, 550, 0.14, "sine"], [0.24, 660, 660, 0.18, "sine"]],
  lose: [[0, 240, 180, 0.2, "sine"]]
};
function createRainAudio(factory = () => {
  const Ctor = window.AudioContext ?? window.webkitAudioContext;
  return Ctor ? new Ctor() : void 0;
}) {
  let ctx, enabled = false, generation = 0;
  const voices = /* @__PURE__ */ new Set();
  function stopVoices() {
    for (const voice of [...voices]) {
      try {
        voice.osc.stop();
      } catch {
      }
      voice.release();
    }
  }
  function pause() {
    generation++;
    enabled = false;
    stopVoices();
    try {
      void ctx?.suspend().catch(() => {
      });
    } catch {
    }
  }
  async function enable(on) {
    if (!on) {
      pause();
      return false;
    }
    const request = ++generation;
    enabled = true;
    try {
      ctx ??= factory();
      if (!ctx) {
        enabled = false;
        return false;
      }
      await ctx.resume();
      if (request !== generation) {
        if (!enabled) {
          try {
            await ctx.suspend();
          } catch {
          }
        }
        return false;
      }
      enabled = ctx.state === "running";
      return enabled;
    } catch {
      if (request === generation) {
        enabled = false;
        stopVoices();
      }
      return false;
    }
  }
  function play(cue) {
    if (!enabled || !ctx || ctx.state !== "running") return;
    try {
      const now = ctx.currentTime;
      for (const [delay, start, end, duration, type] of NOTES[cue]) {
        if (voices.size >= 10) {
          const first = voices.values().next().value;
          try {
            first.osc.stop();
          } catch {
          }
          first.release();
        }
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        const t = now + delay;
        osc.type = type;
        osc.frequency.setValueAtTime(start, t);
        osc.frequency.linearRampToValueAtTime(end, t + duration);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(cue === "rain" ? 9e-3 : 0.025, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(1e-4, t + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        const voice = { osc, gain, release: () => {
          osc.disconnect();
          gain.disconnect();
          voices.delete(voice);
        } };
        voices.add(voice);
        osc.onended = voice.release;
        osc.start(t);
        osc.stop(t + duration + 0.025);
      }
    } catch {
      pause();
    }
  }
  return { enable, play, pause };
}

// scripts/rain-shadow-test-input.ts
function rainTestInput(s) {
  const target = s.collected ? { x: s.x, y: s.y } : rainWindow(s);
  if (s.collected) for (const axis of ["x", "y"]) {
    const band = s.bands.find((b) => b.axis === axis && (b.age < b.warning || b.sign * (bandPosition(b) - (axis === "y" ? s.y : s.x)) <= 9));
    if (band) {
      if (axis === "y") target.x = band.gap;
      else target.y = band.gap;
    }
  }
  if (s.cat && s.cat.age < s.cat.warning + rainCatDuration(s.cat)) {
    if (s.cat.fromX !== s.cat.toX) target.y = s.cat.toY + (s.cat.toY > 108 ? -22 : 22);
    else target.x = s.cat.toX + (s.cat.toX > 160 ? -22 : 22);
  }
  return {
    x: 0,
    y: 0,
    target,
    guard: s.bands.some((b) => b.age >= b.warning && rainBandHits(b, s.x, s.y))
  };
}

// scripts/verify-rain-shadow-audio.ts
function assert(v, message) {
  if (!v) throw new Error(message);
}
for (const gentle of [false, true]) for (const fps of [30, 60]) {
  const s = createRainShadow(gentle, true);
  startRainShadow(s);
  const counts = /* @__PURE__ */ new Map();
  for (let i = 0; i < fps * 22 && s.phase === "running"; i++) {
    const before = rainAudioFrame(s);
    updateRainShadow(s, 1 / fps, rainTestInput(s));
    const snapshot = JSON.stringify(s), after = rainAudioFrame(s), cues = rainAudioEvents(before, after);
    for (const cue of cues) counts.set(cue, (counts.get(cue) ?? 0) + 1);
    assert(snapshot === JSON.stringify(s), "\u58F0\u97F3\u89C2\u5BDF\u5668\u4E0D\u5F97\u6539\u8BA1\u65F6\u3001HP\u3001\u8F93\u5165\u6216\u5224\u5B9A");
    assert(!rainAudioEvents(after, after).length, "\u540C\u4E00\u5E27\u4E0D\u80FD\u91CD\u590D\u53D1\u58F0");
  }
  assert(
    s.phase === "won" && counts.get("pickup") === 1 && counts.get("win") === 1 && counts.get("cat-ready") === 5 && counts.get("cat-leap") === 5,
    "\u4E24\u686330/60FPS\u53EA\u62FE\u753B\u4E00\u6B21\u3001\u9884\u544A/\u6251\u51FA\u5404\u4E94\u6B21\u3001\u80DC\u5229\u4E00\u6B21"
  );
}
var paused = createRainShadow(false, true);
paused.phase = "paused";
assert(!rainAudioEvents(rainAudioFrame(paused), rainAudioFrame(paused)).length, "\u6682\u505C\u4E0D\u80FD\u53D1\u4E8B\u4EF6\u58F0\u97F3");
var Param = class {
  constructor() {
    this.values = [];
  }
  setValueAtTime(v) {
    this.values.push(v);
  }
  linearRampToValueAtTime(v) {
    this.values.push(v);
  }
  exponentialRampToValueAtTime(v) {
    this.values.push(v);
  }
};
var Osc = class {
  constructor() {
    this.frequency = new Param();
    this.type = "sine";
    this.onended = null;
    this.active = false;
    this.disconnected = false;
  }
  connect() {
  }
  disconnect() {
    this.disconnected = true;
  }
  start() {
    this.active = true;
  }
  stop(when) {
    if (when === void 0) {
      this.active = false;
      this.onended?.();
    }
  }
};
var Gain = class {
  constructor() {
    this.gain = new Param();
  }
  connect() {
  }
  disconnect() {
  }
};
var Context = class {
  constructor() {
    this.state = "suspended";
    this.currentTime = 0;
    this.destination = {};
    this.oscillators = [];
    this.gains = [];
  }
  async resume() {
    this.state = "running";
  }
  async suspend() {
    this.state = "suspended";
  }
  createOscillator() {
    const o = new Osc();
    this.oscillators.push(o);
    return o;
  }
  createGain() {
    const g = new Gain();
    this.gains.push(g);
    return g;
  }
};
async function main() {
  let created = 0;
  const ctx = new Context();
  const audio = createRainAudio(() => {
    created++;
    return ctx;
  });
  audio.play("pickup");
  assert(created === 0, "\u9ED8\u8BA4\u9759\u97F3\uFF0C\u4E0D\u5F97\u81EA\u52A8\u521B\u5EFA\u97F3\u9891\u4E0A\u4E0B\u6587");
  assert(await audio.enable(true), "\u7528\u6237\u5F00\u542F\u540E\u624D\u5141\u8BB8\u64AD\u653E");
  audio.play("pickup");
  assert(ctx.oscillators.filter((o) => o.active).length === 2, "\u62FE\u753B\u5E94\u6709\u4E24\u6BB5\u77ED\u97F3");
  for (let i = 0; i < 30; i++) {
    audio.play(i % 2 ? "cat-ready" : "rain");
    assert(ctx.oscillators.filter((o) => o.active).length <= 10, "\u58F0\u97F3\u91CD\u53E0\u987B\u6709\u4E0A\u9650");
  }
  assert(ctx.gains.every((g) => g.gain.values.every((v) => v <= 0.025)), "\u63D0\u793A\u97F3\u91CF\u987B\u514B\u5236\uFF0C\u4E0D\u653E\u5927\u5230\u6EE1\u5E45");
  audio.pause();
  assert(ctx.state === "suspended" && ctx.oscillators.every((o) => !o.active), "\u6682\u505C\u5373\u505C\u6240\u6709\u5DF2\u8C03\u5EA6\u58F0\u97F3\u5E76\u6302\u8D77\u4E0A\u4E0B\u6587");
  const total = ctx.oscillators.length;
  audio.play("win");
  assert(ctx.oscillators.length === total, "\u6682\u505C\u4E0D\u80FD\u7EE7\u7EED\u51FA\u58F0");
  assert(await audio.enable(true), "\u7528\u6237\u7EE7\u7EED\u53EF\u91CD\u65B0\u89E3\u9501");
  audio.play("win");
  await audio.enable(false);
  assert(ctx.oscillators.every((o) => !o.active), "\u5173\u95ED\u97F3\u6548\u987B\u505C\u6B62\u6210\u529F\u5C3E\u97F3");
  audio.play("rain");
  assert(ctx.oscillators.every((o) => !o.active), "\u5173\u95ED\u540E\u4E0D\u5F97\u5077\u5077\u91CD\u5F00\u58F0\u97F3");
  const unavailable = createRainAudio(() => void 0);
  assert(!await unavailable.enable(true), "\u4E0D\u652F\u6301\u97F3\u9891\u65F6\u5B89\u5168\u964D\u7EA7");
  unavailable.play("pickup");
  const blocked = createRainAudio(() => ({ ...ctx, resume: async () => {
    throw Error("blocked");
  } }));
  assert(!await blocked.enable(true), "\u6D4F\u89C8\u5668\u62D2\u7EDD\u64AD\u653E\u987B\u5B89\u5168\u964D\u7EA7");
  const raceCtx = new Context();
  let release = () => {
  };
  raceCtx.resume = () => new Promise((resolve) => {
    release = () => {
      raceCtx.state = "running";
      resolve();
    };
  });
  const race = createRainAudio(() => raceCtx);
  const pending = race.enable(true);
  await race.enable(false);
  release();
  await pending;
  race.play("pickup");
  assert(
    raceCtx.state === "suspended" && !raceCtx.oscillators.length,
    "\u5F00\u58F0\u97F3\u5C1A\u672A\u89E3\u9501\u5C31\u5173\u95ED\uFF0C\u65E7Promise\u4E0D\u80FD\u8BA9\u58F0\u97F3\u590D\u6D3B"
  );
  console.log("\u8F7B\u97F3\u6548\uFF1A\u4E8B\u4EF6\u53EA\u8BFB/\u53BB\u91CD\u3001\u4E24\u686330/60FPS\u3001\u9ED8\u8BA4\u9759\u97F3/\u624B\u52BF\u5F00\u542F\u3001\u4F4E\u97F3\u91CF/\u58F0\u90E8\u4E0A\u9650\u3001\u6682\u505C/\u5173\u95ED\u5373\u65F6\u505C\u58F0\u3001\u4E0D\u53EF\u7528\u964D\u7EA7\u548C\u5F02\u6B65\u5F00\u5173\u7ADE\u6001\u901A\u8FC7\u3002");
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
