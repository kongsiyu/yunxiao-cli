---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-cli-requirements, step-08-scope, step-09-epics, step-10-architecture, step-11-final, step-e-01-discovery, step-e-02-review, step-e-03-edit]
lastEdited: '2026-04-19'
editHistory:
  - date: '2026-04-02'
    changes: '关闭 Open Questions（pipeline API / category 逗号分隔已确认）；更新 Post-MVP 章节纳入 GitHub Issues #62/#63/#64/#65 和复盘技术债；新增 Epic 9（v0.2 稳定性修复与增强，6 Stories）；更新 Document Status 和 API Integration 状态'
  - date: '2026-04-19'
    changes: '执行 v1.2.0 BMAD Correct Course：确认“可用性收口 + AI workflow 契约加固”方向；补齐后续阶段规划、Epic 10 基线、v1.2.0 Epic 11-13、开发/评审/发布门禁顺序与 v1.3.0/post-MVP 后置范围'
classification:
  projectType: cli_tool
  domain: general
  complexity: low
  projectContext: brownfield
inputDocuments:
  - yunxiao-cli/_bmad-output/planning-artifacts/product-brief-yunxiao-cli-2026-03-30.md
  - yunxiao-cli/_bmad-output/planning-artifacts/skill-draft-yunxiao-cli-2026-03-30.md
  - yunxiao-cli/_bmad-output/brainstorming/brainstorming-session-2026-03-22.md
  - yunxiao-cli/docs/yunxiao-api-reference.md
  - yunxiao-cli/docs/api-verification-report.md
workflowType: 'prd'
briefCount: 1
researchCount: 0
brainstormingCount: 1
projectDocsCount: 2
---

# Product Requirements Document - yunxiao-cli

**Author:** Sue
**Date:** 2026-03-30

## Executive Summary

yunxiao-cli 是一个面向 AI Agent 和研发团队的命令行工具，将阿里云云效（Yunxiao）DevOps 平台的复杂 API 封装为有限命令集，覆盖工作项管理、版本规划、成员协作等核心场景。其核心使命是：**让一句自然语言指令驱动 AI 完成复杂云效操作，无需人工介入**——不仅服务于当前部门 AI 转型的过渡期，也作为 AI 驱动研发工作流的长期基础设施。

目标用户分两类：**AI Agent**（主要）需要可预期的命令接口、结构化 JSON 输出和非交互式认证，以自主完成研发工作流——核心成功场景是 AI 无需人工介入完成完整 Sprint 工作流（查看进度、创建/更新/分配工作项、添加评论）；**内部团队成员**（次要）通过同一套 CLI 在终端快速完成日常云效操作，替代低效的页面点击。

### What Makes This Special

yunxiao-cli 的差异化来自 **CLI + SKILL 的不可分割性**：CLI 是 AI 可以可靠执行的操作层（标准化命令、稳定 JSON 输出、非交互式认证）；SKILL 是让 LLM 知道"何时用、如何用"的认知层（When to Use / 命令参考 / 常见工作流模板）。两者缺一不可——没有 CLI，SKILL 无从执行；没有 SKILL，CLI 对 LLM 不可用。

相比直接调用 API（文档体量大、AI 成功率低）、页面操作（无法自动化）和 MCP（环境依赖重），yunxiao-cli 以零环境依赖的纯 CLI 形态，提供了最低摩擦的 AI 可操作路径。

## Project Classification

- **项目类型：** CLI Tool
- **领域：** 通用 / 开发者工具
- **复杂度：** 低
- **项目背景：** Brownfield（现有代码库，含 Bug 修复 + 功能新增）

## Success Criteria

### User Success

- **AI Agent 场景**：AI 无需人工介入，通过一条自然语言指令完成完整工作项生命周期操作（创建 → 分配 → 更新状态 → 添加评论 → 关闭），JSON 输出可直接被后续推理消费，无需额外解析处理
- **两步依赖工作流**：AI 能完整执行依赖前置查询的工作流（`wi types` → `wi create`；`status list` → `wi update`；`user search` → `wi update --assigned-to`）
- **人类场景**：用户在终端 30 秒内完成原需打开云效页面的操作（查看 Sprint、创建/更新工作项、查找成员）
- **SKILL 可用性**：Claude 等主流 LLM 在仅读取 SKILL 文件的情况下，无需额外提示即可正确调用命令并完成工作流

### Business Success

- **对内**：部门 AI Agent 可将云效工作项操作纳入自动化工作流，减少人工中转步骤
- **长期**：yunxiao-cli 成为团队 AI 驱动研发工作流的标准工具层，不随 AI 转型完成而废弃

### Technical Success

- 所有命令在非交互式模式（环境变量认证）下稳定运行，适配 CI/容器环境
- `--json` 输出 schema 稳定，字段不随版本变动；schema 变更须向后兼容，AI 解析成功率高
- 序列号解析有专项测试覆盖，验证全类型搜索 + `serialNumber` 精确匹配逻辑
- 核心 API 函数与命令输出路径有测试覆盖（关键路径：认证、工作项 CRUD、序列号解析、JSON 输出格式）
- npm 发布后可通过 `npm install -g @kongsiyu/yunxiao-cli` 及 `npx @kongsiyu/yunxiao-cli` 正常安装使用

### Measurable Outcomes

| 指标 | 目标 |
|------|------|
| AI 完成 Sprint 工作流 | 无人工介入，端到端成功 |
| 两步依赖工作流 | types→create / status→update / search→assign 全部可执行 |
| 人类操作时效 | ≤30 秒完成常见云效任务 |
| 命令稳定性 | 核心命令在 CI 环境无报错运行 |
| 测试覆盖 | API 层全函数 + 序列号解析专项 + 命令层核心输出路径 |
| 安装验证 | npm 全局安装及 npx 运行均可用 |

## Product Scope

### MVP - Minimum Viable Product

**工作项核心生命周期（必须）：**
- `wi list`（含 Sprint/状态/负责人/类型过滤）
- `wi view`（支持序列号格式 GJBL-1）
- `wi create`（含类型、负责人、Sprint 分配）
- `wi update`（含状态、负责人、Sprint 更新）
- `wi delete`（含 `--force` 跳过确认）
- `wi comment`（添加评论）
- `wi comments`（列出评论）
- `wi types`（获取工作项类型 ID，create 前置步骤）

**必要支撑命令：**
- `auth login`（含 `--token --org-id` 非交互模式）/ `auth status` / `auth logout`
- `status list`（获取状态 ID，update 前置步骤）
- `user list` / `user search`（获取 userId，assign 前置步骤）
- `sprint list` / `sprint view`（Sprint 进度查看）
- `whoami` / `project list`（用户与项目基础信息查询）

**全局能力：**
- `--json` 全局 flag（所有 list/view 命令）
- 环境变量认证（`YUNXIAO_PAT` / `YUNXIAO_ORG_ID` / `YUNXIAO_PROJECT_ID`）

**发布：**
- npm 发布 `@kongsiyu/yunxiao-cli`，binary `yunxiao`
- Node.js 内置测试运行器测试（API 层全函数 + 序列号解析专项 + 命令层核心输出路径）

### Growth Features (Post-MVP / v0.2-v1.1.0 已交付)

**Bug 修复（来自用户反馈）：**
- auth login PAT 生成地址错误 + 交互提示不够明显（[GitHub #62](https://github.com/kongsiyu/yunxiao-cli/issues/62)）
- project list 输出排版混乱（[GitHub #64](https://github.com/kongsiyu/yunxiao-cli/issues/64)）

**稳定性改进（来自复盘技术债）：**
- `resolveWorkitemId` 分页完整性改进（当前 perPage: 50 上限，大型项目可能漏匹配）
- `sprint view` 工作项 done 状态判断 schema 固化（当前依赖多级降级推断）

**功能增强（来自用户反馈）：**
- 版本检测与更新提示（[GitHub #65](https://github.com/kongsiyu/yunxiao-cli/issues/65)）
- 多语言支持，中文优先（[GitHub #63](https://github.com/kongsiyu/yunxiao-cli/issues/63)）

**Codeup 第一阶段（v1.1.0 已交付）：**
- `repo list` / `repo view`
- `mr list` / `mr view` / `mr create`
- Codeup client、命令层与测试模式形成可复用扩展基线

**已在 MVP 中完成（原 Growth 项）：**
- ~~SKILL 文件由 skill-creator 优化生成正式版~~ 已完成（Epic 8 Story 8.4）
- Shell 自动补全（仍为 Post-MVP，优先级低）

### v1.2.0 Correct Course Scope

v1.2.0 经 BMAD Correct Course 确认为 **“可用性收口 + AI workflow 契约加固版本”**。本版本以方案 A 为主，吸收方案 C 的必要门禁；Codeup 继续保留已交付闭环，但不在本版本主线中大幅扩张新功能面。

**v1.2.0 产品目标：**
- 把 9.6 中已完成的 i18n foundation 推进到用户可见 rollout，而不是继续把“基础设施完成”误判为“中文体验交付完成”。
- 把真实 CLI smoke、`--json` stdout 纯净性、stderr 提示、错误码和 version metadata 作为 AI workflow 契约回归。
- 把 story 文件状态、task 勾选、`sprint-status.yaml` 回写和 release checklist 模板化，修复 v1.1.0 复盘暴露的规划/执行工件漂移。
- 为后续 Codeup 扩展建立 evidence ledger，但不把 MR merge/comment/approval/diff 等高阶能力纳入 v1.2.0 主线。

**v1.2.0 In Scope：**
- i18n 缺口审计：盘点已接入/未接入模块，明确高频命令 rollout 边界。
- 高频命令中文化 rollout：优先覆盖 `auth`、`whoami`、`project list`、`wi list/view/update`、`sprint list/view` 的 human-readable 输出；`--json` 字段名保持英文且 schema 不变。
- AI workflow 契约回归：真实 CLI 入口 smoke、JSON/stderr/错误码/version metadata 检查纳入发布前门禁。
- Story 工件卫生治理：明确 story `Status`、Task/Subtask 勾选、`sprint-status.yaml` 的回写规则；对 foundation-only 交付增加显式标记。
- Release checklist 模板化：固定 runtime version、package version、tag、`npm test`、关键 CLI smoke、`npm pack --dry-run`、发布流水线和 release note 检查项。
- Codeup evidence ledger：为后续 Codeup API 候选能力记录 evidence level、auth、endpoint、必填字段、实测状态和风险等级。

**v1.2.0 Out of Scope / 后置：**
- 大规模 Codeup 新命令扩张（MR merge/comment/close/approval、diff/commits/discussions 等）后置到 v1.3.0 候选范围。
- 一次性全 CLI 中文化后置；v1.2.0 只做高频命令与 release blocker 级文本。
- 直接修改 BMAD agent instructions 后置；v1.2.0 只在项目工件中固化执行规则和模板。
- Shell 自动补全、TUI、多组织/多项目快速切换继续保持 post-MVP / Future。

**后续阶段顺序：**

| 阶段 | 目标 | 主要责任 |
|------|------|----------|
| P0 PRD/Epic 对齐 | 本 PRD、epics、sprint change proposal、sprint status 同步完成 | BMAD Planner |
| P1 Story 准备 | 按首批 create-story 候选生成 story 文件，SM 按顺序分派 | Scrum Master |
| P2 开发波次 1 | i18n audit 与 story 工件同步规则先行 | Developer |
| P3 开发波次 2 | 高频命令中文化 rollout 与真实 CLI smoke matrix | Developer |
| P4 评审验收波次 | 审查 stdout/stderr/JSON/error code/version metadata 合同、story 状态回写、release checklist 完整性 | Reviewer / Test Architect |
| P5 发布前门禁 | `npm test`、关键 CLI smoke、`npm pack --dry-run`、version/tag/release note/publish pipeline 检查 | Scrum Master / Release Owner |

### Vision (Future)

- 支持更多云效模块（代码仓库 Codeup 操作、代码审查等）
- 多组织 / 多项目快速切换
- 交互式 TUI 模式（人类友好增强）
- Shell 自动补全（zsh / bash / fish）

## User Journeys

### Journey 1：AI Agent — Sprint 工作流主路径

**角色：** Claude Code（代表任何 AI Agent）

**场景：** 用户对 Claude Code 说："帮我看看当前 Sprint 的进展，把未完成的 Bug 全部指派给张三。"

Claude Code 读取 SKILL 文件，识别到这是 yunxiao-cli 的使用场景。它先调用 `sprint list --status started --json` 拿到当前 Sprint ID，再调用 `sprint view <id> --json` 获取统计数据；接着 `wi list --sprint <id> --category Bug --json` 筛出未完成 Bug；同时 `user search "张三" --json` 拿到 userId。一切就绪后，逐条执行 `wi update <id> --assigned-to <userId>`。整个过程 Claude Code 没有询问任何人工确认——每一步的 JSON 输出直接成为下一步的输入。

**价值时刻：** 用户说一句话，AI 完成了原本需要打开云效、逐条点击的操作。

**揭示的能力需求：** `sprint list/view`、`wi list`（多条件过滤）、`user search`、`wi update`、稳定的 `--json` 链式输出

---

### Journey 2：AI Agent — 认证失效恢复路径

**角色：** Claude Code 在 CI 流水线中自动执行

**场景：** 定时任务中，Claude Code 尝试执行 Sprint 汇报，但 PAT 已过期。

调用命令后收到明确错误信息："认证失败：token 无效或已过期，请检查 YUNXIAO_PAT 环境变量"。Claude Code 识别到这是认证类错误，停止执行并向用户报告具体原因，而非返回模糊的 HTTP 401。用户更新环境变量后，重新触发任务，流程恢复正常。

**价值时刻：** 错误信息足够精准，AI 能自主判断是否可以重试，不需要人来解读 HTTP 状态码。

**揭示的能力需求：** 清晰的错误分类（认证错误 vs 参数错误 vs API 错误）、非零退出码、错误消息写入 stderr

---

### Journey 3：人类团队成员 — 站会前快速查看

**角色：** 李明，研发工程师，每天站会前需要知道自己的工作项状态

**场景：** 站会前 2 分钟，李明打开终端。

设置好环境变量后，一条命令 `yunxiao wi list --sprint <currentSprint> --assigned-to me` 就展示出他负责的全部工作项，状态一目了然。如果他想看 Sprint 整体进度，`yunxiao sprint view <id>` 给出完成率和分类统计。整个过程不超过 30 秒，不需要打开浏览器、不需要等页面加载。

**价值时刻：** 终端里直接看到需要汇报的信息，站会更高效。

**揭示的能力需求：** `wi list --assigned-to me`、`sprint view`、人类友好的默认输出格式（非 JSON）

---

### Journey 4：人类团队成员 — 初次配置与首次成功使用

**角色：** 王芳，刚加入团队的新成员，需要配置 yunxiao-cli

**场景：** 技术负责人发来一句话："去 npm 装个 yunxiao-cli，配好就能用了。"

`npm install -g @kongsiyu/yunxiao-cli` 安装完成，`yunxiao --help` 显示所有可用命令。她在 shell 配置文件里设置三个环境变量，执行 `yunxiao auth status` 确认认证成功，`yunxiao whoami` 看到自己的用户信息——此刻配置完成。第一个真实操作：`yunxiao project list` 找到自己要工作的项目，记下项目 ID，加入环境变量。整个上手过程无服务启动、无配置文件编辑、无依赖安装失败。

**价值时刻：** 零摩擦上手——npm 安装即用，帮助信息清晰，配置过程线性可验证。

**揭示的能力需求：** `--help` 始终可用（无需认证）、`auth status`、`whoami`、`project list`、清晰的安装文档

---

### Journey Requirements Summary

| 能力 | 来源旅程 |
|------|---------|
| 稳定的 `--json` 链式输出 | Journey 1 |
| 清晰分类的错误消息 + stderr 输出 + 非零退出码 | Journey 2 |
| `wi list --assigned-to me` | Journey 3 |
| 人类友好的默认输出格式 | Journey 3 |
| `--help` 无需认证即可访问 | Journey 4 |
| 线性可验证的配置步骤（auth status → whoami） | Journey 4 |

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. AI 作为主要用户的 CLI 设计范式**

传统 CLI 工具以人类为第一用户，AI 调用是事后考虑。yunxiao-cli 反转这一假设：AI Agent 是第一公民，所有设计决策（非交互式认证、稳定 JSON 输出、明确错误分类、`--force` 跳过确认）优先服务 AI 的可预期性需求；人类可用性是在此基础上的叠加，而非起点。

**2. SKILL 驱动的 CLI 需求规格**

SKILL 文件分两个阶段：**SKILL 草案**（设计约束，先行于实现）定义"AI 需要什么"，以 `skill-draft-yunxiao-cli-2026-03-30.md` 为基础，在 Epic 1 前完成，指导所有 CLI 命令的接口设计；**SKILL 正式版**（Epic 8 产出）在所有命令实现完成后，依据真实实现进行优化和验证。两者是同一文件的不同阶段，而非相互独立的文档。这将 LLM 可调用性从"功能"提升为"设计约束"，形成闭环：SKILL 草案定义接口 → CLI 实现接口 → SKILL 正式版验证接口。

**3. 自然语言 → 结构化操作的完整链路**

yunxiao-cli + SKILL 构成了一条完整链路：用户自然语言指令 → AI 读 SKILL 知道用哪些命令 → CLI 执行 → 结构化 JSON 返回供 AI 推理。这条链路的每个环节都是精心设计的，任何一环的失败都会断链，因此设计必须端到端可靠。

### Validation Approach

- **AI 可调用性验证**：用 Claude 等 LLM 仅读取 SKILL 文件，尝试完成标准工作流（创建 Bug、更新状态、Sprint 查看），验证无额外提示即可正确调用
- **链路完整性验证**：对每条 Journey 执行端到端测试，确认 JSON 输出可被下一步命令直接消费
- **人类可用性验证**：团队成员在无文档指引下通过 `--help` 完成首次操作

### Risk Mitigation

| 风险 | 缓解措施 |
|------|---------|
| SKILL 与 CLI 实现不同步 | SKILL 草案先行，实现以 SKILL 为准，发布前对照验证 |
| LLM 理解 SKILL 方式差异 | 用多个 LLM 测试 SKILL，覆盖 Claude / GPT 主流模型 |
| JSON schema 变更破坏 AI 依赖 | schema 向后兼容约束，breaking change 须 major version bump |

## CLI Tool Specific Requirements

### Project-Type Overview

yunxiao-cli 是一个**多模块层级 CLI 工具**（`yunxiao <module> <subcommand>`），模块清晰分离（`wi`、`sprint`、`project`、`auth`、`status`、`user`、`pipeline`），便于 AI 理解命令归属。设计上优先服务非交互式脚本场景（AI Agent / CI），同时保持人类交互可用性。

### Command Structure

- **层级**：`yunxiao <module> <subcommand> [args] [flags]`，层级固定，不扁平化
- **帮助**：`yunxiao --help` / `yunxiao <module> --help` 无需认证即可访问，始终显示完整命令树
- **全局 flag**：`--json` 在所有 list/view 命令生效；`--token`、`--org-id` 为全局 option，由 `program.opts()` 读取，优先级最高

### Output Formats

- **默认**：人类可读的表格/文本输出，使用 ANSI 彩色终端着色
- **`--json` 模式**：完整 JSON 对象，无终端着色，输出到 stdout；核心约束：**stdout 只输出纯 JSON，着色/提示文字不得写入 stdout**（应写入 stderr），确保 LLM 可直接解析
- **错误统一**：无论是否 `--json` 模式，错误信息写入 **stderr**，非零退出码；`--json` 模式下错误同样输出 JSON 格式（`{"error": "描述", "code": "ERROR_CODE"}`），保持 LLM 解析一致性

**错误码分类：**

| code | 含义 |
|------|------|
| `AUTH_FAILED` | 认证失败（token 无效/过期） |
| `AUTH_MISSING` | 未配置认证信息 |
| `NOT_FOUND` | 资源不存在（工作项、项目等） |
| `INVALID_ARGS` | 参数错误或缺失 |
| `API_ERROR` | 云效 API 返回错误 |

### Config Schema

- **命令行参数**（最高优先级）：`--token`、`--org-id` 全局 option
- **Config 文件**（次之）：`~/.yunxiao/config.json`，明文存储，文档标注安全风险
- **环境变量**（再次）：`YUNXIAO_PAT`、`YUNXIAO_ORG_ID`、`YUNXIAO_PROJECT_ID`
- **优先级**：命令行参数 > Config 文件 > 环境变量 > 默认值

### Scripting Support

- **`--limit`**：默认 **20**（保护 AI 上下文窗口），AI 可按需显式传更大值；`--json` 模式下所有 list 命令输出须包含 `total` 字段，使 AI 可判断结果是否被截断并决定是否增大 `--limit` 重新查询
- **`--force`**：破坏性操作（`wi delete`）跳过交互确认，AI 场景必用
- **退出码**：成功 `0`，失败非零（可用于脚本流程控制）
- **非交互式认证**：`auth login --token <PAT> --org-id <orgId>` 两参数同时提供即非交互式，适用于 CI 初始化

### Implementation Considerations

- API 层（`api.js`）统一处理返回值解包，命令层接收可直接使用的数据，不处理 `{ data: [...] }` 包装
- 命令始终注册（不按认证状态条件注册），执行时检查认证状态并返回明确错误
- `pnpm-lock.yaml` 移除，统一使用 npm

## Scope Definition

### In Scope (MVP)

| 范畴 | 内容 |
|------|------|
| 工作项生命周期 | 创建、查看、列表、更新（状态/负责人/Sprint）、删除、评论 |
| 前置查询命令 | 工作项类型、状态列表、成员查找、Sprint 列表/详情、项目列表、whoami |
| 认证管理 | login（交互式 + 非交互式）、status、logout；环境变量 + config 文件双模式 |
| 输出格式 | 人类可读默认输出 + `--json` 机器可读模式；统一 JSON 错误格式 |
| 流水线触发 | 云效 DevOps 流水线触发及状态查看（list / run / status） |
| GitHub Actions CI 自动发布 | 测试 + 自动 npm publish 流水线 |
| 完整 README 文档 | 安装、配置、命令参考、使用示例 |
| 发布 | npm 发布 `@kongsiyu/yunxiao-cli`，binary `yunxiao`，全局安装 + npx 均可用 |
| 测试 | Node.js 内置测试运行器，API 层全函数 + 序列号解析专项 + 命令层核心输出路径 |

### Out of Scope (MVP)

| 范畴 | 理由 |
|------|------|
| Shell 自动补全 | 便利功能，不影响主工作流 |
| 交互式 TUI 模式 | 人类体验增强，非 AI 场景必须 |
| 多组织 / 多项目切换 | 环境变量切换已可满足当前场景 |
| 里程碑 / 标签管理 | 非 Sprint 工作流核心路径 |
| Codeup 代码仓库操作 | 超出工作项管理范围，Post-MVP |

### Non-Functional Requirements

**性能：**
- 单命令响应时间 ≤ 3 秒（正常网络条件，云效 API 响应时间占主体）
- `--limit 20` 默认值保护 AI 上下文窗口；直接透传 API 分页参数，不做本地缓存

**安全：**
- PAT 存储在 config 文件时明文，文档须标注安全风险并建议使用环境变量
- 命令不输出 token 到 stdout/stderr（仅在 `auth status` 中显示掩码预览）
- 不收集用户数据，不发起任何遥测请求

**兼容性：**
- Node.js ≥ 18（LTS 版本，内置测试运行器原生支持）
- 跨平台：macOS / Linux / Windows（Git Bash）
- 无额外系统依赖，纯 npm 安装

**可靠性：**
- API 错误不崩溃，返回结构化错误信息 + 非零退出码
- `--help` 命令在任何状态下（含认证失效）稳定运行
- 序列号格式（`GJBL-1`）与 UUID 格式两种输入方式均稳定处理

**可维护性：**
- API 层 / 命令层职责分离，新增命令无需修改 API 层
- 错误码集中定义，不在命令层 hardcode 错误字符串

## Epics

### Epic 1：核心基础设施与认证

**目标**：建立 CLI 的运行基础——项目骨架重构、配置管理、认证系统，同时完成全量 API 验证 spike，确保后续所有命令可以可靠运行。

**Stories：**
- 1.1 初始化 CLI 项目骨架重构（删除 attachment/query/storage 死代码，清理 api.js 死代码，删除 pnpm-lock.yaml）
- 1.2 配置管理模块（`config.js`，优先级：命令行参数 > Config 文件 > 环境变量）
- 1.3 输出层模块（`output.js`，`printTable()` / `printJson()` / `printError()`，保证 `--json` 模式 stdout 只输出纯 JSON）
- 1.4 错误定义模块（`errors.js`，ERROR_CODE 枚举 + 结构化错误类）
- 1.5 `auth login`（交互式 + `--token --org-id` 非交互式）/ `auth status` / `auth logout`
- 1.6 `whoami`（验证认证 + 显示当前用户信息）+ 命令始终注册（移除条件注册）
- 1.7 全量 API 验证 spike：对 MVP 中所有云效 API 端点逐一验证（路径正确性、必填参数、serialNumber 兼容性、返回字段结构），结果记录到 `_bmad-output/research/api-verification-v2.md`，指导 Epic 2~5；**额外验证**：`wi view <serialNumber>` 是否可直接将 `GJBL-1` 作为 workitem ID 传入详情接口（而非通过 searchWorkitems 搜索），若可行则 `resolveWorkitemId` 仅用于 `wi update`/`wi delete`/`wi comment` 等非 view 场景

---

### Epic 2：工作项生命周期管理

**目标**：实现工作项的完整 CRUD + 评论操作，覆盖 AI Agent 完成 Sprint 工作流所需的全部核心命令。

**Stories：**
- 2.1 `wi list`（支持 `--sprint`、`--status`、`--assigned-to`、`--category` 过滤 + `--limit`，修复默认 category 为 "Req,Task,Bug"；`--assigned-to me` 中 `me` 解析为当前认证用户的 userId，通过 `whoami` API 在命令执行时动态获取）
- 2.2 `wi view <id|序列号>`（支持 `GJBL-1` 格式）
- 2.3 `wi create`（含类型、标题、负责人、Sprint 分配；处理 workitemTypeId 便捷转换逻辑）
- 2.4 `wi update <id|序列号>`（含状态、负责人、Sprint 更新）
- 2.5 `wi delete <id|序列号>`（含 `--force` 跳过确认）
- 2.6 `wi comment <id|序列号> <text>`（添加评论）
- 2.7 `wi comments <id|序列号>`（列出评论）
- 2.8 序列号解析核心逻辑修复（`resolveWorkitemId`：全类型搜索 + `serialNumber` 字段精确匹配）+ 专项测试

---

### Epic 3：前置查询命令

**目标**：提供工作项操作所需的前置 ID 查询命令，使 AI 能完成两步依赖工作流。

**Stories：**
- 3.1 `wi types`（获取工作项类型列表 + typeId，按 category 筛选）
- 3.2 `status list`（使用 GetWorkitemWorkflow API，按 workitemTypeId 查工作流状态；便捷模式：`--category` 自动查类型再查状态）
- 3.3 `user list` / `user search <keyword>`（ListProjectMembers API，获取成员 userId）
- 3.4 `project list`（获取可用项目列表 + projectId）

---

### Epic 4：Sprint 管理

**目标**：支持 Sprint 进度查看，使 AI 能在执行工作项操作前了解当前 Sprint 状态。

**Stories：**
- 4.1 `sprint list`（修复 API 路径：`/projects/{id}/sprints`；支持 `--status` 过滤）
- 4.2 `sprint view <id>`（GetSprintInfo + SearchWorkitems 组合：Sprint 基本信息 + 工作项完成统计；若任一 API 调用失败，命令完全失败并返回错误，不返回部分数据）

---

### Epic 5：流水线触发

**目标**：支持触发和查看云效 DevOps 流水线运行状态，使 AI 能在工作流中集成 CI/CD 操作。

> **注**：API 路径待 Epic 1 Story 1.7 全量验证后确认。

**Stories：**
- 5.1 `pipeline list`（列出项目流水线）
- 5.2 `pipeline run <id>`（触发流水线运行）
- 5.3 `pipeline status <runId>`（查看运行状态）

---

### Epic 6：发布与分发

**目标**：将 CLI 发布到 npm，确保全局安装和 npx 均可用，并配置 GitHub Actions 自动化发布流程。

**Stories：**
- 6.1 npm 包配置（`package.json`：name `@kongsiyu/yunxiao-cli`，bin `yunxiao`，完整元数据）
- 6.2 手动发布验证（`npm publish` + 全局安装测试 + npx 测试）
- 6.3 GitHub Actions CI：测试自动化（PR / push 触发）
- 6.4 GitHub Actions CD：npm 自动发布（tag 触发）

---

### Epic 7：测试覆盖

**目标**：建立可靠的测试基础，覆盖 API 层核心函数、序列号解析专项逻辑、命令层核心输出路径。

**Stories：**
- 7.1 测试基础设施配置（node:test runner，mock 框架，CI 集成）
- 7.2 API 层测试（所有 API 函数，mock 云效 API 响应）
- 7.3 序列号解析专项测试（`resolveWorkitemId`，全类型 + 精确匹配 + 未找到错误验证）
- 7.4 命令层测试（核心命令 `--json` 输出格式验证 + 错误码验证）

---

### Epic 8：文档

**目标**：提供完整的 README 文档和优化后的 SKILL 文件，覆盖人类安装使用和 LLM 调用两种场景。

**Stories：**
- 8.1 README：安装与配置（npm install、环境变量、config 文件、优先级说明）
- 8.2 README：命令参考（所有命令、参数、示例，含两步依赖工作流示例）
- 8.3 README：常见工作流示例（AI Agent 场景 + 人类场景）
- 8.4 SKILL 文件优化（When to Use、命令参考、工作流模板、错误处理指南，供 LLM 读取）

### Epic 9：稳定性修复与 v0.2 增强

**目标**：修复 MVP 发布后用户反馈的 Bug，消除复盘识别的技术债务，并增加版本检测和多语言支持等增强功能，提升工具的稳定性和易用性。

**Stories（Bug 修复）：**
- 9.1 auth login PAT 生成地址修正 + 交互提示优化（GitHub #62：PAT URL 错误，光标位置无明显粘贴提示）
- 9.2 project list 输出排版修复（GitHub #64：列宽混乱）
- 9.3 `resolveWorkitemId` 分页完整性改进（复盘 TD-1：当前 perPage: 50 上限，评估 API 是否支持 serialNumber 过滤参数）

**Stories（稳定性改进）：**
- 9.4 `sprint view` 工作项 done 状态 schema 固化（复盘 TD-2：通过实际 API 调用确认 status 字段 schema，替换多级降级推断逻辑）

**Stories（功能增强）：**
- 9.5 版本检测与更新提示（GitHub #65：启动时检查 npm registry 最新版本，提示用户更新）
- 9.6 多语言支持——中文优先（GitHub #63：命令输出、错误消息、帮助文本中文化）

---

### Epic 10：Codeup 集成（v1.1.0 已交付基线）

**目标**：将 CLI 从云效工作项操作扩展到 Codeup 仓库与 MR 的最小协作闭环，验证 `repo -> mr list -> mr view -> mr create` 扩展模式。

**Stories：**
- 10.1 Codeup API 验证与仓库/MR 端点确认 Spike
- 10.2 `repo list`
- 10.3 `repo view`
- 10.4 `mr list`
- 10.5 `mr view`
- 10.6 `mr create`

---

### Epic 11：v1.2.0 CLI 可用性收口与中文化 rollout

**目标**：把 i18n 从 foundation-only 推进到用户可见高频命令中文体验，同时保持 AI 可消费 JSON schema 不变。

**Stories：**
- 11.1 i18n 缺口审计与 rollout 范围锁定
- 11.2 高频命令人类可读输出中文化 rollout
- 11.3 README / SKILL 边界补充：中文化范围、JSON 字段不翻译、已知限制

---

### Epic 12：v1.2.0 AI workflow 契约加固与 release gate

**目标**：把真实 CLI smoke、stdout/stderr/JSON/错误码/version metadata 合同和发布前检查模板化，降低 AI workflow 回归风险。

**Stories：**
- 12.1 真实 CLI smoke matrix 与执行入口
- 12.2 JSON/stdout/stderr/error-code 契约回归测试补强
- 12.3 Release checklist 模板化
- 12.4 v1.2.0 发布前验收与 release evidence 汇总

---

### Epic 13：v1.2.0 BMAD 工件卫生与 Codeup 证据治理

**目标**：修复 story 文件、任务勾选、`sprint-status.yaml` 与实际交付漂移的问题，并为后续 Codeup 扩展建立 evidence level 约束。

**Stories：**
- 13.1 Story 工件状态同步规则与 foundation-only 标记
- 13.2 Codeup evidence ledger
- 13.3 v1.2.0 handoff index 与执行追踪工件

---

## Technical Architecture

### Current State Analysis

现有代码库已建立基本骨架，核心模式已定型，但以下问题需在新功能开发前修复：

| 现有内容 | 状态 |
|---------|------|
| Commander.js CLI 框架 | 已建立，保留 |
| axios HTTP 客户端 | 已建立，保留 |
| chalk 输出着色 | 已建立，保留 |
| ESM 模块（`"type": "module"`） | 已建立，保留 |
| API 层 / 命令层分离 | 已建立，保留 |
| `resolveWorkitemId` 序列号解析 | **Bug**：用 subject 搜索不准确，修复方案：全类型搜索 + `serialNumber` 精确匹配（已由 API 验证报告确认可行） |
| `listSprints` API 路径 | **Bug**：projectId 应在路径中，非查询参数 |
| `searchWorkitems` 默认 category | **Bug**：默认 "Req"，应改为 "Req,Task,Bug" |
| 命令条件注册（`if (client && orgId)`） | **架构问题**：始终注册命令，执行时检查认证 |
| 配置优先级 | **需调整**：当前环境变量 > config，目标：命令行 > config > 环境变量 |
| `--json` 全局 flag | 未实现，需新增 |
| sprint view / user / status / pipeline 命令 | 未实现，需新增 |
| attachment/query/storage 命令 | 需删除（死代码）|
| 测试 | 缺失，需新增 |

### Target Architecture

```
yunxiao-cli/
├── src/
│   ├── index.js          # CLI 入口：解析全局 flag，注册所有命令
│   ├── api.js            # API 层：所有云效 API 调用，返回解包后的数据
│   ├── config.js         # 配置管理：优先级合并（命令行 > config > 环境变量）、读写 config.json
│   ├── output.js         # 输出层：printTable() / printJson() / printError()
│   │                     # 核心约束：--json 模式下 stdout 只输出纯 JSON
│   ├── errors.js         # 错误定义：ERROR_CODE 枚举 + 结构化错误类
│   └── commands/
│       ├── auth.js       # auth login / status / logout
│       ├── workitem.js   # wi list / view / create / update / delete / comment / comments / types
│       ├── sprint.js     # sprint list / view
│       ├── project.js    # project list / view
│       ├── query.js      # status list / user list / user search（重写，非旧文件）
│       └── pipeline.js   # pipeline list / run / status（新增）
├── test/
│   ├── api.test.js       # API 层全函数测试
│   ├── resolve.test.js   # resolveWorkitemId 专项测试
│   └── commands.test.js  # 命令层核心输出路径测试
├── .github/workflows/
│   ├── test.yml          # PR / push 触发测试
│   └── publish.yml       # tag 触发 npm 发布
├── SKILL.md              # LLM 调用指南（优化版）
└── package.json          # name: @kongsiyu/yunxiao-cli
```

### Key Design Decisions

**1. 命令始终注册**：移除 `if (client && orgId)` 条件，始终注册所有命令。命令执行时检查认证状态并返回明确错误（`AUTH_MISSING`）。

**2. 配置管理集中到 `config.js`**：统一优先级合并逻辑，`--token`/`--org-id` 作为 Commander.js 全局 option，`program.opts()` 在任意命令中读取。

**3. 输出层集中到 `output.js`**：`--json` 在根 program 上注册为全局 option；`--json` 模式下所有提示信息写 stderr，stdout 只有 JSON。

**4. API 层返回解包数据**：所有 API 函数负责解包 `res.data`，命令层收到可直接使用的数组/对象。

**5. serialNumber 解析**：使用 `searchWorkitems` 全类型搜索后，在结果中精确匹配 `serialNumber` 字段（具体实现视 Epic 1 Story 1.7 验证结果而定）。

### Technology Stack

| 层级 | 技术 | 版本 |
|------|------|------|
| CLI 框架 | Commander.js | ^12.0.0 |
| HTTP 客户端 | axios | ^1.7.0 |
| 终端着色 | chalk | ^5.3.0 |
| 运行时 | Node.js | ≥ 18 LTS |
| 模块系统 | ESM | `"type": "module"` |
| 测试框架 | node:test | 内置（Node 18+） |
| 包管理 | npm | 移除 pnpm-lock.yaml |

### API Integration

- **Base URL**：`https://openapi-rdc.aliyuncs.com`
- **认证**：`x-yunxiao-token` header（PAT）
- **路径前缀**：Projex 模块 `/oapi/v1/projex/organizations/{orgId}/`；Flow 模块 `/oapi/v1/flow/organizations/{orgId}/`
- **已修复 Bug（v0.1.x）**：listSprints 路径（projectId 移入 path）、searchWorkitems 默认 category（改为 "Req,Task,Bug"）、resolveWorkitemId 搜索逻辑（全类型 + serialNumber 精确匹配）
- **API 验证状态**：全量 MVP 端点已通过 Story 1.7 验证并在 Epic 2–5 实现中确认（详见 `_bmad-output/research/api-verification-v2.md`）

## Document Status

- **版本**：1.3
- **作者**：Sue
- **创建日期**：2026-03-30
- **最后更新**：2026-04-19
- **状态**：v1.1.0 已发布；v1.2.0 已通过 BMAD Correct Course 确认为“可用性收口 + AI workflow 契约加固版本”，进入 ready-for-handoff 规划阶段

### Open Questions

1. ~~流水线 API 路径待 Epic 1 Story 1.7 全量验证后确认~~ **已解决**：Epic 5 实现确认，CreatePipelineRun / GetPipelineRun / ListPipelineRuns 使用 `/oapi/v1/flow/organizations/{orgId}/pipelines/{id}/runs`；ListPipelines 使用旧版路径 `/organization/{orgId}/pipelines`（已实测通过）
2. ~~`category: "Req,Task,Bug"` 逗号分隔在 `searchWorkitems` 中是否生效（实施中验证）~~ **已解决**：Story 2.1 实现中已验证，逗号分隔 category 参数生效，searchWorkitems 可同时搜索多类型工作项
3. ~~是否有未来对外发布（npm public）的需求，或长期保持内部工具定位~~ **已解决**：确认对外公开发布，Yunxiao API 无内网限制，用户使用自己的 PAT 与 ORG ID 访问各自的云效组织
4. ~~v1.2.0 第一优先级是可用性债务、Codeup 扩张还是 AI workflow 契约加固~~ **已解决**：采用“可用性收口 + AI workflow 契约加固”，Codeup 扩张仅保留 evidence ledger。
5. **待后续确认（v1.3.0 前）**：Codeup live-test 环境是否长期可用，以及 MR merge/comment/approval/diff 等高阶能力的优先级。
