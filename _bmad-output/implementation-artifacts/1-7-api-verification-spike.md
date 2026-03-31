# Story 1.7 [Spike]：全量 API 验证

Status: review

## Story

As a developer,
I want a verified API compatibility report covering all MVP endpoints,
So that Epic 2-5 implementations are built on confirmed, correct API paths and parameters.

## Acceptance Criteria

1. **Given** MVP 中涉及的所有云效 API 端点
   **When** 执行验证 spike
   **Then** `_bmad-output/research/api-verification-v2.md` 文件被创建，包含每个端点的：路径正确性、必填参数、返回字段结构

2. **Given** `wi view <serialNumber>` 直传详情接口的可行性验证
   **When** 尝试将 `GJBL-1` 格式直接作为 workitem ID 传入详情接口
   **Then** 验证报告中明确记录：可行（直传）或不可行（需通过 searchWorkitems 解析）

3. **Given** `pipeline` 相关 API 端点
   **When** 完成验证
   **Then** 验证报告中确认 pipeline list/run/status 的正确 API 路径和参数

## Tasks / Subtasks

- [x] 整合 v1 验证报告（api-verification-report.md）中已确认的端点 (AC: #1)
  - [x] 工作项 CRUD API（SearchWorkitems、GetWorkitem、CreateWorkitem、UpdateWorkitem、DeleteWorkitem）
  - [x] 工作项评论 API（ListWorkitemComments、CreateWorkitemComment）
  - [x] Sprint API（ListSprints、GetSprintInfo）
  - [x] 工作项类型 API（ListWorkitemTypes）
  - [x] 工作流状态 API（GetWorkitemWorkflow）
  - [x] 项目成员 API（ListProjectMembers）
  - [x] 项目 API（SearchProjects）
  - [x] 平台 API（GetCurrentUser）
- [x] 验证 `wi view <serialNumber>` 直传可行性 (AC: #2)
  - [x] 分析 GetWorkitem 接口是否接受序列号（GJBL-1）作为 `{id}` 路径参数
  - [x] 确认结论并写入报告（结论：不可行，需通过 searchWorkitems 解析）
- [x] 研究 Pipeline API 端点 (AC: #3)
  - [x] 查找 Yunxiao 云效流水线 OpenAPI 文档
  - [x] 确认 pipeline list 端点路径（旧版可用，新版 oapi/v1/flow 未发现，标注为待验证）
  - [x] 确认 pipeline run（触发）端点路径：POST `/oapi/v1/flow/organizations/{orgId}/pipelines/{id}/runs`
  - [x] 确认 pipeline status（查询运行状态）端点路径：GET `.../runs/{pipelineRunId}`
- [x] 创建 `_bmad-output/research/api-verification-v2.md` 综合报告 (AC: #1, #2, #3)
  - [x] 汇总所有 MVP 端点验证结论
  - [x] 明确标注已验证/待实际 API 调用验证的端点
  - [x] 为 Epic 2-5 各 Story 提供端点使用建议

## Dev Notes

### Spike 性质说明

本 Story 是时间盒研究任务（Spike），交付物为研究文档，而非可运行的代码增量。

**时间上限：** 1 天

**输出物：** `_bmad-output/research/api-verification-v2.md`

### 已有研究基础

v1 验证报告（`_bmad-output/research/api-verification-report.md`）和 API 参考（`_bmad-output/research/yunxiao-api-reference.md`）已覆盖：
- 所有 Projex 模块端点（工作项、评论、Sprint、类型、工作流、成员、项目）
- 已验证 Bug：listSprints 路径、searchWorkitems 默认 category、resolveWorkitemId 逻辑

**本 Spike 的增量任务：**
1. 补充 Pipeline API（v1 未覆盖）
2. 验证 `wi view <serialNumber>` 直传可行性（FR29 明确要求）
3. 整合为 v2 综合报告，为 Epic 2-5 开发提供一站式参考

### `wi view <serialNumber>` 直传分析

GetWorkitem API 路径：`GET /oapi/v1/projex/organizations/{orgId}/workitems/{id}`

分析：
- `{id}` 路径参数是工作项的内部唯一 UUID（如 `7c6da1002a65113899df73****`）
- 序列号（如 `GJBL-1`）是项目维度的显示号，与 UUID 不同
- 云效 API 通常不支持序列号直接作为资源 ID 路径参数

**预期结论：** 不可行，`GetWorkitem` 需要 UUID。`wi view GJBL-1` 必须通过 `searchWorkitems`（全类型搜索 + `serialNumber` 精确匹配）先解析出 UUID，再调用 GetWorkitem。

需在报告中通过代码分析和 API 规范确认此结论。

### Pipeline API 研究方向

云效 OpenAPI 官方文档：https://help.aliyun.com/zh/yunxiao/developer-reference/

Yunxiao 流水线服务通常在独立模块（非 Projex），常见 API 命名模式：
- 流水线列表：`GET /oapi/v1/flow/organizations/{orgId}/pipelines` 或项目维度变体
- 触发运行：`POST /oapi/v1/flow/organizations/{orgId}/pipelines/{id}/run`
- 查询运行状态：`GET /oapi/v1/flow/organizations/{orgId}/pipelineruns/{runId}`

**注意：** 需通过官方文档验证实际路径，上述为推断，不保证准确。

### 技术约束

- 当前无实际云效 API 凭证，无法做实时 API 调用验证
- 验证方式：代码分析 + 官方 API 文档参考 + v1 研究报告
- 需明确标注哪些结论基于文档分析（高置信度）vs 需要实际 API 调用验证（低置信度）

### 目标文件位置

```
_bmad-output/
  research/
    api-verification-report.md   ← v1（保留，不修改）
    yunxiao-api-reference.md     ← 现有参考文档（可更新）
    api-verification-v2.md       ← 本 Spike 输出（新建）
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.7] — 验收标准
- [Source: _bmad-output/planning-artifacts/prd.md#FR29] — 全量验证要求
- [Source: _bmad-output/research/api-verification-report.md] — v1 验证报告
- [Source: _bmad-output/research/yunxiao-api-reference.md] — API 参考文档
- [Source: _bmad-output/planning-artifacts/prd.md#Open Questions] — pipeline API 路径待确认

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- 创建 `_bmad-output/research/api-verification-v2.md`，覆盖全量 MVP 端点（13 个 API 端点，分属 Projex 和 Flow 两个模块）
- **wi view serialNumber 直传**：不可行。GetWorkitem `{id}` 需 UUID，GJBL-1 格式须通过 SearchWorkitems（全类型 + serialNumber 精确匹配）先解析为 UUID
- **Pipeline API**：确认 CreatePipelineRun（POST）、GetPipelineRun（GET）、ListPipelineRuns（GET）路径使用 `/oapi/v1/flow/organizations/{orgId}/pipelines/{id}/runs`；ListPipelines（获取流水线列表）在新版 flow API 中未找到直接等价接口，旧版路径 `/organization/{orgId}/pipelines` 需实际 PAT 测试验证
- 所有 v1 验证结论整合并更新（listSprints 路径 bug、searchWorkitems 默认 category bug、resolveWorkitemId 逻辑 bug）
- Epic 2-5 端点使用指南已写入报告第十章

### File List

- `_bmad-output/research/api-verification-v2.md`（新建：全量 MVP API 验证报告）
- `_bmad-output/implementation-artifacts/1-7-api-verification-spike.md`（本文件）
- `_bmad-output/implementation-artifacts/sprint-status.yaml`（状态更新）
