# yunxiao Skill

使用 `yunxiao` CLI 与阿里云云效（Yunxiao DevOps）平台交互。安装：`npm install -g @kongsiyu/yunxiao-cli`

---

## When to Use

- 查看、创建、更新、删除工作项（需求、任务、Bug）
- 查看项目和 Sprint 进度
- 添加工作项评论
- 查找项目成员（获取 userId 用于分配任务）
- 查看可用工作流状态（获取 statusId 用于更新状态）
- 触发和查看 CI/CD 流水线
- 以上操作需要 JSON 输出供后续推理时

## When NOT to Use

- 代码仓库操作（clone/push/pull）→ 用 `git`
- GitHub 相关操作（PR、Issue）→ 用 `gh`
- 文件附件上传（API 不支持）

---

## Setup

### 环境变量（推荐，AI 场景必用）

```bash
YUNXIAO_PAT=<个人访问令牌>          # 必填
YUNXIAO_ORG_ID=<组织ID>             # 必填
YUNXIAO_PROJECT_ID=<默认项目ID>     # 强烈推荐，省略 --project 参数
```

> **配置优先级**：命令行参数 > `~/.yunxiao/config.json` > 环境变量
>
> **警告**：`config.json` 优先级高于环境变量。若本地存在旧 config 文件，`YUNXIAO_PAT` / `YUNXIAO_ORG_ID` 环境变量将被忽略。AI 场景如需使用环境变量，先确认无旧 config 文件，或用 `yunxiao auth login` 覆盖。

### 认证命令

```bash
# 非交互式（AI 场景）
yunxiao auth login --token <PAT> --org-id <orgId>

# 交互式（人类用）
yunxiao auth login

# 查看认证状态
yunxiao auth status

# 清除认证
yunxiao auth logout
```

---

## 全局 Flag

```
--json    所有 list/view 命令输出纯 JSON（AI 解析用）
--help    帮助
```

> `--json` 模式：stdout 输出纯 JSON，chalk 着色文字写入 stderr；错误格式：`{"error": "...", "code": "ERROR_CODE"}`

---

## 命令参考

### whoami — 当前用户

```bash
yunxiao whoami
```

---

### project — 项目管理

```bash
yunxiao project list [--name <关键词>] [--limit <n>] [--json]
yunxiao project view <projectId> [--json]
```

**project list `--json` schema:**
```json
{ "items": [{ "id": "string", "name": "string", "customCode": "string", "status": "string" }], "total": 1 }
```

---

### sprint — 迭代管理

```bash
yunxiao sprint list [--project <id>] [--status TODO|DOING|ARCHIVED] [--limit <n>] [--json]
yunxiao sprint view <sprintId> [--project <id>] [--json]
```

**sprint list `--json` schema:**
```json
{
  "sprints": [{ "id": "string", "name": "string", "status": "TODO|DOING|ARCHIVED", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" }],
  "total": 3
}
```

> **注意**：`total` 是当前页返回的条目数（非服务端总数）。如需翻页请用 `--page` 和 `--limit`。

**sprint view `--json` schema:**
```json
{
  "sprint": { "id": "string", "name": "string", "status": "string", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "note": "string（可选，Sprint 描述，可能较长）" },
  "stats": { "total": 12, "done": 8, "byCategory": { "需求": 4, "任务": 6, "缺陷": 2 } }
}
```

---

### wi — 工作项

#### wi list

```bash
yunxiao wi list [--project <id>] [--category Req,Task,Bug] [--status <statusId>]
               [--assigned-to <userId|me>] [--sprint <sprintId>] [--query <kw>]
               [--priority <level>] [--label <name>]
               [--created-after <YYYY-MM-DD>] [--created-before <YYYY-MM-DD>]
               [--sort gmtCreate|gmtModified|subject] [--asc]
               [--limit <n>] [--page <n>] [--json]
```

**`--json` schema:**
```json
{
  "items": [{
    "id": "string",
    "serialNumber": "GJBL-1",
    "subject": "工作项标题",
    "status": { "id": "string", "displayName": "设计中" },
    "assignedTo": { "id": "string", "name": "string" },
    "gmtCreate": "ISO8601"
  }],
  "total": 42
}
```

> **注意**：字段名为 `subject`（非 `title`），状态显示名为 `status.displayName`

#### wi view

```bash
yunxiao wi view <id|序列号> [--project <id>] [--json]
# 序列号格式如 GJBL-1，需要 --project 或 YUNXIAO_PROJECT_ID
```

**`--json` schema（原始 API 响应）：**
```json
{
  "id": "string",
  "serialNumber": "GJBL-1",
  "subject": "工作项标题",
  "status": { "id": "string", "displayName": "设计中" },
  "workitemType": { "name": "需求" },
  "assignedTo": { "id": "string", "name": "string" },
  "creator": { "id": "string", "name": "string" },
  "iteration": { "name": "Sprint 1" },
  "space": { "name": "项目名" },
  "description": "string",
  "gmtCreate": "ISO8601",
  "gmtModified": "ISO8601"
}
```

#### wi create

```bash
yunxiao wi create --title "标题" [--category Req|Task|Bug] [--type <typeId>]
                  [--assigned-to <userId>] [--sprint <sprintId>] [--description "描述"] [--json]
# --category 可自动解析 typeId；显式指定 --type <typeId> 更精确
```

**`--json` schema（原始 API 响应）：**
```json
{
  "id": "string",
  "serialNumber": "GJBL-42",
  "subject": "工作项标题"
}
```

#### wi update

```bash
yunxiao wi update <id|序列号> [--title "新标题"] [--status <statusId>]
                  [--assigned-to <userId>] [--sprint <sprintId>] [--description "描述"] [--json]
```

**`--json` schema：**
```json
{ "success": true, "id": "resolved-workitem-id" }
```

#### wi delete

```bash
yunxiao wi delete <id|序列号> [--force] [--json]
# --force 跳过确认提示（AI 场景必用）
# 注意：--json 模式下必须同时指定 --force，否则返回 INVALID_ARGS 错误
```

**`--json` schema：**
```json
{ "success": true, "id": "resolved-workitem-id" }
```

#### wi comment / comments

```bash
yunxiao wi comment <id|序列号> "评论内容" [--json]
yunxiao wi comments <id|序列号> [--json]
```

**wi comment `--json` schema：**
```json
{ "success": true, "id": "comment-id", "workitemId": "workitem-id" }
```

**wi comments `--json` schema:**
```json
{ "comments": [{ "id": "string", "content": "string", "creator": { "id": "string", "name": "string" }, "gmtCreate": "ISO8601" }], "total": 5 }
```

#### wi types

```bash
yunxiao wi types [--project <id>] [--category Req|Task|Bug] [--json]
```

**`--json` schema:**
```json
{ "types": [{ "id": "typeId-abc", "name": "需求", "category": "Req", "defaultType": true }], "total": 3 }
```

---

### status — 工作流状态

```bash
yunxiao status list --type-id <typeId> [--project <id>] [--json]
yunxiao status list --category Req|Task|Bug [--project <id>] [--json]
# 注意：--type-id 或 --category 必须提供其中一个，否则返回 INVALID_ARGS
# --category 是 --type-id 的便捷模式，自动查询 typeId 再查状态
```

**`--json` schema:**
```json
{ "statuses": [{ "id": "string", "name": "设计中", "type": "INIT|PROCESSING|DONE" }], "total": 6 }
```

---

### user — 项目成员

```bash
yunxiao user list [--project <id>] [--limit <n>] [--json]
yunxiao user search <keyword> [--project <id>] [--json]
```

**`--json` schema:**
```json
{ "members": [{ "userId": "string", "name": "string", "roleName": "string" }], "total": 10 }
```

> **注意**：字段名为 `userId`（非 `id`），无 `email` 字段，角色信息在 `roleName`

---

### pipeline — 流水线

```bash
yunxiao pipeline list [--limit <n>] [--json]
yunxiao pipeline run <pipelineId> [--params '{"branch":"main"}'] [--json]
yunxiao pipeline status <runId> [--pipeline <id>] [--json]
# pipeline status 需要 --pipeline 或 YUNXIAO_PIPELINE_ID 环境变量
```

**pipeline list `--json` schema:**
```json
{ "pipelines": [{ "pipelineId": "number", "pipelineName": "string" }], "total": 5 }
```

**pipeline run `--json` schema:**
```json
{ "pipelineRunId": "number", "pipelineId": "string" }
```

**pipeline status `--json` schema（原始 API 响应）：**
```json
{
  "pipelineRunId": "number",
  "pipelineId": "number",
  "status": "SUCCESS|RUNNING|FAIL|string",
  "triggerMode": "string",
  "startTime": "ISO8601",
  "endTime": "ISO8601"
}
```

---

## 常见工作流

### 1. Sprint 进度查看

```bash
# 找到进行中的 Sprint
yunxiao sprint list --status DOING --json

# 查看 Sprint 详情和统计
yunxiao sprint view <sprintId> --json

# 查看 Sprint 下的所有工作项
yunxiao wi list --sprint <sprintId> --json
```

### 2. 创建工作项（两步流程）

```bash
# Step 1：获取工作项类型 ID
yunxiao wi types --category Bug --json
# 从返回的 types[] 找到对应 id，如 "bug-type-id-123"

# Step 2：创建工作项
yunxiao wi create --title "登录页面空指针异常" --type bug-type-id-123
```

> 也可直接用 `--category Bug` 跳过 Step 1（自动解析 typeId）：
> `yunxiao wi create --title "登录页面空指针异常" --category Bug`

### 3. 指派工作流

```bash
# Step 1：找到成员 userId
yunxiao user search "张三" --json
# 从返回的 members[] 取 userId，如 "user-id-456"

# Step 2：更新工作项负责人
yunxiao wi update GJBL-42 --assigned-to user-id-456
```

### 4. 更新工作项状态（两步流程）

```bash
# Step 1：获取可用状态 ID
yunxiao status list --category Req --json
# 从返回的 statuses[] 取目标状态的 id

# Step 2：更新状态
yunxiao wi update GJBL-42 --status <statusId>
```

### 5. 认证失败处理

```bash
# 遇到 AUTH_FAILED（token 无效/过期）时
export YUNXIAO_PAT=<新的个人访问令牌>
# 或重新登录
yunxiao auth login --token <新PAT> --org-id <orgId>

# 遇到 AUTH_MISSING（未配置认证信息）时
yunxiao auth login --token <PAT> --org-id <orgId>
# 或同时设置环境变量（确保无旧 config.json 覆盖）
export YUNXIAO_PAT=<PAT>
export YUNXIAO_ORG_ID=<orgId>
```

---

## 错误处理

| ERROR_CODE | 原因 | 处理建议 |
|------------|------|----------|
| `AUTH_FAILED` | token 无效或已过期 | 更新 `YUNXIAO_PAT` 环境变量或重新 `auth login` |
| `AUTH_MISSING` | 未配置认证信息 | 执行 `yunxiao auth login` 或设置 `YUNXIAO_PAT`/`YUNXIAO_ORG_ID` |
| `NOT_FOUND` | 资源不存在 | 确认 ID/序列号正确；序列号需设置 `YUNXIAO_PROJECT_ID` |
| `INVALID_ARGS` | 参数错误或缺少必填项 | 检查命令参数；`--project` 或 `YUNXIAO_PROJECT_ID` 是否已设置 |
| `API_ERROR` | API 调用失败（网络/服务器） | 检查网络连接；确认 `YUNXIAO_ORG_ID` 正确；稍后重试 |

---

## 注意事项

- **评论不支持 emoji**（API 限制）
- **评论不可编辑或删除**（PAT API 无此端点）
- **状态更新需要 statusId**，不能传中文名，需先 `status list` 获取
- **分配工作项需要 userId**，不能传姓名，需先 `user search` 获取
- **序列号格式**（如 `GJBL-1`）需要设置 `YUNXIAO_PROJECT_ID` 或传 `--project`
- **`--assigned-to me`** 动态解析为当前用户 userId（需已认证）
