# Story 1.4：错误定义模块

Status: review

## Story

As a developer,
I want a centralized `errors.js` with ERROR_CODE enum and structured error class,
So that all commands use consistent error codes without hardcoding strings.

## Acceptance Criteria

1. **Given** `errors.js` 模块
   **When** 引用错误码
   **Then** 以下错误码均已定义：`AUTH_FAILED`、`AUTH_MISSING`、`NOT_FOUND`、`INVALID_ARGS`、`API_ERROR`

2. **Given** 命令层抛出结构化错误
   **When** `withErrorHandling` / `output.js` 处理该错误
   **Then** 错误对象包含 `code`（ERROR_CODE 枚举值）和 `message`（人类可读描述）

3. **Given** 任意命令发生认证缺失错误
   **When** 运行命令
   **Then** 退出码为非零，stderr 包含 `AUTH_MISSING` 错误码

## Tasks / Subtasks

- [x] 创建 `src/errors.js` 模块 (AC: #1, #2)
  - [x] 定义 `ERROR_CODE` 枚举对象（`AUTH_FAILED`、`AUTH_MISSING`、`NOT_FOUND`、`INVALID_ARGS`、`API_ERROR`），`Object.freeze` 防止运行时篡改
  - [x] 实现 `AppError` 类：继承 `Error`，构造函数接受 `(code, message)`，属性 `this.code`、`this.message`、`this.isAppError = true`；`Error.captureStackTrace` 去除构造帧
- [x] 更新 `src/index.js` 的 `withErrorHandling` 函数 (AC: #2, #3)
  - [x] `instanceof AppError` 识别结构化错误，输出 `Error [CODE]: message` 到 stderr
  - [x] 未认证时注册占位命令（`project/workitem/sprint [args...]`，`allowUnknownOption`），调用时抛 `AppError(AUTH_MISSING)`
- [x] 验证 (AC: #1, #2, #3)
  - [x] `node src/index.js --help` 正常运行
  - [x] 未配置 token 时运行 `yunxiao workitem list` → stderr 含 `AUTH_MISSING`，退出码非零

## Dev Notes

### `src/errors.js` 完整实现规格

```js
// src/errors.js
export const ERROR_CODE = {
  AUTH_FAILED: 'AUTH_FAILED',
  AUTH_MISSING: 'AUTH_MISSING',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_ARGS: 'INVALID_ARGS',
  API_ERROR: 'API_ERROR',
};

export class AppError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.isAppError = true;
  }
}
```

### `src/index.js` 变更：withErrorHandling

当前的 `withErrorHandling` 只区分 `err.response`（axios 错误）和其他错误。需要增加 `AppError` 识别：

```js
import { AppError, ERROR_CODE } from './errors.js';

function withErrorHandling(fn) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      if (err.isAppError) {
        process.stderr.write(`Error [${err.code}]: ${err.message}\n`);
      } else if (err.response) {
        process.stderr.write(`API Error: ${err.response.data?.errorMessage || err.response.statusText}\n`);
        process.stderr.write(`Status: ${err.response.status}\n`);
      } else {
        process.stderr.write(`Error: ${err.message}\n`);
      }
      process.exit(1);
    }
  };
}
```

> **注**：暂保留 chalk 输出在 `console.error` 中（Story 1-3 的 `output.js` 会统一处理 `--json` 模式下的格式化）；此处改为 `process.stderr.write` 以便 AC #3 验证 stderr 内容。

### `src/index.js` 变更：AUTH_MISSING 处理

当前：若 `client` 为 null，`registerProjectCommands` / `registerWorkitemCommands` 根本不调用，导致 commander 报 "unknown command"。

需要在 `client && orgId` 为 false 时注册占位命令，抛出 `AUTH_MISSING`：

```js
if (client && orgId) {
  registerProjectCommands(program, client, orgId, withErrorHandling);
  registerWorkitemCommands(program, client, orgId, projectId, withErrorHandling, currentUserId);
} else {
  // 注册占位命令：未认证时给出明确错误
  const authRequiredAction = withErrorHandling(async () => {
    throw new AppError(ERROR_CODE.AUTH_MISSING, 'Authentication required. Run: yunxiao auth login');
  });
  program.command('project').description('(requires auth)').action(authRequiredAction);
  program.command('workitem').description('(requires auth)').action(authRequiredAction);
  program.command('sprint').description('(requires auth)').action(authRequiredAction);
}
```

### 技术栈约束

- Node.js ≥ 18，ESM 模块（`"type": "module"`），使用 `import/export` 语法
- 无新依赖：纯 JS 类继承
- 2 空格缩进，单引号字符串（与项目现有风格一致）

### 范围边界

- **本 Story 范围**：创建 `errors.js` 模块；更新 `withErrorHandling`；为未认证命令提供 `AUTH_MISSING` 错误
- **不在范围**：`--json` 模式下 `{"error": "...", "code": "..."}` 格式化（Story 1-3 的 `output.js` 负责）；全面迁移所有 `console.error` / `process.exit(1)` 调用（后续 Story 统一处理）

### 目标目录结构（本 Story 后）

```
src/
  index.js        ← 更新：import AppError/ERROR_CODE，withErrorHandling 识别 AppError，AUTH_MISSING 占位命令
  api.js          ← 不变
  config.js       ← 不变
  errors.js       ← 新建：ERROR_CODE 枚举 + AppError 类
  commands/
    auth.js       ← 不变
    project.js    ← 不变
    sprint.js     ← 不变
    workitem.js   ← 不变
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]
- [Source: _bmad-output/planning-artifacts/epics.md#FR24] — 错误输出格式
- [Source: _bmad-output/planning-artifacts/epics.md#NFR8] — 错误码集中定义
- [Source: src/index.js#18-32] — 当前 withErrorHandling 实现
- [Source: src/index.js#83-86] — 当前条件注册逻辑

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- 新建 `src/errors.js`：`ERROR_CODE`（Object.freeze 枚举）+ `AppError` 类（code/message/isAppError，captureStackTrace）
- 更新 `src/index.js` `withErrorHandling`：`instanceof AppError` 识别结构化错误，输出到 stderr
- 未认证时注册占位命令（`project/workitem/sprint [args...]`，allowUnknownOption），覆盖子命令场景
- 所有 AC 验证通过；11/11 单元测试通过（无回归）

### File List

- src/errors.js (新建)
- src/index.js (修改：import errors，withErrorHandling 增加 AppError 识别，未认证占位命令)
- _bmad-output/implementation-artifacts/1-4-errors-module.md (修改：Story 文件)
- _bmad-output/implementation-artifacts/sprint-status.yaml (修改：状态更新)
