import { LIUYUAN_CHAPTER_FLAGS } from '../src/core/liuyuan-progression.js';
import { runHomeReturn, verifyHomeEntryModes } from './liuyuan-home-return-harness.js';
for (const input of ['keyboard','touch'] as const) {
  const saved={version:1,storyFlags:[...LIUYUAN_CHAPTER_FLAGS,'home-orientation-complete'],
    knowledge:['liuyuan-garden-note-variant'],completedTasks:['liuyuan-leaf-writing'],
    arts:{li:0,yue:0,she:0,yu:0,shu:1,shuMath:0},gardens:{liuyuan:'complete'},updatedAt:1};
  verifyHomeEntryModes(JSON.stringify({...saved,storyFlags:[...LIUYUAN_CHAPTER_FLAGS]}));
  runHomeReturn(JSON.stringify(saved),input,'?playtest=1');
}
console.log('府学整页：出生点→书架键盘/触屏实际事件模拟、核本冻结/退出、存档/刷新及试玩隔离通过。');
