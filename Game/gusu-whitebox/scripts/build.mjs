#!/usr/bin/env node
/**
 * 全量打包入口。替代 README 里逐条手敲的绝对路径命令。
 *
 * 用法：
 *   node scripts/build.mjs            # 打包全部 27 个页面入口
 *   ESBUILD_BIN=/path/to/esbuild node scripts/build.mjs
 *
 * esbuild 按以下顺序查找：
 *   1. 环境变量 ESBUILD_BIN
 *   2. 本目录 node_modules/.bin/esbuild（npm install 后）
 *   3. PATH 上的 esbuild
 */
import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** [源文件基名, 产物基名]；产物落在 dist/<产物>.js */
const BUNDLES = [
  ['main', 'game'],
  ['intro', 'intro'],
  ['journal', 'journal'],
  ['corridor', 'corridor'],
  ['world', 'world'],
  ['home', 'home'],
  ['geometry-editor', 'geometry-editor'],
  ['annotation-lab', 'annotation-lab'],
  ['liuyuan-art-calibration', 'liuyuan-art-calibration'],
  ['liuyuan-composition-study', 'liuyuan-composition-study'],
  ['liuyuan-entry', 'liuyuan-entry'],
  ['liuyuan-court', 'liuyuan-court'],
  ['liuyuan-lvyin', 'liuyuan-lvyin'],
  ['liuyuan-flower', 'liuyuan-flower'],
  ['liuyuan-east-hall', 'liuyuan-east-hall'],
  ['liuyuan-stone-forest', 'liuyuan-stone-forest'],
  ['liuyuan-study-court', 'liuyuan-study-court'],
  ['liuyuan-study-interior', 'liuyuan-study-interior'],
  ['liuyuan-guanyun', 'liuyuan-guanyun'],
  ['liuyuan-guanyun-v2', 'liuyuan-guanyun-v2'],
  ['liuyuan-window-study', 'liuyuan-window-study'],
  ['liuyuan-leaf-writing-study', 'liuyuan-leaf-writing-study'],
  ['liuyuan-youyicun-study', 'liuyuan-youyicun-study'],
  ['liuyuan-alley-misty-study', 'liuyuan-alley-misty-study'],
  ['liuyuan-entry-gate-misty-study', 'liuyuan-entry-gate-misty-study'],
  ['liuyuan-entry-lower-camera-study', 'liuyuan-entry-lower-camera-study'],
  ['liuyuan-entry-oblique-study', 'liuyuan-entry-oblique-study'],
];

function findEsbuild() {
  const local = resolve(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'esbuild.cmd' : 'esbuild');
  const candidates = [process.env.ESBUILD_BIN, local].filter(Boolean);
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return 'esbuild';
}

const esbuild = findEsbuild();
let failed = 0;
let built = 0;

for (const [sourceBase, outputBase] of BUNDLES) {
  const source = resolve(ROOT, 'src', `${sourceBase}.ts`);
  const output = resolve(ROOT, 'dist', `${outputBase}.js`);
  const result = spawnSync(esbuild, [source, '--bundle', `--outfile=${output}`, '--log-level=warning'], {
    stdio: 'inherit',
  });
  if (result.error) {
    console.error(`\n找不到 esbuild：${result.error.message}`);
    console.error('请先 npm install，或用 ESBUILD_BIN 指定可执行文件。');
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`✗ ${sourceBase}.ts`);
    failed += 1;
    continue;
  }
  const kb = (statSync(output).size / 1024).toFixed(1);
  console.log(`✓ ${outputBase}.js  ${kb} KB`);
  built += 1;
}

console.log(`\n打包完成：${built}/${BUNDLES.length}${failed ? `，失败 ${failed}` : ''}`);
process.exit(failed ? 1 : 0);
