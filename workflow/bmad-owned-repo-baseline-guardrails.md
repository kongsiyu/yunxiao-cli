# BMAD-owned Repo Baseline Guardrails

> 适用范围：仅 `BMAD-owned projects` 默认使用。
>
> 用途：在派发 repo 型独立执行单，尤其是 `Worktree模式` 时，确保 Developer 能在目标基线直接读到完整权威输入。

## 1. 触发背景

`HTH-197` 已暴露一个明确问题：当主 clone 中存在未提交 planning artifacts，但 Worktree 是从另一条未包含这些工件的分支切出时，`bmad-create-story` 无法在 worktree 中读取权威输入，流程会在步骤 2 被阻塞。

因此，baseline 可见性不是建议项，而是 repo 型 BMAD story 派发前的固定门禁。

## 2. 已被 issue 流程验证的规则

- `create-story` 依赖 repo 内可见的 planning artifacts，而不是操作者“本地心里知道哪些文件存在”。
- Worktree 与主 clone 不共享未提交改动，不能把主 clone 的工作副本视为权威输入来源。
- repo 型 story issue 若使用 `Worktree模式`，必须先确认目标基线分支已包含完整权威输入。

## 3. 当前模板化资产固定约束

- 只有当 Developer 在目标分支执行 `git checkout` 或 `git worktree add` 后，立即能读取到完整权威输入，才允许派发 repo 型独立执行单。
- planning artifacts、`epics.md`、`sprint-status.yaml`、workflow 文档必须先进入 Developer 可见基线，或 issue 中明确指定一个已包含这些工件的基点分支。
- 不允许依赖主 clone 的未提交文件来支持 Worktree 模式 story。

## 4. Developer 可见基线的最小要求

以下工件至少要满足“在目标基线或明确基点分支中可读”：

- `_bmad-output/planning-artifacts/prd.md` 或等效需求权威输入
- `_bmad-output/planning-artifacts/epics.md`
- 该 story 所引用的 readiness / sprint change / template planning 文档
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `workflow/story-dev-workflow-single-repo.md`
- 本次执行依赖的其他 repo 内 workflow / architecture / context 文档

对模板实现或 repo 级文档任务，同样适用“权威输入必须在可见基线中”的原则，即使该任务不使用 `start story`。

## 5. 明确禁止的做法

- 在主 clone 保留未提交 planning artifacts，同时要求 Developer 去另一份 worktree 执行 `create-story`
- 在 issue 里只写“文件已经在我本地有了”，但不说明这些文件是否已进入目标基线
- 让 Developer 同时混用主 clone 与 worktree 来补齐同一个 story 的权威输入
- 在 planning issue / execution tracker 中默认假设 `start story` 可以绕过 baseline 检查

## 6. 派发前检查清单

在创建 repo 型独立执行单前，至少确认：

1. `epics.md` 中已存在该 Story 编号，且编号稳定。
2. `sprint-status.yaml` 已包含该 Story 的状态占位。
3. Story 引用的 planning artifacts 已提交到目标基线分支，或 issue 中明确写出应从哪条包含这些工件的分支切出。
4. `workflow/story-dev-workflow-single-repo.md` 与相关 repo workflow 文档在目标基线中可见。
5. 若 issue 启用 `Worktree模式`，目标基点分支可以直接被 `git worktree add` 使用，不依赖主 clone 未提交状态。

## 7. 不满足 guardrail 时的处理方式

- 不派发该独立执行单，或立即标记 `blocked`
- 先由 Planner / BMAD Master 把缺失工件落到 Developer 可见基线
- 如确需并行，只能显式指定一个已包含权威工件的共享分支作为基点
- 恢复执行时，issue 评论必须回填可复用的基线信息，例如 `BACKEND_ROOT_ABS`、`BRANCH`、`WORKTREE_MODE`

## 8. 与其他模板的关系

- planning issue 模板负责声明何时需要这些 guardrails
- execution tracker 模板负责在波次层面检查 gating / blocked 是否来自 baseline 问题
- 独立执行单模板负责在实际执行时引用本文件，并把不满足 guardrail 的情况写成显式 blocker

## 9. 一句话判断标准

如果 Developer 进入目标分支后，不能只依赖该分支中的文件完成 `create-story` 所需输入，那么这个 issue 还不具备可执行基线，不应进入 `Worktree模式` 或 story 执行阶段。
