import { LEAF_TRACE_PATHS, leafTraceView, beginLeafTrace, moveLeafTrace, stepLeafTrace, traceFinished, type LeafTrace, type TraceDirection, type TracePoint } from './core/liuyuan-leaf-trace.js';
import { advanceLeafStudy, INITIAL_LEAF_STUDY } from './core/liuyuan-leaf-writing-study.js';
import type { LeafAction, LeafStudy } from './core/liuyuan-leaf-writing-study.js';
import { canEnterModernRoute, modernRouteHref } from './core/liuyuan-modern-route.js';
import { commitLiuyuanChapterFlag } from './core/liuyuan-progression.js';
import { hasStoryFlag, loadProgress } from './core/progression.js';
import { isLiuyuanPlaytest } from './core/liuyuan-playtest.js';
import { readLeafResume, writeLeafResume } from './core/liuyuan-leaf-resume.js';
import { LIUYUAN_TEXT_VARIANT } from './core/liuyuan-text-variant.js';

const canvas = document.getElementById('leafScene') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const status = document.getElementById('leafStatus')!;
const hint = document.getElementById('operationHint')!;
const routeNotice = document.getElementById('routeNotice')!;
const modeBadge = document.getElementById('modeBadge')!;
const returnToCourt = document.getElementById('returnToCourt') as HTMLAnchorElement;
const returnFromDone = document.getElementById('returnFromDone') as HTMLAnchorElement;
const variantWords = document.getElementById('variantWords')!;
const draftRequested = new URLSearchParams(location.search).get('draft') === '1';
const modernChapter = canEnterModernRoute(location.search, loadProgress(), 'study-interior', 'ly-scholar-trouble-known');
if (modernChapter) {
  modeBadge.textContent = '留园章 · 题叶道具特写 / 游戏演绎';
  routeNotice.textContent = '这是虚构任务的近景操作，不是清末留园蕉株或书写材料的复原。旧漆板仅帮助角色稳住叶片；真实墨色、耐久与漆板托叶效果尚未实测。怀素传记分别记蕉叶和漆板写字，并未说以板托叶。';
  returnToCourt.href = modernRouteHref('liuyuan-study-court.html', 'leaf', draftRequested, true);
  returnFromDone.href = returnToCourt.href;
}
const controls: Record<LeafStudy['phase'], HTMLElement> = {
  choose: document.getElementById('chooseControls')!, trial: document.getElementById('trialControls')!,
  support: document.getElementById('supportControls')!, write: document.getElementById('strokeControls')!,
  done: document.getElementById('doneControls')!,
};
const playtest=isLiuyuanPlaytest();
const resumed=modernChapter ? readLeafResume(playtest,loadProgress()) : null;
let study: LeafStudy = modernChapter && hasStoryFlag(loadProgress(), 'ly-leaf-written')
  ? { phase: 'done', strokes: 3, oldLeafSeen: false, inkSeen: true }
  : resumed ?? (modernChapter && hasStoryFlag(loadProgress(),'ly-leaf-picked')
    ? {phase:'trial',strokes:0,oldLeafSeen:false,inkSeen:false} : INITIAL_LEAF_STUDY);
if (study.phase === 'done') status.textContent = '这片叶已经题好。沿来路回书斋院，去取空桶。';
else if (resumed) status.textContent = study.phase==='write'
  ? `已写好的 ${study.strokes} 段仍在。从第 ${study.strokes+1} 段亮点重新落笔。`
  : '叶片还在手边，接着刚才的操作。';
function saveLeafCheckpoint(): void {
  if (modernChapter) writeLeafResume(playtest,loadProgress(),study);
}
if (study.phase==='done') saveLeafCheckpoint();
window.addEventListener('pagehide',saveLeafCheckpoint);
let trace: LeafTrace | null = null;
let tracePointer: number | null = null;

function rect(x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
}
function polygon(points: readonly (readonly [number,number])[], color: string): void {
  ctx.fillStyle = color; ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
  ctx.closePath(); ctx.fill();
}
function drawLeaf(): void {
  const view=study.phase==='write' ? leafTraceView(study.strokes) : {x:0,y:0,w:800,h:450};
  ctx.setTransform(canvas.width/view.w,0,0,canvas.height/view.h,-view.x*canvas.width/view.w,-view.y*canvas.height/view.h);
  const writing = study.phase === 'write' || study.phase === 'done';
  const board = writing ? '#594332' : '#536450';
  rect(0,0,800,450,'#202b27');
  for (let y=0;y<450;y+=24) rect(0,y,800,2,'#293931');
  rect(90,345,630,22,'#73604a'); rect(112,366,590,15,'#4c3d30');
  if (writing) { rect(132,157,540,205,'#2a241f'); rect(142,150,520,200,board); rect(149,157,506,186,'#66513c'); }
  else { rect(165,167,465,175,'#465841'); rect(175,174,445,161,board); }
  // 叶柄先于叶面，明示写字方向；台面与叶子是玩法特写，不复刻具体内景。
  polygon([[149,303],[206,289],[215,302],[150,317]], '#899c62');
  polygon([[206,290],[243,239],[323,194],[431,174],[548,183],[636,214],[657,231],
    [613,253],[535,286],[424,313],[326,321],[250,310]], '#354f35');
  polygon([[211,289],[251,246],[334,205],[430,184],[545,191],[633,215],[646,229],
    [607,245],[532,273],[421,302],[324,310],[250,301]], study.phase === 'choose' ? '#657753' : '#63825a');
  polygon([[238,285],[286,241],[382,210],[497,198],[592,211],[635,226],[554,224],[443,246],[331,278]], '#83a276');
  polygon([[235,296],[315,277],[415,249],[531,230],[642,225],[531,238],[417,260],[317,290]], '#b2ba81');
  for (let i=0;i<5;i++) {
    const x=289+i*64, y=282-i*11;
    polygon([[x,y],[x+18,y-45],[x+26,y-50],[x+10,y-6]], '#526f4b');
    polygon([[x,y],[x+25,y+24],[x+34,y+17],[x+8,y-4]], '#506a49');
  }
  if (study.phase === 'choose') {
    polygon([[65,157],[104,112],[161,91],[213,98],[279,124],[303,139],[248,151],
      [206,166],[158,173],[112,167]], '#706f47');
    polygon([[89,148],[121,117],[171,104],[223,116],[278,137],[220,139],[164,159]], '#8a8954');
    rect(98,157,62,6,'#a58d5b');
    polygon([[231,111],[240,107],[236,137],[224,141]], '#202b27');
    polygon([[257,124],[266,121],[255,148],[245,152]], '#202b27');
  }
  if (study.inkSeen && !writing) { rect(376,252,13,9,'#242f27'); rect(391,259,19,6,'#2b3a30'); rect(413,264,8,16,'#2c3830'); }
  if (writing) {
    LEAF_TRACE_PATHS.forEach((path, index) => {
      for (let segment = 0; segment < path.length-1; segment++) {
        const a=path[segment], b=path[segment+1];
        const ink = index < study.strokes || (index === study.strokes && trace && segment < trace.node);
        const color = ink ? '#213b34' : index === study.strokes ? '#d7c79a' : '#829078';
        const count = Math.max(Math.abs(b.x-a.x), Math.abs(b.y-a.y));
        for (let step=0; step<=count; step+=2)
          rect(Math.round(a.x+(b.x-a.x)*step/count)-2, Math.round(a.y+(b.y-a.y)*step/count)-2, 4, 4, color);
      }
      if (index === study.strokes && study.phase === 'write') {
        const point = trace?.point ?? path[0];
        if (trace && trace.node<path.length-1) {
          const from=path[trace.node], length=Math.max(Math.abs(point.x-from.x),Math.abs(point.y-from.y));
          for (let step=0;step<length;step+=2)
            rect(Math.round(from.x+(point.x-from.x)*step/length)-2,Math.round(from.y+(point.y-from.y)*step/length)-2,4,4,'#213b34');
        }
        rect(point.x-4,point.y-4,8,8,'#f3e2a4');
        rect(path[path.length-1].x-3,path[path.length-1].y-3,6,6,'#c19c71');
      }
    });
  }
  if (study.phase === 'done') {
    rect(579,279,45,12,'#c6b693'); rect(619,282,13,6,'#5a4336');
  }
}
function render(): void {
  for (const [phase, element] of Object.entries(controls)) element.hidden = phase !== study.phase;
  variantWords.textContent = study.phase==='done'
    ? `叶上记下：“${LIUYUAN_TEXT_VARIANT.copyist}”回府学再对原本，先不替这一个字下结论。`
    : `要带走的原句：“${LIUYUAN_TEXT_VARIANT.copyist}”你记得府学本是“景同”。先照所见记下，不能凭印象改字。`;
  hint.textContent = study.phase === 'write' ? `第 ${study.strokes+1}/3 段：从亮点按住，沿浅色笔路拖到末端再抬手。键盘按 ${study.strokes+1} 落笔，用方向键沿笔路续写。无计时，偏出只重试本段。`
    : study.phase === 'done' ? modernChapter
      ? '题叶收好。等墨稍定，回书斋院，沿来路去取空桶。'
      : '此研究小样到此为止；独立练习不写章节存档或六艺。'
    : '键盘按数字 1、2 选择；触屏可点按钮。失手不会扣分。';
  drawLeaf();
}
function act(action: LeafAction): void {
  trace = null; tracePointer = null;
  const wasChoosing = study.phase === 'choose';
  const next = advanceLeafStudy(study, action); study = next.state;
  if (modernChapter && wasChoosing && action === 'new' && study.phase === 'trial')
    commitLiuyuanChapterFlag('ly-leaf-picked');
  const awarded = modernChapter && study.phase === 'done' && action === 'stroke'
    ? commitLiuyuanChapterFlag('ly-leaf-written').applied : false;
  if (next.line) status.textContent = next.line;
  if (modernChapter && study.phase === 'done' && hasStoryFlag(loadProgress(), 'ly-leaf-written'))
    status.textContent += `${awarded ? ' 书 +1。' : ' 这片叶的书艺奖励已领取。'}纸留在他案上，你把记下的那句带走。`;
  saveLeafCheckpoint();
  render();
}
function stroke(index: number): void {
  if (study.phase !== 'write') return;
  if (index !== study.strokes) {
    status.textContent = index < study.strokes ? '这处墨迹还湿。别再碰，沿叶脉往前。' : '先从叶柄一侧写起，字才有地方排。';
    return;
  }
  if (tracePointer !== null) return;
  trace = beginLeafTrace(LEAF_TRACE_PATHS[study.strokes]);
  status.textContent = '笔尖落在亮点。看清笔路，用方向键续写。';
  render();
}
document.querySelectorAll<HTMLButtonElement>('[data-leaf-action]').forEach(button => {
  button.addEventListener('click', () => act(button.dataset.leafAction as LeafAction));
});
document.querySelectorAll<HTMLButtonElement>('[data-stroke]').forEach(button => {
  button.addEventListener('click', () => stroke(Number(button.dataset.stroke)));
});
function abandonTrace(words: string): void {
  trace = null; tracePointer = null;
  if (study.phase === 'write') { status.textContent = words; render(); }
}
function pointerPoint(event: PointerEvent): TracePoint {
  const box=canvas.getBoundingClientRect();
  const view=leafTraceView(study.strokes);
  return { x:view.x+(event.clientX-box.left)*view.w/box.width, y:view.y+(event.clientY-box.top)*view.h/box.height };
}
canvas.addEventListener('pointerdown', event => {
  if (study.phase !== 'write' || tracePointer !== null || (event.button !== undefined && event.button !== 0)) return;
  event.preventDefault();
  const next=beginLeafTrace(LEAF_TRACE_PATHS[study.strokes],pointerPoint(event));
  if (!next) { status.textContent='先在亮点落笔，再沿笔路写。'; return; }
  trace=next; tracePointer=event.pointerId; canvas.setPointerCapture(event.pointerId); render();
});
canvas.addEventListener('pointermove', event => {
  if (event.pointerId !== tracePointer || !trace || study.phase !== 'write') return;
  event.preventDefault();
  trace=moveLeafTrace(trace,LEAF_TRACE_PATHS[study.strokes],pointerPoint(event));
  if (trace.failed) { abandonTrace('笔尖偏出去了。已写好的段落还在，从本段亮点再来。'); return; }
  render();
});
canvas.addEventListener('pointerup', event => {
  if (event.pointerId !== tracePointer || !trace || study.phase !== 'write') return;
  event.preventDefault();
  trace=moveLeafTrace(trace,LEAF_TRACE_PATHS[study.strokes],pointerPoint(event));
  const finished=traceFinished(trace,LEAF_TRACE_PATHS[study.strokes]);
  tracePointer=null;
  if (finished) act('stroke');
  else abandonTrace('这一笔还没有写到末端。从亮点接着试，前面写好的不动。');
});
for (const type of ['pointercancel','lostpointercapture']) canvas.addEventListener(type, event => {
  if ((event as PointerEvent).pointerId === tracePointer) abandonTrace('先收笔，本段稍后再试。');
});
window.addEventListener('blur',()=>abandonTrace('先收笔，本段稍后再试。'));
function traceDirection(direction: TraceDirection): void {
  if (study.phase !== 'write' || !trace || tracePointer !== null) return;
  trace=stepLeafTrace(trace,LEAF_TRACE_PATHS[study.strokes],direction);
  if (trace.failed) abandonTrace('方向偏了。看着浅色笔路，从本段亮点重写。');
  else if (traceFinished(trace,LEAF_TRACE_PATHS[study.strokes])) act('stroke');
  else { status.textContent='这一转收稳了，沿下一段笔路续写。'; render(); }
}
document.querySelectorAll<HTMLButtonElement>('[data-trace-dir]').forEach(button=> {
  button.addEventListener('click',()=>traceDirection(button.dataset.traceDir as TraceDirection));
});
window.addEventListener('keydown', event => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  const direction = ({ArrowUp:'up',ArrowRight:'right',ArrowDown:'down',ArrowLeft:'left'} as Record<string,TraceDirection>)[event.key];
  if (study.phase === 'write' && direction) { event.preventDefault(); traceDirection(direction); return; }
  if (!['1','2','3'].includes(event.key)) return;
  const index = Number(event.key)-1;
  if (study.phase === 'write') { event.preventDefault(); stroke(index); return; }
  const actions: Partial<Record<LeafStudy['phase'], LeafAction[]>> = {
    choose: ['old','new'], trial: ['test-ink'], support: ['hard-write','take-board'],
  };
  const action = actions[study.phase]?.[index];
  if (action) { event.preventDefault(); act(action); }
});
render();
