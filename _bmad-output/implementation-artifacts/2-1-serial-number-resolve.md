# Story 2.1：序列号解析核心逻辑修复

Status: review

## Story

As a developer,
I want `resolveWorkitemId` to use full-type search with `serialNumber` exact matching,
So that `GJBL-1` format reliably resolves to the correct workitem UUID for all subsequent commands.

## Acceptance Criteria

1. **Given** 调用 `resolveWorkitemId("GJBL-1")`
   **When** 执行解析
   **Then** 使用 `searchWorkitems` API 搜索全类型（`Req,Task,Bug`），在结果中精确匹配 `serialNumber === "GJBL-1"` 的工作项

2. **Given** 序列号对应的工作项不存在
   **When** 执行解析
   **Then** 抛出 `NOT_FOUND` 错误，错误信息包含序列号

3. **Given** 序列号格式输入（含前缀字母）
   **When** `resolveWorkitemId` 被调用
   **Then** 正确区分序列号格式（`GJBL-1`）与 UUID 格式，UUID 格式直接返回，序列号格式触发搜索

## Tasks / Subtasks

- [x] 修复 `resolveWorkitemId` 函数（api.js）(AC: #1, #2, #3)
  - [x] 序列号格式检测：保留 `^[A-Z]+-\d+$` 匹配逻辑，其余视为 UUID 直接返回
  - [x] 搜索改为全类型：使用 `category: "Req,Task,Bug"` 而非默认 `"Req"`
  - [x] 搜索策略：`perPage: 50`，在结果中精确匹配 `item.serialNumber === identifier`（大小写不敏感）
  - [x] 未找到时抛出 `AppError(ERROR_CODE.NOT_FOUND, ...)`（使用 errors.js）
- [x] 修复 `searchWorkitems` 默认 category（api.js）
  - [x] 将默认值从 `"Req"` 改为 `"Req,Task,Bug"`（FR27 要求）
- [x] 修复 `wi view` 命令中的内联序列号查找（commands/workitem.js）
  - [x] 使用 `resolveWorkitemId` 替换内联搜索逻辑
  - [x] 移除 `view` 命令中多余的 `-c, --category` 选项（序列号解析已全类型搜索）

## Dev Notes

### 当前问题（api.js resolveWorkitemId）

```js
// 问题 1：用 subject 关键字搜索（不精确），而非 serialNumber 精确匹配
const result = await searchWorkitems(client, orgId, spaceId, {
  subject: number,   // ← 错误：搜索 subject 字段，非 serialNumber
  page: 1,
  perPage: 1         // ← 危险：perPage: 1 可能跳过目标
});
// 问题 2：category 未设置，searchWorkitems 默认 "Req"，会漏掉 Task/Bug
// 问题 3：错误类型为 new Error()，而非 AppError(NOT_FOUND)
throw new Error(`Workitem ${identifier} not found`);
```

### 修复后的预期行为

```js
// 序列号格式：精确匹配 serialNumber 字段
const results = await searchWorkitems(client, orgId, spaceId, {
  category: "Req,Task,Bug",   // 全类型搜索
  page: 1,
  perPage: 50                 // 扩大窗口确保能找到
});
const match = (results || []).find(i =>
  i.serialNumber?.toUpperCase() === identifier.toUpperCase()
);
if (!match) {
  throw new AppError(ERROR_CODE.NOT_FOUND, `Workitem ${identifier} not found`);
}
return match.id;
```

### 影响范围

`resolveWorkitemId` 被以下命令使用：
- `wi update <id>`
- `wi delete <id>`
- `wi comment <id>`
- `wi comments <id>`

`wi view` 目前未使用 `resolveWorkitemId`，有内联搜索逻辑，也需要修复。

### 技术约束

- 现有 `AppError` 和 `ERROR_CODE` 定义在 `src/errors.js`，直接使用
- ESM 模块，使用 `import { AppError, ERROR_CODE } from '../errors.js'`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] — 验收标准
- [Source: _bmad-output/planning-artifacts/prd.md#FR27] — resolveWorkitemId 全类型搜索要求
- [Source: _bmad-output/research/api-verification-v2.md#九] — wi view serialNumber 解析方案确认

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- 修复 `resolveWorkitemId`：使用全类型搜索（`Req,Task,Bug`）+ `serialNumber` 精确匹配，perPage 从 1 扩大到 50，错误类型改为 `AppError(ERROR_CODE.NOT_FOUND)`
- 修复 `searchWorkitems` 默认 category：`"Req"` → `"Req,Task,Bug"`（FR27 要求）
- 简化 `wi view` 命令：使用 `resolveWorkitemId` 替换内联序列号搜索逻辑，移除多余的 `-c, --category` 选项
- 编译验证通过（`node src/index.js --help`）
- 单元测试通过（11 个测试全部 pass）

### File List

- `src/api.js`（修改：import errors.js，修复 searchWorkitems 默认 category，重写 resolveWorkitemId）
- `src/commands/workitem.js`（修改：wi view 使用 resolveWorkitemId，移除内联搜索）
- `_bmad-output/implementation-artifacts/2-1-serial-number-resolve.md`（本文件，新建）
- `_bmad-output/implementation-artifacts/sprint-status.yaml`（状态更新）
