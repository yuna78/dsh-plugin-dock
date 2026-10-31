#!/usr/bin/env node
/**
 * dsh-plugin-dock 冒烟测试。不联网、不开 DSH、不开浏览器：
 *
 *   1) npm 包契约（能装 / 能被市场识别 / 不会把内部文件发出去）
 *   2) 两张清单一致（dev 树 package.json ↔ release/public.json）
 *   3) cordis.patch.yml 插入的模块名 = 包名；client.js 的 ModuleLoader id = 包名
 *   4) 客户端半部依赖的槽位 / 跳转通道还在（shell.overlay、sidebar.panellist、selectPanel、openBundle）
 *   5) locale 字典 zh/en 键集一致
 *   6) 公开文件里没有本机路径 / token / 私有端点
 *
 * 运行：
 *   node verify/smoke.mjs          # 开发树（读 release/public.json + package.json）
 *   node verify/smoke.mjs --public # 公开仓（package.json 就是发布清单）
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/** 本地 link: 安装的作用域前缀（拼出来是为了不让本文件自己被隐私扫描命中）。 */
const LOCAL_SCOPE = '@' + 'local/';
const AS_PUBLIC = process.argv.includes('--public') || !existsSync(join(ROOT, 'release', 'public.json'));
const failures = [];
const warnings = [];
let passes = 0;

const ok = (m) => { passes += 1; };
const fail = (m) => failures.push(m);
const warn = (m) => warnings.push(m);
const check = (cond, m, level = 'fail') => {
  if (cond) return ok(m);
  if (level === 'warn') warn(m); else fail(m);
  return undefined;
};
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const has = (rel) => existsSync(join(ROOT, rel));

/** 公开文件里不该出现的东西：本机路径、凭证、私有端点。 */
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

// ------------------------------------------------------------- 1. 发布清单
const pkg = JSON.parse(read('package.json'));
const devPkg = JSON.parse(read('package.json'));
const manifest = AS_PUBLIC ? pkg : JSON.parse(read('release/public.json'));
const label = AS_PUBLIC ? '公开仓' : '开发树';

check(/^dsh-plugin-[a-z0-9-]+$/.test(manifest.name), `包名应为 dsh-plugin-<x>：${manifest.name}`);
check(manifest.private === false, 'private 必须是 false，否则 npm publish 会 EPRIVATE');
check(/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(manifest.version), `版本号不合法：${manifest.version}`);
check(manifest.description && manifest.description.length >= 40, 'description 太短，市场看不清用途');
check(Array.isArray(manifest.files) && manifest.files.length > 0, '缺 files 白名单');
check(
  manifest.keywords?.includes('dsh') && manifest.keywords?.includes('dsh-plugin'),
  'keywords 至少要有 dsh / dsh-plugin',
);
check(manifest.license === 'MIT', `license 应为 MIT：${manifest.license}`);
check(manifest.author, '缺 author');
check(!!manifest.homepage, '缺 homepage');
check(!!manifest.bugs?.url, '缺 bugs.url');
check(!!manifest.repository?.url, '缺 repository —— 市场靠它判定 npm 归属');
check(
  /github\.com[/:]yuna78\/dsh-plugin-dock/.test(manifest.repository?.url || ''),
  `repository 必须指向 https://github.com/yuna78/dsh-plugin-dock：${manifest.repository?.url}`,
);
check(!!manifest.engines?.dsh, '缺 engines.dsh 兼容范围');
check(
  /-rc\./.test(manifest.engines?.dsh || ''),
  'engines.dsh 里没有预发布比较符 —— DSH 还在 -rc 线时会被静默排除',
  'warn',
);
check(
  !!manifest.peerDependencies?.['@deepseek-ai/dsh'],
  '缺 peerDependencies["@deepseek-ai/dsh"]，安装时不会校验宿主版本',
  'warn',
);
check(/^\^?22/.test(manifest.engines?.node || ''), `engines.node 应含 22.x：${manifest.engines?.node}`, 'warn');

// ------------------------------------------------------- 2. 可安装性 + 身份
const patchRel = manifest.dsh?.bundle?.patch;
check(!!patchRel, '缺 dsh.bundle.patch —— 市场会判「不可安装」');
check(!!manifest.dsh?.client, '缺 dsh.client —— 没有前端半部');
check(manifest.dsh?.client?.platform === 'web', 'dsh.client.platform 必须是 web');
check(manifest.dsh?.client?.immediately === true, 'dsh.client.immediately 应为 true（首屏就挂 overlay）', 'warn');
for (const dep of manifest.dsh?.client?.inject || []) {
  check(String(dep).startsWith('@deepseek-ai/'), `dsh.client.inject 里应写 npm 包名（不是服务名）：${dep}`);
}

if (patchRel && has(patchRel)) {
  const patch = read(patchRel);
  const expectName = AS_PUBLIC ? manifest.name : devPkg.name;
  check(patch.includes(`name: '${expectName}'`), `cordis.patch.yml 的 name 应为 ${expectName}`);
  check(/- insert:/.test(patch), 'cordis.patch.yml 缺 insert 段');
  check(AS_PUBLIC ? !/dsh-plugin-hub/.test(patch) : true, 'cordis.patch.yml 里还残留旧包名 dsh-plugin-hub');
} else if (patchRel) {
  fail(`dsh.bundle.patch 指向的文件不存在：${patchRel}`);
}

if (AS_PUBLIC) {
  check(devPkg.name === manifest.name, `package.json 的 name 不匹配：${devPkg.name}`);
} else {
  check(manifest.version === devPkg.version, `版本不一致：release/public.json=${manifest.version} package.json=${devPkg.version}`);
}

// ------------------------------------------------------------------ 3. 图标
const iconRel = manifest.icon;
if (!iconRel) {
  warn('没声明 icon —— DSH 插件面板 / 市场卡片会显示默认插画');
} else {
  check(!/^(https?:)?\/\//.test(iconRel) && !iconRel.startsWith('/') && !iconRel.includes('..'), `icon 必须是包内相对路径：${iconRel}`);
  check(/\.(svg|png|jpe?g|webp)$/i.test(iconRel), `icon 只接受 svg/png/jpg/jpeg/webp：${iconRel}`);
  if (has(iconRel)) {
    const bytes = statSync(join(ROOT, iconRel)).size;
    check(bytes > 0 && bytes <= 256 * 1024, `icon 大小异常（${bytes} 字节，上限 256KiB）`);
  } else {
    fail(`icon 指向的文件不存在：${iconRel}`);
  }
  const files = manifest.files || [];
  const covered = files.some((f) => (f.endsWith('/') ? iconRel.startsWith(f) : f === iconRel));
  check(covered, `icon 没被 files 白名单覆盖：${iconRel}`);
}

// -------------------------------------------------------------- 4. 客户端半部
const client = read('client.js');
const syntax = spawnSync(process.execPath, ['--check', join(ROOT, 'client.js')], { encoding: 'utf8' });
check(syntax.status === 0, `client.js 语法错误：${(syntax.stderr || '').trim().split('\n')[0]}`);
check(client.includes('window.__ModuleLoader__.load('), 'client.js 没有注册 ModuleLoader 模块');
check(
  client.includes(`id: '${AS_PUBLIC ? manifest.name : devPkg.name}'`),
  `client.js 的 ModuleLoader id 必须是 ${AS_PUBLIC ? manifest.name : devPkg.name}`,
);
check(AS_PUBLIC ? !client.includes(LOCAL_SCOPE) : true, 'client.js 里仍有本地 link: 包名');
check(client.includes("'shell.overlay'"), 'client.js 不再注册 shell.overlay');
check(client.includes("'sidebar.panellist'"), 'client.js 不再读取 sidebar.panellist');
check(client.includes('ctx.slots.register('), 'client.js 没有 ctx.slots.register(');
check(client.includes('ctx.layout.selectPanel(') || client.includes('selectPanel('), 'client.js 没有 selectPanel 跳转');
check(client.includes('openBundle('), 'client.js 没有 pluginNavigation.openBundle 深链');
check(client.includes("require('react')") && !/require\('@deepseek-ai\//.test(client), 'client.js 只能 require react，不能 import Harness 客户端包');
check(client.includes("OVERLAY_ID = 'dsh-plugin-dock'"), 'OVERLAY_ID 应为 dsh-plugin-dock');
check(!/data-dsh-hub/.test(client), 'client.js 里还残留旧 data 属性 data-dsh-hub-*');
check(read('index.js').includes('export function apply'), 'index.js 缺 host 半部 apply()');

// --------------------------------------------------------------- 5. locale
const zh = JSON.parse(read('locale/zh.json'));
const en = JSON.parse(read('locale/en.json'));
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [`${p}${k}`]));
check(JSON.stringify(flat(zh).sort()) === JSON.stringify(flat(en).sort()), 'locale zh/en 键集不一致');
check(!!zh.meta?.title && !!zh.meta?.description, 'locale/zh.json 缺 meta.title / meta.description');
check(!!en.meta?.title && !!en.meta?.description, 'locale/en.json 缺 meta.title / meta.description');
check(zh.meta?.title === '插件坞', `locale/zh.json 的 meta.title 应为「插件坞」：${zh.meta?.title}`, 'warn');
check(en.meta?.title === 'Plugin Dock', `locale/en.json 的 meta.title 应为 "Plugin Dock"：${en.meta?.title}`, 'warn');

// ------------------------------------------------- 6. 白名单 + 隐私扫描
const files = manifest.files || [];
for (const entry of files) {
  check(has(entry.replace(/\/$/, '')), `files 白名单里的 ${entry} 不存在`);
}
for (const bad of ['verify/', 'test/', 'scripts/', 'release/', 'research/', 'dist/', 'node_modules/']) {
  check(!files.some((f) => f.startsWith(bad)), `files 白名单不该包含 ${bad}`);
}

// 开发树只扫「会被发出去的那批文件」，和 build-public-bundle.mjs 的白名单保持一致。
const PUBLISH_FILES = [
  'index.js', 'client.js', 'icon.svg', 'README.md', 'README.en.md',
  'CHANGELOG.md', 'LICENSE', 'docs/install.md', 'docs/install.en.md', 'docs/compat.md',
];
const PUBLISH_DIRS = ['locale', 'market', 'verify', 'scripts', '.github'];
const scanTargets = (AS_PUBLIC
  ? walk(ROOT)
  : [...PUBLISH_FILES, ...PUBLISH_DIRS.flatMap((d) => walk(join(ROOT, d), [], ROOT))]
).filter((rel) => {
  if (!TEXT_EXT.has(extname(rel).toLowerCase())) return false;
  return !SKIP_FILES.test(rel);
});
if (!AS_PUBLIC) {
  // 开发树的 client.js 用本地包名注册 ModuleLoader，属预期，扫描时剥掉。
  const rel = 'client.js';
  const text = read(rel).split(`id: '${devPkg.name}'`).join(`id: '<dev-id>'`);
  for (const [pattern, labelText] of FORBIDDEN) {
    const m = text.match(pattern);
    check(!m, `${rel}: 命中${labelText} → ${m ? JSON.stringify(m[0]) : ''}`);
  }
}
for (const rel of scanTargets) {
  if (!AS_PUBLIC && rel === 'client.js') continue;
  const text = read(rel);
  for (const [pattern, labelText] of FORBIDDEN) {
    const m = text.match(pattern);
    check(!m, `${rel}: 命中${labelText} → ${m ? JSON.stringify(m[0]) : ''}`);
  }
}

// -------------------------------------------------------------- 7. 文档
const readme = read('README.md');
check(readme.includes('dsh plugin --profile web add dsh-plugin-dock'), 'README 缺安装命令（npm 包名要写对）', 'warn');
check(has('docs/install.md'), '缺 docs/install.md');
check(has('CHANGELOG.md'), '缺 CHANGELOG.md');
check(has('LICENSE'), '缺 LICENSE');
check(has('market/yuna78__dsh-plugin-dock.yml'), '缺市场投稿文件 market/yuna78__dsh-plugin-dock.yml');

// ------------------------------------------------------------------ 汇总
console.log(`\n${label}：PASS ${passes} · WARN ${warnings.length} · FAIL ${failures.length}\n`);
for (const w of warnings) console.log(`  ! ${w}`);
for (const f of failures) console.log(`  ✗ ${f}`);
if (failures.length) {
  console.log('\n✗ 冒烟测试未通过。');
  process.exit(1);
}
console.log('✓ 冒烟测试通过（视觉/交互仍需在运行中的 DSH 页面里人工确认）。');
