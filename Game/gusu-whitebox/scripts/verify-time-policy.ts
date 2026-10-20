import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const publicTextFiles = ['index.html', 'src/intro.ts', 'sucheng.html'];
const fixedYear = /1890|光绪十六|一八九[〇零0]/;
for (const path of publicTextFiles) {
  const contents = readFileSync(resolve(process.cwd(), path), 'utf8');
  if (fixedYear.test(contents.replaceAll('assets/sucheng1890/', 'assets/sucheng/'))) {
    throw new Error(`玩家入口仍明示未定年份：${path}`);
  }
}
const audit = readFileSync(resolve(process.cwd(), '../姑苏九园-时间设定与史实边界.md'), 'utf8');
for (let chapter = 1; chapter <= 9; chapter++) {
  if (!audit.includes(`CH${chapter} `)) throw new Error(`时间审计缺第 ${chapter} 章`);
}
const annotations = readFileSync(resolve(process.cwd(), 'src/render/annotation.ts'), 'utf8');
const ouyuanName = annotations.match(/id: 'CH7-13'[\s\S]*?\bbody: '([^']*)'/)?.[1];
if (!ouyuanName || fixedYear.test(ouyuanName)) {
  throw new Error('耦园今按仍锁死故事年份，或缺少 CH7-13');
}
const chapterNames: Record<number, string> = { 3: '留园', 7: '耦园', 8: '退思园' };
for (const chapter of [3, 7, 8]) {
  const draft = readFileSync(resolve(process.cwd(), `../姑苏九园-剧本-CH${chapter}${chapterNames[chapter]}.md`), 'utf8');
  if (!/时间审计提醒|v1\.1 玩家叙事口径/.test(draft.slice(0, 500))) {
    throw new Error(`CH${chapter} 缺少时间审计或新版叙事口径提醒`);
  }
}
console.log('时间设定：玩家入口和耦园今按无未定精确年份；九章审计与三章旧稿提示齐备。');
