# Story 12-1：真实 CLI smoke matrix 与执行入口

**Story ID**: 12.1
**Epic**: 12 - v1.2.0 AI workflow 契约加固与 release gate
**Status**: done
**Created**: 2026-04-19
**Author**: Sue (PM Senior)

---

## 用户故事

As a release reviewer,
I want a real CLI smoke matrix and runnable entrypoint,
So that version metadata, stdout/stderr behavior, and common command paths are verified outside unit-test mocks.

---

## 验收标准

### AC1：smoke matrix 覆盖范围
**Given** v1.2.0 高频命令范围
**When** 定义 smoke matrix
**Then** matrix 至少包含 `yunxiao --version`、`yunxiao --help`、`auth status`、`project list --json`、`wi list --json`、`sprint list --json`、一个失败路径和一个中文 human-readable 路径

### AC2：无真实 PAT 的自动 smoke
**Given** 无真实 PAT 的 CI 环境
**When** 运行 smoke
**Then** 可执行无需认证的 smoke
**And** 需真实环境的项目标记为 live/manual，不导致 CI 假失败

### AC3：真实环境 live smoke
**Given** 有真实 PAT / org / project 环境
**When** 运行 live smoke
**Then** 验证 stdout 纯 JSON、提示写 stderr、错误码稳定、runtime version 与 `package.json` 对齐

### AC4：交付文档
**Given** smoke 入口完成
**When** 准备交付
**Then** 文档化执行命令、环境变量、预期输出和失败判定

---

## Tasks / Subtasks

- [x] Task 1: 定义 smoke matrix 与执行分层 (AC: AC1, AC2, AC3)
  - [x] Subtask 1.1: 固化至少 8 个 smoke case，覆盖版本、帮助、认证状态、JSON 命令、失败路径与中文 human-readable 路径
  - [x] Subtask 1.2: 为每个 case 标注 `ci` 或 `live/manual` 执行层级，确保无真实 PAT 时只跑无需认证项
  - [x] Subtask 1.3: 对齐 Epic 11.1 当前已知高频命令范围，若缺少 11.1 工件则以 `epics.md` / `prd.md` 中锁定范围为准

- [x] Task 2: 实现真实 CLI smoke 执行入口 (AC: AC1, AC2, AC3)
  - [x] Subtask 2.1: 新增基于真实子进程的 smoke runner，直接执行 `node src/index.js ...`
  - [x] Subtask 2.2: 使用隔离的临时 `HOME` / `.yunxiao/config.json`，避免污染当前用户配置
  - [x] Subtask 2.3: 支持 `ci` 与 `live` 两种模式，并在 `package.json` 中暴露可执行入口
  - [x] Subtask 2.4: 为成功 JSON case 验证 stdout 纯 JSON、stderr 仅允许提示类输出；为失败 case 验证错误码与退出码

- [x] Task 3: 为 smoke runner 增加自动化测试 (AC: AC2, AC3)
  - [x] Subtask 3.1: 测试 matrix 定义包含必需 case 且 live case 被正确标记
  - [x] Subtask 3.2: 测试 `ci` 模式在无认证环境下可通过，并将 live case 记为 skip
  - [x] Subtask 3.3: 测试 live 模式前置检查，缺少必需环境变量时给出明确失败原因

- [x] Task 4: 文档化 smoke 命令、环境变量与判定标准 (AC: AC4)
  - [x] Subtask 4.1: 在 README 中补充 `npm run smoke` / `npm run smoke:live` 的使用方式
  - [x] Subtask 4.2: 文档化 `YUNXIAO_SMOKE_PAT`、`YUNXIAO_SMOKE_ORG_ID`、`YUNXIAO_SMOKE_PROJECT_ID` 等变量
  - [x] Subtask 4.3: 文档化每类 case 的预期输出与失败判定

- [x] Task 5: 完成验证与交付记录 (AC: AC1, AC2, AC3, AC4)
  - [x] Subtask 5.1: 运行 `npm test`
  - [x] Subtask 5.2: 运行 `npm run smoke`
  - [x] Subtask 5.3: 若具备真实环境则运行 `npm run smoke:live`；若当前会话不具备，则在文档与 Completion Notes 中明确说明

---

## 架构与实现护栏

### 代码结构要求

优先在以下范围内实现：
- `scripts/smoke/`
- `package.json`
- `README.md`
- `test/`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

不要为了本 Story 改写现有命令实现逻辑，除非 smoke runner 发现确定的契约缺口必须修复。

### 已知项目约束

- 当前仓库没有独立 architecture 文档或 project-context 文档；实现约束以 `README.md`、`src/index.js`、`src/output.js`、`src/errors.js`、`src/config.js`、现有测试模式为准。
- 当前 `package.json` 版本为 `1.1.0`，`src/index.js` 的 `program.version(getPackageVersion() || "0.0.0")` 已把运行时版本绑定到 `package.json`。
- `--json` 成功输出走 stdout，`printError()` 在 JSON 模式下把错误 JSON 写入 stderr。
- 版本检查可能在成功命令的 stderr 输出升级提示；smoke runner 应允许这种 advisory stderr，但不能让其污染 stdout JSON。

### 与 Epic 11.1 的对齐约束

- `epics.md` 当前锁定的高频命令范围是：`auth`、`whoami`、`project list`、`wi list/view/update`、`sprint list/view`。
- 本 Story 至少覆盖 issue 指定的 `auth status`、`project list --json`、`wi list --json`、`sprint list --json`。
- 当前分支内没有现成的 `11-1-i18n-audit-rollout-scope.md` 工件，因此中文 human-readable 路径以当前代码已存在且稳定的中文交互路径为准，不等待 11.2 完成。

### 复用优先级

- 复用 `node:child_process` 的真实子进程执行，而不是再次 mock 命令层。
- 复用 `src/config.js` 的配置文件格式：`token`、`orgId`、`projectId`、`language`。
- 复用现有 `node:test` 测试框架，不引入额外测试依赖。

### 测试与交付要求

- `npm test` 必跑。
- `npm run smoke` 必跑。
- live smoke 仅在显式提供真实环境变量时执行；CI 默认不得因 live case 缺少认证而失败。

---

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- 2026-04-19: Story 12.1 由 BMAD Developer 在 worktree 中创建
- 2026-04-19: 基于 diff review 修正 smoke runner 的环境注入路径，确保 `runSmokeMode(..., { env })` 对子进程同样生效

### Completion Notes List

- 新增 `scripts/smoke/matrix.js` 与 `scripts/smoke/runner.js`，以真实 `node src/index.js ...` 子进程执行 smoke，而非命令层 mock。
- 新增 `npm run smoke` 与 `npm run smoke:live` 入口；CI 模式会跳过 live/manual case，避免无 PAT 时误报失败。
- 每个 smoke case 使用独立临时 `HOME`，并预写 `.yunxiao/version-check-cache.json`，避免版本检查输出干扰 JSON 断言，也不污染本机 `~/.yunxiao/config.json`。
- 覆盖了 Story 要求的版本、帮助、`auth status`、失败路径、中文 human-readable 路径，以及 live 模式下的 `project list --json`、`wi list --json`、`sprint list --json`。
- 代码审查阶段发现并修正了 smoke runner 使用自定义 `env` 时未完整传入子进程的问题。
- 验证已完成：`npm test`、`npm run lint`、`npm run smoke`、`npm run smoke:live` 全部通过。

### File List

- _bmad-output/implementation-artifacts/12-1-real-cli-smoke-matrix.md (new)
- _bmad-output/implementation-artifacts/sprint-status.yaml (updated: added Epic 12 tracking, story state done)
- package.json (updated: added smoke scripts)
- README.md (updated: added smoke usage, env vars, and pass/fail expectations)
- scripts/smoke/matrix.js (new)
- scripts/smoke/runner.js (new)
- test/smoke.test.js (new)

### Change Log

- 2026-04-19: 初始化 Story 12.1 工件
- 2026-04-19: 完成真实 CLI smoke matrix、runner、测试与 README 文档
