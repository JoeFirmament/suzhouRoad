/**
 * CH3 runtime and unified-editor character calibration share these defaults.
 * World heights differ because the walkable plates use different world scales;
 * the useful comparison is height after the runtime camera zoom. The editor's
 * actorScalePercent still applies on top of these defaults per scene/draft.
 */
export const LIUYUAN_CHARACTER_SCALE = {
  entry: { farFootY: 250, nearFootY: 656, farHeight: 60, nearHeight: 63, cameraZoom: 2 },
  court: { worldHeight: 84, cameraZoom: 1.5 },
  lvyin: { worldHeight: 84, cameraZoom: 1.5 },
  flower: { worldHeight: 84, cameraZoom: 1.5, kneelingFloristHeight: 72 },
  eastHall: { worldHeight: 84, cameraZoom: 1.5 },
  stoneForest: { worldHeight: 84, cameraZoom: 1.5 },
  studyCourt: { worldHeight: 120, cameraZoom: .9 },
  studyInterior: { worldHeight: 180, cameraZoom: .75 },
} as const;

const CHAPTER_SCENE_SCALE: Readonly<Record<string, { worldHeight: number }>> = {
  'liuyuan-tree-court-no-water-study-v1': LIUYUAN_CHARACTER_SCALE.court,
  'liuyuan-lvyin-pond-study-v1': LIUYUAN_CHARACTER_SCALE.lvyin,
  'liuyuan-flower-work-yard-study-v3': LIUYUAN_CHARACTER_SCALE.flower,
  'liuyuan-east-hall-magnolia-court-study-v1': LIUYUAN_CHARACTER_SCALE.eastHall,
  'liuyuan-stone-forest-court-study-v1': LIUYUAN_CHARACTER_SCALE.stoneForest,
  'liuyuan-study-court-research-v1': LIUYUAN_CHARACTER_SCALE.studyCourt,
  'liuyuan-study-interior-research-v1': LIUYUAN_CHARACTER_SCALE.studyInterior,
};

const CHAPTER_SCENE_ZOOM: Readonly<Record<string, number>> = {
  'liuyuan-entrance-topology-study': LIUYUAN_CHARACTER_SCALE.entry.cameraZoom,
  'liuyuan-tree-court-no-water-study-v1': LIUYUAN_CHARACTER_SCALE.court.cameraZoom,
  'liuyuan-lvyin-pond-study-v1': LIUYUAN_CHARACTER_SCALE.lvyin.cameraZoom,
  'liuyuan-flower-work-yard-study-v3': LIUYUAN_CHARACTER_SCALE.flower.cameraZoom,
  'liuyuan-east-hall-magnolia-court-study-v1': LIUYUAN_CHARACTER_SCALE.eastHall.cameraZoom,
  'liuyuan-stone-forest-court-study-v1': LIUYUAN_CHARACTER_SCALE.stoneForest.cameraZoom,
  'liuyuan-study-court-research-v1': LIUYUAN_CHARACTER_SCALE.studyCourt.cameraZoom,
  'liuyuan-study-interior-research-v1': LIUYUAN_CHARACTER_SCALE.studyInterior.cameraZoom,
};

/** In-game canvas zoom, not the editor canvas's user-selected CSS zoom. */
export function liuyuanChapterCameraZoom(sceneId: string): number | null {
  return CHAPTER_SCENE_ZOOM[sceneId] ?? null;
}

/** Base world-space height for the eight mandatory walking plates; no draft mutation. */
export function liuyuanChapterActorHeightAt(sceneId: string, footY: number): number | null {
  if (sceneId === 'liuyuan-entrance-topology-study') {
    const scale = LIUYUAN_CHARACTER_SCALE.entry;
    const t = Math.max(0, Math.min(1, (footY - scale.farFootY) / (scale.nearFootY - scale.farFootY)));
    return Math.round(scale.farHeight + (scale.nearHeight - scale.farHeight) * t);
  }
  return CHAPTER_SCENE_SCALE[sceneId]?.worldHeight ?? null;
}
