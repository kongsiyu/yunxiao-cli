# Story 10-5：mr view 命令

**Story ID**: 10.5  
**Epic**: 10 - Codeup 集成  
**Status**: done  
**Created**: 2026-04-18  
**Author**: Sue (PM Senior)

---

## 用户故事

As a developer,  
I want to run `yunxiao mr view <repoId> <mrId>` to see detailed information about a specific Codeup merge request,  
So that I can inspect MR status, branches, author, assignee, and web link without leaving the terminal.

---

## 验收标准

### AC1：基本详情输出
**Given** 用户已通过 `yunxiao auth login` 配置有效 PAT  
**When** 执行 `yunxiao mr view 12345 88`  
**Then** 以格式化文本输出 MR 详情，至少包含：MR ID、标题、状态、源分支、目标分支、作者、指派人、Web URL、创建时间、更新时间

### AC2：`--json` 输出
**Given** 用户执行 `yunxiao mr view 12345 88 --json`  
**When** 命令执行  
**Then** 向 stdout 输出纯 JSON，不含 chalk 颜色  
**And** JSON 至少包含字段：`id`、`title`、`description`、`state`、`sourceBranch`、`targetBranch`、`author`、`assignee`、`webUrl`、`createdAt`、`updatedAt`

### AC3：repoId 缺失处理
**Given** 用户执行 `yunxiao mr view` 或 `yunxiao mr view 12345`  
**When** 未提供完整参数  
**Then** 输出 `INVALID_ARGS` 错误  
**And** 缺少 `repoId` 时提示 `repoId is required`  
**And** 缺少 `mrId` 时提示 `mrId is required`  
**And** 退出码为 1

### AC4：repoId / mrId 非正整数处理
**Given** 用户执行 `yunxiao mr view abc 88` 或 `yunxiao mr view 12345 xyz`  
**When** 参数不是正整数  
**Then** 输出 `INVALID_ARGS` 错误  
**And** 分别提示 `repoId must be a positive integer` 或 `mrId must be a positive integer`  
**And** 退出码为 1

### AC5：资源不存在处理
**Given** 指定的 repoId 或 mrId 不存在，或当前用户无权限访问  
**When** 执行 `yunxiao mr view 12345 99999`  
**Then** 输出 `NOT_FOUND` 或 `AUTH_FAILED` 错误  
**And** 退出码为 1

### AC6：认证缺失处理
**Given** 未配置 PAT  
**When** 执行 `yunxiao mr view 12345 88`  
**Then** 输出 `AUTH_MISSING` 错误  
**And** 提示 `Run: yunxiao auth login`  
**And** 退出码为 1

### AC7：API 错误处理
**Given** Codeup API 返回非 2xx 响应（非 401/403/404）  
**When** 执行 `yunxiao mr view 12345 88`  
**Then** 输出 `API_ERROR` 错误  
**And** 退出码为 1

---

## 技术需求

### API 端点

来源：`_bmad-output/research/codeup-api-verification.md` Q7

```text
GET /api/v3/projects/{repoId}/merge_requests/{mrId}
```

已确认约束：
- Base URL：`https://codeup.aliyuncs.com/api/v3`
- 认证 Header：`x-yunxiao-token: <PAT>`
- `repoId` 为数字 ID
- `mrId` 为 MR 标识符；现有 `mr list` 展示 `iid ?? id`，`mr view` 应优先按项目内可读 ID 使用 `iid` 作为 CLI 输入，但需在实现时用真实接口返回字段验证

### 修改 `src/codeup-api.js`

在现有 `listMrs` 之后追加 `getMr` 函数，保持与 `listRepos`、`getRepo`、`listMrs` 相同的封装边界：

```js
export async function getMr(codeupClient, repoId, mrId) {
  return codeupCall(() =>
    codeupClient.get(`/projects/${repoId}/merge_requests/${mrId}`).then((r) => r.data)
  );
}
```

实现要求：
- 不要改动 `CODEUP_BASE`、`createCodeupClient` 或 `codeupCall` 的整体边界
- 复用 `codeupCall()` 做 401/403 到 `AUTH_FAILED` 的映射
- 404 继续交由 `withErrorHandling` 在 `src/index.js` 中映射为 `NOT_FOUND`

### 修改 `src/commands/repo.js`

在现有 `mr list` 之后追加 `mr view` 子命令，继续使用当前顶层命令注册模式：

```js
mr
  .command("view [repoId] [mrId]")
  .description("View details of a Codeup merge request")
  .action(withErrorHandling(async (repoId, mrId) => {
    if (!codeupClient) {
      throw new AppError(ERROR_CODE.AUTH_MISSING, "Authentication required. Run: yunxiao auth login");
    }
    if (!repoId) {
      printError(ERROR_CODE.INVALID_ARGS, "repoId is required", jsonMode);
      process.exit(1);
    }
    if (!mrId) {
      printError(ERROR_CODE.INVALID_ARGS, "mrId is required", jsonMode);
      process.exit(1);
    }

    const id = parsePositiveInt(repoId, "repoId", jsonMode);
    const mergeRequestId = parsePositiveInt(mrId, "mrId", jsonMode);
    const mrDetail = await getMr(codeupClient, id, mergeRequestId);

    // 输出映射略，见下方字段要求
  }));
```

实现要求：
- `mr` 仍是顶层命令，与 `repo` 平级，不要迁移命令注册位置
- `mr view` 必须注册在 `registerRepoCommands(...)` 内，保持与 `mr list` 共享 `codeupClient`、`withErrorHandling`、`jsonMode`
- 参数声明使用可选参数形式 `[repoId] [mrId]`，这样才能显式输出自定义 `repoId is required` / `mrId is required`，而不是让 Commander 直接中断
- 继续复用现有 `parsePositiveInt()` 和 `printError()`，不要引入新的参数校验工具

### 输出字段要求

人类可读模式建议至少输出：
- `ID`
- `Title`
- `State`
- `Source Branch`
- `Target Branch`
- `Author`
- `Assignee`
- `Web URL`
- `Created At`
- `Updated At`
- `Description`

`--json` 模式建议输出：

```json
{
  "id": 88,
  "title": "Fix release branch merge conflict",
  "description": "....",
  "state": "opened",
  "sourceBranch": "feature/fix-mr",
  "targetBranch": "master",
  "author": { "id": "u-1", "name": "alice" },
  "assignee": { "id": "u-2", "name": "bob" },
  "webUrl": "https://codeup.aliyuncs.com/...",
  "createdAt": "2026-04-18T00:00:00Z",
  "updatedAt": "2026-04-18T01:00:00Z"
}
```

字段映射原则：
- `id` 优先使用 `iid ?? id`，与 `mr list` 的展示和后续用户输入保持一致
- `author.name` 优先使用 `name`，回退到 `username`
- `assignee` 允许为空对象或空字符串占位，但 schema 要稳定
- `description`、`webUrl`、`updatedAt` 等缺省字段需安全回退，避免输出 `undefined`

### 与现有错误处理链的对齐

当前错误处理基线来自 `src/index.js`：
- `AppError` 直接按其 `code` 输出
- HTTP 401/403 → `AUTH_FAILED`
- HTTP 404 → `NOT_FOUND`
- 其他 HTTP 错误 → `API_ERROR`

因此 Story 10.5 的实现不要在命令层重复包装 404，也不要改动 `withErrorHandling` 全局逻辑。

---

## 架构与实现护栏

### 代码结构要求

- 仅在以下文件中实现 Story 10.5：
  - `src/codeup-api.js`
  - `src/commands/repo.js`
  - `test/codeup-api.test.js`
  - `test/repo.test.js`
- 不要修改 `src/index.js`，因为：
  - `createCodeupClient` 已注册
  - `registerRepoCommands` 已接入 CLI
  - `mr` 顶层命令已在现有命令树中

### 复用优先级

- 复用 `src/codeup-api.js` 中现有 Codeup client 与 `codeupCall`
- 复用 `src/commands/repo.js` 中现有 `parsePositiveInt()`、`VALID_MR_STATES`、表格/详情输出风格
- 复用 `test/repo.test.js` 的 `MockExit`、`setupCapture()`、`buildProgram()` 测试夹具
- 不要新建 `src/commands/mr.js` 或额外的格式化工具文件

### 命名与风格一致性

- API 层函数命名延续现有模式：`listRepos`、`getRepo`、`listMrs`、`getMr`
- JSON 字段命名统一使用 camelCase
- 命令描述文案保持英文，与现有 CLI 一致
- 终端输出标签可沿用 `repo view` 的详情布局风格

### 边界与非目标

- 本 Story 仅覆盖 MR 详情查看，不要提前实现：
  - `mr create`
  - MR 与工作项关联
  - reviewer 列表、commits、diff、comments 等扩展详情子资源
- 如果 API 返回字段中存在 reviewers、labels、pipeline 状态等丰富信息，可作为可选增强，但不能扩大为多接口聚合实现

---

## 前序故事情报

### 来自 Story 10.4 的可复用模式

`_bmad-output/implementation-artifacts/10-4-mr-list.md` 与当前代码已建立这些模式：
- `mr` 是顶层命令，不是 `repo` 子命令
- `repoId` 缺失时通过 `[repoId]` + 显式校验输出 `INVALID_ARGS`
- `mr list` 的 `id` 已使用 `iid ?? id`，Story 10.5 应延续这一输入输出约定
- `test/repo.test.js` 已包含完整 `mr list` 命令测试夹具，可直接追加新的 `describe("mr view command", ...)`

### 来自 Story 10.3 的详情页样式参考

`_bmad-output/implementation-artifacts/10-3-repo-view.md` 已验证：
- 详情查看命令采用 `[id]` 可选参数形式，便于输出自定义缺参错误
- human-readable 模式使用多行 label/value 布局
- `--json` 模式输出映射后的稳定对象，而非原始 API 响应

### 最近提交脉络

最近相关提交：
- `8940411 feat(codeup): add mr list command with tests`
- `03ca61c Merge pull request #78 from kongsiyu/story/10-4-mr-list`
- `cfe16bc chore(bmad): close out story 10-4 delivery`

这说明 Epic 10 当前已稳定进入 `mr` 命令扩展阶段，10.5 应保持增量追加，不做结构性重构。

---

## 测试要求

### 修改 `test/codeup-api.test.js`

为 `getMr` 增加单元测试，至少覆盖：
1. `getMr(client, 123, 88)` 调用 `GET /projects/123/merge_requests/88` 并返回 `r.data`
2. 401 响应 → `AUTH_FAILED`
3. 403 响应 → `AUTH_FAILED`
4. 404 响应原样抛出，由命令层/全局错误处理映射 `NOT_FOUND`

### 修改 `test/repo.test.js`

追加 `mr view command` 测试组，至少覆盖：
1. 正常 human-readable 输出包含 MR 标题、状态、分支、作者、URL
2. `--json` 输出字段映射正确
3. 缺少 `repoId` → `INVALID_ARGS` + `repoId is required`
4. 缺少 `mrId` → `INVALID_ARGS` + `mrId is required`
5. 非法 `repoId` → `INVALID_ARGS`
6. 非法 `mrId` → `INVALID_ARGS`
7. `codeupClient = null` → `AUTH_MISSING`
8. 404 响应通过 `withErrorHandling` 输出 `NOT_FOUND`

### 回归验证

至少执行：
- `npm test`

重点确认：
- 现有 `repo list` / `repo view` / `mr list` 测试不回归
- `--json` 模式下 stdout 只输出 JSON，stderr 处理错误

---

## 风险与注意事项

1. **`mrId` 标识符需与 API 行为对齐**  
当前 `mr list` 展示的是 `iid ?? id`。若 `mr view` API 仅接受全局 `id` 而不接受 `iid`，实现时需要以真实接口行为为准，并在测试中固定该约束；不要仅凭字段名猜测。

2. **缺参错误不能交给 Commander 默认处理**  
若写成 `<repoId> <mrId>`，Commander 会在进入 action 前中断，无法满足 AC3 的精确错误消息。

3. **不要重构命令拆分**  
虽然 `mr` 命令已增多，但本 Story 不应把 `src/commands/repo.js` 拆成多个文件，否则会扩大变更面并增加回归风险。

4. **description 可能很长**  
human-readable 模式下可直接原样输出或保守截断，但 `--json` 必须保留完整 description。

5. **404 映射来源于全局错误处理**  
如果在命令层手动捕获并改写错误，容易破坏现有 `NOT_FOUND` 行为一致性。

---

## 完成标准

- [x] `src/codeup-api.js` 已追加 `getMr(codeupClient, repoId, mrId)`
- [x] `src/commands/repo.js` 已追加 `mr view [repoId] [mrId]`
- [x] `test/codeup-api.test.js` 已追加 `getMr` 测试
- [x] `test/repo.test.js` 已追加 `mr view` 测试
- [x] `npm test` 通过
- [x] 代码审查通过
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` 在开发完成后更新为 `done`

---

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Completion Notes List

- Implemented `getMr()` using the existing Codeup client and `codeupCall()` error boundary.
- Added `yunxiao mr view [repoId] [mrId]` with custom missing-argument errors, strict positive-integer validation, human-readable detail output, and stable `--json` mapping.
- Added API and command tests covering success, JSON output, missing/invalid arguments, auth missing, auth failure mapping, 404 `NOT_FOUND`, and stable fallback fields.
- Ran BMAD code review locally; fixed the identified partial-numeric parsing issue by tightening the existing `parsePositiveInt()` helper.
- Verified `npm test` passes: 267 tests passed.
- Verified `npm run lint` passes.

### File List

- _bmad-output/implementation-artifacts/10-5-mr-view.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- src/codeup-api.js
- src/commands/repo.js
- test/codeup-api.test.js
- test/repo.test.js

### Change Log

- 2026-04-18: Story created and marked ready-for-dev with comprehensive developer guardrails.
- 2026-04-18: Implemented `mr view` API/CLI flow with tests, review fix, and sprint status closeout.
