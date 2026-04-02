# Deferred Work

## Deferred from: code review of 7-4-command-layer-tests (2026-04-02)

- `buildWithErrorHandling` duplicates `src/index.js` logic; divergence risk if production changes. Fix: export from a shared module or find a way to import without triggering CLI init.
- `wi list` non-JSON mode command path (human-readable output) not tested — consider adding in a future test coverage story.
- `rawData?.total` branch (nested `{ data: [...], total: N }` format) not exercised — add test case when pagination spec is clarified.
- 401 HTTP response → `AUTH_FAILED` AppError path not tested through command layer.
- `err.message` being `undefined` (e.g., `throw {}`) case not covered in `buildWithErrorHandling` else branch.
- Both `errorMessage` and `statusText` being falsy/empty not tested — edge case produces `{"error":"","code":"API_ERROR"}`.
- AUTH_MISSING tested via direct `AppError` throw, not through `buildProgram`+`parseAsync` dispatch. Real guard is in `src/index.js` `authRequiredAction`.
- `workitem.js` has internal `process.exit` calls (INVALID_ARGS guard) that would throw `MockExit` and surface as spurious `API_ERROR` through `withErrorHandling` else branch.
