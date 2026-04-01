# Story 6.1：npm 包配置

Status: review

## Story

As a developer,
I want `package.json` correctly configured for public npm publishing,
So that users can install the CLI via `npm install -g @kongsiyu/yunxiao-cli` or `npx`.

## Acceptance Criteria

1. **Given** 查看 `package.json`
   **When** 检查配置
   **Then** `name` 为 `@kongsiyu/yunxiao-cli`，`bin.yunxiao` 指向正确入口文件
   **And** `version`、`description`、`keywords`、`license`、`repository` 等元数据完整

2. **Given** `package.json` 中的 `files` 字段
   **When** 检查
   **Then** 只包含 `src/` 目录和必要文件，不包含 `_bmad-output/`、`.github/` 等开发文件

## Tasks / Subtasks

- [x] 更新 `package.json` 的 `name` 为 `@kongsiyu/yunxiao-cli` (AC: #1)
- [x] 确认 `bin.yunxiao` 指向正确入口文件（`./src/index.js`）(AC: #1)
- [x] 补全元数据：`version`、`description`、`keywords`、`license`、`repository` (AC: #1)
- [x] 添加 `files` 字段，只包含 `src/` 和必要文件（`README.md`、`package.json`）(AC: #2)

## Dev Notes

### 当前 package.json 状态（实现后）

- `name`：`@kongsiyu/yunxiao-cli` ✓
- `bin.yunxiao`：`./src/index.js` ✓
- `version`：`0.1.1` ✓
- `description`：`CLI for Aliyun Yunxiao DevOps platform` ✓
- `keywords`：`["yunxiao","aliyun","devops","cli","yunxiao-cli"]` ✓
- `license`：`MIT` ✓
- `repository`：`{"type":"git","url":"https://github.com/kongsiyu/yunxiao-cli.git"}` ✓
- `files`：`["src/","README.md"]` ✓（白名单机制，自动排除开发文件）
- `author`：`kongsiyu` ✓
- `homepage`、`bugs`、`engines` 完整 ✓

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.1] — 验收标准
- [Source: _bmad-output/planning-artifacts/prd.md#FR30] — npm 发布要求

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

N/A

### Completion Notes List

- 更新 `package.json`：name 改为 `@kongsiyu/yunxiao-cli`，添加 `files` 白名单字段、`repository`、`homepage`、`bugs`、`engines`、`author` 元数据
- `package-lock.json` 同步更新（name 字段、engines 字段）
- 编译验证通过：`npm run lint` 输出 `0.1.1`
- 单元测试全部通过：11/11
- 代码审查：无必修复项

### File List

- `package.json`（修改：name、files、repository、homepage、bugs、engines、author、keywords）
- `package-lock.json`（自动更新）
- `_bmad-output/implementation-artifacts/6-1-npm-package-config.md`（本文件）
