# Story 5.1: pipeline list 命令

Status: review

## Story

As an AI agent or team member,
I want to list available pipelines,
so that I can identify the correct pipeline ID before triggering a run.

## Acceptance Criteria

1. **Given** 执行 `pipeline list --json`，**When** 命令运行，**Then** stdout 输出流水线列表 JSON，每项包含 `pipelineId`、`name`
2. **Given** 执行 `pipeline list`（默认输出），**When** 命令运行，**Then** 以人类可读表格显示流水线列表（含 pipelineId、名称）
3. **Given** 未设置认证或 orgId，**When** 执行 `pipeline list`，**Then** stderr 输出 `AUTH_MISSING` 或 `INVALID_ARGS` 错误，退出码非零

## Tasks / Subtasks

- [x] 在 `src/api.js` 中新增 `listPipelines` 函数 (AC: #1, #2)
  - [x] 使用旧版路径 `GET /organization/{orgId}/pipelines`（待 PAT 实际验证，见 Dev Notes）
  - [x] 支持分页参数 `maxResults`（默认20）和 `nextToken`
- [x] 新建 `src/commands/pipeline.js`，注册 `pipeline list` 子命令 (AC: #1, #2)
  - [x] 支持 `--limit <n>` 选项（默认20）
  - [x] `--json` 模式：`printJson({ pipelines, total })`
  - [x] 默认模式：表格展示 pipelineId 和 name（参考 sprint.js 样式）
  - [x] orgId 缺失时：`printError("INVALID_ARGS", ...)` + `process.exit(1)`
- [x] 在 `src/index.js` 中注册 `registerPipelineCommands` (AC: #1, #2, #3)
  - [x] 在 `if (client && orgId)` 块内调用 `registerPipelineCommands`
  - [x] `else` 块添加 `pipeline` 的占位命令（与 workitem/sprint 一致）
- [x] 新建 `test/pipeline.test.js`，使用 Strategy A（mock client.get）(AC: #1, #2)
  - [x] 测试 `listPipelines` API 函数：验证 URL 含 orgId、返回数据结构
  - [x] 测试 JSON 输出路径（mock client 返回流水线列表）
  - [x] 测试空列表情况

## Dev Notes

### API 关键信息

**ListPipelines（流水线列表）— 待验证路径** ⚠️

新版 PAT API（`/oapi/v1/flow/`）中**未发现** ListPipelines 端点；文档仅有单个 GetPipeline 和运行相关 API。

建议使用旧版路径（选项 A）：
```
GET /organization/{orgId}/pipelines?maxResults=20&nextToken=xxx
```
- **注意**：该路径使用 `/organization/`（无 `oapi/v1/flow/` 前缀），API base URL 同为 `https://openapi-rdc.aliyuncs.com`
- **待验证**：是否支持 PAT（`x-yunxiao-token`）认证，实际行为以测试结果为准

如旧版路径不可用，降级方案：
- **选项 B**：`pipeline list` 命令提示用户通过云效控制台获取 pipelineId，仅实现 `pipeline run`/`pipeline status`

**GetPipeline（单个，已确认）** ✅
```
GET /oapi/v1/flow/organizations/{orgId}/pipelines/{pipelineId}
```
返回字段：流水线配置信息、名称、创建时间等。

[Source: _bmad-output/research/api-verification-v2.md#八、流水线API]

### 代码模式（参照现有实现）

**api.js 新增函数模式**（参照 `listSprints`）：
```javascript
// Pipelines - Note: listPipelines uses legacy path pending verification
export async function listPipelines(client, orgId, opts = {}) {
  const url = `/organization/${orgId}/pipelines`;
  const res = await client.get(url, {
    params: { maxResults: opts.maxResults || 20, nextToken: opts.nextToken }
  });
  return res.data; // 预期：数组或 { pipelines: [...] }
}
```

**命令文件结构**（参照 `src/commands/sprint.js`）：
```javascript
// src/commands/pipeline.js
import chalk from "chalk";
import { listPipelines } from "../api.js";
import { printJson, printError } from "../output.js";

export function registerPipelineCommands(program, client, orgId, withErrorHandling, jsonMode) {
  const pl = program.command("pipeline").description("Manage pipelines");

  pl.command("list")
    .description("List pipelines")
    .option("--limit <n>", "Max results", "20")
    .action(withErrorHandling(async (opts) => {
      if (!orgId) {
        printError("INVALID_ARGS", "org ID required (YUNXIAO_ORG_ID)", jsonMode);
        process.exit(1);
      }
      const result = await listPipelines(client, orgId, { maxResults: parseInt(opts.limit) });
      const pipelines = Array.isArray(result) ? result : (result?.pipelines || []);
      if (jsonMode) {
        printJson({ pipelines, total: pipelines.length });
        return;
      }
      // 表格输出 ...
    }));
}
```

**index.js 注册**（在 `if (client && orgId)` 块末尾添加）：
```javascript
import { registerPipelineCommands } from "./commands/pipeline.js";
// 在 if (client && orgId) 块内：
registerPipelineCommands(program, client, orgId, withErrorHandling, jsonMode);
// 在 else 块中添加 'pipeline' 到占位命令列表
```

### 测试模式（Strategy A）

```javascript
// test/pipeline.test.js
import { test, describe, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../src/api.js';
import { createMockClient, makePage } from './setup.js';

describe('listPipelines API', () => {
  afterEach(() => mock.restoreAll());

  test('calls correct URL with orgId', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: [] }));
    await api.listPipelines(client, 'myOrg', {});
    const url = client.get.mock.calls[0].arguments[0];
    assert.ok(url.includes('myOrg'), 'URL should contain orgId');
    assert.ok(url.includes('pipelines'), 'URL should contain pipelines');
  });
});
```

### 项目结构

- 新增文件：`src/commands/pipeline.js`、`test/pipeline.test.js`
- 修改文件：`src/api.js`（新增 `listPipelines`）、`src/index.js`（注册命令）
- `src/index.js`：`if (client && orgId)` 块结构，`else` 块占位命令列表参考现有 `workitem`/`sprint`

### 编码规范

- 模块：ES Module（`import`/`export`），无 `require`
- 测试：`node:test`，不依赖 jest/mocha
- 错误处理：`AppError(ERROR_CODE.X, msg)` → `withErrorHandling()` 捕获
- 输出：JSON 模式用 `printJson()`，错误用 `printError()`，正常输出用 `chalk`
- Git 作者：`Sue <boil@vip.qq.com>`，Conventional Commits

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1] — 用户故事与验收标准
- [Source: _bmad-output/research/api-verification-v2.md#八] — Pipeline API 路径与状态
- [Source: src/commands/sprint.js] — 命令模式参考
- [Source: src/api.js] — API 函数模式参考
- [Source: src/index.js] — 命令注册模式参考
- [Source: test/mock-example.test.js] — 测试 Strategy A 参考
- [Source: test/setup.js] — createMockClient、makePage helper

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- 新增 `listPipelines(client, orgId, opts)` 到 `src/api.js`，使用旧版路径 `/organization/{orgId}/pipelines`，支持 `maxResults`（默认20）和可选 `nextToken` 分页
- 新建 `src/commands/pipeline.js`，实现 `pipeline list` 子命令：`--json` 输出 `{ pipelines, total }`；默认模式 chalk 表格展示；orgId 缺失时 `INVALID_ARGS` 错误
- 更新 `src/index.js`：import `registerPipelineCommands`；在 `if (client && orgId)` 块注册；`else` 占位命令添加 `pipeline`
- 新建 `test/pipeline.test.js`：7 个测试覆盖 URL 格式、maxResults 参数、自定义 limit、数据返回、空列表、nextToken 传递与缺省
- 全量测试 32/32 通过，零回归

### File List

- src/api.js
- src/commands/pipeline.js
- src/index.js
- test/pipeline.test.js
- _bmad-output/implementation-artifacts/5-1-pipeline-list.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
