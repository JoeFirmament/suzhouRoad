import { advanceStudyCourtBeat, INITIAL_STUDY_COURT_BEAT, resumeStudyCourtBeat } from '../src/core/liuyuan-study-court-beat.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const premature = advanceStudyCourtBeat(INITIAL_STUDY_COURT_BEAT, 'knock');
assert(!premature.beat.heard && premature.line === null, '未听到门内动静时不能先触发叩门剧情');

const first = advanceStudyCourtBeat(INITIAL_STUDY_COURT_BEAT, 'hear');
assert(first.beat.heard && first.line !== null, '接近门时应只触发一次纸声');
const repeatedCue = advanceStudyCourtBeat(first.beat, 'hear');
assert(repeatedCue.line === null, '站在门前不能每帧重复播报纸声');

const listen = advanceStudyCourtBeat(first.beat, 'listen');
assert(listen.beat.choice === 'listen' && !!listen.line, '先听应有独立反馈');
const knock = advanceStudyCourtBeat(listen.beat, 'knock');
assert(knock.beat.choice === 'knock' && !!knock.line, '叩门应可在先听之后重试');
assert(advanceStudyCourtBeat(knock.beat, 'listen').beat.choice === 'listen', '两个选择应可反复切换');

const reset = advanceStudyCourtBeat(knock.beat, 'reset');
assert(!reset.beat.heard && reset.beat.choice === null, '回到院中应清除本幕临时剧情状态');
assert(Object.keys(reset.beat).length === 2, '研究切片状态不应携带章节旗标');
assert(!resumeStudyCourtBeat(false).heard, '独立研究及未叩门章节仍须先听声');
const resumedKnock = resumeStudyCourtBeat(true);
assert(resumedKnock.heard && resumedKnock.choice === 'knock',
  '书斋已发现，刷新后须保留门已轻叩的章节结果');
console.log('书斋院纸声／听或叩门：首次触发、选择阻断、反复选择和重置通过。');
