# Deferred Work

## Deferred from: code review of 8-3-readme-workflow-examples (2026-04-02)

- **F4**: 无 DOING Sprint 时工作流静默失败（`sprints[0].id` 为 undefined）— 示例性质文档可接受；未来可在 SKILL 文件中补充错误处理说明
- **F5**: `user search` 多结果歧义，未说明如何从多条结果中选择 userId — 超出本 story 范围，可在 8-4 SKILL 优化时处理
- **F6**: `sprint view` 超 100 条截断，统计数据可能不完整，README 未注明 — 现有行为，可在 8-1/8-2 命令参考完善时补充
- **F7**: `wi list` 默认 limit 20，大型 Sprint 不完整 — 现有行为，可在命令参考中说明 `--limit` 用法
- **F8**: `--json` 全局 flag 位置（global 前置 vs subcommand 后）未说明 — Low 优先级，可在 SKILL 文件中说明

## Deferred from: code review of 3-1-wi-types (2026-04-02)

- `t.id` 缺失时 typeId 为 undefined [src/commands/workitem.js] — pre-existing API 合约问题，无 id 字段的类型对象在 JSON 输出中 typeId 会为 undefined
- `t.name` null/undefined 无防护 [src/commands/workitem.js] — pre-existing，name 字段为空时表格/JSON 均无 fallback
- `total` 为本地计数非服务端总数 [src/commands/workitem.js] — 符合项目设计（与其他命令一致），如需分页支持则需另行实现

## Deferred from: code review of 7-4-command-layer-tests (2026-04-02)

- `buildWithErrorHandling` duplicates `src/index.js` logic; divergence risk if production changes. Fix: export from a shared module or find a way to import without triggering CLI init.
- `wi list` non-JSON mode command path (human-readable output) not tested — consider adding in a future test coverage story.
- `rawData?.total` branch (nested `{ data: [...], total: N }` format) not exercised — add test case when pagination spec is clarified.
- 401 HTTP response → `AUTH_FAILED` AppError path not tested through command layer.
- `err.message` being `undefined` (e.g., `throw {}`) case not covered in `buildWithErrorHandling` else branch.
- Both `errorMessage` and `statusText` being falsy/empty not tested — edge case produces `{"error":"","code":"API_ERROR"}`.
- AUTH_MISSING tested via direct `AppError` throw, not through `buildProgram`+`parseAsync` dispatch. Real guard is in `src/index.js` `authRequiredAction`.
- `workitem.js` has internal `process.exit` calls (INVALID_ARGS guard) that would throw `MockExit` and surface as spurious `API_ERROR` through `withErrorHandling` else branch.

## Deferred from: code review of 2-7-wi-comment (2026-04-02)

- `process.exit(1)` 在 `withErrorHandling` 内绕过 wrapper — 同文件其他命令使用相同模式，建议统一重构为抛出错误让 wrapper 处理
- `result?.id ?? resolvedId` 兜底时 `id` 与 `workitemId` 相同 — spec 允许工作项 ID 作为兜底，但机器调用方无法区分，后续可考虑增加 `idType` 字段
- `resolveWorkitemId` 仅搜索前 50 条记录 — 大型项目中序列号超出首页时会误报 NOT_FOUND，建议后续增加分页循环
- `content` 参数无空字符串/空白校验 — 非 AC 要求，API 可能拒绝空评论，后续可加 guard
- `wi comment` 命令无自动化测试覆盖 — 命令层测试在 Story 7-4 统一覆盖

## Deferred from: code review of 1-6-whoami-always-register (2026-04-02)

- **currentUserId 移除 eager init 后不再自动填充，影响 wi create 默认 assignee**：Story 1.6 明确任务要求移除 eager initCurrentUser()，副作用是 wi create 无 --assigned-to 时不能自动填充当前用户。应在 Story 2.4/后续迭代中通过 wi create 内懒加载解决。
- **orgId 为 null 时报 AUTH_MISSING 但实为配置缺失**：错误信息 "Authentication required. Run: yunxiao auth login" 对 orgId 缺失场景有误导，应区分 AUTH_MISSING（无 token）和 CONFIG_MISSING（有 token 无 orgId）。Pre-existing 问题，不在本 Story 范围。
- **update/comment/comments/delete 在 resolveWorkitemId 前无 spaceId 检查**：序列号格式 ID 在无 projectId 时会产生不友好的 API 错误而非 INVALID_ARGS。Pre-existing，应在对应 Story 中修复。
- **client/orgId 注册时按值传入，同进程 re-auth 后不会刷新**：架构约束，Commander.js 命令注册后 handler 闭包捕获的是注册时的参数快照。若未来支持同进程 auth 切换需重构。Pre-existing 设计决策。

## Deferred from: code review of 2-5-wi-update (2026-04-02)

- **getWorkitem 失败后误报错误**：`updateWorkitem` 成功但后续 `getWorkitem` 瞬态失败时，用户收到 API_ERROR 尽管更新已完成。可考虑在 JSON 模式 getWorkitem 调用外加 try/catch 并降级输出 `{ id, success: true }`。
- **console.log 使用原始 id 而非 resolvedId**：非 JSON 路径 `"Work item " + id + " updated!"` 用序列号显示，多命令均有此问题，建议统一修复。
- **TOCTOU race in getWorkitem**：更新后 GET 获取的数据可能非当前用户所为，在 CLI 低并发场景可接受，高并发场景需重新评估。
- **defaultProjectId undefined 时序列号解析失败**：所有使用 resolveWorkitemId 的命令均有此问题，建议在 resolveWorkitemId 或上层统一校验。

## Deferred from: code review of 2-8-wi-comments (2026-04-02)

- **text 模式显示页内条数而非服务端 total**：非 JSON 模式打印 `comments.length + " comment(s)"` 为当前页条数，服务端 total 仅在 JSON 模式输出。与 wi list 等命令一致，pre-existing 设计。
- **`parseInt` 无 radix**：`parseInt(opts.page)` / `parseInt(opts.limit)` 未传第二参数，codebase 全局相同写法。
- **`parseInt` 接受非数字传 NaN**：非数字参数时 API 层 falsy fallback（`opts.page || 1`）会静默回退至第 1 页，无用户错误提示；pre-existing 全局模式。
- **serial-number 守卫仅检查 falsy spaceId**：空字符串 env var 会被认为无 spaceId；与 wi view/wi delete 行为一致，属配置错误场景。
- **测试复制了生产层解包逻辑**：`listComments 响应解包` describe 直接复现生产代码表达式而非端到端测试命令路径，属测试设计取舍。
- **`process.exit(1)` 无 stdout flush**：同步退出可能截断缓冲输出；codebase 全局相同写法。
- **AC2 exit-code-0 未显式测试**：空评论时的退出码未断言；`withErrorHandling` 保证正常路径 exit 0，pre-existing 测试惯例。

## Deferred from: code review of 8-1-readme-install-config (2026-04-02)

- `auth status` 和 `whoami` 命令区别未在 README 中说明（Story 8-2 命令参考章节可补充）
- 非交互式 `auth login` 跳过 PAT 有效性验证（代码行为缺陷，需单独 Story 修复）
- 传入部分 auth 标志（仅 `--token` 不带 `--org-id`）触发混合交互流程，行为未记录（代码行为，需 Story 处理）
