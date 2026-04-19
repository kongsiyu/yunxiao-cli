# Story 11.1: i18n 缺口审计与 rollout 范围锁定

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Delivery Scope

**Delivery Type**: documentation-only
**User-visible Rollout Follow-up**: `11-2-high-frequency-i18n-rollout`; `11-3-readme-skill-i18n-boundaries`
**Scope Notes**: 本 Story 只交付 i18n coverage matrix、v1.2.0 高频命令 rollout 范围锁定和 machine-contract 边界说明；不直接修改 CLI 用户可见行为或 `--json` schema。

## Story

As a product owner,  
I want a concrete audit of i18n coverage and a locked rollout scope,  
so that v1.2.0 can deliver visible Chinese UX without expanding into unbounded full-CLI localization.

## Acceptance Criteria

1. **Given** 当前 i18n foundation 已存在  
   **When** 审计 `src/output.js`、`src/errors.js`、`src/commands/*.js`、`translations/zh.json` 和 README/SKILL  
   **Then** 输出一份 i18n coverage matrix，列出已接入、未接入、v1.2.0 必须接入和后置项

2. **Given** v1.2.0 scope 已确认  
   **When** 锁定 rollout 范围  
   **Then** 高频命令范围固定为 `auth`、`whoami`、`project list`、`wi list/view/update`、`sprint list/view`

3. **Given** `--json` 模式  
   **When** 设计 i18n rollout  
   **Then** 明确 JSON 字段名保持英文，stdout 只输出纯 JSON，翻译不改变 machine contract

4. **Given** 审计完成  
   **When** 准备交付  
   **Then** 生成 `_bmad-output/implementation-artifacts/11-1-i18n-audit-rollout-scope.md` 并更新本 story 的 Task/Subtask 勾选

## Tasks / Subtasks

- [x] Task 1: 审计当前 i18n foundation 与命令/文档覆盖面 (AC: #1, #3)
  - [x] Subtask 1.1: 盘点 `src/i18n`、`src/config.js`、`src/index.js`、`src/output.js`、`src/errors.js` 与 `translations/zh.json` 的当前接入点
  - [x] Subtask 1.2: 审计 `auth`、`whoami`、`project list`、`wi list/view/update`、`sprint list/view` 以及 README/SKILL 的当前本地化状态和 hard-coded 文本
  - [x] Subtask 1.3: 明确 `--json`/stdout/stderr/`ERROR_CODE` 的稳定 machine contract 边界与当前风险

- [x] Task 2: 产出 i18n coverage matrix 与 v1.2.0 rollout scope 决策 (AC: #1, #2, #3)
  - [x] Subtask 2.1: 给出已接入、未接入、v1.2.0 必须接入和后置项矩阵
  - [x] Subtask 2.2: 锁定高频命令范围为 `auth`、`whoami`、`project list`、`wi list/view/update`、`sprint list/view`
  - [x] Subtask 2.3: 明确 `--json` 字段名保持英文、stdout 纯 JSON、stderr/错误消息不污染 machine contract

- [x] Task 3: 固化交付物与 guardrail test (AC: #4)
  - [x] Subtask 3.1: 在 Story 11.1 工件中记录 audit 结论、后续 rollout stories 和已知边界
  - [x] Subtask 3.2: 增加测试验证 audit 文档包含范围锁定和 machine-contract guardrail

## Dev Notes

### 权威输入

- `_bmad-output/planning-artifacts/epics.md`：Epic 11 / Story 11.1 的故事定义、验收标准和 FR39、FR40 映射。
- `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-19.md`：v1.2.0 readiness 结论，明确 `11.1` 是首批 create-story 候选，且必须先锁定 scope 再进行 `11.2` rollout。
- `_bmad-output/planning-artifacts/prd.md`：v1.2.0 目标是“可用性收口 + AI workflow 契约加固版本”；要求高频命令中文化但不破坏 `--json`/stdout/stderr 合同。
- `translations/zh.json`：当前已有的中文 key inventory，是 coverage matrix 的基础证据之一。
- `_bmad-output/implementation-artifacts/9-6-i18n-chinese.md`：说明 9.6 已交付 i18n foundation，但未完成全量字符串迁移，不能误判为中文体验已完成。
- `_bmad-output/implementation-artifacts/story-artifact-sync-rules.md`：关闭本 Story 前必须同步 `Status`、Tasks/Subtasks、Dev Agent Record、File List 与 `sprint-status.yaml`。

### 技术约束

- 本 Story 是 audit/scope-lock，不直接修改 CLI 用户可见行为，不新增命令，不修改 `src/` 运行逻辑和 schema。
- `--json` 现有 contract 必须保持：字段名不翻译、stdout 只输出纯 JSON、错误消息写 stderr、错误码保持 `ERROR_CODE` 枚举。
- 高频中文化 rollout 只覆盖 human-readable 输出；不承诺 v1.2.0 完成全 CLI 本地化。
- `auth` 与 `whoami` 不应在本 Story 中新增新的 JSON contract；如后续需要补齐，必须单独评估 AI workflow 影响。

### 当前代码基线

- i18n foundation 已接入 `src/i18n/index.js`、`src/i18n/detector.js`、`src/config.js`、`src/index.js`，语言检测优先级为 `config > locale > en`。
- `translations/zh.json` 已包含部分通用表头、认证错误、少量 workitem/sprint/pipeline key，但大多数高频命令 human-readable 输出仍为 hard-coded 文本。
- `src/output.js` 和 `src/errors.js` 是 machine-contract guardrail 的当前落点：`printJson()` 写 stdout，`printError()` 写 stderr，`ERROR_CODE` 枚举稳定。
- `whoami` 位于 `src/index.js`，不是 `src/commands/` 目录；审计时必须单独处理。
- README / SKILL 已记录 `--json` 纯 JSON 约束，但尚未锁定 i18n rollout 范围或说明哪些命令只做人类可读中文化。

### Project Structure Notes

- Story 交付物就是 `_bmad-output/implementation-artifacts/11-1-i18n-audit-rollout-scope.md` 本身；最终 audit matrix 与 scope 结论应记录在本 Story 的 `Dev Agent Record`。
- 高频命令代码位置：
  - `auth`：`src/commands/auth.js`
  - `whoami`：`src/index.js`
  - `project list`：`src/commands/project.js`
  - `wi list/view/update`：`src/commands/workitem.js`
  - `sprint list/view`：`src/commands/sprint.js`
- 后置命令仍需在 matrix 中明确标记，包括 `project view`、`wi create/delete/comment/comments/types`、`user list/search`、`status list`、`pipeline*`、`repo*`、`mr*`。

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 11.1]
- [Source: _bmad-output/planning-artifacts/implementation-readiness-report-2026-04-19.md#Dependency Analysis]
- [Source: _bmad-output/planning-artifacts/prd.md#Epic 11]
- [Source: _bmad-output/planning-artifacts/prd.md#Output Formats]
- [Source: _bmad-output/implementation-artifacts/9-6-i18n-chinese.md]
- [Source: _bmad-output/implementation-artifacts/story-artifact-sync-rules.md]
- [Source: src/i18n/index.js]
- [Source: src/output.js]
- [Source: src/errors.js]
- [Source: src/commands/auth.js]
- [Source: src/commands/project.js]
- [Source: src/commands/workitem.js]
- [Source: src/commands/sprint.js]
- [Source: README.md]
- [Source: SKILL.md]

## Artifact Sync Closeout

- [x] story 文件头 `Status` 与实际状态一致
- [x] Tasks/Subtasks 勾选与实际完成项一致
- [x] Dev Agent Record 记录实现、测试、审查和残余风险
- [x] File List 覆盖全部新增/修改/删除文件
- [x] `sprint-status.yaml` 中 story key 已同步
- [x] 若 Delivery Type 为 Foundation-only，已填写 User-visible Rollout Follow-up

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-04-20: Story 11.1 在 worktree `story/11-1-i18n-audit-rollout-scope` 中创建，基于 `story/13-1-story-artifact-sync-rules` 作为未合并依赖基点。
- 2026-04-20: `sprint-status.yaml` 已同步为 `epic-11: in-progress`、`11-1-i18n-audit-rollout-scope: in-progress`。
- 2026-04-20: 完成 `src/i18n`、`src/output.js`、`src/errors.js`、`src/index.js`、`src/commands/*.js`、`translations/zh.json`、README、SKILL 的证据式审计，锁定高频 rollout 范围和 machine-contract 边界。
- 2026-04-20: 新增 `test/i18n-audit-scope.test.js` 守住 Story 11.1 审计产物中的固定 rollout 范围和 machine-contract guardrail。
- 2026-04-20: `node --test test/i18n-audit-scope.test.js` 通过；`npm test` 在安装锁定依赖后通过，300 个测试全部通过。
- 2026-04-20: 本地代码审查完成，未发现需要修复的实现缺陷；Story 与 `sprint-status.yaml` 已同步为 `done`。

### Completion Notes List

#### i18n Coverage Matrix

| 审计类别 | Surface | 当前状态 | 证据 | v1.2.0 决策 |
| --- | --- | --- | --- | --- |
| 已接入 | `src/i18n/index.js` + `src/i18n/detector.js` + `src/config.js` + `src/index.js` | 已形成基础设施：支持 `language` 配置、locale 检测、`translations/<lang>.json` 加载与 fallback | `src/i18n/index.js`; `src/i18n/detector.js`; `src/config.js:46`; `src/index.js:26-28` | 保持为 foundation，不在 11.1 改代码 |
| 已接入 | `translations/zh.json` | 已有通用 header/error/部分命令 key inventory，但多数未被运行时代码消费 | `translations/zh.json` | 作为 11.2 rollout 的翻译库存起点 |
| 已接入 | `test/i18n.test.js` | 已验证语言检测、fallback 和若干 key 的静态可用性 | `test/i18n.test.js` | 保持现有测试，11.1 追加审计 guardrail |
| 未接入 | `auth` (`login/status/logout`) | 命令文本主要为 hard-coded 英文；登录 prompt 有中文但不是通过 `t()` 接入；成功/失败/状态文本未消费 `translations/zh.json` 中现有 key | `src/commands/auth.js`; `translations/zh.json` keys `commands.auth.*` | `v1.2.0 必接入`，但只做人类可读输出中文化，不扩展 JSON contract |
| 未接入 | `whoami` | 顶层命令完全 hard-coded 英文；未使用 i18n foundation；当前也没有 `--json` 输出路径 | `src/index.js:73-89` | `v1.2.0 必接入`，仅覆盖 human-readable 输出 |
| 未接入 | `project list` | 列表标题、空态、字段 label 为 hard-coded 英文；`--json` 路径已稳定输出 `{ projects, total }` | `src/commands/project.js:15-42` | `v1.2.0 必接入`，只翻译 human-readable 路径；JSON key 保持英文 |
| 未接入 | `wi list/view/update` | 标题、空态、字段 label、成功提示均为 hard-coded 英文；`wi update` 的 JSON 模式直接返回原始 API 对象 | `src/commands/workitem.js:24-238` | `v1.2.0 必接入`，human-readable 中文化；JSON schema 与 API object 保持不变 |
| 未接入 | `sprint list/view` | 标题、空态、字段 label、统计说明为 hard-coded 英文；`sprint view` 已有稳定 `{ sprint, stats }` JSON 输出 | `src/commands/sprint.js:37-142` | `v1.2.0 必接入`，只翻译 human-readable 路径；JSON key 保持英文 |
| 后置项 | `project view` | 有 human-readable 输出，但不在本次锁定的高频 rollout 列表 | `src/commands/project.js:44-64` | 后置到 `11.3` 文档说明后的后续 story 或 v1.3.0 |
| 后置项 | `wi create/delete/comment/comments/types` | 存在部分中文 key，但命令未消费；且这些命令不在本次固定高频范围 | `src/commands/workitem.js`; `translations/zh.json` keys `commands.wi.*` | 后置，不纳入 v1.2.0 首批 rollout |
| 后置项 | `user list/search`、`status list`、`pipeline *` | human-readable 输出均未接入；其中 pipeline 只有少量未消费的 zh key | `src/commands/query.js`; `src/commands/status.js`; `src/commands/pipeline.js`; `translations/zh.json` keys `commands.pipeline.*` | 后置 |
| 后置项 | `repo *`、`mr *` | Codeup 命令刚在 v1.1.0 建立基线，尚未接入 i18n foundation | `src/commands/repo.js` | 后置到 v1.3.0 / Codeup 扩展阶段 |
| 已锁定边界 | `src/output.js` + `src/errors.js` | `printJson()` 只写 stdout；`printError()` 只写 stderr；`ERROR_CODE` 枚举稳定 | `src/output.js:55-72`; `src/errors.js:1-20` | 不翻译 JSON key、错误码枚举或 stdout machine contract |
| 已锁定边界 | README / SKILL | 已说明 `--json` 纯 JSON / stderr 错误约束，但未声明高频命令中文化边界 | `README.md`; `SKILL.md` | 文档补充后置到 `11-3-readme-skill-i18n-boundaries` |

#### v1.2.0 必接入清单

| 固定 rollout 范围 | 当前缺口 | 11.2 目标 |
| --- | --- | --- |
| `auth` | 登录/状态/登出文本未统一接入 i18n；现有中文 prompt 为 hard-coded | 统一接到 i18n foundation，仅影响人类可读输出 |
| `whoami` | 顶层详情视图全为英文 | 中文化标题和字段 label，不引入混合 JSON 输出 |
| `project list` | 列表标题、空态、字段 label 未本地化 | 中文化列表标题/空态/label，保留 `{ projects, total }` |
| `wi list` | 列表标题、空态、字段 label 未本地化 | 中文化标题/label，保留 `{ items, total }` |
| `wi view` | 详情标题、字段 label 未本地化 | 中文化详情 label，保留原始 API JSON |
| `wi update` | 成功提示和参数错误消息未本地化 | 中文化 success/error 文本，保留 update 后 JSON object |
| `sprint list` | 列表标题、空态、Period label 未本地化 | 中文化标题/label，保留 `{ sprints, total }` |
| `sprint view` | 详情标题、统计标题、提示文本未本地化 | 中文化详情/统计文本，保留 `{ sprint, stats }` |

#### 明确未纳入 v1.2.0 首批 rollout 的后置项

- `project view`
- `wi create`
- `wi delete`
- `wi comment`
- `wi comments`
- `wi types`
- `user list/search`
- `status list`
- `pipeline list/run/status`
- `repo list/view`
- `mr list/view/create`
- README / SKILL 的 i18n 边界补充由 `11-3-readme-skill-i18n-boundaries` 负责

#### Machine-Contract Guardrails

- `--json` 字段名保持英文，不翻译 `projects`、`items`、`sprints`、`stats`、`error`、`code`、`ERROR_CODE` 或 API 原始字段名。
- stdout 纯 JSON 规则保持不变；人类可读提示、版本提示和错误消息继续写入 stderr 或非 `--json` 文本路径。
- 11.2 的中文化只作用于 human-readable 输出，不改变现有 JSON schema、错误码枚举或退出码行为。
- `auth` 和 `whoami` 当前没有稳定 JSON contract；11.2 只做文本中文化，不在 v1.2.0 引入新的机器契约。
- `translations/zh.json` 中已存在但未消费的 key 不能被视为“已交付中文体验”，只有运行时代码真正调用 i18n foundation 才算接入。

- [x] 交付 `_bmad-output/implementation-artifacts/11-1-i18n-audit-rollout-scope.md`，包含 coverage matrix、固定 rollout 范围和 machine-contract guardrail。
- [x] 新增 `test/i18n-audit-scope.test.js`，验证 Story 11.1 文档持续包含高频命令范围和 JSON/stderr 边界。
- [x] Focused 审计测试通过：`node --test test/i18n-audit-scope.test.js`。
- [x] Full unit suite 通过：`npm test`，300 个测试全部通过。
- [x] 本地代码审查完成：文档、测试和 sprint 状态同步一致，未发现需要新增 patch 的问题。

### File List

- `_bmad-output/implementation-artifacts/11-1-i18n-audit-rollout-scope.md` - Story 11.1 工件，记录 i18n coverage matrix、范围锁定和 machine-contract guardrail。
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - 更新 Epic 11 / Story 11.1 执行状态至 `done`。
- `test/i18n-audit-scope.test.js` - 新增 Story 11.1 审计范围 guardrail 测试。

### Change Log

- 2026-04-20: 创建 Story 11.1，状态 `ready-for-dev`。
- 2026-04-20: 进入 `in-progress`，完成 i18n coverage audit 与 v1.2.0 rollout 范围锁定。
- 2026-04-20: focused 审计测试与 full unit suite 通过，Story 进入 `review`。
- 2026-04-20: 代码审查通过，Story 与 `sprint-status.yaml` 同步为 `done`。
