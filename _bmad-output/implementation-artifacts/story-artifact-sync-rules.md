# Story 工件状态同步规则

**Status**: active  
**Applies to**: BMAD story files, `_bmad-output/implementation-artifacts/sprint-status.yaml`, story handoff/review evidence  
**Created**: 2026-04-19  
**Source Story**: 13.1 Story 工件状态同步规则与 foundation-only 标记

---

## 目的

本规则用于防止 story 文件、任务勾选、Dev Agent Record、File List 与 `sprint-status.yaml` 再次出现状态漂移。任何 story 进入 `done` 前，都必须把“实际交付状态”同步到所有 BMAD 工件投影。

## Done 前关闭检查

Story 标记 `done` 前，Developer 或 Reviewer 必须确认以下项目已同步：

- story 文件头 `Status` 与实际状态一致。
- Tasks/Subtasks 全部按真实完成情况勾选；未完成项不得因 story 关闭而假勾选。
- Dev Agent Record 记录实际执行、测试、审查、残余风险和重要决策。
- File List 覆盖本 story 新增、修改、删除的全部文件。
- Change Log 记录本次 story 创建、实现、审查、关闭的关键状态变化。
- `sprint-status.yaml` 中对应 story key 与 story 文件头 `Status` 一致。

若任一项缺失，story 不得进入 `done`。若确认为文档/治理类 story 且没有运行时代码变更，File List 仍必须列出变更的文档、模板、测试或工作流文件。

## Delivery Scope 标记

每个 story 文件应包含 `Delivery Scope` 区块，用于区分完整用户可见交付与仅基础设施交付。

推荐格式：

```markdown
## Delivery Scope

**Delivery Type**: full | foundation-only | documentation-only | spike
**User-visible Rollout Follow-up**: <story id/key or "N/A">
**Scope Notes**: <one or two concrete notes>
```

### `foundation-only`

当 story 只完成基础设施但未完成 user-visible rollout 时，必须使用 `foundation-only`：

- `Delivery Type` 必须写为 `foundation-only`。
- `User-visible Rollout Follow-up` 必须列出后续 user-visible rollout story，例如 `11.2 高频命令人类可读输出中文化 rollout`。
- Completion Notes 必须说明哪些基础设施已完成、哪些用户可见行为未完成。
- `done` 只代表本 story 定义内的 foundation 完成，不代表用户可见 rollout 完成。

若没有后续 rollout story，必须写 `N/A - no user-visible rollout required` 并说明原因。

## 冲突裁决规则

当 story 文件与 `sprint-status.yaml`、复盘记录、发布证据或 PR 状态冲突时，按以下优先级裁决：

1. release evidence：发布前验收、release checklist、tag/package/smoke 证据。
2. merged PR：已合并 PR 的 diff、commit、CI 结果和 PR review 结论。
3. final review：最终代码审查或验收评论。
4. local story/sprint marker：story 文件头、任务勾选、`sprint-status.yaml` 当前值。

裁决后必须回写低置信源：

- release evidence 或 merged PR 证明已完成时，必须回写 story 文件头 `Status`、Tasks/Subtasks、Dev Agent Record、File List 和 `sprint-status.yaml`。
- final review 证明仍有阻断项时，必须把 story 文件和 `sprint-status.yaml` 回退到 `in-progress` 或 `review`，并记录未完成项。
- 若只能确认 foundation 完成，必须加 `foundation-only` 标记并指向 user-visible rollout 后续 story。

禁止只修改 `sprint-status.yaml` 而不回写 story 文件；也禁止只改 story 文件而不更新 sprint 状态。

## SM / Developer Handoff 要求

SM 创建后续 story 时，应把以下检查项保留在 story 模板或 Dev Notes 中：

- 是否需要 `Delivery Scope`，以及默认 Delivery Type。
- 若是 `foundation-only`，后续 user-visible rollout story 是什么。
- 关闭前是否同步 story 文件头 `Status`、Tasks/Subtasks、Dev Agent Record、File List 和 `sprint-status.yaml`。
- 若发现工件冲突，是否已按 release evidence / merged PR / final review 裁决并回写 story 文件。

Developer 执行 story 时，应在 Dev Agent Record 中记录同步动作，而不是只依赖 sprint 状态文件。

## 示例

```markdown
## Delivery Scope

**Delivery Type**: foundation-only
**User-visible Rollout Follow-up**: 11.2 高频命令人类可读输出中文化 rollout
**Scope Notes**: i18n detector/config/translation loading 已完成；auth、whoami、project list 等命令的人类可读输出迁移留给 11.2。
```

```markdown
### Artifact Sync Closeout

- [x] story 文件头 `Status` 与实际状态一致
- [x] Tasks/Subtasks 勾选与实际完成项一致
- [x] Dev Agent Record 记录实现、测试、审查和残余风险
- [x] File List 覆盖全部新增/修改/删除文件
- [x] `sprint-status.yaml` 中 story key 已同步
```
