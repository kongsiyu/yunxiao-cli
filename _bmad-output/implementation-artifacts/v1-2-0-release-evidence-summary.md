# v1.2.0 Release Evidence Summary

Generated: 2026-04-20
Story: 12.4 / HTH-213
Evidence branch: `story/12-4-v1-2-0-release-evidence-summary`
Evidence baseline: `origin/docs/bmad-owned-repo-workflow-templates`
Evidence input baseline HEAD `89d60a8` (`docs: add v1.2.0 planning artifacts`)

## GO/NO-GO Decision

**Decision**: `NO-GO`

Open release blockers exist. v1.2.0 must not be tagged, published, or handed to the publish workflow until the blocker table below is cleared and this evidence is regenerated against the final release branch.

Primary reasons:

- Required prerequisite PRs for v1.2.0 remain open and unmerged.
- The current branch still reports `package.json version` `1.1.0`; no `v1.2.0` git tag exists.
- Release checklist, smoke runner, JSON contract regression, i18n rollout, docs boundary, evidence ledger, and handoff tracker are not all merged into a single release branch.
- `npm run smoke` is a required release gate, but it is unavailable on this evidence baseline until PR #85 is merged.
- `npm pack --dry-run` was not executed as a final release proof because the target v1.2.0 release branch and package version do not exist yet.

## Release Blockers

| ID | Evidence | Classification | Required resolution |
| --- | --- | --- | --- |
| B1 | `package.json version` is `1.1.0`; runtime version also resolves from `package.json`; latest tag is `v1.1.0`; no `v1.2.0` git tag exists. | Release blocker | Update final release branch to `1.2.0`, verify runtime version, and create/push `v1.2.0` only after all release gates pass. |
| B2 | #83 `docs(bmad): add story artifact sync rules` is OPEN, CLEAN, unmerged; checks pass on Node 18/20/22. | Release blocker | Merge or deliberately exclude with reviewer approval; if excluded, regenerate evidence explaining why FR43/FR45 sync rules are not required for v1.2.0. |
| B3 | #84 `docs(release): add release checklist template` is OPEN, CLEAN, unmerged; checks pass on Node 18/20/22. | Release blocker | Merge before release so checklist evidence is part of the release branch. |
| B4 | #85 `test(smoke): add real CLI smoke matrix runner` is OPEN, CLEAN, unmerged; checks pass on Node 18/20/22. | Release blocker | Merge before release so `npm run smoke` and live/manual smoke instructions are available. |
| B5 | #86 `docs(codeup): add evidence ledger` is OPEN, CLEAN, unmerged; no checks reported. | Release blocker | Merge stacked branch after #83, or rerun equivalent checks on the final release branch. |
| B6 | #89 `feat: localize high-frequency human-readable CLI output` is OPEN, CLEAN, unmerged; no checks reported. | Release blocker | Merge stacked i18n rollout chain after its base branches and rerun tests on final release branch. |
| B7 | #90 `test(smoke): add JSON IO contract regressions` is OPEN, CLEAN, unmerged; no checks reported. | Release blocker | Merge after #85 and rerun `npm test` plus smoke contract checks on final release branch. |
| B8 | #91 `docs(bmad): add v1.2.0 handoff index tracking` is OPEN, CLEAN, unmerged; no checks reported. | Release blocker | Merge after #86 so handoff index and execution tracker are available to release reviewers. |
| B9 | #92 `docs(i18n): clarify v1.2.0 localization boundaries` is OPEN, CLEAN, unmerged; no checks reported. | Release blocker | Merge after #89 so README/SKILL machine-contract and i18n boundary statements are present. |
| B10 | Release note for v1.2.0 is not present on this evidence baseline. | Release blocker | Draft final release note after merged PR set is frozen; link commits, PRs, known limitations, and upgrade notes. |
| B11 | `npm pack --dry-run` was not accepted as final evidence because the release version/tag are absent and prerequisite files are not merged. | Release blocker | Run `npm pack --dry-run` on the final v1.2.0 release branch and record package contents. |

No prerequisite PR listed above is treated as non-blocking while it remains unmerged.

## Non-blocking Residual Risks

These items do not override the `NO-GO` decision. They become candidate residual risks only after all release blockers are cleared.

| ID | Risk | Classification | Mitigation / owner |
| --- | --- | --- | --- |
| R1 | GitHub reports no checks on stacked PRs #86/#89/#90/#91/#92 because their bases are story branches rather than `master`. | Non-blocking residual risk after merge | Re-run `npm test`, `npm run lint`, `npm run smoke`, and any live/manual smoke on the final merged release branch. |
| R2 | Live CLI smoke needs real `YUNXIAO_SMOKE_PAT`, `YUNXIAO_SMOKE_ORG_ID`, and `YUNXIAO_SMOKE_PROJECT_ID`; this environment may not contain production-like credentials. | Non-blocking residual risk after CI-safe gates pass | Release owner runs live smoke in an authorized environment and appends output to the final checklist. |
| R3 | v1.2.0 intentionally does not localize every CLI command. | Non-blocking residual risk | README/SKILL boundary from #92 must remain visible; defer full CLI localization to post-v1.2.0 backlog. |
| R4 | Codeup API expansion remains evidence-led and not fully implemented in v1.2.0. | Non-blocking residual risk | Use #86 evidence ledger for v1.3.0 planning; do not advertise unsupported Codeup commands in release notes. |

## Post-release Follow-ups

| Follow-up | Timing | Owner |
| --- | --- | --- |
| Full CLI localization beyond `auth`, `whoami`, `project list`, `wi list/view/update`, and `sprint list/view`. | Post-v1.2.0 | Product / Developer |
| Codeup MR merge/comment/approval/diff/commits/discussions expansion. | v1.3.0 candidate | Product / Architect / Developer |
| Direct BMAD agent instruction edits outside repo-local workflows/artifacts. | Post-v1.2.0 governance decision | BMAD Master / Governance |
| Future shell completion and interactive TUI mode. | Post-MVP | Product |

## Verification Evidence

| Check | Status on this evidence branch | Evidence / command |
| --- | --- | --- |
| Focused release evidence guardrail | Passed: 4 tests, 0 failures | `node --test test/v1-2-0-release-evidence-summary.test.js` |
| Full unit suite | Passed: 299 tests, 0 failures | `npm test` after `npm ci` |
| Dependency install for verification | Completed; npm audit reported 2 existing moderate findings | `npm ci` |
| Lint / version smoke | Passed and printed `1.1.0` | `npm run lint` currently maps to `node src/index.js --version` |
| CLI smoke matrix | Blocked on unmerged PR #85 | `npm run smoke` does not exist on this evidence baseline. |
| Live CLI smoke | Blocked on #85 and live env | `npm run smoke:live` is unavailable until smoke runner is merged. |
| JSON stdout/stderr/error-code contract regression | Blocked on unmerged PR #90 | Dependency branch evidence exists, but final release branch must rerun after merge. |
| Release checklist execution | Blocked on unmerged PR #84 | Checklist template is not available on this evidence baseline. |
| npm pack dry-run | Blocked as final release proof | `npm pack --dry-run` must run after v1.2.0 version/tag branch is ready. |

## Version, Tag, and Package Evidence

| Item | Current evidence | Gate result |
| --- | --- | --- |
| `package.json version` | `1.1.0` | Blocker for v1.2.0 |
| `runtime version` | CLI runtime reads `package.json` via `getPackageVersion()` and therefore currently reports `1.1.0`. | Blocker for v1.2.0 |
| Latest `git tag` | `v1.1.0`; no `v1.2.0` tag exists. | Blocker |
| Package files whitelist | `package.json` currently includes `src/` and `README.md`. | Must be rechecked with `npm pack --dry-run` after release branch is final. |
| `npm pack --dry-run` | Not final-run for v1.2.0 because version/tag and prerequisites are absent. | Blocker |

## Release Note and Publish Workflow Evidence

| Item | Current evidence | Gate result |
| --- | --- | --- |
| Release note | No final v1.2.0 release note exists on this evidence baseline. | Blocker |
| Publish workflow | Existing publish flow is tag-driven; final release must not push `v1.2.0` until blockers are cleared. | Blocker until final GO |
| Release checklist | Provided by PR #84, currently unmerged. | Blocker |
| Known limitations | Must include partial CLI localization and deferred Codeup expansion. | Required before GO |

## PR and Commit Traceability

| PR | Scope | Base | Head | Merge / CI evidence | Release gate classification |
| --- | --- | --- | --- | --- | --- |
| #83 | Story 13.1 artifact sync rules | `master` | `story/13-1-story-artifact-sync-rules` | OPEN, CLEAN, Node 18/20/22 checks pass, not merged | Release blocker |
| #84 | Story 12.3 release checklist template | `master` | `story/12-3-release-checklist-template` | OPEN, CLEAN, Node 18/20/22 checks pass, not merged | Release blocker |
| #85 | Story 12.1 real CLI smoke matrix | `master` | `story/12-1-real-cli-smoke-matrix` | OPEN, CLEAN, Node 18/20/22 checks pass, not merged | Release blocker |
| #86 | Story 13.2 Codeup evidence ledger | `story/13-1-story-artifact-sync-rules` | `story/13-2-codeup-evidence-ledger` | OPEN, CLEAN, no checks reported, not merged | Release blocker |
| #89 | Story 11.2 high-frequency zh rollout | `story/11-1-i18n-audit-rollout-scope` | `story/11-2-high-frequency-output-zh-rollout` | OPEN, CLEAN, no checks reported, not merged | Release blocker |
| #90 | Story 12.2 JSON IO contract regressions | `story/12-1-real-cli-smoke-matrix` | `story/12-2-json-io-contract-regression-tests` | OPEN, CLEAN, no checks reported, not merged | Release blocker |
| #91 | Story 13.3 handoff index tracking | `story/13-2-codeup-evidence-ledger` | `story/13-3-v1-2-0-handoff-index-tracking-artifacts` | OPEN, CLEAN, no checks reported, not merged | Release blocker |
| #92 | Story 11.3 README/SKILL i18n boundaries | `story/11-2-high-frequency-output-zh-rollout` | `story/11-3-readme-skill-boundary-clarifications` | OPEN, CLEAN, no checks reported, not merged | Release blocker |

Commit traceability:

- Evidence input baseline HEAD `89d60a8` contains v1.2.0 planning artifacts and workflow templates.
- `origin/master` HEAD `dcc353a` is tagged `v1.1.0`.
- v1.2.0 release commit traceability is incomplete until all selected PRs are merged into the final release branch and release notes link the merged PR set.

## Story Evidence Inputs

| Story | Evidence source | Current release-gate status |
| --- | --- | --- |
| 11.2 | PR #89 / `_bmad-output/implementation-artifacts/11-2-high-frequency-i18n-rollout.md` | Blocked until merged and tested on final branch. |
| 11.3 | PR #92 / `_bmad-output/implementation-artifacts/11-3-readme-skill-i18n-boundaries.md` | Blocked until merged after #89. |
| 12.1 | PR #85 / smoke runner and `test/smoke.test.js` | Blocked until merged; CI checks pass on PR branch. |
| 12.2 | PR #90 / JSON contract regression evidence | Blocked until merged after #85. |
| 12.3 | PR #84 / release checklist template | Blocked until merged; CI checks pass on PR branch. |
| 13.1 | PR #83 / story artifact sync rules | Blocked until merged; CI checks pass on PR branch. |
| 13.2 | PR #86 / Codeup evidence ledger | Blocked until merged after #83. |
| 13.3 | PR #91 / handoff index and execution tracker | Blocked until merged after #86. |

## Reviewer Handoff

Reviewer / Scrum Master should not approve v1.2.0 release from this evidence snapshot.

To move from `NO-GO` to candidate `GO`:

1. Merge or explicitly descope every blocker PR with reviewer approval.
2. Update final release branch to `1.2.0` and verify runtime version, `package.json version`, and `v1.2.0` tag alignment.
3. Run final branch verification: `npm test`, `npm run lint`, `npm run smoke`, authorized live smoke if credentials exist, and `npm pack --dry-run`.
4. Complete the release checklist from PR #84 on the final branch.
5. Draft release note with merged PR list, commit traceability, known limitations, and post-release follow-ups.
6. Regenerate this evidence summary with final command outputs and reclassify any remaining residual risks.
