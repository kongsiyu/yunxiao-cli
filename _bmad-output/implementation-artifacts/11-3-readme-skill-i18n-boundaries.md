# Story 11.3: README / SKILL 边界补充

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Delivery Scope

**Delivery Type**: documentation-only
**Scope Notes**: 本 Story 只更新 `README.md`、`SKILL.md` 与文档 guardrail 测试，明确 v1.2.0 中文化边界、稳定 machine contract 与已知限制；不修改 CLI 运行时代码或扩大中文化范围。

## Story

As an AI agent or human user,  
I want documentation to clearly state i18n behavior and limits,  
so that I know what is localized and what remains stable for automation.

## Acceptance Criteria

1. **Given** README 命令参考和 SKILL 使用指南  
   **When** 阅读 i18n 说明  
   **Then** 文档明确说明 high-frequency human-readable 输出支持中文，`--json` 字段名和 `ERROR_CODE` 不翻译

2. **Given** v1.2.0 中文化不是全 CLI 覆盖  
   **When** 阅读已知限制  
   **Then** 文档列出已覆盖命令和后置命令，不误导用户认为全 CLI 已完成

## Tasks / Subtasks

- [x] Task 1: 创建并校准文档型 story 工件，锁定 11.3 的输入边界 (AC: #1, #2)
  - [x] Subtask 1.1: 基于 `epics.md`、`prd.md`、Story 11.1 / 11.2 工件生成本 Story 文件
  - [x] Subtask 1.2: 在本 Story 中明确仅允许修改 `README.md`、`SKILL.md`、测试与 BMAD 工件，不扩大到 CLI 运行时代码

- [x] Task 2: 更新 README / SKILL 的 i18n 边界说明与 machine-contract 文案 (AC: #1, #2)
  - [x] Subtask 2.1: 在 `README.md` 中补充 v1.2.0 中文化边界、已覆盖命令、后置命令与 `--json` / `ERROR_CODE` 稳定性说明
  - [x] Subtask 2.2: 在 `SKILL.md` 中补充同等边界说明，确保 AI Agent 不把高频中文化误读为全 CLI 中文化
  - [x] Subtask 2.3: 修正文档中与当前实现不一致的 `--json` schema / 示例，至少覆盖 `project list`、`wi update`、`wi types`、`status list`

- [x] Task 3: 为文档声明增加 guardrail 测试并同步工件状态 (AC: #1, #2)
  - [x] Subtask 3.1: 新增 focused 文档测试，直接断言 README / SKILL 包含中文化边界与 machine-contract 声明
  - [x] Subtask 3.2: 运行 Story 要求的单元测试，至少覆盖新增/相关文档 guardrail
  - [x] Subtask 3.3: 完成 `Dev Agent Record`、`File List`、`Change Log`、`sprint-status.yaml` 同步

## Dev Notes

### 权威输入

- `_bmad-output/planning-artifacts/epics.md`：Story 11.3 的用户故事和 AC，要求文档写清中文化范围与稳定契约。
- `_bmad-output/planning-artifacts/prd.md`：v1.2.0 目标是“高频命令人类可读输出中文化 + AI workflow 契约稳定”，不是全 CLI 中文化。
- `_bmad-output/implementation-artifacts/11-1-i18n-audit-rollout-scope.md`：锁定了高频 rollout 清单、后置命令和 machine-contract guardrail。
- `_bmad-output/implementation-artifacts/11-2-high-frequency-i18n-rollout.md`：记录实际已交付的中文化范围与“README / SKILL 由 11.3 负责”的后续责任。
- `README.md` / `SKILL.md`：本 Story 的实际文档改动目标。
- `_bmad-output/implementation-artifacts/story-artifact-sync-rules.md`：完成 Story 前必须同步 story 文件字段和 `sprint-status.yaml`。

### 前序 Story Intelligence

- Story 11.1 已明确：v1.2.0 只锁定 `auth`、`whoami`、`project list`、`wi list/view/update`、`sprint list/view` 的 high-frequency human-readable 中文化。
- Story 11.1 / 11.2 已明确：`--json` 字段名、stdout 纯 JSON 约束、stderr 错误输出和 `ERROR_CODE` 枚举都不能翻译。
- Story 11.2 已交付命令输出中文化，但 README / SKILL 还未把“已覆盖命令”和“后置命令”写成显式边界，容易被误解为全 CLI 已中文化。

### 技术约束

- 这是纯文档 / 工件 Story，不修改 `src/` 运行时逻辑，除非发现 README / SKILL 与当前实现严重失配且必须通过测试体现。
- 文档必须以当前代码实现为准，尤其是 `project list`、`wi update`、`wi types`、`status list` 的 `--json` 返回 shape。
- 需要明确说明：`auth status`、`auth logout`、`whoami` 当前没有稳定 `--json` contract；11.2 只保证其 human-readable 输出在中文环境下可读。
- “后置命令”列表至少要覆盖 `project view`、`wi create/delete/comment/comments/types`、`user list/search`、`status list`、`pipeline*`、`repo*`、`mr*`。

### 测试要求

- 新增 focused 文档 guardrail 测试，直接读取 `README.md` 与 `SKILL.md` 断言以下内容持续存在：
  - 已覆盖命令列表
  - 后置命令列表
  - `--json` 字段名与 `ERROR_CODE` 不翻译
  - stdout 纯 JSON / stderr 错误分流
- 测试文件继续放在 `test/` 根目录并命名为 `*.test.js`，使用 Node 18 `node:test`。

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 11.3]
- [Source: _bmad-output/planning-artifacts/prd.md#Epic 11]
- [Source: _bmad-output/implementation-artifacts/11-1-i18n-audit-rollout-scope.md]
- [Source: _bmad-output/implementation-artifacts/11-2-high-frequency-i18n-rollout.md]
- [Source: _bmad-output/implementation-artifacts/story-artifact-sync-rules.md]
- [Source: README.md]
- [Source: SKILL.md]
- [Source: src/commands/project.js]
- [Source: src/commands/workitem.js]
- [Source: src/commands/sprint.js]
- [Source: src/commands/status.js]
- [Source: src/commands/query.js]
- [Source: src/commands/whoami.js]
- [Source: src/output.js]

## Artifact Sync Closeout

- [x] story 文件头 `Status` 与实际状态一致
- [x] Tasks/Subtasks 勾选与实际完成项一致
- [x] Dev Agent Record 记录实现、测试、审查和残余风险
- [x] File List 覆盖全部新增/修改/删除文件
- [x] `sprint-status.yaml` 中 story key 已同步

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-04-20: Story 11.3 在 worktree `story/11-3-readme-skill-boundary-clarifications` 中创建，基于 gating 分支 `story/11-2-high-frequency-output-zh-rollout` 作为执行基线。
- 2026-04-20: `README.md` 新增 v1.2.0 中文化边界与已知限制，明确只覆盖高频命令人类可读中文化，且只有文档显式给出 schema 的命令才承诺稳定 `--json` contract。
- 2026-04-20: `SKILL.md` 同步补充中文化边界，并修正 `project list`、`wi update`、`wi types`、`status list` 的 `--json` schema 以匹配当前实现。
- 2026-04-20: 新增 `test/i18n-docs-boundaries.test.js`，直接锁住 README / SKILL 中的高频命令范围、后置命令和 machine-contract 声明。
- 2026-04-20: `node --test test/i18n-docs-boundaries.test.js` 与 `npm test` 全量通过，315 个测试全部通过；期间通过 worktree 本地符号链接复用主克隆 `node_modules` 作为测试环境，不纳入提交。
- 2026-04-20: 本地代码审查完成；发现 README 对 `--json` contract 的表述过宽，已收敛为“仅文档显式给出 schema 的命令才承诺稳定 contract”，审查后无剩余 must-fix。

### Completion Notes List

- [x] README / SKILL 明确写出 v1.2.0 已覆盖命令：`auth`、`whoami`、`project list`、`wi list/view/update`、`sprint list/view`。
- [x] README / SKILL 明确写出后置命令：`project view`、`wi create/delete/comment/comments/types`、`user list/search`、`status list`、`pipeline*`、`repo*`、`mr*`。
- [x] 文档明确声明 `--json` 字段名、JSON schema、stdout 纯 JSON 约束和 `ERROR_CODE` 保持英文，不翻译。
- [x] 修正文档中过时 schema：`project list`、`wi update`、`wi types`、`status list` 与当前实现对齐。
- [x] Focused guardrail 测试与 full unit suite 均通过；本地代码审查 clean after one internal doc patch。

### File List

- `_bmad-output/implementation-artifacts/11-3-readme-skill-i18n-boundaries.md` - Story 11.3 实施规范文件。
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Story 11.3 状态同步到 `ready-for-dev` 与 `review`。
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Story 11.3 状态同步到 `ready-for-dev`、`review` 与 `done`。
- `README.md` - 增补 v1.2.0 中文化边界、machine-contract 稳定性和已知限制说明。
- `SKILL.md` - 增补 AI 使用边界并修正与实现不一致的 `--json` schema。
- `test/i18n-docs-boundaries.test.js` - 新增 README / SKILL 文档 guardrail 测试。

### Change Log

- 2026-04-20: 创建 Story 11.3，状态 `ready-for-dev`。
- 2026-04-20: 完成 README / SKILL 边界补充、文档 guardrail 测试、全量 `npm test` 与本地代码审查，Story 状态更新为 `review`。
- 2026-04-20: 创建 PR `#92` 后完成工件回写，Story 状态更新为 `done`。
