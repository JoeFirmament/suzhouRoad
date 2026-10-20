import { compositionRouteHref } from '../src/core/liuyuan-composition-route.js';

function assert(actual: string, expected: string): void {
  if (actual !== expected) throw new Error(`画谱往返 URL 不符：${actual}，预期 ${expected}`);
}

assert(compositionRouteHref('liuyuan-composition-study.html', true, true),
  'liuyuan-composition-study.html?chapter=1&draft=1');
assert(compositionRouteHref('liuyuan-composition-atlas.html', true, true),
  'liuyuan-composition-atlas.html?chapter=1&draft=1');
assert(compositionRouteHref('liuyuan-flower.html', true, true, true),
  'liuyuan-flower.html?chapter=1&draft=1&album=done');
assert(compositionRouteHref('liuyuan-flower.html', false, true, true),
  'liuyuan-flower.html?draft=1&album=done');
assert(compositionRouteHref('liuyuan-flower.html', true, false),
  'liuyuan-flower.html?chapter=1');
assert(compositionRouteHref('liuyuan-flower.html', false, false), 'liuyuan-flower.html');
console.log('花木院—兰谱—画谱：章节、草稿与交画返院 URL 续传通过。');
