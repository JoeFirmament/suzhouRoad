import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { buildFuxueMap, HOME_INTERACTIONS } from '../src/data/fuxue.js';
import { FUXUE_ACTOR_PROFILE } from '../src/data/fuxue-geometry.js';
import { collides } from '../src/core/physics.js';

const page=readFileSync('home.html','utf8');
function boot(search:string,storage:Map<string,string>) {
  const events=new Map<string,((event:any)=>void)[]>(),frames:((time:number)=>void)[]=[];
  const nodes=new Map<string,any>();
  let now=0,cam=[0,0],foot=[0,0];
  const context:any=new Proxy({}, {get:(obj,key)=>key in obj ? obj[key] : key==='drawImage'
    ? (img:any,...args:number[])=>{
      if(img.src.includes('fuxue-west-home'))cam=[-args[4],-args[5]];
      if(img.src.includes('scholar-player'))foot=[args[4]+9+cam[0],args[5]+23+cam[1]];
    } : key==='measureText' ? ()=>({width:0}) : ()=>{}});
  const doc:any={activeElement:null,hidden:false};
  function element(){
    const handlers=new Map<string,((event:any)=>void)[]>();
    const children:any[]=[];
    const node:any={hidden:false,disabled:false,textContent:'',dataset:{},children,
      classList:{toggle(){},remove(){}},addEventListener:(type:string,fn:any)=>handlers.set(type,[...handlers.get(type)??[],fn]),
      dispatch:(type:string,event:any={})=>{for(const fn of handlers.get(type)??[])fn(event);},
      click:()=>{if(!node.disabled)node.dispatch('click');},focus:()=>{doc.activeElement=node;},
      getContext:()=>context,append:(...items:any[])=>children.push(...items),prepend(){},
      replaceChildren:(...items:any[])=>{children.splice(0,children.length,...items);},
      setPointerCapture(){},setAttribute(){},
      querySelector:()=>children[0]??element(),querySelectorAll:()=>[],
    };return node;
  }
  for(const tag of page.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)){
    const node=element();node.hidden=/\bhidden\b/.test(tag[0]);node.disabled=/\bdisabled\b/.test(tag[0]);nodes.set(tag[1],node);
  }
  const touch=element(),moves=new Map<string,any>();
  for(const name of ['w','a','s','d']){const node=element();node.dataset.move=name;moves.set(name,node);}
  const interact=element(),cancel=element();
  touch.querySelectorAll=(selector:string)=>selector==='[data-move]'?[...moves.values()]:[];
  touch.querySelector=(selector:string)=>selector.includes('interact')?interact:cancel;
  doc.getElementById=(id:string)=>nodes.get(id)??null;
  doc.createElement=element;doc.querySelector=(selector:string)=>selector==='[data-touch-controls]'?touch:element();
  const addEventListener=(type:string,fn:any)=>events.set(type,[...events.get(type)??[],fn]);
  doc.addEventListener=addEventListener;
  class FakeImage{complete=true;naturalWidth=960;naturalHeight=640;src='';}
  const script=page.match(/src="(dist\/home\.js)(?:\?[^"]*)?"/)![1];
  runInNewContext(readFileSync(script,'utf8'),{document:doc,window:{addEventListener},addEventListener,
    location:{search,assign(){}},Image:FakeImage,URLSearchParams,structuredClone,console,
    localStorage:{getItem:(key:string)=>storage.get(key)??null,setItem:(key:string,value:string)=>storage.set(key,value)},
    performance:{now:()=>now},requestAnimationFrame:(fn:any)=>{frames.push(fn);return frames.length;},cancelAnimationFrame(){},
  });
  function frame(count=1){for(let i=0;i<count;i++){now+=16;const fn=frames.shift();assert(fn);fn(now);}}
  function key(name:string,type='keydown'){for(const fn of events.get(type)??[])fn({key:name,repeat:false,preventDefault(){}});}
  function move(name:string,down:boolean,input:string){
    if(input==='keyboard')key(name,down?'keydown':'keyup');
    else moves.get(name).dispatch(down?'pointerdown':'pointerup',{pointerId:1,preventDefault(){}});
  }
  frame();return {nodes,frame,key,move,interact,cancel,foot:()=>[...foot]};
}

const map=buildFuxueMap(),book=HOME_INTERACTIONS.find(item=>item.id==='bookcase')!;
function route(){
  const start=[map.spawn.x,map.spawn.y],queue=[start],parents=new Map<string,number>();parents.set(start.join(),-1);
  for(let cursor=0;cursor<queue.length;cursor++){
    const [x,y]=queue[cursor];
    if(Math.hypot(x-book.x,y-book.y)<12){
      const path:number[][]=[];for(let i=cursor;i>=0;i=parents.get(queue[i].join())!)path.unshift(queue[i]);
      return path.filter((point,i)=>i===0||i===path.length-1||
        point[0]-path[i-1][0]!==path[i+1][0]-point[0]||point[1]-path[i-1][1]!==path[i+1][1]-point[1]);
    }
    for(const [dx,dy] of [[4,0],[-4,0],[0,4],[0,-4]]){
      const next=[x+dx,y+dy],id=next.join();
      if(!parents.has(id)&&[-2,0,2].every(ox=>[-2,0,2].every(oy=>!collides(map.map,next[0]+ox,next[1]+oy,map.w,map.h,map.obstacles,FUXUE_ACTOR_PROFILE)))){
        parents.set(id,cursor);queue.push(next);
      }
    }
  }throw new Error('书架不可达，记录空间问题，不自动改几何');
}
export function runHomeReturn(savedJson: string, input: 'keyboard' | 'touch', search: string): string {
  const playtest = new URLSearchParams(search).get('playtest') === '1';
  const saveKey = playtest ? 'gusu-nine-gardens-liuyuan-playtest-v1' : 'gusu-nine-gardens-rpg-v1';
  const otherKey = playtest ? 'gusu-nine-gardens-rpg-v1' : 'gusu-nine-gardens-liuyuan-playtest-v1';
  const storage = new Map<string,string>([[saveKey,savedJson],[otherKey,'other-mode sentinel']]);
  let home=boot(search,storage);
  assert(home.nodes.get('homeObjective').textContent.includes('核一核'));
  for(const [x,y] of route().slice(1)){
    let held='';
    for(let i=0;i<800;i++){
      const [px,py]=home.foot();if(Math.hypot(x-px,y-py)<2)break;
      const name=Math.abs(x-px)>=Math.abs(y-py)?x>px?'d':'a':y>py?'s':'w';
      if(held!==name){if(held)home.move(held,false,input);home.move(name,true,input);held=name;}
      home.frame();assert(i<799,`行走卡住 ${home.foot()} → ${x},${y}`);
    }if(held)home.move(held,false,input);
  }
  assert(!home.nodes.get('interactionPrompt').hidden);
  const nearFoot=home.foot();
  if(input==='keyboard')home.key('e');else home.interact.dispatch('pointerdown',{preventDefault(){}});
  assert.equal(home.nodes.get('homeVariant').hidden,false,'未拾其他旧书也能直接核本');
  home.move('d',true,input);home.frame(25);assert.deepEqual(home.foot(),nearFoot,'核本时冻结世界行走');
  if(input==='keyboard'){home.key('2');home.key('1');home.key('3');home.key('Escape');}
  else{for(const id of ['readVariantBook','readVariantLeaf','recordVariant','closeVariant'])home.nodes.get(id).click();}
  home.frame(10);assert.deepEqual(home.foot(),nearFoot,'关闭弹层清掉按住的方向，不漂移');
  const after=JSON.parse(storage.get(saveKey)!);
  assert.equal(after.knowledge.filter((id:string)=>id==='liuyuan-garden-note-collated').length,1);
  assert.deepEqual(after.arts, JSON.parse(savedJson).arts, '核本不能重发或改变六艺');
  assert.deepEqual(after.storyFlags, JSON.parse(savedJson).storyFlags, '府学核本不得补造章节或府学前置事件');
  assert.equal(storage.get(otherKey), 'other-mode sentinel');
  assert.equal(home.nodes.get('homeJournal').href, `journal.html?chapter=1${playtest ? '&playtest=1' : ''}`);
  const beforeReload=storage.get(saveKey);home=boot(search,storage);
  assert(!home.nodes.get('homeObjective').textContent.includes('核一核'),'刷新已核记录不再催核本');
  assert.equal(storage.get(saveKey),beforeReload,'刷新 Home 不重复保存或奖励');
  return storage.get(saveKey)!;
}

export function verifyHomeEntryModes(completedJson: string): void {
  const fresh = JSON.parse(completedJson);
  fresh.storyFlags=[]; fresh.knowledge=[]; fresh.completedTasks=[];
  fresh.gardens.liuyuan='locked';
  const initial = boot('', new Map([['gusu-nine-gardens-rpg-v1',JSON.stringify(fresh)]]));
  assert(!initial.nodes.get('homeDialogue').hidden, '真正初到府学仍须有沈砚秋的入院对白');
  const returning = boot('', new Map([['gusu-nine-gardens-rpg-v1',completedJson]]));
  assert(returning.nodes.get('homeDialogue').hidden, '完成留园后返回不能重播第一次入学');
  const forced = boot('?scene=arrival',new Map([['gusu-nine-gardens-rpg-v1',completedJson]]));
  assert(!forced.nodes.get('homeDialogue').hidden, '明确指定初到研究场仍能回看原对白');
}
