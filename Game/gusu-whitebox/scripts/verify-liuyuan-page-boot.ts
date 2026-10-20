import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { LIUYUAN_CHAPTER_FLAGS } from '../src/core/liuyuan-progression.js';

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

type FakeElement = {
  hidden: boolean; checked: boolean; textContent: string; innerHTML: string; href: string;
  dataset: Record<string, string>; width: number; height: number;
  addEventListener: () => void; getContext: () => object;
  querySelector: () => FakeElement; querySelectorAll: () => FakeElement[];
  replaceChildren: () => void; append: () => void;
};
const context2d = new Proxy({}, { get: (_, property) => property === 'measureText'
  ? () => ({ width: 0 }) : () => undefined });
function element(): FakeElement {
  return {
    hidden: false, checked: false, textContent: '', innerHTML: '', href: '', dataset: {}, width: 960, height: 640,
    addEventListener() {}, getContext: () => context2d,
    querySelector: () => element(), querySelectorAll: () => [],
    replaceChildren() {}, append() {},
  };
}
const scenePages = [
  'liuyuan-entry', 'liuyuan-court', 'liuyuan-lvyin', 'liuyuan-flower', 'liuyuan-east-hall',
  'liuyuan-stone-forest', 'liuyuan-study-court', 'liuyuan-study-interior', 'liuyuan-leaf-writing-study',
] as const;
const forwardQueries: Record<string, string> = {
  'liuyuan-entry': '', 'liuyuan-court': '?chapter=1', 'liuyuan-lvyin': '?chapter=1',
  'liuyuan-flower': '?chapter=1', 'liuyuan-east-hall': '?route=modern&from=flower',
  'liuyuan-stone-forest': '?route=modern&from=east-hall',
  'liuyuan-study-court': '?route=modern&from=stone-forest',
  'liuyuan-study-interior': '?route=modern&from=study-court',
  'liuyuan-leaf-writing-study': '?route=modern&from=study-interior',
};
const returnQueries: Record<string, string> = {
  'liuyuan-entry': '?route=modern&from=court&return=1',
  'liuyuan-court': '?route=modern&from=lvyin&return=1',
  'liuyuan-lvyin': '?route=modern&from=flower&return=1',
  'liuyuan-flower': '?route=modern&from=east-hall&return=1',
  'liuyuan-east-hall': '?route=modern&from=stone-forest&return=1',
  'liuyuan-stone-forest': '?route=modern&from=study-court&return=1',
  'liuyuan-study-court': '?route=modern&from=leaf&return=1',
};

function boot(page: string, search: string, flags: readonly string[]): Record<string, FakeElement> {
  const html = readFileSync(`${page}.html`, 'utf8');
  const script = html.match(/<script src="(dist\/[^"]+\.js)(?:\?[^"]+)?"/);
  assert(script, `${page} 未引用正式打包脚本`);
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const nodes: Record<string, FakeElement> = {};
  const document = {
    getElementById: (id: string) => {
      if (!ids.has(id)) return null;
      return nodes[id] ??= element();
    },
    createElement: () => element(), querySelectorAll: () => [],
  };
  const progress = {
    version: 1, arts: { li: 0, yue: 0, she: 0, yu: 1, shu: 1, shuMath: 0 },
    gardens: { canglang: 'open', wangshi: 'locked', zhuozheng: 'locked', shizilin: 'locked',
      liuyuan: flags.includes('ly-unlocked') ? 'complete' : 'entered', ouyuan: 'locked', yipu: 'locked',
      huanxiu: 'locked', tuisi: 'locked' },
    completedTasks: [], knowledge: ['liuyuan-magnolia-slip'], storyFlags: flags, updatedAt: 1,
  };
  const frames: Array<(now: number) => void> = [];
  class FakeImage { complete = false; naturalWidth = 0; naturalHeight = 0; src = ''; addEventListener() {} }
  runInNewContext(readFileSync(script[1], 'utf8'), {
    document, window: { name: '', addEventListener() {} }, location: { search, assign() {}, href: '' },
    localStorage: { getItem: (key: string) => key === 'gusu-nine-gardens-rpg-v1' ? JSON.stringify(progress) : null },
    Image: FakeImage, URLSearchParams, structuredClone, requestAnimationFrame: (callback: (now: number) => void) => {
      frames.push(callback); return frames.length;
    },
  }, { filename: `${page}${search}` });
  frames.shift()?.(16);
  return nodes;
}

const throughLeaf = LIUYUAN_CHAPTER_FLAGS.slice(0, 13);
const carrying = LIUYUAN_CHAPTER_FLAGS.slice(0, 14);
for (const page of scenePages) {
  boot(page, '', []);
  boot(page, forwardQueries[page], throughLeaf);
  boot(page, `${forwardQueries[page]}${forwardQueries[page].includes('?') ? '&' : '?'}draft=1`, throughLeaf);
}
for (const [page, search] of Object.entries(returnQueries)) {
  boot(page, search, carrying);
  boot(page, `${search}&draft=1`, carrying);
}
for (const [page, button] of [
  ['liuyuan-court', 'toEntryReturn'], ['liuyuan-lvyin', 'toCourtReturn'],
  ['liuyuan-flower', 'toLvyinReturn'], ['liuyuan-east-hall', 'toFlowerReturn'],
  ['liuyuan-stone-forest', 'toEastHallReturn'], ['liuyuan-study-court', 'toStoneReturn'],
] as const) {
  const denied = boot(page, returnQueries[page], []);
  assert(denied[button]?.hidden, `${page} 单靠返程 URL 不得显示跨幕按钮`);
}
const deniedExit = boot('liuyuan-entry', returnQueries['liuyuan-entry'], []);
assert(deniedExit.chapterComplete?.hidden, '单靠入口返程 URL 不得显示完成卡');
const finished = boot('liuyuan-entry', returnQueries['liuyuan-entry'], LIUYUAN_CHAPTER_FLAGS);
assert(finished.chapterComplete && !finished.chapterComplete.hidden,
  '完成存档重进街面时，章末城图／园谱入口必须显示');
console.log('留园九幕：独立、章节、返程、无草稿回退及完成态页面启动与首帧通过。');
