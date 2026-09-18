/**
 * 开发工具：从**正在运行**的 Analyzer 采集官网用的真实界面截图。
 *
 *   node site/scripts/capture.mjs            # 需要 Analyzer 已在 127.0.0.1:8787 运行
 *
 * 两条自我约束：
 *   1. 只为截图临时把「昵称 / 头像 / 背景」换成中性值，采集结束后**原样恢复**
 *      （背景图片会按内容重新上传，拿回同一个文件名）。
 *   2. 覆盖式写入 site/assets/shots/*.webp，PNG 中间产物不落盘。
 *   3. 以 viewport 1440×900 + deviceScaleFactor 2 采集，输出 2880×1800（16:10），
 *      CSS 布局与产品内容不变，只提高像素密度 —— 高分屏下才不糊。
 *
 * 依赖说明：脚本使用仓库根目录已有的 Playwright（devDependency）。
 * 官网本体零依赖；这个脚本只在需要更新截图时手动运行。
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const ANALYZER = process.env.ANALYZER_URL ?? 'http://127.0.0.1:8787';
const OUT = new URL('../assets/shots/', import.meta.url);
const VIEWPORT = { width: 1440, height: 900 };
/*
 * 2× 像素密度：CSS 布局完全不变，但输出 2880×1800。
 * 网站截图取景框最宽会显示到 ~1114px，高分屏下需要 ~2200px 以上的源图才不糊。
 */
const SCALE = 2;
/**
 * 8 张合计预算约 2.8 MiB。2× 分辨率下 0.9 会让封面密集的收藏库截图超过 ~450 KB/张，
 * 因此统一用 0.85 —— 清晰度主要来自 2880×1800 的分辨率，而不是这一档质量差。
 */
const QUALITY = 0.85;

const PAGES = [
  { id: 'dashboard', path: '/', label: '仪表盘' },
  { id: 'library', path: '/library', label: '收藏库' },
  { id: 'analysis', path: '/analysis', label: '统计分析' },
  { id: 'settings', path: '/settings?tab=appearance', label: '设置 · 外观' },
];

async function api(path, options) {
  const response = await fetch(`${ANALYZER}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...options,
  });
  if (!response.ok) throw new Error(`${path} → ${response.status} ${await response.text()}`);
  return response.json();
}

async function ensureAnalyzer() {
  try {
    await api('/api/health');
  } catch {
    console.error(
      `[capture] 无法连接 ${ANALYZER}。请先启动 Analyzer（双击 start-bangumi.bat），再运行本脚本。`,
    );
    process.exit(1);
  }
}

async function main() {
  await ensureAnalyzer();
  mkdirSync(OUT, { recursive: true });

  /* 1) 记录并在采集期间替换为中性身份（不改变任何业务数据） */
  const original = await api('/api/config');
  const originalWallpaper = original.wallpaper;
  let wallpaperBytes = null;
  let wallpaperMime = 'image/jpeg';
  if (originalWallpaper.image) {
    const asset = await fetch(`${ANALYZER}/api/wallpaper/${originalWallpaper.image}`);
    if (asset.ok) {
      wallpaperBytes = Buffer.from(await asset.arrayBuffer());
      wallpaperMime = (asset.headers.get('content-type') ?? 'image/jpeg').split(';')[0];
    }
  }

  await api('/api/config', {
    method: 'PUT',
    body: JSON.stringify({
      nickname: '本地用户',
      avatar: '',
      wallpaper: { image: '', focusX: 50, focusY: 50, blur: 10, strength: 60 },
    }),
  });

  const browser = await chromium.launch();
  const written = [];

  try {
    for (const theme of ['dark', 'light']) {
      const context = await browser.newContext({
        colorScheme: theme,
        viewport: VIEWPORT,
        deviceScaleFactor: SCALE,
      });
      await context.addInitScript((value) => {
        window.localStorage.setItem('bangumi-analyzer-theme', value);
      }, theme);
      const page = await context.newPage();

      for (const target of PAGES) {
        await page.goto(`${ANALYZER}${target.path}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(900); // 等图表与封面稳定
        const png = await page.screenshot({ type: 'png' });
        const webp = await toWebp(page, png);
        const file = `assets/shots/${target.id}-${theme}.webp`;
        writeFileSync(new URL(`../${file}`, import.meta.url), Buffer.from(webp, 'base64'));
        written.push({ file, label: target.label, theme });
      }

      await context.close();
    }
  } finally {
    await browser.close();

    /* 2) 原样恢复：背景图片按内容重新上传 → 文件名与原来一致 */
    if (originalWallpaper.image && wallpaperBytes) {
      await api('/api/wallpaper', {
        method: 'POST',
        body: JSON.stringify({
          dataUrl: `data:${wallpaperMime};base64,${wallpaperBytes.toString('base64')}`,
        }),
      });
    }
    await api('/api/config', {
      method: 'PUT',
      body: JSON.stringify({
        nickname: original.nickname,
        avatar: original.avatar,
        wallpaper: originalWallpaper,
      }),
    });
  }

  const restored = await api('/api/config');
  const ok =
    restored.nickname === original.nickname &&
    restored.avatar === original.avatar &&
    JSON.stringify(restored.wallpaper) === JSON.stringify(originalWallpaper);

  console.log(`[capture] 已写入 ${written.length} 张截图：`);
  for (const item of written) console.log(`  · ${item.label}（${item.theme}）→ ${item.file}`);
  console.log(`[capture] 本地资料与背景已恢复：${ok ? '是' : '否（请检查 设置 → 外观 → 背景）'}`);
}

/** 在浏览器里把 PNG 转成 WebP：避免为了一次转换引入图像处理依赖 */
function toWebp(page, png) {
  return page.evaluate(
    async ([base64, quality]) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext('2d').drawImage(image, 0, 0);
      return canvas.toDataURL('image/webp', quality).split(',')[1];
    },
    [png.toString('base64'), QUALITY],
  );
}

main().catch((error) => {
  console.error(`[capture] 失败：${error.message}`);
  process.exit(1);
});
