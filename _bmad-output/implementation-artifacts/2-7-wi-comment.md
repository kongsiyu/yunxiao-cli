# Story 2.7：wi comment 命令

Status: review

## Story

As an AI agent or team member,
I want to add a comment to a workitem,
So that I can document progress, questions, or decisions inline with the workitem.

## Acceptance Criteria

1. **Given** 执行 `wi comment <id> "Sprint review: completed" --json`
   **When** 命令运行
   **Then** 评论被成功添加，stdout 输出成功确认 JSON（含评论 ID 或工作项 ID）

2. **Given** 执行 `wi comment GJBL-1 "Fixed"`（序列号格式）
   **When** 命令运行
   **Then** CLI 通过 `resolveWorkitemId`（Story 2.1）解析序列号，成功添加评论

## Tasks / Subtasks

- [x] 实现 `wi comment <id> <content>` 命令（commands/workitem.js）(AC: #1, #2)
  - [x] 接受工作项 ID 或序列号（序列号通过 `resolveWorkitemId` 解析）
  - [x] 调用 `addComment(client, orgId, resolvedId, content)` API
  - [x] `--json` 模式输出 `{ success: true, id: ..., workitemId: ... }`
  - [x] 普通模式输出成功确认文字
- [x] 实现 `addComment` API 函数（api.js）(AC: #1)
  - [x] POST `/oapi/v1/projex/organizations/{orgId}/workitems/{workitemId}/comments`
  - [x] body: `{ content }`

## Dev Notes

### 实现说明

`wi comment` 命令及 `addComment` API 函数已在前序 Story 开发过程中随代码库一并实现，本 Story 正式确认其符合验收标准。

**命令位置**：`src/commands/workitem.js` line 229-242
```js
wi
  .command("comment <id> <content>")
  .description("Add a comment to a work item by ID or serial number")
  .option("-p, --project <id>", "Project ID (needed for serial number)")
  .action(withErrorHandling(async (id, content, opts) => {
    const spaceId = opts.project || defaultProjectId;
    const resolvedId = await resolveWorkitemId(client, orgId, spaceId, id);
    const result = await addComment(client, orgId, resolvedId, content);
    if (jsonMode) {
      printJson({ success: true, id: result.id || result, workitemId: resolvedId });
      return;
    }
    console.log(chalk.green("\n✓ Comment added! (id: " + (result.id || result) + ")\n"));
  }));
```

**API 位置**：`src/api.js` line 99-103
```js
export async function addComment(client, orgId, workitemId, content) {
  const url = `/oapi/v1/projex/organizations/${orgId}/workitems/${workitemId}/comments`;
  const res = await client.post(url, { content });
  return res.data;
}
```

### 技术约束

- ESM 模块，使用 `import` / `export`
- 序列号解析使用 Story 2.1 实现的 `resolveWorkitemId`（`src/api.js`）
- 错误处理通过 `withErrorHandling` wrapper 统一处理

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.7] — 验收标准
- [Source: _bmad-output/planning-artifacts/epics.md#FR6] — wi comment 功能需求
- [Source: _bmad-output/research/api-verification-v2.md] — API 路径验证

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- `wi comment <id> <content>` 命令已实现：使用 `resolveWorkitemId` 支持序列号，调用 `addComment` API，JSON 模式输出 `{ success, id, workitemId }`
- `addComment` API 函数已实现：POST 到 workitems/{id}/comments，body 含 content 字段
- 命令符合 AC#1（JSON 输出含成功确认和 ID）和 AC#2（序列号格式通过 resolveWorkitemId 解析）
- 代码审查修复：添加序列号查找时 spaceId 缺失的 guard（N1）；`result.id || result` 改为 `result?.id ?? resolvedId`（N3/N4）
- 编译验证通过（node --check）；单元测试 25/25 通过

### File List

- `src/api.js`（已有：addComment 函数 line 99-103）
- `src/commands/workitem.js`（已有：wi comment 命令 line 229-242）
- `_bmad-output/implementation-artifacts/2-7-wi-comment.md`（本文件，新建）
- `_bmad-output/implementation-artifacts/sprint-status.yaml`（状态更新）
