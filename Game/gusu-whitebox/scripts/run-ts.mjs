#!/usr/bin/env node
/**
 * 通用 TS 运行器：把 scripts/<name>.ts 用 esbuild 打成 Node 单文件后执行。
 * 用于生成器这类"会写文件、但不属于验收"的脚本。
 *
 * 用法：node scripts/run-ts.mjs build-entry-plate
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const name = process.argv[2];

if (!name) {
  console.error('用法：node scripts/run-ts.mjs <脚本名>');
  process.exit(2);
}

const source = resolve(ROOT, 'scripts', `${name}.ts`);
if (!existsSync(source)) {
  console.error(`✗ 找不到 scripts/${name}.ts`);
  process.exit(1);
}

const local = resolve(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'esbuild.cmd' : 'esbuild');
const esbuild = process.env.ESBUILD_BIN || (existsSync(local) ? local : 'esbuild');
const work = mkdtempSync(join(tmpdir(), 'gusu-run-'));
const outfile = join(work, `${name}.cjs`);

const bundled = spawnSync(esbuild, [source, '--bundle', '--platform=node', '--format=cjs', `--outfile=${outfile}`, '--log-level=error'], {
  stdio: 'inherit',
});
if (bundled.error || bundled.status !== 0) {
  rmSync(work, { recursive: true, force: true });
  console.error(`✗ ${name}（打包失败）`);
  process.exit(1);
}

const run = spawnSync(process.execPath, [outfile], { stdio: 'inherit' });
rmSync(work, { recursive: true, force: true });
process.exit(run.status ?? 1);
