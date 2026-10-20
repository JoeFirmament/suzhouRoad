/** CH3-05: one physical delivery, then an optional question or a quiet observation. */
export type FloristBeatState = 'unmet' | 'choice' | 'heard';
export type FloristBeatAction = 'approach' | 'ask' | 'watch';

export type FloristBeatResult = {
  state: FloristBeatState;
  line: string;
  showChoices: boolean;
  heardClue: boolean;
};

export function advanceFloristBeat(
  state: FloristBeatState, action: FloristBeatAction, porridgeDelivered: boolean,
): FloristBeatResult {
  if (!porridgeDelivered) return {
    state: 'unmet', line: '花匠头也不抬：“花房的粥？搁檐下。别踩那条线，刚培的土。”',
    showChoices: false, heardClue: false,
  };
  if (action === 'approach') return {
    state: 'choice', line: state === 'heard'
      ? '花匠又埋头给盆兰换土。你还可以问一句，或看一看他的活计。'
      : '花匠把兰盆扶正：“那位的粥留着。忙完了，他会来拿。”你望向院外，翻纸声时断时续。',
    showChoices: true, heardClue: false,
  };
  if (state !== 'choice') return {
    state, line: '先走近花匠，看看他忙什么。', showChoices: false, heardClue: false,
  };
  return action === 'ask'
    ? { state: 'heard', line: '“刚才说的那位，在哪儿看书？”“书斋里那位。”“哪一间？”“他又不归我管。”他拨了拨兰土：“那树开前，苞尖像笔头。我们管它叫笔树。”',
      showChoices: false, heardClue: true }
    : { state: 'heard', line: '你没催他，等他把盆沿的湿泥抹净。你望向院外，他顺着你的目光说：“那树开前，苞尖像笔头。我们管它叫笔树。”说完又忙他的兰。',
      showChoices: false, heardClue: true };
}
