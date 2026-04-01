# Story 7.2：API 层测试

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want all API functions in `api.js` covered by unit tests,
So that API integration correctness is continuously verified.

## Acceptance Criteria

1. **Given** `api.js` 中的所有 API 函数（searchWorkitems、getWorkitem、createWorkitem 等）
   **When** 运行 `test/api.test.js`
   **Then** 每个函数都有至少一个测试用例，mock 云效 API 响应

2. **Given** API 函数收到 HTTP 401 响应
   **When** 测试运行
   **Then** 函数抛出 `AUTH_FAILED` 错误（不是原始 axios 错误）

3. **Given** API 函数返回 `{ data: [...] }` 包装格式
   **When** 函数执行
   **Then** 函数解包并返回内部数组/对象（命令层无需处理包装）

## Tasks / Subtasks

- [ ] 在 `src/api.js` 中添加 401 错误处理（AC: #2）
  - [ ] 添加内部 `apiCall(fn)` 包装函数，捕获 `err.response.status === 401` 并抛出 `AppError(AUTH_FAILED)`
  - [ ] 修复 `resolveWorkitemId` 中的 bug：`results` 是 `{ data, total }` 对象，需改为 `results.data` 再调用 `.find()`
  - [ ] 所有导出 API 函数均通过 `apiCall` 包装（保证 401 统一转换）

- [ ] 创建 `test/api.test.js`（AC: #1, #2, #3）
  - [ ] 为以下函数各写至少一个成功路径测试（mock client.post/get 返回）：
    - searchProjects、getProject
    - searchWorkitems（含多种过滤条件）、getWorkitem、createWorkitem、updateWorkitem
    - addComment、listComments、deleteWorkitem、getWorkitemTypes
    - listSprints、getCurrentUser、getOrganizations
    - resolveWorkitemId（序列号路径 + UUID 直通路径 + 未找到抛 NOT_FOUND）
  - [ ] 测试 401 → AUTH_FAILED 转换（至少覆盖 GET 和 POST 各一个函数）
  - [ ] 测试返回值解包（AC#3）：验证函数返回 `res.data`，而非整个 axios response 对象
  - [ ] 每个 describe 块有 `afterEach(() => mock.restoreAll())`

- [ ] 运行 `npm test` 确认所有测试通过（AC: #1, #2, #3）

## Dev Notes

### 技术约束（继承自 Story 7.1）

- **Node.js ≥ 18**，ESM 模块（`"type": "module"`）
- **测试框架**：`node:test` 内置，`node:assert/strict`
- **Mock 策略**：Strategy A（mock `createMockClient()` 的 `post`/`get` 方法，不触碰 ESM 导出）
- **2 空格缩进，单引号字符串**
- **不引入新依赖**

### api.js 401 处理方案

在 `src/api.js` 内添加私有辅助函数（不导出）：

```js
async function apiCall(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err?.response?.status === 401) {
      throw new AppError(ERROR_CODE.AUTH_FAILED, 'Authentication failed: invalid or missing PAT');
    }
    throw err;
  }
}
```

然后将所有导出函数的核心调用改为：

```js
export async function getWorkitem(client, orgId, workitemId) {
  const url = `/oapi/v1/projex/organizations/${orgId}/workitems/${workitemId}`;
  return apiCall(() => client.get(url).then(r => r.data));
}
```

### resolveWorkitemId Bug 修复

当前实现：
```js
const results = await searchWorkitems(...);
const match = (results || []).find(...)  // BUG: results 是 { data, total }，不是数组
```

修复为：
```js
const response = await searchWorkitems(...);
const items = response?.data || [];
const match = items.find(...)
```

### test/api.test.js 结构参考

```js
import { test, describe, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../src/api.js';
import { createMockClient, makePage, makeWorkitem, makeProject, makeSprint } from './setup.js';

// 模拟 401 错误的辅助函数
function make401Error() {
  const err = new Error('Unauthorized');
  err.response = { status: 401 };
  return err;
}

describe('searchWorkitems', () => {
  afterEach(() => mock.restoreAll());

  test('返回分页结果', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: makePage([makeWorkitem()]) }));
    const result = await api.searchWorkitems(client, 'org1', 'sp1', {});
    assert.equal(result.total, 1);
    assert.equal(result.data[0].id, 'wi-001');
  });

  test('401 抛出 AUTH_FAILED', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => { throw make401Error(); });
    await assert.rejects(
      () => api.searchWorkitems(client, 'org1', 'sp1', {}),
      (err) => { assert.equal(err.code, 'AUTH_FAILED'); return true; }
    );
  });
});
```

### deleteWorkitem 无返回值

`deleteWorkitem` 调用 `client.delete()` 后无 `return`，测试验证不抛出异常即可（`await assert.doesNotReject(...)`）。

### resolveWorkitemId 测试

```js
test('序列号路径：找到匹配项', async () => {
  const item = makeWorkitem({ id: 'uuid-1', serialNumber: 'GJBL-1' });
  const client = createMockClient();
  mock.method(client, 'post', async () => ({ data: makePage([item]) }));
  const id = await api.resolveWorkitemId(client, 'org1', 'sp1', 'GJBL-1');
  assert.equal(id, 'uuid-1');
});

test('UUID 路径：直接返回，不调用 searchWorkitems', async () => {
  const client = createMockClient();
  // post 不应被调用
  const id = await api.resolveWorkitemId(client, 'org1', 'sp1', '550e8400-e29b-41d4-a716-446655440000');
  assert.equal(id, '550e8400-e29b-41d4-a716-446655440000');
  assert.equal(client.post.mock?.calls?.length ?? 0, 0);
});

test('序列号未找到：抛出 NOT_FOUND', async () => {
  const client = createMockClient();
  mock.method(client, 'post', async () => ({ data: makePage([]) }));
  await assert.rejects(
    () => api.resolveWorkitemId(client, 'org1', 'sp1', 'GJBL-999'),
    (err) => { assert.equal(err.code, 'NOT_FOUND'); return true; }
  );
});
```

### 项目结构（本 Story 后预期状态）

```
src/
  api.js          ← 修改：添加 apiCall 包装，修复 resolveWorkitemId
test/
  api.test.js     ← 新建：覆盖所有 API 函数
  setup.js        ← 不变
  mock-example.test.js  ← 不变
  config.test.js  ← 不变
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.2] — 原始需求
- [Source: _bmad-output/implementation-artifacts/7-1-test-infrastructure.md] — Mock 策略文档（Strategy A）
- [Source: test/setup.js] — createMockClient、makePage、makeWorkitem、makeProject、makeSprint
- [Source: test/mock-example.test.js] — Strategy A 完整示例
- [Source: src/api.js] — 被测模块全文
- [Source: src/errors.js] — AppError / ERROR_CODE 定义

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- `src/api.js` 新增 `apiCall(fn)` 私有辅助函数，统一将 HTTP 401 响应转换为 `AppError(AUTH_FAILED)`；所有 13 个导出 API 函数均已通过 `apiCall` 包装。
- 修复 `resolveWorkitemId` 中的 bug：原代码将 `searchWorkitems` 返回的 `{ data, total }` 对象直接用 `(results || []).find(...)` 处理（Object 无 `.find` 方法），修复为先取 `response.data` 再调用 `.find()`。
- 创建 `test/api.test.js`：46 个 API 层测试用例，覆盖 14 个函数，含 401 错误转换验证和 axios wrapper 解包验证。
- `npm test` 结果：71 tests / 22 suites / 71 pass / 0 fail（含 Story 7.1 原有 25 个测试，无回归）。
- 代码审查：0 critical，0 major，3 minor（均为设计选择，已接受）。

### File List

- `src/api.js` — 修改：添加 `apiCall` 包装函数；所有导出函数改用 `apiCall`；修复 `resolveWorkitemId` 中 `response.data` 解包 bug
- `test/api.test.js` — 新建：46 个测试用例覆盖全部 14 个 API 函数
- `_bmad-output/implementation-artifacts/7-2-api-layer-tests.md` — 新建：Story 文件
