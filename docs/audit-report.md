# text2echart — 前置审计报告

> 审计类型：前置审计 + Clarify 歧义识别  
> 审计日期：2026-06-08  
> 审计员：auditor ⚖️  
> 项目版本：spec v1  
> 审计文件：spec.md / SKILL.md / build.js / README.md / text2echart.html / 如何写好Skill.md

---

## 执行摘要

本次对 text2echart 项目执行前置审计（含 Clarify 歧义识别），共发现 **3 项关键问题**、**9 项歧义问题 [CLARIFY]**、**1 项安全发现 [SEC]**、**3 项可测性问题 [TEST]**、**6 项结构建议 [STRUCT]**。

**审计结论：🔴 不通过，需补充后重新审计。** 核心阻塞项：spec.md 与 SKILL.md 的图表类型数量不一致且 build.js 实现严重落后于声明；README.md 引用了不存在的脚本；项目缺少宪章文件。

---

## 一、完整性检查

### 1.1 spec.md 覆盖度

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 功能范围定义 | ✅ | P0/P1/P2 分层清晰 |
| 输入格式定义 | ⚠️ | 只定义了 JSON，未定义 CSV/自然语言的具体规范 |
| 输出格式定义 | ✅ | 自包含 HTML 文件 |
| 非功能需求 | ✅ | 零外部依赖、开箱即用、易于发布 |
| 不做什么 | ✅ | 明确排除数据库、GIF/视频、替代参考 HTML |
| 技术选型 | ✅ | JS/Node.js/模板注入 |
| 验收标准 | ⚠️ | 仅 3 条，面太窄（见 [CLARIFY-7]） |
| **错误处理** | ❌ | 未定义任何错误场景（无效输入、空数据、CDN 不可达） |
| **输入校验** | ❌ | 未定义数据校验规则 |
| **多系列图表** | ❌ | 未提及多系列/多数据集支持 |
| **性能边界** | ❌ | 未定义最大数据点数量 |
| **浏览器兼容** | ❌ | 未定义支持的浏览器和最低版本 |
| **访问性** | ❌ | 未涉及可访问性需求 |

### 1.2 spec.md 与 SKILL.md 一致性 🔴

| 维度 | spec.md | SKILL.md | build.js 实现 |
|------|---------|----------|--------------|
| 图表类型数量 | P0: 6 种 / P2: 可选更多 | **16+ 种** | **6 种**（bar/line/pie/scatter/radar/wordcloud） |
| 幻灯片模式 | P1 | 作为核心功能描述 | ✅ 已实现 SLIDE_TEMPLATE |
| 词云支持 | P1（依赖扩展） | 作为核心功能描述 | ✅ 已实现（含 echarts-wordcloud CDN） |
| 技术栈引用 | JS (Node.js) | Node.js + LLM 直接输出 | Node.js（CLI 脚本） |
| 触发关键词 | 无 | 10 个关键词 | N/A |

**🔴 关键发现：spec.md 与 SKILL.md 严重不一致。**
- SKILL.md 声明的 16+ 种图表类型中，有 10+ 种（地图、K线图、热力图、漏斗图、仪表盘、桑基图、关系图、矩形树图、旭日图、平行坐标、箱线图、主题河流图）在 spec.md 的 P2 中仅列为"可选"，且 **build.js 完全没有实现**。
- 这些图表类型在 SKILL.md 中被描述为已支持功能，但 LLM 收到该 Skill 后只会构造 option JSON——build.js 的 `buildOption()` 函数对这些类型的 `default` 分支直接返回原始 data，无法正确渲染。

### 1.3 README.md 一致性 🔴

README.md 引用 `python3 scripts/generate.py`，但实际脚本是 `scripts/build.js`（Node.js）。说明文档严重过期，用户按 README 操作会立即失败。

---

## 二、Clarify 歧义识别

按 6 项 Clarify 检查清单逐项扫描：

### [CLARIFY-1] 歧义词 — 主观判断词

**位置**：spec.md 目标章节  
**原文**：`"精美的 ECharts 可视化 HTML 文件"`  
**问题**："精美的" 是主观判断词，不可量化。  
**建议**：替换为可观测标准，如：`"包含标题、图例、工具栏、响应式布局的 ECharts 可视化 HTML 文件"`

### [CLARIFY-2] 歧义词 — "开箱即用"

**位置**：spec.md 非功能需求  
**原文**：`"开箱即用：任何浏览器打开即可渲染"`  
**问题**：需要网络加载 CDN 就不是真正的"开箱即用"（FAQ 中已承认）。  
**建议**：改为 `"在联网环境下，任何现代浏览器打开即可渲染"` 或提供离线版本选项。

### [CLARIFY-3] 歧义词 — "零外部依赖"

**位置**：spec.md 非功能需求  
**原文**：`"零外部依赖：输出的 HTML 唯一依赖是 ECharts CDN（网络加载）"`  
**问题**："零外部依赖" 与 "唯一依赖是 ECharts CDN" 自相矛盾。CDN 网络加载就是一个外部依赖。  
**建议**：改为 `"零本地依赖：输出为单个 HTML 文件，运行时仅需网络加载 ECharts CDN"`

### [CLARIFY-4] 边界不清晰 — 数据量限制

**位置**：spec.md 功能范围 / SKILL.md  
**问题**：未定义各图表类型的最大/最小数据点数量。FAQ 提到"数据点超过 5000 时建议使用大数据模式"，但这是 FAQ 而非规范要求，且未定义什么是"大数据模式"的具体行为。  
**建议**：在 spec 中明确：
- 最小数据点：1（单条数据应能正常渲染）
- 默认上限：5000 点（超过时自动启用 `large: true` 模式或警告）
- 词云最大词数：200

### [CLARIFY-5] 边界不清晰 — 空数据/无效输入行为

**位置**：spec.md 未定义  
**问题**：未定义以下场景的行为：
- `data: []`（空数组）→ 应该报错还是渲染空图表？
- `data: null` → 行为？
- 提供了不支持的图表类型 → 行为？
- JSON 格式错误 → 行为？
- 散点图数据被传入柱状图模板 → 行为？

**建议**：在 spec 中增加"错误处理"章节，定义所有异常输入的预期行为（报错信息格式、错误码等）。

### [CLARIFY-6] 矛盾 — 图表类型声明

**位置**：spec.md vs SKILL.md  
**原文**：
- spec.md P0: `"支持 6+ 种图表类型：柱状图、折线图、饼图、散点图、雷达图、词云"`
- spec.md P2: `"其他图表类型（地图、K线图、热力图等）"`
- SKILL.md: `"支持 16+ 种图表类型：柱状图、折线图、饼图、散点图、雷达图、词云、地图、K线图、热力图、漏斗图、仪表盘、桑基图、关系图、矩形树图、旭日图、平行坐标、箱线图、主题河流图"`

**问题**：P2 的可选功能在 SKILL.md 中被当作已交付的功能宣传。build.js 不支持这些类型。这是交付物与声明的严重不一致。  
**建议**：二选一：
- 方案 A：SKILL.md 降级声明为 6 种图表类型，与 spec P0 和 build.js 实现对齐
- 方案 B：在 build.js 中实现所有 16+ 种图表类型，升级 spec 到 P0

### [CLARIFY-7] 歧义的用户故事 — 验收标准

**位置**：spec.md 验收标准  
**原文**：`"clawhub publish . --slug text2echart 成功"`  
**问题**："成功" 未定义具体标准。发布成功 ≠ Skill 可用。  
**建议**：细化为可验证标准：
```
1. `clawhub publish . --slug text2echart` 返回退出码 0
2. 生成的 HTML 在 Chrome/Firefox/Safari 最新版中正确渲染
3. 6 种图表类型（bar/pie/line/scatter/radar/wordcloud）各有示例数据能输出有效 HTML
4. HTML 通过 W3C 验证器无错误
5. HTML 中无 console 错误
```

### [CLARIFY-8] 缺失场景 — 自然语言输入规范

**位置**：spec.md 功能范围第 2 条  
**原文**：`"自然语言（LLM 自动推理）"`  
**问题**："自动推理" 未定义推理逻辑。LLM 如何从"展示各部门销售额对比"决定用柱状图？如何提取数据？决策规则不透明。  
**建议**：补充推理规则（SKILL.md 中已有部分映射表，但应标注为"参考决策"而非"必须"），并给出推理失败时的回退策略（如"无法确定时默认使用柱状图并告知用户"）。

### [CLARIFY-9] 缺失场景 — 主题兼容性

**位置**：spec.md / SKILL.md  
**问题**：声明 6 种主题（dark/infographic/macarons/roma/shine/vintage），但未说明：
- 每种主题是否对所有图表类型都有效？
- 主题在幻灯片模式下是否正常工作（SLIDE_TEMPLATE 使用硬编码的 dark 背景）？
- 主题定制（自定义主题）是否支持？

---

## 三、安全性审计

### [SEC-1] CDN 资源完整性 🟡

**位置**：`build.js` 第 16-17 行  
**问题**：ECharts CDN 引用缺少 Subresource Integrity (SRI) 哈希：  
```html
<script src="https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/echarts-wordcloud@2.1.0/dist/echarts-wordcloud.min.js"></script>
```
CDN 被劫持时可能注入恶意脚本。  
**建议**：添加 `integrity` 属性和 `crossorigin="anonymous"`。

### [SEC-2] 模板注入风险 🟢

**位置**：`build.js` 第 36 行  
**分析**：`{{OPTION}}` 占位符由 `JSON.stringify(echartsOption, null, 2)` 填充。JSON.stringify 会转义特殊字符，注入 `</script>` 需要刻意构造（JSON 中字符串会被转义为 `<\/script>`），实际风险极低。  
**结论**：低风险，可接受。

### [SEC-3] `.gitignore` 不完整 🟡

**位置**：`.gitignore`  
**问题**：仅忽略 `*.html`，未忽略 `node_modules/`、`.env`、`.DS_Store`、`dist/` 等。  
**建议**：补充标准 Node.js 项目的 .gitignore 条目。

### [SEC-4] build.js 路径遍历 🟢

**位置**：`build.js` CLI 入口  
**分析**：`fs.readFileSync(inputFile, 'utf-8')` 和 `fs.writeFileSync(outputFile, html, 'utf-8')` 接受任意路径。但这是本地 CLI 工具，非 Web 服务，用户自己运行，路径遍历不构成安全威胁。  
**结论**：可接受。

---

## 四、可测性评估

### [TEST-1] 无测试数据 🟡

**位置**：`examples/` 目录  
**问题**：`examples/` 下仅有参考 HTML 文件和 Skill 编写指南，无任何测试用 JSON 数据文件，无预期输出的 HTML 文件。  
**建议**：为每种图表类型创建 `examples/input/bar.json`、`examples/input/pie.json` 等，以及对应的 `examples/expected/bar.html` 等用于回归测试。

### [TEST-2] 验收需手动浏览器操作 🔴

**位置**：spec.md 验收标准  
**问题**：验收标准"生成的 HTML 能在浏览器中正确渲染图表"依赖人工检查，无法自动化。  
**建议**：增加可自动化的验收方式，如：
- HTML 文件大小 > 0
- HTML 包含 `echarts.init` 调用
- Node.js 端用 jsdom + canvas 模拟渲染并检查无错误（如可行）

### [TEST-3] 无 CI/CD 管线 🟡

**位置**：项目根目录  
**问题**：无任何自动化测试配置（GitHub Actions、测试框架等）。  
**建议**：添加基本 CI，至少验证 `node scripts/build.js test_input.json` 能生成非空 HTML。

---

## 五、Skill 规范一致性（ClawHub 发布标准）

基于 Skill 编写最佳实践（如何写好Skill.md）逐项审查：

### 5.1 YAML 元数据

| 字段 | 状态 | 说明 |
|------|------|------|
| `name` | ✅ | `text2echart`，小写连字符分隔，符合规范 |
| `name-zh` | ✅ | 有中文名 |
| `description` | ✅ | 功能描述清晰，包含触发场景 |
| `provider` | ✅ | `openclaw` |
| `metadata.version` | ✅ | `1.0.0` |
| `metadata.vendor` | ✅ | `ma-team-dev` |
| `metadata.homepage` | ✅ | GitHub 链接 |
| `metadata.trigger-keywords` | ✅ | 10 个关键词，覆盖常见表述 |
| `metadata.tags` | ✅ | 6 个标签 |
| `license` | ⚠️ | 缺失（可选但建议添加） |

### 5.2 SKILL.md 正文质量

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 概述清晰 | ✅ | 做什么、不做什么 |
| 前置条件 | ⚠️ | 未独立成章，散落在依赖章节 |
| 执行流程 | ✅ | Step 1-4 清晰 |
| **Few-Shot 示例** | ⚠️ | 仅有数据→图表类型映射表，缺少完整的"输入JSON→输出HTML"端到端示例 |
| **Before/After 示例** | ❌ | 无输入+输出的成对对比 |
| 决策树/流程图 | ❌ | 图表类型选择缺少决策树 |
| 验证清单 | ❌ | 无验证清单，仅有一段验证命令 |
| 常见问题 | ✅ | 4 个 FAQ |
| **适用范围/排除项** | ⚠️ | "不做什么"存在但不够具体（未说明哪些数据格式不支持） |
| **安全注意事项** | ❌ | 无独立安全章节 |
| 篇幅 | ✅ | 约 220 行，在 500 行限制内 |
| 可视化表达 | ⚠️ | 有表格但无流程图 |
| 检查点 | ❌ | 步骤间无自检验证点 |

### 5.3 反模式检查

| 反模式 | 状态 | 说明 |
|--------|------|------|
| 大杂烩 Skill | ✅ | 专注一件事（数据→图表），未混杂无关功能 |
| Description 黑话 | ✅ | 用通用语言 + 技术关键词 |
| 没有示例 | ⚠️ | 示例不够——缺少完整输入端到端 Few-Shot |
| 没有验证点 | ❌ | 步骤间无检查点 |
| 写死数值 | N/A | 不适用（模板尺寸可配置） |
| 当 Wiki 写 | ✅ | 正文精简，背景信息未过度展开 |

---

## 六、项目结构建议

基于 Skill 最佳实践的推荐结构：

```
text2echart/
├── SKILL.md                    ✅ 已有
├── README.md                   ✅ 已有（需更新）
├── .gitignore                  ✅ 已有（需完善）
├── docs/
│   ├── spec.md                 ✅ 已有
│   ├── constitution.md         ❌ 缺失 — 项目宪章
│   ├── design.md               ❌ 缺失 — 架构设计
│   └── audit-report.md         ✅ 本报告
├── scripts/
│   └── build.js                ✅ 已有
├── examples/
│   ├── text2echart.html        ✅ 参考 HTML（不纳入 Skill）
│   ├── input/                  ❌ 建议 — 测试输入 JSON 文件
│   │   ├── bar.json
│   │   ├── pie.json
│   │   └── ...
│   └── expected/               ❌ 建议 — 预期输出 HTML
│       ├── bar.html
│       └── ...
├── references/                 ❌ 建议 — 参考文档
│   └── style-guide.md          ❌ 缺失 — 图表样式规范
└── evaluation/                 ❌ 建议 — 评估用例
    ├── trigger-cases.md
    └── quality-cases.md
```

### [STRUCT-1] 缺少 constitution.md 🔴

项目宪章是 AGENTS.md 要求的最高原则文件。建议创建 `docs/constitution.md`，定义：
- 核心原则（如：数据准确性优先于美观、用户数据不离开本机）
- 质量标准（如：所有图表类型必须可编程验证）
- 不可妥协项（如：输出的 HTML 不得包含跟踪脚本）

### [STRUCT-2] 缺少 design.md 🟡

建议创建 `docs/design.md` 描述：
- 架构概览（LLM 推理 → option JSON 构造 → HTML 模板注入）
- 组件间数据流
- 扩展新图表类型的接口规范

### [STRUCT-3] 缺少 style-guide.md 🟡

建议创建 `references/style-guide.md` 定义：
- 默认配色方案
- 字体大小和家族
- 图表间距和边距规范
- 6 种主题的详细色板

### [STRUCT-4] 缺少 CONTRIBUTING.md 🟢

如果开源且接受贡献，建议添加贡献指南。

### [STRUCT-5] README.md 需更新 🔴

README.md 引用 `python3 scripts/generate.py`（不存在）。必须修正为 `node scripts/build.js`。

### [STRUCT-6] .gitignore 需完善 🟡

当前仅忽略 `*.html`，建议增加：
```
node_modules/
.env
.DS_Store
dist/
*.log
```

---

## 七、build.js 代码审查（简要）

| 检查项 | 状态 | 发现 |
|--------|------|------|
| 结构清晰 | ✅ | `build()` + `buildOption()` 职责分明 |
| 模板注入安全 | ✅ | JSON.stringify 防注入 |
| 图表类型覆盖 | ❌ | 仅 6 种，缺少 10+ 种声明类型 |
| 默认 fallback | ⚠️ | `default` 分支直接返回 `data`，可能生成无效 option |
| 输入校验 | ❌ | 无 `input.type` 合法性检查，无 `input.data` 类型检查 |
| 错误处理 | ❌ | `JSON.parse` 失败时无友好错误信息 |
| 主题映射 | ⚠️ | `THEME_MAP` 中 `dark` 映射到 `', "dark"'`，但未说明为何带前导逗号 |
| 幻灯片模板 | ⚠️ | 硬编码 dark 背景，与 theme 参数不一致 |
| 透明度支持 | ✅ | 支持 `transparent_bg` 选项 |
| 自定义色板 | ✅ | 支持 `color` 选项 |

---

## 八、问题汇总

### 🔴 阻塞项（不放行）

| 编号 | 类别 | 问题 | 建议 |
|------|------|------|------|
| B1 | 一致性 | SKILL.md 声明 16+ 图表类型，spec P0 仅 6 种，build.js 仅实现 6 种 | 对齐三者：降级 SKILL.md 到 6 种或实现 16+ 种 |
| B2 | 一致性 | README.md 引用不存在的 `scripts/generate.py` | 修正为 `scripts/build.js` |
| B3 | 完整性 | 缺少 `docs/constitution.md` | 创建项目宪章 |

### 🟡 [CLARIFY] 需澄清项

| 编号 | 条目 | 简述 |
|------|------|------|
| C1 | 歧义词 | "精美的"→需量化 |
| C2 | 歧义词 | "开箱即用"→需明确前提条件 |
| C3 | 歧义词 | "零外部依赖"→与 CDN 依赖矛盾 |
| C4 | 边界 | 数据量限制未定义 |
| C5 | 边界 | 空数据/无效输入行为未定义 |
| C6 | 矛盾 | 图表类型声明不一致（同 B1） |
| C7 | 验收标准 | "成功"未量化 |
| C8 | 缺失场景 | 自然语言推理规则不透明 |
| C9 | 缺失场景 | 主题兼容性未验证 |

### 🟢 改进建议

| 编号 | 类别 | 建议 |
|------|------|------|
| I1 | 安全 | CDN 引用添加 SRI 哈希 |
| I2 | 安全 | 完善 .gitignore |
| I3 | 可测性 | 添加测试数据文件 |
| I4 | 可测性 | 添加自动化验收脚本 |
| I5 | Skill | 补充端到端 Few-Shot 示例（输入 JSON → 输出 HTML） |
| I6 | Skill | 添加图表类型选择决策树 |
| I7 | Skill | 添加验证清单和步骤间检查点 |
| I8 | Skill | 添加安全注意事项章节 |
| I9 | Skill | 补充 license 字段 |
| I10 | 代码 | build.js 添加输入校验和友好错误信息 |
| I11 | 代码 | 幻灯片模式尊重 theme 参数 |
| I12 | 代码 | default fallback 给出警告而非静默接受 |
| I13 | 结构 | 创建 design.md |
| I14 | 结构 | 创建 style-guide.md |
| I15 | 结构 | 创建 examples/input/ 和 examples/expected/ |

---

## 九、审计结论

**🔴 前置审计不通过。**

3 项阻塞问题（B1/B2/B3）需在 coder 开始实现前解决。9 项 Clarify 问题需 main教练 决策或补充 spec。

### 建议步骤

1. **main教练 决策**：图表类型范围定为 6 种还是 16+ 种？（影响 B1、C6）
2. **更新 spec.md**：补充错误处理、输入校验、性能边界章节，解决 C4/C5/C7/C8/C9
3. **更新 SKILL.md**：与 spec 对齐图表类型声明，补充 Few-Shot 示例、验证清单、决策树
4. **修正 README.md**：修正脚本路径
5. **创建 constitution.md**：定义项目核心原则和质量标准
6. **完善 build.js**：添加输入校验，扩展图表类型（如决策为 16+ 种）

完成后请 main教练 发起重新审计。

---

> ⚖️ 审计员：auditor  
> 📅 审计完成时间：2026-06-08 12:54 GMT+8  
> 📋 本报告已覆盖 Clarify 6 项检查、安全审计、可测性评估、Skill 规范一致性、项目结构建议  
> 🔜 下一步：等待 main教练 决策和补充后重新审计
