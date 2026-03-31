---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - yunxiao-cli/_bmad-output/brainstorming/brainstorming-session-2026-03-22.md
  - yunxiao-cli/_bmad-output/research/yunxiao-api-reference.md
  - yunxiao-cli/_bmad-output/research/api-verification-report.md
  - yunxiao-cli/docs/yunxiao-api-reference.md
  - yunxiao-cli/docs/api-verification-report.md
date: 2026-03-30
author: Sue
---

# Product Brief: yunxiao-cli

## 1. 问题陈述

### 核心问题

云效（Aliyun DevOps）是团队日常研发协作的核心平台，但它的使用门槛不成比例地高。具体表现为三条路都走不通：

- **直接调用 API**：文档冗长，AI 和人类都要花大量时间判断"用哪个接口、传什么参数"，成功率低
- **页面操作**：重复低效，无法自动化，AI 根本无法直接使用
- **MCP**：需要单独部署运行服务，在许多 CI、容器、本地受限环境中安装困难，环境依赖是硬伤

结果是：每次需要自动化云效操作时，无论是 AI Agent 自主执行任务，还是人类批量处理工作项，都要重新面对几百个 API 端点，从头判断该用哪一个。

### 为什么现在

AI Agent 在研发工作流中的角色正在快速加重——从辅助建议变成直接执行任务。当 Agent 需要"把这个 Bug 指派给李明并关联到当前 Sprint"时，它不能查文档、不能点页面，只能调用工具。没有可靠中间层，这类任务要么失败，要么需要大量提示词工程来弥补。

---

## 2. 目标用户

### 主要用户：AI Agent

AI Agent 是这个工具最迫切的受益者。它需要：

- 可预期的命令接口（不是几百个 API，而是 ~20 个命令）
- 精确的 `--json` 输出，供后续推理使用
- 非交互式认证（`--token` + `--org-id` 直接传入，无需人工干预）
- 明确的错误信息，而不是 HTTP 状态码

**核心场景**：Sprint 进度汇报、工作项 CRUD、成员查找与任务分配、评论管理

### 次要用户：内部团队成员（人类）

人类用户获得的是同一套工具的人类友好视图：

- 终端中快速查看 Sprint 状态，不用打开浏览器
- 批量操作（更新多个工作项状态）
- 脚本化日常工作流

**核心场景**：每日站会前快速拉取工作项清单、提交 Bug 时快速查找 userId

---

## 3. 解决方案愿景

### 定位

**yunxiao-cli 是 AI 操作云效的可靠中间层。**

就像 `gh` 之于 GitHub——不是 API 的镜像，而是对"人类和 AI 实际需要做什么"的精准封装。

### 核心设计原则

1. **缩小而非完整**：不暴露所有 API，只实现常用场景。精简本身就是价值。
2. **AI 为主，人类可用**：默认输出人类可读，`--json` 提供结构化输出供 AI 消费
3. **零环境依赖**：纯 CLI，npm 全局安装或 `npx` 直接运行，没有 daemon，没有 sidecar
4. **SKILL 驱动设计**：SKILL 文件是 CLI 的需求规格，确保命令设计对 AI 真正可用

### 命令体系概览

```
yunxiao auth login/status/logout   # 认证管理
yunxiao whoami                     # 当前用户
yunxiao project list/view          # 项目
yunxiao sprint list/view           # 迭代
yunxiao wi list/view/create/       # 工作项（核心）
       update/delete/comment...
yunxiao user list/search           # 成员查找
yunxiao status list                # 可用状态
```

---

## 4. 成功指标

**主要指标（定性）**：

- AI Agent 可以通过 yunxiao-cli 完成一次完整的 Sprint 工作流（查看进度、创建/更新/分配工作项、添加评论），无需人工介入
- 人类可以在 30 秒内从终端完成之前需要打开云效页面才能做的操作

**次要指标（定量，视内部使用情况而定）**：

- SKILL 文件能让 Claude 等 LLM 在无额外提示的情况下正确调用命令
- `--json` 输出结构稳定，AI 解析成功率高

---

## 5. 现有替代方案分析

| 方案 | 问题 |
|------|------|
| 直接 API 调用 | 文档体量大，AI 上下文窗口装不下；人类也需要大量查找才能找到正确接口 |
| 页面操作 | 无法自动化，AI 不能直接使用 |
| MCP | 环境依赖重，某些 CI/容器/本地受限环境安装困难 |
| 无工具，纯 prompt | 提示词工程维护成本高，稳定性差，换 LLM 要重写 |

**yunxiao-cli 的差异化**：用 CLI 将 API 复杂性封装为简单命令，同时通过 SKILL 文件让 LLM 知道如何精准调用，兼顾人机可用性，且无环境依赖。

---

## 6. 实施路线图

### Phase 0：SKILL 草案（需求先行）

先写 SKILL 草案，定义 AI 需要的命令接口、JSON schema、常见工作流模板。SKILL 即需求文档。

### Phase 1：核心重构

- 删除无效模块（query/attachment/storage）
- 修复关键 Bug（序列号解析、API 返回值解包、Sprint 命令注册）
- 完善认证（`--token --org-id` 非交互模式）

### Phase 2：新功能

- 全局 `--json` flag
- `status list`、`user list/search`、Sprint view 组合逻辑
- 评论编辑/删除（待 API 验证）

### Phase 3：质量与发布

- node:test 测试框架（两层：API 层 + 命令层）
- npm 发布：`@kongsiyu/yunxiao-cli`，binary: `yunxiao`
- 用 skill-creator 生成正式 SKILL
- 更新 README 和 CI

---

## 7. 开放问题

1. `category: "Req,Task,Bug"` 逗号分隔是否在 `searchWorkitems` 中生效（实施中验证）
2. 评论编辑/删除 API 端点可用性（feat/11 待验证）
3. 是否有未来对外发布（npm public）的需求，或长期保持内部工具定位
