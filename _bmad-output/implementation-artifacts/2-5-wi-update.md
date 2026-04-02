# Story 2.5：wi update 命令

Status: done

## Story

As an AI agent or team member,
I want to update a workitem's status, assignee, or sprint,
So that I can automate workitem lifecycle management.

## Acceptance Criteria

1. **Given** 执行 `wi update <id> --status <statusId> --json`
   **When** 命令运行
   **Then** 工作项状态被更新，stdout 输出更新后工作项的 JSON

2. **Given** 执行 `wi update GJBL-1 --assigned-to <userId>`（序列号格式）
   **When** 命令运行
   **Then** CLI 通过 `resolveWorkitemId`（Story 2.1）解析序列号，成功更新负责人

3. **Given** 执行 `wi update <id> --sprint <sprintId> --json`
   **When** 命令运行
   **Then** 工作项的 Sprint 关联被更新

## Tasks / Subtasks

- [x] 将 worktree 分支 rebase 到 master（获取 story 2-4 修复）(前置)
- [x] 修复 sprint 字段名：`fields.sprintId` → `fields.sprint`（src/commands/workitem.js）(AC: #3)
- [x] 确认 JSON 模式返回更新后完整工作项（已在 worktree 改动，验证正确性）(AC: #1)
- [x] 确认序列号解析正常工作（resolveWorkitemId 已在 Story 2.1 实现）(AC: #2)

## Dev Notes

### 现有实现状态

`wi update` 命令已在 `src/commands/workitem.js` 中完整实现（历史提交已建立），worktree 当前有一处未提交改动：

```js
// 改动前（master）
if (jsonMode) {
  printJson({ success: true, id: resolvedId });
  return;
}
// 改动后（worktree 当前）
if (jsonMode) {
  const updated = await getWorkitem(client, orgId, resolvedId);
  printJson(updated);
  return;
}
```

该改动满足 AC 1：`stdout 输出更新后工作项的 JSON`。

### 关键 Bug（须修复）

**Sprint 字段名错误：**

API 文档（api-verification-v2.md § 1.4）明确：`{"sprint":"sprintId"}`，但当前 `wi update` 代码：

```js
// 现在（错误）
if (opts.sprint) fields.sprintId = opts.sprint;

// 目标（正确）
if (opts.sprint) fields.sprint = opts.sprint;
```

注：story 2-4 已在 `wi create` 中修复相同问题（`data.sprintId` → `data.sprint`）。

### 分支 Rebase 前置操作

当前 worktree 分支基于 `4b56d98`（story/7-1-test-infrastructure 合并），master 已推进到 `981e1f5`。Rebase 步骤：

```bash
cd $BACKEND_ROOT  # worktree 目录
git stash         # 暂存当前改动
git rebase master
git stash pop     # 还原改动
```

Rebase 后，`wi create` 中的 sprint fix 和 `--type` 选项等改动将进入本分支。

### API 参考

- **UpdateWorkitem**：PUT `/oapi/v1/projex/organizations/{orgId}/workitems/{id}`
- **Body 格式**：`{"fieldId":"value"}` 键值对形式
  - 更新状态：`{"status":"<statusId>"}`
  - 更新负责人：`{"assignedTo":"<userId>"}`
  - 更新 Sprint：`{"sprint":"<sprintId>"}`
- **返回**：无（HTTP 200/204），须额外调用 `getWorkitem` 获取更新后数据
- **GetWorkitem**：GET `/oapi/v1/projex/organizations/{orgId}/workitems/{id}`，返回工作项完整对象

### 技术约束

- ESM 模块，`import` 路径含 `.js` 扩展
- `printError` / `printJson` 来自 `../output.js`
- `updateWorkitem` / `getWorkitem` 来自 `../api.js`（已导入）
- `resolveWorkitemId` 来自 `../api.js`（已在命令中使用）
- jsonMode 变量在 `registerWorkitemCommands` 函数顶部作用域定义

### 前置故事智能（Story 2.4 经验）

来自 2-4-wi-create.md 的关键经验：
- Sprint 字段名是 `sprint`（不是 `sprintId`），已在 create 中修复
- `--extra-json` 选项可合并额外字段，已在 update 中实现
- Commander.js `opts.assignedTo` 对应 `--assigned-to`（驼峰自动转换）

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5] — 验收标准
- [Source: _bmad-output/planning-artifacts/prd.md#FR4] — wi update 命令需求
- [Source: _bmad-output/research/api-verification-v2.md#1.4] — UpdateWorkitem API 参数

### Review Findings

- [x] [Review][Defer] getWorkitem failure after successful updateWorkitem surfaces misleading error [src/commands/workitem.js:228] — deferred, pre-existing acceptable design trade-off; update already committed, user can `wi view` to confirm
- [x] [Review][Defer] console.log 使用原始 `id` 而非 `resolvedId` [src/commands/workitem.js:232] — deferred, pre-existing issue across multiple commands
- [x] [Review][Defer] getWorkitem 额外 GET 在高并发下存在 TOCTOU race [src/commands/workitem.js:228] — deferred, CLI 场景极少并发，超出本 Story 范围
- [x] [Review][Defer] defaultProjectId 为 undefined 时序列号解析可能失败 [src/commands/workitem.js:204] — deferred, pre-existing issue across all serial-number commands

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- 分支 rebase 到 master（commit 981e1f5），获取 story 2-4 的 sprint 字段修复和 --type 选项
- 修复 sprint 字段名：`fields.sprintId` → `fields.sprint`，与 API 文档 UpdateWorkitem body 格式一致（AC #3）
- JSON 模式改为调用 `getWorkitem` 返回更新后完整工作项（AC #1）
- `resolveWorkitemId` 在 update 命令 action 中第 205 行已调用，序列号解析正常（AC #2）
- 新增 `test/wi-update.test.js`：11 个测试，覆盖 sprint 字段名、status/assignedTo 字段、URL 正确性、JSON 模式流程、resolveWorkitemId 集成
- 全套 142 个测试通过，0 失败

### File List

- `src/commands/workitem.js`（修改：修复 sprint 字段名 `fields.sprintId` → `fields.sprint`；JSON 模式返回完整工作项）
- `test/wi-update.test.js`（新建：wi update 命令层测试）
- `_bmad-output/implementation-artifacts/2-5-wi-update.md`（本文件，新建）
- `_bmad-output/implementation-artifacts/sprint-status.yaml`（状态更新）
