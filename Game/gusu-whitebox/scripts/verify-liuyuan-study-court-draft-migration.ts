import { migrateStudyCourtDoorDefaults } from '../src/core/liuyuan-study-court-draft-migration.js';
import type { SceneRouteGraph, SceneStoryAnchor } from '../src/data/scene-plates.js';
import { LIUYUAN_STUDY_COURT_DOOR } from '../src/data/liuyuan-study-court-research.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const anchors: SceneStoryAnchor[] = [{ id: 'ly-study-court-door', x: 445, y: 650,
  label: '旧默认门前', kind: 'interaction', scriptRef: 'CH3-06/独立研究', note: '旧默认说明' }];
const graph: SceneRouteGraph = { nodes: [{ id: 'study-door', x: 445, y: 650,
  label: '旧默认节点', kind: 'goal', note: '旧默认说明' }], edges: [] };
assert(migrateStudyCourtDoorDefaults(anchors, graph), '旧默认门前点应迁移');
assert(anchors[0].x === LIUYUAN_STUDY_COURT_DOOR.x && anchors[0].y === LIUYUAN_STUDY_COURT_DOOR.y,
  '交互锚点未对齐可站脚点');
assert(graph.nodes[0].x === LIUYUAN_STUDY_COURT_DOOR.x && graph.nodes[0].y === LIUYUAN_STUDY_COURT_DOOR.y,
  '路线节点未对齐可站脚点');
assert(!migrateStudyCourtDoorDefaults(anchors, graph), '迁移重复执行不应再修改');

const customAnchors: SceneStoryAnchor[] = [{ ...anchors[0], x: 492, y: 706, label: '玩家自订锚点' }];
const customGraph: SceneRouteGraph = { nodes: [{ ...graph.nodes[0], x: 490, y: 704, label: '玩家自订路线点' }], edges: [] };
assert(!migrateStudyCourtDoorDefaults(customAnchors, customGraph), '玩家自订脚点应保持原样');
assert(customAnchors[0].x === 492 && customAnchors[0].label === '玩家自订锚点', '迁移改动了玩家锚点');
assert(customGraph.nodes[0].x === 490 && customGraph.nodes[0].label === '玩家自订路线点', '迁移改动了玩家路线点');
console.log('书斋院草稿迁移：仅替换旧默认门前脚点，自订锚点与路线节点保持原样。');
