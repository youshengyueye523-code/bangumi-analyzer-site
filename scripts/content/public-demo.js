/**
 * Public Demo：里程碑与部署复盘（2026-09-18 首发 v1.5.0，2026-11-18 升级至 v2.0.0）。
 *
 * 只记录真实发生过的过程，内容来自部署本身与提交记录。
 * 边界：本站不写任何个人收藏数据（收藏数、评分、时长、画像结论都不属于项目档案）。
 */

import { website } from './site-versions.js';

export const publicDemo = {
  date: '2026-11-18',
  initialDate: '2026-09-18',
  status: 'Public Demo 已升级至 Analyzer v2.0.0，生产环境验收通过',
  url: 'https://bangumi-analyzer-demo.vercel.app',
  host: 'Vercel Hobby',
  baseVersion: '2.0.0',
  initialVersion: '1.5.0',
  summary:
    '2026 年 9 月 18 日基于 Analyzer v1.5.0 首次上线；2026 年 11 月 18 日独立升级至 Analyzer v2.0.0（Schema 15 只读快照）。覆盖收藏浏览与检索、时间趋势、Series / 家族分析、静态 AI 画像及数据中枢只读诊断展示，不连接、也不依赖任何人的本地环境。',
};

/**
 * 三个实体：本地本体 / 公开展品 / 本站 —— 版本关系在这里说清楚。
 *
 * Local Analyzer 会继续演进，而公开展品停留在最近一次独立发布时的快照：
 * 这张表必须让「快照版本」与「当前本体版本」一眼可分。
 */
export const demoEntities = [
  [
    'Local Analyzer',
    `v${website.analyzer} (r5)`,
    '产品本体：本地工作环境与 Windows 便携核心（包含 r3 系列自动标题判定契约、Series Engine v3 及 Companion 主题桥接），独立演进。',
  ],
  [
    'Companion',
    `v${website.companion}`,
    'Windows 桌面伴侣与图形安装器（Stable 正式版）：面向普通用户打包交付 Analyzer v2.0.0 (r5) 核心、小番 Live2D 与维护管理。',
  ],
  [
    'Public Demo',
    `Analyzer v${publicDemo.baseVersion} 快照`,
    `独立只读展品：${publicDemo.initialDate} 首发于 v${publicDemo.initialVersion}，${publicDemo.date} 独立升级至 v${publicDemo.baseVersion} 快照；不单独编号，也不会随 Local 或 Companion 自动更新。`,
  ],
  ['Website', `v${website.version}`, '本站：产品展示、Windows 下载入口与项目档案，使用自己的版本序列。'],
];

/** 最容易混淆的一句，单独写清楚 */
export const demoVersionNote =
  `公开展品当前对应 ${publicDemo.date} 独立升级后的 Analyzer v${publicDemo.baseVersion} 快照（${publicDemo.initialDate} 首次上线时为 v${publicDemo.initialVersion} 快照）。Local Analyzer 后续继续演进时，公开展品不会随之更新。`;

export const demoBoundary = [
  '只读快照：服务端仅开放只读接口，同步、修改收藏、治理写入、导入导出、备份与上传均返回只读拒绝，数据只在显式发布时重新提取。',
  '公开口径投影：提取时按正式可见性与发布规则物理排除私密、主动隐藏与官方 NSFW 条目，并保护受限诊断与治理证据。',
  '不持有 Local Analyzer 的 Bangumi token、AI key、本地配置或个人资产。',
  '不读取 Local Analyzer 的数据目录，也不连接 127.0.0.1:8787。',
  '与本地环境完全独立：公开展品不依赖任何人的机器。',
];

export const demoAi = [
  'AI 与数据中枢完整展示：保留 v2.0.0 十模块静态 AI 画像，并通过公开隐私投影恢复数据中枢完整只读诊断展示（受保护原始证据与修复写入仍拒绝）。',
  '静态结果绑定公开快照：当前画像与统计基于本次公开有效快照生成，历史报告保持只读可读，不会为缺口补造历史。',
  '当前不提供在线 AI 执行能力：公开展品只展示已有结果，不会替访客调用模型或触发翻译任务。',
];

export const demoMilestones = [
  [
    '2026.11.18',
    '升级至 Analyzer v2.0.0（Schema 15）',
    '独立升级至 v2.0.0 预编译运行时与 Schema 15 公开只读快照，按正式可见性与治理规则重新投影并绑定静态 AI 画像；经提交 `93dd530` 接入正式隐私投影后，数据中枢恢复完整只读展示。',
  ],
  [
    '2026.09.18',
    '首次上线（Analyzer v1.5.0 快照）',
    '产品的第一个公网入口在 Vercel Hobby 正式上线，确立只读快照、不持有本地凭据、不连 127.0.0.1:8787 与静态 AI 展示边界。',
  ],
];

/**
 * 部署复盘：5 个阶段。每个阶段两层信息 ——
 * headline 给普通读者（一行看懂发生了什么），details 给技术读者（为什么）。
 */
export const demoPhases = [
  {
    index: '01',
    title: 'Fastify 入口适配',
    headline: '先让 Vercel 认出这是 Fastify。',
    details: [
      '入口改成静态 `import Fastify`，通过 Vercel 的 Fastify zero-config 入口检测。',
      '这一阶段解决的是「构建能否被识别」，还没有碰到运行时。',
    ],
  },
  {
    index: '02',
    title: 'Root Directory 运行时依赖',
    headline: '依赖原本都在 Root Directory 之外。',
    details: [
      'Vercel 的 Root Directory 设为 `public-demo`，而 `packages/server/dist` 与 workspace 运行时依赖位于 Root Directory 之外。',
      '在本地用 `@vercel/nft`（Node File Trace）取证，确认运行时实际会加载哪些文件。',
      '据此建立 self-contained staging：把必要的 server / shared runtime 与 Fastify、Zod、Undici 等生产依赖实体化进 `public-demo`。',
      'staging 最终约 7.5 MiB，0 Junction / 0 Symlink —— 全是实体文件，不依赖链接。',
      '`bangumi.db`、covers、web 等本来就在 Root Directory 内，不需要通过这套机制搬移。',
    ],
  },
  {
    index: '03',
    title: 'Vercel Runtime 500',
    headline: 'Build 绿了，运行时却一直无响应。',
    details: [
      '构建成功，但运行时持续返回 `INTERNAL_FUNCTION_INVOCATION_FAILED`。',
      '同一份代码用普通 Node 启动完全正常。',
      '`vercel dev` 可以复现同型无响应。',
      'Dashboard 与 CLI 最初只能看到「无响应」和零应用日志。',
    ],
  },
  {
    index: '04',
    title: '源码级定位',
    headline: '日志不说话了，就直接去读源码。',
    details: [
      '直接阅读 `@vercel/node` 与 Fastify adapter 的实现。',
      '发现 Vercel adapter 会拦截 `http.Server.prototype.listen()`。',
      '而当时的入口在顶层使用 `await app.listen(...)`：Fastify 会等待一个永远不会到来的 `listening`。',
      '顶层模块无法完成求值，Function 因此无法正常产生 HTTP 响应。',
    ],
  },
  {
    index: '05',
    title: '最终修复',
    headline: '从 500 地狱走到 200 世界。',
    details: [
      '把 `await app.listen(...)` 改成 `app.listen(...)`。',
      '本地 `vercel dev` 从「无限等待」变成 HTTP 200。',
      '`/api/health`、真实数据库接口、首页等恢复正常。',
      '最终生产部署全部通过，Public Demo 正式上线。',
    ],
  },
];

export const demoRootCause = {
  statement:
    '这一段是两个问题叠在一起：Root Directory 之外的运行时依赖由 self-contained staging 解决；而让 Function 永久无响应的机制级根因，是顶层 `await app.listen(...)` 与 Vercel adapter 对 `listen()` 的拦截契约冲突。',
  disclaimer:
    '所以不是「整个问题只改了一个 `await`」—— staging 与 listen 契约两件事都做对，部署才真正通过。',
};

export const demoCommits = [
  '`25ab70e`（2026.09.18）—— Fastify 入口适配。',
  '`6d997de`（2026.09.18）—— 启动诊断。',
  '`ec93649`（2026.09.18）—— self-contained staging：把 Root Directory 外的运行时依赖实体化。',
  '`d571a6d`（2026.09.18）—— `await app.listen(...)` 根因修复，Public Demo 首次正式上线。',
  '`d92b9c7`（2026.11.18）—— 升级至 Analyzer v2.0.0 预编译运行时与 Schema 15 公开只读快照。',
  '`4d874b5`（2026.11.18）—— 按正式可见性与治理规则修正公开投影，保留合法系列与家族状态。',
  '`93dd530`（2026.11.18）—— 为 Public Demo 数据中枢接入正式隐私投影，恢复完整只读诊断展示。',
];
