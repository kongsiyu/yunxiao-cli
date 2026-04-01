# Story 6.3：GitHub Actions CI

Status: in-progress

## Story

As a developer,
I want automated tests to run on every PR and push,
So that code quality is continuously verified.

## Acceptance Criteria

1. **Given** 向 main 分支提交 PR 或直接 push
   **When** GitHub Actions 触发
   **Then** `.github/workflows/test.yml` 运行 `npm test`，结果反映在 PR 状态检查中

2. **Given** 测试失败
   **When** GitHub Actions 运行
   **Then** CI 状态标记为失败，不触发发布流程

## Tasks / Subtasks

- [x] 创建 `.github/workflows/test.yml`，在 push/PR 时运行 `npm test` (AC: #1)
- [x] 确保测试失败时 CI 状态标记为失败 (AC: #2)

## Dev Notes

### 现状分析

- 当前已有 `.github/workflows/ci.yml`，在 push/PR 到 `master` 时运行 `npm test`
- Story 要求文件名为 `test.yml`（epic 规格），需新建专用测试 workflow
- 项目使用 Node.js 原生 `node:test` runner，`npm test` = `node --test test/*.test.js`
- 主分支为 `master`（不是 `main`）

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.3] — 验收标准
- [Source: _bmad-output/planning-artifacts/prd.md] — CI 要求

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

N/A

### Completion Notes List

- 创建 `.github/workflows/test.yml`：在 push/PR 到 master 时触发，matrix 覆盖 Node.js 18/20/22
- `npm test` 执行 `node --test test/*.test.js`，测试失败时 job 非零退出，CI 状态自动标记失败
- 已有 `ci.yml` 保留（含 lint 步骤），`test.yml` 专注测试验证，符合 AC 文件名要求

### File List

- `.github/workflows/test.yml`（新建）
- `_bmad-output/implementation-artifacts/6-3-github-actions-ci.md`（本文件）
