import { rainCatDuration, type RainShadow } from '../core/liuyuan-rain-shadow.js';

export type RainSound = 'pickup' | 'rain' | 'cat-ready' | 'cat-leap' | 'cat-land' | 'hit-rain' | 'hit-cat' | 'guard' | 'win' | 'lose';
/** Snapshot only: presentation never writes to the simulation or uses a gameplay timer. */
export function rainAudioFrame(s: Readonly<RainShadow>) {
  return { phase:s.phase, marks:s.marks, hits:s.hits, lastHit:s.lastHit, band:s.nextBand, cat:s.nextCat,
    catPhase:!s.cat?'none':s.cat.age<s.cat.warning?'aim'
      :s.cat.age<s.cat.warning+rainCatDuration(s.cat)?'leap':'land', guard:s.shield>0 };
}
export function rainAudioEvents(before: ReturnType<typeof rainAudioFrame>, after: ReturnType<typeof rainAudioFrame>): RainSound[] {
  if(before.phase!=='running') return [];
  if(after.phase==='lost') return ['lose'];
  if(after.phase==='won') return ['win'];
  if(after.phase!=='running') return [];
  if(after.hits>before.hits) return [after.lastHit==='cat'?'hit-cat':'hit-rain'];
  const cues: RainSound[]=[];
  if(after.marks>before.marks) cues.push('pickup');
  if(after.cat>before.cat && after.catPhase==='aim') cues.push('cat-ready');
  if(after.cat===before.cat && before.catPhase==='aim' && after.catPhase==='leap') cues.push('cat-leap');
  if(after.cat===before.cat && before.catPhase==='leap' && after.catPhase==='land') cues.push('cat-land');
  if(after.guard&&!before.guard) cues.push('guard');
  // Rain cues are quiet and subordinate to interaction/attack cues, not a continuous loop.
  if(after.band>before.band&&!cues.length) cues.push('rain');
  return cues;
}
type Note = readonly [number,number,number,number,OscillatorType]; // delay, Hz start/end, seconds, voice
const NOTES: Record<RainSound, readonly Note[]> = {
  pickup:[[0,660,760,.09,'sine'],[.08,880,880,.13,'sine']],
  rain:[[0,420,230,.08,'sine']],
  'cat-ready':[[0,540,690,.09,'sine'],[.085,690,480,.1,'sine']],
  'cat-leap':[[0,170,100,.1,'triangle']],
  'cat-land':[[0,440,380,.08,'sine']],
  'hit-rain':[[0,280,160,.13,'triangle']],
  'hit-cat':[[0,155,110,.15,'triangle']],
  guard:[[0,350,510,.1,'sine']],
  win:[[0,440,440,.14,'sine'],[.12,550,550,.14,'sine'],[.24,660,660,.18,'sine']],
  lose:[[0,240,180,.2,'sine']],
};

/** Original soft synth cues, no samples, network requests, music loop or automatic unlock. */
export function createRainAudio(factory: () => AudioContext | undefined = () => {
  const Ctor=window.AudioContext ?? (window as typeof window & {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
  return Ctor ? new Ctor() : undefined;
}) {
  let ctx: AudioContext | undefined, enabled=false, generation=0;
  const voices=new Set<{osc:OscillatorNode;gain:GainNode;release:()=>void}>();
  function stopVoices() {
    for(const voice of [...voices]) {
      try {voice.osc.stop();} catch { /* Already ended. */ }
      voice.release();
    }
  }
  function pause() {
    generation++;enabled=false;stopVoices();
    try {void ctx?.suspend().catch(()=>{});} catch { /* Audio is optional. */ }
  }
  async function enable(on: boolean): Promise<boolean> {
    if(!on) {pause();return false;}
    const request=++generation;enabled=true;
    try {
      ctx ??= factory();
      if(!ctx) {enabled=false;return false;}
      await ctx.resume();
      if(request!==generation) {
        if(!enabled) {try {await ctx.suspend();} catch {}}
        return false;
      }
      enabled=ctx.state==='running';return enabled;
    } catch {if(request===generation) {enabled=false;stopVoices();} return false;}
  }
  function play(cue: RainSound) {
    if(!enabled || !ctx || ctx.state!=='running') return;
    try {
      const now=ctx.currentTime;
      for(const [delay,start,end,duration,type] of NOTES[cue]) {
        // Bound polyphony and promptly disconnect on pause/off/end.
        if(voices.size>=10) {const first=voices.values().next().value!;try {first.osc.stop();} catch {} first.release();}
        const osc=ctx.createOscillator(),gain=ctx.createGain();
        const t=now+delay;
        osc.type=type;osc.frequency.setValueAtTime(start,t);osc.frequency.linearRampToValueAtTime(end,t+duration);
        gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(cue==='rain' ? .009 : .025,t+.01);
        gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
        osc.connect(gain);gain.connect(ctx.destination);
        const voice={osc,gain,release:()=>{osc.disconnect();gain.disconnect();voices.delete(voice);}};
        voices.add(voice);osc.onended=voice.release;
        osc.start(t);osc.stop(t+duration+.025);
      }
    } catch {pause();} // Unsupported audio must never stop animation/input.
  }
  return {enable,play,pause};
}
