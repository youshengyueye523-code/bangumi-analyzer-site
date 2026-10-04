/**
 * Public Demo：里程碑与部署复盘（2026-09-18 正式上线）。
 *
 * 只记录真实发生过的过程，内容来自这次部署本身与提交记录。
 * 边界：本站不写任何个人收藏数据（收藏数、评分、时长、画像结论都不属于项目档案）。
 */

export const publicDemo = {
  date: '2026-09-18',
  status: 'Public Demo 已正式上线，生产环境验收通过',
  url: 'https://bangumi-analyzer-demo.vercel.app',
  host: 'Vercel Hobby',
  baseVersion: '1.5.0',
  summary:
    '产品的第一个公网入口：基于上线时的 Local Analyzer v1.5.0 的独立只读展品，产品主要功能可以实际展示，不连接、也不依赖任何人的本地环境。',
};

/**
 * 三个实体：本地本体 / 公开展品 / 本站 —— 版本关系在这里说清楚。
 *
 * Local Analyzer 会继续演进，而公开展品停留在上线时的快照：
 * 这张表必须让「快照版本」与「当前本体版本」一眼可分。
 */
export const demoEntities = [
  [
    'Local Analyzer',
    'v1.8.2',
    '产品本体：私人本地工作环境。公开展品上线时它是 v1.5.0，此后继续演进，当前为 v1.8.4。',
  ],
  [
    'Public Demo',
    'Analyzer v1.5.0 快照',
    '独立只读展品：静态快照 + 只读接口，不连接本地环境，也不单独编号；不随 Analyzer 更新。',
  ],
  ['Website', 'v1.0.9', '本站：产品展示与项目档案，使用自己的版本序列。'],
];

/** 最容易混淆的一句，单独写清楚 */
export const demoVersionNote =
  '公开展品对应的是它上线时的 `Analyzer v1.5.0` 快照（2026-09-18）：Local Analyzer 此后继续演进（当前 v1.8.4），公开展品不会随之更新，也不等于 Analyzer 的最新版本。';

export const demoBoundary = [
  '只读快照：公开版本不开放个人写入，数据只在发布时更新。',
  '不持有 Local Analyzer 的 Bangumi token 与 AI key。',
  '不读取 Local Analyzer 的数据目录，也不连接 127.0.0.1:8787。',
  '与本地环境完全独立：公开展品不依赖任何人的机器。',
];

export const demoAi = [
  'AI 页面完整保留：界面与静态画像展示都在，用来体现 Analyzer 的产品形态。',
  '当前不提供在线 AI 执行能力：公开展品只展示已有结果，不会替访客调用模型。',
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
  '`25ab70e` —— Fastify 入口适配。',
  '`6d997de` —— 启动诊断。',
  '`ec93649` —— self-contained staging：把 Root Directory 外的运行时依赖实体化。',
  '`d571a6d` —— `await app.listen(...)` 根因修复，Public Demo 最终上线。',
];
