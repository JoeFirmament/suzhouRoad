import { LIUYUAN_CHARACTER_SCALE } from './data/liuyuan-character-scale.js';
import { LIUYUAN_COURT_SPAWN, LIUYUAN_COURT_WINDOW_FOOT, LIUYUAN_COURT_WEST_EXIT,
  LIUYUAN_COURT_WORLD_W, LIUYUAN_COURT_WORLD_H, LIUYUAN_COURT_GEOMETRY } from './data/liuyuan-court-study.js';
import { SCENE_PLATES } from './data/scene-plates.js';
import { drawScholarAtFoot, drawScholarGroundShadow } from './render/scholar-sprite.js';

const sourceChoice = document.getElementById('courtCandidate') as HTMLSelectElement;
const footChoice = document.getElementById('courtCameraFoot') as HTMLSelectElement;
const routeChoice = document.getElementById('courtShowRoute') as HTMLInputElement;
const status = document.getElementById('courtComparisonStatus')!;
const canvases = ['courtCurrentCanvas', 'courtCandidateCanvas'].map((id) =>
  document.getElementById(id) as HTMLCanvasElement);
const candidateSources: Record<string, string> = {
  v1: '../research-art/liuyuan-court-pixel-cluster-candidate-v1.png',
  v2: '../research-art/liuyuan-court-pixel-cluster-candidate-v2.png',
};
const feet: Record<string, { x: number; y: number; dir: number }> = {
  entry: { ...LIUYUAN_COURT_SPAWN, dir: 1 },
  windows: { ...LIUYUAN_COURT_WINDOW_FOOT, dir: 3 },
  floor: { x: 790, y: 670, dir: 1 },
  bend: { x: 405, y: 550, dir: 3 },
  exit: { ...LIUYUAN_COURT_WEST_EXIT, dir: 3 },
};
const images = [new Image(), new Image()];
const prepared = images.map(() => {
  const canvas = document.createElement('canvas');
  // Same sampling stage as the playable court, for an honest side-by-side view.
  canvas.width = 888; canvas.height = 448;
  return canvas;
});
const ready = [false, false];
const sprite = new Image();
sprite.src = '../assets/characters/scholar-player-sprites-v1.png';
const route = SCENE_PLATES.find((plate) => plate.id === 'liuyuan-tree-court-no-water-study-v1')!.routeGraph!;

function draw(): void {
  const foot = feet[footChoice.value] ?? feet.entry;
  const scale = LIUYUAN_CHARACTER_SCALE.court;
  const viewW = 960 / scale.cameraZoom, viewH = 640 / scale.cameraZoom;
  const cameraX = Math.max(0, Math.min(LIUYUAN_COURT_WORLD_W - viewW, foot.x - viewW * .55));
  const cameraY = Math.max(0, Math.min(LIUYUAN_COURT_WORLD_H - viewH, foot.y - viewH * .78));
  canvases.forEach((canvas, index) => {
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#c6c6b9'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.scale(scale.cameraZoom, scale.cameraZoom);
    ctx.translate(-Math.round(cameraX), -Math.round(cameraY));
    if (ready[index]) ctx.drawImage(prepared[index], 0, 0, LIUYUAN_COURT_WORLD_W, LIUYUAN_COURT_WORLD_H);
    if (routeChoice.checked) {
      ctx.strokeStyle = '#bc4137'; ctx.lineWidth = 3;
      for (const edge of route.edges) {
        const from = route.nodes.find((node) => node.id === edge.from)!;
        const to = route.nodes.find((node) => node.id === edge.to)!;
        ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
      }
    }
    drawScholarGroundShadow(ctx, foot.x, foot.y, scale.worldHeight);
    if (sprite.complete && sprite.naturalWidth)
      drawScholarAtFoot(ctx, sprite, foot.dir, 0, foot.x, foot.y, scale.worldHeight);
    // Use the existing formal masks, so an attractive candidate cannot conceal
    // a shifted roof edge by always drawing the scholar above the background.
    if (ready[index]) for (const object of LIUYUAN_COURT_GEOMETRY) {
      const occluder = object.occluder;
      if (!occluder || foot.y >= occluder.depthY) continue;
      ctx.save(); ctx.beginPath();
      for (const polygon of occluder.polygons) {
        polygon.forEach(([x, y], pointIndex) => pointIndex ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.closePath();
      }
      ctx.clip();
      ctx.drawImage(prepared[index], 0, 0, LIUYUAN_COURT_WORLD_W, LIUYUAN_COURT_WORLD_H);
      ctx.restore();
    }
    ctx.restore();
  });
  status.textContent = `两侧同用正式镜头：960×640 · 身高 ${scale.worldHeight * scale.cameraZoom}px · 鞋底 (${foot.x}, ${foot.y})。${ready[1] ? '候选已载入，可看路线是否仍在可见石地上。' : '候选载入中。'}`;
}
images.forEach((image, index) => {
  image.addEventListener('load', () => {
    const ctx = prepared[index].getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, prepared[index].width, prepared[index].height);
    ctx.drawImage(image, 0, 0, prepared[index].width, prepared[index].height);
    ready[index] = true; draw();
  });
  image.addEventListener('error', () => { ready[index] = false; draw(); status.textContent = '研究图载入失败，请检查文件路径。'; });
});
sourceChoice.addEventListener('change', () => {
  ready[1] = false;
  images[1].src = candidateSources[sourceChoice.value];
  draw();
});
footChoice.addEventListener('change', draw);
routeChoice.addEventListener('change', draw);
sprite.addEventListener('load', draw);
images[0].src = '../assets/scene25d/liuyuan-tree-court-no-water-study-v1.png';
images[1].src = candidateSources[sourceChoice.value];
draw();
