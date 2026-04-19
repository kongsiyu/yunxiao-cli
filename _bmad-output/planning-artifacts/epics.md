---
stepsCompleted: [step-01-validate-prerequisites]
inputDocuments:
  - yunxiao-cli/_bmad-output/planning-artifacts/prd.md
lastEdited: '2026-04-19'
editHistory:
  - date: '2026-04-19'
    changes: '执行 v1.2.0 BMAD Correct Course：补齐 Epic 10 已交付基线，新增 Epic 11-13，明确后续阶段规划、首批 create-story 候选、评审验收波次、发布前门禁与 v1.3.0/post-MVP 后置范围'
---

# yunxiao-cli - Epic Breakdown

## Overview

本文档将 yunxiao-cli PRD（含架构章节）中的需求分解为可实施的 Epic 和 Story，覆盖工作项管理、认证、前置查询、Sprint 管理、流水线触发、发布、测试、文档、Codeup 集成，以及 v1.2.0 的可用性收口、AI workflow 契约加固和 BMAD 工件治理。

## Requirements Inventory

### Functional Requirements

FR1: `wi list` 命令支持 `--sprint`、`--status`、`--assigned-to`、`--category` 过滤及 `--limit` 分页；`--assigned-to me` 动态解析为当前用户 userId
FR2: `wi view <id|序列号>` 命令支持 UUID 和序列号格式（如 `GJBL-1`）
FR3: `wi create` 命令支持指定工作项类型、标题、负责人、Sprint 分配
FR4: `wi update <id|序列号>` 命令支持更新状态、负责人、Sprint
FR5: `wi delete <id|序列号>` 命令支持 `--force` 跳过交互确认
FR6: `wi comment <id|序列号> <text>` 命令添加工作项评论
FR7: `wi comments <id|序列号>` 命令列出工作项评论
FR8: `wi types` 命令获取工作项类型列表和 typeId，支持按 category 筛选
FR9: `auth login` 命令支持交互式和 `--token --org-id` 非交互式两种模式
FR10: `auth status` 命令显示当前认证状态（含掩码 token 预览）
FR11: `auth logout` 命令清除认证信息
FR12: `whoami` 命令验证认证并显示当前用户信息
FR13: `status list` 命令按 workitemTypeId 查工作流状态；支持 `--category` 便捷模式（自动查类型再查状态）
FR14: `user list` 命令列出项目成员（含 userId）
FR15: `user search <keyword>` 命令按关键字搜索项目成员
FR16: `project list` 命令获取可用项目列表和 projectId
FR17: `sprint list` 命令修复 API 路径，支持 `--status` 过滤
FR18: `sprint view <id>` 命令展示 Sprint 基本信息和工作项完成统计；任一 API 失败则命令完全失败
FR19: `pipeline list` 命令列出项目流水线
FR20: `pipeline run <id>` 命令触发流水线运行
FR21: `pipeline status <runId>` 命令查看流水线运行状态
FR22: 所有 list/view 命令支持 `--json` 全局 flag；stdout 只输出纯 JSON，chalk/提示文字写入 stderr
FR23: `--json` 模式下所有 list 命令输出包含 `total` 字段，使 AI 可判断结果是否被截断
FR24: 错误信息写入 stderr，使用非零退出码；`--json` 模式下错误输出 `{"error": "...", "code": "ERROR_CODE"}` 格式
FR25: `--help` 命令无需认证即可访问，始终显示完整命令树
FR26: 配置优先级：命令行参数 > `~/.yunxiao/config.json` > 环境变量（`YUNXIAO_PAT`/`YUNXIAO_ORG_ID`/`YUNXIAO_PROJECT_ID`）
FR27: `resolveWorkitemId` 序列号解析：全类型搜索 + `serialNumber` 字段精确匹配
FR28: 删除 attachment/query/storage 死代码、清理 api.js 死代码、删除 pnpm-lock.yaml
FR29: 全量 API 验证 spike，额外验证 `wi view <serialNumber>` 直传详情接口可行性，结果记录到 `_bmad-output/research/api-verification-v2.md`
FR30: npm 发布 `@kongsiyu/yunxiao-cli`，binary `yunxiao`，支持全局安装和 npx
FR31: GitHub Actions CI（PR/push 触发测试）和 CD（tag 触发 npm 自动发布）
FR32: 完整 README 文档（安装、配置、命令参考、使用示例、工作流示例）
FR33: 优化 SKILL 文件（When to Use、命令参考、工作流模板、错误处理指南）
FR34: node:test 测试覆盖（API 层全函数 + 序列号解析专项 + 命令层核心输出路径）
FR35: 版本检测与更新提示：启动时检查 npm registry 最新版本，提示写 stderr，不污染 `--json` stdout
FR36: 多语言支持：中文优先，human-readable 输出支持中文，`--json` 字段名保持英文
FR37: Codeup 仓库命令：`repo list` / `repo view` 支持仓库发现与详情查看
FR38: Codeup MR 命令：`mr list` / `mr view` / `mr create` 支持最小 MR 协作闭环
FR39: v1.2.0 i18n 缺口审计：输出已接入/未接入模块、高频命令 rollout 范围和验收要求
FR40: v1.2.0 高频命令中文化 rollout：覆盖 `auth`、`whoami`、`project list`、`wi list/view/update`、`sprint list/view` 的 human-readable 输出
FR41: v1.2.0 AI workflow 契约回归：真实 CLI smoke 检查 `--json`、stdout/stderr、错误码、version metadata
FR42: v1.2.0 release checklist 模板化：固定 runtime/package version、tag、测试、smoke、pack dry-run、发布流水线和 release note 检查项
FR43: v1.2.0 BMAD 工件卫生：story `Status`、Task/Subtask 勾选、`sprint-status.yaml` 回写规则与 foundation-only 标记
FR44: v1.2.0 Codeup evidence ledger：记录候选 API 的 endpoint、auth、必填字段、实测状态、evidence level 和风险等级
FR45: v1.2.0 handoff index：明确 story 执行顺序、handoff recipients、评审验收波次和后置范围

### NonFunctional Requirements

NFR1: 单命令响应时间 ≤ 3 秒（正常网络条件，云效 API 响应时间占主体）
NFR2: `--limit` 默认值为 20，保护 AI 上下文窗口；AI 可按需传更大值
NFR3: PAT 存储在 config 文件时明文，文档须标注安全风险并建议使用环境变量；命令不输出 token 到 stdout/stderr
NFR4: 不收集用户数据，不发起任何遥测请求
NFR5: 支持 Node.js ≥ 18 LTS，跨平台（macOS / Linux / Windows Git Bash），无额外系统依赖，纯 npm 安装
NFR6: API 错误不崩溃，返回结构化错误信息 + 非零退出码；`--help` 在任何状态下稳定运行
NFR7: `--json` 输出 schema 稳定，向后兼容；breaking change 须 major version bump
NFR8: API 层 / 命令层职责分离；错误码集中定义（`errors.js`），不在命令层 hardcode 错误字符串

### Additional Requirements

来自 PRD Technical Architecture 章节：

- **技术栈**：Commander.js ^12.0.0、axios ^1.7.0、chalk ^5.3.0、Node.js ≥ 18、ESM 模块
- **API 集成**：Base URL `https://openapi-rdc.aliyuncs.com`，认证 header `x-yunxiao-token`，路径前缀 `/oapi/v1/projex/organizations/{orgId}/`
- **命令始终注册**：移除 `if (client && orgId)` 条件注册，执行时检查认证
- **API 层解包**：所有 API 函数解包 `res.data`，命令层接收可直接使用的数据
- **已知 Bug 修复**：`listSprints` 路径（projectId 应在路径中）、`searchWorkitems` 默认 category（"Req" → "Req,Task,Bug"）、`resolveWorkitemId` 搜索逻辑
- **目标目录结构**：`src/index.js`、`src/api.js`、`src/config.js`、`src/output.js`、`src/errors.js`、`src/commands/{auth,workitem,sprint,project,query,pipeline}.js`
- **AI workflow 契约**：`--json` stdout 必须保持纯 JSON；提示、更新通知和 smoke 诊断写 stderr；错误码保持稳定且可被 agent 分支处理
- **i18n rollout 分层**：foundation-only 与 user-visible rollout 必须分开验收；用户可见中文化不得改变 JSON schema 字段名
- **外部 API evidence level**：Codeup 后续扩展前必须区分 document-only、script-ready、live-tested、tenant-limited 等证据等级
- **BMAD 工件回写**：story 完成前必须同步 story 文件头状态、Task/Subtask 勾选和 `sprint-status.yaml`；只完成基础设施时必须标记 foundation-only

### UX Design Requirements

不适用（CLI 工具，无图形界面）。

### FR Coverage Map

| FR | Epic | Story |
|----|------|-------|
| FR28 | Epic 1 | 1.1 |
| FR26 | Epic 1 | 1.2 |
| FR22, FR23 | Epic 1 | 1.3 |
| FR24 | Epic 1 | 1.4 |
| FR9, FR10, FR11 | Epic 1 | 1.5 |
| FR12, FR25 | Epic 1 | 1.6 |
| FR29 | Epic 1 | 1.7 |
| FR27 | Epic 2 | 2.1 |
| FR1, FR23 | Epic 2 | 2.2 |
| FR2 | Epic 2 | 2.3 |
| FR3 | Epic 2 | 2.4 |
| FR4 | Epic 2 | 2.5 |
| FR5 | Epic 2 | 2.6 |
| FR6 | Epic 2 | 2.7 |
| FR7 | Epic 2 | 2.8 |
| FR8 | Epic 3 | 3.1 |
| FR13 | Epic 3 | 3.2 |
| FR14, FR15 | Epic 3 | 3.3 |
| FR16 | Epic 3 | 3.4 |
| FR17 | Epic 4 | 4.1 |
| FR18 | Epic 4 | 4.2 |
| FR19 | Epic 5 | 5.1 |
| FR20 | Epic 5 | 5.2 |
| FR21 | Epic 5 | 5.3 |
| FR30 | Epic 6 | 6.1, 6.2 |
| FR31 | Epic 6 | 6.3, 6.4 |
| FR34 | Epic 7 | 7.1, 7.2, 7.3, 7.4 |
| FR32 | Epic 8 | 8.1, 8.2, 8.3 |
| FR33 | Epic 8 | 8.4 |
| FR35 | Epic 9 | 9.5 |
| FR36 | Epic 9, Epic 11 | 9.6, 11.1, 11.2 |
| FR37 | Epic 10 | 10.2, 10.3 |
| FR38 | Epic 10 | 10.4, 10.5, 10.6 |
| FR39 | Epic 11 | 11.1 |
| FR40 | Epic 11 | 11.2 |
| FR41 | Epic 12 | 12.1, 12.2 |
| FR42 | Epic 12 | 12.3, 12.4 |
| FR43 | Epic 13 | 13.1 |
| FR44 | Epic 13 | 13.2 |
| FR45 | Epic 13 | 13.3 |

## Epic List

1. **Epic 1：核心基础设施与认证** — CLI 骨架重构、配置管理、认证系统、全量 API 验证
2. **Epic 2：工作项生命周期管理** — 完整 CRUD + 评论操作
3. **Epic 3：前置查询命令** — 工作项类型、状态、成员、项目查询
4. **Epic 4：Sprint 管理** — Sprint 列表与详情查看
5. **Epic 5：流水线触发** — 流水线列表、触发、状态查看
6. **Epic 6：发布与分发** — npm 发布 + GitHub Actions 自动化
7. **Epic 7：测试覆盖** — API 层、序列号解析、命令层测试
8. **Epic 8：文档** — README + SKILL 文件
9. **Epic 9：稳定性修复与 v0.2 增强** — Bug 修复、技术债消除、版本检测、多语言支持
10. **Epic 10：Codeup 集成（v1.1.0 已交付基线）** — repo/MR 最小协作闭环
11. **Epic 11：v1.2.0 CLI 可用性收口与中文化 rollout** — i18n 缺口审计、高频命令中文化、README/SKILL 边界补充
12. **Epic 12：v1.2.0 AI workflow 契约加固与 release gate** — 真实 CLI smoke、契约回归、release checklist、发布前证据汇总
13. **Epic 13：v1.2.0 BMAD 工件卫生与 Codeup 证据治理** — story 状态同步、foundation-only 标记、Codeup evidence ledger、handoff index

---

## Epic 1：核心基础设施与认证

**目标**：建立 CLI 的运行基础——项目骨架重构、配置管理、认证系统，同时完成全量 API 验证 spike，确保后续所有命令可以可靠运行。

### Story 1.1：初始化 CLI 项目骨架重构

As a developer,
I want the codebase cleaned of dead code and unified to npm,
So that all subsequent stories start from a clean, predictable foundation.

**Acceptance Criteria:**

**Given** 现有代码库包含 attachment/query/storage 命令文件及 pnpm-lock.yaml
**When** 执行骨架重构
**Then** `src/commands/attachment.js`、`src/commands/query.js`（旧版）、`src/commands/storage.js` 被删除
**And** `api.js` 中对应的死代码函数被清理
**And** `pnpm-lock.yaml` 被删除，项目统一使用 npm

**Given** 重构后的代码库
**When** 执行 `npm install && node src/index.js --help`
**Then** 命令正常运行，不报告缺失模块错误

---

### Story 1.2：配置管理模块

As a developer,
I want a centralized `config.js` module with correct priority merging,
So that all commands consistently read configuration from the right source.

**Acceptance Criteria:**

**Given** 用户同时设置了环境变量 `YUNXIAO_PAT=env-token` 和 config 文件 `token: file-token`
**When** 执行任意命令（不传 `--token`）
**Then** 使用 `file-token`（config 文件优先于环境变量）

**Given** 用户传入 `--token cli-token`
**When** 执行任意命令
**Then** 使用 `cli-token`（命令行参数最高优先级）

**Given** 仅设置环境变量认证信息
**When** 执行任意命令
**Then** 命令正常读取环境变量中的 token 和 orgId

**Given** `config.js` 模块
**When** 调用 `saveConfig({ token, orgId })`
**Then** 配置被写入 `~/.yunxiao/config.json`，格式为合法 JSON

---

### Story 1.3：输出层模块

As a developer,
I want a centralized `output.js` module with `printTable()`, `printJson()`, `printError()`,
So that `--json` mode always outputs pure JSON to stdout without any chalk contamination.

**Acceptance Criteria:**

**Given** `--json` 全局 flag 已激活
**When** 任意命令正常返回数据
**Then** stdout 只包含合法 JSON，不含 chalk 着色字符、提示文字或 ANSI 转义序列

**Given** `--json` 全局 flag 已激活
**When** 命令发生错误
**Then** stderr 输出 `{"error": "描述", "code": "ERROR_CODE"}` 格式 JSON
**And** stdout 无输出
**And** 退出码非零

**Given** `--json` 未激活（默认模式）
**When** 命令正常返回列表数据
**Then** stdout 输出人类可读的表格或文本，可使用 chalk 着色

**Given** `--json` 模式下任意 list 命令
**When** 命令返回数据
**Then** 返回的 JSON 对象包含 `total` 字段，值为数据集总条数

---

### Story 1.4：错误定义模块

As a developer,
I want a centralized `errors.js` with ERROR_CODE enum and structured error class,
So that all commands use consistent error codes without hardcoding strings.

**Acceptance Criteria:**

**Given** `errors.js` 模块
**When** 引用错误码
**Then** 以下错误码均已定义：`AUTH_FAILED`、`AUTH_MISSING`、`NOT_FOUND`、`INVALID_ARGS`、`API_ERROR`

**Given** 命令层抛出结构化错误
**When** `output.js` 处理该错误
**Then** 错误对象包含 `code`（ERROR_CODE 枚举值）和 `message`（人类可读描述）

**Given** 任意命令发生认证缺失错误
**When** 运行命令
**Then** 退出码为非零，stderr 包含 `AUTH_MISSING` 错误码

---

### Story 1.5：auth 命令

As an AI agent or team member,
I want `auth login`, `auth status`, and `auth logout` commands,
So that I can authenticate once and have credentials persisted for all subsequent commands.

**Acceptance Criteria:**

**Given** 用户执行 `auth login --token <PAT> --org-id <orgId>`（两参数均提供）
**When** 命令运行
**Then** 非交互式完成认证，credentials 写入 `~/.yunxiao/config.json`，退出码 0

**Given** 用户执行 `auth login`（不带参数）
**When** 命令运行
**Then** 进入交互式提示，分别请求 token 和 org-id

**Given** 认证信息已保存
**When** 执行 `auth status`
**Then** 显示已认证状态，token 以掩码形式显示（如 `*****1234`），不暴露完整 token

**Given** 已有认证信息
**When** 执行 `auth logout`
**Then** `~/.yunxiao/config.json` 中的 token/orgId 被清除，退出码 0

---

### Story 1.6：whoami 命令与命令始终注册

As a developer,
I want all commands always registered (not conditionally on auth state) and `whoami` to verify auth,
So that users always see the full command tree in `--help` and get clear errors when auth is missing.

**Acceptance Criteria:**

**Given** 未配置任何认证信息
**When** 执行 `yunxiao --help` 或 `yunxiao wi --help`
**Then** 显示完整命令树，不报错，退出码 0

**Given** 未配置认证信息
**When** 执行 `yunxiao wi list`
**Then** stderr 输出 `AUTH_MISSING` 错误，退出码非零（不是"命令不存在"错误）

**Given** 有效认证信息已配置
**When** 执行 `yunxiao whoami`
**Then** 显示当前用户信息（用户名、userId、邮箱等），退出码 0

**Given** 认证信息无效或已过期
**When** 执行 `yunxiao whoami`
**Then** stderr 输出 `AUTH_FAILED` 错误，退出码非零

---

### Story 1.7：全量 API 验证 Spike

As a developer,
I want a verified API compatibility report covering all MVP endpoints,
So that Epic 2-5 implementations are built on confirmed, correct API paths and parameters.

**Acceptance Criteria:**

**Given** MVP 中涉及的所有云效 API 端点
**When** 执行验证 spike
**Then** `_bmad-output/research/api-verification-v2.md` 文件被创建，包含每个端点的：路径正确性、必填参数、返回字段结构

**Given** `wi view <serialNumber>` 直传详情接口的可行性验证
**When** 尝试将 `GJBL-1` 格式直接作为 workitem ID 传入详情接口
**Then** 验证报告中明确记录：可行（直传）或不可行（需通过 searchWorkitems 解析）

**Given** `pipeline` 相关 API 端点
**When** 完成验证
**Then** 验证报告中确认 pipeline list/run/status 的正确 API 路径和参数

---

## Epic 2：工作项生命周期管理

**目标**：实现工作项的完整 CRUD + 评论操作，覆盖 AI Agent 完成 Sprint 工作流所需的全部核心命令。

> **实现顺序注意**：Story 2.1（序列号解析）必须先于 2.3/2.5/2.6/2.7/2.8 实现，后者依赖 `resolveWorkitemId`。

### Story 2.1：序列号解析核心逻辑修复

As a developer,
I want `resolveWorkitemId` to use full-type search with `serialNumber` exact matching,
So that `GJBL-1` format reliably resolves to the correct workitem UUID for all subsequent commands.

**Acceptance Criteria:**

**Given** 调用 `resolveWorkitemId("GJBL-1")`
**When** 执行解析
**Then** 使用 `searchWorkitems` API 搜索全类型（`Req,Task,Bug`），在结果中精确匹配 `serialNumber === "GJBL-1"` 的工作项

**Given** 序列号对应的工作项不存在
**When** 执行解析
**Then** 抛出 `NOT_FOUND` 错误，错误信息包含序列号

**Given** 序列号格式输入（含前缀字母）
**When** `resolveWorkitemId` 被调用
**Then** 正确区分序列号格式（`GJBL-1`）与 UUID 格式，UUID 格式直接返回，序列号格式触发搜索

---

### Story 2.2：wi list 命令

As an AI agent or team member,
I want to list workitems with flexible filtering options,
So that I can find the right workitems to act on without manual browsing.

**Acceptance Criteria:**

**Given** 有效认证信息，执行 `wi list --sprint <sprintId> --category Bug --json`
**When** 命令运行
**Then** stdout 输出合法 JSON，包含符合过滤条件的工作项列表和 `total` 字段

**Given** 执行 `wi list --assigned-to me --json`
**When** 命令运行
**Then** CLI 调用 whoami API 获取当前用户 userId，用该 userId 过滤工作项

**Given** 执行 `wi list`（不带 `--category`）
**When** 命令运行
**Then** 默认查询 category 为 `"Req,Task,Bug"`（不仅限于 "Req"）

**Given** 执行 `wi list --limit 5`
**When** 命令运行
**Then** 返回最多 5 条工作项，`--json` 模式下 `total` 字段反映实际总条数

**Given** 默认执行 `wi list`（不带 `--limit`）
**When** 命令运行
**Then** 默认返回最多 20 条工作项

---

### Story 2.3：wi view 命令

As an AI agent or team member,
I want to view a single workitem by ID or serial number,
So that I can get full details of a specific workitem for context or decision making.

**Acceptance Criteria:**

**Given** 执行 `wi view <uuid> --json`
**When** 命令运行
**Then** stdout 输出该工作项的完整详情 JSON

**Given** 执行 `wi view GJBL-1 --json`（序列号格式）
**When** 命令运行
**Then** CLI 正确解析序列号并返回对应工作项详情（使用 Epic 1 Story 1.7 验证确定的方案；依赖 Story 2.1 的 `resolveWorkitemId`）

**Given** 执行 `wi view <不存在的ID>`
**When** 命令运行
**Then** stderr 输出 `NOT_FOUND` 错误，退出码非零

---

### Story 2.4：wi create 命令

As an AI agent or team member,
I want to create a new workitem with type, title, assignee, and sprint,
So that I can programmatically create workitems as part of an automated workflow.

**Acceptance Criteria:**

**Given** 执行 `wi create --type <typeId> --title "Fix login bug" --assigned-to <userId> --sprint <sprintId> --json`
**When** 命令运行
**Then** 工作项被成功创建，stdout 输出新建工作项的 JSON（含 workitemId）

**Given** 执行 `wi create --type <typeId> --title "Test" --json`（不指定负责人和 Sprint）
**When** 命令运行
**Then** 工作项被成功创建，负责人和 Sprint 为空

**Given** 执行 `wi create`（不带必填参数 `--title`）
**When** 命令运行
**Then** stderr 输出 `INVALID_ARGS` 错误，退出码非零

---

### Story 2.5：wi update 命令

As an AI agent or team member,
I want to update a workitem's status, assignee, or sprint,
So that I can automate workitem lifecycle management.

**Acceptance Criteria:**

**Given** 执行 `wi update <id> --status <statusId> --json`
**When** 命令运行
**Then** 工作项状态被更新，stdout 输出更新后工作项的 JSON

**Given** 执行 `wi update GJBL-1 --assigned-to <userId>`（序列号格式）
**When** 命令运行
**Then** CLI 通过 `resolveWorkitemId`（Story 2.1）解析序列号，成功更新负责人

**Given** 执行 `wi update <id> --sprint <sprintId> --json`
**When** 命令运行
**Then** 工作项的 Sprint 关联被更新

---

### Story 2.6：wi delete 命令

As an AI agent or team member,
I want to delete a workitem with optional force flag,
So that I can clean up workitems programmatically without manual confirmation prompts.

**Acceptance Criteria:**

**Given** 执行 `wi delete <id> --force`
**When** 命令运行
**Then** 工作项被直接删除，无交互确认提示，退出码 0

**Given** 执行 `wi delete <id>`（不带 `--force`）
**When** 命令运行（人类场景）
**Then** 显示确认提示，用户输入 `y` 后删除，输入 `n` 后取消

**Given** 执行 `wi delete <不存在的ID> --force`
**When** 命令运行
**Then** stderr 输出 `NOT_FOUND` 错误，退出码非零

---

### Story 2.7：wi comment 命令

As an AI agent or team member,
I want to add a comment to a workitem,
So that I can document progress, questions, or decisions inline with the workitem.

**Acceptance Criteria:**

**Given** 执行 `wi comment <id> "Sprint review: completed" --json`
**When** 命令运行
**Then** 评论被成功添加，stdout 输出成功确认 JSON（含评论 ID 或工作项 ID）

**Given** 执行 `wi comment GJBL-1 "Fixed"`（序列号格式）
**When** 命令运行
**Then** CLI 通过 `resolveWorkitemId`（Story 2.1）解析序列号，成功添加评论

---

### Story 2.8：wi comments 命令

As an AI agent or team member,
I want to list all comments on a workitem,
So that I can understand the discussion history before taking action.

**Acceptance Criteria:**

**Given** 执行 `wi comments <id> --json`
**When** 命令运行
**Then** stdout 输出该工作项的评论列表 JSON，每条评论包含作者、时间、内容

**Given** 工作项无评论，执行 `wi comments <id> --json`
**When** 命令运行
**Then** stdout 输出空数组 `[]`，退出码 0

---

## Epic 3：前置查询命令

**目标**：提供工作项操作所需的前置 ID 查询命令，使 AI 能完成两步依赖工作流。

### Story 3.1：wi types 命令

As an AI agent,
I want to list workitem types with their IDs,
So that I can obtain the correct `typeId` before creating a workitem.

**Acceptance Criteria:**

**Given** 执行 `wi types --json`
**When** 命令运行
**Then** stdout 输出工作项类型列表 JSON，每项包含 `typeId`、`name`、`category`

**Given** 执行 `wi types --category Bug --json`
**When** 命令运行
**Then** 只返回 category 为 Bug 的工作项类型

**Given** 执行 `wi types`（默认输出）
**When** 命令运行
**Then** 以人类可读表格显示类型列表

---

### Story 3.2：status list 命令

As an AI agent,
I want to list workflow statuses for a workitem type,
So that I can obtain the correct `statusId` before updating a workitem.

**Acceptance Criteria:**

**Given** 执行 `status list --type-id <workitemTypeId> --json`
**When** 命令运行
**Then** stdout 输出该工作项类型的所有工作流状态 JSON，每项包含 `statusId`、`name`

**Given** 执行 `status list --category Bug --json`（便捷模式）
**When** 命令运行
**Then** CLI 自动查询 Bug 类型的 typeId，再查询对应状态，一步完成两步依赖

---

### Story 3.3：user list / user search 命令

As an AI agent,
I want to list and search project members,
So that I can obtain the correct `userId` before assigning a workitem.

**Acceptance Criteria:**

**Given** 执行 `user list --json`
**When** 命令运行
**Then** stdout 输出项目成员列表 JSON，每项包含 `userId`、`name`

**Given** 执行 `user search "张三" --json`
**When** 命令运行
**Then** stdout 输出包含"张三"的成员列表 JSON（按关键字过滤）

**Given** 执行 `user search "不存在的人" --json`
**When** 命令运行
**Then** stdout 输出空数组 `[]`，退出码 0

---

### Story 3.4：project list 命令

As a team member or AI agent,
I want to list available projects with their IDs,
So that I can identify the correct project to set as `YUNXIAO_PROJECT_ID`.

**Acceptance Criteria:**

**Given** 执行 `project list --json`
**When** 命令运行
**Then** stdout 输出项目列表 JSON，每项包含 `projectId`、`name`

**Given** 执行 `project list`（默认输出）
**When** 命令运行
**Then** 以人类可读表格显示项目列表

---

## Epic 4：Sprint 管理

**目标**：支持 Sprint 进度查看，使 AI 能在执行工作项操作前了解当前 Sprint 状态。

### Story 4.1：sprint list 命令

As an AI agent or team member,
I want to list sprints with status filtering,
So that I can identify the current active sprint ID before querying its workitems.

**Acceptance Criteria:**

**Given** 执行 `sprint list --json`
**When** 命令运行
**Then** stdout 输出 Sprint 列表 JSON，API 路径使用 `/projects/{id}/sprints`（projectId 在路径中）

**Given** 执行 `sprint list --status started --json`
**When** 命令运行
**Then** 只返回状态为 started 的 Sprint

**Given** 旧实现中 projectId 在查询参数中传入
**When** 使用新实现
**Then** projectId 在 URL 路径中传入（修复 Bug）

---

### Story 4.2：sprint view 命令

As an AI agent or team member,
I want to view sprint details including workitem completion statistics,
So that I can assess sprint progress before deciding on workitem actions.

**Acceptance Criteria:**

**Given** 执行 `sprint view <sprintId> --json`
**When** 命令运行
**Then** stdout 输出 Sprint 基本信息（名称、起止日期、状态）+ 工作项完成统计（总数、已完成数、各类型分布）

**Given** GetSprintInfo API 调用失败
**When** 执行 `sprint view <sprintId>`
**Then** 命令完全失败，stderr 输出错误信息，退出码非零（不返回部分数据）

**Given** SearchWorkitems API 调用失败
**When** 执行 `sprint view <sprintId>`
**Then** 命令完全失败，stderr 输出错误信息，退出码非零（不返回部分数据）

---

## Epic 5：流水线触发

**目标**：支持触发和查看云效 DevOps 流水线运行状态，使 AI 能在工作流中集成 CI/CD 操作。

> **注**：API 路径以 Epic 1 Story 1.7 全量验证结果为准。

### Story 5.1：pipeline list 命令

As an AI agent or team member,
I want to list available pipelines,
So that I can identify the correct pipeline ID before triggering a run.

**Acceptance Criteria:**

**Given** 执行 `pipeline list --json`
**When** 命令运行
**Then** stdout 输出流水线列表 JSON，每项包含 `pipelineId`、`name`

**Given** 执行 `pipeline list`（默认输出）
**When** 命令运行
**Then** 以人类可读表格显示流水线列表

---

### Story 5.2：pipeline run 命令

As an AI agent,
I want to trigger a pipeline run,
So that I can initiate CI/CD processes as part of an automated workflow.

**Acceptance Criteria:**

**Given** 执行 `pipeline run <pipelineId> --json`
**When** 命令运行
**Then** 流水线被触发，stdout 输出包含 `runId` 的 JSON

**Given** 执行 `pipeline run <不存在的pipelineId>`
**When** 命令运行
**Then** stderr 输出 `NOT_FOUND` 或 `API_ERROR`，退出码非零

---

### Story 5.3：pipeline status 命令

As an AI agent,
I want to check the status of a pipeline run,
So that I can determine if the CI/CD process succeeded before proceeding.

**Acceptance Criteria:**

**Given** 执行 `pipeline status <runId> --json`
**When** 命令运行
**Then** stdout 输出该运行的状态 JSON（包含 `status`：running/success/failed 等）

**Given** 流水线运行中
**When** 执行 `pipeline status <runId> --json`
**Then** 返回 `"status": "running"` 及可用的进度信息

---

## Epic 6：发布与分发

**目标**：将 CLI 发布到 npm，确保全局安装和 npx 均可用，并配置 GitHub Actions 自动化发布流程。

### Story 6.1：npm 包配置

As a developer,
I want `package.json` correctly configured for public npm publishing,
So that users can install the CLI via `npm install -g @kongsiyu/yunxiao-cli` or `npx`.

**Acceptance Criteria:**

**Given** 查看 `package.json`
**When** 检查配置
**Then** `name` 为 `@kongsiyu/yunxiao-cli`，`bin.yunxiao` 指向正确入口文件
**And** `version`、`description`、`keywords`、`license`、`repository` 等元数据完整

**Given** `package.json` 中的 `files` 字段
**When** 检查
**Then** 只包含 `src/` 目录和必要文件，不包含 `_bmad-output/`、`.github/` 等开发文件

---

### Story 6.2：手动发布验证

As a developer,
I want to verify the package installs and runs correctly after `npm publish`,
So that users have a working experience from day one.

**Acceptance Criteria:**

**Given** 执行 `npm publish --access public`
**When** 发布成功
**Then** `npm install -g @kongsiyu/yunxiao-cli` 可成功安装，`yunxiao --help` 正常运行

**Given** 全局安装后
**When** 执行 `npx @kongsiyu/yunxiao-cli --help`
**Then** 命令正常运行，显示完整帮助信息

---

### Story 6.3：GitHub Actions CI

As a developer,
I want automated tests to run on every PR and push,
So that code quality is continuously verified.

**Acceptance Criteria:**

**Given** 向 main 分支提交 PR 或直接 push
**When** GitHub Actions 触发
**Then** `.github/workflows/test.yml` 运行 `npm test`，结果反映在 PR 状态检查中

**Given** 测试失败
**When** GitHub Actions 运行
**Then** CI 状态标记为失败，不触发发布流程

---

### Story 6.4：GitHub Actions CD

As a developer,
I want automated npm publishing triggered by git tags,
So that releases are consistent and don't require manual publish steps.

**Acceptance Criteria:**

**Given** 推送 `v*` 格式的 git tag（如 `v1.0.0`）
**When** GitHub Actions 触发
**Then** `.github/workflows/publish.yml` 执行 `npm publish`，使用 secrets 中的 NPM_TOKEN

**Given** 发布成功
**When** 检查 npm registry
**Then** 对应版本的包可在 npm 查到并安装

---

## Epic 7：测试覆盖

**目标**：建立可靠的测试基础，覆盖 API 层核心函数、序列号解析专项逻辑、命令层核心输出路径。

### Story 7.1：测试基础设施配置

As a developer,
I want a working test infrastructure with node:test runner and mock support,
So that all subsequent test stories can be written and run reliably.

**Acceptance Criteria:**

**Given** 执行 `npm test`
**When** 运行测试
**Then** node:test runner 正常执行 `test/` 目录下所有 `.test.js` 文件

**Given** 测试文件需要 mock 云效 API 响应
**When** 编写测试
**Then** 有可用的 mock 机制（如 `node:test` 内置 mock 或 sinon）可拦截 axios 请求

**Given** CI 环境
**When** 执行 `npm test`
**Then** 测试以非交互式方式运行，结果可被 GitHub Actions 解析

---

### Story 7.2：API 层测试

As a developer,
I want all API functions in `api.js` covered by unit tests,
So that API integration correctness is continuously verified.

**Acceptance Criteria:**

**Given** `api.js` 中的所有 API 函数（searchWorkitems、getWorkitem、createWorkitem 等）
**When** 运行 `test/api.test.js`
**Then** 每个函数都有至少一个测试用例，mock 云效 API 响应

**Given** API 函数收到 HTTP 401 响应
**When** 测试运行
**Then** 函数抛出 `AUTH_FAILED` 错误（不是原始 axios 错误）

**Given** API 函数返回 `{ data: [...] }` 包装格式
**When** 函数执行
**Then** 函数解包并返回内部数组/对象（命令层无需处理包装）

---

### Story 7.3：序列号解析专项测试

As a developer,
I want dedicated tests for `resolveWorkitemId` covering all edge cases,
So that the serial number resolution logic is provably correct.

**Acceptance Criteria:**

**Given** 输入合法序列号 `GJBL-1`
**When** 运行 `test/resolve.test.js`
**Then** 测试验证 searchWorkitems 被调用（全类型），并在结果中精确匹配 `serialNumber`

**Given** 输入不存在的序列号
**When** 测试运行
**Then** 验证抛出 `NOT_FOUND` 错误

**Given** 输入 UUID 格式（非序列号）
**When** 调用 `resolveWorkitemId`
**Then** 直接返回该 UUID，不触发搜索请求

---

### Story 7.4：命令层测试

As a developer,
I want core command output paths tested for `--json` format and error codes,
So that the CLI's output contract with AI agents is continuously verified.

**Acceptance Criteria:**

**Given** 执行 `wi list --json`（mock API 返回数据）
**When** 运行 `test/commands.test.js`
**Then** 测试验证 stdout 是合法 JSON 且包含 `total` 字段

**Given** 认证缺失时执行任意命令
**When** 测试运行
**Then** 验证 stderr 包含 `AUTH_MISSING` 错误码，退出码非零

**Given** `--json` 模式下发生 API 错误
**When** 测试运行
**Then** 验证 stdout 无输出，stderr 包含 `{"error": "...", "code": "API_ERROR"}` 格式

---

## Epic 8：文档

**目标**：提供完整的 README 文档和优化后的 SKILL 文件，覆盖人类安装使用和 LLM 调用两种场景。

### Story 8.1：README 安装与配置章节

As a new team member,
I want a clear README section covering installation and configuration,
So that I can get from zero to first successful command in under 5 minutes.

**Acceptance Criteria:**

**Given** 阅读 README 安装章节
**When** 按步骤操作
**Then** 包含 `npm install -g @kongsiyu/yunxiao-cli` 安装命令
**And** 包含三个环境变量的设置说明（`YUNXIAO_PAT`、`YUNXIAO_ORG_ID`、`YUNXIAO_PROJECT_ID`）
**And** 包含 config 文件方式及安全风险警告
**And** 包含配置优先级说明（命令行 > config > 环境变量）

---

### Story 8.2：README 命令参考章节

As a team member or AI agent,
I want a complete command reference in README,
So that I can look up any command's syntax and options without reading source code.

**Acceptance Criteria:**

**Given** README 命令参考章节
**When** 查找任意命令
**Then** 每个命令包含：语法、所有参数/选项说明、示例输出
**And** 包含两步依赖工作流示例（`wi types` → `wi create`；`status list` → `wi update`）

---

### Story 8.3：README 工作流示例章节

As a team member,
I want workflow examples showing both AI agent and human scenarios,
So that I understand how to compose commands for real tasks.

**Acceptance Criteria:**

**Given** README 工作流示例章节
**When** 阅读 AI Agent 场景示例
**Then** 包含完整的 Sprint 工作流示例（`sprint list` → `sprint view` → `wi list` → `user search` → `wi update`）

**Given** 阅读人类场景示例
**When** 查看示例
**Then** 包含站会前快速查看工作项的命令示例

---

### Story 8.4：SKILL 文件优化

As an AI agent (LLM),
I want an optimized SKILL file with clear When to Use, command reference, and workflow templates,
So that I can autonomously complete yunxiao workflows without additional prompting.

**Acceptance Criteria:**

**Given** LLM 仅读取 SKILL.md
**When** 用户指令包含工作项相关操作
**Then** LLM 能正确识别 When to Use 场景，选择正确命令序列

**Given** SKILL.md 命令参考章节
**When** AI 需要查找命令
**Then** 包含所有 MVP 命令的格式、参数、`--json` 输出示例

**Given** SKILL.md 工作流模板章节
**When** AI 执行常见场景
**Then** 包含：Sprint 工作流、工作项创建（两步）、指派工作流、认证失败处理的标准模板

**Given** SKILL.md 错误处理章节
**When** AI 遇到错误码
**Then** 每个 ERROR_CODE 有对应的处理建议（如 `AUTH_FAILED` → 提示用户更新 `YUNXIAO_PAT`）

---

## Epic 9：稳定性修复与 v0.2 增强

**目标**：修复 MVP 发布后用户反馈的 Bug，消除复盘识别的技术债务，并增加版本检测和多语言支持等增强功能，提升工具的稳定性和易用性。

**前置条件**：Epic 1–8 全部完成（v0.1.x 已发布）

**来源**：GitHub Issues #62/#63/#64/#65 + 全项目复盘技术债务 TD-1/TD-2

### Story 9.1：auth login PAT 地址修正与交互提示优化

As a user,
I want the auth login command to show the correct PAT generation URL and a clear paste prompt,
So that I can complete authentication without confusion.

**Acceptance Criteria:**

**Given** 执行 `auth login`
**When** 显示 PAT 生成地址
**Then** URL 为 `https://account-devops.aliyun.com/settings/personalAccessToken`（非旧地址 `https://devops.aliyun.com/account/setting/tokens`）

**Given** 执行 `auth login` 交互模式
**When** 光标等待 PAT 输入
**Then** 提示文字明确告知用户需粘贴 PAT（如"请粘贴你的 Personal Access Token："），光标位置紧接提示文字

**来源**：[GitHub #62](https://github.com/kongsiyu/yunxiao-cli/issues/62)
**FR 映射**：FR9（auth login 交互式模式）

---

### Story 9.2：project list 输出排版修复

As a user,
I want the project list command to display a properly aligned table,
So that I can easily read project information in the terminal.

**Acceptance Criteria:**

**Given** 执行 `project list`（非 --json 模式）
**When** 项目名称包含中文或长字符串
**Then** 输出表格列宽正确对齐，不出现混乱换行或列错位

**Given** 执行 `project list --json`
**When** 命令运行
**Then** JSON 输出不受影响（已正常工作）

**来源**：[GitHub #64](https://github.com/kongsiyu/yunxiao-cli/issues/64)
**FR 映射**：FR16（project list 命令）

---

### Story 9.3：resolveWorkitemId 分页完整性改进

As a developer,
I want the serial number resolution to handle projects with many workitems reliably,
So that commands like `wi view GJBL-100` work correctly even in large projects.

**Acceptance Criteria:**

**Given** 项目工作项总数超过 50 条
**When** 执行 `wi view <serialNumber>`，目标工作项不在前 50 条结果中
**Then** 序列号仍能正确解析（通过分页或 API 过滤参数实现）

**Given** 云效 API 支持 `serialNumber` 作为搜索参数
**When** 调用 searchWorkitems
**Then** 优先使用 API 级别的 serialNumber 过滤，避免本地 perPage 限制

**Given** 云效 API 不支持 `serialNumber` 过滤
**When** 评估后确认
**Then** 增加分页循环或扩大 perPage 至合理上限，并在文档中标注已知限制

**来源**：复盘技术债务 TD-1
**FR 映射**：FR27（resolveWorkitemId 序列号解析）

---

### Story 9.4：sprint view 工作项 done 状态 schema 固化

As a team member or AI agent,
I want sprint view completion statistics to be based on confirmed API field schema,
So that the done count is accurate regardless of project workflow configuration.

**Acceptance Criteria:**

**Given** 执行 `sprint view <id>` 或 `sprint view <id> --json`
**When** 获取工作项列表
**Then** "已完成"判断基于 API 返回的确定字段（通过实际 API 调用确认 schema），而非多级降级推断

**Given** 确认 status 字段 schema 后
**When** 更新实现
**Then** 将确认结果记录到 `_bmad-output/research/api-verification-v2.md` 相关章节

**来源**：复盘技术债务 TD-2
**FR 映射**：FR18（sprint view 命令）

---

### Story 9.5：版本检测与更新提示

As a user,
I want the CLI to check for new versions and notify me when an update is available,
So that I always use the latest features and bug fixes.

**Acceptance Criteria:**

**Given** 执行任意命令
**When** 本地版本低于 npm registry 最新版本
**Then** 在 stderr 输出一行更新提示（如"yunxiao v0.2.0 available, run `npm update -g @kongsiyu/yunxiao-cli` to update"）

**Given** 执行 `--json` 模式的命令
**When** 检测到新版本
**Then** 更新提示仍只写入 stderr，不影响 stdout JSON 输出

**Given** npm registry 不可达（离线 / 超时）
**When** 版本检查失败
**Then** 静默忽略，不影响命令正常执行；版本检查超时上限 ≤ 2 秒

**Given** 距离上次版本检查不足 24 小时
**When** 执行任意命令
**Then** 跳过版本检查（使用缓存结果或直接跳过），避免频繁网络请求

**来源**：[GitHub #65](https://github.com/kongsiyu/yunxiao-cli/issues/65)
**FR 映射**：新增 FR35

---

### Story 9.6：多语言支持——中文优先

As a Chinese-speaking user,
I want the CLI output to be in Chinese,
So that I can understand command results and error messages without translation.

**Acceptance Criteria:**

**Given** 系统 locale 为 zh-CN 或用户配置 `language: zh` 在 config 文件中
**When** 执行任意命令
**Then** 人类可读输出（表头、提示、错误消息）显示为中文

**Given** 系统 locale 非中文且未配置 language
**When** 执行任意命令
**Then** 输出保持英文（默认行为不变）

**Given** `--json` 模式
**When** 执行任意命令
**Then** JSON 字段名保持英文不变，仅 human-readable 部分受语言设置影响

**来源**：[GitHub #63](https://github.com/kongsiyu/yunxiao-cli/issues/63)
**FR 映射**：新增 FR36

---

## Epic 10：Codeup 集成（v1.1.0 已交付基线）

**目标**：将 CLI 从云效工作项操作扩展到 Codeup 仓库与 MR 的最小协作闭环，验证 `repo -> mr list -> mr view -> mr create` 的渐进式扩展模式。

**前置条件**：Epic 1-9 已完成；`src/codeup-api.js`、`src/commands/repo.js`、`test/codeup-api.test.js` 和 `test/repo.test.js` 已形成 Codeup 实现/测试基线。

**来源**：v1.1.0 复盘与 Codeup API 验证工件。

### Story 10.1：Codeup API 验证与仓库/MR 端点确认 Spike

As a developer,
I want to verify Codeup API compatibility and confirm repository/MR endpoint specifications,
So that I can design and implement Codeup integration with confidence.

**Acceptance Criteria:**

**Given** 现有 PAT 与 Codeup API 文档
**When** 执行 API 验证
**Then** 确认 PAT 是否可访问 Codeup API，以及认证方式是否兼容

**Given** Codeup API 端点文档
**When** 验证 repo/MR 关键问题
**Then** 每个问题都有明确可行性结论和对后续 stories 的影响

**FR 映射**：FR37、FR38、FR44

---

### Story 10.2：repo list 命令

As a developer,
I want to list Codeup repositories from the CLI,
So that I can identify the correct repoId before MR operations.

**Acceptance Criteria:**

**Given** 有效 PAT
**When** 执行 `yunxiao repo list --json`
**Then** stdout 输出纯 JSON，包含仓库 ID、名称、路径、默认分支和 webUrl

**Given** 执行 `yunxiao repo list`
**When** 命令成功
**Then** human-readable 输出包含仓库 ID、名称、路径、默认分支和 webUrl

**FR 映射**：FR37

---

### Story 10.3：repo view 命令

As a developer,
I want to view Codeup repository details by repoId,
So that I can inspect repository metadata before MR actions.

**Acceptance Criteria:**

**Given** 有效 repoId
**When** 执行 `yunxiao repo view <repoId> --json`
**Then** stdout 输出该仓库详情 JSON

**Given** repoId 不存在或无权限
**When** 执行 `repo view`
**Then** 输出 `NOT_FOUND` 或 `AUTH_FAILED`，退出码非零

**FR 映射**：FR37

---

### Story 10.4：mr list 命令

As a developer,
I want to list merge requests for a Codeup repository,
So that I can inspect active review work from the CLI.

**Acceptance Criteria:**

**Given** 有效 repoId
**When** 执行 `yunxiao mr list <repoId> --json`
**Then** stdout 输出纯 JSON，包含 MR ID、标题、状态、源分支、目标分支、作者、assignee 和 webUrl

**Given** 指定 state 过滤
**When** 执行 `mr list <repoId> --state opened --json`
**Then** 只返回对应状态 MR

**FR 映射**：FR38

---

### Story 10.5：mr view 命令

As a developer,
I want to view a merge request by repoId and mrId,
So that I can inspect MR details before creating follow-up work.

**Acceptance Criteria:**

**Given** 有效 repoId 和 mrId
**When** 执行 `yunxiao mr view <repoId> <mrId> --json`
**Then** stdout 输出 MR 详情 JSON

**Given** MR 不存在或无权限
**When** 执行 `mr view`
**Then** 输出结构化错误，退出码非零

**FR 映射**：FR38

---

### Story 10.6：mr create 命令

As a developer,
I want to create a Codeup merge request from the CLI,
So that I can connect branch work to Yunxiao work without leaving the terminal.

**Acceptance Criteria:**

**Given** 有效 repoId、title、source branch 和 target branch
**When** 执行 `yunxiao mr create <repoId> --title <title> --source-branch <branch> --target-branch <branch> --json`
**Then** 创建 MR 并输出纯 JSON，包含 id、title、state、sourceBranch、targetBranch、author、assignee、webUrl、createdAt、updatedAt、workitemId

**Given** 指定 `--workitem-id`
**When** 创建 MR
**Then** 请求体包含 `workitem_id`，不对字符串型 workitemId 做数字强制转换

**FR 映射**：FR38

---

## Epic 11：v1.2.0 CLI 可用性收口与中文化 rollout

**目标**：把 i18n 从 foundation-only 推进到用户可见高频命令中文体验，同时保持 AI 可消费 JSON schema 不变。

**前置条件**：Epic 9 Story 9.6 的 i18n foundation 已存在；`src/i18n/index.js`、`translations/zh.json`、`src/config.js` 和 `src/index.js` 已接入基础设施。

**范围约束**：
- v1.2.0 只覆盖高频命令，不追求一次性全 CLI 中文化。
- JSON 字段名、list/view schema、错误码枚举不得翻译或改名。
- 中文化只影响 human-readable 输出、提示和错误 message 文本。

### Story 11.1：i18n 缺口审计与 rollout 范围锁定

As a product owner,
I want a concrete audit of i18n coverage and a locked rollout scope,
So that v1.2.0 can deliver visible Chinese UX without expanding into unbounded full-CLI localization.

**Create-Story Priority**：P1（首批候选）

**Acceptance Criteria:**

**Given** 当前 i18n foundation 已存在
**When** 审计 `src/output.js`、`src/errors.js`、`src/commands/*.js`、`translations/zh.json` 和 README/SKILL
**Then** 输出一份 i18n coverage matrix，列出已接入、未接入、v1.2.0 必须接入和后置项

**Given** v1.2.0 scope 已确认
**When** 锁定 rollout 范围
**Then** 高频命令范围固定为 `auth`、`whoami`、`project list`、`wi list/view/update`、`sprint list/view`

**Given** `--json` 模式
**When** 设计 i18n rollout
**Then** 明确 JSON 字段名保持英文，stdout 只输出纯 JSON，翻译不改变 machine contract

**Given** 审计完成
**When** 准备交付
**Then** 生成 `_bmad-output/implementation-artifacts/11-1-i18n-audit-rollout-scope.md` 并更新本 story 的 Task/Subtask 勾选

**FR 映射**：FR39、FR40

---

### Story 11.2：高频命令人类可读输出中文化 rollout

As a Chinese-speaking user,
I want high-frequency command output and errors to be readable in Chinese,
So that the CLI provides visible localization value while keeping AI JSON contracts stable.

**Status**：backlog

**Acceptance Criteria:**

**Given** 用户配置 `language: zh` 或系统 locale 为中文
**When** 执行 `auth`、`whoami`、`project list`、`wi list/view/update`、`sprint list/view`
**Then** human-readable 标题、表头、成功提示和常见错误 message 使用中文

**Given** 用户未配置中文且系统 locale 非中文
**When** 执行同一批命令
**Then** 默认英文行为保持不变

**Given** 执行任意已覆盖命令的 `--json` 模式
**When** 命令成功或失败
**Then** stdout JSON 字段名和错误码保持英文，stderr/错误 message 可本地化但不污染 stdout

**Given** 翻译 key 缺失
**When** 命令运行
**Then** 回退英文 fallback，不抛出运行时错误

**FR 映射**：FR36、FR40、FR41

---

### Story 11.3：README / SKILL 边界补充

As an AI agent or human user,
I want documentation to clearly state i18n behavior and limits,
So that I know what is localized and what remains stable for automation.

**Status**：backlog

**Acceptance Criteria:**

**Given** README 命令参考和 SKILL 使用指南
**When** 阅读 i18n 说明
**Then** 文档明确说明 high-frequency human-readable 输出支持中文，`--json` 字段名和 ERROR_CODE 不翻译

**Given** v1.2.0 中文化不是全 CLI 覆盖
**When** 阅读已知限制
**Then** 文档列出已覆盖命令和后置命令，不误导用户认为全 CLI 已完成

**FR 映射**：FR40、FR45

---

## Epic 12：v1.2.0 AI workflow 契约加固与 release gate

**目标**：把真实 CLI smoke、stdout/stderr/JSON/错误码/version metadata 合同和发布前检查模板化，降低 AI workflow 回归风险。

**前置条件**：Epic 11.1 完成后确认需要 smoke 覆盖的高频命令；现有 `npm test`、node:test 和 package release 流程可复用。

### Story 12.1：真实 CLI smoke matrix 与执行入口

As a release reviewer,
I want a real CLI smoke matrix and runnable entrypoint,
So that version metadata, stdout/stderr behavior, and common command paths are verified outside unit-test mocks.

**Create-Story Priority**：P1（首批候选）

**Acceptance Criteria:**

**Given** v1.2.0 高频命令范围
**When** 定义 smoke matrix
**Then** matrix 至少包含 `yunxiao --version`、`yunxiao --help`、`auth status`、`project list --json`、`wi list --json`、`sprint list --json`、一个失败路径和一个中文 human-readable 路径

**Given** 无真实 PAT 的 CI 环境
**When** 运行 smoke
**Then** 可执行无需认证的 smoke，并把需真实环境的项目标记为 manual/live-test，不导致 CI 假失败

**Given** 有真实 PAT / org / project 环境
**When** 运行 live smoke
**Then** 验证 stdout 纯 JSON、提示写 stderr、错误码稳定、runtime version 与 `package.json` 对齐

**Given** smoke 入口完成
**When** 准备交付
**Then** 文档化执行命令、环境变量、预期输出和失败判定

**FR 映射**：FR41、FR42

---

### Story 12.2：JSON/stdout/stderr/error-code 契约回归测试补强

As an AI workflow maintainer,
I want regression tests for machine-readable CLI contracts,
So that i18n and release changes cannot silently break agent parsing.

**Status**：backlog

**Acceptance Criteria:**

**Given** `--json` 模式命令成功
**When** 运行命令层测试
**Then** stdout 是合法 JSON，stderr 不包含 human-readable 数据污染，JSON 字段名保持英文

**Given** `--json` 模式命令失败
**When** 运行命令层测试
**Then** stdout 无输出，stderr 是 `{"error":"...","code":"ERROR_CODE"}`，code 属于现有 ERROR_CODE 枚举

**Given** i18n 启用中文
**When** 运行覆盖命令测试
**Then** 翻译只影响 human-readable message，不改变 JSON schema 或错误码

**FR 映射**：FR41

---

### Story 12.3：Release checklist 模板化

As a release owner,
I want a reusable release checklist template,
So that version metadata, package contents, smoke evidence, publishing, and release notes are checked before handoff.

**Create-Story Priority**：P1（首批候选）

**Acceptance Criteria:**

**Given** 准备 v1.2.0 发布
**When** 使用 checklist
**Then** checklist 至少包含 runtime version、`package.json` version、git tag、`npm test`、关键 CLI smoke、`npm pack --dry-run`、publish workflow、release note、commit/tag 可追溯性

**Given** release 前发现版本元数据不一致
**When** checklist 执行
**Then** 标记为 release blocker，不进入发布流水线

**Given** release checklist 模板落地
**When** 后续版本复用
**Then** 不依赖人工记忆补版本元数据或 release note

**FR 映射**：FR42

---

### Story 12.4：v1.2.0 发布前验收与 release evidence 汇总

As a reviewer,
I want a single release evidence summary before v1.2.0 goes out,
So that GO/NO-GO is based on explicit evidence instead of scattered comments.

**Status**：backlog

**Acceptance Criteria:**

**Given** Epic 11-13 的 v1.2.0 stories 已完成
**When** 执行发布前验收
**Then** 汇总测试、smoke、pack dry-run、version/tag、release note、已知残余风险和后置项

**Given** 存在残余风险
**When** Reviewer 给出结论
**Then** 明确区分 release blocker 与 non-blocking residual risk

**FR 映射**：FR42、FR45

---

## Epic 13：v1.2.0 BMAD 工件卫生与 Codeup 证据治理

**目标**：修复 story 文件、任务勾选、`sprint-status.yaml` 与实际交付漂移的问题，并为后续 Codeup 扩展建立 evidence level 约束。

**前置条件**：v1.1.0 复盘已确认 story 工件状态漂移、i18n foundation-only 误判和 Codeup document-only evidence 风险。

### Story 13.1：Story 工件状态同步规则与 foundation-only 标记

As a scrum master,
I want explicit story artifact synchronization rules and a foundation-only marker,
So that sprint status, story files, and retrospective evidence stay consistent.

**Create-Story Priority**：P1（首批候选）

**Acceptance Criteria:**

**Given** story 准备进入 `done`
**When** 执行关闭检查
**Then** story 文件头 `Status`、Task/Subtask 勾选、Dev Agent Record、File List 和 `sprint-status.yaml` 必须同步

**Given** story 只完成基础设施但未完成用户可见 rollout
**When** 标记完成状态
**Then** story 必须显式标记 `foundation-only`，并列出 user-visible rollout 后续 story

**Given** story 文件与 `sprint-status.yaml` 冲突
**When** 复盘或规划读取工件
**Then** 冲突处理规则明确：以 release evidence / merged PR / final review 为最终裁决源，并必须回写 story 文件

**Given** 规则落地
**When** SM 创建后续 story
**Then** story 模板或 handoff notes 包含状态同步检查项

**FR 映射**：FR43、FR45

---

### Story 13.2：Codeup evidence ledger

As a planner or architect,
I want a Codeup evidence ledger for candidate APIs,
So that v1.3.0 feature expansion is based on known evidence levels instead of document-only assumptions.

**Create-Story Priority**：P1（首批候选）

**Acceptance Criteria:**

**Given** 已有 `_bmad-output/research/codeup-api-verification.md`
**When** 创建 evidence ledger
**Then** 每个候选 API 记录 endpoint、auth、必填字段、返回关键字段、验证方法、evidence level、风险等级、后续 story 影响

**Given** 候选能力未 live-tested
**When** 进入 ledger
**Then** evidence level 标为 document-only 或 script-ready，不得直接作为开发 ready 条件

**Given** 未来要规划 MR merge/comment/approval/diff/commits/discussions
**When** PM/Architect 使用 ledger
**Then** 能直接判断哪些能力可以进入 v1.3.0，哪些需要先做 spike

**FR 映射**：FR44

---

### Story 13.3：v1.2.0 handoff index 与执行追踪工件

As a scrum master,
I want a handoff index that lists execution order, owners, review gates, and deferred scope,
So that SM can assign work without reinterpreting the Correct Course proposal.

**Status**：backlog

**Acceptance Criteria:**

**Given** Correct Course proposal 已批准
**When** 创建 handoff index
**Then** index 列出 P0-P5 阶段、story 执行顺序、handoff recipients、依赖、评审验收波次、发布前门禁和 v1.3.0/post-MVP 后置项

**Given** SM 开始派单
**When** 查看 handoff index
**Then** 能识别首批 create-story 候选：11.1、12.1、12.3、13.1、13.2

**FR 映射**：FR45
