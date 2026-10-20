(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const loading = document.getElementById("loading");
  const toast = document.getElementById("toast");
  const objective = document.getElementById("objective");
  const resetButton = document.getElementById("resetButton");
  const stampList = document.getElementById("stampList");
  const image = new Image();

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 沿生成图中的廊桥中心线布置可行走路径，坐标基于 627 × 627 逻辑画布。
  const route = [
    { x: 51, y: 306 },
    { x: 154, y: 279 },
    { x: 260, y: 250 },
    { x: 369, y: 261 },
    { x: 475, y: 288 },
    { x: 572, y: 316 }
  ];

  // 由同一张底图重绘的前景区域：廊顶和近岸植被会自然遮住人物；朱栏另行补绘。
  const occlusionPolygons = [
    [[0, 91], [112, 66], [158, 115], [151, 196], [69, 219], [0, 207]],
    [[145, 63], [627, 134], [627, 226], [535, 218], [425, 203], [310, 188], [151, 197]],
    [[0, 252], [73, 242], [87, 331], [0, 366]],
    [[552, 248], [627, 250], [627, 375], [573, 341]]
  ];

  const stamps = [
    { id: "vermilion", label: "朱栏", t: 0.22, lane: -2, collected: false },
    { id: "reflection", label: "水影", t: 0.52, lane: 5, collected: false },
    { id: "rock", label: "湖石", t: 0.82, lane: -4, collected: false }
  ];

  const keys = new Set();
  const controls = { forward: false, back: false, up: false, down: false };
  const state = {
    t: 0.1,
    lane: 0,
    targetT: null,
    direction: 1,
    moving: false,
    lastTime: 0,
    elapsed: 0,
    completed: false
  };

  const lengths = [];
  let totalLength = 0;
  for (let i = 0; i < route.length - 1; i += 1) {
    const dx = route[i + 1].x - route[i].x;
    const dy = route[i + 1].y - route[i].y;
    const length = Math.hypot(dx, dy);
    lengths.push(length);
    totalLength += length;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function pointOnRoute(t, lane = 0) {
    let remaining = clamp(t, 0, 1) * totalLength;
    for (let i = 0; i < lengths.length; i += 1) {
      if (remaining <= lengths[i] || i === lengths.length - 1) {
        const ratio = clamp(remaining / lengths[i], 0, 1);
        const a = route[i];
        const b = route[i + 1];
        const tx = (b.x - a.x) / lengths[i];
        const ty = (b.y - a.y) / lengths[i];
        return {
          x: a.x + (b.x - a.x) * ratio - ty * lane,
          y: a.y + (b.y - a.y) * ratio + tx * lane,
          tx,
          ty
        };
      }
      remaining -= lengths[i];
    }
    return { ...route[route.length - 1], tx: 1, ty: 0 };
  }

  function nearestRouteT(x, y) {
    let bestDistance = Infinity;
    let bestT = 0;
    let traversed = 0;
    for (let i = 0; i < route.length - 1; i += 1) {
      const a = route[i];
      const b = route[i + 1];
      const vx = b.x - a.x;
      const vy = b.y - a.y;
      const ratio = clamp(((x - a.x) * vx + (y - a.y) * vy) / (vx * vx + vy * vy), 0, 1);
      const px = a.x + vx * ratio;
      const py = a.y + vy * ratio;
      const distance = Math.hypot(x - px, y - py);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestT = (traversed + lengths[i] * ratio) / totalLength;
      }
      traversed += lengths[i];
    }
    return bestDistance < 72 ? bestT : null;
  }

  function drawWaterShimmer(time) {
    if (prefersReducedMotion) return;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 325);
    ctx.lineTo(627, 325);
    ctx.lineTo(627, 627);
    ctx.lineTo(0, 627);
    ctx.clip();
    ctx.fillStyle = "rgba(202, 231, 211, 0.11)";
    for (let i = 0; i < 16; i += 1) {
      const y = 348 + i * 15;
      const offset = Math.round(Math.sin(time * 0.0013 + i) * 14);
      const x = (i * 47 + offset + 640) % 640 - 20;
      ctx.fillRect(x, y, 20 + (i % 3) * 8, 2);
      ctx.fillRect((x + 260) % 640, y + 5, 12 + (i % 4) * 6, 1);
    }
    ctx.restore();
  }

  function drawStamp(stamp, time) {
    if (stamp.collected) return;
    const p = pointOnRoute(stamp.t, stamp.lane);
    const bob = prefersReducedMotion ? 0 : Math.round(Math.sin(time * 0.004 + stamp.t * 8) * 2);
    const x = Math.round(p.x);
    const y = Math.round(p.y - 18 + bob);
    ctx.fillStyle = "rgba(26, 28, 20, 0.35)";
    ctx.fillRect(x - 5, Math.round(p.y + 1), 11, 3);
    ctx.fillStyle = "#f1d27d";
    ctx.fillRect(x - 4, y - 4, 9, 9);
    ctx.fillStyle = "#a87335";
    ctx.fillRect(x - 2, y - 2, 5, 5);
    ctx.fillStyle = "#fff1b7";
    ctx.fillRect(x - 2, y - 3, 3, 2);
  }

  function drawPlayer(time) {
    const p = pointOnRoute(state.t, state.lane);
    const frame = state.moving ? Math.floor(time / 130) % 2 : 0;
    const bob = state.moving && !prefersReducedMotion ? frame : 0;
    const x = Math.round(p.x);
    const y = Math.round(p.y - bob);

    ctx.fillStyle = "rgba(21, 27, 22, 0.45)";
    ctx.fillRect(x - 8, y + 1, 17, 4);

    ctx.fillStyle = "#2e281f";
    ctx.fillRect(x - 6, y - 50, 13, 8);
    ctx.fillRect(x - 8, y - 45, 17, 6);

    ctx.fillStyle = "#d7b28b";
    ctx.fillRect(x - 5, y - 39, 11, 10);
    ctx.fillStyle = "#342c22";
    ctx.fillRect(x - 8, y - 29, 17, 27);
    ctx.fillStyle = "#d7c9a6";
    ctx.fillRect(x - 6, y - 27, 13, 23);
    ctx.fillStyle = "#7f4935";
    ctx.fillRect(x - 6, y - 11, 13, 4);

    ctx.fillStyle = "#4c3b2e";
    const leftStep = state.direction > 0 ? frame * 2 : (1 - frame) * 2;
    ctx.fillRect(x - 5 - leftStep, y + 1, 4, 6);
    ctx.fillRect(x + 2 + leftStep, y + 1, 4, 6);

    ctx.fillStyle = "#b7a780";
    const arm = state.direction > 0 ? 1 : -1;
    ctx.fillRect(x + arm * 9 - 2, y - 27 + frame, 5, 15);
  }

  function drawForegroundRail() {
    const upper = route.map(point => ({ x: point.x, y: point.y - 16 }));
    ctx.lineCap = "square";
    ctx.lineJoin = "miter";
    ctx.strokeStyle = "#702a26";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(upper[0].x, upper[0].y);
    for (let i = 1; i < upper.length; i += 1) ctx.lineTo(upper[i].x, upper[i].y);
    ctx.stroke();

    ctx.strokeStyle = "#9c4336";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(upper[0].x, upper[0].y - 2);
    for (let i = 1; i < upper.length; i += 1) ctx.lineTo(upper[i].x, upper[i].y - 2);
    ctx.stroke();

    for (let t = 0.04; t < 0.99; t += 0.055) {
      const p = pointOnRoute(t);
      ctx.fillStyle = "#702a26";
      ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 18, 3, 19);
    }
  }

  function redrawOcclusion() {
    for (const polygon of occlusionPolygons) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(polygon[0][0], polygon[0][1]);
      for (let i = 1; i < polygon.length; i += 1) ctx.lineTo(polygon[i][0], polygon[i][1]);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(image, 0, 0, WIDTH, HEIGHT);
      ctx.restore();
    }
  }

  function draw(time) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0, WIDTH, HEIGHT);
    drawWaterShimmer(time);
    drawPlayer(time);
    drawForegroundRail();
    redrawOcclusion();
    stamps.forEach(stamp => drawStamp(stamp, time));
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => toast.classList.remove("is-visible"), 1800);
  }

  function updateStampUI() {
    for (const stamp of stamps) {
      const item = stampList.querySelector(`[data-stamp="${stamp.id}"]`);
      item.classList.toggle("is-collected", stamp.collected);
      item.textContent = `${stamp.collected ? "✓ " : ""}${stamp.label}`;
    }
    const count = stamps.filter(stamp => stamp.collected).length;
    objective.textContent = count === stamps.length ? "印记齐备，继续走到廊桥右岸" : `已收集 ${count} / ${stamps.length} 枚景观印记`;
  }

  function collectNearbyStamps() {
    for (const stamp of stamps) {
      if (!stamp.collected && Math.abs(state.t - stamp.t) < 0.035) {
        stamp.collected = true;
        showToast(`已收集 · ${stamp.label}`);
        updateStampUI();
      }
    }
    if (!state.completed && stamps.every(stamp => stamp.collected) && state.t > 0.965) {
      state.completed = true;
      objective.textContent = "游历完成 · 回望小飞虹水影";
      showToast("小飞虹游历完成");
    }
  }

  function update(delta) {
    const forward = keys.has("ArrowRight") || keys.has("KeyD") || controls.forward;
    const back = keys.has("ArrowLeft") || keys.has("KeyA") || controls.back;
    const up = keys.has("ArrowUp") || keys.has("KeyW") || controls.up;
    const down = keys.has("ArrowDown") || keys.has("KeyS") || controls.down;
    const axis = Number(forward) - Number(back);
    const laneAxis = Number(down) - Number(up);

    state.moving = axis !== 0 || laneAxis !== 0 || state.targetT !== null;
    if (axis !== 0) {
      state.direction = axis;
      state.targetT = null;
      state.t = clamp(state.t + axis * delta * 0.00018, 0.02, 0.985);
    } else if (state.targetT !== null) {
      const distance = state.targetT - state.t;
      if (Math.abs(distance) < 0.004) {
        state.t = state.targetT;
        state.targetT = null;
      } else {
        state.direction = Math.sign(distance);
        state.t = clamp(state.t + Math.sign(distance) * delta * 0.0002, 0.02, 0.985);
      }
    }
    state.lane = clamp(state.lane + laneAxis * delta * 0.02, -8, 8);
    collectNearbyStamps();
  }

  function frame(time) {
    const delta = Math.min(time - state.lastTime || 16, 40);
    state.lastTime = time;
    state.elapsed += delta;
    update(delta);
    draw(time);
    requestAnimationFrame(frame);
  }

  function reset() {
    state.t = 0.1;
    state.lane = 0;
    state.targetT = null;
    state.completed = false;
    stamps.forEach(stamp => { stamp.collected = false; });
    updateStampUI();
    showToast("已回到廊桥西岸");
    canvas.focus();
  }

  window.addEventListener("keydown", event => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code)) {
      event.preventDefault();
      if (!event.repeat) {
        if (event.code === "ArrowRight" || event.code === "KeyD") state.t = clamp(state.t + 0.012, 0.02, 0.985);
        if (event.code === "ArrowLeft" || event.code === "KeyA") state.t = clamp(state.t - 0.012, 0.02, 0.985);
        if (event.code === "ArrowDown" || event.code === "KeyS") state.lane = clamp(state.lane + 1, -8, 8);
        if (event.code === "ArrowUp" || event.code === "KeyW") state.lane = clamp(state.lane - 1, -8, 8);
      }
      keys.add(event.code);
    }
  });
  window.addEventListener("keyup", event => keys.delete(event.code));
  window.addEventListener("blur", () => keys.clear());

  canvas.addEventListener("pointerdown", event => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * WIDTH / rect.width;
    const y = (event.clientY - rect.top) * HEIGHT / rect.height;
    const target = nearestRouteT(x, y);
    if (target === null) {
      showToast("请点击廊桥范围");
      return;
    }
    state.targetT = clamp(target, 0.02, 0.985);
    canvas.focus();
  });

  document.querySelectorAll("[data-control]").forEach(button => {
    const name = button.dataset.control;
    const set = value => {
      controls[name] = value;
      button.classList.toggle("is-active", value);
    };
    button.addEventListener("pointerdown", event => { event.preventDefault(); button.setPointerCapture(event.pointerId); set(true); });
    button.addEventListener("pointerup", () => set(false));
    button.addEventListener("pointercancel", () => set(false));
    button.addEventListener("lostpointercapture", () => set(false));
    button.addEventListener("click", () => {
      if (name === "forward") state.t = clamp(state.t + 0.018, 0.02, 0.985);
      if (name === "back") state.t = clamp(state.t - 0.018, 0.02, 0.985);
      if (name === "down") state.lane = clamp(state.lane + 1, -8, 8);
      if (name === "up") state.lane = clamp(state.lane - 1, -8, 8);
    });
  });

  resetButton.addEventListener("click", reset);
  image.addEventListener("load", () => {
    loading.classList.add("is-hidden");
    updateStampUI();
    canvas.focus();
    requestAnimationFrame(frame);
  });
  image.addEventListener("error", () => {
    loading.textContent = "底图载入失败，请确认 assets/xiaofeihong-pixel.png 存在。";
  });
  image.src = "assets/xiaofeihong-pixel.png";
})();
