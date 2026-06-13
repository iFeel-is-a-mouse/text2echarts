# text2echart — 项目宪章 (Project Constitution)

> 版本: v1.0 | 生效日期: 2026-06-10 | 最后修订: 2026-06-10
>
> 本宪章是 text2echart 项目的最高原则文件。所有设计、实现、审查、变更必须以本宪章为基准。
> 违反宪章核心原则的代码不得合并。

---

## 1. 项目身份与目标

**项目名称：** text2echart  
**一句话定位：** 将结构化数据（JSON/CSV）自动转换为精美的 ECharts 可视化 HTML 文件。  
**目标用户：** 需要快速生成数据图表的开发者、数据分析师、非技术用户（通过 LLM Agent）。  
**输出物：** 自包含 HTML 文件（浏览器直接打开即可渲染图表）。

---

## 2. 核心原则（不可妥协）

### 原则 1：数据准确性优先于美观

> **图表渲染的数据必须与输入数据一致，不允许因转换逻辑错误导致数据偏差。**

**可验证标准：**
- 数值类型：输入 `{value: 1200}` → 图表显示 1200，误差 = 0
- 百分比：饼图各扇区 `d%` 之和 = 100%（允许浮点精度 ±0.1%）
- CSV 解析：所有数字列正确解析为 `parseFloat`，空值/非数字 → 0

**违反示例：**
- ❌ CSV 中 `"1,200"`（千分位）被解析为 `1` 而非 `1200`
- ❌ 饼图百分比格式化中遗漏某项导致总和 ≠ 100%
- ❌ 字符串列被误当作数值列渲染

### 原则 2：用户数据不离开本机

> **CLI 工具和 Web 应用均不得将用户输入数据发送到任何远程服务器。数据处理完全在本地完成。**

**可验证标准：**
- CLI：零网络请求（除用户明确使用的 CDN 加载 ECharts 库本身）
- Web App：`text2echarts.html` 无任何 `fetch()`/`XMLHttpRequest` 向外部发送用户数据
- `--embed` 模式：完全离线，零网络依赖

**违反示例：**
- ❌ 在 Web App 中添加分析统计 `fetch('https://analytics.example.com', {body: chartData})`
- ❌ CLI 生成的 HTML 中包含 Google Analytics 或其他跟踪脚本
- ❌ 将用户 CSV 数据发送到云端"优化"后再返回

### 原则 3：输出 HTML 不得包含跟踪脚本、广告或恶意代码

> **生成的 HTML 文件必须纯净——仅包含 ECharts 渲染所需的代码，不包含任何第三方跟踪、广告、挖矿脚本。**

**可验证标准：**
- 生成的 HTML 中 `<script>` 标签仅包含 ECharts 核心、扩展（wordcloud）、主题文件
- 无 `gtag`、`ga`、`fbq`、`_gaq`、`dataLayer` 等跟踪标识符
- 无 `coin-hive`、`crypto-mining` 等挖矿标识符
- 无外部图片/字体/iframe 加载（除 CDN 的 echarts 库）

**违反示例：**
- ❌ 生成的 HTML 中包含 `<script async src="https://www.googletagmanager.com/...">`
- ❌ 在模板中注入广告 iframe
- ❌ 引入未声明的第三方统计 SDK

### 原则 4：开箱即用，零配置

> **生成的 HTML 文件在任何现代浏览器（Chrome/Firefox/Safari/Edge 2020+）中直接打开即可渲染图表，无需安装插件、配置服务器或修改代码。**

**可验证标准：**
- 双击 `.html` 文件 → 浏览器中图表正确渲染
- 无需本地 HTTP 服务器（`file://` 协议即可）
- 无浏览器控制台错误（红色错误 = 不合格）
- 窗口缩放时图表自适应

**违反示例：**
- ❌ 生成的 HTML 需要 `localhost:3000` 才能加载（CORS 限制）
- ❌ 依赖 `node.js` 运行时才能渲染
- ❌ 需要用户手动修改 HTML 中的 `API_KEY`

### 原则 5：最小依赖，最大兼容

> **CLI 工具零 npm 依赖（Node.js 标准库 only）。Web App 依赖全部打包在 `web/lib/` 中。运行时唯一外部依赖是 ECharts CDN（可选的 `--embed` 模式可消除此依赖）。**

**可验证标准：**
- `cli.js` 的 `require()` 仅使用 Node.js 内置模块（`fs`, `path`, `os`, `child_process`）
- `package.json` 不存在（或仅包含 devDependencies 如 Playwright 用于测试）
- `--embed` 模式生成的 HTML 在无网络环境下正常渲染

**违反示例：**
- ❌ `cli.js` 中 `require('axios')` 或 `require('cheerio')`
- ❌ Web App 从 unpkg/jsdelivr 以外的未知 CDN 加载依赖
- ❌ 运行时依赖需要 `npm install` 的包（Playwright 用于 SVG 导出除外）

---

## 3. 技术约束

| 维度 | 约束 |
|------|------|
| **语言** | JavaScript (Node.js + 浏览器) |
| **运行时** | Node.js ≥ 16（CLI）；浏览器 Chrome/Firefox/Safari/Edge ≥ 2020 |
| **图表库** | Apache ECharts 5.6.0 |
| **扩展** | echarts-wordcloud 2.1.0 |
| **构建系统** | 无——直接执行的脚本（`cli.js`, `scripts/build.js`） |
| **测试框架** | Playwright（用于截图验证；仅 devDependency） |
| **代码风格** | 2 空格缩进，函数名 camelCase，中文注释 |
| **编码** | UTF-8（所有 .html/.js/.json/.csv 文件） |

---

## 4. 非目标（明确不做什么）

以下功能**明确排除**在 text2echart 项目范围之外：

- ❌ 不连接数据库实时查询
- ❌ 不做 GIF/视频/动画输出
- ❌ 不提供图表在线托管服务
- ❌ 不支持 3D 图表（ECharts GL）
- ❌ 不替代用户的参考 HTML（那是独立的前端工具）
- ❌ 不支持实时流式数据更新
- ❌ 不支持地图/GIS 数据可视化
- ❌ 不提供 REST API 服务

---

## 5. 质量标准

### 5.1 代码质量

- 函数圈复杂度 ≤ 10（NASA JPL 规则 #7）
- 单个函数 ≤ 50 行（超过时提取子函数）
- 所有公共函数至少 2 个断言（前置条件 + 后置条件；NASA JPL 规则 #3）
- 变量/函数命名自文档化（无需注释即可理解用途）
- 编译/执行零警告

### 5.2 输出质量

- 生成的 HTML 通过 W3C 验证（或仅有 ECharts 已知的良性警告）
- 图表在各种屏幕尺寸下正常渲染（320px - 2560px 宽度）
- 6 种主题全部可用且视觉上有明显区分
- `--embed` 模式生成的 HTML ≤ 1.5MB

### 5.3 测试标准

- 6 种图表类型（bar/line/pie/scatter/radar/wordcloud）各至少 1 个回归测试用例
- `node test/test-all.js` 全部通过方可发布
- 新增图表类型需同步新增测试用例

---

## 6. 治理

### 6.1 修订流程

1. 任何人可提议修订宪章（通过 PR 或 issue）
2. 修订需经项目维护者审核
3. 修订后版本号递增（MAJOR.MINOR）
4. 修订记录追加到本文末尾

### 6.2 冲突解决

- 宪章 > spec > design > code
- 代码与宪章冲突 → 修改代码
- spec 与宪章冲突 → 修改 spec
- 两个原则冲突 → 按编号优先级（原则 1 最高）
- 无法裁决的冲突 → 提交项目维护者决策，决策记录到 `docs/journey.md`

### 6.3 合规检查

- 每次 code review 必须检查宪章合规性
- 每次 delta 审计必须执行宪章一致性检查
- 发现违反核心原则的代码 → 🔴 阻塞，不得合并

---

## 修订记录

| 版本 | 日期 | 修订人 | 变更说明 |
|------|------|--------|---------|
| v1.0 | 2026-06-10 | coder | 初始宪章——定义 5 项核心原则、技术约束、非目标、质量标准、治理规则 |
