# Story 13.2: Codeup evidence ledger

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Delivery Scope

**Delivery Type**: documentation-only  
**User-visible Rollout Follow-up**: N/A - no user-visible CLI rollout required  
**Scope Notes**: 本 Story 交付 Codeup API evidence ledger、v1.3.0 规划门禁与 guardrail 测试，不新增或修改 CLI 用户命令行为。

## Story

As a planner or architect,  
I want a Codeup evidence ledger for candidate APIs,  
so that v1.3.0 feature expansion is based on known evidence levels instead of document-only assumptions.

## Acceptance Criteria

1. **Given** 已有 `_bmad-output/research/codeup-api-verification.md`  
   **When** 创建 evidence ledger  
   **Then** 每个候选 API 记录 endpoint、auth、必填字段、返回关键字段、验证方法、evidence level、风险等级、后续 story 影响

2. **Given** 候选能力未 live-tested  
   **When** 进入 ledger  
   **Then** evidence level 标为 `document-only` 或 `script-ready`，不得直接作为开发 ready 条件

3. **Given** 未来要规划 MR merge/comment/approval/diff/commits/discussions  
   **When** PM/Architect 使用 ledger  
   **Then** 能直接判断哪些能力可以进入 v1.3.0，哪些需要先做 spike

## Tasks / Subtasks

- [x] Task 1: 创建 Codeup evidence ledger (AC: #1, #2, #3)
  - [x] Subtask 1.1: 从 `_bmad-output/research/codeup-api-verification.md` 提取已知 Codeup base/auth/repo/MR 端点证据
  - [x] Subtask 1.2: 纳入已交付 Epic 10 repo/MR list/view/create 的实现与单元测试证据，但不把未 live-tested 能力标为 live-ready
  - [x] Subtask 1.3: 为 MR merge/comment/approval/diff/commits/discussions 建立候选记录，并标明需要 spike 或 live verification

- [x] Task 2: 明确 evidence level 与 v1.3.0 决策规则 (AC: #2, #3)
  - [x] Subtask 2.1: 定义 `document-only`、`script-ready`、`live-tested` 的含义和允许动作
  - [x] Subtask 2.2: 明确未 live-tested 的候选能力不得进入开发 ready，只能进入 spike 或验证脚本准备
  - [x] Subtask 2.3: 为每个候选 API 写出风险等级和后续 story 影响

- [x] Task 3: 添加 ledger guardrail 测试 (AC: #1, #2, #3)
  - [x] Subtask 3.1: 验证 ledger 包含 endpoint、auth、必填字段、返回关键字段、验证方法、evidence level、风险等级、后续 story 影响
  - [x] Subtask 3.2: 验证 v1.3.0 候选能力 merge/comment/approval/diff/commits/discussions 均存在
  - [x] Subtask 3.3: 验证未 live-tested 候选能力只使用 `document-only` 或 `script-ready`

- [x] Task 4: 完成 BMAD 工件同步关闭 (AC: #1, #2, #3)
  - [x] Subtask 4.1: 更新本 story 文件状态、Tasks/Subtasks、Dev Agent Record、File List
  - [x] Subtask 4.2: 更新 `_bmad-output/implementation-artifacts/sprint-status.yaml`
  - [x] Subtask 4.3: 记录测试、代码审查结果和残余风险

## Dev Notes

### 权威输入

- `_bmad-output/planning-artifacts/epics.md`：Epic 13 / Story 13.2 定义、FR44 映射，以及验收标准。
- `_bmad-output/planning-artifacts/prd.md`：v1.2.0 明确只建立 Codeup evidence ledger，不把 MR merge/comment/approval/diff 等高阶能力纳入 v1.2.0 主线。
- `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-19.md`：规定 13.2 是首批 create-story 候选，可与 i18n/release work 并行，且 Codeup 扩展需延后到 v1.3.0 或另行 scope change。
- `_bmad-output/research/codeup-api-verification.md`：现有 Codeup API 验证报告，记录 base URL、`x-yunxiao-token`、repo/MR list/view/create 端点与验证脚本状态。
- `_bmad-output/implementation-artifacts/10-1-codeup-api-verification.md` 至 `10-6-mr-create.md`：Epic 10 已交付 Codeup client、repo/MR 命令和测试模式。
- `_bmad-output/implementation-artifacts/story-artifact-sync-rules.md`：本 story 进入 `done` 前必须同步 story 文件头、Tasks/Subtasks、Dev Agent Record、File List 和 `sprint-status.yaml`。

### Evidence Level 规则

- `document-only`：只有文档、人工说明或推断；不能作为开发 ready 条件，只能进入 spike backlog。
- `script-ready`：已有可执行验证脚本、mock/unit test 或实现路径可验证，但未记录真实 PAT/API live response；不能作为新功能开发 ready 条件，必须先运行 live verification 或单独 spike。
- `live-tested`：已记录真实环境请求、响应状态、关键响应字段和执行日期；可作为 v1.3.0 story ready 输入，但仍需常规需求评审。
- 本 Story 不应创造新的 Codeup endpoint 假设为 ready；ledger 必须把“已实现 CLI mock/unit 覆盖”和“真实 live API 证据”分开记录。

### 已有实现与复用边界

- Codeup API client 在 `src/codeup-api.js`，base URL 为 `https://codeup.aliyuncs.com/api/v3`，认证 Header 为 `x-yunxiao-token`。
- Codeup repo/MR 命令在 `src/commands/repo.js`，目前覆盖 `repo list`、`repo view`、`mr list`、`mr view`、`mr create`。
- Codeup 单元测试在 `test/codeup-api.test.js` 和 `test/repo.test.js`；验证脚本在 `test/spike-codeup-api.js`。
- 本 Story 是 documentation-only，不应修改 `src/` 命令行为，不应新增 v1.3.0 Codeup 命令。

### Project Structure Notes

- Evidence ledger 建议放在 `_bmad-output/research/codeup-evidence-ledger.md`，与原始 API 验证报告同目录，便于 PM/Architect 在后续 v1.3.0 规划读取。
- Guardrail 测试放在 `test/codeup-evidence-ledger.test.js`，使用现有 `node:test` 和 `assert`，由 `npm test` 统一执行。
- 不需要新增依赖；项目当前为 ESM、Node >=18、测试命令为 `node --test test/*.test.js`。

### v1.3.0 规划门禁

- MR merge/comment/approval/diff/commits/discussions 必须在 ledger 中单独列项，不得被 repo/MR list/view/create 的实现证据继承为 ready。
- 如果候选能力没有 live-tested evidence，后续 story 影响必须写为“先做 spike/live verification”，而不是“可直接开发”。
- 若未来补充 live evidence，必须记录 endpoint、auth、必填字段、返回关键字段、验证方法、执行日期、风险变化和影响的后续 story。

### Testing Requirements

- `npm test` 必须通过。
- 新增 guardrail 测试必须至少覆盖：
  - ledger 的必填列/字段齐全；
  - repo/MR 已知端点与未来候选能力均存在；
  - future MR merge/comment/approval/diff/commits/discussions 行的 evidence level 只能是 `document-only` 或 `script-ready`，且包含 spike/live verification 影响。

### Previous Story Intelligence

- Story 13.1 已建立 `Delivery Scope` 与 `Artifact Sync Closeout`，本 story 必须沿用。
- Story 13.1 的测试模式是读取 markdown 规则文档并断言关键 marker；本 story 可复用同一 guardrail 风格，避免引入重型 markdown parser。
- Story 13.1 明确禁止 story 完成时只改 `sprint-status.yaml`，必须同步 story 文件本身与 Dev Agent Record。

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

- 2026-04-19: Story 13.2 由 BMAD Developer 在 worktree `story/13-2-codeup-evidence-ledger` 中创建，基于 `origin/story/13-1-story-artifact-sync-rules`。
- 2026-04-19: Story 状态进入 `in-progress`；`sprint-status.yaml` 同步为 `in-progress`。
- 2026-04-19: `node --test test/codeup-evidence-ledger.test.js` red phase 失败，确认 ledger 尚未创建。
- 2026-04-19: 创建 `_bmad-output/research/codeup-evidence-ledger.md`；focused guardrail test 通过。
- 2026-04-19: `npm test` 首次失败，原因是 worktree 缺少 `node_modules`；执行 `npm install` 后重跑通过。
- 2026-04-19: `npm test` 通过，301 个测试全部通过。
- 2026-04-19: Story 状态更新为 `review`；`sprint-status.yaml` 同步为 `review`。
- 2026-04-19: BMAD code review 本地执行，结论 clean review；Story 状态更新为 `done`，`sprint-status.yaml` 同步为 `done`。

### Completion Notes List

- [x] 新增 `_bmad-output/research/codeup-evidence-ledger.md`，记录 repo/MR 已交付 API 与 v1.3.0 候选能力的 endpoint、auth、必填字段、返回关键字段、验证方法、evidence level、风险等级和后续 story 影响。
- [x] 明确 `document-only`、`script-ready`、`live-tested` 定义；未 live-tested 能力不得作为开发 ready 条件。
- [x] 将 MR merge/comment/approval/diff/commits/discussions 标为 v1.3.0 候选能力，并要求先做 spike/live verification。
- [x] 新增 `test/codeup-evidence-ledger.test.js`，守住 ledger 必填字段、已交付 API 证据和未来候选能力非 ready 约束。
- [x] Focused guardrail test 已通过：`node --test test/codeup-evidence-ledger.test.js`。
- [x] Full unit suite 已通过：`npm test`，301 个测试全部通过。
- [x] 代码审查完成：未发现必须修复项，AC1-AC3 与 guardrail test 对齐。

### File List

- `_bmad-output/implementation-artifacts/13-2-codeup-evidence-ledger.md` - Story 13.2 工件与执行记录。
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - 更新 Story 13.2 执行状态。
- `_bmad-output/research/codeup-evidence-ledger.md` - 新增 Codeup API evidence ledger。
- `test/codeup-evidence-ledger.test.js` - 新增 ledger guardrail 测试。

### Change Log

- 2026-04-19: 创建 Story 13.2，状态 `ready-for-dev`。
- 2026-04-19: 开始实现，状态更新为 `in-progress`。
- 2026-04-19: 完成 Codeup evidence ledger 与 guardrail 测试实现。
- 2026-04-19: 单元测试通过，Story 进入 `review`。
- 2026-04-19: 代码审查通过，Story 进入 `done`。
