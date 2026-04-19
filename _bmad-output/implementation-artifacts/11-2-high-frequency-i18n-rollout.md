# Story 11.2: 高频命令人类可读输出中文化 rollout

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Delivery Scope

**Delivery Type**: full
**User-visible Rollout Follow-up**: `11-3-readme-skill-i18n-boundaries`
**Scope Notes**: 本 Story 交付 `auth`、`whoami`、`project list`、`wi list/view/update`、`sprint list/view` 的人类可读中文输出与对应测试；不扩展到其他命令，不修改 `--json` schema、stdout JSON 纯净性或 `ERROR_CODE` 枚举。

## Story

As a Chinese-speaking user,  
I want high-frequency command output and errors to be readable in Chinese,  
so that the CLI provides visible localization value while keeping AI JSON contracts stable.

## Acceptance Criteria

1. **Given** 用户配置 `language: zh` 或系统 locale 为中文  
   **When** 执行 `auth`、`whoami`、`project list`、`wi list/view/update`、`sprint list/view`  
   **Then** human-readable 标题、表头、成功提示和常见错误 message 使用中文

2. **Given** 用户未配置中文且系统 locale 非中文  
   **When** 执行同一批命令  
   **Then** 默认英文行为保持不变

3. **Given** 执行任意已覆盖命令的 `--json` 模式  
   **When** 命令成功或失败  
   **Then** stdout JSON 字段名和错误码保持英文，stderr/错误 message 可本地化但不污染 stdout

4. **Given** 翻译 key 缺失  
   **When** 命令运行  
   **Then** 回退英文 fallback，不抛出运行时错误

## Tasks / Subtasks

- [x] Task 1: 为高频命令接入 i18n human-readable 文本并保持英文默认行为 (AC: #1, #2, #4)
  - [x] Subtask 1.1: 在 `src/commands/auth.js` 中将登录、认证状态、登出的人类可读标题、提示、成功文案和常见错误文本接入 `t()`，同时保留交互流程和非中文默认英文 fallback
  - [x] Subtask 1.2: 在 `src/index.js` 的 `whoami` 命令中接入 i18n 文本，仅本地化 human-readable 标题与字段 label，不新增 `--json` contract
  - [x] Subtask 1.3: 在 `src/commands/project.js`、`src/commands/workitem.js`、`src/commands/sprint.js` 的既定范围内接入 `t()`，覆盖列表/详情标题、表头/字段 label、空态、成功提示与常见参数错误消息
  - [x] Subtask 1.4: 扩充 `translations/zh.json`，补齐 Story 11.2 范围需要的 key；实现必须始终传入英文 fallback，确保缺 key 时稳定回退

- [x] Task 2: 守住 machine contract 与输出边界 (AC: #2, #3, #4)
  - [x] Subtask 2.1: 确认 `printJson()` / `printError()` 调用路径不变，`--json` stdout 仍只输出英文字段 JSON，`ERROR_CODE` 与 schema 不翻译
  - [x] Subtask 2.2: 仅本地化 human-readable 路径，不把中文提示写入 `--json` stdout；必要时仅允许 localized message 出现在 stderr 或普通文本路径
  - [x] Subtask 2.3: 保持未纳入范围命令完全不变，不扩大到 `project view`、`wi create/delete/comment/comments/types`、`pipeline*`、`repo*`、`mr*`、README、SKILL

- [x] Task 3: 为中文化 rollout 增加回归测试并完成故事工件同步 (AC: #1, #2, #3, #4)
  - [x] Subtask 3.1: 新增或扩展命令级测试，覆盖中文 locale / 英文 fallback / `--json` contract 三类路径，优先验证 `auth`、`whoami`、`project list`、`wi list/view/update`、`sprint list/view`
  - [x] Subtask 3.2: 运行 Story 要求的单元测试与现有全量 `npm test`，修复回归后再勾选任务
  - [x] Subtask 3.3: 完成 `Dev Agent Record`、`File List`、`Change Log` 与 `sprint-status.yaml` 同步，确保 Story 关闭前与实际实现一致

## Dev Notes

### 权威输入

- `_bmad-output/planning-artifacts/epics.md`：Epic 11 / Story 11.2 的故事定义、验收标准与 FR36、FR40、FR41 映射。
- `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-19.md`：明确 `11.2` 在 `11.1` scope lock 之后才可进入 create-story / dev，且 i18n rollout 只应覆盖高频命令。
- `_bmad-output/planning-artifacts/prd.md`：v1.2.0 是“可用性收口 + AI workflow 契约加固版本”，要求 human-readable 中文化但不破坏 stdout/stderr/JSON 契约。
- `_bmad-output/implementation-artifacts/11-1-i18n-audit-rollout-scope.md`：这是本 Story 的直接前置物，锁定了必接入命令范围、后置项和 machine-contract guardrail。
- `translations/zh.json`：当前中文 key inventory；本 Story 要在其基础上补齐缺失 key，并依赖 fallback 机制避免运行时错误。
- `_bmad-output/implementation-artifacts/story-artifact-sync-rules.md`：完成 Story 前必须同步 story 文件字段和 `sprint-status.yaml`。

### 前序 Story Intelligence

- Story 11.1 已明确：`11.2` 只能覆盖 `auth`、`whoami`、`project list`、`wi list/view/update`、`sprint list/view`。任何新增命令范围都属于越界。
- Story 11.1 已明确：`auth` 与 `whoami` 当前没有稳定 JSON contract。本 Story 不应为它们新增新的 `--json` 输出协议，只做人类可读文本中文化。
- Story 11.1 已明确：`project list` 保持 `{ projects, total }`，`wi list` 保持 `{ items, total }`，`wi view/update` 继续返回原始/最新 workitem object，`sprint list` 保持 `{ sprints, total }`，`sprint view` 保持 `{ sprint, stats }`。
- Story 11.1 的 guardrail 测试已经锁定 machine contract 边界；本 Story 需要在代码测试层继续守住这些边界，而不是只依赖文档。

### 技术约束

- `src/i18n/index.js` 当前的 `t(key, fallback)` 机制已经支持 fallback；所有新增调用都必须提供英文 fallback，不能直接依赖 key 文本本身。
- `src/output.js` 的 `printJson()` 和 `printError()` 是 machine-contract 核心。不要修改 JSON key 名、返回 shape、stdout/stderr 分流行为。
- `src/index.js` 在 parse 前调用 `loadConfig()` + `initI18n(config.language)`。中文化逻辑应复用现有初始化，不要新增第二套语言检测流程。
- 仅 human-readable 路径可使用 `chalk` 包装后的中文文本；`--json` 路径必须继续直接调用 `printJson()`.
- 常见错误 message 的中文化只限于本 Story 涉及命令中的本地抛错/本地 `printError()` 文本和 `withErrorHandling` 可消费的 message；不得翻译 `ERROR_CODE` 常量。
- 交互式 `auth login` 已有一条中文 PAT prompt，这是现有行为的一部分；本 Story 需要把其余相关标题、成功/失败提示统一纳入 i18n，而不是保持中英混杂硬编码。

### 代码落点

- `src/commands/auth.js`：`auth login/status/logout` 的标题、提示、成功/错误文本。
- `src/index.js`：`whoami` 顶层命令文本。
- `src/commands/project.js`：仅 `project list` 在本 Story 范围内；`project view` 不在范围内，不要顺手改动。
- `src/commands/workitem.js`：仅 `wi list`、`wi view`、`wi update` 在本 Story 范围内；其他 `wi` 子命令保持不变。
- `src/commands/sprint.js`：`sprint list/view` 的标题、label、统计说明。
- `translations/zh.json`：补齐上述命令使用到的 key。
- 测试文件建议新增专用 i18n command rollout 测试，或在现有命令测试中追加中文 locale / fallback / `--json` 断言；但必须清晰覆盖 Story 11.2 的命令集合和边界。

### 测试要求

- 至少覆盖以下维度：
  - 中文模式下 human-readable 输出出现中文标题、label、空态或成功提示。
  - 英文模式或缺失 key 时，输出仍回退英文 fallback。
  - `--json` 模式下 stdout 仍是稳定英文 JSON key，stderr 错误 JSON 继续保留英文 `code` 字段。
- 优先复用 Node 18 的现有测试策略：
  - 使用 `Command` 构造命令程序，不直接导入 `src/index.js` 做 CLI 端到端。
  - 用 `mock.method(client, 'get'/'post'/'put')` 控制 API 返回。
  - 用 `mock.method(process.stdout, 'write', ...)` / `mock.method(process.stderr, 'write', ...)` 捕获输出。
- `package.json` 中测试入口是 `npm test` => `node --test test/*.test.js`。新增测试文件必须放在 `test/` 根目录并命名为 `*.test.js`。

### Git / Recent Work Intelligence

- 当前执行分支基于 `story/11-1-i18n-audit-rollout-scope`，最近相关提交 `4ca8f3d docs(i18n): audit rollout scope for story 11-1` 已锁定本 Story 的范围和 guardrail。
- 最近的基础性提交 `f2cdb3b docs(bmad): add story artifact sync rules` 说明 Story 文件与 `sprint-status.yaml` 同步是 release gate，不可省略。

### Project Structure Notes

- 本仓库没有单独 `project-context.md`；以现有 Story 工件、PRD、epics、测试文件和 `src/` 结构作为项目约定来源。
- 命令模块普遍通过 `register*Commands(program, client, ...)` 注册；新增 i18n 不应改变这些函数签名，除非确有必要且不引入广泛回归。
- 如果同一文本既用于 normal mode 又可能出现在 `jsonMode` 分支前的参数校验，必须确保 `jsonMode` 分支仍通过 `printError()` 输出到 stderr，而不是 `console.log()`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 11.2]
- [Source: _bmad-output/planning-artifacts/implementation-readiness-report-2026-04-19.md#Dependency Analysis]
- [Source: _bmad-output/planning-artifacts/prd.md#Epic 11]
- [Source: _bmad-output/planning-artifacts/prd.md#Output Formats]
- [Source: _bmad-output/implementation-artifacts/11-1-i18n-audit-rollout-scope.md]
- [Source: _bmad-output/implementation-artifacts/story-artifact-sync-rules.md]
- [Source: src/i18n/index.js]
- [Source: src/output.js]
- [Source: src/errors.js]
- [Source: src/index.js]
- [Source: src/commands/auth.js]
- [Source: src/commands/project.js]
- [Source: src/commands/workitem.js]
- [Source: src/commands/sprint.js]
- [Source: translations/zh.json]
- [Source: test/commands.test.js]
- [Source: test/project.test.js]
- [Source: test/wi-view.test.js]
- [Source: test/wi-update.test.js]
- [Source: test/sprint.test.js]

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

- 2026-04-20: Story 11.2 在 worktree `story/11-2-high-frequency-output-zh-rollout` 中创建，基于 gating 分支 `story/11-1-i18n-audit-rollout-scope` 作为执行基线。
- 2026-04-20: `sprint-status.yaml` 已同步为 `11-2-high-frequency-i18n-rollout: ready-for-dev`，等待按 Story 任务顺序进入实现。
- 2026-04-20: 已为 `auth`、`project list`、`wi list/view/update`、`sprint list/view` 接入 `t()` / `tx()` 驱动的中文 human-readable 文本，并拆出 `src/commands/whoami.js` 便于在不污染 `src/index.js` 入口初始化的前提下测试 `whoami` 本地化。
- 2026-04-20: `translations/zh.json` 已补齐本 Story 范围需要的 key；所有新接入点继续显式传入英文 fallback，缺 key 时回退英文，不抛运行时错误。
- 2026-04-20: 新增 `test/i18n-rollout.test.js`，覆盖 zh human-readable 输出、英文 fallback、`--json` stdout schema 保持英文和 `ERROR_CODE` 不变；扩展 `test/i18n.test.js` 覆盖 `tx()` 占位符插值。
- 2026-04-20: `node --test test/i18n.test.js test/i18n-rollout.test.js` 通过；复用主克隆 `node_modules` 后 `npm test` 全量通过，312 个测试全部通过。
- 2026-04-20: BMAD code review 完成；发现一处 zh human-readable 输出仍使用 `Sprint` 文案，已在 `translations/zh.json` 中改为 `迭代` 并重新通过 focused/full tests。
- 2026-04-20: Story 状态与 `sprint-status.yaml` 已同步为 `done`。

### Completion Notes List

- [x] 高频命令 human-readable 中文化范围按 11.1 锁定执行，仅覆盖 `auth`、`whoami`、`project list`、`wi list/view/update`、`sprint list/view`。
- [x] 保持默认英文行为：所有新增本地化点都通过 `t()` / `tx()` 显式提供英文 fallback。
- [x] 保持 machine contract：`--json` stdout 仍使用英文 key，`ERROR_CODE` 保持英文，不把中文提示写进 JSON stdout。
- [x] 新增 focused rollout 测试与 `tx()` 单元测试，并完成全量 `npm test` 回归验证。
- [x] BMAD code review clean after one internal patch：将 zh-mode 剩余 `Sprint` label 统一收口为 `迭代`，无未决 patch/defer 项。

### File List

- `_bmad-output/implementation-artifacts/11-2-high-frequency-i18n-rollout.md` - Story 11.2 实施规范文件。
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Story 11.2 状态依次同步到 `ready-for-dev`、`review` 与 `done`。
- `src/commands/auth.js` - 本地化 auth 登录、状态、登出的人类可读标题、提示、成功与常见错误文本。
- `src/commands/project.js` - 本地化 `project list` 的空态、统计标题和字段 label，保持 JSON key 不变。
- `src/commands/workitem.js` - 本地化 `wi list/view/update` 的 human-readable 标题、字段 label 与常见参数错误消息，保持 JSON key 不变。
- `src/commands/sprint.js` - 本地化 `sprint list/view` 的标题、周期、统计与截断提示。
- `src/commands/whoami.js` - 新增可测试的 `whoami` 命令模块，负责该命令的人类可读中文输出。
- `src/i18n/index.js` - 新增 `tx()` 占位符插值 helper，便于复用翻译模板并保留英文 fallback。
- `src/index.js` - 改为通过 `registerWhoamiCommand()` 注册 `whoami`，保持入口初始化与错误处理路径不变。
- `translations/zh.json` - 补齐 Story 11.2 rollout 范围需要的中文 key。
- `test/i18n.test.js` - 扩展 `tx()` 插值与 fallback 覆盖。
- `test/i18n-rollout.test.js` - 新增高频命令中文化 focused 回归测试。

### Change Log

- 2026-04-20: 创建 Story 11.2，状态 `ready-for-dev`。
- 2026-04-20: 完成高频命令人类可读中文化 rollout、focused i18n 测试与全量 `npm test` 验证，Story 状态更新为 `review`。
- 2026-04-20: BMAD code review clean after 修复剩余 `Sprint` 文案，Story 状态更新为 `done`。
