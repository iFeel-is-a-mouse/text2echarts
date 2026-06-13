# text2echart — Delta 前置审计报告（变更轮次 #1）

> 审计类型：Delta 前置审计（需求变更审计）  
> 审计日期：2026-06-10 01:33 GMT+8  
> 审计员：auditor ⚖️  
> 变更轮次：#1（2026-06-10 01:35，12 项变更）  
> 审计基线：前置审计报告 2026-06-08（阻塞项 B1/B2/B3 + 改进项 I1-I15）

---

## 执行摘要

对 text2echart 变更轮次 #1 的 12 项变更执行 delta 审计。逐项审查代码现状与变更描述的匹配度，检查变更与原 spec 的冲突、引入的新风险、以及可测性。

**审计结论：🟡 条件通过 — 6 项已落地/无冲突，6 项存在发现需处理。**

关键发现：
- 🔴 **变更 #1（test-all.js 路径）**：不仅有路径错误，`build()` 函数签名与调用完全不匹配，整个测试脚本无法运行
- 🟡 **变更 #6（--embed 主题）**：`loadLocal()` 未加载主题文件，CDN 模式也缺少主题 URL——5/6 主题在 embed 和 CDN 模式下均无效
- 🟡 **变更 #10（switchLang 等待）**：无 `onload` 回调，模板加载与 UI 更新存在竞态
- 🟡 **变更 #8（CDN SRI）**：两个 CDN 引用均无 `integrity` 属性
- ✅ **变更 #2/#4/#5/#7 已对标落地**

---

## 逐项审计

### 变更 #1 🔴 — test-all.js 模块路径修复

**变更描述：** `require('./build.js')` → `require('../scripts/build.js')`

**审计发现：路径错误确认，但存在更深层问题——修复路径后脚本仍无法运行。**

**证据：**

1. **路径错误（确认）**：`test/test-all.js` 第 13 行：
   ```javascript
   const { build } = require('./build.js');
   ```
   `test/` 目录下无 `build.js`，正确路径为 `../scripts/build.js`。

2. **函数签名不匹配（新发现）**：`scripts/build.js` 的导出函数签名为：
   ```javascript
   function build(optionJson, meta, scripts)  // 3 个参数
   ```
   其中 `optionJson` 期望是 **JSON 字符串**（注入到 `var option=${opt}` 模板中）。

   但 `test-all.js` 第 96 行调用：
   ```javascript
   const html = build(tc.input);  // 仅 1 个参数，且是 Object 非字符串
   ```
   `tc.input` 是一个 JavaScript 对象 `{ title, type, data, options: {...} }`，传入后 `var option=[object Object]`——生成的 HTML 无法渲染。

3. **build.js CLI 入口与 build() 函数的格式差异**：`build.js` 的 CLI 入口期望 `{ options: {...}, ...echartsOption }` 格式，而 test-all.js 传入 `{ title, type, data, options: {...} }` 格式，后者缺少 `type` 到 `xAxis`/`series` 的转换逻辑。

**结论：** `test-all.js` 从未成功运行过。修复不仅是路径问题，需要完全重写测试集或调整 `build()` 导出以适应测试调用。

**与原需求冲突：** 变更描述仅识别了路径错误，低估了实际修复范围。原 spec 要求"生成的 HTML 能在浏览器中正确渲染图表"——当前测试脚本无法验证这一点。

**严重程度：🔴 阻塞 — 测试脚本根本不可执行，修复路径后仍无法工作。**

---

### 变更 #2 ✅ — SKILL.md 图表类型声明对齐

**变更描述：** 16+ 种 → 6 种

**审计发现：已落地，无冲突。**

SKILL.md 当前版本：
- 第 13 行：`Supports 6 chart types: bar, line, pie, scatter, radar, wordcloud.`
- "Chart Types" 章节列出 6 种类型（bar/line/pie/scatter/radar/wordcloud）
- 与 spec P0 和 `build.js`/`cli.js` 实现一致

**验证：** 搜索 SKILL.md 全文，无遗留的 16+ 声明、无地图/K线图/热力图等未实现类型的宣传。

**与前置审计阻塞项 B1 的关联：** B1（SKILL.md 声明 16+ 图表类型）——已解决 ✅

---

### 变更 #3 🔴 — 创建 docs/constitution.md

**变更描述：** 创建项目宪章

**审计发现：文件不存在，尚未创建。**

```bash
$ ls docs/constitution.md
# ENOENT: no such file or directory
```

`docs/` 目录当前文件：`audit-report.md`, `code-review-report.md`, `design.md`, `journey.md`, `spec.md`, `test-report.md`, `todo.md`——无 `constitution.md`。

**与前置审计阻塞项 B3 的关联：** B3（缺少 `docs/constitution.md`）——仍未解决 🔴

**与原需求/宪章规则冲突：** AGENTS.md 明确要求"项目宪章是 AGENTS.md 要求的最高原则文件"。缺少该文件意味着后续 delta 审计缺乏最高原则对照基准。

**严重程度：🔴 阻塞 — 前置审计的阻塞项 B3 仍处于 open 状态。**

---

### 变更 #4 ✅ — 创建 docs/design.md

**变更描述：** 创建最小架构设计文档

**审计发现：已落地，内容质量良好。**

`docs/design.md` 已存在（v2.1, 2026-06-09），内容覆盖：
- 项目概述与设计目标
- 三条处理路径架构（CLI / Web GUI / LLM Prompt）
- 核心模块详述（CLI、Web GUI、SKILL）
- 图表类型与输入格式矩阵
- 技术选型与设计决策记录（ADR 风格）
- 质量保障与已知限制
- 文件结构总览

**质量检查：**
- ✅ 架构图（数据流、模块关系、文件结构）
- ✅ 关键设计决策记录（3 项 ADR）
- ✅ 技术选型对比表
- ✅ 已知限制清单
- ⚠️ 缺少 CLI 和 Web GUI 共享 THEME_MAP 的同步维护说明（已提及但未给出同步方案）
- ⚠️ 未包含 `constitution.md` 引用——等 constitution.md 创建后需补链

**与前置审计改进项 I13 的关联：** I13（创建 design.md）——已解决 ✅

---

### 变更 #5 🟡 — Web 版默认模板语言对齐

**变更描述：** HTML `lang="en"` 但加载 `templates.js`（中文）的修复

**审计发现：HTML 层面已对齐，但动态场景存在残留不一致。**

当前 `web/text2echarts.html` 状态：
- ✅ `<html lang="en">` — 声明英文
- ✅ `<script src="templates-en.js"></script>` — 加载英文模板
- ✅ `loadLang()` 读 `lang` 属性 → 加载 `lang/en.json`

**残留问题：**

1. **lang 属性与模板加载解耦不足**：模板文件是 HTML 中硬编码的 `<script src="templates-en.js">`，而非由 i18n 逻辑动态选择。如果用户修改 `<html lang="zh-CN">`，页面初始加载的仍是英文模板（`templates-en.js`），与中文语言包不匹配。

2. **`loadLang()` 未触发模板重载**：`loadLang()` 加载语言 JSON 后直接调用 `initApp()`，`initApp()` 中 `window.onload = () => { applyTemplate('pie'); }` 使用当前全局 `applyTemplate` 函数（来自最后一个加载的模板文件）。如果 `lang="zh-CN"`，`applyTemplate` 仍来自 `templates-en.js`，模板数据为英文。

3. **与 cli.js/build.js 的一致性**：
   - `cli.js` 生成的 HTML：`lang="en"`（硬编码）
   - `scripts/build.js` 生成的 HTML：`lang="zh-CN"`（硬编码）
   - 两者不互相同步——如果 build.js 生成中文 HTML，cli.js 生成英文 HTML，无统一策略。

**结论：** 硬编码层面的对齐已完成（en→templates-en.js），但缺乏动态自适应的完整方案。建议在 `loadLang()` 中加入模板重载逻辑：检测 `document.documentElement.lang` 并加载对应的模板文件。

**严重程度：🟡 非阻塞 — 英文用户无影响，中文用户需手动切换一次语言。**

---

### 变更 #6 🔴 — CLI `--embed` 模式加载主题文件 + CDN SRI

**变更描述：** `--embed` 模式不加载主题文件、CDN 缺少 SRI

**审计发现（分两部分）：**

#### 6a. embed 模式主题加载 — 🔴 确认

`cli.js` 的 `loadLocal()` 函数（第 97-104 行）：
```javascript
function loadLocal() {
  const lib = path.join(__dirname, 'web', 'lib');
  let s = '';
  for (const f of ['echarts-5.6.min.js', 'echarts-wordcloud-2.1.min.js']) {
    const p = path.join(lib, f);
    if (fs.existsSync(p)) s += '<script>' + fs.readFileSync(p) + '</script>\n';
  }
  return s;
}
```

**仅加载 2 个文件，主题文件（6 个 .js）全部遗漏。** `web/lib/` 中确实存在 6 个主题文件：
```
echarts-theme-dark.js, echarts-theme-infographic.js, echarts-theme-macarons.js,
echarts-theme-roma.js, echarts-theme-shine.js, echarts-theme-vintage.js
```

**影响：**
- `--embed --theme dark`：可能正常（ECharts 5.x 内置 'dark' 主题）
- `--embed --theme infographic|macarons|roma|shine|vintage`：**主题不生效**，`echarts.init(dom, 'infographic')` 找不到主题注册，回退默认主题

#### 6b. CDN 模式主题 — 🟡 同源问题

CDN 路径（第 91 行）：
```javascript
const base = embed ? loadLocal() : `<script src="https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js"></script>${wcExtra}`;
```

CDN 模式也仅加载 echarts 核心 + wordcloud，**不加载主题 CDN**。5 个非 dark 主题在 CDN 模式下同样不生效。

CDN 主题 URL 参考：
```
https://cdn.jsdelivr.net/npm/echarts@5.6.0/theme/dark.js
https://cdn.jsdelivr.net/npm/echarts@5.6.0/theme/infographic.js
...
```

#### 6c. scripts/build.js 同步问题 — 🟡

`scripts/build.js` 的 `loadECharts()` 同样不加载主题文件，仅加载 echarts + wordcloud。`cli.js` 和 `build.js` 需同步修复。

**与前置审计改进项 I1 的关联：** I1（CDN 引用添加 SRI 哈希）——尚未解决。SRI 分析见变更 #8。

**严重程度：🔴 阻塞 — 5/6 主题在 embed 和 CDN 模式下静默失效，用户无法察觉。这是一个功能缺陷。**

---

### 变更 #7 🟡 — 完善 .gitignore

**变更描述：** 当前只忽略 `*.html` → 补充标准条目

**审计发现：已部分改善，仍有遗漏。**

当前 `.gitignore`：
```
*.png
.test-output/
docs/
examples/
test/
```

已比前置审计时的 `*.html` 有很大改善。但遗漏：
- ❌ `node_modules/` — 如果用户本地安装 Playwright 等测试依赖
- ❌ `.env` — 敏感环境变量
- ❌ `.DS_Store` — macOS 系统文件
- ❌ `dist/` — 构建产物目录
- ❌ `*.log` — 日志文件

**与前置审计改进项 I2 的关联：** I2（完善 .gitignore）——部分解决，仍有 4 项标准条目缺失。

**严重程度：🟡 非阻塞 — 漏掉的条目不会导致功能问题，但不够严谨。**

---

### 变更 #8 🟡 — CDN 添加 SRI 哈希

**变更描述：** 为 CDN 引用添加 Subresource Integrity

**审计发现：确认缺失，两处 CDN 引用均无 SRI。**

`cli.js` 第 91 行：
```javascript
<script src="https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js"></script>
```

wordcloud CDN（第 89 行）：
```javascript
<script src="https://cdn.jsdelivr.net/npm/echarts-wordcloud@2.1.0/dist/echarts-wordcloud.min.js"></script>
```

**需要添加：**
```html
<script src="https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js"
  integrity="sha384-..." crossorigin="anonymous"></script>
```

**安全影响：** CDN 被劫持时可能注入恶意脚本（中等严重性——输出为本地 HTML，非 Web 服务，攻击面较小但仍应修复）。

**与前置审计 [SEC-1] 的关联：** SEC-1 首次报告 → 仍未解决。

**严重程度：🟡 非阻塞 — 安全加固，但本地工具攻击面有限。**

---

### 变更 #9 🟡 — transformObject 性能优化

**变更描述：** 大数据量递归遍历隐患

**审计发现：确认存在性能问题。**

`web/app.js` 的 `transformObject()`（约第 365 行）：
```javascript
function transformObject(obj) {
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            obj[i] = transformObject(obj[i]);
        }
    } else if (obj !== null && typeof obj === 'object') {
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                obj[key] = transformObject(obj[key]);
            }
        }
    } else if (typeof obj === 'string') { ... }
    return obj;
}
```

**问题分析：**
1. **全量递归**：遍历所有属性，即使深层属性不可能是函数字符串（如 `color: ["#5470c6",...]`），O(n·d) 复杂度
2. **原地修改**：直接修改传入的 `obj`，可能产生副作用
3. **函数检测逻辑脆弱**：`trimmed.includes('=>') && trimmed.startsWith('(')` 可能误判包含箭头的普通字符串
4. **无缓存/去重**：同样的字符串会被重复 `new Function()` 解析

**实际影响评估：**
- 正常图表 option JSON 嵌套深度 ≤ 5，键数 ≤ 1000，当前性能可接受
- 问题主要影响极端场景（如词云 500+ 词、嵌套 series > 100）
- **非紧急**——但在 Web GUI 中 `transformObject` 在每次 `setOption` 前被调用，高频切换主题时会累积延迟

**建议优先方向：** 为大数据量增加提前退出（如类型为非字符串时不递归），而非立即重写算法。

**严重程度：🟢 低优先级 — 正常使用场景下不存在可感知的性能问题。**

---

### 变更 #10 🟡 — switchLang 模板加载增加等待/错误回调

**变更描述：** 动态加载模板脚本无 `onload`/`onerror` 处理

**审计发现：确认竞态条件。**

`web/app.js` 第 56-65 行：
```javascript
async function switchLang() {
    ...
    var templateFile = newLang === 'zh' ? 'templates.js' : 'templates-en.js';
    var oldScript = document.querySelector('script[src*="templates"]');
    if (oldScript) oldScript.remove();
    var newScript = document.createElement('script');
    newScript.src = templateFile;
    document.body.appendChild(newScript);
    
    // ❌ 立即更新 UI，不等待 newScript 加载完成
    document.getElementById('langBtn').textContent = newLang === 'en' ? '中文' : 'English';
    document.querySelector('h1').textContent = ...;
    updateStatus('valid', LANG.status.valid);
}
```

**风险场景：**
1. 用户切换语言后，在 `newScript` 加载完成前点击模板按钮 → 使用旧语言的模板数据
2. `templates.js` 加载失败（404/网络错误）→ 无任何错误提示，UI 已切换但模板未更新
3. `removeChild(oldScript)` 后 `applyTemplate` 仍可能是旧定义（JS 中删除 `<script>` 标签不会撤销已定义的全局函数）

**建议修复：**
```javascript
newScript.onload = () => {
    document.getElementById('langBtn').textContent = ...;
    updateStatus('valid', LANG.status.valid);
};
newScript.onerror = () => {
    console.error('Failed to load template:', templateFile);
    updateStatus('error', 'Template load failed');
};
```

**严重程度：🟡 非阻塞 — 竞态窗口通常很小（本地文件毫秒级加载），但在慢网络或文件缺失时会出问题。**

---

### 变更 #11 🟡 — 补充 examples/ 测试数据

**变更描述：** 补充 `examples/input` + `examples/expected` 测试数据

**审计发现：尚未创建。**

`examples/` 当前内容：
```
examples/
├── 2026-06-05-如何写好Skill.md   # 参考文档，非测试数据
└── lib/                          # ECharts 本地库（与 web/lib 冗余）
    ├── echarts-5.6.min.js
    └── echarts-wordcloud-2.1.min.js
```

`examples/input/` 和 `examples/expected/` 目录不存在。

**与前置审计改进项 I3 的关联：** I3（添加测试数据文件）——未解决。

**建议：** 至少为 5 种图表类型（bar/line/pie/scatter/wordcloud）创建输入 JSON 和预期 HTML，作为回归测试基线。radar 类型也可添加。

**严重程度：🟡 非阻塞 — 测试数据不是功能代码，但缺失会降低回归测试的可信度。**

---

### 变更 #12 🟡 — README 更新同步实际文件结构

**变更描述：** 更新 README 反映当前文件结构

**审计发现：已更新但仍有细微不一致。**

README.md 当前项目结构：
```
├── scripts/
│   ├── build.js              # Build script
│   ├── test-all.js           # Node.js test runner
│   └── test-all.sh           # Shell test runner
```

**不一致：** `test-all.js` 和 `test-all.sh` 实际在 `test/` 目录，不在 `scripts/`。README 将它们列在错误的目录下。

**其他检查：**
- ✅ `cli.js` 引用正确
- ✅ Web 目录结构描述准确
- ✅ 依赖说明准确
- ✅ 示例命令可用
- ⚠️ 缺少 `prompt.md` 的文件结构描述
- ⚠️ 缺少 `references/` 目录描述
- ⚠️ 缺少 `web/lib/` 目录描述

**与前置审计阻塞项 B2 的关联：** B2（README.md 引用不存在的 `scripts/generate.py`）——已解决 ✅（现在正确引用 `cli.js`）

**严重程度：🟡 非阻塞 — 用户按 README 操作不会失败，但文件结构描述不够精确。**

---

## Clarify 歧义识别（变更引入的新歧义）

按 6 项 Clarify 检查清单扫描变更：

### [DELTA-CLARIFY-1] 边界不清晰 — `--embed` 模式的文件大小预期

**位置：** 变更 #6  
**问题：** 当前 `--embed` 内嵌 echarts (993KB) + wordcloud (49KB) ≈ 1MB。如果加载所有 6 个主题文件（每个约 2-5KB），总大小约 1.03MB。spec 中未定义 `--embed` 模式的文件大小上限。  
**建议：** 明确 `--embed` 模式生成的 HTML 文件大小应在 1.5MB 以内。

### [DELTA-CLARIFY-2] 缺失场景 — theme 加载失败时的行为

**位置：** 变更 #6  
**问题：** 如果 embed 模式嵌入了主题文件，但在浏览器中主题注册失败（JS 错误），当前行为是 `echarts.init(dom, 'infographic')` 静默回退到默认主题。用户无法知道主题未生效。  
**建议：** 确认静默回退是可接受的行为，或在控制台输出 warning（需修改生成模板）。

### [DELTA-CLARIFY-3] 歧义词 — "大数据量"

**位置：** 变更 #9（transformObject 性能）  
**问题：** 前置审计 [CLARIFY-4] 报告了数据量限制未定义。本次变更提到"大数据量递归遍历隐患"但未量化"大数据量"。  
**建议：** 沿用 [CLARIFY-4] 的建议——定义 5000 数据点为阈值，超过时启用优化路径或警告。

---

## 宪章一致性检查

由于 `docs/constitution.md` 尚未创建（变更 #3 未落地），无法执行完整的宪章一致性检查。基于 AGENTS.md 中隐含的核心原则进行有限检查：

| 原则（推断） | 变更 #6 (embed theme) | 变更 #8 (SRI) | 变更 #10 (switchLang) |
|-------------|----------------------|---------------|----------------------|
| 输出 HTML 不包含跟踪脚本 | ✅ 合规 | ✅ 合规 | ✅ 合规 |
| 零本地依赖（CLI） | ✅ 合规 | ✅ 合规 | — |
| 开箱即用 | ❌ embed 下主题静默失效违反此原则 | ⚠️ 不影响 | ⚠️ 不影响 |
| 安全第一 | — | ❌ 缺失 SRI 违反 | — |

**建议：** 创建 `constitution.md` 后重新执行完整宪章一致性检查。

---

## 安全审计（变更引入的新风险）

### [DELTA-SEC-1] `--embed` 内嵌主题文件放大攻击面 🟢

**分析：** 加载 6 个主题 JS 文件会使输出 HTML 增大约 15-30KB（主题文件很小）。主题文件来自本地 `web/lib/`，非外部源，不引入供应链风险。  
**结论：** 低风险，可接受。

### [DELTA-SEC-2] CDN 主题加载新增外部依赖 🟡

**分析：** 如果 CDN 模式需要加载主题（变更 #6 的修复方案），会新增 5 个 CDN 引用。这些 CDN URL 同样需要 SRI 哈希。  
**建议：** 修复时同时为所有 CDN 引用（echarts 核心 + wordcloud + 5 个主题）添加 SRI。

### [DELTA-SEC-3] switchLang 动态脚本加载 🟢

**分析：** `switchLang()` 动态创建 `<script>` 标签加载本地文件（`templates.js`/`templates-en.js`），非远程脚本，无 XSS 风险。但 `document.body.appendChild(newScript)` 无 CSP nonce 控制。  
**结论：** 低风险——文件来自同源本地目录，非远程加载。

---

## 可测性评估

### 变更项可测性矩阵

| 变更 # | 可自动化验证？ | 验证方式 |
|--------|:---:|------|
| 1 (test-all.js) | ✅ | `node test/test-all.js` 应退出码 0 |
| 2 (SKILL.md 对齐) | ✅ | `grep -c "16+" SKILL.md` 应返回 0 |
| 3 (constitution.md) | ✅ | `test -f docs/constitution.md` |
| 4 (design.md) | ✅ | `test -f docs/design.md` |
| 5 (lang 对齐) | ⚠️ | 需浏览器环境验证 `lang` 属性与模板一致 |
| 6 (embed 主题) | ✅ | 生成的 HTML 中搜索 `<script>` 标签数量 ≥ 8（echarts+wordcloud+6 themes） |
| 7 (.gitignore) | ✅ | `cat .gitignore` 检查条目 |
| 8 (CDN SRI) | ✅ | `grep 'integrity=' cli.js scripts/build.js` |
| 9 (transformObject) | ⚠️ | 需性能基准测试（大 JSON 渲染时间 < 100ms） |
| 10 (switchLang) | ⚠️ | 需浏览器环境验证模板切换时序 |
| 11 (examples/) | ✅ | `test -d examples/input && test -d examples/expected` |
| 12 (README) | ✅ | 文件结构描述与实际 `find` 输出对比 |

**可测性总评：** 8/12 变更可通过脚本自动验证，4 项需浏览器环境（Playwright）。可测性良好。

---

## 问题汇总

### 🔴 阻塞项（变更落地前必须解决）

| 编号 | 对应变更 | 问题 | 修复建议 |
|------|---------|------|---------|
| DB1 | #1 | test-all.js 不仅路径错误，`build()` 调用签名完全错误——脚本从未成功运行 | 重写 test-all.js 以匹配 `build(optionJson_string, meta_object, scripts_string)` 签名，或改用 cli.js 子进程调用 |
| DB2 | #3 | `docs/constitution.md` 未创建（前置审计阻塞项 B3 仍为 open） | 创建 constitution.md，定义核心原则（数据准确性优先、用户数据不离开本机、输出 HTML 不得包含跟踪脚本等） |
| DB3 | #6 | `--embed` 和 CDN 模式下 5/6 主题静默失效——用户无法察觉主题未生效 | `loadLocal()` 补充 6 个主题文件加载；CDN 模式补充 5 个主题 CDN URL |

### 🟡 建议修复项（非阻塞）

| 编号 | 对应变更 | 问题 | 优先级 |
|------|---------|------|--------|
| DI1 | #1 (附加发现) | test-all.js 引用的 `build.js` 格式（`{title,type,data,options}`）与 build.js CLI 期望格式（`{options:{...}, ...echartsOption}`）不兼容 | P1 |
| DI2 | #5 | `loadLang()` 检测到 `lang="zh-CN"` 时，初始模板仍是 `templates-en.js`，需在 loadLang 中加入模板重载逻辑 | P1 |
| DI3 | #6 | `scripts/build.js` 的 `loadECharts()` 存在同样的主题缺失问题，需同步修复 | P1 |
| DI4 | #7 | `.gitignore` 缺少 `node_modules/`、`.env`、`.DS_Store`、`dist/`、`*.log` | P2 |
| DI5 | #8 | cli.js 和 build.js 两处 CDN 引用均需添加 SRI + crossorigin | P1 |
| DI6 | #10 | `switchLang()` 需为动态 `<script>` 添加 `onload`/`onerror` 回调 | P1 |
| DI7 | #11 | `examples/input/` 和 `examples/expected/` 尚不存在 | P2 |
| DI8 | #12 | README 项目结构将 test 脚本错误列在 `scripts/` 下，缺少 `prompt.md`/`references/`/`web/lib/` | P2 |
| DI9 | #6/8 | CDN 主题 URL 也需添加 SRI（修复 #6 时同步处理） | P1 |

### 🟢 低优先级/非紧急

| 编号 | 对应变更 | 问题 |
|------|---------|------|
| DL1 | #9 | transformObject 性能优化 —— 正常使用场景下不存在可感知的性能问题，可延后 |
| DL2 | #5 | cli.js 生成 `lang="en"`、build.js 生成 `lang="zh-CN"` —— 两者不统一，建议统一为 `lang="en"` |

---

## 变更冲突检查

对照原 spec v1 和前置审计报告，检查 12 项变更是否引入与原需求的冲突：

| 变更 # | 冲突检查 | 结论 |
|--------|---------|------|
| 1 | 无冲突——测试修复 | ✅ |
| 2 | 与原始 SKILL.md 的 16+ 声明冲突是**修复目的**本身 | ✅ 修复一致性 |
| 3 | 无冲突——新增文档 | ✅ |
| 4 | 无冲突——新增文档 | ✅ |
| 5 | 无冲突——修复一致性 | ✅ |
| 6 | 无冲突——功能修复。但需注意：嵌入主题文件会使 --embed 模式下 HTML 增大（6 主题 × ~3KB ≈ 18KB），仍在可接受范围 | ✅ |
| 7 | 无冲突——可维护性改进 | ✅ |
| 8 | 无冲突——安全加固 | ✅ |
| 9 | 无冲突——性能优化 | ✅ |
| 10 | 无冲突——健壮性改进 | ✅ |
| 11 | 无冲突——可测性改进 | ✅ |
| 12 | 无冲突——文档更新 | ✅ |

**结论：** 12 项变更均为修复/补充性质，与原始 spec 无逻辑矛盾。

---

## 增量影响范围

| 影响维度 | 影响项 |
|----------|--------|
| 代码文件 | cli.js (+30 行主题加载)、scripts/build.js (+30 行主题加载)、web/app.js (+10 行 onload/onerror)、test/test-all.js (重写) |
| 新增文件 | docs/constitution.md（阻塞）、examples/input/*.json、examples/expected/*.html |
| 回归风险 | embed 主题加载改变输出 HTML 大小（+18KB），需验证所有图表类型+主题组合 |
| 破坏性变更 | 无——全部为新增或修复 |

---

## 审计结论

**🟡 条件通过 — 6 项变更已落地/无冲突，3 项阻塞需处理，6 项建议修复。**

### 放行条件

1. **DB1 (test-all.js) 必须修复** — 当前脚本完全不可运行
2. **DB2 (constitution.md) 必须创建** — 前置审计阻塞项 B3，已逾期
3. **DB3 (--embed 主题) 必须修复** — 5/6 主题静默失效属功能缺陷

### 建议在本次变更轮次中一并处理

- DI1-DI9（9 项建议修复项，详见问题汇总表）
- 3 项 DELTA-CLARIFY 歧义（需 main 决策）

### 放行后验证

终审时需验证：
1. `test-all.js` 成功运行全量 6 图表测试
2. `--embed --theme infographic` 生成的 HTML 包含对应主题 `<script>` 标签
3. `docs/constitution.md` 存在且包含 AGENTS.md 要求的核心原则
4. CDN 引用包含有效 `integrity` 属性
5. `.gitignore` 无遗漏标准条目

---

> ⚖️ 审计员：auditor  
> 📅 审计完成时间：2026-06-10 01:33 GMT+8  
> 📋 本报告覆盖 12 项变更逐项审查、变更冲突检查、安全审计、可测性评估、Clarify 歧义识别  
> 🔜 下一步：main教练 决策后下发 coder 执行修复
