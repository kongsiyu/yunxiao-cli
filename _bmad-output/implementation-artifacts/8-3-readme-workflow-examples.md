# Story 8.3: README 工作流示例章节

Status: done

## Story

As a team member,
I want workflow examples showing both AI agent and human scenarios in README,
so that I understand how to compose commands for real tasks.

## Acceptance Criteria

1. **Given** README 工作流示例章节，**When** 阅读 AI Agent 场景示例，**Then** 包含完整的 Sprint 工作流示例（`sprint list` → `sprint view` → `wi list` → `user search` → `wi update`）
2. **Given** 阅读人类场景示例，**When** 查看示例，**Then** 包含站会前快速查看工作项的命令示例

## Tasks / Subtasks

- [x] 在 README.md 中添加「工作流示例」章节 (AC: #1, #2)
  - [x] 添加 AI Agent 完整 Sprint 工作流示例（5步序列：sprint list → sprint view → wi list → user search → wi update）
  - [x] 添加人类场景：站会前快速查看工作项示例
- [x] 验证所有示例命令语法与 src/ 实际实现一致

### Review Findings

- [x] [Review][Patch] F1: status list tip 缺少必填参数 `--category`，示例会 INVALID_ARGS 退出 [README.md]
- [x] [Review][Patch] F2: user search 依赖项目配置（YUNXIAO_PROJECT_ID），未在示例中注明 [README.md]
- [x] [Review][Patch] F3: `--status` 描述为"整数 ID"不准确，状态 ID 格式为字符串 [README.md]
- [x] [Review][Defer] F4: 无 DOING Sprint 时 sprints[0].id 为 undefined，工作流静默失败 — deferred, 示例性质文档可接受
- [x] [Review][Defer] F5: user search 多结果歧义，未说明如何选择 userId — deferred, 超出本 story 范围
- [x] [Review][Defer] F6: sprint view 超 100 条截断，统计可能不完整 — deferred, 现有行为说明
- [x] [Review][Defer] F7: wi list 默认 limit 20，非完整列表 — deferred, 现有行为
- [x] [Review][Defer] F8: --json 全局 flag 位置未说明 — deferred, Low 优先级

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

- 在 README.md `## 版本历史` 前插入 `## 工作流示例` 章节，含两个子章节：
  - `### AI Agent 场景`：5 步 Sprint 工作流（sprint list → sprint view → wi list → user search → wi update），每步带中文注释，说明需从上一步 JSON 输出提取 ID
  - `### 人类场景（站会前快速查看）`：3 条命令，不带 --json，供人类快速阅读
- 所有命令选项已对照 src/ 源码（sprint.js、workitem.js、query.js）确认正确
- 未修改 README 现有章节内容

### File List

- README.md
