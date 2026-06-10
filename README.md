# text2echart — Data to ECharts Charts

Convert structured data (JSON / CSV) into beautiful ECharts SVG charts.
Zero npm dependencies. CLI + interactive Web App.

---

## Web App — `text2echarts.html`

Open `web/text2echarts.html` in your browser for a full interactive GUI.

**Opening the app:**
- **Locally:** Double-click `web/text2echarts.html` or run `open web/text2echarts.html`.
- **Browser:** Works in any modern browser (Chrome/Firefox/Safari 2020+). All dependencies are bundled — no internet required.

**Features:**
- **Templates** — 6 chart types with ready-to-use templates: bar, line, pie, scatter, radar, and wordcloud. Templates are available in both Chinese and English.
- **Theme switching** — 6 built-in themes: dark, infographic, macarons, roma, shine, vintage. Switch via the dropdown and see the chart update instantly.
- **Export** — Download charts as PNG, JPG, or SVG with one click from the export menu.
- **Language toggle** — Toggle between English and Chinese via the language button (中文 / English). Language packs are in `web/lang/en.json` and `web/lang/zh.json`.
- **Input methods** — Drag and drop CSV/JSON files onto the page, or paste data directly into the editor panel.

---

## CLI — `cli.js`

The CLI tool converts CSV and JSON to self-contained HTML chart files. Zero npm dependencies — Node.js standard library only.

### Basic Usage

```bash
node cli.js <input> [options]
```

**Input** can be a file path or `-` for stdin (pipe).

### Options

| Option | Description |
|--------|-------------|
| `-o, --out <file>` | Output file name (default: `chart-N.html`) |
| `--type <type>` | Chart type for CSV: `bar`, `line`, `pie`, `radar` (default: `bar`) |
| `--theme <name>` | Theme: `dark`, `infographic`, `macarons`, `roma`, `shine`, `vintage` |
| `--width <px>` | Chart width in pixels (default: 800) |
| `--height <px>` | Chart height in pixels (default: 500) |
| `--slide` | 960×540 PPT slide mode |
| `--svg` | SVG renderer |
| `--open` | Open the generated HTML in browser |
| `--embed` | Embed ECharts library for offline use (~1MB) |
| `--help` | Show help text |

### Input Formats

**CSV** — auto-detected. First column becomes labels, remaining columns become series values.

```csv
Month,Revenue,Cost
Jan,1200,800
Feb,1500,900
Mar,1800,1100
```

**JSON** — accepts standard ECharts option objects or a simplified `{type, data, options}` format.

```json
{
  "series": [{
    "type": "bar",
    "data": [{"name": "A", "value": 30}, {"name": "B", "value": 50}]
  }],
  "title": {"text": "Sample"}
}
```

### Examples

```bash
# CSV to bar chart, open in browser
node cli.js sales.csv --open

# CSV to line chart with dark theme
node cli.js data.csv --type line --theme dark

# JSON to pie chart, PPT dimensions
node cli.js pie.json --slide -o present.html

# Pipe from stdin
cat data.csv | node cli.js - --embed

# Pipe from remote API
curl -s https://api.example.com/stats.json | node cli.js -
```

---

## Skill — OpenClaw Integration

Register `text2echart` as a skill in OpenClaw, and it triggers automatically when you say **"chart"**, **"graph"**, **"visualize"**, **"plot"**, or their Chinese equivalents like **"图表"**, **"画图"**, **"可视化"**.

**How to register:**
1. Copy the `text2echart/` folder into your OpenClaw skills directory.
2. The skill definition (`SKILL.md`) includes metadata for auto-discovery.
3. The web app (`web/text2echarts.html`) is the primary launch target.

**What happens:**
- When triggered, OpenClaw opens the interactive web app or invokes the CLI.
- The agent can then help you pick chart types, apply themes, and export results.

---

## Project Structure

```
text2echart/
├── SKILL.md                  # OpenClaw skill definition (metadata, triggers, usage)
├── cli.js                    # CLI tool — zero npm deps, Node.js stdlib only
├── prompt.md                 # LLM prompt engineering guide
├── text2echarts.html       # Interactive web application (entry point)
├── static/
│   ├── app.js              # Core logic (i18n, chart rendering, theme switching)
│   ├── styles.css          # Shared styles
│   ├── templates.js        # Chart templates (Chinese)
│   ├── templates-en.js     # Chart templates (English)
│   ├── lang/
│   │   ├── en.json         # English language pack
│   │   └── zh.json         # Chinese language pack
│   └── README.md           # Web app reference docs
├── lib/                    # Bundled ECharts libs (echarts + wordcloud + 6 themes)
├── scripts/
│   └── build.js            # Build script (CLI callable)
├── test/
│   ├── test-all.js           # Node.js test runner (Playwright)
│   └── test-all.sh           # Shell test runner
├── references/               # ECharts option references (EN + 中文)
└── docs/                     # Project docs (spec, audit, test reports, etc.)
```

---

## Dependencies

- **CLI:** Node.js only. Uses the standard library — no `npm install` required.
- **Runtime:** ECharts loads from CDN by default (requires internet). Use `--embed` to bundle ECharts into the output HTML (~1MB) for offline use.
- **Web App:** All dependencies (ECharts 5.6, wordcloud extension, 6 themes) are bundled in `web/lib/`. Works fully offline.

---

---

# text2echart — 数据转 ECharts 图表

将结构化数据（JSON / CSV）转换为精美的 ECharts SVG 图表。
零 npm 依赖。提供 CLI 与交互式 Web 应用两种使用方式。

---

## Web 应用 — `text2echarts.html`

在浏览器中打开 `web/text2echarts.html`，即可使用完整的交互式图表生成器。

**打开方式：**
- **本地：** 双击 `web/text2echarts.html` 或执行 `open web/text2echarts.html`。
- **浏览器：** 支持所有现代浏览器（Chrome/Firefox/Safari 2020+）。所有依赖均已打包，无需联网。

**功能：**
- **模板选择** — 提供 6 种图表的开箱即用模板：柱状图、折线图、饼图、散点图、雷达图、词云。模板支持中英文。
- **主题切换** — 内置 6 套主题：dark、infographic、macarons、roma、shine、vintage。从下拉菜单切换主题，图表即时更新。
- **导出功能** — 一键导出为 PNG、JPG 或 SVG，通过导出菜单即可完成。
- **中英语言切换** — 点击语言按钮（中文 / English）即可在中英文之间切换。语言包位于 `web/lang/en.json` 和 `web/lang/zh.json`。
- **数据输入** — 支持拖拽 CSV/JSON 文件至页面，或直接在编辑器面板粘贴数据。

---

## CLI — `cli.js`

CLI 工具可将 CSV 和 JSON 转换为一站式 HTML 图表文件。零 npm 依赖，仅需 Node.js 标准库。

### 基本用法

```bash
node cli.js <输入> [选项]
```

**输入**可以是文件路径，也可以是 `-`（从 stdin 读取）。

### 选项

| 选项 | 说明 |
|------|------|
| `-o, --out <文件>` | 输出文件名（默认: `chart-N.html`） |
| `--type <类型>` | CSV 图表类型：`bar`、`line`、`pie`、`radar`（默认: `bar`） |
| `--theme <名称>` | 主题：`dark`、`infographic`、`macarons`、`roma`、`shine`、`vintage` |
| `--width <像素>` | 图表宽度（像素，默认: 800） |
| `--height <像素>` | 图表高度（像素，默认: 500） |
| `--slide` | 960×540 PPT 尺寸模式 |
| `--svg` | SVG 渲染器 |
| `--open` | 生成后在浏览器中打开 |
| `--embed` | 内嵌 ECharts 库以支持离线使用（约 1MB） |
| `--help` | 显示帮助 |

### 输入格式

**CSV** — 自动识别。第一列为标签，其余列为数据系列。

```csv
月份,收入,成本
1月,1200,800
2月,1500,900
3月,1800,1100
```

**JSON** — 接受标准 ECharts 配置对象或简化格式 `{type, data, options}`。

```json
{
  "series": [{
    "type": "bar",
    "data": [{"name": "A", "value": 30}, {"name": "B", "value": 50}]
  }],
  "title": {"text": "示例"}
}
```

### 示例

```bash
# CSV 转柱状图，浏览器中打开
node cli.js sales.csv --open

# CSV 转折线图，dark 主题
node cli.js data.csv --type line --theme dark

# JSON 转饼图，PPT 尺寸
node cli.js pie.json --slide -o present.html

# 从 stdin 管道输入
cat data.csv | node cli.js - --embed

# 从远程 API 管道输入
curl -s https://api.example.com/stats.json | node cli.js -
```

---

## Skill — OpenClaw 集成

将 `text2echart` 注册为 OpenClaw 技能后，当你说 **"chart"**、**"graph"**、**"visualize"**、**"plot"** 或中文关键词如 **"图表"**、**"画图"**、**"可视化"** 时，它会自动触发。

**注册方式：**
1. 将 `text2echart/` 文件夹复制到 OpenClaw skills 目录。
2. 技能定义文件（`SKILL.md`）包含了自动发现的元数据。
3. Web 应用（`web/text2echarts.html`）是主要的启动目标。

**触发后的行为：**
- OpenClaw 会打开交互式 Web 应用或调用 CLI。
- Agent 随后可以帮你选择图表类型、应用主题并导出结果。

---

## 项目结构

```
text2echart/
├── SKILL.md                  # OpenClaw 技能定义（元数据、触发词、用法）
├── cli.js                    # CLI 工具 — 零 npm 依赖，纯 Node.js 标准库
├── prompt.md                 # LLM 提示工程指南
├── text2echarts.html       # 交互式 Web 应用（入口文件）
├── static/
│   ├── app.js              # 核心逻辑（国际化、图表渲染、主题切换）
│   ├── styles.css          # 共享样式
│   ├── templates.js        # 图表模板（中文）
│   ├── templates-en.js     # 图表模板（英文）
│   ├── lang/
│   │   ├── en.json         # 英文语言包
│   │   └── zh.json         # 中文语言包
│   └── README.md           # Web 应用参考文档
├── lib/                    # 打包的 ECharts 库（echarts + wordcloud + 6 主题）
├── scripts/
│   └── build.js            # 构建脚本（CLI 可调用）
├── test/
│   ├── test-all.js           # Node.js 测试脚本（Playwright）
│   └── test-all.sh           # Shell 测试脚本
├── references/               # ECharts 配置项参考文档（EN + 中文）
└── docs/                     # 项目文档（规格、审计、测试报告等）
```

---

## 依赖说明

- **CLI：** 仅需 Node.js。使用标准库，无需 `npm install`。
- **运行时：** 默认通过 CDN 加载 ECharts（需要网络）。使用 `--embed` 可将 ECharts 打包进输出 HTML（约 1MB），支持离线使用。
- **Web 应用：** 所有依赖（ECharts 5.6、词云扩展、6 套主题）已打包在 `web/lib/` 中，完全支持离线使用。
