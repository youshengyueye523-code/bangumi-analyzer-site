/**
 * 站点走查（开发工具，不参与站点运行）：在真实浏览器里逐条路由截图。
 *
 *   node site/scripts/walkthrough.mjs
 *
 * 与 verify.mjs 的分工：
 *   · verify.mjs 回答「有没有坏」：路由、控制台报错、断点溢出、动效预算、端口隔离、站外请求；
 *   · 这个脚本产出「给人看的图」：深浅色 + 窄屏，用于人工视觉走查。
 *
 * 一个必须保留的细节：整页截图（fullPage）不会触发滚动揭示，`.reveal` 元素仍是 opacity:0，
 * 页面下半部会拍成空白。所以每次截图前先滚完整页触发揭示，再回到顶部。
 *
 * 输出目录默认 test-results/site-v1/，可用 SITE_SHOTS_DIR 覆盖。
 * 依赖仓库根目录已有的 Playwright（devDependency）；站点本体零依赖、不参与构建。
 */

import { mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SERVER = fileURLToPath(new URL('../serve.mjs', import.meta.url));
const OUT = process.env.SITE_SHOTS_DIR ?? fileURLToPath(new URL('../../test-results/site-v1/', import.meta.url));

const PAGES = [
  ['home', '/', true],
  ['features', '/features', true],
  ['shots', '/shots', false],
  ['versions', '/versions', false],
  ['version-184', '/versions/1.8.4', true],
  ['archive', '/archive', true],
];
const NARROW = [
  ['home-375', '/'],
  ['features-375', '/features'],
  ['versions-375', '/versions'],
];

/** 启动临时站点服务器（系统分配端口，不占用开发和 Analyzer 的端口） */
function startSite() {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [SERVER, '--port=0'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('站点服务器启动超时'));
    }, 10_000);
    let buffer = '';
    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const match = buffer.match(/http:\/\/127\.0\.0\.1:\d+\//);
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

/** 滚动一整页触发分节揭示，然后回到顶部 —— 否则整页截图会出现空白分节 */
async function revealAll(page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((value) => window.scrollTo(0, value), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
}

const { child, base } = await startSite();
mkdirSync(OUT, { recursive: true });
const errors = [];

try {
  const browser = await chromium.launch();
  for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ colorScheme: theme, viewport: { width: 1440, height: 900 } });
    await context.addInitScript((value) => localStorage.setItem('bangumi-site-theme', value), theme);
    const page = await context.newPage();
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    for (const [name, route, fullPage] of PAGES) {
      await page.goto(`${base}#${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      await revealAll(page);
      await page.screenshot({ path: `${OUT}${name}-${theme}.png`, fullPage });
    }
    await context.close();
  }

  const narrow = await browser.newContext({ viewport: { width: 375, height: 780 } });
  const narrowPage = await narrow.newPage();
  for (const [name, route] of NARROW) {
    await narrowPage.goto(`${base}#${route}`, { waitUntil: 'networkidle' });
    await narrowPage.waitForTimeout(600);
    await revealAll(narrowPage);
    await narrowPage.screenshot({ path: `${OUT}${name}.png` });
  }
  await narrow.close();
  await browser.close();
} finally {
  child.kill();
}

console.log(`[walkthrough] 截图已写入 ${OUT}`);
for (const item of [...PAGES.map(([name]) => `${name}-dark`), ...NARROW.map(([name]) => name)]) {
  console.log(`  · ${item}.png`);
}
if (errors.length) {
  console.error(`[walkthrough] 控制台报错 ${errors.length} 条：\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log('[walkthrough] 控制台报错 0');
