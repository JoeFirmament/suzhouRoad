import { readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { SCENE_PLATES } from '../src/data/scene-plates.js';
import { SCENE_EVIDENCE } from '../src/data/scene-evidence.js';
import { validateRouteGraph } from '../src/core/route-graph.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const sceneIds = new Set<string>();
for (const plate of SCENE_PLATES) {
  assert(!sceneIds.has(plate.id), `重复场景 ID：${plate.id}`);
  sceneIds.add(plate.id);
  const evidence = SCENE_EVIDENCE.find((item) => item.id === plate.id);
  if (plate.storyAnchors?.length) {
    assert(evidence,
      `${plate.id}: 有剧本锚点的底图必须有证据卡；可玩底图不应被误判为 reference`);
  }
  // World art may end inside the final 16px tile (e.g. the 793px corridor and
  // 1672×941 entrance research plate). The grid must cover it without a whole
  // extra column or row; exact multiples are not required.
  assert(plate.width <= plate.tileW * 16 && plate.tileW * 16 - plate.width < 16
    && plate.height <= plate.tileH * 16 && plate.tileH * 16 - plate.height < 16,
  `${plate.id}: 世界尺寸和 Tile 尺寸不一致`);
  const path = resolve(process.cwd(), plate.asset);
  const asset = readFileSync(path);
  let imageW: number, imageH: number;
  if (extname(path) === '.svg') {
    const root = asset.toString('utf8').match(/<svg\b[^>]*>/)?.[0];
    assert(root, `${plate.id}: 底图不是 SVG`);
    const width = root.match(/\bwidth="(\d+)"/)?.[1];
    const height = root.match(/\bheight="(\d+)"/)?.[1];
    assert(width && height, `${plate.id}: SVG 缺少明确像素尺寸`);
    imageW = Number(width); imageH = Number(height);
  } else {
    assert(asset.subarray(1, 4).toString() === 'PNG', `${plate.id}: 底图不是 PNG`);
    imageW = asset.readUInt32BE(16); imageH = asset.readUInt32BE(20);
  }
  // 底图可用不同美术分辨率（复廊约 2×、留园三窗约 1.74×），但宽高缩尺须一致。
  const scaleX = imageW / plate.width, scaleY = imageH / plate.height;
  assert(scaleX >= .5 && scaleY >= .5 && Math.abs(scaleX / scaleY - 1) <= .03,
    `${plate.id}: 底图缩尺或宽高比异常 (${imageW}x${imageH} vs ${plate.width}x${plate.height})`);
  const anchorIds = new Set<string>();
  for (const item of plate.storyAnchors ?? []) {
    assert(!anchorIds.has(item.id), `${plate.id}: 重复锚点 ${item.id}`);
    anchorIds.add(item.id);
    assert(item.x >= 0 && item.x <= plate.width && item.y >= 0 && item.y <= plate.height,
      `${plate.id}: 锚点 ${item.id} 越界`);
    // Independent geometry research is not a chapter beat. Keep the exception
    // narrow so a playable/story scene cannot quietly omit its CH reference.
    const researchOnly = item.scriptRef === '独立几何研究'
      && (evidence?.state === 'geometry' || evidence?.state === 'reference')
      && evidence.redLines.some((line) => line.includes('不接 CH3'));
    if (item.routeRequired === false) assert(plate.id === 'liuyuan-entry-lower-camera-study-v1'
      && item.kind === 'npc' && evidence?.state === 'reference',
    `${plate.id}: 只有隔离的低机位 NPC 摆位研究可暂不计入路线行动`);
    assert(/^CH\d+-\d+/.test(item.scriptRef) || researchOnly,
      `${plate.id}: 锚点 ${item.id} 缺失剧本场次或研究隔离说明`);
    assert(Boolean(item.note.trim()), `${plate.id}: 锚点 ${item.id} 缺少制作说明`);
  }
  if (plate.routeGraph) {
    const errors = validateRouteGraph(plate.routeGraph, plate.storyAnchors ?? [], plate.width, plate.height);
    assert(errors.length === 0, `${plate.id}: 路线骨架失败：${errors.join('；')}`);
  }
  console.log(`${plate.label}: ${imageW}×${imageH}, ${(plate.storyAnchors ?? []).length} 个剧本锚点, ${plate.routeGraph?.edges.length ?? 0} 条候选路线`);
}
for (const required of [
  'canglang-whole-garden-study-v2',
  'liuyuan-whole-garden-study-v2',
  'liuyuan-tree-court-no-water-study-v1',
  'liuyuan-entrance-topology-study',
  'zhuozheng-whole-garden-study-v4',
  'ouyuan-whole-garden-study',
  'yipu-whole-garden-study-v3',
]) assert(sceneIds.has(required), `缺失当前制作底图：${required}`);
const ouyuan = SCENE_PLATES.find((item) => item.id === 'ouyuan-whole-garden-study');
assert(ouyuan?.routeGraph, '耦园必须提供通路骨架');
const disconnected = structuredClone(ouyuan.routeGraph);
const westEdge = disconnected.edges.find((edge) => edge.from === 'west-portal' && edge.to === 'west-well');
assert(westEdge, '找不到耦园西园门路线');
westEdge.state = 'blocked';
assert(validateRouteGraph(disconnected, ouyuan.storyAnchors ?? [], ouyuan.width, ouyuan.height)
  .some((error) => error.includes('ouyuan-west-well')),
  '禁行门边必须使西园剧情目标不可达');
const shifted = structuredClone(ouyuan.routeGraph);
const pondNode = shifted.nodes.find((node) => node.id === 'east-pond');
assert(pondNode, '找不到耦园东园池路线点');
pondNode.x += 64;
assert(validateRouteGraph(shifted, ouyuan.storyAnchors ?? [], ouyuan.width, ouyuan.height)
  .some((error) => error.includes('相距超过 32px')),
  '剧情锚点与路线节点错位必须报警');
const upperFloor = structuredClone(ouyuan.routeGraph);
const library = upperFloor.nodes.find((node) => node.id === 'west-library');
const libraryEdge = upperFloor.edges.find((edge) => edge.to === 'west-library');
assert(library && libraryEdge, '缺失西园藏书楼节点/连线');
library.level = 1;
assert(validateRouteGraph(upperFloor, ouyuan.storyAnchors ?? [], ouyuan.width, ouyuan.height)
  .some((error) => error.includes('跨层只能通过')),
  '上下层普通步行边必须报警');
libraryEdge.via = 'stairs';
assert(!validateRouteGraph(upperFloor, ouyuan.storyAnchors ?? [], ouyuan.width, ouyuan.height)
  .some((error) => error.includes('跨层只能通过')),
  '楼梯边应允许上下层相连');
const zhuozheng = SCENE_PLATES.find((item) => item.id === 'zhuozheng-whole-garden-study-v4');
assert(zhuozheng?.routeGraph, '拙政园 v4 必须有 CH2 夜入东园的独立骨架');
assert(zhuozheng.routeGraph.nodes.every((node) => node.x > 1035),
  'CH2 夜路不得穿越中东产权墙，西园与会馆属于白天城图街层');
assert(zhuozheng.routeGraph.edges.every((edge) => edge.state === 'candidate'),
  '拙政园路线未经门墙与碰撞实测，不能标记为已核');
const yipu = SCENE_PLATES.find((item) => item.id === 'yipu-whole-garden-study-v3');
const pavilionFloor = yipu?.routeGraph?.nodes.find((node) => node.id === 'yanguangge-floor');
assert(pavilionFloor?.anchorId === 'yipu-v3-yanguangge',
  '艺圃 v3 必须包含延光阁临水廊面的编辑锚点与路线节点');
assert(pavilionFloor.x >= 260 && pavilionFloor.x <= 540 && pavilionFloor.y >= 480 && pavilionFloor.y < 545,
  '延光阁候选脚点须留在图中池北水榭地面，不得挪入池面（此检查不能替代像素级标定）');
assert(yipu.routeGraph.edges.some((edge) => edge.to === 'yanguangge-floor' && edge.state === 'candidate'),
  '延光阁入阁路线须保留为待核候选');
console.log('全园底图、剧本锚点与通路骨架静态检查通过；真实步行几何仍待制作。');
