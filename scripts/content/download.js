/**
 * Windows 发行下载与 Companion 桌面伴侣资料（对应真实 GitHub Releases 产物）。
 *
 * 边界：
 * - 所有版本号、构建标识、文件大小与 SHA-256 均来自真实 RC5 构建清单；
 * - 明确区分 Pre-release 与正式签名版，不虚构自动更新或商业代码签名；
 * - 不写本机绝对路径，保持独立静态部署可迁移。
 */

export const release = {
  repoUrl: 'https://github.com/youshengyueye523-code/bangumi-analyzer-app',
  releaseTag: 'v2.0.0-rc5',
  releaseUrl: 'https://github.com/youshengyueye523-code/bangumi-analyzer-app/releases/tag/v2.0.0-rc5',
  previousReleaseTag: 'v2.0.0-rc4',
  previousReleaseUrl: 'https://github.com/youshengyueye523-code/bangumi-analyzer-app/releases/tag/v2.0.0-rc4',
  checksumsUrl:
    'https://github.com/youshengyueye523-code/bangumi-analyzer-app/releases/download/v2.0.0-rc5/SHA256SUMS.txt',
  companionVersion: '2.0.0-rc5',
  channel: 'Pre-release',
  buildId: 'rc5-202611230852',
  date: '2026-11-23',
  analyzerCore: 'Analyzer v2.0.0 (r4)',
  analyzerSha256: 'a773d96356cd659ad845926c1f3d695092e09b659d9a3a57e227fb49ca095445',
  requirements: 'Windows 10 / 11（64 位 x64）· 约 800 MB 可用磁盘空间 · 无需预先安装 Node.js 或配置命令行',
};

export const packages = [
  {
    id: 'installer',
    badge: '推荐给绝大多数用户',
    title: 'Windows 图形安装版 (.exe)',
    fileName: 'Bangumi-Analyzer-Companion-Setup-2.0.0-rc5-win-x64.exe',
    size: '199.1 MB（208,790,016 字节）',
    sha256: '86aea41aeb02fea6df6a48c335954a34f8f58787ca95d44ac8679a439278266d',
    url: 'https://github.com/youshengyueye523-code/bangumi-analyzer-app/releases/download/v2.0.0-rc5/Bangumi-Analyzer-Companion-Setup-2.0.0-rc5-win-x64.exe',
    cta: '下载安装版 (.exe)',
    primary: true,
    summary:
      '双击按图形向导完成安装，自动创建开始菜单与桌面快捷方式，并在系统「应用和功能」中提供默认保留用户数据的独立卸载程序。',
    points: [
      '内置完整 Analyzer v2.0.0 (r4)（Series Engine v3）与独立 Node 24 运行时，免配置环境',
      '支持欢迎页「连接已有安装」恢复老安装、旧库首次启动自动一次性升级系列标题与 7 类 Bangumi 网络诊断',
      '默认卸载仅移除程序与快捷方式，完整保留 data/ 下的数据库与历史备份',
    ],
  },
  {
    id: 'portable',
    badge: '绿色免安装 / 可移动目录',
    title: 'Windows 绿色便携版 (.zip)',
    fileName: 'Bangumi-Analyzer-Companion-Portable-2.0.0-rc5-win-x64.zip',
    size: '199.0 MB（208,668,176 字节）',
    sha256: 'fcef14985c97308a8c32ff3189a5a4317834d51f2805b95867a817327553f496',
    url: 'https://github.com/youshengyueye523-code/bangumi-analyzer-app/releases/download/v2.0.0-rc5/Bangumi-Analyzer-Companion-Portable-2.0.0-rc5-win-x64.zip',
    cta: '下载便携版 (.zip)',
    primary: false,
    summary:
      '包含完整 645 个运行文件的可运行压缩包（非源码 ZIP）。解压后直接双击 Bangumi-Analyzer-Companion.exe 启动，不写系统卸载项。',
    points: [
      '解压顶级目录为 Bangumi-Analyzer-Companion-Portable-win-x64/',
      'Companion 自身配置随目录存放在 companion-data/，便于整目录迁移或备份',
      '请勿误把 GitHub 自动生成的 Source code.zip 当作可运行软件包',
    ],
  },
];

export const companionHighlights = [
  [
    '小番（Xiaofan）Live2D 舞台',
    '基于 Pink Sakura (CC BY 4.0) 适配双骨骼手臂与分层袖口，支持无边框全屏（F11 / Esc）、auto / 30 / 60 / 120 FPS 策略、8 种业务联动状态与 7 种独立短暂随机互动；异常时自动安全降级至 2D 舞台。',
  ],
  [
    '图形化首次向导与失败恢复',
    '逐项检测系统架构、包完整性、磁盘空间与目录安全；遇目录被外部实例占用或初始化异常时，可随时返回上一步或更换目录安全重试，不锁死向导、不破坏已有数据。',
  ],
  [
    '安全托管本地服务与状态反馈',
    '仅绑定本机回环地址 127.0.0.1 的随机隔离端口（不占用 8787）；实时展示同步进度、运行日志与快捷入口，关闭窗口前确保 SQLite 安全落盘退出。',
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
    body: '向导完成校验解包与本地启动后，即可拉取收藏并点击「打开 Analyzer 网页端」。同步完成后离线可随时检索、查看趋势与系列分析；日常关闭 Companion 窗口会自动安全停机。',
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
      '未签名安装器说明：本 `v2.0.0-rc5` 预发行包尚未进行 Authenticode 商业代码签名，Windows SmartScreen 首次运行可能弹出「未知发布者」提示。请先核对官方 `SHA256SUMS.txt` 确认文件完整后再决定是否运行，切勿关闭 Windows Defender 或全局禁用 SmartScreen。',
      '更新机制说明：当前尚未开启自动静默联网更新；需要升级时可从 GitHub Releases 下载新版，或在「维护与诊断」中使用本地更新包/清单执行带失败回滚的安全更新。',
      '许可区分：Analyzer 与 Companion 自主源码采用 MIT 许可；小番基底模型 Pink Sakura 及衍生 ArmRig 图集采用 CC BY 4.0（详见随包 `ATTRIBUTION.md`）；Live2D Cubism Core (`live2dcubismcore.min.js`) 为 Live2D Inc. 专有运行库，不包含于公开源码仓库，编译版按个人小规模免费分发条款随附并附带 `CORE-LICENSE.md`（Companion 锁定内置固定角色，非可扩展导入工具）。',
    ],
  },
];
