/** Research-only logic. Window positions follow a source-described relationship,
 * but this is not an authenticated Qing-late room layout or CH3 quest state. */
export type WindowStudyView = 'west' | 'middle' | 'east';
export interface WindowStudyState {
  inspected: ReadonlySet<WindowStudyView>;
  solved: boolean;
}
export interface WindowStudyResult {
  state: WindowStudyState;
  line: string;
  kind: 'observation' | 'need-comparison' | 'wrong' | 'solved';
}

export const WINDOW_STUDY_X: Readonly<Record<WindowStudyView, number>> = {
  west: 123, middle: 480, east: 843,
};
export const WINDOW_STUDY_ORDER: readonly WindowStudyView[] = ['west', 'middle', 'east'];

export function newWindowStudy(): WindowStudyState {
  return { inspected: new Set<WindowStudyView>(), solved: false };
}

export function nearestWindow(x: number): WindowStudyView {
  return WINDOW_STUDY_ORDER.reduce((best, view) =>
    Math.abs(x - WINDOW_STUDY_X[view]) < Math.abs(x - WINDOW_STUDY_X[best]) ? view : best,
  'middle' as WindowStudyView);
}

export function inspectWindow(state: WindowStudyState, view: WindowStudyView): WindowStudyResult {
  const inspected = new Set(state.inspected); inspected.add(view);
  const line = view === 'middle'
    ? '中窗的边多折了两角。藤影搭在石上，蕉叶不在这里。'
    : view === 'east'
      ? '这扇也是六角。窗后细竿有节，叶窄，风过时一齐低头。'
      : '这扇同样六角。窗后叶片阔大，一根主脉把它分成两半。';
  return { state: { inspected, solved: state.solved }, line, kind: 'observation' };
}

export function noteWindow(state: WindowStudyState, view: WindowStudyView): WindowStudyResult {
  if (state.solved) return { state, line: '纸角已记下那扇窗。你还可以回身重新看。', kind: 'solved' };
  if (state.inspected.size < 3) {
    return { state, line: '纸上三道窗影还差一处。再走几步，别只认窗框。', kind: 'need-comparison' };
  }
  if (view === 'middle') {
    return { state, line: '中间的石与藤只帮你认方向；纸上缺的是两侧的一片叶。', kind: 'wrong' };
  }
  if (view === 'east') {
    return { state, line: '这一侧叶细，竿有节。纸角上那道阔叶脉不在这里。', kind: 'wrong' };
  }
  return {
    state: { inspected: state.inspected, solved: true },
    line: '两扇六角窗并无高下；不同的是窗后的竹与蕉。你在纸上记下蕉影，实际去路仍要绕院寻找。',
    kind: 'solved',
  };
}
