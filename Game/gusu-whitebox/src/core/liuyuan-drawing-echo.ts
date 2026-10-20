/** The copyist responds only to a visible carried page; other echoes are the player's memory. */
export function drawingInteriorEcho(knowledge: readonly string[]): string {
  if (knowledge.includes('liuyuan-album-orchid-leaf'))
    return '他瞥见你收着的兰稿：“花匠的手笔。收好，别搁在我案上。”你的手停在袖边，没有去碰那张纸。';
  if (knowledge.includes('liuyuan-drawing-smudged'))
    return '你想起花匠压住湿纸的手，便没有去碰案上的纸。眼前这个人，也把纸留在自己手边。';
  if (knowledge.includes('liuyuan-drawing-left'))
    return '花匠那句“找人就认笔树”还在耳边。人找到了，案上的纸却还没有给你答案。';
  return '';
}

/** Retrospective belongs to the player, and never changes progress or rewards. */
export function drawingChapterEcho(knowledge: readonly string[]): string {
  const ending = '空桶还了，题过的叶留在身边。书斋那张不肯离手的纸，你终究没有强索。'
    + (knowledge.includes('liuyuan-garden-note-collated')
      ? '府学原本已核过，确是“景同”。这一个字的差别，仍值得追查。'
      : '“景同”与“景异”的差别，也要等回府学核过原本再说。');
  if (knowledge.includes('liuyuan-album-orchid-leaf'))
    return `${ending}花匠赠你的兰稿也收在袖中：有的纸能借来看，有的字，要自己另找地方写。`;
  if (knowledge.includes('liuyuan-drawing-smudged'))
    return `${ending}花房的湿稿还压在檐下。你想起试墨时洇开的叶脉，这回只托住叶边，让墨慢慢干。`;
  if (knowledge.includes('liuyuan-drawing-left'))
    return `${ending}猫边的画稿交回花匠照看，你循他那句“笔树”找到了人。没做完的那件事，并没有截断这一程。`;
  return knowledge.includes('liuyuan-magnolia-slip')
    ? `${ending}花匠的一句“笔树”，把你带到纸声前；带出来的这片叶，是你亲手试过的办法。`
    : `${ending}你循着院间的纸声找到书斋；带出来的这片叶，是你亲手试过的办法。`;
}
