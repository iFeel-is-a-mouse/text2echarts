# text2echart 会话优化总结

> 2026-06-12 会话，iFeel + iClaw

## 核心经验

### 1. HTML 源码直出 > 发文件/截图

**问题**：生成图表后发 `.html` 文件或截图，用户需要下载、打开，多一步操作。

**方案**：直接在聊天中贴 `html` 代码块。用户复制 → 保存为 `.html` → 浏览器打开，一气呵成。文件/截图只在用户明确要求时使用。

**落地**：
- 记入 `TOOLS.md` 图表/HTML 展示偏好
- text2echart SKILL.md 默认路由已是"输出 HTML string"
- 调用方（iClaw）优先 `html` 代码块展示

### 2. 词云配色不能靠运气

**问题**：wordcloud 的 `textStyle.color` 如果不设置，ECharts 深色主题下文字可能是默认黑色 → 完全不可见。

**方案**：CLI 自动检测 wordcloud 系列，若 `textStyle.color` 未提供，注入随机鲜艳配色函数。

**关键坑**：`JSON.stringify` 会把函数变成字符串，ECharts 不认。必须用 **marker 替换模式**：
1. 先设置 `color: "__WC_COLOR_FN__"`（字符串 marker）
2. `JSON.stringify` 后，正则替换 `"__WC_COLOR_FN__"` → 实际函数体

```js
// 正确做法
s.textStyle.color = '__WC_COLOR_FN__';       // step 1
optStr = optStr.replace(/"__WC_COLOR_FN__"/g, 'function(){...}'); // step 2
```

### 3. 截图工具链要区分错误类型

**问题**：`--screenshot` 失败时只报"需要安装 playwright"，实际可能：
- playwright npm 包没装 → `MODULE_NOT_FOUND`
- chromium 浏览器没装 → `ENOENT` 在可执行路径
- 网络/CDN 超时 → `TimeoutError`

**方案**：分离 `loadPlaywright()` 和实际截图逻辑，每个环节独立报错+给出精确修复命令。

```js
// 分离检测
function loadPlaywright() {
  try { return require('playwright'); }
  catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') { /* 提示 npm install */ }
    else { /* 提示其他错误 */ }
    return null;
  }
}
```

### 4. page.goto 的 waitUntil 陷阱

**问题**：`file://` 协议 + CDN 外部脚本时，`waitUntil: 'load'` 或 `'networkidle'` 经常超时。

**方案**：去掉 `waitUntil` 约束，用 `waitForTimeout(3000)` 给足渲染时间。`.catch(() => {})` 兜底，不阻塞流程。

```js
// 之前：超时即死
await page.goto('file://' + html, {waitUntil: 'load', timeout: 15000});

// 之后：宽容等待
await page.goto('file://' + html, {timeout: 10000}).catch(() => {});
await page.waitForTimeout(3000);
```

### 5. 模板不要硬编码样式

**问题**：`makeHTML()` 里 chart div 硬编码 `background:#fff; box-shadow:...`，直接覆盖用户 JSON 里的 `backgroundColor`，深色图表效果全毁。

**方案**：chart div 只保留布局属性（width/height），视觉属性交给 ECharts option 的 `backgroundColor` 控制。

```css
/* 之前 */
#chart{...;background:#fff;box-shadow:...}

/* 之后 */
#chart{width:800px;height:500px;border-radius:12px}
```

### 6. 依赖管理不能靠"零依赖"硬撑

**问题**：截图/SVG输出功能依赖 Playwright，但项目没有 `package.json`，用户装依赖全靠猜。

**方案**：加 `package.json`，Playwright 放 `optionalDependencies`（不影响纯 HTML 生成用户）。

```json
{
  "optionalDependencies": {
    "playwright": "^1.50.0"
  }
}
```

## 改动清单

| 文件 | 改动 |
|------|------|
| `cli.js` | ① chart div 去硬编码背景 ② 分离 loadPlaywright ③ goto 去掉 waitUntil ④ wordcloud 自动注入配色 ⑤ marker 替换模式 |
| `package.json` | 新建，声明 playwright optionalDependency |
| `TOOLS.md` | 新增"图表/HTML 展示偏好"段落 |
| `SKILL.md` | 无需改（默认路由已正确） |

## 数据流全景

```
用户提供数据 (JSON/CSV)
  │
  ▼
cli.js 解析
  ├─ 检测 wordcloud → auto inject color marker
  ├─ JSON.stringify (marker survives)
  ├─ replace marker → real function
  └─ makeHTML()
      ├─ CDN 模式：echarts + wordcloud CDN + 主题 CDN
      └─ embed 模式：本地 lib/
  │
  ▼
输出 .html (CDN ~1KB / embed ~1MB)
  │
  ├─ --screenshot → playwright chromium → .png
  ├─ --svg-output → playwright chromium → .svg
  └─ default → iClaw 直接贴 html 代码块
```
