# Story 2.3：wi view 命令

Status: review

## Story

As an AI agent or team member,
I want to view a single workitem by ID or serial number,
So that I can get full details of a specific workitem for context or decision making.

## Acceptance Criteria

1. **Given** 执行 `wi view <uuid> --json`
   **When** 命令运行
   **Then** stdout 输出该工作项的完整详情 JSON

2. **Given** 执行 `wi view GJBL-1 --json`（序列号格式）
   **When** 命令运行
   **Then** CLI 正确解析序列号并返回对应工作项详情（通过 Story 2.1 的 `resolveWorkitemId`）

3. **Given** 执行 `wi view <不存在的ID>`
   **When** 命令运行
   **Then** stderr 输出 `NOT_FOUND` 错误，退出码非零

4. **Given** 执行 `wi view <uuid>`（不带 `--json`）
   **When** 命令运行
   **Then** stdout 以人类可读格式输出工作项详情（序列号、标题、状态、负责人、描述等关键字段）

5. **Given** 未配置认证信息时执行 `wi view <id>`
   **When** 命令运行
   **Then** stderr 输出 `AUTH_MISSING` 错误，退出码非零

## Tasks / Subtasks

- [ ] 确认 `wi view` 命令的 `resolveWorkitemId` 集成正确 (AC: #1, #2, #3)
  - [ ] 检查 `src/commands/workitem.js` 中 `wi view` action：确认已调用 `resolveWorkitemId`（Story 2.1 已实现）
  - [ ] UUID 格式输入：`resolveWorkitemId` 直接返回原值，调用 `getWorkitem` 获取详情
  - [ ] 序列号格式输入（如 `GJBL-1`）：`resolveWorkitemId` 先通过 `searchWorkitems`（全类型 + `serialNumber` 精确匹配）解析为 UUID，再调用 `getWorkitem`
  - [ ] 工作项不存在时：`resolveWorkitemId` 或 `getWorkitem` 抛出 `AppError(NOT_FOUND)`，`withErrorHandling` 捕获并通过 `printError` 输出到 stderr，退出码非零

- [ ] 确认 `--json` 模式输出 (AC: #1, #2)
  - [ ] `--json` 激活时，`printJson(item)` 输出完整工作项 JSON 到 stdout
  - [ ] stdout 无任何 chalk 着色字符或提示文字（纯 JSON）

- [ ] 确认人类可读模式输出 (AC: #4)
  - [ ] 非 `--json` 模式输出工作项详情：序列号、ID、标题、状态、类型、优先级、Sprint、项目、负责人、创建人、创建/更新时间
  - [ ] 有 description 时展示完整描述内容
  - [ ] 有 labels、parentWorkitem、children 时展示对应字段

- [ ] 手动验证测试（AC: #1, #2, #3）
  - [ ] 用真实 UUID 执行 `wi view <uuid> --json`，确认输出合法 JSON
  - [ ] 用序列号格式执行 `wi view GJBL-1 --json`，确认正确解析并返回详情
  - [ ] 用不存在的 ID 执行 `wi view fake-id-xxxx`，确认 stderr 包含 NOT_FOUND，退出码非零

## Dev Notes

### 当前实现状态（Story 2.1 已完成）

Story 2.1 已完成以下工作，`wi view` 命令的核心逻辑已就位：

**`src/commands/workitem.js`（`wi view` action，第 78-122 行）：**
```js
wi
  .command("view <id>")
  .description("View work item details by ID or serial number (e.g. GJBL-1)")
  .option("-p, --project <id>", "Project ID (needed for serial number lookup)")
  .action(withErrorHandling(async (id, opts) => {
    const spaceId = opts.project || defaultProjectId;
    if (/^[A-Z]+-\d+$/i.test(id) && !spaceId) {
      printError("INVALID_ARGS", "project ID required for serial number lookup", jsonMode);
      process.exit(1);
    }
    const resolvedId = await resolveWorkitemId(client, orgId, spaceId, id);
    const item = await getWorkitem(client, orgId, resolvedId);
    if (jsonMode) {
      printJson(item);
      return;
    }
    // ... 人类可读格式输出
  }));
```

**`src/api.js`（`resolveWorkitemId`，第 146-168 行）：**
```js
export async function resolveWorkitemId(client, orgId, spaceId, identifier) {
  if (!identifier) return null;
  if (/^[A-Z]+-\d+$/i.test(identifier)) {
    const serialNumber = identifier.toUpperCase();
    const results = await searchWorkitems(client, orgId, spaceId, {
      category: "Req,Task,Bug",
      page: 1,
      perPage: 50,
    });
    const match = (results || []).find(
      (i) => i.serialNumber?.toUpperCase() === serialNumber
    );
    if (!match) {
      throw new AppError(ERROR_CODE.NOT_FOUND, `Workitem ${identifier} not found`);
    }
    return match.id;
  }
  return identifier;  // UUID 格式直接返回
}
```

**`src/api.js`（`getWorkitem`，第 81-85 行）：**
```js
export async function getWorkitem(client, orgId, workitemId) {
  const url = `/oapi/v1/projex/organizations/${orgId}/workitems/${workitemId}`;
  const res = await client.get(url);
  return res.data;
}
```

### 本 Story 的核心任务

本 Story 是**验证型**——核心代码（`resolveWorkitemId` + `getWorkitem` + `wi view` action）在 Story 2.1 中已实现。

开发者的主要工作是：
1. **验证**代码已满足所有 AC（阅读代码、手动测试）
2. 如发现缺失或 Bug，**修复**并记录
3. 更新 Story 状态为 `review`

### 关键 API 端点（来自 api-verification-v2.md）

**GetWorkitem — 获取工作项详情：**
- Method: GET
- Path: `/oapi/v1/projex/organizations/{orgId}/workitems/{id}`
- 路径参数 `{id}` 必须是 UUID（非序列号，序列号需先通过 `resolveWorkitemId` 解析）
- 返回字段：`id`、`subject`、`serialNumber`、`description`、`status`（对象）、`assignedTo`、`workitemType`、`customFieldValues`、`gmtCreate`、`gmtModified` 等

**SearchWorkitems（resolveWorkitemId 内部调用）：**
- Method: POST
- Path: `/oapi/v1/projex/organizations/{orgId}/workitems:search`
- 必填：`category`（`"Req,Task,Bug"`）、`spaceId`（项目 ID）
- 返回字段包含 `serialNumber`（用于精确匹配）

### 序列号解析流程（wi view GJBL-1）

```
wi view GJBL-1 --json
  → resolveWorkitemId(client, orgId, spaceId, "GJBL-1")
    → /^[A-Z]+-\d+$/i.test("GJBL-1") === true
    → searchWorkitems(category: "Req,Task,Bug", perPage: 50)
    → results.find(i => i.serialNumber?.toUpperCase() === "GJBL-1")
    → match.id  (UUID, e.g. "7c6da1002a65113899df73****")
  → getWorkitem(client, orgId, "7c6da1002a65113899df73****")
    → GET /oapi/v1/projex/organizations/{orgId}/workitems/{uuid}
    → item (完整工作项对象)
  → printJson(item)  → stdout
```

### 错误处理流程（不存在的 ID）

```
wi view fake-uuid-xxxx
  → resolveWorkitemId(...) → 返回 "fake-uuid-xxxx"（UUID 格式直接返回）
  → getWorkitem(...) → axios 404 → 抛出 AppError(NOT_FOUND)
  → withErrorHandling 捕获 → printError("NOT_FOUND", ..., jsonMode) → stderr
  → process.exit(1)
```

**注意：** `withErrorHandling` 在 `src/index.js` 中定义，负责捕获 `AppError` 并调用 `printError`，确保 stderr 输出 `NOT_FOUND`，退出码非零。若发现 `withErrorHandling` 未正确处理 `AppError`，需在 `src/index.js` 修复。

### 依赖关系

| 依赖 | 状态 | 说明 |
|------|------|------|
| Story 2.1（resolveWorkitemId） | done | 序列号解析核心逻辑已完成 |
| Story 1.7（API 验证 Spike） | done | GetWorkitem 端点已验证，`{id}` 必须为 UUID |
| Story 1.4（errors.js） | done | `AppError`、`ERROR_CODE.NOT_FOUND` 已定义 |
| Story 1.3（output.js） | done | `printJson`、`printError` 已实现 |

### 潜在需检查的边界情况

1. **序列号大小写**：输入 `gjbl-1` vs `GJBL-1` — `resolveWorkitemId` 已做 `toUpperCase()` 处理
2. **未设置 projectId 时的序列号查找**：命令中已有校验（缺少 `spaceId` 且输入为序列号格式时报 `INVALID_ARGS`）
3. **getWorkitem 返回 404**：需确认 axios 错误是否被正确转换为 `AppError(NOT_FOUND)`（检查 `withErrorHandling` 的 API 错误映射逻辑）
4. **--json 模式下 stderr 格式**：错误应为 `{"error":"...","code":"NOT_FOUND"}` 格式（由 `printError` 保证）

### 文件路径参考

| 文件 | 说明 |
|------|------|
| `src/commands/workitem.js` | wi view 命令定义（第 78-122 行） |
| `src/api.js` | `resolveWorkitemId`（第 146-168 行）、`getWorkitem`（第 81-85 行） |
| `src/errors.js` | `AppError`、`ERROR_CODE` 定义 |
| `src/output.js` | `printJson`、`printError` 函数 |
| `src/index.js` | `withErrorHandling` 定义（错误捕获逻辑） |

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3] — 验收标准
- [Source: _bmad-output/planning-artifacts/prd.md#FR2] — wi view UUID/序列号支持要求
- [Source: _bmad-output/research/api-verification-v2.md#九] — wi view serialNumber 直传不可行，确认两步解析方案
- [Source: _bmad-output/research/api-verification-v2.md#一] — GetWorkitem API 路径和返回字段
- [Source: _bmad-output/implementation-artifacts/2-1-serial-number-resolve.md] — resolveWorkitemId 实现细节

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

无

### Completion Notes List

- 核心逻辑（resolveWorkitemId + getWorkitem + wi view action）在 Story 2.1 中已全部实现，本 Story 为验证型
- 发现并修复 Bug：`withErrorHandling`（src/index.js）对 HTTP 404 未映射为 `NOT_FOUND`，已修复为 `err.response.status === 404` → `NOT_FOUND`
- 新增测试文件 `test/wi-view.test.js`，覆盖 resolveWorkitemId UUID/序列号/NOT_FOUND、getWorkitem URL 验证、404 映射逻辑

### File List

- `src/index.js` — 修复 withErrorHandling：HTTP 404 → NOT_FOUND
- `test/wi-view.test.js` — 新增 wi view 专项测试
