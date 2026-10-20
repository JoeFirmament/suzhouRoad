import { readSceneActorScalePercent, readScenePlateDraft, readSceneVisualOccluders } from '../src/core/scene-plate-draft.js';
import { CORRIDOR_POST_OCCLUDERS } from '../src/data/corridor-geometry.js';
import { GUANYUN_V2_DRAFT_REGIONS, GUANYUN_V2_GEOMETRY, GUANYUN_V2_ID,
  GUANYUN_V2_WORLD_H, GUANYUN_V2_WORLD_W, buildGuanyunV2Map } from '../src/data/liuyuan-guanyun-v2-study.js';
import { LIUYUAN_COURT_DRAFT_REGIONS, LIUYUAN_COURT_REQUIRED_FEET, LIUYUAN_COURT_WORLD_H, LIUYUAN_COURT_WORLD_W,
  buildLiuyuanCourtStudyMap } from '../src/data/liuyuan-court-study.js';
import { LIUYUAN_LVYIN_DRAFT_REGIONS, LIUYUAN_LVYIN_ID, LIUYUAN_LVYIN_REQUIRED_FEET, LIUYUAN_LVYIN_WORLD_H,
  LIUYUAN_LVYIN_WORLD_W, buildLiuyuanLvyinStudyMap } from '../src/data/liuyuan-lvyin-study.js';
import { LIUYUAN_ENTRY_OBLIQUE_DRAFT_REGIONS, LIUYUAN_ENTRY_OBLIQUE_ID,
  LIUYUAN_ENTRY_OBLIQUE_WORLD_H, LIUYUAN_ENTRY_OBLIQUE_WORLD_W,
  buildLiuyuanEntryObliqueStudyMap } from '../src/data/liuyuan-entry-oblique-study.js';
import { LIUYUAN_ENTRY_DRAFT_REGIONS, buildLiuyuanEntryStudyMap } from '../src/data/liuyuan-entry-study.js';
import { LIUYUAN_ENTRY_REQUIRED_FEET } from '../src/core/liuyuan-entry-flow.js';
import { LIUYUAN_FLOWER_DRAFT_REGIONS, LIUYUAN_FLOWER_ID, LIUYUAN_FLOWER_REQUIRED_FEET,
  LIUYUAN_FLOWER_WORLD_H, LIUYUAN_FLOWER_WORLD_W,
  buildLiuyuanFlowerStudyMap } from '../src/data/liuyuan-flower-study.js';
import { T } from '../src/data/tiles.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const pond = GUANYUN_V2_GEOMETRY.find((object) => object.id === 'guanyun-v2-huanyun-pond');
assert(pond?.effects?.length, '测试底图缺水纹物件');
const draft = {
  format: 'gusu-scene-geometry', version: 2, sceneId: GUANYUN_V2_ID,
  world: { width: GUANYUN_V2_WORLD_W, height: GUANYUN_V2_WORLD_H },
  actorScalePercent: 175,
  tileRegions: GUANYUN_V2_DRAFT_REGIONS,
  objects: [{ id: pond.id, colliders: [], effects: pond.effects }],
};
const prefix = `gusu-geometry-plate:${GUANYUN_V2_ID}:`;
const record = { value: JSON.stringify(draft), savedAt: Date.now() };
Object.defineProperty(globalThis, 'location', { configurable: true, value: { search: '?draft=1' } });
Object.defineProperty(globalThis, 'window', { configurable: true, value: { name: prefix + JSON.stringify(record) } });
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } });
const loaded = readScenePlateDraft(GUANYUN_V2_ID, GUANYUN_V2_WORLD_W, GUANYUN_V2_WORLD_H, buildGuanyunV2Map);
assert(loaded?.geometry[0]?.effects?.[0]?.id === 'guanyun-v2-huanyun-ripples',
  '预览草稿时水纹蒙版或参数未随物件读取');
assert(loaded.geometry[0].effects[0].ripple.rowSpacing === pond.effects[0].ripple.rowSpacing,
  '预览草稿时水纹参数不一致');
assert(loaded.actorScalePercent === 175, '编辑器设置的人物比例应进入场景草稿预览');

(globalThis.window as { name: string }).name = prefix + JSON.stringify({
  value: JSON.stringify({ ...draft, actorScalePercent: undefined }), savedAt: Date.now() + 1,
});
assert(readScenePlateDraft(GUANYUN_V2_ID, GUANYUN_V2_WORLD_W, GUANYUN_V2_WORLD_H,
  buildGuanyunV2Map)?.actorScalePercent === 100, '旧草稿未设置人物比例时应保持原有 100%');

(globalThis.window as { name: string }).name = prefix + JSON.stringify({
  value: JSON.stringify({ ...draft, actorScalePercent: 999 }), savedAt: Date.now() + 2,
});
assert(readScenePlateDraft(GUANYUN_V2_ID, GUANYUN_V2_WORLD_W, GUANYUN_V2_WORLD_H,
  buildGuanyunV2Map) === null, '越界的人物比例不能进入场景预览');

(globalThis.window as { name: string }).name = prefix + JSON.stringify({
  value: JSON.stringify({ ...draft, objects: [{ id: pond.id, effects: [{ ...pond.effects[0],
    ripple: { ...pond.effects[0].ripple, rowSpacing: 0 } }] }] }), savedAt: Date.now() + 1,
});
assert(readScenePlateDraft(GUANYUN_V2_ID, GUANYUN_V2_WORLD_W, GUANYUN_V2_WORLD_H, buildGuanyunV2Map) === null,
  '无效水纹参数不应替换代码中的场景几何');
const concaveCollider = [[700,700],[760,700],[760,720],[720,720],[720,760],[700,760]];
(globalThis.window as { name: string }).name = prefix + JSON.stringify({
  value: JSON.stringify({ ...draft, objects: [{ id: 'invalid-rail', colliders: [concaveCollider], effects: [] }] }),
  savedAt: Date.now() + 2,
});
assert(readScenePlateDraft(GUANYUN_V2_ID, GUANYUN_V2_WORLD_W, GUANYUN_V2_WORLD_H, buildGuanyunV2Map) === null,
  '凹形碰撞草稿不应绕过编辑器校验进入 SAT 物理预览');

for (const [sceneId, width, height, regions, buildMap] of [
  ['liuyuan-tree-court-no-water-study-v1', LIUYUAN_COURT_WORLD_W, LIUYUAN_COURT_WORLD_H,
    LIUYUAN_COURT_DRAFT_REGIONS, buildLiuyuanCourtStudyMap],
  [LIUYUAN_LVYIN_ID, LIUYUAN_LVYIN_WORLD_W, LIUYUAN_LVYIN_WORLD_H,
    LIUYUAN_LVYIN_DRAFT_REGIONS, buildLiuyuanLvyinStudyMap],
  ['liuyuan-lvyin-pond-pixel-study-v2', LIUYUAN_LVYIN_WORLD_W, LIUYUAN_LVYIN_WORLD_H,
    LIUYUAN_LVYIN_DRAFT_REGIONS, buildLiuyuanLvyinStudyMap],
  [LIUYUAN_ENTRY_OBLIQUE_ID, LIUYUAN_ENTRY_OBLIQUE_WORLD_W, LIUYUAN_ENTRY_OBLIQUE_WORLD_H,
    LIUYUAN_ENTRY_OBLIQUE_DRAFT_REGIONS, buildLiuyuanEntryObliqueStudyMap],
] as const) {
  const valid = { format: 'gusu-scene-geometry', sceneId, world: { width, height },
    actorScalePercent: 145, tileRegions: regions, objects: [] };
  (globalThis.window as { name: string }).name = `gusu-geometry-plate:${sceneId}:` + JSON.stringify({
    value: JSON.stringify(valid), savedAt: Date.now() + 20,
  });
  assert(readScenePlateDraft(sceneId, width, height, buildMap)?.actorScalePercent === 145,
    `${sceneId}: 有效旧草稿的人物比例及 Tile 应继续可读`);
  (globalThis.window as { name: string }).name = `gusu-geometry-plate:${sceneId}:` + JSON.stringify({
    value: JSON.stringify({ ...valid, objects: [{ id: 'bad-collider', colliders: [concaveCollider] }] }),
    savedAt: Date.now() + 21,
  });
  assert(readScenePlateDraft(sceneId, width, height, buildMap) === null,
    `${sceneId}: 凹形碰撞草稿须回退代码几何，不可进入行走物理`);
}

// Schema-valid entry drafts can still disconnect CH3's fixed conversation and
// transition feet. Reject only the runtime preview; the stored draft stays intact.
const entryId = 'liuyuan-entrance-topology-study';
const entryDraft = { format: 'gusu-scene-geometry', sceneId: entryId,
  world: { width: 1008, height: 688 }, actorScalePercent: 120,
  tileRegions: LIUYUAN_ENTRY_DRAFT_REGIONS, objects: [] };
const entryRecord = (value: unknown) => `gusu-geometry-plate:${entryId}:` + JSON.stringify({
  value: JSON.stringify(value), savedAt: Date.now() + 30,
});
(globalThis.location as { search: string }).search = '?draft=1';
(globalThis.window as { name: string }).name = entryRecord(entryDraft);
assert(readScenePlateDraft(entryId, 1008, 688, buildLiuyuanEntryStudyMap,
  LIUYUAN_ENTRY_REQUIRED_FEET)?.actorScalePercent === 120,
  '入口有效草稿的比例和 Tile 应正常进入预览');
(globalThis.window as { name: string }).name = entryRecord({ ...entryDraft, tileRegions: [
  ...LIUYUAN_ENTRY_DRAFT_REGIONS,
  { id: 'blocked-corridor', x: 31, y: 24, w: 3, h: 5, tile: T.WALL },
] });
assert(readScenePlateDraft(entryId, 1008, 688, buildLiuyuanEntryStudyMap,
  LIUYUAN_ENTRY_REQUIRED_FEET) === null,
  '入口草稿即使出生点安全，堵断夹弄中段也必须回退');
(globalThis.window as { name: string }).name = entryRecord({ ...entryDraft, objects: [
  { id: 'blocked-by-object', colliders: [[[490,416],[550,416],[550,440],[490,440]]] },
] });
assert(readScenePlateDraft(entryId, 1008, 688, buildLiuyuanEntryStudyMap,
  LIUYUAN_ENTRY_REQUIRED_FEET) === null,
  '入口草稿的新物件不能隔断必经路而仍被试玩载入');
(globalThis.window as { name: string }).name = entryRecord({ ...entryDraft, objects: [
  { id: 'return-spawn-post', colliders: [[[425,245],[435,245],[435,255],[425,255]]] },
] });
assert(readScenePlateDraft(entryId, 1008, 688, buildLiuyuanEntryStudyMap,
  LIUYUAN_ENTRY_REQUIRED_FEET) === null,
  '入口返程出生脚点即使附近有可走地，也不能被草稿物件压住');

const flowerDraft = { format: 'gusu-scene-geometry', sceneId: LIUYUAN_FLOWER_ID,
  world: { width: LIUYUAN_FLOWER_WORLD_W, height: LIUYUAN_FLOWER_WORLD_H },
  tileRegions: LIUYUAN_FLOWER_DRAFT_REGIONS, objects: [] };
const flowerRecord = (value: unknown) => `gusu-geometry-plate:${LIUYUAN_FLOWER_ID}:` + JSON.stringify({
  value: JSON.stringify(value), savedAt: Date.now() + 31,
});
(globalThis.window as { name: string }).name = flowerRecord(flowerDraft);
assert(readScenePlateDraft(LIUYUAN_FLOWER_ID, LIUYUAN_FLOWER_WORLD_W, LIUYUAN_FLOWER_WORLD_H,
  buildLiuyuanFlowerStudyMap, LIUYUAN_FLOWER_REQUIRED_FEET) !== null,
  '花木院可走草稿仍应正常读取');
(globalThis.window as { name: string }).name = flowerRecord({ ...flowerDraft, objects: [
  { id: 'cross-yard-fence', colliders: [[[900,340],[940,340],[940,895],[900,895]]] },
] });
assert(readScenePlateDraft(LIUYUAN_FLOWER_ID, LIUYUAN_FLOWER_WORLD_W, LIUYUAN_FLOWER_WORLD_H,
  buildLiuyuanFlowerStudyMap, LIUYUAN_FLOWER_REQUIRED_FEET) === null,
  '花木院草稿不能在出生点仍安全时隔断东侧主线转场');
(globalThis.window as { name: string }).name = flowerRecord({ ...flowerDraft, objects: [
  { id: 'return-spawn-pot', colliders: [[[1670,440],[1680,440],[1680,450],[1670,450]]] },
] });
assert(readScenePlateDraft(LIUYUAN_FLOWER_ID, LIUYUAN_FLOWER_WORLD_W, LIUYUAN_FLOWER_WORLD_H,
  buildLiuyuanFlowerStudyMap, LIUYUAN_FLOWER_REQUIRED_FEET) === null,
  '花木院东侧返程出生点不能被草稿花盆盖住');

for (const [sceneId, width, height, regions, buildMap, requiredFeet] of [
  ['liuyuan-tree-court-no-water-study-v1', LIUYUAN_COURT_WORLD_W, LIUYUAN_COURT_WORLD_H,
    LIUYUAN_COURT_DRAFT_REGIONS, buildLiuyuanCourtStudyMap, LIUYUAN_COURT_REQUIRED_FEET],
  [LIUYUAN_LVYIN_ID, LIUYUAN_LVYIN_WORLD_W, LIUYUAN_LVYIN_WORLD_H,
    LIUYUAN_LVYIN_DRAFT_REGIONS, buildLiuyuanLvyinStudyMap, LIUYUAN_LVYIN_REQUIRED_FEET],
  ['liuyuan-lvyin-pond-pixel-study-v2', LIUYUAN_LVYIN_WORLD_W, LIUYUAN_LVYIN_WORLD_H,
    LIUYUAN_LVYIN_DRAFT_REGIONS, buildLiuyuanLvyinStudyMap, LIUYUAN_LVYIN_REQUIRED_FEET],
] as const) {
  const sceneDraft = { format: 'gusu-scene-geometry', sceneId, world: { width, height },
    tileRegions: regions, objects: [] };
  const sceneRecord = (value: unknown) => `gusu-geometry-plate:${sceneId}:` + JSON.stringify({
    value: JSON.stringify(value), savedAt: Date.now() + 32,
  });
  (globalThis.window as { name: string }).name = sceneRecord(sceneDraft);
  assert(readScenePlateDraft(sceneId, width, height, buildMap, requiredFeet) !== null,
    `${sceneId}: 默认铺地须能到达全部剧情脚点`);
  (globalThis.window as { name: string }).name = sceneRecord({ ...sceneDraft, tileRegions: [
    ...regions, { id: 'cross-scene-wall', x: 65, y: 0, w: 4, h: 56, tile: T.WALL },
  ] });
  assert(readScenePlateDraft(sceneId, width, height, buildMap, requiredFeet) === null,
    `${sceneId}: 出生点可站但横断路径的草稿须回退，不能让 CH3 卡关`);
  const returnFoot = requiredFeet[requiredFeet.length - 1];
  const { x, y } = returnFoot;
  (globalThis.window as { name: string }).name = sceneRecord({ ...sceneDraft, objects: [
    { id: 'return-spawn-obstacle', colliders: [[[x-5,y-5],[x+5,y-5],[x+5,y+5],[x-5,y+5]]] },
  ] });
  assert(readScenePlateDraft(sceneId, width, height, buildMap, requiredFeet) === null,
    `${sceneId}: 返程出生点不能被草稿物件压住，即使目标半径内仍可走`);
}

// 复廊是受约束路径：只允许读取人物视觉倍率，绝不导入编辑器 Tile／碰撞／路线。
const corridorId = 'canglang-corridor';
const corridorPrefix = `gusu-geometry-plate:${corridorId}:`;
(globalThis.location as { search: string }).search = '?actorDraft=1';
(globalThis.window as { name: string }).name = corridorPrefix + JSON.stringify({
  value: JSON.stringify({ format: 'gusu-scene-geometry', sceneId: corridorId,
    world: { width: 793, height: 496 }, actorScalePercent: 160,
    tileRegions: [{ id: 'invalid', x: -1 }], objects: [{ id: 'invalid' }] }),
  savedAt: Date.now() + 3,
});
assert(readSceneActorScalePercent(corridorId, 793, 496) === 160,
  '复廊应只读取人物视觉倍率，不依赖未接入的 Tile 和物件');
assert(readSceneVisualOccluders(corridorId, 793, 496) === null,
  '复廊旧草稿无新版遮挡物件时应回退到代码默认');
const post = CORRIDOR_POST_OCCLUDERS[0];
(globalThis.window as { name: string }).name = corridorPrefix + JSON.stringify({
  value: JSON.stringify({ format: 'gusu-scene-geometry', sceneId: corridorId,
    world: { width: 793, height: 496 }, seedRevision: 1,
    tileRegions: [{ id: 'poison', x: -1 }], routeGraph: { nodes: null },
    objects: [{ id: post.id, colliders: [[[9999,9999]]], occluder: post.occluder }] }),
  savedAt: Date.now() + 10,
});
assert(readSceneVisualOccluders(corridorId, 793, 496)?.[0]?.id === post.id,
  '复廊应只读取遮挡，忽略草稿中非法 Tile、碰撞与路线');
assert(readSceneVisualOccluders(corridorId, 800, 496) === null,
  '底图世界尺寸变化后不应沿用旧遮挡');
(globalThis.window as { name: string }).name = corridorPrefix + JSON.stringify({
  value: JSON.stringify({ format: 'gusu-scene-geometry', sceneId: corridorId,
    world: { width: 793, height: 496 }, seedRevision: 1,
    objects: [{ id: post.id, occluder: { depthY: 287, polygons: [[[0,0],[900,0],[1,1]]] } }] }),
  savedAt: Date.now() + 11,
});
assert(readSceneVisualOccluders(corridorId, 793, 496) === null,
  '越界遮挡裁片不应进入复廊预览');
assert(readSceneActorScalePercent(corridorId, 800, 496) === null,
  '底图世界尺寸变化后不应沿用旧比例');
(globalThis.location as { search: string }).search = '';
assert(readSceneActorScalePercent(corridorId, 793, 496) === null,
  '正式复廊试走不应自动读取编辑器草稿');
(globalThis.location as { search: string }).search = '?actorDraft=1';
(globalThis.window as { name: string }).name = corridorPrefix + JSON.stringify({
  value: JSON.stringify({ format: 'gusu-scene-geometry', sceneId: corridorId,
    world: { width: 793, height: 496 } }), savedAt: Date.now() + 4,
});
assert(readSceneActorScalePercent(corridorId, 793, 496) === 100,
  '复廊旧草稿缺少比例字段时应保持 100%');
(globalThis.window as { name: string }).name = corridorPrefix + JSON.stringify({
  value: JSON.stringify({ format: 'gusu-scene-geometry', sceneId: corridorId,
    world: { width: 793, height: 496 }, actorScalePercent: 999 }), savedAt: Date.now() + 5,
});
assert(readSceneActorScalePercent(corridorId, 793, 496) === null,
  '越界比例不应进入复廊视觉预览');
console.log('场景草稿预览：留园比例和水纹完整读取，入口/小庭/临池/花木院有效草稿可载入、断路草稿只读回退；复廊仅人物比例及遮挡可预览。');
