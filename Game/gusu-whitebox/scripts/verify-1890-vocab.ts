import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 1890 口径自检 —— 只扫「台词行」，不扫设计说明与今按。
 *
 * 判定表见 ../姑苏九园-1890口径总表.md §10。
 * 语法：剧本里的台词行形如 `CH4-06.O04 观察：……`；本脚本只从这些行里取
 * L/O/S + 两位数字之后的文本，因此"禁用词出现在红线表、考据块或今按里"
 * 不会被误判。
 */

type BannedTerm = { term: string; why: string };

const BANNED: readonly BannedTerm[] = [
  { term: '沧 501', why: '现代古树保护牌编号' },
  { term: '沧501', why: '现代古树保护牌编号' },
  { term: '寿杏', why: '当代挂牌名，1890 无树名' },
  { term: '福杏', why: '当代挂牌名，1890 无树名' },
  { term: '连理杏', why: '当代挂牌名，1890 无树名' },
  { term: '三元杏', why: '当代挂牌名，1890 无树名' },
  { term: '还我读书处', why: '解放后称谓，1890 应作"还读我书斋"' },
  { term: '金字山墙', why: '查无出处，应为"观音兜山墙"（且本章不点名）' },
  { term: '贴水园', why: '陈从周 1978–84 定名，只进今按' },
  { term: '贴水', why: '同上；1890 无人这样叫' },
  { term: '太极布局', why: '2002 年论文提出，1890 不成立' },
  { term: '阴阳鱼', why: '可核文献中查无此词' },
  { term: '江南船拳', why: '当代项目名（2011/2016 非遗）' },
  { term: '108 式', why: '"108 式漏窗"是传说转述，不作档案数据' },
  { term: '观云峰', why: '错字，应为"冠云峰"' },
  { term: '一池三山', why: '拙政园格局名未裁决，只写"以水为中心的山池格局"' },
  { term: '小蓬莱', why: '民国游记地名，1890 未核' },
  { term: '世界遗产', why: '1997/2000 年后概念' },
  { term: '地铁', why: '只存在于终章乙幕' },
];

/**
 * 台词行：`L01 乔禾：……`、`O04 观察：……`、`S02 系统：……`。
 * 行内码之后允许一个短说话人标签，再取冒号后的正文（到反引号/竖线为止）。
 */
const DIALOGUE = /(?:^|[\s`|.。>])([LOS])(\d{2})\s*[^：:`|<]{0,12}[：:]\s*([^`|<]*)/g;

const SCRIPT_DIR = resolve(process.cwd(), '..');
const files = readdirSync(SCRIPT_DIR)
  .filter((name) => /^姑苏九园-剧本-.*\.md$/.test(name))
  .sort();

if (!files.length) throw new Error(`未找到剧本文件：${SCRIPT_DIR}`);

const hits: Array<{ file: string; line: number; code: string; term: string; why: string; text: string }> = [];

for (const file of files) {
  const lines = readFileSync(resolve(SCRIPT_DIR, file), 'utf8').split('\n');
  lines.forEach((line, index) => {
    for (const match of line.matchAll(DIALOGUE)) {
      const [, kind, number, raw] = match;
      const text = raw.trim();
      for (const { term, why } of BANNED) {
        if (text.includes(term)) {
          hits.push({ file, line: index + 1, code: `${kind}${number}`, term, why, text });
        }
      }
    }
  });
}

if (hits.length) {
  console.error('1890 口径自检：台词行出现禁用词\n');
  for (const hit of hits) {
    console.error(`✗ ${hit.file}:${hit.line}  ${hit.code}  「${hit.term}」— ${hit.why}`);
    console.error(`    ${hit.text}`);
  }
  console.error(`\n共 ${hits.length} 处。判定表见 ../姑苏九园-1890口径总表.md §10。`);
  process.exit(1);
}

console.log(`1890 口径：${files.length} 个剧本文件的台词行未出现禁用词。`);
