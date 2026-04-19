# Codeup evidence ledger

**Status**: active  
**Created**: 2026-04-19  
**Source Story**: 13.2 Codeup evidence ledger  
**Scope**: v1.3.0 planning evidence for Codeup candidate APIs

## Purpose

This ledger prevents v1.3.0 Codeup expansion from treating document-only assumptions as development-ready facts. It records the current evidence level for shipped and candidate Codeup APIs, separates implementation-backed mock/unit coverage from live API evidence, and identifies which future capabilities need a spike before story creation.

## Evidence Level Definitions

| evidence level | Meaning | Allowed planning action |
| --- | --- | --- |
| `document-only` | Endpoint or capability is only inferred from docs, prior notes, or GitLab-compatible naming assumptions. No local implementation and no recorded live response exists. | Create a spike or live verification task only. Do not create a feature story as ready for development. |
| `script-ready` | A verification script, local implementation, mock test, or unit test exists, but no dated live PAT/API response is recorded in the repo. | Use as implementation context only after a live verification spike or explicit scope approval. |
| `live-tested` | A real API call has been recorded with date, auth method, status/result, and key response fields. | Candidate can be considered for v1.3.0 story readiness after normal PM/Architect review. |

## Ledger Fields

Every candidate API entry records:

- `endpoint`
- `auth`
- `必填字段`
- `返回关键字段`
- `验证方法`
- `evidence level`
- `风险等级`
- `后续 story 影响`

Unless a row explicitly says `live-tested`, the capability is not a development-ready input.

## Shared Codeup Assumptions

- Base URL: `https://codeup.aliyuncs.com/api/v3`
- Auth: HTTP header `x-yunxiao-token: <PAT>`
- Source evidence: `_bmad-output/research/codeup-api-verification.md`, `test/spike-codeup-api.js`, `src/codeup-api.js`, `src/commands/repo.js`, `test/codeup-api.test.js`, `test/repo.test.js`
- Current limitation: the 2026-04-17 research report records CTO-directed/document-derived compatibility and a script path, but it also says real PAT verification still needs to be added. Therefore shipped Epic 10 capabilities are `script-ready`, not `live-tested`.

## Implemented / Shipped API Evidence

### repo list

| Field | Value |
| --- | --- |
| endpoint | `GET /projects` |
| auth | `x-yunxiao-token: <PAT>` |
| 必填字段 | None |
| 返回关键字段 | `id`, `name`, `description`, `visibility_level`, `web_url` |
| 验证方法 | Implemented in `src/codeup-api.js` as `listRepos`; command mapping in `src/commands/repo.js`; mock/unit coverage in `test/codeup-api.test.js` and `test/repo.test.js`; script path in `test/spike-codeup-api.js` Q4 |
| evidence level | `script-ready` |
| 风险等级 | Medium: endpoint is implemented and unit-tested, but no dated live response is committed |
| 后续 story 影响 | Can support v1.3.0 repo-related planning only after live verification confirms pagination and response fields |

### repo view

| Field | Value |
| --- | --- |
| endpoint | `GET /projects/{repoId}` |
| auth | `x-yunxiao-token: <PAT>` |
| 必填字段 | `repoId` / Codeup project `id` path parameter |
| 返回关键字段 | `id`, `name`, `description`, `visibility_level`, `web_url`, `created_at`, `last_activity_at`, `namespace` |
| 验证方法 | Implemented in `src/codeup-api.js` as `getRepo`; command mapping in `src/commands/repo.js`; mock/unit coverage in `test/codeup-api.test.js` and `test/repo.test.js`; script path in `test/spike-codeup-api.js` Q5 |
| evidence level | `script-ready` |
| 风险等级 | Medium: implemented locally, but richer response fields require live confirmation before new output commitments |
| 后续 story 影响 | New repo-detail fields need a live verification spike before v1.3.0 story creation |

### mr list

| Field | Value |
| --- | --- |
| endpoint | `GET /projects/{repoId}/merge_requests` |
| auth | `x-yunxiao-token: <PAT>` |
| 必填字段 | `repoId` / Codeup project `id` path parameter |
| 返回关键字段 | `iid` or `id`, `title`, `state`, `source_branch`, `target_branch`, `author`, `created_at` |
| 验证方法 | Implemented in `src/codeup-api.js` as `listMrs`; command mapping in `src/commands/repo.js`; mock/unit coverage in `test/codeup-api.test.js` and `test/repo.test.js`; script path in `test/spike-codeup-api.js` Q6 |
| evidence level | `script-ready` |
| 风险等级 | Medium: endpoint and local mapping exist, but state filtering and pagination need live API confirmation |
| 后续 story 影响 | v1.3.0 MR listing enhancements should first verify state values, paging shape, and `iid` versus `id` behavior live |

### mr view

| Field | Value |
| --- | --- |
| endpoint | `GET /projects/{repoId}/merge_requests/{mrId}` |
| auth | `x-yunxiao-token: <PAT>` |
| 必填字段 | `repoId`, `mrId` path parameters |
| 返回关键字段 | `iid` or `id`, `title`, `description`, `state`, `source_branch`, `target_branch`, `author`, `assignee`, `web_url`, `created_at`, `updated_at` |
| 验证方法 | Implemented in `src/codeup-api.js` as `getMr`; command mapping in `src/commands/repo.js`; mock/unit coverage in `test/codeup-api.test.js` and `test/repo.test.js`; script path in `test/spike-codeup-api.js` Q7 |
| evidence level | `script-ready` |
| 风险等级 | Medium: local field mapping is stable, but live API must confirm whether `mrId` expects `iid` or global `id` in all cases |
| 后续 story 影响 | Any v1.3.0 MR detail expansion should first verify live response fields for reviewers, labels, status checks, and related subresources |

### mr create

| Field | Value |
| --- | --- |
| endpoint | `POST /projects/{repoId}/merge_requests` |
| auth | `x-yunxiao-token: <PAT>` |
| 必填字段 | `repoId` path parameter, request body `title`, `source_branch`, `target_branch` |
| 返回关键字段 | `iid` or `id`, `title`, `description`, `state`, `source_branch`, `target_branch`, `author`, `assignee`, `web_url`, `created_at`, `updated_at`, optional `workitem_id` |
| 验证方法 | Implemented in `src/codeup-api.js` as `createMr`; command mapping in `src/commands/repo.js`; mock/unit coverage in `test/codeup-api.test.js` and `test/repo.test.js`; script path in `test/spike-codeup-api.js` Q8/Q9 |
| evidence level | `script-ready` |
| 风险等级 | High: creating MR mutates remote state and needs controlled live verification for duplicate MR, branch-not-found, reviewer, assignee, and workitem linkage behavior |
| 后续 story 影响 | Future create/update workflows must include a safe live verification plan with disposable branches/repositories before feature story readiness |

## v1.3.0 Candidate API Evidence

### mr merge

| Field | Value |
| --- | --- |
| endpoint | Candidate only: `POST /projects/{repoId}/merge_requests/{mrId}/merge`; must be confirmed by Codeup docs/live verification |
| auth | `x-yunxiao-token: <PAT>` with repository merge permission |
| 必填字段 | Candidate `repoId`, `mrId`; optional merge strategy fields are unknown |
| 返回关键字段 | Unknown until spike; expected minimum: merged MR identifier, state, merge commit or result status |
| 验证方法 | No local implementation; no live verification; use a dedicated spike with disposable branches before implementation |
| evidence level | `document-only` |
| 风险等级 | High: remote state mutation, permission differences, branch protection, conflicts, and destructive side effects |
| 后续 story 影响 | Requires spike/live verification before any v1.3.0 merge command story; not ready for feature development |

### mr comment

| Field | Value |
| --- | --- |
| endpoint | Candidate only: MR note/comment endpoint must be confirmed, likely under `/projects/{repoId}/merge_requests/{mrId}/...` |
| auth | `x-yunxiao-token: <PAT>` with MR read/comment permission |
| 必填字段 | Candidate `repoId`, `mrId`, comment body |
| 返回关键字段 | Unknown until spike; expected minimum: comment id, body, author, created time |
| 验证方法 | No local implementation; no live verification; use spike/live verification to identify the exact endpoint and body schema |
| evidence level | `document-only` |
| 风险等级 | Medium: non-destructive but user-visible and may have separate discussion/note schemas |
| 后续 story 影响 | Requires spike/live verification before v1.3.0 comment creation/listing story; not ready for feature development |

### mr approval

| Field | Value |
| --- | --- |
| endpoint | Candidate only: approval/reviewer endpoint must be confirmed from Codeup-specific API docs/live response |
| auth | `x-yunxiao-token: <PAT>` with reviewer/approval permission |
| 必填字段 | Unknown; likely `repoId`, `mrId`, approval action or reviewer identity |
| 返回关键字段 | Unknown until spike; expected minimum: approval status, reviewer, approved time |
| 验证方法 | No local implementation; no live verification; use spike/live verification with a test MR and reviewer account |
| evidence level | `document-only` |
| 风险等级 | High: workflow semantics, permission model, and audit behavior are unknown |
| 后续 story 影响 | Requires spike/live verification before v1.3.0 approval command story; not ready for feature development |

### mr diff

| Field | Value |
| --- | --- |
| endpoint | Candidate only: MR diff/changes endpoint must be confirmed, likely under `/projects/{repoId}/merge_requests/{mrId}/...` |
| auth | `x-yunxiao-token: <PAT>` with repository read permission |
| 必填字段 | Candidate `repoId`, `mrId`; pagination/large-diff parameters unknown |
| 返回关键字段 | Unknown until spike; expected minimum: file path, old/new path, diff hunks, additions/deletions or binary marker |
| 验证方法 | No local implementation; no live verification; use spike/live verification against small and large MRs |
| evidence level | `document-only` |
| 风险等级 | High: large responses, binary files, pagination, truncation, and output-size limits are unknown |
| 后续 story 影响 | Requires spike/live verification before v1.3.0 diff display/export story; not ready for feature development |

### mr commits

| Field | Value |
| --- | --- |
| endpoint | Candidate only: `GET /projects/{repoId}/merge_requests/{mrId}/commits` or equivalent must be confirmed |
| auth | `x-yunxiao-token: <PAT>` with repository read permission |
| 必填字段 | Candidate `repoId`, `mrId`; pagination fields unknown |
| 返回关键字段 | Unknown until spike; expected minimum: commit id/sha, title/message, author, authored/committed time |
| 验证方法 | No local implementation; no live verification; use spike/live verification to confirm endpoint, paging, and field names |
| evidence level | `document-only` |
| 风险等级 | Medium: read-only, but pagination and field names are not confirmed |
| 后续 story 影响 | Requires spike/live verification before v1.3.0 commits listing story; not ready for feature development |

### mr discussions

| Field | Value |
| --- | --- |
| endpoint | Candidate only: MR discussions/notes endpoint must be confirmed and distinguished from simple comments |
| auth | `x-yunxiao-token: <PAT>` with MR read/comment permission |
| 必填字段 | Candidate `repoId`, `mrId`; thread id/body fields unknown for write operations |
| 返回关键字段 | Unknown until spike; expected minimum: discussion id, notes, author, body, resolved state, created time |
| 验证方法 | No local implementation; no live verification; use spike/live verification to distinguish list, create, reply, and resolve semantics |
| evidence level | `document-only` |
| 风险等级 | High: threaded discussion semantics and resolved-state behavior may differ from simple comments |
| 后续 story 影响 | Requires spike/live verification before v1.3.0 discussions command story; not ready for feature development |

## v1.3.0 Planning Decision Matrix

| Capability | Current evidence level | v1.3.0 action |
| --- | --- | --- |
| repo list/view extensions | `script-ready` | Live verification first, then story if fields match |
| mr list/view extensions | `script-ready` | Live verification first, especially `iid`/`id`, pagination, and extended fields |
| mr create extensions | `script-ready` | Controlled live verification first because it mutates remote state |
| mr merge | `document-only` | Spike/live verification required |
| mr comment | `document-only` | Spike/live verification required |
| mr approval | `document-only` | Spike/live verification required |
| mr diff | `document-only` | Spike/live verification required |
| mr commits | `document-only` | Spike/live verification required |
| mr discussions | `document-only` | Spike/live verification required |

## Update Rules

- Do not change any entry to `live-tested` unless the repo records a dated live execution result with endpoint, auth method, request parameters, status, and key response fields.
- If live verification contradicts this ledger, update this file and the affected story before implementation starts.
- If a future story uses this ledger, cite the exact section and carry forward the evidence level in that story's Dev Notes.
