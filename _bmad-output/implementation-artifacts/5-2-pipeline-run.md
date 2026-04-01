# Story 5.2：pipeline run 命令

Status: review

## Story

As an AI agent,
I want to trigger a pipeline run,
So that I can initiate CI/CD processes as part of an automated workflow.

## Acceptance Criteria

1. **Given** 执行 `pipeline run <pipelineId> --json`
   **When** 命令运行
   **Then** 流水线被触发，stdout 输出包含 `pipelineRunId` 的 JSON

2. **Given** 执行 `pipeline run <不存在的pipelineId>`
   **When** 命令运行
   **Then** stderr 输出 `NOT_FOUND` 或 `API_ERROR`，退出码非零

3. **Given** 执行 `pipeline run <pipelineId>` （不带 `--json`）
   **When** 命令运行
   **Then** stdout 以人类可读格式输出触发成功消息及 `pipelineRunId`

4. **Given** 用户传入 `--params '{"branch":"main"}'`
   **When** 命令运行
   **Then** 触发时将 params 传给 API `params` 字段

## Tasks / Subtasks

- [x] 在 `src/api.js` 中新增 `createPipelineRun` 函数 (AC: #1, #2, #4)
  - [x] 实现 POST `/oapi/v1/flow/organizations/{orgId}/pipelines/{pipelineId}/runs`
  - [x] 支持可选 `params` body 参数（JSON 字符串）
  - [x] 返回 API 响应（含 `pipelineRunId`）

- [x] 创建 `src/commands/pipeline.js` (AC: #1, #2, #3, #4)
  - [x] 实现 `pipeline run <pipelineId>` 子命令
  - [x] 支持 `--params <json>` 可选参数
  - [x] `--json` 模式：stdout 输出 `{ pipelineRunId, pipelineId }` JSON
  - [x] 默认模式：输出人类可读成功信息
  - [x] 错误处理：API 错误映射到 `API_ERROR`；NOT_FOUND 映射到 `NOT_FOUND`

- [x] 在 `src/index.js` 中注册 pipeline 命令 (AC: #1)
  - [x] import `registerPipelineCommands` 并在 client+orgId 可用时注册
  - [x] 在无 auth 时的降级命令列表中加入 `pipeline`

- [x] 编写单元测试 `test/pipeline-run.test.js` (AC: #1, #2, #3)
  - [x] 测试成功触发返回 pipelineRunId
  - [x] 测试 API 错误正确映射
  - [x] 使用 Strategy A（mock client.post）

## Dev Notes

### API 端点

- **Method:** POST
- **Path:** `/oapi/v1/flow/organizations/{orgId}/pipelines/{pipelineId}/runs`
- **Body:** `{ "params": "<JSON string>" }`（全部可选，params 可为空对象序列化后的字符串）
- **返回:** `pipelineRunId`（integer）
- **来源:** `_bmad-output/research/api-verification-v2.md` 8.2 节 ✅

### 项目代码规范

- 使用 `createClientWithPat` 创建的 axios client 实例，通过 `x-yunxiao-token` header 认证
- 命令通过 `registerXxxCommands(program, client, orgId, ...)` 注入依赖
- 错误处理使用 `AppError(ERROR_CODE.xxx, message)` + `withErrorHandling` 包装
- 输出: JSON 模式用 `printJson()`，人类模式用 `console.log` + `chalk`
- 测试: `node:test` + `node:assert/strict`，mock 策略见 `test/setup.js`

### 注意事项

- Story 5-1 (pipeline list) 仍在 backlog；本 Story 独立实现，不依赖 5-1
- `pipelineId` 由用户自行提供（数字 ID），命令行需支持字符串转数字或直接传字符串
- API 路径使用 `/oapi/v1/flow/` 前缀（非 Projex 的 `/oapi/v1/projex/`）
