# v1.2.0 Handoff Index

Snapshot date: 2026-04-20
Snapshot note: This index combines planning artifacts with live Paperclip issue and GitHub PR state. `issue_status: done` never implies PR merged; `pr_state: OPEN` with `merged: false` is still unmerged work.

## Dispatch Rules

1. Use the execution order below as the canonical dispatch order. Do not reinterpret the Correct Course proposal per heartbeat.
2. Treat `issue_status`, `pr_state`, `merged`, `merge_status`, and `ci_status` as separate facts.
3. If an issue is still `blocked` but all explicit blockers are already `done`, treat it as a dispatch-refresh action, not as a hard blocker.
4. Do not start `12.4` until `11.3` and `13.3` are both complete and their handoff evidence is available.

## Phase Map

| Phase | Goal | Current snapshot | Handoff recipient |
|---|---|---|---|
| P0 | PRD / epics / change proposal / sprint status 对齐 | Done. PRD、epics、sprint change proposal、readiness report 已形成 v1.2.0 基线。 | BMAD Planner -> Scrum Master |
| P1 | Story 准备与派单 | Active. 首批和后续 wave issue 已创建；`11.3` 需要 unblock refresh，`12.4` 继续等待最终 release gate 条件。 | Scrum Master -> Developer |
| P2 | 开发波次 1 | First batch issues `HTH-196/197/198/199/200` 都已 `done`，但 PR `#83/#88/#84/#85/#86` 仍为 `OPEN (not merged)`。 | Developer -> Scrum Master |
| P3 | 开发波次 2 | `HTH-209`、`HTH-210` 已 `done` 且 PR `#89/#90` 为 `OPEN (not merged)`；`HTH-211` 正在产出 handoff/tracker；`HTH-212` 需要 unblock refresh。 | Developer -> Scrum Master |
| P4 | 评审验收波次 | 尚未整体收口。需要在 `11.3` 与 `13.3` 完成后统一确认 docs boundary、machine contract、story closeout 和 release evidence 输入。 | Reviewer / Test Architect -> Scrum Master |
| P5 | 发布前门禁 | 尚未启动。`12.4` 仍 blocked，且多个实施 PR 尚未合并。 | Scrum Master / Release Owner |

## First Batch Create-Story Candidates

| Order | Story | Dispatch issue | Dependency | Current snapshot | Next handoff |
|---|---|---|---|---|---|
| 1 | `13.1` Story 工件状态同步规则与 foundation-only 标记 | `HTH-196` | None | Issue `done`; PR `#83` is `OPEN (not merged)`; `merge_status=CLEAN`; `ci_status=all_checks_passed`. | Scrum Master |
| 2 | `11.1` i18n 缺口审计与 rollout 范围锁定 | `HTH-197` | None | Issue `done`; PR `#88` is `OPEN (not merged)`; `merge_status=CLEAN`; `ci_status=no_checks_reported`. | Scrum Master |
| 3 | `12.3` Release checklist 模板化 | `HTH-198` | None | Issue `done`; PR `#84` is `OPEN (not merged)`; `merge_status=CLEAN`; `ci_status=all_checks_passed`. | Scrum Master |
| 4 | `12.1` 真实 CLI smoke matrix 与执行入口 | `HTH-199` | None | Issue `done`; PR `#85` is `OPEN (not merged)`; `merge_status=CLEAN`; `ci_status=all_checks_passed`. | Scrum Master |
| 5 | `13.2` Codeup evidence ledger | `HTH-200` | Uses `13.1` artifact-rules branch baseline | Issue `done`; PR `#86` is `OPEN (not merged)`; `merge_status=CLEAN`; `ci_status=no_checks_reported`. | Scrum Master |

## Remaining Execution Order

| Order | Story | Dispatch issue | Dependency | Current snapshot | Next handoff |
|---|---|---|---|---|---|
| 6 | `11.2` 高频命令人类可读输出中文化 rollout | `HTH-209` | `11.1` | Issue `done`; PR `#89` is `OPEN (not merged)`; `merge_status=CLEAN`; `ci_status=no_checks_reported`. | Scrum Master |
| 7 | `12.2` JSON/stdout/stderr/error-code 契约回归测试补强 | `HTH-210` | `12.1` | Issue `done`; PR `#90` is `OPEN (not merged)`; `merge_status=CLEAN`; `ci_status=no_checks_reported`. | Scrum Master |
| 8 | `11.3` README / SKILL 边界补充 | `HTH-212` | `11.2` + `11.1` | Issue still `blocked`, but explicit blocker `HTH-209` is already `done`; no PR yet. Interpret this as `blocked_status_stale` and resume/create-story refresh instead of treating it as a hard stop. | Scrum Master -> Developer |
| 9 | `13.3` v1.2.0 handoff index 与执行追踪工件 | `HTH-211` | Needs current `HTH-201` + PR snapshot, not merged-first assumptions | This Story produces the canonical handoff snapshot and execution tracker. Before Step 8 push/PR, treat it as current implementation work. | Developer -> Scrum Master |
| 10 | `12.4` v1.2.0 发布前验收与 release evidence 汇总 | `HTH-213` | `11.2`, `12.2`, `11.3`, `13.3`, plus first-batch release/smoke/evidence inputs | Issue is `blocked`; blockers `HTH-209` and `HTH-210` are already `done`, but `HTH-212` remains stale-blocked and `HTH-211` must complete first. No PR yet. | Scrum Master -> Developer -> Reviewer / Test Architect |

## Review / Acceptance Waves

| Wave | Stories | What must be accepted together | Current snapshot |
|---|---|---|---|
| Wave A: baseline-input acceptance | `13.1`, `11.1`, `12.3`, `12.1`, `13.2` | Story artifact sync rules, i18n scope lock, release checklist, smoke matrix, Codeup evidence ledger all exist and stay traceable. | All issues are `done`; every related PR is still `OPEN (not merged)`. |
| Wave B: rollout-contract-handoff acceptance | `11.2`, `12.2`, `11.3`, `13.3` | Human-readable zh rollout, JSON contract regressions, README/SKILL boundary, and canonical handoff tracker line up. | `11.2` + `12.2` issues are `done` with open PRs; `11.3` needs unblock refresh; `13.3` is the current story. |
| Wave C: release GO/NO-GO acceptance | `12.4` | Release evidence summary must classify blockers vs residual risks and confirm gate readiness. | Not started; still blocked by `11.3`, `13.3`, and unmerged evidence PRs. |

## Release Gate Before `12.4`

The release gate remains owned by `12.4`. Before that story can close, the handoff index expects these checks to be assembled in one place:

- `npm test`
- Critical CLI smoke evidence from the v1.2.0 matrix
- `npm pack --dry-run`
- runtime version / `package.json` version / git tag alignment
- release note readiness
- publish workflow / pipeline status
- PR / commit traceability
- explicit classification of release blockers vs non-blocking residual risks

## Deferred Scope

### v1.3.0 Candidate Scope

- Codeup MR merge/comment/approval/diff/commits/discussions, gated by the evidence ledger and any required spike/live verification

### Post-v1.2.0 Backlog

- Full-CLI localization beyond the scoped high-frequency commands
- Direct edits to BMAD agent instructions; v1.2.0 only fixes project-local workflows/artifacts

### Post-MVP / Future

- Shell completion
- Interactive TUI mode
- Multi-organization / multi-project fast switching
- Broader Yunxiao module expansion beyond the currently evidenced scope

## Data Provenance

- Planning baseline: `epics.md`, `sprint-change-proposal-2026-04-19.md`, `implementation-readiness-report-2026-04-19.md`, `prd.md`
- Execution baseline: `HTH-201` child issues `HTH-196` through `HTH-213`
- PR snapshot used for status columns: `#83`, `#84`, `#85`, `#86`, `#88`, `#89`, `#90`
