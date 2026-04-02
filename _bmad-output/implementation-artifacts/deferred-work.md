# Deferred Work

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
