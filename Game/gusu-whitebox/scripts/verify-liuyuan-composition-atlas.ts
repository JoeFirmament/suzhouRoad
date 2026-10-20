import {
  assessBranchStudy, INITIAL_BRANCH_STUDY, moveBranchHandle, readBranchStudy,
  type BranchStudyState,
} from '../src/core/liuyuan-zhezhi-study.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(readBranchStudy(INITIAL_BRANCH_STUDY).turns === 0, '初始主枝接近平直，不应先验地判作三折');
const openingReview = assessBranchStudy(INITIAL_BRANCH_STUDY);
assert(openingReview.notes[0].includes('较直'), '直枝稿应如实描述线势，而不是阻止收稿');
assert(openingReview.passed, '观稿只记录玩家已完成观察，不代表通过隐藏的审美分数');

const lively: BranchStudyState = {
  stem: [
    { x: 100, y: 350 }, { x: 230, y: 220 }, { x: 360, y: 340 },
    { x: 500, y: 180 }, { x: 640, y: 330 },
  ],
  blooms: [{ x: 280, y: 250 }, { x: 560, y: 250 }],
  selected: 0,
};
assert(readBranchStudy(lively).turns === 3, '三个转折均须能从主枝读出');
assert(assessBranchStudy(lively).notes.length === 3, '观稿应分别描述枝势、花意与余白');
assert(assessBranchStudy(lively).passed, '不同枝稿都可由玩家决定是否收下');

const crowded = { ...lively, blooms: [{ x: 400, y: 250 }, { x: 430, y: 250 }] as BranchStudyState['blooms'] };
assert(assessBranchStudy(crowded).notes[1].includes('相聚'), '花簇聚合时应描述主次暂不分明，而非判错');
const floating = { ...lively, blooms: [lively.blooms[0], { x: 850, y: 80 }] as BranchStudyState['blooms'] };
assert(assessBranchStudy(floating).notes[1].includes('离枝'), '花簇离枝时应提供可供玩家判断的观察意见');

const nudged = moveBranchHandle(lively, 2, { x: 999, y: -50 });
assert(nudged.stem[2].x <= 850 && nudged.stem[2].y >= 58, '枝节点须留在稿纸边界内');
assert(lively.stem[2].x === 360, '移动枝节点不得污染原稿状态');
console.log('折枝成势：三类观稿意见与稿纸边界检查完成。');
