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
function rainSecondsLeft(state) {
  return Math.max(0, Math.ceil(state.collected ? rainDuration(state) - state.rainTime : rainPickupSeconds(state) - state.time));
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
function pauseRainShadow(state) {
  if (state.phase === "running") state.phase = "paused";
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

// src/render/scholar-sprite.ts
var SCHOLAR_FRAMES = [
  [
    { sx: 159, sy: 25, sw: 164, sh: 341 },
    { sx: 457, sy: 25, sw: 165, sh: 348 },
    { sx: 757, sy: 25, sw: 164, sh: 348 }
  ],
  [
    { sx: 159, sy: 375, sw: 175, sh: 345 },
    { sx: 450, sy: 375, sw: 180, sh: 340 },
    { sx: 754, sy: 375, sw: 174, sh: 345 }
  ],
  [
    { sx: 147, sy: 722, sw: 177, sh: 345 },
    { sx: 451, sy: 722, sw: 188, sh: 345 },
    { sx: 750, sy: 722, sw: 183, sh: 345 }
  ],
  [
    { sx: 157, sy: 1069, sw: 175, sh: 337 },
    { sx: 454, sy: 1069, sw: 176, sh: 341 },
    { sx: 749, sy: 1069, sw: 179, sh: 343 }
  ]
];
function scholarFrame(direction, phase) {
  return SCHOLAR_FRAMES[Math.max(0, Math.min(3, Math.floor(direction)))][Math.max(0, Math.min(2, Math.floor(phase)))];
}
function drawScholarAtFoot(ctx2, sprite, direction, phase, footX, footY, height) {
  drawSpriteFrameAtFoot(ctx2, sprite, scholarFrame(direction, phase), footX, footY, height);
}
function drawSpriteFrameAtFoot(ctx2, sprite, frame, footX, footY, height) {
  const drawnHeight = Math.round(height);
  const drawnWidth = Math.round(drawnHeight * frame.sw / frame.sh);
  ctx2.drawImage(
    sprite,
    frame.sx,
    frame.sy,
    frame.sw,
    frame.sh,
    Math.round(footX) - Math.floor(drawnWidth / 2),
    Math.round(footY) - drawnHeight,
    drawnWidth,
    drawnHeight
  );
}

// src/render/rain-shadow-vignettes.ts
function rainCatShadowMarks(cat) {
  const distance = Math.hypot(cat.toX - cat.fromX, cat.toY - cat.fromY);
  const count = Math.max(1, Math.min(3, Math.ceil(distance / 28)));
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 1) / count;
    return { x: cat.fromX + (cat.toX - cat.fromX) * t, y: cat.fromY + (cat.toY - cat.fromY) * t, t };
  });
}
function drawRainCatPounceHint(ctx2, cat, quiet = false) {
  if (cat.age >= cat.warning) return;
  const dx = Math.sign(cat.toX - cat.fromX), dy = Math.sign(cat.toY - cat.fromY);
  const progress = quiet ? 0.75 : Math.min(1, cat.age / cat.warning);
  const pieces = [
    [-5, -2, 10, 5],
    [4, -3, 5, 5],
    [4, -5, 2, 2],
    [7, -5, 2, 2],
    [7, 2, 5, 2],
    [3, 4, 4, 1],
    [-6, 3, 3, 2],
    [-10, -2, 4, 2],
    [-10, -5, 2, 3]
  ];
  for (const mark of rainCatShadowMarks(cat)) {
    ctx2.fillStyle = mark.t === 1 ? progress > 0.8 ? "#968a75" : "#a69c86" : mark.t <= progress ? "#b4ac98" : "#c5c0b1";
    for (const [u, v, w, h] of pieces) for (let a = 0; a < w; a++) for (let b = 0; b < h; b++) {
      const x = Math.round(mark.x + dx * (u + a) - dy * (v + b));
      const y = Math.round(mark.y + dy * (u + a) + dx * (v + b));
      if (x >= RAIN_FIELD.left && x < RAIN_FIELD.right && y >= RAIN_FIELD.top && y < RAIN_FIELD.bottom)
        ctx2.fillRect(x, y, 1, 1);
    }
  }
}
var RAIN_DRAWING_NAMES = ["\u5170\u53F6", "\u7AF9\u679D", "\u6885\u68A2", "\u53E0\u77F3", "\u8549\u53F6", "\u8377\u53F6"];
var SKETCHES = [
  [[8, 19, 9, 9], [9, 9, 5, 4], [5, 4, 2, 8], [9, 19, 13, 5], [13, 5, 17, 3], [10, 19, 18, 10], [18, 10, 21, 12], [9, 17, 3, 11]],
  [[7, 20, 8, 2], [7, 8, 17, 6], [8, 12, 3, 9], [8, 16, 18, 14], [12, 7, 11, 3], [14, 7, 18, 3], [15, 14, 20, 11], [5, 10, 2, 5]],
  [[3, 19, 8, 14], [8, 14, 11, 8], [11, 8, 17, 5], [17, 5, 21, 3], [11, 8, 9, 3], [8, 14, 17, 13], [17, 13, 20, 9]],
  [
    [2, 18, 4, 12],
    [4, 12, 8, 9],
    [8, 9, 11, 15],
    [11, 15, 9, 19],
    [2, 18, 9, 19],
    [9, 19, 18, 18],
    [18, 18, 21, 10],
    [21, 10, 17, 8],
    [17, 8, 14, 12],
    [14, 12, 12, 5],
    [12, 5, 8, 3],
    [8, 3, 5, 10],
    [9, 6, 10, 10],
    [16, 13, 18, 11]
  ],
  [
    [10, 20, 11, 7],
    [11, 7, 8, 3],
    [8, 3, 3, 5],
    [3, 5, 6, 10],
    [6, 10, 11, 7],
    [11, 7, 17, 2],
    [17, 2, 21, 6],
    [21, 6, 16, 10],
    [16, 10, 11, 7],
    [11, 11, 17, 12],
    [17, 12, 20, 16],
    [20, 16, 13, 15],
    [13, 15, 11, 11]
  ],
  [
    [6, 20, 8, 10],
    [8, 10, 4, 7],
    [4, 7, 2, 11],
    [2, 11, 6, 14],
    [6, 14, 12, 12],
    [12, 12, 14, 8],
    [14, 8, 8, 7],
    [15, 20, 17, 9],
    [17, 9, 15, 5],
    [15, 5, 19, 2],
    [19, 2, 22, 6],
    [22, 6, 17, 9],
    [3, 19, 10, 18]
  ]
];
function rainAlbumState(s) {
  return {
    complete: s.phase === "won" ? rainRoundCount(s) : s.round,
    held: s.collected && s.phase !== "won" ? s.round : null
  };
}
function drawRainSketch(ctx2, index, x, y, w, h) {
  if (index === 0) {
    const clusters = [
      ["#536655", [[70, 72, 4, 12], [66, 62, 4, 12], [62, 52, 4, 12], [54, 42, 8, 4], [44, 36, 10, 4], [32, 34, 12, 3]]],
      ["#334e43", [[74, 64, 3, 20], [77, 50, 3, 16], [80, 38, 3, 14], [83, 28, 3, 12], [86, 20, 3, 10]]],
      ["#6e7e5f", [[76, 76, 5, 8], [81, 64, 4, 12], [85, 56, 4, 10], [89, 48, 6, 8], [95, 44, 12, 4], [107, 46, 10, 3]]],
      ["#738269", [[67, 78, 3, 6], [62, 72, 5, 4], [55, 68, 7, 3], [44, 67, 11, 2], [34, 70, 10, 2]]],
      ["#536655", [[92, 68, 2, 16], [94, 57, 2, 12], [96, 48, 2, 11], [97, 43, 3, 6]]],
      ["#aa8266", [[94, 38, 4, 8], [98, 40, 8, 3], [91, 44, 6, 3], [98, 45, 3, 6]]],
      ["#a5624b", [[121, 75, 8, 2], [121, 79, 8, 2], [121, 83, 8, 2], [120, 73, 2, 14], [129, 73, 2, 14]]]
    ];
    for (const [color, points] of clusters) {
      ctx2.fillStyle = color;
      for (const [px, py, pw, ph] of points) ctx2.fillRect(
        Math.round(x + px * w / 160),
        Math.round(y + py * h / 104),
        Math.max(1, Math.round(pw * w / 160)),
        Math.max(1, Math.round(ph * h / 104))
      );
    }
    return;
  }
  ctx2.fillStyle = "#637267";
  for (const [ax, ay, bx, by] of SKETCHES[index % SKETCHES.length]) {
    const length = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let i = 0; i <= length; i++) {
      const t = length ? i / length : 0;
      ctx2.fillRect(
        Math.round(x + (ax + (bx - ax) * t) * w / 24),
        Math.round(y + (ay + (by - ay) * t) * h / 22),
        1,
        1
      );
    }
  }
  if (index === 2) {
    ctx2.fillStyle = "#aa877e";
    for (const [px, py] of [[9, 3], [17, 5], [20, 9]]) ctx2.fillRect(Math.round(x + px * w / 24), Math.round(y + py * h / 22), 2, 2);
  }
  ctx2.fillStyle = "#a7745e";
  ctx2.fillRect(Math.round(x + w - 3), Math.round(y + h - 3), 2, 2);
}
function drawRainAlbum(ctx2, s, quiet = false) {
  ctx2.imageSmoothingEnabled = false;
  ctx2.fillStyle = "#e5e1d5";
  ctx2.fillRect(0, 0, 320, 43);
  const { complete, held } = rainAlbumState(s);
  if (s.story) {
    ctx2.fillStyle = "#bdb69e";
    ctx2.fillRect(6, 4, 55, 36);
    ctx2.fillStyle = "#f1e9d7";
    ctx2.fillRect(5, 2, 55, 36);
    ctx2.fillStyle = "#f8eed9";
    ctx2.fillRect(6, 3, 53, 1);
    drawRainSketch(ctx2, 0, 6, 3, 52, 33);
    ctx2.fillStyle = "#53675b";
    ctx2.font = "10px monospace";
    ctx2.fillText(complete ? "\u5170\u7A3F\u62A4\u597D\u4E86 \xB7 \u7B49\u4F60\u6536\u597D" : held !== null ? "\u5170\u7A3F\u5728\u624B\u4E2D \xB7 \u6B63\u5728\u62A4\u753B" : "\u82B1\u5320\u7684\u5170\u7A3F \xB7 \u5148\u628A\u7EB8\u9875\u62FE\u8D77", 70, 16);
    ctx2.font = "8px monospace";
    ctx2.fillText(complete ? "\u732B\u8E72\u56DE\u6A90\u4E0B\uFF0C\u50CF\u4EC0\u4E48\u4E5F\u6CA1\u505A\u3002" : s.cat ? s.cat.age < s.cat.warning ? "\u732B\u4F0F\u8EAB\uFF01\u4FA7\u79FB\u8BA9\u5F00\uFF0C\u62A4\u753B\u4E0D\u6321\u732B\u3002" : s.cat.age < s.cat.warning + rainCatDuration(s.cat) ? "\u732B\u6251\u6765\u4E86\uFF01\u8BA9\u5F00\u521A\u624D\u7684\u732B\u5F71\u3002" : Math.hypot(s.x - s.cat.toX, s.y - s.cat.toY) > 16 ? "\u732B\u6B6A\u5934\uFF1A\u54A6\uFF1F\u2026\u2026\u8FD8\u5F97\u770B\u96E8\u7F1D\u3002" : "\u732B\u843D\u56DE\u77F3\u5730\uFF0C\u8FD8\u5F97\u770B\u96E8\u7F1D\u3002" : "\u62FE\u753B \u2192 \u907F\u96E8\u3001\u8BA9\u732B \u2192 \u6536\u597D", 70, 31);
    drawRainCat(ctx2, 302, 35, -1, complete && !quiet ? "groom" : "sit", quiet ? 0 : s.total);
    return;
  }
  for (let i = 0; i < rainRoundCount(s); i++) {
    const x = 5 + i * 53, arrived = i < complete, inHand = i === held;
    ctx2.fillStyle = arrived || inHand ? "#f1e9d7" : "#d7d8cb";
    ctx2.fillRect(x, 2, 45, 27);
    ctx2.fillStyle = inHand ? "#b19962" : arrived ? "#6f8771" : "#b7bdae";
    ctx2.fillRect(x, 2, 45, 1);
    ctx2.fillRect(x, 28, 45, 1);
    if (arrived || inHand || i === s.round) drawRainSketch(ctx2, i, x + 6, 4, 31, 23);
    else {
      ctx2.fillStyle = "#bdc4b5";
      ctx2.fillRect(x + 18, 12, 8, 1);
    }
    if (arrived) {
      ctx2.fillStyle = "#799078";
      ctx2.fillRect(x + 37, 4, 5, 5);
      ctx2.fillStyle = "#eee9d9";
      ctx2.fillRect(x + 38, 6, 1, 1);
      ctx2.fillRect(x + 39, 5, 2, 1);
    }
    ctx2.font = "8px monospace";
    ctx2.fillStyle = "#53675b";
    ctx2.fillText(`${RAIN_DRAWING_NAMES[i]}${inHand ? "\xB7\u624B\u4E2D" : arrived ? "\xB7\u5165\u518C" : "\xB7\u5F85\u62FE"}`, x + 1, 39);
  }
}
function drawRainCat(ctx2, x, y, facing, pose, time) {
  const pixel = (dx, dy, w, h, color) => {
    ctx2.fillStyle = color;
    ctx2.fillRect(
      Math.round(x + (dx + (pose === "look" && dy < -8 ? 1 : 0)) * facing - (facing < 0 ? w : 0)),
      Math.round(y + dy + ((pose === "crouch" || pose === "pounce") && dy < -8 ? 4 : pose === "look" && dy < -8 ? 1 : 0)),
      w,
      h
    );
  };
  const gait = pose === "walk" ? Math.floor(time * 12) % 2 * 2 : 0;
  const blink = Math.floor(time * 2) % 9 === 8;
  pixel(-8, 0, 16, 2, "#87917c");
  pixel(-7, -8, 15, 8, "#52584a");
  pixel(-5, -10, 11, 2, "#52584a");
  pixel(-1, -16, 11, 8, "#52584a");
  pixel(1, -18, 7, 2, "#52584a");
  pixel(-6, -9, 13, 8, "#b8aa8b");
  pixel(-5, -8, 4, 5, "#69715c");
  pixel(-5, -10, 10, 1, "#e2d5b9");
  pixel(-3, -6, 6, 4, "#ded0b2");
  pixel(-3, -8, 1, 2, "#777e6d");
  pixel(0, -8, 1, 2, "#8b8b7a");
  pixel(-4, -2, 3, 3, "#ddd1b6");
  pixel(3, -2 - gait, 3, 3, "#ddd1b6");
  pixel(0, -16, 9, 8, "#ddd1b6");
  pixel(0, -19, 3, 4, "#8b8b7a");
  pixel(7, -19, 2, 4, "#8b8b7a");
  pixel(1, -17, 1, 2, "#be9986");
  pixel(7, -17, 1, 2, "#be9986");
  pixel(2, -15, 5, 1, "#efe2c4");
  pixel(4, -15, 1, 2, "#9b9c86");
  pixel(2, -13, blink ? 2 : 1, 1, "#43584a");
  pixel(6, -13, blink ? 2 : 1, 1, "#43584a");
  pixel(4, -11, 1, 1, "#a57968");
  pixel(8, -10, 3, 1, "#9e9b83");
  pixel(3, -10, 3, 1, "#f0e2c5");
  pixel(-2, -10, 3, 1, "#9e9b83");
  if (pose === "paw") {
    pixel(6, -6, 7, 2, "#ddd1b6");
    pixel(12, -6, 1, 2, "#818775");
  }
  if (pose === "groom") {
    pixel(6, -10, 2, 3, "#ddd1b6");
    pixel(4, -9, 2, 1, "#af8f80");
  }
  if (pose === "pounce") {
    pixel(5, -3, 9, 2, "#ddd1b6");
    pixel(-9, -3, 5, 2, "#ddd1b6");
  }
  pixel(-9, -8, 3, 6, "#8b8b7a");
  pixel(-11, -12 + Math.floor(time * 5) % 2, 3, 6, "#8b8b7a");
}

// src/render/rain-shadow-ink.ts
var RAIN_INK = {
  ink: "#87998f",
  tail: "#b4c2b8",
  pale: "#fffdf3"
};
function rainInkCells(b, quiet = false) {
  if (b.age < b.warning) return [];
  const isY = b.axis === "y", p = bandPosition(b);
  const alongMin = isY ? RAIN_FIELD.top : RAIN_FIELD.left, alongMax = isY ? RAIN_FIELD.bottom : RAIN_FIELD.right;
  const acrossMin = isY ? RAIN_FIELD.left : RAIN_FIELD.top, acrossMax = isY ? RAIN_FIELD.right : RAIN_FIELD.bottom;
  const lo = Math.max(alongMin, Math.ceil(p - 9 - 0.5));
  const hi = Math.min(alongMax - 1, Math.floor(p + 9 - 0.5));
  const phase = quiet ? 0 : Math.floor(Math.max(0, b.age - b.warning) * 5);
  const cells = [];
  for (let a = lo; a <= hi; a++) for (let n = acrossMin; n < acrossMax; n++) {
    if (Math.abs(n + 0.5 - b.gap) <= b.opening / 2 - 3) continue;
    const d = a + 0.5 - p;
    const group = Math.floor(n / 13), local = (n + group * 3) % 13;
    const bend = Math.floor(d * (group % 3 === 0 ? 0.4 : 0.8));
    const stroke = (local + bend + phase + group * 7 % 11 + 26) % 13;
    const pivot = group % 5 - 2, length = 7 + group * 7 % 8;
    const head = Math.abs(d - pivot) < 2;
    const width = head ? 3 + group % 2 : 1;
    const strong = stroke <= width && Math.abs(d - pivot) < length / 2 && (n * 3 + Math.floor(d) * 5 + group + 130) % 17 !== 0;
    const glint = stroke === 6 && Math.abs(d) < 2 && group % 5 === 1;
    if (!strong && !glint) continue;
    cells.push({
      x: isY ? n : a,
      y: isY ? a : n,
      color: glint || head && stroke > 0 && stroke < width ? RAIN_INK.pale : head ? RAIN_INK.ink : RAIN_INK.tail
    });
  }
  return cells;
}
function drawRainGapHint(ctx2, b) {
  const isY = b.axis === "y", preview = b.age < b.warning;
  const p = preview ? isY ? b.sign > 0 ? RAIN_FIELD.top + 4 : RAIN_FIELD.bottom - 5 : b.sign > 0 ? RAIN_FIELD.left + 4 : RAIN_FIELD.right - 5 : bandPosition(b);
  const alongMin = isY ? RAIN_FIELD.top : RAIN_FIELD.left, alongMax = isY ? RAIN_FIELD.bottom : RAIN_FIELD.right;
  if (p < alongMin || p >= alongMax) return;
  for (const side of [-1, 1]) {
    const across = b.gap + side * (b.opening / 2 - 5);
    for (let i = -2; i <= 2; i++) {
      const n = across - side * Math.abs(i), a = p + i;
      const x = Math.round(isY ? n : a), y = Math.round(isY ? a : n);
      if (x >= RAIN_FIELD.left && x < RAIN_FIELD.right && y >= RAIN_FIELD.top && y < RAIN_FIELD.bottom) {
        ctx2.fillStyle = "#48755f";
        ctx2.fillRect(x, y, 1, 1);
      }
    }
  }
  const cx = isY ? b.gap : p, cy = isY ? p : b.gap;
  const dot = (dx, dy, color) => {
    const x = Math.round(cx + dx), y = Math.round(cy + dy);
    if (x >= RAIN_FIELD.left && x < RAIN_FIELD.right && y >= RAIN_FIELD.top && y < RAIN_FIELD.bottom) {
      ctx2.fillStyle = color;
      ctx2.fillRect(x, y, 1, 1);
    }
  };
  for (let dy = -6; dy <= 0; dy++) {
    const width = [1, 3, 5, 6, 7, 8, 7][dy + 6];
    for (let dx = -width; dx <= width; dx++) dot(
      dx,
      dy,
      Math.abs(dx) === width || dy === 0 ? "#65775d" : (dx + dy) % 4 === 0 ? "#d4c49e" : "#ede1bd"
    );
  }
  for (let dy = -5; dy <= 5; dy++) dot(0, dy, dy < 0 ? "#b5a27e" : "#75674f");
  dot(1, 5, "#75674f");
  dot(2, 4, "#75674f");
}
function drawRainInkBand(ctx2, b, quiet = false) {
  for (const cell of rainInkCells(b, quiet)) {
    ctx2.fillStyle = cell.color;
    ctx2.fillRect(cell.x, cell.y, 1, 1);
  }
}
function drawRainInkMargins(ctx2, time, quiet = false) {
  const dot = (x, y, color) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= 320 || y < 32 || y >= RAIN_FIELD.bottom || x >= RAIN_FIELD.left && x < RAIN_FIELD.right) return;
    ctx2.fillStyle = color;
    ctx2.fillRect(x, y, 1, 1);
  };
  const bend = quiet ? 0 : Math.round(Math.sin(time * 0.65));
  const branch = (x, y, dx, length, color) => {
    for (let i = 0; i < length; i++) dot(x + i * dx, y + Math.floor(i * 0.55), color);
  };
  const leaf = (x, y, dx, dy, length, color) => {
    for (let i = 0; i < length; i++) {
      const py = y + i * dy + Math.floor(i / 4) * bend;
      dot(x + i * dx, py, color);
      if (i > 1 && i < length - 2) dot(x + i * dx, py + 1, color);
    }
  };
  for (const [x, y, dx, size] of [[1, 45, 1, 13], [318, 72, -1, 14], [3, 138, 1, 10]]) {
    branch(x, y, dx, size, "#9ca89b");
    for (let j = 0; j < 3; j++) leaf(x + dx * (j * 4 + 2), y + j * 2, dx, 1, 7 - j, "#a6b1a1");
  }
  branch(-4, 61, 1, 25, "#66776a");
  branch(324, 147, -1, 29, "#5b6d63");
  for (const [x, y, dx, dy, size] of [
    [2, 64, 1, 1, 12],
    [8, 70, -1, 1, 11],
    [14, 75, 1, 1, 9],
    [4, 86, 1, 0, 12],
    [12, 83, -1, 1, 14],
    [317, 151, -1, 1, 13],
    [309, 155, 1, 1, 10],
    [304, 159, -1, 1, 11],
    [319, 166, -1, 0, 10],
    [312, 168, 1, 1, 12]
  ]) leaf(x, y, dx, dy, size, "#56695f");
}

// src/render/liuyuan-rain-shadow.ts
var RAIN_BACKGROUND_OPACITY = 0.4;
var RAIN_BAMBOO_DEPTH = 152;
function drawRainShadow(ctx2, s, scholar2, quiet = false, backdrop, foreground) {
  ctx2.imageSmoothingEnabled = false;
  ctx2.globalAlpha = 1;
  const rect = (x, y, w, h, color) => {
    ctx2.fillStyle = color;
    ctx2.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const entities = [];
  rect(0, 0, 320, 208, "#f0eee3");
  const artReady = !!backdrop?.complete && backdrop.naturalWidth > 0 && backdrop.naturalHeight > 0;
  if (artReady) {
    ctx2.globalAlpha = RAIN_BACKGROUND_OPACITY;
    ctx2.drawImage(backdrop, 0, 0, 320, 208);
    ctx2.globalAlpha = 1;
  } else {
    drawRainInkMargins(ctx2, s.total, quiet);
    for (let x = 24; x < 296; x += 52) for (let y = 64; y < 184; y += 40) {
      rect(x, y, 19 + (x + y) % 9, 1, "#cbd0c2");
      rect(x + 7, y + 2, 9, 1, "#d6dacc");
    }
  }
  const stage = rainStoryStage(s);
  if (!artReady) {
    ctx2.fillStyle = "#465b50";
    ctx2.font = "10px monospace";
    ctx2.fillText(s.story ? "\u96E8\u4E2D\u62A2\u753B" : RAIN_ROUND_NAMES[s.round], 12, 15);
    ctx2.fillText(s.phase === "won" ? "\u5DF2\u62A4\u597D" : s.collected ? s.story ? `${stage + 1}/3 ${STORY_RAIN_STAGES[stage].name}` : "\u62A4\u753B\u907F\u96E8" : "\u5148\u6361\u753B\u7A3F", 172, 15);
    ctx2.fillText(`${s.marks}/${rainRoundCount(s)}`, 280, 15);
  }
  const light = rainWindow(s);
  if (!s.collected || s.rainTime < 1.2) {
    if (!s.collected) {
      const progress = Math.min(1, s.time / 0.7);
      const fall = s.phase === "ready" || quiet ? 0 : -24 * (1 - progress * progress);
      const sway = s.phase === "running" && !quiet && s.time < 0.7 ? Math.round(Math.sin(progress * Math.PI * 2) * 2) : 0;
      rect(light.x - 9, light.y + 7, 20, 2, "#a9ac99");
      rect(light.x - 10 + sway, light.y - 7 + fall, 20, 14, "#f2e7c9");
      rect(light.x - 9 + sway, light.y - 6 + fall, 18, 1, "#fbf0d5");
      rect(light.x - 9 + sway, light.y + 5 + fall, 18, 1, "#d2c3a0");
      rect(light.x - 11 + sway, light.y - 8 + fall, 2, 16, "#a28b63");
      rect(light.x + 9 + sway, light.y - 8 + fall, 2, 16, "#a28b63");
      drawRainSketch(ctx2, s.round, light.x - 9 + sway, light.y - 6 + fall, 18, 12);
      if (!quiet && s.phase === "running" && s.time >= 0.7 && s.time < 1) {
        const spread = 13 + (s.time - 0.7) * 20;
        rect(light.x - spread, light.y + 8, 3, 1, "#aa9b78");
        rect(light.x + spread, light.y + 8, 3, 1, "#aa9b78");
      }
    }
    ctx2.fillStyle = s.collected ? "#536a50" : "#795b2d";
    ctx2.font = "9px monospace";
    ctx2.fillText(s.collected ? "\u5DF2\u6361" : "\u6361\u753B", light.x - 9, light.y + 23);
  }
  if (!s.cat || s.phase === "won") {
    const side = light.x > 160 ? 1 : -1;
    const t = s.collected ? quiet ? 1 : Math.min(1, s.rainTime / 1.2) : 0;
    const start = light.x + side * 23;
    const cx = start + ((side > 0 ? 306 : 14) - start) * t;
    const cy = light.y + 1 + (168 - light.y - 1) * t;
    const pose = t > 0 && t < 1 ? "walk" : t === 1 && Math.floor(s.total) % 4 === 2 ? "groom" : !s.collected && s.phase === "running" && s.time < 0.35 ? "paw" : "sit";
    entities.push({ depth: cy, paint: () => {
      drawRainCat(ctx2, cx, cy, t > 0 && t < 1 ? side : -side, quiet ? "sit" : pose, quiet ? 0 : s.total);
      if (s.phase === "ready" || !s.collected && s.time >= 0.7 && s.time < 1.5) {
        rect(cx - 11, cy - 33, 23, 11, "#eee8d9");
        ctx2.fillStyle = "#596d5c";
        ctx2.font = "8px monospace";
        ctx2.fillText("\u55B5\uFF1F", cx - 7, cy - 25);
      }
    } });
  }
  if (s.cat && s.phase !== "won") drawRainCatPounceHint(ctx2, s.cat, quiet);
  for (const b of s.phase === "won" ? [] : s.bands) {
    if (b.age < b.warning) {
      drawRainGapHint(ctx2, b);
      const isY = b.axis === "y";
      ctx2.fillStyle = "#586c63";
      ctx2.font = "12px monospace";
      ctx2.fillText(isY ? b.sign > 0 ? "\u2193" : "\u2191" : b.sign > 0 ? "\u2192" : "\u2190", isY ? 155 : b.sign > 0 ? 8 : 301, isY ? b.sign > 0 ? 30 : 199 : 108);
      continue;
    }
    drawRainInkBand(ctx2, b, quiet);
    drawRainGapHint(ctx2, b);
  }
  if (s.cat && s.phase !== "won") {
    const cat = s.cat, p = rainCatPosition(cat), warning = cat.age < cat.warning;
    const active = cat.age < cat.warning + rainCatDuration(cat);
    const horizontal = cat.fromX !== cat.toX;
    const facing = horizontal ? Math.sign(cat.toX - cat.fromX) : cat.fromX < 160 ? 1 : -1;
    entities.push({ depth: p.y + 6, paint: () => {
      if (!warning && active && !quiet) {
        const sign = horizontal ? Math.sign(cat.toX - cat.fromX) : Math.sign(cat.toY - cat.fromY);
        for (let i = 1; i <= 3; i++) rect(p.x - (horizontal ? sign * i * 7 : 0), p.y - (horizontal ? 0 : sign * i * 7), 3, 1, "#b6ad94");
      }
      const puzzled = !active && Math.hypot(s.x - p.x, s.y - p.y) > 16;
      drawRainCat(ctx2, p.x, p.y + 6, facing, warning ? "crouch" : active ? "pounce" : puzzled && !quiet ? "look" : "groom", quiet ? 0 : s.total);
      if (puzzled && !quiet) {
        ctx2.fillStyle = "#6f7462";
        ctx2.font = "8px monospace";
        ctx2.fillText("\u54A6\uFF1F", Math.max(25, Math.min(273, p.x - 7)), Math.max(44, p.y - 19));
      }
      if (active && !warning) rect(p.x - 3, p.y - 2, 6, 4, "#a88961");
    } });
  }
  if (s.collected && s.rainTime < 0.65 && !quiet) {
    const t = Math.min(1, s.rainTime / 0.4);
    const px = light.x + (s.x - light.x) * t, py = light.y + (s.y - 18 - light.y) * t;
    rect(px - 4, py - 3, 8, 6, "#efe3c4");
    ctx2.fillStyle = "#6e795e";
    ctx2.font = "9px monospace";
    ctx2.fillText(s.story ? "\u62FE\u8D77\u5170\u7A3F" : `\u62FE\u8D77${RAIN_DRAWING_NAMES[s.round]}`, Math.max(25, Math.min(246, s.x - 20)), Math.max(43, s.y - 25 - s.rainTime * 8));
  }
  entities.push({ depth: s.y + 6, paint: () => {
    if (!(s.phase === "running" && s.invulnerable > 0 && Math.floor(s.total * 14) % 2)) {
      rect(s.x - 6, s.y + 5, 12, 2, "#899783");
      if (scholar2?.complete && scholar2.naturalWidth) {
        ctx2.save();
        ctx2.shadowBlur = 0;
        ctx2.shadowColor = "#344d42";
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          ctx2.shadowOffsetX = dx;
          ctx2.shadowOffsetY = dy;
          drawScholarAtFoot(ctx2, scholar2, s.direction, s.moving ? 1 + Math.floor(s.total * 7) % 2 : 0, s.x, s.y + 6, 22);
        }
        ctx2.restore();
        drawScholarAtFoot(ctx2, scholar2, s.direction, s.moving ? 1 + Math.floor(s.total * 7) % 2 : 0, s.x, s.y + 6, 22);
      } else {
        rect(s.x - 3, s.y - 10, 6, 4, "#40564d");
        rect(s.x - 2, s.y - 6, 4, 3, "#d8c3a2");
        rect(s.x - 5, s.y - 3, 10, 9, "#4e7167");
      }
      if (s.collected) {
        rect(s.x + 4, s.y - 7, 5, 7, "#ebdfc2");
        rect(s.x + 4, s.y - 5, 3, 1, "#7d8771");
        rect(s.x + 4, s.y - 7, 5, 1, "#fbefce");
        rect(s.x + 8, s.y - 6, 1, 6, "#b5a47e");
        rect(s.x + 5, s.y - 1, 3, 1, "#c4b390");
      }
      rect(s.x - 3, s.y - 3, 6, 6, "#344d42");
      rect(s.x - 2, s.y - 2, 4, 4, "#f4ecce");
      const ux = s.x + (s.shield > 0 ? 0 : 8), uy = s.y - 22;
      for (let dy = 0; dy < 5; dy++) {
        const w = [3, 6, 9, 11, 10][dy];
        rect(ux - w, uy + dy, w * 2 + 1, 1, dy === 4 ? "#69765c" : "#e3d6ad");
        rect(ux, uy + dy, 1, 1, "#a89a76");
      }
      rect(ux, uy + 5, 1, 10, "#74684c");
    }
    if (s.shield > 0) {
      for (const dx of [-11, 9]) {
        rect(s.x + dx, s.y - 12, 2, 4, "#b39864");
        rect(s.x + dx, s.y + 7, 2, 3, "#b39864");
      }
    }
    if (s.collected && s.hits > 0 && s.invulnerable > Math.max(0, rainHitGrace(s) - 0.4)) {
      const age = rainHitGrace(s) - s.invulnerable;
      if (!quiet) for (const sign of [-1, 1]) {
        rect(s.x + sign * (7 + age * 22), s.y - 6 - age * 10, 2, 2, "#779197");
        rect(s.x + sign * (11 + age * 16), s.y + 2 + age * 6, 1, 2, "#96a7a4");
      }
      ctx2.fillStyle = "#875d59";
      ctx2.font = "8px monospace";
      ctx2.fillText(s.lastHit === "cat" ? "\u732B\u6251 HP \u22121" : "\u96E8\u6DCB HP \u22121", Math.max(25, Math.min(245, s.x - 24)), Math.max(42, s.y - 23));
    }
  } });
  if (artReady && foreground?.complete && foreground.naturalWidth && foreground.naturalHeight) {
    entities.push({ depth: RAIN_BAMBOO_DEPTH, paint: () => {
      ctx2.save();
      ctx2.globalAlpha = 0.55;
      ctx2.drawImage(foreground, 0, 0, 320, 208);
      ctx2.restore();
      ctx2.globalAlpha = 1;
    } });
  }
  entities.sort((a, b) => a.depth - b.depth).forEach((entity) => entity.paint());
  rect(18, 188, 286, 19, "#e9e6da");
  for (let i = 0; i < rainHealthCapacity(s); i++) {
    const x = 24 + i * 12, color = i < s.health ? "#9a6c65" : "#c4c4b6";
    rect(x, 196, 3, 2, color);
    rect(x + 5, 196, 3, 2, color);
    rect(x, 198, 8, 2, color);
    rect(x + 1, 200, 6, 1, color);
    rect(x + 2, 201, 4, 1, color);
    rect(x + 3, 202, 2, 1, color);
  }
  ctx2.fillStyle = "#52675c";
  ctx2.font = "8px monospace";
  ctx2.fillText(`HP ${s.health}/${rainHealthCapacity(s)}`, 24, 194);
  ctx2.fillText(`${s.collected ? "\u907F\u96E8" : "\u6361\u753B"} ${rainSecondsLeft(s)} \u79D2`, 132, 194);
  ctx2.fillText(s.cooldown > 0 ? "\u62A4\u753B\u56DE\u6C14" : "\u62A4\u753B\u53EF\u7528", 232, 194);
  const remaining = s.collected ? 1 - s.rainTime / rainDuration(s) : 1 - s.time / rainPickupSeconds(s);
  rect(132, 197, 76, 3, "#bbc2b3");
  rect(132, 197, Math.round(76 * Math.max(0, remaining)), 3, "#788b79");
  if (s.story) for (const part of STORY_RAIN_STAGES.slice(1)) rect(132 + 76 * part.start / rainDuration(s), 197, 1, 3, "#e6e3d5");
  rect(232, 197, 64, 3, "#bbc2b3");
  rect(232, 197, Math.round(64 * (1 - s.cooldown / 2)), 3, "#aa9164");
  if (s.phase !== "running" && !(artReady && (s.phase === "ready" || s.phase === "paused"))) {
    const y = s.phase === "ready" ? 47 : s.phase === "paused" ? 25 : 81;
    rect(76, y, 168, 28, "#eee8d9");
    rect(76, y, 168, 1, "#a7b49f");
    ctx2.fillStyle = "#465a50";
    ctx2.font = "11px monospace";
    ctx2.fillText({ ready: "\u732B\u62E8\u753B \xB7 \u62FE\u753B\u907F\u96E8", paused: "\u7A0D\u6B47 \xB7 \u65F6\u95F4\u5DF2\u505C", won: s.story ? "\u5170\u7A3F\u5DF2\u62A2\u56DE\u6A90\u4E0B" : "\u516D\u9875\u753B\u7A3F\u90FD\u62FE\u56DE\u4E86", lost: "\u518D\u8BD5\u4E00\u56DE" }[s.phase], 91, y + 18);
    if (s.phase === "won") {
      rect(151, 117, 18, 18, "#ae7d66");
      rect(153, 119, 14, 14, "#ede2ca");
      ctx2.fillStyle = "#97664f";
      ctx2.font = "9px monospace";
      ctx2.fillText("\u597D", 155, 129);
      ctx2.fillStyle = "#5a6d5d";
      ctx2.font = "9px monospace";
      ctx2.fillText("\u732B\uFF1A\u4E0D\u662F\u6211\u3002", 119, 153);
    }
  }
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

// src/render/rain-shadow-viewport.ts
var RAIN_VIEWPORT = { width: 1280, height: 720, scale: 3, left: 160, top: 48 };
function rainDragDelta(dx, dy, width, height) {
  if (width <= 0 || height <= 0) return { x: 0, y: 0 };
  return {
    x: dx * RAIN_VIEWPORT.width / (width * RAIN_VIEWPORT.scale),
    y: dy * RAIN_VIEWPORT.height / (height * RAIN_VIEWPORT.scale)
  };
}
function drawRainViewport(ctx2, s, scholar2, quiet = false, background, foreground) {
  ctx2.setTransform(1, 0, 0, 1, 0, 0);
  ctx2.globalAlpha = 1;
  ctx2.fillStyle = "#f0eee3";
  ctx2.fillRect(0, 0, RAIN_VIEWPORT.width, RAIN_VIEWPORT.height);
  ctx2.save();
  ctx2.translate(RAIN_VIEWPORT.left, RAIN_VIEWPORT.top);
  ctx2.scale(RAIN_VIEWPORT.scale, RAIN_VIEWPORT.scale);
  drawRainShadow(ctx2, s, scholar2, quiet, background, foreground);
  ctx2.restore();
}

// scripts/verify-rain-shadow-visuals.ts
function assert(v, message) {
  if (!v) throw new Error(message);
}
for (const axis of ["x", "y"]) for (const sign of [-1, 1])
  for (const position of [19.25, 31.4, 76, 110.75, 183.8, 296.4, 308])
    for (const quiet of [false, true]) {
      const band = {
        axis,
        sign,
        from: position - sign * 100 * 0.4,
        age: 1.4,
        warning: 1,
        speed: 100,
        gap: axis === "y" ? 78 : 76,
        opening: 50
      };
      const snapshot = JSON.stringify(band), cells = rainInkCells(band, quiet);
      const painted = new Set(cells.map((c) => `${c.x},${c.y}`));
      assert(painted.size === cells.length, "\u96E8\u58A8\u5C42\u4E0D\u80FD\u91CD\u590D\u7ED8\u5236\u540C\u4E00\u50CF\u7D20");
      for (const c of cells) assert(Number.isInteger(c.x) && Number.isInteger(c.y) && c.x >= RAIN_FIELD.left && c.x < RAIN_FIELD.right && c.y >= RAIN_FIELD.top && c.y < RAIN_FIELD.bottom && rainBandHits(band, c.x + 0.5, c.y + 0.5), "\u58A8\u8FF9\u987B\u88C1\u5207\u5730\u9762\u5E76\u4E0E\u50CF\u7D20\u4E2D\u5FC3\u7684\u5B9E\u9645\u5371\u9669\u5224\u5B9A\u4E00\u81F4");
      let dangerous = 0;
      for (let y = RAIN_FIELD.top; y < RAIN_FIELD.bottom; y++) for (let x = RAIN_FIELD.left; x < RAIN_FIELD.right; x++)
        if (rainBandHits(band, x + 0.5, y + 0.5)) dangerous++;
      if (dangerous > 500) assert(
        painted.size > dangerous * 0.06 && painted.size < dangerous * 0.38,
        "\u5199\u610F\u96E8\u987B\u6709\u53EF\u8BFB\u7684\u5BC6\u5EA6\u4E0E\u7B14\u8FF9\u7A7A\u767D\uFF0C\u4E0D\u80FD\u9000\u56DE\u586B\u6EE1\u77E9\u5F62\u5E95\u58A8"
      );
      assert(snapshot === JSON.stringify(band), "\u58A8\u8FF9\u53D8\u5316\u4E0D\u80FD\u5199\u6A21\u62DF\u72B6\u6001");
      if (position === 110.75) assert(cells.some((c) => c.color === RAIN_INK.ink) && cells.some((c) => c.color === RAIN_INK.pale), "\u58A8\u4E1D\u4E0E\u5C11\u91CF\u6DE1\u8272\u96E8\u70B9\u8981\u540C\u65F6\u5B58\u5728");
      band.age = 0.5;
      assert(rainInkCells(band, quiet).length === 0, "\u9884\u544A\u671F\u4E0D\u63D0\u524D\u753B\u4F24\u5BB3\u96E8");
    }
var commands = [];
var imageAlphas = [];
var ctx = new Proxy({ fillStyle: "", font: "", imageSmoothingEnabled: false, globalAlpha: 1 }, {
  get(target, property) {
    if (property in target) return target[property];
    return (...args) => {
      if (property === "drawImage") imageAlphas.push(target.globalAlpha);
      return commands.push([property, target.fillStyle, ...args]);
    };
  }
});
for (const quiet of [false, true]) {
  commands.length = 0;
  drawRainInkMargins(ctx, 4.2, quiet);
  assert(commands.length > 0, "\u6A90\u5916\u987B\u6709\u539F\u521B\u679D\u53F6\u5C42\u6B21");
  for (const command of commands) {
    const [, , x, y, w, h] = command;
    assert(
      Number.isInteger(x) && Number.isInteger(y) && w === 1 && h === 1 && (x < RAIN_FIELD.left || x >= RAIN_FIELD.right) && y >= 32 && y < RAIN_FIELD.bottom,
      "\u6A90\u5916\u679D\u53F6\u4E0D\u5F97\u906E\u76D6\u53EF\u8D70\u5730\u9762\u3001\u4EBA\u7269\u6838\u5FC3\u3001\u96E8\u7F1D\u4E0E\u732B\u5F71"
    );
  }
  commands.length = 0;
  drawRainInkMargins(ctx, 4.2, quiet);
  const frozen = JSON.stringify(commands);
  commands.length = 0;
  drawRainInkMargins(ctx, 4.2, quiet);
  assert(frozen === JSON.stringify(commands), "\u540C\u4E00\u6A21\u62DF\u65F6\u95F4\u7684\u679D\u53F6\u5FC5\u987B\u7A33\u5B9A");
}
commands.length = 0;
drawRainInkMargins(ctx, 1, true);
var still = JSON.stringify(commands);
commands.length = 0;
drawRainInkMargins(ctx, 7, true);
assert(still === JSON.stringify(commands), "\u5C11\u52A8\u6548\u679D\u53F6\u4E0D\u6446\u52A8\uFF0C\u9759\u6001\u59FF\u6001\u4ECD\u4FDD\u7559");
for (const axis of ["x", "y"]) for (const sign of [-1, 1]) for (const age of [0.2, 1.4]) {
  const band = { axis, sign, from: axis === "y" ? 110 : 160, age, warning: 1, speed: 0, gap: axis === "y" ? 104 : 76, opening: 50 };
  commands.length = 0;
  const before = JSON.stringify(band);
  drawRainGapHint(ctx, band);
  const marks = commands.filter((c) => c[0] === "fillRect");
  assert(marks.length > 70 && before === JSON.stringify(band), "\u9884\u544A/\u8FD0\u52A8\u90FD\u6709\u7EB8\u4F1E\u53CA\u4E24\u4FA7\u77ED\u53F6\u63D0\u793A\uFF0C\u4E0D\u753B\u957F\u8FB9\u6846\u3001\u4E0D\u5199\u6A21\u62DF");
  assert(!commands.some((c) => c[0] === "fillText"), "\u7EB8\u4F1E\u66FF\u4EE3\u6587\u5B57\uFF0C\u4E0D\u5728\u753B\u9762\u4E0A\u6807\u6CE8\u96E8\u7F1D");
  for (const command of marks) {
    const [, , x, y, w, h] = command;
    assert(
      w === 1 && h === 1 && Math.abs((axis === "y" ? x : y) - band.gap) < band.opening / 2 - 3,
      "\u53CC\u53F6\u63D0\u793A\u987B\u5728\u6709\u6548\u96E8\u7F1D\u5185\u4FA7\uFF0C\u4E0D\u5938\u5927\u5B89\u5168\u8303\u56F4"
    );
  }
}
var artState = createRainShadow(false, true);
var art = { complete: true, naturalWidth: 1555, naturalHeight: 1011 };
imageAlphas.length = 0;
commands.length = 0;
var artBefore = JSON.stringify(artState);
drawRainShadow(ctx, artState, void 0, false, art);
assert(
  JSON.stringify(artState) === artBefore && commands.some((c) => c[0] === "drawImage"),
  "\u5DF2\u52A0\u8F7D\u7684\u539F\u521B\u80CC\u666F\u5FC5\u987B\u771F\u6B63\u7ED8\u5230\u753B\u5E03\uFF0C\u4E0D\u6539\u53D8\u6BD4\u4F8B/\u7269\u7406"
);
assert(imageAlphas.length === 1 && imageAlphas[0] === RAIN_BACKGROUND_OPACITY && RAIN_BACKGROUND_OPACITY <= 0.45 && ctx.globalAlpha === 1, "\u53EA\u6DE1\u5316\u80CC\u666F\uFF0C\u4E0D\u80FD\u628A\u732B\u3001\u89D2\u8272\u3001\u96E8\u58A8\u548CUI\u4E00\u8D77\u538B\u6DE1");
assert(
  !commands.some((c) => c[0] === "fillRect" && Number(c[4]) >= 150 && Number(c[5]) >= 100 && c[1] !== "#f0eee3"),
  "\u80CC\u666F\u4E0A\u4E0D\u5F97\u91CD\u65B0\u8986\u76D6\u5927\u9762\u79EF\u7070\u77F3\u677F\u821E\u53F0/\u67F1\u6846"
);
commands.length = 0;
drawRainShadow(ctx, artState, void 0, false, { ...art, naturalWidth: 0 });
assert(!commands.some((c) => c[0] === "drawImage"), "\u80CC\u666F\u52A0\u8F7D\u5931\u8D25\u8981\u56DE\u9000\uFF0C\u4E0D\u7ED8\u5236\u574F\u56FE");
assert(JSON.stringify(commands).includes("#52584a"), "\u732B\u8981\u6709\u4F4E\u9971\u548C\u6DF1\u58A8\u8F6E\u5ED3\uFF0C\u4E0D\u80FD\u4E0E\u80CC\u666F\u540C\u660E\u5EA6");
console.log("\u8FA8\u8BC6\u5EA6\uFF1A\u4EC5\u80CC\u666F40%\u58A8\u8272\u3001\u524D\u666F\u4E0D\u8DDF\u968F\u6DE1\u5316\uFF0C\u7EB8\u4F1E\u65E0\u6807\u5B57\u4E14\u4E0D\u5938\u5927\u96E8\u7F1D\uFF0C\u732B\u6709\u58A8\u8FB9\uFF1B\u65E0\u6846\u5199\u610F\u96E8\u88C1\u5207\u901A\u8FC7\u3002");
assert(
  RAIN_VIEWPORT.width === 1280 && RAIN_VIEWPORT.height === 720 && RAIN_VIEWPORT.scale === 3,
  "\u8F93\u51FA\u56FA\u5B9A720P\uFF0C\u6574\u6570\u653E\u5927\u903B\u8F91\u7A7A\u95F4\uFF0C\u4E0D\u589E\u52A0\u7A97\u53E3\u53EF\u8D70\u533A\u57DF"
);
for (const [width, height] of [[1280, 720], [960, 540], [640, 360], [320, 180]]) {
  const delta = rainDragDelta(82 * 3 * width / 1280, -29 * 3 * height / 720, width, height);
  assert(
    Math.abs(delta.x - 82) < 1e-9 && Math.abs(delta.y + 29) < 1e-9,
    "\u4E0D\u540C\u663E\u793A\u5C3A\u5BF8\u7684\u540C\u4E00\u903B\u8F91\u62D6\u62FD\u5E94\u5F97\u5230\u76F8\u540C\u76EE\u6807\uFF0C\u4E0D\u6539\u53D8\u901F\u5EA6/\u8DDD\u79BB"
  );
}
assert(rainDragDelta(10, 10, 0, 0).x === 0, "\u9690\u85CF/\u96F6\u5C3A\u5BF8\u753B\u5E03\u4E0D\u80FD\u4EA7\u751F\u65E0\u9650\u8F93\u5165");
commands.length = 0;
drawRainViewport(ctx, artState, void 0, false, art);
assert(
  commands.some((c) => c[0] === "scale" && c[2] === 3 && c[3] === 3) && commands.some((c) => c[0] === "translate" && c[2] === 160 && c[3] === 48),
  "\u573A\u666F\u3001\u7EB8\u4F1E\u3001\u732B\u3001\u96E8\u6EF4\u5171\u7528\u540C\u4E00720P\u6295\u5F71\uFF0C\u4E0D\u80FD\u5404\u81EA\u62C9\u4F38"
);
var fore = { complete: true, naturalWidth: 1555, naturalHeight: 1011, src: "transparent-bamboo-test" };
var scholar = { complete: true, naturalWidth: 1400, naturalHeight: 1430, src: "scholar-test" };
for (const y of [100, 178]) {
  artState.y = y;
  commands.length = 0;
  const before = JSON.stringify(artState);
  drawRainShadow(ctx, artState, scholar, false, art, fore);
  const draws = commands.filter((c) => c[0] === "drawImage");
  const foregroundIndex = draws.findIndex((c) => c[2] === fore), heroIndex = draws.findIndex((c) => c[2] === scholar);
  assert(
    foregroundIndex >= 0 && heroIndex >= 0 && (y < 152 ? heroIndex < foregroundIndex : foregroundIndex < heroIndex),
    "\u811A\u70B9\u5728\u7AF9\u5B50\u843D\u5730\u7EBF\u540E/\u524D\uFF0C\u987B\u5206\u522B\u91CD\u7ED8\u524D\u666F/\u8BA9\u89D2\u8272\u5C45\u524D"
  );
  assert(before === JSON.stringify(artState) && ctx.globalAlpha === 1, "\u906E\u6321\u6392\u5E8F\u4E0D\u6539\u7269\u7406/HP\uFF0C\u4E0D\u628AHUD\u538B\u6DE1");
}
artState.phase = "lost";
artState.invulnerable = 0.4;
artState.total = 1.1;
commands.length = 0;
drawRainShadow(ctx, artState, scholar, false, art, fore);
assert(
  commands.some((c) => c[0] === "drawImage" && c[2] === scholar),
  "\u5931\u8D25/\u6682\u505C\u4E0D\u80FD\u51BB\u7ED3\u5728\u53D7\u51FB\u95EA\u70C1\u7684\u4E0D\u53EF\u89C1\u5E27\uFF0C\u89D2\u8272\u5FC5\u987B\u4ECD\u53EF\u89C1"
);
console.log("720P\u516C\u5E73\u6027\u4E0E\u5C42\u6B21\uFF1A\u4E0D\u540C\u663E\u793A\u5C3A\u5BF8\u62D6\u62FD\u7B49\u4EF7\u3001\u56FA\u5B9A\u6295\u5F71\u3001\u7AF9\u524D/\u7AF9\u540E\u6392\u5E8F\u3001\u5931\u8D25\u4E0D\u9690\u85CF\u4E3B\u89D2\u901A\u8FC7\u3002");
var signatures = /* @__PURE__ */ new Set();
for (let i = 0; i < 6; i++) {
  commands.length = 0;
  drawRainSketch(ctx, i, 0, 0, 24, 22);
  signatures.add(JSON.stringify(commands));
}
assert(signatures.size === 6, "\u516D\u5E45\u539F\u521B\u753B\u7A3F\u4E0D\u80FD\u53EA\u6362\u540D\u79F0\u3001\u5B9E\u9645\u753B\u9762\u76F8\u540C");
for (const story of [false, true]) for (const quiet of [false, true]) {
  const s = createRainShadow(false, story);
  startRainShadow(s);
  for (let frame = 0; frame < 5e3 && s.phase === "running"; frame++) {
    updateRainShadow(s, 0.016, rainTestInput(s));
    const before2 = JSON.stringify(s);
    drawRainShadow(ctx, s, void 0, quiet);
    drawRainAlbum(ctx, s);
    assert(JSON.stringify(s) === before2, "\u52A8\u6548\u3001\u753B\u7A3F\u518C\u4E0D\u5F97\u4FEE\u6539\u79FB\u52A8\u3001\u5224\u5B9A\u3001\u56DE\u6C14\u3001\u8BA1\u65F6\u6216\u5956\u52B1");
    if (s.collected && s.phase === "running") assert(
      rainAlbumState(s).complete === s.round,
      "\u62FE\u8D77\u4F46\u5C1A\u672A\u6491\u8FC7\u96E8\uFF0C\u4E0D\u80FD\u663E\u793A\u6210\u5DF2\u5165\u518C"
    );
    commands.length = 0;
  }
  assert(s.phase === "won" && rainAlbumState(s).complete === (story ? 1 : 6) && rainAlbumState(s).held === null, "\u5267\u60C5\u5355\u9875\u4E0E\u5E95\u5C42\u516D\u6298\u7684\u5B8C\u6210\u6570\u91CF\u5FC5\u987B\u5206\u522B\u6B63\u786E");
  const before = JSON.stringify(s);
  drawRainShadow(ctx, s, void 0, quiet);
  assert(JSON.stringify(s) === before, "\u7ED3\u675F\u6F14\u51FA\u4E0D\u5F97\u63A8\u8FDB\u6E38\u620F\u6216\u53D1\u5956");
}
var paused = createRainShadow();
startRainShadow(paused);
updateRainShadow(paused, 0.1, { x: 1, y: 0 });
pauseRainShadow(paused);
commands.length = 0;
drawRainShadow(ctx, paused);
var first = JSON.stringify(commands);
commands.length = 0;
drawRainShadow(ctx, paused);
assert(JSON.stringify(commands) === first, "\u6682\u505C\u65F6\u6F14\u51FA\u4E5F\u5FC5\u987B\u51BB\u7ED3\uFF0C\u4E0D\u80FD\u7528\u5B9E\u65F6\u65F6\u949F\u7EE7\u7EED\u64AD\u653E");
assert(!ctx.imageSmoothingEnabled, "\u5FC5\u987B\u4FDD\u7559\u50CF\u7D20\u8FB9\u7F18");
var catPause = createRainShadow(false, true);
startRainShadow(catPause);
catPause.collected = true;
catPause.rainTime = 2.39;
updateRainShadow(catPause, 0.016, { x: 0, y: 0 });
pauseRainShadow(catPause);
assert(catPause.cat, "\u7ED8\u5236\u56DE\u5F52\u5FC5\u987B\u5305\u542B\u5DF2\u751F\u6210\u7684\u771F\u5B9E\u732B\u6251");
for (const quiet of [false, true]) {
  const snapshot = JSON.stringify(catPause);
  commands.length = 0;
  drawRainShadow(ctx, catPause, void 0, quiet);
  const firstCat = JSON.stringify(commands);
  assert(
    firstCat.includes("#a69c86") && !firstCat.includes("#947047"),
    "\u5C11\u52A8\u6548\u4FDD\u7559\u660E\u786E\u7684\u843D\u70B9\u732B\u5F71\uFF0C\u4E0D\u6062\u590D\u65E7\u8910\u8272\u76F4\u7EBF"
  );
  commands.length = 0;
  drawRainShadow(ctx, catPause, void 0, quiet);
  assert(JSON.stringify(commands) === firstCat && JSON.stringify(catPause) === snapshot, "\u732B\u6251\u6682\u505C\u6F14\u51FA\u51BB\u7ED3\u4E14\u4E0D\u6539\u6A21\u62DF");
}
for (const [fromX, fromY, toX, toY] of [
  [160, 100, 230, 100],
  [160, 100, 90, 100],
  [160, 100, 160, 165],
  [160, 100, 160, 40],
  [52, 36, 28, 36],
  [290, 154, 290, 178]
]) {
  const cat = { fromX, fromY, toX, toY, age: 0.2, warning: 1, speed: 175 };
  const marks = rainCatShadowMarks(cat), last = marks[marks.length - 1];
  assert(
    last.x === toX && last.y === toY && marks.length >= 1 && marks.length <= 3,
    "\u56DB\u65B9\u5411/\u8D34\u8FB9\u77ED\u6251\u7684\u6700\u540E\u732B\u5F71\u4E2D\u5FC3\u5FC5\u987B\u662F\u5DF2\u9501\u5B9A\u843D\u70B9"
  );
  for (const quiet of [false, true]) {
    commands.length = 0;
    const before = JSON.stringify(cat);
    drawRainCatPounceHint(ctx, cat, quiet);
    assert(commands.length > 0 && before === JSON.stringify(cat), "\u4E24\u79CD\u52A8\u6548\u6A21\u5F0F\u90FD\u7ED8\u5236\u732B\u5F71\uFF0C\u4E14\u53EA\u8BFB");
    for (const command of commands) {
      const [, , x, y, w, h] = command;
      assert(
        Number.isInteger(x) && Number.isInteger(y) && w === 1 && h === 1 && x >= RAIN_FIELD.left && x < RAIN_FIELD.right && y >= RAIN_FIELD.top && y < RAIN_FIELD.bottom,
        "\u732B\u5F71\u6309\u903B\u8F91\u50CF\u7D20\u7ED8\u5236\u4E14\u4E0D\u8D8A\u51FA\u5730\u9762\uFF0C\u4E0D\u538B\u5230\u5899/\u5C4B\u6A90"
      );
    }
  }
  cat.age = cat.warning;
  commands.length = 0;
  drawRainCatPounceHint(ctx, cat);
  assert(commands.length === 0, "\u5B9E\u4F53\u6251\u51FA\u540E\u9884\u544A\u732B\u5F71\u64A4\u53BB\uFF0C\u4E0D\u80FD\u7559\u4E0B\u5047\u5371\u9669");
}
console.log("\u732B\u5F71\u9884\u544A\uFF1A\u56DB\u5411\u4E0E\u8D34\u8FB9\u843D\u70B9\u4E00\u81F4\u3001\u6574\u6570\u50CF\u7D20/\u5730\u9762\u88C1\u5207\u3001\u5C11\u52A8\u6548\u4E0D\u9690\u85CF\u3001\u6251\u51FA\u540E\u64A4\u5F71\u4E14\u7ED8\u5236\u4E0D\u6539\u6A21\u62DF\u901A\u8FC7\u3002");
var landing = createRainShadow(false, true);
landing.phase = "paused";
landing.collected = true;
landing.cat = { fromX: 30, fromY: 128, toX: 78, toY: 128, age: 1.4, warning: 1, speed: 175 };
landing.x = 120;
landing.y = 90;
commands.length = 0;
var landingBefore = JSON.stringify(landing);
drawRainShadow(ctx, landing);
assert(
  JSON.stringify(commands).includes("\u54A6\uFF1F") && JSON.stringify(landing) === landingBefore,
  "\u843D\u5730\u6B6A\u5934\u53CD\u5E94\u5E94\u53EF\u89C1\uFF0C\u4F46\u4E0D\u80FD\u79FB\u52A8\u732B\u3001\u4FEE\u6539HP\u6216\u590D\u6D3B\u78B0\u649E"
);
commands.length = 0;
drawRainShadow(ctx, landing, void 0, true);
assert(!JSON.stringify(commands).includes("\u54A6\uFF1F"), "\u5C11\u52A8\u6548\u7565\u53BB\u88C5\u9970\u53CD\u5E94\uFF0C\u4E0D\u53D6\u6D88\u5B9E\u4F53\u732B\u6216\u73A9\u6CD5\u63D0\u793A");
console.log("\u62A2\u753B\u753B\u9762\uFF1A\u516D\u7A3F\u4E0D\u540C\u3001\u5267\u60C5\u5355\u9875/\u5E95\u5C42\u516D\u6298\u3001\u5DF2\u6361/\u5165\u518C\u5206\u79BB\u3001\u666E\u901A/\u5C11\u52A8\u6548\u4E0D\u6539\u72B6\u6001\u3001\u6682\u505C\u6F14\u51FA\u51BB\u7ED3\u901A\u8FC7\u3002");
