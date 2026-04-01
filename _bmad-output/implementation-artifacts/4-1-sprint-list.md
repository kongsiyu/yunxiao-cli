# Story 4.1：sprint list 命令

Status: review

## Story

As an AI agent or team member,
I want to list sprints with status filtering,
So that I can identify the current active sprint ID before querying its workitems.

## Acceptance Criteria

1. **Given** 执行 `sprint list --json`
   **When** 命令运行
   **Then** stdout 输出 Sprint 列表 JSON，API 路径使用 `/projects/{id}/sprints`（projectId 在路径中）

2. **Given** 执行 `sprint list --status DOING --json`
   **When** 命令运行
   **Then** 只返回状态为 DOING 的 Sprint

3. **Given** 旧实现中 projectId 在查询参数中传入
   **When** 使用新实现
   **Then** projectId 在 URL 路径中传入（修复 Bug）

## Tasks / Subtasks

- [x] 修复 `listSprints` API 路径（src/api.js）(AC: #1, #3)
  - [x] 将 URL 从 `/oapi/v1/projex/organizations/${orgId}/sprints` 改为 `/oapi/v1/projex/organizations/${orgId}/projects/${projectId}/sprints`
  - [x] 移除 `spaceId` query 参数（已移至路径）
- [x] 更新 sprint.js 状态颜色函数（src/commands/sprint.js）(AC: #2)
  - [x] 将状态值从 active/future/closed 改为 TODO/DOING/ARCHIVED
- [x] 为 listSprints 编写测试（test/sprint.test.js）
  - [x] 验证 GET 请求路径含 projectId
  - [x] 验证 --status 过滤参数正确传递
  - [x] 验证返回 sprint 列表

## Dev Notes

### Bug 位置（api.js listSprints）

```js
// 当前（错误）：projectId 作为 query 参数
export async function listSprints(client, orgId, projectId, opts = {}) {
  const url = `/oapi/v1/projex/organizations/${orgId}/sprints`;
  const res = await client.get(url, {
    params: { spaceId: projectId, ... }
  });
}

// 修复后：projectId 在路径中
export async function listSprints(client, orgId, projectId, opts = {}) {
  const url = `/oapi/v1/projex/organizations/${orgId}/projects/${projectId}/sprints`;
  const res = await client.get(url, {
    params: { page: opts.page || 1, perPage: opts.perPage || 20, status: opts.status }
  });
}
```

### API 参数（来自 api-verification-v2.md 3.1）

- **Path:** `/oapi/v1/projex/organizations/{orgId}/projects/{projectId}/sprints`
- **Method:** GET
- **可选参数:** `status`（TODO/DOING/ARCHIVED）、`page`、`perPage`
- **返回字段:** `id`、`name`、`status`、`startDate`、`endDate`、`owners`

### 状态值说明

API 实际返回的状态值为 `TODO/DOING/ARCHIVED`，sprint.js 中的 statusColor 函数需更新以反映实际值。

### References

- [Source: _bmad-output/research/api-verification-v2.md#3.1] — Sprint List API 确认路径
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1] — 原始需求
- [Source: src/api.js#listSprints] — 当前错误实现

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- 修复 `listSprints` API 路径：URL 从 `/organizations/{orgId}/sprints` 改为 `/organizations/{orgId}/projects/{projectId}/sprints`，移除错误的 `spaceId` query 参数
- 更新 `statusColor` 函数：状态值从 active/future/closed 修正为 API 实际返回的 TODO/DOING/ARCHIVED
- 更新 `--status` 选项描述文字以反映正确的状态值
- 新增 `test/sprint.test.js`：5 个测试，全部通过（总计 30 tests pass）
- 编译验证通过（`node src/index.js --help`）

### File List

- `src/api.js`（修改：listSprints 路径修复，移除 spaceId query 参数）
- `src/commands/sprint.js`（修改：statusColor 状态值修正，--status 描述更新）
- `test/sprint.test.js`（新建：listSprints 5 项测试）
- `_bmad-output/implementation-artifacts/4-1-sprint-list.md`（本文件，新建）
- `_bmad-output/implementation-artifacts/sprint-status.yaml`（状态更新）
