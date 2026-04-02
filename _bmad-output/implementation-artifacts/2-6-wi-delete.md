# Story 2.6：wi delete 命令

Status: review

## Story

As an AI agent or team member,
I want to delete a workitem with optional force flag,
So that I can clean up workitems programmatically without manual confirmation prompts.

## Acceptance Criteria

1. **Given** 执行 `wi delete <id> --force`
   **When** 命令运行
   **Then** 工作项被直接删除，无交互确认提示，退出码 0

2. **Given** 执行 `wi delete <id>`（不带 `--force`）
   **When** 命令运行（人类场景）
   **Then** 显示确认提示，用户输入 `y` 后删除，输入 `n` 后取消

3. **Given** 执行 `wi delete <不存在的ID> --force`
   **When** 命令运行
   **Then** stderr 输出 `NOT_FOUND` 错误，退出码非零

## Tasks / Subtasks

- [x] 实现 `wi delete <id>` 命令（commands/workitem.js）(AC: #1, #2, #3)
  - [x] 注册 `wi delete <id>` 子命令，添加 `-f, --force` 选项
  - [x] 调用 `resolveWorkitemId` 支持序列号格式（如 `GJBL-1`）
  - [x] `--force` 时直接删除，不显示确认提示
  - [x] 无 `--force` 且非 JSON 模式时，用 readline 显示确认提示，`y` 删除，`n` 取消
  - [x] JSON 模式下自动跳过确认提示（机器调用场景）
  - [x] NOT_FOUND 错误由 `resolveWorkitemId` 抛出 `AppError(ERROR_CODE.NOT_FOUND)`，`withErrorHandling` 统一处理
- [x] 确认 `deleteWorkitem` API 函数（api.js）已实现 (AC: #1, #3)
  - [x] `DELETE /oapi/v1/projex/organizations/{orgId}/workitems/{workitemId}`
- [x] 编写单元测试（test/workitem-delete.test.js）

## Dev Notes

### 现有实现状态

`wi delete` 命令已在 `src/commands/workitem.js`（行 296-323）中实现，`deleteWorkitem` API 函数已在 `src/api.js`（行 111-114）中实现，均满足全部验收标准。

### 命令行为说明

- `--force` 跳过确认 → 直接调用 `deleteWorkitem`，exit 0
- 无 `--force` + 非 JSON 模式 → readline 提示 `[y/N]`，`y` 删除，其余取消
- JSON 模式（`--json`）→ 自动跳过确认（机器调用语义，需搭配 `--force` 或 `--json`）
- NOT_FOUND：`resolveWorkitemId` 抛出 `AppError(ERROR_CODE.NOT_FOUND, ...)`，`withErrorHandling` 输出到 stderr，非零退出

### 技术约束

- Node.js ≥ 18，ESM 模块（`"type": "module"`），`import/export` 语法
- 2 空格缩进，单引号字符串
- `readline` 使用动态 `import('readline')`（已在代码中实现）

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.6] — 验收标准
- [Source: src/commands/workitem.js#296-323] — 现有 wi delete 实现
- [Source: src/api.js#111-114] — deleteWorkitem API 函数

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- `wi delete` 命令实现并修复：`-f, --force` 跳过确认；无 force 时 readline 提示 `[y/N]`；JSON 模式无 force 时返回 INVALID_ARGS 错误（不再静默删除，修复代码审查 #1）
- 序列号格式缺少 project-ID 时添加 INVALID_ARGS 守卫，与 `wi view` 保持一致（修复代码审查 #5）
- `deleteWorkitem` API 函数返回 `res.data`，与其他 API 函数一致（修复代码审查 #6）
- `resolveWorkitemId` falsy 标识符时抛出 `AppError(ERROR_CODE.INVALID_ARGS)` 而非返回 null（修复代码审查 #2）
- 新增单元测试 `test/workitem-delete.test.js`：覆盖 deleteWorkitem API、URL 正确性、HTTP 错误传播、NOT_FOUND 错误、UUID 直传、序列号解析六个场景
- 编译验证通过（`node src/index.js --help`）
- 单元测试全部通过（31/31）

### File List

- `src/commands/workitem.js`（修改：wi delete 添加 project-ID 守卫；--json 无 --force 时返回错误）
- `src/api.js`（修改：deleteWorkitem 返回 res.data；resolveWorkitemId falsy 标识符抛 INVALID_ARGS）
- `test/workitem-delete.test.js`（新建：单元测试）
- `_bmad-output/implementation-artifacts/2-6-wi-delete.md`（本文件，新建）
- `_bmad-output/implementation-artifacts/sprint-status.yaml`（状态更新）
