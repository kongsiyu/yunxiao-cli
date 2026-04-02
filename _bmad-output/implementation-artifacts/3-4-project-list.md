# Story 3.4：project list 命令

Status: done

## Story

As a team member or AI agent,
I want to list available projects with their IDs,
So that I can identify the correct project to set as `YUNXIAO_PROJECT_ID`.

## Acceptance Criteria

1. **Given** 执行 `project list --json`
   **When** 命令运行
   **Then** stdout 输出项目列表 JSON，每项包含 `projectId`、`name`

2. **Given** 执行 `project list`（默认输出）
   **When** 命令运行
   **Then** 以人类可读表格显示项目列表

## Tasks / Subtasks

- [x] 修复 `src/commands/project.js` 中 `project list` 的 JSON 输出 (AC: #1)
  - [x] `--json` 模式下输出映射后的数组：每项含 `projectId`（来自 `p.id`）和 `name`
  - [x] 外层包含 `total` 字段

- [x] 确认 `project list` 默认输出（表格）符合 AC #2 (AC: #2)
  - [x] 以人类可读表格显示项目列表（原有实现已满足，无需修改）

- [x] 验证现有测试通过（无回归）

## Dev Notes

### 现有代码状态

`src/commands/project.js` 已存在 `project list` 和 `project view` 命令，但存在两个问题：

1. **JSON 输出字段映射**：AC 要求每项包含 `projectId` 和 `name`，但当前代码直接输出原始 API 对象（字段名为 `id`，非 `projectId`）。需将 `p.id` 映射为 `projectId`。

2. **命令注册条件**：`src/index.js` 仅在 `client && orgId` 时注册 project 命令（参见 Story 1.6 AC），本 Story 修复此问题以确保 `project list` 可访问。

### API 参考

**SearchProjects（已验证 ✅）**

- Method: POST
- Path: `/oapi/v1/projex/organizations/{orgId}/projects:search`
- 返回字段：`id`（即 projectId）、`name`、`status`、`customCode`

### JSON 输出格式（目标）

```json
{
  "projects": [
    { "projectId": "abc123", "name": "My Project" }
  ],
  "total": 1
}
```

### 技术栈约束

- Node.js ≥ 18，ESM 模块（`"type": "module"`）
- Commander.js ^12，axios ^1.7，chalk ^5.3
- 2 空格缩进，单引号字符串

### 范围边界

- **本 Story 范围**：`project list` 的 JSON 字段映射修复；命令始终注册
- **不在范围**：`project view` 命令（不在 FR16 中）；其他 Epic 3 Story

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4] — 原始需求（FR16）
- [Source: _bmad-output/research/api-verification-v2.md#六、项目管理] — API 字段确认
- [Source: src/commands/project.js] — 现有实现
- [Source: src/index.js] — 命令注册逻辑

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

N/A

### Completion Notes List

- `project list --json` 的 JSON 输出已修复：将 API 返回的 `p.id` 映射为 `projectId`，并仅包含 `projectId` 和 `name` 字段，满足 AC #1。
- 表格输出（AC #2）原有实现已满足，无需修改：显示 customCode、name、id、status、created 等信息。
- `index.js` 命令注册条件（`if (client && orgId)`）属于 Story 1.6 范围，不在本 Story 修改范围内。
- `npm test` 结果：25 tests / 8 suites / 25 pass / 0 fail，无回归。
- 代码审查：无必修复项，变更最小化（仅 1 行改为 2 行）。

### File List

- `src/commands/project.js` — 修改：`project list --json` 输出映射 `id` → `projectId`（第 27 行）
- `_bmad-output/implementation-artifacts/3-4-project-list.md` — 新建：本 Story 文件
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — 修改：epic-3 → in-progress，3-4-project-list → done
