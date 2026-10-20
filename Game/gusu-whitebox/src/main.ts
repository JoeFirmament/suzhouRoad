import { TILE, TUNING, VIEW_W, VIEW_H, PALETTE as P } from './config.js';
import { buildCanglangMap, buildCorridorSlice, buildCanglangGarden, type MapData } from './data/mapgen.js';
import { VIEW_SPOTS, SLICE_SPOTS, GARDEN_SPOTS, type ViewSpot } from './data/views.js';
import { Engine } from './core/engine.js';
import { moveEntity } from './core/physics.js';
import { STANDARD_PLAYER_PROFILE } from './core/geometry.js';
import { validateTileScene } from './core/scene-validation.js';
import { buildLayers, drawLayers, drawPlayer, drawMarkers } from './render/scene.js';
import { drawSceneLandmarks, drawTileGeometryDebug } from './render/geometry-debug.js';
import { buildSliceLayers } from './render/slice.js';
import { buildGarden25d } from './render/garden25d.js';
import { drawFrameUI, drawToast } from './render/frameui.js';
import { Viewfinder } from './ui/viewfinder.js';
import { hasStoryFlag, loadProgress, markStoryFlag } from './core/progression.js';

/* ---------- 启动 ---------- */
const canvas = document.getElementById('game') as HTMLCanvasElement;
canvas.width = VIEW_W; canvas.height = VIEW_H;
const ctx = canvas.getContext('2d')!;
ctx.imageSmoothingEnabled = false;
const params = new URLSearchParams(location.search);
const debugGeometry = params.get('debug') === 'geometry';

const MODE = location.hash === '#slice' ? 'slice'
  : (location.hash === '#garden' || location.pathname.endsWith('garden.html')) ? 'garden' : 'main';
const data: MapData =
  MODE === 'slice' ? buildCorridorSlice() :
  MODE === 'garden' ? buildCanglangGarden() : buildCanglangMap();
if (debugGeometry) {
  const geometryErrors = validateTileScene(MODE, data, STANDARD_PLAYER_PROFILE);
  if (geometryErrors.length) console.warn('[场景几何校验]', ...geometryErrors);
  else console.info(`[场景几何校验] ${MODE} 通过`);
}
const worldW = data.w * TILE, worldH = data.h * TILE;
const layers =
  MODE === 'slice' ? buildSliceLayers(data) :
  MODE === 'garden' ? null : buildLayers(data);
const g25 = MODE === 'garden' ? buildGarden25d(data) : null;
const spots: ViewSpot[] =
  MODE === 'slice' ? SLICE_SPOTS :
  MODE === 'garden' ? GARDEN_SPOTS : VIEW_SPOTS;
const vf = new Viewfinder(spots);
const engine = new Engine();
let storyBlocking = false;

const player = { x: data.spawn.x, y: data.spawn.y, dir: 0, moving: false, wt: 0 };
const cam = { x: 0, y: 0 };

/** 相机钳制：地图比视口矮/窄时固定居中（负值偏移），否则 [0, max]。 */
function clampCam(v: number, max: number): number {
  if (max <= 0) return max / 2; // max 为负 → 居中偏移
  return v < 0 ? 0 : v > max ? max : v;
}

let toastText = '', toastAt = 0;
let now = 0;

/** 特写倍率：整园模式 3×（对齐参考图取景——一屏约 10×7 格），其余 1×。 */
const ZOOM = MODE === 'garden' ? 3 : 1;
const viewW = Math.floor(VIEW_W / ZOOM);
const viewH = Math.floor(VIEW_H / ZOOM);

/* ---------- 输入接线 ---------- */
engine.onInteract = () => {
  if (storyBlocking) return;
  if (vf.interact(player.x, player.y, now)) return;
};
engine.onCancel = () => vf.cancel();
engine.onTap = () => {
  if (storyBlocking) return;
  if (vf.interact(player.x, player.y, now)) return;
};
engine.attachKeys();
engine.attachTap(canvas);
engine.attachTouchControls(document.querySelector('[data-touch-controls]'));

vf.onAllCaptured = () => {
  toastText =
    MODE === 'slice' ? '三窗合 · 试铺段通过' :
    MODE === 'garden' ? '三窗合 · 沧浪亭' : '园谱 +1 · 沧浪亭';
  toastAt = now;
};

// #view 调试钩子：直达取景画面
if (location.hash === '#view') {
  vf.state = { mode: 'framing', idx: 0, enteredAt: 0 };
}

// 截图钩子：#garden:x29y20 → 直接落位（tile 坐标）
const sp = location.hash.match(/x(\d+)y(\d+)/);
if (sp) { player.x = +sp[1] * TILE + 8; player.y = +sp[2] * TILE + 14; }

/* ---------- 首次入园：只交代空间问题，不替代自由探索 ---------- */
const arrivalLayer = document.getElementById('gardenArrival') as HTMLElement | null;
if (MODE === 'garden' && arrivalLayer) {
  const progress = loadProgress();
  const forcedArrival = params.get('scene') === 'arrival';
  const closeArrival = () => {
    markStoryFlag('canglang-arrival-seen');
    arrivalLayer.hidden = true;
    storyBlocking = false;
    canvas.focus();
  };
  document.getElementById('arrivalExplore')?.addEventListener('click', closeArrival);
  document.getElementById('arrivalCorridor')?.addEventListener('click', () => markStoryFlag('canglang-arrival-seen'));
  if (forcedArrival || !hasStoryFlag(progress, 'canglang-arrival-seen')) {
    arrivalLayer.hidden = false;
    storyBlocking = true;
    document.getElementById('arrivalExplore')?.focus();
  }
}

/* ---------- 主循环 ---------- */
engine.start((dt) => {
  now = performance.now();
  vf.update(now);

  // 移动（取景中禁走——停步即取景）
  const a = engine.axis();
  player.moving = !!(a.dx || a.dy) && vf.state.mode === 'idle' && !storyBlocking;
  if (player.moving) {
    if (Math.abs(a.dx) >= Math.abs(a.dy)) player.dir = a.dx < 0 ? 1 : 2;
    else player.dir = a.dy < 0 ? 3 : 0;
    player.wt += dt;
    moveEntity(
      data.map,
      player,
      a.dx * TUNING.moveSpeed * dt,
      a.dy * TUNING.moveSpeed * dt,
      data.w,
      data.h,
      [],
      STANDARD_PLAYER_PROFILE,
    );
  } else {
    player.wt = 0;
  }

  // 镜头（y 方向：地图矮于视口时固定居中）
  const targetX = clampCam(player.x - viewW / 2, worldW - viewW);
  const targetY = worldH >= viewH
    ? clampCam(player.y - viewH / 2, worldH - viewH)
    : -(viewH - worldH) / 2;
  cam.x += (targetX - cam.x) * TUNING.camLerp;
  cam.y += (targetY - cam.y) * TUNING.camLerp;

  /* ---- 渲染 ---- */
  ctx.fillStyle = P.paper;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (MODE === 'garden' && g25) {
    // 2.5D 特写：3× 缩放，世界视口 320×200（≈20×12.5 格）
    ctx.save();
    ctx.scale(ZOOM, ZOOM);
    ctx.drawImage(g25.ground, Math.round(-cam.x), Math.round(-cam.y));
    const pyRow = Math.floor(player.y / TILE);
    const y0 = Math.max(0, Math.floor(cam.y / TILE) - 1);
    const y1 = Math.min(data.h - 1, Math.ceil((cam.y + viewH) / TILE) + 1);
    let playerDrawn = pyRow < y0;
    for (let ty = y0; ty <= y1; ty++) {
      if (ty === pyRow) { drawPlayer(ctx, player, cam); playerDrawn = true; }
      ctx.drawImage(g25.strips[ty], Math.round(-cam.x), Math.round(ty * TILE - 48 - cam.y));
    }
    if (!playerDrawn) drawPlayer(ctx, player, cam);
    drawMarkers(ctx, spots, cam, vf.captured, now);
    if (debugGeometry) {
      drawTileGeometryDebug(ctx, data, cam, { w: viewW, h: viewH }, player, STANDARD_PLAYER_PROFILE);
      if (data.landmarks) drawSceneLandmarks(ctx, data.landmarks, cam);
    }
    ctx.restore();
  } else if (layers) {
    drawLayers(ctx, layers, cam);
    drawPlayer(ctx, player, cam);
    drawMarkers(ctx, spots, cam, vf.captured, now);
    if (debugGeometry) {
      drawTileGeometryDebug(ctx, data, cam, { w: VIEW_W, h: VIEW_H }, player, STANDARD_PLAYER_PROFILE);
      if (data.landmarks) drawSceneLandmarks(ctx, data.landmarks, cam);
    }
  }

  const fi = vf.framingIdx;
  if (fi !== null) {
    const beat = vf.state.mode === 'beat';
    drawFrameUI(ctx, spots[fi], vf.captured.size, spots.length, now, beat);
  }

  if (toastText) drawToast(ctx, toastText, now - toastAt);

  // 底部提示
  if (vf.state.mode === 'idle' && now - toastAt > 3000) {
    ctx.fillStyle = 'rgba(43,40,36,.55)';
    ctx.fillRect(0, VIEW_H - 26, VIEW_W, 26);
    ctx.fillStyle = '#f2ead6';
    ctx.font = '13px "PingFang SC",sans-serif';
    ctx.fillText(
      MODE === 'slice'
        ? '复廊试铺 v0.3 · 60 米 · WASD/方向键 移动 · 走近朱框窗按 E 取景 · Esc 退出'
        : MODE === 'garden'
        ? '沧浪亭 2.5D 特写 3× · WASD/方向键 游走 · 朱框窗按 E 取景 · Esc 退出取景'
        : '白模 v0.1 · WASD/方向键 移动 · 走近漏窗光圈按 E 取景 · Esc 退出取景',
      14, VIEW_H - 9);
  }
});
