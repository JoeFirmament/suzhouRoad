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
function rainCatDuration(cat2) {
  return Math.hypot(cat2.toX - cat2.fromX, cat2.toY - cat2.fromY) / cat2.speed;
}
function rainCatPosition(cat2) {
  const t = Math.max(0, Math.min(1, (cat2.age - cat2.warning) / rainCatDuration(cat2)));
  return { x: cat2.fromX + (cat2.toX - cat2.fromX) * t, y: cat2.fromY + (cat2.toY - cat2.fromY) * t };
}
function rainCatHits(cat2, x, y) {
  if (cat2.age < cat2.warning || cat2.age >= cat2.warning + rainCatDuration(cat2)) return false;
  const p = rainCatPosition(cat2);
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
function retryRainShadow(state, gentle = state.gentle) {
  if (state.phase !== "lost" && state.phase !== "ready") return state;
  const next = createRainShadow(gentle, state.story);
  next.round = state.round;
  next.marks = state.round;
  next.x = state.roundStart.x;
  next.y = state.roundStart.y;
  next.health = gentle === state.gentle ? state.roundStart.health : gentle ? rainHealthCapacity(next) : Math.min(rainHealthCapacity(next), state.roundStart.health);
  next.hits = state.roundStart.hits;
  next.total = Math.max(0, state.total - state.time);
  next.roundStart = { x: next.x, y: next.y, health: next.health, hits: next.hits };
  return next;
}
function startRainShadow(state) {
  if (state.phase === "ready") state.phase = "running";
}
function pauseRainShadow(state) {
  if (state.phase === "running") state.phase = "paused";
}
function guardRainShadow(state) {
  if (state.phase === "running" && state.cooldown === 0) {
    state.shield = 0.6;
    state.cooldown = 2;
  }
}
function bandPosition(band2) {
  return band2.from + band2.sign * Math.max(0, band2.age - band2.warning) * band2.speed;
}
function rainBandLifetime(band2) {
  if (band2.speed <= 0) return Infinity;
  const end = band2.axis === "y" ? band2.sign > 0 ? RAIN_FIELD.bottom + 16 : RAIN_FIELD.top - 16 : band2.sign > 0 ? RAIN_FIELD.right + 16 : RAIN_FIELD.left - 16;
  return band2.warning + Math.abs(end - band2.from) / band2.speed;
}
function rainBandHits(band2, x, y) {
  if (band2.age < band2.warning) return false;
  const along = band2.axis === "y" ? y : x;
  const across = band2.axis === "y" ? x : y;
  return Math.abs(along - bandPosition(band2)) <= 9 && Math.abs(across - band2.gap) > band2.opening / 2 - 3;
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
function step(state, dt, input2) {
  state.time += dt;
  state.total += dt;
  state.cooldown = Math.max(0, state.cooldown - dt);
  state.shield = Math.max(0, state.shield - dt);
  state.invulnerable = Math.max(0, state.invulnerable - dt);
  if (input2.guard) guardRainShadow(state);
  let dx = input2.x, dy = input2.y;
  if (input2.target) {
    dx = input2.target.x - state.x;
    dy = input2.target.y - state.y;
  }
  const length = Math.hypot(dx, dy);
  state.moving = length > 0.1;
  if (length) {
    state.direction = dy > 0 ? 0 : dy < 0 ? 3 : dx > 0 ? 2 : 1;
    const distance = (state.shield > 0 ? 62 : 108) * dt;
    const amount = input2.target ? Math.min(distance, length) : distance;
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
  for (const band2 of state.bands) band2.age += dt;
  state.bands = state.bands.filter((band2) => band2.age < rainBandLifetime(band2));
  if (state.story && state.nextCat < STORY_CAT_BEATS.length && state.rainTime >= STORY_CAT_BEATS[state.nextCat]) {
    const band2 = state.bands.find((b) => b.age < b.warning) ?? state.bands[state.bands.length - 1];
    const horizontal = !band2 || band2.axis === "y";
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
  const rainHit = state.shield === 0 && state.bands.some((band2) => rainBandHits(band2, state.x, state.y));
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
function updateRainShadow(state, seconds, input2) {
  if (state.phase !== "running" || !Number.isFinite(seconds) || seconds <= 0) return;
  let remaining = Math.min(0.1, seconds);
  while (remaining > 0 && state.phase === "running") {
    const dt = Math.min(1 / 120, remaining);
    step(state, dt, input2);
    remaining -= dt;
  }
}

// scripts/rain-shadow-test-input.ts
function rainTestInput(s) {
  const target = s.collected ? { x: s.x, y: s.y } : rainWindow(s);
  if (s.collected) for (const axis of ["x", "y"]) {
    const band2 = s.bands.find((b) => b.axis === axis && (b.age < b.warning || b.sign * (bandPosition(b) - (axis === "y" ? s.y : s.x)) <= 9));
    if (band2) {
      if (axis === "y") target.x = band2.gap;
      else target.y = band2.gap;
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

// scripts/verify-liuyuan-rain-shadow.ts
function assert(value, message) {
  if (!value) throw new Error(message);
}
var input = { x: 0, y: 0 };
var ready = createRainShadow();
updateRainShadow(ready, 1, input);
assert(ready.total === 0 && ready.health === 5, "\u672A\u4E3B\u52A8\u5F00\u59CB\u4E0D\u53EF\u53D7\u635F/\u8BA1\u65F6");
startRainShadow(ready);
updateRainShadow(ready, 0.1, { x: 1, y: 1 });
assert(Math.abs(Math.hypot(ready.x - 160, ready.y - 157) - 10.8) < 0.01, "\u659C\u5411\u4E0D\u80FD\u52A0\u901F");
pauseRainShadow(ready);
var before = JSON.stringify(ready);
updateRainShadow(ready, 100, { x: -1, y: 0 });
assert(JSON.stringify(ready) === before, "\u5207\u9875/\u6682\u505C\u987B\u51BB\u7ED3\u6574\u4E2A\u6A21\u62DF");
var idle = createRainShadow();
startRainShadow(idle);
for (let i = 0; i < 1200 && idle.phase === "running"; i++) updateRainShadow(idle, 0.016, input);
assert(idle.phase === "lost" && idle.marks === 0, "\u53EA\u7B49\u65F6\u95F4\u4E0D\u80FD\u6210\u529F");
var failedSecond = createRainShadow();
startRainShadow(failedSecond);
while (failedSecond.phase === "running" && failedSecond.round === 0)
  updateRainShadow(failedSecond, 0.016, { ...input, target: rainWindow(failedSecond) });
var savedRoundHealth = failedSecond.health;
while (failedSecond.phase === "running") updateRainShadow(failedSecond, 0.016, input);
var retry = retryRainShadow(failedSecond);
assert(retry.round === 1 && retry.marks === 1 && retry.health === savedRoundHealth && retry.time === 0 && retry.bands.length === 0 && retry.phase === "ready", "\u5931\u8D25\u53EA\u91CD\u8BD5\u5F53\u524D\u6298\uFF0C\u4FDD\u7559\u4E4B\u524D\u6210\u529F\u4E0E\u5F53\u6298\u8D77\u59CB\u7EB8\u7B3A");
var guard = createRainShadow();
startRainShadow(guard);
updateRainShadow(guard, 0.016, { ...input, guard: true });
assert(guard.shield > 0.59 && guard.cooldown > 1.99, "\u62A4\u7B3A\u6709\u77ED\u65F6\u7A97\u53E3\u548C\u56DE\u6C14");
for (let i = 0; i < 50; i++) updateRainShadow(guard, 0.016, { ...input, guard: true });
assert(guard.shield === 0 && guard.cooldown > 1, "\u957F\u6309\u4E0D\u5F97\u6C38\u8FDC\u65E0\u654C");
var drag = createRainShadow();
startRainShadow(drag);
updateRainShadow(drag, 0.016, { ...input, target: { x: 999, y: -999 } });
assert(Math.hypot(drag.x - 160, drag.y - 157) < 2, "\u62D6\u52A8\u4E0D\u80FD\u77AC\u79FB");
var band = { axis: "y", from: 20, sign: 1, gap: 78, opening: 62, age: 0.5, warning: 0.95, speed: 96 };
assert(!rainBandHits(band, 160, 20), "\u9884\u8B66\u9636\u6BB5\u4E0D\u80FD\u4F24\u5BB3");
band.age = 1.95;
assert(bandPosition(band) === 116 && !rainBandHits(band, 78, 116) && rainBandHits(band, 160, 116), "\u7F3A\u53E3\u5B89\u5168/\u96E8\u5E26\u78B0\u649E\u5206\u79BB");
function play(gentle, fps) {
  const s = createRainShadow(gentle);
  startRainShadow(s);
  for (let frame = 0; frame < fps * (RAIN_ROUND_COUNT * (RAIN_ROUND_SECONDS + rainPickupSeconds(s)) + 1) && s.phase === "running"; frame++) {
    updateRainShadow(s, 1 / fps, rainTestInput(s));
  }
  return s;
}
for (const gentle of [false, true]) for (const fps of [30, 60]) {
  const s = play(gentle, fps);
  assert(
    s.phase === "won" && s.marks === RAIN_ROUND_COUNT && s.total >= RAIN_ROUND_COUNT * RAIN_ROUND_SECONDS - 0.01,
    `\u8BFB\u9884\u8B66\u540E\u53EF\u8D70\u901A\u516D\u6298\uFF08gentle=${gentle},fps=${fps}\uFF09\uFF0C\u5B9E\u9645 ${JSON.stringify(s)}`
  );
  const end = JSON.stringify(s);
  updateRainShadow(s, 0.1, input);
  assert(end === JSON.stringify(s), "\u80DC\u8D1F\u7ED3\u675F\u540E\u6A21\u62DF\u4E0D\u5F97\u7EE7\u7EED\u53D7\u635F\u6216\u91CD\u590D\u6536\u5149");
}
var hit = createRainShadow();
startRainShadow(hit);
hit.collected = true;
hit.bands = [{ ...band, age: 0.96, from: 150, speed: 0, gap: 78 }];
hit.x = 160;
hit.y = 150;
updateRainShadow(hit, 0.016, input);
var hp = hit.health;
updateRainShadow(hit, 0.1, input);
assert(hit.health === hp && hp === 4, "\u63A5\u89E6\u540C\u4E00\u96E8\u5E26\u4E0D\u80FD\u9010\u5E27\u6263\u7EB8\u7B3A");
var patterns = Array.from({ length: RAIN_ROUND_COUNT }, (_, round) => {
  const s = createRainShadow();
  s.round = round;
  startRainShadow(s);
  while (!s.bands.length && s.phase === "running") updateRainShadow(s, 0.016, { ...input, target: rainWindow(s) });
  assert(s.bands.length > 0, "\u6361\u753B\u540E\u5FC5\u987B\u8FDB\u5165\u6709\u96E8\u7684\u9636\u6BB5");
  return s.bands[0];
});
assert(patterns[0].axis === "y" && patterns[3].axis === "y" && patterns[0].sign !== patterns[3].sign && patterns[0].gap !== patterns[3].gap, "\u7B2C\u56DB\u6298\u987B\u6539\u53D8\u7EB5\u96E8\u65B9\u5411\u4E0E\u7F3A\u53E3");
assert(
  patterns[1].axis === "x" && patterns[4].axis === "x" && patterns[1].sign !== patterns[4].sign,
  "\u7B2C\u4E94\u6298\u987B\u6539\u53D8\u4FA7\u98CE\u6765\u5411"
);
assert(patterns[0].warning > patterns[5].warning && patterns[0].opening > patterns[5].opening && patterns[0].speed < patterns[5].speed, "\u7B2C\u4E00\u6298\u7684\u6559\u5B66\u96E8\u52BF\u5E94\u5BBD\u7F13\u4E8E\u6700\u540E\u4E00\u6298");
console.log("\u7A7F\u5ECA\u501F\u5F71\uFF1A\u4E3B\u52A8\u5F00\u59CB\u3001\u659C\u5411\u901F\u5EA6\u3001\u9884\u8B66\u3001\u7F3A\u53E3\u3001\u62A4\u7B3A\u56DE\u6C14\u3001\u53D7\u635F\u4FDD\u62A4\u3001\u62D6\u52A8\u9650\u901F\u3001\u505C\u7559\u5931\u8D25\u3001\u6682\u505C\u3001\u4E24\u686330/60FPS\u516D\u6298\u80DC\u5229\u4E0E\u4E0D\u540C\u96E8\u52BF\u901A\u8FC7\u3002");
var pickup = createRainShadow();
startRainShadow(pickup);
for (let i = 0; i < 150; i++) updateRainShadow(pickup, 0.016, input);
assert(
  !pickup.collected && pickup.bands.length === 0 && pickup.rainTime === 0 && pickup.health === 5,
  "\u732B\u62E8\u753B\u540E\uFF0C\u6361\u753B\u524D\u4E0D\u80FD\u9884\u544A\u96E8\u3001\u8BA1\u907F\u96E8\u65F6\u95F4\u6216\u53D7\u635F"
);
while (!pickup.collected && pickup.phase === "running") updateRainShadow(pickup, 0.016, { ...input, target: rainWindow(pickup) });
assert(pickup.collected && pickup.rainTime < 0.02, "\u6361\u753B\u8981\u5F00\u59CB\u72EC\u7ACB\u907F\u96E8\u8BA1\u65F6");
for (let i = 0; i < 100; i++) updateRainShadow(pickup, 0.016, { ...input, target: rainWindow(pickup) });
assert(pickup.round === 0 && pickup.rainTime > 1.5 && pickup.bands.length > 0, "\u62D6\u5EF6\u6361\u753B\u4E0D\u5F97\u7F29\u77ED\u907F\u96E8\u9636\u6BB5");
var lateFailure = createRainShadow();
lateFailure.round = 5;
lateFailure.marks = 5;
lateFailure.health = 1;
lateFailure.roundStart.health = 1;
startRainShadow(lateFailure);
while (lateFailure.phase === "running") updateRainShadow(lateFailure, 0.016, input);
var lateRetry = retryRainShadow(lateFailure);
assert(
  lateRetry.round === 5 && lateRetry.marks === 5 && !lateRetry.collected && lateRetry.rainTime === 0,
  "\u672B\u6298\u6361\u753B\u5931\u8D25\u53EA\u91CD\u8BD5\u672B\u6298\uFF0C\u4E0D\u80FD\u63D0\u524D\u7ED3\u675F\u6216\u91CD\u8D70\u524D\u4E94\u6298"
);
console.log("\u732B\u62E8\u753B\u7A3F\uFF1A\u5148\u6361\u753B\u540E\u907F\u96E8\u3001\u62FE\u8D77\u540E\u5B8C\u6574\u8BA1\u65F6\u3001\u539F\u5730\u4E0D\u62FE\u5931\u8D25\u4E0E\u7B2C\u516D\u6298\u91CD\u8BD5\u901A\u8FC7\u3002");
for (const gentle of [false, true]) for (const fps of [30, 60]) {
  const story = createRainShadow(gentle, true);
  startRainShadow(story);
  const axes = /* @__PURE__ */ new Set();
  const stages = /* @__PURE__ */ new Set();
  const spawned = [];
  for (let frame = 0; frame < fps * 20 && story.phase === "running"; frame++) {
    const count = story.nextBand;
    updateRainShadow(story, 1 / fps, rainTestInput(story));
    for (const band2 of story.bands) axes.add(band2.axis);
    if (story.nextBand > count) spawned.push(story.bands[story.bands.length - 1]);
    if (story.collected) stages.add(rainStoryStage(story));
  }
  assert(
    story.phase === "won" && story.round === 0 && story.marks === 1 && story.rainTime >= rainDuration(story) && axes.size === 2 && stages.size === 3 && spawned.length === STORY_RAIN_WAVES.length && story.nextCat === STORY_CAT_BEATS.length,
    "\u82B1\u623F\u5355\u9875\u4E8B\u4EF6\uFF1A\u5B8C\u657418\u79D2\u3001\u4E09\u4E2A\u9012\u8FDB\u9636\u6BB5\u3001\u516B\u9635\u96E8\u3001\u4E00\u6B21\u6210\u529F"
  );
  assert(
    spawned[0].speed < spawned[2].speed && spawned[2].speed < spawned[4].speed && spawned[0].opening > spawned[2].opening && spawned[2].opening > spawned[4].opening && spawned[0].warning > spawned[2].warning && spawned[2].warning > spawned[4].warning,
    "\u4E09\u6BB5\u96BE\u5EA6\u7684\u901F\u5EA6\u3001\u96E8\u7F1D\u548C\u9884\u544A\u987B\u6E10\u8FDB\uFF0C\u7F13\u96E8\u6863\u4E5F\u4FDD\u7559\u6E10\u8FDB\u5173\u7CFB"
  );
  const failed = createRainShadow(gentle, true);
  startRainShadow(failed);
  while (failed.phase === "running") updateRainShadow(failed, 1 / fps, input);
  assert(retryRainShadow(failed).story, "\u6545\u4E8B\u4E8B\u4EF6\u91CD\u8BD5\u4E0D\u5F97\u9000\u56DE\u516D\u6298");
}
console.log("\u82B1\u623F\u73B0\u573A\u4E8B\u4EF6\uFF1A\u666E\u901A/\u7F13\u96E8\u300130/60FPS\u300118\u79D2\u5355\u9875\u3001\u4E09\u6BB5\u9012\u8FDB\u516B\u9635\u96E8\u53CA\u91CD\u8BD5\u6A21\u5F0F\u901A\u8FC7\u3002");
var unprotected = createRainShadow(false, true);
startRainShadow(unprotected);
while (!unprotected.collected && unprotected.phase === "running")
  updateRainShadow(unprotected, 0.016, { ...input, target: rainWindow(unprotected) });
while (unprotected.phase === "running")
  updateRainShadow(unprotected, 0.016, { ...input, target: { x: 160, y: 157 } });
assert(
  unprotected.phase === "lost" && unprotected.collected && unprotected.hits >= 3,
  "\u6361\u753B\u540E\u4E0D\u8BFB\u96E8\u7F1D\u3001\u4E0D\u62A4\u753B\u786E\u5B9E\u53EF\u80FD\u5931\u8D25\uFF0C\u4E0D\u80FD\u81EA\u52A8\u71AC\u8FC718\u79D2"
);
var parkedGuard = createRainShadow(false, true);
startRainShadow(parkedGuard);
while (!parkedGuard.collected && parkedGuard.phase === "running")
  updateRainShadow(parkedGuard, 0.016, { ...input, target: rainWindow(parkedGuard) });
while (parkedGuard.phase === "running") updateRainShadow(parkedGuard, 0.016, { ...input, guard: true });
assert(parkedGuard.phase === "lost", "\u666E\u901A\u6863\u7559\u5728\u62FE\u753B\u5904\u957F\u6309\u62A4\u753B\uFF0C\u4E0D\u5E94\u6210\u4E3A\u5FC5\u80DC\u89E3");
var slowSideRain = { ...band, axis: "x", sign: -1, from: 308, speed: 70, warning: 1.6 };
assert(
  rainBandLifetime(slowSideRain) > slowSideRain.warning + 3.7,
  "\u7F13\u96E8\u7684\u4FA7\u96E8\u5FC5\u987B\u8D70\u8FC7\u5168\u573A\uFF0C\u4E0D\u80FD\u5728\u8FDC\u7AEF\u63D0\u524D\u6D88\u5931"
);
console.log("\u96BE\u5EA6\u53CD\u4F8B\uFF1A\u62FE\u753B\u5904\u957F\u6309\u62A4\u753B\u4ECD\u5931\u8D25\u3001\u7F13\u96E8\u4FA7\u96E8\u5B8C\u6574\u8986\u76D6\u3001\u65E7\u516D\u6298\u517C\u5BB9\u901A\u8FC7\u3002");
var cat = { fromX: 30, fromY: 128, toX: 130, toY: 128, age: 0, warning: 1, speed: 200 };
assert(!rainCatHits(cat, 30, 128), "\u4F0F\u8EAB\u9884\u8B66\u4E0D\u6263\u7EB8\u89D2");
cat.age = 1.25;
assert(
  rainCatPosition(cat).x === 80 && rainCatHits(cat, 80, 128) && !rainCatHits(cat, 80, 150),
  "\u732B\u6251\u4F4D\u7F6E\u5BF9\u5E948px\u78B0\u649E\uFF0C22px\u4FA7\u79FB\u53EF\u8BA9\u5F00"
);
cat.age = 1 + rainCatDuration(cat);
assert(!rainCatHits(cat, 130, 128), "\u843D\u5730\u7406\u722A\u4E0D\u80FD\u7EE7\u7EED\u63A5\u89E6\u6263\u8840");
var contact = createRainShadow(false, true);
startRainShadow(contact);
contact.collected = true;
contact.x = 80;
contact.y = 128;
contact.shield = 0.6;
contact.cat = { ...cat, age: 1.24 };
updateRainShadow(contact, 0.016, input);
assert(contact.health === 2 && contact.catHits === 1 && contact.lastHit === "cat", "\u62A4\u753B\u6321\u96E8\u4E0D\u6321\u732B\uFF0C\u732B\u53EA\u8E6D\u7EB8\u89D2");
var contactHP = contact.health;
updateRainShadow(contact, 0.1, input);
assert(contact.health === contactHP, "\u732B\u6251\u8FDE\u7EED\u63A5\u89E6\u4E0D\u80FD\u9010\u5E27\u6263\u8840");
pauseRainShadow(contact);
var contactSnapshot = JSON.stringify(contact);
updateRainShadow(contact, 1, input);
assert(JSON.stringify(contact) === contactSnapshot, "\u6682\u505C\u51BB\u7ED3\u732B\u7684\u76EE\u6807\u3001\u9884\u544A\u3001\u6251\u8FD1\u4E0E\u96E8");
var simultaneous = createRainShadow(false, true);
startRainShadow(simultaneous);
simultaneous.collected = true;
simultaneous.x = 80;
simultaneous.y = 128;
simultaneous.cat = { ...cat, age: 1.24 };
simultaneous.bands = [{ axis: "y", from: 128, sign: 1, gap: 230, opening: 50, age: 1, warning: 0.9, speed: 0 }];
updateRainShadow(simultaneous, 0.016, input);
assert(simultaneous.health === 2 && simultaneous.hits === 1, "\u96E8\u732B\u540C\u5E27\u4E0D\u80FD\u53CC\u6263");
var locked = createRainShadow(false, true);
startRainShadow(locked);
locked.collected = true;
locked.rainTime = 2.39;
updateRainShadow(locked, 0.016, input);
assert(locked.cat, "\u9996\u6B21\u732B\u6251\u5FC5\u987B\u53D1\u751F");
var aim = [locked.cat.toX, locked.cat.toY];
updateRainShadow(locked, 0.1, { x: 1, y: 0 });
assert(locked.cat.toX === aim[0] && locked.cat.toY === aim[1], "\u732B\u4E0D\u80FD\u5728\u9884\u544A\u540E\u91CD\u65B0\u8FFD\u8E2A\u6216\u4E34\u65F6\u8F6C\u5F2F");
assert(
  retryRainShadow({ ...contact, phase: "lost" }).cat === null && retryRainShadow({ ...contact, phase: "lost" }).nextCat === 0,
  "\u91CD\u8BD5\u6E05\u7A7A\u732B\u4E0E\u5DF2\u751F\u6210\u6B21\u6570"
);
console.log("\u732B\u6251\uFF1A\u4E94\u6B21\u65F6\u5E8F\u3001\u4E24\u686330/60FPS\u53EF\u8FC7\u3001\u9501\u5B9A\u4E0D\u8FFD\u8E2A\u3001\u4FA7\u79FB\u3001\u9884\u544A/\u843D\u5730\u65E0\u4F24\u3001\u62A4\u753B\u8FB9\u754C\u3001\u5171\u4EAB\u514D\u4F24\u3001\u6682\u505C\u53CA\u91CD\u8BD5\u901A\u8FC7\u3002");
for (const gentle of [false, true]) {
  const hpGame = createRainShadow(gentle, true);
  startRainShadow(hpGame);
  hpGame.collected = true;
  hpGame.x = 78;
  hpGame.y = 128;
  assert(
    hpGame.health === 3 && rainHealthCapacity(hpGame) === 3 && rainHitGrace(hpGame) === 0.6,
    "\u666E\u901A\u3001\u7F13\u96E8\u90FD\u56FA\u5B9A3HP\u548C0.6\u79D2\u53D7\u51FB\u4FDD\u62A4"
  );
  for (let hitIndex = 0; hitIndex < 3; hitIndex++) {
    if (hitIndex === 1) hpGame.cat = { fromX: 58, fromY: 128, toX: 98, toY: 128, age: 1.09, warning: 1, speed: 200 };
    else hpGame.bands = [{ axis: "y", from: 128, sign: 1, gap: 230, opening: 50, age: 1, warning: 0.9, speed: 0 }];
    updateRainShadow(hpGame, 0.016, input);
    assert(
      hpGame.health === 2 - hitIndex && hpGame.hits === hitIndex + 1,
      "\u96E8\u2192\u732B\u2192\u96E8\uFF0C\u6BCF\u6B21\u6070\u597D\u62631HP\uFF0C3\u21922\u21921\u21920"
    );
    hpGame.bands = [];
    hpGame.cat = null;
    if (hitIndex < 2) {
      assert(hpGame.phase === "running", "1HP\u65F6\u4ECD\u53EF\u64CD\u4F5C\uFF0C\u4E0D\u80FD\u63D0\u524D\u5931\u8D25");
      while (hpGame.invulnerable > 0) updateRainShadow(hpGame, 0.016, input);
    }
  }
  assert(
    hpGame.phase === "lost" && hpGame.health === 0 && hpGame.result.includes("HP 0/3"),
    "\u7B2C\u4E09\u6B21\u6709\u6548\u53D7\u51FB\u5931\u8D25\uFF0CHP\u4E0D\u80FD\u4E3A\u8D1F\uFF0C\u53CD\u9988\u660E\u786E"
  );
  const ended = JSON.stringify(hpGame);
  updateRainShadow(hpGame, 0.1, input);
  assert(JSON.stringify(hpGame) === ended, "0HP\u7ED3\u675F\u540E\u4E0D\u80FD\u7EE7\u7EED\u6263\u8840");
  assert(
    retryRainShadow(hpGame).health === 3 && retryRainShadow(hpGame, !gentle).health === 3,
    "\u91CD\u8BD5/\u5207\u6362\u7F13\u96E8\u4E0D\u80FD\u989D\u5916\u52A0\u8840"
  );
}
console.log("3HP\u9A8C\u6536\uFF1A\u4E24\u6863\u90FD3HP\uFF0C\u96E8/\u732B/\u96E8\u5206\u522B\u62631\uFF0C1HP\u53EF\u64CD\u4F5C\u30010HP\u5931\u8D25\u3001\u7ED3\u675F\u51BB\u7ED3\u3001\u91CD\u8BD5\u4E0E\u5207\u6863\u56DE\u6EE13\u901A\u8FC7\u3002");
