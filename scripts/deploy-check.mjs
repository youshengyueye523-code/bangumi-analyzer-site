/**
 * 独立部署验证（开发工具）：证明站点脱离 Analyzer、脱离本机环境后依然可用。
 *
 *   node site/scripts/deploy-check.mjs
 *
 * 它实际做的事（不是只看代码）：
 *   1. 只把「正式产物子集」复制到一个全新的临时目录 —— index.html、styles/、
 *      scripts/app.js、scripts/content/、assets/；没有 serve.mjs、没有开发工具、没有 README；
 *   2. 用一个独立的极简静态服务器（不是 serve.mjs）在随机端口提供它；
 *   3. 用 Chromium 把该端口映射到不属于 127.0.0.1 的主机名（默认 site.example.test），
 *      并把站点放在子路径 /product/ 下 —— 模拟真实静态托管环境；
 *   4. 逐条路由检查渲染、截图加载、favicon、控制台报错、失败请求，
 *      以及「全程没有任何站外请求」（Analyzer 的 8787 同样属于站外）；
 *   5. 结束后删除临时目录。
 *
 * 退出码 0 = 具备独立部署条件；非 0 = 存在会阻断部署的问题。
 */

import {
  cpSync,
  createReadStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const SITE = fileURLToPath(new URL('../', import.meta.url));
const HOST = process.env.DEPLOY_CHECK_HOST ?? 'site.example.test';
const PREFIX = '/product/';
const ROUTES = ['/', '/features', '/shots', '/versions', '/versions/2.0.0', '/versions/1.9.0', '/versions/1.8.4', '/archive', '/archive/public-demo'];
const PRODUCTION = [
  ['index.html', 'file'],
  ['styles', 'dir'],
  ['scripts/app.js', 'file'],
  ['scripts/content', 'dir'],
  ['assets', 'dir'],
];
const DEV_ONLY = [
  'serve.mjs',
  'start-site.bat',
  'README.md',
  'WEBSITE_CONSTITUTION.md',
  'scripts/capture.mjs',
  'scripts/verify.mjs',
  'scripts/walkthrough.mjs',
  'scripts/deploy-check.mjs',
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
};

const failures = [];
const notes = [];
const check = (ok, message) => (ok ? notes.push(`  ✓ ${message}`) : failures.push(`  ✗ ${message}`));

const root = mkdtempSync(join(tmpdir(), 'ba-site-deploy-'));
const htdocs = join(root, 'htdocs');

try {
  /* 1) 只复制正式产物子集 */
  for (const [entry, kind] of PRODUCTION) {
    const from = join(SITE, entry);
    const to = join(htdocs, entry);
    mkdirSync(kind === 'dir' ? to : dirname(to), { recursive: true });
    cpSync(from, to, { recursive: true });
  }
  const leftover = DEV_ONLY.filter((entry) => existsSync(join(htdocs, entry)));
  check(leftover.length === 0, `部署目录里没有开发工具${leftover.length ? `：${leftover.join('、')}` : ''}`);
  const fileCount = (dir) =>
    readdirSync(dir, { withFileTypes: true }).reduce(
      (total, item) => total + (item.isDirectory() ? fileCount(join(dir, item.name)) : 1),
      0,
    );
  notes.push(`  · 产物子集共 ${fileCount(htdocs)} 个文件（${PRODUCTION.map(([name]) => name).join('、')}）`);

  /* 1b) 产物里不能出现本机绝对路径 */
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((item) =>
      item.isDirectory() ? walk(join(dir, item.name)) : [join(dir, item.name)],
    );
  const absolutePathHits = walk(htdocs)
    .filter((file) => /\.(html|css|js|svg)$/i.test(file))
    .filter((file) => /[A-Za-z]:\\|\/Users\/|\/home\/|\\\\\?\\/.test(readFileSync(file, 'utf8')))
    .map((file) => file.slice(htdocs.length + 1));
  check(
    absolutePathHits.length === 0,
    `产物里没有本机绝对路径${absolutePathHits.length ? `：${absolutePathHits.join('、')}` : ''}`,
  );

  /* 2) 独立静态服务器：只做「目录 → 文件」，不是 serve.mjs */
  const server = createServer((request, response) => {
    let pathname = decodeURIComponent((request.url ?? '/').split('?')[0]);
    if (!pathname.startsWith(PREFIX)) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('404');
      return;
    }
    pathname = pathname.slice(PREFIX.length);
    if (pathname === '' || pathname.endsWith('/')) pathname += 'index.html';
    const file = join(htdocs, pathname);
    if (!file.startsWith(htdocs) || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('404');
      return;
    }
    response.writeHead(200, { 'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream' });
    createReadStream(file).pipe(response);
  });
  await new Promise((resolvePromise) => server.listen(0, '127.0.0.1', resolvePromise));
  const port = server.address().port;

  /* 3) 真实浏览器：主机名映射 + 逐条路由检查 */
  const launchArgs = { args: [`--host-resolver-rules=MAP ${HOST} 127.0.0.1`] };
  const browser = await chromium.launch(launchArgs).catch((error) => {
    if (!/Executable doesn't exist/i.test(error?.message ?? '')) throw error;
    return chromium.launch({ ...launchArgs, channel: 'msedge' });
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  /*
   * 主机名选择：默认用非 127.0.0.1 的测试主机名（模拟真实静态托管）。
   * 某些受限网络环境会把「非 loopback 名称」的请求拦截成 502（与被测站点无关），
   * 这时显式回退到 localhost 并在结论里说明 —— 不静默通过，也不把环境限制算成站点失败。
   * 探测必须在注册请求监听之前完成，否则环境拦截产生的 502 会被算进站点的失败请求。
   */
  let activeHost = HOST;
  for (const candidate of [HOST, 'localhost']) {
    const probe = await page
      .goto(`http://${candidate}:${port}${PREFIX}`, { waitUntil: 'domcontentloaded' })
      .catch(() => null);
    if (probe?.status() === 200) {
      activeHost = candidate;
      break;
    }
    if (candidate === HOST) {
      notes.push(
        `  · 主机名 ${HOST} 被当前网络环境拦截（HTTP ${probe?.status() ?? '连接失败'}），已回退到 localhost 验证子目录部署（其余检查项不变）`,
      );
    }
  }
  const base = `http://${activeHost}:${port}${PREFIX}`;
  notes.push(
    `  · 模拟公开地址：${base}（主机名不是 127.0.0.1，且位于子目录）`,
  );

  const consoleErrors = [];
  const failed = [];
  const offSite = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`);
  });
  page.on('request', (request) => {
    const url = request.url();
    if (!/^https?:/i.test(url)) return;
    if (new URL(url).origin !== new URL(base).origin) offSite.push(url);
  });

  let rendered = 0;
  for (const route of ROUTES) {
    await page.goto(`${base}#${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const heading = await page.locator('#view h1, #view h2').first().textContent();
    if (heading?.trim()) rendered += 1;
  }
  check(rendered === ROUTES.length, `${ROUTES.length} 条路由全部渲染（${rendered}/${ROUTES.length}）`);

  await page.goto(`${base}#/shots`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const shotLoaded = await page.evaluate(() => {
    const image = document.querySelector('[data-shot-stage] img');
    return Boolean(image?.complete && image.naturalWidth > 0);
  });
  check(shotLoaded, '真实界面截图从部署目录正常加载');

  const favicon = await page.evaluate(async () => {
    const response = await fetch(document.querySelector('link[rel="icon"]').href);
    return response.ok;
  });
  check(favicon, 'favicon 可访问');

  check(consoleErrors.length === 0, `无控制台报错${consoleErrors.length ? `：${consoleErrors[0]}` : ''}`);
  check(failed.length === 0, `无失败请求${failed.length ? `：${failed[0]}` : ''}`);
  check(offSite.length === 0, `没有对站外主机的请求${offSite.length ? `：${offSite[0]}` : ''}`);

  await context.close();
  await browser.close();
  server.close();
} catch (error) {
  failures.push(`  ✗ 验证过程出错：${error.message}`);
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log('独立部署验证结果：');
console.log([...notes, ...failures].join('\n'));
if (failures.length) {
  console.log(`\n${failures.length} 项未通过`);
  process.exit(1);
}
console.log('\n可以独立静态部署：不依赖 Analyzer、127.0.0.1、8787 / 8789、Node 或本机路径。');
