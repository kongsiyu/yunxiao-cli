# Story 3.1：wi types 命令

Status: done

## Story

As an AI agent,
I want to list workitem types with their IDs,
So that I can obtain the correct `typeId` before creating a workitem.

## Acceptance Criteria

1. **Given** 执行 `wi types --json`
   **When** 命令运行
   **Then** stdout 输出工作项类型列表 JSON，每项包含 `typeId`、`name`、`category`

2. **Given** 执行 `wi types --category Bug --json`
   **When** 命令运行
   **Then** 只返回 category 为 Bug 的工作项类型

3. **Given** 执行 `wi types`（默认输出）
   **When** 命令运行
   **Then** 以人类可读表格显示类型列表

## Tasks / Subtasks

- [x] 修复 `wi types` JSON 输出字段映射（commands/workitem.js）(AC: #1, #2)
  - [x] JSON 模式：将每个类型对象映射为 `{ typeId: t.id, name: t.name, category: t.categoryId || opts.category }`
  - [x] 保留 `total` 字段
- [x] 改进 `wi types` 人类可读表格输出（commands/workitem.js）(AC: #3)
  - [x] 表格增加 Category 列
  - [x] 保留 `[default]` 标记
- [x] 更新 sprint-status.yaml 中 `3-1-wi-types` 状态

## Dev Notes

### API 信息

- **端点：** `GET /oapi/v1/projex/organizations/{orgId}/projects/{projectId}/workitemTypes`
- **必填参数：** `category`（query）：`"Req"`、`"Bug"` 或 `"Task"`（每次只能查单个 category）
- **返回字段：** `id`（即 typeId）、`name`、`nameEn`、`categoryId`（值即 "Req"/"Bug"/"Task"）、`defaultType`（布尔）

### 当前代码位置

- API 函数：`src/api.js` → `getWorkitemTypes(client, orgId, projectId, category)`
- 命令：`src/commands/workitem.js` → `wi types` 子命令（约 273 行）

### JSON 字段映射

当前 JSON 输出直接输出原始 API 对象（字段为 `id`），需映射为：
```json
{
  "types": [
    { "typeId": "xxx", "name": "需求", "category": "Req" },
    ...
  ],
  "total": 3
}
```

`category` 字段从 `t.categoryId` 取，若为空则用 `opts.category` 兜底。

### Review Findings

- [x] [Review][Patch] 表格循环 `for (const t of types)` 未防护 null/undefined [src/commands/workitem.js:295] — 已修复：改为 `for (const t of (types || []))`
- [x] [Review][Patch] `t.categoryId || opts.category` 应用 `??` 避免空串被覆盖 [src/commands/workitem.js:289,297] — 已修复：改为 `??` nullish coalescing
- [x] [Review][Defer] `t.id` 缺失时 typeId 为 undefined [src/commands/workitem.js] — deferred, pre-existing
- [x] [Review][Defer] `t.name` null/undefined 无防护 [src/commands/workitem.js] — deferred, pre-existing
- [x] [Review][Defer] `total` 为本地计数非服务端总数 [src/commands/workitem.js] — deferred, 符合项目设计
