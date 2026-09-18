/**
 * 站点路由与视图（零依赖，原生 ES Module）。
 *
 * 结构：hash 路由 → 渲染到 #view → 绑定该视图需要的交互。
 * 新增内容请改 scripts/content/*.js，不要在这里堆页面代码。
 */

import { collectDecisions, collectDevlog, findVersion, sortedVersions } from './content/versions.js';
import { features } from './content/features.js';
import { architecture, disclaimers, running, site, stack } from './content/site.js';
import { versionPolicy, versionSeries, website, websiteVersions } from './content/site-versions.js';

const view = document.getElementById('view');
const navLinks = document.getElementById('nav-links');
const navToggle = document.getElementById('nav-toggle');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

/* ----------------------------------------------------------------- 工具 */

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatDate = (value) => value.replace(/-/g, '.');

/** 中文排版：只在正文（非代码）里替换引号，保持与文档一致 */
const prettyText = (value) =>
  escapeHtml(value).replace(/`([^`]+)`/g, '<code>$1</code>');

const list = (items, className = 'list') =>
  `<ul class="${className}">${items.map((item) => `<li>${prettyText(item)}</li>`).join('')}</ul>`;

const sectionHead = (kicker, title, description) => `
  <div class="section-head">
    ${kicker ? `<span class="kicker">${escapeHtml(kicker)}</span>` : ''}
    <h2 class="section-title">${escapeHtml(title)}</h2>
    ${description ? `<p class="lede">${prettyText(description)}</p>` : ''}
  </div>
`;

const device = (media, extraClass = '') => `
  <figure class="device ${extraClass}">
    <div class="device-bar">
      <span class="device-dots" aria-hidden="true"><span></span><span></span><span></span></span>
      <span class="device-url">127.0.0.1:8787</span>
    </div>
    <img src="${escapeHtml(media.src)}" alt="${escapeHtml(media.alt ?? '')}" loading="lazy" />
  </figure>
`;

const decisionCard = (entry) => `
  <article class="entry">
    <div class="entry-head">
      <span class="kind ${entry.kind}">${
        entry.kind === 'decision' ? '设计决策' : entry.kind === 'experiment' ? '实验' : '回退'
      }</span>
      <span class="entry-title">${escapeHtml(entry.title)}</span>
    </div>
    <p class="entry-body">${prettyText(entry.body)}</p>
    ${entry.version ? `<div class="entry-meta"><span>v${escapeHtml(entry.version)}</span><span>${escapeHtml(entry.versionTitle ?? '')}</span></div>` : ''}
  </article>
`;

const latestVersion = sortedVersions()[0];

/* ----------------------------------------------------------------- 视图 */

function homeView() {
  const recent = sortedVersions().slice(0, 6);
  const decisions = collectDecisions();
  const devlog = collectDevlog();

  return `
    <section class="hero">
      <div class="hero-copy">
        <span class="hero-badge enter">
          <span class="dot" aria-hidden="true"></span>
          最新版本 v${escapeHtml(latestVersion.version)} · ${escapeHtml(latestVersion.title)}
        </span>
        <h1 class="hero-title enter delay-1">把 Bangumi 收藏，<br />变成一份属于自己的长期数据</h1>
        <p class="lede enter delay-2">
          本地优先的个人动画数据工具：收藏完整同步到本机 SQLite，在其上做检索、统计、
          画像与双语简介。断网可用，数据只在自己机器上。
        </p>
        <div class="hero-actions enter delay-2">
          <a class="button primary" href="#/features">看看能做什么</a>
          <a class="button" href="#/versions">浏览版本档案</a>
          <a class="button ghost" href="#/shots">真实界面截图</a>
        </div>
      </div>
      <div class="hero-stage enter delay-1">
        ${device({ src: 'assets/shots/dashboard-dark.webp', alt: 'Bangumi Analyzer 仪表盘（深色）' })}
        <figcaption class="device-caption">
          <span>真实界面截图 · 深色主题</span>
          <span>所有分析都读取本地数据库</span>
        </figcaption>
      </div>
    </section>

    <section class="section quiet reveal">
      <div class="facts">
        <div class="fact">
          <span class="fact-mark" aria-hidden="true">1</span>
          <div>
            <p class="fact-title">本地优先</p>
            <p class="body-text">数据存在本机 SQLite；封面缓存到本地，断网也能正常浏览与分析。</p>
          </div>
        </div>
        <div class="fact">
          <span class="fact-mark" aria-hidden="true">2</span>
          <div>
            <p class="fact-title">完整而不是够用</p>
            <p class="body-text">标签不做截断，人员与公司可检索；统计口径互斥，每个数字都能被解释。</p>
          </div>
        </div>
        <div class="fact">
          <span class="fact-mark" aria-hidden="true">3</span>
          <div>
            <p class="fact-title">可以自己维护</p>
            <p class="body-text">Node + SQLite + React，无 ORM、无云服务；同步、备份与导入导出都在本机完成。</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section reveal">
      ${sectionHead('功能', '四个真正影响长期使用的能力', '下面每一项都来自实际使用中暴露的问题，而不是功能清单。')}
      <div class="entries four">
        ${features
          .map(
            (feature) => `
          <a class="entry-card" href="#/features/${escapeHtml(feature.id)}">
            <span class="kicker"><span class="kicker-index">${escapeHtml(feature.index)}</span>${escapeHtml(feature.kicker)}</span>
            <h3 class="card-title">${escapeHtml(feature.title)}</h3>
            <p class="body-text">${escapeHtml(feature.lead.split('：')[0])}</p>
            <span class="arrow">查看说明 →</span>
          </a>`,
          )
          .join('')}
      </div>
    </section>

    <section class="section reveal">
      <div class="section-head">
        <span class="kicker">版本</span>
        <h2 class="section-title">最近的版本</h2>
        <p class="lede">版本页回答「这个版本发生了什么」；档案页回答「为什么会长成这样」。</p>
      </div>
      ${timeline(recent)}
      <p class="body-text" style="margin-top: 18px">
        <a class="button" href="#/versions">全部 ${sortedVersions().length} 个版本</a>
      </p>
    </section>

    <section class="section reveal">
      ${sectionHead(
        '档案',
        '这里也记录「为什么」',
        '设计取舍、真实做过的实验，以及被回退的方案 —— 都来自开发过程中的真实记录。',
      )}
      <div class="entries">
        <div class="entry-card">
          <h3 class="card-title">设计决策 ${decisions.filter((item) => item.kind === 'decision').length} 条</h3>
          <p class="body-text">每个版本里那些「为什么这样做」的判断，以及它解决了什么问题。</p>
        </div>
        <div class="entry-card">
          <h3 class="card-title">实验与回退 ${decisions.filter((item) => item.kind !== 'decision').length} 条</h3>
          <p class="body-text">尝试过又放弃的方案、被回退的实现，以及放弃的原因。</p>
        </div>
        <div class="entry-card">
          <h3 class="card-title">开发日志 ${devlog.length} 条</h3>
          <p class="body-text">真实数据审计、断点扫描、性能实测的过程记录。</p>
        </div>
      </div>
      <p class="body-text" style="margin-top: 18px">
        <a class="button" href="#/archive">进入项目档案</a>
      </p>
    </section>
  `;
}

function timeline(entries) {
  return `
    <div class="timeline">
      ${entries
        .map(
          (entry) => `
        <a class="timeline-item" href="#/versions/${escapeHtml(entry.version)}">
          <div>
            <div class="timeline-version">
              v${escapeHtml(entry.version)}
              ${entry.version === latestVersion.version ? '<span class="latest-mark">最新</span>' : ''}
            </div>
            <div class="timeline-date">${formatDate(entry.date)}</div>
          </div>
          <div class="timeline-body">
            <span class="timeline-title">${escapeHtml(entry.title)}</span>
            <span class="timeline-summary">${prettyText(entry.summary)}</span>
          </div>
        </a>`,
        )
        .join('')}
    </div>
  `;
}

function featuresView() {
  return `
    <div class="page-head">
      <span class="kicker">功能</span>
      <h1 class="hero-title" style="font-size: clamp(28px, 3.4vw, 40px)">它是什么，以及它怎么工作</h1>
      <p class="lede">
        每条说明都按「功能是什么 → 如何工作 → 带来什么」展开；截图全部来自真实运行中的程序。
      </p>
    </div>

    ${features
      .map(
        (feature, index) => `
      <section class="story ${index % 2 === 1 ? 'reverse' : ''}" id="${escapeHtml(feature.id)}">
        <div class="story-copy">
          <span class="kicker"><span class="kicker-index">${escapeHtml(feature.index)}</span>${escapeHtml(feature.kicker)}</span>
          <h2 class="section-title">${escapeHtml(feature.title)}</h2>
          <p class="lede">${escapeHtml(feature.lead)}</p>
          <ol class="story-steps">
            ${feature.steps
              .map((step) => `<li><span class="step-arrow" aria-hidden="true">→</span><span>${prettyText(step)}</span></li>`)
              .join('')}
          </ol>
          <div class="tag-row">
            ${feature.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>
        <div class="story-media">
          ${device({ src: feature.media.src, alt: feature.title })}
          <figcaption class="device-caption"><span>${escapeHtml(feature.media.caption)}</span></figcaption>
        </div>
      </section>

      ${feature.id === 'search' ? demoSection() : ''}
    `,
      )
      .join('')}

    <section class="section quiet">
      <div class="panel">
        <h2 class="panel-title">这份说明不包含什么</h2>
        ${list([
          '不包含虚构的数据与指标：页面不引用任何个人收藏数量作为产品成绩。',
          '不包含未实现的功能承诺：功能说明只描述当前版本真实存在的能力。',
          '不包含评分、百分比之类的「效果指标」：本地工具的价值不在这些数字上。',
        ])}
      </div>
    </section>
  `;
}

function demoSection() {
  return `
    <section class="section quiet" id="demo">
      <div class="section-head">
        <span class="kicker">交互演示</span>
        <h2 class="section-title">试一试：高级筛选到底怎么计数</h2>
        <p class="lede">
          这个演示不连接任何数据，只用来说明产品里的一条硬规则：多个条件之间是「且」关系，
          徽标统计的是<strong>你主动设置的条件数量</strong>，不是命中的作品数。
        </p>
      </div>
      <div class="demo" data-demo>
        <div class="demo-bar">
          <span class="demo-title">高级筛选</span>
          <span class="demo-badge">
            高级筛选 <span class="count numeric" data-demo-count>0</span>
          </span>
        </div>
        <div class="demo-options" data-demo-options>
          ${['奇幻', '日常', '恋爱', '科幻', '治愈', '仅显示已评分']
            .map(
              (label) =>
                `<button class="chip" type="button" data-demo-chip aria-pressed="false">${escapeHtml(label)}</button>`,
            )
            .join('')}
        </div>
        <div class="demo-result">
          <span class="demo-query" data-demo-query>当前没有筛选条件 —— 显示全部收藏</span>
          <span class="demo-hint">
            按真实产品的语义：条件之间是「且」；徽标只统计条件个数，与命中数量无关。
          </span>
        </div>
      </div>
    </section>
  `;
}

const shots = [
  { id: 'dashboard', title: '仪表盘', note: '12 个关键指标 + 状态 / 评分 / 放送形态分布' },
  { id: 'library', title: '收藏库', note: '卡片与列表双视图，服务端分页与组合筛选' },
  { id: 'analysis', title: '统计分析', note: '年度趋势、类型与标签、评分偏差、观看习惯' },
  { id: 'settings', title: '设置 · 外观', note: '主题、背景板与界面材质' },
];

function shotsView() {
  return `
    <div class="page-head">
      <span class="kicker">界面</span>
      <h1 class="hero-title" style="font-size: clamp(28px, 3.4vw, 40px)">真实界面，不是设计稿</h1>
      <p class="lede">
        下面每一张都是程序真实渲染后截取的画面；可以切换深色 / 浅色，或点缩略图切换页面。
      </p>
    </div>

    <section class="section quiet">
      <div class="viewer" data-viewer>
        <div class="viewer-controls">
          <div class="segmented" role="group" aria-label="主题">
            <button class="segment" type="button" data-shot-theme="dark" aria-pressed="true">深色</button>
            <button class="segment" type="button" data-shot-theme="light" aria-pressed="false">浅色</button>
          </div>
          <span class="demo-hint" data-shot-note>${escapeHtml(shots[0].note)}</span>
        </div>

        <div data-shot-stage>${device({ src: `assets/shots/${shots[0].id}-dark.webp`, alt: shots[0].title })}</div>

        <div class="thumbs" role="group" aria-label="页面">
          ${shots
            .map(
              (shot, index) => `
            <button class="thumb" type="button" data-shot-id="${shot.id}" aria-pressed="${index === 0}">
              <img src="assets/shots/${shot.id}-dark.webp" alt="" loading="lazy" />
              ${escapeHtml(shot.title)}
            </button>`,
            )
            .join('')}
        </div>
      </div>

      <div class="panel" style="margin-top: 24px">
        <h2 class="panel-title">截图说明</h2>
        ${list([
          '截图来自开发机上的真实数据环境，但页面不展示、也不引用任何个人收藏数量。',
          '深色 / 浅色两组截图对应同一份界面的两套令牌，不是两张不同的设计。',
          '截图不含背景板效果：默认状态即为完全不带背景的样子，因此更容易对照界面结构。',
        ])}
      </div>
    </section>
  `;
}

function versionsView() {
  const entries = sortedVersions();
  return `
    <div class="page-head">
      <span class="kicker">版本</span>
      <h1 class="hero-title" style="font-size: clamp(28px, 3.4vw, 40px)">版本时间线</h1>
      <p class="lede">
        共 ${entries.length} 个版本。每个版本页回答「发生了什么」：新增、改进、修复、性能，
        以及这个版本里做过的设计取舍。
        这一页只记录 Analyzer —— 本站（Website）自己的版本历史在<a href="#/archive">项目档案</a>里。
      </p>
    </div>
    <section class="section quiet">${timeline(entries)}</section>
  `;
}

function versionView(version) {
  const entry = findVersion(version);
  if (!entry) {
    return `
      <div class="page-head">
        <span class="kicker">版本</span>
        <h1 class="hero-title" style="font-size: clamp(28px, 3.4vw, 40px)">没有这个版本</h1>
        <p class="lede">档案里没有 v${escapeHtml(version)}。可以回到<a href="#/versions">版本时间线</a>。</p>
      </div>
    `;
  }

  const entries = sortedVersions();
  const index = entries.findIndex((item) => item.version === entry.version);
  const previous = entries[index + 1];
  const next = entries[index - 1];

  return `
    <div class="page-head">
      <span class="breadcrumb"><a href="#/versions">版本</a> <span aria-hidden="true">/</span> v${escapeHtml(entry.version)}</span>
      <h1 class="hero-title" style="font-size: clamp(28px, 3.4vw, 40px)">${escapeHtml(entry.title)}</h1>
      <p class="lede">${prettyText(entry.summary)}</p>
      <div class="meta-row">
        <span class="meta-pill">v${escapeHtml(entry.version)}</span>
        <span class="meta-pill">${formatDate(entry.date)}</span>
        ${
          entry.version === latestVersion.version
            ? '<span class="latest-mark">当前最新</span>'
            : ''
        }
      </div>
    </div>

    ${(entry.sections ?? [])
      .map(
        (section) => `
      <section class="panel">
        <h2 class="panel-title">${escapeHtml(section.title)}</h2>
        ${list(section.items, section.title === '新增' ? 'list accent' : 'list')}
      </section>`,
      )
      .join('')}

    ${
      (entry.decisions ?? []).length
        ? `<section class="panel">
             <h2 class="panel-title">设计取舍 / 实验 / 回退</h2>
             <div class="grid-2">
               ${entry.decisions.map(decisionCard).join('')}
             </div>
           </section>`
        : ''
    }

    ${
      (entry.devlog ?? []).length
        ? `<section class="panel">
             <h2 class="panel-title">开发日志</h2>
             <div class="grid-2">
               ${entry.devlog
                 .map(
                   (note) => `
                 <article class="entry">
                   <div class="entry-head">
                     <span class="kind devlog">开发日志</span>
                     <span class="entry-title">${escapeHtml(note.title)}</span>
                   </div>
                   <p class="entry-body">${prettyText(note.body)}</p>
                   <div class="entry-meta"><span>${formatDate(note.date)}</span></div>
                 </article>`,
                 )
                 .join('')}
             </div>
           </section>`
        : ''
    }

    ${
      (entry.known ?? []).length
        ? `<section class="panel">
             <h2 class="panel-title">已知问题与后续维护</h2>
             ${list(entry.known)}
           </section>`
        : ''
    }

    <section class="section quiet">
      <div class="viewer-controls">
        ${previous ? `<a class="button" href="#/versions/${escapeHtml(previous.version)}">← v${escapeHtml(previous.version)} ${escapeHtml(previous.title)}</a>` : '<span></span>'}
        ${next ? `<a class="button" href="#/versions/${escapeHtml(next.version)}">v${escapeHtml(next.version)} ${escapeHtml(next.title)} →</a>` : '<span></span>'}
      </div>
    </section>
  `;
}

function archiveView() {
  const decisions = collectDecisions();
  const devlog = collectDevlog();
  const groups = [
    { kind: 'decision', title: '设计决策', note: '每个版本里那些「为什么这样做」的判断。' },
    { kind: 'experiment', title: '实验', note: '尝试过、并被产品保留或淘汰的方案。' },
    { kind: 'reverted', title: '回退', note: '实现过又撤回的改动 —— 回退同样是设计的一部分。' },
  ];

  return `
    <div class="page-head">
      <span class="kicker">档案</span>
      <h1 class="hero-title" style="font-size: clamp(28px, 3.4vw, 40px)">项目档案</h1>
      <p class="lede">
        版本页回答「这个版本发生了什么」；这里回答「为什么它会变成现在这样」。
        所有条目都来自真实记录，没有为了丰富页面而补写的内容。
      </p>
    </div>

    ${groups
      .map((group) => {
        const items = decisions.filter((item) => item.kind === group.kind);
        if (items.length === 0) return '';
        return `
        <section class="section quiet">
          ${sectionHead('', `${group.title} · ${items.length} 条`, group.note)}
          <div class="grid-2">${items.map(decisionCard).join('')}</div>
        </section>`;
      })
      .join('')}

    <section class="section quiet">
      ${sectionHead('', `开发日志 · ${devlog.length} 条`, '记录当时是怎么发现问题的、用了什么办法确认。')}
      <div class="grid-2">
        ${devlog
          .map(
            (note) => `
          <article class="entry">
            <div class="entry-head">
              <span class="kind devlog">开发日志</span>
              <span class="entry-title">${escapeHtml(note.title)}</span>
            </div>
            <p class="entry-body">${prettyText(note.body)}</p>
            <div class="entry-meta">
              <span>${formatDate(note.date)}</span>
              <span>v${escapeHtml(note.version)}</span>
            </div>
          </article>`,
          )
          .join('')}
      </div>
    </section>

    <section class="section quiet">
      ${sectionHead('工程', '项目结构与技术栈', architecture.intro)}
      <div class="grid-2">
        <div class="panel">
          <h2 class="panel-title">目录</h2>
          <div class="list">
            ${architecture.tree
              .map(
                ([name, note]) => `
              <div style="display: flex; gap: 12px; align-items: baseline">
                <code style="font-size: var(--text-note); color: var(--text)">${escapeHtml(name)}</code>
                <span class="entry-body">${escapeHtml(note)}</span>
              </div>`,
              )
              .join('')}
          </div>
        </div>
        <div class="panel">
          <h2 class="panel-title">技术栈</h2>
          <div class="list">
            ${stack
              .map(
                ([name, note]) => `
              <div style="display: flex; gap: 12px; align-items: baseline">
                <span class="entry-meta" style="min-width: 64px">${escapeHtml(name)}</span>
                <span class="entry-body">${escapeHtml(note)}</span>
              </div>`,
              )
              .join('')}
          </div>
        </div>
      </div>

      <div class="panel" style="margin-top: 16px">
        <h2 class="panel-title">如何运行</h2>
        <div class="list">
          ${running
            .map(
              (item) => `
            <div style="display: flex; flex-direction: column; gap: 2px">
              <span class="entry-title">${escapeHtml(item.title)}</span>
              <code style="font-size: var(--text-note); color: var(--text-muted)">${escapeHtml(item.command)}</code>
              <span class="entry-meta">${escapeHtml(item.note)}</span>
            </div>`,
            )
            .join('')}
        </div>
      </div>
    </section>

    ${websiteSection()}

    <section class="section quiet">
      <div class="panel">
        <h2 class="panel-title">声明</h2>
        ${list(disclaimers)}
      </div>
    </section>
  `;
}

/* ------------------------------------------- 本站自己的版本与同步规则 */

/**
 * Website 不是一个「只有 Analyzer 历史」的站点：它自己也有版本序列。
 * 这里只做两件事：说明两条序列的关系，并按版本记录本站自己的改动。
 */
const websiteVersionPanel = (entry) => `
  <section class="panel">
    <div class="meta-row">
      <span class="meta-pill">v${escapeHtml(entry.version)}</span>
      <span class="meta-pill">${formatDate(entry.date)}</span>
    </div>
    <h3 class="panel-title" style="margin: 12px 0 6px">${escapeHtml(entry.title)}</h3>
    <p class="entry-body">${prettyText(entry.summary)}</p>
    ${entry.sections
      .map(
        (group) => `
      <div class="version-group">
        <p class="kicker">${escapeHtml(group.title)}</p>
        ${list(group.items)}
      </div>`,
      )
      .join('')}
  </section>
`;

function websiteSection() {
  return `
    <section class="section quiet">
      ${sectionHead(
        '本站',
        'Website 版本与同步规则',
        '本站与 Analyzer 是两条独立的版本序列：Analyzer 的版本历史在上面的时间线与档案里，本节只记录本站自己。',
      )}
      <div class="panel">
        <h2 class="panel-title">两条版本序列</h2>
        ${versionSeries
          .map(
            ([name, series, note]) => `
          <div class="series-row">
            <span class="series-name">${escapeHtml(name)}</span>
            <div>
              <code style="font-size: var(--text-note); color: var(--text)">${escapeHtml(series)}</code>
              <p class="entry-body">${escapeHtml(note)}</p>
            </div>
          </div>`,
          )
          .join('')}
      </div>
      <div class="panel" style="margin-top: 16px">
        <h2 class="panel-title">同步 ≠ 升级</h2>
        ${list(versionPolicy)}
      </div>
    </section>

    <section class="section quiet">
      ${sectionHead('', `Website 版本 · ${websiteVersions.length} 个`, '本站自己的版本记录，最新的在最前面。')}
      <div class="grid-2">${websiteVersions.map(websiteVersionPanel).join('')}</div>
    </section>
  `;
}

/* ----------------------------------------------------------------- 路由 */

function currentRoute() {
  const raw = location.hash.replace(/^#/, '');
  return raw.startsWith('/') ? raw : '/';
}

const ROUTES = [
  { pattern: /^\/$/, render: () => homeView(), motion: true },
  { pattern: /^\/features$/, render: () => featuresView(), motion: true },
  { pattern: /^\/features\/(.+)$/, render: () => featuresView(), motion: false },
  { pattern: /^\/shots$/, render: () => shotsView(), motion: false },
  { pattern: /^\/versions$/, render: () => versionsView(), motion: false },
  { pattern: /^\/versions\/(.+)$/, render: (match) => versionView(decodeURIComponent(match[1])), motion: false },
  { pattern: /^\/archive$/, render: () => archiveView(), motion: false },
];

function render() {
  const route = currentRoute();
  const matched = ROUTES.find((entry) => entry.pattern.test(route));
  const base = route.split('#')[0];

  view.innerHTML = matched ? matched.render(base.match(matched.pattern) ?? []) : notFoundView(route);

  // 导航高亮
  for (const link of navLinks.querySelectorAll('.nav-link')) {
    const target = link.dataset.route;
    const active = target === '/' ? base === '/' : base.startsWith(target);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }

  navLinks.hidden = true;
  navToggle.setAttribute('aria-expanded', 'false');

  setupViewInteractions(matched?.motion ?? false);
  window.scrollTo({ top: 0, behavior: 'auto' });

  /* Feature 深链接（#/features/search 这类）：渲染完再滚到对应区块 */
  const focus = route.match(/^\/features\/(.+)$/);
  if (focus) scrollToFeature(decodeURIComponent(focus[1]));
}

/**
 * 滚到某个 Feature 区块。顶栏是 sticky 的，所以要减去它的高度，
 * 否则区块标题会被压在悬浮栏下面。
 */
function scrollToFeature(id) {
  const target = document.getElementById(id);
  if (!target) return;
  const nav = document.querySelector('.nav-wrap');
  const offset = (nav?.getBoundingClientRect().height ?? 0) + 16;
  window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'auto' });
}

function notFoundView(route) {
  return `
    <div class="page-head">
      <span class="kicker">404</span>
      <h1 class="hero-title" style="font-size: clamp(28px, 3.4vw, 40px)">这个页面不存在</h1>
      <p class="lede">没有找到 <code>${escapeHtml(route)}</code>。可以回到<a href="#/">首页</a>或<a href="#/versions">版本时间线</a>。</p>
    </div>
  `;
}

/* ------------------------------------------------- 视图内的交互与动效 */

function setupViewInteractions(withMotion) {
  /* 首屏入场的 animation 由 CSS 负责；这里只处理「分节揭示」与视差。 */
  /* 观察者不可用时直接呈现最终状态：揭示动画永远不能成为内容可见的前提。 */
  if (withMotion && !prefersReducedMotion() && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-in');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );
    for (const element of view.querySelectorAll('.reveal')) observer.observe(element);
  } else {
    for (const element of view.querySelectorAll('.reveal')) element.classList.add('reveal-in');
  }

  setupHeroParallax();
  setupDemo();
  setupViewer();
}

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Hero 视差：整站唯一持续响应滚动的运动，幅度很小（最多 14px / 1.6deg）。
 * 只在宽屏 + 允许动效时启用；其余情况完全静止。
 */
function setupHeroParallax() {
  const stage = view.querySelector('.hero-stage');
  const target = stage?.querySelector('.device');
  if (!stage || !target) return;
  if (prefersReducedMotion() || window.innerWidth < 960) return;

  let frame = 0;
  const update = () => {
    frame = 0;
    const rect = stage.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
    const shift = (progress - 0.5) * 2; // -1 → 1
    target.style.setProperty('--float-y', `${(-shift * 10).toFixed(2)}px`);
    target.style.setProperty('--tilt', `${(shift * 1.6).toFixed(2)}`);
    target.style.setProperty('--tilt-y', `${(shift * -0.8).toFixed(2)}`);
  };
  const onScroll = () => {
    if (frame) return;
    frame = requestAnimationFrame(update);
  };
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
}

/** 交互演示：高级筛选的条件计数语义（不连接任何数据） */
function setupDemo() {
  const root = view.querySelector('[data-demo]');
  if (!root) return;
  const count = root.querySelector('[data-demo-count]');
  const query = root.querySelector('[data-demo-query]');
  const chips = [...root.querySelectorAll('[data-demo-chip]')];

  const update = () => {
    const active = chips.filter((chip) => chip.getAttribute('aria-pressed') === 'true');
    count.textContent = String(active.length);
    if (active.length === 0) {
      query.textContent = '当前没有筛选条件 —— 显示全部收藏';
      return;
    }
    const labels = active.map((chip) => chip.textContent.trim());
    query.textContent = `标签 ∈ { ${labels.join('、')} } · ${active.length} 个条件（且关系）`;
  };

  for (const chip of chips) {
    chip.addEventListener('click', () => {
      const next = chip.getAttribute('aria-pressed') !== 'true';
      chip.setAttribute('aria-pressed', String(next));
      update();
    });
  }
  update();
}

/** 截图取景框：主题分段 + 缩略图切换（只做 150ms 淡入，不做转场动画） */
function setupViewer() {
  const root = view.querySelector('[data-viewer]');
  if (!root) return;
  const stage = root.querySelector('[data-shot-stage]');
  const note = root.querySelector('[data-shot-note]');
  const themeButtons = [...root.querySelectorAll('[data-shot-theme]')];
  const thumbs = [...root.querySelectorAll('[data-shot-id]')];
  let theme = 'dark';
  let current = thumbs[0]?.dataset.shotId ?? 'dashboard';

  const paint = () => {
    const shot = shots.find((item) => item.id === current) ?? shots[0];
    stage.innerHTML = device({ src: `assets/shots/${shot.id}-${theme}.webp`, alt: shot.title });
    note.textContent = shot.note;
    for (const thumb of thumbs) {
      thumb.setAttribute('aria-pressed', String(thumb.dataset.shotId === current));
    }
    for (const button of themeButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.shotTheme === theme));
    }
  };

  themeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      theme = button.dataset.shotTheme;
      paint();
    });
  });
  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      current = thumb.dataset.shotId;
      paint();
    });
  });
  paint();
}

/* ------------------------------------------------------------ 全局交互 */

navToggle.addEventListener('click', () => {
  const open = navLinks.hidden;
  navLinks.hidden = !open;
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
});

themeToggle.addEventListener('click', () => {
  const dark = document.documentElement.classList.toggle('dark');
  themeIcon.textContent = dark ? '◐' : '◑';
  try {
    localStorage.setItem('bangumi-site-theme', dark ? 'dark' : 'light');
  } catch {
    /* 隐私模式下不可写：仅本次生效 */
  }
});

themeIcon.textContent = document.documentElement.classList.contains('dark') ? '◐' : '◑';

document.getElementById('footer-note').textContent = `${site.name} · ${site.tagline}。${site.repoNote}`;
document.getElementById('footer-version').textContent =
  `Website v${website.version}（${formatDate(website.date)}）· 本站记录的 Analyzer 版本：v${website.analyzer}`;
document.getElementById('footer-links').innerHTML = `
  <a class="nav-link" href="#/features">功能</a>
  <a class="nav-link" href="#/shots">界面</a>
  <a class="nav-link" href="#/versions">版本</a>
  <a class="nav-link" href="#/archive">档案</a>
`;

window.addEventListener('hashchange', render);
render();
