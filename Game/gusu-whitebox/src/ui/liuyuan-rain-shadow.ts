import { createRainShadow, startRainShadow, retryRainShadow, pauseRainShadow, guardRainShadow, updateRainShadow,
  RAIN_ROUND_NAMES, rainRoundCount, rainHealthCapacity, RAIN_ROUND_TIPS, rainSecondsLeft,
  rainStoryStage, STORY_RAIN_STAGES, type RainInput, type RainShadow } from '../core/liuyuan-rain-shadow.js';
import { drawRainViewport, RAIN_VIEWPORT, rainDragDelta } from '../render/rain-shadow-viewport.js';
import { drawRainAlbum, rainAlbumState, RAIN_DRAWING_NAMES } from '../render/rain-shadow-vignettes.js';
import { createRainAudio, rainAudioFrame, rainAudioEvents } from '../audio/rain-shadow-audio.js';

export function createRainShadowUI(onWin: (state: Readonly<RainShadow>) => void, onLeave: (state: Readonly<RainShadow>) => void, story = false) {
  const node = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const arena = node<HTMLCanvasElement>('rainArena');
  arena.width=RAIN_VIEWPORT.width;arena.height=RAIN_VIEWPORT.height;
  const ctx = arena.getContext('2d')!;
  const album = node<HTMLCanvasElement>('rainAlbum');
  const albumCtx = album.getContext('2d')!;
  const quiet = node<HTMLInputElement>('rainQuiet');
  const sound=node<HTMLInputElement>('rainSound'),soundStatus=node<HTMLElement>('rainSoundStatus');
  const audio=createRainAudio();let soundRevision=0;
  quiet.checked = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  const scholar = new Image(); scholar.src = '../assets/characters/scholar-player-sprites-v1.png';
  // Generated art candidates belong to the explicitly isolated local playtest,
  // not the historical scene/editor plate or the public chapter package.
  const artParams=new URLSearchParams(location.search);
  const backdrop=artParams.get('playtest')==='1'?new Image():undefined;
  const foreground=backdrop?new Image():undefined;
  if(foreground) foreground.src='../research-art/rain-bamboo-foreground-v1.png';
  const artStatus=node<HTMLElement>('rainArtStatus');
  artStatus.hidden=!backdrop;
  if(backdrop) {
    backdrop.src='../research-art/rain-bamboo-open-blank-v4.png';
    artStatus.textContent='画境美术试作：借墨竹风雨的笔意，不是留园实景复原。雨丝之间的小空白不挡雨，纸伞与两侧短叶提示可避雨位置。';
    backdrop.addEventListener('error',()=>{artStatus.textContent='背景候选暂未载入，使用简化画面；走位与雨缝提示不受影响。';});
  }
  const action = node<HTMLButtonElement>('rainAction');
  const pause = node<HTMLButtonElement>('rainPause');
  const gentle = node<HTMLInputElement>('rainGentle');
  const feedback = node<HTMLElement>('lanternFeedback');
  const hud = node<HTMLElement>('rainHud');
  const keys = new Set<string>();
  const touches = new Map<string, Set<number>>();
  let s: RainShadow = createRainShadow();
  let open = false;
  let pointer: { id: number; x: number; y: number; playerX: number; playerY: number } | null = null;
  let target: RainInput['target'];
  let previousStatus = '';
  const clear = () => { keys.clear(); touches.clear(); pointer = null; target = undefined; };
  const silence=()=>{soundRevision++;audio.pause();};
  async function unlockSound() {
    const revision=++soundRevision,requested=sound.checked;
    const ok=await audio.enable(requested);
    if(revision!==soundRevision) return;
    soundStatus.hidden=ok || !requested;
    if(!ok && requested) {
      sound.checked=false;soundStatus.textContent='此浏览器暂未开启声音；走位与提示不受影响。';
    }
  }
  function render() {
    drawRainViewport(ctx, s, scholar, quiet.checked,backdrop,foreground);
    drawRainAlbum(albumCtx, s, quiet.checked);
    album.hidden=s.phase!=='won';
    const stage = rainStoryStage(s);
    hud.textContent = `${s.story ? '雨中抢画' : RAIN_ROUND_NAMES[s.round]} · ${s.collected ? s.story ? `${stage+1}/3 ${STORY_RAIN_STAGES[stage].name}` : '护画避雨' : '先捡画稿'} ${rainSecondsLeft(s)} 秒 · HP ${s.health}/${rainHealthCapacity(s)} · 拾回 ${s.marks}/${rainRoundCount(s)} · ${s.cooldown > 0 ? '撑伞回气中' : '撑稳伞可用'}`;
    action.textContent = s.phase === 'ready' ? s.story ? '抢回画稿' : s.round === 0 ? '开始穿廊' : '开始这一折' : s.phase === 'paused' ? s.story ? '继续抢画' : '继续这一折'
      : s.phase === 'lost' ? '再试一回' : s.phase === 'won' ? '收好画稿' : s.story ? '正在护画' : '正在穿廊';
    action.disabled = s.phase === 'running'; pause.hidden = s.phase !== 'running';
    gentle.disabled = s.phase !== 'ready' && s.phase !== 'lost';
    const catStatus = s.cat ? s.cat.age < s.cat.warning ? 'aim' : 'leap' : '';
    const status = `${s.phase}:${s.round}:${s.health}:${s.marks}:${s.invulnerable > 0}:${stage}:${catStatus}:${s.nextCat}`;
    if (status !== previousStatus) {
      previousStatus = status;
      const progress = rainAlbumState(s);
      album.setAttribute('aria-label', s.story ? `兰稿：${progress.complete ? '已护好，待确认收好' : progress.held !== null ? '在手中，正在避雨' : '待拾起'}`
        : `画稿册：已护好 ${progress.complete}/${rainRoundCount(s)} 页${progress.held !== null ? `，${RAIN_DRAWING_NAMES[progress.held]}在手中` : ''}`);
      feedback.textContent = s.phase === 'ready' ? `${s.story ? '持伞去救画；斜雨会从伞侧打来，X撑稳伞短时护画。3 HP：淋雨或被猫扑中，都扣 1 HP。' : ''}先拾画，再避雨；亮处不挡雨。${s.story ? '猫伏身时锁定扑向，侧移让开；伞挡雨不挡猫。' : '猫把练习画稿拨落了。'}`
        : s.phase === 'paused' ? '时间已停。准备好再继续，不会在切换页面时淋湿画稿。'
        : s.phase === 'won' || s.phase === 'lost' ? s.result
        : `${s.collected ? `画稿已拾起。${catStatus === 'aim' ? '猫伏身了！地面猫影预示扑向，侧移让开，不会追着转弯。' : s.story ? STORY_RAIN_STAGES[stage].tip : RAIN_ROUND_TIPS[s.round]}` : `${s.story ? '兰稿被猫拨落了。' : '猫又拨落一页。'}走到标着“捡画”的金色位置；这时还没有雨。`}${s.hits > 0 && s.invulnerable > 0 ? s.lastHit === 'cat' ? ' 猫扑中！HP −1，短暂受击保护。' : ' 淋雨！HP −1，短暂受击保护。' : ''}`;
    }
  }
  function activate() {
    if (!open) return;
    if (s.phase === 'won') { open = false; clear(); silence(); onWin(s); return; }
    if (s.phase === 'lost') s = retryRainShadow(s, gentle.checked);
    if (s.phase === 'paused') s.phase = 'running'; else startRainShadow(s);
    if(sound.checked) void unlockSound(); // Only called by a keyboard/button gesture.
    clear(); render();
  }
  action.addEventListener('click', activate);
  quiet.addEventListener('change', render); // Cosmetic only: no input reset or simulation writes.
  sound.addEventListener('change',()=>{void unlockSound();});
  pause.addEventListener('click', () => { pauseRainShadow(s); clear(); silence(); render(); });
  gentle.addEventListener('change', () => { if (s.phase === 'ready' || s.phase === 'lost') { s = retryRainShadow(s, gentle.checked); render(); } });
  node('lanternLeave').addEventListener('click', () => { if (open) { open = false; clear(); silence(); onLeave(s); } });
  function bindHold(button: HTMLElement, direction: string) {
    button.addEventListener('pointerdown', (e) => {
      if (!open || s.phase !== 'running') return;
      e.preventDefault(); button.setPointerCapture(e.pointerId);
      const held = touches.get(direction) ?? new Set<number>();
      held.add(e.pointerId); touches.set(direction, held);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, (e) => {
      const held = touches.get(direction);
      held?.delete((e as PointerEvent).pointerId);
      if (!held?.size) touches.delete(direction);
    });
  }
  bindHold(node('rainGuard'), 'guard');
  node('rainGuard').addEventListener('click', () => { if (open) { const held=s.shield>0;guardRainShadow(s);if(!held&&s.shield>0) audio.play('guard');render(); } });
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-rain-dir]')) {
    bindHold(b, b.dataset.rainDir!);
  }
  // Relative drag: no teleporting to the pointer. Simulation keeps movement speed bounded.
  arena.addEventListener('pointerdown', (e) => {
    if (!open || s.phase !== 'running' || pointer) return;
    e.preventDefault(); arena.setPointerCapture(e.pointerId);
    pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, playerX: s.x, playerY: s.y };
  });
  arena.addEventListener('pointermove', (e) => {
    if (!pointer || pointer.id !== e.pointerId) return;
    const r = arena.getBoundingClientRect();
    const delta=rainDragDelta(e.clientX-pointer.x,e.clientY-pointer.y,r.width,r.height);
    target = { x: pointer.playerX + delta.x, y: pointer.playerY + delta.y };
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) arena.addEventListener(type, (e) => {
    if (pointer?.id !== (e as PointerEvent).pointerId) return;
    pointer = null; target = undefined;
  });
  window.addEventListener('blur', () => { if (open) { pauseRainShadow(s); clear(); silence(); render(); } });
  // Visibility can change without a window blur on some mobile browsers.
  document.addEventListener?.('visibilitychange', () => { if (open && document.hidden) { pauseRainShadow(s); clear(); silence(); render(); } });
  window.addEventListener('pagehide',silence);
  const direction: Record<string, string> = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', ' ': 'guard', x: 'guard' };
  return {
    show() { silence();open = true; s = createRainShadow(gentle.checked, story); previousStatus = ''; clear(); render(); action.focus?.(); },
    close() { open = false; clear(); silence(); },
    keyDown(key: string, repeat: boolean) {
      if (!open) return;
      if (key === 'Enter' && !repeat) activate();
      else if ((key === 'Escape' || key.toLowerCase() === 'p') && !repeat) {
        if (s.phase === 'paused') activate(); else { pauseRainShadow(s); clear(); silence(); render(); }
      } else if (s.phase === 'running' && direction[key.toLowerCase()]) keys.add(key.toLowerCase());
    },
    keyUp(key: string) { keys.delete(key.toLowerCase()); },
    tick(dt: number) {
      if (!open) return;
      const active = (d: string) => [...keys].some((key) => direction[key] === d) || touches.has(d);
      const before=rainAudioFrame(s);
      updateRainShadow(s, dt, { x: Number(active('right')) - Number(active('left')),
        y: Number(active('down')) - Number(active('up')), guard: active('guard'), target });
      for(const cue of rainAudioEvents(before,rainAudioFrame(s))) audio.play(cue);
      render();
    },
  };
}
