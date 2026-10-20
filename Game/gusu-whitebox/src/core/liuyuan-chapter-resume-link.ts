import { hasStoryFlag, type ProgressData } from './progression.js';

/** Bookmarks only resume committed story stages; no flags or rewards are granted. */
export function liuyuanChapterResumeLink(progress: ProgressData, search: string): {href:string;label:string}|null {
  const current=new URLSearchParams(search);
  if(current.get('returnStudy')==='1' || current.get('return')==='1' || hasStoryFlag(progress,'ly-unlocked'))return null;
  const flag=(id:Parameters<typeof hasStoryFlag>[1])=>hasStoryFlag(progress,id);
  let page:string, label:string, query:URLSearchParams;
  if(flag('ly-leaf-carried')) {
    page='liuyuan-entry.html';label='继续返程 · 将空桶交还乔禾';query=new URLSearchParams({route:'modern',from:'flower',return:'1'});
  } else if(flag('ly-leaf-written')) {
    page='liuyuan-study-court.html';label='叶上字已写好 · 回去取空桶';query=new URLSearchParams({route:'modern',from:'leaf',return:'1'});
  } else if(flag('ly-leaf-picked')) {
    page='liuyuan-leaf-writing-study.html';label='继续题叶 · 接续临写';query=new URLSearchParams({route:'modern',from:'study-interior'});
  } else if(flag('ly-study-found')) {
    page='liuyuan-study-interior.html';label='继续书斋里的托付';query=new URLSearchParams({route:'modern',from:'study-court'});
  } else if(flag('ly-porridge-delivered')) {
    page='liuyuan-east-hall.html';label='粥已送到 · 继续寻找书斋';query=new URLSearchParams({route:'modern',from:'flower'});
  } else if(flag('ly-alley-walked')) {
    page='liuyuan-flower.html';label='继续送粥 · 去花房檐下';query=new URLSearchParams({chapter:'1'});
  } else return null;
  if(current.get('draft')==='1')query.set('draft','1');
  if(current.get('playtest')==='1')query.set('playtest','1');
  return {href:`${page}?${query}`,label};
}
