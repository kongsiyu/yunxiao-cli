---
stepsCompleted: [step-01-validate-prerequisites]
inputDocuments:
  - yunxiao-cli/_bmad-output/planning-artifacts/prd.md
---

# yunxiao-cli - Epic Breakdown

## Overview

本文档将 yunxiao-cli PRD（含架构章节）中的需求分解为可实施的 Epic 和 Story，覆盖工作项管理、认证、前置查询、Sprint 管理、流水线触发、发布、测试和文档八大领域。

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
