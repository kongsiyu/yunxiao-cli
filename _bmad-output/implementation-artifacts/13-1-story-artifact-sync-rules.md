# Story 13.1: Story 工件状态同步规则与 foundation-only 标记

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a scrum master,  
I want explicit story artifact synchronization rules and a foundation-only marker,  
so that sprint status, story files, and retrospective evidence stay consistent.

## Delivery Scope

**Delivery Type**: documentation-only  
**User-visible Rollout Follow-up**: N/A - no user-visible CLI rollout required  
**Scope Notes**: 本 Story 交付 BMAD 工件治理规则、模板/工作流 guardrail 与测试，不改变 CLI 用户命令行为。

## Acceptance Criteria

1. **Given** story 准备进入 `done`  
   **When** 执行关闭检查  
   **Then** story 文件头 `Status`、Task/Subtask 勾选、Dev Agent Record、File List 和 `sprint-status.yaml` 必须同步

2. **Given** story 只完成基础设施但未完成用户可见 rollout  
   **When** 标记完成状态  
   **Then** story 必须显式标记 `foundation-only`，并列出 user-visible rollout 后续 story

3. **Given** story 文件与 `sprint-status.yaml` 冲突  
   **When** 复盘或规划读取工件  
   **Then** 冲突处理规则明确：以 release evidence / merged PR / final review 为最终裁决源，并必须回写 story 文件

4. **Given** 规则落地  
   **When** SM 创建后续 story  
   **Then** story 模板或 handoff notes 包含状态同步检查项

## Tasks / Subtasks

- [x] Task 1: 建立 canonical Story 工件同步规则 (AC: #1, #3)
  - [x] Subtask 1.1: 新增项目内规则文档，定义 `done` 前同步检查项
  - [x] Subtask 1.2: 明确 story 文件、`sprint-status.yaml` 冲突时的裁决源优先级
  - [x] Subtask 1.3: 规定冲突裁决后必须回写 story 文件和 sprint 状态

- [x] Task 2: 增加 foundation-only 与 rollout 指向规则 (AC: #2)
  - [x] Subtask 2.1: 定义 `Delivery Scope` / `foundation-only` 标记格式
  - [x] Subtask 2.2: 要求列出 user-visible rollout 后续 story 或明确说明不适用
  - [x] Subtask 2.3: 解释 `foundation-only` 与 `done`、`review` 状态的关系，避免误判完整交付

- [x] Task 3: 将规则接入后续 story 创建与 handoff notes (AC: #4)
  - [x] Subtask 3.1: 更新 active create-story 模板，固定包含 Delivery Scope 与关闭同步检查项
  - [x] Subtask 3.2: 更新单仓库 story 开发工作流，明确步骤 9/PR 后的状态同步门禁
  - [x] Subtask 3.3: 在 Story 13.1 自身 File List / Dev Agent Record 中示范完整回写

- [x] Task 4: 添加可执行 guardrail 测试 (AC: #1, #2, #3, #4)
  - [x] Subtask 4.1: 增加测试验证规则文档包含同步字段、foundation-only、后续 rollout 和冲突裁决源
  - [x] Subtask 4.2: 增加测试验证 create-story 模板包含 Delivery Scope 和关闭检查项
  - [x] Subtask 4.3: 增加测试验证工作流包含最终 done 同步要求

## Artifact Sync Closeout

- [x] story 文件头 `Status` 与实际状态一致
- [x] Tasks/Subtasks 勾选与实际完成项一致
- [x] Dev Agent Record 记录实现、测试、审查和残余风险
- [x] File List 覆盖全部新增/修改/删除文件
- [x] `sprint-status.yaml` 中 story key 已同步
- [x] 若 Delivery Type 为 Foundation-only，已填写 User-visible Rollout Follow-up；本 Story 为 documentation-only，后续 rollout 不适用

## Dev Notes

### 权威输入

- `_bmad-output/planning-artifacts/epics.md`：Epic 13 / Story 13.1 定义、FR43、FR45 映射。
- `_bmad-output/planning-artifacts/prd.md`：v1.2.0 范围明确要求 Story 工件卫生治理；直接修改 BMAD agent instructions 后置，v1.2.0 只在项目工件中固化执行规则和模板。
- `_bmad-output/implementation-artifacts/v1-1-0-retro-2026-04-19.md`：记录 Story 工件状态漂移、i18n foundation-only 误判，以及 `done` 前必须同步 story 状态、任务勾选、`sprint-status.yaml`。
- `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-19.md`：规定 13.1 是首批 create-story 候选，原因是防止 v1.2.0 后续 story 重复发生状态漂移。

### 实现边界

- 本 Story 是 BMAD 工件治理，不应扩展 CLI 用户功能，也不应修改 `src/` 命令行为。
- 允许修改项目内 BMAD 工件、模板、工作流说明和测试。
- 不直接修改外部 agent instructions；按 PRD 约束，只在本仓库项目工件中固化规则。
- 规则必须能被后续 SM/Developer 在创建 story、关闭 story、复盘冲突时直接引用。

### 技术约束

- Story 文件头 `Status`、Tasks/Subtasks 勾选、Dev Agent Record、File List、Change Log、`sprint-status.yaml` 是同一交付状态的不同投影，进入 `done` 前必须一致。
- `foundation-only` 表示基础设施已完成但用户可见 rollout 未完成；这可以是某个 story 的合法交付结果，但必须显式标记并链接后续 user-visible rollout story。
- 冲突裁决源优先级：release evidence > merged PR > final review > local story/sprint marker；裁决后必须回写低置信源。

### Project Structure Notes

- Canonical 规则文档建议放在 `_bmad-output/implementation-artifacts/`，因为该目录已承载 story 执行工件和 sprint 状态。
- Active create-story 模板在 `.agents/skills/bmad-create-story/template.md`，该路径已纳入版本控制。
- 单仓库 story 执行入口在 `workflow/story-dev-workflow-single-repo.md`。
- Guardrail 测试放在 `test/` 并通过现有 `npm test` 执行。

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-04-19: Story 13.1 由 BMAD Developer 在 worktree `story/13-1-story-artifact-sync-rules` 中创建。
- 2026-04-19: Story 状态进入 `in-progress`；`sprint-status.yaml` 同步为 `in-progress`。
- 2026-04-19: `node --test test/bmad-artifact-sync.test.js` red phase 失败，确认规则文档、模板和 workflow guardrail 尚未落地。
- 2026-04-19: 实现 canonical sync rules、create-story 模板 guardrail、单仓库 workflow closeout guardrail；focused guardrail test 通过。
- 2026-04-19: `npm test` 通过，298 个测试全部通过。
- 2026-04-19: Story 状态更新为 `review`；`sprint-status.yaml` 同步为 `review`。
- 2026-04-19: BMAD code review 本地执行，结论 clean review；Story 状态更新为 `done`，`sprint-status.yaml` 同步为 `done`。

### Completion Notes List

- [x] 新增 `_bmad-output/implementation-artifacts/story-artifact-sync-rules.md`，明确 `done` 前同步字段、`foundation-only` 标记、user-visible rollout 后续 story 和冲突裁决/回写规则。
- [x] 更新 `.agents/skills/bmad-create-story/template.md`，让后续 story 默认包含 `Delivery Scope` 与 `Artifact Sync Closeout`。
- [x] 更新 `workflow/story-dev-workflow-single-repo.md`，在实现和 sprint closeout 步骤加入状态同步、foundation-only 和冲突裁决回写要求。
- [x] 新增 `test/bmad-artifact-sync.test.js`，用 `node:test` 守住规则文档、模板和 workflow 关键 marker。
- [x] Focused guardrail test 已通过：`node --test test/bmad-artifact-sync.test.js`。
- [x] Full unit suite 已通过：`npm test`，298 个测试全部通过。
- [x] 代码审查完成：未发现必须修复项，AC1-AC4 与 guardrail test 对齐。

### File List

- `.agents/skills/bmad-create-story/template.md` - 增加 Delivery Scope 和 Artifact Sync Closeout 模板段落。
- `_bmad-output/implementation-artifacts/13-1-story-artifact-sync-rules.md` - Story 13.1 工件与执行记录。
- `_bmad-output/implementation-artifacts/story-artifact-sync-rules.md` - 新增 canonical Story 工件同步规则。
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - 更新 Epic 13 / Story 13.1 执行状态。
- `_bmad-output/implementation-artifacts/v1-1-0-retro-2026-04-19.md` - v1.2.0 权威输入，随本 story 分支纳入。
- `_bmad-output/planning-artifacts/epics.md` - v1.2.0 Epic/Story 权威输入，随本 story 分支纳入。
- `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-19.md` - v1.2.0 readiness 权威输入，随本 story 分支纳入。
- `_bmad-output/planning-artifacts/prd.md` - v1.2.0 PRD 权威输入，随本 story 分支纳入。
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-04-19.md` - v1.2.0 correct-course proposal，随本 story 分支纳入。
- `_bmad-output/planning-artifacts/v1-2-0-planning-options-2026-04-19.md` - v1.2.0 planning options，随本 story 分支纳入。
- `test/bmad-artifact-sync.test.js` - 新增 BMAD 工件同步 guardrail 测试。
- `workflow/story-dev-workflow-single-repo.md` - 增加 Story 工件同步和冲突回写门禁。

### Change Log

- 2026-04-19: 创建 Story 13.1，状态 `ready-for-dev`。
- 2026-04-19: 开始实现，状态更新为 `in-progress`。
- 2026-04-19: 完成 Story 工件同步规则、模板/workflow guardrail 和测试实现。
- 2026-04-19: 单元测试通过，Story 进入 `review`。
- 2026-04-19: 代码审查通过，Story 进入 `done`。
