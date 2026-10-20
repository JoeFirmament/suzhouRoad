/* ============================================================================
 * 「今按」层 —— 唯一渲染原语
 * ============================================================================
 * 依据：《剧本文件规范》v1.2 §2.6（v1.3 补 §2.6.7 终章尾幕例外）
 *
 * 今按＝**游戏正文里唯一允许出现"后世文字"的一层**。
 * 陈从周／刘敦桢／童寯等后世学人的话，一个字都不能进清末故事层的
 * 台词、题跋、旁白——但"不能用"不等于"不该用"。解法不是堵，是给它们一个
 * **标明年代、不在世界观之内**的容器。今按就是这个容器。
 *
 * ---------------------------------------------------------------------------
 * 七个"分离信号"（规格 5「玩家一眼可辨这不是他写的」的工程实现）
 * ---------------------------------------------------------------------------
 * 与 TYPE_LAYERS.hand（玩家手迹）逐项对照：
 *   1. 字体   手＝楷体（写出来的）  ／ 今按＝宋体（印出来的）
 *   2. 墨色   手＝焦墨 ink          ／ 今按＝重墨 inkHeavy（轻一档，不夺正文权威）
 *   3. 字号   手＝16px              ／ 今按＝12px（小一号）
 *   4. 起首   手＝无                ／ 今按＝「今按」二字（规格 5 明文要求）
 *   5. 界行   手＝无                ／ 今按＝左侧细竖线（古籍版框界行的意译）
 *   6. 纸底   手＝正文纸 paper      ／ 今按＝贴条纸 wall（更亮更冷——"从别处来的一张纸"）
 *   7. 时序   手＝玩家的即时动作    ／ 今按＝动作之后，还要再等 annotationDelayMs
 *             （规格 1 时序铁律；剧本里写作「落笔 → 页成 → 稍顿 → 今按浮出」）
 * 另：玩家手迹**必带朱印**（全作唯一重色），今按**绝无印**。
 *
 * ⚠️ 零新增颜色：本层全部复用 PALETTE 既有色（inkHeavy/inkMid/inkPale/zhu/paper/wall）。
 *
 * ---------------------------------------------------------------------------
 * 通道隔离（规格 4「只给玩家」）
 * ---------------------------------------------------------------------------
 * 今按 **不入 knowledge、不给 flag、不进园谱索引、不上《蘇城全圖》**。
 * 它是渲染层的一层，不是存档层的一项——见 assertChannelIsolated()。
 * ========================================================================== */

import { PALETTE as P, TUNING, TYPE_LAYERS } from '../config.js';
import { px, type Ctx } from './pixel.js';

/** 今按层的样式（带默认值，避免各处再写 `?? `）。 */
const A = {
  font: TYPE_LAYERS.annote.font,
  ink: TYPE_LAYERS.annote.ink,
  size: TYPE_LAYERS.annote.size,
  lineHeight: TYPE_LAYERS.annote.lineHeight ?? 1.75,
  label: TYPE_LAYERS.annote.label ?? '今按',
  labelInk: TYPE_LAYERS.annote.labelInk ?? TYPE_LAYERS.annote.ink,
  rule: TYPE_LAYERS.annote.rule ?? TYPE_LAYERS.annote.ink,
  ground: TYPE_LAYERS.annote.ground ?? P.wall,
};
/** 玩家手迹的样式（对照用）。 */
const HAND = {
  font: TYPE_LAYERS.hand.font,
  ink: TYPE_LAYERS.hand.ink,
  size: TYPE_LAYERS.hand.size,
  lineHeight: TYPE_LAYERS.hand.lineHeight ?? 1.6,
  seal: TYPE_LAYERS.hand.seal ?? P.zhu,
};

/* ----------------------------------------------------------------------------
 * 一、数据模型
 * ------------------------------------------------------------------------- */

/** 名物型＝只正名、只交代沿革，不引文；引文型＝引近现代学人原句。 */
export type AnnotationType = 'name' | 'quote';

export interface Annotation {
  /** 场号，同时是唯一 id。 */
  id: string;
  /** 归属章节（显示用）。 */
  chapter: string;
  type: AnnotationType;
  /**
   * 正文。
   * · 名物型：直接写正名/沿革文字。
   * · 引文型：写**转述**（可无）；原句放 quote。
   */
  body?: string;
  /**
   * 引文型必填：**原句，逐字不许改**（规格 3）。
   * 只放引号内的部分，本模块渲染时自动加「」。
   */
  quote?: string;
  /** 引文型必填：**人名 + 书名**（规格 3）。 */
  attribution?: string;
  /** 版本页码。查得到就写，查不到写 '待核'（规格 3）。 */
  edition?: string;
  /** 时序锚点：今按排在这件事**之后**（规格 1）。 */
  afterAction: string;
  /** 备注（为什么这一笔值钱——只给做游戏的人看，不渲染）。 */
  note?: string;
}

/* ----------------------------------------------------------------------------
 * 二、全作登记表（12 处 · 与规范 §2.6.6 全表逐条对应）
 * ----------------------------------------------------------------------------
 * ⚠️ 引文逐字照抄剧本，不得在代码里"顺一下"。
 * ⚠️ 引文源分布：陈从周 5 次（#2/4/6/8）／刘敦桢 1 次（#10，CH9 首次轮换）。
 *    CH9 起每章换人：刘敦桢 → 童寯 → 方志／碑刻。
 * ------------------------------------------------------------------------- */

export const ANNOTATIONS: readonly Annotation[] = [
  /* —— 1 —— */
  {
    id: 'CH4-13', chapter: 'CH4 狮子林', type: 'name',
    body: '此园后来屡易其主。民国六年（1917）重修后，冠回「狮子林」旧名。',
    afterAction: '玩家画完狮子林那一页（园态 complete）',
    note: '全作"今按 · 名物型"首例。此前只叫"章末知识条"，v1.2 纳入统一体例。',
  },
  /* —— 2 —— 引文型首例 */
  {
    id: 'CH5-09', chapter: 'CH5 网师园', type: 'quote',
    quote: '白本非色，而色自生；池水无色，而色最丰。色中求色，不如无色中求色。',
    attribution: '陈从周《园林清议》',
    edition: '待核',
    afterAction: '玩家在园谱页脚题完那一行（三句白话之一）',
    note: '玩家刚用白话说了同一件事；一百年前陈从周用文言说了同一件事。'
      + '这不是"玩家说得笨、专家说得好"——是隔了一百年，两个人想到了一处。'
      + '⚠️ 该段亦常被引作《说园》语，原书未调阅，书名归属待定。',
  },
  /* —— 3 —— */
  {
    id: 'CH5-11', chapter: 'CH5 网师园', type: 'name',
    body: '后世叫网师园。',
    afterAction: '`wangshi` → `complete`（回府学）',
    note: '与园谱页正题「苏邻小筑／网师园」并列写法配套——两个名字并排，是本章"名实"主题的收口。',
  },
  /* —— 4 —— */
  {
    id: 'CH6-11', chapter: 'CH6 环秀山庄', type: 'quote',
    quote: '环秀山庄假山，允称上选，叠山之法具备。造园者不见此山，正如学诗者未见李杜。',
    attribution: '陈从周《苏州环秀山庄》',
    edition: '待核',
    afterAction: '玩家自己认出那是太湖林屋洞、并在园谱页下题完一行',
    note: '对府学学子，这句话的重量是双重的：他读的诗书里李杜是标准，'
      + '而现在有人把一座山放进了那个标准里。',
  },
  /* —— 5 —— */
  {
    id: 'CH6-13', chapter: 'CH6 环秀山庄', type: 'name',
    body: '堂上那四个字，后来成了这座园的名字。',
    afterAction: '`huanxiu` → `complete`（回府学）',
    note: '园名三层：俗名「汪园」／园名「颐园」／堂额「环秀山庄」。'
      + '后世用来叫这座园的那四个字，就明明白白挂在堂上，可它不是园名。',
  },
  /* —— 6 —— */
  {
    id: 'CH7-11', chapter: 'CH7 耦园', type: 'quote',
    quote: '「以楼环园，以水环楼」，此我品耦园之论。',
    attribution: '陈从周〈怡园与耦园〉',
    edition: '待核',
    afterAction: '玩家在园谱那一页题完一行（三句之一）',
    note: '不点破"太极"是 2002 年的事（规格 2：今按不解题）。',
  },
  /* —— 7 —— */
  {
    id: 'CH7-13', chapter: 'CH7 耦园', type: 'name',
    body: '这园子从前叫「涉园」——「园日涉以成趣」。后来沈氏扩成一宅两园，改名「耦园」。',
    afterAction: '`ouyuan` → `complete`（回府学）',
    note: '与 CH5（两个名字并排）、CH9（一块石头五个名字）构成"名"的三连收束。',
  },
  /* —— 8 —— */
  {
    id: 'CH8-12', chapter: 'CH8 退思园', type: 'quote',
    quote: '任氏退思园于江南园林中独辟蹊径，具贴水园之特例。山、亭、馆、廊、轩、榭等皆紧贴水面，园如出水上。……余谓之大园宜依水，小园重贴水。',
    attribution: '陈从周《说园》',
    edition: '待核',
    afterAction: '玩家题完自己那一行（与阿槿两种纸并排贴在同一页）',
    note: '前三次是后人评论这座园；这一次是后人给这座园起了一个类型名——「贴水园」。'
      + '陈从周说的是"这座园属于哪一类"，而玩家已经越过了这一层——他看见的是"外面还有什么"。'
      + '今按比玩家慢一步。',
  },
  /* —— 9 —— */
  {
    id: 'CH8-13', chapter: 'CH8 退思园', type: 'name',
    body: '刘敦桢收了十五座园，全在城里；退思园不在其中。',
    afterAction: '`tuisi` → `complete`（回府学）',
    note: '九园唯一在城外的一座。',
  },
  /* —— 10 —— 引文型首次轮换 */
  {
    id: 'CH9-12', chapter: 'CH9 艺圃', type: 'quote',
    quote: '布局简练开朗，池岸低平，水面集中，无壅塞局促之感，风格自然朴质，较多地保存了建园初期的规制。',
    attribution: '刘敦桢《苏州古典园林》',
    edition: '待核（据多方转引）',
    afterAction: '玩家在画页上一笔一笔擦到只剩水·墙·山',
    note: '⭐ CH5–CH8 连续四次引文型都是陈从周，CH9 换成刘敦桢。'
      + '理由不是"该换了"，是"这一章换得动"：艺圃在刘敦桢十五处实例之内（第八），退思园不在。'
      + '内容上巧合极准——刘敦桢说的「池岸低平／水面集中」正是玩家刚刚擦剩的那三样。',
  },
  /* —— 11 —— */
  {
    id: 'CH9-13', chapter: 'CH9 艺圃', type: 'name',
    body: '醉颖堂 → 药圃 → 敬亭山房（颐圃）→ 艺圃 → 七襄公所。一块石头，五个名字，前后三百年。',
    afterAction: '`yipu` → `complete`（回府学，第一部三页齐）',
    note: '第一部的答案是：名字是一层一层加上去的，而最后留下的往往是最不起眼的那个。',
  },
  /* —— 12 —— 整幕今按（规范 §2.6.7 例外） */
  {
    id: 'finale-act2', chapter: '终章 · 乙幕', type: 'quote',
    quote: '没有哪些园林比历史名城苏州的园林更能体现出中国古典园林设计的理想品质。咫尺之内再造乾坤，苏州园林被公认是实现这一设计思想的典范。',
    attribution: 'UNESCO 世界遗产委员会（1997，那不勒斯）',
    edition: '世界遗产名录 · 苏州古典园林',
    afterAction: '甲幕玩家落款、第十张空页按下取景匣之后',
    note: '⭐ 整幕皆今按——规范 §2.6.7 的例外，不是越界，是这一层的终点。'
      + '本幕里主角不在场、NPC 不出现、不入 knowledge、不给 flag、不进园谱、不上《蘇城全圖》。',
  },
];

export function findAnnotation(id: string): Annotation | undefined {
  return ANNOTATIONS.find((a) => a.id === id);
}

/* ----------------------------------------------------------------------------
 * 三、浮现时序（规格 1：今按永远在玩家之后）
 * ------------------------------------------------------------------------- */

/**
 * 浮现时序参数。默认取 `TUNING`，但可注入——
 * 这是给「今按实验场」用的：白模期要能现场把 `annotationDelayMs` 调出
 * 手感来（`TUNING` 是 `as const`，不可变）。正式运行一律用默认值。
 */
export interface AnnotTiming {
  /** 玩家动作 → 今按浮现 之间的停顿（那个「稍顿」）。 */
  delayMs: number;
  /** 阶梯式淡入时长。 */
  fadeMs: number;
  /** 淡入阶梯数。 */
  steps: number;
}

export const DEFAULT_TIMING: AnnotTiming = {
  delayMs: TUNING.annotationDelayMs,
  fadeMs: TUNING.annotationFadeMs,
  steps: TUNING.annotationSteps,
};

/**
 * 今按的可见度 0→1（阶梯式，走像素纪律）。
 * @param actionAt 玩家完成那个动作的时刻（rAF timeStamp, ms）
 * @param now      当前帧时刻
 * @param timing   时序参数（默认取 TUNING）
 *
 * elapsed < delayMs  → 返回 0（**这就是那个「稍顿」**）
 * 之后按 fadeMs 分成 steps 级跳上去。
 */
export function annotationAlpha(
  actionAt: number,
  now: number,
  timing: AnnotTiming = DEFAULT_TIMING,
): number {
  const elapsed = now - actionAt;
  if (elapsed < timing.delayMs) return 0;
  const t = Math.min(1, (elapsed - timing.delayMs) / Math.max(1, timing.fadeMs));
  return Math.round(t * timing.steps) / timing.steps;
}

/** 是否已过「稍顿」（供页面判断要不要开始画）。 */
export function annotationVisible(actionAt: number, now: number, timing: AnnotTiming = DEFAULT_TIMING): boolean {
  return annotationAlpha(actionAt, now, timing) > 0;
}

/** 「稍顿」还剩多少毫秒（供实验场做倒计时演示）。 */
export function annotationCountdown(actionAt: number, now: number, timing: AnnotTiming = DEFAULT_TIMING): number {
  return Math.max(0, timing.delayMs - (now - actionAt));
}

/* ----------------------------------------------------------------------------
 * 四、绘制
 * ------------------------------------------------------------------------- */

export interface AnnotationBox {
  x: number;
  y: number;
  /** 可用宽度（含界行与内边距） */
  w: number;
  /** 文字左右内边距 */
  pad?: number;
}

export interface AnnotationDrawResult {
  /** 本块实际占用的高度（供调用方往下排）。 */
  height: number;
  /** alpha 为 0 时未画任何东西。 */
  drawn: boolean;
}

/* CJK 友好折行：逐字量宽，不按空格切（中文没有词间空格）。 */
function wrap(g: Ctx, text: string, maxW: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const ch of text) {
    const probe = line + ch;
    if (g.measureText(probe).width > maxW && line) {
      lines.push(line);
      line = ch;
    } else {
      line = probe;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * 画一条今按。
 *
 * @param g        画布上下文
 * @param ann      今按数据
 * @param box      落点（左上角 + 可用宽）
 * @param actionAt 玩家的动作时刻（时序锚点）
 * @param now      当前帧时刻
 * @param timing   时序参数（默认取 TUNING；实验场可注入）
 */
export function drawAnnotation(
  g: Ctx,
  ann: Annotation,
  box: AnnotationBox,
  actionAt: number,
  now: number,
  timing: AnnotTiming = DEFAULT_TIMING,
): AnnotationDrawResult {
  const alpha = annotationAlpha(actionAt, now, timing);
  if (alpha <= 0) return { height: 0, drawn: false };

  const pad = box.pad ?? 14;
  const textW = box.w - pad * 2;
  const lineH = A.size * A.lineHeight;

  /* —— 排版预演：先量出高度，再决定贴条纸底多大 —— */
  g.font = `${A.size}px ${A.font}`;
  const bodyLines = ann.body ? wrap(g, ann.body, textW) : [];
  const quoteLines = ann.quote ? wrap(g, `「${ann.quote}」`, textW) : [];
  const srcLines: string[] = [];
  if (ann.attribution) {
    g.font = `${A.size - 1}px ${A.font}`;
    srcLines.push(...wrap(g, `— ${ann.attribution}${ann.edition ? `〔${ann.edition}〕` : ''}`, textW));
  }

  const h = pad * 2
    + lineH                                            // 「今按」起首行
    + (bodyLines.length + quoteLines.length) * lineH
    + (srcLines.length ? 6 + srcLines.length * (lineH - 4) : 0);

  g.save();
  g.globalAlpha = alpha;

  /* —— 6. 贴条纸底：比正文纸更亮更冷 —— */
  px(g, box.x, box.y, box.w, h, A.ground);
  /* —— 5. 左侧界行（古籍版框界行）—— */
  px(g, box.x, box.y, 2, h, A.rule);

  /* —— 4. 起首「今按」二字 —— */
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  g.fillStyle = A.labelInk;
  g.font = `${A.size - 1}px ${A.font}`;
  g.fillText(A.label, box.x + pad, box.y + pad + A.size - 1);

  let cursorY = box.y + pad + lineH + A.size - 1;

  /* —— 2. 墨色：重墨，轻正文一档 —— */
  g.fillStyle = A.ink;
  g.font = `${A.size}px ${A.font}`;
  for (const l of bodyLines) { g.fillText(l, box.x + pad, cursorY); cursorY += lineH; }
  for (const l of quoteLines) { g.fillText(l, box.x + pad, cursorY); cursorY += lineH; }

  /* —— 3. 出处行：更淡一档 —— */
  if (srcLines.length) {
    cursorY += 6;
    g.fillStyle = A.labelInk;
    g.font = `${A.size - 1}px ${A.font}`;
    for (const l of srcLines) { g.fillText(l, box.x + pad, cursorY); cursorY += lineH - 4; }
  }

  g.restore();
  return { height: h, drawn: true };
}

/**
 * 玩家手迹的对照渲染（**只为校验"分离"而存在**，不是今按的一部分）。
 * 它是"另一层"长什么样子的活标本：楷体 + 焦墨 + 朱印 + 无界行 + 浸在正文纸上。
 */
export function drawHandSample(g: Ctx, text: string, x: number, y: number, w: number, alpha = 1): number {
  const pad = 14, lineH = HAND.size * HAND.lineHeight;
  g.save();
  g.globalAlpha = alpha;
  g.font = `${HAND.size}px ${HAND.font}`;
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  const lines = wrap(g, text, w - pad * 2);
  const h = pad * 2 + lines.length * lineH;
  px(g, x, y, w, h, P.paper);            // 手迹浸在正文纸上（今按是"贴上去的另一张纸"）
  g.fillStyle = HAND.ink;
  let cy = y + pad + HAND.size;
  for (const l of lines) { g.fillText(l, x + pad, cy); cy += lineH; }
  /* 朱印：玩家手迹的身份标记，今按没有这个 */
  px(g, x + w - pad - 14, y + 6, 14, 14, HAND.seal);
  g.restore();
  return h;
}

/* ----------------------------------------------------------------------------
 * 五、五条硬规格的自检（规格 2／3／4／5 可机器检查的部分）
 * ------------------------------------------------------------------------- */

export type LintLevel = 'error' | 'warn';
export interface LintFinding { level: LintLevel; spec: string; msg: string; id: string }

/** 规格 2「今按不解题」：这组词一旦出现，就等于替玩家下了结论。 */
const FORBIDDEN_EVALUATIVE = [
  '因此', '这说明', '证明了', '可见', '正确答案', '你应该',
  '震撼', '了不起', '绝妙', '可惜', '可惜了',
];

export function lintAnnotation(ann: Annotation): LintFinding[] {
  const out: LintFinding[] = [];
  const push = (level: LintLevel, spec: string, msg: string) =>
    out.push({ level, spec, msg, id: ann.id });

  /* 规格 1 —— 时序锚点必须写明 */
  if (!ann.afterAction.trim()) push('error', '规格1', '缺 afterAction：今按必须写明排在玩家哪个动作之后。');

  /* 规格 3 —— 引文型必须标出处；原句与转述分开 */
  if (ann.type === 'quote') {
    if (!ann.quote) push('error', '规格3', '引文型缺 quote（原句）。');
    if (!ann.attribution) push('error', '规格3', '引文型缺 attribution（人名 + 书名）。');
    if (!ann.edition) push('warn', '规格3', '缺 edition（版本页码）——须填或填「待核」。');
  }
  if (ann.type === 'name' && ann.quote) {
    push('error', '规格3', '名物型不许引文（引文型才是引文的容器）。');
  }

  /* 规格 2 —— 不解题：不出现评价/解释词。
     ⚠️ 只查 body（我们写的那部分）；quote 是原文，逐字不许动，故豁免。 */
  const scan = ann.body ?? '';
  for (const w of FORBIDDEN_EVALUATIVE) {
    if (scan.includes(w)) push('warn', '规格2', `body 出现评价/解释词「${w}」——今按是回声不是解答。`);
  }

  return out;
}

/**
 * 规格 4「只给玩家」的通道守卫。
 * 今按是渲染层的一层，**不是存档层的一项**。
 * 调用方可传入任何"世界内可见"的集合来确认今按 id 没有渗进去。
 */
export const ANNOTE_FORBIDDEN_CHANNELS = [
  'progress.knowledge',   // 见闻（园谱知识条）
  'progress.storyFlags',  // 剧情旗标
  'gardenAlbum.index',    // 园谱索引
  'suchengMap',           // 《蘇城全圖》
] as const;

export function assertChannelIsolated(seenInWorld: readonly string[]): LintFinding[] {
  const ids = new Set(ANNOTATIONS.map((a) => a.id));
  const leaked: LintFinding[] = [];
  for (const s of seenInWorld) {
    if (ids.has(s)) {
      leaked.push({
        level: 'error', spec: '规格4', id: s,
        msg: `今按 id「${s}」出现在世界内通道——今按只给玩家，不入 knowledge／flag／园谱／《蘇城全圖》。`,
      });
    }
  }
  return leaked;
}

/** 规格 5「与手迹分离」的结构性检查：三层文字的字体/墨色必须两两不同。 */
export function checkLayerSeparation(): LintFinding[] {
  const out: LintFinding[] = [];
  const push = (msg: string) => out.push({ level: 'error', spec: '规格5', id: 'TYPE_LAYERS', msg });

  const { world, hand, annote } = TYPE_LAYERS;

  if (hand.font === annote.font) push('手迹与今按用了同一字体 —— 分离失败（字体是一个轴）。');
  if (hand.ink === annote.ink) push('手迹与今按用了同一墨色 —— 分离失败（墨色是一个轴）。');
  if (hand.size === annote.size) push('手迹与今按字号相同 —— 今按须是"小字"。');
  if (!hand.seal) push('玩家手迹缺朱印 —— 印是手迹的身份标记。');
  if (annote.seal) push('今按带了印 —— 今按绝无印（印属于手迹，不属于后世之评）。');
  if (!annote.label) push('今按缺起首二字（规格 5 明文要求以「今按」起首）。');
  if (!annote.rule) push('今按缺左侧界行（与手迹的视觉分离少一个轴）。');
  if (!annote.ground) push('今按缺贴条纸底。');
  if (annote.ground === P.paper) push('今按纸底与正文纸相同 —— 贴条纸底应更亮更冷。');
  if (annote.size >= world.size) push('今按字号未小于正文 —— 古籍按语是小字。');

  return out;
}

/** 一次性跑完全部自检（页面/CI 可用）。 */
export function runAllChecks(): LintFinding[] {
  return [
    ...ANNOTATIONS.flatMap(lintAnnotation),
    ...checkLayerSeparation(),
  ];
}
