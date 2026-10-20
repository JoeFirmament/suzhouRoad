import { loadProgress, markStoryFlag, resetProgress } from '../src/core/progression.js';
import { chapterSceneHref, lvyinSceneUrl } from '../src/core/liuyuan-view-memory.js';
import { modernRouteHref } from '../src/core/liuyuan-modern-route.js';
import { compositionRouteHref } from '../src/core/liuyuan-composition-route.js';

const records = new Map<string, string>();
const page = { search: '' };
Object.defineProperty(globalThis, 'location', { value: page, configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: (key: string) => records.get(key) ?? null,
  setItem: (key: string, value: string) => { records.set(key, value); },
}, configurable: true });
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

page.search = '?playtest=1';
markStoryFlag('ly-errand-offered');
assert(loadProgress().storyFlags.includes('ly-errand-offered'), '试玩旗标应在试玩页读回');
assert(records.has('gusu-nine-gardens-liuyuan-playtest-v1'), '试玩只能写入独立键');
assert(!records.has('gusu-nine-gardens-rpg-v1'), '试玩不可新建正式存档');
assert(chapterSceneHref('liuyuan-court.html') === 'liuyuan-court.html?chapter=1&playtest=1', '入小庭须携带试玩模式');
assert(lvyinSceneUrl(true) === 'liuyuan-lvyin.html?chapter=1&courtWindow=1&playtest=1', '临池须携带试玩模式');
assert(modernRouteHref('liuyuan-east-hall.html', 'flower') === 'liuyuan-east-hall.html?route=modern&from=flower&playtest=1', '现代章流须携带试玩模式');
assert(compositionRouteHref('liuyuan-composition-study.html', true, false) === 'liuyuan-composition-study.html?chapter=1&playtest=1', '构图小游戏须携带试玩模式');
resetProgress();
assert(loadProgress().storyFlags.length === 0, '重开试玩应清除试玩进度');

page.search = '';
assert(loadProgress().storyFlags.length === 0, '退出试玩不能从内存串入正式进度');
markStoryFlag('shen-met');
assert(records.has('gusu-nine-gardens-rpg-v1'), '正式模式仍应写自己的键');
page.search = '?playtest=1';
assert(!loadProgress().storyFlags.includes('shen-met'), '正式旗标不能串进试玩');
assert(!records.get('gusu-nine-gardens-liuyuan-playtest-v1')?.includes('shen-met'), '两个存档应完全隔离');
console.log('留园试玩存档隔离、重开、入口至章流与小游戏参数传递通过。');
