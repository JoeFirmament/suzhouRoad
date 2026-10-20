(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const canvas = $('scene');
  const ctx = canvas.getContext('2d');
  const params = new URLSearchParams(location.search);
  const chapter = params.get('chapter') === '1';
  const storageKey = `gusu-garden-composition-practice-v2-${chapter ? 'chapter' : 'study'}`;
  const initial = { stones: [{ x: 220, y: 268 }, { x: 430, y: 268 }, { x: 640, y: 268 }], selected: 0 };
  const radii = [64, 52, 40];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const readDraft = () => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (!value || value.version !== 2) return {};
      const validPoint = (p) => p && Number.isFinite(p.x) && p.x >= 0 && p.x <= 960 && Number.isFinite(p.y) && p.y >= 0 && p.y <= 480;
      const draft = { version: 2 };
      const s = value.stone;
      if (s && s.state && Array.isArray(s.state.stones) && s.state.stones.length === 3
        && s.state.stones.every(validPoint) && [0, 1, 2].includes(s.state.selected)) {
        draft.stone = { state: s.state, exampleViewed: s.exampleViewed === true, passed: s.passed === true };
      }
      const b = value.branch;
      if (b && b.state && Array.isArray(b.state.stem) && b.state.stem.length === 5 && b.state.stem.every(validPoint)
        && Array.isArray(b.state.blooms) && b.state.blooms.length === 2 && b.state.blooms.every(validPoint)
        && Number.isInteger(b.state.selected) && b.state.selected >= 0 && b.state.selected <= 6) {
        draft.branch = { state: b.state, passed: b.passed === true };
      }
      return draft;
    } catch { return {}; }
  };
  const restored = readDraft().stone;
  let state = restored ? clone(restored.state) : clone(initial);
  let exampleViewed = restored ? restored.exampleViewed : false;
  let reviewed = !!(restored && restored.passed);
  let dragging = null;
  let dragOrigin = null;
  const history = [];
  const practice = $('practice');
  const analysis = $('analysis');
  const next = $('nextAfterReview');
  practice.hidden = !exampleViewed;

  function route(page, albumDone = false) {
    const query = new URLSearchParams();
    if (chapter) query.set('chapter', '1');
    if (params.get('draft') === '1') query.set('draft', '1');
    if (params.get('playtest') === '1') query.set('playtest', '1');
    if (albumDone) query.set('album', 'done');
    return `${page}${query.toString() ? `?${query}` : ''}`;
  }
  $('returnFlower').href = route('liuyuan-flower.html');
  $('returnAlbum').href = route('liuyuan-flower.html', true);

  function spacing() {
    const pair = [[0, 1], [0, 2], [1, 2]].map(([a, b]) => ({ a, b, gap: Math.hypot(state.stones[a].x - state.stones[b].x, state.stones[a].y - state.stones[b].y) - radii[a] - radii[b] }));
    const near = [0, 1, 2].map((i) => pair.filter((p) => p.a === i || p.b === i).sort((a, b) => a.gap - b.gap)[0]);
    const gaps = near.map((p) => p.gap).sort((a, b) => a - b);
    const line = gaps[0] < -18 ? '有两块石形压得太深，先让轮廓重新分开。'
      : gaps[2] - gaps[0] < 38 ? '三石都看得见，不过邻近的空隙还太齐；试着让一对相依些，另一处舒展开。'
      : gaps[0] > 108 ? '三石各自站得太远，彼此尚未形成一组；让其中两块靠近些。'
      : '已有近处相应、远处稍开的变化。';
    return { gaps, line };
  }
  function assess() {
    const { gaps } = spacing();
    if (gaps[0] < -18) return { passed: false, line: '石匠轻轻把纸转了半圈：“这两块挨得太深，轮廓快并成一团。留一道能辨石形的气口，再看一眼。”' };
    if (gaps[2] - gaps[0] < 38) return { passed: false, line: '石匠用指节沿三处空隙点过：“石形各有不同，间距却像尺量。让一对相依，再把另一处放开些。”' };
    if (gaps[0] > 108) return { passed: false, line: '石匠说：“三块都好看清，却各自成孤。收近一对，让它们先有照应。”' };
    return { passed: true, line: '石匠看了片刻，点头道：“三块仍各有石形，一处相亲，一处舒展。图六一、六二各有不同取法；这张小稿也自有它的气口。”' };
  }
  function persist() {
    const draft = readDraft();
    draft.version = 2;
    draft.stone = { state: clone(state), exampleViewed, passed: exampleViewed && reviewed && assess().passed };
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
      $('saveNote').textContent = '石稿已保存在本机浏览器；不改动地图草稿、主线旗标或六艺。';
    } catch { $('saveNote').textContent = '此浏览器未允许保存；本页仍可试玩，离开后可能从头开始。'; }
  }
  function palette(i) {
    return [{ base: '#626a64', lit: '#95978a', shade: '#3b4540' }, { base: '#70776e', lit: '#aaab98', shade: '#454d47' }, { base: '#565f5b', lit: '#899085', shade: '#343d39' }][i];
  }
  function drawStone(i) {
    const { x, y } = state.stones[i]; const r = radii[i]; const c = palette(i);
    const shapes = [
      [[-.67,.8],[-.7,.42],[-.48,.22],[-.44,-.2],[-.16,-.57],[.02,-.79],[.17,-.33],[.37,-.53],[.59,-.16],[.67,.4],[.43,.65],[.11,.79]],
      [[-.79,.66],[-.68,.18],[-.48,-.17],[-.12,-.24],[.04,-.64],[.27,-.39],[.49,-.43],[.75,.02],[.7,.47],[.48,.69],[.06,.72],[-.34,.82]],
      [[-.53,.78],[-.61,.4],[-.35,.11],[-.28,-.43],[-.05,-.74],[.13,-.26],[.33,-.58],[.56,-.11],[.49,.45],[.24,.72]],
    ];
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#716f60a8'; ctx.beginPath(); ctx.ellipse(4, r * .72, r * .86, r * .18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); shapes[i].forEach(([px, py], n) => n ? ctx.lineTo(px * r, py * r) : ctx.moveTo(px * r, py * r)); ctx.closePath(); ctx.fillStyle = c.base; ctx.fill(); ctx.lineWidth = Math.max(2, r * .065); ctx.strokeStyle = c.shade; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r*.48,r*.14); ctx.lineTo(-r*.28,-r*.24); ctx.lineTo(-r*.04,-r*.39); ctx.lineTo(r*.1,-r*.07); ctx.lineTo(r*.36,r*.08); ctx.lineTo(r*.5,r*.39); ctx.lineWidth = Math.max(2,r*.09); ctx.strokeStyle = c.lit; ctx.stroke();
    ctx.fillStyle = '#d8d3bf'; ctx.beginPath(); ctx.ellipse(i === 1 ? r*.23 : -r*.05, i === 2 ? r*.08 : -r*.02, r*.1, r*.16, -.15, 0, Math.PI*2); ctx.fill();
    if (state.selected === i && !practice.hidden) { ctx.setLineDash([5,5]); ctx.beginPath(); ctx.ellipse(0,0,r*1.16,r*1.16,0,0,Math.PI*2); ctx.lineWidth=2; ctx.strokeStyle='#e5c886'; ctx.stroke(); }
    ctx.restore();
  }
  function draw() {
    ctx.imageSmoothingEnabled = false; ctx.clearRect(0,0,960,480); ctx.fillStyle='#d9d1bc'; ctx.fillRect(0,0,960,480); ctx.fillStyle='#d3cab4';
    for (let y=15;y<480;y+=32) ctx.fillRect(0,y,960,1);
    ctx.strokeStyle='#a39a81'; ctx.lineWidth=2; ctx.strokeRect(26,25,908,430); ctx.strokeStyle='#b4aa90'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(56,90); ctx.bezierCurveTo(170,52,232,92,326,62); ctx.moveTo(641,84); ctx.bezierCurveTo(733,112,816,48,901,82); ctx.stroke();
    [0,1,2].sort((a,b)=>state.stones[a].y-state.stones[b].y).forEach(drawStone);
  }
  function refresh() {
    document.querySelectorAll('[data-stone]').forEach((b)=>b.setAttribute('aria-pressed',String(Number(b.dataset.stone)===state.selected)));
    $('liveRead').textContent = `当前观察：${spacing().line}`; draw();
  }
  function change(nextState, line) {
    if (JSON.stringify(nextState) === JSON.stringify(state)) return;
    history.push(clone(state)); state=nextState; reviewed=false; analysis.hidden=true; next.hidden=true; $('feedback').textContent=line; refresh(); persist();
  }
  function select(i) { change({ ...state, selected:i },`已选中石样${i+1}。拖动它，或用方向键挪动。`); canvas.focus({preventScroll:true}); }
  function point(event) { const r=canvas.getBoundingClientRect(); return {x:(event.clientX-r.left)/r.width*960,y:(event.clientY-r.top)/r.height*480}; }
  function move(i,p) { const r=radii[i], stones=state.stones.map((s,n)=>n===i?{x:Math.max(r+72,Math.min(960-r-72,p.x)),y:Math.max(r+72,Math.min(480-r-72,p.y))}:{...s}); state={stones,selected:i}; }
  function nudge(dx,dy) { const p=state.stones[state.selected]; move(state.selected,{x:p.x+dx,y:p.y+dy}); }
  canvas.addEventListener('pointerdown',(e)=>{const p=point(e); const order=[0,1,2].sort((a,b)=>state.stones[b].y-state.stones[a].y); const hit=order.find(i=>Math.hypot(p.x-state.stones[i].x,p.y-state.stones[i].y)<=radii[i]*1.2); if(hit===undefined)return; state.selected=hit; dragging=hit; dragOrigin=clone(state); canvas.setPointerCapture(e.pointerId); refresh(); $('feedback').textContent=`正在移动石样${hit+1}。放下后看一看三石之间的空隙。`;});
  canvas.addEventListener('pointermove',(e)=>{if(dragging===null||!canvas.hasPointerCapture(e.pointerId))return; const before=JSON.stringify(state.stones); move(dragging,point(e)); if(before!==JSON.stringify(state.stones)){reviewed=false;analysis.hidden=true;next.hidden=true;refresh();}});
  function finishDrag(){if(dragging===null)return;if(dragOrigin&&JSON.stringify(dragOrigin.stones)!==JSON.stringify(state.stones))history.push(dragOrigin);dragging=null;dragOrigin=null;$('feedback').textContent='石样放稳了。看看彼此相近的两块，与较疏开的那一处。';persist();}
  canvas.addEventListener('pointerup',finishDrag); canvas.addEventListener('pointercancel',finishDrag);
  document.querySelectorAll('[data-stone]').forEach((b)=>b.addEventListener('click',()=>select(Number(b.dataset.stone))));
  const delta={left:[-12,0],right:[12,0],up:[0,-12],down:[0,12]};
  document.querySelectorAll('[data-nudge]').forEach((b)=>b.addEventListener('click',()=>{const d=delta[b.dataset.nudge];const before=clone(state);nudge(d[0],d[1]);if(JSON.stringify(before.stones)===JSON.stringify(state.stones))return;history.push(before);reviewed=false;analysis.hidden=true;next.hidden=true;$('feedback').textContent='轻轻挪了一步。纸上石形仍在，可以接着调整。';refresh();persist();}));
  $('startPractice').addEventListener('click',()=>{exampleViewed=true;practice.hidden=false;refresh();$('feedback').textContent='现在开始摆稿。先不要追求像哪一幅，只看三块的关系怎样变化。';persist();practice.scrollIntoView({behavior:'smooth',block:'start'});});
  $('review').addEventListener('click',()=>{const result=assess();reviewed=result.passed;$('feedback').textContent=result.line;$('analysisText').textContent=result.passed?'本次委托完成：三石可分辨，并出现了疏密变化。改变其中任何一块的位置，都可以再试新的组织方式。':`还未合这张小稿的明示条件：${spacing().line}`;analysis.hidden=false;next.hidden=!result.passed;refresh();persist();});
  $('undo').addEventListener('click',()=>{const prev=history.pop();if(!prev){$('feedback').textContent='还没有可退回的一步。';return;}state=prev;reviewed=false;analysis.hidden=true;next.hidden=true;refresh();$('feedback').textContent='退回上一步。另一种疏密也可以试试看。';persist();});
  $('reset').addEventListener('click',()=>{history.push(clone(state));state=clone(initial);reviewed=false;analysis.hidden=true;next.hidden=true;refresh();$('feedback').textContent='石样回到初始位置。先试着让一对更相近，再放开另一处。';persist();});
  window.addEventListener('keydown',(e)=>{if(!exampleViewed||practice.hidden||e.altKey||e.ctrlKey||e.metaKey)return;const k=e.key.toLowerCase();if(['1','2','3'].includes(k)){select(Number(k)-1);e.preventDefault();return;}if(document.activeElement!==canvas)return;const d={arrowleft:[-6,0],arrowright:[6,0],arrowup:[0,-6],arrowdown:[0,6]}[k];if(!d)return;const before=clone(state);nudge(d[0],d[1]);if(JSON.stringify(before.stones)!==JSON.stringify(state.stones)){history.push(before);reviewed=false;analysis.hidden=true;next.hidden=true;$('feedback').textContent='细细调整了一点位置。';refresh();persist();}e.preventDefault();});
  if(exampleViewed){practice.hidden=false;if(reviewed&&assess().passed){next.hidden=false;analysis.hidden=false;$('analysisText').textContent='上次交成的石稿已留在案上；也可以重新挪动石样，再试一张。';$('feedback').textContent='这张稿子仍符合石匠的委托。';}else if(restored){$('feedback').textContent='已接上次摆稿。石样可以继续调整。';}}
  refresh();
})();
