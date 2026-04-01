# Story 4.2：sprint view 命令

Status: review

## Story

As an AI agent or team member,
I want to view sprint details including workitem completion statistics,
So that I can assess sprint progress before deciding on workitem actions.

## Acceptance Criteria

1. **Given** 执行 `sprint view <sprintId> --json`
   **When** 命令运行
   **Then** stdout 输出 Sprint 基本信息（名称、起止日期、状态）+ 工作项完成统计（总数、已完成数、各类型分布）

2. **Given** GetSprintInfo API 调用失败
   **When** 执行 `sprint view <sprintId>`
   **Then** 命令完全失败，stderr 输出错误信息，退出码非零（不返回部分数据）

3. **Given** SearchWorkitems API 调用失败
   **When** 执行 `sprint view <sprintId>`
   **Then** 命令完全失败，stderr 输出错误信息，退出码非零（不返回部分数据）

## Tasks / Subtasks

- [x] 新增 `getSprintInfo` API 函数 (AC: #2)
  - [x] 在 `src/api.js` 添加：GET `/oapi/v1/projex/organizations/{orgId}/projects/{projectId}/sprints/{sprintId}`
  - [x] 函数签名：`getSprintInfo(client, orgId, projectId, sprintId)`

- [x] 重写 `sprint view` 命令 (AC: #1, #2, #3)
  - [x] 调用 `getSprintInfo` 获取 Sprint 基本信息（替换原来的 listSprints 过滤方案）
  - [x] 调用 `searchWorkitems`（sprint 过滤，perPage: 100）获取 Sprint 内工作项列表
  - [x] 两次 API 调用均不捕获错误（交由 withErrorHandling 处理），确保任一失败时命令完全失败
  - [x] 计算统计数据：total（总数）、done（已完成数，status.done===true 或 status.stage==="DONE"）、各类型分布（按 workitemType.name 或 category 分组）
  - [x] `--json` 模式：stdout 输出包含 `sprint`（基本信息）和 `stats`（统计）的 JSON 对象
  - [x] 普通模式：输出人类可读格式（Sprint 信息 + 完成统计表格）

- [x] 添加 API 层单元测试 (AC: #1)
  - [x] `test/sprint.test.js`：mock client.get，验证 `getSprintInfo` 调用正确路径并返回 sprint 对象

## Dev Notes

### API 信息

**GetSprintInfo**
- Method: GET
- Path: `/oapi/v1/projex/organizations/{orgId}/projects/{projectId}/sprints/{sprintId}`
- 返回字段: `id`、`name`、`status`、`startDate`、`endDate`、`capacityHours` 等完整 Sprint 对象
- 来源: `_bmad-output/research/api-verification-v2.md#3.2`

**SearchWorkitems（sprint 过滤）**
- 使用已有 `searchWorkitems` 函数，传入 `opts.sprint = sprintId`
- Path: `/oapi/v1/projex/organizations/{orgId}/workitems:search`
- 工作项中与完成状态相关字段：`status.done`（boolean，若存在）或 `status.stage`（"DONE"/"DOING"/"UNSTARTED"）

### "已完成"判断策略

由于不同项目的 statusId 不同，通过以下优先级判断：
1. `item.status?.done === true`（若 API 返回 boolean done 字段）
2. `item.status?.stage?.toUpperCase() === 'DONE'`（若 API 返回 stage 字段）
3. 降级：status 对象 name 字段含 "完成"/"done"（i）
4. 无法判断时 done=0，在 Dev Notes 中记录

**注意**：`perPage: 100` 仅获取前 100 条。若 Sprint 工作项超过 100，统计数据仅基于前 100 条（在输出中注明）。

### JSON 输出 Schema

```json
{
  "sprint": {
    "id": "sprint-id",
    "name": "Sprint 1",
    "status": "DOING",
    "startDate": "2025-01-01",
    "endDate": "2025-01-14"
  },
  "stats": {
    "total": 10,
    "done": 4,
    "byCategory": {
      "Req": 5,
      "Task": 3,
      "Bug": 2
    }
  }
}
```

### 现有代码注意事项

- `sprint view` 当前实现使用 `listSprints(perPage: 100)` 过滤，需完全替换为 `getSprintInfo`
- `withErrorHandling` 在 `src/index.js` 定义，已处理 `AppError`、axios 响应错误和通用错误 → 命令层无需额外 try-catch
- `listSprints` URL 目前仍有 Bug（Story 4-1 修复），但 `sprint view` 重写后不再依赖 `listSprints`

### 技术约束

- ESM 模块（`"type": "module"`），import 需带 `.js` 后缀
- 2 空格缩进，单引号字符串
- 不引入新依赖
- 测试使用 `node:test` + `node:assert/strict`，参考 Strategy A（mock client.get）

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2] — 验收标准
- [Source: _bmad-output/research/api-verification-v2.md#3.2] — GetSprintInfo API
- [Source: src/api.js] — 已有 API 函数参考
- [Source: src/commands/sprint.js] — 当前 sprint 命令实现
- [Source: test/setup.js] — mock helper（createMockClient、makeSprint）
