/**
 * 官网本地服务器（零依赖，只用 Node 内置模块）。
 *
 * 端口策略（与 Analyzer 完全隔离）：
 *   · Analyzer 的入口是 127.0.0.1:8787，官网**显式拒绝**占用它，也不会去改它；
 *   · 默认端口 8789，可用 `--port=xxxx` 或环境变量 `SITE_PORT` / `PORT` 覆盖；
 *   · 端口被占用时自动向后尝试（最多 20 个），并在控制台打印最终地址；
 *   · 两者可以同时运行：官网只读文件，不写任何数据，也不影响 Analyzer 的进程。
 *
 * 用法：
 *   node site/serve.mjs                # http://127.0.0.1:8789
 *   node site/serve.mjs --port=9000    # 指定端口
 *   node site/serve.mjs --open         # 启动后自动打开浏览器
 */

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const ANALYZER_PORT = 8787; // Analyzer 的入口：官网绝不占用
const DEFAULT_PORT = 8789;
const HOST = '127.0.0.1';

function readArgs(argv) {
  const flags = { open: false, port: null };
  for (const arg of argv) {
    if (arg === '--open') flags.open = true;
    else if (arg.startsWith('--port=')) flags.port = Number(arg.slice('--port='.length));
  }
  return flags;
}

const flags = readArgs(process.argv.slice(2));
const requestedPort = flags.port ?? Number(process.env.SITE_PORT ?? process.env.PORT ?? DEFAULT_PORT);

if (requestedPort === ANALYZER_PORT) {
  console.error(
    `[site] 拒绝使用端口 ${ANALYZER_PORT}：那是 Bangumi Analyzer 的入口（http://127.0.0.1:8787）。\n` +
      '       官网请使用独立端口，例如 node site/serve.mjs --port=8789',
  );
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

/** 把 URL 路径解析为站点目录内的真实文件；越界一律拒绝。 */
function resolveFile(pathname) {
  const decoded = decodeURIComponent(pathname.split('?')[0]);
  const relative = normalize(decoded).replace(/^([/\\])+/, '');
  const target = join(ROOT, relative);
  if (!target.startsWith(ROOT)) return null;
  if (existsSync(target) && statSync(target).isFile()) return target;
  // 没有扩展名的路径回退到首页（方便直接输入 /versions 这类地址）
  if (!extname(relative)) return join(ROOT, 'index.html');
  return null;
}

const server = createServer((request, response) => {
  const file = resolveFile(request.url ?? '/');
  if (!file) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('资源不存在');
    return;
  }
  const type = MIME[extname(file).toLowerCase()] ?? 'application/octet-stream';
  response.writeHead(200, {
    'content-type': type,
    // 开发期不做长缓存，避免改了 CSS / 内容看不到变化
    'cache-control': 'no-cache',
  });
  createReadStream(file).pipe(response);
});

let attempt = 0;
const maxAttempts = 20;

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE' && attempt < maxAttempts) {
    attempt += 1;
    if (requestedPort + attempt === ANALYZER_PORT) attempt += 1;
    console.warn(`[site] ${requestedPort + attempt - 1} 已被占用，尝试 ${requestedPort + attempt}…`);
    server.listen(requestedPort + attempt, HOST);
    return;
  }
  console.error(`[site] 启动失败：${error.message}`);
  process.exit(1);
});

server.on('listening', () => {
  const { port } = server.address();
  const url = `http://${HOST}:${port}/`;
  console.log(`[site] Bangumi Analyzer 官网（独立子项目）已启动：${url}`);
  console.log(`[site] Analyzer 本体不受影响：http://${HOST}:${ANALYZER_PORT}/`);
  console.log('[site] 停止：Ctrl + C（或在任务管理器结束该 node 进程）');
  if (flags.open) {
    const command = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    spawn(command, [url], { shell: process.platform === 'win32', detached: true, stdio: 'ignore' }).unref();
  }
});

server.listen(requestedPort, HOST);
