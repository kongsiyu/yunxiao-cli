# Story 7.3：序列号解析专项测试

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want dedicated tests for `resolveWorkitemId` covering all edge cases,
So that the serial number resolution logic is provably correct.

## Acceptance Criteria

1. **Given** 输入合法序列号 `GJBL-1`
   **When** 运行 `test/resolve.test.js`
   **Then** 测试验证 `searchWorkitems` 被调用（全类型 `Req,Task,Bug`），并在结果中精确匹配 `serialNumber`，返回对应的 `id`

2. **Given** 输入不存在的序列号
   **When** 测试运行
   **Then** 验证抛出 `AppError`，`code` 为 `NOT_FOUND`，错误信息包含序列号

3. **Given** 输入 UUID 格式（非序列号，如 `abc-123-def-456`）
   **When** 调用 `resolveWorkitemId`
   **Then** 直接返回该 UUID，不触发搜索请求（`client.post` 未被调用）

## Tasks / Subtasks

- [ ] 创建 `test/resolve.test.js` 测试文件 (AC: #1, #2, #3)
  - [ ] import `resolveWorkitemId` from `../src/api.js`，`createMockClient`、`makeWorkitem` from `./setup.js`
  - [ ] describe `resolveWorkitemId`，包含 beforeEach/afterEach（mock 清理）
  - [ ] AC1：正常序列号 → searchWorkitems 被调用，返回匹配工作项 id
  - [ ] AC2：序列号不存在 → 抛出 NOT_FOUND AppError
  - [ ] AC3：UUID 格式 → 直接返回，client.post 未被调用
  - [ ] 边界情况：`null`/`undefined` → 返回 `null`
  - [ ] 大小写不敏感：`gjbl-1`（小写）与 `GJBL-1` 等效
- [ ] 运行 `npm test` 确认所有测试通过，无回归 (AC: #1, #2, #3)

## Dev Notes

### 关键实现分析（`src/api.js`）

`resolveWorkitemId(client, orgId, spaceId, identifier)` 逻辑：

```
1. identifier 为 falsy → 返回 null
2. 匹配 /^[A-Z]+-\d+$/i → 序列号路径：
   a. 调用 searchWorkitems(client, orgId, spaceId, { category: 'Req,Task,Bug', page: 1, perPage: 50 })
   b. 在结果（数组）中找 i.serialNumber?.toUpperCase() === identifier.toUpperCase()
   c. 未找到 → throw new AppError(ERROR_CODE.NOT_FOUND, ...)
   d. 找到 → 返回 match.id
3. 不匹配正则 → 直接返回 identifier（视为 UUID）
```

`searchWorkitems` 返回 `res.data`，其中 `res` 是 `client.post()` 的返回值。
所以 `client.post` 需要返回 `{ data: [...workitems] }`（非 `makePage` 格式，而是直接数组）。

**重要**：`searchWorkitems` 返回 `res.data`（整个对象），`resolveWorkitemId` 对结果用 `(results || []).find()`，所以 mock 的 `client.post` 应返回 `{ data: [workitem, ...] }`。

### Mock 策略（Strategy A）

`resolveWorkitemId` 内部调用 `searchWorkitems`，而 `searchWorkitems` 调用 `client.post()`。
使用 Strategy A：mock `createMockClient()` 返回对象上的 `post` 方法。

```js
import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { resolveWorkitemId } from '../src/api.js';
import { AppError, ERROR_CODE } from '../src/errors.js';
import { createMockClient, makeWorkitem } from './setup.js';

describe('resolveWorkitemId', () => {
  let client;

  beforeEach(() => {
    client = createMockClient();
  });

  afterEach(() => {
    mock.restoreAll();
  });

  test('合法序列号 → 调用 searchWorkitems，返回匹配工作项 id', async () => {
    const item = makeWorkitem({ id: 'wi-uuid-001', serialNumber: 'GJBL-1' });
    mock.method(client, 'post', async () => ({ data: [item] }));

    const result = await resolveWorkitemId(client, 'org1', 'space1', 'GJBL-1');

    assert.equal(result, 'wi-uuid-001');
    assert.equal(client.post.mock.calls.length, 1);
    // 验证 category 包含全类型
    const body = client.post.mock.calls[0].arguments[1];
    assert.equal(body.category, 'Req,Task,Bug');
  });

  // ... 其余 test case
});
```

### 测试文件位置与命名

- 输出文件：`test/resolve.test.js`（与 `test/config.test.js`、`test/mock-example.test.js` 并列）
- `npm test` 脚本：`node --test test/*.test.js`（自动包含新文件）

### 技术约束

- Node.js ≥ 18，ESM（`"type": "module"`）
- 2 空格缩进，单引号字符串
- `import { resolveWorkitemId } from '../src/api.js'`（带 `.js` 后缀）
- `import { AppError, ERROR_CODE } from '../src/errors.js'`
- 不引入新依赖

### 已有基础设施（7-1 成果）

- `test/setup.js`：`createMockClient()`、`makeWorkitem({ id, serialNumber, ... })`
- `test/mock-example.test.js`：Strategy A/B 完整示例，可参考
- `package.json test` 脚本已正确配置

### 关键发现（来自 7-1）

- Node.js 18 ESM namespace 对象导出为 non-configurable，`mock.method(api, 'fn', ...)` 会抛 TypeError
- **可用**：`mock.method(client, 'post', ...)` 对普通可变对象的方法进行替换
- `afterEach(() => mock.restoreAll())` 防止跨测试污染

### Project Structure Notes

```
test/
  config.test.js          ← 已有（无需修改）
  mock-example.test.js    ← 已有（参考用）
  resolve.test.js         ← 本 Story 新建
  setup.js                ← 已有共享 helpers
src/
  api.js                  ← 被测函数所在（不修改）
  errors.js               ← AppError / ERROR_CODE（不修改）
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.3] — 原始 AC
- [Source: src/api.js#resolveWorkitemId] — 被测函数实现（行 146–168）
- [Source: src/api.js#searchWorkitems] — 内部依赖（行 40–79），client.post 调用
- [Source: src/errors.js] — AppError / ERROR_CODE.NOT_FOUND
- [Source: test/setup.js] — createMockClient, makeWorkitem
- [Source: test/mock-example.test.js] — Strategy A mock 示例
- [Source: _bmad-output/implementation-artifacts/7-1-test-infrastructure.md#Completion Notes] — ESM mock 限制与可用方案

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- `test/resolve.test.js` 新建，11 个测试用例全部通过（36 total / 36 pass / 0 fail，无回归）。
- Strategy A（mock client.post HTTP 层）验证为正确 mock 策略：`resolveWorkitemId → searchWorkitems → client.post`。
- 代码审查后增补 3 项：`perPage: 50` 限制断言、`results === null` 防御路径、测试名称准确化。
- 关键发现：实现无 UUID 格式校验，任何不匹配 `/^[A-Z]+-\d+$/i` 的字符串均直接返回；已在测试注释中记录此行为。

### File List

- `test/resolve.test.js` — 新建：resolveWorkitemId 专项测试（11 个用例）
- `_bmad-output/implementation-artifacts/7-3-serial-number-tests.md` — 新建：Story 文件
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — 修改：7-3 状态 backlog → ready-for-dev
