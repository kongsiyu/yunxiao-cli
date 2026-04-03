# yunxiao-cli 全项目复盘报告

**项目**：yunxiao-cli
**复盘范围**：Epic 1–8（全项目）
**复盘日期**：2026-04-02
**主持**：Bob (Scrum Master)
**参与方**：Sue (Project Lead)、Charlie (Senior Dev)、Dana (QA Engineer)、Alice (Product Owner)

---

## 一、项目成果总结

### 交付成果

| 维度 | 结果 |
|------|------|
| Epic 完成数 | 8 / 8 |
| Story 完成数 | 34 / 34（含 5 个额外 Story：1-6、2-5、2-7、2-8、3-1） |
| 功能需求覆盖 | 34 / 34 FR |
| npm 包发布 | `@kongsiyu/yunxiao-cli` 已发布，`yunxiao` 全局命令可用 |
| CI/CD 自动化 | GitHub Actions CI（PR 测试）+ CD（tag 触发发布）已上线 |
| 测试覆盖 | API 层、序列号解析、命令层三层覆盖；36+ 测试用例通过 |
| 文档 | 完整 README（安装、配置、命令参考、工作流示例）+ SKILL 文件优化 |

### 技术架构最终状态

```
src/
  index.js        ← CLI 入口，withErrorHandling，命令注册
  api.js          ← 纯 API 函数层，所有云效接口封装
  config.js       ← 配置管理（cli > file > env 优先级）
  output.js       ← 统一输出层（--json 模式 / human-readable）
  errors.js       ← ERROR_CODE 枚举 + AppError 类
  commands/
    auth.js       ← 认证命令
    workitem.js   ← 工作项 CRUD + 评论
    sprint.js     ← Sprint 管理
    project.js    ← 项目查询
    query.js      ← 用户查询（user list/search）
    pipeline.js   ← 流水线管理
    status.js     ← 工作项状态查询
test/
  config.test.js      ← 配置模块测试
  mock-example.test.js ← mock 策略示例
  resolve.test.js     ← 序列号解析专项测试
  api.test.js         ← API 层测试
  commands.test.js    ← 命令层测试
  setup.js            ← 共享 mock helpers
```

---

## 二、深度分析：跨 Story 模式与主题

### 2.1 共同亮点（做得好的）

#### 模块化架构从第一天确立

Epic 1 的核心价值不仅仅是"清理死代码"，而是建立了清晰的职责边界：
- `api.js` 只负责 HTTP + 数据解包
- `config.js` 只管配置优先级
- `errors.js` 集中管理错误码
- `output.js` 统一处理输出格式

这个架构决定让 Epic 2–8 的开发变得极其顺畅——每个 Story 只需关注业务逻辑，无需重新处理错误格式、输出模式等横切关注点。

**量化影响**：Epic 2 的 8 个 Story 平均完成质量远高于 Epic 1（Dev Notes 中无需重复说明基础设施），这直接源于 Epic 1 的模块化工作。

#### API Spike（Story 1.7）的前瞻价值

在实现任何业务命令之前先做 API 验证研究，这个决定避免了大量返工：
- 确认了 `wi view <serialNumber>` 不能直传（需 UUID 解析）— 这个结论直接影响了 Story 2.1 和 2.3 的实现路径
- 发现了 `listSprints` 的 API 路径 Bug（projectId 位置错误）
- 为 Pipeline API 建立了基础认知

**值得保留的做法**：未来项目中，对第三方 API 的研究 Spike 应该比开发工作提前至少一个 Epic。

#### 序列号解析（Story 2.1）的稳健实现

`resolveWorkitemId` 的修复不仅仅修了一个 Bug，而是建立了一个供后续 5 个命令复用的核心能力。关键设计决策：
- 全类型搜索（`Req,Task,Bug`）而非局限于 `Req`
- `perPage: 50` 扩大搜索窗口
- 精确匹配 `serialNumber` 字段（而非模糊搜索 `subject`）
- 大小写不敏感匹配

Story 7.3 的专项测试（11 个用例）进一步巩固了这一核心逻辑的可靠性。

#### 测试基础设施的战略性投资（Story 7.1）

Story 7.1 的关键发现——Node.js 18 中 ESM namespace 对象的 non-configurable 限制——如果在 7.2/7.3/7.4 编写时才发现，代价会大得多。通过提前做基础设施调研：
- 建立了两种可用的 mock 策略（Strategy A 和 B）
- 创建了 `test/setup.js` 共享 helpers
- 测试代码质量在 7.2–7.4 阶段保持了一致的高水准

---

### 2.2 挑战与改进机会

#### 挑战 1：Story 文件状态更新不一致

**现象**：多个 Story 文件的 `Status:` 字段未更新到 `done`（如 1.1 停在 `ready-for-dev`，1.2/1.4/2.1/7.3 停在 `review`），但 `sprint-status.yaml` 中均已标记为 `done`。

**根因**：Dev Agent 在完成 Story 后，更新 `sprint-status.yaml` 是必做的，但更新 Story 文件头部的 `Status:` 字段属于可选（或遗漏）步骤。

**影响**：轻微。主要是状态一致性问题，不影响实际功能交付。

**建议**：在 story-dev 工作流的 Completion Checklist 中，将"更新 Story 文件 Status 字段为 done"作为必做项，与 sprint-status.yaml 更新并列。

#### 挑战 2：API Spike 的验证深度受限

**现象**：Story 1.7 在无实际 API 凭证的情况下，Pipeline 相关结论标注为"低置信度——需实际验证"。`pipeline list` 的旧版 API 路径最终只能靠 Epic 5 的实际实现来验证。

**根因**：Spike 阶段缺少可用的测试凭证，导致部分 API 验证停留在文档分析层面。

**影响**：中等。Pipeline 命令的实现需要在 Epic 5 中再次确认 API 路径，增加了不确定性。

**建议**：未来有第三方 API 依赖的项目，应在 Spike 阶段提前准备测试账号和凭证，确保能做真实的 API 调用验证。

#### 挑战 3：`resolveWorkitemId` 的 perPage 限制

**现象**：`resolveWorkitemId` 使用 `perPage: 50` 搜索全类型工作项，如果项目中存在超过 50 个相似名称的工作项，序列号可能无法精确命中。

**根因**：搜索 API 需要关键词参数，但序列号格式（如 `GJBL-1`）无法作为关键词传入，导致只能拉取前 50 条再本地匹配。Story 7.3 的测试中通过 `perPage: 50 限制断言` 记录了这个已知限制。

**影响**：低风险（大多数团队的工作项数量不会超过 50 条按时间倒序的最新记录）。但属于已知技术债务。

**建议**：将此限制记录在 SKILL.md 和 README 的"已知限制"章节；长期解决方案是确认云效 API 是否支持 `serialNumber` 作为搜索参数。

#### 挑战 4：Sprint view 的"已完成"状态判断依赖字段推断

**现象**：Story 4.2 的"已完成工作项"统计采用了多级降级策略（`status.done` → `status.stage === 'DONE'` → 名称模糊匹配），原因是 API 返回的 done 状态字段不确定。

**根因**：API Spike 阶段未确认工作项的 done 状态字段格式，Sprint View 的开发者需要做防御性编程。

**影响**：中等风险。不同团队的工作流配置可能导致统计不准确。

**建议**：在 Epic 5 之后，建议通过实际 API 调用确认 `status` 字段的具体 schema，并将确认结果固化到 `api-verification-v2.md`。

---

### 2.3 技术债务清单

| 编号 | 描述 | 严重程度 | 建议处理时机 |
|------|------|----------|-------------|
| TD-1 | `resolveWorkitemId` perPage: 50 上限，大型项目可能漏匹配 | 低 | 下一轮功能迭代时评估 |
| TD-2 | `sprint view` 工作项 done 状态判断依赖多级降级，未固化 schema | 中 | 建议下次 sprint view 相关需求时修复 |
| TD-3 | Pipeline list 旧版 API 路径未通过新版文档确认（`/organization/{orgId}/pipelines`） | 中 | 建议集成测试时验证并更新 api-verification-v2.md |
| TD-4 | Story 文件 Status 字段与 sprint-status.yaml 不同步 | 低 | 下次 SM 创建 Sprint 计划时统一修复 |

---

## 三、复盘讨论（团队视角）

### 什么进展顺利？

**Alice (Product Owner)**："从需求到发布，所有 34 个 FR 都被交付了，且没有发现遗漏的验收标准。Epic 1 的模块化架构选择，回头看是整个项目最关键的决策之一。"

**Charlie (Senior Dev)**："我印象最深的是 API Spike 的价值。`resolveWorkitemId` 的那个 subject 模糊搜索 bug，如果不是 Spike 里预先识别到，到 Story 2.3 实现 wi view 时才发现，代价会很大。另外，`withErrorHandling` 包装器设计得很好，命令层从不需要 try-catch，代码简洁很多。"

**Dana (QA Engineer)**："`test/setup.js` 的共享 helpers 是个好决定。`createMockClient`、`makeWorkitem`、`makeSprint` 这些 factory 函数，让 7.2/7.3/7.4 的测试代码非常整洁。Node.js 18 的 ESM mock 限制是个意外挑战，但 Strategy A（mock client HTTP 层）最终是个更好的测试分层方式——我们实际上在测 api.js 真实代码路径，而不是 mock 了整个模块。"

### 什么需要改进？

**Bob (Scrum Master)**："Story 文件状态不同步的问题在本项目里出现了 5+ 次。这不是大问题，但影响 sprint-status 的准确性。下次我会在 SM Review checklist 里加一条：检查 Story 文件 Status 字段。"

**Charlie (Senior Dev)**："Pipeline API 那部分，我们在 Spike 里标注了'低置信度'，结果 Epic 5 实现时确实碰到了 `pipeline list` 的路径不确定问题。下次对 API 依赖多的 Epic，应该在 Spike 阶段就争取到测试凭证。"

**Alice (Product Owner)**："`sprint view` 的完成率统计，在某些工作流配置下可能不准确。这是个已知限制，但应该在 README 或 SKILL.md 里明确说明，避免 AI Agent 误判 Sprint 进度。"

---

## 四、行动项

| # | 行动项 | 负责方 | 时机 |
|---|--------|--------|------|
| A1 | 在 story-dev 工作流的 Completion Checklist 中，将"更新 Story 文件 Status 字段"列为必做项 | Bob (SM) | 下次 Sprint 计划前 |
| A2 | 在 README 和 SKILL.md 中添加"已知限制"章节，说明 resolveWorkitemId 的 perPage 限制和 sprint view 的 done 状态推断逻辑 | Developer | 下次文档迭代 |
| A3 | 验证 pipeline list API 路径（旧版 vs 新版），结果写入 api-verification-v2.md | Developer | 下次 pipeline 相关需求时 |
| A4 | 评估云效 API 是否支持 serialNumber 作为 searchWorkitems 的过滤参数，以解决 TD-1 | Developer | 低优先级，下轮迭代评估 |
| A5 | 未来第三方 API 项目，Spike 阶段提前准备真实测试凭证 | Bob (SM) + Sue (Project Lead) | 下个项目立项时 |

---

## 五、下一阶段准备

### 当前产品状态

yunxiao-cli v0.1.x 已发布，覆盖了所有 MVP 功能。适合以下场景：
- AI Agent 自动化 Sprint 工作流（wi list/view/update + sprint list/view）
- 工作项 CRUD 操作（创建、更新状态、指派、评论）
- 流水线触发与状态查询
- 项目、成员、工作项类型等前置 ID 查询

### 潜在下一步方向（供讨论）

1. **健壮性增强**：修复 TD-1/TD-2，增加 `resolveWorkitemId` 的分页支持；固化 sprint view 的 done 状态 schema
2. **更多工作项字段**：`wi update` 支持更新优先级、标签等字段（当前只支持 status/assignee/sprint）
3. **批量操作**：`wi list --json` + shell pipeline 已支持批量场景，但可以考虑 `wi batch-update` 等便捷命令
4. **错误消息本地化**：当前错误信息混合了英文和中文，统一为中文对 AI Agent 友好度更高

---

## 六、经验提炼（可复用模式）

### 适合未来项目复用的实践

1. **模块化先行**：在 Epic 1 就把 config、errors、output 等基础模块建好，后续 Epic 只写业务逻辑
2. **API Spike 前置 + 凭证准备**：第三方 API 依赖必须在 Spike 阶段做真实验证，不能依赖文档推断
3. **withErrorHandling 包装器模式**：命令层不写 try-catch，错误处理集中在框架层，保持命令代码简洁
4. **测试 setup.js 共享 Helpers**：多个测试文件需要相同的 mock 对象时，提前创建 factory 函数
5. **sprint-status.yaml 作为单一信息源**：Story 文件可以有状态字段，但 sprint-status.yaml 是权威来源

### 适合下个项目携带的教训

1. **Story 文件 Status 字段必须与 sprint-status.yaml 同步**（Dev Agent Completion Checklist 必须项）
2. **低置信度 API 结论必须在该 Epic 实现完成后更新**（不能遗留在文档中）
3. **已知限制要在文档中明确标注**，避免使用者（人类或 AI Agent）做出错误假设

---

*复盘报告生成日期：2026-04-02*
*主持：Bob (Scrum Master) — yunxiao-cli 全项目复盘*
