# Story 10-2：repo list 命令

**Story ID**: 10.2
**Epic**: 10 - Codeup 集成
**Status**: done
**Created**: 2026-04-17
**Author**: Sue (PM Senior)

---

## 用户故事

As a developer,
I want to run `yunxiao repo list` to list my Codeup repositories,
So that I can quickly see all repos accessible with my PAT without leaving the terminal.

---

## 验收标准

### AC1：基本列表输出
**Given** 用户已通过 `yunxiao auth login` 配置有效 PAT
**When** 执行 `yunxiao repo list`
**Then** 以表格形式输出仓库列表，每行包含：仓库 ID、名称、描述（截断）、可见性

### AC2：分页参数
**Given** 用户执行 `yunxiao repo list --page 2 --limit 10`
**When** 命令执行
**Then** 调用 `GET /api/v3/projects?page=2&per_page=10`，返回对应分页结果

### AC3：--json 输出
**Given** 用户执行 `yunxiao repo list --json`
**When** 命令执行
**Then** 向 stdout 输出纯 JSON，格式为 `{ "repos": [...], "total": N }`，不含 chalk 颜色

### AC4：空结果处理
**Given** 账号下无可访问仓库
**When** 执行 `yunxiao repo list`
**Then** 输出 `No repositories found`（黄色），退出码 0

### AC5：认证缺失处理
**Given** 未配置 PAT
**When** 执行 `yunxiao repo list`
**Then** 输出 `AUTH_MISSING` 错误，提示 `Run: yunxiao auth login`，退出码 1

### AC6：API 错误处理
**Given** Codeup API 返回非 2xx 响应
**When** 执行 `yunxiao repo list`
**Then** 输出对应错误码（`AUTH_FAILED` / `API_ERROR`），退出码 1

---

## 技术需求

### 新增模块：`src/codeup-api.js`

创建独立的 Codeup API 客户端模块，与现有 `src/api.js`（Yunxiao openapi）完全隔离：

```js
// src/codeup-api.js
import axios from 'axios';
import { AppError, ERROR_CODE } from './errors.js';

const CODEUP_BASE = 'https://codeup.aliyuncs.com/api/v3';

export function createCodeupClient(pat) {
  return axios.create({
    baseURL: CODEUP_BASE,
    headers: {
      'x-yunxiao-token': pat,
      'Content-Type': 'application/json',
    },
  });
}

async function codeupCall(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err?.response?.status === 401 || err?.response?.status === 403) {
      throw new AppError(ERROR_CODE.AUTH_FAILED, 'Codeup authentication failed: invalid or missing PAT');
    }
    throw err;
  }
}

export async function listRepos(codeupClient, opts = {}) {
  const params = {};
  if (opts.page) params.page = opts.page;
  if (opts.perPage) params.per_page = opts.perPage;
  return codeupCall(() =>
    codeupClient.get('/projects', { params }).then(r => r.data)
  );
}
```

### 新增命令文件：`src/commands/repo.js`

```js
// src/commands/repo.js
import chalk from 'chalk';
import { listRepos } from '../codeup-api.js';
import { printJson, padEndVisual } from '../output.js';
import { AppError, ERROR_CODE } from '../errors.js';

export function registerRepoCommands(program, codeupClient, withErrorHandling, jsonMode) {
  const repo = program.command('repo').description('Manage Codeup repositories');

  repo
    .command('list')
    .description('List Codeup repositories')
    .option('--page <n>', 'Page number', '1')
    .option('--limit <n>', 'Per page (max 100)', '20')
    .action(withErrorHandling(async (opts) => {
      if (!codeupClient) {
        throw new AppError(ERROR_CODE.AUTH_MISSING, 'Authentication required. Run: yunxiao auth login');
      }
      const repos = await listRepos(codeupClient, {
        page: parseInt(opts.page),
        perPage: parseInt(opts.limit),
      });
      if (jsonMode) {
        const mapped = (repos || []).map(r => ({
          id: r.id,
          name: r.name,
          description: r.description || '',
          visibility: r.visibility_level,
          webUrl: r.web_url,
        }));
        printJson({ repos: mapped, total: mapped.length });
        return;
      }
      if (!repos || repos.length === 0) {
        console.log(chalk.yellow('No repositories found'));
        return;
      }
      console.log(chalk.bold(`\nFound ${repos.length} repo(s):\n`));
      for (const r of repos) {
        const desc = r.description ? r.description.slice(0, 40) : '-';
        console.log(
          `${chalk.cyan(String(r.id).padEnd(8))} ${chalk.white(padEndVisual(r.name, 35))} ${chalk.gray(desc)}`
        );
      }
    }));
}
```

### 修改 `src/index.js`

在现有 import 区块末尾添加：
```js
import { createCodeupClient } from './codeup-api.js';
import { registerRepoCommands } from './commands/repo.js';
```

在 `client` 初始化后添加：
```js
let codeupClient = null;
if (token) {
  codeupClient = createCodeupClient(token);
}
```

在 `registerQueryCommands(...)` 之后添加：
```js
registerRepoCommands(program, codeupClient, withErrorHandling, jsonMode);
```

---

## 实现路径

### 第一步：创建 `src/codeup-api.js`
- 定义 `CODEUP_BASE = 'https://codeup.aliyuncs.com/api/v3'`
- 导出 `createCodeupClient(pat)` 工厂函数
- 导出 `listRepos(codeupClient, opts)` — 调用 `GET /projects`
- 内部 `codeupCall()` 包装 401/403 → `AUTH_FAILED`

### 第二步：创建 `src/commands/repo.js`
- 导出 `registerRepoCommands(program, codeupClient, withErrorHandling, jsonMode)`
- 注册 `repo list` 子命令，支持 `--page` / `--limit`
- 表格输出：ID、名称、描述（截断 40 字符）
- `--json` 输出：`{ repos: [...], total: N }`

### 第三步：修改 `src/index.js`
- import `createCodeupClient` 和 `registerRepoCommands`
- 初始化 `codeupClient`（与 `client` 同一 token）
- 注册 `repo` 命令组

### 第四步：编写测试 `test/codeup-api.test.js`
- mock axios，验证 `listRepos` 调用路径和参数
- 验证 401 → `AUTH_FAILED` 转换
- 验证分页参数传递

### 第五步：编写测试 `test/commands/repo.test.js`
- mock `listRepos`，验证表格输出格式
- 验证 `--json` 输出结构
- 验证空结果输出
- 验证 `codeupClient = null` 时抛出 `AUTH_MISSING`

---

## 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/codeup-api.js` | 创建 | Codeup API 客户端模块（独立边界） |
| `src/commands/repo.js` | 创建 | repo 命令组，含 `repo list` |
| `src/index.js` | 修改 | import + 初始化 codeupClient + 注册 repo 命令 |
| `test/codeup-api.test.js` | 创建 | codeup-api 单元测试 |
| `test/commands/repo.test.js` | 创建 | repo 命令测试 |

---

## 前置条件与依赖

- **前置 Story**: 10-1-codeup-api-verification（已完成，PR #74 已合并）
- **依赖 Story**: 无
- **外部依赖**: Codeup API `https://codeup.aliyuncs.com/api/v3/projects`（已验证可行）
- **认证**: 现有 PAT（`x-yunxiao-token`）兼容 Codeup API（已验证）

---

## 已知限制与注意事项

1. **repoId 类型**: 数字 ID（整数），CLI 参数接收时无需特殊处理
2. **字段名**: Codeup API 返回字段基于 GitLab 兼容格式（`id`, `name`, `description`, `visibility_level`, `web_url`）；若实际字段名不同，需在 `codeup-api.js` 中做映射
3. **分页上限**: Codeup API `per_page` 最大值待确认，建议 CLI 默认 20，最大允许 100
4. **PAT 权限**: 若 PAT 无 Codeup 权限，返回 403；错误信息已覆盖

---

## 测试计划

### 单元测试（`test/codeup-api.test.js`）

1. `listRepos` 成功调用 `GET /projects`，返回数组
2. `listRepos` 传递 `page` / `per_page` 参数
3. 401 响应 → 抛出 `AppError(AUTH_FAILED)`
4. 403 响应 → 抛出 `AppError(AUTH_FAILED)`
5. 500 响应 → 原样抛出（由 `withErrorHandling` 处理）

### 命令测试（`test/commands/repo.test.js`）

1. 正常输出：包含仓库 ID、名称
2. `--json` 输出：`{ repos: [...], total: N }` 结构正确
3. 空结果：输出 `No repositories found`
4. `codeupClient = null`：抛出 `AUTH_MISSING`

---

## 风险提示（Junior Developer 注意）

1. **不要修改 `src/api.js`**：Codeup 客户端必须在独立的 `src/codeup-api.js` 中，不要混入现有 Yunxiao API 模块
2. **BASE URL 不同**：Yunxiao openapi 用 `https://openapi-rdc.aliyuncs.com`，Codeup 用 `https://codeup.aliyuncs.com/api/v3`
3. **字段名待确认**：`visibility_level` / `web_url` 等字段名基于文档推断，首次运行时打印原始响应确认字段名
4. **测试 mock 隔离**：测试中 mock `codeup-api.js` 的 `listRepos`，不要直接 mock axios

---

## 完成标准

- [x] `src/codeup-api.js` 实现完成，`listRepos` 可正常调用 Codeup API
- [x] `src/commands/repo.js` 实现完成，`repo list` 命令注册并可执行
- [x] `src/index.js` 已集成 codeupClient 初始化和 repo 命令注册
- [x] `test/codeup-api.test.js` 编写完成，覆盖率 ≥ 80%
- [x] `test/commands/repo.test.js` 编写完成
- [x] `npm test` 全部通过
- [x] 代码审查通过
- [x] `sprint-status.yaml` 更新为 `done`

### Review Findings

- [x] [Review][Patch] Non-JSON output missed visibility column [src/commands/repo.js] — fixed by adding visibility in table output.

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Completion Notes List

- Implemented isolated Codeup API client in `src/codeup-api.js`
- Added `repo list` command with pagination, JSON output, empty-state handling, and argument validation
- Integrated Codeup client and repo command registration in `src/index.js`
- Added unit tests for API layer and command layer
- Ran full test suite: `npm test` passed
- Performed code review and fixed one functional gap (visibility column in normal output)

### File List

- `src/codeup-api.js` (new)
- `src/commands/repo.js` (new)
- `src/index.js` (updated)
- `test/codeup-api.test.js` (new)
- `test/repo.test.js` (new)

### Change Log

- 2026-04-17: Implemented Story 10.2 `repo list` end-to-end, completed tests and code review.
