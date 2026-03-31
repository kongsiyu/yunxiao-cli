# Story 1.1：初始化 CLI 项目骨架重构

Status: ready-for-dev

## Story

As a developer,
I want the codebase cleaned of dead code and unified to npm,
so that all subsequent stories start from a clean, predictable foundation.

## Acceptance Criteria

1. **Given** 现有代码库包含 attachment/query/storage 命令文件及 pnpm-lock.yaml
   **When** 执行骨架重构
   **Then** `src/commands/attachment.js`、`src/commands/query.js`、`src/commands/storage.js` 被删除
   **And** `api.js` 中对应的死代码函数（`createClient()`、`getConfig()`）被清理
   **And** `pnpm-lock.yaml` 被删除，项目统一使用 npm
   **And** `src/index.js` 中对 attachment/query 命令的 import 和注册调用被移除

2. **Given** 重构后的代码库
   **When** 执行 `npm install && node src/index.js --help`
   **Then** 命令正常运行，不报告缺失模块错误

## Tasks / Subtasks

- [ ] 删除死代码文件 (AC: #1)
  - [ ] 删除 `src/commands/attachment.js`
  - [ ] 删除 `src/commands/query.js`
  - [ ] 删除 `src/commands/storage.js`
- [ ] 清理 `src/index.js` (AC: #1)
  - [ ] 移除 `registerAttachmentCommands` 的 import 和调用
  - [ ] 移除 `registerQueryCommands` 的 import 和调用
- [ ] 清理 `src/api.js` 死代码 (AC: #1)
  - [ ] 删除 `createClient()` 函数（未被任何文件引用）
  - [ ] 删除 `getConfig()` 函数（未被任何文件引用）
- [ ] 删除 `pnpm-lock.yaml` (AC: #1)
- [ ] 验证 (AC: #2)
  - [ ] 执行 `node src/index.js --help` 确认正常运行

## Dev Notes

### 要删除的文件

- `src/commands/attachment.js` — attachment 命令，死代码，PRD FR28 明确要求删除
- `src/commands/query.js` — saved query 命令，依赖 storage.js，死代码，PRD FR28 要求删除
- `src/commands/storage.js` — 为 query.js 提供持久化存储，随 query.js 一起删除
- `pnpm-lock.yaml` — 项目统一使用 npm，删除 pnpm lock 文件

### 要修改的文件

**`src/index.js`** — 移除对已删除模块的引用：
- 删除 `import { registerAttachmentCommands } from "./commands/attachment.js";`
- 删除 `import { registerQueryCommands } from "./commands/query.js";`
- 删除 `if (client && orgId)` 块中对 `registerAttachmentCommands(...)` 和 `registerQueryCommands(...)` 的调用

**`src/api.js`** — 清理未使用的导出函数：
- 删除 `createClient()` 函数（export function createClient，第 44-51 行）
- 删除 `getConfig()` 函数（export function getConfig，第 53-60 行）

### 保持不变的文件

- `src/api.js` 中的其他所有函数（searchWorkitems, getWorkitem, createWorkitem, updateWorkitem, addComment, listComments, deleteWorkitem, getWorkitemTypes, listSprints, getCurrentUser, getOrganizations, resolveWorkitemId, loadSavedConfig, saveConfig, clearConfig, createClientWithPat）
- `src/commands/auth.js`、`src/commands/project.js`、`src/commands/sprint.js`、`src/commands/workitem.js`
- `package.json`、`package-lock.json`（npm 的 lock 文件，保留）

### 注意事项

- `resolveWorkitemId` 在 `api.js` 中存在 bug（错误的搜索逻辑），但修复属于 Story 2.1 范围，本 Story 不处理
- `src/commands/sprint.js` 中的 `listSprints` API 路径有 bug（projectId 应在路径中），修复属于 Story 4.1，本 Story 不处理
- `if (client && orgId)` 条件注册逻辑的移除属于 Story 1.6 范围，本 Story 不处理，仅删除该块内死代码的调用

### 技术栈

- Node.js ≥ 18，ESM 模块（`"type": "module"` in package.json）
- Commander.js ^12.0.0, chalk ^5.3.0, axios ^1.7.0

### Project Structure Notes

目标结构（本 Story 后）：
```
src/
  index.js        ← 保留，移除 attachment/query 相关代码
  api.js          ← 保留，移除 createClient/getConfig 死代码
  commands/
    auth.js       ← 保留
    project.js    ← 保留
    sprint.js     ← 保留
    workitem.js   ← 保留
    # attachment.js、query.js、storage.js 已删除
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1]
- [Source: _bmad-output/planning-artifacts/epics.md#FR28]
- [Source: src/index.js] — 当前 import 和注册逻辑（第 1-92 行）
- [Source: src/api.js] — 死代码函数位置（createClient 第 44-51 行，getConfig 第 53-60 行）

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
