/** 站点级资料：项目结构、技术栈、如何运行、截图清单。均为真实内容。 */

export const site = {
  name: 'Bangumi Analyzer',
  tagline: '本地优先的个人动画数据工具',
  description:
    '把 Bangumi 收藏同步到本机 SQLite，离线检索、读时间趋势和实体证据，也能在数据中枢诊断来源、预览修复并核对结果。可按个人需要治理 Series / Franchise、隐藏作品，并选择是否连接 AI 服务。',
  homeLead:
    '本地优先的个人动画数据工具：把收藏同步到本机，在完整数据上看趋势，在 Series / 家族里追溯成员和评分。还能用数据中枢检查来源、预览修复；同步后的浏览与分析不必联网。',
  homeFacts: [
    ['本地优先', '数据存在本机 SQLite；封面缓存到本地，断网也能正常浏览与分析。'],
    ['让数字能追溯', '按年、季度或月精读时间趋势；实体详情区分已收藏、未收藏与仅关系成员，评分显示样本量。'],
    ['可以自己维护', '备份与导入导出在本机完成；用数据中枢核对来源与派生结果，以预览和验证约束修复。'],
  ],
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
  { title: '校验本站', command: 'node scripts/verify.mjs', note: '开发验证（需 Playwright）：断点 / 溢出 / 控制台报错 / 动效预算' },
  {
    title: '走查本站',
    command: 'node scripts/walkthrough.mjs',
    note: '真实浏览器逐条路由截图（整页截图前先滚动一遍触发分节揭示）',
  },
  {
    title: '验证独立部署',
    command: 'node scripts/deploy-check.mjs',
    note: '只复制正式产物子集，用非 127.0.0.1 的主机名 + 子目录模拟静态托管',
  },
];

export const disclaimers = [
  '这是本地自用工具，与 Bangumi 官方无关。收藏数据库保存在本机；同步会访问 Bangumi，主动使用可选 AI 会把所需分析输入发送给配置的服务。',
  '本站展示真实运行画面，区分当前示例数据与历史截图；不把截图中的数量当成产品指标。',
  '版本档案与开发日志只记录真实发生过的事情；没有记录的内容不会为了「看起来丰富」而补写。',
];
