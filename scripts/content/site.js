/** 站点级资料：项目结构、技术栈、如何运行、截图清单。均为真实内容。 */

export const site = {
  name: 'Bangumi Analyzer',
  tagline: '本地优先的个人动画数据工具',
  description:
    '把 Bangumi 收藏完整同步到本机 SQLite，再在其上做检索（含系列 / IP 域内搜索）、统计、画像与双语简介，并逐步具备诊断与治理自己数据的能力 —— 一个长期使用、可以自己维护的个人数据工具。',
  repoNote: '本站是 Bangumi Analyzer 的展示与档案空间，独立于主程序，不参与主程序的构建与运行。',
};

export const architecture = {
  intro: '主程序与本站是两个彼此隔离的子项目：本站只读取主程序产出的截图与文档，不参与主程序的构建与测试。',
  tree: [
    ['packages/shared', '领域类型、API 契约、解析与检测规则'],
    ['packages/server', 'Fastify API + SQLite（node:sqlite）+ 同步 / 翻译队列 / 静态托管'],
    ['packages/web', 'React + Vite + Tailwind 的前端（设计令牌与组件库）'],
    ['e2e', 'Playwright 端到端与截图走查'],
    ['docs', '架构 / API 说明与验证报告（真实数据审计与回归结果）'],
    ['site', '本项目：产品展示与项目档案（零依赖静态站）'],
  ],
};

export const stack = [
  ['运行时', 'Node.js 24 · Windows 优先'],
  ['数据', 'SQLite（WAL）· node:sqlite · 无 ORM'],
  ['服务端', 'Fastify · Zod 校验 · 单端口同时提供 API 与前端'],
  ['前端', 'React 19 · Vite · Tailwind v4 · Radix UI · ECharts'],
  ['测试', 'Vitest（单元 / 组件）· Playwright（端到端 + 断点扫描）'],
  ['本站', '原生 HTML / CSS / ES Module —— 零依赖、零构建步骤'],
];

export const running = [
  { title: '启动本体', command: '双击 start-bangumi.bat（或 pnpm start）', note: '默认 http://127.0.0.1:8787' },
  {
    title: '启动本站',
    command: 'node serve.mjs',
    note: '本地预览：默认 http://127.0.0.1:8789，端口被占用时会自动向后顺延并打印实际地址（在 Analyzer 仓库里同一文件是 node site/serve.mjs）',
  },
  { title: '校验本站', command: 'node site/scripts/verify.mjs', note: '断点 / 溢出 / 控制台报错 / 动效预算' },
  {
    title: '走查本站',
    command: 'node site/scripts/walkthrough.mjs',
    note: '真实浏览器逐条路由截图（整页截图前先滚动一遍触发分节揭示）',
  },
  {
    title: '验证独立部署',
    command: 'node site/scripts/deploy-check.mjs',
    note: '只复制正式产物子集，用非 127.0.0.1 的主机名 + 子目录模拟静态托管',
  },
];

export const disclaimers = [
  '这是个人自用的本地工具，与 Bangumi 官方无关；数据来自 Bangumi 公开 API，仅保存在本机。',
  '本站展示的界面截图来自真实运行中的程序；页面中不引用任何个人收藏数量作为产品指标。',
  '版本档案与开发日志只记录真实发生过的事情；没有记录的内容不会为了「看起来丰富」而补写。',
];
