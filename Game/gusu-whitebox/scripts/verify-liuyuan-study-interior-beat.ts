import { advanceInteriorBeat, INITIAL_INTERIOR_BEAT, resumeInteriorBeat } from '../src/core/liuyuan-study-interior-beat.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const earlyAnswer = advanceInteriorBeat(INITIAL_INTERIOR_BEAT, 'search');
assert(earlyAnswer.beat.phase === 'silent', '未与人照面不得先答话');
const greeting = advanceInteriorBeat(INITIAL_INTERIOR_BEAT, 'greet');
assert(greeting.beat.phase === 'choice', '走近抄书人应触发开口');
assert(advanceInteriorBeat(greeting.beat, 'greet').line === null, '开口不能逐帧重复');
for (const answer of ['search', 'wrong'] as const) {
  const arrival = advanceInteriorBeat(greeting.beat, answer);
  assert(arrival.line?.includes('送完粥'), '两种开场都须交代送粥，人物不能无端知道空桶');
  let beat = arrival.beat;
  assert(beat.phase === 'explore' && beat.answer === answer, '两种回答都进入探索');
  const read = advanceInteriorBeat(beat,'desk');
  assert(!!read.line && read.line.includes('移步景异') && read.line.includes('景同')
    && read.line.includes('不能断定'), '案前观察须给出具体异文，不替玩家判断正确版本');
  assert(advanceInteriorBeat(beat, 'return').beat.phase === 'explore', '未看物件不得提前收尾');
  beat = advanceInteriorBeat(beat, 'desk').beat;
  const directRequest = advanceInteriorBeat(beat, 'return');
  assert(directRequest.beat.phase === 'paper-paused' && !!directRequest.line && directRequest.line.includes('核一核'),
    '看见异文后即可听到核本托付，不强制第一次窗边打卡');
  beat = advanceInteriorBeat(beat, 'shelf').beat;
  assert(!beat.windowSeen, '书架不能代替窗外观察');
  beat = advanceInteriorBeat(beat, 'window').beat;
  const end = advanceInteriorBeat(beat, 'return');
  assert(end.beat.phase === 'paper-paused' && !!end.line && end.line.includes('府学') && end.line.includes('核一核'),
    '看过案头返回人物应在同一次交谈听到核本托付与卷纸动作');
  const paper = end;
  assert(advanceInteriorBeat(paper.beat, 'return').beat.phase === 'paper-paused', '等候不能越过纸的选择');
  for (const paperAnswer of ['paper-ask', 'paper-wait'] as const) {
    const rule = advanceInteriorBeat(paper.beat, paperAnswer);
    assert(rule.beat.phase === 'paper-rule' && !!rule.line, '两种应答都只听见纸与话的矛盾');
    assert(rule.line.includes('得照数还回去'), '纸稿留在案上须来自具体人物责任');
    assert(!rule.line.includes('芭蕉'), '寒士台词不能直接说出叶的解法');
    assert(advanceInteriorBeat(rule.beat, 'return').beat.phase === 'paper-rule', '不看窗不能收束第二拍');
    const leaf = advanceInteriorBeat(rule.beat, 'window');
    assert(leaf.beat.phase === 'paper-window', '玩家要亲到窗边看新叶');
    const quiet = advanceInteriorBeat(leaf.beat, 'return');
    assert(quiet.beat.phase === 'paper-end' && !!quiet.line, '看叶后返回人物才听到空桶句');
    assert(advanceInteriorBeat(quiet.beat, 'return').beat.phase === 'paper-end', '重看不重复推进第二拍');
  }
  assert(advanceInteriorBeat(end.beat, 'reset').beat.phase === 'silent', '重置应清临时状态');
}
assert(Object.keys(INITIAL_INTERIOR_BEAT).length === 4, '研究状态不能携带章节旗标');
assert(resumeInteriorBeat(false, false).phase === 'silent', '独立研究和空白章节从开场开始');
assert(resumeInteriorBeat(true, false).phase === 'choice', '已见抄书人刷新后从应答处继续');
const resumedTrouble = resumeInteriorBeat(true, true);
assert(resumedTrouble.phase === 'paper-rule' && !resumedTrouble.windowSeen,
  '已知纸张处境不证明已发现新叶，旧档恢复不可提前收束');
assert(advanceInteriorBeat(resumedTrouble, 'return').beat.phase === 'paper-rule',
  '恢复后的章流不得重播卷纸选择或再次推进');
console.log('留园书斋内景：人物触发、双回答、案头异文、核本托付、可选初看窗、卷纸再放、窗边回看与重置通过。');

assert(resumeInteriorBeat(true, true, true).phase === 'paper-end', '已实际开始题叶的旧档仍可返回题叶，不必重演发现');
