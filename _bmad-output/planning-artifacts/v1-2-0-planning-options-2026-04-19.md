# yunxiao-cli v1.2.0 需求收集与规划方案（待确认）

**项目**：yunxiao-cli  
**规划日期**：2026-04-19  
**规划基线**：`v1.1.0` / `dcc353a5755ce695f839e305ff2d60f3dbcf3f90`  
**对应任务**：[HTH-193](/HTH/issues/HTH-193)  
**文档性质**：需求收集与方案确认稿；不进入开发，不创建 developer story

---

## 1. 目标与边界

本轮工作只做三件事：

1. 基于仓库现有 BMAD 工件、复盘结论和当前代码状态，收敛 v1.2.0 的真实需求。
2. 给出 3 个可供确认的方向选项，并明确范围、收益、风险、前置条件和推荐方案。
3. 说明哪些问题需要用户先拍板，以及是否建议进入“需求变更,bmad cc”。

本轮**不做**以下动作：

- 不修改 PRD / architecture / epics 正文
- 不创建新的 story
- 不直接调整 agent instructions
- 不进入开发或验证执行

---

## 2. 输入证据

本方案基于以下仓库证据整理：

- 复盘交接：`_bmad-output/implementation-artifacts/v1-1-0-retro-2026-04-19.md`
- Sprint 状态：`_bmad-output/implementation-artifacts/sprint-status.yaml`
- 现有产品规划：`_bmad-output/planning-artifacts/prd.md`
- Epic 列表：`_bmad-output/planning-artifacts/epics.md`
- Deferred work：`_bmad-output/implementation-artifacts/deferred-work.md`
- i18n story：`_bmad-output/implementation-artifacts/9-6-i18n-chinese.md`
- Codeup spike story：`_bmad-output/implementation-artifacts/10-1-codeup-api-verification.md`
- Codeup 研究报告：`_bmad-output/research/codeup-api-verification.md`
- 当前代码审计：`src/i18n/`、`src/index.js`、`src/codeup-api.js`、`src/commands/repo.js`

---

## 3. 当前状态收敛

### 3.1 已经明确成立的事实

- `v1.1.0` 已完成稳定性修复 + Codeup 第一阶段最小闭环，Codeup 当前已覆盖 `repo list`、`repo view`、`mr list`、`mr view`、`mr create`。
- AI-agent-first CLI 的核心合同已经形成：`--json`、stdout/stderr 分离、错误码稳定、真实 CLI 验收是发布约束。
- `repo -> mr list -> mr view -> mr create` 的增量扩展模式已被验证为可复用。

### 3.2 当前最重要的缺口

#### 缺口 A：中文化只完成基础设施，尚未完成用户可见 rollout

证据：

- `9-6-i18n-chinese.md` 仍显示 Task 3“迁移现有字符串到 i18n 系统”未完成。
- 当前代码里 `t()` 的实际使用只出现在 `src/index.js` 初始化与 `test/i18n.test.js`，`src/output.js`、`src/errors.js`、`src/commands/*.js` 尚未系统接入。

结论：

- v1.2.0 若继续推进中文化，必须把“基础设施完成”和“用户可见交付完成”拆成两层目标，不能再用一个笼统 story 覆盖。

#### 缺口 B：Story 工件与 Sprint 状态存在持续漂移

证据：

- `sprint-status.yaml` 已将 `9-6-i18n-chinese` 和 `10-1-codeup-api-verification` 标为 `done`。
- 对应 story 文件仍保留 `review` 状态，且任务勾选与实际发布结果不完全同步。

结论：

- 这不是单个 story 的偶发问题，而是 planning / execution 工件卫生问题，会直接影响下轮需求盘点、验收和 retrospective 的准确性。

#### 缺口 C：Codeup 已具备能力面，但证据等级不统一

证据：

- `src/codeup-api.js` 与 `src/commands/repo.js` 已落地 Codeup 能力闭环。
- `_bmad-output/research/codeup-api-verification.md` 明确标注“基于文档推断”，不是统一 live-test 证据。
- `test/spike-codeup-api.js` 存在，但当前仓库工件没有形成一份可持续维护的 evidence ledger。

结论：

- v1.2.0 若继续扩 Codeup，不应直接从“功能面”往前推，而应先把 evidence level 管理补齐，否则下一轮会把风险转嫁给开发和验收。

#### 缺口 D：release 可靠性依然依赖人工记忆

证据：

- 复盘明确指出版本元数据对齐最终依赖 release 阶段补齐。
- 当前已有真实 CLI 验收经验，但尚未沉淀为显式 release checklist 模板。

结论：

- v1.2.0 若继续发版节奏，应该把 release gate 模板化，而不是继续依赖“临门一脚发现问题再补”。

---

## 4. v1.2.0 需求分组

| 需求组 | 代表需求 | 当前紧迫性 | 说明 |
|------|------|------|------|
| 可用性债务 | CLI 中文化 rollout、文档边界补齐、Story 工件卫生、release checklist | 高 | 直接影响用户体验、验收效率和后续规划可信度 |
| Codeup 扩展 | MR 更完整工作流、Repo/MR 周边对象、下一阶段自动化能力 | 中高 | 能带来功能增长，但对 live-test 环境和证据等级更敏感 |
| AI workflow 契约加固 | 真实 CLI smoke、JSON/stderr/错误码回归、发布门禁 | 高 | 是所有新功能继续增长的安全边界 |

---

## 5. v1.2.0 方向选项

### 方案 A：可用性收口优先，补齐 rollout 与规划卫生

**范围**

- 做一轮 CLI i18n 缺口审计，并把中文化范围限制在高频命令
- 补齐高频命令的人类可读输出接入，而不是追求一次性全 CLI 中文化
- 治理 Story 工件同步规则：story 状态、task 勾选、`sprint-status.yaml` 对齐
- 将 release checklist 模板化
- 补充真实 CLI 验收要求，但不扩大 Codeup 功能面

**收益**

- 直接消化 v1.1.0 残余债务
- 让后续规划、验收和 retrospective 的状态源更可信
- 以较低风险交付用户可感知改善

**风险**

- 新功能感知较弱，外部看起来像“收口版本”
- 若用户更关心 Codeup 扩张，感知价值会偏低

**前置条件**

- 用户接受 v1.2.0 先以“可用性收口”而非“功能扩张”为主
- 中文化范围收敛到高频命令，而不是一次覆盖全 CLI

**适用前提**

- 当前优先级是先把已有能力做完整、做稳定

### 方案 B：Codeup 工作流扩展优先，补证据后继续长功能链

**范围**

- 先补 Codeup evidence ledger，明确每个候选 API 的 evidence level
- 在 live-test 环境可用的前提下，继续扩 MR 工作流或 Repo/MR 周边能力
- 保持 `--json` / stdout / stderr / 错误码合同不退化
- 中文化只做最低限度，不作为主目标

**候选扩展方向**

- MR comment / merge / close / approvals
- diff / commits / discussions 等 review 辅助能力
- 围绕 `repo -> mr` 主链继续补“可执行的下一步动作”

**收益**

- 直接扩大产品能力面，延续 v1.1.0 的功能增长势头
- 对 Codeup 使用场景更有吸引力

**风险**

- 对真实 PAT / 测试仓库 / live-test 环境依赖更强
- 如果 evidence level 管理不扎实，开发和验收阶段会被反复打断
- 可用性债务继续滞留

**前置条件**

- 用户明确把 Codeup 当作 v1.2.0 的第一优先级
- 持续可获得真实 PAT 和测试仓库
- 先同意把 evidence ledger 视作功能开发前置项

**适用前提**

- 当前目标是尽快扩大 Codeup 自动化能力边界

### 方案 C：AI workflow 契约加固优先，把 CLI 当成 Agent 基础设施来打磨

**范围**

- 建立真实 CLI 入口 smoke 与发布门禁
- 加强 `--json` schema、stderr 提示、错误码和版本元数据回归约束
- 把 release checklist、契约回归和验收基线标准化
- 中文化和 Codeup 扩张都只保留最低限度必要动作

**收益**

- 对 AI agent 链式消费最稳
- 后续版本扩展功能时，回归成本更低
- 能把“最终验收发现问题”变成“更早发现问题”

**风险**

- 用户可见的新能力最少
- 如果缺乏明确业务压力，容易被认为偏内部工程治理

**前置条件**

- 用户认同 v1.2.0 更像“平台稳定性版本”

**适用前提**

- 当前首要目标是让 yunxiao-cli 更稳地服务 AI workflow

---

## 6. 选项对比

| 维度 | 方案 A | 方案 B | 方案 C |
|------|------|------|------|
| 用户可见改善 | 中高 | 高 | 中低 |
| 交付风险 | 低 | 高 | 中低 |
| 对 live-test 环境依赖 | 低 | 高 | 中 |
| 对后续 Codeup 扩张的准备价值 | 中 | 高 | 中 |
| 对当前残余债务的消化程度 | 高 | 低 | 中高 |
| 与复盘结论的一致性 | 高 | 中 | 高 |

---

## 7. 推荐方案

### 推荐：方案 A 为主，吸收方案 C 的必要门禁，不把方案 B 作为本版本主线

推荐理由：

1. 这最符合 v1.1.0 复盘给出的优先级顺序：先补稳定性和可用性，再开新扩张。
2. 当前中文化与 Story 工件卫生都属于“已知欠账”，继续回避只会让下一轮规划更失真。
3. Codeup 已有最小闭环，短期内最缺的不是“再多几个命令”，而是“把证据等级和验收门槛补齐”。
4. 方案 A 可以交付真实可见改进，同时保留后续 v1.3.0 再扩 Codeup 的清晰跑道。

### 推荐范围建议

把 v1.2.0 定义为**“可用性收口 + AI 契约加固版本”**，建议纳入以下工作包：

1. **CLI i18n 缺口审计**
   - 盘点哪些命令/模块已接入、哪些仍是英文
   - 输出“高频命令优先”的 rollout 范围

2. **高频命令中文化 rollout**
   - 推荐只覆盖高频命令：`auth`、`whoami`、`project list`、`wi list/view/update`、`sprint list/view`
   - `--json` 字段名保持英文不变

3. **真实 CLI 验收与契约回归**
   - 把真实 CLI 入口 smoke 纳入版本验收
   - 明确检查 `--json` / stdout / stderr / 错误码 / version metadata

4. **Story 工件卫生治理**
   - 统一 story 文件头状态、task 勾选与 `sprint-status.yaml` 的回写时机
   - 为“foundation only”类型 story 增加显式标记规则

5. **release checklist 模板化**
   - 固定检查 runtime version、package version、tag、`npm test`、关键 CLI smoke、`npm pack --dry-run`、发布流水线和 release note

6. **Codeup evidence ledger**
   - 本版本只补证据管理，不把大规模 Codeup 新功能扩张纳入主线

### 推荐范围外内容

以下内容建议**不作为 v1.2.0 主范围**：

- 大幅扩张 Codeup 新对象或高阶 MR 能力
- 一次性全 CLI 中文化
- 直接修改 BMAD agent instructions

---

## 8. 需要用户确认的关键问题

以下问题必须先确认，确认后才能进入后续 PRD / architecture / epic 调整：

1. **v1.2.0 第一优先级**
   - 是补可用性债务，还是继续扩 Codeup，还是优先加固 AI workflow 契约？

2. **中文化范围**
   - 只覆盖高频命令，还是追求全 CLI？

3. **Codeup live-test 条件**
   - 后续版本是否稳定拥有真实 PAT、测试仓库和可重复验证环境？

4. **Codeup 下一阶段主目标**
   - 若要扩 Codeup，优先做 MR 深化，还是做 Repo/MR 之外的新对象？

5. **用户价值偏好**
   - 当前更看重 AI 自动化主路径稳定性，还是人类可读性提升？

---

## 9. 对后续 BMAD 文档的待确认变更建议

以下是**建议变更方向**，本轮不直接执行：

### PRD 建议

- 在 Growth / Future 部分增加 v1.2.0 的版本目标说明
- 明确“i18n foundation”与“user-visible rollout”是不同层级
- 把 AI workflow 契约回归列为 release 级要求，而不只是技术偏好

### Architecture 建议

- 为外部 API Spike 增加 `evidence level` 约定
- 为真实 CLI smoke 和 release checklist 增加标准化入口

### Epic 建议

若用户确认推荐方案，可考虑后续再正式化为以下候选 Epic：

- 候选 Epic A：CLI 可用性收口与中文化 rollout
- 候选 Epic B：AI workflow 契约加固与 release gate
- 候选 Epic C：Codeup evidence ledger 与下阶段扩展准备

---

## 10. 待用户确认的规范变更建议

以下仅列为建议，不直接修改 agent instructions：

1. Developer 在 story 进入 `done` 前，必须同步更新 story 状态、task 勾选和 `sprint-status.yaml`
2. 对“基础设施已完成但用户不可见”的 story，必须显式标记为 `foundation only`
3. 对外部 API Spike，必须记录 evidence level，而不只给结论
4. 发布前必须有显式 release checklist 子任务或模板
5. 最终验收需要显式区分 `release blocker` 与 `non-blocking residual risk`

---

## 11. 是否建议进入“需求变更,bmad cc”

**当前建议：暂不立即进入。**

原因：

- 本轮任务的重点是“先形成可确认方案”，不是在既有实施中途纠偏。
- 在用户尚未确认优先级、中文化范围和 Codeup live-test 条件前，直接进入 `bmad cc` 会过早把方案固化。

**建议触发条件**：

- 用户明确选择 v1.2.0 的主方向
- 用户确认中文化范围与 Codeup 环境可用性
- 确认需要改动现有 PRD / architecture / epics 基线

当以上条件成立后，再进入“需求变更,bmad cc”会更合适。

---

## 12. 建议结论

v1.2.0 最稳妥的定位，不是“再堆一轮功能”，而是把 v1.1.0 暴露出的可用性债务、验收门槛和规划卫生先补齐。  
建议将本版本定义为：

> **可用性收口 + AI workflow 契约加固版本，Codeup 扩展以补证据为主、不以扩功能面为主。**

如果用户认同这个定位，下一步再按 BMAD 正式进入 PRD / architecture / epics 调整会更顺。
