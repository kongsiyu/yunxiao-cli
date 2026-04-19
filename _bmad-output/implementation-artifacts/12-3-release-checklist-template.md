# Story 12.3: Release checklist 模板化

**Story ID**: 12.3  
**Epic**: 12 - v1.2.0 AI workflow 契约加固与 release gate  
**Status**: done  
**Created**: 2026-04-19  
**Author**: Sue  

---

## 用户故事

As a release owner,  
I want a reusable release checklist template,  
So that version metadata, package contents, smoke evidence, publishing, and release notes are checked before handoff.

---

## 验收标准

### AC1: Release checklist 覆盖发布前门禁
**Given** 准备 v1.2.0 发布  
**When** 使用 checklist  
**Then** checklist 至少包含 runtime version、`package.json` version、git tag、`npm test`、关键 CLI smoke、`npm pack --dry-run`、publish workflow、release note、commit/tag 可追溯性

### AC2: 版本元数据不一致必须阻断发布
**Given** release 前发现版本元数据不一致  
**When** checklist 执行  
**Then** 标记为 release blocker，不进入发布流水线

### AC3: 模板可复用
**Given** release checklist 模板落地  
**When** 后续版本复用  
**Then** 不依赖人工记忆补版本元数据或 release note

---

## Tasks / Subtasks

- [x] 创建可复用 release checklist 模板 (AC: #1, #2, #3)
  - [x] 新增 `docs/release-checklist-template.md`
  - [x] 覆盖 runtime version、`package.json` version、git tag、`npm test`、关键 CLI smoke、`npm pack --dry-run`、publish workflow、release note、commit/tag 可追溯性
  - [x] 在模板中把 runtime/package/tag 版本不一致明确列为 `Release blocker`
  - [x] 设计为后续版本可直接复制使用，包含 release version、target date、owner、evidence、blocker log、GO/NO-GO 占位
- [x] 让模板可发现并纳入发布流程 (AC: #3)
  - [x] 在 `CONTRIBUTING.md` 发布流程中引用 `docs/release-checklist-template.md`
  - [x] 明确推送 tag 前必须完成 checklist，存在 release blocker 时不得触发 `publish.yml`
- [x] 添加单元测试保护 checklist 内容 (AC: #1, #2, #3)
  - [x] 新增 `test/release-checklist-template.test.js`
  - [x] 测试 required gate item 全部存在
  - [x] 测试版本元数据 mismatch 的 release blocker 文案存在
  - [x] 测试 checklist 有可复用占位和 GO/NO-GO 判定区
- [x] 运行验证 (AC: #1, #2, #3)
  - [x] 运行 `npm test`
  - [x] 确认无临时 pack/tarball 文件残留
- [x] 更新 BMAD 工件状态 (AC: #3)
  - [x] 更新本 story 的 Dev Agent Record、File List、Status
  - [x] 更新 `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

## Dev Notes

### 权威输入

- `_bmad-output/planning-artifacts/epics.md` Story 12.3 定义 FR42。
- `_bmad-output/planning-artifacts/prd.md` v1.2.0 Correct Course Scope 要求 release checklist 模板化，并把 release gate 纳入 P5。
- `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-19.md` 将 12.3 列为首批 create-story 候选，且要求先 create-story 再实现。

### 当前发布基线

- `package.json` 当前版本为 `1.1.0`，CLI runtime version 来自 `src/index.js` 的 `.version(getPackageVersion() || "0.0.0")`。
- `test/version-check.test.js` 已覆盖 `cli --version matches package.json version`，可作为 runtime/package 版本一致性证据。
- `.github/workflows/test.yml` 在 PR/push 到 `master` 时运行 `npm run lint` 和 `npm test`，Node.js matrix 为 18.x / 20.x / 22.x。
- `.github/workflows/publish.yml` 在 `v*` tag push 后运行 `npm publish --access public`，使用 `NPM_TOKEN`。
- `CONTRIBUTING.md` 已有发布流程，但缺少统一 checklist 模板和 release blocker 判定。

### 实现要求

- 本 story 是文档/流程模板加测试保护，不修改 CLI runtime 行为。
- 模板建议落在 `docs/release-checklist-template.md`，因为这是发布流程文档，不需要进入 npm package `files` 白名单。
- 模板必须显式写明：runtime version、`package.json` version、git tag 三者不一致时，记录为 `Release blocker`，结论必须为 `NO-GO`，不得推送 tag 或触发 publish workflow。
- 关键 CLI smoke 至少列出无需认证 smoke：`node src/index.js --version`、`node src/index.js --help`、`node src/index.js auth status`；可为需真实 PAT 的 `project list --json`、`wi list --json`、`sprint list --json` 提供 evidence/manual-live 占位。
- `npm pack --dry-run` 需要作为 checklist 步骤，不要在实现中提交 tarball。
- 测试应只读取文档内容并断言关键门禁存在，避免网络、npm registry 或真实 PAT 依赖。

### Project Structure Notes

- `docs/` 已存在并用于项目文档。
- `test/*.test.js` 由 `package.json` 的 `npm test` 自动发现。
- 项目使用 ESM，测试使用 `node:test` 和 `node:assert/strict`。

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 12.3]
- [Source: _bmad-output/planning-artifacts/prd.md#v1.2.0 Correct Course Scope]
- [Source: _bmad-output/planning-artifacts/implementation-readiness-report-2026-04-19.md#Recommended Next Steps]
- [Source: .github/workflows/test.yml]
- [Source: .github/workflows/publish.yml]
- [Source: test/version-check.test.js]

---

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex

### Debug Log References

### Completion Notes List

- Story created by BMAD create-story workflow with v1.2.0 planning baseline loaded into the worktree.
- Started dev-story implementation; sprint status moved to `in-progress`.
- Added `docs/release-checklist-template.md` with reusable release metadata, required gate evidence, version mismatch release-blocker handling, smoke matrix, pack dry-run, publish workflow, release note, blocker log, and GO/NO-GO sections.
- Added `test/release-checklist-template.test.js`; red phase failed on missing template, then focused test and full `npm test` passed after implementation.
- Updated `CONTRIBUTING.md` so release owners must complete the checklist before tag/publish and must stop on open release blockers; added focused test coverage for that release-flow reference.
- `npm test` passed after contributing integration: 299 tests, 0 failures.
- Final validation `npm test` passed: 299 tests, 0 failures.
- Checked for generated `.tgz`, `.npmrc`, and npm debug residue; none found.
- Completion gates passed: no unchecked tasks/subtasks, `npm run lint` passed, final `npm test` passed with 299 tests and 0 failures.
- Story moved to `review`; sprint status moved to `review`.
- Code review completed cleanly: 0 decision-needed, 0 patch, 0 defer, 0 dismissed. Story and sprint status moved to `done`.

### File List

- `_bmad-output/implementation-artifacts/12-3-release-checklist-template.md`
- `docs/release-checklist-template.md`
- `test/release-checklist-template.test.js`
- `CONTRIBUTING.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-04-19: Created comprehensive Story 12.3 implementation guide and set status to `ready-for-dev`.
- 2026-04-19: Started implementation and set status to `in-progress`.
- 2026-04-19: Implemented release checklist template, contributing integration, unit coverage, and moved story to `review`.
- 2026-04-19: Code review passed cleanly and moved story to `done`.
