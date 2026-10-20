import { artStage, hasStoryFlag, loadProgress, type ArtId, type GardenId, type GardenState } from './core/progression.js';
import { drawingChapterEcho } from './core/liuyuan-drawing-echo.js';
import { LIUYUAN_TEXT_VARIANT } from './core/liuyuan-text-variant.js';
import { LIUYUAN_VARIANT_COLLATED } from './core/liuyuan-variant-collation.js';
import { modernRouteHref } from './core/liuyuan-modern-route.js';
import { chapterSceneHref } from './core/liuyuan-view-memory.js';

const progress = loadProgress();
(document.getElementById('journalHome') as HTMLAnchorElement).href=chapterSceneHref('home.html');
const drawingAlbum = document.getElementById('drawingAlbum')!;
drawingAlbum.hidden = !progress.knowledge.includes('liuyuan-album-orchid-leaf');
if (!drawingAlbum.hidden) {
  const ctx = (document.getElementById('orchidLeaf') as HTMLCanvasElement).getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#dfd1af'; ctx.fillRect(0, 0, 160, 104);
  ctx.fillStyle = '#f0e5ca'; ctx.fillRect(4, 4, 152, 96);
  // Original stepped ink clusters, no copied source-book plate.
  const leaf = (points: number[][], color: string) => {
    ctx.fillStyle = color;
    for (const [x, y, w, h] of points) ctx.fillRect(x, y, w, h);
  };
  leaf([[70,72,4,12],[66,62,4,12],[62,52,4,12],[54,42,8,4],[44,36,10,4],[32,34,12,3]], '#536655');
  leaf([[74,64,3,20],[77,50,3,16],[80,38,3,14],[83,28,3,12],[86,20,3,10]], '#334e43');
  leaf([[76,76,5,8],[81,64,4,12],[85,56,4,10],[89,48,6,8],[95,44,12,4],[107,46,10,3]], '#6e7e5f');
  leaf([[67,78,3,6],[62,72,5,4],[55,68,7,3],[44,67,11,2],[34,70,10,2]], '#738269');
  leaf([[92,68,2,16],[94,57,2,12],[96,48,2,11],[97,43,3,6]], '#536655');
  leaf([[94,38,4,8],[98,40,8,3],[91,44,6,3],[98,45,3,6]], '#aa8266');
  leaf([[121,75,8,2],[121,79,8,2],[121,83,8,2],[120,73,2,14],[129,73,2,14]], '#a5624b');
}
document.getElementById('liuyuanNote')!.hidden = !hasStoryFlag(progress, 'ly-unlocked');
document.getElementById('liuyuanEcho')!.textContent = drawingChapterEcho(progress.knowledge);
document.getElementById('variantRecord')!.hidden = !hasStoryFlag(progress,'ly-leaf-written');
document.getElementById('variantAcademy')!.textContent = LIUYUAN_TEXT_VARIANT.academy;
document.getElementById('variantLeaf')!.textContent = LIUYUAN_TEXT_VARIANT.copyist;
const leftGarden=hasStoryFlag(progress,'ly-unlocked');
const collated=progress.knowledge.includes(LIUYUAN_VARIANT_COLLATED);
document.getElementById('variantFollowup')!.textContent=collated
  ? '已回府学核过原本：确是“景同”。这一个字的差别是真的；哪处先改了字，仍待查。'
  : leftGarden ? '先保存所见，回府学再核原本。同与异，究竟是传抄的差别，还是看景的差别？'
    : '字已经记下。先回花木院取空桶，收好叶片，出园后将桶交还乔禾，再回府学核原本。';
const leafInBucket=hasStoryFlag(progress,'ly-leaf-carried');
const draftRoute=new URLSearchParams(location.search).get('draft')==='1';
const variantLink=document.getElementById('variantHomeLink') as HTMLAnchorElement;
variantLink.href=leftGarden ? chapterSceneHref('home.html')
  : leafInBucket ? modernRouteHref('liuyuan-entry.html','flower',draftRoute,true)
    : modernRouteHref('liuyuan-study-court.html','leaf',draftRoute,true);
variantLink.textContent=leftGarden ? collated ? '回府学 · 重看原本' : '回府学书架核本' : leafInBucket ? '回夹弄 · 把空桶交还乔禾' : '回书斋门前 · 沿来路取桶';
const rewards=document.getElementById('liuyuanRewards')!;
rewards.hidden=!hasStoryFlag(progress,'ly-errand-offered');
document.getElementById('liuyuanWritingReward')!.textContent=progress.completedTasks.includes('liuyuan-leaf-writing')
  ? '题叶临写：书 +1，首次奖励已领取。' : '题叶临写：尚未完成，没有书艺奖励。';
document.getElementById('liuyuanGuardReward')!.textContent=progress.completedTasks.includes('liuyuan-rain-shadow')
  ? '护画走位：御 +1，首次奖励已领取。' : '护画走位：尚未领取御艺奖励；这项挑战可以不做。';
if(hasStoryFlag(progress,'ly-errand-offered')) {
  document.getElementById('chapterTitle')!.textContent='留园 · 一支粥的路';
  document.getElementById('currentObjective')!.textContent=leftGarden
    ? collated ? '异文已记入园谱，可继续探索' : '回府学书架，核一核叶上那个字'
    : hasStoryFlag(progress,'ly-leaf-written')
      ? hasStoryFlag(progress,'ly-leaf-carried') ? '过门房，亲手将空桶交还乔禾' : '回花木院取空桶，收好叶片'
      : hasStoryFlag(progress,'ly-scholar-trouble-known') ? '看看新叶，亲手试写那一行'
      : hasStoryFlag(progress,'ly-study-found') ? '看看案上那行字，再与抄书人交谈'
      : hasStoryFlag(progress,'ly-porridge-delivered') ? '沿院路探索，寻找翻纸声' : '把粥送到花房檐下';
}
const arts: Array<[ArtId, string, string]> = [
  ['li','礼','处理人物关系'], ['yue','乐','节奏操作'], ['she','射','瞄准与投掷'],
  ['yu','御','护画走位'], ['shu','书','题叶与临写'], ['shuMath','数','推演机关'],
];
const gardens: Array<[GardenId, string]> = [
  ['canglang','沧浪亭'], ['wangshi','网师园'], ['zhuozheng','拙政园'], ['shizilin','狮子林'],
  ['liuyuan','留园'], ['ouyuan','耦园'], ['yipu','艺圃'], ['huanxiu','环秀山庄'], ['tuisi','退思园'],
];
const stateLabel: Record<GardenState,string> = { locked:'未解锁', clue:'新线索', open:'可入园', entered:'已入园', complete:'已访' };
const knowledgeLabel: Record<string,string> = {
  'canglang-double-corridor':'沧浪亭 · 临水复廊',
  'moving-view-through-windows':'三窗 · 移步换景',
  'liuyuan-cramped-alley':'留园 · 夹弄的收放',
  'liuyuan-magnolia-slip':'留园 · 花匠说的“笔树”',
  'liuyuan-garden-note-variant':'题叶 · 园记“景同／景异”（自拟故事）',
  'liuyuan-garden-note-collated':'核本 · 府学藏本确为“景同”，两本差异仍待查',
  'liuyuan-album-orchid-leaf':'画册 · 檐下兰稿（花匠赠页）',
  'liuyuan-drawing-saved':'留园 · 抢回花匠的兰稿',
  'liuyuan-drawing-smudged':'留园 · 湿纸晾在檐下，书斋的人护着另一张纸',
  'liuyuan-drawing-left':'留园 · 退回檐下，记住花匠说的笔树',
};

const canglangDone = progress.completedTasks.includes('canglang-three-windows');
if (!hasStoryFlag(progress,'ly-errand-offered')) {
document.getElementById('chapterTitle')!.textContent = canglangDone ? '章间 · 新的墨痕' : '第一章 · 水外有园';
document.getElementById('currentObjective')!.textContent = canglangDone ? '回府学整理园谱，追查网师园线索' : '从府学出发，完成沧浪亭复廊三窗';
}
document.getElementById('gardenCount')!.textContent = `${gardens.filter(([id]) => progress.gardens[id] === 'complete').length} / 9`;

const artsList = document.getElementById('artsList')!;
for (const [id,name,verb] of arts) {
  const li = document.createElement('li');
  li.classList.toggle('active', progress.arts[id] > 0);
  li.innerHTML = `<b>${name}</b><span>${progress.arts[id] > 0 && id === 'shuMath' ? '观位 · 初识' : `${verb} · ${artStage(progress.arts[id])}`}</span>`;
  artsList.append(li);
}

const gardenList = document.getElementById('gardenList')!;
gardens.forEach(([id,name], index) => {
  const li = document.createElement('li');
  li.innerHTML = `<span>${String(index + 1).padStart(2,'0')}</span><b>${name}</b><em>${stateLabel[progress.gardens[id]]}</em>`;
  gardenList.append(li);
});

const knowledgeList = document.getElementById('knowledgeList')!;
if (progress.knowledge.length) {
  knowledgeList.innerHTML = '';
  for (const id of progress.knowledge) {
    const item = document.createElement('span');
    item.textContent = knowledgeLabel[id] ?? id;
    knowledgeList.append(item);
  }
}
