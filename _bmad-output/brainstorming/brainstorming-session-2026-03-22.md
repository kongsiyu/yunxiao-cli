# yunxiao-cli 头脑风暴总结（评审后修订版）

**日期:** 2026-03-22
**主题:** yunxiao-cli + SKILL 重新规划
**状态:** 所有设计问题已解决，待实施

---

## 产品定位

**核心定位：CLI 是 AI 操作云效的中间层**

- 直接 API 调用让 LLM 成功率太低
- MCP 太复杂，需要另外运行服务
- 参考 `gh` CLI：CLI 封装 API 提供可靠命令，SKILL 描述命令让 LLM 精准调用
- **AI 为主，人类可用** -- 默认人类可读输出，`--json` 提供结构化输出

**npm 发布：** `@kongsiyu/yunxiao-cli`（`yunxiao-cli` 已被占用）
- 二进制名保持 `yunxiao`
- 安装：`npm install -g @kongsiyu/yunxiao-cli` 或 `npx @kongsiyu/yunxiao-cli`

---

## 命令体系（最终设计）

### 全局 Flag

```
--json          # JSON 输出（所有 list/view 命令），输出完整 JSON 对象
--help          # 帮助（始终显示所有命令，不管是否认证）
```

> **设计决策：** `--json` 全局 flag 专用于输出格式。原有 `wi create/update --json` 传入额外字段的参数改名为 `--fields`，避免命名冲突。

### Auth -- 认证管理

```
yunxiao auth login [--token <pat>] [--org-id <orgId>]
  # 两个参数都传 = 非交互式（AI 场景）
  # 缺任何一个 = 交互式补全（人类场景）

yunxiao auth status                    # 检查认证状态
yunxiao auth logout                    # 清除认证
```

> **认证优先级：** 环境变量 > config 文件 > 命令行参数
> **PAT 存储：** 短期保持 `~/.yunxiao/config.json` 明文存储，文档中标注安全风险。AI 主要通过环境变量使用，config 文件是人类便利功能。

### User -- 用户信息

```
yunxiao whoami                         # 当前用户信息

yunxiao user list [--project <id>]     # 列出项目成员
  [--query <name>]                     # 按名称过滤

yunxiao user search <name>             # 搜索用户
  [--project <id>]                     # 在项目范围内搜索
```

> **来源：** feat/8-user-commands 分支代码已验证可用，API 端点：`/oapi/v1/projex/organizations/{orgId}/projects/{projectId}/members`

### Project -- 项目管理

```
yunxiao project list [--name <kw>]     # 列出项目
yunxiao project view <id>              # 项目详情
```

### Workitem -- 工作项（核心模块）

```
yunxiao wi list [过滤参数...]           # 列出工作项
  --category <types>                   # 类型过滤（默认 "Req,Task,Bug" 全部）
  --status <status>                    # 状态过滤
  --assigned-to <userId|me>            # 负责人过滤
  --sprint <sprintId>                  # Sprint 过滤
  --priority <priority>                # 优先级过滤
  --label <label>                      # 标签过滤
  --limit <n>                          # 返回数量（默认 30）

yunxiao wi view <id|序列号>            # 查看详情（支持 GJBL-1 格式）
yunxiao wi create --title "..." [...]  # 创建工作项
  --category <type>                    # 类型（Req/Task/Bug）
  --assigned-to <userId>               # 负责人
  --priority <priority>                # 优先级
  --sprint <sprintId>                  # Sprint
  --description "..."                  # 描述
  --fields '{"field":"value"}'         # 自定义字段（原 --json，已改名）

yunxiao wi update <id> [...]           # 更新工作项（参数同上）
yunxiao wi delete <id> [--force]       # 删除（默认确认，--force 跳过）
yunxiao wi comment <id> "内容"         # 添加评论
yunxiao wi comments <id>               # 列出评论
yunxiao wi comment-edit <id> <commentId> "新内容"   # 编辑评论（待验证）
yunxiao wi comment-delete <id> <commentId> [--force] # 删除评论（待验证）
yunxiao wi types [--category ...]      # 工作项类型列表
```

> **序列号解析方案：** 统一用 `searchWorkitems` + `category: "Req,Task,Bug"` 搜全部类型，在返回结果中精确匹配 `serialNumber` 字段。废弃按标题搜索和拉 100 条的方式。

### Sprint -- 迭代管理

```
yunxiao sprint list [--status <status>] # 列出 Sprint
yunxiao sprint view <id>                # Sprint 详情 + 工作项完成统计
```

> **sprint view 实现方案：** `listSprints` 查基本信息 + `searchWorkitems(category: "Req,Task,Bug", sprint: id)` 获取全部工作项，聚合状态统计。单次 API 调用（API 支持逗号分隔 category），如果实际不生效再降级为三次调用。

### Status -- 状态查询

```
yunxiao status list [--project <id>] [--category <type>]
```

> **来源：** feat/9-status-list 分支代码已验证可用，API 端点：`/oapi/v1/projex/organizations/{orgId}/projects/{projectId}/workitemStatuses?category=Req`

---

## 代码变更计划

### 删除

| 文件/功能 | 理由 |
|----------|------|
| `commands/query.js` | AI 不需要保存搜索 |
| `commands/storage.js` | query 的依赖 |
| `commands/attachment.js` | upload/download API 不支持，link 是伪附件 |
| index.js 中 query/attachment 注册 | 跟随删除 |
| workitem.js 中 `import { setQuery }` 和 `--save-as` 逻辑 | 依赖被删模块 |
| api.js 中 `createClient()` 和 `getConfig()` | 死代码，从未调用 |
| `pnpm-lock.yaml` | 统一用 npm |

### 修复

| 问题 | 方案 |
|------|------|
| Sprint 命令未注册 | 注册到 index.js，重写 sprint.js 只用 listSprints + searchWorkitems |
| Sprint getSprint/listSprintWorkitems 不存在 | 删除，改用组合方案 |
| 序列号解析 | 统一为 searchWorkitems(全 category) + 匹配 serialNumber 字段 |
| `wi view` 拉 100 条 find 的方式 | 废弃，统一走 resolveWorkitemId |
| 条件命令注册 | 所有命令始终注册，执行时检查认证状态 |
| `wi list` category 必填 | 默认 "Req,Task,Bug" |
| `wi delete` 交互确认 | 保留确认，`--force` 跳过 |
| `auth login` 只有交互式 | 增加 `--token` + `--org-id` 非交互模式 |
| `wi create/update --json` 命名冲突 | 改名为 `--fields` |
| API 返回值解包 | api.js 层统一处理，返回可直接使用的数据（非 `{ data: [...] }` 包装） |

### 新增

| 功能 | 说明 |
|------|------|
| 全局 `--json` flag | 所有 list/view 命令输出完整 JSON 对象，JSON 模式不输出 chalk |
| `status list` 命令 | 从 feat/9 提取，查询项目可用状态（按 category） |
| `user list/search` 命令 | 从 feat/8 提取，查询项目成员 |
| `wi comment-edit/comment-delete` | 从 feat/11 提取，需验证 API 可用性 |
| Sprint view 组合逻辑 | listSprints + searchWorkitems 聚合 |
| `getProjectMembers` API 函数 | 从 feat/8 提取 |
| `getWorkitemStatuses` API 函数 | 从 feat/9 提取 |
| 测试 | node:test + mock axios，覆盖 API 请求构建和命令输出 |
| npm 发布配置 | `@kongsiyu/yunxiao-cli`，bin: `yunxiao` |

---

## SKILL 设计

### 设计原则

**SKILL 需求驱动 CLI 设计。** SKILL 不是 CLI 的附属文档，而是 CLI 的需求规格。

### 实施方式

1. **先写 SKILL 草案** -- 定义 AI 需要的命令、输入输出格式、常见工作流
2. **按 SKILL 需求实现 CLI** -- SKILL 就是 CLI 的需求文档
3. **用 skill-creator 生成正式 SKILL** -- 基于实际实现微调

### SKILL 结构（参考 gh SKILL）

```markdown
# Yunxiao Skill

Use the `yunxiao` CLI to interact with Aliyun Yunxiao DevOps platform.

## When to Use
- 查看/创建/更新工作项
- 查看项目和 Sprint 进度
- 添加/编辑评论
- 查找项目成员（获取 userId）
- 查看可用状态值

## When NOT to Use
- 代码仓库操作（git clone/push/pull）-> 用 git
- 流水线触发（Pipeline API 不在 CLI 范围内）
- 文件附件上传（API 不支持）
- GitHub 操作 -> 用 gh

## Setup
- 环境变量配置
- yunxiao auth login

## Common Commands
- 按场景分组

## JSON Output
- --json 使用说明 + 输出结构示例

## Templates（常见工作流）
- Sprint Review
- 创建并分配 Bug
- 每日站会查看
- 查找成员并分配工作项

## Notes
- 已知限制和注意事项
```

---

## 技术架构

### 项目结构

```
src/
├── index.js            # 入口 + Commander.js 注册
├── api.js              # API 客户端（统一返回解包后的数据）
└── commands/
    ├── auth.js         # 认证（交互式 + 非交互式）
    ├── project.js      # 项目管理
    ├── workitem.js     # 工作项 CRUD + 评论
    ├── sprint.js       # Sprint（重写，用组合方案）
    ├── status.js       # 状态查询（从 feat/9 提取）
    └── user.js         # 用户/成员（从 feat/8 提取）
```

### 依赖

**运行时：**
- commander -- CLI 框架
- axios -- HTTP 客户端
- chalk -- 终端着色（非 --json 模式）

**开发：**
- node:test -- 测试（零依赖）

### 测试策略

两层测试：
1. **单元测试（api.js）：** Mock axios，验证每个 API 函数的请求 URL、参数、header 构建是否正确
2. **命令测试（commands/*.js）：** Mock api.js 函数返回值，验证命令输出格式（人类可读 + JSON）是否正确

不做 E2E/真实 API 测试（需要凭证，CI 不现实）。

### 发布

- npm 包名：`@kongsiyu/yunxiao-cli`
- 二进制名：`yunxiao`
- 安装：`npm install -g @kongsiyu/yunxiao-cli`
- 执行：`npx @kongsiyu/yunxiao-cli` 或 `yunxiao`
- CI：GitHub Actions，测试 + 发布

---

## 实施顺序

### Phase 0: SKILL 草案（先定需求）

1. 写 SKILL 草案，定义 AI 需要的命令和输出格式
2. 确定每个命令的 JSON 输出 schema
3. 确定常见工作流模板

### Phase 1: 核心重构（清理 + 修复）

1. 删除 query/attachment/storage 模块 + 清理 workitem.js 中的 import 和 --save-as
2. 删除 api.js 死代码（createClient, getConfig）
3. 删除 pnpm-lock.yaml
4. 修复命令注册（始终注册，执行时检查认证）
5. 修复 API 返回值解包（api.js 层统一处理）
6. 修复序列号解析（searchWorkitems 全 category + 匹配 serialNumber）
7. 修复 `wi list` 默认 category 为 "Req,Task,Bug"
8. `wi create/update --json` 改名为 `--fields`
9. Sprint 命令重写并注册
10. `auth login --token --org-id` 非交互模式

### Phase 2: 新功能

1. 全局 `--json` flag（输出完整 JSON 对象）
2. `status list` 命令（从 feat/9 提取 + 适配）
3. `user list/search` 命令（从 feat/8 提取 + 适配）
4. Sprint view 组合逻辑
5. `wi delete --force`
6. `--limit` 默认值调为 30
7. 评论编辑/删除（从 feat/11 提取，验证 API 后纳入）

### Phase 3: 质量 + 发布

1. 添加 node:test 测试框架
2. 编写 API 层单元测试
3. 编写命令层输出测试
4. 更新 package.json（scope 包名、版本号等）
5. 更新 CI（真实测试 + npm publish）
6. 用 skill-creator 生成正式 SKILL
7. 更新 README

---

## 已解决的评审问题

| # | 问题 | 解决方案 |
|---|------|---------|
| 1 | `--json` 命名冲突 | 输入参数改名 `--fields`，`--json` 专用于输出 |
| 2 | Sprint view 3x API | 用逗号分隔 category 单次调用，不生效再降级 |
| 3 | 删 storage.js 崩溃 | 同步清理 workitem.js 的 import 和 --save-as |
| 4 | 序列号解析无方案 | 统一 searchWorkitems 全 category + 匹配 serialNumber |
| 5 | auth login 非交互不完整 | 增加 `--org-id` 参数 |
| 6 | PAT 明文存储 | 短期文档标注风险，AI 主要用环境变量 |
| 7 | status list 无 API | feat/9 已有完整实现 |
| 8 | API 返回值可能有 bug | api.js 层统一解包 |
| 9 | 死代码 | 删除 createClient(), getConfig() |
| 10 | npm 包名被占 | 使用 `@kongsiyu/yunxiao-cli` |
| 11 | 测试策略空 | node:test + mock axios，两层测试 |
| 12 | JSON 输出格式未定义 | 完整 JSON 对象 dump，SKILL 中文档化 schema |
| 13 | Feature 分支未审计 | feat/8, feat/9 可用，feat/11 待验证 |
| 14 | SKILL 放最后 | 调整为 Phase 0 先写 SKILL 草案 |

## 待验证项（实施中确认）

1. `category: "Req,Task,Bug"` 逗号分隔是否在 searchWorkitems 中生效
2. 评论编辑/删除的 API 端点是否可用（feat/11）
3. API 返回值的实际结构（是否有 `{ data: [...] }` 包装）
