# Story 10-6：mr create 命令

**Story ID**: 10.6  
**Epic**: 10 - Codeup 集成  
**Status**: done  
**Created**: 2026-04-18  
**Author**: Sue (PM Senior)

---

## 用户故事

As a developer,  
I want to run `yunxiao mr create <repoId>` with source/target branch, title, and optional workitem linkage,  
So that I can create a Codeup merge request from the terminal and connect it to my Yunxiao work without leaving the CLI.

---

## 验收标准

### AC1：创建 MR 的最小必填路径
**Given** 用户已通过 `yunxiao auth login` 配置有效 PAT  
**When** 执行 `yunxiao mr create 12345 --title "Fix release branch" --source-branch feature/fix --target-branch master`  
**Then** 调用 `POST /api/v3/projects/12345/merge_requests`  
**And** 请求体至少包含 `title`、`source_branch`、`target_branch`  
**And** human-readable stdout 输出创建结果，至少包含：MR ID、标题、状态、源分支、目标分支、Web URL

### AC2：`--json` 输出
**Given** 用户执行 `yunxiao mr create 12345 --title "Fix release branch" --source-branch feature/fix --target-branch master --json`  
**When** 创建成功  
**Then** 向 stdout 输出纯 JSON，不含 chalk 颜色或额外提示  
**And** JSON 至少包含字段：`id`、`title`、`description`、`state`、`sourceBranch`、`targetBranch`、`author`、`assignee`、`webUrl`、`createdAt`、`updatedAt`、`workitemId`

### AC3：可选 description
**Given** 用户指定 `--description "Release fix"`  
**When** 创建 MR  
**Then** 请求体包含 `description: "Release fix"`  
**And** 未指定 description 时不要向请求体写入空字符串，除非 Codeup API 实测要求

### AC4：工作项关联参数
**Given** 用户指定 `--workitem-id <workitemId>`  
**When** 创建 MR  
**Then** 请求体包含 `workitem_id: "<workitemId>"`  
**And** `workitemId` 作为非空字符串原样传递，不要用 `parsePositiveInt()` 强制成数字

### AC5：指派人与 reviewer 参数
**Given** 用户指定 `--assignee-id <id>` 和 `--reviewer-ids "1,2,3"`  
**When** 创建 MR  
**Then** 请求体包含 `assignee_id`  
**And** 请求体包含 `reviewer_ids`，由逗号分隔输入转换为去空白后的数组  
**And** 不做用户搜索、名称解析或 reviewer 二次查询

### AC6：repoId 缺失处理
**Given** 用户执行 `yunxiao mr create`  
**When** 未提供 repoId  
**Then** 输出 `INVALID_ARGS` 错误  
**And** 提示 `repoId is required`  
**And** 退出码为 1

### AC7：必填 option 缺失处理
**Given** 用户缺少 `--title`、`--source-branch` 或 `--target-branch`  
**When** 执行 `yunxiao mr create 12345`  
**Then** 输出 `INVALID_ARGS` 错误  
**And** 分别提示 `title is required`、`sourceBranch is required` 或 `targetBranch is required`  
**And** 退出码为 1

### AC8：repoId 非正整数处理
**Given** 用户执行 `yunxiao mr create abc --title T --source-branch feature/a --target-branch master`  
**When** 参数不是正整数  
**Then** 输出 `INVALID_ARGS` 错误  
**And** 提示 `repoId must be a positive integer`  
**And** 退出码为 1

### AC9：可选参数空值处理
**Given** 用户传入空白 `--workitem-id` 或 `--reviewer-ids ","`  
**When** 命令执行参数校验  
**Then** 输出 `INVALID_ARGS` 错误  
**And** 提示对应参数必须为非空值  
**And** 退出码为 1

### AC10：认证缺失处理
**Given** 未配置 PAT  
**When** 执行 `yunxiao mr create 12345 --title T --source-branch feature/a --target-branch master`  
**Then** 输出 `AUTH_MISSING` 错误  
**And** 提示 `Run: yunxiao auth login`  
**And** 退出码为 1

### AC11：资源不存在或权限不足处理
**Given** repoId 不存在、分支不存在，或当前用户无权限访问  
**When** 创建 MR  
**Then** 404 由现有 `withErrorHandling` 映射为 `NOT_FOUND`  
**And** 401/403 由 `codeupCall()` 映射为 `AUTH_FAILED`  
**And** 退出码为 1

### AC12：API 业务错误处理
**Given** Codeup API 返回非 2xx 响应（例如重复 MR、源/目标分支冲突、400/409/422/500）  
**When** 创建 MR  
**Then** 输出 `API_ERROR` 错误  
**And** 尽量保留 `err.response.data.errorMessage` 或 `statusText`  
**And** 退出码为 1

---

## 技术需求

### API 端点

来源：`_bmad-output/research/codeup-api-verification.md` Q8 / Q9

```text
POST /api/v3/projects/{id}/merge_requests
```

已确认约束：
- Base URL：`https://codeup.aliyuncs.com/api/v3`
- 认证 Header：`x-yunxiao-token: <PAT>`
- `id` 是路径参数，即 CLI 的 `repoId`
- 必填请求体字段：`title`、`source_branch`、`target_branch`
- 可选请求体字段：`description`、`assignee_id`、`reviewer_ids`、`workitem_id`
- MR 与工作项关联支持 `workitem_id` API 参数，也支持 commit message 关键字方式

### 命令格式

推荐实现为：

```text
yunxiao mr create [repoId] --title <title> --source-branch <branch> --target-branch <branch> [--description <text>] [--assignee-id <id>] [--reviewer-ids <ids>] [--workitem-id <id>] [--json]
```

实现要求：
- `repoId` 使用 `[repoId]` 可选参数形式注册，以便输出自定义 `repoId is required`，不要让 Commander 在进入 action 前中断。
- `--title`、`--source-branch`、`--target-branch` 使用普通 `.option()`，在 action 内显式校验并用 `printError(ERROR_CODE.INVALID_ARGS, ..., jsonMode)` 输出错误。
- `--source-branch` 映射到 API 的 `source_branch`；`--target-branch` 映射到 `target_branch`。
- 不要为本 Story 增加 branch list、user search、workitem resolve 或 commit message 解析。

### 修改 `src/codeup-api.js`

在现有 `getMr` 之后追加 `createMr`，保持 Codeup API 边界不变：

```js
export async function createMr(codeupClient, repoId, payload) {
  return codeupCall(() =>
    codeupClient.post(`/projects/${repoId}/merge_requests`, payload).then((r) => r.data)
  );
}
```

实现要求：
- 不要改动 `CODEUP_BASE`、`createCodeupClient` 或 `codeupCall` 的整体职责。
- 继续让 `codeupCall()` 只负责 401/403 到 `AUTH_FAILED` 的映射。
- 404、409、422 等非认证错误继续交给 `withErrorHandling` 统一处理。

### 修改 `src/commands/repo.js`

在现有 import 中加入 `createMr`：

```js
import { listRepos, getRepo, listMrs, getMr, createMr } from "../codeup-api.js";
```

在现有 `mr view` 之后追加 `mr create` 子命令，继续使用同一个顶层 `mr` 命令：

```js
mr
  .command("create [repoId]")
  .description("Create a Codeup merge request")
  .option("--title <title>", "Merge request title")
  .option("--source-branch <branch>", "Source branch")
  .option("--target-branch <branch>", "Target branch")
  .option("--description <description>", "Merge request description")
  .option("--assignee-id <id>", "Assignee user id")
  .option("--reviewer-ids <ids>", "Comma-separated reviewer user ids")
  .option("--workitem-id <id>", "Yunxiao workitem id to associate with the MR")
  .action(withErrorHandling(async (repoId, opts) => {
    // 校验、payload 构造、调用 createMr、输出映射
  }));
```

参数校验要求：
- `repoId` 复用现有 `parsePositiveInt(repoId, "repoId", jsonMode)`。
- `title`、`sourceBranch`、`targetBranch` 使用 `String(value || "").trim()` 校验非空；错误消息分别固定为 `title is required`、`sourceBranch is required`、`targetBranch is required`。
- `workitemId`、`assigneeId` 只校验非空白，不强制数字，避免误伤 UUID/字符串型 ID。
- `reviewerIds` 按逗号分隔、trim、过滤空项；如果用户传入但结果为空，输出 `reviewerIds must contain at least one id`。

Payload 构造要求：

```js
const payload = {
  title,
  source_branch: sourceBranch,
  target_branch: targetBranch,
};
if (description !== undefined) payload.description = description;
if (assigneeId !== undefined) payload.assignee_id = assigneeId;
if (reviewerIds !== undefined) payload.reviewer_ids = reviewerIds;
if (workitemId !== undefined) payload.workitem_id = workitemId;
```

注意：
- 不要把 `repoId` 写进 body；它是路径参数。
- 不要传入值为 `undefined` 的字段。
- `description` 如果用户显式传入空字符串，应按参数校验策略处理；建议允许空描述但不主动生成空字段。

### 输出字段要求

创建成功后的 human-readable 模式建议输出：
- `Created Merge Request`
- `ID`
- `Title`
- `State`
- `Source Branch`
- `Target Branch`
- `Author`
- `Assignee`
- `Web URL`
- `Created At`
- `Workitem ID`（如果请求或响应中有）

`--json` 模式建议输出稳定对象：

```json
{
  "id": 88,
  "title": "Fix release branch",
  "description": "Release fix",
  "state": "opened",
  "sourceBranch": "feature/fix",
  "targetBranch": "master",
  "author": { "id": "u-1", "name": "alice" },
  "assignee": { "id": "u-2", "name": "bob" },
  "webUrl": "https://codeup.aliyuncs.com/...",
  "createdAt": "2026-04-18T00:00:00Z",
  "updatedAt": "2026-04-18T00:00:00Z",
  "workitemId": "GJBL-123"
}
```

字段映射原则：
- `id` 优先使用 `iid ?? id`，延续 `mr list` / `mr view` 的用户可读 MR ID 约定。
- `author.name` / `assignee.name` 优先使用 `name`，回退到 `username`。
- `description`、`webUrl`、`createdAt`、`updatedAt`、`workitemId` 缺省时输出空字符串，避免 `undefined`。
- 可复用或扩展 `mapUser()`；如复用 `mapMrDetail()`，不要破坏现有 `mr view` 测试预期。

---

## 工作项关联策略

### 默认方案：显式 `workitem_id`

Story 10.6 的主路径是 `--workitem-id <id>`，直接传递 API 参数 `workitem_id`。这是 Q9 已确认的能力，也是 CLI 最可控、最可测试的关联方式。

### 兼容方案：commit message 关键字

Codeup 也支持通过 commit message 关键字关联工作项，但本 Story 不解析、不生成、不修改 commit message。兼容策略如下：
- 如果用户已经在 commit message 中写了关联关键字，CLI 不需要额外处理。
- 如果用户同时传入 `--workitem-id` 且 commit message 中也有关键字，CLI 应照常传递 `workitem_id`，不做冲突检测。
- 如果用户想依赖关键字路径，可自行在 commit message 或 `--description` 中写明；CLI 不应替用户推断。

这能避免 Story 10.6 扩大到 Git 历史解析、提交规范检查或工作项解析。

---

## 架构与实现护栏

### 代码结构要求

仅在以下文件中实现 Story 10.6：
- `src/codeup-api.js`
- `src/commands/repo.js`
- `test/codeup-api.test.js`
- `test/repo.test.js`

不要修改：
- `src/index.js`：`createCodeupClient` 和 `registerRepoCommands` 已接入。
- `src/api.js`：这是 Yunxiao OpenAPI 客户端，不是 Codeup API 客户端。
- `src/commands/workitem.js`：本 Story 不做 workitem 解析或查询。
- README 或技能文件：除非后续单独 story 要求补文档。

### 复用优先级

- 复用 `src/codeup-api.js` 的 `codeupCall()`。
- 复用 `src/commands/repo.js` 的 `parsePositiveInt()`、`mapUser()`、`printJson()`、`printError()` 和当前 MR 输出风格。
- 复用 `test/repo.test.js` 的 `MockExit`、`setupCapture()`、`buildProgram()` 测试夹具。
- 不要新建 `src/commands/mr.js`，不要把 `registerRepoCommands` 重命名为其他函数。

### 与现有错误处理链对齐

当前错误处理基线来自 `src/index.js`：
- `AppError` 直接按其 `code` 输出。
- HTTP 401/403 -> `AUTH_FAILED`。
- HTTP 404 -> `NOT_FOUND`。
- 其他 HTTP 错误 -> `API_ERROR`。

Story 10.6 不应在命令层重复捕获并改写 HTTP 错误，否则容易破坏 `mr list` / `mr view` 已建立的行为。

---

## 前序故事情报

### 来自 Story 10.5 的可复用模式

`_bmad-output/implementation-artifacts/10-5-mr-view.md` 与当前代码已建立这些模式：
- `mr` 是顶层命令，与 `repo` 平级。
- `mr view` 使用 `[repoId] [mrId]`，靠 action 内显式校验输出自定义 `INVALID_ARGS`。
- `parsePositiveInt()` 已被加固为正则校验，能拒绝 `123abc` 这类部分数字输入；Story 10.6 必须复用它校验 `repoId`。
- `getMr()` 已放在 `src/codeup-api.js` 并复用 `codeupCall()`；`createMr()` 应按同一模式追加。
- `mapUser()` 已存在，可继续用于 author / assignee 输出映射。

### 来自 Story 10.4 的可复用模式

`_bmad-output/implementation-artifacts/10-4-mr-list.md` 与当前代码已建立这些模式：
- `mr list` 的 `id` 展示使用 `iid ?? id`，Story 10.6 创建成功后的输出应延续这一规则。
- `--json` 模式下 stdout 只能是 JSON；human-readable 日志必须走 `console.log` 且不能在 JSON 模式触发。
- API 响应可能是数组、对象或带 `data` 包装；create 场景通常应使用单对象，但要安全处理缺省字段。

### 最近提交脉络

最近相关提交：
- `8f93285 Merge pull request #80 from kongsiyu/story/10-5-mr-view`
- `1c5ec1f feat(codeup): add mr view command`
- `8940411 feat(codeup): add mr list command with tests`

这说明 Epic 10 当前处于稳定的 MR 命令增量扩展阶段。Story 10.6 应继续追加 `mr create`，不要进行命令树重构。

---

## 测试要求

### 修改 `test/codeup-api.test.js`

为 `createMr` 增加单元测试，至少覆盖：
1. `createMr(client, 123, payload)` 调用 `POST /projects/123/merge_requests` 并返回 `r.data`
2. payload 原样传递，包含 `title`、`source_branch`、`target_branch`、`workitem_id`
3. 401 响应 -> `AUTH_FAILED`
4. 403 响应 -> `AUTH_FAILED`
5. 404 或 409 响应原样抛出，由命令层/全局错误处理映射

### 修改 `test/repo.test.js`

追加 `mr create command` 测试组，至少覆盖：
1. 正常 human-readable 输出包含新 MR 标题、状态、分支、URL
2. `--json` 输出字段映射正确，stdout 不含 table/log 文本
3. 请求 payload 正确映射 `title`、`source_branch`、`target_branch`
4. `--description` 写入 `description`
5. `--workitem-id` 写入 `workitem_id`
6. `--assignee-id` 写入 `assignee_id`
7. `--reviewer-ids "1,2,3"` 写入 `reviewer_ids: ["1", "2", "3"]`
8. 缺少 `repoId` -> `INVALID_ARGS` + `repoId is required`
9. 缺少 `--title` -> `INVALID_ARGS` + `title is required`
10. 缺少 `--source-branch` -> `INVALID_ARGS` + `sourceBranch is required`
11. 缺少 `--target-branch` -> `INVALID_ARGS` + `targetBranch is required`
12. 非法 `repoId` / 部分数字 `repoId` -> `INVALID_ARGS`
13. 空 `--reviewer-ids ","` -> `INVALID_ARGS`
14. `codeupClient = null` -> `AUTH_MISSING`
15. 404 响应通过 `withErrorHandling` 输出 `NOT_FOUND`
16. 409/422 响应通过 `withErrorHandling` 输出 `API_ERROR`

### 回归验证

至少执行：
- `npm test`
- `npm run lint`

重点确认：
- 现有 `repo list` / `repo view` / `mr list` / `mr view` 测试不回归
- `--json` 成功输出只写 stdout，错误输出只写 stderr
- `mr create` 不触发真实 API，所有测试均使用 mock client

---

## 风险与注意事项

1. **创建 MR 是有副作用操作**  
   测试不得调用真实 Codeup API。实现完成后的手工验证如需真实创建 MR，必须由人工明确提供测试仓库和测试分支。

2. **`workitem_id` 类型未在本地研究中细化**  
   不要把 `workitem_id` 强制转成数字。Yunxiao 工作项历史上可能出现 UUID、序列号或字符串 ID；Story 10.6 只负责把用户显式传入的 ID 传给 Codeup。

3. **`reviewer_ids` 的 API 类型需要最小假设**  
   研究结论确认字段名为 `reviewer_ids`，但未细化元素类型。CLI 先将逗号分隔输入转为字符串数组，避免丢失前导零或字符串型 ID。

4. **不要提前实现工作项解析**  
   不要调用 `resolveWorkitemId()`、`wi view`、`searchWorkitems` 或 Yunxiao OpenAPI 来转换 `--workitem-id`。这会引入跨模块耦合和额外失败模式。

5. **不要改动全局错误处理**  
   `withErrorHandling` 已满足 404 -> `NOT_FOUND`、其他 HTTP -> `API_ERROR`。命令层只做参数校验和成功输出。

6. **不要提前收口 Epic 10**  
   Story 10.6 完成后才能评估 Epic 10 是否进入 retrospective；本 Story 的开发范围不包括 retrospective 或新 Epic。

---

## 完成标准

- [x] `src/codeup-api.js` 已追加 `createMr(codeupClient, repoId, payload)`
- [x] `src/commands/repo.js` 已追加 `mr create [repoId]` 命令
- [x] 必填参数、可选参数、`workitem_id`、`--json` 和错误处理行为均满足 AC
- [x] `test/codeup-api.test.js` 已追加 `createMr` API 层测试
- [x] `test/repo.test.js` 已追加 `mr create` 命令层测试
- [x] `npm test` 通过
- [x] `npm run lint` 通过
- [x] 代码审查通过
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` 在开发完成后更新为 `done`

---

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-04-18: Red phase confirmed missing `createMr` export and unknown `mr create` command.
- 2026-04-18: `npm test` passed with 293 tests after implementation and review fix.
- 2026-04-18: `npm run lint` passed via `node src/index.js --version`.
- 2026-04-18: Code review found auth-before-argument-validation precedence risk for AC6; fixed by validating local args before checking `codeupClient`.

### Completion Notes List

- Added Codeup `createMr()` wrapper using `POST /projects/{repoId}/merge_requests` and existing `codeupCall()` authentication mapping.
- Added `yunxiao mr create [repoId]` with explicit validation for `repoId`, required branch/title options, non-empty optional ID values, and comma-split reviewer IDs.
- Added stable success output for human-readable and `--json` modes, including `workitemId` fallback from response or request.
- Preserved existing `withErrorHandling` behavior for 404 `NOT_FOUND`, auth failures, and business/API errors.
- Added API and command tests covering success payloads, JSON mapping, validation failures, auth missing, and 404/409/422 error mapping.

### File List

- `_bmad-output/implementation-artifacts/10-6-mr-create.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/codeup-api.js`
- `src/commands/repo.js`
- `test/codeup-api.test.js`
- `test/repo.test.js`

### Change Log

- 2026-04-18: Story created and marked ready-for-dev with comprehensive developer guardrails.
- 2026-04-18: Implemented `mr create`, added tests, completed code review fix, and marked story done.
