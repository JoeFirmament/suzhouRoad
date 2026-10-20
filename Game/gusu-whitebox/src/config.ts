/** 全局调参表：所有 [PLACEHOLDER] 数值集中于此，纸面测试数据回填只改这一个文件。 */
export const TILE = 16;
export const MAP_W = 80;
export const MAP_H = 50;

export const VIEW_W = 960;
export const VIEW_H = 600;

export const TUNING = {
  moveSpeed: 64,            // px/s  [PLACEHOLDER] 手感反馈项①走路速度
  camLerp: 0.12,            // 镜头跟随插值 [PLACEHOLDER] 反馈项②跟不跟手
  viewTriggerRadius: 22,    // 取景触发半径 px
  stopBeatMs: 300,          // 合窗静默拍（signature moment）
  walkAnimFps: 8,
  pulsePeriodMs: 1400,      // 取景点光圈脉动周期
  homeInteractRadius: 27,   // 府学近物交互半径 px
  cornerTriggerRadius: 24,  // 堂后檐角拾遗触发半径 px
  albumStrokeMs: 260,       // 园谱归页每幅景落下的阶梯动画时长 ms

  // ——「今按」层浮现时序（《剧本文件规范》§2.6.3 规格 1：今按永远在玩家之后）——
  // 剧本里各章一致写作「落笔 → 页成 → 稍顿 → 今按浮出」；本键就是那个「稍顿」。
  // 2026-09-30：由 CH5 的 TUNING.wszAnnotationDelayMs 提升为通用键（CH5–CH9 连欠五章，终章乙幕整幕依赖它）。
  annotationDelayMs: 1000,  // [PLACEHOLDER] 玩家动作 → 今按浮现 之间的停顿 ms（建议区间 800–1200）
  annotationFadeMs: 260,    // 今按阶梯式淡入时长 ms（steps，走像素纪律；不是 CSS 缓动）
  annotationSteps: 4,       // 淡入阶梯数（像素纪律：位移/透明度只允许阶梯，不允许平滑插值）
} as const;

/** 定稿色板：来自四轮概念图迭代的美术基调。全管线共用，禁止资产色漂。 */
export const PALETTE = {
  paper: '#f2ead6',   // 宣纸底
  grass: '#bcd6a4',
  grassAlt: '#b3cf9b',
  path: '#e6dcc2',
  pathAlt: '#d8ceae',
  water: '#9ecfc9',
  waterHi: '#c2e0da',
  wall: '#fbf7ec',
  wallShade: '#d9d2c0',
  roof: '#b8b2a2',
  roofDark: '#a8a292',
  wood: '#8a6844',
  zhu: '#b03a2e',     // 朱红点睛（唯一重色）
  qing: '#3d7068',    // 青水/判定 UI
  rockTop: '#b0bfa8',
  rockBase: '#93a48c',
  rockDark: '#78876f',
  leafHi: '#9cc487',
  leafMid: '#8fbb78',
  leafDark: '#7fae6a',
  ink: '#2b2824',
  gold: '#c8a04b',
  // —— P0-1 色板增补 10 色（2026-09-27，色源：assets/palette/palette.json）——
  inkPale: '#a39d90',    // 淡墨
  inkMid: '#7e796d',     // 中墨
  inkHeavy: '#55524a',   // 重墨
  stele: '#171512',      // 碑墨（拓片最深）
  waterDeep: '#6fa89e',  // 水深
  qingDeep: '#2a514c',   // 深潭/夜水
  woodDark: '#6b4c2f',   // 木影
  zhuBright: '#d95543',  // 朱亮
  sealRed: '#8f271d',    // 印泥深红
  pine: '#5f7d4f',       // 松柏深叶
  // —— v3 风格基线增补 8 色（2026-09-28，参考小飞虹 2.5D 像素画：浓郁饱和基调）——
  roofChar: '#4e4c45',   // 瓦炭（坡面主色，深灰瓦）
  roofRidge: '#33322d',  // 脊墨
  waterTeal: '#5b9484',  // 饱和青绿水
  waterTealDeep: '#3c6e63', // 青绿深水
  waterGlow: '#a5cdb4',  // 水面波光
  leafSat: '#71b054',    // 饱和叶
  leafDeep: '#4c8a42',   // 深叶
  willow: '#8fc065',     // 柳黄
} as const;

/* ============================================================================
 * 「三层文字」唯一真源
 * ============================================================================
 * 《剧本文件规范》§2.6.3 规格 5 要求：今按「须用与手迹不同的字体/墨色」，
 * 玩家一眼可辨"这不是他写的"。
 *
 * 在此之前，白模里的字体是散落写死的（frameui.ts 硬编码 "Songti SC"、
 * story.css 硬编码面板色），**没有任何一处定义"手迹是什么样"**——
 * 故"与手迹分离"这条规则在工程上无法被检验。
 *
 * 本表把它变成可检验的：三层文字各有一行定义，同表即对照。
 * ⚠️ 任何页面不得再自行写死字体或墨色，一律引本表。
 * ⚠️ 字段刻意不开 `as const`（要 string/number 而非字面量类型），
 *    否则 annotation.ts 里的"两两必须不同"检查会被 TS 判成无重叠比较。
 * ========================================================================== */
export interface TypeLayer {
  /** CSS font-family 完整栈。 */
  font: string;
  /** 墨色（唯一色源 PALETTE 的键值）。 */
  ink: string;
  /** 字号 px。 */
  size: number;
  /** 行高倍数（今按用）。 */
  lineHeight?: number;
  /** 手迹专属：朱印色。 */
  seal?: string;
  /** 今按专属：起首二字。 */
  label?: string;
  /** 今按专属：起首二字的墨色。 */
  labelInk?: string;
  /** 今按专属：左侧界行色。 */
  rule?: string;
  /** 今按专属：贴条纸底。 */
  ground?: string;
}

export const TYPE_LAYERS: Record<'world' | 'hand' | 'annote', TypeLayer> = {
  /** 世界文字（清末故事层）：台词、匾额、题跋原文、诗卡正文。最"在场"的一层。 */
  world: {
    font: '"Songti SC","STSong","Noto Serif SC",serif',
    ink: PALETTE.ink,        // 焦墨 #2b2824
    size: 15,
  },
  /** 玩家手迹：玩家自己写的字（题跋、落款、抄联）。墨与正文同浓，但**是手写体**，且**必带朱印**。 */
  hand: {
    font: '"Kaiti SC","STKaiti","KaiTi","Noto Serif CJK SC",serif',
    ink: PALETTE.ink,        // 焦墨 #2b2824（同正文浓度——玩家写的字不打折）
    size: 16,
    seal: PALETTE.zhu,       // 朱印 #b03a2e（全作唯一重色）
  },
  /** 今按（后世之评）：不在世界观之内的一层。**七个分离信号**见 annotation.ts 文件头。 */
  annote: {
    font: '"Songti SC","STSong","Noto Serif SC",serif',  // 印刷体（"印"出来的，不是"写"出来的）
    ink: PALETTE.inkHeavy,   // 重墨 #55524a —— 比正文轻一档，不夺正文的权威
    size: 12,                // 小一号
    lineHeight: 1.75,
    label: '今按',           // 起首二字（规格 5）
    labelInk: PALETTE.inkMid,// 中墨 #7e796d
    rule: PALETTE.inkPale,   // 左侧界行 #a39d90（古籍版框界行的意译）
    ground: PALETTE.wall,    // 贴条纸底 #fbf7ec —— 比正文纸更亮更冷，"从别处来的一张纸"
  },
};

/** 今按层是否可在本页出现（供各页面自查）。今按只在"园谱/章末/终章乙幕"三处出现。 */
export const ANNOTE_HOSTS = ['journal', 'chapter-end', 'finale-act2'] as const;
export type AnnoteHost = (typeof ANNOTE_HOSTS)[number];
