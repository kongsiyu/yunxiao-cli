# yunxiao CLI

阿里云云效（Yunxiao）DevOps 平台命令行工具，风格参考 `gh`。

## 前提要求

- Node.js >= 18

## 安装

```bash
npm install -g @kongsiyu/yunxiao-cli
```

或者使用 npx 无需安装：

```bash
npx @kongsiyu/yunxiao-cli --help
```

### 本地开发安装

```bash
cd yunxiao-cli
npm install
npm link
```

安装后验证：

```bash
yunxiao --version
yunxiao --help
```

## 配置

### 方式一：环境变量（推荐用于 CI/生产环境）

在 shell 配置文件（如 `~/.bashrc`、`~/.zshrc`）中设置：

```bash
export YUNXIAO_PAT=your_personal_access_token
export YUNXIAO_ORG_ID=your_organization_id
export YUNXIAO_PROJECT_ID=your_default_project_id  # 可选，workitem/sprint 命令默认使用
```

Windows（PowerShell）：

```powershell
$env:YUNXIAO_PAT = "your_personal_access_token"
$env:YUNXIAO_ORG_ID = "your_organization_id"
$env:YUNXIAO_PROJECT_ID = "your_default_project_id"
```

| 变量名 | 必填 | 说明 |
|-------|------|------|
| `YUNXIAO_PAT` | ✅ | 云效个人访问令牌（Personal Access Token）|
| `YUNXIAO_ORG_ID` | ✅ | 组织 ID |
| `YUNXIAO_PROJECT_ID` | 可选 | 默认项目 ID（workitem/sprint 命令默认使用）|

> 如何获取 PAT：https://devops.aliyun.com/account/setting/tokens

> **注意**：如果本地存在 `~/.yunxiao/config.json`（通过 `yunxiao auth login` 创建），config 文件的优先级高于环境变量。在 CI 环境中若希望完全依赖环境变量，请先运行 `yunxiao auth logout` 删除本地 config 文件。

### 方式二：交互式登录（推荐用于本地开发）

```bash
yunxiao auth login
```

工具会引导完成：
1. 输入 PAT（隐藏输入）
2. 自动验证 PAT 有效性
3. 选择组织
4. 将配置保存到 `~/.yunxiao/config.json`（Windows：`%USERPROFILE%\.yunxiao\config.json`）

验证登录状态：

```bash
yunxiao auth status
yunxiao whoami
```

退出登录：

```bash
yunxiao auth logout
```

> **安全警告**：`~/.yunxiao/config.json` 以**明文**存储 PAT，文件权限限制为仅当前用户可读（`0600`）。在共享主机或 CI 环境中，建议使用环境变量方式，避免 token 意外泄露。

### 方式三：非交互式登录（适用于 CI 初始化）

```bash
yunxiao auth login --token <PAT> --org-id <orgId>
```

### 配置优先级

当多种配置方式同时存在时，优先级从高到低：

```
Config 文件（~/.yunxiao/config.json，通过 auth login 写入）
    ↓
环境变量（YUNXIAO_PAT、YUNXIAO_ORG_ID）
```

> `auth login` 命令支持 `--token`、`--org-id` 标志用于非交互式写入 config 文件。这些标志是 `auth login` 专属，不适用于其他命令。

## 命令参考

### 全局选项

| 选项 | 说明 |
|------|------|
| `--json` | 全局选项，可传给所有命令；只有本文明确列出 `--json` schema 的命令才承诺稳定 JSON contract，stdout 始终保持纯 JSON（无颜色），适合脚本和 AI Agent 处理 |

### v1.2.0 中文化边界

- v1.2.0 当前只为高频命令的人类可读输出提供中文支持：`auth`、`whoami`、`project list`、`wi list/view/update`、`sprint list/view`。
- 上述中文化仅作用于 human-readable 路径；`--json` 字段名、JSON schema、stdout 纯 JSON 约束与 `ERROR_CODE` 枚举保持英文，不翻译。
- 这不表示全 CLI 已完成中文化。`project view`、`wi create/delete/comment/comments/types`、`user list/search`、`status list`、`pipeline*`、`repo*`、`mr*` 仍属于后置命令，当前默认以既有英文 / API 原样输出为主。
- `whoami`、`auth status`、`auth logout` 当前没有稳定的 `--json` contract；自动化流程应优先使用具有明确 `--json` schema 的 list/view 命令。
- 并非所有命令都承诺稳定 `--json` contract；只有本文明确列出 `--json` schema 的命令才适合直接接入自动化链路。

---

### 认证命令（auth）

#### auth login

交互式或非交互式登录，将 PAT 和 orgId 保存到 `~/.yunxiao/config.json`。

```
yunxiao auth login [--token <pat>] [--org-id <orgId>]
```

| 选项 | 说明 |
|------|------|
| `--token <pat>` | 非交互模式：直接提供 PAT（Personal Access Token） |
| `--org-id <orgId>` | 非交互模式：直接提供组织 ID |

> **注意**：非交互模式需要**同时**提供 `--token` 和 `--org-id`，缺少任一选项将回退到交互式提示。

```bash
# 交互式登录（引导输入 PAT 并自动选择 org）
yunxiao auth login

# 非交互式登录（CI/脚本场景）
yunxiao auth login --token myPAT123 --org-id myOrgId
# ✓ Login successful!
# Config saved to ~/.yunxiao/config.json
```

#### auth status

显示当前认证状态。

```
yunxiao auth status
```

```bash
yunxiao auth status
# Authentication Status:
#
#   Status: Authenticated
#   User: 张三
#   User ID: user123456
#   Org: 研发组织
#   Org ID: myOrgId
#   PAT: *****1234
```

#### auth logout

清除本地认证配置。

```
yunxiao auth logout
```

```bash
yunxiao auth logout
# ✓ Logged out successfully.
```

---

### whoami

显示当前认证用户的详细信息。

```
yunxiao whoami
```

```bash
yunxiao whoami

# Current user:

#   ID:      user123456
#   Name:    张三
#   Email:   zhangsan@example.com
#   Org:     myOrgId
#   Created: 2024-01-01
```

> **注意**：`whoami` 当前只保证 human-readable 输出；没有稳定的 `--json` schema，不应把它作为自动化 JSON contract 使用。

---

### 项目命令（project）

#### project list

列出当前组织下的项目。

```
yunxiao project list [-n <name>] [--page <n>] [--limit <n>] [--json]
```

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `-n, --name <name>` | — | 按项目名称关键词过滤 |
| `--page <n>` | 1 | 页码 |
| `--limit <n>` | 20 | 每页数量 |

```bash
yunxiao project list
# Found 3 project(s):
#
# PROJ-A       我的项目 A                    <projectId-A>
#   Status: 进行中  Created: 2024-03-01

yunxiao project list --name "系统" --limit 10 --json
# {"projects":[{"projectId":"xxx","name":"系统项目"}],"total":1}
```

#### project view

查看项目详情。

```
yunxiao project view <projectId> [--json]
```

无额外选项；`<projectId>` 为项目 ID（必填位置参数）。

```bash
yunxiao project view proj123
# Project Details:
#
#   Name:     系统项目
#   ID:       proj123
#   Code:     SYS
#   Status:   进行中
#   Scope:    private
#   Created:  2024-03-01
```

> **注意**：`project view` 不在 v1.2.0 首批中文化范围内；当前 human-readable 输出仍以既有英文 label 为主。

---

### 工作项命令（workitem / wi）

`workitem` 和 `wi` 互为别名。

#### wi list

列出工作项，支持多维过滤。

```
yunxiao wi list [-p <projectId>] [-c <category>] [-s <statusId>] [-a <userId>]
                [-q <keyword>] [--sprint <id>] [--priority <level>] [--label <name>]
                [--created-after <date>] [--created-before <date>]
                [--sort <field>] [--asc] [--page <n>] [--limit <n>] [--json]
```

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `-p, --project <id>` | `YUNXIAO_PROJECT_ID` | 项目 ID |
| `-c, --category <type>` | `Req,Task,Bug` | 工作项类型，可选 `Req`、`Task`、`Bug` 或组合 |
| `-s, --status <id>` | — | 按状态 ID 过滤 |
| `-a, --assigned-to <userId>` | — | 按负责人 ID 过滤（支持值 `me`） |
| `-q, --query <keyword>` | — | 按标题关键词搜索 |
| `--sprint <id>` | — | 按 Sprint ID 过滤 |
| `--priority <level>` | — | 按优先级过滤 |
| `--label <name>` | — | 按标签过滤 |
| `--created-after <date>` | — | 创建时间起始（YYYY-MM-DD） |
| `--created-before <date>` | — | 创建时间截止（YYYY-MM-DD） |
| `--sort <field>` | `gmtCreate` | 排序字段：`gmtCreate`、`gmtModified`、`subject` |
| `--asc` | — | 升序排列（默认降序） |
| `--page <n>` | 1 | 页码 |
| `--limit <n>` | 20 | 每页数量 |

```bash
yunxiao wi list
# Found 5 work item(s):
#
# GJBL-10     修复登录超时问题
#   Status: 开发中  Assignee: 张三  Created: 2024-04-01

yunxiao wi list --category Bug --assigned-to me --limit 5
yunxiao wi list --sprint sprint123 --query "登录"
yunxiao wi list --json
# {"items":[...],"total":5}
```

#### wi view

查看工作项详情，支持序列号（如 `GJBL-1`）或 UUID。

```
yunxiao wi view <id> [-p <projectId>] [--json]
```

| 选项 | 说明 |
|------|------|
| `-p, --project <id>` | 项目 ID（使用序列号时必填） |

```bash
yunxiao wi view GJBL-1 --project proj123
# Work Item Details:
#
#   Serial:     GJBL-1
#   ID:         workitem-uuid-xxx
#   Subject:    实现用户登录功能
#   Status:     开发中
#   Type:       需求
#   Priority:   高
#   Sprint:     Sprint 3
#   Project:    我的项目
#   Assignee:   张三
#   Creator:    李四
#   Created:    2024-03-15
#   Updated:    2024-04-01

yunxiao wi view workitem-uuid-xxx --json
```

#### wi create

创建新工作项。

```
yunxiao wi create -t <title> [-p <projectId>] [-c <category>] [-d <desc>]
                  [--type <typeId>] [--assigned-to <userId>] [--sprint <sprintId>]
                  [--extra-json <json>] [--json]
```

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `-t, --title <title>` | **必填** | 工作项标题 |
| `-p, --project <id>` | `YUNXIAO_PROJECT_ID` | 项目 ID |
| `-c, --category <type>` | `Req` | 工作项类型：`Req`、`Task`、`Bug` |
| `-d, --description <desc>` | — | 描述 |
| `--type <id>` / `--type-id <id>` | 自动获取默认类型 | 工作项类型 ID |
| `--assigned-to <userId>` | 当前登录用户 | 负责人 ID（未指定时使用 `YUNXIAO_USER_ID` 或当前用户） |
| `--sprint <sprintId>` | — | 分配到的 Sprint ID |
| `--extra-json <json>` | — | 额外字段 JSON 字符串，合并到请求体 |

```bash
yunxiao wi create --title "修复登录超时" --category Bug
# Using type: 缺陷 (type-uuid-xxx)
#
# ✓ Work item created!
#
#   ID:      workitem-uuid-new
#   Serial:  GJBL-42
#   Subject: 修复登录超时

yunxiao wi create --title "新需求" --type type-uuid-xxx --assigned-to user456 --sprint sprint123
```

> **注意**：若未指定 `--assigned-to`，将自动使用当前登录用户 ID。

#### wi update

更新工作项的一个或多个字段（至少需要提供一个更新字段）。

```
yunxiao wi update <id> [-p <projectId>] [-t <title>] [-d <desc>] [-s <statusId>]
                       [--assigned-to <userId>] [--sprint <sprintId>]
                       [--extra-json <json>] [--json]
```

| 选项 | 说明 |
|------|------|
| `-p, --project <id>` | 项目 ID（使用序列号时需要） |
| `-t, --title <title>` | 新标题 |
| `-d, --description <desc>` | 新描述 |
| `-s, --status <statusId>` | 新状态 ID（通过 `status list` 获取） |
| `--assigned-to <userId>` | 新负责人 ID |
| `--sprint <sprintId>` | 新 Sprint ID |
| `--extra-json <json>` | 额外字段 JSON 字符串 |

```bash
yunxiao wi update GJBL-1 --title "新标题" --project proj123
# ✓ Work item GJBL-1 updated!

yunxiao wi update workitem-uuid-xxx --status status-uuid-done
yunxiao wi update GJBL-1 --assigned-to user789 --sprint sprint456 --project proj123
```

> **注意**：不提供任何更新字段时会报错，至少需要 `--title`、`--description`、`--status`、`--assigned-to`、`--sprint` 或 `--extra-json` 中的一个。

**`--json` schema（更新后重新获取的完整工作项对象）：**
```json
{
  "id": "string",
  "serialNumber": "GJBL-42",
  "subject": "工作项标题",
  "status": { "id": "string", "displayName": "开发中" },
  "assignedTo": { "id": "string", "name": "string" },
  "iteration": { "name": "Sprint 2" },
  "space": { "name": "项目名" },
  "gmtModified": "ISO8601"
}
```

#### wi delete

删除工作项（默认有确认提示）。

```
yunxiao wi delete <id> [-p <projectId>] [-f] [--json]
```

| 选项 | 说明 |
|------|------|
| `-p, --project <id>` | 项目 ID（使用序列号时需要） |
| `-f, --force` | 跳过确认提示（`--json` 模式下必须使用） |

```bash
yunxiao wi delete GJBL-99 --project proj123
# Are you sure you want to delete work item GJBL-99? [y/N] y
# ✓ Work item GJBL-99 deleted!

yunxiao wi delete workitem-uuid-xxx --force --json
# {"success":true,"id":"workitem-uuid-xxx"}
```

#### wi comment

为工作项添加评论。

```
yunxiao wi comment <id> <content> [-p <projectId>] [--json]
```

| 参数/选项 | 说明 |
|----------|------|
| `<id>` | 工作项 ID 或序列号（如 `GJBL-1`） |
| `<content>` | 评论文本内容（**必填**，不支持 emoji） |
| `-p, --project <id>` | 项目 ID（使用序列号时需要） |

```bash
yunxiao wi comment GJBL-1 "已完成代码审查，请测试" --project proj123
# ✓ Comment added! (id: comment-uuid-xxx)
```

> **注意**：评论内容不支持 emoji 表情符号。

#### wi comments

列出工作项的所有评论。

```
yunxiao wi comments <id> [-p <projectId>] [--page <n>] [--limit <n>] [--json]
```

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `-p, --project <id>` | — | 项目 ID（使用序列号时需要） |
| `--page <n>` | 1 | 页码 |
| `--limit <n>` | 20 | 每页数量 |

```bash
yunxiao wi comments GJBL-1 --project proj123
# 2 comment(s):
#
# 张三 2024-04-01
#   已完成代码审查，请测试
#
# 李四 2024-04-02
#   测试通过，合并上线
```

#### wi types

列出项目的工作项类型（创建工作项前查询类型 ID）。

```
yunxiao wi types -p <projectId> [-c <category>] [--json]
```

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `-p, --project <id>` | `YUNXIAO_PROJECT_ID` | 项目 ID（**必填**） |
| `-c, --category <type>` | `Req` | 工作项类型：`Req`、`Task`、`Bug` |

```bash
yunxiao wi types --project proj123 --category Req
# Work item types (Req):
#
#   type-uuid-001  需求 [default]  [Req]
#   type-uuid-002  技术需求  [Req]

yunxiao wi types --project proj123 --json
# {"types":[{"typeId":"type-uuid-001","name":"需求","category":"Req"}],"total":2}
```

---

### Sprint 命令（sprint）

#### sprint list

列出项目的 Sprint（迭代）。

```
yunxiao sprint list [-p <projectId>] [-s <status>] [--page <n>] [--limit <n>] [--json]
```

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `-p, --project <id>` | `YUNXIAO_PROJECT_ID` | 项目 ID |
| `-s, --status <status>` | — | 过滤状态：`TODO`、`DOING`、`ARCHIVED` |
| `--page <n>` | 1 | 页码 |
| `--limit <n>` | 20 | 每页数量 |

```bash
yunxiao sprint list --project proj123
# Found 3 sprint(s):
#
# sprint-001  Sprint 1                       ARCHIVED
#   Period: 2024-01-01 ~ 2024-01-14
# sprint-002  Sprint 2                       DOING
#   Period: 2024-04-01 ~ 2024-04-14

yunxiao sprint list --status DOING --json
# {"sprints":[{"id":"sprint-002","name":"Sprint 2","status":"DOING",...}],"total":1}
```

#### sprint view

查看 Sprint 详情，包含工作项完成统计。

```
yunxiao sprint view <sprintId> [-p <projectId>] [--json]
```

| 选项 | 说明 |
|------|------|
| `-p, --project <id>` | 项目 ID（使用 `YUNXIAO_PROJECT_ID` 作为默认值） |

> **注意**：工作项统计最多显示 100 条（API 限制），超出部分不计入统计。

```bash
yunxiao sprint view sprint-002 --project proj123
# Sprint Details:
#
#   ID:      sprint-002
#   Name:    Sprint 2
#   Status:  DOING
#   Period:  2024-04-01 ~ 2024-04-14
#   Goal:    完成用户模块
#
# Workitem Statistics:
#
#   Total:     12
#   Done:      8 / 12
#   By Type:
#     需求         5
#     任务         4
#     缺陷         3
```

---

### 流水线命令（pipeline）

#### pipeline list

列出当前组织的流水线。

```
yunxiao pipeline list [--limit <n>] [--json]
```

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `--limit <n>` | 20 | 最大结果数 |

```bash
yunxiao pipeline list
# Found 2 pipeline(s):
#
# 12345        主干构建流水线
# 12346        发布流水线
```

#### pipeline run

触发一次流水线运行。

```
yunxiao pipeline run <pipelineId> [--params <json>] [--json]
```

| 选项 | 说明 |
|------|------|
| `--params <json>` | 可选运行参数 JSON（如 `'{"branch":"main"}'`） |

```bash
yunxiao pipeline run 12345
# Pipeline triggered successfully!
#
#   Pipeline ID: 12345
#   Run ID:      98765

yunxiao pipeline run 12345 --params '{"branch":"release/1.0"}'
```

#### pipeline status

查看流水线运行状态。

```
yunxiao pipeline status <runId> [-p <pipelineId>] [--json]
```

| 选项 | 说明 |
|------|------|
| `-p, --pipeline <id>` | 流水线 ID（`--pipeline`，非 `--project`；默认 `YUNXIAO_PIPELINE_ID`） |

```bash
yunxiao pipeline status 98765 --pipeline 12345
# Pipeline Run Status:
#
#   Run ID:       98765
#   Pipeline ID:  12345
#   Status:       SUCCESS
#   Trigger:      MANUAL
#   Started:      2024-04-02 10:00:00
#   Ended:        2024-04-02 10:05:30
```

---

### 状态命令（status）

#### status list

列出工作项类型的所有流程状态（更新工作项状态前查询状态 ID）。

```
yunxiao status list -p <projectId> (--type-id <id> | -c <category>) [--json]
```

| 选项 | 说明 |
|------|------|
| `-p, --project <id>` | 项目 ID（**必填**） |
| `--type-id <id>` | 直接指定工作项类型 ID |
| `-c, --category <type>` | 类型快捷方式：`Req`、`Task`、`Bug` |

> **注意**：`--type-id` 和 `--category` 二选一，**必须提供其中一个**。

```bash
yunxiao status list --project proj123 --category Req
# Found 5 status(es):
#
#   status-uuid-001  待处理 [default]
#   status-uuid-002  设计中
#   status-uuid-003  开发中
#   status-uuid-004  测试中
#   status-uuid-005  已完成

yunxiao status list --project proj123 --type-id type-uuid-001 --json
# {"statuses":[{"id":"status-uuid-001","displayName":"待处理","name":"待处理","type":"INIT"}],"total":5}
```

> **注意**：`status list` 不在 v1.2.0 首批中文化范围内；其 `--json` 字段名继续保持英文，human-readable 输出也不承诺中文化。

---

### 用户命令（user）

#### user list

列出项目成员。

```
yunxiao user list -p <projectId> [--limit <n>] [--json]
```

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `-p, --project <id>` | `YUNXIAO_PROJECT_ID` | 项目 ID（**必填**） |
| `--limit <n>` | 20 | 每页数量 |

```bash
yunxiao user list --project proj123
# Found 4 member(s):
#
#   user-uuid-001   张三   开发者
#   user-uuid-002   李四   测试人员
```

#### user search

按关键词搜索项目成员。

```
yunxiao user search <keyword> -p <projectId> [--json]
```

| 选项 | 说明 |
|------|------|
| `-p, --project <id>` | 项目 ID（**必填**） |

```bash
yunxiao user search 张 --project proj123
# Found 2 member(s) matching "张":
#
#   user-uuid-001   张三   开发者
#   user-uuid-005   张小明 产品经理

yunxiao user search 张 --project proj123 --json
# {"members":[{"userId":"user-uuid-001","name":"张三","roleName":"开发者"}],"total":2}
```

---

### 两步依赖工作流

某些操作需要先查询 ID，再执行操作。

#### 工作流一：wi types → wi create

创建工作项时需要指定类型 ID，先用 `wi types` 获取。

```bash
# 第 1 步：获取工作项类型 ID
yunxiao wi types --project proj123 --category Req --json
# {"types":[{"typeId":"type-uuid-001","name":"需求","category":"Req"},{"typeId":"type-uuid-002","name":"技术需求","category":"Req"}],"total":2}

# 记录目标 typeId（如 type-uuid-002）

# 第 2 步：创建工作项并指定类型（typeId 作为 --type 参数）
yunxiao wi create --title "重构认证模块" --type type-uuid-002 --project proj123
# Using type: 技术需求 (type-uuid-002)
# ✓ Work item created!
#   ID:      workitem-uuid-new
#   Serial:  GJBL-43
```

#### 工作流二：status list → wi update

更新工作项状态时需要状态 ID，先用 `status list` 获取。

```bash
# 第 1 步：获取状态 ID 列表
yunxiao status list --project proj123 --category Req --json
# {"statuses":[{"id":"status-uuid-003","displayName":"开发中"},{"id":"status-uuid-005","displayName":"已完成"}],"total":5}

# 记录目标状态 id（如 status-uuid-005）

# 第 2 步：更新工作项状态（以工作流一中创建的 GJBL-43 为例）
yunxiao wi update GJBL-43 --status status-uuid-005 --project proj123
# ✓ Work item GJBL-43 updated!
```

## 工作流示例

### AI Agent 场景

AI 通过 JSON 输出提取字段，串联多步操作完成完整 Sprint 工作流。每步从上一步 JSON 输出中提取所需 ID。

```bash
# 步骤 1：找到当前进行中的 Sprint
yunxiao sprint list --status DOING --json

# 步骤 2：查看 Sprint 详情和工作项完成度（sprintId 取自步骤 1 的 sprints[0].id）
yunxiao sprint view <sprintId> --json

# 步骤 3：列出该 Sprint 下的所有工作项
yunxiao wi list --sprint <sprintId> --json

# 步骤 4：搜索负责人 userId（需配置 YUNXIAO_PROJECT_ID 或使用 --project）
yunxiao user search "张三" --json

# 步骤 5：更新工作项状态和负责人
# --status 接受状态 ID（字符串），需先通过 `yunxiao status list` 获取
yunxiao wi update <workitemId> --status <statusId> --assigned-to <userId> --json
```

> 提示：`--status` 参数接受状态 ID（非状态名称）。可先运行 `yunxiao status list --category <Req|Task|Bug> --json` 获取各状态对应的 ID。

### 人类场景（站会前快速查看）

无需打开云效页面，30 秒内了解当前 Sprint 进度：

```bash
# 查看当前进行中的 Sprint 列表
yunxiao sprint list --status DOING

# 查看指定 Sprint 的工作项完成情况（total / done / by type）
yunxiao sprint view <sprintId>

# 列出该 Sprint 下的工作项（快速扫描）
yunxiao wi list --sprint <sprintId>
```

## 版本历史

- **v0.1.1** - 认证命令：auth login/status/logout
- **v0.1.0** - 基础功能：项目管理 + 工作项 CRUD + 评论

## 已知限制

- v1.2.0 只完成高频命令的人类可读中文化，不代表 `project view`、`wi create/delete/comment/comments/types`、`user list/search`、`status list`、`pipeline*`、`repo*`、`mr*` 已完成中文输出。
- `--json` 模式下 stdout 只输出纯 JSON；本地化提示和错误说明应写入 stderr。`ERROR_CODE`、JSON key 和 schema 保持英文，不翻译。
- `whoami`、`auth status`、`auth logout` 没有稳定的 `--json` contract；自动化流程应优先使用文档中明确列出 schema 的 `project list`、`wi list/view/update`、`sprint list/view` 等命令。
- `sprint view` 工作项统计最多显示 100 条；超出部分不会进入 `stats` 统计。

---

> 查看所有 Issue：https://github.com/kongsiyu/yunxiao-cli/issues
