import { SCHOLAR_FRAMES, SHEN_YANQIU_FRAMES, drawScholarAtFoot, drawShenYanqiuAtFoot,
  perspectiveScholarHeight, scholarFrame, shenYanqiuFrame } from '../src/render/scholar-sprite.js';
import { LIUYUAN_WINDOW_ROOM_ACTOR_SCALE, LIUYUAN_WINDOW_ROOM_SPAWN } from '../src/data/liuyuan-window-room-study.js';
import { LIUYUAN_YOUYICUN_ACTOR_SCALE, LIUYUAN_YOUYICUN_FEET } from '../src/data/liuyuan-youyicun-study.js';
import { readFileSync } from 'node:fs';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(SCHOLAR_FRAMES.length === 4, '书生须有四个朝向');
for (let direction = 0; direction < 4; direction++) {
  assert(SCHOLAR_FRAMES[direction].length === 3, `朝向 ${direction} 须有三帧`);
  for (let phase = 0; phase < 3; phase++) {
    const f = scholarFrame(direction, phase);
    assert(f.sx >= 0 && f.sy >= 0 && f.sw > 0 && f.sh > 0
      && f.sx + f.sw <= 1086 && f.sy + f.sh <= 1448,
    `朝向 ${direction} 第 ${phase} 帧超出源图`);
    let destination: number[] = [];
    const ctx = { drawImage: (...args: unknown[]) => { destination = args.slice(5) as number[]; } };
    drawScholarAtFoot(ctx as unknown as CanvasRenderingContext2D,
      {} as HTMLImageElement, direction, phase, 700, 900, 82);
    const [x, y, w, h] = destination;
    assert(Math.abs(x + w / 2 - 700) <= .5 && y + h === 900,
      `朝向 ${direction} 第 ${phase} 帧没有把人物双脚锚在逻辑脚点`);
  }
}
assert(perspectiveScholarHeight(300, 300, 950, 56, 82) === 56
  && perspectiveScholarHeight(950, 300, 950, 56, 82) === 82
  && perspectiveScholarHeight(638, 300, 950, 56, 82) === 70,
  '近大远小的视觉尺寸未按脚点插值');

assert(SHEN_YANQIU_FRAMES.length === 4, '沈砚秋须有四个朝向');
for (let direction = 0; direction < 4; direction++) {
  assert(SHEN_YANQIU_FRAMES[direction].length === 3, `沈砚秋朝向 ${direction} 须有三帧`);
  for (let phase = 0; phase < 3; phase++) {
    const f = shenYanqiuFrame(direction, phase);
    assert(f.sx >= 0 && f.sy >= 0 && f.sw > 0 && f.sh > 0
      && f.sx + f.sw <= 1086 && f.sy + f.sh <= 1448,
    `沈砚秋朝向 ${direction} 第 ${phase} 帧超出源图`);
    let destination: number[] = [];
    const ctx = { drawImage: (...args: unknown[]) => { destination = args.slice(5) as number[]; } };
    drawShenYanqiuAtFoot(ctx as unknown as CanvasRenderingContext2D,
      {} as HTMLImageElement, direction, phase, 480, 488, 164);
    const [x, y, w, h] = destination;
    assert(Math.abs(x + w / 2 - 480) <= .5 && y + h === 488,
      `沈砚秋朝向 ${direction} 第 ${phase} 帧没有用实测鞋底对齐脚点`);
    assert(w / h > .43 && w / h < .57, `沈砚秋朝向 ${direction} 第 ${phase} 帧显示宽高比例异常`);
  }
}
const scale = LIUYUAN_WINDOW_ROOM_ACTOR_SCALE;
const spawnHeight = perspectiveScholarHeight(LIUYUAN_WINDOW_ROOM_SPAWN.y,
  scale.farFootY, scale.nearFootY, scale.farHeight, scale.nearHeight);
assert(spawnHeight >= 160 && spawnHeight <= 168, '三窗房间出生点人物高度偏离视觉标定');
assert(spawnHeight / scale.centralWindowVisualHeight > .90
  && spawnHeight / scale.centralWindowVisualHeight < 1.02,
  '三窗房间人物与中央景窗的图面比例偏离标定带');
assert(perspectiveScholarHeight(scale.farFootY, scale.farFootY, scale.nearFootY,
  scale.farHeight, scale.nearHeight) === scale.farHeight
  && perspectiveScholarHeight(scale.nearFootY, scale.farFootY, scale.nearFootY,
    scale.farHeight, scale.nearHeight) === scale.nearHeight,
  '三窗房间近大远小的端点高度错误');
const windowStudySource = readFileSync('src/liuyuan-window-study.ts', 'utf8');
assert(!/drawImage\(scholar,\s*frame\s*\*\s*362/.test(windowStudySource),
  '三窗房间不得回退为透明整格裁片');
for (const scene of ['entry', 'court', 'flower', 'lvyin', 'guanyun', 'stone-forest', 'east-hall']) {
  const source = readFileSync(`src/liuyuan-${scene}.ts`, 'utf8');
  assert(source.includes('drawScholarAtFoot('), `${scene} 未使用逐帧裁片和鞋底锚点`);
  assert(!/drawImage\(sprite,\s*frame\s*\*\s*362/.test(source), `${scene} 回退到透明整格裁图`);
}
assert(perspectiveScholarHeight(656, 250, 656, 44, 55) === 55
  && perspectiveScholarHeight(250, 250, 656, 44, 55) === 44,
  '入口人物近远尺度端点错误');
const youyicun = LIUYUAN_YOUYICUN_ACTOR_SCALE;
const gateHeight = perspectiveScholarHeight(LIUYUAN_YOUYICUN_FEET.gateFront.y,
  youyicun.farFootY, youyicun.nearFootY, youyicun.farHeight, youyicun.nearHeight);
assert(gateHeight / youyicun.gateOpeningVisualHeight > .56
  && gateHeight / youyicun.gateOpeningVisualHeight < .64,
  '又一村研究图的人物与圆门图面比例偏离视觉标定带');
console.log('两套书生图集逐帧裁片和鞋底对齐通过；三窗比例、留园七幕旧裁图回归检查通过。');
