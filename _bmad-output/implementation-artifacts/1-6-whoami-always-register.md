# Story 1.6：whoami 命令与命令始终注册

Status: done

## Story

As a developer,
I want all commands always registered (not conditionally on auth state) and `whoami` to verify auth,
So that users always see the full command tree in `--help` and get clear errors when auth is missing.

## Acceptance Criteria

1. **Given** 未配置任何认证信息
   **When** 执行 `yunxiao --help` 或 `yunxiao wi --help`
   **Then** 显示完整命令树，不报错，退出码 0

2. **Given** 未配置认证信息
   **When** 执行 `yunxiao wi list`
   **Then** stderr 输出 `AUTH_MISSING` 错误，退出码非零（不是"命令不存在"错误）

3. **Given** 有效认证信息已配置
   **When** 执行 `yunxiao whoami`
   **Then** 显示当前用户信息（用户名、userId、邮箱等），退出码 0

4. **Given** 认证信息无效或已过期
   **When** 执行 `yunxiao whoami`
   **Then** stderr 输出 `AUTH_FAILED` 错误，退出码非零

## Tasks / Subtasks

- [x] 移除 `index.js` 中 `if (client && orgId)` 条件注册，改为始终注册所有命令 (AC: #1, #2)
  - [x] 始终调用 `registerProjectCommands`、`registerWorkitemCommands`、`registerSprintCommands`（传入可能为 null 的 client/orgId）
  - [x] 移除旧的 stub 命令注册（`project [args...]`、`workitem [args...]`、`sprint [args...]`）
- [x] 在各命令 action handler 顶部添加 auth 检查，抛出 `AUTH_MISSING` (AC: #2)
  - [x] `workitem.js` 所有 handler 添加 `if (!client || !orgId)` 检查
  - [x] `sprint.js` 所有 handler 添加 `if (!client || !orgId)` 检查
  - [x] `project.js` 所有 handler 添加 `if (!client || !orgId)` 检查
- [x] 修复 `whoami` 命令：未认证时抛出 `AUTH_MISSING`（不再只 console.log） (AC: #3, #4)
- [x] 在 `withErrorHandling` 中将 HTTP 401/403 转为 `AUTH_FAILED` 错误 (AC: #4)
- [x] 移除启动时的 eager `initCurrentUser()` 异步调用

## Dev Notes

### 当前实现状态分析

`src/index.js` 已有 `whoami` 命令，但未认证时仅 `console.log` 提示而不报错（违反 AC#4）。
命令注册依然在 `if (client && orgId)` 条件块中，`--help` 在无认证时不显示完整树（违反 AC#1）。

**需要变更的文件：**
- `src/index.js`：移除条件注册；修复 whoami；HTTP 401/403 → AUTH_FAILED
- `src/commands/workitem.js`：各 handler 顶部添加 auth 检查
- `src/commands/sprint.js`：各 handler 顶部添加 auth 检查
- `src/commands/project.js`：各 handler 顶部添加 auth 检查

### Auth 检查模式

在每个 action handler 最顶部添加：
```js
if (!client || !orgId) throw new AppError(ERROR_CODE.AUTH_MISSING, 'Authentication required. Run: yunxiao auth login');
```

### 技术栈约束

- Node.js ≥ 18，ESM 模块，`import/export` 语法
- 2 空格缩进，单引号字符串
- 无新依赖

### 范围边界

- **本 Story 范围**：始终注册命令；whoami 报错；AUTH_MISSING/AUTH_FAILED
- **不在范围**：`wi list` 等命令的实际 API 实现（已在其他 story 完成）

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.6] — AC 来源
- [Source: _bmad-output/planning-artifacts/epics.md#FR12, FR25] — whoami、命令始终注册
- [Source: src/index.js] — 现有实现

### Review Findings

- [x] [Review][Defer] currentUserId 移除 eager init 后不再自动填充，影响 wi create 默认 assignee [src/index.js] — deferred, pre-existing（Story 2.4 范围；Story 1.6 明确任务要求移除 eager init）
- [x] [Review][Defer] orgId 为 null 时报 AUTH_MISSING 但实为配置缺失，错误信息不准确 [src/commands/*.js] — deferred, pre-existing（所有 handler 均用同一 pattern）
- [x] [Review][Defer] update/comment/comments/delete 在 resolveWorkitemId 前无 spaceId 检查 [src/commands/workitem.js] — deferred, pre-existing（本 Story 未引入）
- [x] [Review][Defer] client/orgId 注册时按值传入，同进程 re-auth 后不会刷新 [src/index.js] — deferred, pre-existing（架构约束，本 Story 未引入）

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

- src/index.js（修改）
- src/commands/workitem.js（修改）
- src/commands/sprint.js（修改）
- src/commands/project.js（修改）
- _bmad-output/implementation-artifacts/1-6-whoami-always-register.md（新建：Story 文件）
