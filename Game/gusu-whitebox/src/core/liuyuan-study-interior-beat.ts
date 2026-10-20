import { readLiuyuanVariant } from './liuyuan-text-variant.js';
export type InteriorAnswer = 'search' | 'wrong';
export type InteriorPaperAnswer = 'paper-ask' | 'paper-wait';
export type InteriorPhase = 'silent' | 'choice' | 'explore' | 'farewell'
  | 'paper-paused' | 'paper-rule' | 'paper-window' | 'paper-end';
export type InteriorBeat = {
  phase: InteriorPhase;
  answer: InteriorAnswer | null;
  deskSeen: boolean;
  windowSeen: boolean;
};
export type InteriorAction = 'greet' | InteriorAnswer | InteriorPaperAnswer
  | 'desk' | 'window' | 'shelf' | 'return' | 'reset';

export const INITIAL_INTERIOR_BEAT: InteriorBeat = {
  phase: 'silent', answer: null, deskSeen: false, windowSeen: false,
};

/** Resume only committed chapter milestones; unfinished local dialogue may be replayed. */
export function resumeInteriorBeat(scholarMet: boolean, troubleKnown: boolean, leafStarted = false): InteriorBeat {
  if (scholarMet && troubleKnown)
    return leafStarted
      ? { phase: 'paper-end', answer: null, deskSeen: true, windowSeen: true }
      : { phase: 'paper-rule', answer: null, deskSeen: true, windowSeen: false };
  if (scholarMet) return { phase: 'choice', answer: null, deskSeen: false, windowSeen: false };
  return { ...INITIAL_INTERIOR_BEAT };
}

export function advanceInteriorBeat(
  beat: InteriorBeat, action: InteriorAction,
): { beat: InteriorBeat; line: string | null } {
  if (action === 'reset') return { beat: INITIAL_INTERIOR_BEAT, line: null };
  if (action === 'greet') return beat.phase === 'silent'
    ? { beat: { ...beat, phase: 'choice' }, line: '他笔没停，也没回头：“门别关。”' }
    : { beat, line: null };
  if (action === 'search' || action === 'wrong') {
    if (beat.phase !== 'choice') return { beat, line: null };
    return { beat: { ...beat, phase: 'explore', answer: action },
      line: action === 'search'
        ? '“我从府学来，刚给花房送完粥，想找一位看书的人。”他把笔稍稍抬起：“粥到了就好。找人？先看看这一行，别碰纸。风要起了。”'
        : '“我从府学来，给花房送完粥，似乎走错了。”他仍看着纸：“搁花房就好。路没有白走，进来歇一歇。别碰案上的纸。”' };
  }
  if (action === 'paper-ask' || action === 'paper-wait') {
    if (beat.phase !== 'paper-paused') return { beat, line: null };
    return { beat: { ...beat, phase: 'paper-rule' },
      line: action === 'paper-ask'
        ? '“借我带回去核本？”他把纸按平：“这稿是借来校的，得照数还回去。园里的纸，出了这道门就算数。园里的话，出了这道门就不算数。得写在不算数的地方。”'
        : '你没有伸手接。他把纸按平：“这稿是借来校的，得照数还回去。园里的纸，出了这道门就算数。园里的话，出了这道门就不算数。得写在不算数的地方。”' };
  }
  if (beat.phase === 'paper-paused') return { beat,
    line: action === 'return' ? '卷好的纸还按在他手下。他像在等你问，也像在等你不问。' : null };
  if (beat.phase === 'paper-rule') {
    if (action === 'window') return { beat: { ...beat, phase: 'paper-window', windowSeen: true },
      line: '窗外一片新叶没有裂口。风一过，叶背翻成浅色。' };
    if (action === 'desk' || action === 'shelf') return { beat,
      line: '纸仍在案上。屋里能写的东西一样也不缺。' };
    return { beat, line: '他没有再说解法，只把视线移向窗外。' };
  }
  if (beat.phase === 'paper-window') return action === 'return'
    ? { beat: { ...beat, phase: 'paper-end' }, line: '他又低头抄书：“核过再说。你回去的时候，桶还是空的。”' }
    : { beat, line: action === 'window' ? '叶子仍在窗外，风让它轻轻晃了一下。' : null };
  if (beat.phase === 'paper-end') return { beat,
    line: action === 'return' ? '他已回到抄书的那一行，没有再解释。' : null };
  if (beat.phase !== 'explore' && beat.phase !== 'farewell') return { beat, line: null };
  if (action === 'desk') return { beat: { ...beat, deskSeen: true },
    line: `案上纸、笔、墨都齐。${readLiuyuanVariant()}手边还有一张未写的纸。` };
  if (action === 'window') return { beat: { ...beat, windowSeen: true },
    line: '窗外一片蕉叶，被窗格裁去半边。他停笔时，眼睛望向那里。' };
  if (action === 'shelf') return { beat,
    line: '书架上有一排旧书。屋里并不缺纸，也不缺笔。' };
  if (beat.phase === 'farewell' && action === 'return') return {
    beat: { ...beat, phase: 'paper-paused' },
    line: '他把抄好的一张纸卷起来，放在掌心，又慢慢按回案上。',
  };
  if (beat.phase === 'explore' && beat.deskSeen && action === 'return') return {
    beat: { ...beat, phase: 'paper-paused' },
    line: `${beat.answer === 'wrong' ? '他抬眼：“既从府学来，我想托你一件事。”' : '他把笔搁下：“方才那一行，可曾在府学见过？”'}“我抄到这里，总觉得不对。府学若还留着原本，帮我核一核这个字。”他把纸卷起来，放在掌心，又慢慢按回案上。`,
  };
  return { beat, line: '他仍在抄书。偶尔停笔，看一眼窗。' };
}
