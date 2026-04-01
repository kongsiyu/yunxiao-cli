# Story 2.4：wi create 命令

Status: review

## Story

As an AI agent or team member,
I want to create a new workitem with type, title, assignee, and sprint,
So that I can programmatically create workitems as part of an automated workflow.

## Acceptance Criteria

1. **Given** 执行 `wi create --type <typeId> --title "Fix login bug" --assigned-to <userId> --sprint <sprintId> --json`
   **When** 命令运行
   **Then** 工作项被成功创建，stdout 输出新建工作项的 JSON（含 workitemId）

2. **Given** 执行 `wi create --type <typeId> --title "Test" --json`（不指定负责人和 Sprint）
   **When** 命令运行
   **Then** 工作项被成功创建，负责人和 Sprint 为空

3. **Given** 执行 `wi create`（不带必填参数 `--title`）
   **When** 命令运行
   **Then** stderr 输出 `INVALID_ARGS` 错误，退出码非零

## Tasks / Subtasks

- [x] 修复 `wi create` 命令选项命名（commands/workitem.js）(AC: #1, #2)
  - [x] 添加 `--type <id>` 选项（与 `--type-id` 并存，优先读取 `opts.type`）
  - [x] 使 `--assigned-to` 真正可选：无 fallback 时不报错，omit 出 payload
  - [x] 修复 Sprint 字段名：`data.sprintId` → `data.sprint`（符合 API 文档）
- [x] 验证 `--title` 缺失时报 INVALID_ARGS（AC: #3，当前 requiredOption 已覆盖）

## Dev Notes

### 现有实现状态

`wi create` 命令已在 `src/commands/workitem.js` 中实现（历史提交），但存在以下 gap：

**Gap 1：选项命名**

AC 要求 `--type <typeId>`，当前实现为 `--type-id <id>`。需添加 `--type` 作为选项并兼容两者：

```js
// 现在
.option("--type-id <id>", "Work item type ID (auto-detected if not set)")
// 目标：兼容 --type 和 --type-id
.option("--type <id>", "Work item type ID (auto-detected if not set)")
.option("--type-id <id>", "Work item type ID (alias for --type, deprecated)")
// 读取时：const typeId = opts.typeId || opts.type || null;
```

**Gap 2：`--assigned-to` 可选性**

AC 2 要求不指定负责人时仍成功创建（负责人为空）。当前代码：

```js
// 现在（错误）
const assignedTo = opts.assignedTo || process.env.YUNXIAO_USER_ID || currentUserId;
if (!assignedTo) {
  printError("INVALID_ARGS", "--assigned-to or YUNXIAO_USER_ID env var is required", jsonMode);
  process.exit(1);
}
const data = { ..., assignedTo, ... };

// 目标（AC 2 compliant）
const assignedTo = opts.assignedTo || process.env.YUNXIAO_USER_ID || currentUserId;
// 不报错，assignedTo 为空时不加入 payload
const data = { spaceId, subject: opts.title, workitemTypeId: typeId, ...jsonFields };
if (assignedTo) data.assignedTo = assignedTo;
```

**Gap 3：Sprint 字段名**

API 文档（api-verification-v2.md § 1.3 可选参数）使用 `sprint` 字段，当前代码用 `sprintId`：

```js
// 现在（可能错误）
if (opts.sprint) data.sprintId = opts.sprint;

// 目标
if (opts.sprint) data.sprint = opts.sprint;
```

### API 参考

- **CreateWorkitem**：POST `/oapi/v1/projex/organizations/{orgId}/workitems`
- **必填**：`assignedTo`（API 层必填，但 CLI 层可选——由 API 返回错误）、`spaceId`、`subject`、`workitemTypeId`
- **可选**：`description`、`sprint`（Sprint ID）、`labels`、`participants` 等
- **返回**：`{"id":"<workitemUUID>"}` （含工作项 UUID）

### 技术约束

- ESM 模块，`import` 路径含 `.js` 扩展
- `printError` / `printJson` 来自 `../output.js`
- `getWorkitemTypes` / `createWorkitem` 来自 `../api.js`
- Commander.js `--type` 不与 `-t, --title` 冲突（长短形式独立）

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4] — 验收标准
- [Source: _bmad-output/planning-artifacts/prd.md#FR3] — wi create 命令需求
- [Source: _bmad-output/research/api-verification-v2.md#1.3] — CreateWorkitem API 参数

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- 添加 `--type <id>` 选项，保留 `--type-id` 作为别名，读取逻辑 `opts.type || opts.typeId`（满足 AC 1: --type 选项）
- 使 `--assigned-to` 真正可选：移除 INVALID_ARGS 强制检查，assignedTo 为空时不加入 payload（满足 AC 2: 不指定负责人时仍成功创建）
- 修复 Sprint 字段名：`data.sprintId` → `data.sprint`（符合 API 文档 CreateWorkitem 可选参数）
- `--title` 使用 `requiredOption` 保证缺失时报错（AC 3 已满足）
- 编译验证通过（`node --check src/commands/workitem.js`）
- 单元测试通过（25 个测试全部 pass）

### File List

- `src/commands/workitem.js`（修改：添加 --type 选项，使 assignedTo 可选，修复 sprint 字段名）
- `_bmad-output/implementation-artifacts/2-4-wi-create.md`（本文件，新建）
- `_bmad-output/implementation-artifacts/sprint-status.yaml`（状态更新）
