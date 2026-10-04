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
import { findVersion, sortedVersions } from './content/versions.js';

const ANALYZER = process.env.ANALYZER_URL ?? 'http://127.0.0.1:8787';
const ROUTES = [
  ['首页', '/'],
  ['功能', '/features'],
  ['界面', '/shots'],
  ['版本', '/versions'],
  ['版本详情', '/versions/1.8.2'],
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

  const allText = [];
  for (const [label, route] of ROUTES) {
    await page.goto(`${base}#${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const heading = await page.locator('#view h1, #view h2').first().textContent();
    check(Boolean(heading?.trim()), `${label} 渲染出内容（${heading?.trim().slice(0, 24)}）`);
    allText.push(await page.locator('body').innerText());
  }
  /*
   * 版本守门（v1.0.7 起）：
   * - 全站必须写出「本站当前记录的 Analyzer 版本」(website.analyzer)；
   * - 任何 Analyzer 版本号都不得高于这个记录版本 —— 不存在的版本只允许出现在
   *   历史记录里（历史版本一定 ≤ 当前记录），不依赖硬编码的某一个「未来版本」。
   *   本站自己的 v1.0.x 序列单独编号，不参与这条比较。
   */
  const siteText = allText.join(' ');
  check(siteText.includes(`Analyzer 版本：v${website.analyzer}`), `全站写出当前记录的 Analyzer v${website.analyzer}`);
  const recorded = website.analyzer.split('.').map(Number);
  const claimed = new Set();
  for (const match of siteText.matchAll(/v(\d+)\.(\d+)\.(\d+)/g)) {
    const parts = [Number(match[1]), Number(match[2]), Number(match[3])];
    // Website 自己的版本序列（v1.0.x）不参与 Analyzer 版本比较
    if (parts[0] === 1 && parts[1] === 0) continue;
    claimed.add(parts.join('.'));
  }
  const tooNew = [...claimed].filter((value) => {
    const [major, minor, patch] = value.split('.').map(Number);
    return (
      major > recorded[0] ||
      (major === recorded[0] && minor > recorded[1]) ||
      (major === recorded[0] && minor === recorded[1] && patch > recorded[2])
    );
  });
  check(tooNew.length === 0, `全站没有把未发生的 Analyzer 版本写成已存在（${tooNew.join('、') || '无'}）`);
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
  const cards = page.locator('#view .feature-entries .entry-card');
  const cardCount = await cards.count();
  const links = await cards.evaluateAll((elements) => elements.map((element) => element.getAttribute('href')));
  check(cardCount === features.length, `首页展示全部 ${features.length} 个 Feature 入口（当前 ${cardCount}）`);

  const archiveCards = page.locator('#view .archive-entries .entry-card');
  const archiveCount = await archiveCards.count();
  const archiveHrefs = await archiveCards.evaluateAll((elements) =>
    elements.map((element) => element.closest('a')?.getAttribute('href') ?? ''),
  );
  check(archiveCount === 4, `首页档案入口 4 张（当前 ${archiveCount}）`);
  check(archiveHrefs.includes('#/archive/public-demo'), '首页有一张直达 Public Demo 里程碑的入口卡');

  // 真实点击路径
  await cards.first().click();
  await page.waitForTimeout(400);
  const clickedHash = await page.evaluate(() => location.hash);
  const clickedId = clickedHash.split('/').pop();
  check(
    clickedHash.startsWith('#/features/') && (await sectionInView(clickedId)),
    `点击首页入口进入功能页并定位（${clickedHash}）`,
  );

  // 直接打开 / 刷新路径：4 个 Feature + 1 个档案锚点
  const anchors = [...links, ...archiveHrefs.filter((href) => href.startsWith('#/archive/'))];
  let located = 0;
  let problem = '';
  for (const href of anchors) {
    await page.goto(`${base}${href}`, { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' });
    // 站点的平滑滚动要等它落位再测
    await page.waitForTimeout(900);
    const id = href.split('/').pop();
    const ok = await sectionInView(id);
    if (ok) located += 1;
    else if (!problem) problem = href;
  }
  check(
    located === anchors.length,
    `深链接直接打开 / 刷新都定位正确（${located}/${anchors.length}${problem ? `；${problem}` : ''}）`,
  );

  /* 2d) Public Demo 里程碑与版本表述 */
  await page.goto(`${base}#/archive`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const archiveBody = await page.locator('#view').innerText();
  check(archiveBody.includes('Public Demo 已正式上线'), '档案页记录 Public Demo 里程碑');
  check(archiveBody.includes('https://bangumi-analyzer-demo.vercel.app'), '里程碑包含正式地址');
  check(archiveBody.includes('Analyzer v1.5.0 快照'), '写清 Public Demo 对应上线时的 Analyzer v1.5.0 快照');
  check(archiveBody.includes('公开展品不会随之更新'), '写明公开展品不随 Analyzer 更新');
  check(!archiveBody.includes('仍然是 v1.5.0'), '不再写「Analyzer 本体仍然是 v1.5.0」');
  check(archiveBody.includes('部署复盘 · 5 个阶段'), '档案页包含 Vercel 部署复盘（5 个阶段）');

  /* 2e) 本地运行说明必须与 serve.mjs 的真实行为一致 */
  check(
    archiveBody.includes('node serve.mjs') && archiveBody.includes('127.0.0.1:8789'),
    '本地运行说明与 serve.mjs 行为一致（node serve.mjs / 127.0.0.1:8789）',
  );

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

  /* 6b) 16 张真实截图都必须来自高分辨率源图（取景框最宽 ~1114px，高分屏需要 ~2200px 以上） */
  const shotSizes = [];
  for (const theme of ['深色', '浅色']) {
    await page.locator('[data-viewer]').getByRole('button', { name: theme, exact: true }).click();
    for (const id of [
      'dashboard',
      'library',
      'series',
      'series-detail',
      'franchise-detail',
      'analysis',
      'diagnostics',
      'settings',
    ]) {
      await page.locator(`[data-shot-id="${id}"]`).click();
      await page
        .waitForFunction(() => {
          const image = document.querySelector('[data-shot-stage] img');
          return Boolean(image?.complete && image.naturalWidth > 0);
        })
        .catch(() => {});
      const size = await page.evaluate(() => {
        const image = document.querySelector('[data-shot-stage] img');
        return [image?.naturalWidth ?? 0, image?.naturalHeight ?? 0];
      });
      shotSizes.push({ id, theme, width: size[0], height: size[1] });
    }
  }
  const blurry = shotSizes.filter((item) => item.width < 2000);
  check(
    blurry.length === 0,
    `16 张截图源图均 ≥ 2000px 宽（最小 ${Math.min(...shotSizes.map((item) => item.width))}px，共 ${shotSizes.length} 张）`,
  );

  /* 6c) 版本历史：真实发布 / 维护节点必须分别成立（v1.0.9 纠偏）
   * v1.8.0 / v1.8.1 / v1.8.2 是三个真实版本，不能被合并成一个阶段条目；
   * 每个版本页只回答自己版本发生了什么。 */
  await page.goto(`${base}#/versions`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  const timelineText = await page.locator('#view').innerText();
  check(
    timelineText.includes(`共 ${sortedVersions().length} 个版本`),
    `版本时间线写出共 ${sortedVersions().length} 个版本`,
  );
  const timelineOrder = (
    await page.locator('#view .timeline-item .timeline-version').allTextContents()
  ).map((text) => text.trim().split(/\s+/)[0]);
  check(
    timelineOrder.slice(0, 4).join(' ') === 'v1.8.2 v1.8.1 v1.8.0 v1.7.0',
    `时间线顺序为 v1.8.2 → v1.8.1 → v1.8.0 → v1.7.0（实际：${timelineOrder.slice(0, 4).join(' → ')}）`,
  );
  for (const version of ['1.8.2', '1.8.1', '1.8.0', '1.7.0']) {
    await page.goto(`${base}#/versions/${version}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(150);
    const expected = findVersion(version);
    const heading = ((await page.locator('#view h1').first().textContent()) ?? '').trim();
    check(Boolean(expected) && heading === expected.title, `v${version} 版本页回答自己的版本（${heading}）`);
  }

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
