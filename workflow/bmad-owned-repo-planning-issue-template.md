# BMAD-owned Repo 规划 Issue 模板

> 适用范围：仅 `BMAD-owned projects` 默认使用。
>
> 用途：为 repo 型 BMAD 项目定义 planning / readiness / wave 设计蓝图。
>
> 非用途：本模板不是 execution tracker，不是独立 story 执行单，不应带 `start story`。

## 1. 已被 issue 流程验证的规则

- `规划 issue -> execution tracker -> 独立执行单` 的分层结构可运行，三者职责不能混写。
- `REPO_PATH` 对 repo 型 planning issue 是必填，因为 assignee 需要读取仓库内 planning artifacts。
- `bmad-create-story` 是 story 开发前置步骤，因此 planning issue 只负责定义波次与门禁，不直接进入开发。
- Worktree 模式下，若权威 planning artifacts 不在 Developer 可见基线中，后续 `create-story` 会被阻塞。

## 2. 当前模板化资产固定约束

- 只用于 BMAD 团队负责、以仓库文件为主要交付载体的项目。
- planning issue 必须显式声明适用范围、权威输入、首批波次、gating、done when、review 回路。
- planning issue 必须把“已验证规则”和“当前模板固定规则”区分写出，避免把模板说明误写成既成事实。
- planning issue 可以引用 [story-dev-workflow-single-repo.md](./story-dev-workflow-single-repo.md)，但不能改写其 `start story` 触发语义。

## 3. 使用说明

- 必带 `REPO_PATH`。
- 不带 `start story`。
- 主责通常为 Planner；BMAD Master 负责在规划完成后创建 execution tracker 与下游执行单。
- 若项目不满足 `BMAD-owned projects` 条件，应改用更轻量的项目编排方式，而不是强套本模板。

## 4. 推荐字段

- 项目目标与当前阶段
- 范围边界 / 非目标
- 权威输入
- 已验证规则
- 当前模板化要求
- 首批建议波次
- gating 与后续波次推进规则
- 角色路由
- done when
- review 回路

## 5. 可复制模板

```md
REPO_PATH: {repo abs path}

请执行本 repo 型 BMAD 项目的规划 / 模板设计阶段。本 issue 只用于 planning，不进入 execution tracker，也不是 story 执行单，因此不要使用 `start story`。

## 适用范围

- 仅适用于 `BMAD-owned projects`
- 当前样板项目：`{project_name}`
- 不视为全公司统一流程
- 非 BMAD 项目可参考思路，但不默认继承 BMAD issue 结构与角色路由

## 本 issue 目标

- 形成可交给 Scrum Master 继续创建 execution tracker 的实施蓝图
- 明确首批波次、后续波次、gating、done when、review 回路
- 明确 repo 型项目中 `REPO_PATH` / `start story` 的使用边界
- 明确 baseline guardrails，避免 Worktree / 分支基线不可见导致后续 story 阻塞

## 范围边界

- 只做规划 / 模板设计 / readiness 收口，不直接进入开发
- 不在本 issue 中创建 developer 实现结果
- 不在本 issue 中执行 reviewer 验收
- 如需进入 story 开发，后续由独立执行单承接

## 权威输入

- `REPO_PATH`
- `{planning_artifact_paths}`
- `{architecture_or_prd_paths}`
- `{readiness_or_change_proposal_paths}`
- `{historical_issue_evidence}`
- `workflow/story-dev-workflow-single-repo.md`
- `workflow/bmad-owned-repo-baseline-guardrails.md`

## 已被 issue 流程验证的规则

- `规划 issue -> execution tracker -> 独立执行单` 三层分离
- `bmad-create-story` 必须位于开发前
- repo 型 issue 需要 `REPO_PATH`
- Worktree story 依赖 Developer 可见基线，不能依赖主 clone 未提交工件

## 当前模板化要求

- 明确声明“仅 `BMAD-owned projects` 默认使用”
- 区分 planning issue、execution tracker、独立执行单三类职责
- 明确 `REPO_PATH` / `start story` 的使用时机
- 明确 baseline guardrails 中要求先进入可见基线的工件集合

## 首批建议波次

1. `{wave_1_item}`
2. `{wave_1_item}`
3. `{wave_1_item}`

## gating / 后续波次规则

- `{gate_rule}`
- `{gate_rule}`
- `{gate_rule}`

## 角色路由

- Planner：负责规划结论、波次设计、输入工件收口
- BMAD Master / Scrum Master：负责执行编排、tracker 创建、blocked / gating 推进
- Developer：只在独立执行单中执行 `create-story -> 实现 -> 验证 -> PR`
- Reviewer：只在独立验收 issue 中判断是否通过或退回

## Done When

- 已输出可复用 planning 结论或模板蓝图
- 已明确首批波次、后续波次与 gating
- 已说明哪些规则来自现有执行证据，哪些是当前模板化资产要求
- 已给出 Scrum Master 下一步如何创建 execution tracker / 独立执行单

## Review 回路

1. Planner 输出规划结果
2. BMAD Master / 用户确认是否进入实施
3. 由独立 execution tracker 承接当前波次
4. 若后续发现 scope / gating 问题，返回 Planner 更新 planning artifacts，而不是在开发 issue 中临场扩 scope
```

## 6. 何时不要使用本模板

- 纯审批、纯协调、纯评论回复类 issue
- 不依赖 repo 本地文件的事项
- 已经是单一 story 执行任务，应改用独立执行单模板
- 已经进入波次推进，应改用 execution tracker 模板
