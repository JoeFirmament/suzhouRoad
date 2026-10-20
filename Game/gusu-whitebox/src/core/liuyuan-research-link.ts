import { carryLiuyuanPlaytest } from './liuyuan-playtest.js';

/** A reversible research cut, never a claim that two scene images share one doorway. */
export interface ResearchFoot { x: number; y: number }

/** Standalone stone studies return to the editor; only an explicit research chain returns to the round-gate study. */
export function stoneForestPrevious(search: string): { href: string; label: string; fromReturnWalk: boolean; fromModernRoute: boolean } {
  const params = new URLSearchParams(search);
  const fromModernRoute = (params.get('route') === 'modern' && params.get('from') === 'east-hall')
    || (['window-study', 'guanyun-study'].includes(params.get('researchFrom') ?? '')
      && params.get('parent') === 'modern-route');
  if (fromModernRoute) {
    const back = new URLSearchParams({ route: 'modern', from: 'flower' });
    if (params.get('draft') === '1') back.set('draft', '1');
    carryLiuyuanPlaytest(back, search);
    return { href: `liuyuan-east-hall.html?${back}`, label: '回堂前游戏合成院 ↗',
      fromReturnWalk: false, fromModernRoute: true };
  }
  const fromReturnWalk = params.get('researchFrom') === 'return-walk'
    || (['window-study', 'guanyun-study'].includes(params.get('researchFrom') ?? '')
      && params.get('parent') === 'return-walk');
  if (!fromReturnWalk) return {
    href: 'geometry-editor.html?scene=liuyuan-stone-forest-court-study-v1',
    label: '回统一编辑器 ↗', fromReturnWalk: false, fromModernRoute: false,
  };
  const back = new URLSearchParams({ chapterPreview: '1', researchFrom: 'stone-forest' });
  if (params.get('draft') === '1') back.set('draft', '1');
  carryLiuyuanPlaytest(back, search);
  return { href: `liuyuan-youyicun-study.html?${back}`,
    label: '回现状圆门几何研究 ↗', fromReturnWalk: true, fromModernRoute: false };
}

function studyHref(page: string, foot: ResearchFoot, draft: boolean, parentReturnWalk: boolean, parentModernRoute: boolean): string {
  const params = new URLSearchParams({
    researchFrom: 'stone-forest',
    returnX: String(foot.x),
    returnY: String(foot.y),
  });
  if (draft) params.set('draft', '1');
  if (parentReturnWalk) params.set('parent', 'return-walk');
  if (parentModernRoute) params.set('parent', 'modern-route');
  carryLiuyuanPlaytest(params);
  return `${page}?${params}`;
}

export function windowStudyHref(foot: ResearchFoot, draft = false, parentReturnWalk = false, parentModernRoute = false): string {
  return studyHref('liuyuan-window-study.html', foot, draft, parentReturnWalk, parentModernRoute);
}

export function guanyunStudyHref(foot: ResearchFoot, draft = false, parentReturnWalk = false, parentModernRoute = false): string {
  return studyHref('liuyuan-guanyun-v2.html', foot, draft, parentReturnWalk, parentModernRoute);
}

export function stoneForestReturnHref(search: string, source: 'window-study' | 'guanyun-study' = 'window-study'): string | null {
  const params = new URLSearchParams(search);
  if (params.get('researchFrom') !== 'stone-forest') return null;
  const x = Number(params.get('returnX'));
  const y = Number(params.get('returnY'));
  if (!params.has('returnX') || !params.has('returnY') || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  const back = new URLSearchParams({
    researchFrom: source, returnX: String(x), returnY: String(y),
  });
  if (params.get('draft') === '1') back.set('draft', '1');
  if (params.get('parent') === 'return-walk') back.set('parent', 'return-walk');
  if (params.get('parent') === 'modern-route') back.set('parent', 'modern-route');
  carryLiuyuanPlaytest(back, search);
  return `liuyuan-stone-forest.html?${back}`;
}

export function safeStoneForestReturnFoot(
  search: string,
  entry: ResearchFoot,
  isBlocked: (x: number, y: number) => boolean,
  source: 'window-study' | 'guanyun-study' = 'window-study',
): ResearchFoot | null {
  const params = new URLSearchParams(search);
  if (params.get('researchFrom') !== source ||
      !params.has('returnX') || !params.has('returnY')) return null;
  const x = Number(params.get('returnX'));
  const y = Number(params.get('returnY'));
  if (!Number.isFinite(x) || !Number.isFinite(y) ||
      Math.hypot(x - entry.x, y - entry.y) > 120 || isBlocked(x, y)) return null;
  return { x, y };
}
