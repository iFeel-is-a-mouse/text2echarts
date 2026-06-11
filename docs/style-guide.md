# text2echart 安全修复 — 风格指南

## 技术栈
- 前端：原生 HTML + CSS + JavaScript（无框架）
- CLI：Node.js 原生 API（fs, path, os）
- 图表：Apache ECharts 5.6.0 + wordcloud 2.1

## 编码规范
- 使用单引号字符串（与现有代码风格一致）
- 缩进：4空格
- 变量：camelCase
- 函数：驼峰命名，动词开头
- 注释：中文项目，保留中英双语注释

## 安全红线（本次修复新增）
- ❌ 禁止任何形式的 `eval()` / `new Function()` / `Function()` 动态代码执行
- ❌ 禁止 `child_process.exec/execSync` 等shell命令执行
- ❌ 禁止将用户输入字符串转换为可执行代码
- ✅ 所有用户输入必须通过 JSON.parse 或纯文本处理，不执行

## 版本规范
- 本次修复：v2.0.4 → v2.0.5（PATCH：安全修复）
