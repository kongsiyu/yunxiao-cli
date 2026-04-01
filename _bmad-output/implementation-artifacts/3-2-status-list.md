# Story 3.2：status list 命令

Status: review

## Story

As an AI agent,
I want to list workflow statuses for a workitem type,
So that I can obtain the correct `statusId` before updating a workitem.

## Acceptance Criteria

1. **Given** 执行 `status list --type-id <workitemTypeId> --json`
   **When** 命令运行
   **Then** stdout 输出该工作项类型的所有工作流状态 JSON，每项包含 `statusId`、`name`

2. **Given** 执行 `status list --category Bug --json`（便捷模式）
   **When** 命令运行
   **Then** CLI 自动查询 Bug 类型的 typeId，再查询对应状态，一步完成两步依赖

## Tasks / Subtasks

- [x] 在 `api.js` 中添加 `getWorkitemWorkflow` 函数 (AC: #1, #2)
  - [x] GET `/oapi/v1/projex/organizations/{orgId}/projects/{projectId}/workitemTypes/{typeId}/workflows`
  - [x] 返回 `workflow` 对象（含 `defaultStatusId` 和 `statuses` 数组）
- [x] 创建 `src/commands/status.js` 命令文件 (AC: #1, #2)
  - [x] `status list --type-id <id>` 直接模式：调用 `getWorkitemWorkflow`
  - [x] `status list --category <type>` 便捷模式：先 `getWorkitemTypes` 取 typeId，再 `getWorkitemWorkflow`
  - [x] JSON 模式输出 `{ statuses: [...], total: n }`，每项含 `id`、`name`、`displayName`
  - [x] 人类可读模式：以表格显示状态列表，标注 `[default]`
- [x] 在 `src/index.js` 中注册 `registerStatusCommands` (AC: #1, #2)

## Dev Notes

### API 端点

来自 `_bmad-output/research/api-verification-v2.md` § 4.2：

```
GET /oapi/v1/projex/organizations/{orgId}/projects/{projectId}/workitemTypes/{workitemTypeId}/workflows
返回：{ defaultStatusId, statuses: [{ id, name, nameEn, displayName }] }
```

### 实现要点

- `--type-id` 和 `--category` 二选一，都不传则报 `INVALID_ARGS`
- `--category` 便捷模式：调用 `getWorkitemTypes(client, orgId, projectId, category)`，取 `defaultType` 或第一个
- JSON 输出字段：`statuses`（数组）、`total`（数量）
- 每条 status 包含 `id`（statusId）、`name`、`displayName`

### 技术约束

- ESM 模块，`import` 语法
- 命令注册函数签名与现有模式一致：`registerStatusCommands(program, client, orgId, defaultProjectId, withErrorHandling, jsonMode)`
- `index.js` 中需同步注册（避免条件注册问题）

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2] — 验收标准
- [Source: _bmad-output/planning-artifacts/prd.md#FR13] — status list 需求
- [Source: _bmad-output/research/api-verification-v2.md#4.2] — GetWorkitemWorkflow API

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- 新增 `getWorkitemWorkflow(client, orgId, projectId, typeId)` 到 `api.js`，调用 GetWorkitemWorkflow 端点
- 创建 `src/commands/status.js`，实现 `status list` 命令，支持 `--type-id` 直接模式和 `--category` 便捷模式
- `--category` 便捷模式：自动调用 `getWorkitemTypes` 获取 defaultType，再调用 `getWorkitemWorkflow`
- JSON 输出字段：`{ statuses, total }`；人类模式标注 `[default]` 状态
- 在 `index.js` 注册 `registerStatusCommands`，同时修复了未认证路径中 "statuss" 描述拼写问题
- 编译验证通过（`node src/index.js --help`）
- 单元测试通过（25 个测试全部 pass）

### File List

- `src/api.js`（修改：新增 `getWorkitemWorkflow` 函数）
- `src/commands/status.js`（新建：`registerStatusCommands`，`status list` 命令）
- `src/index.js`（修改：导入并注册 `registerStatusCommands`，修复描述拼写）
- `_bmad-output/implementation-artifacts/3-2-status-list.md`（本文件，新建）
- `_bmad-output/implementation-artifacts/sprint-status.yaml`（状态更新）
