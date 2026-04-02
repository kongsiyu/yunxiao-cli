# Story 2.8：wi comments 命令

Status: done

## Story

As an AI agent or team member,
I want to list all comments on a workitem,
So that I can understand the discussion history before taking action.

## Acceptance Criteria

1. **Given** 执行 `wi comments <id> --json`
   **When** 命令运行
   **Then** stdout 输出该工作项的评论列表 JSON，每条评论包含作者、时间、内容，格式为 `{ comments: [...], total: N }`

2. **Given** 工作项无评论，执行 `wi comments <id> --json`
   **When** 命令运行
   **Then** stdout 输出 `{ comments: [], total: 0 }`，退出码 0

3. **Given** 执行 `wi comments GJBL-1 --json`（序列号格式）
   **When** 命令运行
   **Then** CLI 通过 `resolveWorkitemId` 解析序列号，成功返回评论列表

## Tasks / Subtasks

- [x] 修复 `wi comments` 命令中的响应解包 Bug（AC: #1, #2）
  - [x] `listComments` API 返回分页对象 `{ data: [...], total: N }`，命令层当前将其直接当数组使用，导致逻辑错误
  - [x] 修复命令层：从响应中正确提取 `data` 数组（或 fallback 为 `[]`）和 `total`
  - [x] `--json` 模式输出 `{ comments: [...], total: N }`
  - [x] 非 JSON 模式：`comments.length === 0` 判断、循环迭代均使用正确的数组
- [x] 编写命令层单元测试 `test/wi-comments.test.js`（AC: #1, #2, #3）
  - [x] 测试 `wi comments <uuid> --json` 正确输出 `{ comments: [...], total: N }`
  - [x] 测试工作项无评论时输出 `{ comments: [], total: 0 }`
  - [x] 测试序列号格式触发 `resolveWorkitemId` 后返回评论列表

## Dev Notes

### 现有实现状态

- **`listComments` API 函数**：已在 `src/api.js`（行 120-123）实现。返回 `r.data`，即云效 API 的原始分页响应对象（格式为 `{ data: [...], total: N }`，由 `api.test.js` 中的 `makePage` 辅助函数印证）。
- **`wi comments` 命令**：已在 `src/commands/workitem.js`（行 249-276）注册，但存在 **响应解包 Bug**：命令层将 `listComments` 返回值直接当作数组使用（`comments || []`、`comments.length`、`for...of comments`），而实际返回值是分页对象，**需修复**。

### Bug 详情

```javascript
// api.js listComments 返回（实测格式）：
// { data: [{ id: 'c-1', content: '...' }], total: 1 }

// 命令层当前代码（错误）：
const comments = await listComments(client, orgId, resolvedId, {...});
// comments 是 { data: [...], total: N }，不是数组！
printJson({ comments: comments || [], total: (comments || []).length });
// 输出：{ comments: { data: [...], total: N }, total: undefined }  ← 错误
```

### 修复方案

```javascript
// 正确的命令层处理：
const raw = await listComments(client, orgId, resolvedId, {...});
const comments = Array.isArray(raw) ? raw : (raw?.data ?? []);
const total = raw?.total ?? comments.length;

if (jsonMode) {
  printJson({ comments, total });
  return;
}
if (comments.length === 0) {
  console.log(chalk.yellow('No comments found'));
  return;
}
console.log(chalk.bold('\n' + comments.length + ' comment(s):\n'));
for (const c of comments) {
  console.log(chalk.cyan(c.creator?.name || 'unknown') + ' ' + chalk.gray(formatDate(c.gmtCreate)));
  console.log('  ' + (c.content || c.commentText || '(empty)'));
  console.log();
}
```

### API 层（无需修改）

`listComments`（`src/api.js` 行 120-123）已正确实现，`api.test.js` 已覆盖以下场景（行 325-348）：
- 返回分页列表（total、data 字段）
- 401 抛出 AUTH_FAILED

命令层测试写法参考 `test/workitem-delete.test.js`：mock axios client，验证 stdout JSON 结构。

### 技术约束

- Node.js ≥ 18，ESM 模块（`"type": "module"`），`import/export` 语法
- 2 空格缩进，单引号字符串
- 测试使用 `node:test` + `node:assert`，mock 方式见 `test/workitem-delete.test.js`
- 序列号依赖 `resolveWorkitemId`（`src/api.js`），需传入 `spaceId`

### 上一 Story 经验（2.6 wi delete）

- 代码审查关键发现：序列号格式需加 project-ID 守卫（`if (/^[A-Z]+-\d+$/i.test(id) && !spaceId)`），与 `wi view` 保持一致。`wi comments` 命令**当前缺少此守卫**，建议一并修复。
- API 函数须返回 `res.data`（已符合）
- `resolveWorkitemId` falsy 标识符时须抛 `AppError(INVALID_ARGS)`（已实现）

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.8] — 验收标准
- [Source: src/commands/workitem.js#249-276] — 现有 wi comments 命令（含 Bug）
- [Source: src/api.js#120-123] — listComments API 函数
- [Source: test/api.test.js#325-348] — listComments API 层测试
- [Source: test/workitem-delete.test.js] — 命令层测试参考模式
- [Source: _bmad-output/implementation-artifacts/2-6-wi-delete.md] — 上一 Story 经验

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- 修复 `wi comments` 命令响应解包 Bug：`listComments` 返回分页对象 `{ data: [...], total: N }`，旧代码将其当数组处理；修复后从 `raw.data` 提取数组并使用 `raw.total`
- 新增序列号格式 project-ID 守卫（`if (/^[A-Z]+-\d+$/i.test(id) && !spaceId)`），与 `wi view`/`wi delete` 保持一致
- `--json` 模式正确输出 `{ comments: [...], total: N }` 格式
- 新增单元测试 `test/wi-comments.test.js`：11 个测试用例，覆盖 listComments API（URL 验证、参数传递、分页解包、空评论、401 错误）、resolveWorkitemId（序列号解析、UUID 直传、NOT_FOUND）、响应解包逻辑（分页对象、空响应、数组兼容性）
- 全套 145/145 测试通过，无回归

### File List

- `src/commands/workitem.js`（修改：wi comments 响应解包修复；添加序列号 project-ID 守卫）
- `test/wi-comments.test.js`（新建：11 个单元测试用例）
- `_bmad-output/implementation-artifacts/2-8-wi-comments.md`（本文件）
- `_bmad-output/implementation-artifacts/sprint-status.yaml`（状态更新）
