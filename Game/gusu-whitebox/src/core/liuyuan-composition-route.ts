import { carryLiuyuanPlaytest } from './liuyuan-playtest.js';

/** Keep the garden geometry preview context while visiting the independent composition minigames. */
export function compositionRouteHref(page: string, chapter: boolean, draft: boolean, albumDone = false): string {
  const query = new URLSearchParams();
  if (chapter) query.set('chapter', '1');
  if (draft) query.set('draft', '1');
  if (albumDone) query.set('album', 'done');
  carryLiuyuanPlaytest(query);
  return `${page}${query.toString() ? `?${query}` : ''}`;
}
