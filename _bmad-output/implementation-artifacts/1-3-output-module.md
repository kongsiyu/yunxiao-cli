# Story 1.3：输出层模块

Status: review

## Story

As a developer,
I want a centralized `output.js` module with `printTable()`, `printJson()`, `printError()`,
So that `--json` mode always outputs pure JSON to stdout without any chalk contamination.

## Acceptance Criteria

1. **Given** `--json` 全局 flag 已激活
   **When** 任意命令正常返回数据
   **Then** stdout 只包含合法 JSON，不含 chalk 着色字符、提示文字或 ANSI 转义序列

2. **Given** `--json` 全局 flag 已激活
   **When** 命令发生错误
   **Then** stderr 输出 `{"error": "描述", "code": "ERROR_CODE"}` 格式 JSON
   **And** stdout 无输出
   **And** 退出码非零

3. **Given** `--json` 未激活（默认模式）
   **When** 命令正常返回列表数据
   **Then** stdout 输出人类可读的表格或文本，可使用 chalk 着色

4. **Given** `--json` 模式下任意 list 命令
   **When** 命令返回数据
   **Then** 返回的 JSON 对象包含 `total` 字段，值为数据集总条数

## Tasks / Subtasks

- [x] 创建 `src/output.js` 模块 (AC: #1, #2, #3)
  - [x] 实现 `printJson(data)` — `process.stdout.write(JSON.stringify(data) + '\n')`
  - [x] 实现 `printError(code, message, jsonMode)` — jsonMode 时 stderr 输出 `{"error":"...","code":"..."}` JSON，否则输出 `Error [CODE]: message`
- [x] 更新 `src/index.js` (AC: #1, #2)
  - [x] 用 `process.argv.includes('--json')` 早期检测 jsonMode（parse 前）
  - [x] 在 program 上声明 `.option('--json', 'Output as JSON')` 全局 flag
  - [x] 更新 `withErrorHandling` 使用 `printError(err.code, err.message, jsonMode)` 替代当前 stderr.write
  - [x] 更新 `registerProjectCommands`、`registerWorkitemCommands`、`registerSprintCommands` 调用，传入 `jsonMode`
- [x] 更新 `src/commands/workitem.js` (AC: #1, #3, #4)
  - [x] 函数签名增加 `jsonMode` 参数
  - [x] `wi list`：jsonMode 时 `printJson({ items, total: items.length })`，否则 chalk 表格
  - [x] `wi view`：jsonMode 时 `printJson(item)`，否则 chalk 详情
  - [x] `wi create`：jsonMode 时 `printJson(created)`，否则 chalk 成功消息
  - [x] `wi update`：jsonMode 时 `printJson({ success: true, id: resolvedId })`，否则 chalk 成功消息
  - [x] `wi comment`：jsonMode 时 `printJson({ success: true, id: result.id })`，否则 chalk 成功
  - [x] `wi comments`：jsonMode 时 `printJson({ comments, total: comments.length })`，否则 chalk 列表
  - [x] `wi types`：jsonMode 时 `printJson({ types, total: types.length })`，否则 chalk 列表
  - [x] `wi delete`：jsonMode 时跳过交互提示（机器调用须用 --force），`printJson({ success: true, id: resolvedId })`
- [x] 更新 `src/commands/project.js` (AC: #1, #3, #4)
  - [x] 函数签名增加 `jsonMode` 参数
  - [x] `project list`：jsonMode 时 `printJson({ projects, total: projects.length })`，否则 chalk 表格
  - [x] `project view`：jsonMode 时 `printJson(p)`，否则 chalk 详情
- [x] 更新 `src/commands/sprint.js` (AC: #1, #3, #4)
  - [x] 函数签名增加 `jsonMode` 参数；改用 `printError` 替代手写 JSON 错误路径
  - [x] `sprint list`：jsonMode 时 `printJson({ sprints, total: sprints.length })`，否则 chalk 表格
  - [x] `sprint view`：改为基于 listSprints 过滤（移除不存在的 getSprint 调用），jsonMode 时 `printJson(sprint)`
- [x] 验证
  - [x] `node src/index.js --help` 正常运行（无模块缺失）
  - [x] 错误场景：`--json` 模式下 → stderr `{"error":"...","code":"AUTH_MISSING"}`，退出码 1
  - [x] 所有 11 个单元测试通过

## Dev Notes

### `src/output.js` 完整实现规格

```js
// src/output.js - Centralized output functions
export function printJson(data) {
  process.stdout.write(JSON.stringify(data) + '\n');
}

export function printError(code, message, jsonMode) {
  if (jsonMode) {
    process.stderr.write(JSON.stringify({ error: message, code }) + '\n');
  } else {
    process.stderr.write(`Error [${code}]: ${message}\n`);
  }
}

export function printSuccess(message, data, jsonMode) {
  if (jsonMode) {
    process.stdout.write(JSON.stringify(data ?? { success: true }) + '\n');
  } else {
    const chalk = (await import('chalk')).default;
    process.stdout.write(chalk.green(message) + '\n');
  }
}
```

注意：`printSuccess` 的 dynamic import 有点笨重，建议命令层直接做 if/else 而不是通过 printSuccess。

### `src/index.js` 变更摘要

**jsonMode 早期检测（parse 前）：**
```js
const jsonMode = process.argv.includes('--json');
program.option('--json', 'Output results as JSON');
```

**withErrorHandling 更新：**
```js
import { printError } from './output.js';

function withErrorHandling(fn) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      if (err instanceof AppError) {
        printError(err.code, err.message, jsonMode);
      } else if (err.response) {
        printError(ERROR_CODE.API_ERROR, err.response.data?.errorMessage || err.response.statusText, jsonMode);
      } else {
        printError(ERROR_CODE.API_ERROR, err.message, jsonMode);
      }
      process.exit(1);
    }
  };
}
```

**register 调用更新：**
```js
registerProjectCommands(program, client, orgId, withErrorHandling, jsonMode);
registerWorkitemCommands(program, client, orgId, projectId, withErrorHandling, currentUserId, jsonMode);
registerSprintCommands(program, client, orgId, projectId, withErrorHandling, jsonMode);
// 注意：auth commands 不需要 jsonMode（或可选传入）
```

### `wi list` jsonMode 分支示例

```js
// jsonMode 时
if (jsonMode) {
  printJson({ items, total: items.length });
} else {
  // 现有 chalk 输出逻辑
  console.log(chalk.bold("\nFound " + items.length + " work item(s):\n"));
  // ...
}
```

注意：`searchWorkitems` 可能只返回当前页数据，`total` 应用 API 返回的 total 字段（如果有），否则用 `items.length`。

### `sprint.js` 中 sprint view 的 jsonMode 注意

当前 `sprint view` 对 `listSprintWorkitems` 有 try/catch（API 可能不支持）。jsonMode 时：
- 如果 listSprintWorkitems 失败：`printJson({ sprint, workitems: [], total: 0 })`
- 正常时：`printJson({ sprint, workitems, total: workitems.length })`

### `auth.js` 的处理

`auth status`、`auth login`、`auth logout` 默认不输出 JSON，不强制要求支持 `--json`（本 Story 范围外）。但 `withErrorHandling` 的更新会自动让错误也走 jsonMode。

### 技术栈约束

- Node.js ≥ 18，ESM 模块（`"type": "module"`）
- chalk ^5.3.0（已有依赖，只在非 json 模式使用）
- `process.argv.includes('--json')` 方式简单可靠，在 Commander parse 之前即可用

### 范围边界

- **本 Story 范围**：创建 `output.js`，添加 `--json` 全局 flag，更新所有 list/view/create/update/delete 命令输出
- **不在范围**：`auth` 命令的 json 输出（Story 1.5）；`whoami` 命令的 json 输出（Story 1.6）；`--json` 与 `--limit` 分页 total 准确性（取决于 API，Story 2.x）

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]
- [Source: _bmad-output/planning-artifacts/epics.md#FR22, FR23, FR24]
- [Source: src/commands/workitem.js] — 待更新的命令层
- [Source: src/commands/project.js] — 待更新的命令层
- [Source: src/commands/sprint.js] — 待更新的命令层
- [Source: src/index.js] — withErrorHandling 和 register 调用

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- 新建 `src/output.js`，实现 `printJson`（stdout 纯 JSON）、`printError`（stderr，jsonMode 下输出 `{"error":"...","code":"..."}`）
- 更新 `src/index.js`：添加 `--json` 全局 flag，早期检测 `jsonMode`，更新 `withErrorHandling` 用 `printError`，向所有命令注册函数传递 `jsonMode`
- 更新 `src/commands/workitem.js`：全部命令支持 jsonMode，list/types/comments 含 `total` 字段，delete 在 jsonMode 下跳过交互提示
- 更新 `src/commands/project.js`：list/view 支持 jsonMode
- 更新 `src/commands/sprint.js`：list/view 支持 jsonMode，移除不存在的 `getSprint`/`listSprintWorkitems` 调用（已有代码 bug），改为 listSprints 过滤
- 修复：错误路径统一使用 `printError` 替代散落的手写 JSON 格式
- 验证：`--help` 正常；`--json` 错误格式正确；11/11 单元测试通过

### File List

- src/output.js (新建)
- src/index.js (修改：--json 全局 flag，withErrorHandling，register 调用)
- src/commands/workitem.js (修改：jsonMode 支持，printError 统一)
- src/commands/project.js (修改：jsonMode 支持)
- src/commands/sprint.js (修改：jsonMode 支持，移除不存在 API 调用，printError 统一)
- _bmad-output/implementation-artifacts/1-3-output-module.md (新建 Story 文件)
