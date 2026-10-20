/** CH3-09 的道具特写状态机；章节进度由外部入口与事件守卫控制。 */
export type LeafPhase = 'choose' | 'trial' | 'support' | 'write' | 'done';
export type LeafAction = 'old' | 'new' | 'test-ink' | 'hard-write' | 'take-board' | 'retry' | 'stroke';
export type LeafStudy = { phase: LeafPhase; strokes: number; oldLeafSeen: boolean; inkSeen: boolean };
export const INITIAL_LEAF_STUDY: LeafStudy = { phase: 'choose', strokes: 0, oldLeafSeen: false, inkSeen: false };

export function advanceLeafStudy(state: LeafStudy, action: LeafAction): { state: LeafStudy; line: string } {
  if (action === 'retry') return { state: INITIAL_LEAF_STUDY, line: '风吹过叶缘。再挑一片，从头试。' };
  if (state.phase === 'choose') {
    if (action === 'old') return { state: { ...state, oldLeafSeen: true }, line: '老叶边缘开了口；才握住叶柄，裂口又往里走了一寸。' };
    if (action === 'new') return { state: { ...state, phase: 'trial' }, line: '新叶韧，叶脉尚挺。你拣下这一片。' };
  }
  if (state.phase === 'trial' && action === 'test-ink') return {
    state: { ...state, phase: 'support', inkSeen: true },
    line: '笔尖一按，墨顺着叶脉洇开。这样写，记不住那句异文。',
  };
  if (state.phase === 'support') {
    if (action === 'hard-write') return { state, line: '叶面还在晃，墨痕散了。再用力只会划破它。' };
    if (action === 'take-board') return { state: { ...state, phase: 'write' },
      line: '墙根一块旧漆板。你把叶子铺平，板只稳住了手；墨能否留住，还得小心试。' };
  }
  if (state.phase === 'write' && action === 'stroke') {
    const strokes = Math.min(3, state.strokes + 1);
    return strokes === 3
      ? { state: { ...state, phase: 'done', strokes }, line: '末笔收住。你把叶边压平，夹进袖里，没有折。' }
      : { state: { ...state, strokes }, line: strokes === 1 ? '先从叶柄一侧落笔。笔势轻些。' : '墨迹还湿。余下的一处，别碰到刚写过的地方。' };
  }
  return { state, line: '' };
}
