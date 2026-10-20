import { runHomeReturn } from './liuyuan-home-return-harness.js';
import { LEAF_TRACE_PATHS, leafTraceView } from '../src/core/liuyuan-leaf-trace.js';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { LIUYUAN_CHAPTER_FLAGS } from '../src/core/liuyuan-progression.js';
import { STANDARD_PLAYER_PROFILE } from '../src/core/geometry.js';
import type { CollisionShape } from '../src/core/geometry.js';
import { collides } from '../src/core/physics.js';
import { buildLiuyuanLvyinStudyMap } from '../src/data/liuyuan-lvyin-study.js';
import { buildLiuyuanCourtStudyMap } from '../src/data/liuyuan-court-study.js';
import { buildLiuyuanEntryStudyMap } from '../src/data/liuyuan-entry-study.js';
import { LIUYUAN_ALLEY_CHECKPOINTS, LIUYUAN_ALLEY_RETURN_CHECKPOINTS } from '../src/core/liuyuan-entry-flow.js';
import { buildLiuyuanStudyCourtMap } from '../src/data/liuyuan-study-court-research.js';
import { buildLiuyuanStoneForestStudyMap } from '../src/data/liuyuan-stone-forest-study.js';
import { buildLiuyuanEastHallStudyMap } from '../src/data/liuyuan-east-hall-study.js';
import { buildLiuyuanFlowerStudyMap } from '../src/data/liuyuan-flower-study.js';
import { buildLiuyuanStudyInteriorMap } from '../src/data/liuyuan-study-interior-research.js';
import { LIUYUAN_ENTRY_DRAFT_REGIONS, LIUYUAN_ENTRY_QIAO_WAIT } from '../src/data/liuyuan-entry-study.js';
import { entryResumeKey, parseEntryResume } from '../src/core/liuyuan-entry-resume.js';
import { createRainShadow, startRainShadow, updateRainShadow, rainWindow, RAIN_ROUND_COUNT } from '../src/core/liuyuan-rain-shadow.js';
import { rainTestInput } from './rain-shadow-test-input.js';

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

type Handler = (event: Record<string, unknown>) => void;
type FakeElement = {
  classList: { toggle(name: string, force?: boolean): void };
  checked: boolean; hidden: boolean; textContent: string; innerHTML: string; href: string;
  dataset: Record<string, string>; width: number; height: number; children: FakeElement[];
  addEventListener(type: string, handler: Handler): void;
  dispatch(type: string, event?: Record<string, unknown>): void;
  click(): void; focus(): void; setPointerCapture(): void;
  setAttribute(name: string, value: string): void; getAttribute(name: string): string | null;
  getBoundingClientRect(): { left: number; top: number; width: number; height: number };
  getContext(): object; querySelector(selector?: string): FakeElement; querySelectorAll(selector?: string): FakeElement[];
  replaceChildren(...children: FakeElement[]): void; append(...children: FakeElement[]): void;
};

let clipCalls = 0;
const bucketDraws: {x:number;y:number}[]=[];
const qiaoDraws: {x:number;y:number}[]=[];
const seatedDraws: {role:string;x:number;y:number}[]=[];
const context2d = new Proxy({}, { get: (target, property) => property === 'fillRect'
  ? (x:number,y:number,w:number,h:number) => { if ((target as any).fillStyle === '#3c3830') bucketDraws.push({x:x+w/2,y:y+h-1}); }
  : property === 'measureText'
  ? () => ({ width: 0 }) : property === 'clip'
    ? () => { clipCalls++; } : property === 'drawImage'
      ? (source:{src?:string},...args:number[])=>{
        if(source.src?.includes('qiao-he-sprites'))qiaoDraws.push({x:args[4]+args[6]/2,y:args[5]+args[7]});
        if(source.src?.includes('liuyuan-gate-npcs'))seatedDraws.push({role:args[0]===200?'elder':'gate',x:args[4]+args[6]/2,y:args[5]+args[7]});
      } : () => undefined });
function element(): FakeElement {
  const handlers = new Map<string, Handler[]>();
  const attributes = new Map<string, string>();
  const target: FakeElement = {
    classList: { toggle() {} },
    checked: false, hidden: false, textContent: '', innerHTML: '', href: '', dataset: {},
    width: 960, height: 640, children: [],
    addEventListener(type, handler) { handlers.set(type, [...handlers.get(type) ?? [], handler]); },
    dispatch(type, event = {}) { for (const handler of handlers.get(type) ?? []) handler(event); },
    click() { target.dispatch('click'); }, focus() {}, setPointerCapture() {},
    setAttribute(name, value) { attributes.set(name, value); },
    getAttribute(name) { return attributes.get(name) ?? null; },
    getBoundingClientRect: () => target.width===1280&&target.height===720
      ?{left:0,top:0,width:1280/3,height:720/3}:{ left: 0, top: 0, width: 320, height: 208 },
    getContext: () => context2d,
    querySelector: () => element(), querySelectorAll: () => [],
    replaceChildren(...children) { target.children = children; },
    append(...children) { target.children.push(...children); },
  };
  return target;
}

const pages = [
  ['liuyuan-entry', ''], ['liuyuan-court', '?chapter=1'], ['liuyuan-lvyin', '?chapter=1'],
  ['liuyuan-flower', '?chapter=1'], ['liuyuan-east-hall', '?route=modern&from=flower'],
  ['liuyuan-stone-forest', '?route=modern&from=east-hall'],
  ['liuyuan-study-court', '?route=modern&from=stone-forest'],
  ['liuyuan-study-interior', '?route=modern&from=study-court'],
] as const;
const returnPages = [
  ['liuyuan-entry', '?route=modern&from=court&return=1'],
  ['liuyuan-court', '?route=modern&from=lvyin&return=1'],
  ['liuyuan-lvyin', '?route=modern&from=flower&return=1'],
  ['liuyuan-flower', '?route=modern&from=east-hall&return=1'],
  ['liuyuan-east-hall', '?route=modern&from=stone-forest&return=1'],
  ['liuyuan-stone-forest', '?route=modern&from=study-court&return=1'],
  ['liuyuan-study-court', '?route=modern&from=leaf&return=1'],
] as const;
type Direction = 'up' | 'left' | 'down' | 'right';

function boot(page: string, search: string, flagCount = search.includes('return=1') ? 14 : 13,
  initialProgressJson?: string, draftRecord?: string, readyImages = false,
  sessionRecords: Record<string, string> = {}) {
  const html = readFileSync(`${page}.html`, 'utf8');
  if (['liuyuan-flower', 'liuyuan-east-hall', 'liuyuan-stone-forest',
    'liuyuan-study-court', 'liuyuan-study-interior'].includes(page)) {
    const stageStart = html.indexOf('<div class="stage">');
    const hudStart = html.indexOf('<div class="hud">', stageStart);
    assert(stageStart >= 0 && hudStart > stageStart, `${page} 缺少可见场景容器`);
    const stage = html.slice(stageStart, hudStart);
    const inStage = page === 'liuyuan-flower'
      ? ['dialogueActions', 'leafCarryActions', 'borrowAlbum', 'continueChapter', 'toLvyinReturn']
      : page === 'liuyuan-east-hall' ? ['continueChapter', 'toFlowerReturn']
      : page === 'liuyuan-stone-forest' ? ['toStudyCourt', 'toEastHallReturn']
      : page === 'liuyuan-study-court' ? ['doorActions', 'interiorResearch', 'toStoneReturn']
      : ['answerChoices', 'paperChoices', 'leafResearchLink'];
    for (const id of inStage) assert(stage.includes(`id="${id}"`), `${page} 的 ${id} 必须留在场景内`);
  }
  const script = html.match(/<script src="(dist\/[^\"]+\.js)(?:\?[^\"]+)?"/);
  assert(script, `${page} 未引用正式脚本`);
  const ids = new Set<string>();
  const initiallyHidden = new Set<string>();
  for (const tag of html.matchAll(/<[^>]+>/g)) {
    const id = tag[0].match(/\bid="([^"]+)"/)?.[1];
    if (!id) continue;
    ids.add(id);
    if (/(?:\s)hidden(?:\s|>)/.test(tag[0])) initiallyHidden.add(id);
  }
  const nodes: Record<string, FakeElement> = {};
  const directions = new Map<Direction, FakeElement>();
  const leafActions = new Map<string, FakeElement>();
  const leafStrokes = new Map<string, FakeElement>();
  const rainDirections = new Map<string, FakeElement>();
  for (const match of html.matchAll(/<button\b[^>]*\bdata-dir="(up|left|down|right)"[^>]*>/g)) {
    const direction = match[1] as Direction;
    const button = element(); button.dataset.dir = direction; directions.set(direction, button);
  }
  for (const match of html.matchAll(/<button\b[^>]*\bdata-leaf-action="([^"]+)"[^>]*>/g)) {
    const button = element(); button.dataset.leafAction = match[1]; leafActions.set(match[1], button);
  }
  for (const match of html.matchAll(/<button\b[^>]*\bdata-stroke="([^"]+)"[^>]*>/g)) {
    const button = element(); button.dataset.stroke = match[1]; leafStrokes.set(match[1], button);
  }
  for (const match of html.matchAll(/<button\b[^>]*\bdata-rain-dir="([^"]+)"[^>]*>/g)) {
    const button = element(); button.dataset.rainDir = match[1]; rainDirections.set(match[1], button);
  }
  if (page !== 'liuyuan-leaf-writing-study' && page !== 'journal')
    assert(directions.size === 4, `${page} 缺少四个触屏方向键`);
  const windowEvents = new Map<string, Handler[]>();
  const frames: Array<(now: number) => void> = [];
  const document = {
    getElementById: (id: string) => {
      if (!ids.has(id)) return null;
      if (!nodes[id]) {
        nodes[id] = element(); nodes[id].hidden = initiallyHidden.has(id);
        const choiceGroups: Record<string, [string, string[]]> = {
          doorActions: ['choice', ['listen', 'knock']],
          answerChoices: ['answer', ['search', 'wrong']],
          paperChoices: ['paperAnswer', ['paper-ask', 'paper-wait']],
        };
        if (choiceGroups[id]) {
          const [name, values] = choiceGroups[id];
          const buttons = values.map((value) => {
            const button = element(); button.dataset[name] = value; return button;
          });
          const attr = name === 'paperAnswer' ? 'data-paper-answer' : `data-${name}`;
          nodes[id].querySelectorAll = (selector) => selector === `[${attr}]` ? buttons : [];
        }
        if (id === 'leafResearchLink') {
          const anchor = element(); nodes[id].children = [anchor];
          nodes[id].querySelector = () => anchor;
        }
      }
      return nodes[id];
    },
    createElement: () => element(),
    querySelectorAll: (selector: string) => selector === '[data-dir]' ? [...directions.values()]
      : selector === '[data-rain-dir]' ? [...rainDirections.values()]
      : selector === '[data-leaf-action]' ? [...leafActions.values()]
      : selector === '[data-stroke]' ? [...leafStrokes.values()] : [],
  };
  const progress = {
    version: 1, arts: { li: 0, yue: 0, she: 0, yu: 1, shu: 1, shuMath: 0 },
    gardens: { canglang: 'open', wangshi: 'locked', zhuozheng: 'locked', shizilin: 'locked',
      liuyuan: 'entered', ouyuan: 'locked', yipu: 'locked', huanxiu: 'locked', tuisi: 'locked' },
    completedTasks: [], knowledge: [], storyFlags: LIUYUAN_CHAPTER_FLAGS.slice(0, flagCount), updatedAt: 1,
  };
  class FakeImage { complete = readyImages; naturalWidth = readyImages ? 1008 : 0;
    naturalHeight = readyImages ? 688 : 0; src = ''; addEventListener() {} }
  let progressJson = initialProgressJson ?? JSON.stringify(progress);
  const progressKey = search.includes('playtest=1')
    ? 'gusu-nine-gardens-liuyuan-playtest-v1' : 'gusu-nine-gardens-rpg-v1';
  let assignedUrl = '';
  runInNewContext(readFileSync(script[1], 'utf8'), {
    document,
    window: { name: '', addEventListener(type: string, handler: Handler) {
      windowEvents.set(type, [...windowEvents.get(type) ?? [], handler]);
    } },
    location: { search, assign(url: string) { assignedUrl = url; }, href: '' },
    localStorage: { getItem: (key: string) => key === progressKey ? progressJson
      : key === 'gusu:geometry-editor:liuyuan-entrance-topology-study:latest' ? draftRecord ?? null : null,
      setItem(key: string, value: string) { if (key === progressKey) progressJson = value; } },
    sessionStorage: { getItem: (key: string) => sessionRecords[key] ?? null,
      setItem(key: string, value: string) { sessionRecords[key] = value; },
      removeItem(key: string) { delete sessionRecords[key]; } },
    Image: FakeImage, URLSearchParams, structuredClone,
    requestAnimationFrame: (callback: (now: number) => void) => { frames.push(callback); return frames.length; },
  }, { filename: `${page}${search}` });
  if (search.includes('return=1')) {
    const returnCopy = page === 'liuyuan-entry' ? nodes.modeTitle?.textContent : nodes.routeNotice?.textContent;
    assert(returnCopy && /(出园|回|返程)/.test(returnCopy), `${page} 未进入正式返程模式`);
  }
  const geometryToggle = nodes.showTiles ?? nodes.showGeometry;
  if (page !== 'liuyuan-leaf-writing-study' && page !== 'journal')
    assert(geometryToggle && nodes.coords, `${page} 缺少调试脚点`);
  let now = 0;
  function frame(): void {
    now += 16;
    qiaoDraws.length=0; seatedDraws.length=0; bucketDraws.length=0;
    const callback = frames.shift(); assert(callback, `${page} 动画帧中断`); callback(now);
  }
  function foot(): [number, number] {
    assert(geometryToggle, `${page} 没有地面脚点`);
    geometryToggle.checked = true; frame(); geometryToggle.checked = false;
    const match = nodes.coords.textContent.match(/(?:脚点|鞋底) \((\d+), (\d+)\)/);
    assert(match, `${page} 未输出脚点坐标`);
    return [Number(match[1]), Number(match[2])];
  }
  function key(type: 'keydown' | 'keyup', direction: Direction): void {
    const name = { up: 'ArrowUp', left: 'ArrowLeft', down: 'ArrowDown', right: 'ArrowRight' }[direction];
    for (const handler of windowEvents.get(type) ?? []) handler({ key: name, repeat: false, preventDefault() {} });
  }
  function rawKey(name: string, type = 'keydown'): void {
    for (const handler of windowEvents.get(type) ?? []) handler({ key: name, repeat: false, preventDefault() {} });
  }
  function pointer(type: 'pointerdown' | 'pointerup', direction: Direction): void {
    directions.get(direction)!.dispatch(type, { pointerId: 1, preventDefault() {} });
  }
  function blur(): void { for (const handler of windowEvents.get('blur') ?? []) handler({}); }
  function pagehide(): void { for (const handler of windowEvents.get('pagehide') ?? []) handler({}); }
  return { frame, foot, qiaoDraws:()=>qiaoDraws.slice(), seatedDraws:()=>seatedDraws.slice(), bucketDraws:()=>bucketDraws.slice(), key, rawKey, pointer, blur, pagehide, sessionRecords, nodes, leafActions, leafStrokes, rainDirections,
    assignedUrl: () => assignedUrl,
    savedProgress: () => progressJson,
    storyFlags: () => (JSON.parse(progressJson) as { storyFlags: string[] }).storyFlags };
}

const moves: string[] = [];
for (const [page, search] of [...pages, ...returnPages]) {
  let usableDirections = 0;
  for (const direction of ['up', 'left', 'down', 'right'] as const) {
    const keyboard = boot(page, search);
    const touch = boot(page, search);
    const startKey = keyboard.foot();
    const startTouch = touch.foot();
    assert(startKey.join() === startTouch.join(), `${page} 两种输入出生点不同`);
    keyboard.key('keydown', direction);
    touch.pointer('pointerdown', direction);
    for (let i = 0; i < 8; i++) { keyboard.frame(); touch.frame(); }
    const endKey = keyboard.foot();
    const endTouch = touch.foot();
    assert(endKey.join() === endTouch.join(), `${page} ${direction} 键盘/触屏脚点不一致`);
    if (endKey.join() !== startKey.join()) usableDirections++;
    keyboard.key('keyup', direction);
    touch.pointer('pointerup', direction);
    for (let i = 0; i < 3; i++) { keyboard.frame(); touch.frame(); }
    assert(keyboard.foot().join() === endKey.join(), `${page} ${direction} 松键后仍在行走`);
    assert(touch.foot().join() === endTouch.join(), `${page} ${direction} 松开触屏键后仍在行走`);
    keyboard.key('keydown', direction);
    touch.pointer('pointerdown', direction);
    keyboard.blur(); touch.blur();
    keyboard.frame(); touch.frame();
    assert(keyboard.foot().join() === endKey.join(), `${page} 失焦后键盘仍在行走`);
    assert(touch.foot().join() === endTouch.join(), `${page} 失焦后触屏仍在行走`);
  }
  assert(usableDirections > 0, `${page} 出生点四方向均无法移动`);
  moves.push(`${page}${search.includes('return=1') ? '返' : '进'}: ${usableDirections}/4`);
}
console.log(`留园八幕正向与七幕返程：键盘/触屏连续移动、松开与失焦模拟通过；出生点可走方向 ${moves.join('，')}。`);

// New oblique entry camera is a quarantined first-shot calibration, not an
// extra chapter scene. Exercise its real page script without touching CH3 flags.
for (const input of ['keyboard', 'touch'] as const) {
  const oblique = boot('liuyuan-entry-oblique-study', '?draft=1');
  const start = oblique.foot();
  assert(start.join() === '770,915', '斜俯视首镜头出生脚点应在门外石路');
  if (input === 'keyboard') oblique.key('keydown', 'up');
  else oblique.pointer('pointerdown', 'up');
  for (let i = 0; i < 12; i++) oblique.frame();
  const after = oblique.foot();
  assert(after[1] < start[1] && after[0] === start[0], `斜俯视首镜头${input}移动应沿门外石路向门槛`);
  if (input === 'keyboard') oblique.key('keyup', 'up');
  else oblique.pointer('pointerup', 'up');
  for (let i = 0; i < 3; i++) oblique.frame();
  assert(oblique.foot().join() === after.join(), `斜俯视首镜头${input}松开后应停步`);
  oblique.nodes.look.click();
  assert(oblique.nodes.status.textContent.includes('石地'), '首镜头观察应给场面反馈，不写章节状态');
}
console.log('留园斜俯视入口首镜头: 独立页面键盘/触屏移动、停步和观察模拟通过；不计 CH3 整章。');

for (const input of ['keyboard', 'touch'] as const) {
  const lvyinPixel = boot('liuyuan-lvyin', '?artStudy=pixel-v2&draft=1', 0, undefined, true);
  assert(lvyinPixel.nodes.sceneBadge.textContent.includes('不写 CH3'),
    '像素临池研究页必须明确隔离章流');
  assert(lvyinPixel.nodes.returnCourt.hidden,
    '像素临池研究页不应误导跳回正式小庭');
  assert(lvyinPixel.nodes.editorLink.href.includes('liuyuan-lvyin-pond-pixel-study-v2'),
    '像素临池研究页须链接独立编辑器 ID');
  const start = lvyinPixel.foot();
  if (input === 'keyboard') lvyinPixel.key('keydown', 'left');
  else lvyinPixel.pointer('pointerdown', 'left');
  for (let i = 0; i < 12; i++) lvyinPixel.frame();
  const after = lvyinPixel.foot();
  assert(after[0] < start[0], `像素临池${input}沿岸应可向西行走`);
  if (input === 'keyboard') lvyinPixel.key('keyup', 'left');
  else lvyinPixel.pointer('pointerup', 'left');
  for (let i = 0; i < 3; i++) lvyinPixel.frame();
  assert(lvyinPixel.foot().join() === after.join(), `像素临池${input}松开应停步`);
  assert(lvyinPixel.storyFlags().length === 0 && !lvyinPixel.assignedUrl(),
    '像素临池研究页不可写旗标或跳转正式章流');
}
console.log('绿荫轩像素校位: 独立草稿、键盘/触屏移动与章流隔离模拟通过；图面仍待人工对位。');

function walkWaypoints(
  harness: ReturnType<typeof boot>, input: 'keyboard' | 'touch',
  waypoints: readonly (readonly [string, number, number, number?])[],
  scene: { map: Uint8Array; w: number; h: number; obstacles: readonly CollisionShape[] },
): void {
  const held = new Set<Direction>();
  const setHeld = (direction: Direction, active: boolean) => {
    if (active === held.has(direction)) return;
    if (active) held.add(direction); else held.delete(direction);
    if (input === 'keyboard') harness.key(active ? 'keydown' : 'keyup', direction);
    else harness.pointer(active ? 'pointerdown' : 'pointerup', direction);
  };
  for (const [label, x, y, radius = 30] of waypoints) {
    let last = harness.foot();
    let stagnant = 0;
    for (let i = 0; i < 150; i++) {
      const dx = x - last[0], dy = y - last[1];
      if (Math.hypot(dx, dy) < radius) break;
      const threshold = Math.min(8, radius / 2);
      setHeld('left', dx < -threshold); setHeld('right', dx > threshold);
      setHeld('up', dy < -threshold); setHeld('down', dy > threshold);
      for (let frame = 0; frame < 6; frame++) harness.frame();
      const next = harness.foot();
      // The page displays rounded integer feet; collision runs on the unrounded actor point.
      const couldBeValidFoot = [-0.5, 0, 0.5].some((ox) => [-0.5, 0, 0.5].some((oy) =>
        !collides(scene.map, next[0] + ox, next[1] + oy, scene.w, scene.h,
          scene.obstacles, STANDARD_PLAYER_PROFILE)));
      assert(couldBeValidFoot, `${label} 脚点进入水面、实体或非铺地区：${next.join()}`);
      stagnant = next.join() === last.join() ? stagnant + 1 : 0;
      assert(stagnant < 12, `${label} 行走在 (${next.join()}) 卡住`);
      last = next;
    }
    for (const direction of [...held]) setHeld(direction, false);
    assert(Math.hypot(last[0] - x, last[1] - y) < radius,
      `${label} 未走到目标脚点：停在 (${last.join()})，目标 (${x},${y})`);
  }
}

// The optional rescue is discovered in the flower yard after delivery.
for (const input of ['keyboard', 'touch'] as const) {
  const entry = boot('liuyuan-flower', '?chapter=1&playtest=1', 6);
  walkWaypoints(entry, input, [['兰盆旁发现画稿', 650, 485, 26]], buildLiuyuanFlowerStudyMap());
  assert(!entry.nodes.helpDrawing.hidden, '交粥后靠近兰盆应能发现可选抢画');
  const lanternSave = entry.savedProgress();
  assert(entry.nodes.interactionCue.textContent.includes('兰稿'), '兰稿提示应与最近交互目标一致');
  if (input === 'keyboard') entry.rawKey('e');
  else entry.nodes.helpDrawing.click();
  assert(!entry.nodes.lanternPuzzle.hidden, '抢画打开现场事件');
  const still = entry.foot();
  entry.rawKey('ArrowUp'); entry.frame();
  entry.key('keyup', 'up');
  assert(entry.foot().join() === still.join(), '小游戏方向键不应推动真实角色穿门');
  if (input === 'keyboard') entry.rawKey('Enter'); else entry.nodes.rainAction.click();
  entry.blur(); for (let i = 0; i < 700; i++) entry.frame();
  assert(entry.nodes.rainAction.textContent === '继续抢画', '切页应暂停，不可后台受损');
  const pausedRainHUD = entry.nodes.rainHud.textContent;
  entry.nodes.rainQuiet.checked = true; entry.nodes.rainQuiet.dispatch('change');
  assert(entry.nodes.rainHud.textContent === pausedRainHUD && entry.nodes.rainAction.textContent === '继续抢画',
    '切换少动效只能重绘，不能恢复计时或改变暂停状态');
  entry.nodes.rainSound.checked=true;entry.nodes.rainSound.dispatch('change');
  entry.nodes.rainSound.checked=false;entry.nodes.rainSound.dispatch('change');
  assert(entry.nodes.rainHud.textContent===pausedRainHUD && entry.nodes.rainAction.textContent==='继续抢画',
    '开关音效不能恢复暂停、重置HP/回气或输入');
  entry.nodes.rainAction.click();
  for (let i = 0; i < 600; i++) entry.frame();
  assert(entry.nodes.rainAction.textContent === '再试一回'
    && !entry.storyFlags().includes('ly-rain-shadow-cleared') && entry.savedProgress() === lanternSave,
    '原地等待失败、失败不改章进度');
  entry.nodes.rainAction.click();
  assert(entry.nodes.rainAction.textContent === '正在护画', '失败后可即时重新开始');
  // The separate reference model supplies scripted input decisions only; all UI
  // state still comes from public keys/buttons, with no injection or mutation.
  const model = createRainShadow(false, true); startRainShadow(model);
  const visibleRainStages = new Set<string>();
  for (let frame = 0; frame < 3500 && model.phase === 'running'; frame++) {
      const command = rainTestInput(model);
      const dx = Math.abs(command.target.x - model.x) > 1.4 ? Math.sign(command.target.x - model.x) : 0;
      const dy = Math.abs(command.target.y - model.y) > 1.4 ? Math.sign(command.target.y - model.y) : 0;
      for (const [dir, active] of [['left', dx < 0], ['right', dx > 0], ['up', dy < 0], ['down', dy > 0]] as const) {
        if (input === 'keyboard') {
          entry.key(active ? 'keydown' : 'keyup', dir);
          if (active) {
            const alias = { left: 'a', right: 'd', up: 'w', down: 's' }[dir];
            entry.rawKey(alias); entry.rawKey(alias, 'keyup');
          }
        }
        else {
          const button = entry.rainDirections.get(dir)!;
          button.dispatch(active ? 'pointerdown' : 'pointerup', { pointerId: 1, preventDefault() {} });
          if (active) {
            button.dispatch('pointerdown', { pointerId: 9, preventDefault() {} });
            for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
              button.dispatch(type, { pointerId: 9 });
          }
        }
      }
      entry.nodes.rainGuard.dispatch(command.guard ? 'pointerdown' : 'pointerup', { pointerId: 2, preventDefault() {} });
      entry.frame();
      const visibleStage = entry.nodes.rainHud.textContent.match(/[123]\/3 (辨雨|换向|交雨)/);
      if (visibleStage) visibleRainStages.add(visibleStage[1]);
      updateRainShadow(model, .016, { x: dx, y: dy, guard: command.guard });
      if (frame === 100) { entry.nodes.rainQuiet.checked = false; entry.nodes.rainQuiet.dispatch('change'); }
      if (frame === 120) {
        const hud=entry.nodes.rainHud.textContent;
        entry.nodes.rainSound.checked=false;entry.nodes.rainSound.dispatch('change');
        assert(entry.nodes.rainHud.textContent===hud,'关音效不能额外推进或重置模拟');
      }
  }
  assert(model.phase === 'won' && entry.nodes.rainHud.textContent.includes(`拾回 1/1`),
    `每折须真实移动到窗影：${entry.nodes.rainHud.textContent} / ${entry.nodes.lanternFeedback.textContent}`);
  assert(visibleRainStages.size === 3, '键盘/方向按钮实跑时，HUD 必须明确显示三段难度，不能只改隐藏参数');
  assert(entry.nodes.rainAction.textContent === '收好画稿', '六折走完须有胜利确认');
  entry.nodes.rainAction.click();
  assert(entry.nodes.lanternPuzzle.hidden && entry.storyFlags().includes('ly-rain-shadow-cleared')
    && entry.storyFlags().includes('ly-florist-met'), '成功带回画稿与人物线索');
  assert(JSON.parse(entry.savedProgress()).knowledge.includes('liuyuan-album-orchid-leaf'), '成功收录兰稿册页');
  entry.frame();
  assert(!entry.nodes.viewCollected.hidden && entry.nodes.viewCollected.href.includes('playtest=1'),
    '册页入口应可见且传递隔离试玩来源');
  const rainReward = JSON.parse(entry.savedProgress());
  assert(rainReward.arts.yu === JSON.parse(lanternSave).arts.yu + 1
    && rainReward.completedTasks.includes('liuyuan-rain-shadow'), '护画首次成功必须结算御 +1');
  const skipped = boot('liuyuan-flower', '?chapter=1&playtest=1', 0, lanternSave);
  walkWaypoints(skipped, input, [['可选事件', 650, 485, 26]], buildLiuyuanFlowerStudyMap());
  skipped.nodes.helpDrawing.click(); skipped.nodes.rainAction.click();
  for (let i = 0; i < 600; i++) skipped.frame();
  assert(skipped.nodes.rainAction.textContent === '再试一回', '失手可重试');
  skipped.nodes.lanternLeave.click();
  assert(skipped.storyFlags().includes('ly-florist-met') && !skipped.storyFlags().includes('ly-rain-shadow-cleared')
    && JSON.parse(skipped.savedProgress()).arts.yu === JSON.parse(lanternSave).arts.yu,
    '失手继续有线索但不发成功奖励');
  assert(JSON.parse(skipped.savedProgress()).knowledge.includes('liuyuan-drawing-left')
    && !JSON.parse(skipped.savedProgress()).knowledge.includes('liuyuan-drawing-smudged'),
    '没捡到画就超时不应伪称纸被雨浸湿');
  const declined = boot('liuyuan-flower', '?chapter=1&playtest=1', 0, lanternSave);
  walkWaypoints(declined, input, [['旁观可选事件', 650, 485, 26]], buildLiuyuanFlowerStudyMap());
  declined.nodes.helpDrawing.click(); declined.nodes.lanternLeave.click();
  assert(declined.savedProgress() === lanternSave, '准备界面退出不发奖、不伪造人物线索');
}
console.log('花房抢画：键盘/方向按钮单次事件、失败返回、六艺/册页/线索和世界冻结通过。');

const wetDrawing = boot('liuyuan-flower', '?chapter=1&playtest=1', 6);
walkWaypoints(wetDrawing, 'touch', [['抢画前', 650, 485, 26]], buildLiuyuanFlowerStudyMap());
wetDrawing.nodes.helpDrawing.click(); wetDrawing.nodes.rainAction.click();
wetDrawing.nodes.rainArena.dispatch('pointerdown', { pointerId: 4, clientX: 0, clientY: 0, preventDefault() {} });
wetDrawing.nodes.rainArena.dispatch('pointermove', { pointerId: 4, clientX: -82, clientY: -29 });
for (let i = 0; i < 70; i++) wetDrawing.frame();
wetDrawing.nodes.rainArena.dispatch('pointermove', { pointerId: 4, clientX: 0, clientY: 0 });
for (let i = 0; i < 700; i++) wetDrawing.frame();
assert(wetDrawing.nodes.rainAction.textContent === '再试一回', '捡到后不避雨会失手');
assert(wetDrawing.nodes.rainHud.textContent.includes('HP 0/3'), '失手须明确显示0/3 HP');
wetDrawing.nodes.lanternLeave.click();
assert(JSON.parse(wetDrawing.savedProgress()).knowledge.includes('liuyuan-drawing-smudged')
  && !JSON.parse(wetDrawing.savedProgress()).knowledge.includes('liuyuan-album-orchid-leaf')
  && wetDrawing.nodes.sceneMessage.textContent.includes('抢过湿纸'), '浸湿分支有后续线索，不得赠册页或成功奖励');

const catDrawing=boot('liuyuan-flower','?chapter=1&playtest=1',6);
walkWaypoints(catDrawing,'touch',[['抢画前',650,485,26]],buildLiuyuanFlowerStudyMap());
catDrawing.nodes.helpDrawing.click();catDrawing.nodes.rainAction.click();
catDrawing.nodes.rainArena.dispatch('pointerdown',{pointerId:4,clientX:0,clientY:0,preventDefault(){}});
catDrawing.nodes.rainArena.dispatch('pointermove',{pointerId:4,clientX:-82,clientY:-29});
const catModel=createRainShadow(false,true);startRainShadow(catModel);
for(let frame=0;frame<400 && !catModel.catHits;frame++) {
  updateRainShadow(catModel,.016,{x:0,y:0,target:rainWindow(catModel)});catDrawing.frame();
}
assert(catModel.catHits===1&&catModel.hits===1,'猫碰纸角测试须发生在受雨之前');
assert(catDrawing.nodes.rainHud.textContent.includes('HP 2/3')
  && catDrawing.nodes.lanternFeedback.textContent.includes('HP −1'), '猫扑真实UI扣1HP并报受击');
catDrawing.nodes.lanternLeave.click();
const catProgress=JSON.parse(catDrawing.savedProgress());
assert(catDrawing.nodes.sceneMessage.textContent.includes('猫蹭皱')
  && catProgress.knowledge.includes('liuyuan-drawing-left')
  && !catProgress.knowledge.includes('liuyuan-drawing-smudged')
  && !catProgress.knowledge.includes('liuyuan-album-orchid-leaf'),
  '只有猫蹭皱的纸不能冒称湿稿，也不能领奖或丢失寻人衔接');

const directRain = boot('liuyuan-flower', '?playtest=1&minigame=rain-shadow', 0);
assert(!directRain.nodes.lanternPuzzle.hidden, '直达试玩链接应自动打开无存档练习');
assert(directRain.nodes.rainHud.textContent.includes('HP 3/3'), '准备页须显示3HP');
directRain.nodes.rainGentle.checked=true;directRain.nodes.rainGentle.dispatch('change',{});
assert(directRain.nodes.rainHud.textContent.includes('HP 3/3'), '缓雨不能把3HP加到5');
directRain.nodes.rainGentle.checked=false;directRain.nodes.rainGentle.dispatch('change',{});
assert(directRain.nodes.lanternFeedback.textContent.includes('亮处不挡雨'), '准备提示须明确窗光不是避雨点');
directRain.frame(); // Prime RAF before the timed scripted run.
directRain.nodes.rainAction.click();
// Mouse/touch drag drives the real UI adapter and speed-limited simulation.
// Read only the visible round text, with known diagram coordinates as goals.
const practiceSave = directRain.savedProgress();
const dragModel = createRainShadow(false, true); startRainShadow(dragModel);
directRain.nodes.rainArena.dispatch('pointerdown', { pointerId: 4, clientX: 0, clientY: 0, preventDefault() {} });
for (let frame = 0; frame < 3500 && dragModel.phase === 'running'; frame++) {
  const command = rainTestInput(dragModel);
  // A second finger must neither take over the drag nor release the first finger.
  if (frame % 60 === 10) {
    directRain.nodes.rainArena.dispatch('pointerdown', { pointerId: 9, clientX: 300, clientY: 200, preventDefault() {} });
    directRain.nodes.rainArena.dispatch('pointermove', { pointerId: 9, clientX: 0, clientY: 0 });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
      directRain.nodes.rainArena.dispatch(type, { pointerId: 9 });
  }
  directRain.nodes.rainArena.dispatch('pointermove', { pointerId: 4, clientX: command.target.x - 160, clientY: command.target.y - 157 });
  directRain.nodes.rainGuard.dispatch(command.guard ? 'pointerdown' : 'pointerup', { pointerId: 2, preventDefault() {} });
  directRain.frame(); updateRainShadow(dragModel, .016, command);
}
directRain.nodes.rainArena.dispatch('pointerup', { pointerId: 4 });
assert(dragModel.phase === 'won' && directRain.nodes.rainAction.textContent === '收好画稿', `画面拖动可走通六折：${directRain.nodes.rainHud.textContent} / ${directRain.nodes.lanternFeedback.textContent}`);
assert(directRain.savedProgress() === practiceSave, '练习胜利等待确认期间不能写进度');
directRain.nodes.rainAction.click();
assert(directRain.nodes.lanternPuzzle.hidden && directRain.savedProgress() === practiceSave,
  '直达练习成功确认也不能放行、添旗标或发六艺');

assert(directRain.storyFlags().length === 0, '直达练习退出不可放行或发奖励');

// Optional court checkpoints must never revive unsafe feet or cross mode boundaries.
{
  const search = '?chapter=1&playtest=1';
  const initial = boot('liuyuan-court', search);
  const spawn = initial.foot().join();
  walkWaypoints(initial, 'keyboard', [['小庭中段', 1170, 680]], buildLiuyuanCourtStudyMap());
  initial.pagehide();
  const savedFoot = initial.foot().join();
  assert(savedFoot !== spawn, '续接反例必须使用已移动脚点');
  const slot = Object.keys(initial.sessionRecords).find((key) => key.startsWith('gusu:liuyuan-court:'))!;
  assert(slot, '小庭须生成独立会话槽');
  const raw = initial.sessionRecords[slot];
  const reload = (records: Record<string, string>, query = search) => boot('liuyuan-court', query,
    13, initial.savedProgress(), undefined, false, records);
  assert(reload({ [slot]: raw }).foot().join() === savedFoot, '合法小庭脚点可恢复');
  for (const patch of [{ x: -1 }, { x: 0, y: 0 }, { dir: 4 }, { observed: 'yes' },
    { geometryStamp: 'changed' }, { progressStamp: 'changed' }, { version: 999 }]) {
    const value = JSON.stringify({ ...JSON.parse(raw), ...patch });
    assert(reload({ [slot]: value }).foot().join() === spawn, `拒绝小庭非法续接 ${JSON.stringify(patch)}`);
  }
  assert(reload({ [slot]: '{broken' }).foot().join() === spawn, '小庭破损会话应回退出生点');
  for (const query of ['?chapter=1', '?chapter=1&playtest=1&draft=1', '?playtest=1'])
    assert(reload({ [slot]: raw }, query).foot().join() === spawn, `小庭会话隔离 ${query}`);
  const resetCourt = reload({ [slot]: raw });
  resetCourt.nodes.reset.click(); resetCourt.pagehide();
  assert(reload(resetCourt.sessionRecords).foot().join() === spawn, '重置小庭后刷新不得回旧脚点');
}

for (const input of ['keyboard', 'touch'] as const) {
  const freeEntry = boot('liuyuan-entry', '?playtest=1', 1);
  walkWaypoints(freeEntry, input, [['直接提桶进门', 520, 575, 10]],
    { ...buildLiuyuanEntryStudyMap(), obstacles: [] });
  assert(freeEntry.storyFlags().includes('ly-gate-passed')
    && !freeEntry.storyFlags().includes('ly-huabu-seen') && !freeEntry.storyFlags().includes('ly-gate-clue')
    && freeEntry.nodes.dialogue.hidden, '接桶后可以不听指路、不答门房，直接进入夹弄');
  walkWaypoints(freeEntry,input,[['已入园后回街面',566,676,10]],
    {...buildLiuyuanEntryStudyMap(),obstacles:[]});
  assert(!freeEntry.nodes.interactionCue.textContent.includes('指路'), '已指路阶段结束不能再提示指路');
  freeEntry.nodes.interact.click();
  assert(freeEntry.nodes.line.textContent.includes('看着担子') && !freeEntry.storyFlags().includes('ly-huabu-seen'),
    '看担子的乔禾只能回应当前处境，不重开指路手续');
  freeEntry.nodes.interact.click();
  walkWaypoints(freeEntry,input,[['沿夹弄',520,400,12],['转角内侧',470,372,10],['绕过旧西折点',430,350,10]],
    {...buildLiuyuanEntryStudyMap(),obstacles:[]});
  assert(freeEntry.nodes.interactionCue.textContent.includes('向上'),
    '绕过西折样本后提示应从当前第二小庭向前，不要求倒回去踩点');
  freeEntry.pagehide();
  const detour=Object.values(freeEntry.sessionRecords).map(raw=>JSON.parse(raw)).find(value=>value.state?.alleyCheckpoint!==undefined);
  assert(detour?.state.alleyCheckpoint===3, '反例路线必须真的漏采西折点，不能只是另一条已踩完路线');
  walkWaypoints(freeEntry,input,[['北向窄廊',430,300,10],['歇桶处',430,250,22]],
    {...buildLiuyuanEntryStudyMap(),obstacles:[]});
  assert(!freeEntry.nodes.dialogue.hidden,'漏采西折路点但抵达歇桶处仍须出现可做的行动');
  if(input==='keyboard')freeEntry.rawKey('1');else freeEntry.nodes.choices.children[0].click();
  assert(freeEntry.storyFlags().includes('ly-alley-walked'), '抵达并放桶才完成本段，不能受漏路点阻断');
  const reverse=boot('liuyuan-entry','?route=modern&from=court&return=1&playtest=1',14);
  assert(reverse.nodes.playtestAdvice.textContent.includes('空桶在手')
    && reverse.nodes.playtestAdvice.textContent.includes('还给乔禾'),
  '返程试玩提示不得残留“接过粥桶”的入园初始文案');
  walkWaypoints(reverse,input,[['小庭口',340,232,10],['窗前',420,232,10],['歇桶处',430,250,10],
    ['窄廊',430,300,10],['小庭',430,350,10],['绕过西折',470,372,10],['狭廊',520,400,10],
    ['天井',520,480,10],['前厅',520,550,10],['门槛前',520,614,12]],
    {...buildLiuyuanEntryStudyMap(),obstacles:[]});
  assert(!reverse.storyFlags().includes('ly-unlocked'),'漏路点返程不能越过门房提前结算');
  if(reverse.nodes.dialogue.hidden)reverse.nodes.interact.click();
  reverse.nodes.interact.click();
  if(input==='keyboard')reverse.rawKey('1');else reverse.nodes.choices.children[0].click();
  reverse.nodes.interact.click();reverse.nodes.interact.click();
  walkWaypoints(reverse,input,[['街面归还空桶',520,656,10]],
    {...buildLiuyuanEntryStudyMap(),obstacles:[]});
  assert(!reverse.storyFlags().includes('ly-unlocked') && reverse.nodes.chapterComplete.hidden, '到街面但未交桶不能自动结束');
  if (input === 'keyboard') reverse.rawKey('e'); else reverse.nodes.interact.click();
  assert(reverse.storyFlags().includes('ly-unlocked'),'漏采返程路点也可在应答后走到街面完成');
}
// NPC movement is checked from actual sprite draw coordinates, not private actor state.
{
  const entry=boot('liuyuan-entry','?playtest=1',1,undefined,undefined,true);
  entry.frame();
  assert(entry.qiaoDraws().length===1 && Math.abs(entry.qiaoDraws()[0].x-LIUYUAN_ENTRY_QIAO_WAIT.x)<=1,
    '接桶后的初始乔禾在门外指路位置');
  walkWaypoints(entry,'keyboard',[['直接入门',520,590,10]],{...buildLiuyuanEntryStudyMap(),obstacles:[]});
  entry.frame();
  const mid=entry.qiaoDraws()[0];
  assert(mid && mid.x>540 && mid.x<LIUYUAN_ENTRY_QIAO_WAIT.x,'入门后乔禾应逐帧退回担边，不瞬移消失');
  const before=entry.savedProgress();
  for(let i=0;i<50;i++)entry.frame();
  assert(entry.qiaoDraws().length===1 && Math.abs(entry.qiaoDraws()[0].x-540)<=1,
    '退回后仍有一位等待的乔禾，不重复画两个替身');
  assert(entry.savedProgress()===before,'NPC 走位不能追加进度或奖励');
  assert(entry.seatedDraws().length === 2 && entry.seatedDraws().some(npc => npc.role === 'elder' && npc.y === 655),
    '直接入园后老叟仍守街侧担子，门房始终在门洞，不随旗标消失');
  walkWaypoints(entry, 'keyboard', [['回到老叟身边', 493, 666, 8]], { ...buildLiuyuanEntryStudyMap(), obstacles: [] });
  assert(entry.nodes.interactionCue.textContent.includes('乔老叟'), '担边提示须与实际人物一致');
  const elderSave = entry.savedProgress(); entry.nodes.interact.click();
  assert(entry.nodes.speaker.textContent === '乔老叟' && entry.nodes.line.textContent.includes('空桶带回来'),
    '入园后回头仍能与留下的老人交谈');
  assert(entry.savedProgress() === elderSave, '担边闲话不得重发任务、艺或可选指路事件');

  const returning=boot('liuyuan-entry','?route=modern&from=court&return=1&playtest=1',14,undefined,undefined,true);
  returning.frame();
  assert(returning.qiaoDraws().length===1 && Math.abs(returning.qiaoDraws()[0].x-540)<=1,
    '返程先恢复担边等候位置，不能在门房应答时凭空生成');
  assert(returning.seatedDraws().length === 2 && returning.seatedDraws().some(npc => npc.role === 'elder'),
    '返程恢复同一位守担老人，不在还桶后另生成替身');
}
for (const [memory, expected] of [
  ['liuyuan-album-orchid-leaf', '别搁在我案上'],
  ['liuyuan-drawing-smudged', '想起花匠压住湿纸'],
  ['liuyuan-drawing-left', '找人就认笔树'],
] as const) {
  const query = '?route=modern&from=study-court&playtest=1';
  const initial = boot('liuyuan-study-interior', query, 9);
  const progress = JSON.parse(initial.savedProgress()); progress.knowledge.push(memory);
  const interior = boot('liuyuan-study-interior', query, 9, JSON.stringify(progress));
  walkWaypoints(interior, 'keyboard', [['书斋中央', 770, 650], ['抄书人案前', 630, 610, 22]],
    buildLiuyuanStudyInteriorMap());
  assert(!interior.nodes.answerChoices.hidden && interior.nodes.answerPrompt.textContent.includes(expected),
    `花房经历必须出现在书斋首次会面的对白中：${memory}`);
  const saved = JSON.parse(interior.savedProgress());
  assert(saved.arts.yu === progress.arts.yu && saved.arts.shu === progress.arts.shu,
    '支线对白回响不能再次发放六艺');
}
const completedProgressByInput = new Map<'keyboard' | 'touch', string>();
const entryMarkup = readFileSync('liuyuan-entry.html', 'utf8');
assert(/<div class="stage">[\s\S]*?<section id="dialogue"[\s\S]*?<\/section><\/div>/.test(entryMarkup),
  '入口人物对白须出现在画面内，不可藏在整张画布下方');
for (const page of ['liuyuan-court', 'liuyuan-lvyin']) {
  const markup = readFileSync(`${page}.html`, 'utf8');
  assert(/<div class="stage">[\s\S]*?<button class="stage-action" id="continueChapter"/.test(markup),
    `${page} 的过幕按钮应与场景处于同一视野`);
  const chapterScene = boot(page, '?chapter=1');
  assert(chapterScene.nodes.stageNote.hidden, `${page} 正式章流不应覆盖调试说明卡`);
}
const playtestEntry = boot('liuyuan-entry', '?playtest=1', 0);
playtestEntry.frame();
assert(!playtestEntry.nodes.playtestBanner.hidden && playtestEntry.nodes.playtestStart.hidden,
  '试玩入口应明示独立进度，不再显示重复的开始链接');
assert(!playtestEntry.nodes.interactionCue.hidden
  && playtestEntry.nodes.interactionCue.textContent.includes('乔老叟'),
  '从头试玩的出生点应直接显示近身人物交互提示');
playtestEntry.nodes.playtestRestart.click();
assert(playtestEntry.assignedUrl() === 'liuyuan-entry.html?playtest=1',
  '重开试玩应留在独立试玩模式');
const playtestEastHall = boot('liuyuan-east-hall',
  '?route=modern&from=flower&draft=1&playtest=1');
assert(playtestEastHall.nodes.backToFlower.href === 'liuyuan-flower.html?chapter=1&draft=1&playtest=1',
  '堂前院顶部返花木院链接不能丢掉独立试玩存档');
// Start from an empty chapter save: conversations, narrow route, observation and delivery
// must carry real saved progress across pages. No flag may be pre-granted at a scene boundary.
for (const input of ['keyboard', 'touch'] as const) {
  const emptySave = JSON.stringify({
    version: 1, arts: { li: 0, yue: 0, she: 0, yu: 0, shu: 0, shuMath: 0 },
    gardens: { canglang: 'open', wangshi: 'locked', zhuozheng: 'locked', shizilin: 'locked',
      liuyuan: 'locked', ouyuan: 'locked', yipu: 'locked', huanxiu: 'locked', tuisi: 'locked' },
    completedTasks: [], knowledge: [], storyFlags: [], updatedAt: 0,
  });
  const chooseFirst = (harness: ReturnType<typeof boot>, label: string) => {
    assert(harness.nodes.choices?.children.length, `${label} 缺少人物应答选项`);
    if (input === 'keyboard') harness.rawKey('1');
    else harness.nodes.choices.children[0].click();
  };
  const advanceLines = (harness: ReturnType<typeof boot>, count: number) => {
    for (let i = 0; i < count; i++) harness.nodes.interact.click();
  };
  let entry = boot('liuyuan-entry', '?draft=1', 0, emptySave);
  const reloadEntry = () => {
    entry.pagehide();
    const footBefore = entry.foot();
    entry = boot('liuyuan-entry', '?draft=1', 0, entry.savedProgress(), undefined, false, entry.sessionRecords);
    assert(entry.foot().join() === footBefore.join(), `${input} 刷新应恢复入口原鞋底，不退回门外`);
  };
  assert(!entry.storyFlags().length, '入口测试必须从无留园旗标的存档开始');
  entry.nodes.interact.click();
  assert(entry.nodes.speaker.textContent === '观察', '门外应先由担子和人触发故事');
  advanceLines(entry, 2); chooseFirst(entry, '替老叟提粥');
  assert(entry.storyFlags().includes('ly-errand-offered'), '接受托付后才记录送粥');
  entry.nodes.interact.click();
  const entryMap = buildLiuyuanEntryStudyMap();
  assert(!collides(entryMap.map, LIUYUAN_ENTRY_QIAO_WAIT.x, LIUYUAN_ENTRY_QIAO_WAIT.y,
    entryMap.w, entryMap.h), '乔禾应停在门外石路，不站在墙体中');
  walkWaypoints(entry, input, [['乔禾', LIUYUAN_ENTRY_QIAO_WAIT.x, LIUYUAN_ENTRY_QIAO_WAIT.y, 15]],
    { ...buildLiuyuanEntryStudyMap(), obstacles: [] });
  entry.nodes.interact.click(); advanceLines(entry, 1); chooseFirst(entry, '乔禾指路');
  assert(entry.storyFlags().includes('ly-huabu-seen'), '听乔禾说小门后才记录口令');
  walkWaypoints(entry, input, [['门房', 520, 614, 15]],
    { ...buildLiuyuanEntryStudyMap(), obstacles: [] });
  entry.nodes.interact.click(); advanceLines(entry, 2); chooseFirst(entry, '门房第一次拦路');
  assert(entry.storyFlags().includes('ly-gate-clue') && !entry.storyFlags().includes('ly-gate-passed'),
    '第一次拦路只给线索，不应直接过门');
  entry.nodes.interact.click(); chooseFirst(entry, '用老叟身份线索答门房');
  assert(entry.storyFlags().includes('ly-gate-passed'), '正确应答后才允许穿门');
  advanceLines(entry, 3);
  walkWaypoints(entry, input, LIUYUAN_ALLEY_CHECKPOINTS.slice(0, 4).map((point) =>
    [point.label, point.x, point.y, 12] as const),
  { ...buildLiuyuanEntryStudyMap(), obstacles: [] });
  reloadEntry();
  walkWaypoints(entry, input, LIUYUAN_ALLEY_CHECKPOINTS.slice(4).map((point, index) =>
    [point.label, point.x, point.y, index === 2 ? 24 : 12] as const),
  { ...buildLiuyuanEntryStudyMap(), obstacles: [] });
  assert(!entry.storyFlags().includes('ly-alley-walked'), '抵达小庭口后仍须亲手放桶');
  if (entry.nodes.dialogue.hidden) entry.nodes.interact.click();
  chooseFirst(entry, '小庭口放桶');
  assert(entry.storyFlags().includes('ly-alley-walked'), '放桶后才结算夹弄实走');
  reloadEntry();
  assert(entry.nodes.status.textContent.includes('桶还放在脚边'), '放桶后刷新不能自动提桶');
  entry.nodes.interact.click();
  chooseFirst(entry, '提桶后沿墙西行');
  assert(!entry.assignedUrl(), '提桶动作必须留在本幕，不能直接跳过西折石路');
  entry.nodes.interact.click();
  assert(!entry.assignedUrl(), '在歇桶位置按 E 不能提前切到小庭');
  walkWaypoints(entry, input, [
    ['漏窗南侧', 420, 232, 8], ['小庭西折口', 340, 232, 12],
  ], { ...buildLiuyuanEntryStudyMap(), obstacles: [] });
  reloadEntry();
  walkWaypoints(entry, input, [['西口转场', 290, 232, 12]],
    { ...buildLiuyuanEntryStudyMap(), obstacles: [] });
  entry.nodes.interact.click();
  assert(entry.assignedUrl() === 'liuyuan-court.html?chapter=1&draft=1',
    '入小庭应保留章节和草稿预览');
  entry.pagehide();
  assert(!entry.sessionRecords[entryResumeKey('campaign:forward:draft')],
    '离开入口去小庭后不能残留入口位置，导致下次入园偷跳路段');

  let court = boot('liuyuan-court', entry.assignedUrl().slice('liuyuan-court.html'.length),
    0, entry.savedProgress());
  assert(court.storyFlags().includes('ly-alley-walked'), '小庭应读到入口实走进度');
  walkWaypoints(court, input, [
    ['小庭东院', 1170, 680], ['窗下', 1160, 650, 20],
  ], buildLiuyuanCourtStudyMap());
  court.nodes.look.click();
  court.pagehide();
  const courtFoot = court.foot().join();
  court = boot('liuyuan-court', '?chapter=1&draft=1', 0, court.savedProgress(), undefined, false, court.sessionRecords);
  assert(court.foot().join() === courtFoot, '小庭观察后刷新须保留脚点');
  walkWaypoints(court, input, [
    ['庭中石路', 790, 670], ['庭中西侧', 610, 625], ['小庭折角', 405, 550],
    ['西廊', 340, 450], ['临池转场', 330, 305, 12],
  ], buildLiuyuanCourtStudyMap());
  court.nodes.continueChapter.click();
  court.pagehide();
  assert(!Object.keys(court.sessionRecords).some((key) => key.startsWith('gusu:liuyuan-court:')),
    '小庭离幕后 pagehide 不得重写旧脚点');
  assert(court.assignedUrl() === 'liuyuan-lvyin.html?chapter=1&courtWindow=1&draft=1',
    '观察漏窗并走到西廊才可接临池，且保留草稿参数');

  const lvyin = boot('liuyuan-lvyin', court.assignedUrl().slice('liuyuan-lvyin.html'.length),
    0, court.savedProgress());
  walkWaypoints(lvyin, input, [
    ['池南东段', 1250, 720], ['池南中段', 930, 700, 25],
  ], buildLiuyuanLvyinStudyMap());
  // Walk past the required observation once: the blocked exit must explain why.
  const pavilionRoute: [string, number, number, number?][] = [
    ['池南西段', 700, 710], ['台阶下', 485, 630], ['轩前台阶', 375, 535], ['轩前', 250, 470, 25],
  ];
  walkWaypoints(lvyin, input, pavilionRoute, buildLiuyuanLvyinStudyMap());
  assert(!lvyin.nodes.continueChapter.hidden && lvyin.nodes.stageNote.hidden,
    '看池是可选探索，未观察也必须能继续送粥');
  walkWaypoints(lvyin, input, [
    ['轩前台阶', 375, 535], ['台阶下', 485, 630], ['池南西段', 700, 710], ['池南中段', 930, 700, 25],
  ], buildLiuyuanLvyinStudyMap());
  assert(!lvyin.nodes.observePond.hidden, '池边必须有画面内的看池按钮');
  lvyin.nodes.observePond.click();
  assert(lvyin.nodes.look.textContent === '收', '池边观察应切入可退出的第一人称取景');
  lvyin.frame();
  assert(!lvyin.nodes.stageNote.hidden && !lvyin.nodes.observePond.hidden,
    '正式章流取景必须显示反馈和收回按钮');
  assert(lvyin.nodes.stageNote.textContent.includes('西北望'), '取景时应提示视向与退出方式');
  lvyin.rawKey('Escape');
  assert(lvyin.nodes.look.textContent === '看', 'Esc 应收回池边取景');
  lvyin.nodes.look.click();
  walkWaypoints(lvyin, input, [
    ['池南西段', 700, 710], ['台阶下', 485, 630], ['轩前台阶', 375, 535],
    ['轩前', 250, 470, 25],
  ], buildLiuyuanLvyinStudyMap());
  assert(lvyin.nodes.look.textContent === '看', '移动后应自动收回取景，继续可走路线');
  lvyin.nodes.continueChapter.click();
  assert(lvyin.assignedUrl() === 'liuyuan-flower.html?chapter=1&draft=1',
    '临池观察后才可从轩前接花木院');

  const flower = boot('liuyuan-flower', lvyin.assignedUrl().slice('liuyuan-flower.html'.length),
    0, lvyin.savedProgress());
  walkWaypoints(flower, input, [['檐下粥桶', 480, 500, 15]], buildLiuyuanFlowerStudyMap());
  flower.nodes.look.click();
  assert(flower.storyFlags().includes('ly-porridge-delivered'),
    `到檐下搁桶才记录送达：脚点 ${flower.foot().join()}，提示 ${flower.nodes.status.textContent}`);
  assert(!flower.nodes.sceneMessage.hidden && flower.nodes.stageNote.hidden,
    '送粥反馈应留在场景内，章流调试卡应隐藏');
  const deliveredProgress = flower.savedProgress();
  flower.nodes.look.click();
  assert(flower.savedProgress() === deliveredProgress && flower.nodes.sceneMessage.textContent.includes('已经放'),
    '重复查看粥桶须承认已交付，不重写进度');
  walkWaypoints(flower, input, [['未问话先到东口', 1675, 445, 35]], buildLiuyuanFlowerStudyMap());
  assert(!flower.nodes.continueChapter.hidden && !flower.storyFlags().includes('ly-florist-met'),
    '已交粥但未问话也能离院，不能伪造花匠线索');
  assert(flower.nodes.continueChapter.textContent.includes('纸声'), '未听花匠时出口不能提示未知的笔树');
  const silentFlower = boot('liuyuan-flower', '?chapter=1&draft=1', 0, flower.savedProgress());
  walkWaypoints(silentFlower, input, [['不问话直接到东口', 1675, 445, 35]], buildLiuyuanFlowerStudyMap());
  silentFlower.nodes.continueChapter.click();
  assert(silentFlower.nodes.transitionWords.textContent.includes('翻纸声')
    && !silentFlower.nodes.transitionWords.textContent.includes('苞尖'), '未听线索的转场不能声称听过笔树');
  silentFlower.nodes.transitionContinue.click();
  const silentHall = boot('liuyuan-east-hall', silentFlower.assignedUrl().slice('liuyuan-east-hall.html'.length),
    0, silentFlower.savedProgress());
  assert(silentHall.nodes.stageNote.hidden && !silentHall.storyFlags().includes('ly-florist-met'),
    '跳过花匠后堂前须仍接入正式章流，不能降为研究试走');
  walkWaypoints(silentHall, input, [['自看左树', 515, 575, 18]], buildLiuyuanEastHallStudyMap());
  silentHall.nodes.look.click();
  walkWaypoints(silentHall, input, [['堂前中段', 970, 620], ['自看右树', 1390, 615, 20]], buildLiuyuanEastHallStudyMap());
  silentHall.nodes.look.click();
  assert(silentHall.storyFlags().includes('ly-magnolia-seen')
    && !silentHall.storyFlags().includes('ly-florist-met')
    && !silentHall.nodes.sceneMessage.textContent.includes('花匠说'), '自主看树须推进观察，不能伪造听话记忆');
  walkWaypoints(silentHall, input, [['堂前东路', 1670, 615], ['自主探索东口', 1670, 525, 22]], buildLiuyuanEastHallStudyMap());
  silentHall.nodes.continueChapter.click();
  assert(silentHall.assignedUrl().startsWith('liuyuan-stone-forest.html?route=modern'),
    '不听花匠也须能继续到石林');
  // A second path bypasses every optional middle observation, using real page input.
  const directHall = boot('liuyuan-east-hall', '?route=modern&from=flower&draft=1', 0, silentFlower.savedProgress());
  walkWaypoints(directHall, input, [['堂前通路', 515, 620], ['堂前中段', 970, 620],
    ['堂前东路', 1670, 615], ['未看树直接离院', 1670, 525, 22]], buildLiuyuanEastHallStudyMap());
  assert(!directHall.nodes.continueChapter.hidden && !directHall.storyFlags().includes('ly-magnolia-seen'),
    '不看树须能离院，不补造观察事件');
  directHall.nodes.continueChapter.click();
  const directStone = boot('liuyuan-stone-forest', directHall.assignedUrl().slice('liuyuan-stone-forest.html'.length),
    0, directHall.savedProgress());
  walkWaypoints(directStone, input, [['绕石至廊口', 530, 450, 25]], buildLiuyuanStoneForestStudyMap());
  assert(!directStone.nodes.toStudyCourt.hidden && directStone.nodes.stageNote.hidden,
    '未按看也须能从廊口继续寻人，不能落入研究模式');
  directStone.nodes.toStudyCourt.click();
  const directCourt = boot('liuyuan-study-court', directStone.assignedUrl().slice('liuyuan-study-court.html'.length),
    0, directStone.savedProgress());
  walkWaypoints(directCourt, input, [['院中石路', 560, 750], ['书斋门前', 480, 690, 20]], buildLiuyuanStudyCourtMap());
  directCourt.nodes.look.click(); directCourt.frame();
  if (input === 'keyboard') directCourt.rawKey('2');
  else directCourt.nodes.doorActions.querySelectorAll('[data-choice]').find(button => button.dataset.choice === 'knock')!.click();
  assert(directCourt.storyFlags().includes('ly-study-found') && !directCourt.storyFlags().includes('ly-magnolia-seen')
    && !directCourt.storyFlags().includes('ly-florist-met'), '靠近书斋叩门可发现人物，不依赖花匠/双树打卡');

  flower.nodes.look.click();
  assert(!flower.nodes.sceneMessage.hidden && flower.nodes.sceneMessage.textContent.includes('粥桶已放妥'),
    '出口反馈不能把已交粥误报成未交粥');
  walkWaypoints(flower, input, [['兰稿旁经过', 650, 485, 26], ['花匠身边', 650, 400, 14]], buildLiuyuanFlowerStudyMap());
  flower.nodes.look.click();
  assert(!flower.nodes.dialogueActions.hidden, `靠近花匠后应能问话或看换土 ${flower.foot()} ${flower.nodes.status.textContent} drawing=${flower.nodes.lanternPuzzle.hidden}`);
  assert(flower.nodes.dialoguePrompt.textContent.length > 0,
    '花匠应答面板应同时显示触发它的对白');
  flower.nodes.watchSoil.click();
  assert(flower.storyFlags().includes('ly-florist-met'), '观察换土后应获得笔树线索');
  flower.nodes.recallClue.click();
  assert(!flower.nodes.sceneMessage.hidden && flower.nodes.sceneMessage.textContent.includes('笔树'),
    '回忆花匠线索须在画面内显示');
  walkWaypoints(flower, input, [['花木院东口', 1675, 445, 35]], buildLiuyuanFlowerStudyMap());
  flower.nodes.continueChapter.click();
  assert(!flower.nodes.storyTransition.hidden && flower.assignedUrl() === '', '花房出口先呈现叙事转场，不提前切页');
  const transitionProgress = flower.savedProgress();
  const transitionFoot = flower.foot().join();
  flower.key('keydown', 'left'); for (let i = 0; i < 10; i++) flower.frame();
  assert(flower.foot().join() === transitionFoot && flower.savedProgress() === transitionProgress,
    '阅读转场不能移动人物或发放奖励');
  if (input === 'keyboard') flower.rawKey('Enter'); else flower.nodes.transitionContinue.click();
  assert(flower.assignedUrl() === 'liuyuan-east-hall.html?route=modern&from=flower&draft=1',
    '花匠线索后应可走到东口，接堂前院');
  assert((JSON.parse(flower.savedProgress()) as { arts: { yu: number } }).arts.yu === 0,
    '普通走路不发御艺');

  const eastHall = boot('liuyuan-east-hall', flower.assignedUrl().slice('liuyuan-east-hall.html'.length),
    0, flower.savedProgress());
  walkWaypoints(eastHall, input, [['堂前左树', 515, 575, 18]], buildLiuyuanEastHallStudyMap());
  eastHall.nodes.look.click();
  assert(eastHall.storyFlags().includes('ly-magnolia-seen'), '亲眼看过一侧即可记录观察，不要求双树打卡');
  assert(!eastHall.nodes.sceneMessage.hidden && eastHall.nodes.stageNote.hidden,
    '堂前观察反馈应在画面内，章流调试卡应隐藏');
  walkWaypoints(eastHall, input, [
    ['堂前中段', 970, 620], ['堂前右树', 1390, 615, 20],
  ], buildLiuyuanEastHallStudyMap());
  eastHall.nodes.look.click();
  assert(eastHall.storyFlags().includes('ly-magnolia-seen'), '再看另一侧仍保留原观察记录');
  walkWaypoints(eastHall, input, [
    ['堂前东路', 1670, 615], ['石林转场', 1670, 525, 22],
  ], buildLiuyuanEastHallStudyMap());
  eastHall.nodes.continueChapter.click();
  assert(eastHall.assignedUrl() === 'liuyuan-stone-forest.html?route=modern&from=east-hall&draft=1',
    '堂前东口应接石林，保留草稿预览');

  const stone = boot('liuyuan-stone-forest', eastHall.assignedUrl().slice('liuyuan-stone-forest.html'.length),
    0, eastHall.savedProgress());
  walkWaypoints(stone, input, [['轩前石阶', 530, 450, 25]], buildLiuyuanStoneForestStudyMap());
  stone.nodes.look.click();
  stone.frame();
  assert(!stone.nodes.sceneMessage.hidden && stone.nodes.stageNote.hidden,
    '石林轩前反馈应在画面内，章流调试卡应隐藏');
  assert(!stone.nodes.toStudyCourt.hidden,
    `在揖峰轩外观察后应显出书斋院转场：脚点 ${stone.foot().join()}，提示 ${stone.nodes.status.textContent}，模式 ${stone.nodes.modeBadge.textContent}`);
  assert(stone.nodes.toGuanyun.hidden && stone.nodes.toWindowStudy.hidden,
    '正式寻人路线不应显示尚未接故事的研究跳页按钮');
  stone.rawKey('f');
  assert(stone.assignedUrl() === '', '正式路线按 F 不应被研究切片截走');
  stone.nodes.toStudyCourt.click();
  assert(stone.assignedUrl() === 'liuyuan-study-court.html?route=modern&from=stone-forest&draft=1',
    '石林经轩前才可接书斋院');

  const studyCourt = boot('liuyuan-study-court', stone.assignedUrl().slice('liuyuan-study-court.html'.length),
    0, stone.savedProgress());
  walkWaypoints(studyCourt, input, [
    ['院中石路', 560, 750], ['书斋门前', 480, 695, 22],
  ], buildLiuyuanStudyCourtMap());
  studyCourt.nodes.look.click();
  studyCourt.frame();
  assert(!studyCourt.nodes.doorActions.hidden, '书斋门前听到纸声后应出现轻叩选择');
  assert(studyCourt.nodes.stageNote.hidden && studyCourt.nodes.doorPrompt.textContent.includes('纸'),
    '书斋门前应在画面中听见纸声，不能只在侧栏给选项');
  if (input === 'keyboard') studyCourt.rawKey('2');
  else studyCourt.nodes.doorActions.querySelectorAll('[data-choice]')
    .find((button) => button.dataset.choice === 'knock')!.click();
  assert(studyCourt.storyFlags().includes('ly-study-found'), '实际轻叩门后才记录找到书斋');
  assert(studyCourt.nodes.interiorResearch.href
    === 'liuyuan-study-interior.html?route=modern&from=study-court&draft=1',
    '轻叩后应接书斋内景并保留草稿参数');

  let interior = boot('liuyuan-study-interior',
    studyCourt.nodes.interiorResearch.href.slice('liuyuan-study-interior.html'.length),
    0, studyCourt.savedProgress());
  const reloadInterior = () => {
    interior.pagehide();
    const progressBefore = interior.savedProgress();
    interior = boot('liuyuan-study-interior', '?route=modern&from=study-court&draft=1',
      0, progressBefore, undefined, false, interior.sessionRecords);
    assert(interior.savedProgress() === progressBefore, '书斋刷新只恢复会话，不重写章节或奖励');
  };
  walkWaypoints(interior, input, [
    ['书斋中央', 770, 650], ['抄书人案前', 630, 610, 22],
  ], buildLiuyuanStudyInteriorMap());
  interior.frame();
  assert(!interior.nodes.answerChoices.hidden && interior.storyFlags().includes('ly-scholar-met'),
    '走近抄书人才应开启应答并记录相见');
  assert(interior.nodes.stageNote.hidden && interior.nodes.answerPrompt.textContent.includes('门别关'),
    '抄书人的首句与应答应一起出现在画面内');
  if (input === 'keyboard') interior.rawKey('1');
  else interior.nodes.answerChoices.querySelectorAll('[data-answer]')[1].click();
  walkWaypoints(interior, input, [['书案边', 480, 610, 20]], buildLiuyuanStudyInteriorMap());
  interior.nodes.look.click();
  if (input === 'touch') {
    walkWaypoints(interior, input, [['可选先看窗边', 815, 540, 10]], buildLiuyuanStudyInteriorMap());
    interior.nodes.look.click();
  }
  reloadInterior();
  walkWaypoints(interior, input, [['刷新后走到中央', 770, 650], ['再到抄书人旁', 630, 610, 22]], buildLiuyuanStudyInteriorMap());
  interior.nodes.look.click();
  interior.frame();
  assert(!interior.nodes.paperChoices.hidden, '抄书人卷纸又放下时应出现追问选择');
  assert(interior.nodes.paperPrompt.textContent.includes('纸') && interior.nodes.paperPrompt.textContent.includes('核一核'),
    '同一次交谈须在画面内交代核本托付与卷纸动作');
  if (input === 'keyboard') interior.rawKey('1');
  else interior.nodes.paperChoices.querySelectorAll('[data-paper-answer]')[1].click();
  assert(interior.storyFlags().includes('ly-scholar-trouble-known'), '听过纸出门的难题才推进剧情');
  const oldInterior = boot('liuyuan-study-interior', '?route=modern&from=study-court&draft=1',
    0, interior.savedProgress());
  oldInterior.frame();
  assert(oldInterior.nodes.leafResearchLink.hidden, '无会话记录的旧档只知纸张处境，不能自动算作发现新叶');
  reloadInterior();
  interior.frame();
  assert(interior.nodes.leafResearchLink.hidden, '只知纸张处境刷新不得提前打开题叶入口');
  walkWaypoints(interior, input, [['中央再入窗边', 770, 650], ['再看窗外叶', 815, 540, 10]], buildLiuyuanStudyInteriorMap());
  interior.nodes.look.click();
  reloadInterior();
  assert(interior.nodes.leafResearchLink.hidden, '看过新叶但尚未结束交谈时，刷新仍不能提前收束');
  walkWaypoints(interior, input, [['中央再入案前', 770, 650], ['回到抄书人旁', 630, 610, 22]], buildLiuyuanStudyInteriorMap());
  interior.nodes.look.click();
  reloadInterior();

  walkWaypoints(interior, input, [['走回门槛', 770, 890, 25]], buildLiuyuanStudyInteriorMap());
  interior.frame();
  assert(!interior.nodes.leafResearchLink.hidden, `人物对白结束后仍须走回门槛才显出题叶入口 ${interior.nodes.status.textContent} ${JSON.stringify(interior.sessionRecords)}`);
  assert(interior.nodes.leafResearchLink.children[0].href
    === 'liuyuan-leaf-writing-study.html?route=modern&from=study-interior&draft=1',
    '题叶特写链接应继承章节与草稿参数');

  let leaf = boot('liuyuan-leaf-writing-study',
    interior.nodes.leafResearchLink.children[0].href.slice('liuyuan-leaf-writing-study.html'.length),
    0, interior.savedProgress());
  const leafAct = (name: string, number: string) => {
    if (input === 'keyboard') leaf.rawKey(number);
    else {
      const button = leaf.leafActions.get(name); assert(button, `题叶缺少 ${name} 触屏按钮`); button.click();
    }
  };
  assert(leaf.nodes.variantWords.textContent.includes('移步景异') && leaf.nodes.variantWords.textContent.includes('景同'), '题叶须显示原句及回忆中的差别，不能只让玩家抄空白');
  leafAct('old', '1');
  assert(!leaf.storyFlags().includes('ly-leaf-picked'), '查看老叶不应提前记录摘叶');
  leafAct('new', '2');
  assert(leaf.storyFlags().includes('ly-leaf-picked'), '亲手挑新叶才记录摘叶');
  leafAct('test-ink', '1');
  leafAct('hard-write', '1');
  assert(leaf.nodes.supportControls.hidden === false, '用力写失败后应留在托叶选择');
  leafAct('take-board', '2');
  if (input === 'keyboard') {
    leaf.rawKey('1'); leaf.rawKey('ArrowRight'); leaf.blur();
    assert(!leaf.storyFlags().includes('ly-leaf-written') && leaf.nodes.strokeControls.hidden === false, '半笔失焦不能奖励或回退到选叶');
    leaf.rawKey('1'); leaf.rawKey('ArrowUp');
    assert(leaf.nodes.leafStatus.textContent.includes('方向偏'), '方向错误须解释且允许本段重试');
  }
  for (let index = 0; index < 3; index++) {
    if (input === 'keyboard') leaf.rawKey(String(index + 1));
    else {
      const box=leaf.nodes.leafScene.getBoundingClientRect();
      const view=leafTraceView(index);
      const pointer=(point: {x:number;y:number})=>({pointerId:7,button:0,clientX:box.left+(point.x-view.x)*box.width/view.w,clientY:box.top+(point.y-view.y)*box.height/view.h,preventDefault(){}});
      const path=LEAF_TRACE_PATHS[index];
      leaf.nodes.leafScene.dispatch('pointerdown',pointer(path[0]));
      // Other fingers cannot take over the active brush or lift it.
      leaf.nodes.leafScene.dispatch('pointerup',{...pointer(path[0]),pointerId:8});
      for (const point of path.slice(1)) leaf.nodes.leafScene.dispatch('pointermove',pointer(point));
      leaf.nodes.leafScene.dispatch('pointerup',pointer(path[path.length-1]));
    }
    if (input === 'keyboard') {
      const directions=[['ArrowRight','ArrowDown','ArrowLeft'],['ArrowUp','ArrowRight','ArrowDown'],['ArrowRight','ArrowDown']];
      // Selecting a starting point alone must not count as writing.
      assert(leaf.nodes.doneControls.hidden, '按数字落笔不能直接完成临写');
      for (const direction of directions[index]) leaf.rawKey(direction);
    }
    if (index === 0) {
      // A half-written second segment is discarded, while the first survives reload.
      leaf.rawKey('2'); leaf.rawKey('ArrowUp'); leaf.pagehide();
      const beforeReload=leaf.savedProgress();
      leaf=boot('liuyuan-leaf-writing-study',
        interior.nodes.leafResearchLink.children[0].href.slice('liuyuan-leaf-writing-study.html'.length),
        0,beforeReload,undefined,false,leaf.sessionRecords);
      assert(leaf.savedProgress()===beforeReload && leaf.nodes.leafStatus.textContent.includes('已写好的 1 段'),
        '刷新须保留一段完整笔路、丢弃半笔且不结算书艺');
      assert(!leaf.storyFlags().includes('ly-leaf-written'), '恢复到半途不能伪造完成');
    }
  }
  assert(leaf.storyFlags().includes('ly-leaf-written') && !leaf.nodes.doneControls.hidden,
    '三处依次落笔后才完成题叶');
  assert(leaf.nodes.variantWords.textContent.includes('回府学再对原本'), '题完留下核版本的下一步，不能直接判哪本正确');
  assert(JSON.parse(leaf.savedProgress()).knowledge.filter((value: string)=>value==='liuyuan-garden-note-variant').length===1, '首次题叶须留下可回看的园记记录且不重复');
  const leafProgress = JSON.parse(leaf.savedProgress()) as { arts: { shu: number }; storyFlags: string[] };
  assert(leafProgress.arts.shu === 1 && leafProgress.storyFlags.length === 13,
    '空存档到题叶应依序得到 13 个事件并只发一次书艺');
  assert(leaf.nodes.returnFromDone.href
    === 'liuyuan-study-court.html?route=modern&from=leaf&draft=1&return=1',
    '题叶完成后应带返程与草稿参数回书斋院');
  const journal=boot('journal', '', 0, leaf.savedProgress());
  assert(!journal.nodes.variantRecord.hidden && journal.nodes.variantAcademy.textContent.includes('景同') && journal.nodes.variantLeaf.textContent.includes('景异'), '题叶之后园谱须能逐字对照两种记录');
  assert(journal.savedProgress()===leaf.savedProgress(), '翻看异文不写奖励与进度');
  assert(journal.nodes.currentObjective.textContent.includes('取空桶')
    && journal.nodes.variantHomeLink.href==='liuyuan-study-court.html?route=modern&from=leaf&return=1',
    '题叶后未出园的园谱须先接收叶取桶，不得跳去尚未开放的府学核本');
  assert(journal.nodes.liuyuanWritingReward.textContent.includes('书 +1')
    && !journal.nodes.liuyuanGuardReward.textContent.includes('御 +1'), '本章奖励只按实际任务结算，不借用其他章全局属性');
  const foreignArtProgress=JSON.parse(leaf.savedProgress()); foreignArtProgress.arts.yu=9;
  const foreignArtJournal=boot('journal','',0,JSON.stringify(foreignArtProgress));
  assert(!foreignArtJournal.nodes.liuyuanGuardReward.textContent.includes('御 +1'),
    '已有其他途径御属性但没完成本章护画时，不得冒称本章奖励');
  const ongoingEntry=boot('liuyuan-entry','?playtest=1&draft=1',0,leaf.savedProgress());
  assert(!ongoingEntry.nodes.continueSavedStory.hidden
    && ongoingEntry.nodes.continueSavedStory.href==='liuyuan-study-court.html?route=modern&from=leaf&return=1&draft=1&playtest=1'
    && ongoingEntry.savedProgress()===leaf.savedProgress(), '中途重新打开首页须有只读续玩书签，不能补造事件');
  completedProgressByInput.set(input, leaf.savedProgress());
}
console.log('空存档→送粥→夹弄→小庭→临池→花木院→堂前双树→石林→书斋人物→亲手题叶：键盘/触屏正向动作链通过。');

// A real reverse chapter action: detour around the florist, collect the bucket, then leave the yard.
for (const input of ['keyboard', 'touch'] as const) {
  const studyCourt = boot('liuyuan-study-court', '?route=modern&from=leaf&draft=1&return=1',
    0, completedProgressByInput.get(input));
  walkWaypoints(studyCourt, input, [
    ['书斋院门前离开', 560, 750], ['书斋院口', 705, 830, 35],
  ], buildLiuyuanStudyCourtMap());
  studyCourt.nodes.toStoneReturn.click();
  assert(studyCourt.assignedUrl() === 'liuyuan-stone-forest.html?route=modern&from=study-court&draft=1&return=1',
    '书斋院返程应接石林，并保留草稿预览');

  const stone = boot('liuyuan-stone-forest', studyCourt.assignedUrl().slice('liuyuan-stone-forest.html'.length),
    0, studyCourt.savedProgress());
  walkWaypoints(stone, input, [
    ['揖峰轩外院地', 530, 475], ['石林西院路', 470, 545, 28],
  ], buildLiuyuanStoneForestStudyMap());
  stone.nodes.toEastHallReturn.click();
  assert(stone.assignedUrl() === 'liuyuan-east-hall.html?route=modern&from=stone-forest&draft=1&return=1',
    '石林返程应接堂前院，并保留草稿预览');

  const eastHall = boot('liuyuan-east-hall', stone.assignedUrl().slice('liuyuan-east-hall.html'.length),
    0, stone.savedProgress());
  walkWaypoints(eastHall, input, [
    ['堂前东侧下行', 1670, 615], ['堂前东院路', 1350, 615],
    ['堂前中央石路', 970, 620], ['堂前西院路', 600, 620], ['花木院方向', 405, 580, 35],
  ], buildLiuyuanEastHallStudyMap());
  eastHall.nodes.toFlowerReturn.click();
  assert(eastHall.assignedUrl() === 'liuyuan-flower.html?route=modern&from=east-hall&draft=1&return=1',
    '堂前院返程应接花木院，并保留草稿预览');

  const flower = boot('liuyuan-flower', eastHall.assignedUrl().slice('liuyuan-flower.html'.length),
    0, eastHall.savedProgress());
  const hold = (direction: Direction) => input === 'keyboard'
    ? flower.key('keydown', direction) : flower.pointer('pointerdown', direction);
  const release = (direction: Direction) => input === 'keyboard'
    ? flower.key('keyup', direction) : flower.pointer('pointerup', direction);
  let position = flower.foot();
  assert(position[0] > 1600 && position[1] < 500, '返程应从花木院东侧出生');
  hold('down');
  for (let i = 0; i < 40; i++) flower.frame();
  release('down');
  position = flower.foot();
  assert(position[1] >= 495 && position[1] <= 515, '东侧通道应可下行到花匠碰撞盒南侧');
  hold('left');
  for (let i = 0; i < 850; i++) {
    flower.frame();
    if (i % 20 === 19 && flower.foot()[0] < 550) break;
  }
  release('left');
  position = flower.foot();
  assert(position[0] < 550 && position[0] > 350, '绕过花匠后应到达空桶附近');
  flower.nodes.look.click();
  assert(flower.nodes.leafCarryActions && !flower.nodes.leafCarryActions.hidden,
    '近桶观察后应出现收叶选择');
  assert(flower.nodes.leafCarryPrompt.textContent.includes('湿墨'),
    '收叶选择应在场景内交代湿墨难题');
  assert(flower.nodes.returnWithStory.hidden, '未收叶不得提供压缩返程');
  flower.nodes.returnWithStory.click();
  assert(flower.nodes.storyTransition.hidden && flower.assignedUrl() === '', '未收叶按转场不得绕过空桶');
  flower.nodes.placeInBucket.click();
  assert(flower.storyFlags().includes('ly-leaf-carried'), '亲手收叶入桶才可写 ly-leaf-carried');
  const carriedJournal=boot('journal','?playtest=1&draft=1',0,flower.savedProgress());
  assert(carriedJournal.nodes.variantHomeLink.href==='liuyuan-entry.html?route=modern&from=flower&draft=1&return=1&playtest=1'
    && carriedJournal.nodes.currentObjective.textContent.includes('交还乔禾'), '已收叶园谱应接交桶，保留草稿/试玩参数');
  hold('right');
  for (let i = 0; i < 250; i++) {
    flower.frame();
    if (i % 20 === 19 && flower.foot()[0] > 770) break;
  }
  release('right');
  position = flower.foot();
  assert(position[0] > 770 && position[0] < 910, '提空桶后应可沿院地走回入口脚点');
  const compactFlower = boot('liuyuan-flower', '?route=modern&from=east-hall&draft=1&return=1',
    0, flower.savedProgress());
  walkWaypoints(compactFlower, input, [['花房东侧', 1720, 510], ['绕过花匠南侧', 650, 510],
    ['沿院路回入口', 810, 510]], buildLiuyuanFlowerStudyMap());
  assert(!compactFlower.nodes.returnWithStory.hidden, '收叶后的原院口应提供压缩返程，仍可自行原路走');
  const compactProgress = compactFlower.savedProgress();
  compactFlower.nodes.returnWithStory.click();
  assert(!compactFlower.nodes.storyTransition.hidden && compactFlower.assignedUrl() === ''
    && compactFlower.savedProgress() === compactProgress, '返程转场不可提前出园或发奖励');
  const compactFoot = compactFlower.foot().join();
  if (input === 'keyboard') compactFlower.key('keydown', 'left'); else compactFlower.pointer('pointerdown', 'left');
  for (let i = 0; i < 10; i++) compactFlower.frame();
  assert(compactFlower.foot().join() === compactFoot, '读返程转场须冻结移动');
  if (input === 'keyboard') compactFlower.rawKey('Enter'); else compactFlower.nodes.transitionContinue.click();
  assert(compactFlower.assignedUrl() === 'liuyuan-entry.html?route=modern&from=flower&draft=1&return=1',
    '压缩返程保留实际来源与草稿参数');
  const compactEntry = boot('liuyuan-entry', compactFlower.assignedUrl().slice('liuyuan-entry.html'.length),
    0, compactFlower.savedProgress());
  assert(compactEntry.nodes.chapterComplete.hidden && !compactEntry.storyFlags().includes('ly-unlocked'),
    '压缩行走只抵夹弄内端，不得自动完成门房与还桶');
  walkWaypoints(compactEntry, input, LIUYUAN_ALLEY_RETURN_CHECKPOINTS.slice(0, -1).map(point =>
    [point.label, point.x, point.y, 12] as const), { ...buildLiuyuanEntryStudyMap(), obstacles: [] });
  assert(!compactEntry.storyFlags().includes('ly-unlocked'), '压缩返程抵门槛仍不能提前结算');
  compactEntry.nodes.interact.click(); compactEntry.nodes.nextLine.click();
  if (input === 'keyboard') compactEntry.rawKey('1'); else compactEntry.nodes.choices.children[0].click();
  compactEntry.nodes.interact.click(); compactEntry.nodes.interact.click();
  walkWaypoints(compactEntry, input, [['真实街面', 520, 656, 10]], { ...buildLiuyuanEntryStudyMap(), obstacles: [] });
  assert(!compactEntry.storyFlags().includes('ly-unlocked') && compactEntry.nodes.chapterComplete.hidden, '到街面但未交桶不能自动结束');
  if (input === 'keyboard') compactEntry.rawKey('e'); else compactEntry.nodes.interact.click();
  assert(compactEntry.storyFlags().includes('ly-unlocked'), '压缩返程仍须亲自过门槛到街面完成');
  flower.nodes.toLvyinReturn.click();
  assert(flower.assignedUrl() === 'liuyuan-lvyin.html?route=modern&from=flower&draft=1&return=1',
    '回临池转场应带上章节返程与编辑器草稿预览');

  const lvyin = boot('liuyuan-lvyin', flower.assignedUrl().slice('liuyuan-lvyin.html'.length),
    0, flower.savedProgress());
  walkWaypoints(lvyin, input, [
    ['轩前台阶', 375, 535], ['台阶下', 485, 630], ['池南石路西段', 700, 710],
    ['临池中段', 930, 700], ['池南石路东段', 1250, 720], ['小庭方向', 1650, 740],
  ], buildLiuyuanLvyinStudyMap());
  lvyin.nodes.toCourtReturn.click();
  assert(lvyin.assignedUrl() === 'liuyuan-court.html?route=modern&from=lvyin&draft=1&return=1',
    '沿临池石路到东侧后应能转场小庭，并保留草稿预览');

  let court = boot('liuyuan-court', lvyin.assignedUrl().slice('liuyuan-court.html'.length),
    0, lvyin.savedProgress());
  walkWaypoints(court, input, [['小庭西廊中途', 340, 450]], buildLiuyuanCourtStudyMap());
  court.pagehide();
  const returnCourtFoot = court.foot().join();
  court = boot('liuyuan-court', '?route=modern&from=lvyin&draft=1&return=1',
    0, court.savedProgress(), undefined, false, court.sessionRecords);
  assert(court.foot().join() === returnCourtFoot, '小庭返程刷新须保留脚点');
  walkWaypoints(court, input, [
    ['小庭西廊下行', 340, 450], ['小庭折角', 405, 550], ['庭中西侧', 610, 625],
    ['庭中石路', 790, 670], ['窗下石路', 1170, 680], ['夹弄口', 1560, 680, 45],
  ], buildLiuyuanCourtStudyMap());
  court.nodes.toEntryReturn.click();
  assert(court.assignedUrl() === 'liuyuan-entry.html?route=modern&from=court&draft=1&return=1',
    '沿小庭石路到夹弄口后应能转场入口，并保留草稿预览');

  let entry = boot('liuyuan-entry', court.assignedUrl().slice('liuyuan-entry.html'.length),
    0, court.savedProgress());
  const reloadReturn = () => {
    entry.pagehide();
    const footBefore = entry.foot();
    entry = boot('liuyuan-entry', '?route=modern&from=court&draft=1&return=1',
      0, entry.savedProgress(), undefined, false, entry.sessionRecords);
    assert(entry.foot().join() === footBefore.join(), `${input} 返程刷新应恢复原鞋底`);
  };
  assert(entry.nodes.chapterComplete?.hidden, '未走返程夹弄时不可显示章末结算');
  walkWaypoints(entry, input, LIUYUAN_ALLEY_RETURN_CHECKPOINTS.slice(0, 5).map((point) =>
    [point.label, point.x, point.y, 12] as const),
  { ...buildLiuyuanEntryStudyMap(), obstacles: [] });
  reloadReturn();
  walkWaypoints(entry, input, LIUYUAN_ALLEY_RETURN_CHECKPOINTS.slice(5, -1).map((point) =>
    [point.label, point.x, point.y, 12] as const),
  { ...buildLiuyuanEntryStudyMap(), obstacles: [] });
  assert(!entry.storyFlags().includes('ly-unlocked'), '站在门槛内不可提前结算出园');
  entry.nodes.interact.click();
  assert(!entry.nodes.dialogue?.hidden && entry.nodes.speaker?.textContent === '门房',
    '门槛前应由门房人物触发应答');
  entry.nodes.nextLine.click();
  assert(entry.nodes.choices?.children.length === 2, '门房应有两种可选应答');
  if (input === 'keyboard') entry.rawKey('1');
  else entry.nodes.choices.children[0].click();
  entry.nodes.interact.click();
  entry.nodes.interact.click();
  reloadReturn();
  assert(entry.nodes.status.textContent.includes('门房已让开'), '门房应答后刷新不应再拦路');
  assert(!entry.storyFlags().includes('ly-unlocked') && entry.nodes.chapterComplete.hidden,
    '门房已经让路但玩家未踏街面时仍不可结算');
  walkWaypoints(entry, input, [[
    '街面脚点', LIUYUAN_ALLEY_RETURN_CHECKPOINTS.at(-1)!.x,
    LIUYUAN_ALLEY_RETURN_CHECKPOINTS.at(-1)!.y, 10,
  ]], { ...buildLiuyuanEntryStudyMap(), obstacles: [] });
  assert(!entry.storyFlags().includes('ly-unlocked') && entry.nodes.chapterComplete.hidden, '到街面但未交桶不能自动结束');
  reloadReturn();
  assert(entry.nodes.interactionCue.textContent.includes('交还乔禾'), '未还桶刷新必须恢复交桶提示，不提前结算');
  if (input === 'keyboard') entry.rawKey('e'); else entry.nodes.interact.click();
  assert(entry.storyFlags().includes('ly-unlocked') && !entry.nodes.chapterComplete.hidden,
    '门房应答后真正踏到街面才可结算留园章');
  assert(entry.nodes.chapterEcho.textContent.includes('亲手试过'), '跳过护画的结尾仍须回应亲手题叶');
  entry.frame();
  assert(entry.bucketDraws().length === 1, '移交第一帧应只有一只桶，不能提桶与地面桶重复显示');
  const handoverStart=entry.bucketDraws()[0];
  const handoverFoot=entry.foot().join();
  const handoverSave=entry.savedProgress();
  if (input === 'keyboard') entry.key('keydown','left'); else entry.pointer('pointerdown','left');
  for(let i=0;i<20;i++)entry.frame();
  const handoverMid=entry.bucketDraws()[0];
  assert(handoverMid && handoverMid.x>handoverStart.x && handoverMid.x<581,
    '桶应连续移向乔禾身边，不能点击后瞬间消失');
  assert(entry.foot().join()===handoverFoot, '交谈/移交时按住方向不可拖走角色');
  if (input === 'keyboard') entry.key('keyup','left'); else entry.pointer('pointerup','left');
  for(let i=0;i<40;i++)entry.frame();
  assert(entry.bucketDraws().length===1 && Math.abs(entry.bucketDraws()[0].x-580)<=1
    && entry.bucketDraws()[0].y===676, '移交后桶留在担边，不在手上重复画');
  assert(entry.savedProgress()===handoverSave,'动画帧不能重复写奖励/章节结算');

  const independentSave = JSON.parse(entry.savedProgress());
  independentSave.storyFlags = independentSave.storyFlags.filter((flag: string) => flag !== 'ly-florist-met' && flag !== 'ly-magnolia-seen');
  independentSave.knowledge = independentSave.knowledge.filter((item: string) => item !== 'liuyuan-magnolia-slip');
  const independentEnding = boot('liuyuan-entry', '?route=modern&from=flower&draft=1&return=1', 0, JSON.stringify(independentSave));
  independentEnding.frame();
  assert(independentEnding.bucketDraws().length === 1 && Math.abs(independentEnding.bucketDraws()[0].x - 580) <= 1,
    '完成档刷新须直接恢复担边桶，不重播移交或重新提桶');
  assert(independentEnding.nodes.chapterEcho.textContent.includes('纸声')
    && !independentEnding.nodes.chapterEcho.textContent.includes('笔树'), '未听花匠的章末不得伪造土话回忆');

  const revisit = boot('liuyuan-entry', '', 0, entry.savedProgress());
  revisit.frame();
  assert(!revisit.nodes.chapterComplete.hidden && revisit.nodes.modeTitle.textContent.includes('回看'),
    '完成档重新打开首页须恢复章末回看，不能误入送粥进行中');
  assert(revisit.savedProgress() === entry.savedProgress() && revisit.bucketDraws().length === 1,
    '回看首页不重写任务/奖励，担边桶仍在');
  revisit.nodes.reset.click(); revisit.frame();
  assert(!revisit.nodes.chapterComplete.hidden && revisit.savedProgress() === entry.savedProgress(),
    '完成档回看重置也不能重新开始任务');
  const playtestRevisit=boot('liuyuan-entry','?playtest=1',0,entry.savedProgress());
  assert(!playtestRevisit.nodes.chapterComplete.hidden
    && playtestRevisit.nodes.returnCityMap.href==='sucheng.html?chapter=1&playtest=1'
    && playtestRevisit.nodes.returnChapterJournal.href==='journal.html?chapter=1&playtest=1',
    '完成试玩首页和章末去向必须保留独立试玩模式');
  const completed = JSON.parse(entry.savedProgress()) as {
    storyFlags: string[]; arts: { yu: number; shu: number }; gardens: { liuyuan: string };
  };
  assert(completed.storyFlags.join(',') === LIUYUAN_CHAPTER_FLAGS.join(','),
    '从空存档走完整章后应按固定顺序恰好记录 15 个事件');
  assert(completed.arts.yu === 0 && completed.arts.shu === 1 && completed.gardens.liuyuan === 'complete',
    '从空存档走完整章后御与书各增加一次，留园园态完成');
  const homeSave = runHomeReturn(entry.savedProgress(), input,
    entry.nodes.returnVariantHome.href.slice('home.html'.length));
  assert(JSON.parse(homeSave).knowledge.includes('liuyuan-garden-note-collated'),
    '新档送粥至还桶后，同一存档按真实去向链接回府学须可完成核本');
}
console.log('同一份空存档题叶后→书斋院→石林→堂前→花木院→临池→小庭→夹弄→街面：键盘/触屏返程、15 事件、御/书奖励与园态结算通过。');
console.log('入口刷新续接：正向中段、放桶、提桶西折、逆行中段、门房已应答均保留脚点和状态；离幕清除入口会话位置。');

const validResume = { version: 1, progressStamp: 'progress-A', geometryStamp: 'geometry-A',
  state: { x: 420, y: 232, dir: 1, alleyCheckpoint: 7, returnCheckpoint: 0,
    gateAnswered: false, bucketResting: false } };
const resumeContext = { slot: 'test', progressStamp: 'progress-A', geometryStamp: 'geometry-A',
  maxAlley: 7, maxReturn: 11, canStand: (x: number, y: number) => x === 420 && y === 232,
  stateAllowed: () => true };
assert(parseEntryResume(JSON.stringify(validResume), resumeContext), '合法续接记录应可恢复');
for (const invalid of ['{broken', 'null', JSON.stringify({ ...validResume, version: 2 }),
  JSON.stringify({ ...validResume, progressStamp: 'old-save' }),
  JSON.stringify({ ...validResume, geometryStamp: 'old-draft' }),
  JSON.stringify({ ...validResume, state: { ...validResume.state, x: 421 } }),
  JSON.stringify({ ...validResume, state: { ...validResume.state, dir: 8 } }),
  JSON.stringify({ ...validResume, state: { ...validResume.state, alleyCheckpoint: 8 } }),
  JSON.stringify({ ...validResume, state: { ...validResume.state, bucketResting: 'true' } })]) {
  assert(parseEntryResume(invalid, resumeContext) === null, '破损、过期、碰撞或非法续接应安全回退');
}
assert(!parseEntryResume(JSON.stringify(validResume), { ...resumeContext, stateAllowed: () => false }),
  '剧情门槛不可由会话续接绕过');
assert(entryResumeKey('playtest:forward:default') !== entryResumeKey('campaign:forward:default')
  && entryResumeKey('campaign:forward:draft') !== entryResumeKey('campaign:chapter-return:draft'),
  '独立试玩、正式章流、正返程与草稿位置应使用不同槽');
console.log('续接边界：损坏、存档/几何变化、非法脚点、剧情门槛及模式隔离反例通过。');

// The entrance had historically ignored editor occluders. A draft front mask must
// repaint only when the actor's foot is behind its depth line, without writing storage.
for (const [depthY, shouldCover] of [[670, true], [600, false]] as const) {
  const record = JSON.stringify({ savedAt: 1, value: JSON.stringify({
    format: 'gusu-scene-geometry', sceneId: 'liuyuan-entrance-topology-study',
    world: { width: 1008, height: 688 }, tileRegions: LIUYUAN_ENTRY_DRAFT_REGIONS,
    objects: [{ id: 'gate-front-mask', occluder: {
      depthY, polygons: [[[505, 604], [535, 604], [535, 635], [505, 635]]],
    } }], actorScalePercent: 100,
  }) });
  clipCalls = 0;
  const masked = boot('liuyuan-entry', '?draft=1', 0, undefined, record, true);
  masked.frame();
  assert((clipCalls > 0) === shouldCover,
    `入口草稿遮挡应按物件落地线重绘：depthY=${depthY}，clip=${clipCalls}`);
  assert(masked.foot().join() === '520,656', '入口遮挡草稿不应改变玩家出生脚点');
}
console.log('入口编辑器草稿遮挡：脚点在落地线后方重绘前景，前方不重绘，位置保持不变。');

// All optional outcomes survive a completed-entry reload without writing a reward.
for (const [memory, words] of [
  ['liuyuan-album-orchid-leaf', '花匠赠你的兰稿'],
  ['liuyuan-drawing-smudged', '湿稿还压在檐下'],
  ['liuyuan-drawing-left', '没有截断这一程'],
] as const) {
  const ending = boot('liuyuan-entry', '?route=modern&from=court&return=1&playtest=1', 15);
  const progress = JSON.parse(ending.savedProgress());
  progress.knowledge.push(memory);
  const before = JSON.stringify(progress);
  const resumed = boot('liuyuan-entry', '?route=modern&from=court&return=1&playtest=1', 15, before);
  assert(!resumed.nodes.chapterComplete.hidden && resumed.nodes.chapterEcho.textContent.includes(words),
    `章末刷新应承接 ${memory}`);
  assert(resumed.savedProgress() === before, '章末回响只读取经历，不重写进度或奖励');
}

console.log('新档→送粥/探索/题叶→过门亲手还桶→同一存档回府学书架核本：连续输入模拟通过，未注入府学前置旗标。');
