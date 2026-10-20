#!/usr/bin/env node
/**
 * 验收脚本运行器：用 esbuild 打成 Node 单文件后依次执行。
 *
 * 用法：
 *   node scripts/verify.mjs verify-all-scenes
 *   node scripts/verify.mjs verify-liuyuan-input-smoke verify-liuyuan-home-return
 *
 * 任何一项非零退出即整体失败；不读写玩家浏览器存档与编辑器草稿。
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const names = process.argv.slice(2);

if (!names.length) {
  console.error('用法：node scripts/verify.mjs <verify-脚本名…>');
  console.error('例：node scripts/verify.mjs verify-all-scenes');
  process.exit(2);
}

function findEsbuild() {
  const local = resolve(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'esbuild.cmd' : 'esbuild');
  const candidates = [process.env.ESBUILD_BIN, local].filter(Boolean);
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return 'esbuild';
}

const esbuild = findEsbuild();
const node = process.execPath;
const work = mkdtempSync(join(tmpdir(), 'gusu-verify-'));
let failed = 0;

for (const name of names) {
  const source = resolve(ROOT, 'scripts', `${name}.ts`);
  if (!existsSync(source)) {
    console.error(`✗ 找不到 scripts/${name}.ts`);
    failed += 1;
    continue;
  }
  const outfile = join(work, `${name}.cjs`);
  const bundled = spawnSync(esbuild, [source, '--bundle', '--platform=node', `--outfile=${outfile}`, '--log-level=error'], {
    stdio: 'inherit',
  });
  if (bundled.error || bundled.status !== 0) {
    console.error(`✗ ${name}（打包失败）`);
    failed += 1;
    continue;
  }
  console.log(`\n▶ ${name}`);
  const run = spawnSync(node, [outfile], { stdio: 'inherit' });
  if (run.status !== 0) {
    console.error(`✗ ${name}（退出码 ${run.status ?? '未知'}）`);
    failed += 1;
  }
}

rmSync(work, { recursive: true, force: true });
console.log(`\n验收：${names.length - failed}/${names.length} 通过`);
process.exit(failed ? 1 : 0);
