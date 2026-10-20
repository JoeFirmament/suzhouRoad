import { STANDARD_PLAYER_PROFILE, type CollisionShape, type SceneEffectRegion, type SceneGeometryObject } from './core/geometry.js';
import { liuyuanChapterActorHeightAt, liuyuanChapterCameraZoom } from './data/liuyuan-character-scale.js';
import {
  buildFuxueMap,
  FUXUE_H,
  FUXUE_TILE_REGIONS,
  FUXUE_W,
  HOME_INTERACTIONS,
  type FuxueTileRegion,
} from './data/fuxue.js';
import {
  FUXUE_GEOMETRY,
  FUXUE_WORLD_H,
  FUXUE_WORLD_W,
} from './data/fuxue-geometry.js';
import { SOLID, T } from './data/tiles.js';
import {
  clearFuxueGeometryDraftText,
  commitFuxueGeometryDraftText,
  readFuxueGeometryDraftRecord,
  writeFuxueGeometryDraftText,
} from './data/geometry-draft.js';
import { TILE } from './config.js';
import { SCENE_DRAFT_PREVIEWS, SCENE_PLATES, type SceneRouteEdge, type SceneRouteGraph, type SceneRouteNode, type SceneStoryAnchor } from './data/scene-plates.js';
import { LIUYUAN_ENTRY_DRAFT_REGIONS, LIUYUAN_ENTRY_SPAWN } from './data/liuyuan-entry-study.js';
import { LIUYUAN_ENTRY_GATE_ACTOR_SCALE, LIUYUAN_ENTRY_GATE_DRAFT_REGIONS,
  LIUYUAN_ENTRY_GATE_GEOMETRY, LIUYUAN_ENTRY_GATE_SPAWN } from './data/liuyuan-entry-gate-study.js';
import { LIUYUAN_GATE_MISTY_ACTOR_SCALE, LIUYUAN_GATE_MISTY_DRAFT_REGIONS,
  LIUYUAN_GATE_MISTY_GEOMETRY, LIUYUAN_GATE_MISTY_SPAWN } from './data/liuyuan-entry-gate-misty-study.js';
import { LIUYUAN_ENTRY_OBLIQUE_ACTOR_SCALE, LIUYUAN_ENTRY_OBLIQUE_DRAFT_REGIONS,
  LIUYUAN_ENTRY_OBLIQUE_GEOMETRY, LIUYUAN_ENTRY_OBLIQUE_SPAWN } from './data/liuyuan-entry-oblique-study.js';
import { LIUYUAN_ENTRY_LOWER_ACTOR_SCALE, LIUYUAN_ENTRY_LOWER_DRAFT_REGIONS,
  LIUYUAN_ENTRY_LOWER_GEOMETRY, LIUYUAN_ENTRY_LOWER_SPAWN } from './data/liuyuan-entry-lower-camera-study.js';
import { LIUYUAN_ALLEY_MISTY_ACTOR_SCALE, LIUYUAN_ALLEY_MISTY_DRAFT_REGIONS,
  LIUYUAN_ALLEY_MISTY_GEOMETRY, LIUYUAN_ALLEY_MISTY_SPAWN } from './data/liuyuan-alley-misty-study.js';
import { LIUYUAN_COURT_DRAFT_REGIONS, LIUYUAN_COURT_GEOMETRY, LIUYUAN_COURT_SPAWN } from './data/liuyuan-court-study.js';
import { LIUYUAN_LVYIN_DRAFT_REGIONS, LIUYUAN_LVYIN_GEOMETRY, LIUYUAN_LVYIN_SPAWN } from './data/liuyuan-lvyin-study.js';
import { LIUYUAN_FLOWER_DRAFT_REGIONS, LIUYUAN_FLOWER_GEOMETRY, LIUYUAN_FLOWER_SPAWN } from './data/liuyuan-flower-study.js';
import { LIUYUAN_YOUYICUN_ACTOR_SCALE, LIUYUAN_YOUYICUN_DRAFT_REGIONS, LIUYUAN_YOUYICUN_GEOMETRY, LIUYUAN_YOUYICUN_SPAWN } from './data/liuyuan-youyicun-study.js';
import { LIUYUAN_EAST_HALL_DRAFT_REGIONS, LIUYUAN_EAST_HALL_GEOMETRY, LIUYUAN_EAST_HALL_SPAWN } from './data/liuyuan-east-hall-study.js';
import { LIUYUAN_STONE_FOREST_DRAFT_REGIONS, LIUYUAN_STONE_FOREST_GEOMETRY, LIUYUAN_STONE_FOREST_SPAWN } from './data/liuyuan-stone-forest-study.js';
import { LIUYUAN_STUDY_COURT_DRAFT_REGIONS, LIUYUAN_STUDY_COURT_GEOMETRY, LIUYUAN_STUDY_COURT_SPAWN } from './data/liuyuan-study-court-research.js';
import { LIUYUAN_STUDY_INTERIOR_DRAFT_REGIONS, LIUYUAN_STUDY_INTERIOR_GEOMETRY, LIUYUAN_STUDY_INTERIOR_SPAWN } from './data/liuyuan-study-interior-research.js';
import { LIUYUAN_WINDOW_ROOM_ACTOR_SCALE, LIUYUAN_WINDOW_ROOM_DRAFT_REGIONS, LIUYUAN_WINDOW_ROOM_GEOMETRY, LIUYUAN_WINDOW_ROOM_SPAWN } from './data/liuyuan-window-room-study.js';
import { GUANYUN_DRAFT_REGIONS, GUANYUN_GEOMETRY, GUANYUN_SPAWN } from './data/liuyuan-guanyun-study.js';
import { GUANYUN_V2_DRAFT_REGIONS, GUANYUN_V2_GEOMETRY, GUANYUN_V2_SPAWN } from './data/liuyuan-guanyun-v2-study.js';
import { validateRouteGraph } from './core/route-graph.js';
import { migrateStudyCourtDoorDefaults } from './core/liuyuan-study-court-draft-migration.js';
import { auditRouteGeometry } from './core/route-geometry.js';
import { ZHUOZHENG_NIGHT_DRAFT_REGIONS, ZHUOZHENG_NIGHT_SPAWN } from './data/zhuozheng-night-study.js';
import { YIPU_YANGUANGGE_DRAFT_REGIONS, YIPU_YANGUANGGE_GEOMETRY, YIPU_YANGUANGGE_SPAWN } from './data/yipu-yanguangge-study.js';
import { CORRIDOR_EFFECTS, CORRIDOR_POST_OCCLUDERS } from './data/corridor-geometry.js';
import { SCENE_EVIDENCE } from './data/scene-evidence.js';
import { SCENE_RESEARCH_CANDIDATES } from './data/scene-research-candidates.js';
import { drawScholarAtFoot, drawScholarGroundShadow, drawShenYanqiuAtFoot, perspectiveScholarHeight } from './render/scholar-sprite.js';

type Point = [number, number];
type GeometryKind = 'collider' | 'occluder' | 'effect' | 'hole';

interface EditableEffect {
  id: string;
  kind: 'water-ripple';
  polygons: Point[][];
  holes: Point[][];
  ripple: SceneEffectRegion['ripple'];
}

interface EditableObject {
  id: string;
  colliders: Point[][];
  occluder?: { id: string; depthY: number; polygons: Point[][] };
  effects: EditableEffect[];
}

interface EditorDocument {
  format: 'gusu-scene-geometry';
  version: 2;
  seedRevision?: number;
  sceneId: string;
  world: { width: number; height: number };
  asset: { path: string; worldWidth: number; worldHeight: number };
  actorProfile: typeof STANDARD_PLAYER_PROFILE;
  actorScalePercent: number;
  actorPreviewFoot: Point;
  tileRegions: FuxueTileRegion[];
  objects: EditableObject[];
  interactions: SceneStoryAnchor[];
  routeGraph: SceneRouteGraph;
}

const COLORS: Record<GeometryKind, string> = {
  collider: '#ef5350',
  occluder: '#35d8e6',
  effect: '#4c8dff',
  hole: '#ff9d45',
};
const TILE_TYPES = [
  { value: T.WALL, label: '不可行走 · 墙体', color: '#ef5350' },
  { value: T.PATH, label: '可行走 · 庭院/街巷', color: '#62d879' },
  { value: T.CORR, label: '可行走 · 室内/廊道', color: '#35d8e6' },
  { value: T.PLAT, label: '可行走 · 平台', color: '#f4d35e' },
  { value: T.WATER, label: '不可行走 · 水面', color: '#4c8dff' },
  { value: T.BRIDGE, label: '可行走 · 桥面', color: '#ff9d45' },
] as const;
const LEGACY_SCENE_ID = 'fuxue-west-home';
const selectedPlate = SCENE_PLATES.find((plate) => plate.id === new URLSearchParams(location.search).get('scene'));
const sceneId = selectedPlate?.id ?? LEGACY_SCENE_ID;
const WORLD_W = selectedPlate?.width ?? FUXUE_WORLD_W;
const WORLD_H = selectedPlate?.height ?? FUXUE_WORLD_H;
const GRID_W = selectedPlate?.tileW ?? FUXUE_W;
const GRID_H = selectedPlate?.tileH ?? FUXUE_H;
const ASSET_PATH = selectedPlate?.asset ?? '../assets/fuxue/fuxue-west-home-game-v2.png';

const canvas = document.getElementById('geometryCanvas') as HTMLCanvasElement;
canvas.width = WORLD_W;
canvas.height = WORLD_H;
const initialZoom = WORLD_H > 800 ? 1 : 2;
canvas.style.width = `${WORLD_W * initialZoom}px`;
canvas.style.height = `${WORLD_H * initialZoom}px`;
const ctx = canvas.getContext('2d')!;
ctx.imageSmoothingEnabled = false;
const image = new Image();
const actorSprite = new Image();

const objectSelect = document.getElementById('objectSelect') as HTMLSelectElement;
const geometryType = document.getElementById('geometryType') as HTMLSelectElement;
const shapeSelect = document.getElementById('shapeSelect') as HTMLSelectElement;
const depthField = document.getElementById('depthField') as HTMLElement;
const depthInput = document.getElementById('depthInput') as HTMLInputElement;
const zoomSelect = document.getElementById('zoomSelect') as HTMLSelectElement;
zoomSelect.value = String(initialZoom);
const snapSelect = document.getElementById('snapSelect') as HTMLSelectElement;
const showTiles = document.getElementById('showTiles') as HTMLInputElement;
const showAll = document.getElementById('showAll') as HTMLInputElement;
const coordReadout = document.getElementById('coordReadout')!;
const selectionLabel = document.getElementById('selectionLabel')!;
const statusText = document.getElementById('statusText')!;
const importJson = document.getElementById('importJson') as HTMLInputElement;
const addPointButton = document.getElementById('addPoint') as HTMLButtonElement;
const deletePointButton = document.getElementById('deletePoint') as HTMLButtonElement;
const editLayer = document.getElementById('editLayer') as HTMLSelectElement;
const shapeControls = document.getElementById('shapeControls') as HTMLElement;
const tileControls = document.getElementById('tileControls') as HTMLElement;
const storyControls = document.getElementById('storyControls') as HTMLElement;
const storyAnchorSelect = document.getElementById('storyAnchorSelect') as HTMLSelectElement;
const storyAnchorLabel = document.getElementById('storyAnchorLabel') as HTMLInputElement;
const storyAnchorKind = document.getElementById('storyAnchorKind') as HTMLSelectElement;
const storyAnchorScript = document.getElementById('storyAnchorScript') as HTMLInputElement;
const storyAnchorNote = document.getElementById('storyAnchorNote') as HTMLInputElement;
const storyAnchorCoords = document.getElementById('storyAnchorCoords')!;
const routeControls = document.getElementById('routeControls') as HTMLElement;
const routeNodeSelect = document.getElementById('routeNodeSelect') as HTMLSelectElement;
const routeNodeLabel = document.getElementById('routeNodeLabel') as HTMLInputElement;
const routeNodeKind = document.getElementById('routeNodeKind') as HTMLSelectElement;
const routeNodeLevel = document.getElementById('routeNodeLevel') as HTMLInputElement;
const routeNodeAnchor = document.getElementById('routeNodeAnchor') as HTMLSelectElement;
const routeNodeNote = document.getElementById('routeNodeNote') as HTMLInputElement;
const routeEdgeSelect = document.getElementById('routeEdgeSelect') as HTMLSelectElement;
const routeEdgeState = document.getElementById('routeEdgeState') as HTMLSelectElement;
const routeEdgeVia = document.getElementById('routeEdgeVia') as HTMLSelectElement;
const routeEdgeNote = document.getElementById('routeEdgeNote') as HTMLInputElement;
const routeEdgeFrom = document.getElementById('routeEdgeFrom') as HTMLSelectElement;
const routeEdgeTo = document.getElementById('routeEdgeTo') as HTMLSelectElement;
const routeAudit = document.getElementById('routeAudit')!;
const actorControls = document.getElementById('actorControls') as HTMLElement;
const actorScaleSlider = document.getElementById('actorScaleSlider') as HTMLInputElement;
const actorScaleInput = document.getElementById('actorScaleInput') as HTMLInputElement;
const actorScaleReadout = document.getElementById('actorScaleReadout')!;
const tileRegionSelect = document.getElementById('tileRegionSelect') as HTMLSelectElement;
const tileTypeSelect = document.getElementById('tileTypeSelect') as HTMLSelectElement;
const tileMetrics = document.getElementById('tileMetrics')!;
const deleteTileRegionButton = document.getElementById('deleteTileRegion') as HTMLButtonElement;
const newObjectIdInput = document.getElementById('newObjectId') as HTMLInputElement;
const splitToObjectButton = document.getElementById('splitToObject') as HTMLButtonElement;
const sceneSelect = document.getElementById('sceneSelect') as HTMLSelectElement;
const previewLink = document.getElementById('previewLink') as HTMLAnchorElement;
const sceneReadiness = document.getElementById('sceneReadiness')!;
const nextCalibrationStep = document.getElementById('nextCalibrationStep')!;
const sceneEvidence = SCENE_EVIDENCE.find((item) => item.id === sceneId);
const evidencePeriod = sceneEvidence
  ? /1890|光绪十六/.test(sceneEvidence.period)
    ? `旧稿口径：${sceneEvidence.period}（待时间审计）`
    : sceneEvidence.period
  : '未登记';
function fillEvidenceList(id: string, entries: readonly string[]): void {
  const list = document.getElementById(id)!;
  list.replaceChildren(...entries.map((entry) => {
    const item = document.createElement('li'); item.textContent = entry; return item;
  }));
}
document.getElementById('evidencePeriod')!.textContent = sceneEvidence
  ? `${evidencePeriod} · ${sceneEvidence.state === 'reference' ? '研究底图' : sceneEvidence.state === 'geometry' ? '几何标定中' : sceneEvidence.state === 'playable' ? '可玩试稿' : '已验收'}`
  : '本幕暂无考据卡，不能进入正式验收。';
fillEvidenceList('evidenceFacts', sceneEvidence?.verifiedFacts ?? []);
fillEvidenceList('evidenceInferences', sceneEvidence?.inferredForPlay ?? []);
fillEvidenceList('evidenceRedLines', sceneEvidence?.redLines ?? []);
document.getElementById('evidenceSources')!.replaceChildren(...(sceneEvidence?.sources ?? []).map((source) => {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.href = source.url ?? source.local ?? '#';
  link.textContent = `${source.grade} · ${source.title}`;
  if (source.url) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
  item.append(link, document.createTextNode(`：${source.note}`));
  return item;
}));
const researchCandidates = SCENE_RESEARCH_CANDIDATES.filter((item) => item.sceneId === sceneId);
document.getElementById('researchSection')!.hidden = !researchCandidates.length;
document.getElementById('researchCandidates')!.replaceChildren(...researchCandidates.map((candidate) => {
  const item = document.createElement('li');
  const topic = document.createElement('strong'); topic.textContent = candidate.topic;
  const source = document.createElement('a'); source.href = candidate.localPath;
  source.textContent = candidate.sourceTitle;
  const locator = document.createElement('small'); locator.textContent = candidate.locator;
  const use = document.createElement('small'); use.textContent = `可用线索：${candidate.productionUse}`;
  const verify = document.createElement('small'); verify.textContent = `入游戏前：${candidate.verifyBeforeUse}`;
  item.append(topic, document.createTextNode(' · '), source, locator, use, verify);
  if (candidate.studyAsset) {
    const study = document.createElement('a'); study.href = candidate.studyAsset;
    study.textContent = '查看像素化研究图（非正式底图）'; study.target = '_blank';
    study.rel = 'noopener noreferrer'; item.append(study);
  }
  if (candidate.studyPage) {
    const playable = document.createElement('a'); playable.href = candidate.studyPage;
    playable.textContent = '试玩纹样研究小样（不写存档）'; playable.target = '_blank';
    playable.rel = 'noopener noreferrer'; item.append(playable);
  }
  return item;
}));
const sceneGroups = new Map<string, HTMLOptGroupElement>();
for (const item of [
  { id: LEGACY_SCENE_ID, label: '府学 · 旧版正式几何' },
  ...SCENE_PLATES,
]) {
  const groupName = item.label.split(' · ')[0];
  let group = sceneGroups.get(groupName);
  if (!group) {
    group = document.createElement('optgroup'); group.label = groupName;
    sceneGroups.set(groupName, group);
  }
  const option = document.createElement('option');
  option.value = item.id; option.textContent = item.label;
  group.append(option);
}
sceneSelect.replaceChildren(...sceneGroups.values());
sceneSelect.value = sceneId;
const draftPreview = SCENE_DRAFT_PREVIEWS[sceneId];
document.getElementById('editorTitle')!.textContent = `${selectedPlate?.label ?? '府学'} · 几何编辑器`;
document.getElementById('sceneNote')!.textContent = selectedPlate?.note
  ? `${selectedPlate.note}${selectedPlate.routeGraph ? ` 源图预置 ${selectedPlate.routeGraph.nodes.length} 个路线节点；连线以当前编辑状态和几何审核为准。` : ''} ${draftPreview ? '已接入试走页；右上角可预览当前草稿。' : sceneId === 'canglang-corridor' ? '右上角可预览人物比例和廊柱遮挡；草稿 Tile、碰撞与路线仍不改写受约束运动。' : '本场景仅供标定，尚未接入可读草稿的试玩页。'}`
  : '旧版府学正式几何；玩家草稿保持原样。';
document.getElementById('worldSizeLabel')!.textContent = `所有数值均为 ${WORLD_W} × ${WORLD_H} 世界像素坐标；相机坐标不参与编辑。`;
const depthMax = document.getElementById('depthInput') as HTMLInputElement;
depthMax.max = String(WORLD_H);
if (draftPreview) {
  previewLink.href = draftPreview.href;
  previewLink.textContent = draftPreview.label;
} else if (sceneId === 'canglang-corridor') {
  previewLink.href = 'corridor.html?actorDraft=1';
  previewLink.textContent = '预览复廊人物比例与廊柱遮挡';
} else if (selectedPlate) previewLink.hidden = true;
sceneSelect.addEventListener('change', () => {
  if (dirty) {
    saveCurrentDraft(serialize());
    // The draft is persisted before navigation; otherwise beforeunload cancels
    // this very scene switch as an unsaved edit.
    dirty = false;
  }
  const target = sceneSelect.value === LEGACY_SCENE_ID
    ? 'geometry-editor.html'
    : `geometry-editor.html?scene=${encodeURIComponent(sceneSelect.value)}`;
  location.href = target;
});

const sceneSpawn: Point | null = sceneId === 'canglang-corridor'
  ? [62, 278]
  : sceneId === 'zhuozheng-whole-garden-study-v4'
  ? [ZHUOZHENG_NIGHT_SPAWN.x, ZHUOZHENG_NIGHT_SPAWN.y] // 候选脚点，只供编辑器检查。
  : sceneId === 'liuyuan-tree-court-no-water-study-v1'
    ? [LIUYUAN_COURT_SPAWN.x, LIUYUAN_COURT_SPAWN.y]
  : sceneId === 'liuyuan-lvyin-pond-study-v1' || sceneId === 'liuyuan-lvyin-pond-pixel-study-v2'
    ? [LIUYUAN_LVYIN_SPAWN.x, LIUYUAN_LVYIN_SPAWN.y]
  : sceneId === 'liuyuan-flower-work-yard-study-v3'
    ? [LIUYUAN_FLOWER_SPAWN.x, LIUYUAN_FLOWER_SPAWN.y]
  : sceneId === 'liuyuan-youyicun-transition-study-v1'
    ? [LIUYUAN_YOUYICUN_SPAWN.x, LIUYUAN_YOUYICUN_SPAWN.y]
  : sceneId === 'liuyuan-east-hall-magnolia-court-study-v1'
    ? [LIUYUAN_EAST_HALL_SPAWN.x, LIUYUAN_EAST_HALL_SPAWN.y]
  : sceneId === 'liuyuan-stone-forest-court-study-v1'
    ? [LIUYUAN_STONE_FOREST_SPAWN.x, LIUYUAN_STONE_FOREST_SPAWN.y]
  : sceneId === 'liuyuan-study-court-research-v1'
    ? [LIUYUAN_STUDY_COURT_SPAWN.x, LIUYUAN_STUDY_COURT_SPAWN.y]
  : sceneId === 'liuyuan-study-interior-research-v1'
    ? [LIUYUAN_STUDY_INTERIOR_SPAWN.x, LIUYUAN_STUDY_INTERIOR_SPAWN.y]
  : sceneId === 'liuyuan-dongtian-three-windows-study-v1'
    ? [LIUYUAN_WINDOW_ROOM_SPAWN.x, LIUYUAN_WINDOW_ROOM_SPAWN.y]
  : sceneId === 'liuyuan-guanyun-court-study-v1'
    ? [GUANYUN_SPAWN.x, GUANYUN_SPAWN.y]
  : sceneId === 'liuyuan-guanyun-court-study-v2'
    ? [GUANYUN_V2_SPAWN.x, GUANYUN_V2_SPAWN.y]
  : sceneId === 'liuyuan-entrance-topology-study'
    ? [LIUYUAN_ENTRY_SPAWN.x, LIUYUAN_ENTRY_SPAWN.y]
  : sceneId === 'liuyuan-entry-gate-style-study-v1'
    ? [LIUYUAN_ENTRY_GATE_SPAWN.x, LIUYUAN_ENTRY_GATE_SPAWN.y]
  : sceneId === 'liuyuan-entry-gate-misty-study-v2'
    ? [LIUYUAN_GATE_MISTY_SPAWN.x, LIUYUAN_GATE_MISTY_SPAWN.y]
  : sceneId === 'liuyuan-entry-oblique-shot-study-v1'
    ? [LIUYUAN_ENTRY_OBLIQUE_SPAWN.x, LIUYUAN_ENTRY_OBLIQUE_SPAWN.y]
  : sceneId === 'liuyuan-entry-lower-camera-study-v1'
    ? [LIUYUAN_ENTRY_LOWER_SPAWN.x, LIUYUAN_ENTRY_LOWER_SPAWN.y]
  : sceneId === 'liuyuan-alley-misty-study-v1'
    ? [LIUYUAN_ALLEY_MISTY_SPAWN.x, LIUYUAN_ALLEY_MISTY_SPAWN.y]
  : sceneId === 'yipu-whole-garden-study-v3'
    ? [YIPU_YANGUANGGE_SPAWN.x, YIPU_YANGUANGGE_SPAWN.y] // 延光阁局部脚点，非全园出生点。
  : selectedPlate ? null : [buildFuxueMap().spawn.x, buildFuxueMap().spawn.y];

function defaultActorPreviewFoot(): Point {
  return sceneSpawn ? [...sceneSpawn] : [Math.round(WORLD_W / 2), Math.round(WORLD_H * .75)];
}

function baseActorHeightAt(footY: number): number {
  if (sceneId === 'canglang-corridor') return 52;
  const chapterHeight = liuyuanChapterActorHeightAt(sceneId, footY);
  if (chapterHeight !== null) return chapterHeight;
  if (sceneId === 'liuyuan-youyicun-transition-study-v1') {
    const scale = LIUYUAN_YOUYICUN_ACTOR_SCALE;
    return perspectiveScholarHeight(footY, scale.farFootY, scale.nearFootY, scale.farHeight, scale.nearHeight);
  }
  if (sceneId === 'liuyuan-dongtian-three-windows-study-v1') {
    const scale = LIUYUAN_WINDOW_ROOM_ACTOR_SCALE;
    return perspectiveScholarHeight(footY, scale.farFootY, scale.nearFootY, scale.farHeight, scale.nearHeight);
  }
  if (sceneId === 'liuyuan-entry-gate-style-study-v1') {
    const scale = LIUYUAN_ENTRY_GATE_ACTOR_SCALE;
    return perspectiveScholarHeight(footY, scale.farFootY, scale.nearFootY, scale.farHeight, scale.nearHeight);
  }
  if (sceneId === 'liuyuan-entry-gate-misty-study-v2') {
    const scale = LIUYUAN_GATE_MISTY_ACTOR_SCALE;
    return perspectiveScholarHeight(footY, scale.farFootY, scale.nearFootY, scale.farHeight, scale.nearHeight);
  }
  if (sceneId === 'liuyuan-entry-oblique-shot-study-v1') {
    const scale = LIUYUAN_ENTRY_OBLIQUE_ACTOR_SCALE;
    return perspectiveScholarHeight(footY, scale.farFootY, scale.nearFootY, scale.farHeight, scale.nearHeight);
  }
  if (sceneId === 'liuyuan-entry-lower-camera-study-v1') {
    const scale = LIUYUAN_ENTRY_LOWER_ACTOR_SCALE;
    return perspectiveScholarHeight(footY, scale.farFootY, scale.nearFootY, scale.farHeight, scale.nearHeight);
  }
  if (sceneId === 'liuyuan-alley-misty-study-v1') {
    const scale = LIUYUAN_ALLEY_MISTY_ACTOR_SCALE;
    return perspectiveScholarHeight(footY, scale.farFootY, scale.nearFootY, scale.farHeight, scale.nearHeight);
  }
  if (sceneId === 'liuyuan-guanyun-court-study-v2') return perspectiveScholarHeight(footY, 300, 950, 56, 82);
  return 84;
}

function buildEditorMap(regions: readonly FuxueTileRegion[]): { map: Uint8Array; w: number; h: number } {
  if (!selectedPlate) return buildFuxueMap(regions);
  const map = new Uint8Array(GRID_W * GRID_H);
  map.fill(T.WALL);
  for (const region of regions) {
    for (let y = region.y; y < region.y + region.h; y++) {
      for (let x = region.x; x < region.x + region.w; x++) {
        if (x >= 0 && y >= 0 && x < GRID_W && y < GRID_H) map[y * GRID_W + x] = region.tile;
      }
    }
  }
  return { map, w: GRID_W, h: GRID_H };
}

function shapeToPoints(shape: CollisionShape): Point[] {
  if ('x' in shape) return [
    [shape.x, shape.y],
    [shape.x + shape.w, shape.y],
    [shape.x + shape.w, shape.y + shape.h],
    [shape.x, shape.y + shape.h],
  ];
  return shape.points.map(([x, y]) => [x, y]);
}

function editableObjects(objects: readonly SceneGeometryObject[]): EditableObject[] {
  return objects.map((object) => ({
    id: object.id,
    colliders: (object.colliders ?? []).map(shapeToPoints),
    occluder: object.occluder ? {
      id: object.occluder.id,
      depthY: object.occluder.depthY,
      polygons: object.occluder.polygons.map((polygon) => polygon.map(([x, y]) => [x, y])),
    } : undefined,
    effects: (object.effects ?? []).map((effect) => ({
      id: effect.id,
      kind: effect.kind,
      polygons: effect.polygons.map((polygon) => polygon.map(([x, y]) => [x, y])),
      holes: (effect.holes ?? []).map((polygon) => polygon.map(([x, y]) => [x, y])),
      ripple: { ...effect.ripple },
    })),
  }));
}

function sourceDocument(): EditorDocument {
  if (selectedPlate) return {
    format: 'gusu-scene-geometry', version: 2, sceneId,
    seedRevision: sceneId === 'canglang-corridor' ? 1
      : sceneId === 'liuyuan-study-court-research-v1' ? 1
      : sceneId === 'liuyuan-guanyun-court-study-v2' ? 3
      : sceneId === 'yipu-whole-garden-study-v3' ? 2 : undefined,
    world: { width: WORLD_W, height: WORLD_H },
    asset: { path: ASSET_PATH, worldWidth: WORLD_W, worldHeight: WORLD_H },
    actorProfile: { ...STANDARD_PLAYER_PROFILE },
    actorScalePercent: 100,
    actorPreviewFoot: defaultActorPreviewFoot(),
    tileRegions: sceneId === 'canglang-corridor'
      ? [{ id: 'corridor-route-advisory', x: 3, y: 16, w: 45, h: 2, tile: T.CORR }]
      : sceneId === 'zhuozheng-whole-garden-study-v4'
      ? ZHUOZHENG_NIGHT_DRAFT_REGIONS.map((region) => ({ ...region }))
      : sceneId === 'liuyuan-tree-court-no-water-study-v1'
        ? LIUYUAN_COURT_DRAFT_REGIONS.map((region) => ({ ...region }))
      : sceneId === 'liuyuan-lvyin-pond-study-v1' || sceneId === 'liuyuan-lvyin-pond-pixel-study-v2'
        ? LIUYUAN_LVYIN_DRAFT_REGIONS.map((region) => ({ ...region }))
      : sceneId === 'liuyuan-flower-work-yard-study-v3'
        ? LIUYUAN_FLOWER_DRAFT_REGIONS.map((region) => ({ ...region }))
      : sceneId === 'liuyuan-youyicun-transition-study-v1'
        ? LIUYUAN_YOUYICUN_DRAFT_REGIONS.map((region) => ({ ...region }))
      : sceneId === 'liuyuan-east-hall-magnolia-court-study-v1'
        ? LIUYUAN_EAST_HALL_DRAFT_REGIONS.map((region) => ({ ...region }))
      : sceneId === 'liuyuan-stone-forest-court-study-v1'
        ? LIUYUAN_STONE_FOREST_DRAFT_REGIONS.map((region) => ({ ...region }))
      : sceneId === 'liuyuan-study-court-research-v1'
        ? LIUYUAN_STUDY_COURT_DRAFT_REGIONS.map((region) => ({ ...region }))
      : sceneId === 'liuyuan-study-interior-research-v1'
        ? LIUYUAN_STUDY_INTERIOR_DRAFT_REGIONS.map((region) => ({ ...region }))
      : sceneId === 'liuyuan-dongtian-three-windows-study-v1'
        ? LIUYUAN_WINDOW_ROOM_DRAFT_REGIONS.map((region) => ({ ...region }))
      : sceneId === 'liuyuan-guanyun-court-study-v1'
        ? GUANYUN_DRAFT_REGIONS.map((region) => ({ ...region }))
      : sceneId === 'liuyuan-guanyun-court-study-v2'
        ? GUANYUN_V2_DRAFT_REGIONS.map((region) => ({ ...region }))
      : sceneId === 'liuyuan-entrance-topology-study'
        ? LIUYUAN_ENTRY_DRAFT_REGIONS.map((region) => ({ ...region }))
      : sceneId === 'liuyuan-entry-gate-style-study-v1'
        ? LIUYUAN_ENTRY_GATE_DRAFT_REGIONS.map((region) => ({ ...region }))
      : sceneId === 'liuyuan-entry-gate-misty-study-v2'
        ? LIUYUAN_GATE_MISTY_DRAFT_REGIONS.map((region) => ({ ...region }))
      : sceneId === 'liuyuan-entry-oblique-shot-study-v1'
        ? LIUYUAN_ENTRY_OBLIQUE_DRAFT_REGIONS.map((region) => ({ ...region }))
      : sceneId === 'liuyuan-entry-lower-camera-study-v1'
        ? LIUYUAN_ENTRY_LOWER_DRAFT_REGIONS.map((region) => ({ ...region }))
      : sceneId === 'liuyuan-alley-misty-study-v1'
        ? LIUYUAN_ALLEY_MISTY_DRAFT_REGIONS.map((region) => ({ ...region }))
      : sceneId === 'yipu-whole-garden-study-v3'
        ? YIPU_YANGUANGGE_DRAFT_REGIONS.map((region) => ({ ...region })) : [],
    objects: sceneId === 'canglang-corridor'
      ? editableObjects([{ id: 'corridor-water', effects: CORRIDOR_EFFECTS }, ...CORRIDOR_POST_OCCLUDERS])
      : sceneId === 'liuyuan-tree-court-no-water-study-v1'
      ? editableObjects(LIUYUAN_COURT_GEOMETRY)
      : sceneId === 'liuyuan-lvyin-pond-study-v1' || sceneId === 'liuyuan-lvyin-pond-pixel-study-v2'
      ? editableObjects(LIUYUAN_LVYIN_GEOMETRY)
      : sceneId === 'liuyuan-flower-work-yard-study-v3'
      ? editableObjects(LIUYUAN_FLOWER_GEOMETRY)
      : sceneId === 'liuyuan-youyicun-transition-study-v1'
      ? editableObjects(LIUYUAN_YOUYICUN_GEOMETRY)
      : sceneId === 'liuyuan-east-hall-magnolia-court-study-v1'
      ? editableObjects(LIUYUAN_EAST_HALL_GEOMETRY)
      : sceneId === 'liuyuan-stone-forest-court-study-v1'
      ? editableObjects(LIUYUAN_STONE_FOREST_GEOMETRY)
      : sceneId === 'liuyuan-study-court-research-v1'
      ? editableObjects(LIUYUAN_STUDY_COURT_GEOMETRY)
      : sceneId === 'liuyuan-study-interior-research-v1'
      ? editableObjects(LIUYUAN_STUDY_INTERIOR_GEOMETRY)
      : sceneId === 'liuyuan-dongtian-three-windows-study-v1'
      ? editableObjects(LIUYUAN_WINDOW_ROOM_GEOMETRY)
      : sceneId === 'liuyuan-guanyun-court-study-v1'
      ? editableObjects(GUANYUN_GEOMETRY)
      : sceneId === 'liuyuan-guanyun-court-study-v2'
      ? editableObjects(GUANYUN_V2_GEOMETRY)
      : sceneId === 'yipu-whole-garden-study-v3'
      ? editableObjects(YIPU_YANGUANGGE_GEOMETRY)
      : sceneId === 'liuyuan-entry-gate-style-study-v1'
      ? editableObjects(LIUYUAN_ENTRY_GATE_GEOMETRY)
      : sceneId === 'liuyuan-entry-gate-misty-study-v2'
      ? editableObjects(LIUYUAN_GATE_MISTY_GEOMETRY)
      : sceneId === 'liuyuan-entry-oblique-shot-study-v1'
      ? editableObjects(LIUYUAN_ENTRY_OBLIQUE_GEOMETRY)
      : sceneId === 'liuyuan-entry-lower-camera-study-v1'
      ? editableObjects(LIUYUAN_ENTRY_LOWER_GEOMETRY)
      : sceneId === 'liuyuan-alley-misty-study-v1'
      ? editableObjects(LIUYUAN_ALLEY_MISTY_GEOMETRY)
      : [{ id: 'scene-geometry', colliders: [], effects: [] }],
    interactions: (selectedPlate.storyAnchors ?? []).map((item) => ({ ...item })),
    routeGraph: clone(selectedPlate.routeGraph ?? { nodes: [], edges: [] }),
  };
  return {
    format: 'gusu-scene-geometry',
    version: 2,
    sceneId: 'fuxue-west-home',
    world: { width: FUXUE_WORLD_W, height: FUXUE_WORLD_H },
    asset: { path: ASSET_PATH, worldWidth: FUXUE_WORLD_W, worldHeight: FUXUE_WORLD_H },
    actorProfile: { ...STANDARD_PLAYER_PROFILE },
    actorScalePercent: 100,
    actorPreviewFoot: defaultActorPreviewFoot(),
    tileRegions: FUXUE_TILE_REGIONS.map((region) => ({ ...region })),
    objects: editableObjects(FUXUE_GEOMETRY),
    interactions: HOME_INTERACTIONS.map((item) => ({ ...item, kind: 'interaction', scriptRef: '', note: '府学已有正式交互。' })),
    routeGraph: { nodes: [], edges: [] },
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function polygonArea(points: readonly Point[]): number {
  return points.reduce((sum, [x, y], index) => {
    const [nextX, nextY] = points[(index + 1) % points.length];
    return sum + x * nextY - nextX * y;
  }, 0) / 2;
}

function isConvex(points: readonly Point[]): boolean {
  let sign = 0;
  for (let index = 0; index < points.length; index++) {
    const a = points[index], b = points[(index + 1) % points.length], c = points[(index + 2) % points.length];
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (cross === 0) continue;
    if (sign && Math.sign(cross) !== sign) return false;
    sign = Math.sign(cross);
  }
  return sign !== 0;
}

function routeGeometryAudit(graph: SceneRouteGraph = documentData.routeGraph) {
  const liveMap = buildEditorMap(documentData.tileRegions);
  const obstacles: CollisionShape[] = documentData.objects.flatMap((object) =>
    object.colliders.filter((points) => points.length >= 3).map((points) => ({ points })));
  return auditRouteGeometry(graph, liveMap.map, liveMap.w, liveMap.h,
    obstacles, documentData.actorProfile);
}

function documentErrors(): string[] {
  const errors: string[] = [];
  const inspect = (label: string, points: readonly Point[], collider = false): void => {
    if (points.length < 3) { errors.push(`${label} 少于 3 点`); return; }
    if (Math.abs(polygonArea(points)) < .5) errors.push(`${label} 面积为 0`);
    if (points.some(([x, y]) => x < 0 || y < 0 || x > WORLD_W || y > WORLD_H)) {
      errors.push(`${label} 超出画布`);
    }
    if (collider && !isConvex(points)) errors.push(`${label} 是凹形，请拆成多个凸轮廓`);
  };
  for (const object of documentData.objects) {
    object.colliders.forEach((shape, index) => inspect(`${object.id} 碰撞 ${index + 1}`, shape, true));
    object.occluder?.polygons.forEach((shape, index) => inspect(`${object.id} 遮挡 ${index + 1}`, shape));
    for (const effect of object.effects) {
      effect.polygons.forEach((shape, index) => inspect(`${object.id} 特效 ${index + 1}`, shape));
      effect.holes.forEach((shape, index) => inspect(`${object.id} 扣除区 ${index + 1}`, shape));
    }
  }
  for (const region of documentData.tileRegions) {
    if (!Number.isInteger(region.x) || !Number.isInteger(region.y) || !Number.isInteger(region.w) || !Number.isInteger(region.h)
      || region.w <= 0 || region.h <= 0 || region.x < 0 || region.y < 0
      || region.x + region.w > GRID_W || region.y + region.h > GRID_H) {
      errors.push(`${region.id} Tile 区域越界或尺寸无效`);
    }
  }
  const anchorIds = new Set<string>();
  for (const anchor of documentData.interactions) {
    if (!anchor.id || anchorIds.has(anchor.id)) errors.push(`剧本锚点 ID 重复或为空：${anchor.id}`);
    anchorIds.add(anchor.id);
    if (!Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)
      || anchor.x < 0 || anchor.x > WORLD_W || anchor.y < 0 || anchor.y > WORLD_H) {
      errors.push(`剧本锚点越界：${anchor.id}`);
    }
  }
  if (documentData.routeGraph.nodes.length) {
    errors.push(...validateRouteGraph(documentData.routeGraph, documentData.interactions, WORLD_W, WORLD_H));
    errors.push(...routeGeometryAudit().errors);
  }
  return errors;
}

function validationSuffix(): string {
  const errors = documentErrors();
  return errors.length ? `；暂不能预览：${errors.slice(0, 2).join('；')}${errors.length > 2 ? `（另有 ${errors.length - 2} 项）` : ''}` : '';
}

function editorDocumentFrom(value: unknown): EditorDocument | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<EditorDocument> & { version?: number };
  const valid = item.format === 'gusu-scene-geometry'
    && item.sceneId === sceneId
    && item.world?.width === WORLD_W
    && item.world?.height === WORLD_H
    && Array.isArray(item.objects);
  if (!valid) return null;
  const migrated = clone(item) as EditorDocument;
  migrated.version = 2;
  if (!Number.isFinite(migrated.actorScalePercent) || migrated.actorScalePercent < 40
    || migrated.actorScalePercent > 250) migrated.actorScalePercent = 100;
  if (!Array.isArray(migrated.actorPreviewFoot) || migrated.actorPreviewFoot.length !== 2
    || !migrated.actorPreviewFoot.every(Number.isFinite)
    || migrated.actorPreviewFoot[0] < 0 || migrated.actorPreviewFoot[0] > WORLD_W
    || migrated.actorPreviewFoot[1] < 0 || migrated.actorPreviewFoot[1] > WORLD_H) {
    migrated.actorPreviewFoot = defaultActorPreviewFoot();
  }
  if (sceneId === 'liuyuan-entrance-topology-study') {
    // 旧草稿保留原有几何；只在用户确认保存时换成当前底图元信息。
    migrated.asset = { path: ASSET_PATH, worldWidth: WORLD_W, worldHeight: WORLD_H };
  }
  if (!Array.isArray(migrated.tileRegions)) {
    migrated.tileRegions = selectedPlate ? [] : FUXUE_TILE_REGIONS.map((region) => ({ ...region }));
  }
  if (!Array.isArray(migrated.interactions)) migrated.interactions = [];
  migrated.interactions = migrated.interactions.map((anchor) => ({
    ...anchor, kind: anchor.kind ?? 'interaction', scriptRef: anchor.scriptRef ?? '', note: anchor.note ?? '',
  }));
  if (!migrated.routeGraph || !Array.isArray(migrated.routeGraph.nodes) || !Array.isArray(migrated.routeGraph.edges)) {
    migrated.routeGraph = clone(selectedPlate?.routeGraph ?? { nodes: [], edges: [] });
  }
  if (sceneId === 'liuyuan-study-court-research-v1' && (migrated.seedRevision ?? 0) < 1) {
    // 旧代码把“门前”锚在台阶上的声音来源；仅迁移未动过的默认脚点。
    migrateStudyCourtDoorDefaults(migrated.interactions, migrated.routeGraph);
    migrated.seedRevision = 1;
  }
  if (sceneId === 'canglang-corridor' && (migrated.seedRevision ?? 0) < 1) {
    // 只补旧草稿中缺失的廊柱；已手工标定的同名物件及其余图层一律保留。
    const ids = new Set(migrated.objects.map((object) => object.id));
    for (const object of sourceDocument().objects) {
      if (!ids.has(object.id)) migrated.objects.push(clone(object));
    }
    migrated.seedRevision = 1;
  }
  if (sceneId === 'yipu-whole-garden-study-v3' && (migrated.seedRevision ?? 0) < 2) {
    // 新版本仅补缺失物件；保留玩家此前编辑的 Tile、同名物件和区域。
    const source = sourceDocument();
    const objectIds = new Set(migrated.objects.map((object) => object.id));
    for (const object of source.objects) if (!objectIds.has(object.id)) migrated.objects.push(clone(object));
    migrated.seedRevision = 2;
  }
  if (sceneId === 'liuyuan-guanyun-court-study-v2' && (migrated.seedRevision ?? 0) < 2) {
    // 旧草稿尚无浣云沼独立效果物件；只补这一物件，不改玩家标好的路线/Tile/轮廓。
    const pond = sourceDocument().objects.find((object) => object.id === 'guanyun-v2-huanyun-pond');
    if (pond && !migrated.objects.some((object) => object.id === pond.id)) migrated.objects.push(clone(pond));
    migrated.seedRevision = 2;
  }
  if (sceneId === 'liuyuan-guanyun-court-study-v2' && (migrated.seedRevision ?? 0) < 3) {
    // 仅修旧代码默认的檐口深度；玩家自行标定的落地线保持原样。
    const roof = migrated.objects.find((object) => object.id === 'guanyun-v2-south-hall-roof');
    if (roof?.occluder?.depthY === 866) roof.occluder.depthY = 926;
    migrated.seedRevision = 3;
  }
  return migrated;
}

let documentData = sourceDocument();
let selectedObjectId = documentData.objects.find((item) => item.id === (sceneId === 'canglang-corridor' ? 'corridor-post-01' : 'old-tree-canopy'))?.id
  ?? documentData.objects[0].id;
let selectedKind: GeometryKind = sceneId === 'canglang-corridor' ? 'occluder' : 'collider';
let selectedShapeIndex = 0;
let selectedVertex = -1;
let activeLayer: 'shape' | 'tile' | 'story' | 'route' | 'actor' = 'shape';
let selectedTileRegionId = documentData.tileRegions[0]?.id ?? '';
let selectedStoryAnchorId = documentData.interactions[0]?.id ?? '';
let storyDrag = false;
let selectedRouteNodeId = documentData.routeGraph.nodes[0]?.id ?? '';
let selectedRouteEdgeIndex = 0;
let routeDrag = false;
let actorDrag = false;
let dragMode: 'vertex' | 'edge' | 'shape' | 'depth' | null = null;
let dragStart: Point | null = null;
let dragOriginal: Point[] | null = null;
let dragEdgeIndex = -1;
let pointEditMode: 'normal' | 'add' = 'normal';
let tileDragMode: 'move' | 'nw' | 'ne' | 'sw' | 'se' | null = null;
let tileDragStart: Point | null = null;
let tileDragOriginal: FuxueTileRegion | null = null;
let dirty = false;
const past: string[] = [];
const future: string[] = [];

function serialize(): string {
  return JSON.stringify(documentData, null, 2);
}

function setStatus(message: string): void {
  statusText.textContent = message;
}

function checkpoint(): void {
  past.push(serialize());
  if (past.length > 80) past.shift();
  future.length = 0;
}

function markDirty(message = '有尚未保存的修改'): void {
  dirty = true;
  setStatus(message);
}

function selectedObject(): EditableObject {
  return documentData.objects.find((object) => object.id === selectedObjectId) ?? documentData.objects[0];
}

function ensureEffect(object: EditableObject): EditableEffect {
  if (!object.effects.length) object.effects.push({
    id: `${object.id}-effect`,
    kind: 'water-ripple',
    polygons: [],
    holes: [],
    ripple: {
      color: 'rgba(190, 211, 203, .48)', rowSpacing: 17, segmentSpacing: 43,
      minLength: 7, maxLength: 15, speedMs: 420,
    },
  });
  return object.effects[0];
}

function shapeCollection(object = selectedObject(), create = false): Point[][] {
  if (selectedKind === 'collider') return object.colliders;
  if (selectedKind === 'occluder') {
    if (!object.occluder && create) object.occluder = { id: object.id, depthY: 0, polygons: [] };
    return object.occluder?.polygons ?? [];
  }
  if (!object.effects.length && !create) return [];
  const effect = create ? ensureEffect(object) : object.effects[0];
  return selectedKind === 'effect' ? effect.polygons : effect.holes;
}

function selectedShape(): Point[] | null {
  return shapeCollection()[selectedShapeIndex] ?? null;
}

function refreshObjectSelect(): void {
  if (!documentData.objects.some((object) => object.id === selectedObjectId)) {
    selectedObjectId = documentData.objects[0]?.id ?? '';
  }
  objectSelect.replaceChildren(...documentData.objects.map((object) => {
    const option = document.createElement('option');
    const colliderCount = object.colliders.length;
    const occluderCount = object.occluder?.polygons.length ?? 0;
    const effectCount = object.effects.reduce((sum, effect) => sum + effect.polygons.length + effect.holes.length, 0);
    option.value = object.id;
    option.textContent = `${object.id} · 碰${colliderCount} 遮${occluderCount} 效${effectCount}`;
    return option;
  }));
  objectSelect.value = selectedObjectId;
}

function refreshGeometryType(): void {
  const object = selectedObject();
  const counts: Record<GeometryKind, number> = {
    collider: object.colliders.length,
    occluder: object.occluder?.polygons.length ?? 0,
    effect: object.effects.reduce((sum, effect) => sum + effect.polygons.length, 0),
    hole: object.effects.reduce((sum, effect) => sum + effect.holes.length, 0),
  };
  const names: Record<GeometryKind, string> = {
    collider: '碰撞体', occluder: '遮挡轮廓', effect: '特效区域', hole: '特效扣除区',
  };
  for (const option of Array.from(geometryType.options)) {
    const kind = option.value as GeometryKind;
    option.textContent = `${names[kind]}（${counts[kind]}）`;
  }
  geometryType.value = selectedKind;
}

function refreshShapeSelect(preserveVertex = false): void {
  const shapes = shapeCollection();
  shapeSelect.replaceChildren(...shapes.map((shape, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `轮廓 ${index + 1} · ${shape.length} 点`;
    return option;
  }));
  if (selectedShapeIndex >= shapes.length) selectedShapeIndex = Math.max(0, shapes.length - 1);
  shapeSelect.value = String(selectedShapeIndex);
  const object = selectedObject();
  depthField.hidden = selectedKind !== 'occluder' || !object.occluder;
  depthInput.value = object.occluder ? String(object.occluder.depthY) : '0';
  if (!preserveVertex || selectedVertex >= (selectedShape()?.length ?? 0)) selectedVertex = -1;
  deletePointButton.disabled = selectedVertex < 0;
  splitToObjectButton.disabled = shapes.length === 0;
  document.getElementById('deleteShape')!.toggleAttribute('disabled', shapes.length === 0);
  selectionLabel.textContent = shapes.length
    ? `${object.id} · ${geometryType.selectedOptions[0].text} · 轮廓 ${selectedShapeIndex + 1}${selectedVertex >= 0 ? ` · 顶点 ${selectedVertex + 1}` : ''}`
    : `${object.id} · ${geometryType.selectedOptions[0].text} · 尚无轮廓`;
  render();
}

function nextObjectId(base: string): string | null {
  const typed = newObjectIdInput.value.trim();
  if (typed && !/^[a-z0-9][a-z0-9-]*$/.test(typed)) {
    setStatus('物件 ID 只能使用小写字母、数字和连字符');
    return null;
  }
  if (typed) {
    if (documentData.objects.some((object) => object.id === typed)) {
      setStatus(`物件 ID 已存在：${typed}`);
      return null;
    }
    return typed;
  }
  let serial = 1;
  while (documentData.objects.some((object) => object.id === `${base}-${serial}`)) serial += 1;
  return `${base}-${serial}`;
}

function refreshControls(preserveVertex = false): void {
  refreshObjectSelect();
  refreshGeometryType();
  refreshShapeSelect(preserveVertex);
}

function selectedTileRegion(): FuxueTileRegion | null {
  return documentData.tileRegions.find((region) => region.id === selectedTileRegionId) ?? null;
}

function tileTypeInfo(tile: number): (typeof TILE_TYPES)[number] | undefined {
  return TILE_TYPES.find((item) => item.value === tile);
}

function refreshTileControls(): void {
  if (!documentData.tileRegions.some((region) => region.id === selectedTileRegionId)) {
    selectedTileRegionId = documentData.tileRegions[0]?.id ?? '';
  }
  tileRegionSelect.replaceChildren(...documentData.tileRegions.map((region, index) => {
    const option = document.createElement('option');
    option.value = region.id;
    option.textContent = `${index + 1}. ${region.id} · ${tileTypeInfo(region.tile)?.label ?? region.tile}`;
    return option;
  }));
  tileRegionSelect.value = selectedTileRegionId;
  tileTypeSelect.replaceChildren(...TILE_TYPES.map((item) => {
    const option = document.createElement('option');
    option.value = String(item.value); option.textContent = item.label; return option;
  }));
  const region = selectedTileRegion();
  tileTypeSelect.value = region ? String(region.tile) : String(T.WALL);
  tileMetrics.textContent = region
    ? `Tile：x ${region.x} · y ${region.y} · 宽 ${region.w} · 高 ${region.h}　｜　像素：${region.x * TILE}, ${region.y * TILE}, ${region.w * TILE}, ${region.h * TILE}`
    : '尚无 Tile 区域';
  deleteTileRegionButton.disabled = !region;
  if (activeLayer === 'tile') {
    selectionLabel.textContent = region ? `Tile 网格 · ${region.id} · ${tileTypeInfo(region.tile)?.label ?? region.tile}` : 'Tile 网格 · 尚无区域';
  }
  render();
}

function selectedStoryAnchor(): SceneStoryAnchor | null {
  return documentData.interactions.find((item) => item.id === selectedStoryAnchorId) ?? null;
}

function refreshStoryControls(): void {
  if (!selectedStoryAnchor()) selectedStoryAnchorId = documentData.interactions[0]?.id ?? '';
  storyAnchorSelect.replaceChildren(...documentData.interactions.map((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = `${item.scriptRef || '无场次'} · ${item.label}`;
    return option;
  }));
  const anchor = selectedStoryAnchor();
  storyAnchorSelect.value = anchor?.id ?? '';
  storyAnchorLabel.value = anchor?.label ?? '';
  storyAnchorKind.value = anchor?.kind ?? 'interaction';
  storyAnchorScript.value = anchor?.scriptRef ?? '';
  storyAnchorNote.value = anchor?.note ?? '';
  storyAnchorCoords.textContent = anchor ? `世界坐标 x ${anchor.x} · y ${anchor.y}` : '尚无剧本锚点';
  for (const input of [storyAnchorLabel, storyAnchorKind, storyAnchorScript, storyAnchorNote]) input.disabled = !anchor;
  (document.getElementById('deleteStoryAnchor') as HTMLButtonElement).disabled = !anchor;
  if (activeLayer === 'story') selectionLabel.textContent = anchor
    ? `${anchor.scriptRef || '无场次'} · ${anchor.label} · ${anchor.note}` : '剧本元素 · 尚无锚点';
  render();
}

function selectedRouteNode(): SceneRouteNode | null {
  return documentData.routeGraph.nodes.find((item) => item.id === selectedRouteNodeId) ?? null;
}

function selectedRouteEdge(): SceneRouteEdge | null {
  return documentData.routeGraph.edges[selectedRouteEdgeIndex] ?? null;
}

function refreshRouteControls(): void {
  const graph = documentData.routeGraph;
  if (!selectedRouteNode()) selectedRouteNodeId = graph.nodes[0]?.id ?? '';
  routeNodeSelect.replaceChildren(...graph.nodes.map((node) => {
    const option = document.createElement('option'); option.value = node.id;
    option.textContent = `${node.kind === 'portal' ? '门 · ' : ''}${node.label}`;
    return option;
  }));
  const node = selectedRouteNode();
  routeNodeSelect.value = node?.id ?? '';
  routeNodeLabel.value = node?.label ?? '';
  routeNodeKind.value = node?.kind ?? 'waypoint';
  routeNodeLevel.value = String(node?.level ?? 0);
  routeNodeNote.value = node?.note ?? '';
  routeNodeAnchor.replaceChildren(...[null, ...documentData.interactions].map((anchor) => {
    const option = document.createElement('option'); option.value = anchor?.id ?? '';
    option.textContent = anchor ? `${anchor.scriptRef} · ${anchor.label}` : '无对应剧本点';
    return option;
  }));
  routeNodeAnchor.value = node?.anchorId ?? '';
  for (const select of [routeEdgeFrom, routeEdgeTo]) {
    const oldValue = select.value;
    select.replaceChildren(...graph.nodes.map((item) => {
      const option = document.createElement('option'); option.value = item.id; option.textContent = item.label;
      return option;
    }));
    select.value = graph.nodes.some((item) => item.id === oldValue) ? oldValue : node?.id ?? '';
  }
  routeEdgeSelect.replaceChildren(...graph.edges.map((edge, index) => {
    const option = document.createElement('option'); option.value = String(index);
    option.textContent = `${edge.from} ↔ ${edge.to} · ${edge.state}${edge.via === 'stairs' ? ' · 跨层' : ''}`;
    return option;
  }));
  if (selectedRouteEdgeIndex >= graph.edges.length) selectedRouteEdgeIndex = Math.max(0, graph.edges.length - 1);
  const edge = selectedRouteEdge();
  routeEdgeSelect.value = edge ? String(selectedRouteEdgeIndex) : '';
  routeEdgeState.value = edge?.state ?? 'candidate';
  routeEdgeVia.value = edge?.via ?? 'walk';
  routeEdgeNote.value = edge?.note ?? '';
  for (const input of [routeNodeLabel, routeNodeKind, routeNodeLevel, routeNodeAnchor, routeNodeNote]) input.disabled = !node;
  for (const input of [routeEdgeState, routeEdgeVia, routeEdgeNote]) input.disabled = !edge;
  (document.getElementById('deleteRouteNode') as HTMLButtonElement).disabled = !node;
  (document.getElementById('deleteRouteEdge') as HTMLButtonElement).disabled = !edge;
  (document.getElementById('newRouteEdge') as HTMLButtonElement).disabled = graph.nodes.length < 2;
  const errors = graph.nodes.length ? validateRouteGraph(graph, documentData.interactions, WORLD_W, WORLD_H) : [];
  if (!graph.nodes.length) routeAudit.textContent = '尚无路线骨架。';
  else if (errors.length) routeAudit.textContent =
    `结构检查：${errors.slice(0, 2).join('；')}${errors.length > 2 ? `（另 ${errors.length - 2} 项）` : ''}`;
  else {
    const audit = routeGeometryAudit();
    const obstructed = audit.findings.filter((finding) => finding.blockedAt);
    const selectedFinding = edge && audit.findings.find((finding) => finding.from === edge.from && finding.to === edge.to);
    const detail = selectedFinding?.blockedAt
      ? `；当前连线首个受阻脚点 (${selectedFinding.blockedAt.join(', ')})`
      : selectedFinding?.reason === 'stairs' ? '；跨层边须另行实走'
        : selectedFinding ? '；当前直线段无碰撞，仍须贴图实走' : '';
    routeAudit.textContent = `结构连通：${graph.nodes.length} 点、${graph.edges.length} 线；${obstructed.length} 条直线段碰撞受阻${detail}。候选只提示，已确认边受阻则不能确认为最新；曲线需拆路点。`;
  }
  if (activeLayer === 'route') selectionLabel.textContent = node
    ? `${node.label} · ${node.kind} · ${node.note}` : '路线骨架 · 尚无节点';
  render();
}

function refreshActorControls(): void {
  const percent = documentData.actorScalePercent;
  const [x, y] = documentData.actorPreviewFoot;
  const height = Math.round(baseActorHeightAt(y) * percent / 100);
  const gameZoom = liuyuanChapterCameraZoom(sceneId);
  actorScaleSlider.value = String(percent);
  actorScaleInput.value = String(percent);
  const previewStatus = (sceneId.startsWith('liuyuan-') && draftPreview) || sceneId === 'canglang-corridor'
    ? ' · 右上角草稿预览同步' : ' · 当前仅供编辑器标定';
  const sizeText = gameZoom === null ? `世界身高约 ${height}px`
    : `世界身高约 ${height}px · 试玩镜头预计 ${Math.round(height * gameZoom)}px`;
  actorScaleReadout.textContent = `脚点 (${Math.round(x)}, ${Math.round(y)}) · ${sizeText} · ${percent}%${previewStatus}`;
  if (activeLayer === 'actor') selectionLabel.textContent = '人物比例只改变精灵绘制，不改变碰撞盒';
  render();
}

function setActiveLayer(layer: 'shape' | 'tile' | 'story' | 'route' | 'actor'): void {
  activeLayer = layer;
  editLayer.value = layer;
  shapeControls.hidden = layer !== 'shape';
  tileControls.hidden = layer !== 'tile';
  storyControls.hidden = layer !== 'story';
  routeControls.hidden = layer !== 'route';
  actorControls.hidden = layer !== 'actor';
  setPointEditMode('normal');
  if (layer === 'tile') refreshTileControls();
  else if (layer === 'story') refreshStoryControls();
  else if (layer === 'route') refreshRouteControls();
  else if (layer === 'actor') refreshActorControls();
  else refreshControls();
}

function setPointEditMode(mode: 'normal' | 'add'): void {
  pointEditMode = mode;
  addPointButton.classList.toggle('active', mode === 'add');
  addPointButton.setAttribute('aria-pressed', String(mode === 'add'));
  addPointButton.textContent = mode === 'add' ? '点击画布插点…' : '添加点';
  canvas.style.cursor = mode === 'add' ? 'copy' : 'crosshair';
}

function pathPolygon(points: readonly Point[], close = true): void {
  ctx.beginPath();
  points.forEach(([x, y], index) => index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
  if (close && points.length >= 3) ctx.closePath();
}

function drawShape(points: readonly Point[], kind: GeometryKind, selected: boolean): void {
  if (!points.length) return;
  pathPolygon(points);
  ctx.fillStyle = `${COLORS[kind]}${selected ? '32' : '16'}`;
  ctx.strokeStyle = COLORS[kind];
  ctx.globalAlpha = selected ? 1 : .5;
  ctx.lineWidth = selected ? 2 : 1;
  if (points.length >= 3) ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = 1;
  if (!selected) return;
  points.forEach(([x, y], index) => {
    ctx.beginPath();
    ctx.arc(x, y, index === selectedVertex ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fillStyle = index === selectedVertex ? '#fff' : COLORS[kind];
    ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.stroke();
  });
}

function renderTiles(): void {
  if (!showTiles.checked) return;
  const liveMap = buildEditorMap(documentData.tileRegions);
  ctx.fillStyle = 'rgba(239,83,80,.18)';
  ctx.strokeStyle = 'rgba(239,83,80,.65)';
  ctx.lineWidth = .5;
  for (let y = 0; y < liveMap.h; y++) for (let x = 0; x < liveMap.w; x++) {
    if (!SOLID.has(liveMap.map[y * liveMap.w + x])) continue;
    ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    ctx.strokeRect(x * TILE + .25, y * TILE + .25, TILE - .5, TILE - .5);
  }
}

function renderTileRegions(): void {
  if (activeLayer !== 'tile') return;
  ctx.save();
  ctx.lineWidth = .5;
  ctx.strokeStyle = 'rgba(255,255,255,.16)';
  for (let x = 0; x <= GRID_W; x++) {
    ctx.beginPath(); ctx.moveTo(x * TILE, 0); ctx.lineTo(x * TILE, WORLD_H); ctx.stroke();
  }
  for (let y = 0; y <= GRID_H; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * TILE); ctx.lineTo(WORLD_W, y * TILE); ctx.stroke();
  }
  for (const region of documentData.tileRegions) {
    const selected = region.id === selectedTileRegionId;
    const color = tileTypeInfo(region.tile)?.color ?? '#fff';
    const x = region.x * TILE, y = region.y * TILE, w = region.w * TILE, h = region.h * TILE;
    ctx.fillStyle = `${color}${selected ? '42' : '20'}`;
    ctx.strokeStyle = selected ? '#fff7d6' : color;
    ctx.lineWidth = selected ? 2 : 1;
    ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
    if (!selected) continue;
    for (const [hx, hy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]] as const) {
      ctx.fillStyle = '#fff7d6'; ctx.strokeStyle = '#171512'; ctx.lineWidth = 1;
      ctx.fillRect(hx - 3, hy - 3, 6, 6); ctx.strokeRect(hx - 3, hy - 3, 6, 6);
    }
    ctx.fillStyle = '#171512';
    ctx.fillRect(x + 3, y + 3, Math.max(72, region.id.length * 7), 12);
    ctx.fillStyle = '#fff7d6'; ctx.font = '9px ui-monospace, monospace';
    ctx.fillText(`${region.id} · ${region.w}×${region.h}`, x + 6, y + 12);
  }
  ctx.restore();
}

function renderObject(object: EditableObject, active: boolean): void {
  if (!active && !showAll.checked) return;
  object.colliders.forEach((shape, index) => drawShape(shape, 'collider', active && selectedKind === 'collider' && index === selectedShapeIndex));
  object.occluder?.polygons.forEach((shape, index) => drawShape(shape, 'occluder', active && selectedKind === 'occluder' && index === selectedShapeIndex));
  for (const effect of object.effects) {
    effect.polygons.forEach((shape, index) => drawShape(shape, 'effect', active && selectedKind === 'effect' && index === selectedShapeIndex));
    effect.holes.forEach((shape, index) => drawShape(shape, 'hole', active && selectedKind === 'hole' && index === selectedShapeIndex));
  }
  if (!object.occluder || !object.occluder.polygons.length) return;
  const points = object.occluder.polygons.flat();
  const minX = Math.min(...points.map(([x]) => x));
  const maxX = Math.max(...points.map(([x]) => x));
  ctx.strokeStyle = '#f4d35e'; ctx.lineWidth = active && selectedKind === 'occluder' ? 2 : 1;
  ctx.globalAlpha = active || showAll.checked ? 1 : .4;
  ctx.beginPath(); ctx.moveTo(minX, object.occluder.depthY); ctx.lineTo(maxX, object.occluder.depthY); ctx.stroke();
  ctx.globalAlpha = 1;
  if (active) {
    ctx.fillStyle = '#171512'; ctx.fillRect(minX, object.occluder.depthY - 13, Math.max(76, object.id.length * 7), 12);
    ctx.fillStyle = '#f4d35e'; ctx.font = '9px ui-monospace, monospace';
    ctx.fillText(`${object.id} · y=${object.occluder.depthY}`, minX + 3, object.occluder.depthY - 4);
  }
}

let lastReadinessSignature = '';
function updateSceneReadiness(): void {
  const colliders = documentData.objects.reduce((n, item) => n + item.colliders.length, 0);
  const occluders = documentData.objects.reduce((n, item) => n + (item.occluder?.polygons.length ?? 0), 0);
  const effects = documentData.objects.reduce((n, item) => n + item.effects.reduce((m, effect) => m + effect.polygons.length, 0), 0);
  const nodes = documentData.routeGraph.nodes.length, edges = documentData.routeGraph.edges.length;
  const checks: readonly (readonly [string, string, boolean])[] = [
    ['底图', image.naturalWidth ? `${WORLD_W}×${WORLD_H} 已载入` : '载入中／未找到', !image.naturalWidth],
    ['年代／来源卡', sceneEvidence ? `${evidencePeriod} · ${sceneEvidence.state === 'reference' ? '研究' : sceneEvidence.state === 'geometry' ? '标定' : sceneEvidence.state === 'playable' ? '试玩' : '验收'}` : '未登记', !sceneEvidence],
    ['大片地形 Tile', `${documentData.tileRegions.length} 区`, !documentData.tileRegions.length],
    ['独立物件碰撞', `${colliders} 块`, !colliders],
    ['前景遮挡／落地线', `${occluders} 片`, !occluders],
    ['水纹／动态区域', `${effects} 片（按场景需要）`, false],
    ['剧本／人物锚点', `${documentData.interactions.length} 点`, !documentData.interactions.length],
    ['门路骨架', `${nodes} 点 · ${edges} 线`, !nodes || !edges],
    ['草稿实走', !selectedPlate || draftPreview ? '可预览' : sceneId === 'canglang-corridor' ? '人物比例和廊柱遮挡可预览；路线仍用代码' : '仅可编辑／导出', !!selectedPlate && !draftPreview && sceneId !== 'canglang-corridor'],
  ];
  const signature = JSON.stringify(checks);
  if (signature === lastReadinessSignature) return;
  lastReadinessSignature = signature;
  sceneReadiness.replaceChildren(...checks.map(([label, value, empty]) => {
    const item = document.createElement('li'); item.dataset.empty = String(empty);
    const name = document.createElement('span'), state = document.createElement('span');
    name.textContent = label; state.textContent = value; item.append(name, state);
    return item;
  }));
  nextCalibrationStep.textContent = !image.naturalWidth ? '先检查底图路径与世界尺寸。'
    : sceneId === 'canglang-corridor' ? '逐柱调整青色遮挡裁片和黄色落地深度线；预览只读取廊柱与人物比例，不能按自由行走 Tile 验收。'
    : !documentData.tileRegions.length ? '下一步：在 Tile 层圈出实际可走与禁行地面。'
    : !colliders ? '下一步：为墙基、柱脚、树根等落地实体分物件标碰撞。'
    : !occluders ? '下一步：沿前景画遮挡裁片，并把黄色深度线落在物件脚下。'
    : !nodes || !edges ? '下一步：在通路层逐门画脚点和候选连线。'
    : !draftPreview && selectedPlate ? '已具备分层草稿；请导出 JSON 供代码接入，尚非可玩验收。'
    : '分层数据已可试走；还须逐像素、键盘、触屏和史料复核。';
}

function render(): void {
  updateSceneReadiness();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#20231f'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (image.complete && image.naturalWidth) {
    ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, WORLD_W, WORLD_H);
  }
  renderTiles();
  if (activeLayer === 'shape') {
    for (const object of documentData.objects) renderObject(object, object.id === selectedObjectId);
  }
  renderTileRegions();

  const anchorColors: Record<SceneStoryAnchor['kind'], string> = {
    interaction: '#62d879', trigger: '#f4d35e', npc: '#b18dff', visual: '#aeb8ac', boundary: '#ef5350',
  };
  ctx.font = '9px ui-monospace, monospace';
  for (const item of documentData.interactions) {
    if (activeLayer === 'route') continue;
    const active = activeLayer === 'story' && item.id === selectedStoryAnchorId;
    const color = anchorColors[item.kind ?? 'interaction'];
    ctx.beginPath(); ctx.arc(item.x, item.y, active ? 7 : 4, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    if (active) { ctx.strokeStyle = '#171512'; ctx.lineWidth = 2; ctx.stroke(); }
    const caption = `${item.scriptRef ? `${item.scriptRef} ` : ''}${item.label}`;
    ctx.fillStyle = '#102114'; ctx.fillRect(item.x + 7, item.y - 11, Math.max(28, caption.length * 9 + 5), 13);
    ctx.fillStyle = color; ctx.fillText(caption, item.x + 9, item.y - 2);
  }

  if (activeLayer === 'route') {
    const graph = documentData.routeGraph;
    const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
    const selectedEdge = graph.edges[selectedRouteEdgeIndex];
    const selectedBlock = selectedEdge && routeGeometryAudit({ nodes: graph.nodes, edges: [selectedEdge] }).findings.find((finding) =>
      finding.from === selectedEdge.from && finding.to === selectedEdge.to)?.blockedAt;
    for (const [index, edge] of graph.edges.entries()) {
      const from = nodes.get(edge.from), to = nodes.get(edge.to);
      if (!from || !to) continue;
      const color = edge.state === 'blocked' ? '#ef5350' : edge.state === 'confirmed' ? '#62d879' : '#e1c66e';
      ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = '#171512'; ctx.lineWidth = index === selectedRouteEdgeIndex ? 7 : 5; ctx.stroke();
      ctx.setLineDash(edge.state === 'candidate' ? [7, 5] : []);
      ctx.strokeStyle = color; ctx.lineWidth = index === selectedRouteEdgeIndex ? 4 : 2; ctx.stroke();
      ctx.setLineDash([]);
      if (edge.state === 'blocked') {
        const x = (from.x + to.x) / 2, y = (from.y + to.y) / 2;
        ctx.beginPath(); ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5);
        ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5);
        ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
      } else if (edge.via === 'stairs') {
        const x = (from.x + to.x) / 2, y = (from.y + to.y) / 2;
        ctx.fillStyle = '#171512'; ctx.fillRect(x - 7, y - 7, 14, 13);
        ctx.fillStyle = '#fff1b8'; ctx.fillText('↑', x - 3, y + 3);
      }
    }
    for (const node of graph.nodes) {
      const active = node.id === selectedRouteNodeId;
      const color = node.kind === 'portal' ? '#35d8e6' : node.kind === 'entry' ? '#f4d35e' : '#d5e4ca';
      ctx.fillStyle = '#171512'; ctx.fillRect(node.x - 7, node.y - 7, 14, 14);
      ctx.fillStyle = color; ctx.fillRect(node.x - (active ? 5 : 4), node.y - (active ? 5 : 4), active ? 10 : 8, active ? 10 : 8);
      const caption = `${(node.level ?? 0) ? `[${node.level}] ` : ''}${node.kind === 'portal' ? '门 ' : ''}${node.label}`;
      ctx.fillStyle = '#171512'; ctx.fillRect(node.x + 8, node.y - 14, Math.max(28, caption.length * 9 + 6), 13);
      ctx.fillStyle = color; ctx.fillText(caption, node.x + 11, node.y - 5);
    }
    if (selectedBlock) {
      const [x, y] = selectedBlock;
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#ef5350'; ctx.fill();
      ctx.strokeStyle = '#fff7d6'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#171512'; ctx.fillRect(x + 9, y - 14, 104, 14);
      ctx.fillStyle = '#fff7d6'; ctx.font = '9px ui-monospace, monospace';
      ctx.fillText(`受阻脚点 ${x}, ${y}`, x + 12, y - 4);
    }
  }

  if (activeLayer === 'actor') {
    const [actorX, actorY] = documentData.actorPreviewFoot;
    const height = Math.round(baseActorHeightAt(actorY) * documentData.actorScalePercent / 100);
    drawScholarGroundShadow(ctx, actorX, actorY, height);
    if (actorSprite.complete && actorSprite.naturalWidth) {
      if (sceneId === 'liuyuan-dongtian-three-windows-study-v1') {
        drawShenYanqiuAtFoot(ctx, actorSprite, 0, 0, actorX, actorY, height);
      } else {
        drawScholarAtFoot(ctx, actorSprite, 0, 0, actorX, actorY, height);
      }
    }
    ctx.fillStyle = '#171512'; ctx.fillRect(actorX + 9, actorY - 14, 78, 14);
    ctx.fillStyle = '#f263ff'; ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(`${height}px / ${documentData.actorScalePercent}%`, actorX + 12, actorY - 4);
  }

  if (sceneSpawn || activeLayer === 'actor') {
    const [actorX, actorY] = activeLayer === 'actor' ? documentData.actorPreviewFoot : sceneSpawn!;
    const profile = documentData.actorProfile;
    ctx.fillStyle = 'rgba(242,99,255,.38)'; ctx.strokeStyle = '#f263ff'; ctx.lineWidth = 1;
    ctx.fillRect(actorX - profile.halfW, actorY - profile.topInset, profile.halfW * 2, profile.topInset - profile.bottomInset);
    ctx.strokeRect(actorX - profile.halfW + .5, actorY - profile.topInset + .5, profile.halfW * 2 - 1, profile.topInset - profile.bottomInset - 1);
  }
}

function canvasPoint(event: PointerEvent | MouseEvent): Point {
  const rect = canvas.getBoundingClientRect();
  const snap = Number(snapSelect.value);
  const rawX = (event.clientX - rect.left) * canvas.width / rect.width;
  const rawY = (event.clientY - rect.top) * canvas.height / rect.height;
  return [
    Math.max(0, Math.min(WORLD_W, Math.round(rawX / snap) * snap)),
    Math.max(0, Math.min(WORLD_H, Math.round(rawY / snap) * snap)),
  ];
}

function vertexAt(points: readonly Point[], point: Point): number {
  // 命中半径按屏幕约 12px 保持稳定，避免高倍缩放下点中了手柄却误加新点。
  const radius = 12 / Number(zoomSelect.value);
  return points.findIndex(([x, y]) => Math.hypot(x - point[0], y - point[1]) <= radius);
}

function distanceToSegment(point: Point, a: Point, b: Point): number {
  const vx = b[0] - a[0], vy = b[1] - a[1];
  const length2 = vx * vx + vy * vy;
  if (!length2) return Math.hypot(point[0] - a[0], point[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * vx + (point[1] - a[1]) * vy) / length2));
  return Math.hypot(point[0] - (a[0] + vx * t), point[1] - (a[1] + vy * t));
}

function nearestEdge(points: readonly Point[], point: Point): number {
  const closest = closestEdge(points, point);
  return closest.distance <= 8 / Number(zoomSelect.value) ? closest.index : -1;
}

function closestEdge(points: readonly Point[], point: Point): { index: number; distance: number } {
  let best = -1, distance = Infinity;
  for (let index = 0; index < points.length; index++) {
    const next = (index + 1) % points.length;
    const d = distanceToSegment(point, points[index], points[next]);
    if (d < distance) { best = index; distance = d; }
  }
  return { index: best, distance };
}

function projectToSegment(point: Point, a: Point, b: Point): Point {
  const vx = b[0] - a[0], vy = b[1] - a[1];
  const length2 = vx * vx + vy * vy;
  if (!length2) return [...a];
  const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * vx + (point[1] - a[1]) * vy) / length2));
  const snap = Number(snapSelect.value);
  return [
    Math.round((a[0] + vx * t) / snap) * snap,
    Math.round((a[1] + vy * t) / snap) * snap,
  ];
}

function pointInPolygon(point: Point, points: readonly Point[]): boolean {
  if (points.length < 3) return false;
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if ((yi > point[1]) !== (yj > point[1])
      && point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function beginDrag(mode: typeof dragMode, event: PointerEvent, point: Point, shape?: Point[], edge = -1): void {
  checkpoint();
  dragMode = mode;
  dragStart = point;
  dragOriginal = shape ? shape.map(([x, y]) => [x, y]) : null;
  dragEdgeIndex = edge;
  canvas.setPointerCapture(event.pointerId);
  canvas.style.cursor = 'grabbing';
}

function clampTranslation(points: readonly Point[], dx: number, dy: number): Point {
  const xs = points.map(([x]) => x), ys = points.map(([, y]) => y);
  return [
    Math.max(-Math.min(...xs), Math.min(WORLD_W - Math.max(...xs), dx)),
    Math.max(-Math.min(...ys), Math.min(WORLD_H - Math.max(...ys), dy)),
  ];
}

function tileHandleAt(region: FuxueTileRegion, point: Point): 'nw' | 'ne' | 'sw' | 'se' | null {
  const radius = 10 / Number(zoomSelect.value);
  const corners = [
    ['nw', region.x * TILE, region.y * TILE],
    ['ne', (region.x + region.w) * TILE, region.y * TILE],
    ['sw', region.x * TILE, (region.y + region.h) * TILE],
    ['se', (region.x + region.w) * TILE, (region.y + region.h) * TILE],
  ] as const;
  return corners.find(([, x, y]) => Math.hypot(point[0] - x, point[1] - y) <= radius)?.[0] ?? null;
}

function tileRegionContains(region: FuxueTileRegion, point: Point): boolean {
  return point[0] >= region.x * TILE && point[0] <= (region.x + region.w) * TILE
    && point[1] >= region.y * TILE && point[1] <= (region.y + region.h) * TILE;
}

function beginTileDrag(event: PointerEvent, point: Point, region: FuxueTileRegion, mode: NonNullable<typeof tileDragMode>): void {
  checkpoint();
  tileDragMode = mode;
  tileDragStart = point;
  tileDragOriginal = { ...region };
  canvas.setPointerCapture(event.pointerId);
  canvas.style.cursor = mode === 'move' ? 'grabbing' : mode === 'nw' || mode === 'se' ? 'nwse-resize' : 'nesw-resize';
}

function updateTileDrag(point: Point): void {
  const region = selectedTileRegion();
  if (!region || !tileDragMode || !tileDragStart || !tileDragOriginal) return;
  const dx = Math.round((point[0] - tileDragStart[0]) / TILE);
  const dy = Math.round((point[1] - tileDragStart[1]) / TILE);
  const original = tileDragOriginal;
  if (tileDragMode === 'move') {
    region.x = Math.max(0, Math.min(GRID_W - original.w, original.x + dx));
    region.y = Math.max(0, Math.min(GRID_H - original.h, original.y + dy));
  } else {
    let left = original.x, top = original.y;
    let right = original.x + original.w, bottom = original.y + original.h;
    if (tileDragMode === 'nw' || tileDragMode === 'sw') left = Math.max(0, Math.min(right - 1, original.x + dx));
    if (tileDragMode === 'ne' || tileDragMode === 'se') right = Math.max(left + 1, Math.min(GRID_W, original.x + original.w + dx));
    if (tileDragMode === 'nw' || tileDragMode === 'ne') top = Math.max(0, Math.min(bottom - 1, original.y + dy));
    if (tileDragMode === 'sw' || tileDragMode === 'se') bottom = Math.max(top + 1, Math.min(GRID_H, original.y + original.h + dy));
    region.x = left; region.y = top; region.w = right - left; region.h = bottom - top;
  }
  markDirty('Tile 区域已修改');
  refreshTileControls();
}

canvas.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  const point = canvasPoint(event);
  if (activeLayer === 'actor') {
    checkpoint(); documentData.actorPreviewFoot = point;
    actorDrag = true; canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing'; markDirty('人物预览脚点已移动'); refreshActorControls(); return;
  }
  if (activeLayer === 'route') {
    const graph = documentData.routeGraph;
    const radius = 14 / Number(zoomSelect.value);
    const nearest = [...graph.nodes].reverse().find((item) => Math.hypot(item.x - point[0], item.y - point[1]) <= radius);
    if (nearest) {
      selectedRouteNodeId = nearest.id;
      checkpoint(); routeDrag = true; canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing'; refreshRouteControls(); return;
    }
    const nodes = new Map(graph.nodes.map((item) => [item.id, item]));
    const edgeIndex = graph.edges.findIndex((edge) => {
      const from = nodes.get(edge.from), to = nodes.get(edge.to);
      return Boolean(from && to && distanceToSegment(point, [from.x, from.y], [to.x, to.y]) <= 7 / Number(zoomSelect.value));
    });
    if (edgeIndex >= 0) { selectedRouteEdgeIndex = edgeIndex; refreshRouteControls(); }
    return;
  }
  if (activeLayer === 'story') {
    const radius = 14 / Number(zoomSelect.value);
    const nearest = [...documentData.interactions].reverse().find((item) => Math.hypot(item.x - point[0], item.y - point[1]) <= radius);
    if (nearest) {
      selectedStoryAnchorId = nearest.id;
      checkpoint(); storyDrag = true; canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing'; refreshStoryControls();
    }
    return;
  }
  if (activeLayer === 'tile') {
    let region = selectedTileRegion();
    let handle = region ? tileHandleAt(region, point) : null;
    if (!handle && (!region || !tileRegionContains(region, point))) {
      region = [...documentData.tileRegions].reverse().find((candidate) => tileRegionContains(candidate, point)) ?? null;
      if (region) {
        selectedTileRegionId = region.id;
        refreshTileControls();
        handle = tileHandleAt(region, point);
      }
    }
    if (region && (handle || tileRegionContains(region, point))) beginTileDrag(event, point, region, handle ?? 'move');
    return;
  }
  const object = selectedObject();
  let shape = selectedShape();
  if (!shape) {
    checkpoint();
    const shapes = shapeCollection(object, true); shapes.push([]); selectedShapeIndex = shapes.length - 1;
    refreshShapeSelect(); shape = selectedShape();
  }
  if (!shape) return;
  if (pointEditMode === 'add') {
    checkpoint();
    if (shape.length >= 2) {
      const edge = closestEdge(shape, point).index;
      const next = (edge + 1) % shape.length;
      const inserted = projectToSegment(point, shape[edge], shape[next]);
      shape.splice(edge + 1, 0, inserted);
      selectedVertex = edge + 1;
    } else {
      shape.push(point);
      selectedVertex = shape.length - 1;
    }
    markDirty('已添加顶点，可继续拖拽微调');
    setPointEditMode('normal');
    refreshControls(true);
    return;
  }
  const vertex = vertexAt(shape, point);
  if (vertex >= 0) {
    selectedVertex = vertex; beginDrag('vertex', event, point, shape); render(); return;
  }
  if (selectedKind === 'occluder' && object.occluder
    && Math.abs(point[1] - object.occluder.depthY) <= 5 / Number(zoomSelect.value)) {
    beginDrag('depth', event, point); return;
  }
  if (!event.shiftKey) {
    const edge = nearestEdge(shape, point);
    if (edge >= 0) {
      beginDrag('edge', event, point, shape, edge); return;
    }
    if (pointInPolygon(point, shape)) {
      beginDrag('shape', event, point, shape); return;
    }
  }
  checkpoint();
  if (event.shiftKey && shape.length >= 2) {
    const edge = nearestEdge(shape, point);
    if (edge >= 0) { shape.splice(edge + 1, 0, point); selectedVertex = edge + 1; }
    else { shape.push(point); selectedVertex = shape.length - 1; }
  } else {
    shape.push(point); selectedVertex = shape.length - 1;
  }
  markDirty(); refreshControls(true);
});

canvas.addEventListener('pointermove', (event) => {
  const point = canvasPoint(event);
  coordReadout.textContent = `世界坐标 x ${point[0]} · y ${point[1]}`;
  if (activeLayer === 'actor' && actorDrag) {
    documentData.actorPreviewFoot = point;
    markDirty('人物预览脚点已移动'); refreshActorControls(); return;
  }
  if (activeLayer === 'route' && routeDrag) {
    const node = selectedRouteNode();
    if (node) { node.x = point[0]; node.y = point[1]; markDirty('已移动路线节点'); refreshRouteControls(); }
    return;
  }
  if (activeLayer === 'story' && storyDrag) {
    const anchor = selectedStoryAnchor();
    if (anchor) { anchor.x = point[0]; anchor.y = point[1]; markDirty('已移动剧本锚点'); refreshStoryControls(); }
    return;
  }
  if (activeLayer === 'tile' && tileDragMode) {
    updateTileDrag(point);
    return;
  }
  if (dragMode === 'vertex') {
    const shape = selectedShape();
    if (shape && selectedVertex >= 0) shape[selectedVertex] = point;
    markDirty(); render();
  } else if ((dragMode === 'edge' || dragMode === 'shape') && dragStart && dragOriginal) {
    const shape = selectedShape();
    if (!shape) return;
    let dx = point[0] - dragStart[0], dy = point[1] - dragStart[1];
    if (dragMode === 'shape') {
      [dx, dy] = clampTranslation(dragOriginal, dx, dy);
      dragOriginal.forEach(([x, y], index) => { shape[index] = [x + dx, y + dy]; });
    } else {
      const next = (dragEdgeIndex + 1) % dragOriginal.length;
      [dx, dy] = clampTranslation([dragOriginal[dragEdgeIndex], dragOriginal[next]], dx, dy);
      const [x1, y1] = dragOriginal[dragEdgeIndex], [x2, y2] = dragOriginal[next];
      shape[dragEdgeIndex] = [x1 + dx, y1 + dy];
      shape[next] = [x2 + dx, y2 + dy];
    }
    markDirty(); render();
  } else if (dragMode === 'depth') {
    const object = selectedObject();
    if (object.occluder) {
      object.occluder.depthY = point[1]; depthInput.value = String(point[1]);
      markDirty(); render();
    }
  }
});

canvas.addEventListener('pointerup', (event) => {
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  if (actorDrag) { actorDrag = false; canvas.style.cursor = 'crosshair'; refreshActorControls(); return; }
  if (routeDrag) { routeDrag = false; canvas.style.cursor = 'crosshair'; refreshRouteControls(); return; }
  if (storyDrag) { storyDrag = false; canvas.style.cursor = 'crosshair'; refreshStoryControls(); return; }
  if (tileDragMode) {
    tileDragMode = null; tileDragStart = null; tileDragOriginal = null;
    canvas.style.cursor = 'crosshair'; refreshTileControls(); return;
  }
  dragMode = null; dragStart = null; dragOriginal = null; dragEdgeIndex = -1;
  canvas.style.cursor = pointEditMode === 'add' ? 'copy' : 'crosshair';
  refreshShapeSelect(true);
});
canvas.addEventListener('pointercancel', () => {
  actorDrag = false;
  tileDragMode = null; tileDragStart = null; tileDragOriginal = null;
  dragMode = null; dragStart = null; dragOriginal = null; dragEdgeIndex = -1;
  canvas.style.cursor = pointEditMode === 'add' ? 'copy' : 'crosshair';
});
canvas.addEventListener('pointerleave', () => { if (!dragMode) coordReadout.textContent = '世界坐标 x — · y —'; });
canvas.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  const shape = selectedShape();
  if (!shape) return;
  const vertex = vertexAt(shape, canvasPoint(event));
  if (vertex < 0) return;
  checkpoint(); shape.splice(vertex, 1); selectedVertex = -1; markDirty('已删除顶点'); refreshControls();
});

objectSelect.addEventListener('change', () => { selectedObjectId = objectSelect.value; selectedShapeIndex = 0; selectedVertex = -1; setPointEditMode('normal'); refreshControls(); });
geometryType.addEventListener('change', () => { selectedKind = geometryType.value as GeometryKind; selectedShapeIndex = 0; selectedVertex = -1; setPointEditMode('normal'); refreshControls(); });
shapeSelect.addEventListener('change', () => { selectedShapeIndex = Number(shapeSelect.value); selectedVertex = -1; refreshShapeSelect(); });
depthInput.addEventListener('change', () => {
  const object = selectedObject();
  checkpoint();
  if (!object.occluder) object.occluder = { id: object.id, depthY: Number(depthInput.value), polygons: [] };
  object.occluder.depthY = Math.max(0, Math.min(WORLD_H, Number(depthInput.value)));
  markDirty('已修改落地线'); render();
});
zoomSelect.addEventListener('change', () => {
  const zoom = Number(zoomSelect.value);
  canvas.style.width = `${WORLD_W * zoom}px`;
  canvas.style.height = `${WORLD_H * zoom}px`;
});
showTiles.addEventListener('change', render);
showAll.addEventListener('change', render);
editLayer.addEventListener('change', () => setActiveLayer(editLayer.value as 'shape' | 'tile' | 'story' | 'route' | 'actor'));
function setActorScalePercent(value: number): void {
  if (!Number.isFinite(value)) return;
  const next = Math.max(40, Math.min(250, Math.round(value / 5) * 5));
  if (next === documentData.actorScalePercent) return;
  documentData.actorScalePercent = next;
  markDirty(`人物可见身高设为 ${next}%（碰撞盒不变）`);
  refreshActorControls();
}
actorScaleSlider.addEventListener('pointerdown', checkpoint);
actorScaleSlider.addEventListener('keydown', checkpoint);
actorScaleSlider.addEventListener('input', () => setActorScalePercent(Number(actorScaleSlider.value)));
actorScaleInput.addEventListener('change', () => {
  checkpoint(); setActorScalePercent(Number(actorScaleInput.value)); refreshActorControls();
});
document.getElementById('actorScaleReset')!.addEventListener('click', () => {
  checkpoint(); setActorScalePercent(100); refreshActorControls();
});
routeNodeSelect.addEventListener('change', () => { selectedRouteNodeId = routeNodeSelect.value; refreshRouteControls(); });
routeEdgeSelect.addEventListener('change', () => { selectedRouteEdgeIndex = Number(routeEdgeSelect.value); refreshRouteControls(); });
function editRouteNodeField<K extends 'label' | 'kind' | 'level' | 'anchorId' | 'note'>(field: K, value: SceneRouteNode[K]): void {
  const node = selectedRouteNode(); if (!node || node[field] === value) return;
  checkpoint(); node[field] = value; markDirty('已修改路线节点'); refreshRouteControls();
}
function editRouteEdgeField<K extends 'state' | 'via' | 'note'>(field: K, value: SceneRouteEdge[K]): void {
  const edge = selectedRouteEdge(); if (!edge || edge[field] === value) return;
  checkpoint(); edge[field] = value; markDirty('已修改路线连线'); refreshRouteControls();
}
routeNodeLabel.addEventListener('change', () => editRouteNodeField('label', routeNodeLabel.value.trim()));
routeNodeKind.addEventListener('change', () => editRouteNodeField('kind', routeNodeKind.value as SceneRouteNode['kind']));
routeNodeLevel.addEventListener('change', () => editRouteNodeField('level', Number(routeNodeLevel.value)));
routeNodeAnchor.addEventListener('change', () => editRouteNodeField('anchorId', routeNodeAnchor.value || undefined));
routeNodeNote.addEventListener('change', () => editRouteNodeField('note', routeNodeNote.value.trim()));
routeEdgeState.addEventListener('change', () => editRouteEdgeField('state', routeEdgeState.value as SceneRouteEdge['state']));
routeEdgeVia.addEventListener('change', () => editRouteEdgeField('via', routeEdgeVia.value as SceneRouteEdge['via']));
routeEdgeNote.addEventListener('change', () => editRouteEdgeField('note', routeEdgeNote.value.trim()));
document.getElementById('newRouteNode')!.addEventListener('click', () => {
  const graph = documentData.routeGraph;
  let serial = graph.nodes.length + 1;
  while (graph.nodes.some((item) => item.id === `route-node-${serial}`)) serial += 1;
  const id = `route-node-${serial}`;
  const previous = selectedRouteNode();
  checkpoint();
  graph.nodes.push({ id, x: previous ? Math.min(WORLD_W, previous.x + 48) : Math.round(WORLD_W / 2),
    y: previous?.y ?? Math.round(WORLD_H / 2), label: '新路线点',
    kind: previous ? 'waypoint' : 'entry', level: previous?.level ?? 0, note: '拖到实际通路上，再核实门洞或地形。' });
  if (previous) graph.edges.push({ from: previous.id, to: id, state: 'candidate', via: 'walk', note: '新增候选路线，尚未实走。' });
  selectedRouteNodeId = id; selectedRouteEdgeIndex = graph.edges.length - 1;
  markDirty('已新增路线节点及候选连线'); refreshRouteControls();
});
document.getElementById('deleteRouteNode')!.addEventListener('click', () => {
  const graph = documentData.routeGraph;
  const index = graph.nodes.findIndex((item) => item.id === selectedRouteNodeId);
  if (index < 0) return;
  checkpoint(); graph.nodes.splice(index, 1);
  graph.edges = graph.edges.filter((edge) => edge.from !== selectedRouteNodeId && edge.to !== selectedRouteNodeId);
  selectedRouteNodeId = graph.nodes[Math.min(index, graph.nodes.length - 1)]?.id ?? '';
  selectedRouteEdgeIndex = 0; markDirty('已删除路线节点及其连线'); refreshRouteControls();
});
document.getElementById('newRouteEdge')!.addEventListener('click', () => {
  const from = routeEdgeFrom.value, to = routeEdgeTo.value;
  if (!from || !to || from === to) { setStatus('请选择两个不同路线节点'); return; }
  const graph = documentData.routeGraph;
  if (graph.edges.some((edge) => [edge.from, edge.to].sort().join('|') === [from, to].sort().join('|'))) {
    setStatus('这两个节点已经有连线'); return;
  }
  checkpoint(); graph.edges.push({ from, to, state: 'candidate', via: 'walk', note: '新候选路线，须对照底图实走。' });
  selectedRouteEdgeIndex = graph.edges.length - 1; markDirty('已新增候选连线'); refreshRouteControls();
});
document.getElementById('deleteRouteEdge')!.addEventListener('click', () => {
  if (!selectedRouteEdge()) return;
  checkpoint(); documentData.routeGraph.edges.splice(selectedRouteEdgeIndex, 1);
  selectedRouteEdgeIndex = Math.max(0, selectedRouteEdgeIndex - 1);
  markDirty('已删除路线连线'); refreshRouteControls();
});
storyAnchorSelect.addEventListener('change', () => { selectedStoryAnchorId = storyAnchorSelect.value; refreshStoryControls(); });
function editStoryField<K extends 'label' | 'kind' | 'scriptRef' | 'note'>(field: K, value: SceneStoryAnchor[K]): void {
  const anchor = selectedStoryAnchor(); if (!anchor || anchor[field] === value) return;
  checkpoint(); anchor[field] = value; markDirty('已修改剧本锚点'); refreshStoryControls();
}
storyAnchorLabel.addEventListener('change', () => editStoryField('label', storyAnchorLabel.value.trim()));
storyAnchorKind.addEventListener('change', () => editStoryField('kind', storyAnchorKind.value as SceneStoryAnchor['kind']));
storyAnchorScript.addEventListener('change', () => editStoryField('scriptRef', storyAnchorScript.value.trim()));
storyAnchorNote.addEventListener('change', () => editStoryField('note', storyAnchorNote.value.trim()));
document.getElementById('newStoryAnchor')!.addEventListener('click', () => {
  checkpoint();
  let serial = documentData.interactions.length + 1;
  while (documentData.interactions.some((item) => item.id === `story-anchor-${serial}`)) serial += 1;
  const id = `story-anchor-${serial}`;
  documentData.interactions.push({ id, x: Math.round(WORLD_W / 2), y: Math.round(WORLD_H / 2),
    label: '新锚点', kind: 'interaction', scriptRef: '', note: '请填写剧本场次与制作说明，再拖到正确位置。' });
  selectedStoryAnchorId = id; markDirty('已新增剧本锚点'); refreshStoryControls();
});
document.getElementById('deleteStoryAnchor')!.addEventListener('click', () => {
  const index = documentData.interactions.findIndex((item) => item.id === selectedStoryAnchorId);
  if (index < 0) return;
  checkpoint(); documentData.interactions.splice(index, 1);
  selectedStoryAnchorId = documentData.interactions[Math.min(index, documentData.interactions.length - 1)]?.id ?? '';
  markDirty('已删除剧本锚点'); refreshStoryControls();
});
tileRegionSelect.addEventListener('change', () => {
  selectedTileRegionId = tileRegionSelect.value;
  refreshTileControls();
});
tileTypeSelect.addEventListener('change', () => {
  const region = selectedTileRegion();
  if (!region) return;
  checkpoint(); region.tile = Number(tileTypeSelect.value);
  markDirty('已修改 Tile 区域类型'); refreshTileControls();
});

document.getElementById('newTileRegion')!.addEventListener('click', () => {
  checkpoint();
  let serial = documentData.tileRegions.length + 1;
  while (documentData.tileRegions.some((region) => region.id === `tile-region-${serial}`)) serial += 1;
  const region: FuxueTileRegion = { id: `tile-region-${serial}`, x: 20, y: 10, w: 4, h: 4, tile: T.WALL };
  documentData.tileRegions.push(region); selectedTileRegionId = region.id;
  markDirty('已新建 4×4 Tile 区域，可拖动内部或四角'); refreshTileControls();
});

deleteTileRegionButton.addEventListener('click', () => {
  const index = documentData.tileRegions.findIndex((region) => region.id === selectedTileRegionId);
  if (index < 0) return;
  checkpoint(); documentData.tileRegions.splice(index, 1);
  selectedTileRegionId = documentData.tileRegions[Math.min(index, documentData.tileRegions.length - 1)]?.id ?? '';
  markDirty('已删除 Tile 区域'); refreshTileControls();
});

document.getElementById('newObject')!.addEventListener('click', () => {
  const id = nextObjectId('object');
  if (!id) return;
  checkpoint();
  documentData.objects.push({ id, colliders: [], effects: [] });
  selectedObjectId = id; selectedShapeIndex = 0; selectedVertex = -1;
  newObjectIdInput.value = '';
  markDirty(`已新建物件 ${id}；请新建轮廓`); refreshControls();
});

splitToObjectButton.addEventListener('click', () => {
  const source = selectedObject();
  const shapes = shapeCollection(source);
  const shape = shapes[selectedShapeIndex];
  if (!shape) { setStatus('当前没有可拆出的轮廓'); return; }
  const id = nextObjectId(`${source.id}-part`);
  if (!id) return;
  checkpoint();
  shapes.splice(selectedShapeIndex, 1);
  const target: EditableObject = { id, colliders: [], effects: [] };
  if (selectedKind === 'collider') {
    target.colliders.push(shape);
  } else if (selectedKind === 'occluder' && source.occluder) {
    target.occluder = { id, depthY: source.occluder.depthY, polygons: [shape] };
    if (source.occluder.polygons.length === 0) delete source.occluder;
  } else {
    const sourceEffect = source.effects[0];
    if (sourceEffect) {
      target.effects.push({
        id: `${id}-effect`, kind: 'water-ripple',
        polygons: selectedKind === 'effect' ? [shape] : [],
        holes: selectedKind === 'hole' ? [shape] : [],
        ripple: { ...sourceEffect.ripple },
      });
      if (sourceEffect.polygons.length === 0 && sourceEffect.holes.length === 0) source.effects = [];
    }
  }
  documentData.objects.push(target);
  selectedObjectId = id; selectedShapeIndex = 0; selectedVertex = -1;
  newObjectIdInput.value = '';
  markDirty(`已将当前轮廓拆为独立物件 ${id}；现在可单独调整落地线`); refreshControls();
});

document.getElementById('newShape')!.addEventListener('click', () => {
  checkpoint(); const shapes = shapeCollection(selectedObject(), true); shapes.push([]);
  selectedShapeIndex = shapes.length - 1; selectedVertex = -1; setPointEditMode('add');
  markDirty('已新建空轮廓，请点击画布添加第一个点'); refreshControls();
});
document.getElementById('deleteShape')!.addEventListener('click', () => {
  const shapes = shapeCollection();
  if (!shapes.length) return;
  const object = selectedObject();
  checkpoint(); shapes.splice(selectedShapeIndex, 1); selectedShapeIndex = Math.max(0, selectedShapeIndex - 1);
  selectedVertex = -1; setPointEditMode('normal');
  if (selectedKind === 'occluder' && shapes.length === 0) delete object.occluder;
  if ((selectedKind === 'effect' || selectedKind === 'hole')
    && object.effects.every((effect) => effect.polygons.length === 0 && effect.holes.length === 0)) object.effects = [];
  markDirty('已删除轮廓，物件与类型数量已同步'); refreshControls();
});

addPointButton.addEventListener('click', () => {
  const mode = pointEditMode === 'add' ? 'normal' : 'add';
  setPointEditMode(mode);
  setStatus(mode === 'add' ? '请点击轮廓边线附近；新点会吸附到最近的边' : '已取消添加点');
});

deletePointButton.addEventListener('click', () => {
  const shape = selectedShape();
  if (!shape || selectedVertex < 0) { setStatus('请先点击一个顶点，再删除'); return; }
  checkpoint();
  shape.splice(selectedVertex, 1);
  selectedVertex = -1;
  markDirty('已删除选中顶点');
  refreshControls();
});

document.getElementById('undoButton')!.addEventListener('click', () => {
  const snapshot = past.pop(); if (!snapshot) return;
  future.push(serialize()); documentData = JSON.parse(snapshot) as EditorDocument;
  selectedVertex = -1; setPointEditMode('normal'); markDirty('已撤销');
  if (activeLayer === 'tile') refreshTileControls(); else if (activeLayer === 'story') refreshStoryControls(); else if (activeLayer === 'route') refreshRouteControls(); else if (activeLayer === 'actor') refreshActorControls(); else refreshControls();
});
document.getElementById('redoButton')!.addEventListener('click', () => {
  const snapshot = future.pop(); if (!snapshot) return;
  past.push(serialize()); documentData = JSON.parse(snapshot) as EditorDocument;
  selectedVertex = -1; setPointEditMode('normal'); markDirty('已重做');
  if (activeLayer === 'tile') refreshTileControls(); else if (activeLayer === 'story') refreshStoryControls(); else if (activeLayer === 'route') refreshRouteControls(); else if (activeLayer === 'actor') refreshActorControls(); else refreshControls();
});

interface StoredDraft { value: string; savedAt: number; committed: boolean }
const plateDraftKey = `gusu:geometry-editor:${sceneId}:v1`;
const plateLatestKey = `gusu:geometry-editor:${sceneId}:latest`;
const plateWindowPrefix = `gusu-geometry-plate:${sceneId}:`;

function saveCurrentDraft(value: string, committed = false): number {
  if (!selectedPlate) return committed
    ? commitFuxueGeometryDraftText(value)
    : (writeFuxueGeometryDraftText(value), Date.now());
  const record: StoredDraft = { value, savedAt: Date.now(), committed };
  try {
    localStorage.setItem(plateDraftKey, JSON.stringify(record));
    if (committed) localStorage.setItem(plateLatestKey, JSON.stringify(record));
  } catch { /* file:// may deny storage; window.name still carries this scene. */ }
  window.name = `${plateWindowPrefix}${JSON.stringify(record)}`;
  return record.savedAt;
}

if (draftPreview || sceneId === 'canglang-corridor') {
  previewLink.addEventListener('click', () => {
    if (dirty) { saveCurrentDraft(serialize()); dirty = false; }
  });
}

function readCurrentDraft(): StoredDraft | null {
  if (!selectedPlate) return readFuxueGeometryDraftRecord();
  const candidates: StoredDraft[] = [];
  if (window.name.startsWith(plateWindowPrefix)) {
    try { candidates.push(JSON.parse(window.name.slice(plateWindowPrefix.length)) as StoredDraft); }
    catch { /* Ignore malformed window transport. */ }
  }
  try {
    for (const key of [plateDraftKey, plateLatestKey]) {
      const raw = localStorage.getItem(key);
      if (raw) candidates.push(JSON.parse(raw) as StoredDraft);
    }
  } catch { /* file:// may deny storage. */ }
  return candidates.filter((item) => typeof item.value === 'string' && Number.isFinite(item.savedAt))
    .sort((a, b) => b.savedAt - a.savedAt || Number(b.committed) - Number(a.committed))[0] ?? null;
}

function clearCurrentDraft(): void {
  if (!selectedPlate) { clearFuxueGeometryDraftText(); return; }
  try { localStorage.removeItem(plateDraftKey); localStorage.removeItem(plateLatestKey); }
  catch { /* file:// may deny storage. */ }
  if (window.name.startsWith(plateWindowPrefix)) window.name = '';
}

document.getElementById('saveDraft')!.addEventListener('click', () => {
  saveCurrentDraft(serialize()); dirty = false;
  const suffix = validationSuffix();
  setStatus(suffix ? `草稿已保存${suffix}` : selectedPlate ? '此场景草稿已保存；可切换场景继续标定' : '草稿已保存；点击右上角可在府学中预览');
});
document.getElementById('commitLatest')!.addEventListener('click', () => {
  const errors = documentErrors();
  if (errors.length) {
    setStatus(`不能确认为最新版本：${errors.slice(0, 2).join('；')}`);
    return;
  }
  const savedAt = saveCurrentDraft(serialize(), true);
  dirty = false;
  setStatus(`当前编辑结果已确认为最新版本 · ${new Date(savedAt).toLocaleString('zh-CN')}`);
});
document.getElementById('copyJson')!.addEventListener('click', async () => {
  const value = serialize();
  try { await navigator.clipboard.writeText(value); }
  catch {
    const area = document.createElement('textarea'); area.value = value; document.body.append(area);
    area.select(); document.execCommand('copy'); area.remove();
  }
  setStatus(`JSON 已复制，可直接交给开发者或 Codex${validationSuffix()}`);
});
document.getElementById('downloadJson')!.addEventListener('click', () => {
  const blob = new Blob([serialize()], { type: 'application/json' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
  link.download = `${sceneId}-geometry.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  setStatus(`JSON 文件已生成${validationSuffix()}`);
});
importJson.addEventListener('change', async () => {
  const file = importJson.files?.[0]; if (!file) return;
  try {
    const candidate = JSON.parse(await file.text()) as unknown;
    const parsed = editorDocumentFrom(candidate);
    if (!parsed) throw new Error(`文件不是当前场景 ${sceneId} 的几何文档`);
    checkpoint(); documentData = parsed; selectedObjectId = documentData.objects[0].id;
    selectedTileRegionId = documentData.tileRegions[0]?.id ?? '';
    selectedShapeIndex = 0; selectedVertex = -1; setPointEditMode('normal');
    markDirty('已导入 JSON，请检查后保存草稿');
    if (activeLayer === 'tile') refreshTileControls(); else if (activeLayer === 'story') refreshStoryControls(); else if (activeLayer === 'route') refreshRouteControls(); else if (activeLayer === 'actor') refreshActorControls(); else refreshControls();
  } catch (error) { setStatus(`导入失败：${error instanceof Error ? error.message : '格式错误'}`); }
  importJson.value = '';
});
document.getElementById('resetData')!.addEventListener('click', () => {
  checkpoint(); documentData = sourceDocument(); clearCurrentDraft();
  selectedObjectId = documentData.objects[0].id; selectedKind = 'collider'; selectedShapeIndex = 0;
  selectedTileRegionId = documentData.tileRegions[0]?.id ?? '';
  selectedVertex = -1; setPointEditMode('normal');
  geometryType.value = selectedKind; dirty = false; setStatus('已恢复代码中的版本'); setActiveLayer(activeLayer);
});

addEventListener('beforeunload', (event) => {
  if (!dirty) return;
  event.preventDefault();
});

const savedRecord = readCurrentDraft();
if (savedRecord) {
  try {
    const candidate = JSON.parse(savedRecord.value) as unknown;
    const previousAssetPath = (candidate as Partial<EditorDocument>).asset?.path;
    const parsed = editorDocumentFrom(candidate);
    if (parsed) {
      documentData = parsed;
      if (sceneId === 'canglang-corridor' && documentData.objects.some((object) => object.id === 'corridor-post-01')) {
        selectedObjectId = 'corridor-post-01';
        selectedKind = 'occluder';
      }
      const oldRevision = (candidate as Partial<EditorDocument>).seedRevision ?? 0;
      const upgraded = sceneId === 'canglang-corridor' ? oldRevision < 1
        : sceneId === 'liuyuan-study-court-research-v1' ? oldRevision < 1
        : sceneId === 'liuyuan-guanyun-court-study-v2'
        ? oldRevision < 3
        : sceneId === 'yipu-whole-garden-study-v3' && oldRevision < 2;
      if (upgraded) {
        dirty = true;
        setStatus(sceneId === 'canglang-corridor'
          ? '已保留复廊原草稿；仅补缺失的廊柱遮挡物件。请逐柱调整后保存'
          : sceneId === 'liuyuan-study-court-research-v1'
          ? '已保留书斋院草稿；只将未手动移动的旧默认门前锚点改到铺地脚点。请检查后保存'
          : sceneId === 'liuyuan-guanyun-court-study-v2'
          ? '已保留浏览器草稿；只补缺失水纹，并将旧默认南厅檐深度对齐柱脚（自订深度不改）。请检查后保存'
          : '已保留浏览器草稿与原有编辑，只补缺失的延光阁／池水物件；请检查后保存');
      } else if (sceneId === 'liuyuan-entrance-topology-study'
        && previousAssetPath && previousAssetPath !== ASSET_PATH) {
        setStatus('已保留旧底图草稿；现在显示 v2 底图。请逐项重校 Tile、碰撞、檐口遮挡与落地线，确认后再保存为最新。');
      } else {
        setStatus(savedRecord.committed ? '已载入确认的最新版本' : '已载入上次保存的浏览器草稿');
      }
    }
  } catch { clearCurrentDraft(); }
}
geometryType.value = selectedKind;
selectedTileRegionId = documentData.tileRegions[0]?.id ?? '';
setActiveLayer('shape');
image.addEventListener('load', render);
image.addEventListener('error', () => {
  render();
  setStatus(`底图加载失败：${ASSET_PATH}。请检查文件是否存在，或重新打开当前场景。`);
});
// Keep the stored asset path stable for player drafts; only the displayed URL
// gets a cache key after a same-coordinate entrance art revision.
image.src = sceneId === 'liuyuan-entrance-topology-study' ? `${ASSET_PATH}?v=6` : ASSET_PATH;
actorSprite.addEventListener('load', render);
actorSprite.src = sceneId === 'liuyuan-dongtian-three-windows-study-v1'
  ? '../assets/characters/shen-yanqiu-sprites-v1.png'
  : '../assets/characters/scholar-player-sprites-v1.png';
