/* ============================================================================
 * 今按层 · 实验场（annotation-lab）
 * ============================================================================
 * 这是「今按字色／字体分离」这条工程债的**验收台**，也是它的**调参台**。
 *
 * CH5–CH9 连续五章把这条债挂在工程债表里，终章乙幕整幕依赖它。
 * 配套的常驻键是 `TUNING.annotationDelayMs`（剧本里写作「稍顿」）。
 *
 * 四件事：
 *   ① 三层文字对照（世界文字／玩家手迹／今按）—— 看"分离"够不够狠；
 *   ② 浮现时序现场演示 —— 动作 → 稍顿 → 阶梯浮现，并把 delayMs 调出手感；
 *   ③ 全作 12 处今按真实内容逐条浏览（内容取自各章脚本，逐字未改）；
 *   ④ 五条硬规格自检（规范 §2.6.3）。
 * ========================================================================== */

import { PALETTE as P, TUNING, TYPE_LAYERS, VIEW_H, VIEW_W } from './config.js';
import {
  ANNOTATIONS,
  DEFAULT_TIMING,
  annotationAlpha,
  annotationCountdown,
  drawAnnotation,
  drawHandSample,
  runAllChecks,
  type AnnotTiming,
  type Annotation,
} from './render/annotation.js';

const W = 880;
const H = 560;

const canvas = document.getElementById('labCanvas') as HTMLCanvasElement;
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d', { alpha: false })!;
ctx.imageSmoothingEnabled = false;

/* ---------------------------------------------------------------------------
 * 每个今按配一组"舞台样例"。
 * ⚠️ 这是**实验场的演示数据**，不是剧本内容——剧本里玩家可选的题句见各章 §三。
 *    这里各取其一，只为让手迹与今按同时出现在画面上、好比较。
 * ------------------------------------------------------------------------- */
interface StageSample { world: string; hand: string }
const SAMPLES: Record<string, StageSample> = {
  'CH4-13': { world: '涉园 · 一道墙，两棵银杏。（页脚）', hand: '墙里有两棵银杏。' },
  'CH5-09': { world: '园谱 · 卷三 · 苏邻小筑／网师园', hand: '岸上的墙是白的。水里的墙，也是白的——可水不是。' },
  'CH5-11': { world: '章末 · 回府学 · 摊开园谱', hand: '这一页，我题了两个名字。' },
  'CH6-11': { world: '园谱 · 卷五 · 汪园', hand: '山不是照画堆的。画和山，都照着同一个东西。' },
  'CH6-13': { world: '章末 · 回府学 · 堂上那四个字', hand: '堂上挂着四个字，我没敢念。' },
  'CH7-11': { world: '园谱 · 卷八 · 耦园', hand: '我数了一遍：东边有水，西边没有。' },
  'CH7-13': { world: '章末 · 回府学 · 门口那块匾', hand: '这园子门口的字，我看了很久。' },
  'CH8-12': { world: '园谱 · 卷九 · （两种纸并排）', hand: '园子是新的。树不是。' },
  'CH8-13': { world: '章末 · 回府学 · 走了一天水路', hand: '这一趟，我走了一整天的船。' },
  'CH9-12': { world: '园谱 · 卷一 · 七襄公所（画页）', hand: '擦到只剩水、墙、山。' },
  'CH9-13': { world: '章末 · 回府学 · 第一部三页齐', hand: '我题的名字，是最后那个。' },
  'finale-act2': { world: '（甲幕收束 · 《蘇城全圖》对折）', hand: '〔落款〕' },
};

/* ---------------------------------------------------------------------------
 * 状态
 * ------------------------------------------------------------------------- */
const state = {
  idx: 0,
  /** 玩家的动作时刻（rAF timeStamp）。这就是时序锚点。 */
  actionAt: 0,
  /** 对照模式：三层同时以 alpha=1 并排显示。 */
  compare: false,
  timing: { ...DEFAULT_TIMING } as AnnotTiming,
  lastFrame: 0,
};

const current = (): Annotation => ANNOTATIONS[state.idx];
const sample = (): StageSample => SAMPLES[current().id] ?? { world: '', hand: '' };

function replay(): void {
  state.actionAt = performance.now();
}

/* ---------------------------------------------------------------------------
 * 舞台绘制：一页"园谱"
 * ------------------------------------------------------------------------- */
function drawStage(now: number): void {
  ctx.fillStyle = P.paper;
  ctx.fillRect(0, 0, W, H);

  /* 版框：古籍的一页 */
  ctx.strokeStyle = P.inkPale;
  ctx.lineWidth = 1;
  ctx.strokeRect(28.5, 24.5, W - 57, H - 48);
  /* 版心竖线（界行） */
  ctx.beginPath();
  ctx.moveTo(W / 2, 24);
  ctx.lineTo(W / 2, H - 24);
  ctx.stroke();

  /* —— 页眉 —— */
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = P.inkMid;
  ctx.font = `11px ${TYPE_LAYERS.world.font}`;
  ctx.fillText(`${current().chapter}　·　${current().id}`, 44, 46);

  /* 状态徽标（这一栏是给做游戏的人看的，不进正式画面） */
  const elapsed = now - state.actionAt;
  let status: string, statusInk: string;
  if (state.compare) { status = '对照模式 · 三层同时全显'; statusInk = P.qing; }
  else if (elapsed < state.timing.delayMs) {
    status = `① 动作已发生 →　稍顿中（还剩 ${Math.round(annotationCountdown(state.actionAt, now, state.timing))} ms）`;
    statusInk = P.zhu;
  } else if (annotationAlpha(state.actionAt, now, state.timing) < 1) {
    status = '② 稍顿结束 →　今按阶梯浮现中';
    statusInk = TUNING.annotationDelayMs > 0 ? P.gold : P.ink;
  } else {
    status = '③ 今按已浮现（已稳定）';
    statusInk = P.qing;
  }
  ctx.fillStyle = statusInk;
  ctx.font = '11px "PingFang SC",sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(status, W - 44, 46);
  ctx.textAlign = 'left';

  /* —— 左半页：正文（世界文字） —— */
  const halfW = W / 2 - 44 - 14;
  const lx = 44, rx = W / 2 + 14;
  let ly = 84;

  ctx.fillStyle = P.inkMid;
  ctx.font = '10px "PingFang SC",sans-serif';
  ctx.fillText('世界文字（清末）', lx, ly); ly += 20;

  ctx.fillStyle = TYPE_LAYERS.world.ink;
  ctx.font = `${TYPE_LAYERS.world.size}px ${TYPE_LAYERS.world.font}`;
  ly += drawWrapped(ctx, sample().world, lx, ly, halfW, 26) ;
  ly += 24;

  ctx.fillStyle = P.inkMid;
  ctx.font = '10px "PingFang SC",sans-serif';
  ctx.fillText('玩家手迹（带朱印）', lx, ly); ly += 10;
  const handH = drawHandSample(ctx, sample().hand, lx, ly, halfW, 1);
  ly += handH + 22;

  /* —— 右半页：今按 —— */
  let ry = 84;
  ctx.fillStyle = P.inkMid;
  ctx.font = '10px "PingFang SC",sans-serif';
  ctx.fillText(`今按（后世之评 · ${current().type === 'quote' ? '引文型' : '名物型'}）`, rx, ry);
  ry += 20;

  const res = state.compare
    ? forceDraw(ctx, current(), { x: rx, y: ry, w: halfW })
    : drawAnnotation(ctx, current(), { x: rx, y: ry, w: halfW }, state.actionAt, now, state.timing);

  if (!res.drawn) {
    /* 空的落点：留一个虚线框 + 一句提示，把"还没到时间"这件事画出来 */
    ctx.save();
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = P.inkPale;
    ctx.strokeRect(rx + .5, ry + .5, halfW - 1, 96.5);
    ctx.setLineDash([]);
    ctx.fillStyle = P.inkPale;
    ctx.font = '11px "PingFang SC",sans-serif';
    ctx.fillText('— 这一处还空着。今按只在玩家动作之后出现。', rx + 12, ry + 30);
    ctx.fillText(`（${current().afterAction}）`, rx + 12, ry + 50);
    ctx.restore();
  }

  /* —— 页脚：时序条 —— */
  drawTimeline(now);

  /* 左边距的一行小字（只在对照模式显示，讲清"这七个轴"） */
  if (state.compare) {
    ctx.fillStyle = P.inkMid;
    ctx.font = '10px "PingFang SC",sans-serif';
    ctx.fillText('七个分离轴：字体／墨色／字号／起首／界行／纸底／时序　（+ 印：手迹有，今按无）', 44, H - 36);
  }
}

/** 强制按 alpha=1 画一遍（对照模式用）。 */
function forceDraw(g: CanvasRenderingContext2D, ann: Annotation, box: { x: number; y: number; w: number }) {
  return drawAnnotation(g, ann, box, 0, 1e6, { delayMs: 0, fadeMs: 0, steps: 1 });
}

/** 简易 CJK 折行（与 annotation.ts 同一策略），返回占用高度。 */
function drawWrapped(g: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number): number {
  let line = '', rows = 0;
  for (const ch of text) {
    if (g.measureText(line + ch).width > maxW && line) { g.fillText(line, x, y + rows * lineH); line = ch; rows++; }
    else line += ch;
  }
  if (line) { g.fillText(line, x, y + rows * lineH); rows++; }
  return rows * lineH;
}

/** 页脚时序条：动作 → 稍顿 → 浮现。 */
function drawTimeline(now: number): void {
  const y = H - 78, x0 = 44, x1 = W - 44;
  const total = state.timing.delayMs + state.timing.fadeMs;
  const span = Math.max(total * 1.35, 1200);
  const t = Math.max(0, now - state.actionAt);

  ctx.fillStyle = P.inkPale;
  ctx.fillRect(x0, y, x1 - x0, 1);

  const px1 = x0 + (x1 - x0) * Math.min(1, t / span);
  /* 稍顿段（动作 → 今按开始浮现） */
  const split = x0 + (x1 - x0) * (state.timing.delayMs / span);
  ctx.fillStyle = P.inkPale;
  ctx.fillRect(x0, y - 3, Math.max(0, split - x0), 7);
  /* 浮现段（阶梯淡入） */
  const fadeEnd = x0 + (x1 - x0) * Math.min(1.25, total / span);
  ctx.fillStyle = P.qing;
  ctx.fillRect(split, y - 3, Math.max(0, fadeEnd - split), 7);

  /* 游标 */
  ctx.fillStyle = P.zhu;
  ctx.fillRect(px1 - 1, y - 8, 2, 17);

  ctx.font = '10px "PingFang SC",sans-serif';
  ctx.fillStyle = P.inkMid;
  ctx.textAlign = 'left';
  ctx.fillText('玩家动作', x0, y + 22);
  ctx.fillText(`稍顿 ${state.timing.delayMs}ms`, split - 30, y + 22);
  ctx.textAlign = 'right';
  ctx.fillText(`阶梯浮现 ${state.timing.fadeMs}ms / ${state.timing.steps} 级`, x1, y + 22);
  ctx.textAlign = 'left';
}

/* ---------------------------------------------------------------------------
 * 实例列表
 * ------------------------------------------------------------------------- */
const listEl = document.getElementById('annList')!;
ANNOTATIONS.forEach((a, i) => {
  const li = document.createElement('li');
  li.innerHTML = `<b>${a.id}</b><span>${a.chapter}</span><em>${a.type === 'quote' ? '引文' : '名物'}</em>`
    + `<i>${a.type === 'quote' ? esc(a.attribution ?? '') : esc(a.body ?? '')}</i>`;
  li.addEventListener('click', () => {
    state.idx = i;
    [...Array.from(listEl.children)].forEach((c, j) => c.classList.toggle('on', j === i));
    replay();
    renderDetail();
  });
  if (i === 0) li.classList.add('on');
  listEl.append(li);
});

function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
}

/* ---------------------------------------------------------------------------
 * 详情面板
 * ------------------------------------------------------------------------- */
const detailEl = document.getElementById('annDetail')!;
function renderDetail(): void {
  const a = current();
  detailEl.innerHTML = `
    <dl>
      <dt>场号</dt><dd>${esc(a.id)}</dd>
      <dt>型</dt><dd>${a.type === 'quote' ? '引文型（引原句，必标人名+书名）' : '名物型（只正名、只交代沿革，不引文）'}</dd>
      ${a.quote ? `<dt>原句</dt><dd class="q">「${esc(a.quote)}」</dd>
      <dt>出处</dt><dd>${esc(a.attribution ?? '')}${a.edition ? `　<span class="warn">〔${esc(a.edition)}〕</span>` : ''}</dd>` : ''}
      ${a.body ? `<dt>正文</dt><dd>${esc(a.body)}</dd>` : ''}
      <dt>时序锚点</dt><dd>排在此动作之后：<b>${esc(a.afterAction)}</b></dd>
      ${a.note ? `<dt>为什么值钱</dt><dd class="note">${esc(a.note)}</dd>` : ''}
    </dl>`;
}

/* ---------------------------------------------------------------------------
 * 自检面板
 * ------------------------------------------------------------------------- */
function renderLint(): void {
  const findings = runAllChecks();
  const specs = ['规格1 时序在玩家之后', '规格2 不解题', '规格3 必标出处', '规格4 只给玩家', '规格5 与手迹分离'];
  const bySpec: Record<string, string[]> = {};
  for (const f of findings) (bySpec[f.spec] ??= []).push(`${f.level === 'error' ? '✕' : '!'} ${f.id}：${f.msg}`);

  const box = document.getElementById('lintBox')!;
  box.innerHTML = specs.map((s) => {
    const key = s.slice(0, 3);
    const items = bySpec[key] ?? [];
    const hasError = items.some((i) => i.startsWith('✕'));
    const cls = hasError ? 'bad' : items.length ? 'warnrow' : 'ok';
    const mark = hasError ? '✕' : items.length ? '!' : '✓';
    return `<div class="lintrow ${cls}"><b>${mark}</b><span>${s}</span>`
      + (items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : '<em>通过</em>')
      + '</div>';
  }).join('');

  document.getElementById('lintSummary')!.textContent =
    findings.length === 0 ? '全部通过' : `${findings.filter((f) => f.level === 'error').length} 处错误 · ${findings.filter((f) => f.level === 'warn').length} 处提示`;
}

/* ---------------------------------------------------------------------------
 * 字体探针：手迹用的楷体在不在？不在的话"分离"就只剩墨色一个轴。
 * ------------------------------------------------------------------------- */
function detectFont(family: string): boolean {
  const probe = '永和九年岁在癸丑';
  const c = document.createElement('canvas').getContext('2d')!;
  c.font = `32px ${family}`;
  const a = c.measureText(probe).width;
  c.font = `32px monospace`;
  const b = c.measureText(probe).width;
  return Math.abs(a - b) > 0.5;
}

function renderFontProbe(): void {
  const el = document.getElementById('fontProbe')!;
  const kai = detectFont(TYPE_LAYERS.hand.font);
  const song = detectFont(TYPE_LAYERS.world.font);
  el.innerHTML = `
    <div class="${kai ? 'ok' : 'bad'}"><b>${kai ? '✓' : '✕'}</b><span>手迹字体（楷体）可用</span><em>${esc(TYPE_LAYERS.hand.font.split(',')[0])}</em></div>
    <div class="${song ? 'ok' : 'bad'}"><b>${song ? '✓' : '✕'}</b><span>世界／今按字体（宋体）可用</span><em>${esc(TYPE_LAYERS.world.font.split(',')[0])}</em></div>`;
  if (!kai) {
    el.insertAdjacentHTML('afterend',
      '<p class="alert">⚠️ 这台机器没有楷体回退，手迹会退成宋体——「字体轴」失效，分离只剩墨色／字号／起印／界行／纸底／时序六个轴。仍需能辨认，但不是最佳状态。</p>');
  }
}

/* ---------------------------------------------------------------------------
 * 控件
 * ------------------------------------------------------------------------- */
function bindSlider(id: string, key: keyof AnnotTiming, fmt: (v: number) => string): void {
  const input = document.getElementById(id) as HTMLInputElement;
  const out = document.getElementById(id + 'Out')!;
  const sync = () => { out.textContent = fmt(Number(input.value)); };
  input.value = String(state.timing[key]);
  sync();
  input.addEventListener('input', () => {
    state.timing[key] = Number(input.value);
    sync();
    if (state.timing.delayMs + state.timing.fadeMs < 1) state.timing.fadeMs = 1;
  });
}

bindSlider('delayRange', 'delayMs', (v) => (v === TUNING.annotationDelayMs ? `${v} ms　（＝ TUNING 当前值）` : `${v} ms`));
bindSlider('fadeRange', 'fadeMs', (v) => `${v} ms`);
bindSlider('stepsRange', 'steps', (v) => `${v} 级`);

document.getElementById('replayBtn')!.addEventListener('click', replay);
document.getElementById('compareBtn')!.addEventListener('click', (e) => {
  state.compare = !state.compare;
  (e.currentTarget as HTMLElement).classList.toggle('on', state.compare);
  (e.currentTarget as HTMLElement).textContent = state.compare ? '对照模式 · 开' : '对照模式 · 关';
});
document.getElementById('resetTimingBtn')!.addEventListener('click', () => {
  state.timing = { ...DEFAULT_TIMING };
  (document.getElementById('delayRange') as HTMLInputElement).value = String(state.timing.delayMs);
  (document.getElementById('fadeRange') as HTMLInputElement).value = String(state.timing.fadeMs);
  (document.getElementById('stepsRange') as HTMLInputElement).value = String(state.timing.steps);
  ['delayRange', 'fadeRange', 'stepsRange'].forEach((id) => {
    const i = document.getElementById(id) as HTMLInputElement;
    i.dispatchEvent(new Event('input'));
  });
});
document.getElementById('tidyBtn')!.addEventListener('click', (e) => {
  const btn = e.currentTarget as HTMLElement;
  btn.classList.toggle('on');
  document.body.classList.toggle('tidy', btn.classList.contains('on'));
});

/* ---------------------------------------------------------------------------
 * 主循环
 * ------------------------------------------------------------------------- */
function loop(now: number): void {
  state.lastFrame = now;
  drawStage(now);

  /* 画布下方的数值回显（每帧更新 DOM 有点浪费，但这是实验场，值小） */
  const elapsed = now - state.actionAt;
  const alpha = annotationAlpha(state.actionAt, now, state.timing);
  const readout = document.getElementById('readout')!;
  readout.textContent = state.compare
    ? '对照模式：三层均 alpha = 1.00'
    : `elapsed ${Math.round(elapsed)} ms　·　今按 alpha = ${alpha.toFixed(2)}`
      + `　·　${alpha === 0 ? '（还在「稍顿」里——这正是规格 1 的执行）' : alpha < 1 ? '（阶梯浮现中）' : '（已稳定）'}`;

  requestAnimationFrame(loop);
}

/* ---------------------------------------------------------------------------
 * 启动
 * ------------------------------------------------------------------------- */
renderDetail();
renderLint();
renderFontProbe();
state.actionAt = performance.now();
/* 调试钩子：annotation-lab.html#show[=场号] → 直接看"今按已浮现"的稳定态
   （无头截图的虚拟时钟不推进 performance.now()，靠它才能截到后段）。 */
if (location.hash.startsWith('#show')) {
  state.actionAt = performance.now() - 1e6;
  const want = location.hash.slice(6);
  const at = ANNOTATIONS.findIndex((a) => a.id === want);
  if (at >= 0) {
    state.idx = at;
    Array.from(listEl.children).forEach((c, j) => c.classList.toggle('on', j === at));
    renderDetail();
  }
}
document.getElementById('sizesOut')!.textContent =
  `世界 ${TYPE_LAYERS.world.size}px ／ 手迹 ${TYPE_LAYERS.hand.size}px ／ 今按 ${TYPE_LAYERS.annote.size}px`;
document.getElementById('inksOut')!.textContent =
  `世界 ${TYPE_LAYERS.world.ink} ／ 手迹 ${TYPE_LAYERS.hand.ink} ／ 今按 ${TYPE_LAYERS.annote.ink}`;
void VIEW_W; void VIEW_H;
requestAnimationFrame(loop);
