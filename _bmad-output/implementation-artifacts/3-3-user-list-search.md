# Story 3.3：user list / user search 命令

Status: review

## Story

As an AI agent,
I want to list and search project members,
So that I can obtain the correct `userId` before assigning a workitem.

## Acceptance Criteria

1. **Given** 执行 `user list --json`
   **When** 命令运行
   **Then** stdout 输出项目成员列表 JSON，每项包含 `userId`、`name`

2. **Given** 执行 `user search "张三" --json`
   **When** 命令运行
   **Then** stdout 输出包含"张三"的成员列表 JSON（按关键字过滤）

3. **Given** 执行 `user search "不存在的人" --json`
   **When** 命令运行
   **Then** stdout 输出空数组 `[]`，退出码 0

## Tasks / Subtasks

- [x] 在 `src/api.js` 中新增 `listProjectMembers` 函数 (AC: #1, #2, #3)
  - [x] Method: GET，Path: `/oapi/v1/projex/organizations/{orgId}/projects/{projectId}/members`
  - [x] 支持可选 `name`、`roleId`、`perPage` 参数
  - [x] 返回成员列表数组

- [x] 新建 `src/commands/query.js` 实现 `user` 子命令 (AC: #1, #2, #3)
  - [x] `user list`：调用 `listProjectMembers`，输出成员列表，支持 `--limit`
  - [x] `user search <keyword>`：传 `name` 参数过滤，空结果输出空数组
  - [x] `--json` 模式：归一化输出 `{ members: [{userId, name, roleName}], total: N }`
  - [x] 默认人类可读模式：表格展示 userId、name

- [x] 在 `src/index.js` 中注册 `registerQueryCommands` (AC: #1, #2, #3)

- [x] 在 `test/` 中新增 `user.test.js` 单元测试
  - [x] 测试 `listProjectMembers` API 函数（Strategy A: mock client.get）
  - [x] 测试字段归一化（`name` 字段来自 `userName`）
  - [x] 测试 `user list --json` 输出格式含 `total` 字段
  - [x] 测试 `user search` 空结果返回空数组

## Dev Notes

### API 信息（来自 api-verification-v2.md 第五章）

```
GET /oapi/v1/projex/organizations/{orgId}/projects/{projectId}/members
可选参数：name（按名称过滤）、roleId
返回字段：userId、userName、userAvatar、roleId、roleName
```

### 实现要点

- `user search <keyword>` 直接复用 `listProjectMembers(client, orgId, projectId, { name: keyword })`
- `--json` 模式下空结果也输出 `{ members: [], total: 0 }`（AC #3 要求退出码 0）
- `user list` 需要 `projectId`，从 `defaultProjectId` 读取，未配置则报 `INVALID_ARGS`
- 命令注册放在新文件 `src/commands/query.js`，命名 `registerQueryCommands`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3] — 验收标准
- [Source: _bmad-output/research/api-verification-v2.md#五] — ListProjectMembers API 规格

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- 新增 `listProjectMembers` API 函数：GET `/oapi/v1/projex/organizations/{orgId}/projects/{projectId}/members`，支持 `name`、`roleId`、`perPage` 过滤参数
- 新建 `src/commands/query.js`：注册 `user list` 和 `user search <keyword>` 命令
- JSON 输出归一化：将 API 返回的 `userName` 字段映射为 `name`，符合 AC 规范
- `user list` 支持 `--limit` 选项，实际传入 API `perPage` 参数
- `index.js` 注册 `registerQueryCommands`，else 分支增加 `user` 到占位命令列表
- 编译验证通过（`node src/index.js --help`）
- 单元测试 33 个全部通过（新增 8 个 user 相关测试）
- 代码审查：修复字段名映射（`name` vs `userName`）和 `--limit` 未传参问题

### File List

- `src/api.js`（修改：新增 `listProjectMembers` 函数）
- `src/commands/query.js`（新建：`registerQueryCommands`，user list/search 命令）
- `src/index.js`（修改：import query.js，注册 query 命令，else 分支增加 user）
- `test/user.test.js`（新建：listProjectMembers API 测试 + 输出格式测试）
- `_bmad-output/implementation-artifacts/3-3-user-list-search.md`（本文件，新建）
