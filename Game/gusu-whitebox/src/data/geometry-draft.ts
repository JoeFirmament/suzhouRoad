import type { SceneEffectRegion, SceneGeometryObject, WorldPoint } from '../core/geometry.js';
import type { FuxueTileRegion } from './fuxue.js';
import { FUXUE_H, FUXUE_W } from './fuxue.js';

export const FUXUE_GEOMETRY_DRAFT_KEY = 'gusu:geometry-editor:fuxue-west-home:v1';
const FUXUE_GEOMETRY_DRAFT_META_KEY = `${FUXUE_GEOMETRY_DRAFT_KEY}:saved-at`;
const FUXUE_GEOMETRY_COMMITTED_KEY = 'gusu:geometry-editor:fuxue-west-home:latest';
const FUXUE_GEOMETRY_COMMITTED_META_KEY = `${FUXUE_GEOMETRY_COMMITTED_KEY}:saved-at`;
const FUXUE_GEOMETRY_WINDOW_PREFIX = 'gusu-geometry-draft:fuxue-west-home:';

export interface FuxueGeometryDraftRecord {
  value: string;
  savedAt: number;
  committed: boolean;
}

function windowRecord(): FuxueGeometryDraftRecord | null {
  if (!window.name.startsWith(FUXUE_GEOMETRY_WINDOW_PREFIX)) return null;
  const raw = window.name.slice(FUXUE_GEOMETRY_WINDOW_PREFIX.length);
  try {
    const envelope = JSON.parse(raw) as Partial<FuxueGeometryDraftRecord> & { format?: string };
    if (envelope.format === 'gusu-geometry-draft-transport'
      && typeof envelope.value === 'string' && typeof envelope.savedAt === 'number') {
      return { value: envelope.value, savedAt: envelope.savedAt, committed: envelope.committed === true };
    }
  } catch { /* v8 及更早版本直接存放文档 JSON */ }
  return { value: raw, savedAt: Date.now(), committed: false };
}

function localRecord(key: string, metaKey: string, committed: boolean): FuxueGeometryDraftRecord | null {
  try {
    const value = localStorage.getItem(key);
    if (!value) return null;
    const savedAt = Number(localStorage.getItem(metaKey)) || 0;
    return { value, savedAt, committed };
  } catch { return null; }
}

function writeWindowRecord(record: FuxueGeometryDraftRecord): void {
  window.name = `${FUXUE_GEOMETRY_WINDOW_PREFIX}${JSON.stringify({
    format: 'gusu-geometry-draft-transport', ...record,
  })}`;
}

/**
 * localStorage 负责同源持久化；window.name 负责 file:// 页面之间和跨页面往返。
 * 后者只绑定当前标签页，不会把草稿带到其他标签页。
 */
export function writeFuxueGeometryDraftText(value: string): void {
  const record = { value, savedAt: Date.now(), committed: false };
  try {
    localStorage.setItem(FUXUE_GEOMETRY_DRAFT_KEY, value);
    localStorage.setItem(FUXUE_GEOMETRY_DRAFT_META_KEY, String(record.savedAt));
  } catch { /* file:// 可能拒绝存储 */ }
  writeWindowRecord(record);
}

export function commitFuxueGeometryDraftText(value: string): number {
  const record = { value, savedAt: Date.now(), committed: true };
  try {
    localStorage.setItem(FUXUE_GEOMETRY_DRAFT_KEY, value);
    localStorage.setItem(FUXUE_GEOMETRY_DRAFT_META_KEY, String(record.savedAt));
    localStorage.setItem(FUXUE_GEOMETRY_COMMITTED_KEY, value);
    localStorage.setItem(FUXUE_GEOMETRY_COMMITTED_META_KEY, String(record.savedAt));
  } catch { /* 当前标签页的 window.name 仍可保证预览往返 */ }
  writeWindowRecord(record);
  return record.savedAt;
}

export function readFuxueGeometryDraftRecord(): FuxueGeometryDraftRecord | null {
  const candidates = [
    windowRecord(),
    localRecord(FUXUE_GEOMETRY_DRAFT_KEY, FUXUE_GEOMETRY_DRAFT_META_KEY, false),
    localRecord(FUXUE_GEOMETRY_COMMITTED_KEY, FUXUE_GEOMETRY_COMMITTED_META_KEY, true),
  ].filter((item): item is FuxueGeometryDraftRecord => !!item);
  candidates.sort((a, b) => b.savedAt - a.savedAt || Number(b.committed) - Number(a.committed));
  return candidates[0] ?? null;
}

export function readFuxueGeometryDraftText(): string | null {
  return readFuxueGeometryDraftRecord()?.value ?? null;
}

function removeLocalStorageItem(key: string): void {
  try { localStorage.removeItem(key); } catch { /* file:// 可能拒绝存储 */ }
}

export function clearFuxueGeometryDraftText(): void {
  for (const key of [
    FUXUE_GEOMETRY_DRAFT_KEY,
    FUXUE_GEOMETRY_DRAFT_META_KEY,
    FUXUE_GEOMETRY_COMMITTED_KEY,
    FUXUE_GEOMETRY_COMMITTED_META_KEY,
  ]) {
    removeLocalStorageItem(key);
  }
  if (window.name.startsWith(FUXUE_GEOMETRY_WINDOW_PREFIX)) window.name = '';
}

type RawObject = {
  id?: unknown;
  colliders?: unknown;
  occluder?: unknown;
  effects?: unknown;
};

function point(value: unknown): WorldPoint | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const x = Number(value[0]), y = Number(value[1]);
  return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
}

function polygon(value: unknown): readonly WorldPoint[] | null {
  if (!Array.isArray(value)) return null;
  const points = value.map(point);
  return points.length >= 3 && points.every(Boolean) ? points as WorldPoint[] : null;
}

function polygons(value: unknown): readonly (readonly WorldPoint[])[] | null {
  if (!Array.isArray(value)) return null;
  const result = value.map(polygon);
  return result.every(Boolean) ? result as Array<readonly WorldPoint[]> : null;
}

function isConvex(points: readonly WorldPoint[]): boolean {
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

export interface FuxueGeometryDraft {
  geometry: readonly SceneGeometryObject[];
  tileRegions: readonly FuxueTileRegion[] | null;
}

/** 仅在显式 `draft=1` 调试预览时读取；正式游戏永远使用代码中的已审核版本。 */
export function readFuxueGeometryDraft(): FuxueGeometryDraft | null {
  try {
    const raw = readFuxueGeometryDraftText();
    if (!raw) return null;
    const document = JSON.parse(raw) as { format?: unknown; sceneId?: unknown; objects?: unknown; tileRegions?: unknown };
    if (document.format !== 'gusu-scene-geometry'
      || document.sceneId !== 'fuxue-west-home'
      || !Array.isArray(document.objects)) return null;

    const output: SceneGeometryObject[] = [];
    for (const candidate of document.objects as RawObject[]) {
      if (typeof candidate.id !== 'string') return null;
      const colliders = Array.isArray(candidate.colliders)
        ? candidate.colliders.map(polygon)
        : [];
      if (colliders.some((shape) => !shape || !isConvex(shape))) return null;

      let occluder: SceneGeometryObject['occluder'];
      if (candidate.occluder && typeof candidate.occluder === 'object') {
        const rawOccluder = candidate.occluder as { id?: unknown; depthY?: unknown; polygons?: unknown };
        const occluderPolygons = polygons(rawOccluder.polygons);
        const depthY = Number(rawOccluder.depthY);
        if (typeof rawOccluder.id !== 'string' || !Number.isFinite(depthY) || !occluderPolygons) return null;
        occluder = { id: rawOccluder.id, depthY, polygons: occluderPolygons };
      }

      const effects: SceneEffectRegion[] = [];
      if (Array.isArray(candidate.effects)) {
        for (const rawEffect of candidate.effects) {
          if (!rawEffect || typeof rawEffect !== 'object') return null;
          const effect = rawEffect as Record<string, unknown>;
          const effectPolygons = polygons(effect.polygons);
          const holes = polygons(effect.holes ?? []);
          const ripple = effect.ripple as Record<string, unknown> | undefined;
          if (typeof effect.id !== 'string' || effect.kind !== 'water-ripple'
            || !effectPolygons || !holes || !ripple) return null;
          if (typeof ripple.color !== 'string' || !ripple.color) return null;
          const style = {
            color: ripple.color,
            rowSpacing: Number(ripple.rowSpacing),
            segmentSpacing: Number(ripple.segmentSpacing),
            minLength: Number(ripple.minLength),
            maxLength: Number(ripple.maxLength),
            speedMs: Number(ripple.speedMs),
          };
          if (Object.values(style).some((value) => typeof value === 'number' && !Number.isFinite(value))
            || style.rowSpacing <= 0 || style.segmentSpacing <= 0 || style.minLength <= 0
            || style.maxLength < style.minLength || style.speedMs <= 0) return null;
          effects.push({ id: effect.id, kind: 'water-ripple', polygons: effectPolygons, holes, ripple: style });
        }
      }
      output.push({
        id: candidate.id,
        colliders: colliders.map((shape) => ({ points: shape! })),
        occluder,
        effects,
      });
    }
    let tileRegions: FuxueTileRegion[] | null = null;
    if (Array.isArray(document.tileRegions)) {
      tileRegions = [];
      for (const rawRegion of document.tileRegions) {
        if (!rawRegion || typeof rawRegion !== 'object') return null;
        const region = rawRegion as Record<string, unknown>;
        const parsed = {
          id: region.id,
          x: Number(region.x), y: Number(region.y), w: Number(region.w), h: Number(region.h), tile: Number(region.tile),
        };
        if (typeof parsed.id !== 'string'
          || ![parsed.x, parsed.y, parsed.w, parsed.h, parsed.tile].every(Number.isInteger)
          || parsed.w <= 0 || parsed.h <= 0 || parsed.x < 0 || parsed.y < 0
          || parsed.x + parsed.w > FUXUE_W || parsed.y + parsed.h > FUXUE_H
          || parsed.tile < 0 || parsed.tile > 15) return null;
        tileRegions.push(parsed as FuxueTileRegion);
      }
    }
    return { geometry: output, tileRegions };
  } catch {
    return null;
  }
}
