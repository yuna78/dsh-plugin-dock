#!/usr/bin/env node
/**
 * 生成可公开的仓库内容（白名单 + 隐私扫描），不含本机配置 / 运行数据 / 内部文档。
 *
 *   node scripts/build-public-bundle.mjs                 # 构建到 dist/public
 *   node scripts/build-public-bundle.mjs --out /tmp/x    # 换个输出目录
 *
 * 两种模式，自动识别：
 *   dev    存在 release/public.json（开发树）。按白名单复制 → 重写包身份（npm 包名 /
 *          patch 名 / client 的 ModuleLoader id）→ 隐私扫描 → 输出 dist/public。
 *   check  不存在 release/public.json（已经身处公开仓，例如 CI）。只做「白名单文件都在」
 *          + 隐私扫描，不复制，避免自己覆盖自己。
 *
 * 产物是独立仓库的内容，可以直接：
 *   gh repo create yuna78/dsh-plugin-dock --public --source dist/public --remote origin --push
 */
import {
  cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outArg = process.argv.indexOf('--out');
const OUT = resolve(outArg > 0 ? process.argv[outArg + 1] : join(ROOT, 'dist', 'public'));
const DEV_MANIFEST = join(ROOT, 'release', 'public.json');
const IS_DEV = existsSync(DEV_MANIFEST);
/** 本地 link: 安装的作用域前缀（拼出来是为了不让本文件自己被隐私扫描命中）。 */
const LOCAL_SCOPE = '@' + 'local/';

/** 公开的文件（相对路径）。 */
const FILES = [
  'index.js',
  'client.js',
  'cordis.patch.yml',
  'icon.svg',
  'README.md',
  'README.en.md',
  'CHANGELOG.md',
  'LICENSE',
  'docs/install.md',
  'docs/install.en.md',
  'docs/compat.md',
];
/** 整个目录一起公开（内部会跳过隐藏文件与构建物）。 */
const DIRS = ['locale', 'market', 'verify', 'scripts', '.github'];

/** 不允许出现在公开产物里的内容（本机路径 / 凭证 / 私有端点 / 客户名）。 */
const FORBIDDEN = [
  [/\/Users\/(?!x\/|example\/)[a-z0-9._-]+/i, '本机绝对路径'],
  [/ghp_[A-Za-z0-9]{20,}/, 'GitHub token'],
  [/github_pat_[A-Za-z0-9_]{20,}/, 'GitHub token'],
  [/sk-[A-Za-z0-9_-]{20,}/, 'API key'],
  [/npm_[A-Za-z0-9]{30,}/, 'npm token'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, '私钥'],
  [/WOCHENG_[A-Z0-9_]*KEY/, '私有 provider key 名'],
  [/wochengtv\.net/, '私有中转端点'],
  [new RegExp('wochen' + 'gai'), '私有账号名'],
  [/yuna\.sun@/, '个人邮箱'],
  [/127\.0\.0\.1/, '本机服务地址'],
  [/localhost:\d+/, '本机服务地址'],
  [new RegExp('@' + 'local/'), '本地 link: 包名'],
  ];
const TEXT_EXT = new Set(['.md', '.js', '.mjs', '.json', '.yml', '.yaml', '.txt', '.svg', '']);
const SKIP_FILES = /(^|\/)(\.DS_Store|.*\.log|.*\.tmp|.*\.tgz|.*\.bak.*)$/;

function walk(dir, out = [], base = dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out, base);
    else out.push(relative(base, full).split(sep).join('/'));
  }
  return out;
}

function scan(violations) {
  const files = IS_DEV ? walk(OUT) : walk(ROOT).filter((f) => f !== 'package-lock.json');
  for (const rel of files) {
    const full = IS_DEV ? join(OUT, rel) : join(ROOT, rel);
    if (!TEXT_EXT.has(extname(rel).toLowerCase())) continue;
    const text = readFileSync(full, 'utf8');
    for (const [pattern, label] of FORBIDDEN) {
      const match = text.match(pattern);
      if (match) violations.push(`${rel}: 命中${label} → ${JSON.stringify(match[0])}`);
    }
  }
  return files;
}

function copyFile(rel, stats) {
  const src = join(ROOT, rel);
  if (!existsSync(src)) throw new Error(`缺少公开文件：${rel}`);
  const dest = join(OUT, rel);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest);
  stats.files += 1;
  stats.bytes += statSync(src).size;
}

function copyDir(rel, stats) {
  const src = join(ROOT, rel);
  if (!existsSync(src)) throw new Error(`缺少公开目录：${rel}`);
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    const child = `${rel}/${entry.name}`;
    if (entry.isDirectory()) {
      copyDir(child, stats);
      continue;
    }
    if (SKIP_FILES.test(child)) continue;
    copyFile(child, stats);
  }
}

if (IS_DEV) {
  if (!OUT.startsWith(ROOT + sep)) {
    throw new Error(`输出目录必须在仓库内（避免误删）：${OUT}`);
  }
  const pub = JSON.parse(readFileSync(DEV_MANIFEST, 'utf8'));
  const dev = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  if (pub.version !== dev.version) {
    throw new Error(`版本不一致：release/public.json=${pub.version} package.json=${dev.version}`);
  }

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const stats = { files: 0, bytes: 0 };
  for (const rel of FILES) copyFile(rel, stats);
  for (const rel of DIRS) copyDir(rel, stats);

  // 包身份的重写：开发树用本地 link: 包名，公开树用 npm 包名。
  writeFileSync(join(OUT, 'package.json'), JSON.stringify(pub, null, 2) + '\n');
  const client = readFileSync(join(OUT, 'client.js'), 'utf8');
  if (!client.includes(`id: '${dev.name}'`)) throw new Error(`client.js 里找不到 ModuleLoader id: '${dev.name}'`);
  const clientPublic = client.split(`id: '${dev.name}'`).join(`id: '${pub.name}'`);
  if (clientPublic.includes(LOCAL_SCOPE)) throw new Error('client.js 重写后仍含本地包名');
  writeFileSync(join(OUT, 'client.js'), clientPublic);

  const patch = readFileSync(join(OUT, 'cordis.patch.yml'), 'utf8');
  const patchPublic = patch.split(dev.name).join(pub.name).split('dsh-plugin-hub').join(pub.name);
  if (!patchPublic.includes(`name: '${pub.name}'`)) throw new Error('cordis.patch.yml 重写失败');
  writeFileSync(join(OUT, 'cordis.patch.yml'), patchPublic);

  const gi = join(ROOT, 'release', '.gitignore');
  if (existsSync(gi)) cpSync(gi, join(OUT, '.gitignore'));

  // 记录产物自身的清单，便于人工核对（不公开进仓库）。
  console.log(`\n输出：${relative(process.cwd(), OUT) || OUT}`);
  console.log(`文件：${stats.files} 个（重写 package.json / client.js id / cordis.patch.yml）`);
}

const violations = [];
const files = scan(violations);
const base = IS_DEV ? OUT : ROOT;
const totals = files.reduce((acc, rel) => {
  const s = statSync(join(base, rel));
  return { files: acc.files + 1, bytes: acc.bytes + s.size };
}, { files: 0, bytes: 0 });

console.log(`\n=== 隐私扫描（${violations.length} 命中）===`);
for (const v of violations) console.log(`  ✗ ${v}`);
console.log(`\n=== 内容清单（${totals.files} 个文件，${(totals.bytes / 1024).toFixed(1)} KiB）===`);
for (const rel of files.sort()) {
  console.log(`  ${String(statSync(join(base, rel)).size).padStart(8)}  ${rel}`);
}

if (violations.length) {
  console.error('\n✗ 隐私扫描未通过，未完成公开产物。');
  process.exit(1);
}
console.log('\n✓ 白名单 + 隐私扫描通过。');
