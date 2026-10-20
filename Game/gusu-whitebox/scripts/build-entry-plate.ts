/**
 * 留园入口可走底图 v3 生成器。
 *
 * 为什么用生成器：入口 12 个脚点、Tile 边界、相机窗口都已在
 * `src/data/liuyuan-entry-study.ts` 与 `liuyuan-entry-camera.ts` 里定死。
 * 手绘底图每次都会在"脚点是否踩在石地上"这一步对不上；从同一份数据生成，
 * 可走面与墙脚在构造上就重合。
 *
 * 画法（俯视 2.5D 剖切）：整张画布先铺黛瓦屋顶，再把可走区域"切"出来；
 * 可走区边缘加粉墙压顶与墙脚阴影。南北向的夹弄因此表现为"屋顶之间的缝"，
 * 而不是把朝南立面硬贴到侧墙上。只在真正朝南的墙面（六窗墙、门屋）画立面。
 *
 * 运行：node scripts/build-entry-plate.mjs（先由 esbuild 打包本文件）
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  LIUYUAN_ENTRY_DRAFT_REGIONS,
  LIUYUAN_ENTRY_H,
  LIUYUAN_ENTRY_W,
  buildLiuyuanEntryStudyMap,
} from '../src/data/liuyuan-entry-study.js';
import { T } from '../src/data/tiles.js';

const TILE = 16;
const W = LIUYUAN_ENTRY_W * TILE;
const H = LIUYUAN_ENTRY_H * TILE;

const C = {
  roof: '#555b56',
  roofRib: '#484e49',
  roofHi: '#646b64',
  ridge: '#333936',
  plaster: '#ece7d8',
  plasterShade: '#d9d3c2',
  cap: '#3c423e',
  joint: '#7f8378',
  slab: '#b3b1a3',
  slabAlt: '#aaa899',
  corr: '#9d9c90',
  corrAlt: '#95948a',
  earth: '#b7ac93',
  water: '#6f8f86',
  waterDeep: '#4f6f68',
  moss: '#7c8b72',
  ink: '#2b2824',
};

const map = buildLiuyuanEntryStudyMap().map;
const at = (x: number, y: number) =>
  x < 0 || y < 0 || x >= LIUYUAN_ENTRY_W || y >= LIUYUAN_ENTRY_H ? T.WALL : map[y * LIUYUAN_ENTRY_W + x];
const walkable = (x: number, y: number) => {
  const t = at(x, y);
  return t === T.PATH || t === T.CORR;
};

/* ---------- 屋顶与地面底纹 ---------- */
const defs = `
  <defs>
    <pattern id="roof" width="16" height="12" patternUnits="userSpaceOnUse">
      <rect width="16" height="12" fill="${C.roof}"/>
      <path d="M0 1.5h16M0 7.5h16" stroke="${C.roofRib}" stroke-width="2"/>
      <path d="M4 1.5v6M12 7.5v4.5" stroke="${C.roofRib}" stroke-width="1.5"/>
      <path d="M0 2.5h16" stroke="${C.roofHi}" stroke-width="1" opacity=".5"/>
    </pattern>
    <pattern id="roofDark" width="16" height="12" patternUnits="userSpaceOnUse">
      <rect width="16" height="12" fill="#454a46"/>
      <path d="M0 1.5h16M0 7.5h16" stroke="#383e3a" stroke-width="2"/>
      <path d="M4 1.5v6M12 7.5v4.5" stroke="#383e3a" stroke-width="1.5"/>
      <path d="M0 2.5h16" stroke="#51574f" stroke-width="1" opacity=".45"/>
    </pattern>
    <pattern id="roofLight" width="16" height="12" patternUnits="userSpaceOnUse">
      <rect width="16" height="12" fill="#575d57"/>
      <path d="M0 1.5h16M0 7.5h16" stroke="#454c48" stroke-width="2"/>
      <path d="M4 1.5v6M12 7.5v4.5" stroke="#454c48" stroke-width="1.5"/>
      <path d="M0 2.5h16" stroke="#666d65" stroke-width="1" opacity=".5"/>
    </pattern>
    <pattern id="slab" width="32" height="24" patternUnits="userSpaceOnUse">
      <rect width="32" height="24" fill="${C.slab}"/>
      <path d="M0 .5h32M0 12.5h32M16 .5v12M8 12.5v11.5M26 12.5v11.5" stroke="${C.joint}" stroke-width="1" opacity=".55"/>
      <path d="M2 3h7M20 15h8M11 20h9" stroke="#d3cebb" stroke-width="1.5" opacity=".5"/>
    </pattern>
    <pattern id="corr" width="28" height="20" patternUnits="userSpaceOnUse">
      <rect width="28" height="20" fill="${C.corr}"/>
      <path d="M0 .5h28M0 10.5h28M14 .5v10M5 10.5v9M22 10.5v9" stroke="${C.joint}" stroke-width="1" opacity=".45"/>
      <path d="M3 4h6M17 14h6" stroke="#c9c5b4" stroke-width="1.5" opacity=".35"/>
    </pattern>
    <pattern id="earth" width="36" height="28" patternUnits="userSpaceOnUse">
      <rect width="36" height="28" fill="${C.earth}"/>
      <path d="M2 6h5M14 18h7M27 9h6M9 24h6M31 22h4" stroke="#9f957c" stroke-width="1.5" opacity=".6"/>
      <path d="M6 2h2M22 4h2M12 14h2M30 16h2" stroke="#cfc3a8" stroke-width="1.5" opacity=".5"/>
    </pattern>
    <pattern id="water" width="40" height="24" patternUnits="userSpaceOnUse">
      <rect width="40" height="24" fill="${C.water}"/>
      <path d="M0 6h14M20 14h16M6 20h12" stroke="${C.waterDeep}" stroke-width="1.5" opacity=".55"/>
      <path d="M2 8h6M24 16h8" stroke="#a7c0b6" stroke-width="1.5" opacity=".45"/>
    </pattern>
    <pattern id="moss" width="52" height="40" patternUnits="userSpaceOnUse">
      <path d="M5 9h6M20 31h8M38 7h7M44 29h5" stroke="${C.moss}" stroke-width="2" opacity=".55"/>
    </pattern>
  </defs>`;

/* ---------- 边界线段（墙脚） ---------- */
type Seg = { x1: number; y1: number; x2: number; y2: number; side: 'n' | 's' | 'e' | 'w' };
const segs: Seg[] = [];
for (let y = 0; y < LIUYUAN_ENTRY_H; y++) {
  for (let x = 0; x < LIUYUAN_ENTRY_W; x++) {
    if (!walkable(x, y)) continue;
    const px = x * TILE;
    const py = y * TILE;
    if (!walkable(x, y - 1)) segs.push({ x1: px, y1: py, x2: px + TILE, y2: py, side: 'n' });
    if (!walkable(x, y + 1)) segs.push({ x1: px, y1: py + TILE, x2: px + TILE, y2: py + TILE, side: 's' });
    if (!walkable(x - 1, y)) segs.push({ x1: px, y1: py, x2: px, y2: py + TILE, side: 'w' });
    if (!walkable(x + 1, y)) segs.push({ x1: px + TILE, y1: py, x2: px + TILE, y2: py + TILE, side: 'e' });
  }
}

/** 合并同一直线上的相邻线段，避免每个 tile 一条线。 */
function merge(list: Seg[]): Seg[] {
  const out: Seg[] = [];
  const horizontal = list.filter((s) => s.side === 'n' || s.side === 's').sort((a, b) => a.y1 - b.y1 || a.x1 - b.x1);
  const vertical = list.filter((s) => s.side === 'e' || s.side === 'w').sort((a, b) => a.x1 - b.x1 || a.y1 - b.y1);
  for (const group of [horizontal, vertical]) {
    const used = new Set<Seg>();
    for (const s of group) {
      if (used.has(s)) continue;
      let { x1, y1, x2, y2 } = s;
      let grown = true;
      while (grown) {
        grown = false;
        for (const t of group) {
          if (used.has(t) || t === s) continue;
          if (t.side !== s.side) continue;
          if (s.side === 'n' || s.side === 's') {
            if (t.y1 === y1 && t.x1 === x2) { x2 = t.x2; used.add(t); grown = true; }
            else if (t.y1 === y1 && t.x2 === x1) { x1 = t.x1; used.add(t); grown = true; }
          } else if (t.x1 === x1 && t.y1 === y2) { y2 = t.y2; used.add(t); grown = true; }
          else if (t.x1 === x1 && t.y2 === y1) { y1 = t.y1; used.add(t); grown = true; }
        }
      }
      used.add(s);
      out.push({ x1, y1, x2, y2, side: s.side });
    }
  }
  return out;
}

const edges = merge(segs);

/** 墙脚：屋顶一侧的粉墙压顶 + 可走区内侧的落影。 */
function parapet(s: Seg): string {
  const t = 22;
  const cap = 4;
  const g = (x: number, y: number, w: number, h: number) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.plaster}"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${Math.round(h * 0.34)}" fill="${C.plasterShade}" opacity=".55"/>`;
  if (s.side === 'n') {
    return g(s.x1, s.y1 - t, s.x2 - s.x1, t) +
      `<rect x="${s.x1}" y="${s.y1 - t}" width="${s.x2 - s.x1}" height="${cap}" fill="${C.cap}"/>`;
  }
  if (s.side === 's') {
    return g(s.x1, s.y1, s.x2 - s.x1, t) +
      `<rect x="${s.x1}" y="${s.y1 + t - cap}" width="${s.x2 - s.x1}" height="${cap}" fill="${C.cap}"/>`;
  }
  if (s.side === 'w') {
    return g(s.x1 - t, s.y1, t, s.y2 - s.y1) +
      `<rect x="${s.x1 - t}" y="${s.y1}" width="${cap}" height="${s.y2 - s.y1}" fill="${C.cap}"/>`;
  }
  return g(s.x1, s.y1, t, s.y2 - s.y1) +
    `<rect x="${s.x1 + t - cap}" y="${s.y1}" width="${cap}" height="${s.y2 - s.y1}" fill="${C.cap}"/>`;
}

function shadow(s: Seg): string {
  const t = 10;
  if (s.side === 'n') return `<rect x="${s.x1}" y="${s.y1}" width="${s.x2 - s.x1}" height="${t}" fill="${C.ink}" opacity=".20"/>`;
  if (s.side === 's') return `<rect x="${s.x1}" y="${s.y1 - t}" width="${s.x2 - s.x1}" height="${t}" fill="${C.ink}" opacity=".17"/>`;
  if (s.side === 'w') return `<rect x="${s.x1}" y="${s.y1}" width="${t}" height="${s.y2 - s.y1}" fill="${C.ink}" opacity=".20"/>`;
  return `<rect x="${s.x1 - t}" y="${s.y1}" width="${t}" height="${s.y2 - s.y1}" fill="${C.ink}" opacity=".17"/>`;
}

/* ---------- 地面 ---------- */
const fillFor = (id: string, tile: number) => {
  if (tile === T.WATER) return 'url(#water)';
  if (/well|court|threshold|green-shade/.test(id)) return 'url(#slab)';
  if (/corridor|turn|front-hall|gate/.test(id)) return 'url(#corr)';
  return 'url(#earth)';
};

const grounds = LIUYUAN_ENTRY_DRAFT_REGIONS
  .filter((r) => r.tile !== T.WIN)
  .map((r) => {
    const x = r.x * TILE, y = r.y * TILE, w = r.w * TILE, h = r.h * TILE;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fillFor(r.id, r.tile)}"/>`;
  })
  .join('\n  ');

/* ---------- 六窗北墙（沿用 v2 的六个原创窗芯，仅此一处画朝南立面） ---------- */
const sixWindows = `
  <g id="ancient-tree-six-windows">
    <rect x="344" y="150" width="192" height="10" fill="url(#roof)"/>
    <rect x="344" y="160" width="192" height="5" fill="${C.cap}"/>
    <rect x="352" y="165" width="176" height="59" fill="${C.plaster}"/>
    <rect x="352" y="165" width="10" height="59" fill="${C.plasterShade}"/>
    <rect x="518" y="165" width="10" height="59" fill="${C.plasterShade}"/>
    <rect x="360" y="222" width="160" height="6" fill="${C.plasterShade}"/>
    <rect x="368" y="176" width="18" height="40" fill="#5d685e"/>
    <rect x="394" y="176" width="18" height="40" fill="#5d685e"/>
    <rect x="420" y="176" width="18" height="40" fill="#5d685e"/>
    <rect x="446" y="176" width="18" height="40" fill="#5d685e"/>
    <rect x="472" y="176" width="18" height="40" fill="#5d685e"/>
    <rect x="498" y="176" width="18" height="40" fill="#5d685e"/>
    <rect x="370" y="179" width="14" height="34" fill="#81917e"/>
    <rect x="396" y="179" width="14" height="34" fill="#81917e"/>
    <rect x="422" y="179" width="14" height="34" fill="#81917e"/>
    <rect x="448" y="179" width="14" height="34" fill="#81917e"/>
    <rect x="474" y="179" width="14" height="34" fill="#81917e"/>
    <rect x="500" y="179" width="14" height="34" fill="#81917e"/>
    <g stroke="#3f4c43" stroke-width="2" fill="none">
      <rect x="374" y="188" width="6" height="16" rx="3"/>
      <path d="M399 187h6v5h4v6h-4v6h6v4"/>
      <path d="M424 187h8l3 4v14l-3 4h-8l-3-4v-14Z"/>
      <path d="M449 189h6v5h4v5h-4v5h-6v-5h-4v-5h4Z"/>
      <path d="M475 190h6v4h-3v3h3v3h-3v6h-3M476 187v3M474 206h7"/>
      <path d="M500 188h8v5h-4v5h4v5h-4v6h-4"/>
    </g>
  </g>`;

/* ---------- 门屋：朝南的街面与门洞上方檐口 ---------- */
const gateHouse = `
  <g id="south-gate">
    <rect x="464" y="576" width="32" height="48" fill="${C.plaster}"/>
    <rect x="544" y="576" width="32" height="48" fill="${C.plaster}"/>
    <rect x="464" y="576" width="32" height="5" fill="${C.cap}"/>
    <rect x="544" y="576" width="32" height="5" fill="${C.cap}"/>
    <rect x="472" y="588" width="8" height="36" fill="${C.plasterShade}" opacity=".55"/>
    <rect x="552" y="588" width="8" height="36" fill="${C.plasterShade}" opacity=".55"/>
    <rect x="456" y="566" width="128" height="12" fill="url(#roof)"/>
    <rect x="456" y="576" width="128" height="4" fill="${C.cap}"/>
    <rect x="456" y="580" width="128" height="10" fill="${C.ink}" opacity=".22"/>
    <rect x="496" y="622" width="48" height="4" fill="#6f6a5e"/>
  </g>`;

/* ---------- 古木与竹丛（树冠只遮屋顶，不压脚点） ---------- */
const planting = `
  <g id="planting">
    <ellipse cx="612" cy="132" rx="62" ry="34" fill="#4f6b52" opacity=".92"/>
    <ellipse cx="588" cy="120" rx="38" ry="22" fill="#5d7a5c"/>
    <ellipse cx="638" cy="142" rx="34" ry="20" fill="#587356"/>
    <path d="M606 150c-5-20-3-38 5-56M618 152c7-16 14-28 26-38" stroke="#4a4136" stroke-width="7" fill="none"/>
    <path d="M352 330l4-52M362 332l1-64M372 334l7-54" stroke="#4e6b57" stroke-width="3"/>
    <path d="M352 292l-14-10M358 296l12-16M366 286l-9-12M374 296l13-10" stroke="#5c765e" stroke-width="4"/>
    <rect x="340" y="330" width="44" height="10" fill="${C.plasterShade}"/>
  </g>`;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
  <title>留园入口 · 烟雨夹弄 · 可走底图 v3</title>
  <desc>由 liuyuan-entry-study.ts 的 Tile 数据生成；屋顶、粉墙压顶、墙脚阴影与可走面同坐标，12 个脚点落在铺地上。艺术化游戏空间，非清末原址复原。</desc>
  ${defs}
  <rect width="${W}" height="${H}" fill="url(#roof)"/>
  <g id="roof-blocks">
    <rect x="0" y="0" width="352" height="176" fill="url(#roofDark)"/>
    <rect x="496" y="0" width="512" height="208" fill="url(#roofLight)"/>
    <rect x="0" y="176" width="352" height="192" fill="url(#roofLight)"/>
    <rect x="576" y="208" width="432" height="336" fill="url(#roofDark)"/>
    <rect x="0" y="368" width="464" height="320" fill="url(#roof)"/>
    <rect x="576" y="544" width="432" height="144" fill="url(#roofLight)"/>
    <rect x="320" y="256" width="96" height="80" fill="url(#roofDark)"/>
  </g>
  <g id="roof-ridges" stroke="${C.ridge}" stroke-width="2" opacity=".6">
    <path d="M0 88h352M496 88h512M0 264h352M640 360h368M0 520h464M640 600h368"/>
  </g>
  <g id="ground">
  ${grounds}
  </g>
  <g id="parapets">
  ${edges.map(parapet).join('\n  ')}
  </g>
  <g id="wall-shadow">
  ${edges.map(shadow).join('\n  ')}
  </g>
  <g id="wet-sheen" opacity=".5">
    <path d="M500 648h40M504 636h20M470 560h28M520 540h34M504 480h30M440 392h44M392 360h52M424 320h20M430 268h18M380 232h60" stroke="#e6e0cd" stroke-width="3"/>
  </g>
  <g id="depth-wash">
    <rect x="0" y="344" width="1008" height="70" fill="#20261f" opacity=".12"/>
    <rect x="0" y="414" width="1008" height="40" fill="#20261f" opacity=".05"/>
  </g>
  <g id="moss" opacity=".5">
    <rect x="256" y="176" width="64" height="80" fill="url(#moss)"/>
    <rect x="368" y="224" width="112" height="64" fill="url(#moss)"/>
  </g>
  ${sixWindows}
  ${gateHouse}
  ${planting}
  <rect width="${W}" height="${H}" fill="none" stroke="#2b2824" stroke-width="2" opacity=".25"/>
</svg>
`;

const out = resolve(process.cwd(), '..', 'assets', 'scene25d', 'liuyuan-entrance-walkable-study-v3.svg');
writeFileSync(out, svg);
console.log(`入口底图 v3 已生成：${out}（${(svg.length / 1024).toFixed(1)} KB，${edges.length} 段墙脚）`);
