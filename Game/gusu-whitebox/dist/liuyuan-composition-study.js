"use strict";
(() => {
  // src/core/liuyuan-composition-study.ts
  var STONE_BOARD = { width: 960, height: 480 };
  var STONE_RADII = [64, 52, 40];
  var EDGE = 72;
  var INITIAL_STONE_STUDY = {
    stones: [
      { x: 220, y: 268 },
      { x: 430, y: 268 },
      { x: 640, y: 268 }
    ],
    selected: 0
  };
  function selectStudyStone(state2, selected) {
    return { ...state2, selected };
  }
  function placeStudyStone(state2, index, point) {
    const radius = STONE_RADII[index];
    const stones = state2.stones.map((stone, current) => current === index ? {
      x: Math.max(radius + EDGE, Math.min(STONE_BOARD.width - radius - EDGE, point.x)),
      y: Math.max(radius + EDGE, Math.min(STONE_BOARD.height - radius - EDGE, point.y))
    } : { ...stone });
    return { stones, selected: index };
  }
  function nudgeStudyStone(state2, dx, dy) {
    const selected = state2.selected;
    const point = state2.stones[selected];
    return placeStudyStone(state2, selected, { x: point.x + dx, y: point.y + dy });
  }
  function pairGap(state2, first, second) {
    const a = state2.stones[first];
    const b = state2.stones[second];
    return Math.hypot(a.x - b.x, a.y - b.y) - STONE_RADII[first] - STONE_RADII[second];
  }
  function readStoneSpacing(state2) {
    const pairs = [
      { first: 0, second: 1, gap: pairGap(state2, 0, 1) },
      { first: 0, second: 2, gap: pairGap(state2, 0, 2) },
      { first: 1, second: 2, gap: pairGap(state2, 1, 2) }
    ];
    const eachStoneNearest = [0, 1, 2].map((stone) => {
      const connected = pairs.filter((pair) => pair.first === stone || pair.second === stone);
      return connected.sort((a, b) => a.gap - b.gap)[0];
    });
    const compacted = eachStoneNearest.map((pair) => pair.gap).sort((a, b) => a - b);
    const closestPair = eachStoneNearest.reduce((best, pair) => pair.gap < best.gap ? pair : best, eachStoneNearest[0]);
    const mostOpenPair = eachStoneNearest.reduce((best, pair) => pair.gap > best.gap ? pair : best, eachStoneNearest[0]);
    const low = compacted[0];
    const high = compacted[2];
    const text = low < -18 ? "\u6709\u4E24\u5757\u77F3\u5F62\u538B\u5F97\u592A\u6DF1\uFF0C\u5148\u8BA9\u8F6E\u5ED3\u91CD\u65B0\u5206\u5F00\u3002" : high - low < 38 ? "\u4E09\u77F3\u90FD\u770B\u5F97\u89C1\uFF0C\u4E0D\u8FC7\u90BB\u8FD1\u7684\u7A7A\u9699\u8FD8\u592A\u9F50\uFF1B\u8BD5\u7740\u8BA9\u4E00\u5BF9\u76F8\u4F9D\u4E9B\uFF0C\u53E6\u4E00\u5904\u8212\u5C55\u5F00\u3002" : low > 108 ? "\u4E09\u77F3\u5404\u81EA\u7AD9\u5F97\u592A\u8FDC\uFF0C\u5F7C\u6B64\u5C1A\u672A\u5F62\u6210\u4E00\u7EC4\uFF1B\u8BA9\u5176\u4E2D\u4E24\u5757\u9760\u8FD1\u4E9B\u3002" : "\u5DF2\u6709\u8FD1\u5904\u76F8\u5E94\u3001\u8FDC\u5904\u7A0D\u5F00\u7684\u53D8\u5316\u3002";
    return {
      nearestGaps: compacted,
      closestPair: [closestPair.first, closestPair.second],
      mostOpenPair: [mostOpenPair.first, mostOpenPair.second],
      text
    };
  }
  function assessStoneComposition(state2) {
    const { nearestGaps } = readStoneSpacing(state2);
    const [tightest, , widest] = nearestGaps;
    if (tightest < -18) return {
      passed: false,
      code: "merged",
      line: "\u77F3\u5320\u8F7B\u8F7B\u628A\u7EB8\u8F6C\u4E86\u534A\u5708\uFF1A\u201C\u8FD9\u4E24\u5757\u6328\u5F97\u592A\u6DF1\uFF0C\u8F6E\u5ED3\u5FEB\u5E76\u6210\u4E00\u56E2\u3002\u7559\u4E00\u9053\u80FD\u8FA8\u77F3\u5F62\u7684\u6C14\u53E3\uFF0C\u518D\u770B\u4E00\u773C\u3002\u201D"
    };
    if (widest - tightest < 38) return {
      passed: false,
      code: "same-spacing",
      line: "\u77F3\u5320\u7528\u6307\u8282\u6CBF\u4E09\u5904\u7A7A\u9699\u70B9\u8FC7\uFF1A\u201C\u77F3\u5F62\u5404\u6709\u4E0D\u540C\uFF0C\u95F4\u8DDD\u5374\u50CF\u5C3A\u91CF\u3002\u8BA9\u4E00\u5BF9\u76F8\u4F9D\uFF0C\u518D\u628A\u53E6\u4E00\u5904\u653E\u5F00\u4E9B\u3002\u201D"
    };
    if (tightest > 108) return {
      passed: false,
      code: "too-isolated",
      line: "\u77F3\u5320\u8BF4\uFF1A\u201C\u4E09\u5757\u90FD\u597D\u770B\u6E05\uFF0C\u5374\u5404\u81EA\u6210\u5B64\u3002\u6536\u8FD1\u4E00\u5BF9\uFF0C\u8BA9\u5B83\u4EEC\u5148\u6709\u7167\u5E94\u3002\u201D"
    };
    return {
      passed: true,
      code: "varied",
      line: "\u77F3\u5320\u770B\u4E86\u7247\u523B\uFF0C\u70B9\u5934\u9053\uFF1A\u201C\u4E09\u5757\u4ECD\u5404\u6709\u77F3\u5F62\uFF0C\u4E00\u5904\u76F8\u4EB2\uFF0C\u4E00\u5904\u8212\u5C55\u3002\u56FE\u516D\u4E00\u3001\u516D\u4E8C\u5404\u6709\u4E0D\u540C\u53D6\u6CD5\uFF1B\u8FD9\u5F20\u5C0F\u7A3F\u4E5F\u81EA\u6709\u5B83\u7684\u6C14\u53E3\u3002\u201D"
    };
  }

  // src/core/liuyuan-zhezhi-study.ts
  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  function pointToSegment(point, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) return distance(point, a);
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
    return distance(point, { x: a.x + t * dx, y: a.y + t * dy });
  }
  function branchTurnAngle(previous, pivot, next) {
    const a = { x: previous.x - pivot.x, y: previous.y - pivot.y };
    const b = { x: next.x - pivot.x, y: next.y - pivot.y };
    const denominator = Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y);
    if (!denominator) return 0;
    const insideAngle = Math.acos(Math.max(-1, Math.min(1, (a.x * b.x + a.y * b.y) / denominator))) * 180 / Math.PI;
    return Math.abs(180 - insideAngle);
  }
  function readBranchStudy(state2) {
    const angles = [1, 2, 3].map((index) => branchTurnAngle(state2.stem[index - 1], state2.stem[index], state2.stem[index + 1]));
    const turnsAt = angles.map((angle) => angle >= 24);
    const turns = turnsAt.filter(Boolean).length;
    const bloomsNearStem = state2.blooms.map(
      (bloom) => Math.min(...state2.stem.slice(0, -1).map((point, index) => pointToSegment(bloom, point, state2.stem[index + 1]))) <= 105
    );
    return { turns, turnsAt, bloomGap: distance(state2.blooms[0], state2.blooms[1]), bloomsNearStem };
  }
  function assessBranchStudy(state2) {
    const reading = readBranchStudy(state2);
    const pathLength = state2.stem.slice(0, -1).reduce((sum, point, index) => sum + distance(point, state2.stem[index + 1]), 0);
    const chord = Math.max(1, distance(state2.stem[0], state2.stem[state2.stem.length - 1]));
    const sinuosity = pathLength / chord;
    const notes = [
      reading.turns === 0 || sinuosity < 1.06 ? "\u679D\u52BF\uFF1A\u9996\u5C3E\u76F8\u671B\uFF0C\u6574\u4F53\u8F83\u76F4\uFF1B\u82E5\u60F3\u6709\u201C\u56DE\u8EAB\u201D\uFF0C\u53EF\u4EE5\u518D\u8BD5\u7740\u8F6C\u52A8\u4E00\u5904\u3002" : reading.turns === 3 && sinuosity > 1.55 ? "\u679D\u52BF\uFF1A\u8F6C\u8EAB\u5F88\u591A\uFF0C\u6C14\u606F\u7565\u6025\uFF1B\u6536\u7F13\u5176\u4E2D\u4E00\u6298\uFF0C\u4E5F\u8BB8\u66F4\u8FDE\u8D2F\u3002" : "\u679D\u52BF\uFF1A\u5DF2\u6709\u8D77\u4F0F\uFF0C\u9996\u5C3E\u4ECD\u76F8\u627F\uFF1B\u53EF\u4EE5\u6BD4\u8F83\u8F6C\u6298\u7684\u8F7B\u91CD\u3002",
      reading.bloomGap < 54 ? "\u82B1\u610F\uFF1A\u4E24\u7C07\u76F8\u805A\uFF0C\u4E3B\u6B21\u6682\u4E0D\u5206\u660E\uFF1B\u53EF\u62C9\u5F00\u4E00\u70B9\uFF0C\u4E5F\u53EF\u4FDD\u7559\u4E3A\u6D53\u5904\u3002" : reading.bloomGap > 260 ? "\u82B1\u610F\uFF1A\u4E24\u7C07\u76F8\u671B\u8F83\u8FDC\uFF1B\u4E2D\u6BB5\u7684\u7A7A\u5904\u56E0\u6B64\u66F4\u5F00\u9614\u3002" : reading.bloomsNearStem.some((near) => !near) ? "\u82B1\u610F\uFF1A\u6709\u4E00\u7C07\u79BB\u679D\u7A0D\u8FDC\uFF0C\u50CF\u53E6\u8D77\u4E00\u666F\uFF1B\u4F60\u53EF\u4EE5\u8BA9\u5B83\u9760\u679D\uFF0C\u4E5F\u53EF\u4EE5\u6709\u610F\u7559\u5F00\u3002" : "\u82B1\u610F\uFF1A\u4E24\u7C07\u5F7C\u6B64\u6709\u522B\uFF0C\u4E5F\u90FD\u4E0E\u679D\u52BF\u76F8\u5E94\u3002",
      Math.abs((state2.blooms[0].x + state2.blooms[1].x) / 2 - 480) < 85 ? "\u4F59\u767D\uFF1A\u82B1\u4E0E\u679D\u5927\u81F4\u843D\u5728\u753B\u5FC3\u9644\u8FD1\uFF0C\u4E24\u4FA7\u7A7A\u5904\u8F83\u4E3A\u76F8\u6301\u3002" : (state2.blooms[0].x + state2.blooms[1].x) / 2 < 395 ? "\u4F59\u767D\uFF1A\u753B\u6750\u504F\u5DE6\uFF0C\u53F3\u4FA7\u7559\u7A7A\u8F83\u9614\uFF1B\u53EF\u770B\u770B\u8FD9\u4EFD\u504F\u7F6E\u662F\u5426\u5408\u610F\u3002" : "\u4F59\u767D\uFF1A\u753B\u6750\u504F\u53F3\uFF0C\u5DE6\u4FA7\u7559\u7A7A\u8F83\u9614\uFF1B\u53EF\u770B\u770B\u8FD9\u4EFD\u504F\u7F6E\u662F\u5426\u5408\u610F\u3002"
    ];
    const code = reading.turns === 0 || sinuosity < 1.06 ? "straight" : reading.bloomGap < 54 ? "compressed" : reading.bloomGap > 260 ? "scattered" : "observed";
    return {
      passed: true,
      code,
      line: notes.join(" "),
      notes
    };
  }

  // src/core/liuyuan-composition-save.ts
  var STORAGE_PREFIX = "gusu-garden-composition-practice-v2-";
  var emptyDraft = () => ({ version: 2 });
  var record = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
  var validPoint = (value) => record(value) && typeof value.x === "number" && Number.isFinite(value.x) && value.x >= 0 && value.x <= 960 && typeof value.y === "number" && Number.isFinite(value.y) && value.y >= 0 && value.y <= 480;
  function parseCompositionDraft(raw) {
    if (!raw) return emptyDraft();
    try {
      const parsed = JSON.parse(raw);
      if (!record(parsed) || parsed.version !== 2) return emptyDraft();
      const draft = emptyDraft();
      if (record(parsed.stone) && record(parsed.stone.state)) {
        const positions = parsed.stone.state.stones;
        const selected = parsed.stone.state.selected;
        if (Array.isArray(positions) && positions.length === 3 && positions.every(validPoint) && (selected === 0 || selected === 1 || selected === 2)) {
          const state2 = {
            stones: positions.map((point) => ({ x: point.x, y: point.y })),
            selected
          };
          const exampleViewed2 = parsed.stone.exampleViewed === true;
          draft.stone = {
            state: state2,
            exampleViewed: exampleViewed2,
            passed: exampleViewed2 && parsed.stone.passed === true && assessStoneComposition(state2).passed
          };
        }
      }
      if (record(parsed.branch) && record(parsed.branch.state)) {
        const stem = parsed.branch.state.stem;
        const blooms = parsed.branch.state.blooms;
        const selected = parsed.branch.state.selected;
        if (Array.isArray(stem) && stem.length === 5 && stem.every(validPoint) && Array.isArray(blooms) && blooms.length === 2 && blooms.every(validPoint) && Number.isInteger(selected) && selected >= 0 && selected <= 6) {
          const state2 = {
            stem: stem.map((point) => ({ x: point.x, y: point.y })),
            blooms: blooms.map((point) => ({ x: point.x, y: point.y })),
            selected
          };
          draft.branch = { state: state2, passed: parsed.branch.passed === true && assessBranchStudy(state2).passed };
        }
      }
      return draft;
    } catch {
      return emptyDraft();
    }
  }
  function loadCompositionDraft(chapter2) {
    try {
      return parseCompositionDraft(localStorage.getItem(`${STORAGE_PREFIX}${chapter2 ? "chapter" : "study"}`));
    } catch {
      return emptyDraft();
    }
  }
  function saveCompositionDraft(chapter2, draft) {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${chapter2 ? "chapter" : "study"}`, JSON.stringify(draft));
      return true;
    } catch {
      return false;
    }
  }

  // src/core/liuyuan-playtest.ts
  function isLiuyuanPlaytest(search) {
    const current = search ?? (typeof location === "undefined" ? "" : location.search);
    return new URLSearchParams(current).get("playtest") === "1";
  }
  function carryLiuyuanPlaytest(query, search) {
    if (isLiuyuanPlaytest(search)) query.set("playtest", "1");
  }

  // src/core/liuyuan-composition-route.ts
  function compositionRouteHref(page, chapter2, draft, albumDone = false) {
    const query = new URLSearchParams();
    if (chapter2) query.set("chapter", "1");
    if (draft) query.set("draft", "1");
    if (albumDone) query.set("album", "done");
    carryLiuyuanPlaytest(query);
    return `${page}${query.toString() ? `?${query}` : ""}`;
  }

  // src/liuyuan-composition-study.ts
  var canvas = document.getElementById("scene");
  var ctx = canvas.getContext("2d");
  var feedback = document.getElementById("feedback");
  var liveRead = document.getElementById("liveRead");
  var analysis = document.getElementById("analysis");
  var analysisText = document.getElementById("analysisText");
  var practice = document.getElementById("practice");
  var saveNote = document.getElementById("saveNote");
  var nextAfterReview = document.getElementById("nextAfterReview");
  var params = new URLSearchParams(location.search);
  var chapter = params.get("chapter") === "1";
  var previewRequested = params.get("draft") === "1";
  document.getElementById("returnFlower").href = compositionRouteHref("liuyuan-flower.html", chapter, previewRequested);
  document.getElementById("returnAlbum").href = compositionRouteHref("liuyuan-flower.html", chapter, previewRequested, true);
  var stoneButtons = [...document.querySelectorAll("[data-stone]")];
  var nudgeButtons = [...document.querySelectorAll("[data-nudge]")];
  var restored = loadCompositionDraft(chapter).stone;
  var state = restored ? structuredClone(restored.state) : structuredClone(INITIAL_STONE_STUDY);
  var exampleViewed = restored?.exampleViewed ?? false;
  var reviewed = restored?.passed ?? false;
  var dragging = null;
  var dragOrigin = null;
  var history = [];
  practice.hidden = !exampleViewed;
  function colors(index) {
    return [
      { base: "#626a64", lit: "#95978a", shade: "#3b4540" },
      { base: "#70776e", lit: "#aaab98", shade: "#454d47" },
      { base: "#565f5b", lit: "#899085", shade: "#343d39" }
    ][index];
  }
  function drawStone(index) {
    const { x, y } = state.stones[index];
    const r = STONE_RADII[index];
    const palette = colors(index);
    const shape = index === 0 ? [[-0.67, 0.8], [-0.7, 0.42], [-0.48, 0.22], [-0.44, -0.2], [-0.16, -0.57], [0.02, -0.79], [0.17, -0.33], [0.37, -0.53], [0.59, -0.16], [0.67, 0.4], [0.43, 0.65], [0.11, 0.79]] : index === 1 ? [[-0.79, 0.66], [-0.68, 0.18], [-0.48, -0.17], [-0.12, -0.24], [0.04, -0.64], [0.27, -0.39], [0.49, -0.43], [0.75, 0.02], [0.7, 0.47], [0.48, 0.69], [0.06, 0.72], [-0.34, 0.82]] : [[-0.53, 0.78], [-0.61, 0.4], [-0.35, 0.11], [-0.28, -0.43], [-0.05, -0.74], [0.13, -0.26], [0.33, -0.58], [0.56, -0.11], [0.49, 0.45], [0.24, 0.72]];
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#716f60a8";
    ctx.beginPath();
    ctx.ellipse(4, r * 0.72, r * 0.86, r * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    shape.forEach(([px, py], point) => point ? ctx.lineTo(px * r, py * r) : ctx.moveTo(px * r, py * r));
    ctx.closePath();
    ctx.fillStyle = palette.base;
    ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.065);
    ctx.strokeStyle = palette.shade;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.48, r * 0.14);
    ctx.lineTo(-r * 0.28, -r * 0.24);
    ctx.lineTo(-r * 0.04, -r * 0.39);
    ctx.lineTo(r * 0.1, -r * 0.07);
    ctx.lineTo(r * 0.36, r * 0.08);
    ctx.lineTo(r * 0.5, r * 0.39);
    ctx.lineWidth = Math.max(2, r * 0.09);
    ctx.strokeStyle = palette.lit;
    ctx.stroke();
    ctx.fillStyle = "#d8d3bf";
    ctx.beginPath();
    if (index === 0) {
      ctx.ellipse(-r * 0.05, -r * 0.02, r * 0.11, r * 0.2, -0.18, 0, Math.PI * 2);
    } else if (index === 1) {
      ctx.ellipse(r * 0.23, r * 0.06, r * 0.1, r * 0.13, 0.2, 0, Math.PI * 2);
    } else {
      ctx.ellipse(-r * 0.08, r * 0.08, r * 0.1, r * 0.15, -0.12, 0, Math.PI * 2);
    }
    ctx.fill();
    if (state.selected === index && practice && !practice.hidden) {
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.16, r * 1.16, 0, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#e5c886";
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawPaper() {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#d9d1bc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#d3cab4";
    for (let y = 15; y < canvas.height; y += 32) {
      ctx.fillRect(0, y, canvas.width, 1);
    }
    ctx.strokeStyle = "#a39a81";
    ctx.lineWidth = 2;
    ctx.strokeRect(26, 25, canvas.width - 52, canvas.height - 50);
    ctx.strokeStyle = "#b4aa90";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(56, 90);
    ctx.bezierCurveTo(170, 52, 232, 92, 326, 62);
    ctx.moveTo(641, 84);
    ctx.bezierCurveTo(733, 112, 816, 48, 901, 82);
    ctx.stroke();
    [0, 1, 2].sort((a, b) => state.stones[a].y - state.stones[b].y).forEach(drawStone);
  }
  function refresh() {
    stoneButtons.forEach((button) => button.setAttribute("aria-pressed", String(Number(button.dataset.stone) === state.selected)));
    const spacing = readStoneSpacing(state);
    liveRead.textContent = `\u5F53\u524D\u89C2\u5BDF\uFF1A${spacing.text}`;
    drawPaper();
  }
  function persist() {
    const draft = loadCompositionDraft(chapter);
    draft.stone = {
      state: structuredClone(state),
      exampleViewed,
      passed: exampleViewed && reviewed && assessStoneComposition(state).passed
    };
    saveNote.textContent = saveCompositionDraft(chapter, draft) ? "\u77F3\u7A3F\u5DF2\u4FDD\u5B58\u5728\u672C\u673A\u6D4F\u89C8\u5668\uFF1B\u4E0D\u6539\u52A8\u5730\u56FE\u8349\u7A3F\u3001\u4E3B\u7EBF\u65D7\u6807\u6216\u516D\u827A\u3002" : "\u6B64\u6D4F\u89C8\u5668\u672A\u5141\u8BB8\u4FDD\u5B58\uFF1B\u672C\u9875\u4ECD\u53EF\u8BD5\u73A9\uFF0C\u79BB\u5F00\u540E\u53EF\u80FD\u4ECE\u5934\u5F00\u59CB\u3002";
  }
  function change(next, message) {
    if (JSON.stringify(next.stones) === JSON.stringify(state.stones) && next.selected === state.selected) return;
    history.push(structuredClone(state));
    state = next;
    reviewed = false;
    analysis.hidden = true;
    nextAfterReview.hidden = true;
    feedback.textContent = message;
    refresh();
    persist();
  }
  function selectStone(index) {
    change(selectStudyStone(state, index), `\u5DF2\u9009\u4E2D\u77F3\u6837${index + 1}\u3002\u62D6\u52A8\u5B83\uFF0C\u6216\u7528\u65B9\u5411\u952E\u632A\u52A8\u3002`);
    canvas.focus({ preventScroll: true });
  }
  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width * STONE_BOARD.width,
      y: (event.clientY - rect.top) / rect.height * STONE_BOARD.height
    };
  }
  function hitStone(point) {
    const ordered = [0, 1, 2].sort((a, b) => state.stones[b].y - state.stones[a].y);
    for (const index of ordered) {
      const stone = state.stones[index];
      if (Math.hypot(point.x - stone.x, point.y - stone.y) <= STONE_RADII[index] * 1.2) return index;
    }
    return null;
  }
  canvas.addEventListener("pointerdown", (event) => {
    const hit = hitStone(pointerPosition(event));
    if (hit === null) return;
    if (hit !== state.selected) state = selectStudyStone(state, hit);
    dragging = hit;
    dragOrigin = structuredClone(state);
    canvas.setPointerCapture(event.pointerId);
    refresh();
    feedback.textContent = `\u6B63\u5728\u79FB\u52A8\u77F3\u6837${hit + 1}\u3002\u653E\u4E0B\u540E\u770B\u4E00\u770B\u4E09\u77F3\u4E4B\u95F4\u7684\u7A7A\u9699\u3002`;
  });
  canvas.addEventListener("pointermove", (event) => {
    if (dragging === null || !canvas.hasPointerCapture(event.pointerId)) return;
    const index = dragging;
    const next = placeStudyStone(state, index, pointerPosition(event));
    if (JSON.stringify(next.stones) === JSON.stringify(state.stones)) return;
    state = next;
    reviewed = false;
    analysis.hidden = true;
    nextAfterReview.hidden = true;
    refresh();
  });
  function finishDrag() {
    if (dragging === null) return;
    if (dragOrigin && JSON.stringify(dragOrigin.stones) !== JSON.stringify(state.stones)) history.push(dragOrigin);
    dragging = null;
    dragOrigin = null;
    feedback.textContent = "\u77F3\u6837\u653E\u7A33\u4E86\u3002\u770B\u770B\u5F7C\u6B64\u76F8\u8FD1\u7684\u4E24\u5757\uFF0C\u4E0E\u8F83\u758F\u5F00\u7684\u90A3\u4E00\u5904\u3002";
    persist();
  }
  canvas.addEventListener("pointerup", finishDrag);
  canvas.addEventListener("pointercancel", finishDrag);
  stoneButtons.forEach((button) => button.addEventListener("click", () => selectStone(Number(button.dataset.stone))));
  nudgeButtons.forEach((button) => button.addEventListener("click", () => {
    const deltas = { left: [-12, 0], right: [12, 0], up: [0, -12], down: [0, 12] };
    const [dx, dy] = deltas[button.dataset.nudge ?? ""] ?? [0, 0];
    change(nudgeStudyStone(state, dx, dy), "\u8F7B\u8F7B\u632A\u4E86\u4E00\u6B65\u3002\u7EB8\u4E0A\u77F3\u5F62\u4ECD\u5728\uFF0C\u53EF\u4EE5\u63A5\u7740\u8C03\u6574\u3002");
  }));
  document.getElementById("startPractice").addEventListener("click", () => {
    exampleViewed = true;
    practice.hidden = false;
    refresh();
    feedback.textContent = "\u73B0\u5728\u5F00\u59CB\u6446\u7A3F\u3002\u5148\u4E0D\u8981\u8FFD\u6C42\u50CF\u54EA\u4E00\u5E45\uFF0C\u53EA\u770B\u4E09\u5757\u7684\u5173\u7CFB\u600E\u6837\u53D8\u5316\u3002";
    persist();
    practice.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.getElementById("review").addEventListener("click", () => {
    const result = assessStoneComposition(state);
    reviewed = result.passed;
    feedback.textContent = result.line;
    analysisText.textContent = result.passed ? "\u672C\u6B21\u59D4\u6258\u5B8C\u6210\uFF1A\u4E09\u77F3\u53EF\u5206\u8FA8\uFF0C\u5E76\u51FA\u73B0\u4E86\u758F\u5BC6\u53D8\u5316\u3002\u6539\u53D8\u5176\u4E2D\u4EFB\u4F55\u4E00\u5757\u7684\u4F4D\u7F6E\uFF0C\u90FD\u53EF\u4EE5\u518D\u8BD5\u65B0\u7684\u7EC4\u7EC7\u65B9\u5F0F\u3002" : `\u8FD8\u672A\u5408\u8FD9\u5F20\u5C0F\u7A3F\u7684\u660E\u793A\u6761\u4EF6\uFF1A${readStoneSpacing(state).text}`;
    analysis.hidden = false;
    nextAfterReview.hidden = !result.passed;
    refresh();
    persist();
  });
  document.getElementById("undo").addEventListener("click", () => {
    const previous = history.pop();
    if (!previous) {
      feedback.textContent = "\u8FD8\u6CA1\u6709\u53EF\u9000\u56DE\u7684\u4E00\u6B65\u3002";
      return;
    }
    state = previous;
    reviewed = false;
    analysis.hidden = true;
    nextAfterReview.hidden = true;
    refresh();
    feedback.textContent = "\u9000\u56DE\u4E0A\u4E00\u6B65\u3002\u53E6\u4E00\u79CD\u758F\u5BC6\u4E5F\u53EF\u4EE5\u8BD5\u8BD5\u770B\u3002";
    persist();
  });
  document.getElementById("reset").addEventListener("click", () => {
    history.push(structuredClone(state));
    state = structuredClone(INITIAL_STONE_STUDY);
    reviewed = false;
    analysis.hidden = true;
    nextAfterReview.hidden = true;
    refresh();
    feedback.textContent = "\u77F3\u6837\u56DE\u5230\u521D\u59CB\u4F4D\u7F6E\u3002\u5148\u8BD5\u7740\u8BA9\u4E00\u5BF9\u66F4\u76F8\u8FD1\uFF0C\u518D\u653E\u5F00\u53E6\u4E00\u5904\u3002";
    persist();
  });
  window.addEventListener("keydown", (event) => {
    if (!exampleViewed || practice.hidden || event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.toLowerCase();
    if (key === "1" || key === "2" || key === "3") {
      selectStone(Number(key) - 1);
      event.preventDefault();
      return;
    }
    if (document.activeElement !== canvas) return;
    const deltas = {
      arrowleft: [-6, 0],
      arrowright: [6, 0],
      arrowup: [0, -6],
      arrowdown: [0, 6]
    };
    const delta = deltas[key];
    if (!delta) return;
    change(nudgeStudyStone(state, delta[0], delta[1]), "\u7EC6\u7EC6\u8C03\u6574\u4E86\u4E00\u70B9\u4F4D\u7F6E\u3002");
    event.preventDefault();
  });
  var savedPass = restored?.passed === true && assessStoneComposition(state).passed;
  if (exampleViewed) {
    practice.hidden = false;
    if (savedPass) {
      nextAfterReview.hidden = false;
      analysis.hidden = false;
      analysisText.textContent = "\u4E0A\u6B21\u4EA4\u6210\u7684\u77F3\u7A3F\u5DF2\u7559\u5728\u6848\u4E0A\uFF1B\u4E5F\u53EF\u4EE5\u91CD\u65B0\u632A\u52A8\u77F3\u6837\uFF0C\u518D\u8BD5\u4E00\u5F20\u3002";
      feedback.textContent = "\u8FD9\u5F20\u7A3F\u5B50\u4ECD\u7B26\u5408\u77F3\u5320\u7684\u59D4\u6258\u3002";
    } else if (restored) {
      feedback.textContent = "\u5DF2\u63A5\u4E0A\u6B21\u6446\u7A3F\u3002\u77F3\u6837\u53EF\u4EE5\u7EE7\u7EED\u8C03\u6574\u3002";
    }
  }
  refresh();
})();
