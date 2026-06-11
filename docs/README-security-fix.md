# text2echart v2.0.5 安全修复总结

**修复日期**: 2026-06-11
**版本**: v2.0.4 → v2.0.5
**修复类型**: 安全漏洞修复 + 功能增强

---

## 原始安全问题

外部安全审计（clawscan / skillspector / static-analysis）发现：

| 问题ID | 严重程度 | 描述 |
|--------|---------|------|
| SDI-2 | CRITICAL | `static/app.js` 中 `new Function()` 执行任意代码（3处） |
| SDI-4 | HIGH | UI 未披露代码执行行为 |
| SQP-1 | MEDIUM | 触发关键词过宽（html/web/page） |
| SQP-2 | MEDIUM | blur 事件触发代码执行 |
| cli.js | CRITICAL | `child_process.execSync` 命令注入 |

---

## 修复内容

### 1. 移除动态代码执行（static/app.js）
- 删除 `new Function()` 所有调用
- 删除 `transformObject()` 函数字符串转换逻辑
- 改为纯深拷贝实现

### 2. 移除 unsafe shell 执行（cli.js）
- 删除 `child_process.execSync`
- `--open` 改为提示用户手动打开

### 3. 收窄触发关键词（SKILL.md）
- 移除 `html`, `web`, `page`, `源码`, `页面`
- 保留图表相关明确触发词

### 4. 清理模板函数字符串（templates.js / templates-en.js）
- 将 `function (params) {...}` 改为纯 JSON 值
- 将 JS 代码字符串改为纯 JSON 对象

### 5. 安全恢复 Variable Assignment（变更 #1）
- 恢复 UI 输入框
- 改为 `JSON.parse()` 纯解析（无代码执行）
- 新增 `resolveTemplates()` 模板替换：`${publicVar.x}` → 值
- 新增 `safeEval()` 安全表达式解析器：
  - 白名单字符过滤
  - 拒绝函数调用
  - 支持 `+ - * / %` 和变量引用

---

## 安全验证

| 检查项 | 结果 |
|--------|------|
| `new Function` | ✅ 0 matches（排除注释） |
| `eval(` | ✅ 0 matches |
| `Function(` | ✅ 0 matches |
| `child_process` | ✅ 0 matches |
| `execSync` | ✅ 0 matches |
| 攻击向量测试 | ✅ 全部拒绝（alert/require/eval） |
| Auditor 裁决 | ✅ **CLEAN** |

---

## 功能验证

| 功能 | 结果 |
|------|------|
| 图表渲染（bar/line/pie/wordcloud） | ✅ |
| 导出（PNG/JPG/SVG/JSON） | ✅ |
| 主题切换 | ✅ |
| CLI 生成 HTML | ✅ |
| CLI 生成 SVG | ✅ |
| Variable Assignment（JSON） | ✅ |
| 模板替换 `${publicVar.x}` | ✅ |
| 安全表达式计算 | ✅ |

---

## Git 提交记录

```
f78da2e fix: clean templates — remove function strings, use pure JSON (v2.0.5)
98a3586 变更#1: 恢复Variable Assignment功能 — 安全实现
e73c606 security: remove dynamic code execution and unsafe shell exec (v2.0.5)
```

---

## 文件变更

| 文件 | 变更 |
|------|------|
| `static/app.js` | 移除 new Function，新增 safeEval + resolveTemplates |
| `cli.js` | 移除 child_process.execSync |
| `SKILL.md` | 收窄触发关键词 |
| `text2echarts.html` | 恢复 Variable Assignment UI，更新说明 |
| `static/templates.js` | 清理函数字符串为纯 JSON |
| `static/templates-en.js` | 清理函数字符串为纯 JSON |
| `docs/spec.md` | 新增（规格说明） |
| `docs/style-guide.md` | 新增（安全红线） |
| `docs/test-report.md` | 新增（测试报告） |
| `docs/checklist.md` | 新增（审计清单） |
| `docs/todo.md` | 新增（任务追踪） |
| `docs/journey.md` | 新增（过程日志） |

---

## 结论

所有 CRITICAL/HIGH 安全问题已彻底修复。Variable Assignment 功能已安全恢复。通过安全审计（CLEAN）。
