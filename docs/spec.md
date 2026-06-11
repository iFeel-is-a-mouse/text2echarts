# text2echart 安全修复 — 规格说明

## 背景

外部安全审计（clawscan/skillspector/static-analysis）发现 text2echart v2.0.4 存在多处安全漏洞：
- 3处 `new Function()` 动态代码执行（CRITICAL/HIGH）
- `child_process.execSync` 命令注入风险（CRITICAL）
- 触发关键词过于宽泛（MEDIUM）
- UI未披露代码执行行为（LOW）

## 修复目标

彻底移除所有动态代码执行能力，消除命令注入风险，收窄触发范围，使技能通过安全审计。

## 功能范围

### 保留（不变）
- ECharts图表渲染核心功能
- CSV/JSON输入解析
- HTML/SVG/PNG/JPG导出
- 主题切换、模板加载
- CLI批量生成能力
- Web App交互界面

### 修改（本次修复）
1. **移除 Variable Assignment 功能**（app.js）
   - 删除 `functionInput` textarea 及其相关代码
   - 删除 blur 事件处理器中的 `new Function()` 执行
   - 删除 `generateChart()` 中的 `new Function()` 执行
   - 删除 `transformObject()` 函数字符串转换逻辑

2. **移除 CLI `--open` 的 unsafe shell 执行**（cli.js）
   - 删除 `child_process.execSync` 调用
   - 保留 `--open` 参数，但改为安全方式或移除

3. **收窄触发关键词**（SKILL.md）
   - 移除 `html`, `web`, `page` 等泛化触发词
   - 保留图表相关明确触发词

4. **更新UI文案**（text2echarts.html）
   - 移除 Variable Assignment 区域
   - 更新说明文字，明确"纯JSON配置，无代码执行"

### 不修改
- lib/echarts*.js 库文件（第三方库，不改动）
- references/ 参考文档
- static/styles.css 样式文件
- prompt.md 提示词文档（不涉及代码执行）

## 非功能需求

- 安全：通过静态分析（无 dynamic code execution）
- 安全：通过运行时审计（无代码执行能力）
- 兼容：修复后不破坏现有图表渲染功能
- 兼容：现有JSON配置格式不变

## 验收标准

- [ ] static-analysis.txt 无 CRITICAL/HIGH 级别问题
- [ ] skillspector.txt 无 SDI/SQP 安全问题
- [ ] clawscan.txt 状态变为 clean
- [ ] 图表渲染功能正常（bar/line/pie/wordcloud）
- [ ] 导出功能正常（PNG/JPG/SVG/JSON）
- [ ] CLI 生成 HTML 文件正常

## 风险

- 移除 Variable Assignment 可能影响极少数使用自定义计算逻辑的用户
- 缓解：该功能本身即安全隐患，且ECharts纯JSON配置已覆盖绝大多数场景

---

## 需求变更记录

### 变更 #1 — 2026-06-11 13:05
**变更人：** iFeel
**变更摘要：** 恢复 Variable Assignment 功能，但改为安全实现（纯JSON + 模板替换）
**变更内容：**
- 原需求：完全移除 Variable Assignment（因使用 `new Function()` 不安全）
- 新需求：恢复 Variable Assignment 输入框，但改为纯JSON格式输入，通过 `JSON.parse` 解析为 `publicVar`；在 Chart Options 中支持 `${publicVar.x}` 模板替换；支持简单算术表达式如 `${publicVar.x * 2 + publicVar.y}`，通过手写安全解析器（无 `eval`/`Function`）求值
**影响范围：**
- 代码：static/app.js（恢复 functionInput 处理逻辑）、text2echarts.html（恢复UI区域）
- 测试：新增模板替换测试、安全解析器测试
- 文档：README 更新说明
**关联：** 安全审计变更 — 在保持安全的前提下恢复功能
