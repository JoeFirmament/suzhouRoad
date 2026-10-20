/**
 * 留园入口可走底图 v4 · 美术 pass（A 段重点：街面—门屋—前厅—第一天井）
 *
 * v3 是灰模：只证明"画在哪"。v4 在同一套 Tile / 12 脚点坐标上做第一轮美术：
 * 屋顶分块与脊、檐口落影、粉墙压顶、门屋立面、天井光、街面水光。
 *
 * 仍然不是最终美术，也不改任何碰撞与剧情。默认页仍用 v2；
 * `liuyuan-entry.html?art=plate-v4&debug=plate` 用于逐段对位。
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
  roof: '#565c56',
  roofDeep: '#474d48',
  roofLight: '#60675f',
  rib: '#3e443f',
  ridge: '#2f3531',
  eave: '#343a36',
  plaster: '#efe9da',
  plasterWarm: '#e4ddca',
  plasterShade: '#cfc7b3',
  plinth: '#8d8b7d',
  cap: '#3b413d',
  wood: '#6d5945',
  woodDark: '#4c3f31',
  slab: '#b6b2a1',
  slabAlt: '#ada997',
  slabJoint: '#82857a',
  corr: '#a09e90',
  corrJoint: '#74786e',
  cobble: '#a8a294',
  cobbleDark: '#928d80',
  earth: '#b6aa8f',
  water: '#6d8d85',
  waterDeep: '#4e6d67',
  moss: '#77866f',
  ink: '#232621',
  lamp: '#e2b878',
};

const map = buildLiuyuanEntryStudyMap().map;
const at = (x: number, y: number) =>
  x < 0 || y < 0 || x >= LIUYUAN_ENTRY_W || y >= LIUYUAN_ENTRY_H ? T.WALL : map[y * LIUYUAN_ENTRY_W + x];
const walk = (x: number, y: number) => at(x, y) === T.PATH || at(x, y) === T.CORR;

/* ---------------- defs ---------------- */
const defs = `
  <defs>
    <pattern id="roof" width="16" height="10" patternUnits="userSpaceOnUse">
      <rect width="16" height="10" fill="${C.roof}"/>
      <path d="M0 8.5h16" stroke="#3a403b" stroke-width="2.2"/>
      <path d="M0 1.2h16" stroke="#6e756c" stroke-width="1.2" opacity=".55"/>
      <path d="M4 0v4M12 4v4" stroke="#4a504a" stroke-width="1.2" opacity=".6"/>
      <path d="M1 5.5c2 1.4 4 1.4 6 0M9 9.5c2 1.4 4 1.4 6 0" stroke="#687065" stroke-width="1" fill="none" opacity=".45"/>
    </pattern>
    <pattern id="roofDeep" width="16" height="12" patternUnits="userSpaceOnUse">
      <rect width="16" height="12" fill="${C.roofDeep}"/>
      <path d="M0 1.5h16M0 7.5h16" stroke="#363c37" stroke-width="2"/>
      <path d="M4 1.5v6M12 7.5v4.5" stroke="#363c37" stroke-width="1.4"/>
    </pattern>
    <pattern id="roofLight" width="16" height="12" patternUnits="userSpaceOnUse">
      <rect width="16" height="12" fill="${C.roofLight}"/>
      <path d="M0 1.5h16M0 7.5h16" stroke="#454b46" stroke-width="2"/>
      <path d="M4 1.5v6M12 7.5v4.5" stroke="#454b46" stroke-width="1.4"/>
      <path d="M0 2.8h16" stroke="#767d73" stroke-width="1" opacity=".5"/>
    </pattern>
    <pattern id="cobble" width="30" height="22" patternUnits="userSpaceOnUse">
      <rect width="30" height="22" fill="${C.cobble}"/>
      <path d="M1 7h9M13 7h7M23 7h6M6 15h8M17 15h9M11 21h7" stroke="${C.cobbleDark}" stroke-width="1.4" opacity=".7"/>
      <path d="M3 3h5M19 12h6M9 19h5" stroke="#c4bda9" stroke-width="1.2" opacity=".45"/>
    </pattern>
    <pattern id="slab" width="34" height="26" patternUnits="userSpaceOnUse">
      <rect width="34" height="26" fill="${C.slab}"/>
      <path d="M0 .7h34M0 13.7h34M17 .7v13M9 13.7v12.3M26 13.7v12.3" stroke="${C.slabJoint}" stroke-width="1" opacity=".6"/>
      <path d="M2 4h8M21 17h9M12 22h8" stroke="#d8d1bd" stroke-width="1.4" opacity=".45"/>
    </pattern>
    <pattern id="corr" width="30" height="22" patternUnits="userSpaceOnUse">
      <rect width="30" height="22" fill="${C.corr}"/>
      <path d="M0 .7h30M0 11.7h30M15 .7v11M6 11.7v10.3M23 11.7v10.3" stroke="${C.corrJoint}" stroke-width="1" opacity=".55"/>
    </pattern>
    <pattern id="earth" width="38" height="30" patternUnits="userSpaceOnUse">
      <rect width="38" height="30" fill="${C.earth}"/>
      <path d="M3 7h6M16 19h8M29 10h6M10 26h6M33 24h4" stroke="#9d9279" stroke-width="1.4" opacity=".55"/>
      <path d="M7 3h2M24 5h2M13 15h2M32 18h2" stroke="#d0c4a7" stroke-width="1.4" opacity=".5"/>
    </pattern>
    <pattern id="water" width="44" height="26" patternUnits="userSpaceOnUse">
      <rect width="44" height="26" fill="${C.water}"/>
      <path d="M0 7h16M22 15h18M8 22h12" stroke="${C.waterDeep}" stroke-width="1.6" opacity=".55"/>
      <path d="M3 9h7M27 17h8" stroke="#a9c1b7" stroke-width="1.4" opacity=".5"/>
    </pattern>
    <pattern id="moss" width="46" height="36" patternUnits="userSpaceOnUse">
      <path d="M5 8h6M18 28h8M34 6h6M39 26h5" stroke="${C.moss}" stroke-width="2" opacity=".5"/>
    </pattern>
    <linearGradient id="passage" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1b1d19"/><stop offset=".55" stop-color="#2b2e27"/><stop offset="1" stop-color="#3c3a30"/>
    </linearGradient>
    <linearGradient id="shaft" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f7f2df" stop-opacity=".5"/><stop offset="1" stop-color="#f7f2df" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="lampglow" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="${C.lamp}" stop-opacity=".5"/><stop offset="1" stop-color="${C.lamp}" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

/* ---------------- 边界（墙脚） ---------------- */
type Seg = { x1: number; y1: number; x2: number; y2: number; side: 'n' | 's' | 'e' | 'w' };
const segs: Seg[] = [];
for (let y = 0; y < LIUYUAN_ENTRY_H; y++) for (let x = 0; x < LIUYUAN_ENTRY_W; x++) {
  if (!walk(x, y)) continue;
  const px = x * TILE, py = y * TILE;
  if (!walk(x, y - 1)) segs.push({ x1: px, y1: py, x2: px + TILE, y2: py, side: 'n' });
  if (!walk(x, y + 1)) segs.push({ x1: px, y1: py + TILE, x2: px + TILE, y2: py + TILE, side: 's' });
  if (!walk(x - 1, y)) segs.push({ x1: px, y1: py, x2: px, y2: py + TILE, side: 'w' });
  if (!walk(x + 1, y)) segs.push({ x1: px + TILE, y1: py, x2: px + TILE, y2: py + TILE, side: 'e' });
}

function merge(list: Seg[]): Seg[] {
  const out: Seg[] = [];
  for (const side of ['n', 's', 'e', 'w'] as const) {
    const group = list.filter((s) => s.side === side).sort((a, b) =>
      side === 'n' || side === 's' ? a.y1 - b.y1 || a.x1 - b.x1 : a.x1 - b.x1 || a.y1 - b.y1);
    const used = new Set<Seg>();
    for (const s of group) {
      if (used.has(s)) continue;
      let { x1, y1, x2, y2 } = s;
      let grew = true;
      while (grew) {
        grew = false;
        for (const t of group) {
          if (t === s || used.has(t)) continue;
          if (side === 'n' || side === 's') {
            if (t.y1 === y1 && (t.x1 === x2 || t.x2 === x1)) {
              x1 = Math.min(x1, t.x1); x2 = Math.max(x2, t.x2); used.add(t); grew = true;
            }
          } else if (t.x1 === x1 && (t.y1 === y2 || t.y2 === y1)) {
            y1 = Math.min(y1, t.y1); y2 = Math.max(y2, t.y2); used.add(t); grew = true;
          }
        }
      }
      used.add(s);
      out.push({ x1, y1, x2, y2, side });
    }
  }
  return out;
}
const edges = merge(segs);

/* ---------------- 屋顶 ---------------- */
const ROOF_BLOCKS: Array<[number, number, number, number, string]> = [
  [0, 0, 1008, 176, 'url(#roofDeep)'],
  [0, 176, 352, 192, 'url(#roof)'],
  [496, 0, 512, 208, 'url(#roofLight)'],
  [576, 208, 432, 336, 'url(#roofDeep)'],
  [0, 368, 464, 320, 'url(#roofLight)'],
  [576, 544, 432, 144, 'url(#roof)'],
  [320, 256, 96, 80, 'url(#roof)'],
  [0, 544, 464, 80, 'url(#roofDeep)'],
];

function roofs(): string {
  const parts: string[] = [];
  for (const [x, y, w, h, fill] of ROOF_BLOCKS) {
    parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`);
    // 脊：偏北的一条亮线；檐：南缘暗线 + 外向落影
    parts.push(`<rect x="${x}" y="${y + 10}" width="${w}" height="3" fill="#6d746b" opacity=".35"/>`);
    parts.push(`<rect x="${x}" y="${y + h - 5}" width="${w}" height="5" fill="${C.eave}" opacity=".55"/>`);
    // 筒瓦竖向节奏（每 16px 一道，压低对比）
    let ribs = '';
    for (let gx = x + 8; gx < x + w; gx += 16) ribs += `M${gx} ${y + 2}v${h - 4}`;
    parts.push(`<path d="${ribs}" stroke="#3b413c" stroke-width="1" opacity=".18"/>`);
  }
  return parts.join('\n  ');
}

/* ---------------- 粉墙压顶 + 墙脚影 ---------------- */
function wallBand(s: Seg): string {
  const t = 8, cap = 2;
  const band = (x: number, y: number, w: number, h: number) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.plaster}"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${Math.max(3, Math.round(h * .28))}" fill="${C.plasterWarm}" opacity=".75"/>`;
  const over = 5;
  if (s.side === 'n') return band(s.x1, s.y1 - t, s.x2 - s.x1, t) +
    `<rect x="${s.x1}" y="${s.y1 - t}" width="${s.x2 - s.x1}" height="${cap}" fill="${C.cap}"/>` +
    `<rect x="${s.x1}" y="${s.y1 - t - over}" width="${s.x2 - s.x1}" height="${over}" fill="${C.ink}" opacity=".22"/>`;
  if (s.side === 's') return band(s.x1, s.y1, s.x2 - s.x1, t) +
    `<rect x="${s.x1}" y="${s.y1 + t - cap}" width="${s.x2 - s.x1}" height="${cap}" fill="${C.cap}"/>` +
    `<rect x="${s.x1}" y="${s.y1 + t}" width="${s.x2 - s.x1}" height="${over}" fill="${C.ink}" opacity=".2"/>`;
  if (s.side === 'w') return band(s.x1 - t, s.y1, t, s.y2 - s.y1) +
    `<rect x="${s.x1 - t}" y="${s.y1}" width="${cap}" height="${s.y2 - s.y1}" fill="${C.cap}"/>` +
    `<rect x="${s.x1 - t - over}" y="${s.y1}" width="${over}" height="${s.y2 - s.y1}" fill="${C.ink}" opacity=".22"/>`;
  return band(s.x1, s.y1, t, s.y2 - s.y1) +
    `<rect x="${s.x1 + t - cap}" y="${s.y1}" width="${cap}" height="${s.y2 - s.y1}" fill="${C.cap}"/>` +
    `<rect x="${s.x1 + t}" y="${s.y1}" width="${over}" height="${s.y2 - s.y1}" fill="${C.ink}" opacity=".2"/>`;
}

function wallShadow(s: Seg): string {
  const t = 9;
  if (s.side === 'n') return `<rect x="${s.x1}" y="${s.y1}" width="${s.x2 - s.x1}" height="${t}" fill="${C.ink}" opacity=".17"/>`;
  if (s.side === 's') return `<rect x="${s.x1}" y="${s.y1 - t}" width="${s.x2 - s.x1}" height="${t}" fill="${C.ink}" opacity=".14"/>`;
  if (s.side === 'w') return `<rect x="${s.x1}" y="${s.y1}" width="${t}" height="${s.y2 - s.y1}" fill="${C.ink}" opacity=".17"/>`;
  return `<rect x="${s.x1 - t}" y="${s.y1}" width="${t}" height="${s.y2 - s.y1}" fill="${C.ink}" opacity=".14"/>`;
}

/* ---------------- 地面 ---------------- */
const GROUND_FILL: Record<string, string> = {
  'street-approach': 'url(#cobble)',
  'small-gate-threshold': 'url(#corr)',
  'front-hall': 'url(#corr)',
  'first-light-well': 'url(#slab)',
  'long-south-corridor': 'url(#corr)',
  'west-turn': 'url(#corr)',
  'second-light-well': 'url(#slab)',
  'north-narrow-corridor': 'url(#corr)',
  'ancient-tree-court': 'url(#slab)',
  'west-to-green-shade': 'url(#corr)',
  'green-shade-threshold': 'url(#slab)',
  'pond-not-walkable': 'url(#water)',
};

const grounds = LIUYUAN_ENTRY_DRAFT_REGIONS
  .filter((r) => r.tile !== T.WIN)
  .map((r) => `<rect x="${r.x * TILE}" y="${r.y * TILE}" width="${r.w * TILE}" height="${r.h * TILE}" fill="${GROUND_FILL[r.id] ?? 'url(#earth)'}"/>`)
  .join('\n  ');

/* ---------------- A 段：街面、门屋、前厅、第一天井 ---------------- */
const A_DETAIL = `
  <!-- 街面：水光、车辙、檐影 -->
  <g id="street">
    <rect x="480" y="624" width="96" height="64" fill="url(#cobble)"/>
    <path d="M492 632v54M548 630v56" stroke="#8d887a" stroke-width="2" opacity=".5"/>
    <path d="M500 646h56M486 668h78" stroke="#c9c1ac" stroke-width="2" opacity=".35"/>
    <path d="M486 640c8 10 6 24 14 34M566 636c-6 12-4 26-10 38" stroke="#7c7a6e" stroke-width="2" fill="none" opacity=".45"/>
    <ellipse cx="536" cy="664" rx="22" ry="7" fill="#d8d2bd" opacity=".22"/>
    <rect x="480" y="624" width="96" height="6" fill="${C.ink}" opacity=".18"/>
  </g>

  <!-- 门屋：南立面 + 瓦檐 + 门洞 -->
  <g id="gate-house">
    <rect x="436" y="532" width="160" height="22" fill="url(#roof)"/>
    <rect x="436" y="533" width="160" height="3" fill="#767d72" opacity=".5"/>
    <rect x="428" y="552" width="176" height="6" fill="${C.eave}"/>
    <rect x="428" y="558" width="176" height="10" fill="${C.ink}" opacity=".26"/>
    <path d="M470 558v8M486 558v8M554 558v8M570 558v8" stroke="${C.woodDark}" stroke-width="3"/>
    <rect x="474" y="624" width="6" height="64" fill="${C.plaster}" opacity=".9"/>
    <rect x="566" y="624" width="6" height="64" fill="${C.plaster}" opacity=".9"/>
    <rect x="474" y="624" width="6" height="4" fill="${C.cap}"/>
    <rect x="566" y="624" width="6" height="4" fill="${C.cap}"/>
    <rect x="464" y="566" width="112" height="58" fill="${C.plaster}"/>
    <rect x="464" y="566" width="112" height="7" fill="${C.plasterWarm}"/>
    <rect x="464" y="612" width="112" height="12" fill="${C.plinth}"/>
    <rect x="464" y="612" width="112" height="3" fill="#7a786c"/>
    <rect x="490" y="570" width="10" height="54" fill="${C.wood}"/>
    <rect x="540" y="570" width="10" height="54" fill="${C.wood}"/>
    <rect x="490" y="570" width="3" height="54" fill="${C.woodDark}" opacity=".7"/>
    <rect x="547" y="570" width="3" height="54" fill="${C.woodDark}" opacity=".7"/>
    <rect x="496" y="566" width="48" height="8" fill="${C.woodDark}"/>
    <rect x="496" y="574" width="48" height="50" fill="url(#passage)"/>
    <rect x="496" y="620" width="48" height="4" fill="#7f7767"/>
    <path d="M500 574v46M540 574v46" stroke="#4a4a3f" stroke-width="1" opacity=".6"/>
    <rect x="470" y="586" width="14" height="20" fill="${C.plasterShade}" opacity=".5"/>
    <rect x="556" y="586" width="14" height="20" fill="${C.plasterShade}" opacity=".5"/>
  </g>

  <!-- 前厅：顶光被遮，地面压暗；两侧内墙只留窄白边 -->
  <g id="front-hall">
    <rect x="464" y="512" width="112" height="64" fill="url(#corr)"/>
    <rect x="464" y="512" width="112" height="64" fill="${C.ink}" opacity=".1"/>
    <rect x="464" y="512" width="7" height="64" fill="${C.plaster}" opacity=".85"/>
    <rect x="569" y="512" width="7" height="64" fill="${C.plaster}" opacity=".85"/>
    <rect x="464" y="566" width="112" height="7" fill="${C.ink}" opacity=".2"/>
    <rect x="488" y="512" width="10" height="64" fill="${C.ink}" opacity=".08"/>
    <path d="M470 520v48M570 520v48" stroke="${C.woodDark}" stroke-width="3" opacity=".55"/>
    <rect x="464" y="540" width="112" height="5" fill="${C.woodDark}" opacity=".55"/>
    <rect x="464" y="545" width="112" height="4" fill="${C.ink}" opacity=".14"/>
  </g>

  <!-- 第一天井：亮、湿、有光 -->
  <g id="first-well">
    <rect x="464" y="448" width="112" height="64" fill="url(#slab)"/>
    <polygon points="464,448 520,448 500,512 464,512" fill="url(#shaft)" opacity=".55"/>
    <path d="M470 456h30M508 470h56M472 492h24M520 500h48" stroke="#dcd5c1" stroke-width="2" opacity=".5"/>
    <path d="M466 450v60M574 450v60" stroke="${C.ink}" stroke-width="3" opacity=".12"/>
    <path d="M470 506h20M536 508h28" stroke="${C.moss}" stroke-width="2" opacity=".4"/>
    <rect x="556" y="466" width="14" height="18" fill="#6f6d60"/>
    <rect x="553" y="482" width="20" height="4" fill="#5b5a4f"/>
    <rect x="557" y="464" width="12" height="3" fill="#8d8674"/>
    <ellipse cx="563" cy="486" rx="12" ry="3" fill="${C.ink}" opacity=".18"/>
  </g>

  <!-- 廊与西折：窄、暗、有方向 -->
  <g id="south-corridor">
    <rect x="496" y="384" width="48" height="64" fill="url(#corr)"/>
    <rect x="496" y="384" width="48" height="64" fill="${C.ink}" opacity=".12"/>
    <rect x="496" y="384" width="6" height="64" fill="${C.plaster}" opacity=".8"/>
    <rect x="538" y="384" width="6" height="64" fill="${C.plaster}" opacity=".8"/>
    <rect x="496" y="440" width="48" height="8" fill="${C.ink}" opacity=".18"/>
  </g>

  <!-- 东墙外的树冠：只越屋顶，不压脚点 -->
  <g id="tree-over-wall">
    <ellipse cx="626" cy="470" rx="46" ry="24" fill="#4d6a51" opacity=".9"/>
    <ellipse cx="612" cy="460" rx="28" ry="15" fill="#5b7a5c"/>
    <ellipse cx="644" cy="478" rx="24" ry="13" fill="#577356"/>
    <path d="M622 486c-3-14-2-26 4-38M632 488c5-12 10-20 18-26" stroke="#463f34" stroke-width="5" fill="none"/>
  </g>

  <!-- 门内一盏灯的记忆：暖光只作气氛，不照亮未核构件 -->
  <g id="gate-lamp">
    <circle cx="540" cy="590" r="26" fill="url(#lampglow)" opacity=".55"/>
    <circle cx="540" cy="590" r="3" fill="${C.lamp}" opacity=".8"/>
  </g>`;

/* ---------------- B/C 段：中等细节（六窗墙、古木、竹、池） ---------------- */
const BC_DETAIL = `
  <g id="six-window-wall">
    <rect x="352" y="150" width="176" height="10" fill="url(#roof)"/>
    <rect x="352" y="160" width="176" height="5" fill="${C.eave}"/>
    <rect x="360" y="165" width="160" height="59" fill="${C.plaster}"/>
    <rect x="360" y="165" width="160" height="6" fill="${C.plasterWarm}"/>
    <rect x="360" y="216" width="160" height="8" fill="${C.plinth}"/>
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
  </g>
  <g id="ancient-tree">
    <ellipse cx="612" cy="150" rx="58" ry="30" fill="#4f6b52" opacity=".9"/>
    <ellipse cx="590" cy="140" rx="34" ry="18" fill="#5d7a5c"/>
    <path d="M606 176c-4-18-2-32 6-46M620 178c6-14 12-24 22-32" stroke="#4a4136" stroke-width="6" fill="none"/>
  </g>
  <g id="bamboo">
    <path d="M352 330l4-52M362 332l1-64M372 334l7-54" stroke="#4e6b57" stroke-width="3"/>
    <path d="M352 292l-14-10M358 296l12-16M366 286l-9-12M374 296l13-10" stroke="#5c765e" stroke-width="4"/>
    <rect x="340" y="330" width="44" height="10" fill="${C.plasterShade}"/>
  </g>
  <g id="pond">
    <rect x="96" y="32" width="192" height="96" fill="url(#water)"/>
    <path d="M96 126h192" stroke="#8b8a7a" stroke-width="4"/>
    <path d="M104 44h40M170 64h60M120 96h50" stroke="#a9c1b7" stroke-width="2" opacity=".55"/>
  </g>`;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
  <title>留园入口 · 烟雨夹弄 · 可走底图 v4（美术 pass）</title>
  <desc>与 Tile、12 脚点同坐标的游戏化场景；A 段（街面—门屋—前厅—第一天井）重点绘制。非清末原址复原。</desc>
  ${defs}
  <rect width="${W}" height="${H}" fill="url(#roof)"/>
  ${roofs()}
  <g id="ground">
  ${grounds}
  </g>
  <g id="wall-band">
  ${edges.map(wallBand).join('\n  ')}
  </g>
  <g id="wall-shadow">
  ${edges.map(wallShadow).join('\n  ')}
  </g>
  <g id="moss" opacity=".45">
    <rect x="256" y="176" width="64" height="80" fill="url(#moss)"/>
    <rect x="368" y="224" width="112" height="64" fill="url(#moss)"/>
  </g>
  ${BC_DETAIL}
  ${A_DETAIL}
  <rect width="${W}" height="${H}" fill="none" stroke="${C.ink}" stroke-width="2" opacity=".22"/>
</svg>
`;

const out = resolve(process.cwd(), '..', 'assets', 'scene25d', 'liuyuan-entrance-walkable-study-v4.svg');
writeFileSync(out, svg);
console.log(`入口底图 v4 已生成：${out}（${(svg.length / 1024).toFixed(1)} KB，${edges.length} 段墙脚）`);
