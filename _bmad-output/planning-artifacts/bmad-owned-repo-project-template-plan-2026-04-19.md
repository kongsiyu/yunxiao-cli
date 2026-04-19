# BMAD-owned Repo 项目 planning/execution 模板规划

**日期**：2026-04-19  
**适用范围**：仅适用于 BMAD 团队负责、以仓库为交付主载体的项目  
**来源 issue**：`HTH-202`、`HTH-203`  
**证据基线**：`HTH-195`、`HTH-197`、`HTH-201` 以及本仓库现有 planning / implementation artifacts

## 1. 规划结论

本轮规划的核心结论是：BMAD 团队在 `yunxiao-cli` 上已经验证出一条可复用的 repo 型项目分层流程，但目前沉淀下来的主要是“运行过的 issue 路由与工件协作方式”，还不是一套正式落盘的模板文件集合。

已经被 issue 流程验证过的部分：

- `规划 issue -> readiness / planning artifacts -> 首批 story 排期 -> 独立执行 tracker -> 独立 story 执行单 -> gating 推进后续波次` 这条主链路可运行。
- `bmad-create-story` 必须位于开发之前，且 `sprint-status.yaml` 只有在 story 文件真正生成后才应从 `backlog` 前进。
- 把“排期/规划”与“执行跟踪”拆为两层 issue 是有价值的，能避免规划 issue 被开发细节淹没。
- Worktree 模式下，若权威 planning artifacts 只存在于主 clone 的未提交改动中，`create-story` 会因为读不到同一基线而失效。

已经形成明确模板目标、但还没有在 repo 模板文件层正式落地的部分：

- 标准化的 `规划 issue` / `执行 tracker` / `独立执行单` 文档模板。
- Worktree / baseline guardrails 的固定检查清单与固定 wording。
- 通用 reviewer 验收清单与模板文档级别的 review 回路。
- “仅 BMAD-owned projects 默认启用”的 repo 内显式说明。

因此，BMAD 工作流目前沉淀到了“已验证流程 + 待产品化模板”的阶段，而不是“模板实现已完成”的阶段。

## 2. 已验证证据与可复用规则

| 证据 | 已验证内容 | 模板应吸收的规则 |
|---|---|---|
| `HTH-195` | 规划 issue 可以基于 readiness 结果完成首批 story 排期，并明确 `create-story` 前置约束 | 模板必须把首批波次、gating、后续波次顺序、done when 写成显式字段 |
| `HTH-201` | 独立执行 tracker 适合作为波次容器，承接多个 developer story issue，并监控 gating | 模板必须把 execution tracker 作为 planning issue 的下游容器，而不是把开发进展塞回规划 issue |
| `HTH-197` | Worktree 模式下，若权威输入不在目标基线分支上，`bmad-create-story` 会被阻塞 | 模板必须加入 baseline guardrails，禁止依赖主 clone 未提交工件启动 Worktree 模式 story |
| `workflow/story-dev-workflow-single-repo.md` | `REPO_PATH`、`start story`、`BACKEND_ROOT_ABS`、`WORKTREE_MODE` 的触发语义已明确 | 模板必须区分“谁需要 repo 路径”和“谁需要 story 触发词”，避免在规划/跟踪 issue 中滥用 |
| `implementation-readiness-report-2026-04-19.md` | 当前最稳妥的 handoff 顺序是 `Paperclip issue -> create-story -> 开发/评审路由` | 模板必须把这个顺序写成默认执行约定，而不是可选建议 |

## 3. 适用性规则

### 3.1 默认适用

以下项目默认使用本模板：

- 由 BMAD 团队承担规划、story 准备、开发路由与交付编排的 repo 型项目。
- 代码、BMAD artifacts、交付证据主要以仓库文件形式存在的项目。
- 需要通过 Paperclip issue 分层管理 planning / execution / review 节奏的项目。

### 3.2 不默认适用

以下情况不应直接套用本模板：

- 非 BMAD-owned 项目。
- 不以 repo 作为主要执行载体的事项，例如纯审批、纯协调、非代码型运营任务。
- 无需 `bmad-create-story`、无需 repo 本地工件、无需 Worktree / branch 隔离的轻量请求。
- 仅需一次性修补、没有稳定 planning artifacts 基线的临时事项。

### 3.3 约束声明

- 本模板不是全公司统一流程。
- 非 BMAD 项目可以参考分层思路，但不应默认继承 BMAD 角色路由和触发约定。
- 只有 BMAD-owned projects 才默认采用 `规划 issue + execution tracker + story issue` 这套结构。

## 4. 模板总流程

建议将 BMAD-owned repo 项目的模板流程固定为五段：

1. **规划阶段**：Planner 产出/更新 planning artifacts，定义首批波次、gating、done when、review 回路。
2. **执行编排阶段**：BMAD Master / Scrum Master 创建 execution tracker，并挂载首批独立 story 执行单。
3. **story 执行阶段**：Developer 在独立 issue 中以 `REPO_PATH + start story` 为触发，先 `create-story`，再开发、验证、提交评审。
4. **评审验收阶段**：Reviewer 对 story 级结果、契约、证据和回写完整性做验收，必要时退回 Developer。
5. **波次推进阶段**：BMAD Master 依据 gating 决定是否派发下一批 story，或是否进入 release / acceptance 波次。

这五段中，规划 issue 只负责把“要做什么、先做什么、何时能做”说清楚；execution tracker 只负责“当前波次在发生什么”；独立执行单只负责“一个 story 如何完整落地”。

## 5. 三类模板定义

## 5.1 规划 issue 模板

**目标**

- 形成可交给 Scrum Master 进入开发阶段的实施蓝图。
- 明确首批波次、后续波次、gating、done when、review 回路。
- 明确适用性规则和角色边界。

**推荐责任人**

- 主责：BMAD Planner
- 协作：BMAD Master

**权威输入**

- `REPO_PATH`
- 当前 PRD / epics / architecture 或等效 planning artifacts
- readiness / change proposal / retro 等上游规划结论
- 若已有 execution 经验，必须吸收历史 issue 与评论证据

**必须输出**

- 模板规划文档
- 首批建议波次
- 后续波次 gating
- role routing 规则
- Worktree / baseline guardrails
- 下一阶段实施蓝图

**阻塞条件**

- planning artifacts 不足以支撑 story 分波次
- 适用范围未确认，无法判断是否属于 BMAD-owned project
- 历史执行证据缺失，无法给出 guardrails

**完成标准**

- 已明确“哪些部分已验证、哪些仍是模板目标”
- 已明确 repo 触发约定与 Worktree guardrails
- 已产出 Scrum Master 可继续实施的蓝图

**review 回路**

- 先由 Planner 输出规划结论
- 再由 BMAD Master / 用户确认是否进入模板实现阶段
- 规划 issue 不直接承担开发或 reviewer issue 的创建职责

## 5.2 执行 tracker 模板

**目标**

- 承接一个执行波次，而不是复写规划结论。
- 作为首批 story issue 与后续 gating 的波次容器。

**推荐责任人**

- 主责：BMAD Master / Scrum Master
- 协作：Planner 仅在需要调整范围或 gating 时介入

**权威输入**

- 已完成的规划 issue
- 首批波次列表
- gating 依赖关系
- 对应 story 的权威 planning artifacts

**必须输出**

- 当前波次 child issues 清单
- gating 依赖摘要
- 波次进展评论
- 下一批是否可派发的判断

**阻塞条件**

- child issue 尚未创建
- 下游 story 所需 planning baseline 不可见
- 关键 gating story 尚未完成

**完成标准**

- 当前波次的 story issue 已全部进入终态，或已明确移交下一波次
- gating 已被重新评估，并形成下一步派发建议

**review 回路**

- tracker 评论只做波次级摘要，不重新定义 story 范围
- 若出现跨 story 的新范围变更，返回 Planner 更新 planning artifacts

## 5.3 独立执行单模板

**目标**

- 聚焦单一 story，从 `create-story` 到实现、验证、评审、回写完整闭环。

**推荐责任人**

- 主责：BMAD Developer
- 验收：BMAD Reviewer / Test Architect

**权威输入**

- `REPO_PATH`
- `start story <epic>-<story>` 触发语句
- `epics.md` 对应 story 条目
- 相关 PRD / readiness / sprint-status / workflow 文档

**必须输出**

- `bmad-create-story` 生成的 story 文件
- 实现代码 / 文档 / 测试 / PR / 评论证据
- `sprint-status.yaml` 与 story 工件状态回写
- 若 blocked，必须回填具体阻塞原因与恢复方式

**阻塞条件**

- story 所依赖的 planning artifacts 不在当前可见基线
- gating 前置 story 未完成
- repo / branch / worktree 路径不明确

**完成标准**

- 已完成 `create-story`
- 已按 story 完成实现与验证
- 已回填 PR / 证据 / 状态同步结果
- 已进入 review 或 done

**review 回路**

- Developer 负责把实现与证据交给 Reviewer
- Reviewer 只审“是否符合 story 与模板门禁”，不在 review 阶段改写 story 范围
- 若需改范围，退回 Planner / BMAD Master，而不是在 reviewer 评论中直接扩 scope

## 6. 角色路由规则

| 角色 | 负责内容 | 不负责内容 |
|---|---|---|
| BMAD Master | 编排 issue 结构、创建 tracker、控制波次推进、处理 blocked / gating | 不直接替代 Planner 改规划，不直接替代 Developer 写实现 |
| BMAD Planner | 研究、分析、PRD/架构/epics、模板规划、首批波次与 gate 设计 | 不直接进入开发，不在规划阶段创建 developer/reviewer issue |
| BMAD Developer | `create-story`、实现、测试、工件回写、PR、开发侧评论同步 | 不擅自重排 roadmap，不绕过 planning baseline |
| BMAD Reviewer | 评审 story 结果、契约、证据和回写完整性，决定通过或退回 | 不在评审阶段引入新的产品范围 |

边界规则：

- 任何“要不要做、先做什么、后置什么”的问题，归 Planner / BMAD Master。
- 任何“这一个 story 怎么做完”的问题，归 Developer。
- 任何“做完是否达到 gate”的问题，归 Reviewer。
- 任何跨 wave 的重新排期，都要回到 Planner / BMAD Master，而不是由 Developer / Reviewer 临场决定。

## 7. repo 型 BMAD 项目的触发约定

## 7.1 `REPO_PATH` 何时使用

必须使用 `REPO_PATH` 的场景：

- issue 执行依赖本地仓库文件、分支、worktree、脚本或 planning artifacts。
- assignee 需要在固定 repo 路径内读取或修改文件。
- 任何 repo 型 BMAD 项目的 planning issue 与独立执行单。

通常不需要 `REPO_PATH` 的场景：

- 纯审批、纯评论回复、纯决策型 issue。
- 与仓库文件无关的 board / governance / routing 事项。

## 7.2 `start story` 何时使用

必须使用 `start story <epic>-<story>` 的场景：

- 独立执行单要进入 `workflow/story-dev-workflow-single-repo.md` 或等效 story-dev workflow。
- 跨会话恢复某个 story 的开发链路。

不应使用 `start story` 的场景：

- 规划 issue
- execution tracker
- 多 story 混合执行的 issue
- 还没有在 `epics.md` 中明确 story 编号和权威输入的任务

## 7.3 触发字段决策矩阵

| issue 类型 | `REPO_PATH` | `start story` | 原因 |
|---|---|---|---|
| 规划 issue | 必须带 | 不使用 | 规划阶段需要读取 repo 内 planning artifacts，但不进入单 story 开发工作流 |
| execution tracker | 必须带 | 不使用 | tracker 需要锚定同一个 repo 基线并承接 child issues，但不应伪装成某一个 story 的执行入口 |
| 独立执行单 | 必须带 | 必须带 | 需要既锁定仓库路径，又显式进入 `story-dev-workflow-single-repo.md` 的 story 工作流 |
| 非 repo 型审批 / 治理 / 协调 issue | 通常不带 | 不使用 | 不依赖 repo 本地工件，也不进入 story 开发链路 |

这张矩阵应视为 repo 型 BMAD 项目的默认触发约定，避免把 `start story` 滥用于 planning issue / tracker，也避免遗漏 `REPO_PATH` 导致 assignee 无法定位权威输入。

## 7.4 默认顺序

repo 型 BMAD 项目的默认顺序应固定为：

`Paperclip issue -> REPO_PATH -> start story -> bmad-create-story -> 开发/验证/评审`

不允许把 `start story` 当成“直接开始编码”的同义词。

## 8. Worktree / baseline guardrails

`HTH-197` 已证明：如果 story 所需 planning artifacts 只存在于主 clone 的未提交修改里，而 worktree 是从另一条可见分支切出的，那么 `bmad-create-story` 会读不到权威输入，导致流程在步骤 2 就被阻塞。

因此模板必须固定以下 guardrails。

### 8.1 允许派发 Worktree 模式 story 之前，必须满足的基线条件

以下工件必须已经存在于 Developer 可见的基线分支或明确基点分支上，而不是只存在于另一份工作目录的未提交改动中：

- `_bmad-output/planning-artifacts/prd.md` 或等效需求权威输入
- `_bmad-output/planning-artifacts/epics.md`
- 该 story 引用的 readiness / sprint change / template planning 文档
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- story-dev workflow 所引用的 repo 内工作流文档

判断标准只有一个：**开发者只靠 `git checkout` / `git worktree add` 进入目标分支后，就能读到完整权威输入。**

### 8.2 明确禁止的做法

- 禁止在主 clone 保留未提交 planning artifacts，同时要求 Developer 在另一份 worktree 中执行 `create-story`。
- 禁止把“本地已经有这个文件”视为权威基线。
- 禁止在 execution tracker 或 story issue 中默认假设主 clone 与 worktree 共享未提交输入。

### 8.3 派发前检查清单

在 Scrum Master 派发 story issue 前，至少检查：

1. story 对应的 `epics.md` 条目已存在且编号稳定。
2. `sprint-status.yaml` 已包含该 story 的 backlog 占位。
3. 引用的 planning / readiness / template 文档已提交到目标基线分支，或 story issue 明确指定从哪条包含这些工件的分支切出。
4. 若 issue 启用 Worktree 模式，目标基点分支已可直接被 `git worktree add` 使用。

### 8.4 不满足 guardrail 时的处理方式

- 不创建或不派发 Worktree 模式 story issue。
- 先由 Planner / BMAD Master 将 planning artifacts 落到可见基线，再继续 create-story。
- 如需提前并行，只能明确指定一个已包含权威工件的共享分支作为 worktree 基点，不能依赖本地未提交状态。

## 9. review 回路与 done when 约定

模板建议固定以下 done when / review 约定：

- **规划 issue done when**：模板规划文档已产出，已说明验证边界、角色路由、首批波次、guardrails、下一阶段蓝图。
- **execution tracker done when**：当前波次 child issues 已进入终态，或已完成下一波次 handoff。
- **独立执行单 done when**：story 文件、实现、验证、证据、状态回写已完成，并经 reviewer 接受或完成 review handoff。

模板建议固定以下 review 回路：

1. Planner 产出规划结论。
2. BMAD Master / 用户确认进入实施。
3. Developer 在 story issue 中执行。
4. Reviewer 依据 story、契约与证据验收。
5. 若发现的是实现问题，退回 Developer；若发现的是 scope / gating 问题，退回 Planner / BMAD Master。

## 10. 下一阶段实施蓝图

本 issue 不进入模板文件最终落地，但建议下一阶段至少创建以下 repo 文档 / 模板文件。

| 建议产物 | 建议路径 | 实现责任人 | reviewer 验收重点 |
|---|---|---|---|
| BMAD-owned repo 规划 issue 模板 | `workflow/bmad-owned-repo-planning-issue-template.md` | Planner | 是否完整覆盖目标、输入、首批波次、gating、done when、review 回路 |
| BMAD-owned repo execution tracker 模板 | `workflow/bmad-owned-repo-execution-tracker-template.md` | Planner / BMAD Master | 是否把 tracker 限定为波次容器，而非重新规划 story |
| BMAD-owned repo 独立执行单模板 | `workflow/bmad-owned-repo-story-execution-template.md` | Planner / Developer | 是否固定 `REPO_PATH`、`start story`、输入/输出/阻塞/完成标准 |
| Worktree / baseline guardrails 文档 | `workflow/bmad-owned-repo-baseline-guardrails.md` | Planner / Architect | 是否明确“哪些工件必须先进入可见基线/分支” |
| reviewer 验收清单 | `workflow/bmad-owned-repo-review-checklist.md` | Reviewer / Test Architect | 是否能检查 story 契约、证据、状态回写与 gate 达成情况 |

建议实施顺序：

1. 先落 `baseline guardrails`，因为这是避免再次出现 `HTH-197` 阻塞的前置条件。
2. 再落 `规划 issue` 与 `execution tracker` 模板，固化编排结构。
3. 再落 `独立执行单` 模板与 `review checklist`，固化执行与验收。

## 11. 建议 Scrum Master 接续拆分的开发阶段任务

建议在本规划完成后，由 Scrum Master 进入开发阶段时创建以下类型的任务，而不是在本 issue 中直接创建：

1. 模板文档实现任务：把第 10 节列出的模板文件落到仓库。
2. 模板验收任务：按 reviewer checklist 检查模板 wording、触发约定和 guardrails 是否自洽。
3. 试运行任务：选一个新的 BMAD-owned repo 项目或一次受控试点，用模板走一遍 `规划 -> tracker -> story issue` 流程。
4. 复盘任务：记录模板首轮试运行中暴露的 wording 缺口、角色冲突和自动化机会。

## 12. reviewer 验收点

Reviewer 在模板实现阶段应至少确认以下几点：

- 文档明确声明“仅 BMAD-owned projects 默认使用”。
- 三类模板各自的责任边界清晰，没有把规划、执行跟踪、单 story 落地混在一起。
- `REPO_PATH` 与 `start story` 的使用时机明确，没有在 planning / tracker issue 中滥用。
- Worktree guardrails 明确写出了“必须先进入可见基线/分支”的工件集合。
- 文档明确区分“已在 issue 流程验证过的规则”和“本次只是模板化目标的规则”。
- 模板能支撑 Scrum Master 继续创建开发阶段任务，而无需 Planner 再补一轮口头解释。

## 13. 最终判断

对于 BMAD-owned repo 项目，建议将以下内容视为当前已经稳定的流程基线：

- 分层 issue 结构
- `create-story` 前置
- execution tracker 作为波次容器
- Worktree 必须依赖可见 baseline
- gating 驱动后续波次，而不是一次性全量派发

而以下内容仍属于下一阶段应实现的模板资产，而非已完成资产：

- repo 内正式模板文件
- reviewer 固化清单
- guardrail 的标准化 wording / checklist
- 基于模板的首轮试运行复盘

这意味着 `HTH-203` 的交付物应被视为“模板规划蓝图已完成，可交 Scrum Master 进入实现阶段”，而不是“模板实现已完成”。
