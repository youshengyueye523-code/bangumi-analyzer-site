# Bangumi Analyzer 官网（独立子项目）

产品展示与项目档案空间。**与主程序完全隔离**：零依赖、零构建步骤，不参与主程序的
构建 / 测试 / 运行，也不会占用或修改 Analyzer 的入口端口。

## 正式地址

| 用途 | 地址 |
| --- | --- |
| 正式站点（对外分享） | <https://youshengyueye523-code.github.io/bangumi-analyzer-site/> |
| 源码仓库 | <https://github.com/youshengyueye523-code/bangumi-analyzer-site> |
| 本地开发 / 预览 | <http://127.0.0.1:8789/>（只在开发时使用，不是交付地址） |

正式站点由 GitHub Pages 发布，发布内容**只有正式产物子集**（见下文「部署」）；
`serve.mjs`、`start-site.bat`、`scripts/*.mjs`、`README.md` 都不会出现在公开站点上。

## 运行

在 Bangumi Analyzer 仓库根目录：

```bash
node site/serve.mjs          # http://127.0.0.1:8789
node site/serve.mjs --open   # 启动后自动打开浏览器
```

在官网独立仓库（仓库根目录就是站点根目录）：

```bash
node serve.mjs
```

Windows 上也可以双击 `site/start-site.bat`。换端口：
`node site/serve.mjs --port=9010`（或 `set SITE_PORT=9010`）。

| 约束 | 实现 |
| --- | --- |
| 不占用 Analyzer 的 8787 | `serve.mjs` 显式拒绝 8787 并给出提示；默认使用 8789 |
| 端口冲突可自动避让 | 端口被占用时向后尝试最多 20 个端口，并打印实际地址 |
| 可同时运行 | 官网只读取自己的静态文件，不写任何数据、不影响 Analyzer 进程 |
| 开发 / 构建 / 依赖隔离 | 站点没有 `package.json`，只用浏览器原生能力；不在 `pnpm-workspace.yaml` 中 |
| 停止不影响 Analyzer | `Ctrl + C` 关闭官网进程即可 |

## 部署（正式产物）

正式产物就是 `site/` 里的静态文件：没有构建步骤，不依赖 Analyzer，也不需要 Node。

| 文件 | 用途 |
| --- | --- |
| `index.html`、`styles/`、`scripts/app.js`、`scripts/content/`、`assets/` | 站点本体，可直接上传到任意静态托管（GitHub Pages / Netlify / 对象存储 / 内网目录） |
| `serve.mjs`、`start-site.bat`、`scripts/*.mjs`（capture / verify / walkthrough / deploy-check）、`README.md` | 本地开发与素材工具，部署时可以不带 |

- 路由是 hash 路由（`#/versions/1.8.2`），静态托管**不需要**任何 rewrite / fallback 规则。
- 资源全部使用相对路径，放在子目录（例如 `https://example.com/site/`）也能正常浏览。
- 页面不请求任何本地服务：Analyzer 没运行、机器上没装 Node，核心浏览体验依然完整。

上面的说法可以用一条命令复核 —— 它只复制正式产物子集，用非 127.0.0.1 的主机名、
放在子目录下模拟一次真实静态托管，并检查「全程没有站外请求」：

```bash
node site/scripts/deploy-check.mjs
```

### 发布到正式地址

`.github/workflows/pages.yml` 会在 `main` 分支推送后，按上面的产物子集发布到 GitHub Pages
（用 `_site/` 组装，开发工具不上传）。一次完整的 Website 版本发布是：

```powershell
# 1. 本地验证（三条命令都要跑）
node site/scripts/verify.mjs
node site/scripts/deploy-check.mjs
node site/scripts/walkthrough.mjs      # 走查截图，人工看一眼

# 2. 同步到官网仓库（仓库根目录 = 站点根目录）
$repo = "$env:TEMP\bangumi-analyzer-site"
if (-not (Test-Path $repo)) { git clone https://github.com/youshengyueye523-code/bangumi-analyzer-site $repo }
git -C $repo pull --ff-only
robocopy site $repo /MIR /XD .git /NFL /NDL /NJH /NJS   # /MIR：让仓库内容与 site/ 完全一致
git -C $repo add -A
git -C $repo commit -m "vX.Y.Z: 本次 Website 版本说明"
git -C $repo push

# 3. 等 Actions 完成后访问正式地址，确认内容已更新
```

`/MIR` 会删除仓库里 site/ 已不存在的文件（镜像语义），执行前请确认 `$repo` 指向官网仓库。

## 版本与同步

本站与 Analyzer 是**两条独立的版本序列**：各自编号、各自维护，版本号不互相推导。

```
Analyzer   v1.0.0 → … → v1.8.2          产品本体：功能、数据与界面
Website    v1.0.0 → … → v1.0.8          本站：展示与项目档案（当前 v1.0.8）
```

| 规则 | 说明 |
| --- | --- |
| 版本独立 | Website 不因为 Analyzer 升版本就跟着升版本；Analyzer 也不因为本站改动而改版本 |
| 信息同步 | Analyzer 出新版本时，本站先判断「哪些内容受影响」：版本记录、截图、功能说明、版本故事 |
| 同步 ≠ 升级 | 只补一条版本记录或一张截图，不必产生新的 Website 版本号 |
| 升级条件 | 只有本站自身发生了可描述的变更，才产生新的 Website 版本 |

本站版本号的唯一来源是 `scripts/content/site-versions.js` 里的 `website.version`，
它同时显示在页脚与档案页的「Website 版本与同步规则」一节。

## 结构

```
site/
├── index.html            站点外壳（导航、环境层、挂载点）
├── serve.mjs             零依赖静态服务器（端口隔离）
├── start-site.bat        Windows 双击启动
├── WEBSITE_CONSTITUTION.md  长期规则基线（开发文档，不上线）
├── styles/
│   ├── tokens.css        设计令牌：与 Analyzer 同一套 DNA（数值自 v1.5.0 起未变）
│   └── site.css          站点布局与组件（含注意力 / 动效自我约束说明）
├── scripts/
│   ├── app.js            hash 路由 + 视图 + 交互（零依赖 ES Module）
│   ├── content/          **内容层**（只改这里就能加内容）
│   │   ├── versions.js       Analyzer 的版本档案：新增 / 改进 / 修复 / 决策 / 日志
│   │   ├── site-versions.js  Website 自己的版本历史与双版本同步规则
│   │   ├── features.js       功能说明（Feature Story）
│   │   ├── public-demo.js    Public Demo 里程碑与部署复盘
│   │   └── site.js           项目结构、技术栈、如何运行、声明
│   ├── capture.mjs       开发工具：从运行中的 Analyzer 采集真实界面截图
│   ├── verify.mjs        自检：路由 / 溢出 / 动效预算 / 端口隔离 / 站外请求
│   ├── walkthrough.mjs   开发工具：真实浏览器逐条路由截图（供人工走查）
│   └── deploy-check.mjs  开发工具：独立静态部署验证（产物子集 + 非本机主机名 + 子目录）
└── assets/
    ├── favicon.svg       浏览器标签图标
    └── shots/            真实界面截图（8 页 × 深浅色 = 16 张，WebP）
```

## 如何新增内容（不需要改页面代码）

| 想做的事 | 改哪里 |
| --- | --- |
| 新增一个版本 | 在 `scripts/content/versions.js` 数组最前面加一个对象 |
| 记录设计决策 / 实验 / 回退 | 在对应版本的 `decisions` 里加一条（`kind` 决定分类） |
| 记开发日志 | 在对应版本的 `devlog` 里加一条 |
| 写功能说明 | 在 `scripts/content/features.js` 里加一条 |
| 更新界面截图 | 启动 Analyzer 后运行 `node site/scripts/capture.mjs` |
| 记一个 Website 版本 | 在 `scripts/content/site-versions.js` 的 `websiteVersions` 最前面加一个对象，并更新同文件的 `website.version` |
| 走查一遍站点 | 运行 `node site/scripts/walkthrough.mjs`（截图输出到 `test-results/site-v1/`） |
| 验证还能不能独立部署 | 运行 `node site/scripts/deploy-check.mjs` |

档案页会自动汇总所有版本的 `decisions` 与 `devlog`，因此**不需要维护两份内容**。

### 重新采集界面截图时的约定

`capture.mjs` 以 **viewport 1440×900 + `deviceScaleFactor: 2`** 采集，输出 **2880×1800**（16:10）。
原因是截图取景框最宽会显示到约 1114px，高分屏下需要约 2200px 以上的源图才不糊；
CSS 布局与产品内容不因这条设置改变，只提高像素密度。

- 体积预算：16 张（8 页 × 深浅色）合计约 4.5 MiB 以内；封面密集的收藏库两张各约 545 KB（`QUALITY = 0.85`）。
- **不允许**把现有低分辨率截图放大后当作高清源图，也**不允许**用 AI 放大补细节。
- 采集会临时把昵称 / 头像 / 背景换成中性值，并在 `finally` 里原样恢复；采集前后应比对
  `data/config.json` 的哈希与 Analyzer 的 `/api/health`（版本 + uptime 单调增长）。

## 自我约束（写进代码里，可核对）

1. **注意力预算**：每个视口最多一个 Primary —— 首页是那台「真实界面」，
   功能页是交互演示的结果；环境层是静态的，不参与注意力竞争。
2. **动效不是默认状态**：只有首屏入场与首页 / 功能页的分节揭示；
   版本页与档案页完全静止（阅读优先）。整站唯一的持续运动是首页 UI 面板的轻微视差
   （最多 10px / 1.6°，且仅在宽屏与允许动效时启用）。
3. **玻璃只表达悬浮**：只有顶栏、移动菜单与截图取景框使用模糊材质。
4. **真实性**：截图来自真实运行的程序；档案只记录真实发生过的事情，
   没有记录的内容不会补写。
