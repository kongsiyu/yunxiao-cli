# 云效 API 参考（CLI 相关）

**调研日期:** 2026-03-22
**API 版本:** 标准版/专属版（PAT 认证）
**认证方式:** `x-yunxiao-token` 请求头 + Personal Access Token
**Base URL:** `https://openapi-rdc.aliyuncs.com`

> 本文档仅收录与 yunxiao-cli 相关的项目协作（Projex）API。
> 完整 API 列表见官方文档：https://help.aliyun.com/zh/yunxiao/developer-reference/

---

## 目录

- [项目管理](#项目管理)
- [工作项管理](#工作项管理)
- [工作项评论](#工作项评论)
- [迭代管理](#迭代管理)
- [工作项类型与字段](#工作项类型与字段)
- [工作流与状态](#工作流与状态)
- [项目成员](#项目成员)
- [组织与平台](#组织与平台)
- [附件](#附件)
- [API 能力验证总结](#api-能力验证总结)

---

## 项目管理

### SearchProjects

搜索项目列表（支持条件过滤和分页）。

- **Method:** POST
- **Path:** `/oapi/v1/projex/organizations/{organizationId}/projects:search`
- **请求体:**
  | 参数 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | conditions | string | 否 | JSON 过滤条件（name, status, gmtCreate, creator 等） |
  | extraConditions | string | 否 | 额外过滤条件 |
  | orderBy | string | 否 | 排序字段：gmtCreate(默认) 或 name |
  | page | integer | 否 | 页码，默认 1 |
  | perPage | integer | 否 | 每页数量，0-200，默认 20 |
  | sort | string | 否 | 排序方向：desc(默认) 或 asc |
- **响应:** 项目对象数组（id, name, description, customCode, scope, status, creator, modifier, gmtCreate, gmtModified, logicalStatus, customFieldValues）
- **分页 Header:** x-page, x-per-page, x-total, x-total-pages, x-next-page, x-prev-page

### GetProject

获取单个项目详情。

- **Method:** GET
- **Path:** `/oapi/v1/projex/organizations/{organizationId}/projects/{id}`
- **响应:** 完整项目对象

### CreateProject

创建项目。

- **Method:** POST
- **Path:** `/oapi/v1/projex/organizations/{organizationId}/projects`
- **请求体:**
  | 参数 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | customCode | string | 是 | 4-6位大写字母，组织内唯一 |
  | name | string | 是 | 项目名称 |
  | scope | string | 是 | "public" 或 "private" |
  | templateId | string | 是 | 模板标识 |
  | description | string | 否 | 项目描述 |
  | customFieldValues | object | 否 | 自定义字段 {"fieldId":"value"} |
- **响应:** `{"id": "1111"}`

### UpdateProject

更新项目。

- **Method:** PUT
- **Path:** `/oapi/v1/projex/organizations/{organizationId}/projects/{id}`
- **请求体:** 需要更新的字段（name, description, customCode, scope, customFieldValues）
- **响应:** 无

### DeleteProject

删除项目。

- **Method:** DELETE
- **Path:** `/oapi/v1/projex/organizations/{organizationId}/projects/{id}`
- **请求体:** `{"name": "项目名称"}` （name 必填，用于确认）
- **响应:** 无

---

## 工作项管理

### SearchWorkitems

搜索工作项（核心查询 API）。

- **Method:** POST
- **Path:** `/oapi/v1/projex/organizations/{organizationId}/workitems:search`
- **请求体:**
  | 参数 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | category | string | 是 | 工作项类型，**支持逗号分隔**，如 "Req,Task,Bug" |
  | spaceId | string | 是 | 项目 ID |
  | conditions | string | 否 | JSON 过滤条件（conditionGroups 结构） |
  | orderBy | string | 否 | gmtCreate(默认) 或 name |
  | page | integer | 否 | 页码，默认 1 |
  | perPage | integer | 否 | 每页数量，0-200，默认 20 |
  | sort | string | 否 | desc(默认) 或 asc |
  | spaceType | string | 否 | Project(默认) 或 Program |
- **响应字段:** id, subject, description(含 formatType), categoryId, serialNumber, status(对象), logicalStatus, assignedTo, creator, modifier, participants, trackers, verifier, space, sprint, labels, versions, workitemType, gmtCreate, gmtModified, customFieldValues, idPath, parentId
- **分页 Header:** x-page, x-per-page, x-total, x-total-pages

> **已验证:** category 参数确实支持逗号分隔多值（如 "Req,Task,Bug"）。

### GetWorkitem

获取单个工作项详情。

- **Method:** GET
- **Path:** `/oapi/v1/projex/organizations/{organizationId}/workitems/{id}`
- **响应:** 完整工作项对象

### CreateWorkitem

创建工作项。

- **Method:** POST
- **Path:** `/oapi/v1/projex/organizations/{organizationId}/workitems`
- **请求体:**
  | 参数 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | assignedTo | string | 是 | 负责人用户 ID |
  | spaceId | string | 是 | 项目 ID |
  | subject | string | 是 | 工作项标题 |
  | workitemTypeId | string | 是 | 工作项类型 ID（需先查 ListWorkitemTypes） |
  | description | string | 否 | 描述 |
  | customFieldValues | object | 否 | 自定义字段 {"fieldId":"value"} |
  | labels | array[string] | 否 | 标签 ID 数组 |
  | participants | array[string] | 否 | 参与者用户 ID 数组 |
  | sprint | string | 否 | 迭代 ID |
  | trackers | array[string] | 否 | 抄送人用户 ID 数组 |
  | verifier | string | 否 | 验证者用户 ID |
  | versions | array[string] | 否 | 版本 ID 数组 |
  | parentId | string | 否 | 父工作项 ID |
- **响应:** `{"id":"7c6da1002a65113899df73****"}`

> **注意:** `assignedTo` 和 `workitemTypeId` 是必填项。CLI 层需要提供便捷方式让用户找到这些 ID。

### UpdateWorkitem

更新工作项。

- **Method:** PUT
- **Path:** `/oapi/v1/projex/organizations/{organizationId}/workitems/{id}`
- **请求体:** JSON 对象，格式 `{"fieldId":"value"}` 或 `{"fieldId":["value1","value2"]}`
  - 示例：`{"subject":"new-title"}`, `{"status":"statusId"}`, `{"assignedTo":"userId"}`, `{"priority":"priorityId"}`
- **响应:** 无

> **注意:** 更新使用字段 ID 而非字段名。status、assignedTo、priority 等都需要传对应的 ID 值。

### DeleteWorkitem

删除工作项。

- **Method:** DELETE
- **Path:** `/oapi/v1/projex/organizations/{organizationId}/workitems/{id}`
- **响应:** 无

---

## 工作项评论

### ListWorkitemComments

获取工作项评论列表。

- **Method:** GET
- **Path:** `/oapi/v1/projex/organizations/{organizationId}/workitems/{id}/comments`
- **响应字段:** id, content, contentFormat("RICHTEXT"/"MARKDOWN"), gmtCreate, gmtModified, parentId, top, topTime, user(id+name)

### CreateWorkitemComment

创建工作项评论。

- **Method:** POST
- **Path:** `/oapi/v1/projex/organizations/{organizationId}/workitems/{id}/comments`
- **请求体:**
  | 参数 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | content | string | 是 | 评论内容 |
  | parentId | string | 否 | 父评论 ID（用于嵌套回复） |
- **响应:** `{"id": "id-xxx"}`

### UpdateWorkitemComment / DeleteWorkitemComment

**新版 API 不支持。** 评论一旦创建，无法通过 API 编辑或删除。

> **影响:** feat/11（评论编辑/删除）功能不可实现，需从 CLI 计划中移除。

---

## 迭代管理

### ListSprints

获取迭代列表。

- **Method:** GET
- **Path:** `/oapi/v1/projex/organizations/{organizationId}/projects/{id}/sprints`
- **查询参数:**
  | 参数 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | status | array[string] | 否 | 过滤状态：TODO, DOING, ARCHIVED |
  | page | integer | 否 | 页码 |
  | perPage | integer | 否 | 每页数量 |
- **响应字段:** id, name, description, status, startDate, endDate, capacityHours, creator, owners, locked, gmtCreate, gmtModified, modifier
- **分页 Header:** 标准分页

### GetSprintInfo

获取单个迭代详情。

- **Method:** GET
- **Path:** `/oapi/v1/projex/organizations/{organizationId}/projects/{projectId}/sprints/{id}`
- **响应:** 完整迭代对象

> **重要发现:** GetSprintInfo API **存在且可用**！之前假设不存在是错误的。CLI 可以直接调用获取 Sprint 详情。

### CreateSprint

创建迭代。

- **Method:** POST
- **Path:** `/oapi/v1/projex/organizations/{organizationId}/projects/{id}/sprints`
- **请求体:**
  | 参数 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | name | string | 是 | 迭代名称 |
  | owners | array[string] | 是 | 迭代负责人列表 |
  | capacityHours | integer | 否 | 工时容量 |
  | description | string | 否 | 描述 |
  | startDate | string | 否 | 格式 YYYY-MM-DD |
  | endDate | string | 否 | 格式 YYYY-MM-DD |
- **响应:** `{"id": "4c8ae5761194fb3b0deac0dc32"}`

### UpdateSprint

更新迭代。

- **Method:** PUT
- **Path:** `/oapi/v1/projex/organizations/{organizationId}/projects/{projectId}/sprints/{id}`
- **请求体:** name(必填), startDate, endDate, description, capacityHours, owners
- **响应:** 无

---

## 工作项类型与字段

### ListWorkitemTypes

获取项目中的工作项类型。

- **Method:** GET
- **Path:** `/oapi/v1/projex/organizations/{organizationId}/projects/{id}/workitemTypes`
- **查询参数:**
  | 参数 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | category | string | 是 | "Req", "Bug", "Task" 等 |
- **响应字段:** id, name, nameEn, categoryId, description, defaultType, enable, systemDefault

### GetWorkitemTypeFieldConfig

获取工作项类型的字段配置。

- **Method:** GET
- **Path:** `/oapi/v1/projex/organizations/{organizationId}/projects/{projectId}/workitemTypes/{id}/fields`
- **响应字段:** id, name, format, type(NativeField/CustomField), required, defaultValue, description, showWhenCreate, options(displayValue, value, valueEn, id), cascadingOptions

---

## 工作流与状态

### GetWorkitemWorkflow

获取工作项类型的工作流信息（包含所有可用状态）。

- **Method:** GET
- **Path:** `/oapi/v1/projex/organizations/{organizationId}/projects/{projectId}/workitemTypes/{id}/workflows`
- **响应字段:**
  - defaultStatusId (string) - 默认状态 ID
  - statuses (array) - 所有可用状态：id, name, nameEn, displayName

> **注意:** 状态查询是按工作项类型（workitemTypeId）维度，不是项目维度。需要先查 ListWorkitemTypes 获取类型 ID，再查工作流获取状态列表。

---

## 项目成员

### ListProjectMembers

获取项目成员列表。

- **Method:** GET
- **Path:** `/oapi/v1/projex/organizations/{organizationId}/projects/{id}/members`
- **查询参数:**
  | 参数 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | name | string | 否 | 按名称过滤 |
  | roleId | string | 否 | 按角色过滤（如 "project.admin"） |
- **响应字段:** roleId, roleName, userAvatar, userId, userName

---

## 组织与平台

### ListOrganizations

获取当前用户加入的组织列表。

- **Method:** GET
- **Path:** `/oapi/v1/platform/organizations`
- **查询参数:** userId, page, perPage
- **响应字段:** id, name, description, createdAt, creatorId, defaultRole, updateAt

### GetCurrentUser

获取当前用户信息。

- **Method:** GET
- **Path:** `/oapi/v1/platform/user`
- **响应:** 用户信息对象

---

## 附件

### ListWorkitemAttachments

获取工作项附件列表。

- **Method:** GET
- **Path:** `/oapi/v1/projex/organizations/{organizationId}/workitems/{id}/attachments`
- **响应字段:** id, fileId, fileName, size, suffix, url(临时下载链接), creator, modifier, gmtCreate, gmtModified

### GetWorkitemFile

获取单个附件详情（含下载链接）。

- **Method:** GET
- **Path:** `/oapi/v1/projex/organizations/{organizationId}/workitems/{workitemId}/files/{id}`
- **响应字段:** id, name, size, suffix, url(临时下载链接)

### 附件上传/删除

**新版 API 不支持上传和删除附件。** 仅支持列表和下载。

---

## API 能力验证总结

### 已验证可用

| 功能 | API | 备注 |
|------|-----|------|
| 搜索工作项（多类型） | SearchWorkitems | category 支持逗号分隔 "Req,Task,Bug" |
| 获取迭代详情 | GetSprintInfo | **可用！** 之前误判不存在 |
| 列出项目成员 | ListProjectMembers | 支持按名称过滤 |
| 获取工作流状态 | GetWorkitemWorkflow | 按 workitemType 查询 |
| 附件列表 | ListWorkitemAttachments | 只读，含临时下载链接 |
| 创建评论 | CreateWorkitemComment | 支持嵌套回复 |
| 创建迭代 | CreateSprint | name + owners 必填 |
| 更新迭代 | UpdateSprint | 可更新所有字段 |

### 已验证不可用

| 功能 | 说明 |
|------|------|
| 编辑评论 | 新版 API 无 UpdateWorkitemComment |
| 删除评论 | 新版 API 无 DeleteWorkitemComment |
| 上传附件 | 新版 API 不支持 |
| 删除附件 | 新版 API 不支持 |

### 对 CLI 计划的影响

1. **移除 `wi comment-edit` 和 `wi comment-delete`** -- API 不支持
2. **移除附件命令** -- 已在计划中，确认正确
3. **简化 Sprint view** -- 直接用 GetSprintInfo，无需组合查询
4. **Status 查询** -- 需改为按 workitemType 查询工作流，非按项目查询
5. **CreateWorkitem 需要 workitemTypeId** -- CLI 需要先查类型再创建，或提供 `wi types` 命令
