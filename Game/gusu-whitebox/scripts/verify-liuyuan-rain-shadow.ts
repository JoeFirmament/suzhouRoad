import { createRainShadow, startRainShadow, retryRainShadow, pauseRainShadow, updateRainShadow,
  bandPosition, rainBandHits, rainWindow, rainDuration, rainStoryStage, STORY_RAIN_WAVES,
  rainBandLifetime, RAIN_ROUND_SECONDS, RAIN_ROUND_COUNT, rainPickupSeconds, STORY_CAT_BEATS,
  rainCatPosition, rainCatHits, rainCatDuration, rainHitGrace, rainHealthCapacity, type RainShadow } from '../src/core/liuyuan-rain-shadow.js';
import { rainTestInput } from './rain-shadow-test-input.js';
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const input = { x: 0, y: 0 };
const ready = createRainShadow(); updateRainShadow(ready, 1, input);
assert(ready.total === 0 && ready.health === 5, '未主动开始不可受损/计时');
startRainShadow(ready); updateRainShadow(ready, .1, { x: 1, y: 1 });
assert(Math.abs(Math.hypot(ready.x - 160, ready.y - 157) - 10.8) < .01, '斜向不能加速');
pauseRainShadow(ready); const before = JSON.stringify(ready); updateRainShadow(ready, 100, { x: -1, y: 0 });
assert(JSON.stringify(ready) === before, '切页/暂停须冻结整个模拟');
const idle = createRainShadow(); startRainShadow(idle);
for (let i = 0; i < 1200 && idle.phase === 'running'; i++) updateRainShadow(idle, .016, input);
assert(idle.phase === 'lost' && idle.marks === 0, '只等时间不能成功');
const failedSecond = createRainShadow(); startRainShadow(failedSecond);
while (failedSecond.phase === 'running' && failedSecond.round === 0)
  updateRainShadow(failedSecond, .016, { ...input, target: rainWindow(failedSecond) });
const savedRoundHealth = failedSecond.health;
while (failedSecond.phase === 'running') updateRainShadow(failedSecond, .016, input);
const retry = retryRainShadow(failedSecond);
assert(retry.round === 1 && retry.marks === 1 && retry.health === savedRoundHealth
  && retry.time === 0 && retry.bands.length === 0 && retry.phase === 'ready', '失败只重试当前折，保留之前成功与当折起始纸笺');
const guard = createRainShadow(); startRainShadow(guard); updateRainShadow(guard, .016, { ...input, guard: true });
assert(guard.shield > .59 && guard.cooldown > 1.99, '护笺有短时窗口和回气');
for (let i = 0; i < 50; i++) updateRainShadow(guard, .016, { ...input, guard: true });
assert(guard.shield === 0 && guard.cooldown > 1, '长按不得永远无敌');
const drag = createRainShadow(); startRainShadow(drag); updateRainShadow(drag, .016, { ...input, target: { x: 999, y: -999 } });
assert(Math.hypot(drag.x - 160, drag.y - 157) < 2, '拖动不能瞬移');
const band = { axis: 'y' as const, from: 20, sign: 1, gap: 78, opening: 62, age: .5, warning: .95, speed: 96 };
assert(!rainBandHits(band, 160, 20), '预警阶段不能伤害');
band.age = 1.95;
assert(bandPosition(band) === 116 && !rainBandHits(band, 78, 116) && rainBandHits(band, 160, 116), '缺口安全/雨带碰撞分离');
// Follow visible targets and then previewed openings. Same strategy at 30/60 FPS.
function play(gentle: boolean, fps: number): RainShadow {
  const s = createRainShadow(gentle); startRainShadow(s);
  for (let frame = 0; frame < fps * (RAIN_ROUND_COUNT * (RAIN_ROUND_SECONDS + rainPickupSeconds(s)) + 1) && s.phase === 'running'; frame++) {
    updateRainShadow(s, 1 / fps, rainTestInput(s));
  }
  return s;
}
for (const gentle of [false, true]) for (const fps of [30, 60]) {
  const s = play(gentle, fps);
  assert(s.phase === 'won' && s.marks === RAIN_ROUND_COUNT && s.total >= RAIN_ROUND_COUNT * RAIN_ROUND_SECONDS - .01,
    `读预警后可走通六折（gentle=${gentle},fps=${fps}），实际 ${JSON.stringify(s)}`);
  const end = JSON.stringify(s); updateRainShadow(s, .1, input);
  assert(end === JSON.stringify(s), '胜负结束后模拟不得继续受损或重复收光');
}
// Collision cooldown and no tunnelling through a moving rain front.
const hit = createRainShadow(); startRainShadow(hit); hit.collected = true;
hit.bands = [{ ...band, age: .96, from: 150, speed: 0, gap: 78 }]; hit.x = 160; hit.y = 150;
updateRainShadow(hit, .016, input); const hp = hit.health;
updateRainShadow(hit, .1, input); assert(hit.health === hp && hp === 4, '接触同一雨带不能逐帧扣纸笺');
// The second half reverses rain and relocates gaps, not merely a longer timer.
const patterns = Array.from({ length: RAIN_ROUND_COUNT }, (_, round) => {
  const s = createRainShadow(); s.round = round; startRainShadow(s);
  while (!s.bands.length && s.phase === 'running') updateRainShadow(s, .016, { ...input, target: rainWindow(s) });
  assert(s.bands.length > 0, '捡画后必须进入有雨的阶段');
  return s.bands[0];
});
assert(patterns[0].axis === 'y' && patterns[3].axis === 'y' && patterns[0].sign !== patterns[3].sign
  && patterns[0].gap !== patterns[3].gap, '第四折须改变纵雨方向与缺口');
assert(patterns[1].axis === 'x' && patterns[4].axis === 'x' && patterns[1].sign !== patterns[4].sign,
  '第五折须改变侧风来向');
assert(patterns[0].warning > patterns[5].warning && patterns[0].opening > patterns[5].opening
  && patterns[0].speed < patterns[5].speed, '第一折的教学雨势应宽缓于最后一折');
console.log('穿廊借影：主动开始、斜向速度、预警、缺口、护笺回气、受损保护、拖动限速、停留失败、暂停、两档30/60FPS六折胜利与不同雨势通过。');
const pickup = createRainShadow(); startRainShadow(pickup);
for (let i = 0; i < 150; i++) updateRainShadow(pickup, .016, input);
assert(!pickup.collected && pickup.bands.length === 0 && pickup.rainTime === 0 && pickup.health === 5,
  '猫拨画后，捡画前不能预告雨、计避雨时间或受损');
while (!pickup.collected && pickup.phase === 'running') updateRainShadow(pickup, .016, { ...input, target: rainWindow(pickup) });
assert(pickup.collected && pickup.rainTime < .02, '捡画要开始独立避雨计时');
for (let i = 0; i < 100; i++) updateRainShadow(pickup, .016, { ...input, target: rainWindow(pickup) });
assert(pickup.round === 0 && pickup.rainTime > 1.5 && pickup.bands.length > 0, '拖延捡画不得缩短避雨阶段');
const lateFailure = createRainShadow(); lateFailure.round = 5; lateFailure.marks = 5;
lateFailure.health = 1; lateFailure.roundStart.health = 1; startRainShadow(lateFailure);
while (lateFailure.phase === 'running') updateRainShadow(lateFailure, .016, input);
const lateRetry = retryRainShadow(lateFailure);
assert(lateRetry.round === 5 && lateRetry.marks === 5 && !lateRetry.collected && lateRetry.rainTime === 0,
  '末折捡画失败只重试末折，不能提前结束或重走前五折');
console.log('猫拨画稿：先捡画后避雨、拾起后完整计时、原地不拾失败与第六折重试通过。');
for (const gentle of [false, true]) for (const fps of [30, 60]) {
  const story = createRainShadow(gentle, true); startRainShadow(story);
  const axes = new Set<string>();
  const stages = new Set<number>();
  const spawned: Array<{ speed: number; opening: number; warning: number }> = [];
  for (let frame = 0; frame < fps * 20 && story.phase === 'running'; frame++) {
    const count = story.nextBand;
    updateRainShadow(story, 1 / fps, rainTestInput(story));
    for (const band of story.bands) axes.add(band.axis);
    if (story.nextBand > count) spawned.push(story.bands[story.bands.length - 1]);
    if (story.collected) stages.add(rainStoryStage(story));
  }
  assert(story.phase === 'won' && story.round === 0 && story.marks === 1 && story.rainTime >= rainDuration(story)
    && axes.size === 2 && stages.size === 3 && spawned.length === STORY_RAIN_WAVES.length && story.nextCat === STORY_CAT_BEATS.length,
    '花房单页事件：完整18秒、三个递进阶段、八阵雨、一次成功');
  assert(spawned[0].speed < spawned[2].speed && spawned[2].speed < spawned[4].speed
    && spawned[0].opening > spawned[2].opening && spawned[2].opening > spawned[4].opening
    && spawned[0].warning > spawned[2].warning && spawned[2].warning > spawned[4].warning,
    '三段难度的速度、雨缝和预告须渐进，缓雨档也保留渐进关系');
  const failed = createRainShadow(gentle, true); startRainShadow(failed);
  while (failed.phase === 'running') updateRainShadow(failed, 1 / fps, input);
  assert(retryRainShadow(failed).story, '故事事件重试不得退回六折');
}
console.log('花房现场事件：普通/缓雨、30/60FPS、18秒单页、三段递进八阵雨及重试模式通过。');
const unprotected = createRainShadow(false, true); startRainShadow(unprotected);
while (!unprotected.collected && unprotected.phase === 'running')
  updateRainShadow(unprotected, .016, { ...input, target: rainWindow(unprotected) });
while (unprotected.phase === 'running')
  updateRainShadow(unprotected, .016, { ...input, target: { x: 160, y: 157 } });
assert(unprotected.phase === 'lost' && unprotected.collected && unprotected.hits >= 3,
  '捡画后不读雨缝、不护画确实可能失败，不能自动熬过18秒');
const parkedGuard = createRainShadow(false, true); startRainShadow(parkedGuard);
while (!parkedGuard.collected && parkedGuard.phase === 'running')
  updateRainShadow(parkedGuard, .016, { ...input, target: rainWindow(parkedGuard) });
while (parkedGuard.phase === 'running') updateRainShadow(parkedGuard, .016, { ...input, guard: true });
assert(parkedGuard.phase === 'lost', '普通档留在拾画处长按护画，不应成为必胜解');
const slowSideRain = { ...band, axis: 'x' as const, sign: -1, from: 308, speed: 70, warning: 1.6 };
assert(rainBandLifetime(slowSideRain) > slowSideRain.warning + 3.7,
  '缓雨的侧雨必须走过全场，不能在远端提前消失');
console.log('难度反例：拾画处长按护画仍失败、缓雨侧雨完整覆盖、旧六折兼容通过。');
// The leap is locked, bounded and only dangerous while moving, never on warning/recovery.
const cat = { fromX: 30, fromY: 128, toX: 130, toY: 128, age: 0, warning: 1, speed: 200 };
assert(!rainCatHits(cat,30,128), '伏身预警不扣纸角');
cat.age=1.25;
assert(rainCatPosition(cat).x===80 && rainCatHits(cat,80,128) && !rainCatHits(cat,80,150),
  '猫扑位置对应8px碰撞，22px侧移可让开');
cat.age=1+rainCatDuration(cat);
assert(!rainCatHits(cat,130,128), '落地理爪不能继续接触扣血');
const contact = createRainShadow(false,true); startRainShadow(contact); contact.collected=true;
contact.x=80;contact.y=128;contact.shield=.6;
contact.cat={...cat,age:1.24};
updateRainShadow(contact,.016,input);
assert(contact.health===2 && contact.catHits===1 && contact.lastHit==='cat', '护画挡雨不挡猫，猫只蹭纸角');
const contactHP=contact.health;
updateRainShadow(contact,.1,input);
assert(contact.health===contactHP,'猫扑连续接触不能逐帧扣血');
pauseRainShadow(contact);const contactSnapshot=JSON.stringify(contact);
updateRainShadow(contact,1,input);
assert(JSON.stringify(contact)===contactSnapshot,'暂停冻结猫的目标、预告、扑近与雨');
const simultaneous=createRainShadow(false,true);startRainShadow(simultaneous);simultaneous.collected=true;
simultaneous.x=80;simultaneous.y=128;simultaneous.cat={...cat,age:1.24};
simultaneous.bands=[{axis:'y',from:128,sign:1,gap:230,opening:50,age:1,warning:.9,speed:0}];
updateRainShadow(simultaneous,.016,input);
assert(simultaneous.health===2&&simultaneous.hits===1,'雨猫同帧不能双扣');
const locked=createRainShadow(false,true);startRainShadow(locked);locked.collected=true;locked.rainTime=2.39;
updateRainShadow(locked,.016,input);assert(locked.cat,'首次猫扑必须发生');
const aim=[locked.cat.toX,locked.cat.toY];updateRainShadow(locked,.1,{x:1,y:0});
assert(locked.cat.toX===aim[0]&&locked.cat.toY===aim[1],'猫不能在预告后重新追踪或临时转弯');
assert(retryRainShadow({...contact,phase:'lost'}).cat===null && retryRainShadow({...contact,phase:'lost'}).nextCat===0,
  '重试清空猫与已生成次数');
console.log('猫扑：五次时序、两档30/60FPS可过、锁定不追踪、侧移、预告/落地无伤、护画边界、共享免伤、暂停及重试通过。');
for (const gentle of [false,true]) {
  const hpGame=createRainShadow(gentle,true);startRainShadow(hpGame);hpGame.collected=true;
  hpGame.x=78;hpGame.y=128;
  assert(hpGame.health===3 && rainHealthCapacity(hpGame)===3 && rainHitGrace(hpGame)===.6,
    '普通、缓雨都固定3HP和0.6秒受击保护');
  for (let hitIndex=0;hitIndex<3;hitIndex++) {
    if(hitIndex===1) hpGame.cat={fromX:58,fromY:128,toX:98,toY:128,age:1.09,warning:1,speed:200};
    else hpGame.bands=[{axis:'y',from:128,sign:1,gap:230,opening:50,age:1,warning:.9,speed:0}];
    updateRainShadow(hpGame,.016,input);
    assert(hpGame.health===2-hitIndex && hpGame.hits===hitIndex+1,
      '雨→猫→雨，每次恰好扣1HP，3→2→1→0');
    hpGame.bands=[];hpGame.cat=null;
    if(hitIndex<2) {
      assert(hpGame.phase==='running','1HP时仍可操作，不能提前失败');
      while(hpGame.invulnerable>0) updateRainShadow(hpGame,.016,input);
    }
  }
  assert(hpGame.phase==='lost'&&hpGame.health===0&&hpGame.result.includes('HP 0/3'),
    '第三次有效受击失败，HP不能为负，反馈明确');
  const ended=JSON.stringify(hpGame);updateRainShadow(hpGame,.1,input);
  assert(JSON.stringify(hpGame)===ended,'0HP结束后不能继续扣血');
  assert(retryRainShadow(hpGame).health===3 && retryRainShadow(hpGame,!gentle).health===3,
    '重试/切换缓雨不能额外加血');
}
console.log('3HP验收：两档都3HP，雨/猫/雨分别扣1，1HP可操作、0HP失败、结束冻结、重试与切档回满3通过。');
