import { carryLiuyuanPlaytest } from './liuyuan-playtest.js';

/** 可选观察只改变下一幕的回响，不结算章节旗标或六艺。 */
export function chapterSceneHref(page: string, draft = false): string {
  const query = new URLSearchParams({ chapter: '1' });
  if (draft) query.set('draft', '1');
  carryLiuyuanPlaytest(query);
  return `${page}?${query}`;
}

export function lvyinSceneUrl(sawCourtWindow: boolean, draft = false): string {
  const query = new URLSearchParams({ chapter: '1' });
  if (sawCourtWindow) query.set('courtWindow', '1');
  if (draft) query.set('draft', '1');
  carryLiuyuanPlaytest(query);
  return `liuyuan-lvyin.html?${query}`;
}

export function courtReturnUrl(sawCourtWindow: boolean, draft = false): string {
  const query = new URLSearchParams({ chapter: '1' });
  if (sawCourtWindow) query.set('courtWindow', '1');
  if (draft) query.set('draft', '1');
  carryLiuyuanPlaytest(query);
  return `liuyuan-court.html?${query}`;
}

export function lvyinBankLine(sawCourtWindow: boolean): string {
  return sawCourtWindow
    ? '窗里那一线山色，到池边有了倒影。水到轩前才真正展开。'
    : '水到轩前才展开。走近了，才看出山石和池岸怎样相接。';
}
