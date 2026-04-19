# Story 13.3: v1.2.0 handoff index 与执行追踪工件

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Delivery Scope

**Delivery Type**: documentation-only
**User-visible Rollout Follow-up**: N/A
**Scope Notes**: 本 Story 交付 v1.2.0 的 handoff index 与结构化 execution tracker，帮助 Scrum Master 基于当前 issue/PR/gating 事实继续派单与发布前验收；不新增或修改 CLI 用户命令行为。

## Story

As a scrum master,
I want a handoff index that lists execution order, owners, review gates, and deferred scope,
so that SM can assign work without reinterpreting the Correct Course proposal.

## Acceptance Criteria

1. **Given** Correct Course proposal 已批准
   **When** 创建 handoff index
   **Then** index 列出 P0-P5 阶段、story 执行顺序、handoff recipients、依赖、评审验收波次、发布前门禁和 v1.3.0/post-MVP 后置项

2. **Given** SM 开始派单
   **When** 查看 handoff index
   **Then** 能识别首批 create-story 候选：11.1、12.1、12.3、13.1、13.2

## Tasks / Subtasks

- [x] Task 1: 创建可直接派单的 v1.2.0 handoff index (AC: #1, #2)
  - [x] Subtask 1.1: 固化 P0-P5 阶段、story 执行顺序、handoff recipients、依赖、评审验收波次和发布前门禁
  - [x] Subtask 1.2: 把首批 create-story 候选与后续波次顺序写成无需重新解释 Correct Course proposal 的派单索引
  - [x] Subtask 1.3: 明确 v1.3.0 / post-MVP deferred scope，避免后续派单把后置范围误当成 v1.2.0 必做项

- [x] Task 2: 产出结构化 execution tracker，记录当前 issue / PR / gating 事实 (AC: #1, #2)
  - [x] Subtask 2.1: 汇总 HTH-201 子 issue 与当前派发状态，区分 `issue_status`、依赖状态和“实际可继续执行”的派单解释
  - [x] Subtask 2.2: 为首批与后续波次记录 PR 链接、`pr_state`、`merged`、`merge_status` 和 `ci_status`，避免把 `PR open` 误写成已合并
  - [x] Subtask 2.3: 为 `11.3`、`12.4` 等 gated story 标注 blocker 解析和下一位 handoff recipient

- [x] Task 3: 为 handoff index / tracker 添加 guardrail 测试 (AC: #1, #2)
  - [x] Subtask 3.1: 验证 handoff index 包含 P0-P5、首批候选、后续顺序、评审验收波次、release gate 和 deferred scope
  - [x] Subtask 3.2: 验证 execution tracker 同时记录 issue、PR、CI、merge 状态与 dispatch interpretation
  - [x] Subtask 3.3: 验证 open PR 明确标记 `merged: false`，且 `11.3` / `12.4` 的 gating 解释被固化

- [x] Task 4: 完成 Story 工件同步关闭 (AC: #1, #2)
  - [x] Subtask 4.1: 更新本 Story 的 Status、Tasks/Subtasks、Dev Agent Record、File List、Change Log
  - [x] Subtask 4.2: 更新 `_bmad-output/implementation-artifacts/sprint-status.yaml` 中 Story 13.3 状态，并在 Epic 13 全部完成后关闭 epic
  - [x] Subtask 4.3: 记录 focused test、全量单元测试、代码审查结果和残余风险

## Dev Notes

### 权威输入

- `_bmad-output/planning-artifacts/epics.md`：Story 13.3 / FR45 的规范源，要求 handoff index 列出 P0-P5、执行顺序、handoff recipients、review gates 和 deferred scope。
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-04-19.md`：给出首批候选和后续顺序的 canonical recommendation。
- `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-19.md`：给出 P0-P5 phase order、依赖链和 13.3 在后续波次中的位置。
- `_bmad-output/planning-artifacts/prd.md`：给出 phase definitions、release gate、v1.2.0 out-of-scope / 后置项和 Vision (Future)。
- `_bmad-output/implementation-artifacts/sprint-status.yaml`：Story key 与 Epic 13 当前 repo 内状态的权威工件。
- `_bmad-output/implementation-artifacts/story-artifact-sync-rules.md`：规定 `done` 前必须同步 Status、Tasks/Subtasks、Dev Agent Record、File List 和 sprint-status。
- `[HTH-201]` 当前执行波次及其子 issue：用于抓取已派发/已完成/gated 的实时 issue 状态。
- GitHub PR 快照：`#83`、`#84`、`#85`、`#86`、`#88`、`#89`、`#90`，用于记录 `pr_state`、`merged`、`merge_status` 与 `ci_status`。

### 当前执行事实与解释规则

- 本 Story 的输出不能只复述 planning 文档，必须叠加当前 Paperclip issue / GitHub PR 事实。
- `issue_status`、`pr_state`、`merged`、`merge_status`、`ci_status` 是不同维度：
  - `issue_status: done` 只表示实现 issue 已完成，不代表 PR 已合并。
  - `pr_state: OPEN` 且 `merged: false` 必须显式保留，防止把“issue 已 done”误写成“已 merge”。
  - `ci_status: no_checks_reported` 不是失败，但也不是“checks passed”；必须和 `all_checks_passed` 区分。
- 对 `HTH-212` 这类状态漂移，需要记录“issue 仍是 blocked，但显式 blocker 已 done”的解释，帮助 SM 做 resume/refresh，而不是继续误判为硬阻塞。
- 当前 worktree 基线来自 `origin/story/13-2-codeup-evidence-ledger`，并不自然包含所有并行分支的 story 文件状态；因此 handoff tracker 需要显式记录“分支外执行事实”，而不是篡改其他 story 文档来伪造当前基线。

### 产物位置与结构

- handoff index：`_bmad-output/implementation-artifacts/v1-2-0-handoff-index.md`
- execution tracker：`_bmad-output/implementation-artifacts/v1-2-0-execution-tracker.yaml`
- guardrail 测试：`test/v1-2-0-handoff-index.test.js`
- 本 Story 保持 documentation-only，不应修改 `src/`、CLI 命令、发布脚本或外部 BMAD agent instructions。

### 前序 Story Intelligence

- Story 13.1 已建立 `Artifact Sync Closeout` 与冲突裁决规则；本 Story 必须沿用相同收口方式。
- Story 13.2 已示范“文档 + 结构化测试”的落地模式：新增 implementation artifact，再用 `node:test` 对关键 marker 做 guardrail。
- Story 11.2、12.2 已在后续波次推进，并已有 PR `#89`、`#90`；本 Story 需要把这些执行事实纳入 tracker，而不是停留在 2026-04-19 的 planning 状态。
- Story 12.4 明确依赖 `HTH-209`、`HTH-210`、`HTH-212`、`HTH-211` 和首批 release/smoke/evidence stories；本 Story 的 tracker 必须让 12.4 能直接消费这些依赖状态。

### Testing Requirements

- Focused guardrail test：`node --test test/v1-2-0-handoff-index.test.js`
- Full regression suite：`npm test`
- 代码审查：对新增 handoff index / execution tracker / test diff 进行 adversarial review，若无必须修复项，需在 Dev Agent Record 中记录 clean review 结论。

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 13.3]
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-04-19.md#Recommended create-story order]
- [Source: _bmad-output/planning-artifacts/implementation-readiness-report-2026-04-19.md#Dependency Analysis]
- [Source: _bmad-output/planning-artifacts/prd.md#后续阶段顺序]
- [Source: _bmad-output/planning-artifacts/prd.md#v1.2.0 Out of Scope / 后置]
- [Source: _bmad-output/implementation-artifacts/story-artifact-sync-rules.md]
- [Source: HTH-201 child issue snapshot on 2026-04-20]
- [Source: GitHub PR snapshot #83, #84, #85, #86, #88, #89, #90 on 2026-04-20]

## Artifact Sync Closeout

- [x] story 文件头 `Status` 与实际状态一致
- [x] Tasks/Subtasks 勾选与实际完成项一致
- [x] Dev Agent Record 记录实现、测试、审查和残余风险
- [x] File List 覆盖全部新增/修改/删除文件
- [x] `sprint-status.yaml` 中 story key 已同步
- [x] 若 Delivery Type 为 Foundation-only，已填写 User-visible Rollout Follow-up；本 Story 为 documentation-only，后续 rollout 不适用

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-04-20: Story 13.3 在 worktree `story/13-3-v1-2-0-handoff-index-tracking-artifacts` 中创建，基于 `origin/story/13-2-codeup-evidence-ledger` 作为执行基线。
- 2026-04-20: 从 `_bmad-output/planning-artifacts/epics.md`、Correct Course proposal、implementation readiness report、`HTH-201` 子 issue、PR `#83/#84/#85/#86/#88/#89/#90` 收集 phase / dispatch / gating 快照。
- 2026-04-20: 新增 `_bmad-output/implementation-artifacts/v1-2-0-handoff-index.md` 与 `_bmad-output/implementation-artifacts/v1-2-0-execution-tracker.yaml`，把 P0-P5、执行顺序、handoff recipients、review waves、release gate、deferred scope 和当前 issue/PR 状态固化。
- 2026-04-20: 新增 `test/v1-2-0-handoff-index.test.js`，guard 住 phases、首批候选、后续顺序、dispatch interpretation 与 open-PR-not-merged 约束。
- 2026-04-20: Focused guardrail test 与全量 `npm test` 通过；代码审查未发现必须修复项。
- 2026-04-20: Story 13.3 与 `sprint-status.yaml` 同步为 `done`，Epic 13 因全部 stories 完成而同步关闭。

### Completion Notes List

- [x] 新增 `v1-2-0-handoff-index.md`，让 SM 无需重新解释 Correct Course proposal 即可看到首批候选、后续顺序、handoff recipients、review waves 与 release gate。
- [x] 新增 `v1-2-0-execution-tracker.yaml`，结构化记录 `issue_status`、`pr_state`、`merged`、`merge_status`、`ci_status`、依赖与 dispatch interpretation。
- [x] 明确保留“issue done but PR OPEN”与“blocked status stale after blockers resolved”这类状态，防止派单和发布决策误判。
- [x] 明确 v1.3.0 / post-v1.2.0 / post-MVP deferred scope，避免把 Codeup 扩展、全 CLI 中文化和未来能力混入 v1.2.0 release gate。
- [x] Focused guardrail test 已通过：`node --test test/v1-2-0-handoff-index.test.js`。
- [x] Full unit suite 已通过：`npm test`。
- [x] 代码审查完成：未发现必须修复项，AC1-AC2 与 handoff tracker/test 对齐。

### File List

- `_bmad-output/implementation-artifacts/13-3-v1-2-0-handoff-index.md` - Story 13.3 工件与执行记录。
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - 更新 Story 13.3 与 Epic 13 状态。
- `_bmad-output/implementation-artifacts/v1-2-0-execution-tracker.yaml` - 新增 v1.2.0 结构化执行追踪工件。
- `_bmad-output/implementation-artifacts/v1-2-0-handoff-index.md` - 新增 v1.2.0 handoff index。
- `test/v1-2-0-handoff-index.test.js` - 新增 handoff index / execution tracker guardrail 测试。

### Change Log

- 2026-04-20: 创建 Story 13.3，状态 `ready-for-dev`。
- 2026-04-20: 完成 handoff index、execution tracker 和 guardrail test，实现状态更新为 `review`。
- 2026-04-20: 代码审查通过，Story 13.3 与 Epic 13 状态更新为 `done`。
