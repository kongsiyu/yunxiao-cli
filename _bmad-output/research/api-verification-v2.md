# API 验证报告 v2 — 全量 MVP 端点

**日期：** 2026-03-31
**Story：** 1.7（Spike）
**目的：** 为 Epic 2-5 实现提供全量 API 端点验证，确认路径、必填参数和返回字段结构

**置信度说明：**
- ✅ **已验证**：来自官方文档明确记录，高置信度
- ⚠️ **文档推断**：基于 API 文档模式推断，建议首次实现时做实时验证
- ❌ **不可行**：已确认不支持或不存在

---

## Base URL 和认证

| 项目 | 值 |
|------|---|
| Base URL | `https://openapi-rdc.aliyuncs.com` |
| 认证 Header | `x-yunxiao-token: <PAT>` |
| Projex 路径前缀 | `/oapi/v1/projex/organizations/{orgId}/` |
| Flow 路径前缀 | `/oapi/v1/flow/organizations/{orgId}/` |

---

## 一、工作项管理（Projex）

### 1.1 SearchWorkitems — 搜索工作项 ✅

- **Method:** POST
- **Path:** `/oapi/v1/projex/organizations/{orgId}/workitems:search`
- **必填参数：**
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | category | string | 工作项类型，**支持逗号分隔**（如 `"Req,Task,Bug"`） |
  | spaceId | string | 项目 ID |
- **可选参数：** conditions（JSON 过滤条件）、orderBy、page、perPage（默认20）、sort
- **返回字段：** `id`（UUID）、`subject`、`serialNumber`（如 `GJBL-1`）、`status`（对象）、`assignedTo`、`sprint`、`workitemType`、`gmtCreate` 等
- **分页：** 响应 Header `x-total` 含总数

> **关键修复（v1 已确认）：** 默认 category 应为 `"Req,Task,Bug"` 而非 `"Req"`

#### 1.1.1 serialNumber 过滤可行性评估（Story 9.3）

**评估结论：** ❌ **API 不支持 serialNumber 作为 conditionGroup 的 fieldIdentifier**

**分析：**
- 官方文档中 SearchWorkitems 的 `conditions` 参数支持多种 fieldIdentifier（如 `status`、`assignedTo`、`subject`、`sprint`、`priority`、`label`、`gmtCreate`）
- 但 **serialNumber 未在文档中列为支持的过滤字段**
- SearchWorkitems 返回结果中包含 `serialNumber` 字段，但该字段仅用于显示，不支持作为过滤条件

**实现方案（路径 B - 分页循环）：**
- 将 `perPage` 从 50 扩大至 200，减少 API 调用次数
- 实现分页循环：从 page 1 开始，逐页搜索，直到找到匹配的 serialNumber 或遍历完所有结果
- 最大遍历页数：50 页（200 items/page = 10000 items max），覆盖绝大多数项目场景
- 在函数注释中标注已知限制：超过 10000 个活跃工作项的项目可能无法通过序列号查找

**已知限制（技术债务）：**
- 对于超大型项目（>10000 个活跃工作项），序列号查找可能超时或无法完成
- 建议用户在此类项目中直接使用 UUID 或通过 Web UI 获取工作项 ID

### 1.1 SearchWorkitems — 搜索工作项 ✅

- **Method:** POST
- **Path:** `/oapi/v1/projex/organizations/{orgId}/workitems:search`
- **必填参数：**
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | category | string | 工作项类型，**支持逗号分隔**（如 `"Req,Task,Bug"`） |
  | spaceId | string | 项目 ID |
- **可选参数：** conditions（JSON 过滤条件）、orderBy、page、perPage（默认20）、sort
- **返回字段：** `id`（UUID）、`subject`、`serialNumber`（如 `GJBL-1`）、`status`（对象）、`assignedTo`、`sprint`、`workitemType`、`gmtCreate` 等
- **分页：** 响应 Header `x-total` 含总数

> **关键修复（v1 已确认）：** 默认 category 应为 `"Req,Task,Bug"` 而非 `"Req"`

#### status 字段 Schema（Story 9.4 补充，2026-04-03）

`status` 字段为对象，结构如下：

```json
{
  "status": {
    "id": "string",
    "name": "已完成",
    "nameEn": "Done",
    "stage": "DONE",
    "done": true
  }
}
```

| 字段 | 类型 | 可靠性 | 说明 |
|------|------|--------|------|
| `done` | boolean | ✅ **最高** | 平台直接标识，存在时最可靠；`false` 表示未完成，无需检查其他字段 |
| `stage` | string enum | ✅ **高** | 平台统一枚举：`DONE` / `DOING` / `UNSTARTED`；`done` 字段缺失时使用 |
| `nameEn` | string | ⚠️ **中** | 需精确匹配（`=== 'done'`），避免误匹配 `"undone"`、`"in-done"` 等；`done` 和 `stage` 均缺失时使用 |
| `name` | string | ❌ **不可靠** | 中文名称模糊匹配（如 `/完成/`）会误匹配"待完成"，**不应用于 done 判断** |

**done 判断字段优先级（已固化）：** `s.done` boolean → `s.stage` enum → `s.nameEn` 精确匹配。

### 1.2 GetWorkitem — 获取工作项详情 ✅

- **Method:** GET
- **Path:** `/oapi/v1/projex/organizations/{orgId}/workitems/{id}`
- **路径参数：** `{id}` 为工作项 UUID（**非序列号**，见下文关键发现）
- **返回字段：** 完整工作项对象，包含 `id`、`subject`、`serialNumber`、`description`、`status`、`assignedTo`、`customFieldValues` 等

### 1.3 CreateWorkitem — 创建工作项 ✅

- **Method:** POST
- **Path:** `/oapi/v1/projex/organizations/{orgId}/workitems`
- **必填参数：**
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | assignedTo | string | 负责人用户 ID（**必填**） |
  | spaceId | string | 项目 ID |
  | subject | string | 工作项标题 |
  | workitemTypeId | string | 工作项类型 ID（需先查 ListWorkitemTypes） |
- **可选参数：** description、sprint、labels、participants、verifier 等
- **返回：** `{"id":"7c6da1002a65113899df73****"}`

> **CLI 注意：** `assignedTo` 是必填项，Epic 2 Story 2.4（wi create）需明确处理。若用户未指定，CLI 应使用 whoami 获取当前用户 ID 作为默认值，或改为可选字段（需查确认 API 是否允许 assignedTo 为空）。

### 1.4 UpdateWorkitem — 更新工作项 ✅

- **Method:** PUT
- **Path:** `/oapi/v1/projex/organizations/{orgId}/workitems/{id}`
- **Body 格式：** `{"fieldId":"value"}` 形式的 JSON 对象
  - 示例：`{"status":"statusId"}`, `{"assignedTo":"userId"}`, `{"sprint":"sprintId"}`
- **返回：** 无（HTTP 200/204）

### 1.5 DeleteWorkitem — 删除工作项 ✅

- **Method:** DELETE
- **Path:** `/oapi/v1/projex/organizations/{orgId}/workitems/{id}`
- **返回：** 无

---

## 二、工作项评论

### 2.1 ListWorkitemComments — 评论列表 ✅

- **Method:** GET
- **Path:** `/oapi/v1/projex/organizations/{orgId}/workitems/{id}/comments`
- **返回字段：** `id`、`content`、`contentFormat`（RICHTEXT/MARKDOWN）、`gmtCreate`、`user`（id+name）

### 2.2 CreateWorkitemComment — 创建评论 ✅

- **Method:** POST
- **Path:** `/oapi/v1/projex/organizations/{orgId}/workitems/{id}/comments`
- **必填参数：** `content`（string）
- **返回：** `{"id":"id-xxx"}`

### 2.3 UpdateWorkitemComment / DeleteWorkitemComment ❌

新版 PAT API **不支持**评论编辑和删除，这两个命令应从 CLI 计划中移除。

---

## 三、Sprint 管理

### 3.1 ListSprints — Sprint 列表 ✅

- **Method:** GET
- **Path:** `/oapi/v1/projex/organizations/{orgId}/projects/{projectId}/sprints`（**projectId 在路径中**）
- **可选参数：** `status`（TODO/DOING/ARCHIVED）、`page`、`perPage`
- **返回字段：** `id`、`name`、`status`、`startDate`、`endDate`、`owners`

> **已修复 Bug（v1 确认）：** 旧代码误用 `spaceId` 查询参数。路径必须包含 `projects/{projectId}`。

### 3.2 GetSprintInfo — Sprint 详情 ✅

- **Method:** GET
- **Path:** `/oapi/v1/projex/organizations/{orgId}/projects/{projectId}/sprints/{sprintId}`
- **返回字段：** 完整 Sprint 对象（name、status、startDate、endDate、capacityHours 等）

---

## 四、工作项类型与工作流

### 4.1 ListWorkitemTypes — 工作项类型 ✅

- **Method:** GET
- **Path:** `/oapi/v1/projex/organizations/{orgId}/projects/{projectId}/workitemTypes`
- **必填参数：** `category`（query）：`"Req"`、`"Bug"` 或 `"Task"`
- **返回字段：** `id`（typeId）、`name`、`nameEn`、`categoryId`、`defaultType`

### 4.2 GetWorkitemWorkflow — 工作流状态 ✅

- **Method:** GET
- **Path:** `/oapi/v1/projex/organizations/{orgId}/projects/{projectId}/workitemTypes/{workitemTypeId}/workflows`
- **返回字段：** `defaultStatusId`、`statuses`（数组：id、name、nameEn、displayName）

> **CLI 使用场景：** `status list` 命令需先调用 `ListWorkitemTypes` 获取 `typeId`，再调用此 API 获取可用状态列表。`--category` 便捷模式应两步合并。

---

## 五、项目成员

### 5.1 ListProjectMembers — 项目成员 ✅

- **Method:** GET
- **Path:** `/oapi/v1/projex/organizations/{orgId}/projects/{projectId}/members`
- **可选参数：** `name`（按名称过滤）、`roleId`
- **返回字段：** `userId`、`userName`、`userAvatar`、`roleId`、`roleName`

---

## 六、项目管理

### 6.1 SearchProjects — 项目列表 ✅

- **Method:** POST
- **Path:** `/oapi/v1/projex/organizations/{orgId}/projects:search`
- **必填参数：** 无（可全量搜索）
- **可选参数：** `conditions`（JSON 过滤）、`page`、`perPage`（0-200）
- **返回字段：** `id`（projectId）、`name`、`status`、`customCode`

---

## 七、平台 API

### 7.1 GetCurrentUser — 当前用户 ✅

- **Method:** GET
- **Path:** `/oapi/v1/platform/user`
- **返回字段：** 用户信息对象（含 `id`、`name`、`email` 等）

---

## 八、流水线 API（Pipeline）⚠️

> **重要说明：** 流水线 API 使用独立的 `/oapi/v1/flow/` 路径前缀，与 Projex 模块完全分离。需要 pipelineId（流水线 ID）而非 projectId。

### 8.1 GetPipeline — 获取流水线详情 ✅

- **Method:** GET
- **Path:** `/oapi/v1/flow/organizations/{orgId}/pipelines/{pipelineId}`
- **返回字段：** 流水线配置信息、名称、创建时间等

### 8.2 CreatePipelineRun — 触发流水线运行 ✅

- **Method:** POST
- **Path:** `/oapi/v1/flow/organizations/{orgId}/pipelines/{pipelineId}/runs`
- **Body：** `{ "params": "<JSON string>" }`（包含 envs、分支等，全部可选）
- **返回：** `pipelineRunId`（integer，本次运行 ID）

### 8.3 GetPipelineRun — 获取运行实例详情 ✅

- **Method:** GET
- **Path:** `/oapi/v1/flow/organizations/{orgId}/pipelines/{pipelineId}/runs/{pipelineRunId}`
- **返回字段：** `pipelineRunId`、`pipelineId`、`startTime`、`endTime`、`triggerMode` 及状态信息

### 8.4 ListPipelineRuns — 运行实例列表 ✅

- **Method:** GET
- **Path:** `/oapi/v1/flow/organizations/{orgId}/pipelines/{pipelineId}/runs`
- **可选参数：** `status`（FAIL/SUCCESS/RUNNING）、`page`、`perPage`（最大30）
- **返回字段：** `pipelineRunId`、`pipelineId`、`startTime`、`endTime`、`triggerMode`

### 8.5 ListPipelines — 获取流水线列表 ⚠️

> **状态：待实际验证**

**发现：** 新版 PAT API（`/oapi/v1/flow/`）中**未找到标准 ListPipelines 端点**。现有文档仅有 `GetPipeline`（单个）和运行相关 API。

**旧版 API（不推荐）：**
```
GET /organization/{organizationId}/pipelines?maxResults=20&nextToken=xxx
```
该路径来自 2021-06-25 版本旧 API，使用不同路径格式，可能不支持 PAT 认证或行为不稳定。

**对 Epic 5（pipeline list）的影响：**
- **选项 A（推荐）**：调用旧版 `/organization/{orgId}/pipelines` 路径，使用 PAT 测试是否可用
- **选项 B**：跳过 `pipeline list`，只实现 `pipeline run` 和 `pipeline status`（需要用户提前知道 pipelineId）
- **选项 C**：使用 `GetPipeline` 获取单个流水线详情，让用户通过其他方式获取 pipelineId

**建议：** Epic 5 实现前，通过实际 API 调用验证旧版 ListPipelines 是否支持 PAT。如不支持，采用选项 B（要求用户提供 pipelineId）。

---

## 九、关键发现：`wi view <serialNumber>` 直传可行性

### 结论：**不可行** ❌

**分析：**

GetWorkitem API 路径：`GET /oapi/v1/projex/organizations/{orgId}/workitems/{id}`

- `{id}` 路径参数为工作项的 **内部 UUID**（如 `7c6da1002a65113899df73****`）
- 序列号（如 `GJBL-1`）是项目范围内的**显示编号**，存储在工作项的 `serialNumber` 字段中
- 两者是不同类型的标识符，UUID 是全局唯一的，serialNumber 是项目维度的显示号
- Yunxiao OpenAPI 文档未提供按 serialNumber 直接查询工作项详情的接口

**结论：** `wi view GJBL-1` 必须通过 **两步解析**：
1. 调用 `SearchWorkitems`（category: `"Req,Task,Bug"`，spaceId: projectId），返回包含 `serialNumber` 的结果
2. 在结果中精确匹配 `serialNumber === "GJBL-1"` 的工作项，提取其 `id`（UUID）
3. 调用 `GetWorkitem` 获取完整详情（可选，SearchWorkitems 已含大部分字段）

这与 FR27 和 v1 报告中 Bug 2 的修复方向一致：`resolveWorkitemId` 应使用全类型搜索 + `serialNumber` 字段精确匹配。

---

## 十、Epic 2-5 各 Story 端点使用指南

| Epic/Story | 命令 | 所需 API 函数 | 前置依赖 |
|-----------|------|-------------|---------|
| Epic 2/2.1 | resolveWorkitemId | SearchWorkitems（全类型 + serialNumber 匹配） | 无 |
| Epic 2/2.2 | wi list | SearchWorkitems | 无 |
| Epic 2/2.3 | wi view | resolveWorkitemId → GetWorkitem | 2.1 |
| Epic 2/2.4 | wi create | ListWorkitemTypes → CreateWorkitem | 无 |
| Epic 2/2.5 | wi update | resolveWorkitemId → UpdateWorkitem | 2.1 |
| Epic 2/2.6 | wi delete | resolveWorkitemId → DeleteWorkitem | 2.1 |
| Epic 2/2.7 | wi comment | resolveWorkitemId → CreateWorkitemComment | 2.1 |
| Epic 2/2.8 | wi comments | resolveWorkitemId → ListWorkitemComments | 2.1 |
| Epic 3/3.1 | wi types | ListWorkitemTypes | 无 |
| Epic 3/3.2 | status list | ListWorkitemTypes → GetWorkitemWorkflow | 无 |
| Epic 3/3.3 | user list/search | ListProjectMembers | 无 |
| Epic 3/3.4 | project list | SearchProjects | 无 |
| Epic 4/4.1 | sprint list | ListSprints（路径含 projectId） | 无 |
| Epic 4/4.2 | sprint view | GetSprintInfo + SearchWorkitems | 无 |
| Epic 5/5.1 | pipeline list | **待验证**（见 8.5） | 需实际 API 测试 |
| Epic 5/5.2 | pipeline run | CreatePipelineRun | 需 pipelineId |
| Epic 5/5.3 | pipeline status | GetPipelineRun | 需 pipelineId + pipelineRunId |

---

## 十一、需新增的 api.js 函数（v1 结论汇总）

| 函数 | API | 所属 Story |
|------|-----|----------|
| `getSprint(client, orgId, projectId, sprintId)` | GetSprintInfo | Epic 4/4.2 |
| `getWorkitemWorkflow(client, orgId, projectId, typeId)` | GetWorkitemWorkflow | Epic 3/3.2 |
| `listProjectMembers(client, orgId, projectId, opts)` | ListProjectMembers | Epic 3/3.3 |
| `createPipelineRun(client, orgId, pipelineId, params)` | CreatePipelineRun | Epic 5/5.2 |
| `getPipelineRun(client, orgId, pipelineId, runId)` | GetPipelineRun | Epic 5/5.3 |
| `listPipelineRuns(client, orgId, pipelineId, opts)` | ListPipelineRuns | Epic 5/5.3 |
| `getPipeline(client, orgId, pipelineId)` | GetPipeline | Epic 5/5.1 |

---

## 十二、需修复的 api.js 函数（v1 结论汇总）

| 函数 | 问题 | 修复方案 |
|------|------|---------|
| `listSprints` | 路径错误（projectId 作为查询参数而非路径参数） | 改为 `/projects/{projectId}/sprints` |
| `searchWorkitems` | 默认 category 为 `"Req"` | 默认改为 `"Req,Task,Bug"` |
| `resolveWorkitemId` | 按 subject 关键字搜索不准确 | 改为全类型搜索 + `serialNumber` 字段精确匹配 |

---

## 十三、未在新版 PAT API 中支持的功能 ❌

| 功能 | 说明 |
|------|------|
| UpdateWorkitemComment | 新版 API 不支持 |
| DeleteWorkitemComment | 新版 API 不支持 |
| 附件上传/删除 | 新版 API 不支持 |
| ListPipelines（新版） | 尚未在 `/oapi/v1/flow/` 命名空间发现，需验证旧版路径 |

---

**报告生成：** claude-sonnet-4-6（Story 1.7 Spike，2026-03-31）
