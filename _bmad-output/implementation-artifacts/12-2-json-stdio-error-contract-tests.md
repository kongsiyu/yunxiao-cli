# Story 12.2: JSON/stdout/stderr/error-code 契约回归测试补强

Status: ready-for-dev

## Story

As an AI workflow maintainer,
I want regression tests for machine-readable CLI contracts,
so that i18n and release changes cannot silently break agent parsing.

## Acceptance Criteria

1. **Given** `--json` 模式命令成功, **when** 运行命令层测试, **then** stdout 是合法 JSON, stderr 不包含 human-readable 数据污染, JSON 字段名保持英文.
2. **Given** `--json` 模式命令失败, **when** 运行命令层测试, **then** stdout 无输出, stderr 是 `{"error":"...","code":"ERROR_CODE"}`, code 属于现有 `ERROR_CODE` 枚举.
3. **Given** i18n 启用中文, **when** 运行覆盖命令测试, **then** 翻译只影响 human-readable message, 不改变 JSON schema 或错误码.

## Tasks / Subtasks

- [ ] Task 1: 盘点并锁定机器契约测试覆盖范围 (AC: #1, #2, #3)
  - [ ] Subtask 1.1: 复用 Story 12.1 的真实子进程 smoke runner 架构, 不新增第三方测试依赖.
  - [ ] Subtask 1.2: 覆盖高频 JSON 成功路径: `project list --json`, `wi list --json`, `sprint list --json`, 并优先使用 Story 12.1 已有 live/manual profile.
  - [ ] Subtask 1.3: 覆盖无需真实 PAT 的失败路径: `project list --json`, `wi list --json`, `sprint list --json`, 至少验证 `AUTH_MISSING`.
  - [ ] Subtask 1.4: 覆盖中文 i18n 配置或 locale 下的 JSON 路径, 验证 schema keys/code 仍为英文稳定值.

- [ ] Task 2: 增强 smoke matrix 契约断言 (AC: #1, #2, #3)
  - [ ] Subtask 2.1: 抽出通用 JSON stdout validator, 检查 stdout 可 `JSON.parse`, stderr 无非空 human-readable 污染, 必需字段存在且为英文 key.
  - [ ] Subtask 2.2: 抽出通用 JSON stderr error validator, 检查 stdout 为空, stderr 可 `JSON.parse`, shape 精确包含 `error`/`code`, `code` 属于 `Object.values(ERROR_CODE)`.
  - [ ] Subtask 2.3: 为 live JSON case 添加稳定 schema key 白名单断言, 避免中文翻译或字段重命名进入机器输出.
  - [ ] Subtask 2.4: 为中文语言环境下的 JSON 失败路径添加断言, 允许 `error` message 翻译, 禁止 `code` 或 JSON field name 翻译.

- [ ] Task 3: 增加自动化回归测试 (AC: #1, #2, #3)
  - [ ] Subtask 3.1: 扩展 `test/smoke.test.js` 或新增同类测试文件, 直接测试 matrix validators 和 runner behavior.
  - [ ] Subtask 3.2: 使用隔离临时 `HOME` / `.yunxiao/config.json` 写入 `language: "zh"`, 验证中文配置不改变 JSON stdout/stderr contract.
  - [ ] Subtask 3.3: 保持无真实 PAT 的 `npm run smoke` 可通过; live cases 缺少 env 时只在 `smoke:live` 前置检查失败, 不影响 CI.
  - [ ] Subtask 3.4: 确认 `npm test` 覆盖新增 contract tests.

- [ ] Task 4: 更新交付记录 (AC: #1, #2, #3)
  - [ ] Subtask 4.1: 在本 Story 的 Dev Agent Record 中记录新增/修改文件和验证结果.
  - [ ] Subtask 4.2: 若修改 smoke runner README 说明, 仅补充 contract 判定标准, 不扩大命令范围.
  - [ ] Subtask 4.3: 完成后将 sprint status 中本 story 更新为 `done`.

## Dev Notes

### Source Requirements

- Epic 12 目标是把真实 CLI smoke、stdout/stderr/JSON/error-code/version metadata 合同和 release gate 模板化, 降低 AI workflow 回归风险. [Source: `_bmad-output/planning-artifacts/epics.md` Story 12.2]
- PRD 将 Story 12.2 明确列为 v1.2.0 AI workflow 契约加固的一部分. [Source: `_bmad-output/planning-artifacts/prd.md` Epic 12]
- Readiness report 要求每个执行 issue 先运行 create-story, 然后按生成 story 文件开发. [Source: `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-19.md`]

### Previous Story Intelligence

- Story 12.1 已新增 `scripts/smoke/matrix.js`, `scripts/smoke/runner.js`, `test/smoke.test.js`, `npm run smoke`, `npm run smoke:live`.
- Story 12.1 的 runner 已通过真实 `node src/index.js ...` 子进程执行, 每个 case 使用独立临时 `HOME`, 并写入 version-check cache 避免 advisory stderr 干扰 JSON 断言.
- Story 12.1 已知 live JSON cases: `project list --json`, `wi list --json`, `sprint list --json`. 本 story 应增强其 contract validator, 而不是另起一套 runner.
- Story 12.1 的 review 修复点是 `runSmokeMode(..., { env })` 必须完整传入子进程; 本 story 新增 tests 时必须覆盖自定义 env/config 传递, 避免回归.

### Architecture / Contract Guardrails

- Existing output contract lives in `src/output.js`: `printJson(data)` writes JSON to stdout; `printError(code, message, jsonMode)` writes JSON error to stderr only when `jsonMode` is true.
- Existing error enum lives in `src/errors.js` as `ERROR_CODE`; contract tests must import this enum rather than hard-code an independent allowed-code list.
- `src/index.js` computes `jsonMode` from `process.argv.includes("--json")`, initializes i18n from config, and routes errors through `withErrorHandling`.
- i18n foundation from Story 9.6 intentionally keeps JSON field names English; only human-readable text may be translated. Do not translate object keys such as `projects`, `items`, `sprints`, `total`, `error`, or `code`.
- `auth login` Chinese prompt is human-readable stdout and is already smoke-covered; do not use it as evidence for JSON contract.

### Implementation Boundaries

- Preferred files to touch:
  - `scripts/smoke/matrix.js`
  - `scripts/smoke/runner.js`
  - `test/smoke.test.js` or a new `test/*contract*.test.js`
  - `_bmad-output/implementation-artifacts/12-2-json-stdio-error-contract-tests.md`
  - `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Do not introduce new runtime dependencies.
- Do not rewrite command implementations unless the new tests expose a real contract violation. If a violation is found, fix the narrowest CLI output path needed to satisfy this story.
- Do not require real Yunxiao credentials for `npm test` or `npm run smoke`; live/manual coverage remains gated by `YUNXIAO_SMOKE_PAT`, `YUNXIAO_SMOKE_ORG_ID`, and `YUNXIAO_SMOKE_PROJECT_ID`.

### Testing Requirements

- Required commands:
  - `npm test`
  - `npm run smoke`
- If live env vars are present, also run `npm run smoke:live`; if absent, record that live smoke was not run due to missing env.
- Tests must prove both stream separation and parseability:
  - Success JSON: stdout parseable, stderr empty, expected English schema keys present.
  - Failure JSON: stdout empty, stderr parseable, exactly stable `code` from `ERROR_CODE`.
  - Chinese mode: schema keys and `code` unchanged; only human-readable `error` message may vary.

### Project Structure Notes

- This repository is a Node.js ESM CLI using `node:test` (`package.json` script: `node --test test/*.test.js`).
- Existing tests use mutable mock clients and Node's built-in `mock.method`; smoke tests use real child processes.
- No standalone architecture document exists in the current planning artifacts; follow `src/index.js`, `src/output.js`, `src/errors.js`, existing tests, and Story 12.1 smoke runner patterns.

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- 2026-04-20: Story created by BMAD Developer in worktree after merging v1.2.0 planning baseline with Story 12.1 smoke runner branch.

### Completion Notes List

- Pending implementation.

### File List

- `_bmad-output/implementation-artifacts/12-2-json-stdio-error-contract-tests.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
