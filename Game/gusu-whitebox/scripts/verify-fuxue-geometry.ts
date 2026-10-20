import { collides, moveEntity } from '../src/core/physics.js';
import { buildFuxueMap, HOME_INTERACTIONS } from '../src/data/fuxue.js';
import {
  FUXUE_ACTOR_PROFILE,
  validateFuxueGeometry,
} from '../src/data/fuxue-geometry.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const data = buildFuxueMap();
const hits = (x: number, y: number): boolean => collides(
  data.map, x, y, data.w, data.h, data.obstacles, FUXUE_ACTOR_PROFILE,
);

assert(validateFuxueGeometry().length === 0, '场景几何静态校验失败');

// 精确边界回归：树前、树侧、非入口墙、卧房入口、西学门洞。
assert(!hits(232, 228) && hits(232, 227), '树前应精确停在脚点 y=228');
const treeSideBoundary = Array.from({ length: 31 }, (_, index) => 240 + index)
  .find((x) => !hits(x, 175));
assert(treeSideBoundary !== undefined
  && treeSideBoundary >= 249
  && treeSideBoundary <= 260
  && hits(treeSideBoundary - 1), `树侧边界异常：${treeSideBoundary}`);
assert(!hits(80, 182) && hits(80, 181), '卧房非入口处应停在南墙外');
assert(!hits(134, 118) && hits(134, 117), '卧房入口应可进入，并停在后墙前');
assert(!hits(360, 320) && hits(330, 320), '西学门洞应可走，门旁墙体应阻挡');

// 实际移动也必须使用同一 profile，避免检测函数正确而主循环调用遗漏。
const treeApproach = { x: 232, y: 239 };
for (let index = 0; index < 20; index++) {
  moveEntity(data.map, treeApproach, 0, -1, data.w, data.h, data.obstacles, FUXUE_ACTOR_PROFILE);
}
assert(treeApproach.y === 228, `树前移动停止位置错误：${treeApproach.y}`);

/** 以 4px 步长检查从出生点能否接近交互锚点，作为关卡连通性验收。 */
function canReach(targetX: number, targetY: number, radius: number): boolean {
  const step = 4;
  const startX = Math.round(data.spawn.x / step) * step;
  const startY = Math.round(data.spawn.y / step) * step;
  const queue: Array<readonly [number, number]> = [[startX, startY]];
  const seen = new Set<string>([`${startX},${startY}`]);

  for (let cursor = 0; cursor < queue.length; cursor++) {
    const [x, y] = queue[cursor];
    if (Math.hypot(x - targetX, y - targetY) < radius) return true;
    for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (seen.has(key) || hits(nx, ny)) continue;
      seen.add(key);
      queue.push([nx, ny]);
    }
  }
  return false;
}

for (const interaction of HOME_INTERACTIONS) {
  assert(
    canReach(interaction.x, interaction.y, 27),
    `交互点不可达：${interaction.id} (${interaction.x}, ${interaction.y})`,
  );
}

console.log(`府学几何验证通过：${data.obstacles.length} 个精确碰撞体，${HOME_INTERACTIONS.length} 个交互点全部可达。`);
