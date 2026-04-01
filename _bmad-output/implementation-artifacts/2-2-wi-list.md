# Story 2.2：wi list 命令

Status: ready-for-dev

## Story

As an AI agent or team member,
I want to list workitems with flexible filtering options,
So that I can find the right workitems to act on without manual browsing.

## Acceptance Criteria

1. **Given** 有效认证信息，执行 `wi list --sprint <sprintId> --category Bug --json`
   **When** 命令运行
   **Then** stdout 输出合法 JSON，包含符合过滤条件的工作项列表和 `total` 字段

2. **Given** 执行 `wi list --assigned-to me --json`
   **When** 命令运行
   **Then** CLI 调用 whoami API 获取当前用户 userId，用该 userId 过滤工作项

3. **Given** 执行 `wi list`（不带 `--category`）
   **When** 命令运行
   **Then** 默认查询 category 为 `"Req,Task,Bug"`（不仅限于 "Req"）

4. **Given** 执行 `wi list --limit 5`
   **When** 命令运行
   **Then** 返回最多 5 条工作项，`--json` 模式下 `total` 字段反映实际总条数（来自 `x-total` 响应头，非当前页 items 数量）

5. **Given** 默认执行 `wi list`（不带 `--limit`）
   **When** 命令运行
   **Then** 默认返回最多 20 条工作项

## Tasks / Subtasks

- [ ] 修改 `searchWorkitems`（api.js）返回 `{ items, total }` 格式 (AC: #1, #4)
  - [ ] 将 `res.data` 作为 `items`（数组），从 `res.headers['x-total']` 提取 total
  - [ ] fallback：若无 `x-total` header，则 `total = (res.data || []).length`
  - [ ] 将返回值由 `res.data` 改为 `{ items: res.data, total }`

- [ ] 更新 `resolveWorkitemId`（api.js）适配新的返回格式 (AC: #1)
  - [ ] 将 `(results || []).find(...)` 改为 `(results.items || []).find(...)`

- [ ] 修复 `wi list` 命令（commands/workitem.js）— `total` 字段 (AC: #1, #4)
  - [ ] 将 `const items = await searchWorkitems(...)` 改为解构 `const { items, total } = await searchWorkitems(...)`
  - [ ] `printJson({ items: items || [], total })` 使用从 API 返回的 total

- [ ] 实现 `--assigned-to me` 解析（commands/workitem.js）(AC: #2)
  - [ ] 在 action 函数开头检测 `opts.assignedTo === 'me'`
  - [ ] 若是 `'me'`，使用 `currentUserId`（已由 index.js 传入）
  - [ ] 若 `currentUserId` 为 null（认证失败/未获取到），抛出 `INVALID_ARGS` 错误
  - [ ] 将解析后的 userId 传入 `searchWorkitems` 的 `assignedTo` 参数

- [ ] 验证默认行为（AC: #3, #5）
  - [ ] 确认 `category` 默认值已为 `"Req,Task,Bug"`（Story 2.1 已修复）
  - [ ] 确认 `--limit` 默认值为 20

- [ ] 更新 mock 示例测试（test/mock-example.test.js）适配新格式
  - [ ] 测试中 `result.data[0]` 改为 `result.items[0]`
  - [ ] 更新 Strategy A 中对 `searchWorkitems` 返回值的断言

## Dev Notes

### 当前代码状态

`wi list` 命令已存在于 `src/commands/workitem.js`（第 23-76 行），`searchWorkitems` 已存在于 `src/api.js`（第 40-79 行）。Story 2.1 已修复 category 默认值。

**需要修复的问题：**

#### 问题 1：`total` 使用当前页数量而非实际总数

当前代码（workitem.js 第 62 行）：
```js
printJson({ items: items || [], total: (items || []).length });
```

问题：`items.length` 是当前页返回数量（最多 perPage 条），而非服务端 `x-total` 表示的实际总数。
修复：`searchWorkitems` 从 `res.headers['x-total']` 提取 total，并随 items 一起返回。

#### 问题 2：`--assigned-to me` 未解析

当前代码（workitem.js 第 48-49 行）：
```js
assignedTo: opts.assignedTo,   // 直接传 "me" 字符串到 API，API 不识别
```

修复：检测 `opts.assignedTo === 'me'`，替换为 `currentUserId`。

### 修复方案

#### api.js — searchWorkitems 返回格式变更

```js
export async function searchWorkitems(client, orgId, spaceId, opts = {}) {
  // ... 构建 body 逻辑不变 ...
  const res = await client.post(url, body);
  const total = parseInt(res.headers?.['x-total'] ?? (Array.isArray(res.data) ? res.data.length : 0), 10);
  return { items: res.data, total };
}
```

#### api.js — resolveWorkitemId 适配

```js
// 原来：const results = await searchWorkitems(...)
//       const match = (results || []).find(...)
// 修复：
const { items } = await searchWorkitems(client, orgId, spaceId, {
  category: "Req,Task,Bug",
  page: 1,
  perPage: 50,
});
const match = (items || []).find(
  (i) => i.serialNumber?.toUpperCase() === serialNumber
);
```

#### commands/workitem.js — wi list action 修复

```js
// 解构获取 items + total
const { items, total } = await searchWorkitems(client, orgId, spaceId, {
  category: opts.category,
  // ...其他 opts...
});

// --assigned-to me 解析（在 searchWorkitems 调用前）
let assignedToId = opts.assignedTo;
if (assignedToId === 'me') {
  if (!currentUserId) {
    printError("INVALID_ARGS", "Cannot resolve 'me': current user ID unavailable", jsonMode);
    process.exit(1);
  }
  assignedToId = currentUserId;
}

// JSON 输出使用 API 返回的 total
if (jsonMode) {
  printJson({ items: items || [], total });
  return;
}
```

### 影响范围分析

修改 `searchWorkitems` 返回格式会影响：
- `resolveWorkitemId`（api.js）— 需改为使用 `.items`，**必须同步修改**
- `wi list` 命令（workitem.js）— 主要修改目标
- 其他命令（`wi view`、`wi update` 等）**不直接调用** `searchWorkitems`，仅通过 `resolveWorkitemId`，间接受影响但由上面已覆盖
- `test/mock-example.test.js` 的 Strategy A 测试（第 46-49 行）— 需更新断言

### 技术约束

- ESM 模块，`import` 语法
- `currentUserId` 已由 `src/index.js` 传入 `registerWorkitemCommands`（第 6 个参数）
- `axios` response 对象：`res.data`（body）、`res.headers`（headers，全部小写 key）
- `x-total` header 为字符串，需 `parseInt()`
- 测试使用 node:test + Strategy A mock（mock `client.post`）

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2] — 验收标准
- [Source: _bmad-output/research/api-verification-v2.md#1.1] — SearchWorkitems 分页 Header x-total
- [Source: _bmad-output/implementation-artifacts/2-1-serial-number-resolve.md] — resolveWorkitemId 实现
- [Source: src/commands/workitem.js#L23-76] — wi list 当前实现
- [Source: src/api.js#L40-79] — searchWorkitems 当前实现
- [Source: src/index.js#L93] — currentUserId 传参

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- 修改 `searchWorkitems`（api.js）返回 `{ items, total }` 格式：items 来自 `res.data`（支持数组和 `{ data: [...] }` 两种格式），total 优先从 `x-total` 响应头提取，fallback 到 `rawData.total`，最终 fallback 到 `items.length`；加 `|| 0` 防护 `NaN`
- 更新 `resolveWorkitemId`（api.js）使用解构 `{ items: results }` 适配新格式
- 修复 `wi list` 命令（workitem.js）：解构使用 `{ items, total }`，`printJson` 使用 API 返回的真实 total
- 实现 `--assigned-to me`：检测 `opts.assignedTo === 'me'` 替换为 `currentUserId`，currentUserId 为 null 时输出 INVALID_ARGS 错误
- 更新 `test/mock-example.test.js` Strategy A 测试：`result.data[0]` → `result.items[0]` 适配新格式
- 编译验证通过（`node src/index.js --help`）
- 单元测试通过（25 个测试全部 pass）
- 代码审查通过（无关键问题，修复 parseInt NaN 防护）

### File List

- `src/api.js`（修改：searchWorkitems 返回 { items, total }，resolveWorkitemId 适配）
- `src/commands/workitem.js`（修改：wi list 使用新格式，实现 --assigned-to me）
- `test/mock-example.test.js`（修改：更新 Strategy A 断言）
- `_bmad-output/implementation-artifacts/2-2-wi-list.md`（新建，Story 文件）
- `_bmad-output/implementation-artifacts/sprint-status.yaml`（更新：2-2 状态 backlog → done）
