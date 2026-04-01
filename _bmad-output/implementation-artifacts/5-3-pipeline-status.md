# Story 5.3：pipeline status 命令

Status: ready-for-dev

## Story

As an AI agent,
I want to check the status of a pipeline run,
So that I can determine if the CI/CD process succeeded before proceeding.

## Acceptance Criteria

1. **Given** 执行 `pipeline status <runId> --pipeline <pipelineId> --json`
   **When** 命令运行
   **Then** stdout 输出该运行的状态 JSON（包含 `status`：RUNNING/SUCCESS/FAIL 等）

2. **Given** 流水线运行中
   **When** 执行 `pipeline status <runId> --pipeline <pipelineId> --json`
   **Then** 返回 `"status": "RUNNING"` 及可用的进度信息（startTime、endTime 等）

3. **Given** 执行 `pipeline status <runId> --pipeline <pipelineId>`（默认输出）
   **When** 命令运行
   **Then** 以人类可读格式显示运行 ID、状态（带颜色）、触发模式、开始/结束时间

4. **Given** runId 不存在或 pipelineId 无权访问
   **When** 命令运行
   **Then** stderr 输出 `NOT_FOUND` 或 `API_ERROR`，退出码非零

5. **Given** 未提供 `--pipeline` 且未设置 `YUNXIAO_PIPELINE_ID`
   **When** 命令运行
   **Then** stderr 输出 `INVALID_ARGS` 错误，提示需要 pipelineId

## Tasks / Subtasks

- [ ] 在 `src/api.js` 添加 `getPipelineRun` 函数 (AC: #1, #2, #4)
  - [ ] GET `/oapi/v1/flow/organizations/{orgId}/pipelines/{pipelineId}/runs/{pipelineRunId}`
  - [ ] 返回完整运行实例对象
- [ ] 创建 `src/commands/pipeline.js`，注册 `pipeline status` 子命令 (AC: #1, #2, #3, #4, #5)
  - [ ] 参数：`<runId>`（必填），`--pipeline <id>`（优先级高于 `YUNXIAO_PIPELINE_ID`）
  - [ ] JSON 模式：printJson 完整响应数据
  - [ ] 默认模式：彩色表格输出 runId、status、triggerMode、startTime、endTime
  - [ ] 错误处理：`INVALID_ARGS`（缺少 pipelineId）、`NOT_FOUND`、`API_ERROR`
- [ ] 在 `src/index.js` 注册 `registerPipelineCommands` (AC: #1)
  - [ ] import 并调用 `registerPipelineCommands`
  - [ ] auth guard 补充 `pipeline` 命令占位
- [ ] 添加单元测试 `test/pipeline.test.js` (AC: #1~#5)
  - [ ] `getPipelineRun` API 函数测试（Strategy A: mock client.get）
  - [ ] `pipeline status` 命令输出测试（JSON / 人类可读 / 错误路径）

## Dev Notes

### API 端点

```
GET /oapi/v1/flow/organizations/{orgId}/pipelines/{pipelineId}/runs/{pipelineRunId}
```

- **认证**：`x-yunxiao-token` Header（与现有 createClientWithPat 一致）
- **返回字段**：`pipelineRunId`、`pipelineId`、`startTime`、`endTime`、`triggerMode`、状态信息
- **状态值**：`RUNNING`、`SUCCESS`、`FAIL`（来自 ListPipelineRuns 参数枚举）

> 来源：`_bmad-output/research/api-verification-v2.md` 第 8.3 节

### 命令设计

```
yunxiao pipeline status <runId> [--pipeline <pipelineId>]
```

- `pipelineId`：`--pipeline <id>` 优先，回退到环境变量 `YUNXIAO_PIPELINE_ID`；两者均缺失时输出 `INVALID_ARGS`
- `runId`：位置参数，必填

### 代码模式参考

与 `src/commands/sprint.js` 一致：
- 使用 `chalk` 做颜色输出
- 使用 `printJson` / `printError`（`src/output.js`）
- 使用 `withErrorHandling` 包装 action
- 通过 `registerPipelineCommands(program, client, orgId, withErrorHandling, jsonMode)` 注册

### 测试模式

遵循 `test/mock-example.test.js` 中 Strategy A（mock client.get）：
```js
const client = createMockClient();
mock.method(client, 'get', async () => ({ data: fakeRun }));
const result = await api.getPipelineRun(client, 'org1', 'pipe-1', 'run-1');
```

### 技术约束

- ESM 模块（`type: "module"`），所有 import 必须带 `.js` 后缀
- Node.js >= 18，测试用 `node:test`
- 无新依赖，复用 axios / chalk / commander

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3] — 验收标准
- [Source: _bmad-output/research/api-verification-v2.md#8.3] — GetPipelineRun API
- [Source: _bmad-output/research/api-verification-v2.md#8.4] — 状态枚举（RUNNING/SUCCESS/FAIL）

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
