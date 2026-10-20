import type { SceneRouteGraph, SceneStoryAnchor } from '../data/scene-plates.js';
import { LIUYUAN_STUDY_COURT_DOOR } from '../data/liuyuan-study-court-research.js';

/** Preserve user-adjusted points; migrate only coordinates from the old code seed. */
export function migrateStudyCourtDoorDefaults(
  interactions: SceneStoryAnchor[], routeGraph: SceneRouteGraph,
): boolean {
  let changed = false;
  const anchor = interactions.find((item) => item.id === 'ly-study-court-door');
  if (anchor?.x === 445 && anchor.y === 650) {
    anchor.x = LIUYUAN_STUDY_COURT_DOOR.x; anchor.y = LIUYUAN_STUDY_COURT_DOOR.y;
    anchor.label = '西侧书房门前可站脚点';
    anchor.note = '在铺地上听声、轻叩的游戏脚点；它不是门洞坐标，清末门位与匾额未核。';
    changed = true;
  }
  const node = routeGraph.nodes.find((item) => item.id === 'study-door');
  if (node?.x === 445 && node.y === 650) {
    node.x = LIUYUAN_STUDY_COURT_DOOR.x; node.y = LIUYUAN_STUDY_COURT_DOOR.y;
    node.label = '书房门前铺地';
    node.note = '站定后可听或叩；不是旧门洞坐标。';
    changed = true;
  }
  return changed;
}
