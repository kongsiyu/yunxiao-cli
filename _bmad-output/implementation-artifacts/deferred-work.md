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
