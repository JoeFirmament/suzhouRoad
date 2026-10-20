/** 留园入口路线提示采样；漏采不能阻止玩家抵达歇桶处后的亲手放桶。 */
export const LIUYUAN_ALLEY_CHECKPOINTS = [
  { x: 520, y: 550, label: '前厅' },
  { x: 520, y: 480, label: '第一天井' },
  { x: 520, y: 400, label: '狭廊' },
  { x: 430, y: 400, label: '西折' },
  { x: 430, y: 374, label: '第二小庭' },
  { x: 430, y: 300, label: '北向窄廊' },
  { x: 430, y: 250, label: '古木交柯附近' },
] as const;

/** Shared chapter seam: the west threshold is reached on foot in both directions. */
export const LIUYUAN_ENTRY_COURT_EXIT = { x: 290, y: 232 } as const;

/** Story feet are fixed by CH3; an editor draft may reshape walls but must not strand them. */
export const LIUYUAN_ENTRY_REQUIRED_FEET = [
  { id: '门外', x: 520, y: 656, radius: 10, mustStand: true },
  { id: '门槛内', x: 520, y: 614, radius: 18 },
  ...LIUYUAN_ALLEY_CHECKPOINTS.map((foot) => ({ ...foot, id: foot.label, radius: 24,
    mustStand: foot.x === 430 && foot.y === 250 })),
  { id: '窗前', x: 420, y: 232, radius: 24 },
  { id: '西折小庭口', x: 340, y: 232, radius: 24 },
  { id: '古木交柯转场', ...LIUYUAN_ENTRY_COURT_EXIT, radius: 24, mustStand: true },
] as const;

export function advanceAlleyCheckpoint(index: number, x: number, y: number, radius = 24): number {
  const next = LIUYUAN_ALLEY_CHECKPOINTS[index];
  if (!next) return index;
  return Math.hypot(x - next.x, y - next.y) <= radius ? index + 1 : index;
}

export function alleyWalkComplete(index: number): boolean {
  return index >= LIUYUAN_ALLEY_CHECKPOINTS.length;
}

/** CH3-10 的逆行路线；复用同一游戏通路，不代表清末留园真实出门线路。 */
export const LIUYUAN_ALLEY_RETURN_CHECKPOINTS = [
  { x: 340, y: 232, label: '小庭西折口' },
  { x: 420, y: 232, label: '北墙窗前' },
  { x: 430, y: 250, label: '歇桶处' },
  { x: 430, y: 300, label: '北向窄廊' },
  { x: 430, y: 374, label: '第二小庭' },
  { x: 430, y: 400, label: '西折' },
  { x: 520, y: 400, label: '狭廊' },
  { x: 520, y: 480, label: '第一天井' },
  { x: 520, y: 550, label: '前厅' },
  { x: 520, y: 614, label: '门槛内' },
  { x: 520, y: 656, label: '门外' },
] as const;

export function advanceAlleyReturnCheckpoint(index: number, x: number, y: number, radius = 24): number {
  const next = LIUYUAN_ALLEY_RETURN_CHECKPOINTS[index];
  if (!next) return index;
  // 最后一步必须真正踏到门外街面；通用 24px 会让门槛内侧提前播出园对白。
  const effectiveRadius = index === LIUYUAN_ALLEY_RETURN_CHECKPOINTS.length - 1
    ? Math.min(radius, 10) : radius;
  return Math.hypot(x - next.x, y - next.y) <= effectiveRadius ? index + 1 : index;
}

export function alleyReturnComplete(index: number): boolean {
  return index >= LIUYUAN_ALLEY_RETURN_CHECKPOINTS.length;
}

/** End-of-route confirmation plus performed gate exchange, rather than a compulsory sampling order. */
export function canCompleteLiuyuanReturn(index: number, gateAnswered: boolean): boolean {
  return gateAnswered && alleyReturnComplete(index);
}
