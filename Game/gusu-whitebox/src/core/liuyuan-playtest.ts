/** A separate save slot for the playable chapter preview. Never reuse the campaign key. */
export function isLiuyuanPlaytest(search?: string): boolean {
  const current = search ?? (typeof location === 'undefined' ? '' : location.search);
  return new URLSearchParams(current).get('playtest') === '1';
}

export function carryLiuyuanPlaytest(query: URLSearchParams, search?: string): void {
  if (isLiuyuanPlaytest(search)) query.set('playtest', '1');
}
