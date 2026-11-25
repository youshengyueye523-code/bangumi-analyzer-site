/**
 * Windows 发行下载与 Companion 桌面伴侣资料（对应真实 GitHub Releases 产物）。
 *
 * 边界：
 * - 所有版本号、构建标识、文件大小与 SHA-256 均来自真实 v2.0.0 构建清单（built 2026-11-25）；
 * - 明确区分无签名社区发行包与商业代码签名版，不虚构自动更新或商业签名；
 * - 不写本机绝对路径，保持独立静态部署可迁移。
 */

export const release = {
  repoUrl: 'https://github.com/youshengyueye523-code/bangumi-analyzer-app',
  releaseTag: 'v2.0.0',
  releaseUrl: 'https://github.com/youshengyueye523-code/bangumi-analyzer-app/releases/tag/v2.0.0',
  previousReleaseTag: 'v2.0.0-rc5',
  previousReleaseUrl: 'https://github.com/youshengyueye523-code/bangumi-analyzer-app/releases/tag/v2.0.0-rc5',
  checksumsUrl:
    'https://github.com/youshengyueye523-code/bangumi-analyzer-app/releases/download/v2.0.0/SHA256SUMS.txt',
  companionVersion: '2.0.0',
  channel: 'Stable 正式版',
  buildId: 'v2.0.0-202611250823',
  date: '2026-11-25',
  analyzerCore: 'Analyzer v2.0.0 (r5)',
  analyzerFileName: 'Bangumi-Analyzer-2.0.0-windows-x64-r5.zip',
  analyzerSize: '39.2 MB（41,101,081 字节）',
  analyzerSha256: 'b227f6632c9060642444e550e2bc3f2256450bad2e3c4b0420d00e31ed77bcfa',
  analyzerUrl:
    'https://github.com/youshengyueye523-code/bangumi-analyzer-app/releases/download/v2.0.0/Bangumi-Analyzer-2.0.0-windows-x64-r5.zip',
  requirements: 'Windows 10 / 11（64 位 x64）· 约 800 MB 可用磁盘空间 · 无需预先安装 Node.js 或配置命令行',
};

export const packages = [
  {
    id: 'installer',
    badge: '推荐给绝大多数用户',
    title: 'Windows 图形安装版 (.exe)',
    fileName: 'Bangumi-Analyzer-Companion-Setup-2.0.0-win-x64.exe',
    size: '199.1 MB（208,797,696 字节）',
    sha256: '6e8cc079234e2da9fc0143b2530977e8e215e949ee89375993e1ae0f363a2a1c',
    url: 'https://github.com/youshengyueye523-code/bangumi-analyzer-app/releases/download/v2.0.0/Bangumi-Analyzer-Companion-Setup-2.0.0-win-x64.exe',
    cta: '下载安装版 (.exe)',
    primary: true,
    summary:
      '双击按图形向导完成安装，自动创建开始菜单与桌面快捷方式，并在系统「应用和功能」中提供默认保留用户数据的独立卸载程序。',
    points: [
      '内置完整 Analyzer v2.0.0 (r5)（Series Engine v3）与独立 Node 24 运行时，免配置环境',
      '支持首页六个直达快捷入口、Analyzer 网页端跨端口主题持久化（深色 / 浅色 / 跟随系统）与服务就绪后自动打开网页一次',
      '支持欢迎页「连接已有安装」恢复老安装、旧库一次性升级与默认保留 data/ 的安全卸载',
    ],
  },
  {
    id: 'portable',
    badge: '绿色免安装 / 可移动目录',
    title: 'Windows 绿色便携版 (.zip)',
    fileName: 'Bangumi-Analyzer-Companion-Portable-2.0.0-win-x64.zip',
    size: '199.0 MB（208,676,030 字节）',
    sha256: '24950a5ab67d673bf0451e5f0914709592ca69af20f5e7bd5b9f004255b70387',
    url: 'https://github.com/youshengyueye523-code/bangumi-analyzer-app/releases/download/v2.0.0/Bangumi-Analyzer-Companion-Portable-2.0.0-win-x64.zip',
    cta: '下载便携版 (.zip)',
    primary: false,
    summary:
      '包含完整 645 个运行文件的可运行压缩包（非源码 ZIP）。解压后直接双击 Bangumi-Analyzer-Companion.exe 启动，不写系统卸载项。',
    points: [
      '解压顶级目录为 Bangumi-Analyzer-Companion-Portable-win-x64/',
      'Companion 自身配置与网页端主题偏好存放在 companion-data/，便于整目录迁移或备份',
      '已内置完整小番 Live2D 资源与 ANGLE D3D11 窗口稳定渲染适配，无需额外下载 Live2D Core',
    ],
  },
];

export const companionHighlights = [
  [
    '小番（Xiaofan）Live2D 舞台与高刷适配',
    '基于 Pink Sakura (CC BY 4.0) 适配双骨骼手臂与分层袖口，支持无边框全屏（F11 / Esc）、auto / 30 / 60 / 120 FPS 策略、高 DPI 尺寸同步与最小化/恢复防闪烁；异常时安全降级至 2D 舞台。',
  ],
  [
    '六个页面快捷入口与网页端主题跨端口持久化',
    '首页 6 张卡片可直达仪表盘、收藏库、统计分析、系列 / IP、我的画像与数据中枢；在 Companion「启动与偏好」选择的深色 / 浅色 / 跟随系统主题可跨越随机端口重启稳定保留。',
  ],
  [
    '图形向导、就绪自动打开与托管回环服务',
    '仅绑定本机 127.0.0.1 随机隔离端口（不占用 8787）；开启自动启动与自动打开后，等待服务就绪自动打开网页首页一次不重复弹窗，关闭窗口前确保 SQLite 安全落盘。',
  ],
  [
    '一键备份、恢复、自检与保数据卸载',
    '支持时间戳数据库备份、恢复前自动再备份、程序与数据库完整性自检、脱敏诊断报告导出、本地包验证更新（失败自动回滚）及默认保护 data/ 的安全卸载。',
  ],
];

export const setupSteps = [
  {
    index: '01',
    title: '下载、核对并启动',
    body: '从上方直接下载安装版或便携版。可在 PowerShell 中运行 `Get-FileHash <文件名> -Algorithm SHA256` 与 `SHA256SUMS.txt` 比对摘要；安装版直接运行向导，便携版解压完整目录后双击 `Bangumi-Analyzer-Companion.exe`。',
  },
  {
    index: '02',
    title: '选择独立数据目录与绑定 Bangumi',
    body: '按首次向导选择一个常规本地目录存放你的 Analyzer 程序与 `data/`（请避开系统目录与 OneDrive 等网盘同步文件夹，避免 SQLite 锁冲突）。随后可输入 Bangumi 用户名或数字 UID（同步私有收藏时可选填个人 Access Token），也可以先跳过稍后再配。',
  },
  {
    index: '03',
    title: '初始化同步并在浏览器中使用',
    body: '向导完成校验解包与本地启动后，即可拉取收藏并打开 Analyzer 网页端。也可在「设置 → 启动与偏好」开启服务就绪后自动打开网页端，并选择独立于 Companion 的网页深浅色主题；关闭 Companion 窗口会自动安全停机。',
  },
];

export const downloadFaq = [
  {
    q: '普通用户需要单独下载 Live2D Core 吗？',
    a: '不需要。面向普通用户的 Windows 正式安装版（`.exe`）和便携版（`.zip`）均已内置 Live2D Cubism Core 与完整角色资源，无需再前往 Live2D 官网下载运行库，也无需配置 Node.js 或 Git；只有基于 GitHub 源码自行打包构建的开发者才需要按 `CONTRIBUTING.md` 自行下载放入 `companion/models/vendor/`。',
  },
  {
    q: '如何设置 Analyzer 网页端主题，换端口后还会生效吗？',
    a: '在 Companion 的「设置 → 启动与偏好 → Analyzer 网页端主题」中可选择「深色」「浅色」或「跟随系统」（未手动设置的新用户默认跟随系统），与 Companion 自身界面的深浅色相互独立。你在 Companion 或网页端 `/settings` 切换主题时都会写入本机应用配置，即便每次启动分配不同的随机本地端口也不会丢失，且首屏注入主题标识以避免短暂白闪。',
  },
  {
    q: '如何设置启动后自动打开 Analyzer 网页端？',
    a: '在 Companion「设置 → 启动与偏好」中开启「启动 Companion 时自动启动 Analyzer」以及「服务启动后自动打开网页端」。Companion 会在服务真正启动就绪后自动在默认浏览器打开首页一次；窗口状态切换或后台轮询不会反复弹出新标签页，关闭该开关后也不会自动打开。',
  },
  {
    q: '首页「档案与快捷入口」中的六张卡片怎么用？',
    a: 'Companion 主面板提供 6 个直达入口：仪表盘（`/`）、收藏库（`/library`）、统计分析（`/analysis`）、系列 / IP（`/series`）、我的画像（`/profile`）与数据中枢（`/diagnostics`）。点击后会读取当前运行中服务的真实端口与地址，仅允许跳转到受信任的本地页面路由；若 Analyzer 尚未启动或刚停止，会弹出明确反馈提示而非静默无反应。',
  },
  {
    q: '从 RC 或旧版本升级时会保留原来的收藏数据库、人工决定与配置吗？',
    a: '会完整保留。升级时可将新版安装到原位置（或用便携版打开原向导选择「连接已有安装」），也可以在「维护与诊断」中选择离线包 `Bangumi-Analyzer-2.0.0-windows-x64-r5.zip` 执行安全更新。更新仅替换程序文件，并在升级前自动对 `data/bangumi.db` 留存备份（失败可回退），不会覆盖 `data/` 下的收藏库、封面缓存、Bangumi/AI 配置及历史备份。',
  },
  {
    q: '当前版本还有哪些客观已知限制？',
    a: '① 安装包与可执行文件尚未购买商业 Authenticode 代码签名，Windows SmartScreen 首次运行可能弹出「未知发布者」提示（请先核对官方 `SHA256SUMS.txt`）；② Companion 目前仅支持 Windows 10/11 (x64)；③ 暂不提供后台静默自动联网更新，升级需通过 GitHub Releases 或本地安全更新包；④ 若极少数双显卡/老旧核显环境触发 WebGL 上下文失效，小番会自动降级为 2D 占位舞台，可在「启动与偏好」切换 GPU 策略，但不影响 Analyzer 核心使用。',
  },
];

export const troubleshootingAndSafety = [
  {
    title: '常见失败与返回恢复',
    items: [
      '若目标目录正被另一个运行中的 Analyzer 实例占用（会话锁活跃），向导会在目录选择步提前提示，或在初始化失败后解锁左侧步骤条，允许「返回上一步」或「更换安装目录」重新开始。',
      '若目录内仅残留异常断电遗留的失效锁文件，程序会核验进程存活与端口后自动安全清理并恢复，不会强杀外部进程。',
      '部分双显卡或老旧核显环境若无法启用 WebGL，可在「设置 → 启动与偏好」切换 Live2D GPU 兼容模式，或让角色自动安全回退为 2D 舞台，不影响 Analyzer 本体功能。',
    ],
  },
  {
    title: '数据存储、备份与安全卸载',
    items: [
      '个人收藏数据库（`data/bangumi.db`）、封面缓存（`data/covers/`）与自动备份（`data/backups/`）全部保存在你首次向导选定的本地目录中；凭据仅存本地 `data/config.json`，不写入 Companion 偏好文件。',
      '可在 Companion「维护与诊断」页随时一键创建备份；执行恢复前会自动再留一份恢复前快照。',
      '无论使用系统卸载器还是内置「安全卸载」，默认都只移除程序文件与快捷方式、完整保留 `data/`；只有主动勾选并二次确认时才会删除数据。',
    ],
  },
  {
    title: '未签名提示、更新机制与许可边界',
    items: [
      '未签名安装器说明：本 `v2.0.0` 正式包尚未进行 Authenticode 商业代码签名，Windows SmartScreen 首次运行可能弹出「未知发布者」提示。请先核对官方 `SHA256SUMS.txt` 确认文件完整后再决定是否运行，切勿关闭 Windows Defender 或全局禁用 SmartScreen。',
      '更新机制说明：当前尚未开启自动静默联网更新；需要升级时可从 GitHub Releases 下载新版，或在「维护与诊断」中使用本地更新包 `Bangumi-Analyzer-2.0.0-windows-x64-r5.zip` 执行带失败回滚的安全更新。',
      '许可区分：Analyzer 与 Companion 自主源码采用 MIT 许可；小番基底模型 Pink Sakura 及衍生 ArmRig 图集采用 CC BY 4.0（详见随包 `ATTRIBUTION.md`）；Live2D Cubism Core (`live2dcubismcore.min.js`) 为 Live2D Inc. 专有运行库，不包含于公开源码仓库，编译版按个人小规模免费分发条款随附并附带 `CORE-LICENSE.md`（Companion 锁定内置固定角色，非可扩展导入工具）。',
    ],
  },
];
