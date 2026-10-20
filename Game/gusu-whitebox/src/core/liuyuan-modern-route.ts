import { hasStoryFlag, type ProgressData, type StoryFlag } from './progression.js';
import { carryLiuyuanPlaytest } from './liuyuan-playtest.js';

/** Contemporary visitor-route topology; scene art and exact door positions remain game composites. */
export function modernRouteHref(page: string, from: string, draft = false, returning = false): string {
  const query = new URLSearchParams({ route: 'modern', from });
  if (draft) query.set('draft', '1');
  if (returning) query.set('return', '1');
  carryLiuyuanPlaytest(query);
  return `${page}?${query}`;
}

/** The reverse walk is its own game mode; a query string alone cannot unlock it. */
export function canEnterModernReturn(
  search: string, progress: ProgressData, from: string, prerequisite: StoryFlag,
): boolean {
  const query = new URLSearchParams(search);
  return query.get('return') === '1'
    && canEnterModernRoute(search, progress, from, prerequisite);
}

export function canEnterModernRoute(
  search: string, progress: ProgressData, from: string, prerequisite: StoryFlag,
): boolean {
  const query = new URLSearchParams(search);
  return query.get('route') === 'modern' && query.get('from') === from
    && hasStoryFlag(progress, prerequisite);
}
