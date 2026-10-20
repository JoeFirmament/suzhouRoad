import { STANDARD_PLAYER_PROFILE, type CollisionShape, type SceneEffectRegion, type SceneGeometryObject, type WorldPoint } from './geometry.js';
import { unreachableSceneFeet, validateTileScene, type RequiredSceneFoot } from './scene-validation.js';
import type { FuxueTileRegion } from '../data/fuxue.js';

type DraftRecord = { value: string; savedAt: number };
type DraftEffect = { id: string; kind: string; polygons: number[][][]; holes?: number[][][]; ripple: SceneEffectRegion['ripple'] };
type DraftObject = { id: string; colliders?: number[][][]; occluder?: { depthY: number; polygons: number[][][] }; effects?: DraftEffect[] };
type DraftDocument = { format: string; sceneId: string; world: { width: number; height: number }; asset?: { path?: string }; tileRegions: FuxueTileRegion[]; objects: DraftObject[]; actorScalePercent?: number; seedRevision?: number };

function sceneDraftRecords(sceneId: string): DraftRecord[] {
  const prefix = `gusu-geometry-plate:${sceneId}:`;
  const candidates: DraftRecord[] = [];
  if (window.name.startsWith(prefix)) try { candidates.push(JSON.parse(window.name.slice(prefix.length)) as DraftRecord); }
  catch { /* Broken transport is ignored. */ }
  try {
    for (const key of [`gusu:geometry-editor:${sceneId}:v1`, `gusu:geometry-editor:${sceneId}:latest`]) {
      const raw = localStorage.getItem(key);
      if (raw) candidates.push(JSON.parse(raw) as DraftRecord);
    }
  } catch { /* file:// may deny storage */ }
  return candidates.filter((item) => typeof item.value === 'string' && Number.isFinite(item.savedAt))
    .sort((a,b) => b.savedAt-a.savedAt);
}

/** Visual-only preview for constrained scenes: never imports Tile, colliders, or route edits. */
export function readSceneActorScalePercent(sceneId: string, worldW: number, worldH: number): number | null {
  if (new URLSearchParams(location.search).get('actorDraft') !== '1') return null;
  for (const record of sceneDraftRecords(sceneId)) try {
    const data = JSON.parse(record.value) as DraftDocument;
    if (data.format !== 'gusu-scene-geometry' || data.sceneId !== sceneId
      || data.world?.width !== worldW || data.world?.height !== worldH) continue;
    if (data.actorScalePercent === undefined) return 100;
    if (Number.isInteger(data.actorScalePercent)
      && data.actorScalePercent >= 40 && data.actorScalePercent <= 250) return data.actorScalePercent;
  } catch { /* Keep looking for another valid draft. */ }
  return null;
}

/** Constrained-scene preview reads visual masks only; draft collision, Tile and routes never enter gameplay. */
export function readSceneVisualOccluders(sceneId: string, worldW: number, worldH: number): readonly SceneGeometryObject[] | null {
  if (new URLSearchParams(location.search).get('actorDraft') !== '1') return null;
  for (const record of sceneDraftRecords(sceneId)) try {
    const data = JSON.parse(record.value) as DraftDocument;
    if (data.format !== 'gusu-scene-geometry' || data.sceneId !== sceneId
      || data.world?.width !== worldW || data.world?.height !== worldH
      || !Array.isArray(data.objects) || (data.seedRevision ?? 0) < 1) continue;
    const masks: SceneGeometryObject[] = [];
    let valid = true;
    const ids = new Set<string>();
    for (const item of data.objects) {
      if (!item.occluder) continue;
      const { depthY, polygons } = item.occluder;
      if (typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id)
        || !Number.isFinite(depthY) || depthY < 0 || depthY > worldH
        || !Array.isArray(polygons) || !polygons.length || !polygons.every((polygon) =>
          Array.isArray(polygon) && polygon.length >= 3
          && polygon.every((point) => Array.isArray(point) && point.length === 2
            && point.every(Number.isFinite) && point[0] >= 0 && point[1] >= 0
            && point[0] <= worldW && point[1] <= worldH))) { valid = false; break; }
      ids.add(item.id);
      masks.push({ id: item.id, occluder: {
        id: item.id, depthY, polygons: polygons as unknown as readonly (readonly WorldPoint[])[],
      } });
    }
    if (valid) return masks;
  } catch { /* Keep looking for another valid draft. */ }
  return null;
}

/** Plate drafts are read-only here. Invalid/stale drafts never replace code geometry or overwrite player data. */
export function readScenePlateDraft(
  sceneId: string, worldW: number, worldH: number,
  buildMap: (regions: readonly FuxueTileRegion[]) => { map: Uint8Array; w: number; h: number; spawn: { x: number; y: number } },
  requiredFeet: readonly RequiredSceneFoot[] = [],
): { regions: readonly FuxueTileRegion[]; geometry: readonly SceneGeometryObject[]; actorScalePercent: number; assetPath?: string } | null {
  if (new URLSearchParams(location.search).get('draft') !== '1') return null;
  const validPolygon = (value: unknown): value is number[][] => Array.isArray(value) && value.length >= 3
    && value.every((point) => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite)
      && point[0] >= 0 && point[1] >= 0 && point[0] <= worldW && point[1] <= worldH);
  const validCollider = (value: unknown): value is number[][] => {
    if (!validPolygon(value)) return false;
    let sign = 0;
    for (let i = 0; i < value.length; i++) {
      const a = value[i], b = value[(i + 1) % value.length], c = value[(i + 2) % value.length];
      const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
      if (cross === 0) continue;
      if (sign && Math.sign(cross) !== sign) return false;
      sign = Math.sign(cross);
    }
    return sign !== 0;
  };
  const validEffect = (value: DraftEffect): boolean => value.kind === 'water-ripple'
    && typeof value.id === 'string' && !!value.id.trim()
    && Array.isArray(value.polygons) && value.polygons.length > 0 && value.polygons.every(validPolygon)
    && Array.isArray(value.holes ?? []) && (value.holes ?? []).every(validPolygon)
    && typeof value.ripple?.color === 'string' && !!value.ripple.color
    && Number.isFinite(value.ripple.rowSpacing) && value.ripple.rowSpacing > 0
    && Number.isFinite(value.ripple.segmentSpacing) && value.ripple.segmentSpacing > 0
    && Number.isFinite(value.ripple.minLength) && value.ripple.minLength > 0
    && Number.isFinite(value.ripple.maxLength) && value.ripple.maxLength >= value.ripple.minLength
    && Number.isFinite(value.ripple.speedMs) && value.ripple.speedMs > 0;
  for (const record of sceneDraftRecords(sceneId)) {
    try {
      const data = JSON.parse(record.value) as DraftDocument;
      if (data.format !== 'gusu-scene-geometry' || data.sceneId !== sceneId
        || data.world?.width !== worldW || data.world?.height !== worldH
        || !Array.isArray(data.tileRegions) || !Array.isArray(data.objects)) continue;
      if (data.actorScalePercent !== undefined && (!Number.isInteger(data.actorScalePercent)
        || data.actorScalePercent < 40 || data.actorScalePercent > 250)) continue;
      if (!data.tileRegions.every((item) => typeof item.id === 'string'
        && [item.x,item.y,item.w,item.h,item.tile].every(Number.isInteger)
        && item.w > 0 && item.h > 0 && item.x >= 0 && item.y >= 0
        && item.x+item.w <= worldW/16 && item.y+item.h <= worldH/16)) continue;
      if (!data.objects.every((item) => typeof item.id === 'string'
        && (item.colliders ?? []).every(validCollider)
        && (!item.occluder || (Number.isFinite(item.occluder.depthY)
          && (item.occluder.polygons ?? []).every(validPolygon)))
        && Array.isArray(item.effects ?? []) && (item.effects ?? []).every(validEffect))) continue;
      const geometry: SceneGeometryObject[] = data.objects.map((item) => ({
        id: item.id,
        colliders: (item.colliders ?? []).map((points) => ({ points: points as unknown as readonly WorldPoint[] })),
        occluder: item.occluder ? { id: item.id, depthY: item.occluder.depthY,
          polygons: item.occluder.polygons as unknown as readonly (readonly WorldPoint[])[] } : undefined,
        effects: (item.effects ?? []).map((effect) => ({
          id: effect.id, kind: 'water-ripple',
          polygons: effect.polygons as unknown as readonly (readonly WorldPoint[])[],
          holes: (effect.holes ?? []) as unknown as readonly (readonly WorldPoint[])[],
          ripple: { ...effect.ripple },
        })),
      }));
      const scene = buildMap(data.tileRegions);
      const obstacles: CollisionShape[] = geometry.flatMap((object) => object.colliders ?? []);
      if (validateTileScene(sceneId, { ...scene, obstacles }, STANDARD_PLAYER_PROFILE).length) continue;
      if (unreachableSceneFeet({ ...scene, obstacles }, requiredFeet, STANDARD_PLAYER_PROFILE).length) continue;
      return { regions:data.tileRegions,geometry, actorScalePercent: data.actorScalePercent ?? 100,
        assetPath: typeof data.asset?.path === 'string' ? data.asset.path : undefined };
    } catch { /* Keep looking for another valid draft. */ }
  }
  return null;
}
