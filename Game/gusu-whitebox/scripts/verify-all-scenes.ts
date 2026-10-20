import { STANDARD_PLAYER_PROFILE } from '../src/core/geometry.js';
import { advanceAlleyCheckpoint, advanceAlleyReturnCheckpoint, alleyReturnComplete,
  alleyWalkComplete, LIUYUAN_ALLEY_CHECKPOINTS, LIUYUAN_ALLEY_RETURN_CHECKPOINTS,
  LIUYUAN_ENTRY_COURT_EXIT } from '../src/core/liuyuan-entry-flow.js';
import { advanceLiuyuanChapter, LIUYUAN_CHAPTER_FLAGS } from '../src/core/liuyuan-progression.js';
import { advanceFloristBeat } from '../src/core/liuyuan-florist-beat.js';
import { advanceReturnWalk, completedReturnWalk, INITIAL_RETURN_WALK } from '../src/core/liuyuan-return-walk.js';
import { loadProgress } from '../src/core/progression.js';
import { collides, moveEntity } from '../src/core/physics.js';
import { auditRouteGeometry } from '../src/core/route-geometry.js';
import { validateTileScene, type TileSceneContract } from '../src/core/scene-validation.js';
import { CORRIDOR_EFFECTS, CORRIDOR_ROUTE, CORRIDOR_SPOTS, CORRIDOR_WATER_EDGE, corridorWaterEdgeY,
  validateCorridorGeometry } from '../src/data/corridor-geometry.js';
import { buildFuxueMap, HOME_INTERACTIONS } from '../src/data/fuxue.js';
import { FUXUE_GEOMETRY, validateFuxueGeometry } from '../src/data/fuxue-geometry.js';
import { buildCanglangGarden, buildCanglangMap, buildCorridorSlice } from '../src/data/mapgen.js';
import { GARDEN_SPOTS, SLICE_SPOTS, VIEW_SPOTS } from '../src/data/views.js';
import { SCENE_EVIDENCE, validateSceneEvidence } from '../src/data/scene-evidence.js';
import { SCENE_PLATES } from '../src/data/scene-plates.js';
import { LIUYUAN_CHARACTER_SCALE, liuyuanChapterActorHeightAt,
  liuyuanChapterCameraZoom } from '../src/data/liuyuan-character-scale.js';
import { LIUYUAN_ENTRY_SHOT_KEYS, LIUYUAN_ENTRY_VIEW, entryCameraForFoot } from '../src/core/liuyuan-entry-camera.js';
import { buildLiuyuanEntryStudyMap } from '../src/data/liuyuan-entry-study.js';
import { LIUYUAN_ENTRY_GATE_FEET, buildLiuyuanEntryGateStudyMap } from '../src/data/liuyuan-entry-gate-study.js';
import { LIUYUAN_GATE_MISTY_FEET, buildLiuyuanGateMistyStudyMap } from '../src/data/liuyuan-entry-gate-misty-study.js';
import { LIUYUAN_ENTRY_OBLIQUE_FEET, buildLiuyuanEntryObliqueStudyMap } from '../src/data/liuyuan-entry-oblique-study.js';
import { LIUYUAN_ENTRY_LOWER_ACTOR_SCALE, LIUYUAN_ENTRY_LOWER_FEET,
  LIUYUAN_ENTRY_LOWER_NPC_FEET, buildLiuyuanEntryLowerStudyMap } from '../src/data/liuyuan-entry-lower-camera-study.js';
import { LIUYUAN_ALLEY_MISTY_FEET, buildLiuyuanAlleyMistyStudyMap } from '../src/data/liuyuan-alley-misty-study.js';
import { T } from '../src/data/tiles.js';
import {
  LIUYUAN_COURT_GEOMETRY, LIUYUAN_COURT_SPAWN, LIUYUAN_COURT_WEST_EXIT, LIUYUAN_COURT_WINDOW_FOOT,
  buildLiuyuanCourtStudyMap,
} from '../src/data/liuyuan-court-study.js';
import {
  LIUYUAN_LVYIN_BANK_FOOT, LIUYUAN_LVYIN_PAVILION_FOOT, LIUYUAN_LVYIN_SPAWN, buildLiuyuanLvyinStudyMap,
} from '../src/data/liuyuan-lvyin-study.js';
import {
  LIUYUAN_FLOWER_BUCKET, LIUYUAN_FLOWER_EAST_EXIT, LIUYUAN_FLOWER_SPAWN,
  LIUYUAN_FLOWER_WORKER, LIUYUAN_FLOWER_WORKER_STAND, buildLiuyuanFlowerStudyMap,
} from '../src/data/liuyuan-flower-study.js';
import { LIUYUAN_YOUYICUN_FEET, buildLiuyuanYouyicunStudyMap } from '../src/data/liuyuan-youyicun-study.js';
import {
  LIUYUAN_EAST_HALL_CENTER, LIUYUAN_EAST_HALL_DOOR, LIUYUAN_EAST_HALL_EAST_EXIT,
  LIUYUAN_EAST_HALL_LEFT_TREE, LIUYUAN_EAST_HALL_RIGHT_TREE, LIUYUAN_EAST_HALL_SPAWN,
  buildLiuyuanEastHallStudyMap,
} from '../src/data/liuyuan-east-hall-study.js';
import {
  LIUYUAN_STONE_FOREST_EAST_EXIT, LIUYUAN_STONE_FOREST_GEOMETRY, LIUYUAN_STONE_FOREST_PEAK_FOOT,
  LIUYUAN_STONE_FOREST_YIFENG_FOOT, LIUYUAN_STONE_FOREST_SPAWN, buildLiuyuanStoneForestStudyMap,
} from '../src/data/liuyuan-stone-forest-study.js';
import {
  LIUYUAN_STUDY_COURT_CORRIDOR, LIUYUAN_STUDY_COURT_DOOR,
  LIUYUAN_STUDY_COURT_DOOR_CHOICE_RADIUS, LIUYUAN_STUDY_COURT_DOOR_HEAR_RADIUS,
  LIUYUAN_STUDY_COURT_DOOR_SOUND, LIUYUAN_STUDY_COURT_GEOMETRY,
  LIUYUAN_STUDY_COURT_TREE, LIUYUAN_STUDY_COURT_SPAWN,
  buildLiuyuanStudyCourtMap,
} from '../src/data/liuyuan-study-court-research.js';
import {
  LIUYUAN_STUDY_INTERIOR_COPYIST, LIUYUAN_STUDY_INTERIOR_DESK,
  LIUYUAN_STUDY_INTERIOR_SHELF, LIUYUAN_STUDY_INTERIOR_WINDOW,
  buildLiuyuanStudyInteriorMap,
} from '../src/data/liuyuan-study-interior-research.js';
import { LIUYUAN_WINDOW_ROOM_FEET, buildLiuyuanWindowRoomStudyMap } from '../src/data/liuyuan-window-room-study.js';
import { buildGuanyunStudyMap, GUANYUN_LEFT, GUANYUN_RIGHT, GUANYUN_VIEW } from '../src/data/liuyuan-guanyun-study.js';
import { buildGuanyunV2Map, GUANYUN_V2_GEOMETRY, GUANYUN_V2_LEFT, GUANYUN_V2_RIGHT, GUANYUN_V2_VIEW } from '../src/data/liuyuan-guanyun-v2-study.js';
import { buildZhuozhengNightStudyMap } from '../src/data/zhuozheng-night-study.js';
import { buildYipuYanguanggeStudyMap, validateYipuYanguanggeGeometry, YIPU_YANGUANGGE_GEOMETRY } from '../src/data/yipu-yanguangge-study.js';
import { compareDepthLayers } from '../src/render/occlusion.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// The editor and runtime consume the same world height; camera zoom is included
// here so a future plate cannot silently make the scholar tiny or gigantic.
const chapterScaleSamples = [
  ['liuyuan-entrance-topology-study', 656, LIUYUAN_CHARACTER_SCALE.entry.cameraZoom],
  ['liuyuan-tree-court-no-water-study-v1', 680, LIUYUAN_CHARACTER_SCALE.court.cameraZoom],
  ['liuyuan-lvyin-pond-study-v1', 740, LIUYUAN_CHARACTER_SCALE.lvyin.cameraZoom],
  ['liuyuan-flower-work-yard-study-v3', 500, LIUYUAN_CHARACTER_SCALE.flower.cameraZoom],
  ['liuyuan-east-hall-magnolia-court-study-v1', 575, LIUYUAN_CHARACTER_SCALE.eastHall.cameraZoom],
  ['liuyuan-stone-forest-court-study-v1', 550, LIUYUAN_CHARACTER_SCALE.stoneForest.cameraZoom],
  ['liuyuan-study-court-research-v1', 842, LIUYUAN_CHARACTER_SCALE.studyCourt.cameraZoom],
  ['liuyuan-study-interior-research-v1', 840, LIUYUAN_CHARACTER_SCALE.studyInterior.cameraZoom],
] as const;
const chapterScreenHeights = chapterScaleSamples.map(([sceneId, footY, zoom]) => {
  assert(SCENE_PLATES.some((plate) => plate.id === sceneId), `${sceneId} 不在统一编辑器目录`);
  assert(liuyuanChapterCameraZoom(sceneId) === zoom, `${sceneId} 编辑器预估镜头与试玩不一致`);
  const worldHeight = liuyuanChapterActorHeightAt(sceneId, footY);
  assert(worldHeight !== null, `${sceneId} 缺角色默认高度`);
  return { sceneId, screenHeight: Math.round(worldHeight * zoom) };
});
const chapterHeightValues = chapterScreenHeights.map((item) => item.screenHeight);
assert(Math.min(...chapterHeightValues) >= 100 && Math.max(...chapterHeightValues) <= 140,
  `留园章人物屏幕高度越界：${chapterScreenHeights.map((item) => `${item.sceneId}=${item.screenHeight}`).join('、')}`);
assert(Math.max(...chapterHeightValues) - Math.min(...chapterHeightValues) <= 30,
  '留园章跨幕人物屏幕高度落差过大，须复核镜头与门框/NPC 比例');
assert(LIUYUAN_CHARACTER_SCALE.flower.kneelingFloristHeight
  < LIUYUAN_CHARACTER_SCALE.flower.worldHeight,
  '蹲姿花匠的画面高度不应超过站立书生');
assert(liuyuanChapterActorHeightAt('liuyuan-entrance-topology-study', 250)
  < liuyuanChapterActorHeightAt('liuyuan-entrance-topology-study', 656)!,
  '入口远近人物透视缩尺方向错误');
const entrySeamHeight = liuyuanChapterActorHeightAt('liuyuan-entrance-topology-study',
  LIUYUAN_ENTRY_COURT_EXIT.y)! * LIUYUAN_CHARACTER_SCALE.entry.cameraZoom;
const courtSeamHeight = LIUYUAN_CHARACTER_SCALE.court.worldHeight * LIUYUAN_CHARACTER_SCALE.court.cameraZoom;
assert(entrySeamHeight >= 100 && Math.abs(entrySeamHeight - courtSeamHeight) / courtSeamHeight <= .1,
  `入口→小庭人物突然变大：${entrySeamHeight}px → ${courtSeamHeight}px`);
console.log(`留园 CH3 角色校准：八幕编辑器/试玩共用高度，常用脚点屏幕身高 ${Math.min(...chapterHeightValues)}–${Math.max(...chapterHeightValues)}px；仍待逐幕目视比例验收`);

type Target = { x: number; y: number; id: number | string };

function canReach(scene: TileSceneContract, target: Target, radius: number): boolean {
  const step = 4;
  const startX = Math.round(scene.spawn.x / step) * step;
  const startY = Math.round(scene.spawn.y / step) * step;
  const queue: Array<readonly [number, number]> = [[startX, startY]];
  const seen = new Set<string>([`${startX},${startY}`]);
  const hits = (x: number, y: number) => collides(
    scene.map, x, y, scene.w, scene.h, scene.obstacles ?? [], STANDARD_PLAYER_PROFILE,
  );

  for (let cursor = 0; cursor < queue.length; cursor++) {
    const [x, y] = queue[cursor];
    if (Math.hypot(x - target.x, y - target.y) < radius) return true;
    for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]] as const) {
      const nx = x + dx, ny = y + dy, key = `${nx},${ny}`;
      if (seen.has(key) || hits(nx, ny)) continue;
      seen.add(key);
      queue.push([nx, ny]);
    }
  }
  return false;
}

function verifyTileScene(id: string, scene: TileSceneContract, targets: readonly Target[], radius: number): void {
  const errors = validateTileScene(id, scene, STANDARD_PLAYER_PROFILE);
  assert(errors.length === 0, errors.join('\n'));
  for (const target of targets) {
    assert(canReach(scene, target, radius), `${id}: 目标 ${target.id} 从出生点不可达`);
  }
  console.log(`${id}: ${targets.length} 个目标全部可达`);
}

const fuxue = buildFuxueMap();
assert(validateFuxueGeometry().length === 0, validateFuxueGeometry().join('\n'));
const westLowBranch = FUXUE_GEOMETRY.find((object) => object.id === 'old-tree-west-low-branch');
const treeRoot = FUXUE_GEOMETRY.find((object) => object.id === 'old-tree-canopy');
assert(westLowBranch?.occluder?.depthY === 193 && westLowBranch.occluder.polygons.length === 1,
  '古木西南低枝需独立落地线，避免沿用树池深度遮住书架走道');
assert(treeRoot?.occluder?.depthY === 228 && treeRoot.colliders?.length === 3,
  '拆分低枝遮挡不能改变树干/花台主落地线或实体碰撞');
verifyTileScene('府学', fuxue, HOME_INTERACTIONS, 27);
verifyTileScene('沧浪亭白模', buildCanglangMap(), VIEW_SPOTS, 22);
verifyTileScene('复廊结构试铺', buildCorridorSlice(), SLICE_SPOTS, 22);
const canglangGarden = buildCanglangGarden();
verifyTileScene('沧浪亭整园', canglangGarden, [
  ...GARDEN_SPOTS,
  ...(canglangGarden.landmarks ?? []),
], 22);

const zhuozhengNight = buildZhuozhengNightStudyMap();
verifyTileScene('拙政园东部夜路候选', zhuozhengNight, [
  { id: '画三道墙', x: 1220, y: 745 },
  { id: '隔墙观察', x: 1165, y: 635 },
], 18);
for (const [label, x, y] of [
  ['西部补园', 190, 810],
  ['中部会馆', 580, 805],
  ['中东产权墙', 1035, 470],
  ['东部旧门外侧', 1500, 765],
] as const) {
  assert(collides(zhuozhengNight.map, x, y, zhuozhengNight.w, zhuozhengNight.h, [], STANDARD_PLAYER_PROFILE),
    `拙政园夜路不应穿入${label}`);
}
console.log('拙政园夜路候选: 西园、会馆、产权墙与旧门外侧均保持封闭（尚待贴图实走）');

const liuyuanEntry = buildLiuyuanEntryStudyMap();
const lowerEntry = buildLiuyuanEntryLowerStudyMap();
verifyTileScene('留园入口低机位首镜头研究', lowerEntry, Object.entries(LIUYUAN_ENTRY_LOWER_FEET)
  .slice(1).map(([id, point]) => ({ id, ...point })), 20);
for (const [name, foot] of Object.entries(LIUYUAN_ENTRY_LOWER_NPC_FEET)) {
  assert(!collides(lowerEntry.map, foot.x, foot.y, lowerEntry.w, lowerEntry.h,
    lowerEntry.obstacles, STANDARD_PLAYER_PROFILE), `入口低机位${name}脚点不在可走石地`);
}
assert(LIUYUAN_ENTRY_LOWER_ACTOR_SCALE.nearHeight > LIUYUAN_ENTRY_LOWER_ACTOR_SCALE.farHeight,
  '入口低机位角色应随靠近镜头增大');
const lowerEntryGraph = SCENE_PLATES.find((plate) => plate.id === 'liuyuan-entry-lower-camera-study-v1')?.routeGraph;
assert(lowerEntryGraph, '入口低机位首镜头缺路线骨架');
const lowerEntryAudit = auditRouteGeometry(lowerEntryGraph, lowerEntry.map,
  lowerEntry.w, lowerEntry.h, lowerEntry.obstacles, STANDARD_PLAYER_PROFILE);
assert(lowerEntryAudit.findings.every((item) => !item.blockedAt),
  `入口低机位首镜头路线受阻：${lowerEntryAudit.findings.filter((item) => item.blockedAt)
    .map((item) => `${item.from}→${item.to}@${item.blockedAt}`).join('、')}`);
for (const [label, x, y] of [
  ['左门柱', 930, 525], ['右门柱', 1260, 540], ['左植栽基部', 650, 460],
  ['上方墙体', 900, 150],
] as const) assert(collides(lowerEntry.map, x, y, lowerEntry.w, lowerEntry.h,
  lowerEntry.obstacles, STANDARD_PLAYER_PROFILE), `入口低机位首镜头不可穿${label}`);
console.log('留园入口低机位首镜头: 研究脚点连通、门柱墙体禁行；未接 CH3，仍待浏览器实走');
const obliqueEntry = buildLiuyuanEntryObliqueStudyMap();
verifyTileScene('留园入口斜俯视首镜头研究', obliqueEntry, Object.entries(LIUYUAN_ENTRY_OBLIQUE_FEET)
  .slice(1).map(([id, point]) => ({ id, ...point })), 20);
const obliqueEntryGraph = SCENE_PLATES.find((plate) => plate.id === 'liuyuan-entry-oblique-shot-study-v1')?.routeGraph;
assert(obliqueEntryGraph, '入口斜俯视首镜头缺路线骨架');
const obliqueEntryAudit = auditRouteGeometry(obliqueEntryGraph, obliqueEntry.map,
  obliqueEntry.w, obliqueEntry.h, obliqueEntry.obstacles, STANDARD_PLAYER_PROFILE);
assert(obliqueEntryAudit.findings.every((item) => !item.blockedAt),
  `入口斜俯视首镜头路线受阻：${obliqueEntryAudit.findings.filter((item) => item.blockedAt)
    .map((item) => `${item.from}→${item.to}@${item.blockedAt}`).join('、')}`);
for (const [label, x, y] of [
  ['左门柱', 660, 718], ['右门柱', 908, 718], ['左植栽', 485, 500],
  ['右侧房屋', 1090, 590], ['上方墙体', 700, 160],
] as const) assert(collides(obliqueEntry.map, x, y, obliqueEntry.w, obliqueEntry.h,
  obliqueEntry.obstacles, STANDARD_PLAYER_PROFILE), `入口斜俯视首镜头不可穿${label}`);
console.log('留园入口斜俯视首镜头: 门外—门槛—门内转折—见光候选脚点连通；门柱/墙屋禁行，尚未接 CH3');
const mistyGate = buildLiuyuanGateMistyStudyMap();
verifyTileScene('留园冷调门墙独立研究', mistyGate, [
  { id: '门前', ...LIUYUAN_GATE_MISTY_FEET.approach },
  { id: '门槛', ...LIUYUAN_GATE_MISTY_FEET.threshold },
  { id: '厅内', ...LIUYUAN_GATE_MISTY_FEET.hall },
], 18);
const mistyGateGraph = SCENE_PLATES.find((plate) => plate.id === 'liuyuan-entry-gate-misty-study-v2')?.routeGraph;
assert(mistyGateGraph, '冷调门墙缺独立路线骨架');
const mistyGateAudit = auditRouteGeometry(mistyGateGraph, mistyGate.map,
  mistyGate.w, mistyGate.h, mistyGate.obstacles, STANDARD_PLAYER_PROFILE);
assert(mistyGateAudit.errors.length === 0, mistyGateAudit.errors.join('\n'));
assert(mistyGateAudit.findings.every((item) => !item.blockedAt), '冷调门墙候选路线穿过禁行区');
for (const [label, x, y] of [
  ['左门柱', 810, 485], ['右门柱', 1210, 485], ['左树丛', 330, 520],
  ['右树丛', 1510, 570], ['右前景树丛内缘', 1140, 880], ['背墙', 1020, 180],
] as const) assert(collides(mistyGate.map, x, y, mistyGate.w, mistyGate.h,
  mistyGate.obstacles, STANDARD_PLAYER_PROFILE), `冷调门墙不可穿${label}`);
console.log('留园冷调门墙研究: 门外—门槛—门内可达，柱脚与两侧树丛禁行；不接 CH3');
const mistyAlley = buildLiuyuanAlleyMistyStudyMap();
verifyTileScene('留园冷调夹弄独立研究', mistyAlley, [
  { id: '入窄巷', ...LIUYUAN_ALLEY_MISTY_FEET.firstNarrow },
  { id: '转角', ...LIUYUAN_ALLEY_MISTY_FEET.bend },
  { id: '巷尾', ...LIUYUAN_ALLEY_MISTY_FEET.end },
], 18);
const mistyAlleyGraph = SCENE_PLATES.find((plate) => plate.id === 'liuyuan-alley-misty-study-v1')?.routeGraph;
assert(mistyAlleyGraph, '冷调夹弄缺独立路线骨架');
const mistyAlleyAudit = auditRouteGeometry(mistyAlleyGraph, mistyAlley.map,
  mistyAlley.w, mistyAlley.h, mistyAlley.obstacles, STANDARD_PLAYER_PROFILE);
assert(mistyAlleyAudit.errors.length === 0, mistyAlleyAudit.errors.join('\n'));
assert(mistyAlleyAudit.findings.every((item) => !item.blockedAt), '冷调夹弄候选路线穿过禁行区');
for (const [label, x, y] of [
  ['左墙脚', 765, 450], ['右墙脚', 1500, 530], ['左花木', 450, 490],
  ['右花木', 1510, 725], ['背墙', 1000, 220],
] as const) assert(collides(mistyAlley.map, x, y, mistyAlley.w, mistyAlley.h,
  mistyAlley.obstacles, STANDARD_PLAYER_PROFILE), `冷调夹弄不可穿${label}`);
console.log('留园冷调夹弄研究: 门槛内—转角—巷尾可达，墙脚与两侧花木禁行；不接 CH3');
const gateStudy = buildLiuyuanEntryGateStudyMap();
verifyTileScene('留园门外—门厅斜俯视研究', gateStudy, [
  { id: '门前', ...LIUYUAN_ENTRY_GATE_FEET.approach },
  { id: '门槛', ...LIUYUAN_ENTRY_GATE_FEET.threshold },
  { id: '厅内', ...LIUYUAN_ENTRY_GATE_FEET.hall },
], 18);
const gateStudyGraph = SCENE_PLATES.find((plate) => plate.id === 'liuyuan-entry-gate-style-study-v1')?.routeGraph;
assert(gateStudyGraph, '门外—门厅研究缺路线骨架');
const gateStudyRoute = auditRouteGeometry(gateStudyGraph, gateStudy.map,
  gateStudy.w, gateStudy.h, gateStudy.obstacles, STANDARD_PLAYER_PROFILE);
assert(gateStudyRoute.errors.length === 0, gateStudyRoute.errors.join('\n'));
assert(gateStudyRoute.findings.every((item) => !item.blockedAt),
  '门外—门厅图的路线节点不能穿种植池或门柱');
for (const [label, x, y] of [
  ['左种植池', 340, 430], ['右种植池', 1330, 430],
  ['左门柱', 650, 405], ['右门柱', 1025, 405], ['背墙', 830, 190],
] as const) assert(collides(gateStudy.map, x, y, gateStudy.w, gateStudy.h,
  gateStudy.obstacles, STANDARD_PLAYER_PROFILE), `门外—门厅研究不能穿${label}`);
console.log('留园门外—门厅研究: 三段地面贯通，花池、门柱和背墙禁行；不接 CH3');
verifyTileScene('留园入口游戏场景', liuyuanEntry, [
  { id: '小门', x: 520, y: 610 },
  { id: '第二小庭', x: 430, y: 374 },
  { id: '隔窗', x: 420, y: 232 },
  { id: '绿荫轩方向止步点', x: 290, y: 232 },
], 10);
for (let tileX = 23; tileX < 30; tileX++) {
  assert(liuyuanEntry.map[13 * liuyuanEntry.w + tileX] === T.WIN,
    `留园北墙六窗列 ${tileX} 必须保留不可穿行的漏窗 Tile`);
}
assert(liuyuanEntry.map[14 * liuyuanEntry.w + 26] === T.CORR
  || liuyuanEntry.map[14 * liuyuanEntry.w + 26] === T.PATH,
  '漏窗南侧必须仍有可站立的观察位');
const liuyuanRouteGraph = SCENE_PLATES.find((plate) => plate.id === 'liuyuan-entrance-topology-study')?.routeGraph;
assert(liuyuanRouteGraph, '留园入口缺通路骨架');
const liuyuanRouteAudit = auditRouteGeometry(liuyuanRouteGraph, liuyuanEntry.map,
  liuyuanEntry.w, liuyuanEntry.h, [], STANDARD_PLAYER_PROFILE);
assert(liuyuanRouteAudit.errors.length === 0, liuyuanRouteAudit.errors.join('\n'));
assert(liuyuanRouteAudit.findings.every((item) => !item.blockedAt),
  `留园入口有路段穿墙：${liuyuanRouteAudit.findings.filter((item) => item.blockedAt).map((item) => `${item.from} → ${item.to}`).join('、')}`);
for (const [label, x, y] of [
  ['庭院间侧墙', 480, 340],
  ['池水', 190, 65],
  ['古木交柯北侧漏窗实墙', 420, 210],
  ['东侧未开放房间', 650, 500],
] as const) {
  assert(collides(liuyuanEntry.map, x, y, liuyuanEntry.w, liuyuanEntry.h, [], STANDARD_PLAYER_PROFILE),
    `留园入口不应穿过${label}`);
}
console.log('留园入口: 11 段游戏路脚点均畅通，侧墙与池水不可走；不作历史原貌声明');
const gateShot = entryCameraForFoot(520, 656);
const bendShot = entryCameraForFoot(430, 374);
const windowShot = entryCameraForFoot(430, 300);
assert(gateShot.beat === 'gate' && bendShot.beat === 'bend' && windowShot.beat === 'windows',
  '留园入口须依次经历门外、折廊、隔窗三个取景段');
assert(gateShot.y > 224 && bendShot.y > 224 && windowShot.y <= 208,
  '北墙六窗应在玩家走近北廊时才进入镜头，不能从门外或第二小庭一眼望尽');
let previousCamera = gateShot;
for (const key of LIUYUAN_ENTRY_SHOT_KEYS) {
  const camera = entryCameraForFoot(key.footX, key.footY);
  assert(camera.x <= previousCamera.x + .001 && camera.y <= previousCamera.y + .001,
    '正向取景必须随路渐向西北展开，不得突然倒退或跳镜');
  assert(key.footX - camera.x >= 20 && key.footX - camera.x <= LIUYUAN_ENTRY_VIEW.width - 20
    && key.footY - camera.y >= 35 && key.footY - camera.y <= LIUYUAN_ENTRY_VIEW.height - 20,
  '入口任一路点必须让书生保持在安全画框内');
  previousCamera = camera;
}
console.log('留园入口取景: 门外藏窗、转角见光、北廊露窗；十二个脚点始终留在画框内');
let alleyCheckpoint = 0;
assert(!alleyWalkComplete(alleyCheckpoint), '未走夹弄不可结算御');
alleyCheckpoint = advanceAlleyCheckpoint(alleyCheckpoint, 430, 250);
assert(alleyCheckpoint === 0, '直达终点不得跳过夹弄中段');
for (const checkpoint of LIUYUAN_ALLEY_CHECKPOINTS) {
  alleyCheckpoint = advanceAlleyCheckpoint(alleyCheckpoint, checkpoint.x, checkpoint.y);
}
assert(alleyWalkComplete(alleyCheckpoint), '逐段实走应允许结算御');
console.log('留园入口章流: 不可跳点，走完全部路点后才允许放桶结算');
let returnCheckpoint = 0;
assert(!alleyReturnComplete(returnCheckpoint), '逆行研究不能从起点直接算走完');
returnCheckpoint = advanceAlleyReturnCheckpoint(returnCheckpoint, 520, 656);
assert(returnCheckpoint === 0, '逆行研究不得从小庭直接跳到门外');
let returnPrevious: { x: number; y: number } = LIUYUAN_ENTRY_COURT_EXIT;
for (const checkpoint of LIUYUAN_ALLEY_RETURN_CHECKPOINTS) {
  const distance = Math.hypot(checkpoint.x - returnPrevious.x, checkpoint.y - returnPrevious.y);
  for (let step = 0; step <= Math.ceil(distance / 2); step++) {
    const t = step / Math.max(1, Math.ceil(distance / 2));
    const x = returnPrevious.x + (checkpoint.x - returnPrevious.x) * t;
    const y = returnPrevious.y + (checkpoint.y - returnPrevious.y) * t;
    assert(!collides(liuyuanEntry.map, x, y, liuyuanEntry.w, liuyuanEntry.h, [], STANDARD_PLAYER_PROFILE),
      `留园逆行研究 ${returnPrevious.x},${returnPrevious.y} → ${checkpoint.x},${checkpoint.y} 被墙封住：${Math.round(x)},${Math.round(y)}`);
  }
  returnCheckpoint = advanceAlleyReturnCheckpoint(returnCheckpoint, checkpoint.x, checkpoint.y);
  returnPrevious = checkpoint;
}
assert(alleyReturnComplete(returnCheckpoint), '逆行研究逐段走到门外应通过');
assert(!alleyReturnComplete(advanceAlleyReturnCheckpoint(
  LIUYUAN_ALLEY_RETURN_CHECKPOINTS.length - 1, 526, 634)),
  '门槛内侧不能提前算作到达门外');
console.log(`留园入口逆行研究: 小庭西口到门外 ${LIUYUAN_ALLEY_RETURN_CHECKPOINTS.length} 段脚点依序连通；不结算 CH3 旗标`);

const liuyuanCourt = buildLiuyuanCourtStudyMap();
verifyTileScene('留园无水小庭试走', liuyuanCourt, [
  { id: '六漏窗前脚点', ...LIUYUAN_COURT_WINDOW_FOOT },
  { id: '西向廊口', x: 440, y: 535 },
  { id: '西廊尽头', ...LIUYUAN_COURT_WEST_EXIT },
], 15);
const liuyuanCourtGraph = SCENE_PLATES.find((plate) => plate.id === 'liuyuan-tree-court-no-water-study-v1')?.routeGraph;
assert(liuyuanCourtGraph, '留园小庭缺少与游戏图对齐的路线骨架');
const liuyuanCourtAudit = auditRouteGeometry(liuyuanCourtGraph, liuyuanCourt.map,
  liuyuanCourt.w, liuyuanCourt.h, liuyuanCourt.obstacles, STANDARD_PLAYER_PROFILE);
assert(liuyuanCourtAudit.errors.length === 0, liuyuanCourtAudit.errors.join('\n'));
assert(liuyuanCourtAudit.findings.every((item) => !item.blockedAt),
  `留园小庭有路段穿墙：${liuyuanCourtAudit.findings.filter((item) => item.blockedAt).map((item) => `${item.from} → ${item.to}`).join('、')}`);
for (const [label, x, y] of [
  ['北墙六漏窗', 1180, 380], ['花台中央', 1190, 510],
  ['前景屋顶', 700, 820], ['图外街道', 1700, 80],
] as const) {
  assert(collides(liuyuanCourt.map, x, y, liuyuanCourt.w, liuyuanCourt.h,
    liuyuanCourt.obstacles, STANDARD_PLAYER_PROFILE), `留园小庭不应穿过${label}`);
}
assert(!liuyuanCourt.map.includes(T.WATER), '留园入口小庭不应出现河道或提前开放中池');
const courtEave = LIUYUAN_COURT_GEOMETRY.find((object) => object.id === 'liuyuan-court-front-eave')?.occluder;
assert(courtEave?.polygons.length, '留园小庭缺独立前景屋檐');
assert(compareDepthLayers({ depthY: 650, order: 1 }, { depthY: courtEave.depthY, order: 0 }) < 0,
  '屋檐前的人物应该先画，由前景屋檐遮挡');
console.log('留园小庭试走: 3 个目标可达、6 段路线不穿墙，漏窗/花台/屋顶禁行，入口水面为空');

const liuyuanLvyin = buildLiuyuanLvyinStudyMap();
verifyTileScene('留园绿荫轩临池试走', liuyuanLvyin, [
  { id: '临池停步', ...LIUYUAN_LVYIN_BANK_FOOT },
  { id: '敞轩地面', ...LIUYUAN_LVYIN_PAVILION_FOOT },
], 15);
const liuyuanLvyinGraph = SCENE_PLATES.find((plate) => plate.id === 'liuyuan-lvyin-pond-study-v1')?.routeGraph;
assert(liuyuanLvyinGraph, '留园绿荫轩切片缺路线骨架');
const liuyuanLvyinAudit = auditRouteGeometry(liuyuanLvyinGraph, liuyuanLvyin.map,
  liuyuanLvyin.w, liuyuanLvyin.h, liuyuanLvyin.obstacles, STANDARD_PLAYER_PROFILE);
assert(liuyuanLvyinAudit.errors.length === 0, liuyuanLvyinAudit.errors.join('\n'));
assert(liuyuanLvyinAudit.findings.every((item) => !item.blockedAt),
  `绿荫轩临池路线不应穿墙：${liuyuanLvyinAudit.findings.filter((item) => item.blockedAt).map((item) => `${item.from} → ${item.to}`).join('、')}`);
const lvyinPixelGraph = SCENE_PLATES.find((plate) => plate.id === 'liuyuan-lvyin-pond-pixel-study-v2')?.routeGraph;
assert(lvyinPixelGraph, '绿荫轩像素校位图必须保留同构可走路线');
const lvyinPixelAudit = auditRouteGeometry(lvyinPixelGraph, liuyuanLvyin.map,
  liuyuanLvyin.w, liuyuanLvyin.h, liuyuanLvyin.obstacles, STANDARD_PLAYER_PROFILE);
assert(lvyinPixelAudit.errors.length === 0 && lvyinPixelAudit.findings.every((item) => !item.blockedAt),
  '绿荫轩像素校位图的既有脚点／岸路不连通；不可拿来替换旧场景');
for (const [label, x, y] of [
  ['园内主池', 900, 360], ['东侧花台', 1400, 510], ['东侧粉墙', 1720, 350],
] as const) {
  assert(collides(liuyuanLvyin.map, x, y, liuyuanLvyin.w, liuyuanLvyin.h,
    liuyuanLvyin.obstacles, STANDARD_PLAYER_PROFILE), `绿荫轩切片不应穿过${label}`);
}
assert(liuyuanLvyin.map.includes(T.WATER), '绿荫轩切片必须有园内中池水面');
console.log('留园绿荫轩临池试走: 东侧石路、池边与敞轩可达；园内主池、花台和粉墙禁行');

const liuyuanFlower = buildLiuyuanFlowerStudyMap();
verifyTileScene('留园花木作业院（盆兰作业）', liuyuanFlower, [
  { id: '檐下搁粥', ...LIUYUAN_FLOWER_BUCKET },
  { id: '花匠身侧', ...LIUYUAN_FLOWER_WORKER },
  { id: '东侧方向', ...LIUYUAN_FLOWER_EAST_EXIT },
], 110);
const liuyuanFlowerGraph = SCENE_PLATES.find((plate) => plate.id === 'liuyuan-flower-work-yard-study-v3')?.routeGraph;
assert(liuyuanFlowerGraph, '留园花木作业院缺路线骨架');
assert(!collides(liuyuanFlower.map, LIUYUAN_FLOWER_WORKER_STAND.x, LIUYUAN_FLOWER_WORKER_STAND.y,
  liuyuanFlower.w, liuyuanFlower.h, liuyuanFlower.obstacles, STANDARD_PLAYER_PROFILE),
  '兰谱交画返院脚点必须是可走铺地');
const flowerWorkerRoute = liuyuanFlowerGraph.nodes.find((node) => node.id === 'flower-worker');
assert(flowerWorkerRoute?.x === LIUYUAN_FLOWER_WORKER_STAND.x
  && flowerWorkerRoute.y === LIUYUAN_FLOWER_WORKER_STAND.y,
  '兰谱交画返院脚点必须与统一编辑器花匠身侧路点相同');
const liuyuanFlowerAudit = auditRouteGeometry(liuyuanFlowerGraph, liuyuanFlower.map,
  liuyuanFlower.w, liuyuanFlower.h, liuyuanFlower.obstacles, STANDARD_PLAYER_PROFILE);
assert(liuyuanFlowerAudit.errors.length === 0, liuyuanFlowerAudit.errors.join('\n'));
assert(liuyuanFlowerAudit.findings.every((item) => !item.blockedAt),
  `留园花木作业院路线不应穿墙：${liuyuanFlowerAudit.findings.filter((item) => item.blockedAt).map((item) => `${item.from} → ${item.to}`).join('、')}`);
for (const [label,x,y] of [
  ['后墙盆兰台',900,310], ['花房工作台',200,370],
] as const) assert(collides(liuyuanFlower.map,x,y,liuyuanFlower.w,liuyuanFlower.h,
  liuyuanFlower.obstacles,STANDARD_PLAYER_PROFILE),`留园花木作业院不应走进${label}`);
console.log('留园花木作业院: 花匠盆兰与工作台禁行，交粥和东侧边界可达；章流以明确标注的游戏合成院观察双树');

const liuyuanYouyicun = buildLiuyuanYouyicunStudyMap();
verifyTileScene('留园又一村方向圆门研究切片', liuyuanYouyicun, [
  { id: '门前', ...LIUYUAN_YOUYICUN_FEET.gateFront },
  { id: '圆门槛', ...LIUYUAN_YOUYICUN_FEET.threshold },
  { id: '门后', ...LIUYUAN_YOUYICUN_FEET.gardenSide },
  { id: '四面厅方向止步', ...LIUYUAN_YOUYICUN_FEET.onward },
], 24);
const liuyuanYouyicunGraph = SCENE_PLATES.find((plate) => plate.id === 'liuyuan-youyicun-transition-study-v1')?.routeGraph;
assert(liuyuanYouyicunGraph, '又一村研究切片缺路线骨架');
const liuyuanYouyicunAudit = auditRouteGeometry(liuyuanYouyicunGraph, liuyuanYouyicun.map,
  liuyuanYouyicun.w, liuyuanYouyicun.h, liuyuanYouyicun.obstacles, STANDARD_PLAYER_PROFILE);
assert(liuyuanYouyicunAudit.errors.length === 0, liuyuanYouyicunAudit.errors.join('\n'));
assert(liuyuanYouyicunAudit.findings.every((item) => !item.blockedAt),
  '又一村研究切片的入口—圆门—门后候选路径不应被 Tile 截断');
const skippedReturnWalk = advanceReturnWalk(INITIAL_RETURN_WALK, 'onward');
assert(!skippedReturnWalk.reachedEnd && !advanceReturnWalk(skippedReturnWalk, 'look-back').lookedBack,
  '返园路研究试走不能跳过门槛和回望');
let returnWalk = advanceReturnWalk(INITIAL_RETURN_WALK, 'threshold');
returnWalk = advanceReturnWalk(returnWalk, 'inside');
returnWalk = advanceReturnWalk(returnWalk, 'look-back');
returnWalk = advanceReturnWalk(returnWalk, 'onward');
assert(returnWalk.thresholdSeen && returnWalk.crossed && returnWalk.lookedBack && returnWalk.reachedEnd,
  '返园路研究试走须按走门槛、到门后、回望、到止步点的顺序完成');
assert(JSON.stringify(completedReturnWalk()) === JSON.stringify(returnWalk),
  '从石林返回圆门研究图时只能恢复已验证的研究步序');
assert(!collides(liuyuanYouyicun.map, LIUYUAN_YOUYICUN_FEET.onward.x,
  LIUYUAN_YOUYICUN_FEET.onward.y, liuyuanYouyicun.w, liuyuanYouyicun.h,
  liuyuanYouyicun.obstacles, STANDARD_PLAYER_PROFILE), '研究返场脚点不能落在碰撞内');
for (const [label, x, y] of [
  ['圆门左侧墙基', 752, 600], ['圆门右侧墙基', 1240, 600],
  ['左侧花畦', 465, 620], ['右侧种植带', 1315, 510],
  ['近景左侧屋檐与植丛', 450, 950], ['近景右侧石植带', 1270, 850],
  ['门前右侧石植带', 1220, 760], ['门后左侧花畦', 870, 485],
] as const) assert(collides(liuyuanYouyicun.map, x, y, liuyuanYouyicun.w,
  liuyuanYouyicun.h, liuyuanYouyicun.obstacles, STANDARD_PLAYER_PROFILE),
  `又一村研究切片不可走入${label}`);
console.log('留园又一村研究切片: 门前—圆门—门后—止步脚点候选路线可达；两侧墙基/花畦禁行，尚非清末门位。');

const liuyuanEastHall = buildLiuyuanEastHallStudyMap();
verifyTileScene('留园东部宅院厅前双玉兰', liuyuanEastHall, [
  { id: '厅前中路', ...LIUYUAN_EAST_HALL_CENTER },
  { id: '左树观察', x: LIUYUAN_EAST_HALL_LEFT_TREE.x, y: 550 },
  { id: '右树观察', x: LIUYUAN_EAST_HALL_RIGHT_TREE.x, y: 580 },
  { id: '厅前门槛', ...LIUYUAN_EAST_HALL_DOOR },
  { id: '下一院方向', ...LIUYUAN_EAST_HALL_EAST_EXIT },
], 32);
const liuyuanEastHallGraph = SCENE_PLATES.find((plate) => plate.id === 'liuyuan-east-hall-magnolia-court-study-v1')?.routeGraph;
assert(liuyuanEastHallGraph, '留园东部厅前试走缺路线骨架');
const liuyuanEastHallAudit = auditRouteGeometry(liuyuanEastHallGraph, liuyuanEastHall.map,
  liuyuanEastHall.w, liuyuanEastHall.h, liuyuanEastHall.obstacles, STANDARD_PLAYER_PROFILE);
assert(liuyuanEastHallAudit.errors.length === 0, liuyuanEastHallAudit.errors.join('\n'));
assert(liuyuanEastHallAudit.findings.every((item) => !item.blockedAt),
  `留园东部厅前路线不应穿树池或墙：${liuyuanEastHallAudit.findings.filter((item) => item.blockedAt).map((item) => `${item.from} → ${item.to}`).join('、')}`);
for (const [label,x,y] of [
  ['左玉兰根脚',515,420], ['右玉兰根脚',1390,450], ['厅堂墙内',980,225],
] as const) assert(collides(liuyuanEastHall.map,x,y,liuyuanEastHall.w,liuyuanEastHall.h,
  liuyuanEastHall.obstacles,STANDARD_PLAYER_PROFILE),`留园厅前试走不应走入${label}`);
console.log('留园东部宅院试走: 双地植玉兰树池、厅堂禁行；中央轴线与两侧绕行可达（仍非 1890 定点）');

const liuyuanWindowRoom = buildLiuyuanWindowRoomStudyMap();
verifyTileScene('留园洞天一碧三窗研究切片', liuyuanWindowRoom, [
  { id: '西蕉窗前', ...LIUYUAN_WINDOW_ROOM_FEET.west },
  { id: '中石藤窗前', ...LIUYUAN_WINDOW_ROOM_FEET.middle },
  { id: '东竹窗前', ...LIUYUAN_WINDOW_ROOM_FEET.east },
], 24);
const liuyuanWindowGraph = SCENE_PLATES.find((plate) => plate.id === 'liuyuan-dongtian-three-windows-study-v1')?.routeGraph;
assert(liuyuanWindowGraph, '三窗研究切片缺路线骨架');
const liuyuanWindowAudit = auditRouteGeometry(liuyuanWindowGraph, liuyuanWindowRoom.map,
  liuyuanWindowRoom.w, liuyuanWindowRoom.h, liuyuanWindowRoom.obstacles, STANDARD_PLAYER_PROFILE);
assert(liuyuanWindowAudit.errors.length === 0, liuyuanWindowAudit.errors.join('\n'));
assert(liuyuanWindowAudit.findings.every((item) => !item.blockedAt), '三窗前候选路线不应穿墙');
for (const [label, x, y] of [
  ['中墙基', 480, 400], ['西侧墙', 16, 448], ['东侧墙', 944, 448], ['画面底边', 480, 537],
] as const) assert(collides(liuyuanWindowRoom.map, x, y, liuyuanWindowRoom.w, liuyuanWindowRoom.h,
  [], STANDARD_PLAYER_PROFILE), `三窗研究切片不应走入${label}`);
console.log('留园三窗研究切片: 三个窗前脚点与路线可达，墙基/侧墙/画面底边禁行；尚非清末实测。');

const liuyuanStoneForest = buildLiuyuanStoneForestStudyMap();
verifyTileScene('留园石林小院绕峰研究切片', liuyuanStoneForest, [
  { id: '揖峰轩前', ...LIUYUAN_STONE_FOREST_YIFENG_FOOT },
  { id: '晚翠峰前', ...LIUYUAN_STONE_FOREST_PEAK_FOOT },
  { id: '东廊口', ...LIUYUAN_STONE_FOREST_EAST_EXIT },
], 25);
const liuyuanStoneGraph = SCENE_PLATES.find((plate) => plate.id === 'liuyuan-stone-forest-court-study-v1')?.routeGraph;
assert(liuyuanStoneGraph, '留园石林小院缺路线骨架');
const liuyuanStoneAudit = auditRouteGeometry(liuyuanStoneGraph, liuyuanStoneForest.map,
  liuyuanStoneForest.w, liuyuanStoneForest.h, liuyuanStoneForest.obstacles, STANDARD_PLAYER_PROFILE);
assert(liuyuanStoneAudit.errors.length === 0, liuyuanStoneAudit.errors.join('\n'));
assert(liuyuanStoneAudit.findings.every((item) => !item.blockedAt),
  `留园石林小院路线不应穿峰石或廊柱：${liuyuanStoneAudit.findings.filter((item) => item.blockedAt).map((item) => `${item.from} → ${item.to}`).join('、')}`);
for (const [label,x,y] of [
  ['晚翠峰根脚',950,510], ['v2 斜片石根脚',650,535], ['揖峰轩西柱',375,365], ['右廊柱',1660,460],
] as const) assert(collides(liuyuanStoneForest.map,x,y,liuyuanStoneForest.w,liuyuanStoneForest.h,
  liuyuanStoneForest.obstacles,STANDARD_PLAYER_PROFILE),`留园石林小院不应走入${label}`);
const stoneLeaf = LIUYUAN_STONE_FOREST_GEOMETRY.find((object) => object.id === 'stone-leaning-leaf-v2');
assert(stoneLeaf?.occluder?.depthY === 565 && stoneLeaf.colliders?.length === 1,
  'v2 斜片石需要独立的落地碰撞和遮挡轮廓');
for (const object of LIUYUAN_STONE_FOREST_GEOMETRY) for (const shape of object.colliders ?? []) {
  if ('x' in shape) continue;
  let turn = 0;
  for (let i = 0; i < shape.points.length; i++) {
    const a = shape.points[i], b = shape.points[(i + 1) % shape.points.length];
    const c = shape.points[(i + 2) % shape.points.length];
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (cross && turn && Math.sign(cross) !== turn) throw new Error(`${object.id}: 石林碰撞非凸形，SAT 不可靠`);
    if (cross) turn = Math.sign(cross);
  }
  assert(turn !== 0, `${object.id}: 石林碰撞退化为直线`);
}
assert(!liuyuanStoneForest.map.includes(T.WATER), '石林小院研究切片不应凭空画大水池');
console.log('留园石林小院试走: 峰石/柱脚禁行，西侧轩前—绕峰—东廊路脚点连通；仍非 1890 实测');

const studyCourt = buildLiuyuanStudyCourtMap();
verifyTileScene('留园北缘书斋院研究切片', studyCourt, [
  { id: '西侧书房门前', ...LIUYUAN_STUDY_COURT_DOOR },
  { id: '花台南侧', ...LIUYUAN_STUDY_COURT_TREE },
  { id: '东廊止步', ...LIUYUAN_STUDY_COURT_CORRIDOR },
], 27);
const studyCourtGraph = SCENE_PLATES.find((plate) => plate.id === 'liuyuan-study-court-research-v1')?.routeGraph;
assert(studyCourtGraph, '书斋院缺路线骨架');
const studyDoorNode = studyCourtGraph.nodes.find((node) => node.id === 'study-door');
assert(studyDoorNode?.x === LIUYUAN_STUDY_COURT_DOOR.x && studyDoorNode.y === LIUYUAN_STUDY_COURT_DOOR.y,
  '编辑器门前节点必须与试玩的可站脚点一致');
assert(Math.hypot(547-LIUYUAN_STUDY_COURT_DOOR_SOUND.x, 695-LIUYUAN_STUDY_COURT_DOOR_SOUND.y)
  < LIUYUAN_STUDY_COURT_DOOR_HEAR_RADIUS, '接近台阶时应先听见纸声');
assert(Math.hypot(547-LIUYUAN_STUDY_COURT_DOOR.x, 695-LIUYUAN_STUDY_COURT_DOOR.y)
  >= LIUYUAN_STUDY_COURT_DOOR_CHOICE_RADIUS, '站在台阶侧边时不应远距离轻叩');
assert(!collides(studyCourt.map, LIUYUAN_STUDY_COURT_DOOR.x, LIUYUAN_STUDY_COURT_DOOR.y,
  studyCourt.w, studyCourt.h, studyCourt.obstacles, STANDARD_PLAYER_PROFILE), '门前可站脚点不能落在碰撞区');
const studyCourtAudit = auditRouteGeometry(studyCourtGraph, studyCourt.map,
  studyCourt.w, studyCourt.h, studyCourt.obstacles, STANDARD_PLAYER_PROFILE);
assert(studyCourtAudit.errors.length === 0, studyCourtAudit.errors.join('\n'));
assert(studyCourtAudit.findings.every((item) => !item.blockedAt),
  `书斋院研究路线穿入花台或建筑：${studyCourtAudit.findings.filter((item) => item.blockedAt).map((item) => `${item.from} → ${item.to}`).join('、')}`);
for (const [label,x,y] of [
  ['树石花台',1000,590], ['书房屋内',170,630], ['东侧院墙',1510,650],
] as const) assert(collides(studyCourt.map,x,y,studyCourt.w,studyCourt.h,
  studyCourt.obstacles,STANDARD_PLAYER_PROFILE),`书斋院研究切片不应走入${label}`);
assert(!studyCourt.map.includes(T.WATER), '书斋院切片不应凭空画水池');
for (const object of LIUYUAN_STUDY_COURT_GEOMETRY) for (const shape of object.colliders ?? []) {
  if ('x' in shape) continue;
  let turn = 0;
  for (let i = 0; i < shape.points.length; i++) {
    const a = shape.points[i], b = shape.points[(i+1)%shape.points.length];
    const c = shape.points[(i+2)%shape.points.length];
    const cross = (b[0]-a[0])*(c[1]-b[1]) - (b[1]-a[1])*(c[0]-b[0]);
    if (cross && turn && Math.sign(cross) !== turn) throw new Error(`${object.id}: 书斋院碰撞非凸形`);
    if (cross) turn = Math.sign(cross);
  }
  assert(turn !== 0, `${object.id}: 书斋院碰撞退化为直线`);
}
console.log('留园书斋院研究切片: 三个脚点可达，花台/书房/院墙禁行；独立入口不写旗标，章流听声轻叩才推进');

for (const [label, scene, start, finish, radius] of [
  ['书斋院门前→院口', studyCourt, LIUYUAN_STUDY_COURT_DOOR, LIUYUAN_STUDY_COURT_SPAWN, 85],
  ['石林轩前→西院路', liuyuanStoneForest, LIUYUAN_STONE_FOREST_YIFENG_FOOT, LIUYUAN_STONE_FOREST_SPAWN, 90],
  ['堂前东侧→西院路', liuyuanEastHall, LIUYUAN_EAST_HALL_EAST_EXIT, LIUYUAN_EAST_HALL_SPAWN, 95],
  ['花木院东侧→空桶', liuyuanFlower, LIUYUAN_FLOWER_EAST_EXIT, LIUYUAN_FLOWER_BUCKET, 115],
  ['临池轩前→东侧小庭口', liuyuanLvyin, LIUYUAN_LVYIN_PAVILION_FOOT, LIUYUAN_LVYIN_SPAWN, 105],
  ['小庭西廊→夹弄口', liuyuanCourt, LIUYUAN_COURT_WEST_EXIT, LIUYUAN_COURT_SPAWN, 100],
] as const) {
  assert(!collides(scene.map, start.x, start.y, scene.w, scene.h,
    scene.obstacles, STANDARD_PLAYER_PROFILE), `${label}: 返程出生脚点不能落在碰撞区`);
  assert(canReach({ ...scene, spawn: start }, { ...finish, id: label }, radius),
    `${label}: 返程场景不能只在正向可达`);
}
console.log('留园返程六幕: 书斋院、石林、堂前、花木院、临池、小庭的反向出生脚点与目标可达');

const studyRoom = buildLiuyuanStudyInteriorMap();
verifyTileScene('留园书斋内景人物研究切片', studyRoom, [
  { id: '抄书人旁', ...LIUYUAN_STUDY_INTERIOR_COPYIST },
  { id: '案前纸笔', ...LIUYUAN_STUDY_INTERIOR_DESK },
  { id: '窗前蕉影', ...LIUYUAN_STUDY_INTERIOR_WINDOW },
  { id: '架前', ...LIUYUAN_STUDY_INTERIOR_SHELF },
], 27);
const studyRoomGraph = SCENE_PLATES.find((plate) => plate.id === 'liuyuan-study-interior-research-v1')?.routeGraph;
assert(studyRoomGraph, '书斋内景缺路线骨架');
const studyRoomAudit = auditRouteGeometry(studyRoomGraph, studyRoom.map,
  studyRoom.w, studyRoom.h, studyRoom.obstacles, STANDARD_PLAYER_PROFILE);
assert(studyRoomAudit.errors.length === 0, studyRoomAudit.errors.join('\n'));
assert(studyRoomAudit.findings.every((item) => !item.blockedAt),
  `书斋内景路线穿入陈设：${studyRoomAudit.findings.filter((item) => item.blockedAt).map((item) => `${item.from} → ${item.to}`).join('、')}`);
for (const [label,x,y] of [
  ['书案',400,355], ['书架',1150,320], ['西墙',30,650], ['东墙',1515,650],
] as const) assert(collides(studyRoom.map,x,y,studyRoom.w,studyRoom.h,
  studyRoom.obstacles,STANDARD_PLAYER_PROFILE),`书斋内景不应走入${label}`);
assert(!studyRoom.map.includes(T.WATER), '书斋内景不应凭空出现水池');
console.log('留园书斋内景研究切片: 人、案、窗、架脚点可达；书案/书架/墙体禁行，章流由人物触发剧情旗标');

const guanyun = buildGuanyunStudyMap();
verifyTileScene('留园冠云峰前院研究切片', guanyun, [
  { id: '西岸路', ...GUANYUN_LEFT }, { id: '临沼赏石', ...GUANYUN_VIEW },
  { id: '东岸路', ...GUANYUN_RIGHT },
], 30);
const guanyunGraph = SCENE_PLATES.find((plate) => plate.id === 'liuyuan-guanyun-court-study-v1')?.routeGraph;
assert(guanyunGraph, '冠云峰前院缺路线骨架');
const guanyunAudit = auditRouteGeometry(guanyunGraph, guanyun.map, guanyun.w, guanyun.h,
  guanyun.obstacles, STANDARD_PLAYER_PROFILE);
assert(guanyunAudit.errors.length === 0, guanyunAudit.errors.join('\n'));
assert(guanyunAudit.findings.every((item) => !item.blockedAt),
  `冠云峰前院候选路线穿过池沼或非铺地：${guanyunAudit.findings.filter((item) => item.blockedAt).map((item) => `${item.from} → ${item.to}`).join('、')}`);
for (const [label,x,y] of [['浣云沼中央',800,625], ['冠云峰根脚',810,430], ['后厅墙内',1050,230]] as const)
  assert(collides(guanyun.map,x,y,guanyun.w,guanyun.h,guanyun.obstacles,STANDARD_PLAYER_PROFILE),
    `冠云峰前院不应走入${label}`);
console.log('冠云峰研究切片: 前庭—两侧岸路可达，沼水、峰根和后厅禁行；历史门路未定。');

const guanyunV2 = buildGuanyunV2Map();
const southHallRoof = GUANYUN_V2_GEOMETRY.find((object) => object.id === 'guanyun-v2-south-hall-roof')?.occluder;
const southHallPosts = GUANYUN_V2_GEOMETRY.filter((object) => object.id.startsWith('guanyun-v2-south-hall-')
  && object.id.endsWith('-post')).flatMap((object) => object.colliders ?? []);
assert(southHallRoof && southHallPosts.length === 2 && southHallPosts.every((post) => 'x' in post),
  '冠云峰 v2 南厅缺屋顶遮挡或厅柱碰撞');
assert(southHallPosts.every((post) => 'x' in post && post.y + post.h === southHallRoof.depthY),
  '冠云峰 v2 南厅屋顶落地深度线须与厅柱脚底对齐，不能设在檐口');
assert(900 < southHallRoof.depthY && 941 >= southHallRoof.depthY,
  '冠云峰 v2 人物从厅下穿檐时应先受遮挡，出生点则应在厅前');
for (const object of GUANYUN_V2_GEOMETRY) for (const shape of object.colliders ?? []) {
  if ('x' in shape) continue;
  let turn = 0;
  for (let i = 0; i < shape.points.length; i++) {
    const a = shape.points[i], b = shape.points[(i + 1) % shape.points.length];
    const c = shape.points[(i + 2) % shape.points.length];
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (cross && turn && Math.sign(cross) !== turn) throw new Error(`${object.id}: 碰撞多边形非凸形，SAT 不可靠`);
    if (cross) turn = Math.sign(cross);
  }
}
const guanyunRipple = GUANYUN_V2_GEOMETRY.flatMap((object) => object.effects ?? [])
  .find((effect) => effect.id === 'guanyun-v2-huanyun-ripples');
assert(guanyunRipple, '冠云峰 v2 缺浣云沼水纹蒙版');
const ripplePolygon = guanyunRipple.polygons[0];
const rippleInside = (x: number, y: number): boolean => {
  let inside = false;
  for (let i = 0, j = ripplePolygon.length - 1; i < ripplePolygon.length; j = i++) {
    const a = ripplePolygon[i], b = ripplePolygon[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
};
for (let y = 430; y < 610; y += 4) for (let x = 420; x < 1140; x += 4) {
  if (!rippleInside(x, y)) continue;
  assert(guanyunV2.map[Math.floor(y / 16) * guanyunV2.w + Math.floor(x / 16)] === T.WATER,
    `冠云峰 v2 水纹越过非水面 (${x}, ${y})`);
}
verifyTileScene('留园冠云峰南厅研究切片 v2', guanyunV2, [
  { id: '沼前赏峰', ...GUANYUN_V2_VIEW }, { id: '西岸路', ...GUANYUN_V2_LEFT },
  { id: '东岸路', ...GUANYUN_V2_RIGHT },
], 30);
const guanyunV2Graph = SCENE_PLATES.find((plate) => plate.id === 'liuyuan-guanyun-court-study-v2')?.routeGraph;
assert(guanyunV2Graph, '冠云峰南厅 v2 缺路线骨架');
const guanyunV2Audit = auditRouteGeometry(guanyunV2Graph, guanyunV2.map, guanyunV2.w,
  guanyunV2.h, guanyunV2.obstacles, STANDARD_PLAYER_PROFILE);
assert(guanyunV2Audit.errors.length === 0, guanyunV2Audit.errors.join('\n'));
assert(guanyunV2Audit.findings.every((item) => !item.blockedAt),
  `冠云峰南厅 v2 候选路线受阻：${guanyunV2Audit.findings.filter((item) => item.blockedAt).map((item) => `${item.from} → ${item.to}`).join('、')}`);
for (const [label,x,y] of [['浣云沼',765,520], ['冠云峰根脚',760,345], ['冠云楼',760,150]] as const)
  assert(collides(guanyunV2.map,x,y,guanyunV2.w,guanyunV2.h,guanyunV2.obstacles,STANDARD_PLAYER_PROFILE),
    `冠云峰南厅 v2 不应走入${label}`);
console.log('冠云峰南厅 v2: 南厅—沼前—两岸候选通路，沼水、峰根、北楼禁行；未核真实门位。');

let liuyuanProgress = loadProgress();
const beforeDelivery = advanceFloristBeat('unmet', 'approach', false);
assert(!beforeDelivery.showChoices && !beforeDelivery.heardClue,
  '交粥前不能从花匠取得书斋线索');
const floristOffer = advanceFloristBeat('unmet', 'approach', true);
assert(floristOffer.showChoices && !floristOffer.heardClue,
  '交粥后应让玩家选择问话或观察，而不是立即结算线索');
for (const choice of ['ask', 'watch'] as const) {
  const response = advanceFloristBeat(floristOffer.state, choice, true);
  assert(response.heardClue && response.state === 'heard' && response.line.includes('笔树'),
    '无论问话或观察，玩家都应听见同一句可回访的土话');
}
assert(!advanceFloristBeat('unmet', 'ask', true).heardClue,
  '未靠近花匠就按对话选项不能跳过互动');
const skippedGate = advanceLiuyuanChapter(liuyuanProgress, 'ly-gate-passed');
assert(!skippedGate.applied && skippedGate.requiredFlag === 'ly-errand-offered',
  '留园章不能在接下送粥托付前先通行');
const directGateSetup = advanceLiuyuanChapter(liuyuanProgress, 'ly-errand-offered');
assert(directGateSetup.applied, '留园入口应先有玩家接桶这一人物/物件事件');
const directGate = advanceLiuyuanChapter(directGateSetup.progress, 'ly-gate-passed');
assert(directGate.applied && directGate.progress.gardens.liuyuan === 'open'
  && !directGate.progress.storyFlags.includes('ly-huabu-seen')
  && !directGate.progress.storyFlags.includes('ly-gate-clue'),
  '玩家可略过可选指路/门房对话直接提桶过门，但不能伪造未发生的人物线索');
for (const flag of LIUYUAN_CHAPTER_FLAGS) {
  const result = advanceLiuyuanChapter(liuyuanProgress, flag);
  assert(result.applied, `留园章事件 ${flag} 无法按剧本顺序推进`);
  liuyuanProgress = result.progress;
  if (flag === 'ly-alley-walked') assert(liuyuanProgress.arts.yu === 0,
    '夹弄是剧情行走，不应按普通移动结算御；御由可选护画挑战按实际操作结算');
  if (flag === 'ly-florist-met') assert(liuyuanProgress.knowledge.includes('liuyuan-magnolia-slip'),
    '花匠线索只记笔树土话，不提前说明玉兰或书斋位置');
  if (flag === 'ly-leaf-written') assert(liuyuanProgress.arts.shu === 1,
    '玩家亲手题叶后应且只应获得书·题写 1 点');
}
assert(liuyuanProgress.gardens.liuyuan === 'complete', '空桶出园后留园应完成');
const replayedAlley = advanceLiuyuanChapter(liuyuanProgress, 'ly-alley-walked');
const replayedLeaf = advanceLiuyuanChapter(liuyuanProgress, 'ly-leaf-written');
assert(!replayedAlley.applied && !replayedLeaf.applied && liuyuanProgress.arts.yu === 0 && liuyuanProgress.arts.shu === 1,
  '重走夹弄不发御，重写蕉叶不重复领取书');
console.log('留园 CH3 状态链: 15 个事件按序推进，跳门房被拦，普通夹弄不发御、题叶书奖励一次，出园后园态 complete');

const yanguanggeStudy = buildYipuYanguanggeStudyMap();
assert(validateYipuYanguanggeGeometry().length === 0, validateYipuYanguanggeGeometry().join('\n'));
const yipuRouteGraph = SCENE_PLATES.find((plate) => plate.id === 'yipu-whole-garden-study-v3')?.routeGraph;
assert(yipuRouteGraph, '艺圃 v3 缺通路骨架');
const yipuRouteAudit = auditRouteGeometry(yipuRouteGraph, yanguanggeStudy.map,
  yanguanggeStudy.w, yanguanggeStudy.h, yanguanggeStudy.obstacles, STANDARD_PLAYER_PROFILE);
assert(yipuRouteAudit.errors.length === 0, yipuRouteAudit.errors.join('\n'));
assert(!yipuRouteAudit.findings.find((item) => item.from === 'yanguangge-east-portal' && item.to === 'yanguangge-floor')?.blockedAt,
  '延光阁东门至阁内直线段应可通行');
assert(yipuRouteAudit.findings.find((item) => item.from === 'tablet' && item.to === 'yanguangge-east-portal')?.blockedAt,
  '碑位至阁东门尚未证实，不应被误认为畅通');
const wronglyConfirmed = structuredClone(yipuRouteGraph);
const blockedPortal = wronglyConfirmed.edges.find((edge) => edge.from === 'tablet' && edge.to === 'yanguangge-east-portal');
assert(blockedPortal, '艺圃缺碑位至延光阁连线');
blockedPortal.state = 'confirmed';
assert(auditRouteGeometry(wronglyConfirmed, yanguanggeStudy.map, yanguanggeStudy.w,
  yanguanggeStudy.h, yanguanggeStudy.obstacles, STANDARD_PLAYER_PROFILE).errors.some((error) => error.includes('tablet → yanguangge-east-portal')),
  '受阻的路线不能标成已确认');
const auditFixture = {
  nodes: [
    { id: 'a', x: 24, y: 24, label: '甲', kind: 'entry' as const, note: '' },
    { id: 'b', x: 104, y: 24, label: '乙', kind: 'goal' as const, note: '' },
  ],
  edges: [{ from: 'a', to: 'b', state: 'confirmed' as const, note: '' }],
};
const clearTileMap = new Uint8Array(8 * 4);
assert(auditRouteGeometry(auditFixture, clearTileMap, 8, 4, [], STANDARD_PLAYER_PROFILE).errors.length === 0,
  '无障碍确认路线应通过几何审核');
assert(auditRouteGeometry(auditFixture, clearTileMap, 8, 4,
  [{ x: 60, y: 10, w: 9, h: 30 }], STANDARD_PLAYER_PROFILE).errors.some((error) => error.includes('受阻')),
  '物件碰撞应使已确认路线失败');
verifyTileScene('艺圃延光阁局部候选', yanguanggeStudy, [
  { id: '延光阁临水地面', x: 420, y: 515 },
], 12);
for (const [label, x, y] of [
  ['阁前池心', 420, 600],
  ['阁北未开门墙', 420, 465],
  ['东侧园外', 680, 520],
] as const) {
  assert(collides(yanguanggeStudy.map, x, y, yanguanggeStudy.w, yanguanggeStudy.h, yanguanggeStudy.obstacles, STANDARD_PLAYER_PROFILE),
    `艺圃延光阁局部候选不应走入${label}`);
}
for (const [label, x, y] of [
  ['阁前栏杆', 420, 544],
  ['东端上门框', 542, 502],
  ['东端下门框', 542, 542],
] as const) {
  assert(collides(yanguanggeStudy.map, x, y, yanguanggeStudy.w, yanguanggeStudy.h, yanguanggeStudy.obstacles, STANDARD_PLAYER_PROFILE),
    `艺圃延光阁局部候选不应穿过${label}`);
}
assert(!collides(yanguanggeStudy.map, 542, 520, yanguanggeStudy.w, yanguanggeStudy.h, yanguanggeStudy.obstacles, STANDARD_PLAYER_PROFILE),
  '艺圃延光阁东端门洞应可通行');
const pavilionWalker = { x: 560, y: 520 };
for (let step = 0; step < 35; step++) {
  const before = pavilionWalker.x;
  moveEntity(yanguanggeStudy.map, pavilionWalker, -4, 0,
    yanguanggeStudy.w, yanguanggeStudy.h, yanguanggeStudy.obstacles, STANDARD_PLAYER_PROFILE);
  assert(pavilionWalker.x === before - 4, `艺圃延光阁东门至阁内第 ${step + 1} 步被空气墙挡住`);
}
assert(pavilionWalker.x === 420, '艺圃延光阁行走终点应在五开间廊面');
for (let step = 0; step < 30; step++) {
  moveEntity(yanguanggeStudy.map, pavilionWalker, 0, 2,
    yanguanggeStudy.w, yanguanggeStudy.h, yanguanggeStudy.obstacles, STANDARD_PLAYER_PROFILE);
}
assert(pavilionWalker.y < 542, '艺圃延光阁前栏未挡住入池脚点');
const eave = YIPU_YANGUANGGE_GEOMETRY.find((object) => object.id === 'yanguangge-eave')?.occluder;
assert(eave, '艺圃延光阁缺屋檐遮挡轮廓');
assert(compareDepthLayers({ depthY: 515, order: 1 }, { depthY: eave.depthY, order: 0 }) < 0,
  '阁内人物应先画、再由屋檐遮住上身');
assert(compareDepthLayers({ depthY: 560, order: 1 }, { depthY: eave.depthY, order: 0 }) > 0,
  '池前人物应画在屋檐前');
function pointInPolygon(x: number, y: number, polygon: readonly (readonly [number, number])[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
assert(!YIPU_YANGUANGGE_GEOMETRY.some((object) => object.occluder?.polygons.some((polygon) => pointInPolygon(542, 520, polygon))),
  '延光阁门洞脚点被遮挡多边形盖住');
const pondEffect = YIPU_YANGUANGGE_GEOMETRY.find((object) => object.id === 'yipu-square-pond')?.effects?.[0];
assert(pondEffect?.id === 'yipu-square-pond-ripple', '艺圃缺独立的池水波纹物件');
const insidePondRipple = (x: number, y: number) =>
  pondEffect.polygons.some((polygon) => pointInPolygon(x, y, polygon))
  && !(pondEffect.holes ?? []).some((polygon) => pointInPolygon(x, y, polygon));
assert(insidePondRipple(400, 620), '艺圃池心应在水纹范围内');
for (const [label, x, y] of [
  ['延光阁地面', 420, 515],
  ['延光阁前栏', 420, 545],
  ['池中石簇', 400, 725],
  ['东南乳鱼亭', 555, 800],
  ['西侧月门', 245, 740],
] as const) {
  assert(!insidePondRipple(x, y), `艺圃水纹不应扫过${label}`);
}
console.log('艺圃延光阁局部候选: 阁内 35 步通行、前栏停步、门洞不遮、屋檐深度及池水/石簇蒙版通过（尚待贴图实走）');

const evidenceErrors = validateSceneEvidence();
assert(evidenceErrors.length === 0, evidenceErrors.join('\n'));
console.log(`实景证据门槛: ${SCENE_EVIDENCE.filter((item) => item.state !== 'reference').length} 个在制/可玩场景与 ${SCENE_EVIDENCE.filter((item) => item.state === 'reference').length} 个候选场景均有年代、来源、已核事实与制作红线`);

const corridorErrors = validateCorridorGeometry();
assert(corridorErrors.length === 0, corridorErrors.join('\n'));
const corridorLengths = CORRIDOR_ROUTE.slice(1).map((point, index) =>
  Math.hypot(point.x - CORRIDOR_ROUTE[index].x, point.y - CORRIDOR_ROUTE[index].y));
const corridorTotalLength = corridorLengths.reduce((sum, value) => sum + value, 0);
for (const spot of CORRIDOR_SPOTS) {
  let along = spot.t * corridorTotalLength;
  let footX = CORRIDOR_ROUTE[0].x;
  for (let index = 0; index < corridorLengths.length; index++) {
    if (along <= corridorLengths[index] || index === corridorLengths.length - 1) {
      const a = CORRIDOR_ROUTE[index], b = CORRIDOR_ROUTE[index + 1];
      footX = a.x + (b.x - a.x) * Math.min(1, along / corridorLengths[index]);
      break;
    }
    along -= corridorLengths[index];
  }
  assert(Math.abs(footX - (spot.frame.x + spot.frame.w / 2)) <= 5,
    `复廊「${spot.verb}」的脚点 x=${footX.toFixed(1)} 与新底图窗框中心不齐`);
}
for (const [x, y] of CORRIDOR_WATER_EDGE) {
  assert(corridorWaterEdgeY(x) === y, `复廊水岸线插值在 x=${x} 锚点失准`);
}
for (const foot of CORRIDOR_ROUTE) {
  assert(foot.y + 8 < corridorWaterEdgeY(foot.x),
    `复廊人物脚点 (${foot.x}, ${foot.y}) 应留在水岸线北侧，倒影只能进入水域`);
}
const corridorWater = CORRIDOR_EFFECTS[0];
const reflectsAt = (x: number, y: number): boolean => corridorWater.polygons.some((polygon) => pointInPolygon(x, y, polygon))
  && !(corridorWater.holes ?? []).some((polygon) => pointInPolygon(x, y, polygon));
assert(reflectsAt(400, 330), '复廊中央水面应允许倒影');
assert(!reflectsAt(400, 290), '复廊廊道地面不应出现倒影');
assert(!reflectsAt(50, 400) && !reflectsAt(750, 400), '左右前景岸石须从倒影蒙版扣除');
console.log('复廊英雄场景: 路径、横向步幅、任务顺序、水面蒙版与倒影岸线锚点通过');
console.log('全部场景几何验证通过。');
