export type StudyCourtChoice = 'listen' | 'knock';
export type StudyCourtBeat = { heard: boolean; choice: StudyCourtChoice | null };
export type StudyCourtBeatAction = 'hear' | StudyCourtChoice | 'reset';

export const INITIAL_STUDY_COURT_BEAT: StudyCourtBeat = { heard: false, choice: null };

/** A committed knock should not become an unopened door after refresh. */
export function resumeStudyCourtBeat(studyFound: boolean): StudyCourtBeat {
  return studyFound ? { heard: true, choice: 'knock' } : { ...INITIAL_STUDY_COURT_BEAT };
}

export function advanceStudyCourtBeat(
  beat: StudyCourtBeat, action: StudyCourtBeatAction,
): { beat: StudyCourtBeat; line: string | null } {
  if (action === 'reset') return { beat: INITIAL_STUDY_COURT_BEAT, line: null };
  if (action === 'hear') return beat.heard
    ? { beat, line: null }
    : { beat: { heard: true, choice: null }, line: '院墙隔开了外头的脚步声。门里，有人翻过一页纸。' };
  if (!beat.heard) return { beat, line: null };
  if (action === 'listen') return {
    beat: { heard: true, choice: 'listen' },
    line: '你在廊下站了一会儿。纸页又响了一声，随即只剩树叶摇动。',
  };
  return {
    beat: { heard: true, choice: 'knock' },
    line: '你屈指轻叩。门里笔声一停，又慢慢续上；门仍虚掩着。',
  };
}
