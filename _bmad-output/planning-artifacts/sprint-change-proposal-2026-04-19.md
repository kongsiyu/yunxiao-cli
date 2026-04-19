---
date: '2026-04-19'
project: yunxiao-cli
workflow: bmad-correct-course
issue: HTH-194
mode: batch
approval: pre-approved by upstream HTH-193 direction; adjusted by HTH-194 comment fa38f0ec-0042-4b44-9ca8-ba7631d4e778
scopeClassification: moderate
status: ready-for-iteration-orchestration
---

# Sprint Change Proposal - v1.2.0 Correct Course

## 1. Issue Summary

v1.1.0 completed the stability and Codeup first-stage release, but the release retrospective identified three planning risks that must be corrected before the next iteration expands further:

- i18n was completed as foundation, but not as broad user-visible CLI localization.
- story files, task checkboxes, and `sprint-status.yaml` drifted from actual release state.
- Codeup API evidence is mixed between document-derived and live-tested confidence.

The upstream-approved direction from HTH-193 is **方案 A 为主，吸收方案 C 必要门禁**: v1.2.0 should be a **可用性收口 + AI workflow 契约加固版本**. Codeup expansion is not the v1.2.0 mainline; Codeup work in v1.2.0 is evidence management only.

Latest HTH-194 comment clarified the handoff model:

- Do not directly create story files in this planner task.
- Run BMAD readiness check.
- If ready, create Paperclip issue(s) to arrange iteration.
- Each later execution issue will create story files through `bmad-create-story`.

## 2. Impact Analysis

### Epic Impact

| Epic | Impact |
|---|---|
| Epic 9 | Remains done. Story 9.6 is treated as i18n foundation complete, not full user-visible rollout complete. |
| Epic 10 | Added to planning baseline as v1.1.0 delivered Codeup repo/MR minimum loop. |
| Epic 11 | New v1.2.0 epic for CLI usability closure and localization rollout. |
| Epic 12 | New v1.2.0 epic for AI workflow contract hardening and release gate. |
| Epic 13 | New v1.2.0 epic for BMAD artifact hygiene and Codeup evidence governance. |

### Story Impact

New stories were added to `epics.md` only. No story files were created.

First create-story candidates:

1. `13.1` Story 工件状态同步规则与 foundation-only 标记
2. `11.1` i18n 缺口审计与 rollout 范围锁定
3. `12.3` Release checklist 模板化
4. `12.1` 真实 CLI smoke matrix 与执行入口
5. `13.2` Codeup evidence ledger

Remaining backlog sequence:

1. `11.2` 高频命令人类可读输出中文化 rollout
2. `12.2` JSON/stdout/stderr/error-code 契约回归测试补强
3. `11.3` README / SKILL 边界补充
4. `13.3` v1.2.0 handoff index 与执行追踪工件
5. `12.4` v1.2.0 发布前验收与 release evidence 汇总

### Artifact Conflicts

| Artifact | Finding | Action |
|---|---|---|
| `prd.md` | Did not include v1.2.0 post-confirmation scope and phase plan | Updated |
| `epics.md` | Did not include Epic 10 delivered baseline or v1.2.0 Epic 11-13 | Updated |
| `sprint-status.yaml` | Needed new backlog entries but no story files should be created yet | Updated with backlog entries only |
| Architecture | No standalone file; embedded PRD architecture is enough for this CLI scope | No blocker |
| UX | No graphical UX doc required; CLI UX covered by command/output requirements | No blocker |

### Technical Impact

The proposal affects planning and validation flow, not product code directly:

- Future development will touch i18n, output/error handling, tests, docs, and release templates.
- JSON schema, stdout/stderr behavior, and ERROR_CODE values are protected constraints.
- Codeup feature development is explicitly deferred until evidence ledger confirms readiness.

## 3. Recommended Approach

Recommended path: **Direct Adjustment + process gate**.

This is not a rollback and not an MVP reduction. The original MVP remains complete; v1.2.0 is a post-release correction that adds new epics and sequencing rules.

Rationale:

- Directly adding Epic 11-13 preserves momentum without reopening completed Epic 9/10 scope.
- Keeping all new sprint-status entries as `backlog` respects BMAD create-story flow.
- Running readiness check before issue creation avoids prematurely dispatching ambiguous work.
- Codeup expansion is deferred, reducing live-test/API uncertainty in v1.2.0.

Effort estimate: Medium  
Risk level: Low-Medium  
Timeline impact: one planning/SM handoff step added before development, offset by lower rework risk.

## 4. Detailed Change Proposals

### PRD Updates

Updated `_bmad-output/planning-artifacts/prd.md`:

- Added v1.2.0 Correct Course scope.
- Added In Scope / Out of Scope definitions.
- Added P0-P5 phase plan.
- Added Epic 10 baseline and Epic 11-13 summaries.
- Updated Document Status and Open Questions.

### Epic Updates

Updated `_bmad-output/planning-artifacts/epics.md`:

- Added FR35-FR45.
- Added coverage mappings for v1.2.0.
- Added Epic 10 delivered baseline.
- Added Epic 11-13 with BDD-style acceptance criteria.
- Marked first batch as **Create-Story Priority: P1**, not `ready-for-dev`.

### Sprint Tracking Updates

Updated `_bmad-output/implementation-artifacts/sprint-status.yaml`:

- Added Epic 11-13 as `backlog`.
- Added all v1.2.0 stories as `backlog`.
- Did not mark any new story `ready-for-dev`, because no story files were created.

### Readiness Check

Created `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-19.md`.

Readiness result: **GO WITH CONDITIONS**

Condition: next step must be Paperclip iteration orchestration that runs `bmad-create-story` before implementation.

## 5. Implementation Handoff

Scope classification: **Moderate**

Handoff recipients:

| Recipient | Responsibility |
|---|---|
| Scrum Master / iteration owner | Create story files using `bmad-create-story`, sequence the iteration, and dispatch implementation issues. |
| Developer agent | Implement only after generated story files exist. |
| Reviewer / Test Architect | Validate contract regression, release checklist, and release evidence. |
| Planner / PM | Re-enter Correct Course only if scope changes beyond current v1.2.0 boundaries. |

### Recommended Paperclip Iteration Issue

Create a child issue under HTH-194:

**Title:** v1.2.0 迭代安排：按 readiness 报告创建 stories 并分派首批执行  

**Core instruction:** Do not implement directly. Run `bmad-create-story` for selected backlog entries, starting with `13.1`, `11.1`, `12.3`, `12.1`, `13.2`.

### Deferred to v1.3.0 / Post-MVP

- MR merge/comment/close/approval.
- MR diff/commits/discussions.
- Full CLI localization.
- Direct BMAD agent instruction changes.
- Shell completion, TUI, multi-org/multi-project switching.

## 6. Workflow Completion

Issue addressed: v1.2.0 planning needed executable phase sequencing after upstream approval of the recommended direction.

Artifacts modified:

- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

Artifacts added:

- `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-19.md`
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-04-19.md`

Routed to:

- Paperclip iteration issue for SM/iteration owner.

Status:

- Ready for Paperclip issue creation.
