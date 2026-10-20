import {createRainShadow,startRainShadow,updateRainShadow} from '../src/core/liuyuan-rain-shadow.js';
import {createRainAudio,rainAudioFrame,rainAudioEvents,type RainSound} from '../src/audio/rain-shadow-audio.js';
import {rainTestInput} from './rain-shadow-test-input.js';
function assert(v:unknown,message:string):asserts v {if(!v)throw new Error(message);}
for(const gentle of [false,true]) for(const fps of [30,60]) {
  const s=createRainShadow(gentle,true);startRainShadow(s);const counts=new Map<RainSound,number>();
  for(let i=0;i<fps*22&&s.phase==='running';i++) {
    const before=rainAudioFrame(s);updateRainShadow(s,1/fps,rainTestInput(s));
    const snapshot=JSON.stringify(s),after=rainAudioFrame(s),cues=rainAudioEvents(before,after);
    for(const cue of cues)counts.set(cue,(counts.get(cue)??0)+1);
    assert(snapshot===JSON.stringify(s),'声音观察器不得改计时、HP、输入或判定');
    assert(!rainAudioEvents(after,after).length,'同一帧不能重复发声');
  }
  assert(s.phase==='won'&&counts.get('pickup')===1&&counts.get('win')===1
    &&counts.get('cat-ready')===5&&counts.get('cat-leap')===5,
    '两档30/60FPS只拾画一次、预告/扑出各五次、胜利一次');
}
const paused=createRainShadow(false,true);paused.phase='paused';
assert(!rainAudioEvents(rainAudioFrame(paused),rainAudioFrame(paused)).length,'暂停不能发事件声音');

class Param { values:number[]=[];setValueAtTime(v:number){this.values.push(v);}linearRampToValueAtTime(v:number){this.values.push(v);}exponentialRampToValueAtTime(v:number){this.values.push(v);} }
class Osc {
  frequency=new Param();type='sine';onended:(()=>void)|null=null;active=false;disconnected=false;
  connect(){}disconnect(){this.disconnected=true;}start(){this.active=true;}
  stop(when?:number){if(when===undefined){this.active=false;this.onended?.();}}
}
class Gain {gain=new Param();connect(){}disconnect(){} }
class Context {
  state='suspended';currentTime=0;destination={};oscillators:Osc[]=[];gains:Gain[]=[];
  async resume(){this.state='running';}async suspend(){this.state='suspended';}
  createOscillator(){const o=new Osc();this.oscillators.push(o);return o;}
  createGain(){const g=new Gain();this.gains.push(g);return g;}
}
async function main() {
  let created=0;const ctx=new Context();
  const audio=createRainAudio(()=>{created++;return ctx as unknown as AudioContext;});
  audio.play('pickup');assert(created===0,'默认静音，不得自动创建音频上下文');
  assert(await audio.enable(true),'用户开启后才允许播放');
  audio.play('pickup');assert(ctx.oscillators.filter(o=>o.active).length===2,'拾画应有两段短音');
  for(let i=0;i<30;i++) {
    audio.play(i%2?'cat-ready':'rain');
    assert(ctx.oscillators.filter(o=>o.active).length<=10,'声音重叠须有上限');
  }
  assert(ctx.gains.every(g=>g.gain.values.every(v=>v<=.025)),'提示音量须克制，不放大到满幅');
  audio.pause();assert(ctx.state==='suspended'&&ctx.oscillators.every(o=>!o.active),'暂停即停所有已调度声音并挂起上下文');
  const total=ctx.oscillators.length;audio.play('win');assert(ctx.oscillators.length===total,'暂停不能继续出声');
  assert(await audio.enable(true),'用户继续可重新解锁');audio.play('win');
  await audio.enable(false);assert(ctx.oscillators.every(o=>!o.active),'关闭音效须停止成功尾音');
  audio.play('rain');assert(ctx.oscillators.every(o=>!o.active),'关闭后不得偷偷重开声音');
  const unavailable=createRainAudio(()=>undefined);assert(!await unavailable.enable(true),'不支持音频时安全降级');unavailable.play('pickup');
  const blocked=createRainAudio(()=>({...ctx,resume:async()=>{throw Error('blocked');}} as unknown as AudioContext));
  assert(!await blocked.enable(true),'浏览器拒绝播放须安全降级');

  const raceCtx=new Context();let release:()=>void=()=>{};
  raceCtx.resume=()=>new Promise<void>(resolve=>{release=()=>{raceCtx.state='running';resolve();};});
  const race=createRainAudio(()=>raceCtx as unknown as AudioContext);
  const pending=race.enable(true);await race.enable(false);release();await pending;
  race.play('pickup');assert(raceCtx.state==='suspended'&&!raceCtx.oscillators.length,
    '开声音尚未解锁就关闭，旧Promise不能让声音复活');
  console.log('轻音效：事件只读/去重、两档30/60FPS、默认静音/手势开启、低音量/声部上限、暂停/关闭即时停声、不可用降级和异步开关竞态通过。');
}
void main().catch(error=>{console.error(error);process.exitCode=1;});
