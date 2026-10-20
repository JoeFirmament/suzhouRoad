import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { createVariantCollation } from '../src/ui/liuyuan-variant-collation.js';
import { loadProgress, saveProgress } from '../src/core/progression.js';
import { LIUYUAN_VARIANT_COLLATED } from '../src/core/liuyuan-variant-collation.js';
import { Engine } from '../src/core/engine.js';

const storage=new Map<string,string>();
Object.assign(globalThis,{location:{search:'?playtest=1'},localStorage:{
  getItem:(key:string)=>storage.get(key)??null,
  setItem:(key:string,value:string)=>storage.set(key,value),
}});
const nodes=new Map<string,any>();
const doc:any={activeElement:null,getElementById:(id:string)=>nodes.get(id)};
for (const id of ['homeVariant','collationBook','collationLeaf','collationResult',
  'readVariantBook','readVariantLeaf','recordVariant','closeVariant','otherVariantBooks']) {
  assert(readFileSync('home.html','utf8').includes(`id="${id}"`),`缺少核本组件 ${id}`);
  const listeners:Record<string,(()=>void)[]>={};
  const node:any={hidden:true,disabled:false,textContent:'',
    addEventListener:(event:string,fn:()=>void)=>{(listeners[event]??=[]).push(fn);},
    click:()=>{if(!node.disabled)for(const fn of listeners.click??[])fn();},
    focus:()=>{doc.activeElement=node;}};
  nodes.set(id,node);
}
Object.assign(globalThis,{document:doc});
let closed=0,other=0;
const ui=createVariantCollation(()=>closed++,()=>other++);
const key=(name:string,repeat=false)=>ui.key({key:name,repeat,preventDefault(){}} as KeyboardEvent);
ui.show();assert.equal(ui.open,false,'未完成留园不开放核本');
const progress=loadProgress();
progress.storyFlags.push('ly-leaf-written','ly-unlocked');saveProgress(progress);
const before=JSON.stringify(loadProgress());
ui.show();assert.equal(ui.open,true);
assert.equal(nodes.get('recordVariant').disabled,true);
key('3');assert.equal(JSON.stringify(loadProgress()),before,'尚未展开不能存一个虚假核本记录');
key('2');assert(nodes.get('collationLeaf').textContent.includes('景异'));
key('1');assert(nodes.get('collationBook').textContent.includes('景同'));
assert.equal(nodes.get('recordVariant').disabled,false,'两种顺序均可读完');
key('3',true);assert.equal(JSON.stringify(loadProgress()),before,'长按不能自动结算');
key('3');
const recorded=loadProgress();
assert.equal(recorded.knowledge.filter(id=>id===LIUYUAN_VARIANT_COLLATED).length,1);
assert.deepEqual(recorded.arts,progress.arts,'读两句不发六艺');
assert.deepEqual(recorded.storyFlags,progress.storyFlags,'核本不改主章旗标');
assert(nodes.get('collationResult').textContent.includes('仍待查'));
const after=JSON.stringify(recorded);
key('3');assert.equal(JSON.stringify(loadProgress()),after,'重复确认不刷新存档');
key('Escape');assert.equal(closed,1);assert.equal(ui.open,false);
ui.show();assert(nodes.get('collationBook').textContent.includes('景同'),'重开已核记录可看原文');
nodes.get('otherVariantBooks').click();assert.equal(other,1);assert.equal(ui.open,false);
(globalThis as any).location.search='';
ui.show();assert.equal(ui.open,false,'试玩核本不能污染正式槽');
assert.equal(loadProgress().knowledge.includes(LIUYUAN_VARIANT_COLLATED),false);
(globalThis as any).location.search='?playtest=1';
ui.show();assert.equal(JSON.stringify(loadProgress()),after);
const events=new Map<string,(event:any)=>void>();
Object.assign(globalThis,{addEventListener:(type:string,handler:(event:any)=>void)=>events.set(type,handler)});
const engine=new Engine();engine.attachKeys();
events.get('keydown')!({key:'ArrowRight',repeat:false,preventDefault(){}});
assert.equal(engine.axis().dx,1);
engine.clearInput();assert.deepEqual(engine.axis(),{dx:0,dy:0},'关核本弹层须丢弃残留移动输入');
console.log('府学核本组件：入口资格、双向阅读、禁提前保存、键盘/按钮、只读回看、无艺与分槽通过。');
