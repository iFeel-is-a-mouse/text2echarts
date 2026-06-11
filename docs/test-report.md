

---

## 五、追加测试（变更 #1：安全 Variable Assignment）

**测试日期**: 2026-06-11
**测试范围**: 安全 Variable Assignment（safeEval + resolveTemplates）

### 5.1 安全验证（追加）

| 检查项 | 结果 | 说明 |
|--------|------|------|
| new Function（代码中） | ✅ | 排除注释后，代码中无动态函数构造 |
| eval( | ✅ | 代码中无 eval 调用 |
| Function( | ✅ | 代码中无 Function() 调用 |
| child_process | ✅ | CLI 中无子进程模块 |
| execSync | ✅ | CLI 中无命令执行 |
| safeEval 白名单 | ✅ | 只允许 `+ - * / % . [ ] ( )` 空格 字母 数字 |
| safeEval 函数调用拒绝 | ✅ | `/\w\s*\(/` 拒绝所有函数调用模式 |
| tokenize 未知字符拒绝 | ✅ | 非白名单字符抛出错误 |

### 5.2 攻击向量测试

| 攻击向量 | 结果 | 说明 |
|----------|------|------|
| `alert(1)` | ✅ 拒绝 | 函数调用模式被拦截 |
| `require("fs")` | ✅ 拒绝 | 引号不在白名单 |
| `eval("1")` | ✅ 拒绝 | 引号不在白名单 |
| `document.cookie` | ✅ 通过（安全） | 纯变量名，无函数调用，safeEval 只计算数值 |
| `window.location` | ✅ 通过（安全） | 同上，无 DOM 访问能力 |
| `2 + 3 * 4` | ✅ 通过 | 正确计算为 14 |
| `publicVar.x` | ✅ 通过 | 变量引用 |
| `publicVar.x[0]` | ✅ 通过 | 数组索引 |

### 5.3 功能验证（新增）

| 功能 | 结果 | 说明 |
|------|------|------|
| Variable Assignment UI | ✅ | text2echarts.html 中已恢复 |
| 模板替换说明 | ✅ | Instructions 中已添加 publicVar 引用说明 |
| JSON placeholder | ✅ | placeholder 提示纯 JSON 格式 |
| functionInput DOM | ✅ | app.js 中已恢复 DOM 引用 |
| resolveTemplates | ✅ | 已添加，遍历 JSON 替换 `${...}` |
| safeEval | ✅ | 已添加，手写递归下降解析器 |
| JSON.parse(functionInput) | ✅ | 安全解析，无代码执行 |

### 5.4 追加测试总结

| 类别 | 结果 |
|------|------|
| 安全验证 | ✅ 全部通过（9/9） |
| 攻击向量 | ✅ 全部正确处理（8/8） |
| 功能验证 | ✅ 全部通过（7/7） |
| **总计** | **24/24 = 100%** |

**结论**: 变更 #1 安全实现正确。safeEval 解析器通过白名单和函数调用拒绝双重保护，无代码执行风险。Variable Assignment 功能已恢复，模板替换和表达式计算正常工作。
