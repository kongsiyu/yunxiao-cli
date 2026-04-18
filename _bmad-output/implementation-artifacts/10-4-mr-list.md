# Story 10-4：mr list 命令

**Story ID**: 10.4
**Epic**: 10 - Codeup 集成
**Status**: ready-for-dev
**Created**: 2026-04-17
**Author**: Sue (PM Senior)

---

## 用户故事

As a developer,
I want to run `yunxiao mr list <repoId>` to list merge requests for a Codeup repository,
So that I can quickly review open/merged/closed MRs without leaving the terminal.

---

## 验收标准

### AC1：基本列表输出
**Given** 用户已通过 `yunxiao auth login` 配置有效 PAT
**When** 执行 `yunxiao mr list 12345`
**Then** 以表格形式输出 MR 列表，每行包含：MR ID、标题（截断）、状态、源分支、目标分支、作者

### AC2：--state 过滤
**Given** 用户执行 `yunxiao mr list 12345 --state opened`
**When** 命令执行
**Then** 调用 API 时传递 `state=opened`，仅返回 opened 状态的 MR

**Given** 用户执行 `yunxiao mr list 12345 --state merged`
**When** 命令执行
**Then** 调用 API 时传递 `state=merged`，仅返回 merged 状态的 MR

**Given** 用户执行 `yunxiao mr list 12345 --state closed`
**When** 命令执行
**Then** 调用 API 时传递 `state=closed`，仅返回 closed 状态的 MR

**Given** 用户未指定 `--state`
**When** 命令执行
**Then** 不传递 state 参数，返回所有状态的 MR（API 默认行为）

### AC3：分页参数
**Given** 用户执行 `yunxiao mr list 12345 --page 2 --limit 10`
**When** 命令执行
**Then** 调用 `GET /api/v3/projects/12345/merge_requests?page=2&per_page=10`，返回对应分页结果

### AC4：--json 输出
**Given** 用户执行 `yunxiao mr list 12345 --json`
**When** 命令执行
**Then** 向 stdout 输出纯 JSON，格式为 `{ "mrs": [...], "total": N }`，不含 chalk 颜色

每个 MR 对象包含字段：`id`、`title`、`state`、`sourceBranch`、`targetBranch`、`author`（含 `id`、`name`）、`createdAt`

### AC5：空结果处理
**Given** 仓库下无符合条件的 MR
**When** 执行 `yunxiao mr list 12345`
**Then** 输出 `No merge requests found`（黄色），退出码 0

### AC6：repoId 缺失处理
**Given** 用户执行 `yunxiao mr list`（未提供 repoId）
**When** 命令执行
**Then** 输出 `INVALID_ARGS` 错误，提示 `repoId is required`，退出码 1

### AC7：repoId 非正整数处理
**Given** 用户执行 `yunxiao mr list abc`
**When** 命令执行
**Then** 输出 `INVALID_ARGS` 错误，提示 `repoId must be a positive integer`，退出码 1

### AC8：--state 无效值处理
**Given** 用户执行 `yunxiao mr list 12345 --state invalid`
**When** 命令执行
**Then** 输出 `INVALID_ARGS` 错误，提示 `state must be one of: opened, merged, closed`，退出码 1

### AC9：认证缺失处理
**Given** 未配置 PAT
**When** 执行 `yunxiao mr list 12345`
**Then** 输出 `AUTH_MISSING` 错误，提示 `Run: yunxiao auth login`，退出码 1

### AC10：API 错误处理
**Given** Codeup API 返回非 2xx 响应（非 401/403）
**When** 执行 `yunxiao mr list 12345`
**Then** 输出 `API_ERROR` 错误，退出码 1

---

## 技术需求

### API 端点（来源：`_bmad-output/research/codeup-api-verification.md` Q6）

```
GET /api/v3/projects/{id}/merge_requests
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | integer | 是 | 仓库 ID（路径参数） |
| page | integer | 否 | 页码，默认 1 |
| per_page | integer | 否 | 每页数量，默认 20，最大 100 |
| state | string | 否 | 过滤状态：`opened`、`merged`、`closed` |

### 修改 `src/codeup-api.js`

在现有 `getRepo` 函数之后追加 `listMrs` 函数：

```js
export async function listMrs(codeupClient, repoId, opts = {}) {
  const params = {};
  if (opts.page !== undefined) params.page = opts.page;
  if (opts.perPage !== undefined) params.per_page = opts.perPage;
  if (opts.state !== undefined) params.state = opts.state;
  return codeupCall(() =>
    codeupClient.get(`/projects/${repoId}/merge_requests`, { params }).then((r) => r.data)
  );
}
```

### 修改 `src/commands/repo.js`

1. 在 import 行添加 `listMrs`：
```js
import { listRepos, getRepo, listMrs } from '../codeup-api.js';
```

2. 在 `registerRepoCommands` 函数末尾，`repo.command("view")` 之后，添加 `mr list` 子命令：

```js
const mr = program.command("mr").description("Manage Codeup merge requests");

mr
  .command("list [repoId]")
  .description("List merge requests for a Codeup repository")
  .option("--state <state>", "Filter by state: opened, merged, closed")
  .option("--page <n>", "Page number", "1")
  .option("--limit <n>", "Per page (max 100)", "20")
  .action(withErrorHandling(async (repoId, opts) => {
    if (!codeupClient) {
      throw new AppError(ERROR_CODE.AUTH_MISSING, "Authentication required. Run: yunxiao auth login");
    }
    if (!repoId) {
      printError(ERROR_CODE.INVALID_ARGS, "repoId is required", jsonMode);
      process.exit(1);
    }

    const id = parsePositiveInt(repoId, "repoId", jsonMode);
    const page = parsePositiveInt(opts.page, "page", jsonMode);
    const limit = parsePositiveInt(opts.limit, "limit", jsonMode);
    if (limit > 100) {
      printError(ERROR_CODE.INVALID_ARGS, "limit must be <= 100", jsonMode);
      process.exit(1);
    }

    const VALID_STATES = ["opened", "merged", "closed"];
    if (opts.state && !VALID_STATES.includes(opts.state)) {
      printError(ERROR_CODE.INVALID_ARGS, "state must be one of: opened, merged, closed", jsonMode);
      process.exit(1);
    }

    const mrsRaw = await listMrs(codeupClient, id, {
      page,
      perPage: limit,
      state: opts.state,
    });
    const mrs = Array.isArray(mrsRaw) ? mrsRaw : (mrsRaw?.data ?? []);

    const mapped = mrs.map((mr) => ({
      id: mr.iid ?? mr.id,
      title: mr.title || "",
      state: mr.state || "",
      sourceBranch: mr.source_branch || "",
      targetBranch: mr.target_branch || "",
      author: {
        id: mr.author?.id,
        name: mr.author?.name || mr.author?.username || "",
      },
      createdAt: mr.created_at || "",
    }));

    if (jsonMode) {
      printJson({ mrs: mapped, total: mapped.length });
      return;
    }

    if (mapped.length === 0) {
      console.log(chalk.yellow("No merge requests found"));
      return;
    }

    console.log(chalk.bold(`\nFound ${mapped.length} merge request(s):\n`));
    for (const item of mapped) {
      const title = item.title.slice(0, 45);
      const state = item.state.padEnd(8);
      console.log(
        `${chalk.cyan(String(item.id).padEnd(6))} ${chalk.white(padEndVisual(title, 46))} ${chalk.magenta(state)} ${chalk.gray(item.sourceBranch)} → ${chalk.gray(item.targetBranch)}`
      );
    }
  }));
```

### 注意事项

- `mr` 命令注册在 `program` 顶层（与 `repo` 平级），不是 `repo` 的子命令
- `parsePositiveInt` 和 `padEndVisual` 已在 `repo.js` 中定义，可直接复用
- `withErrorHandling` 和 `jsonMode` 通过 `registerRepoCommands` 参数传入，`mr` 命令注册需要同样的参数；建议将函数签名改为 `registerCodeupCommands` 或在 `index.js` 中单独调用 `registerMrCommands`
- MR 的 `id` 字段：优先使用 `iid`（项目内序号，更易读），回退到 `id`（全局 ID）

### 命令注册方式选择

**推荐方案**：将 `registerRepoCommands` 重命名为 `registerCodeupCommands`，在同一函数内同时注册 `repo` 和 `mr` 顶层命令，保持 `codeupClient`、`withErrorHandling`、`jsonMode` 参数共享。

在 `src/index.js` 中相应更新调用：
```js
// 原来
registerRepoCommands(program, codeupClient, withErrorHandling, jsonMode);
// 改为
registerCodeupCommands(program, codeupClient, withErrorHandling, jsonMode);
```

---

## 测试要求

在 `test/` 目录下为 `mr list` 命令添加单元测试，覆盖：

1. 正常列表输出（human-readable 模式）
2. `--json` 输出格式验证（含 `mrs` 数组和 `total` 字段）
3. 空结果输出 `No merge requests found`
4. `--state` 过滤参数传递验证
5. `repoId` 缺失 → `INVALID_ARGS` 错误
6. `repoId` 非正整数 → `INVALID_ARGS` 错误
7. `--state` 无效值 → `INVALID_ARGS` 错误
8. 认证缺失 → `AUTH_MISSING` 错误

测试模式参考 `test/commands/repo.test.js`（如已存在）或现有命令测试文件。

---

## 依赖与前置条件

- Story 10.1（Codeup API 验证）：已完成 ✓
- Story 10.2（repo list）：已完成 ✓
- Story 10.3（repo view）：已完成 ✓
- `src/codeup-api.js` 中 `createCodeupClient`、`codeupCall` 已实现 ✓
- `src/commands/repo.js` 中 `parsePositiveInt`、`mapRepo` 等工具函数已实现 ✓

---

## 风险与注意事项

1. **`iid` vs `id`**：Codeup MR 可能同时有 `iid`（项目内序号）和 `id`（全局 ID）。优先展示 `iid`，因为它更短、更易读，且与 Story 10.5 `mr view <mrId>` 的参数一致。
2. **`mr` 命令注册位置**：`mr` 是顶层命令（与 `repo`、`wi` 平级），不是 `repo` 的子命令。注册时需确保在 `program` 上调用 `.command("mr")`。
3. **API 响应格式**：基于文档推断，实际字段名（如 `source_branch` vs `sourceBranch`）以真实 API 响应为准，开发时需验证。
4. **分页 total**：Codeup API 可能通过响应 Header（`x-total`）返回总数，而非响应体。`--json` 输出的 `total` 字段暂用当前页返回数量，如 API 提供 Header 则优先使用。

---

## 输出示例

### Human-readable 模式

```
Found 3 merge request(s):

42     feat: add user authentication endpoint       opened   feature/auth → main
41     fix: resolve null pointer in sprint view     merged   fix/sprint-null → main
38     chore: update dependencies                   closed   chore/deps → main
```

### --json 模式

```json
{
  "mrs": [
    {
      "id": 42,
      "title": "feat: add user authentication endpoint",
      "state": "opened",
      "sourceBranch": "feature/auth",
      "targetBranch": "main",
      "author": { "id": 101, "name": "Alice" },
      "createdAt": "2026-04-15T10:23:00Z"
    }
  ],
  "total": 1
}
```
