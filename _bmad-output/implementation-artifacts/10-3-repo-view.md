# Story 10-3：repo view 命令

**Story ID**: 10.3
**Epic**: 10 - Codeup 集成
**Status**: done
**Created**: 2026-04-17
**Author**: Sue (PM Senior)

---

## 用户故事

As a developer,
I want to run `yunxiao repo view <repoId>` to see detailed information about a specific Codeup repository,
So that I can quickly inspect repo metadata without leaving the terminal.

---

## 验收标准

### AC1：基本详情输出
**Given** 用户已通过 `yunxiao auth login` 配置有效 PAT
**When** 执行 `yunxiao repo view 12345`
**Then** 以格式化文本输出仓库详情，包含：ID、名称、描述、可见性、Web URL、默认分支、创建时间

### AC2：--json 输出
**Given** 用户执行 `yunxiao repo view 12345 --json`
**When** 命令执行
**Then** 向 stdout 输出纯 JSON，包含仓库完整字段，不含 chalk 颜色

### AC3：repoId 缺失处理
**Given** 用户执行 `yunxiao repo view`（未提供 repoId）
**When** 命令执行
**Then** 输出 `INVALID_ARGS` 错误，提示 `repoId is required`，退出码 1

### AC4：repoId 非正整数处理
**Given** 用户执行 `yunxiao repo view abc`
**When** 命令执行
**Then** 输出 `INVALID_ARGS` 错误，提示 `repoId must be a positive integer`，退出码 1

### AC5：仓库不存在处理
**Given** 指定 repoId 对应的仓库不存在或无权访问
**When** 执行 `yunxiao repo view 99999`
**Then** 输出 `NOT_FOUND` 或 `AUTH_FAILED` 错误，退出码 1

### AC6：认证缺失处理
**Given** 未配置 PAT
**When** 执行 `yunxiao repo view 12345`
**Then** 输出 `AUTH_MISSING` 错误，提示 `Run: yunxiao auth login`，退出码 1

### AC7：API 错误处理
**Given** Codeup API 返回非 2xx 响应（非 401/403/404）
**When** 执行 `yunxiao repo view 12345`
**Then** 输出 `API_ERROR` 错误，退出码 1

---

## 技术需求

### 修改 `src/codeup-api.js`

在现有 `listRepos` 函数之后追加 `getRepo` 函数：

```js
export async function getRepo(codeupClient, repoId) {
  return codeupCall(() =>
    codeupClient.get(`/projects/${repoId}`).then((r) => r.data)
  );
}
```

注意：`codeupCall` 已处理 401/403 → `AUTH_FAILED`。404 由 axios 抛出，由 `withErrorHandling` 统一处理为 `API_ERROR`，或在 `codeupCall` 中扩展 404 → `NOT_FOUND`（见风险提示）。

### 修改 `src/commands/repo.js`

1. 在 import 行添加 `getRepo`：
```js
import { listRepos, getRepo } from '../codeup-api.js';
```

2. 在 `registerRepoCommands` 函数内，`repo list` 注册之后追加 `repo view` 子命令：

```js
repo
  .command('view <repoId>')
  .description('View details of a Codeup repository')
  .action(withErrorHandling(async (repoId) => {
    if (!codeupClient) {
      throw new AppError(ERROR_CODE.AUTH_MISSING, 'Authentication required. Run: yunxiao auth login');
    }

    const id = parseInt(repoId, 10);
    if (Number.isNaN(id) || id <= 0) {
      printError(ERROR_CODE.INVALID_ARGS, 'repoId must be a positive integer', jsonMode);
      process.exit(1);
    }

    const r = await getRepo(codeupClient, id);

    if (jsonMode) {
      printJson({
        id: r.id,
        name: r.name,
        description: r.description || '',
        visibility: r.visibility_level,
        webUrl: r.web_url,
        defaultBranch: r.default_branch || '',
        createdAt: r.created_at || '',
      });
      return;
    }

    console.log(chalk.bold(`\nRepository: ${r.name}\n`));
    console.log(`  ${chalk.gray('ID:')}             ${chalk.cyan(r.id)}`);
    console.log(`  ${chalk.gray('Name:')}           ${chalk.white(r.name)}`);
    console.log(`  ${chalk.gray('Description:')}    ${chalk.white(r.description || '-')}`);
    console.log(`  ${chalk.gray('Visibility:')}     ${chalk.magenta(r.visibility_level || '-')}`);
    console.log(`  ${chalk.gray('Default Branch:')} ${chalk.white(r.default_branch || '-')}`);
    console.log(`  ${chalk.gray('Web URL:')}        ${chalk.blue(r.web_url || '-')}`);
    console.log(`  ${chalk.gray('Created At:')}     ${chalk.white(r.created_at || '-')}`);
  }));
```

### 无需修改 `src/index.js`

`registerRepoCommands` 已在 Story 10.2 中注册，`repo view` 作为新子命令追加到同一 `repo` 命令组，无需额外注册。

---

## 实现路径

### 第一步：修改 `src/codeup-api.js`
- 追加 `getRepo(codeupClient, repoId)` — 调用 `GET /projects/{repoId}`
- 复用现有 `codeupCall()` 包装器（401/403 → `AUTH_FAILED`）
- 可选：在 `codeupCall` 中扩展 404 → `AppError(ERROR_CODE.NOT_FOUND, ...)`

### 第二步：修改 `src/commands/repo.js`
- import 中添加 `getRepo`
- 注册 `repo view <repoId>` 子命令
- 参数验证：`repoId` 必须为正整数
- 正常输出：格式化文本，含 ID、名称、描述、可见性、默认分支、URL、创建时间
- `--json` 输出：标准化字段对象

### 第三步：扩展测试 `test/codeup-api.test.js`
- 追加 `getRepo` 测试用例（成功、401、404）

### 第四步：扩展测试 `test/commands/repo.test.js`（或 `test/repo.test.js`）
- 追加 `repo view` 测试用例（正常输出、`--json`、无效 repoId、`codeupClient = null`）

---

## 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/codeup-api.js` | 修改 | 追加 `getRepo(codeupClient, repoId)` |
| `src/commands/repo.js` | 修改 | 追加 `repo view <repoId>` 子命令 |
| `test/codeup-api.test.js` | 修改 | 追加 `getRepo` 单元测试 |
| `test/repo.test.js` 或 `test/commands/repo.test.js` | 修改 | 追加 `repo view` 命令测试 |

---

## 前置条件与依赖

- **前置 Story**: 10-2-repo-list（已完成，PR #76 已合并）
- **依赖 Story**: 无
- **外部依赖**: Codeup API `GET /api/v3/projects/{id}`（已验证可行，来源 HTH-72）
- **认证**: 现有 PAT（`x-yunxiao-token`）兼容 Codeup API（已验证）

---

## 已知限制与注意事项

1. **repoId 类型**: 数字 ID（整数），CLI 参数为字符串，需 `parseInt` 转换并验证
2. **字段名**: Codeup API 返回字段基于 GitLab 兼容格式（`id`, `name`, `description`, `visibility_level`, `web_url`, `default_branch`, `created_at`）；若实际字段名不同，需在 `codeup-api.js` 中做映射
3. **404 处理**: 当前 `codeupCall` 仅处理 401/403；404 会以原始 axios 错误抛出，由 `withErrorHandling` 处理为通用 `API_ERROR`。若需要更友好的 `NOT_FOUND` 提示，可在 `codeupCall` 中扩展 404 分支（可选优化，不阻塞 AC）
4. **`--json` flag**: `jsonMode` 由 `registerRepoCommands` 的闭包传入，与 `repo list` 行为一致，无需额外处理

---

## 测试计划

### 单元测试（`test/codeup-api.test.js` 追加）

1. `getRepo(client, 123)` 成功调用 `GET /projects/123`，返回对象
2. 401 响应 → 抛出 `AppError(AUTH_FAILED)`
3. 403 响应 → 抛出 `AppError(AUTH_FAILED)`
4. 404 响应 → 抛出错误（原样或 `NOT_FOUND`，视实现而定）

### 命令测试（`test/repo.test.js` 追加）

1. 正常输出：包含仓库 ID、名称、URL
2. `--json` 输出：包含 `id`, `name`, `description`, `visibility`, `webUrl`, `defaultBranch`, `createdAt`
3. 无效 repoId（`abc`）：输出 `INVALID_ARGS` 错误
4. `codeupClient = null`：抛出 `AUTH_MISSING`

---

## 风险提示（Junior Developer 注意）

1. **只修改，不重写**：`src/codeup-api.js` 和 `src/commands/repo.js` 已有完整实现，只追加新函数/子命令，不要重构现有代码
2. **`repo view` 是子命令，不是独立命令**：必须注册在 `repo` 命令组下（`repo.command('view <repoId>')`），不要在 `program` 上直接注册
3. **`<repoId>` 是必填参数**：Commander.js 中 `<repoId>` 语法表示必填，缺失时框架会自动报错；但仍需在 action 中验证其为正整数
4. **字段名待确认**：`visibility_level` / `web_url` / `default_branch` 等字段名基于文档推断，首次运行时打印原始响应确认字段名（与 Story 10.2 一致的风险）
5. **测试文件位置**：Story 10.2 的测试文件为 `test/repo.test.js`（非 `test/commands/repo.test.js`），追加测试时注意路径

---

## 完成标准

- [x] `src/codeup-api.js` 已追加 `getRepo` 函数
- [x] `src/commands/repo.js` 已追加 `repo view <repoId>` 子命令
- [x] `test/codeup-api.test.js` 已追加 `getRepo` 测试，覆盖成功与 401/403 场景
- [x] `test/repo.test.js` 已追加 `repo view` 命令测试，覆盖正常输出、`--json`、无效参数、认证缺失
- [x] `npm test` 全部通过
- [x] 代码审查通过
- [x] `sprint-status.yaml` 更新为 `done`

### Review Findings

- [x] [Review][Patch] `repo view` 缺少 `repoId` 时未返回 `INVALID_ARGS` [src/commands/repo.js:71] — 已改为 `view [repoId]` 并在 action 中显式校验缺失参数输出 `repoId is required`，满足 AC3

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Completion Notes List

- Added `getRepo(codeupClient, repoId)` in `src/codeup-api.js`
- Added `repo view [repoId]` subcommand with explicit missing/invalid argument validation in `src/commands/repo.js`
- Added unit tests for `getRepo` and `repo view` behaviors
- Ran full test suite: `npm test` passed
- Executed code review, fixed one patch item (missing `repoId` handling)

### File List

- `src/codeup-api.js` (updated)
- `src/commands/repo.js` (updated)
- `test/codeup-api.test.js` (updated)
- `test/repo.test.js` (updated)
- `_bmad-output/implementation-artifacts/10-3-repo-view.md` (updated)

### Change Log

- 2026-04-17: Completed Story 10.3 `repo view` implementation, tests, and review fixes.
