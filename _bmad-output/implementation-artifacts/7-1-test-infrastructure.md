# Story 7.1：测试基础设施配置

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a working test infrastructure with node:test runner and mock support,
So that all subsequent test stories can be written and run reliably.

## Acceptance Criteria

1. **Given** 执行 `npm test`
   **When** 运行测试
   **Then** node:test runner 正常执行 `test/` 目录下所有 `.test.js` 文件

2. **Given** 测试文件需要 mock 云效 API 响应
   **When** 编写测试
   **Then** 有可用的 mock 机制（`node:test` 内置 mock 或同等方案）可拦截 axios 请求

3. **Given** CI 环境
   **When** 执行 `npm test`
   **Then** 测试以非交互式方式运行，结果可被 GitHub Actions 解析

## Tasks / Subtasks

- [x] 验证并修复 `package.json` 中的 `test` 脚本 (AC: #1, #3)
  - [x] 确认 `"test": "node --test test/*.test.js"` 正确配置（已存在，验证即可）
  - [x] 验证 `node --test` 输出格式可被 GitHub Actions 的日志解析（TAP 格式，非交互式）

- [x] 确认 `test/` 目录结构与命名规范 (AC: #1)
  - [x] 验证 `test/config.test.js` 已存在并可正常运行（`npm test` 通过）
  - [x] 确认 `.test.js` 命名约定文档化（Dev Notes 中记录）

- [x] 验证 node:test 内置 mock 能力可用于 axios 拦截 (AC: #2)
  - [x] 编写示例 mock 片段，演示如何用 `node:test` 的 `mock.method()` 拦截 axios 调用
  - [x] 若 `node:test` mock 对 axios ESM 导入存在限制，评估并记录替代方案（如直接 mock api.js 模块导出）

- [x] 创建 `test/setup.js`（可选辅助模块）(AC: #2)
  - [x] 若多个测试文件需要共享 mock 辅助函数，创建 `test/setup.js` 导出通用 mock helper
  - [x] 若不需要，跳过此步并在 Dev Notes 中说明

- [x] 运行完整测试套件验证基础设施 (AC: #1, #3)
  - [x] `npm test` 所有已有测试通过（无回归）
  - [x] 输出无交互式提示，纯文本/TAP 格式

## Dev Notes

### 当前测试基础设施状态

项目已有部分测试基础设施：

- **`package.json` test 脚本**：`"test": "node --test test/*.test.js"` — 已配置 ✓
- **`test/config.test.js`**：已存在，使用 `node:test` + `node:assert/strict` 测试 `src/config.js`
- **`test/` 目录**：已存在，仅含 `config.test.js`

**本 Story 的核心任务**：验证现有基础设施满足所有 AC，补充缺失部分（尤其是 mock 机制文档/示例），确保后续 Story 7.2–7.4 可直接基于此基础编写测试。

### 技术栈约束

- **Node.js ≥ 18**，ESM 模块（`"type": "module"`）
- **测试框架**：Node.js 内置 `node:test`（零依赖，无需 jest/mocha）
- **断言库**：`node:assert/strict`
- **Import 语法**：`import { test, describe, beforeEach, afterEach } from 'node:test'`
- **2 空格缩进，单引号字符串**（与项目现有风格一致）
- **不引入新依赖**（sinon 等外部 mock 库不在范围内）

### Mock 机制说明（关键指引）

`node:test` 内置 mock API（Node.js 18.13+）：

```js
import { test, mock } from 'node:test';

// 拦截模块方法
mock.method(targetObject, 'methodName', async () => mockReturnValue);

// 或使用 mock.module（Node.js 22+，ESM mock）
// 注意：Node.js 18 对 ESM mock.module 支持有限
```

**axios ESM mock 策略**：由于 axios 是 ESM 包，直接 mock `axios.get` 在 Node.js 18 中可能受限。推荐策略：

1. **mock api.js 层**：在 Story 7.2 中，mock `src/api.js` 的导出函数，而非底层 axios（更稳定，更符合测试分层原则）
2. **mock.method 替换**：在测试文件中 `import api from '../src/api.js'`，然后用 `mock.method(api, 'searchWorkitems', ...)` 替换

本 Story 需验证上述方案可行并记录示例片段供后续 Story 参考。

### node:test 关键 API 参考

```js
import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

describe('模块名', () => {
  beforeEach(() => { /* 每个 test 前执行 */ });
  afterEach(() => { /* 每个 test 后执行，清理 mock */ });

  test('测试描述', async () => {
    // mock.method(obj, 'method', implementation)
    // assert.equal / assert.deepEqual / assert.throws
  });
});

// 每次 test 后清理 mock（防止跨测试污染）
afterEach(() => mock.restoreAll());
```

### CI 兼容性

`node --test` 默认输出 TAP（Test Anything Protocol）格式，GitHub Actions 可直接解析，无需额外配置。`--test-reporter` 可切换为 `spec`（人类可读），但默认 TAP 已满足 AC #3。

### 项目结构（本 Story 后预期状态）

```
test/
  config.test.js    ← 已存在（可运行）
  setup.js          ← 可选：共享 mock helpers（若 7.2–7.4 需要）
src/
  api.js            ← 不变（7.2 会测试它）
  config.js         ← 不变
  errors.js         ← 不变
  index.js          ← 不变
  output.js         ← 不变
  commands/         ← 不变
package.json        ← 不变（test 脚本已正确配置）
```

### 已有测试文件分析

`test/config.test.js` 展示了本项目测试风格：
- 使用 `describe` / `test` 嵌套结构
- `beforeEach`/`afterEach` 处理环境变量清理
- 动态 `import()` 加载被测模块（ESM 动态导入绕过模块缓存限制）
- `assert.equal` / `assert.deepEqual` / `assert.ok` 断言

后续 Story（7.2–7.4）应遵循此风格。

### 范围边界

- **本 Story 范围**：验证 `npm test` 基础运行；确认/文档化 mock 策略；确保 CI 非交互式兼容；可选创建 `test/setup.js`
- **不在范围**：实际 API 测试（Story 7.2）；序列号解析测试（Story 7.3）；命令层测试（Story 7.4）

### Project Structure Notes

- 所有源文件在 `src/`，测试文件在 `test/`，命名约定 `*.test.js`
- ESM 模块，import 路径需带 `.js` 后缀（`import('../src/config.js')`）
- 无需 `__tests__` 目录（非 Jest 项目）

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.1] — 原始需求
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 7] — 测试覆盖目标
- [Source: package.json#scripts.test] — `"node --test test/*.test.js"`
- [Source: test/config.test.js] — 现有测试风格参考
- [Source: src/errors.js] — ERROR_CODE / AppError 定义（后续测试需 import）
- [Node.js 官方文档: https://nodejs.org/api/test.html] — node:test runner API

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

N/A

### Completion Notes List

- `package.json` test 脚本 `"node --test test/*.test.js"` 已验证正确，无需修改。
- `test/config.test.js` 原有 11 个测试全部通过（无回归）。
- **关键发现**：Node.js 18 中 ESM 模块命名空间对象（`import * as api`）的导出是 non-configurable，`mock.method(api, 'fn', ...)` 会抛出 `TypeError: Cannot redefine property`。两种可用替代方案已在 `test/mock-example.test.js` 中演示并验证：
  - Strategy A（推荐用于 Story 7.2）：mock `createMockClient()` 返回的 client 对象上的 `post`/`get` 方法，控制 HTTP 层响应，同时执行真实 api.js 代码路径。
  - Strategy B（推荐用于 Story 7.3/7.4 命令层测试）：将 api 函数包装为普通可变 adapter 对象，对该对象使用 `mock.method()`。
- `test/setup.js` 已创建，导出 `createMockClient`、`makePage`、`makeWorkitem`、`makeProject`、`makeSprint`，供后续 Story 共享使用。
- `npm test` 最终结果：25 tests / 8 suites / 25 pass / 0 fail，TAP 格式输出，CI 兼容。

### File List

- `test/setup.js` — 新建：共享 mock helpers（createMockClient、makePage、makeWorkitem、makeProject、makeSprint）及 ESM mock 策略文档
- `test/mock-example.test.js` — 新建：演示 Strategy A（mock client HTTP 层）和 Strategy B（mutable adapter）的完整可运行示例，14 个测试全部通过
- `test/config.test.js` — 未修改（原有 11 个测试全部通过，无回归）
- `package.json` — 未修改（test 脚本已正确配置）
