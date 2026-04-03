# Story 8.2：README 命令参考章节

Status: ready-for-dev

## Story

As a team member or AI agent,
I want a complete command reference in README,
So that I can look up any command's syntax and options without reading source code.

## Acceptance Criteria

1. **Given** README 命令参考章节
   **When** 查找任意命令
   **Then** 每个命令包含：语法、所有参数/选项说明、示例输出

2. **Given** README 命令参考章节
   **When** 阅读两步依赖工作流示例
   **Then** 包含 `wi types` → `wi create` 的两步依赖工作流示例
   **And** 包含 `status list` → `wi update` 的两步依赖工作流示例

## Tasks / Subtasks

- [ ] 在 README.md 中新增"命令参考"章节，覆盖所有命令 (AC: #1)
  - [ ] auth 命令组（login / status / logout）
  - [ ] whoami 命令
  - [ ] project 命令组（list / view）
  - [ ] workitem/wi 命令组（list / view / create / update / delete / comment / comments / types）
  - [ ] sprint 命令组（list / view）
  - [ ] pipeline 命令组（list / run / status）
  - [ ] status 命令组（list）
  - [ ] user 命令组（list / search）
  - [ ] 全局选项说明（--json）
- [ ] 新增两步依赖工作流示例小节 (AC: #2)
  - [ ] `wi types` → `wi create` 工作流
  - [ ] `status list` → `wi update` 工作流

## Dev Notes

### 任务范围

**纯文档任务**：只修改 `README.md`，不涉及任何源代码改动。

### 实现位置

- 唯一修改文件：`README.md`（仓库根目录）
- 在现有"使用"章节**替换**为完整"命令参考"章节（现有章节内容不完整，需重写）
- 保留 README 其他部分不变（安装、环境变量、API 说明、版本历史等）

### 当前 README 状态

当前 README 已有 `## 使用` 章节，但覆盖不完整（缺少大量命令、缺少选项表格、缺少示例输出）。本 Story 的目标是将其替换为结构化的完整命令参考。

### 完整命令清单（来自源码分析）

所有命令通过 `yunxiao <command>` 调用。二进制名称为 `yunxiao`（package.json bin 配置）。

#### 全局选项
- `--json`：所有命令均支持，将输出以纯 JSON 格式打印到 stdout（无 chalk 颜色）

#### auth 命令组（`src/commands/auth.js`）

| 命令 | 说明 |
|------|------|
| `auth login` | 交互式或非交互式认证，输入 PAT 和 orgId |
| `auth status` | 显示当前认证状态（是否已登录、orgId） |
| `auth logout` | 清除本地认证配置 |

`auth login` 选项：
- `--token <token>`：非交互模式，直接提供 PAT
- `--org-id <orgId>`：非交互模式，直接提供 orgId

#### whoami 命令（`src/index.js`）

显示当前认证用户信息（ID、Name、Email、Org、Created）。

#### project 命令组（`src/commands/project.js`）

`project list` 选项：
- `-n, --name <name>`：按名称过滤
- `--page <n>`：页码（默认 1）
- `--limit <n>`：每页数量（默认 20）

`project view <id>`：无额外选项，`<id>` 为项目 ID。

#### workitem/wi 命令组（`src/commands/workitem.js`）

别名：`workitem` = `wi`

`wi list` 选项：
- `-p, --project <id>`：项目 ID（默认 YUNXIAO_PROJECT_ID）
- `-c, --category <type>`：工作项类型 Req/Task/Bug（默认 Req,Task,Bug）
- `-s, --status <id>`：按状态 ID 过滤
- `-a, --assigned-to <userId>`：按负责人过滤（支持值 `me`）
- `-q, --query <keyword>`：按标题关键词搜索
- `--sprint <id>`：按 Sprint ID 过滤
- `--priority <level>`：按优先级过滤
- `--label <name>`：按标签过滤
- `--created-after <date>`：创建时间起始（YYYY-MM-DD）
- `--created-before <date>`：创建时间截止（YYYY-MM-DD）
- `--sort <field>`：排序字段 gmtCreate/gmtModified/subject（默认 gmtCreate）
- `--asc`：升序排列（默认降序）
- `--page <n>`：页码（默认 1）
- `--limit <n>`：每页数量（默认 20）

`wi view <id>` 选项：
- `-p, --project <id>`：项目 ID（序列号查找时必填）
- `<id>` 支持序列号格式（如 GJBL-1）或 UUID

`wi create` 选项：
- `-t, --title <title>`：标题（**必填**）
- `-p, --project <id>`：项目 ID
- `-c, --category <type>`：工作项类型 Req/Task/Bug（默认 Req）
- `-d, --description <desc>`：描述
- `--type <id>` / `--type-id <id>`：工作项类型 ID（未指定时自动获取默认类型）
- `--assigned-to <userId>`：负责人（默认当前用户）
- `--sprint <sprintId>`：分配到的 Sprint ID
- `--extra-json <json>`：额外字段 JSON 字符串（合并到请求体）

`wi update <id>` 选项：
- `-p, --project <id>`：项目 ID
- `-t, --title <title>`：新标题
- `-d, --description <desc>`：新描述
- `-s, --status <statusId>`：新状态 ID
- `--assigned-to <userId>`：新负责人 ID
- `--sprint <sprintId>`：新 Sprint ID
- `--extra-json <json>`：额外字段 JSON 字符串

`wi delete <id>` 选项：
- `-p, --project <id>`：项目 ID
- `-f, --force`：跳过确认提示

`wi comment <id> <content>` 选项：
- `-p, --project <id>`：项目 ID
- 注意：评论内容**不支持 emoji**

`wi comments <id>` 选项：
- `-p, --project <id>`：项目 ID
- `--page <n>`：页码（默认 1）
- `--limit <n>`：每页数量（默认 20）

`wi types` 选项：
- `-p, --project <id>`：项目 ID（**必填**）
- `-c, --category <type>`：工作项类型 Req/Task/Bug（默认 Req）

#### sprint 命令组（`src/commands/sprint.js`）

`sprint list` 选项：
- `-p, --project <id>`：项目 ID
- `-s, --status <status>`：过滤状态 TODO/DOING/ARCHIVED
- `--page <n>`：页码（默认 1）
- `--limit <n>`：每页数量（默认 20）

`sprint view <id>` 选项：
- `-p, --project <id>`：项目 ID

#### pipeline 命令组（`src/commands/pipeline.js`）

`pipeline list` 选项：
- `--limit <n>`：最大结果数（默认 20）

`pipeline run <pipelineId>` 选项：
- `--params <json>`：可选参数 JSON（如 `'{"branch":"main"}'`）

`pipeline status <runId>` 选项：
- `-p, --pipeline <id>`：流水线 ID（默认 YUNXIAO_PIPELINE_ID）

#### status 命令组（`src/commands/status.js`）

`status list` 选项：
- `-p, --project <id>`：项目 ID（**必填**）
- `--type-id <id>`：直接指定工作项类型 ID
- `-c, --category <type>`：类型快捷方式 Req/Task/Bug（与 --type-id 二选一，必填一个）

#### user 命令组（`src/commands/query.js`）

`user list` 选项：
- `-p, --project <id>`：项目 ID（**必填**）
- `--limit <n>`：每页数量（默认 20）

`user search <keyword>` 选项：
- `-p, --project <id>`：项目 ID（**必填**）

### 两步依赖工作流示例（AC #2）

**工作流一：wi types → wi create**

```bash
# 第 1 步：获取工作项类型 ID
yunxiao wi types --project <projectId> --category Req --json
# 输出：{"types":[{"id":"xxx","name":"需求","defaultType":true},...],"total":3}
# 记录目标类型的 id

# 第 2 步：使用类型 ID 创建工作项
yunxiao wi create --title "新功能需求" --type <typeId> --project <projectId>
```

**工作流二：status list → wi update**

```bash
# 第 1 步：获取状态 ID 列表
yunxiao status list --project <projectId> --category Req --json
# 输出：{"statuses":[{"id":"xxx","displayName":"开发中"},{"id":"yyy","displayName":"已完成"}],"total":5}
# 记录目标状态的 id

# 第 2 步：更新工作项状态
yunxiao wi update GJBL-42 --status <statusId> --project <projectId>
```

### README 章节结构建议

新"命令参考"章节应采用以下结构：

```
## 命令参考

### 全局选项

### 认证命令（auth）
#### auth login
#### auth status
#### auth logout

### whoami

### 项目命令（project）
#### project list
#### project view

### 工作项命令（workitem / wi）
#### wi list
#### wi view
#### wi create
#### wi update
#### wi delete
#### wi comment
#### wi comments
#### wi types

### Sprint 命令（sprint）
#### sprint list
#### sprint view

### 流水线命令（pipeline）
#### pipeline list
#### pipeline run
#### pipeline status

### 状态命令（status）
#### status list

### 用户命令（user）
#### user list
#### user search

### 两步依赖工作流
```

### 示例输出格式

每个命令应包含 Human-readable 输出示例（`--json` 示例是可选加分项），参考现有 README 中的 bash 代码块风格。

### 关键注意事项

1. **评论不支持 emoji**：在 `wi comment` 说明中明确标注
2. **wi create 必须提供 assignedTo**：文档中需要说明若未显式指定 `--assigned-to`，将使用当前登录用户（或 YUNXIAO_USER_ID）
3. **serial number 格式**：`wi view`、`wi update`、`wi delete`、`wi comment`、`wi comments` 的 `<id>` 参数均支持序列号格式（如 `GJBL-1`）
4. **wi update 至少需要一个字段**：文档中说明不提供任何更新字段会报错
5. **status list 二选一必填**：`--type-id` 和 `--category` 至少需要一个

### 不需要修改的内容

- 不修改任何 `.js` 源代码
- 不修改 `package.json`、测试文件、配置文件
- README 中的其他章节（安装、环境变量配置、API 说明、版本历史）保持不变

### 之前 Story 的学习

- Story 7-3 中使用了 Node.js test runner（非 Jest），测试风格为 `import { test, describe } from 'node:test'`
- 本 Story 是纯文档工作，与测试无关
- 项目使用 Conventional Commits 格式：`docs(readme): add complete command reference`

---

*Story created: 2026-04-02*
