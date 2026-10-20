import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SCENE_DRAFT_PREVIEWS, SCENE_PLATES } from '../src/data/scene-plates.js';
import { SCENE_EVIDENCE } from '../src/data/scene-evidence.js';
import { SCENE_RESEARCH_CANDIDATES } from '../src/data/scene-research-candidates.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const ids = new Set<string>();
for (const plate of SCENE_PLATES) {
  assert(!ids.has(plate.id), `编辑器场景 ID 重复：${plate.id}`);
  ids.add(plate.id);
  assert(existsSync(resolve(process.cwd(), plate.asset)), `编辑器底图不存在：${plate.id} → ${plate.asset}`);
  const evidence = SCENE_EVIDENCE.find((item) => item.id === plate.id);
  assert(evidence && evidence.sources.length && evidence.redLines.length,
    `编辑器场景缺年代／来源／制作红线：${plate.id}`);
}
for (const [id, preview] of Object.entries(SCENE_DRAFT_PREVIEWS)) {
  assert(ids.has(id), `草稿预览缺编辑器场景：${id}`);
  assert(preview.href.includes('draft=1'), `试玩链接不读取草稿：${id}`);
  assert(existsSync(resolve(process.cwd(), preview.href.split('?')[0])), `试玩页不存在：${preview.href}`);
}
const researchIds = new Set<string>();
for (const candidate of SCENE_RESEARCH_CANDIDATES) {
  assert(!researchIds.has(candidate.id), `RAG 候选 ID 重复：${candidate.id}`);
  researchIds.add(candidate.id);
  assert(ids.has(candidate.sceneId), `RAG 候选无对应编辑器场景：${candidate.id}`);
  assert(candidate.review === 'pending' && candidate.imageRights === 'unreviewed',
    `未经人工审核的 RAG 候选不得升格为游戏素材：${candidate.id}`);
  assert(existsSync(resolve(process.cwd(), candidate.localPath)),
    `RAG 候选源文件不存在：${candidate.id}`);
  if (candidate.studyAsset) assert(existsSync(resolve(process.cwd(), candidate.studyAsset)),
    `RAG 候选研究图不存在：${candidate.id}`);
  if (candidate.studyPage) assert(existsSync(resolve(process.cwd(), candidate.studyPage)),
    `RAG 候选试玩页不存在：${candidate.id}`);
}
for (const id of [
  'canglang-corridor',
  'liuyuan-entrance-topology-study',
  'liuyuan-entry-gate-style-study-v1',
  'liuyuan-entry-gate-misty-study-v2',
  'liuyuan-entry-oblique-shot-study-v1',
  'liuyuan-entry-lower-camera-study-v1',
  'liuyuan-alley-misty-study-v1',
  'liuyuan-tree-court-no-water-study-v1',
  'liuyuan-lvyin-pond-study-v1',
  'liuyuan-lvyin-pond-pixel-study-v2',
  'liuyuan-flower-work-yard-study-v3',
  'liuyuan-youyicun-transition-study-v1',
  'liuyuan-stone-forest-court-study-v1',
  'liuyuan-study-court-research-v1',
  'liuyuan-study-interior-research-v1',
  'liuyuan-dongtian-three-windows-study-v1',
  'liuyuan-guanyun-court-study-v2',
]) assert(ids.has(id), `在制场景或研究底图未进入编辑器：${id}`);
assert(!Object.hasOwn(SCENE_DRAFT_PREVIEWS, 'liuyuan-entry-gate-style-study-v1')
  && !existsSync('liuyuan-entry-gate-study.html')
  && !existsSync('src/liuyuan-entry-gate-study.ts'),
  '风格未通过的门外研究稿不得提供试玩页或被误计为章节场景');
assert(SCENE_PLATES.find((plate) => plate.id === 'liuyuan-entrance-topology-study')?.asset
  === '../assets/scene25d/liuyuan-entrance-walkable-study-v2.svg',
  '入口编辑器与试玩页须使用同一张可见底图');
const entrySource = readFileSync('src/liuyuan-entry.ts', 'utf8');
const runtimeAsset = entrySource.match(/background\.src = '([^']+)';/)?.[1]?.split('?')[0];
assert(runtimeAsset === SCENE_PLATES.find((plate) => plate.id === 'liuyuan-entrance-topology-study')?.asset,
  '入口试玩底图路径必须与编辑器场景资产一致（浏览器缓存参数不改变资产身份）');
assert(!readFileSync('src/liuyuan-entry.ts', 'utf8').includes("ctx.fillRect(80, 25, 250, 125)"),
  '入口新底图不应被旧版遮池整块色幕覆盖');
assert(!SCENE_PLATES.some((plate) => plate.asset.includes('liuyuan-flower-work-yard-study-v2.png')
  || plate.asset.includes('liuyuan-guanyun-court-concept-v0-rejected.png')),
  '已否决图不得重新进入场景编辑清单');
console.log(`编辑器目录：${SCENE_PLATES.length} 张场景底图、${Object.keys(SCENE_DRAFT_PREVIEWS).length} 个可读取草稿的试玩页、${researchIds.size} 条待核 RAG 资料；路径与拒用稿检查通过。`);
