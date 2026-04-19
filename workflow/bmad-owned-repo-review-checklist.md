# BMAD-owned Repo Reviewer 验收清单

> 适用范围：仅 `BMAD-owned projects` 默认使用。
>
> 用途：验收 repo 型 BMAD workflow 模板、相关 issue wording，以及后续基于这些模板创建的实施 issue。

## 1. 适用范围与非目标

- [ ] 文档明确声明“仅 `BMAD-owned projects` 默认使用”。
- [ ] 文档没有将本模板表述为“全公司统一流程”。
- [ ] 非 repo 型事项、纯审批/治理/协调事项被明确排除在默认适用范围外。

## 2. 三类 issue 职责边界

- [ ] `规划 issue`、`execution tracker`、`独立执行单` 三类职责明确分离，没有混写。
- [ ] `规划 issue` 只负责规划、波次设计、gating、review 回路，不直接充当 story 执行入口。
- [ ] `execution tracker` 只负责当前波次 child issues、gating 与 handoff，不重写 planning 结论或 story 细节。
- [ ] `独立执行单` 只服务单一 story，不混入多 story 或 planning/tracker 职责。

## 3. `REPO_PATH` / `start story` 触发约定

- [ ] repo 型 planning issue 明确要求带 `REPO_PATH`，且不带 `start story`。
- [ ] repo 型 execution tracker 明确要求带 `REPO_PATH`，且不带 `start story`。
- [ ] repo 型独立执行单明确要求带 `REPO_PATH`，并且仅在单 story 执行场景使用 `start story`。
- [ ] 文档明确声明 `start story` 不是“直接开始编码”的同义词，而是进入 `workflow/story-dev-workflow-single-repo.md`。
- [ ] 模板 wording 没有改写 `workflow/story-dev-workflow-single-repo.md` 的既有触发语义。
- [ ] 若提到可选步骤、确认模式或跨会话接力，描述必须与 `workflow/story-dev-workflow-single-repo.md` 当前规则一致。

## 4. Baseline / Worktree Guardrails

- [ ] 文档明确吸收 [HTH-197](/HTH/issues/HTH-197) 暴露的 blocked 场景。
- [ ] baseline guardrails 明确要求 planning artifacts、`epics.md`、`sprint-status.yaml`、相关 workflow 文档先进入 Developer 可见基线，或 issue 中明确指定包含这些工件的基点分支。
- [ ] 文档明确禁止依赖主 clone 的未提交工件来支持 `Worktree模式` story。
- [ ] 文档明确写出派发前检查清单，而不是只给抽象建议。
- [ ] 文档明确写出不满足 guardrail 时的 blocked / 恢复方式。

## 5. 规则来源标注

- [ ] 每份模板都区分“已被 issue 流程验证的规则”和“当前模板化资产固定约束”。
- [ ] 已验证规则只引用已有执行证据，不把模板目标伪装成既成事实。
- [ ] 当前模板化要求写得足够明确，可直接被后续 issue 复用。

## 6. Scrum Master 接续可用性

- [ ] `规划 issue` 模板足以让 Scrum Master 创建后续 execution tracker，而不需要 Planner 额外口头补充。
- [ ] `execution tracker` 模板足以让 Scrum Master 创建 child issues、管理 gating、决定下一波次推进。
- [ ] `独立执行单` 模板足以让 Developer 知道输入、阻塞条件、完成标准、回写要求。
- [ ] reviewer / rework / 退回 Planner 或 BMAD Master 的路由清晰。

## 7. Reviewer 记录格式

验收时至少记录以下内容：

- [ ] 验收结论为 `PASS` 或 `FAIL`，不使用模糊表述。
- [ ] 明确列出审查范围（模板文件、关联 workflow、参考 planning artifact、相关 issue 证据）。
- [ ] 若 `FAIL`，精确列出必须修正项，并说明是 wording/实现问题，还是范围/路由问题。
- [ ] 若 `PASS`，明确说明通过依据与剩余非阻塞风险。
- [ ] 明确说明验证方式；若无自动化测试，需写明本次为文档/流程验收，采用人工核对。

## 8. 可复用评论模板

```md
验收结论：{PASS|FAIL}

审查范围

- `{file_or_issue}`
- `{file_or_issue}`
- `{file_or_issue}`

通过项

- `{passed_check}`
- `{passed_check}`

必须修正项

- `{must_fix_item}`
- `{must_fix_item}`

验证方式

- 文档 / 流程人工核对
- `{optional_extra_validation}`

下一步

- 若 PASS：回填通过结论并进入 `done`
- 若 FAIL：标记 `blocked`，由 Scrum Master 创建 rework follow-up
```
