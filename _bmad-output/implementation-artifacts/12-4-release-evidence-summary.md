# Story 12.4: v1.2.0 发布前验收与 release evidence 汇总

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a reviewer,
I want a single release evidence summary before v1.2.0 goes out,
so that GO/NO-GO is based on explicit evidence instead of scattered comments.

## Acceptance Criteria

1. **Given** Epic 11-13 的 v1.2.0 stories 已完成, **when** 执行发布前验收, **then** 汇总测试、smoke、pack dry-run、version/tag、release note、已知残余风险和后置项.
2. **Given** 存在残余风险, **when** Reviewer 给出结论, **then** 明确区分 release blocker 与 non-blocking residual risk.
3. **Given** 前置 PR 尚未合并, **when** 生成 release evidence, **then** 每个未合并 PR 必须标记为 release blocker 或明确说明为什么不是 blocker.
4. **Given** Reviewer / Scrum Master 做 GO/NO-GO 判断, **when** 阅读 release evidence, **then** 可在一个工件中看到本地验证、CI/PR 状态、commit/tag 可追溯性、release note 状态、后置项和明确结论.

## Tasks / Subtasks

- [x] Task 1: 汇总 release gate 输入事实 (AC: #1, #3, #4)
  - [x] Subtask 1.1: 记录当前 runtime/package/tag 版本、当前分支 HEAD、目标基线和 release note/checklist 状态.
  - [x] Subtask 1.2: 汇总 PR #83/#84/#85/#86/#89/#90/#91/#92 的 head/base、merge 状态、CI 状态和 release gate 分类.
  - [x] Subtask 1.3: 汇总 Story 11.2、11.3、12.1、12.2、12.3、13.1、13.2、13.3 的交付证据位置和可消费性.

- [x] Task 2: 创建单一 release evidence summary 工件 (AC: #1, #2, #3, #4)
  - [x] Subtask 2.1: 新增 `_bmad-output/implementation-artifacts/v1-2-0-release-evidence-summary.md`.
  - [x] Subtask 2.2: 明确 GO/NO-GO 结论；若任何 release blocker 存在，结论必须为 `NO-GO`.
  - [x] Subtask 2.3: 分离 `Release Blockers`、`Non-blocking Residual Risks`、`Post-release Follow-ups`.
  - [x] Subtask 2.4: 覆盖测试、smoke、pack dry-run、version/tag、release note、publish workflow、PR/commit traceability 和 reviewer handoff.

- [x] Task 3: 增加 guardrail 测试保护 evidence 结构 (AC: #1, #2, #3, #4)
  - [x] Subtask 3.1: 新增 `test/v1-2-0-release-evidence-summary.test.js`.
  - [x] Subtask 3.2: 测试 evidence 包含 GO/NO-GO、release blockers、non-blocking residual risks、post-release follow-ups、version/tag、test/smoke/pack、release note、PR traceability.
  - [x] Subtask 3.3: 测试未合并 prerequisite PR 被显式分类，且存在 blocker 时结论保持 `NO-GO`.

- [x] Task 4: 完成验证、代码审查和 BMAD 工件同步 (AC: #1, #2, #3, #4)
  - [x] Subtask 4.1: 运行 focused guardrail test 与 `npm test`.
  - [x] Subtask 4.2: 执行 BMAD code review，修复必须修复项.
  - [x] Subtask 4.3: 更新本 Story 的 Dev Agent Record、File List、Change Log 与 `sprint-status.yaml`.

## Dev Notes

### 权威输入

- `_bmad-output/planning-artifacts/epics.md`: Story 12.4 / FR42 / FR45, 要求发布前单一 evidence summary.
- `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-19.md`: v1.2.0 P0-P5 phase order、release gate 和依赖关系.
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-04-19.md`: 首批候选和后续派单顺序.
- `_bmad-output/planning-artifacts/prd.md`: v1.2.0 scope、out-of-scope、release gate 和 AI workflow 契约稳定要求.
- HTH-213 issue description: 前置 PR 未合并时必须在 release evidence 中标记为 release blocker 或说明非 blocker 原因.
- PR #84 / Story 12.3: release checklist template 是 release evidence 的输入，但当前未合并到本基线.
- PR #85 / Story 12.1: smoke matrix 和 `npm run smoke` 是 release evidence 输入，但当前未合并到本基线.
- PR #90 / Story 12.2: JSON/stdout/stderr/error-code contract regression 是 release evidence 输入，但当前未合并到本基线.
- PR #91 / Story 13.3: handoff index / execution tracker 是 release evidence 输入，但当前未合并到本基线.

### 当前 GitHub / Release Gate 事实

- 当前执行分支基于 `origin/docs/bmad-owned-repo-workflow-templates`，输入基线 HEAD `89d60a8`.
- `origin/master` HEAD `dcc353a` 已打 tag `v1.1.0`; 当前 `package.json` 版本仍为 `1.1.0`; 尚无 `v1.2.0` tag.
- PR #83 (`story/13-1-story-artifact-sync-rules` -> `master`) OPEN, CLEAN, checks pass on Node 18/20/22, not merged.
- PR #84 (`story/12-3-release-checklist-template` -> `master`) OPEN, CLEAN, checks pass on Node 18/20/22, not merged.
- PR #85 (`story/12-1-real-cli-smoke-matrix` -> `master`) OPEN, CLEAN, checks pass on Node 18/20/22, not merged.
- PR #86 (`story/13-2-codeup-evidence-ledger` -> `story/13-1-story-artifact-sync-rules`) OPEN, CLEAN, no checks reported, not merged.
- PR #89 (`story/11-2-high-frequency-output-zh-rollout` -> `story/11-1-i18n-audit-rollout-scope`) OPEN, CLEAN, no checks reported, not merged.
- PR #90 (`story/12-2-json-io-contract-regression-tests` -> `story/12-1-real-cli-smoke-matrix`) OPEN, CLEAN, no checks reported, not merged.
- PR #91 (`story/13-3-v1-2-0-handoff-index-tracking-artifacts` -> `story/13-2-codeup-evidence-ledger`) OPEN, CLEAN, no checks reported, not merged.
- PR #92 (`story/11-3-readme-skill-boundary-clarifications` -> `story/11-2-high-frequency-output-zh-rollout`) OPEN, CLEAN, no checks reported, not merged.

### Implementation Boundaries

- 本 Story 是 release evidence / documentation + guardrail test，不修改 CLI runtime 行为.
- 不复制未合并 PR 的实现文件到本分支；未合并 prerequisite 只能作为 release blocker 或 residual risk 在 evidence 中分类.
- 不声称 v1.2.0 release ready；只要 prerequisite PR 未合并、`v1.2.0` tag 缺失或 release note/checklist 未落入 release branch，结论必须为 `NO-GO`.
- Evidence 必须可供 Reviewer/SM 直接判断，不依赖读 issue comments.
- Evidence 中的命令执行结果必须区分 `local verification on current evidence branch` 与 `dependency branch evidence`.

### Testing Requirements

- 新增 focused test 直接读取 `_bmad-output/implementation-artifacts/v1-2-0-release-evidence-summary.md`.
- Required commands:
  - `node --test test/v1-2-0-release-evidence-summary.test.js`
  - `npm test`
- 若当前基线没有 `npm run smoke` 或 release checklist template 文件，不要伪造通过；在 evidence 中记录为 blocker / blocked by open PR.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 12.4]
- [Source: _bmad-output/planning-artifacts/implementation-readiness-report-2026-04-19.md#Recommended Next Steps]
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-04-19.md#Recommended create-story order]
- [Source: _bmad-output/planning-artifacts/prd.md#v1.2.0 Correct Course Scope]
- [Source: _bmad-output/implementation-artifacts/sprint-status.yaml]
- [Source: GitHub PR snapshot #83/#84/#85/#86/#89/#90/#91/#92 on 2026-04-20]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-04-20: Story 12.4 created in worktree `story/12-4-v1-2-0-release-evidence-summary`; worktree corrected to `origin/docs/bmad-owned-repo-workflow-templates` because `origin/master` lacked the required April 19 planning inputs.
- 2026-04-20: Started dev-story implementation; sprint status moved to `in-progress`.
- 2026-04-20: Red focused test failed on missing `v1-2-0-release-evidence-summary.md`, then passed after creating the release evidence summary.
- 2026-04-20: Initial full `npm test` failed because the new worktree had no installed dependencies (`axios`, `commander`, `chalk` missing); ran `npm ci`, then full `npm test` passed.
- 2026-04-20: Story moved to `review`; sprint status moved to `review` after focused/full validation passed.
- 2026-04-20: BMAD code review found one traceability wording issue: `Current evidence HEAD 89d60a8` would become stale after commit; patched to `Evidence input baseline HEAD 89d60a8`.
- 2026-04-20: Post-review focused guardrail and full `npm test` passed; story and sprint status moved to `done`.

### Completion Notes List

- Story created by BMAD create-story workflow with PR/CI facts loaded for release evidence implementation.
- Started implementation after loading full Story 12.4 context and release gate inputs.
- Created `_bmad-output/implementation-artifacts/v1-2-0-release-evidence-summary.md` with a single `NO-GO` release decision, blocker table, residual risk table, post-release follow-ups, verification evidence, version/tag/package evidence, release note/publish workflow evidence, PR/commit traceability, and reviewer handoff.
- Classified all unmerged prerequisite PRs #83/#84/#85/#86/#89/#90/#91/#92 as release blockers; no prerequisite PR is treated as non-blocking while unmerged.
- Added `test/v1-2-0-release-evidence-summary.test.js` to guard required evidence sections and prevent accidental `GO` while blockers exist.
- Verification completed: focused guardrail test passed 4/4, `npm test` passed 299/299 after `npm ci`, and `npm run lint` printed runtime version `1.1.0`.
- `npm ci` reported 2 moderate audit findings in existing dependencies; no dependency changes were made because this Story is release evidence only.
- Story moved to `review` after all implementation tasks except code review were completed.
- BMAD code review completed with one internal patch to keep HEAD traceability accurate after this story commit.
- Post-review validation passed: `node --test test/v1-2-0-release-evidence-summary.test.js` passed 4/4 and `npm test` passed 299/299.
- Story and `sprint-status.yaml` moved to `done`.

### File List

- `_bmad-output/implementation-artifacts/12-4-release-evidence-summary.md`
- `_bmad-output/implementation-artifacts/v1-2-0-release-evidence-summary.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `test/v1-2-0-release-evidence-summary.test.js`

### Change Log

- 2026-04-20: Created Story 12.4 and set status to `ready-for-dev`.
- 2026-04-20: Started Story 12.4 implementation and set status to `in-progress`.
- 2026-04-20: Implemented release evidence summary and guardrail tests; focused/full validations passed.
- 2026-04-20: Moved Story 12.4 to `review` for BMAD code review.
- 2026-04-20: Patched code review finding for evidence baseline HEAD wording.
- 2026-04-20: BMAD code review complete; Story 12.4 and sprint status updated to `done`.
