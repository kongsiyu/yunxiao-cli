# Story 7.4：命令层测试

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want core command output paths tested for `--json` format and error codes,
So that the CLI's output contract with AI agents is continuously verified.

## Acceptance Criteria

1. **Given** 执行 `wi list --json`（mock API 返回数据）
   **When** 运行 `test/commands.test.js`
   **Then** 测试验证 stdout 是合法 JSON 且包含 `total` 字段

2. **Given** 认证缺失时执行任意命令
   **When** 测试运行
   **Then** 验证 stderr 包含 `AUTH_MISSING` 错误码，退出码非零

3. **Given** `--json` 模式下发生 API 错误
   **When** 测试运行
   **Then** 验证 stdout 无输出，stderr 包含 `{"error": "...", "code": "API_ERROR"}` 格式

## Tasks / Subtasks

- [x] 创建 `test/commands.test.js` 测试文件 (AC: #1, #2, #3)
  - [x] 实现 `setupCapture()` helper：mock process.stdout.write / stderr.write / exit，返回捕获数组
  - [x] 实现 `buildWithErrorHandling(jsonMode)` helper：复制 src/index.js 中的 withErrorHandling 逻辑
  - [x] 实现 `buildProgram(client, orgId, projectId, jsonMode)` helper：创建 Commander 程序并注册 workitem 命令
  - [x] AC1：`wi list --json` → stdout 是合法 JSON，包含 `total` 字段和 `items` 数组
  - [x] AC1 追加：`x-total` header 被正确解析为 total 值
  - [x] AC2：`withErrorHandling` 捕获 AUTH_MISSING → stderr 含 `AUTH_MISSING` 码，exitCode=1
  - [x] AC2 追加：stderr 格式为 `{"error":"...","code":"AUTH_MISSING"}`
  - [x] AC3：API 500 错误 → stdout 为空，stderr 含 `{"error":"...","code":"API_ERROR"}`
  - [x] AC3 追加：HTTP 404 错误 → stderr 含 `{"error":"...","code":"NOT_FOUND"}`
  - [x] 追加：`printJson` / `printError` 单元测试（格式契约验证）
- [x] 运行 `npm test` 确认所有测试通过，无回归 (AC: #1, #2, #3)

## Dev Notes

### 核心挑战：命令层测试策略

命令层测试不同于 API 层测试（7-2/7-3）。命令处理函数是 Commander.js 内部的闭包，无法直接 import 并调用。正确测试方式：

1. **Strategy A（推荐）**：传入 mock client，通过 `registerWorkitemCommands()` 注册命令，然后调用 `program.parseAsync()` 执行
2. 捕获 `process.stdout.write` / `process.stderr.write` 来验证输出
3. mock `process.exit` 防止测试进程被终止

### 为什么不能用 Strategy B（api adapter）？

`src/commands/workitem.js` 直接 `import { searchWorkitems, ... } from '../api.js'` —— ESM 模块导出是 sealed/non-configurable，`mock.method()` 无法替换。
**唯一可行方案**：mock `client.post/get` HTTP 层（Strategy A），让真实 api.js 代码路径执行，通过 mock client 控制返回值。

### `searchWorkitems` 返回结构（api.js 行 87–97）

```js
// client.post 返回 { data: rawData }
// rawData 可以是数组或 { data: [...], total: N }
const items = Array.isArray(rawData) ? rawData : (rawData?.data ?? []);
const total = parseInt(res.headers?.['x-total'] ?? rawData?.total ?? items.length, 10) || 0;
return { items, total };
```

**Mock 方式（测试中使用）：**
```js
// 数组格式（简单）：total = items.length
mock.method(client, 'post', async () => ({ data: [item1, item2] }));
// → { items: [item1, item2], total: 2 }

// 带 x-total header：total 来自 header
mock.method(client, 'post', async () => ({ data: [item1], headers: { 'x-total': '100' } }));
// → { items: [item1], total: 100 }
```

### `wi list` 命令输出逻辑（workitem.js 行 54–70）

```js
const { items, total } = await searchWorkitems(client, orgId, spaceId, { ... });
if (jsonMode) {
  printJson({ items: items || [], total });  // ← AC1 验证点
  return;
}
```

**重要**：`spaceId = opts.project || defaultProjectId`。测试时必须给 `buildProgram` 传入非空 `projectId`，否则 `INVALID_ARGS` 提前 exit。

### `withErrorHandling` 逻辑（src/index.js 行 28–44）

测试中需复制此函数，不能直接 import（index.js 是 CLI 入口，执行时会加载 config 并发 API 请求）：

```js
function buildWithErrorHandling(jsonMode) {
  return (fn) => async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      if (err instanceof AppError) {
        printError(err.code, err.message, jsonMode);
      } else if (err.response) {
        const code = err.response.status === 404 ? ERROR_CODE.NOT_FOUND : ERROR_CODE.API_ERROR;
        printError(code, err.response.data?.errorMessage || err.response.statusText, jsonMode);
      } else {
        printError(ERROR_CODE.API_ERROR, err.message, jsonMode);
      }
      process.exit(1);
    }
  };
}
```

### process.exit mock 策略

`withErrorHandling` 在错误时调用 `process.exit(1)`。必须 mock 它，否则测试进程被终止：

```js
class MockExit extends Error {
  constructor(code) { super(`process.exit(${code})`); this.exitCode = code; }
}

// 在 setupCapture() 中：
mock.method(process, 'exit', (code) => {
  exitCodes.push(code ?? 0);
  throw new MockExit(code);
});
```

`program.parseAsync` 会将 MockExit 向上抛出 → 在测试中用 `try/catch` 捕获。

### 完整 setupCapture() 实现

```js
function setupCapture() {
  const stdout = [];
  const stderr = [];
  const exitCodes = [];
  mock.method(process.stdout, 'write', (data) => { stdout.push(String(data)); return true; });
  mock.method(process.stderr, 'write', (data) => { stderr.push(String(data)); return true; });
  mock.method(process, 'exit', (code) => { exitCodes.push(code ?? 0); throw new MockExit(code); });
  return { stdout, stderr, exitCodes };
}
```

### buildProgram() 实现

```js
import { Command } from 'commander';
import { registerWorkitemCommands } from '../src/commands/workitem.js';
import { printError } from '../src/output.js';
import { AppError, ERROR_CODE } from '../src/errors.js';

function buildProgram(client, orgId, projectId, jsonMode) {
  const program = new Command();
  program.exitOverride();  // 防止 Commander 内部调用 process.exit
  program.configureOutput({ writeErr: () => {} }); // 抑制 Commander 自身错误输出
  program.option('--json', 'Output as JSON');
  const withErrorHandling = buildWithErrorHandling(jsonMode);
  registerWorkitemCommands(program, client, orgId, projectId, withErrorHandling, null, jsonMode);
  return program;
}
```

### API 错误对象格式（与 withErrorHandling 匹配）

```js
// HTTP 500 错误
const apiErr = Object.assign(new Error('Internal Server Error'), {
  response: { status: 500, data: { errorMessage: 'server error' }, statusText: 'Internal Server Error' },
});
// HTTP 404 错误
const notFoundErr = Object.assign(new Error('Not Found'), {
  response: { status: 404, data: { errorMessage: 'not found' }, statusText: 'Not Found' },
});
```

### 完整测试用例骨架

```js
// test/commands.test.js
import { test, describe, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { Command } from 'commander';
import { registerWorkitemCommands } from '../src/commands/workitem.js';
import { AppError, ERROR_CODE } from '../src/errors.js';
import { printJson, printError } from '../src/output.js';
import { createMockClient, makeWorkitem } from './setup.js';

class MockExit extends Error {
  constructor(code) { super(`process.exit(${code})`); this.exitCode = code; }
}

function setupCapture() { ... }
function buildWithErrorHandling(jsonMode) { ... }
function buildProgram(client, orgId, projectId, jsonMode) { ... }

describe('命令层：wi list --json', () => {
  afterEach(() => mock.restoreAll());

  test('stdout 是合法 JSON 且包含 total 字段', async () => {
    const client = createMockClient();
    const items = [makeWorkitem({ id: 'wi-001' }), makeWorkitem({ id: 'wi-002' })];
    mock.method(client, 'post', async () => ({ data: items }));
    const { stdout } = setupCapture();
    const program = buildProgram(client, 'org1', 'proj1', true);
    await program.parseAsync(['node', 'yunxiao', 'wi', 'list']);
    const output = JSON.parse(stdout.join(''));
    assert.ok('total' in output);
    assert.ok(Array.isArray(output.items));
    assert.equal(typeof output.total, 'number');
  });
  // ...
});

describe('命令层：AUTH_MISSING 错误', () => { ... });
describe('命令层：--json 模式下 API 错误', () => { ... });
describe('output 模块：printJson / printError 格式验证', () => { ... });
```

### 技术约束

- Node.js ≥ 18，ESM（`"type": "module"`），2 空格缩进，单引号字符串
- 不引入新依赖（Commander 已在 dependencies 中）
- `import { Command } from 'commander'`（无 `.js` 后缀，node_modules 包）
- `import { registerWorkitemCommands } from '../src/commands/workitem.js'`（带 `.js`）
- `import { printJson, printError } from '../src/output.js'`（带 `.js`）
- `npm test` 脚本：`node --test test/*.test.js`（自动包含新文件）

### 已有基础设施

- `test/setup.js`：`createMockClient()`、`makeWorkitem()`、`makePage()`、`makeProject()`、`makeSprint()`
- `test/mock-example.test.js`：Strategy A/B 完整示例
- `src/commands/workitem.js`：`registerWorkitemCommands(program, client, orgId, defaultProjectId, withErrorHandling, currentUserId, jsonMode)`
- `src/output.js`：`printJson(data)` → stdout；`printError(code, message, jsonMode)` → stderr
- `src/errors.js`：`AppError`、`ERROR_CODE`

### 已有类似命令层测试参考

`test/wi-view.test.js` 测试的是 API 层函数（`resolveWorkitemId` / `getWorkitem`），而非命令层。本 Story 是**首个真正的命令层测试**，需要 Commander 程序调用 + 输出捕获。

### Project Structure Notes

```
test/
  commands.test.js          ← 本 Story 新建：命令层测试
  config.test.js            ← 已有（无需修改）
  mock-example.test.js      ← 已有（参考用）
  resolve.test.js           ← 已有（7-3 成果）
  setup.js                  ← 已有共享 helpers（无需修改）
  api.test.js               ← 已有（7-2 成果）
  wi-view.test.js           ← 已有（2-3 成果）
  workitem-delete.test.js   ← 已有（2-6 成果）
  sprint.test.js            ← 已有
  pipeline*.test.js         ← 已有
  user.test.js              ← 已有
src/
  commands/workitem.js      ← 被测命令层（不修改）
  output.js                 ← 被测输出函数（不修改）
  errors.js                 ← AppError / ERROR_CODE（不修改）
  index.js                  ← 不 import（会触发 CLI 启动逻辑）
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.4] — 原始 AC
- [Source: src/commands/workitem.js#registerWorkitemCommands] — 被测命令层入口
- [Source: src/index.js#withErrorHandling] — 错误处理逻辑（行 28–44）
- [Source: src/output.js] — printJson / printError
- [Source: src/errors.js] — AppError / ERROR_CODE
- [Source: src/api.js#searchWorkitems] — 返回 { items, total }（行 87–97）
- [Source: test/setup.js] — createMockClient, makeWorkitem
- [Source: test/mock-example.test.js] — Strategy A mock 示例
- [Source: _bmad-output/implementation-artifacts/7-1-test-infrastructure.md] — ESM mock 限制
- [Source: _bmad-output/implementation-artifacts/7-3-serial-number-tests.md#Dev Notes] — 前序测试 learnings

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- `test/commands.test.js` 新建，16 个测试用例全部通过（150 total / 150 pass / 0 fail，无回归）。
- 核心技术：Strategy A（mock client.post HTTP 层）+ process.stdout/stderr/exit mock 捕获输出。
- `setupCapture()` helper 通过 `mock.method` 拦截输出，`afterEach(() => mock.restoreAll())` 确保清理。
- `buildWithErrorHandling(jsonMode)` 复制 index.js 逻辑（不 import 入口文件，避免 CLI 初始化副作用）。
- `buildProgram()` 使用 `program.exitOverride()` 防止 Commander 自身调用 process.exit。
- `MockExit` class 替换 process.exit，允许测试捕获退出码而不终止进程。
- AC1 验证：stdout JSON 含 `total` 字段（包括 x-total header 解析路径）。
- AC2 验证：AUTH_MISSING 错误码 + exit(1) + stderr JSON 格式。
- AC3 验证：HTTP 500/404 → stdout 空 + stderr JSON 错误格式。
- 额外覆盖：printJson/printError 格式契约、网络错误（无 response）→ API_ERROR。

### File List

- `test/commands.test.js` — 新建：命令层测试（16 个用例）

### Review Findings

- [x] [Review][Patch] Silent `catch(e)` blocks lack MockExit guards — add `if (!(e instanceof MockExit)) throw e;` [test/commands.test.js:237,261,281,295,191,207]
- [x] [Review][Defer] `buildWithErrorHandling` duplicates `src/index.js` logic; divergence risk if production changes [test/commands.test.js:56-72] — deferred, pre-existing design constraint (index.js cannot be imported)
- [x] [Review][Defer] `wi list` non-JSON mode command path untested [test/commands.test.js] — deferred, out of scope for Story 7.4
- [x] [Review][Defer] `rawData?.total` branch (nested `{ data, total }` format) not exercised [test/commands.test.js] — deferred, out of scope
- [x] [Review][Defer] 401→`AUTH_FAILED` path not tested [test/commands.test.js] — deferred, out of scope
- [x] [Review][Defer] `err.message` undefined case not tested [test/commands.test.js] — deferred, out of scope
- [x] [Review][Defer] Both `errorMessage` and `statusText` falsy not tested [test/commands.test.js] — deferred, out of scope
- [x] [Review][Defer] AUTH_MISSING tested via direct throw, not through full `buildProgram`+`parseAsync` path [test/commands.test.js] — deferred, spec explicitly tests withErrorHandling wrapper directly
- [x] [Review][Defer] `workitem.js` internal `process.exit` calls before withErrorHandling could surface MockExit as API_ERROR [test/commands.test.js] — deferred, out of scope
