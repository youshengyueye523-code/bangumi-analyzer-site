/**
 * 官网自检（Playwright）：路由 / 控制台报错 / 断点溢出 / 动效预算 / 减少动效 / 端口隔离。
 *
 *   node site/scripts/verify.mjs
 *
 * 脚本会用 `--port=0` 启动一个临时站点服务器（系统分配端口），
 * 因此不会占用 Analyzer 的 8787，也不需要事先手动启动官网。
 */

import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import { website } from './content/site-versions.js';
import { features } from './content/features.js';

const ANALYZER = process.env.ANALYZER_URL ?? 'http://127.0.0.1:8787';
const ROUTES = [
  ['首页', '/'],
  ['功能', '/features'],
  ['界面', '/shots'],
  ['版本', '/versions'],
  ['版本详情', '/versions/1.5.0'],
  ['档案', '/archive'],
];
const WIDTHS = [1920, 1440, 1280, 1024, 768, 600, 480, 420, 375];

const failures = [];
const notes = [];
const check = (ok, message) => {
  if (ok) notes.push(`  ✓ ${message}`);
  else failures.push(`  ✗ ${message}`);
};

/** 启动临时站点服务器并解析出实际端口 */
function startSite() {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, ['site/serve.mjs', '--port=0'], { stdio: ['ignore', 'pipe', 'pipe'] });
    let buffer = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('站点服务器启动超时'));
    }, 10_000);
    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const match = buffer.match(/http:\/\/127\.0\.0\.1:(\d+)\//);
      if (match) {
        clearTimeout(timer);
        resolvePromise({ child, base: match[0] });
      }
    });
    child.stderr.on('data', (chunk) => {
      clearTimeout(timer);
      reject(new Error(chunk.toString()));
    });
  });
}

/** 端口隔离：显式请求 8787 时必须被拒绝 */
function checkPortGuard() {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, ['site/serve.mjs', '--port=8787'], { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk.toString()));
    child.stderr.on('data', (chunk) => (output += chunk.toString()));
    child.on('exit', (code) => resolvePromise({ code, output }));
  });
}

const { child, base } = await startSite();

try {
  /* 1) 端口隔离与共存 */
  const guard = await checkPortGuard();
  check(guard.code !== 0 && guard.output.includes('8787'), '拒绝占用 Analyzer 的 8787 端口');

  const analyzer = await fetch(`${ANALYZER}/api/health`).catch(() => null);
  if (analyzer?.ok) {
    const health = await analyzer.json();
    check(health.ok === true, `官网运行期间 Analyzer 仍然健康（v${health.version}）`);
  } else {
    notes.push('  · Analyzer 未运行，跳过「同时运行」检查');
  }
  check(!base.includes(':8787'), `官网使用独立端口（${base}）`);

  const browser = await chromium.launch();

  /* 2) 路由 + 控制台 + 资源 */
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  const offSiteRequests = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => failedRequests.push(request.url()));
  page.on('request', (request) => {
    const url = request.url();
    // 独立部署的硬约束：页面不能请求任何站外主机（Analyzer、CDN、字体服务都不行）
    if (!/^https?:/i.test(url)) return;
    if (new URL(url).origin !== new URL(base).origin) offSiteRequests.push(url);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`);
  });

  for (const [label, route] of ROUTES) {
    await page.goto(`${base}#${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const heading = await page.locator('#view h1, #view h2').first().textContent();
    check(Boolean(heading?.trim()), `${label} 渲染出内容（${heading?.trim().slice(0, 24)}）`);
  }
  check(consoleErrors.length === 0, `无控制台报错${consoleErrors.length ? `：${consoleErrors[0]}` : ''}`);
  check(failedRequests.length === 0, `无失败请求${failedRequests.length ? `：${failedRequests[0]}` : ''}`);
  check(
    offSiteRequests.length === 0,
    `全程没有站外请求${offSiteRequests.length ? `：${offSiteRequests[0]}` : ''}`,
  );

  /* 2b) 本站自己的版本标识与同步规则 */
  await page.goto(`${base}#/archive`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const footerVersion = (await page.locator('#footer-version').textContent())?.trim() ?? '';
  check(
    footerVersion.includes(`v${website.version}`),
    `页脚标识本站版本 v${website.version}（实际：${footerVersion || '空'}）`,
  );
  const archiveText = await page.locator('#view').innerText();
  check(archiveText.includes('Website 版本与同步规则'), '档案页记录本站版本与同步规则');

  /* 2c) 首页四项 Feature 与深链接 */
  /** 目标区块是否正好滚到「顶栏下方」的位置 */
  const sectionInView = (id) =>
    page.evaluate((target) => {
      const section = document.getElementById(target);
      if (!section) return false;
      const nav = document.querySelector('.nav-wrap')?.getBoundingClientRect().height ?? 0;
      const top = section.getBoundingClientRect().top;
      return top >= -4 && top <= nav + 60;
    }, id);

  await page.goto(`${base}#/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const cards = page.locator('#view .entries.four .entry-card');
  const cardCount = await cards.count();
  const links = await cards.evaluateAll((elements) => elements.map((element) => element.getAttribute('href')));
  check(cardCount === features.length, `首页展示全部 ${features.length} 个 Feature 入口（当前 ${cardCount}）`);

  // 真实点击路径
  await cards.first().click();
  await page.waitForTimeout(400);
  const clickedHash = await page.evaluate(() => location.hash);
  const clickedId = clickedHash.split('/').pop();
  check(
    clickedHash.startsWith('#/features/') && (await sectionInView(clickedId)),
    `点击首页入口进入功能页并定位（${clickedHash}）`,
  );

  // 直接打开 / 刷新路径
  let located = 0;
  let problem = '';
  for (const href of links) {
    await page.goto(`${base}${href}`, { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const id = href.split('/').pop();
    const ok = await sectionInView(id);
    if (ok) located += 1;
    else if (!problem) problem = href;
  }
  check(located === links.length, `四个深链接直接打开 / 刷新都定位正确（${located}/${links.length}${problem ? `；${problem}` : ''}）`);

  /* 3) 动效预算：进入首页 1.6s 后不应存在持续运行的动画 */
  await page.goto(`${base}#/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  const running = await page.evaluate(() =>
    // 用 Web Animations API 判断「此刻是否真的在播」，而不是看 animation-play-state
    document.getAnimations().filter((animation) => animation.playState === 'running').length,
  );
  check(running === 0, `首屏入场结束后没有持续运行的动画（当前 ${running}）`);

  const parallaxTargets = await page.evaluate(
    () => document.querySelectorAll('.device[style*="--float-y"]').length,
  );
  check(parallaxTargets <= 1, `视差只作用在一个元素上（当前 ${parallaxTargets}）`);

  /* 4) 减少动效：内容必须立即可见 */
  const reduced = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(`${base}#/`, { waitUntil: 'networkidle' });
  await reducedPage.waitForTimeout(300);
  const hidden = await reducedPage.evaluate(
    () =>
      Array.from(document.querySelectorAll('.reveal, .enter')).filter((element) => {
        const style = getComputedStyle(element);
        return Number(style.opacity) < 0.99;
      }).length,
  );
  check(hidden === 0, `prefers-reduced-motion 下没有隐藏内容（当前 ${hidden}）`);
  await reduced.close();

  /* 5) 断点扫描：无横向溢出 */
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    for (const [label, route] of ROUTES) {
      await page.goto(`${base}#${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(160);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (overflow > 2) failures.push(`  ✗ ${label} 在 ${width}px 横向溢出 ${overflow}px`);
    }
  }
  notes.push(`  ✓ ${WIDTHS.length} 个断点 × ${ROUTES.length} 条路由无横向溢出`);

  /* 6) 交互：演示与截图取景框 */
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}#/features`, { waitUntil: 'networkidle' });
  const demo = page.locator('[data-demo]');
  await demo.getByRole('button', { name: '奇幻' }).click();
  await demo.getByRole('button', { name: '日常' }).click();
  await demo.getByRole('button', { name: '仅显示已评分' }).click();
  const demoCount = await demo.locator('[data-demo-count]').textContent();
  check(demoCount === '3', `演示计数等于选中的条件数（显示 ${demoCount}）`);

  await page.goto(`${base}#/shots`, { waitUntil: 'networkidle' });
  await page.locator('[data-viewer]').getByRole('button', { name: '浅色', exact: true }).click();
  await page.waitForTimeout(200);
  const shotSource = await page.locator('[data-shot-stage] img').getAttribute('src');
  check(shotSource?.includes('-light.webp'), `截图可切换主题（当前 ${shotSource}）`);

  await context.close();
  await browser.close();
} finally {
  child.kill();
}

console.log('官网自检结果：');
console.log([...notes, ...failures].join('\n'));
if (failures.length) {
  console.log(`\n${failures.length} 项未通过`);
  process.exit(1);
}
console.log('\n全部通过');
