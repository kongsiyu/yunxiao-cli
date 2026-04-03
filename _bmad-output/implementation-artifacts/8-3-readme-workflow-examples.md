# Story 8.3: README 工作流示例章节

Status: ready-for-dev

## Story

As a team member,
I want workflow examples showing both AI agent and human scenarios in README,
so that I understand how to compose commands for real tasks.

## Acceptance Criteria

1. **Given** README 工作流示例章节，**When** 阅读 AI Agent 场景示例，**Then** 包含完整的 Sprint 工作流示例（`sprint list` → `sprint view` → `wi list` → `user search` → `wi update`）
2. **Given** 阅读人类场景示例，**When** 查看示例，**Then** 包含站会前快速查看工作项的命令示例

## Tasks / Subtasks

- [ ] 在 README.md 中添加「工作流示例」章节 (AC: #1, #2)
  - [ ] 添加 AI Agent 完整 Sprint 工作流示例（5步序列：sprint list → sprint view → wi list → user search → wi update）
  - [ ] 添加人类场景：站会前快速查看工作项示例
- [ ] 验证所有示例命令语法与 src/ 实际实现一致

## Dev Notes

### 任务范围

**仅修改一个文件**：`README.md`（位于仓库根目录）。

在现有 README 中**追加**「工作流示例」（`## 工作流示例`）章节。不要删除或重写 README 现有内容（安装/环境变量/使用/API 说明等）——那些是 Story 8-1 和 8-2 的范围。

### 当前 README 结构

```
# yunxiao CLI
## 安装
## 环境变量配置
## 使用  ← 有工作项和项目命令，但缺 sprint/pipeline/auth
## API 说明（已验证）
## 版本历史
## 开发计划   ← 新章节应加在此之前
```

**推荐插入位置**：在 `## 版本历史` 之前（或 `## 使用` 之后），以保持逻辑顺序：安装 → 配置 → 使用 → **工作流示例** → API 说明。

### 命令语法（来自 src/ 实现）

以下命令已实现，语法须与源码一致：

```bash
# sprint.js — sprint list / sprint view
yunxiao sprint list --status DOING --json
yunxiao sprint view <sprintId> --json

# workitem.js — wi list / wi update
yunxiao wi list --sprint <sprintId> --json
yunxiao wi update <id|serialNumber> --status <statusId> --json

# query.js — user search
yunxiao user search <keyword> --json

# status.js — status list
yunxiao status list --category <Req|Task|Bug> --json
```

**已确认的选项名**（避免写错）：
- `sprint list`: `--status`（值 TODO/DOING/ARCHIVED）、`--project`、`--limit`
- `sprint view <id>`: `--project`
- `wi list`: `--sprint <id>`、`--category`、`--limit`
- `wi update <id>`: `--status <statusId>`、`--assigned-to <userId>`、`--sprint <id>`
- `user search <keyword>`: 无必填选项（支持 `--json`）
- 全局：`--json`（所有命令支持）

### AI Agent 场景示例内容要求

完整 Sprint 工作流，展示依赖链：**获取 Sprint → 查看进度 → 列出工作项 → 查找负责人 → 更新状态**

```bash
# 步骤 1：找到当前 Sprint
yunxiao sprint list --status DOING --json

# 步骤 2：查看 Sprint 详情和工作项完成度
yunxiao sprint view <sprintId> --json

# 步骤 3：列出该 Sprint 下的工作项
yunxiao wi list --sprint <sprintId> --json

# 步骤 4：搜索负责人 userId（分配工作项前置步骤）
yunxiao user search "张三" --json

# 步骤 5：更新工作项状态和负责人
yunxiao wi update <workitemId> --status <statusId> --assigned-to <userId> --json
```

> 注意：示例中用 `<sprintId>`、`<workitemId>` 等占位符，说明需从上一步 JSON 输出中提取。

### 人类场景示例内容要求

**场景：站会前快速查看**——无需打开云效页面，30 秒内了解当前 Sprint 状态：

```bash
# 查看当前 Sprint 工作项完成情况
yunxiao sprint list --status DOING
yunxiao sprint view <sprintId>

# 查看分配给自己的未完成工作项
yunxiao wi list --sprint <sprintId>
```

### 文档语言与风格

- **语言**：中文（与现有 README 保持一致）
- **章节标题**：`## 工作流示例`
- **子章节**：`### AI Agent 场景` 和 `### 人类场景（站会前快速查看）`
- **代码块**：使用 ` ```bash ` 围栏，每个命令添加 `# 注释说明`
- **说明文字**：简洁，关注"为什么执行这步"

### 注意事项

- `wi update` 的 `--status` 参数接受 **statusId**（整数或字符串 ID），不是状态名称。示例中须注明需先通过 `status list` 获取 statusId。
- `--json` flag 对 AI Agent 场景是必要的（AI 需要解析结构化输出）；人类场景可省略。
- 不要修改 `## 使用` 章节中现有的命令示例（那是 8-2 的范围）。

### Project Structure Notes

- 修改文件：`README.md`（根目录）
- 无需修改 `src/` 任何代码文件
- 无需新增文件

### References

- Story 需求: `_bmad-output/planning-artifacts/epics.md` Epic 8, Story 8.3
- 命令实现: `src/commands/sprint.js`, `src/commands/workitem.js`, `src/commands/query.js`, `src/commands/status.js`
- 现有 README: `README.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
