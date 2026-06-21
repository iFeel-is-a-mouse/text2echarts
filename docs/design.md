# text2echart — 项目设计文档

> v2.1 | 2026-06-09 | 5 Agent 联合审查后修订

---

## 一、项目概述

text2echart 是一个 OpenClaw Skill，将结构化数据（CSV/JSON）转换为 ECharts SVG 图表 HTML 文件。零 npm 依赖，支持 CLI 和 Web GUI 两种使用方式。

### 1.1 问题背景

非技术人员需要将数据快速转换为可视化图表，但现有工具要么太复杂（需要编程知识），要么太重（需要安装/配置）。text2echart 解决的是"一句话出图"的需求——用户描述数据，获得可直接打开的 HTML 图表文件。

### 1.2 设计目标

- 零安装：不依赖任何 npm 包，仅 Node.js 标准库
- 零配置：CSV 文件直接出图，无需手动构造 JSON
- 离线可用：ECharts 库内嵌在 HTML 中，无需网络
- 双入口：CLI 适合脚本化批量处理，Web GUI 适合交互式探索

---

## 二、架构设计

### 2.1 三条处理路径

本系统有三条独立的处理路径，各有不同的数据流：

| 路径 | 输入 | 处理层 | 输出 | 适用场景 |
|------|------|--------|------|---------|
| **CLI** | CSV/JSON 文件或管道 | cli.js 的 csv2echart() 硬编码转换 + makeHTML() 模板注入 | 自包含 HTML | 脚本/批处理/管道 |
| **Web GUI** | 手动输入 ECharts option JSON | app.js 的 transformObject() + echarts.setOption() | 浏览器内渲染 + PNG/JPG/SVG 导出 | 交互式探索/试错 |
| **LLM Prompt** | 自然语言描述 | prompt.md 指导 LLM 构造 ECharts option JSON | option JSON 字符串（可注入 CLI/Web） | 对话式/一说出图 |

**三条路径的关系：** 相互独立，不共享处理逻辑。CLI 和 Web GUI 各有自己的 HTML 模板和主题映射表（`THEME_MAP`），维护时需同步修改两处。

### 2.2 整体数据流

```
用户数据 (CSV/JSON/自然语言)
  │
  ▼
[CLI 路径]                  [Web GUI 路径]            [LLM Prompt 路径]
cli.js 读取文件/管道        用户在 textarea 输入        用户描述数据 → LLM
  │                          │                           │
csv2echart() 解析           JSON.parse 验证             prompt.md 指导
  │  (CSV: 逗号分隔)          │  (非法JSON显示错误)       │  (Chain-of-Thought)
  ▼                          ▼                           ▼
ECharts option JSON  ────── 同一格式 ───────────────── ECharts option JSON
  │
  ▼
makeHTML() 模板注入
  ├── SVG renderer (CLI 默认)
  ├── 内嵌 ECharts 库 (embed: true)
  ├── 6 种主题
  └── 幻灯片模式 (960x540)
  │
  ▼
自包含 .html 文件 → 浏览器打开 → 交互式 SVG 图表
```

---

## 三、核心模块

### 3.1 CLI (`cli.js`)

- **语言:** Node.js (零 npm 包，仅 stdlib)
- **输入:** CSV（逗号分隔，不支持引号/转义）或 JSON 文件，支持 stdin 管道
- **CSV 限制:** 当前实现仅支持简单逗号分隔格式，不支持：
  - 值中包含逗号：`"New York, NY",1200`
  - 值中包含引号：`"He said ""hello""",30`
  - Tab 分隔的 TSV
- **图表类型支持:**
  - CSV 输入: bar, line, pie, radar（通过 `--type` 指定）
  - JSON 输入: 全部 6 种（bar/line/pie/scatter/radar/wordcloud）
- **输出:** 自包含 HTML（默认 `embed: true` 内嵌 ECharts 库，`--cdn` 模式仅 CDN 引用）
- **选项:** `--theme / --svg / --open / --embed / --slide / --width / --height`

### 3.2 Web GUI (`web/text2echarts.html`)

- **前端:** 纯 HTML+CSS+JS（无框架），所有逻辑在 `app.js` 的 `initApp()` 闭包中
- **图表模板:** 4 种预设（bar/line/pie/wordcloud），scatter/radar 需手动输入 JSON
- **语言切换:** JSON 语言包 (`web/lang/en.json` + `web/lang/zh.json`)，通过 `fetch` 加载 + 嵌入式 fallback
- **导出:** PNG / JPG / SVG / JSON
- **安全说明:** `functionInput` 区域允许用户输入 JS 通过 `new Function()` 执行，`transformObject()` 也会将 option JSON 中的函数字符串转换为可执行函数。**此功能设计为本地可靠环境使用，不适合公共部署。**
- **渲染:** Web GUI 使用 Canvas 渲染器（默认），与 CLI 的 SVG 默认不同

### 3.3 SKILL (`SKILL.md`)

- **注册:** OpenClaw skills 目录 symlink (`~/.openclaw/workspace/skills/text2echart/`)
- **触发关键词:** chart, graph, visualize, plot, 画图, 图表, 可视化, 柱状图, 饼图
- **参考文档:** 19 个 reference 文件（完整选项树 EN + ZH + 16 分项说明）
- **Prompt 工程:** `prompt.md` (402行, 9 章) — 指导 LLM 构造 ECharts option JSON

---

## 四、图表类型与输入格式

### 4.1 CLI 输入格式

| 类型 | CSV 输入 | JSON 输入 | 关键配置 |
|------|----------|-----------|---------|
| bar | ✅ col1=name, col2+=values | ✅ | xAxis(type:category) + yAxis(type:value) |
| line | ✅ | ✅ | smooth + areaStyle + shadow |
| pie | ✅ col1=name, col2=value | ✅ | radius(% donut) + {d}% formatter |
| radar | ✅ col1=dim, col2+=values | ✅ | radar.indicator + polygon |
| scatter | ❌ 需 JSON | ✅ | data: [[x,y]] + symbolSize |
| wordcloud | ❌ 需 JSON | ✅ | wordCloud extension + name/value |

### 4.2 Web GUI 模板覆盖

Web GUI 提供 4 种预设模板（柱状/折线/饼图/词云），scatter 和 radar 可通过直接输入 ECharts option JSON 使用全部 6 种类型。

---

## 五、技术选型与设计决策

### 5.1 技术选型

| 组件 | 选择 | 备选方案 | 选择理由 |
|------|------|---------|---------|
| 图表引擎 | ECharts 5.6 | Chart.js / D3.js | ECharts 中文生态最成熟，SVG/Canvas 双渲染，社区活跃 |
| 渲染方式 | SVG (CLI 默认) | Canvas | 矢量无损缩放，文件小巧，适合导出 |
| CLI 语言 | Node.js | Python / Rust | 与 ECharts JS 生态一致，跨平台，零编译 |
| Web 框架 | 裸 HMTL+CSS+JS | React / Vue / Svelte | 零依赖目标，当前 <1000 行 JS 可控 |
| 语言切换 | JSON i18n | gettext / ICU | 标准格式，fetch + 嵌入双模式 fallback |
| 词云扩展 | echarts-wordcloud 2.1 | 自实现 | 官方扩展，API 稳定 |

### 5.2 关键设计决策

**决策 1: 为什么 CLI + Web 双入口？**
- CLI 适合批量处理、管道集成、自动化脚本
- Web GUI 适合交互式探索、模板选择、格式导出
- 两者各自独立，不共享代码，维护时需同步修改

**决策 2: 为什么内嵌 ECharts 库？**
- `embed: true` 默认，生成 ~1MB 自包含 HTML，离线可用
- `--cdn` 模式生成 ~800B HTML，需网络加载 ECharts

**决策 3: 为什么 Web GUI 不用框架？**
- 当前代码规模可控（~1000 行 JS），引入框架的开销大于收益
- 计划：当 JS 超过 2000 行或需要状态管理时考虑引入 Preact 或拆分模块

---

## 六、质量保障

### 6.1 文档体系

| 文档 | 用途 | 语言 | 行数 |
|------|------|------|------|
| README.md | 项目介绍 + 使用说明 | 英中双语 | ~300 |
| SKILL.md | OpenClaw Skill 定义 | 英文 | ~250 |
| prompt.md | LLM Prompt 工程指南 | 英文 | 402 |
| docs/design.md | 本设计文档 | 中文 | ~150 |
| docs/spec.md | 规格说明 | 中文 | — |

### 6.2 测试

- **框架:** Playwright (headless Chromium)
- **覆盖:** 52 测试用例, 98.1% 通过率
- **测试内容:**
  - Web GUI: 4 模板加载/渲染, 6 主题切换, 导出 PNG/JPG/JSON, 中英切换, 响应式, 错误处理
  - CLI: 需补充（当前 tests 绕过 cli.js，直接测试 scripts/build.js）
- **测试目录:** `test/` (gitignored)

### 6.3 质量标准

- 代码注释: 全英文
- 版本管理: Git + GitHub (https://github.com/iFeel-is-a-mouse/text2echarts)
- 发布: ClawHub (`clawhub publish`)

### 6.4 已知限制

| 限制 | 说明 |
|------|------|
| 大数据量 | 推荐 <1000 数据点，超出需使用 ECharts dataZoom/sampling |
| CSV 格式 | 仅支持简单逗号分隔，不支持引号/转义/TSV |
| Web GUI 安全 | `new Function()` 执行用户输入，不适合公共部署 |
| SVG 兼容 | 词云在 SVG 模式下渲染有限（echarts-wordcloud 主要支持 Canvas） |
| 浏览器 | Chrome/Firefox/Safari 2020+ |

---

## 七、文件结构

```
text2echart/
├── SKILL.md               # Skill 定义（元数据 + 使用说明 + 参考表）
├── cli.js                 # CLI（零 npm 依赖）
├── prompt.md              # Prompt 工程指南（402行）
├── README.md              # 项目 README（英中双语）
├── .gitignore
│
├── references/            # 19 个 ECharts 参考文档
│   ├── echarts-option-*.md     # 完整选项树 (EN/ZH)
│   └── echarts-zh-*.md         # 16 个分项说明
│
├── web/                   # Web GUI
│   ├── text2echarts.html  # 主页面（中英切换）
│   ├── app.js             # 核心逻辑（initApp 闭包）
│   ├── styles.css         # 样式
│   ├── templates.js       # 中文模板（bar/line/pie/cloud）
│   ├── templates-en.js    # 英文模板
│   ├── lang/
│   │   ├── en.json        # 英文语言包
│   │   └── zh.json        # 中文语言包
│   └── lib/               # ECharts 库（7 个 JS 文件）
│
├── scripts/               # 构建脚本
│   └── build.js           # HTML 模板注入（与 cli.js 独立）
│
├── test/                  # 测试（gitignored）
│   ├── test-all.js        # Playwright 批处理测试
│   └── test-all.sh        # 轻量验证脚本
│
├── examples/              # 内部参考（不发布）
│   ├── input/             #   测试用例输入
│   ├── expected/          #   期望输出
│   └── *.md               #   项目调研/参考文章
│
└── docs/                  # 设计文档（不发布）
    ├── design.md          # 本文件
    ├── spec.md            # 规格说明
    └── journey.md         # 过程日志
```

> **约定:** `examples/` 和 `docs/` 均为内部资料，不面向最终用户。`examples/` 用于项目启动前的调研参考和开发中的输入/输出验证。两者均通过 `.clawhubignore` 排除发布，通过 `.gitignore` 保留在版本库中。
