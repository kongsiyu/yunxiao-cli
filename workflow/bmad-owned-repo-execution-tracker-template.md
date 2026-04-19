# BMAD-owned Repo Execution Tracker 模板

> 适用范围：仅 `BMAD-owned projects` 默认使用。
>
> 用途：承接某一执行波次，跟踪 child issues、gating 与 handoff。
>
> 非用途：本模板不是 planning issue，不是单一 story 执行入口，不应带 `start story`。

## 1. 已被 issue 流程验证的规则

- execution tracker 适合作为一个波次容器，而不是重新写一遍规划结论。
- tracker 负责承接 child issues 与 gating 判断，不直接承担开发细节。
- repo 型 tracker 仍需要 `REPO_PATH`，因为它要锚定与 child issues 相同的仓库基线。
- 若 reviewer 发现 scope / routing 问题，应退回 Planner / BMAD Master，而不是直接在 tracker 中扩 scope。

## 2. 当前模板化资产固定约束

- execution tracker 必须指向一个已完成的 planning issue。
- tracker 只总结“当前波次在发生什么”，不重写 story 级别的 AC、实现细节或 reviewer 结论。
- tracker 必须把 child issue 清单、gating、Done When 写成显式字段。
- tracker 可以为后续波次做 handoff，但不应伪装成 `start story` 入口。

## 3. 使用说明

- 必带 `REPO_PATH`。
- 不带 `start story`。
- 主责通常为 BMAD Master / Scrum Master。
- 只有当 planning baseline 已明确后，才创建 tracker。

## 4. 推荐字段

- 来源 planning issue
- 当前波次范围
- child issues
- gating
- blocked / rollback 处理规则
- done when
- reviewer / rework 路由

## 5. 可复制模板

```md
REPO_PATH: {repo abs path}

来源：[{PLANNING_ISSUE}]({planning_issue_link}) 已完成规划结论，现进入 `{wave_name}` 执行波次。

本 issue 作用

- 作为 `BMAD-owned projects` 的 execution tracker，承接当前波次 child issues
- 保持范围严格对齐 planning artifacts，不在 tracker 内直接扩 scope
- 在 child issue 进入终态后，判断下一波次是否可以继续推进

当前波次范围

- `{deliverable_or_story_group}`
- `{deliverable_or_story_group}`
- `{deliverable_or_story_group}`

当前波次 child issue

- Developer issue：`{developer_issue_name}`
- Reviewer issue：`{reviewer_issue_name}`
- 其他必要子任务：`{optional_child_issue}`

gating

- `{gate_rule}`
- `{gate_rule}`
- `{gate_rule}`

blocked / rework 规则

- 若 child issue 因实现问题失败，由 Scrum Master 新建 rework issue，不在 tracker 内直接改 scope
- 若 reviewer 发现的是范围、角色路由或 baseline 问题，退回 Planner / BMAD Master
- 若下游 issue 因基线不可见 blocked，先修复 baseline，再重新派发执行单

权威输入

- `REPO_PATH`
- `{planning_artifact_paths}`
- `{planning_issue_output}`
- `workflow/bmad-owned-repo-baseline-guardrails.md`
- `workflow/story-dev-workflow-single-repo.md`

已被 issue 流程验证的规则

- tracker 是波次容器，不是 planning issue 的替身
- tracker 不进入 `start story`
- child issue 的 blocked / done 会反馈到 tracker，再决定是否推进后续波次

当前模板化要求

- 明确写出 child issue 清单、gating、回退路径
- 保持“规划、波次跟踪、单 story 执行”三类职责分离
- 所有 repo 相关 issue 都锚定同一 `REPO_PATH`

Done When

- 当前波次 child issues 已全部进入终态
- 已明确下一步是收口、进入下一波次，还是创建 rework / 复盘 follow-up
- 已在评论中记录波次级摘要，而不是把 story 细节复制回 tracker
```

## 6. 何时不要使用本模板

- 还在做 planning / readiness 设计
- 需要直接开发某个 story
- 只是单个 bugfix / 文档修订，不需要独立波次容器
