# BMAD-owned Repo 独立执行单模板

> 适用范围：仅 `BMAD-owned projects` 默认使用。
>
> 用途：为单一 story 创建独立执行单，进入 `create-story -> 实现 -> 验证 -> PR -> review` 闭环。
>
> 非用途：本模板不是 planning issue，不是 execution tracker。

## 1. 已被 issue 流程验证的规则

- repo 型独立执行单必须同时携带 `REPO_PATH` 与 canonical `start story` 命令。
- `start story` 的语法、默认值、可选步骤、确认模式、跨会话接力格式均以 [story-dev-workflow-single-repo.md](./story-dev-workflow-single-repo.md) 为唯一规范源。
- `start story` 的含义是“进入 [story-dev-workflow-single-repo.md](./story-dev-workflow-single-repo.md)”，不是“直接开始编码”。
- `bmad-create-story` 必须先于实现发生，且 Story 编号必须已经存在于 `epics.md` / `sprint-status.yaml`。
- Worktree 模式只有在 baseline guardrails 已满足时才能启用。

## 2. 当前模板化资产固定约束

- 独立执行单只服务一个 story，不混入多个 story 或规划类事项。
- issue 必须显式写出权威输入、可选步骤、阻塞条件、完成标准。
- 若是 repo 级文档任务、tracker 任务或 planning 任务，不应误用本模板。
- 若执行过程中 blocked，必须回填可恢复的接力上下文，而不是只写“失败了”。

## 3. 使用前检查

- `epics.md` 已存在对应 Story 编号。
- `sprint-status.yaml` 已存在该 Story 的 `backlog` 或 `ready-for-dev` 状态。
- Story 所需 planning artifacts、workflow 文档、baseline guardrails 已在 Developer 可见基线中。
- 该任务确实是“一个 story 的完整执行”，而不是 repo 级实现波次。

## 4. 触发约定

- 必带 `REPO_PATH`。
- 必带 canonical 启动命令：`start story <epic>-<story> [单元测试|代码审查|编译验证|Worktree模式] [全部跳过|AI判断|全部确认]`。
- 可选步骤、确认模式、默认值、恢复格式只引用 [story-dev-workflow-single-repo.md](./story-dev-workflow-single-repo.md)，本模板不另行定义。
- `start story` 只应出现在独立执行单中，不应出现在 planning issue / execution tracker 中。

## 5. 可复制模板

````md
REPO_PATH: {repo abs path}

start story {epic}-{story} {optional_steps} {confirmation_mode}

---

请执行 Story `{epic}-{story}`。本 issue 是独立执行单，按 `workflow/story-dev-workflow-single-repo.md` 执行；该文件是 single-repo story 执行的唯一规范源。`start story` 仅表示进入该工作流，不表示可以跳过 `bmad-create-story` 直接开始编码。

Story 来源

- `_bmad-output/planning-artifacts/epics.md`：`{story_reference}`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`：`{story_status_reference}`
- 如已存在 story 文件：`{story_markdown_path}`

权威输入

- `REPO_PATH`
- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `{related_prd_or_architecture_paths}`
- `{related_readiness_or_change_docs}`
- `workflow/story-dev-workflow-single-repo.md`
- `workflow/bmad-owned-repo-baseline-guardrails.md`

执行要求

- 严格遵循 `workflow/story-dev-workflow-single-repo.md`
- 先执行 `bmad-create-story`，再进入实现 / 验证 / PR
- 若启动命令包含 `Worktree模式`，必须先在 workflow step 1 创建 worktree，再执行 story 创建、实现、验证或审查
- 若选用 `Worktree模式`，必须保证所需 planning artifacts 已在目标基线或明确基点分支中可见
- 若启用 `单元测试` / `编译验证` / `代码审查`，必须在 issue 评论中回填结果
- PR 创建失败时，不得跳过，必须标记 blocked 并附错误信息

阻塞条件

- Story 对应权威输入在当前基线不可见
- 前置 gating story 尚未完成
- `REPO_PATH`、分支或 Worktree 基点不明确
- GitHub PR 无法创建

完成标准

- 已完成 `bmad-create-story`
- 已完成实现与必要验证
- 已创建 GitHub PR
- 已回填变更文件、验证方式、PR 链接
- 已更新必要的 story / sprint 状态回写

Blocked 时必须回填

```text
BLOCKED at step <N>: <reason>

To resume, comment with: start story {epic}-{story} -- resume from step <N>
BACKEND_ROOT_ABS=<abs path>
BRANCH=<branch name>
WORKTREE_MODE=<true|false>
```
````

## 6. 何时不要使用本模板

- repo 级文档实现、模板落地、架构整理等非 story 事项
- execution tracker
- planning / readiness / PRD / epics 设计任务
- 多个 story 混合交付的波次任务
