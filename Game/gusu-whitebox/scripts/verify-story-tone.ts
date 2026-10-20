import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const gameRoot = process.cwd();
const chapter7 = readFileSync(resolve(gameRoot, '../姑苏九园-剧本-CH7耦园.md'), 'utf8');
const chapter8 = readFileSync(resolve(gameRoot, '../姑苏九园-剧本-CH8退思园.md'), 'utf8');
const plates = readFileSync(resolve(gameRoot, 'src/data/scene-plates.ts'), 'utf8');
const home = readFileSync(resolve(gameRoot, 'src/home.ts'), 'utf8');
const corridor = readFileSync(resolve(gameRoot, 'src/data/corridor-geometry.ts'), 'utf8');
const chapter4 = readFileSync(resolve(gameRoot, '../姑苏九园-剧本-CH4狮子林.md'), 'utf8');

function scene(script: string, id: string): string {
  const start = script.indexOf(`### ${id} ·`);
  if (start < 0) throw new Error(`缺少场次 ${id}`);
  const next = script.indexOf('\n### ', start + 4);
  return script.slice(start, next < 0 ? undefined : next);
}

const activeScenes = [
  scene(chapter7, 'CH7-02'),
  scene(chapter8, 'CH8-04'),
  scene(chapter8, 'CH8-05'),
  scene(chapter8, 'CH8-08'),
  scene(chapter8, 'CH8-10'),
  scene(chapter8, 'CH8-13'),
].join('\n');
const playerFacingRows = activeScenes.split('\n').filter((line) => /^\| [1-6] /.test(line)).join('\n');
for (const term of ['问丧', '丧门', '守制', '老爷不在了', '布罩', '执事牌', '要砍', '不砍了']) {
  if (playerFacingRows.includes(term)) throw new Error(`玩家演出仍含旧版沉重设定：${term}`);
}
if (!scene(chapter8, 'CH8-10').includes('先问可不可以')) throw new Error('CH8-10 缺访园礼新交互');
if (!chapter8.includes('tsi-upper-walk-permitted') || !chapter8.includes('tsi-two-trees-observed')) {
  throw new Error('退思园新交互旗标未同步');
}
if (/布罩|执事牌|问丧|丧门/.test(plates)) throw new Error('场景编辑器锚点仍提示旧版丧事美术');
if (home.includes('图是死的') || corridor.includes('窗是死的') || chapter4.includes('O03 观察：这边是死的')) {
  throw new Error('序章／沧浪亭／狮子林仍有可见的旧版阴郁比喻');
}
console.log('玩家场次与编辑器锚点：耦园／退思园采用访园、水树发现的新叙事口径。');
