# Yunxiao Skill（草案）

> **状态:** Phase 0 草案 — 这是 CLI 的需求规格，不是已实现功能的文档。
> **日期:** 2026-03-30
> **用途:** 定义 AI 需要的命令接口、JSON schema、常见工作流，指导 CLI 实现。

Use the `yunxiao` CLI to interact with Aliyun Yunxiao DevOps platform. Install: `npm install -g @kongsiyu/yunxiao-cli`

---

## When to Use

- 查看/创建/更新/删除工作项（需求、任务、Bug）
- 查看项目和 Sprint 进度
- 添加工作项评论
- 查找项目成员（获取 userId 用于分配任务）
- 查看可用工作流状态
- 以上任何操作需要 JSON 输出供后续推理时

## When NOT to Use

- 代码仓库操作（clone/push/pull）→ 用 `git`
- GitHub 相关操作 → 用 `gh`
- 流水线触发（Pipeline API 不在 CLI 范围内）
- 文件附件上传（API 不支持）

---

## Setup

### 环境变量（推荐，AI 场景必用）

```bash
YUNXIAO_PAT=<个人访问令牌>          # 必填
YUNXIAO_ORG_ID=<组织ID>             # 必填
YUNXIAO_PROJECT_ID=<默认项目ID>     # 强烈推荐，省略 --project 参数
```

### 登录（人类交互场景）

```bash
# 交互式（人类用，会提示输入）
yunxiao auth login

# 非交互式（AI 用，两个参数必须同时提供）
yunxiao auth login --token <PAT> --org-id <orgId>

# 查看认证状态
yunxiao auth status

# 清除认证
yunxiao auth logout
```

> **认证优先级:** 环境变量 > config 文件（`~/.yunxiao/config.json`）> 命令行参数
> **AI 场景:** 始终通过环境变量传入，`--token` 参数为备用

---

## 全局 Flag

```
--json          # 所有 list/view 命令输出完整 JSON 对象（AI 解析用）
--help          # 帮助
```

---

## 命令参考

### whoami — 当前用户

```bash
yunxiao whoami [--json]
```

**JSON 输出 schema:**
```json
{
  "id": "string",
  "name": "string",
  "email": "string"
}
```

---

### project — 项目管理

```bash
yunxiao project list [--name <关键词>] [--limit <n>] [--json]
yunxiao project view <projectId> [--json]
```

**project list `--json` schema:**
```json
[
  {
    "id": "string",
    "name": "string",
    "customCode": "string",
    "description": "string",
    "status": "string"
  }
]
```

---

### sprint — 迭代管理

```bash
yunxiao sprint list [--project <id>] [--status <status>] [--json]
  # status 可选值: started | unstarted | finished
  # 不传 --project 时用 YUNXIAO_PROJECT_ID

yunxiao sprint view <sprintId> [--project <id>] [--json]
  # 返回 Sprint 基本信息 + 工作项完成统计
```

**sprint list `--json` schema:**
```json
[
  {
    "id": "string",
    "name": "string",
    "status": "started|unstarted|finished",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD"
  }
]
```

**sprint view `--json` schema:**
```json
{
  "id": "string",
  "name": "string",
  "status": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "stats": {
    "total": 12,
    "done": 8,
    "inProgress": 3,
    "todo": 1,
    "byCategory": {
      "Req": { "total": 4, "done": 3 },
      "Task": { "total": 6, "done": 4 },
      "Bug": { "total": 2, "done": 1 }
    }
  }
}
```

---

### wi — 工作项（核心模块）

#### 列出

```bash
yunxiao wi list [选项] [--json]
  --project <id>          # 项目 ID（不传用 YUNXIAO_PROJECT_ID）
  --category <types>      # 类型过滤，默认 "Req,Task,Bug"，可单选
  --status <statusId>     # 状态 ID 过滤
  --assigned-to <userId|me>  # 负责人过滤，"me" 表示当前用户
  --sprint <sprintId>     # Sprint 过滤
  --priority <priority>   # 优先级过滤
  --label <label>         # 标签过滤
  --limit <n>             # 返回数量，默认 30
```

**`--json` schema:**
```json
[
  {
    "id": "string",
    "serialNumber": "GJBL-1",
    "title": "string",
    "category": "Req|Task|Bug",
    "status": { "id": "string", "name": "string" },
    "priority": "string",
    "assignedTo": { "id": "string", "name": "string" },
    "sprint": { "id": "string", "name": "string" },
    "gmtCreate": "ISO8601",
    "gmtModified": "ISO8601"
  }
]
```

#### 查看

```bash
yunxiao wi view <id|序列号> [--project <id>] [--json]
  # 支持工作项 ID 或序列号格式（如 GJBL-1）
  # 用序列号时需要 --project 或 YUNXIAO_PROJECT_ID
```

**`--json` schema:**
```json
{
  "id": "string",
  "serialNumber": "GJBL-1",
  "title": "string",
  "description": "string",
  "category": "Req|Task|Bug",
  "status": { "id": "string", "name": "string" },
  "priority": "string",
  "assignedTo": { "id": "string", "name": "string" },
  "creator": { "id": "string", "name": "string" },
  "sprint": { "id": "string", "name": "string" },
  "labels": ["string"],
  "gmtCreate": "ISO8601",
  "gmtModified": "ISO8601"
}
```

#### 创建

```bash
yunxiao wi create --title "标题" --type <typeId> [选项]
  --title "标题"          # 必填
  --type <typeId>         # 必填，工作项类型 ID（先用 wi types 获取）
  --assigned-to <userId>  # 负责人 ID（先用 user list/search 获取）
  --priority <priority>   # 优先级
  --sprint <sprintId>     # Sprint ID
  --description "描述"    # 描述
  --fields '{"key":"val"}'  # 自定义字段（JSON 字符串）
```

> **重要:** `--type` 接受的是 workitemTypeId，不是 "Req/Task/Bug" 字符串。
> 先执行 `yunxiao wi types --json` 获取 typeId，再创建工作项。

#### 更新

```bash
yunxiao wi update <id|序列号> [选项]
  --title "新标题"
  --status <statusId>     # 状态 ID（先用 status list 获取）
  --assigned-to <userId>
  --priority <priority>
  --sprint <sprintId>
  --description "描述"
  --fields '{"key":"val"}'
```

#### 删除

```bash
yunxiao wi delete <id|序列号> [--force]
  # 默认会提示确认，--force 跳过确认（AI 场景使用）
```

#### 评论

```bash
yunxiao wi comment <id|序列号> "评论内容"   # 添加评论
yunxiao wi comments <id|序列号> [--json]    # 列出所有评论
```

**wi comments `--json` schema:**
```json
[
  {
    "id": "string",
    "content": "string",
    "creator": { "id": "string", "name": "string" },
    "gmtCreate": "ISO8601"
  }
]
```

> **注意:** 不支持编辑和删除评论（API 无此能力）

#### 工作项类型

```bash
yunxiao wi types [--project <id>] [--json]
```

**`--json` schema:**
```json
[
  {
    "id": "string",
    "name": "需求|任务|缺陷",
    "category": "Req|Task|Bug"
  }
]
```

---

### status — 工作流状态

```bash
yunxiao status list --type-id <workitemTypeId> [--project <id>] [--json]
  # typeId 先用 wi types 获取
```

**`--json` schema:**
```json
[
  {
    "id": "string",
    "name": "string",
    "type": "INIT|PROCESSING|DONE"
  }
]
```

---

### user — 项目成员

```bash
yunxiao user list [--project <id>] [--query <name>] [--json]
yunxiao user search <name> [--project <id>] [--json]
```

**`--json` schema:**
```json
[
  {
    "id": "string",
    "name": "string",
    "email": "string"
  }
]
```

---

## 常见工作流

### 工作流 1: Sprint 进度汇报

```bash
# 1. 找到当前 Sprint
yunxiao sprint list --status started --json

# 2. 查看 Sprint 详情和统计
yunxiao sprint view <sprintId> --json

# 3. 查看未完成工作项
yunxiao wi list --sprint <sprintId> --json | 按状态筛选非 DONE 的
```

### 工作流 2: 创建并分配 Bug

```bash
# 1. 获取 Bug 类型 ID
yunxiao wi types --json
# 找到 category=Bug 的 id，如 "bug-type-id-123"

# 2. 找到负责人 userId
yunxiao user search "张三" --json
# 找到 id，如 "user-id-456"

# 3. 找到当前 Sprint ID
yunxiao sprint list --status started --json

# 4. 创建 Bug
yunxiao wi create \
  --title "登录页面空指针异常" \
  --type bug-type-id-123 \
  --assigned-to user-id-456 \
  --sprint sprint-id-789
```

### 工作流 3: 每日站会视图

```bash
# 查看当前 Sprint 下我负责的所有工作项
yunxiao wi list --sprint <sprintId> --assigned-to me --json
```

### 工作流 4: 更新工作项状态

```bash
# 1. 查看该类型可用状态
yunxiao wi types --json        # 获取 typeId
yunxiao status list --type-id <typeId> --json   # 获取 statusId

# 2. 更新状态
yunxiao wi update GJBL-42 --status <statusId>
```

### 工作流 5: 批量查看 Sprint 工作项

```bash
yunxiao wi list \
  --sprint <sprintId> \
  --category Bug \
  --limit 50 \
  --json
```

---

## 注意事项

- **评论不支持 emoji**（API 限制）
- **评论不支持编辑和删除**（PAT API 无此能力）
- **创建工作项需要 typeId**，不能直接传 "Req/Task/Bug"，需先 `wi types` 获取
- **状态更新需要 statusId**，不能传中文状态名，需先 `status list` 获取
- **分配工作项需要 userId**，不能传姓名，需先 `user search` 获取
- 序列号格式（如 GJBL-1）需要设置 `YUNXIAO_PROJECT_ID` 或传 `--project`
- `--json` 模式下不输出 chalk 着色，输出纯 JSON，便于 AI 解析

---

## 已知限制

| 功能 | 状态 | 原因 |
|------|------|------|
| 评论编辑/删除 | 不支持 | PAT API 无此端点 |
| 附件上传 | 不支持 | API 不支持 |
| Pipeline 触发 | 不支持 | 超出 CLI 范围 |
| 代码仓库操作 | 不支持 | 使用 git 或 gh |
