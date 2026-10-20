import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { LIUYUAN_CHAPTER_FLAGS } from '../src/core/liuyuan-progression.js';
const markup=readFileSync('sucheng.html','utf8');
function boot(search:string,heard:boolean,completed=true){
  const progress={version:1,arts:{li:0,yue:0,she:0,yu:0,shu:1,shuMath:0},gardens:{liuyuan:'complete'},
    storyFlags:completed?[...LIUYUAN_CHAPTER_FLAGS]:[],completedTasks:[],
    knowledge:heard?['liuyuan-magnolia-slip']:[],updatedAt:1};
  const links=[...markup.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(match=>({href:match[1],getAttribute(){return this.href;}}));
  const nodes=new Map<string,any>();
  for(const match of markup.matchAll(/\bid="([^"]+)"/g))nodes.set(match[1],{hidden:false,textContent:''});
  const key=search.includes('playtest=1')?'gusu-nine-gardens-liuyuan-playtest-v1':'gusu-nine-gardens-rpg-v1';
  const storage=new Map([[key,JSON.stringify(progress)]]),before=JSON.stringify([...storage]);
  runInNewContext(readFileSync('dist/world.js','utf8'),{location:{search},URLSearchParams,structuredClone,
    localStorage:{getItem:(id:string)=>storage.get(id)??null,setItem:(id:string,value:string)=>storage.set(id,value)},
    document:{getElementById:(id:string)=>nodes.get(id),querySelector:()=>null,
      querySelectorAll:(selector:string)=>selector==='a[href]'?links:selector==='a[href="garden.html"]'?links.filter(link=>link.href==='garden.html'):[]}});
  assert.equal(JSON.stringify([...storage]),before,'城图回响和链接不能改存档/奖励');
  return {links,nodes};
}
for(const heard of [false,true]){
  const state=boot('?chapter=1&playtest=1',heard);
  assert(!state.nodes.get('liuyuanJourney').hidden);
  assert.equal(state.nodes.get('liuyuanJourneyWords').textContent.includes('笔树'),heard,'城图回响必须依真实听话记忆');
  for(const path of ['home.html','journal.html','liuyuan-entry.html','garden.html'])
    assert(state.links.filter(link=>link.href.startsWith(path)).every(link=>link.href.includes('playtest=1')),'核心去向必须保留试玩槽');
}
const prologue=boot('?scene=prologue&playtest=1',false);
assert(prologue.links.some(link=>link.href==='garden.html?scene=arrival&playtest=1'),'试玩参数不能覆盖序章回看来源');
const campaign=boot('',false);
assert(campaign.links.every(link=>!link.href.includes('playtest=1')),'正式城图不能擅自切为试玩');
assert(boot('',false,false).nodes.get('liuyuanJourney').hidden,'未完成不能出现已还桶回响');
console.log('城图留园回响：听话/自主路径、完成可见、去向试玩参数、序章参数保留与只读通过。');
